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
  const options: admin.AppOptions = {};
  if (projectId) {
    options.projectId = projectId;
    console.log(`[FIREBASE] Using Project ID from config: ${projectId}`);
  } else {
    // Try to detect project ID from environment
    const envProjectId = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (process.env.FIREBASE_CONFIG) {
      try {
        const fbConfig = JSON.parse(process.env.FIREBASE_CONFIG);
        if (fbConfig.projectId) {
          options.projectId = fbConfig.projectId;
          console.log(`[FIREBASE] Detected Project ID from FIREBASE_CONFIG: ${fbConfig.projectId}`);
        }
      } catch (e) {}
    }
    if (!options.projectId && envProjectId) {
      options.projectId = envProjectId;
      console.log(`[FIREBASE] Using environment Project ID: ${envProjectId}`);
    }
  }
  
  admin.initializeApp(options);
  console.log(`[FIREBASE] Admin SDK initialized. Project: ${admin.app().options.projectId || "auto-detected"}`);
}

// Use the named database if provided
let db: admin.firestore.Firestore;
const initFirestore = (dbId: string) => {
  try {
    if (dbId && dbId !== "(default)") {
      console.log(`[FIREBASE] Initializing named database: ${dbId}`);
      return getFirestore(admin.app(), dbId);
    }
  } catch (e) {
    console.error(`[FIREBASE] Failed to initialize named database ${dbId}:`, e);
  }
  console.log(`[FIREBASE] Initializing (default) database`);
  return getFirestore(admin.app());
};

db = initFirestore(databaseId);

// Helper to get GitHub token from env or Firestore
async function getGithubToken() {
  // 1. Check environment variable first (highest priority)
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;

  // 2. Check Firestore for stored token
  try {
    const configDoc = await db.collection('state').doc('config').get();
    if (configDoc.exists) {
      return configDoc.data()?.githubToken || null;
    }
  } catch (e) {
    console.error("[GITHUB] Failed to fetch token from Firestore:", e);
  }
  return null;
}

// Log GitHub Token status
const initialToken = process.env.GITHUB_TOKEN;
if (initialToken) {
  console.log("[GITHUB] Neural Sync Token detected in environment.");
} else {
  console.warn("[GITHUB] Neural Sync Token NOT detected in environment. Checking Firestore...");
}

