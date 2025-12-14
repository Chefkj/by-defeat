import React, { useReducer, useEffect, ReactNode, useCallback, createContext } from 'react'
import type { PlayerState, SpotifyTrack, AudioFeatures } from '../types/spotify'
import { 
  DEFAULT_TRACKS, 
  getUserProfile, 
  getUserTracks, 
  getCurrentPlayback,
  getAccessToken,
  getBandTracks,
  SpotifyService
} from '../services/spotify'

// Add user profile type
export interface UserProfile {
  display_name: string
  images: Array<{ url: string }>
  followers: { total: number }
  id: string
  email: string
}

// Define action types
type PlayerAction =
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
  audioFeatures: null,
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
    case 'SET_AUDIO_FEATURES':
      return { ...state, audioFeatures: action.payload }
    case 'NEXT_TRACK': {
      const nextIndex = (state.currentIndex + 1) % state.playlist.length
      return {
        ...state,
        currentIndex: nextIndex,
        currentTrack: state.playlist[nextIndex] || null,
        progress: 0,
        audioFeatures: null, // Reset audio features when track changes
      }
    }
    case 'PREVIOUS_TRACK': {
      const prevIndex = state.currentIndex === 0 ? state.playlist.length - 1 : state.currentIndex - 1
      return {
        ...state,
        currentIndex: prevIndex,
        currentTrack: state.playlist[prevIndex] || null,
        progress: 0,
        audioFeatures: null, // Reset audio features when track changes
      }
    }
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying }
    default:
      return state
  }
}

// Define context type
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
  selectTrack: (index: number) => void
  authenticate: (accessToken: string) => void
  logout: () => void
  loadUserData: () => Promise<void>
  loadAudioFeatures: (trackId: string) => Promise<void>
}

// Create context
export const PlayerContext = createContext<PlayerContextType>({} as PlayerContextType)

// Provider component
interface PlayerProviderProps {
  children: ReactNode
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(playerReducer, initialState)
  const spotifyServiceRef = React.useRef<SpotifyService | null>(null)
  const isLoadingUserData = React.useRef(false)

