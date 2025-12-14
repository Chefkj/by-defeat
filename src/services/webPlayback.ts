// Spotify Web Playback SDK integration
// https://developer.spotify.com/documentation/web-playback-sdk

// Extend Window interface to include Spotify
declare global {
  interface Window {
    Spotify: typeof Spotify
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

namespace Spotify {
  export interface Player {
    connect(): Promise<boolean>
    disconnect(): void
    addListener(event: string, callback: (data: any) => void): void
    removeListener(event: string, callback?: (data: any) => void): void
    getCurrentState(): Promise<PlaybackState | null>
    setName(name: string): Promise<void>
    getVolume(): Promise<number>
    setVolume(volume: number): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    togglePlay(): Promise<void>
    seek(position_ms: number): Promise<void>
    previousTrack(): Promise<void>
    nextTrack(): Promise<void>
    activateElement(): Promise<void>
  }

  export interface PlaybackState {
    context: {
      uri: string
      metadata: any
    }
    disallows: {
      pausing: boolean
      peeking_next: boolean
      peeking_prev: boolean
      resuming: boolean
      seeking: boolean
      skipping_next: boolean
      skipping_prev: boolean
    }
    paused: boolean
    position: number
    repeat_mode: number
    shuffle: boolean
    track_window: {
      current_track: Track
      previous_tracks: Track[]
      next_tracks: Track[]
    }
  }

  export interface Track {
    uri: string
    id: string
    type: string
    media_type: string
    name: string
    is_playable: boolean
    album: {
      uri: string
      name: string
      images: Array<{ url: string }>
    }
    artists: Array<{ uri: string; name: string }>
  }

  export interface PlayerConstructor {
    new (options: {
      name: string
      getOAuthToken: (cb: (token: string) => void) => void
      volume?: number
    }): Player
  }
}

export interface WebPlaybackState {
  deviceId: string | null
  isReady: boolean
  player: Spotify.Player | null
  currentTrack: Spotify.Track | null
  position: number
  duration: number
  paused: boolean
}

export class WebPlaybackService {
  private player: Spotify.Player | null = null
  private deviceId: string | null = null
  private getAccessToken: () => string | null
  private onStateChange?: (state: WebPlaybackState) => void

  constructor(
    getAccessToken: () => string | null,
    onStateChange?: (state: WebPlaybackState) => void
  ) {
    this.getAccessToken = getAccessToken
    this.onStateChange = onStateChange
  }

  async initialize(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      // Wait for SDK to load
      if (!window.Spotify) {
        window.onSpotifyWebPlaybackSDKReady = () => {
          this.initializePlayer().then(resolve).catch(reject)
        }
      } else {
        this.initializePlayer().then(resolve).catch(reject)
      }
    })
  }

  private async initializePlayer(): Promise<string | null> {
    const token = this.getAccessToken()
    
    if (!token) {
      throw new Error('No access token available')
    }

    // @ts-ignore - Spotify SDK is loaded via script tag
    this.player = new window.Spotify.Player({
      name: 'By Defeat Web Player',
      getOAuthToken: (cb: (token: string) => void) => {
        const currentToken = this.getAccessToken()
        if (currentToken) {
          cb(currentToken)
        }
      },
      volume: 0.7,
    })

    // Set up event listeners
    this.setupListeners()

    // Connect to the player
    const success = await this.player.connect()
    
    if (!success) {
      throw new Error('Failed to connect to Spotify player')
    }

    return this.deviceId
  }

  private setupListeners() {
    if (!this.player) return

    // Ready
    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('🎵 Spotify player ready with Device ID:', device_id)
      this.deviceId = device_id
      this.notifyStateChange()
    })

    // Not Ready
    this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.warn('Spotify player not ready:', device_id)
      this.deviceId = null
      this.notifyStateChange()
    })

    // Player state changed
    this.player.addListener('player_state_changed', (state: Spotify.PlaybackState | null) => {
      if (!state) {
        console.log('Player state: null (no active playback)')
        return
      }

      console.log('Player state changed:', {
        paused: state.paused,
        position: state.position,
        track: state.track_window.current_track.name,
      })

      this.notifyStateChange(state)
    })

    // Errors
    this.player.addListener('initialization_error', ({ message }: { message: string }) => {
      console.error('Spotify player initialization error:', message)
    })

    this.player.addListener('authentication_error', ({ message }: { message: string }) => {
      console.error('Spotify player authentication error:', message)
    })

    this.player.addListener('account_error', ({ message }: { message: string }) => {
      console.error('Spotify player account error:', message)
    })

    this.player.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('Spotify player playback error:', message)
    })
  }

  private notifyStateChange(playbackState?: Spotify.PlaybackState | null) {
    if (!this.onStateChange) return

    const state: WebPlaybackState = {
      deviceId: this.deviceId,
      isReady: !!this.deviceId,
      player: this.player,
      currentTrack: playbackState?.track_window.current_track || null,
      position: playbackState?.position || 0,
      duration: playbackState?.track_window.current_track ? 0 : 0,
      paused: playbackState?.paused ?? true,
    }

    this.onStateChange(state)
  }

  getDeviceId(): string | null {
    return this.deviceId
  }

  async pause(): Promise<void> {
    return this.player?.pause()
  }

  async resume(): Promise<void> {
    return this.player?.resume()
  }

  async togglePlay(): Promise<void> {
    return this.player?.togglePlay()
  }

  async seek(positionMs: number): Promise<void> {
    return this.player?.seek(positionMs)
  }

  async nextTrack(): Promise<void> {
    return this.player?.nextTrack()
  }

  async previousTrack(): Promise<void> {
    return this.player?.previousTrack()
  }

  async setVolume(volume: number): Promise<void> {
    return this.player?.setVolume(volume)
  }

  async getCurrentState(): Promise<Spotify.PlaybackState | null> {
    return this.player?.getCurrentState() || null
  }

  disconnect(): void {
    this.player?.disconnect()
    this.player = null
    this.deviceId = null
  }
}
