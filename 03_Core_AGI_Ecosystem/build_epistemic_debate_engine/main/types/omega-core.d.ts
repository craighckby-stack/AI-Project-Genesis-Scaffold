export interface IOmegaCore {
  version: string;
  status: 'STABLE' | 'EVOLVING' | 'CRITICAL';
  siphon(sourceRepo: string): Promise<void>;
  mutate(file: string, instructions: string): Promise<string>;
  validate(): boolean;
}

export type EpistemicVector = {
  dimension: 'LOGIC' | 'UTILITY' | 'SECURITY';
  weight: number;
  confidence: number;
};