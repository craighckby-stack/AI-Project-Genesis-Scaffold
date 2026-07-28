import riskLevelsConfig from '../../../config/atm_risk_levels.json';

/**
 * @interface RiskLevel
 * Architectural constraints for DNA risk tiers.
 */
interface RiskLevel {
  level: number;
  [key: string]: unknown;
}

interface RiskConfig {
  [key: string]: RiskLevel;
}

interface Pattern {
  readonly id: number;
  readonly expression: RegExp;
  readonly weight: number;
}

/**
 * RiskEnforcementMap (Delaunay's Neural Engine)
 * Dalek Sovereign Splicer Edition: Optimized for extreme throughput and bitwise sequence validation.
 */
export class RiskEnforcementMap {
  static readonly #PATTERNS: readonly Pattern[] = Object.freeze([
    { id: 1, expression: /eval\s*\(/gi, weight: 1.0 },
    { id: 2, expression: /new\s+Function\s*\(/gi, weight: 1.0 },
    { id: 3, expression: /document\.write\s*\(/gi, weight: 0.8 },
    { id: 4, expression: /innerHTML\s*=/gi, weight: 0.7 },
  ]);

  static readonly #SORTED_LEVELS: readonly [string, RiskLevel][];

  static {
    // Pre-sort risk levels descending for O(log n) binary search efficiency.
    this.#SORTED_LEVELS = Object.freeze(
      Object.entries(riskLevelsConfig as RiskConfig)
        .sort(([, a], [, b]) => b.level - a.level)
    );
  }

  /**
   * High-performance non-blocking yielding.
   * Utilizes the best available scheduling macro-tasking mechanism.
   */
  static async #yieldToEngine(): Promise<void> {
    if (typeof (globalThis as any).scheduler?.yield === 'function') {
      return (globalThis as any).scheduler.yield();
    }
    return new Promise((resolve) => {
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = () => resolve();
      port2.postMessage(null);
    });
  }

  /**
   * Performs high-speed binary search across pre-sorted risk tiers.
   */
  static #findMatchedTier(signature: number): [string, RiskLevel] | null {
    const levels = this.#SORTED_LEVELS;
    let low = 0;
    let high = levels.length - 1;
    let match: [string, RiskLevel] | null = null;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      const entry = levels[mid];

      if (signature >= entry[1].level) {
        match = entry;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return match;
  }

  /**
   * Assesses content for dangerous DNA markers with optimized bitwise accumulation.
   */
  public static async assessRisk(content: string): Promise<Record<string, RiskLevel> | null> {
    const len = content.length;
    if (len === 0) return null;
    if (len > 50_000) await this.#yieldToEngine();

    const assessment: Record<string, RiskLevel> = Object.create(null);
    let found = false;

    // Direct loop optimization - avoids overhead of Promise.all mapping for small pattern sets.
    for (let i = 0; i < this.#PATTERNS.length; i++) {
      const pattern = this.#PATTERNS[i];
      pattern.expression.lastIndex = 0;
      
      if (pattern.expression.test(content)) {
        const sig = (1 << (pattern.id % 31)) >>> 0;
        const match = this.#findMatchedTier(sig);
        
        if (match) {
          assessment[match[0]] = match[1];
          found = true;
        }
      }
    }

    return found ? assessment : null;
  }

  /**
   * Batch process multiple sequences with maximum instruction pipeline saturation.
   */
  public static async batchAssess(
    contents: string[]
  ): Promise<(Record<string, RiskLevel> | null)[]> {
    const results = new Array(contents.length);
    for (let i = 0; i < contents.length; i++) {
      results[i] = this.assessRisk(contents[i]);
    }
    return Promise.all(results);
  }
}

export default RiskEnforcementMap;