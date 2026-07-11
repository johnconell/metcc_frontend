import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import GoogleCallbackPage from '../pages/auth/GoogleCallbackPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import SchedulesPage from '../pages/management/SchedulesPage';
import QuestionBankPage from '../pages/management/QuestionBankPage';
import StudentsPage from '../pages/management/StudentsPage';
import ProctorsPage from '../pages/management/ProctorsPage';
import UsersPage from '../pages/management/UsersPage';
import LobbyPage from '../pages/management/LobbyPage';
import ExamResultsPage from '../pages/results/ExamResultsPage';
import ReportsAnalyticsPage from '../pages/results/ReportsAnalyticsPage';
import EmailNotificationPage from '../pages/results/EmailNotificationPage';
import SettingsPage from '../pages/system/SettingsPage';
import LogsPage from '../pages/system/LogsPage';
import BackupPage from '../pages/system/BackupPage';
import ImportPage from '../pages/system/ImportPage';
import ProfileSettingsPage from '../pages/profile/ProfileSettingsPage';
import ChangePasswordPage from '../pages/profile/ChangePasswordPage';
import UserListPage from '../pages/admin/UserListPage';
import UserCreatePage from '../pages/admin/UserCreatePage';
import UserEditPage from '../pages/admin/UserEditPage';
import UserDetailPage from '../pages/admin/UserDetailPage';
import TestItemListPage from '../pages/test-items/TestItemListPage';
import TestItemCreatePage from '../pages/test-items/TestItemCreatePage';
import TestItemEditPage from '../pages/test-items/TestItemEditPage';
import TestItemDetailPage from '../pages/test-items/TestItemDetailPage';
import NotAuthorizedPage from '../pages/errors/NotAuthorizedPage';
import NotFoundPage from '../pages/errors/NotFoundPage';
import { ROLES } from '../utils/constants';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/403" element={<NotAuthorizedPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/management" element={<Navigate to="/management/schedules" replace />} />
              <Route path="/management/schedules" element={<SchedulesPage />} />
              <Route path="/management/question-bank" element={<QuestionBankPage />} />
              <Route path="/management/students" element={<StudentsPage />} />
              <Route path="/management/proctors" element={<ProctorsPage />} />
              <Route path="/management/users" element={<UsersPage />} />
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

              <Route element={<RoleRoute roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]} />}>
                <Route path="/admin/users" element={<UserListPage />} />
                <Route path="/admin/users/create" element={<UserCreatePage />} />
                <Route path="/admin/users/:id" element={<UserDetailPage />} />
                <Route path="/admin/users/:id/edit" element={<UserEditPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
