import React, { useState } from 'react';
import { CreateTaskRequest, TaskFullDto, TaskType } from '../../types';
import { tasksApi } from '../../api/tasksApi';
import { projectsApi } from '../../api/projectsApi';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../common/Input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CheckSquare, Package, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number; // If set, creates task under this project
  projectTitle?: string;
  onSuccess: (task: TaskFullDto) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onSuccess,
}) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('TASK');
  const [points, setPoints] = useState<number>(100);
  const [minRequiredMembers, setMinRequiredMembers] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('TASK');
    setPoints(100);
    setMinRequiredMembers(2);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('L’intitulé de la mission est obligatoire.');
      return;
    }

    if (points < 0) {
      setErrorMessage('Les points attribués doivent être positifs ou nuls.');
      return;
    }

    if (minRequiredMembers < 1) {
      setErrorMessage('Au moins 1 bénévole requis pour valider la mission.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateTaskRequest = {
        name: name.trim(),
        description: description.trim(),
        type,
        points: Number(points),
        minRequiredMembers: Number(minRequiredMembers),
      };

      let created: TaskFullDto;
      if (projectId) {
        created = await projectsApi.createTaskUnderProject(projectId, payload);
      } else {
        created = await tasksApi.createStandaloneTask(payload);
      }

      toast.success(`La mission "${created.name}" a été créée avec succès.`);
      onSuccess(created);
      handleClose();
    } catch (err) {
      const error = err as AxiosError<ErrorResponse>;
      setErrorMessage(error.response?.data?.message || 'Échec de la création de la tâche.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-wassal-plum">
            <div className="w-9 h-9 rounded-xl bg-wassal-sage/20 flex items-center justify-center shrink-0 text-wassal-sage-deep">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>
                {projectId ? `Ajouter une mission au projet` : `Nouvelle Mission Autonome`}
              </DialogTitle>
              <DialogDescription>
                {projectId && projectTitle
                  ? `Projet : ${projectTitle}`
                  : `Créez une mission ou une collecte pour mobiliser les bénévoles`}
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
            label="Intitulé de la tâche / mission"
            required
            placeholder="Ex : Distribution paniers alimentaires, Tri des dons..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-wassal-plum">Description des objectifs</Label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 text-xs rounded-xl border border-wassal-border bg-wassal-surface text-wassal-ink focus:outline-none focus:ring-2 focus:ring-wassal-green/40 focus:border-wassal-green-ink transition"
              placeholder="Consignes précises, lieu de rendez-vous, équipement nécessaire..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-wassal-plum">Type d'opération</Label>
              <Select value={type} onValueChange={(val) => setType(val as TaskType)}>
                <SelectTrigger className="h-11 sm:h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TASK">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-wassal-sage-deep" />
                      <span>Mission terrain</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="COLLECTION">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-wassal-plum" />
                      <span>Collecte</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-wassal-plum">Points d'engagement</Label>
              <input
                type="number"
                min="0"
                required
                value={points}
                onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-11 sm:h-10 px-3 text-xs rounded-xl border border-wassal-border bg-wassal-surface text-wassal-ink focus:outline-none focus:ring-2 focus:ring-wassal-green/40 focus:border-wassal-green-ink transition font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-wassal-plum">Bénévoles min. requis</Label>
              <input
                type="number"
                min="1"
                required
                value={minRequiredMembers}
                onChange={(e) => setMinRequiredMembers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-11 sm:h-10 px-3 text-xs rounded-xl border border-wassal-border bg-wassal-surface text-wassal-ink focus:outline-none focus:ring-2 focus:ring-wassal-green/40 focus:border-wassal-green-ink transition font-mono"
              />
            </div>
          </div>

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
              <CheckSquare className="w-4 h-4" />
              <span>Créer la mission</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
