import { Role, UserSummaryDto } from '../types';

export const isAdminTier = (role?: Role): boolean => {
  return role === 'PRESIDENT' || role === 'VICE_PRESIDENT' || role === 'RH';
};

export const canManageTarget = (actor: UserSummaryDto | null, target: UserSummaryDto): {
  allowed: boolean;
  reason?: string;
} => {
  if (!actor) return { allowed: false, reason: 'Non authentifié' };
  if (actor.id === target.id) {
    return { allowed: false, reason: 'Vous ne pouvez pas effectuer cette action sur vous-même (BR-8).' };
  }
  if (!isAdminTier(actor.role)) {
    return { allowed: false, reason: 'Privilèges administrateur requis.' };
  }
  if (target.role === 'PRESIDENT' || target.role === 'VICE_PRESIDENT') {
    if (actor.role !== 'PRESIDENT') {
      return { allowed: false, reason: 'Seul le Président peut modifier un Président ou Vice-Président (BR-9).' };
    }
  }
  return { allowed: true };
};

export const getAssignableRoles = (actor: UserSummaryDto | null, target: UserSummaryDto): Role[] => {
  if (!actor || actor.id === target.id || !isAdminTier(actor.role)) {
    return [];
  }

  // If target is PRESIDENT or VICE_PRESIDENT, only PRESIDENT can change their role
  if ((target.role === 'PRESIDENT' || target.role === 'VICE_PRESIDENT') && actor.role !== 'PRESIDENT') {
    return [];
  }

  const allRoles: Role[] = ['PRESIDENT', 'VICE_PRESIDENT', 'RH', 'TEAM_LEADER', 'MEMBER'];

  return allRoles.filter((roleOption) => {
    // Cannot assign own current role as a change
    if (roleOption === target.role) return false;

    // BR-13: RH cannot assign PRESIDENT, VICE_PRESIDENT, or RH
    if (actor.role === 'RH') {
      if (roleOption === 'PRESIDENT' || roleOption === 'VICE_PRESIDENT' || roleOption === 'RH') {
        return false;
      }
    }

    // Vice-President cannot assign President or Vice-President
    if (actor.role === 'VICE_PRESIDENT') {
      if (roleOption === 'PRESIDENT' || roleOption === 'VICE_PRESIDENT') {
        return false;
      }
    }

    // BR-6: TEAM_LEADER can ONLY be assigned to an existing MEMBER
    if (roleOption === 'TEAM_LEADER' && target.role !== 'MEMBER') {
      return false;
    }

    return true;
  });
};
