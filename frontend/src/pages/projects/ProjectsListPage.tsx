import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/projectsApi';
import { caravaneApi } from '../../api/caravaneApi';
import { ProjectDto, ProjectStatus, ProjectFullDto, TaskFullDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { canCreateProject } from '../../utils/projectPermissions';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/button';
import {
  FolderKanban,
  Plus,
  Search,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  CalendarDays,
  Loader2,
  X,
} from 'lucide-react';

export const ProjectsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [currentEdition, setCurrentEdition] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');
  const [counts, setCounts] = useState<{ all: number; active: number; done: number }>({
    all: 0,
    active: 0,
    done: 0,
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [createTaskForProject, setCreateTaskForProject] = useState<ProjectDto | null>(null);

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

  const handleStatusChange = (newStatus: 'ALL' | ProjectStatus) => {
    setStatusFilter(newStatus);
    setPage(0);
  };

  const fetchCounts = useCallback(async (edition: number) => {
    try {
      const summary = await projectsApi.getSummary({ edition });
      setCounts({
        all: summary.all,
        active: summary.active,
        done: summary.done,
      });
    } catch {
      // non-critical
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await projectsApi.listProjects({
        edition: currentEdition,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: debouncedSearch || undefined,
        page,
        size: 10,
        sort: 'createdAt,desc',
      });
      const items = res.content || [];
      setProjects(items);
      const total = res.page?.totalElements ?? res.totalElements ?? items.length;
      const pages = res.page?.totalPages ?? res.totalPages ?? 1;
      setTotalElements(total);
      setTotalPages(pages);
    } catch {
      toast.error('Impossible de charger les projets.');
    } finally {
      setIsLoading(false);
    }
  }, [currentEdition, statusFilter, debouncedSearch, page, toast]);

  // Initial load: current edition & counts
  useEffect(() => {
    const init = async () => {
      try {
        const editionRes = await caravaneApi.getCurrentEdition();
        setCurrentEdition(editionRes.currentEdition);
        fetchCounts(editionRes.currentEdition);
      } catch {
        fetchCounts(1);
      }
    };
    init();
  }, [fetchCounts]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleRefresh = () => {
    fetchProjects();
    fetchCounts(currentEdition);
  };

  const handleProjectCreated = (_newProject: ProjectFullDto) => {
    fetchProjects();
    fetchCounts(currentEdition);
    toast.success('Nouveau projet créé avec succès !');
  };

  const handleTaskCreated = (newTask: TaskFullDto) => {
    if (newTask.projectId) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === newTask.projectId
            ? { ...p, tasks: [...(p.tasks || []), newTask] }
            : p
        )
      );
    }
    setCreateTaskForProject(null);
    toast.success('Tâche ajoutée avec succès au projet !');
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0 max-w-full pb-12">
      {/* Header with Edition Pill & Primary CTA */}
      <div className="flex items-center justify-between gap-3 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-wassal-plum/10 text-wassal-plum shrink-0">
              <CalendarDays className="w-3 h-3" />
              Édition {currentEdition}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading text-wassal-plum tracking-tight truncate">
            Projets & Initiatives
          </h1>
          <p className="text-xs sm:text-sm text-wassal-slate mt-0.5 truncate">
            Suivi des projets stratégiques et campagnes de Caravane El Hayat
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9 w-9 p-0 text-wassal-slate hover:text-wassal-plum rounded-xl border-wassal-border shrink-0"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {canCreateProject(user?.role) && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateProjectOpen(true)}
              className="h-9 px-3 sm:px-4 gap-1.5 sm:gap-2 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-bold shadow-sm rounded-xl text-xs sm:text-sm shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Nouveau</span>
              <span>Projet</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-wassal-border shadow-xs w-full min-w-0">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full min-w-0">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
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
              placeholder="Rechercher un projet par titre ou mot-clé..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-wassal-border bg-wassal-bg/30 focus:outline-none focus:ring-2 focus:ring-wassal-green focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-wassal-slate hover:text-wassal-plum p-0.5 rounded-full transition-colors"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs (3 buttons) */}
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handleStatusChange('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold text-center transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-wassal-plum text-white shadow-xs'
                  : 'bg-wassal-bg text-wassal-slate hover:text-wassal-plum'
              }`}
            >
              Tous ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('ACTIVE')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-wassal-green-ink text-white shadow-xs'
                  : 'bg-wassal-bg text-wassal-slate hover:text-wassal-green-ink'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">En cours ({counts.active})</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('DONE')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                statusFilter === 'DONE'
                  ? 'bg-gray-700 text-white shadow-xs'
                  : 'bg-wassal-bg text-wassal-slate hover:text-gray-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Clôturés ({counts.done})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-wassal-border p-5 h-64 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-12 bg-gray-100 rounded" />
              </div>
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-wassal-border p-8 sm:p-14 text-center w-full my-4 sm:my-6 flex flex-col items-center justify-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-wassal-bg flex items-center justify-center text-wassal-slate mb-3">
            <FolderKanban className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-wassal-plum">Aucun projet trouvé</h3>
          <p className="text-xs sm:text-sm text-wassal-slate mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Aucun projet ne correspond à vos critères de recherche.'
              : "Aucun projet n'est actuellement enregistré pour cette édition."}
          </p>
          {canCreateProject(user?.role) && !searchQuery && statusFilter === 'ALL' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateProjectOpen(true)}
              className="mt-4 gap-2 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white rounded-xl font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Créer le premier projet</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4 w-full min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetails={(id) => navigate(`/projects/${id}`)}
                onAddTask={(p) => setCreateTaskForProject(p)}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={10}
            onPageChange={(newPage) => setPage(newPage)}
            itemName="projets"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSuccess={handleProjectCreated}
      />

      {createTaskForProject && (
        <CreateTaskModal
          isOpen={!!createTaskForProject}
          onClose={() => setCreateTaskForProject(null)}
          projectId={createTaskForProject.id}
          projectTitle={createTaskForProject.title}
          onSuccess={handleTaskCreated}
        />
      )}
    </div>
  );
};
