import { GoogleGenAI } from "@google/genai";

export type LLMMode = 'local' | 'cloud';

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

export class LLMEngine {
  private engine: any | null = null;
  public modelId: string = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC";
  public highCapabilityModelId: string = "Phi-3-mini-4k-instruct-q4f16_1-MLC";
  public mobileModelId: string = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
  public mode: LLMMode = 'cloud'; 
  public useHighCapability: boolean = false;
  public useCompatibilityMode: boolean = false;
  public useUltraCompatibility: boolean = false;
  public useCloudGPU: boolean = false;
  public config: LLMConfig = {};
  public userId?: string;
  public db?: any;
  public onLog?: (msg: string, type: 'info' | 'warn' | 'error' | 'success') => void;
  public onTaskStatus?: (task: any) => void;

  private addLog(msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') {
    if (this.onLog) this.onLog(msg, type);
    console.log(`[LLM] ${type.toUpperCase()}: ${msg}`);
  }

  public async testEngine(engine: 'gemini' | 'cerebras' | 'grok' | 'anthropic'): Promise<TestResult> {
    const start = Date.now();
    try {
      let res = "";
      let model = "";
      if (engine === 'gemini') {
        res = await this.generateGemini("Hello, respond with 'ONLINE'", "System test");
        model = "gemini-3-flash-preview";
      } else if (engine === 'cerebras') {
        res = await this.generateCerebras("Hello, respond with 'ONLINE'", "System test");
        model = "llama3.1-70b/8b";
      } else if (engine === 'grok') {
        res = await this.generateGrok("Hello, respond with 'ONLINE'", "System test");
        model = "grok-beta";
      } else if (engine === 'anthropic') {
        res = await this.generateAnthropic("Hello, respond with 'ONLINE'", "System test");
        model = "claude-3-5-sonnet-latest";
      }

      const latency = Date.now() - start;
      if (res.includes("ONLINE")) {
        return {
          success: true,
          message: "Connection established.",
          latency,
          model
        };
      } else {
        return {
          success: false,
          message: `Unexpected response: ${res.substring(0, 50)}...`,
          latency,
          model
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: e.message || "Unknown error",
        latency: Date.now() - start
      };
    }
  }

  async init(onProgress?: (progress: number) => void) {
    if (this.mode === 'cloud') return; // Gemini doesn't need local init
    if (this.engine) return;

    // Dynamic import to reduce initial memory footprint
    let webllm;
    try {
      webllm = await import("@mlc-ai/web-llm");
    } catch (e: any) {
      throw new Error(`Failed to load AI libraries: ${e.message}. Ensure you have a stable internet connection.`);
    }

    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Select target model based on user preference and device
      let targetModel = this.modelId;
      if (this.useUltraCompatibility) {
        targetModel = this.mobileModelId; // Qwen2-0.5B
      } else if (this.useCompatibilityMode) {
        targetModel = "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC";
      } else if (this.useHighCapability) {
        targetModel = this.highCapabilityModelId;
      }
      
      this.addLog(`Initializing Brain Engine: ${targetModel}...`, "info");
      
      try {
        this.engine = await webllm.CreateMLCEngine(targetModel, {
          initProgressCallback: (report) => {
            if (onProgress) onProgress(report.progress * 100);
            console.log(report.text);
          },
          chatConfig: {
            context_window_size: this.useUltraCompatibility ? 256 : (isMobile || this.useCompatibilityMode) ? 384 : 1024,
          }
        });
      } catch (innerError: any) {
        // If the selected model fails and we aren't already in Ultra-Compat, try one last time with the smallest model
        if (!this.useUltraCompatibility) {
          this.addLog(`Primary model failed. Attempting emergency fallback to Ultra-Compatibility Mode...`, "warn");
          this.useUltraCompatibility = true;
          return this.init(onProgress);
        }
        throw innerError;
      }
    } catch (e: any) {
      this.engine = null;
      const isWebGPUError = e.message.includes('VK_ERROR') || e.message.includes('WebGPU') || e.message.includes('ComputePipeline');
      
      let errorMsg = `Model loading failed: ${e.message}. `;
      if (isWebGPUError) {
        errorMsg += "This appears to be a GPU driver or memory issue. Try enabling 'Ultra Compatibility Mode' or 'Clear Model Cache' in settings.";
      } else {
        errorMsg += "This usually happens when your device runs out of memory (RAM) or lacks WebGPU support.";
      }
      
      throw new Error(errorMsg);
    }
  }

