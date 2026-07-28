export interface OmegaSystemConfig {
  version: string;
  securityLevel: 'ALPHA' | 'BETA' | 'OMEGA';
  telemetryEnabled: boolean;
}

export const SYSTEM_CONFIG: OmegaSystemConfig = {
  version: '4.0.0',
  securityLevel: 'OMEGA',
  telemetryEnabled: true
};