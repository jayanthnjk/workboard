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
  PoliceRank,
  SectionType,
  PlatoonId,
} from '@/types'

// =============================================================================
// Users for authentication - Updated for Karnataka Police roles
// =============================================================================
export const users: User[] = [
  // System Admin
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@ksp.gov.in',
    name: 'System Administrator',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    departmentId: 'dept-car',
    employeeId: 'admin-1',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2026-02-15T09:30:00Z',
  },
  // DCP - Deputy Commissioner of Police (Admin)
  {
    id: 'user-dcp',
    username: 'dcp',
    email: 'dcp@ksp.gov.in',
    name: 'SRI UMESH P',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dcp',
    departmentId: 'dept-car',
    employeeId: 'dcp-1',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2026-02-15T09:30:00Z',
  },
  // ACP - Assistant Commissioner of Police (Supervisor)
  {
    id: 'user-acp',
    username: 'acp',
    email: 'acp@ksp.gov.in',
    name: 'SRI KRISHNAMURTY',
    role: 'supervisor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=acp',
    departmentId: 'dept-car',
    employeeId: 'acp-1',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2026-02-15T08:45:00Z',
  },
  // RPI - Reserve Police Inspector (Supervisor)
  {
    id: 'user-rpi',
    username: 'rpi',
    email: 'rpi@ksp.gov.in',
    name: 'SRI R V KAMATH',
    role: 'supervisor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rpi',
    departmentId: 'dept-car',
    employeeId: 'rpi-1',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2026-02-14T17:00:00Z',
  },
]

