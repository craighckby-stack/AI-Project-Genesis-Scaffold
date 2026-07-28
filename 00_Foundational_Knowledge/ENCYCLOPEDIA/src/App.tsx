import { useState, useEffect } from "react";
import { EncyclopediaData } from "./types";
import Sidebar from "./components/Sidebar";
import CapabilityDetails from "./components/CapabilityDetails";
import SnippetModal from "./components/SnippetModal";
import GitHubSyncModal from "./components/GitHubSyncModal";
import ConceptMap from "./components/ConceptMap";
import { 
  BookOpen, Search, Plus, Compass, Layers, Github, 
  RefreshCw, ShieldCheck, Cpu, Network, Users, ArrowLeft, BarChart2, Sparkles
} from "lucide-react";

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

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSync();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(checkSync, 3000);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-transparent font-sans">
        <Cpu size={40} className="text-fuchsia-500 mb-6 animate-pulse drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]" />
        <div className="font-mono text-sm font-bold text-slate-300 animate-pulse uppercase tracking-widest drop-shadow-md">
          Initializing Engineering Matrix...
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
    <div className="flex h-screen bg-transparent overflow-hidden text-slate-100 font-sans">
      {/* Sidebar: Responsive list navigation */}
      <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] shrink-0 h-screen overflow-y-auto bg-slate-900/60 backdrop-blur-xl flex-col border-r border-slate-800/50 shadow-2xl`}>
        <Sidebar 
          volumes={filteredVolumes} 
          onSelectCapability={(id) => setSelectedId(id)} 
          selectedCapabilityId={selectedId || undefined}
          onAddSnippet={() => setIsModalOpen(true)}
        />
      </div>

      {/* Main Panel */}
      <main className="flex-1 min-w-0 overflow-y-auto relative bg-transparent flex flex-col h-full graph-grid">
        <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 h-16 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-2xl">
          <div className="flex items-center flex-1 max-w-lg">
            {selectedId && (
              <button 
                onClick={() => setSelectedId(null)}
                className="mr-4 p-2 -ml-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="Return to Overview"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Overview</span>
              </button>
            )}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search software capabilities..."
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-slate-200 placeholder-slate-500 outline-none shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={handleStartAutoSync}
              disabled={autoSyncState?.isActuallyRunning}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-xl transition-all duration-300 shadow-lg disabled:opacity-50 ${
                autoSyncState?.isActuallyRunning 
                  ? "bg-fuchsia-900/50 text-fuchsia-200 shadow-[inset_0_0_10px_rgba(192,38,211,0.3)] border border-fuchsia-800/50" 
                  : "bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 hover:scale-[1.03] active:scale-[0.98] shadow-[0_0_15px_rgba(192,38,211,0.4)] hover:shadow-[0_0_25px_rgba(192,38,211,0.6)] border border-fuchsia-500/30"
              }`}
            >
              {autoSyncState?.isActuallyRunning ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={14} className="animate-spin" /> Indexing Engine Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Engage System Auto-Sync
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsGithubModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              <Github size={14} />
              <span className="hidden md:inline">Connect GitHub</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="md:hidden p-2 text-slate-400 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 hover:text-white transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {selectedCapability ? (
            <div key={selectedId} className="animate-fade-in">
              <CapabilityDetails capability={selectedCapability} />
            </div>
          ) : (
            <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-12">
              {/* Hero Banner Section */}
              <div className="text-center md:text-left space-y-6 max-w-4xl pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-medium font-mono shadow-[0_0_10px_rgba(192,38,211,0.2)]">
                  <Sparkles size={13} className="text-fuchsia-400" />
                  <span>Encyclopedia of Engineering</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-none drop-shadow-sm">
                  Extracting meaning from syntax.
                </h1>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-3xl font-light">
                  A high-volume, visual encyclopedia for software engineering knowledge. Seamlessly parse entire enterprise topologies and index functional capabilities with sub-second retrieval.
                </p>
              </div>

              {/* Graphical Concept Map Section */}
              <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden min-h-[500px]">
                <ConceptMap 
                  data={data}
                  selectedId={selectedId}
                  onSelectCapability={(id) => setSelectedId(id)}
                />
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-900/50 backdrop-blur-md border border-slate-800/60 rounded-2xl shadow-xl space-y-3 hover:border-fuchsia-500/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-950/50 text-fuchsia-400 flex items-center justify-center border border-fuchsia-900/50">
                    <Layers size={18} />
                  </div>
                  <h4 className="font-bold text-slate-100 font-display text-sm tracking-wide">Massive Scalability</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Designed to handle massive codebases. Synthesized across <span className="font-bold text-slate-200">80+ repositories</span> in parallel, ranging from 4 files to over 30,000 files per codebase.
                  </p>
                </div>
                
                <div className="p-6 bg-slate-900/50 backdrop-blur-md border border-slate-800/60 rounded-2xl shadow-xl space-y-3 hover:border-cyan-500/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/50 text-cyan-400 flex items-center justify-center border border-cyan-900/50">
                    <Users size={18} />
                  </div>
                  <h4 className="font-bold text-slate-100 font-display text-sm tracking-wide">Distributed Syncing</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Our orchestration layer assigns different files to different contributing users. This ensures zero redundant processing, scaling up speed with every new active session.
                  </p>
                </div>
                
                <div className="p-6 bg-slate-900/50 backdrop-blur-md border border-slate-800/60 rounded-2xl shadow-xl space-y-3 hover:border-indigo-500/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/50 text-indigo-400 flex items-center justify-center border border-indigo-900/50">
                    <BarChart2 size={18} />
                  </div>
                  <h4 className="font-bold text-slate-100 font-display text-sm tracking-wide">Structural Indexing</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instead of generic search, we build a structured taxonomic tree classifying why functions exist, how they evolved, and identifying their cleanest implementations.
                  </p>
                </div>
              </div>

              {/* Bottom Mission Statement Banner */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-900/50 text-slate-100 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(79,70,229,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="space-y-2 text-center md:text-left relative z-10">
                  <p className="font-bold text-white font-display text-lg">Ready to map your organization's codebodies?</p>
                  <p className="text-sm text-indigo-200">Connect your GitHub Personal Access Token to initiate automated taxonomy parsing.</p>
                </div>
                <button 
                  onClick={() => setIsGithubModalOpen(true)}
                  className="px-6 py-3 bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 shrink-0 relative z-10"
                >
                  Configure Link
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Manual mutation injection modal */}
      {isModalOpen && (
        <SnippetModal 
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSnippetSuccess}
        />
      )}

      {/* Sync/PAT configuration modal */}
      {isGithubModalOpen && (
        <GitHubSyncModal 
          onClose={() => setIsGithubModalOpen(false)}
        />
      )}
    </div>
  );
}
