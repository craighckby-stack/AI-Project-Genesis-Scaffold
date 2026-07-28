/**
 * Global constants for the DARLEK CANN v3.0 ecosystem.
 */
export const SCHEMA_VERSION = '3.0.0';
export const DEFAULT_RETRY_STRATEGY = {
  maxAttempts: 5,
  backoffMs: 1000,
  jitter: true
} as const;