import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiGateway } from '@/services/apiGateway'
import { rotationService } from '@/services/rotationService'
import { useLanguage } from '@/context/LanguageContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { guardLocations } from '@/data/seedData'
import type { PlatoonId, RotationalDutyType, Personnel } from '@/types'

const PLATOON_IDS: PlatoonId[] = ['P1', 'P2', 'P3', 'P4', 'P5']

const DUTY_LABELS: Record<RotationalDutyType, string> = {
  'guard-i': 'Guard-I',
  'guard-ii': 'Guard-II',
  'check-point': 'Check Point',
  'prison-vip-escort': 'Prison/VIP Escort',
  'striking-force': 'Striking Force',
}

const DUTY_COLORS: Record<RotationalDutyType, string> = {
  'guard-i': 'var(--color-success)',
  'guard-ii': 'var(--color-info)',
  'check-point': 'var(--color-warning)',
  'prison-vip-escort': 'var(--color-accent-purple)',
  'striking-force': 'var(--color-error)',
}

type Step = 'cycle' | 'assign' | 'review'

export default function NewAssignmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useLanguage()
  const prefillCycle = searchParams.get('cycle')
  const [step, setStep] = useState<Step>(prefillCycle ? 'assign' : 'cycle')
  const [loading, setLoading] = useState(true)
  const [personnel, setPersonnel] = useState<Personnel[]>([])

  // Cycle config
  const [selectedCycle, setSelectedCycle] = useState(() => {
    if (prefillCycle) return parseInt(prefillCycle, 10)
    return rotationService.getCycleNumber(new Date())
  })

  // Assignment overrides: platoonId -> { duty, locationIds }
  const [assignments, setAssignments] = useState<Record<string, { duty: RotationalDutyType; locationIds: string[] }>>({})

  const cycleDateRange = useMemo(() => rotationService.getCycleDateRange(selectedCycle), [selectedCycle])
  const autoRotations = useMemo(() => {
    const map: Record<string, RotationalDutyType> = {}
    PLATOON_IDS.forEach(pid => {
      map[pid] = rotationService.getDutyTypeForPlatoon(pid, selectedCycle)
    })
    return map
  }, [selectedCycle])

  const activeLocations = useMemo(() => guardLocations.filter(l => l.isActive), [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [, perRes] = await Promise.all([apiGateway.getPlatoons(), apiGateway.getAllPersonnel()])
        if (perRes.success) setPersonnel(perRes.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Initialize assignments from auto-rotation when moving to assign step
  useEffect(() => {
    if (step === 'assign' && Object.keys(assignments).length === 0) {
      const init: Record<string, { duty: RotationalDutyType; locationIds: string[] }> = {}
      PLATOON_IDS.forEach(pid => {
        init[pid] = { duty: autoRotations[pid], locationIds: [] }
      })
      setAssignments(init)
    }
  }, [step, autoRotations, assignments])

  const getPlatoonPersonnel = useCallback((platoonId: PlatoonId) =>
    personnel.filter(p => p.platoon === platoonId && p.status === 'active'), [personnel])

  const handleDutyChange = (platoonId: string, duty: RotationalDutyType) => {
    setAssignments(prev => ({ ...prev, [platoonId]: { ...prev[platoonId], duty } }))
  }

  const handleLocationToggle = (platoonId: string, locationId: string) => {
    setAssignments(prev => {
      const current = prev[platoonId]?.locationIds || []
      const updated = current.includes(locationId)
        ? current.filter(id => id !== locationId)
        : [...current, locationId]
      return { ...prev, [platoonId]: { ...prev[platoonId], locationIds: updated } }
    })
  }

  const handleSubmit = async () => {
    const range = rotationService.getCycleDateRange(selectedCycle)
    const rotations = PLATOON_IDS.map(pid => ({
      platoonId: pid as PlatoonId,
      dutyType: assignments[pid].duty,
      cycleNumber: selectedCycle,
      startDate: range.startDate,
      endDate: range.endDate,
    }))
    const res = await apiGateway.assignCycleRotations(rotations)
    if (res.success) {
      navigate('/schedule')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/schedule')} className="p-2 hover:bg-[var(--color-bg-card)] rounded-lg text-[var(--color-text-medium)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="page-title">{t('new_assignment')}</h1>
          <p className="page-subtitle">Create a new duty cycle and assign platoons to duties & locations</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex flex-wrap items-center gap-2">
        {(['cycle', 'assign', 'review'] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            {idx > 0 && <div className={`w-4 sm:w-8 h-px ${step === s || (['assign', 'review'].indexOf(step) >= idx) ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />}
            <button
              onClick={() => {
                if (s === 'cycle') setStep('cycle')
                else if (s === 'assign' && step !== 'cycle') setStep('assign')
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium transition-colors ${
                step === s
                  ? 'bg-[var(--color-primary)] text-white'
                  : (['assign', 'review'].indexOf(step) > ['cycle', 'assign', 'review'].indexOf(s))
                    ? 'bg-[var(--color-green-100)] text-[var(--color-primary)]'
                    : 'bg-[var(--color-bg-card)] text-[var(--color-text-light)] border border-[var(--color-border)]'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
              <span className="hidden sm:inline">{s === 'cycle' ? 'Select Cycle' : s === 'assign' ? 'Assign Duties' : 'Review & Save'}</span>
              <span className="sm:hidden">{s === 'cycle' ? 'Cycle' : s === 'assign' ? 'Assign' : 'Review'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Step 1: Cycle Selection */}
      {step === 'cycle' && (
        <div className="card p-6 space-y-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-dark)]">Duty Cycle Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto cycle */}
            <div className="space-y-3">
              <label className="label">Cycle Number</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedCycle(c => Math.max(1, c - 1))} className="btn btn-secondary px-3 py-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="px-6 py-2 bg-[var(--color-bg-main)] rounded-lg text-lg font-bold text-[var(--color-text-dark)] min-w-[80px] text-center">{selectedCycle}</span>
                <button onClick={() => setSelectedCycle(c => c + 1)} className="btn btn-secondary px-3 py-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-light)]">
                {new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (15 days)
              </p>
            </div>

            {/* Auto-rotation preview */}
            <div className="space-y-3">
              <label className="label">Auto-Rotation Preview</label>
              <div className="space-y-2">
                {PLATOON_IDS.map(pid => (
                  <div key={pid} className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-main)] rounded-lg">
                    <span className="text-xs font-semibold text-[var(--color-text-dark)]">Platoon {pid.replace('P', '')}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `color-mix(in srgb, ${DUTY_COLORS[autoRotations[pid]]} 15%, transparent)`, color: DUTY_COLORS[autoRotations[pid]] }}>
                      {DUTY_LABELS[autoRotations[pid]]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
            <button onClick={() => setStep('assign')} className="btn btn-primary">
              Continue to Assignments
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Assign Duties & Locations */}
      {step === 'assign' && (
        <div className="space-y-4">
          {PLATOON_IDS.map(pid => {
            const platoonPersonnel = getPlatoonPersonnel(pid)
            const assignment = assignments[pid]
            if (!assignment) return null
            return (
              <div key={pid} className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: DUTY_COLORS[assignment.duty] }}>
                      {pid}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">Platoon {pid.replace('P', '')}</h3>
                      <p className="text-xs text-[var(--color-text-light)]">{platoonPersonnel.length} active personnel</p>
                    </div>
                  </div>
                  <select
                    value={assignment.duty}
                    onChange={e => handleDutyChange(pid, e.target.value as RotationalDutyType)}
                    className="input w-auto text-sm"
                  >
                    {Object.entries(DUTY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Location assignment for guard duties */}
                {(assignment.duty === 'guard-i' || assignment.duty === 'guard-ii') && (
                  <div className="p-4">
                    <p className="text-xs font-medium text-[var(--color-text-medium)] mb-2">Assign Guard Locations</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {activeLocations.map(loc => {
                        const isSelected = assignment.locationIds.includes(loc.id)
                        return (
                          <button
                            key={loc.id}
                            onClick={() => handleLocationToggle(pid, loc.id)}
                            className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                              isSelected
                                ? 'border-[var(--color-primary)] bg-[var(--color-green-50)]'
                                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                            }`}
                          >
                            <span className="font-medium text-[var(--color-text-dark)]">{loc.name}</span>
                            <span className="block text-[10px] text-[var(--color-text-light)] mt-0.5">{loc.code} · 👥 {loc.requiredPersonnel}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Personnel preview */}
                <div className="px-4 py-3 bg-[var(--color-bg-main)] border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-[var(--color-text-light)] font-medium">Personnel:</span>
                    {platoonPersonnel.slice(0, 8).map(p => (
                      <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-bg-card)] rounded-full text-[10px] text-[var(--color-text-medium)] border border-[var(--color-border)]">
                        {p.name} <span className="text-[var(--color-text-light)]">({p.rank})</span>
                      </span>
                    ))}
                    {platoonPersonnel.length > 8 && (
                      <span className="text-[10px] text-[var(--color-text-light)]">+{platoonPersonnel.length - 8} more</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep('cycle')} className="btn btn-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <button onClick={() => setStep('review')} className="btn btn-primary">
              Review & Save
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Assignment Summary — Cycle {selectedCycle}</h2>
            <p className="text-xs text-[var(--color-text-light)] mb-4">
              {new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <div className="space-y-3">
              {PLATOON_IDS.map(pid => {
                const assignment = assignments[pid]
                if (!assignment) return null
                const platoonPersonnel = getPlatoonPersonnel(pid)
                const assignedLocs = activeLocations.filter(l => assignment.locationIds.includes(l.id))
                return (
                  <div key={pid} className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 bg-[var(--color-bg-main)] rounded-lg">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: DUTY_COLORS[assignment.duty] }}>
                      {pid}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[var(--color-text-dark)]">Platoon {pid.replace('P', '')}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `color-mix(in srgb, ${DUTY_COLORS[assignment.duty]} 15%, transparent)`, color: DUTY_COLORS[assignment.duty] }}>
                          {DUTY_LABELS[assignment.duty]}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-medium)]">{platoonPersonnel.length} personnel</p>
                      {assignedLocs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assignedLocs.map(loc => (
                            <span key={loc.id} className="text-[10px] px-2 py-0.5 bg-[var(--color-bg-card)] rounded border border-[var(--color-border)] text-[var(--color-text-medium)]">
                              📍 {loc.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep('assign')} className="btn btn-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <button onClick={handleSubmit} className="btn btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Save Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
