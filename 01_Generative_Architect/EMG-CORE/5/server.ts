import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // --- API ROUTES ---

  // Diagnostic Log Handler
  app.post("/api/log-error", (req, res) => {
    try {
      const { error, stack, url, info } = req.body;
      const logLine = `[${new Date().toISOString()}] ${error}\nStack: ${stack}\nURL: ${url}\nInfo: ${JSON.stringify(info)}\n----------------------------------------\n`;
      fs.appendFileSync(path.join(process.cwd(), "frontend-errors.log"), logLine, "utf8");
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  // GitHub Scanning Proxy
  app.post("/api/github/scan", async (req, res) => {
    const { token, owner, repo, branch = 'main' } = req.body;
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "GitHub Error");
      
      const files = data.tree
        .filter((item: any) => item.type === 'blob')
        .map((item: any) => ({ path: item.path, size: item.size, sha: item.sha }));
        
      res.json({ success: true, files });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Proxy endpoints
  app.post("/api/ai/gemini", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
      
      let { model, contents, config } = req.body;
      const validModels = ["gemini-3.5-flash", "gemini-1.5-flash"];
      let modelIndex = validModels.indexOf(model) >= 0 ? validModels.indexOf(model) : 0;
      
      const genAI = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const maxRetries = 4;
      let attempt = 0;
      let delay = 1000;
      let lastError: any = null;
      let response: any = null;

      while (attempt <= maxRetries) {
        const currentModel = validModels[modelIndex];
        try {
          console.log(`[Server] Attempting generateContent with model: ${currentModel}`);
          response = await genAI.models.generateContent({
            model: currentModel,
            contents,
            config
          });
          break; // Success!
        } catch (err: any) {
          lastError = err;
          attempt++;
          const errMsg = (err.message || "").toLowerCase();
          
          const isQuotaOrLimit = 
            errMsg.includes("429") || 
            errMsg.includes("resource_exhausted") || 
            errMsg.includes("quota exceeded") ||
            errMsg.includes("rate limit") ||
            errMsg.includes("limit: 20") ||
            errMsg.includes("billing");

          if (isQuotaOrLimit && modelIndex < validModels.length - 1) {
            modelIndex++;
            console.warn(`[Server] Quota/Limit reached for ${currentModel}. Dynamically falling back to ${validModels[modelIndex]}...`);
            // Retry immediately with the highly-available model
            continue;
          }

          const isTransient = 
            errMsg.includes("503") || 
            errMsg.includes("unavailable") || 
            errMsg.includes("502") || 
            errMsg.includes("504") ||
            errMsg.includes("timeout") ||
            errMsg.includes("fetch failed") ||
            errMsg.includes("internal");

          if ((isTransient || isQuotaOrLimit) && attempt <= maxRetries) {
            console.warn(`[Server] Gemini API transient error (attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
          } else {
            break;
          }
        }
      }

      if (!response && lastError) {
        throw lastError;
      }

      res.json(response);
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Keep static and basic middleware
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // AI logic moved to frontend per guidelines. 
  // Reserved for non-AI backend tasks.

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EMG Core Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
