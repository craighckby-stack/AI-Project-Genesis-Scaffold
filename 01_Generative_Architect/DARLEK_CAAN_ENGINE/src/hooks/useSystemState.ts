import { useState, useEffect } from 'react';
export const useSystemState = () => {
  const [systemState, setSystemState] = useState({ setupComplete: false, connectionStatus: 'idle' });
  useEffect(() => {
    const saved = localStorage.getItem('darlek_cann_state');
    if (saved) {
      const timer = setTimeout(() => setSystemState(JSON.parse(saved)), 0);
      return () => clearTimeout(timer);
    }
  }, []);
  const persist = (newState: any) => {
    setSystemState(newState);
    localStorage.setItem('darlek_cann_state', JSON.stringify(newState));
  };
  return { systemState, updateState: setSystemState, persist };
};