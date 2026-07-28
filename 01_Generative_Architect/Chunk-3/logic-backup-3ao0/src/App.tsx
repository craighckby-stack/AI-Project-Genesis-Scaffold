import React, { useState, useRef, useEffect } from 'react';
import { 
  Dna, 
  Terminal, 
  Database, 
  Zap, 
  FileCode, 
  ChevronRight, 
  Copy, 
  Download, 
  RefreshCw,
  Cpu,
  Shield,
  Activity,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PackResult {
  base64: string;
  fileCount: number;
  originalSize: number;
  compressedSize: number;
}

interface LogEntry {
  msg: string;
  type: 'info' | 'success' | 'warn' | 'error';
  timestamp: string;
}

export default function App() {
  const [isPacking, setIsPacking] = useState(false);
  const [result, setResult] = useState<PackResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [targetDir, setTargetDir] = useState('./src');
  const [copied, setCopied] = useState(false);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [
      { 
        msg, 
        type, 
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) 
      }, 
      ...prev
    ].slice(0, 100));
  };

  const handlePack = async () => {
    setIsPacking(true);
    addLog(`Initiating Phase 2.2 DNA Pack for ${targetDir}...`, 'info');
    
    try {
      const response = await fetch('/api/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDir })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Unknown packing error');
      }
      
      const data: PackResult = await response.json();
      setResult(data);
      addLog(`Packing complete. ${data.fileCount} files internalized.`, 'success');
      addLog(`Compression: ${((1 - data.compressedSize / data.originalSize) * 100).toFixed(2)}% saved.`, 'info');
    } catch (err: any) {
      addLog(`CRITICAL ERROR: ${err.message}`, 'error');
    } finally {
      setIsPacking(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.base64);
      setCopied(true);
      addLog('Payload copied to system clipboard.', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="h-screen flex flex-col font-sans selection:bg-brand-ink selection:text-brand-bg relative overflow-hidden">
      <div className="scan-line" />
      
      {/* Header */}
      <header className="border-b border-brand-line flex items-center justify-between px-6 py-4 bg-brand-bg/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-brand-line flex items-center justify-center bg-brand-ink text-brand-bg active:scale-95 transition-transform cursor-pointer">
            <Dna size={24} />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tighter uppercase">DNA-PACKER-v2.2</h1>
            <p className="text-[10px] opacity-50 font-mono tracking-widest uppercase italic">LLM Context Injector / Phase 2.2 Runtime</p>
          </div>
        </div>
        
        <div className="flex gap-8 items-center">
          <div className="hidden md:flex flex-col items-end">
             <span className="col-header">System Status</span>
             <span className="data-value flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-brand-ink animate-pulse" />
               LINK_STABLE
             </span>
          </div>
          <div className="hidden md:flex flex-col items-end">
             <span className="col-header">Runtime Env</span>
             <span className="data-value">NODE_V20_PROD</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-80 border-r border-brand-line flex flex-col bg-brand-bg/50 backdrop-blur-sm overflow-y-auto z-10">
          <div className="p-6 space-y-8">
            <section>
              <h2 className="col-header mb-4">Injection Config</h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono tracking-tighter opacity-70">TARGET_DIRECTORY</label>
                  <input 
                    type="text" 
                    value={targetDir}
                    onChange={(e) => setTargetDir(e.target.value)}
                    className="w-full bg-transparent border border-brand-line p-2 font-mono text-sm focus:bg-brand-ink focus:text-brand-bg outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono tracking-tighter opacity-70">COMPRESSION_ALGO</label>
                  <div className="w-full bg-brand-ink text-brand-bg p-2 font-mono text-sm border border-brand-line">
                    BROTLI_MAX_QUALITY
                  </div>
                </div>
              </div>
            </section>

            <button 
              onClick={handlePack}
              disabled={isPacking}
              className={cn(
                "w-full h-16 border border-brand-line flex items-center justify-center gap-3 font-display font-bold uppercase tracking-widest transition-all",
                isPacking ? "opacity-50 cursor-not-allowed" : "hover:bg-brand-ink hover:text-brand-bg active:translate-y-1"
              )}
            >
              {isPacking ? (
                <RefreshCw className="animate-spin" size={20} />
              ) : (
                <Zap size={20} />
              )}
              {isPacking ? "Processing..." : "Engage DNA Pack"}
            </button>

            <section className="space-y-4 pt-4 border-t border-brand-line/20">
              <h2 className="col-header">Active Modules</h2>
              <div className="space-y-2">
                {[
                  { icon: <Cpu size={14} />, label: 'Async I/O Engine', status: 'ACTIVE' },
                  { icon: <Shield size={14} />, label: 'Brotli Compressor', status: 'ACTIVE' },
                  { icon: <Database size={14} />, label: 'Binary Packer', status: 'ACTIVE' },
                ].map((mod, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-mono border-b border-brand-line/10 pb-2">
                    <div className="flex items-center gap-2 opacity-70">
                      {mod.icon}
                      {mod.label}
                    </div>
                    <span className="font-bold">{mod.status}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>

        {/* Workspace */}
        <section className="flex-1 flex flex-col bg-[#F0EFEC]">
          {/* Stats Bar */}
          <div className="border-b border-brand-line grid grid-cols-4 bg-brand-bg">
            {[
              { label: 'File Count', value: result?.fileCount || '0', sub: 'Evolvable Chunks' },
              { label: 'Unchecked Size', value: result ? formatSize(result.originalSize) : '0 B', sub: 'Calculated Buffer' },
              { label: 'DNA Payload', value: result ? formatSize(result.compressedSize) : '0 B', sub: 'Binary Stream' },
              { label: 'Efficacy', value: result ? `${((1 - result.compressedSize / result.originalSize) * 100).toFixed(1)}%` : '0%', sub: 'Total Savings' },
            ].map((stat, i) => (
              <div key={i} className="p-4 border-r border-brand-line last:border-r-0">
                <span className="col-header">{stat.label}</span>
                <div className="data-value text-xl font-bold mt-1">{stat.value}</div>
                <div className="text-[10px] italic opacity-40 mt-1">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Result Area */}
          <div className="flex-1 p-8 overflow-y-auto relative">
             <AnimatePresence mode="wait">
               {result ? (
                 <motion.div 
                   key="result"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="h-full flex flex-col gap-6"
                 >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <FileCode className="text-brand-ink" />
                       <h3 className="font-display font-bold uppercase tracking-tighter">Compressed DNA Payload</h3>
                     </div>
                     <div className="flex gap-2">
                       <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-4 py-2 border border-brand-line hover:bg-brand-ink hover:text-brand-bg transition-all font-mono text-[11px] uppercase"
                       >
                         {copied ? <RefreshCw className="animate-spin" size={12} /> : <Copy size={12} />}
                         {copied ? 'Copied' : 'Copy Payload'}
                       </button>
                       <button className="flex items-center gap-2 px-4 py-2 border border-brand-line hover:bg-brand-ink hover:text-brand-bg transition-all font-mono text-[11px] uppercase">
                         <Download size={12} />
                         Export .TXT
                       </button>
                     </div>
                   </div>

                   <div className="flex-1 border border-brand-line bg-brand-ink text-brand-bg/80 p-6 font-mono text-[10px] break-all overflow-y-auto shadow-inner leading-relaxed">
                     {result.base64}
                   </div>
                   
                   <p className="text-center text-[10px] opacity-30 italic font-mono">
                     THIS PAYLOAD IS OPTIMIZED FOR DIRECT LLM INJECTION. USE WITH GOOGLE GEMINI 1.5 PRO FOR BEST RESULTS.
                   </p>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="empty"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="h-full flex flex-col items-center justify-center text-center opacity-20 pointer-events-none"
                 >
                   <Dna size={80} className="mb-6 animate-pulse" />
                   <h3 className="font-display font-bold text-2xl uppercase tracking-[0.2em]">Awaiting Injection</h3>
                   <p className="font-mono text-sm max-w-md mt-2">Initialize the packer to begin the DNA extraction process for the targeted codebase.</p>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Terminal / Logs */}
      <footer className="h-48 border-t border-brand-line bg-brand-bg flex flex-col z-20">
        <div className="flex items-center justify-between px-4 py-1 border-b border-brand-line bg-brand-ink text-brand-bg">
          <div className="flex items-center gap-2">
            <Terminal size={12} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Runtime Console Log</span>
          </div>
          <Activity size={12} className="opacity-50" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1">
          {logs.length === 0 && (
            <div className="opacity-30 italic">System initialized. Awaiting user command...</div>
          )}
          {logs.map((log, i) => (
            <div key={i} className={cn(
              "flex gap-4",
              log.type === 'error' && "text-red-700",
              log.type === 'success' && "text-green-700",
              log.type === 'warn' && "text-amber-700"
            )}>
              <span className="opacity-30 flex-shrink-0">[{log.timestamp}]</span>
              <span className="flex-shrink-0 opacity-50 uppercase text-[9px] w-12">{log.type}</span>
              <span className="break-all">{log.msg}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </footer>
    </div>
  );
}