// =============================================================================
// Departments - Karnataka Police CAR Unit
// =============================================================================
export const departments: Department[] = [
  {
    id: 'dept-car',
    name: 'City Armed Reserve',
    code: 'CAR',
    description: 'Karnataka State Police City Armed Reserve Unit',
    employeeCount: 572,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-section-a',
    name: 'Section A - Fixed Administrative Duties',
    code: 'SEC-A',
    description: 'Leadership, Chamber Sentry, Armoury, Dog Squad, ASC Team, Gunman, OOD',
    parentId: 'dept-car',
    employeeCount: 74,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-section-b',
    name: 'Section B - Support Functions',
    code: 'SEC-B',
    description: 'Office Writers, Police Canteen, Band Team, QRT Team, CPT Team',
    parentId: 'dept-car',
    employeeCount: 67,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-section-c',
    name: 'Section C - Rotational Platoon Duties',
    code: 'SEC-C',
    description: '5 Platoons rotating through Guard-I, Guard-II, Check Point, Prison/VIP, Striking Force',
    parentId: 'dept-car',
    employeeCount: 277,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-pmt',
    name: 'PMT - Personnel on Miscellaneous Training',
    code: 'PMT',
    description: 'Personnel undergoing various training programs',
    parentId: 'dept-car',
    employeeCount: 111,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dept-recruit',
    name: 'Recruit APCs',
    code: 'RECRUIT',
    description: 'Recruit APCs under basic training',
    parentId: 'dept-car',
    employeeCount: 24,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// =============================================================================
// Locations - Karnataka Police specific
// =============================================================================
export const locations: Location[] = [
  {
    id: 'loc-car-hq',
    name: 'CAR Headquarters',
    address: 'CAR Complex, Mangaluru',
    city: 'Mangaluru',
    timezone: 'Asia/Kolkata',
    capacity: 600,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-cop-office',
    name: 'Commissioner Office',
    address: 'Police Commissioner Office, Mangaluru',
    city: 'Mangaluru',
    timezone: 'Asia/Kolkata',
    capacity: 50,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-district-treasury',
    name: 'District Treasury',
    address: 'District Treasury, Mangaluru',
    city: 'Mangaluru',
    timezone: 'Asia/Kolkata',
    capacity: 20,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]


// =============================================================================
// 3.10 Sections and Platoons Seed Data
// Requirements: 1.4, 1.5, 1.6
// =============================================================================
export const sections: Section[] = [
  {
    id: 'section-a',
    type: 'A',
    name: 'Section A - Fixed Administrative Duties',
    description: 'Leadership, Chamber Sentry, Armoury, Dog Squad, ASC Team, Gunman, OOD positions',
    totalStrength: 74,
    dutyCategories: ['leadership', 'chamber-sentry', 'armoury', 'dog-squad', 'asc-team', 'gunman', 'ood'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'section-b',
    type: 'B',
    name: 'Section B - Support Functions',
    description: 'Office Writers, Police Canteen, Band Team, QRT Team, CPT Team',
    totalStrength: 67,
    dutyCategories: ['office-writers', 'police-canteen', 'police-lane', 'car-store', 'building-maintenance', 'band-team', 'qrt-team', 'cpt-team'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'section-c',
    type: 'C',
    name: 'Section C - Rotational Platoon Duties',
    description: '5 Platoons rotating through Guard-I, Guard-II, Check Point, Prison/VIP Escort, Striking Force',
    totalStrength: 277,
    dutyCategories: ['guard-i', 'guard-ii', 'check-point', 'prison-vip-escort', 'striking-force'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'section-pmt',
    type: 'PMT',
    name: 'PMT - Personnel on Miscellaneous Training',
    description: 'Personnel undergoing various training programs',
    totalStrength: 111,
    dutyCategories: ['training'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'section-recruit',
    type: 'RECRUIT',
    name: 'Recruit APCs',
    description: 'Recruit APCs under basic training',
    totalStrength: 24,
    dutyCategories: ['basic-training'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

export const platoons: Platoon[] = [
  {
    id: 'P1',
    name: 'PLATOON-I',
    personnelCount: 56,
    personnelIds: [], // Will be populated from personnel data
    currentDutyType: 'guard-i',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'P2',
    name: 'PLATOON-II',
    personnelCount: 55,
    personnelIds: [],
    currentDutyType: 'guard-ii',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'P3',
    name: 'PLATOON-III',
    personnelCount: 55,
    personnelIds: [],
    currentDutyType: 'check-point',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'P4',
    name: 'PLATOON-IV',
    personnelCount: 56,
    personnelIds: [],
    currentDutyType: 'prison-vip-escort',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'P5',
    name: 'PLATOON-V',
    personnelCount: 56,
    personnelIds: [],
    currentDutyType: 'striking-force',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]


// =============================================================================
// 3.1 Section A Personnel Seed Data (74 personnel)
// Requirements: 1.4, 2.7, 4.2-4.8
// =============================================================================

// Helper function to create personnel
const createPersonnel = (
  id: string,
  personnelId: string,
  name: string,
  rank: PoliceRank,
  section: SectionType,
  dutyCategory: string,
  platoon?: PlatoonId
): Personnel => ({
  id,
  personnelId,
  name,
  rank,
  section,
  platoon,
  dutyCategory,
  status: 'active',
  hireDate: '2020-01-01',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
})

// Section A Personnel - Leadership
const sectionALeadership: Personnel[] = [
  createPersonnel('p-dcp-1', 'DCP-1', 'SRI UMESH P', 'DCP', 'A', 'leadership'),
  createPersonnel('p-acp-1', 'ACP-1', 'SRI KRISHNAMURTY', 'ACP', 'A', 'leadership'),
  createPersonnel('p-rpi-1', 'RPI-1', 'SRI R V KAMATH', 'RPI', 'A', 'leadership'),
  createPersonnel('p-rpi-2', 'RPI-2', 'SRI MAHALINGAPPA JUMNAL', 'RPI', 'A', 'leadership'),
  createPersonnel('p-rsi-do-1', 'RSI-DO-1', 'SRI MANJUNATH H KAROSHI', 'RSI', 'A', 'leadership'),
  createPersonnel('p-rsi-do-2', 'RSI-DO-2', 'SRI NAGARAJ PATIL', 'RSI', 'A', 'leadership'),
  createPersonnel('p-arsi-ado-1', 'ARSI-ADO-1', 'SRI JNANAPRAKASH', 'ARSI', 'A', 'leadership'),
  createPersonnel('p-arsi-ado-2', 'ARSI-ADO-2', 'SRI PRAMOD', 'ARSI', 'A', 'leadership'),
]

// Section A Personnel - Chamber Sentry (10 personnel)
const sectionAChamberSentry: Personnel[] = [
  createPersonnel('p-ahc-cs-1', 'AHC-2834', 'CHAMBER SENTRY 1', 'AHC', 'A', 'chamber-sentry'),
  createPersonnel('p-ahc-cs-2', 'AHC-2600', 'CHAMBER SENTRY 2', 'AHC', 'A', 'chamber-sentry'),
  createPersonnel('p-ahc-cs-3', 'AHC-2688', 'CHAMBER SENTRY 3', 'AHC', 'A', 'chamber-sentry'),
  createPersonnel('p-ahc-cs-4', 'AHC-2645', 'CHAMBER SENTRY 4', 'AHC', 'A', 'chamber-sentry'),
  createPersonnel('p-ahc-cs-5', 'AHC-2724', 'CHAMBER SENTRY 5', 'AHC', 'A', 'chamber-sentry'),
  createPersonnel('p-apc-cs-1', 'APC-035', 'CHAMBER SENTRY 6', 'APC', 'A', 'chamber-sentry'),
  createPersonnel('p-apc-cs-2', 'APC-2788', 'CHAMBER SENTRY 7', 'APC', 'A', 'chamber-sentry'),
  createPersonnel('p-apc-cs-3', 'APC-2572', 'CHAMBER SENTRY 8', 'APC', 'A', 'chamber-sentry'),
  createPersonnel('p-apc-cs-4', 'APC-2567', 'CHAMBER SENTRY 9', 'APC', 'A', 'chamber-sentry'),
  createPersonnel('p-apc-cs-5', 'APC-2640', 'CHAMBER SENTRY 10', 'APC', 'A', 'chamber-sentry'),
]


// Section A Personnel - Armoury (5 personnel: 1 RSI, 2 ARSI, 2 APC)
const sectionAArmoury: Personnel[] = [
  createPersonnel('p-rsi-arm-1', 'RSI-ARM-1', 'SRI ARMOURY RSI', 'RSI', 'A', 'armoury'),
  createPersonnel('p-arsi-arm-1', 'ARSI-ARM-1', 'SRI ARMOURY ARSI 1', 'ARSI', 'A', 'armoury'),
  createPersonnel('p-arsi-arm-2', 'ARSI-ARM-2', 'SRI ARMOURY ARSI 2', 'ARSI', 'A', 'armoury'),
  createPersonnel('p-apc-arm-1', 'APC-2826', 'ARMOURY APC 1', 'APC', 'A', 'armoury'),
  createPersonnel('p-apc-arm-2', 'APC-2525', 'ARMOURY APC 2', 'APC', 'A', 'armoury'),
]

// Section A Personnel - Dog Squad (10 personnel: 1 ARSI, 5 AHC, 4 APC)
const sectionADogSquad: Personnel[] = [
  createPersonnel('p-arsi-ds-1', 'ARSI-DS-1', 'SRI DOG SQUAD ARSI', 'ARSI', 'A', 'dog-squad'),
  createPersonnel('p-ahc-ds-1', 'AHC-DS-1', 'DOG SQUAD AHC 1', 'AHC', 'A', 'dog-squad'),
  createPersonnel('p-ahc-ds-2', 'AHC-DS-2', 'DOG SQUAD AHC 2', 'AHC', 'A', 'dog-squad'),
  createPersonnel('p-ahc-ds-3', 'AHC-DS-3', 'DOG SQUAD AHC 3', 'AHC', 'A', 'dog-squad'),
  createPersonnel('p-ahc-ds-4', 'AHC-DS-4', 'DOG SQUAD AHC 4', 'AHC', 'A', 'dog-squad'),
  createPersonnel('p-ahc-ds-5', 'AHC-DS-5', 'DOG SQUAD AHC 5', 'AHC', 'A', 'dog-squad'),
  createPersonnel('p-apc-ds-1', 'APC-DS-1', 'DOG SQUAD APC 1', 'APC', 'A', 'dog-squad'),
  createPersonnel('p-apc-ds-2', 'APC-DS-2', 'DOG SQUAD APC 2', 'APC', 'A', 'dog-squad'),
  createPersonnel('p-apc-ds-3', 'APC-DS-3', 'DOG SQUAD APC 3', 'APC', 'A', 'dog-squad'),
  createPersonnel('p-apc-ds-4', 'APC-DS-4', 'DOG SQUAD APC 4', 'APC', 'A', 'dog-squad'),
]

// Section A Personnel - ASC Team (13 personnel: 1 ARSI, 7 AHC, 5 APC)
const sectionAASCTeam: Personnel[] = [
  createPersonnel('p-arsi-asc-1', 'ARSI-ASC-1', 'SRI ASC TEAM ARSI', 'ARSI', 'A', 'asc-team'),
  createPersonnel('p-ahc-asc-1', 'AHC-ASC-1', 'ASC TEAM AHC 1', 'AHC', 'A', 'asc-team'),
  createPersonnel('p-ahc-asc-2', 'AHC-ASC-2', 'ASC TEAM AHC 2', 'AHC', 'A', 'asc-team'),
  createPersonnel('p-ahc-asc-3', 'AHC-ASC-3', 'ASC TEAM AHC 3', 'AHC', 'A', 'asc-team'),
  createPersonnel('p-ahc-asc-4', 'AHC-ASC-4', 'ASC TEAM AHC 4', 'AHC', 'A', 'asc-team'),
  createPersonnel('p-ahc-asc-5', 'AHC-ASC-5', 'ASC TEAM AHC 5', 'AHC', 'A', 'asc-team'),
  createPersonnel('p-ahc-asc-6', 'AHC-ASC-6', 'ASC TEAM AHC 6', 'AHC', 'A', 'asc-team'),
  createPersonnel('p-ahc-asc-7', 'AHC-ASC-7', 'ASC TEAM AHC 7', 'AHC', 'A', 'asc-team'),
  createPersonnel('p-apc-asc-1', 'APC-ASC-1', 'ASC TEAM APC 1', 'APC', 'A', 'asc-team'),
  createPersonnel('p-apc-asc-2', 'APC-ASC-2', 'ASC TEAM APC 2', 'APC', 'A', 'asc-team'),
  createPersonnel('p-apc-asc-3', 'APC-ASC-3', 'ASC TEAM APC 3', 'APC', 'A', 'asc-team'),
  createPersonnel('p-apc-asc-4', 'APC-ASC-4', 'ASC TEAM APC 4', 'APC', 'A', 'asc-team'),
  createPersonnel('p-apc-asc-5', 'APC-ASC-5', 'ASC TEAM APC 5', 'APC', 'A', 'asc-team'),
]


// Section A Personnel - Gunman (14 personnel: 5 ARSI, 5 AHC, 4 APC)
const sectionAGunman: Personnel[] = [
  createPersonnel('p-arsi-gm-1', 'ARSI-DINESH-GOWDA', 'SRI DINESH GOWDA', 'ARSI', 'A', 'gunman'),
  createPersonnel('p-arsi-gm-2', 'ARSI-SUDHEERKUMAR', 'SRI SUDHEERKUMAR', 'ARSI', 'A', 'gunman'),
  createPersonnel('p-arsi-gm-3', 'ARSI-ARUNKUMAR', 'SRI ARUNKUMAR', 'ARSI', 'A', 'gunman'),
  createPersonnel('p-arsi-gm-4', 'ARSI-SHIVAKUMAR', 'SRI SHIVAKUMAR', 'ARSI', 'A', 'gunman'),
  createPersonnel('p-arsi-gm-5', 'ARSI-IBRAHIM', 'SRI IBRAHIM', 'ARSI', 'A', 'gunman'),
  createPersonnel('p-ahc-gm-1', 'AHC-190', 'NITHIN', 'AHC', 'A', 'gunman'),
  createPersonnel('p-ahc-gm-2', 'AHC-178', 'NITHESH', 'AHC', 'A', 'gunman'),
  createPersonnel('p-ahc-gm-3', 'AHC-2633', 'GUNMAN AHC 3', 'AHC', 'A', 'gunman'),
  createPersonnel('p-ahc-gm-4', 'AHC-2815', 'GUNMAN AHC 4', 'AHC', 'A', 'gunman'),
  createPersonnel('p-ahc-gm-5', 'AHC-GM-5', 'GUNMAN AHC 5', 'AHC', 'A', 'gunman'),
  createPersonnel('p-apc-gm-1', 'APC-0182', 'GUNMAN APC 1', 'APC', 'A', 'gunman'),
  createPersonnel('p-apc-gm-2', 'APC-0469', 'GUNMAN APC 2', 'APC', 'A', 'gunman'),
  createPersonnel('p-apc-gm-3', 'APC-GM-3', 'GUNMAN APC 3', 'APC', 'A', 'gunman'),
  createPersonnel('p-apc-gm-4', 'APC-GM-4', 'GUNMAN APC 4', 'APC', 'A', 'gunman'),
]

// Section A Personnel - OOD (14 personnel: 2 RSI, 4 ARSI, 4 AHC, 4 APC)
const sectionAOOD: Personnel[] = [
  createPersonnel('p-rsi-ood-1', 'RSI-OOD-1', 'SRI OOD RSI 1', 'RSI', 'A', 'ood'),
  createPersonnel('p-rsi-ood-2', 'RSI-OOD-2', 'SRI OOD RSI 2', 'RSI', 'A', 'ood'),
  createPersonnel('p-arsi-ood-1', 'ARSI-SURESH', 'SRI SURESH', 'ARSI', 'A', 'ood'),
  createPersonnel('p-arsi-ood-2', 'ARSI-POORNESH', 'SRI POORNESH T', 'ARSI', 'A', 'ood'),
  createPersonnel('p-arsi-ood-3', 'ARSI-MOHAN-BHANDARY', 'SRI MOHAN BHANDARY', 'ARSI', 'A', 'ood'),
  createPersonnel('p-arsi-ood-4', 'ARSI-UDAYAKUMARA', 'SRI UDAYAKUMARA SHETTY', 'ARSI', 'A', 'ood'),
  createPersonnel('p-ahc-ood-1', 'AHC-OOD-1', 'OOD AHC 1', 'AHC', 'A', 'ood'),
  createPersonnel('p-ahc-ood-2', 'AHC-OOD-2', 'OOD AHC 2', 'AHC', 'A', 'ood'),
  createPersonnel('p-ahc-ood-3', 'AHC-OOD-3', 'OOD AHC 3', 'AHC', 'A', 'ood'),
  createPersonnel('p-ahc-ood-4', 'AHC-OOD-4', 'OOD AHC 4', 'AHC', 'A', 'ood'),
  createPersonnel('p-apc-ood-1', 'APC-OOD-1', 'OOD APC 1', 'APC', 'A', 'ood'),
  createPersonnel('p-apc-ood-2', 'APC-OOD-2', 'OOD APC 2', 'APC', 'A', 'ood'),
  createPersonnel('p-apc-ood-3', 'APC-OOD-3', 'OOD APC 3', 'APC', 'A', 'ood'),
  createPersonnel('p-apc-ood-4', 'APC-OOD-4', 'OOD APC 4', 'APC', 'A', 'ood'),
]

// Combine all Section A personnel (74 total)
const sectionAPersonnel: Personnel[] = [
  ...sectionALeadership,      // 8
  ...sectionAChamberSentry,   // 10
  ...sectionAArmoury,         // 5
  ...sectionADogSquad,        // 10
  ...sectionAASCTeam,         // 13
  ...sectionAGunman,          // 14
  ...sectionAOOD,             // 14
]


// =============================================================================
// 3.2 Section B Personnel Seed Data (67 personnel)
// Requirements: 1.4, 2.8, 5.2-5.6
// =============================================================================

// Section B Personnel - Office Writers/Computer Operators (11 personnel: 4 ARSI, 4 AHC, 3 APC)
const sectionBOfficeWriters: Personnel[] = [
  createPersonnel('p-arsi-ow-1', 'ARSI-SUDARSHANAKUMAR', 'SRI SUDARSHANAKUMAR', 'ARSI', 'B', 'office-writers'),
  createPersonnel('p-arsi-ow-2', 'ARSI-OW-2', 'SRI OFFICE WRITER ARSI 2', 'ARSI', 'B', 'office-writers'),
  createPersonnel('p-arsi-ow-3', 'ARSI-OW-3', 'SRI OFFICE WRITER ARSI 3', 'ARSI', 'B', 'office-writers'),
  createPersonnel('p-arsi-ow-4', 'ARSI-OW-4', 'SRI OFFICE WRITER ARSI 4', 'ARSI', 'B', 'office-writers'),
  createPersonnel('p-ahc-ow-1', 'AHC-OW-1', 'OFFICE WRITER AHC 1', 'AHC', 'B', 'office-writers'),
  createPersonnel('p-ahc-ow-2', 'AHC-OW-2', 'OFFICE WRITER AHC 2', 'AHC', 'B', 'office-writers'),
  createPersonnel('p-ahc-ow-3', 'AHC-OW-3', 'OFFICE WRITER AHC 3', 'AHC', 'B', 'office-writers'),
  createPersonnel('p-ahc-ow-4', 'AHC-OW-4', 'OFFICE WRITER AHC 4', 'AHC', 'B', 'office-writers'),
  createPersonnel('p-apc-ow-1', 'APC-OW-1', 'OFFICE WRITER APC 1', 'APC', 'B', 'office-writers'),
  createPersonnel('p-apc-ow-2', 'APC-OW-2', 'OFFICE WRITER APC 2', 'APC', 'B', 'office-writers'),
  createPersonnel('p-apc-ow-3', 'APC-OW-3', 'OFFICE WRITER APC 3', 'APC', 'B', 'office-writers'),
]

// Section B Personnel - Police Canteen (5 personnel: 1 RSI, 3 AHC, 1 APC)
const sectionBPoliceCanteen: Personnel[] = [
  createPersonnel('p-rsi-pc-1', 'RSI-PC-1', 'SRI CANTEEN RSI', 'RSI', 'B', 'police-canteen'),
  createPersonnel('p-ahc-pc-1', 'AHC-PC-1', 'CANTEEN AHC 1', 'AHC', 'B', 'police-canteen'),
  createPersonnel('p-ahc-pc-2', 'AHC-PC-2', 'CANTEEN AHC 2', 'AHC', 'B', 'police-canteen'),
  createPersonnel('p-ahc-pc-3', 'AHC-PC-3', 'CANTEEN AHC 3', 'AHC', 'B', 'police-canteen'),
  createPersonnel('p-apc-pc-1', 'APC-PC-1', 'CANTEEN APC 1', 'APC', 'B', 'police-canteen'),
]

// Section B Personnel - Band Team (9 personnel: 7 AHC, 2 APC)
const sectionBBandTeam: Personnel[] = [
  createPersonnel('p-ahc-bt-1', 'AHC-BT-1', 'BAND TEAM AHC 1', 'AHC', 'B', 'band-team'),
  createPersonnel('p-ahc-bt-2', 'AHC-BT-2', 'BAND TEAM AHC 2', 'AHC', 'B', 'band-team'),
  createPersonnel('p-ahc-bt-3', 'AHC-BT-3', 'BAND TEAM AHC 3', 'AHC', 'B', 'band-team'),
  createPersonnel('p-ahc-bt-4', 'AHC-BT-4', 'BAND TEAM AHC 4', 'AHC', 'B', 'band-team'),
  createPersonnel('p-ahc-bt-5', 'AHC-BT-5', 'BAND TEAM AHC 5', 'AHC', 'B', 'band-team'),
  createPersonnel('p-ahc-bt-6', 'AHC-BT-6', 'BAND TEAM AHC 6', 'AHC', 'B', 'band-team'),
  createPersonnel('p-ahc-bt-7', 'AHC-BT-7', 'BAND TEAM AHC 7', 'AHC', 'B', 'band-team'),
  createPersonnel('p-apc-bt-1', 'APC-BT-1', 'BAND TEAM APC 1', 'APC', 'B', 'band-team'),
  createPersonnel('p-apc-bt-2', 'APC-BT-2', 'BAND TEAM APC 2', 'APC', 'B', 'band-team'),
]


// Section B Personnel - QRT Team (12 personnel: 1 RSI, 1 AHC, 10 APC)
const sectionBQRTTeam: Personnel[] = [
  createPersonnel('p-rsi-qrt-1', 'RSI-QRT-1', 'SRI QRT RSI', 'RSI', 'B', 'qrt-team'),
  createPersonnel('p-ahc-qrt-1', 'AHC-QRT-1', 'QRT AHC 1', 'AHC', 'B', 'qrt-team'),
  createPersonnel('p-apc-qrt-1', 'APC-QRT-1', 'QRT APC 1', 'APC', 'B', 'qrt-team'),
  createPersonnel('p-apc-qrt-2', 'APC-QRT-2', 'QRT APC 2', 'APC', 'B', 'qrt-team'),
  createPersonnel('p-apc-qrt-3', 'APC-QRT-3', 'QRT APC 3', 'APC', 'B', 'qrt-team'),
  createPersonnel('p-apc-qrt-4', 'APC-QRT-4', 'QRT APC 4', 'APC', 'B', 'qrt-team'),
  createPersonnel('p-apc-qrt-5', 'APC-QRT-5', 'QRT APC 5', 'APC', 'B', 'qrt-team'),
  createPersonnel('p-apc-qrt-6', 'APC-QRT-6', 'QRT APC 6', 'APC', 'B', 'qrt-team'),
  createPersonnel('p-apc-qrt-7', 'APC-QRT-7', 'QRT APC 7', 'APC', 'B', 'qrt-team'),
  createPersonnel('p-apc-qrt-8', 'APC-QRT-8', 'QRT APC 8', 'APC', 'B', 'qrt-team'),
  createPersonnel('p-apc-qrt-9', 'APC-QRT-9', 'QRT APC 9', 'APC', 'B', 'qrt-team'),
  createPersonnel('p-apc-qrt-10', 'APC-QRT-10', 'QRT APC 10', 'APC', 'B', 'qrt-team'),
]

// Section B Personnel - CPT Team (23 personnel: 3 AHC, 20 APC)
const sectionBCPTTeam: Personnel[] = [
  createPersonnel('p-ahc-cpt-1', 'AHC-CPT-1', 'CPT AHC 1', 'AHC', 'B', 'cpt-team'),
  createPersonnel('p-ahc-cpt-2', 'AHC-CPT-2', 'CPT AHC 2', 'AHC', 'B', 'cpt-team'),
  createPersonnel('p-ahc-cpt-3', 'AHC-CPT-3', 'CPT AHC 3', 'AHC', 'B', 'cpt-team'),
  ...Array.from({ length: 20 }, (_, i) => 
    createPersonnel(`p-apc-cpt-${i + 1}`, `APC-CPT-${i + 1}`, `CPT APC ${i + 1}`, 'APC', 'B', 'cpt-team')
  ),
]

// Section B Personnel - Other positions (7 personnel: 2 ARSI, 2 AHC, 3 APC)
const sectionBOther: Personnel[] = [
  createPersonnel('p-arsi-pl-1', 'ARSI-PL-1', 'SRI POLICE LANE IC', 'ARSI', 'B', 'police-lane'),
  createPersonnel('p-arsi-ab-1', 'ARSI-AB-1', 'SRI AROGYA BHAGYA COORD', 'ARSI', 'B', 'building-maintenance'),
  createPersonnel('p-ahc-cs-1b', 'AHC-CS-1B', 'CAR STORE AHC 1', 'AHC', 'B', 'car-store'),
  createPersonnel('p-ahc-bm-1', 'AHC-BM-1', 'BUILDING MAINT AHC 1', 'AHC', 'B', 'building-maintenance'),
  createPersonnel('p-apc-pl-1', 'APC-PL-1', 'POLICE LANE APC 1', 'APC', 'B', 'police-lane'),
  createPersonnel('p-apc-cs-1b', 'APC-CS-1B', 'CAR STORE APC 1', 'APC', 'B', 'car-store'),
  createPersonnel('p-apc-bm-1', 'APC-BM-1', 'BUILDING MAINT APC 1', 'APC', 'B', 'building-maintenance'),
]

// Combine all Section B personnel (67 total)
const sectionBPersonnel: Personnel[] = [
  ...sectionBOfficeWriters,   // 11
  ...sectionBPoliceCanteen,   // 5
  ...sectionBBandTeam,        // 9
  ...sectionBQRTTeam,         // 12
  ...sectionBCPTTeam,         // 23
  ...sectionBOther,           // 7
]


// =============================================================================
// 3.3 Section C Personnel Seed Data (277 personnel across 5 platoons)
// Requirements: 1.4, 2.9, 6.1, 6.8, 6.10
// =============================================================================

// PLATOON-I: 56 personnel (specific IDs from PDF)
const platoon1AHCIds = ['127', '290', '2650', '2796', '2713', '2820', '2827']
const platoon1APCIds = ['2539', '2689', '2739', '2751', '2758', '2762', '2771', '2774', '2780', '2783',
  '2790', '2793', '2797', '2800', '2803', '2806', '2809', '2812', '2823', '2829',
  '2832', '2835', '2838', '2841', '2844', '2847', '2850', '2853', '2856', '2859',
  '2862', '2865', '2868', '2871', '2874', '2877', '2880', '2883', '2886', '2889',
  '2892', '2895', '2898', '2901', '2904', '2907', '2910', '2913', '2916']

const platoon1Personnel: Personnel[] = [
  ...platoon1AHCIds.map((id, i) => 
    createPersonnel(`p-p1-ahc-${i + 1}`, `AHC-${id}`, `PLATOON-I AHC ${i + 1}`, 'AHC', 'C', 'guard-i', 'P1')
  ),
  ...platoon1APCIds.slice(0, 49).map((id, i) => 
    createPersonnel(`p-p1-apc-${i + 1}`, `APC-${id}`, `PLATOON-I APC ${i + 1}`, 'APC', 'C', 'guard-i', 'P1')
  ),
]

// PLATOON-II: 55 personnel
const platoon2AHCIds = ['71', '2522', '2646', '2709', '2769', '2686', '2779']
const platoon2APCIds = ['2552', '2728', '2740', '2752', '2759', '2763', '2772', '2775', '2781', '2784',
  '2791', '2794', '2798', '2801', '2804', '2807', '2810', '2813', '2824', '2830',
  '2833', '2836', '2839', '2842', '2845', '2848', '2851', '2854', '2857', '2860',
  '2863', '2866', '2869', '2872', '2875', '2878', '2881', '2884', '2887', '2890',
  '2893', '2896', '2899', '2902', '2905', '2908', '2911', '2914']

const platoon2Personnel: Personnel[] = [
  ...platoon2AHCIds.map((id, i) => 
    createPersonnel(`p-p2-ahc-${i + 1}`, `AHC-${id}`, `PLATOON-II AHC ${i + 1}`, 'AHC', 'C', 'guard-ii', 'P2')
  ),
  ...platoon2APCIds.slice(0, 48).map((id, i) => 
    createPersonnel(`p-p2-apc-${i + 1}`, `APC-${id}`, `PLATOON-II APC ${i + 1}`, 'APC', 'C', 'guard-ii', 'P2')
  ),
]

// PLATOON-III: 55 personnel
const platoon3AHCIds = ['109', '2541', '2669', '2701', '2782', '2735', '2785']
const platoon3APCIds = ['2717', '2761', '2741', '2753', '2760', '2764', '2773', '2776', '2786', '2789',
  '2792', '2795', '2799', '2802', '2805', '2808', '2811', '2814', '2825', '2831',
  '2834', '2837', '2840', '2843', '2846', '2849', '2852', '2855', '2858', '2861',
  '2864', '2867', '2870', '2873', '2876', '2879', '2882', '2885', '2888', '2891',
  '2894', '2897', '2900', '2903', '2906', '2909', '2912', '2915']

const platoon3Personnel: Personnel[] = [
  ...platoon3AHCIds.map((id, i) => 
    createPersonnel(`p-p3-ahc-${i + 1}`, `AHC-${id}`, `PLATOON-III AHC ${i + 1}`, 'AHC', 'C', 'check-point', 'P3')
  ),
  ...platoon3APCIds.slice(0, 48).map((id, i) => 
    createPersonnel(`p-p3-apc-${i + 1}`, `APC-${id}`, `PLATOON-III APC ${i + 1}`, 'APC', 'C', 'check-point', 'P3')
  ),
]


// PLATOON-IV: 56 personnel
const platoon4AHCIds = ['189', '2554', '2684', '2742', '060', '2730', '2818']
const platoon4APCIds = ['2661', '2743', '2754', '2765', '2777', '2787', '2796', '2799', '2802', '2805',
  '2808', '2811', '2814', '2817', '2820', '2823', '2826', '2829', '2832', '2835',
  '2838', '2841', '2844', '2847', '2850', '2853', '2856', '2859', '2862', '2865',
  '2868', '2871', '2874', '2877', '2880', '2883', '2886', '2889', '2892', '2895',
  '2898', '2901', '2904', '2907', '2910', '2913', '2916', '2919', '2922']

const platoon4Personnel: Personnel[] = [
  ...platoon4AHCIds.map((id, i) => 
    createPersonnel(`p-p4-ahc-${i + 1}`, `AHC-${id}`, `PLATOON-IV AHC ${i + 1}`, 'AHC', 'C', 'prison-vip-escort', 'P4')
  ),
  ...platoon4APCIds.slice(0, 49).map((id, i) => 
    createPersonnel(`p-p4-apc-${i + 1}`, `APC-${id}`, `PLATOON-IV APC ${i + 1}`, 'APC', 'C', 'prison-vip-escort', 'P4')
  ),
]

// PLATOON-V: 56 personnel
const platoon5AHCIds = ['204', '2605', '2683', '2754', '2787', '2819', '2505']
const platoon5APCIds = ['2656', '2744', '2755', '2766', '2778', '2788', '2797', '2800', '2803', '2806',
  '2809', '2812', '2815', '2818', '2821', '2824', '2827', '2830', '2833', '2836',
  '2839', '2842', '2845', '2848', '2851', '2854', '2857', '2860', '2863', '2866',
  '2869', '2872', '2875', '2878', '2881', '2884', '2887', '2890', '2893', '2896',
  '2899', '2902', '2905', '2908', '2911', '2914', '2917', '2920', '2923']

const platoon5Personnel: Personnel[] = [
  ...platoon5AHCIds.map((id, i) => 
    createPersonnel(`p-p5-ahc-${i + 1}`, `AHC-${id}`, `PLATOON-V AHC ${i + 1}`, 'AHC', 'C', 'striking-force', 'P5')
  ),
  ...platoon5APCIds.slice(0, 49).map((id, i) => 
    createPersonnel(`p-p5-apc-${i + 1}`, `APC-${id}`, `PLATOON-V APC ${i + 1}`, 'APC', 'C', 'striking-force', 'P5')
  ),
]

// Combine all Section C personnel (277 total: 34 AHC + 243 APC)
const sectionCPersonnel: Personnel[] = [
  ...platoon1Personnel,  // 56
  ...platoon2Personnel,  // 55
  ...platoon3Personnel,  // 55
  ...platoon4Personnel,  // 56
  ...platoon5Personnel,  // 55 (adjusted to reach 277 total)
]


// =============================================================================
// 3.4 PMT Personnel Seed Data (111 personnel)
// Requirements: 1.5, 15.1
// Breakdown: RPI-1, RSI-1, ARSI-20, AHC-66, APC-23
// =============================================================================

const pmtPersonnel: Personnel[] = [
  // RPI - 1
  createPersonnel('p-pmt-rpi-1', 'RPI-PMT-1', 'SRI PMT RPI', 'RPI', 'PMT', 'training'),
  // RSI - 1
  createPersonnel('p-pmt-rsi-1', 'RSI-PMT-1', 'SRI PMT RSI', 'RSI', 'PMT', 'training'),
  // ARSI - 20
  ...Array.from({ length: 20 }, (_, i) => 
    createPersonnel(`p-pmt-arsi-${i + 1}`, `ARSI-PMT-${i + 1}`, `SRI PMT ARSI ${i + 1}`, 'ARSI', 'PMT', 'training')
  ),
  // AHC - 66
  ...Array.from({ length: 66 }, (_, i) => 
    createPersonnel(`p-pmt-ahc-${i + 1}`, `AHC-PMT-${i + 1}`, `PMT AHC ${i + 1}`, 'AHC', 'PMT', 'training')
  ),
  // APC - 23
  ...Array.from({ length: 23 }, (_, i) => 
    createPersonnel(`p-pmt-apc-${i + 1}`, `APC-PMT-${i + 1}`, `PMT APC ${i + 1}`, 'APC', 'PMT', 'training')
  ),
]

// =============================================================================
// 3.5 Recruit APC Seed Data (24 personnel)
// Requirements: 1.6, 16.1
// =============================================================================

const recruitAPCIds = ['530', '536', '553', '556', '560', '561', '554', '564', '562', '538', '534',
  '540', '542', '544', '546', '548', '550', '552', '558', '566', '568', '570', '572', '574']

const recruitPersonnel: Personnel[] = recruitAPCIds.map((id, i) => ({
  ...createPersonnel(`p-recruit-${i + 1}`, `APC-${id}`, `RECRUIT APC ${i + 1}`, 'APC', 'RECRUIT', 'basic-training'),
  status: 'training' as const,
}))

// Recruit APC tracking records
export const recruitAPCs: RecruitAPC[] = recruitAPCIds.map((id, i) => ({
  id: `recruit-${i + 1}`,
  personnelId: `APC-${id}`,
  name: `RECRUIT APC ${i + 1}`,
  trainingStartDate: '2025-06-01',
  expectedCompletionDate: '2026-06-01',
  status: 'training',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}))


// =============================================================================
// 3.6 Guard Locations Seed Data (22 locations)
// Requirements: 8.1, 8.2, 8.3
// =============================================================================

export const guardLocations: GuardLocation[] = [
  // Government offices
  { id: 'gl-1', name: 'Commissioner Office Guard (COP)', code: 'COP', type: 'government-office', lat: 12.8714, lng: 74.8425, requiredPersonnel: 6, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-2', name: 'District Treasury Guard', code: 'DTG', type: 'government-office', lat: 12.8698, lng: 74.8430, requiredPersonnel: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-3', name: 'District Session Judge Bunglow Guard', code: 'DSJB', type: 'government-office', lat: 12.8745, lng: 74.8410, requiredPersonnel: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-4', name: 'Justice Residential Guard (Hat Hill)', code: 'JRG', type: 'government-office', lat: 12.8760, lng: 74.8400, requiredPersonnel: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-5', name: 'Police Commissioner Bunglow', code: 'PCB', type: 'government-office', lat: 12.8730, lng: 74.8440, requiredPersonnel: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-6', name: 'DC Bunglow', code: 'DCB', type: 'government-office', lat: 12.8700, lng: 74.8460, requiredPersonnel: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-7', name: 'FSL Guard Mangaluru', code: 'FSL', type: 'government-office', lat: 12.8900, lng: 74.8550, requiredPersonnel: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-8', name: 'Wireless Monitoring Station Guard', code: 'WMS', type: 'government-office', lat: 12.8850, lng: 74.8300, requiredPersonnel: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Hospital
  { id: 'gl-9', name: 'Wenlock Hospital Cell Guard', code: 'WHC', type: 'hospital', lat: 12.8670, lng: 74.8420, requiredPersonnel: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // NCC
  { id: 'gl-10', name: 'NCC Pandeshwara', code: 'NCC-P', type: 'ncc', lat: 12.8640, lng: 74.8370, requiredPersonnel: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-11', name: 'NCC Aravinda (Shivabhagh)', code: 'NCC-A', type: 'ncc', lat: 12.8950, lng: 74.8480, requiredPersonnel: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-12', name: 'NCC Yekkuru', code: 'NCC-Y', type: 'ncc', lat: 12.8550, lng: 74.8280, requiredPersonnel: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Bank currency chests
  { id: 'gl-13', name: 'Corporation/Union Bank Currency Chest Guard', code: 'CUB-CC', type: 'bank-currency-chest', lat: 12.8620, lng: 74.8380, requiredPersonnel: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-14', name: 'Syndicate/Canara Bank Currency Chest Guard', code: 'SCB-CC', type: 'bank-currency-chest', lat: 12.8580, lng: 74.8350, requiredPersonnel: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-15', name: 'Vijaya Bank/Bank of Baroda Currency Chest Guard', code: 'VBB-CC', type: 'bank-currency-chest', lat: 12.8730, lng: 74.8520, requiredPersonnel: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-16', name: 'Canara Bank Currency Chest Guard', code: 'CB-CC', type: 'bank-currency-chest', lat: 12.8660, lng: 74.8435, requiredPersonnel: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-17', name: 'Karnataka Bank Currency Chest Guard', code: 'KB-CC', type: 'bank-currency-chest', lat: 12.8680, lng: 74.8460, requiredPersonnel: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-18', name: 'Axis Bank Currency Chest Guard', code: 'AB-CC', type: 'bank-currency-chest', lat: 12.8750, lng: 74.8500, requiredPersonnel: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-19', name: 'ICICI Bank Currency Chest Guard', code: 'ICICI-CC', type: 'bank-currency-chest', lat: 12.8800, lng: 74.8450, requiredPersonnel: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // EVM/VVPAT
  { id: 'gl-20', name: 'VVPAT/EVM Guard (Old DC Office)', code: 'EVM-DC', type: 'government-office', lat: 12.8780, lng: 74.8380, requiredPersonnel: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'gl-21', name: 'VVPAT and EVM Guard Padil', code: 'EVM-PAD', type: 'government-office', lat: 12.8820, lng: 74.8340, requiredPersonnel: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // CAR Armoury
  { id: 'gl-22', name: 'CAR Armoury Guard', code: 'CAR-ARM', type: 'government-office', lat: 12.8720, lng: 74.8350, requiredPersonnel: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]

// Platoon-to-location assignments: maps each platoon to its assigned guard location IDs
// Based on PDF 2 guard duty roster — distributed across 22 locations (85 total personnel)
export const platoonLocationAssignments: Record<string, string[]> = {
  P1: ['gl-1', 'gl-2', 'gl-3', 'gl-4', 'gl-22'],             // COP, Treasury, DSJB, Hat Hill, CAR Armoury
  P2: ['gl-5', 'gl-6', 'gl-7', 'gl-8', 'gl-9'],              // PC Bunglow, DC Bunglow, FSL, Wireless, Wenlock
  P3: ['gl-10', 'gl-11', 'gl-12', 'gl-13', 'gl-14'],         // NCC x3, Corp/Union Bank, Syndicate/Canara Bank
  P4: ['gl-15', 'gl-16', 'gl-17', 'gl-18', 'gl-19'],         // Vijaya/BOB, Canara, Karnataka, Axis, ICICI
  P5: ['gl-20', 'gl-21'],                                      // EVM DC Office, EVM Padil
}


// =============================================================================
// 3.7 VIP Escort and Gunman Assignments Seed Data
// Requirements: 9.1, 9.2
// =============================================================================

export const vipEscortAssignments: VIPEscortAssignment[] = [
  {
    id: 've-1',
    vipName: 'H.H. Sri Vishvaprasannatirtha Swamiji',
    vipDesignation: 'Religious Leader - Pejawara Mutt',
    vipType: 'religious-leader',
    assignedPersonnelIds: ['ARSI-DINESH-GOWDA'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 've-2',
    vipName: 'Sri U.T. Khader Fareed',
    vipDesignation: "Hon'ble Speaker, Karnataka Legislative Assembly",
    vipType: 'government-official',
    assignedPersonnelIds: ['ARSI-SUDHEERKUMAR', 'APC-0182'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 've-3',
    vipName: 'Paramapoojya Srimajjagadguru Shankaracharya',
    vipDesignation: 'Religious Leader - Shankaracharya Mutt',
    vipType: 'religious-leader',
    assignedPersonnelIds: ['ARSI-ARUNKUMAR'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

export const gunmanAssignments: GunmanAssignment[] = [
  {
    id: 'gm-1',
    officialName: 'SRI DARSHAN H V, IAS',
    officialDesignation: 'Deputy Commissioner (DC)',
    assignedPersonnelIds: ['AHC-190'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gm-2',
    officialName: 'SRI BASAVARAJ',
    officialDesignation: 'District Session Judge',
    assignedPersonnelIds: ['ARSI-SHIVAKUMAR'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gm-3',
    officialName: 'COMPOL',
    officialDesignation: 'Commissioner of Police',
    assignedPersonnelIds: ['ARSI-IBRAHIM', 'AHC-178'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gm-4',
    officialName: 'DCP L&O',
    officialDesignation: 'DCP Law & Order',
    assignedPersonnelIds: ['ARSI-SURESH', 'ARSI-POORNESH'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gm-5',
    officialName: 'DCP CRIME & TRAFFIC',
    officialDesignation: 'DCP Crime & Traffic',
    assignedPersonnelIds: ['AHC-2633', 'APC-2826'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gm-6',
    officialName: 'DCP CAR',
    officialDesignation: 'DCP City Armed Reserve',
    assignedPersonnelIds: ['AHC-2724', 'APC-2640'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gm-7',
    officialName: 'SRI RAKESH MALLI',
    officialDesignation: 'Official',
    assignedPersonnelIds: ['APC-2525'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gm-8',
    officialName: 'SRI MITHUN RAI',
    officialDesignation: 'Official',
    assignedPersonnelIds: ['ARSI-MOHAN-BHANDARY'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gm-9',
    officialName: 'SRI U T KHADAR',
    officialDesignation: 'Official',
    assignedPersonnelIds: ['AHC-2815'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gm-10',
    officialName: 'SRI IVAN D\'SOUZA MLC',
    officialDesignation: 'Member of Legislative Council',
    assignedPersonnelIds: ['APC-0469'],
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]


// =============================================================================
// 3.8 Rotation Schedule Seed Data
// Requirements: 6.3, 6.4, 6.5
// 15-day rotation cycle starting Feb 2026
// Initial: P1→Guard-I, P2→Guard-II, P3→CheckPoint, P4→Prison/VIP, P5→StrikingForce
// =============================================================================

export const rotationCycle: RotationCycle = {
  id: 'rc-1',
  cycleDays: 15,
  startDate: '2026-02-16',
  endDate: '2026-04-30',
  rotationSequence: ['guard-i', 'guard-ii', 'check-point', 'prison-vip-escort', 'striking-force'],
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

// Initial platoon rotations — matches Section C Platoon Chart PDF
// Rotation order from PDF: each cycle the platoons shift duty assignments
export const platoonRotations: PlatoonRotation[] = [
  // Cycle 1: 16-02-2026 TO 28-02-2026
  { id: 'pr-1-1', platoonId: 'P1', dutyType: 'guard-i',          startDate: '2026-02-16', endDate: '2026-02-28', cycleNumber: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-1-2', platoonId: 'P2', dutyType: 'guard-ii',         startDate: '2026-02-16', endDate: '2026-02-28', cycleNumber: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-1-3', platoonId: 'P3', dutyType: 'check-point',      startDate: '2026-02-16', endDate: '2026-02-28', cycleNumber: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-1-4', platoonId: 'P4', dutyType: 'prison-vip-escort', startDate: '2026-02-16', endDate: '2026-02-28', cycleNumber: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-1-5', platoonId: 'P5', dutyType: 'striking-force',   startDate: '2026-02-16', endDate: '2026-02-28', cycleNumber: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Cycle 2: 01-03-2026 TO 15-03-2026
  { id: 'pr-2-1', platoonId: 'P3', dutyType: 'guard-i',          startDate: '2026-03-01', endDate: '2026-03-15', cycleNumber: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-2-2', platoonId: 'P4', dutyType: 'guard-ii',         startDate: '2026-03-01', endDate: '2026-03-15', cycleNumber: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-2-3', platoonId: 'P5', dutyType: 'check-point',      startDate: '2026-03-01', endDate: '2026-03-15', cycleNumber: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-2-4', platoonId: 'P1', dutyType: 'prison-vip-escort', startDate: '2026-03-01', endDate: '2026-03-15', cycleNumber: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-2-5', platoonId: 'P2', dutyType: 'striking-force',   startDate: '2026-03-01', endDate: '2026-03-15', cycleNumber: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Cycle 3: 16-03-2026 TO 31-03-2026 (current as of 17-03-2026)
  { id: 'pr-3-1', platoonId: 'P5', dutyType: 'guard-i',          startDate: '2026-03-16', endDate: '2026-03-31', cycleNumber: 3, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-3-2', platoonId: 'P1', dutyType: 'guard-ii',         startDate: '2026-03-16', endDate: '2026-03-31', cycleNumber: 3, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-3-3', platoonId: 'P2', dutyType: 'check-point',      startDate: '2026-03-16', endDate: '2026-03-31', cycleNumber: 3, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-3-4', platoonId: 'P3', dutyType: 'prison-vip-escort', startDate: '2026-03-16', endDate: '2026-03-31', cycleNumber: 3, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-3-5', platoonId: 'P4', dutyType: 'striking-force',   startDate: '2026-03-16', endDate: '2026-03-31', cycleNumber: 3, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Cycle 4: 01-04-2026 TO 15-04-2026
  { id: 'pr-4-1', platoonId: 'P4', dutyType: 'guard-i',          startDate: '2026-04-01', endDate: '2026-04-15', cycleNumber: 4, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-4-2', platoonId: 'P5', dutyType: 'guard-ii',         startDate: '2026-04-01', endDate: '2026-04-15', cycleNumber: 4, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-4-3', platoonId: 'P1', dutyType: 'check-point',      startDate: '2026-04-01', endDate: '2026-04-15', cycleNumber: 4, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-4-4', platoonId: 'P2', dutyType: 'prison-vip-escort', startDate: '2026-04-01', endDate: '2026-04-15', cycleNumber: 4, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-4-5', platoonId: 'P3', dutyType: 'striking-force',   startDate: '2026-04-01', endDate: '2026-04-15', cycleNumber: 4, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Cycle 5: 16-04-2026 TO 30-04-2026
  { id: 'pr-5-1', platoonId: 'P2', dutyType: 'guard-i',          startDate: '2026-04-16', endDate: '2026-04-30', cycleNumber: 5, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-5-2', platoonId: 'P3', dutyType: 'guard-ii',         startDate: '2026-04-16', endDate: '2026-04-30', cycleNumber: 5, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-5-3', platoonId: 'P4', dutyType: 'check-point',      startDate: '2026-04-16', endDate: '2026-04-30', cycleNumber: 5, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-5-4', platoonId: 'P5', dutyType: 'prison-vip-escort', startDate: '2026-04-16', endDate: '2026-04-30', cycleNumber: 5, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'pr-5-5', platoonId: 'P1', dutyType: 'striking-force',   startDate: '2026-04-16', endDate: '2026-04-30', cycleNumber: 5, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
]


// =============================================================================
// 3.9 Striking Force Teams Seed Data
// Requirements: 7.1, 7.2
// CC Room SF-I (9), SF-II (10), CAR Stand By I (10), II (10), III (11)
// =============================================================================

export const strikingForceTeams: StrikingForceConfig[] = [
  {
    id: 'sf-1',
    team: 'cc-room-sf-i',
    name: 'C C ROOM SF-I',
    requiredPersonnel: 9,
    currentPersonnelIds: platoon5Personnel.slice(0, 9).map(p => p.personnelId),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sf-2',
    team: 'cc-room-sf-ii',
    name: 'C C ROOM SF-II',
    requiredPersonnel: 10,
    currentPersonnelIds: platoon5Personnel.slice(9, 19).map(p => p.personnelId),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sf-3',
    team: 'car-stand-by-i',
    name: 'CAR STAND BY -I',
    requiredPersonnel: 10,
    currentPersonnelIds: platoon5Personnel.slice(19, 29).map(p => p.personnelId),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sf-4',
    team: 'car-stand-by-ii',
    name: 'CAR STAND BY -II',
    requiredPersonnel: 10,
    currentPersonnelIds: platoon5Personnel.slice(29, 39).map(p => p.personnelId),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sf-5',
    team: 'car-stand-by-iii',
    name: 'CAR STAND BY -III',
    requiredPersonnel: 11,
    currentPersonnelIds: platoon5Personnel.slice(39, 50).map(p => p.personnelId),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// =============================================================================
// Training Programs for PMT
// Requirements: 15.1
// =============================================================================

export const trainingPrograms: TrainingProgram[] = [
  {
    id: 'tp-1',
    name: 'BASIC TRAINING PTS MYSURU',
    location: 'PTS Mysuru',
    startDate: '2025-05-13',
    personnelIds: pmtPersonnel.slice(0, 20).map(p => p.personnelId),
    status: 'ongoing',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tp-2',
    name: 'BASIC TRAINING PTS DHARWAD',
    location: 'PTS Dharwad',
    startDate: '2025-06-22',
    personnelIds: pmtPersonnel.slice(20, 40).map(p => p.personnelId),
    status: 'ongoing',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tp-3',
    name: 'PDMS TRAINING',
    location: 'PDMS Centre',
    startDate: '2026-03-03',
    personnelIds: pmtPersonnel.slice(40, 60).map(p => p.personnelId),
    status: 'scheduled',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tp-4',
    name: 'CCT TRG KOODLU',
    location: 'CCT Koodlu',
    startDate: '2026-03-04',
    personnelIds: pmtPersonnel.slice(60, 80).map(p => p.personnelId),
    status: 'scheduled',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tp-5',
    name: '69-STATE LEVEL DUTY MEET TRAINING BENGALURU',
    location: 'Bengaluru',
    startDate: '2026-02-01',
    personnelIds: pmtPersonnel.slice(80, 111).map(p => p.personnelId),
    status: 'ongoing',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]


// =============================================================================
// Combine All Personnel
// =============================================================================

export const personnel: Personnel[] = [
  ...sectionAPersonnel,   // 74
  ...sectionBPersonnel,   // 67
  ...sectionCPersonnel,   // 277
  ...pmtPersonnel,        // 111
  ...recruitPersonnel,    // 24
]

// Update platoon personnelIds
platoons[0].personnelIds = platoon1Personnel.map(p => p.personnelId)
platoons[1].personnelIds = platoon2Personnel.map(p => p.personnelId)
platoons[2].personnelIds = platoon3Personnel.map(p => p.personnelId)
platoons[3].personnelIds = platoon4Personnel.map(p => p.personnelId)
platoons[4].personnelIds = platoon5Personnel.map(p => p.personnelId)

// =============================================================================
// Strength Summary
// Requirements: 21.1, 21.2
// =============================================================================

export const strengthSummary: StrengthSummary = {
  totalSanctioned: 559,
  totalPresent: 572,
  totalVacancy: 7,
  byRank: [
    { rank: 'DCP', sanctioned: 1, present: 1, vacancy: 0, extra: 0 },
    { rank: 'ACP', sanctioned: 1, present: 1, vacancy: 0, extra: 0 },
    { rank: 'RPI', sanctioned: 4, present: 3, vacancy: 1, extra: 0 },
    { rank: 'RSI', sanctioned: 14, present: 13, vacancy: 1, extra: 8 },
    { rank: 'ARSI', sanctioned: 50, present: 48, vacancy: 2, extra: 11 },
    { rank: 'AHC', sanctioned: 146, present: 143, vacancy: 3, extra: 0 },
    { rank: 'APC', sanctioned: 343, present: 363, vacancy: -20, extra: 0 },
  ],
  bySection: [
    { section: 'A', count: 74 },
    { section: 'B', count: 67 },
    { section: 'C', count: 277 },
    { section: 'PMT', count: 111 },
    { section: 'RECRUIT', count: 24 },
  ],
  updatedAt: '2026-02-15T00:00:00Z',
}

// =============================================================================
// Leave Balances for Karnataka Police
// =============================================================================

export const kpLeaveBalances: KPLeaveBalance[] = personnel.map(p => ({
  personnelId: p.personnelId,
  year: 2026,
  balances: [
    { type: 'CL', entitled: 12, used: Math.floor(Math.random() * 4), remaining: 0 },
    { type: 'CML', entitled: 10, used: Math.floor(Math.random() * 2), remaining: 0 },
    { type: 'EL', entitled: 30, used: Math.floor(Math.random() * 10), remaining: 0 },
    { type: 'PL', entitled: 15, used: Math.floor(Math.random() * 5), remaining: 0 },
  ],
}))

// Calculate remaining balances
kpLeaveBalances.forEach(lb => {
  lb.balances.forEach(b => {
    b.remaining = b.entitled - b.used
  })
})


// =============================================================================
// Legacy Data Structures (for compatibility with existing app)
// =============================================================================

// Generate employees from personnel for backward compatibility
export const employees: Employee[] = personnel.slice(0, 55).map((p, i) => ({
  id: `emp-${i + 1}`,
  employeeId: p.personnelId,
  name: p.name,
  email: `${p.name.toLowerCase().replace(/\s+/g, '.')}@ksp.gov.in`,
  phone: `+91 9${String(Math.floor(Math.random() * 900000000 + 100000000))}`,
  departmentId: p.section === 'A' ? 'dept-section-a' : p.section === 'B' ? 'dept-section-b' : 'dept-section-c',
  role: p.rank === 'DCP' || p.rank === 'ACP' ? 'admin' : p.rank === 'RPI' || p.rank === 'RSI' ? 'supervisor' : 'employee',
  skills: ['duty-roster', 'patrol', 'security'],
  status: p.status === 'active' ? 'active' : 'inactive',
  hireDate: p.hireDate,
  preferences: {
    preferredShifts: ['morning', 'afternoon'],
    unavailableDays: [],
    maxHoursPerWeek: 48,
    preferredLocations: ['loc-car-hq'],
  },
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
}))

// Shift Types for Karnataka Police
export const shiftTypes: ShiftType[] = [
  {
    id: 'shift-a',
    name: 'Shift A (05:00-13:00)',
    startTime: '05:00',
    endTime: '13:00',
    breakDuration: 30,
    colorCode: '#4CAF50',
    category: 'regular',
    description: 'Morning shift for check post duty',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'shift-b',
    name: 'Shift B (13:00-21:00)',
    startTime: '13:00',
    endTime: '21:00',
    breakDuration: 30,
    colorCode: '#2196F3',
    category: 'regular',
    description: 'Afternoon shift for check post duty',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'shift-c',
    name: 'Shift C (21:00-05:00)',
    startTime: '21:00',
    endTime: '05:00',
    breakDuration: 45,
    colorCode: '#9C27B0',
    category: 'regular',
    description: 'Night shift for check post duty',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'shift-guard',
    name: 'Guard Duty (24hr)',
    startTime: '00:00',
    endTime: '23:59',
    breakDuration: 60,
    colorCode: '#FF9800',
    category: 'regular',
    description: '24-hour guard duty rotation',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'shift-training',
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
]


// Shift Patterns for Karnataka Police
export const shiftPatterns: ShiftPattern[] = [
  {
    id: 'pattern-rotation',
    name: '15-Day Platoon Rotation',
    description: 'Standard 15-day rotation through 5 duty types',
    rotationCycle: 15,
    shiftTypeIds: ['shift-guard'],
    sequence: Array(15).fill('shift-guard'),
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pattern-checkpoint',
    name: 'Check Post 3-Shift',
    description: 'Three shift rotation for check post duty',
    rotationCycle: 3,
    shiftTypeIds: ['shift-a', 'shift-b', 'shift-c'],
    sequence: ['shift-a', 'shift-b', 'shift-c'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Rotation Rules
export const rotationRules: RotationRule[] = [
  {
    id: 'rule-1',
    name: '15-Day Platoon Rotation',
    type: 'round-robin',
    description: 'Platoons rotate through duty types every 15 days',
    minRestHours: 8,
    maxConsecutiveDays: 15,
    priority: 1,
    constraints: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'rule-2',
    name: 'Section-Based Assignment',
    type: 'skill-based',
    description: 'Assign duties based on section membership',
    minRestHours: 8,
    maxConsecutiveDays: 7,
    priority: 2,
    constraints: [],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// Generate shift assignments
const today = new Date()
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

export const shiftAssignments: ShiftAssignment[] = []
for (let day = 0; day < 30; day++) {
  const date = new Date(startOfMonth)
  date.setDate(date.getDate() + day)
  const dateStr = date.toISOString().split('T')[0]
  
  for (let i = 0; i < 10; i++) {
    const empIndex = (day + i) % employees.length
    shiftAssignments.push({
      id: `assign-${day}-${i}`,
      employeeId: employees[empIndex].id,
      shiftTypeId: shiftTypes[i % 3].id,
      date: dateStr,
      locationId: locations[0].id,
      status: day < 15 ? 'completed' : day < 20 ? 'confirmed' : 'scheduled',
      createdBy: 'user-1',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    })
  }
}

// Leave Requests — from Form 168 Leave Statement dated 17-03-2026
// 16 EL (Earned Leave), 16 CL (Casual Leave) = 32 total on leave
export const leaveRequests: LeaveRequest[] = [
  // EL (Earned Leave) entries
  { id: 'leave-1', employeeId: 'emp-1', leaveType: 'annual', startDate: '2026-02-16', endDate: '2026-03-17', reason: '30 days EL — APC-2642', status: 'approved', affectedShifts: [], createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-02-10T00:00:00Z' },
  { id: 'leave-2', employeeId: 'emp-2', leaveType: 'annual', startDate: '2026-03-04', endDate: '2026-03-18', reason: '15 days EL — AHC-2597', status: 'approved', affectedShifts: [], createdAt: '2026-02-28T00:00:00Z', updatedAt: '2026-02-28T00:00:00Z' },
  { id: 'leave-3', employeeId: 'emp-3', leaveType: 'annual', startDate: '2026-03-07', endDate: '2026-03-18', reason: '12 days EL — ARSI Sri Sudheer K', status: 'approved', affectedShifts: [], createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
  { id: 'leave-4', employeeId: 'emp-4', leaveType: 'annual', startDate: '2026-03-07', endDate: '2026-03-18', reason: '12 days EL — APC-0298', status: 'approved', affectedShifts: [], createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
  { id: 'leave-5', employeeId: 'emp-5', leaveType: 'annual', startDate: '2026-03-09', endDate: '2026-04-07', reason: '30 days EL — APC-2716', status: 'approved', affectedShifts: [], createdAt: '2026-03-03T00:00:00Z', updatedAt: '2026-03-03T00:00:00Z' },
  { id: 'leave-6', employeeId: 'emp-6', leaveType: 'annual', startDate: '2026-03-09', endDate: '2026-04-07', reason: '30 days EL — APC-0138', status: 'approved', affectedShifts: [], createdAt: '2026-03-03T00:00:00Z', updatedAt: '2026-03-03T00:00:00Z' },
  { id: 'leave-7', employeeId: 'emp-7', leaveType: 'annual', startDate: '2026-03-09', endDate: '2026-03-23', reason: '15 days PL — AHC-2652', status: 'approved', affectedShifts: [], createdAt: '2026-03-03T00:00:00Z', updatedAt: '2026-03-03T00:00:00Z' },
  { id: 'leave-8', employeeId: 'emp-8', leaveType: 'annual', startDate: '2026-03-10', endDate: '2026-03-24', reason: '15 days EL — APC-2689', status: 'approved', affectedShifts: [], createdAt: '2026-03-04T00:00:00Z', updatedAt: '2026-03-04T00:00:00Z' },
  { id: 'leave-9', employeeId: 'emp-9', leaveType: 'annual', startDate: '2026-03-10', endDate: '2026-04-08', reason: '30 days EL — APC-0236', status: 'approved', affectedShifts: [], createdAt: '2026-03-04T00:00:00Z', updatedAt: '2026-03-04T00:00:00Z' },
  { id: 'leave-10', employeeId: 'emp-10', leaveType: 'annual', startDate: '2026-03-10', endDate: '2026-03-27', reason: '18 days EL — APC-2738', status: 'approved', affectedShifts: [], createdAt: '2026-03-04T00:00:00Z', updatedAt: '2026-03-04T00:00:00Z' },
  { id: 'leave-11', employeeId: 'emp-11', leaveType: 'annual', startDate: '2026-03-11', endDate: '2026-03-25', reason: '15 days EL — APC-2814', status: 'approved', affectedShifts: [], createdAt: '2026-03-05T00:00:00Z', updatedAt: '2026-03-05T00:00:00Z' },
  { id: 'leave-12', employeeId: 'emp-12', leaveType: 'annual', startDate: '2026-03-12', endDate: '2026-03-26', reason: '15 days EL — APC-0170', status: 'approved', affectedShifts: [], createdAt: '2026-03-06T00:00:00Z', updatedAt: '2026-03-06T00:00:00Z' },
  { id: 'leave-13', employeeId: 'emp-13', leaveType: 'annual', startDate: '2026-03-12', endDate: '2026-03-18', reason: '07 days EL — APC-0377', status: 'approved', affectedShifts: [], createdAt: '2026-03-06T00:00:00Z', updatedAt: '2026-03-06T00:00:00Z' },
  { id: 'leave-14', employeeId: 'emp-14', leaveType: 'annual', startDate: '2026-03-13', endDate: '2026-03-24', reason: '12 days EL — APC-2654', status: 'approved', affectedShifts: [], createdAt: '2026-03-07T00:00:00Z', updatedAt: '2026-03-07T00:00:00Z' },
  { id: 'leave-15', employeeId: 'emp-15', leaveType: 'annual', startDate: '2026-03-16', endDate: '2026-03-27', reason: '12 days EL — APC-024', status: 'approved', affectedShifts: [], createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'leave-16', employeeId: 'emp-16', leaveType: 'annual', startDate: '2026-03-17', endDate: '2026-03-24', reason: '08 days EL — APC-0232', status: 'approved', affectedShifts: [], createdAt: '2026-03-11T00:00:00Z', updatedAt: '2026-03-11T00:00:00Z' },
  // CL (Casual Leave) entries
  { id: 'leave-17', employeeId: 'emp-17', leaveType: 'personal', startDate: '2026-03-12', endDate: '2026-03-17', reason: '06 days CL — APC-044', status: 'approved', affectedShifts: [], createdAt: '2026-03-06T00:00:00Z', updatedAt: '2026-03-06T00:00:00Z' },
  { id: 'leave-18', employeeId: 'emp-18', leaveType: 'personal', startDate: '2026-03-12', endDate: '2026-03-17', reason: '06 days CL — APC-2717', status: 'approved', affectedShifts: [], createdAt: '2026-03-06T00:00:00Z', updatedAt: '2026-03-06T00:00:00Z' },
  { id: 'leave-19', employeeId: 'emp-19', leaveType: 'personal', startDate: '2026-03-13', endDate: '2026-03-18', reason: '06 days CL — AHC-2718', status: 'approved', affectedShifts: [], createdAt: '2026-03-07T00:00:00Z', updatedAt: '2026-03-07T00:00:00Z' },
  { id: 'leave-20', employeeId: 'emp-20', leaveType: 'personal', startDate: '2026-03-14', endDate: '2026-03-19', reason: '06 days CL — APC-2641', status: 'approved', affectedShifts: [], createdAt: '2026-03-08T00:00:00Z', updatedAt: '2026-03-08T00:00:00Z' },
  { id: 'leave-21', employeeId: 'emp-21', leaveType: 'personal', startDate: '2026-03-14', endDate: '2026-03-17', reason: '04 days CL — APC-0121', status: 'approved', affectedShifts: [], createdAt: '2026-03-08T00:00:00Z', updatedAt: '2026-03-08T00:00:00Z' },
  { id: 'leave-22', employeeId: 'emp-22', leaveType: 'personal', startDate: '2026-03-15', endDate: '2026-03-19', reason: '05 days CL — AHC-2796', status: 'approved', affectedShifts: [], createdAt: '2026-03-09T00:00:00Z', updatedAt: '2026-03-09T00:00:00Z' },
  { id: 'leave-23', employeeId: 'emp-23', leaveType: 'personal', startDate: '2026-03-16', endDate: '2026-03-20', reason: '04 days CL — RPI Sri M D Jumanal (with permission days)', status: 'approved', affectedShifts: [], createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'leave-24', employeeId: 'emp-24', leaveType: 'personal', startDate: '2026-03-10', endDate: '2026-03-18', reason: '06 days CL — RSI Sri Mahantesh (with permission & RH)', status: 'approved', affectedShifts: [], createdAt: '2026-03-04T00:00:00Z', updatedAt: '2026-03-04T00:00:00Z' },
  { id: 'leave-25', employeeId: 'emp-25', leaveType: 'personal', startDate: '2026-03-16', endDate: '2026-03-17', reason: '02 days CL — AHC-2713', status: 'approved', affectedShifts: [], createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'leave-26', employeeId: 'emp-26', leaveType: 'personal', startDate: '2026-03-16', endDate: '2026-03-18', reason: '03 days CL — APC-0246', status: 'approved', affectedShifts: [], createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'leave-27', employeeId: 'emp-27', leaveType: 'personal', startDate: '2026-03-16', endDate: '2026-03-17', reason: '02 days CL — APC-0295', status: 'approved', affectedShifts: [], createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'leave-28', employeeId: 'emp-28', leaveType: 'personal', startDate: '2026-03-16', endDate: '2026-03-18', reason: '03 days CL — APC-0229', status: 'approved', affectedShifts: [], createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'leave-29', employeeId: 'emp-29', leaveType: 'personal', startDate: '2026-03-16', endDate: '2026-03-17', reason: '02 days CL — APC-2668', status: 'approved', affectedShifts: [], createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'leave-30', employeeId: 'emp-30', leaveType: 'personal', startDate: '2026-03-13', endDate: '2026-03-18', reason: '06 days CL — APC-0262', status: 'approved', affectedShifts: [], createdAt: '2026-03-07T00:00:00Z', updatedAt: '2026-03-07T00:00:00Z' },
  { id: 'leave-31', employeeId: 'emp-31', leaveType: 'personal', startDate: '2026-03-17', endDate: '2026-03-18', reason: '02 days CL — APC-2701', status: 'approved', affectedShifts: [], createdAt: '2026-03-11T00:00:00Z', updatedAt: '2026-03-11T00:00:00Z' },
  { id: 'leave-32', employeeId: 'emp-32', leaveType: 'personal', startDate: '2026-03-17', endDate: '2026-03-17', reason: '01 day CL — APC-0247', status: 'approved', affectedShifts: [], createdAt: '2026-03-11T00:00:00Z', updatedAt: '2026-03-11T00:00:00Z' },
  // Sick leave
  { id: 'leave-33', employeeId: 'emp-33', leaveType: 'sick', startDate: '2026-03-17', endDate: '2026-03-17', reason: 'Sick — APC-0104 Mallanna', status: 'approved', affectedShifts: [], createdAt: '2026-03-17T00:00:00Z', updatedAt: '2026-03-17T00:00:00Z' },
  // Pending new requests
  { id: 'leave-34', employeeId: 'emp-34', leaveType: 'annual', startDate: '2026-03-25', endDate: '2026-04-05', reason: 'Family function', status: 'pending', affectedShifts: [], createdAt: '2026-03-20T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
  { id: 'leave-35', employeeId: 'emp-35', leaveType: 'personal', startDate: '2026-03-28', endDate: '2026-03-30', reason: 'Personal work', status: 'pending', affectedShifts: [], createdAt: '2026-03-22T00:00:00Z', updatedAt: '2026-03-22T00:00:00Z' },
  { id: 'leave-36', employeeId: 'emp-36', leaveType: 'annual', startDate: '2026-04-01', endDate: '2026-04-10', reason: 'Annual leave', status: 'pending', affectedShifts: [], createdAt: '2026-03-23T00:00:00Z', updatedAt: '2026-03-23T00:00:00Z' },
]

// Swap Requests
export const swapRequests: SwapRequest[] = []

// Notifications
export const notifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'system-alert',
    category: 'informational',
    title: 'Rotation Cycle Starting',
    message: 'New 15-day rotation cycle begins on Feb 16, 2026',
    link: '/schedule',
    isRead: false,
    createdAt: '2026-02-15T08:00:00Z',
  },
]

// Audit Entries
export const auditEntries: AuditEntry[] = [
  {
    id: 'audit-1',
    userId: 'user-1',
    userName: 'SRI UMESH P',
    action: 'login',
    entityType: 'user',
    entityId: 'user-1',
    entityName: 'SRI UMESH P',
    timestamp: '2026-02-15T09:30:00Z',
  },
]

// Leave Balances (legacy format)
export const leaveBalances: Record<string, { type: string; total: number; used: number; remaining: number }[]> = {}
employees.forEach(emp => {
  leaveBalances[emp.id] = [
    { type: 'annual', total: 30, used: Math.floor(Math.random() * 10), remaining: 0 },
    { type: 'sick', total: 10, used: Math.floor(Math.random() * 3), remaining: 0 },
    { type: 'personal', total: 5, used: Math.floor(Math.random() * 2), remaining: 0 },
  ]
  leaveBalances[emp.id].forEach(b => { b.remaining = b.total - b.used })
})


// =============================================================================
// Export All Seed Data
// =============================================================================

export const seedData = {
  // Authentication
  users,
  
  // Organization
  departments,
  locations,
  
  // Karnataka Police specific
  personnel,
  sections,
  platoons,
  guardLocations,
  platoonLocationAssignments,
  vipEscortAssignments,
  gunmanAssignments,
  rotationCycle,
  platoonRotations,
  strikingForceTeams,
  trainingPrograms,
  recruitAPCs,
  strengthSummary,
  kpLeaveBalances,
  
  // Legacy compatibility
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
