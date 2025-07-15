import React, { useEffect, useRef, useCallback } from 'react'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const particlesRef = useRef<Particle[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const beatDetectionRef = useRef({ lastBeat: 0, energy: 0, threshold: 0.3 })

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
    energy: number
  }

  const getThemeColors = (theme: ThemeType, audioFeatures?: AudioFeatures): string[] => {
    let baseColors: string[]
    
    switch (theme) {
      case 'energetic':
        baseColors = ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff']
        break
      case 'mellow':
        baseColors = ['#74b9ff', '#a29bfe', '#6c5ce7', '#00b894']
        break
      case 'dark':
        baseColors = ['#2d3436', '#636e72', '#b2bec3', '#ddd']
        break
      case 'bright':
        baseColors = ['#00cec9', '#fd79a8', '#fdcb6e', '#6c5ce7']
        break
      default:
        baseColors = ['#1e3c72', '#2a5298', '#74b9ff', '#0984e3']
    }
    
    // Modify colors based on audio features
    if (audioFeatures) {
      const { valence, energy, danceability } = audioFeatures
      
      // High valence (happy) = brighter colors
      if (valence > 0.7) {
        baseColors = baseColors.map(color => {
          // Brighten colors for happy tracks
          return color.replace(/#/, '#').replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/, (_, r, g, b) => {
            const rVal = Math.min(255, parseInt(r, 16) + 30)
            const gVal = Math.min(255, parseInt(g, 16) + 30)
            const bVal = Math.min(255, parseInt(b, 16) + 30)
            return `#${rVal.toString(16).padStart(2, '0')}${gVal.toString(16).padStart(2, '0')}${bVal.toString(16).padStart(2, '0')}`
          })
        })
      }
      
      // Low valence (sad) = darker colors
      if (valence < 0.3) {
        baseColors = baseColors.map(color => {
          return color.replace(/#/, '#').replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/, (_, r, g, b) => {
            const rVal = Math.max(0, parseInt(r, 16) - 30)
            const gVal = Math.max(0, parseInt(g, 16) - 30)
            const bVal = Math.max(0, parseInt(b, 16) - 30)
            return `#${rVal.toString(16).padStart(2, '0')}${gVal.toString(16).padStart(2, '0')}${bVal.toString(16).padStart(2, '0')}`
          })
        })
      }
      
      // High energy = add more vibrant colors
      if (energy > 0.7) {
        baseColors.push('#ff0844', '#ffb347', '#ff6b6b')
      }
      
      // High danceability = add rhythmic colors
      if (danceability > 0.7) {
        baseColors.push('#9b59b6', '#e74c3c', '#f39c12')
      }
    }
    
    return baseColors
  }

  const createParticle = useCallback((colors: string[], audioFeatures?: AudioFeatures): Particle => {
    const canvas = canvasRef.current
    if (!canvas) return {} as Particle

    const energy = audioFeatures?.energy || 0.5
    const tempo = audioFeatures?.tempo || 120
    // const danceabilityMultiplier = 0.5 + danceability * 1.5 // Removed unused variable
    
    // Energy affects particle size and speed
    const energyMultiplier = 0.5 + energy * 1.5
    const tempoMultiplier = 0.5 + (tempo / 200) * 1.5

    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.0 * energyMultiplier,
      vy: (Math.random() - 0.5) * 1.0 * energyMultiplier,
      size: (Math.random() * 4 + 2) * energyMultiplier,
      alpha: (Math.random() * 0.6 + 0.4) * energyMultiplier,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: (Math.random() * 1200 + 800) * tempoMultiplier,
      energy: energy
    }
  }, [])

  const drawCircularSpectrum = useCallback((ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    if (!dataArrayRef.current) return
    
    const bufferLength = dataArrayRef.current.length
    const barWidth = (2 * Math.PI) / bufferLength
    
    ctx.save()
    ctx.translate(centerX, centerY)
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArrayRef.current[i] / 255) * radius * 0.5
      const angle = (i / bufferLength) * 2 * Math.PI
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, radius, 0, radius + barHeight)
      const colors = getThemeColors(theme, audioFeatures)
      gradient.addColorStop(0, colors[i % colors.length])
      gradient.addColorStop(1, colors[(i + 1) % colors.length])
      
      ctx.fillStyle = gradient
      ctx.globalAlpha = 0.9
      
      ctx.save()
      ctx.rotate(angle)
      ctx.fillRect(-barWidth / 2, radius, barWidth * 2, barHeight)
      ctx.restore()
    }
    
    ctx.restore()
  }, [theme, audioFeatures])

  const drawBeatPulse = useCallback((ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    if (!audioFeatures || !dataArrayRef.current) return
    
    const now = Date.now()
    const tempo = audioFeatures.tempo || 120
    const beatInterval = (60 / tempo) * 1000 // milliseconds between beats
    
    // Calculate average energy for beat detection
    let totalEnergy = 0
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      totalEnergy += dataArrayRef.current[i]
    }
    const avgEnergy = totalEnergy / dataArrayRef.current.length / 255
    
    // Beat detection: energy spike above threshold
    if (avgEnergy > beatDetectionRef.current.threshold && 
        now - beatDetectionRef.current.lastBeat > beatInterval * 0.8) {
      beatDetectionRef.current.lastBeat = now
      beatDetectionRef.current.energy = avgEnergy
    }
    
    // Draw pulse effect
    const timeSinceLastBeat = now - beatDetectionRef.current.lastBeat
    const pulseDecay = Math.max(0, 1 - (timeSinceLastBeat / (beatInterval * 0.5)))
    
    if (pulseDecay > 0) {
      const pulseSize = 80 + (beatDetectionRef.current.energy * 150) * pulseDecay
      const colors = getThemeColors(theme, audioFeatures)
      
      ctx.save()
      ctx.globalAlpha = pulseDecay * 0.5
      ctx.strokeStyle = colors[0]
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseSize, 0, 2 * Math.PI)
      ctx.stroke()
      
      ctx.globalAlpha = pulseDecay * 0.2
      ctx.fillStyle = colors[0]
      ctx.fill()
      ctx.restore()
    }
  }, [theme, audioFeatures])

  const drawAlbumArtEffect = useCallback((ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    if (!currentTrack?.image) return
    
    const valence = audioFeatures?.valence || 0.5
    
    // Create a subtle glow effect around where album art would be
    const glowSize = 150 + ((audioFeatures?.energy || 0.5) * 100)
    const glowIntensity = 0.1 + (valence * 0.2)
    
    ctx.save()
    ctx.globalAlpha = glowIntensity
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, glowSize
    )
    
    const colors = getThemeColors(theme, audioFeatures)
    gradient.addColorStop(0, colors[0])
    gradient.addColorStop(0.5, colors[1])
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.fillRect(centerX - glowSize, centerY - glowSize, glowSize * 2, glowSize * 2)
    ctx.restore()
  }, [currentTrack, theme, audioFeatures])

  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    const particles = particlesRef.current
    const maxDistance = 100

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          const alpha = (maxDistance - distance) / maxDistance * 0.1
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.strokeStyle = particles[i].color
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
          ctx.restore()
        }
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    // Initialize audio context for frequency analysis (mock data for now)
    const initializeAudio = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        }
        
        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser()
          analyserRef.current.fftSize = 256
          const bufferLength = analyserRef.current.frequencyBinCount
          dataArrayRef.current = new Uint8Array(bufferLength)
        }
        
        // Generate mock frequency data for visualization
        if (dataArrayRef.current) {
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const frequency = i / dataArrayRef.current.length
            
            // Create realistic-looking frequency data
            const baseLevel = 50 + ((audioFeatures?.energy || 0.5) * 100)
            const variation = Math.sin(Date.now() * 0.005 + frequency * 10) * 70
            const tempoEffect = Math.sin(Date.now() * ((audioFeatures?.tempo || 120) / 60) * 0.005) * 30
            
            dataArrayRef.current[i] = Math.max(0, Math.min(255, baseLevel + variation + tempoEffect))
          }
        }
      } catch (error) {
        console.log('Audio context not available, using mock data')
        // Handle the error appropriately
        console.error('Audio context initialization failed:', error)
      }
    }

    const colors = getThemeColors(theme, audioFeatures)
    
    // Initialize particles with enhanced features
    particlesRef.current = []
    const baseParticleCount = 80
    const energyMultiplier = audioFeatures?.energy ? 1 + audioFeatures.energy * 0.8 : 1.5
    const particleCount = Math.floor(baseParticleCount * energyMultiplier)
    
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(createParticle(colors, audioFeatures))
    }

    // Enhanced animation loop
    const animateLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      initializeAudio()

      // Create dynamic gradient background based on valence
      const valence = audioFeatures?.valence || 0.5
      // const energy = audioFeatures?.energy || 0.5 // Removed unused variable
      
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      )
      
      // Adjust background based on mood
      if (valence > 0.7) {
        // Happy - brighter background
        gradient.addColorStop(0, `rgba(${Math.floor(valence * 80)}, ${Math.floor(valence * 80)}, ${Math.floor(valence * 100)}, 0.3)`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)')
      } else if (valence < 0.3) {
        // Sad - darker background
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)')
      } else {
        // Neutral - add some energy-based color
        const energyColor = Math.floor((audioFeatures?.energy || 0.5) * 100)
        gradient.addColorStop(0, `rgba(${energyColor}, ${energyColor * 0.8}, ${energyColor * 1.2}, 0.2)`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)')
      }
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Draw album art effect
      drawAlbumArtEffect(ctx, centerX, centerY)

      // Draw circular spectrum analyzer
      drawCircularSpectrum(ctx, centerX, centerY, Math.min(canvas.width, canvas.height) * 0.15)

      // Draw beat pulse effect
      drawBeatPulse(ctx, centerX, centerY)

      // Update and draw enhanced particles
      particlesRef.current.forEach((particle, index) => {
        // Update position with energy-based movement
        const energyBoost = particle.energy * 0.5
        particle.x += particle.vx * (1 + energyBoost)
        particle.y += particle.vy * (1 + energyBoost)
        particle.life++

        // Respawn particle if it's out of bounds or dead
        if (particle.x < 0 || particle.x > canvas.width || 
            particle.y < 0 || particle.y > canvas.height || 
            particle.life > particle.maxLife) {
          particlesRef.current[index] = createParticle(colors, audioFeatures)
          return
        }

        // Calculate alpha based on life and energy
        const lifeRatio = particle.life / particle.maxLife
        const alpha = particle.alpha * (1 - lifeRatio) * (1 + particle.energy * 0.5)

        // Draw particle with enhanced effects
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Enhanced glow effect based on energy
        const glowIntensity = 0.3 + (particle.energy * 0.4)
        ctx.save()
        ctx.globalAlpha = alpha * glowIntensity
        ctx.shadowBlur = 15 + (particle.energy * 15)
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // Draw connections between nearby particles with energy influence
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
  }, [isPlaying, theme, audioFeatures, currentTrack, createParticle, drawCircularSpectrum, drawBeatPulse, drawAlbumArtEffect])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ background: 'transparent' }}
    />
  )
}