import React, { useState, useEffect, useRef } from 'react';
import { Message, Attachment } from '../types';
import { Send, Sparkles, BookOpen, ExternalLink, ChevronDown, ChevronUp, Bot, User, Brain, Lightbulb, X, File as FileIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatSectionProps {
  messages: Message[];
  isSynthesizing: boolean;
  onSendMessage: (query: string, attachments?: Attachment[], githubRepo?: string, githubToken?: string) => void;
}

const SAMPLE_QUERIES = [
  {
    title: 'Spectral & Physics',
    text: 'What are the spectral operator connections to the Riemann Hypothesis (Hilbert-Polya)?'
  },
  {
    title: 'Category Theory',
    text: 'How can category theory and functorial symmetries reframe L-functions?'
  },
  {
    title: 'Random Matrices',
    text: 'Compare zero densities of zeta with random matrix theory GUE ensembles.'
  }
];

export const ChatSection: React.FC<ChatSectionProps> = ({
  messages,
  isSynthesizing,
  onSendMessage
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [expandedThinking, setExpandedThinking] = useState<{ [key: string]: boolean }>({});
  const [activeEchoPersona, setActiveEchoPersona] = useState<{ [key: string]: string }>({});
  
  const [githubRepo, setGithubRepo] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSynthesizing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0 && !githubRepo) return;
    if (isSynthesizing) return;
    onSendMessage(input, attachments, githubRepo, githubToken);
    setInput('');
    setAttachments([]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleThinking = (msgId: string) => {
    setExpandedThinking((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  return (
    <div id="chat-section-container" className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-0 h-full">
      {/* Scrollable Message Logs */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6 py-12">
            <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Quantum Synthesis Sandbox</h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Configure your multi-disciplinary agents and core focus areas above. Submit a complex theoretical question, and watch them collaborate through parallel deliberation and synthesis.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full pt-4">
              {SAMPLE_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q.text)}
                  className="p-3 text-left bg-slate-900 border border-slate-800 rounded-xl hover:border-sky-500/50 hover:bg-slate-800/40 transition-all text-xs space-y-1 group"
                >
                  <span className="font-bold text-sky-400 block group-hover:text-sky-300 transition-colors">{q.title}</span>
                  <span className="text-slate-400 line-clamp-3 leading-normal">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 p-4 rounded-xl border ${
              msg.role === 'user'
                ? 'bg-slate-900/40 border-slate-800/80 ml-auto max-w-2xl'
                : 'bg-slate-900 border-slate-800 mr-auto max-w-4xl w-full'
            }`}
          >
            {/* Avatar Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-sky-500/10 text-sky-400' : 'bg-purple-500/10 text-purple-400'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="flex-1 space-y-4 overflow-hidden">
              {/* Message Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {msg.role === 'user' ? 'User' : 'Synthesized Response'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {/* Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded text-[11px] font-mono text-sky-300">
                      <FileIcon className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Parallel Echo Chamber logs */}
              {msg.personaOutputs && msg.personaOutputs.length > 0 && (
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <Brain className="w-3.5 h-3.5 text-sky-400" />
                    <span>Agent Deliberations</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2">
                    {msg.personaOutputs.map((po) => {
                      const isSelected = activeEchoPersona[msg.id] === po.personaId || (!activeEchoPersona[msg.id] && msg.personaOutputs?.[0]?.personaId === po.personaId);
                      return (
                        <button
                          key={po.personaId}
                          onClick={() => setActiveEchoPersona(prev => ({ ...prev, [msg.id]: po.personaId }))}
                          className={`px-2 py-1 rounded text-[10px] font-mono transition-all border ${
                            isSelected
                              ? 'bg-sky-500/10 border-sky-500/30 text-sky-300 font-bold'
                              : 'bg-slate-900 border-transparent text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {po.personaName.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                  {/* Deliberation Body */}
                  <div className="text-xs text-slate-300 leading-relaxed italic p-1.5 font-sans">
                    {msg.personaOutputs.find(po => po.personaId === (activeEchoPersona[msg.id] || msg.personaOutputs?.[0]?.personaId))?.output || ""}
                  </div>
                </div>
              )}

              {/* Collapsible deep thinking trace */}
              {msg.thinking && (
                <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-950/40">
                  <button
                    onClick={() => toggleThinking(msg.id)}
                    className="w-full flex items-center justify-between p-2.5 text-xs text-amber-400/90 font-mono font-medium hover:bg-slate-900/60 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{expandedThinking[msg.id] ? 'Hide' : 'View'} Reasoning Process ({msg.thinking.length} chars)</span>
                    </span>
                    {expandedThinking[msg.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {expandedThinking[msg.id] && (
                    <div className="p-3 bg-slate-950 border-t border-slate-900 text-[11px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
                      {msg.thinking}
                    </div>
                  )}
                </div>
              )}

              {/* Content body */}
              <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>

              {/* Grounding URL display */}
              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="pt-3 border-t border-slate-800/60 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Grounded Sources for Verification</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingSources.map((source, sIdx) => (
                      <a
                        key={sIdx}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] text-sky-400 hover:text-sky-300 hover:border-sky-500/30 transition-all font-mono"
                      >
                        <span className="truncate max-w-[150px]">{source.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Synthesizing Skeleton */}
        {isSynthesizing && (
          <div className="flex gap-4 p-4 rounded-xl border bg-slate-900 border-slate-800 mr-auto max-w-4xl w-full animate-pulse">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>SYNTHESIZING RESPONSE...</span>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-850 rounded w-1/4"></div>
                <div className="h-4 bg-slate-850 rounded w-3/4"></div>
                <div className="h-4 bg-slate-850 rounded w-5/6"></div>
              </div>
              <div className="text-xs text-sky-400 font-mono italic animate-pulse mt-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping"></span>
                <span>Generating agent responses...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Tray */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 backdrop-blur shrink-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-4xl mx-auto">
          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md text-xs font-mono text-slate-300 shrink-0">
                  <FileIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button 
                    type="button" 
                    onClick={() => removeAttachment(idx)}
                    className="text-slate-500 hover:text-rose-400 transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {showSettings && (
            <div className="flex flex-col sm:flex-row gap-2 mb-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <input
                type="text"
                placeholder="GitHub Repo (e.g. facebook/react)"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                className="flex-1 py-2 px-3 rounded bg-slate-900 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-slate-200 text-xs"
              />
              <input
                type="password"
                placeholder="GitHub Token (optional, for private repos)"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="flex-1 py-2 px-3 rounded bg-slate-900 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-slate-200 text-xs"
              />
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSynthesizing}
              placeholder="Ask your multidisciplinary agents a complex theoretical question..."
              className="flex-1 py-2.5 px-4 rounded-lg bg-slate-950 border border-slate-850 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-slate-100 placeholder-slate-500 text-sm transition-all disabled:opacity-50"
            />
            <button
              type="button"
              className={`p-2.5 rounded-lg border transition-all flex items-center justify-center shrink-0 disabled:opacity-50 ${showSettings ? 'bg-slate-700 border-sky-500 text-sky-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'}`}
              onClick={() => setShowSettings(!showSettings)}
              title="GitHub Settings"
              disabled={isSynthesizing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </button>
            <button
              type="button"
              className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isSynthesizing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                
                Array.from(files).forEach(file => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const data = e.target?.result as string;
                    setAttachments(prev => [...prev, {
                      name: file.name,
                      mimeType: file.type || 'application/octet-stream',
                      data
                    }]);
                  };
                  reader.readAsDataURL(file);
                });
                
                // Clear the input so the same file can be selected again
                e.target.value = '';
              }}
            />
            <button
              type="submit"
              disabled={(!input.trim() && attachments.length === 0) || isSynthesizing}
              className="py-2.5 px-5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 transition-all text-white font-medium text-sm flex items-center gap-1.5 shadow-lg shadow-sky-900/20"
            >
              <span>Analyze</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
        <div className="flex flex-col items-center gap-1 mt-2">
          <p className="text-[10px] text-slate-500 text-center font-mono">
            Model: gemini-3.5-flash with HIGH reasoning levels and Google Search grounding.
          </p>
          <span className="text-[9px] text-slate-600 block lg:hidden">&copy; Trademark Huckerby 2026. MIT Not For Profit.</span>
        </div>
      </div>
    </div>
  );
};
