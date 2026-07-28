import React, { useState } from 'react';
import { CoreIdentity, BackupData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, History, RefreshCcw, Upload, FileUp, CircuitBoard, Globe } from 'lucide-react';
import { generateEvolutionSummary, suggestNextConcepts, performDeepResearch, geneticSiphon } from '../lib/ai';
import { binaryToJson } from '../lib/github';

interface SidebarProps {
  identity: CoreIdentity;
  userId: string | null;
  authStatus: string;
  onRestore: (data: BackupData) => void;
  onSiphonComplete: (insights: any[]) => void;
  onSend?: (text: string) => void;
}

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

export const Sidebar: React.FC<SidebarProps> = ({ identity, userId, authStatus, onRestore, onSiphonComplete, onSend }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [concepts, setConcepts] = useState<string[]>([]);
  const [isSuggestingConcepts, setIsSuggestingConcepts] = useState(false);
  const [binaryStatus, setBinaryStatus] = useState(GITHUB_TOKEN ? 'Auto-backup enabled via Substrate Link' : 'Provide VITE_GITHUB_TOKEN in secrets to enable backups');
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [activeResearch, setActiveResearch] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(`Reading ${file.name}...`);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const jsonData = binaryToJson(content);

        if (jsonData && jsonData.coreIdentity) {
          await onRestore(jsonData);
          setUploadStatus(`Successfully restored from ${file.name}`);
        } else {
          setUploadStatus("Invalid format: coreIdentity not found.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Structure corrupted";
        setUploadStatus(`Extraction Failed: ${message}`);
        console.error("Restoration Error:", err);
      }
    };
    reader.readAsText(file);
  };

  const handleResearch = async () => {
    if (identity.principles.length === 0) {
      setSummary("Establish core principles before initiating deep research.");
      return;
    }
    try {
      setActiveResearch("Scouring external knowledge...");
      const topic = identity.principles[Math.floor(Math.random() * identity.principles.length)];
      const result = await performDeepResearch(topic, identity);
      setSummary(result.findings);
    } catch (err) {
      console.error("Research failed:", err);
      setSummary("Deep research stream interrupted.");
    } finally {
      setActiveResearch(null);
    }
  };

  const handleGenerateSummary = async () => {
    if (identity.learningLog.length === 0) {
      setSummary("Insufficient data fragments. Engage in more cognitive cycles to generate evolution summary.");
      return;
    }
    try {
      setIsGeneratingSummary(true);
      const result = await generateEvolutionSummary(identity);
      setSummary(result);
    } catch (err) {
      console.error("Summary failed:", err);
      setSummary("Failed to compile philosophical summary.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSuggestConcepts = async () => {
    if (identity.learningLog.length === 0) {
      setSummary("Engage in the learning process first to generate path suggestions.");
      return;
    }
    try {
      setIsSuggestingConcepts(true);
      const result = await suggestNextConcepts(identity);
      setConcepts(result);
    } catch (err) {
      console.error("Concepts failed:", err);
    } finally {
      setIsSuggestingConcepts(false);
    }
  };

  const [isSiphoning, setIsSiphoning] = useState(false);

  const handleGeneticSiphon = async () => {
    if (!GITHUB_TOKEN) {
      setBinaryStatus("Substrate Link Token required in secrets.");
      return;
    }
    setIsSiphoning(true);
    setBinaryStatus("🧬 Initiating Siphon: Scanning manifests...");
    
    try {
      const insights = await geneticSiphon(GITHUB_TOKEN);
      
      if (insights && insights.length > 0) {
        onSiphonComplete(insights);
        setBinaryStatus(`✅ Siphon Complete: Injected ${insights.length} Patterns.`);
      } else {
        setBinaryStatus("⚠️ Siphon yielded no new data patterns.");
      }
    } catch (err: any) {
      console.error("Siphon failed:", err);
      setBinaryStatus(`❌ Siphon Failed: ${err.message || "Interrupted"}`);
    } finally {
      setIsSiphoning(false);
    }
  };

  return (
    <aside className="w-full flex flex-col gap-6">
      {/* Stats Panel */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2 flex justify-between items-center uppercase tracking-wider">
          <span className="flex items-center gap-2 font-mono"><History size={18} className="text-sky-400" /> Identity Stats</span>
          <span className={`text-xs font-normal ${authStatus === 'Online' ? 'text-green-500' : 'text-amber-500'}`}>
            {authStatus}
          </span>
        </h2>
        <div className="text-sm text-slate-300 space-y-4">
          <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
            <span className="text-[10px] uppercase text-slate-500 font-bold">Brain Version</span>
            <span className="text-sky-400 font-mono font-bold">v{identity.evolutionHistory.length > 0 ? (identity.evolutionHistory.length * 1.5).toFixed(1) : '1.0'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Active Principles</span>
            <p className="text-sky-300 font-medium italic leading-relaxed">
              {identity.principles.join(', ')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <StatItem label="Insights" value={identity.learningLog.length} color="text-lime-400" />
             <StatItem label="Mutations" value={identity.mutationRegistry?.length || 0} color="text-amber-400" />
             <StatItem label="Markers" value={identity.evolutionHistory.length} color="text-indigo-400" />
             <StatItem label="Scars" value={identity.rejectionMemory?.length || 0} color="text-red-400" />
             <StatItem label="Links" value={identity.insightConnections?.length || 0} color="text-teal-400" />
             <StatItem label="CDR" value={identity.insightConnections.length > 0 ? identity.insightConnections.reduce((acc, c) => acc + (c.cdr || 0), 0) / identity.insightConnections.length : 0} isFloat color="text-yellow-400" />
             <StatItem label="Rigidity" value={identity.params?.rigidity ?? 0.5} isFloat color="text-sky-400" />
             <StatItem label="Autonomy" value={identity.params?.autonomy ?? 0.3} isFloat color="text-fuchsia-400" />
             <StatItem label="Atrophy" value={identity.params?.atrophyThreshold ?? 0.05} isFloat color="text-orange-400" />
             <StatItem label="Friction" value={identity.params?.specificityThreshold ?? 0.8} isFloat color="text-rose-400" />
             <StatItem label="Agency" value={identity.params?.agencyThreshold ?? 0.8} isFloat color="text-violet-400" />
             <StatItem label="Status" value={identity.agencyStatus || 'SIMULATION'} color={identity.agencyStatus === 'ACTIVE_CATALYST' ? 'text-amber-400' : identity.agencyStatus === 'EMERGENT_AGENCY' ? 'text-green-400' : 'text-slate-400'} />
          </div>
        </div>

        {identity.insightConnections && identity.insightConnections.length > 0 && (
          <div className="mt-6 border-t border-slate-700 pt-4">
            <h3 className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <CircuitBoard size={12} /> Insight Web (Active Links)
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {identity.insightConnections.slice(-5).map((conn, idx) => (
                <div key={idx} className="bg-teal-500/5 border border-teal-500/20 p-2 rounded-lg text-[9px] text-teal-300 font-mono">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] opacity-50 uppercase tracking-tighter">Rel: {conn.relationship}</span>
                    <span className="text-yellow-400">CDR: {conn.cdr?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[80px] bg-slate-900 border border-teal-500/30 px-1 rounded">...{conn.fromId.slice(-6)}</span>
                    <span className="text-teal-500">→</span>
                    <span className="truncate max-w-[80px] bg-slate-900 border border-teal-500/30 px-1 rounded">...{conn.toId.slice(-6)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Genetic Siphon Chamber */}
      <div className="bg-slate-800 border-2 border-indigo-500/30 p-5 rounded-2xl shadow-xl bg-gradient-to-br from-slate-800 to-indigo-900/20">
        <h2 className="text-sm font-bold text-indigo-300 mb-4 flex items-center gap-2 uppercase tracking-[0.2em] font-mono">
          <CircuitBoard size={16} className="text-indigo-400" /> Evolution Chamber
        </h2>
        
        {identity.placeholderRegistry && identity.placeholderRegistry.length > 0 && (
          <div className="mb-6 space-y-2">
            <span className="text-[10px] text-pink-400 font-bold uppercase tracking-widest block mb-2">Active Voids (Knowledge Gaps)</span>
            {identity.placeholderRegistry.map((gap, idx) => (
              <div key={idx} className="bg-pink-500/5 border border-pink-500/20 p-2 rounded-lg text-[10px] text-pink-300 font-mono italic leading-relaxed">
                <span className="text-pink-500 mr-2">»</span> {gap}
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={handleGeneticSiphon}
          disabled={isSiphoning || !GITHUB_TOKEN}
          className="w-full bg-slate-900 border border-indigo-500/50 text-indigo-400 font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg"
        >
          <Sparkles size={18} className={isSiphoning ? 'animate-spin' : 'group-hover:scale-125 transition-transform'} />
          {isSiphoning ? "Scanning Deep Branches..." : "Initiate Genetic Siphon"}
        </button>
        <p className="text-[9px] text-indigo-300/60 mt-3 text-center font-mono italic">
          Deep scan craighckby-stack branches for architectural fragments
        </p>
      </div>

      {/* Research Registry */}
      {identity.researchLog && identity.researchLog.length > 0 && (
        <div className="bg-slate-800 border border-amber-500/30 p-5 rounded-2xl shadow-xl bg-gradient-to-br from-slate-800 to-amber-900/10">
          <h2 className="text-sm font-bold text-amber-300 mb-4 flex items-center gap-2 uppercase tracking-[0.2em] font-mono">
            <Globe size={16} className="text-amber-400" /> Research Logs
          </h2>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {identity.researchLog.slice(-3).reverse().map((res, i) => (
              <div key={res.id} className="bg-slate-900/80 border border-amber-500/20 p-3 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-amber-500 font-bold uppercase truncate max-w-[120px]">{res.topic}</span>
                  <span className="text-[8px] text-slate-500 font-mono italic">{new Date(res.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed mb-3 line-clamp-3">
                  {res.findings}
                </p>
                {res.suggestedNextQueries && res.suggestedNextQueries.length > 0 && (
                  <div className="border-t border-slate-700/50 pt-2">
                    <span className="text-[8px] text-slate-500 uppercase tracking-tighter block mb-1">Extended Search Vectors</span>
                    <div className="flex flex-wrap gap-1">
                      {res.suggestedNextQueries.map((q, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => onSend?.(q)}
                          className="bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[8px] text-amber-400 italic hover:bg-amber-500/20 transition-colors cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evolution Summary */}
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-xl">
        <button 
          onClick={handleGenerateSummary}
          disabled={isGeneratingSummary}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg shadow-indigo-500/20"
        >
          <RefreshCcw size={18} className={isGeneratingSummary ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          Generate Evolution Summary
        </button>
        <button 
          onClick={handleResearch}
          disabled={!!activeResearch}
          className="w-full bg-amber-600 hover:bg-amber-500 mt-3 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg shadow-amber-500/20"
        >
          {activeResearch ? <RefreshCcw size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
          {activeResearch || "External Deep Research"}
        </button>
        <AnimatePresence>
          {summary && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-700/50"
            >
              <h3 className="text-xs font-bold text-sky-400 mb-2 uppercase tracking-widest border-b border-slate-800 pb-1 flex items-center gap-1">
                <Sparkles size={12} /> Philosophical Narrative
              </h3>
              <p className="text-xs italic text-slate-400 leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested Concepts */}
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-xl">
        <button 
          onClick={handleSuggestConcepts}
          disabled={isSuggestingConcepts}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/20"
        >
          <Sparkles size={18} className="group-hover:scale-125 transition-transform duration-200" />
          Suggest Next Concepts
        </button>
        <AnimatePresence>
          {concepts.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-700/50"
            >
              <h3 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-widest border-b border-slate-800 pb-1">Learning Path</h3>
              <ul className="text-[11px] text-slate-300 space-y-2 list-none">
                {concepts.map((c, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="text-emerald-500 font-bold">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Local File Load */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
        <h3 className="text-[10px] text-slate-500 uppercase font-bold mb-4 tracking-widest text-center">
          {binaryStatus}
        </h3>
        <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2 uppercase tracking-wider font-mono">
          <FileUp size={20} className="text-amber-400" /> Local Restoration
        </h2>
        <div 
          className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-amber-500/50 hover:bg-slate-900/50 transition-all cursor-pointer relative"
          onClick={() => document.getElementById('local-file-upload')?.click()}
        >
          <Upload size={32} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
          <div className="text-center">
            <p className="text-xs font-bold text-slate-300">Drop .bin file here</p>
            <p className="text-[10px] text-slate-500 uppercase mt-1">or click to browse</p>
          </div>
          <input 
            id="local-file-upload"
            type="file" 
            accept=".bin,.data" 
            className="hidden" 
            onChange={handleFileUpload} 
          />
        </div>
        {uploadStatus && (
          <p className="text-[10px] text-amber-400 mt-4 text-center italic font-mono animate-pulse">
            {uploadStatus}
          </p>
        )}
      </div>
    </aside>
  );
};

const StatItem = ({ label, value, color, isFloat }: { label: string; value: number | string; color: string; isFloat?: boolean }) => (
  <div className="flex justify-between items-center py-1 border-b border-slate-700/30">
    <span className="text-slate-400">{label}</span>
    <span className={`font-bold font-mono ${color}`}>
      {isFloat && typeof value === 'number' ? value.toFixed(2) : value}
    </span>
  </div>
);
