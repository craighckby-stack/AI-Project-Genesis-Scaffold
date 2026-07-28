export interface GitHubStatePayload {
  version: string;
  timestamp: number;
  stateHash: string;
  data: Record<string, unknown>;
  metadata: {
    agentId: string;
    entropyLevel: number;
  };
}

export interface SyncResult {
  success: boolean;
  commitSha: string | null;
  error?: Error;
}

/**
 * Configuration constants for GitHub synchronization.
 * @property INTERVAL - Polling frequency in milliseconds.
 * @property RETRY_LIMIT - Maximum attempts for failed operations.
 * @property API_VERSION - Target schema version for state payloads.
 */
export const SYNC_CONFIG = {
  INTERVAL: 5000,
  RETRY_LIMIT: 3,
  API_VERSION: '2023-11-28'
} as const;