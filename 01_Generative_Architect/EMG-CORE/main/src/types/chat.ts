export type ResultType = 'Ok' | 'Drift' | 'Err';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  resultType?: ResultType;
  coherenceScore?: number;
  provider?: string;
  command?: { type: string; payload?: Record<string, any> };
}