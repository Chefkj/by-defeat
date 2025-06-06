import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'
  const hoverClasses = hoverable
    ? 'hover:shadow-lg transition-shadow cursor-pointer'
    : ''
  const classes = `${baseClasses} ${hoverClasses} ${className}`

  const CardComponent = hoverable ? motion.div : 'div'
  const motionProps = hoverable
    ? {
        whileHover: { y: -4 },
        transition: { duration: 0.2 },
      }
    : {}

  return (
    <CardComponent className={classes} {...motionProps}>
      {children}
    </CardComponent>
  )
}
