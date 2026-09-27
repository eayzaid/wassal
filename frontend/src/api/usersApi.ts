import { apiClient } from './client';
import {
  UserSummaryDto,
  UserCountsSummaryDto,
  UserFilterParams,
  PageResponse,
  ChangeRoleRequest,
} from '../types';

export const usersApi = {
  async getSummary(): Promise<UserCountsSummaryDto> {
    const response = await apiClient.get<UserCountsSummaryDto>('/admin/users/summary');
    return response.data;
  },

  async listUsers(params: UserFilterParams = {}): Promise<PageResponse<UserSummaryDto>> {
    const cleanParams: Record<string, string | number | boolean> = {};

    if (params.status) cleanParams.status = params.status;
    if (params.role) cleanParams.role = params.role;
    if (params.blocked !== undefined && params.blocked !== '') {
      cleanParams.blocked = params.blocked;
    }
    if (params.q?.trim()) cleanParams.q = params.q.trim();
    if (params.page !== undefined) cleanParams.page = params.page;
    if (params.size !== undefined) cleanParams.size = params.size;
    if (params.sort) cleanParams.sort = params.sort;

    const response = await apiClient.get<PageResponse<UserSummaryDto>>('/admin/users', {
      params: cleanParams,
    });
    return response.data;
  },

  async getUserById(id: number): Promise<UserSummaryDto> {
    const response = await apiClient.get<UserSummaryDto>(`/admin/users/${id}`);
    return response.data;
  },

  async approveUser(id: number): Promise<UserSummaryDto> {
    const response = await apiClient.patch<UserSummaryDto>(`/admin/users/${id}/approve`);
    return response.data;
  },

  async rejectUser(id: number): Promise<UserSummaryDto> {
    const response = await apiClient.patch<UserSummaryDto>(`/admin/users/${id}/reject`);
    return response.data;
  },

  async changeRole(id: number, data: ChangeRoleRequest): Promise<UserSummaryDto> {
    const response = await apiClient.patch<UserSummaryDto>(`/admin/users/${id}/role`, data);
    return response.data;
  },

  async blockUser(id: number): Promise<UserSummaryDto> {
    const response = await apiClient.patch<UserSummaryDto>(`/admin/users/${id}/block`);
    return response.data;
  },

  async unblockUser(id: number): Promise<UserSummaryDto> {
    const response = await apiClient.patch<UserSummaryDto>(`/admin/users/${id}/unblock`);
    return response.data;
  },
};
