import React, { createContext, useContext } from 'react';

const TelemetryContext = createContext({});

export const TelemetryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <TelemetryContext.Provider value={{ version: '3.0.0', status: 'active' }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => useContext(TelemetryContext);