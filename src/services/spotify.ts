import type { SpotifyTrack, SpotifyAuthResponse, AudioFeatures } from '../types/spotify'

// Spotify API configuration
export const SPOTIFY_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your_spotify_client_id',
  REDIRECT_URI: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'https://chefkj.github.io/by-defeat/callback',
  SCOPES: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-recently-played'
  ].join(' ')
}

// Helper functions for PKCE
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(new Uint8Array(buffer))
}

function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Generate auth URL with PKCE
export const generateAuthUrl = async (): Promise<string> => {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  // Generate a unique state parameter to prevent auth code reuse
  const state = Math.random().toString(36).substring(2, 15)
  
  // Store code verifier with a timestamp and extra logging
  console.log('Storing code verifier:', codeVerifier.substring(0, 10) + '...')
  console.log('Auth state:', state)
  
  // Store in both localStorage AND sessionStorage as backup
  localStorage.setItem('spotify_code_verifier', codeVerifier)
  localStorage.setItem('spotify_code_verifier_timestamp', Date.now().toString())
  localStorage.setItem('spotify_auth_state', state)
  sessionStorage.setItem('spotify_code_verifier', codeVerifier)
  sessionStorage.setItem('spotify_code_verifier_timestamp', Date.now().toString())
  sessionStorage.setItem('spotify_auth_state', state)
  
  // Verify it was stored
  const stored = localStorage.getItem('spotify_code_verifier')
  const sessionStored = sessionStorage.getItem('spotify_code_verifier')
  console.log('Stored in localStorage:', !!stored)
  console.log('Stored in sessionStorage:', !!sessionStored)
  
  if (!stored && !sessionStored) {
    throw new Error('Failed to store code verifier in any storage')
  }
  
  return `https://accounts.spotify.com/authorize?` +
    `client_id=${SPOTIFY_CONFIG.CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(SPOTIFY_CONFIG.SCOPES)}&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256&` +
    `state=${state}`
}

// Module-level flag to prevent concurrent token exchanges
let isExchangingCode = false
let exchangePromise: Promise<SpotifyAuthResponse> | null = null

