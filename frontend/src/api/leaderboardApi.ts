import { apiClient } from './client';
import { LeaderboardEntryDto, LeaderboardFilterParams } from '../types';

export const leaderboardApi = {
  /**
   * Fetch top ranking members by points (default: top 50).
   * Open to all authenticated users.
   */
  getLeaderboard: async (params?: LeaderboardFilterParams): Promise<LeaderboardEntryDto[]> => {
    const response = await apiClient.get<LeaderboardEntryDto[]>('/leaderboard', { params });
    return response.data;
  },

  /**
   * Download CSV containing all registered users in the platform and their accumulated points.
   * Native UTF-8 BOM encoding for seamless Microsoft Excel & Google Sheets rendering.
   */
  downloadUsersPointsCsv: async (filename = 'wassal-users-points-report.csv'): Promise<void> => {
    const response = await apiClient.get('/leaderboard/export-csv', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Admin-tier download endpoint (equivalent data, routed under admin directory permissions).
   */
  downloadAdminUsersPointsCsv: async (filename = 'wassal-users-points-report.csv'): Promise<void> => {
    const response = await apiClient.get('/admin/users/export-csv', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Alias for downloadUsersPointsCsv for backwards compatibility.
   */
  downloadPointsCsv: async (filename = 'wassal-users-points-report.csv'): Promise<void> => {
    return leaderboardApi.downloadUsersPointsCsv(filename);
  },

  /**
   * Fetch raw CSV Blob directly.
   */
  exportCsv: async (): Promise<Blob> => {
    const response = await apiClient.get('/leaderboard/export-csv', {
      responseType: 'blob',
    });
    return response.data;
  },
};
