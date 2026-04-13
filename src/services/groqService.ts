// Groq LLM Service — routes through backend, NEVER calls Groq directly from browser
// Per system design: LLM is untrusted, all calls go through the backend's ChatService
// which handles sanitization, RBAC, tool execution, and audit logging.

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqResponse {
  text: string
  action?: string
  actionResult?: { success: boolean; message: string; data?: unknown }
}

const BACKEND_CHAT_URL = 'http://localhost:8080/api/chat'

class GroqService {
  private conversationHistory: GroqMessage[] = []

  async getResponse(userMessage: string, _userName?: string): Promise<GroqResponse> {
    const token = localStorage.getItem('workboard_access_token')

    try {
      const response = await fetch(BACKEND_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          source: 'MANUAL',
        }),
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Session expired. Please login again.')
        }
        throw new Error(`Server error: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        const chatResponse = result.data
        const text = chatResponse.message || 'No response'

        this.conversationHistory.push(
          { role: 'user', content: userMessage },
          { role: 'assistant', content: text }
        )

        return {
          text,
          action: chatResponse.intent,
          actionResult: chatResponse.data ? {
            success: true,
            message: chatResponse.message,
            data: chatResponse.data,
          } : undefined,
        }
      }

      return { text: result.message || 'Something went wrong' }
    } catch (error) {
      console.error('[ChatService] Error:', error)
      const message = error instanceof Error ? error.message : 'Failed to connect to server'
      throw new Error(message)
    }
  }

  async *streamResponse(userMessage: string, _userName?: string): AsyncGenerator<string> {
    // Backend doesn't support streaming yet — fall back to full response
    const response = await this.getResponse(userMessage, _userName)
    // Simulate streaming by yielding word by word
    const words = response.text.split(' ')
    for (const word of words) {
      yield word + ' '
      await new Promise(resolve => setTimeout(resolve, 20))
    }
  }

  clearHistory(): void {
    this.conversationHistory = []
  }
}

export const groqService = new GroqService()
