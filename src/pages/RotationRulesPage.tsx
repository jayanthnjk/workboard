import { useState, useEffect } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, Modal, FormField, LoadingSpinner } from '@/components/common'
import type { Column } from '@/components/common'
import { useLanguage } from '@/context/LanguageContext'
import type { RotationRule, RotationRuleType, RuleConstraint } from '@/types'

const RotationRulesPage = () => {
  const { t } = useLanguage()
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
    { value: 'round-robin', label: t('round_robin') },
    { value: 'skill-based', label: t('skill_based') },
    { value: 'seniority-based', label: t('seniority_based') },
    { value: 'preference-based', label: t('preference_based') },
  ]

  const columns: Column<RotationRule>[] = [
    { key: 'name', header: t('name'), accessor: (row) => row.name, sortable: true },
    { key: 'type', header: t('type'), accessor: (row) => row.type, sortable: true },
    { key: 'minRestHours', header: t('min_rest_hrs'), accessor: (row) => row.minRestHours },
    { key: 'maxConsecutiveDays', header: t('max_consecutive_days'), accessor: (row) => row.maxConsecutiveDays },
    { key: 'priority', header: t('priority'), accessor: (row) => row.priority, sortable: true },
    {
      key: 'isActive',
      header: t('status'),
      accessor: (row) => (
        <span className={`badge ${row.isActive ? 'badge-success' : 'bg-[var(--color-bg-main)] text-[var(--color-text-medium)]'}`}>
          {row.isActive ? t('active') : t('inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('actions'),
      accessor: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#6b5c42] bg-[rgba(107,92,66,0.05)] hover:bg-[rgba(107,92,66,0.1)] transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>{t('edit')}</button>
          <button onClick={() => handleDelete(row.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[#ba1a1a] bg-[rgba(186,26,26,0.05)] hover:bg-[rgba(186,26,26,0.1)] transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>{t('delete')}</button>
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
    if (!confirm(t('delete_rule_confirm'))) return
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
          <h1 className="text-lg font-semibold text-[var(--color-text-dark)]">{t('rotation_rules_title')}</h1>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">{t('manage_rotation_configs')}</p>
        </div>
        <button onClick={() => { setEditingRule(null); resetForm(); setIsModalOpen(true) }} className="btn btn-primary">
          {t('add_rule')}
        </button>
      </div>

      <DataTable columns={columns} data={rules} keyExtractor={(row) => row.id} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRule ? t('edit_rule') : t('add_rule')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t('name')} required>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input" required />
          </FormField>
          <FormField label={t('type')} required>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as RotationRuleType })} className="input">
              {ruleTypes.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
            </select>
          </FormField>
          <FormField label={t('description')}>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input" rows={2} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('min_rest_hours')} required>
              <input type="number" value={formData.minRestHours} onChange={e => setFormData({ ...formData, minRestHours: parseInt(e.target.value) })} className="input" min={0} required />
            </FormField>
            <FormField label={t('max_consecutive_days')} required>
              <input type="number" value={formData.maxConsecutiveDays} onChange={e => setFormData({ ...formData, maxConsecutiveDays: parseInt(e.target.value) })} className="input" min={1} required />
            </FormField>
          </div>
          <FormField label={t('priority')} required>
            <input type="number" value={formData.priority} onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })} className="input" min={1} required />
          </FormField>
          <FormField label={t('active')}>
            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4" />
          </FormField>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">{t('cancel')}</button>
            <button type="submit" className="btn btn-primary">{t('save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default RotationRulesPage
