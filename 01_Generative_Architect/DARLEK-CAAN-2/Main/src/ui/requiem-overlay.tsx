import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface RequiemOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  telemetryData?: Record<string, any>;
  priority?: 'critical' | 'nominal' | 'debug';
}

export const RequiemOverlay: React.FC<RequiemOverlayProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  telemetryData,
  priority = 'nominal'
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={(e) => e.target === overlayRef.current && onClose()}
        >
          <motion.div
            initial={{ scale: 0.98, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: 10 }}
            className={`w-full max-w-2xl bg-slate-950 border ${priority === 'critical' ? 'border-red-500/50' : 'border-indigo-500/30'} rounded-lg shadow-[0_0_30px_-10px_rgba(79,70,229,0.3)] overflow-hidden`}
          >
            <header className="flex justify-between items-center px-6 py-4 border-b border-slate-800/50 bg-slate-900/50">
              <h2 className="text-indigo-400 font-mono text-xs tracking-widest uppercase">{title}</h2>
              <button 
                onClick={onClose} 
                className="text-slate-500 hover:text-white transition-colors font-mono text-xs"
              >
                [TERMINATE]
              </button>
            </header>
            <main className="p-6 text-slate-300 font-sans text-sm leading-relaxed">
              {children}
            </main>
            {telemetryData && (
              <footer className="px-6 py-3 bg-black/40 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-slate-600 font-mono">TELEMETRY_STREAM_ACTIVE</span>
                </div>
                <pre className="text-[10px] text-indigo-400/70 font-mono overflow-x-auto">
                  {JSON.stringify(telemetryData, null, 2)}
                </pre>
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};


























