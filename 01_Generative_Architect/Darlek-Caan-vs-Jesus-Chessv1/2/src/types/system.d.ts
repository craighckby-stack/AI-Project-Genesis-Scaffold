export interface SystemState {
  version: string;
  status: 'active' | 'fault' | 'initializing';
  lastSync: number;
}

export interface AgentConfig {
  id: string;
  role: 'orchestrator' | 'worker' | 'observer';
  priority: number;
}




