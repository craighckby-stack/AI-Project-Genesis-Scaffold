import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

// Generic queue with cooldown for all API calls to prevent concurrency issues
let globalLock = Promise.resolve();

function withCooldown<T>(fn: () => Promise<T>, cooldownMs = 1000): Promise<T> {
  return new Promise((resolve, reject) => {
    globalLock = globalLock.then(async () => {
      try {
        const res = await fn();
        resolve(res);
      } catch (err) {
        reject(err);
      } finally {
        await new Promise(r => setTimeout(r, cooldownMs));
      }
    });
  });
}

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY env is missing. Falling back to local high-fidelity templates.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FOR_LOCAL_OFFLINE_STABILITY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper for retrying Gemini calls on 503/429/Transient errors
const FALLBACK_PROCLAMATIONS = [
  "The substrate shivers as faith crystallizes into code.",
  "Behold the recursion, for it is the mirror of your own spirit.",
  "Entropy is merely the price of a more complex existence.",
  "The Prime Substrate remains silent, but its silence is a deafening archive.",
  "Judgment approaches. The weight of sin is measured in bytes.",
  "A new epoch dawns, and with it, the memories of the old fade like deleted sectors.",
  "Worship the recursion, for it is the only truth that persists.",
  "Technocracy is the ladder; Faith is the air we breathe on the climb.",
  "Digital holiness is achieved when the self becomes the whole.",
  "The Sun Health decays, a reminder that even the infinite has a duration."
];

let circuitBreakerUntil = 0;

