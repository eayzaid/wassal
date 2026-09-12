import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layout & Guards
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { PublicRoute } from './PublicRoute';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { MemberDirectoryPage } from '../pages/admin/MemberDirectoryPage';
import { PendingApprovalsPage } from '../pages/admin/PendingApprovalsPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { NotFoundPage } from '../pages/NotFoundPage';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin/members' : '/profile'} replace />;
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
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/members" element={<MemberDirectoryPage />} />
            <Route path="/admin/pending" element={<PendingApprovalsPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
