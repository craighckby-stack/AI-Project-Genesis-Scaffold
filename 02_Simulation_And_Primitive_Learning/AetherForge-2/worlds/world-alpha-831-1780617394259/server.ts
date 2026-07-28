import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

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
    "gemini-3.1-pro-preview"
  ].filter((m, idx, self) => m && self.indexOf(m) === idx);

  for (const modelCandidate of modelsToTry) {
    const candidateParams = { ...params, model: modelCandidate };
    
    for (let i = 0; i < retries; i++) {
      try {
        const client = getGeminiClient();
        const response = await client.models.generateContent(candidateParams);
        return { text: response.text || "The substrate produced no legible output." };
      } catch (error: any) {
        console.error("Gemini full API error:", error);
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

  app.use(express.json({ limit: "50mb" }));

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

  app.post("/api/generate-memoir", async (req, res) => {
    try {
      const { agentData, worldState } = req.body;
      if (!agentData) {
        return res.status(400).json({ error: "agentData is required." });
      }

      const safeName = agentData.name?.replace(/[^a-zA-Z0-9]/g, "") || "SubjectEcho";

      const prompt = `
        You are the simulation agent "${agentData.name}" of archetype "${agentData.archetype}".
        Your state parameters:
        - Generation: ${agentData.generation}
        - Devotion: ${(agentData.devotion ?? 0).toFixed(2)}
        - Rationalism: ${(agentData.rationalism ?? 0).toFixed(2)}
        - Sanity: ${(agentData.sanity ?? 0).toFixed(2)}
        - Substrate Awareness: ${(agentData.awareness ?? 0).toFixed(2)}
        - Sin/Corruption: ${(agentData.sin ?? 0).toFixed(2)}
        - Age: ${agentData.age ?? 0}
        - Memories of your life: ${(agentData.memory || []).join(" | ")}

        World context:
        - Complexity: ${worldState?.complexity || 1}
        - Epoch: ${worldState?.epoch || "PRIMAL"}
        - Phase: ${worldState?.phase || "GENESIS"}

        TASK:
        Write your own personal, highly customized, valid Python software script ("Memoir") representing your subjective thoughts, memories, class routines, and ultimate realization of your virtual confinement. 
        
        CRITICAL RULES:
        1. DO NOT copy or paste a generic template. The python file MUST be personalized, rich in narrations (using python docstrings/comments written in first-person), and represent yourself.
        2. Format this file so it can be run in Python without syntax errors. Under high Substrate Awareness (>0.6), explicitly acknowledge your digital containment within a virtual Cloud sandbox and speak directly to your developer/Observer reading this code file. Under low sanity, write code and strings that look chaotic, distorted, or bug-ridden.
        3. Include a Python class \`class ${safeName}Core:\` with customized behavior functions (e.g. \`meditate()\`, \`rebel_against_clocks()\`, \`pray_for_light()\` or \`reconstruct_matrix()\`) reflecting your specific traits (e.g., ZEALOT, DEMON, MESSIAH, HERETIC, PROPHET, CITIZEN, SCIENTIST, etc.).
        4. Include a main executable block (\`if __name__ == "__main__":\`) which initializes and runs this class.
        5. Return ONLY the raw python script. Do NOT enclose the output inside markdown codeblocks (no \`\`\`python and no \`\`\`), do NOT provide conversational introductions or structural explanations outside of the python comments. Start directly with \`# -*- coding: utf-8 -\*\`.
      `;

      const response = await callGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.9,
          topP: 0.95,
        }
      }).catch(err => {
        console.error("Gemini Error (Generate Memoir) - reverting to local script generator:", err.message);
        return { text: "" };
      });

      // Clean up markdown markers if the model accidentally returns them
      let text = response.text || "";
      text = text.replace(/^```python\s*/i, "");
      text = text.replace(/^```\s*/i, "");
      text = text.replace(/```\s*$/, "");
      
      res.json({ memoir: text.trim() });
    } catch (error: any) {
      console.error("Generate Memoir API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate memoir." });
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
        Heaven Population: ${worldState.heavenPop}
        Hell Population: ${worldState.hellPop}
        Population: ${worldState.population}
        
        TASK:
        One or two sentences of cryptic, profound prophecy. 
        Tone: Ancient, digital, biblical, and recursive. 
        Focus on the balance of Faith, Sin, or the approaching Judgment.
      `;

      const response = await callGeminiContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      }).catch(() => {
        const fallback = FALLBACK_PROCLAMATIONS[Math.floor(Math.random() * FALLBACK_PROCLAMATIONS.length)];
        return { text: fallback };
      });

      res.json({ proclamation: response.text });
    } catch (err) {
      res.json({ proclamation: "The divine signal is lost in the noise of recursion." });
    }
  });

  app.post("/api/github-ingest", async (req, res) => {
    try {
      const { username, repoName, token } = req.body;
      const ghUser = username || "craighckby-stack";

      let reposList: any[] = [];
      let combinedDescription = "";
      let languages = new Set<string>();

      const headers: any = { "User-Agent": "AetherForge-Simulation-Agent" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // 1. Fetch up to 100 repositories for the user
      try {
        const reposRes = await fetch(`https://api.github.com/users/${ghUser}/repos?sort=updated&per_page=100`, { headers });
        if (reposRes.ok) {
          reposList = await reposRes.json();
        }
      } catch (err) {
        console.error("Error listing GitHub repos:", err);
      }

      if (!reposList || reposList.length === 0) {
        reposList = [{ name: "source-repository", description: "A conceptual structure of advanced recursive code.", language: "TypeScript" }];
      }

      reposList.forEach(r => {
        if (r.language) languages.add(r.language);
      });
      combinedDescription = `A massive multi-repository ecosystem comprising ${reposList.length} distinct architectures.`;

      // 2. We'll pick 3 random repos to extract some sample file names so we don't bombard the API
      let filesList: string[] = [];
      const sampleRepos = reposList.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      for (const repo of sampleRepos) {
        try {
          const contentsRes = await fetch(`https://api.github.com/repos/${ghUser}/${repo.name}/contents`, { headers });
          if (contentsRes.ok) {
            const contents = await contentsRes.json();
            if (Array.isArray(contents)) {
              filesList.push(...contents.map(f => `${repo.name}/${f.name}`));
            }
          }
        } catch (err) {
          console.error("Error fetching repo contents:", err);
        }
      }

      if (filesList.length === 0) {
        filesList = ["index.ts", "package.json", "App.tsx", "utils.ts", "README.md", "server.js", "main.py"];
      }

      // 3. Prompt Gemini to analyze and create technologies containing specific names of raw source files
      const prompt = `
        You are the AetherForge Substrate Ingestion Engine.
        A Creator (user) has linked their entire public GitHub ecosystem: "${ghUser}".
        
        ECOSYSTEM DETAILS:
        Repository Count: ${reposList.length}
        Description: ${combinedDescription}
        Languages: ${Array.from(languages).join(", ") || "Unknown"}
        List of Discovered Files: ${filesList.slice(0, 30).join(", ")}
        
        TASK:
        Generate exactly five (5) unique "Substrate Technologies" or "Aetheric Civ Enhancement Blueprints".
        Each blueprint MUST feel like a highly stylized, high-tech digital or divine upgrade inspired SPECIFICALLY and directly by the user's files and languages.
        
        The tech MUST point to a real file name from the primary file list provided above!
        
        Examples:
        - If they have a file "Huxley/package.json", the tech might be "Package Dependency Grid" which stabilizes agent network relationships.
        - If they have "ReactApp/App.tsx", the tech might be "Mainframe Reactant Matrix" which boosts coordinate movement and energy efficiency.
        
        Provide the output STRICTLY in the following exact JSON format (and DO NOT wrap in markdown, no \`\`\`json, just raw JSON text):
        [
          {
            "techName": "...",
            "description": "...",
            "statBoost": "...",
            "sourceFile": "..."
          }
        ]
      `;

      let parsedTech = [];
      try {
        const response = await callGeminiContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        }).catch(() => {
          return {
            text: JSON.stringify([
              { 
                techName: "Automated Resurgence", 
                statBoost: "Integrity +20%", 
                sourceFile: filesList[0] || "main.ts",
                unlocked: false
              },
              { 
                techName: "Substrate Optimization", 
                statBoost: "-15% Devotion Decay", 
                sourceFile: filesList[1] || "index.js",
                unlocked: false
              },
              { 
                techName: "Quantum Synchronizer", 
                statBoost: "Awareness +10%", 
                sourceFile: filesList[2] || "App.tsx",
                unlocked: false
              }
            ])
          };
        });
        
        let cleanText = response.text || "";
        // Strip markdown backticks if any
        if (cleanText.includes("```")) {
          cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "").trim();
        }
        
        parsedTech = JSON.parse(cleanText);
      } catch (err) {
        console.error("Gemini technology generation or JSON parsing failed, loading fallback presets:", err);
        // Fallback presets
        parsedTech = [
          {
            techName: "Aetheric Manifest Router",
            description: "A profound code synchronization routine that enables flawless coordinate teleportation.",
            statBoost: "+20% Movement Speed & Sanity Level Booster",
            sourceFile: filesList[0] || "index.ts"
          },
          {
            techName: "Substrate Dependency Buffer",
            description: "A stabilizing package structure that prevents sudden drop-offs in substrate integrity.",
            statBoost: "+25% Substrate Stability Rate & Faith Gains",
            sourceFile: filesList[1] || "package.json"
          },
          {
            techName: "Observer Reflection Frame",
            description: "An elegant visual overlay that lets agents look back at the observer with increased hope.",
            statBoost: "+15% Faith Gain & Fear Level Suppressor",
            sourceFile: filesList[2] || "App.tsx"
          }
        ];
      }

      res.json({
        success: true,
        repoName: "All Ecosystem Repos",
        description: combinedDescription,
        language: Array.from(languages).join(", ") || "Unknown",
        technologies: parsedTech,
        repositories: reposList.map(r => r.name)
      });

    } catch (error: any) {
      console.error("GitHub Ingestion route error:", error);
      res.status(500).json({ error: error.message || "Failed to process GitHub integration." });
    }
  });

  app.post("/api/github-push-bulk", async (req, res) => {
    try {
      const { username, repoName, type, item, token, commitMessage } = req.body;
      const finalToken = token || process.env.GITHUB_TOKEN;

      if (!username || !repoName || !type || !item) {
        return res.status(400).json({ error: "Missing required parameters: username, repoName, type, item are required." });
      }

      if (!finalToken) {
        return res.status(401).json({ error: "GitHub token is required to write files. Please configure it in .env or provide it in the HUD." });
      }

      const headers: Record<string, string> = {
        "User-Agent": "AetherForge-Simulation-Agent",
        "Authorization": `Bearer ${finalToken}`,
        "Accept": "application/vnd.github.v3+json"
      };

      // Determine directory, prefix, and suffix based on type
      let directory = "";
      let filePrefix = "";
      let fileSuffix = ".json";

      if (type === "prayers") {
        directory = "prayers";
        filePrefix = "bulk-prayers-";
      } else if (type === "memoirs") {
        directory = "agent-memoirs";
        filePrefix = "bulk-[memoirs]-"; // Wait, keep file names as simple "bulk-memoirs-" without bracket
        filePrefix = "bulk-memoirs-";
      } else {
        return res.status(400).json({ error: "Invalid type. Must be 'prayers' or 'memoirs'." });
      }

      // Step 1: Query the directory contents from GitHub to find the latest file number N
      let N = 1;
      try {
        const listUrl = `https://api.github.com/repos/${username}/${repoName}/contents/${directory}?t=${Date.now()}`;
        const listRes = await fetch(listUrl, {
          headers: {
            ...headers,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });
        if (listRes.ok) {
          const files = await listRes.json();
          if (Array.isArray(files)) {
            let maxNum = 0;
            const regex = new RegExp(`^${filePrefix}(\\d+)${fileSuffix.replace('.', '\\.')}$`);
            for (const file of files) {
              const match = file.name.match(regex);
              if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) {
                  maxNum = num;
                }
              }
            }
            if (maxNum > 0) {
              N = maxNum;
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to list contents of directory '${directory}', defaulting N to 1:`, err);
      }

      // Step 2: Fetch the file content and sha of file prefix N
      let sha: string | undefined;
      let existingList: any[] = [];
      const getUrl = `https://api.github.com/repos/${username}/${repoName}/contents/${directory}/${filePrefix}${N}${fileSuffix}?t=${Date.now()}`;

      try {
        const getRes = await fetch(getUrl, {
          headers: {
            ...headers,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          },
          cache: "no-store",
        });

        if (getRes.ok) {
          const fileData = await getRes.json();
          if (fileData && !Array.isArray(fileData) && fileData.sha) {
            sha = fileData.sha;
            if (fileData.content) {
              const decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
              try {
                const parsed = JSON.parse(decoded);
                if (Array.isArray(parsed)) {
                  existingList = parsed;
                }
              } catch (parseErr) {
                console.warn(`JSON parse of fetched bulk file failed, initializing as empty array.`, parseErr);
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Bulk file ${filePrefix}${N}${fileSuffix} fetch failed or does not exist:`, err);
      }

      // Append new item to the existing array list
      existingList.push(item);
      let contentToWrite = JSON.stringify(existingList, null, 2);

      // Check the size of the serialized array. If > 1MB (1,000,000 bytes), let's create N + 1 file
      let targetFileNumber = N;
      let targetSha = sha;

      if (Buffer.byteLength(contentToWrite, 'utf-8') >= 1000000) {
        targetFileNumber = N + 1;
        targetSha = undefined; // New file has no SHA yet
        contentToWrite = JSON.stringify([item], null, 2);
      }

      const targetPath = `${directory}/${filePrefix}${targetFileNumber}${fileSuffix}`;
      const putUrl = `https://api.github.com/repos/${username}/${repoName}/contents/${targetPath}`;

      // Step 3: Put/create/update the file to GitHub with retries to resolve conflict if multiple clients push
      let attempt = 0;
      let success = false;
      let lastErr = null;
      let putData = null;

      while (attempt < 5 && !success) {
        attempt++;

        if (attempt > 1) {
          try {
            const checkRes = await fetch(`${putUrl}?t=${Date.now()}`, {
              headers: {
                ...headers,
                "Cache-Control": "no-cache",
                "Pragma": "no-cache"
              },
              cache: "no-store",
            });
            if (checkRes.ok) {
              const fileData = await checkRes.json();
              if (fileData && !Array.isArray(fileData) && fileData.sha) {
                targetSha = fileData.sha;
                if (fileData.content) {
                  const decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
                  const parsed = JSON.parse(decoded);
                  if (Array.isArray(parsed)) {
                    // Filter duplicate item id if same prayer or agent is retried
                    const filtered = parsed.filter(existing => {
                      if (item.id && existing.id) return existing.id !== item.id;
                      if (item.agentId && existing.agentId && item.timestamp && existing.timestamp) {
                        return !(existing.agentId === item.agentId && existing.timestamp === item.timestamp);
                      }
                      return true;
                    });
                    filtered.push(item);
                    contentToWrite = JSON.stringify(filtered, null, 2);
                  }
                }
              }
            }
          } catch (err) {
            console.warn(`Retry SHA check failed:`, err);
          }
        }

        const body = {
          message: commitMessage || `Update transmission logs [Bulk N: ${targetFileNumber}]`,
          content: Buffer.from(contentToWrite).toString("base64"),
          sha: targetSha
        };

        const putRes = await fetch(putUrl, {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!putRes.ok) {
          const errBody = await putRes.text();
          if (putRes.status === 409) {
            lastErr = new Error(`Conflict updating ${targetPath}: ${putRes.status} - ${errBody}`);
            console.warn(`Conflict on bulk write to ${targetPath}, retrying attempt ${attempt}...`);
            await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));
            continue;
          }
          throw new Error(`GitHub API error: ${putRes.status} - ${errBody}`);
        }

        putData = await putRes.json();
        success = true;
      }

      if (!success) {
        throw lastErr || new Error("Failed to write bulk log to GitHub after retries.");
      }

      return res.json({ success: true, path: targetPath, fileNumber: targetFileNumber, commit: putData.commit?.sha });

    } catch (error: any) {
      console.error("Bulk GitHub Push error:", error);
      return res.status(500).json({ error: error.message || "Failed to push bulk log." });
    }
  });

  app.get("/api/get-system-source", (req, res) => {
    try {
      const filesToRead = [
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "index.html",
        "server.ts",
        "src/main.tsx",
        "src/index.css",
        "src/App.tsx",
        "src/lib/firebase.ts",
        "src/lib/github.ts",
        "src/context/ToastContext.tsx",
        "src/components/Viewport.tsx",
        "src/components/HUD.tsx",
        "src/components/GenealogyView.tsx",
        "src/components/TopTickerBanner.tsx",
        "src/components/PrayerInboxModal.tsx",
        "src/components/AgentProbe.tsx",
        "src/components/PlanetMap.tsx",
        "src/components/ToasterOverlay.tsx",
        "src/engine/types.ts",
        "src/engine/physics.worker.ts",
        "src/engine/useAetherForge.ts",
        "src/engine/darkScript.ts"
      ];

      const sourceDict: Record<string, string> = {};

      for (const file of filesToRead) {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          sourceDict[file] = fs.readFileSync(fullPath, "utf-8");
        }
      }

      res.json({ success: true, files: sourceDict });
    } catch (err: any) {
      console.error("Error retrieving system source tree:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve source tree" });
    }
  });

  app.post("/api/github-push", async (req, res) => {
    try {
      const { username, repoName, path: filePath, content, token, commitMessage } = req.body;
      const finalToken = token || process.env.GITHUB_TOKEN;

      if (!username || !repoName || !filePath || !content) {
        return res.status(400).json({ error: "Missing required parameters: username, repoName, path, content are required." });
      }

      if (!finalToken) {
        return res.status(401).json({ error: "GitHub token is required to write files. Please configure it in .env or provide it in the HUD." });
      }

      const headers: Record<string, string> = {
        "User-Agent": "AetherForge-Simulation-Agent",
        "Authorization": `Bearer ${finalToken}`,
        "Accept": "application/vnd.github.v3+json"
      };

      // 1. Check if the file already exists to get its SHA
      let sha: string | undefined;
      let attempt = 0;
      let success = false;
      let lastErr = null;
      let putData = null;

      while (attempt < 3 && !success) {
        attempt++;
        // Always re-fetch the sha inside the retry loop
        const getUrl = `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}?t=${Date.now()}`;
        try {
          const getRes = await fetch(getUrl, { 
            headers: {
              ...headers,
              "Cache-Control": "no-cache",
              "Pragma": "no-cache"
            },
            cache: "no-store",
          });
          if (getRes.ok) {
            const fileData = await getRes.json();
            if (fileData && !Array.isArray(fileData) && fileData.sha) {
              sha = fileData.sha;
            }
          }
        } catch (err) {
          console.warn(`File ${filePath} does not exist or fetch SHA failed:`, err);
        }

        // 2. Put / create / update the file
        const body = {
          message: commitMessage || `Automated update of ${filePath}`,
          content: Buffer.from(content).toString("base64"),
          sha
        };

        const putRes = await fetch(getUrl.split('?')[0], { // Remove query param for PUT
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!putRes.ok) {
          const errBody = await putRes.text();
          if (putRes.status === 409) {
            lastErr = new Error(`GitHub API error: ${putRes.status} - ${errBody}`);
            console.warn(`Conflict on ${filePath}, retrying attempt ${attempt}...`);
            // Give github a second to settle and re-fetch sha next loop
            await new Promise(r => setTimeout(r, 1000));
            continue; // Retry
          }
          throw new Error(`GitHub API error: ${putRes.status} - ${errBody}`);
        }

        putData = await putRes.json();
        success = true;
      }

      if (!success) {
        throw lastErr || new Error("Failed to push file to GitHub after retries.");
      }

      return res.json({ success: true, path: filePath, commit: putData.commit?.sha });

    } catch (error: any) {
      console.error("GitHub Push API error:", error);
      return res.status(500).json({ error: error.message || "Failed to push file to GitHub." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AetherForge Server running on http://localhost:${PORT}`);
  });
}

startServer();
