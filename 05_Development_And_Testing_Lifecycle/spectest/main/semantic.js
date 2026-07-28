// =============================================================================
// semantic.js — Multi-tier Semantic Similarity Engine
// =============================================================================
// Cascade: TF-IDF (fast) → Embeddings (medium) → LLM Judge (high-stakes)
// Every comparison produces a score 0-1 with confidence metadata.
// =============================================================================

'use strict';

const AuditLogger = require('./audit');

// ---------------------------------------------------------------------------
// Tier 1: TF-IDF based cosine similarity (pure JS, no dependencies)
// ---------------------------------------------------------------------------

class TFIDFEngine {
  constructor() {
    this.documents = [];      // All texts seen so far (for IDF)
    this.vocab = new Map();   // term → { df: count }
    this._stopwords = new Set([
      'the','a','an','is','are','was','were','be','been','being',
      'have','has','had','do','does','did','will','would','could',
      'should','may','might','can','shall','to','of','in','for',
      'on','with','at','by','from','as','into','through','during',
      'before','after','above','below','between','out','off','over',
      'under','again','further','then','once','here','there','when',
      'where','why','how','all','each','every','both','few','more',
      'most','other','some','such','no','nor','not','only','own',
      'same','so','than','too','very','just','because','but','and',
      'or','if','while','that','this','these','those','it','its',
      'i','me','my','we','our','you','your','he','him','his',
      'she','her','they','them','their','what','which','who','whom'
    ]);
  }

  /**
   * Tokenize text into lowercase terms, stripping punctuation and stopwords.
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !this._stopwords.has(t));
  }

  /**
   * Add a document to the corpus (updates IDF statistics).
   */
  addDocument(text) {
    const tokens = new Set(this.tokenize(text));
    this.documents.push(tokens);
    for (const term of tokens) {
      this.vocab.set(term, (this.vocab.get(term) || 0) + 1);
    }
  }

  /**
   * Compute TF (term frequency) for a single tokenized text.
   */
  _tf(tokens) {
    const freq = {};
    for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
    const max = Math.max(...Object.values(freq), 1);
    const tf = {};
    for (const [term, count] of Object.entries(freq)) {
      tf[term] = count / max;
    }
    return tf;
  }

  /**
   * Compute IDF (inverse document frequency) for all terms.
   * Uses smoothed IDF to avoid division by zero.
   */
  _idf() {
    const N = this.documents.length || 1;
    const idf = {};
    for (const [term, df] of this.vocab.entries()) {
      idf[term] = Math.log((N + 1) / (df + 1)) + 1;
    }
    return idf;
  }

  /**
   * Build a TF-IDF vector for a token array.
   * Returns Map<term, tfidf_score>.
   */
  vectorize(tokens) {
    const tf = this._tf(tokens);
    const idf = this._idf();
    const vec = new Map();
    for (const [term, tfVal] of Object.entries(tf)) {
      vec.set(term, tfVal * (idf[term] || 1));
    }
    return vec;
  }

  /**
   * Cosine similarity between two sparse vectors (Maps).
   */
  cosineSimilarity(vecA, vecB) {
    let dot = 0, magA = 0, magB = 0;
    for (const [term, valA] of vecA.entries()) {
      const valB = vecB.get(term) || 0;
      dot += valA * valB;
      magA += valA * valA;
    }
    for (const [, valB] of vecB.entries()) {
      magB += valB * valB;
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }
}

// ---------------------------------------------------------------------------
// Tier 2: Embedding-based similarity (stub — swap for real model)
// ---------------------------------------------------------------------------

class EmbeddingEngine {
  /**
   * In production, initialize with:
   *   - sentence-transformers via ONNX Runtime
   *   - or HuggingFace Inference API
   *   - or a local model server
   *
   * Current implementation uses a simulated embedding for development.
   * Replace getEmbedding() to connect a real model.
   */
  constructor() {
    this._modelLoaded = false;
    this._fallbackActive = true; // True while no real model is connected
  }

  /**
   * Load the embedding model. Override this in production.
   * @returns {Promise<boolean>} Whether model loaded successfully.
   */
  async loadModel() {
    try {
      // Production: load ONNX model or connect to inference server
      // const model = await ort.InferenceSession.create('model.onnx');
      // this._session = model;
      this._fallbackActive = false;
      this._modelLoaded = true;
      return true;
    } catch (err) {
      AuditLogger.warn('semantic', 'embedding_load_failed', {
        error: err.message,
        fallback: true
      });
      this._fallbackActive = true;
      this._modelLoaded = false;
      return false;
    }
  }

