export interface AgentNode {
  id: string;
  tier: 'PRIMARY' | 'SECONDARY' | 'FALLBACK';
  memory: Map<string, Uint8Array>;
  status: 'IDLE' | 'EVOLVING' | 'CRITICAL';
  quantumState: number;
}

export interface MutationResult {
  success: boolean;
  diff: string;
  riskScore: number;
  timestamp: number;
}