/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { EncyclopediaData, Capability } from "./src/types.ts";
import { Octokit } from "octokit";
import fs from "fs";
import { loadSyncState, saveSyncState, syncLoopActive, setSyncLoopActive } from "./syncManager.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-init Gemini
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

const DATA_FILE = path.join(process.cwd(), "data.json");

const INITIAL_DATA: EncyclopediaData = {
  volumes: [
    {
      name: "Networking",
      chapters: [
        { name: "Authentication", capabilities: ["github-auth", "firebase-auth"] },
        { name: "API Integration", capabilities: ["repo-scanner"] }
      ]
    },
    {
      name: "AI",
      chapters: [
        { name: "Embeddings", capabilities: ["embedding-gen"] },
        { name: "Reasoning", capabilities: ["context-builder", "agent-orchestrator"] }
      ]
    },
    {
      name: "Storage",
      chapters: [
        { name: "Database Connections", capabilities: ["firebase-conn"] },
        { name: "Vector Databases", capabilities: ["semantic-search"] }
      ]
    }
  ],
  capabilities: {
    "github-auth": {
      id: "github-auth",
      name: "GitHub API Authentication",
      purpose: "Authenticates requests to GitHub.",
      whyItExists: "Needed for accessing private repositories and performing actions on behalf of a user.",
      evolution: "Moved from simple PATs to scoped OAuth applications and fine-grained tokens.",
      bestImplementationId: "v1",
      dependencies: ["octokit", "oauth-lib"],
      volume: "Networking",
      chapter: "Authentication",
      variants: [
        {
          chunk: {
            id: "v1",
            repo: "core-utils",
            file: "auth/github.ts",
            name: "getGitHubClient",
            code: "export function getGitHubClient(token: string) {\n  return new Octokit({ auth: token });\n}",
            docstring: "Returns an authenticated Octokit client."
          }
        }
      ]
    },
    "firebase-conn": {
      id: "firebase-conn",
      name: "Firebase Connection",
      purpose: "Connect browser applications to Firestore and Authentication.",
      whyItExists: "Standard entry point for all real-time and persistent data features.",
      evolution: "Iterated from v8 namespaced API to v9/v10 modular functional API.",
      bestImplementationId: "v1",
      dependencies: ["firebase"],
      volume: "Storage",
      chapter: "Database Connections",
      variants: [
        {
          chunk: {
            id: "v1",
            repo: "web-app",
            file: "lib/firebase.ts",
            name: "initFirebase",
            code: "import { initializeApp } from 'firebase/app';\nimport { getFirestore } from 'firebase/firestore';\n\nexport const app = initializeApp(config);\nexport const db = getFirestore(app);",
            docstring: "Initializes Firebase services."
          }
        }
      ]
    },
    "repo-scanner": {
      id: "repo-scanner",
      name: "Repository Scanner",
      purpose: "Enumerates repositories and downloads source trees.",
      whyItExists: "Essential for bulk analysis, migration, or documentation tasks.",
      evolution: "Switched from shallow clones to tree-walking via API for performance.",
      bestImplementationId: "v1",
      dependencies: ["axios", "path"],
      volume: "Networking",
      chapter: "API Integration",
      variants: [
        {
          chunk: {
            id: "v1",
            repo: "encyclopedia-tool",
            file: "scanner.py",
            name: "scan_input_dir",
            code: "def scan_input_dir(root: Path):\n    for p in root.rglob('*.py'):\n        # logic here\n        pass",
            docstring: "Scans a directory for Python files."
          }
        }
      ]
    }
  }
};

function loadData(): EncyclopediaData {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  }
  return INITIAL_DATA;
}

function saveData(data: EncyclopediaData) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Routes
app.get("/api/encyclopedia", (req, res) => {
  res.json(loadData());
});

// --- GitHub PAT Auth & API Integration ---
let userGithubPat = process.env.GITHUB_PAT || "";

function getOctokit() {
  const token = userGithubPat || process.env.GITHUB_PAT;
  if (!token) throw new Error("GitHub PAT is not set. Please authenticate with a token first.");
  return new Octokit({ auth: token });
}

app.post("/api/github/token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Missing token" });
  userGithubPat = token;
  res.json({ success: true });
});

app.get("/api/github/status", (req, res) => {
  res.json({ connected: !!(userGithubPat || process.env.GITHUB_PAT) });
});

