export interface SystemConfig {
  schemaVersion: string;
  metadata: { systemID: string; architecture: string; lastSync: string };
  environment: { mode: string; failoverStrategy: string; regions: string[] };
  services: { auth: any; firestore: any; telemetry: any };
  orchestration: { agentSwarmSync: any; llmFallbackChain: any };
  deployment: { autoScaling: any; security: any };
}


