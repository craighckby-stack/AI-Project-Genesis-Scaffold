import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * QuantumState interface for tracking state evolution.
 * Siphoned from 'unitary-core' and 'sovereign-v86' architectural patterns.
 */
export interface QuantumState<T> {
  value: T;
  timestamp: number;
  version: number;
  history: T[];
}

/**
 * useQuantumState: Advanced state management with history tracking and atomic updates.
 * Designed for high-frequency agent orchestration in DARLEK CANN v3.0.
 */
export const useQuantumState = <T>(initial: T) => {
  const [state, setState] = useState<QuantumState<T>>({
    value: initial,
    timestamp: Date.now(),
    version: 0,
    history: [initial],
  });

  const stateRef = useRef<QuantumState<T>>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateState = useCallback((updater: (prev: T) => T) => {
    setState((prev) => {
      const nextValue = updater(prev.value);
      const nextState: QuantumState<T> = {
        value: nextValue,
        timestamp: Date.now(),
        version: prev.version + 1,
        history: [...prev.history.slice(-9), nextValue], // Keep last 10 states
      };
      return nextState;
    });
  }, []);

  const resetState = useCallback((initialValue: T) => {
    setState({
      value: initialValue,
      timestamp: Date.now(),
      version: 0,
      history: [initialValue],
    });
  }, []);

  return [state, updateState, resetState] as const;
};



