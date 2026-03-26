import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGateway } from '@/services/apiGateway'
import { rotationService } from '@/services/rotationService'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Pagination } from '@/components/common/Pagination'
import type { Employee, ShiftAssignment, ShiftType, LeaveRequest, Personnel, PoliceRank, Platoon, PlatoonRotation, PlatoonId, RotationalDutyType } from '@/types'

type ViewRange = 'day' | 'week' | 'month'

// Rank hierarchy for grouping (high to low)
const RANK_HIERARCHY: { rank: PoliceRank; label: string }[] = [
  { rank: 'DCP', label: 'DCP — Deputy Commissioner' },
  { rank: 'ACP', label: 'ACP — Assistant Commissioner' },
  { rank: 'RPI', label: 'RPI — Reserve Police Inspector' },
  { rank: 'RSI', label: 'RSI — Reserve Sub-Inspector' },
  { rank: 'ARSI', label: 'ARSI — Addl. Reserve Sub-Inspector' },
  { rank: 'AHC', label: 'AHC — Addl. Head Constable' },
  { rank: 'APC', label: 'APC — Armed Police Constable' },
]

const PLATOON_IDS: PlatoonId[] = ['P1', 'P2', 'P3', 'P4', 'P5']
const MAX_CYCLE = 4

const DUTY_META: Record<RotationalDutyType, { label: string; short: string; color: string; icon: string }> = {
  'guard-i':           { label: 'Guard-I',        short: 'G-I',  color: '#22C55E', icon: '🛡️' },
  'guard-ii':          { label: 'Guard-II',       short: 'G-II', color: '#3B82F6', icon: '🔰' },
  'check-point':       { label: 'Check Point',    short: 'CP',   color: '#F59E0B', icon: '🚧' },
  'prison-vip-escort': { label: 'Prison/VIP',     short: 'PVE',  color: '#8B5CF6', icon: '🚔' },
  'striking-force':    { label: 'Striking Force', short: 'SF',   color: '#EF4444', icon: '⚡' },
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const DAY_NAMES_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const LEAVE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  annual: { bg: '#8B5CF6', text: '#fff', label: 'Annual' },
  sick: { bg: '#EF4444', text: '#fff', label: 'Sick' },
  personal: { bg: '#F59E0B', text: '#fff', label: 'Personal' },
  unpaid: { bg: '#6B7280', text: '#fff', label: 'Unpaid' },
  maternity: { bg: '#EC4899', text: '#fff', label: 'Maternity' },
  paternity: { bg: '#06B6D4', text: '#fff', label: 'Paternity' },
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
}

