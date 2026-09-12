import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-wassal-surface border-b border-wassal-border flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden text-wassal-slate hover:text-wassal-plum"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="hidden sm:block">
          <p className="text-xs text-wassal-slate font-medium">Plateforme d'administration</p>
          <p className="text-sm font-bold text-wassal-plum leading-tight">Association Caravane El Hayat</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <StatusBadge status={user?.accountStatus} blocked={user?.blocked} size="sm" />
        <Separator orientation="vertical" className="h-6 hidden sm:block" />
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-wassal-plum">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-wassal-slate">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
