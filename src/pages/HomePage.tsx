import { useState, useRef, useEffect, useMemo } from 'react'
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

  // Check Groq connectivity on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer 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` },
        })
        if (res.ok) setAiModel('groq')
      } catch { /* Groq not reachable */ }
    })()
  }, [])

  const [dashLoaded, setDashLoaded] = useState(false)
  const [dash, setDash] = useState({
    total: 572, sanctioned: 559, sections: { A: 74, B: 67, C: 277, PMT: 111, RECRUIT: 24 } as Record<string, number>,
    sickCount: 0, absentCount: 0, onLeaveCount: 0, activeCount: 0, vacancies: 7,
    pendingAdhoc: 0, pendingLeave: 0, guardLocations: 0, vipEscorts: 0, gunmen: 0, rotationSoon: false,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [pRes, sRes, aRes, plRes, gRes, vRes, gmRes] = await Promise.all([
          apiGateway.getAllPersonnel(), apiGateway.getStrengthSummary(), apiGateway.getAdhocRequests(),
          apiGateway.getPendingKPLeaveRequests(), apiGateway.getActiveGuardLocations(),
          apiGateway.getActiveVIPEscorts(), apiGateway.getActiveGunmanAssignments(),
        ])
        if (cancelled) return
        const personnel = (pRes.data || []) as Personnel[]
        const strength = sRes.data
        const sections: Record<string, number> = { A: 0, B: 0, C: 0, PMT: 0, RECRUIT: 0 }
        let sickCount = 0, absentCount = 0, onLeaveCount = 0, activeCount = 0
        for (const p of personnel) {
          if (sections[p.section] !== undefined) sections[p.section]++
          if (p.status === 'sick') sickCount++
          else if (p.status === 'absent') absentCount++
          else if (p.status === 'on-leave') onLeaveCount++
          else if (p.status === 'active') activeCount++
        }
        const now = new Date()
        const nextRot = rotationService.getNextRotationDate(now)
        const hrsUntil = (nextRot.getTime() - now.getTime()) / 3600000
        setDash({
          total: personnel.length || 572, sanctioned: strength?.totalSanctioned ?? 559,
          sections, sickCount, absentCount, onLeaveCount, activeCount, vacancies: strength?.totalVacancy ?? 7,
          pendingAdhoc: (aRes.data || []).filter(r => r.status === 'pending').length,
          pendingLeave: (plRes.data || []).length,
          guardLocations: (gRes.data || []).length, vipEscorts: (vRes.data || []).length,
          gunmen: (gmRes.data || []).length, rotationSoon: hrsUntil <= 48 && hrsUntil > 0,
        })
      } catch (e) { console.error('Dashboard fetch:', e) }
      finally { if (!cancelled) setDashLoaded(true) }
    })()
    return () => { cancelled = true }
  }, [currentRotation])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date().toISOString() }])
    setInput(''); setIsLoading(true)
    try {
      const r = await groqService.getResponse(text.trim(), user?.name); setAiModel('groq')
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: r.text, timestamp: new Date().toISOString() }])
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

  const fillRate = dash.total > 0 ? Math.round((dash.total / dash.sanctioned) * 100) : 99

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 90px)' }}>
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* ═══ CHAT ═══ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[300px] lg:min-h-0">
          <div className="flex-1 card overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aiModel === 'groq' ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-xs text-[var(--color-text-light)]">{aiModel === 'groq' ? 'AI Connected' : 'AI Not Connected'}</span>
              </div>
              <button onClick={() => { setMessages([]); setAiModel('mock') }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#1B4D3E] bg-[#1B4D3E]/5 hover:bg-[#1B4D3E]/10 border border-[#1B4D3E]/10 hover:border-[#1B4D3E]/25 transition-all duration-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                {t('new_chat')}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col px-4 lg:px-8 py-6">
                  {/* Header */}
                  <div className="mb-6">
                    <h1 className="text-3xl lg:text-4xl font-light text-[#1a2e2a] leading-tight">
                      {t('welcome_back_comma')} <em className="font-bold not-italic" style={{ fontFamily: 'Georgia, serif' }}>{user?.name?.split(' ').pop() || 'Officer'}.</em>
                    </h1>
                  </div>

                  {/* Status summary — clear statements */}
                  {dashLoaded && (
                    <div className="mb-6 space-y-1.5">
                      <p className="text-sm text-[var(--color-text-medium)]">
                        <span className="font-semibold text-[#1a2e2a]">{dash.total}</span> {t('of')} <span className="font-semibold text-[#1a2e2a]">{dash.sanctioned}</span> {t('sanctioned_short')} {t('personnel_unit')} {t('present_label')} &mdash; <span className="font-semibold text-[#1B4D3E]">{fillRate}% {t('staffed')}</span>.
                      </p>
                      <p className="text-sm text-[var(--color-text-medium)]">
                        {t('rotation_cycle_active').replace('{0}', String(cycleNumber))} ({new Date(cycleDateRange.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} &ndash; {new Date(cycleDateRange.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}).
                        {dash.rotationSoon && <span className="text-amber-600 font-semibold"> {t('next_rotation_48h')}</span>}
                      </p>
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {/* Staffing Ring */}
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid rgba(0,0,128,0.06)', animationDelay: '0ms', animationFillMode: 'both' }}>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-2">{t('staffing_rate')}</div>
                        <div className="relative w-full" style={{ height: 100 }}>
                          <svg viewBox="0 0 120 120" className="w-full h-full">
                            <circle cx="60" cy="60" r="46" fill="none" stroke="#e8e8ec" strokeWidth="8" />
                            <circle cx="60" cy="60" r="46" fill="none" stroke="#000080" strokeWidth="8"
                              strokeDasharray={`${2 * Math.PI * 46}`} strokeDashoffset={`${2 * Math.PI * 46 * (1 - fillRate / 100)}`}
                              strokeLinecap="round" transform="rotate(-90 60 60)" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-[#000080]">{fillRate}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-[var(--color-text-light)] mt-2">
                          <span>{dash.total} {t('present_label')}</span>
                          <span>{dash.sanctioned} {t('sanctioned_short')}</span>
                        </div>
                      </div>

                      {/* Section Breakdown — horizontal bars */}
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid rgba(0,0,128,0.06)', animationDelay: '150ms', animationFillMode: 'both' }}>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-3">{t('section_strength')}</div>
                        <div className="space-y-2">
                          {[
                            { label: t('a_div'), value: dash.sections.A || 74, max: 74, color: '#000080' },
                            { label: t('b_div'), value: dash.sections.B || 67, max: 67, color: '#6b5c42' },
                            { label: t('c_div'), value: dash.sections.C || 277, max: 277, color: '#2D5A27' },
                            { label: 'PMT', value: dash.sections.PMT || 111, max: 111, color: '#FFC107' },
                            { label: t('training'), value: dash.sections.RECRUIT || 24, max: 24, color: '#ba1a1a' },
                          ].map(s => (
                            <div key={s.label}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] text-[var(--color-text-medium)]">{s.label}</span>
                                <span className="text-[10px] font-semibold text-[var(--color-text-dark)]">{s.value}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[#e8e8ec]">
                                <div className="h-full rounded-full transition-all" style={{ width: `${(s.value / s.max) * 100}%`, backgroundColor: s.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Operational Overview */}
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid rgba(0,0,128,0.06)', animationDelay: '300ms', animationFillMode: 'both' }}>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-3">{t('operations')}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 rounded-xl bg-[var(--color-bg-secondary)] text-center">
                            <p className="text-lg font-bold text-[#000080]">{dash.guardLocations}</p>
                            <p className="text-[8px] uppercase text-[var(--color-text-light)] font-medium">{t('guard_posts')}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[var(--color-bg-secondary)] text-center">
                            <p className="text-lg font-bold text-[#6b5c42]">{dash.vipEscorts}</p>
                            <p className="text-[8px] uppercase text-[var(--color-text-light)] font-medium">{t('vip_escorts')}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[var(--color-bg-secondary)] text-center">
                            <p className="text-lg font-bold text-[#2D5A27]">{dash.gunmen}</p>
                            <p className="text-[8px] uppercase text-[var(--color-text-light)] font-medium">{t('gunmen')}</p>
                          </div>
                          <div className="p-2.5 rounded-xl text-center" style={{ background: dash.pendingAdhoc > 0 ? 'rgba(186,26,26,0.04)' : 'var(--color-bg-secondary)' }}>
                            <p className={`text-lg font-bold ${dash.pendingAdhoc > 0 ? 'text-[#ba1a1a]' : 'text-[var(--color-text-dark)]'}`}>{dash.pendingAdhoc}</p>
                            <p className="text-[8px] uppercase text-[var(--color-text-light)] font-medium">{t('adhoc_pending')}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-2 flex items-center justify-between text-[10px]" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                          <span className="text-[var(--color-text-light)]">{t('vacancy_label')}</span>
                          <span className="font-semibold text-[#ba1a1a]">{dash.vacancies} {t('positions')}</span>
                        </div>
                      </div>
                    </div>
                  ) : dashLoaded && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {/* My Current Schedule */}
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid rgba(0,0,128,0.06)', animationDelay: '0ms', animationFillMode: 'both' }}>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-3">{t('current_duty_card')}</div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,0,128,0.06)' }}>
                            <svg className="w-5 h-5 text-[#000080]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
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
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid rgba(0,0,128,0.06)', animationDelay: '150ms', animationFillMode: 'both' }}>
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
                      <div className="p-4 rounded-2xl bg-[var(--color-bg-card)] animate-fade-in-up" style={{ border: '1px solid rgba(0,0,128,0.06)', animationDelay: '300ms', animationFillMode: 'both' }}>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-3">{t('leave_balance_card')}</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[var(--color-text-medium)]">{t('casual_leave_cl')}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-[#e8e8ec]"><div className="h-full rounded-full bg-[#000080]" style={{ width: '60%' }} /></div>
                              <span className="text-[10px] font-semibold text-[var(--color-text-dark)] w-8 text-right">6/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[var(--color-text-medium)]">{t('earned_leave_el')}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-[#e8e8ec]"><div className="h-full rounded-full bg-[#6b5c42]" style={{ width: '80%' }} /></div>
                              <span className="text-[10px] font-semibold text-[var(--color-text-dark)] w-8 text-right">24/30</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[var(--color-text-medium)]">{t('medical_cml')}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-[#e8e8ec]"><div className="h-full rounded-full bg-[#2D5A27]" style={{ width: '100%' }} /></div>
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
                          {msg.action && <button className="mt-2 text-xs underline opacity-80 hover:opacity-100">Execute: {msg.action.type}</button>}
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
                    <div className="inline-flex items-center gap-2 bg-[#1B4D3E]/5 border border-[#1B4D3E]/15 rounded-lg px-3 py-1.5 text-xs text-[#1B4D3E]">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="truncate max-w-[180px] font-medium">{attachedFile.name}</span>
                      <button type="button" onClick={() => setAttachedFile(null)} className="ml-1 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  </div>
                )}
                <div className="relative flex items-center bg-[var(--color-bg-main)] rounded-2xl border border-[var(--color-border)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus-within:shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all px-3 py-2">
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" onChange={handleFileSelect} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 p-1.5 text-[var(--color-text-light)]/40 hover:text-[#1B4D3E] rounded-lg transition-colors" title={t('attach_file')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={isListening ? t('listening') : t('awaiting_command')}
                    className="flex-1 resize-none bg-transparent text-sm text-[#1a2e2a] placeholder-[var(--color-text-light)]/40 focus:outline-none py-1.5 px-3 max-h-28 leading-relaxed min-h-[36px]"
                    rows={1} disabled={isLoading || isListening} />
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {voiceSupported && (
                      <button type="button" onClick={toggleVoice} className={`p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-[var(--color-text-light)]/40 hover:text-[#1B4D3E]'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      </button>
                    )}
                    <button type="submit" disabled={!input.trim() || isLoading}
                      className="p-2.5 bg-[#1B4D3E] hover:bg-[#163f33] disabled:bg-[var(--color-border)] text-white rounded-xl transition-all disabled:cursor-not-allowed">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ═══ SIDEBAR ═══ */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-3 overflow-y-auto">
          <div className="card bg-[var(--color-primary)] text-white p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-80">{t('current_cycle')}</span>
              <span className="text-lg font-bold">{cycleNumber}</span>
            </div>
            <div className="text-xs opacity-80">{new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &ndash; {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </div>
          <div className="card rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-2">{t('strength_overview')}</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center"><div className="text-lg font-bold text-[var(--color-text-dark)]">{dash.total}</div><div className="text-[8px] uppercase text-[var(--color-text-light)]">{t('present')}</div></div>
              <div className="text-center"><div className="text-lg font-bold text-[var(--color-text-dark)]">{dash.sanctioned}</div><div className="text-[8px] uppercase text-[var(--color-text-light)]">{t('sanctioned')}</div></div>
              <div className="text-center"><div className="text-lg font-bold text-red-600">{dash.vacancies}</div><div className="text-[8px] uppercase text-[var(--color-text-light)]">{t('vacancy')}</div></div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[var(--color-border)]">
              {[{ l: 'A', v: dash.sections.A }, { l: 'B', v: dash.sections.B }, { l: 'C', v: dash.sections.C }, { l: 'PMT', v: dash.sections.PMT }, { l: 'REC', v: dash.sections.RECRUIT }].map(s => (
                <div key={s.l} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-bg-main)] text-[9px] font-medium text-[var(--color-text-medium)]"><span className="font-bold text-[var(--color-text-dark)]">{s.v}</span> {s.l}</div>
              ))}
            </div>
          </div>
          <div className="card rounded-xl">
            <div className="p-3 border-b border-[var(--color-border)]"><h3 className="text-sm font-semibold text-[var(--color-text-dark)]">{t('todays_assignments')}</h3></div>
            <div className="p-3 space-y-2">
              {allAssignments.map(({ platoon, duty }) => (
                <div key={platoon} className="flex items-center gap-3 py-0.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: rotationService.getDutyTypeColor(duty) }}>{platoon}</div>
                  <span className="text-xs text-[var(--color-text-dark)]">{rotationService.getDutyTypeDisplayName(duty)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-2">{t('active_deployments')}</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-1.5 rounded-lg bg-[var(--color-bg-main)]"><div className="text-base font-bold text-[var(--color-text-dark)]">{dash.guardLocations}</div><div className="text-[7px] uppercase text-[var(--color-text-light)] font-medium">{t('guards')}</div></div>
              <div className="text-center p-1.5 rounded-lg bg-[var(--color-bg-main)]"><div className="text-base font-bold text-[var(--color-text-dark)]">{dash.vipEscorts}</div><div className="text-[7px] uppercase text-[var(--color-text-light)] font-medium">{t('vip_escort')}</div></div>
              <div className="text-center p-1.5 rounded-lg bg-[var(--color-bg-main)]"><div className="text-base font-bold text-[var(--color-text-dark)]">{dash.gunmen}</div><div className="text-[7px] uppercase text-[var(--color-text-light)] font-medium">{t('gunmen')}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
