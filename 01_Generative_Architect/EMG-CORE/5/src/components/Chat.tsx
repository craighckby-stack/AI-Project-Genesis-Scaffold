import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, CheckCircle2, AlertTriangle, XCircle, Info, CircuitBoard } from 'lucide-react';
import Markdown from 'react-markdown';

interface ChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  loadingText: string;
  onSend: (text: string) => void;
  themeColors?: Record<string, string>;
}

export const Chat: React.FC<ChatProps> = ({ messages, isLoading, loadingText, onSend, themeColors = { text: 'text-sky-400', bg: 'bg-sky-500', shadow: 'shadow-sky-500/20', border: 'border-sky-500/50' } as any }) => {
  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  const getResultIcon = (type?: string) => {
    switch (type) {
      case 'Ok': return <CheckCircle2 size={12} className="text-emerald-400" />;
      case 'Drift': return <AlertTriangle size={12} className="text-amber-400" />;
      case 'Err': return <XCircle size={12} className="text-rose-400" />;
      default: return null;
    }
  };

  return (
    <main className="w-full lg:w-2/3 flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)] relative">
      {/* System Status Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest">EMG Core v5.0</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="hidden sm:flex items-center gap-4 text-[9px] font-mono text-slate-500">
            <span>FRICTION: <span className="text-rose-400">0.70</span></span>
            <span>CDR: <span className="text-yellow-400">0.15</span></span>
            <span>SUBSTRATE: <span className="text-violet-400">BRIDGE_ACTIVE</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-600 uppercase">Status: </span>
          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Operational</span>
        </div>
      </div>

      {/* Chat History Area */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto space-y-6 p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl mb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent backdrop-blur-sm"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                  msg.sender === 'user' 
                  ? themeColors.bg 
                  : msg.sender === 'system' 
                    ? 'bg-slate-800 border border-slate-600'
                    : 'bg-slate-700 border border-slate-600'
                }`}>
                  {msg.sender === 'user' ? <User size={16} /> : msg.sender === 'system' ? <Info size={16} className="text-slate-400" /> : <Bot size={16} className={themeColors.text} />}
                </div>
                <div className={`p-4 rounded-2xl shadow-xl leading-relaxed text-sm relative group ${
                  msg.sender === 'user' 
                  ? `${themeColors.bg} text-white rounded-tr-none border ${themeColors.border}` 
                  : msg.sender === 'system'
                    ? 'bg-slate-900 border border-violet-500/30 text-violet-300 font-mono italic shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'bg-slate-700/80 text-slate-100 rounded-tl-none border border-slate-600/50'
                }`}>
                  {msg.sender === 'ai' && msg.resultType && (
                    <div className="absolute -top-2 -left-2 flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full scale-90 shadow-lg">
                      {getResultIcon(msg.resultType)}
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${msg.resultType === 'Ok' ? 'text-emerald-400' : msg.resultType === 'Drift' ? 'text-amber-400' : 'text-rose-400'}`}>
                        {msg.resultType}
                      </span>
                      {msg.coherenceScore !== undefined && (
                        <span className="text-[9px] text-slate-500 font-mono">
                          ::{(msg.coherenceScore * 100).toFixed(0)}%
                        </span>
                      )}
                      {msg.provider && (
                        <span className="text-[9px] text-violet-400/60 font-mono uppercase border-l border-slate-700 pl-1.5 ml-1">
                          {msg.provider}
                        </span>
                      )}
                    </div>
                  )}

                  {msg.command && (
                    <div className={`mb-2 p-2 rounded-lg bg-slate-900/50 border border-violet-500/30 flex items-center gap-2 text-[10px] font-mono text-violet-300`}>
                      <CircuitBoard size={14} className="text-violet-400" />
                      <span>EXECUTED: {msg.command.type}</span>
                    </div>
                  )}
                  
                  <div className="markdown-body">
                    <Markdown>{msg.text}</Markdown>
                  </div>

                  <span className="text-[10px] opacity-40 mt-2 block text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50 shadow-lg">
              <div className={`w-2 h-2 ${themeColors.bg} rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
              <div className={`w-2 h-2 ${themeColors.bg} rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
              <div className={`w-2 h-2 ${themeColors.bg} rounded-full animate-bounce`}></div>
              <span className={`text-xs ${themeColors.text} font-mono ml-2`}>{loadingText}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question or concept here..."
          className="w-full p-5 bg-slate-800/80 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm placeholder-slate-500 transition-all outline-none shadow-2xl backdrop-blur-md pr-16"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeColors.bg} hover:opacity-80 text-white p-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none`}
        >
          <Send size={20} />
        </button>
      </form>
    </main>
  );
};
