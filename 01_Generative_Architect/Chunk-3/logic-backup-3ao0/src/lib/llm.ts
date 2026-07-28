import { GoogleGenAI } from "@google/genai";

export type LLMMode = 'local' | 'cloud';

export interface LLMConfig {
  geminiKey?: string;
  cerebrasKey?: string;
  grokKey?: string;
}

export class LLMEngine {
  private engine: any | null = null;
  public modelId: string = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
  public mode: LLMMode = 'cloud'; // Default to cloud for better compatibility
  public config: LLMConfig = {};

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
      this.engine = await webllm.CreateMLCEngine(this.modelId, {
        initProgressCallback: (report) => {
          if (onProgress) {
            onProgress(report.progress * 100);
          }
          console.log(report.text);
        },
        chatConfig: {
          context_window_size: 1024,
        }
      });
    } catch (e: any) {
      this.engine = null;
      throw new Error(`Model loading failed: ${e.message}. This usually happens when your device runs out of memory (RAM) or lacks WebGPU support. Try switching to 'Cloud Mode' in settings.`);
    }
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
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

  private async generateWithFallback(prompt: string, systemPrompt?: string): Promise<string> {
    const errors: string[] = [];

    // 1. Gemini (Primary)
    try {
      return await this.generateGemini(prompt, systemPrompt);
    } catch (e: any) {
      console.warn("Gemini Failed, falling back to Cerebras...", e.message);
      errors.push(`Gemini: ${e.message}`);
    }

    // 2. Cerebras (Secondary)
    if (this.config.cerebrasKey) {
      try {
        return await this.generateCerebras(prompt, systemPrompt);
      } catch (e: any) {
        console.warn("Cerebras Failed, falling back to Grok...", e.message);
        errors.push(`Cerebras: ${e.message}`);
      }
    } else {
      errors.push("Cerebras: No API Key provided.");
    }

    // 3. Grok (Tertiary)
    if (this.config.grokKey) {
      try {
        return await this.generateGrok(prompt, systemPrompt);
      } catch (e: any) {
        errors.push(`Grok: ${e.message}`);
      }
    } else {
      errors.push("Grok: No API Key provided.");
    }

    throw new Error(`All Brain Engines exhausted. System Pause required.\nErrors: ${errors.join(' | ')}`);
  }

  private async generateGemini(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = this.config.geminiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API Key not found.");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return response.text || "";
  }

  private async generateCerebras(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.cerebrasKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.1-70b',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || response.statusText);
    }

    const data = await response.json();
    return data.choices[0].message.content || "";
  }

  private async generateGrok(prompt: string, systemPrompt?: string): Promise<string> {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.grokKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || response.statusText);
    }

    const data = await response.json();
    return data.choices[0].message.content || "";
  }
}

export const llmEngine = new LLMEngine();
