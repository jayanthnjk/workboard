import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const SIDEBAR_STORAGE_KEY = 'workboard_sidebar_collapsed'

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return stored === 'true'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)]">
      {/* Top Header - Fixed floating bar */}
      <div className="fixed top-0 left-0 right-0 p-3 z-40 bg-[var(--color-bg-main)]">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
      </div>

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content - offset for fixed header + sidebar */}
      <main className={`pt-[72px] px-3 sm:px-4 pb-3 transition-all duration-300 ${sidebarCollapsed ? 'md:pl-[84px]' : 'md:pl-[244px]'} md:pr-4`}>
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
