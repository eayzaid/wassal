import React, { useState } from 'react';
import { UserSummaryDto, Role } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { getAssignableRoles } from '../../utils/permissions';
import { formatRole } from '../../utils/formatters';
import { RoleBadge } from '../common/RoleBadge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
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
import { ShieldCheck } from 'lucide-react';

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

  if (!member) return null;

  const availableRoles = getAssignableRoles(actor, member);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      await onSubmit(member.id, selectedRole as Role);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
                      {formatRole(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {availableRoles.length > 0 && (
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
              className="w-full sm:w-auto h-11 sm:h-9 gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Attribuer le rôle</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
