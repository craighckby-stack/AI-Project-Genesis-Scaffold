/**
 * @file compare.js
 * @description System Integrity Auditor (SIA). Performs deep-parity analysis between local workspace and remote repository.
 * Role: Diagnostic utility for the DARLEK_CAAN_ENGINE architectural registry.
 * Integration: Connects to GitHub API to verify file parity, detect drift, and validate SHA-256 integrity.
 * 
 * @architecture DARLEK_CAAN_ENGINE v3.0
 * @dependencies fs, path, https, crypto, stream
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as crypto from 'crypto';
import { Buffer } from 'buffer';

interface AuditResult {
  missingRemote: string[];
  missingLocal: string[];
  driftedFiles: string[];
  timestamp: string;
  status: 'INTEGRITY_VERIFIED' | 'DRIFT_DETECTED';
}

interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
}

class SystemAuditService {
  private readonly REPO_API = 'https://api.github.com/repos/craighckby-stack/epistemic_debate_engine/git/trees/main?recursive=1';
  private readonly USER_AGENT = 'DARLEK-CAAN-INTEGRITY-AUDITOR-V3';

  private async fetchRemoteTree(): Promise<GitHubTreeItem[]> {
    return new Promise((resolve, reject) => {
      const req = https.get(this.REPO_API, { headers: { 'User-Agent': this.USER_AGENT } }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.tree || []);
          } catch (e) { reject(new Error('GitHub API Parse Error')); }
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  private calculateHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  private walkLocal(dir: string, fileList: Map<string, string> = new Map()): Map<string, string> {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (file.startsWith('.') || file === 'node_modules' || file === 'dist') continue;
      if (fs.statSync(filePath).isDirectory()) {
        this.walkLocal(filePath, fileList);
      } else {
        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        fileList.set(relativePath, this.calculateHash(filePath));
      }
    }
    return fileList;
  }

  public async runAudit(): Promise<AuditResult> {
    const remoteTree = await this.fetchRemoteTree();
    const localFiles = this.walkLocal(process.cwd());
    
    const remoteBlobs = remoteTree.filter(f => f.type === 'blob');
    const remotePaths = remoteBlobs.map(f => f.path);
    
    const missingRemote = Array.from(localFiles.keys()).filter(f => !remotePaths.includes(f));
    const missingLocal = remotePaths.filter(f => !localFiles.has(f));
    const driftedFiles = remoteBlobs
      .filter(f => localFiles.has(f.path) && localFiles.get(f.path) !== f.sha.substring(0, 64))
      .map(f => f.path);

    return {
      missingRemote,
      missingLocal,
      driftedFiles,
      timestamp: new Date().toISOString(),
      status: (missingRemote.length === 0 && missingLocal.length === 0 && driftedFiles.length === 0) ? 'INTEGRITY_VERIFIED' : 'DRIFT_DETECTED'
    };
  }
}

const auditor = new SystemAuditService();
auditor.runAudit().then(result => {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.status === 'DRIFT_DETECTED' ? 1 : 0);
}).catch(err => {
  console.error('[AUDIT_CRITICAL_FAILURE]', err.message);
  process.exit(1);
});




