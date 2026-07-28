import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, CheckCircle2, AlertTriangle, XCircle, CircuitBoard, Terminal, Cpu, Activity, ShieldCheck } from 'lucide-react';
import Markdown from 'react-markdown';

export type ResultType = 'Ok' | 'Drift' | 'Err';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  resultType?: ResultType;
  coherenceScore?: number;
  provider?: string;
  command?: { type: string; payload?: Record<string, any> };
}

interface ChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  loadingText: string;
  onSend: (text: string) => void;
  themeColors?: { text: string; bg: string; shadow: string; border: string };
}

const StatusEngine = ({ type, score }: { type: ResultType; score?: number }) => {
  const config = useMemo(() => ({
    Ok: { icon: <CheckCircle2 size={12} />, color: 'text-emerald-400' },
    Drift: { icon: <AlertTriangle size={12} />, color: 'text-amber-400' },
    Err: { icon: <XCircle size={12} />, color: 'text-rose-400' }
  }), []);

  return (
    <div className="absolute -top-2 -left-2 flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full scale-90 shadow-2xl">
      <span className={config[type].color}>{config[type].icon}</span>
      <span className={`text-[9px] font-bold uppercase tracking-widest ${config[type].color}`}>{type}</span>
      {score !== undefined && <span className="text-[9px] text-slate-500 font-mono">::{(score * 100).toFixed(0)}%</span>}
    </div>
  );
};

const MessageBubble: React.FC<{ msg: ChatMessage; theme: NonNullable<ChatProps['themeColors']> }> = ({ msg, theme }) => (
  <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? theme.bg : 'bg-slate-700'}`}>
      {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
    </div>
    <div className={`p-4 rounded-2xl shadow-xl text-sm relative ${msg.sender === 'user' ? `${theme.bg} text-white` : 'bg-slate-800/90 text-slate-100 border border-slate-700'}`}>
      {msg.resultType && <StatusEngine type={msg.resultType} score={msg.coherenceScore} />}
      {msg.command && (
        <div className="mb-2 p-2 rounded-lg bg-slate-950/50 border border-violet-500/20 flex items-center gap-2 text-[10px] font-mono text-violet-300">
          <CircuitBoard size={14} /> {msg.command.type.toUpperCase()}
        </div>
      )}
      <Markdown>{msg.text}</Markdown>
    </div>
  </div>
);

export const Chat: React.FC<ChatProps> = ({ messages, isLoading, loadingText, onSend, themeColors = { text: 'text-sky-400', bg: 'bg-sky-600', shadow: 'shadow-sky-500/20', border: 'border-sky-500/50' } }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <main className="w-full lg:w-2/3 flex flex-col h-[calc(100vh-120px)] bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Terminal size={16} className="text-emerald-500" />
          <span className="text-[10px] font-bold font-mono text-slate-300 tracking-widest">DARLEK_CANN_CORE_V3.0</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
            <ShieldCheck size={12} /> SECURE_LINK
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </header>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        <AnimatePresence mode='popLayout'>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <MessageBubble msg={msg} theme={themeColors} />
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-2">
              <Activity size={14} className="animate-spin text-sky-400" />
              <span className="text-xs text-slate-400 font-mono">{loadingText}</span>
            </div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-900/50 border-t border-slate-800">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-sky-500 outline-none pr-16 font-mono text-sm"
            placeholder="Enter command sequence..."
            disabled={isLoading}
          />
          <button type="submit" disabled={!input.trim() || isLoading} className={`absolute right-2 top-2 bottom-2 px-4 ${themeColors.bg} text-white rounded-lg disabled:opacity-30 transition-all hover:brightness-110`}>
            <Send size={18} />
          </button>
        </div>
      </form>
    </main>
  );
};