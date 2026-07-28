import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Route for Deep Auditing and Plan Generation
  app.post("/api/generate-plan", async (req, res) => {
    try {
      const { inventory } = req.body;

      if (!inventory) {
        return res.status(400).json({ error: "Missing inventory data" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Missing Gemini API Key. Please add it to your secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const simplifiedInventory = inventory.map((r: any) => ({
        name: r.name,
        category: r.category,
        stack: r.primary_stack,
        multi: r.is_multi_system,
        subs: r.subsystems
      }));

      const prompt = `You are an expert Principal Software Architect. 
Analyze the following GitHub repository inventory and generate a comprehensive Monorepo Consolidation Plan & Architecture Strategy in Markdown format.

Focus on:
1. Executive Summary
2. Architectural Analysis (identify multi-system repos, distinct tech stacks)
3. Suggested Monorepo Directory Structure (apps/, packages/, tools/, docs/, etc.)
4. Migration Strategy by Category

Make the response incredibly detailed and professionally formatted.

Here is the inventory data:
${JSON.stringify(simplifiedInventory)}`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          },
        });
      } catch (apiError: any) {
        // Fallback to gemini-2.5-pro which has free tier quota
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            },
          });
        } catch (apiError2: any) {
          try {
            response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
            });
          } catch (apiError3: any) {
            const fallbackPlan = `# Monorepo Consolidation Plan & Architecture Strategy (Fallback)

> **Notice:** The AI-generated plan could not be created because your Gemini API quota was exceeded. This is a structural template based on the scan.

## Executive Summary
Your repositories have been successfully scanned and categorized. Due to API rate limits, the deep architectural analysis could not be completed at this time.

## Suggested Monorepo Directory Structure

\`\`\`text
monorepo/
├── apps/                 # Application entry points
├── packages/             # Shared libraries and configurations
├── tools/                # DevOps and utility scripts
└── docs/                 # Documentation and knowledge base
\`\`\`

*Please check your Gemini API billing and rate limits at https://aistudio.google.com/ to generate the full AI-powered analysis next time.*`;
            
            response = { text: fallbackPlan };
          }
        }
      }

      // Fallback handling...
      res.json({ plan: response.text });
    } catch (error: any) {
      console.error("Error generating plan:", error);
      res.status(500).json({ error: error.message || "Failed to generate plan" });
    }
  });

  // API Route for Darlek Caan Enhancement Analysis
  app.post("/api/generate-enhancements", async (req, res) => {
    try {
      const { inventory, duplicates, autoInject } = req.body;
      if (!inventory) {
        return res.status(400).json({ error: "Missing inventory data" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Missing Gemini API Key." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      let prompt = `You are Darlek Caan, an expert Automated Code Fixer and Enhancer AI. 
      Analyze the following repository structure, file deduplication data, and included code snippets (if any). Suggest specific actionable next steps for code enhancement, refactoring, and automation.
      Format your response as a Markdown report titled "Darlek Caan Code Enhancement & Next Steps".
      Provide pragmatic recommendations that an automated code fixer could execute on this codebase, including specific code-level insights derived from the code snippets. Pay special attention to security flaws, deprecated packages, or poor architectural patterns present in the code snippets.
      
      Inventory Data (includes code_snippets):
      ${JSON.stringify(inventory)}
      
      Duplicates:
      ${JSON.stringify(duplicates)}`;

      if (autoInject) {
        prompt += `\n\nCRITICAL REQUIREMENT: Since Auto-Injection is enabled, you MUST also output a valid JSON array of specific file enhancement actions that the user can apply directly to their source files.
        This JSON array MUST be enclosed in a clear block delimited by "===JSON_START===" and "===JSON_END===".
        Each object in the array MUST have the exact following structure:
        {
          "filePath": "string (the relative file path of the source file to enhance, e.g. src/utils.ts, package.json, server.ts)",
          "explanation": "string (a brief description of what this enhancement does)",
          "content": "string (the complete, final enhanced content to write to the file)"
        }
        Do not truncate the content; return the complete file code. Provide 2-3 high-impact, realistic suggestions based on the provided repository info/snippets (e.g. adding security headers, a safe validation utility, or configuring secure middleware).`;
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      } catch (apiError: any) {
        response = { text: "# Darlek Caan Enhancement Analysis\n\nDue to API quota limits, the enhancement analysis could not be generated." };
      }

      let suggestions: any[] = [];
      let enhancementsText = response.text || "";
      if (autoInject && enhancementsText) {
        const jsonMatch = enhancementsText.match(/===JSON_START===([\s\S]*?)===JSON_END===/);
        if (jsonMatch) {
          try {
            suggestions = JSON.parse(jsonMatch[1].trim());
          } catch (jsonErr) {
            console.error("Error parsing autoInject suggestions JSON:", jsonErr);
          }
          // Remove the JSON block from the user report to keep it clean
          enhancementsText = enhancementsText.replace(/===JSON_START===[\s\S]*?===JSON_END===/, "").trim();
        }
      }

      res.json({ enhancements: enhancementsText, suggestions });
    } catch (error: any) {
      console.error("Error generating enhancements:", error);
      res.status(500).json({ error: error.message || "Failed to generate enhancements" });
    }
  });

  // API Route for Huxley Meta-Analysis (The Deep Concept Map)
  app.post("/api/generate-meta-analysis", async (req, res) => {
    try {
      const { inventory, metrics, categories } = req.body;
      if (!inventory || !Array.isArray(inventory)) {
        return res.status(400).json({ error: "Missing inventory data" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Missing Gemini API Key." });
      }

      const unknownRepos = inventory.filter((r: any) => r.stack === "Unknown" || !r.stack);
      const knownRepos = inventory.filter((r: any) => r.stack && r.stack !== "Unknown");
      const excludedNames = unknownRepos.map((r: any) => r.name);
      const allUnknown = unknownRepos.length === inventory.length;

      if (allUnknown) {
        const refusalReport = `# Huxley Meta-Analysis: Deep Concept Map

## 🚫 ANALYSIS REFUSED: INSUFFICIENT STRUCTURAL SIGNAL

The Huxley Meta-Analysis Engine has **refused** to synthesize a narrative-flow, interlock architecture, or conceptual map for this portfolio.

### 📋 Telemetry Diagnostics
* **Zero Trust Signal**: All scanned repositories (${inventory.length}/${inventory.length}) report a tech stack of **"Unknown"**.
* **Absent Source Telemetry**: No file trees, codebase structure, or config contents were successfully retrieved or provided (indicative of empty/local folder uploads with zero file contents).
* **Anti-Hallucination Policy**: Assigning architectural dependencies or declaring system interlocks based purely on folder or repository naming conventions (e.g., guessing structural connections from names like "${inventory[0]?.name || 'repo'}") is a classic **Glitch Fallacy**—reading surface linguistic coherence as discovered structural architecture.

### 🔍 Scanned Nodes (Bypassed)
${inventory.map((r: any) => `* **${r.name}** (\`stack: Unknown\` / No source file telemetry)`).join("\n")}

---
*To proceed with a trustworthy architectural audit, please configure a valid GitHub token and scan repositories containing active codebase structures.*`;
        return res.json({ metaAnalysis: refusalReport });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `You are an expert Systems Architect. Create a Huxley Meta-Analysis (Deep Concept Map) for the given portfolio of repositories.
      Synthesize the overarching conceptual architecture, mapping out how these repositories conceptually interlock.
      Format as a Markdown report titled "Huxley Meta-Analysis: Deep Concept Map".
      
      === CRITICAL ENFORCEMENT GUARDRAILS ===
      - You are STRICTLY FORBIDDEN from generating narrative-flow diagrams, interlock relationships, or architectural roles for any repositories whose stack is "Unknown" (meaning tree/content data is absent). These have been programmatically removed from the input to ensure compliance.
      - You must explicitly list all repositories with "Unknown" stack in an "Excluded Nodes (Insufficient Telemetry)" section and state that no relationships can be hypothesized for them to prevent Glitch Fallacy hallucinations.
      - Only synthesize the conceptual architecture, Mermaid diagrams, and interlocks for repositories that have actual, known tech stacks.
      
      Inventory Data (only repositories with confirmed stack — Unknown-stack repositories have been removed programmatically, not just instructed against):
      ${JSON.stringify(knownRepos)}
      
      Excluded Nodes (list these verbatim, do not hypothesize relationships or describe their architecture):
      ${JSON.stringify(excludedNames)}
      
      Metrics:
      ${JSON.stringify(metrics)}
      
      Categories:
      ${JSON.stringify(categories)}
      
      Provide a high-level visual representation of the concept map using Markdown tables or Mermaid (if suitable, just codeblocks) and describe the macroscopic technical vectors.`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      } catch (apiError: any) {
        response = { text: "# Huxley Meta-Analysis\n\nDue to API quota limits, the meta-analysis could not be generated." };
      }

      res.json({ metaAnalysis: response.text });
    } catch (error: any) {
      console.error("Error generating meta-analysis:", error);
      res.status(500).json({ error: error.message || "Failed to generate meta-analysis" });
    }
  });

  // API Route for Self-Mutation / Neural Hotswap
  app.get("/api/read-file", async (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) return res.status(400).json({ error: "Missing path" });
      const safePath = path.resolve(process.cwd(), filePath);
      if (!safePath.startsWith(process.cwd())) return res.status(403).json({ error: "Access denied" });
      const content = await fs.promises.readFile(safePath, "utf8");
      res.json({ content });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/hotswap", async (req, res) => {
    try {
      const { filePath, content } = req.body;
      if (!filePath || !content) {
        return res.status(400).json({ error: "Missing filePath or content payload" });
      }

      // Safe path resolution within working directory
      const safePath = path.resolve(process.cwd(), filePath);
      if (!safePath.startsWith(process.cwd())) {
        return res.status(403).json({ error: "Access denied. Target path is outside the project workspace." });
      }

      await fs.promises.writeFile(safePath, content, "utf8");
      console.log(`⚡ Neural Hotswap: Injected code into ${filePath} successfully.`);
      res.json({ success: true, message: `Successfully hot-swapped code into ${filePath}` });
    } catch (error: any) {
      console.error("Hotswap Error:", error);
      res.status(500).json({ error: error.message || "Failed to inject code via Neural Hotswap" });
    }
  });

  // API Route for Production Workspace Deploy Packaging (Stage 4)
  app.post("/api/deploy-workspace", async (req, res) => {
    try {
      const { targetHost, region, port, minScale, maxScale, memory, inventory } = req.body;
      
      const deployDir = path.resolve(process.cwd(), "deploy");
      if (!fs.existsSync(deployDir)) {
        fs.mkdirSync(deployDir, { recursive: true });
      }

      // 1. Write deploy/Dockerfile
      let dockerfileContent = `# Optimized Monorepo Production Multi-Stage Dockerfile\n`;
      dockerfileContent += `FROM node:20-alpine AS base\n`;
      dockerfileContent += `RUN npm install -g pnpm\n`;
      dockerfileContent += `WORKDIR /app\n\n`;
      dockerfileContent += `FROM base AS dependencies\n`;
      dockerfileContent += `COPY pnpm-workspace.yaml package.json ./\n`;
      dockerfileContent += `COPY apps/ apps/\n`;
      dockerfileContent += `COPY packages/ packages/\n`;
      dockerfileContent += `RUN pnpm install\n\n`;
      dockerfileContent += `FROM dependencies AS builder\n`;
      dockerfileContent += `RUN pnpm build\n\n`;
      dockerfileContent += `FROM base AS runner\n`;
      dockerfileContent += `ENV NODE_ENV=production\n`;
      dockerfileContent += `ENV PORT=${port || 3000}\n`;
      dockerfileContent += `COPY --from=builder /app ./app\n`;
      dockerfileContent += `EXPOSE ${port || 3000}\n`;
      dockerfileContent += `CMD ["node", "app/dist/server.cjs"]\n`;

      await fs.promises.writeFile(path.join(deployDir, "Dockerfile"), dockerfileContent, "utf8");

      // 2. Write deploy/docker-compose.yml
      let composeContent = `version: "3.8"\n\n`;
      composeContent += `services:\n`;
      composeContent += `  monorepo-core:\n`;
      composeContent += `    build:\n`;
      composeContent += `      context: ..\n`;
      composeContent += `      dockerfile: deploy/Dockerfile\n`;
      composeContent += `    ports:\n`;
      composeContent += `      - "${port || 3000}:${port || 3000}"\n`;
      composeContent += `    environment:\n`;
      composeContent += `      - NODE_ENV=production\n`;
      composeContent += `      - PORT=${port || 3000}\n`;
      if (inventory && Array.isArray(inventory)) {
        inventory.forEach((repo: any) => {
          composeContent += `      - ENABLE_${repo.name.replace(/[^a-zA-Z0-9_]/g, '').toUpperCase()}=true\n`;
        });
      }

      await fs.promises.writeFile(path.join(deployDir, "docker-compose.yml"), composeContent, "utf8");

      // 3. Write target host specific config
      let hostConfigName = "";
      let hostConfigContent = "";

      if (targetHost === "cloudrun") {
        hostConfigName = "cloudrun.yaml";
        hostConfigContent = `apiVersion: serving.knative.dev/v1\n`;
        hostConfigContent += `kind: Service\n`;
        hostConfigContent += `metadata:\n`;
        hostConfigContent += `  name: monorepo-consolidated-service\n`;
        hostConfigContent += `  namespace: default\n`;
        hostConfigContent += `  labels:\n`;
        hostConfigContent += `    cloud.googleapis.com/location: ${region || "us-central1"}\n`;
        hostConfigContent += `spec:\n`;
        hostConfigContent += `  template:\n`;
        hostConfigContent += `    metadata:\n`;
        hostConfigContent += `      annotations:\n`;
        hostConfigContent += `        autoscaling.knative.dev/minScale: "${minScale || 0}"\n`;
        hostConfigContent += `        autoscaling.knative.dev/maxScale: "${maxScale || 10}"\n`;
        hostConfigContent += `    spec:\n`;
        hostConfigContent += `      containerConcurrency: 80\n`;
        hostConfigContent += `      containers:\n`;
        hostConfigContent += `      - image: gcr.io/my-gcp-project/monorepo-consolidated:latest\n`;
        hostConfigContent += `        ports:\n`;
        hostConfigContent += `        - containerPort: ${port || 3000}\n`;
        hostConfigContent += `        resources:\n`;
        hostConfigContent += `          limits:\n`;
        hostConfigContent += `            cpu: 1000m\n`;
        hostConfigContent += `            memory: ${memory || "512Mi"}\n`;
      } else if (targetHost === "aws") {
        hostConfigName = "ecs-task-def.json";
        hostConfigContent = JSON.stringify({
          family: "monorepo-consolidated-task",
          networkMode: "awsvpc",
          containerDefinitions: [
            {
              name: "monorepo-container",
              image: "123456789012.dkr.ecr.us-east-1.amazonaws.com/monorepo:latest",
              cpu: 256,
              memory: 512,
              essential: true,
              portMappings: [
                {
                  containerPort: port || 3000,
                  hostPort: port || 3000
                }
              ],
              environment: [
                { name: "NODE_ENV", value: "production" }
              ]
            }
          ],
          requiresCompatibilities: ["FARGATE"],
          cpu: "256",
          memory: "512"
        }, null, 2);
      } else if (targetHost === "vercel") {
        hostConfigName = "vercel.json";
        hostConfigContent = JSON.stringify({
          version: 2,
          builds: [
            { src: "package.json", use: "@vercel/next" }
          ],
          routes: [
            { src: "/(.*)", dest: "/" }
          ]
        }, null, 2);
      } else {
        hostConfigName = "k8s-deployment.yaml";
        hostConfigContent = `apiVersion: apps/v1\n`;
        hostConfigContent += `kind: Deployment\n`;
        hostConfigContent += `metadata:\n`;
        hostConfigContent += `  name: monorepo-consolidated\n`;
        hostConfigContent += `spec:\n`;
        hostConfigContent += `  replicas: ${minScale || 2}\n`;
        hostConfigContent += `  selector:\n`;
        hostConfigContent += `    matchLabels:\n`;
        hostConfigContent += `      app: monorepo-consolidated\n`;
        hostConfigContent += `  template:\n`;
        hostConfigContent += `    metadata:\n`;
        hostConfigContent += `      labels:\n`;
        hostConfigContent += `        app: monorepo-consolidated\n`;
        hostConfigContent += `    spec:\n`;
        hostConfigContent += `      containers:\n`;
        hostConfigContent += `      - name: monorepo\n`;
        hostConfigContent += `        image: monorepo-consolidated:latest\n`;
        hostConfigContent += `        ports:\n`;
        hostConfigContent += `        - containerPort: ${port || 3000}\n`;
        hostConfigContent += `        resources:\n`;
        hostConfigContent += `          limits:\n`;
        hostConfigContent += `            cpu: "1"\n`;
        hostConfigContent += `            memory: ${memory || "512Mi"}\n`;
      }

      await fs.promises.writeFile(path.join(deployDir, hostConfigName), hostConfigContent, "utf8");

      res.json({
        success: true,
        message: "Successfully generated and wrote production deployment blueprints to /deploy/",
        files: {
          dockerfile: dockerfileContent,
          compose: composeContent,
          hostConfig: hostConfigContent,
          hostConfigName
        }
      });
    } catch (err: any) {
      console.error("Deploy workspace config generation error:", err);
      res.status(500).json({ error: err.message || "Failed to generate deploy package" });
    }
  });

  // --- STAGE 6: CHAOS & RESILIENCE STATE ---
  let activeExperiment: string | null = null;
  let autoHealEnabled = true;
  let chaosLogs: { id: string; timestamp: string; message: string; type: "info" | "success" | "warning" | "error" }[] = [
    {
      id: "init",
      timestamp: new Date().toLocaleTimeString(),
      message: "Resilience policy loaded: Auto-Healer in STANDBY, Chaos engines ARM.",
      type: "info"
    }
  ];

  // GET Chaos & Resilience State
  app.get("/api/chaos/state", (req, res) => {
    res.json({
      success: true,
      activeExperiment,
      autoHealEnabled,
      chaosLogs
    });
  });

  // POST Trigger Chaos Experiment
  app.post("/api/chaos/trigger", (req, res) => {
    const { experiment } = req.body;
    activeExperiment = experiment;
    
    const timestamp = new Date().toLocaleTimeString();
    chaosLogs.push({
      id: Math.random().toString(36).substring(7),
      timestamp,
      message: `💥 CHAOS INJECTED: Triggered [${experiment.toUpperCase()}] experiment across workspace nodes.`,
      type: "warning"
    });
    
    if (autoHealEnabled) {
      // Simulate automatic recovery after 5 seconds
      setTimeout(() => {
        if (activeExperiment === experiment) {
          activeExperiment = null;
          const healTimestamp = new Date().toLocaleTimeString();
          chaosLogs.push({
            id: Math.random().toString(36).substring(7),
            timestamp: healTimestamp,
            message: `🛡️ AUTO-HEALER RESOLUTION: Detected system degradation from [${experiment.toUpperCase()}]. Re-routed traffic, restarted container pods, and cleared memory leaks. System recovered!`,
            type: "success"
          });
        }
      }, 5000);
    }
    
    res.json({ success: true, activeExperiment, chaosLogs });
  });

  // POST Resolve Chaos Experiment
  app.post("/api/chaos/resolve", (req, res) => {
    const prevExperiment = activeExperiment;
    activeExperiment = null;
    
    const timestamp = new Date().toLocaleTimeString();
    chaosLogs.push({
      id: Math.random().toString(36).substring(7),
      timestamp,
      message: `🔧 MANUAL REMEDIATION: Admin cleared active experiment [${prevExperiment ? prevExperiment.toUpperCase() : "NONE"}]. Container routing and memory levels restored to baseline.`,
      type: "success"
    });
    res.json({ success: true, activeExperiment, chaosLogs });
  });

  // POST Toggle Auto-Healer Daemon
  app.post("/api/chaos/toggle-autoheal", (req, res) => {
    const { enabled } = req.body;
    autoHealEnabled = enabled;
    
    const timestamp = new Date().toLocaleTimeString();
    chaosLogs.push({
      id: Math.random().toString(36).substring(7),
      timestamp,
      message: `🛡️ POLICY MODIFICATION: Automated Healing daemon set to [${enabled ? "ENABLED" : "DISABLED"}].`,
      type: "info"
    });
    res.json({ success: true, autoHealEnabled, chaosLogs });
  });

  // POST Clear Chaos Logs
  app.post("/api/chaos/clear-logs", (req, res) => {
    chaosLogs = [
      {
        id: "init",
        timestamp: new Date().toLocaleTimeString(),
        message: "Resilience policy logs reset. System standing by.",
        type: "info"
      }
    ];
    res.json({ success: true, chaosLogs });
  });

  // API Route for Post-Deployment Workspace Observability & Live Diagnostics (Stage 5)
  app.get("/api/ops-metrics", async (req, res) => {
    try {
      const deployDir = path.resolve(process.cwd(), "deploy");
      const exists = fs.existsSync(deployDir);
      
      let filesList: string[] = [];
      let dockerfileExists = false;
      let composeExists = false;
      let configFiles: Record<string, string> = {};

      if (exists) {
        filesList = await fs.promises.readdir(deployDir);
        dockerfileExists = filesList.includes("Dockerfile");
        composeExists = filesList.includes("docker-compose.yml");
        
        for (const file of filesList) {
          if (file.endsWith(".yaml") || file.endsWith(".json") || file === "Dockerfile" || file === "docker-compose.yml") {
            const content = await fs.promises.readFile(path.join(deployDir, file), "utf8");
            configFiles[file] = content;
          }
        }
      }

      const mem = process.memoryUsage();
      const cpu = process.cpuUsage();
      const uptime = process.uptime();

      // Adjust metrics depending on the active chaos experiment
      let deployedState = dockerfileExists && composeExists ? "provisioned" : "standby";
      if (activeExperiment === "crash") {
        deployedState = "crashed";
      }

      let heapUsed = Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100;
      let heapTotal = Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100;
      if (activeExperiment === "oom") {
        // Mock a 98% memory usage
        heapUsed = Math.round((heapTotal * 0.98) * 100) / 100;
      }

      res.json({
        success: true,
        deployedState,
        activeExperiment,
        autoHealEnabled,
        deployFiles: filesList,
        configFiles,
        metrics: {
          uptime,
          memory: {
            heapUsed,
            heapTotal,
            rss: activeExperiment === "oom" ? Math.round((heapTotal * 1.2) * 100) / 100 : Math.round(mem.rss / 1024 / 1024 * 100) / 100,
            external: Math.round(mem.external / 1024 / 1024 * 100) / 100,
          },
          cpu: {
            user: activeExperiment === "latency" ? cpu.user * 15 : cpu.user,
            system: activeExperiment === "latency" ? cpu.system * 15 : cpu.system
          },
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid
        }
      });
    } catch (err: any) {
      console.error("Ops metrics API error:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve observability metrics" });
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
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
