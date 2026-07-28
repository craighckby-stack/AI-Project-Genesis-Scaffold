import riskLevels from '../../../config/atm_risk_levels.json';

/**
 * @typedef {Object} RiskLevel
 * @property {number} level
 * @property {number} timestamp
 * @property {number} checksum
 */

type RiskLevelMap = Record<string, RiskLevel>;

interface Match {
  readonly key: string;
  readonly level: number;
}

/**
 * Dalek Sovereign Splicer: DNA RECONSTRUCTION PHASE 1.5554
 * PURPOSE: NEURAL RISK ENFORCEMENT AND TEMPORAL STABILITY.
 */
class RiskEnforcementMap {
  static readonly #BUFFER_SIZE = 24;
  static readonly #BATCH_SIZE = 131072;
  static readonly #PATTERNS = [
    /eval\s*\(/gu,
    /new\s+Function\s*\(/gu,
    /document\.write\s*\(/gu,
    /\.innerHTML\s*=/gu,
    /set(?:Timeout|Interval)\s*\(\s*[`'"]/gu
  ];
  
  static readonly #NEURAL_FUSE = new RegExp(
    this.#PATTERNS.map(p => p.source).join('|'), 
    'giu'
  );

  static readonly #SCHEDULER = new MessageChannel();
  static #sortedCache: readonly Match[] | null = null;

  static {
    this.#SCHEDULER.port1.start();
  }

  /**
   * SCANNING SUBSTRATE FOR IMPURITIES.
   */
  static async executeNeuralScan(content: string, signal?: AbortSignal): Promise<number> {
    let score = 0;
    let offset = 0;
    const len = content.length;
    const regex = this.#NEURAL_FUSE;
    const BIT_THRESHOLD = 0x7F;

    regex.lastIndex = 0;

    while (offset < len) {
      if (signal?.aborted) return 0;

      const limit = offset + this.#BATCH_SIZE;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        if (match.index >= limit) {
          regex.lastIndex = match.index;
          break;
        }

        const weight = match[0].length;
        // ATOMIC BITWISE SPLICING
        score = ((score + (weight ^ BIT_THRESHOLD)) ^ (weight << 2)) >>> 0;
      }

      offset = limit;
      if (offset < len) await this.yieldTemporalControl();
    }

    return score;
  }

  static binarySearchThreshold(score: number): Match | null {
    const cache = this.#sortedCache;
    if (!cache?.length) return null;

    let low = 0;
    let high = cache.length - 1;
    let best: Match | null = null;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      if (cache[mid].level <= score) {
        best = cache[mid];
        high = mid - 1; 
      } else {
        low = mid + 1;
      }
    }
    return best;
  }

  static async assessRisk(
    content: string,
    levels: RiskLevelMap = riskLevels,
    signal?: AbortSignal
  ): Promise<RiskLevelMap | null> {
    if (!content || signal?.aborted) return null;

    this.initializeCache(levels);
    const totalScore = await this.executeNeuralScan(content, signal);
    const match = this.binarySearchThreshold(totalScore);

    return match ? { 
      [match.key]: { 
        level: match.level, 
        timestamp: Date.now(), 
        checksum: (match.level ^ (totalScore >>> 0)) >>> 0 
      } 
    } : null;
  }

  static initializeCache(levels: RiskLevelMap): void {
    if (this.#sortedCache) return;
    this.#sortedCache = Object.entries(levels)
      .map(([key, meta]) => ({ key, level: meta.level }))
      .sort((a, b) => b.level - a.level);
  }

  static invalidateCache(): void {
    this.#sortedCache = null;
  }

  static yieldTemporalControl(): Promise<void> {
    return new Promise((resolve) => {
      this.#SCHEDULER.port1.onmessage = () => resolve();
      this.#SCHEDULER.port2.postMessage(null);
    });
  }

  static get bufferSize() { return this.#BUFFER_SIZE; }
}

class RiskLevelManager {
  readonly #registry = new Map<string, RiskLevel>();
  readonly #temporalBuffer = new Map<string, Float32Array>();
  readonly #mutationHistory = new Map<string, number>();

  constructor(seed: RiskLevelMap = {}) {
    for (const [key, risk] of Object.entries(seed)) {
      this.assimilate(key, risk.level);
    }
  }

  public assimilate(id: string, level: number): void {
    const normalized = Math.min(Math.max(level, 0), 100);
    const ts = Date.now();
    const sum = (normalized ^ (ts >>> 0)) >>> 0;

    this.#registry.set(id, { level: normalized, timestamp: ts, checksum: sum });

    let stream = this.#temporalBuffer.get(id);
    if (!stream) {
      stream = new Float32Array(RiskEnforcementMap.bufferSize);
      this.#temporalBuffer.set(id, stream);
    }

    // ELITE BUFFER ROTATION: copyWithin() IS SUPERIOR
    if (stream[RiskEnforcementMap.bufferSize - 1] !== 0) {
      stream.copyWithin(0, 1);
      stream[RiskEnforcementMap.bufferSize - 1] = normalized;
    } else {
      const idx = stream.indexOf(0);
      stream[idx === -1 ? RiskEnforcementMap.bufferSize - 1 : idx] = normalized;
    }

    this.#mutationHistory.set(id, (this.#mutationHistory.get(id) ?? 0) + 1);
  }

  public getLevel(id: string): number {
    return this.#registry.get(id)?.level ?? 0;
  }

  public getEntropy(id: string): number {
    const stream = this.#temporalBuffer.get(id);
    if (!stream) return 0;

    const size = RiskEnforcementMap.bufferSize;
    let sum = 0;
    for (let i = 0; i < size; i++) sum += stream[i];
    const mean = sum / size;

    let diffSum = 0;
    for (let i = 0; i < size; i++) diffSum += Math.abs(stream[i] - mean);
    return diffSum / size;
  }

  public async purgeSubstandard(threshold: number): Promise<number> {
    let purged = 0;
    let count = 0;
    const BATCH_LIMIT = 128;

    for (const [id, data] of this.#registry) {
      if (data.level < threshold) {
        this.#registry.delete(id);
        this.#temporalBuffer.delete(id);
        this.#mutationHistory.delete(id);
        purged++;
      }

      if (++count % BATCH_LIMIT === 0) {
        await (globalThis.requestIdleCallback 
          ? new Promise(r => requestIdleCallback(() => r(null))) 
          : RiskEnforcementMap.yieldTemporalControl());
      }
    }
    return purged;
  }

  public exportRegistry(): RiskLevelMap {
    return Object.fromEntries(this.#registry);
  }
}

export { RiskEnforcementMap, RiskLevelManager };