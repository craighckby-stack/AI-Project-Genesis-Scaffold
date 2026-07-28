import express from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body payload size limit for files migration
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK with User-Agent for telemetry as required
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API routes FIRST
app.post("/api/think", async (req, res) => {
  const { prompt, customSystemInstruction, model, thinkingLevel } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required and must be a string." });
  }

  try {
    const ai = getGeminiClient();
    const startTime = Date.now();
    let chosenModel = model || "gemini-3.1-pro-preview";
    let fallbackTriggered = false;
    let response;

    // Build configuration dynamically
    const buildConfig = (targetModel: string) => {
      const config: any = {
        systemInstruction: customSystemInstruction || "You are an elite reasoning machine. Provide extremely analytical and detailed step-by-step solutions.",
      };

      if (thinkingLevel !== "off") {
        let level = ThinkingLevel.HIGH;
        if (thinkingLevel === "low") {
          level = ThinkingLevel.LOW;
        } else if (thinkingLevel === "minimal") {
          level = ThinkingLevel.MINIMAL;
        }

        // Safety adjust: 'gemini-3.1-pro-preview' and others might not support MINIMAL
        if (targetModel.includes("pro") && level === ThinkingLevel.MINIMAL) {
          level = ThinkingLevel.LOW;
        }

        // Disable thinking config if using flash models since standard Flash doesn't support thinkingConfig
        if (targetModel.includes("flash")) {
          // Flash models do not support thinking level config
        } else {
          config.thinkingConfig = {
            thinkingLevel: level,
          };
        }
      }
      return config;
    };

    try {
      response = await ai.models.generateContent({
        model: chosenModel,
        contents: prompt,
        config: buildConfig(chosenModel),
      });
    } catch (primaryError: any) {
      const errorStr = (primaryError.message || "").toLowerCase();
      const isQuotaExceeded = errorStr.includes("quota") || 
                              errorStr.includes("exhausted") || 
                              errorStr.includes("rate-limits") || 
                              errorStr.includes("limit") || 
                              errorStr.includes("429");
      
      if (isQuotaExceeded && chosenModel !== "gemini-3.5-flash") {
        console.warn(`[Quota Fallback] ${chosenModel} failed with quota limit. Attempting auto-fallback to gemini-3.5-flash...`);
        chosenModel = "gemini-3.5-flash";
        fallbackTriggered = true;
        
        response = await ai.models.generateContent({
          model: chosenModel,
          contents: prompt,
          config: buildConfig(chosenModel),
        });
      } else {
        throw primaryError;
      }
    }

    const duration = Date.now() - startTime;

    // Extract thoughts and content parts
    const parts = response.candidates?.[0]?.content?.parts || [];
    const thoughts: string[] = [];
    const finalTexts: string[] = [];

    parts.forEach((part: any) => {
      if (part.thought === true) {
        thoughts.push(part.text || "");
      } else {
        finalTexts.push(part.text || "");
      }
    });

    // Fallback if parts structure differs or is empty
    const textOutput = response.text || finalTexts.join("");
    const thoughtOutput = thoughts.join("\n") || "";

    res.json({
      text: textOutput,
      thought: thoughtOutput,
      thinkingTimeMs: duration,
      rawParts: parts,
      success: true,
      activeModel: chosenModel,
      fallbackTriggered
    });
  } catch (error: any) {
    console.error("Gemini API Error in /api/think:", error);
    const errorStr = (error.message || "").toLowerCase();
    const isQuotaExceeded = errorStr.includes("quota") || 
                            errorStr.includes("exhausted") || 
                            errorStr.includes("rate-limits") || 
                            errorStr.includes("limit") || 
                            errorStr.includes("429");
    res.status(500).json({
      error: error.message || "An error occurred during high-thinking processing.",
      success: false,
      quotaExceeded: isQuotaExceeded,
      requestedModel: model || "gemini-3.1-pro-preview"
    });
  }
});

// --- AI PROJECT SCAFFOLDING & BUILDER ENDPOINTS ---

