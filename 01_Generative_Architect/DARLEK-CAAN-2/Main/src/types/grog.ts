export interface GrogAgentTelemetry {
  id: string;
  timestamp: number;
  load: number;
  status: 'active' | 'dormant' | 'critical';
}

export interface DashboardConfig {
  refreshRate: number;
  enableTelemetry: boolean;
}


