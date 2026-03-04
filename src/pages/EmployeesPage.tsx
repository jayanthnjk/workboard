import { useState, useEffect } from 'react'
import { apiGateway } from '@/services/apiGateway'
import { DataTable, type Column } from '@/components/common/DataTable'
import { Modal } from '@/components/common/Modal'
import { FormField, TextInput, Select, MultiSelect } from '@/components/common/FormField'
import { useNotifications } from '@/context/NotificationContext'
import type { Employee, Department } from '@/types'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const { showToast } = useNotifications()

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    departmentId: '',
    role: 'employee' as 'admin' | 'supervisor' | 'employee',
    skills: [] as string[],
    status: 'active' as 'active' | 'inactive',
  })

  useEffect(() => {
    fetchData()
    
    // Refetch when page becomes visible (e.g., user navigates back from another tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }
    
    // Refetch when window gains focus (user switches tabs within app)
    const handleFocus = () => {
      fetchData()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [empRes, deptRes] = await Promise.all([
        apiGateway.getAllEmployees(),
        apiGateway.getDepartments(),
      ])
      if (empRes.success) setEmployees(empRes.data)
      if (deptRes.success) setDepartments(deptRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        departmentId: employee.departmentId,
        role: employee.role,
        skills: employee.skills,
        status: employee.status,
      })
    } else {
      setEditingEmployee(null)
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        departmentId: '',
        role: 'employee',
        skills: [],
        status: 'active',
      })
    }
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingEmployee) {
        const response = await apiGateway.updateEmployee(editingEmployee.id, {
          ...formData,
          preferences: editingEmployee.preferences,
          hireDate: editingEmployee.hireDate,
        })
        if (response.success) {
          showToast({ type: 'success', title: 'Employee updated successfully' })
          fetchData()
        } else {
          showToast({ type: 'error', title: 'Failed to update employee', message: response.error })
        }
      } else {
        const response = await apiGateway.createEmployee({
          ...formData,
          hireDate: new Date().toISOString(),
          preferences: {
            preferredShifts: [],
            unavailableDays: [],
            maxHoursPerWeek: 40,
            preferredLocations: [],
          },
        })
        if (response.success) {
          showToast({ type: 'success', title: 'Employee created successfully' })
          fetchData()
        } else {
          showToast({ type: 'error', title: 'Failed to create employee', message: response.error })
        }
      }
      setModalOpen(false)
    } catch (error) {
      showToast({ type: 'error', title: 'An error occurred' })
    }
  }

  const getDepartmentName = (id: string) => departments.find(d => d.id === id)?.name || 'Unknown'

  const columns: Column<Employee>[] = [
    {
      key: 'employeeId',
      header: 'ID',
      accessor: row => row.employeeId,
      rawValue: row => row.employeeId,
      sortable: true,
      filterable: true,
    },
    {
      key: 'name',
      header: 'Name',
      accessor: row => (
        <div className="flex items-center gap-3">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.employeeId}`}
            alt={row.name}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-neutral-500">{row.email}</p>
          </div>
        </div>
      ),
      rawValue: row => `${row.name} ${row.email}`,
      sortable: true,
      filterable: true,
    },
    {
      key: 'department',
      header: 'Department',
      accessor: row => getDepartmentName(row.departmentId),
      rawValue: row => getDepartmentName(row.departmentId),
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: departments.map(d => ({ value: d.name, label: d.name })),
    },
    {
      key: 'role',
      header: 'Role',
      accessor: row => (
        <span className="badge badge-info capitalize">{row.role}</span>
      ),
      rawValue: row => row.role,
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'admin', label: 'Admin' },
        { value: 'supervisor', label: 'Supervisor' },
        { value: 'employee', label: 'Employee' },
      ],
    },
    {
      key: 'skills',
      header: 'Skills',
      accessor: row => (
        <div className="flex flex-wrap gap-1">
          {row.skills.slice(0, 2).map(skill => (
            <span key={skill} className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded">
              {skill}
            </span>
          ))}
          {row.skills.length > 2 && (
            <span className="text-xs text-neutral-500">+{row.skills.length - 2}</span>
          )}
        </div>
      ),
      rawValue: row => row.skills.join(' '),
      filterable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: row => (
        <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-error'}`}>
          {row.status}
        </span>
      ),
      rawValue: row => row.status,
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      key: 'actions',
      header: '',
      accessor: row => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleOpenModal(row)
          }}
          className="text-primary-500 hover:text-primary-600"
        >
          Edit
        </button>
      ),
    },
  ]

  const skillOptions = [
    { value: 'customer-service', label: 'Customer Service' },
    { value: 'forklift', label: 'Forklift' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'first-aid', label: 'First Aid' },
    { value: 'cash-handling', label: 'Cash Handling' },
    { value: 'data-entry', label: 'Data Entry' },
    { value: 'technical-support', label: 'Technical Support' },
    { value: 'sales', label: 'Sales' },
    { value: 'training', label: 'Training' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Employees</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Manage employee records and assignments</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          Add Employee
        </button>
      </div>

      <div className="card">
        <DataTable
          data={employees}
          columns={columns}
          keyExtractor={row => row.id}
          loading={loading}
          onRowClick={handleOpenModal}
          pageSize={15}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Employee ID" required>
              <TextInput
                value={formData.employeeId}
                onChange={e => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                placeholder="EMP0001"
                disabled={!!editingEmployee}
                required
              />
            </FormField>
            <FormField label="Full Name" required>
              <TextInput
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" required>
              <TextInput
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                required
              />
            </FormField>
            <FormField label="Phone">
              <TextInput
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+44 7123456789"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Department" required>
              <Select
                value={formData.departmentId}
                onChange={e => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                options={departments.map(d => ({ value: d.id, label: d.name }))}
                placeholder="Select department"
                required
              />
            </FormField>
            <FormField label="Role" required>
              <Select
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as typeof formData.role }))}
                options={[
                  { value: 'employee', label: 'Employee' },
                  { value: 'supervisor', label: 'Supervisor' },
                  { value: 'admin', label: 'Admin' },
                ]}
                required
              />
            </FormField>
          </div>

          <FormField label="Skills">
            <MultiSelect
              value={formData.skills}
              onChange={skills => setFormData(prev => ({ ...prev, skills }))}
              options={skillOptions}
              placeholder="Select skills..."
            />
          </FormField>

          <FormField label="Status">
            <Select
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as typeof formData.status }))}
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
              {editingEmployee ? 'Update' : 'Create'} Employee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
