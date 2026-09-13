import React from 'react';
import { Role } from '../../types';
import { formatRole } from '../../utils/formatters';
import { Badge } from '../ui/badge';
import { ShieldCheck, Award, Users, UserCheck, User } from 'lucide-react';

interface RoleBadgeProps {
  role?: Role;
  size?: 'sm' | 'md';
  onDark?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  onDark = false,
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  const getRoleConfig = (r?: Role, dark?: boolean) => {
    if (dark) {
      switch (r) {
        case 'PRESIDENT':
          return {
            icon: <ShieldCheck className="w-3 h-3 text-wassal-green" />,
            classes: 'bg-wassal-green/20 text-wassal-green border-wassal-green/40 font-semibold',
          };
        case 'VICE_PRESIDENT':
          return {
            icon: <Award className="w-3 h-3 text-wassal-sage" />,
            classes: 'bg-wassal-sage/20 text-wassal-sage border-wassal-sage/40 font-medium',
          };
        case 'RH':
          return {
            icon: <UserCheck className="w-3 h-3 text-emerald-300" />,
            classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-medium',
          };
        case 'TEAM_LEADER':
          return {
            icon: <Users className="w-3 h-3 text-sky-300" />,
            classes: 'bg-sky-500/20 text-sky-300 border-sky-500/30 font-medium',
          };
        case 'MEMBER':
        default:
          return {
            icon: <User className="w-3 h-3 text-gray-300" />,
            classes: 'bg-white/10 text-gray-200 border-white/20 font-normal',
          };
      }
    }

    switch (r) {
      case 'PRESIDENT':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-wassal-green-ink" />,
          classes: 'bg-wassal-green/15 text-wassal-green-ink border-wassal-green-ink/30 font-semibold',
        };
      case 'VICE_PRESIDENT':
        return {
          icon: <Award className="w-3 h-3 text-wassal-sage-deep" />,
          classes: 'bg-wassal-sage/20 text-wassal-sage-deep border-wassal-sage-deep/30 font-medium',
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

  const config = getRoleConfig(role, onDark);

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center rounded-md border ${config.classes} ${sizeClasses} ${className}`}
    >
      {config.icon}
      <span>{formatRole(role)}</span>
    </Badge>
  );
};
