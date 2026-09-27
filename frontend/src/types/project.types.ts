// Roles & Statuses
export type ProjectStatus = 'ACTIVE' | 'DONE';
export type TaskType = 'COLLECTION' | 'TASK';
export type TaskStatus = 'UNAFFECTED' | 'PENDING' | 'PENDING_CONFIRMATION' | 'DONE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED';
export type Decision = 'APPROVE' | 'DECLINE';

// Projects
export interface ProjectPublicDto {
  id: number;
  title: string;
  description: string;
  expectedEndTime: string;
  createdAt: string;
  ownerId: number;
  ownerName?: string;
  createdBy?: string;
  status: ProjectStatus;
  editionNumber: number;
  tasks: TaskPublicDto[];
}

export interface ProjectFullDto extends ProjectPublicDto {
  totalPoints: number;
  pointsGained: number;
  successPercentage: number;
  tasks: TaskFullDto[];
}

export type ProjectDto = ProjectPublicDto | ProjectFullDto;

export function isProjectFullDto(project: ProjectDto): project is ProjectFullDto {
  return 'totalPoints' in project && typeof (project as ProjectFullDto).totalPoints === 'number';
}

// Tasks
export interface TaskMemberDto {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  affiliatedAt: string;
  doneRequestedAt: string | null;
  pointsAwarded: number | null; // null if masked for regular members
}

export interface TaskPublicDto {
  id: number;
  projectId: number | null;
  ownerId: number;
  ownerName?: string;
  createdBy?: string;
  type: TaskType;
  name: string;
  description: string;
  minRequiredMembers: number;
  status: TaskStatus;
  editionNumber: number;
  createdAt: string;
  updatedAt: string;
  activeMembers: TaskMemberDto[];
  hasPendingAffiliationRequest?: boolean;
  hasRequestedAffiliation?: boolean;
}

export interface TaskFullDto extends TaskPublicDto {
  points: number;
}

export type TaskDto = TaskPublicDto | TaskFullDto;

export function isTaskFullDto(task: TaskDto): task is TaskFullDto {
  return 'points' in task && typeof (task as TaskFullDto).points === 'number';
}

export interface TaskSummaryDto {
  all: number;
  myTasks: number;
  pending: number;
  done: number;
  total?: number;
  pendingConfirmation?: number;
  completed?: number;
}

export interface TaskSummaryParams {
  edition?: number;
  type?: TaskType;
  projectId?: number;
  standalone?: boolean;
}

// Affiliations & Requests
export interface RequesterSummaryDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AffiliationRequestDto {
  id: number;
  taskId: number;
  requester: RequesterSummaryDto;
  requesterActiveAffiliationCount: number;
  status: RequestStatus;
  createdAt: string;
}

// Points & Caravane
export interface PointsSummaryDto {
  userId: number;
  totalPoints: number;
}

export interface CurrentEditionResponse {
  currentEdition: number;
}

// Request Payloads
export interface CreateProjectRequest {
  title: string;
  description: string;
  expectedEndTime: string;
}

export interface CreateTaskRequest {
  type: TaskType;
  name: string;
  description: string;
  points: number;
  minRequiredMembers: number;
}

export interface AffiliateMemberRequest {
  userId: number;
}

export interface AffiliationDecisionRequest {
  decision: Decision;
}

export interface TransferPresidencyRequest {
  newPresidentUserId: number;
}
