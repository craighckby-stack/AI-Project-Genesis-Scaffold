/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { EncyclopediaData, Capability } from "./src/types.ts";
import { Octokit } from "octokit";
import fs from "fs";
import { loadSyncState, saveSyncState, syncLoopActive, setSyncLoopActive } from "./syncManager.ts";
import { classifyAndStoreChunk } from "./classifier.ts";

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
  meta: {
    title: "Encyclopedia of Engineering",
    creator: "AI Agent",
    purpose: "A comprehensive knowledge base of engineering capabilities extracted from code.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
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
      howItWorks: "Mechanisms to be defined...",
      summary: "A brief summary...",
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
    "firebase-auth": {
      id: "firebase-auth",
      name: "Firebase Authentication and Session Verification",
      purpose: "Logs in users via Firebase Auth and secures application routes using state listeners.",
      whyItExists: "Secures client-side routing and authenticates remote database transactions.",
      evolution: "Evolved from legacy session cookies to OAuth-backed JWT tokens refreshed automatically by client SDKs.",
      bestImplementationId: "v1",
      howItWorks: "Mechanisms to be defined...",
      summary: "A brief summary...",
      dependencies: ["firebase"],
      volume: "Networking",
      chapter: "Authentication",
      variants: [
        {
          chunk: {
            id: "v1",
            repo: "web-app",
            file: "lib/auth.ts",
            name: "loginAndListen",
            code: "import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';\n\nconst auth = getAuth();\n\nexport function loginUser(email, password) {\n  return signInWithEmailAndPassword(auth, email, password);\n}\n\nexport function listenToAuth(onUser) {\n  return onAuthStateChanged(auth, onUser);\n}",
            docstring: "Signs in user and listens to state changes dynamically."
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
      howItWorks: "Mechanisms to be defined...",
      summary: "A brief summary...",
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
      howItWorks: "Mechanisms to be defined...",
      summary: "A brief summary...",
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
    },
    "embedding-gen": {
      id: "embedding-gen",
      name: "Vector Embedding Generation",
      purpose: "Generates high-dimensional semantic vector embeddings from code snippets or text using Gemini SDK.",
      whyItExists: "Serves as the foundation for modern semantic search and repository clustering.",
      evolution: "Transitioned from TF-IDF and bag-of-words keyword indexing to deep learning dense representations.",
      bestImplementationId: "v1",
      howItWorks: "Mechanisms to be defined...",
      summary: "A brief summary...",
      dependencies: ["@google/genai"],
      volume: "AI",
      chapter: "Embeddings",
      variants: [
        {
          chunk: {
            id: "v1",
            repo: "ai-service",
            file: "embeddings.ts",
            name: "generateEmbedding",
            code: "import { GoogleGenAI } from '@google/genai';\n\nconst ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });\n\nexport async function generateEmbedding(text: string) {\n  const result = await ai.models.embedContent({\n    model: 'text-embedding-004',\n    contents: text,\n  });\n  return result.embedding.values;\n}",
            docstring: "Generates high-density embedding vectors using Gemini API."
          }
        }
      ]
    },
    "context-builder": {
      id: "context-builder",
      name: "AI Context Window Assembly",
      purpose: "Compresses raw source trees, metadata, and user prompts into a structured format that fits within LLM context windows.",
      whyItExists: "Large codebases exceed typical token budgets, necessitating intelligent relevance ranking and layout strategies.",
      evolution: "Moved from sliding character windows to AST-aware file-chunk extraction and semantic embeddings.",
      bestImplementationId: "v1",
      howItWorks: "Mechanisms to be defined...",
      summary: "A brief summary...",
      dependencies: ["path"],
      volume: "AI",
      chapter: "Reasoning",
      variants: [
        {
          chunk: {
            id: "v1",
            repo: "ai-orchestrator",
            file: "context.ts",
            name: "buildContextPrompt",
            code: "export function buildContextPrompt(files: { path: string; content: string }[], query: string) {\n  let context = 'You are analyzing the following codebase context:\\n\\n';\n  for (const file of files) {\n    context += `--- FILE: ${file.path} ---\\n`;\n    context += file.content.substring(0, 4000) + '\\n\\n';\n  }\n  context += `User Inquiry: ${query}\\n`;\n  return context;\n}",
            docstring: "Packs source files cleanly into a single unified context prompt."
          }
        }
      ]
    },
    "agent-orchestrator": {
      id: "agent-orchestrator",
      name: "Multi-Agent Routing & Orchestration",
      purpose: "Coordinates multiple domain-specific agents to solve complex code refactoring and migration problems.",
      whyItExists: "Single-prompt models fail on complex multi-step reasoning, requiring sub-tasks to be delegated.",
      evolution: "Progressed from hardcoded linear state machines to autonomous, goal-directed ReAct planning loops.",
      bestImplementationId: "v1",
      howItWorks: "Mechanisms to be defined...",
      summary: "A brief summary...",
      dependencies: ["events"],
      volume: "AI",
      chapter: "Reasoning",
      variants: [
        {
          chunk: {
            id: "v1",
            repo: "agent-framework",
            file: "orchestrator.ts",
            name: "AgentOrchestrator",
            code: "import { EventEmitter } from 'events';\n\nexport class AgentOrchestrator extends EventEmitter {\n  async routeTask(taskDescription: string) {\n    this.emit('status', 'Analyzing task scope...');\n    if (taskDescription.includes('database')) {\n      return this.executeAgent('DB_Agent', taskDescription);\n    } \n    return this.executeAgent('Refactor_Agent', taskDescription);\n  }\n\n  private async executeAgent(agentName: string, task: string) {\n    this.emit('agent_start', { agentName, task });\n    // Agent execution routines\n    return { status: 'completed', agent: agentName };\n  }\n}",
            docstring: "Event-driven coordinator delegating sub-tasks dynamically."
          }
        }
      ]
    },
    "semantic-search": {
      id: "semantic-search",
      name: "Cosine Similarity Vector Search",
      purpose: "Queries a list of embeddings and returns the most semantically relevant items using cosine similarity.",
      whyItExists: "Enables semantic search without requiring a heavy, external vector database server.",
      evolution: "Simple manual similarity calculations evolved into specialized vector indexing trees like HNSW.",
      bestImplementationId: "v1",
      howItWorks: "Mechanisms to be defined...",
      summary: "A brief summary...",
      dependencies: [],
      volume: "Storage",
      chapter: "Vector Databases",
      variants: [
        {
          chunk: {
            id: "v1",
            repo: "local-vector-db",
            file: "similarity.ts",
            name: "cosineSimilarity",
            code: "export function cosineSimilarity(vecA: number[], vecB: number[]): number {\n  let dotProduct = 0.0;\n  let normA = 0.0;\n  let normB = 0.0;\n  for (let i = 0; i < vecA.length; i++) {\n    dotProduct += vecA[i] * vecB[i];\n    normA += vecA[i] * vecA[i];\n    normB += vecB[i] * vecB[i];\n  }\n  if (normA === 0 || normB === 0) return 0;\n  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));\n}",
            docstring: "Performs low-level vector similarity search."
          }
        }
      ]
    }
  }
};

export function generateMarkdown(db: EncyclopediaData): string {
  let md = `# ${db.meta.title}\n\n`;
  md += `*Created by: ${db.meta.creator}*\n\n`;
  md += `**Purpose:** ${db.meta.purpose}\n\n`;
  md += `*Last Updated: ${new Date(db.meta.updatedAt).toLocaleString()}*\n\n`;
  md += "---\n\n";
  
  md += "## Table of Contents\n\n";
  for (const volume of db.volumes) {
    md += `- [${volume.name}](#volume-${volume.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`;
    for (const chapter of volume.chapters) {
      md += `  - [${chapter.name}](#chapter-${chapter.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`;
      for (const capId of chapter.capabilities) {
        const cap = db.capabilities[capId];
        if (!cap) continue;
        md += `    - [${cap.name}](#${cap.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`;
      }
    }
  }
  md += "\n---\n\n";
  
  for (const volume of db.volumes) {
    md += `## Volume: ${volume.name}\n\n`;
    for (const chapter of volume.chapters) {
      md += `### ${chapter.name}\n\n`;
      for (const capId of chapter.capabilities) {
        const cap = db.capabilities[capId];
        if (!cap) continue;
        md += `#### ${cap.name}\n\n`;
        
        md += `**1. What is it?**\n\n`;
        if (cap.summary) md += `${cap.summary}\n\n`;
        if (cap.howItWorks) md += `${cap.howItWorks}\n\n`;
        
        md += `**2. Why does it exist?**\n\n`;
        if (cap.purpose) md += `${cap.purpose}\n\n`;
        if (cap.whyItExists) md += `${cap.whyItExists}\n\n`;
        if (cap.evolution) md += `*Evolution:* ${cap.evolution}\n\n`;
        
        md += `**3. Where has it been used?**\n\n`;
        const repos = Array.from(new Set(cap.variants.map(v => v.chunk.repo)));
        for (const r of repos) {
           md += `- ${r}\n`;
        }
        md += `\n`;
        
        md += `**4. How is it implemented?**\n\n`;
        
        const canonical = cap.variants.find(v => v.chunk.id === cap.bestImplementationId);
        if (canonical) {
          md += `*Canonical Implementation (from ${canonical.chunk.repo} - ${canonical.chunk.file}):*\n\n`;
          md += `> ${canonical.chunk.docstring || canonical.chunk.name}\n\n`;
          md += `\`\`\`\n${canonical.chunk.code}\n\`\`\`\n\n`;
        }
        
        if (cap.variants.length > 1 || !canonical) {
          md += `**Variants:**\n\n`;
          for (const variant of cap.variants) {
            if (variant.chunk.id === cap.bestImplementationId) continue;
            md += `<details>\n<summary>${variant.chunk.name} (${variant.chunk.repo})</summary>\n\n`;
            md += `*${variant.chunk.docstring || variant.chunk.name}*\n\n`;
            md += `\`\`\`\n${variant.chunk.code}\n\`\`\`\n\n`;
            md += `</details>\n\n`;
          }
        }
      }
    }
  }
  
  return md;
}

function loadData(): EncyclopediaData {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      if (!parsed.meta) {
        parsed.meta = {
          title: "Encyclopedia of Engineering",
          creator: "AI Agent",
          purpose: "A comprehensive knowledge base of engineering capabilities extracted from code.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse existing data.json, resetting to INITIAL_DATA:", e);
    }
  }
  // Initialize on the fly with rich default data if file is missing
  saveData(INITIAL_DATA);
  return INITIAL_DATA;
}

function saveData(data: EncyclopediaData) {
  data.meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  try {
    const md = generateMarkdown(data);
    fs.writeFileSync(path.join(process.cwd(), "ENCYCLOPEDIA.md"), md, "utf-8");
  } catch (err) {
    console.error("Failed to compile ENCYCLOPEDIA.md on the fly:", err);
  }
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
    const dataContent = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
    const mdContent = Buffer.from(generateMarkdown(db)).toString('base64');
    
    // Get the authenticated user's login
    const userRes = await octokit.rest.users.getAuthenticated();
    
    // Create the data.json in the new repo
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: userRes.data.login,
      repo: repoName,
      path: "data.json",
      message: "Initial commit of encyclopedia data",
      content: dataContent
    });

    // Create the ENCYCLOPEDIA.md in the new repo
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: userRes.data.login,
      repo: repoName,
      path: "ENCYCLOPEDIA.md",
      message: "Initial commit of human-readable encyclopedia index",
      content: mdContent
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
        
        await classifyAndStoreChunk(file, repoFullName, code, db, aiClient, saveData);
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
    let md = generateMarkdown(db);
    
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
    const { capabilityId } = await classifyAndStoreChunk({ path: filename }, repo, code, db, aiClient, saveData);
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
    
    // Automatically trigger initial encyclopedia creation / auto-sync on startup if a token exists
    const hasToken = !!(userGithubPat || process.env.GITHUB_PAT);
    if (hasToken && !syncLoopActive) {
      console.log("Detecting GitHub credentials. Launching background auto-sync on the fly...");
      runAutoSync(getOctokit, getAI, loadData, saveData).catch(err => {
        console.error("Failed to run auto-sync on the fly:", err);
      });
    }
  });
}

startServer();
