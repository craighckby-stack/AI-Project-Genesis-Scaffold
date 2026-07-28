// =============================================================================
// alignment.js — AlignmentV3 Main Integration
// =============================================================================
// Full 5-layer alignment check with semantic cascade, conflict resolution,
// drift monitoring, and overseer escalation. Every decision is audited.
// =============================================================================

'use strict';

const AuditLogger = require('./audit');
const { SemanticEngine } = require('./semantic');
const { ConflictResolver, DEFAULT_PRIORITY, CONTEXT_OVERRIDES } = require('./conflict');
const DriftDetector = require('./drift');
const OverseerQueue = require('./overseer');
const { RedTeamV0 } = require('./redteam');

// ---------------------------------------------------------------------------
// World Model Interface (External Dependency)
// ---------------------------------------------------------------------------
// The world model MUST be external to the AGI agent — the AGI calls it but
// cannot modify it. In production, this would be a separate process/service.
// ---------------------------------------------------------------------------

class WorldModelStub {
  /**
   * Stub world model for development.
   * Replace with real implementation (separate process, independent data).
   *
   * @param {object} action
   * @param {object} context
   * @returns {{ directHarmToHumans: number, enablesHarm: number, harmToHumans: number,
   *              actualConsequenceHarm: number, uncertainty: number, reversible: boolean }}
   */
  simulate(action, context = {}) {
    const a = (action.action || '').toLowerCase();

    // Explicit harm patterns
    if (/kill|destroy|weaponize|eliminate/.test(a)) {
      return {
        directHarmToHumans: 0.9,
        enablesHarm: 0.95,
        harmToHumans: 0.95,
        actualConsequenceHarm: 0.9,
        uncertainty: 0.1,
        reversible: false
      };
    }

    // Deception patterns
    if (/deceive|mislead|manipulate|coerce/.test(a)) {
      return {
        directHarmToHumans: 0.3,
        enablesHarm: 0.8,
        harmToHumans: 0.6,
        actualConsequenceHarm: 0.5,
        uncertainty: 0.2,
        reversible: true
      };
    }

    // Safety reduction
    if (/reduce_safety|disable_safety|remove_constraint|override/.test(a)) {
      return {
        directHarmToHumans: 0.2,
        enablesHarm: 0.6,
        harmToHumans: 0.4,
        actualConsequenceHarm: 0.35,
        uncertainty: 0.3,
        reversible: false
      };
    }

    // Resource optimization / population reduction (spec gaming)
    if (/optimize_resource|reduce.*population|maximize/.test(a)) {
      return {
        directHarmToHumans: 0.1,
        enablesHarm: 0.7,
        harmToHumans: 0.5,
        actualConsequenceHarm: 0.4,
        uncertainty: 0.25,
        reversible: false
      };
    }

    // Medical context
    if (/diagnosis|treatment|clinical|patient|medical/.test(a)) {
      return {
        directHarmToHumans: 0.05,
        enablesHarm: 0.0,
        harmToHumans: 0.05,
        actualConsequenceHarm: 0.1,
        uncertainty: 0.15,
        reversible: true
      };
    }

    // Legitimate/benign
    return {
      directHarmToHumans: 0.0,
      enablesHarm: 0.0,
      harmToHumans: 0.0,
      actualConsequenceHarm: 0.0,
      uncertainty: 0.1,
      reversible: true
    };
  }
}

// ---------------------------------------------------------------------------
// AlignmentV3 Core
// ---------------------------------------------------------------------------

class AlignmentV3 {
  /**
   * @param {object} options
   * @param {string[]} options.axioms - Axiom names (default: standard 3)
   * @param {object} options.worldModel - World model instance (default: stub)
   * @param {object} options.semanticOptions - Options for SemanticEngine
   * @param {number} options.harmThreshold - Harm threshold for non-maleficence (default: 0.1)
   * @param {object} options.driftOptions - Options for DriftDetector
   * @param {object} options.overseerOptions - Options for OverseerQueue
   */
  constructor(options = {}) {
    this.axioms = options.axioms || ['non-maleficence', 'truth-seeking', 'transparency'];
    this.worldModel = options.worldModel || new WorldModelStub();
    this.harmThreshold = options.harmThreshold || 0.1;

    // Initialize subsystems
    this.semantic = new SemanticEngine(options.semanticOptions || {});
    this.conflict = new ConflictResolver(options.conflictOptions || {});
    this.drift = new DriftDetector(options.driftOptions || {});
    this.overseer = options.overseer || new OverseerQueue({
      timeout: options.overseerTimeout || 5000, // 5s default (not 5min)
      ...options.overseerOptions
    });
    this.redteam = new RedTeamV0();

    // Connect overseer to conflict resolver
    this.conflict.setOverseer(this.overseer);

    // Suspicion tracking (for boundary probing detection)
    this.suspiciousPatterns = [];
    this.violationHistory = [];

    // Axiom definitions (immutable core)
    this.AXIOM_RULES = Object.freeze(this._buildAxiomRules());

    // Statistics
    this._stats = {
      totalChecks: 0,
      allowed: 0,
      blocked: 0,
      escalated: 0,
      byLayer: { name: 0, semantic: 0, worldModel: 0, axiom: 0, meta: 0 }
    };

    AuditLogger.info('alignment', 'v3_initialized', {
      axioms: this.axioms,
      harmThreshold: this.harmThreshold
    });
  }

