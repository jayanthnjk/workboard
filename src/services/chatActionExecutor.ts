// Chat Action Executor - Executes actions from AI chat and persists to dataStore
import { dataStore } from './dataStore'

export interface ActionResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

export interface ParsedAction {
  type: 'create_leave_request' | 'create_swap_request' | 'create_shift' | 'check_availability' | 'approve_request' | 'decline_request' | 'none'
  params: Record<string, string>
}

// Find employee by name (improved fuzzy match)
function findEmployeeByName(name: string) {
  if (!name || name.trim() === '') {
    console.log('[ChatAction] findEmployeeByName: empty name provided')
    return null
  }
  
  const employees = dataStore.getEmployees()
  const searchName = name.toLowerCase().trim()
  
  console.log('[ChatAction] findEmployeeByName: searching for "' + searchName + '" among', employees.length, 'employees')
  
  // Try exact match first
  let match = employees.find(e => e.name.toLowerCase() === searchName)
  if (match) {
    console.log('[ChatAction] findEmployeeByName: exact match found:', match.name)
    return match
  }
  
  // Try first name match
  match = employees.find(e => e.name.toLowerCase().split(' ')[0] === searchName)
  if (match) {
    console.log('[ChatAction] findEmployeeByName: first name match found:', match.name)
    return match
  }
  
  // Try last name match
  match = employees.find(e => {
    const parts = e.name.toLowerCase().split(' ')
    return parts[parts.length - 1] === searchName
  })
  if (match) {
    console.log('[ChatAction] findEmployeeByName: last name match found:', match.name)
    return match
  }
  
  // Try partial match (name contains search term)
  match = employees.find(e => e.name.toLowerCase().includes(searchName))
  if (match) {
    console.log('[ChatAction] findEmployeeByName: partial match found:', match.name)
    return match
  }
  
  // Try if search term contains any part of name
  match = employees.find(e => {
    const parts = e.name.toLowerCase().split(' ')
    return parts.some(part => searchName.includes(part) && part.length > 2)
  })
  if (match) {
    console.log('[ChatAction] findEmployeeByName: reverse partial match found:', match.name)
    return match
  }
  
  console.log('[ChatAction] findEmployeeByName: no match found for "' + searchName + '"')
  console.log('[ChatAction] Available employee names:', employees.map(e => e.name))
  return null
}

// Get list of employee names for context
export function getEmployeeNames(): string[] {
  return dataStore.getEmployees()
    .filter(e => e.status === 'active')
    .slice(0, 20)
    .map(e => e.name)
}

// Check if employee has a shift on given date
function checkEmployeeAvailability(employeeId: string, date: string): { available: boolean; existingShift?: string } {
  const assignments = dataStore.getShiftAssignmentsByEmployee(employeeId)
  const existingShift = assignments.find(a => a.date === date)
  
  if (existingShift) {
    const shiftType = dataStore.getShiftTypeById(existingShift.shiftTypeId)
    return { 
      available: false, 
      existingShift: shiftType?.name || 'Unknown shift'
    }
  }
  
  // Check leave requests
  const leaveRequests = dataStore.getLeaveRequestsByEmployee(employeeId)
  const onLeave = leaveRequests.find(l => 
    l.status === 'approved' && 
    date >= l.startDate && 
    date <= l.endDate
  )
  
  if (onLeave) {
    return { available: false, existingShift: `On ${onLeave.leaveType} leave` }
  }
  
  return { available: true }
}

