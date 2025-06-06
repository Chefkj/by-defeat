import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_TRACKS, REFERENCE_TRACK_ID } from '../utils/spotify';
import PlayerControls from './PlayerControls';
import TrackInfo from './TrackInfo';
import AudioVisualizer from './AudioVisualizer';
import './MusicPlayer.css';

const MusicPlayer = ({ accessToken }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [tracks] = useState(DEFAULT_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [theme, setTheme] = useState('default');
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Sample audio for demonstration (in real implementation, this would use Spotify SDK)
  const sampleAudioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';

  useEffect(() => {
    // Initialize with first track
    if (tracks.length > 0) {
      setCurrentTrack(tracks[0]);
      // Simulate getting track characteristics for dynamic theming
      updateThemeForTrack(tracks[0]);
    }
  }, [tracks]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const updateThemeForTrack = (track) => {
    // In a real implementation, this would analyze track features from Spotify API
    // For demo, we'll cycle through different themes
    const themes = ['default', 'energetic', 'mellow', 'dark', 'bright'];
    const newTheme = themes[Math.floor(Math.random() * themes.length)];
    setTheme(newTheme);
    
    // Update CSS custom properties for dynamic theming
    const root = document.documentElement;
    switch (newTheme) {
      case 'energetic':
        root.style.setProperty('--primary-color', '#ff6b6b');
        root.style.setProperty('--secondary-color', '#feca57');
        break;
      case 'mellow':
        root.style.setProperty('--primary-color', '#74b9ff');
        root.style.setProperty('--secondary-color', '#a29bfe');
        break;
      case 'dark':
        root.style.setProperty('--primary-color', '#2d3436');
        root.style.setProperty('--secondary-color', '#636e72');
        break;
      case 'bright':
        root.style.setProperty('--primary-color', '#00cec9');
        root.style.setProperty('--secondary-color', '#fd79a8');
        break;
      default:
        root.style.setProperty('--primary-color', '#1e3c72');
        root.style.setProperty('--secondary-color', '#2a5298');
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // In demo mode, we'll simulate playback
        audioRef.current.src = sampleAudioUrl;
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(tracks[nextIndex]);
    updateThemeForTrack(tracks[nextIndex]);
    setProgress(0);
    if (isPlaying) {
      setTimeout(() => handlePlayPause(), 100);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(tracks[prevIndex]);
    updateThemeForTrack(tracks[prevIndex]);
    setProgress(0);
    if (isPlaying) {
      setTimeout(() => handlePlayPause(), 100);
    }
  };

  const handleProgressChange = (newProgress) => {
    setProgress(newProgress);
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = (newProgress / 100) * duration;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && duration > 0) {
      const currentProgress = (audioRef.current.currentTime / duration) * 100;
      setProgress(currentProgress);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  return (
    <div className={`music-player theme-${theme}`}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNext}
      />
      
      <div className="player-background">
        <AudioVisualizer isPlaying={isPlaying} theme={theme} />
      </div>
      
      <div className="player-content">
        <TrackInfo 
          track={currentTrack}
          theme={theme}
        />
        
        <PlayerControls
          isPlaying={isPlaying}
          progress={progress}
          volume={volume}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onProgressChange={handleProgressChange}
          onVolumeChange={setVolume}
          theme={theme}
        />
        
        <div className="player-info">
          <p>Experience the dynamic nature of By Defeat</p>
          <p>Watch as the player adapts to each song's unique energy</p>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;