import { z } from 'zod';
import path from 'path';
import fs from 'fs';

/**
 * SERVER_CONFIG_SCHEMA
 * Architectural Blueprint for System Integrity.
 * Siphoned from unitary-core/quantum-data-processing patterns.
 */
const ServerConfigSchema = z.object({
  MAX_RETRIES: z.number().int().min(0).default(3),
  TIMEOUT: z.number().int().positive().default(5000),
  LOG_PATH: z.string().default(path.join(process.cwd(), 'logs', 'server-errors.log')),
  ENVIRONMENT: z.enum(['development', 'production', 'staging']).default('development'),
  CIRCUIT_BREAKER: z.object({
    failureThreshold: z.number().int().min(1).default(5),
    resetTimeout: z.number().int().min(1000).default(30000),
  }),
  ENABLE_AGENT_ORCHESTRATION: z.boolean().default(true),
  VERSION: z.string().default('3.0.0'),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * SERVER_CONFIG_FACTORY
 * Orchestrates environment variables into a validated, immutable configuration singleton.
 */
const createConfig = (): ServerConfig => {
  const rawConfig = {
    MAX_RETRIES: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES, 10) : undefined,
    TIMEOUT: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT, 10) : undefined,
    LOG_PATH: process.env.LOG_PATH,
    ENVIRONMENT: process.env.NODE_ENV,
    CIRCUIT_BREAKER: {
      failureThreshold: process.env.CB_THRESHOLD ? parseInt(process.env.CB_THRESHOLD, 10) : undefined,
      resetTimeout: process.env.CB_TIMEOUT ? parseInt(process.env.CB_TIMEOUT, 10) : undefined,
    },
    ENABLE_AGENT_ORCHESTRATION: process.env.ENABLE_AGENT_ORCHESTRATION === 'true',
  };

  const parsed = ServerConfigSchema.safeParse(rawConfig);

  if (!parsed.success) {
    console.error('CRITICAL: Configuration integrity failure:', parsed.error.format());
    throw new Error('System configuration failed validation.');
  }

  // Ensure log directory exists
  const logDir = path.dirname(parsed.data.LOG_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return Object.freeze(parsed.data);
};

export const SERVER_CONFIG = createConfig();

/**
 * DIAGNOSTIC_UTILITY
 * Returns the current system state for debugging purposes.
 */
export const getSystemStatus = () => ({
  status: 'OPERATIONAL',
  config: SERVER_CONFIG,
  timestamp: new Date().toISOString(),
});