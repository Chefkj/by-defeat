import React, { useState, useEffect } from 'react';
import MusicPlayer from './components/MusicPlayer';
import SpotifyAuth from './components/SpotifyAuth';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    // Check for existing token in localStorage
    const token = localStorage.getItem('spotify_access_token');
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthSuccess = (token) => {
    setAccessToken(token);
    setIsAuthenticated(true);
    localStorage.setItem('spotify_access_token', token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    localStorage.removeItem('spotify_access_token');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>By Defeat</h1>
        <p>Let the music speak for itself</p>
      </header>
      
      {!isAuthenticated ? (
        <SpotifyAuth onAuthSuccess={handleAuthSuccess} />
      ) : (
        <div className="app-content">
          <MusicPlayer accessToken={accessToken} />
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;