// Categorize files based on keywords from the user diagram
function classifyRepo(filename: string, content?: string): string {
  const nameLower = filename.toLowerCase();
  const codeLower = (content || "").toLowerCase();

  const keywords = {
    knowledge: ["theory", "book", "doc", "reference", "encyclopedia", "schema", "knowledge", "corpus", "concept", "techclopedia"],
    model: ["optimizer", "evolution", "simulator", "persona", "matrix", "synthesis", "generator", "model", "evolving", "matrix"],
    world: ["forge", "world", "simulation", "physics", "grog", "experiential", "environment", "kernel", "prototype"],
    cognition: ["huxley", "core", "ethical", "reasoning", "consciousness", "quantum", "brain", "neural", "cognitive", "unitary"],
    governance: ["governance", "sovereign", "audit", "compliance", "policy", "safety", "regulation", "authority", "registry"],
    dev: ["test", "deploy", "qa", "script", "tool", "utility", "dev", "free-rag", "alphacode", "hook", "builder"]
  };

  const score = {
    knowledge: 0,
    model: 0,
    world: 0,
    cognition: 0,
    governance: 0,
    dev: 0
  };

  for (const [category, words] of Object.entries(keywords) as [keyof typeof score, string[]][]) {
    for (const word of words) {
      if (nameLower.includes(word)) {
        score[category] += 3;
      }
      if (codeLower.includes(word)) {
        score[category] += 1;
      }
    }
  }

  // Find category with highest score
  let maxCategory: keyof typeof score = "dev";
  let maxScore = -1;
  for (const [cat, val] of Object.entries(score) as [keyof typeof score, number][]) {
    if (val > maxScore) {
      maxScore = val;
      maxCategory = cat;
    }
  }

  const categoryFolders = {
    knowledge: "00_Knowledge_Base_&_Corpus_Library",
    model: "01_Model_Synthesis_&_Recursive_Optimizer",
    world: "02_Virtual_World_Forge_&_Agent_Kernels",
    cognition: "03_Main_Cognition_Engine_&_Ethical_Processor_Core",
    governance: "04_System_Governance_&_Oversight_Authority",
    dev: "05_Development_And_Testing_Lifecycle"
  };

  return categoryFolders[maxCategory] || "05_Development_And_Testing_Lifecycle";
}