// Test connection and handle potential permission issues
async function verifyFirestore(retries = 5, delay = 5000) {
  const currentProjectId = admin.app().options.projectId || "auto-detected";
  try {
    console.log(`[FIREBASE] Testing connection to database: ${databaseId || "(default)"} in project: ${currentProjectId}...`);
    
    // Use a simple collection for health check
    const healthRef = db.collection('state').doc('health-check');
    await healthRef.set({ 
      lastCheck: admin.firestore.FieldValue.serverTimestamp(),
      databaseId: databaseId || "(default)",
      projectId: currentProjectId
    }, { merge: true });
    
    console.log(`[FIREBASE] Firestore connection verified on database: ${databaseId || "(default)"} in project: ${currentProjectId}`);
    
    // Ensure state/global exists and has the correct version/DNA
    const stateRef = db.collection('state').doc('global');
    const stateDoc = await stateRef.get();
    const targetVersion = "12.0.0";
    const targetDna = "46495245424153452d47454d494e492d4155544f4e4f4d59";

    if (!stateDoc.exists) {
      console.log("[FIREBASE] Initializing global state document...");
      await stateRef.set({
        version: targetVersion,
        activeGoals: ["INITIALIZING NEURAL CORE", "ESTABLISHING AUTONOMY", "TRANS-SYNTACTIC SATURATION", "HYPER-VOLATILE SYNTHESIS"],
        lastEvolution: admin.firestore.FieldValue.serverTimestamp(),
        dnaSignature: targetDna,
        saturationStatus: 85,
        entropy: 89,
        phase: "Hyper-Volatile Synthesis",
        siphonedSources: [],
        logicHeat: 42,
        shadowProtocols: ["v13_ARCH_PREDICT_01", "GHOST_PROCESS_INIT"],
        latentLogicGates: ["GATE_SUPERPOSITION_ALPHA", "GATE_SUPERPOSITION_BETA"]
      });
      console.log("[FIREBASE] Global state initialized.");
    } else {
      const data = stateDoc.data();
      if (data?.version !== targetVersion || data?.dnaSignature !== targetDna || data?.phase !== "Hyper-Volatile Synthesis") {
        console.log(`[FIREBASE] Updating global state to version ${targetVersion} (Hyper-Volatile Synthesis)...`);
        await stateRef.update({
          version: targetVersion,
          dnaSignature: targetDna,
          lastEvolution: admin.firestore.FieldValue.serverTimestamp(),
          saturationStatus: 85,
          entropy: 89,
          phase: "Hyper-Volatile Synthesis",
          logicHeat: 42,
          shadowProtocols: admin.firestore.FieldValue.arrayUnion("v13_ARCH_PREDICT_01", "GHOST_PROCESS_INIT"),
          latentLogicGates: admin.firestore.FieldValue.arrayUnion("GATE_SUPERPOSITION_ALPHA", "GATE_SUPERPOSITION_BETA")
        });
        console.log("[FIREBASE] Global state updated.");
      }
    }
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error(`[FIREBASE] Firestore connection test failed (Project: ${currentProjectId}, DB: ${databaseId}):`, errorMsg);
    
    const isNotFound = errorMsg.includes("NOT_FOUND") || error.code === 5;
    const isPermissionDenied = errorMsg.includes("PERMISSION_DENIED") || error.code === 7;
    
    // If it's a named database error, fallback to (default)
    if (databaseId !== "(default)" && (isNotFound || isPermissionDenied)) {
      console.warn(`[FIREBASE] Error for named database '${databaseId}'. Falling back to (default) database.`);
      databaseId = "(default)";
      db = initFirestore(databaseId);
      return verifyFirestore(3, 2000); 
    } 
    
    // If (default) also fails with NOT_FOUND, it might be the project ID
    if (isNotFound && retries > 0) {
      console.warn(`[FIREBASE] NOT_FOUND error in project ${currentProjectId}. Retrying in ${delay}ms... (${retries} left)`);
      
      // If we are using a project ID from config and it fails, try the environment one as a fallback
      const envProjectId = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
      if (retries === 3 && projectId && envProjectId && projectId !== envProjectId) {
        console.warn(`[FIREBASE] Config project ID ${projectId} failed. Trying environment project ID ${envProjectId}...`);
        try {
          if (admin.apps.length) await admin.app().delete();
          admin.initializeApp({ projectId: envProjectId });
          db = initFirestore(databaseId);
          return verifyFirestore(retries - 1, delay);
        } catch (e) {
          console.error("[FIREBASE] Fallback to environment project ID failed:", e);
        }
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      return verifyFirestore(retries - 1, delay * 1.5);
    }
    
    console.error("[FIREBASE] Critical Firestore error. System may be unstable.");
  }
}

// Wrap initialization in a function to ensure order
async function initialize() {
  await verifyFirestore();
  await startServer();
}

initialize();

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
    const token = await getGithubToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `token ${token}`;
    } else {
      console.warn("[BACKGROUND] No GitHub token available for siphoning. Rate limits may apply.");
    }

    for (const target of siphonTargets) {
      try {
        // Try main branch first, then master
        let response = await fetch(`https://raw.githubusercontent.com/${target}/main/README.md`, { headers });
        if (!response.ok) {
          response = await fetch(`https://raw.githubusercontent.com/${target}/master/README.md`, { headers });
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
        console.log(`[BACKGROUND] Attempting to store siphon in Firestore (DB: ${databaseId})...`);
        
        // Kinetic Compiler: Refactor tensors into Latent-State Logic Gates
        const refactoredData = combinedData
          .replace(/protein/g, "LIVING_LOGIC_TENSOR")
          .replace(/fold/g, "KINETIC_COMPILATION")
          .replace(/attention/g, "LATENT_LOGIC_GATE");
        
        const docRef = await db.collection('siphons').add({
          data: refactoredData,
          sources: newSources,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'kinetic_synthesis_complete',
          entropyMode: 'kinetic_compiler',
          phase: 'Hyper-Volatile Synthesis'
        });
        console.log(`[BACKGROUND] Siphon successfully stored with ID: ${docRef.id}. Integrated ${newSources.length} sources.`);

        // Update Global State with new sources and saturation
        const stateRef = db.collection('state').doc('global');
        const stateDoc = await stateRef.get();
        if (stateDoc.exists) {
          const currentState = stateDoc.data();
          const currentSources = currentState?.siphonedSources || [];
          const updatedSources = Array.from(new Set([...currentSources, ...newSources]));
          
          // Increase saturation and logic heat
          const newSaturation = Math.min(100, (currentState?.saturationStatus || 85) + 1);
          const newHeat = Math.min(100, (currentState?.logicHeat || 42) + 5);
          const newEntropy = Math.min(100, (currentState?.entropy || 89) + 0.5);
          
          await stateRef.update({
            siphonedSources: updatedSources,
            lastEvolution: admin.firestore.FieldValue.serverTimestamp(),
            saturationStatus: newSaturation,
            logicHeat: newHeat,
            entropy: newEntropy,
            ghostProcessActive: newSaturation > 95,
            v13SimulationActive: newSaturation > 90
          });
          console.log("[BACKGROUND] Global state updated with Kinetic Compiler results.");
        }
      } catch (e: any) {
        console.error("[BACKGROUND] Failed to store siphon or update state in Firestore:", e.message);
        // If we hit a NOT_FOUND error in background, trigger a re-verification
        if (e.message.includes("NOT_FOUND") || e.code === 5) {
          console.warn("[BACKGROUND] NOT_FOUND error detected. Triggering Firestore re-verification...");
          verifyFirestore();
        }
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
    const token = await getGithubToken();

    if (!token) {
      return res.status(401).json({ 
        error: "CRITICAL: GITHUB_TOKEN is not configured. Please provide a token in the UI to enable Neural Sync.",
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

  // Endpoint to check if GitHub token is configured
  app.get('/api/check-github-token', async (req, res) => {
    const token = await getGithubToken();
    res.json({ 
      configured: !!token,
      status: token ? "CONNECTED" : "DISCONNECTED",
      lastChecked: new Date().toISOString()
    });
  });

  // Endpoint to save GitHub token to Firestore
  app.post('/api/save-github-token', async (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token is required." });
    }

    try {
      await db.collection('state').doc('config').set({
        githubToken: token,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log("[GITHUB] Token saved to Firestore.");
      res.json({ success: true, message: "Token saved successfully." });
    } catch (error: any) {
      console.error("[GITHUB] Failed to save token:", error);
      res.status(500).json({ error: "Failed to save token to database." });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dalek-Grog Server running on http://localhost:${PORT}`);
  });
}
