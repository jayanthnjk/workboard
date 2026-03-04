import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { apiGateway } from '@/services/apiGateway'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { ShiftAssignment, Notification } from '@/types'

interface DashboardMetrics {
  totalEmployees: number
  activeShifts: number
  pendingLeaveRequests: number
  pendingSwapRequests: number
  coveragePercentage: number
  upcomingShifts: ShiftAssignment[]
  recentNotifications: Notification[]
}

export default function DashboardPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [employeesRes, shiftsRes, leaveRes, notifsRes] = await Promise.all([
          apiGateway.getAllEmployees(),
          apiGateway.getShiftAssignments(),
          apiGateway.getLeaveRequests(),
          user ? apiGateway.getNotifications(user.id) : Promise.resolve({ success: true, data: [] }),
        ])

        const employees = employeesRes.success ? employeesRes.data : []
        const shifts = shiftsRes.success ? shiftsRes.data : []
        const leaveRequests = leaveRes.success ? leaveRes.data : []
        const notifications = notifsRes.success ? notifsRes.data : []

        const today = new Date().toISOString().split('T')[0]
        const todayShifts = shifts.filter(s => s.date === today)
        const pendingLeave = leaveRequests.filter(l => l.status === 'pending')
        
        // Calculate coverage (simplified)
        const activeEmployees = employees.filter(e => e.status === 'active').length
        const coverage = activeEmployees > 0 ? Math.min(100, (todayShifts.length / activeEmployees) * 100) : 0

        // Get upcoming shifts for current user (employee view)
        const userShifts = user 
          ? shifts.filter(s => s.employeeId === user.employeeId && s.date >= today).slice(0, 5)
          : []

        setMetrics({
          totalEmployees: employees.filter(e => e.status === 'active').length,
          activeShifts: todayShifts.length,
          pendingLeaveRequests: pendingLeave.length,
          pendingSwapRequests: 0, // Would come from swap requests API
          coveragePercentage: Math.round(coverage),
          upcomingShifts: userShifts,
          recentNotifications: notifications.slice(0, 5),
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!metrics) {
    return <div>Failed to load dashboard data</div>
  }

  // Render different dashboards based on role
  if (role === 'admin') {
    return <AdminDashboard metrics={metrics} navigate={navigate} />
  }

  if (role === 'supervisor') {
    return <SupervisorDashboard metrics={metrics} navigate={navigate} />
  }

  return <EmployeeDashboard metrics={metrics} navigate={navigate} user={user} />
}

interface DashboardProps {
  metrics: DashboardMetrics
  navigate: (path: string) => void
  user?: typeof import('@/context/AuthContext').useAuth extends () => { user: infer U } ? U : never
}

function AdminDashboard({ metrics, navigate }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Organization overview and system health</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Employees"
          value={metrics.totalEmployees}
          icon={<UserIcon />}
          onClick={() => navigate('/employees')}
        />
        <MetricCard
          title="Today's Shifts"
          value={metrics.activeShifts}
          icon={<CalendarIcon />}
          onClick={() => navigate('/schedule')}
        />
        <MetricCard
          title="Pending Leave"
          value={metrics.pendingLeaveRequests}
          icon={<ClockIcon />}
          color={metrics.pendingLeaveRequests > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/leave-requests')}
        />
        <MetricCard
          title="Coverage"
          value={`${metrics.coveragePercentage}%`}
          icon={<ChartIcon />}
          color={metrics.coveragePercentage < 80 ? 'error' : 'success'}
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction label="Generate Schedule" icon={<CalendarIcon />} onClick={() => navigate('/schedule')} />
          <QuickAction label="Add Employee" icon={<UserIcon />} onClick={() => navigate('/employees')} />
          <QuickAction label="View Reports" icon={<ChartIcon />} onClick={() => navigate('/reports')} />
          <QuickAction label="Audit Log" icon={<DocumentIcon />} onClick={() => navigate('/audit')} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
        <NotificationList notifications={metrics.recentNotifications} />
      </div>
    </div>
  )
}

