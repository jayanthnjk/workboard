import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockLLMService } from '@/services/mockLLMService'
import { groqService } from '@/services/groqService'
import { voiceAssistant } from '@/services/voiceAssistant'
import { useAuth } from '@/context/AuthContext'
import type { ChatMessage } from '@/types'

const CHAT_STORAGE_KEY = 'workboard_chat_messages'

// Load messages from localStorage
const loadMessages = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load chat messages:', e)
  }
  return []
}

// Save messages to localStorage
const saveMessages = (messages: ChatMessage[]) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  } catch (e) {
    console.error('Failed to save chat messages:', e)
  }
}

// Clear messages from localStorage
const clearMessages = () => {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear chat messages:', e)
  }
}

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages())
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported] = useState(() => voiceAssistant.isSupported())
  const [useLlm, setUseLlm] = useState(true) // Use Groq by default
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Save messages to localStorage whenever they change
  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

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
    const userInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      if (useLlm) {
        // Use Groq with streaming
        setIsStreaming(true)
        const assistantMsgId = `assistant-${Date.now()}`
        
        // Add empty assistant message that we'll update
        setMessages(prev => [...prev, {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        }])

        let fullText = ''
        for await (const chunk of groqService.streamResponse(userInput, user?.name)) {
          fullText += chunk
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMsgId 
              ? { ...msg, content: fullText }
              : msg
          ))
        }
        setIsStreaming(false)
      } else {
        // Fallback to mock service
        const response = await mockLLMService.getResponse(userInput)
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.text,
          timestamp: new Date().toISOString(),
          action: response.action,
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setIsStreaming(false)
      
      // Show error message to user with details
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Full error details:', errorMessage)
      
      // Check if it's an API key or model issue
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ API authentication failed. The Groq API key may be invalid or expired. Falling back to mock mode.\n\nError: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        }])
        setUseLlm(false)
      } else if (errorMessage.includes('404') || errorMessage.includes('model')) {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Model not found. The requested model may not be available. Falling back to mock mode.\n\nError: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        }])
        setUseLlm(false)
      } else if (errorMessage.includes('429')) {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Rate limit exceeded. Please wait a moment and try again.\n\nError: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        }])
        // Don't disable LLM for rate limits - just temporary
      } else {
        setUseLlm(false) // Disable LLM on other errors
        // Fallback to mock on error
        try {
          const response = await mockLLMService.getResponse(userInput)
          setMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.text,
            timestamp: new Date().toISOString(),
            action: response.action,
          }])
        } catch {
          setMessages(prev => [...prev, {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date().toISOString(),
          }])
        }
      }
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
      setIsListening(true)
      const started = voiceAssistant.startListening(
        async (result) => {
          setInput(result.transcript)
          if (result.isFinal) {
            setIsListening(false)
            if (result.confidence >= 0.7 && result.transcript.trim()) {
              const userMessage: ChatMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: result.transcript.trim(),
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
                  content: 'Sorry, I encountered an error.',
                  timestamp: new Date().toISOString(),
                }])
              } finally {
                setIsLoading(false)
              }
            }
          }
        },
        () => setIsListening(false)
      )
      if (!started) setIsListening(false)
    }
  }

  const handleFileSelect = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setInput(prev => prev + (prev ? '\n' : '') + `📎 ${file.name}`)
    }
    e.target.value = ''
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const suggestions = [
    { icon: '📅', text: 'Show my schedule', color: 'bg-blue-500' },
    { icon: '🌴', text: 'Request time off', color: 'bg-emerald-500' },
    { icon: '🔄', text: 'Swap my shift', color: 'bg-violet-500' },
    { icon: '👥', text: "Who's working?", color: 'bg-amber-500' },
  ]

  // Parse assistant message and render clickable options
  const handleOptionClick = async (optionText: string) => {
    if (isLoading) return
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: optionText,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      if (useLlm) {
        // Use Groq with streaming
        setIsStreaming(true)
        const assistantMsgId = `assistant-${Date.now()}`
        
        setMessages(prev => [...prev, {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        }])

        let fullText = ''
        for await (const chunk of groqService.streamResponse(optionText, user?.name)) {
          fullText += chunk
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMsgId 
              ? { ...msg, content: fullText }
              : msg
          ))
        }
        setIsStreaming(false)
      } else {
        const response = await mockLLMService.getResponse(optionText)
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.text,
          timestamp: new Date().toISOString(),
          action: response.action,
        }])
      }
    } catch {
      setIsStreaming(false)
      // Fallback to mock
      try {
        const response = await mockLLMService.getResponse(optionText)
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.text,
          timestamp: new Date().toISOString(),
          action: response.action,
        }])
      } catch {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        }])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const renderAssistantMessage = (content: string) => {
    // Look for a "Would you like to:" or similar action prompt section at the end
    const actionPromptPatterns = [
      /would you like to[:\?]?\s*$/im,
      /you can[:\?]?\s*$/im,
      /options[:\?]?\s*$/im,
      /what would you like to do[:\?]?\s*$/im,
      /here are your options[:\?]?\s*$/im,
    ]
    
    // Check if content ends with an action section
    const lines = content.split('\n')
    let actionSectionStart = -1
    let suggestedActions: string[] = []
    
    // Find where action suggestions start (look for prompt followed by list items)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase()
      if (actionPromptPatterns.some(p => p.test(line)) || line === 'would you like to:' || line === 'you can:') {
        actionSectionStart = i
        break
      }
    }
    
    // If we found an action section, extract the actions
    if (actionSectionStart >= 0) {
      const listPattern = /^(\d+\.\s+|•\s+|[-*]\s+)/
      for (let i = actionSectionStart + 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (listPattern.test(line)) {
          const actionText = line.replace(listPattern, '').replace(/^[^\w]*/, '').trim()
          if (actionText) {
            suggestedActions.push(actionText)
          }
        }
      }
    }
    
    // Get the main content (everything before action section, or all if no action section)
    const mainContent = actionSectionStart >= 0 
      ? lines.slice(0, actionSectionStart).join('\n').trim()
      : content
    
    // If no suggested actions found, just render as plain text
    if (suggestedActions.length === 0) {
      return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    }
    
    return (
      <div className="space-y-4">
        {/* Main response text */}
        {mainContent && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{mainContent}</p>
        )}
        
        {/* Suggested actions - Claude style */}
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Suggested actions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionClick(action)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col">
      {/* Chat Header - Only when messages exist */}
      {messages.length > 0 && (
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Assistant</p>
              <p className="text-xs text-neutral-500">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* LLM Toggle Button */}
            <button
              onClick={() => setUseLlm(!useLlm)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                useLlm 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
              }`}
              title={useLlm ? 'Click to switch to Mock mode' : 'Click to switch to LLM mode'}
            >
              {useLlm ? '⚡ Llama 3.3 70B' : '🔧 Mock'}
            </button>
            
            <button
              onClick={() => {
                setMessages([])
                clearMessages()
                groqService.clearHistory()
                setUseLlm(true) // Re-enable LLM on new chat
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New chat
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center px-6 py-8">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/20 mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>

            {/* Greeting */}
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-center mb-8 max-w-sm">
              How can I help you with your schedule today?
            </p>

            {/* Suggestions */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {suggestions.map(s => (
                <button
                  key={s.text}
                  onClick={() => { setInput(s.text); inputRef.current?.focus() }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md transition-all"
                >
                  <span className={`w-7 h-7 ${s.color} rounded-lg flex items-center justify-center text-base`}>
                    {s.icon}
                  </span>
                  {s.text}
                </button>
              ))}
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-2 mt-8">
              <span className="text-xs text-neutral-400">Quick:</span>
              {[
                { label: 'Schedule', path: '/schedule' },
                { label: 'Leave', path: '/leave-requests' },
                { label: 'Swaps', path: '/swap-requests' },
              ].map(link => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-sky-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                }`}>
                  {msg.role === 'assistant' ? renderAssistantMessage(msg.content) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {(isLoading && !isStreaming) && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-4">
        {/* Voice Listening Indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 mb-3 py-2 px-4 bg-red-50 dark:bg-red-900/20 rounded-xl max-w-2xl mx-auto">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">Listening...</span>
            {input && <span className="text-sm text-neutral-600 dark:text-neutral-400 italic ml-2">"{input}"</span>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative flex items-center bg-white dark:bg-neutral-800 rounded-full border border-neutral-200 dark:border-neutral-700 focus-within:border-sky-400 dark:focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-400/10 shadow-sm hover:shadow-md transition-all">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={handleFileSelect}
              className="flex-shrink-0 p-3 ml-1 text-neutral-400 hover:text-sky-500 transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
              title="Attach file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </button>

            {/* Text Input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your schedule..."
              rows={1}
              className="flex-1 py-3.5 px-2 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 resize-none focus:outline-none"
              style={{ maxHeight: '120px' }}
            />

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex items-center gap-1 pr-2">
              {/* Voice Button */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`p-2.5 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                      : 'text-neutral-400 hover:text-sky-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-2.5 rounded-full transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-sky-500 text-white shadow-md hover:bg-sky-600 hover:shadow-lg hover:scale-105'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-300 dark:text-neutral-500 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Keyboard Hints */}
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-[10px] font-medium border border-neutral-200 dark:border-neutral-700">Enter</kbd>
              <span>send</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-[10px] font-medium border border-neutral-200 dark:border-neutral-700">Shift + Enter</kbd>
              <span>new line</span>
            </span>
          </div>
        </form>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        />
      </div>
    </div>
  )
}