export default function ShiftSchedulePage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [personnelList, setPersonnelList] = useState<Personnel[]>([])
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [platoons, setPlatoons] = useState<Platoon[]>([])
  const [storedRotations, setStoredRotations] = useState<PlatoonRotation[]>([])

  const [viewRange, setViewRange] = useState<ViewRange>('week')
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [monthDate, setMonthDate] = useState(() => new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [showOpenShifts, setShowOpenShifts] = useState(true)
  const [showTimeOff, setShowTimeOff] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expandedMonthDay, setExpandedMonthDay] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, typesRes, leaveRes, personnelRes, platoonsRes, rotationsRes] = await Promise.all([
          apiGateway.getEmployees(1, 200),
          apiGateway.getShiftTypes(),
          apiGateway.getLeaveRequests(),
          apiGateway.getAllPersonnel(),
          apiGateway.getPlatoons(),
          apiGateway.getPlatoonRotations(),
        ])
        if (empRes.data) setEmployees(empRes.data)
        if (typesRes.success) setShiftTypes(typesRes.data)
        if (leaveRes.success) setLeaveRequests(leaveRes.data)
        if (personnelRes.success) setPersonnelList(personnelRes.data)
        if (platoonsRes.success) setPlatoons(platoonsRes.data)
        if (rotationsRes.success) setStoredRotations(rotationsRes.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch shift assignments when date range changes
  useEffect(() => {
    const fetchAssignments = async () => {
      let start: string, end: string
      if (viewRange === 'day') {
        start = end = formatDate(selectedDay)
      } else if (viewRange === 'week') {
        start = formatDate(weekStart)
        const we = new Date(weekStart); we.setDate(we.getDate() + 6)
        end = formatDate(we)
      } else {
        const ms = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
        const me = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        start = formatDate(ms); end = formatDate(me)
      }
      try {
        const res = await apiGateway.getShiftAssignments(start, end)
        if (res.success) setShiftAssignments(res.data)
      } catch (e) { console.error(e) }
    }
    if (!loading) fetchAssignments()
  }, [viewRange, weekStart, selectedDay, monthDate, loading])

  // Map employee ID -> personnel rank
  const empRankMap = useMemo(() => {
    const map = new Map<string, PoliceRank>()
    employees.forEach(emp => {
      const p = personnelList.find(per => per.personnelId === emp.employeeId)
      if (p) map.set(emp.id, p.rank)
    })
    return map
  }, [employees, personnelList])

  // Current cycle info
  const cycleNumber = useMemo(() => {
    const num = rotationService.getCycleNumber(new Date())
    return Math.min(num, MAX_CYCLE)
  }, [])
  const cycleDateRange = useMemo(() => rotationService.getCycleDateRange(cycleNumber), [cycleNumber])

  // Get stored assignments for current cycle
  const currentCycleAssignments = useMemo((): Map<PlatoonId, RotationalDutyType> | null => {
    const cycleRotations = storedRotations.filter(r => r.cycleNumber === cycleNumber)
    if (cycleRotations.length === 0) return null
    const map = new Map<PlatoonId, RotationalDutyType>()
    cycleRotations.forEach(r => map.set(r.platoonId as PlatoonId, r.dutyType as RotationalDutyType))
    return map
  }, [storedRotations, cycleNumber])

  // Columns for day/week views only
  const viewColumns = useMemo((): Date[] => {
    if (viewRange === 'day') return [selectedDay]
    if (viewRange === 'week') {
      const days: Date[] = []
      for (let i = 0; i < 7; i++) { const d = new Date(weekStart); d.setDate(d.getDate() + i); days.push(d) }
      return days
    }
    // Month: all days (used for data fetching, not for grid rendering)
    const y = monthDate.getFullYear(), m = monthDate.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const days: Date[] = []
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(y, m, d))
    return days
  }, [viewRange, weekStart, selectedDay, monthDate])

  const shiftTypeMap = useMemo(() => {
    const map = new Map<string, ShiftType>()
    shiftTypes.forEach(st => map.set(st.id, st))
    return map
  }, [shiftTypes])

  // Filtered employees by search + rank group
  const filteredEmployees = useMemo(() => {
    let result = employees
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e => e.name.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
    }
    if (groupFilter !== 'all') {
      result = result.filter(e => empRankMap.get(e.id) === groupFilter)
    }
    return result
  }, [employees, searchQuery, groupFilter, empRankMap])

  // Paginated employees
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEmployees.slice(start, start + pageSize)
  }, [filteredEmployees, currentPage, pageSize])

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1) }, [searchQuery, groupFilter, viewRange])

  const assignmentMap = useMemo(() => {
    const map = new Map<string, ShiftAssignment[]>()
    shiftAssignments.forEach(a => {
      const key = `${a.employeeId}|${a.date}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    })
    return map
  }, [shiftAssignments])

  const getLeaveForDate = useCallback((employeeId: string, date: Date): LeaveRequest | null => {
    const dateStr = formatDate(date)
    return leaveRequests.find(lr =>
      lr.employeeId === employeeId && lr.status !== 'cancelled' && lr.status !== 'rejected' &&
      dateStr >= lr.startDate && dateStr <= lr.endDate
    ) || null
  }, [leaveRequests])

  const getWeeklyHours = useCallback((employeeId: string): number => {
    let total = 0
    viewColumns.forEach(day => {
      const key = `${employeeId}|${formatDate(day)}`
      const assignments = assignmentMap.get(key) || []
      assignments.forEach(a => {
        const st = shiftTypeMap.get(a.shiftTypeId)
        if (st) {
          const [sh, sm] = st.startTime.split(':').map(Number)
          const [eh, em] = st.endTime.split(':').map(Number)
          let hours = (eh * 60 + em - sh * 60 - sm) / 60
          if (hours < 0) hours += 24
          total += hours - st.breakDuration / 60
        }
      })
    })
    return Math.round(total * 10) / 10
  }, [viewColumns, assignmentMap, shiftTypeMap])

  const openShiftsByDay = useMemo(() => {
    const map = new Map<string, number>()
    viewColumns.forEach(day => {
      const dateStr = formatDate(day)
      const dayAssignments = shiftAssignments.filter(a => a.date === dateStr)
      const assignedCount = new Set(dayAssignments.map(a => a.employeeId)).size
      map.set(dateStr, Math.max(0, employees.length - assignedCount))
    })
    return map
  }, [viewColumns, shiftAssignments, employees])

  // Calendar grid for month view (7 columns Mon-Sun, padded with nulls)
  const calendarGrid = useMemo(() => {
    if (viewRange !== 'month') return []
    const y = monthDate.getFullYear(), m = monthDate.getMonth()
    const firstDay = new Date(y, m, 1).getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const cells: (Date | null)[] = []
    const startPad = firstDay === 0 ? 6 : firstDay - 1
    for (let i = 0; i < startPad; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))
    const remainder = cells.length % 7
    if (remainder > 0) for (let i = 0; i < 7 - remainder; i++) cells.push(null)
    return cells
  }, [viewRange, monthDate])

  // Month day summaries: shifts by type, leave count, open count
  const monthDaySummaries = useMemo(() => {
    if (viewRange !== 'month') return new Map<string, { shifts: Map<string, number>; leaves: number; open: number; total: number }>()
    const map = new Map<string, { shifts: Map<string, number>; leaves: number; open: number; total: number }>()
    const y = monthDate.getFullYear(), m = monthDate.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d)
      const dateStr = formatDate(date)
      const shifts = new Map<string, number>()
      let leaveCount = 0
      const assignedSet = new Set<string>()
      shiftAssignments.filter(a => a.date === dateStr).forEach(a => {
        assignedSet.add(a.employeeId)
        const count = shifts.get(a.shiftTypeId) || 0
        shifts.set(a.shiftTypeId, count + 1)
      })
      filteredEmployees.forEach(emp => {
        const leave = getLeaveForDate(emp.id, date)
        if (leave) leaveCount++
      })
      const totalShifts = Array.from(shifts.values()).reduce((s, v) => s + v, 0)
      const openCount = Math.max(0, filteredEmployees.length - assignedSet.size - leaveCount)
      map.set(dateStr, { shifts, leaves: leaveCount, open: openCount, total: totalShifts })
    }
    return map
  }, [viewRange, monthDate, shiftAssignments, filteredEmployees, getLeaveForDate])

  // Navigation
  const navigateRange = useCallback((dir: 'prev' | 'next') => {
    const delta = dir === 'next' ? 1 : -1
    if (viewRange === 'day') {
      setSelectedDay(prev => { const d = new Date(prev); d.setDate(d.getDate() + delta); return d })
    } else if (viewRange === 'week') {
      setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + delta * 7); return d })
    } else {
      setMonthDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + delta); return d })
    }
  }, [viewRange])

  const goToToday = useCallback(() => {
    const now = new Date()
    setSelectedDay(now)
    setWeekStart(getMonday(now))
    setMonthDate(now)
  }, [])

  const rangeLabel = useMemo(() => {
    if (viewRange === 'day') {
      const dayIdx = (selectedDay.getDay() + 6) % 7
      return `${DAY_NAMES_FULL[dayIdx]}, ${selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    if (viewRange === 'week') {
      const end = new Date(weekStart); end.setDate(end.getDate() + 6)
      const sm = weekStart.toLocaleDateString('en-US', { month: 'short' })
      const em = end.toLocaleDateString('en-US', { month: 'short' })
      return sm === em ? `${sm} ${weekStart.getDate()} - ${end.getDate()}, ${end.getFullYear()}` : `${sm} ${weekStart.getDate()} - ${em} ${end.getDate()}, ${end.getFullYear()}`
    }
    return `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`
  }, [viewRange, weekStart, selectedDay, monthDate])

  const handleAssignShift = useCallback((employeeId: string, date: string) => {
    navigate(`/shift-schedule/assign?employee=${employeeId}&date=${date}`)
  }, [navigate])

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">Schedule</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">Manage team schedules and shifts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="btn btn-secondary text-xs gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
          <button onClick={() => {
            const rows = [['Employee', 'Date', 'Shift', 'Start', 'End']]
            shiftAssignments.forEach(a => {
              const emp = employees.find(e => e.id === a.employeeId)
              const st = shiftTypeMap.get(a.shiftTypeId)
              rows.push([emp?.name || a.employeeId, a.date, st?.name || a.shiftTypeId, st?.startTime || '', st?.endTime || ''])
            })
            const csv = rows.map(r => r.join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url; link.download = `schedule-export-${formatDate(new Date())}.csv`
            link.click(); URL.revokeObjectURL(url)
          }} className="btn btn-secondary text-xs gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export
          </button>
          <button onClick={() => navigate('/schedule/new')} className="btn btn-primary text-xs gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            New Assignment
          </button>
        </div>
      </div>

      {/* ===== CURRENT CYCLE TIMELINE ===== */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-dark)]">Current Rotation</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--color-primary)] text-white font-bold">Cycle {cycleNumber}</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-light)]">
            {new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {currentCycleAssignments ? (
          <div className="grid grid-cols-1 sm:grid-cols-5">
            {PLATOON_IDS.map((pid, idx) => {
              const duty = currentCycleAssignments.get(pid)
              const meta = duty ? DUTY_META[duty] : null
              const platoon = platoons.find(p => p.id === pid)
              return (
                <div
                  key={pid}
                  onClick={() => navigate(`/schedule/platoon/${pid}`)}
                  className={`flex sm:flex-col items-center sm:items-stretch gap-3 sm:gap-0 px-4 py-4 sm:py-5 cursor-pointer transition-all hover:bg-[var(--color-bg-secondary)]/40 group ${idx < 4 ? 'border-b sm:border-b-0 sm:border-r border-[var(--color-border)]' : ''}`}
                >
                  {/* Platoon label */}
                  <div className="sm:text-center sm:mb-3 shrink-0">
                    <p className="text-[11px] font-semibold text-[var(--color-text-dark)]">{platoon?.name || `Platoon ${pid}`}</p>
                  </div>
                  {/* Duty bar */}
                  {meta ? (
                    <div className="flex-1 sm:flex-none rounded-lg px-3 py-2.5 sm:py-3 relative overflow-hidden transition-shadow group-hover:shadow-md w-full"
                      style={{ background: `${meta.color}12`, borderLeft: `4px solid ${meta.color}` }}>
                      <div className="absolute inset-0 opacity-[0.03]" style={{ background: `linear-gradient(135deg, ${meta.color}, transparent)` }} />
                      <div className="relative z-10 flex items-center gap-2">
                        <span className="text-lg">{meta.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold leading-tight" style={{ color: meta.color }}>{meta.short}</p>
                          <p className="text-[10px] text-[var(--color-text-light)] leading-tight">{meta.label}</p>
                        </div>
                        <svg className="w-4 h-4 text-[var(--color-text-light)] opacity-0 group-hover:opacity-60 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 sm:flex-none rounded-lg border border-dashed border-[var(--color-border)] px-3 py-3 flex items-center justify-center gap-1.5 text-[var(--color-text-light)] w-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      <span className="text-[10px] font-medium">Not assigned</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
            <p className="text-xs text-[var(--color-text-medium)]">Cycle {cycleNumber} is not assigned yet</p>
            <button onClick={() => navigate(`/schedule/new?cycle=${cycleNumber}`)} className="btn btn-primary text-xs">
              Assign Cycle {cycleNumber}
            </button>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="card p-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigateRange('prev')} className="p-1.5 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors">
              <svg className="w-4 h-4 text-[var(--color-text-medium)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => navigateRange('next')} className="p-1.5 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors">
              <svg className="w-4 h-4 text-[var(--color-text-medium)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <span className="text-sm font-semibold text-[var(--color-text-dark)] min-w-[180px]">{rangeLabel}</span>
            <button onClick={goToToday} className="px-3 py-1 text-xs font-medium border border-[var(--color-border)] rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-dark)] transition-colors">
              Today
            </button>
            <div className="flex bg-[var(--color-bg-tertiary)] rounded-lg p-0.5 ml-2">
              {(['day', 'week', 'month'] as ViewRange[]).map(mode => (
                <button key={mode} onClick={() => setViewRange(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${viewRange === mode ? 'bg-[var(--color-bg-primary)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-medium)] hover:text-[var(--color-text-dark)]'}`}>
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-dark)] outline-none">
              <option value="all">All Ranks</option>
              {RANK_HIERARCHY.map(r => <option key={r.rank} value={r.rank}>{r.label}</option>)}
            </select>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <div className={`relative w-8 h-4 rounded-full transition-colors ${showOpenShifts ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} onClick={() => setShowOpenShifts(!showOpenShifts)}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${showOpenShifts ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-[var(--color-text-medium)]">Open Shifts</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <div className={`relative w-8 h-4 rounded-full transition-colors ${showTimeOff ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} onClick={() => setShowTimeOff(!showTimeOff)}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${showTimeOff ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-[var(--color-text-medium)]">Time Off</span>
            </label>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-2">
        <svg className="w-4 h-4 text-[var(--color-text-light)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" placeholder="Search employees by name, ID, or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] outline-none flex-1" />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* ===== MONTH CALENDAR VIEW ===== */}
      {viewRange === 'month' && (
        <div className="card overflow-hidden">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
            {DAY_NAMES_SHORT.map(d => (
              <div key={d} className="px-2 py-2.5 text-center text-[10px] font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {calendarGrid.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="min-h-[110px] bg-[var(--color-bg-tertiary)]/30 border-b border-r border-[var(--color-border)]" />

              const dateStr = formatDate(date)
              const isToday = isSameDay(date, today)
              const summary = monthDaySummaries.get(dateStr)
              const isExpanded = expandedMonthDay === dateStr
              const isWeekend = date.getDay() === 0 || date.getDay() === 6

              return (
                <div
                  key={dateStr}
                  onClick={() => setExpandedMonthDay(isExpanded ? null : dateStr)}
                  className={`min-h-[110px] border-b border-r border-[var(--color-border)] p-1.5 cursor-pointer transition-colors ${
                    isToday ? 'bg-[var(--color-primary)]/5' : isWeekend ? 'bg-[var(--color-bg-tertiary)]/20' : 'hover:bg-[var(--color-bg-secondary)]/30'
                  } ${isExpanded ? 'ring-2 ring-[var(--color-primary)] ring-inset bg-[var(--color-bg-secondary)]/20' : ''}`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold ${isToday ? 'bg-[var(--color-primary)] text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-[var(--color-text-dark)]'}`}>
                      {date.getDate()}
                    </span>
                    {summary && summary.total > 0 && (
                      <span className="text-[9px] text-[var(--color-text-light)] font-medium">{summary.total}s</span>
                    )}
                  </div>

                  {summary && (summary.total > 0 || summary.leaves > 0) ? (
                    isExpanded ? (
                      <div className="space-y-1">
                        {Array.from(summary.shifts.entries()).map(([stId, count]) => {
                          const st = shiftTypeMap.get(stId)
                          if (!st) return null
                          return (
                            <div key={stId} className="flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: `${st.colorCode}18` }}>
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st.colorCode }} />
                              <span className="text-[9px] font-medium truncate" style={{ color: st.colorCode }}>{st.name.split('(')[0].trim()}</span>
                              <span className="text-[9px] text-[var(--color-text-light)] ml-auto flex-shrink-0">{count}</span>
                            </div>
                          )
                        })}
                        {showTimeOff && summary.leaves > 0 && (
                          <div className="flex items-center gap-1 rounded px-1.5 py-0.5 bg-[#8B5CF6]/10">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#8B5CF6]" />
                            <span className="text-[9px] font-medium text-[#8B5CF6]">Leave</span>
                            <span className="text-[9px] text-[var(--color-text-light)] ml-auto">{summary.leaves}</span>
                          </div>
                        )}
                        {showOpenShifts && summary.open > 0 && (
                          <div className="flex items-center gap-1 rounded px-1.5 py-0.5 bg-[var(--color-bg-tertiary)]">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 border border-dashed border-[var(--color-text-light)]" />
                            <span className="text-[9px] text-[var(--color-text-light)]">Open</span>
                            <span className="text-[9px] text-[var(--color-text-light)] ml-auto">{summary.open}</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewRange('day'); setSelectedDay(date) }}
                          className="w-full mt-0.5 text-[9px] text-[var(--color-primary)] font-medium hover:underline text-center py-0.5"
                        >
                          View Day →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {Array.from(summary.shifts.entries()).map(([stId, count]) => {
                            const st = shiftTypeMap.get(stId)
                            if (!st) return null
                            return (
                              <div key={stId} className="flex items-center gap-0.5" title={`${st.name}: ${count}`}>
                                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: st.colorCode }} />
                                <span className="text-[9px] font-medium text-[var(--color-text-medium)]">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          {showTimeOff && summary.leaves > 0 && (
                            <div className="flex items-center gap-0.5" title={`${summary.leaves} on leave`}>
                              <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" />
                              <span className="text-[9px] text-[var(--color-text-light)]">{summary.leaves}</span>
                            </div>
                          )}
                          {showOpenShifts && summary.open > 0 && (
                            <span className="text-[9px] text-[var(--color-text-light)]">{summary.open} open</span>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center h-12">
                      <span className="text-[10px] text-[var(--color-text-light)]">—</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== DAY / WEEK GRID VIEW ===== */}
      {viewRange !== 'month' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <div className={viewRange === 'day' ? 'min-w-[400px]' : 'min-w-[800px]'}>
              {/* Column Headers */}
              <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                <div className="w-[180px] shrink-0 px-4 py-3 text-xs font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">
                  Team Members
                </div>
                {viewColumns.map((day, idx) => {
                  const isToday = isSameDay(day, today)
                  const dayIdx = (day.getDay() + 6) % 7
                  return (
                    <div key={idx} className={`min-w-[100px] flex-1 px-1 sm:px-2 py-3 text-center border-l border-[var(--color-border)] ${isToday ? 'bg-[var(--color-primary)]/5' : ''}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-light)]'}`}>
                        {DAY_NAMES_SHORT[dayIdx]}
                      </p>
                      <p className={`text-lg font-bold ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dark)]'}`}>
                        {day.getDate()}
                      </p>
                    </div>
                  )
                })}
                <div className="w-[60px] shrink-0 px-2 py-3 text-center border-l border-[var(--color-border)]">
                  <p className="text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-wider">Hours</p>
                </div>
              </div>

              {/* Open Shifts Row */}
              {showOpenShifts && (
                <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30">
                  <div className="w-[180px] shrink-0 px-4 py-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-text-dark)]">Open Shifts</span>
                  </div>
                  {viewColumns.map((day, idx) => {
                    const isToday = isSameDay(day, today)
                    const openCount = openShiftsByDay.get(formatDate(day)) || 0
                    return (
                      <div key={idx} className={`min-w-[100px] flex-1 px-1 py-3 border-l border-[var(--color-border)] flex items-center justify-center ${isToday ? 'bg-[var(--color-primary)]/5' : ''}`}>
                        {openCount > 0 && (
                          <span className="text-[10px] text-[var(--color-text-light)] bg-[var(--color-bg-main)] border border-dashed border-[var(--color-border)] rounded px-2 py-1">
                            {openCount} open
                          </span>
                        )}
                      </div>
                    )
                  })}
                  <div className="w-[60px] shrink-0 border-l border-[var(--color-border)]" />
                </div>
              )}

              {/* Employee Rows */}
              {paginatedEmployees.map((emp, rowIdx) => {
                const weeklyHours = getWeeklyHours(emp.id)
                const hasHighHours = weeklyHours > 40
                const rank = empRankMap.get(emp.id)
                return (
                  <div key={emp.id} className={`flex border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-secondary)]/20 transition-colors ${rowIdx % 2 === 0 ? '' : 'bg-[var(--color-bg-secondary)]/10'}`}>
                    <div className="w-[180px] shrink-0 px-4 py-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: `hsl(${(emp.name.charCodeAt(0) * 37 + (emp.name.charCodeAt(1) || 0) * 17) % 360}, 55%, 50%)` }}>
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--color-text-dark)] truncate">{emp.name}</p>
                        <p className="text-[10px] text-[var(--color-text-light)] uppercase">{rank || emp.role}</p>
                      </div>
                    </div>

                    {viewColumns.map((day, dayIdx) => {
                      const dateStr = formatDate(day)
                      const isToday = isSameDay(day, today)
                      const key = `${emp.id}|${dateStr}`
                      const dayAssignments = assignmentMap.get(key) || []
                      const leave = showTimeOff ? getLeaveForDate(emp.id, day) : null

                      return (
                        <div key={dayIdx} className={`min-w-[100px] flex-1 px-1 py-1.5 border-l border-[var(--color-border)] flex flex-col gap-1 justify-center ${isToday ? 'bg-[var(--color-primary)]/5' : ''}`}>
                          {leave ? (
                            <div className="rounded-md px-2 py-1.5 text-[10px] font-medium truncate"
                              style={{ background: LEAVE_COLORS[leave.leaveType]?.bg || '#6B7280', color: '#fff' }}>
                              📋 {LEAVE_COLORS[leave.leaveType]?.label || leave.leaveType} ({STATUS_LABEL[leave.status] || leave.status})
                            </div>
                          ) : dayAssignments.length > 0 ? (
                            dayAssignments.map(a => {
                              const st = shiftTypeMap.get(a.shiftTypeId)
                              if (!st) return null
                              return (
                                <div key={a.id} className="rounded-md px-2 py-1.5 text-[10px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                                  style={{ background: st.colorCode, color: '#fff' }} title={`${st.name} · ${emp.name}`}>
                                  {st.startTime} - {st.endTime}
                                </div>
                              )
                            })
                          ) : (
                            <button onClick={() => handleAssignShift(emp.id, dateStr)}
                              className="w-full flex items-center justify-center py-2 border border-dashed border-[var(--color-border)] rounded text-[var(--color-text-light)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </button>
                          )}
                        </div>
                      )
                    })}

                    <div className="w-[60px] shrink-0 px-2 py-2.5 border-l border-[var(--color-border)] flex items-center justify-center">
                      <span className={`text-xs font-bold ${hasHighHours ? 'text-[var(--color-error)]' : weeklyHours > 0 ? 'text-[var(--color-text-dark)]' : 'text-[var(--color-text-light)]'}`}>
                        {weeklyHours}h
                      </span>
                    </div>
                  </div>
                )
              })}

              {filteredEmployees.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-[var(--color-text-light)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <p className="text-sm text-[var(--color-text-medium)]">No employees match your filters</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          <Pagination currentPage={currentPage} totalItems={filteredEmployees.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
        </div>
      )}

      {/* Summary Footer */}
      <div className="card p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-medium)]">
          <div className="flex items-center gap-4">
            <span>{filteredEmployees.length} team members</span>
            <span>·</span>
            <span>{shiftAssignments.length} shifts</span>
            <span>·</span>
            <span>{leaveRequests.filter(lr => lr.status !== 'cancelled' && lr.status !== 'rejected').length} active leaves</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {shiftTypes.map(st => (
              <div key={st.id} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: st.colorCode }} />
                <span>{st.name.split('(')[0].trim()}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#8B5CF6]" />
              <span>Leave</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