// Exchange auth code for access token
export const exchangeCodeForToken = async (code: string): Promise<SpotifyAuthResponse> => {
  // If already exchanging this code, return the existing promise
  if (isExchangingCode && exchangePromise) {
    console.log('Token exchange already in progress, returning existing promise...')
    return exchangePromise
  }
  
  // Set flag and create promise
  isExchangingCode = true
  exchangePromise = (async () => {
    try {
      // Try to get from localStorage first, then sessionStorage as fallback
      let codeVerifier = localStorage.getItem('spotify_code_verifier')
      let timestamp = localStorage.getItem('spotify_code_verifier_timestamp')
      
      if (!codeVerifier) {
        console.log('Code verifier not in localStorage, trying sessionStorage...')
        codeVerifier = sessionStorage.getItem('spotify_code_verifier')
        timestamp = sessionStorage.getItem('spotify_code_verifier_timestamp')
      }
      
      console.log('Code verifier check:', {
        exists: !!codeVerifier,
        source: codeVerifier ? (localStorage.getItem('spotify_code_verifier') ? 'localStorage' : 'sessionStorage') : 'none',
        timestamp: timestamp ? new Date(parseInt(timestamp)).toISOString() : 'none',
        age: timestamp ? Date.now() - parseInt(timestamp) : 'unknown',
        allLocalStorageKeys: Object.keys(localStorage),
        allSessionStorageKeys: Object.keys(sessionStorage)
      })
      
      if (!codeVerifier) {
        // List all storage keys for debugging
        console.error('localStorage keys:', Object.keys(localStorage))
        console.error('sessionStorage keys:', Object.keys(sessionStorage))
        console.error('Code verifier missing! User needs to restart auth flow.')
        throw new Error('Code verifier not found - please restart the authentication process')
      }

      // Check if code verifier is too old (older than 10 minutes)
      if (timestamp && Date.now() - parseInt(timestamp) > 600000) {
        localStorage.removeItem('spotify_code_verifier')
        localStorage.removeItem('spotify_code_verifier_timestamp')
        throw new Error('Code verifier expired - please restart the authentication process')
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
          client_id: SPOTIFY_CONFIG.CLIENT_ID,
          code_verifier: codeVerifier,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Token exchange failed:', errorData)
        // DON'T remove code verifier on failure - user might retry
        throw new Error(`Failed to exchange code for token: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Only proceed if we actually got tokens
      if (!data.access_token || !data.refresh_token) {
        console.error('Invalid token response:', data)
        throw new Error('No tokens received from Spotify')
      }
      
      console.log('Token exchange successful, storing tokens...')
      
      // Store tokens
      localStorage.setItem('spotify_access_token', data.access_token)
      localStorage.setItem('spotify_refresh_token', data.refresh_token)
      localStorage.setItem('spotify_token_expires_at', (Date.now() + data.expires_in * 1000).toString())
      
      console.log('Tokens stored successfully, cleaning up code verifier...')
      
      // ONLY remove code verifier after successful token storage
      localStorage.removeItem('spotify_code_verifier')
      localStorage.removeItem('spotify_code_verifier_timestamp')
      localStorage.removeItem('spotify_auth_state')
      sessionStorage.removeItem('spotify_code_verifier')
      sessionStorage.removeItem('spotify_code_verifier_timestamp')
      sessionStorage.removeItem('spotify_auth_state')
      
      console.log('Code verifier cleanup complete')
      
      return data
    } finally {
      // Reset flag after completion (success or failure)
      isExchangingCode = false
      exchangePromise = null
    }
  })()
  
  return exchangePromise
}

// Get current access token
export const getAccessToken = (): string | null => {
  const token = localStorage.getItem('spotify_access_token')
  const expiresAt = localStorage.getItem('spotify_token_expires_at')
  
  if (!token || !expiresAt) {
    return null
  }
  
  if (Date.now() > parseInt(expiresAt)) {
    // Token expired, should refresh
    return null
  }
  
  return token
}

// Refresh access token
export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('spotify_refresh_token')
  
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SPOTIFY_CONFIG.CLIENT_ID,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  const data = await response.json()
  
  // Store new tokens
  localStorage.setItem('spotify_access_token', data.access_token)
  localStorage.setItem('spotify_token_expires_at', (Date.now() + data.expires_in * 1000).toString())
  
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token)
  }
  
  return data.access_token
}

// Make authenticated API calls
export const spotifyApi = async (endpoint: string, options: RequestInit = {}) => {
  let token = getAccessToken()
  
  if (!token) {
    console.warn('No access token found, attempting refresh...')
    try {
      token = await refreshAccessToken()
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw new Error('Authentication required');
    }
  }
  
  console.log(`Making API request to: ${endpoint}`)
  console.log(`Token available: ${token ? 'YES (first 10 chars: ' + token.substring(0, 10) + '...)' : 'NO'}`)
  console.log(`Token from storage: ${localStorage.getItem('spotify_access_token') ? 'EXISTS' : 'MISSING'}`)
  
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  console.log(`API response status for ${endpoint}: ${response.status}`)
  
  if (response.status === 401) {
    // Token expired, try to refresh
    console.warn('Got 401, refreshing token...')
    try {
      token = await refreshAccessToken()
      const retryResponse = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      
      if (!retryResponse.ok) {
        const errorText = await retryResponse.text()
        console.error(`API request failed after token refresh: ${retryResponse.status}`, errorText)
        throw new Error('API request failed after token refresh')
      }
      
      return retryResponse.json()
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw new Error('Authentication required')
    }
  }
  
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({}))
    console.error('403 Forbidden - Insufficient permissions:', errorData)
    throw new Error('Insufficient permissions. Please re-authenticate with the app.')
  }
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API request failed: ${response.status}`, errorText)
    throw new Error(`API request failed: ${response.status}`)
  }
  
  return response.json()
}

// Get user profile
export const getUserProfile = async () => {
  return spotifyApi('/me')
}

// Get user's saved tracks
export const getUserTracks = async (limit: number = 20) => {
  return spotifyApi(`/me/tracks?limit=${limit}`)
}

// Get current playback state
export const getCurrentPlayback = async () => {
  return spotifyApi('/me/player')
}

// Start/Resume playback
export const startPlayback = async (
  deviceId?: string, 
  uris?: string[], 
  contextUri?: string,
  offset?: { position?: number; uri?: string }
) => {
  const params = new URLSearchParams()
  if (deviceId) {
    params.append('device_id', deviceId)
  }

  const body: Record<string, unknown> = {}
  
  // Use context_uri for playing from album/playlist/artist, or uris for specific tracks
  if (contextUri) {
    body.context_uri = contextUri
    if (offset) {
      body.offset = offset
    }
  } else if (uris) {
    body.uris = uris
  }
  
  const url = `/me/player/play${params.toString() ? '?' + params.toString() : ''}`
  
  return spotifyApi(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

// Pause playback
export const pausePlayback = async () => {
  return spotifyApi('/me/player/pause', {
    method: 'PUT',
  })
}

// Skip to next track
export const skipToNext = async () => {
  return spotifyApi('/me/player/next', {
    method: 'POST',
  })
}

// Skip to previous track
export const skipToPrevious = async () => {
  return spotifyApi('/me/player/previous', {
    method: 'POST',
  })
}

// Spotify API types for responses
interface SpotifyTrackResponse {
  id: string
  name: string
  artists: Array<{ name: string; id: string }>  // Add id here
  album: {
    name: string
    id: string  // Add id here
    images: { url: string }[]
  }
  duration_ms: number
  preview_url: string | null
  external_urls: { spotify: string }
  popularity: number
  uri: string
  explicit: boolean
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrackResponse[]
  }
}

interface SpotifyUserProfile {
  id: string
  display_name: string
  email: string
  images: { url: string }[]
}
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export class SpotifyService {
  private accessToken: string | null = null

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getTrack(trackId: string): Promise<SpotifyTrack> {
    const track = await this.makeRequest<SpotifyTrackResponse>(`/tracks/${trackId}`)
    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      artists: track.artists.map(artist => ({ name: artist.name, id: artist.id || '' })), // Fix this line
      album: track.album?.name,
      albumObject: {  // Fix this object
        name: track.album?.name || 'Unknown Album',
        images: track.album?.images || [],
        id: track.album?.id || ''
      },
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      image: track.album?.images?.[0]?.url,
      coverArt: track.album?.images?.[0]?.url,
      popularity: track.popularity || 0,
      uri: track.uri || `spotify:track:${track.id}`,
      explicit: track.explicit || false
    }
  }

  async getAudioFeatures(trackId: string): Promise<AudioFeatures> {
    return this.makeRequest<AudioFeatures>(`/audio-features/${trackId}`)
  }

  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    const response = await this.makeRequest<SpotifySearchResponse>(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`)
    return response.tracks.items.map((track: SpotifyTrackResponse) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      artists: track.artists.map(artist => ({ name: artist.name, id: artist.id || '' })), // Fix this line
      album: track.album?.name,
      albumObject: {  // Fix this object
        name: track.album?.name || 'Unknown Album',
        images: track.album?.images || [],
        id: track.album?.id || ''
      },
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      image: track.album?.images?.[0]?.url,
      coverArt: track.album?.images?.[0]?.url,
      popularity: track.popularity || 0,
      uri: track.uri || `spotify:track:${track.id}`,
      explicit: track.explicit || false
    }))
  }

  async getCurrentUserProfile(): Promise<SpotifyUserProfile> {
    return this.makeRequest<SpotifyUserProfile>('/me')
  }
}

// Default tracks for demonstration
export const DEFAULT_TRACKS: SpotifyTrack[] = [
  {
    id: '1',
    name: 'Sample Track 1',
    artist: 'By Defeat',
    artists: [{ name: 'By Defeat', id: 'by-defeat-1' }],  // Add this line
    album: 'Demo Album',
    albumObject: {  // Add this object
      name: 'Demo Album',
      images: [{ url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23333" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20" font-family="sans-serif"%3ENo Album Art%3C/text%3E%3C/svg%3E' }],
      id: 'demo-album-1'
    },
    duration_ms: 180000,
    preview_url: null,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23333" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20" font-family="sans-serif"%3ENo Album Art%3C/text%3E%3C/svg%3E',
    popularity: 75,
    uri: 'spotify:track:sample1'
  },
  {
    id: '2',
    name: 'Sample Track 2', 
    artist: 'By Defeat',
    artists: [{ name: 'By Defeat', id: 'by-defeat-1' }],  // Add this line
    album: 'Demo Album',
    albumObject: {  // Add this object
      name: 'Demo Album',
      images: [{ url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23333" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20" font-family="sans-serif"%3ENo Album Art%3C/text%3E%3C/svg%3E' }],
      id: 'demo-album-1'
    },
    duration_ms: 210000,
    preview_url: null,
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23333" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20" font-family="sans-serif"%3ENo Album Art%3C/text%3E%3C/svg%3E',
    popularity: 80,
    uri: 'spotify:track:sample2'
  }
]

// Add new functions to get artist tracks
export const getArtistTracks = async (artistName: string, limit: number = 20): Promise<SpotifyTrack[]> => {
  try {
    const artistResponse = await spotifyApi(`/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`)
    
    if (!artistResponse.artists.items.length) {
      throw new Error(`Artist "${artistName}" not found`)
    }
    
    const artist = artistResponse.artists.items[0]
    
    // Get the artist's top tracks (these HAVE popularity)
    const topTracksResponse = await spotifyApi(`/artists/${artist.id}/top-tracks?market=US`)
    
    // Get the artist's albums
    const albumsResponse = await spotifyApi(`/artists/${artist.id}/albums?include_groups=album,single&market=US&limit=10`)
    
    let allTracks: SpotifyTrackResponse[] = [...topTracksResponse.tracks]
    
    // Get tracks from albums (these DON'T have popularity)
    for (const album of albumsResponse.items) {
      const albumTracksResponse = await spotifyApi(`/albums/${album.id}/tracks?market=US`)
      
      // For album tracks, we need to fetch individual track details to get popularity
      const albumTracksWithPopularity = await Promise.all(
        albumTracksResponse.items.map(async (track: SpotifyTrackResponse) => {
          try {
            const fullTrackResponse = await spotifyApi(`/tracks/${track.id}`)
            return {
              ...track,
              album: album,
              popularity: fullTrackResponse.popularity || 0
            }
          } catch {
            // If individual track fetch fails, use track without popularity
            return {
              ...track,
              album: album,
              popularity: 0
            }
          }
        })
      )
      
      allTracks = [...allTracks, ...albumTracksWithPopularity]
    }
    
    // Remove duplicates and sort by popularity
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id)
    )
    
    const sortedTracks = uniqueTracks
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit)
    
    return sortedTracks.map((track: SpotifyTrackResponse) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || artistName,
      artists: track.artists,
      album: track.album?.name,
      albumObject: track.album,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      image: track.album?.images?.[0]?.url,
      popularity: track.popularity || 0, // Default to 0 if not available
      uri: track.uri,
      external_urls: track.external_urls
    }))
  } catch (error) {
    console.error('Failed to get artist tracks:', error)
    throw error
  }
}

// Get By Defeat tracks specifically
export const getByDefeatTracks = async (limit: number = 20): Promise<SpotifyTrack[]> => {
  return getArtistTracks('By Defeat', limit)
}

// Search for tracks by the band with fallback
export const getBandTracks = async (_limit: number = 20): Promise<SpotifyTrack[]> => {
  try {
    // First, search for the artist
    const artistResponse = await spotifyApi(`/search?q=${encodeURIComponent('By Defeat')}&type=artist&limit=1`)
    
    if (artistResponse.artists.items.length > 0) {
      const artist = artistResponse.artists.items[0]
      
      // Get top tracks first (these have popularity and are most relevant)
      const topTracksResponse = await spotifyApi(`/artists/${artist.id}/top-tracks?market=US`)
      
      // Filter to only tracks by "By Defeat" (exact match on artist name)
      const byDefeatTracks = topTracksResponse.tracks
        .filter((track: SpotifyTrackResponse) => 
          track.artists.some(a => a.name.toLowerCase() === 'by defeat')
        )
        .map((track: SpotifyTrackResponse) => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || 'By Defeat',
          artists: track.artists,
          album: track.album?.name,
          albumObject: track.album ? { ...track.album, uri: track.album.uri } : undefined,
          duration_ms: track.duration_ms,
          preview_url: track.preview_url,
          image: track.album?.images?.[0]?.url,
          popularity: track.popularity || 0,
          uri: track.uri,
          external_urls: track.external_urls,
          explicit: track.explicit || false,
          trackNumber: track.track_number
        }))
      
      if (byDefeatTracks.length > 0) {
        console.log(`Found ${byDefeatTracks.length} By Defeat tracks from artist top tracks`)
        return byDefeatTracks
      }
    }
    
    // If no artist found or no top tracks, search broadly and filter results
    const searchResponse = await spotifyApi(`/search?q=artist:"By Defeat"&type=track&limit=50`)
    
    if (searchResponse.tracks.items.length > 0) {
      const filteredTracks = searchResponse.tracks.items
        // Filter to only tracks where "By Defeat" is actually the artist
        .filter((track: SpotifyTrackResponse) => 
          track.artists.some(a => a.name.toLowerCase() === 'by defeat')
        )
        .sort((a: SpotifyTrackResponse, b: SpotifyTrackResponse) => (b.popularity || 0) - (a.popularity || 0))
        .map((track: SpotifyTrackResponse) => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || 'By Defeat',
          artists: track.artists,
          album: track.album?.name,
          albumObject: track.album,
          duration_ms: track.duration_ms,
          preview_url: track.preview_url,
          image: track.album?.images?.[0]?.url,
          popularity: track.popularity || 0,
          uri: track.uri,
          external_urls: track.external_urls,
          explicit: track.explicit || false
        }))
      
      console.log(`Found ${filteredTracks.length} By Defeat tracks after filtering`)
      return filteredTracks
    }
    
    // Final fallback to default tracks
    return DEFAULT_TRACKS
  } catch (error) {
    console.error('Failed to get band tracks:', error)
    return DEFAULT_TRACKS
  }
}