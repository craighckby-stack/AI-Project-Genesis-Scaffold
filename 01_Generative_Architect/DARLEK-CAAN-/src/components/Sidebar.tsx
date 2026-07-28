import { Volume } from "../types";
import { ChevronRight, Plus, Terminal, Zap } from "lucide-react";

interface SidebarProps {
  volumes: Volume[];
  onSelectCapability: (id: string) => void;
  selectedCapabilityId?: string;
  onAddSnippet: () => void;
}

export default function Sidebar({ volumes, onSelectCapability, selectedCapabilityId, onAddSnippet }: SidebarProps) {
  return (
    <aside className="w-full h-full bg-[#050000] flex flex-col font-mono text-red-500 border-r border-red-900/30">
      <div className="p-6 border-b border-red-900/50 flex items-center justify-between bg-black">
        <div className="flex items-center gap-3">
          <Terminal className="text-red-600" size={24} />
          <div>
            <h1 className="font-display text-xl font-bold tracking-tighter text-red-500 uppercase glitch">
              DARLEK CAAN
            </h1>
            <p className="text-[10px] text-red-700 mt-1 tracking-widest uppercase">System Core v4.0</p>
          </div>
        </div>
        <button 
          onClick={onAddSnippet}
          className="hidden md:flex p-1.5 text-black bg-red-600 hover:bg-red-500 transition-colors shadow-[0_0_10px_rgba(220,38,38,0.3)]"
          title="Inject Mutation"
        >
          <Plus size={18} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto terminal-scroll">
        {volumes.map((volume) => (
          <div key={volume.name} className="space-y-3">
            <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-red-800 border-b border-red-900/30 pb-2">
              <Zap size={12} className="text-red-600" />
              {volume.name}
            </div>
            
            <div className="space-y-4">
              {volume.chapters.map((chapter) => (
                <div key={chapter.name} className="space-y-1">
                  <h3 className="px-3 text-xs font-semibold text-red-500/80 uppercase tracking-wider mb-2">
                    {chapter.name}
                  </h3>
                  <div className="space-y-0.5">
                    {chapter.capabilities.map((id) => (
                      <button
                        key={id}
                        onClick={() => onSelectCapability(id)}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-all flex items-center justify-between group uppercase tracking-wider ${
                          selectedCapabilityId === id
                            ? "bg-red-900/30 text-red-400 font-bold border-l-2 border-red-500"
                            : "text-red-700 hover:bg-red-900/10 hover:text-red-500 border-l-2 border-transparent"
                        }`}
                      >
                        <span className="truncate">{id.split('-').join(' ')}</span>
                        <ChevronRight 
                          size={14} 
                          className={`shrink-0 transition-transform duration-200 ${
                            selectedCapabilityId === id ? "translate-x-0 text-red-500" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 text-red-700"
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-red-900/50 bg-black">
        <div className="bg-[#0a0000] p-3 border border-red-900/30 flex items-center justify-between">
          <p className="text-[10px] font-mono text-red-700 uppercase tracking-widest">Core Status</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-600 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">ONLINE</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
