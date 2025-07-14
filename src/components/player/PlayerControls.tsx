import React from 'react'
import { motion } from 'framer-motion'
import { usePlayer } from '../../hooks/usePlayer'
import { Button } from '../ui/Button'
import type { ThemeType } from '../../types/spotify'

interface PlayerControlsProps {
  theme: ThemeType
}

export const PlayerControls: React.FC<PlayerControlsProps> = () => {
  const { state, play, pause, next, previous, setVolume, setProgress } = usePlayer()
  const { isPlaying, progress, volume } = state

  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value)
    setProgress(newProgress)
  }

  return (
    <motion.div
      className="flex flex-col items-center space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Progress bar */}
      <div className="w-full max-w-md">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleProgressChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0:00</span>
          <span>3:42</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center space-x-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={previous}
          className="text-white hover:bg-gray-800"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 9H17a1 1 0 110 2h-5.586l4.293 4.293a1 1 0 010 1.414zM6 4a1 1 0 012 0v12a1 1 0 11-2 0V4z" clipRule="evenodd" />
          </svg>
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={handlePlayPause}
          className="rounded-full w-16 h-16 flex items-center justify-center"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={next}
          className="text-white hover:bg-gray-800"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 11H3a1 1 0 110-2h5.586L4.293 5.707a1 1 0 010-1.414zM14 4a1 1 0 100 2v12a1 1 0 100-2V4z" clipRule="evenodd" />
          </svg>
        </Button>
      </div>

      {/* Volume control */}
      <div className="flex items-center space-x-4">
        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-2.21-.896-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 12a5.983 5.983 0 01-.757 2.829 1 1 0 11-1.415-1.414A3.987 3.987 0 0013.5 12a3.987 3.987 0 00-.672-2.415 1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    </motion.div>
  )
}