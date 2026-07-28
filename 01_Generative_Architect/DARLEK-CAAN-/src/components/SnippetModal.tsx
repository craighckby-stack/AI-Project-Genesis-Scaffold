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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono terminal-scanline">
      <div className="bg-[#050000] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(220,38,38,0.2)] border border-red-900/50">
        <div className="flex items-center justify-between p-4 border-b border-red-900/50 bg-black">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-red-900/20 flex items-center justify-center text-red-500 border border-red-900/50">
              <Code size={18} />
            </div>
            <div>
              <h2 className="font-bold text-red-500 uppercase tracking-widest text-lg">Inject Mutation</h2>
              <p className="text-[10px] text-red-700 uppercase tracking-widest">Manual capability indexing</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-red-500 hover:bg-red-900/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#0a0000] border border-red-900/50 p-4 mb-6">
              <div className="flex items-start gap-3">
                <Cpu size={16} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 leading-relaxed uppercase tracking-widest">
                  Paste raw code to be analyzed by the DARLEK CAAN semantic engine. It will automatically categorize and classify the capabilities.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">
                  Code Payload <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  value={formData.codeSnippet}
                  onChange={(e) => setFormData({ ...formData, codeSnippet: e.target.value })}
                  className="w-full h-48 bg-[#1a0000] border border-red-900/50 text-red-400 font-mono text-xs p-3 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                  placeholder="// PASTE CODE HERE..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">
                    Source Target
                  </label>
                  <input
                    type="text"
                    value={formData.sourceRepo}
                    onChange={(e) => setFormData({ ...formData, sourceRepo: e.target.value })}
                    className="w-full bg-[#1a0000] border border-red-900/50 text-red-500 px-3 py-2 text-xs uppercase tracking-widest focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="OWNER/REPO"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">
                    File Vector
                  </label>
                  <input
                    type="text"
                    value={formData.sourceFile}
                    onChange={(e) => setFormData({ ...formData, sourceFile: e.target.value })}
                    className="w-full bg-[#1a0000] border border-red-900/50 text-red-500 px-3 py-2 text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="src/path/file.ts"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">
                  Syntax Protocol
                </label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full bg-[#1a0000] border border-red-900/50 text-red-500 px-3 py-2 text-xs uppercase tracking-widest focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="typescript, python..."
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-900 text-red-500 text-xs uppercase tracking-widest">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-red-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-red-500 uppercase tracking-widest hover:bg-red-900/20 transition-colors"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-black font-bold text-xs uppercase tracking-widest hover:bg-red-500 transition-colors disabled:opacity-50"
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
