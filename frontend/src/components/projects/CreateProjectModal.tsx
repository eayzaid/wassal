import React, { useState } from 'react';
import { CreateProjectRequest, ProjectFullDto } from '../../types';
import { projectsApi } from '../../api/projectsApi';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../common/Input';
import { Label } from '../ui/label';
import { DatePicker } from '../ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { FolderPlus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: ProjectFullDto) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expectedEndTime, setExpectedEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setExpectedEndTime('');
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Le titre du projet est obligatoire.');
      return;
    }

    if (!expectedEndTime) {
      setErrorMessage('La date d’échéance prévue est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Format as ISO instant e.g. "2026-04-15T23:59:59Z"
      const isoTime = new Date(expectedEndTime).toISOString();
      const payload: CreateProjectRequest = {
        title: title.trim(),
        description: description.trim(),
        expectedEndTime: isoTime,
      };

      const created = await projectsApi.createProject(payload);
      toast.success(`Le projet "${created.title}" a été créé avec succès.`);
      onSuccess(created);
      handleClose();
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setErrorMessage(error.response?.data?.message || 'Échec de la création du projet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-wassal-plum">
            <div className="w-9 h-9 rounded-xl bg-wassal-green/20 flex items-center justify-center shrink-0 text-wassal-green-ink">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>Nouveau Projet Caravane</DialogTitle>
              <DialogDescription>
                Créez une initiative structurée pour regrouper plusieurs missions terrain
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <Input
            label="Titre du projet"
            required
            placeholder="Ex : Caravane Hivernale 2026 - Haut Atlas"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-wassal-plum">Description de l'initiative</Label>
            <textarea
              className="w-full min-h-[90px] px-3 py-2 text-xs rounded-xl border border-wassal-border bg-wassal-surface text-wassal-ink focus:outline-none focus:ring-2 focus:ring-wassal-green/40 focus:border-wassal-green-ink transition"
              placeholder="Objectifs humanitaires, zones ciblées, bénéficiaires prévus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DatePicker
            label="Date et heure prévues d'achèvement *"
            value={expectedEndTime}
            onChange={(val) => setExpectedEndTime(val)}
            placeholder="Sélectionner l'échéance du projet..."
            includeTime
            minDate={new Date()}
          />

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-11 sm:h-9"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="default"
              isLoading={isSubmitting}
              className="w-full sm:w-auto h-11 sm:h-9 gap-2 bg-wassal-green text-wassal-plum hover:bg-wassal-green/90 font-semibold"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Créer le projet</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