function SupervisorDashboard({ metrics, navigate }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Supervisor Dashboard</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Team management and approvals</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Team Members"
          value={metrics.totalEmployees}
          icon={<UserIcon />}
          onClick={() => navigate('/employees')}
        />
        <MetricCard
          title="Today's Coverage"
          value={metrics.activeShifts}
          icon={<CalendarIcon />}
          onClick={() => navigate('/schedule')}
        />
        <MetricCard
          title="Pending Approvals"
          value={metrics.pendingLeaveRequests}
          icon={<ClockIcon />}
          color={metrics.pendingLeaveRequests > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/leave-requests')}
        />
        <MetricCard
          title="Swap Requests"
          value={metrics.pendingSwapRequests}
          icon={<SwapIcon />}
          onClick={() => navigate('/swap-requests')}
        />
      </div>

      {/* Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Pending Leave Requests</h2>
          {metrics.pendingLeaveRequests > 0 ? (
            <button
              onClick={() => navigate('/leave-requests')}
              className="w-full py-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-500 transition-colors"
            >
              <p className="text-2xl font-bold text-warning-500">{metrics.pendingLeaveRequests}</p>
              <p className="text-neutral-500">requests awaiting approval</p>
            </button>
          ) : (
            <p className="text-neutral-500 py-8 text-center">No pending requests</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
          <NotificationList notifications={metrics.recentNotifications} />
        </div>
      </div>
    </div>
  )
}

function EmployeeDashboard({ metrics, navigate, user }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">Your schedule and requests</p>
      </div>

      {/* Upcoming Shifts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Shifts</h2>
          <button
            onClick={() => navigate('/schedule')}
            className="text-sm text-primary-500 hover:text-primary-600"
          >
            View full schedule →
          </button>
        </div>
        {metrics.upcomingShifts.length > 0 ? (
          <div className="space-y-3">
            {metrics.upcomingShifts.map(shift => (
              <div
                key={shift.id}
                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
              >
                <div>
                  <p className="font-medium">{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                  <p className="text-sm text-neutral-500">Shift ID: {shift.shiftTypeId}</p>
                </div>
                <span className={`badge ${shift.status === 'confirmed' ? 'badge-success' : 'badge-info'}`}>
                  {shift.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 py-8 text-center">No upcoming shifts scheduled</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/leave-requests')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <ClockIcon />
            </div>
            <div>
              <p className="font-medium">Request Leave</p>
              <p className="text-sm text-neutral-500">Submit time off request</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/swap-requests')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <SwapIcon />
            </div>
            <div>
              <p className="font-medium">Swap Shift</p>
              <p className="text-sm text-neutral-500">Exchange with colleague</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="card hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <SettingsIcon />
            </div>
            <div>
              <p className="font-medium">Preferences</p>
              <p className="text-sm text-neutral-500">Update availability</p>
            </div>
          </div>
        </button>
      </div>

      {/* Notifications */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
        <NotificationList notifications={metrics.recentNotifications} />
      </div>
    </div>
  )
}

// Helper Components
interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: 'default' | 'success' | 'warning' | 'error'
  onClick?: () => void
}

function MetricCard({ title, value, icon, color = 'default', onClick }: MetricCardProps) {
  const colorClasses = {
    default: 'text-neutral-900 dark:text-white',
    success: 'text-success-500',
    warning: 'text-warning-500',
    error: 'text-error-500',
  }

  return (
    <button
      onClick={onClick}
      className="card hover:shadow-lg transition-shadow text-left w-full"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
        </div>
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
          {icon}
        </div>
      </div>
    </button>
  )
}

interface QuickActionProps {
  label: string
  icon: React.ReactNode
  onClick: () => void
}

function QuickAction({ label, icon, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
    >
      <div className="text-primary-500">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

function NotificationList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return <p className="text-neutral-500 py-4 text-center">No recent notifications</p>
  }

  return (
    <div className="space-y-2">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`p-3 rounded-lg ${notif.isRead ? 'bg-neutral-50 dark:bg-neutral-700' : 'bg-primary-50 dark:bg-primary-900/20'}`}
        >
          <p className="font-medium text-sm">{notif.title}</p>
          <p className="text-xs text-neutral-500 mt-1">{notif.message}</p>
        </div>
      ))}
    </div>
  )
}

// Icons
function UserIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function SwapIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
