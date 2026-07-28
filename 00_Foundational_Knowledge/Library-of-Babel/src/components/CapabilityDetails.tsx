/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capability } from "../types";
import { Code, Layers, History, Lightbulb, Package } from "lucide-react";

interface CapabilityDetailsProps {
  capability: Capability;
}

export default function CapabilityDetails({ capability }: CapabilityDetailsProps) {
  return (
    <div
      key={capability.id}
      className="max-w-4xl mx-auto p-12 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <header className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-500 rounded-full text-xs font-mono">
          <span className="opacity-50">{capability.volume}</span>
          <span className="opacity-20">/</span>
          <span>{capability.chapter}</span>
        </div>
        <h2 className="font-display text-5xl font-bold tracking-tight text-neutral-900">
          {capability.name}
        </h2>
        <p className="text-xl text-neutral-600 leading-relaxed max-w-2xl">
          {capability.purpose}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-neutral-900">
            <Lightbulb size={20} className="text-neutral-400" />
            <h3 className="font-display text-lg font-bold">Why it exists</h3>
          </div>
          <p className="text-neutral-600 leading-relaxed">
            {capability.whyItExists}
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-neutral-900">
            <History size={20} className="text-neutral-400" />
            <h3 className="font-display text-lg font-bold">Evolution</h3>
          </div>
          <p className="text-neutral-600 leading-relaxed">
            {capability.evolution}
          </p>
        </section>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2 text-neutral-900">
          <Package size={20} className="text-neutral-400" />
          <h3 className="font-display text-lg font-bold">Dependencies</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {capability.dependencies.map(dep => (
            <span key={dep} className="px-3 py-1 bg-white border border-neutral-200 rounded-md text-sm font-mono text-neutral-700">
              {dep}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-900">
            <Code size={20} className="text-neutral-400" />
            <h3 className="font-display text-lg font-bold">Implementations</h3>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {capability.variants.length} variant{capability.variants.length !== 1 ? 's' : ''} found
          </span>
        </div>

        <div className="space-y-6">
          {capability.variants.map((variant, index) => (
            <div key={variant.chunk.id} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-500">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{variant.chunk.name}</p>
                    <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-tighter truncate">
                      {variant.chunk.repo} — {variant.chunk.file}
                    </p>
                  </div>
                </div>
                {variant.chunk.id === capability.bestImplementationId && (
                  <span className="px-2 py-0.5 shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-bold uppercase tracking-widest">
                    Best Implementation
                  </span>
                )}
              </div>
              <div className="p-6 overflow-x-auto bg-[#0a0a0a]">
                <pre className="font-mono text-sm leading-relaxed text-neutral-300">
                  <code>{variant.chunk.code}</code>
                </pre>
              </div>
              {variant.chunk.docstring && (
                <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100">
                  <p className="text-sm text-neutral-500 italic">
                    "{variant.chunk.docstring}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
