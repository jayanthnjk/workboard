import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState, type ReactNode } from 'react'
import { apiGateway } from '@/services/apiGateway'
import type { User, UserRole, AuthState, Credentials } from '@/types'

const AUTH_STORAGE_KEY = 'workboard_auth'
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000   // 10 minutes
const STAY_SIGNED_IN_COUNTDOWN_S = 120          // 2 minutes
const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000   // refresh 2 min before expiry

interface AuthContextValue extends AuthState {
  login: (credentials: Credentials) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  showInactivityPrompt: boolean
  inactivityCountdown: number
  staySignedIn: () => void
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: User }

const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true }
    case 'LOGIN_SUCCESS':
      return { user: action.payload, role: action.payload.role, isAuthenticated: true, isLoading: false }
    case 'LOGIN_FAILURE':
      return { ...initialState, isLoading: false }
    case 'LOGOUT':
      return { ...initialState, isLoading: false }
    case 'RESTORE_SESSION':
      return { user: action.payload, role: action.payload.role, isAuthenticated: true, isLoading: false }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const [showInactivityPrompt, setShowInactivityPrompt] = useState(false)
  const [inactivityCountdown, setInactivityCountdown] = useState(STAY_SIGNED_IN_COUNTDOWN_S)

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Clear all timers ───
  const clearAllTimers = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current)
  }, [])

  // ─── Logout ───
  const logout = useCallback(() => {
    clearAllTimers()
    setShowInactivityPrompt(false)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem('workboard_access_token')
    localStorage.removeItem('workboard_refresh_token')
    localStorage.removeItem('workboard_token_expiry')
    dispatch({ type: 'LOGOUT' })
  }, [clearAllTimers])

  // ─── Token refresh ───
  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('workboard_refresh_token')
    if (!storedRefreshToken) {
      logout()
      return
    }

    try {
      const response = await fetch('http://localhost:8080/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        localStorage.setItem('workboard_access_token', result.data.accessToken)
        localStorage.setItem('workboard_refresh_token', result.data.refreshToken)
        localStorage.setItem('workboard_token_expiry', String(Date.now() + result.data.expiresIn * 1000))
        scheduleTokenRefresh(result.data.expiresIn * 1000)
      } else {
        logout()
      }
    } catch {
      logout()
    }
  }, [logout])

  // ─── Schedule token refresh before expiry ───
  const scheduleTokenRefresh = useCallback((expiresInMs: number) => {
    if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current)
    const refreshIn = Math.max(expiresInMs - TOKEN_REFRESH_BUFFER_MS, 10000)
    tokenRefreshTimerRef.current = setTimeout(() => {
      refreshToken()
    }, refreshIn)
  }, [refreshToken])

  // ─── Inactivity: start countdown popup ───
  const showInactivityWarning = useCallback(() => {
    setShowInactivityPrompt(true)
    setInactivityCountdown(STAY_SIGNED_IN_COUNTDOWN_S)

    countdownIntervalRef.current = setInterval(() => {
      setInactivityCountdown(prev => {
        if (prev <= 1) {
          logout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [logout])

  // ─── Reset inactivity timer on user activity ───
  const resetInactivityTimer = useCallback(() => {
    if (!state.isAuthenticated) return
    if (showInactivityPrompt) return // don't reset while prompt is showing

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    inactivityTimerRef.current = setTimeout(showInactivityWarning, INACTIVITY_TIMEOUT_MS)
  }, [state.isAuthenticated, showInactivityPrompt, showInactivityWarning])

  // ─── "Stay signed in" button handler ───
  const staySignedIn = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setShowInactivityPrompt(false)
    setInactivityCountdown(STAY_SIGNED_IN_COUNTDOWN_S)
    resetInactivityTimer()
    refreshToken()
  }, [resetInactivityTimer, refreshToken])

  // ─── Listen for user activity ───
  useEffect(() => {
    if (!state.isAuthenticated) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
    const handler = () => resetInactivityTimer()

    events.forEach(event => window.addEventListener(event, handler, { passive: true }))
    resetInactivityTimer()

    return () => {
      events.forEach(event => window.removeEventListener(event, handler))
    }
  }, [state.isAuthenticated, resetInactivityTimer])

  // ─── Restore session on mount ───
  useEffect(() => {
    const token = localStorage.getItem('workboard_access_token')
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
    const tokenExpiry = localStorage.getItem('workboard_token_expiry')

    if (token && storedAuth) {
      try {
        const user = JSON.parse(storedAuth) as User
        if (user && user.id) {
          // Check if token is expired
          if (tokenExpiry && Date.now() > Number(tokenExpiry)) {
            refreshToken().then(() => {
              const newToken = localStorage.getItem('workboard_access_token')
              if (newToken) {
                dispatch({ type: 'RESTORE_SESSION', payload: user })
              }
            })
          } else {
            dispatch({ type: 'RESTORE_SESSION', payload: user })
            if (tokenExpiry) {
              scheduleTokenRefresh(Number(tokenExpiry) - Date.now())
            }
          }
          return
        }
      } catch { /* fall through to logout */ }
    }

    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem('workboard_access_token')
    localStorage.removeItem('workboard_refresh_token')
    localStorage.removeItem('workboard_token_expiry')
    dispatch({ type: 'LOGOUT' })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Login ───
  const login = async (credentials: Credentials): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'LOGIN_START' })

    try {
      const response = await apiGateway.login(credentials)

      if (response.success && response.data) {
        const user = response.data
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))

        // Schedule token refresh
        const expiryStr = localStorage.getItem('workboard_token_expiry')
        if (expiryStr) {
          scheduleTokenRefresh(Number(expiryStr) - Date.now())
        }

        dispatch({ type: 'LOGIN_SUCCESS', payload: user })
        return { success: true }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' })
        return { success: false, error: response.error || 'Invalid credentials' }
      }
    } catch {
      dispatch({ type: 'LOGIN_FAILURE' })
      return { success: false, error: 'An error occurred during login' }
    }
  }

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => clearAllTimers()
  }, [clearAllTimers])

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    showInactivityPrompt,
    inactivityCountdown,
    staySignedIn,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useRequireAuth(allowedRoles?: UserRole[]): AuthContextValue {
  const auth = useAuth()
  if (!auth.isAuthenticated && !auth.isLoading) {
    throw new Error('User must be authenticated')
  }
  if (allowedRoles && auth.role && !allowedRoles.includes(auth.role)) {
    throw new Error('User does not have required role')
  }
  return auth
}

export default AuthContext
