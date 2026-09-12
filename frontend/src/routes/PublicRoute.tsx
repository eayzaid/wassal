import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-wassal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-wassal-plum/20 border-t-wassal-green rounded-full animate-spin" />
          <p className="text-xs font-semibold text-wassal-slate">Initialisation...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/members' : '/profile'} replace />;
  }

  return <Outlet />;
};
