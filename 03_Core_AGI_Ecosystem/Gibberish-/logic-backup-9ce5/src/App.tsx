import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, FileText, Play, Terminal, Trash2, Image as ImageIcon, Loader2, ShieldCheck, Printer, Filter, ArrowUpDown, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Claim {
  text: string;
  category: 'empirical' | 'theoretical' | 'speculative' | 'contradiction';
  sourceName: string;
  snippet?: string; // The exact text from the source
}

interface DeathEntry {
  id: string;
  timestamp: string;
  error: string;
  context: string;
}

interface ProcessedFile {
  id: string;
  name: string;
  content: string;
  type: 'text' | 'image';
  mimeType: string;
  size: number;
  summary?: string;
  claims?: Claim[];
  isSummarizing?: boolean;
  isExtractingClaims?: boolean;
  error?: string;
}

interface KernelOutput {
  kernelId: number;
  name: string;
  perspective: string;
  analysis: string;
  claims: Array<{ text: string; sourceId: string; grounded: boolean }>;
}

const KERNEL_DEFINITIONS = [
  { id: 1, name: "Empirical Verification", perspective: "Focus strictly on verifiable data, Landauer's Principle, and physical constraints. Flag any ungrounded claims." },
  { id: 2, name: "Adversarial Contradiction", perspective: "Actively look for tensions and contradictions between sources. Challenge the primary arguments." },
  { id: 3, name: "Systemic Alignment", perspective: "Analyze the content through the lens of AGI Alignment and safety guardrails." },
  { id: 4, name: "Structural Logic", perspective: "Evaluate the internal consistency of the arguments and the strength of the logical chain." },
  { id: 5, name: "Interdimensional Extrapolation", perspective: "Project the findings into theoretical and future scenarios (The 'Rock' Perspective)." },
  { id: 6, name: "Historical Context", perspective: "Compare findings against established scientific history and previous iterations." },
  { id: 7, name: "Ethical Implication", perspective: "Analyze the human and societal impact of the synthesized conclusions." },
  { id: 8, name: "Technical Feasibility", perspective: "Assess the engineering requirements and practical implementation barriers." },
  { id: 9, name: "Synthesis Fusion", perspective: "Attempt to find the 'Golden Thread' that connects all disparate sources into a cohesive whole." }
];

