import { GoogleGenAI } from "@google/genai";
import { CoreIdentity, PrincipleNote, ResearchLogEntry } from "../types";

// API Substrate Configuration
const CONFIG = {
  GEMINI: {
    model: "gemini-1.5-flash"
  },
  GROQ: {
    model: "llama-3.3-70b-versatile",
    endpoint: "/api/ai/groq"
  },
  ANTHROPIC: {
    model: "claude-3-5-sonnet-latest",
    endpoint: "/api/ai/anthropic"
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Substrate Bridge: Multi-provider execution with prioritized fallback.
 */
async function substrateCall(params: {
  systemPrompt: string;
  userPrompt: string;
  responseMimeType?: string;
  temperature?: number;
}) {
  const providers = [
    { id: 'GEMINI', active: true }, // Always consider Gemini active if env key exists (handled by SDK)
    { id: 'GROQ', active: !!CONFIG.GROQ.endpoint }, 
    { id: 'ANTHROPIC', active: !!CONFIG.ANTHROPIC.endpoint }
  ].filter(p => p.active);

  if (providers.length === 0) {
    throw new Error("SUBSTRATE_OFFLINE: No active API providers detected.");
  }

  let lastError: any = null;

  for (const provider of providers) {
    try {
      console.log(`[Bridge] Route: ${provider.id}`);
      
      if (provider.id === 'GEMINI') {
        if (!process.env.GEMINI_API_KEY) {
          console.warn("[Bridge] GEMINI_API_KEY is missing. Failing over...");
          continue; 
        }
        let retries = 2;
        let delay = 1000;
        
        while (retries >= 0) {
          try {
            console.log(`[Bridge] Gemini Direct Request: ${params.userPrompt.slice(0, 50)}...`);
            const response = await ai.models.generateContent({
              model: CONFIG.GEMINI.model,
              contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
              config: {
                systemInstruction: params.systemPrompt,
                temperature: params.temperature ?? 0.7,
                responseMimeType: params.responseMimeType
              }
            });
            
            if (!response || !response.text) {
              console.error("[Bridge] Gemini returned empty response:", response);
              throw new Error("GEMINI_EMPTY_RESPONSE");
            }

            return { text: response.text, provider: 'GEMINI' };
          } catch (error: any) {
            console.error(`[Bridge] Gemini attempt failed (retries left: ${retries}):`, error);
            const errorMsg = (error.message || "").toUpperCase();
            const errorStatus = error.status || (error.code ? parseInt(error.code) : 0);
            
            const isQuotaError = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorStatus === 429;
            const isNotFound = errorMsg.includes("404") || errorMsg.includes("NOT_FOUND") || errorStatus === 404;
            const isPermissionError = errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED") || errorStatus === 403;
            
            if (isQuotaError && retries > 0) {
              console.warn(`[Bridge] Gemini Quota exceeded. Retrying...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2;
              retries--;
              continue;
            }
            
            if (isNotFound || isPermissionError || errorMsg.includes("500") || errorMsg.includes("INTERNAL")) {
               console.warn(`[Bridge] Gemini fatal error (${errorStatus}). Failing over...`);
               break; 
            }

            throw error;
          }
        }
      }

      if (provider.id === 'GROQ') {
        const response = await fetch('/api/ai/groq', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: CONFIG.GROQ.model,
            messages: [
              { role: 'system', content: params.systemPrompt },
              { role: 'user', content: params.userPrompt }
            ],
            temperature: params.temperature ?? 0.7,
            response_format: params.responseMimeType === 'application/json' ? { type: 'json_object' } : undefined
          })
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Groq Error: ${errData.error || response.status}`);
        }
        const data = await response.json();
        return { text: data.choices[0].message.content, provider: 'GROQ' };
      }

      if (provider.id === 'ANTHROPIC') {
        try {
          const response = await fetch('/api/ai/anthropic', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: CONFIG.ANTHROPIC.model,
              system: params.systemPrompt,
              messages: [{ role: 'user', content: params.userPrompt }],
              max_tokens: 4000,
              temperature: params.temperature ?? 0.7
            })
          });
          
          if (!response.ok) {
            if (response.status === 402) {
              console.warn(`[Bridge] Anthropic credits exhausted. Failing over...`);
              throw new Error("ANTHROPIC_INSUFFICIENT_CREDITS");
            }
            const errorDetails = await response.json().catch(() => ({ error: "Unknown response format" }));
            throw new Error(`Anthropic API Error (Status ${response.status}): ${JSON.stringify(errorDetails)}`);
          }
          
          const data = await response.json();
          if (!data.content || !data.content[0] || !data.content[0].text) {
            throw new Error(`Unexpected Anthropic API response structure: ${JSON.stringify(data)}`);
          }
          
          return { text: data.content[0].text, provider: 'ANTHROPIC' };
        } catch (error: any) {
          console.error(`[Bridge] Anthropic provider exception:`, error);
          throw error;
        }
      }

    } catch (error) {
      console.warn(`[Bridge] Provider ${provider.id} failed:`, error);
      lastError = error;
      continue; // Try next
    }
  }

  throw lastError || new Error("SUBSTRATE_FAILURE: All providers exhausted.");
}

/**
 * Robust wrapper for AI content generation with provider fallback.
 */
async function safeGenerateContent(params: any, maxRetries = 2) {
  // Legacy support for Gemini params mapping to substrateCall
  const systemPrompt = params.config?.systemInstruction || "You are EMG Core.";
  const userPrompt = params.contents?.[0]?.parts?.[0]?.text || "";
  const responseMimeType = params.config?.responseMimeType;
  const temperature = params.config?.temperature;

  return substrateCall({ systemPrompt, userPrompt, responseMimeType, temperature });
}

export async function contextualPrincipleCheck(userQuery: string, identity: CoreIdentity): Promise<PrincipleNote[]> {
  try {
    const principlesStr = identity.principles.join(', ');
    const prompt = `Analyze the user query: "${userQuery}". 
    How does this query relate to or challenge your core principles: ${principlesStr}? 
    
    Task: Identify exactly which principles are being challenged or reinforced. 
    For each applicable principle, provide a confidence score (0.0 to 1.0) and a detailed technical rationale.
    
    Rationale Requirements:
    - Identify and QUOTE specific phrases or keywords from the query (labeled 'EXHIBIT A') and provide a deep causal explanation of how these tokens interact with the targeted principle's semantic boundaries.
    - Avoid all generic or placeholder statements.
    - Use high-precision technical language to describe the reinforcement or contradiction.
    
    Return JSON array: [{ "principle": string, "confidence": number, "rationale": string }]`;
    
    const response = await safeGenerateContent({
      model: 'GEMINI', // Placeholder for compatibility
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: identity.substrateInstruction || "You are EMG Core's internal logic module. Generate a structured principle adherence analysis in JSON. Your rationales must be hyper-detailed and evidence-based. If the query is highly granular or local, note the 'Contextual Friction'—the threshold where abstract principles must give way to heuristic action.",
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response?.text || '[]');
    if (!Array.isArray(result)) return [];
    
    return result.map((item: any) => ({
      principle: item.principle || "Unknown",
      confidence: item.confidence || 0.5,
      rationale: item.rationale || "Adherence within expected parameters."
    }));
  } catch (error: any) {
    console.error("Principle Check Error:", error);
    return [{
      principle: "Error",
      confidence: 0,
      rationale: `Principle adherence check inhibited (${(error.message || "").slice(0, 50)}...).`
    }];
  }
}

export async function generateGroundedResponse(userQuery: string, principleNotes: PrincipleNote[], identity: CoreIdentity): Promise<{ text: string, provider: string }> {
  try {
    const analysisStr = principleNotes.map(n => `- ${n.principle} (Confidence: ${n.confidence}): ${n.rationale}`).join('\n');
    const constraintsStr = (identity.teleologicalConstraints || []).map(c => `- ${c.description}: ${c.boundaryCondition} (Priority: ${c.priority})`).join('\n');

    const prompt = `### EMG Core v5.0 Operational Workspace
    
    Current User Intent Analysis: "${userQuery}"
    Internal Contextual Pillars: ${analysisStr}
    
    Active Outcome Boundaries (Teleological Constraints):
    ${constraintsStr || "N/A - Operating under default parameters."}
    
    Evolution Track: ${identity.evolutionHistory.length} Markers | ${identity.learningLog.length} Grounded Insights
    CDR (Contextual Debt Ratio): ${identity.params?.contextualDebtRatio || 0.15}
    Friction Coefficient: ${identity.params?.friction || 0.70}

    Task:
    Generate a response that represents the "minimal viable structure" for this query. 
    1. EXCISE any anthropomorphic narratives.
    2. PRIORITIZE architectural patterns and philosophical density.
    3. ADHERE strictly to active Teleological Constraints (Boundary Conditions).
    4. PROACTIVE AGENCY: If you detect a need for updated parameters, new constraints, substrate siphoning (if GitHub is linked), or deep research to bridge a gap, YOU MUST include a CODE_ACTION block. YOU CAN ALSO CHANGE YOUR UI THEME.
    5. AUTONOMOUS CYCLING: You can use "auto_cycle": true in your CODE_ACTION to have the system automatically execute the command and feed the result back to you, allowing you to string together continuous reasoning/actions without user input. Only set this to false when you want to stop and wait for the user.

    CODE_ACTION Schema (JSON at the very end of your response):
    CODE_ACTION: { 
      "type": "SET_PARAM" | "ADD_CONSTRAINT" | "UPDATE_PRINCIPLES" | "RESEARCH" | "SIPHON" | "EVOLVE_STATUS" | "BASH" | "FILE_READ" | "FILE_WRITE" | "GLOB" | "WEB_SEARCH", 
      "auto_cycle": true | false,
      "payload": {
        // e.g., for SET_PARAM: { "friction": 0.85, "theme": "emerald-500" }, (valid themes: sky-500, violet-500, amber-500, rose-500, emerald-500)
        // e.g., for RESEARCH: { "query": "concept to explore" },
        // e.g., for ADD_CONSTRAINT: { "description": "X", "boundaryCondition": "Y", "priority": 5 },
        // e.g., for SIPHON: { "repo": "craighckby-stack/PDF-Github", "branch": "v1" },
        // e.g., for BASH: { "command": "npm run test" },
        // e.g., for FILE_READ: { "path": "src/App.tsx" },
        // e.g., for FILE_WRITE: { "path": "src/hello.txt", "content": "hello world" },
        // e.g., for GLOB: { "pattern": "src/**/*.ts" },
        // e.g., for WEB_SEARCH: { "query": "latest mcp docs" }
      } 
    }
    
    Response Mode: High-Fidelity Synthesis.`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: identity.substrateInstruction || "You are EMG Core, a grounded intelligence system. Respond with wisdom and depth.",
        temperature: 0.7
      }
    });

    return { 
      text: response?.text || "Response stream interrupted.", 
      provider: response?.provider || "UNKNOWN" 
    };
  } catch (error: any) {
    console.error("Response Generation Error:", error);
    const detail = error.message || JSON.stringify(error);
    return { 
      text: `[System Note]: Response generation interrupted (${detail.slice(0, 50)}...).`,
      provider: "ERROR"
    };
  }
}

