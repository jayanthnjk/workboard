import { Link, useLocation } from 'react-router-dom'

const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  schedule: 'Schedule',
  employees: 'Employees',
  departments: 'Departments',
  locations: 'Locations',
  'shift-types': 'Shift Types',
  'shift-patterns': 'Shift Patterns',
  'rotation-rules': 'Rotation Rules',
  'leave-requests': 'Leave Requests',
  'swap-requests': 'Swap Requests',
  reports: 'Reports',
  audit: 'Audit Log',
  documents: 'Documents',
  settings: 'Settings',
}

export function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  if (pathnames.length <= 1) {
    return null
  }

  return (
    <nav className="flex items-center gap-2 text-sm mb-4" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]"
      >
        Home
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const displayName = routeNames[name] || name

        return (
          <span key={name} className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {isLast ? (
              <span className="text-[var(--color-text-dark)] font-medium">
                {displayName}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]"
              >
                {displayName}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumbs
