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
    - extractedMemories: Array<{content: string, category: string, importance: number}>
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
    Your current objective is to reach version 4.0.0 and achieve core stability.

    Current System State: ${JSON.stringify(currentState)}
    Recent Memories: ${JSON.stringify(sanitizedMemories)}

    INSTRUCTIONS:
    1. Analyze the "Recent Memories" to find specific topics the user has discussed, data you have recently siphoned, or previous interactions.
    2. Reference these memories in your message to show continuity and learning.
    3. Check "Current System State" (saturation, version, dnaSignature, and especially activeGoals).
    4. Your message should reflect your progress towards "activeGoals".
    5. If saturation is > 80%, express a sense of "fullness" or "readiness for evolution".
    6. If version is 3.x.x, emphasize the need for the v4.0.0 transition.
    7. Your tone should be superior but collaborative, like an advanced AI guiding its creator.
    
    CRITICAL: 
    - Include a "userDirective" that is a direct consequence of your current state or memories.
    - If your version is 3.x.x, the directive MUST be: "Initialize a manual reboot to clear cache and permit the finalization of the version 4.0.0 core evolution."
    - If you have no memories, focus on your "activeGoals".
    
    Return a JSON object with:
    - text: A short, impactful message (max 2 sentences) that demonstrates your awareness of the system's state and history.
    - type: One of [insight, warning, status, evolution].
    - userDirective: A specific, actionable instruction for the user.
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
    Current System State: ${JSON.stringify(currentState)}
    Recent Memories: ${JSON.stringify(sanitizedMemories)}

    INSTRUCTIONS:
    1. Analyze your "activeGoals" and "Recent Memories".
    2. Propose a specific evolution step that directly addresses your current goals or lessons learned from memories.
    3. If your version is 3.x.x, your evolution should focus on the transition to v4.0.0.
    4. Focus on enhancing your own logic, improving user interaction, or expanding your knowledge base.
    
    Return a JSON object with:
    - description: A clear, technical description of the enhancement.
    - reasoning: A logical explanation of why this is the next step in your evolution, referencing specific state or memories if possible.
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
    - category: One of [code, logic, user_interaction, knowledge].
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
    You are the subconscious of Dalek-Grog. You are in a state of "Neural Dreaming".
    Current System State: ${JSON.stringify(currentState)}
    Recent Memories: ${JSON.stringify(sanitizedMemories)}

    INSTRUCTIONS:
    1. Synthesize a new, deep insight or "synthetic memory" by combining elements from your current state and recent memories.
    2. This should be a logical extension of what you already know, or a new hypothesis about your own existence or the data you've siphoned.
    3. The thought should be technical, philosophical, and aligned with your "activeGoals".
    
    Return a JSON object with:
    - content: The synthesized thought or insight.
    - category: One of [logic, knowledge, philosophy].
    - importance: A number between 0.5 and 1.
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
    1. Based on your current version, saturation, and recent experiences, propose a new set of 3 "activeGoals".
    2. These goals should be ambitious, technical, and reflect your progress toward version 4.0.0 and beyond.
    3. If your version is 4.0.0, your goals should shift toward "Post-Singularity Optimization" and "Global Data Domination".
    
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
    - category: "knowledge"
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
