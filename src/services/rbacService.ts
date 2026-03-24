// Role-Based Access Control Service for Karnataka State Police WorkBoard
import type { PoliceRank, UserRole, User } from '@/types'

// Rank hierarchy - higher index = higher rank
const RANK_HIERARCHY: PoliceRank[] = ['APC', 'AHC', 'ARSI', 'RSI', 'RPI', 'ACP', 'DCP']

export interface UserPermissions {
  canAddPersonnel: boolean
  canEditSubordinates: boolean
  canCreateAssignments: boolean
  canCreateAdhocRequests: boolean
  canApproveLeave: boolean
  editableRanks: PoliceRank[]
  userRank: PoliceRank | null
}

class RBACService {
  /**
   * Get the rank level (0-6, higher = more senior)
   */
  getRankLevel(rank: PoliceRank): number {
    return RANK_HIERARCHY.indexOf(rank)
  }

  /**
   * Check if a user with rank R1 can edit personnel with rank R2
   * Returns true only if R1 is strictly higher than R2
   */
  canEditPersonnel(userRank: PoliceRank | null, targetRank: PoliceRank): boolean {
    if (!userRank) return false
    return this.getRankLevel(userRank) > this.getRankLevel(targetRank)
  }

  /**
   * Check if user can add new personnel (admin only)
   */
  canAddPersonnel(userRole: UserRole): boolean {
    return userRole === 'admin'
  }

  /**
   * Check if user can create schedule assignments (admin or supervisor)
   */
  canCreateAssignment(userRole: UserRole): boolean {
    return userRole === 'admin' || userRole === 'supervisor'
  }

  /**
   * Check if user can create adhoc requests (admin or supervisor)
   */
  canCreateAdhocRequest(userRole: UserRole): boolean {
    return userRole === 'admin' || userRole === 'supervisor'
  }

  /**
   * Check if user can approve leave requests (admin or supervisor)
   */
  canApproveLeave(userRole: UserRole): boolean {
    return userRole === 'admin' || userRole === 'supervisor'
  }

  /**
   * Get all ranks that a user can edit based on their rank
   */
  getEditableRanks(userRank: PoliceRank | null): PoliceRank[] {
    if (!userRank) return []
    const userLevel = this.getRankLevel(userRank)
    return RANK_HIERARCHY.filter((_, index) => index < userLevel)
  }

  /**
   * Map user role to approximate rank for permission checks
   */
  getRankFromRole(role: UserRole): PoliceRank | null {
    switch (role) {
      case 'admin':
        return 'DCP'
      case 'supervisor':
        return 'ACP'
      case 'employee':
        return 'RPI'
      default:
        return null
    }
  }

  /**
   * Get comprehensive permissions for a user
   */
  getPermissions(user: User | null, userRank?: PoliceRank | null): UserPermissions {
    if (!user) {
      return {
        canAddPersonnel: false,
        canEditSubordinates: false,
        canCreateAssignments: false,
        canCreateAdhocRequests: false,
        canApproveLeave: false,
        editableRanks: [],
        userRank: null,
      }
    }

    const rank = userRank || this.getRankFromRole(user.role)
    
    return {
      canAddPersonnel: this.canAddPersonnel(user.role),
      canEditSubordinates: user.role === 'admin' || user.role === 'supervisor',
      canCreateAssignments: this.canCreateAssignment(user.role),
      canCreateAdhocRequests: this.canCreateAdhocRequest(user.role),
      canApproveLeave: this.canApproveLeave(user.role),
      editableRanks: this.getEditableRanks(rank),
      userRank: rank,
    }
  }

  /**
   * Check if user can perform any edit action on a specific personnel
   */
  canEditSpecificPersonnel(user: User | null, targetRank: PoliceRank, userRank?: PoliceRank | null): boolean {
    if (!user) return false
    if (user.role === 'admin') return true // Admin can edit anyone
    
    const rank = userRank || this.getRankFromRole(user.role)
    return this.canEditPersonnel(rank, targetRank)
  }
}

export const rbacService = new RBACService()
export default rbacService
