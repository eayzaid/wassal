import React, { useState, useEffect, useRef, useCallback } from 'react';
import { caravaneApi } from '../../api/caravaneApi';
import { usersApi } from '../../api/usersApi';
import { UserSummaryDto, CurrentEditionResponse } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../common/Input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Crown,
  AlertTriangle,
  Flame,
  Search,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react';

interface PresidentDangerZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PresidentDangerZoneModal: React.FC<PresidentDangerZoneModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [currentEdition, setCurrentEdition] = useState<number>(1);
  const [mode, setMode] = useState<'TRANSFER_ONLY' | 'INCREMENT_AND_TRANSFER'>('TRANSFER_ONLY');
  const [members, setMembers] = useState<UserSummaryDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UserSummaryDto | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load current edition ONLY when opened — do not fetch users initially
  useEffect(() => {
    if (!isOpen) return;

    const loadEdition = async () => {
      try {
        const editionRes: CurrentEditionResponse = await caravaneApi.getCurrentEdition();
        setCurrentEdition(editionRes.currentEdition);
      } catch {
        // default fallback
      }
    };

    loadEdition();
  }, [isOpen]);

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSelectedMember(null);
    setSearchQuery('');
    setMembers([]);
    setIsDebouncing(false);
    setIsLoadingMembers(false);
    setHasAcknowledged(false);
    setConfirmationPhrase('');
    setErrorMessage(null);
    setMode('TRANSFER_ONLY');
    onClose();
  };

  const isConfirmed =
    selectedMember !== null &&
    hasAcknowledged &&
    confirmationPhrase.trim().toUpperCase() === 'CONFIRMER';

  // Perform search call
  const performSearch = useCallback(
    async (query: string) => {
      setIsLoadingMembers(true);
      setErrorMessage(null);
      try {
        const res = await usersApi.listUsers({
          q: query,
          status: 'APPROVED',
          blocked: false,
          size: 20,
        });
        const list = (res.content || []).filter((u) => u.id !== user?.id);
        setMembers(list);
      } catch {
        setErrorMessage('Erreur lors de la recherche des membres éligibles.');
      } finally {
        setIsLoadingMembers(false);
      }
    },
    [user?.id]
  );

  // Debounced search handler (400ms idle delay)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setMembers([]);
      setIsDebouncing(false);
      setIsLoadingMembers(false);
      return;
    }

    setIsDebouncing(true);
    debounceTimerRef.current = setTimeout(() => {
      setIsDebouncing(false);
      performSearch(trimmed);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = searchQuery.trim();
      if (trimmed.length >= 2) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        setIsDebouncing(false);
        performSearch(trimmed);
      }
    }
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchQuery('');
    setMembers([]);
    setIsDebouncing(false);
    setIsLoadingMembers(false);
  };

  const handleExecute = async () => {
    if (!isConfirmed || !selectedMember) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = { newPresidentUserId: selectedMember.id };
      if (mode === 'INCREMENT_AND_TRANSFER') {
        await caravaneApi.incrementEditionAndTransfer(payload);
      } else {
        await caravaneApi.transferPresidency(payload);
      }
      handleClose();
      if (onSuccess) onSuccess();
      // Reload to reflect new roles across application
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          'Une erreur est survenue lors du transfert de présidence.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl border-rose-300 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 border border-rose-200">
              <Flame className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <DialogTitle className="text-rose-950 text-lg sm:text-xl font-heading flex items-center gap-2">
                Zone Critique : Passation de Présidence
              </DialogTitle>
              <DialogDescription className="text-xs text-rose-700">
                Action solennelle et irrévocable réservée au Président en exercice
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 pt-1">
          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMode('TRANSFER_ONLY')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'TRANSFER_ONLY'
                  ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-400/30'
                  : 'border-wassal-border bg-white hover:bg-wassal-bg'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-wassal-plum flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  Passation simple
                </span>
                {mode === 'TRANSFER_ONLY' && (
                  <CheckCircle2 className="w-4 h-4 text-rose-600" />
                )}
              </div>
              <p className="text-[11px] text-wassal-slate leading-snug">
                Transférer la présidence en conservant l'Édition actuelle ({currentEdition}).
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('INCREMENT_AND_TRANSFER')}
              className={`p-3 rounded-xl border text-left transition-all ${
                mode === 'INCREMENT_AND_TRANSFER'
                  ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-400/30'
                  : 'border-wassal-border bg-white hover:bg-wassal-bg'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-wassal-plum flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-rose-600" />
                  Nouvelle Édition
                </span>
                {mode === 'INCREMENT_AND_TRANSFER' && (
                  <CheckCircle2 className="w-4 h-4 text-rose-600" />
                )}
              </div>
              <p className="text-[11px] text-wassal-slate leading-snug">
                Clôturer l'Édition {currentEdition}, démarrer l'Édition {currentEdition + 1} et céder la présidence.
              </p>
            </button>
          </div>

          {/* Target Member Picker */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-wassal-plum">
              Sélectionner le futur Président de l'association *
            </Label>

            {selectedMember ? (
              <div className="p-3 rounded-xl border border-rose-300 bg-rose-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-rose-200">
                    <AvatarFallback className="bg-wassal-plum text-white font-bold text-xs">
                      {selectedMember.firstName[0]}
                      {selectedMember.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-wassal-plum">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </p>
                    <p className="text-xs text-wassal-slate">{selectedMember.email}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                  className="text-xs h-8 text-rose-700 hover:bg-rose-100 border-rose-200"
                >
                  Changer
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-wassal-slate" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tapez un nom, prénom ou email pour rechercher..."
                    className="w-full pl-9 pr-9 py-2 text-xs rounded-lg border border-wassal-border bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  {isDebouncing || isLoadingMembers ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600 absolute right-3 top-1/2 -translate-y-1/2" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-wassal-slate hover:text-rose-600"
                      title="Effacer la recherche"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>

                <div className="border border-wassal-border rounded-xl max-h-48 overflow-y-auto divide-y divide-wassal-border/50 bg-white">
                  {searchQuery.trim().length < 2 ? (
                    <div className="p-5 text-center text-xs text-wassal-slate space-y-1">
                      <Search className="w-5 h-5 mx-auto text-wassal-slate/50 mb-1" />
                      <p className="font-semibold text-wassal-plum">
                        Commencez la recherche
                      </p>
                      <p className="text-[11px] text-wassal-slate max-w-xs mx-auto">
                        Saisissez au moins 2 caractères pour rechercher un membre approuvé éligible à la présidence.
                      </p>
                    </div>
                  ) : isLoadingMembers || isDebouncing ? (
                    <div className="p-5 text-center text-xs text-wassal-slate flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      <span>Recherche des membres éligibles...</span>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="p-5 text-center text-xs text-wassal-slate">
                      Aucun membre approuvé ne correspond à "{searchQuery.trim()}".
                    </div>
                  ) : (
                    members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMember(m)}
                        className="w-full text-left p-2.5 hover:bg-rose-50/50 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-wassal-bg text-wassal-plum font-semibold">
                              {m.firstName[0]}
                              {m.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-semibold text-wassal-plum">
                              {m.firstName} {m.lastName}
                            </p>
                            <p className="text-[11px] text-wassal-slate">{m.email}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-wassal-slate" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Impact Alert */}
          <Alert variant="destructive" className="border-rose-300 bg-rose-50 text-rose-950">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <AlertDescription className="text-xs leading-relaxed">
              <strong>Conséquences immédiates :</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>
                  Votre compte sera instantanément rétrogradé au rôle de <strong>MEMBRE</strong>.
                </li>
                <li>
                  Le membre sélectionné recevra l'unique titre de <strong>PRÉSIDENT</strong>.
                </li>
                {mode === 'INCREMENT_AND_TRANSFER' && (
                  <li>
                    L'édition de Caravane El Hayat sera officiellement incrémentée à{' '}
                    <strong>l'Édition {currentEdition + 1}</strong>.
                  </li>
                )}
                <li>Cette opération est <strong>définitive et irréversible</strong>.</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-rose-200 bg-rose-50/50 cursor-pointer hover:bg-rose-50 transition-colors">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-xs font-medium text-rose-900 leading-snug">
              Je comprends et accepte les conséquences critiques de cette passation de gouvernance.
            </span>
          </label>

          {/* Typing confirmation */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-wassal-plum">
              Tapez <span className="font-mono font-bold text-rose-600">CONFIRMER</span> pour autoriser l'opération :
            </Label>
            <Input
              type="text"
              value={confirmationPhrase}
              onChange={(e) => setConfirmationPhrase(e.target.value)}
              placeholder="CONFIRMER"
              className="font-mono uppercase text-xs border-rose-300 focus:border-rose-500 focus:ring-rose-500"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-11 sm:h-9"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!isConfirmed || isSubmitting}
            isLoading={isSubmitting}
            onClick={handleExecute}
            className="w-full sm:w-auto h-11 sm:h-9 bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2"
          >
            <Crown className="w-4 h-4" />
            <span>
              {mode === 'INCREMENT_AND_TRANSFER'
                ? 'Avancer Édition & Transférer'
                : 'Céder la Présidence'}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
