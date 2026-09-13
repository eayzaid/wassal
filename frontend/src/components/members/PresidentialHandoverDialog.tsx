import React, { useState } from 'react';
import { UserSummaryDto } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../common/Input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Crown, AlertTriangle, ShieldAlert } from 'lucide-react';

interface PresidentialHandoverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetMember: UserSummaryDto | null;
  onConfirmHandover: () => Promise<void>;
}

export const PresidentialHandoverDialog: React.FC<PresidentialHandoverDialogProps> = ({
  isOpen,
  onClose,
  targetMember,
  onConfirmHandover,
}) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!targetMember) return null;

  const isConfirmed = hasAcknowledged && confirmationPhrase.trim().toUpperCase() === 'CONFIRMER';

  const handleExecute = async () => {
    if (!isConfirmed) return;
    setIsSubmitting(true);
    try {
      await onConfirmHandover();
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setHasAcknowledged(false);
    setConfirmationPhrase('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg border-rose-200">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <DialogTitle className="text-rose-900 text-lg sm:text-xl font-heading">
                Passation solennelle de la Présidence
              </DialogTitle>
              <DialogDescription className="text-xs text-rose-700">
                Action critique : Règle d'unicité présidentielle de Caravane El Hayat
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Target User Card */}
          <div className="p-3.5 rounded-xl border border-wassal-border bg-wassal-bg/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-wassal-border">
                <AvatarFallback className="bg-wassal-plum text-white font-bold text-xs">
                  {targetMember.firstName[0]}
                  {targetMember.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-wassal-plum leading-tight">
                  {targetMember.firstName} {targetMember.lastName}
                </p>
                <p className="text-xs text-wassal-slate">{targetMember.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Futur Président</span>
            </div>
          </div>

          {/* Solemn Warning Alert */}
          <Alert variant="destructive" className="border-rose-300 bg-rose-50 text-rose-900">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <AlertDescription className="text-xs leading-relaxed">
              <strong>Attention absolue :</strong> Il ne peut exister qu'<strong>un seul et unique Président</strong> dans l'ensemble de l'association. En validant ce transfert :
              <ul className="list-disc pl-4 mt-1.5 space-y-1">
                <li>Vous serez <strong>immédiatement déchu</strong> de vos fonctions de Président.</li>
                <li>Votre compte redeviendra <strong>Membre</strong> standard.</li>
                <li>Vous perdrez tous vos privilèges de gouvernance et ne pourrez plus annuler cette opération.</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Step 1: Formal Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-rose-200 bg-rose-50/50 cursor-pointer hover:bg-rose-50 transition-colors">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-xs font-medium text-rose-900 leading-snug">
              Je confirme céder immédiatement et irrévocablement mes fonctions de Président à{' '}
              <strong>{targetMember.firstName} {targetMember.lastName}</strong>.
            </span>
          </label>

          {/* Step 2: Typing Verification */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-wassal-plum">
              Pour déverrouiller l'action, saisissez le mot <span className="font-mono font-bold text-rose-600">CONFIRMER</span> ci-dessous :
            </Label>
            <Input
              type="text"
              value={confirmationPhrase}
              onChange={(e) => setConfirmationPhrase(e.target.value)}
              placeholder="Tapez CONFIRMER..."
              className="font-mono uppercase text-xs"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-11 sm:h-9"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="default"
            isLoading={isSubmitting}
            disabled={!isConfirmed || isSubmitting}
            onClick={handleExecute}
            className="w-full sm:w-auto h-11 sm:h-9 gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            <Crown className="w-4 h-4" />
            <span>Céder la Présidence</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
