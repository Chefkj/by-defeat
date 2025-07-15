import type { SpotifyTrack, SpotifyAuthResponse, AudioFeatures } from '../types/spotify'

// Spotify API configuration
export const SPOTIFY_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your_spotify_client_id',
  REDIRECT_URI: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin + '/callback',
  SCOPES: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state'
  ].join(' ')
}

export const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?` +
  `client_id=${SPOTIFY_CONFIG.CLIENT_ID}&` +
  `response_type=code&` +
  `redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI)}&` +
  `scope=${encodeURIComponent(SPOTIFY_CONFIG.SCOPES)}`

// Reference track ID from the issue
export const REFERENCE_TRACK_ID = '7t7LrYqwUrIzcac0qS6lcG'

// Spotify API types for responses
interface SpotifyTrackResponse {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
  preview_url: string | null
  external_urls: { spotify: string }
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
      artists: track.artists, // Include full artists array
      album: track.album?.name,
      albumObject: track.album, // Include full album object
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      image: track.album?.images?.[0]?.url,
      coverArt: track.album?.images?.[0]?.url,
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
      artists: track.artists, // Include full artists array
      album: track.album?.name,
      albumObject: track.album, // Include full album object
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      image: track.album?.images?.[0]?.url,
      coverArt: track.album?.images?.[0]?.url,
    }))
  }

  async getCurrentUserProfile(): Promise<SpotifyUserProfile> {
    return this.makeRequest<SpotifyUserProfile>('/me')
  }
}

// Default tracks for demonstration
export const DEFAULT_TRACKS: SpotifyTrack[] = [
  {
    id: REFERENCE_TRACK_ID,
    name: 'Reference Track',
    artist: 'By Defeat',
    album: 'Demo Album',
    preview_url: null,
    external_urls: {
      spotify: `https://open.spotify.com/track/${REFERENCE_TRACK_ID}`
    },
    image: '/api/placeholder/300/300',
    coverArt: '/api/placeholder/300/300',
  },
  {
    id: 'demo-track-1',
    name: 'Demo Track 1',
    artist: 'By Defeat',
    album: 'Demo Album',
    preview_url: null,
    external_urls: {
      spotify: 'https://open.spotify.com/track/demo-track-1'
    },
    image: '/api/placeholder/300/300',
    coverArt: '/api/placeholder/300/300',
  },
  {
    id: 'demo-track-2',
    name: 'Demo Track 2',
    artist: 'By Defeat',
    album: 'Demo Album',
    preview_url: null,
    external_urls: {
      spotify: 'https://open.spotify.com/track/demo-track-2'
    },
    image: '/api/placeholder/300/300',
    coverArt: '/api/placeholder/300/300',
  }
]

// Auth utilities
export const generateCodeVerifier = (): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const values = crypto.getRandomValues(new Uint8Array(128))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export const exchangeCodeForToken = async (code: string, codeVerifier: string): Promise<SpotifyAuthResponse> => {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
      client_id: SPOTIFY_CONFIG.CLIENT_ID,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for token')
  }

  return response.json()
}