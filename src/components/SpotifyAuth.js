import React, { useState, useEffect } from 'react';
import { SPOTIFY_AUTH_URL } from '../utils/spotify';
import './SpotifyAuth.css';

const SpotifyAuth = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we're returning from Spotify auth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      setIsLoading(true);
      // In a real implementation, you'd exchange the code for an access token
      // For demo purposes, we'll simulate a token
      setTimeout(() => {
        const mockToken = 'demo_token_' + Date.now();
        onAuthSuccess(mockToken);
        setIsLoading(false);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 2000);
    }
  }, [onAuthSuccess]);

  const handleLogin = () => {
    window.location.href = SPOTIFY_AUTH_URL;
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-spinner"></div>
          <h2>Connecting to Spotify...</h2>
          <p>Setting up your musical experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-icon">🎵</div>
        <h2>Connect with Spotify</h2>
        <p>Experience the full power of By Defeat's dynamic music player</p>
        <button className="spotify-login-btn" onClick={handleLogin}>
          <span className="spotify-icon">♪</span>
          Connect to Spotify
        </button>
        <div className="auth-note">
          <p><strong>Demo Mode:</strong> Click to simulate Spotify connection</p>
          <p>The player will work with sample tracks and visualizations</p>
        </div>
      </div>
    </div>
  );
};

export default SpotifyAuth;