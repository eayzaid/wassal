import React, { useState } from 'react';
import { CommentDto } from '../../types';
import { commentsApi } from '../../api/commentsApi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { MarkdownView } from '../common/MarkdownView';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { ThumbsUp, ThumbsDown, Edit, Trash2, CornerDownRight, X } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface CommentItemProps {
  postId: number;
  comment: CommentDto;
  onCommentUpdated: (updatedComment: CommentDto) => void;
  onCommentDeleted: (commentId: number) => void;
  depth?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  postId,
  comment,
  onCommentUpdated,
  onCommentDeleted,
  depth = 0,
}) => {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [replies, setReplies] = useState<CommentDto[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const isAuthor =
    user && comment.authorName === `${user.firstName} ${user.lastName}`;
  const canDelete = isAuthor || isAdmin;

  // Optimistic Vote
  const handleVote = async (targetVote: 'LIKE' | 'DISLIKE') => {
    const prevVote = comment.myVote;
    const prevLikes = comment.likeCount;
    const prevDislikes = comment.dislikeCount;

    let newVote: 'LIKE' | 'DISLIKE' | null = targetVote;
    let newLikes = prevLikes;
    let newDislikes = prevDislikes;

    if (prevVote === targetVote) {
      // Toggle off
      newVote = null;
      if (targetVote === 'LIKE') newLikes = Math.max(0, newLikes - 1);
      else newDislikes = Math.max(0, newDislikes - 1);
    } else {
      // Switch or first vote
      if (targetVote === 'LIKE') {
        newLikes++;
        if (prevVote === 'DISLIKE') newDislikes = Math.max(0, newDislikes - 1);
      } else {
        newDislikes++;
        if (prevVote === 'LIKE') newLikes = Math.max(0, newLikes - 1);
      }
    }

    // Optimistically update
    onCommentUpdated({
      ...comment,
      myVote: newVote,
      likeCount: newLikes,
      dislikeCount: newDislikes,
    });

    try {
      if (newVote === null) {
        await commentsApi.removeVote(comment.id);
      } else {
        await commentsApi.vote(comment.id, newVote);
      }
    } catch {
      // Revert on error
      onCommentUpdated({
        ...comment,
        myVote: prevVote,
        likeCount: prevLikes,
        dislikeCount: prevDislikes,
      });
      toast.error('Erreur lors du vote.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setIsSavingEdit(true);
    try {
      const updated = await commentsApi.updateComment(comment.id, { content: editContent.trim() });
      onCommentUpdated(updated);
      setIsEditing(false);
      toast.success('Commentaire modifié.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la modification.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Voulez-vous supprimer ce commentaire ?')) return;
    try {
      await commentsApi.deleteComment(comment.id);
      onCommentDeleted(comment.id);
      toast.success('Commentaire supprimé.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const toggleReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }
    setShowReplies(true);
    if (replies.length === 0 && comment.replyCount > 0) {
      setIsLoadingReplies(true);
      try {
        const res = await commentsApi.listComments(postId, { parentId: comment.id, size: 50 });
        setReplies(res.content || []);
      } catch {
        toast.error('Impossible de charger les réponses.');
      } finally {
        setIsLoadingReplies(false);
      }
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      const newReply = await commentsApi.createComment(postId, {
        content: replyText.trim(),
        parentCommentId: comment.id,
      });
      setReplies((prev) => [...prev, newReply]);
      setReplyText('');
      setIsReplying(false);
      setShowReplies(true);
      onCommentUpdated({
        ...comment,
        replyCount: comment.replyCount + 1,
      });
      toast.success('Réponse publiée.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Impossible d'envoyer la réponse.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className={`group/comment relative ${depth > 0 ? 'ml-4 sm:ml-8 mt-2 pl-3 border-l-2 border-wassal-border/60' : 'mt-3'}`}>
      <div className="flex gap-2.5 sm:gap-3">
        {/* Avatar */}
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 border border-wassal-border">
          <AvatarFallback className="bg-wassal-plum/10 text-wassal-plum font-bold text-[10px] sm:text-xs">
            {comment.authorName?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>

        {/* Bubble */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl bg-wassal-bg/70 border border-wassal-border p-2.5 sm:p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs sm:text-sm text-wassal-plum truncate">
                  {comment.authorName}
                </span>
                <span className="text-[10px] text-wassal-slate">
                  {formatDate(comment.createdAt)}
                </span>
                {comment.edited && (
                  <span className="text-[10px] italic text-wassal-slate/80">
                    (modifié)
                  </span>
                )}
              </div>

              {/* Edit / Delete menu */}
              {(isAuthor || canDelete) && !isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                  {isAuthor && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditContent(comment.content);
                        setIsEditing(true);
                      }}
                      className="p-1 text-wassal-slate hover:text-wassal-plum rounded-md"
                      title="Modifier"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-1 text-wassal-slate hover:text-wassal-wine rounded-md"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Comment Body */}
            {isEditing ? (
              <div className="space-y-2 mt-1">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2 rounded-xl border border-wassal-border focus:ring-1 focus:ring-wassal-green focus:outline-none min-h-[60px]"
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    className="h-7 text-xs px-2 text-wassal-slate"
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="h-7 text-xs px-2.5 bg-wassal-green-ink text-white font-semibold"
                  >
                    {isSavingEdit ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-wassal-plum/90 break-words">
                <MarkdownView content={comment.content} />
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 mt-1 ml-1 text-xs text-wassal-slate">
            {/* Vote Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleVote('LIKE')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-emerald-50 transition-colors ${
                  comment.myVote === 'LIKE' ? 'text-wassal-green-ink font-bold' : 'text-wassal-slate'
                }`}
                title="J'aime"
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${comment.myVote === 'LIKE' ? 'fill-current' : ''}`} />
                <span>{comment.likeCount > 0 ? comment.likeCount : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => handleVote('DISLIKE')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-rose-50 transition-colors ${
                  comment.myVote === 'DISLIKE' ? 'text-wassal-wine font-bold' : 'text-wassal-slate'
                }`}
                title="Je n'aime pas"
              >
                <ThumbsDown className={`w-3.5 h-3.5 ${comment.myVote === 'DISLIKE' ? 'fill-current' : ''}`} />
                <span>{comment.dislikeCount > 0 ? comment.dislikeCount : ''}</span>
              </button>
            </div>

            {/* Reply Button */}
            <button
              type="button"
              onClick={() => setIsReplying(!isReplying)}
              className="hover:text-wassal-plum font-medium transition-colors"
            >
              Répondre
            </button>

            {/* Toggle Nested Replies if any */}
            {comment.replyCount > 0 && (
              <button
                type="button"
                onClick={toggleReplies}
                className="hover:text-wassal-plum font-semibold text-wassal-green-ink flex items-center gap-1 transition-colors"
              >
                <CornerDownRight className="w-3 h-3" />
                <span>
                  {showReplies
                    ? 'Masquer les réponses'
                    : `${comment.replyCount} réponse${comment.replyCount > 1 ? 's' : ''}`}
                </span>
              </button>
            )}
          </div>

          {/* Inline Reply Input */}
          {isReplying && (
            <div className="mt-2.5 flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                placeholder={`Répondre à ${comment.authorName}...`}
                className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-wassal-border bg-white focus:outline-none focus:ring-1 focus:ring-wassal-green"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsReplying(false)}
                className="h-8 text-xs px-2 text-wassal-slate"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={handleSendReply}
                disabled={isSubmittingReply || !replyText.trim()}
                className="h-8 text-xs px-3 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-semibold rounded-lg"
              >
                {isSubmittingReply ? '...' : 'Envoyer'}
              </Button>
            </div>
          )}

          {/* Nested Replies List */}
          {showReplies && (
            <div className="space-y-2 mt-2">
              {isLoadingReplies ? (
                <div className="text-xs text-wassal-slate italic py-1">Chargement des réponses...</div>
              ) : (
                replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    postId={postId}
                    comment={reply}
                    depth={depth + 1}
                    onCommentUpdated={(updated) =>
                      setReplies((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
                    }
                    onCommentDeleted={(delId) => {
                      setReplies((prev) => prev.filter((r) => r.id !== delId));
                      onCommentUpdated({
                        ...comment,
                        replyCount: Math.max(0, comment.replyCount - 1),
                      });
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
