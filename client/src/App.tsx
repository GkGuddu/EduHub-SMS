import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/Layout';
import { AcademicsPage } from './pages/AcademicsPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AttendancePage } from './pages/AttendancePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { CommunicationPage } from './pages/CommunicationPage';
import {
  DashboardPage,
  AdminDashboardPage,
  TeacherDashboardPage,
  StudentDashboardPage,
  ParentDashboardPage,
} from './pages/DashboardPage';
import { ExamsPage } from './pages/ExamsPage';
import { FeesPage } from './pages/FeesPage';
import {
  LoginPage,
  ForgotPasswordPage,
  VerifyResetOtpPage,
  ResetPasswordPage,
  VerifyOtpPage,
  RegisterSchoolPage,
} from './pages/LoginPage';
import { HomeworkPage } from './pages/HomeworkPage';
import { NotFoundPage } from './components/common';
import { NoticesPage } from './pages/NoticesPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { ReportsPage } from './pages/ReportsPage';
import { RolesPermissionsPage } from './pages/RolesPermissionsPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudyMaterialsPage } from './pages/StudyMaterialsPage';
import { TeachersPage } from './pages/TeachersPage';
import { TimetablePage } from './pages/TimetablePage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicLayout } from './components/PublicLayout';
import { LandingPage } from './pages/public/LandingPage';
import {
  AboutPage,
  ContactPage,
  FeaturesPage,
  SolutionsPage,
} from './pages/public/MarketingPages';
import { BlogPage, BlogPostPage } from './pages/public/BlogPage';
import { ForceChangePasswordScreen } from './components/ForceChangePasswordModal';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@eduhub/shared';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-semibold text-slate-500">
          Checking session credentials...
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <ForceChangePasswordScreen />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <span className="text-xs font-semibold text-slate-500">
          Connecting to EduHub...
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'teacher':
      return <Navigate to="/teacher/dashboard" replace />;
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    case 'parent':
      return <Navigate to="/parent/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-school" element={<RegisterSchoolPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="classes" element={<Navigate to="/admin/subjects" replace />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="communication" element={<CommunicationPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
        <Route path="roles" element={<RolesPermissionsPage />} />
        <Route path="subjects" element={<AcademicsPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="materials" element={<StudyMaterialsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="classes" element={<AcademicsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="materials" element={<StudyMaterialsPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="communication" element={<CommunicationPage />} />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
      </Route>
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="materials" element={<StudyMaterialsPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="communication" element={<CommunicationPage />} />
        <Route path="report-card" element={<ExamsPage />} />
        <Route path="progress" element={<ExamsPage />} />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
      </Route>
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/parent/dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboardPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="fees" element={<FeesPage />} />
        <Route path="exams" element={<ExamsPage />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="results" element={<ExamsPage />} />
        <Route path="communication" element={<CommunicationPage />} />
        <Route path="notices" element={<NoticesPage />} />
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
      <Route path="/dashboard" element={<RootRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
