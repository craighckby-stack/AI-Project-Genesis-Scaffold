import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // --- API ROUTES ---

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
