import React from 'react';

interface AriaStatusProps {
  announcement?: string;
}

const DEFAULT_MESSAGE = "Welcome to Darlek Cann Engine. Configuring secure tactical parameters...";

export default function AriaStatus({ announcement }: AriaStatusProps) {
  return (
    <div className="bg-black/30 p-3 rounded-lg border border-red-950/40 transition-colors">
      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
        Live announcements
      </span>
      <div 
        id="aria-status" 
        className="text-xs font-medium text-emerald-400 font-mono leading-snug"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement || DEFAULT_MESSAGE}
      </div>
    </div>
  );
}
