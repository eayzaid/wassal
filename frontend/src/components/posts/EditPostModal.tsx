import React, { useState, useEffect } from 'react';
import { PostDto, UpdatePostRequest } from '../../types';
import { postsApi } from '../../api/postsApi';
import { useToast } from '../../hooks/useToast';
import { MarkdownView } from '../common/MarkdownView';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Edit3, Eye } from 'lucide-react';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostDto | null;
  onPostUpdated: (updated: PostDto) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  post,
  onPostUpdated,
}) => {
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setActiveTab('write');
      setErrors({});
    }
  }, [post]);

  if (!post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Le titre est obligatoire.';
    if (!content.trim()) newErrors.content = 'Le contenu est obligatoire.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdatePostRequest = {
        title: title.trim(),
        content: content.trim(),
      };
      const updated = await postsApi.updatePost(post.id, payload);
      onPostUpdated(updated);
      toast.success('Publication mise à jour !');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la modification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-heading text-wassal-plum flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-wassal-slate" />
            <span>Modifier la publication</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-wassal-slate">
            Modifiez le titre et le corps de votre message. Le type et le sondage ne peuvent pas être altérés.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-wassal-plum mb-1">
              Titre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-wassal-green ${
                errors.title ? 'border-rose-400' : 'border-wassal-border'
              }`}
            />
            {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
          </div>

          {/* Markdown Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-wassal-plum">
                Contenu (Markdown supporté) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1 bg-wassal-bg/80 p-0.5 rounded-lg border border-wassal-border text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                    activeTab === 'write' ? 'bg-white text-wassal-plum font-semibold shadow-xs' : 'text-wassal-slate'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Rédiger</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                    activeTab === 'preview' ? 'bg-white text-wassal-plum font-semibold shadow-xs' : 'text-wassal-slate'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Aperçu</span>
                </button>
              </div>
            </div>

            {activeTab === 'write' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className={`w-full p-3 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-wassal-green ${
                  errors.content ? 'border-rose-400' : 'border-wassal-border'
                }`}
              />
            ) : (
              <div className="p-3 rounded-xl border border-wassal-border bg-wassal-bg/40 min-h-[120px]">
                <MarkdownView content={content} />
              </div>
            )}
            {errors.content && <p className="text-[11px] text-rose-500 mt-1">{errors.content}</p>}
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 text-wassal-slate"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs h-9 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-bold px-4"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
