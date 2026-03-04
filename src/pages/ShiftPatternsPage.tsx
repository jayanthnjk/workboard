import { useState, useEffect } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, Modal, FormField, LoadingSpinner } from '@/components/common'
import type { Column } from '@/components/common'
import type { ShiftPattern, ShiftType } from '@/types'

const ShiftPatternsPage = () => {
  const [patterns, setPatterns] = useState<ShiftPattern[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPattern, setEditingPattern] = useState<ShiftPattern | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rotationCycle: 7,
    shiftTypeIds: [] as string[],
    sequence: [] as string[],
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [patternsRes, typesRes] = await Promise.all([
      apiGateway.getShiftPatterns(),
      apiGateway.getShiftTypes(),
    ])
    if (patternsRes.success) setPatterns(patternsRes.data)
    if (typesRes.success) setShiftTypes(typesRes.data)
    setLoading(false)
  }

  const columns: Column<ShiftPattern>[] = [
    { key: 'name', header: 'Name', accessor: (row) => row.name, sortable: true },
    { key: 'description', header: 'Description', accessor: (row) => row.description || '' },
    { key: 'rotationCycle', header: 'Cycle (days)', accessor: (row) => row.rotationCycle, sortable: true },
    {
      key: 'shiftTypeIds',
      header: 'Shift Types',
      accessor: (row) => row.shiftTypeIds.map(id => 
        shiftTypes.find(s => s.id === id)?.name || id
      ).join(', '),
    },
    {
      key: 'isActive',
      header: 'Status',
      accessor: (row) => (
        <span className={`px-2 py-1 rounded text-xs ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="text-blue-600 hover:underline text-sm">Edit</button>
          <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:underline text-sm">Delete</button>
        </div>
      ),
    },
  ]

  const handleEdit = (pattern: ShiftPattern) => {
    setEditingPattern(pattern)
    setFormData({
      name: pattern.name,
      description: pattern.description || '',
      rotationCycle: pattern.rotationCycle,
      shiftTypeIds: pattern.shiftTypeIds,
      sequence: pattern.sequence,
      isActive: pattern.isActive,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pattern?')) return
    await apiGateway.deleteShiftPattern(id)
    loadData()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingPattern) {
      await apiGateway.updateShiftPattern(editingPattern.id, formData)
    } else {
      await apiGateway.createShiftPattern(formData)
    }
    setIsModalOpen(false)
    setEditingPattern(null)
    resetForm()
    loadData()
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', rotationCycle: 7, shiftTypeIds: [], sequence: [], isActive: true })
  }

  const openCreateModal = () => {
    setEditingPattern(null)
    resetForm()
    setIsModalOpen(true)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shift Patterns</h1>
        <button onClick={openCreateModal} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
          Add Pattern
        </button>
      </div>

      <DataTable columns={columns} data={patterns} keyExtractor={(row) => row.id} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPattern ? 'Edit Pattern' : 'Add Pattern'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" required>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              rows={2}
            />
          </FormField>
          <FormField label="Rotation Cycle (days)" required>
            <input
              type="number"
              value={formData.rotationCycle}
              onChange={e => setFormData({ ...formData, rotationCycle: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min={1}
              required
            />
          </FormField>
          <FormField label="Shift Types">
            <select
              multiple
              value={formData.shiftTypeIds}
              onChange={e => setFormData({ ...formData, shiftTypeIds: Array.from(e.target.selectedOptions, o => o.value) })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              {shiftTypes.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Active">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4"
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ShiftPatternsPage
