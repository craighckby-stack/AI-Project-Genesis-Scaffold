import { Capability } from "../types";
import { GitBranch, Clock, FileCode, Search, Terminal, Info, Milestone, Sparkles } from "lucide-react";
import Markdown from "react-markdown";

interface CapabilityDetailsProps {
  capability: Capability;
}

export default function CapabilityDetails({ capability }: CapabilityDetailsProps) {
  // Safe extraction of variants
  const variants = capability.variants || [];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 font-sans text-slate-100">
      {/* Header Info Banner */}
      <div className="space-y-4 bg-slate-900/60 backdrop-blur-md p-6 md:p-8 border border-slate-800/60 shadow-[0_0_30px_rgba(192,38,211,0.1)] rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-600 to-indigo-600"></div>
        <div className="absolute top-0 right-0 w-12 h-12 bg-fuchsia-900/30 rounded-tr-2xl rounded-bl-3xl flex items-center justify-center text-fuchsia-400 border-b border-l border-fuchsia-800/30">
          <Terminal size={18} />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">
          <span>{capability.volume}</span>
          <span>/</span>
          <span>{capability.chapter}</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
          {capability.name}
        </h1>
        <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl font-light">
          {capability.purpose}
        </p>

        {/* Quick Insights Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-6 border-t border-slate-800/50">
          <div className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl space-y-2 shadow-inner hover:border-fuchsia-500/30 transition-colors">
            <h4 className="text-xs font-bold font-mono text-fuchsia-400 uppercase tracking-widest flex items-center gap-1.5">
              <Info size={14} className="text-fuchsia-500" /> Why It Exists
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              {capability.whyItExists}
            </p>
          </div>
          <div className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl space-y-2 shadow-inner hover:border-indigo-500/30 transition-colors">
            <h4 className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Milestone size={14} className="text-indigo-500" /> Historical Evolution
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              {capability.evolution}
            </p>
          </div>
        </div>
      </div>

      {/* Code Implementations */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <h2 className="text-sm font-bold font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <GitBranch size={16} className="text-fuchsia-500" />
            Syntactic Implementations & Lineage
          </h2>
          <span className="text-xs font-mono text-fuchsia-300 bg-fuchsia-950/30 border border-fuchsia-900/50 px-3 py-1.5 rounded-full shadow-sm shadow-fuchsia-900/20">
            {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'} Found
          </span>
        </div>

        <div className="space-y-8">
          {variants.map((v, index) => {
            const chunk = v.chunk;
            if (!chunk) return null;

            return (
              <div 
                key={chunk.id || index} 
                className="bg-slate-900/60 border border-slate-800/60 rounded-2xl shadow-xl overflow-hidden hover:shadow-[0_0_20px_rgba(192,38,211,0.15)] hover:border-slate-700 transition-all"
              >
                {/* Header for implementation card */}
                <div className="bg-slate-950/60 border-b border-slate-800/60 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 shadow-inner text-indigo-400">
                      <FileCode size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-200">{chunk.name || "Canonical Source"}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Search size={11} className="text-slate-600" /> {chunk.repo || chunk.sourceRepo || "encyclopedia-tool"}
                        </span>
                        <span className="hidden md:inline text-slate-700">•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-slate-600" /> {chunk.file}
                        </span>
                      </div>
                    </div>
                  </div>
                  {chunk.mismatch && (
                    <div className="shrink-0 px-3 py-1 bg-fuchsia-950/30 text-fuchsia-400 text-[10px] font-bold uppercase tracking-widest border border-fuchsia-900/50 rounded-full font-mono shadow-sm">
                      {chunk.mismatch}
                    </div>
                  )}
                </div>
                
                {/* Code display with sleek design */}
                <div className="p-6 bg-slate-950 overflow-x-auto border-b border-slate-900 shadow-inner">
                  <pre className="text-indigo-300 font-mono text-[11px] leading-relaxed tracking-wide">
                    <code>{chunk.code}</code>
                  </pre>
                </div>

                {/* Optional docstring / description */}
                {chunk.docstring && (
                  <div className="p-5 bg-slate-900/40 text-xs text-slate-400 leading-relaxed font-light border-t border-slate-800/60 font-sans">
                    <div className="flex items-start gap-2 max-w-none">
                      <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                      <div className="space-y-1.5">
                        <p className="font-semibold text-slate-300 font-display tracking-wide">Semantic Engine Analysis:</p>
                        <p className="text-slate-400">{chunk.docstring}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