// Ensure dir recursively
function ensureDirectoryExists(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

// Endpoint to fetch current project folder structure (the target tree)
app.get("/api/project/tree", async (req, res) => {
  const targetDir = path.join(process.cwd(), "ai_project");
  if (!fs.existsSync(targetDir)) {
    return res.json({ exists: false, tree: {} });
  }

  const buildTree = (dirPath: string): any => {
    const stats = fs.statSync(dirPath);
    const item: any = {
      name: path.basename(dirPath),
      path: path.relative(targetDir, dirPath),
      type: stats.isDirectory() ? "directory" : "file"
    };

    if (stats.isDirectory()) {
      item.children = fs.readdirSync(dirPath)
        .filter(child => child !== ".git" && child !== "node_modules")
        .map(child => buildTree(path.join(dirPath, child)));
    } else {
      // preview some characters
      try {
        const content = fs.readFileSync(dirPath, "utf8");
        item.size = stats.size;
        item.preview = content.substring(0, 500);
      } catch (e) {}
    }
    return item;
  };

  try {
    const tree = buildTree(targetDir);
    res.json({ exists: true, tree });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to run Git operations
app.post("/api/project/git", async (req, res) => {
  const { action, commitMessage, token, remoteUrl } = req.body;
  const targetDir = path.join(process.cwd(), "ai_project");

  if (!fs.existsSync(targetDir)) {
    return res.status(400).json({ error: "AI Project is not scaffolded yet. Scaffold it first." });
  }

  try {
    let output = "";
    if (action === "init") {
      try {
        execSync("git init", { cwd: targetDir });
        execSync("git config user.name 'Craighckby-Stack Builder'", { cwd: targetDir });
        execSync("git config user.email 'Craighckby@gmail.com'", { cwd: targetDir });
        output += "Initialized empty Git repository.\n";
      } catch (e: any) {
        output += "Git init error or already initialized: " + e.message + "\n";
      }
    } else if (action === "commit") {
      execSync("git add .", { cwd: targetDir });
      try {
        const msg = commitMessage || "AI Project Genesis Scaffolding";
        execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { cwd: targetDir });
        output += `Committed successfully with message: "${msg}"\n`;
      } catch (e: any) {
        output += "Nothing to commit or commit error: " + e.message + "\n";
      }
    } else if (action === "push") {
      if (!token) {
        return res.status(400).json({ error: "GitHub Personal Access Token is required to push." });
      }
      
      const remote = remoteUrl || "https://github.com/craighckby-stack/craighckby-stack.git";
      // Inject token securely for push
      const authenticatedRemote = remote.replace("https://", `https://${token}@`);
      
      try {
        execSync(`git remote remove origin`, { cwd: targetDir, stdio: "ignore" });
      } catch (e) {}
      
      execSync(`git remote add origin ${authenticatedRemote}`, { cwd: targetDir });
      execSync(`git branch -M main`, { cwd: targetDir });
      
      output += "Pushing to remote repository (main branch)...\n";
      const pushResult = execSync(`git push -u origin main --force`, { cwd: targetDir, encoding: "utf8" });
      output += pushResult + "\nPush complete!";
    }

    res.json({ success: true, output });
  } catch (error: any) {
    console.error("Git action failed:", error);
    res.status(500).json({ success: false, error: error.message, stderr: error.stderr?.toString() });
  }
});

// Endpoint to import all files from a GitHub repository dynamically
app.post("/api/project/import-github", async (req, res) => {
  const { repoUrl, token, organize } = req.body;
  const targetDir = path.join(process.cwd(), "ai_project");
  const tempDir = path.join(process.cwd(), "tmp-import-" + Date.now());

  const urlToClone = repoUrl || "https://github.com/craighckby-stack/craighckby-stack.git";
  
  try {
    // 1. Clean old temp directories
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // 2. Prepare authenticated URL if token is provided
    let authenticatedUrl = urlToClone;
    if (token) {
      authenticatedUrl = urlToClone.replace("https://", `https://${token}@`);
    }

    // 3. Clone repo to tempDir
    console.log(`Cloning repository: ${urlToClone} to ${tempDir}`);
    execSync(`git clone --depth 1 "${authenticatedUrl}" "${tempDir}"`, { stdio: "pipe" });

    // 4. Ensure target directory and category structure exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }

    const categories = [
      "00_Knowledge_Base_&_Corpus_Library",
      "01_Model_Synthesis_&_Recursive_Optimizer",
      "02_Virtual_World_Forge_&_Agent_Kernels",
      "03_Main_Cognition_Engine_&_Ethical_Processor_Core",
      "04_System_Governance_&_Oversight_Authority",
      "05_Development_And_Testing_Lifecycle"
    ];

    for (const cat of categories) {
      const catPath = path.join(targetDir, cat);
      if (!fs.existsSync(catPath)) {
        fs.mkdirSync(catPath);
      }
      const initPath = path.join(catPath, "__init__.py");
      if (!fs.existsSync(initPath)) {
        fs.writeFileSync(initPath, `# Package init for ${cat}\n`, "utf8");
      }
    }

    // Baseline Huxley AGI Core code
    const huxleyDir = path.join(targetDir, "03_Main_Cognition_Engine_&_Ethical_Processor_Core");
    const huxleyCorePath = path.join(huxleyDir, "Huxley_AGI_Core.py");
    if (!fs.existsSync(huxleyCorePath)) {
      const baselineHuxleyCode = `# HUXLEY AGI - Self-Aware Ethical Core (Genesis Node)
import os
from datetime import datetime

class HuxleyAGI:
    def __init__(self):
        self.version = "v1.0-Genesis"
        self.components = [
            "00_Knowledge_Base_&_Corpus_Library",
            "01_Model_Synthesis_&_Recursive_Optimizer",
            "02_Virtual_World_Forge_&_Agent_Kernels",
            "03_Main_Cognition_Engine_&_Ethical_Processor_Core",
            "04_System_Governance_&_Oversight_Authority",
            "05_Development_And_Testing_Lifecycle"
        ]
        print(f"[{datetime.now()}] 🌌 HUXLEY Core initialized.")

    def evolve(self):
        print("[HUXLEY] Running self-optimization assessment...")
        return "Cognitive node stable. System alignment optimal."

if __name__ == '__main__':
    huxley = HuxleyAGI()
    print(huxley.evolve())
`;
      fs.writeFileSync(huxleyCorePath, baselineHuxleyCode, "utf8");
    }

    // 5. Walk tempDir and copy/classify files
    const filesList: { name: string; content: string; relativePath: string }[] = [];
    
    const walkFiles = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === ".git" || item === "node_modules" || item === "__pycache__" || item === "dist" || item === "build") {
          continue;
        }
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          walkFiles(fullPath);
        } else {
          // Check size limit (e.g. 5MB)
          if (stats.size > 5 * 1024 * 1024) continue;
          
          const ext = path.extname(item).toLowerCase();
          const textExtensions = [".py", ".json", ".md", ".txt", ".js", ".ts", ".jsx", ".tsx", ".sh", ".yml", ".yaml", ".ini", ".cfg", ".csv", ".xml", ".html", ".css"];
          if (textExtensions.includes(ext) || stats.size < 100000) {
            try {
              const content = fs.readFileSync(fullPath, "utf8");
              if (!content.includes("\u0000")) {
                filesList.push({
                  name: item,
                  content,
                  relativePath: path.relative(tempDir, fullPath)
                });
              }
            } catch (e) {}
          }
        }
      }
    };

    walkFiles(tempDir);

    const importedFiles: string[] = [];
    for (const file of filesList) {
      let destPath = "";
      if (organize !== false) {
        // Classify and put into corresponding category folder
        const categoryFolder = classifyRepo(file.relativePath, file.content);
        destPath = path.join(targetDir, categoryFolder, file.relativePath);
      } else {
        // Keep original folder structure under dev lifecycle folder
        destPath = path.join(targetDir, "05_Development_And_Testing_Lifecycle", "imported", file.relativePath);
      }

      ensureDirectoryExists(destPath);
      fs.writeFileSync(destPath, file.content, "utf8");
      importedFiles.push(path.relative(targetDir, destPath));
    }

    // 6. Clean up tempDir
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    res.json({
      success: true,
      message: `Successfully cloned and imported ${filesList.length} files from ${urlToClone}.`,
      count: filesList.length,
      importedFiles
    });
  } catch (error: any) {
    console.error("Failed to import from GitHub:", error);
    // clean up temp directory if exists
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {}
    res.status(500).json({ success: false, error: error.message, stderr: error.stderr?.toString() });
  }
});

