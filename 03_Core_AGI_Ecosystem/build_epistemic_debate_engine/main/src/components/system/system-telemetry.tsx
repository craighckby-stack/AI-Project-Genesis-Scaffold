import React from 'react';

export const SystemTelemetry = ({ children }: { children: React.ReactNode }) => {
  // Siphoned from Unitary-Core: Real-time diagnostic heartbeat for agent swarms
  return <div className="system-boundary">{children}</div>;
};