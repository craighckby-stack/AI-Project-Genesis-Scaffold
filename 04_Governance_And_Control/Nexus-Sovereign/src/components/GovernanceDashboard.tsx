import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine
} from 'recharts';
import { 
  Activity, Lock, Settings2, ShieldAlert, TrendingUp, RefreshCw
} from 'lucide-react';
import { orchestrator } from '../core/AGIOrchestrator';

const GovernanceDashboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [gameState, setGameState] = useState(orchestrator.getState());

  useEffect(() => {
    // Initial data generation for historical view
    const history = [];
    let prevH = 0.8;
    for (let i = 0; i < 45; i++) {
      const h = Math.max(0.4, prevH + (Math.random() * 0.1 - 0.05));
      history.push({
        cycle: i,
        h: Number(h.toFixed(4)),
        entropy: Number((1 - h + 0.1).toFixed(4)),
        timestamp: new Date().toLocaleTimeString()
      });
      prevH = h;
    }
    setData(history);
  }, []);

  // Update game state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(orchestrator.getState());
      setData(prev => {
        const last = prev[prev.length - 1];
        const nextH = orchestrator.getState().integrity;
        return [...prev, {
          cycle: last.cycle + 1,
          h: Number(nextH.toFixed(4)),
          entropy: Number(orchestrator.getState().entropy.toFixed(4)),
          timestamp: new Date().toLocaleTimeString()
        }].slice(-50);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const executeCalibration = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-olive" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-12 font-sans bg-natural-bg">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-olive font-semibold tracking-widest uppercase text-xs mb-3 block opacity-60 italic">MaRS Protocol v11.4</span>
          <h1 className="serif text-5xl tracking-tight text-natural-text mb-2">
            Governance <i className="italic font-light">& Stability</i> Layer
          </h1>
          <p className="text-natural-text/60 text-sm max-w-md">
            Monitoring recursive divergence and managing control vectors for optimal kernel integrity.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="natural-card bg-white py-3 px-6 flex items-center gap-4">
             <div className="flex flex-col">
               <span className="text-[8px] font-bold text-olive/40 uppercase tracking-widest leading-none">System Load</span>
               <span className="text-xl serif text-natural-text">{gameState.cycle} <span className="text-[10px] opacity-40">CYCLES</span></span>
             </div>
             <div className="w-[1px] h-8 bg-olive/10 mx-2" />
             <div className="flex flex-col">
               <span className="text-[8px] font-bold text-olive/40 uppercase tracking-widest leading-none">Status</span>
               <span className="text-xl serif text-emerald-600 uppercase tracking-tighter">{gameState.mode}</span>
             </div>
          </div>
          <button 
            onClick={executeCalibration}
            disabled={isSyncing}
            className="natural-btn-primary flex items-center gap-2 group"
          >
            <Settings2 size={16} className={isSyncing ? "animate-spin" : "group-hover:rotate-90 transition-transform"} />
            {isSyncing ? "Syncing Logic..." : "Calibrate Vector"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Chart */}
          <div className="natural-card p-10 bg-white shadow-2xl border-none">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="serif text-3xl text-natural-text">Integrity Trajectory</h2>
                <p className="text-[10px] text-natural-text/40 font-mono mt-1 uppercase tracking-[0.3em]">H-Vector Spectral Persistence</p>
              </div>
              <div className="bg-olive/5 px-4 py-1.5 rounded-full border border-olive/10 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-olive uppercase tracking-widest italic">Live Telemetry</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorH" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5df" />
                  <XAxis dataKey="cycle" hide />
                  <YAxis domain={[0, 1.2]} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e5e5df', boxShadow: '0 8px 30px rgba(90,90,64,0.08)', background: '#fff' }} 
                    itemStyle={{ fontSize: '11px', color: '#5A5A40', textTransform: 'uppercase' }}
                  />
                  <ReferenceLine y={0.5} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'right', value: 'CRITICAL_DRIFT', fill: '#ef4444', fontSize: 9 }} />
                  <Area type="monotone" dataKey="h" stroke="#5A5A40" fill="url(#colorH)" strokeWidth={3} animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="natural-card bg-white p-8">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="serif text-xl border-b-2 border-olive pb-1">Entropy Load</h3>
                   <TrendingUp className="text-olive/20" size={24} />
                </div>
                <div className="text-5xl serif text-natural-text mb-4">{(gameState.entropy * 100).toFixed(2)}%</div>
                <div className="h-2 w-full bg-olive/5 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-olive/80 transition-all duration-1000" 
                     style={{ width: `${gameState.entropy * 100}%` }}
                   />
                </div>
                <p className="text-[10px] text-natural-text/40 mt-4 uppercase tracking-widest">Spectral Chaos Coefficient</p>
             </div>
             
             <div className="natural-card bg-[#2d2d2a] p-8 text-white/90 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                  <ShieldAlert size={120} />
                </div>
                <div className="relative z-10">
                   <div className="flex items-center gap-2 text-olive font-bold text-[10px] mb-4 tracking-[0.2em] uppercase">
                     <Lock size={12} />
                     <span>Active Advisory</span>
                   </div>
                   <p className="serif text-xl leading-relaxed italic mb-6">
                     {gameState.mode === 'CRISIS' 
                       ? "Immediate governance override recommended. Entropy levels exceeding θ-safety." 
                       : "System synchronized. No logic skews detected in the current evolution batch."}
                   </p>
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Protocol Integrity: 0.99988</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="natural-card p-8 bg-white text-natural-text">
             <h3 className="serif text-xl border-b border-olive/10 pb-4 mb-6">System Log</h3>
             <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-olive/10">
                {orchestrator.getState().log.slice(-10).reverse().map((entry, idx) => (
                  <div key={idx} className="flex gap-4 items-start group">
                     <span className="text-[9px] font-mono opacity-30 mt-1 shrink-0">#{idx}</span>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-bold text-olive uppercase tracking-tighter group-hover:bg-olive/5 transition-colors">{entry.split(':')[0]}</span>
                        <p className="text-[11px] leading-relaxed opacity-60">{entry.split(':')[1] || 'Executing nexus handshake.'}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="natural-card bg-olive p-10 text-white shadow-2xl relative group overflow-hidden">
             <div className="relative z-10">
               <h4 className="serif text-2xl mb-4 italic">Neural Grounding</h4>
               <p className="text-xs leading-relaxed opacity-70 mb-8 font-light">
                 Ensuring that all recursive expansion remains grounded in the sovereign constitution and humanitarian safety protocols.
               </p>
               <button className="w-full bg-white text-olive py-4 rounded-full font-bold text-xs uppercase tracking-widest shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all">
                  Audit Governance
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceDashboard;
