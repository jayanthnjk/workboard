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
  Notification,
  AuditEntry,
} from '@/types'

// Users for authentication
export const users: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@workboard.com',
    name: 'John Administrator',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    departmentId: 'dept-1',
    employeeId: 'emp-1',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-02-15T09:30:00Z',
  },
  {
    id: 'user-2',
    username: 'supervisor',
    email: 'supervisor@workboard.com',
    name: 'Sarah Supervisor',
    role: 'supervisor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=supervisor',
    departmentId: 'dept-2',
    employeeId: 'emp-2',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-02-15T08:45:00Z',
  },
  {
    id: 'user-3',
    username: 'employee',
    email: 'employee@workboard.com',
    name: 'Mike Employee',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=employee',
    departmentId: 'dept-2',
    employeeId: 'emp-3',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-02-14T17:00:00Z',
  },
]

// Departments
export const departments: Department[] = [
  {
    id: 'dept-1',
    name: 'Administration',
    code: 'ADMIN',
    description: 'Administrative and management staff',
    employeeCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-2',
    name: 'Operations',
    code: 'OPS',
    description: 'Operations and floor staff',
    employeeCount: 25,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-3',
    name: 'Customer Service',
    code: 'CS',
    description: 'Customer service representatives',
    employeeCount: 15,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-4',
    name: 'Warehouse',
    code: 'WH',
    description: 'Warehouse and logistics staff',
    parentId: 'dept-2',
    employeeCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-5',
    name: 'IT Support',
    code: 'IT',
    description: 'IT support and maintenance',
    employeeCount: 8,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Locations
export const locations: Location[] = [
  {
    id: 'loc-1',
    name: 'Main Office',
    address: '123 Business Park',
    city: 'London',
    timezone: 'Europe/London',
    capacity: 100,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-2',
    name: 'North Branch',
    address: '456 Industrial Estate',
    city: 'Manchester',
    timezone: 'Europe/London',
    capacity: 50,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-3',
    name: 'South Branch',
    address: '789 Commerce Way',
    city: 'Birmingham',
    timezone: 'Europe/London',
    capacity: 40,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Generate 50+ employees
const firstNames = ['James', 'Emma', 'Oliver', 'Sophia', 'William', 'Ava', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Daniel', 'Harper', 'Matthew', 'Evelyn', 'Joseph', 'Abigail', 'David', 'Emily', 'Andrew', 'Elizabeth', 'Ryan']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris']
const skills = ['customer-service', 'forklift', 'inventory', 'leadership', 'first-aid', 'cash-handling', 'data-entry', 'technical-support', 'sales', 'training']

export const employees: Employee[] = Array.from({ length: 55 }, (_, i) => {
  const firstName = firstNames[i % firstNames.length]
  const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]
  const deptIndex = i % departments.length
  const roleOptions: ('admin' | 'supervisor' | 'employee')[] = ['employee', 'employee', 'employee', 'supervisor', 'admin']
  
  return {
    id: `emp-${i + 1}`,
    employeeId: `EMP${String(i + 1).padStart(4, '0')}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@workboard.com`,
    phone: `+44 7${String(Math.floor(Math.random() * 900000000 + 100000000))}`,
    departmentId: departments[deptIndex].id,
    role: roleOptions[i % roleOptions.length],
    skills: skills.slice(0, Math.floor(Math.random() * 4) + 1),
    status: i < 50 ? 'active' : 'inactive',
    hireDate: new Date(2020 + Math.floor(i / 20), i % 12, (i % 28) + 1).toISOString(),
    preferences: {
      preferredShifts: ['morning', 'afternoon'].slice(0, Math.floor(Math.random() * 2) + 1),
      unavailableDays: [0, 6].slice(0, Math.floor(Math.random() * 2)),
      maxHoursPerWeek: 40,
      preferredLocations: [locations[i % locations.length].id],
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
})

// Shift Types
export const shiftTypes: ShiftType[] = [
  {
    id: 'shift-1',
    name: 'Morning Shift',
    startTime: '06:00',
    endTime: '14:00',
    breakDuration: 30,
    colorCode: '#4CAF50',
    category: 'regular',
    description: 'Standard morning shift',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'shift-2',
    name: 'Afternoon Shift',
    startTime: '14:00',
    endTime: '22:00',
    breakDuration: 30,
    colorCode: '#2196F3',
    category: 'regular',
    description: 'Standard afternoon shift',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'shift-3',
    name: 'Night Shift',
    startTime: '22:00',
    endTime: '06:00',
    breakDuration: 45,
    colorCode: '#9C27B0',
    category: 'regular',
    description: 'Standard night shift',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'shift-4',
    name: 'On-Call',
    startTime: '00:00',
    endTime: '23:59',
    breakDuration: 0,
    colorCode: '#FF9800',
    category: 'on-call',
    description: 'On-call availability',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'shift-5',
    name: 'Training',
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 60,
    colorCode: '#00BCD4',
    category: 'training',
    description: 'Training session',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'shift-6',
    name: 'Overtime',
    startTime: '18:00',
    endTime: '22:00',
    breakDuration: 15,
    colorCode: '#F44336',
    category: 'overtime',
    description: 'Overtime shift',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Shift Patterns
export const shiftPatterns: ShiftPattern[] = [
  {
    id: 'pattern-1',
    name: 'Standard Rotation',
    description: 'Weekly rotation through morning, afternoon, night',
    rotationCycle: 21,
    shiftTypeIds: ['shift-1', 'shift-2', 'shift-3'],
    sequence: ['shift-1', 'shift-1', 'shift-1', 'shift-1', 'shift-1', 'off', 'off', 'shift-2', 'shift-2', 'shift-2', 'shift-2', 'shift-2', 'off', 'off', 'shift-3', 'shift-3', 'shift-3', 'shift-3', 'shift-3', 'off', 'off'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pattern-2',
    name: 'Day Shift Only',
    description: 'Fixed day shift pattern',
    rotationCycle: 7,
    shiftTypeIds: ['shift-1', 'shift-2'],
    sequence: ['shift-1', 'shift-1', 'shift-2', 'shift-2', 'shift-1', 'off', 'off'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pattern-3',
    name: '4 On 4 Off',
    description: 'Four days on, four days off rotation',
    rotationCycle: 8,
    shiftTypeIds: ['shift-1', 'shift-3'],
    sequence: ['shift-1', 'shift-1', 'shift-3', 'shift-3', 'off', 'off', 'off', 'off'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Rotation Rules
export const rotationRules: RotationRule[] = [
  {
    id: 'rule-1',
    name: 'Minimum Rest Period',
    type: 'round-robin',
    description: 'Ensure minimum 11 hours rest between shifts',
    minRestHours: 11,
    maxConsecutiveDays: 6,
    priority: 1,
    constraints: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rule-2',
    name: 'Skill-Based Assignment',
    type: 'skill-based',
    description: 'Assign shifts based on required skills',
    minRestHours: 11,
    maxConsecutiveDays: 5,
    priority: 2,
    constraints: [
      { type: 'skill-required', value: 'forklift', description: 'Forklift certification required' },
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rule-3',
    name: 'Weekend Rotation',
    type: 'round-robin',
    description: 'Fair distribution of weekend shifts',
    minRestHours: 11,
    maxConsecutiveDays: 6,
    priority: 3,
    constraints: [
      { type: 'weekend', value: 'rotate', description: 'Rotate weekend assignments fairly' },
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rule-4',
    name: 'Holiday Coverage',
    type: 'seniority-based',
    description: 'Holiday shift assignment by seniority',
    minRestHours: 11,
    maxConsecutiveDays: 5,
    priority: 4,
    constraints: [
      { type: 'holiday', value: 'seniority-preference', description: 'Senior staff get holiday preference' },
    ],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Generate shift assignments for the current month
const today = new Date()
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

export const shiftAssignments: ShiftAssignment[] = []
for (let day = 0; day < 30; day++) {
  const date = new Date(startOfMonth)
  date.setDate(date.getDate() + day)
  const dateStr = date.toISOString().split('T')[0]
  
  // Assign shifts to employees
  for (let i = 0; i < 15; i++) {
    const empIndex = (day + i) % employees.filter(e => e.status === 'active').length
    const shiftIndex = i % 3
    
    shiftAssignments.push({
      id: `assign-${day}-${i}`,
      employeeId: employees[empIndex].id,
      shiftTypeId: shiftTypes[shiftIndex].id,
      date: dateStr,
      locationId: locations[i % locations.length].id,
      status: day < 15 ? 'completed' : day < 20 ? 'confirmed' : 'scheduled',
      createdBy: 'user-1',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    })
  }
}

// Leave Requests
export const leaveRequests: LeaveRequest[] = [
  {
    id: 'leave-1',
    employeeId: 'emp-5',
    leaveType: 'annual',
    startDate: new Date(today.getFullYear(), today.getMonth(), 20).toISOString().split('T')[0],
    endDate: new Date(today.getFullYear(), today.getMonth(), 25).toISOString().split('T')[0],
    reason: 'Family vacation',
    status: 'pending',
    affectedShifts: ['assign-20-4', 'assign-21-4', 'assign-22-4'],
    createdAt: '2024-02-10T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z',
  },
  {
    id: 'leave-2',
    employeeId: 'emp-8',
    leaveType: 'sick',
    startDate: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0],
    endDate: new Date(today.getFullYear(), today.getMonth(), 12).toISOString().split('T')[0],
    reason: 'Medical appointment',
    status: 'approved',
    approvedBy: 'user-2',
    approvedAt: '2024-02-09T14:00:00Z',
    replacementId: 'emp-12',
    affectedShifts: ['assign-10-7', 'assign-11-7'],
    createdAt: '2024-02-08T00:00:00Z',
    updatedAt: '2024-02-09T14:00:00Z',
  },
  {
    id: 'leave-3',
    employeeId: 'emp-15',
    leaveType: 'personal',
    startDate: new Date(today.getFullYear(), today.getMonth() + 1, 5).toISOString().split('T')[0],
    endDate: new Date(today.getFullYear(), today.getMonth() + 1, 5).toISOString().split('T')[0],
    reason: 'Personal matters',
    status: 'pending',
    affectedShifts: [],
    createdAt: '2024-02-12T00:00:00Z',
    updatedAt: '2024-02-12T00:00:00Z',
  },
]

// Swap Requests
export const swapRequests: SwapRequest[] = [
  {
    id: 'swap-1',
    requesterId: 'emp-3',
    targetId: 'emp-7',
    requesterShiftId: 'assign-18-2',
    targetShiftId: 'assign-18-6',
    reason: 'Need to attend a family event',
    status: 'pending',
    requesterAccepted: true,
    targetAccepted: true,
    createdAt: '2024-02-14T10:00:00Z',
    updatedAt: '2024-02-14T15:00:00Z',
  },
  {
    id: 'swap-2',
    requesterId: 'emp-5',
    targetId: 'emp-10',
    requesterShiftId: 'assign-22-4',
    targetShiftId: 'assign-22-9',
    reason: 'Doctor appointment in the morning',
    status: 'approved',
    requesterAccepted: true,
    targetAccepted: true,
    supervisorApproved: true,
    approvedBy: 'user-2',
    approvedAt: '2024-02-13T11:00:00Z',
    createdAt: '2024-02-12T09:00:00Z',
    updatedAt: '2024-02-13T11:00:00Z',
  },
  {
    id: 'swap-3',
    requesterId: 'emp-12',
    targetId: 'emp-15',
    requesterShiftId: 'assign-25-11',
    targetShiftId: 'assign-25-14',
    reason: 'Personal commitment',
    status: 'pending',
    requesterAccepted: true,
    targetAccepted: false,
    createdAt: '2024-02-15T08:30:00Z',
    updatedAt: '2024-02-15T08:30:00Z',
  },
  {
    id: 'swap-4',
    requesterId: 'emp-8',
    targetId: 'emp-20',
    requesterShiftId: 'assign-19-7',
    targetShiftId: 'assign-19-5',
    reason: 'Childcare arrangement conflict',
    status: 'rejected',
    requesterAccepted: true,
    targetAccepted: true,
    supervisorApproved: false,
    approvedBy: 'user-2',
    approvedAt: '2024-02-11T16:00:00Z',
    createdAt: '2024-02-10T14:00:00Z',
    updatedAt: '2024-02-11T16:00:00Z',
  },
  {
    id: 'swap-5',
    requesterId: 'emp-25',
    targetId: 'emp-30',
    requesterShiftId: 'assign-28-10',
    targetShiftId: 'assign-28-12',
    reason: 'University exam preparation',
    status: 'pending',
    requesterAccepted: true,
    targetAccepted: true,
    createdAt: '2024-02-15T12:00:00Z',
    updatedAt: '2024-02-15T14:30:00Z',
  },
]

// Notifications
export const notifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-2',
    type: 'leave-request',
    category: 'action-required',
    title: 'Leave Request Pending',
    message: 'James Smith has requested annual leave from Feb 20-25',
    link: '/leave-requests',
    isRead: false,
    createdAt: '2024-02-10T10:00:00Z',
  },
  {
    id: 'notif-2',
    userId: 'user-3',
    type: 'schedule-change',
    category: 'informational',
    title: 'Schedule Updated',
    message: 'Your shift on Feb 18 has been changed to afternoon shift',
    link: '/schedule',
    isRead: false,
    createdAt: '2024-02-15T09:00:00Z',
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'system-alert',
    category: 'urgent',
    title: 'Coverage Gap Detected',
    message: 'No coverage for Night Shift on Feb 22 at North Branch',
    link: '/schedule',
    isRead: false,
    createdAt: '2024-02-15T08:00:00Z',
  },
  {
    id: 'notif-4',
    userId: 'user-2',
    type: 'swap-request',
    category: 'action-required',
    title: 'Swap Request Approval',
    message: 'Emma Johnson and Oliver Williams want to swap shifts on Feb 19',
    link: '/swap-requests',
    isRead: true,
    createdAt: '2024-02-14T16:00:00Z',
  },
]

// Audit Entries
export const auditEntries: AuditEntry[] = [
  {
    id: 'audit-1',
    userId: 'user-1',
    userName: 'John Administrator',
    action: 'create',
    entityType: 'employee',
    entityId: 'emp-55',
    entityName: 'New Employee',
    afterValue: { name: 'New Employee', departmentId: 'dept-2' },
    timestamp: '2024-02-15T10:30:00Z',
  },
  {
    id: 'audit-2',
    userId: 'user-2',
    userName: 'Sarah Supervisor',
    action: 'update',
    entityType: 'leave-request',
    entityId: 'leave-2',
    entityName: 'Leave Request',
    beforeValue: { status: 'pending' },
    afterValue: { status: 'approved' },
    timestamp: '2024-02-09T14:00:00Z',
  },
  {
    id: 'audit-3',
    userId: 'user-1',
    userName: 'John Administrator',
    action: 'login',
    entityType: 'user',
    entityId: 'user-1',
    entityName: 'John Administrator',
    timestamp: '2024-02-15T09:30:00Z',
  },
]

// Leave Balances
export const leaveBalances: Record<string, { type: string; total: number; used: number; remaining: number }[]> = {}
employees.forEach(emp => {
  leaveBalances[emp.id] = [
    { type: 'annual', total: 25, used: Math.floor(Math.random() * 10), remaining: 0 },
    { type: 'sick', total: 10, used: Math.floor(Math.random() * 3), remaining: 0 },
    { type: 'personal', total: 5, used: Math.floor(Math.random() * 2), remaining: 0 },
  ]
  leaveBalances[emp.id].forEach(b => { b.remaining = b.total - b.used })
})

export const seedData = {
  users,
  departments,
  locations,
  employees,
  shiftTypes,
  shiftPatterns,
  rotationRules,
  shiftAssignments,
  leaveRequests,
  swapRequests,
  notifications,
  auditEntries,
  leaveBalances,
}

export default seedData
