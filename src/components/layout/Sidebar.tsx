import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { clsx } from 'clsx'
import type { UserRole } from '@/types'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

interface NavItem {
  nameKey: string
  path: string
  icon: React.ReactNode
  roles?: UserRole[]
  badge?: number
}

interface NavGroup {
  nameKey: string
  icon: React.ReactNode
  roles?: UserRole[]
  children: NavItem[]
}

type SidebarEntry = NavItem | NavGroup

function isGroup(entry: SidebarEntry): entry is NavGroup {
  return 'children' in entry
}

// ─── Icons ───
const I = {
  home: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  schedule: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  employees: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  leave: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  config: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  reports: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  audit: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  chevDown: (open: boolean) => <svg className={clsx('w-4 h-4 text-[var(--color-text-light)] transition-transform duration-200', open && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>,
}

// ─── Structure ───
interface Section { label: string; entries: SidebarEntry[] }

const sections: Section[] = [
  {
    label: 'NAVIGATION',
    entries: [
      { nameKey: 'home', path: '/home', icon: I.home },
      { nameKey: 'schedules', path: '/shift-schedule', icon: I.schedule },
      { nameKey: 'personnel', path: '/employees', icon: I.employees, roles: ['admin', 'supervisor'] },
      { nameKey: 'leave_requests', path: '/leave-requests', icon: I.leave, badge: 3 },
    ],
  },
  {
    label: 'ADMINISTRATION',
    entries: [
      {
        nameKey: 'configuration',
        icon: I.config,
        roles: ['admin'],
        children: [
          { nameKey: 'departments', path: '/departments', icon: <></> },
          { nameKey: 'locations', path: '/locations', icon: <></> },
          { nameKey: 'shift_types', path: '/shift-types', icon: <></> },
          { nameKey: 'shift_patterns', path: '/shift-patterns', icon: <></> },
          { nameKey: 'rotation_rules', path: '/rotation-rules', icon: <></> },
          { nameKey: 'documents', path: '/documents', icon: <></> },
        ],
      },
      { nameKey: 'reports', path: '/reports', icon: I.reports, roles: ['admin', 'supervisor'] },
      { nameKey: 'audit_log', path: '/audit', icon: I.audit, roles: ['admin'] },
    ],
  },
]

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { role } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [configOpen, setConfigOpen] = useState(true)

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')
  const isAllowed = (roles?: UserRole[]) => !roles || (role != null && roles.includes(role))

  const anyConfigChildActive = sections
    .flatMap(s => s.entries)
    .filter(isGroup)
    .some(g => g.children.some(c => isActive(c.path)))

  const expanded = configOpen || anyConfigChildActive

  // ─── Nav item ───
  const NavItem = ({ item, mobile = false, child = false }: { item: NavItem; mobile?: boolean; child?: boolean }) => {
    const active = isActive(item.path)
    const show = mobile || !collapsed
    const label = t(item.nameKey)

    return (
      <NavLink
        to={item.path}
        onClick={onMobileClose}
        title={collapsed && !mobile ? label : undefined}
        className={clsx(
          'group relative flex items-center transition-colors duration-150',
          collapsed && !mobile ? 'justify-center rounded-lg p-2' : 'rounded-lg px-3 py-[9px]',
          active
            ? child
              ? 'text-[var(--color-primary)] font-semibold bg-[var(--color-primary)]/5'
              : 'bg-[var(--color-primary)] text-white'
            : 'text-[var(--color-text-medium)] hover:bg-[var(--color-bg-main)] hover:text-[var(--color-text-dark)]'
        )}
      >
        {!child && (
          <span className={clsx(
            'flex-shrink-0',
            collapsed && !mobile ? '' : 'mr-3',
            active ? 'text-white' : 'text-[var(--color-text-light)] group-hover:text-[var(--color-text-medium)]'
          )}>
            {item.icon}
          </span>
        )}
        {show && (
          <>
            <span className={clsx('text-[13px] flex-1', active && !child ? 'font-medium' : '')}>{label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className={clsx(
                'ml-auto text-[10px] font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5',
                active && !child
                  ? 'bg-white/20 text-white'
                  : 'border border-[var(--color-border)] text-[var(--color-text-light)]'
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && !mobile && (
          <div className="pointer-events-none absolute left-full ml-2.5 px-2 py-1 bg-[var(--color-text-dark)] text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            {label}
          </div>
        )}
      </NavLink>
    )
  }

  // ─── Config group ───
  const ConfigGroup = ({ group, mobile = false }: { group: NavGroup; mobile?: boolean }) => {
    const label = t(group.nameKey)

    if (collapsed && !mobile) {
      return (
        <div className="relative group">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            title={label}
            className="w-full flex items-center justify-center rounded-lg p-2 text-[var(--color-text-light)] hover:bg-[var(--color-bg-main)] hover:text-[var(--color-text-medium)] transition-colors"
          >
            {group.icon}
          </button>
          <div className="pointer-events-none absolute left-full ml-2.5 px-2 py-1 bg-[var(--color-text-dark)] text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            {label}
          </div>
        </div>
      )
    }

    return (
      <div>
        <button
          onClick={() => setConfigOpen(!expanded)}
          className="w-full flex items-center rounded-lg px-3 py-[9px] text-[var(--color-text-medium)] hover:bg-[var(--color-bg-main)] hover:text-[var(--color-text-dark)] transition-colors duration-150"
        >
          <span className="text-[var(--color-text-light)] mr-3">{group.icon}</span>
          <span className="text-[13px] font-medium flex-1 text-left">{label}</span>
          {I.chevDown(expanded)}
        </button>

        {/* Sub-items with vertical line */}
        <div className={clsx(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        )}>
          <div className="relative ml-[26px] mt-1 pl-4 border-l-[1.5px] border-[var(--color-border)] space-y-0.5">
            {group.children
              .filter(c => isAllowed(c.roles))
              .map(child => (
                <NavItem key={child.path} item={child} mobile={mobile} child />
              ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Section ───
  const SectionBlock = ({ section, mobile = false }: { section: Section; mobile?: boolean }) => {
    const show = mobile || !collapsed
    const visible = section.entries.filter(e => isAllowed(e.roles))
    if (visible.length === 0) return null

    return (
      <div>
        {show ? (
          <div className="px-3 pt-5 pb-1.5">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-[var(--color-text-light)] uppercase">
              {section.label}
            </span>
          </div>
        ) : (
          <div className="pt-3 pb-1"><div className="mx-2 border-t border-[var(--color-border)]" /></div>
        )}
        <div className="space-y-0.5">
          {visible.map(entry =>
            isGroup(entry)
              ? <ConfigGroup key={entry.nameKey} group={entry} mobile={mobile} />
              : <NavItem key={entry.path} item={entry} mobile={mobile} />
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <aside className={clsx(
        'fixed left-3 top-[68px] bottom-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl transition-all duration-300 hidden md:flex flex-col z-20',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}>
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-full flex items-center justify-center text-[var(--color-text-light)] hover:text-[var(--color-primary)] transition-colors z-30"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <svg className={clsx('w-3 h-3 transition-transform duration-200', collapsed && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <nav className={clsx('flex-1 overflow-y-auto scrollbar-thin py-1', collapsed ? 'px-1.5' : 'px-2')}>
          {sections.map(s => <SectionBlock key={s.label} section={s} />)}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onMobileClose} />}

      {/* Mobile drawer */}
      <aside className={clsx(
        'fixed left-0 top-0 bottom-0 w-[280px] bg-[var(--color-bg-card)] z-50 transform transition-transform duration-300 md:hidden flex flex-col shadow-xl',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-dark)]">KSP WorkBoard</p>
              <p className="text-[10px] text-[var(--color-text-light)]">CAR Unit</p>
            </div>
          </div>
          <button onClick={onMobileClose} className="p-1.5 hover:bg-[var(--color-bg-main)] rounded-lg">
            <svg className="w-5 h-5 text-[var(--color-text-medium)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-2 pb-4 overflow-y-auto scrollbar-thin">
          {sections.map(s => <SectionBlock key={s.label} section={s} mobile />)}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
