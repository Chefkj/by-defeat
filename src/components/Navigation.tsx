import { Link, useLocation } from 'react-router-dom'
import { usePlayer } from '../hooks/usePlayerContext'
import { Home, Music, Info, LogOut } from 'lucide-react'

export const Navigation = () => {
  const location = useLocation()
  const { state, logout } = usePlayer()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-xl font-bold text-white hover:text-blue-400 transition-colors"
          >
            <span>By Defeat</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') || isActive('/by-defeat') || isActive('/by-defeat/')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/music"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/music')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Music</span>
            </Link>

            <Link
              to="/about"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </Link>

            {/* Logout button - only show when authenticated */}
            {state.isAuthenticated && (
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ml-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}

            {/* Auth status indicator */}
            {state.isAuthenticated && (
              <div className="ml-3 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="ml-2 text-xs text-gray-400">Connected</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
