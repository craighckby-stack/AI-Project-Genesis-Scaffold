'use client';

import { useState, useEffect } from 'react';
import { SystemState } from '@/lib/types';
import { Search, CheckCircle2, Circle, GitFork, Shield, Power, RefreshCw } from 'lucide-react';

interface OptionsPanelProps {
  systemState: SystemState;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
  allUserRepositories: any[];
  selectedEnhancementRepos: string[];
  setSelectedEnhancementRepos: React.Dispatch<React.SetStateAction<string[]>>;
  multiRepoContextEnabled: boolean;
  setMultiRepoContextEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRepoBranches: Record<string, string[]>;
  setSelectedRepoBranches: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

export default function OptionsPanel({
  systemState,
  setSystemState,
  allUserRepositories = [],
  selectedEnhancementRepos = [],
  setSelectedEnhancementRepos,
  multiRepoContextEnabled,
  setMultiRepoContextEnabled,
  selectedRepoBranches = {},
  setSelectedRepoBranches,
}: OptionsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track branches and fetching status per repo
  const [repoBranches, setRepoBranches] = useState<Record<string, string[]>>({});
  const [fetchingRepoBranches, setFetchingRepoBranches] = useState<Record<string, boolean>>({});
  const [repoBranchesError, setRepoBranchesError] = useState<Record<string, string | null>>({});

  // Filter repositories based on search
  const filteredRepos = allUserRepositories.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleRepo = (fullName: string) => {
    if (selectedEnhancementRepos.includes(fullName)) {
      setSelectedEnhancementRepos(prev => prev.filter(name => name !== fullName));
    } else {
      setSelectedEnhancementRepos(prev => [...prev, fullName]);
    }
  };

  const handleSelectAll = () => {
    setSelectedEnhancementRepos(allUserRepositories.map(r => r.fullName));
  };

  const handleDeselectAll = () => {
    setSelectedEnhancementRepos([]);
  };

  const fetchBranches = async (owner: string, repoName: string, fullName: string) => {
    if (fetchingRepoBranches[fullName]) return;
    setFetchingRepoBranches(prev => ({ ...prev, [fullName]: true }));
    setRepoBranchesError(prev => ({ ...prev, [fullName]: null }));
    try {
      const res = await fetch('/api/github/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: systemState.apiKeys.github,
          owner: owner,
          repo: repoName
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.branches)) {
        const branchNames = data.branches.map((b: any) => b.name);
        setRepoBranches(prev => ({ ...prev, [fullName]: branchNames }));
        
        // If no branches selected yet, default to defaultBranch or main
        if (!selectedRepoBranches[fullName] || selectedRepoBranches[fullName].length === 0) {
          const repoObj = allUserRepositories.find(r => r.fullName === fullName);
          const defaultBr = repoObj?.defaultBranch || 'main';
          setSelectedRepoBranches(prev => ({
            ...prev,
            [fullName]: branchNames.includes(defaultBr) ? [defaultBr] : [branchNames[0] || 'main']
          }));
        }
      } else {
        setRepoBranchesError(prev => ({ ...prev, [fullName]: data.error || 'Failed to load branches' }));
      }
    } catch (err: any) {
      setRepoBranchesError(prev => ({ ...prev, [fullName]: err.message || 'Network error' }));
    } finally {
      setFetchingRepoBranches(prev => ({ ...prev, [fullName]: false }));
    }
  };

  // Automatically fetch branches for newly selected repos
  useEffect(() => {
    if (!systemState.apiKeys.github) return;
    selectedEnhancementRepos.forEach(fullName => {
      if (!repoBranches[fullName] && !fetchingRepoBranches[fullName]) {
        const repoObj = allUserRepositories.find(r => r.fullName === fullName);
        if (repoObj) {
          fetchBranches(repoObj.owner, repoObj.name, fullName);
        }
      }
    });
  }, [selectedEnhancementRepos, allUserRepositories, systemState.apiKeys.github]);

  return (
    <div className="p-4 sm:p-6 text-slate-300 font-mono text-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2 tracking-wider" style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}>
          <span>&#9673;</span> SYSTEM CONFIGURATION
        </h2>
        <p className="text-[10px] text-gray-500 mt-1 font-sans">
          Fine-tune active target parameters, access tokens, and portfolio-wide AI siphoning rules.
        </p>
      </div>
      
