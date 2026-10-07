import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { useToast } from '../../hooks/use-toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full pr-4">
              {variant === 'success' && (
                <CheckCircle2 className="h-5 w-5 text-wassal-green-ink shrink-0 mt-0.5" />
              )}
              {variant === 'destructive' && (
                <AlertCircle className="h-5 w-5 text-wassal-wine shrink-0 mt-0.5" />
              )}
              {variant === 'warning' && (
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              {variant === 'info' && (
                <Info className="h-5 w-5 text-wassal-slate shrink-0 mt-0.5" />
              )}
              <div className="grid gap-1 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
