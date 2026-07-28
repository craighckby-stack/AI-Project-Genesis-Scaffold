/**
 * OMEGA-class architecture definitions for emergent intelligence.
 */
export interface EmergentThought {
  id: string;
  confidence: number;
  reasoningPath: string[];
  timestamp: number;
}

export interface SwarmNode {
  id: string;
  role: 'ORCHESTRATOR' | 'WORKER' | 'OBSERVER';
  status: 'IDLE' | 'PROCESSING' | 'EVOLVING';
}




