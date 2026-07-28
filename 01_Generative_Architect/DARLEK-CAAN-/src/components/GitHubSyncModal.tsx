import { useState, useEffect } from "react";
import { X, Search, RefreshCw, Github, AlertCircle, CheckCircle2, Upload, Database, Clock, FileDown, ShieldAlert, Cpu } from "lucide-react";

export default function GitHubSyncModal({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [repoName, setRepoName] = useState("encyclopedia-of-engineering");
  const [autoSyncState, setAutoSyncState] = useState<any>(null);

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
      if (data.hasToken) {
        setStatus("success");
        fetchRepos();
      } else {
        setStatus("idle");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/github/repos");
      const data = await res.json();
      setRepos(data.repos || []);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono terminal-scanline">
      <div className="bg-[#050000] rounded-none w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(220,38,38,0.2)] border border-red-900/50">
        <div className="flex items-center justify-between p-4 border-b border-red-900/50 bg-black">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-red-900/20 flex items-center justify-center text-red-500 border border-red-900/50">
              <Github size={18} />
            </div>
            <div>
              <h2 className="font-bold text-red-500 uppercase tracking-widest text-lg">GitHub Link</h2>
              <p className="text-[10px] text-red-700 uppercase tracking-widest">Connect Source Repositories</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-red-500 hover:bg-red-900/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {status !== "success" ? (
            <div className="space-y-4">
              <div className="bg-[#0a0000] border border-red-900/50 p-4">
                <h3 className="font-bold text-red-500 mb-2 uppercase tracking-widest">Authentication Required</h3>
                <p className="text-xs text-red-700 leading-relaxed">
                  Enter a GitHub Personal Access Token to sync repositories. This token requires <code>repo</code> scope to read your repositories.
                </p>
              </div>
              
              <div className="space-y-2">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx..."
                  className="w-full border border-red-900/50 bg-[#1a0000] text-red-500 placeholder-red-900/50 px-4 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none rounded-none"
                />
                <button
                  onClick={handleSaveToken}
                  disabled={!token || status === "checking"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-black font-bold uppercase tracking-widest hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {status === "checking" ? <RefreshCw className="animate-spin" size={16} /> : "Authenticate"}
                </button>
              </div>
              
              {status === "error" && (
                <div className="flex items-center gap-2 text-red-500 text-xs bg-red-900/10 p-3 border border-red-900/50">
                  <AlertCircle size={14} />
                  <span>Invalid token or connection error.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest bg-red-900/10 p-3 border border-red-900/50">
                <CheckCircle2 size={16} className="text-red-600" />
                <span>Authenticated Successfully</span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-red-500 uppercase tracking-widest mb-1">Target Selection</h3>
                  <p className="text-[10px] text-red-700 uppercase tracking-widest">Select repository for manual scan.</p>
                </div>
                
                <div className="max-h-48 overflow-y-auto border border-red-900/50 bg-[#0a0000] divide-y divide-red-900/30">
                  {repos.length === 0 ? (
                    <div className="p-4 text-center text-xs text-red-700 uppercase tracking-widest">No targets found.</div>
                  ) : (
                    repos.map((repo: any) => (
                      <div key={repo.id} className="flex items-center justify-between p-3 hover:bg-red-900/20 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-red-400">{repo.name}</p>
                          <p className="text-[10px] text-red-700 uppercase tracking-widest mt-1">{repo.private ? "Private" : "Public"}</p>
                        </div>
                        <button 
                          onClick={() => handleScan(repo.full_name)}
                          disabled={loading}
                          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500 border border-red-900 hover:bg-red-900/30 transition-colors"
                        >
                          Initiate Scan
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-red-900/50">
                <div>
                  <h3 className="font-bold text-red-500 uppercase tracking-widest mb-1">Autonomous Sync</h3>
                  <p className="text-[10px] text-red-700 uppercase tracking-widest">Mass scale repository scanning.</p>
                </div>
                
                <div className="p-4 bg-[#0a0000] border border-red-900/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="font-bold text-xs text-red-400 uppercase tracking-widest">
                        {autoSyncState?.isActuallyRunning ? "SYNC ENGAGED" : autoSyncState?.isFinished ? "SYNC COMPLETE" : "SYNC IDLE"}
                      </p>
                      <p className="text-[10px] text-red-700 uppercase tracking-widest mt-1">
                        {autoSyncState?.statusMessage || "Awaiting command"}
                      </p>
                    </div>
                    <button 
                      onClick={handleStartAutoSync}
                      disabled={autoSyncState?.isActuallyRunning}
                      className="px-4 py-2 bg-red-600 text-black font-bold text-xs uppercase tracking-widest hover:bg-red-500 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {autoSyncState?.isActuallyRunning ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                      Engage Auto-Sync
                    </button>
                  </div>
                  
                  {autoSyncState?.rateLimitPauseUntil && (
                    <div className="mb-4 p-3 bg-red-900/20 text-red-500 border border-red-900/50 text-xs flex items-start gap-3">
                      <div className="mt-0.5">
                        <Clock size={14} className="text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-widest">Rate Limit Reached</p>
                        <p className="mt-1 text-[10px] text-red-700">
                          Resuming at {new Date(autoSyncState.rateLimitPauseUntil).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {autoSyncState && (autoSyncState.processedRepos?.length > 0 || autoSyncState.processedFilesInCurrentRepo?.length > 0) && (
                    <div className="space-y-3 mt-4 text-[10px] font-mono text-red-500 uppercase tracking-widest bg-[#1a0000] p-3 border border-red-900/50">
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">Repos scanned:</span>
                        <span className="font-bold">{autoSyncState.processedRepos?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-700">Current target:</span>
                        <span className="font-bold text-red-400">{autoSyncState.currentRepo || "None"}</span>
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-red-900/30">
                        <div className="flex justify-between items-center">
                          <span className="text-red-700">Files parsed:</span>
                          <span>{autoSyncState.processedFilesInCurrentRepo?.length || 0} / {autoSyncState.totalFilesInCurrentRepo || "?"}</span>
                        </div>
                        <div className="w-full bg-[#0a0000] h-1.5 overflow-hidden border border-red-900/30">
                          <div 
                            className="bg-red-600 h-1.5 transition-all duration-300"
                            style={{ width: `${Math.min(100, ((autoSyncState.processedFilesInCurrentRepo?.length || 0) / Math.max(1, autoSyncState.totalFilesInCurrentRepo || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-red-900/50">
                <div>
                  <h3 className="font-bold text-red-500 uppercase tracking-widest mb-1">Data Export</h3>
                  <p className="text-[10px] text-red-700 uppercase tracking-widest">Extract structural payload.</p>
                </div>
                
                <button 
                  onClick={handleDownloadMarkdown}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  <FileDown size={14} />
                  Download Encyclopedia
                </button>
              </div>

              <div className="space-y-4 pt-6 border-t border-red-900/50">
                <div>
                  <h3 className="font-bold text-red-500 uppercase tracking-widest mb-1">GitHub Publish</h3>
                  <p className="text-[10px] text-red-700 uppercase tracking-widest">Push payload to new repository.</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="text" 
                    value={repoName}
                    onChange={e => setRepoName(e.target.value)}
                    placeholder="REPOSITORY NAME"
                    className="flex-1 bg-[#1a0000] border border-red-900/50 text-red-500 px-4 py-2 text-xs uppercase tracking-widest focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                  <button 
                    onClick={handlePublish}
                    disabled={publishing}
                    className="px-6 py-2 bg-red-600 text-black font-bold uppercase tracking-widest text-xs hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {publishing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                    Publish
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
