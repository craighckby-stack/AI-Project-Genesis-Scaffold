import React, { useState, useEffect, useMemo } from 'react';
import { Terminal, Cpu, Database, LayoutDashboard, Code2, LucideIcon, Activity, ShieldCheck, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { CODE_FILES } from './constants';
import { Fact, Directive } from './types';

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: LucideIcon;
}

interface DataPanelProps {
  title: string;
  icon: LucideIcon;
  data: unknown[];
  emptyMsg: string;
}

const formatUptime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, label, icon: Icon }) => (
  <button 
    onClick={onClick}
    role="tab"
    aria-selected={active}
    className={`flex items-center gap-2 px-4 py-2 transition-all duration-200 border-b-2 font-bold uppercase tracking-tighter ${
      active 
        ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10' 
        : 'text-emerald-800 border-transparent hover:text-emerald-600 hover:bg-emerald-900/10'
    }`}
  >
    <Icon size={14} />
    <span className="text-xs">{label}</span>
  </button>
);

const DataPanel: React.FC<DataPanelProps> = ({ title, icon: Icon, data, emptyMsg }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <section className="flex flex-col border border-emerald-900/50 bg-slate-900/40 backdrop-blur-sm h-[600px] shadow-2xl">
      <div className="flex items-center gap-2 p-3 border-b border-emerald-900/50 bg-emerald-950/20">
        <Icon size={16} className="text-emerald-500" />
        <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{title}</h2>
        <button onClick={triggerRefresh} className="ml-auto hover:text-emerald-300 transition-colors">
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {data.length > 0 ? (
          <pre className="text-[11px] text-emerald-300 leading-relaxed font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-emerald-800 text-xs italic gap-2">
            <AlertTriangle size={24} className="opacity-20" />
            {emptyMsg}
          </div>
        )}
      </div>
    </section>
  );
};

const SimulationView: React.FC<{ facts: Fact[]; directives: Directive[] }> = ({ facts, directives }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
    <DataPanel title="Memory State" icon={Database} data={facts} emptyMsg="// NO NEURAL TRACES DETECTED" />
    <DataPanel title="System Directives" icon={Cpu} data={directives} emptyMsg="// NO ACTIVE DIRECTIVES IN QUEUE" />
  </div>
);

const SourceView: React.FC = () => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
    {Object.entries(CODE_FILES).map(([key, content]) => (
      <article key={key} className="border border-emerald-900/30 bg-black/20">
        <div className="bg-emerald-950/30 px-4 py-1 border-b border-emerald-900/30 flex justify-between items-center">
          <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{key}</h3>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-900" />
            <div className="w-2 h-2 rounded-full bg-emerald-700" />
          </div>
        </div>
        <pre className="text-[11px] p-4 overflow-x-auto text-emerald-200/80 leading-tight selection:bg-emerald-500/30">
          {content}
        </pre>
      </article>
    ))}
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'source'>('simulation');
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const memoizedUptime = useMemo(() => formatUptime(uptime), [uptime]);

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-500 font-mono flex flex-col">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] z-50" />
      <header className="border-b border-emerald-900/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
              <Terminal className="text-emerald-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
                DARLEK_CANN <span className="text-emerald-800 text-xs font-normal">v2.0.4-EVOLVE</span>
              </h1>
              <div className="flex items-center gap-3 text-[10px] text-emerald-700">
                <span className="flex items-center gap-1"><Activity size={10} /> SYSTEM_READY</span>
                <span className="flex items-center gap-1"><ShieldCheck size={10} /> ENCRYPTION_ACTIVE</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {memoizedUptime}</span>
              </div>
            </div>
          </div>
          <nav className="flex bg-black/40 p-1 rounded border border-emerald-900/30" role="tablist">
            <NavButton active={activeTab === 'simulation'} onClick={() => setActiveTab('simulation')} label="Simulation" icon={LayoutDashboard} />
            <NavButton active={activeTab === 'source'} onClick={() => setActiveTab('source')} label="Source Code" icon={Code2} />
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'simulation' ? <SimulationView facts={[]} directives={[]} /> : <SourceView />}
      </main>
      <footer className="p-6 border-t border-emerald-900/20 text-[10px] text-emerald-900 text-center">
        [SYSTEM_LOG_END] :: DARLEK_CANN_SYNTHESIZER_ACTIVE
      </footer>
    </div>
  );
};

export default App;















