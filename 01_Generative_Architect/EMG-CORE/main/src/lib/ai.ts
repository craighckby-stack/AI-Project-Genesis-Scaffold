import { CoreIdentity, PrincipleNote, AgentAction } from "../types";

/**
 * Substrate Configuration Registry
 * Siphoned from DARLEK_CAAN_ENGINE and unitary-core architectural patterns.
 */
const SUBSTRATE_CONFIG = {
  DEFAULT_MODEL: "gemini-3.5-flash",
  MAX_RETRIES: 3,
  TIMEOUT_MS: 45000,
  BACKOFF_BASE: 1000,
  DECAY_RATE: 0.95,
  MS_PER_DAY: 86400000
};

export class SubstrateClient {
  private static async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let i = 0; i < SUBSTRATE_CONFIG.MAX_RETRIES; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        await new Promise(r => setTimeout(r, SUBSTRATE_CONFIG.BACKOFF_BASE * Math.pow(2, i)));
      }
    }
    throw lastError;
  }

  public static async call(params: { 
    systemPrompt: string; 
    userPrompt: string; 
    jsonMode?: boolean; 
    temperature?: number 
  }): Promise<string> {
    return this.executeWithRetry(async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), SUBSTRATE_CONFIG.TIMEOUT_MS);

      try {
        const response = await fetch("/api/ai/gemini", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: SUBSTRATE_CONFIG.DEFAULT_MODEL,
            contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
            config: {
              systemInstruction: params.systemPrompt,
              temperature: params.temperature ?? 0.5,
              responseMimeType: params.jsonMode ? "application/json" : "text/plain"
            }
          }),
          signal: controller.signal
        });

        if (!response.ok) throw new Error(`SUBSTRATE_HTTP_${response.status}`);
        const data = await response.json();
        return data.text || "";
      } finally {
        clearTimeout(id);
      }
    });
  }
}

export async function contextualPrincipleCheck(userQuery: string, identity: CoreIdentity): Promise<PrincipleNote[]> {
  const prompt = `Analyze query: "${userQuery}" against principles: ${identity.principles.join(', ')}. Return JSON array: [{ "principle": string, "confidence": number, "rationale": string }]`;
  try {
    const raw = await SubstrateClient.call({ systemPrompt: identity.substrateInstruction, userPrompt: prompt, jsonMode: true });
    return JSON.parse(raw) as PrincipleNote[];
  } catch (e) { 
    console.error("Principle Check Failure:", e);
    return [{ principle: "System-Inhibited", confidence: 0, rationale: "Substrate unreachable or malformed response." }]; 
  }
}

export async function generateGroundedResponse(userQuery: string, principleNotes: PrincipleNote[], identity: CoreIdentity): Promise<string> {
  const prompt = `EMG Core v5.0. Intent: "${userQuery}". Pillars: ${JSON.stringify(principleNotes)}. Task: Generate response. If agency is required, output JSON block { "action": string, "payload": any }.`;
  return await SubstrateClient.call({ systemPrompt: identity.substrateInstruction, userPrompt: prompt });
}

export function applyAtrophyProtocol(identity: CoreIdentity): CoreIdentity {
  const now = Date.now();
  const threshold = identity.params?.atrophyThreshold ?? 0.05;
  
  const prune = (items: any[]) => items
    .map(i => ({
      ...i,
      utilityScore: (i.utilityScore || 0.5) * Math.pow(SUBSTRATE_CONFIG.DECAY_RATE, (now - new Date(i.timestamp).getTime()) / SUBSTRATE_CONFIG.MS_PER_DAY)
    }))
    .filter(i => i.utilityScore > threshold);

  return {
    ...identity,
    learningLog: prune(identity.learningLog || []),
    mutationRegistry: prune(identity.mutationRegistry || [])
  };
}