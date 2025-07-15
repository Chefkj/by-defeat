import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlayerProvider } from './contexts/PlayerContext'
import { MusicPlayer } from './components/player/MusicPlayer'
import { useEffect, useState } from 'react'

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

const MusicPage = () => (
  <div className="min-h-screen">
    <main className="p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Music Player</h2>
        <p>Interactive music experience with Spotify integration</p>
      </motion.div>
    </main>
    <MusicPlayer />
  </div>
)

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

const CallbackPage = () => {
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')
      
      if (error) {
        console.error('Spotify auth error:', error)
        window.location.href = '/by-defeat/?error=' + error
        return
      }
      
      if (code) {
        try {
          console.log('Got auth code:', code)
          localStorage.setItem('spotify_auth_code', code)
          window.location.href = '/by-defeat/?authenticated=true'
        } catch (err) {
          console.error('Token exchange failed:', err)
          window.location.href = '/by-defeat/?error=token_exchange_failed'
        }
      }
    }
    
    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
        <p className="text-lg text-white">Processing authentication...</p>
        <p className="text-gray-400 mt-2">Redirecting to home page...</p>
      </div>
    </div>
  )
}

export default App
