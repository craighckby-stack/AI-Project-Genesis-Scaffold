import React from 'react';

interface AriaStatusProps {
  announcement?: string;
  className?: string;
}

const DEFAULT_MESSAGE = "Welcome to Darlek Cann Engine. Configuring secure tactical parameters...";

/**
 * AriaStatus Component
 * Provides a live region for screen reader announcements.
 */
export default function AriaStatus({ announcement = DEFAULT_MESSAGE, className = '' }: AriaStatusProps) {
  return (
    <div 
      className={`bg-black/30 p-3 rounded-lg border border-red-950/40 transition-colors ${className}`}
      aria-label="System Status"
    >
      <header className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">
        Live announcements
      </header>
      <div
        id="aria-status"
        className="text-xs font-medium text-emerald-400 font-mono leading-snug"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement ? (
          <span className="animate-in fade-in duration-300">{announcement}</span>
        ) : (
          <span className="opacity-50 italic" aria-hidden="true">System idle...</span>
        )}
      </div>
    </div>
  );
}

