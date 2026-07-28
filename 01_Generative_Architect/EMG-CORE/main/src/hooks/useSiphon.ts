import { useEffect, useRef } from 'react';

export const useSiphon = (active: boolean) => {
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    if (active) {
      controller.current = new AbortController();
    }
    return () => {
      controller.current?.abort();
    };
  }, [active]);

  return controller.current?.signal;
};