/**
 * @file evolution.d.ts
 * @description Defines the self-refactoring constraints for the DARLEK CANN engine.
 */

export interface MutationSchema {
  targetModule: string;
  mutationType: 'prune' | 'expand' | 'optimize';
  riskAssessment: number;
  timestamp: number;
}

export interface EvolutionLog {
  history: MutationSchema[];
  currentStability: number;
}




