import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { usePlayer } from '../../contexts/PlayerContext'
import { PlayerControls } from './PlayerControls'
import { TrackInfo } from './TrackInfo'
import { AudioVisualizer } from './AudioVisualizer'
import { SpotifyAuth } from './SpotifyAuth'
import type { ThemeType } from '../../types/spotify'

export const MusicPlayer: React.FC = () => {
  const { state, authenticate } = usePlayer()
  const [theme, setTheme] = useState<ThemeType>('default')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const { currentTrack, isPlaying, volume, isAuthenticated } = state

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    if (currentTrack) {
      updateThemeForTrack()
    }
  }, [currentTrack])

  const updateThemeForTrack = () => {
    const themes: ThemeType[] = ['default', 'energetic', 'mellow', 'dark', 'bright']
    const newTheme = themes[Math.floor(Math.random() * themes.length)]
    setTheme(newTheme)
    
    // Update CSS custom properties for dynamic theming
    const root = document.documentElement
    switch (newTheme) {
      case 'energetic':
        root.style.setProperty('--primary-color', '#ff6b6b')
        root.style.setProperty('--secondary-color', '#feca57')
        break
      case 'mellow':
        root.style.setProperty('--primary-color', '#74b9ff')
        root.style.setProperty('--secondary-color', '#a29bfe')
        break
      case 'dark':
        root.style.setProperty('--primary-color', '#2d3436')
        root.style.setProperty('--secondary-color', '#636e72')
        break
      case 'bright':
        root.style.setProperty('--primary-color', '#00cec9')
        root.style.setProperty('--secondary-color', '#fd79a8')
        break
      default:
        root.style.setProperty('--primary-color', '#1e3c72')
        root.style.setProperty('--secondary-color', '#2a5298')
    }
  }

  const handleAuthSuccess = (token: string) => {
    authenticate(token)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <SpotifyAuth onAuthSuccess={handleAuthSuccess} />
      </div>
    )
  }

  if (!currentTrack) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 shadow-lg"
      >
        <div className="flex items-center justify-center">
          <p className="text-gray-400">No track selected</p>
        </div>
      </motion.div>
    )
  }

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className={`min-h-screen bg-gray-900 text-white theme-${theme} relative overflow-hidden`}>
        <audio
          ref={audioRef}
          src={currentTrack.preview_url || ''}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              // Handle metadata loaded
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              // Handle time update
            }
          }}
        />
        
        <div className="absolute inset-0 z-0">
          <AudioVisualizer isPlaying={isPlaying} theme={theme} />
        </div>
        
        <div className="relative z-10 flex flex-col h-screen">
          <header className="p-6 flex justify-between items-center">
            <div>
              <motion.h1
                className="text-4xl font-bold mb-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                By Defeat
              </motion.h1>
              <motion.p
                className="text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Let the music speak for itself
              </motion.p>
            </div>
            <button
              onClick={toggleFullscreen}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="max-w-4xl w-full">
              <TrackInfo track={currentTrack} theme={theme} />
              
              <div className="mt-8">
                <PlayerControls theme={theme} />
              </div>

              <motion.div
                className="mt-8 text-center text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <p className="mb-2">Experience the dynamic nature of By Defeat</p>
                <p>Watch as the player adapts to each song's unique energy</p>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Mini player mode (bottom bar)
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-md p-4 shadow-lg border-t border-gray-700 theme-${theme}`}
    >
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center space-x-4">
          {/* Fix: Use the correct image properties */}
          {(currentTrack.image || currentTrack.coverArt || currentTrack.albumObject?.images?.[0]?.url) && (
            <img
              src={currentTrack.image || currentTrack.coverArt || currentTrack.albumObject?.images?.[0]?.url}
              alt={currentTrack.name}
              className="w-12 h-12 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
              onClick={toggleFullscreen}
            />
          )}
          <div>
            <p className="text-white font-semibold">{currentTrack.name}</p>
            {/* Fix: Use the artist property that's guaranteed to exist */}
            <p className="text-gray-400 text-sm">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <PlayerControls theme={theme} />
          
          <button
            onClick={toggleFullscreen}
            className="text-white/70 hover:text-white transition-colors"
            title="Open fullscreen player"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
