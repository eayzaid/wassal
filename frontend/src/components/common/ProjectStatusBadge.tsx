import React from 'react';
import { ProjectStatus } from '../../types';
import { Badge } from '../ui/badge';
import { Activity, CheckCircle2 } from 'lucide-react';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'default';
  className?: string;
}

export const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = ({
  status,
  size = 'default',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'ACTIVE':
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-wassal-green-ink border-wassal-green-ink/30 gap-1.5 font-bold ${sizeClasses} ${className}`}
        >
          <Activity className="w-3 h-3 text-wassal-green-ink" />
          <span>En cours</span>
        </Badge>
      );
    case 'DONE':
      return (
        <Badge
          variant="outline"
          className={`bg-gray-100 text-wassal-slate border-wassal-border gap-1.5 font-semibold ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-wassal-slate" />
          <span>Clôturé</span>
        </Badge>
      );
    default:
      return null;
  }
};