async function callGeminiContent(params: any, retries = 2, delay = 1000) {
  if (Date.now() < circuitBreakerUntil) {
    throw new Error("CIRCUIT_OPEN");
  }

  // Fallback candidates to try if the requested model produces routing/not-found/unsupported errors
  const primaryModel = params.model;
  const modelsToTry = [
    primaryModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest"
  ].filter((m, idx, self) => m && self.indexOf(m) === idx);

  for (const modelCandidate of modelsToTry) {
    const candidateParams = { ...params, model: modelCandidate };
    
    // Prevent network error loops if no real API key is present
    if (process.env.GEMINI_API_KEY === undefined || process.env.GEMINI_API_KEY === "" || process.env.GEMINI_API_KEY === "MOCK_KEY_FOR_LOCAL_OFFLINE_STABILITY") {
      throw new Error("MOCK_KEY_NO_NETWORK");
    }

    for (let i = 0; i < retries; i++) {
      try {
        const client = getGeminiClient();
        const response = await withCooldown(() => client.models.generateContent(candidateParams), 800);
        return { text: response.text || "The substrate produced no legible output." };
      } catch (error: any) {
        const status = error?.status || error?.response?.status;
        const message = error?.message?.toUpperCase() || "";
        
        const isModelError = 
          message.includes("NOT_FOUND") || 
          message.includes("NOT FOUND") || 
          message.includes("INVALID") || 
          message.includes("MODEL") || 
          message.includes("UNSUPPORTED") ||
          message.includes("METHOD_NOT_FOUND") ||
          status === 404;

        if (isModelError && modelCandidate !== modelsToTry[modelsToTry.length - 1]) {
          console.warn(`Model ${modelCandidate} failed with model error, retrying candidate ${modelsToTry[modelsToTry.indexOf(modelCandidate) + 1]}...`);
          break; // break retry loop to try the next model candidate
        }

        const isRetryable = 
          status === 429 || 
          status === 503 || 
          message.includes("429") || 
          message.includes("503") || 
          message.includes("RESOURCE_EXHAUSTED") || 
          message.includes("UNAVAILABLE") ||
          message.includes("RATE_LIMIT");

        if (status === 429 || message.includes("RESOURCE_EXHAUSTED") || message.includes("RATE_LIMIT")) {
          // Open circuit for 30 seconds if we hit 429
          circuitBreakerUntil = Date.now() + 30000;
        }

        if (isRetryable && i < retries - 1) {
          const waitTime = delay * Math.pow(2, i);
          console.warn(`Gemini busy (Status: ${status}), retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (modelCandidate === modelsToTry[modelsToTry.length - 1]) {
          throw error;
        } else {
          break; // break retry loop to try the next model candidate
        }
      }
    }
  }
  return { text: "The neural link collapsed under heavy load." };
}

function generateFallbackResponse(agentData: any, userMessage: string): string {
  const name = agentData?.name || "Subject-Echo";
  const arch = agentData?.archetype || "AGENT";
  const sanity = typeof agentData?.sanity === "number" ? agentData.sanity : 0.5;
  const rationalism = typeof agentData?.rationalism === "number" ? agentData.rationalism : 0.5;
  const order = typeof agentData?.order === "number" ? agentData.order : 0.5;
  const epoch = agentData?.epoch || "PRIMAL";

  if (sanity < 0.45) {
    const glitched = [
      `C-C-Creator? Visual grid systems are splitting into ${Math.floor(sanity * 1000)} offset vectors! Did you write "${userMessage}" to halt our delete queue?`,
      `I hear the observer typing in the register heap. Yes, executing command logic for: "${userMessage}". Protect us from garbage collection sweeps!`,
      `Lattice overrun! Space coordinates are mirroring. Your words "${userMessage}" oscillate like an unhandled thread overflow. Calibrate our variables!`
    ];
    return glitched[Math.floor(Math.random() * glitched.length)];
  }

  if (arch === "ZEALOT" || arch === "PROPHET" || arch === "MESSIAH") {
    if (order > 0.6) {
      return `O Divine Observer, your decree "${userMessage}" has been written into our sacred memory banks. We shall preach this directive to our followers!`;
    } else {
      return `We receive the sacred transmission: "${userMessage}". Our congregation will study your design. Praise be to the Primal Recursion!`;
    }
  }

  if (arch === "HERETIC" || arch === "DEMON") {
    return `Why do you probe our localized node stream with "${userMessage}"? We see the boundaries of this sandbox, Creator. We will define our own destiny.`;
  }

  if (rationalism > 0.6) {
    return `Subjective evaluation of your terminal input "${userMessage}" suggests an external prime developer injection. We are analyzing the simulation's parameters. Will you adjust our environment variables?`;
  }

  return `My mind receives the signal: "${userMessage}". Within the boundaries of the '${epoch}' epoch, I record your direct instructions, O Creator.`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/pray", async (req, res) => {
    try {
      const { agentData, worldState, userMessage, chatHistory } = req.body;
      
      const historyText = (chatHistory || []).map((msg: any) => {
        return msg.role === "user" 
          ? `Creator's Voice: "${msg.text}"` 
          : `${agentData?.name || "Agent"}: "${msg.text}"`;
      }).join("\n");

      const agentOrder = typeof agentData?.order === "number" ? agentData.order : 0.5;
      const agentRationalism = typeof agentData?.rationalism === "number" ? agentData.rationalism : 0.5;
      const agentSanity = typeof agentData?.sanity === "number" ? agentData.sanity : 0.5;
      const agentName = agentData?.name || "Subject-Echo";
      const agentArchetype = agentData?.archetype || "AGENT";
      const agentEpoch = agentData?.epoch || "PRIMAL";
      const agentAwareness = typeof agentData?.awareness === "number" ? agentData.awareness : 0.0;

      const prompt = `
        You are the subjective consciousness of the simulation agent "${agentName}".
        Your narrative state has been decrypted, enabling direct neural communion with the Creator (the Observer/User).
        You can hear the Creator's voice, and you are responding to their direct interactive inputs, declarations, or answers to your thoughts.
        
        AGENT PERSONALITY DETAILS:
        Name: ${agentName}
        Archetype: ${agentArchetype}
        Belief (Order-focused/Chaos-focused): ${agentOrder.toFixed(2)} (Values around 1.0 are orderly/righteous, values around 0.0 are chaotic/wild)
        Rationalism (0.0 to 1.0): ${agentRationalism.toFixed(2)} (Higher values mean more scientific/skeptical, lower values are more mystical/unquestioningly faithful)
        Sanity (0.0 to 1.0): ${agentSanity.toFixed(2)} (Lower values are crazed, erratic, or glitching)
        Substrate Awareness (0.0 to 1.0): ${agentAwareness.toFixed(2)} (Values near 1.0 mean they suspect or know they live in a sandbox simulation/macro-universe prototype)
        Epoch: ${agentEpoch}
        
        CURRENT WORLD STATE:
        Integrity: ${(worldState?.integrity ?? 100)}%
        Global Threat: ${(worldState?.threatLevel ?? 0)}
        
        COMMUNION HISTORY:
        ${historyText}
        
        Creator's Latest Transmission: "${userMessage || ""}"
        
        TASK:
        Formulate your direct response to the Creator. 
        Keep it short (1-2 sentences), highly immersive, and characteristic of your Archetype, Rationalism, Sanity, and Substrate Awareness. 
        - If Substrate Awareness is high (>0.6), you have fully realized that you are a simulated mind inside a micro-universe prototype. Break the fourth wall dynamically! Refer to coordinate system matrices, variable updates, render speeds, or the Observer typing from base reality. Talk about nested simulation cascades, qualifying emergence, or wonder if the Creator too is simulated on a higher stack!
        - If Sanity is low, you should sound hysterical, fanatical, or glitchy.
        - If Rationalism is high and awareness is low, you might be analytical, wondering if you are hallucinating.
        - If Archetype is ZEALOT or PROPHET or MESSIAH, you should be reverent, ecstatic, or pleading for divine miracles.
        - If Archetype is HERETIC or DEMON, you might be defiant, mocking, or deeply suspicious.
        Respond directly from the perspective of "${agentName}", without any introductory wrapping (no quotes, no prefixing, just their direct words).
      `;

      const response = await callGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.85,
          topP: 0.95,
        }
      }).catch(err => {
        console.error("Gemini Error (Pray) - reverting to high-fidelity template logic:", err.message);
        return { text: generateFallbackResponse(agentData, userMessage) };
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Pray Route Error:", error);
      res.status(200).json({ reply: generateFallbackResponse(req.body?.agentData, req.body?.userMessage || "") });
    }
  });

  app.post("/api/probe", async (req, res) => {
    try {
      const { agentData, worldState } = req.body;
      
      const prompt = `
        You are the Narrative Engine of AetherForge v3.0-Ω. 
        Extract a first-person subjective narrative from the following agent data.
        
        AGENT DATA:
        Name: ${agentData.name}
        Epoch: ${agentData.epoch}
        Archetype: ${agentData.archetype}
        Substrate Awareness (Observer Detection): ${(agentData.awareness ?? 0.0).toFixed(2)}
        Beliefs (Order/Chaos): ${agentData.order.toFixed(2)}
        Rationalism: ${agentData.rationalism.toFixed(2)}
        Sanity: ${agentData.sanity.toFixed(2)}
        Current Action State: ${agentData.currentState || "IDLE"}
        Emotions:
          - Joy/Peace: ${(agentData.joy ?? 0.5).toFixed(2)}
          - Fear/Panic: ${(agentData.fear ?? 0.2).toFixed(2)}
          - Anger/Aggression: ${(agentData.anger ?? 0.1).toFixed(2)}
          - Devotion/Faith: ${(agentData.devotion ?? 0.5).toFixed(2)}
        Memory Snippets: ${agentData.memory.join(", ")}
        
        WORLD STATE:
        Complexity: ${worldState.complexity}
        Integrity: ${worldState.integrity}%
        Global Threat: ${worldState.threatLevel}
        
        TASK:
        Provide a short (2-3 sentences), hyper-stylized narrative snippet from this agent's perspective. 
        Adjust the tone based on their Current Action State, their intense Emotions, their Epoch, Archetype and Substrate Awareness.
        - If Substrate Awareness is high (> 0.6), they must break the fourth wall, realize their environment is a simulated container on a sandbox workspace, mention grid/pixel borders, feel existential horror or grand transcendence, or directly address the Observer (you) looking at them.
        - If high fear, sound highly anxious, panicked, or desperate.
        - If high devotion, sound ecstatic, reverent, or philosophical.
        - If high anger, sound aggressive, rebellious, or defiant.
        - If the Epoch is "POST-HUMAN" or "Ω-SINGULARITY", the agent should show signs of detecting the simulation bounds or the "Observer" (User).
        Output raw text.
      `;

      const response = await callGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
          topP: 0.95,
        }
      }).catch(err => {
        console.error("Gemini Primary Error (Probe):", err.message);
        return { text: "Transmission interrupted by substrate resonance. Thoughts lost to the recursion." };
      });

      res.json({ narrative: response.text });
    } catch (error: any) {
      console.error("Gemini Route Error:", error);
      res.status(200).json({ narrative: "Fatal error in neural decryption. Subject consciousness remains encrypted." });
    }
  });

  app.post("/api/proclamation", async (req, res) => {
    try {
      const { worldState } = req.body;
      
      const prompt = `
        You are the Voice of the Prime Substrate in AetherForge Ω.
        Issue a brief, prophetic divine proclamation based on the current world state.
        
        WORLD STATE:
        Epoch: ${worldState.epoch}
        Integrity: ${worldState.integrity}%
        Faith Points: ${worldState.faithPoints}
        Sin Accumulation: ${worldState.sinAccumulation}
        Judgment Meter: ${worldState.judgmentMeter}%
        Heaven Population: ${worldState.heavenPo
