export interface SystemState {
  version: string;
  status: 'ACTIVE' | 'MUTATING' | 'CRITICAL';
  agentSwarm: string[];
  quantumBusActive: boolean;
}

export type UnsubscribeFn = () => void;

export interface QSB_Interface {
  emit: (event: string, payload: any) => void;
  subscribe: (topic: string, callback: (data: any) => void) => UnsubscribeFn;
}