app.get("/api/github/repos", async (req, res) => {
  try {
    const octokit = getOctokit();
    const query = req.query.q as string;
    
    let ownRepos: any[] = [];
    try {
      ownRepos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
        sort: "updated",
        per_page: 100
      });
    } catch (e) {
      console.error("Failed to list authenticated user's repos:", e);
    }

    let publicRepos: any[] = [];
    try {
      if (query && query.trim().length > 0) {
        const searchRes = await octokit.rest.search.repos({
          q: `${query} is:public`,
          sort: "stars",
          order: "desc",
          per_page: 50
        });
        publicRepos = searchRes.data.items || [];
      } else {
        // Pre-fill with the top 100 biggest (highest-starred) repositories on GitHub
        const searchRes = await octokit.rest.search.repos({
          q: "stars:>35000 fork:false",
          sort: "stars",
          order: "desc",
          per_page: 100
        });
        publicRepos = searchRes.data.items || [];
      }
    } catch (e) {
      console.error("Failed to search public repos:", e);
    }

    // Merge and deduplicate by full_name
    const uniqueReposMap = new Map();
    
    for (const repo of ownRepos) {
      if (repo && repo.full_name) {
        uniqueReposMap.set(repo.full_name, {
          id: repo.id,
          name: repo.full_name,
          full_name: repo.full_name,
          private: repo.private,
          stargazers_count: repo.stargazers_count,
          isOwn: true
        });
      }
    }
    
    for (const repo of publicRepos) {
      if (repo && repo.full_name) {
        uniqueReposMap.set(repo.full_name, {
          id: repo.id,
          name: repo.full_name,
          full_name: repo.full_name,
          private: repo.private,
          stargazers_count: repo.stargazers_count,
          isOwn: false
        });
      }
    }

    const reposList = Array.from(uniqueReposMap.values());
    res.json(reposList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/github/publish", async (req, res) => {
  const { repoName } = req.body;
  if (!repoName) return res.status(400).json({ error: "Missing repoName" });

  try {
    const octokit = getOctokit();
    
    // Create new repo
    await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      description: "Encyclopedia of Engineering compiled via AI Studio",
      private: true,
      auto_init: true
    });

    // Wait a brief moment for the repo to be available
    await new Promise(r => setTimeout(r, 1500));

    const db = loadData();
    const content = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
    
    // Get the authenticated user's login
    const userRes = await octokit.rest.users.getAuthenticated();
    
    // Create the file in the new repo
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: userRes.data.login,
      repo: repoName,
      path: "data.json",
      message: "Initial commit of encyclopedia data",
      content: content
    });

    res.json({ success: true, url: `https://github.com/${userRes.data.login}/${repoName}` });
  } catch (error: any) {
    console.error("Publish error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/github/scan", async (req, res) => {
  const { repoFullName } = req.body; // e.g. "octocat/Hello-World"
  if (!repoFullName) return res.status(400).json({ error: "Missing repoFullName" });

  try {
    const octokit = getOctokit();
    const [owner, repo] = repoFullName.split("/");

    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    // Fetch the entire tree recursively
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: "true"
    });

    const codeFiles = treeData.tree.filter(f => 
      f.type === "blob" && f.path &&
      /\.(ts|js|py|tsx|jsx|go|rs|java|c|cpp|rb)$/.test(f.path)
    );

    if (codeFiles.length === 0) {
      return res.json({ success: true, message: "No source files found in repo." });
    }

    const aiClient = getAI();
    if (!aiClient) throw new Error("Gemini API not configured");

    let indexedCount = 0;
    
    // We process the files sequentially to prevent API timeouts or rate limits.
    // For large repos, this might take a while, but it will read all matching code files.
    for (const file of codeFiles) {
      try {
        const { data: fileData } = await octokit.rest.git.getBlob({
          owner,
          repo,
          file_sha: file.sha!
        });

        const code = Buffer.from(fileData.content, "base64").toString("utf-8");
        if (code.length > 30000) continue; // Skip huge files to avoid Gemini token limits

        // Reload data to ensure we capture newly created capabilities from previous loop iterations
        const db = loadData();
        const existingCapabilities = Object.values(db.capabilities).map(c => ({
          id: c.id,
          name: c.name,
          purpose: c.purpose
        }));

        const prompt = `You are building an Encyclopedia of Engineering Knowledge.
We organize code snippets into "Capabilities".

Current capabilities:
${JSON.stringify(existingCapabilities, null, 2)}

Analyze this code from ${repoFullName} - ${file.path}:
\`\`\`
${code.substring(0, 8000)} // Truncated for token limits
\`\`\`

Task:
1. Does this code implement one of the existing capabilities? 
2. If yes, return its capabilityId.
3. If no, propose a new capabilityId (kebab-case), name, purpose, whyItExists, evolution, dependencies, volume name (e.g. "Networking", "Storage", "UI", "AI", "Core"), and chapter name.

Return ONLY JSON:
{
  "isNewCapability": boolean,
  "capabilityId": "existing-id or new-id",
  "newCapabilityDetails": {
    "name": "...",
    "purpose": "...",
    "whyItExists": "...",
    "evolution": "...",
    "dependencies": ["..."],
    "volume": "...",
    "chapter": "..."
  },
  "chunkName": "Short descriptive name",
  "chunkSummary": "Brief summary"
}`;

        const result = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        
        
    let responseText = result.text || "{}";
    responseText = responseText.replace(/\s*```json\s*/gi, '').replace(/\s*```\s*/g, '').trim();
    let responseJson: any = {};
    try {
      responseJson = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON:", responseText);
      throw e;
    }

        const chunkId = Date.now().toString() + Math.random().toString(36).substring(7);
        const newChunk = {
          id: chunkId,
          repo: repoFullName,
          file: file.path || "unknown",
          name: responseJson.chunkName || "Snippet",
          code,
          docstring: responseJson.chunkSummary
        };

        const capabilityId = responseJson.capabilityId;

        if (responseJson.isNewCapability) {
          const volName = responseJson.newCapabilityDetails?.volume || "General";
          const chapName = responseJson.newCapabilityDetails?.chapter || "Misc";
          
          let vol = db.volumes.find(v => v.name === volName);
          if (!vol) {
            vol = { name: volName, chapters: [] };
            db.volumes.push(vol);
          }
          let chap = vol.chapters.find(c => c.name === chapName);
          if (!chap) {
            chap = { name: chapName, capabilities: [] };
            vol.chapters.push(chap);
          }
          if (!chap.capabilities.includes(capabilityId)) {
            chap.capabilities.push(capabilityId);
          }
          
          db.capabilities[capabilityId] = {
            id: capabilityId,
            name: responseJson.newCapabilityDetails?.name || capabilityId,
            purpose: responseJson.newCapabilityDetails?.purpose || "",
            whyItExists: responseJson.newCapabilityDetails?.whyItExists || "",
            evolution: responseJson.newCapabilityDetails?.evolution || "",
            dependencies: responseJson.newCapabilityDetails?.dependencies || [],
            volume: volName,
            chapter: chapName,
            bestImplementationId: chunkId,
            variants: [ { chunk: newChunk } ]
          };
        } else {
          const cap = db.capabilities[capabilityId];
          if (cap) {
            cap.variants.push({ chunk: newChunk });
          }
        }
        
        saveData(db);
        indexedCount++;
      } catch (err) {
        console.error("Error processing file", file.path, err);
      }
    }

    res.json({ success: true, indexedCount });
  } catch (error: any) {
    console.error("Scan error:", error);
    res.status(500).json({ error: error.message });
  }
});


