import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGateway } from '@/services/apiGateway'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { rbacService } from '@/services/rbacService'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { Personnel, PoliceRank, PersonnelStatus, PlatoonId, SectionType } from '@/types'

const RANKS: PoliceRank[] = ['DCP', 'ACP', 'RPI', 'RSI', 'ARSI', 'AHC', 'APC']
const PLATOONS: PlatoonId[] = ['P1', 'P2', 'P3', 'P4', 'P5']
const STATUSES: PersonnelStatus[] = ['active', 'on-leave', 'absent', 'suspended', 'sick', 'training']

interface SectionOption { id: number; name: string; dutyNames: string[] }

type Tab = 'Overview' | 'Leave & Attendance' | 'Service Record'
const TABS: Tab[] = ['Overview', 'Leave & Attendance', 'Service Record']

const holidays2026 = [
  { date: '2026-01-26', name: 'Republic Day' }, { date: '2026-03-17', name: 'Holi' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti' }, { date: '2026-05-01', name: 'May Day' },
  { date: '2026-08-15', name: 'Independence Day' }, { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-11-01', name: 'Karnataka Rajyotsava' }, { date: '2026-11-04', name: 'Diwali' },
  { date: '2026-12-25', name: 'Christmas' },
]

const leaveBalances = [
  { type: 'CL', label: 'Casual Leave', entitled: 12, used: 2, remaining: 10, color: '#3b82f6' },
  { type: 'CML', label: 'Medical Leave', entitled: 10, used: 0, remaining: 10, color: '#ef4444' },
  { type: 'EL', label: 'Earned Leave', entitled: 30, used: 8, remaining: 22, color: '#10b981' },
  { type: 'PL', label: 'Privilege Leave', entitled: 15, used: 4, remaining: 11, color: '#8b5cf6' },
]

function SearchableSelect({ value, options, onChange, placeholder }: {
  value: string; options: string[]; onChange: (v: string) => void; placeholder: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const filtered = useMemo(() => !query ? options : options.filter(o => o.toLowerCase().includes(query.toLowerCase())), [options, query])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => { if (!open) setQuery('') }, [value, open])
  return (
    <div ref={ref} className="relative">
      <input type="text" value={open ? query : value} onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setOpen(true); setQuery('') }} placeholder={value || placeholder} className="input w-full pr-8" autoComplete="off" />
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-light)] pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg">
          {filtered.map(opt => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); setQuery('') }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-primary)]/10 ${opt === value ? 'bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-dark)]'}`}>{opt}</button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query && <div className="absolute z-50 mt-1 w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg px-3 py-2 text-xs text-[var(--color-text-light)]">No match</div>}
    </div>
  )
}

const statusColors: Record<PersonnelStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' },
  'on-leave': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400' },
  absent: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
  suspended: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
  sick: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400' },
  training: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
}

export default function PersonnelDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useNotifications()
  const permissions = useMemo(() => rbacService.getPermissions(user), [user])

  const [person, setPerson] = useState<Personnel | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [sections, setSections] = useState<SectionOption[]>([])
  const [dutyOptions, setDutyOptions] = useState<string[]>([])
  const [editingContact, setEditingContact] = useState(false)

  const [form, setForm] = useState({
    personnelId: '', name: '', rank: 'APC' as PoliceRank, section: '' as SectionType | '',
    platoon: '' as PlatoonId | '', dutyCategory: '', status: 'active' as PersonnelStatus,
    phone: '', email: '',
  })

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('workboard_access_token')
        const res = await fetch('http://localhost:8080/api/sections', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        const result = await res.json()
        if (result.success) setSections(result.data)
      } catch { /* ignore */ }
    })()
  }, [])

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const response = await apiGateway.getAllPersonnel()
        if (response.success) {
          const p = response.data.find(x => x.id === id)
          if (p) { setPerson(p); syncForm(p) }
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [id])

  useEffect(() => {
    if (sections.length > 0 && form.section) {
      const found = sections.find(s => s.name === form.section)
      setDutyOptions(found?.dutyNames || [])
    }
  }, [sections, form.section])

  const syncForm = (p: Personnel) => setForm({
    personnelId: p.personnelId, name: p.name, rank: p.rank, section: p.section,
    platoon: p.platoon || '', dutyCategory: p.dutyCategory || '', status: p.status,
    phone: p.phone || '', email: p.email || '',
  })

  const handleSectionChange = (name: string) => {
    setForm(prev => ({ ...prev, section: name as SectionType, dutyCategory: '' }))
    setDutyOptions(sections.find(s => s.name === name)?.dutyNames || [])
  }

  const handleSave = async () => {
    if (!person) return
    setSaving(true)
    try {
      const response = await apiGateway.updatePersonnel(person.id, { ...form, platoon: form.platoon || undefined })
      if (response.success) {
        const updated = { ...person, ...form } as Personnel
        setPerson(updated); setEditing(false); setEditingContact(false)
        showToast({ type: 'success', title: 'Personnel updated' })
      } else { showToast({ type: 'error', title: 'Update failed', message: response.error }) }
    } catch { showToast({ type: 'error', title: 'An error occurred' }) }
    finally { setSaving(false) }
  }

  const handleCancel = () => { if (person) syncForm(person); setEditing(false); setEditingContact(false) }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>
  if (!person) return <div className="flex flex-col items-center justify-center h-64"><p className="text-[var(--color-text-medium)]">Personnel not found</p><button onClick={() => navigate('/employees')} className="mt-4 text-[var(--color-primary)] hover:underline">Go back</button></div>

  const sc = statusColors[person.status] || statusColors.active
  const initials = person.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
  const yos = person.hireDate ? Math.max(0, new Date().getFullYear() - new Date(person.hireDate).getFullYear()) : 0

  // ─── Profile Card (left column, shared across tabs) ───
  const ProfileCard = () => (
    <div className="card p-5 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #00003c, #000080)' }}>{initials}</div>
      <h2 className="mt-3 text-lg font-semibold text-[var(--color-text-dark)]">{person.name}</h2>
      <p className="text-sm text-[var(--color-text-medium)]">{person.rank}</p>
      <span className={`mt-1 px-3 py-0.5 text-[10px] font-semibold rounded-full capitalize ${sc.bg} ${sc.text}`}>{person.status}</span>
      <div className="w-full mt-4 pt-4 border-t border-[var(--color-border)] space-y-2.5 text-left">
        {[
          { l: 'Personnel ID', v: person.personnelId },
          { l: 'Section', v: person.section },
          { l: 'Platoon', v: person.platoon ? `Platoon ${person.platoon.replace('P', '')}` : 'N/A' },
          { l: 'Status', v: person.status, status: true },
          { l: 'Date of Joining', v: fmtDate(person.hireDate) },
        ].map(r => (
          <div key={r.l} className="flex justify-between text-xs">
            <span className="text-[var(--color-text-light)]">{r.l}</span>
            {r.status ? <span className={`font-medium capitalize ${sc.text}`}>{r.v}</span> : <span className="font-mono text-[var(--color-text-dark)]">{r.v}</span>}
          </div>
        ))}
      </div>
    </div>
  )

  // ─── Overview Tab ───
  const OverviewTab = () => (
    <div className="lg:col-span-2 space-y-5">
      {/* Contact Info */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">Contact Information</h3>
          {permissions.canAddPersonnel && !editingContact && !editing && (
            <button onClick={() => setEditingContact(true)} className="text-xs text-[var(--color-primary)] hover:underline">Edit</button>
          )}
          {editingContact && (
            <div className="flex gap-2">
              <button onClick={() => { if (person) syncForm(person); setEditingContact(false) }} className="text-xs text-[var(--color-text-light)]">Cancel</button>
              <button onClick={handleSave} className="text-xs text-[var(--color-primary)] font-semibold">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          )}
        </div>
        {editingContact ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Phone</label>
              <input type="tel" value={form.phone} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); if (v.length <= 10) setForm(p => ({ ...p, phone: v })) }} className="input mt-1 text-sm" maxLength={10} />
              {form.phone && form.phone.length !== 10 && <p className="text-[10px] text-[var(--color-error)] mt-1">Must be 10 digits</p>}
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input mt-1 text-sm" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Phone</label><p className="text-sm text-[var(--color-text-dark)] mt-1">{person.phone || 'N/A'}</p></div>
            <div><label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Email</label><p className="text-sm text-[var(--color-text-dark)] mt-1">{person.email || 'N/A'}</p></div>
          </div>
        )}
      </div>

      {/* Leave Balance Summary */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">Leave Balance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {leaveBalances.map(b => (
            <div key={b.type} className="text-center p-3 bg-[var(--color-bg-main)] rounded-lg">
              <p className="text-lg font-bold text-[var(--color-text-dark)]">{b.remaining}</p>
              <p className="text-[10px] text-[var(--color-text-light)]">{b.label}</p>
              <div className="mt-1.5 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(b.remaining / b.entitled) * 100}%`, backgroundColor: b.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">Achievements & Awards</h3>
        <div className="space-y-3">
          {[
            { title: 'Best Duty Performance', year: '2025', desc: 'Awarded for exemplary guard duty at Commissioner Office' },
            { title: 'Commendation Certificate', year: '2024', desc: 'VIP escort duty during state-level event' },
            { title: 'Long Service Medal', year: '2023', desc: `${yos > 10 ? yos : 15} years of dedicated service` },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 flex-shrink-0">🏅</div>
              <div><p className="text-sm font-medium text-[var(--color-text-dark)]">{a.title} <span className="text-[10px] text-[var(--color-text-light)]">({a.year})</span></p><p className="text-xs text-[var(--color-text-medium)]">{a.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ─── Leave & Attendance Tab ───
  const LeaveTab = () => (
    <div className="lg:col-span-2 space-y-5">
      {/* Leave Balances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {leaveBalances.map(b => {
          const pct = b.entitled > 0 ? (b.remaining / b.entitled) * 100 : 0
          return (
            <div key={b.type} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: b.color }}>{b.label}</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-2xl font-bold text-[var(--color-text-dark)]">{b.remaining}</span>
                <span className="text-xs text-[var(--color-text-light)] pb-0.5">/ {b.entitled}</span>
              </div>
              <div className="h-1.5 bg-[var(--color-bg-main)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: b.color }} />
              </div>
              <p className="text-[10px] text-[var(--color-text-light)] mt-1">Used {b.used}, Remaining {b.remaining}</p>
            </div>
          )
        })}
      </div>

      {/* Pending Leaves */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">Pending Leave Requests</h3>
        <div className="text-xs text-[var(--color-text-light)] py-4 text-center">No pending leave requests</div>
      </div>

      {/* Holiday Calendar */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">Holiday Calendar 2026</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {holidays2026.map(h => {
            const d = new Date(h.date + 'T00:00:00')
            const isPast = d < new Date()
            return (
              <div key={h.date} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${isPast ? 'border-[var(--color-border)] opacity-50' : 'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5'}`}>
                <div className="text-center min-w-[40px]">
                  <p className="text-lg font-bold text-[var(--color-text-dark)]">{d.getDate()}</p>
                  <p className="text-[10px] text-[var(--color-text-light)] uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-dark)]">{h.name}</p>
                  <p className="text-[10px] text-[var(--color-text-light)]">{d.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ─── Service Record Tab ───
  const ServiceTab = () => (
    <div className="lg:col-span-2 space-y-5">
      {/* Service Details */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">Service Details</h3>
          {permissions.canAddPersonnel && !editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-[var(--color-primary)] hover:underline">Edit</button>
          )}
          {editing && (
            <div className="flex gap-2">
              <button onClick={handleCancel} className="text-xs text-[var(--color-text-light)]">Cancel</button>
              <button onClick={handleSave} className="text-xs text-[var(--color-primary)] font-semibold">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          )}
        </div>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Rank</label>
              <select value={form.rank} onChange={e => setForm(p => ({ ...p, rank: e.target.value as PoliceRank }))} className="input mt-1">{RANKS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Section</label>
              <select value={form.section} onChange={e => handleSectionChange(e.target.value)} className="input mt-1"><option value="">Select</option>{sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
            <div><label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Platoon</label>
              <select value={form.platoon} onChange={e => setForm(p => ({ ...p, platoon: e.target.value as PlatoonId }))} className="input mt-1"><option value="">No Platoon</option>{PLATOONS.map(p => <option key={p} value={p}>Platoon {p.replace('P', '')}</option>)}</select></div>
            <div><label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as PersonnelStatus }))} className="input mt-1">{STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
            <div className="sm:col-span-2"><label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Duty Name</label>
              <SearchableSelect value={form.dutyCategory} options={dutyOptions} onChange={v => setForm(p => ({ ...p, dutyCategory: v }))} placeholder="Type to search duties..." /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { l: 'Date of Joining', v: fmtDate(person.hireDate) }, { l: 'Current Rank', v: person.rank },
              { l: 'Section', v: person.section }, { l: 'Platoon', v: person.platoon ? `Platoon ${person.platoon.replace('P', '')}` : 'N/A' },
              { l: 'Current Duty', v: person.dutyCategory || 'N/A' }, { l: 'Unit', v: 'City Armed Reserve (CAR), Mangaluru' },
              { l: 'District', v: 'Dakshina Kannada' }, { l: 'Years of Service', v: `${yos} years` },
            ].map(item => (
              <div key={item.l} className="flex justify-between py-2 border-b border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-light)]">{item.l}</span>
                <span className="text-xs font-medium text-[var(--color-text-dark)]">{item.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Awards */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">Awards & Commendations</h3>
        <div className="space-y-3">
          {[
            { title: 'Best Duty Performance', year: '2025', desc: 'Awarded for exemplary guard duty at Commissioner Office' },
            { title: 'Commendation Certificate', year: '2024', desc: 'VIP escort duty during state-level event' },
            { title: 'Long Service Medal', year: '2023', desc: `${yos > 10 ? yos : 15} years of dedicated service` },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-[var(--color-bg-main)] rounded-lg">
              <span className="text-xl">🏅</span>
              <div><p className="text-sm font-medium text-[var(--color-text-dark)]">{a.title}</p><p className="text-xs text-[var(--color-text-medium)]">{a.desc}</p><p className="text-[10px] text-[var(--color-text-light)] mt-0.5">{a.year}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Training */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">Training History</h3>
        <div className="space-y-2">
          {[
            { name: 'Basic Training PTS Mysuru', date: 'May 2025', status: 'Completed' },
            { name: 'PDMS Training', date: 'Mar 2026', status: 'Completed' },
            { name: 'CCT Training Koodlu', date: 'Mar 2026', status: 'Ongoing' },
          ].map((tr, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
              <div><p className="text-xs font-medium text-[var(--color-text-dark)]">{tr.name}</p><p className="text-[10px] text-[var(--color-text-light)]">{tr.date}</p></div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tr.status === 'Completed' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'}`}>{tr.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/employees')} className="p-2 hover:bg-[var(--color-bg-main)] rounded-lg text-[var(--color-text-medium)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="page-title">Personnel Details</h1>
          <p className="page-subtitle">{person.name} — {person.rank}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setEditing(false); setEditingContact(false) }}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ProfileCard />
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Leave & Attendance' && <LeaveTab />}
        {activeTab === 'Service Record' && <ServiceTab />}
      </div>
    </div>
  )
}
