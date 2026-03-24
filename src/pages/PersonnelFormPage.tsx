import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGateway } from '@/services/apiGateway'
import { rbacService } from '@/services/rbacService'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { Personnel, SectionType, PoliceRank, PersonnelStatus, PlatoonId } from '@/types'

const RANKS: PoliceRank[] = ['DCP', 'ACP', 'RPI', 'RSI', 'ARSI', 'AHC', 'APC']
const SECTIONS: SectionType[] = ['A', 'B', 'C', 'PMT', 'RECRUIT']
const PLATOONS: PlatoonId[] = ['P1', 'P2', 'P3', 'P4', 'P5']
const STATUSES: PersonnelStatus[] = ['active', 'on-leave', 'absent', 'suspended', 'sick', 'training']

export default function PersonnelFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useNotifications()
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [personnel, setPersonnel] = useState<Personnel | null>(null)

  const permissions = useMemo(() => rbacService.getPermissions(user), [user])
  const isEditing = !!id

  const [formData, setFormData] = useState({
    personnelId: '',
    name: '',
    rank: 'APC' as PoliceRank,
    section: 'C' as SectionType,
    platoon: '' as PlatoonId | '',
    dutyCategory: '',
    status: 'active' as PersonnelStatus,
    phone: '',
    email: '',
  })

  useEffect(() => {
    if (id) {
      const fetchPersonnel = async () => {
        try {
          const response = await apiGateway.getAllPersonnel()
          if (response.success) {
            const person = response.data.find(p => p.id === id)
            if (person) {
              setPersonnel(person)
              setFormData({
                personnelId: person.personnelId,
                name: person.name,
                rank: person.rank,
                section: person.section,
                platoon: person.platoon || '',
                dutyCategory: person.dutyCategory || '',
                status: person.status,
                phone: person.phone || '',
                email: person.email || '',
              })
            }
          }
        } catch (error) {
          console.error('Failed to fetch personnel:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchPersonnel()
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEditing && personnel) {
        const response = await apiGateway.updatePersonnel(personnel.id, { ...formData, platoon: formData.platoon || undefined })
        if (response.success) {
          showToast({ type: 'success', title: 'Personnel updated successfully' })
          navigate('/employees')
        } else {
          showToast({ type: 'error', title: 'Update failed', message: response.error })
        }
      } else {
        const response = await apiGateway.createPersonnel({ ...formData, platoon: formData.platoon || undefined, hireDate: new Date().toISOString() })
        if (response.success) {
          showToast({ type: 'success', title: 'Personnel created successfully' })
          navigate('/employees')
        } else {
          showToast({ type: 'error', title: 'Creation failed', message: response.error })
        }
      }
    } catch {
      showToast({ type: 'error', title: 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  if (!permissions.canAddPersonnel && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-[var(--color-text-medium)]">You don't have permission to add personnel.</p>
        <button onClick={() => navigate('/employees')} className="mt-4 text-[var(--color-primary)] hover:underline">Go back</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/employees')} className="p-2 hover:bg-[var(--color-bg-main)] rounded-lg text-[var(--color-text-medium)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="page-title">{isEditing ? 'Edit Personnel' : 'Add Personnel'}</h1>
          <p className="page-subtitle">{isEditing ? 'Update personnel information' : 'Add a new team member'}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Personnel ID</label>
              <input
                type="text"
                value={formData.personnelId}
                onChange={e => setFormData(prev => ({ ...prev, personnelId: e.target.value.toUpperCase() }))}
                placeholder="AHC-127"
                disabled={isEditing}
                required
                className="input disabled:bg-[var(--color-bg-main)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                placeholder="JOHN DOE"
                required
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Position */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Position Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Rank</label>
              <select
                value={formData.rank}
                onChange={e => setFormData(prev => ({ ...prev, rank: e.target.value as PoliceRank }))}
                required
                className="input"
              >
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Section</label>
              <select
                value={formData.section}
                onChange={e => setFormData(prev => ({ ...prev, section: e.target.value as SectionType, platoon: '' }))}
                required
                className="input"
              >
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            {formData.section === 'C' && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Platoon</label>
                <select
                  value={formData.platoon}
                  onChange={e => setFormData(prev => ({ ...prev, platoon: e.target.value as PlatoonId }))}
                  className="input"
                >
                  <option value="">Select Platoon</option>
                  {PLATOONS.map(p => <option key={p} value={p}>Platoon {p.replace('P', '')}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as PersonnelStatus }))}
                className="input"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Personnel' : 'Add Personnel'}
          </button>
        </div>
      </form>
    </div>
  )
}
