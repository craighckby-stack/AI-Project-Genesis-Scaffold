/**
 * @file find_changed.js
 * @description High-performance System Integrity Auditor. 
 * Connects to GitHub API to compare local repository state against remote blobs.
 * Part of the DARLEK_CAAN_ENGINE ecosystem for autonomous repository synchronization.
 */

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

/**
 * @typedef {Object} BlobManifest
 * @property {string} path
 * @property {string} sha
 */

const CONFIG = {
  REPO: 'craighckby-stack/epistemic_debate_engine',
  LOCAL_DIR: 'src',
  API_URL: 'https://api.github.com/repos/craighckby-stack/epistemic_debate_engine/git/trees/main?recursive=1',
  TIMEOUT: 10000,
  MAX_RETRIES: 3
};

async function fetchWithRetry(url, retries = CONFIG.MAX_RETRIES) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'DARLEK-CAAN-ENGINE', 'Accept': 'application/vnd.github.v3+json' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (err) {
    if (retries > 0) return fetchWithRetry(url, retries - 1);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function getLocalFiles(dir) {
  let files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(await getLocalFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function auditSystem() {
  try {
const remoteData = await fetchWithRetry(CONFIG.API_URL);
    const remoteBlobs = remoteData.tree.filter(f => f.type === 'blob');
    
    const localFiles = await getLocalFiles(CONFIG.LOCAL_DIR);
    const auditReport = [];

    for (const remote of remoteBlobs) {
      const localPath = path.join(CONFIG.LOCAL_DIR, remote.path);
      try {
        const content = await fs.readFile(localPath, 'utf8');
        const hash = crypto.createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0${content}`).digest('hex');
        
        if (hash !== remote.sha) {
          auditReport.push({ path: remote.path, status: 'MODIFIED' });
        }
      } catch (e) {
        auditReport.push({ path: remote.path, status: 'MISSING' });
      }
    }

    await fs.writeFile('audit_report.json', JSON.stringify(auditReport, null, 2));
} catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  }
}

auditSystem();





