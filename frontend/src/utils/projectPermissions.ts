import { Role, UserSummaryDto, ProjectDto, TaskDto } from '../types';

export const isProjectAdmin = (role?: Role): boolean => {
  // Only President and Vice-President are executive project administrators.
  // RH is strictly limited to User Management (HR) and does NOT have project admin rights.
  return role === 'PRESIDENT' || role === 'VICE_PRESIDENT';
};

export const canCreateProject = (role?: Role): boolean => {
  // Only President, Vice-President, and Team Leader can create projects.
  return isProjectAdmin(role) || role === 'TEAM_LEADER';
};

export const canCreateTask = (role?: Role): boolean => {
  // Only President, Vice-President, and Team Leader can create tasks.
  return isProjectAdmin(role) || role === 'TEAM_LEADER';
};

export const canManageProject = (
  user: UserSummaryDto | null,
  project: ProjectDto | null
): boolean => {
  if (!user || !project) return false;
  if (user.role === 'MEMBER' || user.role === 'RH') return false;
  return isProjectAdmin(user.role) || (user.role === 'TEAM_LEADER' && project.ownerId === user.id);
};

export const canManageTask = (
  user: UserSummaryDto | null,
  task: TaskDto | null
): boolean => {
  if (!user || !task) return false;
  // A regular member or RH can NEVER manage tasks
  if (user.role === 'MEMBER' || user.role === 'RH') return false;
  return isProjectAdmin(user.role) || (user.role === 'TEAM_LEADER' && task.ownerId === user.id);
};

export const canViewPoints = (
  user: UserSummaryDto | null,
  taskOrProject: { ownerId: number } | null
): boolean => {
  if (!user || !taskOrProject) return false;
  return isProjectAdmin(user.role) || taskOrProject.ownerId === user.id;
};

export const isAffiliatedWithTask = (
  userId: number | undefined,
  task: TaskDto | null
): boolean => {
  if (!userId || !task || !task.activeMembers) return false;
  return task.activeMembers.some(
    (member) => member.userId === userId || member.id === userId
  );
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
  // A task can ONLY be confirmed/rejected when it is in PENDING_CONFIRMATION status!
  if (task.status !== 'PENDING_CONFIRMATION') return false;
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
