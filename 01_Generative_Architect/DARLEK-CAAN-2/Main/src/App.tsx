/**
 * @file App.tsx
 * @version 3.0.0
 * @description DARLEK CANN OMEGA CORE - Primary Entry Point
 * @architecture Next.js + Agent Orchestra + 3-tier LLM Fallback
 * @context Siphoned from unitary-core, sovereign-kernel, and Microsoft AI-Agents-For-Beginners
 */

import React, { useEffect, useCallback } from 'react';
import { SystemProvider, useSystemContext } from './context/SystemContext';
import { OrchestratorProvider, useOrchestrator } from './context/OrchestratorContext';
import { DiagnosticOverlay } from './components/DiagnosticOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QuantumStateMonitor } from './components/QuantumStateMonitor';
import { EpistemicLog } from './components/EpistemicLog';
import { TelemetryDashboard } from './components/TelemetryDashboard';

/**
 * @interface AppLayoutProps
 * @description Orchestrates the visual representation of the OMEGA CORE state.
 */
const AppLayout: React.FC = () => {
  const { state, dispatch } = useSystemContext();
  const orchestrator = useOrchestrator();

  // Lifecycle management: Ensure clean teardown of agentic threads
  useEffect(() => {
    const initKernel = async () => {
      try {
        await orchestrator.initialize();
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } catch (err) {
        console.error('[KERNEL_CRITICAL] Initialization failure:', err);
      }
    };

    initKernel();

    return () => {
      orchestrator.terminate();
    };
  }, [orchestrator, dispatch]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono selection:bg-cyan-900/30">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black tracking-tighter text-cyan-400">DARLEK CANN v3.0</h1>
          <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">OMEGA CORE</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-slate-500">
          <span>Status: {state.isInitialized ? 'Active' : 'Syncing'}</span>
          <div className={`w-2 h-2 rounded-full ${state.isInitialized ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
        </div>
      </header>
      
      <main className="p-6 max-w-[1600px] mx-auto">
        {!state.isInitialized ? (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <div className="w-12 h-12 border-4 border-cyan-900 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-cyan-500 animate-pulse">INITIALIZING QUANTUM NEURAL MESH...</p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-6">
              <QuantumStateMonitor />
              <TelemetryDashboard />
            </div>
            <div className="col-span-12 lg:col-span-5 xl:col-span-4">
              <EpistemicLog />
            </div>
          </div>
        )}
      </main>
      <DiagnosticOverlay />
    </div>
  );
};

/**
 * @function App
 * @description Root provider injection layer.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <SystemProvider>
        <OrchestratorProvider>
          <AppLayout />
        </OrchestratorProvider>
      </SystemProvider>
    </ErrorBoundary>
  );
}



