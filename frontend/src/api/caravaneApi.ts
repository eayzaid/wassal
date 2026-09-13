import { apiClient } from './client';
import {
  CurrentEditionResponse,
  PointsSummaryDto,
  TransferPresidencyRequest,
  MessageResponse,
} from '../types';

export const caravaneApi = {
  getCurrentEdition: async (): Promise<CurrentEditionResponse> => {
    const response = await apiClient.get<CurrentEditionResponse>('/caravane/current-edition');
    return response.data;
  },

  getPointsSummary: async (userId: number): Promise<PointsSummaryDto> => {
    const response = await apiClient.get<PointsSummaryDto>(`/users/${userId}/points-summary`);
    return response.data;
  },

  transferPresidency: async (payload: TransferPresidencyRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/admin/president/transfer', payload);
    return response.data;
  },

  incrementEditionAndTransfer: async (
    payload: TransferPresidencyRequest
  ): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      '/admin/president/increment-edition',
      payload
    );
    return response.data;
  },
};
