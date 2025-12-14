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
    uri?: string  // Album URI for context playback
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
  trackNumber?: number  // Track position in album for offset
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

// Full Spotify Audio Features API response
// https://developer.spotify.com/documentation/web-api/reference/get-audio-features
export interface AudioFeatures {
  acousticness: number        // 0.0 to 1.0 - confidence measure of whether track is acoustic
  analysis_url: string        // URL to access full audio analysis
  danceability: number        // 0.0 to 1.0 - how suitable track is for dancing
  duration_ms: number         // Duration of track in milliseconds
  energy: number              // 0.0 to 1.0 - perceptual measure of intensity and activity
  id: string                  // Spotify ID for the track
  instrumentalness: number    // 0.0 to 1.0 - predicts whether track contains vocals
  key: number                 // -1 to 11 - key the track is in (Pitch Class notation)
  liveness: number            // 0.0 to 1.0 - presence of audience in recording
  loudness: number            // -60 to 0 dB - overall loudness in decibels
  mode: number                // 0 or 1 - modality (0 = minor, 1 = major)
  speechiness: number         // 0.0 to 1.0 - presence of spoken words
  tempo: number               // BPM - overall estimated tempo
  time_signature: number      // 3 to 7 - estimated time signature
  track_href: string          // Spotify API link to full track object
  type: string                // "audio_features"
  uri: string                 // Spotify URI for track
  valence: number             // 0.0 to 1.0 - musical positiveness (happy vs sad)
}

export type ThemeType = 'default' | 'energetic' | 'mellow' | 'dark' | 'bright'

export interface PlayerTheme {
  type: ThemeType
  primaryColor: string
  secondaryColor: string
  animationSpeed: number
}