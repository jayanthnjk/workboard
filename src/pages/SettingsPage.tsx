import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { apiGateway } from '@/services/apiGateway'

const SettingsPage = () => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-4">
            <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="Avatar" className="w-16 h-16 rounded-full" />
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-sm text-gray-500">{user?.email}</div>
              <div className="text-sm text-gray-500 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Dark Mode</div>
              <div className="text-sm text-gray-500">Toggle between light and dark theme</div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${theme === 'dark' ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-500">Receive notifications via email</div>
              </div>
              <input
                type="checkbox"
                checked={notificationPrefs.emailEnabled}
                onChange={e => setNotificationPrefs({ ...notificationPrefs, emailEnabled: e.target.checked })}
                className="h-5 w-5"
              />
            </div>
            <hr className="dark:border-gray-700" />
            <div className="flex items-center justify-between">
              <span>Schedule Changes</span>
              <input type="checkbox" checked={notificationPrefs.scheduleChanges} onChange={e => setNotificationPrefs({ ...notificationPrefs, scheduleChanges: e.target.checked })} className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <span>Leave Requests</span>
              <input type="checkbox" checked={notificationPrefs.leaveRequests} onChange={e => setNotificationPrefs({ ...notificationPrefs, leaveRequests: e.target.checked })} className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <span>Swap Requests</span>
              <input type="checkbox" checked={notificationPrefs.swapRequests} onChange={e => setNotificationPrefs({ ...notificationPrefs, swapRequests: e.target.checked })} className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <span>System Alerts</span>
              <input type="checkbox" checked={notificationPrefs.systemAlerts} onChange={e => setNotificationPrefs({ ...notificationPrefs, systemAlerts: e.target.checked })} className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Voice Assistant Section */}
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Voice Assistant</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable Voice Commands</div>
              <div className="text-sm text-gray-500">Use voice to interact with the chatbot</div>
            </div>
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={e => setVoiceEnabled(e.target.checked)}
              className="h-5 w-5"
            />
          </div>
        </div>

        {/* Data Management (Admin only) */}
        {user?.role === 'admin' && (
          <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Data Management</h2>
            <p className="text-sm text-gray-500 mb-4">Reset all application data to default seed data. This is useful for demo purposes.</p>
            <button onClick={handleResetData} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Reset All Data
            </button>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90">
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
