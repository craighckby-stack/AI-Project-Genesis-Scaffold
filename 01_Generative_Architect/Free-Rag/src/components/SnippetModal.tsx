import { useState } from "react";
import { X, Save, Code, Cpu } from "lucide-react";

export default function SnippetModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
  const [formData, setFormData] = useState({
    codeSnippet: "",
    sourceRepo: "",
    sourceFile: "",
    language: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/encyclopedia/snippet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to process snippet");
      }

      onSuccess(data.capabilityId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm font-sans">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Code size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg font-display">Inject Capability Mutation</h2>
              <p className="text-xs text-slate-400 font-mono">Manual Capability Indexing Input</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Cpu size={16} className="text-sky-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Paste raw code to be analyzed by the semantic engine. It will automatically categorize, explain, and index the capabilities into the correct Encyclopedia taxonomy.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Code Payload <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.codeSnippet}
                  onChange={(e) => setFormData({ ...formData, codeSnippet: e.target.value })}
                  className="w-full h-48 bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none shadow-inner"
                  placeholder="// Paste your code or function implementation here..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Source Target (Repo)
                  </label>
                  <input
                    type="text"
                    value={formData.sourceRepo}
                    onChange={(e) => setFormData({ ...formData, sourceRepo: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs rounded-xl focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    placeholder="owner/repo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    File Vector Path
                  </label>
                  <input
                    type="text"
                    value={formData.sourceFile}
                    onChange={(e) => setFormData({ ...formData, sourceFile: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs rounded-xl focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    placeholder="src/utils/helper.ts"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Syntax Protocol (Language)
                </label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-800 px-3.5 py-2.5 text-xs rounded-xl focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none"
                  placeholder="typescript, python, go, rust..."
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? "Processing..." : (
                  <>
                    <Save size={14} />
                    Execute Injection
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
