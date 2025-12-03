import React from 'react'
import { motion } from 'framer-motion'
import { usePlayer } from '../../hooks/usePlayer'
import type { ThemeType } from '../../types/spotify'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'

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

  const handleVolumeChange = (value: number) => {
    setVolume(value / 100)
  }

  const handleProgressChange = (value: number) => {
    setProgress(value)
  }

  return (
    <motion.div
      className="flex flex-col items-center space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Progress bar */}
      <div className="w-full max-w-md">
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => handleProgressChange(Number(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0:00</span>
          <span>3:42</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={previous}
          className="h-10 w-10 rounded-full hover:bg-white/10 transition-all duration-200 flex items-center justify-center focus:outline-none text-white"
        >
          <SkipBack className="h-5 w-5" />
        </button>

        <button
          onClick={handlePlayPause}
          className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </button>

        <button
          onClick={next}
          className="h-10 w-10 rounded-full hover:bg-white/10 transition-all duration-200 flex items-center justify-center focus:outline-none text-white"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-4 w-full max-w-xs">
        <Volume2 className="h-5 w-5 text-gray-400" />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={volume * 100}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    </motion.div>
  )
}