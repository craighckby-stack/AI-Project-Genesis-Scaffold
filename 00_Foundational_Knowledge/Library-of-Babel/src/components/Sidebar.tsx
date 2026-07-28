/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Volume } from "../types";
import { Book, ChevronRight, Plus } from "lucide-react";

interface SidebarProps {
  volumes: Volume[];
  onSelectCapability: (id: string) => void;
  selectedCapabilityId?: string;
  onAddSnippet: () => void;
}

export default function Sidebar({ volumes, onSelectCapability, selectedCapabilityId, onAddSnippet }: SidebarProps) {
  return (
    <aside className="w-full h-full bg-white flex flex-col">
      <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
            Encyclopedia
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Engineering Capabilities</p>
        </div>
        <button 
          onClick={onAddSnippet}
          className="hidden md:flex p-2 text-white bg-neutral-900 rounded-full hover:bg-neutral-800 transition-colors shadow-sm"
          title="Index Snippet"
        >
          <Plus size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-8">
        {volumes.map((volume) => (
          <div key={volume.name} className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-widest text-neutral-400">
              <Book size={14} />
              {volume.name}
            </div>
            
            <div className="space-y-6">
              {volume.chapters.map((chapter) => (
                <div key={chapter.name} className="space-y-1">
                  <h3 className="px-3 text-sm font-semibold text-neutral-800">
                    {chapter.name}
                  </h3>
                  <div className="space-y-0.5">
                    {chapter.capabilities.map((id) => (
                      <button
                        key={id}
                        onClick={() => onSelectCapability(id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all flex items-center justify-between group ${
                          selectedCapabilityId === id
                            ? "bg-neutral-100 text-neutral-900 font-medium"
                            : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
                        }`}
                      >
                        <span className="truncate">{id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                        <ChevronRight 
                          size={14} 
                          className={`shrink-0 transition-transform duration-200 ${
                            selectedCapabilityId === id ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
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
      
      <div className="p-6 border-t border-neutral-100">
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-tighter">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-neutral-600">Reference Engine Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
