import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { resolvedTheme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <header className="h-14 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-sm flex items-center justify-between px-3 sm:px-5 z-40">
      {/* Left - Logo & Brand */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 hover:bg-[var(--color-bg-main)] rounded-lg transition-colors">
          <svg className="w-5 h-5 text-[var(--color-text-medium)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[var(--color-text-dark)] leading-tight">KSP WorkBoard</p>
            <p className="text-[10px] text-[var(--color-text-light)]">CAR Unit</p>
          </div>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-1">
        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
          className="h-8 px-2 sm:px-3 text-xs font-medium text-[var(--color-text-medium)] hover:bg-[var(--color-bg-main)] rounded-lg transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="hidden sm:inline">{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="h-8 w-8 flex items-center justify-center text-[var(--color-text-medium)] hover:bg-[var(--color-bg-main)] rounded-lg transition-colors"
          title={resolvedTheme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {resolvedTheme === 'light' ? (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>

        {/* Notifications */}
        <button 
          onClick={() => navigate('/notifications')} 
          className="relative h-8 w-8 flex items-center justify-center text-[var(--color-text-medium)] hover:bg-[var(--color-bg-main)] rounded-lg transition-colors"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-[var(--color-border)] mx-2" />

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 hover:bg-[var(--color-bg-main)] rounded-lg transition-colors"
          >
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
              alt={user?.name}
              className="w-8 h-8 rounded-full ring-2 ring-[var(--color-border)]"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-[var(--color-text-dark)] leading-tight">{user?.name?.split(' ')[0] || 'User'}</p>
              <p className="text-[10px] text-[var(--color-text-light)] capitalize leading-tight">{user?.role || 'Officer'}</p>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-[var(--color-bg-card)] rounded-xl shadow-lg border border-[var(--color-border)] overflow-hidden z-50">
              <div className="p-4 bg-[var(--color-primary)]">
                <div className="flex items-center gap-3">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                    alt={user?.name}
                    className="w-12 h-12 rounded-full ring-2 ring-white/30"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
                    <p className="text-xs text-white/80">{user?.email || `${user?.username}@ksp.gov.in`}</p>
                  </div>
                </div>
              </div>
              <div className="py-2">
                <button onClick={() => { setProfileDropdownOpen(false); navigate('/profile') }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-medium)] hover:bg-[var(--color-bg-main)] transition-colors">
                  <svg className="w-5 h-5 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {t('my_profile')}
                </button>
                <button onClick={() => { setProfileDropdownOpen(false); navigate('/settings') }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-medium)] hover:bg-[var(--color-bg-main)] transition-colors">
                  <svg className="w-5 h-5 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {t('settings')}
                </button>
                <button onClick={() => { setProfileDropdownOpen(false); navigate('/help') }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-medium)] hover:bg-[var(--color-bg-main)] transition-colors">
                  <svg className="w-5 h-5 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {t('help_support')}
                </button>
              </div>
              <div className="border-t border-[var(--color-border)] py-2">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  {t('sign_out')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
