/**
 * Cognitive State Manager
 * Siphoned from unitary-core: Manages persistent memory loops and state decay.
 */
export interface CognitiveNode {
  id: string;
  timestamp: number;
  utilityScore: number;
  data: Record<string, any>;
}

export const createCognitiveNode = (data: Record<string, any>): CognitiveNode => ({
  id: crypto.randomUUID(),
  timestamp: Date.now(),
  utilityScore: 1.0,
  data
});