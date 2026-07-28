/**
 * @file kernel.d.ts
 * @description Core architectural definitions for the DARLEK CANN v3.0 system.
 * This file serves as the primary type-contract for system telemetry, kernel configuration,
 * and agent lifecycle management. It integrates with the broader sovereign-kernel
 * and AI-orchestration frameworks.
 */

/**
 * Represents the operational health status of a system module.
 */
export type SystemStatus = 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL' | 'INITIALIZING' | 'TERMINATED';

/**
 * Standardized telemetry packet for system observability.
 */
export interface SystemTelemetry {
  readonly timestamp: number;
  readonly module: string;
  readonly status: SystemStatus;
  readonly latencyMs?: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Core configuration schema for the Kernel runtime.
 */
export interface KernelConfig {
  readonly version: string;
  readonly debugMode: boolean;
  readonly environment: 'development' | 'production' | 'testing';
  readonly maxAgentConcurrency: number;
}

/**
 * Error boundary interface for cross-module fault tolerance.
 */
export interface KernelError {
  readonly code: string;
  readonly message: string;
  readonly stack?: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'FATAL';
}

/**
 * Lifecycle hooks for system-level agents.
 */
export interface AgentLifecycle {
  onInitialize: () => Promise<void>;
  onExecute: (payload: unknown) => Promise<void>;
  onTeardown: () => Promise<void>;
}

/**
 * Global registry for system-wide state management.
 */
export interface KernelRegistry {
  config: KernelConfig;
  telemetry: SystemTelemetry[];
  activeAgents: string[];
}

export type KernelResult<T> = 
  | { success: true; data: T }
  | { success: false; error: KernelError };



