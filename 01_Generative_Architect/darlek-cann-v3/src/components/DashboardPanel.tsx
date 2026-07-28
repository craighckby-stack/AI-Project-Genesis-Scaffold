'use client';

import StatusBar from './StatusBar';
import SaturationMetricsPanel from './SaturationMetrics';
import EvolutionLog from './EvolutionLog';
import DebateChamber from './DebateChamber';
import MutationHistoryPanel from './MutationHistoryPanel';
import type { SystemState, EvolutionLogEntry, DebateAgent, AgentVote } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { Cpu, RotateCw } from 'lucide-react';

interface DashboardPanelProps {
  systemState: SystemState;
  logEntries: EvolutionLogEntry[];
  overallHealth: 'healthy' | 'warning' | 'critical';
  debateAgents: DebateAgent[];
  debateTopic: string;
  debateActive: boolean;
  debateVotes?: AgentVote[];
  debateConsensus?: string;
  rejectionCount?: number;
  brainSessionId?: string;
  historyRefreshTrigger?: number;
  isLoading?: boolean;
  batchMode?: boolean;
  batchProgress?: number;
  batchQueueLength?: number;
  activeFilePath?: string;
  mutationsApplied?: number;
}

export default function DashboardPanel({
  systemState,
  logEntries,
  overallHealth,
  debateAgents,
  debateTopic,
  debateActive,
  debateVotes,
  debateConsensus,
  rejectionCount,
  brainSessionId,
  historyRefreshTrigger,
  isLoading = false,
  batchMode = false,
  batchProgress = 0,
  batchQueueLength = 0,
  activeFilePath,
  mutationsApplied = 0,
}: DashboardPanelProps) {
  return (
    <div className="flex flex-col gap-3 lg:gap-4 lg:h-full overflow-y-auto dalek-scrollbar p-2 custom-scrollbar">
      <StatusBar
        connectionStatus={systemState.connectionStatus}
        repoConfig={systemState.repoConfig}
        overallHealth={overallHealth}
        sessionStart={systemState.sessionStart}
        // Make sure we pass the correct updated cycle count
        evolutionCycle={systemState.evolutionCycle}
      />

      {/* Real-time Evolution Activity Monitor */}
      <div className="dalek-panel rounded-lg p-4 space-y-4">
        <div className="dalek-panel-header py-2 px-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={14} style={{ color: batchMode ? COLORS.cyan : COLORS.gold }} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-orbitron), sans-serif' }}>LIVE OPERATION MONITOR</span>
          </div>
          <span
            className="px-1.5 py-0.5 rounded text-[8px] font-sans font-bold select-none pulse-cyan"
            style={{
              background: batchMode ? 'rgba(0,255,204,0.1)' : 'rgba(255,170,0,0.1)',
              color: batchMode ? COLORS.cyan : COLORS.gold,
              border: `1px solid ${batchMode ? COLORS.cyan : COLORS.gold}30`
            }}
          >
            {batchMode ? 'BATCH CYCLE ONLINE' : isLoading ? 'THINKING' : 'STANDBY'}
          </span>
        </div>

        <div style={{ background: '#080808', border: `1px solid ${COLORS.panelBorder}` }} className="p-3 rounded-sm space-y-3">
          {batchMode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-400">BATCH PROGRESS</span>
                <span className="text-[#00ccff] font-bold">
                  {batchProgress + 1} / {batchQueueLength} ({batchQueueLength ? Math.round((batchProgress / batchQueueLength) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#111] overflow-hidden border border-white/[0.03]">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#00ccff] to-[#00ffcc]"
                  style={{
                    width: `${batchQueueLength ? (batchProgress / batchQueueLength) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.02]">
                <div>
                  <span className="block text-[8px] text-gray-500 font-mono">ACTIVE FILE</span>
                  <span className="block text-[10px] text-yellow-500 font-mono truncate" title={activeFilePath}>
                    {activeFilePath ? activeFilePath.split('/').pop() : 'Scanning...'}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] text-gray-400 font-mono">COMMITS INJECTED</span>
                  <span className="block text-[10px] text-green-500 font-mono font-bold">
                    {mutationsApplied} COMMITS
                  </span>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCw size={12} className="text-amber-500 animate-spin" />
                <span className="text-[10px] text-amber-500 font-mono">Analyzing target file context...</span>
              </div>
              {activeFilePath && (
                <div className="text-[9px] text-gray-400 font-mono truncate">
                  File: <span className="text-gray-200">{activeFilePath}</span>
                </div>
              )}
            </div>
          ) : activeFilePath ? (
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 font-mono">
                Targeted: <span className="text-[#00ffcc] font-semibold">{activeFilePath.split('/').pop()}</span>
              </div>
              <div className="text-[8px] text-gray-500 font-mono">
                Standby. Ready to evolve file using custom promoter directives.
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-gray-500 font-mono italic text-center py-1">
              Standby. Select a file from the repository to begin mutation scan.
            </div>
          )}
        </div>
      </div>

      <SaturationMetricsPanel metrics={systemState.saturation} />
      <EvolutionLog entries={logEntries} />
      <DebateChamber
        agents={debateAgents}
        currentTopic={debateTopic}
        isActive={debateActive}
        votes={debateVotes}
        consensus={debateConsensus}
      />
      {brainSessionId && <MutationHistoryPanel sessionId={brainSessionId} refreshTrigger={historyRefreshTrigger} />}
    </div>
  );
}
