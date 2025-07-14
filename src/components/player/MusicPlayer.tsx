import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { usePlayer } from '../../hooks/usePlayer'
import { PlayerControls } from './PlayerControls'
import { TrackInfo } from './TrackInfo'
import { AudioVisualizer } from './AudioVisualizer'
import { SpotifyAuth } from './SpotifyAuth'
import type { ThemeType } from '../../types/spotify'

export const MusicPlayer: React.FC = () => {
  const { state, authenticate } = usePlayer()
  const [theme, setTheme] = useState<ThemeType>('default')
  const audioRef = useRef<HTMLAudioElement>(null)

  const { currentTrack, isPlaying, volume, isAuthenticated } = state

  // Sample audio for demonstration
  const sampleAudioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'

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
    // In a real implementation, this would analyze track features from Spotify API
    // For demo, we'll cycle through different themes
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <SpotifyAuth onAuthSuccess={handleAuthSuccess} />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-900 text-white theme-${theme} relative overflow-hidden`}>
      <audio
        ref={audioRef}
        src={sampleAudioUrl}
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
        <header className="p-6">
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