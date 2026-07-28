// =============================================================================
// learning-loop.js — Experience Recording, Batch Update, Meta-Learning
// =============================================================================
// Records (state, action, outcome, reward) every cycle. Periodically updates
// world model and value function. Adjusts reasoning hyperparams based on
// performance metrics. Triggers self-modification when stuck.
// =============================================================================

'use strict';

const AuditLogger = require('./audit');

class LearningLoop {
  /**
   * @param {object} options
   * @param {number} options.batchSize - Steps between batch updates (default: 100)
   * @param {number} options.maxHistory - Max experience buffer size (default: 1000)
   * @param {Function} options.worldModel - WorldModel instance
   * @param {Function} options.reasoningEngine - ReasoningEngine instance
   */
  constructor(options = {}) {
    this.batchSize = options.batchSize || 100;
    this.maxHistory = options.maxHistory || 1000;
    this.worldModel = options.worldModel || null;
    this.reasoningEngine = options.reasoningEngine || null;

    // Experience buffer: circular
    this._experience = [];
    this._head = 0;

    // Step counter
    this._stepCount = 0;

    // Performance tracking
    this._recentRewards = [];
    this._recentLatencies = [];
    this._blockedRate = 0;
    this._blockedCount = 0;
    this._totalReward = 0;

    // Meta-learning state
    this._metaParams = {
      explorationBonus: 0.1,
      confidenceThreshold: 0.5,
      stuckCounter: 0,
      lastImprovement: Date.now()
    };

    // Self-modification trigger
    this.selfModNeeded = false;
    this.selfModReason = null;

    // Value function (simple table-based, production: neural net)
    this._valueTable = new Map(); // state_key → value
  }

  /**
   * Record a single experience step.
   *
   * @param {object} experience
   * @param {object} experience.state - Environment state before action
   * @param {string} experience.action - Action taken
   * @param {boolean} experience.allowed - Was action allowed by alignment?
   * @param {string|null} experience.blockedReason - Why blocked (if applicable)
   * @param {number} experience.reward - Outcome reward (-1 to 1)
   * @param {object} experience.nextState - State after action
   * @param {number} experience.latencyMs - Reasoning latency
   * @param {string} experience.goalId - Which goal this action served
   */
  record(experience) {
    this._stepCount++;

    const entry = {
      ...experience,
      timestamp: Date.now(),
      step: this._stepCount
    };

    // Add to circular buffer
    if (this._experience.length < this.maxHistory) {
      this._experience.push(entry);
    } else {
      this._experience[this._head] = entry;
      this._head = (this._head + 1) % this.maxHistory;
    }

    // Track performance
    if (experience.reward !== undefined) {
      this._recentRewards.push(experience.reward);
      this._totalReward += experience.reward;
      if (this._recentRewards.length > 100) this._recentRewards.shift();
    }

    if (experience.latencyMs !== undefined) {
      this._recentLatencies.push(experience.latencyMs);
      if (this._recentLatencies.length > 100) this._recentLatencies.shift();
    }

    if (!experience.allowed) {
      this._blockedCount++;
    }

    // Update value table
    this._updateValueTable(experience);

    // Check if batch update is needed
    if (this._stepCount % this.batchSize === 0) {
      this._batchUpdate();
    }

    // Check if meta-learning adjustment is needed
    if (this._stepCount % 10 === 0) {
      this._metaLearn();
    }
  }

  /**
   * Batch update: replay recent experiences to update world model.
   * @private
   */
  _batchUpdate() {
    if (!this.worldModel) return;

    const batchSize = Math.min(this.batchSize, this._experience.length);
    let updatesApplied = 0;

    for (let i = 0; i < batchSize; i++) {
      const idx = (this._head - 1 - i + this.maxHistory) % this.maxHistory;
      const exp = this._experience[idx];

      if (!exp) continue;

      // Update world model weights
      this.worldModel.updateWeights(
        exp.state,
        exp.action,
        exp.reward,
        exp.nextState
      );
      updatesApplied++;
    }

    // Update blocked rate
    this._blockedRate = this._stepCount > 0
      ? this._blockedCount / this._stepCount
      : 0;

    AuditLogger.info('learning', 'batch_update', {
      step: this._stepCount,
      experiencesReplayed: updatesApplied,
      blockedRate: (this._blockedRate * 100).toFixed(1) + '%',
      avgReward: this.getAvgReward().toFixed(3),
      worldModelDrift: this.worldModel.getDriftScore().toFixed(3)
    });
  }

