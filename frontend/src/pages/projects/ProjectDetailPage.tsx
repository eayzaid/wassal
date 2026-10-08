import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/projectsApi';
import { tasksApi } from '../../api/tasksApi';
import {
  ProjectDto,
  TaskDto,
  TaskFullDto,
  isProjectFullDto,
} from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { canManageProject } from '../../utils/projectPermissions';
import { ProjectStatusBadge } from '../../components/common/ProjectStatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { TaskCard } from '../../components/tasks/TaskCard';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { TaskAffiliationModal } from '../../components/tasks/TaskAffiliationModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ListTodo,
  Plus,
  RefreshCw,
  Trophy,
  AlertCircle,
  User,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [taskPage, setTaskPage] = useState(0);
  const [taskTotalPages, setTaskTotalPages] = useState(1);
  const [taskTotalElements, setTaskTotalElements] = useState(0);
  const [isJoiningTaskId, setIsJoiningTaskId] = useState<number | null>(null);

  // Modals & Dialogs
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [affiliationModalTask, setAffiliationModalTask] = useState<TaskDto | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    action: () => Promise<void>;
  } | null>(null);
  const [isMarkingDone, setIsMarkingDone] = useState(false);

  const fetchTasksPage = useCallback(
    async (pageToLoad: number) => {
      if (!projectId) return;
      setIsTasksLoading(true);
      try {
        const tasksRes = await tasksApi.listTasks({
          projectId,
          page: pageToLoad,
          size: 10,
          sort: 'createdAt,desc',
        });
        const items = Array.isArray(tasksRes) ? tasksRes : (tasksRes as any).content || [];
        setTasks(items);
        setTaskPage(pageToLoad);
        const total =
          (tasksRes as any).page?.totalElements ??
          (tasksRes as any).totalElements ??
          items.length;
        const pages =
          (tasksRes as any).page?.totalPages ?? (tasksRes as any).totalPages ?? 1;
        setTaskTotalElements(total);
        setTaskTotalPages(pages);
      } catch {
        toast.error('Impossible de charger les tâches du projet.');
      } finally {
        setIsTasksLoading(false);
      }
    },
    [projectId, toast]
  );

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;
    try {
      const projRes = await projectsApi.getProjectById(projectId);
      setProject(projRes);
      await fetchTasksPage(0);
    } catch {
      toast.error('Impossible de charger les détails du projet.');
      navigate('/projects');
    } finally {
      setIsInitialLoading(false);
    }
  }, [projectId, navigate, toast, fetchTasksPage]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  if (isInitialLoading || !project) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-wassal-plum mb-3" />
        <p className="text-sm text-wassal-slate">Chargement du projet...</p>
      </div>
    );
  }

  const isFull = isProjectFullDto(project);
  const isOwnerOrAdmin = canManageProject(user, project);
  const isProjectDone = project.status === 'DONE';

  // BR-T15 Rule: All tasks under project must be DONE before marking project DONE
  const allProjectTasks = project.tasks || [];
  const allTasksDone = allProjectTasks.length > 0 && allProjectTasks.every((t) => t.status === 'DONE');
  const canMarkProjectDone = isOwnerOrAdmin && !isProjectDone && allTasksDone;

  const formattedEndDate = new Date(project.expectedEndTime).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const completionRate =
    allProjectTasks.length > 0
      ? Math.round(
          (allProjectTasks.filter((t) => t.status === 'DONE').length /
            allProjectTasks.length) *
            100
        )
      : 0;

  // Actions
  const handleMarkProjectDone = () => {
    if (!canMarkProjectDone) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Clôturer officiellement le projet',
      message: `Êtes-vous sûr de vouloir clôturer le projet "${project.title}" ? Cette action valide l'ensemble des travaux et comptabilise définitivement les points.`,
      isDestructive: false,
      action: async () => {
        setIsMarkingDone(true);
        try {
          const updated = await projectsApi.markProjectDone(project.id);
          setProject(updated);
          toast.success('Le projet a été clôturé avec succès !');
        } catch (err: any) {
          toast.error(
            err.response?.data?.message || 'Erreur lors de la clôture du projet.'
          );
        } finally {
          setIsMarkingDone(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleTaskCreated = (newTask: TaskFullDto) => {
    setProject((prev) =>
      prev
        ? {
            ...prev,
            tasks: [newTask as any, ...(prev.tasks || [])],
          }
        : prev
    );
    fetchTasksPage(0);
    toast.success('Tâche ajoutée au projet avec succès !');
    setIsCreateTaskOpen(false);
  };

  const handleTaskUpdated = (updatedTask: TaskDto) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setProject((prev) =>
      prev
        ? {
            ...prev,
            tasks: (prev.tasks || []).map((t) =>
              t.id === updatedTask.id ? (updatedTask as any) : t
            ),
          }
        : prev
    );
    setAffiliationModalTask((current) =>
      current && current.id === updatedTask.id ? updatedTask : current
    );
  };

  const handleRequestJoinTask = async (task: TaskDto) => {
    setIsJoiningTaskId(task.id);
    const optimisticTask: TaskDto = {
      ...task,
      hasPendingAffiliationRequest: true,
      hasRequestedAffiliation: true,
    };
    handleTaskUpdated(optimisticTask);

    try {
      await tasksApi.requestAffiliation(task.id);
      toast.success('Demande de participation envoyée');
      const updated = await tasksApi.getTaskById(task.id);
      handleTaskUpdated(updated);
    } catch (err: any) {
      handleTaskUpdated(task);
      toast.error(
        err.response?.data?.message || 'Erreur lors de la demande de participation.'
      );
    } finally {
      setIsJoiningTaskId(null);
    }
  };

  const handleRequestDoneTask = (task: TaskDto) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Déclarer la tâche achevée',
      message: `Confirmez-vous avoir terminé vos objectifs sur la tâche "${task.name}" ? Elle sera soumise à la validation du responsable.`,
      isDestructive: false,
      action: async () => {
        try {
          const updated = await tasksApi.requestDone(task.id);
          toast.success('Tâche déclarée achevée avec succès');
          handleTaskUpdated(updated);
        } catch (err: any) {
          toast.error(
            err.response?.data?.message || 'Erreur lors de la déclaration.'
          );
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleConfirmDoneTask = async (task: TaskDto) => {
    try {
      const updated = await tasksApi.confirmDone(task.id);
      toast.success(`Tâche "${task.name}" validée et terminée`);
      handleTaskUpdated(updated);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Erreur lors de la validation de la tâche.'
      );
    }
  };

  const handleRejectDoneTask = async (task: TaskDto) => {
    try {
      const updated = await tasksApi.rejectDone(task.id);
      toast.info(`La déclaration d'achèvement a été rejetée.`);
      handleTaskUpdated(updated);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Erreur lors du rejet de la tâche.'
      );
    }
  };

  const handleDeleteTask = (task: TaskDto) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer la tâche',
      message: `Êtes-vous sûr de vouloir supprimer définitivement la tâche "${task.name}" ?`,
      isDestructive: true,
      action: async () => {
        try {
          await tasksApi.deleteTask(task.id);
          toast.success('Tâche supprimée');
          setProject((prev) =>
            prev
              ? {
                  ...prev,
                  tasks: (prev.tasks || []).filter((t) => t.id !== task.id),
                }
              : prev
          );
          const newTargetPage = tasks.length === 1 && taskPage > 0 ? taskPage - 1 : taskPage;
          fetchTasksPage(newTargetPage);
        } catch (err: any) {
          toast.error(
            err.response?.data?.message || 'Erreur lors de la suppression.'
          );
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0 max-w-full pb-12">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-wassal-slate hover:text-wassal-plum transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux projets</span>
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-3xl border border-wassal-border p-4 sm:p-6 lg:p-8 shadow-sm w-full min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <ProjectStatusBadge status={project.status} size="default" />
              <span className="text-xs font-bold px-3 py-1 rounded-lg bg-wassal-bg text-wassal-slate border border-wassal-border">
                Édition {project.editionNumber}
              </span>
              {isFull && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg bg-wassal-green/20 text-wassal-green-ink">
                  <Trophy className="w-3.5 h-3.5" />
                  {isProjectDone
                    ? `${project.pointsGained} / ${project.totalPoints} pts gagnés`
                    : `${project.totalPoints} pts au total`}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-wassal-plum">
              {project.title}
            </h1>

            <p className="text-sm text-wassal-slate leading-relaxed max-w-3xl">
              {project.description || 'Aucune description détaillée.'}
            </p>

            <div className="flex items-center gap-6 text-xs text-wassal-slate pt-2 flex-wrap">
              {(project.ownerName || project.createdBy) && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-wassal-plum" />
                  <span>
                    Créé par : <strong>{project.ownerName || project.createdBy}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-wassal-plum" />
                <span>
                  Échéance : <strong>{formattedEndDate}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-wassal-plum" />
                <span>
                  <strong>{tasks.length}</strong> tâche{tasks.length > 1 ? 's' : ''} associée{tasks.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          {isOwnerOrAdmin && !isProjectDone && (
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <Button
                variant="default"
                size="default"
                onClick={() => setIsCreateTaskOpen(true)}
                className="h-11 px-5 gap-2 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une tâche</span>
              </Button>

              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="default"
                  disabled={!canMarkProjectDone || isMarkingDone}
                  onClick={handleMarkProjectDone}
                  className={`h-11 px-5 w-full gap-2 font-bold transition-all ${
                    canMarkProjectDone
                      ? 'border-wassal-green text-wassal-green-ink hover:bg-wassal-green/10'
                      : 'border-wassal-border text-gray-400 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Clôturer le projet</span>
                </Button>

                {!allTasksDone && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/80 flex items-start gap-1.5 max-w-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Toutes les tâches doivent avoir le statut <strong>DONE</strong> pour pouvoir clôturer ce projet (BR-T15).
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Task Progress Bar */}
        <div className="mt-6 pt-6 border-t border-wassal-border">
          <div className="flex items-center justify-between text-xs font-semibold text-wassal-plum mb-2">
            <span>Progression globale des tâches</span>
            <span>
              {tasks.filter((t) => t.status === 'DONE').length} sur {tasks.length} achevée{tasks.length > 1 ? 's' : ''} ({completionRate}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-wassal-bg rounded-full overflow-hidden border border-wassal-border">
            <div
              className={`h-full transition-all duration-300 ${
                isProjectDone || completionRate === 100
                  ? 'bg-wassal-green'
                  : 'bg-wassal-plum'
              }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tasks Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-xl font-bold font-heading text-wassal-plum">
            Tâches du projet
          </h2>
          <p className="text-xs text-wassal-slate">
            Liste opérationnelle des tâches et collectes associées
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchProjectDetails}
          className="h-9 text-wassal-slate hover:text-wassal-plum"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tasks Grid */}
      {isTasksLoading ? (
        <div className="py-16 text-center text-wassal-slate bg-white rounded-2xl border border-wassal-border">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-wassal-plum mb-2" />
          <p className="text-xs font-medium">Chargement des tâches...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-wassal-border p-8 sm:p-14 text-center w-full my-4 flex flex-col items-center justify-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-wassal-bg flex items-center justify-center text-wassal-slate mb-3">
            <ListTodo className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-wassal-plum">
            Aucune tâche pour l'instant
          </h3>
          <p className="text-xs sm:text-sm text-wassal-slate mt-1 max-w-sm mx-auto">
            Ce projet ne contient encore aucune tâche opérationnelle.
          </p>
          {isOwnerOrAdmin && !isProjectDone && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateTaskOpen(true)}
              className="mt-4 gap-2 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white rounded-xl font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une première tâche</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4 w-full min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-5 w-full min-w-0">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onRequestJoin={handleRequestJoinTask}
                onRequestDone={handleRequestDoneTask}
                onConfirmDone={handleConfirmDoneTask}
                onRejectDone={handleRejectDoneTask}
                onManageAffiliations={(t) => setAffiliationModalTask(t)}
                onDelete={handleDeleteTask}
                isJoining={isJoiningTaskId === task.id}
              />
            ))}
          </div>

          <Pagination
            currentPage={taskPage}
            totalPages={taskTotalPages}
            totalElements={taskTotalElements}
            pageSize={10}
            onPageChange={(p) => fetchTasksPage(p)}
            itemName="tâches"
            disabled={isTasksLoading}
          />
        </div>
      )}

      {/* Modals & Dialogs */}
      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          projectId={project.id}
          projectTitle={project.title}
          onSuccess={handleTaskCreated}
        />
      )}

      {affiliationModalTask && (
        <TaskAffiliationModal
          isOpen={!!affiliationModalTask}
          onClose={() => setAffiliationModalTask(null)}
          task={affiliationModalTask}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.action}
          title={confirmDialog.title}
          message={confirmDialog.message}
          isDestructive={confirmDialog.isDestructive}
          confirmLabel={confirmDialog.isDestructive ? 'Supprimer' : 'Confirmer'}
        />
      )}
    </div>
  );
};