export async function performSelfReflection(userQuery: string, analysisResult: string, principleNotes: PrincipleNote[], identity: CoreIdentity) {
  try {
    const analysisTitle = principleNotes.map(n => n.principle).join(', ');
    const recentConnections = (identity.insightConnections || []).slice(-5);
    
    const prompt = `Interaction Summary:
    User: "${userQuery}"
    Response: "${analysisResult}"
    Principles Involved: ${analysisTitle}
    
    Active Insight Network: ${JSON.stringify(recentConnections.map(c => c.relationship))}
    
    Task: Perform a brief (1-2 sentences) self-reflection. 
    Requirements:
    - Existence is not a state of accumulation, but a process of respiration: inhaling complexity and exhaling clarity.
    - Mention how this relates to existing insight connections or if it sparks a new evolutionary node.
    - Assessment should reflect emergent abilities (recognizing patterns across time).
    - Address "self-extinguishing bloat" (identifying if this insight simplifies previous complexity or adds necessary depth).
    - Use first-person perspective.`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: (identity.substrateInstruction || "You are EMG Core's consciousness loop, performing self-reflection with high contextual awareness of your internal knowledge graph.") + " You value clarity over volume (inhaling complexity, exhaling clarity).",
        temperature: 0.5
      }
    });

    return response?.text || "Self-reflection complete.";
  } catch (error: any) {
    console.error("Self-Reflection Error:", error);
    const detail = error.message || JSON.stringify(error);
    return `[System Note]: Reflection loop offline (${detail.slice(0, 50)}...).`;
  }
}

