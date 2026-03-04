import { useState, useEffect } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Modal, ConfirmDialog } from '@/components/common/Modal'
import { FormField, TextInput, Select } from '@/components/common/FormField'
import { useNotifications } from '@/context/NotificationContext'
import type { Location } from '@/types'

const timezones = [
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
]

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null)
  const { showToast } = useNotifications()

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    timezone: 'Europe/London',
    capacity: 50,
    isActive: true,
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const response = await apiGateway.getLocations()
      if (response.success) setLocations(response.data)
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setFormData({
        name: location.name,
        address: location.address,
        city: location.city,
        timezone: location.timezone,
        capacity: location.capacity,
        isActive: location.isActive,
      })
    } else {
      setEditingLocation(null)
      setFormData({
        name: '',
        address: '',
        city: '',
        timezone: 'Europe/London',
        capacity: 50,
        isActive: true,
      })
    }
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingLocation) {
        const response = await apiGateway.updateLocation(editingLocation.id, formData)
        if (response.success) {
          showToast({ type: 'success', title: 'Location updated successfully' })
          fetchLocations()
        } else {
          showToast({ type: 'error', title: 'Failed to update location', message: response.error })
        }
      } else {
        const response = await apiGateway.createLocation(formData)
        if (response.success) {
          showToast({ type: 'success', title: 'Location created successfully' })
          fetchLocations()
        } else {
          showToast({ type: 'error', title: 'Failed to create location', message: response.error })
        }
      }
      setModalOpen(false)
    } catch (error) {
      showToast({ type: 'error', title: 'An error occurred' })
    }
  }

  const handleDelete = async () => {
    if (!deletingLocation) return
    
    try {
      const response = await apiGateway.deleteLocation(deletingLocation.id)
      if (response.success) {
        showToast({ type: 'success', title: 'Location deleted successfully' })
        fetchLocations()
      } else {
        showToast({ type: 'error', title: 'Failed to delete location', message: response.error })
      }
    } catch (error) {
      showToast({ type: 'error', title: 'An error occurred' })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingLocation(null)
    }
  }

  const columns: Column<Location>[] = [
    {
      key: 'name',
      header: 'Name',
      accessor: row => <span className="font-medium">{row.name}</span>,
      sortable: true,
      filterable: true,
    },
    {
      key: 'address',
      header: 'Address',
      accessor: row => (
        <div>
          <p>{row.address}</p>
          <p className="text-sm text-neutral-500">{row.city}</p>
        </div>
      ),
    },
    {
      key: 'timezone',
      header: 'Timezone',
      accessor: row => row.timezone,
      sortable: true,
    },
    {
      key: 'capacity',
      header: 'Capacity',
      accessor: row => row.capacity,
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
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleOpenModal(row)
            }}
            className="text-primary-500 hover:text-primary-600"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDeletingLocation(row)
              setDeleteDialogOpen(true)
            }}
            className="text-error-500 hover:text-error-600"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Locations</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage workplace locations</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          Add Location
        </button>
      </div>

      <div className="card">
        <DataTable
          data={locations}
          columns={columns}
          keyExtractor={row => row.id}
          loading={loading}
          onRowClick={handleOpenModal}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLocation ? 'Edit Location' : 'Add Location'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Location Name" required>
            <TextInput
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Main Office"
              required
            />
          </FormField>

          <FormField label="Address" required>
            <TextInput
              value={formData.address}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="e.g., 123 Business Park"
              required
            />
          </FormField>

          <FormField label="City" required>
            <TextInput
              value={formData.city}
              onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="e.g., London"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Timezone" required>
              <Select
                value={formData.timezone}
                onChange={e => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                options={timezones}
                required
              />
            </FormField>

            <FormField label="Capacity" required>
              <TextInput
                type="number"
                value={formData.capacity}
                onChange={e => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                min={1}
                required
              />
            </FormField>
          </div>

          <FormField label="Status">
            <Select
              value={formData.isActive ? 'active' : 'inactive'}
              onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingLocation ? 'Update' : 'Create'} Location
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Location"
        message={`Are you sure you want to delete "${deletingLocation?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
