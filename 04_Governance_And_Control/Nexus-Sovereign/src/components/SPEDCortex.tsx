import React, { useState } from 'react';
import { 
  Search, Brain, Shield, Info, 
  Database, Network, MessageSquare, RefreshCw, ChevronRight
} from 'lucide-react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

const STRATEGIES = [
  { id: 'academic', name: 'Academic Reports', template: '" {topic} " (site:gov OR site:edu) AND (filetype:pdf OR filetype:pptx)' },
  { id: 'recon', name: 'Reconnaissance', template: 'inurl:config | inurl:env | inurl:setup "index of"' },
  { id: 'intel', name: 'Intel Gathering', template: 'intitle:"dashboard" "admin" -github -stackoverflow' }
];

const PERSONAS = [
  { name: 'Dr. Aris', role: 'Chief Strategist', avatar: 'AS' },
  { name: 'Xenia', role: 'Chaos Engineer', avatar: 'XE' },
  { name: 'Sentinel', role: 'Security Auditor', avatar: 'SN' }
];

const SPEDCortex = () => {
  const [topic, setTopic] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeStrategy, setActiveStrategy] = useState(STRATEGIES[0]);
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState<{role: 'user' | 'agi', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  const handleDeepSearch = async () => {
    if (!topic) return;
    setIsAnalyzing(true);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 2000));
        setResults({
          metrics: { resonance: 87, density: 64, volatility: 23 },
          PersonaAnalysis: "### Simulation Result\n\n**Topic:** " + topic + "\n\n**Strategy:** " + activeStrategy.name + "\n\n1. **Critical:** Heuristic depth reached saturation at cycle 0.4.\n2. **Creative:** Emerging patterns hint at recursive logic expansion.\n3. **Analytical:** Data density concentrated in high-confidence clusters.",
          knowledgeGraph: [
            { id: 1, label: topic, x: 50, y: 50 },
            { id: 2, label: 'Origin', x: 20, y: 30 },
            { id: 3, label: 'Vector', x: 80, y: 70 }
          ]
        });
      } else {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Perform a SPED Cortex analysis on the topic: "${topic}" using search strategy "${activeStrategy.name}". Provide Markdown report and 3 percentage metrics.`
        });
        setResults({
          metrics: { resonance: 88, density: 72, volatility: 18 },
          PersonaAnalysis: res.text || "No output.",
          knowledgeGraph: [
            { id: 1, label: topic, x: 50, y: 50 },
            { id: 2, label: 'Node A', x: 30, y: 20 },
            { id: 3, label: 'Node B', x: 70, y: 30 }
          ]
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatLogs(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);

    try {
      const { orchestrator } = await import('../core/AGIOrchestrator');
      const response = await orchestrator.directCommunication(userMsg);
      setChatLogs(prev => [...prev, { role: 'agi', text: response }]);
    } catch (e) {
      setChatLogs(prev => [...prev, { role: 'agi', text: "COMM_LAYER_FAULT: Failed to reach nexus." }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-12 font-sans bg-natural-bg">
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-olive font-semibold tracking-widest uppercase text-xs mb-3 block opacity-60">Neural Cortex v5.0</span>
          <h1 className="serif text-5xl tracking-tight text-natural-text">
            Search <i className="italic font-light">& Comm Link</i>
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="natural-card p-8 bg-white">
            <h3 className="serif text-xl mb-6 flex items-center gap-2">
              <Shield size={20} className="text-olive" />
              Intelligence Desk
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-olive/50 uppercase tracking-widest">Objective</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Focus topic..."
                    className="w-full bg-natural-bg border border-olive/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-olive/20 outline-none"
                  />
                  <Search className="absolute right-4 top-4 text-olive/20" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-olive/50 uppercase tracking-widest">Strategy</label>
                <div className="grid gap-2">
                  {STRATEGIES.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => setActiveStrategy(s)}
                      className={`text-left px-5 py-3 rounded-2xl text-xs font-semibold transition-all border ${
                        activeStrategy.id === s.id ? 'bg-olive text-white' : 'bg-white text-olive border-olive/10'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleDeepSearch}
                disabled={isAnalyzing || !topic}
                className="w-full natural-btn-primary py-5 inline-flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Brain size={20} />}
                {isAnalyzing ? 'Searching...' : 'Engage Search Core'}
              </button>
            </div>
          </div>

          <div className="natural-card p-8 bg-[#2d2d2a] text-white/90">
             <h3 className="serif text-xl mb-6 flex items-center gap-2">
               <MessageSquare size={18} className="text-olive" />
               Neural Comm Link
             </h3>
             <div className="h-64 overflow-y-auto space-y-4 mb-4 font-mono text-[10px] pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {chatLogs.length === 0 && (
                  <p className="opacity-30 italic text-center py-10 uppercase tracking-widest">Awaiting bridge connection...</p>
                )}
                {chatLogs.map((log, i) => (
                  <div key={i} className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className={`text-[7px] uppercase tracking-[0.3em] mb-1 ${log.role === 'user' ? 'text-olive font-bold' : 'text-white/40'}`}>
                      {log.role}
                    </span>
                    <div className={`p-4 rounded-2xl max-w-[90%] leading-relaxed ${log.role === 'user' ? 'bg-olive text-white' : 'bg-white/5 border border-white/10'}`}>
                      {log.text}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex gap-2 items-center animate-pulse text-olive">
                    <div className="w-1.5 h-1.5 rounded-full bg-olive"></div>
                    <span className="text-[8px] font-bold uppercase tracking-widest">Reasoning...</span>
                  </div>
                )}
             </div>
             <div className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  placeholder="Direct Link Message..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs focus:ring-2 focus:ring-olive/50 outline-none placeholder:text-white/20"
                />
                <button onClick={handleChat} disabled={isChatting} className="absolute right-2 top-2 p-2 text-olive hover:text-white">
                  <ChevronRight size={20} />
                </button>
             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-8">
          {results ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 {Object.entries(results.metrics).map(([key, val]: [string, any]) => (
                   <div key={key} className="natural-card p-8 text-center bg-white">
                      <span className="text-[10px] font-bold text-olive/40 uppercase tracking-widest block mb-1">{key}</span>
                      <span className="text-4xl serif text-olive">{val}%</span>
                   </div>
                 ))}
              </div>
              <div className="natural-card p-8 md:p-12 min-h-[500px] bg-white">
                 <div className="prose prose-olive max-w-none text-natural-text/80 leading-relaxed font-sans prose-headings:serif border-t border-olive/10 pt-8 mt-4">
                    <Markdown>{results.PersonaAnalysis}</Markdown>
                 </div>
              </div>
              <div className="mt-8">
                 <div className="natural-card p-8 bg-natural-text text-white relative h-64 overflow-hidden border-none shadow-2xl">
                    <div className="absolute top-8 left-8 z-20">
                      <Network size={20} className="text-olive mb-2" />
                      <span className="text-[10px] text-white/40 uppercase tracking-widest block">Neural Associative Map</span>
                    </div>
                    {results.knowledgeGraph.map((node: any) => (
                      <div key={node.id} className="absolute flex flex-col items-center group" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                         <div className="w-2.5 h-2.5 rounded-full bg-olive animate-pulse group-hover:scale-150 transition-all cursor-crosshair"></div>
                         <span className="text-[8px] text-white/50 font-mono whitespace-nowrap bg-white/5 px-2 py-0.5 rounded-full mt-2 opacity-0 group-hover:opacity-100 transition-all font-bold">
                           {node.label}
                         </span>
                      </div>
                    ))}
                    <svg className="absolute inset-0 w-full h-full opacity-10" pointerEvents="none">
                      <path d="M 20 30 L 50 50 L 80 70 M 50 50 L 40 80 M 50 50 L 30 20 L 70 30" stroke="#5A5A40" strokeWidth="1" fill="none" />
                    </svg>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center natural-card bg-white p-20 text-center border-dashed border-2 border-olive/10">
               <div className="w-20 h-20 rounded-full bg-natural-bg flex items-center justify-center text-olive/20 mb-6 border border-olive/10">
                 <Database size={40} />
               </div>
               <h3 className="serif text-2xl text-natural-text/40 mb-2 italic">Waiting for Neural Engagement</h3>
               <p className="text-xs text-natural-text/30 max-w-xs mx-auto leading-relaxed">
                 Initialize target parameters to begin deep metadata extraction and logic synthesis.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SPEDCortex;
