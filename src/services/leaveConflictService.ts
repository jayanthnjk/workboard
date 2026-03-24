import { dataStore } from './dataStore'
import { rotationService } from './rotationService'
import type {
  Personnel,
  KPLeaveRequest,
  KPLeaveType,
} from '@/types'

interface DutyConflict {
  date: string
  dutyType: string
  description: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

class LeaveConflictService {
  /**
   * Check for duty conflicts during leave period
   */
  checkDutyConflicts(personnelId: string, startDate: string, endDate: string): DutyConflict[] {
    const conflicts: DutyConflict[] = []
    const personnel = dataStore.getPersonnelByPersonnelId(personnelId)
    
    if (!personnel) return conflicts
    
    // Check if personnel is in Section C (rotational duties)
    if (personnel.section === 'C' && personnel.platoon) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const current = new Date(start)
      
      while (current <= end) {
        const rotation = rotationService.getCurrentRotation(current)
        const dutyType = rotation.get(personnel.platoon)
        
        if (dutyType) {
          conflicts.push({
            date: current.toISOString().split('T')[0],
            dutyType: rotationService.getDutyTypeDisplayName(dutyType),
            description: `Assigned to ${rotationService.getDutyTypeDisplayName(dutyType)} duty`,
          })
        }
        
        current.setDate(current.getDate() + 1)
      }
    }
    
    // Check VIP escort assignments
    const vipEscorts = dataStore.getActiveVIPEscorts()
    for (const escort of vipEscorts) {
      if (escort.assignedPersonnelIds.includes(personnelId)) {
        conflicts.push({
          date: startDate,
          dutyType: 'VIP Escort',
          description: `Assigned as VIP escort for ${escort.vipName}`,
        })
      }
    }
    
    // Check gunman assignments
    const gunmanAssignments = dataStore.getActiveGunmanAssignments()
    for (const assignment of gunmanAssignments) {
      if (assignment.assignedPersonnelIds.includes(personnelId)) {
        conflicts.push({
          date: startDate,
          dutyType: 'Gunman',
          description: `Assigned as gunman for ${assignment.officialName}`,
        })
      }
    }
    
    return conflicts
  }

  /**
   * Find replacement candidates from same section/platoon
   */
  findReplacements(personnelId: string, date: string): Personnel[] {
    const personnel = dataStore.getPersonnelByPersonnelId(personnelId)
    if (!personnel) return []
    
    let candidates: Personnel[]
    
    // For Section C, find replacements from same platoon
    if (personnel.section === 'C' && personnel.platoon) {
      candidates = dataStore.getPersonnelByPlatoon(personnel.platoon)
    } else {
      // For other sections, find from same section and duty category
      candidates = dataStore.getPersonnelBySection(personnel.section)
      if (personnel.dutyCategory) {
        candidates = candidates.filter(p => p.dutyCategory === personnel.dutyCategory)
      }
    }
    
    // Filter out the requesting personnel and inactive personnel
    candidates = candidates.filter(p => 
      p.personnelId !== personnelId &&
      p.status === 'active'
    )
    
    // Check if candidates have leave on the same date
    const leaveRequests = dataStore.getKPLeaveRequests()
    candidates = candidates.filter(p => {
      const hasLeave = leaveRequests.some(r => 
        r.personnelId === p.personnelId &&
        r.status === 'approved' &&
        r.startDate <= date &&
        r.endDate >= date
      )
      return !hasLeave
    })
    
    return candidates
  }

  /**
   * Validate leave request
   */
  validateLeaveRequest(request: Omit<KPLeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): ValidationResult {
    const errors: string[] = []
    
    // Check if personnel exists
    const personnel = dataStore.getPersonnelByPersonnelId(request.personnelId)
    if (!personnel) {
      errors.push('Personnel not found')
      return { valid: false, errors }
    }
    
    // Check if personnel is active
    if (personnel.status !== 'active') {
      errors.push(`Personnel is currently ${personnel.status}`)
    }
    
    // Check date validity
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    
    if (startDate > endDate) {
      errors.push('Start date must be before or equal to end date')
    }
    
    // Check leave balance
    const hasBalance = this.checkLeaveBalance(request.personnelId, request.leaveType, request.totalDays)
    if (!hasBalance) {
      errors.push(`Insufficient ${request.leaveType} balance`)
    }
    
    // Check for overlapping leave requests
    const existingRequests = dataStore.getKPLeaveRequestsByPersonnel(request.personnelId)
    const hasOverlap = existingRequests.some(r => 
      r.status !== 'rejected' &&
      r.status !== 'cancelled' &&
      r.startDate <= request.endDate &&
      r.endDate >= request.startDate
    )
    
    if (hasOverlap) {
      errors.push('Leave request overlaps with existing request')
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Check if personnel has sufficient leave balance
   */
  checkLeaveBalance(personnelId: string, leaveType: KPLeaveType, days: number): boolean {
    const balance = dataStore.getKPLeaveBalance(personnelId)
    if (!balance) return false
    
    const typeBalance = balance.balances.find(b => b.type === leaveType)
    if (!typeBalance) return false
    
    return typeBalance.remaining >= days
  }

  /**
   * Get leave balance summary for personnel
   */
  getLeaveBalanceSummary(personnelId: string): { type: KPLeaveType; entitled: number; used: number; remaining: number }[] {
    const balance = dataStore.getKPLeaveBalance(personnelId)
    if (!balance) return []
    
    return balance.balances.map(b => ({
      type: b.type,
      entitled: b.entitled,
      used: b.used,
      remaining: b.remaining,
    }))
  }

  /**
   * Get leave type display name
   */
  getLeaveTypeDisplayName(leaveType: KPLeaveType): string {
    const names: Record<KPLeaveType, string> = {
      CL: 'Casual Leave',
      CML: 'Casual Medical Leave',
      EL: 'Earned Leave',
      PL: 'Privilege Leave',
    }
    return names[leaveType]
  }
}

export const leaveConflictService = new LeaveConflictService()
export default leaveConflictService
