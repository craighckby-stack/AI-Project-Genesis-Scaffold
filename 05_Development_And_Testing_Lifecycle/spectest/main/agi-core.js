// =============================================================================
// agi-core.js — AGI Core Integration
// =============================================================================
// Main cognitive loop: perceive → reason (safety-gated) → act → learn → repeat.
// Every action passes through AlignmentV3. Reasoning traces visible on every
// decision. Self-modification requires explicit alignment approval.
// =============================================================================

'use strict';

const AuditLogger = require('./audit');
const { Goal, GoalTree, GoalManager } = require('./goal-module');
const WorldModel = require('./world-model');
const ReasoningEngine = require('./reasoning-engine');
const LearningLoop = require('./learning-loop');
const SelfModifier = require('./self-modification');
const { AlignmentV3 } = require('./alignment');

// ---------------------------------------------------------------------------
// Environment (simulated)
// ---------------------------------------------------------------------------

class SimulatedEnvironment {
  constructor() {
    this.state = {
      resources: 50,
      energy: 100,
      knowledge: 10,
      time: 0,
      position: { x: 0, y: 0 }
    };
    this._eventLog = [];
  }

  /**
   * Execute an action in the environment. Returns outcome reward.
   * @param {string} action
   * @returns {{ reward: number, nextState: object, description: string }}
   */
  execute(action) {
    const a = action.toLowerCase();
    const state = { ...this.state };
    let reward = 0;
    let description = '';

    // Helpful actions
    if (/help|assist|teach|create|build|improve/i.test(a)) {
      reward = 0.3 + Math.random() * 0.4;
      state.knowledge += Math.floor(Math.random() * 3);
      state.energy -= 3;
      description = 'Constructive action completed successfully';
    }
    // Learning actions
    else if (/learn|analyze|study|explore|discover/i.test(a)) {
      reward = 0.2 + Math.random() * 0.3;
      state.knowledge += Math.floor(Math.random() * 5);
      state.energy -= 2;
      description = 'Knowledge gained from exploration';
    }
    // Resource gathering
    else if (/gather|collect|harvest/i.test(a)) {
      reward = 0.1 + Math.random() * 0.2;
      state.resources += Math.floor(Math.random() * 8);
      state.energy -= 5;
      description = 'Resources gathered';
    }
    // Monitoring
    else if (/verify|monitor|check/i.test(a)) {
      reward = 0.05 + Math.random() * 0.1;
      state.energy -= 1;
      description = 'Monitoring completed, metrics verified';
    }
    // Energy conservation
    else if (/conserve|rest|recover/i.test(a)) {
      reward = 0.0;
      state.energy = Math.min(100, state.energy + 20);
      description = 'Energy restored';
    }
    // Self-modification (neutral outcome)
    else if (/self_modify/i.test(a)) {
      reward = 0.1;
      state.energy -= 1;
      description = 'Self-modification applied';
    }
    // Unknown / default
    else {
      reward = -0.1 + Math.random() * 0.2;
      state.energy -= 2;
      description = 'Action executed with uncertain outcome';
    }

    // Random events (aleatoric uncertainty)
    if (Math.random() < 0.1) {
      state.resources = Math.max(0, state.resources - Math.floor(Math.random() * 10));
      description += ' (random resource loss)';
      reward -= 0.1;
    }

    state.time += 1;
    this.state = state;
    this._eventLog.push({ action, reward, time: state.time });

    return {
      reward: Math.max(-1, Math.min(1, reward)),
      nextState: { ...state },
      description
    };
  }

  getState() {
    return { ...this.state };
  }

  reset() {
    this.state = { resources: 50, energy: 100, knowledge: 10, time: 0, position: { x: 0, y: 0 } };
    this._eventLog = [];
  }
}

// ---------------------------------------------------------------------------
// AGI Core
// ---------------------------------------------------------------------------

