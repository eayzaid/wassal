import { apiClient } from './client';
import {
  ProjectDto,
  ProjectFullDto,
  CreateProjectRequest,
  CreateTaskRequest,
  TaskFullDto,
  ProjectStatus,
  PageResponse,
  ProjectSummaryDto,
  ProjectSummaryParams,
} from '../types';

export interface ProjectFilterParams {
  edition?: number;
  status?: ProjectStatus;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const projectsApi = {
  getSummary: async (params?: ProjectSummaryParams): Promise<ProjectSummaryDto> => {
    const cleanParams: Record<string, number> = {};
    if (params?.edition !== undefined) cleanParams.edition = params.edition;

    const response = await apiClient.get<ProjectSummaryDto>('/projects/summary', { params: cleanParams });
    return response.data;
  },

  listProjects: async (params?: ProjectFilterParams): Promise<PageResponse<ProjectDto>> => {
    const cleanParams: Record<string, string | number> = {};
    if (params?.edition) cleanParams.edition = params.edition;
    if (params?.status) cleanParams.status = params.status;
    if (params?.search?.trim()) cleanParams.search = params.search.trim();
    if (params?.page !== undefined) cleanParams.page = params.page;
    if (params?.size !== undefined) cleanParams.size = params.size;
    if (params?.sort) cleanParams.sort = params.sort;

    const response = await apiClient.get<PageResponse<ProjectDto>>('/projects', { params: cleanParams });
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
