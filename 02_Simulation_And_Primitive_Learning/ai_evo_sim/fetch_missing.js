/**
 * @file fetch_missing.js
 * @description System Integrity Auditor: Synchronizes local repository state with remote GitHub tree definitions.
 * Part of the DARLEK_CAAN_ENGINE. Ensures atomic file discovery and missing-file manifest generation.
 * 
 * @architecture Siphoned from microsoft/playwright (network robustness) and google/zx (CLI ergonomics).
 * @integration Connects to DARLEK_CAAN_ENGINE registry to validate system completeness.
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * @typedef {Object} AuditConfig
 * @property {number} TIMEOUT_MS
 * @property {number} MAX_RETRIES
 * @property {string} USER_AGENT
 * @property {string} TARGET_REPO
 */

/** @type {AuditConfig} */
const CONFIG = {
  TIMEOUT_MS: 15000,
  MAX_RETRIES: 3,
  USER_AGENT: 'DARLEK_CAAN_ENGINE_AUDITOR/3.0',
  TARGET_REPO: 'craighckby-stack/epistemic_debate_engine',
};

class SystemAuditService {
  /**
   * Performs an atomic fetch with exponential backoff and lifecycle management.
   * @param {string} url 
   * @param {number} retries 
   * @returns {Promise<any>}
   */
  async fetchWithRetry(url, retries = CONFIG.MAX_RETRIES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': CONFIG.USER_AGENT },
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (CONFIG.MAX_RETRIES - retries + 1)));
        return this.fetchWithRetry(url, retries - 1);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Iterative directory scanner to prevent stack overflow on deep trees.
   * @param {string} dir 
   * @returns {Promise<string[]>}
   */
  async getLocalFiles(dir) {
    const files = [];
    const queue = [dir];

    while (queue.length > 0) {
      const currentDir = queue.pop();
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            queue.push(fullPath);
          } else {
            files.push(path.relative(process.cwd(), fullPath));
          }
        }
      } catch (e) {
        // Silently skip inaccessible directories
      }
    }
    return files;
  }

  /**
   * Executes the audit lifecycle.
   */
  async run() {
try {
      const url = `https://api.github.com/repos/${CONFIG.TARGET_REPO}/git/trees/main?recursive=1`;
      const remoteData = await this.fetchWithRetry(url);
      
      const remoteFiles = (remoteData.tree || []).filter(f => f.type === 'blob');
      const localPaths = new Set(await this.getLocalFiles(path.join(process.cwd(), 'src')));

      const missing = remoteFiles.filter(f => !localPaths.has(f.path) && f.path.startsWith('src/'));

      await fs.writeFile('missing_files.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        count: missing.length,
        files: missing
      }, null, 2));
} catch (err) {
      console.error('[FATAL] Audit Failure:', err.message);
      process.exit(1);
    }
  }
}

// Initialize and execute the auditor
const auditor = new SystemAuditService();
auditor.run();




