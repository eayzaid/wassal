export type PostType = 'REGULAR' | 'POLL';
export type VoteType = 'LIKE' | 'DISLIKE';

export interface CreatePostRequest {
  type: PostType;
  title: string;
  content: string; // Raw Markdown source text
  pollCloseDate?: string; // ISO 8601 timestamp (required if type == 'POLL')
  pollOptions?: string[]; // Min size 2 (required if type == 'POLL')
}

export interface UpdatePostRequest {
  title: string;
  content: string; // Raw Markdown source text
}

export interface PinPostRequest {
  pinned: boolean;
}

export interface VoteRequest {
  voteType: VoteType;
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: number | null; // null for top-level comment, ID for reply
}

export interface UpdateCommentRequest {
  content: string;
}

export interface PollSelectionRequest {
  optionIds: number[];
}

export interface PollOptionResultDto {
  optionId: number;
  text: string;
  voteCount: number;
  selectedByMe: boolean;
}

export interface PollSummaryDto {
  closeDate: string; // ISO 8601 timestamp
  closed: boolean;
  totalVoters: number;
  options: PollOptionResultDto[];
}

export interface PostDto {
  id: number;
  type: PostType;
  title: string;
  content: string; // Raw Markdown source text
  authorName: string;
  pinned: boolean;
  isArchived: boolean;
  archived: boolean; // Alias of isArchived
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  likeCount: number;
  dislikeCount: number;
  myVote: VoteType | null;
  commentCount: number;
  poll: PollSummaryDto | null;
}

export interface CommentDto {
  id: number;
  postId: number;
  parentCommentId: number | null;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  likeCount: number;
  dislikeCount: number;
  myVote: VoteType | null;
  replyCount: number;
}

export interface PostFilterParams {
  type?: PostType;
  authorId?: number;
  sort?: 'new' | 'top'; // default: 'new'
  archived?: boolean; // default: false (returns active feed; set true to browse archived historical posts)
  page?: number;
  size?: number;
}

export interface CommentFilterParams {
  parentId?: number | null;
  page?: number;
  size?: number;
}