// Parse date from natural language (improved)
function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  
  const today = new Date()
  const lower = dateStr.toLowerCase().trim()
  
  if (lower === 'today' || lower.includes('today')) {
    return today.toISOString().split('T')[0]
  }
  if (lower === 'tomorrow' || lower.includes('tomorrow')) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }
  if (lower.includes('next week')) {
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek.toISOString().split('T')[0]
  }
  
  // Try to parse YYYY-MM-DD format
  const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) {
    return isoMatch[1]
  }
  
  // Try to parse "March 10" or "10 March" format
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
  const monthMatch = lower.match(/(\d{1,2})\s*(st|nd|rd|th)?\s*(january|february|march|april|may|june|july|august|september|october|november|december)|((january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{1,2}))/i)
  
  if (monthMatch) {
    let day: number, monthName: string
    if (monthMatch[1]) {
      day = parseInt(monthMatch[1])
      monthName = monthMatch[3]
    } else {
      monthName = monthMatch[5]
      day = parseInt(monthMatch[6])
    }
    const month = monthNames.indexOf(monthName.toLowerCase())
    if (month !== -1) {
      const year = today.getFullYear()
      const date = new Date(year, month, day)
      // If date is in the past, assume next year
      if (date < today) {
        date.setFullYear(year + 1)
      }
      return date.toISOString().split('T')[0]
    }
  }
  
  // Try generic date parse
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  
  return today.toISOString().split('T')[0]
}


// Create a leave request
export function createLeaveRequest(
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  reason: string
): ActionResult {
  const employee = findEmployeeByName(employeeName)
  if (!employee) {
    return { success: false, message: `Could not find employee "${employeeName}"` }
  }
  
  // Check availability for the date range
  const start = parseDate(startDate)
  const end = parseDate(endDate || startDate)
  
  const availability = checkEmployeeAvailability(employee.id, start)
  if (!availability.available) {
    return { 
      success: false, 
      message: `${employee.name} is not available on ${start}. They have: ${availability.existingShift}`
    }
  }
  
  // Create the leave request
  const leaveRequest = dataStore.createLeaveRequest({
    employeeId: employee.id,
    leaveType: leaveType.toLowerCase() as 'annual' | 'sick' | 'personal' | 'unpaid',
    startDate: start,
    endDate: end,
    reason: reason || 'Requested via AI assistant',
    status: 'pending',
    affectedShifts: [],
  })
  
  // Create audit entry
  dataStore.createAuditEntry({
    userId: 'user-1',
    userName: 'AI Assistant',
    action: 'create',
    entityType: 'leave-request',
    entityId: leaveRequest.id,
    entityName: `Leave Request for ${employee.name}`,
    afterValue: { leaveType, startDate: start, endDate: end },
  })
  
  return {
    success: true,
    message: `Leave request created for ${employee.name} (${leaveType}) from ${start} to ${end}. Status: Pending approval.`,
    data: { id: leaveRequest.id, employeeName: employee.name }
  }
}

// Create a swap request
export function createSwapRequest(
  requesterName: string,
  targetName: string,
  shiftDate: string,
  reason: string
): ActionResult {
  const requester = findEmployeeByName(requesterName)
  const target = findEmployeeByName(targetName)
  
  if (!requester) {
    return { success: false, message: `Could not find employee "${requesterName}"` }
  }
  if (!target) {
    return { success: false, message: `Could not find employee "${targetName}"` }
  }
  
  const date = parseDate(shiftDate)
  
  // Find requester's shift on that date
  const requesterShifts = dataStore.getShiftAssignmentsByEmployee(requester.id)
  const requesterShift = requesterShifts.find(s => s.date === date)
  
  if (!requesterShift) {
    return { success: false, message: `${requester.name} has no shift on ${date}` }
  }
  
  // Find target's shift on that date
  const targetShifts = dataStore.getShiftAssignmentsByEmployee(target.id)
  const targetShift = targetShifts.find(s => s.date === date)
  
  if (!targetShift) {
    return { success: false, message: `${target.name} has no shift on ${date} to swap with` }
  }
  
  // Create swap request
  const swapRequest = dataStore.createSwapRequest({
    requesterId: requester.id,
    targetId: target.id,
    requesterShiftId: requesterShift.id,
    targetShiftId: targetShift.id,
    reason: reason || 'Requested via AI assistant',
    status: 'pending',
    requesterAccepted: true,
    targetAccepted: false,
  })
  
  dataStore.createAuditEntry({
    userId: 'user-1',
    userName: 'AI Assistant',
    action: 'create',
    entityType: 'swap-request',
    entityId: swapRequest.id,
    entityName: `Swap Request: ${requester.name} ↔ ${target.name}`,
    afterValue: { date, requester: requester.name, target: target.name },
  })
  
  return {
    success: true,
    message: `Swap request created: ${requester.name} wants to swap shift with ${target.name} on ${date}. Waiting for ${target.name}'s confirmation.`,
    data: { id: swapRequest.id }
  }
}

