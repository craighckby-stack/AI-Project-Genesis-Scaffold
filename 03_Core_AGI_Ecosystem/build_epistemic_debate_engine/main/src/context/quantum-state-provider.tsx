import React, { createContext, useContext, useReducer } from 'react';

interface QuantumState { status: 'stable' | 'fluctuating' | 'critical'; epoch: number; }
const QuantumContext = createContext<{ state: QuantumState; dispatch: any } | null>(null);

export const QuantumStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer((s: QuantumState, a: any) => ({ ...s, ...a }), { status: 'stable', epoch: Date.now() });
  return <QuantumContext.Provider value={{ state, dispatch }}>{children}</QuantumContext.Provider>;
};

export const useQuantum = () => {
  const context = useContext(QuantumContext);
  if (!context) throw new Error('QuantumStateProvider missing.');
  return context;
};