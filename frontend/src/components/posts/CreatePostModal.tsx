import React, { useState } from 'react';
import { PostDto, PostType, CreatePostRequest } from '../../types';
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
import { DatePicker } from '../ui/date-picker';
import { MessageSquare, BarChart2, Plus, Trash2, Eye, Edit3 } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: PostDto) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const toast = useToast();

  const [type, setType] = useState<PostType>('REGULAR');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  // Poll fields
  const [pollCloseDate, setPollCloseDate] = useState(() => {
    // Default 7 days in the future
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16); // format YYYY-MM-DDTHH:mm
  });
  const [pollOptions, setPollOptions] = useState<string[]>(['Option 1', 'Option 2']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddOption = () => {
    if (pollOptions.length >= 10) {
      toast.error('Maximum 10 options autorisées.');
      return;
    }
    setPollOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    if (pollOptions.length <= 2) {
      toast.error('Un sondage doit comporter au moins 2 options.');
      return;
    }
    setPollOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setPollOptions((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Le titre est obligatoire.';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Le titre ne doit pas dépasser 200 caractères.';
    }

    if (!content.trim()) {
      newErrors.content = 'Le contenu est obligatoire.';
    }

    if (type === 'POLL') {
      const closeTime = new Date(pollCloseDate).getTime();
      if (!pollCloseDate || isNaN(closeTime) || closeTime <= Date.now()) {
        newErrors.pollCloseDate = 'La date de clôture doit être strictement dans le futur.';
      }

      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        newErrors.pollOptions = 'Veuillez renseigner au moins 2 options valides.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CreatePostRequest = {
        type,
        title: title.trim(),
        content: content.trim(),
      };

      if (type === 'POLL') {
        payload.pollCloseDate = new Date(pollCloseDate).toISOString();
        payload.pollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      }

      const created = await postsApi.createPost(payload);
      onPostCreated(created);
      toast.success(
        type === 'POLL' ? 'Sondage publié avec succès !' : 'Publication créée avec succès !'
      );
      handleClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Erreur lors de la création.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setType('REGULAR');
    setActiveTab('write');
    setPollOptions(['Option 1', 'Option 2']);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-heading text-wassal-plum flex items-center gap-2">
            {type === 'POLL' ? <BarChart2 className="w-5 h-5 text-amber-600" /> : <MessageSquare className="w-5 h-5 text-wassal-green-ink" />}
            <span>Nouvelle publication</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-wassal-slate">
            Partagez une actualité, une annonce ou lancez une consultation pour la communauté.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Post Type Selector */}
          <div className="flex rounded-xl bg-wassal-bg/80 p-1 border border-wassal-border">
            <button
              type="button"
              onClick={() => setType('REGULAR')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                type === 'REGULAR'
                  ? 'bg-white text-wassal-plum shadow-xs'
                  : 'text-wassal-slate hover:text-wassal-plum'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-wassal-green-ink" />
              <span>Discussion / Annonce</span>
            </button>
            <button
              type="button"
              onClick={() => setType('POLL')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                type === 'POLL'
                  ? 'bg-white text-wassal-plum shadow-xs'
                  : 'text-wassal-slate hover:text-wassal-plum'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Sondage interactif</span>
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-wassal-plum mb-1">
              Titre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'POLL' ? 'ex: Destination pour la caravane du mois prochain ?' : 'ex: Bilan de la collecte de rentrée 2026'}
              maxLength={200}
              className={`w-full px-3 py-2 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-wassal-green ${
                errors.title ? 'border-rose-400' : 'border-wassal-border'
              }`}
            />
            {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
          </div>

          {/* Markdown Content with Preview Tabs */}
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
                placeholder="Rédigez votre message. Vous pouvez utiliser du gras (**texte**), des listes (- item), des citations (> texte)..."
                rows={4}
                className={`w-full p-3 text-xs sm:text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-wassal-green ${
                  errors.content ? 'border-rose-400' : 'border-wassal-border'
                }`}
              />
            ) : (
              <div className="p-3 rounded-xl border border-wassal-border bg-wassal-bg/40 min-h-[105px]">
                {content.trim() ? (
                  <MarkdownView content={content} />
                ) : (
                  <p className="text-xs text-wassal-slate italic">Aucun contenu à prévisualiser.</p>
                )}
              </div>
            )}
            {errors.content && <p className="text-[11px] text-rose-500 mt-1">{errors.content}</p>}
          </div>

          {/* Poll Specific Controls */}
          {type === 'POLL' && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <BarChart2 className="w-4 h-4" />
                <span>Configuration du sondage</span>
              </div>

              {/* Close Date */}
              <div>
                <label className="block text-[11px] font-semibold text-wassal-plum mb-1">
                  Date & Heure de clôture <span className="text-rose-500">*</span>
                </label>
                <DatePicker
                  value={pollCloseDate}
                  onChange={(val) => setPollCloseDate(val)}
                  includeTime={true}
                  minDate={new Date()}
                  placeholder="Sélectionner la date et heure de clôture"
                />
                {errors.pollCloseDate && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.pollCloseDate}</p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-wassal-plum">
                    Options de vote (min. 2) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-wassal-green-ink hover:text-wassal-plum font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une option</span>
                  </button>
                </div>

                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      maxLength={200}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-wassal-border bg-white focus:outline-none focus:ring-1 focus:ring-wassal-green"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1.5 text-wassal-slate hover:text-rose-600 rounded-lg"
                        title="Supprimer cette option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {errors.pollOptions && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.pollOptions}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="text-xs h-9 text-wassal-slate"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs h-9 bg-wassal-green-ink hover:bg-wassal-green-ink/90 text-white font-bold px-4"
            >
              {isSubmitting ? 'Publication...' : 'Publier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
