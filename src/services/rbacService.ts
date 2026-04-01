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
  canViewAllPersonnel: boolean
  canViewReports: boolean
  canManageConfiguration: boolean
  editableRanks: PoliceRank[]
  viewableRanks: PoliceRank[]
  userRank: PoliceRank | null
}

class RBACService {
  getRankLevel(rank: PoliceRank): number {
    return RANK_HIERARCHY.indexOf(rank)
  }

  /** Check if rank1 is senior to rank2 */
  isSeniorTo(rank1: PoliceRank | null, rank2: PoliceRank): boolean {
    if (!rank1) return false
    return this.getRankLevel(rank1) > this.getRankLevel(rank2)
  }

  /** Check if rank1 is same or senior to rank2 */
  isSameOrSeniorTo(rank1: PoliceRank | null, rank2: PoliceRank): boolean {
    if (!rank1) return false
    return this.getRankLevel(rank1) >= this.getRankLevel(rank2)
  }

  canEditPersonnel(userRank: PoliceRank | null, targetRank: PoliceRank): boolean {
    if (!userRank) return false
    return this.getRankLevel(userRank) > this.getRankLevel(targetRank)
  }

  canAddPersonnel(userRole: UserRole): boolean {
    return userRole === 'admin'
  }

  canCreateAssignment(userRole: UserRole): boolean {
    return userRole === 'admin' || userRole === 'supervisor'
  }

  canCreateAdhocRequest(userRole: UserRole): boolean {
    return userRole === 'admin' || userRole === 'supervisor'
  }

  /**
   * Leave approval hierarchy:
   * - DCP/ACP (admin/supervisor) can approve anyone below them
   * - RPI can approve RSI and below
   * - RSI can approve ARSI and below
   * - ARSI and below cannot approve
   */
  canApproveLeave(userRole: UserRole, userRank?: PoliceRank | null): boolean {
    if (userRole === 'admin') return true
    if (userRole === 'supervisor') return true
    // RPI and RSI can approve subordinates
    if (userRank && this.getRankLevel(userRank) >= this.getRankLevel('RSI')) return true
    return false
  }

  /** Check if user can approve a specific person's leave */
  canApproveLeaveFor(userRank: PoliceRank | null, targetRank: PoliceRank): boolean {
    if (!userRank) return false
    // Must be strictly senior to approve
    return this.getRankLevel(userRank) > this.getRankLevel(targetRank)
  }

  /**
   * Data visibility by rank:
   * - DCP: sees everyone
   * - ACP: sees RPI and below
   * - RPI: sees RSI and below
   * - RSI: sees ARSI and below
   * - ARSI: sees AHC and APC
   * - AHC: sees only APC and own data
   * - APC: sees only own data
   */
  getViewableRanks(userRank: PoliceRank | null): PoliceRank[] {
    if (!userRank) return []
    const userLevel = this.getRankLevel(userRank)
    // Can view own rank and all below
    return RANK_HIERARCHY.filter((_, index) => index <= userLevel)
  }

  getEditableRanks(userRank: PoliceRank | null): PoliceRank[] {
    if (!userRank) return []
    const userLevel = this.getRankLevel(userRank)
    return RANK_HIERARCHY.filter((_, index) => index < userLevel)
  }

  getRankFromRole(role: UserRole): PoliceRank | null {
    switch (role) {
      case 'admin': return 'DCP'
      case 'supervisor': return 'ACP'
      case 'employee': return 'AHC' // Default employee is constable level
      default: return null
    }
  }

  /** Can user view reports (RSI and above) */
  canViewReports(userRank: PoliceRank | null): boolean {
    if (!userRank) return false
    return this.getRankLevel(userRank) >= this.getRankLevel('RSI')
  }

  /** Can user manage configuration (RPI and above) */
  canManageConfiguration(userRank: PoliceRank | null): boolean {
    if (!userRank) return false
    return this.getRankLevel(userRank) >= this.getRankLevel('RPI')
  }

  getPermissions(user: User | null, userRank?: PoliceRank | null): UserPermissions {
    if (!user) {
      return {
        canAddPersonnel: false,
        canEditSubordinates: false,
        canCreateAssignments: false,
        canCreateAdhocRequests: false,
        canApproveLeave: false,
        canViewAllPersonnel: false,
        canViewReports: false,
        canManageConfiguration: false,
        editableRanks: [],
        viewableRanks: [],
        userRank: null,
      }
    }

    const rank = userRank || this.getRankFromRole(user.role)

    return {
      canAddPersonnel: this.canAddPersonnel(user.role),
      canEditSubordinates: user.role === 'admin' || user.role === 'supervisor',
      canCreateAssignments: this.canCreateAssignment(user.role),
      canCreateAdhocRequests: this.canCreateAdhocRequest(user.role),
      canApproveLeave: this.canApproveLeave(user.role, rank),
      canViewAllPersonnel: user.role === 'admin' || user.role === 'supervisor',
      canViewReports: this.canViewReports(rank),
      canManageConfiguration: this.canManageConfiguration(rank),
      editableRanks: this.getEditableRanks(rank),
      viewableRanks: this.getViewableRanks(rank),
      userRank: rank,
    }
  }

  canEditSpecificPersonnel(user: User | null, targetRank: PoliceRank, userRank?: PoliceRank | null): boolean {
    if (!user) return false
    if (user.role === 'admin') return true
    const rank = userRank || this.getRankFromRole(user.role)
    return this.canEditPersonnel(rank, targetRank)
  }

  /** Filter personnel list based on user's viewable ranks */
  filterByVisibility<T extends { rank?: PoliceRank }>(items: T[], userRank: PoliceRank | null): T[] {
    if (!userRank) return []
    const viewable = this.getViewableRanks(userRank)
    return items.filter(item => !item.rank || viewable.includes(item.rank))
  }
}

export const rbacService = new RBACService()
export default rbacService
