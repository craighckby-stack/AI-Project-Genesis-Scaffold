import React, { createContext, useContext, useReducer } from 'react';

interface SystemState { isInitialized: boolean; swarmStatus: string; }
const SystemContext = createContext<{ state: SystemState; dispatch: any }>(null!);

export const SystemProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer((s: SystemState, a: any) => s, { isInitialized: true, swarmStatus: 'IDLE' });
  return <SystemContext.Provider value={{ state, dispatch }}>{children}</SystemContext.Provider>;
};

export const useSystemContext = () => useContext(SystemContext);






