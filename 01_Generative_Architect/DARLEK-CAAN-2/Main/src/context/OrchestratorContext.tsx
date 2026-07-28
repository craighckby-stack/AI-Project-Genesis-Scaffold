import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { AgentOrchestrator } from '../core/AgentOrchestrator';
import { useSystemContext } from './SystemContext';

const OrchestratorContext = createContext<AgentOrchestrator | null>(null);

export const OrchestratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const orchestrator = useMemo(() => new AgentOrchestrator(), []);
  const { dispatch } = useSystemContext();

  useEffect(() => {
    let mounted = true;
    orchestrator.initialize().then(() => {
      if (mounted) dispatch({ type: 'SET_INITIALIZED', payload: true });
    });
    return () => {
      mounted = false;
      orchestrator.terminate();
    };
  }, [orchestrator, dispatch]);

  return (
    <OrchestratorContext.Provider value={orchestrator}>
      {children}
    </OrchestratorContext.Provider>
  );
};

export const useOrchestrator = () => {
  const context = useContext(OrchestratorContext);
  if (!context) throw new Error('useOrchestrator must be used within OrchestratorProvider');
  return context;
};






