export interface EpistemicEvent {
  agentId: string;
  payload: Record<string, unknown>;
  confidence: number;
  timestamp: number;
}

export type LogLevel = 'INFO' | 'WARN' | 'CRITICAL' | 'QUANTUM';


