import React from 'react';
import { Persona, Perspective } from '../types';
import { Sliders, HelpCircle, Check, Users, ShieldAlert } from 'lucide-react';

interface PersonaSelectorProps {
  personas: Persona[];
  perspectives: Perspective[];
  activePersonaIds: string[];
  activePerspectiveIds: string[];
  onTogglePersona: (id: string) => void;
  onTogglePerspective: (id: string) => void;
  formality: number;
  technicality: number;
  rigor: number;
  onChangeWeights: (weights: { formality?: number; technicality?: number; rigor?: number }) => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  personas,
  perspectives,
  activePersonaIds,
  activePerspectiveIds,
  onTogglePersona,
  onTogglePerspective,
  formality,
  technicality,
  rigor,
  onChangeWeights
}) => {
  return (
    <div id="persona-selector" className="space-y-6">
      {/* Step 1: Active Agents / Personas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-sky-400" />
            <span>1. Select Agents ({activePersonaIds.length}/6)</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Min. 2 recommended for synthesis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
          {personas.map((p) => {
            const isActive = activePersonaIds.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => onTogglePersona(p.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-sky-500/10 border-sky-500/40 text-slate-100 shadow-lg shadow-sky-500/5'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className={`text-xs font-bold tracking-tight uppercase ${isActive ? 'text-sky-300' : 'text-slate-400'}`}>
                      {p.name}
                    </span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isActive ? 'bg-sky-500 text-slate-900' : 'border border-slate-700'}`}>
                      {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">{p.specialty}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Conceptual Perspectives */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>2. Select Perspectives ({activePerspectiveIds.length}/8)</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Used to guide agent logic</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
          {perspectives.map((p) => {
            const isActive = activePerspectiveIds.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => onTogglePerspective(p.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-100 shadow-lg shadow-emerald-500/5'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className={`text-xs font-bold tracking-tight ${isActive ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {p.name}
                    </span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isActive ? 'bg-emerald-500 text-slate-900' : 'border border-slate-700'}`}>
                      {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 3: Synthesis Dials */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>3. Adjust Synthesis Parameters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formality Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 uppercase">Formality</span>
              <span className="font-mono text-purple-400 font-bold">{formality}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={formality}
              onChange={(e) => onChangeWeights({ formality: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Layman / Chat</span>
              <span>Rigorous Academic</span>
            </div>
          </div>

          {/* Technical Density Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 uppercase">Technical Density</span>
              <span className="font-mono text-purple-400 font-bold">{technicality}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={technicality}
              onChange={(e) => onChangeWeights({ technicality: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Intuitive Analogy</span>
              <span>Deep Math / LaTeX</span>
            </div>
          </div>

          {/* Mathematical Rigor Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 uppercase">Axiomatic Rigor</span>
              <span className="font-mono text-purple-400 font-bold">{rigor}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={rigor}
              onChange={(e) => onChangeWeights({ rigor: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Conceptual Links</span>
              <span>Formal Axioms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
