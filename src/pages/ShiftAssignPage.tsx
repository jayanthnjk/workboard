import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiGateway } from '@/services/apiGateway'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { Employee, ShiftType, Personnel, Location } from '@/types'

export default function ShiftAssignPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillEmployeeId = searchParams.get('employee') || ''
  const prefillDate = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const [employees, setEmployees] = useState<Employee[]>([])
  const [personnelList, setPersonnelList] = useState<Personnel[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedEmployee, setSelectedEmployee] = useState(prefillEmployeeId)
  const [selectedDate, setSelectedDate] = useState(prefillDate)
  const [selectedShift, setSelectedShift] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, typesRes, locRes, perRes] = await Promise.all([
          apiGateway.getEmployees(1, 200),
          apiGateway.getShiftTypes(),
          apiGateway.getLocations(),
          apiGateway.getAllPersonnel(),
        ])
        if (empRes.data) setEmployees(empRes.data)
        if (typesRes.success) setShiftTypes(typesRes.data)
        if (locRes.success) setLocations(locRes.data)
        if (perRes.success) setPersonnelList(perRes.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const selectedEmp = useMemo(() => employees.find(e => e.id === selectedEmployee), [employees, selectedEmployee])
  const selectedPer = useMemo(() => {
    if (!selectedEmp) return null
    return personnelList.find(p => p.personnelId === selectedEmp.employeeId) || null
  }, [selectedEmp, personnelList])
  const selectedShiftType = useMemo(() => shiftTypes.find(s => s.id === selectedShift), [shiftTypes, selectedShift])

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedDate || !selectedShift || !selectedLocation) return
    try {
      await apiGateway.createShiftAssignment({
        employeeId: selectedEmployee,
        shiftTypeId: selectedShift,
        date: selectedDate,
        locationId: selectedLocation,
        status: 'scheduled',
        notes: notes || undefined,
        createdBy: 'current-user',
      })
      navigate('/shift-schedule')
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/shift-schedule')} className="p-2 hover:bg-[var(--color-bg-card)] rounded-lg text-[var(--color-text-medium)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="page-title">Assign Shift</h1>
          <p className="page-subtitle">Assign a shift to a team member at a specific location</p>
        </div>
      </div>

      {/* Employee Info Card */}
      {selectedEmp && (
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: `hsl(${(selectedEmp.name.charCodeAt(0) * 37 + (selectedEmp.name.charCodeAt(1) || 0) * 17) % 360}, 55%, 50%)` }}>
            {selectedEmp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-dark)]">{selectedEmp.name}</p>
            <p className="text-xs text-[var(--color-text-medium)]">{selectedEmp.employeeId} · {selectedPer?.rank || selectedEmp.role} · {selectedPer?.section ? `Section ${selectedPer.section}` : ''} {selectedPer?.platoon ? `· Platoon ${selectedPer.platoon.replace('P', '')}` : ''}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card p-6 space-y-5">
        {/* Employee */}
        <div>
          <label className="label">Team Member</label>
          <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="input">
            <option value="">Select employee...</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>)}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="label">Date</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input" />
        </div>

        {/* Shift Type */}
        <div>
          <label className="label">Shift Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {shiftTypes.filter(s => s.isActive).map(st => (
              <button key={st.id} onClick={() => setSelectedShift(st.id)}
                className={`text-left px-4 py-3 rounded-lg border transition-all ${selectedShift === st.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/30' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: st.colorCode }} />
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-dark)]">{st.name}</p>
                    <p className="text-[10px] text-[var(--color-text-light)]">{st.startTime} - {st.endTime} · {st.category}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="label">Location</label>
          <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="input">
            <option value="">Select location...</option>
            {locations.filter(l => l.isActive).map(l => <option key={l.id} value={l.id}>{l.name} — {l.city}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" rows={2} placeholder="Any additional notes..." />
        </div>

        {/* Summary */}
        {selectedShiftType && selectedDate && (
          <div className="p-3 bg-[var(--color-bg-main)] rounded-lg border border-[var(--color-border)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-light)] font-semibold mb-2">Assignment Summary</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--color-text-medium)]">
              <span>📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>⏰ {selectedShiftType.startTime} - {selectedShiftType.endTime}</span>
              <span style={{ color: selectedShiftType.colorCode }}>● {selectedShiftType.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/shift-schedule')} className="btn btn-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={!selectedEmployee || !selectedDate || !selectedShift || !selectedLocation}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Assign Shift
        </button>
      </div>
    </div>
  )
}
