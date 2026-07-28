import React from 'react';
import { Session, Stats } from '../types';
import { Plus, History, Trash2, BrainCircuit, Activity, HelpCircle, GitFork } from 'lucide-react';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onBranchSession: () => void;
  onDeleteSession: (id: string) => void;
  stats: Stats;
  userEmail: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onBranchSession,
  onDeleteSession,
  stats,
  userEmail
}) => {
  return (
    <div id="sidebar-container" className="hidden lg:flex w-72 shrink-0 bg-slate-900 border-r border-slate-800 flex-col text-slate-100 h-full">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-sky-400" />
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">Multi-Agent App</h1>
          </div>
        </div>
        <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
          V1.0.0
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-4 space-y-2">
        <button
          onClick={onCreateSession}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-sky-600 hover:bg-sky-500 transition-colors text-white font-medium rounded-lg shadow-lg shadow-sky-900/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
        <button
          onClick={onBranchSession}
          disabled={!activeSessionId}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors text-slate-300 font-medium rounded-lg text-sm border border-slate-700"
          title="Clone current session"
        >
          <GitFork className="w-4 h-4" />
          Duplicate Session
        </button>
      </div>

      {/* Session History */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <History className="w-3.5 h-3.5" />
          <span>Recent Sessions ({sessions.length})</span>
        </div>

        <div className="space-y-1.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                session.id === activeSessionId
                  ? 'bg-sky-500/10 border border-sky-500/30 text-sky-300 shadow-inner'
                  : 'hover:bg-slate-800/60 border border-transparent text-slate-300 hover:text-white'
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-medium truncate">{session.title}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-1 rounded hover:bg-slate-700 transition-all"
                title="Delete Session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {sessions.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">No sessions found.</p>
          )}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5" />
          <span>Usage Statistics</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Mean Latency</span>
            <span className="text-sky-400 text-sm font-bold">
              {stats.meanLatency > 0 ? `${(stats.meanLatency / 1000).toFixed(2)}s` : '0.00s'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">Total Queries</span>
            <span className="text-emerald-400 text-sm font-bold">{stats.totalQueries}</span>
          </div>
        </div>

        {/* User context info and footer */}
        <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-900 flex flex-col gap-1 items-center">
          <span className="truncate w-full">{userEmail}</span>
          <span className="text-[9px] text-slate-600">&copy; Trademark Huckerby 2026. MIT Not For Profit.</span>
        </div>
      </div>
    </div>
  );
};
