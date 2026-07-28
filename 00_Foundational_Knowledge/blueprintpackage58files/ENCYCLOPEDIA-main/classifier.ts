import { Type } from "@google/genai";
import { EncyclopediaData } from "./src/types.ts";

export const CAPABILITY_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isNewCapability: {
      type: Type.BOOLEAN,
      description: "Whether this code represents a completely new capability that does not match any in the current capabilities list."
    },
    capabilityId: {
      type: Type.STRING,
      description: "The ID of the existing capability if isNewCapability is false, or a newly proposed kebab-case ID if isNewCapability is true."
    },
    newCapabilityDetails: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "Descriptive name of the new capability."
        },
        purpose: {
          type: Type.STRING,
          description: "Short description of what problem it solves."
        },
        whyItExists: {
          type: Type.STRING,
          description: "Detailed context on the underlying problem."
        },
        evolution: {
          type: Type.STRING,
          description: "Expected evolution path."
        },
        dependencies: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: "List of third-party dependencies needed."
        },
        volume: {
          type: Type.STRING,
          description: "The volume name."
        },
        chapter: {
          type: Type.STRING,
          description: "The chapter name."
        }
      },
      required: ["name", "purpose", "whyItExists", "evolution", "dependencies", "volume", "chapter"]
    },
    capabilityHowItWorks: {
        type: Type.STRING,
        description: "Mechanism-level explanation of how this capability works. Synthesize across all knowledge of this capability."
    },
    capabilitySummary: {
        type: Type.STRING,
        description: "One paragraph synthesized summary of this capability."
    },
    chunkName: {
      type: Type.STRING,
      description: "Short descriptive name of this specific code chunk."
    },
    chunkSummary: {
      type: Type.STRING,
      description: "Brief summary/docstring of this specific chunk."
    }
  },
  required: ["isNewCapability", "capabilityId", "capabilityHowItWorks", "capabilitySummary", "chunkName", "chunkSummary"]
};

// Rate Limiter to handle Gemini 15 RPM free tier limit
class RateLimiter {
    private lastRequestTime: number = 0;
    private readonly MIN_DELAY_MS = 5000; // 4.1 seconds ensures max 14-15 requests per minute

    async waitNext() {
        const now = Date.now();
        const timeSinceLast = now - this.lastRequestTime;
        if (timeSinceLast < this.MIN_DELAY_MS) {
            await new Promise(r => setTimeout(r, this.MIN_DELAY_MS - timeSinceLast));
        }
        this.lastRequestTime = Date.now();
    }
}

export const aiRateLimiter = new RateLimiter();

