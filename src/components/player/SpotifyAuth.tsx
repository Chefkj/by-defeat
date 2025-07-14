import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { SPOTIFY_AUTH_URL, generateCodeVerifier, generateCodeChallenge, exchangeCodeForToken } from '../../services/spotify'

interface SpotifyAuthProps {
  onAuthSuccess: (token: string) => void
}

export const SpotifyAuth: React.FC<SpotifyAuthProps> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async (code: string) => {
      setIsLoading(true)
      try {
        const codeVerifier = localStorage.getItem('spotify_code_verifier')
        if (!codeVerifier) {
          throw new Error('Code verifier not found')
        }

        const tokenResponse = await exchangeCodeForToken(code, codeVerifier)
        onAuthSuccess(tokenResponse.access_token)
        
        // Clean up
        localStorage.removeItem('spotify_code_verifier')
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        console.error('Token exchange failed:', error)
        setError('Authentication failed. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    // Check if we're returning from Spotify auth
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')

    if (error) {
      setError('Authentication failed. Please try again.')
      return
    }

    if (code) {
      handleAuthCallback(code)
    }
  }, [onAuthSuccess])

  const handleSpotifyAuth = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      
      // Store code verifier for later use
      localStorage.setItem('spotify_code_verifier', codeVerifier)
      
      // Build auth URL with PKCE
      const authUrl = `${SPOTIFY_AUTH_URL}&code_challenge=${codeChallenge}&code_challenge_method=S256`
      
      // Redirect to Spotify
      window.location.href = authUrl
    } catch (error) {
      console.error('Authentication error:', error)
      setError('Failed to initialize authentication. Please try again.')
      setIsLoading(false)
    }
  }

  const handleDemoMode = () => {
    setDemoMode(true)
    // Generate a fake token for demo purposes
    const demoToken = 'demo_token_' + Date.now()
    setTimeout(() => {
      onAuthSuccess(demoToken)
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
        <p className="text-lg">
          {demoMode ? 'Entering demo mode...' : 'Authenticating with Spotify...'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <motion.div
        className="max-w-md w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">By Defeat</h1>
          <p className="text-gray-300 text-lg">
            Connect your Spotify account to experience the full dynamic music player
          </p>
        </div>

        {error && (
          <motion.div
            className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleSpotifyAuth}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zM8.5 14.5c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm3 0c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75z" clipRule="evenodd" />
            </svg>
            <span>Connect with Spotify</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">or</span>
            </div>
          </div>

          <Button
            onClick={handleDemoMode}
            disabled={isLoading}
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 py-3 px-6 rounded-lg"
          >
            Try Demo Mode
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <p className="mb-2">
            Demo mode allows you to explore the player without Spotify authentication.
          </p>
          <p>
            For the full experience with your music, connect your Spotify account.
          </p>
        </div>
      </motion.div>
    </div>
  )
}