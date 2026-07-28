import React, { useRef, useEffect } from 'react';

export const SubstrateTerminal: React.FC<{ logs: string[] }> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed text-zinc-500 custom-scrollbar">
      {logs.map((log, i) => (
        <div key={i} className="mb-1">
          <span className="text-zinc-700">{'>'}</span> {log}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};