import React from 'react';
import { UserSummaryDto } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { RoleBadge } from '../common/RoleBadge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { formatDate } from '../../utils/formatters';
import { Mail, Phone, Calendar, ChevronRight, Check } from 'lucide-react';

interface MemberCardProps {
  member: UserSummaryDto;
  onViewDetails: (member: UserSummaryDto) => void;
  onApprove?: (id: number) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onViewDetails,
  onApprove,
}) => {
  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`;

  return (
    <Card
      onClick={() => onViewDetails(member)}
      className="shadow-xs border-wassal-border active:bg-gray-50/80 transition-colors cursor-pointer"
    >
      <CardContent className="p-4 space-y-3">
        {/* Card Header: Avatar, Name & Role Badge */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-10 h-10 shrink-0 border border-wassal-border">
              <AvatarFallback className="text-xs font-bold bg-wassal-plum/10 text-wassal-plum">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-wassal-plum truncate leading-snug">
                {member.firstName} {member.lastName}
              </h3>
              <div className="mt-0.5">
                <RoleBadge role={member.role} size="sm" />
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <StatusBadge status={member.accountStatus} blocked={member.blocked} size="sm" />
          </div>
        </div>

        {/* Contact Links (Thumb-friendly tap-to-call & mailto) */}
        <div className="grid grid-cols-1 gap-1.5 pt-1 text-xs">
          {member.email && (
            <div className="flex items-center gap-2 text-wassal-slate truncate">
              <Mail className="w-3.5 h-3.5 shrink-0 text-wassal-slate/70" />
              <a
                href={`mailto:${member.email}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate hover:text-wassal-green-ink transition-colors font-medium"
              >
                {member.email}
              </a>
            </div>
          )}

          {member.phoneNumber && (
            <div className="flex items-center gap-2 text-wassal-slate">
              <Phone className="w-3.5 h-3.5 shrink-0 text-wassal-slate/70" />
              <a
                href={`tel:${member.phoneNumber}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-wassal-ink hover:underline"
              >
                {member.phoneNumber}
              </a>
            </div>
          )}

          {member.createdAt && (
            <div className="flex items-center gap-2 text-wassal-slate/80 text-[11px]">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-wassal-slate/60" />
              <span>Inscrit(e) le {formatDate(member.createdAt)}</span>
            </div>
          )}
        </div>

        {/* Action Button: 44px min touch target */}
        <div className="pt-2 border-t border-wassal-border/60 flex items-center justify-between gap-2">
          <span className="text-[11px] text-wassal-slate font-medium">
            Identifiant #{member.id}
          </span>
          <div className="flex items-center gap-1.5">
            {member.accountStatus === 'REJECTED' && onApprove && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(member.id);
                }}
                className="h-9 px-2.5 text-xs font-semibold text-wassal-green-ink border-wassal-green/40 hover:bg-wassal-green/10 gap-1"
                title="Accepter / Réintégrer le membre"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Réintégrer</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(member);
              }}
              className="h-9 px-3 text-xs font-semibold text-wassal-plum hover:text-wassal-green-ink gap-1"
            >
              <span>Fiche & Actions</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
