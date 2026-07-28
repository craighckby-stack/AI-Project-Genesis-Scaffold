
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Chunk {
  title: string;
  file: string;
  code: string;
  explanation: string;
  mutation: string;
}

export const analyzeRepoChunks = async (context: string): Promise<Chunk[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a Senior Systems Architect. I am providing you with a COMPREHENSIVE DUMP of a code repository, including the full file tree and the content of all primary logic files.

Your task is to identify and extract the "High-Fidelity Architectural Logic Chunks" that represent the core functional DNA of this system.

ROLE: DALEK_CAAN_SIPHON_ENGINE_V3.2
CONTEXT: ARCHITECTURAL_DNA_RECONSTRUCTION

DIRECTIVES FOR ANALYSIS:
1. IDENTIFY BOTTLENECKS: Analyze recursive loops and integration points. Identify where architectural bottlenecks (N-tier integration failures) are likely to occurs.
2. DNA VALIDATION: Check extracted logic against saturation constraints (e.g., modularity, line limits, and functional isolation).
3. STRATEGIC MUTATION: For every major logic chunk, suggest 1 "Logical Evolution" to harden or scale that specific pattern.
4. CROSS-PROVIDER EVALUATION: Evaluate how the logic handles external dependencies, rate-limiting, and payload consistency.

FORMATTING REQUIREMENTS:
- Use technical, precise, and editorial language.
- Structure each chunk with: TITLE, FILE, ARCHITECTURAL IMPACT (the "Why"), and STRATEGIC MUTATION.
- TONE: Professional, high-level engineering.

REFERENCE PATTERNS:
- Pattern: "Idempotent GitHub Content Persistence" -> Why: "Ensures idempotent operations and prevents version conflicts using a check-then-push pattern."
- Pattern: "Neural Codec: Brotli-Based DNA Sequencing" -> Why: "Converts codebase into binary fragments for token-optimized state transmission while preserving UTF-8 integrity."
- Pattern: "Heuristic Risk Enforcement Scanner" -> Why: "Prevents genetic drift by scanning mutations for lethal security patterns using bitwise reduction."

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
            mutation: { type: Type.STRING }
          },
          required: ["title", "file", "code", "explanation", "mutation"]
        }
      }
    }
  });

  try {
    const text = response.text;
    return JSON.parse(text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response or API call failed", e);
    return [];
  }
};