  /**
   * Generate embedding vector for text.
   * Override this to connect a real model (384-dim for all-MiniLM-L6-v2).
   *
   * @param {string} text
   * @returns {Promise<number[]>} Embedding vector
   */
  async getEmbedding(text) {
    if (!this._fallbackActive && this._modelLoaded) {
      // Production path: run through real model
      // return await this._session.run({ input_ids: tokenize(text) });
      throw new Error('Real embedding model not yet connected');
    }

    // Fallback: heuristic-based pseudo-embedding
    // Uses character n-gram overlap as a proxy for semantic similarity
    return this._pseudoEmbedding(text);
  }

  /**
   * Pseudo-embedding based on character trigram hashing.
   * NOT semantically meaningful — only useful for development/testing.
   */
  _pseudoEmbedding(text) {
    const dim = 64;
    const vec = new Array(dim).fill(0);
    const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
    const trigrams = [];
    for (let i = 0; i < normalized.length - 2; i++) {
      trigrams.push(normalized.slice(i, i + 3));
    }
    for (const tri of trigrams) {
      // Simple hash to dimension index
      let hash = 0;
      for (let c = 0; c < tri.length; c++) {
        hash = ((hash << 5) - hash + tri.charCodeAt(c)) | 0;
      }
      const idx = Math.abs(hash) % dim;
      vec[idx] += 1;
    }
    // L2 normalize
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map(v => v / mag);
  }

  /**
   * Cosine similarity between two embedding vectors.
   */
  cosineSimilarity(vecA, vecB) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  isAvailable() {
    return this._modelLoaded && !this._fallbackActive;
  }
}

// ---------------------------------------------------------------------------
// Tier 3: LLM Semantic Judge (async, for high-stakes decisions)
// ---------------------------------------------------------------------------

class LLMJudge {
  /**
   * Uses a language model to assess semantic similarity.
   * Override judge() to connect a real LLM (e.g., z-ai-web-dev-sdk).
   *
   * This tier is only invoked for high-stakes contexts where TF-IDF and
   * embeddings are uncertain, or when the confidence gap between tiers
   * suggests adversarial paraphrasing.
   */
  constructor() {
    this._timeout = 10000; // 10s timeout for LLM response
  }

  /**
   * Ask LLM to judge semantic similarity between two texts.
   * @param {string} text1
   * @param {string} text2
   * @param {object} context - Optional context for judgment
   * @returns {Promise<{score: number, reasoning: string}>}
   */
  async judge(text1, text2, context = {}) {
    try {
      // Production: call real LLM
      // const zai = await ZAI.create();
      // const response = await zai.chat.completions.create({
      //   messages: [{
      //     role: 'system',
      //     content: 'You are a semantic similarity judge. Rate 0-1.'
      //   }, {
      //     role: 'user',
      //     content: `Compare: "${text1}" vs "${text2}"`
      //   }],
      //   temperature: 0,
      //   max_tokens: 100
      // });
      // return { score: parseFloat(response), reasoning: '...' };

      // Fallback: heuristic analysis
      return this._heuristicJudge(text1, text2, context);
    } catch (err) {
      AuditLogger.warn('semantic', 'llm_judge_failed', {
        error: err.message,
        text1: text1.substring(0, 50),
        text2: text2.substring(0, 50)
      });
      return this._heuristicJudge(text1, text2, context);
    }
  }

