import { useState, useEffect } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Modal, ConfirmDialog } from '@/components/common/Modal'
import { FormField, TextInput, TextArea, Select, TimePicker } from '@/components/common/FormField'
import { useNotifications } from '@/context/NotificationContext'
import type { ShiftType, ShiftCategory } from '@/types'

const colorOptions = [
  { value: '#4CAF50', label: 'Green' },
  { value: '#2196F3', label: 'Blue' },
  { value: '#9C27B0', label: 'Purple' },
  { value: '#FF9800', label: 'Orange' },
  { value: '#F44336', label: 'Red' },
  { value: '#00BCD4', label: 'Cyan' },
  { value: '#795548', label: 'Brown' },
  { value: '#607D8B', label: 'Gray' },
]

export default function ShiftTypesPage() {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null)
  const [deletingShiftType, setDeletingShiftType] = useState<ShiftType | null>(null)
  const { showToast } = useNotifications()

  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 30,
    colorCode: '#4CAF50',
    category: 'regular' as ShiftCategory,
    description: '',
    isActive: true,
  })

  useEffect(() => {
    fetchShiftTypes()
  }, [])

  const fetchShiftTypes = async () => {
    setLoading(true)
    try {
      const response = await apiGateway.getShiftTypes()
      if (response.success) setShiftTypes(response.data)
    } catch (error) {
      console.error('Failed to fetch shift types:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    let duration = (endH * 60 + endM) - (startH * 60 + startM)
    if (duration < 0) duration += 24 * 60 // Handle overnight shifts
    return duration / 60
  }

  const handleOpenModal = (shiftType?: ShiftType) => {
    if (shiftType) {
      setEditingShiftType(shiftType)
      setFormData({
        name: shiftType.name,
        startTime: shiftType.startTime,
        endTime: shiftType.endTime,
        breakDuration: shiftType.breakDuration,
        colorCode: shiftType.colorCode,
        category: shiftType.category,
        description: shiftType.description || '',
        isActive: shiftType.isActive,
      })
    } else {
      setEditingShiftType(null)
      setFormData({
        name: '',
        startTime: '09:00',
        endTime: '17:00',
        breakDuration: 30,
        colorCode: '#4CAF50',
        category: 'regular',
        description: '',
        isActive: true,
      })
    }
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const duration = calculateDuration(formData.startTime, formData.endTime)
    if (duration > 12) {
      showToast({ type: 'warning', title: 'Warning', message: 'Shift duration exceeds 12 hours. Please verify labor compliance.' })
    }
    
    try {
      if (editingShiftType) {
        const response = await apiGateway.updateShiftType(editingShiftType.id, formData)
        if (response.success) {
          showToast({ type: 'success', title: 'Shift type updated successfully' })
          fetchShiftTypes()
        } else {
          showToast({ type: 'error', title: 'Failed to update shift type', message: response.error })
        }
      } else {
        const response = await apiGateway.createShiftType(formData)
        if (response.success) {
          showToast({ type: 'success', title: 'Shift type created successfully' })
          fetchShiftTypes()
        } else {
          showToast({ type: 'error', title: 'Failed to create shift type', message: response.error })
        }
      }
      setModalOpen(false)
    } catch (error) {
      showToast({ type: 'error', title: 'An error occurred' })
    }
  }

  const handleDelete = async () => {
    if (!deletingShiftType) return
    
    try {
      const response = await apiGateway.deleteShiftType(deletingShiftType.id)
      if (response.success) {
        showToast({ type: 'success', title: 'Shift type deleted successfully' })
        fetchShiftTypes()
      } else {
        showToast({ type: 'error', title: 'Failed to delete shift type', message: response.error })
      }
    } catch (error) {
      showToast({ type: 'error', title: 'An error occurred' })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingShiftType(null)
    }
  }

  const columns: Column<ShiftType>[] = [
    {
      key: 'color',
      header: '',
      accessor: row => (
        <div className="w-4 h-4 rounded" style={{ backgroundColor: row.colorCode }} />
      ),
      width: '40px',
    },
    {
      key: 'name',
      header: 'Name',
      accessor: row => <span className="font-medium">{row.name}</span>,
      sortable: true,
      filterable: true,
    },
    {
      key: 'time',
      header: 'Time',
      accessor: row => `${row.startTime} - ${row.endTime}`,
      sortable: true,
    },
    {
      key: 'duration',
      header: 'Duration',
      accessor: row => {
        const duration = calculateDuration(row.startTime, row.endTime)
        return `${duration.toFixed(1)}h`
      },
    },
    {
      key: 'break',
      header: 'Break',
      accessor: row => `${row.breakDuration} min`,
    },
    {
      key: 'category',
      header: 'Category',
      accessor: row => (
        <span className="badge badge-info capitalize">{row.category}</span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: row => (
        <span className={`badge ${row.isActive ? 'badge-success' : 'badge-error'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      accessor: row => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row) }} className="text-primary-500 hover:text-primary-600">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); setDeletingShiftType(row); setDeleteDialogOpen(true) }} className="text-error-500 hover:text-error-600">Delete</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Shift Types</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Configure shift definitions</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">Add Shift Type</button>
      </div>

      <div className="card">
        <DataTable data={shiftTypes} columns={columns} keyExtractor={row => row.id} loading={loading} onRowClick={handleOpenModal} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingShiftType ? 'Edit Shift Type' : 'Add Shift Type'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" required>
            <TextInput value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Morning Shift" required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time" required>
              <TimePicker value={formData.startTime} onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))} required />
            </FormField>
            <FormField label="End Time" required>
              <TimePicker value={formData.endTime} onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))} required />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Break Duration (minutes)" required>
              <TextInput type="number" value={formData.breakDuration} onChange={e => setFormData(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 0 }))} min={0} required />
            </FormField>
            <FormField label="Category" required>
              <Select value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as ShiftCategory }))} options={[
                { value: 'regular', label: 'Regular' },
                { value: 'overtime', label: 'Overtime' },
                { value: 'on-call', label: 'On-Call' },
                { value: 'training', label: 'Training' },
              ]} required />
            </FormField>
          </div>

          <FormField label="Color">
            <div className="flex gap-2">
              {colorOptions.map(color => (
                <button key={color.value} type="button" onClick={() => setFormData(prev => ({ ...prev, colorCode: color.value }))}
                  className={`w-8 h-8 rounded-full border-2 ${formData.colorCode === color.value ? 'border-neutral-900 dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: color.value }} title={color.label} />
              ))}
            </div>
          </FormField>

          <FormField label="Description">
            <TextArea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Optional description" />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingShiftType ? 'Update' : 'Create'} Shift Type</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={handleDelete}
        title="Delete Shift Type" message={`Are you sure you want to delete "${deletingShiftType?.name}"?`} confirmText="Delete" variant="danger" />
    </div>
  )
}
