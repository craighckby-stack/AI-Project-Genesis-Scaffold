import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { Console } from "./components/Console";
import { LogMessage, RepoInfo } from "./types";
import { fetchGitHub, analyzeFiles, categorizeRepo, downloadFile, redactSensitiveData, pushToGitHub } from "./lib/github";
import { demoInventory, demoBranchMap, demoFileRegistry, demoReconData, demoAutoInjectSuggestions, demoFileContents } from "./lib/demoData";
import { Play, Github, ChevronRight, Download, Eye, Terminal, Pause, Square, Save, Copy, Shield, ShieldOff, Filter, UploadCloud, FolderOpen, Globe, Zap, Cpu } from "lucide-react";

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
      setTimeout(() => {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
          try {
            const state = JSON.parse(saved);
            // We manually set state to simulate loadSavedState inside this effect
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

  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
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
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      setHasSavedState(true);
    } catch (e) {
      console.error("Error saving state to storage:", e);
    }
  };

  const clearSavedState = () => {
    localStorage.removeItem(STATE_KEY);
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
  ) => 
