// User and Authentication Types
export type UserRole = 'admin' | 'supervisor' | 'employee'

export interface User {
  id: string
  username: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  departmentId: string
  employeeId: string
  createdAt: string
  lastLogin?: string
}

export interface AuthState {
  user: User | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface Credentials {
  username: string
  password: string
}

// Organization Types
export interface Department {
  id: string
  name: string
  code: string
  description?: string
  parentId?: string
  employeeCount: number
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  name: string
  address: string
  city: string
  timezone: string
  capacity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Employee Types
export interface AvailabilityPreferences {
  preferredShifts: string[]
  unavailableDays: number[]
  maxHoursPerWeek: number
  preferredLocations: string[]
}

export interface Employee {
  id: string
  employeeId: string
  name: string
  email: string
  phone?: string
  departmentId: string
  role: UserRole
  skills: string[]
  status: 'active' | 'inactive'
  hireDate: string
  preferences: AvailabilityPreferences
  createdAt: string
  updatedAt: string
}

// Shift Types
export type ShiftCategory = 'regular' | 'overtime' | 'on-call' | 'training'

export interface ShiftType {
  id: string
  name: string
  startTime: string
  endTime: string
  breakDuration: number
  colorCode: string
  category: ShiftCategory
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ShiftPattern {
  id: string
  name: string
  description?: string
  rotationCycle: number
  shiftTypeIds: string[]
  sequence: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type RotationRuleType = 'round-robin' | 'skill-based' | 'seniority-based' | 'preference-based'

export interface RotationRule {
  id: string
  name: string
  type: RotationRuleType
  description?: string
  minRestHours: number
  maxConsecutiveDays: number
  priority: number
  constraints: RuleConstraint[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RuleConstraint {
  type: 'holiday' | 'weekend' | 'special-date' | 'skill-required'
  value: string
  description?: string
}

// Schedule Types
export type ShiftStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled'

export interface ShiftAssignment {
  id: string
  employeeId: string
  shiftTypeId: string
  date: string
  locationId: string
  status: ShiftStatus
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleProposal {
  id: string
  startDate: string
  endDate: string
  assignments: ShiftAssignment[]
  fairnessScore: number
  conflicts: ScheduleConflict[]
  status: 'draft' | 'approved' | 'rejected'
  createdBy: string
  createdAt: string
}

export interface ScheduleConflict {
  type: 'overlap' | 'rest-violation' | 'skill-mismatch' | 'availability'
  employeeId: string
  date: string
  description: string
  suggestedResolution?: string
}

// Leave Types
export type LeaveType = 'annual' | 'sick' | 'personal' | 'unpaid' | 'maternity' | 'paternity'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveBalance {
  type: LeaveType
  total: number
  used: number
  remaining: number
}

export interface LeaveRequest {
  id: string
  employeeId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
  status: RequestStatus
  approvedBy?: string
  approvedAt?: string
  replacementId?: string
  affectedShifts: string[]
  createdAt: string
  updatedAt: string
}

// Swap and Adhoc Types
export interface SwapRequest {
  id: string
  requesterId: string
  targetId: string
  requesterShiftId: string
  targetShiftId: string
  reason: string
  status: RequestStatus
  requesterAccepted: boolean
  targetAccepted: boolean
  supervisorApproved?: boolean
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export type AdhocStatus = 'pending' | 'accepted' | 'declined' | 'completed'

export interface AdhocRequest {
  id: string
  createdBy: string
  assignedTo: string
  shiftTypeId: string
  date: string
  locationId: string
  reason: string
  status: AdhocStatus
  declineReason?: string
  createdAt: string
  updatedAt: string
}

// Notification Types
export type NotificationCategory = 'urgent' | 'informational' | 'action-required'
export type NotificationType = 
  | 'schedule-change'
  | 'leave-request'
  | 'swap-request'
  | 'adhoc-request'
  | 'approval-needed'
  | 'system-alert'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

export interface NotificationPreferences {
  userId: string
  emailEnabled: boolean
  categories: {
    [key in NotificationCategory]: boolean
  }
  types: {
    [key in NotificationType]: boolean
  }
}

// Audit Types
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout'
export type AuditEntityType = 
  | 'employee'
  | 'department'
  | 'location'
  | 'shift-type'
  | 'shift-pattern'
  | 'rotation-rule'
  | 'shift-assignment'
  | 'leave-request'
  | 'swap-request'
  | 'adhoc-request'
  | 'user'

export interface AuditEntry {
  id: string
  userId: string
  userName: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  entityName?: string
  beforeValue?: Record<string, unknown>
  afterValue?: Record<string, unknown>
  ipAddress?: string
  timestamp: string
}

// Report Types
export type ReportType = 'coverage' | 'overtime' | 'attendance' | 'compliance'

export interface ReportFilter {
  startDate: string
  endDate: string
  departmentIds?: string[]
  locationIds?: string[]
  employeeIds?: string[]
}

export interface ReportMetrics {
  coveragePercentage: number
  totalShifts: number
  filledShifts: number
  overtimeHours: number
  absenceRate: number
  averageHoursPerEmployee: number
}

export interface Report {
  id: string
  type: ReportType
  name: string
  filter: ReportFilter
  metrics: ReportMetrics
  data: Record<string, unknown>[]
  generatedBy: string
  generatedAt: string
}

// Chatbot Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  action?: ActionPayload
}

export interface ActionPayload {
  type: string
  data: Record<string, unknown>
  confirmed?: boolean
}

export interface IntentMatch {
  intent: string
  confidence: number
  entities: Record<string, string>
  action?: string
}

export interface MockResponse {
  text: string
  suggestions?: string[]
  action?: ActionPayload
}

// Document Parser Types
export interface ExtractedRule {
  id: string
  type: string
  description: string
  value: string | number
  confidence: number
  source: string
}

export interface ParseResult {
  id: string
  fileName: string
  fileType: string
  rules: ExtractedRule[]
  overallConfidence: number
  warnings: string[]
  summary?: string
  parsedAt: string
}

// API Types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}
