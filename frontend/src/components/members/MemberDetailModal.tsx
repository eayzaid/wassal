import React, { useState } from 'react';
import { UserSummaryDto, Role } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { canManageTarget } from '../../utils/permissions';
import { formatDateTime } from '../../utils/formatters';
import { Button } from '../ui/button';
import { StatusBadge } from '../common/StatusBadge';
import { RoleBadge } from '../common/RoleBadge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ChangeRoleModal } from './ChangeRoleModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  Check,
  X,
  Ban,
  Unlock,
  AlertCircle,
  IdCard,
} from 'lucide-react';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: UserSummaryDto | null;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onChangeRole: (id: number, newRole: Role) => Promise<void>;
  onBlock: (id: number) => Promise<void>;
  onUnblock: (id: number) => Promise<void>;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  onApprove,
  onReject,
  onChangeRole,
  onBlock,
  onUnblock,
}) => {
  const { user: actor } = useAuth();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    action: () => Promise<void>;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!member) return null;

  const managementCheck = canManageTarget(actor, member);
  const isPending = member.accountStatus === 'PENDING_APPROVAL';
  const isRejected = member.accountStatus === 'REJECTED';

  const handleExecuteConfirm = async () => {
    if (!confirmAction) return;
    setIsActionLoading(true);
    try {
      await confirmAction.action();
      setConfirmAction(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Fiche du membre</DialogTitle>
            <DialogDescription>
              ID #{member.id} • Caravane El Hayat
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Identity Header Card */}
            <Card className="shadow-xs border-wassal-border bg-wassal-bg/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <Avatar className="w-14 h-14 border-2 border-wassal-plum/20">
                    <AvatarFallback className="bg-wassal-plum text-white font-bold text-lg">
                      {member.firstName?.[0]}
                      {member.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-base font-bold text-wassal-plum">
                      {member.firstName} {member.lastName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <RoleBadge role={member.role} size="sm" />
                      <StatusBadge status={member.accountStatus} blocked={member.blocked} size="sm" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Grid */}
            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <Card className="shadow-xs border-wassal-border">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-wassal-slate mb-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Adresse email</span>
                  </div>
                  {member.email ? (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-sm font-medium text-wassal-green-ink hover:underline break-all block py-0.5"
                    >
                      {member.email}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">—</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xs border-wassal-border">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-wassal-slate mb-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Téléphone</span>
                  </div>
                  {member.phoneNumber ? (
                    <a
                      href={`tel:${member.phoneNumber}`}
                      className="text-sm font-medium text-wassal-ink hover:text-wassal-green-ink font-mono block py-0.5"
                    >
                      {member.phoneNumber}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">—</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xs border-wassal-border">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-wassal-slate mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Date d'inscription</span>
                  </div>
                  <p className="text-sm font-medium text-wassal-ink">
                    {formatDateTime(member.createdAt)}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-xs border-wassal-border">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-wassal-slate mb-1">
                    <IdCard className="w-3.5 h-3.5" />
                    <span>Statut du compte</span>
                  </div>
                  <p className="text-sm font-medium text-wassal-ink">
                    {member.blocked
                      ? 'Compte suspendu (accès révoqué)'
                      : member.accountStatus === 'APPROVED'
                      ? 'Compte actif et vérifié'
                      : member.accountStatus === 'PENDING_APPROVAL'
                      ? 'En attente de revue administrative'
                      : 'Demande refusée (Réintégration possible)'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Self action warning */}
            {!managementCheck.allowed && (
              <Alert variant="warning" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{managementCheck.reason}</AlertDescription>
              </Alert>
            )}

            {/* Operations & Action Buttons */}
            {managementCheck.allowed && (
              <div className="pt-2 space-y-2.5">
                <Separator />
                <h5 className="text-xs font-bold uppercase tracking-wider text-wassal-plum pt-1">
                  Opérations d'administration
                </h5>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
                  {/* Approve / Reject buttons if pending */}
                  {isPending && (
                    <>
                      <Button
                        size="default"
                        className="h-11 sm:h-9 w-full sm:w-auto gap-1.5"
                        onClick={() =>
                          setConfirmAction({
                            isOpen: true,
                            title: "Valider l'inscription",
                            message: `Êtes-vous sûr de vouloir approuver l'adhésion de ${member.firstName} ${member.lastName} ? Un email de confirmation sera transmis.`,
                            isDestructive: false,
                            action: () => onApprove(member.id),
                          })
                        }
                      >
                        <Check className="w-4 h-4" />
                        <span>Valider l'adhésion</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="default"
                        className="h-11 sm:h-9 w-full sm:w-auto gap-1.5"
                        onClick={() =>
                          setConfirmAction({
                            isOpen: true,
                            title: "Rejeter l'inscription",
                            message: `Êtes-vous sûr de vouloir refuser l'adhésion de ${member.firstName} ${member.lastName} ? Un email avec les coordonnées de contact lui sera envoyé. Le membre pourra être réintégré ultérieurement si nécessaire.`,
                            isDestructive: true,
                            action: () => onReject(member.id),
                          })
                        }
                      >
                        <X className="w-4 h-4" />
                        <span>Rejeter l'adhésion</span>
                      </Button>
                    </>
                  )}

                  {/* Re-accept button if rejected */}
                  {isRejected && (
                    <Button
                      size="default"
                      className="h-11 sm:h-9 w-full sm:w-auto gap-1.5"
                      onClick={() =>
                        setConfirmAction({
                          isOpen: true,
                          title: "Réintégrer le membre",
                          message: `Êtes-vous sûr de vouloir réintégrer et approuver l'adhésion de ${member.firstName} ${member.lastName} ? Un email de confirmation sera transmis.`,
                          isDestructive: false,
                          action: () => onApprove(member.id),
                        })
                      }
                    >
                      <Check className="w-4 h-4" />
                      <span>Réintégrer / Accepter</span>
                    </Button>
                  )}

                  {/* Change Role Button */}
                  <Button
                    variant="outline"
                    size="default"
                    className="h-11 sm:h-9 w-full sm:w-auto gap-1.5"
                    onClick={() => setIsRoleModalOpen(true)}
                  >
                    <Shield className="w-4 h-4 text-wassal-slate" />
                    <span>Attribuer un rôle</span>
                  </Button>

                  {/* Block / Unblock Button */}
                  {!member.blocked ? (
                    <Button
                      variant="outline"
                      size="default"
                      className="h-11 sm:h-9 w-full sm:w-auto border-wassal-wine/30 text-wassal-wine hover:bg-wassal-wine/10 gap-1.5"
                      onClick={() =>
                        setConfirmAction({
                          isOpen: true,
                          title: 'Bloquer ce compte',
                          message: `Suspendre le compte de ${member.firstName} ${member.lastName} révoquera instantanément toutes ses sessions actives. Le membre ne pourra plus se connecter.`,
                          isDestructive: true,
                          action: () => onBlock(member.id),
                        })
                      }
                    >
                      <Ban className="w-4 h-4 text-wassal-wine" />
                      <span>Bloquer l'accès</span>
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="default"
                      className="h-11 sm:h-9 w-full sm:w-auto gap-1.5"
                      onClick={() =>
                        setConfirmAction({
                          isOpen: true,
                          title: 'Débloquer ce compte',
                          message: `Rétablir l'accès au compte de ${member.firstName} ${member.lastName} lui permettra de se reconnecter immédiatement.`,
                          isDestructive: false,
                          action: () => onUnblock(member.id),
                        })
                      }
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Débloquer le compte</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3">
            <Button variant="outline" size="default" onClick={onClose} className="w-full sm:w-auto h-11 sm:h-9">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Modal */}
      <ChangeRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        member={member}
        onSubmit={onChangeRole}
      />

      {/* Confirmation Dialog */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={confirmAction.isOpen}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleExecuteConfirm}
          title={confirmAction.title}
          message={confirmAction.message}
          isDestructive={confirmAction.isDestructive}
          isLoading={isActionLoading}
        />
      )}
    </>
  );
};
