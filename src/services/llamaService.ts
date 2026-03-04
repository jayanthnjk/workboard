// Llama LLM Service using Ollama (local)
// Requires Ollama to be running: https://ollama.ai

export interface LlamaConfig {
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  timeout: number
}

export interface LlamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlamaResponse {
  text: string
  action?: string
  entities?: Record<string, string>
}

const DEFAULT_CONFIG: LlamaConfig = {
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2',
  temperature: 0.7,
  maxTokens: 1024,
  timeout: 30000,
}

const SYSTEM_PROMPT = `You are a helpful AI assistant for Workboard, a shift management application. You help employees with:
- Viewing their work schedules
- Requesting time off (leave requests)
- Swapping shifts with colleagues
- Checking who's working on specific days
- Understanding company policies

When users ask about actions, respond helpfully and suggest relevant actions. Format actionable suggestions as a numbered list.

Available actions you can suggest:
- view_schedule: Show the user's schedule
- create_leave_request: Help request time off
- create_swap_request: Initiate a shift swap
- view_team_schedule: See who's working
- view_reports: Access reports and analytics

Keep responses concise and friendly. If you suggest actions, format them as:
1. Action description
2. Another action

Current user context will be provided. Be helpful and professional.`

class LlamaService {
  private config: LlamaConfig
  private conversationHistory: LlamaMessage[] = []
  private isAvailable: boolean | null = null

  constructor(config: Partial<LlamaConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })
      this.isAvailable = response.ok
      return this.isAvailable
    } catch {
      this.isAvailable = false
      return false
    }
  }


  async getResponse(userMessage: string, userName?: string): Promise<LlamaResponse> {
    // Check if Ollama is available
    if (this.isAvailable === null) {
      await this.checkAvailability()
    }

    if (!this.isAvailable) {
      throw new Error('Ollama is not available. Please ensure Ollama is running.')
    }

    // Build messages array with context
    const systemPrompt = userName 
      ? `${SYSTEM_PROMPT}\n\nCurrent user: ${userName}`
      : SYSTEM_PROMPT

    const messages: LlamaMessage[] = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: userMessage },
    ]

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage = data.message?.content || 'I apologize, I could not generate a response.'

      // Add to conversation history
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantMessage }
      )

      // Parse for actions
      const action = this.extractAction(assistantMessage)

      return {
        text: assistantMessage,
        action,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.')
      }
      throw error
    }
  }

  private extractAction(text: string): string | undefined {
    const actionKeywords: Record<string, string[]> = {
      view_schedule: ['schedule', 'shifts', 'when.*work', 'calendar'],
      create_leave_request: ['leave', 'time off', 'vacation', 'sick'],
      create_swap_request: ['swap', 'trade', 'exchange', 'switch'],
      view_team_schedule: ['who.*working', 'team', 'colleagues', 'staff'],
      view_reports: ['report', 'analytics', 'statistics', 'metrics'],
    }

    const lowerText = text.toLowerCase()
    for (const [action, keywords] of Object.entries(actionKeywords)) {
      for (const keyword of keywords) {
        if (new RegExp(keyword).test(lowerText)) {
          return action
        }
      }
    }
    return undefined
  }

  async *streamResponse(userMessage: string, userName?: string): AsyncGenerator<string> {
    if (this.isAvailable === null) {
      await this.checkAvailability()
    }

    if (!this.isAvailable) {
      throw new Error('Ollama is not available.')
    }

    const systemPrompt = userName 
      ? `${SYSTEM_PROMPT}\n\nCurrent user: ${userName}`
      : SYSTEM_PROMPT

    const messages: LlamaMessage[] = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory.slice(-10),
      { role: 'user', content: userMessage },
    ]

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: true,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            if (json.message?.content) {
              fullResponse += json.message.content
              yield json.message.content
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }

      // Add to history after complete
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: fullResponse }
      )
    } finally {
      reader.releaseLock()
    }
  }

  clearHistory(): void {
    this.conversationHistory = []
  }

  getHistory(): LlamaMessage[] {
    return [...this.conversationHistory]
  }
}

export const llamaService = new LlamaService()
export default llamaService
