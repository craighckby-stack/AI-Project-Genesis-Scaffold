import { useEffect } from 'react';
import { Unsubscribe } from 'firebase/firestore';

/**
 * Orchestrator hook to ensure clean subscription teardown.
 * Prevents memory leaks in the DARLEK CANN v3.0 Agent Orchestra.
 */
export function useFirebaseSubscription(subscribe: () => Unsubscribe, deps: any[]) {
  useEffect(() => {
    const unsubscribe = subscribe();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, deps);
}