import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 350
): {
  debouncedCallback: (...args: Parameters<T>) => void;
  cancel: () => void;
  isPending: () => boolean;
} {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      cancel();
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timeoutRef.current = null;
      }, delay);
    },
    [delay, cancel]
  );

  const isPending = useCallback(() => timeoutRef.current !== null, []);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return { debouncedCallback, cancel, isPending };
}
