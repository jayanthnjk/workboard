import { dataStore } from './dataStore'
import { rotationService } from './rotationService'
import { leaveConflictService } from './leaveConflictService'
import type {
  User,
  Department,
  Location,
  Employee,
  ShiftType,
  ShiftPattern,
  RotationRule,
  ShiftAssignment,
  LeaveRequest,
  SwapRequest,
  AdhocRequest,
  Notification,
  AuditEntry,
  ApiResponse,
  PaginatedResponse,
  Credentials,
  // Karnataka Police types
  Personnel,
  Section,
  Platoon,
  GuardLocation,
  VIPEscortAssignment,
  GunmanAssignment,
  PlatoonRotation,
  RotationScheduleEntry,
  StrikingForceConfig,
  TrainingProgram,
  RecruitAPC,
  StrengthSummary,
  KPLeaveRequest,
  KPLeaveBalance,
  Form168Entry,
  Form168Daily,
  SectionType,
  PlatoonId,
  RotationalDutyType,
  PoliceRank,
} from '@/types'

// Configuration
const config = {
  minDelay: 200,
  maxDelay: 500,
  errorRate: 0, // Set to > 0 to simulate random errors (0-1)
}

// Utility functions
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

const getRandomDelay = (): number => 
  Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay

const shouldSimulateError = (): boolean => 
  config.errorRate > 0 && Math.random() < config.errorRate

const logApiCall = (method: string, endpoint: string, data?: unknown): void => {
  console.log(`[API] ${method} ${endpoint}`, data ? { data } : '')
}

const createResponse = <T>(data: T, success = true, message?: string): ApiResponse<T> => ({
  data,
  success,
  message,
})

const createErrorResponse = <T>(error: string): ApiResponse<T> => ({
  data: null as T,
  success: false,
  error,
})

const createPaginatedResponse = <T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResponse<T> => {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedItems = items.slice(start, end)
  
  return {
    data: paginatedItems,
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  }
}

// API Gateway class
class ApiGateway {
  // Configuration
  setConfig(newConfig: Partial<typeof config>): void {
    Object.assign(config, newConfig)
  }

  // Authentication
  async login(credentials: Credentials): Promise<ApiResponse<User>> {
    logApiCall('POST', '/api/auth/login', { username: credentials.username })
    await delay(getRandomDelay())
    
    if (shouldSimulateError()) {
      return createErrorResponse('Network error')
    }
    
    const user = dataStore.getUserByUsername(credentials.username)
    
    // Simple password check (in real app, this would be hashed)
    if (user && credentials.password === 'password123') {
      return createResponse(user, true, 'Login successful')
    }
    
    return createErrorResponse('Invalid credentials')
  }

  async logout(): Promise<ApiResponse<void>> {
    logApiCall('POST', '/api/auth/logout')
    await delay(getRandomDelay())
    return createResponse(undefined, true, 'Logout successful')
  }

  // Users
  async getUsers(): Promise<ApiResponse<User[]>> {
    logApiCall('GET', '/api/users')
    await delay(getRandomDelay())
    
    if (shouldSimulateError()) {
      return createErrorResponse('Failed to fetch users')
    }
    
    return createResponse(dataStore.getUsers())
  }

  async getUserById(id: string): Promise<ApiResponse<User | undefined>> {
    logApiCall('GET', `/api/users/${id}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getUserById(id))
  }

  // Departments
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    logApiCall('GET', '/api/departments')
    await delay(getRandomDelay())
    
    if (shouldSimulateError()) {
      return createErrorResponse('Failed to fetch departments')
    }
    
    // Sort by createdAt descending (newest first)
    const departments = dataStore.getDepartments().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return createResponse(departments)
  }

  async getDepartmentById(id: string): Promise<ApiResponse<Department | undefined>> {
    logApiCall('GET', `/api/departments/${id}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getDepartmentById(id))
  }

