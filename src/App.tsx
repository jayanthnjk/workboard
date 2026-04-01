import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

// Lazy loaded pages
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const EmployeesPage = lazy(() => import('@/pages/EmployeesPage'))
const DepartmentsPage = lazy(() => import('@/pages/DepartmentsPage'))
const LocationsPage = lazy(() => import('@/pages/LocationsPage'))
const ShiftTypesPage = lazy(() => import('@/pages/ShiftTypesPage'))
const ShiftPatternsPage = lazy(() => import('@/pages/ShiftPatternsPage'))
const RotationRulesPage = lazy(() => import('@/pages/RotationRulesPage'))
const LeaveRequestsPage = lazy(() => import('@/pages/LeaveRequestsPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const AuditPage = lazy(() => import('@/pages/AuditPage'))
const DocumentUploadPage = lazy(() => import('@/pages/DocumentUploadPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const MessagingConfigPage = lazy(() => import('@/pages/MessagingConfigPage'))
const MessageTemplateEditPage = lazy(() => import('@/pages/MessageTemplateEditPage'))
const PersonnelFormPage = lazy(() => import('@/pages/PersonnelFormPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const HelpPage = lazy(() => import('@/pages/HelpPage'))
const NewAssignmentPage = lazy(() => import('@/pages/NewAssignmentPage'))
const DutyDetailPage = lazy(() => import('@/pages/DutyDetailPage'))
const ShiftSchedulePage = lazy(() => import('@/pages/ShiftSchedulePage'))
const ShiftAssignPage = lazy(() => import('@/pages/ShiftAssignPage'))
const LocationFormPage = lazy(() => import('@/pages/LocationFormPage'))

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <Suspense fallback={<LoadingSpinner fullScreen />}>
                <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/home" replace />} />
                  <Route path="home" element={<HomePage />} />
                  <Route path="dashboard" element={<Navigate to="/home" replace />} />
                  <Route path="schedule/new" element={<NewAssignmentPage />} />
                  <Route path="schedule/platoon/:platoonId" element={<DutyDetailPage />} />
                  <Route path="shift-schedule" element={<ShiftSchedulePage />} />
                  <Route path="shift-schedule/assign" element={<ShiftAssignPage />} />
                  <Route
                    path="employees"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                        <EmployeesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="employees/add"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <PersonnelFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="employees/:id"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                        <PersonnelFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="departments"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <DepartmentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="locations"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <LocationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="locations/add"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <LocationFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="locations/:id/edit"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <LocationFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="locations/add"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <LocationFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="locations/:id/edit"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <LocationFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="shift-types"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <ShiftTypesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="shift-patterns"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <ShiftPatternsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="rotation-rules"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <RotationRulesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="leave-requests" element={<LeaveRequestsPage />} />
                  <Route
                    path="reports"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                        <ReportsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="audit"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AuditPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="documents"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <DocumentUploadPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route
                    path="messaging"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <MessagingConfigPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="messaging/template"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <MessageTemplateEditPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="help" element={<HelpPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </Suspense>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </ErrorBoundary>
  )
}

export default App
