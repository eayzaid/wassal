import { apiClient } from './client';
import {
  TaskDto,
  TaskFullDto,
  TaskMemberDto,
  AffiliationRequestDto,
  CreateTaskRequest,
  TaskStatus,
  Decision,
  MessageResponse,
} from '../types';

export interface TaskFilterParams {
  edition?: number;
  status?: TaskStatus;
  projectId?: number;
  standalone?: boolean;
  mine?: boolean;
  completedByMe?: boolean;
}

export const tasksApi = {
  listTasks: async (params?: TaskFilterParams): Promise<TaskDto[]> => {
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params?.edition) cleanParams.edition = params.edition;
    if (params?.status) cleanParams.status = params.status;
    if (params?.projectId) cleanParams.projectId = params.projectId;
    if (params?.standalone !== undefined) cleanParams.standalone = params.standalone;
    if (params?.mine !== undefined) cleanParams.mine = params.mine;
    if (params?.completedByMe !== undefined) cleanParams.completedByMe = params.completedByMe;

    const response = await apiClient.get<TaskDto[]>('/tasks', { params: cleanParams });
    return response.data;
  },

  getTaskById: async (id: number): Promise<TaskDto> => {
    const response = await apiClient.get<TaskDto>(`/tasks/${id}`);
    return response.data;
  },

  createStandaloneTask: async (payload: CreateTaskRequest): Promise<TaskFullDto> => {
    const response = await apiClient.post<TaskFullDto>('/tasks', payload);
    return response.data;
  },

  deleteTask: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/tasks/${id}`);
    return response.data;
  },

  requestAffiliation: async (taskId: number): Promise<AffiliationRequestDto> => {
    const response = await apiClient.post<AffiliationRequestDto>(`/tasks/${taskId}/affiliation-requests`);
    return response.data;
  },

  listAffiliationRequests: async (taskId: number): Promise<AffiliationRequestDto[]> => {
    const response = await apiClient.get<AffiliationRequestDto[]>(`/tasks/${taskId}/affiliation-requests`);
    return response.data;
  },

  handleAffiliationDecision: async (
    taskId: number,
    requestId: number,
    decision: Decision
  ): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      `/tasks/${taskId}/affiliation-requests/${requestId}/decision`,
      { decision }
    );
    return response.data;
  },

  directAssignMember: async (taskId: number, userId: number): Promise<TaskMemberDto> => {
    const response = await apiClient.post<TaskMemberDto>(`/tasks/${taskId}/affiliations`, {
      userId,
    });
    return response.data;
  },

  unaffiliateMember: async (taskId: number, userId: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(
      `/tasks/${taskId}/affiliations/${userId}`
    );
    return response.data;
  },

  listActiveAffiliations: async (taskId: number): Promise<TaskMemberDto[]> => {
    const response = await apiClient.get<TaskMemberDto[]>(`/tasks/${taskId}/affiliations`);
    return response.data;
  },

  requestDone: async (taskId: number): Promise<TaskDto> => {
    const response = await apiClient.post<TaskDto>(`/tasks/${taskId}/request-done`);
    return response.data;
  },

  confirmDone: async (taskId: number): Promise<TaskDto> => {
    const response = await apiClient.post<TaskDto>(`/tasks/${taskId}/confirm-done`);
    return response.data;
  },

  rejectDone: async (taskId: number): Promise<TaskDto> => {
    const response = await apiClient.post<TaskDto>(`/tasks/${taskId}/reject-done`);
    return response.data;
  },
};
