'use client';

import { SystemState } from '@/lib/types';

interface OptionsPanelProps {
  systemState: SystemState;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
}

export default function OptionsPanel({ systemState, setSystemState }: OptionsPanelProps) {
  return (
    <div className="p-6 text-slate-300 font-mono text-sm space-y-6">
      <h2 className="text-xl font-bold text-cyan-400">System Configuration</h2>
      
      <div className="space-y-2">
        <label className="block text-xs uppercase text-slate-500">GitHub API Token</label>
        <input 
          type="password"
          className="w-full bg-[#0a0000] border border-slate-700 p-2 rounded"
          value={systemState.apiKeys.github}
          onChange={(e) => setSystemState(prev => ({...prev, apiKeys: {...prev.apiKeys, github: e.target.value}}))}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs uppercase text-slate-500">GitHub Owner</label>
        <input 
          className="w-full bg-[#0a0000] border border-slate-700 p-2 rounded"
          value={systemState.repoConfig.owner}
          onChange={(e) => setSystemState(prev => ({...prev, repoConfig: {...prev.repoConfig, owner: e.target.value}}))}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs uppercase text-slate-500">GitHub Repo</label>
        <input 
          className="w-full bg-[#0a0000] border border-slate-700 p-2 rounded"
          value={systemState.repoConfig.repo}
          onChange={(e) => setSystemState(prev => ({...prev, repoConfig: {...prev.repoConfig, repo: e.target.value}}))}
        />
      </div>
    </div>
  );
}
