/**
 * N-Body Gravitational Prioritizer
 * Siphoned from nbody_gravitational_simulator
 */
export const calculateTaskGravity = (tasks: { mass: number; distance: number }[]) => {
  return tasks.map(t => (t.mass * 6.674) / Math.pow(t.distance, 2));
};




