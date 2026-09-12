import React, { useState, useEffect, useRef } from 'react';
import { UserFilterParams, Role, AccountStatus } from '../../types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  Ban,
  Users,
} from 'lucide-react';

interface MemberFiltersProps {
  filters: UserFilterParams;
  onChange: (newFilters: UserFilterParams) => void;
  onReset: () => void;
  counts?: {
    total: number;
    approved: number;
    pending: number;
    blocked: number;
  };
}

export const MemberFilters: React.FC<MemberFiltersProps> = ({
  filters,
  onChange,
  onReset,
  counts,
}) => {
  // Local immediate search input state
  const [localSearch, setLocalSearch] = useState(filters.q || '');
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep localSearch in sync if filters.q is reset or changed externally
  useEffect(() => {
    setLocalSearch(filters.q || '');
  }, [filters.q]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    setIsDebouncing(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 400ms debounce: gives the user adequate time to finalize input before firing API request
    debounceTimerRef.current = setTimeout(() => {
      setIsDebouncing(false);
      onChange({ ...filters, q: value.trim(), page: 0 });
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setIsDebouncing(false);
      onChange({ ...filters, q: localSearch.trim(), page: 0 });
    }
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalSearch('');
    setIsDebouncing(false);
    onChange({ ...filters, q: '', page: 0 });
  };

  // Count active non-query filters to show on the mobile toggle button
  const advancedFilterCount =
    (filters.status ? 1 : 0) +
    (filters.role ? 1 : 0) +
    (filters.blocked !== '' ? 1 : 0);

  const hasAnyActiveFilters =
    Boolean(filters.q) ||
    Boolean(filters.status) ||
    Boolean(filters.role) ||
    filters.blocked !== '';

  // Quick preset pills handler
  const handleQuickPreset = (preset: 'ALL' | 'APPROVED' | 'PENDING' | 'BLOCKED') => {
    switch (preset) {
      case 'ALL':
        onChange({ ...filters, status: '', blocked: '', page: 0 });
        break;
      case 'APPROVED':
        onChange({ ...filters, status: 'APPROVED', blocked: false, page: 0 });
        break;
      case 'PENDING':
        onChange({ ...filters, status: 'PENDING_APPROVAL', blocked: '', page: 0 });
        break;
      case 'BLOCKED':
        onChange({ ...filters, blocked: true, status: '', page: 0 });
        break;
    }
  };

  const isPresetActive = (preset: 'ALL' | 'APPROVED' | 'PENDING' | 'BLOCKED') => {
    if (preset === 'ALL') {
      return !filters.status && filters.blocked === '';
    }
    if (preset === 'APPROVED') {
      return filters.status === 'APPROVED' && filters.blocked === false;
    }
    if (preset === 'PENDING') {
      return filters.status === 'PENDING_APPROVAL';
    }
    if (preset === 'BLOCKED') {
      return filters.blocked === true;
    }
    return false;
  };

  return (
    <Card className="shadow-xs border-wassal-border mb-5">
      <CardContent className="p-3 sm:p-4">
        {/* Search Bar & Mobile Filter Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-wassal-slate absolute left-3 pointer-events-none" />
            <Input
              id="search-input"
              type="text"
              placeholder="Rechercher par nom, email..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-9 h-11 sm:h-10 text-base sm:text-sm bg-wassal-surface"
              autoComplete="off"
            />
            {/* Status indicator / Clear button */}
            <div className="absolute right-2.5 flex items-center gap-1">
              {isDebouncing && (
                <Loader2 className="w-3.5 h-3.5 text-wassal-slate animate-spin" />
              )}
              {localSearch && !isDebouncing && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 rounded-full text-wassal-slate hover:text-wassal-plum hover:bg-gray-100 transition-colors"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Toggle for Advanced Filters on Mobile */}
          <Button
            variant={advancedFilterCount > 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsAdvancedOpen((prev) => !prev)}
            className="lg:hidden h-11 px-3 shrink-0 gap-1.5"
            aria-label="Afficher ou masquer les filtres avancés"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs font-semibold">Filtres</span>
            {advancedFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-wassal-plum text-white text-[10px] flex items-center justify-center font-bold">
                {advancedFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* 1-Tap Quick Filter Chips (Horizontal Touch Scroll on Mobile) */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <button
            type="button"
            onClick={() => handleQuickPreset('ALL')}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isPresetActive('ALL')
                ? 'bg-wassal-plum text-white border-wassal-plum shadow-xs'
                : 'bg-wassal-surface text-wassal-slate border-wassal-border hover:bg-gray-50'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Tous</span>
            {counts && <span className="opacity-80 font-mono text-[11px]">({counts.total})</span>}
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset('APPROVED')}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isPresetActive('APPROVED')
                ? 'bg-wassal-green text-wassal-plum border-wassal-green font-semibold shadow-xs'
                : 'bg-wassal-surface text-wassal-slate border-wassal-border hover:bg-gray-50'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-wassal-green-ink" />
            <span>Actifs</span>
            {counts && <span className="opacity-80 font-mono text-[11px]">({counts.approved})</span>}
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset('PENDING')}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isPresetActive('PENDING')
                ? 'bg-wassal-slate text-white border-wassal-slate shadow-xs'
                : 'bg-wassal-surface text-wassal-slate border-wassal-border hover:bg-gray-50'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-500" />
            <span>En attente</span>
            {counts && <span className="opacity-80 font-mono text-[11px]">({counts.pending})</span>}
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset('BLOCKED')}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isPresetActive('BLOCKED')
                ? 'bg-wassal-wine text-white border-wassal-wine shadow-xs'
                : 'bg-wassal-surface text-wassal-slate border-wassal-border hover:bg-gray-50'
            }`}
          >
            <Ban className="w-3 h-3 text-rose-400" />
            <span>Bloqués</span>
            {counts && <span className="opacity-80 font-mono text-[11px]">({counts.blocked})</span>}
          </button>
        </div>

        {/* Detailed Dropdown Filters (Collapsible on Mobile, Grid on Desktop) */}
        <div
          className={`mt-3 pt-3 border-t border-wassal-border ${
            isAdvancedOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Statut d'adhésion</Label>
              <Select
                value={filters.status || 'ALL'}
                onValueChange={(val) =>
                  onChange({
                    ...filters,
                    status: val === 'ALL' ? '' : (val as AccountStatus),
                    page: 0,
                  })
                }
              >
                <SelectTrigger className="h-11 sm:h-9">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="APPROVED">Actif / Validé</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">En attente de validation</SelectItem>
                  <SelectItem value="REJECTED">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Rôle attribué</Label>
              <Select
                value={filters.role || 'ALL'}
                onValueChange={(val) =>
                  onChange({
                    ...filters,
                    role: val === 'ALL' ? '' : (val as Role),
                    page: 0,
                  })
                }
              >
                <SelectTrigger className="h-11 sm:h-9">
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les rôles</SelectItem>
                  <SelectItem value="PRESIDENT">Président</SelectItem>
                  <SelectItem value="VICE_PRESIDENT">Vice-Président</SelectItem>
                  <SelectItem value="RH">Ressources Humaines</SelectItem>
                  <SelectItem value="TEAM_LEADER">Responsable d'équipe</SelectItem>
                  <SelectItem value="MEMBER">Membre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Blocked Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">État de suspension</Label>
              <Select
                value={filters.blocked === '' ? 'ALL' : filters.blocked ? 'BLOCKED' : 'ACTIVE'}
                onValueChange={(val) => {
                  onChange({
                    ...filters,
                    blocked: val === 'ALL' ? '' : val === 'BLOCKED',
                    page: 0,
                  });
                }}
              >
                <SelectTrigger className="h-11 sm:h-9">
                  <SelectValue placeholder="Tous les états" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les états</SelectItem>
                  <SelectItem value="ACTIVE">Actif (Non bloqué)</SelectItem>
                  <SelectItem value="BLOCKED">Suspendu (Bloqué)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Reset Active Filters Bar */}
        {hasAnyActiveFilters && (
          <div className="mt-3 pt-2.5 border-t border-wassal-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-wassal-slate">
              <span>Filtres actifs</span>
              <Badge variant="outline" className="text-[11px] h-5 px-1.5">
                {[
                  filters.q && `"${filters.q}"`,
                  filters.status && filters.status,
                  filters.role && filters.role,
                  filters.blocked !== '' && (filters.blocked ? 'Bloqué' : 'Non bloqué'),
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalSearch('');
                onReset();
              }}
              className="text-xs text-wassal-slate hover:text-wassal-plum gap-1 h-7 px-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
