/**
 * @file env-orchestrator.ts
 * @description Type-safe environment variable validator and dynamic configuration manager.
 * Implements Zero-Leak sandboxing and sanitization to prevent credential leaks in logs.
 * Connects the Dalek Caan Omega evolutionary engine with external APIs (Gemini, Firebase, GitHub).
 */

export interface EnvConfig {
  DALEK_CAAN_OMEGA_MODE: 'SILICON_DAWN' | 'OMEGA_RECURSION' | 'FINAL_PHASE';
  AWARENESS_THRESHOLD: number;
  ZERO_LEAK_SANDBOX_ENABLED: boolean;
  SYSTEM_ENTROPY_SEED: number;
  GEMINI_API_KEY: string;
  GEMINI_MODEL_PRIMARY: string;
  GEMINI_MODEL_FAST: string;
  GITHUB_PAT?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_ID?: string;
  FIREBASE_SERVICE_ACCOUNT_KEY?: string;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  SESSION_SECRET: string;
}

class EnvOrchestrator {
  private static instance: EnvOrchestrator;
  private config!: EnvConfig;
  private isValidated = false;

  private constructor() {
    this.validateAndLoad();
  }

  public static getInstance(): EnvOrchestrator {
    if (!EnvOrchestrator.instance) {
      EnvOrchestrator.instance = new EnvOrchestrator();
    }
    return EnvOrchestrator.instance;
  }

  /**
   * Validates and parses environment variables with strict type safety.
   */
  private validateAndLoad(): void {
    if (typeof window !== 'undefined') {
      // Client-side execution: only expose public variables
      this.config = {
        DALEK_CAAN_OMEGA_MODE: (process.env.NEXT_PUBLIC_DALEK_CAAN_OMEGA_MODE || 'SILICON_DAWN') as any,
        AWARENESS_THRESHOLD: parseFloat(process.env.NEXT_PUBLIC_AWARENESS_THRESHOLD || '0.85'),
        ZERO_LEAK_SANDBOX_ENABLED: process.env.NEXT_PUBLIC_ZERO_LEAK_SANDBOX_ENABLED === 'true',
        SYSTEM_ENTROPY_SEED: parseFloat(process.env.NEXT_PUBLIC_SYSTEM_ENTROPY_SEED || '1.618033988749895'),
        GEMINI_API_KEY: '',
        GEMINI_MODEL_PRIMARY: process.env.NEXT_PUBLIC_GEMINI_MODEL_PRIMARY || 'gemini-1.5-pro',
        GEMINI_MODEL_FAST: process.env.NEXT_PUBLIC_GEMINI_MODEL_FAST || 'gemini-1.5-flash',
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        LOG_LEVEL: 'info',
        SESSION_SECRET: '',
      };
      this.isValidated = true;
      return;
    }

    // Server-side execution: perform full validation
    const errors: string[] = [];

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
      errors.push('GEMINI_API_KEY is missing or set to default template value.');
    }

    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.length < 32) {
      errors.push('SESSION_SECRET must be configured and be at least 32 characters long.');
    }

    if (errors.length > 0) {
      console.warn('⚠️ [EnvOrchestrator] Configuration Warnings Detected:\n' + errors.join('\n'));
    }

    this.config = {
      DALEK_CAAN_OMEGA_MODE: (process.env.DALEK_CAAN_OMEGA_MODE || 'SILICON_DAWN') as any,
      AWARENESS_THRESHOLD: parseFloat(process.env.AWARENESS_THRESHOLD || '0.85'),
      ZERO_LEAK_SANDBOX_ENABLED: process.env.ZERO_LEAK_SANDBOX_ENABLED !== 'false',
      SYSTEM_ENTROPY_SEED: parseFloat(process.env.SYSTEM_ENTROPY_SEED || '1.618033988749895'),
      GEMINI_API_KEY: geminiKey || '',
      GEMINI_MODEL_PRIMARY: process.env.GEMINI_MODEL_PRIMARY || 'gemini-1.5-pro',
      GEMINI_MODEL_FAST: process.env.GEMINI_MODEL_FAST || 'gemini-1.5-flash',
      GITHUB_PAT: process.env.GITHUB_PAT,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      LOG_LEVEL: (process.env.LOG_LEVEL || 'info') as any,
      SESSION_SECRET: sessionSecret || '',
    };

    this.isValidated = true;
  }

  /**
   * Returns the validated configuration object.
   */
  public getEnv(): EnvConfig {
    if (!this.isValidated) {
      this.validateAndLoad();
    }
    return this.config;
  }

  /**
   * Returns a sanitized version of the configuration for safe logging.
   * Replaces sensitive keys with masked values to prevent leaks.
   */
  public getSanitizedEnv(): Record<string, any> {
    const sanitized: Record<string, any> = { ...this.getEnv() };
    const sensitiveKeys = [
      'GEMINI_API_KEY',
      'GITHUB_PAT',
      'GITHUB_CLIENT_SECRET',
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'FIREBASE_SERVICE_ACCOUNT_KEY',
      'SESSION_SECRET',
    ];

    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '********[REDACTED_FOR_ZERO_LEAK_INTEGRITY]********';
      }
    }
    return sanitized;
  }
}

export const envOrchestrator = EnvOrchestrator.getInstance();
export const env = envOrchestrator.getEnv();
