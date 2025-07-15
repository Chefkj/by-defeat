import React, { createContext, useReducer, useEffect, ReactNode } from 'react'
import type { PlayerState, SpotifyTrack } from '../types/spotify'
import { 
  DEFAULT_TRACKS, 
  getUserProfile, 
  getUserTracks, 
  getCurrentPlayback,
  getAccessToken,
  getBandTracks  // Add this import
} from '../services/spotify'

// Add user profile type
interface UserProfile {
  display_name: string
  images: Array<{ url: string }>
  followers: { total: number }
  id: string
  email: string
}

// Action types - add new actions for user data
type PlayerAction =
  | { type: 'SET_CURRENT_TRACK'; payload: SpotifyTrack }
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
  | { type: 'NEXT_TRACK' }
  | { type: 'PREVIOUS_TRACK' }
  | { type: 'TOGGLE_PLAY' }

// Update initial state to include user data
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
  userProfile: null,
  tracks: [],
  isLoading: false,
  error: null,
}

// Update reducer to handle new actions
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
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload }
    case 'SET_USER_TRACKS':
      return { ...state, tracks: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
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

// Update context interface
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
  loadUserData: () => Promise<void>
}

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

// Provider component
interface PlayerProviderProps {
  children: ReactNode
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(playerReducer, initialState)

  // Initialize first track
  useEffect(() => {
    if (state.playlist.length > 0 && !state.currentTrack) {
      dispatch({ type: 'SET_CURRENT_TRACK', payload: state.playlist[0] })
    }
  }, [state.playlist, state.currentTrack])

  // Check for existing authentication
  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, accessToken: token } })
    }
  }, [])

  // Load user data when authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.accessToken) {
      loadUserData()
    }
  }, [state.isAuthenticated, state.accessToken])

  const loadUserData = async () => {
    if (!state.accessToken) return
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // Load user profile
      const profile = await getUserProfile()
      dispatch({ type: 'SET_USER_PROFILE', payload: profile })
      
      // Load By Defeat tracks as the main playlist
      try {
        const bandTracks = await getBandTracks(20)
        console.log(`Loaded ${bandTracks.length} By Defeat tracks`)
        
        // Set band tracks as the main playlist
        dispatch({ type: 'SET_PLAYLIST', payload: bandTracks })
        dispatch({ type: 'SET_CURRENT_TRACK', payload: bandTracks[0] })
        dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 })
        
      } catch (tracksError) {
        console.error('Failed to load By Defeat tracks:', tracksError)
        // Fallback to default tracks if API call fails
        dispatch({ type: 'SET_PLAYLIST', payload: DEFAULT_TRACKS })
        dispatch({ type: 'SET_CURRENT_TRACK', payload: DEFAULT_TRACKS[0] })
        dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 })
      }
      
      // Load user's saved tracks separately (for display purposes)
      try {
        const userTracks = await getUserTracks(10)
        dispatch({ type: 'SET_USER_TRACKS', payload: userTracks.items.map((item: any) => item.track) })
      } catch {
        console.log('Could not load user saved tracks')
        dispatch({ type: 'SET_USER_TRACKS', payload: [] })
      }
      
      // Try to get current playback state
      try {
        const playbackState = await getCurrentPlayback()
        if (playbackState && playbackState.item) {
          dispatch({ type: 'SET_CURRENT_TRACK', payload: playbackState.item })
          dispatch({ type: 'SET_PLAYING', payload: playbackState.is_playing })
        }
      } catch {
        console.log('No active playback session')
      }
      
      dispatch({ type: 'SET_LOADING', payload: false })
    } catch (error) {
      console.error('Failed to load user data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' })
      dispatch({ type: 'SET_LOADING', payload: false })
      
      // Fallback to default tracks on complete failure
      dispatch({ type: 'SET_PLAYLIST', payload: DEFAULT_TRACKS })
      dispatch({ type: 'SET_CURRENT_TRACK', payload: DEFAULT_TRACKS[0] })
      dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 })
    }
  }

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
    localStorage.removeItem('spotify_refresh_token')
    localStorage.removeItem('spotify_auth_code')
    localStorage.removeItem('code_verifier')
    dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: false, accessToken: null } })
    dispatch({ type: 'SET_USER_PROFILE', payload: null })
    dispatch({ type: 'SET_USER_TRACKS', payload: [] })
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
    loadUserData
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