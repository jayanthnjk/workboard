import { mockLLMService } from './mockLLMService'
import type { MockResponse } from '@/types'

// Web Speech API types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

class VoiceAssistant {
  private recognition: SpeechRecognitionInstance | null = null
  private synthesis: SpeechSynthesis | null = null
  private isListening = false
  private confidenceThreshold = 0.8
  private onResultCallback: ((result: VoiceRecognitionResult) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      const SpeechRecognitionAPI = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition || 
        (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition
      if (SpeechRecognitionAPI) {
        this.recognition = new SpeechRecognitionAPI()
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.lang = 'en-US'

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          const result = event.results[event.results.length - 1]
          const transcript = result[0].transcript
          const confidence = result[0].confidence

          if (this.onResultCallback) {
            this.onResultCallback({
              transcript,
              confidence,
              isFinal: result.isFinal,
            })
          }
        }

        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('[Voice] Recognition error:', event.error)
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error)
          }
          this.isListening = false
        }

        this.recognition.onend = () => {
          this.isListening = false
        }
      }

      // Initialize Speech Synthesis
      this.synthesis = window.speechSynthesis
    }
  }

  isSupported(): boolean {
    return this.recognition !== null && this.synthesis !== null
  }

  startListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): boolean {
    if (!this.recognition) {
      console.error('[Voice] Speech recognition not supported')
      return false
    }

    if (this.isListening) {
      return true
    }

    this.onResultCallback = onResult
    this.onErrorCallback = onError || null

    try {
      this.recognition.start()
      this.isListening = true
      console.log('[Voice] Started listening')
      return true
    } catch (error) {
      console.error('[Voice] Failed to start:', error)
      return false
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
      console.log('[Voice] Stopped listening')
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.synthesis) {
      console.error('[Voice] Speech synthesis not supported')
      return
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // Try to use a natural voice
      const voices = this.synthesis!.getVoices()
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural'))
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()

      this.synthesis!.speak(utterance)
    })
  }

  cancelSpeech(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  async processVoiceCommand(transcript: string, confidence: number): Promise<MockResponse> {
    console.log('[Voice] Processing command:', transcript, 'confidence:', confidence)

    // Check confidence threshold
    if (confidence < this.confidenceThreshold) {
      return {
        text: `I'm not sure I understood that correctly. Did you say "${transcript}"? Please try again or speak more clearly.`,
        suggestions: ['Yes, that\'s correct', 'No, let me try again'],
      }
    }

    // Process through mock LLM service
    const response = await mockLLMService.getResponse(transcript)
    return response
  }

  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold))
  }

  getConfidenceThreshold(): number {
    return this.confidenceThreshold
  }

  getListeningState(): boolean {
    return this.isListening
  }
}

export const voiceAssistant = new VoiceAssistant()
export default voiceAssistant