  async clearCache() {
    try {
      const databases = await window.indexedDB.databases();
      for (const db of databases) {
        if (db.name && (db.name.includes('next-web-llm') || db.name.includes('mlc-chat'))) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
      this.addLog("Model cache cleared successfully.", "success");
    } catch (e: any) {
      this.addLog(`Failed to clear cache: ${e.message}`, "error");
    }
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    if (this.useCloudGPU) {
      return this.generateWithCloudGPU(prompt, systemPrompt);
    }

    if (this.mode === 'cloud') {
      return this.generateWithFallback(prompt, systemPrompt);
    }

    if (!this.engine) throw new Error("Local LLM Engine not initialized. Try switching to 'Cloud Mode'.");

    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const reply = await this.engine.chat.completions.create({
      messages,
    });

    return reply.choices[0].message.content || "";
  }

  private async generateWithProxy(provider: string, prompt: string, systemPrompt?: string, model?: string, apiKey?: string): Promise<string> {
    try {
      const response = await fetch("/api/gpu/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          systemPrompt,
          provider,
          apiKey,
          model
        })
      });
      
      if (!response.ok) {
        let errorMsg = `${provider} request failed.`;
        try {
          const error = await response.json();
          errorMsg = error.error || errorMsg;
        } catch (e) {
          // If not JSON, try to get text
          try {
            const text = await response.text();
            if (text) errorMsg = text;
          } catch (e2) {}
        }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      return data.result;
    } catch (err: any) {
      if (err.message.includes(provider)) throw err;
      throw new Error(`${provider} Proxy Error: ${err.message}`);
    }
  }

  private async generateAnthropic(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.config.anthropicKey) throw new Error("Anthropic API Key not configured.");
    return this.generateWithProxy("anthropic", prompt, systemPrompt, "claude-3-5-sonnet-latest", this.config.anthropicKey);
  }

  private async generateWithCloudGPU(prompt: string, systemPrompt?: string): Promise<string> {
    this.addLog(`Offloading task to Cloud GPU (${this.config.gpuProvider || 'anthropic'})...`, "info");
    
    let taskId: string | null = null;
    if (this.db && this.userId) {
      try {
        // Dynamic import to avoid circular dependency or if firestore is not available
        const { collection, addDoc } = await import("firebase/firestore");
        const { handleFirestoreError, OperationType } = await import("./firebase");
        
        const docRef = await addDoc(collection(this.db, "gpu_tasks"), {
          userId: this.userId,
          model: this.config.gpuModel || "claude-3-5-sonnet-latest",
          provider: this.config.gpuProvider || "anthropic",
          prompt: prompt.substring(0, 1000), // Limit prompt size in metadata
          status: "pending",
          timestamp: Date.now()
        }).catch(e => {
          handleFirestoreError(e, OperationType.CREATE, "gpu_tasks");
          return null;
        });
        
        if (docRef) {
          taskId = docRef.id;
          if (this.onTaskStatus) this.onTaskStatus({ id: taskId, status: 'pending' });
        }
      } catch (e) {
        console.error("[LLM] Failed to create GPU task in Firestore:", e);
      }
    }

    try {
      const result = await this.generateWithProxy(
        this.config.gpuProvider || "anthropic",
        prompt,
        systemPrompt,
        this.config.gpuModel || "claude-3-5-sonnet-latest",
        this.config.gpuKey
      );
      
      this.addLog("Cloud GPU task complete.", "success");
      return result;
    } catch (e: any) {
      this.addLog(`Cloud GPU error: ${e.message}. Falling back to local/cloud.`, "warn");
      // Fallback logic
      if (this.mode === 'cloud') {
        return this.generateWithFallback(prompt, systemPrompt);
      }
      throw e;
    }
  }

  private async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (e: any) {
      const msg = e.message?.toLowerCase() || "";
      const isQuotaExhausted = msg.includes('quota') || msg.includes('exhausted') || msg.includes('billing');
      const isRateLimit = msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests');
      const isModelNotFound = msg.includes('404') || msg.includes('model not found') || msg.includes('does not exist');

      // If it's a hard quota exhaustion or model not found, don't bother retrying, just fail so we can fall back
      if (isQuotaExhausted || isModelNotFound) {
        console.warn(`Hard Failure (${isQuotaExhausted ? 'Quota' : 'Model Not Found'}). Skipping retries for this engine.`);
        throw e;
      }

      if (retries > 0 && isRateLimit) {
        console.log(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, delay * 2);
      }
      throw e;
    }
  }

  private async generateWithFallback(prompt: string, systemPrompt?: string): Promise<string> {
    const errors: string[] = [];

    // 1. Gemini (Primary)
    try {
      this.addLog("Attempting Gemini (Primary)...", "info");
      return await this.retry(() => this.generateGemini(prompt, systemPrompt));
    } catch (e: any) {
      console.warn("Gemini Failed, falling back to Cerebras...", e.message);
      this.addLog(`Gemini Failed: ${e.message}. Trying Cerebras...`, "warn");
      errors.push(`Gemini: ${e.message}`);
    }

    // 2. Cerebras (Secondary)
    const cKey = this.config.cerebrasKey?.trim();
    if (cKey && cKey !== "") {
      try {
        this.addLog("Attempting Cerebras (Secondary)...", "info");
        return await this.retry(() => this.generateCerebras(prompt, systemPrompt));
      } catch (e: any) {
        console.warn("Cerebras Failed, falling back to Grok...", e.message);
        this.addLog(`Cerebras Failed: ${e.message}. Trying Grok...`, "warn");
        errors.push(`Cerebras: ${e.message}`);
      }
    } else {
      this.addLog("Cerebras skipped: No API Key configured.", "warn");
      errors.push("Cerebras: No API Key.");
    }

    // 3. Grok (Tertiary)
    const gKey = this.config.grokKey?.trim();
    if (gKey && gKey !== "") {
      try {
        this.addLog("Attempting Grok (Tertiary)...", "info");
        return await this.retry(() => this.generateGrok(prompt, systemPrompt));
      } catch (e: any) {
        console.warn("Grok Failed.", e.message);
        this.addLog(`Grok Failed: ${e.message}`, "error");
        errors.push(`Grok: ${e.message}`);
      }
    } else {
      this.addLog("Grok skipped: No API Key configured.", "warn");
      errors.push("Grok: No API Key.");
    }

    // If we reach here, all engines failed.
    throw new Error(`All Brain Engines exhausted. System Pause required. Details: ${errors.join(' | ')}`);
  }

  public async generateImage(prompt: string): Promise<string> {
    const apiKey = this.config.geminiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API Key not found for image generation.");

    // Image generation still uses the SDK for now as it's a bit more complex to proxy
    // but we'll try to use the proxy if possible or just rely on the API key being correct.
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No image generated.");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
      throw new Error("No image data found in response.");
    } catch (e: any) {
      console.error("Image Generation Error:", e);
      throw e;
    }
  }

  public async generateGemini(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = this.config.geminiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API Key not found.");
    return this.generateWithProxy("gemini", prompt, systemPrompt, "gemini-3-flash-preview", apiKey);
  }

  public async generateCerebras(prompt: string, systemPrompt?: string): Promise<string> {
    const cKey = this.config.cerebrasKey?.trim();
    if (!cKey) throw new Error("Cerebras API Key not found.");
    return this.generateWithProxy("cerebras", prompt, systemPrompt, "llama3.1-70b", cKey);
  }

  public async generateGrok(prompt: string, systemPrompt?: string): Promise<string> {
    const gKey = this.config.grokKey?.trim();
    if (!gKey) throw new Error("Grok API Key not found.");
    return this.generateWithProxy("grok", prompt, systemPrompt, "grok-beta", gKey);
  }
}

export const llmEngine = new LLMEngine();
