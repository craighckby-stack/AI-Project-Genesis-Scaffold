export interface KernelState {
  status: 'initializing' | 'ready' | 'error';
  entropy: number;
  activeAgents: string[];
}

export interface BootConfig {
  version: string;
  debug: boolean;
}




