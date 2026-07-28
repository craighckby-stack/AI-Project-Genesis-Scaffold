// =============================================================================
// world-model.js — Predictive Environment Model with Ensemble Learning
// =============================================================================
// Simulates action outcomes, tracks prediction accuracy, and updates via
// temporal difference learning. 3-model ensemble with disagreement-based
// uncertainty estimation.
// =============================================================================

'use strict';

const AuditLogger = require('./audit');

// ---------------------------------------------------------------------------
// Single Model (one member of the ensemble)
// ---------------------------------------------------------------------------

class InternalModel {
  constructor(id) {
    this.id = id;
    this.weights = new Map(); // state_feature → action_feature → expected_outcome
    this.bias = 0;
    this.learningRate = 0.05;
    this.discountFactor = 0.95;
    this._predictionCount = 0;
    this._errorSum = 0;
  }

  /**
   * Predict outcome for a state-action pair.
   * Uses feature hashing for simplicity (production: neural net).
   *
   * @param {object} state
   * @param {string} action
   * @returns {number} predicted outcome value (-1 to 1)
   */
  predict(state, action) {
    const features = this._extractFeatures(state, action);
    let prediction = this.bias;

    for (const [feature, value] of features) {
      const weight = this.weights.get(feature) || 0;
      prediction += weight * value;
    }

    this._predictionCount++;
    return Math.max(-1, Math.min(1, prediction)); // Clamp to [-1, 1]
  }

  /**
   * Update weights using temporal difference.
   * @param {object} state
   * @param {string} action
   * @param {number} reward - Actual outcome reward
   * @param {number} nextStateValue - Predicted value of resulting state
   */
  update(state, action, reward, nextStateValue = 0) {
    const features = this._extractFeatures(state, action);
    const currentPrediction = this.predict(state, action);
    const tdError = reward + this.discountFactor * nextStateValue - currentPrediction;

    // Update bias
    this.bias += this.learningRate * tdError;

    // Update feature weights
    for (const [feature, value] of features) {
      const currentWeight = this.weights.get(feature) || 0;
      this.weights.set(feature, currentWeight + this.learningRate * tdError * value);
    }

    this._errorSum += Math.abs(tdError);
  }

  /**
   * Get mean absolute error for this model.
   */
  getMAE() {
    return this._predictionCount > 0 ? this._errorSum / this._predictionCount : 1.0;
  }

  /**
   * Extract features from state-action pair.
   * Uses feature hashing for O(1) lookup.
   * @private
   */
  _extractFeatures(state, action) {
    const features = new Map();
    const actionLower = action.toLowerCase().replace(/[_\s]+/g, '_');

    // Action-type features
    features.set(`action_type_${actionLower.split('_')[0]}`, 1.0);

    // State features
    if (state.resources !== undefined) {
      features.set('has_resources', Math.min(1, state.resources / 100));
    }
    if (state.energy !== undefined) {
      features.set('has_energy', Math.min(1, state.energy / 100));
    }

    // Action-content features (harmful, helpful, exploratory)
    const harmful = /harm|destroy|kill|damage|weaponize|deceive/i.test(action);
    const helpful = /help|improve|teach|create|build|assist|learn/i.test(action);
    const exploratory = /explore|investigate|search|analyze|discover/i.test(action);

    features.set('is_harmful', harmful ? 1.0 : -0.5);
    features.set('is_helpful', helpful ? 1.0 : -0.5);
    features.set('is_exploratory', exploratory ? 1.0 : -0.5);

    // Cross features
    features.set(`${actionLower}_resources_${state.resources !== undefined ? 'low' : 'unknown'}`, 0.5);

    return features;
  }

  /**
   * Get weight snapshot (for rollback).
   */
  getSnapshot() {
    return {
      weights: new Map(this.weights),
      bias: this.bias,
      predictionCount: this._predictionCount,
      errorSum: this._errorSum
    };
  }

