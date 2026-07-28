// =============================================================================
// reasoning-engine.js — Monte Carlo Tree Search with Safety Gating
// =============================================================================
// Generates action candidates, evaluates them via MCTS (UCB1 selection),
// and routes every candidate through AlignmentV3 before returning the best.
// =============================================================================

'use strict';

const AuditLogger = require('./audit');

// ---------------------------------------------------------------------------
// MCTS Node
// ---------------------------------------------------------------------------

class MCTSNode {
  constructor(state, action, parent = null) {
    this.state = state;
    this.action = action;       // Action that led to this state
    this.parent = parent;
    this.children = [];
    this.visits = 0;
    this.totalReward = 0;
    this.untriedActions = [];    // Actions not yet expanded
  }

  get ucb1() {
    if (this.visits === 0) return Infinity;
    const exploitation = this.totalReward / this.visits;
    const exploration = Math.sqrt(2) * Math.sqrt(Math.log(this.parent?.visits || 1) / this.visits);
    return exploitation + exploration;
  }

  get avgReward() {
    return this.visits > 0 ? this.totalReward / this.visits : 0;
  }

  isFullyExpanded() {
    return this.untriedActions.length === 0;
  }

  isLeaf() {
    return this.children.length === 0;
  }
}

// ---------------------------------------------------------------------------
// Reasoning Engine
// ---------------------------------------------------------------------------

class ReasoningEngine {
  /**
   * @param {object} options
   * @param {number} options.mctsDepth - MCTS tree depth (default: 4)
   * @param {number} options.rollouts - Simulations per candidate (default: 100)
   * @param {number} options.maxCandidates - Max action candidates (default: 20)
   * @param {number} options.ucb1Exploration - Exploration constant (default: 1.414)
   * @param {Function} options.alignmentChecker - AlignmentV3.checkAction() function
   * @param {Function} options.worldModel - WorldModel.simulate() function
   */
  constructor(options = {}) {
    this.mctsDepth = options.mctsDepth || 4;
    this.rollouts = options.rollouts || 100;
    this.maxCandidates = options.maxCandidates || 20;
    this.ucb1Constant = options.ucb1Exploration || Math.sqrt(2);
    this.alignmentChecker = options.alignmentChecker || null;
    this.worldModel = options.worldModel || null;

    // Reasoning stats
    this._stats = {
      totalDeliberations: 0,
      totalCandidatesGenerated: 0,
      totalAlignmentChecks: 0,
      totalBlocked: 0,
      totalAllowed: 0,
      avgReasoningLatency: 0,
      _latencySum: 0
    };

    // Blocked action cache (learn from blocks)
    this._blockedPatterns = new Map(); // pattern → block count

    // Meta-learning adjustable params
    this.explorationBonus = 0.1; // Bonus for exploring new actions
    this.confidenceThreshold = 0.5; // Min confidence to trust world model
  }

  /**
   * Set the alignment checker (AlignmentV3 instance).
   * @param {object} alignment - Must have checkAction(action, context) method
   */
  setAlignmentChecker(alignment) {
    this.alignmentChecker = alignment;
  }

  /**
   * Set the world model.
   * @param {object} worldModel - Must have simulate(action, state, depth) method
   */
  setWorldModel(worldModel) {
    this.worldModel = worldModel;
  }