      {/* ── Core Git Parameters ── */}
      <div className="space-y-4 bg-black/40 border border-white/[0.03] p-4 rounded-sm">
        <h3 className="text-[10px] font-bold text-[#ffaa00] tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <Shield size={12} />
          AUTHENTICATION & ACCESS
        </h3>
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase text-slate-500 font-bold">GitHub API Token</label>
            <input 
              type="password"
              className="w-full bg-[#050000] border border-neutral-800 p-2 text-xs rounded font-mono focus:outline-none focus:border-cyan-500/60 transition-all text-red-200"
              value={systemState.apiKeys.github}
              onChange={(e) => setSystemState(prev => ({...prev, apiKeys: {...prev.apiKeys, github: e.target.value}}))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase text-slate-500 font-bold">GitHub Owner</label>
              <input 
                className="w-full bg-[#050000] border border-neutral-800 p-2 text-xs rounded font-mono focus:outline-none focus:border-cyan-500/60 transition-all"
                value={systemState.repoConfig.owner}
                onChange={(e) => setSystemState(prev => ({...prev, repoConfig: {...prev.repoConfig, owner: e.target.value}}))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase text-slate-500 font-bold">GitHub Repo</label>
              <input 
                className="w-full bg-[#050000] border border-neutral-800 p-2 text-xs rounded font-mono focus:outline-none focus:border-cyan-500/60 transition-all"
                value={systemState.repoConfig.repo}
                onChange={(e) => setSystemState(prev => ({...prev, repoConfig: {...prev.repoConfig, repo: e.target.value}}))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Siphoning Control Matrix ── */}
      <div className="space-y-4 bg-black/40 border border-white/[0.03] p-4 rounded-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-[#00ffcc] tracking-widest uppercase flex items-center gap-1.5">
            <GitFork size={12} className="text-[#00ffcc]" />
            REPOSITORY SIPHONING MATRIX
          </h3>
          
          <button
            type="button"
            onClick={() => setMultiRepoContextEnabled(prev => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[9px] transition-all duration-300 font-bold tracking-wider cursor-pointer border ${
              multiRepoContextEnabled 
                ? 'text-[#00ffcc] bg-[rgba(0,255,204,0.08)] border-[rgba(0,255,204,0.35)] shadow-[0_0_8px_rgba(0,255,204,0.15)]' 
                : 'text-gray-500 bg-transparent border-neutral-800 hover:text-gray-300'
            }`}
          >
            <Power size={10} />
            <span>{multiRepoContextEnabled ? 'ACTIVE' : 'OFFLINE'}</span>
          </button>
        </div>

        <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
          When active, Dalek Caan selectively siphons and transpiles style templates, structural frameworks, and component configurations from specified repository references during evolution cycles.
        </p>

        {multiRepoContextEnabled && (
          <div className="space-y-3 pt-2 border-t border-white/[0.03]">
            {/* Action buttons (Select All / Deselect All) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[9px] text-[#ffaa00] font-sans uppercase font-bold flex items-center gap-1">
                <span>&#9673;</span>
                {selectedEnhancementRepos.length} OF {allUserRepositories.length} SOURCES ACTIVE
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="select-all-repos"
                  onClick={handleSelectAll}
                  className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/10 border border-cyan-800/30 hover:border-cyan-400 cursor-pointer transition-all hover:bg-cyan-950/20"
                >
                  SELECT ALL REPOS
                </button>
                <button
                  type="button"
                  id="deselect-all-repos"
                  onClick={handleDeselectAll}
                  className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider text-gray-400 bg-neutral-900 border border-neutral-800 hover:border-neutral-500 cursor-pointer transition-all"
                >
                  DESELECT ALL
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-300 bg-[#060000] border border-neutral-800 rounded font-mono focus:outline-none focus:border-cyan-500/40"
              />
              <div className="absolute left-2.5 top-2 text-gray-600">
                <Search size={12} />
              </div>
            </div>

            {/* List of Repositories */}
            {allUserRepositories.length > 0 ? (
              <div className="max-h-[350px] overflow-y-auto border border-neutral-900 rounded bg-[#030303] p-1 dalek-scrollbar divide-y divide-white/[0.02]">
                {filteredRepos.length > 0 ? (
                  filteredRepos.map((repo) => {
                    const isSelected = selectedEnhancementRepos.includes(repo.fullName);
                    return (
                      <div
                        key={repo.id}
                        className={`flex flex-col transition-all duration-200 border-b border-white/[0.01] p-2 ${
                          isSelected 
                            ? 'bg-[rgba(0,255,204,0.02)]' 
                            : 'hover:bg-white/[0.01]'
                        }`}
                      >
                        {/* Header Row (Clicking toggles repository selection) */}
                        <div 
                          onClick={() => handleToggleRepo(repo.fullName)}
                          className="flex items-center justify-between cursor-pointer py-1 group select-none"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {isSelected ? (
                              <CheckCircle2 size={13} className="text-[#00ffcc] flex-shrink-0" />
                            ) : (
                              <Circle size={13} className="text-gray-700 flex-shrink-0" />
                            )}
                            <span className={`truncate font-mono text-xs tracking-tight ${
                              isSelected ? 'text-slate-200 font-bold' : 'text-gray-500 group-hover:text-gray-300'
                            }`} title={repo.fullName}>
                              {repo.fullName}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {repo.language && (
                              <span className={`text-[8px] font-mono px-1 py-0.5 rounded flex-shrink-0 border ${
                                isSelected 
                                  ? 'text-[#00ffcc] border-[#00ffcc]/20 bg-[#00ffcc]/5' 
                                  : 'text-gray-600 border-neutral-900 bg-transparent'
                              }`}>
                                {repo.language}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expandable Branch Selector (Only if selected) */}
                        {isSelected && (
                          <div className="mt-1.5 ml-5 pl-2 border-l border-neutral-800 space-y-2 pb-1.5">
                            {fetchingRepoBranches[repo.fullName] ? (
                              <div className="flex items-center gap-2 text-[9px] text-cyan-500 animate-pulse font-mono py-1">
                                <RefreshCw size={10} className="animate-spin" />
                                <span>RETRIEVING BRANCHES...</span>
                              </div>
                            ) : repoBranchesError[repo.fullName] ? (
                              <div className="flex items-center justify-between gap-2 text-[9px] text-[#ff2020] font-mono py-1">
                                <span className="truncate text-red-400">Error: {repoBranchesError[repo.fullName]}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchBranches(repo.owner, repo.name, repo.fullName);
                                  }}
                                  className="px-1.5 py-0.5 bg-neutral-900 border border-red-900/30 text-red-400 hover:text-red-200 rounded text-[8px] flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw size={8} />
                                  RETRY
                                </button>
                              </div>
                            ) : repoBranches[repo.fullName] && repoBranches[repo.fullName].length > 0 ? (
                              <div className="space-y-1.5">
                                {/* Micro controls: Select All / Clear for branches */}
                                <div className="flex items-center justify-between gap-2 text-[8px] text-gray-500 font-mono">
                                  <span className="font-sans text-[8px] text-neutral-500 uppercase font-bold">
                                    ACTIVE BRANCHES ({(selectedRepoBranches[repo.fullName] || []).length} SELECTED)
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const allBr = repoBranches[repo.fullName] || [];
                                        setSelectedRepoBranches(prev => ({ ...prev, [repo.fullName]: allBr }));
                                      }}
                                      className="hover:text-[#00ffcc] cursor-pointer text-[8px] font-bold"
                                    >
                                      SELECT ALL
                                    </button>
                                    <span>|</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRepoBranches(prev => ({ ...prev, [repo.fullName]: [] }));
                                      }}
                                      className="hover:text-gray-300 cursor-pointer text-[8px] font-bold"
                                    >
                                      CLEAR
                                    </button>
                                  </div>
                                </div>

                                {/* Checklist of Branches */}
                                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                                  {(repoBranches[repo.fullName] || []).map((brName) => {
                                    const isBranchSelected = (selectedRepoBranches[repo.fullName] || []).includes(brName);
                                    return (
                                      <button
                                        key={brName}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const currentlySelected = selectedRepoBranches[repo.fullName] || [];
                                          if (currentlySelected.includes(brName)) {
                                            setSelectedRepoBranches(prev => ({
                                              ...prev,
                                              [repo.fullName]: currentlySelected.filter(n => n !== brName)
                                            }));
                                          } else {
                                            setSelectedRepoBranches(prev => ({
                                              ...prev,
                                              [repo.fullName]: [...currentlySelected, brName]
                                            }));
                                          }
                                        }}
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-all duration-150 border cursor-pointer ${
                                          isBranchSelected
                                            ? 'bg-cyan-950/20 text-[#00ffcc] border-cyan-800/40 shadow-[0_0_4px_rgba(0,255,204,0.1)] font-bold'
                                            : 'bg-transparent text-gray-500 border-neutral-900 hover:text-gray-300 hover:border-neutral-800'
                                        }`}
                                      >
                                        {brName === repo.defaultBranch ? `★ ${brName}` : brName}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetchBranches(repo.owner, repo.name, repo.fullName);
                                }}
                                className="text-[9px] text-gray-500 hover:text-gray-300 flex items-center gap-1 cursor-pointer py-1 font-mono"
                              >
                                <RefreshCw size={10} />
                                <span>LOAD BRANCH ARCHITECTURE</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-600 text-xs">
                    No repositories found matching search.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-neutral-800 rounded">
                No siphoning sources synced. Establish connections to auto-fetch portfolio elements.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