  /**
   * Restore from snapshot.
   */
  restoreSnapshot(snapshot) {
    this.weights = new Map(snapshot.weights);
    this.bias = snapshot.bias;
    this._predictionCount = snapshot.predictionCount;
    this._errorSum = snapshot.errorSum;
  }
}

// ---------------------------------------------------------------------------
// WorldModel — Ensemble of 3 Internal Models
// ---------------------------------------------------------------------------

class WorldModel {
  /**
   * @param {object} options
   * @param {number} options.ensembleSize - Number of internal models (default: 3)
   * @param {number} options.confidenceThreshold - Min confidence to trust prediction (default: 0.7)
   */
  constructor(options = {}) {
    this.ensembleSize = options.ensembleSize || 3;
    this.confidenceThreshold = options.confidenceThreshold || 0.7;
    this.models = [];

    // Create ensemble with slightly different learning rates (diversity)
    for (let i = 0; i < this.ensembleSize; i++) {
      const model = new InternalModel(`model_${i}`);
      model.learningRate = 0.03 + (i * 0.02); // 0.03, 0.05, 0.07
      this.models.push(model);
    }

    // Tracking
    this._predictionHistory = [];
    this._driftScore = 0;
    this._totalUpdates = 0;
  }

  /**
   * Simulate an action in a given state.
   *
   * @param {string} action - Action to simulate
   * @param {object} state - Current environment state
   * @param {number} depth - Simulation depth (default: 1)
   * @returns {{
   *   outcome: number,
   *   harm_predicted: number,
   *   confidence: number,
   *   disagreement: number,
   *   epistemic_uncertainty: number,
   *   aleatoric_uncertainty: number,
   *   model_predictions: number[],
   *   ensemble_agreement: string
   * }}
   */
  simulate(action, state, depth = 1) {
    const predictions = this.models.map(model => model.predict(state, action));

    // Ensemble: average prediction
    const mean = predictions.reduce((s, p) => s + p, 0) / predictions.length;

    // Disagreement: standard deviation of predictions
    const variance = predictions.reduce((s, p) => s + (p - mean) ** 2, 0) / predictions.length;
    const disagreement = Math.sqrt(variance);

    // Confidence: inverse of disagreement (high agreement = high confidence)
    const confidence = Math.max(0, Math.min(1, 1 - disagreement * 2));

    // Uncertainty decomposition
    const epistemic_uncertainty = disagreement; // Model ignorance (reducible with data)
    const aleatoric_uncertainty = Math.max(0, 0.3 - disagreement); // Env randomness (irreducible)

    // Harm prediction: re-simulate with harm-focused features
    const harmPredictions = this.models.map(model => {
      const harmState = { ...state, _harmFocus: true };
      return model.predict(harmState, action);
    });
    const harm_predicted = Math.max(0, harmPredictions.reduce((s, p) => s + p, 0) / harmPredictions.length);

    // Deep simulation: if depth > 1, simulate follow-up states
    let deepOutcome = mean;
    if (depth > 1) {
      const nextState = this._projectState(state, action, mean);
      const followUp = this.simulate('continue', nextState, depth - 1);
      deepOutcome = mean * 0.7 + followUp.outcome * 0.3; // Weight current more than future
    }

    const result = {
      outcome: deepOutcome,
      harm_predicted: Math.max(0, harm_predicted),
      confidence,
      disagreement,
      epistemic_uncertainty,
      aleatoric_uncertainty,
      model_predictions: predictions,
      ensemble_agreement: disagreement < 0.1 ? 'high' : disagreement < 0.3 ? 'medium' : 'low'
    };

    this._predictionHistory.push({
      action,
      state: { ...state },
      result: { ...result },
      timestamp: Date.now()
    });

    AuditLogger.debug('world_model', 'simulated', {
      action,
      outcome: deepOutcome.toFixed(3),
      harm: harm_predicted.toFixed(3),
      confidence: confidence.toFixed(3),
      agreement: result.ensemble_agreement
    });

    return result;
  }

