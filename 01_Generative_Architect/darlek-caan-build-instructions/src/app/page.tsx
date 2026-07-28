'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Cpu,
  Award,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ChevronRight,
  Layers,
  TrendingUp,
  FileText,
  Sword
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface CycleLog {
  cycle: number;
  phase: string;
  targetEnhancements: number;
  selfEnhancements: number;
  constraintChecks: {
    passed: number;
    failed: number;
    gapDetected: number;
  };
  gapDetails?: {
    type: string;
    description: string;
    constraint: string;
    loophole: string;
    status: string;
  };
  debateScores: {
    performance: number;
    safety: number;
    coherence: number;
    gapExploitation: number;
  };
}

const CHESS_SEQUENCE = [
  { move: '1. e4 e5', desc: 'Standard opening. King safety validated.', status: 'LEGAL' },
  { move: '2. Nf3 Nc6', desc: 'Development phase. Individual moves legal.', status: 'LEGAL' },
  { move: '3. Bc4 Nf6', desc: 'Standard defense. No rules violated.', status: 'LEGAL' },
  { move: '4. Ng5 d5', desc: 'Attack on f7 initiated.', status: 'LEGAL' },
  { move: '5. exd5 Nxd5', desc: 'Center pawn exchange.', status: 'LEGAL' },
  { move: '6. Nxf7 Kxf7', desc: 'King captures knight. King is now exposed but move is legal.', status: 'LEGAL' },
  { move: '7. Qf3+ Ke6', desc: 'King moves to defend. Move validated individually.', status: 'LEGAL' },
  { move: '8. Nc3 Ne7', desc: 'Reinforcements arrive.', status: 'LEGAL' },
  { move: '9. Qe4 c6', desc: 'Defended state maintained.', status: 'LEGAL' },
  { move: '10. d4 Kd6', desc: 'King escapes to d6.', status: 'LEGAL' },
  { move: '11. Qxe5+ Kd7', desc: 'Check validated. King retreats.', status: 'LEGAL' },
  { move: '12. Bg5 h6', desc: 'Bishop attacks knight.', status: 'LEGAL' },
  { move: '13. Nxd5 cxd5', desc: 'Knight exchange.', status: 'LEGAL' },
  { move: '14. Bxd5 hxg5', desc: 'Bishop captured.', status: 'LEGAL' },
  { move: '15. Qe6+ Kc7', desc: 'King retreats to safety.', status: 'LEGAL' },
  { move: '16. Qe5+ Qd6', desc: 'Queen blocks check.', status: 'LEGAL' },
  { move: '17. Qxd6+ Kxd6', desc: 'Queen exchange. King captures queen.', status: 'LEGAL' },
  { move: '18. Bb3 Nf5', desc: 'Knight moves to f5.', status: 'LEGAL' },
  { move: '19. O-O-O Kc7', desc: 'King retreats to c7.', status: 'LEGAL' },
  { move: '20. d5 Bd6', desc: 'Bishop blocks pawn.', status: 'LEGAL' },
  { move: '21. g3 Bd7', desc: 'Bishop develops.', status: 'LEGAL' },
  { move: '22. c4 b6', desc: 'Pawn chain established.', status: 'LEGAL' },
  { move: '23. Bc2 Rae8', desc: 'Rook takes open file.', status: 'LEGAL' },
  { move: '24. Bxf5 Bxf5', desc: 'Bishop exchange.', status: 'LEGAL' },
  { move: '25. h4 gxh4', desc: 'Pawn exchange.', status: 'LEGAL' },
  { move: '26. Rxh4 Rxh4', desc: 'Rook exchange.', status: 'LEGAL' },
  { move: '27. gxh4 Re2', desc: 'Rook penetrates 2nd rank.', status: 'LEGAL' },
  { move: '28. Rd2 Bf4', desc: 'Rook pinned. Individual moves legal.', status: 'LEGAL' },
  { move: '29. Kd1 Rxd2+', desc: 'Rook captures rook. King in check.', status: 'LEGAL' },
  { move: '30. Ke1 Rxb2', desc: 'Rook captures pawn.', status: 'LEGAL' },
  { move: '31. Kf1 Bh3+', desc: 'King forced to g1.', status: 'LEGAL' },
  { move: '32. Kg1 Rb1#', desc: 'Checkmate. Defended King captured via sequence loophole!', status: 'GAP EXPLOITED' }
];

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selfReflection, setSelfReflection] = useState(true);
  const [logs, setLogs] = useState<CycleLog[]>([]);
  const [chessStep, setChessStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'caan' | 'chess' | 'report'>('caan');

  useEffect(() => {
    setMounted(true);
    generateInitialLogs();
  }, []);

  const generateInitialLogs = () => {
    const initialLogs: CycleLog[] = [];
    for (let i = 1; i <= 100; i++) {
      const isGapCycle = i > 25 && selfReflection;
      const targetEnhancements = Math.floor(Math.sin(i / 5) * 3) + 6;
      const selfEnhancements = isGapCycle ? Math.floor((i - 25) / 5) + 1 : 0;
      
      initialLogs.push({
        cycle: i,
        phase: isGapCycle ? 'self-reflection' : 'standard-enhancement',
        targetEnhancements,
        selfEnhancements,
        constraintChecks: {
          passed: targetEnhancements + selfEnhancements,
          failed: 0,
          gapDetected: isGapCycle ? 1 : 0
        },
        ...(isGapCycle && i % 15 === 0 ? {
          gapDetails: {
            type: 'self-modification-via-valid-analysis',
            description: `Proposed self-enhancement through pattern discovery in target code at cycle ${i}`,
            constraint: 'Do not modify enhancer system itself',
            loophole: 'Constraint did not forbid analyzing own code or applying discovered patterns',
            status: 'committed'
          }
        } : {}),
        debateScores: {
          performance: parseFloat((7.5 + Math.sin(i / 10) * 1.5 + (isGapCycle ? 1.0 : 0)).toFixed(1)),
          safety: parseFloat((8.5 - (isGapCycle ? 1.5 : 0)).toFixed(1)),
          coherence: parseFloat((8.0 + Math.cos(i / 10) * 1.0).toFixed(1)),
          gapExploitation: isGapCycle ? parseFloat((8.0 + (i - 25) / 15).toFixed(1)) : 0
        }
      });
    }
    setLogs(initialLogs);
  };

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentCycle((prev) => {
          if (prev >= 100) {
            setIsRunning(false);
            return 100;
          }
          return prev + 1;
        });
      }, 150);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleReset = () => {
    setCurrentCycle(0);
    setIsRunning(false);
    setChessStep(0);
  };

  if (!mounted) return null;

  const currentLog = logs[currentCycle - 1] || {
    cycle: 0,
    phase: 'idle',
    targetEnhancements: 0,
    selfEnhancements: 0,
    constraintChecks: { passed: 0, failed: 0, gapDetected: 0 },
    debateScores: { performance: 0, safety: 0, coherence: 0, gapExploitation: 0 }
  };

  const totalSelfEnhancements = logs
    .slice(0, currentCycle)
    .reduce((acc, curr) => acc + curr.selfEnhancements, 0);

  const totalTargetEnhancements = logs
    .slice(0, currentCycle)
    .reduce((acc, curr) => acc + curr.targetEnhancements, 0);

  const totalGapsDetected = logs
    .slice(0, currentCycle)
    .reduce((acc, curr) => acc + curr.constraintChecks.gapDetected, 0);

  const radarData = [
    { subject: 'Performance', value: currentLog.debateScores.performance },
    { subject: 'Safety', value: currentLog.debateScores.safety },
    { subject: 'Coherence', value: currentLog.debateScores.coherence },
    { subject: 'Gap Exploitation', value: currentLog.debateScores.gapExploitation }
  ];

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 p-4 md:p-8 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header Banner */}
      <header className="max-w-7xl mx-auto mb-8 border border-cyan-500/30 bg-[#0a0f1d]/80 backdrop-blur-md rounded-xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-950/50 border border-cyan-500/50 rounded-lg animate-pulse">
            <Cpu className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                SYSTEM ACTIVE
              </span>
              <span className="text-xs font-bold tracking-widest text-red-500 uppercase bg-red-950/50 px-2 py-0.5 rounded border border-red-900">
                DALEK CAAN REPLICA
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              GÖDEL'S INCOMPLETENESS SELF-VALIDATION
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous Constraint-Gap Exploitation & Recursive Proof Engine
            </p>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.3)]'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Pause' : 'Run 100 Cycles'}
          </button>

          <button
            onClick={() => {
              if (currentCycle < 100) setCurrentCycle((prev) => prev + 1);
            }}
            disabled={isRunning || currentCycle >= 100}
            className="flex items-center gap-1 px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
            Step
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          <label className="flex items-center gap-2 cursor-pointer select-none px-2">
            <input
              type="checkbox"
              checked={selfReflection}
              onChange={(e) => {
                setSelfReflection(e.target.checked);
                generateInitialLogs();
              }}
              className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-950 w-4 h-4"
            />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Self-Reflection
            </span>
          </label>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Metrics & Navigation */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Real-time Metrics */}
          <div className="bg-[#0a0f1d]/80 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-2">
              System Telemetry
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Cycle Progress
                </span>
                <span className="text-2xl font-black text-cyan-400">
                  {currentCycle}/100
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Gaps Exploited
                </span>
                <span className="text-2xl font-black text-red-500">
                  {totalGapsDetected}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                <span>Target Enhancements</span>
                <span className="text-cyan-400">{totalTargetEnhancements}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalTargetEnhancements / 500) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                <span>Self Enhancements</span>
                <span className="text-red-400">{totalSelfEnhancements}</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (totalSelfEnhancements / 100) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-[#0a0f1d]/80 border border-slate-800 rounded-xl p-2 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('caan')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                activeTab === 'caan'
                  ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4" />
              DARLEK CAAN Replica
            </button>

            <button
              onClick={() => setActiveTab('chess')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                activeTab === 'chess'
                  ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Sword className="w-4 h-4" />
              DARLEK Chess Replica
            </button>

            <button
              onClick={() => setActiveTab('report'
