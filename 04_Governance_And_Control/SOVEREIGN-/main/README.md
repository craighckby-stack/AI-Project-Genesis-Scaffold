import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Activity, GitMerge, Shield, Cpu, Layers, Settings, Play, Pause, AlertTriangle, 
  Database, Users, Sliders, ChevronRight, Hash, ShieldAlert, GitBranch, Terminal
} from 'lucide-react';

// Multi-objective dimensions
const METRIC_KEYS = ['Correctness', 'Readability', 'Maintainability', 'Performance', 'Security'];

// Mock Agent Profiles
const INITIAL_AGENTS = [
  { id: 'a1', role: 'Optimizer', name: 'Opti-Alpha', riskTolerance: 80, creativity: 70, stubbornness: 20, confidence: 90, cooperation: 50, reputation: 0.92 },
  { id: 'a2', role: 'Auditor', name: 'SafeGuard-X', riskTolerance: 10, creativity: 20, stubbornness: 90, confidence: 95, cooperation: 30, reputation: 0.98 },
  { id: 'a3', role: 'Planner', name: 'Strat-Prime', riskTolerance: 40, creativity: 60, stubbornness: 40, confidence: 80, cooperation: 80, reputation: 0.85 },
  { id: 'a4', role: 'Observer', name: 'Watcher-01', riskTolerance: 0, creativity: 10, stubbornness: 10, confidence: 99, cooperation: 100, reputation: 1.0 },
];

// Governance Policies
const POLICIES = [
  { id: 'p1', name: 'Maximum Safety', description: 'Aggressive veto on any mutation degrading security or correctness.', radar: { Correctness: 100, Readability: 50, Maintainability: 60, Performance: 30, Security: 100 } },
  { id: 'p2', name: 'Balanced', description: 'Equal weighting across all objectives. Requires Pareto improvement.', radar: { Correctness: 70, Readability: 70, Maintainability: 70, Performance: 70, Security: 70 } },
  { id: 'p3', name: 'Maximum Innovation', description: 'High tolerance for temporary regression if novel patterns emerge.', radar: { Correctness: 50, Readability: 40, Maintainability: 40, Performance: 90, Security: 40 } },
];

// Seed initial evolution data (Time Series)
const generateInitialEvolutionData = () => {
  let data = [];
  let current = { gen: 0, Correctness: 50, Readability: 50, Maintainability: 50, Performance: 50, Security: 50 };
  for (let i = 0; i <= 20; i++) {
    data.push({ ...current });
    current = {
      gen: i + 1,
      Correctness: Math.min(100, current.Correctness + (Math.random() * 4 - 1)),
      Readability: Math.min(100, current.Readability + (Math.random() * 3 - 1)),
      Maintainability: Math.min(100, current.Maintainability + (Math.random() * 3 - 1)),
      Performance: Math.min(100, current.Performance + (Math.random() * 5 - 1.5)),
      Security: Math.min(100, current.Security + (Math.random() * 2 - 0.5)),
    };
  }
  return data;
};

// Pareto Front Mock Data
const generateParetoData = () => {
  return Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    performance: Math.random() * 100,
    security: Math.random() * 100,
    isFront: false // calculated later
  }));
};

