// Spotify API configuration
export const SPOTIFY_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_SPOTIFY_CLIENT_ID || 'your_spotify_client_id',
  REDIRECT_URI: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
  SCOPES: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state'
  ].join(' ')
};

export const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?` +
  `client_id=${SPOTIFY_CONFIG.CLIENT_ID}&` +
  `response_type=code&` +
  `redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI)}&` +
  `scope=${encodeURIComponent(SPOTIFY_CONFIG.SCOPES)}`;

// Reference track ID from the issue
export const REFERENCE_TRACK_ID = '7t7LrYqwUrIzcac0qS6lcG';

// Default playlist for demonstration
export const DEFAULT_TRACKS = [
  {
    id: REFERENCE_TRACK_ID,
    name: 'Reference Track',
    artist: 'By Defeat',
    preview_url: null,
    external_urls: {
      spotify: `https://open.spotify.com/track/${REFERENCE_TRACK_ID}`
    }
  }
];