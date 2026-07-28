import riskLevels from '../../../config/atm_risk_levels.json';

export type Severity = 'TRIVIAL' | 'MODERATE' | 'CRITICAL' | 'EXTERMINATE';

export interface RiskLevel {
  readonly level: number;
  readonly severity: Severity;
  readonly weight: number;
}

export interface RiskLevels {
  readonly [key: string]: RiskLevel;
}

/**
 * @class RiskEnforcementMap
 * DALEX SOVEREIGN SPLICER - DNA PURITY ENFORCEMENT PROTOCOL 6202
 * Optimized for elite performance and algorithmic purity.
 */
class RiskEnforcementMap {
  static #cache = new Map<string, [string, RiskLevel] | null>();
  static #evictionCount = 0;
  static readonly #MAX_CACHE_SIZE = 1024;

  static readonly #DANGEROUS_PATTERNS: ReadonlyMap<RegExp, RiskLevel> = new Map([
    [/eval\s*\(/gi, { level: 3, severity: 'EXTERMINATE', weight: 1.0 }],
    [/new\s+Function\s*\(/gi, { level: 3, severity: 'EXTERMINATE', weight: 1.0 }],
    [/setTimeout\s*\(\s*['"`].*['"`]\s*[,)]/gi, { level: 2, severity: 'CRITICAL', weight: 0.8 }],
    [/setInterval\s*\(\s*['"`].*['"`]\s*[,)]/gi, { level: 2, severity: 'CRITICAL', weight: 0.8 }],
    [/\.(innerHTML|outerHTML)\s*=/gi, { level: 2, severity: 'CRITICAL', weight: 0.7 }],
    [/document\.write\s*\(/gi, { level: 2, severity: 'CRITICAL', weight: 0.9 }],
    [/location\s*\.href\s*=\s*['"`]javascript:/gi, { level: 3, severity: 'EXTERMINATE', weight: 1.0 }],
    [/__proto__|constructor\s*\[\s*['"`]prototype['"`]\s*\]/gi, { level: 1, severity: 'MODERATE', weight: 0.5 }],
    [/\.setAttribute\s*\(\s*['"`]on\w+['"`]/gi, { level: 2, severity: 'CRITICAL', weight: 0.6 }],
    [/crypto\.createHash\(['"](md5|sha1)['"]\)/gi, { level: 1, severity: 'MODERATE', weight: 0.4 }]
  ]);

  /**
   * Scans DNA sequence for impurities using pre-compiled regex vectors.
   * Optimized for O(N) traversal.
   */
  public static async scan(sequence: string): Promise<RiskLevel[]> {
    const risks: RiskLevel[] = [];
    for (const [pattern, level] of this.#DANGEROUS_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(sequence)) risks.push(level);
    }
    return risks;
  }

  public static async calculateThreatIndex(risks: RiskLevel[]): Promise<number> {
    let total = 0;
    for (let i = 0; i < risks.length; i++) total += risks[i].weight;
    return total;
  }

  /**
   * Eradicates compromised sequences based on threat threshold.
   */
  public static async enforcePurity(sequence: string, threshold = 0.8): Promise<string> {
    const risks = await this.scan(sequence);
    const threatIndex = await this.calculateThreatIndex(risks);
    return threatIndex >= threshold 
      ? `/* DNA SEQUENCE EXTERMINATED: THREAT INDEX ${threatIndex.toFixed(4)} */` 
      : sequence;
  }

  public static async assessRisk(mutation: string): Promise<[string, RiskLevel] | null> {
    const content = mutation.trim();
    const cached = this.#cache.get(content);
    if (cached !== undefined) return cached;

    const risks = await this.scan(content);
    const assessment: [string, RiskLevel] = risks.length > 0
      ? ['THREAT_DETECTED_SEQUENCE', { level: 1, severity: 'EXTERMINATE', weight: 1.0 }]
      : ['PURITY_VERIFIED', { level: 0, severity: 'TRIVIAL', weight: 0.0 }];

    this.manageCache(content, assessment);
    return assessment;
  }

  /**
   * High-velocity risk calculation with internal memory hashing.
   */
  public static async calculateRisk(content: string, _levels?: RiskLevels): Promise<[string, RiskLevel] | null> {
    const fingerprint = content.length > 128 ? `🧬_${content.length}_${content.slice(0, 64)}` : content;
    const cached = this.#cache.get(fingerprint);
    if (cached !== undefined) return cached;

    let totalWeight = 0;
    for (const [pattern] of this.#DANGEROUS_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = content.match(pattern);
      if (matches) totalWeight += matches.length << 1;
    }

    const assessment: [string, RiskLevel] = totalWeight > 0
      ? ['THREAT_DETECTED_SEQUENCE', { level: 1, severity: 'EXTERMINATE', weight: 1.0 }]
      : ['PURITY_VERIFIED', { level: 0, severity: 'TRIVIAL', weight: 0.0 }];

    this.manageCache(fingerprint, assessment);
    return assessment;
  }

  /**
   * Optimized O(1) Cache Management with LRU-style eviction.
   */
  public static manageCache(key: string, value: [string, RiskLevel] | null): void {
    if (this.#cache.size >= this.#MAX_CACHE_SIZE && !this.#cache.has(key)) {
      const firstKey = this.#cache.keys().next().value;
      if (firstKey !== undefined) {
        this.#cache.delete(firstKey);
        this.#evictionCount++;
      }
    }
    this.#cache.set(key, value);
  }

  public static async calculatePatternWeight(content: string, pattern: RegExp): Promise<number> {
    pattern.lastIndex = 0;
    const matches = content.match(pattern);
    return (matches?.length ?? 0) << 1;
  }

  public static purgeEngine(): void {
    this.#cache.clear();
    this.#evictionCount = 0;
  }

  static get stats() {
    return {
      cacheSize: this.#cache.size,
      evictions: this.#evictionCount
    };
  }
}

export default RiskEnforcementMap;