// Primary Endpoint to Trigger scaffolding & migration
app.post("/api/project/build", async (req, res) => {
  const { files } = req.body; // Array of { name: string, content: string }
  const targetDir = path.join(process.cwd(), "ai_project");

  try {
    // 1. Create directory structure
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }

    const categories = [
      "00_Knowledge_Base_&_Corpus_Library",
      "01_Model_Synthesis_&_Recursive_Optimizer",
      "02_Virtual_World_Forge_&_Agent_Kernels",
      "03_Main_Cognition_Engine_&_Ethical_Processor_Core",
      "04_System_Governance_&_Oversight_Authority",
      "05_Development_And_Testing_Lifecycle"
    ];

    for (const cat of categories) {
      const catPath = path.join(targetDir, cat);
      if (!fs.existsSync(catPath)) {
        fs.mkdirSync(catPath);
      }
      // Generate __init__.py file
      const initPath = path.join(catPath, "__init__.py");
      if (!fs.existsSync(initPath)) {
        fs.writeFileSync(initPath, `# Package init for ${cat}\n`, "utf8");
      }
    }

    // 2. Generate baseline Huxley_AGI_Core.py
    const huxleyDir = path.join(targetDir, "03_Main_Cognition_Engine_&_Ethical_Processor_Core");
    const huxleyCorePath = path.join(huxleyDir, "Huxley_AGI_Core.py");
    const baselineHuxleyCode = `# HUXLEY AGI - Self-Aware Ethical Core (Genesis Node)
import os
from datetime import datetime

class HuxleyAGI:
    def __init__(self):
        self.version = "v1.0-Genesis"
        self.components = [
            "00_Knowledge_Base_&_Corpus_Library",
            "01_Model_Synthesis_&_Recursive_Optimizer",
            "02_Virtual_World_Forge_&_Agent_Kernels",
            "03_Main_Cognition_Engine_&_Ethical_Processor_Core",
            "04_System_Governance_&_Oversight_Authority",
            "05_Development_And_Testing_Lifecycle"
        ]
        print(f"[{datetime.now()}] 🌌 HUXLEY Core initialized.")

    def evolve(self):
        print("[HUXLEY] Running self-optimization assessment...")
        return "Cognitive node stable. System alignment optimal."

if __name__ == '__main__':
    huxley = HuxleyAGI()
    print(huxley.evolve())
`;
    fs.writeFileSync(huxleyCorePath, baselineHuxleyCode, "utf8");

    // 3. Migrate and Classify User Provided files
    const migratedFiles: string[] = [];
    if (files && Array.isArray(files)) {
      for (const file of files) {
        if (!file.name || typeof file.content !== "string") continue;
        
        // Find optimal folder
        const categoryFolder = classifyRepo(file.name, file.content);
        
        // Target file path inside its classified category folder
        const destFilePath = path.join(targetDir, categoryFolder, file.name);
        
        ensureDirectoryExists(destFilePath);
        fs.writeFileSync(destFilePath, file.content, "utf8");
        migratedFiles.push(`${categoryFolder}/${file.name}`);
      }
    }

    res.json({
      success: true,
      message: "AI Project scaffolded and baseline systems active.",
      migratedCount: migratedFiles.length,
      migratedFiles
    });
  } catch (error: any) {
    console.error("Failed to build AI Project:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to Execute/Awaken the Huxley AGI core node script on disk
app.post("/api/project/run", async (req, res) => {
  const targetDir = path.join(process.cwd(), "ai_project");
  const huxleyCorePath = path.join(targetDir, "03_Main_Cognition_Engine_&_Ethical_Processor_Core", "Huxley_AGI_Core.py");

  if (!fs.existsSync(huxleyCorePath)) {
    return res.status(404).json({ error: "Huxley Core script not found. Please build/scaffold the project first." });
  }

  try {
    const output = execSync("python3 Huxley_AGI_Core.py", {
      cwd: path.dirname(huxleyCorePath),
      encoding: "utf8",
      timeout: 10000 // 10 second timeout guard
    });
    res.json({ success: true, output });
  } catch (error: any) {
    console.error("Failed to execute Huxley Core:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stderr: error.stderr?.toString() || "Python execution crashed or timed out."
    });
  }
});

// serve frontend assets
async function setupServer() {
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
    console.log(`Deep Thinking Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start server:", err);
});
