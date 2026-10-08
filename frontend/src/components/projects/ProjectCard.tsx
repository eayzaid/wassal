import React from 'react';
import { ProjectDto, isProjectFullDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { canManageProject } from '../../utils/projectPermissions';
import { ProjectStatusBadge } from '../common/ProjectStatusBadge';
import { Button } from '../ui/button';
import {
  FolderKanban,
  Calendar,
  ListTodo,
  Trophy,
  ArrowRight,
  PlusCircle,
  User,
} from 'lucide-react';

interface ProjectCardProps {
  project: ProjectDto;
  onViewDetails: (id: number) => void;
  onAddTask?: (project: ProjectDto) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onViewDetails,
  onAddTask,
}) => {
  const { user } = useAuth();
  const isFull = isProjectFullDto(project);
  const isOwnerOrAdmin = canManageProject(user, project);
  const isCompleted = project.status === 'DONE';

  // Format date
  const formattedEndDate = new Date(project.expectedEndTime).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isOverdue =
    !isCompleted && new Date(project.expectedEndTime).getTime() < Date.now();

  const totalTasks = project.tasks?.length ?? 0;
  const doneTasks = project.tasks?.filter((t) => t.status === 'DONE').length ?? 0;

  // Task completion ratio
  const completionRate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-wassal-border p-4 sm:p-5 hover:shadow-md transition-all flex flex-col justify-between group w-full min-w-0 max-w-full overflow-hidden">
      <div>
        {/* Top Badges & Edition */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <ProjectStatusBadge status={project.status} size="sm" />
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-wassal-bg text-wassal-slate border border-wassal-border/60">
              Édition {project.editionNumber}
            </span>
          </div>

          {/* Points badge - only visible if isProjectFullDto (BR-T14) */}
          {isFull && (
            <div className="flex items-center gap-1 text-xs font-bold text-wassal-green-ink bg-wassal-green/15 px-2.5 py-1 rounded-lg shrink-0">
              <Trophy className="w-3.5 h-3.5" />
              <span>
                {isCompleted
                  ? `${project.pointsGained}/${project.totalPoints} pts`
                  : `${project.totalPoints} pts`}
              </span>
            </div>
          )}
        </div>

        {/* Project Title & Description */}
        <div className="mb-3.5">
          <h3
            onClick={() => onViewDetails(project.id)}
            className="text-base sm:text-lg font-bold text-wassal-plum group-hover:text-wassal-green-ink transition-colors cursor-pointer flex items-center gap-2"
          >
            <FolderKanban className="w-5 h-5 text-wassal-slate shrink-0 group-hover:text-wassal-green-ink transition-colors" />
            <span className="line-clamp-1">{project.title}</span>
          </h3>
          <p className="text-xs text-wassal-slate mt-1.5 line-clamp-2 leading-relaxed">
            {project.description || 'Aucune description fournie.'}
          </p>
        </div>

        {/* Tasks Progress & End Time */}
        <div className="space-y-2.5 py-3 border-y border-wassal-border/60 text-xs">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-medium text-wassal-slate mb-1">
              <span className="flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-wassal-slate shrink-0" />
                <span>
                  {doneTasks} / {totalTasks} tâche{totalTasks > 1 ? 's' : ''} réalisée{doneTasks > 1 ? 's' : ''}
                </span>
              </span>
              <span className="font-bold text-wassal-plum">{completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-wassal-bg rounded-full overflow-hidden border border-wassal-border/50">
              <div
                className={`h-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-wassal-green'
                    : completionRate === 100
                    ? 'bg-wassal-green'
                    : 'bg-wassal-plum'
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Creator & End Date */}
          <div className="space-y-1.5 text-[11px]">
            {(project.ownerName || project.createdBy) && (
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <span className="text-wassal-slate flex items-center gap-1 shrink-0">
                  <User className="w-3.5 h-3.5 text-wassal-slate shrink-0" />
                  <span>Créé par :</span>
                </span>
                <span className="font-semibold text-wassal-plum truncate text-right">
                  {project.ownerName || project.createdBy}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <span className="text-wassal-slate flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Échéance cible :</span>
              </span>
              <span
                className={`font-semibold shrink-0 text-right ${
                  isOverdue ? 'text-rose-600 font-bold' : 'text-wassal-plum'
                }`}
              >
                {formattedEndDate} {isOverdue && '(Dépassée)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 flex items-center justify-between gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(project.id)}
          className="flex-1 h-10 text-xs font-semibold text-wassal-plum border-wassal-border hover:bg-wassal-bg gap-1.5"
        >
          <span>Consulter le projet</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>

        {isOwnerOrAdmin && !isCompleted && onAddTask && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddTask(project)}
            title="Ajouter une tâche"
            className="h-10 w-10 text-wassal-green-ink hover:bg-wassal-green/10 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
