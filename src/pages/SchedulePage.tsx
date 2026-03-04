import { useState, useEffect, useMemo, useRef } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { useAuth } from '@/context/AuthContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Modal } from '@/components/common/Modal'
import { clsx } from 'clsx'
import type { ShiftAssignment, ShiftType, Employee, Location, Department, LeaveRequest } from '@/types'

type ViewMode = 'day' | 'week' | 'month'

export default function SchedulePage() {
  const { role } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShift, setSelectedShift] = useState<ShiftAssignment | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addShiftData, setAddShiftData] = useState({ employeeId: '', shiftTypeId: '', date: '', locationId: '' })
  const [selectedGroup, setSelectedGroup] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOpenShifts, setShowOpenShifts] = useState(true)
  const [showTimeOff, setShowTimeOff] = useState(true)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [assignRes, typesRes, empRes, locRes, deptRes, leaveRes] = await Promise.all([
          apiGateway.getShiftAssignments(),
          apiGateway.getShiftTypes(),
          apiGateway.getAllEmployees(),
          apiGateway.getLocations(),
          apiGateway.getDepartments(),
          apiGateway.getLeaveRequests(),
        ])
        if (assignRes.success) setAssignments(assignRes.data)
        if (typesRes.success) setShiftTypes(typesRes.data)
        if (empRes.success) setEmployees(empRes.data)
        if (locRes.success) setLocations(locRes.data)
        if (deptRes.success) setDepartments(deptRes.data)
        if (leaveRes.success) setLeaveRequests(leaveRes.data)
      } catch (error) {
        console.error('Failed to fetch schedule data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    
    // Refetch when page becomes visible (e.g., user navigates back from another tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }
    
    // Refetch when window gains focus (user switches tabs within app)
    const handleFocus = () => {
      fetchData()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const getDateRange = useMemo(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)
    if (viewMode === 'day') {
      // Single day
    } else if (viewMode === 'week') {
      const day = start.getDay()
      const diff = day === 0 ? 6 : day - 1 // Start from Monday
      start.setDate(start.getDate() - diff)
      end.setDate(start.getDate() + 6)
    } else {
      start.setDate(1)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
    }
    return { start, end }
  }, [currentDate, viewMode])

  const getDaysInRange = useMemo(() => {
    const days: Date[] = []
    const current = new Date(getDateRange.start)
    while (current <= getDateRange.end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }, [getDateRange])

  // Filter employees by group and search
  const filteredEmployees = useMemo(() => {
    let result = employees
    if (selectedGroup) {
      result = result.filter(e => e.departmentId === selectedGroup)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.employeeId.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) => {
      const roleOrder = { admin: 0, supervisor: 1, employee: 2 }
      return roleOrder[a.role] - roleOrder[b.role]
    })
  }, [employees, selectedGroup, searchQuery])

  const getShiftType = (id: string) => shiftTypes.find(s => s.id === id)
  const getEmployee = (id: string) => employees.find(e => e.id === id)
  const getLocation = (id: string) => locations.find(l => l.id === id)

  const getEmployeeShiftsForDay = (employeeId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return assignments.filter(a => a.employeeId === employeeId && a.date === dateStr)
  }

  const getEmployeeLeaveForDay = (employeeId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return leaveRequests.find(l => 
      l.employeeId === employeeId && 
      (l.status === 'approved' || l.status === 'pending') &&
      l.startDate <= dateStr && 
      l.endDate >= dateStr
    )
  }

  const leaveTypeColors: Record<string, { bg: string; text: string; label: string }> = {
    annual: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Annual' },
    sick: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', label: 'Sick' },
    personal: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Personal' },
    unpaid: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-400', label: 'Unpaid' },
  }

  const getEmployeeTotalHours = (employeeId: string) => {
    const empAssignments = assignments.filter(a => {
      const date = new Date(a.date)
      return a.employeeId === employeeId && date >= getDateRange.start && date <= getDateRange.end
    })
    return empAssignments.reduce((total, a) => {
      const shift = getShiftType(a.shiftTypeId)
      if (!shift) return total
      const start = parseInt(shift.startTime.split(':')[0])
      const end = parseInt(shift.endTime.split(':')[0])
      return total + (end > start ? end - start : 24 - start + end) - (shift.breakDuration / 60)
    }, 0)
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    else newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const handleAddShift = () => {
    if (!addShiftData.employeeId || !addShiftData.shiftTypeId || !addShiftData.date) return
    const newAssignment: ShiftAssignment = {
      id: `shift-${Date.now()}`,
      employeeId: addShiftData.employeeId,
      shiftTypeId: addShiftData.shiftTypeId,
      date: addShiftData.date,
      locationId: addShiftData.locationId || locations[0]?.id || '',
      status: 'scheduled',
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setAssignments(prev => [...prev, newAssignment])
    setShowAddModal(false)
    setAddShiftData({ employeeId: '', shiftTypeId: '', date: '', locationId: '' })
  }

  const exportToCSV = () => {
    const headers = ['Employee', 'Role', 'Date', 'Shift', 'Time', 'Location', 'Status', 'Hours']
    const rows = filteredEmployees.flatMap(emp => {
      return getDaysInRange.flatMap(day => {
        const shifts = getEmployeeShiftsForDay(emp.id, day)
        if (shifts.length === 0) return []
        return shifts.map(shift => {
          const shiftType = getShiftType(shift.shiftTypeId)
          const location = getLocation(shift.locationId)
          const hours = shiftType ? 
            (parseInt(shiftType.endTime.split(':')[0]) - parseInt(shiftType.startTime.split(':')[0])) - (shiftType.breakDuration / 60) : 0
          return [
            emp.name,
            emp.role.toUpperCase(),
            day.toLocaleDateString(),
            shiftType?.name || 'Unknown',
            `${shiftType?.startTime || ''} - ${shiftType?.endTime || ''}`,
            location?.name || 'Unknown',
            shift.status,
            hours.toFixed(1)
          ].join(',')
        })
      })
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schedule-${getDateRange.start.toISOString().split('T')[0]}-to-${getDateRange.end.toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString()

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>
  }


  return (
    <div className="space-y-4" ref={exportRef}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Schedule</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage team schedules and shifts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportToCSV} className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          {(role === 'admin' || role === 'supervisor') && (
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Publish Schedule
            </button>
          )}
        </div>
      </div>

      {/* Controls Bar - Professional Design */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Top Row: Date Navigation + View Mode + Filters */}
        <div className="p-4 flex flex-wrap items-center gap-4">
          {/* Date Navigation Group */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
              {getDateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {getDateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button onClick={() => navigateDate('next')} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all">
              Today
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} className={clsx(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize',
                viewMode === mode 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}>
                {mode}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1 hidden lg:block" />

          {/* Filter Controls */}
          <div className="flex items-center gap-3">
            {/* Department Dropdown */}
            <div className="relative">
              <select 
                value={selectedGroup} 
                onChange={e => setSelectedGroup(e.target.value)} 
                className="appearance-none h-9 pl-3 pr-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <option value="">All Groups</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Toggle Switches */}
            <div className="flex items-center gap-4 pl-2 border-l border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={showOpenShifts} 
                    onChange={e => setShowOpenShifts(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Open Shifts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={showTimeOff} 
                    onChange={e => setShowTimeOff(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Time Off</span>
              </label>
            </div>
          </div>
        </div>

        {/* Search Bar - Full Width Bottom */}
        <div className="px-4 pb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search employees by name, ID, or email..."
              className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Sticky Header Row */}
        <div className="sticky top-0 z-10 grid bg-slate-50 dark:bg-slate-900" style={{ gridTemplateColumns: '200px repeat(7, 1fr) 70px' }}>
          <div className="p-3 border-b border-r border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Team Members</span>
          </div>
          {getDaysInRange.slice(0, 7).map(day => (
            <div key={day.toISOString()} className={clsx(
              'p-3 text-center border-b border-r border-slate-200 dark:border-slate-700 last:border-r-0',
              isToday(day) && 'bg-indigo-50 dark:bg-indigo-900/20'
            )}>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <p className={clsx('text-lg font-bold', isToday(day) ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 w-8 h-8 rounded-full flex items-center justify-center mx-auto' : 'text-slate-900 dark:text-white')}>
                {day.getDate()}
              </p>
            </div>
          ))}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hours</span>
          </div>
        </div>

        {/* Scrollable Body - Takes remaining height */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {/* Open Shifts Row */}
          {showOpenShifts && (
            <div className="grid" style={{ gridTemplateColumns: '200px repeat(7, 1fr) 70px' }}>
              <div className="p-3 border-b border-r border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-white dark:bg-slate-800">
                <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">Open Shifts</span>
              </div>
              {getDaysInRange.slice(0, 7).map(day => (
                <div key={day.toISOString()} className={clsx(
                  'p-2 border-b border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[60px]',
                  isToday(day) && 'bg-indigo-50/30 dark:bg-indigo-900/5'
                )}>
                  {/* Open shifts would go here */}
                </div>
              ))}
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 text-center text-sm font-medium text-slate-400">-</div>
            </div>
          )}

          {/* Employee Rows */}
          {filteredEmployees.map(emp => {
            const totalHours = getEmployeeTotalHours(emp.id)
            return (
              <div key={emp.id} className="grid hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors" style={{ gridTemplateColumns: '200px repeat(7, 1fr) 70px' }}>
                <div className="p-3 border-b border-r border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-white dark:bg-slate-800 sticky left-0">
                  <div className={clsx(
                    'w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0',
                    emp.role === 'admin' ? 'bg-gradient-to-br from-violet-500 to-purple-600' :
                    emp.role === 'supervisor' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                    'bg-gradient-to-br from-emerald-500 to-teal-600'
                  )}>
                    {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{emp.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">{emp.role}</p>
                  </div>
                </div>
                {getDaysInRange.slice(0, 7).map(day => {
                  const shifts = getEmployeeShiftsForDay(emp.id, day)
                  const leave = showTimeOff ? getEmployeeLeaveForDay(emp.id, day) : null
                  const leaveStyle = leave ? leaveTypeColors[leave.leaveType] || leaveTypeColors.unpaid : null
                  return (
                    <div key={day.toISOString()} className={clsx(
                      'p-1.5 border-b border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[60px]',
                      isToday(day) && 'bg-indigo-50/50 dark:bg-indigo-900/10'
                    )}>
                      {/* Show leave if exists */}
                      {leave && (
                        <div className={clsx(
                          'w-full mb-1 px-2 py-1.5 rounded-lg text-xs font-medium truncate flex items-center gap-1',
                          leaveStyle?.bg, leaveStyle?.text
                        )}>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{leaveStyle?.label} {leave.status === 'pending' && '(Pending)'}</span>
                        </div>
                      )}
                      {/* Show shifts if no leave */}
                      {!leave && shifts.map(shift => {
                        const shiftType = getShiftType(shift.shiftTypeId)
                        return (
                          <button
                            key={shift.id}
                            onClick={() => setSelectedShift(shift)}
                            className="w-full mb-1 px-2 py-1.5 rounded-lg text-xs font-medium text-white truncate transition-all hover:scale-[1.02] hover:shadow-md"
                            style={{ backgroundColor: shiftType?.colorCode || '#6366f1' }}
                          >
                            {shiftType?.startTime} - {shiftType?.endTime}
                          </button>
                        )
                      })}
                      {(role === 'admin' || role === 'supervisor') && !leave && shifts.length === 0 && (
                        <button
                          onClick={() => {
                            setAddShiftData({ employeeId: emp.id, shiftTypeId: '', date: day.toISOString().split('T')[0], locationId: '' })
                            setShowAddModal(true)
                          }}
                          className="w-full h-full min-h-[40px] border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                })}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 text-center flex items-center justify-center">
                  <span className={clsx('text-sm font-semibold', totalHours > 40 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300')}>
                    {totalHours.toFixed(1)}h
                  </span>
                </div>
              </div>
            )
          })}

          {filteredEmployees.length === 0 && (
            <div className="p-12 text-center">
              <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400">No employees found matching your criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Shift Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Shift">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee</label>
            <select
              value={addShiftData.employeeId}
              onChange={e => setAddShiftData(prev => ({ ...prev, employeeId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="">Select employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shift Type</label>
            <select
              value={addShiftData.shiftTypeId}
              onChange={e => setAddShiftData(prev => ({ ...prev, shiftTypeId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="">Select shift type</option>
              {shiftTypes.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime} - {s.endTime})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={addShiftData.date}
              onChange={e => setAddShiftData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
            <select
              value={addShiftData.locationId}
              onChange={e => setAddShiftData(prev => ({ ...prev, locationId: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="">Select location</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleAddShift} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all">
              Add Shift
            </button>
          </div>
        </div>
      </Modal>

      {/* Shift Detail Modal */}
      <Modal isOpen={!!selectedShift} onClose={() => setSelectedShift(null)} title="Shift Details">
        {selectedShift && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Employee</p>
                <p className="font-semibold text-slate-900 dark:text-white">{getEmployee(selectedShift.employeeId)?.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Date</p>
                <p className="font-semibold text-slate-900 dark:text-white">{new Date(selectedShift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Shift Type</p>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getShiftType(selectedShift.shiftTypeId)?.colorCode }} />
                  <p className="font-semibold text-slate-900 dark:text-white">{getShiftType(selectedShift.shiftTypeId)?.name}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Time</p>
                <p className="font-semibold text-slate-900 dark:text-white">{getShiftType(selectedShift.shiftTypeId)?.startTime} - {getShiftType(selectedShift.shiftTypeId)?.endTime}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Location</p>
                <p className="font-semibold text-slate-900 dark:text-white">{getLocation(selectedShift.locationId)?.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Status</p>
                <span className={clsx(
                  'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                  selectedShift.status === 'completed' && 'bg-emerald-100 text-emerald-700',
                  selectedShift.status === 'confirmed' && 'bg-blue-100 text-blue-700',
                  selectedShift.status === 'scheduled' && 'bg-amber-100 text-amber-700',
                  selectedShift.status === 'cancelled' && 'bg-rose-100 text-rose-700'
                )}>
                  {selectedShift.status}
                </span>
              </div>
            </div>
            {(role === 'admin' || role === 'supervisor') && (
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  Edit
                </button>
                <button className="px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-xl hover:bg-rose-600 transition-colors">
                  Cancel Shift
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
