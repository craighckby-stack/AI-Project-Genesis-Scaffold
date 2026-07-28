/**
 * @fileoverview Firebase System Schema - DARLEK CANN v3.0 Evolution
 * Architecture: 3-tier LLM fallback integration with Agent Orchestra support.
 * Derived from: unitary-core & darlek-cann-v3 specifications.
 */

export type Environment = 'development' | 'staging' | 'production';
export type AgentMode = 'autonomous' | 'supervised' | 'quantum-sync';

export interface FirebaseServiceConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly storageBucket: string;
  readonly messagingSenderId: string;
  readonly appId: string;
  readonly measurementId?: string;
}

export interface OrchestrationConfig {
  readonly agentMode: AgentMode;
  readonly telemetryEnabled: boolean;
  readonly retryStrategy: {
    readonly maxAttempts: number;
    readonly backoffMs: number;
    readonly jitter: boolean;
  };
}

export interface SecurityConfig {
  readonly enforceAppCheck: boolean;
  readonly allowedDomains: readonly string[];
  readonly tokenRotationIntervalMs: number;
}

export interface FirebaseSchema {
  readonly version: string;
  readonly environment: Environment;
  readonly coreIdentity: {
    readonly projectId: string;
    readonly appId: string;
    readonly instanceId: string;
  };
  readonly firebase: FirebaseServiceConfig;
  readonly orchestration: OrchestrationConfig;
  readonly security: SecurityConfig;
}

/**
 * Strict validation engine for system configuration.
 * Ensures integrity before quantum-sync initialization.
 */
export const validateConfig = (config: FirebaseSchema): void => {
  const required: (keyof FirebaseServiceConfig)[] = ['apiKey', 'projectId', 'appId'];
  for (const key of required) {
    if (!config.firebase[key]) {
      throw new Error(`[DARLEK-CANN-ERR]: Missing critical configuration key: ${key}`);
    }
  }
};

/**
 * Factory for environment-specific configuration injection.
 * Siphoned from DARLEK-CAAN-2 world sim patterns.
 */
export const createEnvironmentConfig = (env: Environment, base: Omit<FirebaseSchema, 'environment' | 'orchestration'>): FirebaseSchema => ({
  ...base,
  environment: env,
  orchestration: {
    agentMode: env === 'production' ? 'autonomous' : 'supervised',
    telemetryEnabled: env === 'production',
    retryStrategy: {
      maxAttempts: env === 'production' ? 10 : 3,
      backoffMs: 1000,
      jitter: true
    }
  }
});