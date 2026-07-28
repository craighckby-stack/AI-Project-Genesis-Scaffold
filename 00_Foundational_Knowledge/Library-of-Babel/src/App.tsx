/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { EncyclopediaData, Capability } from "./types";
import Sidebar from "./components/Sidebar";
import CapabilityDetails from "./components/CapabilityDetails";
import SnippetModal from "./components/SnippetModal";
import GitHubSyncModal from "./components/GitHubSyncModal";
import { Search, Compass, BookOpen, Clock, Layers, History, Plus, Github, RefreshCw } from "lucide-react";

export default function App() {
  const [data, setData] = useState<EncyclopediaData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [autoSyncState, setAutoSyncState] = useState<any>(null);

  useEffect(() => {
    const checkSync = () => {
      fetch("/api/github/auto-sync/status")
        .then(res => res.json())
        .then(data => setAutoSyncState(data))
        .catch(() => {});
    };
    checkSync();
    const interval = setInterval(checkSync, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartAutoSync = async () => {
    try {
      await fetch("/api/github/auto-sync/start", { method: "POST" });
      setIsGithubModalOpen(true);
    } catch (err) {}
  };


  useEffect(() => {
    fetch("/api/encyclopedia")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      })
      .catch(console.error);
  }, [refreshKey]);

  if (!data) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div 
          className="font-display text-xl font-bold text-neutral-400 animate-pulse"
        >
          Initializing Encyclopedia...
        </div>
      </div>
    );
  }

  const selectedCapability = selectedId ? data.capabilities[selectedId] : null;

  const filteredVolumes = data.volumes.map(volume => ({
    ...volume,
    chapters: volume.chapters.map(chapter => ({
      ...chapter,
      capabilities: chapter.capabilities.filter(id => {
        const cap = data.capabilities[id];
        if (!cap) return false;
        return cap.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               cap.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
               id.toLowerCase().includes(searchQuery.toLowerCase());
      })
    })).filter(chapter => chapter.capabilities.length > 0)
  })).filter(volume => volume.chapters.length > 0);

  const handleSnippetSuccess = (capabilityId: string) => {
    setIsModalOpen(false);
    setRefreshKey(k => k + 1);
    setSelectedId(capabilityId);
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-neutral-200 h-screen overflow-y-auto bg-white flex-col`}>
        <Sidebar 
          volumes={filteredVolumes} 
          onSelectCapability={setSelectedId} 
          selectedCapabilityId={selectedId || undefined}
          onAddSnippet={() => setIsModalOpen(true)}
        />
      </div>

      <main className={`flex-1 min-w-0 overflow-y-auto relative ${selectedId ? 'block' : 'hidden md:block'}`}>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-neutral-100 h-16 flex items-center justify-between px-4 md:px-12">
          <div className="flex items-center flex-1 max-w-lg">
            {selectedId && (
              <button 
                onClick={() => setSelectedId(null)}
                className="md:hidden mr-3 p-2 -ml-2 text-neutral-500 hover:text-neutral-900"
              >
                <Compass size={20} className="rotate-90" />
              </button>
            )}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search capabilities, concepts..."
                className="w-full bg-neutral-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-neutral-200 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-4">

            <button
              onClick={handleStartAutoSync}
              disabled={autoSyncState?.isActuallyRunning}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {autoSyncState?.isActuallyRunning ? <span className="flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Syncing...</span> : <span className="flex items-center gap-2"><Layers size={16} /> Sync All</span>}
            </button>

            <button 
              onClick={() => setIsGithubModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-sm"
            >
              <Github size={16} />
              <span className="hidden md:inline">GitHub Sync</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="md:hidden p-2 text-neutral-900 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        <div className="h-full">
          {selectedCapability ? (
            <div key={selectedId}>
              <CapabilityDetails capability={selectedCapability} />
            </div>
          ) : (
            <div 
              className="h-full flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="max-w-2xl space-y-12">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-white border border-neutral-100 shadow-sm rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <BookOpen size={32} className="text-neutral-900" />
                  </div>
                  <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">
                    The Encyclopedia of Engineering
                  </h1>
                  <p className="text-lg text-neutral-500 leading-relaxed">
                    A semantic archive of engineering knowledge. Select a volume from the sidebar to explore implementations, evolution, and provenance of technical capabilities.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="p-6 bg-white border border-neutral-100 rounded-2xl space-y-3">
                    <Compass size={20} className="text-neutral-900" />
                    <h4 className="font-bold text-sm">Semantic Mapping</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">Organized by engineering concepts rather than project names or repository boundaries.</p>
                  </div>
                  <div className="p-6 bg-white border border-neutral-100 rounded-2xl space-y-3">
                    <Layers size={20} className="text-neutral-900" />
                    <h4 className="font-bold text-sm">Implementation Variants</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">Compare every version ever written. Identify the best implementation for your current context.</p>
                  </div>
                  <div className="p-6 bg-white border border-neutral-100 rounded-2xl space-y-3">
                    <History size={20} className="text-neutral-900" />
                    <h4 className="font-bold text-sm">Provenance Backed</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">Strict lineage tracking ensures every snippet is mapped back to its original source repository.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <SnippetModal 
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSnippetSuccess}
        />
      )}

      {isGithubModalOpen && (
        <GitHubSyncModal 
          onClose={() => setIsGithubModalOpen(false)}
        />
      )}
    </div>
  );
}
