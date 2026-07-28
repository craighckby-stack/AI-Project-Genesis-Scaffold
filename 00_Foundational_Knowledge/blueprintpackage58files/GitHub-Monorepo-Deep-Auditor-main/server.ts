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
      const hasUnknown = unknownRepos.length > 0;
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
      - You are STRICTLY FORBIDDEN from generating narrative-flow diagrams, interlock relationships, or architectural roles for any repositories whose stack is "Unknown" (meaning tree/content data is absent).
      - You must explicitly list all repositories with "Unknown" stack in an "Excluded Nodes (Insufficient Telemetry)" section and state that no relationships can be hypothesized for them to prevent Glitch Fallacy hallucinations.
      - Only synthesize the conceptual architecture, Mermaid diagrams, and interlocks for repositories that have actual, known tech stacks.
      
      Inventory Data:
      ${JSON.stringify(inventory)}
      
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
      composeContent += `  monorepo-core:
