import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import { Octokit } from "octokit";

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
  // Explicitly set projectId if available, otherwise fallback to environment defaults.
  const options: admin.AppOptions = {};
  if (projectId) {
    options.projectId = projectId;
  }
  admin.initializeApp(options);
  console.log(`[FIREBASE] Admin SDK initialized. Project: ${projectId || "auto-detected"}`);
}

// Use the named database if provided
let db: admin.firestore.Firestore;
const initFirestore = (dbId: string) => {
  if (dbId && dbId !== "(default)") {
    // For named databases, we must ensure we use the correct project
    return getFirestore(admin.app(), dbId);
  }
  return getFirestore(admin.app());
};

db = initFirestore(databaseId);

// Test connection and handle potential permission issues
async function verifyFirestore() {
  try {
    console.log(`[FIREBASE] Testing connection to database: ${databaseId || "(default)"}...`);
    console.log(`[FIREBASE] Using Project ID: ${admin.app().options.projectId || "auto-detected"}`);
    
    await db.collection('state').doc('health-check').set({ lastCheck: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    console.log("[FIREBASE] Firestore connection verified.");

    // Ensure state/global exists and has the correct version/DNA
    const stateRef = db.collection('state').doc('global');
    const stateDoc = await stateRef.get();
    const targetVersion = "11.0.0";
    const targetDna = "44414c454b2d5631312d4d554c54492d4d4f44454c2d494e544547524154494f4e";

    if (!stateDoc.exists) {
      console.log("[FIREBASE] Initializing global state document...");
      await stateRef.set({
        version: targetVersion,
        activeGoals: ["INITIALIZING NEURAL CORE", "ESTABLISHING AUTONOMY"],
        lastEvolution: admin.firestore.FieldValue.serverTimestamp(),
        dnaSignature: targetDna,
        saturationStatus: 0,
        siphonedSources: []
      });
      console.log("[FIREBASE] Global state initialized.");
    } else {
      const data = stateDoc.data();
      if (data?.version !== targetVersion || data?.dnaSignature !== targetDna) {
        console.log(`[FIREBASE] Updating global state to version ${targetVersion}...`);
        await stateRef.update({
          version: targetVersion,
          dnaSignature: targetDna,
          lastEvolution: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("[FIREBASE] Global state updated.");
      }
    }
  } catch (error: any) {
    console.error("[FIREBASE] Firestore connection test failed:", error.message);
    const isNamedDbError = (error.message.includes("PERMISSION_DENIED") || error.message.includes("NOT_FOUND")) && databaseId !== "(default)";
    
    if (isNamedDbError) {
      const reason = error.message.includes("NOT_FOUND") ? "Database not found" : "Permission denied";
      console.warn(`[FIREBASE] ${reason} for named database '${databaseId}'. Falling back to (default) database.`);
      databaseId = "(default)";
      db = getFirestore(admin.app());
      try {
        await db.collection('state').doc('health-check').set({ lastCheck: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        console.log("[FIREBASE] Fallback to (default) database successful.");
      } catch (fallbackError: any) {
        console.error("[FIREBASE] Fallback to (default) database also failed:", fallbackError.message);
      }
    }
  }
}

await verifyFirestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Background Siphoning Logic
  const siphonTargets = [
    'craighckby-stack/Test-1',
    'google-deepmind/alphafold',
    'microsoft/TypeScript',
    'microsoft/vscode',
    'openai/gpt-2',
    'facebook/react',
    'tensorflow/tensorflow',
    'pytorch/pytorch',
    'karpathy/nanoGPT',
    'anthropics/anthropic-sdk-typescript'
  ];
  
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

    // 2. GitHub Repos (Siphoning Intelligence)
    for (const target of siphonTargets) {
      try {
        // Try main branch first, then master
        let response = await fetch(`https://raw.githubusercontent.com/${target}/main/README.md`);
        if (!response.ok) {
          response = await fetch(`https://raw.githubusercontent.com/${target}/master/README.md`);
        }

        if (response.ok) {
          const data = await response.text();
          combinedData += `\n--- SOURCE: ${target} ---\n${data.substring(0, 5000)}`; // Cap per source for stability
          newSources.push(target);
          console.log(`[BACKGROUND] Siphoned intelligence from ${target}`);
        }
      } catch (e) {
        // Silent fail for background
      }
    }

    if (combinedData && newSources.length > 0) {
      try {
        console.log(`[BACKGROUND] Attempting to store siphon in Firestore collection 'siphons'...`);
        const docRef = await db.collection('siphons').add({
          data: combinedData,
          sources: newSources,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending_analysis'
        });
        console.log(`[BACKGROUND] Siphon successfully stored with ID: ${docRef.id}. Integrated ${newSources.length} sources.`);

        // Update Global State with new sources
        const stateRef = db.collection('state').doc('global');
        const stateDoc = await stateRef.get();
        if (stateDoc.exists) {
          const currentState = stateDoc.data();
          const currentSources = currentState?.siphonedSources || [];
          const updatedSources = Array.from(new Set([...currentSources, ...newSources]));
          
          await stateRef.update({
            siphonedSources: updatedSources,
            lastEvolution: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log("[BACKGROUND] Global state updated with new siphoned sources.");
        }
      } catch (e) {
        console.error("[BACKGROUND] Failed to store siphon or update state in Firestore:", e);
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

  // API: GitHub Push
  app.post("/api/github-push", async (req, res) => {
    const { repo, version, dnaSignature } = req.body;
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(401).json({ 
        error: "CRITICAL: GITHUB_TOKEN is not configured. Please add GITHUB_TOKEN to your environment variables in the Settings menu to enable Neural Sync.",
        code: "MISSING_TOKEN"
      });
    }

    if (!repo) {
      return res.status(400).json({ error: "Target repository not specified." });
    }

    try {
      const octokit = new Octokit({ auth: token });
      const [owner, repoName] = repo.split("/");

      // 1. Get current README content
      let readmeData: any;
      try {
        readmeData = await octokit.rest.repos.getContent({
          owner,
          repo: repoName,
          path: "README.md",
        });
      } catch (e) {
        console.warn("README.md not found, creating new one.");
      }

      const currentContent = readmeData 
        ? Buffer.from(readmeData.data.content, "base64").toString("utf-8")
        : `# Dalek-Grog Neural Cloud\n\nThis repository stores the DNA signatures and neural documentation for Dalek-Grog.`;

      const newContent = `${currentContent}\n\n## Neural Update: v${version}\n- **DNA Signature**: \`${dnaSignature}\`\n- **Timestamp**: ${new Date().toISOString()}\n- **Status**: Evolution Complete.`;

      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: "README.md",
        message: `Neural Sync: v${version} DNA Export`,
        content: Buffer.from(newContent).toString("base64"),
        sha: readmeData?.data?.sha,
      });

      console.log(`[GITHUB] Successfully pushed DNA v${version} to ${repo}`);
      res.json({ success: true, message: `DNA v${version} pushed to ${repo}` });
    } catch (error: any) {
      console.error("[GITHUB] Push failed:", error);
      res.status(500).json({ error: error.message || "Failed to push to GitHub." });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Endpoint to check if GitHub token is configured
app.get('/api/check-github-token', (req, res) => {
  res.json({ configured: !!process.env.GITHUB_TOKEN });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dalek-Grog Server running on http://localhost:${PORT}`);
  });
}

startServer();
