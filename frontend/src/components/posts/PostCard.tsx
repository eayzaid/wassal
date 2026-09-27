import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostDto, CommentDto, PollSummaryDto } from '../../types';
import { postsApi } from '../../api/postsApi';
import { commentsApi } from '../../api/commentsApi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { MarkdownView } from '../common/MarkdownView';
import { PollCard } from './PollCard';
import { CommentItem } from './CommentItem';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  Pin,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Edit3,
  Trash2,
  Send,
  Loader2,
  BarChart2,
  Archive,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface PostCardProps {
  post: PostDto;
  onPostUpdated: (updatedPost: PostDto) => void;
  onPostDeleted: (postId: number) => void;
  onEditRequested?: (post: PostDto) => void;
  initiallyExpandedComments?: boolean;
}

export const PostCard: React.FC<PostCardProps> = React.memo(({
  post,
  onPostUpdated,
  onPostDeleted,
  onEditRequested,
  initiallyExpandedComments = false,
}) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isCommentsOpen, setIsCommentsOpen] = useState(initiallyExpandedComments);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);

  useEffect(() => {
    if (initiallyExpandedComments && !hasLoadedComments) {
      let isMounted = true;
      setIsLoadingComments(true);
      commentsApi
        .listComments(post.id, { page: 0, size: 10 })
        .then((res) => {
          if (!isMounted) return;
          setComments(res.content || []);
          setHasLoadedComments(true);
          setCommentsPage(0);
          const total = res.page?.totalPages ?? res.totalPages ?? 1;
          setHasMoreComments(total > 1);
        })
        .catch(() => {
          if (!isMounted) return;
          toast.error('Impossible de charger les commentaires.');
        })
        .finally(() => {
          if (isMounted) setIsLoadingComments(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [initiallyExpandedComments, post.id, hasLoadedComments, toast]);

  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsPage, setCommentsPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);

  const [isActionLoading, setIsActionLoading] = useState(false);

  const isAuthor = user && post.authorName === `${user.firstName} ${user.lastName}`;
  const canDelete = isAuthor || isAdmin;
  const canPin = isAdmin;

  // Optimistic Vote on Post
  const handleVote = async (targetVote: 'LIKE' | 'DISLIKE') => {
    const prevVote = post.myVote;
    const prevLikes = post.likeCount;
    const prevDislikes = post.dislikeCount;

    let newVote: 'LIKE' | 'DISLIKE' | null = targetVote;
    let newLikes = prevLikes;
    let newDislikes = prevDislikes;

    if (prevVote === targetVote) {
      newVote = null;
      if (targetVote === 'LIKE') newLikes = Math.max(0, newLikes - 1);
      else newDislikes = Math.max(0, newDislikes - 1);
    } else {
      if (targetVote === 'LIKE') {
        newLikes++;
        if (prevVote === 'DISLIKE') newDislikes = Math.max(0, newDislikes - 1);
      } else {
        newDislikes++;
        if (prevVote === 'LIKE') newLikes = Math.max(0, newLikes - 1);
      }
    }

    onPostUpdated({
      ...post,
      myVote: newVote,
      likeCount: newLikes,
      dislikeCount: newDislikes,
    });

    try {
      if (newVote === null) {
        await postsApi.removeVote(post.id);
      } else {
        await postsApi.vote(post.id, newVote);
      }
    } catch {
      onPostUpdated({
        ...post,
        myVote: prevVote,
        likeCount: prevLikes,
        dislikeCount: prevDislikes,
      });
      toast.error('Erreur lors du vote.');
    }
  };

  const handleTogglePin = async () => {
    if (!canPin) return;
    setIsActionLoading(true);
    try {
      const updated = await postsApi.setPinned(post.id, !post.pinned);
      onPostUpdated(updated);
      toast.success(updated.pinned ? 'Post épinglé en tête du fil !' : 'Post désépinglé.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la modification.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!canDelete) return;
    if (!window.confirm('Voulez-vous vraiment supprimer cette publication ? Cette action est irréversible.')) {
      return;
    }
    setIsActionLoading(true);
    try {
      await postsApi.deletePost(post.id);
      onPostDeleted(post.id);
      toast.success('Publication supprimée.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Toggle & Load Comments
  const handleToggleComments = async () => {
    if (isCommentsOpen) {
      setIsCommentsOpen(false);
      return;
    }
    setIsCommentsOpen(true);
    if (!hasLoadedComments) {
      setIsLoadingComments(true);
      try {
        const res = await commentsApi.listComments(post.id, { page: 0, size: 10 });
        setComments(res.content || []);
        setHasLoadedComments(true);
        setCommentsPage(0);
        const total = res.page?.totalPages ?? res.totalPages ?? 1;
        setHasMoreComments(total > 1);
      } catch {
        toast.error('Impossible de charger les commentaires.');
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleLoadMoreComments = async () => {
    const nextPage = commentsPage + 1;
    try {
      const res = await commentsApi.listComments(post.id, { page: nextPage, size: 10 });
      setComments((prev) => [...prev, ...(res.content || [])]);
      setCommentsPage(nextPage);
      const total = res.page?.totalPages ?? res.totalPages ?? 1;
      setHasMoreComments(nextPage + 1 < total);
    } catch {
      toast.error('Erreur lors du chargement des commentaires supplémentaires.');
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const created = await commentsApi.createComment(post.id, { content: newCommentText.trim() });
      setComments((prev) => [created, ...prev]);
      setNewCommentText('');
      onPostUpdated({
        ...post,
        commentCount: post.commentCount + 1,
      });
      toast.success('Commentaire publié !');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Impossible d'ajouter le commentaire.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    toast.success('Lien de la publication copié dans le presse-papier !');
  };

  return (
    <article className={`rounded-2xl border transition-all duration-200 bg-white shadow-xs ${
      post.pinned
        ? 'border-wassal-green/60 ring-1 ring-wassal-green/30 bg-gradient-to-b from-emerald-50/20 to-white'
        : 'border-wassal-border hover:border-wassal-slate/40'
    }`}>
      {/* Top Banner if Pinned */}
      {post.pinned && (
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs font-semibold text-wassal-green-ink bg-emerald-50/70 border-b border-wassal-green/20 rounded-t-2xl">
          <Pin className="w-3.5 h-3.5 fill-current rotate-45" />
          <span>Publication épinglée par l'administration</span>
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Author Header & Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-wassal-border shrink-0">
              <AvatarFallback className="bg-wassal-plum text-white font-bold text-xs">
                {post.authorName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-wassal-plum">
                  {post.authorName}
                </span>
                {post.type === 'POLL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <BarChart2 className="w-3 h-3" />
                    Sondage
                  </span>
                )}
                {(post.isArchived || post.archived) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    <Archive className="w-3 h-3 text-slate-500" />
                    Archivé
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-wassal-slate">
                <span title={new Date(post.createdAt).toLocaleString()}>
                  {formatDate(post.createdAt)}
                </span>
                {post.edited && (
                  <span className="italic text-[11px] text-wassal-slate/80">
                    (modifié)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Menu Actions */}
          <div className="flex items-center gap-1">
            {canPin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTogglePin}
                disabled={isActionLoading}
                className={`h-8 w-8 rounded-lg transition-colors ${
                  post.pinned
                    ? 'text-wassal-green-ink hover:text-wassal-plum'
                    : 'text-wassal-slate hover:text-wassal-plum'
                }`}
                title={post.pinned ? 'Désépingler' : 'Épingler'}
              >
                <Pin className={`w-4 h-4 ${post.pinned ? 'fill-current rotate-45' : ''}`} />
              </Button>
            )}

            {isAuthor && onEditRequested && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditRequested(post)}
                disabled={isActionLoading}
                className="h-8 w-8 text-wassal-slate hover:text-wassal-plum rounded-lg"
                title="Modifier"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeletePost}
                disabled={isActionLoading}
                className="h-8 w-8 text-wassal-slate hover:text-wassal-wine rounded-lg"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Post Title */}
        <h2
          onClick={() => navigate(`/posts/${post.id}`)}
          className="text-base sm:text-lg font-bold font-heading text-wassal-plum cursor-pointer hover:text-wassal-green-ink transition-colors leading-snug"
        >
          {post.title}
        </h2>

        {/* Post Content with Markdown */}
        <div className="text-sm">
          <MarkdownView content={post.content} />
        </div>

        {/* Interactive Poll if POLL */}
        {post.type === 'POLL' && post.poll && (
          <PollCard
            postId={post.id}
            poll={post.poll}
            onPollUpdated={(updatedPoll: PollSummaryDto) => {
              onPostUpdated({ ...post, poll: updatedPoll });
            }}
          />
        )}

        {/* Footer Interaction Bar */}
        <div className="pt-2 flex items-center justify-between border-t border-wassal-border/60 text-xs sm:text-sm text-wassal-slate">
          {/* Vote Counts */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => handleVote('LIKE')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                post.myVote === 'LIKE'
                  ? 'border-wassal-green bg-emerald-50 text-wassal-green-ink font-bold shadow-xs'
                  : 'border-wassal-border hover:border-wassal-green/60 hover:bg-emerald-50/30 text-wassal-slate'
              }`}
              title="J'aime"
            >
              <ThumbsUp className={`w-4 h-4 ${post.myVote === 'LIKE' ? 'fill-current' : ''}`} />
              <span>{post.likeCount}</span>
            </button>

            <button
              type="button"
              onClick={() => handleVote('DISLIKE')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                post.myVote === 'DISLIKE'
                  ? 'border-rose-400 bg-rose-50 text-wassal-wine font-bold shadow-xs'
                  : 'border-wassal-border hover:border-rose-300 hover:bg-rose-50/30 text-wassal-slate'
              }`}
              title="Je n'aime pas"
            >
              <ThumbsDown className={`w-4 h-4 ${post.myVote === 'DISLIKE' ? 'fill-current' : ''}`} />
              <span>{post.dislikeCount}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Comments Toggle */}
            <button
              type="button"
              onClick={handleToggleComments}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                isCommentsOpen
                  ? 'border-wassal-plum bg-wassal-plum/5 text-wassal-plum font-semibold'
                  : 'border-wassal-border hover:border-wassal-plum/50 text-wassal-slate hover:text-wassal-plum'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>
                {post.commentCount} <span className="hidden sm:inline">commentaire{post.commentCount > 1 ? 's' : ''}</span>
              </span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl border border-wassal-border hover:border-wassal-plum/50 text-wassal-slate hover:text-wassal-plum transition-all"
              title="Copier le lien"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Comments Section */}
        {isCommentsOpen && (
          <div className="pt-3 border-t border-wassal-border space-y-3">
            {/* New Comment Input */}
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 shrink-0 border border-wassal-border">
                <AvatarFallback className="bg-wassal-plum/10 text-wassal-plum font-bold text-xs">
                  {user?.firstName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Écrire un commentaire public..."
                  className="w-full text-xs sm:text-sm pl-3 pr-10 py-2 rounded-xl border border-wassal-border bg-wassal-bg/40 focus:outline-none focus:ring-1 focus:ring-wassal-green focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={isSubmittingComment || !newCommentText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-wassal-green-ink disabled:opacity-30 hover:text-wassal-plum"
                  title="Publier"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-4 text-xs text-wassal-slate gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-wassal-green-ink" />
                <span>Chargement des commentaires...</span>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-wassal-slate text-center py-3 italic">
                Aucun commentaire pour le moment. Soyez le premier à réagir !
              </p>
            ) : (
              <div className="space-y-1 divide-y divide-wassal-border/40">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    postId={post.id}
                    comment={comment}
                    onCommentUpdated={(updatedComment) => {
                      setComments((prev) =>
                        prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
                      );
                    }}
                    onCommentDeleted={(deletedId) => {
                      setComments((prev) => prev.filter((c) => c.id !== deletedId));
                      onPostUpdated({
                        ...post,
                        commentCount: Math.max(0, post.commentCount - 1),
                      });
                    }}
                  />
                ))}

                {/* Pagination Load More */}
                {hasMoreComments && (
                  <div className="pt-2 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleLoadMoreComments}
                      className="text-xs text-wassal-green-ink hover:text-wassal-plum font-semibold"
                    >
                      Charger plus de commentaires...
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
});
