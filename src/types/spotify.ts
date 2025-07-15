export interface SpotifyTrack {
  id: string
  name: string
  artist: string // Simple string for compatibility
  artists?: Array<{ name: string }> // Optional array for full Spotify API
  album?: string // Album name as string
  albumObject?: { // Optional full album object
    name: string
    images: Array<{ url: string }>
  }
  duration_ms?: number
  preview_url: string | null
  external_urls: {
    spotify: string
  }
  image?: string // Cover art URL
  coverArt?: string // Alias for image
}

export interface SpotifyArtist {
  id: string
  name: string
  external_urls: {
    spotify: string
  }
  images?: Array<{
    url: string
    height: number
    width: number
  }>
}

export interface SpotifyAlbum {
  id: string
  name: string
  artists: SpotifyArtist[]
  images: Array<{
    url: string
    height: number
    width: number
  }>
  external_urls: {
    spotify: string
  }
}

export interface SpotifyAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

export interface PlayerState {
  currentTrack: SpotifyTrack | null
  isPlaying: boolean
  progress: number
  duration: number
  volume: number
  playlist: SpotifyTrack[]
  currentIndex: number
  isAuthenticated: boolean
  accessToken: string | null
}

export interface AudioFeatures {
  energy: number
  valence: number
  danceability: number
  acousticness: number
  instrumentalness: number
  liveness: number
  speechiness: number
  tempo: number
}

export type ThemeType = 'default' | 'energetic' | 'mellow' | 'dark' | 'bright'

export interface PlayerTheme {
  type: ThemeType
  primaryColor: string
  secondaryColor: string
  animationSpeed: number
}