import React from 'react'
import { motion } from 'framer-motion'
import { usePlayer } from '../../hooks/usePlayer'
import { Button } from '../ui/button'
import { Slider } from '../ui/slider'
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

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  const handleProgressChange = (value: number[]) => {
    setProgress(value[0])
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
        <Slider
          value={[progress]}
          onValueChange={handleProgressChange}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0:00</span>
          <span>3:42</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={previous}
          className="h-10 w-10 rounded-full hover:bg-white/10"
        >
          <SkipBack className="h-5 w-5" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={handlePlayPause}
          className="h-14 w-14 rounded-full bg-white text-black hover:bg-white/90 hover:scale-105 transition-transform"
        >
          {isPlaying ? (
            <Pause className="h-7 w-7" />
          ) : (
            <Play className="h-7 w-7" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          className="h-10 w-10 rounded-full hover:bg-white/10"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-4 w-full max-w-xs">
        <Volume2 className="h-5 w-5 text-gray-400" />
        <Slider
          value={[volume * 100]}
          onValueChange={(value) => handleVolumeChange([value[0] / 100])}
          max={100}
          step={1}
          className="w-full"
        />
      </div>
    </motion.div>
  )
}