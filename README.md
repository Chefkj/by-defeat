# By Defeat

A modern band website built with React, Vite, and TypeScript.

## Tech Stack

- **React 18+** - Modern React with hooks and functional components
- **Vite** - Fast build tool for modern web development
- **TypeScript** - Type safety and enhanced developer experience
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Framer Motion** - Smooth animations and transitions
- **React Router DOM** - Client-side routing
- **ESLint + Prettier** - Code quality and formatting

## Architecture

### Directory Structure
```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── player/       # Music player components
│   └── layout/       # Layout components
├── hooks/            # Custom React hooks
├── contexts/         # React contexts (Theme, Player)
├── services/         # API services (Spotify)
├── utils/            # Utility functions
└── styles/           # Global styles and themes
```

### Key Features

- **Component-based architecture** with reusable UI elements
- **Context API** for global state management (music player, theme)
- **Custom hooks** for Spotify integration
- **Mobile-first responsive design** approach
- **PWA-ready configuration** for offline capabilities
- **TypeScript strict mode** for enhanced type safety

## Development

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Fill in your Spotify API credentials in `.env`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Environment Variables

Create a `.env` file with the following variables:

```
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
VITE_APP_ENV=development
```

## Spotify Integration

The project includes a custom hook (`useSpotify`) for integrating with the Spotify Web API:

- User authentication
- Track searching
- Playlist management
- Music player controls

## Contributing

1. Ensure code passes linting: `npm run lint`
2. Format code before committing: `npm run format`
3. Test the build: `npm run build`

## License

ISC