import riskLevelsConfig from '../../../config/atm_risk_levels.json';

/**
 * @file RiskEnforcementMap
 * @description Dalek-grade security protocol for DNA/Code mutation validation.
 * Engineered for maximum throughput and zero-latency enforcement.
 */

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface RiskPattern {
  readonly id: string;
  readonly regex: RegExp;
  readonly severity: Severity;
  readonly weight: number;
}

export class RiskEnforcementMap {
  private static readonly SEVERITY_WEIGHTS: Readonly<Record<Severity, number>> = {
    CRITICAL: 1.0,
    HIGH: 0.7,
    MEDIUM: 0.4,
    LOW: 0.1,
  };

  private static readonly DANGEROUS_PATTERNS: readonly RiskPattern[] = [
    {
      id: 'EVAL_EXECUTION',
      regex: /eval\s*\(/gi,
      severity: 'CRITICAL',
      weight: 2.0,
    },
    {
      id: 'DYNAMIC_FUNCTION',
      regex: /new\s+Function\s*\(/gi,
      severity: 'CRITICAL',
      weight: 2.0,
    },
    {
      id: 'TIMEOUT_STRING',
      regex: /setTimeout\(['"].*['"]\)/gi,
      severity: 'HIGH',
      weight: 1.5,
    },
  ];

  private static readonly RISK_THRESHOLDS: Readonly<Record<string, number>> = Object.freeze(
    Object.fromEntries(
      Object.entries(RiskEnforcementMap.SEVERITY_WEIGHTS).map(([sev, weight]) => [
        sev,
        Math.ceil(100 / weight),
      ])
    )
  );

  /**
   * Assesses mutation risk with optimized linear scanning.
   * Utilizes regex pointer reset for high-frequency reuse.
   */
  public static assessRisk(content: string): {
    isSecure: boolean;
    score: number;
    violations: string[];
  } {
    if (!content) return { isSecure: true, score: 0, violations: [] };

    let rawScore = 0;
    const violations = new Set<string>();

    for (let i = 0; i < this.DANGEROUS_PATTERNS.length; i++) {
      const { id, regex, severity, weight } = this.DANGEROUS_PATTERNS[i];
      regex.lastIndex = 0;
      
      let matches = 0;
      while (regex.test(content)) matches++;

      if (matches > 0) {
        violations.add(`${id} (${severity})`);
        rawScore += this.SEVERITY_WEIGHTS[severity] * matches * weight;
      }
    }

    const score = Math.ceil(rawScore);
    const isSecure = score < this.RISK_THRESHOLDS.CRITICAL;

    return {
      isSecure,
      score,
      violations: [...violations],
    };
  }

  /**
   * Primary enforcement gateway. 
   * @throws {Error} EXTERMINATE signal if risk threshold is breached.
   */
  public static enforce(content: string): boolean {
    const { isSecure, score, violations } = this.assessRisk(content);
    
    if (!isSecure) {
      const errorMsg = `EXTERMINATE: Risk Assessment Failed. Score: ${score}. Violations: ${violations.join(', ')}`;
      console.error(`[SECURITY_BREACH] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    return true;
  }

  /**
   * Maps content density to the highest applicable hierarchy node.
   * Optimized search for rapid classification.
   */
  public static getRiskLevel(
    content: string, 
    levels: Record<string, { level: number }> = riskLevelsConfig
  ): Record<string, { level: number }> | null {
    if (typeof content !== 'string' || !content || !levels) return null;

    let riskScore = 0;
    for (let i = 0; i < this.DANGEROUS_PATTERNS.length; i++) {
      const { regex, weight } = this.DANGEROUS_PATTERNS[i];
      regex.lastIndex = 0;
      let count = 0;
      while (regex.test(content)) count++;
      riskScore += count * weight;
    }

    let apexKey: string | null = null;
    let apexValue: { level: number } | null = null;

    const entries = Object.entries(levels);
    for (let i = 0; i < entries.length; i++) {
      const [key, config] = entries[i];
      if (riskScore >= config.level) {
        if (!apexValue || config.level > apexValue.level) {
          apexKey = key;
          apexValue = config;
        }
      }
    }

    return apexKey && apexValue ? { [apexKey]: apexValue } : null;
  }
}

export default RiskEnforcementMap;