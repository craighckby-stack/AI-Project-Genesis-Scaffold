export interface AgentConfig {
  id: string;
  role: 'orchestrator' | 'worker' | 'observer';
  capabilities: string[];
  memoryLimit: number;
}

export interface EvolutionSnapshot {
  timestamp: number;
  mutationHash: string;
  fitnessScore: number;
  codeState: Record<string, string>;
}

export type Unsubscribe = () => void;