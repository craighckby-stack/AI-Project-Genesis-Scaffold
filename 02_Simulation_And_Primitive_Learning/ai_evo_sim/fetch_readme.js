/**
 * @file fetch_readme.js
 * @module DARLEK_CAAN_ENGINE/KNOWLEDGE_ACQUISITION
 * @description High-performance, resilient README acquisition and metadata extraction engine.
 * 
 * ARCHITECTURAL BLUEPRINT:
 * [Remote Source] -> [Retry/Backoff Layer] -> [AbortController/Timeout] -> [Stream/Buffer Validation] -> [Metadata Extraction] -> [System Context]
 * 
 * INTEGRATION:
 * This module serves as the primary ingestion point for the DARLEK_CAAN_ENGINE to understand 
 * the architectural intent of external repositories in the user's portfolio.
 */

'use strict';

const fs = require('fs').promises;
const path = require('path');

/**
 * @typedef {Object} SiphonConfig
 * @property {string} DEFAULT_URL
 * @property {number} TIMEOUT_MS
 * @property {number} MAX_RETRIES
 * @property {number} BACKOFF_FACTOR
 * @property {number} MAX_FILE_SIZE_BYTES
 * @property {string} USER_AGENT
 */

/** @type {SiphonConfig} */
const CONFIG = {
  DEFAULT_URL: 'https://raw.githubusercontent.com/craighckby-stack/epistemic_debate_engine/main/README.md',
  TIMEOUT_MS: 15000,
  MAX_RETRIES: 3,
  BACKOFF_FACTOR: 2,
  MAX_FILE_SIZE_BYTES: 2 * 1024 * 1024, // 2MB limit
  USER_AGENT: 'DARLEK-CAAN-EVOLUTION-ENGINE/3.0 (Node.js; Evolution Controller)',
};

/**
 * Custom Error class for Siphon operations.
 */
class SiphonError extends Error {
  /**
   * @param {string} message 
   * @param {string} code 
   * @param {boolean} retryable 
   */
  constructor(message, code, retryable = false) {
    super(message);
    this.name = 'SiphonError';
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * README_SIPHON_CORE: Orchestrates the retrieval and analysis of remote documentation.
 */
class ReadmeSiphon {
  /**
   * Fetches a remote resource with exponential backoff and timeout.
   * @param {string} url 
   * @param {number} attempt 
   * @returns {Promise<string>}
   */
  static async fetchWithResilience(url, attempt = 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': CONFIG.USER_AGENT }
      });

      if (!response.ok) {
        const isRetryable = response.status === 429 || response.status >= 500;
        throw new SiphonError(`HTTP Error: ${response.status} ${response.statusText}`, String(response.status), isRetryable);
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > CONFIG.MAX_FILE_SIZE_BYTES) {
        throw new SiphonError('Resource exceeds maximum allowed size.', 'SIZE_EXCEEDED', false);
      }

      return await response.text();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new SiphonError(`Request timed out after ${CONFIG.TIMEOUT_MS}ms`, 'TIMEOUT', true);
      }

      if (error instanceof SiphonError && error.retryable && attempt < CONFIG.MAX_RETRIES) {
        const delay = Math.pow(CONFIG.BACKOFF_FACTOR, attempt) * 1000;
        console.warn(`[RETRY] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithResilience(url, attempt + 1);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Extracts metadata from the README content.
   * @param {string} content 
   * @returns {{title: string, description: string, byteLength: number, timestamp: string}}
   */
  static extractMetadata(content) {
    const titleMatch = content.match(/^#\s+(.*)/m);
    const descriptionMatch = content.match(/^#.*\n+([^#\n].*)/m);

    return {
      title: titleMatch ? titleMatch[1].trim() : 'Unknown Repository',
      description: descriptionMatch ? descriptionMatch[1].trim() : 'No description provided.',
      byteLength: Buffer.byteLength(content, 'utf8'),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Main execution entry point.
   * @param {string} targetUrl 
   */
  static async execute(targetUrl = CONFIG.DEFAULT_URL) {
try {
      const content = await this.fetchWithResilience(targetUrl);
      const metadata = this.extractMetadata(content);

      console.table(metadata);
      
      const cachePath = path.join(process.cwd(), '.siphon_cache.md');
      await fs.writeFile(cachePath, content);
} catch (error) {
      console.error(`[CRITICAL_FAILURE] ${error.message}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const customUrl = process.argv[2];
  ReadmeSiphon.execute(customUrl).catch(err => {
    console.error('Unhandled Exception:', err);
    process.exit(1);
  });
}

module.exports = ReadmeSiphon;



