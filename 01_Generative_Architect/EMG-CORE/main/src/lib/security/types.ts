export interface SecurityEvent {
  timestamp: number;
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  origin: string;
}

export interface GatekeeperConfig {
  maxRetries: number;
  sessionTimeoutMs: number;
}



