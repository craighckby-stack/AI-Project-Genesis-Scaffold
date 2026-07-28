export interface SystemConfig {
  version: string;
  coreIdentity: { projectId: string; appId: string };
  firebase: Record<string, string>;
  orchestration: {
    agentMode: 'distributed' | 'monolithic';
    telemetry: { enabled: boolean; provider: string };
    quantumState: { persistence: string; syncInterval: number; compression: boolean };
  };
  featureFlags: Record<string, boolean>;
}

export const validateConfig = (config: SystemConfig): boolean => {
  return !!config.coreIdentity.projectId && !!config.firebase.apiKey;
};