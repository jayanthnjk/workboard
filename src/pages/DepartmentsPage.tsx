import { useState, useEffect } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Modal, ConfirmDialog } from '@/components/common/Modal'
import { FormField, TextInput, TextArea, Select } from '@/components/common/FormField'
import { useNotifications } from '@/context/NotificationContext'
import type { Department } from '@/types'

export default function DepartmentsPage() {
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
      header: 'Code',
      accessor: row => <span className="font-mono text-sm">{row.code}</span>,
      sortable: true,
    },
    {
      key: 'name',
      header: 'Name',
      accessor: row => <span className="font-medium">{row.name}</span>,
      sortable: true,
      filterable: true,
    },
    {
      key: 'description',
      header: 'Description',
      accessor: row => (
        <span className="text-[var(--color-text-light)] truncate max-w-xs block">
          {row.description || '-'}
        </span>
      ),
    },
    {
      key: 'parent',
      header: 'Parent',
      accessor: row => getParentName(row.parentId),
    },
    {
      key: 'employeeCount',
      header: 'Employees',
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
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeletingDepartment(row)
              setDeleteDialogOpen(true)
            }}
            className="text-[var(--color-error)] hover:text-[var(--color-error)]/80"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">Departments</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">Manage organizational structure</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          Add Department
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
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Department Name" required>
            <TextInput
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Operations"
              required
            />
          </FormField>

          <FormField label="Code" required>
            <TextInput
              value={formData.code}
              onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="e.g., OPS"
              required
              maxLength={10}
            />
          </FormField>

          <FormField label="Description">
            <TextArea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the department"
            />
          </FormField>

          <FormField label="Parent Department">
            <Select
              value={formData.parentId}
              onChange={e => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              options={[
                { value: '', label: 'None (Top Level)' },
                ...departments
                  .filter(d => d.id !== editingDepartment?.id)
                  .map(d => ({ value: d.id, label: d.name })),
              ]}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingDepartment ? 'Update' : 'Create'} Department
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${deletingDepartment?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
