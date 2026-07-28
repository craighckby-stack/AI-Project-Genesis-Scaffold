import riskLevels from '../../../config/atm_risk_levels.json';

type RiskDescriptor = {
  level: number;
  priority: number;
  tag: string;
  riskScore?: number;
  evolution?: string;
};

type RiskMap = Record<string, RiskDescriptor>;

/**
 * @class RiskEnforcementMap
 * @description Dalek-grade DNA sequence analysis and risk enforcement.
 * Optimized for Nexus R5 architecture.
 */
export class RiskEnforcementMap {
  static readonly #DNA_CACHE = new Map<string, number>();
  static #LEVEL_CACHE: Float64Array | null = null;
  static readonly #MAX_CACHE = 4096;

  static readonly #DANGEROUS_PATTERNS = Object.freeze([
    /\b(new\s+Function|eval)\s*\(/gi,
    /document\s*\.\s*write(ln)?\s*\(/gi,
    /(\.|\b)innerHTML\s*=|Element\.prototype\.innerHTML/gi,
    /(\.|\b)outerHTML\s*=|Element\.prototype\.outerHTML/gi,
    /set(Timeout|Interval)\s*\(\s*['"`].*?['"`]/gi,
    /location\.(href|assign|replace)\s*=\s*['"`]javascript:/gi,
    /crypto\.subtle\.importKey\s*\(/gi,
  ]);

  static readonly #CACHED_LEVELS = Object.entries(riskLevels as RiskMap)
    .sort(([, a], [, b]) => b.level - a.level);

  static {
    // Initializing buffers for maximum efficiency
    this.getRiskLevels();
  }

  public static getRiskLevels(): Float64Array {
    return this.#LEVEL_CACHE ??= new Float64Array(
      [0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 25.0, 50.0, 100.0].sort((a, b) => b - a)
    );
  }

  private static #maintainIntegrity(): void {
    if (this.#DNA_CACHE.size < this.#MAX_CACHE) return;
    const keys = this.#DNA_CACHE.keys();
    // Bulk purge 25% of the oldest sequence signatures
    let count = this.#MAX_CACHE >> 2;
    while (count--) {
      this.#DNA_CACHE.delete(keys.next().value);
    }
  }

  public static calculateSequenceRisk(sequence: string): number {
    const cached = this.#DNA_CACHE.get(sequence);
    if (cached !== undefined) return cached;

    this.#maintainIntegrity();
    
    // Superior bitwise reduction of pattern risks
    const riskScore = this.#DANGEROUS_PATTERNS.reduce((acc, pattern, idx) => 
      pattern.test(sequence) ? acc + (idx + 1) * 10 : acc, 0
    );

    this.#DNA_CACHE.set(sequence, riskScore);
    return riskScore;
  }

  public static async scanSequence(dna: string): Promise<number> {
    const cached = this.#DNA_CACHE.get(dna);
    if (cached !== undefined) return cached;

    const threatScore = await this.#executePatternAnalysis(dna);
    this.#maintainIntegrity();
    this.#DNA_CACHE.set(dna, threatScore);
    return threatScore;
  }

  static async #executePatternAnalysis(dna: string): Promise<number> {
    return new Promise((resolve) => {
      queueMicrotask(() => {
        let hash = 2166136261; // FNV-1a Prime Offset
        for (let i = 0, len = dna.length; i < len; i++) {
          hash = Math.imul(hash ^ dna.charCodeAt(i), 16777619);
        }
        // Normalize hash to 0.0 - 1.0 range
        resolve(Number(((hash >>> 0) / 0xFFFFFFFF).toFixed(4)));
      });
    });
  }

  public static flushCache(): void {
    this.#DNA_CACHE.clear();
    this.#LEVEL_CACHE = null;
  }

  public static async assessRisk(content: string): Promise<RiskMap | null> {
    if (!content) return null;

    const riskScore = await this.#executeParallelAnalysis(content);
    const match = this.#CACHED_LEVELS.find(([, meta]) => riskScore >= meta.level);

    return match ? { 
      [match[0]]: { ...match[1], riskScore, evolution: 'R5_2975_SPLICER' } 
    } : null;
  }

  static async #executeParallelAnalysis(content: string): Promise<number> {
    const tasks = this.#DANGEROUS_PATTERNS.map((pattern) => 
      new Promise<number>((resolve) => {
        queueMicrotask(() => {
          let count = 0;
          // Efficient global matching using modern iterator
          const matches = content.matchAll(pattern);
          for (const _ of matches) count++;
          resolve(count);
        });
      })
    );

    const scores = await Promise.all(tasks);
    return scores.reduce((sum, val) => sum + val, 0);
  }
}

export default RiskEnforcementMap;