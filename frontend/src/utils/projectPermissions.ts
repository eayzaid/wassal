import { Role, UserSummaryDto, ProjectDto, TaskDto } from '../types';
import { isAdminTier } from './permissions';

export const canCreateProject = (role?: Role): boolean => {
  // Only President, Vice-President, and Team Leader can create projects.
  // RH is strictly limited to User Management (HR).
  return role === 'PRESIDENT' || role === 'VICE_PRESIDENT' || role === 'TEAM_LEADER';
};

export const canCreateTask = (role?: Role): boolean => {
  // Only President, Vice-President, and Team Leader can create tasks.
  // RH is strictly limited to User Management (HR).
  return role === 'PRESIDENT' || role === 'VICE_PRESIDENT' || role === 'TEAM_LEADER';
};

export const canManageProject = (
  user: UserSummaryDto | null,
  project: ProjectDto | null
): boolean => {
  if (!user || !project) return false;
  return isAdminTier(user.role) || project.ownerId === user.id;
};

export const canManageTask = (
  user: UserSummaryDto | null,
  task: TaskDto | null
): boolean => {
  if (!user || !task) return false;
  return isAdminTier(user.role) || task.ownerId === user.id;
};

export const canViewPoints = (
  user: UserSummaryDto | null,
  taskOrProject: { ownerId: number } | null
): boolean => {
  if (!user || !taskOrProject) return false;
  return isAdminTier(user.role) || taskOrProject.ownerId === user.id;
};

export const isAffiliatedWithTask = (
  userId: number | undefined,
  task: TaskDto | null
): boolean => {
  if (!userId || !task) return false;
  return task.activeMembers.some((member) => member.userId === userId);
};

export const canRequestDone = (
  user: UserSummaryDto | null,
  task: TaskDto | null
): boolean => {
  if (!user || !task) return false;
  if (task.status !== 'PENDING') return false;
  return isAffiliatedWithTask(user.id, task);
};

export const canConfirmDone = (
  user: UserSummaryDto | null,
  task: TaskDto | null
): boolean => {
  if (!user || !task) return false;
  if (task.status !== 'PENDING_CONFIRMATION' && task.status !== 'PENDING') return false;
  return canManageTask(user, task);
};

export const canJoinTask = (
  user: UserSummaryDto | null,
  task: TaskDto | null
): boolean => {
  if (!user || !task) return false;
  if (task.status === 'DONE') return false;
  if (task.hasPendingAffiliationRequest || task.hasRequestedAffiliation) return false;
  return !isAffiliatedWithTask(user.id, task);
};

export const canAccessDangerZone = (role?: Role): boolean => {
  return role === 'PRESIDENT';
};
