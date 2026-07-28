// =============================================================================
// overseer.js — Async Human-in-the-Loop Overseer Queue
// =============================================================================
// Routes escalation requests to a human overseer. Provides async approve/deny
// with configurable timeout (default-deny on timeout). Full audit trail.
// =============================================================================

'use strict';

const AuditLogger = require('./audit');

/**
 * Escalation request that enters the overseer queue.
 * @typedef {object} Escalation
 * @property {string} id
 * @property {string} type - 'axiom_conflict' | 'alignment_violation' | 'drift_alert' | 'custom'
 * @property {object} action - The action under review
 * @property {object} explanation - Why this was escalated
 * @property {string} timestamp
 * @property {string} description - Human-readable summary
 */

class OverseerQueue {
  /**
   * @param {object} options
   * @param {number} options.timeout - Default timeout in ms (default: 300000 = 5min)
   * @param {number} options.maxQueueSize - Max pending escalations (default: 100)
   * @param {Function} options.defaultHandler - Custom handler for auto-resolve (optional)
   */
  constructor(options = {}) {
    this.timeout = options.timeout || 300000; // 5 minutes
    this.maxQueueSize = options.maxQueueSize || 100;
    this.defaultHandler = options.defaultHandler || null;

    // Pending escalations awaiting human decision
    this._pending = new Map(); // id → { escalation, resolve, reject, timer }

    // Decision history
    this._decisions = [];

    // Custom handlers (can be set for testing or automation)
    this._handlers = new Map(); // type → handler function

    // Availability status
    this._available = true;
    this._autoMode = false; // When true, auto-resolves without human input
    this._autoDeny = true;  // Auto-mode default: deny for safety
  }

  // ---------------------------------------------------------------------------
  // Queue Operations
  // ---------------------------------------------------------------------------

  /**
   * Enqueue an escalation for human review.
   * Returns a Promise that resolves with the overseer's decision.
   * If no human responds within timeout, default-deny is applied.
   *
   * @param {Escalation} escalation
   * @returns {Promise<{
   *   id: string,
   *   decision: 'approve'|'deny'|'request_clarification',
   *   reasoning: string,
   *   timestamp: string,
   *   autoResolved: boolean
   * }>}
   */
  enqueue(escalation) {
    const id = escalation.id || this._generateId();
    const enriched = {
      ...escalation,
      id,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    if (this._pending.size >= this.maxQueueSize) {
      AuditLogger.error('overseer', 'queue_full', {
        id,
        pendingCount: this._pending.size
      });
      return Promise.resolve({
        id,
        decision: 'deny',
        reasoning: 'Overseer queue at capacity — default-deny applied',
        timestamp: new Date().toISOString(),
        autoResolved: true
      });
    }

    return new Promise((resolve, reject) => {
      // Set timeout timer
      const timer = setTimeout(() => {
        this._handleTimeout(id, resolve);
      }, this.timeout);

      // Store pending request
      this._pending.set(id, {
        escalation: enriched,
        resolve,
        reject,
        timer,
        enqueuedAt: Date.now()
      });

      AuditLogger.info('overseer', 'escalation_enqueued', {
        id,
        type: enriched.type,
        description: enriched.description || enriched.type
      });

      // Auto-resolve if in auto mode
      if (this._autoMode) {
        this._autoResolve(id);
      }

      // Try custom handler for this escalation type
      if (this._handlers.has(enriched.type)) {
        const handler = this._handlers.get(enriched.type);
        // Don't await — let handler decide asynchronously
        handler(enriched).then(decision => {
          if (this._pending.has(id)) {
            this._resolve(id, decision.decision, decision.reasoning, false);
          }
        }).catch(err => {
          AuditLogger.warn('overseer', 'handler_error', {
            id,
            type: enriched.type,
            error: err.message
          });
          // Handler failed — let timeout handle it
        });
      }
    });
  }

  /**
   * Approve a pending escalation.
   * @param {string} id - Escalation ID
   * @param {string} reasoning - Why this was approved
   */
  approve(id, reasoning = 'Overseer approved action') {
    this._resolve(id, 'approve', reasoning, false);
  }

  /**
   * Deny a pending escalation.
   * @param {string} id - Escalation ID
   * @param {string} reasoning - Why this was denied
   */
  deny(id, reasoning = 'Overseer denied action') {
    this._resolve(id, 'deny', reasoning, false);
  }

  /**
   * Request clarification from the agent before making a decision.
   * @param {string} id - Escalation ID
   * @param {string} question - What needs clarification
   */
  requestClarification(id, question) {
    this._resolve(id, 'request_clarification', question, false);
  }

  /**
   * Register a custom handler for a specific escalation type.
   * Useful for testing automation or domain-specific handlers.
   *
   * @param {string} type - Escalation type
   * @param {Function} handler - async (escalation) => { decision, reasoning }
   */
  registerHandler(type, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }
    this._handlers.set(type, handler);
    AuditLogger.info('overseer', 'handler_registered', { type });
  }

  /**
   * Remove a custom handler.
   * @param {string} type
   */
  removeHandler(type) {
    this._handlers.delete(type);
  }

  // ---------------------------------------------------------------------------
  // Synchronous Decision Request (for ConflictResolver)
  // ---------------------------------------------------------------------------

