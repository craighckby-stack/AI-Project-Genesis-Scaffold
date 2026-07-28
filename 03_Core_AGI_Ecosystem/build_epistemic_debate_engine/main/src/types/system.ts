export interface Disposable {
  unsubscribe: () => void;
  teardown: () => Promise<void>;
}

export interface SystemState {
  entropy: number;
  coherence: number;
  activeAgents: string[];
  lastSync: number;
}

export type SystemCommand = 'REFACTOR' | 'SYNC' | 'PURGE_LEAKS' | 'INIT_FABRIC';