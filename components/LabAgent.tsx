
import React, { useState, useRef, useEffect } from 'react';
import { createSupportChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { Brain, Search, Terminal, Zap, Info, ArrowRight, FlaskConical, Database, Sparkles, Cpu, Globe } from 'lucide-react';
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
    "Search for standard peak positions of Ti-6Al-4V",
    "Explain the difference between X-ray and Neutron scattering lengths",
    "What is the space group of Anatase TiO2?",
    "How do I determine lattice strain using W-H plot?"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Terminal Interface */}
      <div className="lg:col-span-8 flex flex-col h-full bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/5">
        
        {/* Terminal Header */}
        <div className="p-4 bg-slate-950 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5">
               <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
               <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
               <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
             </div>
             <div className="h-4 w-[1px] bg-white/10 mx-2" />
             <div className="flex items-center gap-2">
               <Terminal className="w-4 h-4 text-indigo-400" />
               <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crystal-AI Interactive Hub</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
               <span className="text-[10px] font-mono text-indigo-300 font-bold">MODEL: GEMINI-3-ULTRA</span>
             </div>
             <button 
                onClick={() => setIsSmart(!isSmart)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all border ${isSmart ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
             >
                <Zap className={`w-3 h-3 ${isSmart ? 'fill-amber-400' : ''}`} />
                <span className="text-[10px] font-bold tracking-tighter">{isSmart ? 'EXPERT_MODE' : 'FAST_MODE'}</span>
             </button>
          </div>
        </div>

        {/* Scrollable Chat History */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-slate-950 to-slate-900"
        >
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group`}
            >
              <div className={`flex items-center gap-2 mb-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{msg.role === 'user' ? 'RAF' : 'CRYSTAL'}</span>
                 <span className="text-[9px] text-slate-600 font-mono">{msg.timestamp}</span>
              </div>
              
              <div className={`max-w-[85%] px-5 py-4 rounded-2xl shadow-lg border relative transition-all duration-300 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white border-white/10 rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border-white/5 rounded-tl-none group-hover:border-indigo-500/30'
              }`}>
                {msg.role === 'model' && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                
                <div className="prose prose-sm prose-invert max-w-none prose-headings:text-indigo-300 prose-a:text-indigo-400 prose-strong:text-white leading-relaxed">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Verified Scientific Sources</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.sources.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/5 hover:border-emerald-500/30 hover:bg-black/50 transition-all group/link overflow-hidden">
                           <div className="w-5 h-5 shrink-0 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                             <Search className="w-3 h-3" />
                           </div>
                           <span className="text-[9px] text-slate-300 truncate font-medium group-hover/link:text-white transition-colors">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex flex-col items-start animate-in fade-in duration-300">
               <div className="flex items-center gap-2 mb-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CRYSTAL</span>
                 <span className="text-[9px] text-indigo-400 font-mono animate-pulse">PROCESSING_STREAM...</span>
              </div>
              <div className="bg-slate-800 px-6 py-4 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-3">
                 <div className="flex gap-1.5">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                 </div>
                 <span className="text-[10px] font-mono text-slate-400">Consulting Global Databases...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-slate-950 border-t border-white/5 relative shrink-0">
          <form onSubmit={handleSend} className="relative group/form">
            <div className="absolute inset-0 bg-indigo-500/5 blur-xl group-focus-within/form:bg-indigo-500/10 transition-all rounded-full pointer-events-none" />
            <div className="relative flex items-center gap-3 bg-slate-900 border border-white/5 rounded-2xl p-2 pl-5 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all shadow-inner">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Crystal about crystallography, materials, or data interpretation..."
                className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-600 text-sm py-2"
              />
              <button 
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-lg transition-all active:scale-95"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
          <div className="mt-3 flex items-center justify-between px-2">
             <div className="flex items-center gap-2">
               <Info className="w-3 h-3 text-slate-500" />
               <span className="text-[9px] text-slate-500 italic">Connected to Grounded Scientific Engine v4.0</span>
             </div>
             <div className="text-[9px] text-slate-500 font-mono">ENCRYPTED_LINK_ESTABLISHED</div>
          </div>
        </div>
      </div>

      {/* Side Intelligence Panel */}
      <div className="lg:col-span-4 space-y-6 overflow-y-auto custom-scrollbar pr-1">
        
        {/* Agent Persona Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden group">
           <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
           <div className="relative z-10 flex flex-col gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                <Brain className="w-8 h-8 text-white drop-shadow-md" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">CRYSTAL INTEL</h3>
                <p className="text-xs text-indigo-100 font-medium opacity-90 leading-relaxed">Multimodal Research Orchestrator for Structural Analysis</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                 {['SEARCH_LINK', 'RIETVELD_PRO', 'CIF_RESOLVER'].map(tag => (
                   <span key={tag} className="px-2 py-0.5 bg-black/20 rounded text-[9px] font-mono text-white/80 border border-white/10">{tag}</span>
                 ))}
              </div>
           </div>
        </div>

        {/* Dynamic Suggestions */}
        <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 space-y-4">
           <div className="flex items-center gap-2 mb-2">
             <Sparkles className="w-4 h-4 text-amber-500" />
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommended Missions</h4>
           </div>
           <div className="space-y-2">
             {suggestions.map((s, i) => (
               <button 
                key={i}
                onClick={() => setInput(s)}
                className="w-full text-left p-3 rounded-xl bg-slate-800/40 border border-white/5 hover:border-indigo-500/30 hover:bg-slate-800/80 transition-all text-[11px] text-slate-400 hover:text-white leading-snug group"
               >
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-colors" />
                    {s}
                 </div>
               </button>
             ))}
           </div>
        </div>

        {/* System Capabilities Hub */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-5">
           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subsystem Status</h4>
           <div className="grid grid-cols-2 gap-3">
             {[
               { icon: Globe, label: 'Search Grounding', status: 'ACTIVE', color: 'emerald' },
               { icon: Database, label: 'Crystal DB Access', status: 'READY', color: 'cyan' },
               { icon: Cpu, label: 'Neural Engine', status: 'EXPERT', color: 'amber' },
               { icon: FlaskConical, label: 'Lab Interface', status: 'LINKED', color: 'indigo' },
             ].map((sub, i) => (
               <div key={i} className="p-3 bg-black/20 rounded-2xl border border-white/5 flex flex-col items-center gap-2 text-center group hover:bg-black/40 transition-colors">
                  <sub.icon className={`w-5 h-5 text-${sub.color}-500 group-hover:scale-110 transition-transform`} />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 tracking-tighter leading-none">{sub.label}</p>
                    <p className={`text-[9px] font-black text-${sub.color}-500/80 font-mono tracking-widest`}>{sub.status}</p>
                  </div>
               </div>
             ))}
           </div>
        </div>

        {/* Lab Stats / Quick Tips */}
        <div className="bg-indigo-900/20 rounded-3xl border border-indigo-500/20 p-6">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-indigo-500/20 rounded-lg">
               <Cpu className="w-4 h-4 text-indigo-400" />
             </div>
             <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Neural Context</span>
           </div>
           <p className="text-[11px] text-slate-400 leading-relaxed italic">
             "I am currently tracking the active diffraction wavelength of {messages.length > 5 ? 'various source profiles' : 'Cu K-alpha (1.5406 Å)'}. I can perform deep cross-referencing between your peaks and the Materials Project database automatically."
           </p>
        </div>

      </div>
    </div>
  );
};
