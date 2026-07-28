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
    
    const interval = setInterval(checkSync, 2000);
    return () => clearInterval(interval);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Github size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg font-display">GitHub Link & Synchronization</h2>
              <p className="text-xs text-slate-400 font-mono">Connect Source Repositories & Track Collective Indexes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {status !== "success" ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <h3 className="font-bold text-slate-800 text-sm mb-1">Authentication Required</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter a GitHub Personal Access Token to sync repositories. This token requires <code>repo</code> scope to read your repositories.
                </p>
              </div>
              
              <div className="space-y-3">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx..."
                  className="w-full border border-slate-200 bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 text-sm rounded-xl focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow"
                />
                <button
                  onClick={handleSaveToken}
                  disabled={!token || status === "checking"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {status === "checking" ? <RefreshCw className="animate-spin" size={16} /> : "Authenticate"}
                </button>
              </div>
              
              {status === "error" && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 border border-red-100 rounded-xl">
                  <AlertCircle size={14} />
                  <span>Invalid token or connection error.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-mono font-bold uppercase tracking-wider bg-emerald-50 p-3 border border-emerald-100 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Authenticated Successfully</span>
              </div>

              {/* Scan Any Public Repository Input */}
              <div className="p-5 bg-gradient-to-br from-rose-50/50 to-slate-50 border border-slate-200/60 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <Cpu size={16} className="animate-pulse" />
                  <span className="font-display">Scan & Index Any Public GitHub Repository</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Analyze and index any software project on GitHub (not just your own!) by entering its URL or path (e.g. <code>https://github.com/craighckby-stack/Free-Rag</code> or <code>craighckby-stack/Free-Rag</code>).
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customRepoInput}
                    onChange={(e) => setCustomRepoInput(e.target.value)}
                    placeholder="Enter owner/repo or paste complete GitHub URL"
                    className="flex-1 bg-white border border-slate-200 text-slate-800 placeholder-slate-400 px-4 py-2.5 text-xs rounded-xl focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none transition-shadow"
                    disabled={customScanning}
                  />
                  <button
                    onClick={handleCustomScan}
                    disabled={!customRepoInput.trim() || customScanning}
                    className="px-5 py-2.5 bg-rose-600 text-white font-semibold rounded-xl text-xs hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-rose-600/20"
                  >
                    {customScanning ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Search size={14} />
                        Index Capability
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Repos list */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm font-display">Target Repositories</h3>
                    <p className="text-xs text-slate-400 font-mono">Select a target for a manual metadata scan.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search every repository on GitHub..."
                      value={repoSearchQuery}
                      onChange={(e) => setRepoSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          fetchRepos(repoSearchQuery);
                        }
                      }}
                      className="bg-white border border-slate-200 text-slate-800 placeholder-slate-400 px-3 py-1.5 text-xs rounded-xl focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none w-56 transition-shadow"
                    />
                    <button
                      onClick={() => fetchRepos(repoSearchQuery)}
                      className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                      title="Search GitHub"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/50 divide-y divide-slate-100 relative">
                  {loading ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-rose-500" />
                      <span>Searching GitHub repository index...</span>
                    </div>
                  ) : repos.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-mono">No target repositories found.</div>
                  ) : (
                    repos.map((repo: any) => (
                      <div key={repo.id || repo.full_name} className="flex items-center justify-between p-3.5 hover:bg-white transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span>{repo.full_name || repo.name}</span>
                            {repo.isOwn ? (
                              <span className="bg-sky-50 text-sky-600 text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold border border-sky-100">Yours</span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-md font-mono border border-amber-100 flex items-center gap-0.5">
                                ⭐ {repo.stargazers_count ? repo.stargazers_count.toLocaleString() : "10k+"}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">{repo.private ? "Private" : "Public Repository"}</p>
                        </div>
                        <button 
                          onClick={() => handleScan(repo.full_name)}
                          disabled={loading}
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          Scan Repo
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Autonomous sync status */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm font-display">Autonomous Synchronization</h3>
                  <p className="text-xs text-slate-400 font-mono">Mass-scale processing of distributed engineering codebases.</p>
                </div>
                
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-xs text-slate-700 font-mono uppercase tracking-wider">
                        {autoSyncState?.isActuallyRunning ? "SYNC ACTIVE" : autoSyncState?.isFinished ? "SYNC COMPLETE" : "SYNC IDLE"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {autoSyncState?.statusMessage || "Ready to engage indexing."}
                      </p>
                    </div>
                    <button 
                      onClick={handleStartAutoSync}
                      disabled={autoSyncState?.isActuallyRunning}
                      className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {autoSyncState?.isActuallyRunning ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                      Engage Auto-Sync
                    </button>
                  </div>
                  
                  {autoSyncState?.rateLimitPauseUntil && (
                    <div className="p-3 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-xs flex items-start gap-3">
                      <div className="mt-0.5">
                        <Clock size={14} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="font-bold">GitHub Rate Limit Encountered</p>
                        <p className="mt-1 text-[11px] text-amber-600">
                          Resuming operations at {new Date(autoSyncState.rateLimitPauseUntil).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {autoSyncState && (autoSyncState.processedRepos?.length > 0 || autoSyncState.processedFilesInCurrentRepo?.length > 0) && (
                    <div className="space-y-3 text-xs font-mono text-slate-600 bg-white p-4 border border-slate-100 rounded-xl shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total Scanned:</span>
                        <span className="font-bold text-slate-800">{autoSyncState.processedRepos?.length || 0} Repositories</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Current Focus:</span>
                        <span className="font-bold text-sky-600 truncate max-w-[200px]">{autoSyncState.currentRepo || "None"}</span>
                      </div>
                      <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">File Matrix Parsed:</span>
                          <span className="font-bold text-slate-700">{autoSyncState.processedFilesInCurrentRepo?.length || 0} / {autoSyncState.totalFilesInCurrentRepo || "?"}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 overflow-hidden rounded-full">
                          <div 
                            className="bg-sky-500 h-1.5 transition-all duration-300 rounded-full"
                            style={{ width: `${Math.min(100, ((autoSyncState.processedFilesInCurrentRepo?.length || 0) / Math.max(1, autoSyncState.totalFilesInCurrentRepo || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Export */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm font-display">Data Export</h3>
                  <p className="text-xs text-slate-400 font-mono">Download the parsed engineering catalog as highly structured markdown.</p>
                </div>
                
                <button 
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
                >
                  <FileDown size={14} />
                  Download ENCYCLOPEDIA.md
                </button>
              </div>

              {/* GitHub Publish */}
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm font-display">Publish Back to GitHub</h3>
                  <p className="text-xs text-slate-400 font-mono">Compile and push the structural encyclopedia payload to a new target repo.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={repoName}
                    onChange={e => setRepoName(e.target.value)}
                    placeholder="repository-name"
                    className="flex-1 bg-white border border-slate-200 text-slate-800 px-4 py-2.5 text-xs rounded-xl focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  />
                  <button 
                    onClick={handlePublish}
                    disabled={publishing}
                    className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {publishing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
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
