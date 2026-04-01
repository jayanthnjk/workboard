import { useState, useEffect } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Modal, ConfirmDialog } from '@/components/common/Modal'
import { FormField, TextInput, TextArea, Select } from '@/components/common/FormField'
import { useNotifications } from '@/context/NotificationContext'
import { useLanguage } from '@/context/LanguageContext'
import type { Department } from '@/types'

export default function DepartmentsPage() {
  const { t } = useLanguage()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null)
  const { showToast } = useNotifications()

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentId: '',
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const response = await apiGateway.getDepartments()
      if (response.success) setDepartments(response.data)
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department)
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || '',
        parentId: department.parentId || '',
      })
    } else {
      setEditingDepartment(null)
      setFormData({ name: '', code: '', description: '', parentId: '' })
    }
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingDepartment) {
        const response = await apiGateway.updateDepartment(editingDepartment.id, {
          ...formData,
          parentId: formData.parentId || undefined,
          employeeCount: editingDepartment.employeeCount,
        })
        if (response.success) {
          showToast({ type: 'success', title: 'Department updated successfully' })
          fetchDepartments()
        } else {
          showToast({ type: 'error', title: 'Failed to update department', message: response.error })
        }
      } else {
        const response = await apiGateway.createDepartment({
          ...formData,
          parentId: formData.parentId || undefined,
          employeeCount: 0,
        })
        if (response.success) {
          showToast({ type: 'success', title: 'Department created successfully' })
          fetchDepartments()
        } else {
          showToast({ type: 'error', title: 'Failed to create department', message: response.error })
        }
      }
      setModalOpen(false)
    } catch (error) {
      showToast({ type: 'error', title: 'An error occurred' })
    }
  }

  const handleDelete = async () => {
    if (!deletingDepartment) return
    
    try {
      const response = await apiGateway.deleteDepartment(deletingDepartment.id)
      if (response.success) {
        showToast({ type: 'success', title: 'Department deleted successfully' })
        fetchDepartments()
      } else {
        showToast({ type: 'error', title: 'Failed to delete department', message: response.error })
      }
    } catch (error) {
      showToast({ type: 'error', title: 'An error occurred' })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingDepartment(null)
    }
  }

  const getParentName = (parentId?: string) => {
    if (!parentId) return '-'
    return departments.find(d => d.id === parentId)?.name || 'Unknown'
  }

  const columns: Column<Department>[] = [
    {
      key: 'code',
      header: t('code'),
      accessor: row => <span className="font-mono text-sm">{row.code}</span>,
      sortable: true,
    },
    {
      key: 'name',
      header: t('name'),
      accessor: row => <span className="font-medium">{row.name}</span>,
      sortable: true,
      filterable: true,
    },
    {
      key: 'description',
      header: t('description'),
      accessor: row => (
        <span className="text-[var(--color-text-light)] truncate max-w-xs block">
          {row.description || '-'}
        </span>
      ),
    },
    {
      key: 'parent',
      header: t('parent'),
      accessor: row => getParentName(row.parentId),
    },
    {
      key: 'employeeCount',
      header: t('employees'),
      accessor: row => row.employeeCount,
      sortable: true,
    },
    {
      key: 'actions',
      header: '',
      accessor: row => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleOpenModal(row)
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#6b5c42] bg-[rgba(107,92,66,0.05)] hover:bg-[rgba(107,92,66,0.1)] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            {t('edit')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeletingDepartment(row)
              setDeleteDialogOpen(true)
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#ba1a1a] bg-[rgba(186,26,26,0.05)] hover:bg-[rgba(186,26,26,0.1)] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            {t('delete')}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('departments')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('manage_org_structure')}</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          {t('add_department')}
        </button>
      </div>

      <div className="card">
        <DataTable
          data={departments}
          columns={columns}
          keyExtractor={row => row.id}
          loading={loading}
          onRowClick={handleOpenModal}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDepartment ? t('edit_department') : t('add_department')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t('department_name')} required>
            <TextInput
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Operations"
              required
            />
          </FormField>

          <FormField label={t('code')} required>
            <TextInput
              value={formData.code}
              onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="e.g., OPS"
              required
              maxLength={10}
            />
          </FormField>

          <FormField label={t('description')}>
            <TextArea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the department"
            />
          </FormField>

          <FormField label={t('parent_department')}>
            <Select
              value={formData.parentId}
              onChange={e => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              options={[
                { value: '', label: t('none_top_level') },
                ...departments
                  .filter(d => d.id !== editingDepartment?.id)
                  .map(d => ({ value: d.id, label: d.name })),
              ]}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {editingDepartment ? t('update') : t('create')} {t('department')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t('delete_department')}
        message={t('delete_confirm_msg').replace('{0}', deletingDepartment?.name || '')}
        confirmText={t('delete')}
        variant="danger"
      />
    </div>
  )
}
