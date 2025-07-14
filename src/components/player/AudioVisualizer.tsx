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
  }

  const getThemeColors = (theme: ThemeType): string[] => {
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

  const createParticle = useCallback((colors: string[]): Particle => {
    const canvas = canvasRef.current
    if (!canvas) return {} as Particle

    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.5 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: Math.random() * 1000 + 500,
    }
  }, [])

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

    const colors = getThemeColors(theme)
    
    // Initialize particles
    particlesRef.current = []
    const particleCount = 150
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(createParticle(colors))
    }

    // Animation loop
    const animateLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      )
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life++

        // Respawn particle if it's out of bounds or dead
        if (particle.x < 0 || particle.x > canvas.width || 
            particle.y < 0 || particle.y > canvas.height || 
            particle.life > particle.maxLife) {
          particlesRef.current[index] = createParticle(colors)
          return
        }

        // Calculate alpha based on life
        const lifeRatio = particle.life / particle.maxLife
        const alpha = particle.alpha * (1 - lifeRatio)

        // Draw particle
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Add subtle glow effect
        ctx.save()
        ctx.globalAlpha = alpha * 0.5
        ctx.shadowBlur = 20
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2)
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
  }, [isPlaying, theme, createParticle])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ background: 'transparent' }}
    />
  )
}