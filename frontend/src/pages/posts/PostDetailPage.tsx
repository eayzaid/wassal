import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PostDto } from '../../types';
import { postsApi } from '../../api/postsApi';
import { useToast } from '../../hooks/useToast';
import { PostCard } from '../../components/posts/PostCard';
import { EditPostModal } from '../../components/posts/EditPostModal';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [post, setPost] = useState<PostDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<PostDto | null>(null);

  const postId = Number(id);

  useEffect(() => {
    if (isNaN(postId)) {
      setIsLoading(false);
      return;
    }

    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const postData = await postsApi.getPostById(postId);
        // If poll, load latest results
        if (postData.type === 'POLL') {
          try {
            const pollData = await postsApi.getPollResults(postId);
            postData.poll = pollData;
          } catch {
            // non-critical
          }
        }
        setPost(postData);
      } catch {
        toast.error('Publication introuvable ou erreur de chargement.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-wassal-slate space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-wassal-green-ink" />
        <p className="text-sm font-medium">Chargement de la discussion...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-wassal-plum">Publication introuvable</h2>
        <p className="text-xs sm:text-sm text-wassal-slate">
          Cette publication a peut-être été supprimée ou n'existe pas.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate('/posts')}
          className="text-xs text-wassal-slate"
        >
          Retourner au fil communautaire
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/posts')}
        className="text-xs text-wassal-slate hover:text-wassal-plum gap-1.5 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux publications</span>
      </Button>

      <PostCard
        post={post}
        initiallyExpandedComments={true}
        onPostUpdated={(updated) => setPost(updated)}
        onPostDeleted={() => {
          toast.success('Publication supprimée.');
          navigate('/posts');
        }}
        onEditRequested={(p) => setEditingPost(p)}
      />

      <EditPostModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        onPostUpdated={(updated) => setPost(updated)}
      />
    </div>
  );
};
