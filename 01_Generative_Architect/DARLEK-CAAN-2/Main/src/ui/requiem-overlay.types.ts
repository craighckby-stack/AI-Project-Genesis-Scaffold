export interface TelemetryPacket {
  timestamp: number;
  nodeId: string;
  status: 'nominal' | 'critical' | 'warning';
  payload: Record<string, unknown>;
}




