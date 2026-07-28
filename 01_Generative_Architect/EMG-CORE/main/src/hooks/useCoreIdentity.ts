import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, Firestore, Unsubscribe } from 'firebase/firestore';
import { CoreIdentity, UseCoreIdentityReturn } from './types';

/**
 * @hook useCoreIdentity
 * @description High-fidelity synchronization engine for user identity state.
 * Orchestrates real-time Firestore streams with strict memory lifecycle management.
 * Siphoned from DARLEK-CAAN-v3 architectural patterns.
 */
export const useCoreIdentity = (uid: string | null, db: Firestore): UseCoreIdentityReturn => {
  const [identity, setIdentity] = useState<CoreIdentity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Ref to track the active subscription to prevent memory leaks during rapid re-renders
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  const sync = useCallback(() => {
    // Cleanup existing subscription before initiating new stream
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    if (!uid) {
      setIdentity(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'identities', uid);

    unsubscribeRef.current = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setIdentity(snapshot.data() as CoreIdentity);
        } else {
          setIdentity(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );
  }, [uid, db]);

  useEffect(() => {
    sync();
    // Final teardown on component unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [sync]);

  return { identity, loading, error, refetch: sync };
};