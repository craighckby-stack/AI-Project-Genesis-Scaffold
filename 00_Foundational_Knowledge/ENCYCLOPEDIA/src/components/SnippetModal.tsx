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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans">
      <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(192,38,211,0.15)] border border-slate-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Code size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-lg font-display tracking-wide">Inject Capability Mutation</h2>
              <p className="text-xs text-slate-400 font-mono">Manual Capability Indexing Input</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-900 border border-fuchsia-900/30 rounded-xl p-5 shadow-inner">
              <div className="flex items-start gap-3">
                <Cpu size={18} className="text-fuchsia-500 mt-0.5 shrink-0 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                  Paste raw code to be analyzed by the semantic engine. It will automatically categorize, explain, and index the capabilities into the correct Encyclopedia taxonomy.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Code Payload <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.codeSnippet}
                  onChange={(e) => setFormData({ ...formData, codeSnippet: e.target.value })}
                  className="w-full h-48 bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[11px] p-5 rounded-xl focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none resize-none shadow-inner tracking-wide"
                  placeholder="// Paste your code or function implementation here..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Source Target (Repo)
                  </label>
                  <input
                    type="text"
                    value={formData.sourceRepo}
                    onChange={(e) => setFormData({ ...formData, sourceRepo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-4 py-3 text-xs rounded-xl focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none font-mono placeholder-slate-600"
                    placeholder="owner/repo"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    File Vector Path
                  </label>
                  <input
                    type="text"
                    value={formData.sourceFile}
                    onChange={(e) => setFormData({ ...formData, sourceFile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-4 py-3 text-xs rounded-xl focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none font-mono placeholder-slate-600"
                    placeholder="src/utils/helper.ts"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Syntax Protocol (Language)
                </label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-4 py-3 text-xs rounded-xl focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none font-mono placeholder-slate-600"
                  placeholder="typescript, python, go, rust..."
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-950/50 border border-rose-900 text-rose-400 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(192,38,211,0.3)] hover:shadow-[0_0_25px_rgba(192,38,211,0.5)]"
              >
                {loading ? "Processing..." : (
                  <>
                    <Save size={16} />
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
