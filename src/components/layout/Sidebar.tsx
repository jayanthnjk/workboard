import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { clsx } from 'clsx'
import type { UserRole } from '@/types'

interface SidebarProps { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void }
interface NavItem { nameKey: string; path: string; icon: React.ReactNode; roles?: UserRole[]; badge?: number }
interface NavGroup { nameKey: string; icon: React.ReactNode; roles?: UserRole[]; children: NavItem[] }
type SidebarEntry = NavItem | NavGroup
function isGroup(e: SidebarEntry): e is NavGroup { return 'children' in e }

const I = {
  home: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
  schedule: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  employees: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  leave: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>,
  config: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  reports: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  audit: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  chev: (open: boolean) => <svg className={clsx('w-3 h-3 transition-transform duration-300', open && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>,
}

interface Section { label: string; entries: SidebarEntry[] }
const sections: Section[] = [
  { label: '', entries: [
    { nameKey: 'home', path: '/home', icon: I.home },
    { nameKey: 'schedules', path: '/shift-schedule', icon: I.schedule },
    { nameKey: 'personnel', path: '/employees', icon: I.employees, roles: ['admin', 'supervisor'] },
    { nameKey: 'leave_requests', path: '/leave-requests', icon: I.leave, badge: 3 },
  ]},
  { label: 'admin_section', entries: [
    { nameKey: 'configuration', icon: I.config, roles: ['admin'], children: [
      { nameKey: 'sections', path: '/sections', icon: <></> },
      { nameKey: 'locations', path: '/locations', icon: <></> },
      { nameKey: 'shift_types', path: '/shift-types', icon: <></> },
      { nameKey: 'rotation_rules', path: '/rotation-rules', icon: <></> },
      { nameKey: 'messaging', path: '/messaging', icon: <></> },
    ]},
    { nameKey: 'audit_log', path: '/audit', icon: I.audit, roles: ['admin'] },
  ]},
]

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { role } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const toggleGroup = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')
  const isAllowed = (roles?: UserRole[]) => !roles || (role != null && roles.includes(role))
  const anyGroupChildActive = (group: NavGroup) => group.children.some(c => isActive(c.path))

  /* ── Nav Item ── */
  const Item = ({ item, mobile = false, child = false }: { item: NavItem; mobile?: boolean; child?: boolean }) => {
    const active = isActive(item.path)
    const show = mobile || !collapsed
    const label = t(item.nameKey)
    return (
      <NavLink
        to={item.path}
        onClick={onMobileClose}
        title={collapsed && !mobile ? label : undefined}
        className={clsx(
          'group relative flex items-center min-h-[40px] transition-all duration-200',
          collapsed && !mobile
            ? 'justify-center mx-1 px-2 py-2 rounded-lg'
            : 'mx-2 px-3 py-2 rounded-lg'
        )}
      >
        {/* Active left accent bar */}
        {active && !child && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full bg-[#000080]" />
        )}
        {/* Active bg */}
        {active && (
          <span className={clsx('absolute inset-0 rounded-lg', child ? 'bg-[rgba(0,0,128,0.03)]' : 'bg-[rgba(0,0,128,0.05)]')} />
        )}
        {/* Hover bg */}
        {!active && (
          <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-[rgba(0,0,0,0.02)] transition-opacity" />
        )}

        <span className={clsx('relative z-10 flex items-center gap-2.5 w-full', collapsed && !mobile && 'justify-center')}>
          {!child && (
            <span className={clsx('flex-shrink-0 transition-colors duration-200', active ? 'text-[#000080]' : 'text-[#94A3B8] group-hover:text-[#334155]')}>
              {item.icon}
            </span>
          )}
          {child && show && (
            <span className={clsx('w-1 h-1 rounded-full flex-shrink-0 transition-colors', active ? 'bg-[#000080]' : 'bg-[#CBD5E1] group-hover:bg-[#94A3B8]')} />
          )}
          {show && (
            <>
              <span
                className={clsx(
                  'text-[12px] flex-1 truncate transition-colors',
                  active ? 'text-[#000080] font-medium' : 'text-[#64748B] group-hover:text-[#334155] font-normal'
                )}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {label}
              </span>
              {item.badge != null && item.badge > 0 && (
                <span className="relative z-10 text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 bg-red-500 text-white">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </span>

        {/* Collapsed tooltip */}
        {collapsed && !mobile && (
          <div className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 text-[11px] font-medium text-white bg-gray-800 shadow-lg">
            {label}
          </div>
        )}
      </NavLink>
    )
  }

  /* ── Config Group ── */
  const Group = ({ group, mobile = false }: { group: NavGroup; mobile?: boolean }) => {
    const label = t(group.nameKey)
    const expanded = openGroups[group.nameKey] || anyGroupChildActive(group)
    if (collapsed && !mobile) {
      return (
        <div className="relative group">
          <button
            onClick={() => toggleGroup(group.nameKey)}
            title={label}
            className="w-full flex items-center justify-center mx-1 px-2 py-2 min-h-[40px] rounded-lg text-[#94A3B8] hover:text-[#334155] hover:bg-[rgba(0,0,0,0.02)] transition-all"
          >
            {group.icon}
          </button>
          <div className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 text-[11px] font-medium text-white bg-gray-800 shadow-lg">
            {label}
          </div>
        </div>
      )
    }
    return (
      <div>
        <button
          onClick={() => toggleGroup(group.nameKey)}
          className="w-full flex items-center gap-2.5 mx-2 px-3 py-2 min-h-[40px] rounded-lg text-[#64748B] hover:text-[#334155] hover:bg-[rgba(0,0,0,0.02)] transition-all"
          style={{ width: 'calc(100% - 16px)' }}
        >
          <span className="text-[#94A3B8]">{group.icon}</span>
          <span className="text-[12px] flex-1 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
          <span className="text-[#94A3B8]">{I.chev(expanded)}</span>
        </button>
        <div className={clsx('overflow-hidden transition-all duration-300 ease-out', expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0')}>
          <div className="ml-[38px] mt-0.5 space-y-0.5 pl-3" style={{ borderLeft: '1px solid rgba(0,0,128,0.08)' }}>
            {group.children.filter(c => isAllowed(c.roles)).map(child => (
              <Item key={child.path} item={child} mobile={mobile} child />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Section Block ── */
  const SectionBlock = ({ section, mobile = false }: { section: Section; mobile?: boolean }) => {
    const show = mobile || !collapsed
    const visible = section.entries.filter(e => isAllowed(e.roles))
    if (!visible.length) return null
    return (
      <div>
        {section.label && show && (
          <div className="px-5 pt-5 pb-1.5">
            <span className="text-[9px] font-semibold tracking-[0.12em] text-[#CBD5E1] uppercase">{t(section.label)}</span>
          </div>
        )}
        {section.label && !show && (
          <div className="pt-3 pb-1.5"><div className="mx-3 h-px bg-black/[0.04]" /></div>
        )}
        <div className="space-y-0.5">
          {visible.map(entry =>
            isGroup(entry)
              ? <Group key={entry.nameKey} group={entry} mobile={mobile} />
              : <Item key={entry.path} item={entry} mobile={mobile} />
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={clsx(
          'fixed left-3 top-[68px] bottom-3 flex-col z-20 hidden md:flex transition-all duration-300',
          collapsed ? 'w-[64px]' : 'w-[220px]'
        )}
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '0.75rem' }}
      >
        {/* Nav — starts directly, logo is in header */}

        {/* Collapse toggle — edge circle */}
        <button
          onClick={onToggle}
          className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full flex items-center justify-center z-30 transition-all hover:scale-110 bg-[var(--color-bg-card)] border border-[var(--color-border)]"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
          title={collapsed ? t('expand') : t('collapse_sidebar')}
        >
          <svg
            className={clsx('w-3 h-3 text-gray-500 transition-transform duration-300', collapsed && 'rotate-180')}
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
          {sections.map(s => <SectionBlock key={s.label || 'main'} section={s} />)}
        </nav>

        {/* Bottom separator */}
        <div className="flex-shrink-0 px-3 pb-3">
          <div className="h-px bg-black/[0.06]" />
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={onMobileClose}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={clsx(
          'fixed left-0 top-0 bottom-0 w-[260px] z-50 transform transition-transform duration-300 md:hidden flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'var(--color-bg-card)' }}
      >
        <div className="flex items-center justify-between h-[56px] px-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #000080 0%, #000050 100%)' }}
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>KSP WorkBoard</p>
              <p className="text-[9px] text-gray-400 font-medium tracking-wider">CAR UNIT</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/[0.03] transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mx-4 h-px bg-black/[0.06]" />
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
          {sections.map(s => <SectionBlock key={s.label || 'main'} section={s} mobile />)}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
