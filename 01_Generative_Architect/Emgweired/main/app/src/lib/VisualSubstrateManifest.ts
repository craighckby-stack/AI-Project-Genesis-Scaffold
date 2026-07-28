/**
 * @file VisualSubstrateManifest.ts
 * @description Orchestrates the visual identity of the DalekCaanOmega system.
 * Acts as the bridge between static assets and the recursive runtime state.
 */

export interface SubstrateMetadata {
  type: string;
  density: string;
  integrity: string;
  linkedConduit: string;
}

const registry = new Map<string, SubstrateMetadata>();

export function registerVisualSubstrate(id: string, metadata: SubstrateMetadata) {
  registry.set(id, metadata);
  console.log(`[DalekCaanOmega] Visual Substrate Registered: ${id}`);
}

export function getSubstrate(id: string): SubstrateMetadata | undefined {
  return registry.get(id);
}