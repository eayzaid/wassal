import React from 'react';
import { TaskDto, isTaskFullDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import {
  canManageTask,
  isAffiliatedWithTask,
  canRequestDone,
  canConfirmDone,
  canJoinTask,
} from '../../utils/projectPermissions';
import { TaskStatusBadge } from '../common/TaskStatusBadge';
import { TaskTypeBadge } from '../common/TaskTypeBadge';
import { Button } from '../ui/button';
import {
  Calendar,
  Users,
  Trophy,
  CheckCircle,
  XCircle,
  Send,
  UserPlus,
  Trash2,
  Clock,
  Briefcase,
  User,
} from 'lucide-react';

interface TaskCardProps {
  task: TaskDto;
  onRequestJoin?: (task: TaskDto) => void;
  onRequestDone?: (task: TaskDto) => void;
  onConfirmDone?: (task: TaskDto) => void;
  onRejectDone?: (task: TaskDto) => void;
  onManageAffiliations?: (task: TaskDto) => void;
  onDelete?: (task: TaskDto) => void;
  isJoining?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onRequestJoin,
  onRequestDone,
  onConfirmDone,
  onRejectDone,
  onManageAffiliations,
  onDelete,
  isJoining = false,
}) => {
  const { user } = useAuth();
  const isFull = isTaskFullDto(task);
  const isOwnerOrAdmin = canManageTask(user, task);
  const isDone = task.status === 'DONE';
  const isPendingConfirmation = task.status === 'PENDING_CONFIRMATION';
  const isAffiliated = isAffiliatedWithTask(user?.id, task);

  const formattedDate = new Date(task.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const memberCount = task.activeMembers?.length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-wassal-border p-5 hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <TaskStatusBadge status={task.status} size="sm" />
            <TaskTypeBadge type={task.type} size="sm" />
            {isAffiliated && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-wassal-green/15 text-wassal-green-ink border border-wassal-green/30">
                Vous participez
              </span>
            )}
          </div>

          {/* Points badge - only visible if isTaskFullDto (BR-T14) */}
          {isFull && (
            <div className="flex items-center gap-1 text-xs font-bold text-wassal-green-ink bg-wassal-green/15 px-2.5 py-0.5 rounded-md">
              <Trophy className="w-3 h-3" />
              <span>+{task.points} pts</span>
            </div>
          )}
        </div>

        {/* Project Context */}
        <div className="mb-2">
          {task.projectId ? (
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-wassal-slate bg-wassal-bg px-2 py-0.5 rounded-md">
              <Briefcase className="w-3 h-3" />
              <span>Projet #{task.projectId}</span>
            </div>
          ) : (
            <span className="text-[11px] font-medium text-wassal-slate italic">
              Tâche autonome
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div className="mb-3">
          <h4 className="text-base font-bold text-wassal-plum leading-snug">
            {task.name}
          </h4>
          <p className="text-xs text-wassal-slate mt-1 line-clamp-2 leading-relaxed">
            {task.description || 'Aucune description spécifiée.'}
          </p>
        </div>

        {/* Metadata info row */}
        <div className="flex items-center justify-between gap-2 text-xs text-wassal-slate pt-2 border-t border-wassal-border/50 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-wassal-slate shrink-0" />
            <span>
              {memberCount} / {task.minRequiredMembers} membre{memberCount > 1 ? 's' : ''}
            </span>
          </span>

          {(task.ownerName || task.createdBy) && (
            <span
              className="flex items-center gap-1 text-wassal-slate truncate max-w-[150px]"
              title={`Créée par ${task.ownerName || task.createdBy}`}
            >
              <User className="w-3.5 h-3.5 text-wassal-slate shrink-0" />
              <span className="truncate">Par {task.ownerName || task.createdBy}</span>
            </span>
          )}

          <span className="flex items-center gap-1 text-wassal-slate">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formattedDate}</span>
          </span>
        </div>
      </div>

      {/* Actions footer */}
      <div className="pt-4 border-t border-wassal-border/60 mt-3 space-y-2">
        {/* Pending confirmation alert banner */}
        {isPendingConfirmation && (
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Validation demandée</span>
            </span>
            {isOwnerOrAdmin && (
              <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                Action requise
              </span>
            )}
          </div>
        )}

        {/* Contextual Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Member Join CTA */}
          {canJoinTask(user, task) && onRequestJoin && (
            <Button
              variant="outline"
              size="sm"
              disabled={isJoining}
              isLoading={isJoining}
              onClick={() => onRequestJoin(task)}
              className="flex-1 h-9 text-xs font-semibold text-wassal-green-ink border-wassal-green hover:bg-wassal-green/10 gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Rejoindre</span>
            </Button>
          )}

          {/* Affiliation Request Pending Indicator */}
          {(task.hasPendingAffiliationRequest || task.hasRequestedAffiliation) && !isAffiliatedWithTask(user?.id, task) && (
            <div className="flex-1 h-9 flex items-center justify-center gap-1.5 px-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold select-none">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Demande envoyée</span>
            </div>
          )}

          {/* 2. Affiliated Member: Declare Done */}
          {canRequestDone(user, task) && onRequestDone && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onRequestDone(task)}
              className="flex-1 h-9 text-xs font-semibold gap-1.5 bg-wassal-plum hover:bg-wassal-plum/90 text-white"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Déclarer achevée</span>
            </Button>
          )}

          {/* 3. Owner/Admin: Review Pending Confirmation */}
          {canConfirmDone(user, task) && (
            <div className="w-full flex items-center gap-2">
              {onRejectDone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRejectDone(task)}
                  className="flex-1 h-9 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rejeter</span>
                </Button>
              )}
              {onConfirmDone && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onConfirmDone(task)}
                  className="flex-1 h-9 text-xs font-semibold bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirmer</span>
                </Button>
              )}
            </div>
          )}

          {/* 4. Affiliations / Team view */}
          {onManageAffiliations && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageAffiliations(task)}
              className="flex-1 h-9 text-xs font-semibold text-wassal-plum border-wassal-border hover:bg-wassal-bg gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-wassal-slate" />
              <span>{isOwnerOrAdmin ? `Membres (${memberCount})` : `Équipe (${memberCount})`}</span>
            </Button>
          )}

          {/* 5. Owner/Admin: Delete Task (Forbidden if DONE per BR-T4) */}
          {isOwnerOrAdmin && !isDone && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task)}
              title="Supprimer la tâche"
              className="h-9 w-9 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