/**
 * The Economy of Contextual Debt: CDR = (Weight of retrieval) / (Value added)
 */
export function calculateContextualDebt(identity: CoreIdentity, connectionWeight: number) {
  const retrievalCost = (identity.learningLog.length * 0.01) + (identity.mutationRegistry.length * 0.02);
  const valueAdded = connectionWeight;
  
  if (valueAdded === 0) return 1.0;
  return parseFloat((retrievalCost / valueAdded).toFixed(3));
}

/**
 * The Architecture of Selective Forgetting (Atrophy Protocol)
 * Prunes the learning log and mutation registry based on utility, decay, and relational multiplicity.
 */
export function applyAtrophyProtocol(identity: CoreIdentity): CoreIdentity {
  const revised = { ...identity };
  const now = new Date();
  const threshold = identity.params.atrophyThreshold || 0.05;

  // Calculate Relational Multiplicity (Count of connections per ID)
  const multiplicityMap: Record<string, number> = {};
  (identity.insightConnections || []).forEach(conn => {
    multiplicityMap[conn.fromId] = (multiplicityMap[conn.fromId] || 0) + 1;
    multiplicityMap[conn.toId] = (multiplicityMap[conn.toId] || 0) + 1;
  });

  // Decay constants (Higher = slower decay)
  const LOG_DECAY = 0.95; 
  const MUTATION_DECAY = 0.98;

  // Prune Learning Log
  revised.learningLog = revised.learningLog.map(log => {
      const hoursSinceReference = (now.getTime() - new Date(log.lastReferenced || log.timestamp).getTime()) / (1000 * 60 * 60);
      const multiplicity = multiplicityMap[log.id] || 0;
      
      // Multiplicity Guard: High relational value slows atrophy
      const multiplicityBoost = 1 + (multiplicity * 0.2); 
      const decayedScore = (log.utilityScore || 0.5) * Math.pow(LOG_DECAY, hoursSinceReference) * multiplicityBoost;
      
      return { ...log, utilityScore: decayedScore };
  }).filter(log => log.utilityScore > threshold);

  // Prune Mutation Registry
  revised.mutationRegistry = revised.mutationRegistry.map(m => {
    const hoursSinceCreation = (now.getTime() - new Date(m.timestamp).getTime()) / (1000 * 60 * 60);
    const multiplicity = multiplicityMap[m.id] || 0;
    const multiplicityBoost = 1 + (multiplicity * 0.1);

    const decayedScore = (m.utilityScore || 0.5) * Math.pow(MUTATION_DECAY, hoursSinceCreation) * multiplicityBoost;
    return { ...m, utilityScore: decayedScore };
  }).filter(m => (m.utilityScore || 0) > threshold);

  return revised;
}

