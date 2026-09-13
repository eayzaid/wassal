import React, { useState } from 'react';
import { UserSummaryDto, Role } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { getAssignableRoles } from '../../utils/permissions';
import { formatRole } from '../../utils/formatters';
import { RoleBadge } from '../common/RoleBadge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ShieldCheck, Crown, AlertTriangle } from 'lucide-react';
import { PresidentialHandoverDialog } from './PresidentialHandoverDialog';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: UserSummaryDto | null;
  onSubmit: (targetId: number, newRole: Role) => Promise<void>;
}

export const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  member,
  onSubmit,
}) => {
  const { user: actor } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  if (!member) return null;

  const availableRoles = getAssignableRoles(actor, member);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    // Step 2 security gate: Handover requires an additional solemn confirmation prompt
    if (selectedRole === 'PRESIDENT') {
      setIsHandoverOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(member.id, selectedRole as Role);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPresidentSelection = selectedRole === 'PRESIDENT';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'attribution de rôle</DialogTitle>
            <DialogDescription>
              Membre: {member.firstName} {member.lastName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Rôle actuel</Label>
              <div>
                <RoleBadge role={member.role} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nouveau rôle à attribuer</Label>
              {availableRoles.length === 0 ? (
                <p className="text-xs text-wassal-wine bg-rose-50 p-2.5 rounded-md border border-rose-200">
                  Vous n'avez pas les autorisations requises pour modifier le rôle de ce membre ou aucun nouveau rôle n'est éligible.
                </p>
              ) : (
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val as Role)}
                >
                  <SelectTrigger className="h-11 sm:h-10">
                    <SelectValue placeholder="Sélectionnez un rôle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        <div className="flex items-center gap-2">
                          {r === 'PRESIDENT' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                          <span>{formatRole(r)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Critical warning if PRESIDENT role is selected (Step 1 Warning) */}
            {isPresidentSelection && (
              <Alert variant="destructive" className="bg-rose-50 border-rose-300 text-rose-900 py-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <AlertDescription className="text-xs leading-relaxed">
                  <strong>Avertissement : Passation de Présidence</strong>
                  <br />
                  Seul un unique Président peut diriger l'association. En lui attribuant ce rôle, vous céderez votre mandat et deviendrez <strong>Membre</strong>. Une étape de confirmation supplémentaire sera exigée.
                </AlertDescription>
              </Alert>
            )}

            {!isPresidentSelection && availableRoles.length > 0 && (
              <p className="text-[11px] text-wassal-slate bg-wassal-bg p-2.5 rounded-md border border-wassal-border leading-relaxed">
                Note: Les modifications de rôle sont appliquées immédiatement. L'utilisateur aura accès aux fonctions correspondantes lors de sa prochaine action.
              </p>
            )}

            <DialogFooter className="pt-3">
              <Button
                variant="outline"
                size="default"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 sm:h-9"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                size="default"
                isLoading={isSubmitting}
                disabled={!selectedRole || availableRoles.length === 0}
                className={`w-full sm:w-auto h-11 sm:h-9 gap-2 font-medium ${
                  isPresidentSelection
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : ''
                }`}
              >
                {isPresidentSelection ? (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>Continuer vers la passation...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Attribuer le rôle</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Step 2 Dedicated Confirmation Modal for Presidential Handover */}
      <PresidentialHandoverDialog
        isOpen={isHandoverOpen}
        onClose={() => setIsHandoverOpen(false)}
        targetMember={member}
        onConfirmHandover={async () => {
          await onSubmit(member.id, 'PRESIDENT');
          setIsHandoverOpen(false);
          onClose();
        }}
      />
    </>
  );
};
