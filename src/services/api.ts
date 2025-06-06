export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export class ApiClient {
  private baseUrl: string
  private headers: Record<string, string>

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
    this.headers = {
      'Content-Type': 'application/json',
    }
  }

  setAuthToken(token: string) {
    this.headers.Authorization = `Bearer ${token}`
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.headers,
    })

    const data = await response.json()
    return {
      data,
      status: response.status,
      message: response.statusText,
    }
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return {
      data,
      status: response.status,
      message: response.statusText,
    }
  }
}

// Spotify API client
export const spotifyApi = new ApiClient('https://api.spotify.com/v1')

// Generic utilities for API calls
export const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as {
      response?: { data?: { message?: string } }
      message?: string
    }
    return (
      apiError.response?.data?.message ||
      apiError.message ||
      'An unexpected error occurred'
    )
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}
