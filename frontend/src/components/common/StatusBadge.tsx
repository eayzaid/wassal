import React from 'react';
import { AccountStatus } from '../../types';
import { Badge } from '../ui/badge';
import { Clock, CheckCircle2, Ban, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status?: AccountStatus;
  blocked?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  blocked = false,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  if (blocked) {
    return (
      <Badge variant="blocked" className={sizeClasses}>
        <Ban className="w-3 h-3 text-wassal-wine" />
        <span>Bloqué</span>
      </Badge>
    );
  }

  switch (status) {
    case 'PENDING_APPROVAL':
      return (
        <Badge variant="pending" className={sizeClasses}>
          <Clock className="w-3 h-3 text-wassal-slate" />
          <span>En attente</span>
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="active" className={sizeClasses}>
          <CheckCircle2 className="w-3 h-3 text-wassal-green-ink" />
          <span>Actif</span>
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="rejected" className={sizeClasses}>
          <XCircle className="w-3 h-3 text-wassal-plum" />
          <span>Rejeté</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={sizeClasses}>
          <span>—</span>
        </Badge>
      );
  }
};
