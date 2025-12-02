import React, { useState, useEffect } from 'react'
import { AudioVisualizer } from './AudioVisualizer'
import type { ThemeType, AudioFeatures } from '../../types/spotify'

export const VisualizerDemo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [theme, setTheme] = useState<ThemeType>('default')
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures>({
    energy: 0.7,
    valence: 0.8,
    danceability: 0.6,
    acousticness: 0.3,
    instrumentalness: 0.1,
    liveness: 0.2,
    speechiness: 0.1,
    tempo: 128,
  })

  // Simulate changing audio features
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioFeatures(prev => ({
        ...prev,
        energy: 0.3 + Math.random() * 0.7,
        valence: 0.2 + Math.random() * 0.8,
        danceability: 0.4 + Math.random() * 0.6,
        tempo: 80 + Math.random() * 120,
      }))
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const mockTrack = {
    id: 'demo-track',
    name: 'Demo Track',
    artist: 'By Defeat',
    artists: [{ name: 'By Defeat', id: 'by-defeat' }],
    album: 'Demo Album',
    albumObject: {
      name: 'Demo Album',
      images: [],
      id: 'demo-album'
    },
    duration_ms: 180000,
    preview_url: null,
    image: undefined,
    uri: 'spotify:track:demo',
    popularity: 75
  }

  const themes: ThemeType[] = ['default', 'energetic', 'mellow', 'dark', 'bright']

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AudioVisualizer 
          isPlaying={isPlaying}
          theme={theme}
          currentTrack={mockTrack}
          audioFeatures={audioFeatures}
        />
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-md mx-auto bg-black/50 backdrop-blur-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Enhanced Audio Visualizer</h1>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                  isPlaying 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isPlaying ? 'Pause' : 'Play'} Visualizer
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeType)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
              >
                {themes.map(t => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Energy: {audioFeatures.energy.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={audioFeatures.energy}
                onChange={(e) => setAudioFeatures(prev => ({ ...prev, energy: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Valence: {audioFeatures.valence.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={audioFeatures.valence}
                onChange={(e) => setAudioFeatures(prev => ({ ...prev, valence: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Tempo: {audioFeatures.tempo.toFixed(0)} BPM
              </label>
              <input
                type="range"
                min="60"
                max="200"
                step="5"
                value={audioFeatures.tempo}
                onChange={(e) => setAudioFeatures(prev => ({ ...prev, tempo: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="mt-6 text-sm text-gray-300 space-y-2">
            <p><strong>Features:</strong></p>
            <ul className="text-xs space-y-1">
              <li>• Circular spectrum analyzer</li>
              <li>• Energy-responsive particles</li>
              <li>• Beat-synchronized pulse effects</li>
              <li>• Mood-based color gradients</li>
              <li>• Dynamic background effects</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}