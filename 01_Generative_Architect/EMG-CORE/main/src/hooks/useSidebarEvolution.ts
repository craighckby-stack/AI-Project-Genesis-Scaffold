import { useState, useCallback, useRef, useEffect } from 'react';

export type EvolutionStatus = 'IDLE' | 'PROCESSING' | 'ERROR' | 'SUCCESS';

export interface EvolutionMetadata {
  timestamp: number;
  priority: 'CRITICAL' | 'STANDARD' | 'BACKGROUND';
  origin: string;
}

export interface EvolutionState {
  status: EvolutionStatus;
  history: Array<{ taskId: string; metadata: EvolutionMetadata }>;
  lastError: string | null;
}

/**
 * DARLEK CANN v3.0 Sidebar Evolution Engine
 * Upgraded with Quantum State Management & Task Registry
 * Siphoned from: darlek-cann-v3 (Agent Orchestra) & unitary-core (Quantum State Management)
 */
export const useSidebarEvolution = () => {
  const [state, setState] = useState<EvolutionState>({
    status: 'IDLE',
    history: [],
    lastError: null,
  });

  const taskRegistry = useRef<Map<string, AbortController>>(new Map());

  const executeTask = useCallback(async <T,>( 
    taskId: string, 
    task: (signal: AbortSignal) => Promise<T>, 
    metadata: Omit<EvolutionMetadata, 'timestamp'> = { priority: 'STANDARD', origin: 'SYSTEM_CORE' }
  ): Promise<T | undefined> => {
    const controller = new AbortController();
    taskRegistry.current.set(taskId, controller);

    setState(prev => ({ ...prev, status: 'PROCESSING', lastError: null }));

    try {
      const result = await task(controller.signal);
      
      setState(prev => ({
        ...prev,
        status: 'SUCCESS',
        history: [...prev.history, { 
          taskId, 
          metadata: { ...metadata, timestamp: Date.now() } 
        }],
      }));
      return result;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return undefined;
      
      setState(prev => ({
        ...prev,
        status: 'ERROR',
        lastError: err instanceof Error ? err.message : 'Unknown Evolution Failure',
      }));
      return undefined;
    } finally {
      taskRegistry.current.delete(taskId);
      if (taskRegistry.current.size === 0) {
        setState(prev => ({ ...prev, status: 'IDLE' }));
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      taskRegistry.current.forEach(controller => controller.abort());
      taskRegistry.current.clear();
    };
  }, []);

  return {
    ...state,
    isProcessing: state.status === 'PROCESSING',
    executeTask,
    clearHistory: () => setState(prev => ({ ...prev, history: [] })),
  };
};