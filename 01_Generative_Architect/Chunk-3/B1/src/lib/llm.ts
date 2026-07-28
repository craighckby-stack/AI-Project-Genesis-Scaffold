import { google } from 'googleapis';
import { handleFirestoreError } from './firebase';

/**
 * @file llm.ts
 * @description 🌌 ELITE NEURAL SPLICING ENGINE - DALEK SOVEREIGN EDITION
 * Optimized for React 19 / Vite / Web-LLM Performance.
 */

export enum LLMMode {
  LOCAL = 'local',
  CLOUD = 'cloud',
}

export interface LLMConfig {
  geminiKey?: string;
  cerebrasKey?: string;
  grokKey?: string;
  anthropicKey?: string;
  gpuProvider?: 'deepseek' | 'runpod' | 'modal' | 'anthropic';
  gpuEndpoint?: string;
  gpuModel?: string;
  gpuKey?: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  latency?: number;
  model?: string;
}

type LogType = 'info' | 'warn' | 'error' | 'success';

const MODELS = Object.freeze({
  ULTRA: "Qwen2-0.5B-Instruct-q4f16_1-MLC",
  STABLE: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
  HIGH: "Phi-3-mini-4k-instruct-q4f16_1-MLC"
});

const MOBILE_UA_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export class LLMEngine {
  #engine: any = null;
  #useHighCapability = false;
  #useCompatibilityMode = false;
  #useUltraCompatibility = false;
  #useCloudGPU = false;

  constructor(
    private readonly config: LLMConfig = {},
    private readonly mode: LLMMode = LLMMode.CLOUD,
    private readonly onLog?: (type: LogType, msg: string) => void,
    private readonly onTaskStatus?: (task: { id: string; status: 'pending' | 'complete'; message: string }) => void,
    private readonly userId?: string,
    private readonly db?: any
  ) {}

  private get activeModelId(): string {
    if (this.#useUltraCompatibility) return MODELS.ULTRA;
    return this.#useHighCapability ? MODELS.HIGH : MODELS.STABLE;
  }

  async init(): Promise<void> {
    if (this.mode === LLMMode.CLOUD) return;

    const isMobile = MOBILE_UA_REGEX.test(navigator.userAgent);
    const targetModel = this.activeModelId;

    this.log(`Initializing Sovereign Brain Node: ${targetModel}...`, 'info');

    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      this.#engine = await CreateMLCEngine(targetModel, {
        initProgressCallback: (report) => {
          console.debug(`[DALEK-MLC] ${report.text}`);
        },
        chatConfig: {
          context_window_size: this.#useUltraCompatibility ? 256 : (isMobile || this.#useCompatibilityMode ? 384 : 1024),
        },
      });
    } catch (error) {
      if (!this.#useUltraCompatibility) {
        this.log('Primary node failure. Escalating to Ultra-Compatibility Mode...', 'warn');
        this.#useUltraCompatibility = true;
        return this.init();
      }
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const dbs = await indexedDB.databases();
      await Promise.all(
        dbs
          .filter(({ name }) => name?.match(/next-web-llm|mlc-chat/))
          .map(({ name }) => indexedDB.deleteDatabase(name!))
      );
      this.log('Neural cache purged. System sanitized.', 'success');
    } catch (e: any) {
      this.log(`Cache purge failed: ${e.message}`, 'error');
    }
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    if (this.#useCloudGPU) return this.generateWithCloudGPU(prompt, systemPrompt);
    if (this.mode === LLMMode.CLOUD) return this.generateWithFallback(prompt, systemPrompt);

    if (!this.#engine) {
      throw new Error('Sovereign Engine offline. Deploy Cloud Mode.');
    }

    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: prompt }
    ];

    const reply = await this.#engine.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: false,
    });

    const content = reply.choices[0]?.message?.content;
    if (!content) throw new Error('Void transmission: No neural content received.');
    
    return content;
  }

  private async generateWithCloudGPU(prompt: string, systemPrompt?: string): Promise<string> {
    const { gpuProvider: provider = 'anthropic', gpuModel: model = 'claude-3-5-sonnet-latest', gpuKey: apiKey } = this.config;
    
    this.log(`Offloading to High-Orbit GPU: ${provider}...`, 'info');

    if (this.db && this.userId) {
      try {
        const { collection, addDoc } = await import('firebase/firestore');
        const docRef = await addDoc(collection(this.db, 'gpu_tasks'), {
          userId: this.userId,
          model,
          provider,
          prompt: prompt.slice(0, 1000),
          status: 'pending',
          timestamp: Date.now(),
        });
        this.onTaskStatus?.({ id: docRef.id, status: 'pending', message: 'GPU Task Synchronized.' });
      } catch (e) {
        console.error('Metadata synchronization failed.', e);
      }
    }

    try {
      const result = await this.generateWithProxy(provider, prompt, systemPrompt, model, apiKey);
      this.log('Cloud GPU task terminated successfully.', 'success');
      return result;
    } catch (e: any) {
      this.log(`GPU Node failure: ${e.message}. Reverting to fallback chains...`, 'warn');
      return this.mode === LLMMode.CLOUD ? this.generateWithFallback(prompt, systemPrompt) : Promise.reject(e);
    }
  }

  private async generateWithFallback(prompt: string, systemPrompt?: string): Promise<string> {
    const errorStack: string[] = [];

    // Protocol 1: Gemini Prime
    try {
      this.log('Engaging Gemini Prime...', 'info');
      return await this.retry(() => this.generateGemini(prompt, systemPrompt));
    } catch (e: any) {
      errorStack.push(`Gemini: ${e.message}`);
      this.log(`Gemini Node Offline. Re-routing logic...`, 'warn');
    }

    const fallbackNodes = [
      { id: 'Cerebras', key: this.config.cerebrasKey, call: () => this.generateCerebras(prompt, systemPrompt) },
      { id: 'Grok', key: this.config.grokKey, call: () => this.generateGrok(prompt, systemPrompt) },
      { id: 'Anthropic', key: this.config.anthropicKey, call: () => this.generateAnthropic(prompt, systemPrompt) }
    ];

    for (const { id, key, call } of fallbackNodes) {
      if (!key?.trim()) continue;
      try {
        this.log(`Splicing into ${id} logic sub-routines...`, 'info');
        return await this.retry(call);
      } catch (e: any) {
        errorStack.push(`${id}: ${e.message}`);
        this.log(`${id} Logic Depleted.`, 'warn');
      }
    }

    throw new Error(`CRITICAL SYSTEM FAILURE: ALL NODES DEPLETED. [${errorStack.join(' || ')}]`);
  }

  private async generateGemini(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = this.config.geminiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API Key missing.');

    const ai = new (google as any).genai({
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}'),
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: '1:1' } },
    });

    const part = response.data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
    if (!part?.inlineData) throw new Error('Visual data extraction failed.');

    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
  }

  private log(msg: string, type: LogType = 'info'): void {
    this.onLog?.(type, msg);
    const color = type === 'error' ? 'red' : type === 'success' ? 'green' : type === 'warn' ? 'yellow' : 'cyan';
    console.log(`%c[LLM-SOVEREIGN] ${type.toUpperCase()}: ${msg}`, `color: ${color}; font-weight: bold;`);
  }

  private async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (e: any) {
      const isRetryable = /429|rate limit|quota|too many|404|not found/i.test(e.message || '');
      if (retries > 0 && isRetryable) {
        await new Promise(r => setTimeout(r, delay));
        return this.retry(fn, retries - 1, delay * 2);
      }
      throw e;
    }
  }

  private async generateWithProxy(provider: string, prompt: string, systemPrompt?: string, model?: string, apiKey?: string): Promise<string> {
    const response = await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, prompt, systemPrompt, model, apiKey })
    });
    if (!response.ok) throw new Error(`Proxy Node Communication Error: ${response.statusText}`);
    return response.json();
  }

  private async generateCerebras(p: string, s?: string) { return this.generateWithProxy('cerebras', p, s); }
  private async generateGrok(p: string, s?: string) { return this.generateWithProxy('grok', p, s); }
  private async generateAnthropic(p: string, s?: string) { return this.generateWithProxy('anthropic', p, s); }
}