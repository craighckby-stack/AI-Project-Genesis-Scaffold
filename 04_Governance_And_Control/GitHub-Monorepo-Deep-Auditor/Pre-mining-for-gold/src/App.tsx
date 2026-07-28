import { useState, useRef, useEffect } from "react";
import { Console } from "./components/Console";
import { LogMessage, RepoInfo } from "./types";
import { fetchGitHub, analyzeFiles, categorizeRepo, downloadFile } from "./lib/github";
import { Play, Github, ChevronRight, Download, Eye, Terminal, Pause, Square, Save, Copy } from "lucide-react";

const STATE_KEY = 'github-auditor-state';
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const getInitialSystemGroups = () => ({
  "DARLEK-CAAN": [],
  HUXLEY: [],
  SOVEREIGN: [],
  GROG: [],
  EMG: [],
  "EULER-ENGINE": [],
  "ECHO-CHAMBER": [],
  "AETHER-FORGE": [],
  "CHESS-AI": [],
  "BOOKS/DOCS": [],
  "TOOLS/UTILITIES": [],
  "UNCATEGORIZED MULTI-SYSTEM": [],
  "TEST/ARCHIVE": [],
  "UNCATEGORIZED / OTHER": [],
});

export default function App() {
  const [token, setToken] = useState("");
  const [auditStatus, setAuditStatus] = useState<'idle' | 'running' | 'paused' | 'stopped' | 'completed'>('idle');
  const statusRef = useRef(auditStatus);
  useEffect(() => { statusRef.current = auditStatus; }, [auditStatus]);

  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logsRef = useRef<LogMessage[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [fileContents, setFileContents] = useState<Record<string, string>>({});

  // Live metrics state
  const [metrics, setMetrics] = useState({
    totalRepos: 0, auditedRepos: 0, multiSystems: 0, totalBranches: 0
  });
  const metricsRef = useRef(metrics);

  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const categoryCountsRef = useRef(categoryCounts);

  const allReposRef = useRef<any[]>([]);
  const currentIndexRef = useRef(0);
  const inventoryRef = useRef<RepoInfo[]>([]);
  const branchMapRef = useRef<Record<string, string[]>>({});
  const systemGroupsRef = useRef<Record<string, RepoInfo[]>>(getInitialSystemGroups());

  const [hasSavedState, setHasSavedState] = useState(false);
  
  useEffect(() => {
    if (localStorage.getItem(STATE_KEY)) {
      setHasSavedState(true);
    }
  }, []);

  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        allReposRef.current = state.allRepos || [];
        currentIndexRef.current = state.currentIndex || 0;
        inventoryRef.current = state.inventory || [];
        branchMapRef.current = state.branchMap || {};
        systemGroupsRef.current = state.systemGroups || getInitialSystemGroups();
        metricsRef.current = state.metrics || { totalRepos: 0, auditedRepos: 0, multiSystems: 0, totalBranches: 0 };
        setMetrics(metricsRef.current);
        categoryCountsRef.current = state.categoryCounts || {};
        setCategoryCounts(categoryCountsRef.current);
        logsRef.current = state.logs || [];
        setLogs(logsRef.current);
        setAuditStatus('paused');
        addLog("💾 Loaded saved state. Ready to resume.", "success");
      }
    } catch (e) {
      console.error("Failed to load state", e);
    }
  };

  const saveStateToStorage = () => {
    try {
      const state = {
        allRepos: allReposRef.current,
        currentIndex: currentIndexRef.current,
        inventory: inventoryRef.current,
        branchMap: branchMapRef.current,
        systemGroups: systemGroupsRef.current,
        metrics: metricsRef.current,
        categoryCounts: categoryCountsRef.current,
        logs: logsRef.current
      };
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      setHasSavedState(true);
    } catch (e) {}
  };

  const clearSavedState = () => {
    localStorage.removeItem(STATE_KEY);
    setHasSavedState(false);
  };

  const addLog = (text: string, type: LogMessage["type"] = "info") => {
    const newLog = { id: crypto.randomUUID(), text, type };
    logsRef.current = [...logsRef.current, newLog];
    setLogs([...logsRef.current]);
  };
  
  const updateMetrics = (updates: Partial<typeof metricsRef.current>) => {
    metricsRef.current = { ...metricsRef.current, ...updates };
    setMetrics(metricsRef.current);
  };

  const updateCategoryCounts = (category: string) => {
    categoryCountsRef.current = {
      ...categoryCountsRef.current,
      [category]: (categoryCountsRef.current[category] || 0) + 1
    };
    setCategoryCounts(categoryCountsRef.current);
  };

  const startAudit = async (resume = false) => {
    if (!token.trim()) {
      alert("Please provide a GitHub Personal Access Token.");
      return;
    }

    setAuditStatus("running");
    setIsComplete(false);

    if (!resume) {
      logsRef.current = [];
      setLogs([]);
      setDownloadUrls({});
      updateMetrics({ totalRepos: 0, auditedRepos: 0, multiSystems: 0, totalBranches: 0 });
      categoryCountsRef.current = {};
      setCategoryCounts({});
      
      currentIndexRef.current = 0;
      inventoryRef.current = [];
      branchMapRef.current = {};
      systemGroupsRef.current = getInitialSystemGroups();
      
      clearSavedState();

      addLog("📋 Fetching all repositories...", "info");

      try {
        let allRepos: any[] = [];
        let page = 1;

        while (true) {
          if (statusRef.current === 'stopped') break;
          const repos = await fetchGitHub(`/user/repos?per_page=100&page=${page}&affiliation=owner,collaborator`, token);
          if (!repos || repos.length === 0) break;
          allRepos = allRepos.concat(repos);
          if (repos.length < 100) break;
          page++;
        }

        if (statusRef.current === 'stopped') {
           setAuditStatus('idle');
           return;
        }

        allReposRef.current = allRepos;
        updateMetrics({ totalRepos: allRepos.length });
        addLog(`✅ Found ${allRepos.length} repositories`, "success");
        saveStateToStorage();
      } catch (err: any) {
        addLog(`\n❌ Fatal Error during fetch: ${err.message}`, "error");
        setAuditStatus('idle');
        return;
      }
    }

    addLog(resume ? "▶️ Resuming Deep Structural Audit...\n" : "🔍 Running Deep Structural Audit...\n", "info");

    try {
      for (let i = currentIndexRef.current; i < allReposRef.current.length; i++) {
        if (statusRef.current === 'stopped') break;
        
        while (statusRef.current === 'paused') {
          await sleep(500);
          if (statusRef.current === 'stopped') break;
        }
        if (statusRef.current === 'stopped') break;

        const repo = allReposRef.current[i];
        currentIndexRef.current = i;
        const owner = repo.owner.login;
        const name = repo.name;
        const defaultBranch = repo.default_branch || "main";

        addLog(`⏳ [${i + 1}/${allReposRef.current.length}] Analyzing ${name}...`, "info");

        // 1. Fetch Branches
        const branchesData = await fetchGitHub(`/repos/${owner}/${name}/branches`, token);
        const branches = branchesData ? branchesData.map((b: any) => b.name) : [];
        branchMapRef.current[name] = branches;

        // 2. Fetch README
        const readmeData = await fetchGitHub(`/repos/${owner}/${name}/readme`, token);
        let readmeContent = "";
        if (readmeData && readmeData.content) {
          try {
            readmeContent = atob(readmeData.content.replace(/\n/g, ""));
          } catch (e) {
            console.warn(`Could not decode readme for ${name}`);
          }
        }

        // 3. Deep-scan Git Tree
        const treeData = await fetchGitHub(`/repos/${owner}/${name}/git/trees/${defaultBranch}?recursive=1`, token);
        const files = treeData && treeData.tree ? treeData.tree : [];
        const fileAnalysis = analyzeFiles(files);

        // 4. Categorize
        const category = categorizeRepo(name, readmeContent, fileAnalysis);

        const repoInfo: RepoInfo = {
          name: name,
          url: repo.html_url,
          description: repo.description || "No description",
          category: category,
          language: repo.language || "N/A",
          default_branch: defaultBranch,
          branches_count: branches.length,
          branches: branches,
          primary_stack: fileAnalysis.primaryStack,
          is_multi_system: fileAnalysis.isMultiSystem,
          subsystems: fileAnalysis.subsystems,
          updated_at: repo.updated_at,
        };

        inventoryRef.current.push(repoInfo);
        if (!systemGroupsRef.current[category]) systemGroupsRef.current[category] = [];
        systemGroupsRef.current[category].push(repoInfo);

        // Update live metrics
        updateMetrics({
          auditedRepos: i + 1,
          multiSystems: metricsRef.current.multiSystems + (fileAnalysis.isMultiSystem ? 1 : 0),
          totalBranches: metricsRef.current.totalBranches + branches.length
        });
        updateCategoryCounts(category);

        // Save progress after each repo
        saveStateToStorage();

        if (i < allReposRef.current.length - 1) {
          addLog(`⏳ Cooldown (5s) to prevent rate limits...`, "warning");
          let waited = 0;
          while (waited < 5000) {
            if (statusRef.current === 'stopped') break;
            while (statusRef.current === 'paused') {
              await sleep(500);
              if (statusRef.current === 'stopped') break;
            }
            if (statusRef.current === 'stopped') break;
            await sleep(200);
            waited += 200;
          }
        }
      }

      if (statusRef.current === 'paused') {
         return;
      }

      if (statusRef.current === 'stopped') {
        addLog("\n🛑 Audit stopped by user. Generating reports for audited repos...", "warning");
      } else {
        addLog(`\n✨ Audit complete! Generating rich structure reports...`, "success");
      }

      // Generate INVENTORY.md
      let inventoryMD = `# Deep Repository Inventory & Stack Matrix\n\n`;
      inventoryMD += `**Total Repositories Analyzed**: ${inventoryRef.current.length}\n`;
      inventoryMD += `**Generated**: ${new Date().toISOString()}\n\n`;
      inventoryMD += `## Quick Stats\n\n`;

      let multiSystemCount = 0;
      inventoryRef.current.forEach((r) => {
        if (r.is_multi_system) multiSystemCount++;
      });
      inventoryMD += `- **Multi-System Repos**: ${multiSystemCount}\n`;
      inventoryMD += `- **Total Branches**: ${Object.values(branchMapRef.current).reduce((sum, branches) => sum + branches.length, 0)}\n`;
      inventoryMD += `- **Avg Branches/Repo**: ${(
        Object.values(branchMapRef.current).reduce((sum, branches) => sum + branches.length, 0) / (inventoryRef.current.length || 1)
      ).toFixed(1)}\n\n`;

      inventoryMD += `## Repository Matrix\n\n`;
      inventoryMD += `| Repository | Category | Detected Stack | Multi-System | Branches | Last Updated |\n`;
      inventoryMD += `|------------|----------|----------------|--------------|----------|---------------|\n`;

      [...inventoryRef.current]
        .sort((a, b) => a.category.localeCompare(b.category))
        .forEach((r) => {
          const multiMarker = r.is_multi_system ? `✅ (${r.subsystems.join(", ")})` : "❌";
          const updated = new Date(r.updated_at).toLocaleDateString();
          inventoryMD += `| [${r.name}](${r.url}) | **${r.category}** | \`${r.primary_stack}\` | ${multiMarker} | \`${r.default_branch}\` (${r.branches_count}) | ${updated} |\n`;
        });

      downloadFile("INVENTORY.md", inventoryMD);
      setDownloadUrls(prev => ({ ...prev, "INVENTORY.md": URL.createObjectURL(new Blob([inventoryMD], { type: "text/markdown" })) }));
      setFileContents(prev => ({ ...prev, "INVENTORY.md": inventoryMD }));
      addLog("✅ Downloaded: INVENTORY.md", "success");

      // Generate BRANCH_MAP.json
      const branchMapStr = JSON.stringify(branchMapRef.current, null, 2);
      downloadFile("BRANCH_MAP.json", branchMapStr);
      setDownloadUrls(prev => ({ ...prev, "BRANCH_MAP.json": URL.createObjectURL(new Blob([branchMapStr], { type: "application/json" })) }));
      setFileContents(prev => ({ ...prev, "BRANCH_MAP.json": branchMapStr }));
      addLog("✅ Downloaded: BRANCH_MAP.json", "success");

      // Generate SYSTEM_GROUPS.json
      const systemGroupsDetailed: any = {};
      Object.entries(systemGroupsRef.current).forEach(([group, repos]) => {
        if (repos.length > 0) {
            systemGroupsDetailed[group] = repos.map((r) => ({
            name: r.name,
            url: r.url,
            branches: r.branches_count,
            stack: r.primary_stack,
            isMultiSystem: r.is_multi_system,
            }));
        }
      });
      const systemGroupsStr = JSON.stringify(systemGroupsDetailed, null, 2);
      downloadFile("SYSTEM_GROUPS.json", systemGroupsStr);
      setDownloadUrls(prev => ({ ...prev, "SYSTEM_GROUPS.json": URL.createObjectURL(new Blob([systemGroupsStr], { type: "application/json" })) }));
      setFileContents(prev => ({ ...prev, "SYSTEM_GROUPS.json": systemGroupsStr }));
      addLog("✅ Downloaded: SYSTEM_GROUPS.json", "success");

      // Generate AI Consolidation Plan
      addLog("\n🧠 Initializing Gemini High Thinking for Architectural Strategy...", "info");
      addLog("⏳ Analyzing audited portfolio (this may take 10-30 seconds)...", "warning");
      
      try {
        const simplifiedInventory = inventoryRef.current.map((r: any) => ({
            name: r.name,
            category: r.category,
            stack: r.primary_stack,
            multi: r.is_multi_system,
            subs: r.subsystems
        }));

        const aiResponse = await fetch("/api/generate-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inventory: simplifiedInventory })
        });

        if (!aiResponse.ok) {
          const error = await aiResponse.json();
          throw new Error(error.error || "Failed to generate AI plan");
        }

        const { plan } = await aiResponse.json();
        
        downloadFile("CONSOLIDATION_PLAN.md", plan);
        setDownloadUrls(prev => ({ ...prev, "CONSOLIDATION_PLAN.md": URL.createObjectURL(new Blob([plan], { type: "text/markdown" })) }));
        setFileContents(prev => ({ ...prev, "CONSOLIDATION_PLAN.md": plan }));
        addLog("✅ Generated and Downloaded: CONSOLIDATION_PLAN.md", "success");
      } catch (planError: any) {
        addLog(`❌ AI Plan Generation Failed: ${planError.message}`, "error");
        addLog("⚠️ Continuing without CONSOLIDATION_PLAN.md. Please check your Gemini API quota limits.", "warning");
      }

      addLog("\n📊 Finalizing Audit...\n", "info");
      setIsComplete(true);
      setAuditStatus("completed");
      clearSavedState(); // Clear state because we finished
      
    } catch (err: any) {
      addLog(`\n❌ Fatal Error during audit: ${err.message}`, "error");
      console.error(err);
      setAuditStatus("idle");
    }
  };

  const handleCopy = (filename: string) => {
    const content = fileContents[filename];
    if (content) {
      navigator.clipboard.writeText(content).then(() => {
        addLog(`📋 Copied ${filename} to clipboard.`, "info");
      }).catch(err => {
        console.error("Failed to copy:", err);
        addLog(`❌ Failed to copy ${filename} to clipboard.`, "error");
      });
    }
  };

  const progress = metrics.totalRepos > 0 ? (metrics.auditedRepos / metrics.totalRepos) * 100 : 0;

  // Calculate top categories for display
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([name]) => name !== "TEST/ARCHIVE" && name !== "UNCATEGORIZED / OTHER");
  
  const topCategories = sortedCategories.slice(0, 4);
  const getCategoryColor = (index: number) => {
    const colors = ["text-indigo-400", "text-emerald-400", "text-sky-400", "text-rose-400"];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col w-full min-h-screen lg:h-screen bg-[#0A0A0C] text-slate-300 font-sans p-4 lg:p-6 lg:overflow-hidden">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Github className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">GitHub Monorepo Deep Auditor</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Structural Integrity Scanner v2.4.1</p>
          </div>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Environment</span>
            <span className="text-emerald-400 text-xs font-mono">Local Browser Instance</span>
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 grid-rows-none lg:grid-rows-6 gap-4 flex-1 lg:min-h-0">
        
        {/* Configuration Card */}
        <div className="col-span-12 lg:col-span-4 lg:row-span-2 bg-[#151518] border border-[#26262A] rounded-2xl p-5 flex flex-col justify-between min-h-[160px]">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Access Authentication</label>
            <div className="relative">
              <input 
                type="password" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                disabled={auditStatus === 'running' || auditStatus === 'paused'}
                className="w-full bg-[#0D0D0F] border border-[#26262A] text-indigo-400 font-mono text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50" 
              />
              <div className="absolute right-3 top-3.5 text-slate-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM7 7a3 3 0 116 0v2H7V7z"></path></svg>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            {(auditStatus === 'idle' || auditStatus === 'completed') && (
              <>
                <button 
                  onClick={() => startAudit(false)}
                  disabled={!token.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:text-white/50 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Initiate Fresh Scan</span>
                </button>
                {hasSavedState && (
                  <button 
                    onClick={loadSavedState}
                    disabled={!token.trim()}
                    className="w-full bg-[#26262A] hover:bg-[#323236] text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>Load Saved Scan</span>
                  </button>
                )}
              </>
            )}

            {auditStatus === 'running' && (
              <>
                <button 
                  onClick={() => setAuditStatus('paused')}
                  className="w-full bg-amber-600/90 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Scan</span>
                </button>
                <button 
                  onClick={() => setAuditStatus('stopped')}
                  className="w-full bg-red-600/10 hover:bg-red-600/30 text-red-400 font-bold py-2.5 border border-red-900 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop & Generate</span>
                </button>
              </>
            )}

            {auditStatus === 'paused' && (
              <>
                <button 
                  onClick={() => startAudit(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume Scan</span>
                </button>
                <button 
                  onClick={() => setAuditStatus('stopped')}
                  className="w-full bg-red-600/10 hover:bg-red-600/30 text-red-400 font-bold py-2.5 border border-red-900 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop & Generate</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metric: Total Repos */}
        <div className="col-span-6 lg:col-span-2 lg:row-span-1 bg-[#151518] border border-[#26262A] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px]">
          <span className="text-3xl font-bold text-white">{metrics.totalRepos || '-'}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Repositories</span>
        </div>

        {/* Metric: Multi-System */}
        <div className="col-span-6 lg:col-span-2 lg:row-span-1 bg-[#151518] border border-[#26262A] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px]">
          <span className="text-3xl font-bold text-orange-400">{metrics.multiSystems || '-'}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Multi-Systems</span>
        </div>

        {/* Metric: Branch Load */}
        <div className="col-span-12 lg:col-span-4 lg:row-span-1 bg-[#151518] border border-[#26262A] rounded-2xl p-4 flex items-center min-h-[100px]">
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Branch Load</span>
              <span className="text-xs font-mono text-white">{metrics.totalBranches} Total</span>
            </div>
            <div className="h-2 bg-[#0D0D0F] rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: metrics.totalRepos ? '100%' : '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Scanning Status / Categories */}
        <div className="col-span-12 lg:col-span-8 lg:row-span-1 bg-[#151518] border border-[#26262A] rounded-2xl p-4 flex flex-wrap lg:flex-nowrap items-center justify-around gap-4 min-h-[100px]">
          {topCategories.length > 0 ? (
            topCategories.map(([cat, count], idx) => {
              const percentage = metrics.auditedRepos ? ((count / metrics.auditedRepos) * 100).toFixed(1) : "0.0";
              return (
                <div key={cat} className={`text-center ${idx < topCategories.length - 1 ? 'lg:border-r border-[#26262A] lg:pr-8' : ''} ${idx > 0 ? 'lg:px-8' : ''}`}>
                  <span className={`block font-mono text-sm ${getCategoryColor(idx)}`}>{percentage}%</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{cat}</span>
                </div>
              );
            })
          ) : (
            <div className="text-center w-full">
              <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">No data yet</span>
            </div>
          )}
        </div>

        {/* Main Console / Output */}
        <Console logs={logs} isRunning={auditStatus === 'running'} progress={progress} />

        {/* Side Action Panel */}
        <div className="col-span-12 lg:col-span-4 lg:row-span-4 bg-[#151518] border border-[#26262A] rounded-2xl p-5 flex flex-col gap-4 min-h-[300px]">
          <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-tighter">Export Manifests</h3>
          
          <div className="flex-1 flex flex-col gap-3">
            {downloadUrls["INVENTORY.md"] ? (
              <div className="flex gap-2">
                <a href={downloadUrls["INVENTORY.md"]} download="INVENTORY.md" target="_blank" rel="noopener noreferrer" className="flex-1 group p-3 rounded-xl border flex items-center justify-between transition-all bg-[#1a1a24] border-indigo-500/30 hover:bg-indigo-900/40 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-indigo-300">INVENTORY.md</p>
                    <p className="text-[10px] text-slate-500">Full Repository Matrix</p>
                  </div>
                  <Download className="w-4 h-4 text-indigo-400" />
                </a>
                <button onClick={() => handleCopy("INVENTORY.md")} className="p-3 rounded-xl border border-indigo-500/30 bg-[#1a1a24] hover:bg-indigo-900/40 transition-all flex items-center justify-center cursor-pointer text-indigo-400" title="Copy to Clipboard">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="group p-3 rounded-xl border flex items-center justify-between transition-all bg-[#0D0D0F] border-[#26262A] opacity-40">
                <div>
                  <p className="text-xs font-bold text-white">INVENTORY.md</p>
                  <p className="text-[10px] text-slate-500">Full Repository Matrix</p>
                </div>
                <Download className="w-4 h-4 text-slate-600" />
              </div>
            )}

            {downloadUrls["BRANCH_MAP.json"] ? (
              <div className="flex gap-2">
                <a href={downloadUrls["BRANCH_MAP.json"]} download="BRANCH_MAP.json" target="_blank" rel="noopener noreferrer" className="flex-1 group p-3 rounded-xl border flex items-center justify-between transition-all bg-[#1a1a24] border-indigo-500/30 hover:bg-indigo-900/40 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-indigo-300">BRANCH_MAP.json</p>
                    <p className="text-[10px] text-slate-500">Git Reference Tree</p>
                  </div>
                  <Download className="w-4 h-4 text-indigo-400" />
                </a>
                <button onClick={() => handleCopy("BRANCH_MAP.json")} className="p-3 rounded-xl border border-indigo-500/30 bg-[#1a1a24] hover:bg-indigo-900/40 transition-all flex items-center justify-center cursor-pointer text-indigo-400" title="Copy to Clipboard">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="group p-3 rounded-xl border flex items-center justify-between transition-all bg-[#0D0D0F] border-[#26262A] opacity-40">
                <div>
                  <p className="text-xs font-bold text-white">BRANCH_MAP.json</p>
                  <p className="text-[10px] text-slate-500">Git Reference Tree</p>
                </div>
                <Download className="w-4 h-4 text-slate-600" />
              </div>
            )}

            {downloadUrls["CONSOLIDATION_PLAN.md"] ? (
              <div className="flex gap-2">
                <a href={downloadUrls["CONSOLIDATION_PLAN.md"]} download="CONSOLIDATION_PLAN.md" target="_blank" rel="noopener noreferrer" className="flex-1 group p-3 rounded-xl border flex items-center justify-between transition-all bg-[#2a1a15] border-orange-500/30 hover:bg-orange-900/40 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-orange-400 group-hover:text-orange-300">CONSOLIDATION_PLAN.md</p>
                    <p className="text-[10px] text-slate-500">Monorepo Strategy Docs</p>
                  </div>
                  <Download className="w-4 h-4 text-orange-400" />
                </a>
                <button onClick={() => handleCopy("CONSOLIDATION_PLAN.md")} className="p-3 rounded-xl border border-orange-500/30 bg-[#2a1a15] hover:bg-orange-900/40 transition-all flex items-center justify-center cursor-pointer text-orange-400" title="Copy to Clipboard">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="group p-3 rounded-xl border flex items-center justify-between transition-all bg-[#0D0D0F] border-[#26262A] opacity-40">
                <div>
                  <p className="text-xs font-bold text-white">CONSOLIDATION_PLAN.md</p>
                  <p className="text-[10px] text-slate-500">Monorepo Strategy Docs</p>
                </div>
                <Download className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>

          <div className="mt-auto pt-4">
            <div className={`border rounded-xl p-4 transition-all ${isComplete ? 'bg-indigo-900/10 border-indigo-500/20' : 'bg-[#0D0D0F] border-[#26262A]'}`}>
              <p className={`text-[10px] font-bold uppercase mb-1 tracking-tight ${isComplete ? 'text-indigo-300' : 'text-slate-500'}`}>System Notice</p>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                {isComplete ? (
                   <span>Structural analysis complete. <br/><strong className="text-slate-300">Note:</strong> If automatic downloads fail due to browser preview limits, please use the <strong className="text-indigo-300 font-bold">Copy</strong> buttons above to grab your manifests manually.</span>
                ) : (
                   <span>Awaiting initialization. Provide an access token and initiate deep scan to begin structural analysis.</span>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Bar */}
      <footer className="mt-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${token ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] uppercase font-bold text-slate-500">{token ? 'Ready' : 'Waiting for Token'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${auditStatus === 'running' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse' : auditStatus === 'paused' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] uppercase font-bold text-slate-500">{auditStatus === 'running' ? 'Active Scan' : auditStatus === 'paused' ? 'Paused' : 'Idle'}</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono hidden sm:block">
          USER_ID: craighckby_99 // SESSION_REF: 8XJ-221
        </div>
      </footer>
    </div>
  );
}
