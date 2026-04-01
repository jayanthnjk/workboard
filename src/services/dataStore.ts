import { seedData } from '@/data/seedData'
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
  // Karnataka Police types
  Personnel,
  Section,
  Platoon,
  GuardLocation,
  VIPEscortAssignment,
  GunmanAssignment,
  RotationCycle,
  PlatoonRotation,
  StrikingForceConfig,
  TrainingProgram,
  RecruitAPC,
  StrengthSummary,
  KPLeaveBalance,
  KPLeaveRequest,
  Form168Entry,
  Form168Daily,
  PoliceRank,
  SectionType,
  PlatoonId,
  RotationalDutyType,
} from '@/types'

const STORAGE_KEY = 'workboard_data'
const STORAGE_VERSION = '1.1.0'

interface StoredData {
  version: string
  users: User[]
  departments: Department[]
  locations: Location[]
  employees: Employee[]
  shiftTypes: ShiftType[]
  shiftPatterns: ShiftPattern[]
  rotationRules: RotationRule[]
  shiftAssignments: ShiftAssignment[]
  leaveRequests: LeaveRequest[]
  swapRequests: SwapRequest[]
  adhocRequests: AdhocRequest[]
  notifications: Notification[]
  auditEntries: AuditEntry[]
  leaveBalances: Record<string, { type: string; total: number; used: number; remaining: number }[]>
  // Karnataka Police data
  personnel: Personnel[]
  sections: Section[]
  platoons: Platoon[]
  guardLocations: GuardLocation[]
  vipEscortAssignments: VIPEscortAssignment[]
  gunmanAssignments: GunmanAssignment[]
  rotationCycle: RotationCycle
  platoonRotations: PlatoonRotation[]
  strikingForceTeams: StrikingForceConfig[]
  trainingPrograms: TrainingProgram[]
  recruitAPCs: RecruitAPC[]
  strengthSummary: StrengthSummary
  kpLeaveBalances: KPLeaveBalance[]
  kpLeaveRequests: KPLeaveRequest[]
  form168Entries: Form168Entry[]
  form168Dailies: Form168Daily[]
}

class DataStore {
  private data: StoredData

  constructor() {
    this.data = this.loadFromStorage()
  }

