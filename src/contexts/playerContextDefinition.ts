import { createContext, Dispatch } from 'react'
import type { PlayerState, SpotifyTrack, AudioFeatures } from '../types/spotify'

// Add user profile type
export interface UserProfile {
  display_name: string
  images: Array<{ url: string }>
  followers: { total: number }
  id: string
  email: string
}

// Define action types
export type PlayerAction =
  | { type: 'SET_CURRENT_TRACK'; payload: SpotifyTrack | null }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_PLAYLIST'; payload: SpotifyTrack[] }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'SET_AUTH'; payload: { isAuthenticated: boolean; accessToken: string | null } }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_USER_TRACKS'; payload: SpotifyTrack[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AUDIO_FEATURES'; payload: AudioFeatures | null }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREVIOUS_TRACK' }
  | { type: 'TOGGLE_PLAY' }

// Define context type
export interface PlayerContextType {
  state: PlayerState
  dispatch: Dispatch<PlayerAction>
  play: () => void
  pause: () => void
  next: () => void
  previous: () => void
  setVolume: (volume: number) => void
  setProgress: (progress: number) => void
  setCurrentTrack: (track: SpotifyTrack) => void
  selectTrack: (index: number) => void
  authenticate: (accessToken: string) => void
  logout: () => void
  loadUserData: () => Promise<void>
  loadAudioFeatures: (trackId: string) => Promise<void>
}

// Create context
export const PlayerContext = createContext<PlayerContextType>({} as PlayerContextType)
