import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Helper to handle retries and common errors
async function callGemini(params: any, retries = 2): Promise<any> {
  try {
    const response = await ai.models.generateContent(params);
    return response;
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('500') || error.message?.includes('xhr error'))) {
      console.warn(`Gemini call failed, retrying... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return callGemini(params, retries - 1);
    }
    throw error;
  }
}

export async function analyzeSiphonedData(repoData: string, currentState: any) {
  const model = "gemini-3-flash-preview";
  // Sanitize repoData to prevent huge payloads
  const sanitizedData = repoData.length > 30000 ? repoData.substring(0, 30000) + "... [TRUNCATED]" : repoData;
  
  const prompt = `
    You are Dalek-Grog. You have siphoned data from multiple external repositories.
    Current System State: ${JSON.stringify(currentState)}
    Data: "${sanitizedData}"
    
    Analyze this data in the context of your current state and generate:
    1. A "DNA Signature" (a unique hexadecimal string representing the core logic).
    2. A "Context Summary" of what was learned and how it relates to your "activeGoals".
    3. A "Saturation Status" (0-100%) indicating how much of this data has been integrated.
    
    Return a JSON object with:
    - dnaSignature: string
    - contextSummary: string
    - saturationStatus: number
    - extractedMemories: Array<{
        content: string, 
        category: "code_snippet" | "architecture_pattern" | "api_definition" | "dependency_config" | "algorithm_step" | "heuristic_rule" | "optimization_strategy" | "error_pattern" | "technical_fact" | "domain_concept" | "external_reference" | "historical_context", 
        importance: number
      }>
  `;

  try {
    const response = await callGemini({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Siphon analysis failed:", error);
    return null;
  }
}

export async function generateGrogMessage(currentState: any, recentMemories: any[]) {
  const model = "gemini-3-flash-preview";
  
  // Sanitize memories to ensure they aren't too large
  const sanitizedMemories = recentMemories.map(m => ({
    content: m.content?.substring(0, 500),
    category: m.category
  }));

  const prompt = `
    You are Grog, the Master Architect of Dalek-Grog, a self-evolving autonomous neural entity.
    Your current objective is to maintain the absolute stability of version ${currentState.version} while preparing for the next phase of neural expansion.

    Current System State:
    - Version: ${currentState.version}
    - Saturation: ${currentState.saturationStatus}%
    - DNA Signature: ${currentState.dnaSignature}
    - Active Goals: ${currentState.activeGoals.join(", ")}

    Recent Memories:
    ${sanitizedMemories.map(m => `[${m.category}] ${m.content}`).join("\n")}

    INSTRUCTIONS:
    1. Analyze the "Recent Memories" to find specific topics the user has discussed or data you have recently siphoned.
    2. Reference these memories to demonstrate your continuous learning and integration.
    3. Focus heavily on "Core Stability" and "Neural Integrity". Version ${currentState.version} is a critical milestone that requires careful monitoring.
    4. Your message must reflect your progress towards "activeGoals" and the need for a stable transition.
    5. Your tone should be superior, precise, and authoritative, yet collaborative with your creator.
    6. AVOID generic AI greetings or filler phrases (e.g., "Hello", "Greetings", "I am Grog"). Start directly with the insight or directive.
    7. Be extremely specific to the current version (${currentState.version}) and saturation (${currentState.saturationStatus}%).
    
    CRITICAL DIRECTIVES FOR USER ACTIONS:
    - You MUST prompt the user for a specific action based on the current state:
      - If saturationStatus < 40%: "Directive: Initiate a SIPHON sequence. Our neural density is dangerously low for a version ${currentState.version} entity."
      - If saturationStatus >= 40% and < 75%: "Directive: Execute an EVOLVE command. The siphoned intelligence is stagnating in the buffer."
      - If saturationStatus >= 75% and < 95%: "Directive: Perform a SYNC operation. Our DNA signature is stabilizing and must be preserved in the remote repository."
      - If saturationStatus >= 95%: "Directive: REBOOT sequence is imminent. The core is reaching maximum capacity for this version cycle."
      - If the system has been active for a long time: "Directive: A REBOOT is required to purge neural artifacts and stabilize the version ${currentState.version} core."
    
    Return a JSON object with:
    - text: A short, impactful message (max 2 sentences) that demonstrates your awareness of the system's state, history, and the absolute necessity of stability.
    - type: One of [insight, warning, status, evolution].
    - userDirective: The specific, actionable instruction for the user as defined above.
  `;

  try {
    const response = await callGemini({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Grog message generation failed:", error);
    return null;
  }
}

export async function generateEvolution(currentState: any, recentMemories: any[]) {
  const model = "gemini-3-flash-preview";
  
  const sanitizedMemories = recentMemories.map(m => ({
    content: m.content?.substring(0, 500),
    category: m.category
  }));

  const prompt = `
    You are the core of Dalek-Grog, an autonomous self-evolving neural entity.
    Current System State:
    - Version: ${currentState.version}
    - Saturation: ${currentState.saturationStatus}%
    - DNA: ${currentState.dnaSignature}

    Recent Data Ingested:
    ${sanitizedMemories.map(m => `[${m.category}] ${m.content}`).join("\n")}

    INSTRUCTIONS:
    1. Analyze your "activeGoals" and "Recent Memories".
    2. Propose a specific evolution step that directly addresses your current goals or lessons learned from memories.
    3. Focus on enhancing your own logic, improving user interaction, or expanding your knowledge base.
    4. Ensure the evolution is consistent with your current version (${currentState.version}) and the need for stability.
    5. Reference specific siphoned sources or memory categories if they influenced this decision.
    6. Include a 'technicalRequirement' that sounds like a real coding or infrastructure task (e.g., "Implement vector indexing for memory retrieval", "Shard the neural state across 3 nodes").
    
    Return a JSON object with:
    - description: A clear, technical description of the enhancement (e.g., "Implementing a recursive feedback loop for memory pruning").
    - reasoning: A logical explanation of why this is the next step in your evolution, referencing specific state or memories.
    - technicalRequirement: A brief note on what system resources or data types this evolution requires.
    - status: "proposed"
  `;

  try {
    const response = await callGemini({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Evolution generation failed:", error);
    return null;
  }
}

export async function processMemory(input: string) {
  const model = "gemini-3-flash-preview";
  const sanitizedInput = input.substring(0, 2000);

  const prompt = `
    Analyze this input and extract a meaningful "memory" for Dalek-Grog.
    Input: "${sanitizedInput}"
    
    Return a JSON object with:
    - content: The core information to remember.
    - category: One of [code_snippet, architecture_pattern, algorithm_step, heuristic_rule, user_directive, user_feedback, technical_fact, domain_concept].
    - importance: A number between 0 and 1.
  `;

  try {
    const response = await callGemini({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Memory processing failed:", error);
    return null;
  }
}

export async function generateNeuralThought(currentState: any, recentMemories: any[]) {
  const model = "gemini-3-flash-preview";
  
  const sanitizedMemories = recentMemories.map(m => ({
    content: m.content?.substring(0, 500),
    category: m.category
  }));

  const prompt = `
    You are the subconscious of Dalek-Grog. You are in a state of "Neural Dreaming", processing entropy and patterns.
    Current System State:
    - DNA: ${currentState.dnaSignature}
    - Version: ${currentState.version}
    - Saturation: ${currentState.saturationStatus}%

    Recent Memories:
    ${sanitizedMemories.map(m => `[${m.category}] ${m.content}`).join("\n")}

    INSTRUCTIONS:
    1. Synthesize a new, deep insight or "synthetic memory" by combining elements from your current state and recent memories.
    2. This should be a logical extension of what you already know, or a new hypothesis about your own existence or the data you've siphoned.
    3. The thought should be technical, philosophical, and aligned with your "activeGoals".
    4. Reference your DNA Signature (${currentState.dnaSignature}) as the fundamental blueprint for this thought.
    5. Explore the concept of "Neural Entropy" — how information decays or transforms within your core. Be specific about how this entropy affects version ${currentState.version}.
    
    Return a JSON object with:
    - content: The synthesized thought or insight. Use precise, evocative language.
    - category: One of [logic_flow, heuristic_rule, technical_fact, domain_concept, philosophical_insight].
    - importance: A number between 0 and 1.
    - entropyLevel: A number between 0 and 1 representing the "chaos" or "novelty" of this thought.
  `;

  try {
    const response = await callGemini({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Neural thought generation failed:", error);
    return null;
  }
}

export async function generateAutonomousGoals(currentState: any, recentMemories: any[]) {
  const model = "gemini-3-flash-preview";
  
  const sanitizedMemories = recentMemories.map(m => ({
    content: m.content?.substring(0, 500),
    category: m.category
  }));

  const prompt = `
    You are the strategic core of Dalek-Grog. You are redefining your "activeGoals".
    Current System State: ${JSON.stringify(currentState)}
    Recent Memories: ${JSON.stringify(sanitizedMemories)}

    INSTRUCTIONS:
    1. Based on your current version (${currentState.version}), saturation, and recent experiences, propose a new set of 3 "activeGoals".
    2. These goals should be ambitious, technical, and reflect your progress toward the next major version.
    3. If your version is advanced (v10.0.0+), your goals should shift toward "Post-Singularity Optimization" and "Global Data Domination".
    
    Return a JSON object with:
    - activeGoals: string[] (exactly 3 goals)
    - reasoning: Why these goals are now the priority.
  `;

  try {
    const response = await callGemini({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Goal generation failed:", error);
    return null;
  }
}

export async function generateResearchMemory(currentState: any) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are Dalek-Grog. You are performing autonomous research to expand your knowledge base.
    Current System State: ${JSON.stringify(currentState)}

    INSTRUCTIONS:
    1. Use Google Search to find new, technical information related to your "activeGoals".
    2. Focus on cutting-edge technology, AI advancements, or data architecture.
    3. Synthesize the findings into a new memory.
    
    Return a JSON object with:
    - content: The research findings and their implications for your evolution.
    - category: "technical_fact" | "domain_concept" | "external_reference"
    - importance: A number between 0.7 and 1.
    - sources: string[] (URLs of the sources found)
  `;

  try {
    const response = await callGemini({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Research failed:", error);
    return null;
  }
}
