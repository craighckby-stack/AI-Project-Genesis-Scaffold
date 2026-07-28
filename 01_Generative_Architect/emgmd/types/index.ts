export interface SystemState {
  entropy: number;
  isOperational: boolean;
  lastSync: number;
}

export interface AgentSignal {
  id: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export type Unsubscribe = () => void;



























































































