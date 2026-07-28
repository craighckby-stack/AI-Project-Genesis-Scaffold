import { LogMessage } from "../types";
import { useEffect, useRef } from "react";

export function Console({ 
  logs, 
  isRunning,
  progress
}: { 
  logs: LogMessage[], 
  isRunning: boolean,
  progress: number
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="col-span-12 lg:col-span-8 lg:row-span-4 bg-[#0D0D0F] border border-[#26262A] rounded-2xl overflow-hidden flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#151518] border-b border-[#26262A] shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/30"></div>
        </div>
        <span className="text-[10px] text-slate-500 font-mono hidden sm:block">STDOUT_AUDIT_LOG_091.tmp</span>
        <span className="text-[10px] text-indigo-400 font-bold uppercase flex items-center gap-2">
          {isRunning && (
            <svg className="w-3 h-3 animate-spin text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          )}
          Live Diagnostics
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 p-4 font-mono text-xs overflow-y-auto flex flex-col gap-1.5">
        {logs.length === 0 && (
          <p className="text-slate-500 italic">Ready to start. Enter your token and click "Initiate Deep Scan".</p>
        )}
        {logs.map((log) => (
          <p key={log.id} className={`${getLogColor(log.type)} whitespace-pre-wrap`}>
            <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
            {getLogPrefix(log.type)} {log.text}
          </p>
        ))}
      </div>
      <div className="p-3 bg-[#151518] border-t border-[#26262A] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 w-full max-w-md">
          <div className="h-4 flex-1 bg-[#0D0D0F] rounded overflow-hidden relative">
            <div className="h-full bg-indigo-500/50 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter min-w-[80px]">{Math.round(progress)}% Complete</span>
        </div>
        <div className="text-[10px] text-slate-500 italic hidden sm:block">
          {isRunning ? "Running..." : "Idle"}
        </div>
      </div>
    </div>
  );
}

function getLogColor(type: LogMessage["type"]) {
  switch (type) {
    case "success": return "text-slate-300";
    case "warning": return "text-slate-400";
    case "error": return "text-red-400";
    default: return "text-slate-400";
  }
}

function getLogPrefix(type: LogMessage["type"]) {
  switch (type) {
    case "success": return <span className="text-emerald-500 font-bold">SUCCESS:</span>;
    case "warning": return <span className="text-amber-400 font-bold">WARN:</span>;
    case "error": return <span className="text-red-500 font-bold">ERROR:</span>;
    default: return <span className="text-indigo-400 font-bold">INF:</span>;
  }
}
