import { useState, useEffect, useCallback } from 'react';

/**
 * @file hooks/useAppConfig.ts
 * @description High-performance, reactive configuration manager with cross-tab synchronization.
 * Siphoned from Vercel/SWR and VS Code state management patterns.
 */

export function useAppConfig<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (error) {
      console.error(`Error parsing config key "${key}":`, error);
      return initialValue;
    }
  });

  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const result = newValue instanceof Function ? newValue(prev) : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(result));
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(result) }));
      } catch (e) {
        console.error(`Failed to persist config key "${key}":`, e);
      }
      return result;
    });
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Storage sync error:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [value, updateValue] as const;
}

/**
 * @blueprint System Configuration Schema
 * This hook serves as the primary interface for persistent UI/Agent state.
 * Integration: Use this hook to sync Agent personality settings, theme toggles, 
 * and operational constraints across the DARLEK CANN ecosystem.
 */



