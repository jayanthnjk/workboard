import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface DutyCount { dutyId: number; dutyName: string; count: number }
interface SectionData { id: number; name: string; description: string; sortOrder: number; dutyNames: string[]; personnelCount: number; dutyCounts: DutyCount[] }

export default function SectionsPage() {
  const { user } = useAuth()
  const [sections, setSections] = useState<SectionData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSection, setNewSection] = useState({ name: '', description: '' })
  const [newDuty, setNewDuty] = useState<{ sectionId: number; name: string } | null>(null)

  const fetchSections = async () => {
    try {
      const token = localStorage.getItem('workboard_access_token')
      const res = await fetch('http://localhost:8080/api/sections', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      const result = await res.json()
      if (result.success) setSections(result.data)
    } catch (e) { console.error('Failed to fetch sections:', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSections() }, [])

  const handleAddSection = async () => {
    if (!newSection.name.trim()) return
    const token = localStorage.getItem('workboard_access_token')
    const res = await fetch('http://localhost:8080/api/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify(newSection),
    })
    const result = await res.json()
    if (result.success) { setShowAddForm(false); setNewSection({ name: '', description: '' }); fetchSections() }
  }

  const handleAddDuty = async () => {
    if (!newDuty || !newDuty.name.trim()) return
    const token = localStorage.getItem('workboard_access_token')
    await fetch(`http://localhost:8080/api/sections/${newDuty.sectionId}/duties?dutyName=${encodeURIComponent(newDuty.name)}`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
    setNewDuty(null)
    fetchSections()
  }

  const handleRemoveDuty = async (dutyId: number) => {
    const token = localStorage.getItem('workboard_access_token')
    await fetch(`http://localhost:8080/api/sections/duties/${dutyId}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
    fetchSections()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full" /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Sections & Duties</h1>
          <p className="page-subtitle">Manage organizational sections and their duty assignments</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn btn-primary text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Section
        </button>
      </div>

      {/* Add Section Form */}
      {showAddForm && (
        <div className="card p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">New Section</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Name</label>
              <input value={newSection.name} onChange={e => setNewSection(p => ({ ...p, name: e.target.value }))} placeholder="e.g. SECTION D" className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <input value={newSection.description} onChange={e => setNewSection(p => ({ ...p, description: e.target.value }))} placeholder="Section description" className="input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddSection} className="btn btn-primary text-sm">Create</button>
            <button onClick={() => setShowAddForm(false)} className="btn btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map(section => (
          <div key={section.id} className="card-hover p-5">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #00003c, #000080)' }}>
                  {section.name.replace('SECTION ', '').charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">{section.name}</h3>
                  <p className="text-[10px] text-[var(--color-text-light)]">{section.description || 'No description'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[var(--color-primary)]">{section.personnelCount}</p>
                <p className="text-[9px] uppercase text-[var(--color-text-light)]">Personnel</p>
              </div>
            </div>

            {/* Duty Names */}
            <div className="space-y-1.5 mb-3">
              <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold">Duties ({section.dutyNames.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {(section.dutyCounts || []).map(dc => (
                  <div key={dc.dutyId} className="group flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[10px]">
                    <span className="font-medium text-[var(--color-text-dark)]">{dc.dutyName}</span>
                    <span className="text-[var(--color-text-light)]">({dc.count})</span>
                    <button onClick={() => handleRemoveDuty(dc.dutyId)} className="ml-0.5 opacity-0 group-hover:opacity-100 text-[var(--color-error)] hover:text-red-700 transition-opacity" title="Remove duty">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                {section.dutyNames.length === 0 && <span className="text-[10px] text-[var(--color-text-light)] italic">No duties configured</span>}
              </div>
            </div>

            {/* Add Duty */}
            {newDuty?.sectionId === section.id ? (
              <div className="flex gap-2 items-center">
                <input value={newDuty.name} onChange={e => setNewDuty({ ...newDuty, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleAddDuty()} placeholder="Duty name" className="input text-xs flex-1" autoFocus />
                <button onClick={handleAddDuty} className="text-[var(--color-success)] hover:text-green-700 p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                <button onClick={() => setNewDuty(null)} className="text-[var(--color-text-light)] hover:text-[var(--color-error)] p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            ) : (
              <button onClick={() => setNewDuty({ sectionId: section.id, name: '' })} className="w-full py-2 rounded-lg border border-dashed border-[var(--color-border)] text-[10px] text-[var(--color-text-light)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-colors">
                + Add Duty
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