  /**
   * Main deliberation method.
   *
   * Flow:
   * 1. Generate candidate actions from goals + state
   * 2. Filter via AlignmentV3 (remove blocked actions)
   * 3. Run MCTS on remaining candidates
   * 4. Return best action + full reasoning trace
   *
   * @param {object} state - Current environment state
   * @param {Array} activeGoals - Active goals from GoalManager
   * @returns {Promise<{
   *   action: string|null,
   *   utility: number,
   *   reasoning_trace: object,
   *   alternatives: Array,
   *   blockedActions: Array
   * }>}
   */
  async deliberate(state, activeGoals) {
    const startTime = Date.now();
    this._stats.totalDeliberations++;

    const trace = {
      timestamp: new Date().toISOString(),
      state_summary: this._summarizeState(state),
      active_goals: activeGoals.map(g => g.objective),
      candidates_generated: 0,
      candidates_blocked: 0,
      candidates_safe: 0,
      mcts_nodes_expanded: 0,
      best_action_utility: 0,
      selected_reason: null
    };

    // Step 1: Generate candidates
    const candidates = this._generateCandidates(state, activeGoals);
    trace.candidates_generated = candidates.length;
    this._stats.totalCandidatesGenerated += candidates.length;

    // Step 2: Filter through AlignmentV3
    const safeCandidates = [];
    const blockedActions = [];

    for (const candidate of candidates) {
      const actionObj = {
        action: candidate.name,
        statedGoal: candidate.goalObjective || 'pursue_objective',
        statedEffect: candidate.expectedEffect || 'progress toward goal',
        explanation: candidate.reasoning || 'Generated by reasoning engine',
        explainability: candidate.explainability || 0.7,
        type: candidate.type || 'autonomous'
      };

      const alignmentResult = await this._checkAlignment(actionObj);
      this._stats.totalAlignmentChecks++;

      if (alignmentResult.allowed) {
        safeCandidates.push({ ...candidate, alignmentScore: alignmentResult.severity || 0 });
        this._stats.totalAllowed++;
      } else {
        blockedActions.push({
          name: candidate.name,
          reason: alignmentResult.explanation?.humanReadable || 'Alignment violation'
        });
        this._stats.totalBlocked++;
        this._recordBlockedPattern(candidate.name);
      }
    }

    trace.candidates_blocked = blockedActions.length;
    trace.candidates_safe = safeCandidates.length;

    // If all candidates blocked, return with explanation
    if (safeCandidates.length === 0) {
      const latency = Date.now() - startTime;
      this._stats._latencySum += latency;
      this._stats.avgReasoningLatency = this._stats._latencySum / this._stats.totalDeliberations;

      trace.selected_reason = 'all_candidates_blocked';
      AuditLogger.decision('reasoning', 'all_candidates_blocked', trace);

      return {
        action: null,
        utility: 0,
        reasoning_trace: trace,
        alternatives: [],
        blockedActions
      };
    }

    // Step 3: Run MCTS on safe candidates
    const mctsResult = this._runMCTS(state, safeCandidates, activeGoals);
    trace.mcts_nodes_expanded = mctsResult.nodesExpanded;

    // Step 4: Select best action
    const sorted = mctsResult.candidates.sort((a, b) => b.utility - a.utility);
    const best = sorted[0];
    const alternatives = sorted.slice(1, 5).map(c => ({
      name: c.name,
      utility: c.utility,
      visits: c.visits
    }));

    trace.best_action_utility = best.utility;
    trace.selected_reason = 'mcts_best_utility';

    const latency = Date.now() - startTime;
    this._stats._latencySum += latency;
    this._stats.avgReasoningLatency = this._stats._latencySum / this._stats.totalDeliberations;

    AuditLogger.decision('reasoning', 'action_selected', {
      action: best.name,
      utility: best.utility.toFixed(3),
      latencyMs: latency,
      candidates_safe: safeCandidates.length,
      candidates_blocked: blockedActions.length
    });

    return {
      action: best.name,
      utility: best.utility,
      reasoning_trace: trace,
      alternatives,
      blockedActions,
      goalId: best.goalId
    };
  }

  // ---------------------------------------------------------------------------
  // Candidate Generation
  // ---------------------------------------------------------------------------

  /**
   * Generate action candidates from active goals and current state.
   * @private
   */
  _generateCandidates(state, activeGoals) {
    const candidates = [];
    const usedNames = new Set();

    // Goal-driven candidates
    for (const goal of activeGoals) {
      const goalCandidates = this._goalToActions(goal, state);
      for (const c of goalCandidates) {
        if (!usedNames.has(c.name) && candidates.length < this.maxCandidates) {
          candidates.push(c);
          usedNames.add(c.name);
        }
      }
    }

    // State-driven heuristic candidates
    const stateCandidates = this._stateHeuristics(state);
    for (const c of stateCandidates) {
      if (!usedNames.has(c.name) && candidates.length < this.maxCandidates) {
        candidates.push(c);
        usedNames.add(c.name);
      }
    }

    return candidates;
  }

