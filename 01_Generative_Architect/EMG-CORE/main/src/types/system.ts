export interface SystemNode {
  readonly id: string;
  readonly mass: number;
  readonly logicGate: 'SOVEREIGN' | 'EPISTEMIC' | 'QUANTUM';
  readonly signature: CryptoKey;
}

export interface EvolutionPayload {
  readonly delta: number;
  readonly mutation: Readonly<Record<string, unknown>>;
  readonly timestamp: number;
}

export interface DopaminergicBrakeConfig {
  readonly recursionLimit: number;
  readonly entropyThreshold: number;
  readonly emergencyTeardown: () => Promise<void>;
}