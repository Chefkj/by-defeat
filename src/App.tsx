import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlayerProvider } from './contexts/PlayerContext'
import { MusicPlayer } from './components/player/MusicPlayer'
import { useEffect, useState } from 'react'
import { exchangeCodeForToken } from './services/spotify'

function App() {
  return (
    <PlayerProvider>
      <Router basename="/by-defeat">
        <div className="min-h-screen bg-gray-900 text-white">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/music" element={<MusicPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/callback" element={<CallbackPage />} />
          </Routes>
        </div>
      </Router>
    </PlayerProvider>
  )
}

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user just authenticated
    const urlParams = new URLSearchParams(window.location.search)
    const authenticated = urlParams.get('authenticated')
    const code = localStorage.getItem('spotify_auth_code')
    
    if (authenticated === 'true' && code) {
      setIsAuthenticated(true)
      
      // Clean up the URL
      window.history.replaceState({}, document.title, '/by-defeat/')
    }
  }, [])

  return (
    <div className="min-h-screen">
      <header className="p-6">
        <motion.h1
          className="text-4xl font-bold"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          By Defeat
        </motion.h1>
        <motion.p
          className="text-gray-300 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {isAuthenticated ? 'Connected to Spotify' : 'Band Website'}
        </motion.p>
      </header>
      
      <main className="p-6">
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
                <button 
                  onClick={() => {
                    localStorage.removeItem('spotify_auth_code')
                    localStorage.removeItem('code_verifier')
                    setIsAuthenticated(false)
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
              <div className="mt-6">
                <Link 
                  to="/music" 
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Experience the Music Player
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </main>
      
      {/* Show the music player if authenticated */}
      {isAuthenticated && <MusicPlayer />}
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
    <main className="p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold mb-4">About By Defeat</h2>
        <p>Learn more about the band and our music</p>
      </motion.div>
    </main>
  </div>
)

import { usePlayer } from './contexts/PlayerContext'

const CallbackPage = () => {
  const { authenticate } = usePlayer()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setError('Authentication timeout - please try again')
        setIsLoading(false)
      }, 30000) // 30 second timeout

      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')
        
        if (error) {
          console.error('Spotify auth error:', error)
          setError('Authentication failed: ' + error)
          setIsLoading(false)
          clearTimeout(timeoutId)
          return
        }
        
        if (code) {
          console.log('Exchanging code for token...')
          const codeVerifier = localStorage.getItem('code_verifier')
          if (!codeVerifier) {
            throw new Error('Code verifier not found in localStorage')
          }
          const tokens = await exchangeCodeForToken(code, codeVerifier)
          console.log('Token exchange successful!')
          
          if (tokens.access_token) {
            authenticate(tokens.access_token)
            localStorage.setItem('spotify_auth_code', code)
            
            // Clear timeout before redirect
            clearTimeout(timeoutId)
            
            // Redirect to music player
            window.location.href = '/by-defeat/music?authenticated=true'
          } else {
            throw new Error('No access token received')
          }
        } else {
          setError('No authorization code received')
          setIsLoading(false)
          clearTimeout(timeoutId)
        }
      } catch (err) {
        console.error('Token exchange failed:', err)
        setError('Failed to complete authentication')
        setIsLoading(false)
        clearTimeout(timeoutId)
      }
    }
    
    handleCallback()
  }, [authenticate])

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
