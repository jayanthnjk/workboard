import { useState, useRef, useEffect } from 'react'
import { mockLLMService } from '@/services/mockLLMService'
import { voiceAssistant } from '@/services/voiceAssistant'
import type { ChatMessage } from '@/types'

interface ChatbotPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatbotPanel({ isOpen, onClose }: ChatbotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your Workboard assistant. I can help you with schedule inquiries, leave requests, shift swaps, and more. How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported] = useState(() => voiceAssistant.isSupported())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await mockLLMService.getResponse(input.trim())
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString(),
        action: response.action,
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setIsLoading(false)
    }
  }


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleVoice = () => {
    if (isListening) {
      voiceAssistant.stopListening()
      setIsListening(false)
    } else {
      const started = voiceAssistant.startListening(
        async (result) => {
          if (result.isFinal) {
            setIsListening(false)
            setInput(result.transcript)
            if (result.confidence >= 0.8) {
              const userMessage: ChatMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: result.transcript,
                timestamp: new Date().toISOString(),
              }
              setMessages(prev => [...prev, userMessage])
              setInput('')
              setIsLoading(true)
              try {
                const response = await voiceAssistant.processVoiceCommand(result.transcript, result.confidence)
                setMessages(prev => [...prev, {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: response.text,
                  timestamp: new Date().toISOString(),
                  action: response.action,
                }])
                voiceAssistant.speak(response.text)
              } catch {
                setMessages(prev => [...prev, {
                  id: `error-${Date.now()}`,
                  role: 'assistant',
                  content: 'Sorry, I encountered an error processing your voice command.',
                  timestamp: new Date().toISOString(),
                }])
              } finally {
                setIsLoading(false)
              }
            }
          }
        },
        (error) => {
          console.error('Voice error:', error)
          setIsListening(false)
        }
      )
      if (started) setIsListening(true)
    }
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date().toISOString(),
    }])
  }

  const suggestions = [
    'Show my schedule',
    'Request leave',
    'Who is working tomorrow?',
    'Check leave balance',
  ]


  return (
    <>
      {/* Side Panel */}
      <div className={`fixed top-14 right-0 bottom-0 w-full sm:w-80 bg-[var(--color-bg-card)] border-l border-[var(--color-border)] flex flex-col z-30 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-main)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--color-secondary)] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-[var(--color-text-dark)] text-sm">Assistant</h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="p-1.5 hover:bg-[var(--color-border-light)] rounded-md transition-colors" title="Clear chat">
              <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-[var(--color-border-light)] rounded-md transition-colors" title="Close">
              <svg className="w-4 h-4 text-[var(--color-text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 bg-[var(--color-secondary)] rounded-md flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-light)] font-medium">Assistant</span>
                  </div>
                )}
                <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-[var(--color-primary)] text-white rounded-br-sm'
                    : 'bg-[var(--color-bg-main)] text-[var(--color-text-dark)] rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.action && (
                    <button className="mt-2 text-[10px] underline opacity-80 hover:opacity-100">
                      Execute: {message.action.type}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 bg-[var(--color-secondary)] rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="bg-[var(--color-bg-main)] rounded-xl rounded-tl-sm px-3 py-2 ml-1.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[var(--color-text-light)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[var(--color-text-light)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[var(--color-text-light)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>


        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="px-3 pb-2 border-t border-[var(--color-border-light)] pt-2">
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-[10px] px-2 py-1 bg-[var(--color-bg-main)] hover:bg-[var(--color-border)] rounded-full transition-colors text-[var(--color-text-medium)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-main)]">
          <div className="flex items-end gap-2 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening...' : 'Ask anything...'}
              className="flex-1 resize-none bg-transparent text-xs text-[var(--color-text-dark)] placeholder-[var(--color-text-light)] focus:outline-none max-h-20"
              rows={1}
              disabled={isLoading || isListening}
            />
            <div className="flex items-center gap-1">
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isListening ? 'bg-[var(--color-error)] text-white animate-pulse' : 'hover:bg-[var(--color-bg-main)] text-[var(--color-text-light)]'
                  }`}
                  title={isListening ? 'Stop' : 'Voice'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-[var(--color-border)] text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onClose} />
      )}
    </>
  )
}

export default ChatbotPanel
