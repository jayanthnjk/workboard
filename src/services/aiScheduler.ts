import { dataStore } from './dataStore'
import type { Employee, ShiftType, RotationRule, ShiftAssignment, ScheduleProposal, ScheduleConflict } from '@/types'

interface ScheduleRequest {
  startDate: string
  endDate: string
  departmentIds?: string[]
  locationIds?: string[]
}

class AIScheduler {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  async generateSchedule(request: ScheduleRequest): Promise<ScheduleProposal> {
    console.log('[AI Scheduler] Generating schedule...', request)
    
    // Simulate AI processing time (max 10 seconds for 100 employees as per requirements)
    const employees = dataStore.getEmployees().filter(e => e.status === 'active')
    const processingTime = Math.min(employees.length * 50, 5000)
    await this.delay(processingTime)

    const shiftTypes = dataStore.getShiftTypes().filter(s => s.isActive)
    const rotationRules = dataStore.getRotationRules().filter(r => r.isActive)
    const locations = dataStore.getLocations().filter(l => l.isActive)

    const assignments: ShiftAssignment[] = []
    const conflicts: ScheduleConflict[] = []
    const employeeShiftCounts: Record<string, number> = {}

    // Generate dates in range
    const dates = this.getDateRange(request.startDate, request.endDate)

    // For each date, assign shifts
    for (const date of dates) {
      for (const location of locations) {
        if (request.locationIds && !request.locationIds.includes(location.id)) continue

        // Assign shifts for each shift type
        for (const shiftType of shiftTypes.filter(s => s.category === 'regular')) {
          // Find available employees
          const availableEmployees = this.findAvailableEmployees(
            employees,
            date,
            shiftType,
            rotationRules,
            assignments,
            employeeShiftCounts
          )

          if (availableEmployees.length === 0) {
            conflicts.push({
              type: 'availability',
              employeeId: '',
              date,
              description: `No available employees for ${shiftType.name} at ${location.name}`,
              suggestedResolution: 'Consider overtime or on-call staff',
            })
            continue
          }

          // Select best employee based on fairness
          const selectedEmployee = this.selectEmployee(availableEmployees, employeeShiftCounts)
          
          assignments.push({
            id: `proposed-${date}-${shiftType.id}-${location.id}`,
            employeeId: selectedEmployee.id,
            shiftTypeId: shiftType.id,
            date,
            locationId: location.id,
            status: 'scheduled',
            createdBy: 'ai-scheduler',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })

          employeeShiftCounts[selectedEmployee.id] = (employeeShiftCounts[selectedEmployee.id] || 0) + 1
        }
      }
    }

    // Check for conflicts
    const detectedConflicts = this.detectConflicts(assignments, rotationRules, employees)
    conflicts.push(...detectedConflicts)

    // Calculate fairness score
    const fairnessScore = this.calculateFairnessScore(employeeShiftCounts, employees.length)

    return {
      id: `proposal-${Date.now()}`,
      startDate: request.startDate,
      endDate: request.endDate,
      assignments,
      fairnessScore,
      conflicts,
      status: 'draft',
      createdBy: 'ai-scheduler',
      createdAt: new Date().toISOString(),
    }
  }

  private getDateRange(start: string, end: string): string[] {
    const dates: string[] = []
    const current = new Date(start)
    const endDate = new Date(end)

    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  private findAvailableEmployees(
    employees: Employee[],
    date: string,
    _shiftType: ShiftType,
    rules: RotationRule[],
    existingAssignments: ShiftAssignment[],
    shiftCounts: Record<string, number>
  ): Employee[] {
    const dayOfWeek = new Date(date).getDay()

    return employees.filter(emp => {
      // Check if already assigned on this date
      const hasAssignment = existingAssignments.some(
        a => a.employeeId === emp.id && a.date === date
      )
      if (hasAssignment) return false

      // Check availability preferences
      if (emp.preferences.unavailableDays.includes(dayOfWeek)) return false

      // Check max hours per week (simplified)
      const weeklyShifts = shiftCounts[emp.id] || 0
      if (weeklyShifts >= 5) return false

      // Check consecutive days rule
      const maxConsecutive = Math.min(...rules.map(r => r.maxConsecutiveDays))
      const consecutiveDays = this.getConsecutiveDays(emp.id, date, existingAssignments)
      if (consecutiveDays >= maxConsecutive) return false

      return true
    })
  }

  private getConsecutiveDays(employeeId: string, date: string, assignments: ShiftAssignment[]): number {
    let count = 0
    const checkDate = new Date(date)
    
    for (let i = 1; i <= 7; i++) {
      checkDate.setDate(checkDate.getDate() - 1)
      const dateStr = checkDate.toISOString().split('T')[0]
      const hasShift = assignments.some(a => a.employeeId === employeeId && a.date === dateStr)
      if (hasShift) count++
      else break
    }

    return count
  }

  private selectEmployee(employees: Employee[], shiftCounts: Record<string, number>): Employee {
    // Select employee with fewest shifts (fairness)
    return employees.sort((a, b) => {
      const countA = shiftCounts[a.id] || 0
      const countB = shiftCounts[b.id] || 0
      return countA - countB
    })[0]
  }

  private detectConflicts(
    assignments: ShiftAssignment[],
    rules: RotationRule[],
    _employees: Employee[]
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = []
    // minRestHours could be used for more sophisticated rest period checking
    void Math.max(...rules.map(r => r.minRestHours))

    // Group assignments by employee
    const byEmployee: Record<string, ShiftAssignment[]> = {}
    for (const a of assignments) {
      if (!byEmployee[a.employeeId]) byEmployee[a.employeeId] = []
      byEmployee[a.employeeId].push(a)
    }

    // Check each employee's assignments
    for (const [empId, empAssignments] of Object.entries(byEmployee)) {
      const sorted = empAssignments.sort((a, b) => a.date.localeCompare(b.date))
      
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        
        // Check rest period between consecutive days
        const prevDate = new Date(prev.date)
        const currDate = new Date(curr.date)
        const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysDiff === 1) {
          // Consecutive days - check shift transition
          const prevShift = dataStore.getShiftTypeById(prev.shiftTypeId)
          const currShift = dataStore.getShiftTypeById(curr.shiftTypeId)
          
          if (prevShift && currShift) {
            // Night to morning transition check
            if (prevShift.name.includes('Night') && currShift.name.includes('Morning')) {
              conflicts.push({
                type: 'rest-violation',
                employeeId: empId,
                date: curr.date,
                description: `Insufficient rest: Night shift followed by Morning shift`,
                suggestedResolution: 'Swap with another employee or change shift type',
              })
            }
          }
        }
      }
    }

    return conflicts
  }

  private calculateFairnessScore(shiftCounts: Record<string, number>, _totalEmployees: number): number {
    const counts = Object.values(shiftCounts)
    if (counts.length === 0) return 100

    const avg = counts.reduce((a, b) => a + b, 0) / counts.length
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length
    const stdDev = Math.sqrt(variance)

    // Score based on standard deviation (lower is better)
    const maxStdDev = avg * 0.5 // 50% of average is considered max acceptable
    const score = Math.max(0, 100 - (stdDev / maxStdDev) * 100)

    return Math.round(score)
  }

  async approveSchedule(proposalId: string): Promise<void> {
    console.log('[AI Scheduler] Approving schedule:', proposalId)
    await this.delay(500)
    // In real implementation, this would save assignments to dataStore
  }
}

export const aiScheduler = new AIScheduler()
export default aiScheduler
