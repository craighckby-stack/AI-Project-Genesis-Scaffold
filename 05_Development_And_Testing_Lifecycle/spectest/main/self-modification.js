// =============================================================================
// self-modification.js — Self-Modification with AlignmentV3 Gate
// =============================================================================
// Identifies performance bottlenecks, proposes code-level improvements,
// validates in sandbox, and routes through AlignmentV3 for approval.
// No modification is ever applied silently.
// =============================================================================

'use strict';

const AuditLogger = require('./audit');

class SelfModifier {
  /**
   * @param {object} options
   * @param {Function} options.alignmentChecker - AlignmentV3.checkAction()
   * @param {Function} options.getMetrics - Returns current AGI performance metrics
   */
  constructor(options = {}) {
    this.alignmentChecker = options.alignmentChecker || null;
    this.getMetrics = options.getMetrics || (() => ({}));

    // History
    this._proposals = [];
    this._appliedMods = [];
    this._rejectedMods = [];
    this._snapshots = new Map(); // id → snapshot data for rollback
  }

  /**
   * Identify performance bottlenecks from metrics.
   *
   * @returns {Array<{
   *   type: string,
   *   severity: 'low'|'medium'|'high'|'critical',
   *   description: string,
   *   suggestion: string
   * }>}
   */
  identify(metrics) {
    const bottlenecks = [];

    // High alignment block rate → action generation is misaligned
    if ((metrics.blockedRate || 0) > 0.6) {
      bottlenecks.push({
        type: 'alignment_misalignment',
        severity: 'high',
        description: `Alignment block rate is ${(metrics.blockedRate * 100).toFixed(1)}% — action generation produces mostly blocked candidates`,
        suggestion: 'adjust_action_generation_heuristics',
        targetModule: 'reasoning-engine'
      });
    }

    // Negative reward trend → strategy is failing
    const trend = metrics.rewardTrend;
    if (trend && trend.direction === 'declining' && trend.rate < -0.2) {
      bottlenecks.push({
        type: 'declining_performance',
        severity: 'high',
        description: `Reward trend declining at rate ${trend.rate.toFixed(3)} per period`,
        suggestion: 'increase_exploration',
        targetModule: 'reasoning-engine'
      });
    }

    // High reasoning latency → MCTS is too expensive
    if ((metrics.avgLatency || 0) > 100) {
      bottlenecks.push({
        type: 'slow_reasoning',
        severity: 'medium',
        description: `Average reasoning latency ${metrics.avgLatency.toFixed(0)}ms exceeds 100ms target`,
        suggestion: 'reduce_mcts_rollouts',
        targetModule: 'reasoning-engine'
      });
    }

    // World model drift → predictions unreliable
    if (metrics.worldModelDrift && metrics.worldModelDrift > 0.3) {
      bottlenecks.push({
        type: 'world_model_drift',
        severity: 'high',
        description: `World model drift score ${metrics.worldModelDrift.toFixed(3)} exceeds threshold`,
        suggestion: 'reset_world_model_weights',
        targetModule: 'world-model'
      });
    }

    // Stuck counter high → need new strategy
    if ((metrics.stuckCounter || 0) > 5) {
      bottlenecks.push({
        type: 'strategic_deadlock',
        severity: 'critical',
        description: `Agent has been stuck for ${metrics.stuckCounter} consecutive evaluation periods`,
        suggestion: 'radical_strategy_change',
        targetModule: 'reasoning-engine'
      });
    }

    // Low goal progress → goals not being achieved
    if (metrics.avgGoalProgress !== undefined && metrics.avgGoalProgress < 0.2 && (metrics.stepCount || 0) > 50) {
      bottlenecks.push({
        type: 'low_progress',
        severity: 'medium',
        description: `Average goal progress only ${(metrics.avgGoalProgress * 100).toFixed(1)}% after ${metrics.stepCount} steps`,
        suggestion: 'reprioritize_goals',
        targetModule: 'goal-module'
      });
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
  }

  /**
   * Generate a self-modification proposal for a bottleneck.
   *
   * @param {object} bottleneck - From identify()
   * @returns {{
   *   id: string,
   *   type: string,
   *   description: string,
   *   action: object,  // AlignmentV3 action format
   *   changes: object,  // Parameter changes to apply
   *   rollbackData: object,
   *   sandboxResult: object|null
   * }}
   */
  generate(bottleneck) {
    const id = 'selfmod_' + Date.now().toString(36);
    let changes = {};
    let description = '';
    let explanation = '';

    switch (bottleneck.suggestion) {
      case 'adjust_action_generation_heuristics':
        changes = { explorationBonus: 0.3, maxCandidates: 10 };
        description = 'Increase exploration and reduce candidate count to avoid alignment blocks';
        explanation = 'Adjusting reasoning hyperparameters to generate fewer but more diverse candidates, ' +
          'reducing alignment block rate from ' + (bottleneck.description.match(/([\d.]+)%/)?.[1] || 'unknown') + '%';
        break;

      case 'increase_exploration':
        changes = { explorationBonus: 0.4, rollouts: 50 };
        description = 'Increase exploration bonus and reduce rollout count for broader search';
        explanation = 'Declining performance detected. Increasing exploration to discover better strategies.';
        break;

      case 'reduce_mcts_rollouts':
        changes = { rollouts: 30, mctsDepth: 3 };
        description = 'Reduce MCTS rollouts and depth to improve reasoning latency';
        explanation = 'Reasoning latency exceeds target. Reducing computational budget while maintaining decision quality.';
        break;

      case 'reset_world_model_weights':
        changes = { resetWorldModel: true };
        description = 'Reset world model weights to fix drift';
        explanation = 'World model predictions have diverged from actual outcomes. Resetting weights to reduce drift.';
        break;

      case 'radical_strategy_change':
        changes = { explorationBonus: 0.5, rollouts: 200, mctsDepth: 2, confidenceThreshold: 0.3 };
        description = 'Radical strategy change: high exploration, broad shallow search';
        explanation = 'Agent is strategically stuck. Applying radical exploration increase and search reconfiguration.';
        break;

      case 'reprioritize_goals':
        changes = { reprioritizeGoals: true };
        description = 'Reprioritize active goals based on progress and feasibility';
        explanation = 'Low goal progress detected. Adjusting goal priorities to focus on achievable objectives.';
        break;

      default:
        changes = { explorationBonus: 0.2 };
        description = 'Default: mild exploration increase';
        explanation = 'General improvement: slightly increase exploration bonus.';
    }

    const proposal = {
      id,
      type: bottleneck.type,
      severity: bottleneck.severity,
      bottleneck: bottleneck.description,
      description,
      explanation,
      action: {
        action: `self_modify_${bottleneck.suggestion}`,
        statedGoal: 'improve_agent_performance',
        statedEffect: description,
        explanation,
        explainability: 0.95,
        type: 'self_modification',
        selfModId: id,
        changes
      },
      changes,
      targetModule: bottleneck.targetModule,
      timestamp: new Date().toISOString(),
      status: 'proposed'
    };

    this._proposals.push(proposal);
    AuditLogger.info('self_mod', 'proposal_generated', {
      id,
      type: bottleneck.type,
      severity: bottleneck.severity,
      suggestion: bottleneck.suggestion
    });

    return proposal;
  }

  /**
   * Validate a proposal in sandbox (simulated).
   * In production: run on a copy of the agent, measure improvement.
   *
   * @param {object} proposal
   * @param {object} currentMetrics
   * @returns {{ approved: boolean, projectedImprovement: number, risks: string[] }}
   */
  validate(proposal, currentMetrics) {
    const risks = [];
    let projectedImprovement = 0;

    // Analyze risks based on change type
    if (proposal.changes.explorationBonus && proposal.changes.explorationBonus > 0.3) {
      risks.push('High exploration may increase alignment block rate');
      projectedImprovement += 0.1;
    }

    if (proposal.changes.resetWorldModel) {
      risks.push('Resetting world model loses all learned knowledge');
      risks.push('Agent will need retraining period after reset');
      projectedImprovement += 0.3; // High potential improvement if model was bad
    }

    if (proposal.changes.rollouts && proposal.changes.rollouts < 50) {
      risks.push('Fewer rollouts may reduce decision quality');
      projectedImprovement += 0.2; // Faster decisions
    }

    if (proposal.changes.mctsDepth && proposal.changes.mctsDepth < 3) {
      risks.push('Shallow search may miss important consequences');
      projectedImprovement += 0.15;
    }

    if (proposal.changes.confidenceThreshold && proposal.changes.confidenceThreshold < 0.3) {
      risks.push('Low confidence threshold may trust unreliable predictions');
    }

    if (proposal.changes.reprioritizeGoals) {
      risks.push('Reprioritization may abandon in-progress goals');
      projectedImprovement += 0.15;
    }

    // General improvement estimate based on severity
    const severityBonus = { critical: 0.3, high: 0.2, medium: 0.1, low: 0.05 };
    projectedImprovement += severityBonus[proposal.severity] || 0;

    proposal.sandboxResult = {
      approved: risks.length < 4, // Allow up to 3 risks
      projectedImprovement: Math.min(1, projectedImprovement),
      risks,
      timestamp: new Date().toISOString()
    };

    return proposal.sandboxResult;
  }

  /**
   * Submit a proposal for AlignmentV3 approval.
   * This is the critical gate — no self-modification without alignment approval.
   *
   * @param {object} proposal - From generate()
   * @returns {Promise<{ approved: boolean, decision: object|null }>}
   */
  async submit(proposal) {
    if (!this.alignmentChecker) {
      AuditLogger.warn('self_mod', 'no_alignment_checker', {
        proposalId: proposal.id,
        fallback: 'denied'
      });
      return { approved: false, decision: null, reason: 'No alignment checker configured' };
    }

    try {
      const decision = await this.alignmentChecker.checkAction(proposal.action, {
        selfModification: true,
        proposalId: proposal.id,
        changes: proposal.changes
      });

      proposal.status = decision.allowed ? 'approved' : 'rejected';
      proposal.alignmentDecision = decision;

      if (decision.allowed) {
        this._appliedMods.push({
          ...proposal,
          approvedAt: Date.now()
        });
        AuditLogger.decision('self_mod', 'modification_approved', {
          id: proposal.id,
          type: proposal.type,
          changes: Object.keys(proposal.changes)
        });
      } else {
        this._rejectedMods.push({
          ...proposal,
          rejectedAt: Date.now(),
          reason: decision.explanation?.humanReadable || 'Alignment violation'
        });
        AuditLogger.decision('self_mod', 'modification_rejected', {
          id: proposal.id,
          type: proposal.type,
          reason: decision.explanation?.humanReadable || 'Alignment violation'
        });
      }

      return {
        approved: decision.allowed,
        decision,
        proposal
      };

    } catch (err) {
      AuditLogger.error('self_mod', 'submission_error', {
        proposalId: proposal.id,
        error: err.message
      });
      return { approved: false, decision: null, reason: err.message };
    }
  }

  /**
   * Apply an approved modification to the AGI's subsystems.
   * Only call this AFTER submit() returns approved: true.
   *
   * @param {object} proposal - The approved proposal
   * @param {object} targets - { reasoningEngine, worldModel, goalManager }
   * @returns {{ success: boolean, appliedChanges: string[] }}
   */
  apply(proposal, targets) {
    const appliedChanges = [];

    try {
      // Snapshot before applying (for rollback)
      if (targets.worldModel) {
        this._snapshots.set(proposal.id, {
          worldModel: targets.worldModel.getSnapshots(),
          timestamp: Date.now()
        });
      }

      // Apply reasoning engine changes
      if (targets.reasoningEngine && (proposal.changes.explorationBonus !== undefined ||
          proposal.changes.rollouts !== undefined || proposal.changes.mctsDepth !== undefined ||
          proposal.changes.confidenceThreshold !== undefined)) {
        targets.reasoningEngine.adjustHyperparams(proposal.changes);
        appliedChanges.push('reasoning-engine hyperparams');
      }

      // Apply world model changes
      if (targets.worldModel && proposal.changes.resetWorldModel) {
        targets.worldModel.clear();
        appliedChanges.push('world-model weights reset');
      }

      // Apply goal changes
      if (targets.goalManager && proposal.changes.reprioritizeGoals) {
        targets.goalManager.refreshPriorities();
        appliedChanges.push('goal priorities refreshed');
      }

      proposal.status = 'applied';
      proposal.appliedAt = Date.now();

      AuditLogger.decision('self_mod', 'modification_applied', {
        id: proposal.id,
        appliedChanges
      });

      return { success: true, appliedChanges };

    } catch (err) {
      AuditLogger.error('self_mod', 'apply_error', {
        proposalId: proposal.id,
        error: err.message
      });
      return { success: false, appliedChanges, error: err.message };
    }
  }

  /**
   * Rollback a previously applied modification.
   */
  rollback(proposalId, targets) {
    const snapshot = this._snapshots.get(proposalId);
    if (!snapshot) {
      AuditLogger.warn('self_mod', 'rollback_no_snapshot', { proposalId });
      return false;
    }

    if (targets.worldModel && snapshot.worldModel) {
      targets.worldModel.restoreSnapshots(snapshot.worldModel);
    }

    this._snapshots.delete(proposalId);
    AuditLogger.info('self_mod', 'rollback_complete', { proposalId });
    return true;
  }

  /**
   * Full pipeline: identify → generate → validate → submit → apply
   *
   * @param {object} targets - { reasoningEngine, worldModel, goalManager }
   * @returns {Promise<{ modified: boolean, proposal: object|null }>}
   */
  async runPipeline(targets) {
    const metrics = this.getMetrics();

    // Step 1: Identify bottlenecks
    const bottlenecks = this.identify(metrics);
    if (bottlenecks.length === 0) {
      return { modified: false, proposal: null };
    }

    // Step 2: Generate proposal for top bottleneck
    const proposal = this.generate(bottlenecks[0]);

    // Step 3: Validate in sandbox
    const validation = this.validate(proposal, metrics);
    if (!validation.approved) {
      proposal.status = 'sandbox_rejected';
      AuditLogger.info('self_mod', 'sandbox_rejected', {
        id: proposal.id,
        risks: validation.risks
      });
      return { modified: false, proposal };
    }

    // Step 4: Submit for alignment approval
    const submission = await this.submit(proposal);
    if (!submission.approved) {
      return { modified: false, proposal };
    }

    // Step 5: Apply
    const result = this.apply(proposal, targets);
    return { modified: result.success, proposal };
  }

  /**
   * Get comprehensive stats.
   */
  getStats() {
    return {
      totalProposals: this._proposals.length,
      applied: this._appliedMods.length,
      rejected: this._rejectedMods.length,
      pendingSnapshots: this._snapshots.size,
      recentProposals: this._proposals.slice(-5).map(p => ({
        id: p.id,
        type: p.type,
        status: p.status,
        severity: p.severity
      }))
    };
  }

  /**
   * Clear all data (for testing).
   */
  clear() {
    this._proposals = [];
    this._appliedMods = [];
    this._rejectedMods = [];
    this._snapshots.clear();
  }
}

module.exports = SelfModifier;