  async createDepartment(department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Department>> {
    logApiCall('POST', '/api/departments', department)
    await delay(getRandomDelay())
    
    if (shouldSimulateError()) {
      return createErrorResponse('Failed to create department')
    }
    
    // Check for duplicate code
    const existing = dataStore.getDepartments().find(d => d.code === department.code)
    if (existing) {
      return createErrorResponse('Department code already exists')
    }
    
    const newDept = dataStore.createDepartment(department)
    return createResponse(newDept, true, 'Department created successfully')
  }

  async updateDepartment(id: string, updates: Partial<Department>): Promise<ApiResponse<Department | undefined>> {
    logApiCall('PUT', `/api/departments/${id}`, updates)
    await delay(getRandomDelay())
    
    if (shouldSimulateError()) {
      return createErrorResponse('Failed to update department')
    }
    
    const updated = dataStore.updateDepartment(id, updates)
    if (!updated) {
      return createErrorResponse('Department not found')
    }
    
    return createResponse(updated, true, 'Department updated successfully')
  }

  async deleteDepartment(id: string): Promise<ApiResponse<void>> {
    logApiCall('DELETE', `/api/departments/${id}`)
    await delay(getRandomDelay())
    
    // Check for dependent employees
    const employees = dataStore.getEmployees().filter(e => e.departmentId === id)
    if (employees.length > 0) {
      return createErrorResponse('Cannot delete department with assigned employees')
    }
    
    const deleted = dataStore.deleteDepartment(id)
    if (!deleted) {
      return createErrorResponse('Department not found')
    }
    
    return createResponse(undefined, true, 'Department deleted successfully')
  }

  // Locations
  async getLocations(): Promise<ApiResponse<Location[]>> {
    logApiCall('GET', '/api/locations')
    await delay(getRandomDelay())
    
    // Sort by createdAt descending (newest first)
    const locations = dataStore.getLocations().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return createResponse(locations)
  }

  async getLocationById(id: string): Promise<ApiResponse<Location | undefined>> {
    logApiCall('GET', `/api/locations/${id}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getLocationById(id))
  }

  async createLocation(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Location>> {
    logApiCall('POST', '/api/locations', location)
    await delay(getRandomDelay())
    
    const newLoc = dataStore.createLocation(location)
    return createResponse(newLoc, true, 'Location created successfully')
  }

  async updateLocation(id: string, updates: Partial<Location>): Promise<ApiResponse<Location | undefined>> {
    logApiCall('PUT', `/api/locations/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateLocation(id, updates)
    if (!updated) {
      return createErrorResponse('Location not found')
    }
    
    return createResponse(updated, true, 'Location updated successfully')
  }

  async deleteLocation(id: string): Promise<ApiResponse<void>> {
    logApiCall('DELETE', `/api/locations/${id}`)
    await delay(getRandomDelay())
    
    const deleted = dataStore.deleteLocation(id)
    if (!deleted) {
      return createErrorResponse('Location not found')
    }
    
    return createResponse(undefined, true, 'Location deleted successfully')
  }

  // Employees
  async getEmployees(page = 1, pageSize = 20): Promise<PaginatedResponse<Employee>> {
    logApiCall('GET', `/api/employees?page=${page}&pageSize=${pageSize}`)
    await delay(getRandomDelay())
    
    const employees = dataStore.getEmployees()
    return createPaginatedResponse(employees, page, pageSize)
  }

  async getAllEmployees(): Promise<ApiResponse<Employee[]>> {
    logApiCall('GET', '/api/employees/all')
    await delay(getRandomDelay())
    
    // Sort by createdAt descending (newest first)
    const employees = dataStore.getEmployees().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return createResponse(employees)
  }

  async getEmployeeById(id: string): Promise<ApiResponse<Employee | undefined>> {
    logApiCall('GET', `/api/employees/${id}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getEmployeeById(id))
  }

  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Employee>> {
    logApiCall('POST', '/api/employees', employee)
    await delay(getRandomDelay())
    
    // Check for duplicate employee ID
    const existing = dataStore.getEmployeeByEmployeeId(employee.employeeId)
    if (existing) {
      return createErrorResponse('Employee ID already exists')
    }
    
    const newEmp = dataStore.createEmployee(employee)
    return createResponse(newEmp, true, 'Employee created successfully')
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<ApiResponse<Employee | undefined>> {
    logApiCall('PUT', `/api/employees/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateEmployee(id, updates)
    if (!updated) {
      return createErrorResponse('Employee not found')
    }
    
    return createResponse(updated, true, 'Employee updated successfully')
  }

  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    logApiCall('DELETE', `/api/employees/${id}`)
    await delay(getRandomDelay())
    
    const deleted = dataStore.deleteEmployee(id)
    if (!deleted) {
      return createErrorResponse('Employee not found')
    }
    
    return createResponse(undefined, true, 'Employee deleted successfully')
  }

  // Shift Types
  async getShiftTypes(): Promise<ApiResponse<ShiftType[]>> {
    logApiCall('GET', '/api/shift-types')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getShiftTypes())
  }

  async getShiftTypeById(id: string): Promise<ApiResponse<ShiftType | undefined>> {
    logApiCall('GET', `/api/shift-types/${id}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getShiftTypeById(id))
  }

  async createShiftType(shiftType: Omit<ShiftType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ShiftType>> {
    logApiCall('POST', '/api/shift-types', shiftType)
    await delay(getRandomDelay())
    
    const newShift = dataStore.createShiftType(shiftType)
    return createResponse(newShift, true, 'Shift type created successfully')
  }

  async updateShiftType(id: string, updates: Partial<ShiftType>): Promise<ApiResponse<ShiftType | undefined>> {
    logApiCall('PUT', `/api/shift-types/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateShiftType(id, updates)
    if (!updated) {
      return createErrorResponse('Shift type not found')
    }
    
    return createResponse(updated, true, 'Shift type updated successfully')
  }

  async deleteShiftType(id: string): Promise<ApiResponse<void>> {
    logApiCall('DELETE', `/api/shift-types/${id}`)
    await delay(getRandomDelay())
    
    const deleted = dataStore.deleteShiftType(id)
    if (!deleted) {
      return createErrorResponse('Shift type not found')
    }
    
    return createResponse(undefined, true, 'Shift type deleted successfully')
  }

  // Shift Patterns
  async getShiftPatterns(): Promise<ApiResponse<ShiftPattern[]>> {
    logApiCall('GET', '/api/shift-patterns')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getShiftPatterns())
  }

  async createShiftPattern(pattern: Omit<ShiftPattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ShiftPattern>> {
    logApiCall('POST', '/api/shift-patterns', pattern)
    await delay(getRandomDelay())
    
    const newPattern = dataStore.createShiftPattern(pattern)
    return createResponse(newPattern, true, 'Shift pattern created successfully')
  }

  async updateShiftPattern(id: string, updates: Partial<ShiftPattern>): Promise<ApiResponse<ShiftPattern | undefined>> {
    logApiCall('PUT', `/api/shift-patterns/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateShiftPattern(id, updates)
    if (!updated) {
      return createErrorResponse('Shift pattern not found')
    }
    
    return createResponse(updated, true, 'Shift pattern updated successfully')
  }

  async deleteShiftPattern(id: string): Promise<ApiResponse<void>> {
    logApiCall('DELETE', `/api/shift-patterns/${id}`)
    await delay(getRandomDelay())
    
    const deleted = dataStore.deleteShiftPattern(id)
    if (!deleted) {
      return createErrorResponse('Shift pattern not found')
    }
    
    return createResponse(undefined, true, 'Shift pattern deleted successfully')
  }

  // Rotation Rules
  async getRotationRules(): Promise<ApiResponse<RotationRule[]>> {
    logApiCall('GET', '/api/rotation-rules')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getRotationRules())
  }

  async createRotationRule(rule: Omit<RotationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<RotationRule>> {
    logApiCall('POST', '/api/rotation-rules', rule)
    await delay(getRandomDelay())
    
    const newRule = dataStore.createRotationRule(rule)
    return createResponse(newRule, true, 'Rotation rule created successfully')
  }

  async updateRotationRule(id: string, updates: Partial<RotationRule>): Promise<ApiResponse<RotationRule | undefined>> {
    logApiCall('PUT', `/api/rotation-rules/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateRotationRule(id, updates)
    if (!updated) {
      return createErrorResponse('Rotation rule not found')
    }
    
    return createResponse(updated, true, 'Rotation rule updated successfully')
  }

  async deleteRotationRule(id: string): Promise<ApiResponse<void>> {
    logApiCall('DELETE', `/api/rotation-rules/${id}`)
    await delay(getRandomDelay())
    
    const deleted = dataStore.deleteRotationRule(id)
    if (!deleted) {
      return createErrorResponse('Rotation rule not found')
    }
    
    return createResponse(undefined, true, 'Rotation rule deleted successfully')
  }

  // Shift Assignments
  async getShiftAssignments(startDate?: string, endDate?: string): Promise<ApiResponse<ShiftAssignment[]>> {
    logApiCall('GET', `/api/shift-assignments?start=${startDate}&end=${endDate}`)
    await delay(getRandomDelay())
    
    let assignments = dataStore.getShiftAssignments()
    if (startDate && endDate) {
      assignments = dataStore.getShiftAssignmentsByDateRange(startDate, endDate)
    }
    
    // Sort by createdAt descending (newest first)
    assignments = assignments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return createResponse(assignments)
  }

  async getShiftAssignmentsByEmployee(employeeId: string): Promise<ApiResponse<ShiftAssignment[]>> {
    logApiCall('GET', `/api/shift-assignments/employee/${employeeId}`)
    await delay(getRandomDelay())
    
    // Sort by createdAt descending (newest first)
    const assignments = dataStore.getShiftAssignmentsByEmployee(employeeId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return createResponse(assignments)
  }

  async createShiftAssignment(assignment: Omit<ShiftAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ShiftAssignment>> {
    logApiCall('POST', '/api/shift-assignments', assignment)
    await delay(getRandomDelay())
    
    const newAssignment = dataStore.createShiftAssignment(assignment)
    return createResponse(newAssignment, true, 'Shift assignment created successfully')
  }

  async updateShiftAssignment(id: string, updates: Partial<ShiftAssignment>): Promise<ApiResponse<ShiftAssignment | undefined>> {
    logApiCall('PUT', `/api/shift-assignments/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateShiftAssignment(id, updates)
    if (!updated) {
      return createErrorResponse('Shift assignment not found')
    }
    
    return createResponse(updated, true, 'Shift assignment updated successfully')
  }

  async deleteShiftAssignment(id: string): Promise<ApiResponse<void>> {
    logApiCall('DELETE', `/api/shift-assignments/${id}`)
    await delay(getRandomDelay())
    
    const deleted = dataStore.deleteShiftAssignment(id)
    if (!deleted) {
      return createErrorResponse('Shift assignment not found')
    }
    
    return createResponse(undefined, true, 'Shift assignment deleted successfully')
  }

  // Leave Requests
  async getLeaveRequests(): Promise<ApiResponse<LeaveRequest[]>> {
    logApiCall('GET', '/api/leave-requests')
    await delay(getRandomDelay())
    
    // Sort by createdAt descending (newest first)
    const requests = dataStore.getLeaveRequests().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return createResponse(requests)
  }

  async getLeaveRequestsByEmployee(employeeId: string): Promise<ApiResponse<LeaveRequest[]>> {
    logApiCall('GET', `/api/leave-requests/employee/${employeeId}`)
    await delay(getRandomDelay())
    
    // Sort by createdAt descending (newest first)
    const requests = dataStore.getLeaveRequestsByEmployee(employeeId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return createResponse(requests)
  }

  async createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<LeaveRequest>> {
    logApiCall('POST', '/api/leave-requests', request)
    await delay(getRandomDelay())
    
    const newRequest = dataStore.createLeaveRequest(request)
    return createResponse(newRequest, true, 'Leave request created successfully')
  }

  async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<ApiResponse<LeaveRequest | undefined>> {
    logApiCall('PUT', `/api/leave-requests/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateLeaveRequest(id, updates)
    if (!updated) {
      return createErrorResponse('Leave request not found')
    }
    
    return createResponse(updated, true, 'Leave request updated successfully')
  }

  // Swap Requests
  async getSwapRequests(): Promise<ApiResponse<SwapRequest[]>> {
    logApiCall('GET', '/api/swap-requests')
    await delay(getRandomDelay())
    
    // Sort by createdAt descending (newest first)
    const requests = dataStore.getSwapRequests().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return createResponse(requests)
  }

  async createSwapRequest(request: Omit<SwapRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<SwapRequest>> {
    logApiCall('POST', '/api/swap-requests', request)
    await delay(getRandomDelay())
    
    const newRequest = dataStore.createSwapRequest(request)
    return createResponse(newRequest, true, 'Swap request created successfully')
  }

  async updateSwapRequest(id: string, updates: Partial<SwapRequest>): Promise<ApiResponse<SwapRequest | undefined>> {
    logApiCall('PUT', `/api/swap-requests/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateSwapRequest(id, updates)
    if (!updated) {
      return createErrorResponse('Swap request not found')
    }
    
    return createResponse(updated, true, 'Swap request updated successfully')
  }

  // Adhoc Requests
  async getAdhocRequests(): Promise<ApiResponse<AdhocRequest[]>> {
    logApiCall('GET', '/api/adhoc-requests')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getAdhocRequests())
  }

  async createAdhocRequest(request: Omit<AdhocRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<AdhocRequest>> {
    logApiCall('POST', '/api/adhoc-requests', request)
    await delay(getRandomDelay())
    
    const newRequest = dataStore.createAdhocRequest(request)
    return createResponse(newRequest, true, 'Adhoc request created successfully')
  }

  async updateAdhocRequest(id: string, updates: Partial<AdhocRequest>): Promise<ApiResponse<AdhocRequest | undefined>> {
    logApiCall('PUT', `/api/adhoc-requests/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateAdhocRequest(id, updates)
    if (!updated) {
      return createErrorResponse('Adhoc request not found')
    }
    
    return createResponse(updated, true, 'Adhoc request updated successfully')
  }

  // Notifications
  async getNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
    logApiCall('GET', `/api/notifications/${userId}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getNotificationsByUser(userId))
  }

  async getUnreadNotificationCount(userId: string): Promise<ApiResponse<number>> {
    logApiCall('GET', `/api/notifications/${userId}/unread-count`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getUnreadNotificationCount(userId))
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<ApiResponse<Notification>> {
    logApiCall('POST', '/api/notifications', notification)
    await delay(getRandomDelay())
    
    const newNotif = dataStore.createNotification(notification)
    return createResponse(newNotif, true, 'Notification created successfully')
  }

  async markNotificationAsRead(id: string): Promise<ApiResponse<void>> {
    logApiCall('PUT', `/api/notifications/${id}/read`)
    await delay(getRandomDelay())
    
    const success = dataStore.markNotificationAsRead(id)
    if (!success) {
      return createErrorResponse('Notification not found')
    }
    
    return createResponse(undefined, true, 'Notification marked as read')
  }

  async markAllNotificationsAsRead(userId: string): Promise<ApiResponse<void>> {
    logApiCall('PUT', `/api/notifications/${userId}/read-all`)
    await delay(getRandomDelay())
    
    dataStore.markAllNotificationsAsRead(userId)
    return createResponse(undefined, true, 'All notifications marked as read')
  }

  // Audit Entries
  async getAuditEntries(page = 1, pageSize = 50): Promise<PaginatedResponse<AuditEntry>> {
    logApiCall('GET', `/api/audit?page=${page}&pageSize=${pageSize}`)
    await delay(getRandomDelay())
    
    const entries = dataStore.getAuditEntries()
    return createPaginatedResponse(entries, page, pageSize)
  }

  async createAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<ApiResponse<AuditEntry>> {
    logApiCall('POST', '/api/audit', entry)
    await delay(getRandomDelay())
    
    const newEntry = dataStore.createAuditEntry(entry)
    return createResponse(newEntry, true, 'Audit entry created successfully')
  }

  // Leave Balances
  async getLeaveBalances(employeeId: string): Promise<ApiResponse<{ type: string; total: number; used: number; remaining: number }[]>> {
    logApiCall('GET', `/api/leave-balances/${employeeId}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getLeaveBalances(employeeId))
  }

  // Reset data
  async resetData(): Promise<ApiResponse<void>> {
    logApiCall('POST', '/api/reset')
    await delay(getRandomDelay())
    
    dataStore.reset()
    return createResponse(undefined, true, 'Data reset successfully')
  }

  // =============================================================================
  // Karnataka Police Personnel Endpoints
  // =============================================================================

  async getPersonnel(page = 1, pageSize = 50): Promise<PaginatedResponse<Personnel>> {
    logApiCall('GET', `/api/personnel?page=${page}&pageSize=${pageSize}`)
    await delay(getRandomDelay())
    
    const personnel = dataStore.getPersonnel()
    return createPaginatedResponse(personnel, page, pageSize)
  }

  async getAllPersonnel(): Promise<ApiResponse<Personnel[]>> {
    logApiCall('GET', '/api/personnel/all')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getPersonnel())
  }

  async getPersonnelById(id: string): Promise<ApiResponse<Personnel | undefined>> {
    logApiCall('GET', `/api/personnel/${id}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getPersonnelById(id))
  }

  async getPersonnelBySection(section: SectionType): Promise<ApiResponse<Personnel[]>> {
    logApiCall('GET', `/api/personnel/section/${section}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getPersonnelBySection(section))
  }

  async getPersonnelByPlatoon(platoonId: PlatoonId): Promise<ApiResponse<Personnel[]>> {
    logApiCall('GET', `/api/personnel/platoon/${platoonId}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getPersonnelByPlatoon(platoonId))
  }

  async getPersonnelByRank(rank: PoliceRank): Promise<ApiResponse<Personnel[]>> {
    logApiCall('GET', `/api/personnel/rank/${rank}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getPersonnelByRank(rank))
  }

  async createPersonnel(personnel: Omit<Personnel, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Personnel>> {
    logApiCall('POST', '/api/personnel', personnel)
    await delay(getRandomDelay())
    
    // Check for duplicate personnel ID
    const existing = dataStore.getPersonnelByPersonnelId(personnel.personnelId)
    if (existing) {
      return createErrorResponse('Personnel ID already exists')
    }
    
    const newPersonnel = dataStore.createPersonnel(personnel)
    return createResponse(newPersonnel, true, 'Personnel created successfully')
  }

  async updatePersonnel(id: string, updates: Partial<Personnel>): Promise<ApiResponse<Personnel | undefined>> {
    logApiCall('PUT', `/api/personnel/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updatePersonnel(id, updates)
    if (!updated) {
      return createErrorResponse('Personnel not found')
    }
    
    return createResponse(updated, true, 'Personnel updated successfully')
  }

  // =============================================================================
  // Section and Platoon Endpoints
  // =============================================================================

  async getSections(): Promise<ApiResponse<Section[]>> {
    logApiCall('GET', '/api/sections')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getSections())
  }

  async getPlatoons(): Promise<ApiResponse<Platoon[]>> {
    logApiCall('GET', '/api/platoons')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getPlatoons())
  }

  async getPlatoonById(id: PlatoonId): Promise<ApiResponse<Platoon | undefined>> {
    logApiCall('GET', `/api/platoons/${id}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getPlatoonById(id))
  }

  // =============================================================================
  // Rotation Schedule Endpoints
  // =============================================================================

  async getRotationSchedule(startDate: string, endDate: string): Promise<ApiResponse<RotationScheduleEntry[]>> {
    logApiCall('GET', `/api/rotation-schedule?start=${startDate}&end=${endDate}`)
    await delay(getRandomDelay())
    
    const schedule = rotationService.getRotationSchedule(new Date(startDate), new Date(endDate))
    return createResponse(schedule)
  }

  async getCurrentPlatoonDuties(): Promise<ApiResponse<PlatoonRotation[]>> {
    logApiCall('GET', '/api/rotation-schedule/current')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getCurrentPlatoonRotations())
  }

  async getPlatoonRotations(startDate?: string, endDate?: string): Promise<ApiResponse<PlatoonRotation[]>> {
    logApiCall('GET', `/api/platoon-rotations?start=${startDate}&end=${endDate}`)
    await delay(getRandomDelay())
    
    if (startDate && endDate) {
      return createResponse(dataStore.getPlatoonRotationsByDateRange(startDate, endDate))
    }
    return createResponse(dataStore.getPlatoonRotations())
  }

  async getPlatoonRotationsByCycle(cycleNumber: number): Promise<ApiResponse<PlatoonRotation[]>> {
    logApiCall('GET', `/api/platoon-rotations/cycle/${cycleNumber}`)
    await delay(getRandomDelay())
    return createResponse(dataStore.getPlatoonRotationsByCycle(cycleNumber))
  }

  async assignCycleRotations(rotations: { platoonId: PlatoonId; dutyType: RotationalDutyType; cycleNumber: number; startDate: string; endDate: string }[]): Promise<ApiResponse<PlatoonRotation[]>> {
    logApiCall('POST', '/api/platoon-rotations/assign')
    await delay(getRandomDelay())
    const result = dataStore.addBulkPlatoonRotations(rotations)
    return createResponse(result)
  }

  // =============================================================================
  // Guard Location Endpoints
  // =============================================================================

  async getGuardLocations(): Promise<ApiResponse<GuardLocation[]>> {
    logApiCall('GET', '/api/guard-locations')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getGuardLocations())
  }

  async getActiveGuardLocations(): Promise<ApiResponse<GuardLocation[]>> {
    logApiCall('GET', '/api/guard-locations/active')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getActiveGuardLocations())
  }

  async createGuardLocation(location: Omit<GuardLocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<GuardLocation>> {
    logApiCall('POST', '/api/guard-locations', location)
    await delay(getRandomDelay())
    
    const newLocation = dataStore.createGuardLocation(location)
    return createResponse(newLocation, true, 'Guard location created successfully')
  }

  async updateGuardLocation(id: string, updates: Partial<GuardLocation>): Promise<ApiResponse<GuardLocation | undefined>> {
    logApiCall('PUT', `/api/guard-locations/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateGuardLocation(id, updates)
    if (!updated) {
      return createErrorResponse('Guard location not found')
    }
    
    return createResponse(updated, true, 'Guard location updated successfully')
  }

  // =============================================================================
  // VIP Escort and Gunman Endpoints
  // =============================================================================

  async getVIPEscorts(): Promise<ApiResponse<VIPEscortAssignment[]>> {
    logApiCall('GET', '/api/vip-escorts')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getVIPEscortAssignments())
  }

  async getActiveVIPEscorts(): Promise<ApiResponse<VIPEscortAssignment[]>> {
    logApiCall('GET', '/api/vip-escorts/active')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getActiveVIPEscorts())
  }

  async getGunmanAssignments(): Promise<ApiResponse<GunmanAssignment[]>> {
    logApiCall('GET', '/api/gunman-assignments')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getGunmanAssignments())
  }

  async getActiveGunmanAssignments(): Promise<ApiResponse<GunmanAssignment[]>> {
    logApiCall('GET', '/api/gunman-assignments/active')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getActiveGunmanAssignments())
  }

  // =============================================================================
  // Striking Force Endpoints
  // =============================================================================

  async getStrikingForceTeams(): Promise<ApiResponse<StrikingForceConfig[]>> {
    logApiCall('GET', '/api/striking-force')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getStrikingForceTeams())
  }

  async getActiveStrikingForceTeams(): Promise<ApiResponse<StrikingForceConfig[]>> {
    logApiCall('GET', '/api/striking-force/active')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getActiveStrikingForceTeams())
  }

  // =============================================================================
  // Training and Recruit Endpoints
  // =============================================================================

  async getTrainingPrograms(): Promise<ApiResponse<TrainingProgram[]>> {
    logApiCall('GET', '/api/training-programs')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getTrainingPrograms())
  }

  async getRecruitAPCs(): Promise<ApiResponse<RecruitAPC[]>> {
    logApiCall('GET', '/api/recruit-apcs')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getRecruitAPCs())
  }

  // =============================================================================
  // Strength Summary Endpoint
  // =============================================================================

  async getStrengthSummary(): Promise<ApiResponse<StrengthSummary>> {
    logApiCall('GET', '/api/strength-summary')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getStrengthSummary())
  }

  // =============================================================================
  // KP Leave Endpoints
  // =============================================================================

  async getKPLeaveRequests(): Promise<ApiResponse<KPLeaveRequest[]>> {
    logApiCall('GET', '/api/kp-leave-requests')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getKPLeaveRequests())
  }

  async getKPLeaveRequestsByPersonnel(personnelId: string): Promise<ApiResponse<KPLeaveRequest[]>> {
    logApiCall('GET', `/api/kp-leave-requests/personnel/${personnelId}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getKPLeaveRequestsByPersonnel(personnelId))
  }

  async getPendingKPLeaveRequests(): Promise<ApiResponse<KPLeaveRequest[]>> {
    logApiCall('GET', '/api/kp-leave-requests/pending')
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getPendingKPLeaveRequests())
  }

  async createKPLeaveRequest(request: Omit<KPLeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<KPLeaveRequest>> {
    logApiCall('POST', '/api/kp-leave-requests', request)
    await delay(getRandomDelay())
    
    // Validate the request
    const validation = leaveConflictService.validateLeaveRequest(request)
    if (!validation.valid) {
      return createErrorResponse(validation.errors.join(', '))
    }
    
    const newRequest = dataStore.createKPLeaveRequest(request)
    return createResponse(newRequest, true, 'Leave request created successfully')
  }

  async updateKPLeaveRequest(id: string, updates: Partial<KPLeaveRequest>): Promise<ApiResponse<KPLeaveRequest | undefined>> {
    logApiCall('PUT', `/api/kp-leave-requests/${id}`, updates)
    await delay(getRandomDelay())
    
    const updated = dataStore.updateKPLeaveRequest(id, updates)
    if (!updated) {
      return createErrorResponse('Leave request not found')
    }
    
    return createResponse(updated, true, 'Leave request updated successfully')
  }

  async getKPLeaveBalance(personnelId: string): Promise<ApiResponse<KPLeaveBalance | undefined>> {
    logApiCall('GET', `/api/kp-leave-balance/${personnelId}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getKPLeaveBalance(personnelId))
  }

  // =============================================================================
  // Form 168 Endpoints
  // =============================================================================

  async getForm168Entries(date?: string): Promise<ApiResponse<Form168Entry[]>> {
    logApiCall('GET', `/api/form168/entries?date=${date}`)
    await delay(getRandomDelay())
    
    if (date) {
      return createResponse(dataStore.getForm168EntriesByDate(date))
    }
    return createResponse(dataStore.getForm168Entries())
  }

  async createForm168Entry(entry: Omit<Form168Entry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Form168Entry>> {
    logApiCall('POST', '/api/form168/entries', entry)
    await delay(getRandomDelay())
    
    const newEntry = dataStore.createForm168Entry(entry)
    return createResponse(newEntry, true, 'Form 168 entry created successfully')
  }

  async getForm168Daily(date: string): Promise<ApiResponse<Form168Daily | undefined>> {
    logApiCall('GET', `/api/form168/daily/${date}`)
    await delay(getRandomDelay())
    
    return createResponse(dataStore.getForm168DailyByDate(date))
  }
}

export const apiGateway = new ApiGateway()
export default apiGateway
