import fs from 'fs';

let serverStr = fs.readFileSync('server.ts', 'utf-8');

// 1. Remove CAPABILITY_ANALYSIS_SCHEMA from server.ts
serverStr = serverStr.replace(/const CAPABILITY_ANALYSIS_SCHEMA = \{[\s\S]*?^\};\n/m, '');

// 2. Add import for classifier to server.ts
serverStr = serverStr.replace('import { loadSyncState, saveSyncState, syncLoopActive, setSyncLoopActive } from "./syncManager.ts";', 'import { loadSyncState, saveSyncState, syncLoopActive, setSyncLoopActive } from "./syncManager.ts";\nimport { classifyAndStoreChunk } from "./classifier.ts";');

// 3. Add meta to INITIAL_DATA
serverStr = serverStr.replace('const INITIAL_DATA: EncyclopediaData = {', `const INITIAL_DATA: EncyclopediaData = {
  meta: {
    title: "Encyclopedia of Engineering",
    creator: "AI Agent",
    purpose: "A comprehensive knowledge base of engineering capabilities extracted from code.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },`);

// 4. Update every capability in INITIAL_DATA to have howItWorks and summary
serverStr = serverStr.replace(/bestImplementationId: "v1",/g, 'bestImplementationId: "v1",\n      howItWorks: "Mechanisms to be defined...",\n      summary: "A brief summary...",');

// 5. Update loadData to backfill meta
serverStr = serverStr.replace('return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));', `const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      if (!parsed.meta) {
        parsed.meta = {
          title: "Encyclopedia of Engineering",
          creator: "AI Agent",
          purpose: "A comprehensive knowledge base of engineering capabilities extracted from code.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return parsed;`);

// 6. Update saveData to update updatedAt
serverStr = serverStr.replace('fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));', `data.meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));`);

// 7. Update generateMarkdown / /api/github/build-markdown with frontmatter and TOC
const newGenerateMarkdown = `function generateMarkdown(db: EncyclopediaData): string {
  let md = \`# \${db.meta.title}\\n\\n\`;
  md += \`*Created by: \${db.meta.creator}*\\n\\n\`;
  md += \`**Purpose:** \${db.meta.purpose}\\n\\n\`;
  md += \`*Last Updated: \${new Date(db.meta.updatedAt).toLocaleString()}*\\n\\n\`;
  md += "---\\n\\n";
  
  md += "## Table of Contents\\n\\n";
  for (const volume of db.volumes) {
    md += \`- [\${volume.name}](#volume-\${volume.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\\n\`;
    for (const chapter of volume.chapters) {
      md += \`  - [\${chapter.name}](#chapter-\${chapter.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\\n\`;
      for (const capId of chapter.capabilities) {
        const cap = db.capabilities[capId];
        if (!cap) continue;
        md += \`    - [\${cap.name}](#capability-\${cap.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\\n\`;
      }
    }
  }
  md += "\\n---\\n\\n";
  
  for (const volume of db.volumes) {
    md += \`## Volume: \${volume.name}\\n\\n\`;
    for (const chapter of volume.chapters) {
      md += \`### Chapter: \${chapter.name}\\n\\n\`;
      for (const capId of chapter.capabilities) {
        const cap = db.capabilities[capId];
        if (!cap) continue;
        md += \`#### Capability: \${cap.name}\\n\\n\`;
        md += \`**Purpose:** \${cap.purpose}\\n\\n\`;
        md += \`**Summary:** \${cap.summary}\\n\\n\`;
        md += \`**How it works:** \${cap.howItWorks}\\n\\n\`;
        if (cap.whyItExists) md += \`**Why it exists:** \${cap.whyItExists}\\n\\n\`;
        if (cap.evolution) md += \`**Evolution:** \${cap.evolution}\\n\\n\`;
        if (cap.dependencies && cap.dependencies.length > 0) md += \`**Dependencies:** \${cap.dependencies.join(", ")}\\n\\n\`;
        
        md += \`**Implementations:**\\n\\n\`;
        for (const variant of cap.variants) {
          md += \`<details>\\n<summary>\${variant.chunk.repo} - \${variant.chunk.file}</summary>\\n\\n\`;
          md += \`*\${variant.chunk.docstring || "No description provided"}*\\n\\n\`;
          md += \`\\\`\\\`\\\`\\n\${variant.chunk.code}\\n\\\`\\\`\\\`\\n\\n\`;
          md += \`</details>\\n\\n\`;
        }
      }
    }
  }
  return md;
}`;
serverStr = serverStr.replace(/function generateMarkdown\(db: EncyclopediaData\): string \{[\s\S]*?^return md;\n\}/m, newGenerateMarkdown);

serverStr = serverStr.replace(/let md = "# Encyclopedia of Engineering Knowledge\\n\\n";[\s\S]*?^    \}/m, `let md = generateMarkdown(db);`);

// 8. Replace /api/github/scan processing loop
const scanProcessingLoopRegex = /const prompt = `You are building an Encyclopedia of Engineering Knowledge\.[\s\S]*?indexedCount\+\+;/m;
const newScanProcessingLoop = `const aiClient = getAI();
        const db = loadData();
        await classifyAndStoreChunk(file, repoFullName, code, db, aiClient, saveData);
        indexedCount++;`;
serverStr = serverStr.replace(scanProcessingLoopRegex, newScanProcessingLoop);

// 9. Replace /api/analyze processing logic
const analyzeProcessingRegex = /const prompt = `You are building an Encyclopedia of Engineering Knowledge\.[\s\S]*?saveData\(db\);\n    res\.json\(\{ success: true, capabilityId \}\);/m;
const newAnalyzeProcessing = `const aiClient = getAI();
    const db = loadData();
    const { capabilityId } = await classifyAndStoreChunk({ path: filename }, repo, code, db, aiClient, saveData);
    res.json({ success: true, capabilityId });`;
serverStr = serverStr.replace(analyzeProcessingRegex, newAnalyzeProcessing);

fs.writeFileSync('server.ts', serverStr, 'utf-8');
console.log("Updated server.ts");


let autoSyncStr = fs.readFileSync('autoSyncLogic.ts', 'utf-8');

autoSyncStr = autoSyncStr.replace(/const CAPABILITY_ANALYSIS_SCHEMA = \{[\s\S]*?^\};\n/m, '');
autoSyncStr = autoSyncStr.replace('import { Type } from "@google/genai";', 'import { classifyAndStoreChunk } from "./classifier.ts";');

const autoSyncProcessingRegex = /const prompt = `You are building an Encyclopedia of Engineering Knowledge\.[\s\S]*?await new Promise\(r => setTimeout\(r, 100\)\);/m;
const newAutoSyncProcessing = `const db = loadData();
             await classifyAndStoreChunk({ path: file.path }, repo.full_name, code, db, aiClient, saveData);
             state.processedFilesInCurrentRepo.push(file.path);
             saveSyncState(state);`;
autoSyncStr = autoSyncStr.replace(autoSyncProcessingRegex, newAutoSyncProcessing);

fs.writeFileSync('autoSyncLogic.ts', autoSyncStr, 'utf-8');
console.log("Updated autoSyncLogic.ts");
