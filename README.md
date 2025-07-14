# By Defeat - Dynamic Music Player

A modern, responsive music player application built with React, TypeScript, and Vite, featuring Spotify integration and adaptive theming.

## 🎵 Features

### Dynamic Music Player
- **React + TypeScript** architecture with modern hooks and component design
- **Spotify Web API integration** with authentication flow and demo mode
- **Play/pause/skip controls** with smooth animations
- **Progress tracking** and volume control
- **Adaptive theming** that changes based on track characteristics

### Visual Experience
- **Real-time audio visualization** using Canvas API with particle effects
- **Dynamic theming system** with multiple themes:
  - **Energetic**: Vibrant reds/yellows with fast animations
  - **Mellow**: Calm blues/purples with gentle transitions
  - **Dark**: Subtle grays with minimal effects
  - **Bright**: Vivid teals/pinks with dynamic highlights
  - **Default**: Deep blues with balanced animations
- **Smooth transitions** between tracks
- **Responsive design** optimized for all screen sizes

### Technical Stack
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Canvas API** for visualizations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Spotify Developer account (optional, for full integration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Chefkj/by-defeat.git
cd by-defeat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. (Optional) Configure Spotify API:
   - Create a Spotify app at https://developer.spotify.com/dashboard
   - Add your client ID and redirect URI to `.env`

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:5173 in your browser

## 🎮 Usage

### Demo Mode
The application works immediately in demo mode without Spotify credentials:
- Click "Try Demo Mode" on the authentication screen
- Explore all visual effects and animations
- Use mock playback controls with state management

### Spotify Integration
For full functionality:
1. Set up your Spotify app credentials in `.env`
2. Click "Connect with Spotify"
3. Authorize the application
4. Enjoy your personal music library with dynamic visuals

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Project Structure
```
src/
├── components/
│   ├── player/
│   │   ├── MusicPlayer.tsx      # Main player container
│   │   ├── PlayerControls.tsx   # Play/pause/skip controls
│   │   ├── TrackInfo.tsx        # Track metadata display
│   │   ├── AudioVisualizer.tsx  # Canvas-based visualizations
│   │   └── SpotifyAuth.tsx      # Authentication component
│   └── ui/
│       └── Button.tsx           # Reusable button component
├── contexts/
│   └── PlayerContext.tsx       # Player state management
├── services/
│   └── spotify.ts               # Spotify API integration
├── types/
│   └── spotify.ts               # TypeScript interfaces
├── styles/
│   └── index.css                # Global styles
└── App.tsx                      # Main application component
```

### Environment Variables
Create a `.env` file with the following variables:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
VITE_APP_ENV=development
```

## 🎨 Theming

The application features a dynamic theming system that adapts to music characteristics:

- **Theme Detection**: Analyzes track features to determine visual theme
- **CSS Custom Properties**: Dynamic color updates
- **Smooth Transitions**: Animated theme changes
- **Responsive Design**: Themes adapt to different screen sizes

## 🔧 Technical Details

### Performance Optimizations
- **Efficient animations** with requestAnimationFrame
- **Minimal re-renders** with React context optimization
- **Memory management** for particle systems
- **Lazy loading** of components

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

### Memory Management
- Proper cleanup of animation frames
- Efficient particle system with object pooling
- Optimized canvas rendering

## 🎵 Music Philosophy

The player embodies the "By Defeat" philosophy:
- **No genre constraints** - Each song is experienced uniquely
- **Visual adaptation** - The interface becomes part of the musical journey
- **Seamless flow** - Smooth transitions maintain listening immersion
- **Emotional resonance** - Colors and animations reflect song energy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🎯 Future Enhancements

- Real-time audio analysis for better theme detection
- Playlist management
- Social sharing features
- Extended visualization options
- Mobile app development

---

**By Defeat** - Let the music speak for itself