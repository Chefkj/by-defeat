import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MusicButton } from '../ui/Button'
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-500 text-white rounded-md">
              {error}
            </div>
          )}
          
          <MusicButton
            type="play"
            onClick={handleSpotifyAuth}
            className="spotify-auth-button"
          >
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connect with Spotify
          </MusicButton>

          <MusicButton
            type="skip"
            onClick={handleDemoMode}
            className="mt-4 bg-gray-600 hover:bg-gray-700"
          >
            Try Demo Mode
          </MusicButton>
        </motion.div>
      </div>
    </div>
  )
}