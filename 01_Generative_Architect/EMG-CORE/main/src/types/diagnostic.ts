export interface DiagnosticMetrics {
  latency: number;
  confidence: number;
  provider: string;
  status: 'OK' | 'DRIFT' | 'ERR' | 'PENDING';
  timestamp: number;
}

export type SystemHealth = 'STABLE' | 'DEGRADED' | 'CRITICAL';