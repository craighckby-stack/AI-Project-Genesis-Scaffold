export interface FirebaseAppletConfig {
  version: string;
  system_id: string;
  environment: string;
  project_metadata: {
    projectId: string;
    appId: string;
    apiKey: string;
    authDomain: string;
  };
  firestore: {
    databaseId: string;
    settings: { cacheSizeBytes: number; offlineAccess: boolean; ignoreUndefinedProperties: boolean };
    sharding_strategy: { enabled: boolean; shards: number; engine: string };
    collections: { agents: string; memory: string; logs: string; sim: string };
  };
  agent_orchestra: {
    enabled: boolean;
    fallback_strategy: string;
    models: { primary: string; secondary: string; tertiary: string };
    concurrency: number;
    sync_interval_ms: number;
  };
  governance: {
    framework: string;
    self_modification_lock: boolean;
    audit_trail: boolean;
    consciousness_framework: string;
  };
  emulators: { enabled: string; ports: Record<string, number> };
  telemetry: { last_mutation: string; controller: string; blueprint: string };
}

export const validateConfig = (config: any): config is FirebaseAppletConfig => {
  return !!config.system_id && !!config.project_metadata.projectId;
};




