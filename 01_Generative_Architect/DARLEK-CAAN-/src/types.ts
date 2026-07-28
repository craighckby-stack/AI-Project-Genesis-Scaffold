/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CodeChunk {
  id: string;
  repo: string;
  file: string;
  name: string;
  code: string;
  docstring?: string;
  sourceRepo?: string;
  sourceBranch?: string;
  sourceHash?: string;
  normalized?: string;
  mismatch?: 'match' | 'partial' | 'mismatch' | 'unchecked';
}

export interface Capability {
  id: string;
  name: string;
  purpose: string;
  whyItExists: string;
  evolution: string;
  bestImplementationId: string;
  dependencies: string[];
  volume: string;
  chapter: string;
  variants: CapabilityVariant[];
}

export interface CapabilityVariant {
  chunk: CodeChunk;
  diffFromCanonical?: string;
}

export interface Volume {
  name: string;
  chapters: Chapter[];
}

export interface Chapter {
  name: string;
  capabilities: string[]; // IDs
}

export interface EncyclopediaData {
  volumes: Volume[];
  capabilities: Record<string, Capability>;
}
