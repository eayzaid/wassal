import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usersApi } from '../../api/usersApi';
import { Users, UserCheck, User, FolderKanban, ListTodo } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const fetchPendingCount = async () => {
      try {
        const summary = await usersApi.getSummary();
        setPendingCount(summary.pending);
      } catch {
        // silent fail
      }
    };

    fetchPendingCount();
    // Poll every 30 seconds for pending approval notifications
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated) return null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-wassal-surface/95 backdrop-blur-md border-t border-wassal-border shadow-lg pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation principale mobile"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {/* Projects Tab */}
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-wassal-plum font-bold'
                : 'text-wassal-slate hover:text-wassal-plum'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-full transition-transform ${
                  isActive ? 'bg-wassal-green/20 scale-105' : ''
                }`}
              >
                <FolderKanban
                  className={`w-5 h-5 ${
                    isActive ? 'text-wassal-green-ink' : 'text-wassal-slate'
                  }`}
                />
              </div>
              <span className="truncate">Projets</span>
            </>
          )}
        </NavLink>

        {/* Tasks Tab */}
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-wassal-plum font-bold'
                : 'text-wassal-slate hover:text-wassal-plum'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-full transition-transform ${
                  isActive ? 'bg-wassal-plum/10 scale-105' : ''
                }`}
              >
                <ListTodo
                  className={`w-5 h-5 ${
                    isActive ? 'text-wassal-plum' : 'text-wassal-slate'
                  }`}
                />
              </div>
              <span className="truncate">Tâches</span>
            </>
          )}
        </NavLink>
        {isAdmin && (
          <>
            <NavLink
              to="/admin/members"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-wassal-plum font-bold'
                    : 'text-wassal-slate hover:text-wassal-plum'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-full transition-transform ${
                      isActive ? 'bg-wassal-plum/10 scale-105' : ''
                    }`}
                  >
                    <Users
                      className={`w-5 h-5 ${
                        isActive ? 'text-wassal-plum' : 'text-wassal-slate'
                      }`}
                    />
                  </div>
                  <span className="truncate">Membres</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/admin/pending"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 text-[10px] font-medium transition-colors relative ${
                  isActive
                    ? 'text-wassal-plum font-bold'
                    : 'text-wassal-slate hover:text-wassal-plum'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative p-1 rounded-full transition-transform ${
                      isActive ? 'bg-wassal-green/20 scale-105' : ''
                    }`}
                  >
                    <UserCheck
                      className={`w-5 h-5 ${
                        isActive ? 'text-wassal-green-ink' : 'text-wassal-slate'
                      }`}
                    />
                    {pendingCount > 0 && (
                      <span className="absolute -top-0.5 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-wassal-green text-wassal-plum text-[10px] font-extrabold flex items-center justify-center shadow-xs border border-white">
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}
                  </div>
                  <span className="truncate">Validations</span>
                </>
              )}
            </NavLink>
          </>
        )}

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-wassal-plum font-bold'
                : 'text-wassal-slate hover:text-wassal-plum'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1 rounded-full transition-transform ${
                  isActive ? 'bg-wassal-plum/10 scale-105' : ''
                }`}
              >
                <User
                  className={`w-5 h-5 ${
                    isActive ? 'text-wassal-plum' : 'text-wassal-slate'
                  }`}
                />
              </div>
              <span className="truncate">Mon Profil</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
