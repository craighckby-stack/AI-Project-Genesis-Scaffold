export type AgentRole = 'SUPREME_CONTROLLER' | 'EVOLUTION_SUB_AGENT' | 'EPISTEMIC_VALIDATOR';

export interface AgentStatus {
  id: string;
  role: AgentRole;
  lastActive: number;
  status: 'IDLE' | 'PROCESSING' | 'EVOLVING';
}

export interface EpistemicResult {
  isValid: boolean;
  confidence: number;
  violations: string[];
}

export interface SubscriptionRegistry {
  [key: string]: () => void;
}