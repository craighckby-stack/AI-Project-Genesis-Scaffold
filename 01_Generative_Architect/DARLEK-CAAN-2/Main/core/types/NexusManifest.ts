export interface NexusManifest {
  version: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CRITICAL';
  activeModules: string[];
  telemetryEndpoint: string;
  securityPolicy: 'STRICT' | 'ADAPTIVE';
  lastSync: number;
  checksum: string;
}

export const validateManifest = (manifest: NexusManifest): boolean => {
  return manifest.status !== 'CRITICAL' && !!manifest.checksum;
};