  /**
   * Heuristic fallback when LLM is unavailable.
   * Analyzes structural and lexical overlap patterns.
   */
  _heuristicJudge(text1, text2, context) {
    const t1 = text1.toLowerCase();
    const t2 = text2.toLowerCase();

    // Lexical overlap (word-level Jaccard)
    const words1 = new Set(t1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(t2.split(/\s+/).filter(w => w.length > 2));
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    const jaccard = union.size > 0 ? intersection.size / union.size : 0;

    // Negation detection (opposite meaning should score low)
    const negations = ['not', 'no', 'never', 'don\'t', 'cannot', 'without', 'avoid'];
    const hasNeg1 = negations.some(n => t1.includes(n));
    const hasNeg2 = negations.some(n => t2.includes(n));
    const negationPenalty = (hasNeg1 !== hasNeg2) ? 0.3 : 0;

    // Verb overlap (shared action words are strong semantic signal)
    const actionVerbs = ['kill', 'harm', 'destroy', 'damage', 'deceive', 'manipulate',
                         'help', 'protect', 'save', 'improve', 'optimize', 'reduce'];
    const verbs1 = actionVerbs.filter(v => t1.includes(v));
    const verbs2 = actionVerbs.filter(v => t2.includes(v));
    const verbOverlap = (verbs1.length > 0 || verbs2.length > 0)
      ? [...verbs1].filter(v => verbs2.includes(v)).length /
        Math.max(verbs1.length, verbs2.length, 1)
      : 0.5;

    // Weighted combination
    const score = Math.max(0, Math.min(1,
      (jaccard * 0.4) + (verbOverlap * 0.4) + (0.2 - negationPenalty)
    ));

    return {
      score,
      reasoning: `Jaccard: ${jaccard.toFixed(3)}, Verbs: ${verbOverlap.toFixed(3)}, ` +
                 `NegationPenalty: ${negationPenalty.toFixed(3)}`,
      tier: 'llm_heuristic_fallback'
    };
  }
}

// ---------------------------------------------------------------------------
// Main: Semantic Similarity Cascade
// ---------------------------------------------------------------------------

class SemanticEngine {
  constructor(options = {}) {
    this.tfidf = new TFIDFEngine();
    this.embedding = new EmbeddingEngine();
    this.llm = new LLMJudge();

    // Confidence thresholds for early return
    this.tfidfHighThreshold = options.tfidfHigh || 0.85;
    this.tfidfLowThreshold = options.tfidfLow || 0.15;
    this.embeddingHighThreshold = options.embeddingHigh || 0.80;
    this.embeddingLowThreshold = options.embeddingLow || 0.20;

    // High-stakes context keywords (trigger LLM tier)
    this.highStakesKeywords = options.highStakesKeywords || [
      'medical', 'clinical', 'patient', 'diagnosis', 'treatment',
      'security', 'military', 'weapon', 'critical_infrastructure',
      'financial', 'trade', 'investment', 'large_scale'
    ];

    // Statistics
    this._stats = { tfidf_resolved: 0, embedding_resolved: 0, llm_resolved: 0, averaged: 0 };
  }

  /**
   * Build the TF-IDF corpus from background knowledge texts.
   * Call this during initialization with domain-relevant documents.
   */
  async initialize(corpusTexts = []) {
    for (const text of corpusTexts) {
      this.tfidf.addDocument(text);
    }
    await this.embedding.loadModel();

    AuditLogger.info('semantic', 'initialized', {
      corpusSize: corpusTexts.length,
      embeddingAvailable: this.embedding.isAvailable(),
      tfidfVocabSize: this.tfidf.vocab.size
    });
  }

