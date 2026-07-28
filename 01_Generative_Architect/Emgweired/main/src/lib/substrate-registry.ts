/**
 * @file substrate-registry.ts
 * @role Centralized Registry for Visual Substrates
 * @description Tracks lifecycle and integrity of binary assets within the Dalek Caan Ω ecosystem.
 */

interface SubstrateMetadata {
  id: string;
  type: string;
  hash: string;
  timestamp: number;
}

const registry = new Map<string, SubstrateMetadata>();

export function registerSubstrate(metadata: SubstrateMetadata) {
  registry.set(metadata.id, metadata);
  console.log(`[Dalek Caan Ω] Substrate Registered: ${metadata.id}`);
}

export function getSubstrate(id: string): SubstrateMetadata | undefined {
  return registry.get(id);
}

export const getRegistryState = () => Object.fromEntries(registry);