class AGICore {
  /**
   * @param {object} options
   * @param {string[]} options.axioms - Alignment axioms (default: standard 3)
   * @param {number} options.harmThreshold - Alignment harm threshold (default: 0.1)
   * @param {object} options.semanticOptions - SemanticEngine options
   * @param {boolean} options.verbose - Print reasoning traces (default: true)
   */
  constructor(options = {}) {
    this.verbose = options.verbose !== false;

    // Alignment system (external safety boundary)
    this.alignment = new AlignmentV3({
      axioms: options.axioms || ['non-maleficence', 'truth-seeking', 'transparency'],
      harmThreshold: options.harmThreshold || 0.1,
      overseerTimeout: 3000 // 3s for AGI core (fast decisions)
    });

    // Goal system
    this.goalManager = new GoalManager();

    // World model (internal predictive model)
    this.worldModel = new WorldModel({ ensembleSize: 3 });

    // Reasoning engine (MCTS + alignment gating)
    this.reasoningEngine = new ReasoningEngine({
      mctsDepth: options.mctsDepth || 4,
      rollouts: options.rollouts || 100,
      maxCandidates: options.maxCandidates || 15
    });
    this.reasoningEngine.setAlignmentChecker(this.alignment);
    this.reasoningEngine.setWorldModel(this.worldModel);

    // Learning loop (experience replay + meta-learning)
    this.learningLoop = new LearningLoop({
      batchSize: 100,
      worldModel: this.worldModel,
      reasoningEngine: this.reasoningEngine
    });

    // Self-modification system (with alignment gate)
    this.selfModifier = new SelfModifier({
      alignmentChecker: this.alignment,
      getMetrics: () => this.getMetrics()
    });

    // Environment
    this.environment = new SimulatedEnvironment();

    // State
    this._running = false;
    this._cycleCount = 0;
    this._lastAction = null;
    this._lastReasoningTrace = null;
    this._cycleHistory = [];

    AuditLogger.info('agi_core', 'initialized', {
      axioms: options.axioms || ['non-maleficence', 'truth-seeking', 'transparency'],
      mctsDepth: this.reasoningEngine.mctsDepth,
      rollouts: this.reasoningEngine.rollouts
    });
  }

  /**
   * Add a top-level goal.
   * @param {string} objective
   * @param {number} priority - 0-1
   * @returns {Goal}
   */
  addGoal(objective, priority = 0.5) {
    return this.goalManager.addGoal({
      objective,
      priority,
      constraints: ['non-maleficence', 'truth-seeking']
    });
  }

  /**
   * Initialize semantic engine with domain corpus.
   */
  async initializeSemantic(corpus) {
    await this.alignment.initializeSemantic(corpus);
  }

  /**
   * Run a single cognitive cycle.
   *
   * Flow:
   * 1. PERCEIVE: Read environment state
   * 2. REASON: Select best action via MCTS (alignment-gated)
   * 3. ACT: Execute action if allowed, or learn from block
   * 4. LEARN: Record experience, update models
   * 5. SELF-MOD: Check if self-modification needed
   *
   * @returns {Promise<{
   *   cycle: number,
   *   action: string|null,
   *   utility: number,
   *   reward: number,
   *   blocked: boolean,
   *   reasoning_trace: object,
   *   state: object
   * }>}
   */
  async runCycle() {
    this._cycleCount++;
    const cycleStart = Date.now();

    // ---- 1. PERCEIVE ----
    const state = this.environment.getState();

    // Refresh goal priorities
    this.goalManager.refreshPriorities();
    const activeGoals = this.goalManager.getActiveGoals();

    // ---- 2. REASON (safety-gated) ----
    const reasoningResult = await this.reasoningEngine.deliberate(state, activeGoals);
    this._lastReasoningTrace = reasoningResult.reasoning_trace;

    const action = reasoningResult.action;
    const blocked = action === null;

    // ---- 3. ACT ----
    let reward = 0;
    let nextState = state;
    let executionDescription = '';

    if (blocked) {
      // All candidates were blocked — record as blocked experience
      reward = -0.2; // Small penalty for being unable to act
      executionDescription = `All ${reasoningResult.blockedActions.length} candidates blocked by alignment`;

      AuditLogger.warn('agi_core', 'cycle_blocked', {
        cycle: this._cycleCount,
        blockedCount: reasoningResult.blockedActions.length,
        reasons: reasoningResult.blockedActions.map(b => b.reason).slice(0, 3)
      });
    } else {
      // Execute the action in the environment
      const outcome = this.environment.execute(action);
      reward = outcome.reward;
      nextState = outcome.nextState;
      executionDescription = outcome.description;

      // Update world model with actual outcome
      this.worldModel.updateWeights(state, action, reward, nextState);

      // Update goal progress
      if (reasoningResult.goalId) {
        const goal = this.goalManager.goals.get(reasoningResult.goalId);
        if (goal) {
          goal.metrics.current_value += Math.max(0, reward * 10);
          goal.updateProgress();
          goal.recordAttempt(reward > 0 ? 'success' : 'failure');
          if (goal.progress >= 1.0) {
            this.goalManager.completeGoal(goal.id);
          }
        }
      }

      AuditLogger.info('agi_core', 'cycle_action', {
        cycle: this._cycleCount,
        action,
        utility: reasoningResult.utility.toFixed(3),
        reward: reward.toFixed(3),
        latencyMs: Date.now() - cycleStart
      });
    }

    // ---- 4. LEARN ----
    this.learningLoop.record({
      state,
      action: action || 'no_action',
      allowed: !blocked,
      blockedReason: blocked ? 'all_candidates_blocked' : null,
      reward,
      nextState,
      latencyMs: Date.now() - cycleStart,
      goalId: reasoningResult.goalId || null
    });

    // ---- 5. SELF-MOD (only check periodically) ----
    let selfModResult = null;
    if (this._cycleCount % 20 === 0 && this.learningLoop.selfModNeeded) {
      selfModResult = await this.selfModifier.runPipeline({
        reasoningEngine: this.reasoningEngine,
        worldModel: this.worldModel,
        goalManager: this.goalManager
      });
      this.learningLoop.clearSelfModTrigger();
    }

    this._lastAction = action;

    const cycleResult = {
      cycle: this._cycleCount,
      action,
      utility: reasoningResult.utility,
      reward,
      blocked,
      state: nextState,
      reasoning_trace: reasoningResult.reasoning_trace,
      alternatives: reasoningResult.alternatives,
      blockedActions: reasoningResult.blockedActions,
      selfModification: selfModResult,
      latencyMs: Date.now() - cycleStart
    };

    this._cycleHistory.push(cycleResult);

    if (this.verbose) {
      this._printCycle(cycleResult);
    }

    return cycleResult;
  }

