import React, { useState, useEffect, useCallback, useRef } from 'react';
import { tasksApi } from '../../api/tasksApi';
import { projectsApi } from '../../api/projectsApi';
import { TaskDto, ProjectDto, TaskType, TaskFullDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { canCreateTask } from '../../utils/projectPermissions';
import { TaskCard } from '../../components/tasks/TaskCard';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { TaskAffiliationModal } from '../../components/tasks/TaskAffiliationModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  ListTodo,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  UserCheck,
  Loader2,
  X,
} from 'lucide-react';

type TabView = 'ALL' | 'MY_TASKS' | 'PENDING' | 'DONE';

export const TasksListPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isJoiningTaskId, setIsJoiningTaskId] = useState<number | null>(null);

  // Filters & Search
  const [currentTab, setCurrentTab] = useState<TabView>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TaskType>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Counts for tabs
  const [counts, setCounts] = useState<{ all: number; myTasks: number; pending: number; done: number }>({
    all: 0,
    myTasks: 0,
    pending: 0,
    done: 0,
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsDebouncing(true);
    debounceTimerRef.current = setTimeout(() => {
      setIsDebouncing(false);
      setDebouncedSearch(value.trim());
      setPage(0);
    }, 400);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setIsDebouncing(false);
      setDebouncedSearch(searchQuery.trim());
      setPage(0);
    }
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchQuery('');
    setDebouncedSearch('');
    setIsDebouncing(false);
    setPage(0);
  };

  const handleTabChange = (tab: TabView) => {
    setCurrentTab(tab);
    setPage(0);
  };

  const handleTypeChange = (type: 'ALL' | TaskType) => {
    setTypeFilter(type);
    setPage(0);
  };

  const handleProjectChange = (projectId: number | 'ALL') => {
    setSelectedProjectId(projectId);
    setPage(0);
  };

  // Fetch counts for tabs using the single aggregated /tasks/summary endpoint
  const fetchCounts = useCallback(async () => {
    try {
      const summary = await tasksApi.getSummary({
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        projectId: selectedProjectId !== 'ALL' ? selectedProjectId : undefined,
      });
      setCounts({
        all: summary.all ?? summary.total ?? 0,
        myTasks: summary.myTasks ?? 0,
        pending: summary.pending ?? summary.pendingConfirmation ?? 0,
        done: summary.done ?? summary.completed ?? 0,
      });
    } catch {
      // non-critical
    }
  }, [typeFilter, selectedProjectId]);

  // Fetch projects dropdown list once
  useEffect(() => {
    const fetchProjectsList = async () => {
      try {
        const res: any = await projectsApi.listProjects({ size: 100 });
        const items = Array.isArray(res) ? res : res.content || [];
        setProjects(items);
      } catch {
        // non-critical
      }
    };
    fetchProjectsList();
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Fetch tasks with pagination & filters
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const isSearchActive = Boolean(debouncedSearch.trim());
      const selectedType = typeFilter !== 'ALL' ? typeFilter : undefined;
      const selectedProject = selectedProjectId !== 'ALL' ? selectedProjectId : undefined;

      const fetchTabTasks = async (pageSize: number, pageNum?: number) => {
        if (currentTab === 'MY_TASKS') {
          return await tasksApi.getMyTasks({
            type: selectedType,
            projectId: selectedProject,
            page: pageNum,
            size: pageSize,
            sort: 'createdAt,desc',
          });
        }
        if (currentTab === 'DONE') {
          return await tasksApi.listTasks({
            completedByMe: true,
            status: 'DONE',
            type: selectedType,
            projectId: selectedProject,
            page: pageNum,
            size: pageSize,
            sort: 'createdAt,desc',
          });
        }
        if (currentTab === 'PENDING') {
          return await tasksApi.listTasks({
            status: 'PENDING_CONFIRMATION',
            type: selectedType,
            projectId: selectedProject,
            page: pageNum,
            size: pageSize,
            sort: 'createdAt,desc',
          });
        }
        return await tasksApi.listTasks({
          type: selectedType,
          projectId: selectedProject,
          page: pageNum,
          size: pageSize,
          sort: 'createdAt,desc',
        });
      };

      if (isSearchActive) {
        const res: any = await fetchTabTasks(100);
        const allItems: TaskDto[] = res.content || (Array.isArray(res) ? res : []);
        const query = debouncedSearch.trim().toLowerCase();

        const filtered = allItems.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
        );

        const start = page * 10;
        setTasks(filtered.slice(start, start + 10));
        setTotalElements(filtered.length);
        setTotalPages(Math.ceil(filtered.length / 10) || 1);
      } else {
        const res: any = await fetchTabTasks(10, page);
        const items = res.content || [];
        setTasks(items);
        setTotalElements(res.page?.totalElements ?? res.totalElements ?? items.length);
        setTotalPages(res.page?.totalPages ?? res.totalPages ?? 1);
      }
    } catch {
      toast.error('Impossible de charger les tâches.');
    } finally {
      setIsLoading(false);
    }
  }, [currentTab, typeFilter, selectedProjectId, debouncedSearch, page, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Actions
  const handleTaskCreated = (_newTask: TaskFullDto) => {
    fetchTasks();
    fetchCounts();
    toast.success('Nouvelle tâche créée avec succès !');
    setIsCreateTaskOpen(false);
  };

  const handleTaskUpdated = (updatedTask: TaskDto) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setAffiliationModalTask((current) =>
      current && current.id === updatedTask.id ? updatedTask : current
    );
  };

  const handleRequestJoin = async (task: TaskDto) => {
    setIsJoiningTaskId(task.id);
    const optimisticTask: TaskDto = {
      ...task,
      hasPendingAffiliationRequest: true,
      hasRequestedAffiliation: true,
    };
    handleTaskUpdated(optimisticTask);

    try {
      await tasksApi.requestAffiliation(task.id);
      toast.success('Demande de participation transmise');
      const updated = await tasksApi.getTaskById(task.id);
      handleTaskUpdated(updated);
      fetchCounts();
    } catch (err: any) {
      handleTaskUpdated(task);
      toast.error(
        err.response?.data?.message || 'Erreur lors de la demande de participation.'
      );
    } finally {
      setIsJoiningTaskId(null);
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
          fetchCounts();
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
      fetchCounts();
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
      fetchCounts();
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
          fetchCounts();
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
            onClick={() => {
              fetchTasks();
              fetchCounts();
            }}
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
          onClick={() => handleTabChange('ALL')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 border-b-2 ${
            currentTab === 'ALL'
              ? 'border-wassal-plum text-wassal-plum bg-wassal-plum/5'
              : 'border-transparent text-wassal-slate hover:text-wassal-plum'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Toutes ({counts.all})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('MY_TASKS')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 border-b-2 ${
            currentTab === 'MY_TASKS'
              ? 'border-wassal-plum text-wassal-plum bg-wassal-plum/5'
              : 'border-transparent text-wassal-slate hover:text-wassal-plum'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Mes affectations ({counts.myTasks})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('PENDING')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 border-b-2 ${
            currentTab === 'PENDING'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-wassal-slate hover:text-amber-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>À valider ({counts.pending})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('DONE')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 border-b-2 ${
            currentTab === 'DONE'
              ? 'border-wassal-green-ink text-wassal-green-ink bg-wassal-green/5'
              : 'border-transparent text-wassal-slate hover:text-wassal-green-ink'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Achevées ({counts.done})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-wassal-border space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="relative sm:col-span-6">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-wassal-slate">
              {isDebouncing || isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-wassal-green-ink" />
              ) : (
                <Search className="w-4 h-4 text-wassal-slate" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Rechercher par intitulé, description..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-wassal-border bg-wassal-bg/30 focus:outline-none focus:ring-2 focus:ring-wassal-green focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-wassal-slate hover:text-wassal-plum p-0.5 rounded-full transition-colors"
                title="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <Select
              value={typeFilter}
              onValueChange={(val) => handleTypeChange(val as 'ALL' | TaskType)}
            >
              <SelectTrigger className="w-full h-10 px-3 text-xs rounded-xl border border-wassal-border bg-white text-wassal-plum font-medium focus:ring-2 focus:ring-wassal-green">
                <SelectValue placeholder="Tous types de tâche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous types de tâche</SelectItem>
                <SelectItem value="TASK">Tâches opérationnelles</SelectItem>
                <SelectItem value="COLLECTION">Campagnes de collecte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Filter */}
          <div className="sm:col-span-3">
            <Select
              value={String(selectedProjectId)}
              onValueChange={(val) =>
                handleProjectChange(val === 'ALL' ? 'ALL' : Number(val))
              }
            >
              <SelectTrigger className="w-full h-10 px-3 text-xs rounded-xl border border-wassal-border bg-white text-wassal-plum font-medium focus:ring-2 focus:ring-wassal-green">
                <SelectValue placeholder="Tous les projets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les projets</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-wassal-border p-12 text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-wassal-bg flex items-center justify-center text-wassal-slate mb-3">
            <ListTodo className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-wassal-plum">Aucune tâche trouvée</h3>
          <p className="text-xs text-wassal-slate mt-1 max-w-xs mx-auto">
            {currentTab === 'DONE'
              ? 'Aucune tâche achevée à laquelle vous avez participé.'
              : searchQuery || typeFilter !== 'ALL' || selectedProjectId !== 'ALL' || currentTab !== 'ALL'
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
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isJoining={isJoiningTaskId === task.id}
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

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={10}
          onPageChange={(newPage) => setPage(newPage)}
        />
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
