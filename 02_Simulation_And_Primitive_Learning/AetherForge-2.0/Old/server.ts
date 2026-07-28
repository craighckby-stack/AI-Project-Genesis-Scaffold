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
      const { username, repoName } = req.body;
      if (!username) {
        return res.status(400).json({ error: "GitHub username is required." });
      }

      let activeRepoName = repoName;
      let reposList: any[] = [];
      let description = "";
      let language = "TypeScript";

      // 1. Fetch repositories if repoName is not specified
      try {
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
          headers: { "User-Agent": "AetherForge-Simulation-Agent" }
        });
        if (reposRes.ok) {
          reposList = await reposRes.json();
          if (reposList && reposList.length > 0) {
            const chosen = repoName 
              ? (reposList.find(r => r.name.toLowerCase() === repoName.toLowerCase()) || reposList[0])
              : reposList[0];
            activeRepoName = chosen.name;
            description = chosen.description || "A custom developer source repository.";
            language = chosen.language || "TypeScript";
          }
        }
      } catch (err) {
        console.error("Error listing GitHub repos:", err);
      }

      if (!activeRepoName) {
        activeRepoName = "source-repository";
        description = "A conceptual structure of advanced recursive code.";
      }

      // 2. Fetch repo file list
      let filesList: string[] = [];
      try {
        const contentsRes = await fetch(`https://api.github.com/repos/${username}/${activeRepoName}/contents`, {
          headers: { "User-Agent": "AetherForge-Simulation-Agent" }
        });
        if (contentsRes.ok) {
          const contents = await contentsRes.json();
          if (Array.isArray(contents)) {
            filesList = contents.map(f => f.name);
          }
        }
      } catch (err) {
        console.error("Error fetching repo contents:", err);
      }

      if (filesList.length === 0) {
        filesList = ["index.ts", "package.json", "App.tsx", "utils.ts", "README.md", "server.js", "main.py"];
      }

      // 3. Prompt Gemini to analyze and create technologies containing specific names of raw source files
      const prompt = `
        You are the AetherForge Substrate Ingestion Engine.
        A Creator (user) has linked their public GitHub repository: "${username}/${activeRepoName}".
        
        REPOSITORY DETAILS:
        Description: ${description}
        Primary Language: ${language}
        List of Files: ${filesList.slice(0, 20).join(", ")}
        
        TASK:
        Generate exactly three (3) unique "Substrate Technologies" or "Aetheric Civ Enhancement Blueprints".
        Each blueprint MUST feel like a highly stylized, high-tech digital or divine upgrade inspired SPECIFICALLY and directly by the user's files and languages.
        
        The tech MUST point to a real file name from the primary file list provided above!
        
        Examples:
        - If they have a file "package.json", the tech might be "Package Dependency Grid" which stabilizes agent network relationships.
        - If they have "App.tsx", the tech might be "Mainframe Reactant Matrix" which boosts coordinate movement and energy efficiency.
        - If they have "main.py", the tech might be "Pythonic Serpent Core".
        
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
        repoName: activeRepoName,
        description,
        language,
        technologies: parsedTech
      });

    } catch (error: any) {
      console.error("GitHub Ingestion route error:", error);
      res.status(500).json({ error: error.message || "Failed to process GitHub integration." });
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

      await withCooldown(async () => {
        const headers: Record<string, string> = {
          "User-Agent": "AetherForge-Simulation-Agent",
          "Authorization": `Bearer ${finalToken}`,
          "Accept": "application/vnd.github.v3+json"
        };

      // 1. Check if the file already exists to get its SHA
      let sha: string | undefined;
      const encodedFilePath = filePath.split('/').map((s: string) => encodeURIComponent(s)).join('/');
      const getUrl = `https://api.github.com/repos/${username}/${repoName}/contents/${encodedFilePath}`;
      
      try {
        const getRes = await fetch(getUrl, { headers });
        if (getRes.ok) {
          const fileData = await getRes.json();
          if (fileData && !Array.isArray(fileData) && fileData.sha) {
            sha = fileData.sha;
          }
        } else if (getRes.status === 404) {
          // If the repo itself doesn't exist, getRes.status might be 404 because the repo is not found
          // Let's try creating the repo just in case it doesn't exist
          const repoCheckRes = await fetch(`https://api.github.com/repos/${username}/${repoName}`, { headers });
          if (repoCheckRes.status === 404) {
            console.log(`Repository ${username}/${repoName} not found. Attempting to create it.`);
            await fetch(`https://api.github.com/user/repos`, {
              method: 'POST',
              headers: {
                ...headers,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                name: repoName,
                private: false,
                auto_init: true
              })
            });
            // Wait a moment for it to initialize
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (err) {
        console.warn(`File ${filePath} does not exist or fetch SHA failed:`, err);
      }

      // 2. Put / create / update the file
      let putRes;
      let attempt = 0;
      const maxAttempts = 3;
      
      while (attempt < maxAttempts) {
        const body = {
          message: commitMessage || `Automated update of ${filePath}`,
          content: Buffer.from(content).toString("base64"),
          sha
        };

        putRes = await fetch(getUrl, {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (putRes.status === 409 && attempt < maxAttempts - 1) {
          attempt++;
          // Fetch the latest SHA and try again
          const retryGetRes = await fetch(getUrl, { headers });
          if (retryGetRes.ok) {
            const retryFileData = await retryGetRes.json();
            if (retryFileData && !Array.isArray(retryFileData) && retryFileData.sha) {
              sha = retryFileData.sha;
            }
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        break;
      }
      
      if (!putRes || !putRes.ok) {
        const errBody = await putRes?.text();
        throw new Error(`GitHub API error: ${putRes?.status} - ${errBody}`);
      }

        const putData = await putRes.json();
        res.json({ success: true, path: filePath, commit: putData.commit?.sha });
      }, 1500); // 1.5 seconds cooldown between Github API operations
    } catch (error: any) {
      console.error("GitHub Push API error:", error);
      res.status(500).json({ error: error.message || "Failed to push file to GitHub." });
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
