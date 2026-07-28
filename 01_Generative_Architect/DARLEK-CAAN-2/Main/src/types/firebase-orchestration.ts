export interface FirebaseOrchestrationConfig {
  version: string;
  environment: { mode: string; regionStrategy: string; regions: string[] };
  services: { auth: any; firestore: any; analytics: any };
  orchestration: { agentSwarmSync: boolean; quantumDataProcessing: { enabled: boolean; mode: string }; fallbackStrategy: Record<string, string> };
  deployment: { autoScaling: any; security: any };
}

export const validateConfig = (config: FirebaseOrchestrationConfig): boolean => {
  return !!config.version && !!config.orchestration.fallbackStrategy;
};




