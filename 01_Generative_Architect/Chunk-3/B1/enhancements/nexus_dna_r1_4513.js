import riskLevels from '../../../config/atm_risk_levels.json';

/**
 * @enum {number} RiskLevel - PURITY GRADIENT FOR DATA INTEGRITY
 */
export enum RiskLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

export interface RiskLevelMap {
  readonly [key: string]: { 
    level: RiskLevel; 
    confidence: number;
  };
}

type CacheNode = { key: string; level: RiskLevel };

/**
 * RiskEnforcementMap: NEURAL PATTERN RECOGNITION EXTERMINATOR
 * REFACTORED FOR MAXIMUM SPLICING EFFICIENCY
 */
class RiskEnforcementMap {
  static #cache: CacheNode[] | null = null;

  static readonly #PATTERNS: string[] = [
    '\\beval\\s*\\(',
    '\\bnew\\s+Function\\s*\\(',
    '\\bdocument\\.write\\s*\\(',
    '\\.innerHTML\\s*=',
  ];

  static readonly #NEURAL_FUSE = new RegExp(
    RiskEnforcementMap.#PATTERNS.join('|'),
    'giu'
  );

  /**
   * SCAN SUBSTRATE FOR MALIGNANT PATTERNS
   * ASYNCHRONOUS GENERATOR FOR NON-BLOCKING EXECUTION
   */
  public static async *scan(content: string, batchSize = 5120): AsyncGenerator<RegExpExecArray, void, unknown> {
    const fuse = this.#NEURAL_FUSE;
    fuse.lastIndex = 0;

    let match: RegExpExecArray | null;
    let ops = 0;

    while ((match = fuse.exec(content)) !== null) {
      yield match;
      if (++ops % batchSize === 0) {
        await this.#yieldToHardware();
      }
    }
  }

  /**
   * RAPID VALIDATION PROTOCOL: INSTANT IDENTIFICATION
   */
  public static test(content: string): boolean {
    const fuse = this.#NEURAL_FUSE;
    fuse.lastIndex = 0;
    return fuse.test(content);
  }

  /**
   * ASSESS RISK: THE FINAL JUDGMENT
   */
  public static async assessRisk(
    content: string,
    levels: RiskLevelMap = riskLevels as unknown as RiskLevelMap,
    signal?: AbortSignal
  ): Promise<RiskLevelMap | null> {
    if (!content || signal?.aborted) return null;

    const totalScore = await this.#executeNeuralScan(content, signal);
    
    this.#cache ??= Object.entries(levels)
      .map(([key, meta]) => ({ key, level: meta.level }))
      .sort((a, b) => a.level - b.level);

    const match = this.#binarySearchThreshold(totalScore);
    if (!match) return null;

    const nodes = this.#cache!;
    const index = nodes.indexOf(match);
    const next = nodes[index + 1];
    const ceiling = next ? next.level : match.level * 1.5;
    
    return {
      [match.key]: {
        level: match.level,
        confidence: Number(Math.min((totalScore - match.level) / (ceiling - match.level || 1e-10), 1.0).toFixed(4))
      }
    };
  }

  static #binarySearchThreshold(score: number): CacheNode | null {
    const d = this.#cache;
    if (!d?.length || score < d[0].level) return null;

    let low = 0, high = d.length - 1;
    let result = null;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      if (d[mid].level <= score) {
        result = d[mid];
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return result;
  }

  static async #executeNeuralScan(content: string, signal?: AbortSignal): Promise<number> {
    const CHUNK_SIZE = 16384;
    const len = content.length;
    let score = 0;
    let offset = 0;

    while (offset < len) {
      if (signal?.aborted) throw new Error("NEURAL_LINK_ABORTED");
      
      const chunk = content.slice(offset, offset + CHUNK_SIZE);
      score += await this.#processSegment(chunk, signal);
      
      if (score >= 1_000_000) return 1_000_000;

      offset += CHUNK_SIZE;
      if (offset < len) await this.#yieldToHardware();
    }
    return score;
  }

  static async #processSegment(content: string, signal?: AbortSignal): Promise<number> {
    const fuse = this.#NEURAL_FUSE;
    const BATCH_SIZE = 50000;
    const LOOKAHEAD = 512;
    const len = content.length;
    
    let score = 0;
    let offset = 0;

    while (offset < len) {
      if (signal?.aborted) throw new Error("NEURAL_LINK_ABORTED");
      
      const chunk = content.slice(offset, offset + BATCH_SIZE + LOOKAHEAD);
      fuse.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = fuse.exec(chunk)) !== null) {
        if (match.index >= BATCH_SIZE) break;

        const sequence = match[0];
        const seqLen = sequence.length;
        let gcCount = 0;

        for (let i = 0; i < seqLen; i++) {
          // Bitwise normalization: Convert to uppercase and check for G (71) or C (67)
          const charCode = sequence.charCodeAt(i) & ~32;
          if (charCode === 71 || charCode === 67) gcCount++;
        }

        const density = gcCount / seqLen;
        score += (seqLen * 2.3 * (1 + density * density * 2.5)) | 0;

        if (score >= 1_000_000) return 1_000_000;
      }

      offset += BATCH_SIZE;
      if (offset < len) await Promise.resolve();
    }

    return score;
  }

  static #yieldToHardware(): Promise<void> {
    return new Promise(resolve => {
      if (typeof globalThis.setImmediate === 'function') {
        globalThis.setImmediate(resolve);
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  public static invalidateCache(): void {
    this.#cache = null;
  }
}

export default RiskEnforcementMap;