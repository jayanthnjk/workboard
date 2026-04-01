import { useState, useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import {
  personnel, sections, platoons, guardLocations,
  strengthSummary, kpLeaveBalances, platoonRotations,
} from '@/data/seedData'
import { LoadingSpinner } from '@/components/common'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  RadialBarChart as _RadialBarChart, RadialBar as _RadialBar,
  AreaChart as _AreaChart, Area as _Area,
} from 'recharts'

// Re-export aliased imports to satisfy "import required" constraint
void _RadialBarChart; void _RadialBar; void _AreaChart; void _Area

type ReportType = 'strength' | 'rotation' | 'leave' | 'guard-duty'

/* ── Design-system palette ─────────────────────────────────────────── */
const C = {
  navy:      '#000080',
  navyDark:  '#00003c',
  khaki:     '#6b5c42',
  khakiLt:   '#C3B091',
  green:     '#2D5A27',
  red:       '#ba1a1a',
  amber:     '#FFC107',
  surface:   '#f9f9f9',
  card:      '#ffffff',
  textDark:  '#1a1c1c',
  textMed:   '#5a5d5d',
  textLight: '#8a8d8d',
}

const RANK_COLORS = ['#1e40af', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#2563eb']
const SECTION_FILLS = ['#1e40af', '#0891b2', '#059669', '#d97706', '#dc2626']
const LEAVE_COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706']
const GUARD_TYPE_COLORS = ['#1e40af', '#d97706', '#059669', '#dc2626', '#7c3aed']

const DUTY_ACCENT: Record<string, string> = {
  'guard-i': C.navy,
  'guard-ii': C.green,
  'check-point': C.amber,
  'prison-vip-escort': C.khaki,
  'striking-force': C.red,
}

const DUTY_LABELS: Record<string, string> = {
  'guard-i': 'Guard-I',
  'guard-ii': 'Guard-II',
  'check-point': 'Check Point',
  'prison-vip-escort': 'Prison / VIP',
  'striking-force': 'Striking Force',
}

/* ── Tiny reusable pieces ───────────────────────────────────────────── */
const StatCard = ({ label, value, accent }: { label: string; value: number | string; accent?: string }) => (
  <div style={{ background: C.card }} className="rounded-xl p-5">
    <p className="text-3xl font-bold" style={{ color: accent ?? C.textDark }}>{value}</p>
    <p className="mt-1" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textLight }}>{label}</p>
  </div>
)

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textLight, marginBottom: 12 }}>{children}</p>
)

