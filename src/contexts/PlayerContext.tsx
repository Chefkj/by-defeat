import React, { createContext, useReducer, useEffect, ReactNode } from 'react'
import type { PlayerState, SpotifyTrack } from '../types/spotify'
import { DEFAULT_TRACKS, SpotifyService } from '../services/spotify'

// Action types
type PlayerAction =
  | { type: 'SET_CURRENT_TRACK'; payload: SpotifyTrack }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_PLAYLIST'; payload: SpotifyTrack[] }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'SET_AUTH'; payload: { isAuthenticated: boolean; accessToken: string | null } }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREVIOUS_TRACK' }
  | { type: 'TOGGLE_PLAY' }

// Initial state
const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.7,
  playlist: DEFAULT_TRACKS,
  currentIndex: 0,
  isAuthenticated: false,
  accessToken: null,
}

// Reducer
const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case 'SET_CURRENT_TRACK':
      return { ...state, currentTrack: action.payload }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload }
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload }
    case 'SET_DURATION':
      return { ...state, duration: action.payload }
    case 'SET_VOLUME':
      return { ...state, volume: action.payload }
    case 'SET_PLAYLIST':
      return { ...state, playlist: action.payload }
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: action.payload }
    case 'SET_AUTH':
      return { 
        ...state, 
        isAuthenticated: action.payload.isAuthenticated, 
        accessToken: action.payload.accessToken 
      }
    case 'NEXT_TRACK': {
      const nextIndex = (state.currentIndex + 1) % state.playlist.length
      return {
        ...state,
        currentIndex: nextIndex,
        currentTrack: state.playlist[nextIndex] || null,
        progress: 0,
      }
    }
    case 'PREVIOUS_TRACK': {
      const prevIndex = state.currentIndex === 0 ? state.playlist.length - 1 : state.currentIndex - 1
      return {
        ...state,
        currentIndex: prevIndex,
        currentTrack: state.playlist[prevIndex] || null,
        progress: 0,
      }
    }
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying }
    default:
      return state
  }
}

// Context
interface PlayerContextType {
  state: PlayerState
  dispatch: React.Dispatch<PlayerAction>
  play: () => void
  pause: () => void
  next: () => void
  previous: () => void
  setVolume: (volume: number) => void
  setProgress: (progress: number) => void
  setCurrentTrack: (track: SpotifyTrack) => void
  authenticate: (accessToken: string) => void
  logout: () => void
  spotifyService: SpotifyService | null
}

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

// Provider component
interface PlayerProviderProps {
  children: ReactNode
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(playerReducer, initialState)
  const spotifyService = state.accessToken ? new SpotifyService(state.accessToken) : null

  // Initialize first track
  useEffect(() => {
    if (state.playlist.length > 0 && !state.currentTrack) {
      dispatch({ type: 'SET_CURRENT_TRACK', payload: state.playlist[0] })
    }
  }, [state.playlist, state.currentTrack])

  // Check for existing authentication
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token')
    if (token) {
      dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, accessToken: token } })
    }
  }, [])

  const play = () => {
    dispatch({ type: 'SET_PLAYING', payload: true })
  }

  const pause = () => {
    dispatch({ type: 'SET_PLAYING', payload: false })
  }

  const next = () => {
    dispatch({ type: 'NEXT_TRACK' })
  }

  const previous = () => {
    dispatch({ type: 'PREVIOUS_TRACK' })
  }

  const setVolume = (volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume })
  }

  const setProgress = (progress: number) => {
    dispatch({ type: 'SET_PROGRESS', payload: progress })
  }

  const setCurrentTrack = (track: SpotifyTrack) => {
    dispatch({ type: 'SET_CURRENT_TRACK', payload: track })
  }

  const authenticate = (accessToken: string) => {
    localStorage.setItem('spotify_access_token', accessToken)
    dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, accessToken } })
  }

  const logout = () => {
    localStorage.removeItem('spotify_access_token')
    dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: false, accessToken: null } })
  }

  const contextValue: PlayerContextType = {
    state,
    dispatch,
    play,
    pause,
    next,
    previous,
    setVolume,
    setProgress,
    setCurrentTrack,
    authenticate,
    logout,
    spotifyService,
  }

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  )
}

// Custom hook to use the PlayerContext
export const usePlayer = () => {
  const context = React.useContext(PlayerContext)
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}