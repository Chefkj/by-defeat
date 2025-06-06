import { useState, useEffect } from 'react'

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  duration_ms: number
  preview_url: string | null
  album: {
    images: Array<{ url: string; height: number; width: number }>
  }
}

interface SpotifyConfig {
  clientId: string
  redirectUri: string
}

export const useSpotify = (config?: SpotifyConfig) => {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientId = config?.clientId || import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const redirectUri =
    config?.redirectUri || import.meta.env.VITE_SPOTIFY_REDIRECT_URI

  const authenticate = () => {
    if (!clientId) {
      setError('Spotify Client ID is not configured')
      return
    }

    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
    ]
    const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams(
      {
        response_type: 'token',
        client_id: clientId,
        scope: scopes.join(' '),
        redirect_uri: redirectUri,
      }
    )}`

    window.location.href = authUrl
  }

  const searchTracks = async (query: string): Promise<SpotifyTrack[]> => {
    if (!accessToken) {
      throw new Error('Not authenticated with Spotify')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to search tracks')
      }

      const data = await response.json()
      return data.tracks.items
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  const getUserPlaylists = async () => {
    if (!accessToken) {
      throw new Error('Not authenticated with Spotify')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch playlists')
      }

      const data = await response.json()
      return data.items
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if there's an access token in the URL hash (after OAuth redirect)
    const hash = window.location.hash
    if (hash) {
      const token = hash
        .substring(1)
        .split('&')
        .find(elem => elem.startsWith('access_token'))
        ?.split('=')[1]

      if (token) {
        setAccessToken(token)
        setIsAuthenticated(true)
        // Clear the hash from URL
        window.location.hash = ''
      }
    }
  }, [])

  return {
    accessToken,
    isAuthenticated,
    loading,
    error,
    authenticate,
    searchTracks,
    getUserPlaylists,
  }
}