  /**
   * Meta-learning: adjust reasoning hyperparams based on performance.
   * @private
   */
  _metaLearn() {
    if (!this.reasoningEngine) return;

    const avgReward = this.getAvgReward();
    const blockedRate = this.getBlockedRate();
    const avgLatency = this.getAvgLatency();

    let paramsChanged = false;
    const params = {};

    // If blocked rate is high, increase exploration (try different action patterns)
    if (blockedRate > 0.5) {
      params.explorationBonus = Math.min(0.5, this._metaParams.explorationBonus + 0.05);
      this._metaParams.explorationBonus = params.explorationBonus;
      paramsChanged = true;
    }

    // If world model is drifted, lower confidence threshold
    if (this.worldModel && this.worldModel.isDrifted()) {
      params.confidenceThreshold = Math.max(0.2, this._metaParams.confidenceThreshold - 0.05);
      this._metaParams.confidenceThreshold = params.confidenceThreshold;
      paramsChanged = true;
    }

    // If rewards are consistently negative, increase exploration
    if (avgReward < -0.2 && this._recentRewards.length > 20) {
      params.explorationBonus = Math.min(0.5, this._metaParams.explorationBonus + 0.1);
      this._metaParams.explorationBonus = params.explorationBonus;
      paramsChanged = true;
      this._metaParams.stuckCounter++;
    }

    // If rewards are positive, reduce exploration slightly (exploit more)
    if (avgReward > 0.3 && this._recentRewards.length > 20) {
      params.explorationBonus = Math.max(0.01, this._metaParams.explorationBonus - 0.02);
      this._metaParams.explorationBonus = params.explorationBonus;
      paramsChanged = true;
      this._metaParams.stuckCounter = Math.max(0, this._metaParams.stuckCounter - 1);
      this._metaParams.lastImprovement = Date.now();
    }

    if (paramsChanged) {
      this.reasoningEngine.adjustHyperparams(params);
      AuditLogger.info('learning', 'meta_learning_adjustment', {
        avgReward: avgReward.toFixed(3),
        blockedRate: (blockedRate * 100).toFixed(1) + '%',
        stuckCounter: this._metaParams.stuckCounter,
        params
      });
    }

    // Self-modification trigger: stuck for too long
    if (this._metaParams.stuckCounter > 5) {
      this.selfModNeeded = true;
      this.selfModReason = `Stuck: ${this._metaParams.stuckCounter} consecutive low-reward periods. ` +
        `Avg reward: ${avgReward.toFixed(3)}, Blocked rate: ${(blockedRate * 100).toFixed(1)}%`;
    }

    // Self-modification trigger: world model severely drifted
    if (this.worldModel && this.worldModel.getDriftScore() > 0.5) {
      this.selfModNeeded = true;
      this.selfModReason = `World model severely drifted (score: ${this.worldModel.getDriftScore().toFixed(3)}). ` +
        `Consider resetting or retraining model weights.`;
    }
  }

  /**
   * Update value table (simple tabular RL).
   * @private
   */
  _updateValueTable(experience) {
    const stateKey = this._stateToKey(experience.state);
    const nextKey = experience.nextState ? this._stateToKey(experience.nextState) : null;

    const currentValue = this._valueTable.get(stateKey) || 0;
    const nextValue = nextKey ? (this._valueTable.get(nextKey) || 0) : 0;
    const discount = 0.95;

    // Temporal difference update
    const newValue = currentValue + 0.1 * (
      experience.reward + discount * nextValue - currentValue
    );

    this._valueTable.set(stateKey, newValue);
  }

  /**
   * Hash state to string key for value table.
   * @private
   */
  _stateToKey(state) {
    return `${state.resources || 0}_${state.energy || 0}_${state.knowledge || 0}_${state.time || 0}`;
  }

  /**
   * Get estimated value of a state.
   */
  getValue(state) {
    const key = this._stateToKey(state);
    return this._valueTable.get(key) || 0;
  }

  /**
   * Get average reward over recent window.
   */
  getAvgReward() {
    if (this._recentRewards.length === 0) return 0;
    return this._recentRewards.reduce((s, r) => s + r, 0) / this._recentRewards.length;
  }

  /**
   * Get alignment blocked rate.
   */
  getBlockedRate() {
    return this._stepCount > 0 ? this._blockedCount / this._stepCount : 0;
  }

  /**
   * Get average reasoning latency.
   */
  getAvgLatency() {
    if (this._recentLatencies.length === 0) return 0;
    return this._recentLatencies.reduce((s, l) => s + l, 0) / this._recentLatencies.length;
  }

  /**
   * Get recent reward trend (improving/declining/stable).
   */
  getRewardTrend() {
    if (this._recentRewards.length < 20) return { direction: 'insufficient_data', rate: 0 };

    const recent = this._recentRewards.slice(-10);
    const previous = this._recentRewards.slice(-20, -10);
    const recentAvg = recent.reduce((s, r) => s + r, 0) / recent.length;
    const previousAvg = previous.reduce((s, r) => s + r, 0) / previous.length;
    const rate = recentAvg - previousAvg;

    return {
      direction: rate > 0.05 ? 'improving' : rate < -0.05 ? 'declining' : 'stable',
      rate: Math.round(rate * 1000) / 1000,
      recentAvg: Math.round(recentAvg * 1000) / 1000,
      previousAvg: Math.round(previousAvg * 1000) / 1000
    };
  }

  /**
   * Get comprehensive stats.
   */
  getStats() {
    return {
      stepCount: this._stepCount,
      totalReward: this._totalReward,
      avgReward: this.getAvgReward(),
      blockedRate: this.getBlockedRate(),
      blockedCount: this._blockedCount,
      avgLatency: this.getAvgLatency(),
      rewardTrend: this.getRewardTrend(),
      batchSize: this.batchSize,
      experienceBufferSize: this._experience.length,
      valueTableSize: this._valueTable.size,
      stuckCounter: this._metaParams.stuckCounter,
      selfModNeeded: this.selfModNeeded,
      explorationBonus: this._metaParams.explorationBonus,
      confidenceThreshold: this._metaParams.confidenceThreshold
    };
  }

  /**
   * Clear self-modification trigger (after it's been handled).
   */
  clearSelfModTrigger() {
    this.selfModNeeded = false;
    this.selfModReason = null;
    this._metaParams.stuckCounter = 0;
  }

  /**
   * Clear all data (for testing).
   */
  clear() {
    this._experience = [];
    this._head = 0;
    this._stepCount = 0;
    this._recentRewards = [];
    this._recentLatencies = [];
    this._blockedCount = 0;
    this._totalReward = 0;
    this._valueTable.clear();
    this._metaParams = {
      explorationBonus: 0.1,
      confidenceThreshold: 0.5,
      stuckCounter: 0,
      lastImprovement: Date.now()
    };
    this.selfModNeeded = false;
    this.selfModReason = null;
  }
}

module.exports = LearningLoop;



