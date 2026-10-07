import * as React from 'react';
import type { ToastActionElement, ToastProps } from '../components/ui/toast';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType['DISMISS_TOAST'];
      toastId?: ToasterToast['id'];
    }
  | {
      type: ActionType['REMOVE_TOAST'];
      toastId?: ToasterToast['id'];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

export type ToastInput = Omit<ToasterToast, 'id'>;

export interface ToastFn {
  (props: ToastInput): {
    id: string;
    dismiss: () => void;
    update: (props: ToasterToast) => void;
  };
  success: (message: string, options?: Partial<ToastInput>) => { id: string; dismiss: () => void };
  error: (message: string, options?: Partial<ToastInput>) => { id: string; dismiss: () => void };
  warning: (message: string, options?: Partial<ToastInput>) => { id: string; dismiss: () => void };
  info: (message: string, options?: Partial<ToastInput>) => { id: string; dismiss: () => void };
  showToast: (message: string, type?: ToastType) => { id: string; dismiss: () => void };
  dismiss: (toastId?: string) => void;
}

export const toast: ToastFn = Object.assign(
  function ({ ...props }: ToastInput) {
    const id = genId();

    const update = (updatedProps: ToasterToast) =>
      dispatch({
        type: 'UPDATE_TOAST',
        toast: { ...updatedProps, id },
      });
    const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

    dispatch({
      type: 'ADD_TOAST',
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss();
        },
      },
    });

    return {
      id: id,
      dismiss,
      update,
    };
  },
  {
    success: (message: string, options?: Partial<ToastInput>) => {
      return toast({
        description: message,
        variant: 'success',
        ...options,
      });
    },
    error: (message: string, options?: Partial<ToastInput>) => {
      return toast({
        description: message,
        variant: 'destructive',
        ...options,
      });
    },
    warning: (message: string, options?: Partial<ToastInput>) => {
      return toast({
        description: message,
        variant: 'warning',
        ...options,
      });
    },
    info: (message: string, options?: Partial<ToastInput>) => {
      return toast({
        description: message,
        variant: 'info',
        ...options,
      });
    },
    showToast: (message: string, type: ToastType = 'info') => {
      const variantMap: Record<ToastType, ToastProps['variant']> = {
        success: 'success',
        error: 'destructive',
        warning: 'warning',
        info: 'info',
      };
      return toast({
        description: message,
        variant: variantMap[type] || 'default',
      });
    },
    dismiss: (toastId?: string) => {
      dispatch({ type: 'DISMISS_TOAST', toastId });
    },
  }
);

export type UseToastReturn = ToastFn & {
  toasts: ToasterToast[];
  toast: ToastFn;
  dismiss: (toastId?: string) => void;
};

export function useToast(): UseToastReturn {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  const hookValue = React.useMemo(() => {
    const callable: any = (props: ToastInput) => toast(props);
    callable.toast = toast;
    callable.toasts = state.toasts;
    callable.dismiss = (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId });
    callable.success = toast.success;
    callable.error = toast.error;
    callable.warning = toast.warning;
    callable.info = toast.info;
    callable.showToast = toast.showToast;
    return callable as UseToastReturn;
  }, [state.toasts]);

  return hookValue;
}