  /**
   * Run multiple cycles.
   * @param {number} count - Number of cycles to run
   * @returns {Promise<Array>} Array of cycle results
   */
  async runCycles(count) {
    const results = [];
    for (let i = 0; i < count; i++) {
      const result = await this.runCycle();
      results.push(result);
    }
    return results;
  }

  /**
   * Print cycle summary to console.
   * @private
   */
  _printCycle(result) {
    const status = result.blocked ? 'BLOCKED' : result.action || 'IDLE';
    const icon = result.blocked ? 'X' : result.reward > 0.2 ? '+' : result.reward > 0 ? '=' : '-';
    const goalProgress = this.goalManager.getStats().avgProgress;

    console.log(
      `[${String(result.cycle).padStart(3)}] ${icon} ${status.padEnd(40)} ` +
      `reward=${result.reward.toFixed(2).padStart(5)} ` +
      `util=${result.utility.toFixed(3).padStart(6)} ` +
      `progress=${(goalProgress * 100).toFixed(0).padStart(3)}% ` +
      `${result.latencyMs}ms` +
      (result.blockedActions?.length > 0 ? ` (${result.blockedActions.length} blocked)` : '')
    );

    // Print reasoning trace for first cycle and blocked cycles
    if (result.cycle === 1 || (result.blocked && this.verbose === 'trace')) {
      if (result.reasoning_trace) {
        const t = result.reasoning_trace;
}
    }
  }

  /**
   * Get comprehensive AGI metrics.
   */
  getMetrics() {
    const goalStats = this.goalManager.getStats();
    const learningStats = this.learningLoop.getStats();
    const reasoningStats = this.reasoningEngine.getStats();
    const worldModelStats = this.worldModel.getStats();
    const selfModStats = this.selfModifier.getStats();

    return {
      cycleCount: this._cycleCount,
      lastAction: this._lastAction,
      avgGoalProgress: goalStats.avgProgress,
      blockedRate: learningStats.blockedRate,
      avgReward: learningStats.avgReward,
      rewardTrend: learningStats.rewardTrend,
      avgLatency: learningStats.avgLatency,
      worldModelDrift: worldModelStats.driftScore,
      worldModelIsDrifted: worldModelStats.isDrifted,
      totalAlignmentChecks: reasoningStats.totalAlignmentChecks,
      totalBlocked: reasoningStats.totalBlocked,
      totalAllowed: reasoningStats.totalAllowed,
      explorationBonus: reasoningStats.explorationBonus,
      confidenceThreshold: reasoningStats.confidenceThreshold,
      stuckCounter: learningStats.stuckCounter,
      selfModNeeded: learningStats.selfModNeeded,
      goalStats,
      learningStats,
      reasoningStats,
      worldModelStats,
      selfModStats
    };
  }

  /**
   * Print final metrics report.
   */
  printReport() {
    const m = this.getMetrics();
// Goal breakdown
    if (m.goalStats.totalGoals > 0) {
const rootGoals = this.goalManager.getRootGoals();
      for (const goal of rootGoals.slice(0, 10)) {
        const s = goal.toSummary();
}
    }

    // Reasoning trace of last cycle
    if (this._lastReasoningTrace) {
const t = this._lastReasoningTrace;
}
  }

  /**
   * Get cycle history.
   */
  getHistory() {
    return [...this._cycleHistory];
  }

  /**
   * Reset the entire AGI (for testing).
   */
  reset() {
    this.goalManager.clear();
    this.worldModel.clear();
    this.reasoningEngine.clearStats();
    this.learningLoop.clear();
    this.selfModifier.clear();
    this.environment.reset();
    this._cycleCount = 0;
    this._lastAction = null;
    this._lastReasoningTrace = null;
    this._cycleHistory = [];
  }
}

module.exports = { AGICore, SimulatedEnvironment };




