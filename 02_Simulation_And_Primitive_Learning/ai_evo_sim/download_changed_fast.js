/**
 * @file download_changed_fast.js
 * @description System Integrity Auditor (SIA): Synchronizes local repository state with the remote source of truth.
 * Role: Acts as a diagnostic and recovery utility for the DARLEK_CAAN_ENGINE architecture.
 * Integration: Connects with remote_blobs.json to verify file integrity and perform atomic updates.
 * Pattern: Siphoned from Microsoft Playwright (Network robustness) and Google ZX (CLI scripting).
 */

const fs = require('fs/promises');
const { createWriteStream } = require('fs');
const https = require('https');
const path = require('path');
const { pipeline } = require('stream/promises');
const crypto = require('crypto');

const REMOTE_BASE_URL = 'https://raw.githubusercontent.com/craighckby-stack/epistemic_debate_engine/main/';
const CONCURRENCY_LIMIT = 5;
const TIMEOUT_MS = 15000;

/**
 * @typedef {Object} BlobManifest
 * @property {string} path - Relative path of the file
 * @property {string} hash - Integrity checksum (SHA-256)
 */

class SystemAuditService {
  /**
   * Validates file integrity against SHA-256 checksums.
   * @param {string} filePath 
   * @param {string} expectedHash 
   */
  static async verifyIntegrity(filePath, expectedHash) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      return hash === expectedHash;
    } catch (e) {
      return false;
    }
  }

  /**
   * Performs atomic file synchronization.
   * @param {BlobManifest} blob 
   */
  static async sync(blob) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const url = `${REMOTE_BASE_URL}${blob.path}`;
      const tempPath = `${blob.path}.tmp`;
      await fs.mkdir(path.dirname(blob.path), { recursive: true });

      await new Promise((resolve, reject) => {
        https.get(url, { 
          headers: { 'User-Agent': 'DARLEK_CAAN_ENGINE_AUDITOR' },
          signal: controller.signal 
        }, async (res) => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          try {
            await pipeline(res, createWriteStream(tempPath));
            const isValid = await this.verifyIntegrity(tempPath, blob.hash);
            if (!isValid) throw new Error(`Integrity mismatch for ${blob.path}`);
            await fs.rename(tempPath, blob.path);
            resolve();
          } catch (err) { reject(err); }
        }).on('error', reject);
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Orchestrates the audit lifecycle.
 */
async function runAudit() {
try {
    const rawData = await fs.readFile('remote_blobs.json', 'utf8');
    /** @type {BlobManifest[]} */
    const remoteBlobs = JSON.parse(rawData);
    const results = { success: [], failed: [] };

    for (let i = 0; i < remoteBlobs.length; i += CONCURRENCY_LIMIT) {
      const batch = remoteBlobs.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.all(batch.map(async (blob) => {
        try {
          await SystemAuditService.sync(blob);
results.success.push(blob.path);
        } catch (err) {
          console.error(`[AUDIT_ERROR] Failed to sync ${blob.path}: ${err.message}`);
          results.failed.push(blob.path);
        }
      }));
    }
} catch (err) {
    console.error(`[FATAL_ERROR] Auditor failed: ${err.message}`);
    process.exit(1);
  }
}

runAudit();




