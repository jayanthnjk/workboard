import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { useAuth } from './AuthContext'
import type { Notification } from '@/types'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  toasts: Toast[]
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    
    try {
      const [notifResponse, countResponse] = await Promise.all([
        apiGateway.getNotifications(user.id),
        apiGateway.getUnreadNotificationCount(user.id),
      ])
      
      if (notifResponse.success) {
        setNotifications(notifResponse.data)
      }
      if (countResponse.success) {
        setUnreadCount(countResponse.data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [user])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications()
      
      // Refresh notifications every 60 seconds
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, user, fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      const response = await apiGateway.markNotificationAsRead(id)
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    
    try {
      const response = await apiGateway.markAllNotificationsAsRead(user.id)
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}`
    const newToast: Toast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-dismiss after duration (default 5 seconds)
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        showToast,
        dismissToast,
      }}
    >
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              animate-slide-in p-4 rounded-lg shadow-lg max-w-sm
              ${toast.type === 'success' ? 'bg-[var(--color-success)] text-white' : ''}
              ${toast.type === 'error' ? 'bg-[var(--color-error)] text-white' : ''}
              ${toast.type === 'warning' ? 'bg-[var(--color-warning)] text-white' : ''}
              ${toast.type === 'info' ? 'bg-[var(--color-info)] text-white' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium">{toast.title}</p>
                {toast.message && (
                  <p className="text-sm opacity-90 mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext
