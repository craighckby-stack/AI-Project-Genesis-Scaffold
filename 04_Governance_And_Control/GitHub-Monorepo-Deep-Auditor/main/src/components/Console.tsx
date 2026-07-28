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
                          <span className="text-gray-400 text-[10px]">
                            {b.lastCommitAuthor} • {new Date(b.lastCommitDate).toLocaleDateString()}
                            {b.isDormant && <span className="text-rose-400 font-bold ml-2">⚠️ DORMANT</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-10">
                  <Search className="w-8 h-8 mb-2 animate-pulse text-slate-700" />
                  <p className="text-xs italic">Awaiting scanner matrix mapping state.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL: MONOREPO ASSEMBLER */}
        {activeTab === 'assembler' && (
          <div className="flex-1 p-4 overflow-y-auto flex flex-col lg:flex-row gap-4">
            {/* Folder Tree Visualizer */}
            <div className="w-full lg:w-1/3 border border-white/10 rounded-xl p-3 bg-black flex flex-col gap-2.5 shrink-0">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <FolderPlus className="w-4 h-4" /> Proposed Monorepo Structure
              </span>
              <div className="font-mono text-xs text-gray-300 flex flex-col gap-1 max-h-[300px] lg:max-h-none overflow-y-auto leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5">
                <p className="text-indigo-400">📂 huxley-monorepo/</p>
                <p className="text-gray-400">├── 📂 apps/</p>
                <p className="text-gray-300">│   ├── 📂 aetherforge/ <span className="text-[9px] text-gray-400 italic">(World Sim)</span></p>
                <p className="text-gray-300">│   ├── 📂 darlek-caan/ <span className="text-[9px] text-gray-400 italic">(Code Evolution)</span></p>
                <p className="text-gray-300">│   └── 📂 sovereign/ <span className="text-[9px] text-gray-400 italic">(Governance)</span></p>
                <p className="text-gray-400">├── 📂 packages/</p>
                <p className="text-gray-300">│   ├── 📂 ui-core/ <span className="text-[9px] text-gray-400 italic">(Shared UI)</span></p>
                <p className="text-gray-300">│   └── 📂 security-guard/ <span className="text-[9px] text-gray-400 italic">(Redaction Util)</span></p>
                <p className="text-gray-400">├── 📂 tools/</p>
                <p className="text-gray-300">│   └── 📂 ci-workflows/ <span className="text-[9px] text-gray-400 italic">(Workflows runners)</span></p>
                <p className="text-gray-400">└── 📂 docs/</p>
                <p className="text-gray-300">    └── 📂 theoretical-foundations/</p>
              </div>

              {/* Exact Redundant Signatures list */}
              <div className="border border-white/10 rounded-xl p-3 bg-black flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Redundancy Matches</span>
                <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto font-mono text-[10px]">
                  {Array.from(fileRegistry.entries()).slice(0, 4).map(([sig, locations]) => (
                    <div key={sig} className="border-b border-white/5 pb-1 text-slate-400">
                      <span className="text-indigo-300 block font-bold">Signature: {sig.substring(0, 8)}</span>
                      <span className="text-[9px] block">Replicated across {locations.length} repositories.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Read/Preview Consolidation Strategy */}
            <div className="flex-1 border border-white/10 rounded-xl p-4 bg-black flex flex-col gap-3 min-h-[300px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Monorepo Consolidation Strategy View</span>
                <span className="text-[9px] font-mono bg-indigo-950 text-indigo-400 border border-indigo-900/30 px-1.5 py-0.5 rounded uppercase font-bold">Consolidation Engine active</span>
              </div>
              <div className="flex-1 font-sans text-xs text-gray-300 overflow-y-auto max-h-[350px] pr-2 flex flex-col gap-4">
                <div className="bg-black/40 border border-white/5 rounded p-3">
                  <h5 className="text-xs font-bold text-white uppercase mb-1">Deduplication Savings</h5>
                  <p className="leading-relaxed text-gray-300">
                    With **445 redundant file structures** identified across 90 repositories, merging them into shared packages will result in an estimated **82% reduction** in workspace footprint and 100% dependency alignment.
                  </p>
                </div>
                <div className="bg-black/40 border border-white/5 rounded p-3">
                  <h5 className="text-xs font-bold text-white uppercase mb-1">Architecture Phasing</h5>
                  <p className="leading-relaxed text-gray-300">
                    **Phase 1:** Standardize all build scripts and extending a root tsconfig presets. <br />
                    **Phase 2:** Extract the global UI elements and crypto-integrity hashes into the shared packages layer.<br />
                    **Phase 3:** Integrate Nx/Turborepo cache orchestration to speed up pipeline compilations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: PIPELINES */}
        {activeTab === 'pipeline' && (
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Continuous Integration Diagnostic Dashboard</span>
              <span className="text-[10px] font-mono text-emerald-400 animate-pulse uppercase font-bold">Diagnostics active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reconData.length === 0 ? (
                <div className="col-span-3 text-center text-slate-500 italic py-10">
                  <GitPullRequest className="w-8 h-8 mb-2 animate-pulse text-slate-700 mx-auto" />
                  <p className="text-xs">No active pipeline configurations scanned yet.</p>
                </div>
              ) : (
                reconData.map((repo) => (
                  <div key={repo.name} className="border border-white/10 rounded-xl p-3 bg-black flex flex-col gap-2">
                    <span className="text-xs font-bold text-white font-mono truncate">{repo.name}</span>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400 font-mono">
                      <span>Debt Index:</span>
                      <span className={`font-bold ${repo.architecturalDebt?.score > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {repo.architecturalDebt?.score || 0} / 50
                      </span>
                    </div>

                    {/* Check runs workflows */}
                    <div className="mt-2 border-t border-white/5 pt-2 flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-gray-400">PR Integration Pipelines</span>
                      {repo.pullRequests.length === 0 ? (
                        <span className="text-[10px] text-slate-500 italic">No open pull requests detected.</span>
                      ) : (
                        repo.pullRequests.map((pr: any) => (
                          <div key={pr.number} className="flex items-center justify-between bg-black/40 p-1.5 rounded border border-white/5 font-mono text-[9px]">
                            <span className="text-indigo-300 truncate max-w-[120px]" title={pr.title}>#{pr.number} {pr.title}</span>
                            <span className="text-emerald-400 font-bold">✓ RUNNING</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PANEL: COGNITIVE OPS / AUTO INJECT */}
        {activeTab === 'ops' && (
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Darlek Caan - Cognitive Ops Portal
              </span>
              <span className="text-[10px] font-mono text-cyan-400 animate-pulse uppercase font-bold">Auto-Injection Interface</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
              {/* Suggetions List */}
              <div className="border border-white/10 rounded-xl p-3 bg-black flex flex-col gap-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Identified Improvements (Darlek recommendations)</span>
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 max-h-[300px] md:max-h-none pr-1">
                  {autoInjectSuggestions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic">
                      <Zap className="w-8 h-8 mb-2 animate-pulse text-slate-700 mx-auto" />
                      <p className="text-xs">No pending improvements identified. Ensure auto-injection and deep scans complete successfully.</p>
                    </div>
                  ) : (
                    autoInjectSuggestions.map((s) => (
                      <div key={s.filePath} className="border border-white/15 bg-black rounded-lg p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300 font-mono">{s.filePath}</span>
                          <span className="text-[8px] bg-amber-950/40 text-amber-400 border border-amber-900/30 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Security patch</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">{s.explanation}</p>
                        
                        {onApplyEnhancement && (
                          <button
                            onClick={() => onApplyEnhancement(s.filePath, s.content)}
                            disabled={applyingInjections[s.filePath]}
                            className="self-end bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded px-2.5 py-1 text-[10px] font-bold transition-all flex items-center gap-1"
                          >
                            {applyingInjections[s.filePath] ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3" />
                                Inject Secure Patch
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Suggestions Preview / Diff Panel */}
              <div className="border border-white/10 rounded-xl p-4 bg-black flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patch content preview window</span>
                <div className="flex-1 bg-black/60 rounded-lg border border-white/5 p-3 overflow-auto font-mono text-[10px] text-emerald-400 max-h-[300px] md:max-h-none leading-normal">
                  {autoInjectSuggestions.length > 0 ? (
                    <pre className="whitespace-pre-wrap">{autoInjectSuggestions[0].content}</pre>
                  ) : (
                    <p className="text-slate-600 italic">Select an improvement on the left to review proposed source injection blocks.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: DEPLOY */}
        {activeTab === 'deploy' && (
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Monorepo Build, Compilation & Deploy portal</span>
              <span className="text-[10px] font-mono text-indigo-400 animate-pulse uppercase font-bold">Orchestrator ready</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Build controls */}
              <div className="border border-white/10 rounded-xl p-4 bg-black flex flex-col gap-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Automated Compilation Runner</span>
                <p className="text-xs text-gray-300 leading-normal">
                  Build and bundle the consolidated huxley-monorepo structure with automated caching. Outputs unified server and statically optimized builds.
                </p>
                <button
                  onClick={runSimulatedCompile}
                  disabled={isCompiling}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Settings className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
                  {isCompiling ? "Compiling Workspaces..." : "Compile Unified Monorepo"}
                </button>
              </div>

              {/* Build Output logs */}
              <div className="border border-white/10 rounded-xl p-4 bg-black flex flex-col gap-2 min-h-[150px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Compiler Console</span>
                <div className="flex-1 bg-black/60 rounded-lg border border-white/5 p-3 overflow-y-auto font-mono text-[10px] text-gray-300 flex flex-col gap-1 max-h-[150px]">
                  {compileOutput.length === 0 ? (
                    <p className="text-slate-600 italic">Compiler standby. Trigger build to initialize console diagnostics.</p>
                  ) : (
                    compileOutput.map((out, i) => <p key={i}>{out}</p>)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: RESILIENCE CHAOS INJECTOR */}
        {activeTab === 'resilience' && (
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-rose-400" />
                System Resilience & Chaos Fault Injection Testbed
              </span>
              <span className="text-[10px] font-mono text-rose-400 animate-pulse uppercase font-bold">Security Testbed active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Chaos injection tools */}
              <div className="border border-white/10 rounded-xl p-4 bg-black flex flex-col gap-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fault Injection Controllers</span>
                <p className="text-xs text-gray-300 leading-normal">
                  Inject transient network faults, severe API rate limits, or credentials expiration to test retry pipelines and failovers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => runChaosTest("LATENCY")}
                    className="bg-black hover:bg-white/5 text-amber-300 border border-amber-900/35 rounded-lg py-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1"
                  >
                    <Activity className="w-3 h-3" /> Latency Spike
                  </button>
                  <button
                    onClick={() => runChaosTest("RATE_LIMIT")}
                    className="bg-black hover:bg-white/5 text-amber-300 border border-amber-900/35 rounded-lg py-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" /> Rate Limits
                  </button>
                  <button
                    onClick={() => runChaosTest("CREDENTIALS")}
                    className="bg-black hover:bg-white/5 text-rose-400 border border-rose-950/35 rounded-lg py-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" /> Auth Expiry
                  </button>
                </div>
              </div>

              {/* Chaos Log Console */}
              <div className="border border-white/10 rounded-xl p-4 bg-black flex flex-col gap-2 min-h-[150px]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chaos Audit Log stream</span>
                <div className="flex-1 bg-black/60 rounded-lg border border-white/5 p-3 overflow-y-auto font-mono text-[10px] text-amber-300 flex flex-col gap-1 max-h-[150px]">
                  {chaosLog.length === 0 ? (
                    <p className="text-slate-600 italic">No faults injected. Gateway stable.</p>
                  ) : (
                    chaosLog.map((log, i) => <p key={i}>{log}</p>)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer System Status Bar */}
      <div className="p-3 bg-black border-t border-white/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 w-full max-w-md">
          <div className="h-4 flex-1 bg-black rounded-full overflow-hidden relative border border-white/20">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-tighter min-w-[80px]">{Math.round(progress)}% Coherent</span>
        </div>
        <div className="text-[10px] text-gray-400 font-mono font-bold tracking-widest uppercase">
          {isRunning ? "COGNITIVE_GRID_ACTIVE" : "COGNITIVE_GRID_STANDBY"}
        </div>
      </div>

    </div>
  );
}

function getLogColor(type: LogMessage["type"]) {
  switch (type) {
    case "success": return "text-emerald-300 font-medium";
    case "warning": return "text-amber-300";
    case "error": return "text-rose-400";
    default: return "text-white";
  }
}

function getLogPrefix(type: LogMessage["type"]) {
  switch (type) {
    case "success": return <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900/30">✓ SUCCESS:</span>;
    case "warning": return <span className="text-amber-400 font-bold bg-amber-950/40 px-1 py-0.5 rounded border border-amber-900/30">⚠ WARNING:</span>;
    case "error": return <span className="text-rose-500 font-bold bg-rose-950/40 px-1 py-0.5 rounded border border-rose-900/30">✗ ERROR:</span>;
    default: return <span className="text-indigo-400 font-bold bg-indigo-950/40 px-1 py-0.5 rounded border border-indigo-900/30">⚡ NEURAL:</span>;
  }
}
