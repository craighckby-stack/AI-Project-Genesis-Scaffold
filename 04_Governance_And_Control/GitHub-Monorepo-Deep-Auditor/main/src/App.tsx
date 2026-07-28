import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { Console } from "./components/Console";
import { LogMessage, RepoInfo } from "./types";
import { fetchGitHub, analyzeFiles, categorizeRepo, downloadFile, redactSensitiveData, pushToGitHub } from "./lib/github";
import { demoInventory, demoBranchMap, demoFileRegistry, demoReconData, demoAutoInjectSuggestions, demoFileContents } from "./lib/demoData";
import { Play, Github, ChevronRight, Download, Eye, Terminal, Pause, Square, Save, Copy, Shield, ShieldOff, Filter, UploadCloud, FolderOpen, Globe, Zap, Cpu } from "lucide-react";
import { setItem as dbSetItem, getItem as dbGetItem, removeItem as dbRemoveItem } from "./lib/storage";

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
  const [token, setToken] = useState(() => localStorage.getItem("GH_TOKEN") || "");
  useEffect(() => {
    localStorage.setItem("GH_TOKEN", token);
  }, [token]);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'running' | 'paused' | 'stopped' | 'completed'>('idle');
  const statusRef = useRef(auditStatus);
  useEffect(() => { statusRef.current = auditStatus; }, [auditStatus]);

  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logsRef = useRef<LogMessage[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const fileContentsRef = useRef<Record<string, string>>({});

  const [autoInjection, setAutoInjection] = useState(false);
  const autoInjectionRef = useRef(autoInjection);
  useEffect(() => { autoInjectionRef.current = autoInjection; }, [autoInjection]);

  const [autoInjectSuggestions, setAutoInjectSuggestions] = useState<any[]>([]);
  const autoInjectSuggestionsRef = useRef<any[]>([]);
  useEffect(() => { autoInjectSuggestionsRef.current = autoInjectSuggestions; }, [autoInjectSuggestions]);

  const [applyingInjections, setApplyingInjections] = useState<Record<string, boolean>>({});

  const [privacyMode, setPrivacyMode] = useState(true);
  const [bypassHuxley, setBypassHuxley] = useState(true);
  const [runDarlekCaan, setRunDarlekCaan] = useState(true);
  const [runHuxleyMeta, setRunHuxleyMeta] = useState(true);
  const privacyRef = useRef(privacyMode);
  useEffect(() => { privacyRef.current = privacyMode; }, [privacyMode]);
  const bypassRef = useRef(bypassHuxley);
  useEffect(() => { bypassRef.current = bypassHuxley; }, [bypassHuxley]);
  const darlekRef = useRef(runDarlekCaan);
  useEffect(() => { darlekRef.current = runDarlekCaan; }, [runDarlekCaan]);
  const huxleyMetaRef = useRef(runHuxleyMeta);
  useEffect(() => { huxleyMetaRef.current = runHuxleyMeta; }, [runHuxleyMeta]);

  const [pushRepoName, setPushRepoName] = useState("Repository-Auditor");
  const [isPushing, setIsPushing] = useState(false);
  const [directCommit, setDirectCommit] = useState(false);
  const [isHotswapping, setIsHotswapping] = useState(false);
  const [selectedHotswapModule, setSelectedHotswapModule] = useState("EMG_CORE_UI_ENHANCED");
  const [emgCoherence, setEmgCoherence] = useState(0);
  const [activeSynapses, setActiveSynapses] = useState<string[]>([]);

  // Reconnaissance States
  const [scanMode, setScanMode] = useState<'self' | 'org' | 'user'>('self');
  const [scanTarget, setScanTarget] = useState("");
  const [reconData, setReconData] = useState<any[]>([]);
  const reconDataRef = useRef<any[]>([]);
  const [activeTab, setActiveTab] = useState<'audit' | 'recon' | 'assembler' | 'pipeline' | 'deploy' | 'ops' | 'resilience'>('audit');
  const [inventory, setInventory] = useState<RepoInfo[]>([]);

  // Live metrics state
  const [metrics, setMetrics] = useState({
    totalRepos: 0, auditedRepos: 0, multiSystems: 0, totalBranches: 0, duplicates: 0
  });
  const metricsRef = useRef(metrics);

  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const categoryCountsRef = useRef(categoryCounts);

  const allReposRef = useRef<any[]>([]);
  const currentIndexRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inventoryRef = useRef<RepoInfo[]>([]);
  const branchMapRef = useRef<Record<string, string[]>>({});
  const systemGroupsRef = useRef<Record<string, RepoInfo[]>>(getInitialSystemGroups());

  const fileRegistryRef = useRef<Map<string, {repo: string, path: string}[]>>(new Map());
  const [hasSavedState, setHasSavedState] = useState(false);
  
  useEffect(() => {
    if (localStorage.getItem(STATE_KEY)) {
      setHasSavedState(true);
    }
    
    // Auto-resume after hotswap
    if (localStorage.getItem('HOTSWAP_AUTO_RESUME') === 'true') {
      localStorage.removeItem('HOTSWAP_AUTO_RESUME');
      // Use setTimeout to ensure state is fully initialized
      setTimeout(async () => {
        // Try DB first, then fallback
        let state = await dbGetItem(STATE_KEY);
        if (!state) {
          const saved = localStorage.getItem(STATE_KEY);
          if (saved) {
            try { state = JSON.parse(saved); } catch (e) {}
          }
        }
        if (state) {
          try {
            setHasSavedState(true);
            if (state.auditStatus === 'running') {
              // Mark that we already hotswapped in this session so we don't infinite loop
              // @ts-ignore
              window.__HAS_HOTSWAPPED__ = true;
              // We need to trigger the resume
              window.dispatchEvent(new Event('trigger-auto-resume'));
            }
          } catch(e){}
        }
      }, 500);
    }
  }, []);

  const loadSavedState = async () => {
    try {
      // 1. Try to load from IndexedDB first
      let state = await dbGetItem(STATE_KEY);
      
      // 2. Fall back to localStorage if IndexedDB has nothing
      if (!state) {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
          state = JSON.parse(saved);
        }
      }

      if (state) {
        allReposRef.current = state.allRepos || [];
        currentIndexRef.current = state.currentIndex || 0;
        inventoryRef.current = state.inventory || [];
        setInventory(inventoryRef.current);
        branchMapRef.current = state.branchMap || {};
        systemGroupsRef.current = state.systemGroups || getInitialSystemGroups();
        metricsRef.current = state.metrics || { totalRepos: 0, auditedRepos: 0, multiSystems: 0, totalBranches: 0 };
        setMetrics(metricsRef.current);
        categoryCountsRef.current = state.categoryCounts || {};
        setCategoryCounts(categoryCountsRef.current);
        logsRef.current = state.logs || [];
        setLogs(logsRef.current);
        
        reconDataRef.current = state.reconData || [];
        setReconData(reconDataRef.current);
        setScanMode(state.scanMode || 'self');
        setScanTarget(state.scanTarget || "");
        if (state.fileRegistry) {
          fileRegistryRef.current = new Map(state.fileRegistry);
        }

        // Restore fileContents and generate Object URLs
        const savedFileContents = state.fileContents || {};
        fileContentsRef.current = savedFileContents;
        setFileContents(savedFileContents);

        const urls: Record<string, string> = {};
        Object.entries(savedFileContents).forEach(([name, content]) => {
          urls[name] = URL.createObjectURL(new Blob([content as string], { type: name.endsWith('.json') ? "application/json" : "text/markdown" }));
        });
        setDownloadUrls(urls);

        // Restore completion and auto-injection status
        const savedIsComplete = state.isComplete || false;
        setIsComplete(savedIsComplete);
        
        const savedAuditStatus = state.auditStatus || 'paused';
        setAuditStatus(savedAuditStatus);

        const savedAutoInjection = state.autoInjection || false;
        setAutoInjection(savedAutoInjection);
        autoInjectionRef.current = savedAutoInjection;

        const savedAutoInjectSuggestions = state.autoInjectSuggestions || [];
        setAutoInjectSuggestions(savedAutoInjectSuggestions);
        autoInjectSuggestionsRef.current = savedAutoInjectSuggestions;

        addLog("💾 Loaded saved state successfully.", "success");
      }
    } catch (e) {
      console.error("Failed to load state", e);
    }
  };

  const saveStateToStorage = async () => {
    try {
      const state = {
        allRepos: allReposRef.current,
        currentIndex: currentIndexRef.current,
        inventory: inventoryRef.current,
        branchMap: branchMapRef.current,
        systemGroups: systemGroupsRef.current,
        metrics: metricsRef.current,
        categoryCounts: categoryCountsRef.current,
        logs: logsRef.current,
        reconData: reconDataRef.current,
        scanMode,
        scanTarget,
        fileContents: fileContentsRef.current,
        fileRegistry: Array.from(fileRegistryRef.current.entries()),
        isComplete: currentIndexRef.current >= allReposRef.current.length && allReposRef.current.length > 0,
        auditStatus: statusRef.current,
        autoInjection: autoInjectionRef.current,
        autoInjectSuggestions: autoInjectSuggestionsRef.current
      };
      
      // Save full, complete state (including rich logs and heavy manifest fileContents) to IndexedDB
      await dbSetItem(STATE_KEY, state);

      // Save a lightweight version to localStorage as fallback & synchronous flag
      const lightweightState = {
        ...state,
        fileContents: {}, // Empty out heavy files in localStorage to avoid QuotaExceededError
        logs: []          // Empty out logs in localStorage
      };
      localStorage.setItem(STATE_KEY, JSON.stringify(lightweightState));
      setHasSavedState(true);
    } catch (e) {
      console.error("Error saving state to storage:", e);
    }
  };

  const clearSavedState = () => {
    localStorage.removeItem(STATE_KEY);
    dbRemoveItem(STATE_KEY).catch(e => console.error("Error clearing DB state:", e));
    setHasSavedState(false);
  };

  const loadDemoState = () => {
    allReposRef.current = demoInventory.map(r => ({ name: r.name, owner: { login: "craighckby-stack" }, html_url: r.url }));
    currentIndexRef.current = demoInventory.length;
    inventoryRef.current = demoInventory;
    setInventory(demoInventory);
    
    branchMapRef.current = demoBranchMap;
    
    const initialGroups = getInitialSystemGroups();
    demoInventory.forEach(r => {
      // @ts-ignore
      if (!initialGroups[r.category]) initialGroups[r.category] = [];
      // @ts-ignore
      initialGroups[r.category].push(r);
    });
    systemGroupsRef.current = initialGroups;
    
    const duplicateMap = new Map();
    demoFileRegistry.forEach(([sig, locations]) => {
      duplicateMap.set(sig, locations);
    });
    fileRegistryRef.current = duplicateMap;
    
    reconDataRef.current = demoReconData;
    setReconData(demoReconData);
    
    const updatedMetrics = {
      totalRepos: demoInventory.length,
      auditedRepos: demoInventory.length,
      multiSystems: demoInventory.filter(r => r.is_multi_system).length,
      totalBranches: Object.values(demoBranchMap).reduce((sum, b) => sum + b.length, 0),
      duplicates: 3
    };
    metricsRef.current = updatedMetrics;
    setMetrics(updatedMetrics);
    
    const counts: Record<string, number> = {};
    demoInventory.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    categoryCountsRef.current = counts;
    setCategoryCounts(counts);
    
    fileContentsRef.current = demoFileContents;
    setFileContents(demoFileContents);
    
    const urls: Record<string, string> = {};
    Object.entries(demoFileContents).forEach(([name, content]) => {
      urls[name] = URL.createObjectURL(new Blob([content], { type: name.endsWith('.json') ? "application/json" : "text/markdown" }));
    });
    setDownloadUrls(urls);
    
    setAutoInjectSuggestions(demoAutoInjectSuggestions);
    autoInjectSuggestionsRef.current = demoAutoInjectSuggestions;
    
    setIsComplete(true);
    setAuditStatus("completed");
    
    const initialLogs: LogMessage[] = [
      { id: "1", text: "🚀 Pre-Scanned Huxley Portfolio Demo Loaded.", type: "success" },
      { id: "2", text: "📊 Found 9 key repositories across the Huxley Ecosystem.", type: "info" },
      { id: "3", text: "🌿 Plotted 3 inter-repository synapses and shared file structures.", type: "success" },
      { id: "4", text: "💡 Loaded 2 secure patch suggestions in the Cognitive Ops console.", type: "warning" }
    ];
    logsRef.current = initialLogs;
    setLogs(initialLogs);
    
    // Save to LocalStorage
    try {
      const stateToSave = {
        allRepos: allReposRef.current,
        currentIndex: demoInventory.length,
        inventory: demoInventory,
        branchMap: demoBranchMap,
        systemGroups: initialGroups,
        metrics: updatedMetrics,
        categoryCounts: counts,
        logs: initialLogs,
        reconData: demoReconData,
        scanMode: 'self',
        scanTarget: '',
        fileContents: demoFileContents,
        fileRegistry: demoFileRegistry,
        isComplete: true,
        auditStatus: 'completed' as const,
        autoInjection: autoInjection,
        autoInjectSuggestions: demoAutoInjectSuggestions
      };
      localStorage.setItem(STATE_KEY, JSON.stringify(stateToSave));
      setHasSavedState(true);
    } catch (e) {
      console.error("Error saving demo state:", e);
    }
  };

  const updateFileContent = (filename: string, content: string) => {
    fileContentsRef.current = {
      ...fileContentsRef.current,
      [filename]: content
    };
    setFileContents({ ...fileContentsRef.current });
    saveStateToStorage();
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

  const onApplyEnhancement = async (filePath: string, content: string) => {
    setApplyingInjections(prev => ({ ...prev, [filePath]: true }));
    addLog(`⏳ Applying auto-injection enhancement to ${filePath}...`, "warning");
    try {
      const response = await fetch("/api/hotswap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filePath, content })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to inject content");
      }
      
      addLog(`✅ Successfully applied enhancement to ${filePath}!`, "success");
    } catch (err: any) {
      addLog(`❌ Failed to apply enhancement to ${filePath}: ${err.message}`, "error");
    } finally {
      setApplyingInjections(prev => ({ ...prev, [filePath]: false }));
    }
  };

  const calculateArchitecturalDebt = (
    repoName: string,
    updatedAtStr: string,
    branchesCount: number,
    externalDepsCount: number,
    hasWorkflows: boolean,
    isMultiSystem: boolean,
    pullRequestsCount: number
  ) => {
    const lastUpdateDate = new Date(updatedAtStr);
    const now = new Date();
    const fileAgeDays = Math.max(1, Math.round((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Activity frequency
    let activityFrequency: 'daily' | 'weekly' | 'monthly' | 'rare' = 'rare';
    if (fileAgeDays <= 7 || pullRequestsCount > 2) {
      activityFrequency = 'daily';
    } else if (fileAgeDays <= 30 || pullRequestsCount > 0) {
      activityFrequency = 'weekly';
    } else if (fileAgeDays <= 90) {
      activityFrequency = 'monthly';
    }
    
    // Debt score calculation
    let score = 15; // Base score
    const factors: string[] = [];
    
    if (fileAgeDays > 120) {
      score += 25;
      factors.push(`Codebase is dormant (no update in ${fileAgeDays} days)`);
    } else if (fileAgeDays > 60) {
      score += 15;
      factors.push("Codebase has low active updates (> 60 days inactive)");
    }
    
    if (branchesCount > 5) {
      score += 15;
      factors.push(`High stale branch count (${branchesCount} active branches)`);
    }
    
    if (externalDepsCount > 15) {
      score += 20;
      factors.push(`Heavy dependency footprint (${externalDepsCount} npm packages)`);
    } else if (externalDepsCount > 8) {
      score += 10;
      factors.push(`Moderate package bloat (${externalDepsCount} dependencies)`);
    }
    
    if (isMultiSystem) {
      score += 20;
      factors.push("Multi-system complex structural architecture (microservice sprawl)");
    }
    
    if (!hasWorkflows) {
      score += 15;
      factors.push("No active CI/CD check pipelines detected");
    }
    
    // Cap score at 100, min at 12
    score = Math.min(100, Math.max(12, score));
    
    let debtRating: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
    if (score >= 80) debtRating = 'Critical';
    else if (score >= 55) debtRating = 'High';
    else if (score >= 30) debtRating = 'Medium';
    
    if (factors.length === 0) {
      factors.push("Healthy repository structural alignment");
    }
    
    return {
      fileAgeDays,
      activityFrequency,
      architecturalDebtScore: score,
      debtRating,
      debtFactors: factors
    };
  };

  const generateFinalManifests = async () => {
    // Generate INVENTORY.md
    let inventoryMD = `# Deep Repository Inventory & Stack Matrix\n\n`;
    inventoryMD += `**Total Repositories Analyzed**: ${inventoryRef.current.length}\n`;
    inventoryMD += `**Generated**: ${new Date().toISOString()}\n\n`;
    inventoryMD += `## Quick Stats\n\n`;

    let multiSystemCount = 0;
    inventoryRef.current.forEach((r) => {
      if (r.is_multi_system) multiSystemCount++;
    });
    const branchLists = Object.values(branchMapRef.current) as string[][];
    const totalBranchesCount = branchLists.reduce((sum, branches) => sum + branches.length, 0);
    inventoryMD += `- **Multi-System Repos**: ${multiSystemCount}\n`;
    inventoryMD += `- **Total Branches**: ${totalBranchesCount}\n`;
    inventoryMD += `- **Avg Branches/Repo**: ${(
      totalBranchesCount / (inventoryRef.current.length || 1)
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
    updateFileContent("INVENTORY.md", inventoryMD);
    addLog("✅ Downloaded: INVENTORY.md", "success");

    // Generate BRANCH_MAP.json
    const branchMapStr = JSON.stringify(branchMapRef.current, null, 2);
    downloadFile("BRANCH_MAP.json", branchMapStr);
    setDownloadUrls(prev => ({ ...prev, "BRANCH_MAP.json": URL.createObjectURL(new Blob([branchMapStr], { type: "application/json" })) }));
    updateFileContent("BRANCH_MAP.json", branchMapStr);
    addLog("✅ Downloaded: BRANCH_MAP.json", "success");

    // Generate SYSTEM_GROUPS.json
    const systemGroupsDetailed: any = {};
    (Object.entries(systemGroupsRef.current) as [string, RepoInfo[]][]).forEach(([group, repos]) => {
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
    updateFileContent("SYSTEM_GROUPS.json", systemGroupsStr);
    addLog("✅ Downloaded: SYSTEM_GROUPS.json", "success");

    // Generate DEDUPLICATION_REPORT.md
    let dedupeMD = `# Cross-Repo Deduplication Report\n\n`;
    dedupeMD += `Generated: ${new Date().toISOString()}\n\n`;
    let savedBlobs = 0;
    const duplicateEntries: { sig: string, locations: {repo: string, path: string}[] }[] = [];
    
    fileRegistryRef.current.forEach((locations, sig) => {
      // Dedupe distinct repos
      const uniqueRepos = new Set(locations.map(l => l.repo));
      if (uniqueRepos.size > 1) {
        duplicateEntries.push({ sig, locations });
        savedBlobs += (locations.length - 1);
      }
    });

    dedupeMD += `**Total Shared File Signatures**: ${duplicateEntries.length}\n`;
    dedupeMD += `**Total Redundant Files (Potential Savings)**: ${savedBlobs}\n\n`;
    
    if (duplicateEntries.length > 0) {
      dedupeMD += `## Exact Matches Across Repositories\n\n`;
      duplicateEntries.sort((a, b) => b.locations.length - a.locations.length).forEach(entry => {
        dedupeMD += `### Signature: \`${entry.sig.substring(0, 12)}...\`\n`;
        dedupeMD += `Found in ${entry.locations.length} locations across ${new Set(entry.locations.map(l => l.repo)).size} repos:\n`;
        entry.locations.forEach(l => {
           dedupeMD += `- **${l.repo}**: \`${l.path}\`\n`;
        });
        dedupeMD += `\n`;
      });
    } else {
      dedupeMD += `*No cross-repository duplicate files detected.*\n`;
    }

    downloadFile("DEDUPLICATION_REPORT.md", dedupeMD);
    setDownloadUrls(prev => ({ ...prev, "DEDUPLICATION_REPORT.md": URL.createObjectURL(new Blob([dedupeMD], { type: "text/markdown" })) }));
    updateFileContent("DEDUPLICATION_REPORT.md", dedupeMD);
    addLog("✅ Downloaded: DEDUPLICATION_REPORT.md", "success");

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
      updateFileContent("CONSOLIDATION_PLAN.md", plan);
      addLog("✅ Generated and Downloaded: CONSOLIDATION_PLAN.md", "success");
    } catch (planError: any) {
      addLog(`❌ AI Plan Generation Failed: ${planError.message}`, "error");
      addLog("⚠️ Continuing without CONSOLIDATION_PLAN.md. Please check your Gemini API quota limits.", "warning");
    }

    if (darlekRef.current) {
      addLog("\n🤖 Initializing Darlek Caan Code Enhancer Analysis...", "info");
      addLog("⏳ Analyzing duplication and structural gaps (this may take 10-30 seconds)...", "warning");
      
      try {
        const simplifiedInventory = inventoryRef.current.map((r: any) => ({
            name: r.name,
            category: r.category,
            stack: r.primary_stack,
            code_snippets: r.code_snippets || {},
        }));
        
        const duplicateEntries: any[] = [];
        fileRegistryRef.current.forEach((locations, sig) => {
          const uniqueRepos = new Set(locations.map(l => l.repo));
          if (uniqueRepos.size > 1) {
            duplicateEntries.push({ sig, locations });
          }
        });

        const aiResponse = await fetch("/api/generate-enhancements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            inventory: simplifiedInventory, 
            duplicates: duplicateEntries.slice(0, 50),
            autoInject: autoInjectionRef.current
          })
        });

        if (!aiResponse.ok) {
          const error = await aiResponse.json();
          throw new Error(error.error || "Failed to generate Darlek Caan enhancements");
        }

        const { enhancements, suggestions } = await aiResponse.json();
        
        if (suggestions && suggestions.length > 0) {
          setAutoInjectSuggestions(suggestions);
          autoInjectSuggestionsRef.current = suggestions;
          addLog(`🤖 Darlek Caan generated ${suggestions.length} Auto-Injection suggestions!`, "success");
        } else {
          setAutoInjectSuggestions([]);
          autoInjectSuggestionsRef.current = [];
        }

        downloadFile("DARLEK_CAAN_ANALYSIS.md", enhancements);
        setDownloadUrls(prev => ({ ...prev, "DARLEK_CAAN_ANALYSIS.md": URL.createObjectURL(new Blob([enhancements], { type: "text/markdown" })) }));
        updateFileContent("DARLEK_CAAN_ANALYSIS.md", enhancements);
        addLog("✅ Generated and Downloaded: DARLEK_CAAN_ANALYSIS.md", "success");
      } catch (err: any) {
        addLog(`❌ Darlek Caan Analysis Failed: ${err.message}`, "error");
      }
    }

    // Generate assemble_monorepo.sh
    let assemblerScript = `#!/bin/bash\n\n`;
    assemblerScript += `# Automated Monorepo Assembler\n`;
    assemblerScript += `# Generated: ${new Date().toISOString()}\n\n`;
    assemblerScript += `WORKSPACE_DIR="consolidated_workspace"\n\n`;
    assemblerScript += `echo "🚀 Initializing Monorepo Workspace in $WORKSPACE_DIR..."\n`;
    assemblerScript += `mkdir -p $WORKSPACE_DIR\n`;
    assemblerScript += `cd $WORKSPACE_DIR\n\n`;
    
    // Add pnpm workspace mapping
    assemblerScript += `cat << 'EOF' > pnpm-workspace.yaml\n`;
    assemblerScript += `packages:\n`;
    assemblerScript += `  - 'apps/*'\n`;
    assemblerScript += `  - 'packages/*'\n`;
    assemblerScript += `EOF\n\n`;

    assemblerScript += `mkdir -p apps packages\n\n`;

    inventoryRef.current.forEach((r) => {
      const dest = r.category.toLowerCase().includes('library') || r.category.toLowerCase().includes('shared') ? 'packages' : 'apps';
      
      // Determine if submodule strategy or workspaces cloning strategy should be used based on detected type
      const isSubmoduleStyle = r.category.toLowerCase().includes('service') || r.category.toLowerCase().includes('external');
      
      if (isSubmoduleStyle) {
        assemblerScript += `echo "🔗 [SUBMODULE] Linking ${r.name} as a git submodule in ${dest}/..."\n`;
        if (r.url !== '#') {
          assemblerScript += `git submodule add ${r.url}.git ${dest}/${r.name}\n`;
        } else {
          assemblerScript += `# Cannot link local repository ${r.name} as submodule\n`;
        }
      } else {
        assemblerScript += `echo "📦 [WORKSPACE] Cloning ${r.name} into ${dest}/..."\n`;
        if (r.url !== '#') {
          assemblerScript += `git clone ${r.url}.git ${dest}/${r.name}\n`;
        } else {
          assemblerScript += `# Cannot clone local repository ${r.name}\n`;
        }
      }
    });

    assemblerScript += `\necho "🔗 Configuring Workspace Peer Dependencies..."\n`;
    assemblerScript += `cat << 'EOF' > link-peers.js
const fs = require('fs');
const path = require('path');

const workspaceDirs = ['apps', 'packages'];
const packagesMap = {};

// 1. Gather all local package names and their paths
workspaceDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const subdirs = fs.readdirSync(dir);
  subdirs.forEach(subdir => {
    const pkgJsonPath = path.join(dir, subdir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        if (pkg.name) {
          packagesMap[pkg.name] = pkgJsonPath;
        }
      } catch (e) {}
    }
  });
});

// 2. Link internal package dependencies to use "workspace:*"
const localPackageNames = Object.keys(packagesMap);
Object.entries(packagesMap).forEach(([name, pkgJsonPath]) => {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    let modified = false;
    ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
      if (pkg[depType]) {
        Object.keys(pkg[depType]).forEach(depName => {
          if (localPackageNames.includes(depName)) {
            pkg[depType][depName] = "workspace:*";
            modified = true;
          }
        });
      }
    });
    if (modified) {
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
      console.log(\`✅ Linked peer dependency \${name} to workspace:*\`);
    }
  } catch (e) {}
});
EOF

node link-peers.js
rm link-peers.js
`;

    assemblerScript += `\necho "✨ Workspace Assembly Complete! You can now run 'pnpm install' from $WORKSPACE_DIR"\n`;

    downloadFile("assemble_monorepo.sh", assemblerScript);
    setDownloadUrls(prev => ({ ...prev, "assemble_monorepo.sh": URL.createObjectURL(new Blob([assemblerScript], { type: "text/x-sh" })) }));
    updateFileContent("assemble_monorepo.sh", assemblerScript);
    addLog("✅ Downloaded: assemble_monorepo.sh", "success");

    if (huxleyMetaRef.current) {
      addLog("\n🌐 Initializing Huxley Meta-Analysis...", "info");
      addLog("⏳ Synthesizing Deep Concept Map (this may take 10-30 seconds)...", "warning");

      try {
        const simplifiedInventory = inventoryRef.current.map((r: any) => ({
            name: r.name,
            category: r.category,
            stack: r.primary_stack,
            description: r.description
        }));
        
        const aiResponse = await fetch("/api/generate-meta-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            inventory: simplifiedInventory, 
            metrics: metricsRef.current,
            categories: categoryCountsRef.current
          })
        });

        if (!aiResponse.ok) {
          const error = await aiResponse.json();
          throw new Error(error.error || "Failed to generate Huxley Meta-Analysis");
        }

        const { metaAnalysis } = await aiResponse.json();
        
        downloadFile("HUXLEY_META_MAP.md", metaAnalysis);
        setDownloadUrls(prev => ({ ...prev, "HUXLEY_META_MAP.md": URL.createObjectURL(new Blob([metaAnalysis], { type: "text/markdown" })) }));
        updateFileContent("HUXLEY_META_MAP.md", metaAnalysis);
        addLog("✅ Generated and Downloaded: HUXLEY_META_MAP.md", "success");
      } catch (err: any) {
        addLog(`❌ Huxley Meta-Analysis Failed: ${err.message}`, "error");
      }
    }

    // Generate RECONNAISSANCE_LAYER.md
    addLog("\n🛰️ Formulating Reconnaissance Layer & Organization Telemetry...", "info");
    let reconMD = `# Auditor Reconnaissance Layer & Organization Telemetry\n\n`;
    reconMD += `**Target Profile**: Discovery via \`${scanMode.toUpperCase()}\` mode (Target: \`${scanTarget || "Self"}\`)\n`;
    reconMD += `**Timestamp**: ${new Date().toISOString()}\n\n`;
    
    reconMD += `## Executive Summary\n\n`;
    const totalReposScanned = reconDataRef.current.length;
    let totalInterDeps = 0;
    let staleBranchesCount = 0;
    let totalActivePRs = 0;
    let passingPRs = 0;
    
    reconDataRef.current.forEach(repo => {
      totalInterDeps += repo.interDependencies.length;
      staleBranchesCount += repo.branches.filter((b: any) => b.isDormant).length;
      totalActivePRs += repo.pullRequests.length;
      repo.pullRequests.forEach((pr: any) => {
        if (pr.workflows.length > 0 && pr.workflows.every((w: any) => w.conclusion === "success")) {
          passingPRs++;
        }
      });
    });
    
    reconMD += `- **Scanned Assets**: ${totalReposScanned} active repositories found.\n`;
    reconMD += `- **Internal Cross-Links**: ${totalInterDeps} explicit repo-to-repo inter-dependencies detected.\n`;
    reconMD += `- **Dormant Branches**: ${staleBranchesCount} inactive branches (older than 180 days) detected.\n`;
    reconMD += `- **Active PR Pipelines**: ${totalActivePRs} open pull requests tracked with linked CI workflows (${passingPRs} fully healthy/passing).\n\n`;
    
    reconMD += `## 1. Cross-Repository Dependency Tree\n\n`;
    if (totalInterDeps > 0) {
      reconMD += `Below is the map of internal linkages and references within the scanned organization:\n\n`;
      reconDataRef.current.forEach(repo => {
        if (repo.interDependencies.length > 0) {
          reconMD += `### 📦 ${repo.name}\n`;
          reconMD += `Depends on / references:\n`;
          repo.interDependencies.forEach((dep: string) => {
            reconMD += `- \`${dep}\` 🔗\n`;
          });
          reconMD += `\n`;
        }
      });
    } else {
      reconMD += `*No cross-repository internal dependencies detected. Repositories operate as decoupled silos.*\n\n`;
    }
    
    reconMD += `## 2. External Package Fingerprints\n\n`;
    reconDataRef.current.forEach(repo => {
      if (repo.externalDependencies.length > 0) {
        reconMD += `- **${repo.name}**: \`${repo.externalDependencies.slice(0, 8).join(", ")}\`\n`;
      }
    });
    reconMD += `\n`;
    
    reconMD += `## 3. Branch Dormancy & Reference Divergence Ledger\n\n`;
    let foundStale = false;
    reconDataRef.current.forEach(repo => {
      const dormant = repo.branches.filter((b: any) => b.isDormant);
      if (dormant.length > 0) {
        foundStale = true;
        reconMD += `### 🌿 ${repo.name} Dormant Branches\n`;
        reconMD += `| Branch Name | Last Commit Date | Last Commit Author |\n`;
        reconMD += `|-------------|------------------|--------------------|\n`;
        dormant.forEach((b: any) => {
          reconMD += `| \`${b.name}\` | ${new Date(b.lastCommitDate).toLocaleDateString()} | \`${b.lastCommitAuthor}\` |\n`;
        });
        reconMD += `\n`;
      }
    });
    if (!foundStale) {
      reconMD += `*All repository branches are actively maintained or deleted within the standard 180-day cycle.*\n\n`;
    }
    
    reconMD += `## 4. PR-linked Workflows & Actions Diagnostics\n\n`;
    let foundPRs = false;
    reconDataRef.current.forEach(repo => {
      if (repo.pullRequests.length > 0) {
        foundPRs = true;
        reconMD += `### 🔀 ${repo.name} Pull Request Health\n`;
        repo.pullRequests.forEach((pr: any) => {
          reconMD += `- **PR #${pr.number}**: "${pr.title}" (by \`${pr.author}\`)\n`;
          if (pr.hasWorkflows) {
            reconMD += `  - **Actions Pipeline**:\n`;
            pr.workflows.forEach((w: any) => {
              const marker = w.conclusion === "success" ? "✅" : w.conclusion === "failure" ? "❌" : "⏳";
              reconMD += `    - ${marker} \`${w.name}\` (Status: \`${w.status}\`, Conclusion: \`${w.conclusion}\`)\n`;
            });
          } else {
            reconMD += `  - *No PR-linked workflow pipelines detected for this head commit.*\n`;
          }
        });
        reconMD += `\n`;
      }
    });
    if (!foundPRs) {
      reconMD += `*No open pull requests or linked workflow pipelines found in this scope.*\n\n`;
    }

    downloadFile("RECONNAISSANCE_LAYER.md", reconMD);
    setDownloadUrls(prev => ({ ...prev, "RECONNAISSANCE_LAYER.md": URL.createObjectURL(new Blob([reconMD], { type: "text/markdown" })) }));
    updateFileContent("RECONNAISSANCE_LAYER.md", reconMD);
    addLog("✅ Generated and Downloaded: RECONNAISSANCE_LAYER.md", "success");
  };

  const handleLocalScan = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Convert to array
    const fileArray = Array.from(files) as File[];
    
    // Reset state for local scan
    setAuditStatus("running");
    setIsComplete(false);
    logsRef.current = [];
    setLogs([]);
    setDownloadUrls({});
    updateMetrics({ totalRepos: 0, auditedRepos: 0, multiSystems: 0, totalBranches: 0, duplicates: 0 });
    categoryCountsRef.current = {};
    setCategoryCounts({});
    
    fileRegistryRef.current = new Map();
    inventoryRef.current = [];
    setInventory([]);
    branchMapRef.current = {};
    systemGroupsRef.current = getInitialSystemGroups();
    
    addLog(`📂 Starting Local Directory Analysis of ${fileArray.length} files...`, "info");
    
    // Group files by root repo folder
    const topLevelDirs = new Set(fileArray.map(f => f.webkitRelativePath.split('/')[0]));
    let repoDepth = 0;
    if (topLevelDirs.size === 1) {
      repoDepth = 1; // 0 = the wrapper folder, 1 = the actual repos
    }
    
    const reposMap = new Map<string, File[]>();
    for (const file of fileArray) {
      const parts = file.webkitRelativePath.split('/');
      if (parts.length <= repoDepth + 1) continue;
      const repoName = parts[repoDepth];
      if (!reposMap.has(repoName)) reposMap.set(repoName, []);
      reposMap.get(repoName)!.push(file);
    }
    
    const repoNames = Array.from(reposMap.keys());
    updateMetrics({ totalRepos: repoNames.length });
    addLog(`✅ Detected ${repoNames.length} potential local repositories`, "success");
    addLog("🔍 Running Deep Structural Audit...\n", "info");
    
    for (let i = 0; i < repoNames.length; i++) {
      if (statusRef.current === 'stopped') break;
      const repoName = repoNames[i];
      const repoFiles = reposMap.get(repoName)!;
      addLog(`⏳ [${i + 1}/${repoNames.length}] Analyzing ${repoName}...`, "info");
      
      try {
        // Find README
        const readmeFile = repoFiles.find(f => {
          const p = f.webkitRelativePath.split('/');
          return p.length === repoDepth + 2 && p[p.length - 1].toLowerCase() === 'readme.md';
        });
        
        let readmeContent = "";
        if (readmeFile) {
          readmeContent = await readmeFile.text();
        }
        
        // Analyze files (transform File to { path: string })
        const treeFiles = repoFiles.map(f => ({ 
          path: f.webkitRelativePath.split('/').slice(repoDepth + 1).join('/')
        }));

        repoFiles.forEach(f => {
          const path = f.webkitRelativePath.split('/').slice(repoDepth + 1).join('/');
          if (path.includes('node_modules/') || path.includes('.git/') || path.includes('package-lock.json') || path.includes('yarn.lock')) return;
          const sig = `${f.size}_${f.name}`;
          if (!fileRegistryRef.current.has(sig)) fileRegistryRef.current.set(sig, []);
          fileRegistryRef.current.get(sig)!.push({ repo: repoName, path });
        });
        
        let dupesCount = 0;
        fileRegistryRef.current.forEach(locations => {
          const uniqueRepos = new Set(locations.map(l => l.repo));
          if (uniqueRepos.size > 1) {
             dupesCount++;
          }
        });
        
        const fileAnalysis = analyzeFiles(treeFiles);
        
        const importantFiles = ["package.json", "drizzle.config.ts", "schema.ts", "server.ts", "App.tsx", "main.py", "docker-compose.yml", "go.mod", "Cargo.toml", "index.ts", "index.js", "vite.config.ts", "next.config.js", "tsconfig.json"];
        const code_snippets: Record<string, string> = {};
        let totalSnippetChars = 0;
        
        for (const f of repoFiles) {
          const path = f.webkitRelativePath.split('/').slice(repoDepth + 1).join('/');
          const name = f.name.toLowerCase();
          
          if ((importantFiles.includes(name) || name.endsWith('schema.ts') || name.endsWith('.prisma')) && f.size < 50000) {
            try {
              let text = await f.text();
              if (privacyRef.current) text = redactSensitiveData(text);
              const snippet = text.slice(0, 2000); // 2000 chars max per file
              if (totalSnippetChars + snippet.length < 15000) { // Max 15k chars per repo
                code_snippets[path] = snippet;
                totalSnippetChars += snippet.length;
              }
            } catch(e) {}
          }
        }
        
        const category = categorizeRepo(repoName, readmeContent, fileAnalysis, bypassRef.current);
        
        let finalDescription = "Local repository scan";
        if (privacyRef.current) {
          finalDescription = redactSensitiveData(finalDescription);
        }
        
        const repoInfo: RepoInfo = {
          name: repoName,
          description: finalDescription,
          category: category,
          language: fileAnalysis.primaryStack || "N/A",
          default_branch: "local",
          url: "#",
          updated_at: new Date().toISOString(),
          is_multi_system: fileAnalysis.isMultiSystem,
          subsystems: fileAnalysis.subsystems,
          branches_count: 1,
          branches: ["local"],
          primary_stack: fileAnalysis.primaryStack,
          code_snippets
        };
        
        inventoryRef.current.push(repoInfo);
        setInventory([...inventoryRef.current]);

        // Stage 2 local scan reconData population
        const interDeps = new Set<string>();
        const externalDeps: string[] = [];
        
        const allScannedRepoNames = new Set<string>(repoNames.map(name => name.toLowerCase()));
        
        Object.entries(code_snippets).forEach(([path, snippet]) => {
          const lowerSnippet = snippet.toLowerCase();
          allScannedRepoNames.forEach((otherName: string) => {
            if (otherName !== repoName.toLowerCase()) {
              if (lowerSnippet.includes(`"${otherName}"`) || lowerSnippet.includes(`'${otherName}'`) || lowerSnippet.includes(`/${otherName}/`)) {
                interDeps.add(otherName);
              }
            }
          });

          const fileName = path.split('/').pop()?.toLowerCase();
          if (fileName === "package.json") {
            try {
              const parsed = JSON.parse(snippet);
              const deps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
              Object.keys(deps).forEach(k => {
                if (!externalDeps.includes(k)) externalDeps.push(k);
              });
            } catch (e) {
              const matches = snippet.match(/"([^"]+)":\s*"[^"]+"/g);
              if (matches) {
                matches.forEach(m => {
                  const key = m.split(":")[0].replace(/"/g, "").trim();
                  if (!["name", "version", "description", "main", "scripts", "author", "license", "private", "dependencies", "devDependencies"].includes(key)) {
                    if (!externalDeps.includes(key)) externalDeps.push(key);
                  }
                });
              }
            }
          }
        });

        const currentReconData = {
          name: repoName,
          owner: "local",
          interDependencies: Array.from(interDeps),
          externalDependencies: externalDeps,
          branches: [{
            name: "local",
            lastCommitDate: new Date().toISOString(),
            lastCommitAuthor: "local",
            isDormant: false,
            isDefault: true
          }],
          pullRequests: [],
          architecturalDebt: calculateArchitecturalDebt(
            repoName,
            new Date().toISOString(),
            1,
            externalDeps.length,
            true,
            fileAnalysis.isMultiSystem,
            0
          )
        };

        reconDataRef.current = [...reconDataRef.current, currentReconData];
        setReconData(reconDataRef.current);

        if (!systemGroupsRef.current[category]) systemGroupsRef.current[category] = [];
        systemGroupsRef.current[category].push(repoInfo);
        
        branchMapRef.current[repoName] = ["local"];
        
        updateCategoryCounts(category);
        updateMetrics({ 
          auditedRepos: metricsRef.current.auditedRepos + 1,
          multiSystems: metricsRef.current.multiSystems + (fileAnalysis.isMultiSystem ? 1 : 0),
          totalBranches: metricsRef.current.totalBranches + 1,
          duplicates: dupesCount
        });
        
      } catch (err: any) {
        addLog(`❌ Error auditing ${repoName}: ${err.message}`, "error");
      }
      
      await sleep(50); // slight pause to yield to React
    }
    
    if (statusRef.current === 'stopped') {
      addLog("\n🛑 Audit stopped by user. Generating reports for audited repos...", "warning");
    } else {
      addLog(`\n✨ Local Audit complete! Generating rich structure reports...`, "success");
    }

    await generateFinalManifests();

    addLog("\n📊 Finalizing Audit...\n", "info");
    setIsComplete(true);
    setAuditStatus("completed");
    saveStateToStorage();
    if (statusRef.current !== 'stopped' && pushRepoName) { await handlePushToRepo(); }
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const handleAutoResume = async () => {
      await loadSavedState();
      setTimeout(() => {
        startAudit(true);
      }, 100);
    };
    window.addEventListener('trigger-auto-resume', handleAutoResume);
    return () => window.removeEventListener('trigger-auto-resume', handleAutoResume);
  }, [token]);

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
      updateMetrics({ totalRepos: 0, auditedRepos: 0, multiSystems: 0, totalBranches: 0, duplicates: 0 });
      categoryCountsRef.current = {};
      setCategoryCounts({});
      
      fileRegistryRef.current = new Map();
      currentIndexRef.current = 0;
      inventoryRef.current = [];
      setInventory([]);
      branchMapRef.current = {};
      systemGroupsRef.current = getInitialSystemGroups();
      
      reconDataRef.current = [];
      setReconData([]);

      clearSavedState();

      addLog("📋 Querying target repository catalog...", "info");

      try {
        let allRepos: any[] = [];
        let page = 1;

        if (scanMode === 'self') {
          addLog("📋 Querying authenticated user repository catalog...", "info");
          while (true) {
            if (statusRef.current === 'stopped') break;
            const repos = await fetchGitHub(`/user/repos?per_page=100&page=${page}&affiliation=owner,collaborator`, token);
            if (!repos || !Array.isArray(repos) || repos.length === 0) break;
            allRepos = allRepos.concat(repos);
            if (repos.length < 100) break;
            page++;
          }
        } else if (scanMode === 'org') {
          if (!scanTarget.trim()) {
            throw new Error("Organization target name must be specified.");
          }
          addLog(`📋 Discovery Mode: Querying Organization [${scanTarget}] repository catalog...`, "warning");
          while (true) {
            if (statusRef.current === 'stopped') break;
            const repos = await fetchGitHub(`/orgs/${scanTarget.trim()}/repos?per_page=100&page=${page}`, token);
            if (!repos || !Array.isArray(repos) || repos.length === 0) break;
            allRepos = allRepos.concat(repos);
            if (repos.length < 100) break;
            page++;
          }
        } else if (scanMode === 'user') {
          if (!scanTarget.trim()) {
            throw new Error("GitHub user target name must be specified.");
          }
          addLog(`📋 Discovery Mode: Querying GitHub User [${scanTarget}] repository catalog...`, "warning");
          while (true) {
            if (statusRef.current === 'stopped') break;
            const repos = await fetchGitHub(`/users/${scanTarget.trim()}/repos?per_page=100&page=${page}`, token);
            if (!repos || !Array.isArray(repos) || repos.length === 0) break;
            allRepos = allRepos.concat(repos);
            if (repos.length < 100) break;
            page++;
          }
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
        
        files.forEach((f: any) => {
          if (f.type === 'blob') {
            if (f.path.includes('node_modules/') || f.path.includes('.git/') || f.path.includes('package-lock.json') || f.path.includes('yarn.lock')) return;
            const sig = f.sha;
            if (!fileRegistryRef.current.has(sig)) fileRegistryRef.current.set(sig, []);
            fileRegistryRef.current.get(sig)!.push({ repo: name, path: f.path });
          }
        });
        
        let dupesCount = 0;
        fileRegistryRef.current.forEach(locations => {
          const uniqueRepos = new Set(locations.map(l => l.repo));
          if (uniqueRepos.size > 1) {
             dupesCount++;
          }
        });

        const fileAnalysis = analyzeFiles(files);

        // 3.1 Fetch All Code Files (No limit, as requested)
        const code_snippets: Record<string, string> = {};
        let totalSnippetChars = 0;
        let snippetFilesCount = 0;

        const treeBlobs = files.filter((f: any) => f.type === 'blob');
        for (const f of treeBlobs) {
          const path = f.path;
          
          if (f.size < 250000) { // Limit to 250kb per file to avoid massive blobs
            try {
              const fileContentData = await fetchGitHub(`/repos/${owner}/${name}/contents/${path}`, token);
              if (fileContentData && fileContentData.content) {
                let text = "";
                try {
                  text = atob(fileContentData.content.replace(/\n/g, ""));
                } catch (e) {
                  text = fileContentData.content;
                }
                if (privacyRef.current) text = redactSensitiveData(text);
                const snippet = text; // Full file content
                code_snippets[path] = snippet;
                totalSnippetChars += snippet.length;
                snippetFilesCount++;
                addLog(`  📝 Extracted ${path} full file content...`, "info");
              }
            } catch (e) {
              console.warn(`Failed to fetch file content for ${path} in ${name}`, e);
            }
          }
        }

        // Calculate EMG Core Synapses & Coherence
        const rawCoherence = Math.min(100, Math.round((dupesCount / ((i + 1) || 1)) * 40 + 20));
        setEmgCoherence(rawCoherence);

        const synapses: string[] = [];
        fileRegistryRef.current.forEach((locations, sig) => {
          const uniqueRepos = new Set(locations.map(l => l.repo));
          if (uniqueRepos.size > 1) {
            synapses.push(`${locations[0].repo} ⇄ ${locations[1].repo} (${locations[0].path.split('/').pop()})`);
          }
        });
        setActiveSynapses(synapses.slice(0, 8));

        // --- START RECONNAISSANCE LAYER ANALYSIS ---
        const allScannedRepoNames = new Set<string>(allReposRef.current.map((r: any) => r.name.toLowerCase()));
        const interDeps = new Set<string>();
        
        // Match repo name strings within imports, files, and snippets to map inter-dependencies
        files.forEach((f: any) => {
          const lowerPath = f.path.toLowerCase();
          allScannedRepoNames.forEach((otherName: string) => {
            if (otherName !== name.toLowerCase()) {
              if (lowerPath.includes(otherName)) {
                interDeps.add(otherName);
              }
            }
          });
        });

        // Parse code snippets for mentions of other repos
        Object.entries(code_snippets).forEach(([path, snippet]) => {
          const lowerSnippet = (snippet as string).toLowerCase();
          allScannedRepoNames.forEach((otherName: string) => {
            if (otherName !== name.toLowerCase()) {
              if (lowerSnippet.includes(`"${otherName}"`) || lowerSnippet.includes(`'${otherName}'`) || lowerSnippet.includes(`/${otherName}/`) || (lowerSnippet.includes("github.com/") && lowerSnippet.includes(otherName))) {
                interDeps.add(otherName);
              }
            }
          });
        });

        // Map external dependencies
        const externalDeps: string[] = [];
        Object.entries(code_snippets).forEach(([path, snippet]) => {
          const fileName = path.split('/').pop()?.toLowerCase() || "";
          if (fileName === "package.json") {
            try {
              const parsed = JSON.parse(snippet);
              const deps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
              Object.keys(deps).forEach(k => {
                if (!externalDeps.includes(k)) externalDeps.push(k);
              });
            } catch (e) {
              const matches = snippet.match(/"([^"]+)":\s*"[^"]+"/g);
              if (matches) {
                matches.forEach(m => {
                  const key = m.split(":")[0].replace(/"/g, "").trim();
                  if (!["name", "version", "description", "main", "scripts", "author", "license", "private", "dependencies", "devDependencies"].includes(key)) {
                    if (!externalDeps.includes(key)) externalDeps.push(key);
                  }
                });
              }
            }
          } else if (fileName === "requirements.txt") {
            const lines = snippet.split("\n");
            lines.forEach(line => {
              const clean = line.split("==")[0].split(">=")[0].trim();
              if (clean && !clean.startsWith("#")) {
                if (!externalDeps.includes(clean)) externalDeps.push(clean);
              }
            });
          } else if (fileName === "go.mod") {
            const matches = snippet.match(/^\s*([a-zA-Z0-9.\/_-]+)\s+v[0-9]/gm);
            if (matches) {
              matches.forEach(m => {
                const clean = m.trim().split(/\s+/)[0];
                if (clean && !externalDeps.includes(clean)) externalDeps.push(clean);
              });
            }
          }
        });

        // Analyze Branch Histories (Dormancy / Age)
        const branchDetails: any[] = [];
        const branchesToAnalyze = branches.slice(0, 5);
        addLog(`  🌿 Mapping branch histories (latency checks) for ${name}...`, "info");
        for (const bName of branchesToAnalyze) {
          try {
            const singleBranchData = await fetchGitHub(`/repos/${owner}/${name}/branches/${encodeURIComponent(bName)}`, token);
            if (singleBranchData && singleBranchData.commit) {
              const commitObj = singleBranchData.commit.commit;
              const lastCommitDate = commitObj.author?.date || commitObj.committer?.date || "";
              const lastCommitAuthor = commitObj.author?.name || commitObj.committer?.name || "Unknown";
              
              let isDormant = false;
              if (lastCommitDate) {
                const lastCommitMs = new Date(lastCommitDate).getTime();
                const nowMs = new Date().getTime();
                const ageDays = (nowMs - lastCommitMs) / (1000 * 60 * 60 * 24);
                isDormant = ageDays > 180;
              }
              
              branchDetails.push({
                name: bName,
                lastCommitDate,
                lastCommitAuthor,
                isDormant,
                isDefault: bName === defaultBranch
              });
            } else {
              branchDetails.push({
                name: bName,
                lastCommitDate: "N/A",
                lastCommitAuthor: "Unknown",
                isDormant: false,
                isDefault: bName === defaultBranch
              });
            }
          } catch (bErr) {
            branchDetails.push({
              name: bName,
              lastCommitDate: "N/A",
              lastCommitAuthor: "Unknown",
              isDormant: false,
              isDefault: bName === defaultBranch
            });
          }
        }
        if (branches.length > 5) {
          branches.slice(5).forEach(bName => {
            branchDetails.push({
              name: bName,
              lastCommitDate: "Unexplored (Limit-Cap)",
              lastCommitAuthor: "Unexplored",
              isDormant: false,
              isDefault: bName === defaultBranch
            });
          });
        }

        // Analyze Pull Request pipeline health & check-runs
        const mappedPRs: any[] = [];
        addLog(`  🔀 Mapping PR workflow diagnostic checks for ${name}...`, "info");
        try {
          const pullsData = await fetchGitHub(`/repos/${owner}/${name}/pulls?state=open&per_page=5`, token);
          if (pullsData && Array.isArray(pullsData)) {
            for (const pr of pullsData) {
              const prNum = pr.number;
              const prTitle = pr.title;
              const prAuthor = pr.user?.login || "Unknown";
              const prCreatedAt = pr.created_at;
              const headSha = pr.head?.sha;
              
              const workflows: any[] = [];
              let hasWorkflows = false;
              
              if (headSha) {
                try {
                  const checksData = await fetchGitHub(`/repos/${owner}/${name}/commits/${headSha}/check-runs`, token);
                  if (checksData && checksData.check_runs && Array.isArray(checksData.check_runs)) {
                    checksData.check_runs.slice(0, 5).forEach((cr: any) => {
                      hasWorkflows = true;
                      workflows.push({
                        name: cr.name,
                        status: cr.status,
                        conclusion: cr.conclusion || "running"
                      });
                    });
                  }
                } catch (checkErr) {
                  console.warn(`Could not fetch checks for PR #${prNum} in ${name}`, checkErr);
                }
              }
              
              mappedPRs.push({
                number: prNum,
                title: prTitle,
                state: pr.state,
                author: prAuthor,
                createdAt: prCreatedAt,
                hasWorkflows,
                workflows
              });
            }
          }
        } catch (prErr) {
          console.warn(`Could not fetch pulls for ${name}`, prErr);
        }

        const currentReconData = {
          name,
          owner,
          interDependencies: Array.from(interDeps),
          externalDependencies: externalDeps,
          branches: branchDetails,
          pullRequests: mappedPRs,
          architecturalDebt: calculateArchitecturalDebt(
            name,
            repo.updated_at,
            branches.length,
            externalDeps.length,
            mappedPRs.some(pr => pr.hasWorkflows),
            fileAnalysis.isMultiSystem,
            mappedPRs.length
          )
        };

        reconDataRef.current = [...reconDataRef.current, currentReconData];
        setReconData([...reconDataRef.current]);
        // --- END RECONNAISSANCE LAYER ANALYSIS ---

        // 4. Categorize
        const category = categorizeRepo(name, readmeContent, fileAnalysis, bypassRef.current);

        let finalDescription = repo.description || "No description";
        if (privacyRef.current) {
          finalDescription = redactSensitiveData(finalDescription);
        }

        const repoInfo: RepoInfo = {
          name: name,
          url: repo.html_url,
          description: finalDescription,
          category: category,
          language: repo.language || "N/A",
          default_branch: defaultBranch,
          branches_count: branches.length,
          branches: branches,
          primary_stack: fileAnalysis.primaryStack,
          is_multi_system: fileAnalysis.isMultiSystem,
          subsystems: fileAnalysis.subsystems,
          updated_at: repo.updated_at,
          code_snippets,
        };

        inventoryRef.current.push(repoInfo);
        setInventory([...inventoryRef.current]);
        if (!systemGroupsRef.current[category]) systemGroupsRef.current[category] = [];
        systemGroupsRef.current[category].push(repoInfo);

        // Update live metrics
        updateMetrics({
          auditedRepos: i + 1,
          multiSystems: metricsRef.current.multiSystems + (fileAnalysis.isMultiSystem ? 1 : 0),
          totalBranches: metricsRef.current.totalBranches + branches.length,
          duplicates: dupesCount
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

      await generateFinalManifests();

      addLog("\n📊 Finalizing Audit...\n", "info");
      setIsComplete(true);
      setAuditStatus("completed");
      saveStateToStorage();
      if (statusRef.current !== 'stopped' && pushRepoName) { await handlePushToRepo(); }
      
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

  const handlePushToRepo = async () => {
    if (!token) {
      addLog("❌ Please provide a GitHub token to push to a repo.", "error");
      return;
    }
    if (!pushRepoName || !pushRepoName.includes("/")) {
      addLog("❌ Please provide a valid target repository (e.g., username/repo-name).", "error");
      return;
    }
    
    setIsPushing(true);
    addLog(`\n🚀 Preparing to push manifests to ${pushRepoName}...`, "info");
    
    try {
      // Ensure we only push the generated files we have in state
      const filesToPush: Record<string, string> = {};
      ["INVENTORY.md", "BRANCH_MAP.json", "SYSTEM_GROUPS.json", "CONSOLIDATION_PLAN.md", "DEDUPLICATION_REPORT.md", "DARLEK_CAAN_ANALYSIS.md", "assemble_monorepo.sh", "HUXLEY_META_MAP.md"].forEach(file => {
        if (fileContentsRef.current[file]) {
          filesToPush[file] = fileContentsRef.current[file];
        }
      });
      
      if (Object.keys(filesToPush).length === 0) {
         throw new Error("No generated manifests found to push.");
      }

      const htmlUrl = await pushToGitHub(token, pushRepoName, filesToPush, "docs: add Monorepo Consolidation Plan manifests", directCommit);
      addLog(`✅ Successfully pushed files to ${pushRepoName}!`, "success");
      addLog(`👉 View commit: ${htmlUrl}`, "success");
    } catch (err: any) {
      addLog(`❌ Failed to push to GitHub: ${err.message}`, "error");
    } finally {
      setIsPushing(false);
    }
  };

  const handleTriggerHotswap = async () => {
    setIsHotswapping(true);
    addLog(`\n🧠 Preparing Neural Hotswap module [${selectedHotswapModule}]...`, "warning");
    addLog("⏳ Bundling system synapses and preparing hot-patch...", "info");

    try {
      let filePath = "";
      let content = "";

      if (selectedHotswapModule === "EMG_CORE_UI_ENHANCED") {
        filePath = "src/components/Console.tsx";
        const fileContentRes = await fetch(`/api/read-file?path=${encodeURIComponent(filePath)}`);
        const resData = await fileContentRes.json();
        let text = resData.content || "";
        if (!text.includes("// EMG NEURAL CORE ENHANCED")) {
          text = `// EMG NEURAL CORE ENHANCED - Applied at ${new Date().toISOString()}\n` + text;
        }
        content = text;
      } else {
        filePath = "src/lib/github.ts";
        const fileContentRes = await fetch(`/api/read-file?path=${encodeURIComponent(filePath)}`);
        const resData = await fileContentRes.json();
        let text = resData.content || "";
        text = text.replace("// 1. Get default branch", "// 1. Get default branch (TURBO-BOOST ACTIVE)");
        content = text;
      }

      const response = await fetch("/api/hotswap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, content })
      });

      if (!response.ok) {
        throw new Error("Failed to hotswap on server");
      }

      localStorage.setItem('HOTSWAP_AUTO_RESUME', 'true');
      saveStateToStorage();

      addLog(`⚡ Synaptic Hotswap Successful! Applied [${selectedHotswapModule}] successfully.`, "success");
      addLog("🔄 Refreshing neural interface...", "warning");
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      addLog(`❌ Hotswap Injection Failed: ${err.message}`, "error");
    } finally {
      setIsHotswapping(false);
    }
  };

  const progress = metrics.totalRepos > 0 ? (metrics.auditedRepos / metrics.totalRepos) * 100 : 0;

  // Calculate top categories for display
  const sortedCategories = (Object.entries(categoryCounts) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([name]) => name !== "TEST/ARCHIVE" && name !== "UNCATEGORIZED / OTHER");
  
  const topCategories = sortedCategories.slice(0, 4);
  const getCategoryColor = (index: number) => {
    const colors = ["text-indigo-400", "text-emerald-400", "text-sky-400", "text-rose-400"];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col w-full min-h-screen lg:h-screen bg-black text-white font-sans p-4 lg:p-6 lg:overflow-hidden">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Github className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Repository Auditor</h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Automated structural analysis & consolidation planning</p>
          </div>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Environment</span>
            <span className="text-emerald-400 text-xs font-mono">Local Browser Instance</span>
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 grid-rows-none lg:grid-rows-6 gap-4 flex-1 lg:min-h-0">
        
        {/* Configuration Card */}
        <div className="col-span-12 lg:col-span-4 lg:row-span-2 bg-black border border-white/20 rounded-2xl p-5 flex flex-col justify-between min-h-[160px]">
          <div>
            <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-2 block">Access Authentication</label>
            <div className="relative">
              <input 
                type="password" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                disabled={auditStatus === 'running' || auditStatus === 'paused'}
                className="w-full bg-black border border-white/20 text-indigo-400 font-mono text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50" 
              />
              <div className="absolute right-3 top-3.5 text-slate-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM7 7a3 3 0 116 0v2H7V7z"></path></svg>
              </div>
            </div>

            {/* Targeted Reconnaissance Discovery */}
            <div className="mt-4 border-t border-white/20 pt-4">
              <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-2 block">Discovery Scope (Reconnaissance)</label>
              <div className="grid grid-cols-3 gap-1.5 mb-2 bg-black p-1 rounded-lg border border-white/20">
                <button
                  onClick={() => setScanMode('self')}
                  disabled={auditStatus === 'running' || auditStatus === 'paused'}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${scanMode === 'self' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:text-slate-200'}`}
                >
                  Self
                </button>
                <button
                  onClick={() => setScanMode('org')}
                  disabled={auditStatus === 'running' || auditStatus === 'paused'}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${scanMode === 'org' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:text-slate-200'}`}
                >
                  Org
                </button>
                <button
                  onClick={() => setScanMode('user')}
                  disabled={auditStatus === 'running' || auditStatus === 'paused'}
                  className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${scanMode === 'user' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:text-slate-200'}`}
                >
                  User
                </button>
              </div>
              
              {scanMode !== 'self' && (
                <input 
                  type="text"
                  value={scanTarget}
                  onChange={(e) => setScanTarget(e.target.value)}
                  placeholder={scanMode === 'org' ? "Enter Organization name" : "Enter Username"}
                  disabled={auditStatus === 'running' || auditStatus === 'paused'}
                  className="w-full bg-black border border-white/20 text-indigo-300 font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50" 
                />
              )}
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPrivacyMode(!privacyMode)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-bold transition-all ${privacyMode ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-300' : 'bg-black border-white/20 text-gray-400 hover:text-white'}`}
                title="Masks API Keys, Tokens, Emails, etc."
              >
                {privacyMode ? <Shield className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                Privacy Mode {privacyMode ? 'On' : 'Off'}
              </button>
              
              <button 
                onClick={() => setBypassHuxley(!bypassHuxley)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-bold transition-all ${bypassHuxley ? 'bg-amber-900/30 border-amber-500/50 text-amber-300' : 'bg-black border-white/20 text-gray-400 hover:text-white'}`}
                title="Ignore 'Huxley' signatures in generic Readmes"
              >
                <Filter className="w-3.5 h-3.5" />
                Huxley Bypass {bypassHuxley ? 'On' : 'Off'}
              </button>

              <button 
                onClick={() => setRunDarlekCaan(!runDarlekCaan)}
                className={`col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-lg border text-[11px] font-bold transition-all ${runDarlekCaan ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300' : 'bg-black border-white/20 text-gray-400 hover:text-white'}`}
                title="Run Darlek Caan Automated Code Enhancer Analysis"
              >
                <Terminal className="w-3.5 h-3.5" />
                Darlek Caan Enhancer {runDarlekCaan ? 'Active' : 'Off'}
              </button>

              <button 
                onClick={() => setRunHuxleyMeta(!runHuxleyMeta)}
                className={`col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-lg border text-[11px] font-bold transition-all ${runHuxleyMeta ? 'bg-fuchsia-900/30 border-fuchsia-500/50 text-fuchsia-300' : 'bg-black border-white/20 text-gray-400 hover:text-white'}`}
                title="Generate Huxley Meta-Analysis Concept Map"
              >
                <Globe className="w-3.5 h-3.5" />
                Huxley Meta-Analysis {runHuxleyMeta ? 'Active' : 'Off'}
              </button>

              <button 
                onClick={() => setAutoInjection(!autoInjection)}
                className={`col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-lg border text-[11px] font-bold transition-all ${autoInjection ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300' : 'bg-black border-white/20 text-gray-400 hover:text-white'}`}
                title="Automatically suggest applying identified enhancements directly using the Darlek Caan engine"
              >
                <Zap className="w-3.5 h-3.5" />
                Auto-Injection Toggle {autoInjection ? 'Active' : 'Off'}
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleLocalScan} 
              {...{ webkitdirectory: "true", directory: "true" } as any} 
              multiple 
              className="hidden" 
            />
            {(auditStatus === 'idle' || auditStatus === 'completed') && (
              <>
                <button 
                  onClick={loadDemoState}
                  className="w-full bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/35 text-indigo-300 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Load Pre-Scanned Huxley Portfolio</span>
                </button>
                <button 
                  onClick={() => startAudit(false)}
                  disabled={!token.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:text-white/50 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Initiate GitHub Scan</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 border border-slate-700 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                  <span>Local Directory Scan</span>
                </button>
                {hasSavedState && (
                  <button 
                    onClick={loadSavedState}
                    disabled={!token.trim()}
                    className="w-full bg-black hover:bg-black text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
        <div className="col-span-6 lg:col-span-2 lg:row-span-1 bg-black border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px]">
          <span className="text-3xl font-bold text-white">{metrics.totalRepos || '-'}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">Repositories</span>
        </div>

        {/* Metric: Multi-System */}
        <div className="col-span-6 lg:col-span-2 lg:row-span-1 bg-black border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px]">
          <span className="text-3xl font-bold text-orange-400">{metrics.multiSystems || '-'}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">Multi-Systems</span>
        </div>

        {/* Metric: Branches */}
        <div className="col-span-6 lg:col-span-2 lg:row-span-1 bg-black border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px]">
          <span className="text-3xl font-bold text-emerald-400">{metrics.totalBranches || '-'}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">Branches</span>
        </div>
        
        {/* Metric: Duplicates */}
        <div className="col-span-6 lg:col-span-2 lg:row-span-1 bg-black border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px]">
          <span className="text-3xl font-bold text-indigo-400">{metrics.duplicates || '-'}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">Shared Blobs</span>
        </div>

        {/* Scanning Status / Categories */}
        <div className="col-span-12 lg:col-span-8 lg:row-span-1 bg-black border border-white/20 rounded-2xl p-4 flex flex-wrap lg:flex-nowrap items-center justify-around gap-4 min-h-[100px]">
          {topCategories.length > 0 ? (
            topCategories.map(([cat, count], idx) => {
              const percentage = metrics.auditedRepos ? ((count / metrics.auditedRepos) * 100).toFixed(1) : "0.0";
              return (
                <div key={cat} className={`text-center ${idx < topCategories.length - 1 ? 'lg:border-r border-white/20 lg:pr-8' : ''} ${idx > 0 ? 'lg:px-8' : ''}`}>
                  <span className={`block font-mono text-sm ${getCategoryColor(idx)}`}>{percentage}%</span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">{cat}</span>
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
        <Console 
          logs={logs} 
          isRunning={auditStatus === 'running'} 
          progress={progress}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          reconData={reconData}
          scanMode={scanMode}
          scanTarget={scanTarget}
          emgCoherence={emgCoherence}
          inventory={inventory}
          fileRegistry={fileRegistryRef.current}
          autoInjection={autoInjection}
          autoInjectSuggestions={autoInjectSuggestions}
          applyingInjections={applyingInjections}
          onApplyEnhancement={onApplyEnhancement}
          isHotswapping={isHotswapping}
          handleTriggerHotswap={handleTriggerHotswap}
          auditStatus={auditStatus}
        />

        {/* Side Action Panel */}
        <div className="col-span-12 lg:col-span-4 lg:row-span-4 bg-black border border-white/20 rounded-2xl p-5 flex flex-col gap-4 min-h-[300px]">
          <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-tighter">Auto-Push Integration</h3>
          
          <div className="flex-1 flex flex-col gap-3">
            <div className="bg-black border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-900/40 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Repository Auditor Sync</p>
                  <p className="text-[10px] text-gray-400">Auto-pushing analysis to target repo</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-black border border-white/20 p-2 rounded-lg mt-3">
                <span className="text-[10px] text-gray-400">Target:</span>
                <span className="text-[10px] font-mono text-emerald-400">Repository-Auditor</span>
              </div>
              <div className="flex items-center justify-between bg-black border border-white/20 p-2 rounded-lg mt-2">
                <span className="text-[10px] text-gray-400">Auto-Push Status:</span>
                <span className="text-[10px] font-mono text-indigo-400">{isComplete ? 'READY / PUSHING' : 'WAITING FOR COMPLETION'}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 flex flex-col gap-4">
            {/* EMG NEURAL CORE & HOTSWAP PORTAL */}
            <div className="border border-indigo-900/40 bg-black rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  EMG NEURAL CORE
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30">
                  COHERENCE: {emgCoherence}%
                </span>
              </div>

              {/* Simulated Synaptic Links Feed */}
              <div className="bg-black rounded-lg p-2.5 h-[80px] overflow-y-auto font-mono text-[9px] text-gray-300 border border-white/20 flex flex-col gap-1">
                {activeSynapses.length === 0 ? (
                  <p className="text-slate-600 italic">Gateways standby. Synapses will activate during deep scanning.</p>
                ) : (
                  activeSynapses.map((syn, index) => (
                    <p key={index} className="text-indigo-300 flex items-center gap-1 leading-normal">
                      <span className="text-emerald-500 animate-pulse">●</span> {syn}
                    </p>
                  ))
                )}
              </div>

              {/* Neural Hotswap & Code Injection Panel */}
              <div className="border-t border-white/20 pt-3 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-tight text-gray-300">Synaptic Hotswap Module</span>
                <div className="flex gap-2">
                  <select
                    value={selectedHotswapModule}
                    onChange={(e) => setSelectedHotswapModule(e.target.value)}
                    className="flex-1 bg-black border border-white/20 text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="EMG_CORE_UI_ENHANCED">EMG Neural Console (UI Patch)</option>
                    <option value="TURBO_AUDITING_CORE">Turbo-Boost Core (Performance)</option>
                  </select>
                  <button
                    onClick={handleTriggerHotswap}
                    disabled={isHotswapping}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all flex items-center gap-1 shrink-0"
                  >
                    {isHotswapping ? "Hotswapping..." : "Hotswap"}
                  </button>
                </div>
              </div>
            </div>

            {/* PUSH MANIFESTS TO GITHUB CARD */}
            {isComplete ? (
              <div className="border bg-black border-indigo-500/30 rounded-xl p-4 transition-all flex flex-col gap-2.5">
                <div>
                  <p className="text-[10px] font-bold uppercase mb-0.5 tracking-tight text-indigo-300">Manual Push Override</p>
                  <p className="text-[10px] text-gray-300">Manually trigger push to alternative repository.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="username/repo-name"
                    value={pushRepoName}
                    onChange={(e) => setPushRepoName(e.target.value)}
                    className="flex-1 bg-black border border-white/20 text-white text-[11px] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handlePushToRepo}
                    disabled={isPushing || !pushRepoName}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
                    title="Push files"
                  >
                    <UploadCloud className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border bg-black border-white/20 rounded-xl p-4 transition-all">
                <p className="text-[10px] font-bold uppercase mb-1 tracking-tight text-gray-400">System Notice</p>
                <p className="text-[11px] text-gray-300 leading-relaxed italic">
                  Awaiting initialization. Provide an access token and initiate deep scan to begin structural analysis.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Bar */}
      <footer className="mt-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${token ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] uppercase font-bold text-gray-400">{token ? 'Ready' : 'Waiting for Token'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${auditStatus === 'running' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse' : auditStatus === 'paused' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] uppercase font-bold text-gray-400">{auditStatus === 'running' ? 'Active Scan' : auditStatus === 'paused' ? 'Paused' : 'Idle'}</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono hidden sm:block">
          USER_ID: craighckby_99 // SESSION_REF: 8XJ-221
        </div>
      </footer>
    </div>
  );
}
