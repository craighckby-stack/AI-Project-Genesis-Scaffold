export interface GovernanceGate {
  readonly version: string;
  validateMutation: (ast: any) => Promise<boolean>;
  triggerBrake: (reason: string, severity: 'LOW' | 'CRITICAL') => Promise<void>;
  logState: (context: string) => void;
  teardown: () => void;
}

export type MutationResult = {
  success: boolean;
  entropyScore: number;
  timestamp: number;
  logs: string[];
};


