export type SystemEvent = 'BOOT' | 'SYNC' | 'HALT' | 'RECOVER';
export interface SystemLog {
  timestamp: number;
  event: SystemEvent;
  payload: any;
}