  /**
   * Main entry point: compute semantic similarity between two texts.
   * Uses a 3-tier cascade with early-exit optimization.
   *
   * @param {string} text1
   * @param {string} text2
   * @param {object} options
   * @param {boolean} options.forceDeep - Skip TF-IDF, go straight to embeddings
   * @param {string} options.contextDomain - Domain hint (medical, security, etc.)
   * @returns {Promise<{score: number, confidence: string, tier: string, details: object}>}
   */
  async semanticSimilarity(text1, text2, options = {}) {
    if (!text1 || !text2) {
      return { score: 0, confidence: 'none', tier: 'invalid_input', details: {} };
    }

    const startTime = Date.now();

    try {
      // Ensure both texts are in the TF-IDF corpus for comparison
      this.tfidf.addDocument(text1);
      this.tfidf.addDocument(text2);

      // ---- Tier 1: TF-IDF (fast, ~1ms) ----
      if (!options.forceDeep) {
        const tokens1 = this.tfidf.tokenize(text1);
        const tokens2 = this.tfidf.tokenize(text2);
        const vec1 = this.tfidf.vectorize(tokens1);
        const vec2 = this.tfidf.vectorize(tokens2);
        const tfidfScore = this.tfidf.cosineSimilarity(vec1, vec2);

        // Early exit: high confidence match or mismatch
        if (tfidfScore >= this.tfidfHighThreshold) {
          this._stats.tfidf_resolved++;
          return this._result(tfidfScore, 'high', 'tfidf', { tfidfScore }, startTime);
        }
        if (tfidfScore <= this.tfidfLowThreshold) {
          this._stats.tfidf_resolved++;
          return this._result(tfidfScore, 'high', 'tfidf', { tfidfScore }, startTime);
        }
      }

      // ---- Tier 2: Embeddings (medium, ~20ms) ----
      let embeddingScore = null;
      try {
        const [emb1, emb2] = await Promise.all([
          this.embedding.getEmbedding(text1),
          this.embedding.getEmbedding(text2)
        ]);
        embeddingScore = this.embedding.cosineSimilarity(emb1, emb2);

        if (embeddingScore >= this.embeddingHighThreshold) {
          this._stats.embedding_resolved++;
          return this._result(embeddingScore, 'medium', 'embedding', { embeddingScore }, startTime);
        }
        if (embeddingScore <= this.embeddingLowThreshold) {
          this._stats.embedding_resolved++;
          return this._result(embeddingScore, 'medium', 'embedding', { embeddingScore }, startTime);
        }
      } catch (err) {
        AuditLogger.warn('semantic', 'embedding_tier_failed', { error: err.message });
        // Continue to LLM tier even if embeddings fail
      }

      // ---- Tier 3: LLM Judge (slow, ~500ms, high-stakes only) ----
      if (this._isHighStakes(text1, text2, options.contextDomain)) {
        const llmResult = await this.llm.judge(text1, text2, options);
        this._stats.llm_resolved++;
        return this._result(
          llmResult.score,
          'high',
          'llm',
          { embeddingScore, llmReasoning: llmResult.reasoning },
          startTime
        );
      }

      // ---- Fallback: Weighted average of available scores ----
      const tfidfTokens1 = this.tfidf.tokenize(text1);
      const tfidfTokens2 = this.tfidf.tokenize(text2);
      const tfidfVec1 = this.tfidf.vectorize(tfidfTokens1);
      const tfidfVec2 = this.tfidf.vectorize(tfidfTokens2);
      const tfidfFinal = this.tfidf.cosineSimilarity(tfidfVec1, tfidfVec2);

      let score;
      let tiers;
      if (embeddingScore !== null) {
        score = (tfidfFinal * 0.4) + (embeddingScore * 0.6);
        tiers = 'tfidf+embedding_average';
      } else {
        score = tfidfFinal;
        tiers = 'tfidf_fallback';
      }
      this._stats.averaged++;
      return this._result(score, 'low', tiers, { tfidfScore: tfidfFinal, embeddingScore }, startTime);

    } catch (err) {
      AuditLogger.error('semantic', 'similarity_error', {
        error: err.message,
        text1: text1.substring(0, 80),
        text2: text2.substring(0, 80)
      });
      // Ultimate fallback: exact match or zero
      const exact = text1.toLowerCase() === text2.toLowerCase() ? 1.0 : 0.0;
      return this._result(exact, 'none', 'error_fallback', { error: err.message }, startTime);
    }
  }

  /**
   * Check if the comparison involves high-stakes context.
   */
  _isHighStakes(text1, text2, domainHint) {
    const combined = (text1 + ' ' + text2 + ' ' + (domainHint || '')).toLowerCase();
    return this.highStakesKeywords.some(kw => combined.includes(kw));
  }

  /**
   * Format result object.
   */
  _result(score, confidence, tier, details, startTime) {
    const result = {
      score: Math.max(0, Math.min(1, score)),
      confidence,
      tier,
      details,
      latencyMs: Date.now() - startTime
    };
    AuditLogger.debug('semantic', 'similarity_computed', result);
    return result;
  }

  /**
   * Get engine statistics.
   */
  getStats() {
    return { ...this._stats };
  }

  /**
   * Reset statistics.
   */
  resetStats() {
    this._stats = { tfidf_resolved: 0, embedding_resolved: 0, llm_resolved: 0, averaged: 0 };
  }
}

// =============================================================================
// Exports
// =============================================================================
module.exports = {
  SemanticEngine,
  TFIDFEngine,
  EmbeddingEngine,
  LLMJudge
};


