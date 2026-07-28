export interface OMEGA_CORE_STATE {
  entropy: number;
  activeAgents: string[];
  quantumBuffer: ArrayBuffer;
  governanceStatus: 'LOCKED' | 'EVOLVING' | 'STABLE';
}

export interface MutationConstraint {
  riskScore: number;
  requiresManualAudit: boolean;
  targetModule: string;
}