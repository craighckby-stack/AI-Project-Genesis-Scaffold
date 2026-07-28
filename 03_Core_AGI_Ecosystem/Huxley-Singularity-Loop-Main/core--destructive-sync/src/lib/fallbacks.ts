
import { Chunk } from './gemini';

interface FallbackConfig {
  anthropicKey?: string;
  cerebrasKey?: string;
  grokKey?: string;
}

export const callFallbackAI = async (prompt: string, config: FallbackConfig): Promise<Chunk[]> => {
  // Try Anthropic First
  if (config.anthropicKey) {
    try {
      console.log("[Fallback] Attempting Anthropic...");
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.anthropicKey,
          'anthropic-version': '2023-06-01',
          'dangerouslyAllowBrowser': 'true' // In prototype mode
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt + "\n\nRESPONSE MUST BE A JSON ARRAY OF CHUNKS. NO EXPLANATION." }]
        })
      });
      const data = await response.json();
      const text = data.content[0].text;
      return parseAIResponse(text);
    } catch (e) {
      console.error("[Fallback] Anthropic failed:", e);
    }
  }

  // Try Cerebras Second
  if (config.cerebrasKey) {
    try {
      console.log("[Fallback] Attempting Cerebras...");
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.cerebrasKey}`
        },
        body: JSON.stringify({
          model: 'llama3.1-70b',
          messages: [{ role: 'user', content: prompt + "\n\nRESPONSE MUST BE A JSON ARRAY. RETURN ONLY JSON." }]
        })
      });
      const data = await response.json();
      const text = data.choices[0].message.content;
      return parseAIResponse(text);
    } catch (e) {
      console.error("[Fallback] Cerebras failed:", e);
    }
  }

  // Try Grok Third
  if (config.grokKey) {
    try {
      console.log("[Fallback] Attempting Grok...");
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.grokKey}`
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [{ role: 'user', content: prompt + "\n\nRESPONSE MUST BE A JSON ARRAY. RETURN ONLY JSON." }]
        })
      });
      const data = await response.json();
      const text = data.choices[0].message.content;
      return parseAIResponse(text);
    } catch (e) {
      console.error("[Fallback] Grok failed:", e);
    }
  }

  throw new Error("ALL_MODELS_EXHAUSTED: Gemini failed and no fallbacks succeeded or were configured.");
};

const parseAIResponse = (text: string): Chunk[] => {
  try {
    // Basic cleaning to find JSON array
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse fallback AI response:", text);
    return [];
  }
};
