import { apiClient } from './client';
import {
  UserSummaryDto,
  UpdateProfileRequest,
  ChangePasswordRequest,
  MessageResponse,
} from '../types';

export const profileApi = {
  async getMyProfile(): Promise<UserSummaryDto> {
    const response = await apiClient.get<UserSummaryDto>('/users/me');
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserSummaryDto> {
    const response = await apiClient.put<UserSummaryDto>('/users/me', data);
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<MessageResponse> {
    const response = await apiClient.put<MessageResponse>('/users/me/password', data);
    return response.data;
  },
};
