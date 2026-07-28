import React, { createContext, useContext, useReducer } from 'react';

const SystemStateContext = createContext<any>(null);

export function SystemStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer((s: any, a: any) => ({ ...s, ...a }), { 
    mode: 'operational', 
    agentCount: 0,
    lastSync: Date.now()
  });
  
  return (
    <SystemStateContext.Provider value={{ state, dispatch }}>
      {children}
    </SystemStateContext.Provider>
  );
}

export const useSystemState = () => useContext(SystemStateContext);