export type SystemStatus = 'IDLE' | 'PROCESSING' | 'CRITICAL_FAILURE' | 'SYNTHESIZING' | 'QUANTUM_SYNC';

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}