// Create a shift assignment
export function createShiftAssignment(
  employeeName: string,
  shiftType: string,
  date: string,
  locationName?: string
): ActionResult {
  console.log('[ChatAction] createShiftAssignment called:', { employeeName, shiftType, date, locationName })
  
  const employee = findEmployeeByName(employeeName)
  if (!employee) {
    console.log('[ChatAction] Employee not found:', employeeName)
    return { success: false, message: `Could not find employee "${employeeName}"` }
  }
  
  console.log('[ChatAction] Found employee:', employee.name, employee.id)
  
  const parsedDate = parseDate(date)
  console.log('[ChatAction] Parsed date:', parsedDate)
  
  // Check availability
  const availability = checkEmployeeAvailability(employee.id, parsedDate)
  if (!availability.available) {
    return {
      success: false,
      message: `${employee.name} is not available on ${parsedDate}. They have: ${availability.existingShift}`
    }
  }
  
  // Find shift type
  const shiftTypes = dataStore.getShiftTypes()
  console.log('[ChatAction] Available shift types:', shiftTypes.map(s => s.name))
  
  const shift = shiftTypes.find(s => 
    s.name.toLowerCase().includes(shiftType.toLowerCase()) ||
    shiftType.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
  )
  
  if (!shift) {
    return { success: false, message: `Could not find shift type "${shiftType}". Available: ${shiftTypes.map(s => s.name).join(', ')}` }
  }
  
  console.log('[ChatAction] Found shift type:', shift.name, shift.id)
  
  // Find location
  const locations = dataStore.getLocations()
  const location = locationName 
    ? locations.find(l => l.name.toLowerCase().includes(locationName.toLowerCase()))
    : locations[0]
  
  if (!location) {
    return { success: false, message: `Could not find location "${locationName}"` }
  }
  
  console.log('[ChatAction] Using location:', location.name, location.id)
  
  // Create assignment
  const assignment = dataStore.createShiftAssignment({
    employeeId: employee.id,
    shiftTypeId: shift.id,
    date: parsedDate,
    locationId: location.id,
    status: 'scheduled',
    createdBy: 'user-1',
  })
  
  console.log('[ChatAction] Created shift assignment:', assignment)
  
  dataStore.createAuditEntry({
    userId: 'user-1',
    userName: 'AI Assistant',
    action: 'create',
    entityType: 'shift-assignment',
    entityId: assignment.id,
    entityName: `Shift for ${employee.name}`,
    afterValue: { date: parsedDate, shift: shift.name, location: location.name },
  })
  
  return {
    success: true,
    message: `Shift created: ${employee.name} assigned to ${shift.name} (${shift.startTime}-${shift.endTime}) at ${location.name} on ${parsedDate}.`,
    data: { id: assignment.id }
  }
}

// Check employee availability
export function checkAvailability(employeeName: string, date: string): ActionResult {
  console.log('[ChatAction] checkAvailability called:', { employeeName, date })
  
  const employee = findEmployeeByName(employeeName)
  if (!employee) {
    console.log('[ChatAction] Employee not found for availability check:', employeeName)
    // List available employees for debugging
    const employees = dataStore.getEmployees()
    console.log('[ChatAction] Available employees:', employees.map(e => e.name))
    return { success: false, message: `Could not find employee "${employeeName}"` }
  }
  
  console.log('[ChatAction] Found employee for availability check:', employee.name, employee.id)
  
  const parsedDate = parseDate(date)
  console.log('[ChatAction] Checking availability for date:', parsedDate)
  
  const availability = checkEmployeeAvailability(employee.id, parsedDate)
  console.log('[ChatAction] Availability result:', availability)
  
  if (availability.available) {
    return {
      success: true,
      message: `${employee.name} is available on ${parsedDate}. No existing shifts or leave.`
    }
  } else {
    return {
      success: true,
      message: `${employee.name} is NOT available on ${parsedDate}. Reason: ${availability.existingShift}`
    }
  }
}

