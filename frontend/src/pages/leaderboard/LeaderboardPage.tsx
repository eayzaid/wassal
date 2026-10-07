import React, { useState, useEffect, useCallback } from 'react';
import { LeaderboardEntryDto } from '../../types';
import { leaderboardApi } from '../../api/leaderboardApi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { RoleBadge } from '../../components/common/RoleBadge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import {
  Trophy,
  Medal,
  Award,
  Download,
  Search,
  RefreshCw,
  Sparkles,
  Flame,
  Loader2,
  Crown,
  X,
} from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const toast = useToast();

  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [limit, setLimit] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await leaderboardApi.getLeaderboard({ limit });
      setEntries(data || []);
    } catch {
      toast.error('Impossible de charger le classement.');
    } finally {
      setIsLoading(false);
    }
  }, [limit, toast]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // CSV export is restricted to Admin tier (PRESIDENT, VICE_PRESIDENT, RH). Forbidden for MEMBER and TEAM_LEADER.
  const canExportCsv = isAdmin;

  const handleExportCsv = async () => {
    if (!canExportCsv) {
      toast.error("Vous n'êtes pas autorisé à télécharger ce fichier.");
      return;
    }
    setIsExporting(true);
    try {
      await leaderboardApi.downloadUsersPointsCsv();
      toast.success('Rapport des points téléchargé avec succès (CSV) !');
    } catch {
      toast.error("Échec du téléchargement du fichier des points.");
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered entries based on search
  const filteredEntries = entries.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      e.fullName.toLowerCase().includes(q) ||
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q)
    );
  });

  // Current user entry in leaderboard if exists
  const myEntry = entries.find((e) => e.userId === currentUser?.id);

  // Top 3 entries
  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];

  return (
    <div className="space-y-3 sm:space-y-5 max-w-5xl mx-auto pb-8 sm:pb-12 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Trophy className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Engagement</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-wassal-plum tracking-tight truncate">
            Classement des Bénévoles
          </h1>
          <p className="text-xs sm:text-sm text-wassal-slate mt-0.5 truncate">
            Tableau d'honneur et points d'action Caravane El Hayat
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="h-9 w-9 p-0 text-wassal-slate hover:text-wassal-plum rounded-xl border-wassal-border shrink-0"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {canExportCsv && (
            <Button
              variant="default"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="h-9 px-3 gap-1.5 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-bold shadow-sm rounded-xl text-xs shrink-0"
              title="Télécharger l'export CSV complet des points"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Exporter (CSV)</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          )}
        </div>
      </div>

      {/* Current User Rank Capsule if available */}
      {myEntry && (
        <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-wassal-plum via-wassal-plum/95 to-wassal-wine text-white shadow-xs flex items-center justify-between gap-3 w-full min-w-0 border border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-wassal-green/20 border border-wassal-green/40 flex items-center justify-center font-extrabold text-wassal-green text-sm shrink-0">
              #{myEntry.rank}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-wassal-sage">
                  Votre Position
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-wassal-green/20 text-wassal-green font-bold">
                  Actif
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {myEntry.fullName}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-gray-300 block">Total cumulé</span>
            <span className="text-sm sm:text-base font-extrabold text-wassal-green tabular-nums">
              {myEntry.points}{' '}
              <span className="text-[10px] font-semibold text-gray-300">pts</span>
            </span>
          </div>
        </div>
      )}

      {/* Top 3 Visual Podium (Compact, No giant cards) */}
      {!isLoading && entries.length >= 3 && !searchQuery && (
        <div className="bg-white rounded-2xl border border-wassal-border p-3 sm:p-4 shadow-2xs w-full min-w-0">
          <div className="grid grid-cols-3 gap-2 items-end text-center">
            {/* Rank 2 (Silver) */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-200/80 min-w-0">
              <span className="text-[11px] font-black text-slate-600 flex items-center gap-0.5 mb-1.5">
                <Medal className="w-3.5 h-3.5 text-slate-500" />
                <span>#2</span>
              </span>
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-slate-300 mb-1.5 shadow-2xs">
                <AvatarFallback className="bg-slate-700 text-white font-bold text-xs">
                  {top2.firstName[0]}{top2.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-xs text-wassal-plum truncate w-full">
                {top2.fullName}
              </p>
              <div className="hidden sm:block mt-0.5">
                <RoleBadge role={top2.role} size="sm" />
              </div>
              <span className="mt-1 text-xs font-extrabold text-slate-700 tabular-nums">
                {top2.points} <span className="text-[10px] font-medium text-slate-500">pts</span>
              </span>
            </div>

            {/* Rank 1 (Gold - Center & Elevated) */}
            <div className="flex flex-col items-center p-2.5 sm:p-3 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/40 border-2 border-amber-300 min-w-0 relative -translate-y-1 shadow-xs">
              <span className="text-[11px] font-black text-amber-700 flex items-center gap-0.5 mb-1">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>#1</span>
              </span>
              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-amber-400 mb-1.5 shadow-2xs ring-2 ring-amber-300/40">
                <AvatarFallback className="bg-amber-600 text-white font-extrabold text-sm">
                  {top1.firstName[0]}{top1.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <p className="font-black text-xs sm:text-sm text-wassal-plum truncate w-full">
                {top1.fullName}
              </p>
              <div className="hidden sm:block mt-0.5">
                <RoleBadge role={top1.role} size="sm" />
              </div>
              <span className="mt-1 text-xs sm:text-sm font-black text-amber-700 tabular-nums flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {top1.points} <span className="text-[10px] font-semibold text-amber-600">pts</span>
              </span>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="flex flex-col items-center p-2 rounded-xl bg-amber-50/50 border border-amber-200 min-w-0">
              <span className="text-[11px] font-black text-amber-800 flex items-center gap-0.5 mb-1.5">
                <Award className="w-3.5 h-3.5 text-amber-700" />
                <span>#3</span>
              </span>
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-amber-200 mb-1.5 shadow-2xs">
                <AvatarFallback className="bg-amber-800 text-white font-bold text-xs">
                  {top3.firstName[0]}{top3.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-xs text-wassal-plum truncate w-full">
                {top3.fullName}
              </p>
              <div className="hidden sm:block mt-0.5">
                <RoleBadge role={top3.role} size="sm" />
              </div>
              <span className="mt-1 text-xs font-extrabold text-amber-800 tabular-nums">
                {top3.points} <span className="text-[10px] font-medium text-amber-700">pts</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Limit Toolbar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-wassal-border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full min-w-0">
        {/* Search */}
        <div className="relative flex-1 w-full min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-wassal-slate/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un membre par nom ou rôle..."
            className="w-full pl-9 pr-8 h-9 text-xs sm:text-sm rounded-xl border border-wassal-border bg-wassal-bg/40 focus:outline-none focus:ring-1 focus:ring-wassal-green focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-wassal-slate hover:text-wassal-plum p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Limit Chips */}
        <div className="flex items-center gap-1 bg-wassal-bg/80 p-1 rounded-xl border border-wassal-border self-start sm:self-auto shrink-0">
          <span className="text-[11px] font-semibold text-wassal-slate px-1.5">
            Afficher :
          </span>
          {[20, 50, 100].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setLimit(val)}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                limit === val
                  ? 'bg-white text-wassal-plum shadow-2xs'
                  : 'text-wassal-slate hover:text-wassal-plum'
              }`}
            >
              Top {val}
            </button>
          ))}
        </div>
      </div>

      {/* Main Leaderboard: Mobile List + Desktop Table */}
      <div className="bg-white rounded-2xl border border-wassal-border shadow-2xs overflow-hidden w-full min-w-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-wassal-slate space-y-2.5">
            <Loader2 className="w-7 h-7 animate-spin text-wassal-green-ink" />
            <p className="text-xs font-medium">Chargement du classement...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-wassal-plum/5 text-wassal-plum flex items-center justify-center mx-auto">
              <Trophy className="w-5 h-5 text-wassal-slate/60" />
            </div>
            <h3 className="text-sm font-bold text-wassal-plum">Aucun résultat</h3>
            <p className="text-xs text-wassal-slate max-w-sm mx-auto">
              {searchQuery
                ? `Aucun membre ne correspond à "${searchQuery}".`
                : "Le classement est actuellement vide."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Compact Volunteer Row List (< sm) */}
            <div className="sm:hidden divide-y divide-wassal-border/50">
              {filteredEntries.map((entry) => {
                const isCurrent = entry.userId === currentUser?.id;
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;

                return (
                  <div
                    key={entry.userId}
                    className={`p-3 flex items-center justify-between gap-2.5 transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50/50'
                        : 'hover:bg-wassal-bg/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Rank Medal or Number */}
                      <div className="w-6 text-center shrink-0">
                        {isTop1 ? (
                          <span className="text-sm">🥇</span>
                        ) : isTop2 ? (
                          <span className="text-sm">🥈</span>
                        ) : isTop3 ? (
                          <span className="text-sm">🥉</span>
                        ) : (
                          <span className="text-xs font-bold text-wassal-slate/70 tabular-nums">
                            #{entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-8 h-8 border border-wassal-border shrink-0">
                        <AvatarFallback className="bg-wassal-plum/10 text-wassal-plum font-bold text-xs">
                          {entry.firstName[0]}{entry.lastName[0]}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name & Role */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-wassal-plum truncate">
                            {entry.fullName}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-wassal-green/20 text-wassal-green-ink shrink-0">
                              Vous
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5">
                          <RoleBadge role={entry.role} size="sm" />
                        </div>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-wassal-bg border border-wassal-border text-xs font-bold text-wassal-plum tabular-nums">
                        <Flame className="w-3 h-3 text-amber-500" />
                        <span>{entry.points}</span>
                        <span className="text-[10px] font-normal text-wassal-slate">pts</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Table (≥ sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-wassal-bg/80 border-b border-wassal-border text-[11px] font-bold uppercase tracking-wider text-wassal-slate">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Rang</th>
                    <th className="py-3 px-4">Bénévole</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4 text-right">Points Gagnés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wassal-border/60">
                  {filteredEntries.map((entry) => {
                    const isCurrent = entry.userId === currentUser?.id;
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;

                    return (
                      <tr
                        key={entry.userId}
                        className={`transition-colors ${
                          isCurrent
                            ? 'bg-emerald-50/50 hover:bg-emerald-50/70 font-semibold'
                            : 'hover:bg-wassal-bg/50'
                        }`}
                      >
                        {/* Rank Column */}
                        <td className="py-3.5 px-4 text-center">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs shadow-2xs">
                              🥇
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs shadow-2xs">
                              🥈
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100/70 text-amber-900 font-extrabold text-xs shadow-2xs">
                              🥉
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-wassal-slate/80 tabular-nums">
                              #{entry.rank}
                            </span>
                          )}
                        </td>

                        {/* Volunteer Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 border border-wassal-border shrink-0">
                              <AvatarFallback className="bg-wassal-plum/10 text-wassal-plum font-bold text-xs">
                                {entry.firstName[0]}
                                {entry.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-wassal-plum truncate">
                                  {entry.fullName}
                                </span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-wassal-green/20 text-wassal-green-ink">
                                    Vous
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <RoleBadge role={entry.role} size="sm" />
                        </td>

                        {/* Points */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-wassal-bg border border-wassal-border font-bold text-wassal-plum tabular-nums">
                            <Flame className="w-3.5 h-3.5 text-amber-500" />
                            <span>{entry.points}</span>
                            <span className="text-[11px] font-normal text-wassal-slate">
                              pts
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
