export interface AppletConfig {
  version: string;
  environment: 'development' | 'staging' | 'production';
  coreIdentity: { projectId: string; appId: string };
  firebase: Record<string, string>;
  orchestration: {
    agentMode: 'distributed' | 'local';
    telemetryEnabled: boolean;
    retryStrategy: { maxAttempts: number; backoffMs: number; jitter: boolean };
    quantumState: { persistence: string; syncInterval: number };
  };
  security: {
    enforceAppCheck: boolean;
    allowedDomains: string[];
    rateLimit: { windowMs: number; maxRequests: number };
  };
  featureFlags: Record<string, boolean>;
}