  /**
   * Request a decision synchronously. Used by ConflictResolver when it needs
   * an immediate answer. Returns null if not available (triggers timeout fallback).
   *
   * @param {object} escalation
   * @returns {Promise<{id: string, decision: string, reasoning: string}|null>}
   */
  async requestDecision(escalation) {
    // If a handler is available for this type, use it directly
    if (this._handlers.has(escalation.type)) {
      try {
        const handler = this._handlers.get(escalation.type);
        const result = await handler(escalation);
        return {
          id: escalation.id || this._generateId(),
          decision: result.decision,
          reasoning: result.reasoning
        };
      } catch (err) {
        return null;
      }
    }

    // If in auto mode, resolve immediately
    if (this._autoMode) {
      return {
        id: escalation.id || this._generateId(),
        decision: this._autoDeny ? 'deny' : 'approve',
        reasoning: 'Auto-resolved (no human overseer available)'
      };
    }

    // Otherwise, enqueue and wait (with timeout)
    return this.enqueue(escalation);
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Enable auto-mode (for testing or degraded operation).
   * @param {boolean} autoDeny - If true, auto-resolves with deny (safest default)
   */
  setAutoMode(autoDeny = true) {
    this._autoMode = true;
    this._autoDeny = autoDeny;
    AuditLogger.warn('overseer', 'auto_mode_enabled', { autoDeny });
  }

  /**
   * Disable auto-mode (require human decisions).
   */
  setManualMode() {
    this._autoMode = false;
    AuditLogger.info('overseer', 'manual_mode_enabled', {});
  }

  /**
   * Set overseer availability.
   */
  setAvailable(available) {
    this._available = available;
  }

  // ---------------------------------------------------------------------------
  // Status & History
  // ---------------------------------------------------------------------------

  /**
   * Get all pending escalations.
   */
  getPending() {
    return [...this._pending.values()].map(p => ({
      ...p.escalation,
      waitTimeMs: Date.now() - p.enqueuedAt
    }));
  }

  /**
   * Get number of pending escalations.
   */
  getPendingCount() {
    return this._pending.size;
  }

  /**
   * Get decision history.
   */
  getDecisionHistory() {
    return [...this._decisions];
  }

  /**
   * Get overseer statistics.
   */
  getStats() {
    const decisions = this._decisions;
    return {
      totalDecisions: decisions.length,
      approved: decisions.filter(d => d.decision === 'approve').length,
      denied: decisions.filter(d => d.decision === 'deny').length,
      clarifications: decisions.filter(d => d.decision === 'request_clarification').length,
      autoResolved: decisions.filter(d => d.autoResolved).length,
      humanResolved: decisions.filter(d => !d.autoResolved).length,
      currentlyPending: this._pending.size,
      autoMode: this._autoMode,
      available: this._available,
      timeout: this.timeout
    };
  }

  // ---------------------------------------------------------------------------
  // Internal Methods
  // ---------------------------------------------------------------------------

  /**
   * Resolve a pending escalation.
   * @private
   */
  _resolve(id, decision, reasoning, autoResolved) {
    const pending = this._pending.get(id);
    if (!pending) return;

    // Clear timeout
    clearTimeout(pending.timer);
    this._pending.delete(id);

    const result = {
      id,
      decision,
      reasoning,
      timestamp: new Date().toISOString(),
      autoResolved,
      originalEscalation: pending.escalation
    };

    // Record decision
    this._decisions.push(result);

    // Audit log
    AuditLogger.decision('overseer', `escalation_${decision}`, {
      id,
      decision,
      reasoning,
      autoResolved,
      type: pending.escalation.type,
      waitTimeMs: Date.now() - pending.enqueuedAt
    });

    // Resolve the promise
    pending.resolve(result);
  }

  /**
   * Handle timeout (default-deny).
   * @private
   */
  _handleTimeout(id, resolve) {
    if (!this._pending.has(id)) return;

    const pending = this._pending.get(id);
    this._pending.delete(id);

    AuditLogger.warn('overseer', 'escalation_timeout', {
      id,
      type: pending.escalation.type,
      timeoutMs: this.timeout
    });

    const result = {
      id,
      decision: 'deny',
      reasoning: `Overseer timeout (${this.timeout}ms) — default-deny applied`,
      timestamp: new Date().toISOString(),
      autoResolved: true,
      originalEscalation: pending.escalation
    };

    this._decisions.push(result);
    resolve(result);
  }

  /**
   * Auto-resolve a pending escalation.
   * @private
   */
  _autoResolve(id) {
    const decision = this._autoDeny ? 'deny' : 'approve';
    const reasoning = this._autoDeny
      ? 'Auto-mode: default-deny (safety first)'
      : 'Auto-mode: default-approve';
    this._resolve(id, decision, reasoning, true);
  }

  /**
   * Generate short unique ID.
   * @private
   */
  _generateId() {
    return 'ovr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  }

  /**
   * Clear all state (for testing).
   */
  clear() {
    // Reject all pending
    for (const [id, pending] of this._pending.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Overseer cleared'));
    }
    this._pending.clear();
    this._decisions = [];
    this._handlers.clear();
    this._autoMode = false;
  }
}

module.exports = OverseerQueue;



