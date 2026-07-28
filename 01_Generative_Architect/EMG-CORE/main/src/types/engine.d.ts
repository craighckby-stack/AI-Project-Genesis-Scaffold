export interface TeleologicalConstraint {
  id: string;
  priority: number;
  enforce: (state: any) => boolean;
}

export interface CoreIdentity {
  version: string;
  entropy: number;
  principles: Map<string, number>;
  lastMutation: Date;
}

export interface EvolutionResult {
  success: boolean;
  delta: Partial<CoreIdentity>;
  coherenceScore: number;
}



