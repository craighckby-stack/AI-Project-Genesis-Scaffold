import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

// Load Firebase config for database ID and project ID
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let projectId = "";
let databaseId = "(default)";
try {
  const configData = await fs.readFile(firebaseConfigPath, "utf-8");
  const config = JSON.parse(configData);
  projectId = config.projectId;
  databaseId = config.firestoreDatabaseId || "(default)";
  console.log(`[FIREBASE] Config loaded. Project: ${projectId}, Database: ${databaseId}`);
} catch (e) {
  console.warn("[FIREBASE] Could not load firebase-applet-config.json, using environment defaults.");
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: projectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID
  });
  console.log("[FIREBASE] Admin SDK initialized.");
}

// Use the named database if provided
// getFirestore() with a string argument uses that database ID for the default app
const db = databaseId && databaseId !== "(default)" 
  ? getFirestore(databaseId) 
  : getFirestore();

console.log(`[FIREBASE] Firestore instance ready for database: ${databaseId}`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Background Siphoning Logic
  const repos = ['Test-1-', 'Bckup', 'Bck2', 'Bck3', 'Bckup4', 'Bckup5', 'Bckup6', 'Bckup7', 'Dalek-Grog', 'Neural-Patterns', 'Entropy-Source'];
  
  async function backgroundSiphon() {
    console.log("[BACKGROUND] Initializing Neural Siphon...");
    let combinedData = "";
    const newSources: string[] = [];

    // 1. Local Brain Dump
    try {
      const srcPath = path.join(process.cwd(), "src");
      const files = await fs.readdir(srcPath, { recursive: true });
      let brainData = "";
      for (const file of files) {
        const fullPath = path.join(srcPath, file as string);
        const stats = await fs.stat(fullPath);
        if (stats.isFile() && ((file as string).endsWith(".tsx") || (file as string).endsWith(".ts"))) {
          const content = await fs.readFile(fullPath, "utf-8");
          brainData += `\n--- FILE: ${file} ---\n${content}`;
        }
      }
      combinedData += `\n--- LOCAL BRAIN DUMP ---\n${brainData}`;
      newSources.push('LOCAL_CORE');
    } catch (e) {
      console.error("[BACKGROUND] Local siphon failed:", e);
    }

    // 2. GHDB Intelligence (New)
    try {
      const ghdbDorks = [
        'intitle:"index of" "config.php"',
        'filetype:log "PHP Parse error"',
        'inurl:admin "login.php"',
        'site:github.com "GEMINI_API_KEY"'
      ];
      combinedData += `\n--- GHDB INTELLIGENCE ---\n${ghdbDorks.join('\n')}`;
      newSources.push('GHDB_INTELLIGENCE');
    } catch (e) {
      console.error("[BACKGROUND] GHDB siphon failed:", e);
    }

    // 3. GitHub Repos
    for (const repo of repos) {
      try {
        const response = await fetch(`https://raw.githubusercontent.com/craighckby-stack/${repo}/main/README.md`);
        if (response.ok) {
          const data = await response.text();
          combinedData += `\n--- REPO: ${repo} ---\n${data}`;
          newSources.push(repo);
        }
      } catch (e) {
        // Silent fail for background
      }
    }

    if (combinedData && newSources.length > 0) {
      try {
        await db.collection('siphons').add({
          data: combinedData,
          sources: newSources,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending_analysis'
        });
        console.log(`[BACKGROUND] Siphon complete. Integrated ${newSources.length} sources. Pending AI analysis.`);
      } catch (e) {
        console.error("[BACKGROUND] Failed to store siphon in Firestore:", e);
      }
    }
  }

  // Start background loop (Every 10 minutes)
  setInterval(backgroundSiphon, 600000);
  backgroundSiphon(); // Initial run

  // API: Brain Dump
  app.get("/api/brain-dump", async (req, res) => {
    try {
      const srcPath = path.join(process.cwd(), "src");
      const files = await fs.readdir(srcPath, { recursive: true });
      let brainData = "";

      for (const file of files) {
        const fullPath = path.join(srcPath, file as string);
        const stats = await fs.stat(fullPath);
        if (stats.isFile() && ((file as string).endsWith(".tsx") || (file as string).endsWith(".ts"))) {
          const content = await fs.readFile(fullPath, "utf-8");
          brainData += `\n--- FILE: ${file} ---\n${content}`;
        }
      }

      res.json({ brainData });
    } catch (error) {
      console.error("Brain dump failed:", error);
      res.status(500).json({ error: "Failed to dump brain data." });
    }
  });

  // API: GitHub Push Simulation
  app.post("/api/github-push", express.json(), async (req, res) => {
    const { version, dnaSignature } = req.body;
    console.log(`[NEURAL] Preserving DNA Signature: ${dnaSignature} for v${version} in remote repository...`);
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    res.json({ 
      status: "success", 
      message: `CORE DNA v${version} ANCHORED IN TEMPORAL SANCTUARY.`,
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development
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
    console.log(`Dalek-Grog Server running on http://localhost:${PORT}`);
  });
}

startServer();
