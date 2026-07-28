export interface EvolutionPayload {
  id: string;
  source: string;
  context: Record<string, unknown>;
  constraints: ConstraintSet;
  telemetry: TelemetryBuffer;
}

export interface ConstraintSet {
  memoryLimit: number;
  latencyThreshold: number;
  securityLevel: 'STRICT' | 'ADAPTIVE';
  epistemicBounds: boolean;
}

export interface TelemetryBuffer {
  timestamp: number;
  entropy: number;
  nodeId: string;
}



