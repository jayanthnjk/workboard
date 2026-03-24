import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiGateway } from '@/services/apiGateway'
import { rotationService } from '@/services/rotationService'
import { useLanguage } from '@/context/LanguageContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { PlatoonId, RotationalDutyType, Platoon, Personnel, PlatoonRotation } from '@/types'

type ViewMode = 'overview' | 'timeline' | 'calendar'

const PLATOON_IDS: PlatoonId[] = ['P1', 'P2', 'P3', 'P4', 'P5']

const DUTY_META: Record<RotationalDutyType, { label: string; short: string; color: string; bg: string; text: string; icon: string }> = {
  'guard-i':            { label: 'Guard-I',        short: 'G-I',   color: '#22C55E', bg: 'bg-[var(--color-success)]/10',        text: 'text-[var(--color-success)]',        icon: '🛡️' },
  'guard-ii':           { label: 'Guard-II',       short: 'G-II',  color: '#3B82F6', bg: 'bg-[var(--color-info)]/10',           text: 'text-[var(--color-info)]',           icon: '🔰' },
  'check-point':        { label: 'Check Point',    short: 'CP',    color: '#F59E0B', bg: 'bg-[var(--color-warning)]/10',        text: 'text-[var(--color-warning)]',        icon: '🚧' },
  'prison-vip-escort':  { label: 'Prison/VIP',     short: 'PVE',   color: '#8B5CF6', bg: 'bg-[var(--color-accent-indigo)]/10',  text: 'text-[var(--color-accent-indigo)]',  icon: '🚔' },
  'striking-force':     { label: 'Striking Force', short: 'SF',    color: '#EF4444', bg: 'bg-[var(--color-error)]/10',          text: 'text-[var(--color-error)]',          icon: '⚡' },
}

const MAX_CYCLE = 4 // Only show up to cycle 4

