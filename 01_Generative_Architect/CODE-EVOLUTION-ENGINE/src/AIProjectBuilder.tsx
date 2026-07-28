import React, { useState, useEffect } from "react";
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  GitBranch, 
  Upload, 
  Play, 
  RefreshCw,
  FolderOpen,
  ArrowUpRight,
  Database,
  Lock,
  Globe,
  Plus,
  Trash,
  CheckCircle,
  FileCode,
  Sparkles,
  Layers,
  Terminal,
  Code,
  X,
  AlertCircle
} from "lucide-react";
import JSZip from "jszip";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  preview?: string;
}

export function AIProjectBuilder() {
  const [projectTree, setProjectTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [importedFiles, setImportedFiles] = useState<{ name: string; content: string }[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({"": true});
  
  // Git operations state
  const [gitOutput, setGitOutput] = useState("");
  const [gitLoading, setGitLoading] = useState(false);
  const [patToken, setPatToken] = useState("");
  const [remoteUrl, setRemoteUrl] = useState("https://github.com/craighckby-stack/craighckby-stack.git");
  const [commitMessage, setCommitMessage] = useState("AI Project Genesis Scaffolding & System Scrape");
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Execution state
  const [runningScript, setRunningScript] = useState(false);
  const [scriptOutput, setScriptOutput] = useState("");

  // GitHub Import state
  const [importRepoUrl, setImportRepoUrl] = useState("https://github.com/craighckby-stack/craighckby-stack.git");
  const [importPatToken, setImportPatToken] = useState("");
  const [organizeImport, setOrganizeImport] = useState(true);
  const [importingGithub, setImportingGithub] = useState(false);

  // Invoke AGI Core execution via backend runner
  const handleAwakenAGI = async () => {
    setRunningScript(true);
    setScriptOutput("");
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/project/run", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setScriptOutput(data.output);
        setSuccessMsg("Huxley AGI Core awakened successfully! execution trace collected.");
      } else {
        setErrorMsg(data.error || "Huxley AGI Core execution crashed.");
        if (data.stderr) setScriptOutput(data.stderr);
      }
    } catch (e: any) {
      setErrorMsg("Failed to invoke Huxley AGI Node: " + e.message);
    } finally {
      setRunningScript(false);
    }
  };

  // Import directly from a GitHub repository
  const handleImportFromGithub = async () => {
    setImportingGithub(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/project/import-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: importRepoUrl,
          token: importPatToken,
          organize: organizeImport
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Success! Successfully cloned and imported ${data.count} files from ${importRepoUrl}. All segments classified and integrated.`);
        await fetchTree();
      } else {
        setErrorMsg(data.error || "GitHub remote import failed.");
      }
    } catch (e: any) {
      setErrorMsg("Failed to connect to import service: " + e.message);
    } finally {
      setImportingGithub(false);
    }
  };

  // Load target tree on mount
  const fetchTree = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/project/tree");
      const data = await res.json();
      if (data.exists) {
        setProjectTree(data.tree);
      } else {
        setProjectTree(null);
      }
    } catch (e: any) {
      setErrorMsg("Failed to load project folder tree: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  // Handle Drag & Drop / File selector ZIP import
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setMigrating(true);
    setSuccessMsg("");
    setErrorMsg("");
    const file = files[0];

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const extracted: { name: string; content: string }[] = [];

      for (const [filename, zipEntry] of Object.entries(loadedZip.files)) {
        if (!zipEntry.dir) {
          // Extract only python, js, ts, md, json text files as illustrated in diagrams
          const isText = /\.(py|js|ts|tsx|jsx|json|md|txt|sh)$/i.test(filename);
          if (isText) {
            const content = await zipEntry.async("string");
            // get only standard file name
            const basename = filename.split("/").pop() || filename;
            extracted.push({ name: basename, content });
          }
        }
      }

      setImportedFiles(prev => [...prev, ...extracted]);
      setSuccessMsg(`Extracted ${extracted.length} valid code segments from ${file.name}. Click 'Generate & Classify Scaffolding' to place them.`);
    } catch (e: any) {
      setErrorMsg("Failed to parse and read ZIP repository: " + e.message);
    } finally {
      setMigrating(false);
    }
  };

  // Trigger building workspace
  const handleBuildScaffold = async () => {
    setMigrating(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/project/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: importedFiles })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Success! AI Project scaffold created. ${data.migratedCount} files classified and structured successfully.`);
        setImportedFiles([]);
        await fetchTree();
      } else {
        setErrorMsg(data.error || "Scaffold process failed.");
      }
    } catch (e: any) {
      setErrorMsg("Scaffold API error: " + e.message);
    } finally {
      setMigrating(false);
    }
  };

  // Trigger Git actions
  const runGitAction = async (action: "init" | "commit" | "push") => {
    setGitLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/project/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          commitMessage,
          token: patToken,
          remoteUrl
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGitOutput(data.output);
        setSuccessMsg(`Git operation '${action}' completed successfully.`);
      } else {
        setErrorMsg(data.error || "Git operation failed.");
        if (data.stderr) setGitOutput(data.stderr);
      }
    } catch (e: any) {
      setErrorMsg("Git API interaction failure: " + e.message);
    } finally {
      setGitLoading(false);
    }
  };

  const toggleNode = (nodePath: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodePath]: !prev[nodePath]
    }));
  };

  // Recursive renderer for directory tree
  const renderTreeNode = (node: FileNode) => {
    const isDir = node.type === "directory";
    const isExpanded = expandedNodes[node.path];

    return (
      <div key={node.path} className="ml-4 font-mono text-[12px]">
        <div 
          onClick={() => {
            if (isDir) {
              toggleNode(node.path);
            } else {
              setSelectedFile(node);
            }
          }}
          className={`flex items-center space-x-1.5 py-1 px-2 rounded cursor-pointer transition-colors ${
            selectedFile?.path === node.path 
              ? "bg-[#10b981]/15 text-[#10b981]" 
              : "text-slate-300 hover:bg-[#12151b]"
          }`}
        >
          {isDir ? (
            <>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
              <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
            </>
          ) : (
            <>
              <span className="w-3.5 h-3.5 shrink-0" />
              <File className="w-4 h-4 text-sky-400 shrink-0" />
            </>
          )}
          <span className="truncate">{node.name}</span>
          {!isDir && node.size && (
            <span className="text-[10px] text-slate-600">({(node.size / 1024).toFixed(1)} KB)</span>
          )}
        </div>

        {isDir && isExpanded && node.children && (
          <div className="border-l border-[#1a1f29] ml-1.5 pl-1">
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#0c0e12] border border-[#16191f] rounded-2xl overflow-hidden shadow-[0_4px_35px_rgba(0,0,0,0.5)]">
      {/* Header banner matching full builder execution visual blueprint */}
      <div className="bg-gradient-to-r from-[#0c0e12] via-[#0f1d19] to-[#0c0e12] border-b border-[#16191f] px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Layers className="w-6 h-6 text-[#10b981]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-100 tracking-wide text-base uppercase flex items-center gap-1.5">
              AI Project Genesis Builder
              <span className="text-[10px] bg-emerald-500/10 text-[#10b981] border border-emerald-500/20 px-1.5 py-0.5 rounded-full lowercase font-mono">v7.6</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-mono leading-relaxed uppercase">
              Environment Scaffolding, Classification Scraper, and Automated Git Deployment Pipeline
            </p>
          </div>
        </div>

        {/* Global Action Status */}
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={fetchTree}
            disabled={loading}
            className="p-1.5 bg-[#12151b] hover:bg-[#161a22] border border-[#1b202a] hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title="Reload Project Tree"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#10b981]" : ""}`} />
          </button>
          <div className="flex items-center space-x-1.5 bg-[#12151b] border border-[#1b202a] rounded-full px-3 py-1 text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${projectTree ? "bg-emerald-500" : "bg-yellow-500 animate-pulse"}`}></span>
            <span className="text-slate-400 font-mono uppercase">
              {projectTree ? "ACTIVE SYSTEM DETECTED" : "UNINITIALIZED SCALFOLD"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#16191f]">
        
        {/* PHASE 1 & 3: SOURCE CODES IMPORT & PIPELINE MANAGER */}
        <div className="lg:col-span-4 p-5 space-y-5">
          <div className="space-y-1">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <span className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] text-[9px] font-bold flex items-center justify-center mr-1.5">1</span>
              Local Code Scraping & Import
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Drag-and-drop or select a compressed (.zip) archive containing your system files. Our intelligent engine will scrape, read, and extract all python modules, scripts, and documentation segments.
            </p>
          </div>

          {/* Drag & Drop Area */}
          <div className="border border-dashed border-[#1b202a] hover:border-emerald-500/40 bg-[#0e1116]/40 hover:bg-[#0e1116]/80 rounded-xl p-5 text-center relative transition-all group">
            <input 
              type="file" 
              accept=".zip"
              onChange={handleZipUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="space-y-2 pointer-events-none">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-[#10b981] group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-300 font-medium">Select or Drop .ZIP File</p>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Parses .py, .js, .ts, .json, .md files</p>
            </div>
          </div>

          {/* Separator */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#16191f]"></div>
            <span className="flex-shrink mx-3 text-[9px] font-mono text-slate-600 uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-[#16191f]"></div>
          </div>

          {/* GitHub Remote Clone Panel */}
          <div className="bg-[#0e1116]/60 border border-[#1b202a] rounded-xl p-4 space-y-3.5 font-mono text-[11px]">
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
              <GitBranch className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>GitHub Remote Clone</span>
            </div>
            
            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase block">Repository Remote URL</label>
                <input 
                  type="text"
                  value={importRepoUrl}
                  onChange={(e) => setImportRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repo.git"
                  className="w-full bg-[#0a0c10] border border-[#1b202a] focus:border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none transition-all text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 uppercase block">Access Token (PAT for private repos)</label>
                <input 
                  type="password"
                  value={importPatToken}
                  onChange={(e) => setImportPatToken(e.target.value)}
                  placeholder="ghp_XXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full bg-[#0a0c10] border border-[#1b202a] focus:border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder:text-slate-700 outline-none transition-all text-[11px]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-0.5">
                <input 
                  type="checkbox"
                  id="organize-check"
                  checked={organizeImport}
                  onChange={(e) => setOrganizeImport(e.target.checked)}
                  className="rounded border-[#1b202a] text-[#10b981] focus:ring-0 bg-[#0e1116] cursor-pointer"
                />
                <label htmlFor="organize-check" className="text-[10px] text-slate-400 cursor-pointer select-none">
                  Auto-classify into 6 AGI Tiers
                </label>
              </div>
            </div>

            <button
              onClick={handleImportFromGithub}
              disabled={importingGithub || !importRepoUrl.trim()}
              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-[#12151b] disabled:to-[#12151b] disabled:text-slate-600 text-slate-950 font-bold rounded-lg text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {importingGithub ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Cloning & Scaffolding...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
                  <span>Pull & Build from GitHub</span>
                </>
              )}
            </button>
          </div>

          {/* Pending Import List */}
          {importedFiles.length > 0 && (
            <div className="space-y-2 bg-[#0a0c10] border border-[#1b202a] rounded-xl p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>SCRAED FILES ({importedFiles.length})</span>
                <button 
                  onClick={() => setImportedFiles([])}
                  className="text-red-400 hover:text-red-300 transition-colors uppercase flex items-center gap-1"
                >
                  <Trash className="w-3 h-3" />
                  Purge
                </button>
              </div>
              <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 tech-scrollbar font-mono text-[11px]">
                {importedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-[#12151b] text-slate-300">
                    <span className="truncate max-w-[200px] flex items-center gap-1">
                      <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      {file.name}
                    </span>
                    <span className="text-[9px] bg-slate-800 px-1 py-0.5 rounded text-slate-400 uppercase">
                      {file.name.split(".").pop() || "code"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Scaffold button trigger */}
              <button
                onClick={handleBuildScaffold}
                disabled={migrating}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-[#12151b] disabled:text-slate-600 text-slate-950 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {migrating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scaffold & Classify...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    <span>Generate & Classify Scaffolding</span>
                  </>
                )}
              </button>
            </div>
          )}

          {importedFiles.length === 0 && (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold font-mono uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Quick Setup Diagnostic</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                If you do not have a ZIP package, click below to scaffold the full directory tree structure from your project flow. This immediately instantiates the 6 classified folder categories along with the self-aware <strong className="text-slate-300">Huxley_AGI_Core.py</strong> as a template.
              </p>
              <button
                onClick={handleBuildScaffold}
                disabled={migrating}
                className="px-3.5 py-1.5 bg-[#12151b] border border-[#1b202a] hover:border-emerald-500/40 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-[#10b981] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Build Baseline Scaffold
              </button>
            </div>
          )}
        </div>

        {/* PHASE 2: ENVIRONMENT VISUAL TREE PREVIEWER */}
        <div className="lg:col-span-4 p-5 flex flex-col space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <span className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] text-[9px] font-bold flex items-center justify-center mr-1.5">2</span>
              Interactive Target Folder Explorer
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Real-time representation of the target <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-300">ai_project/</code> environment structure on disk. Files migrated are placed in designated layers depending on classified algorithms.
            </p>
          </div>

          <div className="flex-1 bg-[#07090c] border border-[#16191f] rounded-xl p-3 min-h-[250px] lg:min-h-[350px] max-h-[420px] overflow-y-auto tech-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center py-10 space-y-2">
                <RefreshCw className="w-6 h-6 text-[#10b981] animate-spin" />
                <span className="text-xs text-slate-500 font-mono uppercase">Scanning workspace directory...</span>
              </div>
            ) : projectTree ? (
              <div className="space-y-1">
                <div className="flex items-center space-x-1 px-1 py-1 text-slate-200 font-mono text-[12px] font-bold">
                  <FolderOpen className="w-4 h-4 text-[#10b981] shrink-0" />
                  <span>ai_project/</span>
                </div>
                {projectTree.children && projectTree.children.map(child => renderTreeNode(child))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
                <Database className="w-8 h-8 text-slate-700" />
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium font-mono uppercase">Folder tree uninitialized</p>
                  <p className="text-[11px] text-slate-600">The primary ai_project/ root directory does not exist on disk yet. Trigger scaffolding above to create it.</p>
                </div>
              </div>
            )}
          </div>

          {/* Awaken AGI Node Trigger & Console Output */}
          {projectTree && (
            <div className="space-y-2">
              <button
                onClick={handleAwakenAGI}
                disabled={runningScript}
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]"
              >
                <Terminal className="w-4 h-4 shrink-0 text-slate-950" />
                {runningScript ? "Awakening AGI Core Node..." : "Awaken Huxley AGI Core Node"}
              </button>

              {scriptOutput && (
                <div className="bg-[#050608] border border-[#1b202a] rounded-xl p-3 font-mono text-[10px] text-emerald-400">
                  <div className="flex items-center justify-between text-slate-500 border-b border-slate-900 pb-1 mb-1 text-[9px] uppercase">
                    <span className="flex items-center gap-1">
                      <Code className="w-3.5 h-3.5 text-[#10b981]" />
                      Huxley Node execution logs
                    </span>
                    <button 
                      onClick={() => setScriptOutput("")}
                      className="text-slate-600 hover:text-slate-400 font-bold uppercase text-[8px]"
                    >
                      Clear
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap max-h-[110px] overflow-y-auto leading-relaxed tech-scrollbar">{scriptOutput}</pre>
                </div>
              )}
            </div>
          )}

          {/* Micro Code Preview Modal if a file is clicked */}
          {selectedFile && (
            <div className="bg-[#0e1116] border border-[#1b202a] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate max-w-[200px] flex items-center gap-1">
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />
                  {selectedFile.name}
                </span>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-600 hover:text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="bg-[#050608] border border-slate-900 rounded-lg p-2 font-mono text-[10px] text-slate-400 max-h-[120px] overflow-y-auto leading-relaxed select-all tech-scrollbar">
                {selectedFile.preview || "# [Empty or non-text preview segment]"}
              </div>
            </div>
          )}
        </div>

        {/* PHASE 4: GIT & DEPLOYMENT SYSTEM */}
        <div className="lg:col-span-4 p-5 space-y-5">
          <div className="space-y-1">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <span className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] text-[9px] font-bold flex items-center justify-center mr-1.5">3</span>
              Deployment Pipeline (Git push)
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sync and push your scaffolded project to your GitHub remote workspace. Provide a secure, temporary personal access token (PAT) to perform push operations.
            </p>
          </div>

          <div className="space-y-4">
            {/* Git Init & Local Commit actions */}
            <div className="flex gap-2">
              <button
                onClick={() => runGitAction("init")}
                disabled={gitLoading}
                className="flex-1 py-1.5 bg-[#12151b] border border-[#1b202a] hover:border-slate-700 rounded-lg text-[11px] font-mono font-semibold text-slate-300 transition-all uppercase cursor-pointer"
              >
                git init
              </button>
              <button
                onClick={() => runGitAction("commit")}
                disabled={gitLoading}
                className="flex-1 py-1.5 bg-[#12151b] border border-[#1b202a] hover:border-slate-700 rounded-lg text-[11px] font-mono font-semibold text-slate-300 transition-all uppercase cursor-pointer"
              >
                git commit
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3 font-mono text-[11px]">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" /> Commit Message
                </label>
                <input 
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full bg-[#0e1116] border border-[#1b202a] focus:border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Target Repository Remote URL
                </label>
                <input 
                  type="text"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  className="w-full bg-[#0e1116] border border-[#1b202a] focus:border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> GitHub Token (PAT)
                </label>
                <input 
                  type="password"
                  value={patToken}
                  onChange={(e) => setPatToken(e.target.value)}
                  placeholder="ghp_XXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full bg-[#0e1116] border border-[#1b202a] focus:border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder:text-slate-650 outline-none transition-all"
                />
              </div>
            </div>

            {/* Trigger push button */}
            <button
              onClick={() => runGitAction("push")}
              disabled={gitLoading || !patToken}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                gitLoading || !patToken
                  ? "bg-[#12151b] text-slate-600 border border-[#1b202a] cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer"
              }`}
            >
              {gitLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing deploy cycle...</span>
                </>
              ) : (
                <>
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Execute Git Push --Force</span>
                </>
              )}
            </button>

            {/* Git Shell Terminal Emulator output */}
            {gitOutput && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">Shell Console Trace Output</span>
                <div className="bg-[#050608] border border-slate-900 rounded-xl p-3 font-mono text-[10.5px] text-emerald-400 max-h-[140px] overflow-y-auto leading-relaxed select-text tech-scrollbar">
                  <div className="flex items-center space-x-1 text-slate-500 border-b border-slate-900 pb-1 mb-1 shrink-0">
                    <Terminal className="w-3 h-3" />
                    <span>bash-console@builder-node:~</span>
                  </div>
                  <pre className="whitespace-pre-wrap">{gitOutput}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FOOTER MESSAGES STATUS LINES */}
      {(successMsg || errorMsg) && (
        <div className="border-t border-[#16191f] bg-[#0c0e12] px-5 py-3 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center space-x-2 w-full">
            {successMsg && (
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center space-x-1.5 text-red-400">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => { setSuccessMsg(""); setErrorMsg(""); }}
            className="text-slate-600 hover:text-slate-400 ml-4 font-bold"
          >
            DISMISS
          </button>
        </div>
      )}
    </div>
  );
}
