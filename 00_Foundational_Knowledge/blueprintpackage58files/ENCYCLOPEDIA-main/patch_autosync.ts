import fs from 'fs';

let fileStr = fs.readFileSync('autoSyncLogic.ts', 'utf-8');

// 1. Fix the retry logic inside the codeFiles loop
const fileLoopRegex = /for \(const file of codeFiles\) \{[\s\S]*?saveSyncState\(state\);\n\s*\}\n\s*\}/m;

const newFileLoop = `for (let i = 0; i < codeFiles.length; i++) {
          const file = codeFiles[i];
          if (!file.path) continue;
          if (state.processedFilesInCurrentRepo.includes(file.path)) continue;

          let fileProcessed = false;
          while (!fileProcessed) {
            while (state.rateLimitPauseUntil && Date.now() < state.rateLimitPauseUntil) {
               state.statusMessage = \`Rate limit reached. Paused until \${new Date(state.rateLimitPauseUntil).toLocaleTimeString()}\`;
               saveSyncState(state);
               await new Promise(r => setTimeout(r, 5000));
            }
            state.rateLimitPauseUntil = null; 

            state.statusMessage = \`Scanning file: \${file.path} in \${repo.full_name}\`;
            saveSyncState(state);

            try {
               const { data: fileData } = await octokit.rest.git.getBlob({
                 owner: repo.owner.login,
                 repo: repo.name,
                 file_sha: file.sha!
               });

               const code = Buffer.from(fileData.content, "base64").toString("utf-8");
               if (code.length > 30000) {
                  state.processedFilesInCurrentRepo.push(file.path);
                  saveSyncState(state);
                  fileProcessed = true;
                  continue;
               }

               const aiClient = getAI();
               if (!aiClient) throw new Error("Gemini API not configured");
               
               const db = loadData();
               const existingCapabilities = Object.values(db.capabilities).map((c: any) => ({
                 id: c.id,
                 name: c.name,
                 purpose: c.purpose
               }));

               const prompt = \`You are building an Encyclopedia of Engineering Knowledge.
We organize code snippets into conceptual "Capabilities" (engineering concepts/problems) across various programming languages and systems.

Current capabilities:
\${JSON.stringify(existingCapabilities, null, 2)}

Analyze this code from \${repo.full_name} - \${file.path}:
\\\`\\\`\\\`
\${code.substring(0, 8000)}
\\\`\\\`\\\`

Task:
1. Does this code implement one of the existing conceptual capabilities? (e.g. if it's Python doing Firebase Auth, it belongs with the JavaScript Firebase Auth capability)
2. If yes, return its existing capabilityId.
3. If no, propose a new capabilityId (kebab-case), name, purpose, whyItExists, evolution, dependencies, volume name (e.g. "Networking", "Storage", "UI", "AI", "Core"), and chapter name.

CRITICAL INSTRUCTIONS:
- Capabilities should be high-level engineering concepts (e.g., "Firebase Initialization", "Repository Scanner", "JWT Validation", "Vector Embedding Generation").
- DO NOT name capabilities after specific filenames or isolated repositories unless absolutely necessary.
- Your goal is to merge Python, JavaScript, TypeScript, Markdown, etc. into the same conceptual article if they solve the same problem.

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
  "chunkName": "Short descriptive name (e.g. Python implementation)",
  "chunkSummary": "Brief summary of what this specific chunk does"
}\`;

               const result = await aiClient.models.generateContent({
                 model: "gemini-3.5-flash",
                 contents: prompt,
                 config: {
                   responseMimeType: "application/json",
                 }
               });
               
               let responseText = result.text || "{}";
               responseText = responseText.replace(/\\s*\\\`\\\`\\\`json\\s*/gi, '').replace(/\\s*\\\`\\\`\\\`\\s*/g, '').trim();
               const responseJson = JSON.parse(responseText);

               const chunkId = Date.now().toString() + Math.random().toString(36).substring(7);
               const newChunk = {
                 id: chunkId,
                 repo: repo.full_name,
                 file: file.path,
                 name: responseJson.chunkName || "Snippet",
                 code,
                 docstring: responseJson.chunkSummary
               };

               const capabilityId = responseJson.capabilityId;

               if (responseJson.isNewCapability) {
                 const volName = responseJson.newCapabilityDetails?.volume || "General";
                 const chapName = responseJson.newCapabilityDetails?.chapter || "Misc";
                 
                 let vol = db.volumes.find((v: any) => v.name === volName);
                 if (!vol) {
                   vol = { name: volName, chapters: [] };
                   db.volumes.push(vol);
                 }
                 let chap = vol.chapters.find((c: any) => c.name === chapName);
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
               state.processedFilesInCurrentRepo.push(file.path);
               saveSyncState(state);
               fileProcessed = true;
               
               await new Promise(r => setTimeout(r, 100));

            } catch (err: any) {
               if (err.status === 429 || err.message?.includes("429") || err.message?.includes("rate limit") || err.message?.includes("quota") || err.status === 503 || err.message?.includes("503") || err.message?.includes("UNAVAILABLE") || err.message?.includes("overloaded")) {
                  state.rateLimitPauseUntil = Date.now() + 30000;
                  saveSyncState(state);
                  // fileProcessed is still false, so we will retry this file!
               } else {
                  console.error(\`Error processing file \${file.path}:\`, err);
                  state.processedFilesInCurrentRepo.push(file.path);
                  saveSyncState(state);
                  fileProcessed = true;
               }
            }
          }
        }

        state.processedRepos.push(repo.full_name);
        state.processedFilesInCurrentRepo = [];
        saveSyncState(state);`;

fileStr = fileStr.replace(fileLoopRegex, newFileLoop);

// 2. Fix the repository processing order
const repoListRegex = /const finalReposList = Array\.from\(uniqueReposMap\.values\(\)\);\s*for \(const repo of finalReposList\) \{/m;

const newRepoList = `const finalReposList = Array.from(uniqueReposMap.values());

    if (state.currentRepo && !state.processedRepos.includes(state.currentRepo)) {
      const interruptedRepoIndex = finalReposList.findIndex((r: any) => r.full_name === state.currentRepo);
      if (interruptedRepoIndex > -1) {
        const interruptedRepo = finalReposList.splice(interruptedRepoIndex, 1)[0];
        finalReposList.unshift(interruptedRepo);
      }
    }

    for (const repo of finalReposList) {
      if (state.processedRepos.includes(repo.full_name)) continue;
      
      if (state.currentRepo !== repo.full_name) {
        state.processedFilesInCurrentRepo = [];
      }
      state.currentRepo = repo.full_name;`;

fileStr = fileStr.replace(repoListRegex, newRepoList);

fs.writeFileSync('autoSyncLogic.ts', fileStr, 'utf-8');

