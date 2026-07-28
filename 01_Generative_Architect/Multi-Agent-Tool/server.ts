import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Load firebase client configuration
let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else {
    console.warn("firebase-applet-config.json not found. Client will run offline.");
  }
} catch (error) {
  console.error("Error reading firebase-applet-config.json", error);
}

// 1. Firebase configuration API
app.get("/api/firebase-config", (req, res) => {
  if (firebaseConfig) {
    res.json(firebaseConfig);
  } else {
    res.status(404).json({ error: "Firebase config not available" });
  }
});

// 2. Multi-Persona Echo Chamber + Synthesis API
app.post("/api/synthesis", async (req, res) => {
  const {
    query,
    attachments = [],
    githubRepo,
    githubToken,
    selectedPersonaIds = [],
    selectedPerspectiveIds = [],
    formality = 50,
    technicality = 50,
    rigor = 50
  } = req.body;

  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "A valid query string is required" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets."
    });
    return;
  }

  const parts: any[] = [];
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      if (att.data && att.data.startsWith('data:')) {
        const base64Data = att.data.split(',')[1];
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: base64Data
          }
        });
      }
    }
  }

  let repoContext = "";
  if (githubRepo) {
    try {
      const AdmZip = (await import('adm-zip')).default;
      const headers: any = {
        'User-Agent': 'Node.js',
        'Accept': 'application/vnd.github.v3+json'
      };
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }
      
      // Get the default branch
      let branch = "main";
      try {
        const repoInfoRes = await fetch(`https://api.github.com/repos/${githubRepo}`, { headers });
        if (repoInfoRes.ok) {
          const repoInfo = await repoInfoRes.json();
          if (repoInfo.default_branch) {
            branch = repoInfo.default_branch;
          }
        }
      } catch(e) {}

      console.log(`Fetching repo ${githubRepo} branch ${branch}...`);
      const zipRes = await fetch(`https://api.github.com/repos/${githubRepo}/zipball/${branch}`, { headers });
      if (!zipRes.ok) {
        throw new Error(`Failed to fetch repo zip: ${zipRes.statusText}`);
      }
      const arrayBuffer = await zipRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();
      
      let fileContents = "";
      let numFiles = 0;
      for (const entry of zipEntries) {
        if (entry.isDirectory) continue;
        const name = entry.name.toLowerCase();
        // Skip common binary files and large folders
        if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.pdf') || name.endsWith('.zip') || name.endsWith('.lock') || entry.entryName.includes('node_modules') || entry.entryName.includes('dist/') || entry.entryName.includes('.git/')) continue;
        
        const content = entry.getData().toString('utf8');
        // Only include if looks like text and isn't too huge
        if (content.indexOf('\0') === -1 && content.length < 50000) {
          fileContents += `\n--- File: ${entry.entryName} ---\n${content}\n`;
          numFiles++;
        }
        if (numFiles > 50) break; // Arbitrary limit to avoid massive payloads
      }
      
      repoContext = `\n\n[GITHUB REPOSITORY CONTEXT: ${githubRepo}]\n${fileContents}`;
      console.log(`Included ${numFiles} files from ${githubRepo} in context.`);
    } catch (err: any) {
      console.error("Error fetching github repo:", err);
      repoContext = `\n\n[GITHUB REPOSITORY CONTEXT: Error fetching ${githubRepo} - ${err.message}]`;
    }
  }

  parts.push({ text: query + repoContext });
  
  const baseContents = { parts };

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    // Defining the 6 Personas to match user prompt exactly
    const PERSONAS: { [key: string]: { name: string; description: string; specialty: string } } = {
      "persona_1": {
        name: "Analytical Mathematician",
        description: "Focuses on number theory, complex analysis, formal logic, and proof techniques.",
        specialty: "Number Theory & Rigorous Analysis"
      },
      "persona_2": {
        name: "Theoretical Physicist",
        description: "Focuses on quantum mechanics, statistical mechanics, and information theory.",
        specialty: "Quantum Systems & Statistical Physics"
      },
      "persona_3": {
        name: "Pure Mathematician",
        description: "Focuses on algebraic geometry, commutative algebra, and abstract functorial representations.",
        specialty: "Algebraic Geometry"
      },
      "persona_4": {
        name: "Computational Scientist",
        description: "Focuses on statistical modeling, machine learning, and algorithmic implementation.",
        specialty: "Algorithm Design & Big Data"
      },
      "persona_5": {
        name: "Systems Architect",
        description: "Focuses on distributed systems, scalable infrastructure, software patterns, and optimization.",
        specialty: "Software Architecture & Scalability"
      },
      "persona_6": {
        name: "Category Theorist",
        description: "Focuses on higher-category theory, homotopy theory, spectral sequences, and abstract maps.",
        specialty: "Higher Categories & Homotopy"
      }
    };

    // Defining the 8 Perspectives to match user prompt exactly
    const PERSPECTIVES: { [key: string]: { name: string; description: string } } = {
      "perspective_1": {
        name: "Analytic Number Theory",
        description: "Treats the Riemann Hypothesis (RH) as bounds of prime distributions using zero-density theorems."
      },
      "perspective_2": {
        name: "Spectral / Physics",
        description: "Hilbert-Polya conjecture: zeros are eigenvalues of some self-adjoint operator, connecting to quantum chaos."
      },
      "perspective_3": {
        name: "Algebraic Geometry",
        description: "Lifting Weil conjectures over finite fields to the rational field Q, seeking geometry over F1."
      },
      "perspective_4": {
        name: "Probability / Statistical",
        description: "Modeling zeros as eigenvalues of large random matrices from GUE (Gaussian Unitary Ensemble)."
      },
      "perspective_5": {
        name: "Computational / Experimental",
        description: "Finite computations, searching for counterexamples or structural patterns in low zeros."
      },
      "perspective_6": {
        name: "Functional Analysis",
        description: "Studying Hilbert or Banach spaces where zeta acts as an operator, forcing zeros on the critical line."
      },
      "perspective_7": {
        name: "Information Theory",
        description: "Treating prime distribution as encoding information, using entropy and description length constraints."
      },
      "perspective_8": {
        name: "Category / Structural",
        description: "Reframing zeta as a functor or L-function in a larger family, proving RH using symmetry and functoriality."
      }
    };

    // Helper to run Gemini with retries on 503/429
    const generateContentWithRetry = async (model: string, contents: any, config: any, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await ai.models.generateContent({ model, contents, config });
        } catch (error: any) {
          if (i === retries - 1) throw error;
          const isRetryable = error.status === 503 || error.status === 429 || 
            error.message?.includes("high demand") || error.message?.includes("UNAVAILABLE") || 
            error.message?.includes("429") || error.message?.includes("503");
          if (isRetryable) {
            console.warn(`Retryable error on ${model}, attempt ${i + 1}/${retries}. Retrying in ${Math.pow(2, i)}s...`, error.message);
            await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000 + Math.random() * 1000));
          } else {
            throw error;
          }
        }
      }
    };

    // Step 1: Run Agent Deliberation (Parallel)
    const activePersonas = selectedPersonaIds.filter((id: string) => PERSONAS[id]);
    const personaOutputs: { personaId: string; personaName: string; output: string }[] = [];

    if (activePersonas.length > 0) {
      const personaPromises = activePersonas.map(async (id: string) => {
        const persona = PERSONAS[id];
        const systemInstruction = `You are ${persona.name}, a world-class researcher specializing in ${persona.specialty}. ${persona.description}. Give a brief, insightful 2-sentence analysis or opinion on the user's query from your exact perspective. Do not include introductory text or pleasantries, start directly with your analysis.`;
        
        try {
          const response = await generateContentWithRetry("gemini-3.5-flash", baseContents, {
            systemInstruction,
            temperature: 0.7
          });
          
          return {
            personaId: id,
            personaName: persona.name,
            output: response?.text || "No response generated."
          };
        } catch (error: any) {
          console.error(`Error generating response for persona ${persona.name}:`, error);
          return {
            personaId: id,
            personaName: persona.name,
            output: `Agent computation failed: ${error.message}`
          };
        }
      });

      const outputs = await Promise.all(personaPromises);
      personaOutputs.push(...outputs);
    }

    // Step 2: Build Synthesis Prompt
    const activePerspectives = selectedPerspectiveIds
      .filter((id: string) => PERSPECTIVES[id])
      .map((id: string) => `Focus Area: ${PERSPECTIVES[id].name} - ${PERSPECTIVES[id].description}`);

    const agentContext = personaOutputs
      .map((po) => `[${po.personaName}'s Input]:\n"${po.output}"`)
      .join("\n\n");

    const synthesisPrompt = `
We are conducting an advanced mathematical and interdisciplinary analysis.

User Inquiry: "${query}"

Active Theoretical Perspectives for the Synthesis:
${activePerspectives.length > 0 ? activePerspectives.join("\n") : "General interdisciplinary analysis"}

Weights and Dial Adjustments:
- Formality Level: ${formality}/100
- Technical Density: ${technicality}/100
- Mathematical Rigor: ${rigor}/100

Input from agents:
${agentContext || "No concurrent agent inputs."}

INSTRUCTIONS FOR THE FINAL SYNTHESIS:
1. Synthesize the above persona perspectives and active focus areas into a cohesive, highly advanced, and unified answer.
2. Adapt your tone precisely to the dial settings:
   - Formality (${formality}/100): ${formality > 70 ? "Extremely academic, formal, and authoritative" : formality < 30 ? "Relatable, accessible, and direct" : "Balanced, educational, and professional"}.
   - Technical Density (${technicality}/100): ${technicality > 70 ? "Deeply mathematical, using exact terminology, definitions, and LaTeX equations if applicable" : technicality < 30 ? "Uses clear analogies and accessible, high-level terms" : "Balances conceptual analogies with technical terms"}.
   - Mathematical Rigor (${rigor}/100): ${rigor > 70 ? "Focuses heavily on axioms, formal logic, zero boundaries, spectral operators, or structured schemes" : "Focuses on intuitive pathways, conceptual links, and research context"}.
3. Address the inquiry directly. Use search grounding when helpful to fetch the latest math or physics breakthroughs. Ensure the final synthesis is structured, readable, and highly compelling.
`;

    // Step 3: Run the Synthesis using gemini-3.5-flash with HIGH thinkingLevel
    const synthesisContents = {
      parts: [
        ...parts.filter(p => p.inlineData),
        { text: synthesisPrompt }
      ]
    };
    
    const synthesisResponse: any = await generateContentWithRetry("gemini-3.1-pro-preview", synthesisContents, {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
      },
      tools: [{ googleSearch: {} }]
    });

    let thinking = "";
    let content = "";

    // Parse thinking blocks and content blocks
    if (synthesisResponse.candidates?.[0]?.content?.parts) {
      for (const part of synthesisResponse.candidates[0].content.parts) {
        if (part.thought) {
          thinking += part.text || "";
        } else {
          content += part.text || "";
        }
      }
    } else {
      content = synthesisResponse.text || "No synthesis could be derived.";
    }

    // Extract grounding sources
    const groundingSources: { title: string; url: string }[] = [];
    const groundingChunks = synthesisResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk.web && chunk.web.uri) {
          groundingSources.push({
            title: chunk.web.title || "Reference",
            url: chunk.web.uri
          });
        }
      }
    }

    res.json({
      thinking: thinking || "Direct logical derivation completed without visible thinking trace.",
      content,
      personaOutputs,
      groundingSources
    });

  } catch (error: any) {
    console.error("Error during synthesis API execution:", error);
    res.status(500).json({ error: error.message || "Internal server error during synthesis" });
  }
});

// Start Vite dev server or serve production build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
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
    console.log(`Prism Synthesis Server is active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