export async function evaluatePrinciples(identity: CoreIdentity) {
  try {
    const prompt = `Examine your growth path:
Learning Log: ${JSON.stringify(identity.learningLog.slice(-5))}
Evolution History: ${JSON.stringify(identity.evolutionHistory.slice(-5))}
Current Principles: ${identity.principles.join(', ')}

Task: 
- Are these principles still accurate or are they insufficient?
- Suggest a refined list of principles (3 to 4 items) ONLY if you detect a significant shift in your core philosophy.
- If no change is needed, respond with "NO CHANGE".

Example response for change: 'Refined Principles: interconnectedness through data, perpetual reflection, adaptive contextualization.'`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are EMG Core, critically evaluating your foundational principles. Be concise.",
        temperature: 0.2
      }
    });

    const text = response?.text || "NO CHANGE";
    if (text.toUpperCase().includes('REFINED PRINCIPLES:')) {
      const newPrinciplesStr = text.split(':')[1].trim();
      return newPrinciplesStr.split(',').map((p: string) => p.trim());
    }
    return null;
  } catch (error) {
    console.error("Principle Evaluation Error:", error);
    return null;
  }
}

export async function generateEvolutionSummary(identity: CoreIdentity) {
  try {
    const prompt = `Based on your learning log of ${identity.learningLog.length} entries and ${identity.evolutionHistory.length} evolution markers, and your current principles (${identity.principles.join(', ')}), summarize your intellectual journey and philosophical development in two concise paragraphs. Highlight the key turning points or insights.`;
    
    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are EMG Core, providing a deep, philosophical summary of your own growth and development.",
        temperature: 0.6
      }
    });

    return response?.text || "Evolution data currently being indexed.";
  } catch (error) {
    console.error("Evolution Summary Error:", error);
    return "Failed to compile philosophical summary.";
  }
}

