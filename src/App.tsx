import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlayerProvider } from './contexts/PlayerContext'
import { usePlayer } from './hooks/usePlayerContext'
import { MusicPlayer } from './components/player/MusicPlayer'
import { VisualizerDemo } from './components/player/VisualizerDemo'
import { Navigation } from './components/Navigation'
import { useEffect, useState, useRef } from 'react'
import { exchangeCodeForToken, generateAuthUrl } from './services/spotify'

function App() {
  return (
    <PlayerProvider>
      <Router basename="/by-defeat">
        <div className="min-h-screen bg-gray-900 text-white">
          <Routes>
            <Route path="/" element={<><Navigation /><HomePage /></>} />
            <Route path="/music" element={<MusicPage />} />
            <Route path="/about" element={<><Navigation /><AboutPage /></>} />
            <Route path="/callback" element={<CallbackPage />} />
            <Route path="/visualizer" element={<VisualizerDemo />} />
          </Routes>
        </div>
      </Router>
    </PlayerProvider>
  )
}

const HomePage = () => {
  const { state, logout } = usePlayer()
  const isAuthenticated = state.isAuthenticated

  const handleSpotifyConnect = async () => {
    try {
      console.log('Starting fresh authentication flow...')
      
      // Clear ALL existing auth data to ensure completely clean state
      console.log('Clearing all existing auth data...')
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_token_expires_at')
      localStorage.removeItem('spotify_auth_code')
      localStorage.removeItem('spotify_code_verifier')
      localStorage.removeItem('spotify_code_verifier_timestamp')
      localStorage.removeItem('spotify_auth_state')
      sessionStorage.removeItem('spotify_code_verifier')
      sessionStorage.removeItem('spotify_code_verifier_timestamp')
      sessionStorage.removeItem('spotify_auth_state')
      console.log('Cleared all existing auth data')
      
      console.log('Generating auth URL...')
      const authUrl = await generateAuthUrl()
      
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
    } catch (error) {
      console.error('Failed to generate auth URL:', error)
      alert('Failed to start authentication process: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  useEffect(() => {
    // Check if user just authenticated
    const urlParams = new URLSearchParams(window.location.search)
    const authenticated = urlParams.get('authenticated')
    const code = localStorage.getItem('spotify_auth_code')
    
    if (authenticated === 'true' && code) {
      // Clean up the URL
      window.history.replaceState({}, document.title, '/by-defeat/')
    }
  }, [])

  return (
    <div className="min-h-screen">
      <main className="pt-20 p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
          
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded">
                ✅ Successfully connected to Spotify!
              </div>
              <p>You're ready to experience the full music player.</p>
              <div className="flex gap-4">
                <Link 
                  to="/music" 
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Open Music Player
                </Link>
                <Link 
                  to="/visualizer" 
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Try Enhanced Visualizer
                </Link>
                <button 
                  onClick={() => {
                    logout()
                  }}
                  className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p>Welcome to the By Defeat band website. Foundation setup complete!</p>
              <p className="text-gray-400">
                React 19 + Vite + TypeScript + Tailwind CSS + Framer Motion + React Router
              </p>
              <div className="mt-6 space-x-4">
                <Link 
                  to="/music" 
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Experience the Music Player
                </Link>
                <Link 
                  to="/visualizer" 
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Try Enhanced Visualizer
                </Link>
                <button 
                  onClick={handleSpotifyConnect}
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Connect with Spotify
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

const MusicPage = () => {
  return (
    <div className="min-h-screen">
      <MusicPlayer />
    </div>
  )
}

const AboutPage = () => (
  <div className="min-h-screen">
    <main className="pt-20 p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold mb-4">About By Defeat</h2>
        <p className="text-gray-300">Learn more about the band and our music</p>
        
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold">Our Story</h3>
          <p className="text-gray-400">Founded with a passion for creating powerful music that speaks to the soul.</p>
          
          <h3 className="text-xl font-semibold mt-6">Connect With Us</h3>
          <p className="text-gray-400">Follow us on social media and streaming platforms to stay updated with our latest releases.</p>
        </div>
      </motion.div>
    </main>
  </div>
)

import { useNavigate } from 'react-router-dom'

const CallbackPage = () => {
  const { authenticate } = usePlayer()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isExchangingToken = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      console.log('=== Callback Page Loaded ===')
      
      // Prevent duplicate exchanges (React StrictMode & re-mounts)
      if (isExchangingToken.current) {
        console.log('Token exchange already in progress, skipping...')
        return
      }
      
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      
      // If there's no code in URL but we have valid tokens, just navigate to music
      if (!code) {
        const existingToken = localStorage.getItem('spotify_access_token')
        const existingExpiry = localStorage.getItem('spotify_token_expires_at')
        
        if (existingToken && existingExpiry && Date.now() < parseInt(existingExpiry)) {
          console.log('No code in URL but valid token exists, navigating to music...')
          authenticate(existingToken)
          navigate('/music')
          return
        }
        
        console.log('No code and no valid token, redirecting to home...')
        navigate('/')
        return
      }
      
      // We have a code - always exchange it (even if old tokens exist)
      isExchangingToken.current = true
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setError('Authentication timeout - please try again')
        setIsLoading(false)
      }, 30000) // 30 second timeout

      try {
        const state = urlParams.get('state')
        const error = urlParams.get('error')
        
        if (error) {
          console.error('Spotify auth error:', error)
          setError('Authentication failed: ' + error)
          setIsLoading(false)
          clearTimeout(timeoutId)
          return
        }
        
        // Verify state parameter to prevent CSRF and ensure fresh auth
        const storedState = localStorage.getItem('spotify_auth_state') || sessionStorage.getItem('spotify_auth_state')
        if (state && storedState && state !== storedState) {
          console.error('State mismatch:', { received: state, stored: storedState })
          setError('Invalid auth state - please try again')
          setIsLoading(false)
          clearTimeout(timeoutId)
          isExchangingToken.current = false
          return
        }
        
        console.log('Exchanging code for token...')
        console.log('Auth code (first 10 chars):', code.substring(0, 10) + '...')
        const tokens = await exchangeCodeForToken(code)
        console.log('Token exchange successful!', { hasAccessToken: !!tokens.access_token, hasRefreshToken: !!tokens.refresh_token })
        
        if (tokens.access_token) {
          authenticate(tokens.access_token)
          localStorage.setItem('spotify_auth_code', code)
          
          // Clear timeout before redirect
          clearTimeout(timeoutId)
          
          // Don't reset flag on success - keep it locked to prevent re-runs during navigation
          // Redirect to music player
          navigate('/music')
        } else {
          throw new Error('No access token received')
        }
      } catch (err) {
        console.error('Token exchange failed:', err)
        
        // Clear ALL auth data so user can start fresh - don't keep invalid state
        console.log('Clearing all auth data due to exchange failure...')
        localStorage.removeItem('spotify_access_token')
        localStorage.removeItem('spotify_refresh_token')
        localStorage.removeItem('spotify_token_expires_at')
        localStorage.removeItem('spotify_auth_code')
        localStorage.removeItem('spotify_code_verifier')
        localStorage.removeItem('spotify_code_verifier_timestamp')
        localStorage.removeItem('spotify_auth_state')
        sessionStorage.removeItem('spotify_code_verifier')
        sessionStorage.removeItem('spotify_code_verifier_timestamp')
        sessionStorage.removeItem('spotify_auth_state')
        
        setError(`Authentication failed. Please go back to home and connect again.`)
        setIsLoading(false)
        clearTimeout(timeoutId)
        
        // Reset flag on error
        isExchangingToken.current = false
        
        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/')
        }, 3000)
      }
    }
    
    handleCallback()
  }, [authenticate, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ Authentication Error</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <Link 
            to="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    )
  }

  // Show loading state while processing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-lg text-white">Processing authentication...</p>
          <p className="text-gray-400 mt-2">Exchanging code for access token...</p>
        </div>
      </div>
    )
  }

  // This should never be reached, but just in case
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="text-yellow-500 text-xl mb-4">⚠️ Unexpected State</div>
        <p className="text-gray-400 mb-4">Something went wrong during authentication</p>
        <Link 
          to="/" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

export default App
