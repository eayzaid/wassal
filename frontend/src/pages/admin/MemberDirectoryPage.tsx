import React, { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../../api/usersApi';
import { UserSummaryDto, UserFilterParams, Role } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/layout/PageHeader';
import { MemberFilters } from '../../components/members/MemberFilters';
import { MemberTableRow } from '../../components/members/MemberTableRow';
import { MemberCard } from '../../components/members/MemberCard';
import { MemberDetailModal } from '../../components/members/MemberDetailModal';
import { Card, CardContent } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import {
  Users,
  UserCheck,
  Clock,
  Ban,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../types';

export const MemberDirectoryPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [members, setMembers] = useState<UserSummaryDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters (Search is debounced at the MemberFilters level)
  const [filters, setFilters] = useState<UserFilterParams>({
    status: '',
    role: '',
    blocked: '',
    q: '',
    page: 0,
    size: 20,
    sort: 'createdAt,desc',
  });

  // Selected member for detail modal
  const [selectedMember, setSelectedMember] = useState<UserSummaryDto | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Summary counts
  const [counts, setCounts] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    blocked: 0,
  });

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.listUsers(filters);
      setMembers(response.content || []);
      // Spring Data 3.3.4 compatibility: nested page metadata
      const total = response.page?.totalElements ?? response.totalElements ?? 0;
      const pages = response.page?.totalPages ?? response.totalPages ?? 1;
      setTotalElements(total);
      setTotalPages(pages);
    } catch {
      toast.error("Échec du chargement de l'annuaire des membres.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  // Fetch count summaries
  const fetchCounts = useCallback(async () => {
    try {
      const [allRes, pendingRes, approvedRes, rejectedRes, blockedRes] = await Promise.all([
        usersApi.listUsers({ size: 1 }),
        usersApi.listUsers({ status: 'PENDING_APPROVAL', size: 1 }),
        usersApi.listUsers({ status: 'APPROVED', blocked: false, size: 1 }),
        usersApi.listUsers({ status: 'REJECTED', size: 1 }),
        usersApi.listUsers({ blocked: true, size: 1 }),
      ]);
      setCounts({
        total: allRes.page?.totalElements ?? allRes.totalElements ?? 0,
        pending: pendingRes.page?.totalElements ?? pendingRes.totalElements ?? 0,
        approved: approvedRes.page?.totalElements ?? approvedRes.totalElements ?? 0,
        rejected: rejectedRes.page?.totalElements ?? rejectedRes.totalElements ?? 0,
        blocked: blockedRes.page?.totalElements ?? blockedRes.totalElements ?? 0,
      });
    } catch {
      // Non-critical background metric failure
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleRefresh = () => {
    fetchMembers();
    fetchCounts();
  };

  const handleOpenDetails = (member: UserSummaryDto) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  };

  const handleApprove = async (id: number) => {
    try {
      const updated = await usersApi.approveUser(id);
      toast.success(`Inscription approuvée pour ${updated.firstName} ${updated.lastName}`);
      const prevMember = members.find((m) => m.id === id);
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      if (selectedMember?.id === id) {
        setSelectedMember(updated);
      }
      setCounts((prev) => {
        const wasPending = prevMember?.accountStatus === 'PENDING_APPROVAL';
        const wasRejected = prevMember?.accountStatus === 'REJECTED';
        return {
          ...prev,
          pending: wasPending ? Math.max(0, prev.pending - 1) : prev.pending,
          rejected: wasRejected ? Math.max(0, prev.rejected - 1) : prev.rejected,
          approved: prev.approved + 1,
        };
      });
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || "Échec de l'approbation du membre");
    }
  };

  const handleReject = async (id: number) => {
    try {
      const updated = await usersApi.rejectUser(id);
      toast.info(`Inscription refusée pour ${updated.firstName} ${updated.lastName}`);
      const prevMember = members.find((m) => m.id === id);
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      if (selectedMember?.id === id) {
        setSelectedMember(updated);
      }
      setCounts((prev) => {
        const wasPending = prevMember?.accountStatus === 'PENDING_APPROVAL';
        const wasApproved = prevMember?.accountStatus === 'APPROVED';
        return {
          ...prev,
          pending: wasPending ? Math.max(0, prev.pending - 1) : prev.pending,
          approved: wasApproved ? Math.max(0, prev.approved - 1) : prev.approved,
          rejected: prev.rejected + 1,
        };
      });
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || 'Échec du refus du membre');
    }
  };

  const handleChangeRole = async (id: number, newRole: Role) => {
    try {
      const updated = await usersApi.changeRole(id, { role: newRole });
      toast.success(`Rôle mis à jour pour ${updated.firstName} ${updated.lastName}`);
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      if (selectedMember?.id === id) {
        setSelectedMember(updated);
      }
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || 'Échec de la modification du rôle');
      throw err;
    }
  };

  const handleBlock = async (id: number) => {
    try {
      const updated = await usersApi.blockUser(id);
      toast.warning(`Compte suspendu pour ${updated.firstName} ${updated.lastName}`);
      const prevMember = members.find((m) => m.id === id);
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      if (selectedMember?.id === id) {
        setSelectedMember(updated);
      }
      setCounts((prev) => {
        const wasApproved = prevMember?.accountStatus === 'APPROVED';
        return {
          ...prev,
          blocked: prev.blocked + 1,
          approved: wasApproved ? Math.max(0, prev.approved - 1) : prev.approved,
        };
      });
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || 'Échec de la suspension du compte');
    }
  };

  const handleUnblock = async (id: number) => {
    try {
      const updated = await usersApi.unblockUser(id);
      toast.success(`Accès rétabli pour ${updated.firstName} ${updated.lastName}`);
      const prevMember = members.find((m) => m.id === id);
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
      if (selectedMember?.id === id) {
        setSelectedMember(updated);
      }
      setCounts((prev) => {
        const isApproved = prevMember?.accountStatus === 'APPROVED';
        return {
          ...prev,
          blocked: Math.max(0, prev.blocked - 1),
          approved: isApproved ? prev.approved + 1 : prev.approved,
        };
      });
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || "Échec du déblocage de l'accès");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Annuaire des membres"
        subtitle="Consultation, filtrage et gouvernance des bénévoles de Caravane El Hayat"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
        }
      />

      {/* KPI Cards: Responsive 2-col on Mobile, 3-col on Tablet, 5-col on Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        <Card className="shadow-xs border-wassal-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-wassal-slate">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Total</span>
              <Users className="w-4 h-4 text-wassal-slate shrink-0" />
            </div>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-wassal-plum">{counts.total}</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-wassal-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-wassal-green-ink">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Actifs</span>
              <UserCheck className="w-4 h-4 text-wassal-green-ink shrink-0" />
            </div>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-wassal-plum">{counts.approved}</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-wassal-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-wassal-slate">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">En Attente</span>
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            </div>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-wassal-plum">{counts.pending}</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-wassal-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-wassal-plum">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Refusés</span>
              <XCircle className="w-4 h-4 text-wassal-plum shrink-0" />
            </div>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-wassal-plum">{counts.rejected}</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-wassal-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-wassal-wine">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">Bloqués</span>
              <Ban className="w-4 h-4 text-wassal-wine shrink-0" />
            </div>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-wassal-plum">{counts.blocked}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar (Mobile-first with quick chips & debouncing) */}
      <MemberFilters
        filters={filters}
        counts={counts}
        onChange={(newFilters) => setFilters(newFilters)}
        onReset={() =>
          setFilters({
            status: '',
            role: '',
            blocked: '',
            q: '',
            page: 0,
            size: 20,
            sort: 'createdAt,desc',
          })
        }
      />

      {/* MOBILE VIEW: Touch-Friendly Card List (Hidden on Desktop) */}
      <div className="block lg:hidden space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-wassal-slate bg-wassal-surface rounded-xl border border-wassal-border">
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 border-3 border-wassal-plum/20 border-t-wassal-green rounded-full animate-spin" />
              <span className="text-xs font-medium">Chargement des membres...</span>
            </div>
          </div>
        ) : members.length === 0 ? (
          <Card className="border-wassal-border shadow-xs text-center py-12 px-4">
            <p className="text-sm font-bold text-wassal-plum">Aucun membre trouvé</p>
            <p className="text-xs text-wassal-slate mt-1">
              Modifiez vos critères de recherche ou réinitialisez les filtres.
            </p>
          </Card>
        ) : (
          members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onViewDetails={handleOpenDetails}
              onApprove={handleApprove}
            />
          ))
        )}
      </div>

      {/* DESKTOP VIEW: Data-Dense Shadcn Table (Hidden on Mobile) */}
      <div className="hidden lg:block">
        <Card className="shadow-xs border-wassal-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-wassal-border">
                <TableHead>Membre</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-wassal-slate">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-wassal-plum/20 border-t-wassal-green rounded-full animate-spin" />
                      <span className="text-xs font-medium">Chargement des membres...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-wassal-slate">
                    <p className="text-sm font-medium text-wassal-plum">Aucun membre trouvé</p>
                    <p className="text-xs mt-1">Modifiez vos critères de recherche ou vos filtres.</p>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <MemberTableRow
                    key={member.id}
                    member={member}
                    onSelect={handleOpenDetails}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isCurrentActor={currentUser?.id === member.id}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Pagination Footer: Responsive for Mobile & Desktop */}
      {!isLoading && totalElements > 0 && (
        <div className="px-4 py-3 rounded-xl border border-wassal-border bg-wassal-surface shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-wassal-slate">
          <div>
            Affichage de <span className="font-semibold text-wassal-plum">{members.length}</span> sur{' '}
            <span className="font-semibold text-wassal-plum">{totalElements}</span> membre(s)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page || 0) === 0}
              onClick={() => setFilters({ ...filters, page: (filters.page || 0) - 1 })}
              className="h-9 w-9 p-0"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="px-3 font-medium text-wassal-plum text-xs">
              Page {(filters.page || 0) + 1} / {totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page || 0) + 1 >= totalPages}
              onClick={() => setFilters({ ...filters, page: (filters.page || 0) + 1 })}
              className="h-9 w-9 p-0"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      <MemberDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        member={selectedMember}
        onApprove={handleApprove}
        onReject={handleReject}
        onChangeRole={handleChangeRole}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
      />
    </div>
  );
};
