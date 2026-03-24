import { dataStore } from './dataStore'
import type {
  PlatoonId,
  RotationalDutyType,
  RotationScheduleEntry,
  PlatoonRotation,
} from '@/types'

// Rotation sequence: Guard-I → Guard-II → Check Point → Prison/VIP → Striking Force → Guard-I
const ROTATION_SEQUENCE: RotationalDutyType[] = [
  'guard-i',
  'guard-ii',
  'check-point',
  'prison-vip-escort',
  'striking-force',
]

const PLATOON_IDS: PlatoonId[] = ['P1', 'P2', 'P3', 'P4', 'P5']
const CYCLE_DAYS = 15

// Initial assignments (Cycle 1 starting Feb 1, 2026)
const INITIAL_ASSIGNMENTS: Record<PlatoonId, RotationalDutyType> = {
  P1: 'guard-i',
  P2: 'guard-ii',
  P3: 'check-point',
  P4: 'prison-vip-escort',
  P5: 'striking-force',
}

const BASE_DATE = new Date('2026-02-01')

class RotationService {
  /**
   * Calculate the cycle number for a given date
   */
  getCycleNumber(date: Date): number {
    const diffTime = date.getTime() - BASE_DATE.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return Math.floor(diffDays / CYCLE_DAYS) + 1
  }

  /**
   * Get the next rotation date from a given date
   */
  getNextRotationDate(currentDate: Date): Date {
    const cycleNumber = this.getCycleNumber(currentDate)
    const nextCycleStart = new Date(BASE_DATE)
    nextCycleStart.setDate(BASE_DATE.getDate() + cycleNumber * CYCLE_DAYS)
    return nextCycleStart
  }

  /**
   * Calculate the duty type for a platoon based on cycle number
   */
  getDutyTypeForPlatoon(platoonId: PlatoonId, cycleNumber: number): RotationalDutyType {
    const initialIndex = ROTATION_SEQUENCE.indexOf(INITIAL_ASSIGNMENTS[platoonId])
    // Each cycle, platoons move backward in the sequence (P1 goes from guard-i to striking-force)
    const rotationOffset = (cycleNumber - 1) % 5
    const newIndex = (initialIndex - rotationOffset + 5) % 5
    return ROTATION_SEQUENCE[newIndex]
  }

  /**
   * Get current rotation assignments for all platoons
   */
  getCurrentRotation(date: Date = new Date()): Map<PlatoonId, RotationalDutyType> {
    const cycleNumber = this.getCycleNumber(date)
    const assignments = new Map<PlatoonId, RotationalDutyType>()
    
    for (const platoonId of PLATOON_IDS) {
      assignments.set(platoonId, this.getDutyTypeForPlatoon(platoonId, cycleNumber))
    }
    
    return assignments
  }

  /**
   * Get rotation schedule for a date range
   */
  getRotationSchedule(startDate: Date, endDate: Date): RotationScheduleEntry[] {
    const schedule: RotationScheduleEntry[] = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const assignments = this.getCurrentRotation(current)
      const platoonAssignments: { platoonId: PlatoonId; dutyType: RotationalDutyType }[] = []
      
      assignments.forEach((dutyType, platoonId) => {
        platoonAssignments.push({ platoonId, dutyType })
      })
      
      schedule.push({
        date: current.toISOString().split('T')[0],
        platoonAssignments,
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    return schedule
  }

  /**
   * Validate that a rotation assignment is correct
   */
  validateRotation(platoonId: PlatoonId, dutyType: RotationalDutyType, date: Date): boolean {
    const expectedDuty = this.getDutyTypeForPlatoon(platoonId, this.getCycleNumber(date))
    return expectedDuty === dutyType
  }

  /**
   * Check if all platoons have unique duty types on a given date
   */
  validateUniqueDutyTypes(date: Date): boolean {
    const assignments = this.getCurrentRotation(date)
    const dutyTypes = new Set(assignments.values())
    return dutyTypes.size === PLATOON_IDS.length
  }

  /**
   * Get platoon rotations from stored data for a date range
   */
  getStoredRotations(startDate: string, endDate: string): PlatoonRotation[] {
    return dataStore.getPlatoonRotationsByDateRange(startDate, endDate)
  }

  /**
   * Get the duty type display name
   */
  getDutyTypeDisplayName(dutyType: RotationalDutyType): string {
    const names: Record<RotationalDutyType, string> = {
      'guard-i': 'Guard-I',
      'guard-ii': 'Guard-II',
      'check-point': 'Check Point',
      'prison-vip-escort': 'Prison/VIP Escort',
      'striking-force': 'Striking Force',
    }
    return names[dutyType]
  }

  /**
   * Get color code for duty type
   */
  getDutyTypeColor(dutyType: RotationalDutyType): string {
    const colors: Record<RotationalDutyType, string> = {
      'guard-i': '#4CAF50',      // Green
      'guard-ii': '#2196F3',     // Blue
      'check-point': '#FF9800',  // Orange
      'prison-vip-escort': '#9C27B0', // Purple
      'striking-force': '#F44336', // Red
    }
    return colors[dutyType]
  }

  /**
   * Get cycle date range
   */
  getCycleDateRange(cycleNumber: number): { startDate: string; endDate: string } {
    const startDate = new Date(BASE_DATE)
    startDate.setDate(BASE_DATE.getDate() + (cycleNumber - 1) * CYCLE_DAYS)
    
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + CYCLE_DAYS - 1)
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }
  }
}

export const rotationService = new RotationService()
export default rotationService
