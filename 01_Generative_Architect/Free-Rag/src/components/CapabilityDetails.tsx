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
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 font-sans text-slate-800">
      {/* Header Info Banner */}
      <div className="space-y-4 bg-white p-6 md:p-8 border border-slate-100 shadow-sm rounded-2xl relative">
        <div className="absolute top-0 right-0 w-12 h-12 bg-sky-50 rounded-tr-2xl rounded-bl-3xl flex items-center justify-center text-sky-600">
          <Terminal size={18} />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
          <span>{capability.volume}</span>
          <span>/</span>
          <span>{capability.chapter}</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          {capability.name}
        </h1>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-3xl">
          {capability.purpose}
        </p>

        {/* Quick Insights Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50/50 rounded-xl space-y-2">
            <h4 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Info size={14} className="text-sky-500" /> Why It Exists
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {capability.whyItExists}
            </p>
          </div>
          <div className="p-4 bg-slate-50/50 rounded-xl space-y-2">
            <h4 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Milestone size={14} className="text-sky-500" /> Historical Evolution
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {capability.evolution}
            </p>
          </div>
        </div>
      </div>

      {/* Code Implementations */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-sm font-bold font-mono uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <GitBranch size={16} className="text-sky-500" />
            Syntactic Implementations & Lineage
          </h2>
          <span className="text-xs font-mono text-slate-400 bg-white border border-slate-100 px-2.5 py-1 rounded-full shadow-sm">
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
                className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header for implementation card */}
                <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm text-sky-600">
                      <FileCode size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{chunk.name || "Canonical Source"}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Search size={11} className="text-slate-300" /> {chunk.repo || chunk.sourceRepo || "encyclopedia-tool"}
                        </span>
                        <span className="hidden md:inline text-slate-200">•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-slate-300" /> {chunk.file}
                        </span>
                      </div>
                    </div>
                  </div>
                  {chunk.mismatch && (
                    <div className="shrink-0 px-2.5 py-1 bg-sky-50 text-sky-600 text-[10px] font-bold uppercase tracking-widest border border-sky-100 rounded-full font-mono">
                      {chunk.mismatch}
                    </div>
                  )}
                </div>
                
                {/* Code display with sleek design */}
                <div className="p-5 bg-slate-950 overflow-x-auto border-b border-slate-900">
                  <pre className="text-emerald-400 font-mono text-xs leading-relaxed">
                    <code>{chunk.code}</code>
                  </pre>
                </div>

                {/* Optional docstring / description */}
                {chunk.docstring && (
                  <div className="p-4 bg-slate-50/30 text-xs text-slate-600 leading-relaxed border-t border-slate-100 font-sans">
                    <div className="flex items-start gap-2 max-w-none">
                      <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-700">Semantic Engine Analysis:</p>
                        <p className="text-slate-500">{chunk.docstring}</p>
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
