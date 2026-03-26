import { useState, useEffect } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, Modal, FormField, LoadingSpinner } from '@/components/common'
import type { Column } from '@/components/common'
import type { RotationRule, RotationRuleType, RuleConstraint } from '@/types'

const RotationRulesPage = () => {
  const [rules, setRules] = useState<RotationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RotationRule | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'round-robin' as RotationRuleType,
    description: '',
    minRestHours: 11,
    maxConsecutiveDays: 6,
    priority: 1,
    constraints: [] as RuleConstraint[],
    isActive: true,
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const res = await apiGateway.getRotationRules()
    if (res.success) setRules(res.data)
    setLoading(false)
  }

  const ruleTypes: { value: RotationRuleType; label: string }[] = [
    { value: 'round-robin', label: 'Round Robin' },
    { value: 'skill-based', label: 'Skill Based' },
    { value: 'seniority-based', label: 'Seniority Based' },
    { value: 'preference-based', label: 'Preference Based' },
  ]

  const columns: Column<RotationRule>[] = [
    { key: 'name', header: 'Name', accessor: (row) => row.name, sortable: true },
    { key: 'type', header: 'Type', accessor: (row) => row.type, sortable: true },
    { key: 'minRestHours', header: 'Min Rest (hrs)', accessor: (row) => row.minRestHours },
    { key: 'maxConsecutiveDays', header: 'Max Consecutive Days', accessor: (row) => row.maxConsecutiveDays },
    { key: 'priority', header: 'Priority', accessor: (row) => row.priority, sortable: true },
    {
      key: 'isActive',
      header: 'Status',
      accessor: (row) => (
        <span className={`badge ${row.isActive ? 'badge-success' : 'bg-[var(--color-bg-main)] text-[var(--color-text-medium)]'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="text-[var(--color-primary)] hover:underline text-sm">Edit</button>
          <button onClick={() => handleDelete(row.id)} className="text-[var(--color-error)] hover:underline text-sm">Delete</button>
        </div>
      ),
    },
  ]

  const handleEdit = (rule: RotationRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      type: rule.type,
      description: rule.description || '',
      minRestHours: rule.minRestHours,
      maxConsecutiveDays: rule.maxConsecutiveDays,
      priority: rule.priority,
      constraints: rule.constraints,
      isActive: rule.isActive,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return
    await apiGateway.deleteRotationRule(id)
    loadData()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingRule) {
      await apiGateway.updateRotationRule(editingRule.id, formData)
    } else {
      await apiGateway.createRotationRule(formData)
    }
    setIsModalOpen(false)
    setEditingRule(null)
    resetForm()
    loadData()
  }

  const resetForm = () => {
    setFormData({ name: '', type: 'round-robin', description: '', minRestHours: 11, maxConsecutiveDays: 6, priority: 1, constraints: [], isActive: true })
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">Rotation Rules</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">Manage duty rotation configurations</p>
        </div>
        <button onClick={() => { setEditingRule(null); resetForm(); setIsModalOpen(true) }} className="btn btn-primary">
          Add Rule
        </button>
      </div>

      <DataTable columns={columns} data={rules} keyExtractor={(row) => row.id} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRule ? 'Edit Rule' : 'Add Rule'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" required>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input" required />
          </FormField>
          <FormField label="Type" required>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as RotationRuleType })} className="input">
              {ruleTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </FormField>
          <FormField label="Description">
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input" rows={2} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Min Rest Hours" required>
              <input type="number" value={formData.minRestHours} onChange={e => setFormData({ ...formData, minRestHours: parseInt(e.target.value) })} className="input" min={0} required />
            </FormField>
            <FormField label="Max Consecutive Days" required>
              <input type="number" value={formData.maxConsecutiveDays} onChange={e => setFormData({ ...formData, maxConsecutiveDays: parseInt(e.target.value) })} className="input" min={1} required />
            </FormField>
          </div>
          <FormField label="Priority" required>
            <input type="number" value={formData.priority} onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })} className="input" min={1} required />
          </FormField>
          <FormField label="Active">
            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4" />
          </FormField>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default RotationRulesPage
