import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usersApi } from '../../api/usersApi';
import { Users, UserCheck, User } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const fetchPendingCount = async () => {
      try {
        const res = await usersApi.listUsers({ status: 'PENDING_APPROVAL', size: 1 });
        const count = res.page?.totalElements ?? res.totalElements ?? 0;
        setPendingCount(count);
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
      <div className="flex items-center justify-around h-16 px-2">
        {isAdmin && (
          <>
            <NavLink
              to="/admin/members"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] font-medium transition-colors ${
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
                      isActive ? 'bg-wassal-plum/10 scale-110' : ''
                    }`}
                  >
                    <Users
                      className={`w-5 h-5 ${
                        isActive ? 'text-wassal-plum' : 'text-wassal-slate'
                      }`}
                    />
                  </div>
                  <span>Membres</span>
                </>
              )}
            </NavLink>

            <NavLink
              to="/admin/pending"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] font-medium transition-colors relative ${
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
                      isActive ? 'bg-wassal-green/20 scale-110' : ''
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
                  <span>Validations</span>
                </>
              )}
            </NavLink>
          </>
        )}

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] font-medium transition-colors ${
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
                  isActive ? 'bg-wassal-plum/10 scale-110' : ''
                }`}
              >
                <User
                  className={`w-5 h-5 ${
                    isActive ? 'text-wassal-plum' : 'text-wassal-slate'
                  }`}
                />
              </div>
              <span>Mon Profil</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};
