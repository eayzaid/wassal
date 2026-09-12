export type Role = 'PRESIDENT' | 'VICE_PRESIDENT' | 'RH' | 'TEAM_LEADER' | 'MEMBER';

export type AccountStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface UserSummaryDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  accountStatus: AccountStatus;
  blocked: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeRoleRequest {
  role: Role;
}

export interface UserFilterParams {
  status?: AccountStatus | '';
  role?: Role | '';
  blocked?: boolean | '';
  q?: string;
  page?: number;
  size?: number;
  sort?: string;
}
