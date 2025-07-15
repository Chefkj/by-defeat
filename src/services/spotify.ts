import type { SpotifyTrack, SpotifyAuthResponse, AudioFeatures } from '../types/spotify'

// Spotify API configuration
export const SPOTIFY_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your_spotify_client_id',
  REDIRECT_URI: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'https://chefkj.github.io/by-defeat/callback',
  SCOPES: [
    'streaming',
    'user-read-email',
    'user-read-private',
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
  
  // Store code verifier with a timestamp and extra logging
  console.log('Storing code verifier:', codeVerifier.substring(0, 10) + '...')
  localStorage.setItem('spotify_code_verifier', codeVerifier)
  localStorage.setItem('spotify_code_verifier_timestamp', Date.now().toString())
  
  // Verify it was stored
  const stored = localStorage.getItem('spotify_code_verifier')
  if (!stored) {
    throw new Error('Failed to store code verifier')
  }
  
  return `https://accounts.spotify.com/authorize?` +
    `client_id=${SPOTIFY_CONFIG.CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(SPOTIFY_CONFIG.SCOPES)}&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256`
}

// Exchange auth code for access token
export const exchangeCodeForToken = async (code: string): Promise<SpotifyAuthResponse> => {
  const codeVerifier = localStorage.getItem('spotify_code_verifier')
  const timestamp = localStorage.getItem('spotify_code_verifier_timestamp')
  
  console.log('Code verifier check:', {
    exists: !!codeVerifier,
    timestamp: timestamp ? new Date(parseInt(timestamp)).toISOString() : 'none',
    age: timestamp ? Date.now() - parseInt(timestamp) : 'unknown'
  })
  
  if (!codeVerifier) {
    // List all localStorage keys for debugging
    const allKeys = Object.keys(localStorage)
    console.error('localStorage keys:', allKeys)
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
    throw new Error(`Failed to exchange code for token: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  // Store tokens
  localStorage.setItem('spotify_access_token', data.access_token)
  localStorage.setItem('spotify_refresh_token', data.refresh_token)
  localStorage.setItem('spotify_token_expires_at', (Date.now() + data.expires_in * 1000).toString())
  
  // Clean up code verifier and timestamp
  localStorage.removeItem('spotify_code_verifier')
  localStorage.removeItem('spotify_code_verifier_timestamp')
  
  return data
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
    try {
      token = await refreshAccessToken()
    } catch {
      throw new Error('Authentication required')
    }
  }
  
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  if (response.status === 401) {
    // Token expired, try to refresh
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
        throw new Error('API request failed after token refresh')
      }
      
      return retryResponse.json()
    } catch {
      throw new Error('Authentication required')
    }
  }
  
  if (!response.ok) {
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
export const startPlayback = async (deviceId?: string, uris?: string[]) => {
  const body: Record<string, string | string[]> = {}
  
  if (deviceId) {
    body.device_id = deviceId
  }
  
  if (uris) {
    body.uris = uris
  }
  
  return spotifyApi('/me/player/play', {
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
  popularity?: number  // Add this
  uri: string  // Add this
  explicit?: boolean  // Add this
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
      popularity: (track as any).popularity || 0,
      uri: (track as any).uri || `spotify:track:${track.id}`,
      explicit: (track as any).explicit || false
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
      popularity: (track as any).popularity || 0,
      uri: (track as any).uri || `spotify:track:${track.id}`,
      explicit: (track as any).explicit || false
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
      images: [{ url: '/placeholder-album.jpg' }],
      id: 'demo-album-1'
    },
    duration_ms: 180000,
    preview_url: null,
    image: '/placeholder-album.jpg',
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
      images: [{ url: '/placeholder-album.jpg' }],
      id: 'demo-album-1'
    },
    duration_ms: 210000,
    preview_url: null,
    image: '/placeholder-album.jpg',
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
    
    let allTracks: any[] = [...topTracksResponse.tracks]
    
    // Get tracks from albums (these DON'T have popularity)
    for (const album of albumsResponse.items) {
      const albumTracksResponse = await spotifyApi(`/albums/${album.id}/tracks?market=US`)
      
      // For album tracks, we need to fetch individual track details to get popularity
      const albumTracksWithPopularity = await Promise.all(
        albumTracksResponse.items.map(async (track: any) => {
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
    
    return sortedTracks.map((track: any) => ({
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
export const getBandTracks = async (limit: number = 20): Promise<SpotifyTrack[]> => {
  try {
    // First, search for the artist
    const artistResponse = await spotifyApi(`/search?q=${encodeURIComponent('By Defeat')}&type=artist&limit=1`)
    
    if (artistResponse.artists.items.length > 0) {
      const artist = artistResponse.artists.items[0]
      
      // Get top tracks first (these have popularity and are most relevant)
      const topTracksResponse = await spotifyApi(`/artists/${artist.id}/top-tracks?market=US`)
      
      if (topTracksResponse.tracks.length >= limit) {
        // If we have enough top tracks, just return those
        return topTracksResponse.tracks.map((track: any) => ({
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
      }
    }
    
    // If no artist found or not enough top tracks, search broadly
    const searchResponse = await spotifyApi(`/search?q=artist:"By Defeat"&type=track&limit=${limit}`)
    
    if (searchResponse.tracks.items.length > 0) {
      return searchResponse.tracks.items
        .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
        .map((track: any) => ({
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
    }
    
    // Final fallback to default tracks
    return DEFAULT_TRACKS
  } catch (error) {
    console.error('Failed to get band tracks:', error)
    return DEFAULT_TRACKS
  }
}