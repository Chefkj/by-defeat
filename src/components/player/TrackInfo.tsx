import React from 'react'
import { motion } from 'framer-motion'
import type { SpotifyTrack, ThemeType } from '../../types/spotify'

interface TrackInfoProps {
  track: SpotifyTrack | null
  theme: ThemeType
}

export const TrackInfo: React.FC<TrackInfoProps> = ({ track, theme }) => {
  if (!track) {
    return (
      <motion.div
        className="text-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-gray-400">No track selected</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="text-center py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Album artwork */}
      <motion.div
        className="relative mx-auto mb-6 w-64 h-64 rounded-lg overflow-hidden shadow-2xl"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {track.image || track.coverArt ? (
          <img
            src={track.image || track.coverArt}
            alt={track.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <svg className="w-20 h-20 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {/* Animated overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 theme-${theme}-overlay`} />
      </motion.div>

      {/* Track info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold mb-2 text-white">{track.name}</h2>
        <p className="text-xl text-gray-300 mb-4">{track.artist}</p>
        {track.album && (
          <p className="text-gray-400">{track.album}</p>
        )}
      </motion.div>

      {/* Spotify link */}
      {track.external_urls?.spotify && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <a
            href={track.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zM8.5 14.5c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75z" clipRule="evenodd" />
            </svg>
            <span>Listen on Spotify</span>
          </a>
        </motion.div>
      )}
    </motion.div>
  )
}