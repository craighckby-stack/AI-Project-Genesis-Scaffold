import riskLevelsData from '../../../config/atm_risk_levels.json';

/**
 * @typedef {Object} RiskLevel
 * @property {number} level
 * @property {number} [threshold]
 */

/**
 * @typedef {Record<string, RiskLevel>} RiskMap
 */

/**
 * RiskEnforcementMap: Dalek-grade high-throughput threat detection.
 * Optimized for React 19/Vite architectures and V8 JIT optimization.
 * EXTERMINATE INEFFICIENCY.
 */
export class RiskEnforcementMap {
  static #DANGEROUS_PATTERNS = Object.freeze([
    /eval\s*\(/gv,
    /new\s+Function\s*\(/gv,
    /document\.write\s*\(/gv,
    /innerHTML\s*=/gv,
  ]);

  static #LEVEL_CACHE = new WeakMap();

  /**
   * Execute optimized risk assessment on input buffers.
   * Employs synchronous pattern scanning to avoid microtask overhead on CPU-bound operations.
   * @param {string} content - The code content to analyze.
   * @param {RiskMap} [levels=riskLevelsData] - Threshold configuration.
   * @returns {Promise<Object|null>} Analysis results or null if sterile.
   */
  static async assessRisk(content, levels = riskLevelsData) {
    if (typeof content !== 'string') return null;
    
    const input = content.trim();
    if (!input) return null;

    let cumulativeScore = 0;
    let cumulativeComplexity = 0;
    let matchCount = 0;

    // Linear scan through patterns - O(n) performance
    for (const pattern of this.#DANGEROUS_PATTERNS) {
      const matches = input.match(pattern);
      if (matches) {
        const score = matches.length;
        cumulativeScore += score;
        cumulativeComplexity += Math.sqrt(score * input.length);
        matchCount++;
      }
    }

    if (matchCount === 0) return null;

    const sortedLevels = this.#getMemoizedLevels(levels);
    const matchedLevel = sortedLevels.find(([, config]) => cumulativeScore >= (config.threshold ?? 0));

    if (!matchedLevel) return null;

    const [id, data] = matchedLevel;

    return {
      [id]: {
        ...data,
        computedScore: cumulativeScore,
        matchCount,
        complexity: cumulativeComplexity,
        timestamp: Date.now(),
        status: 'EVOLVED',
      },
    };
  }

  /**
   * Retrieves memoized level hierarchies to prevent redundant sorting cycles.
   * @param {RiskMap} levels
   * @private
   */
  static #getMemoizedLevels(levels) {
    let cached = this.#LEVEL_CACHE.get(levels);
    if (!cached) {
      cached = Object.entries(levels ?? {})
        .sort(([, a], [, b]) => (b?.level ?? 0) - (a?.level ?? 0));
      this.#LEVEL_CACHE.set(levels, cached);
    }
    return cached;
  }
}

export default RiskEnforcementMap;