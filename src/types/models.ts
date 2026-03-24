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

// =============================================================================
// Karnataka State Police Types
// =============================================================================

// -----------------------------------------------------------------------------
// 1.1 Core Personnel Types and Interfaces
// Requirements: 2.1, 2.2, 3.1, 3.6
// -----------------------------------------------------------------------------

// Rank hierarchy for Karnataka Police
export type PoliceRank = 'DCP' | 'ACP' | 'RPI' | 'RSI' | 'ARSI' | 'AHC' | 'APC'

// Personnel status types
export type PersonnelStatus = 'active' | 'on-leave' | 'absent' | 'suspended' | 'sick' | 'training'

// Section assignments
export type SectionType = 'A' | 'B' | 'C' | 'PMT' | 'RECRUIT'

// Personnel ID format validation
export interface PersonnelId {
  prefix: 'AHC' | 'APC' | 'ARSI' | 'RSI' | 'RPI'
  number: string // 3-4 digit number
}

// Main personnel interface
export interface Personnel {
  id: string
  personnelId: string // Format: AHC-127, APC-2539, etc.
  name: string
  rank: PoliceRank
  section: SectionType
  platoon?: PlatoonId // Only for Section C
  dutyCategory?: string // Specific duty within section
  status: PersonnelStatus
  statusDate?: string // Date when status changed
  statusReason?: string
  phone?: string
  email?: string
  hireDate: string
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// 1.2 Section and Platoon Types
// Requirements: 4.1, 5.1, 6.1, 6.2
// -----------------------------------------------------------------------------

// Section A duty categories
export type SectionADutyCategory =
  | 'leadership'
  | 'chamber-sentry'
  | 'armoury'
  | 'dog-squad'
  | 'asc-team'
  | 'gunman'
  | 'ood'

// Section B duty categories
export type SectionBDutyCategory =
  | 'office-writers'
  | 'police-canteen'
  | 'police-lane'
  | 'car-store'
  | 'building-maintenance'
  | 'band-team'
  | 'qrt-team'
  | 'cpt-team'

// Platoon identifiers for Section C
export type PlatoonId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5'

// Duty types for rotation
export type RotationalDutyType =
  | 'guard-i'
  | 'guard-ii'
  | 'check-point'
  | 'prison-vip-escort'
  | 'striking-force'

// Platoon structure
export interface Platoon {
  id: PlatoonId
  name: string
  personnelCount: number
  personnelIds: string[] // List of personnel IDs
  currentDutyType: RotationalDutyType
  createdAt: string
  updatedAt: string
}

// Section structure
export interface Section {
  id: string
  type: SectionType
  name: string
  description: string
  totalStrength: number
  dutyCategories: string[]
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// 1.3 Rotation Schedule Types
// Requirements: 6.4, 6.5, 6.6
// -----------------------------------------------------------------------------

// Rotation cycle configuration
export interface RotationCycle {
  id: string
  cycleDays: number // 15 days
  startDate: string
  endDate: string
  rotationSequence: RotationalDutyType[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Platoon rotation assignment
export interface PlatoonRotation {
  id: string
  platoonId: PlatoonId
  dutyType: RotationalDutyType
  startDate: string
  endDate: string
  cycleNumber: number
  createdAt: string
  updatedAt: string
}

// Rotation schedule for display
export interface RotationScheduleEntry {
  date: string
  platoonAssignments: {
    platoonId: PlatoonId
    dutyType: RotationalDutyType
  }[]
}

// -----------------------------------------------------------------------------
// 1.4 Guard Location and Duty Types
// Requirements: 8.1, 8.2, 8.4
// -----------------------------------------------------------------------------

// Guard location categories
export type GuardLocationType =
  | 'government-office'
  | 'bank-currency-chest'
  | 'court'
  | 'hospital'
  | 'ncc'
  | 'other'

// Guard location interface
export interface GuardLocation {
  id: string
  name: string
  code: string
  type: GuardLocationType
  address?: string
  lat?: number
  lng?: number
  requiredPersonnel: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Guard duty assignment
export interface GuardDutyAssignment {
  id: string
  locationId: string
  personnelIds: string[]
  date: string
  shift?: 'A' | 'B' | 'C' // For check posts
  status: 'scheduled' | 'active' | 'completed'
  createdBy: string
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// 1.5 VIP Escort and Gunman Types
// Requirements: 9.1, 9.2, 9.3
// -----------------------------------------------------------------------------

// VIP/Official types
export type VIPType = 'religious-leader' | 'government-official' | 'judge' | 'police-officer'

// VIP escort assignment
export interface VIPEscortAssignment {
  id: string
  vipName: string
  vipDesignation: string
  vipType: VIPType
  assignedPersonnelIds: string[]
  startDate: string
  endDate?: string // Ongoing if not set
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Gunman assignment
export interface GunmanAssignment {
  id: string
  officialName: string
  officialDesignation: string
  assignedPersonnelIds: string[]
  startDate: string
  endDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// 1.6 Form 168 Daily Duty Types
// Requirements: 13.1, 13.2, 13.4
// -----------------------------------------------------------------------------

// Check post shift times
// A: 05:00-13:00, B: 13:00-21:00, C: 21:00-05:00
export type CheckPostShift = 'A' | 'B' | 'C'

// Form 168 duty categories
export type Form168DutyCategory =
  | 'vip-escort'
  | 'striking-force'
  | 'check-post'
  | 'prisoner-escort'
  | 'cash-escort'
  | 'court-duty'
  | 'exam-guard'
  | 'hq-duty'
  | 'special-duty'

// Form 168 entry
export interface Form168Entry {
  id: string
  date: string
  category: Form168DutyCategory
  description: string
  personnelIds: string[]
  location?: string
  shift?: CheckPostShift
  startTime?: string
  endTime?: string
  remarks?: string
  recordedBy: string
  createdAt: string
  updatedAt: string
}

// Daily Form 168 summary
export interface Form168Daily {
  id: string
  date: string
  entries: Form168Entry[]
  totalPersonnelDeployed: number
  recordedBy: string
  approvedBy?: string
  status: 'draft' | 'submitted' | 'approved'
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// 1.7 Leave and Status Tracking Types
// Requirements: 17.1, 17.2, 17.3
// -----------------------------------------------------------------------------

// Karnataka Police leave types
// CL: Casual Leave, CML: Casual Medical Leave, EL: Earned Leave, PL: Privilege Leave
export type KPLeaveType = 'CL' | 'CML' | 'EL' | 'PL'

// Leave request with detailed tracking
export interface KPLeaveRequest {
  id: string
  personnelId: string
  leaveType: KPLeaveType
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approvedBy?: string
  approvedAt?: string
  replacementId?: string
  affectedDuties: string[]
  createdAt: string
  updatedAt: string
}

// Leave balance tracking (renamed to avoid conflict with existing LeaveBalance)
export interface KPLeaveBalance {
  personnelId: string
  year: number
  balances: {
    type: KPLeaveType
    entitled: number
    used: number
    remaining: number
  }[]
}

// -----------------------------------------------------------------------------
// 1.8 PMT, Recruit, and Strength Tracking Types
// Requirements: 15.1, 16.1, 21.1, 21.2
// -----------------------------------------------------------------------------

// Training program types
export interface TrainingProgram {
  id: string
  name: string
  location: string
  startDate: string
  endDate?: string
  personnelIds: string[]
  status: 'scheduled' | 'ongoing' | 'completed'
  createdAt: string
  updatedAt: string
}

// Recruit APC tracking
export interface RecruitAPC {
  id: string
  personnelId: string
  name: string
  trainingStartDate: string
  expectedCompletionDate: string
  status: 'training' | 'graduated' | 'dropped'
  graduationDate?: string
  createdAt: string
  updatedAt: string
}

// Strength by rank
export interface RankStrength {
  rank: PoliceRank
  sanctioned: number
  present: number
  vacancy: number // Can be negative for extra personnel
  extra: number
}

// Overall strength summary
export interface StrengthSummary {
  totalSanctioned: number
  totalPresent: number
  totalVacancy: number
  byRank: RankStrength[]
  bySection: {
    section: SectionType
    count: number
  }[]
  updatedAt: string
}

// -----------------------------------------------------------------------------
// 1.9 Striking Force Types
// Requirements: 7.1, 7.2
// -----------------------------------------------------------------------------

// Striking force sub-teams
export type StrikingForceTeam =
  | 'cc-room-sf-i'
  | 'cc-room-sf-ii'
  | 'car-stand-by-i'
  | 'car-stand-by-ii'
  | 'car-stand-by-iii'

// Striking force team configuration
export interface StrikingForceConfig {
  id: string
  team: StrikingForceTeam
  name: string
  requiredPersonnel: number
  currentPersonnelIds: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}
