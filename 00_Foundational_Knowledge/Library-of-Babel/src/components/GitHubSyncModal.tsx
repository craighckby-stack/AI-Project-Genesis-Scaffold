/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Github, Upload, Cloud, RefreshCw, CheckCircle2, Clock, FileDown } from "lucide-react";

interface GitHubSyncModalProps {
  onClose: () => void;
}

export default function GitHubSyncModal({ onClose }: GitHubSyncModalProps) {
  const [tokenSet, setTokenSet] = useState<boolean>(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState("");
  const [error, setError] = useState("");
  const [repoName, setRepoName] = useState("encyclopedia-of-engineering");
  const [autoSyncState, setAutoSyncState] = useState<any>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tokenSet) {
      checkAutoSyncStatus();
      interval = setInterval(checkAutoSyncStatus, 2000);
    }
    return () => clearInterval(interval);
  }, [tokenSet]);

  const checkAutoSyncStatus = async () => {
    try {
      const res = await fetch("/api/github/auto-sync/status");
      if (res.ok) {
        const data = await res.json();
        setAutoSyncState(data);
      }
    } catch (err) {}
  };

  const handleStartAutoSync = async () => {
    try {
      const res = await fetch("/api/github/auto-sync/start", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start auto sync");
      checkAutoSyncStatus();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/github/status");
      const data = await res.json();
      setTokenSet(data.connected);
      if (data.connected) {
        fetchRepos();
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/github/repos");
      if (!res.ok) throw new Error("Failed to fetch repos");
      const data = await res.json();
      setRepos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (repoFullName: string) => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/github/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ repoFullName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to scan repo");
      alert(`Scan complete. Indexed ${data.indexedCount || 0} files.`);
      // Optional: you could refresh the parent window here or rely on App.tsx to reload
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      setError(err.message);
    }
  };

  const handlePublish = async () => {
    if (!repoName) return setError("Repo name is required");
    try {
      setPublishing(true);
      setError("");
      const res = await fetch("/api/github/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ repoName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      setPublishUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center">
              <Github size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-neutral-900">GitHub Sync</h2>
              <p className="text-sm text-neutral-500">Connect to build from your repos & publish</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {!tokenSet ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <Cloud size={48} className="text-neutral-300" />
              <div>
                <h3 className="font-semibold text-neutral-900">GitHub Personal Access Token Required</h3>
                <p className="text-sm text-neutral-500 max-w-sm mt-1">
                  To automate reading your repositories, please generate a Personal Access Token on GitHub with `repo` scope and add it to the <code>GITHUB_PAT</code> environment variable in your AI Studio settings.
                </p>
              </div>
              <button 
                onClick={checkStatus}
                disabled={loading}
                className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Check Connection
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-center gap-3 text-green-800">
                  <CheckCircle2 size={20} />
                  <div>
                    <p className="font-medium text-sm">Successfully Connected</p>
                    <p className="text-xs text-green-600">Your GitHub account is linked via Personal Access Token.</p>
                  </div>
                </div>
              </div>

              {publishUrl ? (
                <div className="flex flex-col items-center py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-neutral-900">Successfully Published!</h3>
                    <p className="text-sm text-neutral-500 mt-1">Your encyclopedia is now live on GitHub.</p>
                  </div>
                  <a 
                    href={publishUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2"
                  >
                    View Repository
                  </a>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">Your Repositories</h3>
                      <p className="text-sm text-neutral-500">Select a repository to scan for engineering capabilities.</p>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                      {repos.length === 0 ? (
                        <div className="p-4 text-center text-sm text-neutral-500">No repositories found.</div>
                      ) : (
                        repos.map((repo: any) => (
                          <div key={repo.id} className="flex items-center justify-between p-3 hover:bg-neutral-50">
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{repo.name}</p>
                              <p className="text-xs text-neutral-500">{repo.private ? "Private" : "Public"}</p>
                            </div>
                            <button 
                              onClick={() => handleScan(repo.full_name)}
                              disabled={loading}
                              className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                            >
                              Scan Repo
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  
                  <div className="space-y-4 pt-6 border-t border-neutral-100">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">Auto-Build Encyclopedia</h3>
                      <p className="text-sm text-neutral-500">Scan all repositories automatically, handle rate limits, and publish when finished.</p>
                    </div>
                    
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-medium text-sm text-neutral-900">
                            {autoSyncState?.isActuallyRunning ? "Sync is running" : autoSyncState?.isFinished ? "Sync completed" : "Sync is idle"}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {autoSyncState?.statusMessage || "Ready to start"}
                          </p>
                        </div>
                        <button 
                          onClick={handleStartAutoSync}
                          disabled={autoSyncState?.isActuallyRunning}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          {autoSyncState?.isActuallyRunning ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                          Start Auto-Sync
                        </button>
                      </div>
                      
                      {autoSyncState?.rateLimitPauseUntil && (
                        <div className="mb-4 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm flex items-start gap-3">
                          <div className="mt-0.5">
                            <Clock size={16} />
                          </div>
                          <div>
                            <p className="font-semibold">GitHub API Rate Limit Reached</p>
                            <p className="mt-1">
                              The synchronization process has been paused automatically to respect GitHub's API rate limits. 
                              It will resume automatically at {new Date(autoSyncState.rateLimitPauseUntil).toLocaleTimeString()}.
                            </p>
                          </div>
                        </div>
                      )}

                      {autoSyncState && (autoSyncState.processedRepos?.length > 0 || autoSyncState.processedFilesInCurrentRepo?.length > 0) && (
                        <div className="space-y-3 mt-4 text-xs font-mono text-neutral-600 bg-white p-3 rounded-lg border border-neutral-200">
                          <div className="flex justify-between items-center">
                            <span>Repos scanned:</span>
                            <span className="font-semibold">{autoSyncState.processedRepos?.length || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Current repo:</span>
                            <span className="font-semibold">{autoSyncState.currentRepo || "None"}</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span>Files scanned in current repo:</span>
                              <span>{autoSyncState.processedFilesInCurrentRepo?.length || 0} / {autoSyncState.totalFilesInCurrentRepo || "?"}</span>
                            </div>
                            <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="bg-neutral-900 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, ((autoSyncState.processedFilesInCurrentRepo?.length || 0) / Math.max(1, autoSyncState.totalFilesInCurrentRepo || 1)) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-neutral-100">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">Generate Report</h3>
                      <p className="text-sm text-neutral-500">Download the entire encyclopedia as a comprehensive Markdown report, organized by semantic capabilities.</p>
                    </div>
                    
                    <button 
                      onClick={handleDownloadMarkdown}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors w-fit"
                    >
                      <FileDown size={16} />
                      Download Markdown Report
                    </button>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-neutral-100">
                    <div>
                      <h3 className="font-semibold text-neutral-900 mb-1">Publish Encyclopedia to GitHub</h3>
                      <p className="text-sm text-neutral-500">Create a new private repository and publish the current encyclopedia data.</p>
                    </div>
                  
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={repoName}
                      onChange={e => setRepoName(e.target.value)}
                      placeholder="Repository Name"
                      className="flex-1 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none"
                    />
                    <button 
                      onClick={handlePublish}
                      disabled={publishing}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {publishing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                      Publish
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
