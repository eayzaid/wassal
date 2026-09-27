import React, { useState } from 'react';
import { PollSummaryDto, PollOptionResultDto } from '../../types';
import { postsApi } from '../../api/postsApi';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/button';
import { CheckSquare, Square, Users, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface PollCardProps {
  postId: number;
  poll: PollSummaryDto;
  onPollUpdated: (updatedPoll: PollSummaryDto) => void;
}

export const PollCard: React.FC<PollCardProps> = ({ postId, poll, onPollUpdated }) => {
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    poll.options.filter((o) => o.selectedByMe).map((o) => o.optionId)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isClosed = poll.closed || new Date(poll.closeDate).getTime() <= Date.now();
  const hasVoted = poll.options.some((o) => o.selectedByMe);

  const toggleOption = (optionId: number) => {
    if (isClosed) return;
    setSelectedIds((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  const handleVoteSubmit = async () => {
    if (isClosed) {
      toast.error('Ce sondage est clôturé.');
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await postsApi.submitPollSelections(postId, selectedIds);
      onPollUpdated(updated);
      setSelectedIds(updated.options.filter((o) => o.selectedByMe).map((o) => o.optionId));
      toast.success(selectedIds.length > 0 ? 'Votre vote a été enregistré !' : 'Vote retiré.');
    } catch (err: any) {
      const message = err?.response?.data?.message || "Impossible d'enregistrer le vote.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-wassal-bg/60 border border-wassal-border space-y-3">
      {/* Header with Close status & Voters */}
      <div className="flex items-center justify-between text-xs text-wassal-slate">
        <div className="flex items-center gap-1.5 font-medium">
          {isClosed ? (
            <span className="inline-flex items-center gap-1 text-wassal-wine font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Sondage clôturé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-wassal-green-ink font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Clock className="w-3.5 h-3.5" />
              Clôture le {formatDate(poll.closeDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 font-medium text-wassal-slate">
          <Users className="w-3.5 h-3.5" />
          <span>{poll.totalVoters} participant{poll.totalVoters > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {poll.options.map((option: PollOptionResultDto) => {
          const isSelected = selectedIds.includes(option.optionId);
          const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
          const percentValue = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
          const percentDisplay =
            totalVotes > 0
              ? Number.isInteger(percentValue)
                ? `${percentValue}%`
                : `${percentValue.toFixed(2)}%`
              : '0%';

          return (
            <div
              key={option.optionId}
              onClick={() => !isClosed && toggleOption(option.optionId)}
              className={`relative overflow-hidden rounded-xl border p-2.5 transition-all select-none ${
                isClosed
                  ? 'cursor-default border-wassal-border bg-white/70'
                  : 'cursor-pointer hover:border-wassal-green/60 active:scale-[0.99] bg-white'
              } ${
                isSelected
                  ? 'border-wassal-green ring-1 ring-wassal-green/50 bg-emerald-50/20'
                  : 'border-wassal-border'
              }`}
            >
              {/* Progress fill */}
              <div
                className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ease-out ${
                  isSelected ? 'bg-wassal-green/20' : 'bg-wassal-slate/10'
                }`}
                style={{ width: `${percentValue}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  {!isClosed && (
                    <button
                      type="button"
                      className="shrink-0 text-wassal-green-ink focus:outline-none"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-wassal-green-ink fill-emerald-100" />
                      ) : (
                        <Square className="w-4 h-4 text-wassal-slate/60" />
                      )}
                    </button>
                  )}
                  {isClosed && isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-wassal-green-ink shrink-0" />
                  )}
                  <span
                    className={`truncate font-medium ${
                      isSelected ? 'text-wassal-plum font-semibold' : 'text-wassal-plum'
                    }`}
                  >
                    {option.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-xs font-semibold">
                  <span className="text-wassal-slate font-medium">
                    {option.voteCount} vote{option.voteCount > 1 ? 's' : ''}
                  </span>
                  <span
                    className={`w-14 text-right tabular-nums ${
                      isSelected ? 'text-wassal-green-ink font-bold' : 'text-wassal-plum'
                    }`}
                  >
                    {percentDisplay}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer for Voting */}
      {!isClosed && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-wassal-slate italic">
            Choix multiple autorisé. Cliquez sur les options pour sélectionner.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleVoteSubmit}
              disabled={isSubmitting}
              className="h-8 px-3.5 text-xs bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-semibold rounded-lg shadow-xs"
            >
              {isSubmitting
                ? 'Enregistrement...'
                : hasVoted
                ? 'Modifier le vote'
                : 'Voter'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
