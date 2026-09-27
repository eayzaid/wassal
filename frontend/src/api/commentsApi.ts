import { apiClient } from './client';
import {
  CommentDto,
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentFilterParams,
  PageResponse,
} from '../types';

export const commentsApi = {
  listComments: async (postId: number, params?: CommentFilterParams): Promise<PageResponse<CommentDto>> => {
    const cleanParams: Record<string, string | number> = {};
    if (params?.parentId !== undefined && params.parentId !== null) {
      cleanParams.parentId = params.parentId;
    }
    if (params?.page !== undefined) cleanParams.page = params.page;
    if (params?.size !== undefined) cleanParams.size = params.size;

    const response = await apiClient.get<PageResponse<CommentDto>>(`/posts/${postId}/comments`, { params: cleanParams });
    return response.data;
  },

  createComment: async (postId: number, payload: CreateCommentRequest): Promise<CommentDto> => {
    const response = await apiClient.post<CommentDto>(`/posts/${postId}/comments`, payload);
    return response.data;
  },

  updateComment: async (commentId: number, payload: UpdateCommentRequest): Promise<CommentDto> => {
    const response = await apiClient.patch<CommentDto>(`/comments/${commentId}`, payload);
    return response.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },

  vote: async (commentId: number, voteType: 'LIKE' | 'DISLIKE'): Promise<void> => {
    await apiClient.put(`/comments/${commentId}/vote`, { voteType });
  },

  removeVote: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}/vote`);
  },
};
