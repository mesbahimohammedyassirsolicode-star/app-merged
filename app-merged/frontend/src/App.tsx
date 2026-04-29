import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import DashboardLayout from './layouts/DashboardLayout';
import { Loader2 } from 'lucide-react';
import type { User } from './types/auth';
import { resolveDashboardPath } from './lib/rbac';

// ── Performance: Code-split all pages via React.lazy ──────────────────────────
// Each page becomes a separate chunk loaded on-demand, reducing initial bundle
// by ~60-70%. Only the shell (DashboardLayout) is eagerly loaded.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AcademicYearsPage = lazy(() => import('./pages/academic/AcademicYearsPage'));
const FilieresPage = lazy(() => import('./pages/academic/FilieresPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'));
const ModulesPage = lazy(() => import('./pages/ModulesPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const SeanceRollCallPage = lazy(() => import('./pages/SeanceRollCallPage'));
const TakeAttendancePage = lazy(() => import('./pages/TakeAttendancePage'));
const EvaluationsPage = lazy(() => import('./pages/EvaluationsPage'));
const StagesPage = lazy(() => import('./pages/StagesPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ParentChildrenPage = lazy(() => import('./pages/parent/ParentChildrenPage'));
const ParentChildDetailPage = lazy(() => import('./pages/parent/ParentChildDetailPage'));
const AdminParentStagiaireLinkPage = lazy(() => import('./pages/admin/AdminParentStagiaireLinkPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const GroupAttendanceRiskPage = lazy(() => import('./pages/GroupAttendanceRiskPage'));
const TimetablePage = lazy(() => import('./pages/TimetablePage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const GroupPage = lazy(() => import('./pages/GroupPage'));
const CourseFilesPage = lazy(() => import('./pages/CourseFilesPage'));

/** Shared loading spinner for lazy-loaded page chunks */
function PageFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
    </div>
  );
}

/** Redirect to /login if not authenticated; shows spinner while auth is resolving. */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * FIXED: Role-based route guard. Redirects to /dashboard with a 403-style behaviour
 * when an authenticated user does not have the required role. Prevents users from
 * manually navigating to admin-only pages and seeing partial UI even though the API
 * would reject any data fetch.
 */
function RoleRoute({ children, roles }: { children: React.ReactNode; roles: User['role'][] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={resolveDashboardPath(user?.role)} replace />;
  }

  return <>{children}</>;
}

function DashboardHomeRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={resolveDashboardPath(user.role)} replace />;
}

function AttendanceEntryRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin' || user.role === 'directeur' || user.role === 'secretariat') {
    return <AttendancePage />;
  }

  if (user.role === 'teacher' || user.role === 'formateur') {
    return <TakeAttendancePage />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    // Performance: Suspense boundary for lazy-loaded page chunks
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* All routes below require authentication */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardHomeRoute />} />
        <Route path="/dashboard/admin" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat']}>
            <DashboardPage />
          </RoleRoute>
        } />
        <Route path="/dashboard/formateur" element={
          <RoleRoute roles={['teacher', 'formateur']}>
            <DashboardPage />
          </RoleRoute>
        } />
        <Route path="/dashboard/stagiaire" element={
          <RoleRoute roles={['student', 'stagiaire']}>
            <DashboardPage />
          </RoleRoute>
        } />
        <Route path="/dashboard/parent" element={
          <RoleRoute roles={['parent']}>
            <DashboardPage />
          </RoleRoute>
        } />
        <Route path="/" element={<DashboardHomeRoute />} />

        {/* FIXED: Admin-only routes now wrapped in RoleRoute to enforce frontend access control */}
        <Route path="/users" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat']}>
            <UsersPage />
          </RoleRoute>
        } />
        <Route path="/admin/parent-links" element={
          <RoleRoute roles={['admin']}>
            <AdminParentStagiaireLinkPage />
          </RoleRoute>
        } />
        <Route path="/academic/years" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat']}>
            <AcademicYearsPage />
          </RoleRoute>
        } />
        <Route path="/academic/filieres" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat']}>
            <FilieresPage />
          </RoleRoute>
        } />

        {/* General — accessible to all authenticated roles */}
        <Route
          path="/group"
          element={
            <RoleRoute roles={['student', 'stagiaire']}>
              <GroupPage />
            </RoleRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <RoleRoute roles={['admin', 'directeur', 'secretariat', 'teacher', 'formateur']}>
              <GroupsPage />
            </RoleRoute>
          }
        />
        <Route path="/groups/:id" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire']}>
            <GroupDetailPage />
          </RoleRoute>
        } />
        <Route path="/groups/:id/attendance-summary" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat', 'teacher', 'formateur']}>
            <GroupAttendanceRiskPage />
          </RoleRoute>
        } />
        <Route path="/timetable" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire']}>
            <TimetablePage />
          </RoleRoute>
        } />
        <Route path="/progress" element={
          <RoleRoute roles={['student', 'stagiaire']}>
            <ProgressPage />
          </RoleRoute>
        } />
        <Route path="/modules" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire']}>
            <ModulesPage />
          </RoleRoute>
        } />
        <Route
          path="/course-files"
          element={
            <RoleRoute roles={['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire', 'parent']}>
              <CourseFilesPage />
            </RoleRoute>
          }
        />
        <Route path="/attendance" element={<AttendanceEntryRoute />} />
        <Route path="/attendance/seances" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat', 'teacher', 'formateur']}>
            <AttendancePage />
          </RoleRoute>
        } />
        <Route path="/attendance/seances/:id" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat', 'teacher', 'formateur']}>
            <SeanceRollCallPage />
          </RoleRoute>
        } />
        <Route path="/evaluations" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire', 'parent']}>
            <EvaluationsPage />
          </RoleRoute>
        } />
        <Route path="/stages" element={
          <RoleRoute roles={['admin', 'directeur', 'secretariat', 'teacher', 'formateur']}>
            <StagesPage />
          </RoleRoute>
        } />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* FIXED: Parent-only routes wrapped in RoleRoute */}
        <Route path="/parent/children" element={
          <RoleRoute roles={['parent']}>
            <ParentChildrenPage />
          </RoleRoute>
        } />
        <Route path="/parent/children/:id" element={
          <RoleRoute roles={['parent']}>
            <ParentChildDetailPage />
          </RoleRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
    </Suspense>
  );
}
