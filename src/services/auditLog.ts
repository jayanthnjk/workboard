import { apiGateway } from './apiGateway'
import type { AuditEntry } from '@/types'

export interface AuditFilters {
  source?: string
  actionType?: string
  userId?: number
  from?: string
  to?: string
  search?: string
  page?: number
  size?: number
}

export interface AuditStats {
  totalCount: number
  countByActionType: Record<string, number>
  countBySource: Record<string, number>
}

export interface AuditServiceError {
  error: true
  message: string
}

type AuditResult<T> = T | AuditServiceError

function isError<T>(result: AuditResult<T>): result is AuditServiceError {
  return (result as AuditServiceError).error === true
}

class AuditLogService {
  async getEntries(filters?: AuditFilters): Promise<AuditResult<{
    content: AuditEntry[]
    totalElements: number
    totalPages: number
    number: number
    size: number
  }>> {
    const result = await apiGateway.getAuditLogs(filters)
    if (!result.success) {
      return { error: true, message: result.error || 'Failed to fetch audit logs' }
    }
    return result.data
  }

  async getStats(from?: string, to?: string): Promise<AuditResult<AuditStats>> {
    const result = await apiGateway.getAuditStats(from, to)
    if (!result.success) {
      return { error: true, message: result.error || 'Failed to fetch audit stats' }
    }
    return result.data
  }

  async exportCsv(filters?: Omit<AuditFilters, 'page' | 'size'>): Promise<AuditResult<void>> {
    const result = await apiGateway.exportAuditCsv(filters)
    if (!result.success) {
      return { error: true, message: result.error || 'Failed to export audit CSV' }
    }

    // Trigger browser download
    const blob = result.data
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return undefined as unknown as void
  }
}

export const auditLog = new AuditLogService()
export { isError }
export default auditLog
