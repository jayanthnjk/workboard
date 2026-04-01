// Groq LLM Service - Fast cloud inference with action execution
// https://console.groq.com
// Enhanced for Karnataka Police CAR Mangaluru — bilingual English + Kannada

import { dataStore } from './dataStore'
import { 
  createLeaveRequest, 
  createSwapRequest, 
  createShiftAssignment, 
  checkAvailability,
  createEmployee,
  type ActionResult 
} from './chatActionExecutor'

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqResponse {
  text: string
  action?: string
  actionResult?: ActionResult
}

const GROQ_API_KEY = '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'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// ---------------------------------------------------------------------------
// Kannada + English keyword patterns for action parsing
// ---------------------------------------------------------------------------
function parseActionFromMessage(message: string): { action: string; params: Record<string, string> } | null {
  const lower = message.toLowerCase()

  // --- Kannada keyword maps ---
  const kannadaLeave = /ರಜೆ|ಅನುಪಸ್ಥಿತಿ|ಸಿಎಲ್|ಇಎಲ್|ಸಿಎಂಎಲ್/
  const kannadaRequest = /ವಿನಂತಿ|ಅರ್ಜಿ|ಸಲ್ಲಿಸಿ|ಮಾಡಿ/
  const kannadaShift = /ಶಿಫ್ಟ್|ಕರ್ತವ್ಯ|ಡ್ಯೂಟಿ|ವೇಳಾಪಟ್ಟಿ/
  const kannadaSwap = /ಬದಲಾವಣೆ|ವಿನಿಮಯ/
  const kannadaAvailable = /ಲಭ್ಯ|ಖಾಲಿ/
  const kannadaCreate = /ಹೊಸ|ಸೇರಿಸಿ|ರಚಿಸಿ/
  const kannadaPersonnel = /ಸಿಬ್ಬಂದಿ|ಪೊಲೀಸ್|ಕಾನ್‌ಸ್ಟೇಬಲ್/

  // Helper: extract personnel name (English patterns)
  const extractEmployeeName = (msg: string): string => {
    let match: RegExpMatchArray | null

    match = msg.match(/for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (match) return match[1]

    match = msg.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s/i)
    if (match) return match[1]

    match = msg.match(/assign\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (match) return match[1]

    match = msg.match(/is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:available|free)/i)
    if (match) return match[1]

    match = msg.match(/(?:schedule|shift)\s+(?:for\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (match) return match[1]

    match = msg.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+to\s+(?:morning|afternoon|evening|night)/i)
    if (match) return match[1]

    match = msg.match(/create\s+.*?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/i)
    if (match) return match[1]

    return ''
  }

  // Helper: extract date (English + Kannada)
  const extractDate = (msg: string): string => {
    const l = msg.toLowerCase()
    if (l.includes('today') || /ಇಂದು/.test(msg)) return 'today'
    if (l.includes('tomorrow') || /ನಾಳೆ/.test(msg)) return 'tomorrow'

    let match = msg.match(/(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]

    match = msg.match(/(?:on\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i)
    if (match) return match[1]

    return 'today'
  }

  // --- Leave request (English + Kannada) ---
  const isLeaveIntent =
    (lower.includes('leave') || lower.includes('time off') || lower.includes('vacation') || kannadaLeave.test(message)) &&
    (lower.includes('create') || lower.includes('request') || lower.includes('book') || lower.includes('submit') || kannadaRequest.test(message))

  if (isLeaveIntent) {
    const typeMatch = message.match(/(annual|sick|personal|unpaid|CL|CML|EL|PL)/i)
    return {
      action: 'create_leave',
      params: {
        employee: extractEmployeeName(message),
        date: extractDate(message),
        type: typeMatch?.[1] || 'annual',
      },
    }
  }

  // --- Swap request (English + Kannada) ---
  const isSwapIntent =
    (lower.includes('swap') || kannadaSwap.test(message)) &&
    (lower.includes('create') || lower.includes('request') || lower.includes('initiate') || kannadaRequest.test(message))

  if (isSwapIntent) {
    const withMatch = message.match(/with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    return {
      action: 'create_swap',
      params: {
        requester: extractEmployeeName(message),
        target: withMatch?.[1] || '',
        date: extractDate(message),
      },
    }
  }

  // --- Shift / duty assignment (English + Kannada) ---
  const isShiftIntent =
    (lower.includes('shift') || lower.includes('schedule') || lower.includes('adhoc') || lower.includes('assign') || lower.includes('duty') || kannadaShift.test(message)) &&
    (lower.includes('create') || lower.includes('add') || lower.includes('assign') || lower.includes('schedule') || kannadaCreate.test(message) || kannadaRequest.test(message))

  if (isShiftIntent) {
    const shiftMatch = message.match(/(morning|afternoon|evening|night|guard-i|guard-ii|check-point|striking-force|prison)/i)
    const timeMatch = message.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)

    if (!shiftMatch && !timeMatch) return null // let AI ask for clarification

    let shiftType = shiftMatch?.[1] || 'morning'
    if (!shiftMatch && timeMatch) {
      let hour = parseInt(timeMatch[1])
      if (timeMatch[3]?.toLowerCase() === 'pm' && hour < 12) hour += 12
      if (timeMatch[3]?.toLowerCase() === 'am' && hour === 12) hour = 0
      shiftType = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night'
    }

    return {
      action: 'create_shift',
      params: {
        employee: extractEmployeeName(message),
        date: extractDate(message),
        shiftType,
      },
    }
  }

  // --- Availability check (English + Kannada) ---
  if (lower.includes('available') || lower.includes('availability') || lower.includes('free') || kannadaAvailable.test(message)) {
    return {
      action: 'check_availability',
      params: {
        employee: extractEmployeeName(message),
        date: extractDate(message),
      },
    }
  }

  // --- Create employee / personnel (English + Kannada) ---
  const isCreatePersonnel =
    (lower.includes('employee') || lower.includes('staff') || lower.includes('person') || lower.includes('worker') || lower.includes('personnel') || kannadaPersonnel.test(message)) &&
    (lower.includes('create') || lower.includes('add') || lower.includes('new') || lower.includes('hire') || kannadaCreate.test(message))

  if (isCreatePersonnel) {
    let nameMatch = message.match(/(?:named|called|name)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (!nameMatch) nameMatch = message.match(/(?:employee|staff|person|worker|personnel)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (!nameMatch) nameMatch = message.match(/add\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)

    const deptMatch = message.match(/(?:to|in|for)\s+(operations|administration|customer service|warehouse|it support)/i)
    const roleMatch = message.match(/(admin|supervisor|employee)/i)

    return {
      action: 'create_employee',
      params: {
        name: nameMatch?.[1] || '',
        department: deptMatch?.[1] || '',
        role: roleMatch?.[1] || 'employee',
      },
    }
  }

  return null
}


// ---------------------------------------------------------------------------
// Build KP-specific system prompt with live data
// ---------------------------------------------------------------------------
function buildSystemPrompt(userName?: string): string {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // --- Current user context ---
  const users = dataStore.getUsers()
  const currentUser = users.find(u => u.name === userName) || users[0]

  // --- KP data from dataStore ---
  const personnel = dataStore.getPersonnel()
  const activePersonnel = personnel.filter(p => p.status === 'active')
  const sickPersonnel = personnel.filter(p => p.status === 'sick')
  const onLeavePersonnel = personnel.filter(p => p.status === 'on-leave')
  const absentPersonnel = personnel.filter(p => p.status === 'absent')

  const activeGuardLocations = dataStore.getActiveGuardLocations()
  const sections = dataStore.getSections()
  const platoons = dataStore.getPlatoons()
  const adhocRequests = dataStore.getAdhocRequests()
  const pendingAdhoc = adhocRequests.filter(r => r.status === 'pending')
  const kpLeaveBalances = dataStore.getKPLeaveBalances()
  const pendingLeaveRequests = dataStore.getPendingKPLeaveRequests()
  const currentRotations = dataStore.getCurrentPlatoonRotations()

  // --- Format personnel summary (compact — first 50 for context window) ---
  const personnelSummary = activePersonnel.slice(0, 50).map(p =>
    `${p.personnelId} | ${p.name} | ${p.rank} | Sec-${p.section}${p.platoon ? ` / ${p.platoon}` : ''} | ${p.status}`
  ).join('\n')

  // --- Guard locations ---
  const guardLocationsSummary = activeGuardLocations.map(gl =>
    `${gl.code} — ${gl.name} (${gl.type}, ${gl.requiredPersonnel} personnel)`
  ).join('\n')

  // --- Sections ---
  const sectionsSummary = sections.map(s =>
    `${s.type}: ${s.name} — strength ${s.totalStrength}, duties: ${s.dutyCategories.join(', ')}`
  ).join('\n')

  // --- Platoons & current duty ---
  const platoonsSummary = platoons.map(p =>
    `${p.name} (${p.id}): ${p.personnelCount} personnel, current duty: ${p.currentDutyType}`
  ).join('\n')

  // --- Current rotation cycle ---
  const currentRotationSummary = currentRotations.length > 0
    ? currentRotations.map(r =>
        `${r.platoonId}: ${r.dutyType} (${r.startDate} → ${r.endDate})`
      ).join('\n')
    : platoons.map(p => `${p.id}: ${p.currentDutyType}`).join('\n')

  // --- Pending adhoc requests ---
  const adhocSummary = pendingAdhoc.slice(0, 10).map(a =>
    `[${a.id}] ${a.reason || 'Adhoc'} — ${a.status} — assigned to: ${a.assignedTo}`
  ).join('\n') || 'None'

  // --- Leave balances (sample — first 10) ---
  const leaveBalanceSample = kpLeaveBalances.slice(0, 10).map(lb =>
    `${lb.personnelId}: ${lb.balances.map(b => `${b.type}=${b.remaining}/${b.entitled}`).join(', ')}`
  ).join('\n')

  // --- Personnel names for name-matching ---
  const personnelNames = activePersonnel.slice(0, 60).map(p => p.name).join(', ')

  return `You are the AI assistant for Karnataka Police — City Armed Reserve (CAR), Mangaluru.

BILINGUAL SUPPORT:
- You understand both English and Kannada (ಕನ್ನಡ)
- Always respond in the SAME language the user writes in
- If user writes in Kannada, respond entirely in Kannada
- If user writes in English, respond entirely in English
- If user mixes both, respond in the dominant language used

CURRENT USER: ${userName || 'Unknown'}
ROLE: ${currentUser?.role || 'employee'}
TODAY: ${todayStr}

=== KARNATAKA POLICE CONTEXT ===
Unit: City Armed Reserve (CAR), Mangaluru
Total Strength: ${personnel.length} personnel
Active: ${activePersonnel.length} | Sick: ${sickPersonnel.length} | On Leave: ${onLeavePersonnel.length} | Absent: ${absentPersonnel.length}
Pending Leave Requests: ${pendingLeaveRequests.length}
Pending Adhoc Requests: ${pendingAdhoc.length}

=== SECTIONS ===
${sectionsSummary}

=== PLATOONS & CURRENT DUTY ===
${platoonsSummary}

=== CURRENT ROTATION CYCLE ===
${currentRotationSummary}

=== GUARD LOCATIONS (${activeGuardLocations.length} active) ===
${guardLocationsSummary}

=== PENDING ADHOC REQUESTS ===
${adhocSummary}

=== LEAVE BALANCE SAMPLE (KP leave types: CL, CML, EL, PL) ===
${leaveBalanceSample}

=== PERSONNEL (first 50 of ${personnel.length}) ===
${personnelSummary}

=== AVAILABLE PERSONNEL NAMES (use for matching) ===
${personnelNames}

DATA QUERY RULES:
- Return ONLY the specific data the user asked for — be concise, no extra info
- Do NOT dump all data — filter to what's relevant
- If user asks "who is on leave today?", only show personnel on leave today
- If user asks "show guard locations", show location names and personnel count
- If user asks about a specific person, show only that person's details
- Keep responses short and focused
- Use bullet points for structured data
- For numbers/stats, show the number prominently

KARNATAKA POLICE TERMINOLOGY:
- Personnel are organized into Sections (A, B, C, PMT, RECRUIT) and Platoons (P1–P5)
- Section C has 5 platoons that rotate through duties every 15 days
- Duty types: Guard-I, Guard-II, Check Point, Prison/VIP Escort, Striking Force
- Ranks: DCP, ACP, RPI, RSI, ARSI, AHC, APC
- Leave types: CL (Casual Leave), CML (Commuted Medical Leave), EL (Earned Leave), PL (Paternity Leave)
- Guard locations are across Mangaluru city (banks, government offices, hospitals, NCC)
- Adhoc requests are for special events, VIP visits, festivals, etc.

INSTRUCTIONS:
- Answer questions using the ACTUAL DATA above
- When asked about schedule/rotation, use the platoon rotation data
- When asked about leave balance, use the KP leave balance data (CL, CML, EL, PL)
- When asked who's working, use the personnel and platoon data
- When user asks to create something for a person, use names from AVAILABLE PERSONNEL NAMES
- Be concise and helpful
- Keep the main response as plain text paragraphs

Would-you-like suggestions — ONLY add when there are clear next steps:

Would you like to:
1. First action option
2. Second action option
3. Third action option

IMPORTANT RULES:
- Only include the "Would you like to:" section when there are clear next steps. Don't add it for simple informational responses.
- When user asks to create/assign a shift WITHOUT specifying the type, ask which type they want.
- When creating shifts, always confirm the employee name, date, and shift type before proceeding.

You can help with:
- Viewing schedules, rotations, and platoon duties
- Requesting leave (CL, CML, EL, PL)
- Checking who's on duty / on leave / sick / absent
- Guard location details and personnel counts
- Adhoc request status
- Leave balance inquiries
- Assigning shifts and duties
- Personnel information lookup`
}


// ---------------------------------------------------------------------------
// GroqService class — unchanged API surface, enhanced internals
// ---------------------------------------------------------------------------
class GroqService {
  private conversationHistory: GroqMessage[] = []
  private apiKey: string

  constructor(apiKey: string = GROQ_API_KEY) {
    this.apiKey = apiKey
  }

  async getResponse(userMessage: string, userName?: string): Promise<GroqResponse> {
    // Check if this is an action request and execute it
    const parsedAction = parseActionFromMessage(userMessage)
    console.log('[GroqService] Parsed action from message:', parsedAction)

    let actionResult: ActionResult | undefined
    let actionContext = ''

    if (parsedAction) {
      console.log('[GroqService] Executing action:', parsedAction.action, 'with params:', parsedAction.params)

      switch (parsedAction.action) {
        case 'create_leave':
          actionResult = createLeaveRequest(
            parsedAction.params.employee,
            parsedAction.params.type,
            parsedAction.params.date,
            parsedAction.params.date,
            'Requested via AI assistant'
          )
          actionContext = actionResult.success
            ? `ACTION EXECUTED: ${actionResult.message}`
            : `ACTION FAILED: ${actionResult.message}`
          break

        case 'create_swap':
          actionResult = createSwapRequest(
            parsedAction.params.requester,
            parsedAction.params.target,
            parsedAction.params.date,
            'Requested via AI assistant'
          )
          actionContext = actionResult.success
            ? `ACTION EXECUTED: ${actionResult.message}`
            : `ACTION FAILED: ${actionResult.message}`
          break

        case 'create_shift':
          console.log('[GroqService] Creating/updating shift with params:', parsedAction.params)
          actionResult = createShiftAssignment(
            parsedAction.params.employee,
            parsedAction.params.shiftType,
            parsedAction.params.date
          )
          console.log('[GroqService] Shift creation/update result:', actionResult)
          actionContext = actionResult.success
            ? `ACTION EXECUTED: ${actionResult.message}`
            : `ACTION FAILED: ${actionResult.message}`
          break

        case 'check_availability':
          actionResult = checkAvailability(parsedAction.params.employee, parsedAction.params.date)
          actionContext = `AVAILABILITY CHECK: ${actionResult.message}`
          break

        case 'create_employee':
          actionResult = createEmployee(
            parsedAction.params.name,
            undefined,
            parsedAction.params.department,
            parsedAction.params.role
          )
          actionContext = actionResult.success
            ? `ACTION EXECUTED: ${actionResult.message}`
            : `ACTION FAILED: ${actionResult.message}`
          break
      }
    }

    // Build system prompt with action context
    const systemPrompt = buildSystemPrompt(userName)
    const fullSystemPrompt = actionContext
      ? `${systemPrompt}\n\n=== ACTION RESULT ===\n${actionContext}\n\nRespond to the user about this action result. Be conversational and confirm what was done or explain what went wrong.`
      : systemPrompt

    const messages: GroqMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      ...this.conversationHistory.slice(-10),
      { role: 'user', content: userMessage },
    ]

    try {
      console.log('[GroqService] Making API request to Groq...')
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 2048,
          stream: false,
        }),
      })

      console.log('[GroqService] Response status:', response.status)

      if (!response.ok) {
        const error = await response.text()
        console.error('[GroqService] API Error:', response.status, error)
        throw new Error(`Groq API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      const assistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

      // Add to history
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantMessage }
      )

      return { text: assistantMessage, actionResult }
    } catch (error) {
      console.error('Groq error:', error)
      throw error
    }
  }

  async *streamResponse(userMessage: string, userName?: string): AsyncGenerator<string> {
    // Check if this is an action request and execute it
    const parsedAction = parseActionFromMessage(userMessage)
    let actionContext = ''

    if (parsedAction) {
      let actionResult: ActionResult | undefined

      switch (parsedAction.action) {
        case 'create_leave':
          actionResult = createLeaveRequest(
            parsedAction.params.employee,
            parsedAction.params.type,
            parsedAction.params.date,
            parsedAction.params.date,
            'Requested via AI assistant'
          )
          break

        case 'create_swap':
          actionResult = createSwapRequest(
            parsedAction.params.requester,
            parsedAction.params.target,
            parsedAction.params.date,
            'Requested via AI assistant'
          )
          break

        case 'create_shift':
          actionResult = createShiftAssignment(
            parsedAction.params.employee,
            parsedAction.params.shiftType,
            parsedAction.params.date
          )
          break

        case 'check_availability':
          actionResult = checkAvailability(parsedAction.params.employee, parsedAction.params.date)
          break

        case 'create_employee':
          actionResult = createEmployee(
            parsedAction.params.name,
            undefined,
            parsedAction.params.department,
            parsedAction.params.role
          )
          break
      }

      if (actionResult) {
        actionContext = actionResult.success
          ? `ACTION EXECUTED SUCCESSFULLY: ${actionResult.message}`
          : `ACTION FAILED: ${actionResult.message}`
      }
    }

    const systemPrompt = buildSystemPrompt(userName)
    const fullSystemPrompt = actionContext
      ? `${systemPrompt}\n\n=== ACTION RESULT ===\n${actionContext}\n\nRespond to the user about this action result. Be conversational and confirm what was done or explain what went wrong.`
      : systemPrompt

    const messages: GroqMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      ...this.conversationHistory.slice(-10),
      { role: 'user', content: userMessage },
    ]

    console.log('[GroqService] Making streaming API request to Groq...')
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    })

    console.log('[GroqService] Streaming response status:', response.status)

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[GroqService] Streaming API Error:', response.status, errorText)
      throw new Error(`Groq API error: ${response.status} - ${errorText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'))

        for (const line of lines) {
          const data = line.replace('data: ', '').trim()
          if (data === '[DONE]') continue

          try {
            const json = JSON.parse(data)
            const content = json.choices?.[0]?.delta?.content
            if (content) {
              fullResponse += content
              yield content
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      // Add to history
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
}

export const groqService = new GroqService()
export default groqService
