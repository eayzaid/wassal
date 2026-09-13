import React, { useState, useEffect, useCallback } from 'react';
import {
  TaskDto,
  TaskMemberDto,
  AffiliationRequestDto,
  UserSummaryDto,
  Decision,
} from '../../types';
import { tasksApi } from '../../api/tasksApi';
import { usersApi } from '../../api/usersApi';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Users,
  UserPlus,
  UserMinus,
  Check,
  X,
  Clock,
  Briefcase,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { formatDate } from '../../utils/formatters';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../types';

interface TaskAffiliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskDto | null;
  onTaskUpdated?: (updatedTask: TaskDto) => void;
}

export const TaskAffiliationModal: React.FC<TaskAffiliationModalProps> = ({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'members' | 'requests' | 'assign'>('members');

  // Active members
  const [activeMembers, setActiveMembers] = useState<TaskMemberDto[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Requests
  const [requests, setRequests] = useState<AffiliationRequestDto[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Direct assign search
  const [allUsers, setAllUsers] = useState<UserSummaryDto[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Action loading state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchActiveMembers = useCallback(async () => {
    if (!task) return;
    setIsLoadingMembers(true);
    try {
      const data = await tasksApi.listActiveAffiliations(task.id);
      setActiveMembers(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingMembers(false);
    }
  }, [task]);

  const fetchRequests = useCallback(async () => {
    if (!task) return;
    setIsLoadingRequests(true);
    try {
      const data = await tasksApi.listAffiliationRequests(task.id);
      setRequests(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingRequests(false);
    }
  }, [task]);

  const fetchAssignableUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await usersApi.listUsers({
        status: 'APPROVED',
        blocked: false,
        size: 50,
      });
      setAllUsers(res.content || []);
    } catch {
      // ignore
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && task) {
      fetchActiveMembers();
      fetchRequests();
      fetchAssignableUsers();
    }
  }, [isOpen, task, fetchActiveMembers, fetchRequests, fetchAssignableUsers]);

  if (!task) return null;

  const isTaskDone = task.status === 'DONE';

  // Decision on request
  const handleDecision = async (requestId: number, decision: Decision, requesterName: string) => {
    setActionLoadingId(`req-${requestId}`);
    try {
      await tasksApi.handleAffiliationDecision(task.id, requestId, decision);
      toast.success(
        decision === 'APPROVE'
          ? `Demande de ${requesterName} approuvée.`
          : `Demande de ${requesterName} refusée.`
      );
      // In-place updates
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      await fetchActiveMembers();

      // Refresh parent task
      const updated = await tasksApi.getTaskById(task.id);
      onTaskUpdated?.(updated);
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || 'Erreur lors du traitement de la demande.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Direct assign
  const handleDirectAssign = async (user: UserSummaryDto) => {
    setActionLoadingId(`assign-${user.id}`);
    try {
      await tasksApi.directAssignMember(task.id, user.id);
      toast.success(`${user.firstName} ${user.lastName} affecté(e) à la mission.`);
      await fetchActiveMembers();
      const updated = await tasksApi.getTaskById(task.id);
      onTaskUpdated?.(updated);
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || 'Erreur lors de l’affectation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Un-affiliate
  const handleUnaffiliate = async (member: TaskMemberDto) => {
    if (isTaskDone) return;
    setActionLoadingId(`unaff-${member.id}`);
    try {
      await tasksApi.unaffiliateMember(task.id, member.id);
      toast.info(`${member.firstName} ${member.lastName} retiré(e) de la mission.`);
      setActiveMembers((prev) => prev.filter((m) => m.id !== member.id));
      const updated = await tasksApi.getTaskById(task.id);
      onTaskUpdated?.(updated);
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      toast.error(error.response?.data?.message || 'Erreur lors de la désaffectation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter assignable users who are not already active members
  const filteredUsers = allUsers.filter((u) => {
    const isAlreadyMember = activeMembers.some((m) => m.userId === u.id);
    if (isAlreadyMember) return false;
    if (!userSearch.trim()) return true;
    const term = userSearch.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-wassal-plum/10 flex items-center justify-center text-wassal-plum shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg">Gestion des Bénévoles</DialogTitle>
              <DialogDescription className="text-xs truncate max-w-sm sm:max-w-md">
                Mission : <span className="font-semibold text-wassal-plum">{task.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isTaskDone && (
          <Alert className="py-2 shrink-0 bg-gray-50 border-gray-200 text-wassal-slate">
            <AlertCircle className="w-4 h-4 text-wassal-slate" />
            <AlertDescription className="text-xs">
              Cette mission est clôturée. La composition de l'équipe ne peut plus être modifiée.
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'members' | 'requests' | 'assign')}
          className="flex-1 flex flex-col min-h-0 pt-2"
        >
          <TabsList className="grid grid-cols-3 mb-3 shrink-0 h-11 sm:h-10">
            <TabsTrigger value="members" className="gap-1.5 text-xs py-2">
              <Users className="w-3.5 h-3.5" />
              <span>Équipe ({activeMembers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1.5 text-xs py-2 relative">
              <Clock className="w-3.5 h-3.5" />
              <span>Demandes</span>
              {requests.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {requests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="assign" disabled={isTaskDone} className="gap-1.5 text-xs py-2">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Affecter</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Active Affiliated Members */}
          <TabsContent value="members" className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoadingMembers ? (
              <div className="py-12 text-center text-xs text-wassal-slate">
                Chargement des bénévoles...
              </div>
            ) : activeMembers.length === 0 ? (
              <div className="py-12 text-center text-wassal-slate space-y-2">
                <Users className="w-8 h-8 mx-auto text-wassal-slate/40" />
                <p className="text-xs">Aucun bénévole affecté à cette mission pour le moment.</p>
                <p className="text-[11px] text-wassal-slate/70">
                  Requis : minimum {task.minRequiredMembers} bénévole(s).
                </p>
              </div>
            ) : (
              activeMembers.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-wassal-border bg-wassal-surface flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9 shrink-0 border border-wassal-border">
                      <AvatarFallback className="text-xs bg-wassal-plum text-white font-semibold">
                        {m.firstName?.[0]}
                        {m.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-wassal-plum truncate">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-[11px] text-wassal-slate truncate">{m.email}</p>
                      <p className="text-[10px] text-wassal-slate/70 mt-0.5">
                        Affecté(e) le {formatDate(m.affiliatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.pointsAwarded !== null && (
                      <Badge className="bg-emerald-50 text-wassal-green-ink border-wassal-green-ink/30 text-[11px] font-bold">
                        +{m.pointsAwarded} pts
                      </Badge>
                    )}
                    {!isTaskDone && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={actionLoadingId === `unaff-${m.id}`}
                        onClick={() => handleUnaffiliate(m)}
                        className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs gap-1"
                        title="Désaffecter ce membre"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Retirer</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* TAB 2: Pending Affiliation Requests */}
          <TabsContent value="requests" className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoadingRequests ? (
              <div className="py-12 text-center text-xs text-wassal-slate">
                Chargement des demandes...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center text-wassal-slate space-y-2">
                <Check className="w-8 h-8 mx-auto text-wassal-green-ink/40" />
                <p className="text-xs">Aucune demande d'adhésion en attente.</p>
              </div>
            ) : (
              requests.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9 shrink-0 border border-amber-200">
                      <AvatarFallback className="text-xs bg-amber-700 text-white font-semibold">
                        {r.requester.firstName?.[0]}
                        {r.requester.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-wassal-plum truncate">
                        {r.requester.firstName} {r.requester.lastName}
                      </p>
                      <p className="text-[11px] text-wassal-slate truncate">{r.requester.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Requester workload counter to flag high workload (BR-T19) */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            r.requesterActiveAffiliationCount >= 3
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : 'bg-wassal-surface text-wassal-slate border-wassal-border'
                          }`}
                          title="Nombre de missions actuellement en cours pour ce bénévole"
                        >
                          <Briefcase className="w-3 h-3" />
                          <span>{r.requesterActiveAffiliationCount} mission(s) active(s)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={actionLoadingId === `req-${r.id}`}
                      onClick={() =>
                        handleDecision(r.id, 'DECLINE', `${r.requester.firstName} ${r.requester.lastName}`)
                      }
                      className="h-8 px-2.5 text-xs text-wassal-wine border-rose-200 hover:bg-rose-50 gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Refuser</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionLoadingId === `req-${r.id}`}
                      onClick={() =>
                        handleDecision(r.id, 'APPROVE', `${r.requester.firstName} ${r.requester.lastName}`)
                      }
                      className="h-8 px-2.5 text-xs bg-wassal-green text-wassal-plum hover:bg-wassal-green/90 font-bold gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Valider</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* TAB 3: Direct Assign Member */}
          <TabsContent value="assign" className="flex-1 flex flex-col min-h-0 pt-1">
            <div className="relative mb-3 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-wassal-slate" />
              <input
                type="text"
                placeholder="Rechercher un membre par nom ou email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-wassal-border bg-wassal-surface text-wassal-ink focus:outline-none focus:ring-2 focus:ring-wassal-green/40 focus:border-wassal-green-ink transition"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoadingUsers ? (
                <div className="py-12 text-center text-xs text-wassal-slate">
                  Chargement des membres...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-wassal-slate">
                  Aucun membre disponible trouvé.
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl border border-wassal-border bg-wassal-surface flex items-center justify-between gap-3 shadow-2xs hover:border-wassal-sage/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="text-xs bg-wassal-slate text-white font-semibold">
                          {u.firstName[0]}
                          {u.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-wassal-plum truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-[11px] text-wassal-slate truncate">{u.email}</p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      disabled={actionLoadingId === `assign-${u.id}`}
                      onClick={() => handleDirectAssign(u)}
                      className="h-8 px-3 text-xs bg-wassal-green-ink text-white hover:bg-wassal-green-ink/90 font-medium shrink-0 gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Affecter</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
