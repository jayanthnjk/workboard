import { useState, useEffect } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Modal, ConfirmDialog } from '@/components/common/Modal'
import { FormField, TextInput, TextArea, Select, TimePicker } from '@/components/common/FormField'
import { useNotifications } from '@/context/NotificationContext'
import { useLanguage } from '@/context/LanguageContext'
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
  const { t } = useLanguage()

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
      header: t('name'),
      accessor: row => <span className="font-medium">{row.name}</span>,
      sortable: true,
      filterable: true,
    },
    {
      key: 'time',
      header: t('time'),
      accessor: row => `${row.startTime} - ${row.endTime}`,
      sortable: true,
    },
    {
      key: 'duration',
      header: t('duration'),
      accessor: row => {
        const duration = calculateDuration(row.startTime, row.endTime)
        return `${duration.toFixed(1)}h`
      },
    },
    {
      key: 'break',
      header: t('break_label'),
      accessor: row => `${row.breakDuration} ${t('minutes_short')}`,
    },
    {
      key: 'category',
      header: t('category'),
      accessor: row => (
        <span className="badge badge-info capitalize">{row.category}</span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: t('status'),
      accessor: row => (
        <span className={`badge ${row.isActive ? 'badge-success' : 'badge-error'}`}>
          {row.isActive ? t('active') : t('inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      accessor: row => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(row) }} className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#6b5c42] bg-[rgba(107,92,66,0.05)] hover:bg-[rgba(107,92,66,0.1)] transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>{t('edit')}</button>
          <button onClick={(e) => { e.stopPropagation(); setDeletingShiftType(row); setDeleteDialogOpen(true) }} className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#ba1a1a] bg-[rgba(186,26,26,0.05)] hover:bg-[rgba(186,26,26,0.1)] transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>{t('delete')}</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('shift_types_title')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('configure_shift_defs')}</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">{t('add_shift_type')}</button>
      </div>

      <div className="card">
        <DataTable data={shiftTypes} columns={columns} keyExtractor={row => row.id} loading={loading} onRowClick={handleOpenModal} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingShiftType ? t('edit_shift_type') : t('add_shift_type')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t('name')} required>
            <TextInput value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder={t('placeholder_shift_name')} required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('start_time')} required>
              <TimePicker value={formData.startTime} onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))} required />
            </FormField>
            <FormField label={t('end_time')} required>
              <TimePicker value={formData.endTime} onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))} required />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('break_duration')} required>
              <TextInput type="number" value={formData.breakDuration} onChange={e => setFormData(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 0 }))} min={0} required />
            </FormField>
            <FormField label={t('category')} required>
              <Select value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as ShiftCategory }))} options={[
                { value: 'regular', label: t('regular') },
                { value: 'overtime', label: t('overtime') },
                { value: 'on-call', label: t('on_call') },
                { value: 'training', label: t('training') },
              ]} required />
            </FormField>
          </div>

          <FormField label={t('color')}>
            <div className="flex gap-2">
              {colorOptions.map(color => (
                <button key={color.value} type="button" onClick={() => setFormData(prev => ({ ...prev, colorCode: color.value }))}
                  className={`w-8 h-8 rounded-full border-2 ${formData.colorCode === color.value ? 'border-[var(--color-text-dark)]' : 'border-transparent'}`}
                  style={{ backgroundColor: color.value }} title={color.label} />
              ))}
            </div>
          </FormField>

          <FormField label={t('description')}>
            <TextArea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder={t('placeholder_optional_desc')} />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">{t('cancel')}</button>
            <button type="submit" className="btn btn-primary">{editingShiftType ? t('update') : t('create')} {t('shift_types')}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={handleDelete}
        title={t('delete_shift_type')} message={t('delete_confirm_shift').replace('{0}', deletingShiftType?.name || '')} confirmText={t('delete')} variant="danger" />
    </div>
  )
}
