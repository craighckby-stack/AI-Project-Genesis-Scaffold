/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import GovernanceDashboard from './components/GovernanceDashboard';
import AGIKernel from './components/AGIKernel';
import SPEDCortex from './components/SPEDCortex';
import { Layers, Brain, Shield, Box } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'DASHBOARD' | 'KERNEL' | 'CORTEX'>('DASHBOARD');

  return (
    <div className="flex flex-col min-h-screen bg-natural-bg selection:bg-olive/20">
      {/* Navigation Bar */}
      <nav className="h-20 px-6 md:px-12 flex justify-between items-center border-b border-olive/20 bg-natural-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-olive rounded-full flex items-center justify-center text-white shadow-lg shadow-olive/20">
            <Shield size={20} />
          </div>
          <span className="font-serif text-xl md:text-2xl tracking-tight text-natural-text">Nexus Sovereign</span>
          <span className="hidden lg:inline-block text-[10px] font-mono uppercase tracking-widest text-olive bg-olive/10 px-2.5 py-1 rounded-full border border-olive/20">Code Evolution & Governance</span>
        </div>
        
        <div className="hidden md:flex gap-2 p-1 bg-olive/5 rounded-full border border-olive/10">
          <button 
            onClick={() => setView('DASHBOARD')}
            className={`px-6 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all flex items-center gap-2 ${
              view === 'DASHBOARD' 
                ? 'bg-olive text-white shadow-md shadow-olive/20' 
                : 'text-natural-text/60 hover:text-natural-text hover:bg-olive/5'
            }`}
          >
            <Layers size={14} />
            Governance
          </button>
          <button 
            onClick={() => setView('CORTEX')}
            className={`px-6 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all flex items-center gap-2 ${
              view === 'CORTEX' 
                ? 'bg-olive text-white shadow-md shadow-olive/20' 
                : 'text-natural-text/60 hover:text-natural-text hover:bg-olive/5'
            }`}
          >
            <Brain size={14} />
            Cortex
          </button>
          <button 
            onClick={() => setView('KERNEL')}
            className={`px-6 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all flex items-center gap-2 ${
              view === 'KERNEL' 
                ? 'bg-olive text-white shadow-md shadow-olive/20' 
                : 'text-natural-text/60 hover:text-natural-text hover:bg-olive/5'
            }`}
          >
            <Box size={14} />
            Hardware
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden gap-2">
           <button onClick={() => setView('DASHBOARD')} className={`p-2 rounded-full ${view === 'DASHBOARD' ? 'bg-olive text-white' : 'text-olive'}`}><Layers size={18} /></button>
           <button onClick={() => setView('CORTEX')} className={`p-2 rounded-full ${view === 'CORTEX' ? 'bg-olive text-white' : 'text-olive'}`}><Brain size={18} /></button>
           <button onClick={() => setView('KERNEL')} className={`p-2 rounded-full ${view === 'KERNEL' ? 'bg-olive text-white' : 'text-olive'}`}><Box size={18} /></button>
        </div>
      </nav>

      <main className="flex-grow">
        {view === 'DASHBOARD' && <GovernanceDashboard />}
        {view === 'CORTEX' && <SPEDCortex />}
        {view === 'KERNEL' && <AGIKernel />}
      </main>
      
      <footer className="h-20 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center border-t border-olive/20 text-[11px] uppercase tracking-[0.2em] text-natural-text opacity-60 font-sans mt-auto py-4 md:py-0">
        <div className="flex items-center gap-3">
          <div className="px-2 py-0.5 bg-olive text-white text-[9px] font-bold rounded tracking-widest">MIT</div>
          <span className="font-semibold tracking-[0.1em]">License Open Source</span>
        </div>
        <div className="flex gap-4 md:gap-8 mt-2 md:mt-0">
          <span>Status: <span className="text-emerald-600 font-bold">Synchronized</span></span>
          <span>Loc: PORT_3000</span>
          <span>Ref: AG-ALPHA</span>
        </div>
      </footer>
    </div>
  );
}



