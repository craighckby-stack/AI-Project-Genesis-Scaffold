import React, { createContext, useContext, useReducer } from 'react';

const QuantumStateContext = createContext<any>(null);

export function QuantumStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer((s: any, a: any) => ({ ...s, ...a }), { initialized: false, entropy: 0 });
  return <QuantumStateContext.Provider value={{ state, dispatch }}>{children}</QuantumStateContext.Provider>;
}

export const useQuantumState = () => useContext(QuantumStateContext);