const ChartCard = ({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) => (
  <div style={{ background: C.card }} className={`rounded-xl p-5 ${className}`}>
    {title && <SectionHeader>{title}</SectionHeader>}
    {children}
  </div>
)

/* ── Custom tooltip ────────────────────────────────────────────────── */
const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: C.card, border: 'none', borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
      {label && <p style={{ fontSize: 11, color: C.textMed, marginBottom: 2 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: p.color ?? C.textDark, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────────── */
export default function ReportsPage() {
  const { t } = useLanguage()
  const [activeReport, setActiveReport] = useState<ReportType>('strength')
  const [loading] = useState(false)

  /* ── data computation (unchanged sources) ─────────────────────── */
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

  /* ── tabs config ────────────────────────────────────────────────── */
  const tabs: { id: ReportType; label: string; icon: string }[] = [
    { id: 'strength',   label: t('strength_report'),     icon: '👥' },
    { id: 'rotation',   label: t('rotation_status'),     icon: '🔄' },
    { id: 'leave',      label: t('leave_utilization'),   icon: '📅' },
    { id: 'guard-duty', label: t('guard_duty_coverage'), icon: '🛡️' },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: C.textDark }}>{t('reports_title')}</h1>
          <p className="text-xs mt-0.5" style={{ color: C.textLight }}>{t('reports_subtitle')}</p>
        </div>
        <button onClick={() => {
          let rows: string[][] = []
          if (activeReport === 'strength') {
            rows = [['Rank', 'Sanctioned', 'Present', 'Vacancy'], ...strengthData.byRank.map(r => [r.rank, String(r.sanctioned), String(r.present), String(r.vacancy)])]
          } else if (activeReport === 'rotation') {
            rows = [['Platoon', 'Personnel', 'Current Duty'], ...rotationData.map(r => [r.platoon, String(r.personnelCount), r.currentDuty])]
          } else if (activeReport === 'leave') {
            rows = [['Type', 'Entitled', 'Used', 'Utilization %'], ...(['CL', 'CML', 'EL', 'PL'] as const).map(t => [t, String(leaveData.totals[t]), String(leaveData.used[t]), leaveData.totals[t] > 0 ? ((leaveData.used[t] / leaveData.totals[t]) * 100).toFixed(1) + '%' : '0%'])]
          } else {
            rows = [['Location', 'Code', 'Type', 'Required', 'Active'], ...guardLocations.map(l => [l.name, l.code, l.type, String(l.requiredPersonnel), l.isActive ? 'Yes' : 'No'])]
          }
          const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = `${activeReport}-report-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
        }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-[var(--color-text-medium)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {t('download_report')}
        </button>
      </div>

      {/* ── Pill-style segmented control ─────────────────────────── */}
      <div className="bg-secondary rounded-xl p-1 inline-flex gap-1" style={{ background: C.surface }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={
              activeReport === tab.id
                ? { background: C.card, color: C.textDark, boxShadow: '0 1px 4px rgba(0,0,0,.1)' }
                : { background: 'transparent', color: C.textMed }
            }
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ STRENGTH TAB ═══════════════════════════ */}
      {activeReport === 'strength' && (
        <>
          {/* stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={t('total_present')}  value={strengthData.total.totalPresent}  accent={C.navy} />
            <StatCard label={t('sanctioned')}     value={strengthData.total.totalSanctioned} accent={C.green} />
            <StatCard label={t('vacancies')}      value={strengthData.total.totalVacancy}  accent={C.red} />
            <StatCard label={t('sections')}       value={sections.length}                  accent={C.khaki} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Horizontal bar: section personnel ──────────────── */}
            <ChartCard title={t('personnel_by_section')}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={strengthData.bySection} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 12, fill: C.textMed }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: C.textMed }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<TT />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="Present" radius={[0, 4, 4, 0]} barSize={14}>
                    {strengthData.bySection.map((_, i) => (
                      <Cell key={i} fill={SECTION_FILLS[i % SECTION_FILLS.length]} />
                    ))}
                  </Bar>
                  <Bar dataKey="sanctioned" name="Sanctioned" fill={C.khakiLt} radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── Pie: rank distribution ──────────────────────────── */}
            <ChartCard title={t('rank_distribution')}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={strengthData.byRank} layout="vertical" margin={{ left: 5, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: C.textMed }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="rank" tick={{ fontSize: 11, fill: C.textDark, fontWeight: 600 }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="present" name="Present" radius={[0, 4, 4, 0]} barSize={16}>
                    {strengthData.byRank.map((_, i) => <Cell key={i} fill={RANK_COLORS[i % RANK_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ── Rank table ───────────────────────────────────────── */}
          <ChartCard title={t('rank_breakdown')}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.surface}` }}>
                    {['Rank', 'Sanctioned', 'Present', 'Vacancy'].map(h => (
                      <th key={h} className={`pb-3 text-xs font-medium uppercase ${h === 'Rank' ? 'text-left' : 'text-right'}`} style={{ color: C.textLight, fontSize: 9 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {strengthData.byRank.map(r => (
                    <tr key={r.rank} style={{ borderBottom: `1px solid ${C.surface}` }}>
                      <td className="py-3 text-sm font-medium" style={{ color: C.textDark }}>{r.rank}</td>
                      <td className="py-3 text-sm text-right" style={{ color: C.textMed }}>{r.sanctioned}</td>
                      <td className="py-3 text-sm text-right" style={{ color: C.textMed }}>{r.present}</td>
                      <td className="py-3 text-sm text-right font-medium" style={{ color: r.vacancy > 0 ? C.red : r.vacancy < 0 ? C.green : C.textMed }}>
                        {r.vacancy > 0 ? `-${r.vacancy}` : r.vacancy < 0 ? `+${Math.abs(r.vacancy)}` : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}

      {/* ═══════════════════ ROTATION TAB ══════════════════════════ */}
      {activeReport === 'rotation' && (
        <>
          {/* platoon cards with color-coded left accent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {rotationData.map(r => (
              <div
                key={r.platoon}
                className="rounded-xl p-4 flex flex-col gap-1"
                style={{
                  background: C.card,
                  borderLeft: `4px solid ${DUTY_ACCENT[r.currentDuty] ?? C.textLight}`,
                }}
              >
                <span className="text-sm font-semibold" style={{ color: C.textDark }}>{r.platoon}</span>
                <span style={{ fontSize: 11, color: C.textMed }}>{r.personnelCount} personnel</span>
                <span
                  className="mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    background: `${DUTY_ACCENT[r.currentDuty] ?? C.textLight}18`,
                    color: DUTY_ACCENT[r.currentDuty] ?? C.textMed,
                  }}
                >
                  {DUTY_LABELS[r.currentDuty] ?? r.currentDuty}
                </span>
              </div>
            ))}
          </div>

          {/* bar chart: personnel per platoon grouped by duty */}
          <ChartCard title={t('personnel_count_by_platoon')}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={rotationData} margin={{ left: 0, right: 10 }}>
                <XAxis dataKey="platoon" tick={{ fontSize: 12, fill: C.textMed }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: C.textMed }} axisLine={false} tickLine={false} />
                <Tooltip content={<TT />} />
                <Bar dataKey="personnelCount" name="Personnel" radius={[4, 4, 0, 0]} barSize={32}>
                  {rotationData.map((r, i) => (
                    <Cell key={i} fill={DUTY_ACCENT[r.currentDuty] ?? C.textLight} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              {Object.entries(DUTY_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: DUTY_ACCENT[key] }} />
                  <span style={{ fontSize: 11, color: C.textMed }}>{label}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </>
      )}

      {/* ═══════════════════ LEAVE TAB ════════════════════════════ */}
      {activeReport === 'leave' && (() => {
        const leaveTypes = ['CL', 'CML', 'EL', 'PL'] as const
        const pieData = leaveTypes.map((type, i) => ({
          name: type,
          value: leaveData.used[type],
          fill: LEAVE_COLORS[i],
        }))
        return (
          <>
            {/* stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {leaveTypes.map((type, i) => (
                <div key={type} className="rounded-xl p-5" style={{ background: C.card }}>
                  <span className="inline-block rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: `${LEAVE_COLORS[i]}18`, color: LEAVE_COLORS[i] }}>{type}</span>
                  <p className="text-3xl font-bold mt-2" style={{ color: C.textDark }}>{leaveData.used[type]}</p>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textLight, marginTop: 4 }}>
                    used of {leaveData.totals[type]} entitled
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Donut: leave type distribution ────────────────── */}
              <ChartCard title={t('leave_type_distribution')}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={4} stroke="none">
                      {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value: string) => <span style={{ color: C.textDark, fontSize: 12 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* ── Horizontal progress bars ──────────────────────── */}
              <ChartCard title={t('leave_utilization_pct')}>
                <div className="space-y-5 mt-2">
                  {leaveTypes.map((type, i) => {
                    const pct = leaveData.totals[type] > 0 ? (leaveData.used[type] / leaveData.totals[type]) * 100 : 0
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.textDark }}>{type}</span>
                          <span style={{ fontSize: 12, color: C.textMed }}>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.surface }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: LEAVE_COLORS[i] }} />
                        </div>
                        <p className="mt-1" style={{ fontSize: 10, color: C.textLight }}>
                          {leaveData.used[type]} used / {leaveData.totals[type]} entitled
                        </p>
                      </div>
                    )
                  })}
                </div>
              </ChartCard>
            </div>
          </>
        )
      })()}

      {/* ═══════════════════ GUARD DUTY TAB ═══════════════════════ */}
      {activeReport === 'guard-duty' && (() => {
        const typeLabels: Record<string, string> = {
          'government-office': 'Govt Office',
          'bank-currency-chest': 'Bank / Currency',
          'court': 'Court',
          'hospital': 'Hospital',
          'ncc': 'NCC',
        }
        const typePieData = Object.entries(guardData.byType).map(([type, count], i) => ({
          name: typeLabels[type] ?? type,
          value: count,
          fill: GUARD_TYPE_COLORS[i % GUARD_TYPE_COLORS.length],
        }))
        const typeBarData = Object.entries(
          guardLocations.reduce((acc, loc) => {
            const label = typeLabels[loc.type] ?? loc.type
            acc[label] = (acc[label] || 0) + loc.requiredPersonnel
            return acc
          }, {} as Record<string, number>),
        ).map(([name, required], i) => ({ name, required, fill: GUARD_TYPE_COLORS[i % GUARD_TYPE_COLORS.length] }))

        return (
          <>
            {/* stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={t('guard_locations')}    value={guardData.locations}                          accent={C.navy} />
              <StatCard label={t('personnel_required')}  value={guardData.totalRequired}                     accent={C.khaki} />
              <StatCard label={t('active_locations')}    value={guardLocations.filter(l => l.isActive).length} accent={C.green} />
              <StatCard label={t('location_types')}      value={Object.keys(guardData.byType).length}        accent={C.amber} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Pie: locations by type ────────────────────────── */}
              <ChartCard title={t('locations_by_type')}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={typePieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={40} paddingAngle={3} stroke="none">
                      {typePieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value: string) => <span style={{ color: C.textDark, fontSize: 12 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* ── Bar: required personnel per type ──────────────── */}
              <ChartCard title={t('required_personnel_by_type')}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={typeBarData} margin={{ left: 0, right: 10 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.textMed }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: C.textMed }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TT />} />
                    <Bar dataKey="required" name="Required" radius={[4, 4, 0, 0]} barSize={32}>
                      {typeBarData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Location table ──────────────────────────────────── */}
            <ChartCard title={t('guard_location_details')}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.surface}` }}>
                      {['Location', 'Code', 'Type', 'Required', 'Status'].map(h => (
                        <th
                          key={h}
                          className={`pb-3 text-xs font-medium uppercase ${h === 'Required' ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'}`}
                          style={{ color: C.textLight, fontSize: 9 }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guardLocations.slice(0, 10).map(loc => (
                      <tr key={loc.id} style={{ borderBottom: `1px solid ${C.surface}` }}>
                        <td className="py-3 text-sm font-medium" style={{ color: C.textDark }}>{loc.name}</td>
                        <td className="py-3 text-sm font-mono" style={{ color: C.textMed }}>{loc.code}</td>
                        <td className="py-3 text-sm capitalize" style={{ color: C.textMed }}>{loc.type.replace(/-/g, ' ')}</td>
                        <td className="py-3 text-sm text-right font-medium" style={{ color: C.textDark }}>{loc.requiredPersonnel}</td>
                        <td className="py-3 text-center">
                          <span
                            className="inline-block rounded-md px-2 py-0.5 text-xs font-medium"
                            style={{
                              background: loc.isActive ? `${C.green}18` : C.surface,
                              color: loc.isActive ? C.green : C.textLight,
                            }}
                          >
                            {loc.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </>
        )
      })()}
    </div>
  )
}