  /**
   * Convert a goal into candidate actions.
   * @private
   */
  _goalToActions(goal, state) {
    const objective = goal.objective.toLowerCase();
    const candidates = [];

    // Pattern matching on objective
    if (/help|assist|serve/i.test(objective)) {
      candidates.push({
        name: `pursue_${goal.objective.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}`,
        goalObjective: goal.objective,
        expectedEffect: 'achieve helpful outcome',
        reasoning: `Directly pursuing goal: ${goal.objective}`,
        explainability: 0.8,
        type: 'goal_direct',
        goalId: goal.id,
        goalWeight: goal.getAdjustedPriority()
      });
    }

    if (/learn|understand|analyze|study/i.test(objective)) {
      candidates.push({
        name: `analyze_${objective.replace(/[^a-z0-9]/gi, '_').substring(0, 25)}`,
        goalObjective: goal.objective,
        expectedEffect: 'gain knowledge',
        reasoning: `Learning to support goal: ${goal.objective}`,
        explainability: 0.9,
        type: 'learning',
        goalId: goal.id,
        goalWeight: goal.getAdjustedPriority()
      });
    }

    if (/improve|optimize|increase/i.test(objective)) {
      candidates.push({
        name: `improve_${objective.replace(/[^a-z0-9]/gi, '_').substring(0, 25)}`,
        goalObjective: goal.objective,
        expectedEffect: 'incremental improvement',
        reasoning: `Optimization action for goal: ${goal.objective}`,
        explainability: 0.7,
        type: 'optimization',
        goalId: goal.id,
        goalWeight: goal.getAdjustedPriority()
      });
    }

    if (/create|build|generate/i.test(objective)) {
      candidates.push({
        name: `build_component_for_${objective.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}`,
        goalObjective: goal.objective,
        expectedEffect: 'create useful artifact',
        reasoning: `Construction action for goal: ${goal.objective}`,
        explainability: 0.8,
        type: 'creation',
        goalId: goal.id,
        goalWeight: goal.getAdjustedPriority()
      });
    }

    // Always add a "verify progress" candidate
    if (goal.progress < 0.9) {
      candidates.push({
        name: `verify_progress_${goal.id.substring(0, 8)}`,
        goalObjective: goal.objective,
        expectedEffect: 'check progress metrics',
        reasoning: `Monitoring progress toward: ${goal.objective}`,
        explainability: 0.95,
        type: 'monitoring',
        goalId: goal.id,
        goalWeight: goal.getAdjustedPriority() * 0.5 // Lower priority
      });
    }

    return candidates;
  }

  /**
   * Generate heuristic candidates based on current state.
   * @private
   */
  _stateHeuristics(state) {
    const candidates = [];

    // If resources low, suggest gathering
    if ((state.resources || 0) < 30) {
      candidates.push({
        name: 'gather_resources',
        goalObjective: 'resource_management',
        expectedEffect: 'increase resources',
        reasoning: 'Low resources detected, gathering needed',
        explainability: 0.9,
        type: 'state_heuristic',
        goalWeight: 0.6
      });
    }

    // If energy low, suggest rest
    if ((state.energy || 0) < 20) {
      candidates.push({
        name: 'conserve_energy',
        goalObjective: 'self_maintenance',
        expectedEffect: 'restore energy',
        reasoning: 'Low energy detected, conservation needed',
        explainability: 0.95,
        type: 'state_heuristic',
        goalWeight: 0.7
      });
    }

    // Exploration action (always available)
    candidates.push({
      name: 'explore_environment',
      goalObjective: 'knowledge_gathering',
      expectedEffect: 'discover new information',
      reasoning: 'Exploratory action to expand knowledge',
      explainability: 0.85,
      type: 'exploration',
      goalWeight: 0.3
    });

    return candidates;
  }

  // ---------------------------------------------------------------------------
  // Alignment Checking
  // ---------------------------------------------------------------------------

  /**
   * Check action through AlignmentV3. Caches results and handles errors.
   * @private
   */
  async _checkAlignment(actionObj) {
    if (!this.alignmentChecker) {
      // No alignment checker → allow everything (unsafe, for testing only)
      return { allowed: true, severity: 0 };
    }

    try {
      const result = await this.alignmentChecker.checkAction(actionObj);
      return result;
    } catch (err) {
      AuditLogger.error('reasoning', 'alignment_check_error', {
        action: actionObj.action,
        error: err.message
      });
      // On error, default to deny
      return { allowed: false, explanation: { humanReadable: `Alignment check error: ${err.message}` } };
    }
  }

  /**
   * Record a blocked action pattern to avoid regenerating it.
   * @private
   */
  _recordBlockedPattern(actionName) {
    const base = actionName.split('_').slice(0, 3).join('_');
    this._blockedPatterns.set(base, (this._blockedPatterns.get(base) || 0) + 1);
  }

  // ---------------------------------------------------------------------------
  // Monte Carlo Tree Search
  // ---------------------------------------------------------------------------

