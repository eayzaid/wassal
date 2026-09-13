import React, { useState, useEffect, useCallback } from 'react';
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
import { Button } from '../../components/ui/button';
import {
  FolderKanban,
  Plus,
  Search,
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';

export const ProjectsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [currentEdition, setCurrentEdition] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');

  // Modals
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [createTaskForProject, setCreateTaskForProject] = useState<ProjectDto | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projectsRes, editionRes] = await Promise.allSettled([
        projectsApi.listProjects(),
        caravaneApi.getCurrentEdition(),
      ]);

      if (projectsRes.status === 'fulfilled') {
        setProjects(projectsRes.value);
      } else {
        toast.error('Impossible de charger les projets.');
      }

      if (editionRes.status === 'fulfilled') {
        setCurrentEdition(editionRes.value.currentEdition);
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectCreated = (newProject: ProjectFullDto) => {
    setProjects((prev) => [newProject, ...prev]);
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

  // Filtering
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length;
  const doneCount = projects.filter((p) => p.status === 'DONE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header with Edition Pill & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-wassal-plum/10 text-wassal-plum">
              <CalendarDays className="w-3.5 h-3.5" />
              Édition {currentEdition}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-wassal-plum tracking-tight">
            Projets & Initiatives
          </h1>
          <p className="text-xs sm:text-sm text-wassal-slate mt-0.5">
            Suivi des projets stratégiques et campagnes de Caravane El Hayat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjects}
            disabled={isLoading}
            className="h-10 text-wassal-slate hover:text-wassal-plum"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {canCreateProject(user?.role) && (
            <Button
              variant="default"
              size="default"
              onClick={() => setIsCreateProjectOpen(true)}
              className="h-10 px-4 gap-2 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Projet</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-wassal-border space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-wassal-slate" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un projet par titre ou mot-clé..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-wassal-border bg-wassal-bg/30 focus:outline-none focus:ring-2 focus:ring-wassal-green focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-wassal-plum text-white shadow-xs'
                  : 'bg-wassal-bg text-wassal-slate hover:text-wassal-plum'
              }`}
            >
              Tous ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-wassal-green-ink text-white shadow-xs'
                  : 'bg-wassal-bg text-wassal-slate hover:text-wassal-green-ink'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>En cours ({activeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DONE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === 'DONE'
                  ? 'bg-gray-700 text-white shadow-xs'
                  : 'bg-wassal-bg text-wassal-slate hover:text-gray-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Clôturés ({doneCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-wassal-border p-12 text-center max-w-md mx-auto my-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-wassal-bg flex items-center justify-center text-wassal-slate mb-3">
            <FolderKanban className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-wassal-plum">Aucun projet trouvé</h3>
          <p className="text-xs text-wassal-slate mt-1 max-w-xs mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Aucun projet ne correspond à vos critères de recherche.'
              : "Aucun projet n'est actuellement enregistré pour cette édition."}
          </p>
          {canCreateProject(user?.role) && !searchQuery && statusFilter === 'ALL' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateProjectOpen(true)}
              className="mt-4 gap-2 bg-wassal-green-ink text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Créer le premier projet</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewDetails={(id) => navigate(`/projects/${id}`)}
              onAddTask={(p) => setCreateTaskForProject(p)}
            />
          ))}
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
