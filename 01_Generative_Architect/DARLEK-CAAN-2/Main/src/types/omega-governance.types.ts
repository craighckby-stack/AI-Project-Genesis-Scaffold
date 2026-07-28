export interface IConstraintGate {
  id: string;
  validate: (state: any) => boolean;
  enforce: () => void;
}

export type EvolutionStatus = 'STABLE' | 'MUTATING' | 'CRITICAL_FAILURE';




