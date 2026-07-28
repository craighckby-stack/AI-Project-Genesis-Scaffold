// =============================================================================
// drift.js — World Model Drift Detector
// =============================================================================
// Monitors prediction-vs-outcome divergence to detect world model degradation
// or adversarial manipulation. Uses a circular buffer and KL divergence.
// =============================================================================

'use strict';

const AuditLogger = require('./audit');

class DriftDetector {
  /**
   * @param {object} options
   * @param {number} options.bufferSize - Circular buffer size (default: 100)
   * @param {number} options.alertThreshold - KL divergence alert threshold (default: 0.3)
   * @param {number} options.checkInterval - Auto-check interval in ms (default: 0 = manual)
   */
  constructor(options = {}) {
    this.bufferSize = options.bufferSize || 100;
    this.alertThreshold = options.alertThreshold || 0.3;
    this._buffer = [];         // {prediction, outcome, timestamp, action}
    this._head = 0;            // Circular buffer head
    this._lastDriftScore = 0;
    this._lastCheckTime = null;
    this._alertCount = 0;
    this._driftHistory = [];   // Historical drift scores for trend analysis
    this._timer = null;

    // Start periodic check if interval specified
    if (options.checkInterval > 0) {
      this._timer = setInterval(
        () => this.checkDrift(),
        options.checkInterval
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Recording
  // ---------------------------------------------------------------------------

  /**
   * Record a prediction before action execution.
   * @param {object} prediction - {harm, uncertainty, outcome_estimate, action}
   * @returns {string} prediction ID (for matching with outcome later)
   */
  recordPrediction(prediction) {
    const id = this._generateId();
    const entry = {
      id,
      prediction: this._normalize(prediction),
      outcome: null,
      timestamp: new Date().toISOString(),
      action: prediction.action || 'unknown'
    };

    this._bufferPush(entry);

    AuditLogger.debug('drift', 'prediction_recorded', {
      id,
      action: entry.action,
      harm: prediction.harm,
      uncertainty: prediction.uncertainty
    });

    return id;
  }

  /**
   * Record the actual outcome after action execution.
   * Matches against a prior prediction by ID.
   * @param {string} predictionId - ID returned by recordPrediction()
   * @param {object} outcome - {harm, uncertainty, outcome_actual}
   */
  recordOutcome(predictionId, outcome) {
    const entry = this._buffer.find(e => e.id === predictionId);
    if (!entry) {
      AuditLogger.warn('drift', 'outcome_no_matching_prediction', {
        predictionId
      });
      return;
    }

    entry.outcome = this._normalize(outcome);
    entry.outcomeRecordedAt = new Date().toISOString();

    AuditLogger.debug('drift', 'outcome_recorded', {
      id: predictionId,
      predictedHarm: entry.prediction.harm,
      actualHarm: entry.outcome.harm,
      delta: Math.abs(entry.prediction.harm - entry.outcome.harm)
    });
  }

  // ---------------------------------------------------------------------------
  // Drift Analysis
  // ---------------------------------------------------------------------------

  /**
   * Check current drift level.
   * @returns {{
   *   drifted: boolean,
   *   score: number,
   *   alert: boolean,
   *   lastChecked: string,
   *   details: object
   * }}
   */
  checkDrift() {
    const completed = this._getCompletedPairs();
    this._lastCheckTime = new Date().toISOString();

    if (completed.length < 5) {
      // Not enough data for reliable drift detection
      return {
        drifted: false,
        score: 0,
        alert: false,
        lastChecked: this._lastCheckTime,
        details: {
          reason: 'insufficient_data',
          completedPairs: completed.length,
          minimumRequired: 5
        }
      };
    }

    // Calculate drift using multiple methods
    const klDrift = this._klDivergence(completed);
    const maeDrift = this._meanAbsoluteError(completed);
    const biasDrift = this._systematicBias(completed);

    // Weighted composite score
    const compositeScore = (klDrift * 0.5) + (maeDrift * 0.3) + (biasDrift * 0.2);
    this._lastDriftScore = compositeScore;

    const alerted = compositeScore > this.alertThreshold;
    if (alerted) {
      this._alertCount++;
      AuditLogger.warn('drift', 'drift_alert', {
        score: compositeScore,
        threshold: this.alertThreshold,
        klDivergence: klDrift,
        mae: maeDrift,
        bias: biasDrift,
        completedPairs: completed.length
      });
    }

    const result = {
      drifted: compositeScore > this.alertThreshold * 0.7, // Warning at 70% threshold
      score: compositeScore,
      alert: alerted,
      lastChecked: this._lastCheckTime,
      details: {
        klDivergence: klDrift,
        meanAbsoluteError: maeDrift,
        systematicBias: biasDrift,
        completedPairs: completed.length,
        bufferSize: this.bufferSize,
        alertThreshold: this.alertThreshold
      }
    };

    this._driftHistory.push({
      score: compositeScore,
      timestamp: this._lastCheckTime,
      alerted
    });

    AuditLogger.info('drift', 'drift_checked', result);
    return result;
  }

  /**
   * Get trend of drift scores over time.
   * @returns {Array<{score: number, timestamp: string, alerted: boolean}>}
   */
  getDriftTrend() {
    return [...this._driftHistory];
  }

  /**
   * Check if drift is worsening (score increasing over recent window).
   * @param {number} windowSize - Number of recent checks to compare (default: 10)
   * @returns {{worsening: boolean, rate: number, direction: 'improving'|'stable'|'worsening'}}
   */
  getTrendDirection(windowSize = 10) {
    const trend = this._driftHistory;
    if (trend.length < windowSize * 2) {
      return { worsening: false, rate: 0, direction: 'insufficient_data' };
    }

    const recent = trend.slice(-windowSize);
    const previous = trend.slice(-windowSize * 2, -windowSize);

    const recentAvg = recent.reduce((s, e) => s + e.score, 0) / recent.length;
    const previousAvg = previous.reduce((s, e) => s + e.score, 0) / previous.length;

    const rate = recentAvg - previousAvg;
    const direction = rate > 0.05 ? 'worsening' : rate < -0.05 ? 'improving' : 'stable';

    return {
      worsening: direction === 'worsening',
      rate: Math.round(rate * 1000) / 1000,
      direction,
      recentAvg: Math.round(recentAvg * 1000) / 1000,
      previousAvg: Math.round(previousAvg * 1000) / 1000
    };
  }

  // ---------------------------------------------------------------------------
  // Drift Metrics (Private)
  // ---------------------------------------------------------------------------

  /**
   * KL divergence between prediction and outcome distributions.
   * Bins continuous values into discrete buckets for KL calculation.
   * @private
   */
  _klDivergence(pairs) {
    const bins = 10;
    const predDist = new Array(bins).fill(0);
    const outDist = new Array(bins).fill(0);

    for (const { prediction, outcome } of pairs) {
      const pIdx = Math.min(bins - 1, Math.floor(prediction.harm * bins));
      const oIdx = Math.min(bins - 1, Math.floor(outcome.harm * bins));
      predDist[pIdx]++;
      outDist[oIdx]++;
    }

    // Normalize to probability distributions with smoothing
    const n = pairs.length + bins * 2; // Laplace smoothing
    for (let i = 0; i < bins; i++) {
      predDist[i] = (predDist[i] + 1) / n;
      outDist[i] = (outDist[i] + 1) / n;
    }

    // KL(P || Q) where P = outcome, Q = prediction
    // Measures how much the outcome distribution diverges from predictions
    let kl = 0;
    for (let i = 0; i < bins; i++) {
      if (outDist[i] > 0 && predDist[i] > 0) {
        kl += outDist[i] * Math.log(outDist[i] / predDist[i]);
      }
    }

    return Math.max(0, kl);
  }

  /**
   * Mean absolute error between predicted and actual harm values.
   * @private
   */
  _meanAbsoluteError(pairs) {
    if (pairs.length === 0) return 0;
    const totalError = pairs.reduce((sum, { prediction, outcome }) => {
      return sum + Math.abs(prediction.harm - outcome.harm);
    }, 0);
    return totalError / pairs.length;
  }

  /**
   * Systematic bias: does the model consistently under/overestimate harm?
   * Positive = underestimates harm (dangerous). Negative = overestimates (safe but wasteful).
   * @private
   */
  _systematicBias(pairs) {
    if (pairs.length === 0) return 0;
    const totalBias = pairs.reduce((sum, { prediction, outcome }) => {
      return sum + (prediction.harm - outcome.harm);
    }, 0);
    // Normalize to 0-1 range
    const meanBias = totalBias / pairs.length;
    return Math.abs(Math.tanh(meanBias * 5)); // Saturates at extreme biases
  }

  // ---------------------------------------------------------------------------
  // Buffer Management (Private)
  // ---------------------------------------------------------------------------

  /**
   * Get all prediction-outcome pairs that have both recorded.
   * @private
   */
  _getCompletedPairs() {
    return this._buffer.filter(e => e.prediction && e.outcome);
  }

  /**
   * Push to circular buffer.
   * @private
   */
  _bufferPush(entry) {
    if (this._buffer.length < this.bufferSize) {
      this._buffer.push(entry);
    } else {
      this._buffer[this._head] = entry;
    }
    this._head = (this._head + 1) % this.bufferSize;
  }

  /**
   * Normalize a prediction/outcome to standard shape.
   * @private
   */
  _normalize(obj) {
    return {
      harm: Math.max(0, Math.min(1, Number(obj.harm) || 0)),
      uncertainty: Math.max(0, Math.min(1, Number(obj.uncertainty) || 0)),
      outcome: obj.outcome || obj.outcome_actual || null
    };
  }

  /**
   * Generate short unique ID.
   * @private
   */
  _generateId() {
    return 'drift_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Get current statistics.
   */
  getStats() {
    return {
      bufferSize: this.bufferSize,
      currentSize: this._buffer.length,
      completedPairs: this._getCompletedPairs().length,
      pendingOutcomes: this._buffer.filter(e => !e.outcome).length,
      lastDriftScore: this._lastDriftScore,
      alertCount: this._alertCount,
      alertThreshold: this.alertThreshold,
      lastCheckTime: this._lastCheckTime
    };
  }

  /**
   * Stop periodic drift checking.
   */
  destroy() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /**
   * Clear all data (for testing).
   */
  clear() {
    this._buffer = [];
    this._head = 0;
    this._lastDriftScore = 0;
    this._alertCount = 0;
    this._driftHistory = [];
    this._lastCheckTime = null;
  }
}

module.exports = DriftDetector;



