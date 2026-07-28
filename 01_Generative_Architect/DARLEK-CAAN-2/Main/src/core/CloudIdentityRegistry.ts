export interface IdentityScope {
  projectId: string;
  region: string;
  environment: 'production' | 'staging' | 'development';
  version: string;
}

export const CLOUD_IDENTITY = {
  PROJECT_ID: '294284336101',
  API_VERSION: 'v1',
  apiBase: (region: string, service: string = 'compute'): string => {
    return `https://${service}.googleapis.com/${CLOUD_IDENTITY.API_VERSION}/projects/${CLOUD_IDENTITY.PROJECT_ID}/regions/${region}`;
  },
  validateIdentity: (token: string): boolean => {
    return token.startsWith('DC-');
  }
} as const;

export type CloudIdentity = typeof CLOUD_IDENTITY;



