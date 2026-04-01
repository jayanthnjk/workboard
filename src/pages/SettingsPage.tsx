import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { apiGateway } from '@/services/apiGateway'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailEnabled: true,
    scheduleChanges: true,
    leaveRequests: true,
    swapRequests: true,
    systemAlerts: true,
  })
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleResetData = async () => {
    if (confirm('Reset all data to defaults? This cannot be undone.')) {
      await apiGateway.resetData()
      window.location.reload()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('settings_title')}</h1>
        <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('settings_subtitle')}</p>
      </div>

      {/* Profile Section */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">{t('profile')}</h2>
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
            alt="Avatar"
            className="w-16 h-16 rounded-full border-2 border-[var(--color-border)]"
          />
          <div>
            <p className="font-medium text-[var(--color-text-dark)]">{user?.name}</p>
            <p className="text-sm text-[var(--color-text-medium)]">{user?.email || `${user?.username}@workboard.com`}</p>
            <p className="text-xs text-[var(--color-text-light)] capitalize mt-1">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">{t('appearance')}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-dark)]">{t('dark_mode_label')}</p>
            <p className="text-xs text-[var(--color-text-medium)]">{t('dark_mode_desc')}</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">{t('notifications')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-dark)]">{t('email_notifications')}</p>
              <p className="text-xs text-[var(--color-text-medium)]">{t('email_notifications_desc')}</p>
            </div>
            <button
              onClick={() => setNotificationPrefs({ ...notificationPrefs, emailEnabled: !notificationPrefs.emailEnabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${notificationPrefs.emailEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${notificationPrefs.emailEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {[
            { key: 'scheduleChanges', label: t('schedule_changes') },
            { key: 'leaveRequests', label: t('leave_requests') },
            { key: 'swapRequests', label: t('swap_requests') },
            { key: 'systemAlerts', label: t('system_alerts') },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--color-text-medium)]">{item.label}</span>
              <input
                type="checkbox"
                checked={notificationPrefs[item.key as keyof typeof notificationPrefs]}
                onChange={e => setNotificationPrefs({ ...notificationPrefs, [item.key]: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Voice Assistant Section */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">{t('voice_assistant')}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-dark)]">{t('enable_voice')}</p>
            <p className="text-xs text-[var(--color-text-medium)]">{t('enable_voice_desc')}</p>
          </div>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${voiceEnabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${voiceEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Data Management (Admin only) */}
      {user?.role === 'admin' && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">{t('data_management')}</h2>
          <p className="text-sm text-[var(--color-text-medium)] mb-4">{t('reset_data_desc')}</p>
          <button
            onClick={handleResetData}
            className="btn bg-[var(--color-error)] hover:bg-[var(--color-error)]/90 text-white"
          >
            {t('reset_all_data')}
          </button>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn btn-primary"
        >
          {saved ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {t('saved')}
            </>
          ) : (
            t('save_settings')
          )}
        </button>
      </div>
    </div>
  )
}
