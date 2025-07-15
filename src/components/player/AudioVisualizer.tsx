import React, { useEffect, useRef, useCallback } from 'react'
import type { ThemeType } from '../../types/spotify'

interface AudioVisualizerProps {
  isPlaying: boolean
  theme: ThemeType
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const particlesRef = useRef<Particle[]>([])
  const wavePointsRef = useRef<WavePoint[]>([])
  const pulseRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    alpha: number
    color: string
    life: number
    maxLife: number
    baseSize: number
    frequency: number
    amplitude: number
  }

  interface WavePoint {
    x: number
    y: number
    baseY: number
    amplitude: number
    frequency: number
    phase: number
    color: string
  }

  const getThemeColors = (theme: ThemeType): string[] => {
    switch (theme) {
      case 'energetic':
        return ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff', '#ff6348', '#ffa502']
      case 'mellow':
        return ['#74b9ff', '#a29bfe', '#6c5ce7', '#00b894', '#55a3ff', '#81ecec']
      case 'dark':
        return ['#2d3436', '#636e72', '#b2bec3', '#ddd', '#74b9ff', '#a29bfe']
      case 'bright':
        return ['#00cec9', '#fd79a8', '#fdcb6e', '#6c5ce7', '#ff7675', '#00b894']
      default:
        return ['#1e3c72', '#2a5298', '#74b9ff', '#0984e3', '#6c5ce7', '#55a3ff']
    }
  }

  const getThemeIntensity = (theme: ThemeType): number => {
    switch (theme) {
      case 'energetic':
        return 1.5
      case 'mellow':
        return 0.6
      case 'dark':
        return 0.8
      case 'bright':
        return 1.2
      default:
        return 1.0
    }
  }

  const createParticle = useCallback((colors: string[], intensity: number): Particle => {
    const canvas = canvasRef.current
    if (!canvas) return {} as Particle

    const baseSize = Math.random() * 4 + 2
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8 * intensity,
      vy: (Math.random() - 0.5) * 0.8 * intensity,
      size: baseSize,
      baseSize,
      alpha: Math.random() * 0.6 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: Math.random() * 1500 + 1000,
      frequency: Math.random() * 0.02 + 0.01,
      amplitude: Math.random() * 3 + 1,
    }
  }, [])

  const createWavePoint = useCallback((x: number, baseY: number, colors: string[]): WavePoint => {
    return {
      x,
      y: baseY,
      baseY,
      amplitude: Math.random() * 50 + 20,
      frequency: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }
  }, [])

  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    const particles = particlesRef.current
    const maxDistance = 120
    const connectionAlpha = 0.15

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          const alpha = (maxDistance - distance) / maxDistance * connectionAlpha
          const gradient = ctx.createLinearGradient(
            particles[i].x, particles[i].y,
            particles[j].x, particles[j].y
          )
          gradient.addColorStop(0, particles[i].color)
          gradient.addColorStop(1, particles[j].color)
          
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.strokeStyle = gradient
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
          ctx.restore()
        }
      }
    }
  }

  const drawAudioWaves = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const waves = wavePointsRef.current
    const time = timeRef.current

    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 2

    for (let i = 0; i < waves.length - 1; i++) {
      const wave = waves[i]
      const nextWave = waves[i + 1]
      
      // Calculate wave position with simulated audio reactivity
      const waveOffset = Math.sin(time * wave.frequency + wave.phase) * wave.amplitude
      const nextWaveOffset = Math.sin(time * nextWave.frequency + nextWave.phase) * nextWave.amplitude
      
      wave.y = wave.baseY + waveOffset
      nextWave.y = nextWave.baseY + nextWaveOffset

      // Draw wave segment
      ctx.strokeStyle = wave.color
      ctx.beginPath()
      ctx.moveTo(wave.x, wave.y)
      ctx.lineTo(nextWave.x, nextWave.y)
      ctx.stroke()
    }
    ctx.restore()
  }, [])

  const drawPulseEffect = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const pulse = pulseRef.current
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.3

    // Create multiple pulse rings
    for (let i = 0; i < 3; i++) {
      const offset = i * 0.3
      const radius = (pulse + offset) * maxRadius
      const alpha = Math.max(0, 0.1 - (pulse + offset) * 0.1)

      if (alpha > 0) {
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.strokeStyle = getThemeColors(theme)[i % getThemeColors(theme).length]
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    }
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const colors = getThemeColors(theme)
    const intensity = getThemeIntensity(theme)
    
    // Initialize particles
    particlesRef.current = []
    const particleCount = 120
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(createParticle(colors, intensity))
    }

    // Initialize wave points
    wavePointsRef.current = []
    const wavePointCount = 20
    for (let i = 0; i < wavePointCount; i++) {
      const x = (i / (wavePointCount - 1)) * canvas.width
      const baseY = canvas.height * 0.7 + Math.random() * 100 - 50
      wavePointsRef.current.push(createWavePoint(x, baseY, colors))
    }

    // Animation loop
    const animateLoop = () => {
      timeRef.current += 0.016 // ~60fps
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create enhanced gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      )
      
      const bgColors = getThemeColors(theme)
      gradient.addColorStop(0, `${bgColors[0]}0A`)
      gradient.addColorStop(0.5, `${bgColors[1]}05`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update pulse effect
      pulseRef.current = (pulseRef.current + 0.02) % 3

      // Draw audio waves
      drawAudioWaves(ctx)

      // Draw pulse effect
      drawPulseEffect(ctx)

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update position with audio-reactive movement
        const audioEffect = Math.sin(timeRef.current * particle.frequency) * particle.amplitude
        particle.x += particle.vx + audioEffect * 0.1
        particle.y += particle.vy + audioEffect * 0.1
        particle.life++

        // Audio-reactive size pulsing
        const sizeMultiplier = 1 + Math.sin(timeRef.current * particle.frequency * 2) * 0.3
        particle.size = particle.baseSize * sizeMultiplier * intensity

        // Respawn particle if it's out of bounds or dead
        if (particle.x < -50 || particle.x > canvas.width + 50 || 
            particle.y < -50 || particle.y > canvas.height + 50 || 
            particle.life > particle.maxLife) {
          particlesRef.current[index] = createParticle(colors, intensity)
          return
        }

        // Calculate alpha based on life and audio effect
        const lifeRatio = particle.life / particle.maxLife
        const audioAlpha = 0.5 + Math.sin(timeRef.current * particle.frequency * 3) * 0.3
        const alpha = particle.alpha * (1 - lifeRatio) * audioAlpha

        // Draw particle with enhanced glow
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 30
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Add inner glow
        ctx.save()
        ctx.globalAlpha = alpha * 0.7
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // Draw connections between nearby particles
      drawConnections(ctx)

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animateLoop)
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    if (isPlaying) {
      animateLoop()
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, theme, createParticle, createWavePoint, drawAudioWaves, drawPulseEffect])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ background: 'transparent' }}
    />
  )
}