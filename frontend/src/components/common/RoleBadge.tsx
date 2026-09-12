import React from 'react';
import { Role } from '../../types';
import { formatRole } from '../../utils/formatters';
import { Badge } from '../ui/badge';
import { ShieldCheck, Award, Users, UserCheck, User } from 'lucide-react';

interface RoleBadgeProps {
  role?: Role;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  const getRoleConfig = (r?: Role) => {
    switch (r) {
      case 'PRESIDENT':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-wassal-plum" />,
          classes: 'bg-wassal-plum/10 text-wassal-plum border-wassal-plum/30 font-semibold',
        };
      case 'VICE_PRESIDENT':
        return {
          icon: <Award className="w-3 h-3 text-wassal-plum" />,
          classes: 'bg-wassal-plum/10 text-wassal-plum border-wassal-plum/25 font-medium',
        };
      case 'RH':
        return {
          icon: <UserCheck className="w-3 h-3 text-wassal-slate" />,
          classes: 'bg-wassal-slate/10 text-wassal-slate border-wassal-slate/25 font-medium',
        };
      case 'TEAM_LEADER':
        return {
          icon: <Users className="w-3 h-3 text-wassal-slate" />,
          classes: 'bg-wassal-slate/10 text-wassal-slate border-wassal-slate/20 font-medium',
        };
      case 'MEMBER':
      default:
        return {
          icon: <User className="w-3 h-3 text-gray-500" />,
          classes: 'bg-gray-100 text-gray-700 border-gray-200 font-normal',
        };
    }
  };

  const config = getRoleConfig(role);

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center rounded-md border ${config.classes} ${sizeClasses}`}
    >
      {config.icon}
      <span>{formatRole(role)}</span>
    </Badge>
  );
};