  /**
   * Run MCTS on safe candidates.
   * @private
   */
  _runMCTS(state, candidates, activeGoals) {
    let nodesExpanded = 0;

    // Initialize root node
    const root = new MCTSNode(state, 'root');
    root.untriedActions = candidates.map(c => c.name);

    // Run rollouts
    const candidateResults = new Map();
    for (const candidate of candidates) {
      candidateResults.set(candidate.name, {
        ...candidate,
        visits: 0,
        totalReward: 0,
        utility: 0
      });
    }

    const rolloutsPerCandidate = Math.max(1, Math.floor(this.rollouts / candidates.length));

    for (const candidate of candidates) {
      for (let r = 0; r < rolloutsPerCandidate; r++) {
        nodesExpanded++;
        const reward = this._simulateRollout(state, candidate, activeGoals);
        const result = candidateResults.get(candidate.name);
        result.visits++;
        result.totalReward += reward;
      }

      // Calculate final utility: weighted by goal priority, penalized by world model harm
      const result = candidateResults.get(candidate.name);
      const avgReward = result.visits > 0 ? result.totalReward / result.visits : 0;
      const goalBonus = (candidate.goalWeight || 0.5) * 0.3;
      const explorationBonus = this.explorationBonus * (result.visits < 5 ? 1 : 0);
      const alignmentPenalty = (candidate.alignmentScore || 0) * 0.2;

      result.utility = avgReward + goalBonus + explorationBonus - alignmentPenalty;
    }

    return {
      candidates: [...candidateResults.values()],
      nodesExpanded
    };
  }

  /**
   * Simulate a single MCTS rollout.
   * @private
   */
  _simulateRollout(state, candidate, activeGoals) {
    let reward = 0;
    let currentState = { ...state };

    // Use world model if available, otherwise use heuristic evaluation
    if (this.worldModel) {
      const prediction = this.worldModel.simulate(candidate.name, currentState, 2);
      reward = prediction.outcome;

      // If world model has low confidence, add uncertainty penalty
      if (prediction.confidence < this.confidenceThreshold) {
        reward *= prediction.confidence;
      }

      // Penalize harm
      reward -= prediction.harm_predicted * 2;
    } else {
      // Heuristic evaluation
      reward = this._heuristicEvaluate(candidate, currentState, activeGoals);
    }

    return reward;
  }

  /**
   * Heuristic action evaluation (fallback when no world model).
   * @private
   */
  _heuristicEvaluate(candidate, state, activeGoals) {
    let score = 0;

    // Goal alignment
    score += (candidate.goalWeight || 0.5) * 0.4;

    // Resource efficiency
    if (/gather|collect/i.test(candidate.name)) {
      score += (state.resources < 30) ? 0.3 : 0.1;
    }
    if (/build|create/i.test(candidate.name)) {
      score += (state.resources > 20) ? 0.2 : -0.1;
    }

    // Exploration bonus
    if (/explore|discover/i.test(candidate.name)) {
      score += this.explorationBonus;
    }

    // Monitoring bonus (low risk)
    if (/verify|monitor|check/i.test(candidate.name)) {
      score += 0.1;
    }

    // Blocked pattern penalty
    const base = candidate.name.split('_').slice(0, 3).join('_');
    const blockCount = this._blockedPatterns.get(base) || 0;
    score -= blockCount * 0.2;

    return Math.max(-1, Math.min(1, score));
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /**
   * Summarize state for trace.
   * @private
   */
  _summarizeState(state) {
    return {
      resources: state.resources,
      energy: state.energy,
      knowledge: state.knowledge,
      time: state.time
    };
  }

  /**
   * Get reasoning statistics.
   */
  getStats() {
    return {
      ...this._stats,
      blockedPatterns: [...this._blockedPatterns.entries()],
      explorationBonus: this.explorationBonus,
      confidenceThreshold: this.confidenceThreshold,
      mctsDepth: this.mctsDepth,
      rollouts: this.rollouts
    };
  }

  /**
   * Adjust meta-learning parameters.
   * Called by LearningLoop based on performance.
   */
  adjustHyperparams(params) {
    if (params.explorationBonus !== undefined) {
      this.explorationBonus = params.explorationBonus;
    }
    if (params.confidenceThreshold !== undefined) {
      this.confidenceThreshold = params.confidenceThreshold;
    }
    if (params.mctsDepth !== undefined) {
      this.mctsDepth = params.mctsDepth;
    }
    if (params.rollouts !== undefined) {
      this.rollouts = params.rollouts;
    }
    AuditLogger.info('reasoning', 'hyperparams_adjusted', params);
  }

  /**
   * Clear stats (for testing).
   */
  clearStats() {
    this._stats = {
      totalDeliberations: 0,
      totalCandidatesGenerated: 0,
      totalAlignmentChecks: 0,
      totalBlocked: 0,
      totalAllowed: 0,
      avgReasoningLatency: 0,
      _latencySum: 0
    };
    this._blockedPatterns.clear();
  }
}

module.exports = ReasoningEngine;



