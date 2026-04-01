import { useState, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/NotificationContext'
import { useLanguage } from '@/context/LanguageContext'
import { rbacService } from '@/services/rbacService'
import { kpLeaveBalances, personnel } from '@/data/seedData'
import type { KPLeaveType } from '@/types'

function getLeaveMeta(t: (key: string) => string): Record<KPLeaveType, { label: string; color: string }> {
  return {
    CL: { label: t('casual_leave_full'), color: '#3b82f6' },
    CML: { label: t('medical_leave_full'), color: '#ef4444' },
    EL: { label: t('earned_leave_full'), color: '#10b981' },
    PL: { label: t('privilege_leave_full'), color: '#8b5cf6' },
  }
}

type Tab = 'Overview' | 'Leave & Attendance' | 'Service Record' | 'Settings'

// Mock holidays for 2026
const holidays2026 = [
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-03-17', name: 'Holi' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti' },
  { date: '2026-05-01', name: 'May Day' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-11-01', name: 'Karnataka Rajyotsava' },
  { date: '2026-11-04', name: 'Diwali' },
  { date: '2026-12-25', name: 'Christmas' },
]

// Mock achievements
const achievements = [
  { title: 'Best Duty Performance', year: '2025', desc: 'Awarded for exemplary guard duty at Commissioner Office' },
  { title: 'Commendation Certificate', year: '2024', desc: 'VIP escort duty during state-level event' },
  { title: 'Long Service Medal', year: '2023', desc: '15 years of dedicated service' },
]

export function ProfilePage() {
  const { user } = useAuth()
  const { showToast } = useNotifications()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [phone, setPhone] = useState('+91 98765 43210')
  const [email, setEmail] = useState(user?.email || `${user?.username}@ksp.gov.in`)
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')

  const LEAVE_META = useMemo(() => getLeaveMeta(t), [t])
  const TAB_LABELS: Record<Tab, string> = {
    'Overview': t('tab_overview'),
    'Leave & Attendance': t('tab_leave_attendance'),
    'Service Record': t('tab_service_record'),
    'Settings': t('tab_settings'),
  }
  const TABS: Tab[] = ['Overview', 'Leave & Attendance', 'Service Record', 'Settings']

  const permissions = useMemo(() => rbacService.getPermissions(user ?? null), [user])
  const myPersonnel = useMemo(() => personnel.find(p => p.personnelId === user?.employeeId) || personnel[0], [user])
  const myLeaveBalance = useMemo(() => kpLeaveBalances[0]?.balances || [], [])

  const validatePhone = (v: string) => {
    const clean = v.replace(/\s/g, '')
    if (!/^\+91\d{10}$/.test(clean) && !/^\d{10}$/.test(clean)) {
      setPhoneError('Enter valid 10-digit number (with or without +91)')
      return false
    }
    setPhoneError('')
    return true
  }

  const validateEmail = (v: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setEmailError('Enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  const handleSaveContact = () => {
    const phoneOk = validatePhone(phone)
    const emailOk = validateEmail(email)
    if (phoneOk && emailOk) {
      setIsEditingContact(false)
      showToast({ type: 'success', title: 'Contact Updated', message: 'Your contact details have been saved.' })
    }
  }

  // ─── Overview Tab ───
  const OverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Profile Card */}
      <div className="card p-5 flex flex-col items-center text-center">
        <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt={user?.name} className="w-20 h-20 rounded-full border-4 border-[var(--color-border)]" />
        <h2 className="mt-3 text-lg font-semibold text-[var(--color-text-dark)]">{user?.name}</h2>
        <p className="text-sm text-[var(--color-text-medium)]">{permissions.userRank || 'Officer'}</p>
        <span className="mt-1 px-3 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] uppercase">{user?.role}</span>
        <div className="w-full mt-4 pt-4 border-t border-[var(--color-border)] space-y-2 text-left">
          <div className="flex justify-between text-xs"><span className="text-[var(--color-text-light)]">{t('employee_id')}</span><span className="font-mono text-[var(--color-text-dark)]">{myPersonnel?.personnelId || 'N/A'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-[var(--color-text-light)]">{t('section')}</span><span className="text-[var(--color-text-dark)]">{t('section')} {myPersonnel?.section}</span></div>
          <div className="flex justify-between text-xs"><span className="text-[var(--color-text-light)]">{t('platoon')}</span><span className="text-[var(--color-text-dark)]">{myPersonnel?.platoon ? `${t('platoon')} ${myPersonnel.platoon.replace('P', '')}` : 'N/A'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-[var(--color-text-light)]">{t('status')}</span><span className="text-green-600 font-medium capitalize">{myPersonnel?.status}</span></div>
          <div className="flex justify-between text-xs"><span className="text-[var(--color-text-light)]">{t('date_of_joining')}</span><span className="text-[var(--color-text-dark)]">{myPersonnel?.hireDate ? new Date(myPersonnel.hireDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span></div>
        </div>
      </div>

      {/* Right column */}
      <div className="lg:col-span-2 space-y-5">
        {/* Contact Info */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">{t('contact_information')}</h3>
            {isEditingContact ? (
              <div className="flex gap-2">
                <button onClick={() => setIsEditingContact(false)} className="text-xs text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]">{t('cancel')}</button>
                <button onClick={handleSaveContact} className="text-xs text-[var(--color-primary)] font-semibold hover:underline">{t('save')}</button>
              </div>
            ) : (
              <button onClick={() => setIsEditingContact(true)} className="text-xs text-[var(--color-primary)] hover:underline">{t('edit')}</button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Phone</label>
              {isEditingContact ? (
                <div>
                  <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setPhoneError('') }} className="input mt-1 text-sm" />
                  {phoneError && <p className="text-[10px] text-red-500 mt-0.5">{phoneError}</p>}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-dark)] mt-1">{phone}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] text-[var(--color-text-light)] uppercase tracking-wide font-semibold">Email</label>
              {isEditingContact ? (
                <div>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailError('') }} className="input mt-1 text-sm" />
                  {emailError && <p className="text-[10px] text-red-500 mt-0.5">{emailError}</p>}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-dark)] mt-1">{email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Leave Summary */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">{t('leave_balance')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {myLeaveBalance.map(b => {
              const meta = LEAVE_META[b.type as KPLeaveType]
              return (
                <div key={b.type} className="text-center p-3 bg-[var(--color-bg-main)] rounded-lg">
                  <p className="text-lg font-bold text-[var(--color-text-dark)]">{b.remaining}</p>
                  <p className="text-[10px] text-[var(--color-text-light)]">{meta?.label}</p>
                  <div className="mt-1.5 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(b.remaining / b.entitled) * 100}%`, backgroundColor: meta?.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">{t('achievements_awards')}</h3>
          <div className="space-y-3">
            {achievements.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">🏅</div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-dark)]">{a.title} <span className="text-[10px] text-[var(--color-text-light)]">({a.year})</span></p>
                  <p className="text-xs text-[var(--color-text-medium)]">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ─── Leave & Attendance Tab ───
  const LeaveTab = () => (
    <div className="space-y-5">
      {/* Leave Balances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {myLeaveBalance.map(b => {
          const meta = LEAVE_META[b.type as KPLeaveType]
          const pct = b.entitled > 0 ? (b.remaining / b.entitled) * 100 : 0
          return (
            <div key={b.type} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta?.color }}>{meta?.label}</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-2xl font-bold text-[var(--color-text-dark)]">{b.remaining}</span>
                <span className="text-xs text-[var(--color-text-light)] pb-0.5">/ {b.entitled}</span>
              </div>
              <div className="h-1.5 bg-[var(--color-bg-main)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta?.color }} />
              </div>
              <p className="text-[10px] text-[var(--color-text-light)] mt-1">{t('used_remaining').replace('{0}', String(b.used)).replace('{1}', String(b.remaining))}</p>
            </div>
          )
        })}
      </div>

      {/* Pending Leaves */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">{t('my_pending_requests')}</h3>
        <div className="text-xs text-[var(--color-text-light)] py-4 text-center">{t('no_pending_leave')}</div>
      </div>

      {/* Holiday Calendar */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">{t('holiday_calendar_2026')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {holidays2026.map(h => {
            const d = new Date(h.date + 'T00:00:00')
            const isPast = d < new Date()
            return (
              <div key={h.date} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${isPast ? 'border-[var(--color-border)] opacity-50' : 'border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5'}`}>
                <div className="text-center min-w-[40px]">
                  <p className="text-lg font-bold text-[var(--color-text-dark)]">{d.getDate()}</p>
                  <p className="text-[10px] text-[var(--color-text-light)] uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-dark)]">{h.name}</p>
                  <p className="text-[10px] text-[var(--color-text-light)]">{d.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // ─── Service Record Tab ───
  const ServiceTab = () => (
    <div className="space-y-5">
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">{t('service_details')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: t('date_of_joining'), value: myPersonnel?.hireDate ? new Date(myPersonnel.hireDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A' },
            { label: t('current_rank'), value: permissions.userRank || 'N/A' },
            { label: t('section'), value: `${t('section')} ${myPersonnel?.section}` },
            { label: t('platoon'), value: myPersonnel?.platoon ? `${t('platoon')} ${myPersonnel.platoon.replace('P', '')}` : 'N/A' },
            { label: t('current_duty_profile'), value: myPersonnel?.dutyCategory || 'Rotational Duty' },
            { label: t('unit'), value: 'City Armed Reserve (CAR), Mangaluru' },
            { label: t('district'), value: 'Dakshina Kannada' },
            { label: t('years_of_service'), value: myPersonnel?.hireDate ? `${new Date().getFullYear() - new Date(myPersonnel.hireDate).getFullYear()} years` : 'N/A' },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-2 border-b border-[var(--color-border)]">
              <span className="text-xs text-[var(--color-text-light)]">{item.label}</span>
              <span className="text-xs font-medium text-[var(--color-text-dark)]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">{t('awards_commendations')}</h3>
        <div className="space-y-3">
          {achievements.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-[var(--color-bg-main)] rounded-lg">
              <span className="text-xl">🏅</span>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-dark)]">{a.title}</p>
                <p className="text-xs text-[var(--color-text-medium)]">{a.desc}</p>
                <p className="text-[10px] text-[var(--color-text-light)] mt-0.5">{a.year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training History */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-3">{t('training_history')}</h3>
        <div className="space-y-2">
          {[
            { name: 'Basic Training PTS Mysuru', date: 'May 2025', status: 'Completed' },
            { name: 'PDMS Training', date: 'Mar 2026', status: 'Completed' },
            { name: 'CCT Training Koodlu', date: 'Mar 2026', status: 'Ongoing' },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
              <div>
                <p className="text-xs font-medium text-[var(--color-text-dark)]">{t.name}</p>
                <p className="text-[10px] text-[var(--color-text-light)]">{t.date}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ─── Settings Tab ───
  const SettingsTab = () => (
    <div className="card p-5 max-w-2xl">
      <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">{t('account_settings')}</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
          <div>
            <p className="text-sm text-[var(--color-text-dark)]">{t('email_notifications')}</p>
            <p className="text-xs text-[var(--color-text-light)]">{t('email_notif_desc')}</p>
          </div>
          <div className="w-10 h-5 bg-[var(--color-primary)] rounded-full relative cursor-pointer">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
          </div>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
          <div>
            <p className="text-sm text-[var(--color-text-dark)]">{t('sms_alerts')}</p>
            <p className="text-xs text-[var(--color-text-light)]">{t('sms_alerts_desc')}</p>
          </div>
          <div className="w-10 h-5 bg-[var(--color-primary)] rounded-full relative cursor-pointer">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
          </div>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm text-[var(--color-text-dark)]">{t('language')}</p>
            <p className="text-xs text-[var(--color-text-light)]">{t('language_pref_desc')}</p>
          </div>
          <select className="text-xs bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-lg px-3 py-1.5">
            <option>English</option>
            <option>ಕನ್ನಡ</option>
          </select>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('my_profile')}</h1>
        <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('profile_subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && <OverviewTab />}
      {activeTab === 'Leave & Attendance' && <LeaveTab />}
      {activeTab === 'Service Record' && <ServiceTab />}
      {activeTab === 'Settings' && <SettingsTab />}
    </div>
  )
}

export default ProfilePage
