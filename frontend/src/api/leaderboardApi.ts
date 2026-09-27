import { apiClient } from './client';
import { LeaderboardEntryDto, LeaderboardFilterParams } from '../types';

export const leaderboardApi = {
  async getLeaderboard(params?: LeaderboardFilterParams): Promise<LeaderboardEntryDto[]> {
    const response = await apiClient.get<LeaderboardEntryDto[]>('/leaderboard', { params });
    return response.data;
  },

  async exportCsv(): Promise<Blob> {
    const response = await apiClient.get('/leaderboard/export-csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  async downloadPointsCsv(filename = 'wassal-users-points-report.csv'): Promise<void> {
    const blob = await this.exportCsv();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
