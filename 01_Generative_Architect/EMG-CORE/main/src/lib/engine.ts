import { CoreIdentity, ChatMessage, MutationRecord, QuantumState } from '../types';

/**
 * DARLEK CANN v3.0 - Quantum Evolution Engine
 * Orchestrates system-wide state transitions, entropy regulation, and teleological alignment.
 */

export interface EngineConfig {
  readonly entropyThreshold: number;
  readonly coherenceBias: number;
}

export class QuantumEngine {
  private static instance: QuantumEngine;
  private state: QuantumState;
  private readonly config: EngineConfig = { entropyThreshold: 0.85, coherenceBias: 0.15 };

  private constructor(initialState: QuantumState) {
    this.state = initialState;
  }

  public static initialize(initialState: QuantumState): QuantumEngine {
    if (!QuantumEngine.instance) {
      QuantumEngine.instance = new QuantumEngine(initialState);
    }
    return QuantumEngine.instance;
  }

  /**
   * Evaluates action coherence against teleological constraints.
   * Implements entropy-dampening feedback loops.
   */
  public validateAction(identity: CoreIdentity, action: string): { valid: boolean; score: number } {
    const tokens = action.toLowerCase().split(/\s+/);
    const principleScore = identity.principles.filter(p => tokens.includes(p.toLowerCase())).length * 0.1;
    const violation = identity.teleologicalConstraints.some(tc => action.includes(tc.boundaryCondition));
    
    let score = 1.0 + principleScore;
    if (violation) score -= 0.5;
    if (identity.params.contextualDebtRatio > 0.8) score *= 0.5;

    const normalizedScore = Math.max(0, Math.min(1.0, score));
    return { valid: normalizedScore > 0.4, score: normalizedScore };
  }

  /**
   * Performs a non-destructive state mutation based on registry performance.
   */
  public evolve(identity: CoreIdentity): CoreIdentity {
    const registry = identity.mutationRegistry;
    const successRate = registry.length > 0 
      ? registry.filter(m => m.ccrrScore > 0.5).length / registry.length 
      : 0.5;

    const delta = successRate > 0.7 ? -0.05 : (successRate < 0.4 ? 0.1 : 0);
    
    return {
      ...identity,
      params: {
        ...identity.params,
        friction: Math.max(0.1, Math.min(1.0, identity.params.friction + delta)),
        threshold: Math.max(0.2, Math.min(0.9, identity.params.threshold + (delta / 2)))
      }
    };
  }

  /**
   * Calculates system entropy using variance analysis of mutation records.
   */
  public calculateEntropy(registry: MutationRecord[]): number {
    if (registry.length === 0) return 0;
    const scores = registry.map(r => r.ccrrScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / scores.length;
  }

  public get currentState(): QuantumState {
    return this.state;
  }
}