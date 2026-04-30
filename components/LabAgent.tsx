
import React, { useState, useRef, useEffect } from 'react';
import { createSupportChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { Brain, Search, Terminal, Zap, Info, ArrowRight, FlaskConical, Database, Sparkles, Cpu, Globe, Activity, Code, Layers } from 'lucide-react';
import { GroundingSource } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
  timestamp: string;
}

export const LabAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: "System Online. I am **Crystal**, your Laboratory Intelligence Agent. How can I assist with your crystallographic research today? I have full access to global databases and deep reasoning capabilities.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSmart, setIsSmart] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const chatSession = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSession.current = createSupportChat(isSmart);
  }, [isSmart]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatSession.current) return;

    const userMsg = input;
    const time = new Date().toLocaleTimeString();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: time }]);
    setLoading(true);

    try {
      const response: GenerateContentResponse = await chatSession.current.sendMessage({ message: userMsg });
      
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const sources: GroundingSource[] = groundingMetadata?.groundingChunks 
        ? (groundingMetadata.groundingChunks as any[])
          .map((chunk) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
          .filter((s): s is GroundingSource => s !== null)
        : [];

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: response.text || "No data returned.",
        sources: sources.length > 0 ? sources : undefined,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      console.error("Agent Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Error: Neural link interrupted. Check network or API key status.", timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Identify peaks at 28.4°, 47.3°, and 56.1° (Cu Kα)",
    "Explain difference between X-ray and Neutron scattering lengths",
    "What is the space group of Anatase TiO2?",
    "How to determine lattice strain using W-H plot?"
  ];

  return (
    <div className={`grid grid-cols-1 ${showPanel ? 'lg:grid-cols-12 xl:grid-cols-12' : 'grid-cols-1'} gap-6 h-[calc(100vh-100px)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700`}>
      
      {/* Terminal Interface */}
      <div className={`${showPanel ? 'lg:col-span-8 xl:col-span-9' : 'col-span-1'} flex flex-col h-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-500 relative z-10`}>
        
        {/* Terminal Header */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-rose-500 transition-colors cursor-pointer" />
               <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-amber-500 transition-colors cursor-pointer" />
               <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-emerald-500 transition-colors cursor-pointer" onClick={() => setShowPanel(!showPanel)} title="Toggle Intelligence Panel" />
             </div>
             <div className="h-4 w-[1px] bg-slate-800" />
             <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-md border border-indigo-500/20">
               <Terminal className="w-3.5 h-3.5 text-indigo-400" />
               <span className="font-mono text-xs font-bold text-indigo-300">crystal_hub.exe</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowPanel(!showPanel)}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-300 transition-all font-mono text-[10px] uppercase tracking-widest mr-2"
                title="Toggle Sidebar"
             >
                <Layers className="w-3.5 h-3.5" />
                {showPanel ? 'Hide Panel' : 'Show Panel'}
             </button>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:inline-block">GEMINI-3-ULTRA Linked</span>
             </div>
             <button 
                onClick={() => setIsSmart(!isSmart)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all border ${isSmart ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'}`}
             >
                <Zap className={`w-3.5 h-3.5 ${isSmart ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-px">{isSmart ? 'Expert Mode' : 'Fast Mode'}</span>
             </button>
          </div>
        </div>

        {/* Scrollable Chat History */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gradient-to-b from-transparent to-slate-900/50"
        >
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group max-w-full`}
            >
              <div className={`flex items-center gap-3 mb-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-violet-500/20 border-violet-500/30 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.2)]'}`}>
                   {msg.role === 'user' ? <Terminal className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                 </div>
                 <div className={`flex items-baseline gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                   <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{msg.role === 'user' ? 'User' : 'Crystal'}</span>
                   <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                 </div>
              </div>
              
              <div className={`max-w-[85%] px-5 py-4 rounded-2xl border relative ${
                msg.role === 'user' 
                  ? 'bg-indigo-600/10 border-indigo-500/20 rounded-tr-sm text-slate-200' 
                  : 'bg-slate-800/40 border-slate-700/50 rounded-tl-sm text-slate-300'
              }`}>
                {msg.role === 'model' && (
                  <div className="absolute top-4 -left-[1px] w-[2px] h-8 bg-violet-500 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                )}
                
                <div className={`prose prose-sm prose-invert max-w-none ${msg.role === 'user' ? 'prose-p:text-slate-200' : 'prose-p:text-slate-300'} prose-headings:text-indigo-300 prose-a:text-indigo-400 prose-strong:text-white prose-code:text-amber-300 prose-code:bg-slate-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-slate-700 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Grounding Sources</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {msg.sources.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-start gap-2.5 p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 transition-all group/link">
                           <div className="w-6 h-6 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover/link:bg-emerald-500/20">
                             <Search className="w-3 h-3" />
                           </div>
                           <div className="flex flex-col min-w-0">
                             <span className="text-xs text-slate-300 truncate font-semibold group-hover/link:text-emerald-300 transition-colors leading-tight mb-0.5">{s.title}</span>
                             <span className="text-[9px] text-slate-500 truncate font-mono">{new URL(s.uri).hostname}</span>
                           </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex flex-col items-start animate-in fade-in zoom-in-95 duration-300">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0">
                   <Brain className="w-4 h-4 animate-pulse" />
                 </div>
                 <div className="flex items-baseline gap-2">
                   <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Crystal</span>
                   <span className="text-[10px] text-violet-400 font-mono animate-pulse">Computing...</span>
                 </div>
              </div>
              <div className="bg-slate-800/40 px-6 py-4 rounded-2xl rounded-tl-sm border border-slate-700/50 flex items-center gap-4 relative">
                 <div className="absolute top-4 -left-[1px] w-[2px] h-8 bg-violet-500 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-pulse" />
                 <div className="flex gap-1.5">
                   <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" />
                 </div>
                 <span className="text-xs font-mono text-slate-400">Synthesizing response...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-slate-950/80 border-t border-slate-800 shrink-0 backdrop-blur-xl">
          <form onSubmit={handleSend} className="relative group/form max-w-4xl mx-auto">
            <div className="relative flex items-center bg-slate-900/50 border border-slate-700/60 hover:border-indigo-500/30 rounded-2xl p-1.5 focus-within:border-indigo-500/60 focus-within:bg-slate-900/80 transition-all shadow-inner focus-within:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <div className="pl-4 pr-3 text-indigo-400/80 group-focus-within/form:text-indigo-400 transition-colors">
                <Code className="w-5 h-5" />
              </div>
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Query database, request calculations, or ask crystallographic questions..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-[15px] py-3.5 font-medium leading-relaxed"
                autoComplete="off"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800/80 disabled:text-slate-600 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-lg hover:shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center ml-2 mr-1"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
          <div className="mt-4 flex items-center justify-between max-w-4xl mx-auto px-2">
             <div className="flex items-center gap-2.5">
               <div className="p-1 px-2 border border-slate-800 rounded bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                 <Info className="w-3 h-3" />
                 Engine v4.0 Active
               </div>
             </div>
             <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
               <div className="flex items-center gap-1.5 text-emerald-400/90 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 
                 SECURE LINK
               </div>
             </div>
          </div>
        </div>
      </div>

      {showPanel && (
        <div className="lg:col-span-4 xl:col-span-3 space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-6 animate-in slide-in-from-right-8 opacity-0 fade-in duration-500 fill-mode-forwards relative z-0">
          
          {/* Agent Persona Card */}
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition-colors duration-700" />
           <div className="relative z-10 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none mb-1">Crystal Intel</h3>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Research Orchestrator</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">An advanced AI assistant designed to interpret structural data, guide data analysis, and cross-reference results with global crystallographic databases.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                 {['SEARCH_ENABLED', 'ANALYTICAL_REASONING', 'DATA_EXTRACTION'].map(tag => (
                   <span key={tag} className="px-2 py-1 bg-slate-800 rounded-md text-[9px] font-mono font-bold text-slate-300 border border-slate-700 uppercase tracking-widest">{tag}</span>
                 ))}
              </div>
           </div>
        </div>

        {/* Dynamic Suggestions */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg">
           <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-800">
             <Sparkles className="w-4 h-4 text-amber-500" />
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Queries</h4>
           </div>
           <div className="space-y-2.5">
             {suggestions.map((s, i) => (
               <button 
                key={i}
                onClick={() => setInput(s)}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 transition-all text-xs font-semibold text-slate-300 hover:text-white leading-snug group flex items-start gap-3"
               >
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-indigo-400 transition-colors mt-1.5 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0)] group-hover:shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                 <span>{s}</span>
               </button>
             ))}
           </div>
        </div>

        {/* System Capabilities Hub */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-lg">
           <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
             <Layers className="w-4 h-4 text-emerald-500" />
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subsystem Status</h4>
           </div>
           <div className="grid grid-cols-2 gap-3">
             {[
               { icon: Globe, label: 'Search Grounding', status: 'ACTIVE', color: 'emerald' },
               { icon: Database, label: 'Crystal DB Access', status: 'READY', color: 'cyan' },
               { icon: Cpu, label: 'Neural Engine', status: 'EXPERT', color: 'amber' },
               { icon: FlaskConical, label: 'Lab Tools', status: 'LINKED', color: 'indigo' },
             ].map((sub, i) => (
               <div key={i} className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex flex-col gap-2 group hover:bg-slate-800 transition-colors relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-12 h-12 bg-${sub.color}-500/10 rounded-full blur-xl -mr-4 -mt-4 transition-transform group-hover:scale-150`} />
                  <div className="relative z-10 flex items-center justify-between">
                    <sub.icon className={`w-4 h-4 text-${sub.color}-400`} />
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-black text-${sub.color}-400 font-mono tracking-wider`}>{sub.status}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-300 tracking-wide mt-1 relative z-10 block truncate">{sub.label}</p>
               </div>
             ))}
           </div>
        </div>

        {/* Lab Stats / Quick Tips */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-2xl border border-indigo-500/20 p-5 shadow-lg relative overflow-hidden">
           <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-3">
               <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                 <Activity className="w-4 h-4 text-indigo-400" />
               </div>
               <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Active Context</span>
             </div>
             <p className="text-xs text-slate-300 leading-relaxed font-medium">
               Monitoring simulation states. Ask me to compare <span className="text-amber-300">Scherrer</span> vs <span className="text-amber-300">Warren-Averbach</span>, or to summarize peaks generated from the Deep Learning Phase ID tool.
             </p>
           </div>
        </div>

        </div>
      )}
    </div>
  );
};
