import { Capability } from "../types";
import { GitBranch, Clock, FileCode, Search, Terminal } from "lucide-react";
import Markdown from "react-markdown";

interface CapabilityDetailsProps {
  capability: Capability;
}

export default function CapabilityDetails({ capability }: CapabilityDetailsProps) {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 font-mono text-red-500">
      <div className="space-y-4 bg-black p-6 border border-red-900/50 relative">
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-600 m-2 opacity-50"></div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-700">
          <Terminal size={12} />
          {capability.volumeId} / {capability.chapterId}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tighter text-red-500 uppercase glitch">
          {capability.name}
        </h1>
        <p className="text-sm text-red-400 leading-relaxed max-w-3xl">
          {capability.purpose}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-red-900/50 pb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-red-500 flex items-center gap-2">
            <GitBranch size={16} />
            Implementation Lineage
          </h2>
          <span className="text-xs text-red-700 bg-[#1a0000] px-2 py-1 uppercase tracking-widest border border-red-900/30">
            {capability.implementations.length} {capability.implementations.length === 1 ? 'Variant' : 'Variants'}
          </span>
        </div>

        <div className="space-y-8">
          {capability.implementations.map((impl, index) => (
            <div key={index} className="bg-black border border-red-900/50 hover:border-red-600/50 transition-colors shadow-[0_0_15px_rgba(255,0,0,0.05)]">
              <div className="bg-[#0a0000] border-b border-red-900/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-none bg-[#1a0000] flex items-center justify-center border border-red-900/50 text-red-500">
                    <FileCode size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-red-400">{impl.context}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-red-700 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Search size={10} /> {impl.sourceRepo}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {impl.sourceFile}</span>
                    </div>
                  </div>
                </div>
                {impl.language && (
                  <div className="shrink-0 px-2 py-1 bg-red-900/20 text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-900/30">
                    {impl.language}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-[#050000] overflow-x-auto text-sm border-b border-red-900/30">
                <pre className="text-red-300 font-mono text-xs">
                  <code>{impl.codeSnippet}</code>
                </pre>
              </div>

              {impl.explanation && (
                <div className="p-4 bg-[#0a0000] text-xs text-red-400 leading-relaxed border-t border-red-900/30">
                  <div className="prose prose-invert prose-p:text-red-400 prose-a:text-red-500 prose-code:text-red-300 prose-headings:text-red-500 max-w-none">
                    <Markdown>{impl.explanation}</Markdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
