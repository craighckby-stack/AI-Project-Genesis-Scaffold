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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-sans">
        <Cpu size={40} className="text-slate-800 mb-6 animate-pulse" />
        <div className="font-mono text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">
          Loading Engineering Encyclopedia Data...
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
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 font-sans">
      {/* Sidebar: Responsive list navigation */}
      <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] shrink-0 h-screen overflow-y-auto bg-white flex-col border-r border-slate-100 shadow-sm`}>
        <Sidebar 
          volumes={filteredVolumes} 
          onSelectCapability={(id) => setSelectedId(id)} 
          selectedCapabilityId={selectedId || undefined}
          onAddSnippet={() => setIsModalOpen(true)}
        />
      </div>

      {/* Main Panel */}
      <main className="flex-1 min-w-0 overflow-y-auto relative bg-slate-50/30 flex flex-col h-full">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm">
          <div className="flex items-center flex-1 max-w-lg">
            {selectedId && (
              <button 
                onClick={() => setSelectedId(null)}
                className="mr-4 p-2 -ml-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
                title="Return to Overview"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Overview</span>
              </button>
            )}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search software capabilities..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all text-slate-800 placeholder-slate-400 outline-none"
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
                  ? "bg-red-700 shadow-inner" 
                  : "bg-rose-600 hover:bg-rose-700 hover:scale-[1.03] active:scale-[0.98] shadow-rose-600/30 hover:shadow-rose-600/50"
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
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Github size={14} />
              <span className="hidden md:inline">Connect GitHub</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="md:hidden p-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
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
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-medium font-mono">
                  <Sparkles size={13} />
                  <span>Encyclopedia of Engineering</span>
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-none">
                  Extracting meaning from syntax.
                </h1>
                <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-3xl">
                  A high-volume, visual encyclopedia for software engineering knowledge. Seamlessly parse entire enterprise topologies and index functional capabilities with sub-second retrieval.
                </p>
              </div>

              {/* Graphical Concept Map Section */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
                <ConceptMap 
                  data={data}
                  selectedId={selectedId}
                  onSelectCapability={(id) => setSelectedId(id)}
                />
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Layers size={18} />
                  </div>
                  <h4 className="font-bold text-slate-900 font-display text-sm">Massive Scalability</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Designed to handle massive codebases. Synthesized across <span className="font-bold text-slate-800">80+ repositories</span> in parallel, ranging from 4 files to over 30,000 files per codebase.
                  </p>
                </div>
                
                <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-800 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <h4 className="font-bold text-slate-900 font-display text-sm">Distributed Syncing</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Our orchestration layer assigns different files to different contributing users. This ensures zero redundant processing, scaling up speed with every new active session.
                  </p>
                </div>
                
                <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <BarChart2 size={18} />
                  </div>
                  <h4 className="font-bold text-slate-900 font-display text-sm">Structural Indexing</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Instead of generic search, we build a structured taxonomic tree classifying why functions exist, how they evolved, and identifying their cleanest implementations.
                  </p>
                </div>
              </div>

              {/* Bottom Mission Statement Banner */}
              <div className="p-6 md:p-8 bg-slate-900 text-slate-100 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="space-y-1 text-center md:text-left">
                  <p className="font-semibold text-white font-display">Ready to map your organization's codebodies?</p>
                  <p className="text-xs text-slate-400">Connect your GitHub Personal Access Token to initiate automated taxonomy parsing.</p>
                </div>
                <button 
                  onClick={() => setIsGithubModalOpen(true)}
                  className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs rounded-xl transition-colors shrink-0"
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
