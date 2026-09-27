import { apiClient } from './client';
import {
  PostDto,
  CreatePostRequest,
  UpdatePostRequest,
  PostFilterParams,
  PageResponse,
  PollSummaryDto,
} from '../types';

export const postsApi = {
  listPosts: async (params?: PostFilterParams): Promise<PageResponse<PostDto>> => {
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params?.type) cleanParams.type = params.type;
    if (params?.authorId) cleanParams.authorId = params.authorId;
    if (params?.sort) cleanParams.sort = params.sort;
    if (params?.archived !== undefined) cleanParams.archived = params.archived;
    if (params?.page !== undefined) cleanParams.page = params.page;
    if (params?.size !== undefined) cleanParams.size = params.size;

    const response = await apiClient.get<PageResponse<PostDto>>('/posts', { params: cleanParams });
    return response.data;
  },

  getPostById: async (id: number): Promise<PostDto> => {
    const response = await apiClient.get<PostDto>(`/posts/${id}`);
    return response.data;
  },

  createPost: async (payload: CreatePostRequest): Promise<PostDto> => {
    const response = await apiClient.post<PostDto>('/posts', payload);
    return response.data;
  },

  updatePost: async (id: number, payload: UpdatePostRequest): Promise<PostDto> => {
    const response = await apiClient.patch<PostDto>(`/posts/${id}`, payload);
    return response.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await apiClient.delete(`/posts/${id}`);
  },

  setPinned: async (id: number, pinned: boolean): Promise<PostDto> => {
    const response = await apiClient.patch<PostDto>(`/posts/${id}/pin`, { pinned });
    return response.data;
  },

  vote: async (id: number, voteType: 'LIKE' | 'DISLIKE'): Promise<void> => {
    await apiClient.put(`/posts/${id}/vote`, { voteType });
  },

  removeVote: async (id: number): Promise<void> => {
    await apiClient.delete(`/posts/${id}/vote`);
  },

  submitPollSelections: async (id: number, optionIds: number[]): Promise<PollSummaryDto> => {
    const response = await apiClient.put<PollSummaryDto>(`/posts/${id}/poll/selections`, { optionIds });
    return response.data;
  },

  getPollResults: async (id: number): Promise<PollSummaryDto> => {
    const response = await apiClient.get<PollSummaryDto>(`/posts/${id}/poll/results`);
    return response.data;
  },
};
