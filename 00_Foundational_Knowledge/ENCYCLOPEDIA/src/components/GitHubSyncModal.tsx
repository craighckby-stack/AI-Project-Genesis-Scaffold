import { useState, useEffect } from "react";
import { X, Search, RefreshCw, Github, AlertCircle, CheckCircle2, Upload, Database, Clock, FileDown, ShieldCheck, Cpu } from "lucide-react";

export default function GitHubSyncModal({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [repoName, setRepoName] = useState("encyclopedia-of-engineering");
  const [autoSyncState, setAutoSyncState] = useState<any>(null);
  const [customRepoInput, setCustomRepoInput] = useState("");
  const [customScanning, setCustomScanning] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");

  useEffect(() => {
    checkToken();
    
    const checkSync = () => {
      fetch("/api/github/auto-sync/status")
        .then(res => res.json())
        .then(data => setAutoSyncState(data))
        .catch(() => {});
    };
    checkSync();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSync();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(checkSync, 2000);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const checkToken = async () => {
    try {
      const res = await fetch("/api/github/status");
      const data = await res.json();
      if (data.connected) {
        setStatus("success");
        fetchRepos("");
      } else {
        setStatus("idle");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  const fetchRepos = async (searchQuery = "") => {
    try {
      setLoading(true);
      const url = searchQuery.trim()
        ? `/api/github/repos?q=${encodeURIComponent(searchQuery.trim())}`
        : "/api/github/repos";
      const res = await fetch(url);
      const data = await res.json();
      setRepos(Array.isArray(data) ? data : data.repos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = async () => {
    try {
      setStatus("checking");
      const res = await fetch("/api/github/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      
      if (res.ok) {
        setStatus("success");
        fetchRepos();
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  const handleScan = async (fullName: string) => {
    try {
      setLoading(true);
      await fetch("/api/github/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName: fullName }),
      });
      alert("Scan completed! Wait a moment for UI to refresh.");
    } catch (err) {
      alert("Error scanning repository");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomScan = async () => {
    if (!customRepoInput.trim()) return;
    
    let input = customRepoInput.trim();
    // Clean URL prefixes
    input = input.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "");
    const parts = input.split("/");
    if (parts.length < 2) {
      alert("Please enter a valid owner/repository name or GitHub URL.");
      return;
    }
    const repoFullName = `${parts[0]}/${parts[1]}`;
    
    try {
      setCustomScanning(true);
      const res = await fetch("/api/github/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName }),
      });
      
      if (res.ok) {
        alert(`Successfully scanned ${repoFullName}! The encyclopedia has been refreshed with newly extracted capabilities.`);
        setCustomRepoInput("");
        onClose();
        window.location.reload();
      } else {
        const errData = await res.json();
        alert(`Scan failed: ${errData.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Error scanning repository: ${err.message}`);
    } finally {
      setCustomScanning(false);
    }
  };

  const handleStartAutoSync = async () => {
    try {
      await fetch("/api/github/auto-sync/start", { method: "POST" });
    } catch (err) {
      alert("Failed to start auto-sync");
    }
  };

  const handleDownloadMarkdown = async () => {
    try {
      const res = await fetch("/api/github/build-markdown");
      if (!res.ok) throw new Error("Failed to download markdown");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ENCYCLOPEDIA.md";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const res = await fetch("/api/github/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Successfully published! URL: " + data.url);
    } catch (err: any) {
      alert("Publish failed: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
      <div className="bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(192,38,211,0.15)] border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Github size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-lg font-display tracking-wide">GitHub Integration</h2>
              <p className="text-xs text-slate-400 font-mono">Connect Source Repositories & Track Collective Indexes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-slate-950/50">
          {status !== "success" ? (
            <div className="max-w-md mx-auto space-y-8 py-10">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center border border-fuchsia-500/20 mb-6">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="font-display font-extrabold text-2xl text-slate-100">Connect to GitHub</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  To index your organization's repositories and automate capability extraction, insert your GitHub Personal Access Token (classic) below.
                </p>
              </div>
              
              <div className="space-y-4">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx..."
                  className="w-full border border-slate-700 bg-slate-900/80 text-slate-100 placeholder-slate-600 px-5 py-4 text-sm rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-all shadow-inner text-center font-mono tracking-wider"
                />
                <button
                  onClick={handleSaveToken}
                  disabled={!token || status === "checking"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-bold rounded-xl hover:from-fuchsia-500 hover:to-indigo-500 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  {status === "checking" ? <RefreshCw className="animate-spin" size={18} /> : "START INITIALIZATION"}
                </button>
              </div>
              
              {status === "error" && (
                <div className="flex items-center justify-center gap-2 text-rose-400 text-sm bg-rose-950/50 p-4 border border-rose-900/50 rounded-xl font-medium">
                  <AlertCircle size={16} />
                  <span>Invalid token or connection error.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider bg-cyan-950/30 p-4 border border-cyan-900/50 rounded-xl">
                <CheckCircle2 size={16} className="text-cyan-400" />
                <span>Authenticated Successfully</span>
              </div>

              {/* Scan Any Public Repository Input */}
              <div className="p-6 bg-slate-900/80 border border-fuchsia-900/30 rounded-2xl space-y-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-600 to-indigo-600"></div>
                <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-sm">
                  <Cpu size={16} className="animate-pulse" />
                  <span className="font-display tracking-wide">Manual Scan: Index Any Public Repository</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Analyze and index any software project on GitHub (not just your own) by entering its URL or path (e.g. <code>craighckby-stack/Free-Rag</code>).
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={customRepoInput}
                    onChange={(e) => setCustomRepoInput(e.target.value)}
                    placeholder="Enter owner/repo or paste GitHub URL"
                    className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-600 px-4 py-3 text-sm rounded-xl focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none transition-shadow font-mono"
                    disabled={customScanning}
                  />
                  <button
                    onClick={handleCustomScan}
                    disabled={!customRepoInput.trim() || customScanning}
                    className="px-6 py-3 bg-fuchsia-600 text-white font-bold rounded-xl text-sm hover:bg-fuchsia-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(192,38,211,0.3)] hover:shadow-[0_0_25px_rgba(192,38,211,0.5)] shrink-0"
                  >
                    {customScanning ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Search size={16} />
                        Index Capability
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Repos list */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm font-display">Target Repositories</h3>
                    <p className="text-xs text-slate-500 font-mono">Select a target from your linked account.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search repositories..."
                      value={repoSearchQuery}
                      onChange={(e) => setRepoSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          fetchRepos(repoSearchQuery);
                        }
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-600 px-4 py-2 text-xs rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-64 transition-shadow"
                    />
                    <button
                      onClick={() => fetchRepos(repoSearchQuery)}
                      className="p-2 px-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                      title="Search"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl bg-slate-900/50 divide-y divide-slate-800 relative shadow-inner">
                  {loading ? (
                    <div className="p-10 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-3">
                      <RefreshCw size={16} className="animate-spin text-fuchsia-500" />
                      <span>Querying GitHub...</span>
                    </div>
                  ) : repos.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 font-mono">No target repositories found.</div>
                  ) : (
                    repos.map((repo: any) => (
                      <div key={repo.id || repo.full_name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-800/80 transition-colors gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <span>{repo.full_name || repo.name}</span>
                            {repo.isOwn ? (
                              <span className="bg-fuchsia-500/10 text-fuchsia-400 text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border border-fuchsia-500/20">Yours</span>
                            ) : (
                              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded-md font-mono border border-indigo-500/20 flex items-center gap-1">
                                ⭐ {repo.stargazers_count ? repo.stargazers_count.toLocaleString() : "10k+"}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono uppercase mt-1">{repo.private ? "Private" : "Public Repository"}</p>
                        </div>
                        <button 
                          onClick={() => handleScan(repo.full_name)}
                          disabled={loading}
                          className="px-4 py-2 text-xs font-bold text-slate-200 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-slate-600 transition-all shadow-sm"
                        >
                          Index Meta
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Autonomous sync status */}
              <div className="space-y-4 pt-8 border-t border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm font-display">Autonomous Synchronization</h3>
                  <p className="text-xs text-slate-500 font-mono">Mass-scale processing of distributed engineering codebases.</p>
                </div>
                
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-5 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className={`font-bold text-xs font-mono uppercase tracking-widest ${autoSyncState?.isActuallyRunning ? 'text-fuchsia-400' : 'text-slate-400'}`}>
                        {autoSyncState?.isActuallyRunning ? "SYNC ACTIVE" : autoSyncState?.isFinished ? "SYNC COMPLETE" : "SYNC IDLE"}
                      </p>
                      <p className="text-sm text-slate-300 mt-1 font-light">
                        {autoSyncState?.statusMessage || "Ready to engage indexing."}
                      </p>
                    </div>
                    <button 
                      onClick={handleStartAutoSync}
                      disabled={autoSyncState?.isActuallyRunning}
                      className="px-5 py-3 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-bold text-xs rounded-xl hover:from-fuchsia-500 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(192,38,211,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {autoSyncState?.isActuallyRunning ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                      Engage Auto-Sync
                    </button>
                  </div>
                  
                  {autoSyncState?.rateLimitPauseUntil && (
                    <div className="p-4 bg-amber-950/30 text-amber-400 border border-amber-900/50 rounded-xl text-sm flex items-start gap-3">
                      <div className="mt-0.5">
                        <Clock size={16} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="font-bold tracking-wide">API Quota Enforced</p>
                        <p className="mt-1 text-xs text-amber-500/80 font-mono">
                          Resuming operations at {new Date(autoSyncState.rateLimitPauseUntil).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {autoSyncState && (autoSyncState.processedRepos?.length > 0 || autoSyncState.processedFilesInCurrentRepo?.length > 0) && (
                    <div className="space-y-4 text-xs font-mono text-slate-400 bg-slate-950/50 p-5 border border-slate-800 rounded-xl shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Total Scanned:</span>
                        <span className="font-bold text-slate-200 text-sm">{autoSyncState.processedRepos?.length || 0} Repositories</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Current Focus:</span>
                        <span className="font-bold text-fuchsia-400 truncate max-w-[200px] text-sm">{autoSyncState.currentRepo || "None"}</span>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-slate-800/50">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 uppercase tracking-widest">File Matrix Parsed:</span>
                          <span className="font-bold text-slate-300">{autoSyncState.processedFilesInCurrentRepo?.length || 0} / {autoSyncState.totalFilesInCurrentRepo || "?"}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 overflow-hidden rounded-full shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 h-2 transition-all duration-500 rounded-full"
                            style={{ width: `${Math.min(100, ((autoSyncState.processedFilesInCurrentRepo?.length || 0) / Math.max(1, autoSyncState.totalFilesInCurrentRepo || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Export */}
              <div className="space-y-4 pt-8 border-t border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm font-display">Data Export</h3>
                  <p className="text-xs text-slate-500 font-mono">Download the parsed engineering catalog as highly structured markdown.</p>
                </div>
                
                <button 
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  <FileDown size={16} />
                  Download ENCYCLOPEDIA.md
                </button>
              </div>

              {/* GitHub Publish */}
              <div className="space-y-4 pt-8 border-t border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm font-display">Publish Back to GitHub</h3>
                  <p className="text-xs text-slate-500 font-mono">Compile and push the structural encyclopedia payload to a new target repo.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={repoName}
                    onChange={e => setRepoName(e.target.value)}
                    placeholder="repository-name"
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 px-5 py-3 text-sm rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                  <button 
                    onClick={handlePublish}
                    disabled={publishing}
                    className="px-6 py-3 bg-slate-200 text-slate-900 font-bold rounded-xl text-sm hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                  >
                    {publishing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                    Publish Payload
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
