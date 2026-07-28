import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * SystemOrchestrator v3.0
 * Architecture: Reactive State Machine with Lifecycle Management
 * Siphoned from: sovereign-kernel, unitary-core, and Microsoft Semantic Kernel patterns.
 */

export enum SystemState {
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
  TERMINATED = 'TERMINATED'
}

export interface OrchestratorMetrics {
  uptime: number;
  lastHeartbeat: number;
  activeAgents: number;
}

export const useSystemOrchestrator = (initialConfig: { agentCount: number } = { agentCount: 1 }) => {
  const [status, setStatus] = useState<SystemState>(SystemState.INITIALIZING);
  const [metrics, setMetrics] = useState<OrchestratorMetrics>({ uptime: 0, lastHeartbeat: Date.now(), activeAgents: initialConfig.agentCount });
  const abortController = useRef<AbortController | null>(null);

  const transition = useCallback((newState: SystemState) => {
    setStatus(newState);
  }, []);

  useEffect(() => {
    abortController.current = new AbortController();
    const startTime = Date.now();

    const initializeSystem = async () => {
      try {
        // Simulate async system handshake/bootstrap
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (abortController.current?.signal.aborted) return;
        
        transition(SystemState.READY);
      } catch (err) {
        console.error('Orchestrator Bootstrap Failure:', err);
        transition(SystemState.ERROR);
      }
    };

    const heartbeat = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        uptime: Date.now() - startTime,
        lastHeartbeat: Date.now()
      }));
    }, 1000);

    initializeSystem();

    return () => {
      abortController.current?.abort();
      clearInterval(heartbeat);
      transition(SystemState.TERMINATED);
    };
  }, [transition]);

  return {
    status,
    metrics,
    transition,
    isOperational: status === SystemState.READY
  };
};



