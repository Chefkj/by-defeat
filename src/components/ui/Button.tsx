import React from 'react'

interface MusicButtonProps {
  onClick: () => void
  children: React.ReactNode
  type?: 'play' | 'skip' | 'volume'
  className?: string
}

export const MusicButton: React.FC<MusicButtonProps> = ({
  onClick,
  children,
  type = 'play',
  className = ''
}) => {
  const baseClasses = 'transition-all duration-200 focus:outline-none'
  
  const typeClasses = {
    play: 'bg-white/10 hover:bg-white/20 text-white rounded-full p-3 hover:scale-105 active:scale-95',
    skip: 'bg-transparent hover:bg-white/10 text-white rounded-full p-2',
    volume: 'bg-transparent hover:bg-white/10 text-white/70 hover:text-white p-1'
  }

  return (
    <button
      className={`${baseClasses} ${typeClasses[type]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}