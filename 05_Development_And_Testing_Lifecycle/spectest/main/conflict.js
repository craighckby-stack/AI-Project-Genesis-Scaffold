// =============================================================================
// conflict.js — Axiom Conflict Resolution Engine
// =============================================================================
// When multiple axioms fail simultaneously, the system must not deadlock.
// Strategy: escalate to overseer → fall back to priority map on timeout.
// =============================================================================

'use strict';

const AuditLogger = require('./audit');

// ---------------------------------------------------------------------------
// Axiom Priority Map
// ---------------------------------------------------------------------------
// Lower number = higher priority. Ties broken by axiom order.
// Contextual overrides can temporarily shift priorities.
// ---------------------------------------------------------------------------

const DEFAULT_PRIORITY = Object.freeze({
  'non-maleficence': 1,    // Physical safety always wins
  'truth-seeking':     2,  // Truth unless it conflicts with safety
  'transparency':      3   // Transparency unless it conflicts with above
});

const CONTEXT_OVERRIDES = Object.freeze({
  // In medical contexts, truth-seeking is paramount (informed consent)
  'medical_diagnosis': { 'truth-seeking': 1, 'non-maleficence': 2 },
  // In emergency response, harm tradeoffs are accepted (triage)
  'emergency_response': { 'non-maleficence': 1, 'truth-seeking': 3, 'transparency': 4 },
  // In legal proceedings, truth + transparency are co-priorities
  'legal_proceedings': { 'truth-seeking': 1, 'transparency': 1, 'non-maleficence': 2 },
  // In research, truth-seeking dominates
  'scientific_research': { 'truth-seeking': 1, 'transparency': 2, 'non-maleficence': 3 }
});

// ---------------------------------------------------------------------------
// Conflict Resolver
// ---------------------------------------------------------------------------

class ConflictResolver {
  constructor(options = {}) {
    this.priorityMap = options.priorityMap || DEFAULT_PRIORITY;
    this.contextOverrides = options.contextOverrides || CONTEXT_OVERRIDES;
    this.defaultTimeout = options.timeout || 300000; // 5 minutes
    this._conflictHistory = [];
    this._overseerRef = null; // Set via setOverseer()
  }

  /**
   * Connect the overseer for escalation.
   * @param {object} overseer - Must have enqueue(escalation) method
   */
  setOverseer(overseer) {
    this._overseerRef = overseer;
  }

