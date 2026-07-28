import { createReadStream, promises as fs } from 'fs';
import { join, extname } from 'path';
import { createInterface } from 'readline';

/**
 * OMEGA SECURITY VALIDATOR v4.0
 * Architecture: Stream-based recursive scanning with entropy-gated pattern matching.
 * Integrated from: sovereign-kernel / SN-OMEGA / darlek-cann-v3
 */

interface SecurityReport {
  filePath: string;
  line: number;
  pattern: string;
  severity: 'CRITICAL' | 'WARNING';
}

const SECURITY_POLICY = {
  entropyThreshold: 4.8,
  forbiddenExtensions: new Set(['.vault', '.brain', '.key', '.pem', '.env']),
  secretPatterns: [
    { name: 'API_KEY', regex: /API_KEY|SECRET|TOKEN|PRIVATE_KEY/i },
    { name: 'JWT', regex: /eyJ[a-zA-Z0-9_-]{10,}/ },
  ],
  maxDepth: 5,
};

class SecurityValidator {
  private async calculateEntropy(str: string): Promise<number> {
    if (!str) return 0;
    const frequencies: Record<string, number> = {};
    for (const char of str) frequencies[char] = (frequencies[char] || 0) + 1;
    const len = str.length;
    return Object.values(frequencies).reduce((acc, freq) => {
      const p = freq / len;
      return acc - p * Math.log2(p);
    }, 0);
  }

  public async scan(dir: string, depth: number = 0): Promise<SecurityReport[]> {
    if (depth > SECURITY_POLICY.maxDepth) return [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const reports: SecurityReport[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        reports.push(...(await this.scan(fullPath, depth + 1)));
      } else if (SECURITY_POLICY.forbiddenExtensions.has(extname(entry.name))) {
        reports.push({ filePath: fullPath, line: 0, pattern: 'FORBIDDEN_EXTENSION', severity: 'CRITICAL' });
      } else {
        reports.push(...(await this.analyzeFile(fullPath)));
      }
    }
    return reports;
  }

  private async analyzeFile(filePath: string): Promise<SecurityReport[]> {
    const reports: SecurityReport[] = [];
    const fileStream = createReadStream(filePath);
    const rl = createInterface({ input: fileStream, crlfDelay: Infinity });
    let lineNum = 0;

    for await (const line of rl) {
      lineNum++;
      for (const { name, regex } of SECURITY_POLICY.secretPatterns) {
        if (regex.test(line)) {
          const entropy = await this.calculateEntropy(line);
          if (entropy > SECURITY_POLICY.entropyThreshold) {
            reports.push({ filePath, line: lineNum, pattern: name, severity: 'CRITICAL' });
          }
        }
      }
    }
    return reports;
  }
}

export const runSecurityAudit = async (root: string) => {
  const validator = new SecurityValidator();
const results = await validator.scan(root);
  if (results.length > 0) {
    console.error('SECURITY BREACHES DETECTED:', JSON.stringify(results, null, 2));
    process.exit(1);
  }
};





