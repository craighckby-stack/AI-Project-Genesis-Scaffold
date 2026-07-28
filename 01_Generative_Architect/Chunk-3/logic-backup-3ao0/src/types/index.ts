export interface BrainDNA {
  version: string;
  compressed_chunks: string; // Base64 encoded compressed string
  index: string[]; // List of chunk names/IDs for quick lookup
}

export interface BrainMeta {
  chunks_count: number;
  last_reboot: number;
  version: number;
}

export interface DeathRegistryEntry {
  id?: string;
  path: string;
  error: string;
  timestamp: number;
}

export type DeathRegistry = DeathRegistryEntry[];

export interface BrainState {
  brain: {
    binary_payload: string;
    meta: BrainMeta;
  };
  death_registry: DeathRegistry;
}