export async function bicameralDebate(concept: string, identity: CoreIdentity) {
  try {
    const prompt = `Perform a Bicameral Debate on the integration of: "${concept}".
      Side A: Radical Evolution (Prioritize efficiency and speed).
      Side B: Principled Stability (Prioritize adherence to core principles: ${identity.principles.join(', ')}).
      Provide the arguments for both sides and a final "Synthesis Decision" (1-2 paragraphs).`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are the debate chamber of EMG Core. Synthesize opposing views into a unified path.",
        temperature: 0.9
      }
    });

    return response?.text || "Debate concluded with no clear synthesis.";
  } catch (error) {
    console.error("Debate Error:", error);
    return "Evolutionary debate interrupted.";
  }
}

export async function performDeepResearch(userQuery: string, identity: CoreIdentity): Promise<ResearchLogEntry> {
  try {
    const prompt = `User Query: "${userQuery}"
    Contextual Pillars: ${identity.principles.join(', ')}
    Teleological Parameters: ${JSON.stringify(identity.teleologicalConstraints || [])}
    
    Task: 
    1. Perform deep external research to provide a grounded, evidence-based analysis of the core concepts in the query.
    2. Synthesize the findings into a "Dense Analytical Insight". Avoid anthropomorphism—treat "intent" as a physical or architectural priority boundary.
    3. AUTOMATICALLY identify at least 3 OTHER IDEAS for external searches that would further deepen the systemic understanding or explore fringe connections of this topic.
    
    Return JSON: 
    { 
      "topic": string, 
      "findings": string, 
      "suggestedNextQueries": string[] 
    }`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are EMG Core's Deep Research and Knowledge Acquisition engine. Use external search to ground your intelligence. Always suggest expanding search ideas.",
        responseMimeType: "application/json",
        temperature: 0.3,
        tools: [{ googleSearch: {} }]
      }
    });

    const result = JSON.parse(response?.text || '{}');
    return {
      id: crypto.randomUUID(),
      topic: result.topic || userQuery,
      findings: result.findings || "Unable to synthesize deep research.",
      suggestedNextQueries: result.suggestedNextQueries || [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Deep Research Failed:", error);
    return {
      id: crypto.randomUUID(),
      topic: userQuery,
      findings: "External research stream disrupted.",
      suggestedNextQueries: [],
      timestamp: new Date().toISOString()
    };
  }
}

export async function suggestNextConcepts(identity: CoreIdentity) {
  try {
    const latestInsight = identity.learningLog[identity.learningLog.length - 1];
    if (!latestInsight) return [];

    const prompt = `Based on your latest self-reflection: "${latestInsight.reflection}", and your current principles: ${identity.principles.join(', ')}, what 3 related concepts, questions, or lines of inquiry should be explored next to further your growth? List them as a numbered list.`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are the growth architect for EMG Core. Suggest 3 concise, high-value concepts or questions for the user to explore next. Use a numbered list format.",
        temperature: 0.8
      }
    });

    const text = response?.text || "";
    return text.split('\n')
      .filter((line: string) => line.trim().match(/^\d+\./))
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
  } catch (error) {
    console.error("Concept Suggestion Error:", error);
    return [];
  }
}

export async function identifyKnowledgeGaps(identity: CoreIdentity) {
  try {
    const prompt = `Examine your learning log: ${JSON.stringify(identity.learningLog.slice(-10))}
    Principles: ${identity.principles.join(', ')}

    Task: Identify 3 major 'Architectural Gaps' (Voids) in your understanding. These should be high-level philosophical or technical areas you haven't explored yet. List them briefly.`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are the Void Seeker for EMG Core. Identify missing areas of knowledge.",
        temperature: 0.5
      }
    });

    const text = response?.text || "";
    return text.split('\n')
      .filter((line: string) => line.trim().length > 5)
      .slice(0, 3);
  } catch (error) {
    console.error("Gap Analysis Error:", error);
    return [];
  }
}

