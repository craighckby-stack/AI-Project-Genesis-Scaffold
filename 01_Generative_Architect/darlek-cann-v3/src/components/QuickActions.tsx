'use client';

import { Search, FileCode, Dna, Heart, Eye, Users, Upload, Rocket, ListChecks, CheckCircle2, RotateCcw, Radio, Undo2, GitCommit } from 'lucide-react';
import { COLORS } from '@/lib/constants';

interface QuickActionsProps {
  onAction: (action: string) => void;
  disabled: boolean;
  pushStatus?: 'idle' | 'pushing' | 'success' | 'error';
  deployStatus?: 'idle' | 'deploying' | 'success' | 'error';
  rebootStatus?: 'idle' | 'rebooting' | 'success' | 'error';
  undoStatus?: 'idle' | 'undoing' | 'success' | 'error';
  bulkCommitStatus?: 'idle' | 'committing' | 'success' | 'error';
  batchMode?: boolean;
  autoApprove?: boolean;
  onToggleAutoApprove?: () => void;
  autoDebate?: boolean;
  onToggleAutoDebate?: () => void;
  orchestraActive?: boolean;
  cycleAmount?: number;
  onCycleAmountChange?: (amount: number) => void;
  onEngageLazyAssCycle?: () => void;
}

const actions = [
  { id: 'scan', label: 'SCAN REPOSITORY', icon: Search, color: COLORS.cyan },
  { id: 'analyze', label: 'ANALYZE FILE', icon: FileCode, color: COLORS.gold },
  { id: 'propose', label: 'PROPOSE MUTATION', icon: Dna, color: COLORS.purple },
  { id: 'propose-all', label: 'SELECT ALL', icon: ListChecks, color: '#00ccff' },
  { id: 'bulk-commit', label: 'BULK COMMIT', icon: GitCommit, color: '#33ffaa' },
  { id: 'health', label: 'HEALTH CHECK', icon: Heart, color: COLORS.dalekRed },
  { id: 'saturation', label: 'VIEW SATURATION', icon: Eye, color: COLORS.electricBlue },
  { id: 'debate', label: 'DEBATE CHAMBER', icon: Users, color: COLORS.purple },
  { id: 'orchestra', label: 'ORCHESTRA', icon: Radio, color: COLORS.gold },
  { id: 'push-enhancements', label: 'PUSH FILES', icon: Upload, color: COLORS.green },
  { id: 'deploy-new-repo', label: 'DEPLOY NEW REPO', icon: Rocket, color: '#ff6600' },
  { id: 'undo-mutation', label: 'UNDO MUTATION', icon: Undo2, color: '#ff3366' },
  { id: 'reboot-system', color: '#ff00ff', label: 'REBOOT SYSTEM', icon: RotateCcw },
];

