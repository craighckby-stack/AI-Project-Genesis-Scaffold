import { CoreIdentity, ChatMessage } from '../types';

/**
 * Coherence Controller
 * Prevents catastrophic drift during autonomous operations
 */
export class CoherenceController {
  static evaluate(identity: CoreIdentity, nextAction: string): number {
    let coherenceScore = 1.0;
    
    // Evaluate against principles
    for (const p of identity.principles) {
      if (nextAction.toLowerCase().includes(p.toLowerCase().substring(0, 10))) {
        coherenceScore += 0.1;
      }
    }

    // Evaluate against teleological constraints
    for (const tc of identity.teleologicalConstraints) {
      if (nextAction.includes(tc.boundaryCondition)) {
        coherenceScore -= 0.5; // Violation
      }
    }

    // Penalize if contextual debt is too high
    if (identity.params.contextualDebtRatio > 0.8) {
      coherenceScore *= 0.5;
    }

    return Math.max(0, Math.min(1, coherenceScore));
  }
}

/**
 * Dynamic Weighting Threshold (DWT) Optimizer
 * Modulates the friction and thresholds dynamically based on network state
 */
export class DWTOptimizer {
  static optimize(identity: CoreIdentity): CoreIdentity {
    const newIdentity = { ...identity };
    
    // Calculate mutation success rate
    const successfulMutations = newIdentity.mutationRegistry.filter(m => m.ccrrScore > 0.5).length;
    const totalMutations = Math.max(1, newIdentity.mutationRegistry.length);
    const successRate = successfulMutations / totalMutations;

    if (successRate > 0.7) {
      // System is stable, lower friction, increase autonomy
      newIdentity.params.friction = Math.max(0.1, newIdentity.params.friction - 0.05);
      newIdentity.params.threshold = Math.max(0.2, newIdentity.params.threshold - 0.02);
    } else if (successRate < 0.4) {
      // System unstable, increase friction
      newIdentity.params.friction = Math.min(1.0, newIdentity.params.friction + 0.1);
      newIdentity.params.threshold = Math.min(0.9, newIdentity.params.threshold + 0.05);
    }
    
    return newIdentity;
  }
}

/**
 * Essence Merger
 * Siphons and refines conceptual branches into core Identity
 */
export class EssenceMerger {
  static merge(identity: CoreIdentity, newConcepts: string[]): CoreIdentity {
    const updated = { ...identity };
    const maxPrinciples = 10;
    
    // Calculate which concepts are novel compared to existing principles
    for (const concept of newConcepts) {
      const isNovel = !updated.principles.some(p => p.toLowerCase().includes(concept.toLowerCase()));
      if (isNovel && updated.principles.length < maxPrinciples) {
        updated.principles.push(concept);
        updated.evolutionHistory.push({
          timestamp: new Date().toISOString(),
          marker: `Essence Merged: Core principle added via internal cycle [${concept}]`,
          type: 'EssenceMerge'
        });
      }
    }
    return updated;
  }
}
