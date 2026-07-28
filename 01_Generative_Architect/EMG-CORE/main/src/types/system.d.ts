/**
 * System-wide architectural constraints and interface declarations.
 * Extracted from sovereign-final and nbody_gravitational_simulator specifications.
 */

export interface SystemState {
  entropy: number;
  coherence: number;
  isEvolved: boolean;
}

export interface EvolutionPayload {
  timestamp: number;
  mutationId: string;
  impactScore: number;
}



