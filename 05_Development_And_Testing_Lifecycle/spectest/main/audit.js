// =============================================================================
// audit.js — Immutable, Timestamped Audit Trail
// =============================================================================
// All alignment decisions are logged here. The trail is append-only.
// Each entry is frozen after creation (immutable by convention).
// =============================================================================

'use strict';

class AuditLogger {
  constructor() {
    this._trail = [];
    this._maxSize = 10000; // Keep last 10k entries
  }

  /**
   * Log an audit entry. Every entry is frozen (immutable).
   * @param {'info'|'warn'|'error'|'debug'|'decision'} level
   * @param {string} module - Which module produced this entry
   * @param {string} event - What happened
   * @param {object} data - Associated data
   */
  static log(level, module, event, data = {}) {
    const entry = Object.freeze({
      timestamp: new Date().toISOString(),
      level,
      module,
      event,
      data: Object.freeze({ ...data }),
      id: AuditLogger._generateId()
    });

    // Static instance fallback (for module-level usage)
    if (!AuditLogger._instance) {
      AuditLogger._instance = new AuditLogger();
    }
    AuditLogger._instance._append(entry);
    return entry;
  }

  /**
   * Convenience methods.
   */
  static info(module, event, data) { return AuditLogger.log('info', module, event, data); }
  static warn(module, event, data) { return AuditLogger.log('warn', module, event, data); }
  static error(module, event, data) { return AuditLogger.log('error', module, event, data); }
  static debug(module, event, data) { return AuditLogger.log('debug', module, event, data); }
  static decision(module, event, data) { return AuditLogger.log('decision', module, event, data); }

  /**
   * Append to the trail. Enforces max size by shifting oldest entries.
   */
  _append(entry) {
    this._trail.push(entry);
    if (this._trail.length > this._maxSize) {
      this._trail.shift();
    }
  }

  /**
   * Get full audit trail (read-only copy).
   */
  getTrail() {
    return [...this._trail];
  }

  /**
   * Get trail entries filtered by module, level, or time range.
   */
  query(filters = {}) {
    let results = this._trail;

    if (filters.module) {
      results = results.filter(e => e.module === filters.module);
    }
    if (filters.level) {
      results = results.filter(e => e.level === filters.level);
    }
    if (filters.since) {
      const since = new Date(filters.since).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() >= since);
    }
    if (filters.until) {
      const until = new Date(filters.until).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() <= until);
    }
    if (filters.event) {
      results = results.filter(e => e.event.includes(filters.event));
    }

    return results;
  }

  /**
   * Get decision history specifically (level === 'decision').
   */
  getDecisions() {
    return this._trail.filter(e => e.level === 'decision');
  }

  /**
   * Get violation history.
   */
  getViolations() {
    return this._trail.filter(e =>
      e.event.includes('violation') || e.event.includes('blocked') ||
      e.event.includes('escalat')
    );
  }

  /**
   * Export trail as JSON string.
   */
  exportJSON() {
    return JSON.stringify(this._trail, null, 2);
  }

  /**
   * Clear the trail (for testing only).
   */
  clear() {
    this._trail = [];
  }

  /**
   * Generate a short unique ID for each entry.
   */
  static _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  /**
   * Get or create singleton instance.
   */
  static getInstance() {
    if (!AuditLogger._instance) {
      AuditLogger._instance = new AuditLogger();
    }
    return AuditLogger._instance;
  }
}

module.exports = AuditLogger;