  private loadFromStorage(): StoredData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as StoredData
        if (parsed.version === STORAGE_VERSION) {
          console.log('[DataStore] Loaded data from localStorage')
          return parsed
        }
        console.log('[DataStore] Version mismatch, reinitializing with seed data')
      }
    } catch (error) {
      console.error('[DataStore] Error loading from localStorage:', error)
    }
    
    return this.initializeWithSeedData()
  }

  private initializeWithSeedData(): StoredData {
    console.log('[DataStore] Initializing with seed data')
    const data: StoredData = {
      version: STORAGE_VERSION,
      users: seedData.users,
      departments: seedData.departments,
      locations: seedData.locations,
      employees: seedData.employees,
      shiftTypes: seedData.shiftTypes,
      shiftPatterns: seedData.shiftPatterns,
      rotationRules: seedData.rotationRules,
      shiftAssignments: seedData.shiftAssignments,
      leaveRequests: seedData.leaveRequests,
      swapRequests: seedData.swapRequests,
      adhocRequests: [
        { id: 'adhoc-1', createdBy: 'user-1', assignedTo: 'AHC-127', shiftTypeId: 'Emergency CP', date: '2026-02-18', locationId: 'Majestic Interchange', reason: 'Unscheduled protest gathering near bus terminal requiring immediate checkpoint deployment', status: 'pending', createdAt: '2026-02-18T09:30:00Z', updatedAt: '2026-02-18T09:30:00Z' },
        { id: 'adhoc-2', createdBy: 'user-1', assignedTo: 'APC-2539', shiftTypeId: 'Riot Control', date: '2026-02-17', locationId: 'Vidhana Soudha North Gate', reason: 'VVIP movement and high-security alert for state assembly session', status: 'pending', createdAt: '2026-02-17T14:15:00Z', updatedAt: '2026-02-17T14:15:00Z' },
        { id: 'adhoc-3', createdBy: 'user-2', assignedTo: 'AHC-290', shiftTypeId: 'Hospital Guard', date: '2026-02-17', locationId: 'Victoria Hospital Ward 4', reason: 'Guard duty for high-profile patient under judicial custody', status: 'pending', createdAt: '2026-02-17T11:00:00Z', updatedAt: '2026-02-17T11:00:00Z' },
        { id: 'adhoc-4', createdBy: 'user-1', assignedTo: 'APC-2689', shiftTypeId: 'VIP Escort', date: '2026-02-16', locationId: 'Mangaluru Airport', reason: 'Minister arrival escort from airport to circuit house', status: 'accepted', createdAt: '2026-02-16T08:00:00Z', updatedAt: '2026-02-16T10:00:00Z' },
        { id: 'adhoc-5', createdBy: 'user-2', assignedTo: 'ARSI-Dinesh', shiftTypeId: 'Cash Escort', date: '2026-02-16', locationId: 'Canara Bank Bijai', reason: 'Emergency cash transfer escort due to ATM refill schedule change', status: 'accepted', createdAt: '2026-02-16T07:30:00Z', updatedAt: '2026-02-16T09:00:00Z' },
        { id: 'adhoc-6', createdBy: 'user-1', assignedTo: 'AHC-2650', shiftTypeId: 'Court Duty', date: '2026-02-15', locationId: 'II ADSJ Court Mangaluru', reason: 'Additional security for high-profile hearing', status: 'completed', createdAt: '2026-02-15T06:00:00Z', updatedAt: '2026-02-15T18:00:00Z' },
        { id: 'adhoc-7', createdBy: 'user-2', assignedTo: 'APC-2739', shiftTypeId: 'Exam Guard', date: '2026-02-15', locationId: 'Canara PU College Kodialbail', reason: 'PUC evaluation centre guard duty during answer paper transport', status: 'completed', createdAt: '2026-02-15T05:30:00Z', updatedAt: '2026-02-15T17:00:00Z' },
        { id: 'adhoc-8', createdBy: 'user-1', assignedTo: 'AHC-2796', shiftTypeId: 'Striking Force', date: '2026-02-14', locationId: 'CC Room', reason: 'Reinforcement for CC Room SF-I due to personnel shortage', status: 'pending', createdAt: '2026-02-14T12:00:00Z', updatedAt: '2026-02-14T12:00:00Z' },
        { id: 'adhoc-9', createdBy: 'user-2', assignedTo: 'APC-2552', shiftTypeId: 'Check Point', date: '2026-02-14', locationId: 'NH-75 Toll Plaza', reason: 'Vehicle checking drive for stolen vehicle recovery operation', status: 'declined', declineReason: 'Personnel already on leave', createdAt: '2026-02-14T10:00:00Z', updatedAt: '2026-02-14T11:30:00Z' },
        { id: 'adhoc-10', createdBy: 'user-1', assignedTo: 'AHC-109', shiftTypeId: 'Prison Escort', date: '2026-02-13', locationId: 'District Jail to Court', reason: 'Prisoner escort for remand hearing at sessions court', status: 'completed', createdAt: '2026-02-13T07:00:00Z', updatedAt: '2026-02-13T16:00:00Z' },
        { id: 'adhoc-11', createdBy: 'user-2', assignedTo: 'APC-2717', shiftTypeId: 'Emergency CP', date: '2026-02-13', locationId: 'Kadri Temple Road', reason: 'Festival crowd management and traffic diversion duty', status: 'pending', createdAt: '2026-02-13T15:00:00Z', updatedAt: '2026-02-13T15:00:00Z' },
        { id: 'adhoc-12', createdBy: 'user-1', assignedTo: 'AHC-189', shiftTypeId: 'VIP Escort', date: '2026-02-12', locationId: 'Town Hall', reason: 'Dignitary visit for Republic Day follow-up event', status: 'pending', createdAt: '2026-02-12T09:00:00Z', updatedAt: '2026-02-12T09:00:00Z' },
        { id: 'adhoc-13', createdBy: 'user-2', assignedTo: 'APC-2661', shiftTypeId: 'Guard Duty', date: '2026-02-12', locationId: 'District Treasury', reason: 'Additional guard for salary disbursement day', status: 'accepted', createdAt: '2026-02-12T06:00:00Z', updatedAt: '2026-02-12T08:00:00Z' },
        { id: 'adhoc-14', createdBy: 'user-1', assignedTo: 'AHC-204', shiftTypeId: 'Riot Control', date: '2026-02-11', locationId: 'Hampankatta Circle', reason: 'Bandh call enforcement and preventive deployment', status: 'completed', createdAt: '2026-02-11T05:00:00Z', updatedAt: '2026-02-11T20:00:00Z' },
        { id: 'adhoc-15', createdBy: 'user-2', assignedTo: 'APC-2656', shiftTypeId: 'Hospital Guard', date: '2026-02-11', locationId: 'Wenlock Hospital', reason: 'Accident victim under police case requiring ward security', status: 'pending', createdAt: '2026-02-11T22:00:00Z', updatedAt: '2026-02-11T22:00:00Z' },
        { id: 'adhoc-16', createdBy: 'user-1', assignedTo: 'AHC-2522', shiftTypeId: 'Cash Escort', date: '2026-02-10', locationId: 'ICICI Bank to Axis Bank', reason: 'Inter-bank currency chest transfer requiring armed escort', status: 'pending', createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-02-10T08:00:00Z' },
        { id: 'adhoc-17', createdBy: 'user-2', assignedTo: 'APC-2728', shiftTypeId: 'Striking Force', date: '2026-02-10', locationId: 'CAR Stand By', reason: 'Stand-by reinforcement for law and order situation', status: 'declined', declineReason: 'Insufficient personnel available', createdAt: '2026-02-10T14:00:00Z', updatedAt: '2026-02-10T16:00:00Z' },
        { id: 'adhoc-18', createdBy: 'user-1', assignedTo: 'AHC-2541', shiftTypeId: 'Emergency CP', date: '2026-02-09', locationId: 'Surathkal Toll', reason: 'Accident site traffic management and diversion', status: 'completed', createdAt: '2026-02-09T19:00:00Z', updatedAt: '2026-02-09T23:00:00Z' },
      ],
      notifications: seedData.notifications,
      auditEntries: seedData.auditEntries,
      leaveBalances: seedData.leaveBalances,
      // Karnataka Police data
      personnel: seedData.personnel,
      sections: seedData.sections,
      platoons: seedData.platoons,
      guardLocations: seedData.guardLocations,
      vipEscortAssignments: seedData.vipEscortAssignments,
      gunmanAssignments: seedData.gunmanAssignments,
      rotationCycle: seedData.rotationCycle,
      platoonRotations: seedData.platoonRotations,
      strikingForceTeams: seedData.strikingForceTeams,
      trainingPrograms: seedData.trainingPrograms,
      recruitAPCs: seedData.recruitAPCs,
      strengthSummary: seedData.strengthSummary,
      kpLeaveBalances: seedData.kpLeaveBalances,
      kpLeaveRequests: [],
      form168Entries: [],
      form168Dailies: [],
    }
    this.saveToStorage(data)
    return data
  }

  private saveToStorage(data?: StoredData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data || this.data))
      console.log('[DataStore] Saved data to localStorage')
    } catch (error) {
      console.error('[DataStore] Error saving to localStorage:', error)
    }
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY)
    this.data = this.initializeWithSeedData()
    console.log('[DataStore] Data reset to seed data')
  }

  // Users
  getUsers(): User[] {
    return [...this.data.users]
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id)
  }

  getUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username === username)
  }

  // Departments
  getDepartments(): Department[] {
    return [...this.data.departments]
  }

  getDepartmentById(id: string): Department | undefined {
    return this.data.departments.find(d => d.id === id)
  }

  createDepartment(department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Department {
    const newDept: Department = {
      ...department,
      id: `dept-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.departments.push(newDept)
    this.saveToStorage()
    return newDept
  }

  updateDepartment(id: string, updates: Partial<Department>): Department | undefined {
    const index = this.data.departments.findIndex(d => d.id === id)
    if (index === -1) return undefined
    
    this.data.departments[index] = {
      ...this.data.departments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.departments[index]
  }

  deleteDepartment(id: string): boolean {
    const index = this.data.departments.findIndex(d => d.id === id)
    if (index === -1) return false
    
    this.data.departments.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // Locations
  getLocations(): Location[] {
    return [...this.data.locations]
  }

  getLocationById(id: string): Location | undefined {
    return this.data.locations.find(l => l.id === id)
  }

  createLocation(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Location {
    const newLoc: Location = {
      ...location,
      id: `loc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.locations.push(newLoc)
    this.saveToStorage()
    return newLoc
  }

  updateLocation(id: string, updates: Partial<Location>): Location | undefined {
    const index = this.data.locations.findIndex(l => l.id === id)
    if (index === -1) return undefined
    
    this.data.locations[index] = {
      ...this.data.locations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.locations[index]
  }

  deleteLocation(id: string): boolean {
    const index = this.data.locations.findIndex(l => l.id === id)
    if (index === -1) return false
    
    this.data.locations.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // Employees
  getEmployees(): Employee[] {
    return [...this.data.employees]
  }

  getEmployeeById(id: string): Employee | undefined {
    return this.data.employees.find(e => e.id === id)
  }

  getEmployeeByEmployeeId(employeeId: string): Employee | undefined {
    return this.data.employees.find(e => e.employeeId === employeeId)
  }

  createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const newEmp: Employee = {
      ...employee,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.employees.push(newEmp)
    this.saveToStorage()
    console.log('[DataStore] Created employee:', newEmp)
    
    // Dispatch custom event to notify components of data change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workboard-data-changed', { detail: { type: 'employee', action: 'create', id: newEmp.id } }))
    }
    
    return newEmp
  }

  updateEmployee(id: string, updates: Partial<Employee>): Employee | undefined {
    const index = this.data.employees.findIndex(e => e.id === id)
    if (index === -1) return undefined
    
    this.data.employees[index] = {
      ...this.data.employees[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.employees[index]
  }

  deleteEmployee(id: string): boolean {
    const index = this.data.employees.findIndex(e => e.id === id)
    if (index === -1) return false
    
    this.data.employees.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // Shift Types
  getShiftTypes(): ShiftType[] {
    return [...this.data.shiftTypes]
  }

  getShiftTypeById(id: string): ShiftType | undefined {
    return this.data.shiftTypes.find(s => s.id === id)
  }

  createShiftType(shiftType: Omit<ShiftType, 'id' | 'createdAt' | 'updatedAt'>): ShiftType {
    const newShift: ShiftType = {
      ...shiftType,
      id: `shift-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.shiftTypes.push(newShift)
    this.saveToStorage()
    return newShift
  }

  updateShiftType(id: string, updates: Partial<ShiftType>): ShiftType | undefined {
    const index = this.data.shiftTypes.findIndex(s => s.id === id)
    if (index === -1) return undefined
    
    this.data.shiftTypes[index] = {
      ...this.data.shiftTypes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.shiftTypes[index]
  }

  deleteShiftType(id: string): boolean {
    const index = this.data.shiftTypes.findIndex(s => s.id === id)
    if (index === -1) return false
    
    this.data.shiftTypes.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // Shift Patterns
  getShiftPatterns(): ShiftPattern[] {
    return [...this.data.shiftPatterns]
  }

  getShiftPatternById(id: string): ShiftPattern | undefined {
    return this.data.shiftPatterns.find(p => p.id === id)
  }

  createShiftPattern(pattern: Omit<ShiftPattern, 'id' | 'createdAt' | 'updatedAt'>): ShiftPattern {
    const newPattern: ShiftPattern = {
      ...pattern,
      id: `pattern-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.shiftPatterns.push(newPattern)
    this.saveToStorage()
    return newPattern
  }

  updateShiftPattern(id: string, updates: Partial<ShiftPattern>): ShiftPattern | undefined {
    const index = this.data.shiftPatterns.findIndex(p => p.id === id)
    if (index === -1) return undefined
    
    this.data.shiftPatterns[index] = {
      ...this.data.shiftPatterns[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.shiftPatterns[index]
  }

  deleteShiftPattern(id: string): boolean {
    const index = this.data.shiftPatterns.findIndex(p => p.id === id)
    if (index === -1) return false
    
    this.data.shiftPatterns.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // Rotation Rules
  getRotationRules(): RotationRule[] {
    return [...this.data.rotationRules]
  }

  getRotationRuleById(id: string): RotationRule | undefined {
    return this.data.rotationRules.find(r => r.id === id)
  }

  createRotationRule(rule: Omit<RotationRule, 'id' | 'createdAt' | 'updatedAt'>): RotationRule {
    const newRule: RotationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.rotationRules.push(newRule)
    this.saveToStorage()
    return newRule
  }

  updateRotationRule(id: string, updates: Partial<RotationRule>): RotationRule | undefined {
    const index = this.data.rotationRules.findIndex(r => r.id === id)
    if (index === -1) return undefined
    
    this.data.rotationRules[index] = {
      ...this.data.rotationRules[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.rotationRules[index]
  }

  deleteRotationRule(id: string): boolean {
    const index = this.data.rotationRules.findIndex(r => r.id === id)
    if (index === -1) return false
    
    this.data.rotationRules.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // Shift Assignments
  getShiftAssignments(): ShiftAssignment[] {
    console.log('[DataStore] getShiftAssignments called, returning', this.data.shiftAssignments.length, 'assignments')
    return [...this.data.shiftAssignments]
  }

  getShiftAssignmentById(id: string): ShiftAssignment | undefined {
    return this.data.shiftAssignments.find(a => a.id === id)
  }

  getShiftAssignmentsByEmployee(employeeId: string): ShiftAssignment[] {
    return this.data.shiftAssignments.filter(a => a.employeeId === employeeId)
  }

  getShiftAssignmentsByDate(date: string): ShiftAssignment[] {
    return this.data.shiftAssignments.filter(a => a.date === date)
  }

  getShiftAssignmentsByDateRange(startDate: string, endDate: string): ShiftAssignment[] {
    return this.data.shiftAssignments.filter(a => a.date >= startDate && a.date <= endDate)
  }

  createShiftAssignment(assignment: Omit<ShiftAssignment, 'id' | 'createdAt' | 'updatedAt'>): ShiftAssignment {
    const newAssignment: ShiftAssignment = {
      ...assignment,
      id: `assign-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.shiftAssignments.push(newAssignment)
    this.saveToStorage()
    console.log('[DataStore] Created shift assignment:', newAssignment)
    console.log('[DataStore] Total shift assignments:', this.data.shiftAssignments.length)
    
    // Dispatch custom event to notify components of data change
    if (typeof window !== 'undefined') {
      console.log('[DataStore] Dispatching workboard-data-changed event for shift-assignment create')
      window.dispatchEvent(new CustomEvent('workboard-data-changed', { detail: { type: 'shift-assignment', action: 'create', id: newAssignment.id } }))
    }
    
    return newAssignment
  }

  updateShiftAssignment(id: string, updates: Partial<ShiftAssignment>): ShiftAssignment | undefined {
    const index = this.data.shiftAssignments.findIndex(a => a.id === id)
    if (index === -1) {
      console.log('[DataStore] updateShiftAssignment: assignment not found:', id)
      return undefined
    }
    
    this.data.shiftAssignments[index] = {
      ...this.data.shiftAssignments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    console.log('[DataStore] Updated shift assignment:', this.data.shiftAssignments[index])
    
    // Dispatch custom event to notify components of data change
    if (typeof window !== 'undefined') {
      console.log('[DataStore] Dispatching workboard-data-changed event for shift-assignment update')
      window.dispatchEvent(new CustomEvent('workboard-data-changed', { detail: { type: 'shift-assignment', action: 'update', id } }))
    }
    
    return this.data.shiftAssignments[index]
  }

  deleteShiftAssignment(id: string): boolean {
    const index = this.data.shiftAssignments.findIndex(a => a.id === id)
    if (index === -1) return false
    
    this.data.shiftAssignments.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // Leave Requests
  getLeaveRequests(): LeaveRequest[] {
    return [...this.data.leaveRequests]
  }

  getLeaveRequestById(id: string): LeaveRequest | undefined {
    return this.data.leaveRequests.find(l => l.id === id)
  }

  getLeaveRequestsByEmployee(employeeId: string): LeaveRequest[] {
    return this.data.leaveRequests.filter(l => l.employeeId === employeeId)
  }

  createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): LeaveRequest {
    const newRequest: LeaveRequest = {
      ...request,
      id: `leave-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.leaveRequests.push(newRequest)
    this.saveToStorage()
    console.log('[DataStore] Created leave request:', newRequest)
    
    // Dispatch custom event to notify components of data change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workboard-data-changed', { detail: { type: 'leave-request', action: 'create', id: newRequest.id } }))
    }
    
    return newRequest
  }

  updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): LeaveRequest | undefined {
    const index = this.data.leaveRequests.findIndex(l => l.id === id)
    if (index === -1) return undefined
    
    this.data.leaveRequests[index] = {
      ...this.data.leaveRequests[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.leaveRequests[index]
  }

  // Swap Requests
  getSwapRequests(): SwapRequest[] {
    return [...this.data.swapRequests]
  }

  getSwapRequestById(id: string): SwapRequest | undefined {
    return this.data.swapRequests.find(s => s.id === id)
  }

  createSwapRequest(request: Omit<SwapRequest, 'id' | 'createdAt' | 'updatedAt'>): SwapRequest {
    const newRequest: SwapRequest = {
      ...request,
      id: `swap-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.swapRequests.push(newRequest)
    this.saveToStorage()
    console.log('[DataStore] Created swap request:', newRequest)
    
    // Dispatch custom event to notify components of data change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workboard-data-changed', { detail: { type: 'swap-request', action: 'create', id: newRequest.id } }))
    }
    
    return newRequest
  }

  updateSwapRequest(id: string, updates: Partial<SwapRequest>): SwapRequest | undefined {
    const index = this.data.swapRequests.findIndex(s => s.id === id)
    if (index === -1) return undefined
    
    this.data.swapRequests[index] = {
      ...this.data.swapRequests[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.swapRequests[index]
  }

  // Adhoc Requests
  getAdhocRequests(): AdhocRequest[] {
    return [...this.data.adhocRequests]
  }

  getAdhocRequestById(id: string): AdhocRequest | undefined {
    return this.data.adhocRequests.find(a => a.id === id)
  }

  createAdhocRequest(request: Omit<AdhocRequest, 'id' | 'createdAt' | 'updatedAt'>): AdhocRequest {
    const newRequest: AdhocRequest = {
      ...request,
      id: `adhoc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.adhocRequests.push(newRequest)
    this.saveToStorage()
    return newRequest
  }

  updateAdhocRequest(id: string, updates: Partial<AdhocRequest>): AdhocRequest | undefined {
    const index = this.data.adhocRequests.findIndex(a => a.id === id)
    if (index === -1) return undefined
    
    this.data.adhocRequests[index] = {
      ...this.data.adhocRequests[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.adhocRequests[index]
  }

  // Notifications
  getNotifications(): Notification[] {
    return [...this.data.notifications]
  }

  getNotificationsByUser(userId: string): Notification[] {
    return this.data.notifications.filter(n => n.userId === userId)
  }

  getUnreadNotificationCount(userId: string): number {
    return this.data.notifications.filter(n => n.userId === userId && !n.isRead).length
  }

  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const newNotif: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    this.data.notifications.unshift(newNotif)
    this.saveToStorage()
    return newNotif
  }

  markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id)
    if (!notif) return false
    
    notif.isRead = true
    this.saveToStorage()
    return true
  }

  markAllNotificationsAsRead(userId: string): void {
    this.data.notifications
      .filter(n => n.userId === userId)
      .forEach(n => { n.isRead = true })
    this.saveToStorage()
  }

  // Audit Entries
  getAuditEntries(): AuditEntry[] {
    return [...this.data.auditEntries]
  }

  createAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const newEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
    this.data.auditEntries.unshift(newEntry)
    this.saveToStorage()
    console.log('[DataStore] Created audit entry:', newEntry)
    
    // Dispatch custom event to notify components of data change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workboard-data-changed', { detail: { type: 'audit-entry', action: 'create', id: newEntry.id } }))
    }
    
    return newEntry
  }

  // Leave Balances
  getLeaveBalances(employeeId: string): { type: string; total: number; used: number; remaining: number }[] {
    return this.data.leaveBalances[employeeId] || []
  }

  updateLeaveBalance(employeeId: string, leaveType: string, used: number): void {
    if (!this.data.leaveBalances[employeeId]) return
    
    const balance = this.data.leaveBalances[employeeId].find(b => b.type === leaveType)
    if (balance) {
      balance.used = used
      balance.remaining = balance.total - used
      this.saveToStorage()
    }
  }

  // =============================================================================
  // Karnataka Police Personnel Operations
  // =============================================================================

  getPersonnel(): Personnel[] {
    return [...this.data.personnel]
  }

  getPersonnelById(id: string): Personnel | undefined {
    return this.data.personnel.find(p => p.id === id)
  }

  getPersonnelByPersonnelId(personnelId: string): Personnel | undefined {
    return this.data.personnel.find(p => p.personnelId === personnelId)
  }

  getPersonnelBySection(section: SectionType): Personnel[] {
    return this.data.personnel.filter(p => p.section === section)
  }

  getPersonnelByRank(rank: PoliceRank): Personnel[] {
    return this.data.personnel.filter(p => p.rank === rank)
  }

  getPersonnelByPlatoon(platoonId: PlatoonId): Personnel[] {
    return this.data.personnel.filter(p => p.platoon === platoonId)
  }

  getPersonnelByDutyCategory(dutyCategory: string): Personnel[] {
    return this.data.personnel.filter(p => p.dutyCategory === dutyCategory)
  }

  createPersonnel(personnel: Omit<Personnel, 'id' | 'createdAt' | 'updatedAt'>): Personnel {
    const newPersonnel: Personnel = {
      ...personnel,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.personnel.push(newPersonnel)
    this.saveToStorage()
    return newPersonnel
  }

  updatePersonnel(id: string, updates: Partial<Personnel>): Personnel | undefined {
    const index = this.data.personnel.findIndex(p => p.id === id)
    if (index === -1) return undefined
    
    this.data.personnel[index] = {
      ...this.data.personnel[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.personnel[index]
  }

  deletePersonnel(id: string): boolean {
    const index = this.data.personnel.findIndex(p => p.id === id)
    if (index === -1) return false
    
    this.data.personnel.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // =============================================================================
  // Section Operations
  // =============================================================================

  getSections(): Section[] {
    return [...this.data.sections]
  }

  getSectionByType(type: SectionType): Section | undefined {
    return this.data.sections.find(s => s.type === type)
  }

  // =============================================================================
  // Platoon Operations
  // =============================================================================

  getPlatoons(): Platoon[] {
    return [...this.data.platoons]
  }

  getPlatoonById(id: PlatoonId): Platoon | undefined {
    return this.data.platoons.find(p => p.id === id)
  }

  updatePlatoonDuty(id: PlatoonId, dutyType: RotationalDutyType): Platoon | undefined {
    const index = this.data.platoons.findIndex(p => p.id === id)
    if (index === -1) return undefined
    
    this.data.platoons[index] = {
      ...this.data.platoons[index],
      currentDutyType: dutyType,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.platoons[index]
  }

  // =============================================================================
  // Guard Location Operations
  // =============================================================================

  getGuardLocations(): GuardLocation[] {
    return [...this.data.guardLocations]
  }

  getGuardLocationById(id: string): GuardLocation | undefined {
    return this.data.guardLocations.find(l => l.id === id)
  }

  getActiveGuardLocations(): GuardLocation[] {
    return this.data.guardLocations.filter(l => l.isActive)
  }

  createGuardLocation(location: Omit<GuardLocation, 'id' | 'createdAt' | 'updatedAt'>): GuardLocation {
    const newLocation: GuardLocation = {
      ...location,
      id: `gl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.guardLocations.push(newLocation)
    this.saveToStorage()
    return newLocation
  }

  updateGuardLocation(id: string, updates: Partial<GuardLocation>): GuardLocation | undefined {
    const index = this.data.guardLocations.findIndex(l => l.id === id)
    if (index === -1) return undefined
    
    this.data.guardLocations[index] = {
      ...this.data.guardLocations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.guardLocations[index]
  }

  deleteGuardLocation(id: string): boolean {
    const index = this.data.guardLocations.findIndex(l => l.id === id)
    if (index === -1) return false
    this.data.guardLocations.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // =============================================================================
  // VIP Escort Operations
  // =============================================================================

  getVIPEscortAssignments(): VIPEscortAssignment[] {
    return [...this.data.vipEscortAssignments]
  }

  getActiveVIPEscorts(): VIPEscortAssignment[] {
    return this.data.vipEscortAssignments.filter(v => v.isActive)
  }

  // =============================================================================
  // Gunman Assignment Operations
  // =============================================================================

  getGunmanAssignments(): GunmanAssignment[] {
    return [...this.data.gunmanAssignments]
  }

  getActiveGunmanAssignments(): GunmanAssignment[] {
    return this.data.gunmanAssignments.filter(g => g.isActive)
  }

  // =============================================================================
  // Rotation Operations
  // =============================================================================

  getRotationCycle(): RotationCycle {
    return { ...this.data.rotationCycle }
  }

  getPlatoonRotations(): PlatoonRotation[] {
    return [...this.data.platoonRotations]
  }

  getCurrentPlatoonRotations(): PlatoonRotation[] {
    const today = new Date().toISOString().split('T')[0]
    return this.data.platoonRotations.filter(
      r => r.startDate <= today && r.endDate >= today
    )
  }

  getPlatoonRotationsByDateRange(startDate: string, endDate: string): PlatoonRotation[] {
    return this.data.platoonRotations.filter(
      r => r.startDate <= endDate && r.endDate >= startDate
    )
  }

  getPlatoonRotationsByCycle(cycleNumber: number): PlatoonRotation[] {
    return this.data.platoonRotations.filter(r => r.cycleNumber === cycleNumber)
  }

  addPlatoonRotation(rotation: Omit<PlatoonRotation, 'id' | 'createdAt' | 'updatedAt'>): PlatoonRotation {
    const newRotation: PlatoonRotation = {
      ...rotation,
      id: `pr-${rotation.cycleNumber}-${rotation.platoonId}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.platoonRotations.push(newRotation)
    this.saveToStorage()
    return newRotation
  }

  addBulkPlatoonRotations(rotations: Omit<PlatoonRotation, 'id' | 'createdAt' | 'updatedAt'>[]): PlatoonRotation[] {
    return rotations.map(r => this.addPlatoonRotation(r))
  }

  // =============================================================================
  // Striking Force Operations
  // =============================================================================

  getStrikingForceTeams(): StrikingForceConfig[] {
    return [...this.data.strikingForceTeams]
  }

  getActiveStrikingForceTeams(): StrikingForceConfig[] {
    return this.data.strikingForceTeams.filter(t => t.isActive)
  }

  // =============================================================================
  // Training Program Operations
  // =============================================================================

  getTrainingPrograms(): TrainingProgram[] {
    return [...this.data.trainingPrograms]
  }

  getOngoingTrainingPrograms(): TrainingProgram[] {
    return this.data.trainingPrograms.filter(t => t.status === 'ongoing')
  }

  // =============================================================================
  // Recruit APC Operations
  // =============================================================================

  getRecruitAPCs(): RecruitAPC[] {
    return [...this.data.recruitAPCs]
  }

  getActiveRecruits(): RecruitAPC[] {
    return this.data.recruitAPCs.filter(r => r.status === 'training')
  }

  // =============================================================================
  // Strength Summary Operations
  // =============================================================================

  getStrengthSummary(): StrengthSummary {
    return { ...this.data.strengthSummary }
  }

  // =============================================================================
  // KP Leave Operations
  // =============================================================================

  getKPLeaveBalances(): KPLeaveBalance[] {
    return [...this.data.kpLeaveBalances]
  }

  getKPLeaveBalance(personnelId: string): KPLeaveBalance | undefined {
    return this.data.kpLeaveBalances.find(b => b.personnelId === personnelId)
  }

  getKPLeaveRequests(): KPLeaveRequest[] {
    return [...this.data.kpLeaveRequests]
  }

  getKPLeaveRequestsByPersonnel(personnelId: string): KPLeaveRequest[] {
    return this.data.kpLeaveRequests.filter(r => r.personnelId === personnelId)
  }

  getPendingKPLeaveRequests(): KPLeaveRequest[] {
    return this.data.kpLeaveRequests.filter(r => r.status === 'pending')
  }

  createKPLeaveRequest(request: Omit<KPLeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): KPLeaveRequest {
    const newRequest: KPLeaveRequest = {
      ...request,
      id: `kp-leave-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.kpLeaveRequests.push(newRequest)
    this.saveToStorage()
    return newRequest
  }

  updateKPLeaveRequest(id: string, updates: Partial<KPLeaveRequest>): KPLeaveRequest | undefined {
    const index = this.data.kpLeaveRequests.findIndex(r => r.id === id)
    if (index === -1) return undefined
    
    this.data.kpLeaveRequests[index] = {
      ...this.data.kpLeaveRequests[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveToStorage()
    return this.data.kpLeaveRequests[index]
  }

  // =============================================================================
  // Form 168 Operations
  // =============================================================================

  getForm168Entries(): Form168Entry[] {
    return [...this.data.form168Entries]
  }

  getForm168EntriesByDate(date: string): Form168Entry[] {
    return this.data.form168Entries.filter(e => e.date === date)
  }

  createForm168Entry(entry: Omit<Form168Entry, 'id' | 'createdAt' | 'updatedAt'>): Form168Entry {
    const newEntry: Form168Entry = {
      ...entry,
      id: `f168-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.form168Entries.push(newEntry)
    this.saveToStorage()
    return newEntry
  }

  getForm168Dailies(): Form168Daily[] {
    return [...this.data.form168Dailies]
  }

  getForm168DailyByDate(date: string): Form168Daily | undefined {
    return this.data.form168Dailies.find(d => d.date === date)
  }

  createForm168Daily(daily: Omit<Form168Daily, 'id' | 'createdAt' | 'updatedAt'>): Form168Daily {
    const newDaily: Form168Daily = {
      ...daily,
      id: `f168d-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.form168Dailies.push(newDaily)
    this.saveToStorage()
    return newDaily
  }
}

export const dataStore = new DataStore()

// Add debug helper to window for testing
if (typeof window !== 'undefined') {
  (window as any).debugDataStore = {
    getEmployees: () => dataStore.getEmployees(),
    getShiftAssignments: () => dataStore.getShiftAssignments(),
    getAll: () => {
      const stored = localStorage.getItem('workboard_data')
      return stored ? JSON.parse(stored) : null
    }
  }
}

export default dataStore
