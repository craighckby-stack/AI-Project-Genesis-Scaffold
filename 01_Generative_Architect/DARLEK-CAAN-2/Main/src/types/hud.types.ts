export type AgentStatus = 'idle' | 'active' | 'critical' | 'terminated';

export interface TelemetryData {
  load: string;
  latency: number;
  memoryUsage: number;
  activeAgents: number;
}

export interface HUDProps {
  agentId: string;
  status: AgentStatus;
  telemetryData: TelemetryData;
  className?: string;
}



