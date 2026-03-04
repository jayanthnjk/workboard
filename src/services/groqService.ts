// Groq LLM Service - Fast cloud inference with action execution
// https://console.groq.com

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

// Parse action from user message (improved)
function parseActionFromMessage(message: string): { action: string; params: Record<string, string> } | null {
  const lower = message.toLowerCase()
  
  // Extract employee name - look for common patterns
  const extractEmployeeName = (msg: string): string => {
    let match: RegExpMatchArray | null
    
    // Pattern: "for [Name]" or "for [Name] on/at/from" - most common
    match = msg.match(/for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (match) {
      console.log('[GroqService] Extracted name via "for X" pattern:', match[1])
      return match[1]
    }
    
    // Pattern: "[Name]'s" 
    match = msg.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'s/i)
    if (match) {
      console.log('[GroqService] Extracted name via "X\'s" pattern:', match[1])
      return match[1]
    }
    
    // Pattern: "assign [Name]"
    match = msg.match(/assign\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (match) {
      console.log('[GroqService] Extracted name via "assign X" pattern:', match[1])
      return match[1]
    }
    
    // Pattern: "is [Name] available"
    match = msg.match(/is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:available|free)/i)
    if (match) {
      console.log('[GroqService] Extracted name via "is X available" pattern:', match[1])
      return match[1]
    }
    
    // Pattern: "schedule [Name]" or "shift [Name]" - handles "create schedule John" or "schedule for John"
    match = msg.match(/(?:schedule|shift)\s+(?:for\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (match) {
      console.log('[GroqService] Extracted name via "schedule/shift X" pattern:', match[1])
      return match[1]
    }
    
    // Pattern: "[Name] to" (e.g., "assign John to morning shift")
    match = msg.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+to\s+(?:morning|afternoon|evening|night)/i)
    if (match) {
      console.log('[GroqService] Extracted name via "X to shift" pattern:', match[1])
      return match[1]
    }
    
    // Pattern: "create ... [Name]" at end of sentence (e.g., "create a morning shift for John Smith")
    match = msg.match(/create\s+.*?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/i)
    if (match) {
      console.log('[GroqService] Extracted name via "create ... X" pattern:', match[1])
      return match[1]
    }
    
    console.log('[GroqService] Could not extract employee name from:', msg)
    return ''
  }
  
  // Extract date
  const extractDate = (msg: string): string => {
    // Look for explicit date patterns
    if (msg.toLowerCase().includes('today')) return 'today'
    if (msg.toLowerCase().includes('tomorrow')) return 'tomorrow'
    
    // YYYY-MM-DD
    let match = msg.match(/(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
    
    // "on March 10" or "March 10th"
    match = msg.match(/(?:on\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i)
    if (match) return match[1]
    
    // "on the 10th"
    match = msg.match(/on\s+(?:the\s+)?(\d{1,2}(?:st|nd|rd|th)?)/i)
    if (match) return match[1]
    
    return 'today'
  }
  
  // Create leave request patterns
  if ((lower.includes('leave') || lower.includes('time off') || lower.includes('vacation')) && 
      (lower.includes('create') || lower.includes('request') || lower.includes('book') || lower.includes('submit'))) {
    const typeMatch = message.match(/(annual|sick|personal|unpaid)/i)
    
    return {
      action: 'create_leave',
      params: {
        employee: extractEmployeeName(message),
        date: extractDate(message),
        type: typeMatch?.[1] || 'annual'
      }
    }
  }
  
  // Create swap request patterns
  if (lower.includes('swap') && (lower.includes('create') || lower.includes('request') || lower.includes('initiate'))) {
    const withMatch = message.match(/with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    
    return {
      action: 'create_swap',
      params: {
        requester: extractEmployeeName(message),
        target: withMatch?.[1] || '',
        date: extractDate(message)
      }
    }
  }
  
  // Create shift/schedule patterns
  if ((lower.includes('shift') || lower.includes('schedule') || lower.includes('adhoc') || lower.includes('assign')) && 
      (lower.includes('create') || lower.includes('add') || lower.includes('assign') || lower.includes('schedule'))) {
    const shiftMatch = message.match(/(morning|afternoon|evening|night)/i)
    const timeMatch = message.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    
    // If no shift type specified, return null to let AI ask for clarification
    if (!shiftMatch && !timeMatch) {
      console.log('[GroqService] No shift type specified, will let AI ask for clarification')
      return null
    }
    
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
        shiftType
      }
    }
  }
  
  // Check availability patterns
  if (lower.includes('available') || lower.includes('availability') || lower.includes('free')) {
    return {
      action: 'check_availability',
      params: {
        employee: extractEmployeeName(message),
        date: extractDate(message)
      }
    }
  }
  
  // Create employee patterns
  if ((lower.includes('employee') || lower.includes('staff') || lower.includes('person') || lower.includes('worker')) && 
      (lower.includes('create') || lower.includes('add') || lower.includes('new') || lower.includes('hire'))) {
    // Extract name - look for "named X" or "called X" or just the name after "employee"
    let nameMatch = message.match(/(?:named|called|name)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    if (!nameMatch) {
      nameMatch = message.match(/(?:employee|staff|person|worker)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    }
    if (!nameMatch) {
      nameMatch = message.match(/add\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    }
    
    const deptMatch = message.match(/(?:to|in|for)\s+(operations|administration|customer service|warehouse|it support)/i)
    const roleMatch = message.match(/(admin|supervisor|employee)/i)
    
    return {
      action: 'create_employee',
      params: {
        name: nameMatch?.[1] || '',
        department: deptMatch?.[1] || '',
        role: roleMatch?.[1] || 'employee'
      }
    }
  }
  
  return null
}

function buildSystemPrompt(userName?: string): string {
  // Get current user's employee data
  const users = dataStore.getUsers()
  const currentUser = users.find(u => u.name === userName) || users[0]
  const employeeId = currentUser?.employeeId
  
  // Get relevant data
  const employees = dataStore.getEmployees()
  const activeEmployees = employees.filter(e => e.status === 'active').slice(0, 30)
  const departments = dataStore.getDepartments()
  const locations = dataStore.getLocations()
  const shiftTypes = dataStore.getShiftTypes()
  
  // Get user's shifts (next 7 days)
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const todayStr = today.toISOString().split('T')[0]
  const nextWeekStr = nextWeek.toISOString().split('T')[0]
  
  const allAssignments = dataStore.getShiftAssignments()
  const userShifts = employeeId 
    ? allAssignments.filter(a => a.employeeId === employeeId && a.date >= todayStr && a.date <= nextWeekStr)
    : []
  
  // Get user's leave balance
  const leaveBalance = employeeId ? dataStore.getLeaveBalances(employeeId) : []
  
  // Get pending leave requests for user
  const leaveRequests = employeeId 
    ? dataStore.getLeaveRequests().filter(l => l.employeeId === employeeId)
    : []
  
  // Get today's schedule (who's working)
  const todayShifts = allAssignments.filter(a => a.date === todayStr)
  const workingToday = todayShifts.map(s => {
    const emp = employees.find(e => e.id === s.employeeId)
    const shift = shiftTypes.find(st => st.id === s.shiftTypeId)
    const loc = locations.find(l => l.id === s.locationId)
    return { name: emp?.name, shift: shift?.name, location: loc?.name }
  })

  // Format user's upcoming shifts
  const upcomingShiftsText = userShifts.map(s => {
    const shift = shiftTypes.find(st => st.id === s.shiftTypeId)
    const loc = locations.find(l => l.id === s.locationId)
    return `- ${s.date}: ${shift?.name} (${shift?.startTime}-${shift?.endTime}) at ${loc?.name}`
  }).join('\n') || 'No shifts scheduled'

  // Format leave balance
  const leaveBalanceText = leaveBalance.map(b => 
    `- ${b.type}: ${b.remaining}/${b.total} days remaining`
  ).join('\n') || 'No leave balance data'

  // Format who's working today by shift
  const morningStaff = workingToday.filter(w => w.shift === 'Morning Shift').map(w => w.name).join(', ') || 'None'
  const afternoonStaff = workingToday.filter(w => w.shift === 'Afternoon Shift').map(w => w.name).join(', ') || 'None'
  const nightStaff = workingToday.filter(w => w.shift === 'Night Shift').map(w => w.name).join(', ') || 'None'

  // Employee names for reference
  const employeeNames = activeEmployees.map(e => e.name).join(', ')

  return `You are a helpful AI assistant for Workboard, a shift management application.

CURRENT USER: ${userName || 'Unknown'}
ROLE: ${currentUser?.role || 'employee'}
DEPARTMENT: ${departments.find(d => d.id === currentUser?.departmentId)?.name || 'Unknown'}
TODAY'S DATE: ${todayStr}

=== AVAILABLE EMPLOYEES (use these exact names) ===
${employeeNames}

=== USER'S UPCOMING SHIFTS (Next 7 days) ===
${upcomingShiftsText}

=== USER'S LEAVE BALANCE ===
${leaveBalanceText}

=== USER'S LEAVE REQUESTS ===
${leaveRequests.map(l => `- ${l.leaveType} leave: ${l.startDate} to ${l.endDate} (${l.status})`).join('\n') || 'No pending requests'}

=== WHO'S WORKING TODAY (${todayStr}) ===
Morning Shift (6AM-2PM): ${morningStaff}
Afternoon Shift (2PM-10PM): ${afternoonStaff}
Night Shift (10PM-6AM): ${nightStaff}

=== AVAILABLE LOCATIONS ===
${locations.map(l => `- ${l.name} (${l.city})`).join('\n')}

=== SHIFT TYPES ===
${shiftTypes.map(s => `- ${s.name}: ${s.startTime}-${s.endTime}`).join('\n')}

=== INSTRUCTIONS ===
- Answer questions using the ACTUAL DATA above
- When asked about schedule, use the user's actual shifts
- When asked about leave balance, use the actual numbers
- When asked who's working, use the actual staff list
- When user asks to create something for a person, use names from AVAILABLE EMPLOYEES
- Be concise and helpful
- Keep the main response as plain text paragraphs
- If you want to suggest follow-up actions, ALWAYS put them at the END in this exact format:

Would you like to:
1. First action option
2. Second action option
3. Third action option

IMPORTANT RULES:
- Only include the "Would you like to:" section when there are clear next steps the user might want to take. Don't add it for simple informational responses.
- When user asks to create/assign a shift WITHOUT specifying the shift type (morning/afternoon/night), you MUST ask them which shift type they want. List the available shift types from the SHIFT TYPES section above.
- When creating shifts, always confirm the employee name, date, and shift type before proceeding.

You can help with:
- Viewing schedules and shifts
- Requesting time off
- Swapping shifts with colleagues
- Checking who's working
- Leave balance inquiries
- Creating employees
- Assigning shifts`
}

class GroqService {
  private conversationHistory: GroqMessage[] = []
  private apiKey: string

  constructor(apiKey: string = GROQ_API_KEY) {
    this.apiKey = apiKey
  }

  async getResponse(userMessage: string, userName?: string): Promise<GroqResponse> {
    // First, check if this is an action request and execute it
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
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
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
    // First, check if this is an action request and execute it
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

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Groq API error: ${response.status}`)
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
