import { useEffect, useRef } from 'react';

export const useSystemOrchestrator = () => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
  return timerRef;
};