import { apiClient, setAccessToken } from './client';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  MessageResponse,
  UserSummaryDto,
} from '../types';

export const authApi = {
  async register(data: RegisterRequest): Promise<UserSummaryDto> {
    const response = await apiClient.post<UserSummaryDto>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  async refresh(): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/refresh');
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>('/auth/forgot-password', data);
    return response.data;
  },

  async verifyResetCode(data: VerifyResetCodeRequest): Promise<VerifyResetCodeResponse> {
    const response = await apiClient.post<VerifyResetCodeResponse>('/auth/verify-reset-code', data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse>('/auth/reset-password', data);
    return response.data;
  },
};
