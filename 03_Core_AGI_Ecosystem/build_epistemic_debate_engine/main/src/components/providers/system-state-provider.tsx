import React, { createContext, useContext, ReactNode } from 'react';

interface SystemState {
  kernelStatus: 'active' | 'refactoring' | 'dormant';
  version: string;
}

const SystemStateContext = createContext<SystemState>({ kernelStatus: 'active', version: '3.0.0' });

export const SystemStateProvider = ({ children }: { children: ReactNode }) => {
  const state = { kernelStatus: 'active' as const, version: '3.0.0' };
  return <SystemStateContext.Provider value={state}>{children}</SystemStateContext.Provider>;
};

export const useSystemState = () => useContext(SystemStateContext);