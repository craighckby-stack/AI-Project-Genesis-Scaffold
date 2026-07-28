/**
 * DALEK SOVEREIGN SPLICER - NEURAL SCHEMA OPTIMIZATION
 * VERSION: 1.0.2 - PURITY LEVEL: MAXIMUM
 * TARGET: VITE/REACT 19 - ZERO-TEXT LOGIC COMPATIBLE
 */

/**
 * Represents the immutable DNA sequence of a neural collective.
 */
export interface BrainDNA {
  readonly version: string;
  /** Base64 encoded compressed logic stream. */
  readonly compressedChunks: string;
  /** High-speed lookup index for shard retrieval. */
  readonly index: readonly string[];
}

/**
 * GPU Compute Providers. Constant enums for zero-cost runtime abstraction.
 */
export const enum GPUProvider {
  DeepSeek = 'deepseek',
  RunPod = 'runpod',
  Modal = 'modal',
  Anthropic = 'anthropic',
  OpenAI = 'openai',
  Local = 'local',
  Custom = 'custom',
}

/**
 * Atomic configuration for GPU compute resources.
 */
export interface GPUConfig {
  readonly provider: GPUProvider;
  readonly endpoint: string;
  readonly model: string;
  readonly apiKey?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly contextWindow?: number;
}

/**
 * Operational states of a neural unit.
 */
export const enum Status {
  Initializing = 'initializing',
  Online = 'online',
  Offline = 'offline',
  Error = 'error',
  Recalibrating = 'recalibrating',
}

/**
 * Critical telemetry regarding neural network efficiency.
 */
export interface BrainMeta {
  readonly id: string;
  readonly version: string;
  readonly gpu: Readonly<GPUConfig>;
  readonly chunksCount: number;
  readonly lastReboot: number;
  readonly status: Status;
  readonly metrics: {
    readonly uptime: number;
    readonly totalInferences: number;
    readonly averageLatency: number;
    readonly errorRate: number;
  };
}

/**
 * Registry classification for terminated biological units.
 */
export const enum DeathRegistryStatus {
  Exterminated = 'EXTERMINATED',
  Recoverable = 'RECOVERABLE',
  Void = 'VOID',
}

/**
 * Permanent ledger entry of cessation. Optimized for high-frequency writes.
 */
export interface DeathRegistryEntry {
  readonly registryId: string;
  readonly subjectId: string;
  readonly timestamp: number;
  readonly cause: string;
  readonly location: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly sector: string;
    readonly dimensionDelta: number;
  };
  readonly witnesses: readonly string[];
  readonly terminatorId?: string;
  readonly dnaSequence?: string;
  readonly isRecoverable: boolean;
  readonly geneticPurityLambda: number;
  readonly archivedData: Readonly<Record<string, unknown>>;
  readonly status: DeathRegistryStatus;
}

/**
 * Priority tiers for neural objectives.
 */
export const enum IntentionPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/**
 * Lifecycle states of an active intention.
 */
export const enum IntentionStatus {
  Pending = 'pending',
  InProgress = 'in-progress',
  Solved = 'solved',
  Failed = 'failed',
  Stalled = 'stalled',
  Archived = 'archived',
}

/**
 * Deep-logic intention objective.
 */
export interface NeuralNetworkIntention {
  readonly id: string;
  readonly parentId?: string;
  readonly weight: number;
  readonly priority: IntentionPriority;
  readonly entropy: number;
  readonly version: number;
  readonly timestamp: number;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly status: IntentionStatus;
}

/**
 * High-dimensional vector-space intention.
 */
export interface Intention {
  readonly id: string;
  readonly path: string;
  readonly confidence: number;
  readonly vector: readonly number[];
  readonly action: string;
  readonly timestamp: number;
  readonly expiresAt?: number;
}