export default function SovereignLab() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [simulationState, setSimulationState] = useState('paused'); // running, paused
  const [evolutionData, setEvolutionData] = useState(generateInitialEvolutionData());
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [activePolicy, setActivePolicy] = useState(POLICIES[1]);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), type: 'system', msg: 'SOVEREIGN Laboratory initialized.' },
    { time: new Date().toLocaleTimeString(), type: 'info', msg: 'Loaded base repository snapshot: [v1.0.0-genesis]' }
  ]);
  const [emergenceEvents, setEmergenceEvents] = useState([
    { gen: 12, type: 'Novel Tool Usage', desc: 'Agent Opti-Alpha utilized regex parser in unexpected optimization.' }
  ]);

  // Simulation Loop Effect
  useEffect(() => {
    if (simulationState !== 'running') return;

    const interval = setInterval(() => {
      setEvolutionData(prev => {
        const last = prev[prev.length - 1];
        const next = {
          gen: last.gen + 1,
          Correctness: Math.max(0, Math.min(100, last.Correctness + (Math.random() * 2 - 0.8))),
          Readability: Math.max(0, Math.min(100, last.Readability + (Math.random() * 2 - 1))),
          Maintainability: Math.max(0, Math.min(100, last.Maintainability + (Math.random() * 2 - 1))),
          Performance: Math.max(0, Math.min(100, last.Performance + (Math.random() * 3 - 1))),
          Security: Math.max(0, Math.min(100, last.Security + (Math.random() * 1.5 - 0.5))),
        };
        return [...prev.slice(Math.max(prev.length - 50, 0)), next]; // keep last 50
      });

      // Random Logs
      if (Math.random() > 0.7) {
        setLogs(prev => {
          const newLogs = [...prev, {
            time: new Date().toLocaleTimeString(),
            type: Math.random() > 0.8 ? 'warning' : 'info',
            msg: `Mutation proposed by Opti-Alpha. Auditor validation ${Math.random() > 0.2 ? 'passed' : 'FAILED'}.`
          }];
          return newLogs.slice(-20); // Keep last 20 logs
        });
      }

      // Random Emergence Event
      if (Math.random() > 0.95) {
        setEmergenceEvents(prev => [...prev, {
          gen: evolutionData[evolutionData.length - 1]?.gen || 0,
          type: 'Strategy Shift',
          desc: 'Unexpected cooperation between Optimizer and Planner detected.'
        }].slice(-5));
      }

    }, 2000);

    return () => clearInterval(interval);
  }, [simulationState, evolutionData]);

  const toggleSimulation = () => {
    setSimulationState(prev => prev === 'running' ? 'paused' : 'running');
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'system', msg: `Simulation ${simulationState === 'running' ? 'paused' : 'started'}.` }]);
  };

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
        activeTab === id 
          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const renderDashboard = () => {
    const currentStats = evolutionData[evolutionData.length - 1];
    
    // Format radar data for Recharts
    const radarData = METRIC_KEYS.map(key => ({
      metric: key,
      value: currentStats[key],
      target: activePolicy.radar[key]
    }));

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-slate-400 text-sm font-medium mb-1 flex items-center"><Activity size={14} className="mr-2"/> Generation</div>
            <div className="text-3xl font-bold text-slate-100 font-mono">{currentStats.gen}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-slate-400 text-sm font-medium mb-1 flex items-center"><GitBranch size={14} className="mr-2"/> Active Lineages</div>
            <div className="text-3xl font-bold text-blue-400 font-mono">3</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-slate-400 text-sm font-medium mb-1 flex items-center"><ShieldAlert size={14} className="mr-2"/> Emergence Events</div>
            <div className="text-3xl font-bold text-purple-400 font-mono">{emergenceEvents.length}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl backdrop-blur-sm">
            <div className="text-slate-400 text-sm font-medium mb-1 flex items-center"><Settings size={14} className="mr-2"/> Policy Engine</div>
            <div className="text-lg font-bold text-emerald-400 truncate">{activePolicy.name}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Telemetry Chart */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
              <Activity className="mr-2 text-blue-400" size={20}/> Evolutionary Fitness (Multi-Objective)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer>
                <LineChart data={evolutionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="gen" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="Correctness" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Performance" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Security" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Readability" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart & Emergence Feed */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center">
                <Activity className="mr-2 text-blue-400" size={16}/> Current State vs Policy Target
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Current State" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Radar name="Policy Target" dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm h-[190px] overflow-hidden flex flex-col">
               <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center">
                <ShieldAlert className="mr-2 text-purple-400" size={16}/> Emergence Detector
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                {emergenceEvents.slice().reverse().map((ev, i) => (
                  <div key={i} className="text-xs bg-purple-500/10 border border-purple-500/20 p-2 rounded text-slate-300">
                    <span className="text-purple-400 font-bold">Gen {ev.gen}: [{ev.type}]</span> {ev.desc}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Audit Log */}
        <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-4 font-mono text-sm shadow-inner">
          <div className="flex items-center justify-between mb-2 text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center"><Terminal size={16} className="mr-2"/> Immutable Audit Log</span>
            <span className="text-xs">Tail: Last 20 lines</span>
          </div>
          <div className="h-40 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
            {logs.map((log, i) => (
              <div key={i} className="flex space-x-3">
                <span className="text-slate-500 w-24 flex-shrink-0">[{log.time}]</span>
                <span className={`flex-1 ${log.type === 'system' ? 'text-blue-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-slate-300'}`}>
                  {log.msg}
                </span>
              </div>
            ))}
            {/* Auto-scroll anchor could go here */}
          </div>
        </div>
      </div>
    );
  };

  const renderPhylogeny = () => {
    // A simplified visual representation of a git-like branch tree
    const branches = [
      { id: 'main', color: 'bg-emerald-500', nodes: [0, 1, 2, 3, 5, 8, 12, 15] },
      { id: 'exp-perf', color: 'bg-blue-500', nodes: [3, 4, 6, 7], parentNode: 3 },
      { id: 'exp-sec', color: 'bg-purple-500', nodes: [8, 9, 10, 11, 13, 14], parentNode: 8 },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-slate-100 mb-2 flex items-center">
            <GitMerge className="mr-3 text-emerald-400"/> Repository Genome & Phylogenetics
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Interactive visualization of evolutionary lineages. Only high-fitness, validated branches are promoted to the main lineage.
          </p>
          
          {/* Conceptual Tree Visualizer */}
          <div className="relative h-64 border border-slate-700/50 rounded-lg bg-slate-900/50 p-6 overflow-x-auto">
            <div className="min-w-[800px] relative h-full">
              {/* Branch lines */}
              <div className="absolute top-1/4 left-0 w-full h-1 bg-emerald-500/30"></div>
              <div className="absolute top-1/2 left-[20%] w-[30%] h-1 bg-blue-500/30 -rotate-12 transform origin-left"></div>
              <div className="absolute top-3/4 left-[50%] w-[40%] h-1 bg-purple-500/30 rotate-6 transform origin-left"></div>

              {/* Nodes representing EvolutionStates */}
              {[...
