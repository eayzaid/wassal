import React from 'react';
import { TaskStatus } from '../../types';
import { Badge } from '../ui/badge';
import { Clock, Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'default';
  className?: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  size = 'default',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'UNAFFECTED':
      return (
        <Badge
          variant="outline"
          className={`bg-gray-100/80 text-gray-700 border-gray-300 gap-1.5 font-medium ${sizeClasses} ${className}`}
        >
          <Clock className="w-3 h-3 text-gray-500" />
          <span>Non affectée</span>
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge
          variant="outline"
          className={`bg-blue-50/80 text-wassal-slate border-wassal-slate/30 gap-1.5 font-medium ${sizeClasses} ${className}`}
        >
          <Play className="w-3 h-3 text-wassal-slate" />
          <span>En cours</span>
        </Badge>
      );
    case 'PENDING_CONFIRMATION':
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-800 border-amber-400/80 gap-1.5 font-semibold ${sizeClasses} ${className}`}
        >
          <AlertCircle className="w-3 h-3 text-amber-600 animate-pulse" />
          <span>Validation demandée</span>
        </Badge>
      );
    case 'DONE':
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-wassal-green-ink border-wassal-green-ink/30 gap-1.5 font-bold ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-wassal-green-ink" />
          <span>Terminée</span>
        </Badge>
      );
    default:
      return null;
  }
};