export default function QuickActions({
  onAction,
  disabled,
  pushStatus,
  deployStatus,
  rebootStatus,
  undoStatus,
  bulkCommitStatus,
  batchMode,
  autoApprove,
  onToggleAutoApprove,
  autoDebate,
  onToggleAutoDebate,
  orchestraActive,
  cycleAmount,
  onCycleAmountChange,
  onEngageLazyAssCycle,
}: QuickActionsProps) {
  return (
    <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '8px',
              letterSpacing: '0.15em',
              color: COLORS.textMuted,
            }}
          >
            <span>&#9673;</span>
            <span>QUICK ACTIONS</span>
          </div>
          {batchMode && (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm animate-pulse"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '7px',
                letterSpacing: '0.1em',
                color: '#00ccff',
                background: 'rgba(0, 204, 255, 0.1)',
                border: '1px solid rgba(0, 204, 255, 0.25)',
              }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#00ccff' }} />
              BATCH ACTIVE
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#020000] p-2 border border-white/[0.04] rounded">
          <div className="flex flex-wrap items-center gap-2">
            {autoApprove !== undefined && onToggleAutoApprove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAutoApprove();
                }}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm transition-all duration-200 cursor-pointer"
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '7px',
                  letterSpacing: '0.1em',
                  color: autoApprove ? '#00ff88' : COLORS.textMuted,
                  background: autoApprove ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                  border: `1px solid ${autoApprove ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                }}
                title={autoApprove ? 'Auto-approve ON — all mutations applied automatically' : 'Auto-approve OFF — you approve each mutation manually'}
              >
                <CheckCircle2 size={9} style={{ opacity: autoApprove ? 1 : 0.4 }} />
                <span>AUTO APPROVE</span>
                <div
                  className="relative w-5 h-2.5 rounded-full transition-colors duration-200"
                  style={{
                    background: autoApprove ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    className="absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all duration-200"
                    style={{
                      left: autoApprove ? '10px' : '2px',
                      background: autoApprove ? '#00ff88' : '#555',
                      boxShadow: autoApprove ? '0 0 6px rgba(0, 255, 136, 0.5)' : 'none',
                    }}
                  />
                </div>
              </button>
            )}

            {autoDebate !== undefined && onToggleAutoDebate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAutoDebate();
                }}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm transition-all duration-200 cursor-pointer"
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '7px',
                  letterSpacing: '0.1em',
                  color: autoDebate ? '#ffaa00' : COLORS.textMuted,
                  background: autoDebate ? 'rgba(255, 170, 0, 0.1)' : 'transparent',
                  border: `1px solid ${autoDebate ? 'rgba(255, 170, 0, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                }}
                title={autoDebate ? 'Auto-debate ON — file selection automatically initiates debate' : 'Auto-debate OFF — manually initiate debate'}
              >
                <Users size={9} style={{ opacity: autoDebate ? 1 : 0.4 }} />
                <span>AUTO DEBATE</span>
                <div
                  className="relative w-5 h-2.5 rounded-full transition-colors duration-200"
                  style={{
                    background: autoDebate ? 'rgba(255, 170, 0, 0.3)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    className="absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all duration-200"
                    style={{
                      left: autoDebate ? '10px' : '2px',
                      background: autoDebate ? '#ffaa00' : '#555',
                      boxShadow: autoDebate ? '0 0 6px rgba(255, 170, 0, 0.5)' : 'none',
                    }}
                  />
                </div>
              </button>
            )}

            {onEngageLazyAssCycle && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEngageLazyAssCycle();
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm transition-all duration-200 cursor-pointer text-[#ff00a0] bg-pink-950/15 border border-[#ff00a0]/30 hover:border-[#ff00a0] hover:bg-pink-950/30 font-bold active:scale-95 shadow-[0_0_8px_rgba(255,0,160,0.1)] hover:shadow-[0_0_12px_rgba(255,0,160,0.35)]"
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '7px',
                  letterSpacing: '0.05em',
                }}
                title="LAZY ASS CYCLE: Auto-Approve ON, Auto-Debate ON, Cycles = 5"
              >
                <Rocket size={8} className="text-[#ff00a0] animate-bounce" />
                <span>LAZY ASS MODE (5 CYCLES) 🚀</span>
              </button>
            )}
          </div>

          {cycleAmount !== undefined && onCycleAmountChange && (
            <div
              className="flex items-center gap-2 px-2 py-0.5 rounded-sm border border-white/10 bg-black/40"
              title="Set the amount of debate cycles/rounds before operator verdict"
            >
              <span
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '7px',
                  letterSpacing: '0.1em',
                  color: COLORS.textMuted,
                }}
              >
                CYCLES:
              </span>
              <select
                value={cycleAmount}
                onChange={(e) => onCycleAmountChange(Number(e.target.value))}
                className="bg-transparent text-red-500 font-mono text-[9px] border-none focus:outline-none outline-none py-0 px-1 cursor-pointer select-none"
              >
                <option value={1} className="bg-[#050000] text-gray-200">1</option>
                <option value={2} className="bg-[#050000] text-gray-200">2</option>
                <option value={3} className="bg-[#050000] text-gray-200">3</option>
                <option value={4} className="bg-[#050000] text-gray-200">4</option>
                <option value={5} className="bg-[#050000] text-gray-200">5</option>
              </select>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ id, label, icon: Icon, color }) => {
          const isPushing = id === 'push-enhancements' && pushStatus === 'pushing';
          const isDeploying = id === 'deploy-new-repo' && deployStatus === 'deploying';
          const isRebooting = id === 'reboot-system' && rebootStatus === 'rebooting';
          const isUndoing = id === 'undo-mutation' && undoStatus === 'undoing';
          const isBulkCommitting = id === 'bulk-commit' && bulkCommitStatus === 'committing';
          const isBusy = isPushing || isDeploying || isRebooting || isUndoing || isBulkCommitting;
          const isActionDisabled = disabled || isBusy;

          let statusColor = color;
          if (id === 'push-enhancements' && pushStatus === 'success') statusColor = COLORS.green;
          if (id === 'push-enhancements' && pushStatus === 'error') statusColor = COLORS.dalekRed;
          if (id === 'deploy-new-repo' && deployStatus === 'success') statusColor = COLORS.green;
          if (id === 'deploy-new-repo' && deployStatus === 'error') statusColor = COLORS.dalekRed;
          if (id === 'reboot-system' && rebootStatus === 'success') statusColor = COLORS.green;
          if (id === 'reboot-system' && rebootStatus === 'error') statusColor = COLORS.dalekRed;
          if (id === 'undo-mutation' && undoStatus === 'success') statusColor = COLORS.green;
          if (id === 'undo-mutation' && undoStatus === 'error') statusColor = COLORS.dalekRed;
          if (id === 'bulk-commit' && bulkCommitStatus === 'success') statusColor = COLORS.green;
          if (id === 'bulk-commit' && bulkCommitStatus === 'error') statusColor = COLORS.dalekRed;
          if (id === 'propose-all' && batchMode) statusColor = '#00ccff';

          return (
            <button
              key={id}
              onClick={() => onAction(id)}
              disabled={isActionDisabled}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-[10px] transition-all duration-200"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 500,
                letterSpacing: '0.05em',
                background: isActionDisabled ? '#1a1a1a' : `${color}06`,
                color: isActionDisabled ? '#333' : statusColor,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: id === 'propose-all' && batchMode ? 'rgba(0, 204, 255, 0.4)' : (isActionDisabled ? '#1a1a1a' : `${color}25`),
                cursor: isActionDisabled ? 'not-allowed' : 'pointer',
                ...(id === 'propose-all' && batchMode ? {
                  boxShadow: '0 0 12px rgba(0, 204, 255, 0.2)',
                } : {}),
              }}
              onMouseEnter={(e) => {
                if (!isActionDisabled) {
                  e.currentTarget.style.background = `${color}15`;
                  e.currentTarget.style.boxShadow = `0 0 10px ${color}20, inset 0 0 20px ${color}05`;
                  e.currentTarget.style.borderColor = `${color}50`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActionDisabled) {
                  e.currentTarget.style.background = `${color}06`;
                  e.currentTarget.style.boxShadow = id === 'propose-all' && batchMode ? '0 0 12px rgba(0, 204, 255, 0.2)' : 'none';
                  e.currentTarget.style.borderColor = id === 'propose-all' && batchMode ? 'rgba(0, 204, 255, 0.4)' : `${color}25`;
                }
              }}
            >
              <Icon size={11} className={isBusy ? 'animate-spin' : ''} />
              <span>&#9673;</span>
              {isPushing ? 'PUSHING...' : isDeploying ? 'DEPLOYING...' : isRebooting ? 'REBOOTING...' : isUndoing ? 'UNDOING...' : isBulkCommitting ? 'COMMITTING...' : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}






