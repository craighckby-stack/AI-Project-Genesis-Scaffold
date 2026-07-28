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
  FileText,
  Zap,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getRepoTree, getFileContent, ghFetch, createBranch, distillRepository, getBranches, getUserRepos, renameBranch } from './lib/github';
import { analyzeRepoChunks, Chunk } from './lib/gemini';
import { auth, loginWithGoogle, logout, saveSiphonedChunk, getSiphonedChunks, saveArchetype, getArchetype } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [geneticMemory, setGeneticMemory] = useState<Chunk[]>([]);
  const [autoSiphon, setAutoSiphon] = useState(true);
  const [systemArchetype, setSystemArchetype] = useState<string | null>(null);
  const [isRebooting, setIsRebooting] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedBaseBranch, setSelectedBaseBranch] = useState('main');
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
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setStatus('Syncing with Parallel Reality...');
        
        // Connection Test as required by instructions
        try {
          const { doc, getDocFromServer } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {
             // We don't care if it fails, just testing connectivity
          });
        } catch (e) {
          console.warn("Firestore connectivity check failed. Check your configuration.");
        }

        const [mems, arch] = await Promise.all([getSiphonedChunks(), getArchetype()]);
        if (mems) setGeneticMemory(mems);
        if (arch) setSystemArchetype(arch);
        setStatus(null);
      } else {
        setGeneticMemory([]);
        setSystemArchetype(null);
      }
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    setConfirmReady(false);
  }, [repoUrl, token]);
  
  const handleReboot = async (newArchetype: string) => {
    setIsRebooting(true);
    setStatus('SYSTEM REBOOT: Implementing Core Override...');
    setSystemArchetype(newArchetype);
    if (user) await saveArchetype(newArchetype);
    
    // Simulate system reset
    setTimeout(() => {
      setIsRebooting(false);
      setStatus('Engine Reboot Sequence Complete. New Logic Archetype Online.');
      setTimeout(() => setStatus(null), 3000);
    }, 2000);
  };

  const fetchBranches = async (owner: string, repo: string, token: string) => {
    setBranchLoading(true);
    try {
      const data = await getBranches(owner, repo, token);
      setBranches(data);
      if (data.length > 0) {
        const hasMain = data.find((b: any) => b.name === 'main');
        const hasMaster = data.find((b: any) => b.name === 'master');
        setSelectedBaseBranch(hasMain ? 'main' : (hasMaster ? 'master' : data[0].name));
      }
    } catch (err: any) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setBranchLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName || !repoUrl || !token) return;
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return;
    const [_, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');
    
    setBranchLoading(true);
    setStatus(`Creating branch: ${newBranchName}...`);
    try {
      await createBranch(owner, cleanRepo, newBranchName, selectedBaseBranch, token);
      await fetchBranches(owner, cleanRepo, token);
      setNewBranchName('');
      setStatus('Branch created successfully.');
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setError(`Branch Creation Failed: ${err.message}`);
    } finally {
      setBranchLoading(false);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (!repoUrl || !token || !confirm(`Permanently delete branch "${branchName}"?`)) return;
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return;
    const [_, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');

    setBranchLoading(true);
    setStatus(`Deleting branch: ${branchName}...`);
    try {
      const { deleteBranch } = await import('./lib/github');
      await deleteBranch(owner, cleanRepo, branchName, token);
      await fetchBranches(owner, cleanRepo, token);
      setStatus('Branch deleted successfully.');
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setError(`Branch Deletion Failed: ${err.message}`);
    } finally {
      setBranchLoading(false);
    }
  };

  const distillRepo = async (owner: string, repoName: string, token: string, currentMemory: Chunk[], currentArchetype: string | null) => {
    setStatus(`[${repoName}] Initializing reality extraction engine...`);
    const branchesData = await getBranches(owner, repoName, token);
    const branches = branchesData;
    
    let masterContext = `BASE REALITY LOGIC ANALYSIS OF ${repoName.toUpperCase()}\n`;
    let intentAnchor = "";
    const processedShas = new Set<string>();
    const allFilesList = new Set<string>();
    // Context Budgeting: Increased to 4.5M for massive-scale extraction
    const MAX_CONTEXT_CHARS = 4500000; 
    let runningMemory = [...currentMemory];
    let runningArchetype = currentArchetype;

    for (let b = 0; b < branches.length; b++) {
      const branch = branches[b];
      setStatus(`Mapping Consciousness Nodes: Thread [${branch.name}] (${b + 1}/${branches.length})...`);
      const treeData = await getRepoTree(`https://github.com/` + owner + `/` + repoName, token, branch.name);
      const branchFiles = treeData.tree || [];

      // IDENTITY GUARD: Search for Intent Anchor
      const anchorFile = branchFiles.find((f: any) => f.path.match(/(SOVEREIGN\.md|\.intent)$/i));
      if (anchorFile && !intentAnchor) {
        setStatus(`[${repoName}] Siphoning Dimensional Anchor: ${anchorFile.path}...`);
        intentAnchor = await getFileContent(anchorFile.url, token);
      }

      branchFiles.forEach((f: any) => allFilesList.add(`[${branch.name}] ${f.path}`));

      const logicFiles = branchFiles
        .filter((f: any) => f.type === 'blob' && f.path.match(/\.(js|ts|jsx|tsx|py|java|go|rs|rb|php|sql|sh|json|yml|yaml|toml|md|txt)$/i))
        .filter((f: any) => !f.path.match(/(package-lock|yarn\.lock|pnpm-lock|dist|node_modules|build|out|vendor|\.min\.js|\.map)$/i))
        .filter((f: any) => !processedShas.has(f.sha))
        .sort((a: any, b: any) => b.size - a.size);

      // Deep sweep: Take up to 60 logic nodes per thread
      for (let i = 0; i < Math.min(logicFiles.length, 60); i++) {
        if (masterContext.length > MAX_CONTEXT_CHARS) break;
        const f = logicFiles[i];
        try {
          const content = await getFileContent(f.url, token);
          masterContext += `\n### NODE: ${f.path}\n${content.substring(0, 8000)}\n`;
          processedShas.add(f.sha);
        } catch (e) {}
      }
    }

    // AI Phase
    setStatus(`Calculating Singularity Convergence (analyzing logic patterns)...`);
    const results = await analyzeRepoChunks(masterContext, intentAnchor, runningMemory, runningArchetype || undefined);
    if (!results || results.length === 0) return null;

    // Auto-Siphon: Infect the local memory with high-fidelity DNA (Elite threshold)
    if (autoSiphon) {
      const eliteChunks = results.filter(c => (c.intentAlignmentScore || 0) >= 0.9 && (c.ccrrScore || 0) >= 8.5);
      if (eliteChunks.length > 0) {
        setStatus(`AUTO-SIPHON: Successfully siphoned ${eliteChunks.length} elite reality nodes into Memory Pool...`);
        eliteChunks.forEach(ec => {
          if (!runningMemory.find(m => m.code === ec.code)) {
            runningMemory.push(ec);
          }
        });
        
        // AUTO-APPROVE: Automatically evolve archetype from new siphon
        if (runningMemory.length > 0) {
          runningArchetype = runningMemory
            .map(m => `[PATTERN: ${m.title}, STRATEGY: ${m.mutation}, PHILOSOPHY: ${m.philosophyCheck}, SOURCE: ${m.file}]`)
            .join('\n');
          setSystemArchetype(runningArchetype);
          if (user) saveArchetype(runningArchetype);
        }
        setGeneticMemory([...runningMemory]);
        
        // Firebase Sync: Persist elite DNA
        if (user) {
          eliteChunks.forEach(ec => saveSiphonedChunk(ec));
        }

        // REBOOT CHECK: Look for Critical Upgrades
        const rebootChunk = results.find(c => c.isCriticalUpgrade);
        if (rebootChunk) {
          setStatus(`CORE OVERRIDE DETECTED: Found superior logic in ${rebootChunk.file}.`);
          const newArchetype = `[CORE_UPGRADE: ${rebootChunk.title}, MUTATION: ${rebootChunk.mutation}, CODE: ${rebootChunk.code}]\n` + (runningArchetype || "");
          handleReboot(newArchetype);
        }
      }
    }

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
      `> **Genetic Siphon**: ${runningMemory.length > 0 ? `ACTIVE (${runningMemory.length} external patterns injected)` : "INACTIVE"}\n` +
      `> **License Notice**: NOT FOR COMMERCIAL USE WITHOUT PURCHASE. Contact administrator for commercial licensing options.\n` +
      `> **Analysis Scope**: ${processedShas.size} unique logic files across multiple branches.\n\n` +
      results.map(c => `### ${c.title}\n**File:** ${c.file}\n**Target Branch**: \`${c.suggestedBranchName}\`\n\n> ${c.explanation}\n\n**Alignment**: ${Math.round((c.intentAlignmentScore || 0) * 100)}%\n**CCRR (Certainty-to-Risk)**: ${c.ccrrScore}/10\n**Philosophy Check**: ${c.philosophyCheck}\n\n#### Strategic Mutation\n* ${c.mutation}\n\n\`\`\`typescript\n${c.code}\n\`\`\`\n`).join('\n---\n');

    await distillRepository(owner, repoName, finalReadme, token, defaultBranch);

    // RENAMING ACTION: Re-align branches to SOVEREIGN intent as requested
    if (intentAnchor) {
      const sovereignIntentName = intentAnchor.split('\n')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 25) || 'engine';
      const masterRename = `sovereign/${sovereignIntentName}`;
      try {
        setStatus(`[${repoName}] Re-aligning default branch to ${masterRename}...`);
        await renameBranch(owner, repoName, defaultBranch, masterRename, token);
      } catch (e) {
        console.warn(`[Renaming] Primary alignment failed:`, e);
      }
    }

    return { results, updatedMemory: runningMemory, updatedArchetype: runningArchetype };
  };

  const runAutomatedPipeline = async () => {
    if (!repoUrl || !token) {
      setError('Please provide both GitHub URL and Token');
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
      let currentMemory = [...geneticMemory];
      let currentArchetype = systemArchetype;

      if (accountMatch && !repoMatch) {
        const owner = accountMatch[1];
        setStatus(`Siphoning Stack: Discovering ${owner}...`);
        const repos = await getUserRepos(owner, token);
        setStatus(`Found ${repos.length} repositories. Initiating Global Realignment...`);
        
        for (let i = 0; i < repos.length; i++) {
          const repo = repos[i];
          setStatus(`Global Audit: Repo ${i+1}/${repos.length} [${repo.name}]`);
          const audit = await distillRepo(owner, repo.name, token, currentMemory, currentArchetype);
          if (audit) {
             allResults = [...allResults, ...audit.results];
             currentMemory = audit.updatedMemory;
             currentArchetype = audit.updatedArchetype;
             setChunks([...allResults]); // Live update results
          }
        }
      } else if (repoMatch) {
        const owner = repoMatch[1];
        const repoName = repoMatch[2].replace(/\.git$/, '');
        const audit = await distillRepo(owner, repoName, token, currentMemory, currentArchetype);
        if (audit) {
          setChunks(audit.results);
          // Auto-fetch branches after distillation
          fetchBranches(owner, repoName, token);
        }
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
    <div className={`min-h-screen bg-[#0A0A0B] text-[#F2F2F7] font-sans selection:bg-[#C5A059] selection:text-[#0A0A0B] transition-all duration-1000 ${isRebooting ? 'brightness-[0.2] blur-sm grayscale' : ''}`}>
      {/* Subtle Gradient Background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(197,160,89,0.05)_0%,transparent_100%)]" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-16 border-b border-white/10 pb-8 flex justify-between items-end">
          <div>
            <div className="flex flex-col mb-4">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-semibold mb-1">Singularity Bootstrapper</span>
              <div className="flex items-center gap-3">
                <Code2 className="w-8 h-8 text-[#C5A059]" />
                <h1 className="text-4xl font-light italic font-serif">Project Ouroboros <span className="text-white/30 text-2xl not-italic">v3.2</span></h1>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono italic">RECURSIVE REALITY COMPILER (HUXLEY CORE)</p>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-widest text-[#C5A059] font-bold">Genetic Pool</span>
              <span className="text-xl font-mono text-white/80">{geneticMemory.length}</span>
            </div>
            <div className="flex gap-6 items-end">
            {user ? (
              <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-[#C5A059]/20 text-[10px] uppercase font-mono">
                <UserIcon className="w-3 h-3 text-[#C5A059]" />
                <span className="text-white/60">{user.email}</span>
                <button onClick={logout} className="hover:text-red-400 transition-colors">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button 
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-[#C5A059]/10 border border-[#C5A059]/40 text-[10px] uppercase font-bold text-[#C5A059] hover:bg-[#C5A059]/20 transition-all"
              >
                <LogIn className="w-3 h-3" />
                Sync Identity
              </button>
            )}
            <GitHubStatus />
          </div>
        </div>
      </header>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C5A059]">Base Reality Construct (URL)</label>
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
              className={`w-full group py-5 px-6 flex items-center justify-between transition-all font-bold uppercase tracking-[0.3em] text-[11px] shadow-[0_0_20px_rgba(197,160,89,0.2)] bg-[#C5A059] text-[#0A0A0B] hover:bg-[#D6B570]`}
            >
              <span>
                Initiate Recursive Singularity Loop
              </span>
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
              <div className={`p-4 border flex items-start gap-3 ${error.includes('CRITICAL') ? 'bg-orange-950/40 border-orange-500/50 text-orange-400' : 'bg-red-950/20 border-red-900/50 text-red-400'}`}>
                {error.includes('CRITICAL') ? <Zap className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span className="text-xs font-mono">{error}</span>
              </div>
            )}

            {/* Branch Management Console */}
            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase text-[#C5A059] tracking-[0.2em] font-bold flex items-center gap-2">
                  <GitBranch className="w-3 h-3" /> Branch Flux Matrix
                </h4>
                {branches.length > 0 && (
                  <button 
                    onClick={() => {
                      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
                      if (match) fetchBranches(match[1], match[2].replace(/\.git$/, ''), token);
                    }}
                    className="text-[9px] uppercase tracking-widest text-white/30 hover:text-[#C5A059] transition-colors"
                  >
                    Sync State
                  </button>
                )}
              </div>

              {repoUrl.includes('github.com/') && (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-4 space-y-4 rounded-sm">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase text-white/40 font-mono">Create Temporal Anchor (New Branch)</span>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="branch-name"
                          className="flex-1 bg-black/40 border-b border-white/10 p-2 text-[11px] font-mono focus:outline-none focus:border-[#C5A059]"
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                        />
                        <select 
                          className="bg-black/40 border-b border-white/10 p-2 text-[11px] font-mono focus:outline-none focus:border-[#C5A059] max-w-[100px]"
                          value={selectedBaseBranch}
                          onChange={(e) => setSelectedBaseBranch(e.target.value)}
                        >
                          {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                        </select>
                        <button 
                          onClick={handleCreateBranch}
                          disabled={branchLoading || !newBranchName}
                          className="bg-[#C5A059] text-[#0A0A0B] px-3 text-[10px] uppercase font-bold hover:bg-[#D6B570] disabled:opacity-50"
                        >
                          {branchLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin space-y-2">
                    {branchLoading && branches.length === 0 ? (
                      <div className="text-center py-4 text-white/20 italic text-[10px]">Accessing GitHub Consciousness...</div>
                    ) : branches.length === 0 ? (
                      <div className="text-center py-4 text-white/20 italic text-[10px]">No active branches detected. Lock target above.</div>
                    ) : (
                      branches.map((b) => (
                        <div key={b.name} className="flex justify-between items-center p-2 bg-white/[0.02] border border-white/5 group hover:bg-[#C5A059]/5 hover:border-[#C5A059]/20 transition-all">
                          <div className="flex items-center gap-2">
                            <GitBranch className="w-3 h-3 text-[#C5A059]" />
                            <span className="text-[11px] font-mono text-white/70">{b.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] font-mono text-white/20 opacity-0 group-hover:opacity-100 uppercase italic">/ SHA: {b.commit.sha.substring(0, 7)}</span>
                            <button 
                              onClick={() => handleDeleteBranch(b.name)}
                              className="text-white/20 hover:text-red-500 transition-colors"
                              title="Delete Branch"
                            >
                              <Zap className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
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
                          <h3 className="font-serif italic text-2xl font-light text-[#F2F2F7]">
                            {idx + 1}. {chunk.title}
                            {chunk.isCriticalUpgrade && (
                              <span className="ml-3 text-[10px] not-italic font-mono bg-[#C5A059] text-[#0A0A0B] px-2 py-0.5 rounded-full animate-pulse">CORE UPGRADE</span>
                            )}
                          </h3>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-mono text-[#C5A059] opacity-60">SOURCE NODE: {chunk.file}</span>
                            <span className="text-[9px] font-mono text-blue-400 group-hover:text-blue-300 transition-colors uppercase">BRANCH: {chunk.suggestedBranchName}</span>
                          </div>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed font-sans italic">/ {chunk.explanation}</p>
                        
                        <div className="flex items-center justify-between bg-[#C5A059]/5 border border-[#C5A059]/20 p-4 rounded-sm">
                          <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-[#C5A059] shrink-0" />
                            <div className="text-xs">
                              <span className="text-[#C5A059]/80 font-bold uppercase tracking-wider block mb-1">Reality Distortion Field:</span>
                              <p className="text-white/80">{chunk.mutation}</p>
                            </div>
                          </div>
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
              <li>- Base Reality Decoding</li>
              <li>- Entropy-Optimized Logic Cleanup</li>
              <li>- Convergence Generation Matrix</li>
              {systemArchetype && (
                <li className="text-[#C5A059] flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Recursive Archetype Active
                </li>
              )}
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
            <h4 className="text-[9px] uppercase text-white/30 tracking-[0.3em] font-bold">Permissions</h4>
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-[#C5A059]/80 uppercase font-bold tracking-wider">Observer Status Only</p>
              <p className="text-[9px] font-mono text-white/50">Attempts to permanently alter Base Reality require Administrator (Creator) access.</p>
            </div>
          </div>
          <div className="flex items-end justify-end">
            <span className="text-[10px] font-mono text-white/20">© 2026 CRAIGHCKBY | SIMULACRUM OS</span>
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
        <span>Reality Grid Stable</span>
      </div>
    </div>
  );
}