import { runAutoSync } from "./autoSyncLogic.ts";

app.get("/api/github/auto-sync/status", (req, res) => {
  const state = loadSyncState();
  res.json({ ...state, isActuallyRunning: syncLoopActive });
});

app.post("/api/github/auto-sync/start", (req, res) => {
  if (!syncLoopActive) {
    runAutoSync(getOctokit, getAI, loadData, saveData).catch(err => {
       console.error("Auto sync failed", err);
    });
  }
  res.json({ success: true });
});

app.post("/api/github/auto-sync/reset", (req, res) => {
  if (syncLoopActive) {
    return res.status(400).json({ error: "Cannot reset while running" });
  }
  const emptyState = {
    isRunning: false,
    statusMessage: "Idle",
    processedRepos: [],
    currentRepo: null,
    processedFilesInCurrentRepo: [],
    totalFilesInCurrentRepo: 0,
    rateLimitPauseUntil: null,
    error: null,
    isFinished: false
  };
  saveSyncState(emptyState);
  res.json({ success: true });
});


app.get("/api/github/build-markdown", (req, res) => {
  try {
    const db = loadData();
    let md = "# Encyclopedia of Engineering Knowledge\n\n";
    
    for (const volume of db.volumes) {
      md += `## Volume: ${volume.name}\n\n`;
      for (const chapter of volume.chapters) {
        md += `### Chapter: ${chapter.name}\n\n`;
        for (const capId of chapter.capabilities) {
          const cap = db.capabilities[capId];
          if (!cap) continue;
          md += `#### Capability: ${cap.name}\n\n`;
          md += `**Purpose:** ${cap.purpose}\n\n`;
          if (cap.whyItExists) md += `**Why it exists:** ${cap.whyItExists}\n\n`;
          if (cap.evolution) md += `**Evolution:** ${cap.evolution}\n\n`;
          if (cap.dependencies && cap.dependencies.length > 0) md += `**Dependencies:** ${cap.dependencies.join(", ")}\n\n`;
          
          md += `**Implementations:**\n\n`;
          for (const variant of cap.variants) {
            md += `<details>\n<summary>${variant.chunk.repo} - ${variant.chunk.file}</summary>\n\n`;
            md += `*${variant.chunk.docstring}*\n\n`;
            md += `\`\`\`\n${variant.chunk.code}\n\`\`\`\n\n`;
            md += `</details>\n\n`;
          }
        }
      }
    }
    
    res.setHeader('Content-disposition', 'attachment; filename=ENCYCLOPEDIA.md');
    res.setHeader('Content-type', 'text/markdown');
    res.send(md);
  } catch (err) {
    console.error("Markdown build error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/analyze", async (req, res) => {
  const { code, filename, repo = "unknown" } = req.body;
  const aiClient = getAI();
  if (!aiClient) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const db = loadData();
    const existingCapabilities = Object.values(db.capabilities).map(c => ({
      id: c.id,
      name: c.name,
      purpose: c.purpose
    }));

    const prompt = `You are building an Encyclopedia of Engineering Knowledge.
We organize code snippets into "Capabilities" (engineering concepts/problems).

Current capabilities:
${JSON.stringify(existingCapabilities, null, 2)}

Analyze the following code snippet from ${repo} - ${filename}:
\`\`\`
${code}
\`\`\`

Task:
1. Does this code implement one of the existing capabilities listed above? 
2. If yes, return its existing capabilityId.
3. If no, this is a new capability. Propose a new capabilityId (kebab-case), name, purpose, whyItExists, evolution (a guess), dependencies, volume name (e.g. "Networking", "Storage", "UI", "AI", "Core"), and chapter name.

Return ONLY JSON:
{
  "isNewCapability": boolean,
  "capabilityId": "existing-id or new-id",
  "newCapabilityDetails": {
    "name": "...",
    "purpose": "...",
    "whyItExists": "...",
    "evolution": "...",
    "dependencies": ["..."],
    "volume": "...",
    "chapter": "..."
  },
  "chunkName": "Short descriptive name for this specific snippet, e.g. 'fetchData'",
  "chunkSummary": "Brief docstring/summary of what this specific chunk does."
}
`;

    const result = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const responseJson = JSON.parse(result.text || "{}");
    
    const chunkId = Date.now().toString() + Math.random().toString(36).substring(7);
    const newChunk = {
      id: chunkId,
      repo,
      file: filename,
      name: responseJson.chunkName || "Snippet",
      code,
      docstring: responseJson.chunkSummary
    };

    const capabilityId = responseJson.capabilityId;

    if (responseJson.isNewCapability) {
      const volName = responseJson.newCapabilityDetails.volume || "General";
      const chapName = responseJson.newCapabilityDetails.chapter || "Misc";
      
      let vol = db.volumes.find(v => v.name === volName);
      if (!vol) {
        vol = { name: volName, chapters: [] };
        db.volumes.push(vol);
      }
      let chap = vol.chapters.find(c => c.name === chapName);
      if (!chap) {
        chap = { name: chapName, capabilities: [] };
        vol.chapters.push(chap);
      }
      if (!chap.capabilities.includes(capabilityId)) {
        chap.capabilities.push(capabilityId);
      }
      
      db.capabilities[capabilityId] = {
        id: capabilityId,
        name: responseJson.newCapabilityDetails.name,
        purpose: responseJson.newCapabilityDetails.purpose,
        whyItExists: responseJson.newCapabilityDetails.whyItExists,
        evolution: responseJson.newCapabilityDetails.evolution,
        dependencies: responseJson.newCapabilityDetails.dependencies || [],
        volume: volName,
        chapter: chapName,
        bestImplementationId: chunkId,
        variants: [ { chunk: newChunk } ]
      };
    } else {
      const cap = db.capabilities[capabilityId];
      if (cap) {
        cap.variants.push({ chunk: newChunk });
      } else {
         // Fallback if AI hallucinates an ID
         const volName = "General";
         const chapName = "Uncategorized";
         let vol = db.volumes.find(v => v.name === volName);
          if (!vol) {
            vol = { name: volName, chapters: [] };
            db.volumes.push(vol);
          }
          let chap = vol.chapters.find(c => c.name === chapName);
          if (!chap) {
            chap = { name: chapName, capabilities: [] };
            vol.chapters.push(chap);
          }
          chap.capabilities.push(capabilityId);
          db.capabilities[capabilityId] = {
            id: capabilityId,
            name: capabilityId,
            purpose: "Auto-generated capability",
            whyItExists: "Unknown",
            evolution: "Unknown",
            dependencies: [],
            volume: volName,
            chapter: chapName,
            bestImplementationId: chunkId,
            variants: [ { chunk: newChunk } ]
          };
      }
    }
    
    saveData(db);
    res.json({ success: true, capabilityId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
async function startServer() {
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
