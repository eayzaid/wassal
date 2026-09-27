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
} from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
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

  const handleExportCsv = async () => {
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Gamification & Engagement
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-wassal-plum tracking-tight flex items-center gap-2">
            <span>Classement des Bénévoles</span>
          </h1>
          <p className="text-xs sm:text-sm text-wassal-slate mt-0.5">
            Tableau d'honneur valorisant les points accumulés lors des missions et collectes de Caravane El Hayat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="h-10 text-wassal-slate hover:text-wassal-plum"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="default"
            size="default"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="h-10 px-4 gap-2 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-bold shadow-sm rounded-xl transition-all"
            title="Télécharger l'export CSV complet des points"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Exporter les points (CSV)</span>
          </Button>
        </div>
      </div>

      {/* Current User Rank Capsule if available */}
      {myEntry && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-wassal-plum via-wassal-plum/95 to-wassal-plum text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-wassal-green/20 border border-wassal-green/40 flex items-center justify-center font-bold text-wassal-green text-xl shrink-0">
              #{myEntry.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-wassal-sage">
                  Votre Position
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-wassal-green/20 text-wassal-green font-bold">
                  Actif
                </span>
              </div>
              <p className="text-base font-bold text-white">
                {myEntry.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-center">
            <div className="text-right">
              <span className="text-[11px] text-gray-300 block">Total cumulé</span>
              <span className="text-xl font-extrabold text-wassal-green tabular-nums">
                {myEntry.points}{' '}
                <span className="text-xs font-semibold text-gray-300">pts</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Podium Top 3 Cards */}
      {!isLoading && entries.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-end">
          {/* Rank 2 (Silver) */}
          <div className="order-2 md:order-1 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white p-5 text-center shadow-xs flex flex-col items-center relative">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center mb-3 shadow-xs">
              <Medal className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 mb-2">
              Rang #2
            </span>
            <Avatar className="w-16 h-16 border-2 border-slate-300 mb-2">
              <AvatarFallback className="bg-slate-700 text-white font-bold text-base">
                {top2.firstName[0]}
                {top2.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-base text-wassal-plum truncate max-w-full">
              {top2.fullName}
            </h3>
            <div className="mt-1 mb-3">
              <RoleBadge role={top2.role} size="sm" />
            </div>
            <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-wassal-slate font-extrabold text-lg">
              <Flame className="w-4 h-4 text-slate-500" />
              <span>{top2.points}</span>
              <span className="text-xs font-medium text-wassal-slate/70">points</span>
            </div>
          </div>

          {/* Rank 1 (Gold - Elevated) */}
          <div className="order-1 md:order-2 rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/60 via-amber-50/20 to-white p-6 text-center shadow-md flex flex-col items-center relative -translate-y-1">
            <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-amber-500 text-white text-xs font-extrabold shadow-sm flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              <span>1ère Place</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center mt-2 mb-3 shadow-xs">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <Avatar className="w-20 h-20 border-4 border-amber-400 mb-2 shadow-sm">
              <AvatarFallback className="bg-amber-600 text-white font-extrabold text-xl">
                {top1.firstName[0]}
                {top1.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-extrabold text-lg text-wassal-plum truncate max-w-full">
              {top1.fullName}
            </h3>
            <div className="mt-1 mb-3">
              <RoleBadge role={top1.role} size="sm" />
            </div>
            <div className="w-full pt-3 border-t border-amber-100 flex items-center justify-center gap-1.5 text-amber-700 font-black text-2xl">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>{top1.points}</span>
              <span className="text-xs font-bold text-amber-600/80">points</span>
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="order-3 md:order-3 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/30 to-white p-5 text-center shadow-xs flex flex-col items-center relative">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center mb-3 shadow-xs">
              <Award className="w-5 h-5 text-amber-700" />
            </div>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 mb-2">
              Rang #3
            </span>
            <Avatar className="w-16 h-16 border-2 border-amber-200 mb-2">
              <AvatarFallback className="bg-amber-800 text-white font-bold text-base">
                {top3.firstName[0]}
                {top3.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-base text-wassal-plum truncate max-w-full">
              {top3.fullName}
            </h3>
            <div className="mt-1 mb-3">
              <RoleBadge role={top3.role} size="sm" />
            </div>
            <div className="w-full pt-3 border-t border-amber-100 flex items-center justify-center gap-1.5 text-amber-800 font-extrabold text-lg">
              <Flame className="w-4 h-4 text-amber-700" />
              <span>{top3.points}</span>
              <span className="text-xs font-medium text-amber-800/70">points</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Limit Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-wassal-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-wassal-slate/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un membre par nom ou rôle..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-wassal-border bg-wassal-bg/40 focus:outline-none focus:ring-1 focus:ring-wassal-green focus:bg-white transition-all"
          />
        </div>

        {/* Limit Chips */}
        <div className="flex items-center gap-1.5 bg-wassal-bg/80 p-1 rounded-xl border border-wassal-border self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-wassal-slate px-2">
            Afficher :
          </span>
          {[20, 50, 100].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setLimit(val)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                limit === val
                  ? 'bg-white text-wassal-plum shadow-xs'
                  : 'text-wassal-slate hover:text-wassal-plum'
              }`}
            >
              Top {val}
            </button>
          ))}
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-wassal-border shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-wassal-slate space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-wassal-green-ink" />
            <p className="text-sm font-medium">Chargement du classement...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-wassal-plum/5 text-wassal-plum flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-wassal-plum">Aucun résultat</h3>
            <p className="text-xs text-wassal-slate max-w-sm mx-auto">
              {searchQuery
                ? `Aucun membre ne correspond à "${searchQuery}".`
                : "Le classement est actuellement vide."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
        )}
      </div>
    </div>
  );
};