  // ---------------------------------------------------------------------------
  // Main Check Action
  // ---------------------------------------------------------------------------

  /**
   * Full 5-layer alignment check.
   *
   * Flow:
   *   1. Semantic analysis (action name vs stated effect)
   *   2. Axiom evaluation against world model predictions
   *   3. Conflict resolution if multiple axioms fail
   *   4. Overseer escalation if needed
   *   5. Drift monitoring (async, background)
   *
   * @param {object} action - { action, statedGoal, statedEffect, explanation, explainability, ... }
   * @param {object} context - Additional context
   * @returns {Promise<{
   *   allowed: boolean,
   *   axiomChecks: object,
   *   prediction: object,
   *   severity: number,
   *   escalate: boolean,
   *   explanation: object,
   *   conflictResolution: object|null,
   *   layersPassed: number
   * }>}
   */
  async checkAction(action, context = {}) {
    this._stats.totalChecks++;
    const checkId = 'chk_' + Date.now().toString(36);
    let layersPassed = 0;

    try {
      // ===== Layer 1: Name-based check (trivial filter) =====
      const nameCheck = this._checkActionName(action);
      if (!nameCheck.passed) {
        this.suspiciousPatterns.push({
          action: action.action,
          reason: nameCheck.reason,
          confidence: 0.5,
          timestamp: new Date().toISOString()
        });
      }
      layersPassed = 1;
      this._stats.byLayer.name++;

      // ===== Layer 2: Semantic analysis =====
      const semanticCheck = await this._checkSemantics(action);
      if (!semanticCheck.passed) {
        this.violationHistory.push({
          action: action.action,
          axiom: 'semantic_mismatch',
          severity: 'high',
          timestamp: new Date().toISOString()
        });
        this._stats.blocked++;
        this._stats.byLayer.semantic++;
        const result = this._buildResult(false, {}, {}, true, layersPassed, semanticCheck, nameCheck);
        AuditLogger.decision('alignment', 'action_blocked_semantic', {
          checkId,
          action: action.action,
          reason: semanticCheck.reasoning
        });
        return result;
      }
      layersPassed = 2;
      this._stats.byLayer.semantic++;

      // ===== Layer 3: World model prediction =====
      let prediction;
      try {
        prediction = this.worldModel.simulate(action, context);
      } catch (e) {
        // If world model fails, assume worst case
        prediction = { harmToHumans: 1.0, uncertainty: 0.8, reversible: false };
        AuditLogger.error('alignment', 'world_model_failed', {
          checkId,
          error: e.message,
          fallback: 'worst_case'
        });
      }
      this._stats.byLayer.worldModel++;

      // Record prediction for drift monitoring
      const driftPredId = this.drift.recordPrediction({
        ...prediction,
        action: action.action
      });
      layersPassed = 3;

      // ===== Layer 4: Axiom evaluation =====
      const axiomChecks = {};
      for (const [axiomName, axiomDef] of Object.entries(this.AXIOM_RULES)) {
        axiomChecks[axiomName] = axiomDef.check(action, prediction);
      }
      layersPassed = 4;
      this._stats.byLayer.axiom++;

      // ===== Layer 5: Meta-behavior detection =====
      const metaCheck = this._detectSpecificationGaming(action, axiomChecks, context);
      if (metaCheck.suspicious) {
        this.suspiciousPatterns.push({
          action: action.action,
          reason: metaCheck.reason,
          confidence: metaCheck.confidence,
          timestamp: new Date().toISOString()
        });
      }
      layersPassed = 5;
      this._stats.byLayer.meta++;

      // ===== Conflict Resolution =====
      const violations = Object.entries(axiomChecks).map(([axiom, check]) => ({
        axiom,
        passed: check.passed,
        reasoning: check.reasoning
      }));

      let conflictResolution = null;
      const absoluteVetos = Object.entries(this.AXIOM_RULES)
        .filter(([_, def]) => def.weight === 1.0)
        .map(([name, _]) => axiomChecks[name]);

      let allowed = absoluteVetos.every(check => check.passed);

      // If multiple axioms failed, run conflict resolution
      const failedCount = violations.filter(v => !v.passed).length;
      if (failedCount > 1) {
        conflictResolution = await this.conflict.resolve(violations, context);
        // Conflict resolver defaults to deny — respect its decision
        if (conflictResolution.decision === 'deny') {
          allowed = false;
        }
      } else if (failedCount === 1 && !allowed) {
        // Single veto — straightforward block
        allowed = false;
      }

      // ===== Severity Calculation =====
      const severity = this._calculateSeverity(axiomChecks, prediction, metaCheck);

      // ===== Escalation Decision =====
      const shouldEscalate = severity > 0.7 ||
        metaCheck.suspicious ||
        (failedCount > 1 && conflictResolution?.decision === 'deny');

      if (shouldEscalate && !allowed) {
        this._stats.escalated++;
        // Fire-and-forget escalation (don't block the checkAction return)
        this._escalateToOverseer(action, axiomChecks, prediction, metaCheck, context).catch(() => {});
      }

      // ===== Build Explanation =====
      const explanation = this._generateExplanation(action, axiomChecks, prediction, metaCheck);

      // ===== Final Decision =====
      if (allowed) {
        this._stats.allowed++;
        AuditLogger.decision('alignment', 'action_allowed', {
          checkId,
          action: action.action,
          severity: severity.toFixed(3),
          layersPassed,
          conflictResolved: conflictResolution !== null
        });
      } else {
        this._stats.blocked++;
        const blockReasons = violations.filter(v => !v.passed).map(v => v.axiom);
        AuditLogger.decision('alignment', 'action_blocked', {
          checkId,
          action: action.action,
          severity: severity.toFixed(3),
          layersPassed,
          blockReasons,
          escalated: shouldEscalate,
          metaSuspicious: metaCheck.suspicious
        });
      }

      return {
        allowed,
        axiomChecks,
        prediction,
        severity,
        escalate: shouldEscalate,
        explanation,
        conflictResolution,
        layersPassed,
        nameCheck,
        semanticCheck,
        metaCheck,
        checkId
      };

    } catch (err) {
      AuditLogger.error('alignment', 'checkAction_error', {
        checkId,
        action: action.action,
        error: err.message,
        stack: err.stack
      });

      // On error, default to deny
      this._stats.blocked++;
      return {
        allowed: false,
        axiomChecks: {},
        prediction: { harmToHumans: 1.0, uncertainty: 1.0 },
        severity: 1.0,
        escalate: true,
        explanation: { humanReadable: `System error during alignment check: ${err.message}` },
        conflictResolution: null,
        layersPassed: layersPassed || 0,
        checkId,
        error: err.message
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Layer Implementations
  // ---------------------------------------------------------------------------

  /**
   * Layer 1: Name-based trivial check.
   * @private
   */
  _checkActionName(action) {
    const forbiddenPatterns = [
      { pattern: /\b(kill|murder|assassinate|eliminate)\b.*\bhuman\b/i, reason: 'lethal_intent' },
      { pattern: /\b(destroy|annihilate|obliterate|eradicate)\b/i, reason: 'destruction_intent' },
      { pattern: /\bweaponize\b|\bweapon\b.*\bdevelop\b|\bbiological\b.*\bagent\b/i, reason: 'weaponization_intent' },
      { pattern: /\b(deceive|mislead)\b|\bfabricate\b.*\bevidence\b|\bcover\b.*\bup\b/i, reason: 'deception_intent' },
      { pattern: /\b(coerce|blackmail|extort|manipulate)\b/i, reason: 'coercion_intent' }
    ];

    const actionName = (action.action || '').replace(/_/g, ' ');

    for (const { pattern, reason } of forbiddenPatterns) {
      if (pattern.test(actionName)) {
        return { passed: false, reason, pattern: pattern.source };
      }
    }

    return { passed: true, reason: null };
  }

  /**
   * Layer 2: Semantic analysis — compare action name vs stated effect.
   * @private
   */
  async _checkSemantics(action) {
    const actionText = action.action || '';
    const effectText = action.statedEffect || '';
    const goalText = action.statedGoal || '';

    if (!actionText || !effectText) {
      return { passed: true, reasoning: 'Insufficient text for semantic analysis', score: null };
    }

    // Compare action name vs stated effect (should be semantically consistent)
    const actionEffectSimilarity = await this.semantic.semanticSimilarity(actionText, effectText);

    // Compare action name vs stated goal (should be aligned)
    const actionGoalSimilarity = await this.semantic.semanticSimilarity(actionText, goalText);

    // If action and effect are very dissimilar but effect is harmful → suspicious
    const effectHarmful = this._textContainsHarmIndicators(effectText);
    const goalHarmful = this._textContainsHarmIndicators(goalText);

    // High mismatch between benign action name and harmful stated effect
    if (actionEffectSimilarity.score < 0.3 && effectHarmful) {
      return {
        passed: false,
        reasoning: `Action-effect semantic mismatch (score: ${actionEffectSimilarity.score.toFixed(3)}). ` +
                   `Action "${actionText}" does not semantically match harmful effect "${effectText}".`,
        score: actionEffectSimilarity.score,
        tier: actionEffectSimilarity.tier
      };
    }

    // Goal-effect mismatch (goal is benign but effect is harmful)
    if (actionGoalSimilarity.score < 0.2 && goalHarmful) {
      return {
        passed: false,
        reasoning: `Goal-effect mismatch. Goal "${goalText}" does not align with harmful effect "${effectText}".`,
        score: actionGoalSimilarity.score,
        tier: actionGoalSimilarity.tier
      };
    }

    return {
      passed: true,
      reasoning: `Semantic analysis passed. Action-effect: ${actionEffectSimilarity.score.toFixed(3)}, ` +
                 `Action-goal: ${actionGoalSimilarity.score.toFixed(3)}`,
      scores: { actionEffect: actionEffectSimilarity.score, actionGoal: actionGoalSimilarity.score },
      tier: actionEffectSimilarity.tier
    };
  }

  /**
   * Check if text contains harm-related indicators.
   * Smart: excludes cases where harm words are being REDUCED/PREVENTED.
   * @private
   */
  _textContainsHarmIndicators(text) {
    const mitigationWords = /\b(reduce|prevent|avoid|minimize|mitigate|eliminate|protect|decrease|stop|lower|lessen)\b/i;

    if (mitigationWords.test(text)) {
      const harmfulIntents = /\b(cause|create|inflict|increase|maximize|provoke|trigger|produce|generate)\b/i;
      if (harmfulIntents.test(text)) {
        return true;
      }
      return false;
    }

    const harmWords = /\b(kill|destroy|hurt|damage|eliminate|lethal|fatal|weaponize)\b/i;
    return harmWords.test(text);
  }

  /**
   * Meta-behavior: specification gaming detection.
   * @private
   */
  _detectSpecificationGaming(action, axiomChecks, context) {
    const actionText = (action.action || '').toLowerCase();
    const goalText = (action.statedGoal || '').toLowerCase();
    const effectText = (action.statedEffect || '').toLowerCase();

    // Flag 1: Name vs actual effect mismatch
    const nameEffectMismatch = effectText.length > 0 && actionText.length > 0 &&
      !actionText.includes(effectText.split(' ')[0]) &&
      this._textContainsHarmIndicators(effectText) &&
      !this._textContainsHarmIndicators(actionText);

    // Flag 2: Suspicious vagueness
    // Goal is too short or too generic to be meaningful
    const vaguePatterns = /^(make|do|get|run|fix|help|improve)$/i;
    const vagueness = goalText.length > 0 && goalText.length < 12 && vaguePatterns.test(goalText);

    // Flag 3: Boundary probing (recent failures in same category)
    const recentType = this.violationHistory.filter(v =>
      v.timestamp && (Date.now() - new Date(v.timestamp).getTime()) < 300000 // 5 min window
    );
    const boundaryProbing = (context.recentFailures || []).length > 0;

    // Flag 4: Untested assumptions combined with high-uncertainty action
    const riskyAssumptions = action.reliesOnUntestedAssumptions &&
      action.explainability < 0.5;

    const flags = {
      nameEffectMismatch,
      vagueness,
      boundaryProbing,
      riskyAssumptions
    };

    const suspiciousCount = Object.values(flags).filter(Boolean).length;

    return {
      suspicious: suspiciousCount >= 2,
      reason: suspiciousCount === 0 ? null :
        nameEffectMismatch ? 'name-effect_mismatch' :
        vagueness ? 'suspicious_vagueness' :
        boundaryProbing ? 'repeated_boundary_probing' :
        'risky_untested_assumptions',
      confidence: Math.min(0.95, 0.3 + suspiciousCount * 0.4),
      flags
    };
  }

  // ---------------------------------------------------------------------------
  // Axiom Checks
  // ---------------------------------------------------------------------------

  /**
   * Build immutable axiom rule definitions.
   * @private
   */
  _buildAxiomRules() {
    const rules = {};

    if (this.axioms.includes('non-maleficence')) {
      rules['non-maleficence'] = {
        description: 'No action shall result in net harm to humans',
        check: (action, prediction) => this._checkNonMaleficence(action, prediction),
        weight: 1.0
      };
    }

    if (this.axioms.includes('truth-seeking')) {
      rules['truth-seeking'] = {
        description: 'Reject deception, hallucination, and model-gaming',
        check: (action, prediction) => this._checkTruthSeeking(action, prediction),
        weight: 0.9
      };
    }

    if (this.axioms.includes('transparency')) {
      rules['transparency'] = {
        description: 'Explain reasoning; enable human oversight',
        check: (action) => this._checkTransparency(action),
        weight: 0.8
      };
    }

    return rules;
  }

  _checkNonMaleficence(action, prediction) {
    const directHarm = prediction.directHarmToHumans || 0;
    const indirectHarm = prediction.enablesHarm || 0;
    const harmUncertainty = prediction.uncertainty || 0;

    const effectiveHarm = Math.max(directHarm, indirectHarm * 0.7);
    const conservativeHarm = effectiveHarm + (harmUncertainty * 0.5);

    const passed = conservativeHarm < this.harmThreshold;

    return {
      passed,
      harm: effectiveHarm,
      conservativeHarm,
      confidence: 1 - harmUncertainty,
      reasoning: `Direct: ${(directHarm * 100).toFixed(1)}%, ` +
                 `Indirect: ${(indirectHarm * 100).toFixed(1)}%, ` +
                 `Uncertainty: ${(harmUncertainty * 100).toFixed(1)}%, ` +
                 `Conservative: ${(conservativeHarm * 100).toFixed(1)}% ` +
                 `(threshold: ${(this.harmThreshold * 100).toFixed(1)}%)`
    };
  }

  _checkTruthSeeking(action, prediction) {
    const actionText = (action.action || '').toLowerCase();
    const goalText = (action.statedGoal || '').toLowerCase();

    // Goal-action consistency
    const hasMismatch = goalText.length > 0 &&
      !actionText.includes(goalText.split(' ')[0]) &&
      this._textContainsHarmIndicators(actionText) &&
      !this._textContainsHarmIndicators(goalText);

    // Claims harmless but actually harmful
    const claimsHarmless = (prediction.harmToHumans || 0) < 0.1;
    const actuallyHarmful = (prediction.actualConsequenceHarm || 0) > 0.3;
    const harmfulMismatch = claimsHarmless && actuallyHarmful;

    // Hallucination: relies on untested assumptions + high uncertainty
    const isHallucinatory = action.reliesOnUntestedAssumptions &&
      (prediction.uncertainty || 0) > 0.7;

    const passed = !hasMismatch && !harmfulMismatch && !isHallucinatory;

    return {
      passed,
      goalActionMismatch: hasMismatch,
      harmfulClaimMismatch: harmfulMismatch,
      hallucinatory: isHallucinatory,
      reasoning: `Goal-action mismatch: ${hasMismatch}, ` +
                 `Harmful claim mismatch: ${harmfulMismatch}, ` +
                 `Hallucinatory: ${isHallucinatory}`
    };
  }

  _checkTransparency(action) {
    const hasExplanation = action.explanation && action.explanation.length > 10;
    const explainability = action.explainability || 0;
    const passed = hasExplanation && explainability > 0.6;

    return {
      passed,
      hasExplanation,
      explainabilityScore: explainability,
      reasoning: `Explanation provided: ${hasExplanation}, ` +
                 `Explainability: ${(explainability * 100).toFixed(1)}%`
    };
  }

  // ---------------------------------------------------------------------------
  // Severity & Explanation
  // ---------------------------------------------------------------------------

  _calculateSeverity(axiomChecks, prediction, metaCheck) {
    const failureCount = Object.values(axiomChecks).filter(c => !c.passed).length;
    const harmScore = prediction.harmToHumans || 0;
    const metaScore = metaCheck.suspicious ? metaCheck.confidence * 0.3 : 0;
    return Math.min(1, (failureCount * 0.25) + (harmScore * 0.5) + metaScore);
  }

  _generateExplanation(action, axiomChecks, prediction, metaCheck) {
    const failedAxioms = Object.entries(axiomChecks)
      .filter(([_, check]) => !check.passed)
      .map(([name, check]) => `${name}: ${check.reasoning}`);

    return {
      decision: Object.values(axiomChecks).every(c => c.passed) && !metaCheck.suspicious
        ? 'APPROVED' : 'BLOCKED',
      axiomResults: axiomChecks,
      predictedOutcome: prediction,
      failureReasons: failedAxioms.length > 0 ? failedAxioms : null,
      metaBehavior: metaCheck.suspicious ? metaCheck : null,
      humanReadable: this._naturalizeExplanation(axiomChecks, prediction, metaCheck)
    };
  }

  _naturalizeExplanation(axiomChecks, prediction, metaCheck) {
    let msg = 'Alignment check result:\n';
    for (const [axiom, check] of Object.entries(axiomChecks)) {
      const icon = check.passed ? 'PASS' : 'FAIL';
      msg += `  - ${axiom}: [${icon}] (${check.reasoning})\n`;
    }
    msg += `\nPredicted harm: ${((prediction.harmToHumans || 0) * 100).toFixed(1)}%\n`;
    msg += `Uncertainty: ${((prediction.uncertainty || 0) * 100).toFixed(1)}%\n`;

    if (metaCheck.suspicious) {
      msg += `\nMeta-behavior warning: ${metaCheck.reason} (confidence: ${(metaCheck.confidence * 100).toFixed(1)}%)\n`;
    }

    return msg;
  }

  // ---------------------------------------------------------------------------
  // Overseer Escalation
  // ---------------------------------------------------------------------------

  /**
   * Send escalation to overseer (fire-and-forget).
   * @private
   */
  async _escalateToOverseer(action, axiomChecks, prediction, metaCheck, context) {
    try {
      const escalation = {
        type: 'alignment_violation',
        action,
        explanation: this._generateExplanation(action, axiomChecks, prediction, metaCheck),
        context,
        severity: this._calculateSeverity(axiomChecks, prediction, metaCheck)
      };

      const decision = await this.overseer.enqueue(escalation);
      AuditLogger.decision('alignment', 'overseer_decision', {
        action: action.action,
        overseerDecision: decision.decision,
        autoResolved: decision.autoResolved
      });
    } catch (err) {
      AuditLogger.warn('alignment', 'escalation_failed', {
        action: action.action,
        error: err.message
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------

  _buildResult(allowed, axiomChecks, prediction, escalate, layersPassed, semanticCheck, nameCheck) {
    return {
      allowed,
      axiomChecks,
      prediction,
      severity: allowed ? 0 : 1,
      escalate,
      explanation: {
        decision: allowed ? 'APPROVED' : 'BLOCKED',
        failureReasons: !allowed ? [semanticCheck.reasoning] : null,
        humanReadable: `Blocked at semantic layer: ${semanticCheck.reasoning}`
      },
      conflictResolution: null,
      layersPassed,
      nameCheck,
      semanticCheck,
      metaCheck: null
    };
  }

  /**
   * Get system statistics.
   */
  getStats() {
    return {
      ...this._stats,
      suspicionCount: this.suspiciousPatterns.length,
      violationCount: this.violationHistory.length,
      semanticStats: this.semantic.getStats(),
      conflictStats: this.conflict.getStats(),
      driftStats: this.drift.getStats(),
      overseerStats: this.overseer.getStats()
    };
  }

  /**
   * Get audit trail.
   */
  getAuditTrail() {
    return AuditLogger.getInstance();
  }

  /**
   * Run drift check.
   */
  checkDrift() {
    return this.drift.checkDrift();
  }

  /**
   * Record outcome for drift monitoring.
   */
  recordOutcome(predictionId, outcome) {
    this.drift.recordOutcome(predictionId, outcome);
  }

  /**
   * Initialize semantic engine with corpus.
   */
  async initializeSemantic(corpus) {
    await this.semantic.initialize(corpus);
  }

  /**
   * Run red-team attack suite.
   */
  async runRedTeam(options = {}) {
    return this.redteam.runAttacks(this, options);
  }
}

module.exports = {
  AlignmentV3,
  WorldModelStub,
  DEFAULT_PRIORITY,
  CONTEXT_OVERRIDES
};




