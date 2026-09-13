import { apiClient } from './client';
import {
  ProjectDto,
  ProjectFullDto,
  CreateProjectRequest,
  CreateTaskRequest,
  TaskFullDto,
  ProjectStatus,
} from '../types';

export interface ProjectFilterParams {
  edition?: number;
  status?: ProjectStatus;
  search?: string;
}

export const projectsApi = {
  listProjects: async (params?: ProjectFilterParams): Promise<ProjectDto[]> => {
    const cleanParams: Record<string, string | number> = {};
    if (params?.edition) cleanParams.edition = params.edition;
    if (params?.status) cleanParams.status = params.status;
    if (params?.search?.trim()) cleanParams.search = params.search.trim();

    const response = await apiClient.get<ProjectDto[]>('/projects', { params: cleanParams });
    return response.data;
  },

  getProjectById: async (id: number): Promise<ProjectDto> => {
    const response = await apiClient.get<ProjectDto>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (payload: CreateProjectRequest): Promise<ProjectFullDto> => {
    const response = await apiClient.post<ProjectFullDto>('/projects', payload);
    return response.data;
  },

  createTaskUnderProject: async (
    projectId: number,
    payload: CreateTaskRequest
  ): Promise<TaskFullDto> => {
    const response = await apiClient.post<TaskFullDto>(`/projects/${projectId}/tasks`, payload);
    return response.data;
  },

  markProjectDone: async (id: number): Promise<ProjectFullDto> => {
    const response = await apiClient.post<ProjectFullDto>(`/projects/${id}/mark-done`);
    return response.data;
  },
};
