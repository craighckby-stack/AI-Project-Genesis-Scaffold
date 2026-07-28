export type Lifecycle = 'INITIALIZING' | 'SIMULATING' | 'CONVERGING' | 'TERMINATED';

export interface OmegaConfig {
  version: string;
  entropySeed: number;
  maxAgents: number;
}

export interface TelemetryEvent {
  timestamp: number;
  agentId: string;
  entropyDelta: number;
}