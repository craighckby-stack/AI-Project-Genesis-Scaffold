import { useState, useRef, useEffect } from "react";
import { Console } from "./components/Console";
import { LogMessage, RepoInfo } from "./types";
import { fetchGitHub, analyzeFiles, categorizeRepo, downloadFile, redactSensitiveData, pushToGitHub } from "./lib/github";
import { Play, Github, ChevronRight, Download, Eye, Terminal, Pause, Square, Save, Copy, Shield, ShieldOff, Filter, UploadCloud, FolderOpen, Globe } from "lucide-react";

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

  const [pushRepoName, setPushRepoName] = useState("");
  const [isPushing, setIsPushing] = useState(false);

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
    setFileContents(prev => ({ ...prev, "DEDUPLICATION_REPORT.md": dedupeMD }));
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
      setFileContents(prev => ({ ...prev, "CONSOLIDATION_PLAN.md": plan }));
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
          body: JSON.stringify({ inventory: simplifiedInventory, duplicates: duplicateEntries.slice(0, 50) }) // Limit duplicates to avoid token bloat
        });

        if (!aiResponse.ok) {
          const error = await aiResponse.json();
          throw new Error(error.error || "Failed to generate Darlek Caan enhancements");
        }

        const { enhancements } = await aiResponse.json();
        
        downloadFile("DARLEK_CAAN_ANALYSIS.md", enhancements);
        setDownloadUrls(prev => ({ ...prev, "DARLEK_CAAN_ANALYSIS.md": URL.createObjectURL(new Blob([enhancements], { type: "text/markdown" })) }));
        setFileContents(prev => ({ ...prev, "DARLEK_CAAN_ANALYSIS.md": enhancements }));
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
      assemblerScript += `echo "📦 Cloning ${r.name} into ${dest}/..."\n`;
      if (r.url !== '#') {
        assemblerScript += `git clone ${r.url}.git ${dest}/${r.name}
