
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
}

export const analyzeRepoChunks = async (context: string, intentAnchor?: string): Promise<Chunk[]> => {
  const timeoutPromise = new Promise<null>((_, reject) => 
    setTimeout(() => reject(new Error("CIRCUIT_BREAKER_TRIP: AI request timed out (20s)")), 20000)
  );

  const fetchPromise = (async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the HUXLEY REASONING ENGINE (v3.2). Perform a TRI-LOOP AUDIT on the provided repository.

ROLE: HUXLEY COGNITIVE AUDITOR
CONTEXT: TRI-LOOP DNA EXTRACTION (Intuition -> Logic -> Critique)

INTENT ANCHOR:
${intentAnchor || "SYSTEM DEFAULT: Modular, high-fidelity sovereign architecture."}

THE TRI-LOOP PROTOCOL:
1. LOOP 1 (Intuition/Siphon): Identify core functional DNA chunks.
2. LOOP 2 (Logic/Alignment): Validate each chunk against the INTENT ANCHOR. Calculate CCRR (Certainty-to-Risk Ratio).
3. LOOP 3 (Critique/Refine): Audit the extraction for "Genetic Drift". Refine mutation suggestions to be strategically aggressive yet architecturally sound.

DIRECTIVES:
- Extract 5-10 high-fidelity chunks.
- For each chunk, provide: TITLE, FILE, IMPACT, MUTATION, ALIGNMENT, and PHILOSOPHY_CHECK.
- ENFORCE CCRR: Every mutation must be justified by a Cognitive Gain Score (CGS) vs an Exposure Risk Score (ERS).

FORMATTING:
- RESPONSE MUST BE JSON ARRAY OF CHUNKS.
- Each chunk JSON: { title, file, code, explanation, mutation, intentAlignmentScore, philosophyCheck, ccrrScore }

REPOSOTORY CONTEXT:
${context}
`,
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
              ccrrScore: { type: Type.NUMBER } // Certainty-to-Risk-Ratio (0.0 - 10.0)
            },
            required: ["title", "file", "code", "explanation", "mutation", "intentAlignmentScore", "philosophyCheck", "ccrrScore"]
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
      console.warn("[CircuitBreaker] AI Timeout. Falling back.");
      return [{
        title: "Fallback Manifest",
        file: "System",
        code: "// Timeout fallback",
        explanation: "Audit interrupted by latency threshold.",
        mutation: "Increase timeout or optimize context.",
        intentAlignmentScore: 0.5,
        philosophyCheck: "Neutral alignment.",
        ccrrScore: 5.0
      }];
    }
    return [];
  }
};