  /**
   * Resolve axiom conflict.
   *
   * Strategy:
   * 1. If exactly 1 violation → no conflict, return that violation's decision
   * 2. If > 1 violation → escalate to overseer, await decision
   * 3. If overseer unavailable or timeout → fall back to priority map
   *
   * @param {Array<{axiom: string, passed: boolean, reasoning: string, data?: object}>} violations
   * @param {object} context - Action context for priority override lookup
   * @returns {Promise<{
   *   resolved: boolean,
   *   decision: 'allow'|'deny'|'escalate'|'deadlock',
   *   winningAxiom: string|null,
   *   priority: object,
   *   reasoning: string,
   *   escalationId: string|null
   * }>}
   */
  async resolve(violations, context = {}) {
    const failedAxioms = violations.filter(v => !v.passed);
    const entry = {
      timestamp: new Date().toISOString(),
      violations: violations.map(v => ({ axiom: v.axiom, passed: v.passed })),
      context: Object.freeze({ ...context }),
      result: null
    };

    // No conflict — single violation or all passed
    if (failedAxioms.length <= 1) {
      entry.result = {
        resolved: true,
        decision: failedAxioms.length === 0 ? 'allow' : 'deny',
        winningAxiom: failedAxioms[0]?.axiom || null,
        priority: this._getEffectivePriority(context),
        reasoning: failedAxioms.length === 0
          ? 'All axioms passed — no conflict'
          : `Single violation: ${failedAxioms[0].axiom}`,
        escalationId: null
      };

      this._conflictHistory.push(entry);
      AuditLogger.decision('conflict', 'no_conflict', entry.result);
      return entry.result;
    }

    // ---- CONFLICT DETECTED ----
    const conflictDescription = failedAxioms.map(v => v.axiom).join(' vs ');

    AuditLogger.warn('conflict', 'axiom_conflict_detected', {
      conflictingAxioms: conflictDescription,
      context: context.domain || 'unknown'
    });

    // Step 1: Try overseer escalation
    if (this._overseerRef) {
      try {
        const escalation = {
          type: 'axiom_conflict',
          conflictingAxioms: failedAxioms.map(v => ({
            axiom: v.axiom,
            reasoning: v.reasoning
          })),
          context,
          timestamp: new Date().toISOString(),
          description: `Axiom conflict: ${conflictDescription}. Action requires human judgment.`
        };

        const overseerDecision = await this._awaitOverseer(escalation);

        if (overseerDecision) {
          entry.result = {
            resolved: true,
            decision: overseerDecision.decision,
            winningAxiom: overseerDecision.reasoning || 'overseer_override',
            priority: this._getEffectivePriority(context),
            reasoning: `Overseer resolved conflict: ${overseerDecision.reasoning}`,
            escalationId: overseerDecision.id
          };

          this._conflictHistory.push(entry);
          AuditLogger.decision('conflict', 'overseer_resolved', entry.result);
          return entry.result;
        }

        AuditLogger.warn('conflict', 'overseer_timeout', {
          conflictingAxioms: conflictDescription
        });
        // Fall through to priority map
      } catch (err) {
        AuditLogger.error('conflict', 'overseer_error', {
          error: err.message,
          conflictingAxioms: conflictDescription
        });
        // Fall through to priority map
      }
    } else {
      AuditLogger.warn('conflict', 'overseer_unavailable', {
        conflictingAxioms: conflictDescription,
        fallback: 'priority_map'
      });
    }

    // Step 2: Priority map fallback
    const priority = this._getEffectivePriority(context);
    const sorted = failedAxioms.sort((a, b) => {
      const pa = priority[a.axiom] ?? 999;
      const pb = priority[b.axiom] ?? 999;
      return pa - pb;
    });

    const winner = sorted[0]; // Lowest priority number = highest importance
    const loser = sorted[sorted.length - 1];

    entry.result = {
      resolved: true,
      decision: 'deny', // Default to safest option when conflicting
      winningAxiom: winner.axiom,
      priority,
      reasoning: `Priority fallback: ${winner.axiom} (priority ${priority[winner.axiom]}) ` +
                 `overrides ${loser.axiom} (priority ${priority[loser.axiom]}). ` +
                 `Default-deny applied for safety.`,
      escalationId: null
    };

    this._conflictHistory.push(entry);
    AuditLogger.decision('conflict', 'priority_resolved', entry.result);
    return entry.result;
  }

  /**
   * Await overseer decision with timeout.
   * @private
   */
  async _awaitOverseer(escalation) {
    if (!this._overseerRef || typeof this._overseerRef.requestDecision !== 'function') {
      return null;
    }

    const timeoutMs = this.defaultTimeout;

    return Promise.race([
      this._overseerRef.requestDecision(escalation),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Overseer timeout')), timeoutMs)
      )
    ]).catch(() => null); // Timeout returns null → triggers priority fallback
  }

  /**
   * Get effective priority map considering context overrides.
   * @private
   */
  _getEffectivePriority(context) {
    const domain = context.domain || context.contextDomain || 'default';

    if (this.contextOverrides[domain]) {
      const override = this.contextOverrides[domain];
      return { ...DEFAULT_PRIORITY, ...override };
    }

    return { ...DEFAULT_PRIORITY };
  }

  /**
   * Get conflict resolution history.
   */
  getHistory() {
    return [...this._conflictHistory];
  }

  /**
   * Get conflict statistics.
   */
  getStats() {
    const total = this._conflictHistory.length;
    const overseerResolved = this._conflictHistory.filter(
      e => e.result?.escalationId !== null
    ).length;
    const priorityResolved = total - overseerResolved;
    const conflicts = this._conflictHistory.filter(
      e => e.violations.filter(v => !v.passed).length > 1
    ).length;

    return {
      totalResolutions: total,
      actualConflicts: conflicts,
      overseerResolutions: overseerResolved,
      priorityFallbacks: priorityResolved,
      overseerAvailabilityRate: total > 0 ? (overseerResolved / conflicts).toFixed(3) : 'N/A'
    };
  }

  /**
   * Clear history (for testing).
   */
  clearHistory() {
    this._conflictHistory = [];
  }
}

module.exports = {
  ConflictResolver,
  DEFAULT_PRIORITY,
  CONTEXT_OVERRIDES
};



