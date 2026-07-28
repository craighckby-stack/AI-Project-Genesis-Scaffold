import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User } from 'lucide-react';

interface ChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  loadingText: string;
  onSend: (text: string) => void;
}

export const Chat: React.FC<ChatProps> = ({ messages, isLoading, loadingText, onSend }) => {
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

  return (
    <main className="w-full lg:w-2/3 flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)]">
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
              <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${msg.sender === 'user' ? 'bg-sky-600' : 'bg-slate-700 border border-slate-600'}`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} className="text-sky-400" />}
                </div>
                <div className={`p-4 rounded-2xl shadow-xl leading-relaxed text-sm ${
                  msg.sender === 'user' 
                  ? 'bg-sky-600 text-white rounded-tr-none' 
                  : 'bg-slate-700/80 text-slate-100 rounded-tl-none border border-slate-600/50'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
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
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"></div>
              <span className="text-xs text-sky-400 font-mono ml-2">{loadingText}</span>
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
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-sky-600 hover:bg-sky-500 text-white p-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Send size={20} />
        </button>
      </form>
    </main>
  );
};
