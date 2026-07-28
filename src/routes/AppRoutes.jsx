import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { PreferencesProvider } from '../preferences/PreferencesContext';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Spinner } from '../components/ui/Spinner';
import { ROLES } from '../utils/constants';

const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const GoogleCallbackPage = lazy(() => import('../pages/auth/GoogleCallbackPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const SchedulesPage = lazy(() => import('../pages/management/SchedulesPage'));
const ScheduleDetailPage = lazy(() => import('../pages/management/ScheduleDetailPage'));
const QuestionBankPage = lazy(() => import('../pages/management/QuestionBankPage'));
const QuestionBankSubjectPage = lazy(() => import('../pages/management/QuestionBankSubjectPage'));
const QuestionBankDetailPage = lazy(() => import('../pages/management/QuestionBankDetailPage'));
const StudentsPage = lazy(() => import('../pages/management/StudentsPage'));
const ProctorsPage = lazy(() => import('../pages/management/ProctorsPage'));
const UsersPage = lazy(() => import('../pages/management/UsersPage'));
const LobbyPage = lazy(() => import('../pages/management/LobbyPage'));
const ExamResultsPage = lazy(() => import('../pages/results/ExamResultsPage'));
const ReportsAnalyticsPage = lazy(() => import('../pages/results/ReportsAnalyticsPage'));
const EmailNotificationPage = lazy(() => import('../pages/results/EmailNotificationPage'));
const SettingsPage = lazy(() => import('../pages/system/SettingsPage'));
const LogsPage = lazy(() => import('../pages/system/LogsPage'));
const BackupPage = lazy(() => import('../pages/system/BackupPage'));
const ImportPage = lazy(() => import('../pages/system/ImportPage'));
const ProfileSettingsPage = lazy(() => import('../pages/profile/ProfileSettingsPage'));
const ChangePasswordPage = lazy(() => import('../pages/profile/ChangePasswordPage'));
const UserListPage = lazy(() => import('../pages/admin/UserListPage'));
const UserCreatePage = lazy(() => import('../pages/admin/UserCreatePage'));
const UserEditPage = lazy(() => import('../pages/admin/UserEditPage'));
const UserDetailPage = lazy(() => import('../pages/admin/UserDetailPage'));
const TestItemListPage = lazy(() => import('../pages/test-items/TestItemListPage'));
const TestItemCreatePage = lazy(() => import('../pages/test-items/TestItemCreatePage'));
const TestItemEditPage = lazy(() => import('../pages/test-items/TestItemEditPage'));
const TestItemDetailPage = lazy(() => import('../pages/test-items/TestItemDetailPage'));
const NotAuthorizedPage = lazy(() => import('../pages/errors/NotAuthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'));

function PageFallback() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
      <Spinner />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <PreferencesProvider>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
              <Route path="/403" element={<NotAuthorizedPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/management" element={<Navigate to="/management/schedules" replace />} />
                  <Route path="/management/schedules" element={<SchedulesPage />} />
                  <Route path="/management/schedules/:id" element={<ScheduleDetailPage />} />
                  <Route path="/management/question-bank" element={<QuestionBankPage />} />
                  <Route path="/management/question-bank/subjects/:subjectId" element={<Navigate to="/management/question-bank" replace />} />
                  <Route path="/management/question-bank/subjects/:subjectId/banks/:bankId" element={<Navigate to="/management/question-bank" replace />} />
                  <Route path="/management/question-bank/:bankId/subjects/:subjectId" element={<QuestionBankDetailPage />} />
                  <Route path="/management/question-bank/:bankId" element={<QuestionBankSubjectPage />} />
                  <Route path="/management/subjects" element={<Navigate to="/management/question-bank" replace />} />
                  <Route path="/management/subjects/:subjectId" element={<Navigate to="/management/question-bank" replace />} />
                  <Route path="/management/students" element={<StudentsPage />} />
                  <Route path="/management/proctors" element={<ProctorsPage />} />
                  <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
                    <Route path="/management/users" element={<UsersPage />} />
                  </Route>
                  <Route path="/management/lobby" element={<LobbyPage />} />
                  <Route path="/results" element={<Navigate to="/results/exam-results" replace />} />
                  <Route path="/results/exam-results" element={<ExamResultsPage />} />
                  <Route path="/results/reports-analytics" element={<ReportsAnalyticsPage />} />
                  <Route path="/results/email-notification" element={<EmailNotificationPage />} />
                  <Route path="/system" element={<Navigate to="/system/settings" replace />} />
                  <Route path="/system/settings" element={<SettingsPage />} />
                  <Route path="/system/logs" element={<LogsPage />} />
                  <Route path="/system/backup" element={<BackupPage />} />
                  <Route path="/system/import" element={<ImportPage />} />
                  <Route path="/profile" element={<ProfileSettingsPage />} />
                  <Route path="/profile/change-password" element={<ChangePasswordPage />} />
                  <Route path="/test-items" element={<TestItemListPage />} />
                  <Route path="/test-items/create" element={<TestItemCreatePage />} />
                  <Route path="/test-items/:id" element={<TestItemDetailPage />} />
                  <Route path="/test-items/:id/edit" element={<TestItemEditPage />} />

                  <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
                    <Route path="/admin/users" element={<UserListPage />} />
                    <Route path="/admin/users/create" element={<UserCreatePage />} />
                    <Route path="/admin/users/:id" element={<UserDetailPage />} />
                    <Route path="/admin/users/:id/edit" element={<UserEditPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </PreferencesProvider>
    </BrowserRouter>
  );
}