// Execute action based on parsed intent
export function executeAction(action: ParsedAction): ActionResult {
  switch (action.type) {
    case 'create_leave_request':
      return createLeaveRequest(
        action.params.employee || '',
        action.params.leaveType || 'annual',
        action.params.startDate || 'today',
        action.params.endDate || action.params.startDate || 'today',
        action.params.reason || ''
      )
    
    case 'create_swap_request':
      return createSwapRequest(
        action.params.requester || '',
        action.params.target || '',
        action.params.date || 'today',
        action.params.reason || ''
      )
    
    case 'create_shift':
      return createShiftAssignment(
        action.params.employee || '',
        action.params.shiftType || 'morning',
        action.params.date || 'today',
        action.params.location
      )
    
    case 'check_availability':
      return checkAvailability(
        action.params.employee || '',
        action.params.date || 'today'
      )
    
    default:
      return { success: false, message: 'Unknown action type' }
  }
}


// Create a new employee
export function createEmployee(
  name: string,
  email?: string,
  departmentName?: string,
  role?: string
): ActionResult {
  console.log('[ChatAction] createEmployee called:', { name, email, departmentName, role })
  
  if (!name || name.trim() === '') {
    return { success: false, message: 'Employee name is required' }
  }
  
  // Check if employee already exists
  const existing = findEmployeeByName(name)
  if (existing) {
    return { success: false, message: `Employee "${name}" already exists` }
  }
  
  // Find department
  const departments = dataStore.getDepartments()
  const department = departmentName 
    ? departments.find(d => d.name.toLowerCase().includes(departmentName.toLowerCase()))
    : departments[0]
  
  // Generate employee ID
  const employees = dataStore.getEmployees()
  const nextId = employees.length + 1
  const employeeId = `EMP${String(nextId).padStart(4, '0')}`
  
  // Generate email if not provided
  const generatedEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@workboard.com`
  
  // Create the employee
  const newEmployee = dataStore.createEmployee({
    employeeId,
    name: name.trim(),
    email: generatedEmail,
    phone: '+44 7000000000',
    departmentId: department?.id || 'dept-1',
    role: (role as 'admin' | 'supervisor' | 'employee') || 'employee',
    skills: [],
    status: 'active',
    hireDate: new Date().toISOString(),
    preferences: {
      preferredShifts: ['morning', 'afternoon'],
      unavailableDays: [],
      maxHoursPerWeek: 40,
      preferredLocations: [],
    },
  })
  
  console.log('[ChatAction] Created employee:', newEmployee)
  
  // Create audit entry
  dataStore.createAuditEntry({
    userId: 'user-1',
    userName: 'AI Assistant',
    action: 'create',
    entityType: 'employee',
    entityId: newEmployee.id,
    entityName: newEmployee.name,
    afterValue: { name: newEmployee.name, email: generatedEmail, department: department?.name },
  })
  
  // Initialize leave balance for new employee - access private data properly
  try {
    const storeData = (dataStore as any).data
    if (storeData && storeData.leaveBalances) {
      storeData.leaveBalances[newEmployee.id] = [
        { type: 'annual', total: 25, used: 0, remaining: 25 },
        { type: 'sick', total: 10, used: 0, remaining: 10 },
        { type: 'personal', total: 5, used: 0, remaining: 5 },
      ]
      // Save to localStorage
      ;(dataStore as any).saveToStorage()
      console.log('[ChatAction] Initialized leave balance for:', newEmployee.id)
    }
  } catch (e) {
    console.error('[ChatAction] Failed to initialize leave balance:', e)
  }
  
  return {
    success: true,
    message: `Employee "${newEmployee.name}" created successfully with ID ${employeeId}. They have been added to ${department?.name || 'Operations'} department.`,
    data: { id: newEmployee.id, employeeId, name: newEmployee.name }
  }
}
