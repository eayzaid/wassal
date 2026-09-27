import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usersApi } from '../../api/usersApi';
import { RoleBadge } from '../common/RoleBadge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { PresidentDangerZoneModal } from '../admin/PresidentDangerZoneModal';
import {
  Users,
  UserCheck,
  User,
  LogOut,
  X,
  FolderKanban,
  ListTodo,
  Flame,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (!isAdmin) return;
    usersApi
      .getSummary()
      .then((res) => setPendingCount(res.pending))
      .catch(() => {});
  }, [isAdmin]);

  const isPresident = user?.role === 'PRESIDENT';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-wassal-sage-deep/30 text-white font-semibold border-l-4 border-wassal-green pl-2.5'
        : 'text-gray-300 hover:text-white hover:bg-white/5'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-wassal-plum text-white flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-wassal-green text-xl">
              W
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">
                WASSAL
              </h1>
              <p className="text-[10px] font-medium text-wassal-sage tracking-wider uppercase">
                Caravane El Hayat
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-gray-300 hover:text-white hover:bg-white/10"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Info Capsule */}
        <div className="p-4 mx-3 my-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border-white/20">
              <AvatarFallback className="bg-wassal-slate text-xs font-semibold text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-300 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="mt-2.5">
            <RoleBadge role={user?.role} size="sm" onDark />
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-wassal-sage">
            Activités & Missions
          </div>
          <NavLink to="/projects" className={navItemClasses} onClick={onClose}>
            <FolderKanban className="w-4 h-4 text-wassal-green" />
            <span>Projets & Initiatives</span>
          </NavLink>
          <NavLink to="/tasks" className={navItemClasses} onClick={onClose}>
            <ListTodo className="w-4 h-4 text-wassal-sage" />
            <span>Tâches & Collectes</span>
          </NavLink>

          {isAdmin && (
            <>
              <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-wassal-sage">
                Administration
              </div>
              <NavLink to="/admin/members" className={navItemClasses} onClick={onClose}>
                <Users className="w-4 h-4 text-wassal-sage" />
                <span>Annuaire des membres</span>
              </NavLink>
              <NavLink to="/admin/pending" className={navItemClasses} onClick={onClose}>
                <UserCheck className="w-4 h-4 text-wassal-green shrink-0" />
                <span className="flex-1">Validations en attente</span>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            </>
          )}

          <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-wassal-sage">
            Espace Membre
          </div>
          <NavLink to="/profile" className={navItemClasses} onClick={onClose}>
            <User className="w-4 h-4 text-wassal-sage" />
            <span>Mon Profil & Sécurité</span>
          </NavLink>

          {/* President Only: Danger Zone Handover */}
          {isPresident && (
            <>
              <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-rose-300">
                Gouvernance
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDangerZoneOpen(true);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-rose-300 hover:text-white hover:bg-rose-900/40 border border-rose-800/40 transition-colors"
              >
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Passation Présidence</span>
              </button>
            </>
          )}
        </nav>

        {/* Bottom logout */}
        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-300" />
            <span>Déconnexion</span>
          </Button>
        </div>
      </aside>

      {/* President Danger Zone Modal */}
      {isPresident && (
        <PresidentDangerZoneModal
          isOpen={isDangerZoneOpen}
          onClose={() => setIsDangerZoneOpen(false)}
        />
      )}
    </>
  );
};
