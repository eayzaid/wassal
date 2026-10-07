import React, { createContext, useMemo } from 'react';
import { toast, ToastType } from '../hooks/use-toast';

export type { ToastType };

export interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contextValue = useMemo(
    () => ({
      showToast: toast.showToast,
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
    }),
    []
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};
