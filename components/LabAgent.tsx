import React, { useState, useRef, useEffect } from 'react';
import { createSupportChat } from '../services/geminiService';
import { Chat } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { Brain, Search, Terminal, Zap, Info, ArrowRight, FlaskConical, Database, Sparkles, Cpu, Globe, Activity, Code, Layers, Maximize2, Minimize2, Trash2, BookOpen } from 'lucide-react';
import { GroundingSource } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
  timestamp: string;
  isStreaming?: boolean;
}

export const LabAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: "Neural Link Restricted to Secure Hub. I am **Crystal**, your Structural Intelligence Agent. \n\nI can assist with indexing, phase identification, or interpreting complex diffraction physics. How shall we proceed with your laboratory data?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSmart, setIsSmart] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSession.current = createSupportChat(isSmart);
  }, [isSmart]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatSession.current || loading) return;

    const userMsg = input;
    const time = new Date().toLocaleTimeString();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: time }]);
    setLoading(true);

    try {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: '', 
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true 
      }]);

      const resultStream = await chatSession.current.sendMessageStream({ message: userMsg });
      
      let fullText = '';
      let finalSources: GroundingSource[] = [];
      
      for await (const chunk of resultStream) {
        const c = chunk as any;
        const chunkText = c.text || '';
        fullText += chunkText;
        
        // Extract grounding sources if they exist in the chunk
        const groundingMetadata = c.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
           const chunks = groundingMetadata.groundingChunks as any[];
           const sources = chunks
              .map((chunk) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
              .filter((s): s is GroundingSource => s !== null);
           
           if (sources.length > 0) {
             finalSources = [...finalSources, ...sources];
           }
        }
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsgIdx = newMessages.length - 1;
          if (newMessages[lastMsgIdx].role === 'model') {
            newMessages[lastMsgIdx] = { 
              ...newMessages[lastMsgIdx], 
              text: fullText 
            };
          }
          return newMessages;
        });
      }

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsgIdx = newMessages.length - 1;
        if (newMessages[lastMsgIdx].role === 'model') {
          newMessages[lastMsgIdx] = { 
            ...newMessages[lastMsgIdx], 
            text: fullText,
            sources: finalSources.length > 0 ? Array.from(new Set(finalSources.map(s => JSON.stringify(s)))).map(s => JSON.parse(s)) : undefined,
            isStreaming: false
          };
        }
        return newMessages;
      });

    } catch (error) {
      console.error("Agent Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "ALERT: Neural link saturation or timeout. Please check your API configuration or verify system connectivity.", 
        timestamp: new Date().toLocaleTimeString() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ 
      role: 'model', 
      text: "Memory buffer flushed. System standing by for new structural queries.",
      timestamp: new Date().toLocaleTimeString() 
    }]);
    chatSession.current = createSupportChat(isSmart);
  };

  const suggestions = [
    "Simulate Silicon (Si) XRD pattern with Cu K-alpha",
    "Identify peaks at 28.4°, 47.3°, and 56.1° (Cu Kα)",
    "Explain difference between X-ray and Neutron scattering",
    "What is the space group of Anatase TiO2?"
  ];

  return (
    <div className={`grid grid-cols-1 ${showPanel && !fullScreen ? 'lg:grid-cols-12 xl:grid-cols-12' : 'grid-cols-1'} gap-6 h-[calc(100vh-100px)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 relative`}>
      
      <div className={`${showPanel && !fullScreen ? 'lg:col-span-8 xl:col-span-9' : 'col-span-1'} flex flex-col h-full bg-[#05060b] backdrop-blur-2xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden transition-all duration-700 relative z-10`}>
        
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950/80 to-indigo-950/20 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5">
             <div className="flex gap-2.5">
               <div className="w-3.5 h-3.5 rounded-full bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500 transition-all cursor-pointer" />
               <div className="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500 transition-all cursor-pointer" />
               <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500 transition-all cursor-pointer" onClick={() => setShowPanel(!showPanel)} title="Toggle Panel" />
             </div>
             
             <div className="h-6 w-[1px] bg-white/10" />
             
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   <Terminal className="w-4 h-4 text-indigo-400" />
                   <span className="font-mono text-[11px] font-black tracking-widest text-indigo-100 uppercase">structural_intelligence_v4.2</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-400 font-bold tracking-widest uppercase">SYSLINK_ESTABLISHED</span>
             </div>

             <div className="flex items-center bg-slate-900/80 rounded-xl p-1 border border-white/10">
                <button 
                  onClick={() => setIsSmart(!isSmart)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${isSmart ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] text-black' : 'bg-transparent text-slate-500 hover:text-white'}`}
                >
                  <Zap className={`w-3.5 h-3.5 ${isSmart ? 'fill-black' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-px">{isSmart ? 'Expert' : 'Fast'}</span>
                </button>
             </div>

             <div className="h-6 w-[1px] bg-white/10" />

             <button 
                onClick={() => setFullScreen(!fullScreen)}
                className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
             >
                {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
             </button>
             
             <button 
                onClick={clearChat}
                className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
             >
                <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent)] relative scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group max-w-full animate-in slide-in-from-bottom-2 duration-500`}
            >
              <div className={`flex items-center gap-4 mb-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform group-hover:scale-105 shadow-lg ${
                   msg.role === 'user' 
                     ? 'bg-indigo-600 border-indigo-400/50 text-white shadow-indigo-500/20' 
                     : 'bg-slate-900 border-violet-500/50 text-violet-400 shadow-violet-500/10'
                 }`}>
                   {msg.role === 'user' ? <Terminal className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                 </div>
                 <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <span className="text-[11px] font-black text-slate-200 uppercase tracking-[0.2em]">{msg.role === 'user' ? 'RESEARCHER' : 'INTEL_CORE'}</span>
                   <span className="text-[9px] text-slate-500 font-mono tracking-widest">{msg.timestamp}</span>
                 </div>
              </div>
              
              <div className={`max-w-[90%] px-7 py-6 rounded-3xl border shadow-2xl relative ${
                msg.role === 'user' 
                  ? 'bg-indigo-600/10 border-indigo-500/30 rounded-tr-sm text-slate-100 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]' 
                  : 'bg-slate-900/60 backdrop-blur-xl border-slate-700/60 rounded-tl-sm text-slate-200'
              }`}>
                {msg.role === 'model' && (
                  <div className="absolute top-6 -left-[2px] w-[3px] h-12 bg-gradient-to-b from-violet-500 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
                )}
                
                <div className={`prose prose-sm prose-invert max-w-none ${msg.role === 'user' ? 'prose-p:text-slate-100' : 'prose-p:text-slate-200'} prose-headings:text-indigo-300 prose-headings:tracking-tight prose-a:text-indigo-400 prose-strong:text-indigo-300 prose-code:text-emerald-300 prose-code:bg-slate-950/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-white/5`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                {msg.isStreaming && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-ping" />
                    <span className="text-[9px] font-mono text-violet-400 uppercase tracking-widest animate-pulse">Streaming Bitstream...</span>
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-1 bg-emerald-500/20 rounded-md border border-emerald-500/30">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Verified Data Anchors</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {msg.sources.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-2xl border border-white/5 hover:border-emerald-500/40 hover:bg-slate-900 transition-all group/link shadow-md">
                           <div className="w-7 h-7 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                             <Search className="w-3.5 h-3.5" />
                           </div>
                           <div className="flex flex-col min-w-0">
                             <span className="text-xs text-slate-200 truncate font-bold group-hover/link:text-emerald-400 transition-colors leading-tight mb-1">{s.title}</span>
                             <span className="text-[9px] text-slate-500 truncate font-mono uppercase tracking-tighter">{new URL(s.uri).hostname}</span>
                           </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && !messages[messages.length - 1].isStreaming && (
            <div className="flex flex-col items-start animate-in fade-in zoom-in-95 duration-300">
               <div className="flex items-center gap-4 mb-3">
                 <div className="w-9 h-9 rounded-2xl bg-violet-600 border border-violet-400/50 text-white flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                   <Brain className="w-5 h-5 animate-pulse" />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[11px] font-black text-slate-200 uppercase tracking-[0.2em]">INTEL_CORE</span>
                   <span className="text-[9px] text-violet-400 font-mono animate-pulse uppercase">Searching Lattice Vectors...</span>
                 </div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-xl px-8 py-6 rounded-3xl rounded-tl-sm border border-slate-700/50 flex items-center gap-6 relative shadow-2xl">
                 <div className="absolute top-6 -left-[2px] w-[3px] h-12 bg-violet-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(139,92,246,0.8)]" />
                 <div className="flex gap-2">
                   <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
                 </div>
                 <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Thought Pipeline Active</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-black/40 border-t border-white/5 shrink-0 backdrop-blur-3xl">
          <form onSubmit={handleSend} className="relative group/form max-w-5xl mx-auto">
            <div className="relative flex items-center bg-slate-900/40 border border-white/10 hover:border-indigo-500/40 rounded-[2rem] p-2 focus-within:border-indigo-500/60 focus-within:bg-slate-900/60 transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)] focus-within:shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-1 ring-white/5">
              <div className="pl-6 pr-4 text-indigo-400 group-focus-within/form:text-indigo-300 transition-colors">
                <Code className="w-6 h-6" />
              </div>
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Request indexing, simulate phases, or query structural constants..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-600 text-base py-4 font-medium"
                autoComplete="off"
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:pointer-events-none text-white w-14 h-14 rounded-full shadow-2xl hover:shadow-indigo-500/40 active:scale-95 transition-all flex items-center justify-center ml-2 mr-1"
              >
                <ArrowRight className={`w-6 h-6 ${loading ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </form>
          
          <div className="mt-5 flex items-center justify-between max-w-5xl mx-auto px-6">
             <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-slate-950 border border-white/5 rounded-lg flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Safe_Execution_Layer_v4</span>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 font-bold group">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 
                  QUANTUM_ENCRYPTED
               </div>
             </div>
          </div>
        </div>
      </div>

      {showPanel && !fullScreen && (
        <div className="lg:col-span-4 xl:col-span-3 space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-10 animate-in slide-in-from-right-8 duration-700 relative z-0">
          
          <div className="bg-[#0b0e14] p-7 rounded-[2rem] shadow-2xl border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-[80px] -mr-16 -mt-16" />
           
           <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <Brain className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h3 className="text-[22px] font-black text-white tracking-tighter leading-none mb-1.5">CRYSTAL_OS</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Interface v5.1</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                 <p className="text-xs text-slate-400 leading-relaxed font-semibold italic">"Orchestrating structural analysis and database synthesis."</p>
                 <div className="flex flex-wrap gap-2">
                   {['HPC_GROUNDED', 'DIFFRACTION_MODELER', 'ATOMIC_SOLVER'].map(tag => (
                     <span key={tag} className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-mono font-black text-indigo-100 border border-white/5 uppercase tracking-[0.1em]">{tag}</span>
                   ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-[#0b0e14] rounded-[2rem] border border-white/5 p-7 space-y-6 shadow-2xl">
           <div className="flex items-center justify-between pb-4 border-b border-white/5">
             <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategy Injectors</h4>
             </div>
           </div>
           
           <div className="space-y-3.5">
             {suggestions.map((s, i) => (
               <button 
                key={i}
                onClick={() => setInput(s)}
                className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-slate-900 transition-all text-xs font-bold text-slate-300 hover:text-white leading-relaxed group flex items-start gap-4"
               >
                 <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-indigo-400 transition-all mt-1.5 shrink-0" />
                 <span>{s}</span>
               </button>
             ))}
           </div>
        </div>

        <div className="bg-[#0b0e14] rounded-[2rem] border border-white/5 p-7 shadow-2xl relative overflow-hidden">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
             <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
               <Database className="w-4 h-4 text-emerald-400" />
             </div>
             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Tracking HUD</h4>
           </div>

           <div className="space-y-5">
              <div className="flex items-center gap-4 group">
                 <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-slate-500" />
                 </div>
                 <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Active Phase</span>
                    <span className="text-xs font-black text-white truncate uppercase tracking-tighter">Monitoring Thread...</span>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 group">
                 <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-5 h-5 text-slate-500" />
                 </div>
                 <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Radiation</span>
                    <span className="text-xs font-black text-white truncate uppercase tracking-tighter">Cu K-Alpha (1.54 Å)</span>
                 </div>
              </div>

              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-start gap-4">
                 <div className="mt-1 p-1 bg-emerald-500/20 rounded-md">
                    <Activity className="w-3 h-3 text-emerald-400" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest mb-1">System Status</span>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Neural saturation optimal. Analyzing for peak overlaps.</p>
                 </div>
              </div>
           </div>
        </div>

        </div>
      )}
    </div>
  );
};
