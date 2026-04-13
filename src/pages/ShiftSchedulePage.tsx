import { useState, useEffect, useMemo, useCallback, lazy, Suspense, Component, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/context/LanguageContext'
import { apiGateway } from '@/services/apiGateway'
import { rotationService } from '@/services/rotationService'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Pagination } from '@/components/common/Pagination'
import type { Employee, ShiftAssignment, ShiftType, LeaveRequest, Personnel, PoliceRank, Platoon, PlatoonRotation, PlatoonId, RotationalDutyType, AdhocRequest, DriverRecord } from '@/types'

const DutyDetailPage = lazy(() => import('@/pages/DutyDetailPage'))

type ViewRange = 'day' | 'week' | 'month'
type SubTab = 'adhoc' | 'assign'

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

const RANKS = ['DCP', 'ACP', 'RPI', 'RSI', 'ARSI', 'AHC', 'APC']

interface ChartData {
  sectionId: number; sectionName: string
  dutyGroups: { slNo: number; dutyName: string; totalPersonnel: number; rankCounts: Record<string, number>
    subRows: { subDetail: string | null; personnel: { id: number; name: string; designation: string; badgeNumber: string | null }[]; rankCounts: Record<string, number> }[]
  }[]
  rankTotals: Record<string, number>
}

function SectionChartView({ sectionId }: { sectionId: number }) {
  const [chart, setChart] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  useEffect(() => {
    setExpandedRow(null)
    setLoading(true)
    ;(async () => {
      try {
        const token = localStorage.getItem('workboard_access_token')
        const res = await fetch(`http://localhost:8080/api/sections/${sectionId}/chart`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const result = await res.json()
        if (result.success) setChart(result.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    })()
  }, [sectionId])

  if (loading) return <div className="flex items-center justify-center h-32"><LoadingSpinner /></div>
  if (!chart || chart.dutyGroups.length === 0) return <div className="card p-8 text-center text-sm text-[var(--color-text-light)]">No chart data available</div>

  const totalPersonnel = chart.dutyGroups.reduce((s, g) => s + g.totalPersonnel, 0)

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-card))' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-[var(--color-text-dark)]">{chart.sectionName}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold">{totalPersonnel} personnel</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)]">
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--color-text-light)] w-8">#</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--color-text-light)]">DUTY</th>
              {RANKS.map(r => <th key={r} className="px-2 py-2.5 text-center font-semibold text-[var(--color-text-light)] w-12">{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {chart.dutyGroups.map(group => {
              const isExpanded = expandedRow === group.slNo
              const personnelList = group.subRows.flatMap(sr => sr.personnel)
              return (
                <>
                  <tr key={group.slNo}
                    onClick={() => setExpandedRow(isExpanded ? null : group.slNo)}
                    className={`border-t border-[var(--color-border)] cursor-pointer transition-colors ${isExpanded ? 'bg-[var(--color-primary)]/5' : 'hover:bg-[var(--color-bg-main)]/50'}`}>
                    <td className="px-3 py-2.5 text-[var(--color-text-light)] align-top">{group.slNo}</td>
                    <td className="px-3 py-2.5 align-top">
                      <div className="flex items-center gap-1.5">
                        <svg className={`w-3.5 h-3.5 text-[var(--color-text-light)] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        <span className="font-semibold text-[var(--color-text-dark)]">{group.dutyName}</span>
                        <span className="text-[10px] text-[var(--color-text-light)] ml-1">({group.totalPersonnel})</span>
                      </div>
                      {group.subRows.some(sr => sr.subDetail) && !isExpanded && (
                        <p className="ml-5 mt-0.5 text-[10px] text-[var(--color-text-light)]">
                          {group.subRows.filter(sr => sr.subDetail).map(sr => sr.subDetail).join(' · ')}
                        </p>
                      )}
                    </td>
                    {RANKS.map(r => (
                      <td key={r} className="px-2 py-2.5 text-center align-top">
                        <span className={`${(group.rankCounts[r] || 0) > 0 ? 'font-semibold text-[var(--color-text-dark)]' : 'text-[var(--color-text-light)]'}`}>
                          {group.rankCounts[r] || 0}
                        </span>
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr key={`${group.slNo}-detail`}>
                      <td colSpan={2 + RANKS.length} className="p-0">
                        <div className="mx-8 my-3 rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg-card)]">
                          {group.subRows.map((sr, si) => (
                            <div key={si}>
                              {sr.subDetail && (
                                <div className="px-4 py-1.5 text-[10px] font-semibold text-[var(--color-text-medium)] uppercase tracking-wider bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
                                  {sr.subDetail}
                                </div>
                              )}
                              {sr.personnel.map((p, pi) => (
                                <div key={p.id} className={`flex items-center px-4 py-1.5 text-[11px] ${pi > 0 || sr.subDetail ? 'border-t border-[var(--color-border)]/40' : ''} hover:bg-[var(--color-bg-main)]/50`}>
                                  <span className="flex-1 font-medium text-[var(--color-text-dark)]">{p.name}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    p.designation === 'DCP' || p.designation === 'ACP' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                    p.designation === 'RPI' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                    p.designation === 'RSI' || p.designation === 'PROB RSI' ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400' :
                                    p.designation === 'ARSI' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                    p.designation === 'AHC' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  }`}>{p.designation}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <td className="px-3 py-2.5 font-bold text-[var(--color-text-dark)]" colSpan={2}>TOTAL</td>
              {RANKS.map(r => (
                <td key={r} className="px-2 py-2.5 text-center font-bold text-[var(--color-text-dark)]">{chart.rankTotals[r] || 0}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

class ErrorBoundaryWrapper extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error) { console.error('[DriversTab] Error:', error) }
  render() {
    if (this.state.hasError) {
      return <div className="card p-8 text-center text-sm text-red-500">Error loading Drivers tab: {this.state.error?.message}</div>
    }
    return this.props.children
  }
}

function DriversTabView() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await apiGateway.getDrivers()
        if (res.success && Array.isArray(res.data)) setDrivers(res.data)
        else if (res.success) setDrivers([])
        else setError(res.error || 'Failed to fetch drivers')
      } catch (e) { setError('Failed to fetch drivers') }
      finally { setLoading(false) }
    })()
  }, [])

  const filtered = useMemo(() => {
    if (!search) return drivers
    const q = search.toLowerCase()
    return drivers.filter(d =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.designationDisplay || '').toLowerCase().includes(q) ||
      (d.duty || '').toLowerCase().includes(q) ||
      (d.vehicleNo || '').toLowerCase().includes(q)
    )
  }, [drivers, search])

  if (loading) return <div className="flex items-center justify-center h-32"><LoadingSpinner /></div>
  if (error) return <div className="card p-8 text-center text-sm text-red-500">{error}</div>

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between gap-3" style={{ background: 'linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-card))' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-[var(--color-text-dark)]">CAR MT Section Drivers</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold">
            {search ? `${filtered.length} / ${drivers.length}` : `${drivers.length}`} personnel
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)]">
          <svg className="w-3.5 h-3.5 text-[var(--color-text-light)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-xs text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] w-40" />
          {search && (
            <button onClick={() => setSearch('')} className="text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--color-bg-secondary)]">
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--color-text-light)] w-10">#</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--color-text-light)]">Name</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--color-text-light)]">Designation</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--color-text-light)]">Duty</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--color-text-light)]">Vehicle No</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--color-text-light)]">PDMS</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--color-text-light)]">License</th>
              <th className="px-3 py-2.5 text-left font-semibold text-[var(--color-text-light)]">Deployed From</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[var(--color-text-light)]">No drivers found</td></tr>
            ) : filtered.map((d, idx) => (
              <tr key={d.slNo} className={`border-t border-[var(--color-border)] hover:bg-[var(--color-bg-main)]/50 transition-colors ${idx % 2 === 1 ? 'bg-[var(--color-bg-secondary)]/30' : ''}`}>
                <td className="px-3 py-2 text-[var(--color-text-light)]">{d.slNo}</td>
                <td className="px-3 py-2 font-medium text-[var(--color-text-dark)]">{d.name}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    (d.designationDisplay || '').startsWith('ARSI') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                    (d.designationDisplay || '').startsWith('AHC') ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>{d.designationDisplay || '-'}</span>
                </td>
                <td className="px-3 py-2 text-[var(--color-text-dark)]">{d.duty}</td>
                <td className="px-3 py-2 text-[var(--color-text-dark)]">{d.vehicleNo}</td>
                <td className="px-3 py-2 text-[var(--color-text-medium)]">{d.pdmsStatus || '—'}</td>
                <td className="px-3 py-2 text-[var(--color-text-medium)]">{d.licenseType || '—'}</td>
                <td className="px-3 py-2 text-[var(--color-text-medium)]">{d.deployedFrom || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ShiftSchedulePage() {
  const navigate = useNavigate()
  const { t } = useLanguage()
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
  const [showOpenShifts] = useState(true)
  const [showTimeOff] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expandedMonthDay, setExpandedMonthDay] = useState<string | null>(null)
  const [subTab, setSubTab] = useState<SubTab>('adhoc')
  const [adhocRequests, setAdhocRequests] = useState<AdhocRequest[]>([])
  const [adhocPage, setAdhocPage] = useState(1)
  const [adhocPageSize, setAdhocPageSize] = useState(5)
  const [adhocFilter, setAdhocFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'completed'>('all')
  const [sectionTab, setSectionTab] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [selectedPlatoon, setSelectedPlatoon] = useState<PlatoonId>('P1')

  const today = useMemo(() => new Date(), [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, typesRes, leaveRes, personnelRes, platoonsRes, rotationsRes, adhocRes] = await Promise.all([
          apiGateway.getEmployees(1, 200),
          apiGateway.getShiftTypes(),
          apiGateway.getLeaveRequests(),
          apiGateway.getAllPersonnel(),
          apiGateway.getPlatoons(),
          apiGateway.getPlatoonRotations(),
          apiGateway.getAdhocRequests(),
        ])
        if (empRes.data) setEmployees(empRes.data)
        if (typesRes.success) setShiftTypes(typesRes.data)
        if (leaveRes.success) setLeaveRequests(leaveRes.data)
        if (personnelRes.success) setPersonnelList(personnelRes.data)
        if (platoonsRes.success) setPlatoons(platoonsRes.data)
        if (rotationsRes.success) setStoredRotations(rotationsRes.data)
        if (adhocRes.success) setAdhocRequests(adhocRes.data)
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
  const currentCycleNum = useMemo(() => {
    const num = rotationService.getCycleNumber(new Date())
    return Math.min(num, MAX_CYCLE)
  }, [])
  const [cycleNumber, setCycleNumber] = useState<number>(0)
  // Initialize cycle number after computation
  useEffect(() => { setCycleNumber(currentCycleNum) }, [currentCycleNum])
  const cycleDateRange = useMemo(() => rotationService.getCycleDateRange(cycleNumber), [cycleNumber])
  const isCurrentCycle = cycleNumber === currentCycleNum

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

  const filteredAdhoc = adhocFilter === 'all' ? adhocRequests : adhocRequests.filter(r => r.status === adhocFilter)
  const pendingAdhocCount = adhocRequests.filter(r => r.status === 'pending').length
  const pagedAdhoc = filteredAdhoc.slice((adhocPage - 1) * adhocPageSize, adhocPage * adhocPageSize)

  return (
    <div className="space-y-4">
      {/* Section Tabs + Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-0.5">
          {([
            { key: 'A' as const, label: 'Section A', desc: 'Officers & Staff' },
            { key: 'B' as const, label: 'Section B', desc: 'Writers & Support' },
            { key: 'C' as const, label: 'Section C', desc: 'Platoon Rotation' },
            { key: 'D' as const, label: 'Drivers', desc: 'CAR MT Section' },
          ]).map(sec => (
            <button key={sec.key} onClick={() => setSectionTab(sec.key)}
              className={`relative px-5 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                sectionTab === sec.key
                  ? 'text-[var(--color-primary)] border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'text-[var(--color-text-light)] border-transparent hover:text-[var(--color-text-dark)] hover:bg-[var(--color-bg-secondary)]'
              }`}>
              <span className="block">{sec.label}</span>
              <span className={`block text-[9px] font-normal mt-0.5 ${sectionTab === sec.key ? 'text-[var(--color-primary)]/70' : 'text-[var(--color-text-light)]'}`}>{sec.desc}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="btn btn-secondary text-xs gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {t('refresh')}
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
            {t('export')}
          </button>
          <button disabled className="btn btn-primary text-xs gap-1.5 opacity-50 cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            {t('new_assignment')}
          </button>
        </div>
      </div>

      {/* Section A */}
      {sectionTab === 'A' && <SectionChartView sectionId={1} />}

      {/* Section B */}
      {sectionTab === 'B' && <SectionChartView sectionId={2} />}

      {/* Drivers — CAR MT Section */}
      {sectionTab === 'D' && (
        <ErrorBoundaryWrapper>
          <DriversTabView />
        </ErrorBoundaryWrapper>
      )}

      {/* Section C — Platoon Rotation */}
      {sectionTab === 'C' && (<>

      {/* ===== ROTATION CYCLE ===== */}
      <div className="card overflow-hidden">
        {/* Cycle Navigation — clean centered design */}
        <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-card))' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setCycleNumber(c => Math.max(1, c - 1))} disabled={cycleNumber <= 1}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] disabled:opacity-25 disabled:cursor-not-allowed text-[var(--color-text-dark)] transition-all hover:shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className={`px-4 py-1.5 rounded-lg text-sm font-bold ${isCurrentCycle ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'bg-[var(--color-bg-card)] text-[var(--color-text-dark)] border border-[var(--color-border)]'}`}>
                Cycle {cycleNumber}
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--color-text-dark)]">
                  {new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                {isCurrentCycle && <p className="text-[10px] text-[var(--color-success)] font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />Active Rotation</p>}
                {!isCurrentCycle && <p className="text-[10px] text-[var(--color-text-light)]">{cycleNumber < currentCycleNum ? 'Past Rotation' : 'Upcoming Rotation'}</p>}
              </div>
            </div>
            <button onClick={() => setCycleNumber(c => c + 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-dark)] transition-all hover:shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          {!isCurrentCycle && (
            <button onClick={() => setCycleNumber(currentCycleNum)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/8 hover:bg-[var(--color-primary)]/15 px-3.5 py-2 rounded-lg transition-all border border-[var(--color-primary)]/15">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Current Cycle
            </button>
          )}
        </div>

        {/* Platoon Cards */}
        {currentCycleAssignments ? (
          <div className="grid grid-cols-1 sm:grid-cols-5">
            {PLATOON_IDS.map((pid, idx) => {
              const duty = currentCycleAssignments.get(pid)
              const meta = duty ? DUTY_META[duty] : null
              const platoon = platoons.find(p => p.id === pid)
              const isSelected = selectedPlatoon === pid
              return (
                <div
                  key={pid}
                  onClick={() => setSelectedPlatoon(pid)}
                  className={`flex sm:flex-col items-center sm:items-stretch gap-2 sm:gap-0 px-3 py-3 cursor-pointer transition-all duration-200 group relative ${idx < 4 ? 'sm:border-r border-[var(--color-border)]' : ''} ${isSelected ? '' : 'hover:bg-[var(--color-bg-secondary)]/30'}`}
                  style={isSelected ? { background: `linear-gradient(180deg, ${meta?.color || 'var(--color-primary)'}08 0%, ${meta?.color || 'var(--color-primary)'}03 100%)` } : {}}
                >
                  {/* Selected indicator — top accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] transition-all duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`} style={{ background: meta?.color || 'var(--color-primary)' }} />
                  {/* Duty bar with platoon label */}
                  {meta ? (
                    <div className={`flex-1 sm:flex-none rounded-lg px-2.5 py-2 sm:py-2.5 relative overflow-hidden transition-all duration-200 w-full ${isSelected ? 'shadow-md' : 'group-hover:shadow-sm'}`}
                      style={{ background: `${meta.color}${isSelected ? '18' : '0a'}`, borderLeft: `3px solid ${meta.color}` }}>
                      <div className="relative z-10 flex items-center gap-2">
                        <span className="text-base">{meta.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-tight" style={{ color: meta.color }}>Platoon {pid.replace('P', '')}</p>
                          <p className="text-[9px] text-[var(--color-text-light)] leading-tight">{meta.label}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 sm:flex-none rounded-lg border border-dashed border-[var(--color-border)] px-3 py-3 flex items-center justify-center gap-1.5 text-[var(--color-text-light)] w-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      <span className="text-[10px] font-medium">{t('not_assigned')}</span>
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
            <p className="text-xs text-[var(--color-text-medium)]">{t('cycle')} {cycleNumber} {t('is_not_assigned_yet')}</p>
            <button onClick={() => navigate(`/schedule/new?cycle=${cycleNumber}`)} className="btn btn-primary text-xs">
              {t('assign_cycle')} {cycleNumber}
            </button>
          </div>
        )}
      </div>

      {/* Inline Duty Detail for selected platoon */}
      {currentCycleAssignments && (
        <Suspense fallback={<div className="flex items-center justify-center h-32"><LoadingSpinner /></div>}>
          <DutyDetailPage key={selectedPlatoon} embedded platoonOverride={selectedPlatoon} />
        </Suspense>
      )}

      {/* View switcher — hidden for now */}
      {false && <div className="flex items-center gap-3">
        <div className="flex bg-[var(--color-bg-secondary)] rounded-xl p-1 gap-0.5">
          <button onClick={() => setSubTab('adhoc')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${subTab === 'adhoc' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-dark)] shadow-sm' : 'text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]'}`}>
            {t('adhoc_requests')} {pendingAdhocCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[var(--color-error)] text-white">{pendingAdhocCount}</span>}
          </button>
          <button onClick={() => setSubTab('assign')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${subTab === 'assign' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-dark)] shadow-sm' : 'text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]'}`}>
            {t('assign_shift')}
          </button>
        </div>
      </div>}

      {/* ═══ ADHOC REQUESTS TAB ═══ */}
      {false && subTab === 'adhoc' && (() => {
        const counts = { all: adhocRequests.length, pending: adhocRequests.filter(r => r.status === 'pending').length, accepted: adhocRequests.filter(r => r.status === 'accepted').length, declined: adhocRequests.filter(r => r.status === 'declined').length, completed: adhocRequests.filter(r => r.status === 'completed').length }
        return (
        <div className="space-y-4">
          {/* Filter tabs + search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--color-bg-secondary)] rounded-xl p-1.5">
            <div className="flex items-center gap-0.5">
              {(['all', 'pending', 'accepted', 'declined', 'completed'] as const).map(f => (
                <button key={f} onClick={() => { setAdhocFilter(f); setAdhocPage(1) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${adhocFilter === f ? 'bg-[var(--color-bg-card)] text-[var(--color-text-dark)] shadow-sm' : 'text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]'}`}>
                  {t(f === 'all' ? 'all' : f)} ({counts[f]})
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-card)] text-sm">
                <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder={t('search_placeholder')} className="bg-transparent outline-none text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] w-28" />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-medium)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                {t('export')}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-[var(--color-bg-secondary)]">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">{t('personnel_label')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">{t('duty_type')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">{t('date')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">{t('location')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">{t('reason')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">{t('status')}</th>
                  <th className="text-center px-4 py-3 text-[10px] font-semibold text-[var(--color-text-medium)] uppercase tracking-wider">{t('actions')}</th>
                </tr></thead>
                <tbody>
                  {pagedAdhoc.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--color-text-light)]">{t('no_adhoc_requests')}</td></tr>
                  ) : pagedAdhoc.map((req, idx) => (
                    <tr key={req.id} className={`transition-colors hover:bg-[rgba(0,0,128,0.02)] ${idx % 2 === 1 ? 'bg-[var(--color-bg-secondary)]' : ''}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: `hsl(${req.assignedTo.charCodeAt(0) * 37 % 360}, 45%, 50%)` }}>
                            {req.assignedTo.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--color-text-dark)]">{req.assignedTo}</p>
                            <p className="text-[10px] text-[var(--color-text-light)]">{new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(0,0,128,0.06)', color: 'var(--color-primary)' }}>{req.shiftTypeId}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[var(--color-text-dark)]">{new Date(req.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3.5 text-sm text-[var(--color-text-dark)]">{req.locationId}</td>
                      <td className="px-4 py-3.5 text-xs text-[var(--color-text-medium)] max-w-[220px] truncate">{req.reason}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${req.status === 'pending' ? 'text-amber-600' : req.status === 'accepted' ? 'text-green-600' : req.status === 'declined' ? 'text-red-600' : 'text-gray-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-amber-500' : req.status === 'accepted' ? 'bg-green-500' : req.status === 'declined' ? 'bg-red-500' : 'bg-gray-400'}`} />
                          <span className="capitalize">{req.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              {t('accept')}
                            </button>
                            <button className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              {t('decline')}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--color-text-light)]">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredAdhoc.length > adhocPageSize && (
              <div className="px-4 py-3 bg-[var(--color-bg-secondary)]">
                <Pagination currentPage={adhocPage} totalItems={filteredAdhoc.length} pageSize={adhocPageSize} onPageChange={setAdhocPage} onPageSizeChange={(s) => { setAdhocPageSize(s); setAdhocPage(1) }} />
              </div>
            )}
          </div>
        </div>
        )
      })()}

      {/* ═══ ASSIGN SHIFT TAB ═══ */}
      {false && subTab === 'assign' && (<>
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
              {t('today')}
            </button>
            <div className="flex bg-[var(--color-bg-tertiary)] rounded-lg p-0.5 ml-2">
              {(['day', 'week', 'month'] as ViewRange[]).map(mode => (
                <button key={mode} onClick={() => setViewRange(mode)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${viewRange === mode ? 'bg-[var(--color-bg-primary)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-medium)] hover:text-[var(--color-text-dark)]'}`}>
                  {t(mode)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-dark)] outline-none">
              <option value="all">{t('all_ranks')}</option>
              {RANK_HIERARCHY.map(r => <option key={r.rank} value={r.rank}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-2">
        <svg className="w-4 h-4 text-[var(--color-text-light)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" placeholder={t('search_employees')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
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
                          {t('view_day')} →
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
                  {t('team_members')}
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
                  <p className="text-[10px] font-semibold text-[var(--color-text-light)] uppercase tracking-wider">{t('hours')}</p>
                </div>
              </div>

              {/* Open Shifts Row */}
              {showOpenShifts && (
                <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30">
                  <div className="w-[180px] shrink-0 px-4 py-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-text-dark)]">{t('open_shifts')}</span>
                  </div>
                  {viewColumns.map((day, idx) => {
                    const isToday = isSameDay(day, today)
                    const openCount = openShiftsByDay.get(formatDate(day)) || 0
                    return (
                      <div key={idx} className={`min-w-[100px] flex-1 px-1 py-3 border-l border-[var(--color-border)] flex items-center justify-center ${isToday ? 'bg-[var(--color-primary)]/5' : ''}`}>
                        {openCount > 0 && (
                          <span className="text-[10px] text-[var(--color-text-light)] bg-[var(--color-bg-main)] border border-dashed border-[var(--color-border)] rounded px-2 py-1">
                            {openCount} {t('open')}
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
                    <p className="text-sm text-[var(--color-text-medium)]">{t('no_employees_match')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          <Pagination currentPage={currentPage} totalItems={filteredEmployees.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
        </div>
      )}

      </>)}

      </>)}

      {/* Summary Footer — hidden for now */}
      {false && <div className="card p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-medium)]">
          <div className="flex items-center gap-4">
            <span>{filteredEmployees.length} {t('team_members_count')}</span>
            <span>·</span>
            <span>{shiftAssignments.length} {t('shifts')}</span>
            <span>·</span>
            <span>{leaveRequests.filter(lr => lr.status !== 'cancelled' && lr.status !== 'rejected').length} {t('active_leaves')}</span>
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
              <span>{t('leave_legend')}</span>
            </div>
          </div>
        </div>
      </div>}
    </div>
  )
}
