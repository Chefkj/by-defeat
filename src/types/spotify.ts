export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  artists: Array<{ name: string; id: string }>  // Add this line
  album?: string
  albumObject?: {  // Add this full object
    name: string
    images: Array<{ url: string }>
    id: string
  }
  duration_ms: number
  preview_url: string | null
  image?: string
  coverArt?: string
  external_urls?: {
    spotify: string
  }
  uri: string
  popularity?: number
  explicit?: boolean
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
  userProfile: UserProfile | null
  tracks: SpotifyTrack[]
  isLoading: boolean
  error: string | null
  audioFeatures: AudioFeatures | null
}

export interface UserProfile {
  display_name: string
  images: Array<{ url: string }>
  followers: { total: number }
  id: string
  email: string
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