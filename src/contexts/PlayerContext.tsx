import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// Music Player Context
export interface Track {
  id: string
  name: string
  artist: string
  duration: number
  url: string
  coverArt?: string
}

interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  currentTime: number
  playlist: Track[]
}

interface PlayerContextType {
  state: PlayerState
  play: (track?: Track) => void
  pause: () => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  addToPlaylist: (track: Track) => void
  removeFromPlaylist: (trackId: string) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

type PlayerAction =
  | { type: 'PLAY'; payload?: Track }
  | { type: 'PAUSE' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'ADD_TO_PLAYLIST'; payload: Track }
  | { type: 'REMOVE_FROM_PLAYLIST'; payload: string }

const playerReducer = (
  state: PlayerState,
  action: PlayerAction
): PlayerState => {
  switch (action.type) {
    case 'PLAY':
      return {
        ...state,
        currentTrack: action.payload || state.currentTrack,
        isPlaying: true,
      }
    case 'PAUSE':
      return { ...state, isPlaying: false }
    case 'SET_VOLUME':
      return { ...state, volume: action.payload }
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload }
    case 'ADD_TO_PLAYLIST':
      return { ...state, playlist: [...state.playlist, action.payload] }
    case 'REMOVE_FROM_PLAYLIST':
      return {
        ...state,
        playlist: state.playlist.filter(track => track.id !== action.payload),
      }
    default:
      return state
  }
}

const initialPlayerState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  playlist: [],
}

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState)

  const play = (track?: Track) => dispatch({ type: 'PLAY', payload: track })
  const pause = () => dispatch({ type: 'PAUSE' })
  const setVolume = (volume: number) =>
    dispatch({ type: 'SET_VOLUME', payload: volume })
  const setCurrentTime = (time: number) =>
    dispatch({ type: 'SET_CURRENT_TIME', payload: time })
  const addToPlaylist = (track: Track) =>
    dispatch({ type: 'ADD_TO_PLAYLIST', payload: track })
  const removeFromPlaylist = (trackId: string) =>
    dispatch({ type: 'REMOVE_FROM_PLAYLIST', payload: trackId })

  return (
    <PlayerContext.Provider
      value={{
        state,
        play,
        pause,
        setVolume,
        setCurrentTime,
        addToPlaylist,
        removeFromPlaylist,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePlayer = () => {
  const context = useContext(PlayerContext)
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}
