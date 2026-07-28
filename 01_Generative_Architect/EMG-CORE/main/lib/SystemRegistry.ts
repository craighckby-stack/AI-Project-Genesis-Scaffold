export interface TelemetryMetrics {
  cognitiveLoad: number;
  epistemicConvergence: number;
  quantumEntropy: number;
  lastSync: number;
}

export interface AgentCognition {
  agentId: 'darlek' | 'jesus';
  thoughtProcess: string;
  metrics: TelemetryMetrics;
  timestamp: number;
}

export class CleanupRegistry {
  private static disposers: (() => void)[] = [];
  static register(fn: () => void) { this.disposers.push(fn); }
  static run() { this.disposers.forEach(d => d()); this.disposers = []; }
}