export default function SchedulePage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [platoons, setPlatoons] = useState<Platoon[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [storedRotations, setStoredRotations] = useState<PlatoonRotation[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(2026, 1, 1)) // Feb 2026
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const cycleNumber = useMemo(() => {
    const num = rotationService.getCycleNumber(currentDate)
    return Math.min(num, MAX_CYCLE)
  }, [currentDate])
  const cycleDateRange = useMemo(() => rotationService.getCycleDateRange(cycleNumber), [cycleNumber])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [platoonsRes, personnelRes, rotationsRes] = await Promise.all([
          apiGateway.getPlatoons(),
          apiGateway.getAllPersonnel(),
          apiGateway.getPlatoonRotations(),
        ])
        if (platoonsRes.success) setPlatoons(platoonsRes.data)
        if (personnelRes.success) setPersonnel(personnelRes.data)
        if (rotationsRes.success) setStoredRotations(rotationsRes.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Get stored assignments for a cycle (returns map or null if unassigned)
  const getCycleAssignments = useCallback((cycle: number): Map<PlatoonId, RotationalDutyType> | null => {
    const cycleRotations = storedRotations.filter(r => r.cycleNumber === cycle)
    if (cycleRotations.length === 0) return null
    const map = new Map<PlatoonId, RotationalDutyType>()
    cycleRotations.forEach(r => map.set(r.platoonId as PlatoonId, r.dutyType as RotationalDutyType))
    return map
  }, [storedRotations])

  // Get assignment for a specific date (from stored rotations only)
  const getDateAssignments = useCallback((date: Date): Map<PlatoonId, RotationalDutyType> | null => {
    const cycle = rotationService.getCycleNumber(date)
    if (cycle > MAX_CYCLE || cycle < 1) return null
    return getCycleAssignments(cycle)
  }, [getCycleAssignments])

  const currentAssignments = useMemo(() => getCycleAssignments(cycleNumber), [getCycleAssignments, cycleNumber])
  const isCycleAssigned = currentAssignments !== null

  const getPlatoonPersonnel = useCallback((platoonId: PlatoonId) => personnel.filter(p => p.platoon === platoonId), [personnel])

  const navigateCycle = useCallback((direction: 'prev' | 'next') => {
    const newCycle = cycleNumber + (direction === 'next' ? 1 : -1)
    if (newCycle < 1 || newCycle > MAX_CYCLE) return
    const range = rotationService.getCycleDateRange(newCycle)
    setCurrentDate(new Date(range.startDate))
  }, [cycleNumber])

  // Calendar month grid
  const calendarGrid = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    const remainder = cells.length % 7
    if (remainder > 0) for (let i = 0; i < 7 - remainder; i++) cells.push(null)
    return cells
  }, [calendarMonth])

  const navigateMonth = useCallback((dir: 'prev' | 'next') => {
    setCalendarMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1))
      return d
    })
    setExpandedDay(null)
  }, [])

  // Navigate to assign page for a cycle
  const goToAssignCycle = useCallback((cycle: number) => {
    navigate(`/schedule/new?cycle=${cycle}`)
  }, [navigate])

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  const assignedCycleCount = new Set(storedRotations.map(r => r.cycleNumber)).size

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('schedules')}</h1>
          <p className="page-subtitle">{t('manage_duty_rotations')}</p>
        </div>
        <Link to="/schedule/new" className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          {t('new_assignment')}
        </Link>
      </div>

      {/* Stats - Compact Inline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-3 border-l-[3px] border-l-[var(--color-success)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-1">Cycles</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-[var(--color-text-dark)]">{assignedCycleCount}</span>
            <span className="text-xs text-[var(--color-text-light)]">/ {MAX_CYCLE}</span>
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--color-success)] transition-all" style={{ width: `${(assignedCycleCount / MAX_CYCLE) * 100}%` }} />
          </div>
        </div>
        <div className="card p-3 border-l-[3px] border-l-[var(--color-info)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-1">{t('active_platoons')}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[var(--color-text-dark)]">{platoons.length}</span>
            <span className="text-[10px] text-[var(--color-text-light)]">groups</span>
          </div>
        </div>
        <div className="card p-3 border-l-[3px] border-l-[var(--color-accent-indigo)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-1">{t('total_personnel')}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[var(--color-text-dark)]">{personnel.length}</span>
            <span className="text-[10px] text-[var(--color-text-light)]">active</span>
          </div>
        </div>
        <div className="card p-3 border-l-[3px] border-l-[var(--color-warning)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-1">Current Cycle</p>
          <p className="text-sm font-bold text-[var(--color-text-dark)]">
            {new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          <p className="text-[10px] text-[var(--color-text-light)] mt-0.5">15-day rotation</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(DUTY_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: meta.color }} />
            <span className="text-[11px] text-[var(--color-text-medium)] font-medium">{meta.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-border)] border border-dashed border-[var(--color-text-light)]" />
          <span className="text-[11px] text-[var(--color-text-light)] font-medium">Unassigned</span>
        </div>
      </div>

      {/* View Controls + Cycle Navigation */}
      <div className="card p-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* View Mode Tabs */}
          <div className="flex bg-[var(--color-bg-tertiary)] rounded-lg p-0.5">
            {(['overview', 'timeline', 'calendar'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-text-medium)] hover:text-[var(--color-text-dark)]'
                }`}
              >
                {mode === 'overview' ? '📋 Overview' : mode === 'timeline' ? '📊 Timeline' : '📅 Calendar'}
              </button>
            ))}
          </div>

          {/* Cycle Navigation (for overview & timeline) */}
          {viewMode !== 'calendar' && (
            <div className="flex items-center gap-3">
              <button onClick={() => navigateCycle('prev')} disabled={cycleNumber <= 1} className="p-1.5 rounded-md hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="text-center min-w-[180px]">
                <p className="text-sm font-semibold text-[var(--color-text-dark)]">Cycle {cycleNumber} of {MAX_CYCLE}</p>
                <p className="text-[10px] text-[var(--color-text-light)]">
                  {new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => navigateCycle('next')} disabled={cycleNumber >= MAX_CYCLE} className="p-1.5 rounded-md hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}

          {/* Month Navigation (for calendar) */}
          {viewMode === 'calendar' && (
            <div className="flex items-center gap-3">
              <button onClick={() => navigateMonth('prev')} className="p-1.5 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <p className="text-sm font-semibold text-[var(--color-text-dark)] min-w-[140px] text-center">
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <button onClick={() => navigateMonth('next')} className="p-1.5 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== OVERVIEW VIEW ===== */}
      {viewMode === 'overview' && (
        <div className="card overflow-hidden">
          {isCycleAssigned ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-bg-tertiary)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">Platoon</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">Duty Type</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">Personnel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">Period</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {PLATOON_IDS.map(pid => {
                    const duty = currentAssignments!.get(pid)
                    const meta = duty ? DUTY_META[duty] : null
                    const pCount = getPlatoonPersonnel(pid).length
                    const platoon = platoons.find(p => p.id === pid)
                    return (
                      <tr key={pid} onClick={() => navigate(`/schedule/platoon/${pid}`)} className="hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">{pid}</div>
                            <span className="font-medium text-[var(--color-text-dark)]">{platoon?.name || pid}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {meta && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}>
                              <span>{meta.icon}</span> {meta.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-[var(--color-text-dark)]">{pCount}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-text-medium)]">
                          {new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] font-medium">
                            View Details
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-text-dark)]">Cycle {cycleNumber} is not assigned yet</p>
                <p className="text-xs text-[var(--color-text-light)] mt-1">Assign duty types to platoons for this cycle</p>
              </div>
              <button onClick={() => goToAssignCycle(cycleNumber)} className="btn btn-primary text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Assign Cycle {cycleNumber}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== TIMELINE VIEW ===== */}
      {viewMode === 'timeline' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Timeline Header - compact */}
              <div className="flex border-b border-[var(--color-border)]">
                <div className="w-[100px] shrink-0 px-3 py-2 bg-[var(--color-bg-tertiary)]">
                  <p className="text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-wider">Platoon</p>
                </div>
                <div className="flex-1 grid grid-cols-4">
                  {Array.from({ length: MAX_CYCLE }, (_, i) => i + 1).map(c => {
                    const range = rotationService.getCycleDateRange(c)
                    const isCurrentCycle = c === cycleNumber
                    const isAssigned = getCycleAssignments(c) !== null
                    return (
                      <div key={c} className={`px-2 py-2 text-center border-l border-[var(--color-border)] relative ${isCurrentCycle ? 'bg-[var(--color-primary)]/5' : ''}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <p className={`text-[11px] font-bold ${isCurrentCycle ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dark)]'}`}>C{c}</p>
                          {isAssigned && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />}
                          {!isAssigned && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border)]" />}
                        </div>
                        <p className="text-[9px] text-[var(--color-text-light)] leading-tight">
                          {new Date(range.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(range.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        {isCurrentCycle && <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--color-primary)] rounded-t" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Timeline Rows - Gantt bars */}
              {PLATOON_IDS.map((pid, rowIdx) => {
                const platoon = platoons.find(p => p.id === pid)
                const pCount = getPlatoonPersonnel(pid).length
                return (
                  <div key={pid} className={`flex border-b border-[var(--color-border)] last:border-b-0 group ${rowIdx % 2 === 0 ? '' : 'bg-[var(--color-bg-secondary)]/30'}`}>
                    {/* Platoon Label */}
                    <div className="w-[100px] shrink-0 px-3 py-2.5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[var(--color-primary)]/10 flex items-center justify-center text-[9px] font-bold text-[var(--color-primary)]">{pid}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-[var(--color-text-dark)] truncate leading-tight">{platoon?.name?.replace('PLATOON-', 'PLT-') || pid}</p>
                        <p className="text-[9px] text-[var(--color-text-light)]">{pCount} pax</p>
                      </div>
                    </div>

                    {/* Gantt Cells */}
                    <div className="flex-1 grid grid-cols-4">
                      {Array.from({ length: MAX_CYCLE }, (_, i) => i + 1).map(c => {
                        const assignments = getCycleAssignments(c)
                        const duty = assignments?.get(pid)
                        const meta = duty ? DUTY_META[duty] : null
                        const isCurrentCycle = c === cycleNumber
                        return (
                          <div key={c} className={`border-l border-[var(--color-border)] px-1.5 py-2 flex items-center ${isCurrentCycle ? 'bg-[var(--color-primary)]/5' : ''}`}>
                            {meta ? (
                              <Link to={`/schedule/platoon/${pid}`} className="w-full block">
                                <div
                                  className="flex items-center gap-1.5 rounded-md px-2 py-1.5 w-full cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
                                  style={{ background: `${meta.color}12`, borderLeft: `3px solid ${meta.color}` }}
                                >
                                  {/* Subtle gradient overlay */}
                                  <div className="absolute inset-0 opacity-[0.03]" style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />
                                  <span className="text-xs relative z-10">{meta.icon}</span>
                                  <div className="relative z-10 min-w-0 flex-1">
                                    <p className="text-[11px] font-bold leading-tight" style={{ color: meta.color }}>{meta.short}</p>
                                    <p className="text-[8px] text-[var(--color-text-light)] leading-tight truncate">{meta.label}</p>
                                  </div>
                                  <svg className="w-3 h-3 text-[var(--color-text-light)] opacity-0 group-hover:opacity-60 transition-opacity shrink-0 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                              </Link>
                            ) : (
                              <button
                                onClick={() => goToAssignCycle(c)}
                                className="w-full rounded-md border border-dashed border-[var(--color-border)] px-2 py-1.5 flex items-center justify-center gap-1 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all group/btn"
                              >
                                <svg className="w-3 h-3 text-[var(--color-text-light)] group-hover/btn:text-[var(--color-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                <span className="text-[9px] text-[var(--color-text-light)] group-hover/btn:text-[var(--color-primary)] font-medium">Assign</span>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Summary Footer */}
              <div className="flex border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/50">
                <div className="w-[100px] shrink-0 px-3 py-2">
                  <p className="text-[9px] font-semibold text-[var(--color-text-light)] uppercase">Summary</p>
                </div>
                <div className="flex-1 grid grid-cols-4">
                  {Array.from({ length: MAX_CYCLE }, (_, i) => i + 1).map(c => {
                    const assignments = getCycleAssignments(c)
                    const assignedCount = assignments ? assignments.size : 0
                    return (
                      <div key={c} className="border-l border-[var(--color-border)] px-2 py-2 flex items-center gap-1.5">
                        {assignments ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                            <span className="text-[9px] text-[var(--color-success)] font-medium">{assignedCount}/{PLATOON_IDS.length} assigned</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-light)]" />
                            <span className="text-[9px] text-[var(--color-text-light)]">Not assigned</span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CALENDAR VIEW ===== */}
      {viewMode === 'calendar' && (
        <div className="card overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarGrid.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="min-h-[100px] bg-[var(--color-bg-tertiary)]/50 border-b border-r border-[var(--color-border)]" />

              const dateStr = date.toISOString().split('T')[0]
              const cycle = rotationService.getCycleNumber(date)
              const inRange = cycle >= 1 && cycle <= MAX_CYCLE
              const assignments = inRange ? getDateAssignments(date) : null
              const isToday = dateStr === new Date().toISOString().split('T')[0]
              const isExpanded = expandedDay === dateStr

              return (
                <div
                  key={dateStr}
                  onClick={() => setExpandedDay(isExpanded ? null : dateStr)}
                  className={`min-h-[100px] border-b border-r border-[var(--color-border)] p-1.5 cursor-pointer transition-colors ${
                    isToday ? 'bg-[var(--color-primary)]/5' : 'hover:bg-[var(--color-bg-secondary)]'
                  } ${isExpanded ? 'ring-2 ring-[var(--color-primary)] ring-inset' : ''}`}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${isToday ? 'bg-[var(--color-primary)] text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-[var(--color-text-dark)]'}`}>
                      {date.getDate()}
                    </span>
                    {inRange && (
                      <span className="text-[9px] text-[var(--color-text-light)] font-medium">C{cycle}</span>
                    )}
                  </div>

                  {/* Duty Chips */}
                  {assignments ? (
                    <div className="space-y-0.5">
                      {isExpanded ? (
                        // Expanded: show all platoons
                        PLATOON_IDS.map(pid => {
                          const duty = assignments.get(pid)
                          const meta = duty ? DUTY_META[duty] : null
                          if (!meta) return null
                          return (
                            <div key={pid} className="flex items-center gap-1 rounded px-1 py-0.5" style={{ background: `${meta.color}15` }}>
                              <span className="text-[9px]">{meta.icon}</span>
                              <span className="text-[9px] font-medium" style={{ color: meta.color }}>{pid}: {meta.short}</span>
                            </div>
                          )
                        })
                      ) : (
                        // Collapsed: show color dots
                        <div className="flex flex-wrap gap-0.5">
                          {PLATOON_IDS.map(pid => {
                            const duty = assignments.get(pid)
                            const meta = duty ? DUTY_META[duty] : null
                            if (!meta) return null
                            return <span key={pid} className="w-2 h-2 rounded-full" style={{ background: meta.color }} title={`${pid}: ${meta.label}`} />
                          })}
                        </div>
                      )}
                    </div>
                  ) : inRange ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); goToAssignCycle(cycle) }}
                      className="w-full mt-1 rounded border border-dashed border-[var(--color-border)] py-1 text-[9px] text-[var(--color-text-light)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      + Assign
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
