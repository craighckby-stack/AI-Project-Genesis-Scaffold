import riskLevels from '../../../config/atm_risk_levels.json';

export interface RiskLevel {
  level: number;
  description?: string;
}

export type RiskMap = Record<string, RiskLevel>;
export type RiskEntry = [string, RiskLevel];

interface AnalysisResult extends RiskLevel {
  classification: string;
  aggregateRisk: number;
  matches?: any[];
}

const DANGEROUS_PATTERNS = [
  { id: 'eval', regex: /eval\s*\(/gi },
  { id: 'function', regex: /new\s+Function\s*\(/gi },
  { id: 'write', regex: /document\.write\s*\(/gi },
  { id: 'html', regex: /innerHTML\s*=/gi },
] as const;

/**
 * 🛡️ Dalek Sovereign Splicer - Nexus DNA Enforcement Core
 * Optimized for React 19 / Vite environments.
 * Efficiency: O(P * N) with minimal heap allocation.
 */
class RiskEnforcementMap {
  private static readonly LEVEL_CACHE = new WeakMap<RiskMap, RiskEntry[]>();
  private static readonly BATCH_CACHE = new Map<string, AnalysisResult | null>();
  private static readonly CACHE_LIMIT = 1024;

  /**
   * Assesses risk metrics for a given sequence with high-precision pattern matching.
   */
  public static async assessRisk(
    content: string,
    levels: RiskMap = riskLevels as RiskMap
  ): Promise<AnalysisResult | null> {
    if (!content || typeof content !== 'string') return null;

    const sortedEntries = this.getSortedLevels(levels);
    const matches = [];
    let totalRiskScore = 0;

    // Optimized single-pass execution over dangerous bytecode patterns
    for (const { id, regex } of DANGEROUS_PATTERNS) {
      const matchArray = [...content.matchAll(regex)];
      const count = matchArray.length;

      if (count > 0) {
        totalRiskScore += count;
        const indices = matchArray.map(m => m.index!);
        
        // Resolve priority via pre-calculated meta-map
        const priority = sortedEntries.find(([key]) => id.includes(key) || regex.source.includes(key))?.[1] ?? null;
        
        matches.push({
          id,
          weight: count,
          indices,
          priority,
          relevance: count * (priority?.level ?? 1),
          timestamp: Date.now(),
        });
      }
    }

    // Identify highest classification threshold met
    const match = sortedEntries.find(([, meta]) => totalRiskScore >= meta.level);

    return match
      ? { 
          classification: match[0], 
          ...match[1], 
          aggregateRisk: totalRiskScore, 
          matches: matches.sort((a, b) => b.relevance - a.relevance) 
        }
      : { 
          classification: 'STABLE', 
          level: 0, 
          aggregateRisk: totalRiskScore, 
          matches 
        };
  }

  /**
   * Memoized level sorting to prevent redundant computation across splice operations.
   */
  private static getSortedLevels(levels: RiskMap): RiskEntry[] {
    let cached = this.LEVEL_CACHE.get(levels);
    if (cached) return cached;

    cached = Object.entries(levels)
      .filter(([, cfg]) => typeof cfg?.level === 'number')
      .sort((a, b) => b[1].level - a[1].level);

    this.LEVEL_CACHE.set(levels, cached);
    return cached;
  }

  /**
   * Analyzes a single sequence wrapper.
   */
  public static async analyzeSequence(sequence: string): Promise<AnalysisResult | null> {
    return this.assessRisk(sequence);
  }

  /**
   * Processes a batch of sequences with LRU-protected caching.
   */
  public static async processBatch(sequences: string[]): Promise<(AnalysisResult | null)[]> {
    return Promise.all(
      sequences.map(async (sequence) => {
        let result = this.BATCH_CACHE.get(sequence);
        
        if (result === undefined) {
          result = await this.assessRisk(sequence);
          this.BATCH_CACHE.set(sequence, result);
          
          // DALKE PURGE: Maintain memory integrity
          if (this.BATCH_CACHE.size > this.CACHE_LIMIT) {
            const oldestKey = this.BATCH_CACHE.keys().next().value;
            if (oldestKey !== undefined) this.BATCH_CACHE.delete(oldestKey);
          }
        }
        return result;
      })
    );
  }
}

export default RiskEnforcementMap;