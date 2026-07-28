import { llmEngine } from './llm';

/**
 * 🛠️ DALEK SOVEREIGN SPLICER - ENGINE MANAGER
 * Optimized for maximum throughput, low-allocation execution, and circuit-breaking.
 */

type Provider = 'gemini' | 'cerebras' | 'grok' | 'anthropic';

interface GenerateResult {
  result: string;
  metadata: {
    provider: Provider;
    latency: number;
    attempts: number;
  };
}

export class EngineManager {
  static readonly #THRESHOLD = 3;
  static readonly #RESET_MS = 60_000;
  
  readonly #failures = new Map<Provider, { count: number; last: number }>();
  readonly #providers: readonly Provider[] = ['gemini', 'cerebras', 'grok', 'anthropic'];

  // Static mapping to avoid runtime overhead and closure allocations
  readonly #engineMap: Record<Provider, (p: string, s?: string) => Promise<string>> = {
    gemini: (p, s) => llmEngine.generateGemini(p, s),
    cerebras: (p, s) => llmEngine.generateCerebras(p, s),
    grok: (p, s) => llmEngine.generateGrok(p, s),
    anthropic: (p, s) => llmEngine.generateAnthropic(p, s),
  };

  /**
   * Orchestrates LLM execution with high-performance failover logic.
   * Priority is determined by provider health metrics.
   */
  public async generate(prompt: string, systemPrompt?: string): Promise<GenerateResult> {
    const now = performance.now();
    let attempts = 0;

    // ELITE ROUTING: Only sort if failures exist to minimize CPU cycles
    const sequence = this.#failures.size === 0 
      ? this.#providers 
      : [...this.#providers].sort((a, b) => (this.#failures.get(a)?.count ?? 0) - (this.#failures.get(b)?.count ?? 0));

    for (const provider of sequence) {
      const record = this.#failures.get(provider);
      
      // CIRCUIT BREAKER EVALUATION
      if (record && record.count >= EngineManager.#THRESHOLD) {
        if (now - record.last < EngineManager.#RESET_MS) continue;
        this.#failures.delete(provider); // Reset if cooldown expired
      }

      attempts++;
      const startTime = performance.now();

      try {
        const result = await this.#engineMap[provider](prompt, systemPrompt);
        
        // SUCCESS: Clear failure record for this node
        if (record) this.#failures.delete(provider);

        return {
          result,
          metadata: {
            provider,
            latency: performance.now() - startTime,
            attempts,
          },
        };
      } catch (err) {
        // RECORD FAILURE
        const f = this.#failures.get(provider) ?? { count: 0, last: 0 };
        f.count++;
        f.last = performance.now();
        this.#failures.set(provider, f);
        
        // Log locally if necessary, otherwise proceed to next provider
        console.warn(`[SPLICER] Provider ${provider} failure: ${err instanceof Error ? err.message : 'UNKNOWN_ERROR'}`);
      }
    }

    throw new Error('EXTERMINATE: ALL_PROVIDERS_EXHAUSTED_OR_CIRCUIT_OPEN');
  }
}

// Singleton export for global engine management
const engineManager = new EngineManager();
export default engineManager;