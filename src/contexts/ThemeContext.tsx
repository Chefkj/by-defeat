import React, { createContext, useContext, useReducer, ReactNode } from 'react'

// Theme Context
interface ThemeState {
  theme: 'dark' | 'light'
  primaryColor: string
}

interface ThemeContextType {
  state: ThemeState
  toggleTheme: () => void
  setPrimaryColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

type ThemeAction =
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_PRIMARY_COLOR'; payload: string }

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' }
    case 'SET_PRIMARY_COLOR':
      return { ...state, primaryColor: action.payload }
    default:
      return state
  }
}

const initialThemeState: ThemeState = {
  theme: 'dark',
  primaryColor: '#3b82f6',
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(themeReducer, initialThemeState)

  const toggleTheme = () => dispatch({ type: 'TOGGLE_THEME' })
  const setPrimaryColor = (color: string) =>
    dispatch({ type: 'SET_PRIMARY_COLOR', payload: color })

  return (
    <ThemeContext.Provider value={{ state, toggleTheme, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
