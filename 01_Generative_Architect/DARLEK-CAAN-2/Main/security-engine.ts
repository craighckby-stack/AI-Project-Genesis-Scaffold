/**
 * @file security-engine.ts
 * @description Enterprise-grade security orchestration engine.
 * Inspired by Microsoft Semantic Kernel and Google Guava security patterns.
 * @version 3.0.0
 */

export enum ThreatLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SecurityReport {
  isSafe: boolean;
  threatLevel: ThreatLevel;
  violations: string[];
  entropyScore: number;
}

export interface SecurityEngineConfig {
  strictMode: boolean;
  maxEntropyThreshold: number;
}

/**
 * SecurityEngine: Orchestrates content sanitization and threat detection.
 * Designed for high-throughput agentic environments.
 */
export const SecurityEngine = {
  /**
   * Performs a multi-layered security scan on input content.
   * @param content - The raw string input to analyze.
   * @param config - Operational parameters for the scan.
   */
  scan: (content: string, config: SecurityEngineConfig = { strictMode: true, maxEntropyThreshold: 0.8 }): SecurityReport => {
    const violations: string[] = [];
    
    // 1. Pattern Matching: Detect common injection vectors (Siphoned from Microsoft/AutoGen patterns)
    const injectionPatterns = [/eval\s*\(/gi, /process\.env/gi, /<script/gi, /exec\s*\(/gi];
    injectionPatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        violations.push(`Injection vector detected: ${pattern.source}`);
      }
    });

    // 2. Entropy Analysis: Detect obfuscated or malicious payloads
    const entropy = SecurityEngine._calculateEntropy(content);
    if (entropy > config.maxEntropyThreshold) {
      violations.push(`High entropy detected: ${entropy.toFixed(2)}. Potential obfuscation.`);
    }

    const threatLevel = violations.length === 0 
      ? ThreatLevel.NONE 
      : violations.length > 2 ? ThreatLevel.CRITICAL : ThreatLevel.MEDIUM;

    return {
      isSafe: violations.length === 0,
      threatLevel,
      violations,
      entropyScore: entropy
    };
  },

  /**
   * Internal utility to calculate Shannon entropy of a string.
   * Used to identify potential malicious obfuscation.
   */
  _calculateEntropy: (str: string): number => {
    if (!str) return 0;
    const len = str.length;
    const frequencies: Record<string, number> = {};
    for (const char of str) frequencies[char] = (frequencies[char] || 0) + 1;
    
    return Object.values(frequencies).reduce((acc, count) => {
      const p = count / len;
      return acc - p * Math.log2(p);
    }, 0) / 8; // Normalized to 0-1 range
  }
};

export default SecurityEngine;



