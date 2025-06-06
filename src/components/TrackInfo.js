import React from 'react';
import './TrackInfo.css';

const TrackInfo = ({ track, theme }) => {
  if (!track) {
    return (
      <div className="track-info loading">
        <div className="track-placeholder">
          <div className="placeholder-circle"></div>
          <div className="placeholder-text">
            <div className="placeholder-line"></div>
            <div className="placeholder-line short"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`track-info theme-${theme}`}>
      <div className="track-artwork">
        <div className="artwork-placeholder">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        <div className="artwork-overlay">
          <div className="pulse-ring"></div>
        </div>
      </div>
      
      <div className="track-details">
        <h2 className="track-title">
          {track.name || 'By Defeat Experience'}
        </h2>
        <p className="track-artist">
          {track.artist || 'By Defeat'}
        </p>
        <div className="track-meta">
          <span className="track-status">
            Now Playing
          </span>
          <span className="track-energy">
            Energy: {theme === 'energetic' ? 'High' : theme === 'mellow' ? 'Chill' : 'Dynamic'}
          </span>
        </div>
      </div>
      
      <div className="track-actions">
        <button className="action-btn" title="Add to favorites">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <button className="action-btn" title="Share track">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TrackInfo;