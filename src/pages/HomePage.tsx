import { useState, useRef, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { rotationService } from '@/services/rotationService'
import { groqService } from '@/services/groqService'
import { mockLLMService } from '@/services/mockLLMService'
import { voiceAssistant } from '@/services/voiceAssistant'
import type { ChatMessage, PlatoonId, RotationalDutyType } from '@/types'

export default function HomePage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'welcome', role: 'assistant', content: 'Hello! I\'m your Workboard assistant. How can I help you today?', timestamp: new Date().toISOString() }])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    try {
      // Try Groq (Llama) first
      const response = await groqService.getResponse(input.trim(), user?.name)
      setAiModel('groq')
      setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: response.text, timestamp: new Date().toISOString() }])
    } catch {
      // Fallback to mock data
      try {
        const response = await mockLLMService.getResponse(input.trim())
        setAiModel('mock')
        setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: response.text, timestamp: new Date().toISOString(), action: response.action }])
      } catch {
        setMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'assistant', content: 'Sorry, I encountered an error.', timestamp: new Date().toISOString() }])
      }
    }
    finally { setIsLoading(false) }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
    if (e.target) e.target.value = ''
  }

  const removeAttachedFile = () => setAttachedFile(null)

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

  const recentActivity = [{ text: 'Leave approved for AHC-127', time: '2 hours ago' }, { text: 'Shift swap completed', time: '5 hours ago' }, { text: 'New schedule published', time: '1 day ago' }]
  const getPlatoonAssignments = (): { platoon: PlatoonId; duty: RotationalDutyType }[] => { const a: { platoon: PlatoonId; duty: RotationalDutyType }[] = []; currentRotation.forEach((duty, platoon) => a.push({ platoon, duty })); return a.slice(0, 3) }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 90px)' }}>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-[var(--color-text-dark)]">{t('welcome_back')}, {user?.name || 'User'}</h1>
        <p className="text-sm text-[var(--color-text-medium)]">{t('here_is_what_is_happening')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 min-h-[300px] lg:min-h-0">
          <div className="flex-1 card overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${aiModel === 'groq' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <span className="text-xs text-[var(--color-text-light)]">{aiModel === 'groq' ? t('llama_via_groq') : t('mock_data')}</span>
              </div>
              <span className="text-[10px] text-[var(--color-text-light)]">{aiModel === 'groq' ? t('groq_connected') : t('groq_fallback')}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              <div className="space-y-3">
                {messages.map((message) => (
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
                      <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'bg-[var(--color-primary)] text-white rounded-br-sm' : 'bg-[var(--color-bg-main)] text-[var(--color-text-dark)] rounded-tl-sm'}`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.action && <button className="mt-2 text-xs underline opacity-80 hover:opacity-100">Execute: {message.action.type}</button>}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--color-bg-main)] rounded-xl rounded-tl-sm px-3 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[var(--color-text-light)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[var(--color-text-light)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[var(--color-text-light)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {messages.length <= 2 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {[t('sug_schedule'), t('sug_leave'), t('sug_roster'), t('sug_pending')].map((suggestion, idx) => (
                      <button key={idx} onClick={() => handleSuggestionClick(suggestion)} className="px-3 py-1.5 text-xs bg-[var(--color-bg-main)] hover:bg-[var(--color-border)] text-[var(--color-text-medium)] rounded-full border border-[var(--color-border)] transition-colors">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--color-border)]">
              {attachedFile && (
                <div className="mb-2 flex items-center gap-2 px-2">
                  <div className="flex items-center gap-2 bg-[var(--color-bg-main)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-medium)]">
                    <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                    <button type="button" onClick={removeAttachedFile} className="text-[var(--color-text-light)] hover:text-red-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2 bg-[var(--color-bg-main)] rounded-xl border border-[var(--color-border)] p-2">
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" onChange={handleFileSelect} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-[var(--color-border)] text-[var(--color-text-light)] rounded-lg transition-colors" title={t('attach_file')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isListening ? t('listening') : t('ask_anything')} className="flex-1 resize-none bg-transparent text-sm text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] focus:outline-none max-h-20" rows={1} disabled={isLoading || isListening} />
                <div className="flex items-center gap-1">
                  {voiceSupported && (
                    <button type="button" onClick={toggleVoice} className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-[var(--color-border)] text-[var(--color-text-light)]'}`} title={isListening ? 'Stop' : 'Voice'}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </button>
                  )}
                  <button type="submit" disabled={!input.trim() || isLoading} className="p-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-border)] text-white rounded-lg transition-colors disabled:cursor-not-allowed">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          <div className="card bg-[var(--color-primary)] text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-80">{t('current_cycle')}</span>
              <span className="text-lg font-bold">{cycleNumber}</span>
            </div>
            <div className="text-xs opacity-80">{new Date(cycleDateRange.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(cycleDateRange.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </div>

          <div className="card">
            <div className="p-3 border-b border-[var(--color-border)]"><h3 className="text-sm font-semibold text-[var(--color-text-dark)]">{t('todays_assignments')}</h3></div>
            <div className="p-3 space-y-2">
              {getPlatoonAssignments().map(({ platoon, duty }) => (
                <div key={platoon} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: rotationService.getDutyTypeColor(duty) }}>{platoon}</div>
                    <span className="text-sm text-[var(--color-text-dark)]">{rotationService.getDutyTypeDisplayName(duty)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="p-3 border-b border-[var(--color-border)]"><h3 className="text-sm font-semibold text-[var(--color-text-dark)]">{t('recent_activity')}</h3></div>
            <div className="p-3 space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-secondary)] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--color-text-dark)]">{activity.text}</p>
                    <p className="text-[10px] text-[var(--color-text-light)]">{activity.time}</p>
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