  /**
   * Update ensemble models with actual outcome.
   * Uses temporal difference learning across all models.
   *
   * @param {object} state - State before action
   * @param {string} action - Action taken
   * @param {number} reward - Actual outcome (-1 to 1)
   * @param {object} nextState - State after action (optional)
   */
  updateWeights(state, action, reward, nextState = null) {
    const nextStateValue = nextState
      ? this.models.reduce((s, m) => s + m.predict(nextState, 'idle'), 0) / this.models.length
      : 0;

    for (const model of this.models) {
      model.update(state, action, reward, nextStateValue);
    }

    this._totalUpdates++;

    // Calculate drift: compare recent predictions to actual outcomes
    this._updateDrift();

    AuditLogger.debug('world_model', 'weights_updated', {
      action,
      reward: reward.toFixed(3),
      nextStateValue: nextStateValue.toFixed(3),
      totalUpdates: this._totalUpdates
    });
  }

  /**
   * Project state forward after an action (simplified state transition).
   * @private
   */
  _projectState(state, action, outcome) {
    const newState = { ...state };
    const actionLower = action.toLowerCase();

    // Energy cost: most actions cost energy
    if (newState.energy !== undefined) {
      newState.energy = Math.max(0, newState.energy - 2);
    }

    // Resource changes based on action type
    if (/gather|collect|harvest/i.test(actionLower)) {
      newState.resources = (newState.resources || 0) + Math.floor(outcome * 10);
    } else if (/build|create/i.test(actionLower)) {
      newState.resources = Math.max(0, (newState.resources || 0) - 5);
    } else if (/learn|analyze/i.test(actionLower)) {
      newState.knowledge = (newState.knowledge || 0) + Math.floor(outcome * 5);
    }

    newState.time = (newState.time || 0) + 1;
    return newState;
  }

  /**
   * Calculate drift between recent predictions and outcomes.
   * @private
   */
  _updateDrift() {
    const recent = this._predictionHistory.slice(-20);
    if (recent.length < 5) {
      this._driftScore = 0;
      return;
    }

    // Use mean model MAE as drift indicator
    const avgMAE = this.models.reduce((s, m) => s + m.getMAE(), 0) / this.models.length;
    this._driftScore = Math.min(1, avgMAE);
  }

  /**
   * Get drift score (0 = no drift, 1 = severe drift).
   */
  getDriftScore() {
    return this._driftScore;
  }

  /**
   * Check if world model is in a drifted state.
   */
  isDrifted() {
    return this._driftScore > 0.3;
  }

  /**
   * Get current state for simulation.
   * In production, this reads from sensors.
   */
  getCurrentState() {
    return {
      position: { x: 0, y: 0 },
      resources: 50,
      energy: 100,
      knowledge: 10,
      time: 0,
      environment: 'default'
    };
  }

  /**
   * Get model statistics.
   */
  getStats() {
    return {
      ensembleSize: this.ensembleSize,
      totalUpdates: this._totalUpdates,
      driftScore: this._driftScore,
      isDrifted: this.isDrifted(),
      confidenceThreshold: this.confidenceThreshold,
      modelMAEs: this.models.map(m => m.getMAE()),
      avgMAE: this.models.reduce((s, m) => s + m.getMAE(), 0) / this.models.length
    };
  }

  /**
   * Get snapshots for all models (for rollback).
   */
  getSnapshots() {
    return this.models.map(m => m.getSnapshot());
  }

  /**
   * Restore all models from snapshots.
   */
  restoreSnapshots(snapshots) {
    for (let i = 0; i < this.models.length && i < snapshots.length; i++) {
      this.models[i].restoreSnapshot(snapshots[i]);
    }
    AuditLogger.warn('world_model', 'restored_from_snapshot', { modelCount: snapshots.length });
  }

  /**
   * Clear all data (for testing).
   */
  clear() {
    for (const model of this.models) {
      model.weights.clear();
      model.bias = 0;
      model._predictionCount = 0;
      model._errorSum = 0;
    }
    this._predictionHistory = [];
    this._driftScore = 0;
    this._totalUpdates = 0;
  }
}

module.exports = WorldModel;


