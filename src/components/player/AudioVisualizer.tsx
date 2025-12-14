import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { ThemeType, SpotifyTrack, AudioFeatures } from '../../types/spotify'

interface AudioVisualizerProps {
  isPlaying: boolean
  theme: ThemeType
  currentTrack?: SpotifyTrack
  audioFeatures?: AudioFeatures
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  isPlaying, 
  theme, 
  currentTrack, 
  audioFeatures 
}) => {
  const [time, setTime] = useState(0)
  const [beatPulse, setBeatPulse] = useState(0)

  // Audio feature values with defaults
  const energy = audioFeatures?.energy || 0.5
  const valence = audioFeatures?.valence || 0.5
  const tempo = audioFeatures?.tempo || 120
  const danceability = audioFeatures?.danceability || 0.5

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return

    let animationId: number
    let lastBeatTime = 0
    const beatInterval = (60 / tempo) * 1000 // ms between beats

    const animate = () => {
      setTime(t => t + 0.016) // ~60fps
      
      // Beat detection
      const now = Date.now()
      if (now - lastBeatTime > beatInterval) {
        setBeatPulse(1)
        lastBeatTime = now
        setTimeout(() => setBeatPulse(0), 150)
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [isPlaying, tempo])

  const getThemeColors = (): string[] => {
    switch (theme) {
      case 'energetic':
        return ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff']
      case 'mellow':
        return ['#74b9ff', '#a29bfe', '#6c5ce7', '#00b894']
      case 'dark':
        return ['#2d3436', '#636e72', '#b2bec3', '#ddd']
      case 'bright':
        return ['#00cec9', '#fd79a8', '#fdcb6e', '#6c5ce7']
      default:
        return ['#1e3c72', '#2a5298', '#74b9ff', '#0984e3']
    }
  }

  const colors = getThemeColors()

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <svg 
        className="w-full h-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradient definitions */}
          <radialGradient id="pulseGradient">
            <stop offset="0%" stopColor={colors[0]} stopOpacity={energy * 0.8} />
            <stop offset="50%" stopColor={colors[1]} stopOpacity={energy * 0.4} />
            <stop offset="100%" stopColor={colors[2]} stopOpacity="0" />
          </radialGradient>
          
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {colors.map((color, i) => (
              <stop 
                key={i}
                offset={`${(i / colors.length) * 100}%`} 
                stopColor={color}
                stopOpacity={0.6}
              />
            ))}
          </linearGradient>

          {/* Blur filter for glow effects */}
          <filter id="glow">
            <feGaussianBlur stdDeviation={3 + energy * 5} result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background animated gradient */}
        <motion.rect
          width="1000"
          height="1000"
          fill="url(#flowGradient)"
          opacity={0.3 + valence * 0.2}
          animate={{
            rotate: time * 2,
          }}
          transition={{ duration: 0 }}
        />

        {/* Central pulsing orb */}
        <motion.circle
          cx="500"
          cy="500"
          r={150 + energy * 100}
          fill="url(#pulseGradient)"
          filter="url(#glow)"
          animate={{
            scale: 1 + beatPulse * 0.3 + Math.sin(time * 2) * 0.1,
            rotate: time * 20,
          }}
          transition={{ duration: 0 }}
        />

        {/* Rotating geometric shapes - Kaleidoscope effect */}
        {[...Array(8)].map((_, i) => (
          <motion.g
            key={i}
            animate={{
              rotate: time * 30 + (i * 45),
            }}
            style={{ originX: '500px', originY: '500px' }}
            transition={{ duration: 0 }}
          >
            <motion.polygon
              points="500,300 550,400 450,400"
              fill={colors[i % colors.length]}
              opacity={0.3 + energy * 0.4}
              filter="url(#glow)"
              animate={{
                scale: 1 + Math.sin(time * 3 + i) * 0.2 + beatPulse * 0.2,
              }}
              style={{ originX: '500px', originY: '350px' }}
              transition={{ duration: 0 }}
            />
          </motion.g>
        ))}

        {/* Orbiting particles with 3D-like rotation */}
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const radius = 250 + Math.sin(time + i) * 50
          const x = 500 + Math.cos(angle + time * danceability) * radius
          const y = 500 + Math.sin(angle + time * danceability) * radius
          const z = Math.sin(time * 2 + i) * 0.5 + 0.5 // simulated depth

          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r={5 + energy * 10}
              fill={colors[i % colors.length]}
              opacity={0.6 * z + beatPulse * 0.4}
              filter="url(#glow)"
              animate={{
                scale: 1 + beatPulse * 0.5,
              }}
              transition={{ duration: 0 }}
            />
          )
        })}

        {/* Wave lines - flowing based on valence */}
        {[...Array(5)].map((_, i) => {
          const pathD = `M 0,${400 + i * 40} Q 250,${380 + Math.sin(time * 2 + i) * 60} 500,${400 + i * 40} T 1000,${400 + i * 40}`
          
          return (
            <motion.path
              key={i}
              d={pathD}
              stroke={colors[i % colors.length]}
              strokeWidth={2 + energy * 3}
              fill="none"
              opacity={0.4 + valence * 0.3}
              filter="url(#glow)"
              animate={{
                pathLength: [0, 1],
                strokeDashoffset: [0, -100],
              }}
              transition={{
                pathLength: { duration: 2, repeat: Infinity },
                strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear" },
              }}
              strokeDasharray="20 10"
            />
          )
        })}

        {/* Energy bars - spectrum analyzer style */}
        {[...Array(16)].map((_, i) => {
          const x = 100 + i * 50
          const rawHeight = 100 + Math.sin(time * 4 + i * 0.5) * energy * 150 + beatPulse * 100
          const height = Math.max(10, rawHeight) // Ensure height is always positive
          
          return (
            <motion.rect
              key={i}
              x={x}
              y={900 - height}
              width={30}
              height={height}
              fill={colors[i % colors.length]}
              opacity={0.6 + energy * 0.3}
              filter="url(#glow)"
              rx={5}
              animate={{
                scaleY: 1 + beatPulse * 0.3,
              }}
              style={{ originY: '900px' }}
              transition={{ duration: 0 }}
            />
          )
        })}

        {/* Spinning rings with 3D perspective */}
        {[...Array(3)].map((_, i) => {
          const ringSize = 200 + i * 80
          
          return (
            <motion.ellipse
              key={i}
              cx="500"
              cy="500"
              rx={ringSize}
              ry={ringSize * (0.3 + Math.sin(time + i) * 0.2)} // Creates 3D effect
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth={2 + energy * 2}
              opacity={0.4 - i * 0.1}
              filter="url(#glow)"
              animate={{
                rotate: time * (15 - i * 5),
                scale: 1 + beatPulse * 0.2,
              }}
              style={{ originX: '500px', originY: '500px' }}
              transition={{ duration: 0 }}
            />
          )
        })}

        {/* Morphing blob - changes shape based on audio features */}
        <motion.path
          d={`
            M 500,${300 + Math.sin(time) * 50 * energy}
            Q ${600 + Math.cos(time * 1.5) * 80 * valence},${350 + Math.sin(time * 2) * 60}
            ${500 + Math.sin(time * 3) * 70},${500 + Math.cos(time) * 50 * danceability}
            T ${400 + Math.cos(time * 2.5) * 80},${350 + Math.sin(time * 1.5) * 60}
            ${500},${300 + Math.sin(time) * 50 * energy}
          `}
          fill={colors[0]}
          opacity={0.2 + energy * 0.3}
          filter="url(#glow)"
          animate={{
            scale: 1 + beatPulse * 0.3,
            rotate: time * 10,
          }}
          style={{ originX: '500px', originY: '400px' }}
          transition={{ duration: 0 }}
        />

        {/* Track info overlay (optional) */}
        {currentTrack && (
          <g opacity={0.8}>
            <text
              x="500"
              y="50"
              textAnchor="middle"
              fill={colors[0]}
              fontSize="24"
              fontWeight="bold"
              filter="url(#glow)"
            >
              {currentTrack.name}
            </text>
            <text
              x="500"
              y="80"
              textAnchor="middle"
              fill={colors[1]}
              fontSize="18"
            >
              {currentTrack.artist}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
