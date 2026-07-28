/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Code2 } from "lucide-react";

interface SnippetModalProps {
  onClose: () => void;
  onSuccess: (capabilityId: string) => void;
}

export default function SnippetModal({ onClose, onSuccess }: SnippetModalProps) {
  const [code, setCode] = useState("");
  const [filename, setFilename] = useState("");
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !filename || !repo) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, filename, repo }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze snippet");
      
      onSuccess(data.capabilityId);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-100 text-neutral-900 rounded-full flex items-center justify-center">
              <Code2 size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-neutral-900">Index Code Snippet</h2>
              <p className="text-sm text-neutral-500">Semantic clustering powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Repository Name</label>
              <input 
                type="text" 
                value={repo}
                onChange={e => setRepo(e.target.value)}
                placeholder="e.g. core-services"
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-neutral-700">Filename</label>
              <input 
                type="text" 
                value={filename}
                onChange={e => setFilename(e.target.value)}
                placeholder="e.g. auth/github.ts"
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-neutral-700">Code Snippet</label>
            <textarea 
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Paste implementation here..."
              className="w-full h-48 font-mono text-sm border border-neutral-200 rounded-lg p-4 focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none transition-all resize-none"
            />
          </div>
        </form>

        <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : "Analyze & Index"}
          </button>
        </div>
      </div>
    </div>
  );
}
