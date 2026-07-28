import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, DocumentData, FirestoreError } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * @interface AgentState
 * Represents the core state of an autonomous agent within the DARLEK CANN ecosystem.
 */
export interface AgentState extends DocumentData {
  id: string;
  status: 'idle' | 'processing' | 'error' | 'terminated';
  lastUpdated: number;
  metadata?: Record<string, any>;
}

/**
 * @hook useAgentState
 * High-performance, reactive state controller for agentic entities.
 * Siphoned architectural patterns from Vercel SWR and Microsoft Semantic Kernel.
 */
export const useAgentState = <T extends AgentState>(agentId: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const resetState = useCallback(() => {
    setData(null);
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    if (!agentId) {
      resetState();
      return;
    }

    setLoading(true);
    
    // Establish persistent listener with rigorous cleanup
    const agentRef = doc(db, 'agents', agentId);
    
    const unsubscribe = onSnapshot(
      agentRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data() as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error(`[DARLEK-CANN] Agent Sync Error [${agentId}]:`, err);
        setError(err);
        setLoading(false);
      }
    );

    // Teardown logic to prevent memory leaks in high-frequency simulation loops
    return () => {
      unsubscribe();
      resetState();
    };
  }, [agentId, resetState]);

  return { data, loading, error };
};



