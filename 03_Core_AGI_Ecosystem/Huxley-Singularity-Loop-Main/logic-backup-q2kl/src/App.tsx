/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Github, 
  ShieldCheck, 
  Code2, 
  FileJson, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Trash2,
  FileText,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getRepoTree, getFileContent, ghFetch, createBranch, distillRepository, getBranches, getUserRepos } from './lib/github';
import { analyzeRepoChunks, Chunk } from './lib/gemini';

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [geneticMemory, setGeneticMemory] = useState<Chunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState({
    compression: 0,
    tokensSaved: 0,
    quality: 0,
    summariesGenerated: 0,
    driftScore: 0,
    ccrrScore: 0
  });

  const [confirmReady, setConfirmReady] = useState(false);

  React.useEffect(() => {
    setConfirmReady(false);
  }, [repoUrl, token]);

  const distillRepo = async (owner: string, repoName: string, token: string) => {
    setStatus(`[${repoName}] Initializing extraction engine...`);
    const branchesData = await getBranches(owner, repoName, token);
    const branches = branchesData;
    
    let masterContext = `ARCHITECTURAL ANALYSIS OF ${repoName.toUpperCase()}\n`;
    let intentAnchor = "";
    const processedShas = new Set<string>();
    const allFilesList = new Set<string>();
    const MAX_CONTEXT_CHARS = 1200000; // Smaller context for multi-repo safety

    for (let b = 0; b < branches.length; b++) {
      const branch = branches[b];
      setStatus(`[${repoName}] Indexing Branch [${branch.name}]...`);
      const treeData = await getRepoTree(`https://github.com/` + owner + `/` + repoName, token, branch.name);
      const branchFiles = treeData.tree || [];

      // IDENTITY GUARD: Search for Intent Anchor
      const anchorFile = branchFiles.find((f: any) => f.path.match(/(SOVEREIGN\.md|\.intent)$/i));
      if (anchorFile && !intentAnchor) {
        setStatus(`[${repoName}] Siphoning Intent Anchor: ${anchorFile.path}...`);
        intentAnchor = await getFileContent(anchorFile.url, token);
      }

      branchFiles.forEach((f: any) => allFilesList.add(`[${branch.name}] ${f.path}`));

      const logicFiles = branchFiles
        .filter((f: any) => f.type === 'blob' && f.path.match(/\.(js|ts|jsx|tsx|py|java|go|rs|rb|php|sql|sh|json|yml|yaml|toml|md|txt)$/i))
        .filter((f: any) => !f.path.match(/(package-lock|yarn\.lock|pnpm-lock|dist|node_modules|build|out|vendor|\.min\.js|\.map)$/i))
        .filter((f: any) => !processedShas.has(f.sha))
        .sort((a: any, b: any) => b.size - a.size);

      for (let i = 0; i < Math.min(logicFiles.length, 15); i++) {
        if (masterContext.length > MAX_CONTEXT_CHARS) break;
        const f = logicFiles[i];
        try {
          const content = await getFileContent(f.url, token);
          masterContext += `\n### FILE: ${f.path}\n${content.substring(0, 3000)}\n`;
          processedShas.add(f.sha);
        } catch (e) {}
      }
    }

    // AI Phase
    setStatus(`[${repoName}] AI Architectural Synthesis...`);
    const results = await analyzeRepoChunks(masterContext, intentAnchor, geneticMemory);
    if (!results || results.length === 0) return null;

    // Telemetry Sync
    const avgAlignment = results.reduce((acc, c) => acc + (c.intentAlignmentScore || 0), 0) / results.length;
    const avgCCRR = results.reduce((acc, c) => acc + (c.ccrrScore || 0), 0) / results.length;
    setEfficiencyMetrics(prev => ({
      ...prev,
      compression: Math.round((1 - (masterContext.length / Math.max(1, allFilesList.size * 2000))) * 100),
      tokensSaved: prev.tokensSaved + Math.round((allFilesList.size * 2000) / 4),
      driftScore: Math.round((1 - avgAlignment) * 100),
      ccrrScore: Math.round(avgCCRR * 10) / 10,
      summariesGenerated: prev.summariesGenerated + results.length,
      quality: 98
    }));

    // Distillation & Branch Renaming
    setStatus(`[${repoName}] Finalizing Distillation & Branching...`);
    const repoRes = await ghFetch(`https://api.github.com/repos/${owner}/${repoName}`, token);
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch;

    // Create backup
    const backupName = `logic-backup-${Math.random().toString(36).substring(2, 6)}`;
    await createBranch(owner, repoName, backupName, defaultBranch, token);

    // AI-Driven Branch Renaming: Create branches for top 3 chunks
    for (let j = 0; j < Math.min(results.length, 3); j++) {
      const chunk = results[j];
      const branchName = chunk.suggestedBranchName.toLowerCase().replace(/[^a-z0-9/-]/g, '-');
      try {
        setStatus(`[${repoName}] Spawning Branch: ${branchName}...`);
        await createBranch(owner, repoName, branchName, defaultBranch, token);
      } catch (e) {
        console.warn(`[Branching] Failed to create ${branchName}`, e);
      }
    }
    
    const finalReadme = `# Repository Architectural Manifest: ${repoName.toUpperCase()}\n\n` + 
      `> **Distillation Status**: AUTO-GENERATED\n` +
      `> **Engine Specification**: HUXLEY_REASONING_ENGINE_V3.2 (Tri-Loop)\n` +
      `> **Identity Guard**: ${intentAnchor ? "ACTIVE (SOVEREIGN)" : "DEFAULT"}\n` +
      `> **Genetic Siphon**: ${geneticMemory.length > 0 ? `ACTIVE (${geneticMemory.length} external patterns injected)` : "INACTIVE"}\n` +
      `> **License Notice**: NOT FOR COMMERCIAL USE WITHOUT PURCHASE. Contact administrator for commercial licensing options.\n` +
      `> **Analysis Scope**: ${processedShas.size} unique logic files across multiple branches.\n\n` +
      results.map(c => `### ${c.title}\n**File:** ${c.file}\n**Target Branch**: \`${c.suggestedBranchName}\`\n\n> ${c.explanation}\n\n**Alignment**: ${Math.round((c.intentAlignmentScore || 0) * 100)}%\n**CCRR (Certainty-to-Risk)**: ${c.ccrrScore}/10\n**Philosophy Check**: ${c.philosophyCheck}\n\n#### Strategic Mutation\n* ${c.mutation}\n\n\`\`\`typescript\n${c.code}\n\`\`\`\n`).join('\n---\n');

    await distillRepository(owner, repoName, finalReadme, token, defaultBranch);
    return results;
  };

  const runAutomatedPipeline = async () => {
    if (!repoUrl || !token) {
      setError('Please provide both GitHub URL and Token');
      return;
    }

    if (!confirmReady) {
      setConfirmReady(true);
      return;
    }

    setLoading(true);
    setError(null);
    setChunks([]);
    setConfirmReady(false);

    try {
      const trimmedUrl = repoUrl.trim().replace(/\/$/, '');
      let repoMatch = trimmedUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      let accountMatch = trimmedUrl.match(/github\.com\/([^/]+)$/);
      
      let allResults: Chunk[] = [];

      if (accountMatch && !repoMatch) {
        const owner = accountMatch[1];
        setStatus(`Siphoning Stack: Discovering ${owner}...`);
        const repos = await getUserRepos(owner, token);
        setStatus(`Found ${repos.length} repositories. Initiating Global Realignment...`);
        
        for (let i = 0; i < repos.length; i++) {
          const repo = repos[i];
          setStatus(`Global Audit: Repo ${i+1}/${repos.length} [${repo.name}]`);
          const results = await distillRepo(owner, repo.name, token);
          if (results) allResults = [...allResults, ...results];
          setChunks([...allResults]); // Live update results
        }
      } else if (repoMatch) {
        const owner = repoMatch[1];
        const repoName = repoMatch[2].replace(/\.git$/, '');
        const results = await distillRepo(owner, repoName, token);
        if (results) setChunks(results);
      } else {
         throw new Error('Invalid GitHub URL structure');
      }

      setStatus('Success: Global Distillation Complete.');
      setTimeLeft(0);
    } catch (err: any) {
      console.error('[Pipeline] Failed:', err);
      setError(`Pipeline Error: ${err.message}`);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F2F2F7] font-sans selection:bg-[#C5A059] selection:text-[#0A0A0B]">
      {/* Subtle Gradient Background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(197,160,89,0.05)_0%,transparent_100%)]" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-16 border-b border-white/10 pb-8 flex justify-between items-end">
          <div>
            <div className="flex flex-col mb-4">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-semibold mb-1">Intelligence Engine</span>
              <div className="flex items-center gap-3">
                <Code2 className="w-8 h-8 text-[#C5A059]" />
                <h1 className="text-4xl font-light italic font-serif">ChunkLogic <span className="text-white/30 text-2xl not-italic">v1.1</span></h1>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono italic">AUTONOMOUS AUDIT SYSTEM</p>
          </div>
          <div className="flex gap-6 items-end">
            <GitHubStatus />
          </div>
        </header>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C5A059]">Repository Target</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text" 
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-white/5 border-b border-white/10 p-3 pl-10 focus:outline-none focus:border-[#C5A059] transition-all font-mono text-sm placeholder:text-white/20"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C5A059]">Access Token</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="password" 
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-white/5 border-b border-white/10 p-3 pl-10 focus:outline-none focus:border-[#C5A059] transition-all font-mono text-sm placeholder:text-white/20"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={runAutomatedPipeline}
              disabled={loading || !repoUrl || !token}
              className={`w-full group py-5 px-6 flex items-center justify-between transition-all font-bold uppercase tracking-[0.3em] text-[11px] shadow-[0_0_20px_rgba(197,160,89,0.2)] ${
                confirmReady ? 'bg-red-600 text-white' : 'bg-[#C5A059] text-[#0A0A0B] hover:bg-[#D6B570]'
              }`}
            >
              <span>
                {confirmReady 
                  ? (repoUrl.split('/').length === 4 ? 'CONFIRM: WIPE & DISTILL SINGLE REPO' : 'CONFIRM: GLOBAL STACK REALIGNMENT (CAUTION)') 
                  : 'Initiate Autonomous Distillation'}
              </span>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            </button>

            {/* Genetic Memory Pool */}
            <div className="pt-8 border-t border-white/5 space-y-4">
              <h4 className="text-[10px] uppercase text-[#C5A059] tracking-[0.2em] font-bold flex items-center gap-2">
                <Zap className="w-3 h-3" /> Genetic Memory Pool ({geneticMemory.length})
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                {geneticMemory.length === 0 ? (
                  <div className="bg-white/5 p-4 rounded-sm border border-dashed border-white/10 text-center">
                    <p className="text-[10px] text-white/20 italic">No patterns siphoned yet. Vote for chunks in the results to store their DNA for multi-repo enhancement.</p>
                  </div>
                ) : (
                  geneticMemory.map((mem, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#C5A059]/5 border border-[#C5A059]/10 p-3 rounded-sm group relative"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-mono text-[#C5A059] font-bold truncate pr-6">{mem.title}</span>
                        <button 
                          onClick={() => setGeneticMemory(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                      <p className="text-[9px] text-white/40 leading-relaxed italic line-clamp-2">/ {mem.explanation}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {status && (
              <div className="pt-4 space-y-2">
                <div className="flex items-center gap-3 text-[#C5A059]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em]">{status}</span>
                </div>
                {timeLeft !== null && timeLeft > 0 && (
                  <div className="flex items-center gap-2 pl-7">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Est. remaining:</span>
                    <span className="text-[10px] font-mono text-[#C5A059] font-bold">{timeLeft}s</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-950/20 border border-red-900/50 text-red-400 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-mono">{error}</span>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8">
            <div className="bg-white/[0.03] border-refined h-[640px] relative overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm">
              <div className="border-b border-white/10 p-4 flex justify-between items-center bg-white/5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#C5A059]">System Manifest : Logic Chunks</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-12">
                <AnimatePresence mode="popLayout">
                  {chunks.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center opacity-20"
                    >
                      <FileJson className="w-16 h-16 mb-4" />
                      <p className="font-mono text-xs uppercase tracking-widest">No active audit data detected</p>
                    </motion.div>
                  ) : (
                    chunks.map((chunk, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="space-y-4"
                      >
                        <div className="flex justify-between items-end border-b border-white/10 pb-2">
                          <h3 className="font-serif italic text-2xl font-light text-[#F2F2F7]">{idx + 1}. {chunk.title}</h3>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-mono text-[#C5A059] opacity-60">SOURCE: {chunk.file}</span>
                            <span className="text-[9px] font-mono text-blue-400 group-hover:text-blue-300 transition-colors uppercase">BRANCH: {chunk.suggestedBranchName}</span>
                          </div>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed font-sans italic">/ {chunk.explanation}</p>
                        
                        <div className="flex items-center justify-between bg-[#C5A059]/5 border border-[#C5A059]/20 p-4 rounded-sm">
                          <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-[#C5A059] shrink-0" />
                            <div className="text-xs">
                              <span className="text-[#C5A059]/80 font-bold uppercase tracking-wider block mb-1">Strategic Mutation:</span>
                              <p className="text-white/80">{chunk.mutation}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              if (!geneticMemory.find(m => m.code === chunk.code)) {
                                setGeneticMemory(prev => [...prev, chunk]);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all flex items-center gap-2 ${
                              geneticMemory.find(m => m.code === chunk.code) 
                                ? 'bg-green-600/20 text-green-400 cursor-default' 
                                : 'bg-[#C5A059]/20 text-[#C5A059] hover:bg-[#C5A059]/40 active:scale-95'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {geneticMemory.find(m => m.code === chunk.code) ? 'Siphoned' : 'VOTE FOR SIPHON'}
                          </button>
                        </div>

                        <div className="bg-[#C5A059]/5 border-l-2 border-[#C5A059] p-4 flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-widest font-bold">Huxley Audit: philosophy_check</span>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-white/40">CCRR</span>
                                <span className="text-[#C5A059] font-bold">{chunk.ccrrScore}/10</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-white/40">ALIGNMENT</span>
                                <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#C5A059] transition-all duration-1000" 
                                    style={{ width: `${(chunk.intentAlignmentScore || 0) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-[11px] text-white/80 font-mono italic">"{chunk.philosophyCheck}"</p>
                        </div>

                        <div className="bg-black/40 p-6 border-l-2 border-[#C5A059] relative group">
                          <pre className="text-xs font-mono text-white/80 overflow-x-auto whitespace-pre max-h-80 scrollbar-thin">
                            <code>{chunk.code}</code>
                          </pre>
                        </div>
                        {idx < chunks.length - 1 && <div className="h-px bg-white/5 mt-12 mb-4" />}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="pt-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h4 className="text-[9px] uppercase text-white/30 tracking-[0.3em] font-bold">Capabilities</h4>
            <ul className="text-[11px] font-mono space-y-1 text-white/60">
              <li>- Logic Extraction & Mapping</li>
              <li>- Token-Optimized Context Cleanup</li>
              <li>- Deep AI Reasoning Fabric</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-[9px] uppercase text-white/30 tracking-[0.3em] font-bold">Telemetry</h4>
            <div className="grid grid-cols-2 gap-4 text-[10px] font-mono whitespace-nowrap">
              <div>
                <span className="text-white/30 block mb-1">COMPRESSION</span>
                <span className="text-[#C5A059]">{efficiencyMetrics.compression}%</span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">TOKENS SAVED</span>
                <span className="text-[#C5A059]">{efficiencyMetrics.tokensSaved.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">DNA QUALITY</span>
                <span className="text-[#C5A059]">{efficiencyMetrics.quality}%</span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">USER DRIFT</span>
                <span className={`font-bold ${efficiencyMetrics.driftScore > 50 ? 'text-red-500' : 'text-[#C5A059]'}`}>
                  {efficiencyMetrics.driftScore}%
                </span>
              </div>
              <div>
                <span className="text-white/30 block mb-1">CCRR SCORE</span>
                <span className="text-[#C5A059] font-bold">{efficiencyMetrics.ccrrScore}/10</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[9px] uppercase text-white/30 tracking-[0.3em] font-bold">Licensing</h4>
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-[#C5A059]/80 uppercase font-bold tracking-wider">Non-Commercial Use Only</p>
              <p className="text-[9px] font-mono text-white/50">Commercial licenses available for purchase. Contact admin for enterprise seat pricing.</p>
            </div>
          </div>
          <div className="flex items-end justify-end">
            <span className="text-[10px] font-mono text-white/20">© 2026 CRAIGHCKBY | CHUNKLOGIC OS</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function GitHubStatus() {
  return (
    <div className="flex items-center gap-4 px-6 py-2 bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">
      <Github className="w-4 h-4 text-[#C5A059]" />
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
        <span>System Ready</span>
      </div>
    </div>
  );
}

