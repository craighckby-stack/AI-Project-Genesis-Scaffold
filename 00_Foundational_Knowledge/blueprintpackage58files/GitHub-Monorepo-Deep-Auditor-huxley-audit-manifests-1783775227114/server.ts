import express from "express";
import path from "path";
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
      const { inventory, duplicates } = req.body;
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

      const prompt = `You are Darlek Caan, an expert Automated Code Fixer and Enhancer AI. 
      Analyze the following repository structure, file deduplication data, and included code snippets (if any). Suggest specific actionable next steps for code enhancement, refactoring, and automation.
      Format your response as a Markdown report titled "Darlek Caan Code Enhancement & Next Steps".
      Provide pragmatic recommendations that an automated code fixer could execute on this codebase, including specific code-level insights derived from the code snippets. Pay special attention to security flaws, deprecated packages, or poor architectural patterns present in the code snippets.
      
      Inventory Data (includes code_snippets):
      ${JSON.stringify(inventory)}
      
      Duplicates:
      ${JSON.stringify(duplicates)}`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      } catch (apiError: any) {
        response = { text: "# Darlek Caan Enhancement Analysis\\n\\nDue to API quota limits, the enhancement analysis could not be generated." };
      }

      res.json({ enhancements: response.text });
    } catch (error: any) {
      console.error("Error generating enhancements:", error);
      res.status(500).json({ error: error.message || "Failed to generate enhancements" });
    }
  });

  // API Route for Huxley Meta-Analysis (The Deep Concept Map)
  app.post("/api/generate-meta-analysis", async (req, res) => {
    try {
      const { inventory, metrics, categories } = req.body;
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

      const prompt = `You are an expert Systems Architect. Create a Huxley Meta-Analysis (Deep Concept Map) for the given portfolio of repositories.
      Synthesize the overarching conceptual architecture, mapping out how these repositories conceptually interlock.
      Format as a Markdown report titled "Huxley Meta-Analysis: Deep Concept Map".
      
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
        response = { text: "# Huxley Meta-Analysis\\n\\nDue to API quota limits, the meta-analysis could not be generated." };
      }

      res.json({ metaAnalysis: response.text });
    } catch (error: any) {
      console.error("Error generating meta-analysis:", error);
      res.status(500).json({ error: error.message || "Failed to generate meta-analysis" });
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
});
}

startServer();
