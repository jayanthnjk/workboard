import { useState, useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { personnel, sections, platoons, guardLocations, strengthSummary, kpLeaveBalances, platoonRotations } from '@/data/seedData'
import { LoadingSpinner } from '@/components/common'

type ReportType = 'strength' | 'rotation' | 'leave' | 'guard-duty'

export default function ReportsPage() {
  const { t } = useLanguage()
  const [activeReport, setActiveReport] = useState<ReportType>('strength')
  const [loading] = useState(false)

  const strengthData = useMemo(() => {
    const bySection = sections.map(s => ({
      name: s.name.split(' - ')[0],
      type: s.type,
      count: personnel.filter(p => p.section === s.type).length,
      sanctioned: s.totalStrength,
    }))
    const byRank = strengthSummary.byRank
    return { bySection, byRank, total: strengthSummary }
  }, [])

  const rotationData = useMemo(() => {
    const currentRotations = platoonRotations.filter(r => r.cycleNumber === 1)
    return platoons.map(p => {
      const rotation = currentRotations.find(r => r.platoonId === p.id)
      return {
        platoon: p.name,
        personnelCount: p.personnelCount,
        currentDuty: rotation?.dutyType || p.currentDutyType,
      }
    })
  }, [])

  const leaveData = useMemo(() => {
    const totals = { CL: 0, CML: 0, EL: 0, PL: 0 }
    const used = { CL: 0, CML: 0, EL: 0, PL: 0 }
    kpLeaveBalances.forEach(lb => {
      lb.balances.forEach(b => {
        if (b.type in totals) {
          totals[b.type as keyof typeof totals] += b.entitled
          used[b.type as keyof typeof used] += b.used
        }
      })
    })
    return { totals, used, personnel: kpLeaveBalances.length }
  }, [])

  const guardData = useMemo(() => {
    const byType = guardLocations.reduce((acc, loc) => {
      acc[loc.type] = (acc[loc.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const totalRequired = guardLocations.reduce((sum, l) => sum + l.requiredPersonnel, 0)
    return { locations: guardLocations.length, totalRequired, byType }
  }, [])

  const dutyTypeLabels: Record<string, string> = {
    'guard-i': 'Guard-I', 'guard-ii': 'Guard-II', 'check-point': 'Check Point',
    'prison-vip-escort': 'Prison/VIP', 'striking-force': 'Striking Force',
  }

  const dutyTypeColors: Record<string, string> = {
    'guard-i': 'badge-info', 'guard-ii': 'badge-success',
    'check-point': 'badge-warning', 'prison-vip-escort': 'badge-primary',
    'striking-force': 'badge-error',
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('reports_title')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('reports_subtitle')}</p>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'strength', label: 'Strength Report', icon: '👥' },
          { id: 'rotation', label: 'Rotation Status', icon: '🔄' },
          { id: 'leave', label: 'Leave Utilization', icon: '📅' },
          { id: 'guard-duty', label: 'Guard Duty Coverage', icon: '🛡️' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as ReportType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeReport === tab.id
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Strength Report */}
      {activeReport === 'strength' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Present', value: strengthData.total.totalPresent, iconClass: 'stat-icon-primary' },
              { label: 'Sanctioned', value: strengthData.total.totalSanctioned, iconClass: 'stat-icon-info' },
              { label: 'Vacancies', value: strengthData.total.totalVacancy, iconClass: 'stat-icon-error' },
              { label: 'Sections', value: sections.length, iconClass: 'stat-icon-success' },
            ].map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="flex items-center gap-3">
                  <div className={stat.iconClass}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-text-dark)]">{stat.value}</p>
                    <p className="text-xs text-[var(--color-text-medium)]">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Personnel by Section</h3>
              <div className="space-y-4">
                {strengthData.bySection.map(s => (
                  <div key={s.type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[var(--color-text-medium)]">{s.name}</span>
                      <span className="text-sm font-medium text-[var(--color-text-dark)]">{s.count} / {s.sanctioned}</span>
                    </div>
                    <div className="h-2 bg-[var(--color-bg-main)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.min((s.count / s.sanctioned) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Personnel by Rank</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="pb-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Rank</th>
                      <th className="pb-3 text-right text-xs font-medium text-[var(--color-text-medium)] uppercase">Sanctioned</th>
                      <th className="pb-3 text-right text-xs font-medium text-[var(--color-text-medium)] uppercase">Present</th>
                      <th className="pb-3 text-right text-xs font-medium text-[var(--color-text-medium)] uppercase">Vacancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {strengthData.byRank.map(r => (
                      <tr key={r.rank}>
                        <td className="py-3 text-sm font-medium text-[var(--color-text-dark)]">{r.rank}</td>
                        <td className="py-3 text-sm text-right text-[var(--color-text-medium)]">{r.sanctioned}</td>
                        <td className="py-3 text-sm text-right text-[var(--color-text-medium)]">{r.present}</td>
                        <td className={`py-3 text-sm text-right font-medium ${r.vacancy > 0 ? 'text-[var(--color-error)]' : r.vacancy < 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-text-medium)]'}`}>
                          {r.vacancy > 0 ? `-${r.vacancy}` : r.vacancy < 0 ? `+${Math.abs(r.vacancy)}` : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Rotation Status Report */}
      {activeReport === 'rotation' && (
        <>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">Current 15-Day Rotation Cycle</h3>
              <span className="badge badge-success">Cycle 1: Feb 1-15, 2026</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {rotationData.map(r => (
                <div key={r.platoon} className="bg-[var(--color-bg-main)] rounded-xl p-4 border border-[var(--color-border)]">
                  <h4 className="font-semibold text-[var(--color-text-dark)] mb-1">{r.platoon}</h4>
                  <p className="text-xs text-[var(--color-text-medium)] mb-2">{r.personnelCount} personnel</p>
                  <span className={`badge ${dutyTypeColors[r.currentDuty] || 'bg-[var(--color-bg-main)] text-[var(--color-text-medium)]'}`}>
                    {dutyTypeLabels[r.currentDuty] || r.currentDuty}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Rotation Schedule (Next 3 Cycles)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="pb-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Platoon</th>
                    <th className="pb-3 text-center text-xs font-medium text-[var(--color-text-medium)] uppercase">Cycle 1</th>
                    <th className="pb-3 text-center text-xs font-medium text-[var(--color-text-medium)] uppercase">Cycle 2</th>
                    <th className="pb-3 text-center text-xs font-medium text-[var(--color-text-medium)] uppercase">Cycle 3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {platoons.map(p => {
                    const cycle1 = platoonRotations.find(r => r.platoonId === p.id && r.cycleNumber === 1)
                    const cycle2 = platoonRotations.find(r => r.platoonId === p.id && r.cycleNumber === 2)
                    const cycle3 = platoonRotations.find(r => r.platoonId === p.id && r.cycleNumber === 3)
                    return (
                      <tr key={p.id}>
                        <td className="py-3 text-sm font-medium text-[var(--color-text-dark)]">{p.name}</td>
                        <td className="py-3 text-center"><span className={`badge ${dutyTypeColors[cycle1?.dutyType || '']}`}>{dutyTypeLabels[cycle1?.dutyType || '']}</span></td>
                        <td className="py-3 text-center"><span className={`badge ${dutyTypeColors[cycle2?.dutyType || '']}`}>{dutyTypeLabels[cycle2?.dutyType || '']}</span></td>
                        <td className="py-3 text-center"><span className={`badge ${dutyTypeColors[cycle3?.dutyType || '']}`}>{dutyTypeLabels[cycle3?.dutyType || '']}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Leave Utilization Report */}
      {activeReport === 'leave' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(['CL', 'CML', 'EL', 'PL'] as const).map(type => {
              return (
                <div key={type} className="stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge badge-navy">{type}</span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-text-dark)]">{leaveData.used[type]}</p>
                  <p className="text-xs text-[var(--color-text-medium)]">days used</p>
                  <div className="mt-2 h-1.5 bg-[var(--color-bg-main)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${(leaveData.used[type] / leaveData.totals[type]) * 100}%` }} />
                  </div>
                  <p className="text-xs text-[var(--color-text-light)] mt-1">of {leaveData.totals[type]} entitled</p>
                </div>
              )
            })}
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Leave Utilization Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-medium text-[var(--color-text-medium)] uppercase mb-4">By Leave Type</h4>
                <div className="space-y-3">
                  {(['CL', 'CML', 'EL', 'PL'] as const).map(type => {
                    const pct = leaveData.totals[type] > 0 ? (leaveData.used[type] / leaveData.totals[type]) * 100 : 0
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <div className="w-12 text-xs font-medium text-[var(--color-text-medium)]">{type}</div>
                        <div className="flex-1 h-2 bg-[var(--color-bg-main)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-12 text-xs text-right text-[var(--color-text-medium)]">{pct.toFixed(0)}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-[var(--color-text-medium)] uppercase mb-4">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[var(--color-bg-main)] rounded-xl">
                    <span className="text-sm text-[var(--color-text-medium)]">Personnel Tracked</span>
                    <span className="text-lg font-bold text-[var(--color-text-dark)]">{leaveData.personnel}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[var(--color-bg-main)] rounded-xl">
                    <span className="text-sm text-[var(--color-text-medium)]">Total Days Entitled</span>
                    <span className="text-lg font-bold text-[var(--color-text-dark)]">{Object.values(leaveData.totals).reduce((a, b) => a + b, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[var(--color-bg-main)] rounded-xl">
                    <span className="text-sm text-[var(--color-text-medium)]">Total Days Used</span>
                    <span className="text-lg font-bold text-[var(--color-success)]">{Object.values(leaveData.used).reduce((a, b) => a + b, 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Guard Duty Coverage Report */}
      {activeReport === 'guard-duty' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Guard Locations', value: guardData.locations, iconClass: 'stat-icon-primary' },
              { label: 'Personnel Required', value: guardData.totalRequired, iconClass: 'stat-icon-info' },
              { label: 'Active Locations', value: guardLocations.filter(l => l.isActive).length, iconClass: 'stat-icon-success' },
              { label: 'Location Types', value: Object.keys(guardData.byType).length, iconClass: 'stat-icon-navy' },
            ].map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="flex items-center gap-3">
                  <div className={stat.iconClass}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-text-dark)]">{stat.value}</p>
                    <p className="text-xs text-[var(--color-text-medium)]">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-dark)] mb-4">Locations by Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(guardData.byType).map(([type, count]) => {
                const labels: Record<string, string> = { 'government-office': 'Govt Office', 'bank-currency-chest': 'Bank/Currency', 'court': 'Court', 'hospital': 'Hospital', 'ncc': 'NCC' }
                const icons: Record<string, string> = { 'government-office': '🏛️', 'bank-currency-chest': '🏦', 'court': '⚖️', 'hospital': '🏥', 'ncc': '🎖️' }
                return (
                  <div key={type} className="p-4 bg-[var(--color-bg-main)] rounded-xl text-center border border-[var(--color-border)]">
                    <span className="text-2xl">{icons[type] || '📍'}</span>
                    <p className="text-2xl font-bold text-[var(--color-text-dark)] mt-2">{count}</p>
                    <p className="text-xs text-[var(--color-text-medium)]">{labels[type] || type}</p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="table-container">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">Guard Location Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-medium)] uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-text-medium)] uppercase">Required</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--color-text-medium)] uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {guardLocations.slice(0, 10).map(loc => (
                    <tr key={loc.id} className="table-row">
                      <td className="px-4 py-3 text-sm font-medium text-[var(--color-text-dark)]">{loc.name}</td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-medium)] font-mono">{loc.code}</td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-medium)] capitalize">{loc.type.replace(/-/g, ' ')}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-[var(--color-text-dark)]">{loc.requiredPersonnel}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge ${loc.isActive ? 'badge-success' : 'bg-[var(--color-bg-main)] text-[var(--color-text-medium)]'}`}>
                          {loc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
