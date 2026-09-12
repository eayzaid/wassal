import React, { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../../api/usersApi';
import { UserSummaryDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import {
  UserCheck,
  Check,
  X,
  Mail,
  Phone,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../types';

export const PendingApprovalsPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [pendingUsers, setPendingUsers] = useState<UserSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    action: () => Promise<void>;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchPendingUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.listUsers({
        status: 'PENDING_APPROVAL',
        size: 50,
        sort: 'createdAt,asc',
      });
      setPendingUsers(res.content);
    } catch {
      toast.error('Impossible de charger les demandes en attente.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleApprove = (user: UserSummaryDto) => {
    setConfirmDialog({
      isOpen: true,
      title: "Valider l'adhésion",
      message: `Approuver la demande de ${user.firstName} ${user.lastName} ? L'utilisateur aura le rôle MEMBRE et pourra se connecter immédiatement.`,
      isDestructive: false,
      action: async () => {
        try {
          await usersApi.approveUser(user.id);
          toast.success(`Compte validé pour ${user.firstName} ${user.lastName}`);
          fetchPendingUsers();
        } catch (err) {
          const error = err as AxiosError<ErrorResponse>;
          toast.error(error.response?.data?.message || 'Erreur lors de la validation.');
        }
      },
    });
  };

  const handleReject = (user: UserSummaryDto) => {
    setConfirmDialog({
      isOpen: true,
      title: "Refuser l'adhésion",
      message: `Refuser la demande de ${user.firstName} ${user.lastName} ? Cette action est irréversible et clôture la demande.`,
      isDestructive: true,
      action: async () => {
        try {
          await usersApi.rejectUser(user.id);
          toast.info(`Demande refusée pour ${user.firstName} ${user.lastName}`);
          fetchPendingUsers();
        } catch (err) {
          const error = err as AxiosError<ErrorResponse>;
          toast.error(error.response?.data?.message || 'Erreur lors du refus.');
        }
      },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsActionLoading(true);
    try {
      await confirmDialog.action();
      setConfirmDialog(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Validations en attente"
        subtitle="File de traitement des nouvelles inscriptions soumises par les bénévoles"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPendingUsers}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser la file</span>
          </Button>
        }
      />

      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-wassal-plum/20 border-t-wassal-green rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-wassal-slate">Chargement des dossiers...</p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <Card className="p-12 text-center max-w-lg mx-auto shadow-xs border-wassal-border">
          <CardContent className="p-0">
            <div className="w-14 h-14 rounded-2xl bg-wassal-green/20 text-wassal-green-ink flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-wassal-plum">
              Aucune demande en attente
            </h3>
            <p className="mt-2 text-sm text-wassal-slate leading-relaxed">
              Toutes les demandes d'inscription ont été traitées. Les nouveaux dossiers soumis apparaîtront automatiquement ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-wassal-slate">
              {pendingUsers.length} dossier(s) en attente d'arbitrage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map((applicant) => {
              const isSelf = currentUser?.id === applicant.id;

              return (
                <Card
                  key={applicant.id}
                  className="shadow-xs border-wassal-border hover:border-wassal-slate/40 transition-colors flex flex-col justify-between"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-wassal-border">
                            <AvatarFallback className="bg-wassal-slate/20 text-wassal-plum font-bold text-sm">
                              {applicant.firstName?.[0]}
                              {applicant.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-bold text-wassal-plum text-base">
                              {applicant.firstName} {applicant.lastName}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-wassal-slate mt-0.5">
                              <Clock className="w-3 h-3 text-wassal-slate" />
                              <span>Reçu le {formatDate(applicant.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="pending">En attente</Badge>
                      </div>

                      {/* Metadata (with mobile tap-to-call & mailto) */}
                      <div className="space-y-2 text-xs text-wassal-ink bg-wassal-bg/60 p-3 rounded-lg border border-wassal-border/60 mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-wassal-slate shrink-0" />
                          <a
                            href={`mailto:${applicant.email}`}
                            className="truncate text-wassal-slate hover:text-wassal-green-ink transition-colors font-medium"
                          >
                            {applicant.email}
                          </a>
                        </div>
                        {applicant.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-wassal-slate shrink-0" />
                            <a
                              href={`tel:${applicant.phoneNumber}`}
                              className="font-mono text-wassal-ink hover:underline"
                            >
                              {applicant.phoneNumber}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Mobile-first stacked on small screens, row on desktop */}
                    <div className="pt-3 border-t border-wassal-border">
                      {isSelf ? (
                        <p className="text-xs text-amber-700 italic text-center py-2">
                          Vous ne pouvez pas valider votre propre compte
                        </p>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2">
                          <Button
                            variant="destructive"
                            size="default"
                            onClick={() => handleReject(applicant)}
                            className="h-11 sm:h-9 w-full sm:w-auto gap-1.5 order-2 sm:order-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Refuser</span>
                          </Button>
                          <Button
                            variant="default"
                            size="default"
                            onClick={() => handleApprove(applicant)}
                            className="h-11 sm:h-9 w-full sm:w-auto gap-1.5 order-1 sm:order-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Valider l'adhésion</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={handleConfirmAction}
          title={confirmDialog.title}
          message={confirmDialog.message}
          isDestructive={confirmDialog.isDestructive}
          isLoading={isActionLoading}
        />
      )}
    </div>
  );
};