export async function classifyAndStoreChunk(file: { path: string }, repoFullName: string, code: string, db: EncyclopediaData, aiClient: any, saveData: (db: EncyclopediaData) => void): Promise<{ capabilityId: string, chunkId: string }> {
    const existingCapabilities = Object.values(db.capabilities).map(c => ({
        id: c.id,
        name: c.name,
        purpose: c.purpose,
        howItWorks: c.howItWorks,
        summary: c.summary
    }));

    const prompt = `You are building an Encyclopedia of Engineering Knowledge.
We organize code snippets into conceptual "Capabilities" (engineering concepts/problems) across various programming languages and systems.

Current capabilities:
${JSON.stringify(existingCapabilities, null, 2)}

Analyze the following code snippet from ${repoFullName} - ${file.path}:
\`\`\`
${code.substring(0, 8000)}
\`\`\`

Task:
1. Does this code implement one of the existing conceptual capabilities? (e.g. if it's Python doing Firebase Auth, it belongs with the JavaScript Firebase Auth capability)
2. If yes, return its existing capabilityId.
3. If no, this is a new capability. Propose a new capabilityId (kebab-case), name, purpose, whyItExists, evolution, dependencies, volume name, and chapter name.
4. Provide a capabilityHowItWorks and capabilitySummary. If this is an existing capability, regenerate them to incorporate this new chunk. If it is new, generate them from scratch based on this chunk.

CRITICAL INSTRUCTIONS:
- Capabilities should be high-level engineering concepts (e.g., "Firebase Initialization", "Repository Scanner", "JWT Validation", "Vector Embedding Generation").
- DO NOT name capabilities after specific filenames or isolated repositories unless absolutely necessary.
- Your goal is to merge Python, JavaScript, TypeScript, Markdown, etc. into the same conceptual article if they solve the same problem.

Return ONLY JSON matching the schema.`;

    let attempt = 0;
    const maxAttempts = 3;
    let result;

    while (attempt < maxAttempts) {
        await aiRateLimiter.waitNext();
        try {
            result = await aiClient.models.generateContent({
                model: "gemini-3.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: CAPABILITY_ANALYSIS_SCHEMA,
                }
            });
            break;
        } catch (err: any) {
            if (err.status === 429 || err.message?.includes("429") || err.message?.includes("rate limit") || err.message?.includes("quota") || err.status === 503 || err.message?.includes("503") || err.message?.includes("UNAVAILABLE")) {
                attempt++;
                if (attempt >= maxAttempts) throw err;
                console.warn(`Rate limit or 503 encountered, backing off for ${5000}ms...`);
                await new Promise(r => setTimeout(r, 5000));
            } else {
                throw err;
            }
        }
    }

    let responseText = result.text || "{}";
    responseText = responseText.replace(/\s*```json\s*/gi, '').replace(/\s*```\s*/g, '').trim();
    let responseJson: any = {};
    try {
        responseJson = JSON.parse(responseText);
    } catch (e) {
        console.error("Failed to parse JSON directly:", responseText);
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
            responseJson = JSON.parse(match[0]);
        } else {
            throw e;
        }
    }

    const chunkId = Date.now().toString() + Math.random().toString(36).substring(7);
    const newChunk = {
        id: chunkId,
        repo: repoFullName,
        file: file.path || "unknown",
        name: responseJson.chunkName || "Snippet",
        code,
        docstring: responseJson.chunkSummary
    };

    const capabilityId = responseJson.capabilityId;

    if (responseJson.isNewCapability) {
        const volName = responseJson.newCapabilityDetails?.volume || "General";
        const chapName = responseJson.newCapabilityDetails?.chapter || "Misc";
        
        let vol = db.volumes.find((v: any) => v.name === volName);
        if (!vol) {
            vol = { name: volName, chapters: [] };
            db.volumes.push(vol);
        }
        let chap = vol.chapters.find((c: any) => c.name === chapName);
        if (!chap) {
            chap = { name: chapName, capabilities: [] };
            vol.chapters.push(chap);
        }
        if (!chap.capabilities.includes(capabilityId)) {
            chap.capabilities.push(capabilityId);
        }
        
        db.capabilities[capabilityId] = {
            id: capabilityId,
            name: responseJson.newCapabilityDetails?.name || capabilityId,
            purpose: responseJson.newCapabilityDetails?.purpose || "",
            whyItExists: responseJson.newCapabilityDetails?.whyItExists || "",
            evolution: responseJson.newCapabilityDetails?.evolution || "",
            dependencies: responseJson.newCapabilityDetails?.dependencies || [],
            volume: volName,
            chapter: chapName,
            bestImplementationId: chunkId,
            howItWorks: responseJson.capabilityHowItWorks || "",
            summary: responseJson.capabilitySummary || "",
            variants: [ { chunk: newChunk } ]
        };
    } else {
        let cap = db.capabilities[capabilityId];
        if (!cap) {
            // Fallback if AI hallucinates an ID
            const volName = "General";
            const chapName = "Uncategorized";
            let vol = db.volumes.find((v: any) => v.name === volName);
            if (!vol) {
                vol = { name: volName, chapters: [] };
                db.volumes.push(vol);
            }
            let chap = vol.chapters.find((c: any) => c.name === chapName);
            if (!chap) {
                chap = { name: chapName, capabilities: [] };
                vol.chapters.push(chap);
            }
            if (!chap.capabilities.includes(capabilityId)) {
                chap.capabilities.push(capabilityId);
            }
            db.capabilities[capabilityId] = {
                id: capabilityId,
                name: capabilityId,
                purpose: "Auto-generated capability",
                whyItExists: "Unknown",
                evolution: "Unknown",
                dependencies: [],
                volume: volName,
                chapter: chapName,
                bestImplementationId: chunkId,
                howItWorks: responseJson.capabilityHowItWorks || "",
                summary: responseJson.capabilitySummary || "",
                variants: [ { chunk: newChunk } ]
            };
            cap = db.capabilities[capabilityId];
        } else {
            cap.variants.push({ chunk: newChunk });
            // Update documentation
            cap.howItWorks = responseJson.capabilityHowItWorks || cap.howItWorks;
            cap.summary = responseJson.capabilitySummary || cap.summary;
            
            // Priority 3: Update bestImplementationId using a simple heuristic
            // Heuristic: Highest combined length of code and docstring indicates the most comprehensive implementation
            let bestVariant = cap.variants.find(v => v.chunk.id === cap.bestImplementationId);
            let bestScore = bestVariant ? (bestVariant.chunk.code.length + (bestVariant.chunk.docstring?.length || 0)) : 0;
            
            const newScore = newChunk.code.length + (newChunk.docstring?.length || 0);
            if (newScore > bestScore) {
                cap.bestImplementationId = chunkId;
            }
        }
    }
    
    saveData(db);
    return { capabilityId, chunkId };
}