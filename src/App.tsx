import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlayerProvider } from './contexts/PlayerContext'
import { MusicPlayer } from './components/player/MusicPlayer'
import { useEffect } from 'react'

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

const HomePage = () => (
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
        Band Website
      </motion.p>
    </header>
    <main className="p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
        <p>Welcome to the By Defeat band website. Foundation setup complete!</p>
        <p className="mt-4 text-gray-400">
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
      </motion.div>
    </main>
  </div>
)

const MusicPage = () => (
  <MusicPlayer />
)

const AboutPage = () => (
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
    </header>
    <main className="p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold mb-4">About</h2>
        <p>Learn more about By Defeat.</p>
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
        // Redirect back to main page with error
        window.location.href = '/by-defeat/?error=' + error
        return
      }
      
      if (code) {
        try {
          // Here you would exchange the code for an access token
          console.log('Got auth code:', code)
          
          // For now, just redirect back to main page
          // In a real app, you'd exchange the code for a token first
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
        <p className="text-lg">Processing authentication...</p>
      </div>
    </div>
  )
}

export default App
