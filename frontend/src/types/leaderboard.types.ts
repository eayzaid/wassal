import { Role } from './user.types';

export interface LeaderboardEntryDto {
  rank: number;
  userId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
  points: number;
}

export interface LeaderboardFilterParams {
  limit?: number; // default: 50, max: 100
}
