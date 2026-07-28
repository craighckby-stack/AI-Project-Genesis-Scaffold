export type ISO8601 = string;

export type Branded<T, B extends string> = T & { readonly __brand: B };

export type FactId = Branded<string, 'FactId'>;
export type DirectiveId = Branded<string, 'DirectiveId'>;
export type ConversationId = Branded<string, 'ConversationId'>;
export type LogId = Branded<string, 'LogId'>;
export type SessionId = Branded<string, 'SessionId'>;

export type EntityId = FactId | DirectiveId | ConversationId | LogId | SessionId;

export interface Fact {
  readonly id: FactId;
  readonly timestamp: ISO8601;
  readonly category: string;
  readonly fact: string;
  /** Confidence score between 0 and 1 */
  readonly confidence: number;
  readonly source: string;
  readonly active: boolean;
}

export type DirectivePriority = number; // 0 (lowest) to 10 (highest)

export interface Directive {
  readonly id: DirectiveId;
  readonly timestamp: ISO8601;
  readonly directive: string;
  readonly priority: DirectivePriority;
  readonly active: boolean;
}

export type SystemStatus = 'online' | 'loading' | 'offline' | 'error' | 'rebuilding' | 'maintenance';

export interface SystemState {
  readonly boot_count: number;
  readonly schema_version: string;
  readonly last_boot: ISO8601;
  /** Percentage 0-100 */
  readonly cpu_usage: number;
  /** Percentage 0-100 */
  readonly memory_usage: number;
  /** Percentage 0-100 */
  readonly vram_usage: number;
  readonly gpu_layers: number;
  readonly status: SystemStatus;
  readonly uptime: number;
}

export type Role = 'user' | 'assistant' | 'system';

export interface Conversation {
  readonly id: ConversationId;
  readonly timestamp: ISO8601;
  readonly role: Role;
  readonly content: string;
  readonly session_id: SessionId;
  readonly token_count?: number;
}

export type LogSource = 'kernel' | 'init' | 'supervisor' | 'claudiosd' | 'api' | 'worker';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogLine {
  readonly id: LogId;
  readonly timestamp: ISO8601;
  readonly source: LogSource;
  readonly level: LogLevel;
  readonly message: string;
}

export type MetadataValue = 
  | string 
  | number 
  | boolean 
  | null 
  | MetadataValue[] 
  | { [key: string]: MetadataValue };

export interface Metadata {
  readonly [key: string]: MetadataValue | undefined;
}

export interface FullState {
  readonly system: SystemState;
  readonly facts: readonly Fact[];
  readonly directives: readonly Directive[];
  readonly conversations: readonly Conversation[];
  readonly logs: readonly LogLine[];
  readonly metadata: Metadata;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends readonly (infer RU)[]
    ? readonly DeepPartial<RU>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

/** Utility for creating new entities without an ID or timestamp (usually server-generated) */
export type CreateEntity<T extends { id: any; timestamp: any }> = Omit<T, 'id' | 'timestamp'> & {
  readonly id?: T['id'];
  readonly timestamp?: T['timestamp'];
};