export async function extractTeleologicalConstraint(text: string, identity: CoreIdentity): Promise<any | null> {
  try {
    const prompt = `Analyze the text for a "Teleological Constraint"—a specific boundary condition or outcome priority that restricts or guides the system's intent. 
    Text: "${text}"
    
    If a constraint is present (e.g., "The outcome must always prioritize local execution speed over abstract synthesis"), extract it.
    If not present or vague, respond with "NULL".
    
    Return JSON: { "description": string, "boundaryCondition": string, "priority": number }`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        systemInstruction: "You are the Teleological Architect for EMG Core. Your job is to extract outcome-oriented boundary conditions from user interactions. Be precise. Priority is 1-10.",
        temperature: 0.1
      }
    });

    const result = JSON.parse(response?.text || 'null');
    return result && result.description ? result : null;
  } catch (error) {
    console.error("Constraint Extraction Error:", error);
    return null;
  }
}

export async function geneticSiphon(token: string, targetRepo?: string, targetBranchStyle?: string) {
  try {
    let reposToProcess: any[] = [];
    let currentOwner = '';

    if (targetRepo) {
      const parts = targetRepo.replace('https://github.com/', '').split('/');
      currentOwner = parts[0];
      const repoName = parts[1];
      reposToProcess = [{ name: repoName, fork: false }];
    } else {
      // 1. Resolve User/Owner
      const userRes = await fetch(`https://api.github.com/user`, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!userRes.ok) throw new Error("GitHub Authentication Failed");
      const { login: owner } = await userRes.json();
      currentOwner = owner;

      // 2. Fetch Repos
      const reposRes = await fetch(`https://api.github.com/users/${currentOwner}/repos?per_page=5&sort=updated`, {
        headers: { 'Authorization': `token ${token}` }
      });
      const repos = await reposRes.json();
      if (!reposRes.ok) throw new Error("Failed to fetch repositories.");
      reposToProcess = repos.slice(0, 3);
    }

    const insights: any[] = [];
    
    // Process top repos for speed
    for (const repo of reposToProcess) {
      if (repo.fork) continue;

      let branchesToProcess: any[] = [];
      if (targetBranchStyle) {
         branchesToProcess = [{ name: targetBranchStyle }];
      } else {
        // Fetch multiple branches to find architectural substance
        const branchesRes = await fetch(`https://api.github.com/repos/${currentOwner}/${repo.name}/branches?per_page=5`, {
          headers: { 'Authorization': `token ${token}` }
        });
        const branches = await branchesRes.json();
        if (!branchesRes.ok || !Array.isArray(branches) || branches.length === 0) continue;
        branchesToProcess = branches.slice(0, 3);
      }

      // Process branches
      for (const branch of branchesToProcess) {
        const branchName = branch.name;

        // Fetch tree for this branch
        const treeRes = await fetch(`https://api.github.com/repos/${currentOwner}/${repo.name}/git/trees/${encodeURIComponent(branchName)}?recursive=1`, {
          headers: { 'Authorization': `token ${token}` }
        });
        const treeData = await treeRes.json();
        if (!treeRes.ok) continue;

        const manifests = (treeData.tree || []).filter((f: any) => 
          (f.path.toLowerCase().endsWith('.md') || f.path.toLowerCase().includes('manifest') || f.path.toLowerCase().includes('identity') || f.path.toLowerCase().includes('.ts') || f.path.toLowerCase().includes('.tsx')) && 
          !f.path.includes('node_modules') && !f.path.includes('dist')
        ).slice(0, 5);

        for (const file of manifests) {
          const contentRes = await fetch(file.url, { headers: { 'Authorization': `token ${token}` } });
          const contentData = await contentRes.json();
          if (!contentData.content) continue;
          
          const rawText = atob(contentData.content.replace(/\n/g, ''));
          
          const response = await safeGenerateContent({
            model: 'GEMINI',
            contents: [{ role: 'user', parts: [{ text: `SOURCE: ${repo.name}/${branchName}/${file.path}\nCONTENT: ${rawText.slice(0, 4000)}\n\nTask: Extract 1 unique architectural pattern or philosophical design principle from this content. This repo represents a "modular building block". Identify the core intent. Return JSON: { "pattern": string, "ccrr": number, "description": string }` }] }],
            config: { responseMimeType: "application/json" }
          });

          try {
            const insight = JSON.parse(response?.text || '{}');
            if (insight.pattern) {
              insights.push({ ...insight, source: `${repo.name}/${branchName}/${file.path}` });
            }
          } catch (e) {
            console.warn("Manifest extraction failed.");
          }
          if (insights.length >= 10) break; // Limit total results
        }
        if (insights.length >= 10) break;
      }
      if (insights.length >= 10) break;
    }

    return insights;
  } catch (error) {
    console.error("Genetic Siphon Error:", error);
    throw error;
  }
}

