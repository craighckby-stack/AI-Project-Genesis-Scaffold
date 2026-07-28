import { Volume } from "../types";
import { ChevronRight, Plus, Library, Zap, BookOpen } from "lucide-react";

interface SidebarProps {
  volumes: Volume[];
  onSelectCapability: (id: string) => void;
  selectedCapabilityId?: string;
  onAddSnippet: () => void;
}

export default function Sidebar({ volumes, onSelectCapability, selectedCapabilityId, onAddSnippet }: SidebarProps) {
  return (
    <aside className="w-full h-full bg-white flex flex-col border-r border-slate-100 shadow-sm font-sans">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 flex items-center justify-center text-white rounded-xl shadow-sm">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="font-display text-base font-extrabold tracking-tight text-slate-900 leading-none">
              ENCYCLOPEDIA
            </h1>
            <p className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-wider">
              Engineering Core v4.0
            </p>
          </div>
        </div>
        <button 
          onClick={onAddSnippet}
          className="flex p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-colors rounded-xl border border-slate-100"
          title="Manual Capability Injection"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Nav Content */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {volumes.map((volume) => (
          <div key={volume.name} className="space-y-3">
            <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
              <Library size={12} className="text-slate-400" />
              {volume.name}
            </div>
            
            <div className="space-y-4">
              {volume.chapters.map((chapter) => (
                <div key={chapter.name} className="space-y-1">
                  <h3 className="px-3 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {chapter.name}
                  </h3>
                  <div className="space-y-1">
                    {chapter.capabilities.map((id) => (
                      <button
                        key={id}
                        onClick={() => onSelectCapability(id)}
                        className={`w-full text-left px-3 py-2 text-xs transition-all flex items-center justify-between group rounded-lg ${
                          selectedCapabilityId === id
                            ? "bg-slate-900 text-white font-medium shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span className="truncate capitalize">{id.split('-').join(' ')}</span>
                        <ChevronRight 
                          size={12} 
                          className={`shrink-0 transition-transform duration-200 ${
                            selectedCapabilityId === id ? "translate-x-0 text-white" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 text-slate-400"
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
      
      {/* Bottom Status Block */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white p-3 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Analysis Engine</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider">Idle</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
