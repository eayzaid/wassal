import React, { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../../api/tasksApi';
import { projectsApi } from '../../api/projectsApi';
import { TaskDto, ProjectDto, TaskType, TaskFullDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { canCreateTask, isAffiliatedWithTask } from '../../utils/projectPermissions';
import { TaskCard } from '../../components/tasks/TaskCard';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { TaskAffiliationModal } from '../../components/tasks/TaskAffiliationModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Button } from '../../components/ui/button';
import {
  ListTodo,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  UserCheck,
} from 'lucide-react';

type TabView = 'ALL' | 'MY_TASKS' | 'PENDING' | 'DONE';

export const TasksListPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [currentTab, setCurrentTab] = useState<TabView>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TaskType>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [affiliationModalTask, setAffiliationModalTask] = useState<TaskDto | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    action: () => Promise<void>;
  } | null>(null);

  const fetchTasksAndProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, projectsRes] = await Promise.allSettled([
        tasksApi.listTasks(),
        projectsApi.listProjects(),
      ]);

      if (tasksRes.status === 'fulfilled') {
        setTasks(tasksRes.value);
      } else {
        toast.error('Impossible de charger les tâches.');
      }

      if (projectsRes.status === 'fulfilled') {
        setProjects(projectsRes.value);
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasksAndProjects();
  }, [fetchTasksAndProjects]);

  // Actions
  const handleTaskCreated = (newTask: TaskFullDto) => {
    setTasks((prev) => [newTask, ...prev]);
    toast.success('Nouvelle tâche créée avec succès !');
    setIsCreateTaskOpen(false);
  };

  const handleTaskUpdated = (updatedTask: TaskDto) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleRequestJoin = async (task: TaskDto) => {
    try {
      await tasksApi.requestAffiliation(task.id);
      toast.success('Demande de participation transmise');
      fetchTasksAndProjects();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Erreur lors de la demande de participation.'
      );
    }
  };

  const handleRequestDone = (task: TaskDto) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Déclarer la tâche terminée',
      message: `Avez-vous accompli tous les objectifs de la tâche "${task.name}" ? Elle sera transmise au responsable pour validation.`,
      isDestructive: false,
      action: async () => {
        try {
          const updated = await tasksApi.requestDone(task.id);
          toast.success('Tâche déclarée achevée');
          setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
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

  const handleConfirmDone = async (task: TaskDto) => {
    try {
      const updated = await tasksApi.confirmDone(task.id);
      toast.success(`Tâche "${task.name}" validée et achevée`);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Erreur lors de la validation.'
      );
    }
  };

  const handleRejectDone = async (task: TaskDto) => {
    try {
      const updated = await tasksApi.rejectDone(task.id);
      toast.info(`La déclaration d'achèvement a été rejetée.`);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Erreur lors du rejet.'
      );
    }
  };

  const handleDeleteTask = (task: TaskDto) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer la tâche',
      message: `Êtes-vous certain de vouloir supprimer la tâche "${task.name}" ?`,
      isDestructive: true,
      action: async () => {
        try {
          await tasksApi.deleteTask(task.id);
          toast.success('Tâche supprimée avec succès');
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
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

  // Filter computation
  const filteredTasks = tasks.filter((t) => {
    // 1. Search Query
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Tab Filter
    let matchesTab = true;
    if (currentTab === 'MY_TASKS') {
      matchesTab = isAffiliatedWithTask(user?.id, t);
    } else if (currentTab === 'PENDING') {
      matchesTab = t.status === 'PENDING_CONFIRMATION';
    } else if (currentTab === 'DONE') {
      matchesTab = t.status === 'DONE';
    }

    // 3. Type Filter
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;

    // 4. Project Filter
    const matchesProject =
      selectedProjectId === 'ALL' || t.projectId === selectedProjectId;

    return matchesSearch && matchesTab && matchesType && matchesProject;
  });

  const myTasksCount = tasks.filter((t) => isAffiliatedWithTask(user?.id, t)).length;
  const pendingCount = tasks.filter((t) => t.status === 'PENDING_CONFIRMATION').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-wassal-plum tracking-tight">
            Tâches & Collectes
          </h1>
          <p className="text-xs sm:text-sm text-wassal-slate mt-0.5">
            Missions de terrain, logistique et collectes de dons de Caravane El Hayat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasksAndProjects}
            disabled={isLoading}
            className="h-10 text-wassal-slate hover:text-wassal-plum"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {canCreateTask(user?.role) && (
            <Button
              variant="default"
              size="default"
              onClick={() => setIsCreateTaskOpen(true)}
              className="h-10 px-4 gap-2 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Tâche</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-wassal-border">
        <button
          type="button"
          onClick={() => setCurrentTab('ALL')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 border-b-2 ${
            currentTab === 'ALL'
              ? 'border-wassal-plum text-wassal-plum bg-wassal-plum/5'
              : 'border-transparent text-wassal-slate hover:text-wassal-plum'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Toutes ({tasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('MY_TASKS')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 border-b-2 ${
            currentTab === 'MY_TASKS'
              ? 'border-wassal-plum text-wassal-plum bg-wassal-plum/5'
              : 'border-transparent text-wassal-slate hover:text-wassal-plum'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Mes affectations ({myTasksCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('PENDING')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 border-b-2 ${
            currentTab === 'PENDING'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-wassal-slate hover:text-amber-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>À valider ({pendingCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('DONE')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 border-b-2 ${
            currentTab === 'DONE'
              ? 'border-wassal-green-ink text-wassal-green-ink bg-wassal-green/5'
              : 'border-transparent text-wassal-slate hover:text-wassal-green-ink'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Achevées ({doneCount})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-wassal-border space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="relative sm:col-span-6">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-wassal-slate" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par intitulé, description..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-wassal-border bg-wassal-bg/30 focus:outline-none focus:ring-2 focus:ring-wassal-green focus:bg-white transition-all"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-wassal-border bg-white text-wassal-plum focus:outline-none focus:ring-2 focus:ring-wassal-green font-medium"
            >
              <option value="ALL">Tous types de tâche</option>
              <option value="TASK">Tâches opérationnelles</option>
              <option value="COLLECTION">Campagnes de collecte</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedProjectId}
              onChange={(e) =>
                setSelectedProjectId(
                  e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
                )
              }
              className="w-full h-10 px-3 text-xs rounded-xl border border-wassal-border bg-white text-wassal-plum focus:outline-none focus:ring-2 focus:ring-wassal-green font-medium"
            >
              <option value="ALL">Tous les projets</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-wassal-border p-5 h-60 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
              <div className="h-9 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-wassal-border p-12 text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-wassal-bg flex items-center justify-center text-wassal-slate mb-3">
            <ListTodo className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-wassal-plum">Aucune tâche trouvée</h3>
          <p className="text-xs text-wassal-slate mt-1 max-w-xs mx-auto">
            {searchQuery || typeFilter !== 'ALL' || selectedProjectId !== 'ALL' || currentTab !== 'ALL'
              ? 'Aucune tâche ne correspond aux filtres sélectionnés.'
              : 'Aucune tâche disponible dans le système.'}
          </p>
          {canCreateTask(user?.role) && !searchQuery && currentTab === 'ALL' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateTaskOpen(true)}
              className="mt-4 gap-2 bg-wassal-green-ink text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Créer la première tâche</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onRequestJoin={handleRequestJoin}
              onRequestDone={handleRequestDone}
              onConfirmDone={handleConfirmDone}
              onRejectDone={handleRejectDone}
              onManageAffiliations={(t) => setAffiliationModalTask(t)}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Modals & Dialogs */}
      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          onSuccess={handleTaskCreated}
        />
      )}

      {affiliationModalTask && (
        <TaskAffiliationModal
          isOpen={!!affiliationModalTask}
          onClose={() => {
            setAffiliationModalTask(null);
            fetchTasksAndProjects();
          }}
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