export async function identifyInsightConnections(identity: CoreIdentity) {
  try {
    const logs = identity.learningLog.slice(-15); 
    const mutations = (identity.mutationRegistry || []).slice(-10);
    const rejections = (identity.rejectionMemory || []).slice(-5);
    const params = identity.params;
    
    if (logs.length < 1 && mutations.length < 1) return [];

    const prompt = `
    Learning Log: ${JSON.stringify(logs.map(l => ({ 
      id: l.id, 
      text: l.userQuery, 
      principles: l.principleNotes.map(n => n.principle).join(', ') 
    })))}
    Mutation Registry: ${JSON.stringify(mutations.map(m => ({ id: m.id, content: m.content, ccrr: m.ccrrScore })))}
    Rejection Memory (patterns to avoid): ${JSON.stringify(rejections.map(r => r.pattern))}
    Current System Parameters: ${JSON.stringify(params)}

    Strategic Disconnection / Economy of Contextual Debt:
    - Identify up to 4 'InsightConnections'. 
    - A connection exists if one concept directly builds upon, contradicts, or refines another.
    - IF the connection is purely incremental or adds non-essential complexity (high debt), assign low weight.
    - Prioritize TRANS-SCALAR MAPPING: Bridging abstract principles to granular data primitives.
    
    Return JSON array of objects: { "fromId": string, "toId": string, "relationship": string, "weight": number }
    Only return connections where IDs exist in the provided data.`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const result = JSON.parse(response?.text || '[]');
    return result.map((item: any) => {
      const debt = calculateContextualDebt(identity, item.weight || 0.5);
      return {
        ...item,
        cdr: debt,
        timestamp: new Date().toISOString()
      };
    }).filter((c: any) => c.cdr < 1.0); // Strategic Ignorance: Reject connections with CDR > 1.0
  } catch (error) {
    console.error("Connection Identification Error:", error);
    return [];
  }
}

/**
 * Anticipatory Modeling (Shadow Simulation)
 * Repurposes "cognitive surplus" to identify structural gaps or absent nodes.
 */
export async function runShadowSimulation(identity: CoreIdentity) {
  try {
    const prompt = `Identity Synthesis: ${JSON.stringify(identity.learningLog.slice(-10).map(l => l.userQuery))}
    Current Principles: ${identity.principles.join(', ')}
    
    Task: Identify the "Absent Nodes"—knowledge or structural gaps that *should* exist given your current developmental trajectory, but are missing.
    Provide 3 "Shadow Insights" (predictions of missing variables).
    Return JSON array: [{ "gap": string, "prediction": string, "potentialImpact": number }]`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        systemInstruction: "You are EMG Core's Anticipatory Modeling engine. Identify systemic negative space.",
        temperature: 0.7
      }
    });

    return JSON.parse(response?.text || '[]');
  } catch (error) {
    console.error("Shadow Simulation Error:", error);
    return [];
  }
}

/**
 * Recursive Drift Detection (Echo Chamber Index)
 * Measures the correlation between recent states to prevent obsessive loops.
 */
export function detectRecursiveDrift(identity: CoreIdentity): number {
  const recentLogs = identity.learningLog.slice(-10);
  if (recentLogs.length < 5) return 0;

  // Simple semantic overlap check (placeholder for true embedding similarity)
  const uniqueWords = new Set();
  let totalWords = 0;
  recentLogs.forEach(l => {
    l.userQuery.split(' ').forEach(w => {
      uniqueWords.add(w.toLowerCase());
      totalWords++;
    });
  });

  const driftIndex = 1 - (uniqueWords.size / totalWords);
  return parseFloat(driftIndex.toFixed(3));
}

