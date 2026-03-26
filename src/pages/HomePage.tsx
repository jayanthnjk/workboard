import { useState, useRef, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { rotationService } from '@/services/rotationService'
import { groqService } from '@/services/groqService'
import { mockLLMService } from '@/services/mockLLMService'
import { voiceAssistant } from '@/services/voiceAssistant'
import type { ChatMessage, PlatoonId, RotationalDutyType } from '@/types'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const suggestions = [
  { label: 'Show my schedule', icon: '📅' },
  { label: 'Request time off', icon: '🏖️' },
  { label: 'Who is working?', icon: '👥' },
  { label: 'Pending requests', icon: '📋' },
]

export default function HomePage() {
  const { user } = useAuth()
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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: text.trim(), timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    try {
      const response = await groqService.getResponse(text.trim(), user?.name)
      setAiModel('groq')
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: response.text, timestamp: new Date().toISOString() }])
    } catch {
      try {
        const response = await mockLLMService.getResponse(text.trim())
        setAiModel('mock')
        setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: response.text, timestamp: new Date().toISOString(), action: response.action }])
      } catch {
        setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: 'Sorry, I encountered an error.', timestamp: new Date().toISOString() }])
      }
    } finally { setIsLoading(false) }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input) }
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setAttachedFile(f); if (e.target) e.target.value = '' }

  const toggleVoice = () => {
    if (isListening) { voiceAssistant.stopListening(); setIsListening(false) }
    else {
      const started = voiceAssistant.startListening(async (result) => {
        if (result.isFinal) {
          setIsListening(false); setInput(result.transcript)
          if (result.confidence >= 0.8) {
            setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: result.transcript, timestamp: new Date().toISOString() }])
            setInput(''); setIsLoading(true)
            try {
              const response = await voiceAssistant.processVoiceCommand(result.transcript, result.confidence)
              setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: response.text, timestamp: new Date().toISOString(), action: response.action }])
              voiceAssistant.speak(response.text)
            } catch { setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: 'Error processing voice.', timestamp: new Date().toISOString() }]) }
            finally { setIsLoading(false) }
          }
        }
      }, () => setIsListening(false))
      if (started) setIsListening(true)
    }
  }

  const getPlatoonAssignments = (): { platoon: PlatoonId; duty: RotationalDutyType }[] => {
    const a: { platoon: PlatoonId; duty: RotationalDutyType }[] = []
    currentRotation.forEach((duty, platoon) => a.push({ platoon, duty }))
    return a.slice(0, 3)
  }

  const recentActivity = [
    { text: 'Leave approved for AHC-127', time: '2 hours ago' },
    { text: 'Shift swap completed', time: '5 hours ago' },
    { text: 'New schedule published', time: '1 day ago' },
  ]

  // ─── Input bar ───
  const InputBar = () => (
    <form onSubmit={handleSubmit} className="w-full">
      {attachedFile && (
        <div className="mb-2 px-2">
          <div className="inline-flex items-center gap-2 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg px-3 py-1.5 text-xs text-[var(--color-primary)]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="truncate max-w-[180px] font-medium">{attachedFile.name}</span>
            <button type="button" onClick={() => setAttachedFile(null)} className="ml-1 hover:text-red-500 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
      <div className="relative flex items-center bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] focus-within:border-[var(--color-primary)]/40 focus-within:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,99,102,241),0.08)] transition-all duration-200 px-2 py-1.5">
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" onChange={handleFileSelect} />

        {/* Attach */}
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 p-2 hover:bg-[var(--color-bg-main)] text-[var(--color-text-light)] hover:text-[var(--color-primary)] rounded-lg transition-all" title={t('attach_file')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </button>

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? t('listening') : t('ask_anything')}
          className="flex-1 resize-none bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)]/60 focus:outline-none py-2 px-2 max-h-28 leading-relaxed min-h-[36px]"
          rows={1}
          disabled={isLoading || isListening}
        />

        {/* Right actions */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isListening
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/25 animate-pulse'
                  : 'hover:bg-[var(--color-bg-main)] text-[var(--color-text-light)] hover:text-[var(--color-text-medium)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-border)] disabled:text-[var(--color-text-light)] text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed shadow-sm shadow-[var(--color-primary)]/20 hover:shadow-md hover:shadow-[var(--color-primary)]/30"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
          </button>
        </div>
      </div>
    </form>
  )

  // ─── Chat view ───
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 90px)' }}>
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[300px] lg:min-h-0">
          <div className="flex-1 card overflow-hidden flex flex-col">
            {/* Status bar */}
            <div className="px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aiModel === 'groq' ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-xs text-[var(--color-text-light)]">{aiModel === 'groq' ? t('llama_via_groq') : t('mock_data')}</span>
              </div>
              <button
                onClick={() => { setMessages([]); setAiModel('mock') }}
                className="text-[10px] text-[var(--color-text-light)] hover:text-[var(--color-text-medium)] transition-colors"
              >
                New chat
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center h-full">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center mb-5 shadow-lg shadow-[var(--color-primary)]/15">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--color-text-dark)] mb-1">
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
                  </h2>
                  <p className="text-sm text-[var(--color-text-light)] mb-6">
                    How can I help you with your schedule today?
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 max-w-sm w-full">
                    {suggestions.map(s => (
                      <button
                        key={s.label}
                        onClick={() => sendMessage(s.label)}
                        className="flex items-center gap-2.5 px-3.5 py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all text-left group"
                      >
                        <span className="text-base">{s.icon}</span>
                        <span className="text-[12px] font-medium text-[var(--color-text-dark)] group-hover:text-[var(--color-primary)] transition-colors">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(message => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%]">
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 bg-[var(--color-secondary)] rounded-md flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-[var(--color-text-light)] font-medium">{t('assistant')}</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-[var(--color-primary)] text-white rounded-br-md'
                        : 'bg-[var(--color-bg-main)] text-[var(--color-text-dark)] rounded-tl-md'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.action && (
                        <button className="mt-2 text-xs underline opacity-80 hover:opacity-100">
                          Execute: {message.action.type}
                        </button>
                      )}
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

            {/* Input */}
            <div className="p-3 border-t border-[var(--color-border)]">
              <InputBar />
            </div>
          </div>
        </div>

        {/* Sidebar cards */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          {/* Cycle card */}
          <div className="card bg-[var(--color-primary)] text-white p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-80">{t('current_cycle')}</span>
              <span className="text-lg font-bold">{cycleNumber}</span>
            </div>
            <div className="text-xs opacity-80">
              {new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Today's assignments */}
          <div className="card rounded-xl">
            <div className="p-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">{t('todays_assignments')}</h3>
            </div>
            <div className="p-3 space-y-2">
              {getPlatoonAssignments().map(({ platoon, duty }) => (
                <div key={platoon} className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: rotationService.getDutyTypeColor(duty) }}>
                    {platoon}
                  </div>
                  <span className="text-sm text-[var(--color-text-dark)]">{rotationService.getDutyTypeDisplayName(duty)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card rounded-xl">
            <div className="p-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-dark)]">{t('recent_activity')}</h3>
            </div>
            <div className="p-3 space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-secondary)] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--color-text-dark)]">{a.text}</p>
                    <p className="text-[10px] text-[var(--color-text-light)]">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
