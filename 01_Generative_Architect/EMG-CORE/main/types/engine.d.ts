export interface EngineConfig {
  version: string;
  mode: 'development' | 'production';
  maxRetries: number;
}

export interface LLMResponse {
  success: boolean;
  data?: any;
  error?: string;
}