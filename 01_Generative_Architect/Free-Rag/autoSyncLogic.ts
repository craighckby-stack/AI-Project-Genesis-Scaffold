// autoSyncLogic.ts
export async function runAutoSync(getOctokit: () => import("octokit").Octokit, getAI: () => any, loadData: () => any, saveData: (data: any) => void) {
  const { loadSyncState, saveSyncState, setSyncLoopActive } = await import("./syncManager.ts");
  setSyncLoopActive(true);
  const state = loadSyncState();
  state.isRunning = true;
  state.isFinished = false;
  state.error = null;
  saveSyncState(state);

  try {
    const octokit = getOctokit();
    let repos: any[] = [];
    
    // 1. Get user's own repos
    try {
      const ownRepos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
        sort: "updated",
        per_page: 100 
      });
      repos.push(...ownRepos);
    } catch (e) {
      console.error("Failed to list authenticated user repos:", e);
    }

    // 2. Search for the top 100 biggest, most popular public repositories across all of GitHub
    try {
      const searchResponse = await octokit.rest.search.repos({
        q: "stars:>35000 fork:false",
        sort: "stars",
        order: "desc",
        per_page: 100
      });
      if (searchResponse?.data?.items) {
        repos.push(...searchResponse.data.items);
      }
    } catch (e) {
      console.error("Failed to search all of GitHub:", e);
    }

    // Deduplicate repos by full_name
    const uniqueReposMap = new Map();
    for (const r of repos) {
      if (r && r.full_name) {
        uniqueReposMap.set(r.full_name, r);
      }
    }
    const finalReposList = Array.from(uniqueReposMap.values());

    for (const repo of finalReposList) {
      if (state.processedRepos.includes(repo.full_name)) continue;
      
      state.currentRepo = repo.full_name;
      state.statusMessage = `Scanning repository: ${repo.full_name}`;
      saveSyncState(state);

      try {
        const { data: repoData } = await octokit.rest.repos.get({ owner: repo.owner.login, repo: repo.name });
        const defaultBranch = repoData.default_branch;

        const { data: treeData } = await octokit.rest.git.getTree({
          owner: repo.owner.login,
          repo: repo.name,
          tree_sha: defaultBranch,
          recursive: "true"
        });

        const codeFiles = treeData.tree.filter(f => 
          f.type === "blob" && f.path &&
          /\.(ts|js|py|tsx|jsx|go|rs|java|c|cpp|rb)$/.test(f.path)
        );

        state.totalFilesInCurrentRepo = codeFiles.length;
        saveSyncState(state);

        for (const file of codeFiles) {
          if (!file.path) continue;
          if (state.processedFilesInCurrentRepo.includes(file.path)) continue;

          while (state.rateLimitPauseUntil && Date.now() < state.rateLimitPauseUntil) {
             state.statusMessage = `Rate limit reached. Paused until ${new Date(state.rateLimitPauseUntil).toLocaleTimeString()}`;
             saveSyncState(state);
             await new Promise(r => setTimeout(r, 10000));
          }
          state.rateLimitPauseUntil = null; 

          state.statusMessage = `Scanning file: ${file.path} in ${repo.full_name}`;
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

             const prompt = `You are building an Encyclopedia of Engineering Knowledge.
We organize code snippets into "Capabilities".

Current capabilities:
${JSON.stringify(existingCapabilities, null, 2)}

Analyze this code from ${repo.full_name} - ${file.path}:
\`\`\`
${code.substring(0, 8000)}
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
             responseText = responseText.replace(/\s*```json\s*/g, '').replace(/\s*```\s*/g, '').trim();
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
             
             await new Promise(r => setTimeout(r, 100));

          } catch (err: any) {
             if (err.status === 429 || err.message?.includes("429") || err.message?.includes("rate limit") || err.message?.includes("quota") || err.status === 503 || err.message?.includes("503") || err.message?.includes("UNAVAILABLE")) {
                state.rateLimitPauseUntil = Date.now() + 30000;
                saveSyncState(state);
             } else {
                console.error(`Error processing file ${file.path}:`, err);
                state.processedFilesInCurrentRepo.push(file.path);
                saveSyncState(state);
             }
          }
        }

        state.processedRepos.push(repo.full_name);
        state.processedFilesInCurrentRepo = [];
        saveSyncState(state);
      } catch (err: any) {
         console.error(`Error with repo ${repo.full_name}:`, err);
         state.processedRepos.push(repo.full_name);
         state.processedFilesInCurrentRepo = [];
         saveSyncState(state);
      }
    }
    
    state.isRunning = false;
    state.isFinished = true;
    state.statusMessage = "All repositories scanned successfully.";
    
    try {
       state.statusMessage = "Publishing to GitHub...";
       saveSyncState(state);
       
       const userRes = await octokit.rest.users.getAuthenticated();
       const repoName = "encyclopedia-of-engineering";
       
       let repoExists = true;
       try {
         await octokit.rest.repos.get({ owner: userRes.data.login, repo: repoName });
       } catch (e) {
         repoExists = false;
       }

       if (!repoExists) {
         await octokit.rest.repos.createForAuthenticatedUser({
           name: repoName,
           description: "Encyclopedia of Engineering compiled via AI Studio",
           private: true,
           auto_init: true
         });
         await new Promise(r => setTimeout(r, 2000));
       }

       const db = loadData();
       const content = Buffer.from(JSON.stringify(db, null, 2)).toString('base64');
       
       let fileSha;
       try {
         const fileRes = await octokit.rest.repos.getContent({
           owner: userRes.data.login,
           repo: repoName,
           path: "data.json"
         });
         if (!Array.isArray(fileRes.data) && fileRes.data.type === "file") {
           fileSha = fileRes.data.sha;
         }
       } catch (e) {
       }

       await octokit.rest.repos.createOrUpdateFileContents({
         owner: userRes.data.login,
         repo: repoName,
         path: "data.json",
         message: "Auto-sync update",
         content: content,
         sha: fileSha
       });
       
       state.statusMessage = `Published to ${userRes.data.login}/${repoName}`;
    } catch (e: any) {
       console.error("Auto publish error", e);
       state.statusMessage = "Finished scanning, but failed to auto-publish.";
    }

  } catch (err: any) {
    state.isRunning = false;
    state.error = err.message;
    state.statusMessage = "Error occurred";
  }
  
  saveSyncState(state);
  setSyncLoopActive(false);
}
