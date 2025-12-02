import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { generateAuthUrl } from '../../services/spotify'

interface SpotifyAuthProps {
  onAuthSuccess: (token: string) => void
}

export const SpotifyAuth: React.FC<SpotifyAuthProps> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSpotifyAuth = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Check if we have required config
      if (!import.meta.env.VITE_SPOTIFY_CLIENT_ID || import.meta.env.VITE_SPOTIFY_CLIENT_ID === 'your_spotify_client_id') {
        throw new Error('Spotify Client ID not configured')
      }
      
      console.log('Generating auth URL...')
      const authUrl = await generateAuthUrl()
      
      // Validate the URL was generated
      if (!authUrl || !authUrl.includes('accounts.spotify.com')) {
        throw new Error('Failed to generate valid Spotify auth URL')
      }
      
      // Verify code verifier was stored in either storage
      const verifier = localStorage.getItem('spotify_code_verifier') || sessionStorage.getItem('spotify_code_verifier')
      console.log('Code verifier stored:', !!verifier)
      console.log('Storage location:', localStorage.getItem('spotify_code_verifier') ? 'localStorage' : 'sessionStorage')
      
      if (!verifier) {
        throw new Error('Failed to store code verifier in any storage')
      }
      
      // Small delay to ensure localStorage is persisted
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('Redirecting to Spotify auth...')
      window.location.href = authUrl
    } catch (err) {
      console.error('Spotify auth error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start Spotify authentication')
      setIsLoading(false)
    }
  }

  const handleDemoMode = () => {
    // Handle demo mode
    onAuthSuccess('demo_mode')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">By Defeat</h1>
          <p className="text-gray-300">Connect with Spotify to experience the full music player</p>
        </motion.div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-4"
        >
          <Button
            size="lg"
            onClick={handleSpotifyAuth}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Connect with Spotify
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={handleDemoMode}
            className="w-full"
          >
            Try Demo Mode
          </Button>
        </motion.div>
      </div>
    </div>
  )
}