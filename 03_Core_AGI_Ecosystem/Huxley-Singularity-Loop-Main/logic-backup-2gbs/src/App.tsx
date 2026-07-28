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
import { getRepoTree, getFileContent, ghFetch, createBranch, distillRepository, getBranches } from './lib/github';
import { analyzeRepoChunks, Chunk } from './lib/gemini';

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [confirmReady, setConfirmReady] = useState(false);

  React.useEffect(() => {
    setConfirmReady(false);
  }, [repoUrl, token]);

  const runAutomatedPipeline = async () => {
    console.log('[App] runAutomatedPipeline triggered');
    if (!repoUrl || !token) {
      console.error('[App] Missing URL or Token');
      setError('Please provide both GitHub URL and Token');
      return;
    }

    if (!confirmReady) {
      console.log('[App] Waiting for first confirmation click');
      setConfirmReady(true);
      return;
    }

    setLoading(true);
    setError(null);
    setChunks([]);
    setConfirmReady(false);
    setStatus('Pipeline: Initializing extraction engine...');
    console.log('[App] Starting autonomous sequence for:', repoUrl);

    try {
      const trimmedUrl = repoUrl.trim().replace(/\/$/, '');
      let match = trimmedUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      
      // Fallback for simple owner/repo strings
      if (!match && trimmedUrl.split('/').length === 2) {
        const parts = trimmedUrl.split('/');
        match = [null, parts[0], parts[1]] as any;
      }

      if (!match) throw new Error('Invalid GitHub URL structure. Use: https://github.com/owner/repo or simply owner/repo');
      
      const owner = match[1].trim();
      const repoName = match[2].trim().replace(/\.git$/, '');

      const branchesData = await getBranches(owner, repoName, token);
      const branches = branchesData;
      
      let masterContext = `ARCHITECTURAL ANALYSIS OF ${repoName.toUpperCase()}\n`;
      const processedShas = new Set<string>();
      const allFilesList = new Set<string>();
      
      // Context Budgeting: ~3.2M characters is roughly 800k tokens.
      // This leaves room for the prompt and system instructions.
      const MAX_CONTEXT_CHARS = 3200000; 

      for (let b = 0; b < branches.length; b++) {
        if (masterContext.length > MAX_CONTEXT_CHARS) {
          console.warn('[Pipeline] Context budget reached. Skipping remaining branches.');
          break;
        }

        const branch = branches[b];
        setStatus(`Automated Indexing: Branch [${branch.name}] (${b + 1}/${branches.length})...`);
        const treeData = await getRepoTree(repoUrl, token, branch.name);
        const branchFiles = treeData.tree || [];
        branchFiles.forEach((f: any) => allFilesList.add(`[${branch.name}] ${f.path}`));

        const logicFiles = branchFiles
          .filter((f: any) => f.type === 'blob' && f.path.match(/\.(js|ts|jsx|tsx|py|java|c|cpp|h|hpp|go|rs|rb|php|swift|m|mm|kt|kotlin|sql|sh|bat|ps1|json|yml|yaml|toml|xml|md|txt|env|css|scss|sass|html|vue|svelte|astro|r|lua|conf|config|dockerfile|gitignore)$/i))
          .filter((f: any) => !f.path.match(/(package-lock|yarn\.lock|pnpm-lock|dist|node_modules|build|out|vendor|\.min\.js|\.map)$/i))
          .filter((f: any) => !processedShas.has(f.sha))
          .sort((a: any, b: any) => b.size - a.size);

        if (logicFiles.length > 0) {
          masterContext += `\n--- BRANCH: ${branch.name} ---\n`;
          for (let i = 0; i < logicFiles.length; i++) {
            if (masterContext.length > MAX_CONTEXT_CHARS) break;

            const f = logicFiles[i];
            setStatus(`Fetching (${i + 1}/${logicFiles.length}) in ${branch.name}... [Budget: ${Math.round((masterContext.length / MAX_CONTEXT_CHARS) * 100)}%]`);
            try {
              const content = await getFileContent(f.url, token);
              // Take up to 4000 chars, but prune if we are near budget
              const chunk = content.substring(0, 4000);
              masterContext += `\n### FILE: ${f.path}\n${chunk}\n`;
              processedShas.add(f.sha);
            } catch (e) {
              console.warn(`[Pipeline] Failed to fetch ${f.path}:`, e);
            }
          }
        }
      }
      
      const fileListHeader = `FILES ACROSS ALL BRANCHES (Partial List):\n${Array.from(allFilesList).slice(0, 500).join('\n')}\n\n`;
      masterContext = fileListHeader + masterContext;
      
      // Final clipping just in case
      if (masterContext.length > MAX_CONTEXT_CHARS + 100000) {
        masterContext = masterContext.substring(0, MAX_CONTEXT_CHARS + 100000);
      }

      // 2. AI Phase
      setStatus('Pipeline: AI Architectural Synthesis (analyzing patterns)...');
      console.log('[Pipeline] Sending context to AI (Length:', masterContext.length, ')');
      const results = await analyzeRepoChunks(masterContext);
      console.log('[Pipeline] AI analysis complete, chunks received:', results?.length);
      
      if (!results || results.length === 0) {
        throw new Error("AI analysis failed to produce valid architectural chunks. Check console for details.");
      }
      setChunks(results);

      // 3. Distillation Phase
      setStatus('Pipeline: Finalizing Distillation (creating backup)...');
      const repoRes = await ghFetch(`https://api.github.com/repos/${owner}/${repoName}`, token);
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch;

      const backupName = `logic-backup-${Math.random().toString(36).substring(2, 6)}`;
      setStatus(`Creating backup [${backupName}] on ${defaultBranch}...`);
      await createBranch(owner, repoName, backupName, defaultBranch, token);
      
      setStatus('Pipeline: Writing final manifest README...');
      const finalReadme = `# Repository Architectural Manifest: ${repoName.toUpperCase()}\n\n` + 
        `> **Distillation Status**: AUTO-GENERATED\n` +
        `> **Engine Specification**: DALEK_CAAN_SIPHON_ENGINE_V3.2\n` +
        `> **License Notice**: NOT FOR COMMERCIAL USE WITHOUT PURCHASE. Contact administrator for commercial licensing options.\n` +
        `> **Analysis Scope**: ${processedShas.size} unique logic files across multiple branches.\n\n` +
        results.map(c => `### ${c.title}\n**File:** ${c.file}\n\n> ${c.explanation}\n\n#### Strategic Mutation\n* ${c.mutation}\n\n\`\`\`typescript\n${c.code}\n\`\`\`\n`).join('\n---\n');

      await distillRepository(owner, repoName, finalReadme, token, defaultBranch);
      
      setStatus('Success: Pipeline Complete. Repository Distilled.');
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
              <span>{confirmReady ? 'CONFIRM: WIPE & DISTILL' : 'Initiate Autonomous Distillation'}</span>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            </button>

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
                          <span className="text-[10px] font-mono text-[#C5A059] opacity-60">SOURCE: {chunk.file}</span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed font-sans italic">/ {chunk.explanation}</p>
                        
                        <div className="flex items-center gap-3 bg-[#C5A059]/5 border border-[#C5A059]/20 p-4 rounded-sm">
                          <Zap className="w-4 h-4 text-[#C5A059] shrink-0" />
                          <div className="text-xs">
                            <span className="text-[#C5A059]/80 font-bold uppercase tracking-wider block mb-1">Strategic Mutation:</span>
                            <p className="text-white/80">{chunk.mutation}</p>
                          </div>
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
        <footer className="pt-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h4 className="text-[9px] uppercase text-white/30 tracking-[0.3em] font-bold">Capabilities</h4>
            <ul className="text-[11px] font-mono space-y-1 text-white/60">
              <li>- Logic Extraction & Mapping</li>
              <li>- Token-Optimized Context Cleanup</li>
              <li>- Deep AI Reasoning Fabric</li>
            </ul>
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

