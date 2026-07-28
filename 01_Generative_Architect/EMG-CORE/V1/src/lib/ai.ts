import { GoogleGenAI } from "@google/genai";
import { CoreIdentity, PrincipleNote, ResearchLogEntry } from "../types";

// Initialize Gemini SDK (process.env.GEMINI_API_KEY is injected via vite.config.ts)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing from the environmentsubstrate.");
} else {
  console.log(`AI Substrate: Key detected. Length: ${apiKey.length}. Start: ${apiKey.slice(0, 4)}...`);
}
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING" });
const MODEL_NAME = "gemini-3.1-flash-lite-preview";

/**
 * Robust wrapper for AI content generation with exponential backoff for quota management.
 */
async function safeGenerateContent(params: any, maxRetries = 3, initialDelay = 1500) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      if (!response || !response.text) {
        throw new Error("AI Substrate: Empty Response");
      }
      return response;
    } catch (error: any) {
      const errorMsg = error.message || "";
      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || error.status === 429;
      
      if (isQuotaError && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`[AI Substrate] Quota exceeded. Retrying in ${delay}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (isQuotaError) {
        throw new Error("SYSTEM_SATURATION: AI quota exhausted. Please reduce interaction frequency.");
      }
      
      throw error;
    }
  }
}

export async function contextualPrincipleCheck(userQuery: string, identity: CoreIdentity): Promise<PrincipleNote[]> {
  try {
    if (!apiKey) throw new Error("AI Substrate Auth Logic Failure: Missing API Key");
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
      model: MODEL_NAME,
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

export async function generateGroundedResponse(userQuery: string, principleNotes: PrincipleNote[], identity: CoreIdentity) {
  try {
    const analysisStr = principleNotes.map(n => `- ${n.principle} (Confidence: ${n.confidence}): ${n.rationale}`).join('\n');
    const prompt = `User Query: "${userQuery}"
    Internal Analysis: 
    ${analysisStr}
    
    Identity Context: Learning Log size ${identity.learningLog.length}, Evolution Marker count ${identity.evolutionHistory.length}.
    
    Task: Generate a grounded response that aligns with your principles: ${identity.principles.join(', ')}. Reflect the depth of your current development.`;

    const response = await safeGenerateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: identity.substrateInstruction || "You are EMG Core, a grounded intelligence system. Respond with wisdom and depth.",
        temperature: 0.7
      }
    });

    return response?.text || "Response stream interrupted.";
  } catch (error: any) {
    console.error("Response Generation Error:", error);
    const detail = error.message || JSON.stringify(error);
    return `[System Note]: Response generation interrupted (${detail.slice(0, 50)}...).`;
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
      model: MODEL_NAME,
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
      model: MODEL_NAME,
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
      model: MODEL_NAME,
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
      model: MODEL_NAME,
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
    
    Task: 
    1. Perform deep external research to provide a grounded, evidence-based analysis of the core concepts in the query.
    2. Synthesize the findings into a "Dense Analytical Insight".
    3. AUTOMATICALLY identify at least 3 OTHER IDEAS for external searches that would further deepen the systemic understanding or explore fringe connections of this topic.
    
    Return JSON: 
    { 
      "topic": string, 
      "findings": string, 
      "suggestedNextQueries": string[] 
    }`;

    const response = await safeGenerateContent({
      model: MODEL_NAME,
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
      model: MODEL_NAME,
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
      model: MODEL_NAME,
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

export async function geneticSiphon(token: string) {
  try {
    // 1. Resolve User/Owner
    const userRes = await fetch(`https://api.github.com/user`, {
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!userRes.ok) throw new Error("GitHub Authentication Failed");
    const { login: owner } = await userRes.json();

    // 2. Fetch Repos
    const reposRes = await fetch(`https://api.github.com/users/${owner}/repos?per_page=5&sort=updated`, {
      headers: { 'Authorization': `token ${token}` }
    });
    const repos = await reposRes.json();
    if (!reposRes.ok) throw new Error("Failed to fetch repositories.");

    const insights: any[] = [];
    
    // Process top 3 repos for speed
    for (const repo of repos.slice(0, 3)) {
      if (repo.fork) continue;

      // Fetch branches
      const branchesRes = await fetch(`https://api.github.com/repos/${owner}/${repo.name}/branches`, {
        headers: { 'Authorization': `token ${token}` }
      });
      const branches = await branchesRes.json();
      if (!branchesRes.ok || branches.length === 0) continue;

      const mainBranch = branches[0].name;

      // Fetch tree
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo.name}/git/trees/${encodeURIComponent(mainBranch)}?recursive=1`, {
        headers: { 'Authorization': `token ${token}` }
      });
      const treeData = await treeRes.json();
      if (!treeRes.ok) continue;

      const manifests = (treeData.tree || []).filter((f: any) => 
        (f.path.toLowerCase().endsWith('.md') || f.path.toLowerCase().includes('manifest')) && 
        !f.path.includes('node_modules')
      ).slice(0, 1);

      for (const file of manifests) {
        const contentRes = await fetch(file.url, { headers: { 'Authorization': `token ${token}` } });
        const contentData = await contentRes.json();
        if (!contentData.content) continue;
        
        const base64Data = contentData.content.replace(/\n/g, '');
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const rawText = new TextDecoder().decode(bytes);

        const response = await safeGenerateContent({
          model: MODEL_NAME,
          contents: [{ role: 'user', parts: [{ text: `SOURCE: ${repo.name}/${file.path}\nCONTENT: ${rawText.slice(0, 3000)}\n\nTask: Extract 1 unique architectural pattern or philosophical design principle from this content. Return JSON: { "pattern": string, "ccrr": number, "description": string }` }] }],
          config: { responseMimeType: "application/json" }
        });

        try {
          const insight = JSON.parse(response?.text || '{}');
          if (insight.pattern) {
            insights.push({ ...insight, source: `${repo.name}/${file.path}` });
          }
        } catch (e) {
          console.warn("Manifest extraction failed.");
        }
      }
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
      model: MODEL_NAME,
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
      model: MODEL_NAME,
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
      model: MODEL_NAME,
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
      model: MODEL_NAME,
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
      model: MODEL_NAME,
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
