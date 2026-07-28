export const ENGINE_VERSION = '3.0.0';
export const QUANTUM_TOLERANCE = 0.0001;

export const calculateConvergence = (a: number, b: number) => {
  return Math.abs(a - b) < QUANTUM_TOLERANCE;
};