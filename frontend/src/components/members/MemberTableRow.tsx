import React from 'react';
import { UserSummaryDto } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { RoleBadge } from '../common/RoleBadge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { formatDate } from '../../utils/formatters';
import { Eye, Check, X } from 'lucide-react';

interface MemberTableRowProps {
  member: UserSummaryDto;
  onSelect: (member: UserSummaryDto) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  isCurrentActor: boolean;
}

export const MemberTableRow: React.FC<MemberTableRowProps> = ({
  member,
  onSelect,
  onApprove,
  onReject,
  isCurrentActor,
}) => {
  const isPending = member.accountStatus === 'PENDING_APPROVAL';

  return (
    <tr className="hover:bg-wassal-bg/60 transition-colors border-b border-wassal-border last:border-0 text-sm">
      {/* Member identity */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0 border-wassal-border">
            <AvatarFallback className="text-xs bg-wassal-plum/10 text-wassal-plum font-bold">
              {member.firstName?.[0]}
              {member.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-wassal-plum truncate">
                {member.firstName} {member.lastName}
              </span>
              {isCurrentActor && (
                <span className="text-[10px] bg-wassal-plum/10 text-wassal-plum font-semibold px-1.5 py-0.5 rounded">
                  Vous
                </span>
              )}
            </div>
            <p className="text-xs text-wassal-slate truncate">{member.email}</p>
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="px-4 py-3.5 text-xs text-wassal-ink font-mono whitespace-nowrap">
        {member.phoneNumber}
      </td>

      {/* Role */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <RoleBadge role={member.role} size="sm" />
      </td>

      {/* Status */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <StatusBadge status={member.accountStatus} blocked={member.blocked} size="sm" />
      </td>

      {/* Joined Date */}
      <td className="px-4 py-3.5 text-xs text-wassal-slate whitespace-nowrap">
        {formatDate(member.createdAt)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {isPending && onApprove && onReject && !isCurrentActor && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-wassal-green-ink hover:bg-emerald-50 hover:text-wassal-green-ink"
                title="Valider l'inscription"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(member.id);
                }}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-wassal-wine hover:bg-rose-50 hover:text-wassal-wine"
                title="Rejeter l'inscription"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(member.id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(member)}
            className="h-7 text-xs font-medium text-wassal-slate hover:text-wassal-plum gap-1 px-2.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Détails</span>
          </Button>
        </div>
      </td>
    </tr>
  );
};
