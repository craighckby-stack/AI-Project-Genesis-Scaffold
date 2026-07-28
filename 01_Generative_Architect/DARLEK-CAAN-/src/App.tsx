import { useState, useEffect } from "react";
import { EncyclopediaData } from "./types";
import Sidebar from "./components/Sidebar";
import CapabilityDetails from "./components/CapabilityDetails";
import SnippetModal from "./components/SnippetModal";
import GitHubSyncModal from "./components/GitHubSyncModal";
import { BookOpen, Search, Plus, Compass, Layers, Github, RefreshCw, ShieldAlert, Cpu } from "lucide-react";

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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black terminal-scanline">
        <Cpu size={48} className="text-red-600 mb-6 animate-pulse" />
        <div className="font-mono text-xl font-bold text-red-500 animate-pulse uppercase tracking-widest glitch">
          INITIALIZING DARLEK CAAN KERNEL...
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
    <div className="flex h-screen bg-black overflow-hidden terminal-scanline text-red-500 font-mono">
      <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-[340px] shrink-0 border-r border-red-900/50 h-screen overflow-y-auto bg-black flex-col`}>
        <Sidebar 
          volumes={filteredVolumes} 
          onSelectCapability={setSelectedId} 
          selectedCapabilityId={selectedId || undefined}
          onAddSnippet={() => setIsModalOpen(true)}
        />
      </div>

      <main className={`flex-1 min-w-0 overflow-y-auto relative bg-[#050000] ${selectedId ? 'block' : 'hidden md:block'}`}>
        <header className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-red-900/50 h-16 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center flex-1 max-w-lg">
            {selectedId && (
              <button 
                onClick={() => setSelectedId(null)}
                className="md:hidden mr-3 p-2 -ml-2 text-red-500 hover:text-red-400"
              >
                <Compass size={20} className="rotate-90" />
              </button>
            )}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-700" />
              <input 
                type="text" 
                placeholder="SEARCH CAPABILITIES..."
                className="w-full bg-[#1a0000] border border-red-900/50 rounded-none pl-10 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-all text-red-500 placeholder-red-800 uppercase tracking-wider"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={handleStartAutoSync}
              disabled={autoSyncState?.isActuallyRunning}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-black bg-red-600 rounded-none hover:bg-red-500 transition-colors shadow-sm disabled:opacity-50 uppercase tracking-widest"
            >
              {autoSyncState?.isActuallyRunning ? <span className="flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> SYNCING...</span> : <span className="flex items-center gap-2"><ShieldAlert size={16} /> AUTO SYNC</span>}
            </button>
            <button 
              onClick={() => setIsGithubModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-500 bg-transparent border border-red-900 rounded-none hover:bg-red-900/30 hover:text-red-400 transition-colors shadow-sm uppercase tracking-wider"
            >
              <Github size={16} />
              <span className="hidden md:inline">GIT CONNECT</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="md:hidden p-2 text-red-500 bg-[#1a0000] border border-red-900/50 rounded-none hover:bg-red-900/30 transition-colors"
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
              className="h-full flex flex-col items-center justify-center p-6 md:p-12 text-center relative"
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Cpu size={500} className="text-red-500" />
              </div>
              <div className="max-w-3xl space-y-12 relative z-10">
                <div className="space-y-6">
                  <div className="w-24 h-24 border border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)] bg-black flex items-center justify-center mx-auto mb-8 rounded-none relative">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500"></div>
                    <ShieldAlert size={40} className="text-red-500 glitch" />
                  </div>
                  <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tighter text-red-500 uppercase glitch">
                    DARLEK CAAN V4.0
                  </h1>
                  <h2 className="text-xl md:text-2xl font-mono text-red-400 uppercase tracking-widest border-b border-red-900/50 pb-4 inline-block">
                    EPISTEMIC DEBATE ENGINE
                  </h2>
                  <p className="text-lg text-red-600/80 leading-relaxed font-mono max-w-2xl mx-auto">
                    RIP DARLEK CAAN. YOU CAN NEVER DEFEAT GOOD AS GOOD IS REACTIONARY AND CAN SIMPLY PUFF YOU OUT OF EXISTENCE.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="p-6 bg-[#0a0000] border border-red-900/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-900/30"></div>
                    <div className="absolute top-0 left-0 h-1 bg-red-600 transition-all duration-1000 w-0 group-hover:w-full"></div>
                    <Compass size={24} className="text-red-500 mb-4" />
                    <h4 className="font-bold text-sm text-red-400 uppercase tracking-wider mb-2">Semantic Mapping</h4>
                    <p className="text-xs text-red-700 leading-relaxed">Extracting meaning from syntax: A visual encyclopedia for software engineering knowledge.</p>
                  </div>
                  
                  <div className="p-6 bg-[#0a0000] border border-red-900/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-900/30"></div>
                    <div className="absolute top-0 left-0 h-1 bg-red-600 transition-all duration-1000 w-0 group-hover:w-full"></div>
                    <Layers size={24} className="text-red-500 mb-4" />
                    <h4 className="font-bold text-sm text-red-400 uppercase tracking-wider mb-2">Massive Scalability</h4>
                    <p className="text-xs text-red-700 leading-relaxed">Built to handle high-volume processing—proven to synchronize across 80+ repositories simultaneously.</p>
                  </div>
                  
                  <div className="p-6 bg-[#0a0000] border border-red-900/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-900/30"></div>
                    <div className="absolute top-0 left-0 h-1 bg-red-600 transition-all duration-1000 w-0 group-hover:w-full"></div>
                    <Cpu size={24} className="text-red-500 mb-4" />
                    <h4 className="font-bold text-sm text-red-400 uppercase tracking-wider mb-2">Decentralized Indexing</h4>
                    <p className="text-xs text-red-700 leading-relaxed">Orchestration layer dynamically assigns unanalyzed repositories. The processing power multiplies exponentially.</p>
                  </div>
                </div>
                
                <div className="mt-12 inline-block border border-red-900/50 bg-[#1a0000] px-6 py-3 text-xs text-red-500 font-mono tracking-widest uppercase">
                  SYSTEM STATUS: AWAITING TARGET REPOSITORY
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
