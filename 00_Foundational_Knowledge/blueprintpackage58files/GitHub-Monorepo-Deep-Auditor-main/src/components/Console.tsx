import { LogMessage } from "../types";
import { useEffect, useRef, useState } from "react";
import { 
  Terminal, Search, FolderPlus, GitPullRequest, Cpu, Settings, Play, 
  CheckCircle, AlertTriangle, AlertCircle, Copy, Zap, ArrowRight, 
  GitBranch, GitMerge, FileText, Activity, ShieldAlert, Bug, RefreshCw
} from "lucide-react";

export function Console({ 
  logs, 
  isRunning,
  progress,
  activeTab = 'audit',
  setActiveTab,
  reconData = [],
  scanMode,
  scanTarget,
  emgCoherence = 0,
  inventory = [],
  fileRegistry = new Map(),
  autoInjection,
  autoInjectSuggestions = [],
  applyingInjections = {},
  onApplyEnhancement,
  isHotswapping = false,
  handleTriggerHotswap,
  auditStatus = 'idle',
  ...props
}: { 
  logs: LogMessage[], 
  isRunning: boolean,
  progress: number,
  activeTab: string,
  setActiveTab: (tab: any) => void,
  reconData?: any[],
  scanMode?: string,
  scanTarget?: string,
  emgCoherence?: number,
  inventory?: any[],
  fileRegistry?: Map<string, any[]>,
  autoInjection?: boolean,
  autoInjectSuggestions?: any[],
  applyingInjections?: Record<string, boolean>,
  onApplyEnhancement?: (filePath: string, content: string) => Promise<void>,
  isHotswapping?: boolean,
  handleTriggerHotswap?: () => Promise<void>,
  auditStatus?: string,
  [key: string]: any
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedReconRepo, setSelectedReconRepo] = useState<string>("");
  const [chaosLog, setChaosLog] = useState<string[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileOutput, setCompileOutput] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === 'audit' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  useEffect(() => {
    if (emgCoherence >= 100 && !isHotswapping && auditStatus === 'running') {
      // @ts-ignore
      if (!window.__HAS_HOTSWAPPED__ && handleTriggerHotswap) {
        // @ts-ignore
        window.__HAS_HOTSWAPPED__ = true;
        handleTriggerHotswap();
      }
    }
  }, [emgCoherence, isHotswapping, auditStatus, handleTriggerHotswap]);

  // Select default recon repo if none selected
  useEffect(() => {
    if (reconData.length > 0 && !selectedReconRepo) {
      setSelectedReconRepo(reconData[0].name);
    }
  }, [reconData, selectedReconRepo]);

  const activeRecon = reconData.find(r => r.name === selectedReconRepo);

  const runChaosTest = (type: string) => {
    const time = new Date().toLocaleTimeString();
    let msg = "";
    if (type === "LATENCY") {
      msg = `[${time}] ⚠️ FAULT INJECTED: Simulated 4000ms latency spike on API network mesh. Verified autonomous retry buffers.`;
    } else if (type === "RATE_LIMIT") {
      msg = `[${time}] ⚠️ FAULT INJECTED: Simulated 429 Too Many Requests breach on GitHub API. Backoff multiplier expanded from 1.5x to 3.0x with jitter recovery.`;
    } else {
      msg = `[${time}] ⚠️ FAULT INJECTED: Simulated auth credential expiry. Fallback circuit breaker triggered securely, conserving current scan status.`;
    }
    setChaosLog(prev => [...prev, msg]);
  };

  const runSimulatedCompile = () => {
    setIsCompiling(true);
    setCompileOutput(["⚡ Initializing Monorepo Build Runner...", "⏳ Resolution mapping of 9 interdependent workspaces..."]);
    
    setTimeout(() => {
      setCompileOutput(prev => [...prev, "✓ Bundling common package schemas into shared core..."]);
    }, 500);
    
    setTimeout(() => {
      setCompileOutput(prev => [...prev, "✓ Compiling individual micro-agents entrypoints..."]);
    }, 1000);
    
    setTimeout(() => {
      setCompileOutput(prev => [...prev, "✓ Executing optimization trees on 445 redundant file structures..."]);
    }, 1500);

    setTimeout(() => {
      setCompileOutput(prev => [...prev, "✓ Build complete. Monorepo verified with Zero compilation errors."]);
      setIsCompiling(false);
    }, 2000);
  };

  return (
    <div className="col-span-12 lg:col-span-8 lg:row-span-4 bg-black border-2 border-white/20 rounded-2xl overflow-hidden flex flex-col h-full min-h-[480px] shadow-2xl shadow-indigo-950/20">
      
      {/* Top Header Controls with Tabs selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 bg-black border-b border-white/20 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          </div>
          <span className="text-[10px] text-indigo-400/80 font-mono hidden sm:block tracking-widest ml-2">EMG_MEMORY_CORE_ONLINE.bin</span>
        </div>

        {/* Tab Buttons */}
        <div className="flex overflow-x-auto gap-1 py-1 sm:py-0 no-scrollbar">
          <button 
            onClick={() => setActiveTab('audit')} 
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Terminal className="w-3 h-3" /> Console
          </button>
          <button 
            onClick={() => setActiveTab('recon')} 
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${activeTab === 'recon' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Search className="w-3 h-3" /> Recon Radar
          </button>
          <button 
            onClick={() => setActiveTab('assembler')} 
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${activeTab === 'assembler' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <FolderPlus className="w-3 h-3" /> Assembler
          </button>
          <button 
            onClick={() => setActiveTab('pipeline')} 
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${activeTab === 'pipeline' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <GitPullRequest className="w-3 h-3" /> Pipelines
          </button>
          <button 
            onClick={() => setActiveTab('ops')} 
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${activeTab === 'ops' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Cpu className="w-3 h-3" /> Cognitive Ops
          </button>
          <button 
            onClick={() => setActiveTab('deploy')} 
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${activeTab === 'deploy' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Settings className="w-3 h-3" /> Deploy
          </button>
          <button 
            onClick={() => setActiveTab('resilience')} 
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${activeTab === 'resilience' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Bug className="w-3 h-3" /> Fault Injector
          </button>
        </div>
      </div>

      {/* Tab Panels Contents */}
      <div className="flex-1 min-h-0 bg-[radial-gradient(#111116_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden flex flex-col">
        
        {/* PANEL: AUDIT CONSOLE LOGS */}
        {activeTab === 'audit' && (
          <div ref={scrollRef} className="flex-1 p-4 font-mono text-xs overflow-y-auto flex flex-col gap-1.5">
            {logs.length === 0 && (
              <p className="text-gray-400 italic">SYSTEM READY. Neural gateways mapped. Initiate Deep Scan or load Pre-Scanned Portfolio to begin.</p>
            )}
            {logs.map((log) => (
              <p key={log.id} className={`${getLogColor(log.type)} whitespace-pre-wrap transition-all hover:translate-x-1 duration-150`}>
                <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                {getLogPrefix(log.type)} {log.text}
              </p>
            ))}
          </div>
        )}

        {/* PANEL: RECONNAISSANCE LAYER */}
        {activeTab === 'recon' && (
          <div className="flex-1 p-4 overflow-y-auto flex flex-col md:flex-row gap-4">
            {/* Repo List Sidebar */}
            <div className="w-full md:w-1/3 border border-white/10 rounded-xl p-3 bg-black flex flex-col gap-2 shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Discovered Ecosystem</span>
              <div className="flex flex-col gap-1 overflow-y-auto flex-1 max-h-[250px] md:max-h-none">
                {reconData.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-2">Awaiting scan metrics data.</p>
                ) : (
                  reconData.map((r) => (
                    <button
                      key={r.name}
                      onClick={() => setSelectedReconRepo(r.name)}
                      className={`text-left p-2 rounded-lg text-xs font-semibold transition-all border ${selectedReconRepo === r.name ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300' : 'bg-black border-transparent hover:border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      {r.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Active Repo Details */}
            <div className="flex-1 border border-white/10 rounded-xl p-4 bg-black flex flex-col gap-4">
              {activeRecon ? (
                <>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        {activeRecon.name}
                      </h4>
                      <p className="text-[10px] text-gray-400">Owner: {activeRecon.owner}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-400">Architectural Debt</span>
                      <span className={`text-xs font-bold font-mono ${activeRecon.architecturalDebt?.riskLevel === "High" ? "text-rose-400" : activeRecon.architecturalDebt?.riskLevel === "Medium" ? "text-amber-400" : "text-emerald-400"}`}>
                        Score: {activeRecon.architecturalDebt?.score || 0} ({activeRecon.architecturalDebt?.riskLevel || "Low"})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Inter-dependencies */}
                    <div className="border border-white/10 rounded-lg p-3 bg-black flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <GitMerge className="w-3.5 h-3.5" /> Mapped Ecosystem Synapses
                      </span>
                      <div className="flex-1 flex flex-col gap-1 max-h-[100px] overflow-y-auto">
                        {activeRecon.interDependencies.length === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">No external synapses within scanned group.</span>
                        ) : (
                          activeRecon.interDependencies.map((dep: string) => (
                            <span key={dep} className="text-[11px] font-mono text-indigo-300">
                              ⇄ {dep}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* External dependencies */}
                    <div className="border border-white/10 rounded-lg p-3 bg-black flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Core Requirements / Packages
                      </span>
                      <div className="flex-1 flex flex-wrap gap-1 max-h-[100px] overflow-y-auto">
                        {activeRecon.externalDependencies.length === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">No parsed dependencies detected.</span>
                        ) : (
                          activeRecon.externalDependencies.map((dep: string) => (
                            <span key={dep} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-900/30">
                              {dep}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Branches & PR history */}
                  <div className="flex-1 border border-white/10 rounded-lg p-3 bg-black flex flex-col gap-2 overflow-y-auto max-h-[150px]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5" /> Active Branch Integrity
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {activeRecon.branches.map((b: any) => (
                        <div key={b.name} className="flex items-center justify-between text-xs font-mono border-b border-white/5 pb-1">
                          <span className="text-gray-300 flex items-center gap-1">
                            {b.isDefault && <span className="text-[8px] px-1 bg-indigo-950 text-indigo-400 border border-indigo-900/30 rounded uppercase font-bold">Default</span>}
                            {b.name}
                          </span>
                          <span className="text-gray-400 text-[
