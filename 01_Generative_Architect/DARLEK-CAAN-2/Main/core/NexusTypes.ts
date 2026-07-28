export type SystemEvent = 'MODULE_FAILURE' | 'SECURITY_BREACH' | 'EVOLUTION_TRIGGERED';

export interface NexusEventPayload {
  timestamp: number;
  source: string;
  event: SystemEvent;
  severity: 1 | 2 | 3;
}





