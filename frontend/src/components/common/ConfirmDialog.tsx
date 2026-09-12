import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 p-3 rounded-full ${
              isDestructive ? 'bg-wassal-wine/10 text-wassal-wine' : 'bg-amber-100 text-amber-600'
            }`}
          >
            {isDestructive ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-wassal-plum">{title}</DialogTitle>
            <DialogDescription className="mt-2 text-sm text-wassal-slate leading-relaxed">{message}</DialogDescription>
          </div>
        </div>

        <DialogFooter className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-wassal-border">
          <Button variant="outline" size="default" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            size="default"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
