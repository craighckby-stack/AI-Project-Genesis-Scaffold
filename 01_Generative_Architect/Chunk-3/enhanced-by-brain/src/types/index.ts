export interface BrainDNA {
  version: string;
  compressed_chunks: string; // Base64 encoded compressed string
  index: string[]; // List of chunk names/IDs for quick lookup
}

export interface BrainMeta {
  chunks_count: number;
  last_reboot: number;
  version: number;
  gpu_provider?: 'deepseek' | 'runpod' | 'modal' | 'anthropic';
  gpu_endpoint?: string;
  gpu_model?: string;
  gpu_key?: string;
}

export interface DeathRegistryEntry {
  id?: string;
  path: string;
  error: string;
  timestamp: number;
  phase: string;
}

export type DeathRegistry = DeathRegistryEntry[];

export interface BrainIntention {
  id?: string;
  path: string;
  description: string;
  status: 'pending' | 'solved';
  timestamp: number;
}

export interface BrainState {
  brain: {
    binary_payload: string;
    meta: BrainMeta;
  };
  death_registry: DeathRegistry;
}

export interface GPUTask {
  id?: string;
  userId: string;
  model: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  result?: string;
  error?: string;
}