  // Initialize Spotify service when authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.accessToken) {
      spotifyServiceRef.current = new SpotifyService(state.accessToken)
    }
  }, [state.isAuthenticated, state.accessToken])

  const loadAudioFeatures = React.useCallback(async (trackId: string) => {
    if (!spotifyServiceRef.current) return
    
    try {
      // Try to get real audio features from Spotify API
      const audioFeatures = await spotifyServiceRef.current.getAudioFeatures(trackId)
      dispatch({ type: 'SET_AUDIO_FEATURES', payload: audioFeatures })
      console.log('✅ Loaded audio features for track:', trackId)
    } catch (error) {
      // Silently fall back to mock features if API fails (403 is common for some tracks)
      const errorMessage = error instanceof Error ? error.message : ''
      if (!errorMessage.includes('403')) {
        console.warn('Audio features unavailable, using mock data:', errorMessage)
      }
      
      // Generate mock audio features that match the full API structure
      const mockAudioFeatures: AudioFeatures = {
        acousticness: Math.random() * 0.8,
        analysis_url: '',
        danceability: 0.4 + Math.random() * 0.6,
        duration_ms: 0,
        energy: 0.5 + Math.random() * 0.5,
        id: trackId,
        instrumentalness: Math.random() * 0.5,
        key: Math.floor(Math.random() * 12),
        liveness: Math.random() * 0.4,
        loudness: -60 + Math.random() * 50,
        mode: Math.random() > 0.5 ? 1 : 0,
        speechiness: Math.random() * 0.3,
        tempo: 80 + Math.random() * 120,
        time_signature: 4,
        track_href: '',
        type: 'audio_features',
        uri: `spotify:track:${trackId}`,
        valence: 0.3 + Math.random() * 0.7,
      }
      dispatch({ type: 'SET_AUDIO_FEATURES', payload: mockAudioFeatures })
    }
  }, [])

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

  // Load audio features when track changes
  useEffect(() => {
    if (state.currentTrack?.id && state.isAuthenticated) {
      const trackName = state.currentTrack.name
      console.log('Loading audio features for track:', trackName)
      loadAudioFeatures(state.currentTrack.id)
    }
  }, [state.currentTrack?.id, state.currentTrack?.name, state.isAuthenticated, loadAudioFeatures])

  const loadUserData = useCallback(async () => {
    if (!state.accessToken) return
    
    // Prevent duplicate calls
    if (isLoadingUserData.current) {
      console.log('loadUserData already in progress, skipping...')
      return
    }
    
    isLoadingUserData.current = true
    
    console.log('=== loadUserData starting ===')
    console.log('State access token:', state.accessToken ? `EXISTS (first 10: ${state.accessToken.substring(0, 10)}...)` : 'MISSING')
    console.log('LocalStorage access token:', localStorage.getItem('spotify_access_token') ? 'EXISTS' : 'MISSING')
    console.log('LocalStorage refresh token:', localStorage.getItem('spotify_refresh_token') ? 'EXISTS' : 'MISSING')
    console.log('LocalStorage expires at:', localStorage.getItem('spotify_token_expires_at'))
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // Load user profile
      const profile = await getUserProfile()
      dispatch({ type: 'SET_USER_PROFILE', payload: profile })
      
      // Load By Defeat tracks as the main playlist
      try {
        const bandTracks = await getBandTracks()
        console.log(`Loaded ${bandTracks.length} By Defeat tracks (filtered to exact artist match)`)
        console.log('Sample track preview URLs:', bandTracks.slice(0, 3).map(t => ({ 
          name: t.name, 
          artist: t.artist,
          hasPreview: !!t.preview_url,
          preview: t.preview_url 
        })))
        
        // Set band tracks as the main playlist
        dispatch({ type: 'SET_PLAYLIST', payload: bandTracks })
        dispatch({ type: 'SET_CURRENT_TRACK', payload: bandTracks[0] })
        dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 })
        
        // Log preview availability summary
        const tracksWithPreviews = bandTracks.filter(t => t.preview_url).length
        console.log(`🎵 Preview availability: ${tracksWithPreviews}/${bandTracks.length} tracks have playable previews`)
        
      } catch (tracksError) {
        console.error('Failed to load By Defeat tracks:', tracksError)
        // Fallback to default tracks if API call fails
      }
      
      // Load user's saved tracks separately (for display purposes)
      try {
        const userTracks = await getUserTracks(10)
        dispatch({ type: 'SET_USER_TRACKS', payload: userTracks })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : ''
        if (errorMessage.includes('Insufficient permissions') || errorMessage.includes('403')) {
          console.warn('Missing user-library-read scope. User needs to re-authenticate.')
          console.warn('To fix: 1) Disconnect, 2) Clear browser cache/cookies for this site, 3) Reconnect')
        } else {
          console.log('Could not load user saved tracks:', errorMessage)
        }
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
      
      // Check if it's a permission error
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user data'
      if (errorMessage.includes('Insufficient permissions')) {
        dispatch({ type: 'SET_ERROR', payload: 'Please log out and reconnect to grant required permissions' })
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' })
      }
      
      dispatch({ type: 'SET_LOADING', payload: false })
      
      // Fallback to default tracks on complete failure
      dispatch({ type: 'SET_PLAYLIST', payload: DEFAULT_TRACKS })
      dispatch({ type: 'SET_CURRENT_TRACK', payload: DEFAULT_TRACKS[0] })
      dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 })
    } finally {
      isLoadingUserData.current = false
    }
  }, [state.accessToken, dispatch])

  // Load user data when authenticated - with delay to ensure token is in storage
  useEffect(() => {
    if (state.isAuthenticated && state.accessToken) {
      // Small delay to ensure localStorage has propagated
      const timer = setTimeout(() => {
        loadUserData()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [state.isAuthenticated, state.accessToken, loadUserData])

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

  const selectTrack = (index: number) => {
    if (index >= 0 && index < state.playlist.length) {
      dispatch({ type: 'SET_CURRENT_INDEX', payload: index })
      dispatch({ type: 'SET_CURRENT_TRACK', payload: state.playlist[index] })
      dispatch({ type: 'SET_PLAYING', payload: true })
    }
  }

  const authenticate = (accessToken: string) => {
    // Store token FIRST, then update state
    localStorage.setItem('spotify_access_token', accessToken)
    
    // Verify storage succeeded
    const stored = localStorage.getItem('spotify_access_token')
    if (!stored) {
      console.error('Failed to store access token in localStorage')
      return
    }
    
    console.log('Access token stored successfully, updating auth state')
    dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, accessToken } })
  }

  const logout = useCallback(() => {
    // Clear all Spotify-related storage items
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    localStorage.removeItem('spotify_token_expiry')
    localStorage.removeItem('spotify_auth_code')
    localStorage.removeItem('spotify_code_verifier')
    localStorage.removeItem('spotify_code_verifier_timestamp')
    localStorage.removeItem('spotify_auth_state')
    
    // Also clear sessionStorage
    sessionStorage.removeItem('spotify_code_verifier')
    sessionStorage.removeItem('spotify_code_verifier_timestamp')
    sessionStorage.removeItem('spotify_auth_state')
    
    dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: false, accessToken: null } })
    dispatch({ type: 'SET_USER_PROFILE', payload: null })
    dispatch({ type: 'SET_USER_TRACKS', payload: [] })
  }, [dispatch])

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
    selectTrack,
    authenticate,
    logout,
    loadUserData,
    loadAudioFeatures
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