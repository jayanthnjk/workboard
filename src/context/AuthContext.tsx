import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { dataStore } from '@/services/dataStore'
import type { User, UserRole, AuthState, Credentials } from '@/types'

const AUTH_STORAGE_KEY = 'workboard_auth'

interface AuthContextValue extends AuthState {
  login: (credentials: Credentials) => Promise<{ success: boolean; error?: string }>
  logout: () => void
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
      return {
        user: action.payload,
        role: action.payload.role,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'LOGIN_FAILURE':
      return { ...initialState, isLoading: false }
    case 'LOGOUT':
      return { ...initialState, isLoading: false }
    case 'RESTORE_SESSION':
      return {
        user: action.payload,
        role: action.payload.role,
        isAuthenticated: true,
        isLoading: false,
      }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
    if (storedAuth) {
      try {
        const { userId } = JSON.parse(storedAuth)
        const user = dataStore.getUserById(userId)
        if (user) {
          dispatch({ type: 'RESTORE_SESSION', payload: user })
          
          // Log audit entry for session restore
          dataStore.createAuditEntry({
            userId: user.id,
            userName: user.name,
            action: 'login',
            entityType: 'user',
            entityId: user.id,
            entityName: user.name,
          })
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY)
          dispatch({ type: 'LOGOUT' })
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        dispatch({ type: 'LOGOUT' })
      }
    } else {
      dispatch({ type: 'LOGOUT' })
    }
  }, [])

  const login = async (credentials: Credentials): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      const response = await apiGateway.login(credentials)
      
      if (response.success && response.data) {
        const user = response.data
        
        // Save to localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId: user.id }))
        
        // Log audit entry
        dataStore.createAuditEntry({
          userId: user.id,
          userName: user.name,
          action: 'login',
          entityType: 'user',
          entityId: user.id,
          entityName: user.name,
        })
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: user })
        return { success: true }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' })
        return { success: false, error: response.error || 'Invalid credentials' }
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' })
      return { success: false, error: 'An error occurred during login' }
    }
  }

  const logout = () => {
    // Log audit entry before clearing state
    if (state.user) {
      dataStore.createAuditEntry({
        userId: state.user.id,
        userName: state.user.name,
        action: 'logout',
        entityType: 'user',
        entityId: state.user.id,
        entityName: state.user.name,
      })
    }
    
    localStorage.removeItem(AUTH_STORAGE_KEY)
    dispatch({ type: 'LOGOUT' })
  }

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
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
