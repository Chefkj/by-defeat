import React, { useEffect, useRef } from 'react';
import './AudioVisualizer.css';

const AudioVisualizer = ({ isPlaying, theme }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = 50;
      
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.1,
          hue: Math.random() * 360
        });
      }
    };

    initParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      if (isPlaying) {
        // Update and draw particles
        particlesRef.current.forEach((particle, index) => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          // Wrap around edges
          if (particle.x < 0) particle.x = canvas.offsetWidth;
          if (particle.x > canvas.offsetWidth) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.offsetHeight;
          if (particle.y > canvas.offsetHeight) particle.y = 0;
          
          // Update based on theme
          let color;
          switch (theme) {
            case 'energetic':
              color = `hsla(${(particle.hue + Date.now() * 0.1) % 360}, 70%, 60%, ${particle.opacity})`;
              particle.radius = Math.sin(Date.now() * 0.01 + index) * 2 + 3;
              break;
            case 'mellow':
              color = `hsla(${200 + Math.sin(Date.now() * 0.005 + index) * 60}, 60%, 70%, ${particle.opacity})`;
              break;
            case 'dark':
              color = `hsla(0, 0%, ${20 + Math.sin(Date.now() * 0.003 + index) * 30}%, ${particle.opacity * 0.5})`;
              break;
            case 'bright':
              color = `hsla(${180 + Math.sin(Date.now() * 0.008 + index) * 40}, 80%, 60%, ${particle.opacity})`;
              break;
            default:
              color = `hsla(${220 + Math.sin(Date.now() * 0.005 + index) * 40}, 60%, 60%, ${particle.opacity})`;
          }
          
          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          
          // Draw connections to nearby particles
          particlesRef.current.forEach((otherParticle, otherIndex) => {
            if (index !== otherIndex) {
              const dx = particle.x - otherParticle.x;
              const dy = particle.y - otherParticle.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 150) {
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(otherParticle.x, otherParticle.y);
                ctx.strokeStyle = color.replace(/[\d.]+\)$/g, `${particle.opacity * 0.3})`);
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          });
        });
      } else {
        // Static visualization when paused
        particlesRef.current.forEach((particle) => {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(220, 30%, 40%, ${particle.opacity * 0.3})`;
          ctx.fill();
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, theme]);

  return (
    <div className={`audio-visualizer theme-${theme}`}>
      <canvas ref={canvasRef} className="visualizer-canvas" />
      <div className="background-gradient" />
      <div className="wave-effect">
        <div className="wave wave1" />
        <div className="wave wave2" />
        <div className="wave wave3" />
      </div>
    </div>
  );
};

export default AudioVisualizer;