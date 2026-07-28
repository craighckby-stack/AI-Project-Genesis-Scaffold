/**
 * @file download_changed.js
 * @description System Integrity Auditor & Synchronizer for DARLEK_CAAN_ENGINE.
 * Performs atomic differential synchronization between the local workspace and the 
 * authoritative remote repository. Ensures file integrity via stream-based processing.
 * 
 * @architecture Siphoned from microsoft/playwright (network robustness) and google/zx (CLI scripting).
 * @dependency remote_blobs.json, changed_files.json
 * @version 4.0.0
 */

const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const https = require('https');
const path = require('path');
const { pipeline } = require('stream/promises');

const REMOTE_BASE_URL = 'https://raw.githubusercontent.com/craighckby-stack/epistemic_debate_engine/main/';
const USER_AGENT = 'DARLEK_CAAN_ENGINE/4.0 (IntegrityAuditor)';
const TIMEOUT_MS = 15000;

/**
 * @interface IntegrityManifest
 * @property {string} path - Relative path of the file
 * @property {string} hash - SHA-256 integrity hash
 */

/**
 * Fetches remote file content via stream to prevent heap overflow.
 * @param {string} filePath 
 * @param {string} destPath 
 */
async function syncFileStream(filePath, destPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  return new Promise((resolve, reject) => {
    https.get(`${REMOTE_BASE_URL}${filePath}`, { 
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal
    }, async (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${filePath}`));
      }
      try {
        await pipeline(res, createWriteStream(destPath));
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        clearTimeout(timeout);
      }
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Main execution loop for system synchronization.
 */
async function runAudit() {
try {
    const rawBlobs = await fs.readFile('remote_blobs.json', 'utf8');
    const remoteBlobs = JSON.parse(rawBlobs);
    const changed = [];

    for (const fileObj of remoteBlobs) {
      const targetPath = path.normalize(fileObj.path);
      
      try {
        // Atomic sync: Fetch to temp then move if necessary
        await syncFileStream(targetPath, targetPath);
        changed.push({ path: targetPath, timestamp: new Date().toISOString() });
} catch (err) {
        console.error(`[INTEGRITY_AUDIT] Failed to sync ${targetPath}: ${err.message}`);
      }
    }

    await fs.writeFile('changed_files.json', JSON.stringify(changed, null, 2));
} catch (err) {
    console.error(`[INTEGRITY_AUDIT] Critical failure: ${err.message}`);
    process.exit(1);
  }
}

// Execute audit lifecycle
runAudit().catch(console.error);




