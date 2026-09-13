import React, { useState, useEffect } from 'react';
import { Menu, Trophy, CalendarDays } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { caravaneApi } from '../../api/caravaneApi';
import { StatusBadge } from '../common/StatusBadge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, isAuthenticated } = useAuth();
  const [edition, setEdition] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch Caravane edition
    caravaneApi
      .getCurrentEdition()
      .then((res) => setEdition(res.currentEdition))
      .catch(() => {});

    // Fetch user points summary
    if (user?.id) {
      caravaneApi
        .getPointsSummary(user.id)
        .then((res) => setTotalPoints(res.totalPoints))
        .catch(() => {});
    }
  }, [isAuthenticated, user?.id]);

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
          <p className="text-xs text-wassal-slate font-medium">Plateforme d'engagement</p>
          <p className="text-sm font-bold text-wassal-plum leading-tight">Association Caravane El Hayat</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Current Edition Badge */}
        {edition !== null && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-wassal-bg text-wassal-plum border border-wassal-border text-xs font-semibold">
            <CalendarDays className="w-3.5 h-3.5 text-wassal-slate" />
            <span>Édition {edition}</span>
          </div>
        )}

        {/* User Points Badge */}
        {totalPoints !== null && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-wassal-green/15 text-wassal-green-ink border border-wassal-green/30 text-xs font-bold shadow-xs">
            <Trophy className="w-3.5 h-3.5" />
            <span>{totalPoints} pts</span>
          </div>
        )}

        <StatusBadge status={user?.accountStatus} blocked={user?.blocked} size="sm" />
        <Separator orientation="vertical" className="h-6 hidden sm:block" />
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-wassal-bg text-wassal-plum font-bold">
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