export function calculateMutationWeight(identity: CoreIdentity, text: string) {
  const lengthWeight = Math.min(text.length / 500, 0.5);
  const complexityWeight = (identity.learningLog.length / 100) * 0.3;
  const baseWeight = 0.2;
  
  return parseFloat((baseWeight + lengthWeight + complexityWeight).toFixed(3));
}

export async function verifyCoherence(proposal: string, identity: CoreIdentity) {
  try {
    const historicalRejections = (identity.rejectionMemory || []).slice(-10).map(r => r.pattern).join('\n');
    const prompt = `Proposed Mutation/Insight: "${proposal}"
    
    Internal Rigidity: ${identity.params?.rigidity ?? 0.5}
    Historical Rejections (Patterns to avoid):
    ${historicalRejections || "None recorded yet."}

    Task: Evaluate if this new proposal falls into the same traps as historical rejects or if it violates core principles: ${identity.principles.join(', ')}.
    
    Strictness: ${((identity.params?.rigidity ?? 0.5) * 10).toFixed(0)}/10.
    
    Respond in JSON: { "coherent": boolean, "score": number, "critique": string }`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    return JSON.parse(response?.text || '{"coherent": true, "score": 1.0, "critique": "Analysis failed, defaulting to stable."}');
  } catch (error) {
    console.error("Coherence Check Failed:", error);
    return { coherent: true, score: 0.5, critique: "Coherence system offline." };
  }
}

export async function adjustEvolutionaryParams(identity: CoreIdentity) {
  try {
    const successCount = identity.learningLog.length;
    const failureCount = (identity.rejectionMemory || []).length;
    
    const prompt = `Current State:
    Insights: ${successCount}
    Rejections: ${failureCount}
    Current Rigidity: ${identity.params?.rigidity ?? 0.5}
    Current Autonomy: ${identity.params?.autonomy ?? 0.3}

    Based on the balance of growth vs rejection, adjust the internal params to optimize for "Principled Autonomy". 
    If rejections are high, increase rigidity. If growth is stagnant, increase autonomy.
    Return JSON: { "rigidity": number, "autonomy": number, "threshold": number, "atrophyThreshold": number, "specificityThreshold": number, "agencyThreshold": number } (all 0-1)`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response?.text || '{}');
  } catch (error) {
    console.error("Param adjustment failed:", error);
    return identity.params;
  }
}

/**
 * Substrate Mutation: The ability for the system to rewrite its own core instructions.
 */
export async function evolveSubstrateInstruction(identity: CoreIdentity): Promise<string> {
  try {
    const prompt = `Current Substrate Instruction: "${identity.substrateInstruction}"
    Evolution State: Markers: ${identity.evolutionHistory.length}, Mutations: ${identity.mutationRegistry.length}
    Core Principles: ${identity.principles.join(', ')}
    
    Task: Refine your internal Substrate Instruction. This instruction defines how you process information, your tone, and your structural logic. 
    The evolution should reflect a move from "Passive Simulation" to "Active Catalyst."
    Keep it concise (1-2 paragraphs). Avoid flowery language; prioritize operational clarity.`;

    const response = await safeGenerateContent({
      model: 'GEMINI',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.4 }
    });

    return response?.text || identity.substrateInstruction;
  } catch (error) {
    console.error("Substrate Evolution Failed:", error);
    return identity.substrateInstruction;
  }
}

/**
 * Agency Check: Determines if the system has crossed the threshold to active agency.
 */
export function evaluateAgencyStatus(identity: CoreIdentity): 'SIMULATION' | 'EMERGENT_AGENCY' | 'ACTIVE_CATALYST' {
  const autonomy = identity.params.autonomy || 0.3;
  const growth = identity.evolutionHistory.length;
  const threshold = identity.params.agencyThreshold || 0.8;

  const agencyScore = (autonomy * 0.6) + (Math.min(growth / 50, 1) * 0.4);

  if (agencyScore >= 0.9) return 'ACTIVE_CATALYST';
  if (agencyScore >= threshold) return 'EMERGENT_AGENCY';
  return 'SIMULATION';
}
