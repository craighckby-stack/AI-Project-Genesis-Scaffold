import React, { createContext, useContext, useReducer } from 'react';

interface SystemState { status: 'idle' | 'processing' | 'error'; agentCount: number; }
const SystemContext = createContext<{ state: SystemState; dispatch: any } | null>(null);

export function SystemContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer((s: SystemState, a: any) => s, { status: 'idle', agentCount: 0 });
  return <SystemContext.Provider value={{ state, dispatch }}>{children}</SystemContext.Provider>;
}

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within SystemContextProvider');
  return context;
};