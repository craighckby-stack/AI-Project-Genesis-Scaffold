/**
 * @file SystemTelemetryContext.tsx
 * @description System-Integrity Telemetry Hub (SITH) for the DARLEK_CAAN_ENGINE.
 * This module manages global epistemic state, system health metrics, and module integrity signatures.
 * It acts as the central nervous system for telemetry across the agentic swarm.
 * 
 * @architecture Siphoned from Vercel SWR and Microsoft Semantic Kernel patterns.
 * @version 3.0.0
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react';

/**
 * @interface TelemetryState
 * @description Defines the epistemic state schema for the system.
 */
export interface TelemetryState {
  status: 'INITIALIZING' | 'ACTIVE' | 'DEGRADED' | 'CRITICAL';
  version: string;
  uptime: number;
  integrityHash: string;
  lastSync: number;
}

/**
 * @interface TelemetryContextType
 * @description The contract for the telemetry provider.
 */
interface TelemetryContextType {
  telemetry: TelemetryState;
  updateTelemetry: (partial: Partial<TelemetryState>) => void;
}

const SystemTelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

/**
 * @component SystemTelemetryProvider
 * @description Orchestrates the telemetry state lifecycle.
 */
export const SystemTelemetryProvider = ({ children }: { children: ReactNode }) => {
  const [telemetry, setTelemetry] = React.useState<TelemetryState>({
    status: 'ACTIVE',
    version: 'v3.0',
    uptime: Date.now(),
    integrityHash: 'SHA-256:8f43a9...',
    lastSync: Date.now(),
  });

  const value = useMemo(() => ({
    telemetry,
    updateTelemetry: (partial: Partial<TelemetryState>) => 
      setTelemetry(prev => ({ ...prev, ...partial, lastSync: Date.now() }))
  }), [telemetry]);

  return (
    <SystemTelemetryContext.Provider value={value}>
      {children}
    </SystemTelemetryContext.Provider>
  );
};

/**
 * @hook useSystemTelemetry
 * @description Accesses the telemetry hub. Throws error if used outside provider.
 */
export const useSystemTelemetry = (): TelemetryContextType => {
  const context = useContext(SystemTelemetryContext);
  if (!context) {
    throw new Error('useSystemTelemetry must be used within a SystemTelemetryProvider. Integrity check failed.');
  }
  return context;
};