export default function App() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [report, setReport] = useState('');
  const [kernelOutputs, setKernelOutputs] = useState<KernelOutput[]>([]);
  const [query, setQuery] = useState('');
  const [deathRegistry, setDeathRegistry] = useState<DeathEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [enginesReady, setEnginesReady] = useState(false);
  const [synthesisStyle, setSynthesisStyle] = useState<'academic' | 'plain'>('plain');
  const [printLayout, setPrintLayout] = useState<'single' | 'double'>('single');
  const [printFontSize, setPrintFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [includeCoverPage, setIncludeCoverPage] = useState(false);
  const [includeTOC, setIncludeTOC] = useState(false);
  const [customHeader, setCustomHeader] = useState('Synthesis Hub: Master Report');
  const [customFooter, setCustomFooter] = useState('Grounded Synthesis // Confidential');
  const [activeTab, setActiveTab] = useState<'report' | 'kernels' | 'terminal' | 'registry'>('report');
  
  // Advanced Filtering & Sorting
  const [fileSearch, setFileSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'analyzing' | 'completed' | 'error'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const logEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [...prev, `[${ts}] ${msg}`]);
  }, []);

  const recordDeath = useCallback((error: string, context: string) => {
    const entry: DeathEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      error,
      context
    };
    setDeathRegistry(prev => [entry, ...prev]);
    addLog(`💀 Neural Collapse Recorded: ${error}`);
  }, [addLog]);

  const callGeminiWithRetry = async (fn: () => Promise<any>, maxRetries = 3): Promise<any> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const isTransient = err.message?.includes('429') || err.message?.includes('500') || err.message?.includes('fetch');
        if (!isTransient || i === maxRetries - 1) break;
        const delay = Math.pow(2, i) * 1000;
        addLog(`⏳ Transient error, retrying in ${delay}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  };

  useEffect(() => {
    const loadScript = (src: string, id: string) => {
      if (document.getElementById(id)) return;
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.async = true;
      document.head.appendChild(script);
    };

    loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdf-js-lib');
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth-js-lib');
    
    const checkLibs = setInterval(() => {
      const win = window as any;
      if (win.pdfjsLib && win.mammoth) {
        win.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        addLog("System: Engines initialized (UCM v1.1.0). Ready for synthesis.");
        setEnginesReady(true);
        clearInterval(checkLibs);
      }
    }, 500);
    return () => clearInterval(checkLibs);
  }, [addLog]);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });

  const processFilesArray = async (incoming: FileList | File[] | null) => {
    if (!incoming || !enginesReady) {
      if (!enginesReady) addLog("⚠️ Engines are still warming up. Please wait.");
      return;
    }
    
    const items = incoming instanceof FileList ? Array.from(incoming) : (Array.isArray(incoming) ? incoming : [incoming]);
    if (items.length === 0) return;

    setIsIngesting(true);
    addLog(`📥 Ingesting ${items.length} source(s)...`);
    
    const processedBatch: ProcessedFile[] = [];
    const win = window as any;

    for (const file of items) {
      try {
        const ext = file.name ? file.name.split('.').pop()?.toLowerCase() : 'txt';
        const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
        let content = "";
        let type: 'text' | 'image' = "text";

        addLog(`Analyzing structure: ${file.name}...`);

        if (isImage) {
          content = await toBase64(file);
          type = "image";
        } else if (ext === 'pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await win.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const tc = await page.getTextContent();
            text += tc.items.map((item: any) => item.str).join(" ") + "\n";
          }
          content = text;
        } else if (ext === 'docx') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await win.mammoth.extractRawText({ arrayBuffer });
          content = result.value;
        } else {
          content = await file.text();
        }

        if (!content && type !== 'image') throw new Error("Empty content extracted");

        const newFile: ProcessedFile = { 
          id: Math.random().toString(36).substr(2, 9),
          name: file.name || "Untitled Input", 
          content, 
          type,
          mimeType: file.type || (isImage ? `image/${ext}` : 'text/plain'),
          size: file.size || content.length,
          isSummarizing: true
        };
        
        processedBatch.push(newFile);
        addLog(`✅ Verified: ${file.name}`);

        // Trigger individual analysis (summary + claims)
        analyzeSource(newFile);
      } catch (err: any) {
        addLog(`❌ Failure: ${file.name} - ${err.message}`);
      }
    }

    setFiles(prev => [...prev, ...processedBatch]);
    setIsIngesting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startAutonomousPipeline = async () => {
    const repoUrl = prompt("Enter GitHub Repository URL to begin Autonomous Research:");
    if (!repoUrl) return;

    setIsAutoPilot(true);
    addLog("🤖 Autonomous Research Pipeline: ACTIVATED.");
    
    try {
      // 1. Siphon
      await siphonRepo(repoUrl);
      
      // 2. Wait for Analysis to stabilize
      addLog("⏳ Waiting for Neural Ingestion to stabilize...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 3. Auto-Vote (Relevance Filtering)
      addLog("🗳️ Auto-Voting: Filtering sources for conceptual 'mashing' potential...");
      const voteResponse = await callGeminiWithRetry(async () => {
        return await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Review these siphoned sources and vote on which are most relevant for creating a NOVEL scientific paper (mashing concepts together). Return only the IDs of the relevant files as a comma-separated list.
          
          SOURCES:
          ${files.map(f => `ID: ${f.id}, NAME: ${f.name}, SUMMARY: ${f.summary}`).join('\n')}`
        });
      });

      const relevantIds = voteResponse.text?.split(',').map(id => id.trim()) || [];
      if (relevantIds.length > 0) {
        setFiles(prev => prev.filter(f => relevantIds.includes(f.id)));
        addLog(`✅ Auto-Vote Complete: ${relevantIds.length} sources prioritized.`);
      }

      // 4. Trigger 9-Kernel Synthesis
      await startSynthesis();

      addLog("🏁 Autonomous Pipeline: SUCCESS. Report ready for PDF export.");
    } catch (err: any) {
      recordDeath(err.message, "Autonomous Pipeline");
      addLog(`❌ Pipeline Failure: ${err.message}`);
    } finally {
      setIsAutoPilot(false);
    }
  };

  const filteredAndSortedFiles = React.useMemo(() => {
    return files
      .filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(fileSearch.toLowerCase());
        const matchesType = filterType === 'all' || f.type === filterType;
        const matchesStatus = filterStatus === 'all' || 
          (filterStatus === 'analyzing' && (f.isSummarizing || f.isExtractingClaims)) ||
          (filterStatus === 'completed' && !f.isSummarizing && !f.isExtractingClaims && !f.error) ||
          (filterStatus === 'error' && !!f.error);
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'size') {
          comparison = a.size - b.size;
        } else if (sortBy === 'status') {
          const getStatusWeight = (f: ProcessedFile) => {
            if (f.error) return 2;
            if (f.isSummarizing || f.isExtractingClaims) return 1;
            return 0;
          };
          comparison = getStatusWeight(a) - getStatusWeight(b);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [files, fileSearch, filterType, filterStatus, sortBy, sortOrder]);

  const siphonRepo = async (url?: string) => {
    const repoUrl = url || prompt("Enter GitHub Repository URL (e.g., https://github.com/user/repo):");
    if (!repoUrl) return;

    try {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) throw new Error("Invalid GitHub URL format.");

      const [_, user, repo] = match;
      setIsIngesting(true);
      addLog(`🌀 Siphoning Repository: ${user}/${repo}...`);

      const fetchFiles = async (path = ""): Promise<any[]> => {
        const res = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/${path}`);
        if (!res.ok) throw new Error(`GitHub API Error: ${res.statusText}`);
        const data = await res.ok ? await res.json() : [];
        
        let files: any[] = [];
        for (const item of data) {
          if (item.type === 'file') {
            // Filter for text-based files
            const ext = item.name.split('.').pop()?.toLowerCase();
            const validExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'md', 'txt', 'json', 'css', 'html'];
            if (validExts.includes(ext)) {
              files.push(item);
            }
          } else if (item.type === 'dir') {
            const subFiles = await fetchFiles(item.path);
            files = [...files, ...subFiles];
          }
        }
        return files;
      };

      const repoFiles = await fetchFiles();
      addLog(`📦 Found ${repoFiles.length} valid files. Siphoning content...`);

      const processedBatch: ProcessedFile[] = [];
      for (const file of repoFiles.slice(0, 15)) { // Limit to 15 files for safety
        try {
          const res = await fetch(file.download_url);
          const content = await res.text();
          
          const newFile: ProcessedFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            content,
            type: 'text',
            mimeType: 'text/plain',
            size: content.length,
            isSummarizing: true,
            isExtractingClaims: true
          };
          processedBatch.push(newFile);
          analyzeSource(newFile);
        } catch (e) {
          addLog(`⚠️ Failed to siphon: ${file.name}`);
        }
      }

      setFiles(prev => [...prev, ...processedBatch]);
      addLog(`✅ Siphon Complete: ${processedBatch.length} files ingested.`);
    } catch (err: any) {
      recordDeath(err.message, "Repository Siphon");
      addLog(`❌ Siphon Failed: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const analyzeSource = async (file: ProcessedFile) => {
    try {
      addLog(`Analyzing Source: ${file.name}...`);
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isSummarizing: true, isExtractingClaims: true } : f));

      const response = await callGeminiWithRetry(async () => {
        const prompt = `Analyze this document and provide:
        1. A concise 1-2 sentence summary.
        2. A list of key claims found in the text. 
        For each claim, categorize it as 'empirical', 'theoretical', 'speculative', or 'contradiction'.
        3. For each claim, provide a 'snippet' (the exact sentence or phrase from the source text).
        
        Format your response as JSON:
        {
          "summary": "...",
          "claims": [
            { "text": "...", "category": "empirical|theoretical|speculative|contradiction", "snippet": "..." }
          ]
        }`;

        if (file.type === 'image') {
          return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: file.mimeType, data: file.content } }
              ]
            }
          });
        } else {
          return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `${prompt}\n\nCONTENT:\n${file.content.substring(0, 15000)}`
          });
        }
      });

      const text = response.text || "{}";
      // Basic JSON extraction if model wraps it in markdown
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, claims: [] };

      const claimsWithSource = (data.claims || []).map((c: any) => ({
        ...c,
        sourceName: file.name,
        snippet: c.snippet || ""
      }));

      setFiles(prev => prev.map(f => f.id === file.id ? { 
        ...f, 
        summary: data.summary || "Summary unavailable.", 
        claims: claimsWithSource,
        isSummarizing: false, 
        isExtractingClaims: false,
        error: undefined 
      } : f));
      
      addLog(`✨ Analysis complete for: ${file.name} (${claimsWithSource.length} claims extracted)`);
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error during analysis";
      addLog(`⚠️ Analysis failed for ${file.name}: ${errorMsg}`);
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isSummarizing: false, isExtractingClaims: false, error: errorMsg } : f));
    }
  };

  const startSynthesis = async () => {
    if (files.length === 0) return;
    setStatus('processing');
    setReport('');
    setKernelOutputs([]);
    addLog(`🚀 Initializing Multi-Kernel Cognitive Pass (9 Nodes)...`);

    try {
      // 1. Parallel Kernel Execution
      const kernelPromises = KERNEL_DEFINITIONS.map(async (def) => {
        addLog(`Kernel ${def.id} [${def.name}]: Activating...`);
        
        const response = await callGeminiWithRetry(async () => {
          return await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            config: {
              systemInstruction: `You are EMG Kernel ${def.id}: ${def.name}. ${def.perspective}. 
              You MUST maintain strict provenance. When making a claim, tag it with [Source: FileName].
              Distinguish clearly between grounded facts and speculative fabrications.`
            },
            contents: `Analyze the following document stack. 
            Identify key claims, tensions, and systemic implications from your specific perspective.
            For every significant claim you identify, include the 'snippet' (exact text) from the source and tag it with [Source: FileName].
            
            DOCUMENTS:
            ${files.map(f => `ID: ${f.id}\nNAME: ${f.name}\nCONTENT: ${f.content.substring(0, 20000)}\nCLAIMS: ${JSON.stringify(f.claims)}`).join('\n---\n')}`
          });
        });

        const output: KernelOutput = {
          kernelId: def.id,
          name: def.name,
          perspective: def.perspective,
          analysis: response.text || "",
          claims: [] // In a real app, we'd parse structured JSON here
        };
        
        addLog(`Kernel ${def.id} [${def.name}]: Analysis Complete.`);
        return output;
      });

      const results = await Promise.all(kernelPromises);
      setKernelOutputs(results);

      // 2. Master Fusion Pass
      addLog(`Master Fusion Protocol: Fusing 9 Kernel Perspectives into a NOVEL Synthesis (${synthesisStyle} style)...`);
      const finalResponse = await callGeminiWithRetry(async () => {
        const styleInstruction = synthesisStyle === 'academic' 
          ? "Your goal is to create a NOVEL SCIENTIFIC PAPER. Do not just summarize the sources. Instead, 'MASH' the concepts together to propose a NEW unified theory or application. Structure with Abstract, Intro, Methodology (The Synthesis Process), Results (The New Theory), Discussion, Conclusion. Use high academic rigor."
          : "Maintain the 'Intentional Plainness' of the source. Do NOT just summarize. MASH the concepts from the documents into a NEW, direct philosophical argument. Focus on the core calibration framework: The Rock (Φ=0) as a MEASUREMENT TOOL vs Craig (Φ=∞). The goal is 'Vector Saturation'—finding the functional sweet spot. Use a direct, philosophical register: 'You're not a rock. You're not Craig. You're you.'";

        return await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `You are the UCM Master Orchestrator. You have received 9 separate analytical perspectives (EMG Kernels) on a document stack.
          
          ${styleInstruction}
          
          Your task is to:
          1. Create a NOVEL work that integrates these concepts into something NEW.
          2. Maintain strict source provenance using [Source: Name] tags.
          3. When citing a specific claim, use the 'snippet' (exact text) provided in the kernel analyses to ensure high-fidelity traceability.
          4. Respect the 'Rock Paradox': the rock is a measurement tool, not a philosophical ideal.
          
          KERNEL ANALYSES:
          ${results.map(r => `KERNEL ${r.kernelId} (${r.name}):\n${r.analysis}`).join('\n\n')}`
        });
      });

      setReport(finalResponse.text || "");
      setStatus('done');
      addLog("✨ Cognitive Synthesis Complete. Provenance maintained.");
    } catch (e: any) {
      const errorMsg = e.message || "Cognitive pipeline failed";
      recordDeath(errorMsg, "Master Synthesis Pipeline");
      addLog(`❌ Error: ${errorMsg}`);
      setStatus('error');
    }
  };

  const handleTerminalQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || files.length === 0) return;
    
    addLog(`🔍 Querying Brain Layer: "${query}"`);
    const userQuery = query;
    setQuery('');
    setActiveTab('terminal');

    try {
      const response = await callGeminiWithRetry(async () => {
        return await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `You are the Grounded Reasoning Layer of the Synthesis Hub. 
          Answer the user's query based STRICTLY on the provided documents. 
          If the answer is not in the documents, say so. 
          Identify contradictions between sources if they exist.
          
          DOCUMENTS:
          ${files.map(f => `NAME: ${f.name}\nCONTENT: ${f.content.substring(0, 30000)}`).join('\n---\n')}
          
          QUERY: ${userQuery}`
        });
      });

      setReport(prev => prev + `\n\n---\n### 🔍 Grounded Query: ${userQuery}\n${response.text}`);
      addLog(`✅ Query resolved and appended to report.`);
    } catch (err: any) {
      addLog(`❌ Query failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans pb-32">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-white sticky top-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3">
                  <FileText size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Synthesis Hub</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">UCM Orchestrator</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAutoPilot && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full animate-pulse">
                    <div className="w-1 h-1 bg-emerald-600 rounded-full" />
                    <span className="text-[8px] font-black uppercase">Auto-Pilot</span>
                  </div>
                )}
                {enginesReady ? <ShieldCheck className="text-emerald-500" size={20} /> : <Loader2 className="animate-spin text-amber-500" size={20} />}
              </div>
            </div>

            <button 
              onClick={startAutonomousPipeline}
              disabled={isAutoPilot || !enginesReady}
              className="w-full mb-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
            >
              {isAutoPilot ? <Loader2 className="animate-spin" size={16} /> : <Play size={14} fill="currentColor" />}
              Start Novel Synthesis Pipeline
            </button>

            <div 
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={async e => { e.preventDefault(); setIsDragging(false); await processFilesArray(e.dataTransfer.files); }}
              className={`relative h-56 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[0.98]' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300'}`}
            >
              {isIngesting ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
                  <p className="text-xs font-bold text-slate-600">Lattice Locking...</p>
                </div>
              ) : (
                <>
                  <Upload size={24} className="text-slate-300 mb-3" />
                  <p className="text-xs font-bold text-slate-600 mb-1">Ingest Sources</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 shadow-sm transition-all active:scale-95 cursor-pointer">Browse</button>
                    <button onClick={siphonRepo} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer">
                      Siphon Repo
                    </button>
                    <button onClick={() => {
                      const text = prompt("Paste content to analyze:");
                      if (text && text.trim()) {
                        const file = new File([text], `Manual_Input_${Date.now()}.txt`, { type: 'text/plain' });
                        processFilesArray([file]);
                      }
                    }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer">
                      Input Text
                    </button>
                  </div>
                </>
              )}
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => processFilesArray(e.target.files)} />
            </div>

            {/* Advanced Filtering & Sorting Controls */}
            <div className="mt-6 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-[10px] font-medium focus:border-indigo-300 outline-none transition-all"
                />
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-6 pr-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 appearance-none cursor-pointer outline-none focus:border-indigo-300"
                  >
                    <option value="all">All Types</option>
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                <div className="flex-1 relative group">
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 appearance-none cursor-pointer outline-none focus:border-indigo-300"
                  >
                    <option value="all">All Status</option>
                    <option value="analyzing">Analyzing</option>
                    <option value="completed">Completed</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={10} className="text-slate-400" />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-[9px] font-bold uppercase tracking-widest text-slate-400 outline-none cursor-pointer hover:text-slate-600"
                  >
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                    <option value="status">Status</option>
                  </select>
                </div>
                <button 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence>
                {filteredAndSortedFiles.map((f) => (
                  <motion.div 
                    key={f.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">
                        {f.type === 'image' ? <ImageIcon size={16} className="text-pink-500" /> : <FileText size={16} className="text-indigo-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-bold truncate text-slate-700">{f.name}</p>
                          <p className="text-[9px] text-slate-400 shrink-0">{(f.size / 1024).toFixed(1)} KB</p>
                        </div>
                        {f.isSummarizing || f.isExtractingClaims ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Loader2 size={8} className="animate-spin text-indigo-400" />
                            <span className="text-[9px] text-slate-400 italic">Analyzing...</span>
                          </div>
                        ) : f.error ? (
                          <p className="text-[9px] text-red-500 line-clamp-2 mt-0.5 leading-tight font-medium">Error: {f.error}</p>
                        ) : (
                          <div className="mt-0.5 space-y-1">
                            {f.summary && <p className="text-[9px] text-slate-500 line-clamp-2 leading-tight">{f.summary}</p>}
                            {f.claims && f.claims.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1 rounded font-bold">{f.claims.length} Claims</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setFiles(files.filter(file => file.id !== f.id))} className="p-2 hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {files.length === 0 && <p className="text-[10px] text-slate-300 text-center py-4 italic">No files ingested</p>}
            </div>

              <div className="mt-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synthesis Register</span>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setSynthesisStyle('plain')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all ${synthesisStyle === 'plain' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        Plain
                      </button>
                      <button 
                        onClick={() => setSynthesisStyle('academic')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all ${synthesisStyle === 'academic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        Academic
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PDF Layout</span>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setPrintLayout('single')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all ${printLayout === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        1-Col
                      </button>
                      <button 
                        onClick={() => setPrintLayout('double')}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all ${printLayout === 'double' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        2-Col
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Font Size</span>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {['small', 'medium', 'large'].map((size) => (
                        <button 
                          key={size}
                          onClick={() => setPrintFontSize(size as any)}
                          className={`px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all capitalize ${printFontSize === size ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cover Page</span>
                    <button 
                      onClick={() => setIncludeCoverPage(!includeCoverPage)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all ${includeCoverPage ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {includeCoverPage ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Table of Contents</span>
                    <button 
                      onClick={() => setIncludeTOC(!includeTOC)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all ${includeTOC ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {includeTOC ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="space-y-2 px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Header</span>
                    <input 
                      type="text" 
                      value={customHeader}
                      onChange={(e) => setCustomHeader(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[9px] font-medium outline-none focus:border-indigo-300"
                    />
                  </div>
                  
                  <div className="space-y-2 px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Footer</span>
                    <input 
                      type="text" 
                      value={customFooter}
                      onChange={(e) => setCustomFooter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[9px] font-medium outline-none focus:border-indigo-300"
                    />
                  </div>
                </div>

                <button 
                  onClick={startSynthesis}
                  disabled={files.length === 0 || status === 'processing' || isIngesting || !enginesReady}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400 shadow-xl active:scale-[0.97] transition-all cursor-pointer"
                >
                  {status === 'processing' ? <Loader2 className="animate-spin" size={20} /> : <Play size={16} fill="currentColor" />}
                  {status === 'processing' ? 'Mashing Concepts...' : `Generate Novel Synthesis (${files.length})`}
                </button>
              </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8"
        >
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-white min-h-[600px] lg:min-h-[850px] flex flex-col overflow-hidden relative">
            <div className="px-10 py-6 border-b flex justify-between items-center bg-slate-50/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setActiveTab('report')}
                  className={`text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'report' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Master Report
                </button>
                <button 
                  onClick={() => setActiveTab('kernels')}
                  className={`text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'kernels' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  EMG Kernels ({kernelOutputs.length})
                </button>
                <button 
                  onClick={() => setActiveTab('terminal')}
                  className={`text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'terminal' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Reasoning Terminal
                </button>
                <button 
                  onClick={() => setActiveTab('registry')}
                  className={`text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Death Registry ({deathRegistry.length})
                </button>
              </div>
              {report && (
                <button 
                  onClick={() => {
                    window.focus();
                    window.print();
                  }} 
                  className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-200 rounded-xl font-bold text-[11px] text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95 uppercase tracking-tighter cursor-pointer no-print"
                >
                  <Printer size={14}/> Print PDF
                </button>
              )}
            </div>
            
            <div className="p-10 md:p-16 flex-1 overflow-y-auto scroll-smooth print:p-0 custom-scrollbar">
              {/* Print-only Header */}
              <div className="hidden print:block mb-10 border-b-2 border-slate-900 pb-6">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{customHeader}</h1>
                    <p className="text-sm text-slate-500 font-mono mt-1">UCM_ORCHESTRATOR_OUTPUT // {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification: Grounded Synthesis</p>
                  </div>
                </div>
              </div>

              {/* Print-only Footer */}
              <div className="hidden print:block fixed bottom-4 left-0 right-0 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{customFooter}</p>
              </div>

              {activeTab === 'report' && (
                report ? (
                  <>
                    {/* Cover Page */}
                    {includeCoverPage && (
                      <div className="hidden print:flex flex-col items-center justify-center h-[90vh] text-center mb-20">
                        <div className="mb-20">
                          <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                            <ShieldCheck size={48} className="text-white" />
                          </div>
                          <h1 className="text-6xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">{customHeader}</h1>
                          <div className="h-2 w-40 bg-indigo-600 mx-auto rounded-full"></div>
                        </div>
                        <div className="space-y-4">
                          <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">Autonomous Research Synthesis</p>
                          <p className="text-sm font-mono text-slate-400">TIMESTAMP: {new Date().toISOString()}</p>
                        </div>
                        <div className="mt-auto pb-20">
                          <p className="text-xs font-black text-slate-300 uppercase tracking-[0.5em]">UCM ORCHESTRATOR v4.0</p>
                        </div>
                        <div className="page-break-after-always"></div>
                      </div>
                    )}

                    {/* Table of Contents */}
                    {includeTOC && (
                      <div className="hidden print:block mb-20">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-10 border-b-4 border-slate-900 pb-4">Table of Contents</h2>
                        <div className="space-y-4">
                          {report.match(/## (.*)/g)?.map((match, i) => (
                            <div key={i} className="flex items-end gap-4">
                              <span className="text-sm font-bold text-slate-900 uppercase tracking-tight whitespace-nowrap">{match.replace('## ', '')}</span>
                              <div className="flex-1 border-b border-dotted border-slate-300 mb-1"></div>
                              <span className="text-sm font-mono text-slate-400">0{i + 1}</span>
                            </div>
                          ))}
                        </div>
                        <div className="page-break-after-always"></div>
                      </div>
                    )}

                    <article className={`prose prose-slate max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700 
                      ${printLayout === 'double' ? 'print:columns-2 print:gap-12' : ''}
                      ${printFontSize === 'small' ? 'print:text-[10pt]' : printFontSize === 'large' ? 'print:text-[14pt]' : 'print:text-[12pt]'}
                    `}>
                    <div className="report-content" dangerouslySetInnerHTML={{ __html: report
                      .replace(/\n\n/g, '<br/><br/>')
                      .replace(/### (.*)/g, '<h3 class="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">$1</h3>')
                      .replace(/## (.*)/g, '<h2 class="text-2xl font-black text-slate-900 mt-12 mb-6 border-b border-slate-100 pb-3">$1</h2>')
                      .replace(/# (.*)/g, '<h1 class="text-4xl font-black text-slate-900 mb-10 tracking-tight">$1</h1>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-900 font-extrabold">$1</strong>')
                      .replace(/\[Source: (.*?)\]/g, (match, name) => {
                        return `<span class="citation inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold cursor-help border border-indigo-100 hover:bg-indigo-100 transition-colors" title="Source: ${name}">${name}</span>`;
                      })
                    }} />
                  </article>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-40 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
                      <FileText size={32} className="text-slate-200" />
                    </div>
                    <h3 className="text-slate-900 font-black text-lg mb-2">Systems Online</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">Source documents verified. Hit "Generate Master Report" to activate the 9-Kernel Synthesis.</p>
                  </div>
                )
              )}

              {activeTab === 'kernels' && (
                <div className="space-y-12">
                  {kernelOutputs.length > 0 ? kernelOutputs.map(k => (
                    <div key={k.kernelId} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">{k.kernelId}</span>
                        <h3 className="text-lg font-black text-slate-900">{k.name}</h3>
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-6">Perspective: {k.perspective}</p>
                      <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {k.analysis}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-20">
                      <p className="text-slate-400 text-sm italic">Run synthesis to populate kernel perspectives.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'terminal' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 mb-8">
                    <div className="bg-slate-900 rounded-3xl p-8 font-mono text-xs text-emerald-400 min-h-[300px] shadow-inner">
                      <div className="flex items-center gap-2 mb-4 text-slate-500">
                        <Terminal size={14} />
                        <span>GROUNDED_REASONING_TERMINAL v1.0.2</span>
                      </div>
                      <p className="mb-4 text-slate-400 italic">Query the document stack directly. Answers are strictly grounded in source material.</p>
                      <div className="space-y-4">
                        {logs.filter(l => l.includes('🔍 Querying')).map((l, i) => (
                          <div key={i} className="border-l-2 border-emerald-500/30 pl-4">
                            <p className="text-indigo-400 mb-1">{l}</p>
                            <p className="text-slate-300">Awaiting grounding verification...</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <form onSubmit={handleTerminalQuery} className="relative">
                    <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask the brain layer: 'What do the documents say about Landauer's Principle?'"
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm focus:border-indigo-500 outline-none transition-all pr-16 shadow-lg"
                    />
                    <button 
                      type="submit"
                      className="absolute right-3 top-3 p-2 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all cursor-pointer"
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'registry' && (
                <div className="space-y-6">
                  <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100">
                    <h3 className="text-lg font-black text-rose-900 mb-2">Neural Collapse Registry</h3>
                    <p className="text-xs text-rose-600/70">A persistent log of system failures and cognitive deaths. The Brain learns from these iterations.</p>
                  </div>
                  
                  {deathRegistry.length > 0 ? deathRegistry.map(entry => (
                    <div key={entry.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-mono text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                        <span className="px-2 py-1 bg-rose-100 text-rose-600 text-[8px] font-black uppercase rounded">Synaptic Failure</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{entry.error}</h4>
                      <p className="text-[10px] text-slate-500 italic">Context: {entry.context}</p>
                    </div>
                  )) : (
                    <div className="text-center py-20">
                      <p className="text-slate-300 text-sm italic">No neural collapses recorded. System stable.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Telemetry Fixed to Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none">
        <div className="max-w-7xl mx-auto pointer-events-auto">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="bg-slate-900 rounded-t-3xl p-4 shadow-2xl relative overflow-hidden group border-t border-slate-800"
          >
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-50" />
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <Terminal size={12} className="text-emerald-500"/> System Telemetry
              </div>
              <div className="text-[10px] font-mono text-slate-600 uppercase">
                ACTIVE_NODE: {process.env.NODE_ENV === 'production' ? 'PROD-UCM' : 'DEV-UCM'}
              </div>
            </div>
            <div className="h-24 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar pr-2 scroll-smooth">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 leading-tight border-b border-slate-800/50 pb-1 last:border-0">
                  <span className="text-slate-700 shrink-0 w-4">{i+1}</span>
                  <span className={`${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-indigo-300' : 'text-emerald-400'}`}>{log}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
