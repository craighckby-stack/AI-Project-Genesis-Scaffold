import { CoreIdentity } from '../engine';

export type MutationVector = {
  target: keyof CoreIdentity;
  value: any;
  weight: number;
};

export interface IEvolutionEngine {
  evolve: (vector: MutationVector) => Promise<EvolutionResult>;
  validate: (state: CoreIdentity) => boolean;
}