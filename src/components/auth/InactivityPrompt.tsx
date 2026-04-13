import { useAuth } from '@/context/AuthContext'

export default function InactivityPrompt() {
  const { showInactivityPrompt, inactivityCountdown, staySignedIn, logout } = useAuth()

  if (!showInactivityPrompt) return null

  const minutes = Math.floor(inactivityCountdown / 60)
  const seconds = inactivityCountdown % 60
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const progress = (inactivityCountdown / 120) * 100

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 30, 0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in relative overflow-hidden">
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #FFC107, #6b5c42, #000080, #8B5CF6)' }} />

        {/* Progress bar showing time remaining */}
        <div className="absolute top-1 left-0 right-0 h-0.5 bg-[var(--color-border)]">
          <div
            className="h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progress}%`, background: progress > 30 ? 'var(--color-secondary)' : 'var(--color-error)' }}
          />
        </div>

        <div className="text-center mt-2">
          {/* Icon */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(107, 92, 66, 0.1)' }}>
            <svg className="w-7 h-7 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-[var(--color-text-dark)] mb-1">Session Expiring</h3>
          <p className="text-sm text-[var(--color-text-medium)] mb-4">
            You've been inactive. Your session will end in
          </p>

          {/* Countdown */}
          <div className="text-3xl font-bold mb-5" style={{ color: inactivityCountdown <= 30 ? 'var(--color-error)' : 'var(--color-secondary)', fontFamily: 'Manrope, sans-serif' }}>
            {timeDisplay}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={logout}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-medium)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              Sign out
            </button>
            <button
              onClick={staySignedIn}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #554a35, #6b5c42)', boxShadow: '0 2px 12px rgba(107, 92, 66, 0.3)' }}
            >
              Stay signed in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
