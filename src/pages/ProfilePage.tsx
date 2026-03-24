import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'

export function ProfilePage() {
  const { user } = useAuth()
  const { showToast } = useNotifications()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || `${user?.username}@ksp.gov.in`,
    phone: '',
    department: 'Traffic Division',
    designation: 'Police Inspector',
  })

  const handleSave = () => {
    setIsEditing(false)
    showToast({ type: 'success', title: 'Profile Updated', message: 'Your profile has been updated successfully.' })
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View and manage your profile information</p>
        </div>
        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="btn btn-primary">
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6 text-center">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
            alt={user?.name}
            className="w-24 h-24 rounded-full mx-auto border-4 border-[var(--color-border)]"
          />
          <h2 className="mt-4 text-lg font-semibold text-[var(--color-text-dark)]">{user?.name}</h2>
          <p className="text-sm text-[var(--color-text-medium)]">{formData.designation}</p>
          <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] capitalize">
            {user?.role}
          </span>
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-light)]">Employee ID</p>
            <p className="text-sm font-medium text-[var(--color-text-dark)]">{user?.username?.toUpperCase() || 'KSP-001'}</p>
          </div>
        </div>

        {/* Details Form */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-dark)] mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                className="input disabled:bg-[var(--color-bg-main)] disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className="input disabled:bg-[var(--color-bg-main)] disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="+91 XXXXX XXXXX"
                className="input disabled:bg-[var(--color-bg-main)] disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="label">Department</label>
              <input
                type="text"
                value={formData.department}
                disabled
                className="input bg-[var(--color-bg-main)] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="label">Designation</label>
              <input
                type="text"
                value={formData.designation}
                disabled
                className="input bg-[var(--color-bg-main)] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="label">Role</label>
              <input
                type="text"
                value={user?.role || 'Officer'}
                disabled
                className="input bg-[var(--color-bg-main)] cursor-not-allowed capitalize"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
