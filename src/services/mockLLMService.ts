import type { IntentMatch, MockResponse, ActionPayload } from '@/types'
import { chatbotResponses } from '@/data/chatbotResponses'

interface ConversationContext {
  lastIntent?: string
  entities: Record<string, string>
  turnCount: number
}

class MockLLMService {
  private context: ConversationContext = {
    entities: {},
    turnCount: 0,
  }

  private normalizeInput(input: string): string {
    return input.toLowerCase().trim()
  }

  matchIntent(input: string): IntentMatch | null {
    const normalized = this.normalizeInput(input)
    
    for (const intentData of chatbotResponses.intents) {
      for (const pattern of intentData.patterns) {
        const regex = new RegExp(pattern, 'i')
        if (regex.test(normalized)) {
          // Extract entities if defined
          const entities: Record<string, string> = {}
          if (intentData.entities) {
            for (const entity of intentData.entities) {
              const entityMatch = normalized.match(new RegExp(entity, 'i'))
              if (entityMatch) {
                entities[entity] = entityMatch[0]
              }
            }
          }
          
          return {
            intent: intentData.intent,
            confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
            entities,
            action: intentData.action,
          }
        }
      }
    }
    
    return null
  }

  async getResponse(input: string): Promise<MockResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
    
    this.context.turnCount++
    
    const intentMatch = this.matchIntent(input)
    
    if (intentMatch) {
      this.context.lastIntent = intentMatch.intent
      Object.assign(this.context.entities, intentMatch.entities)
      
      const intentData = chatbotResponses.intents.find(i => i.intent === intentMatch.intent)
      if (intentData) {
        const responseIndex = Math.floor(Math.random() * intentData.responses.length)
        const responseText = intentData.responses[responseIndex]
        
        // Get suggestions for this intent
        const suggestions = (chatbotResponses.suggestions as Record<string, string[]>)[intentMatch.intent] || []
        
        // Build action payload if action is defined
        let action: ActionPayload | undefined
        if (intentData.action) {
          action = {
            type: intentData.action,
            data: intentMatch.entities,
          }
        }
        
        return {
          text: responseText,
          suggestions: suggestions.slice(0, 3),
          action,
        }
      }
    }
    
    // Fallback response
    const fallbackIndex = Math.floor(Math.random() * chatbotResponses.fallbackResponses.length)
    return {
      text: chatbotResponses.fallbackResponses[fallbackIndex],
      suggestions: ['Show my schedule', 'Request leave', 'Help'],
    }
  }

  resetContext(): void {
    this.context = {
      entities: {},
      turnCount: 0,
    }
    sessionStorage.removeItem('chatbot_context')
  }

  saveContext(): void {
    sessionStorage.setItem('chatbot_context', JSON.stringify(this.context))
  }

  loadContext(): void {
    const stored = sessionStorage.getItem('chatbot_context')
    if (stored) {
      this.context = JSON.parse(stored)
    }
  }
}

export const mockLLMService = new MockLLMService()
export default mockLLMService
