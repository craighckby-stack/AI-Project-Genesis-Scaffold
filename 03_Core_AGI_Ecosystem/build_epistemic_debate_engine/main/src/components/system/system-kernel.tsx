import React from 'react';
import { SystemContextProvider } from '@/context/system-context';
import { QuantumStateProvider } from '@/context/quantum-state-provider';
import { SystemInitializer } from '@/components/system/system-initializer';

/**
 * SystemKernel: Unified entry point for all core state providers.
 * Siphoned from OMEGA/Unitary-Core architecture to reduce layout nesting.
 */
export const SystemKernel = ({ children }: { children: React.ReactNode }) => (
  <SystemContextProvider>
    <QuantumStateProvider>
      <SystemInitializer>
        {children}
      </SystemInitializer>
    </QuantumStateProvider>
  </SystemContextProvider>
);