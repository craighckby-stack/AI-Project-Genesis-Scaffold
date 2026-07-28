import React, { createContext, useContext } from 'react';

const SystemContext = createContext({ version: '3.0', status: 'OPERATIONAL' });

export const SystemStateProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SystemContext.Provider value={{ version: '3.0', status: 'OPERATIONAL' }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);




























































































