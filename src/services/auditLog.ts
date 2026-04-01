import { dataStore } from './dataStore'
import type { AuditEntry, AuditAction, AuditEntityType } from '@/types'

interface AuditLogOptions {
  userId: string
  userName: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  entityName?: string
  beforeValue?: Record<string, unknown>
  afterValue?: Record<string, unknown>
}

class AuditLogService {
  private currentUser: { id: string; name: string } | null = null

  setCurrentUser(user: { id: string; name: string } | null): void {
    this.currentUser = user
  }

  async log(options: AuditLogOptions): Promise<AuditEntry> {
    const entry = dataStore.createAuditEntry({
      userId: options.userId,
      userName: options.userName,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      entityName: options.entityName,
      beforeValue: options.beforeValue,
      afterValue: options.afterValue,
    })

    console.log('[Audit]', options.action.toUpperCase(), options.entityType, options.entityId)
    return entry
  }

  async logCreate(
    entityType: AuditEntityType,
    entityId: string,
    entityName: string,
    data: Record<string, unknown>
  ): Promise<AuditEntry | null> {
    if (!this.currentUser) return null

    return this.log({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'create',
      entityType,
      entityId,
      entityName,
      afterValue: data,
    })
  }

  async logUpdate(
    entityType: AuditEntityType,
    entityId: string,
    entityName: string,
    beforeData: Record<string, unknown>,
    afterData: Record<string, unknown>
  ): Promise<AuditEntry | null> {
    if (!this.currentUser) return null

    return this.log({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'update',
      entityType,
      entityId,
      entityName,
      beforeValue: beforeData,
      afterValue: afterData,
    })
  }

  async logDelete(
    entityType: AuditEntityType,
    entityId: string,
    entityName: string,
    data: Record<string, unknown>
  ): Promise<AuditEntry | null> {
    if (!this.currentUser) return null

    return this.log({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'delete',
      entityType,
      entityId,
      entityName,
      beforeValue: data,
    })
  }

  async logLogin(userId: string, userName: string): Promise<AuditEntry> {
    return this.log({
      userId,
      userName,
      action: 'login',
      entityType: 'user',
      entityId: userId,
      entityName: userName,
    })
  }

  async logLogout(userId: string, userName: string): Promise<AuditEntry> {
    return this.log({
      userId,
      userName,
      action: 'logout',
      entityType: 'user',
      entityId: userId,
      entityName: userName,
    })
  }

  getEntries(filters?: {
    action?: AuditAction
    entityType?: AuditEntityType
    userId?: string
    startDate?: string
    endDate?: string
  }): AuditEntry[] {
    let entries = dataStore.getAuditEntries()

    if (filters) {
      if (filters.action) {
        entries = entries.filter(e => e.action === filters.action)
      }
      if (filters.entityType) {
        entries = entries.filter(e => e.entityType === filters.entityType)
      }
      if (filters.userId) {
        entries = entries.filter(e => e.userId === filters.userId)
      }
      if (filters.startDate) {
        entries = entries.filter(e => e.timestamp >= filters.startDate!)
      }
      if (filters.endDate) {
        entries = entries.filter(e => e.timestamp <= filters.endDate!)
      }
    }

    return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }

  exportToCSV(): string {
    const entries = this.getEntries()
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Entity Name']
    const rows = entries.map(e => [
      e.timestamp,
      e.userName,
      e.action,
      e.entityType,
      e.entityId,
      e.entityName || '',
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  exportToJSON(): string {
    return JSON.stringify(this.getEntries(), null, 2)
  }
}

export const auditLog = new AuditLogService()
export default auditLog
