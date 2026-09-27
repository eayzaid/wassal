import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PostDto, PostType } from '../../types';
import { postsApi } from '../../api/postsApi';
import { useToast } from '../../hooks/useToast';
import { PostCard } from '../../components/posts/PostCard';
import { CreatePostModal } from '../../components/posts/CreatePostModal';
import { EditPostModal } from '../../components/posts/EditPostModal';
import { Button } from '../../components/ui/button';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Flame,
  Clock,
  BarChart2,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const PostsFeedPage: React.FC = () => {
  const toast = useToast();

  const [posts, setPosts] = useState<PostDto[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters & Infinite Scroll Pagination
  const [selectedType, setSelectedType] = useState<'ALL' | PostType>('ALL');
  const [sortOrder, setSortOrder] = useState<'new' | 'top'>('new');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostDto | null>(null);

  // Initial fetch / Filter reset
  const fetchFirstPage = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const res = await postsApi.listPosts({
        type: selectedType !== 'ALL' ? selectedType : undefined,
        sort: sortOrder,
        page: 0,
        size: 10,
      });
      setPosts(res.content || []);
      setPage(0);
      const total = res.page?.totalElements ?? res.totalElements ?? (res.content?.length || 0);
      const totalP = res.page?.totalPages ?? res.totalPages ?? 1;
      setTotalElements(total);
      setHasMore(1 < totalP);
    } catch {
      toast.error('Impossible de charger le fil communautaire.');
    } finally {
      setIsInitialLoading(false);
    }
  }, [selectedType, sortOrder, toast]);

  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  // Load next page on scroll
  const fetchNextPage = useCallback(async () => {
    if (isLoadingMore || isInitialLoading || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await postsApi.listPosts({
        type: selectedType !== 'ALL' ? selectedType : undefined,
        sort: sortOrder,
        page: nextPage,
        size: 10,
      });

      const incoming = res.content || [];
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newUnique = incoming.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newUnique];
      });

      setPage(nextPage);
      const totalP = res.page?.totalPages ?? res.totalPages ?? 1;
      const total = res.page?.totalElements ?? res.totalElements ?? totalElements;
      setTotalElements(total);
      setHasMore(nextPage + 1 < totalP);
    } catch {
      toast.error('Erreur lors du chargement des publications suivantes.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, isInitialLoading, hasMore, page, selectedType, sortOrder, totalElements, toast]);

  // Infinite scroll intersection observer with 200px threshold buffer
  useEffect(() => {
    if (!hasMore || isInitialLoading || isLoadingMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isInitialLoading, isLoadingMore, fetchNextPage]);

  const handleTypeChange = (type: 'ALL' | PostType) => {
    if (selectedType === type) return;
    setSelectedType(type);
  };

  const handleSortChange = (sort: 'new' | 'top') => {
    if (sortOrder === sort) return;
    setSortOrder(sort);
  };

  const handlePostCreated = useCallback((newPost: PostDto) => {
    setPosts((prev) => [newPost, ...prev]);
    setTotalElements((prev) => prev + 1);
  }, []);

  const handlePostUpdated = useCallback((updated: PostDto) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handlePostDeleted = useCallback((deletedId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
    setTotalElements((prev) => Math.max(0, prev - 1));
  }, []);

  const handleEditRequested = useCallback((post: PostDto) => {
    setEditingPost(post);
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-wassal-plum/10 text-wassal-plum">
              <Sparkles className="w-3.5 h-3.5 text-wassal-green-ink" />
              Espace Communauté
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-wassal-plum tracking-tight">
            Actualités & Sondages
          </h1>
          <p className="text-xs sm:text-sm text-wassal-slate mt-0.5">
            Échangez avec les bénévoles, suivez les annonces et donnez votre voix sur les initiatives
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFirstPage}
            disabled={isInitialLoading}
            className="h-10 text-wassal-slate hover:text-wassal-plum"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${isInitialLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="default"
            size="default"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-4 gap-2 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-bold shadow-sm rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Post</span>
          </Button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-wassal-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => handleTypeChange('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedType === 'ALL'
                ? 'bg-wassal-plum text-white shadow-xs'
                : 'bg-wassal-bg text-wassal-slate hover:text-wassal-plum'
            }`}
          >
            Tous les posts
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('REGULAR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedType === 'REGULAR'
                ? 'bg-wassal-green-ink text-white shadow-xs'
                : 'bg-wassal-bg text-wassal-slate hover:text-wassal-green-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Discussions</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('POLL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedType === 'POLL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-wassal-bg text-wassal-slate hover:text-amber-700'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Sondages</span>
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1 bg-wassal-bg/80 p-1 rounded-xl border border-wassal-border shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSortChange('new')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              sortOrder === 'new'
                ? 'bg-white text-wassal-plum shadow-xs'
                : 'text-wassal-slate hover:text-wassal-plum'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-wassal-slate" />
            <span>Plus récents</span>
          </button>
          <button
            type="button"
            onClick={() => handleSortChange('top')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              sortOrder === 'top'
                ? 'bg-white text-wassal-plum shadow-xs'
                : 'text-wassal-slate hover:text-wassal-plum'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Mieux notés</span>
          </button>
        </div>
      </div>

      {/* Feed List */}
      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-wassal-slate space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-wassal-green-ink" />
          <p className="text-sm font-medium">Chargement des publications...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-wassal-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-wassal-plum/5 text-wassal-plum flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-wassal-plum font-heading">
            Aucune publication trouvée
          </h3>
          <p className="text-xs sm:text-sm text-wassal-slate max-w-sm mx-auto">
            Soyez le premier à lancer une discussion ou à publier un sondage pour recueillir les avis des membres !
          </p>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 bg-wassal-green-ink text-white font-semibold rounded-xl"
          >
            Créer une publication
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              style={{ contentVisibility: 'auto', containIntrinsicSize: '0 280px' }}
            >
              <PostCard
                post={post}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
                onEditRequested={handleEditRequested}
              />
            </div>
          ))}

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="h-6" />

          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-wassal-slate">
              <Loader2 className="w-4 h-4 animate-spin text-wassal-green-ink" />
              <span>Chargement des publications suivantes...</span>
            </div>
          )}

          {/* End of Feed Indicator */}
          {!hasMore && posts.length > 0 && (
            <div className="py-6 text-center text-xs text-wassal-slate border-t border-wassal-border/60 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-wassal-green-ink" />
              <span>
                Vous êtes à jour ! ({totalElements} publication{totalElements > 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <EditPostModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  );
};
