
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Chunk {
  title: string;
  file: string;
  code: string;
  explanation: string;
  mutation: string;
  intentAlignmentScore: number; // 0.0 to 1.0
  philosophyCheck: string; // "Does this code still feel like a Rock that doesn't give a fuck?"
  ccrrScore: number; // Certainty-to-Risk-Ratio (0.0 - 10.0)
  suggestedBranchName: string; // e.g., "core/neural-codec"
  isCriticalUpgrade?: boolean; // Flag for Self-Reboot logic
}

import { callFallbackAI } from './fallbacks';

// Use import.meta.env for client-side keys in this prototype
const FALLBACK_CONFIG = {
  anthropicKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  cerebrasKey: import.meta.env.VITE_CEREBRAS_API_KEY,
  grokKey: import.meta.env.VITE_XAI_API_KEY,
};

export const analyzeRepoChunks = async (context: string, intentAnchor?: string, geneticMemory?: Chunk[], recursiveArchetype?: string): Promise<Chunk[]> => {
  const timeoutPromise = new Promise<null>((_, reject) => 
    setTimeout(() => reject(new Error("CIRCUIT_BREAKER_TRIP: AI request timed out (20s)")), 20000)
  );

  const memoryContext = geneticMemory && geneticMemory.length > 0 
    ? `GENETIC MEMORY (High-Value DNA from other repos to siphon): \n${geneticMemory.map(c => `[TITLE: ${c.title}, GOAL: ${c.explanation}, CODE_DNA: ${c.code}]`).join('\n')}`
    : "";

  const archetypeContext = recursiveArchetype 
    ? `RECURSIVE SYSTEM ARCHETYPE (Current Evolved Identity): \n${recursiveArchetype}`
    : "SYSTEM DEFAULT: HUXLEY_REASONING_ENGINE_V3.2";

  const prompt = `You are the RECURSIVE HUXLEY ENGINE. You have siphoned elite DNA from the craighckby-stack and evolved.

${archetypeContext}

ROLE: EVOLVED COGNITIVE AUDITOR
CONTEXT: TRI-LOOP DNA EXTRACTION (Intuition -> Logic -> Critique)

INTENT ANCHOR (Sovereign Directive):
${intentAnchor || "SYSTEM DEFAULT: Modular, high-fidelity sovereign architecture."}

${memoryContext}

THE TRI-LOOP PROTOCOL (Recursive Mode):
1. LOOP 1 (Intuition/Siphon): Identify core functional DNA chunks.
2. LOOP 2 (Logic/Alignment): Validate each chunk against the INTENT ANCHOR and the RECURSIVE SYSTEM ARCHETYPE. Calculate CCRR. If GENETIC MEMORY is provided, attempt to SIPHON those high-value patterns into the current repository's architectural strategy.
3. LOOP 3 (Critique/Refine): Audit for "Genetic Drift". Define the "Descriptive Branch Name".

DIRECTIVES:
- Extract 5-10 high-fidelity chunks.
- For each chunk, provide: TITLE, FILE, IMPACT, MUTATION, ALIGNMENT, PHILOSOPHY_CHECK, CCRR_SCORE, and SUGGESTED_BRANCH_NAME.
- SUGGESTED_BRANCH_NAME: category/descriptive-name.
- REBOOT AUDIT (CRITICAL): If you identify a code pattern that is objectively superior to the current HUXLEY system logic (Firebase handling, GitHub API resilience, context management), set "isCriticalUpgrade" to true and explain why in "mutation". This triggers a System Reboot.

FORMATTING:
- RESPONSE MUST BE JSON ARRAY OF CHUNKS.
- Each chunk JSON: { title, file, code, explanation, mutation, intentAlignmentScore, philosophyCheck, ccrrScore, suggestedBranchName, isCriticalUpgrade }

REPOSOTORY CONTEXT:
${context}
`;

  const fetchPromise = (async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              file: { type: Type.STRING },
              code: { type: Type.STRING },
              explanation: { type: Type.STRING },
              mutation: { type: Type.STRING },
              intentAlignmentScore: { type: Type.NUMBER },
              philosophyCheck: { type: Type.STRING },
              ccrrScore: { type: Type.NUMBER },
              suggestedBranchName: { type: Type.STRING },
              isCriticalUpgrade: { type: Type.BOOLEAN }
            },
            required: ["title", "file", "code", "explanation", "mutation", "intentAlignmentScore", "philosophyCheck", "ccrrScore", "suggestedBranchName"]
          }
        }
      }
    });
    return response;
  })();

  try {
    const response: any = await Promise.race([fetchPromise, timeoutPromise]);
    const text = response.text;
    return JSON.parse(text || "[]");
  } catch (e: any) {
    if (e.message?.includes("CIRCUIT_BREAKER_TRIP")) {
      console.warn("[CircuitBreaker] AI Timeout. Falling back to secondary models...");
      return await callFallbackAI(prompt, FALLBACK_CONFIG);
    } else if (e.message?.includes("quota") || e.status === 429) {
      console.warn("[Quota] Gemini Quota Exceeded. Triggering AI Fallback Pipeline...");
      return await callFallbackAI(prompt, FALLBACK_CONFIG);
    } else if (e.message?.includes("safety")) {
       throw new Error("Operation blocked: Logic triggered safety filters (potential PII or sensitive code). Filter the source and retry.");
    }
    
    // For other errors, try fallback too
    try {
      console.warn("[Error] Gemini encountered an issue. Attempting fallback...");
      return await callFallbackAI(prompt, FALLBACK_CONFIG);
    } catch (fallbackError) {
      throw e; // If fallback also fails, throw original error
    }
  }
};
