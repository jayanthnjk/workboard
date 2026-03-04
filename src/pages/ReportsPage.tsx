import { useState, useEffect, useMemo } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { LoadingSpinner } from '@/components/common'
import { clsx } from 'clsx'
import type { ShiftAssignment, Employee, Department, LeaveRequest, ShiftType } from '@/types'

type ReportType = 'overview' | 'attendance' | 'leave' | 'department'

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('overview')
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    setDateRange({
      from: firstDay.toISOString().split('T')[0],
      to: lastDay.toISOString().split('T')[0]
    })
  }, [])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [assignRes, empRes, deptRes, leaveRes, shiftRes] = await Promise.all([
      apiGateway.getShiftAssignments(),
      apiGateway.getAllEmployees(),
      apiGateway.getDepartments(),
      apiGateway.getLeaveRequests(),
      apiGateway.getShiftTypes(),
    ])
    if (assignRes.success) setAssignments(assignRes.data)
    if (empRes.success) setEmployees(empRes.data)
    if (deptRes.success) setDepartments(deptRes.data)
    if (leaveRes.success) setLeaveRequests(leaveRes.data)
    if (shiftRes.success) setShiftTypes(shiftRes.data)
    setLoading(false)
  }

  // Analytics calculations
  const analytics = useMemo(() => {
    const filteredAssignments = assignments.filter(a => 
      (!dateRange.from || a.date >= dateRange.from) && 
      (!dateRange.to || a.date <= dateRange.to)
    )
    
    const totalShifts = filteredAssignments.length
    const completedShifts = filteredAssignments.filter(a => a.status === 'completed').length
    const scheduledShifts = filteredAssignments.filter(a => a.status === 'scheduled').length
    const cancelledShifts = filteredAssignments.filter(a => a.status === 'cancelled').length
    
    // Hours calculation
    const totalHours = filteredAssignments.reduce((sum, a) => {
      const shift = shiftTypes.find(s => s.id === a.shiftTypeId)
      if (!shift) return sum
      const start = parseInt(shift.startTime.split(':')[0])
      const end = parseInt(shift.endTime.split(':')[0])
      return sum + (end > start ? end - start : 24 - start + end) - (shift.breakDuration / 60)
    }, 0)
    
    // By department
    const byDepartment = departments.map(dept => {
      const deptEmployees = employees.filter(e => e.departmentId === dept.id)
      const deptAssignments = filteredAssignments.filter(a => 
        deptEmployees.some(e => e.id === a.employeeId)
      )
      return { name: dept.name, count: deptAssignments.length, employees: deptEmployees.length }
    })
    
    // By shift type
    const byShiftType = shiftTypes.map(st => ({
      name: st.name,
      color: st.colorCode,
      count: filteredAssignments.filter(a => a.shiftTypeId === st.id).length
    }))
    
    // Leave stats
    const leaveStats = {
      total: leaveRequests.length,
      pending: leaveRequests.filter(l => l.status === 'pending').length,
      approved: leaveRequests.filter(l => l.status === 'approved').length,
      rejected: leaveRequests.filter(l => l.status === 'rejected').length,
      byType: {
        annual: leaveRequests.filter(l => l.leaveType === 'annual').length,
        sick: leaveRequests.filter(l => l.leaveType === 'sick').length,
        personal: leaveRequests.filter(l => l.leaveType === 'personal').length,
        unpaid: leaveRequests.filter(l => l.leaveType === 'unpaid').length,
      }
    }
    
    // Weekly distribution
    const weeklyData = Array(7).fill(0).map((_, i) => {
      const dayAssignments = filteredAssignments.filter(a => new Date(a.date).getDay() === i)
      return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], count: dayAssignments.length }
    })
    
    return { totalShifts, completedShifts, scheduledShifts, cancelledShifts, totalHours, byDepartment, byShiftType, leaveStats, weeklyData }
  }, [assignments, employees, departments, leaveRequests, shiftTypes, dateRange])

  const maxWeeklyCount = Math.max(...analytics.weeklyData.map(d => d.count), 1)
  const maxDeptCount = Math.max(...analytics.byDepartment.map(d => d.count), 1)

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Insights and performance metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={dateRange.from} onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
          <span className="text-slate-400">to</span>
          <input type="date" value={dateRange.to} onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1.5">
        {[
          { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
          { id: 'attendance', label: 'Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { id: 'leave', label: 'Leave Analysis', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { id: 'department', label: 'By Department', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveReport(tab.id as ReportType)} className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
            activeReport === tab.id ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          )}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Report */}
      {activeReport === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">+12%</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.totalShifts}</p>
              <p className="text-sm text-slate-500">Total Shifts</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">{analytics.totalShifts > 0 ? Math.round((analytics.completedShifts / analytics.totalShifts) * 100) : 0}%</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.completedShifts}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.scheduledShifts}</p>
              <p className="text-sm text-slate-500">Scheduled</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{analytics.totalHours.toFixed(0)}h</p>
              <p className="text-sm text-slate-500">Total Hours</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Distribution Bar Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Weekly Shift Distribution</h3>
              <div className="flex items-end justify-between gap-3 h-52">
                {analytics.weeklyData.map((d, i) => {
                  const heightPercent = maxWeeklyCount > 0 ? (d.count / maxWeeklyCount) * 100 : 0
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">{d.count}</span>
                      <div className="w-full h-40 bg-slate-100 dark:bg-slate-700 rounded-lg relative overflow-hidden">
                        <div 
                          className={clsx(
                            'absolute bottom-0 w-full rounded-lg transition-all duration-500',
                            i === new Date().getDay() 
                              ? 'bg-gradient-to-t from-indigo-600 to-violet-500' 
                              : 'bg-gradient-to-t from-indigo-400 to-indigo-300 dark:from-indigo-500 dark:to-indigo-400'
                          )}
                          style={{ height: `${Math.max(heightPercent, 5)}%` }}
                        />
                      </div>
                      <span className={clsx(
                        'text-xs font-medium mt-2',
                        i === new Date().getDay() ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'
                      )}>{d.day}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Shift Type Donut Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Shifts by Type</h3>
              <div className="flex items-center justify-center gap-12">
                <div className="relative w-44 h-44 flex-shrink-0">
                  <svg className="w-44 h-44" viewBox="0 0 100 100">
                    {(() => {
                      const total = analytics.byShiftType.reduce((s, t) => s + t.count, 0) || 1
                      const circumference = 2 * Math.PI * 40
                      let offset = 0
                      
                      if (analytics.byShiftType.every(st => st.count === 0)) {
                        return <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                      }
                      
                      return analytics.byShiftType.filter(st => st.count > 0).map(st => {
                        const percentage = (st.count / total) * 100
                        const dashArray = `${(percentage / 100) * circumference} ${circumference}`
                        const dashOffset = -(offset / 100) * circumference
                        offset += percentage
                        return (
                          <circle 
                            key={st.name} 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            fill="none" 
                            stroke={st.color} 
                            strokeWidth="12" 
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            transform="rotate(-90 50 50)"
                          />
                        )
                      })
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-slate-500">Total</p>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{analytics.totalShifts}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {analytics.byShiftType.map(st => (
                    <div key={st.name} className="flex items-center gap-3 min-w-[140px]">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }} />
                      <span className="flex-1 text-sm text-slate-600 dark:text-slate-400">{st.name}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{st.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Attendance Report */}
      {activeReport === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Shift Completion Rate</h3>
            <div className="space-y-4">
              {[
                { label: 'Completed', value: analytics.completedShifts, color: 'bg-emerald-500', total: analytics.totalShifts },
                { label: 'Scheduled', value: analytics.scheduledShifts, color: 'bg-amber-500', total: analytics.totalShifts },
                { label: 'Cancelled', value: analytics.cancelledShifts, color: 'bg-rose-500', total: analytics.totalShifts },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.value} ({item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%)</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full transition-all', item.color)} style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">Active Employees</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{employees.filter(e => e.status === 'active').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">Avg Hours/Employee</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{employees.length > 0 ? (analytics.totalHours / employees.length).toFixed(1) : 0}h</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</span>
                <span className="text-lg font-bold text-emerald-600">{analytics.totalShifts > 0 ? Math.round((analytics.completedShifts / analytics.totalShifts) * 100) : 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Analysis Report */}
      {activeReport === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Leave Requests by Status</h3>
            {(() => {
              const statusData = [
                { label: 'Pending', value: analytics.leaveStats.pending, color: 'from-amber-500 to-amber-400' },
                { label: 'Approved', value: analytics.leaveStats.approved, color: 'from-emerald-500 to-emerald-400' },
                { label: 'Rejected', value: analytics.leaveStats.rejected, color: 'from-rose-500 to-rose-400' },
              ]
              const maxStatusValue = Math.max(...statusData.map(d => d.value), 1)
              return (
                <div className="flex items-end justify-between gap-4 h-52">
                  {statusData.map(d => {
                    const heightPercent = (d.value / maxStatusValue) * 100
                    return (
                      <div key={d.label} className="flex-1 flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{d.value}</span>
                        <div className="w-full h-40 bg-slate-100 dark:bg-slate-700 rounded-lg relative overflow-hidden">
                          <div 
                            className={clsx('absolute bottom-0 w-full rounded-lg bg-gradient-to-t', d.color)}
                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 mt-2">{d.label}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Leave by Type</h3>
            {(() => {
              const typeData = Object.entries(analytics.leaveStats.byType).map(([type, count]) => ({
                label: type,
                value: count,
                color: { annual: 'from-indigo-500 to-indigo-400', sick: 'from-rose-500 to-rose-400', personal: 'from-violet-500 to-violet-400', unpaid: 'from-slate-500 to-slate-400' }[type] || 'from-slate-500 to-slate-400'
              }))
              const maxTypeValue = Math.max(...typeData.map(d => d.value), 1)
              return (
                <div className="flex items-end justify-between gap-3 h-52">
                  {typeData.map(d => {
                    const heightPercent = (d.value / maxTypeValue) * 100
                    return (
                      <div key={d.label} className="flex-1 flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{d.value}</span>
                        <div className="w-full h-40 bg-slate-100 dark:bg-slate-700 rounded-lg relative overflow-hidden">
                          <div 
                            className={clsx('absolute bottom-0 w-full rounded-lg bg-gradient-to-t', d.color)}
                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 mt-2 capitalize">{d.label}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Department Report */}
      {activeReport === 'department' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Shifts by Department</h3>
            <div className="space-y-4">
              {analytics.byDepartment.map(dept => (
                <div key={dept.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{dept.name}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{dept.count} shifts</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${(dept.count / maxDeptCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Department Overview</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Department</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Employees</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Shifts</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Avg/Emp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {analytics.byDepartment.map(dept => (
                    <tr key={dept.name}>
                      <td className="py-3 text-sm font-medium text-slate-900 dark:text-white">{dept.name}</td>
                      <td className="py-3 text-sm text-right text-slate-600 dark:text-slate-400">{dept.employees}</td>
                      <td className="py-3 text-sm text-right text-slate-600 dark:text-slate-400">{dept.count}</td>
                      <td className="py-3 text-sm text-right font-medium text-indigo-600 dark:text-indigo-400">{dept.employees > 0 ? (dept.count / dept.employees).toFixed(1) : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage
