import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGateway } from '@/services/apiGateway'
import { rbacService } from '@/services/rbacService'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { Personnel, SectionType, PoliceRank, PersonnelStatus, PlatoonId } from '@/types'

const RANKS: PoliceRank[] = ['DCP', 'ACP', 'RPI', 'RSI', 'ARSI', 'AHC', 'APC']
const PLATOONS: PlatoonId[] = ['P1', 'P2', 'P3', 'P4', 'P5']
const STATUSES: PersonnelStatus[] = ['active', 'on-leave', 'absent', 'suspended', 'sick', 'training']

interface SectionOption { id: number; name: string; dutyNames: string[] }

function SearchableSelect({ value, options, onChange, placeholder, required }: {
  value: string; options: string[]; onChange: (v: string) => void; placeholder: string; required?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query) return options
    const q = query.toLowerCase()
    return options.filter(o => o.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sync display text when value changes externally
  useEffect(() => { if (!open) setQuery('') }, [value, open])

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={open ? query : value}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setOpen(true); setQuery('') }}
        placeholder={value || placeholder}
        required={required && !value}
        className="input w-full"
        autoComplete="off"
      />
      {/* Dropdown arrow */}
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-light)] pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg">
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); setQuery('') }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-primary)]/10 transition-colors ${
                opt === value ? 'bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-dark)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query && (
        <div className="absolute z-50 mt-1 w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg px-3 py-2 text-xs text-[var(--color-text-light)]">
          No matching duties found
        </div>
      )}
    </div>
  )
}

export default function PersonnelFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useNotifications()
  const [sections, setSections] = useState<SectionOption[]>([])
  const [dutyOptions, setDutyOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [personnel, setPersonnel] = useState<Personnel | null>(null)

  const permissions = useMemo(() => rbacService.getPermissions(user), [user])
  const isEditing = !!id

  const [formData, setFormData] = useState({
    personnelId: '',
    name: '',
    rank: 'APC' as PoliceRank,
    section: '' as SectionType | '',
    platoon: '' as PlatoonId | '',
    dutyCategory: '',
    status: 'active' as PersonnelStatus,
    phone: '',
    email: '',
  })

  // Fetch sections from backend
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('workboard_access_token')
        const res = await fetch('http://localhost:8080/api/sections', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
        const result = await res.json()
        if (result.success && result.data) {
          setSections(result.data)
          // If not editing, set default section to first one
          if (!id && result.data.length > 0) {
            const first = result.data[0]
            setFormData(prev => ({ ...prev, section: first.name }))
            setDutyOptions(first.dutyNames || [])
          }
        }
      } catch { /* fallback to empty */ }
      if (!id) setLoading(false)
    })()
  }, [id])

  // Fetch personnel for editing
  useEffect(() => {
    if (!id) return
    (async () => {
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
    })()
  }, [id])

  // When sections load and we're editing, populate duty options for the person's section
  useEffect(() => {
    if (sections.length > 0 && formData.section) {
      const found = sections.find(s => s.name === formData.section)
      if (found) setDutyOptions(found.dutyNames || [])
    }
  }, [sections, formData.section])

  const handleSectionChange = (sectionName: string) => {
    setFormData(prev => ({ ...prev, section: sectionName as SectionType, dutyCategory: '' }))
    const found = sections.find(s => s.name === sectionName)
    setDutyOptions(found?.dutyNames || [])
  }

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/employees')} className="p-2 hover:bg-[var(--color-bg-main)] rounded-lg text-[var(--color-text-medium)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="page-title">{isEditing ? 'Edit Personnel' : 'Add Personnel'}</h1>
          <p className="page-subtitle">{isEditing ? 'Update personnel information' : 'Add a new team member'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Personnel ID</label>
              <input type="text" value={formData.personnelId} onChange={e => setFormData(prev => ({ ...prev, personnelId: e.target.value.toUpperCase() }))} placeholder="AHC-127" disabled={isEditing} required className="input disabled:bg-[var(--color-bg-main)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Full Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))} placeholder="JOHN DOE" required className="input" />
            </div>
          </div>
        </div>

        {/* Position */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Position Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Rank</label>
              <select value={formData.rank} onChange={e => setFormData(prev => ({ ...prev, rank: e.target.value as PoliceRank }))} required className="input">
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Section <span className="text-[var(--color-error)]">*</span></label>
              <select value={formData.section} onChange={e => handleSectionChange(e.target.value)} required className="input">
                <option value="">Select Section</option>
                {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Platoon</label>
              <select value={formData.platoon} onChange={e => setFormData(prev => ({ ...prev, platoon: e.target.value as PlatoonId }))} className="input">
                <option value="">Select Platoon</option>
                {PLATOONS.map(p => <option key={p} value={p}>Platoon {p.replace('P', '')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as PersonnelStatus }))} className="input">
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Duty Name <span className="text-[var(--color-error)]">*</span></label>
              <SearchableSelect
                value={formData.dutyCategory}
                options={dutyOptions}
                onChange={v => setFormData(prev => ({ ...prev, dutyCategory: v }))}
                placeholder="Type to search duties..."
                required
              />
              {!formData.section && <p className="text-[10px] text-[var(--color-text-light)] mt-1">Select a section first to see available duties</p>}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Phone</label>
              <input type="tel" value={formData.phone} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 10) setFormData(prev => ({ ...prev, phone: val })) }} placeholder="9876543210" maxLength={10} className="input" />
              {formData.phone && formData.phone.length !== 10 && <p className="text-[10px] text-[var(--color-error)] mt-1">Phone number must be exactly 10 digits</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="john@example.com" className="input" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
          <button type="button" onClick={() => navigate('/employees')} className="flex-1 btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 btn btn-primary disabled:opacity-50">{saving ? 'Saving...' : isEditing ? 'Update Personnel' : 'Add Personnel'}</button>
        </div>
      </form>
    </div>
  )
}
