export interface TelemetryMetrics {
  cpuUsage: number;
  memoryLoad: number;
  activeAgents: number;
  quantumState: 'stable' | 'fluctuating' | 'collapsed';
}

export type HUDStatus = 'active' | 'idle' | 'critical';




