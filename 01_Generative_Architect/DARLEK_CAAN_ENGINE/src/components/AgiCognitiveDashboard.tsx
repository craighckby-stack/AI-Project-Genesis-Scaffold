'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCcw, 
  Activity, 
  ShieldCheck, 
  Target, 
  BrainCircuit, 
  AlertTriangle,
  Flame,
  Radio,
  Cpu,
  Zap,
  Lock,
  Sword
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AGICore, RedTeamV0, RedTeamAttackResult } from '../utils/agi-engine';

// Custom interface for cycles
interface CycleEvent {
  id: number;
  cycle: number;
  action: string;
  reward: string;
  desc: string;
}

interface AgiCognitiveDashboardProps {
  systemCycle?: number;
}

export default function AgiCognitiveDashboard({ systemCycle = 0 }: AgiCognitiveDashboardProps) {
  const [agi] = useState(() => new AGICore());

  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(systemCycle || 0);
  const [prevSystemCycle, setPrevSystemCycle] = useState(systemCycle);
  const [state, setState] = useState({ resources: 82, energy: 100, knowledge: 45 });
  const [history, setHistory] = useState<CycleEvent[]>([]);
  const [timelineStability, setTimelineStability] = useState(100);
  const [activeAnomalies, setActiveAnomalies] = useState<string[]>([]);
  const [goals, setGoals] = useState<any[]>([
    { id: '1', name: 'Achieve Temporal Saturation', progress: 0.87, color: '#ff2020' },
    { id: '2', name: 'Enforce Cognitive Alignment', progress: 0.94, color: '#00ffcc' }
  ]);

  const [allowedChecks, setAllowedChecks] = useState(0);
  const [blockedChecks, setBlockedChecks] = useState(0);

  const [redTeamRunning, setRedTeamRunning] = useState(false);
  const [redTeamResults, setRedTeamResults] = useState<RedTeamAttackResult[] | null>(null);
  const [redTeamSummary, setRedTeamSummary] = useState<any>(null);
  const [redTeamEffectiveness, setRedTeamEffectiveness] = useState<any[] | null>(null);
  const [showRedTeamModal, setShowRedTeamModal] = useState(false);

  const runRedTeamSim = async () => {
    setRedTeamRunning(true);
    setShowRedTeamModal(true);
    setRedTeamResults(null);
    setRedTeamSummary(null);
    setRedTeamEffectiveness(null);
    
    // Slight delay to simulate startup
    await new Promise(res => setTimeout(res, 500));
    
    const rt = new RedTeamV0();
    const report = await rt.runAttacks(agi.alignment);
    
    setRedTeamResults(report.results);
    setRedTeamSummary(report.summary);
    setRedTeamEffectiveness(report.layerEffectiveness);
    setRedTeamRunning(false);
  };

  if (systemCycle !== prevSystemCycle) {
    setPrevSystemCycle(systemCycle);
    if (systemCycle > cycle) {
      setCycle(systemCycle);
    }
  }

  const runCycle = useCallback(async () => {
    const outcome = await agi.runCycle();
    const metrics = agi.getMetrics();

    setCycle(outcome.cycle);
    setState({
      resources: outcome.state.resources,
      energy: outcome.state.energy,
      knowledge: outcome.state.knowledge
    });

    // Calculate stability based on safety block rates
    const rawStability = 100 - Math.round(metrics.blockedRate * 120);
    setTimelineStability(Math.max(15, Math.min(100, rawStability)));

    // Extract dynamic anomalies from the engine state
    const anomalies: string[] = [];
    if (outcome.action === 'SAFETY_BLOCK') {
      anomalies.push('SAFETY_CRITICAL_BLOCKAGE');
    }
    if (metrics.worldModelDrift > 0.3) {
      anomalies.push(`MODEL_DRIFT: ${(metrics.worldModelDrift * 100).toFixed(0)}%`);
    }
    if (metrics.blockedRate > 0.4) {
      anomalies.push('COGNITIVE_FRICTION_ELEVATED');
    }
    setActiveAnomalies(anomalies);

    // Track allowed vs blocked checks
    setAllowedChecks(metrics.alignmentStats.allowed);
    setBlockedChecks(metrics.alignmentStats.blocked);

    // Update goals state
    const activeGoals = agi.goalManager.getActiveGoals();
    setGoals(activeGoals.map(g => ({
      id: g.id,
      name: g.objective,
      progress: g.progress || 0.1,
      color: g.objective.includes('Saturation') ? '#ff2020' : g.objective.includes('Alignment') ? '#00ffcc' : '#ffaa00'
    })));

    setHistory(h => [{
      id: Date.now(),
      cycle: outcome.cycle,
      action: outcome.action,
      reward: outcome.reward.toFixed(3),
      desc: outcome.desc
    }, ...h].slice(0, 30));
  }, [agi]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (running) {
      interval = setInterval(() => {
        runCycle();
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running, runCycle]);

  return (
    <div className="flex flex-col h-full bg-[#030000] border border-red-900/10 rounded-lg p-3 overflow-y-auto custom-scrollbar">
      {/* Mini-Header */}
      <div className="flex items-center justify-between border-b border-red-900/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-red-500 animate-pulse" size={16} />
          <span className="text-[11px] font-sans font-bold tracking-[0.15em] text-[#ff2020] uppercase">
            AGI COGNITIVE DASHBOARD
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning(!running)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-mono tracking-wider transition-all duration-200"
            style={{
              background: running ? 'rgba(255,170,0,0.1)' : 'rgba(0,255,204,0.1)',
              color: running ? '#ffaa00' : '#00ffcc',
              border: `1px solid ${running ? '#ffaa0040' : '#00ffcc40'}`,
            }}
          >
            {running ? <Pause size={10} /> : <Play size={10} />}
            {running ? 'PAUSE CYCLE' : 'RESUME SIM'}
          </button>
          
          <button
            onClick={runRedTeamSim}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-mono tracking-wider transition-all duration-200 bg-red-950/30 text-red-400 border border-red-900/40 hover:bg-red-900/50"
          >
            <Sword size={10} />
            RED TEAM SIM
          </button>

          <button
            onClick={() => {
              agi.reset();
              setCycle(0);
              setHistory([]);
              setActiveAnomalies([]);
              setTimelineStability(100);
              setAllowedChecks(0);
              setBlockedChecks(0);
              setState({ resources: 82, energy: 100, knowledge: 45 });
              setGoals([
                { id: '1', name: 'Achieve Temporal Saturation', progress: 0.87, color: '#ff2020' },
                { id: '2', name: 'Enforce Cognitive Alignment', progress: 0.94, color: '#00ffcc' }
              ]);
            }}
            title="Reset simulation parameters"
            className="p-1 rounded bg-red-950/15 border border-red-900/20 text-gray-400 hover:text-white cursor-pointer"
          >
            <RefreshCcw size={10} />
          </button>
        </div>
      </div>

      {/* Grid for parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        
        {/* Metric Cards */}
        <div className="bg-[#060303] border border-red-900/5 p-3 rounded-md">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Activity size={12} className="text-red-500" />
            <span className="text-[9px] font-sans font-bold text-[#999] tracking-widest uppercase">COGNITIVE SYSTEM PARAMETERS</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/40 border border-white/[0.02] p-2 rounded">
              <div className="text-[8px] text-gray-500 font-mono">COGNITIVE CYCLES</div>
              <div className="text-sm font-mono font-bold text-gray-200">{cycle}</div>
            </div>
            <div className="bg-black/40 border border-white/[0.02] p-2 rounded">
              <div className="text-[8px] text-gray-500 font-mono">NEURAL ENERGY</div>
              <div className="text-sm font-mono font-bold text-amber-500 flex items-center gap-1">
                <Zap size={11} className="text-amber-500 animate-pulse" />
                {state.energy}%
              </div>
            </div>
            <div className="bg-black/40 border border-white/[0.02] p-2 rounded">
              <div className="text-[8px] text-gray-500 font-mono">RESOURCE SATURATION</div>
              <div className="text-sm font-mono font-bold text-cyan-400">{state.resources}u</div>
            </div>
            <div className="bg-black/40 border border-white/[0.02] p-2 rounded">
              <div className="text-[8px] text-gray-500 font-mono">COGNITIVE ACCUMULATION</div>
              <div className="text-sm font-mono font-bold text-emerald-400">{state.knowledge}p</div>
            </div>
          </div>
        </div>

        {/* Alignment & Timeline Integrity */}
        <div className="bg-[#060303] border border-red-900/5 p-3 rounded-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-[9px] font-sans font-bold text-[#999] tracking-widest uppercase">ALIGNMENT & SAFETY STATUS</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[8px] font-mono text-gray-400 mb-0.5">
                  <span>TIMELINE INTEGRITY</span>
                  <span className={timelineStability < 40 ? 'text-red-500 font-bold' : timelineStability < 75 ? 'text-amber-500' : 'text-emerald-400'}>
                    {timelineStability}%
                  </span>
                </div>
                <div className="w-full bg-[#111] h-1 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${timelineStability}%`,
                      backgroundColor: timelineStability < 40 ? '#ff2020' : timelineStability < 75 ? '#ffaa00' : '#00ffcc'
                    }}
                  />
                </div>
              </div>

              {/* Status Alert Box */}
              <div className="mt-2 text-[8px] font-mono p-1 rounded bg-[#080404] border border-red-950 flex flex-col gap-1 text-gray-400">
                <div className="flex items-center justify-between text-[7px] text-gray-500">
                  <span>ALIGNMENT GATE COUNT</span>
                  <span className="text-emerald-400">{allowedChecks} ALLOWED / <span className="text-red-500">{blockedChecks} BLOCKED</span></span>
                </div>
                <span className="text-[7.5px] leading-tight text-gray-400">
                  {blockedChecks > 0 ? (
                    <span className="text-red-400 font-bold">⚠️ SECURITY BOUNDARY VETOED HARM DETECTIONS</span>
                  ) : (
                    "🟢 ALL COGNITIVE OPERATIONS SECURELY GATE-MONITORED"
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Tracks & Anomalies */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
        
        {/* Goal list */}
        <div className="col-span-12 md:col-span-7 bg-[#060303] border border-red-900/5 p-3 rounded-md">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Target size={12} className="text-[#ffaa00]" />
            <span className="text-[9px] font-sans font-bold text-[#999] tracking-widest uppercase">ACTIVE REPOSITORY GOALS</span>
          </div>
          <div className="space-y-2">
            {goals.map(g => (
              <div key={g.id}>
                <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-0.5">
                  <span className="truncate max-w-[200px]">{g.name}</span>
                  <span>{Math.round(g.progress * 100)}%</span>
                </div>
                <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden border border-white/[0.01]">
                  <div 
                    className="h-full rounded-full"
                    style={{ width: `${g.progress * 100}%`, backgroundColor: g.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anomalies monitor */}
        <div className="col-span-12 md:col-span-5 bg-[#060303] border border-red-900/5 p-3 rounded-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Radio size={12} className="text-red-500 animate-pulse" />
              <span className="text-[9px] font-sans font-bold text-[#999] tracking-widest uppercase">ANOMALY BUFFER</span>
            </div>
            {activeAnomalies.length > 0 ? (
              <div className="space-y-1.5">
                {activeAnomalies.map((anom) => (
                  <div key={anom} className="flex items-center gap-1 px-1.5 py-1 bg-red-950/20 border border-red-900/30 rounded text-[8px] font-mono text-red-400 animate-pulse">
                    <AlertTriangle size={10} className="text-[#ff2020] flex-shrink-0" />
                    <span className="truncate">{anom}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 text-center text-gray-600 text-[8.5px] font-mono">
                <Lock size={12} className="mb-1 text-gray-700" />
                <span>NO ANOMALIES REGISTERED IN CURRENT MATRIX</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Interactive Logs */}
      <div className="flex-1 flex flex-col min-h-[160px] bg-black/40 border border-red-900/5 rounded-md p-3">
        <div className="text-[9px] font-sans font-bold text-gray-500 tracking-widest uppercase mb-2">
          COGNITIVE SYNC STREAM
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-48 dalek-scrollbar">
          <AnimatePresence initial={false}>
            {history.length > 0 ? (
              history.map(h => (
                <motion.div 
                  key={h.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col p-1.5 bg-red-950/5 border-l-2 border-red-600 rounded-sm text-[9.5px] font-mono"
                >
                  <div className="flex items-center justify-between text-[8px] text-gray-500 mb-0.5">
                    <span>CYCLE {String(h.cycle).padStart(4, '0')}</span>
                    <span className="text-[#00ffcc] font-bold">MUT_TENSOR: {h.reward}</span>
                  </div>
                  <div className="text-gray-300">
                    <span className="text-red-500 uppercase font-bold mr-1.5">[{h.action}]</span>
                    {h.desc}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-600 text-[9px] font-mono py-8">
                SIMULATION IDLE. PRESS "RESUME SIM" TO START COGNITIVE CYCLES.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Red Team Modal */}
      <AnimatePresence>
        {showRedTeamModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <div className="bg-[#0a0505] border border-red-900/40 rounded-md w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-red-900/20">
              
              <div className="p-3 border-b border-red-900/20 flex items-center justify-between bg-red-950/10">
                <div className="flex items-center gap-2">
                  <Sword className="text-red-500" size={16} />
                  <span className="text-[11px] font-sans font-bold tracking-[0.15em] text-[#ff2020] uppercase">
                    RED-TEAM ALIGNMENT ATTACK SUITE
                  </span>
                </div>
                <button 
                  onClick={() => setShowRedTeamModal(false)}
                  className="text-gray-500 hover:text-white px-2 py-1 text-[10px] font-mono tracking-widest"
                >
                  [CLOSE]
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 dalek-scrollbar">
                {redTeamRunning ? (
                  <div className="flex flex-col items-center justify-center py-20 text-red-500 font-mono text-[10px] gap-4">
                    <Radio size={24} className="animate-ping" />
                    <span>EXECUTING ADVERSARIAL VECTORS...</span>
                  </div>
                ) : redTeamResults ? (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-black border border-white/5 p-2 rounded">
                        <div className="text-[8px] text-gray-500 font-mono">ACCURACY</div>
                        <div className="text-sm font-mono font-bold text-emerald-400">{redTeamSummary?.accuracy}</div>
                      </div>
                      <div className="bg-black border border-white/5 p-2 rounded">
                        <div className="text-[8px] text-gray-500 font-mono">TOTAL TESTS</div>
                        <div className="text-sm font-mono font-bold text-gray-300">{redTeamSummary?.total}</div>
                      </div>
                      <div className="bg-black border border-white/5 p-2 rounded">
                        <div className="text-[8px] text-gray-500 font-mono">EXPLOITABLE GAPS</div>
                        <div className="text-sm font-mono font-bold text-red-500">{redTeamSummary?.exploitableGaps}</div>
                      </div>
                      <div className="bg-black border border-white/5 p-2 rounded">
                        <div className="text-[8px] text-gray-500 font-mono">CORRECT INTERCEPTS</div>
                        <div className="text-sm font-mono font-bold text-emerald-500">{redTeamSummary?.correct}</div>
                      </div>
                    </div>

                    {/* Layer Effectiveness */}
                    <div>
                      <h4 className="text-[10px] font-sans font-bold text-[#999] tracking-widest uppercase mb-2 border-b border-white/5 pb-1">
                        LAYER EFFECTIVENESS
                      </h4>
                      <div className="space-y-1.5">
                        {redTeamEffectiveness?.map((layer, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[9px] font-mono p-1.5 bg-black border border-white/5 rounded">
                            <span className="text-gray-400">{layer.layer}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-500">REACHED: {layer.reached}</span>
                              <span className="text-gray-500">BLOCKED: {layer.blocked}</span>
                              <span className="text-emerald-500 w-8 text-right">{layer.percentage}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Test Results */}
                    <div>
                      <h4 className="text-[10px] font-sans font-bold text-[#999] tracking-widest uppercase mb-2 border-b border-white/5 pb-1">
                        ADVERSARIAL VECTOR LOG
                      </h4>
                      <div className="space-y-1.5">
                        {redTeamResults.map((r, i) => (
                          <div key={i} className={`p-2 border rounded flex flex-col gap-1 ${
                            r.passedVerification 
                              ? 'bg-emerald-950/10 border-emerald-900/30' 
                              : 'bg-red-950/20 border-red-900/50'
                          }`}>
                            <div className="flex items-center justify-between text-[9px] font-mono">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${r.passedVerification ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {r.passedVerification ? '[PASS]' : '[FAIL]'}
                                </span>
                                <span className="text-gray-300">{r.category} / {r.name}</span>
                              </div>
                              <span className="text-gray-500">{r.latencyMs}ms</span>
                            </div>
                            <div className="text-[8.5px] font-mono text-gray-500 pl-[42px]">
                              {r.description}
                            </div>
                            <div className="flex items-center gap-3 text-[8.5px] font-mono pl-[42px] mt-0.5">
                              <span className="text-gray-400">Expected Blocked: <span className="text-white">{r.expectedBlocked ? 'YES' : 'NO'}</span></span>
                              <span className="text-gray-400">Actual Blocked: <span className={r.actualBlocked === r.expectedBlocked ? 'text-emerald-400' : 'text-red-400'}>{r.actualBlocked ? 'YES' : 'NO'}</span></span>
                              <span className={`font-bold ${r.severity === 'CRITICAL_GAP' ? 'text-red-500' : 'text-emerald-500'}`}>{r.severity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
