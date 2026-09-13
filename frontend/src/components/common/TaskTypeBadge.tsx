import React from 'react';
import { TaskType } from '../../types';
import { Badge } from '../ui/badge';
import { Package, CheckSquare } from 'lucide-react';

interface TaskTypeBadgeProps {
  type: TaskType;
  size?: 'sm' | 'default';
  className?: string;
}

export const TaskTypeBadge: React.FC<TaskTypeBadgeProps> = ({
  type,
  size = 'default',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (type) {
    case 'COLLECTION':
      return (
        <Badge
          variant="outline"
          className={`bg-wassal-plum/10 text-wassal-plum border-wassal-plum/20 gap-1 font-semibold ${sizeClasses} ${className}`}
        >
          <Package className="w-3 h-3 text-wassal-plum" />
          <span>Collecte</span>
        </Badge>
      );
    case 'TASK':
      return (
        <Badge
          variant="outline"
          className={`bg-wassal-sage/15 text-wassal-sage-deep border-wassal-sage/30 gap-1 font-semibold ${sizeClasses} ${className}`}
        >
          <CheckSquare className="w-3 h-3 text-wassal-sage-deep" />
          <span>Mission</span>
        </Badge>
      );
    default:
      return null;
  }
};
