import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { rotationService } from '@/services/rotationService'
import { apiGateway } from '@/services/apiGateway'
import { groqService } from '@/services/groqService'
import { mockLLMService } from '@/services/mockLLMService'
import { voiceAssistant } from '@/services/voiceAssistant'
import type { ChatMessage, PlatoonId, RotationalDutyType, Personnel } from '@/types'

export default function HomePage() {
  const { user, role } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported] = useState(() => voiceAssistant.isSupported())
  const [aiModel, setAiModel] = useState<'groq' | 'mock'>('mock')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cycleNumber = useMemo(() => rotationService.getCycleNumber(new Date()), [])
  const cycleDateRange = useMemo(() => rotationService.getCycleDateRange(cycleNumber), [cycleNumber])
  const currentRotation = useMemo(() => rotationService.getCurrentRotation(new Date()), [])

  // Check backend AI connectivity on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:8080/api/health/ai')
        if (res.ok) {
          const data = await res.json()
          if (data.groq) setAiModel('groq')
        }
      } catch { /* Backend not reachable */ }
    })()
  }, [])

  const [dashLoaded, setDashLoaded] = useState(false)
  const [dash, setDash] = useState({
    total: 0, sanctioned: 0, sections: {} as Record<string, number>,
    sickCount: 0, absentCount: 0, onLeaveCount: 0, activeCount: 0, vacancies: 0,
    pendingAdhoc: 0, pendingLeave: 0, guardLocations: 0, vipEscorts: 0, gunmen: 0, rotationSoon: false,
    weeklyOffToday: 0, totalPersonnel: 0, activePersonnel: 0, suspendedPersonnel: 0,
    absentPersonnel: 0, transferredPersonnel: 0, inTraining: 0,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = localStorage.getItem('workboard_access_token')
        const res = await fetch('http://localhost:8080/api/dashboard', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
        if (cancelled || !res.ok) return
        const result = await res.json()
        if (result.success && result.data) {
          const d = result.data
          setDash({
            total: d.presentTotal || 0,
            sanctioned: d.sanctionedTotal || 0,
            sections: d.sectionStrength || {},
            sickCount: d.sickToday || 0,
            absentCount: d.absentToday || 0,
            onLeaveCount: d.onLeaveToday || 0,
            activeCount: d.onDutyToday || 0,
            vacancies: d.vacancies || 0,
            pendingAdhoc: d.adhocPending || 0,
            pendingLeave: d.pendingLeaveRequests || 0,
            guardLocations: d.guardPosts || 0,
            vipEscorts: d.vipEscorts || 0,
            gunmen: d.gunmen || 0,
            rotationSoon: (d.currentRotations || []).length > 0,
            weeklyOffToday: d.weeklyOffToday || 0,
            totalPersonnel: d.totalPersonnel || 0,
            activePersonnel: d.activePersonnel || 0,
            suspendedPersonnel: d.suspendedPersonnel || 0,
            absentPersonnel: d.absentPersonnel || 0,
            transferredPersonnel: d.transferredPersonnel || 0,
            inTraining: d.inTraining || 0,
          })
        }
      } catch (e) { console.error('Dashboard fetch:', e) }
      finally { if (!cancelled) setDashLoaded(true) }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date().toISOString() }])
    setInput(''); setIsLoading(true)
    try {
      const r = await groqService.getResponse(text.trim(), user?.name); setAiModel('groq')
      let displayText = r.text || 'No response'
      let tableData: Record<string, unknown>[] | undefined
      if (r.actionResult?.data && Array.isArray(r.actionResult.data)) {
        const items = r.actionResult.data as Record<string, unknown>[]
        if (items.length > 0) {
          displayText = `Found ${items.length} result${items.length > 1 ? 's' : ''}`
          tableData = items
        } else {
          displayText = 'No records found for your query.'
        }
      }
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: displayText, timestamp: new Date().toISOString(), action: tableData ? { type: r.action || 'query', data: { items: tableData } } : undefined }])
    } catch (groqErr) {
      console.error('[HomePage] Groq failed:', groqErr)
      try {
        const r = await mockLLMService.getResponse(text.trim()); setAiModel('mock')
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: r.text, timestamp: new Date().toISOString(), action: r.action }])
      } catch {
        setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: 'Sorry, I encountered an error.', timestamp: new Date().toISOString() }])
      }
    } finally { setIsLoading(false) }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input) }
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setAttachedFile(f); if (e.target) e.target.value = '' }

  const toggleVoice = () => {
    if (isListening) { voiceAssistant.stopListening(); setIsListening(false); return }
    const started = voiceAssistant.startListening(async (result) => {
      if (result.isFinal) {
        setIsListening(false); setInput(result.transcript)
        if (result.confidence >= 0.8) {
          setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: result.transcript, timestamp: new Date().toISOString() }])
          setInput(''); setIsLoading(true)
          try {
            const r = await voiceAssistant.processVoiceCommand(result.transcript, result.confidence)
            setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: r.text, timestamp: new Date().toISOString(), action: r.action }])
            voiceAssistant.speak(r.text)
          } catch { setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: 'Error processing voice.', timestamp: new Date().toISOString() }]) }
          finally { setIsLoading(false) }
        }
      }
    }, () => setIsListening(false))
    if (started) setIsListening(true)
  }

  const allAssignments = useMemo(() => {
    const a: { platoon: PlatoonId; duty: RotationalDutyType }[] = []
    currentRotation.forEach((duty, platoon) => a.push({ platoon, duty }))
    return a
  }, [currentRotation])

  const fillRate = dash.sanctioned > 0 ? Math.round((dash.total / dash.sanctioned) * 100) : 0
  const isOverstaffed = dash.total > dash.sanctioned

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 90px)' }}>
      <div className="flex flex-col flex-1 min-h-0">
        {/* ═══ CHAT ═══ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[300px]">
          <div className="flex-1 card overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aiModel === 'groq' ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-xs text-[var(--color-text-light)]">{aiModel === 'groq' ? 'AI Connected' : 'AI Not Connected'}</span>
              </div>
              <button onClick={() => { setMessages([]); setAiModel('mock') }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[var(--color-success)] bg-[var(--color-success)]/5 hover:bg-[var(--color-success)]/10 border border-[var(--color-success)]/10 hover:border-[var(--color-success)]/25 transition-all duration-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                {t('new_chat')}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col px-4 lg:px-8 py-6">
                  {/* Header */}
                  <div className="mb-6">
                    <h1 className="text-3xl lg:text-4xl font-light text-[var(--color-text-dark)] leading-tight">
                      {t('welcome_back_comma')} <em className="font-bold not-italic" style={{ fontFamily: 'Georgia, serif' }}>{user?.name?.split(' ').pop() || 'Officer'}.</em>
                    </h1>
                  </div>

                  {/* Status summary — clear statements */}
                  {dashLoaded && (
                    <div className="mb-6 space-y-1.5">
                      {(dash.sickCount > 0 || dash.onLeaveCount > 0 || dash.absentCount > 0) && (
                        <p className="text-sm text-[var(--color-text-medium)]">
                          {dash.sickCount > 0 && <><span className="font-semibold text-red-600">{dash.sickCount}</span> {t('sick_label')}, </>}
                          {dash.onLeaveCount > 0 && <><span className="font-semibold text-amber-600">{dash.onLeaveCount}</span> {t('on_leave_label')}, </>}
                          {dash.absentCount > 0 && <><span className="font-semibold text-gray-500">{dash.absentCount}</span> {t('absent_label')}, </>}
                          {dash.pendingLeave > 0 && <><span className="font-semibold text-orange-600">{dash.pendingLeave}</span> {t('leave_requests_awaiting')}.</>}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Role-based metrics */}
                  {dashLoaded && role === 'admin' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {/* Personnel Status — donut + list side by side */}
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid var(--color-border)', animationDelay: '0ms', animationFillMode: 'both' }}>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-3">Personnel Overview — {dash.totalPersonnel || dash.total} Members</div>
                        <div className="flex items-center justify-center gap-8 py-2 px-4">
                          {/* Donut */}
                          <div className="relative flex-shrink-0" style={{ width: 110, height: 110 }}>
                            {(() => {
                              const total = dash.totalPersonnel || dash.total || 1
                              const active = dash.activePersonnel || 0
                              const onLeave = dash.onLeaveCount || 0
                              const suspended = dash.suspendedPersonnel || 0
                              const training = dash.inTraining || 0
                              const absent = dash.absentPersonnel || 0
                              const activePct = Math.round((active / total) * 100)
                              const r = 42, c = 2 * Math.PI * r
                              const segments = [
                                { pct: active / total, color: '#2D5A27' },
                                { pct: onLeave / total, color: '#FFC107' },
                                { pct: suspended / total, color: '#ba1a1a' },
                                { pct: training / total, color: '#8B5CF6' },
                                { pct: absent / total, color: '#8a8d8d' },
                              ]
                              let offset = 0
                              return (
                                <svg viewBox="0 0 100 100" className="w-full h-full" style={{ shapeRendering: 'geometricPrecision' }}>
                                  <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="7" />
                                  {segments.map((seg, i) => {
                                    if (seg.pct <= 0) { return null }
                                    const d = seg.pct * c
                                    const gap = c - d
                                    const el = <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${d} ${gap}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" />
                                    offset += d
                                    return el
                                  })}
                                  <text x="50" y="47" textAnchor="middle" fill="var(--color-primary)" style={{ fontSize: '16px', fontWeight: 700 }}>{activePct}%</text>
                                  <text x="50" y="59" textAnchor="middle" fill="var(--color-text-light)" style={{ fontSize: '7px' }}>active</text>
                                </svg>
                              )
                            })()}
                          </div>
                          {/* Status list */}
                          <div className="space-y-2 min-w-[140px]">
                            {[
                              { label: 'Active', value: dash.activePersonnel || 0, color: '#2D5A27' },
                              { label: 'On Leave', value: dash.onLeaveCount || 0, color: '#FFC107' },
                              { label: 'Suspended', value: dash.suspendedPersonnel || 0, color: '#ba1a1a' },
                              { label: 'Training', value: dash.inTraining || 0, color: '#8B5CF6' },
                              { label: 'Absent', value: dash.absentPersonnel || 0, color: '#8a8d8d' },
                            ].map(s => (
                              <div key={s.label} className="flex items-center gap-2.5">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                <span className="text-[11px] text-[var(--color-text-medium)] flex-1">{s.label}</span>
                                <span className="text-[12px] font-semibold text-[var(--color-text-dark)]">{s.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Platoon Assignments — grid */}
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid var(--color-border)', animationDelay: '150ms', animationFillMode: 'both' }}>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-3">Platoon Assignments — Cycle {cycleNumber} ({new Date(cycleDateRange.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {new Date(cycleDateRange.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})</div>
                        <div className="grid grid-cols-2 gap-2">
                          {allAssignments.map(({ platoon, duty }) => (
                            <button
                              key={platoon}
                              onClick={() => navigate(`/schedule/platoon/${platoon}`)}
                              className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--color-bg-main)] hover:bg-[var(--color-bg-secondary)] border border-transparent hover:border-[var(--color-primary)]/20 transition-all cursor-pointer text-left"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm group-hover:scale-105 transition-transform" style={{ backgroundColor: rotationService.getDutyTypeColor(duty) }}>
                                {platoon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-[var(--color-text-dark)] truncate group-hover:text-[var(--color-primary)] transition-colors">{rotationService.getDutyTypeDisplayName(duty)}</p>
                              </div>
                              <svg className="w-3 h-3 text-[var(--color-text-light)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : dashLoaded && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {/* My Current Schedule */}
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid var(--color-border)', animationDelay: '0ms', animationFillMode: 'both' }}>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-3">{t('current_duty_card')}</div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-border)' }}>
                            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-dark)]">{t('guard_i_duty')}</p>
                            <p className="text-[10px] text-[var(--color-text-light)]">{t('commissioner_office')}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--color-text-light)]">{t('platoon')}</span>
                            <span className="font-medium text-[var(--color-text-dark)]">Platoon-I</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--color-text-light)]">{t('shift_label')}</span>
                            <span className="font-medium text-[var(--color-text-dark)]">06:00 - 14:00</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--color-text-light)]">{t('team_size')}</span>
                            <span className="font-medium text-[var(--color-text-dark)]">12 {t('personnel_unit')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Upcoming Schedule */}
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid var(--color-border)', animationDelay: '150ms', animationFillMode: 'both' }}>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-3">{t('upcoming_schedule_card')}</div>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="w-1 h-8 rounded-full bg-[#000080]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-[var(--color-text-dark)]">{t('guard_ii_rotation')}</p>
                              <p className="text-[9px] text-[var(--color-text-light)]">{t('next_cycle')} &bull; {t('district_treasury')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="w-1 h-8 rounded-full bg-[#FFC107]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-[var(--color-text-dark)]">{t('check_point_duty')}</p>
                              <p className="text-[9px] text-[var(--color-text-light)]">{t('cycle')} {cycleNumber + 2} &bull; {t('nh75_toll')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="w-1 h-8 rounded-full bg-[#2D5A27]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium text-[var(--color-text-dark)]">{t('striking_force_label')}</p>
                              <p className="text-[9px] text-[var(--color-text-light)]">{t('cycle')} {cycleNumber + 3} &bull; {t('cc_room')}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* My Leave & Status */}
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid var(--color-border)', animationDelay: '300ms', animationFillMode: 'both' }}>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-3">{t('leave_balance_card')}</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[var(--color-text-medium)]">{t('casual_leave_cl')}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-[var(--color-bg-tertiary)]"><div className="h-full rounded-full bg-[#000080]" style={{ width: '60%' }} /></div>
                              <span className="text-[10px] font-semibold text-[var(--color-text-dark)] w-8 text-right">6/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[var(--color-text-medium)]">{t('earned_leave_el')}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-[var(--color-bg-tertiary)]"><div className="h-full rounded-full bg-[#6b5c42]" style={{ width: '80%' }} /></div>
                              <span className="text-[10px] font-semibold text-[var(--color-text-dark)] w-8 text-right">24/30</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[var(--color-text-medium)]">{t('medical_cml')}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-[var(--color-bg-tertiary)]"><div className="h-full rounded-full bg-[#2D5A27]" style={{ width: '100%' }} /></div>
                              <span className="text-[10px] font-semibold text-[var(--color-text-dark)] w-8 text-right">5/5</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[var(--color-text-light)]">{t('next_scheduled_leave_label')}</span>
                            <span className="font-medium text-[var(--color-text-dark)]">{t('none_planned_label')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Critical alert */}
                  {dashLoaded && (dash.sickCount > 0 || dash.pendingAdhoc > 0 || dash.rotationSoon) && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50/60 border border-red-200/50">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-900">{t('attention_required')}</p>
                        <p className="text-xs text-red-700">
                          {[dash.sickCount > 0 && `${dash.sickCount} ${t('personnel_reported_sick')}`, dash.pendingAdhoc > 0 && `${dash.pendingAdhoc} ${t('adhoc_awaiting_approval')}`, dash.rotationSoon && t('rotation_handover_48h')].filter(Boolean).join(' \u00B7 ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%]">
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-5 h-5 bg-[var(--color-secondary)] rounded-md flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <span className="text-[10px] text-[var(--color-text-light)] font-medium">{t('assistant')}</span>
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[var(--color-primary)] text-white rounded-br-md' : 'bg-[var(--color-bg-main)] text-[var(--color-text-dark)] rounded-tl-md'}`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.action?.data?.items && Array.isArray(msg.action.data.items) && (msg.action.data.items as Record<string, unknown>[]).length > 0 && (() => {
                            const items = msg.action!.data.items as Record<string, unknown>[]
                            const cols = ['name', 'designation', 'badgeNumber', 'status', 'dutyName', 'section'].filter(c => items.some(it => it[c]))
                            const colLabels: Record<string, string> = { name: 'Name', designation: 'Rank', badgeNumber: 'Badge', status: 'Status', dutyName: 'Duty', section: 'Section' }
                            return (
                              <div className="mt-2 overflow-x-auto rounded-lg border border-[var(--color-border)]">
                                <table className="w-full text-[11px]">
                                  <thead>
                                    <tr className="bg-[var(--color-bg-secondary)]">
                                      <th className="px-2 py-1.5 text-left font-semibold text-[var(--color-text-light)]">#</th>
                                      {cols.map(c => <th key={c} className="px-2 py-1.5 text-left font-semibold text-[var(--color-text-light)]">{colLabels[c] || c}</th>)}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((item, i) => (
                                      <tr key={i} className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]/50">
                                        <td className="px-2 py-1.5 text-[var(--color-text-light)]">{i + 1}</td>
                                        {cols.map(c => (
                                          <td key={c} className="px-2 py-1.5 text-[var(--color-text-dark)]">
                                            {c === 'status' ? (
                                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${String(item[c]).toUpperCase() === 'ACTIVE' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>{String(item[c])}</span>
                                            ) : String(item[c] ?? '')}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )
                          })()}
                          {msg.action && !msg.action.data?.items && <button className="mt-2 text-xs underline opacity-80 hover:opacity-100">Execute: {msg.action.type}</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[var(--color-bg-main)] rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-[var(--color-text-light)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-[var(--color-text-light)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-[var(--color-text-light)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-[var(--color-border)]">
              <form onSubmit={handleSubmit} className="w-full">
                {attachedFile && (
                  <div className="mb-2">
                    <div className="inline-flex items-center gap-2 bg-[var(--color-success)]/5 border border-[var(--color-success)]/15 rounded-lg px-3 py-1.5 text-xs text-[var(--color-success)]">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="truncate max-w-[180px] font-medium">{attachedFile.name}</span>
                      <button type="button" onClick={() => setAttachedFile(null)} className="ml-1 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  </div>
                )}
                <div className="relative flex items-center bg-[var(--color-bg-main)] rounded-2xl border border-[var(--color-border)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus-within:shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all px-3 py-2">
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" onChange={handleFileSelect} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 p-1.5 text-[var(--color-text-light)]/40 hover:text-[var(--color-success)] rounded-lg transition-colors" title={t('attach_file')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={isListening ? t('listening') : t('awaiting_command')}
                    className="flex-1 resize-none bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)]/40 focus:outline-none py-1.5 px-3 max-h-28 leading-relaxed min-h-[36px]"
                    rows={1} disabled={isLoading || isListening} />
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {voiceSupported && (
                      <button type="button" onClick={toggleVoice} className={`p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-[var(--color-text-light)]/40 hover:text-[var(--color-success)]'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      </button>
                    )}
                    <button type="submit" disabled={!input.trim() || isLoading}
                      className="p-2.5 bg-[var(--color-success)] hover:bg-[var(--color-success)] disabled:bg-[var(--color-border)] text-white rounded-xl transition-all disabled:cursor-not-allowed">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
