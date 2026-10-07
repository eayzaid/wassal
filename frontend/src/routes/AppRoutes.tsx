import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layout & Guards
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { PublicRoute } from './PublicRoute';
import { PageLoadingFallback } from '../components/common/PageLoadingFallback';

// Route-level code-splitting (Lazy loaded pages)
const LoginPage = React.lazy(() =>
  import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = React.lazy(() =>
  import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = React.lazy(() =>
  import('../pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = React.lazy(() =>
  import('../pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const MemberDirectoryPage = React.lazy(() =>
  import('../pages/admin/MemberDirectoryPage').then((m) => ({ default: m.MemberDirectoryPage }))
);
const PendingApprovalsPage = React.lazy(() =>
  import('../pages/admin/PendingApprovalsPage').then((m) => ({ default: m.PendingApprovalsPage }))
);
const ProfilePage = React.lazy(() =>
  import('../pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const ProjectsListPage = React.lazy(() =>
  import('../pages/projects/ProjectsListPage').then((m) => ({ default: m.ProjectsListPage }))
);
const ProjectDetailPage = React.lazy(() =>
  import('../pages/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage }))
);
const TasksListPage = React.lazy(() =>
  import('../pages/tasks/TasksListPage').then((m) => ({ default: m.TasksListPage }))
);
const PostsFeedPage = React.lazy(() =>
  import('../pages/posts/PostsFeedPage').then((m) => ({ default: m.PostsFeedPage }))
);
const PostDetailPage = React.lazy(() =>
  import('../pages/posts/PostDetailPage').then((m) => ({ default: m.PostDetailPage }))
);
const LeaderboardPage = React.lazy(() =>
  import('../pages/leaderboard/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage }))
);
const NotFoundPage = React.lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

const RootRedirect: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to="/projects" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/tasks" element={<TasksListPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/posts" element={<PostsFeedPage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/members" element={<MemberDirectoryPage />} />
            <Route path="/admin/pending" element={<PendingApprovalsPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoadingFallback />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
};
