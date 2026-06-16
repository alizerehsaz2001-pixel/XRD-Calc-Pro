
import React, { useState, useRef, useEffect } from 'react';
import { createSupportChat, isQuotaError, isPermissionError } from '../services/geminiService';
import { Chat, GenerateContentResponse, GroundingChunk } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { GroundingSource } from '../types';
import { Sparkles, Database, RefreshCw, Info } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
}

export const AIChatSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeResult, setActiveResult] = useState<any>(null);
  const [includeActiveContext, setIncludeActiveContext] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init-0',
      role: 'model', 
      text: "Hi! I'm Crystal, your XRD-Calc Pro assistant. Ask me anything about crystallography or how to use this app! I can also search for the latest scientific data for you." 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSmart, setIsSmart] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // States for user dragging/pulling the chat panel height
  const [chatHeight, setChatHeight] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(500);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = chatHeight;
  };

  const handleResizeTouchStart = (e: React.TouchEvent) => {
    setIsResizing(true);
    startYRef.current = e.touches[0].clientY;
    startHeightRef.current = chatHeight;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = e.clientY - startYRef.current;
      // Dragging up (deltaY is negative) increases height, dragging down decreases it
      const newHeight = Math.max(300, Math.min(850, startHeightRef.current - deltaY));
      setChatHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizing) return;
      const deltaY = e.touches[0].clientY - startYRef.current;
      const newHeight = Math.max(300, Math.min(850, startHeightRef.current - deltaY));
      setChatHeight(newHeight);
    };

    const handleTouchEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isResizing]);

  useEffect(() => {
    // Initialize chat session on mount or when smart mode changes
    chatSession.current = createSupportChat(isSmart);
  }, [isSmart]);

  const refreshActiveResult = () => {
    try {
      const stored = localStorage.getItem("xrd_current_deep_learning_selected");
      if (stored) {
        setActiveResult(JSON.parse(stored));
      } else {
        setActiveResult(null);
      }
    } catch (err) {
      console.error("Failed to parse active deep learning result:", err);
    }
  };

  useEffect(() => {
    refreshActiveResult();
  }, [isOpen]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    const userMsg = customText || input;
    if (!userMsg.trim() || !chatSession.current) return;

    const userId = `user-${Date.now()}`;
    if (!customText) {
      setInput('');
    }
    setMessages(prev => [...prev, { id: userId, role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      let finalMsg = userMsg;
      if (includeActiveContext && activeResult) {
        const peaksStr = (activeResult.matched_peaks || [])
          .slice(0, 5)
          .map((p: any) => `2-theta: ${p.obsT}° (theoretical reference angle: ${p.refT}°, relative intensity: ${p.refI}%)`)
          .join('\n');

        finalMsg = `[SYSTEM CONTEXT INGESTED: The user is currently inspecting a specific crystalline material identified from their experimental XRD diffraction results:
- Material Name: ${activeResult.phase_name || 'N/A'}
- Chemical Formula: ${activeResult.formula || 'N/A'}
- Neural Match Confidence Score: ${(activeResult.confidence_score || 0).toFixed(1)}%
- Match Quality Label: ${activeResult.match_quality || 'N/A'}
- Crystallography properties:
  • Space Group: ${activeResult.spaceGroup || 'N/A'}
  • Crystal System Lattice: ${activeResult.crystalSystem || 'N/A'}
  • Theoretical Density: ${activeResult.density !== undefined ? `${activeResult.density} g/cm³` : 'N/A'}
${activeResult.fitted_strain_pct !== undefined ? `  • Fitted Lattice Contraction/Expansion Strain (dL/L): ${activeResult.fitted_strain_pct.toFixed(4)}%` : ''}
${activeResult.fitted_domain_size_broadening !== undefined ? `  • Fitted Peak Broadening Standard Deviation (sigma): ${activeResult.fitted_domain_size_broadening.toFixed(2)}°` : ''}
- Selected Peaks Matched:
${peaksStr || 'No matched peaks listed.'}
- Material Description: ${activeResult.description || 'N/A'}

Please use this specific material context, structural factors, fitted strain parameters, and peak profiles to offer highly accurate, tailored, and expert-level materials science support, identification tips, synthesis ideas, or theoretical advice to the user's following message. Do not mention that this context was injected unless they ask, but use it as grounding context.]

User message: ${userMsg}`;
      }

      const response: GenerateContentResponse = await chatSession.current.sendMessage({ message: finalMsg });
      
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const sources: GroundingSource[] = groundingMetadata?.groundingChunks 
        ? groundingMetadata.groundingChunks
          .map((chunk: GroundingChunk) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
          .filter((s: any): s is GroundingSource => s !== null)
        : [];

      const modelId = `model-${Date.now()}`;
      setMessages(prev => [...prev, { 
        id: modelId,
        role: 'model', 
        text: response.text || "I couldn't generate a response.",
        sources: sources.length > 0 ? sources : undefined
      }]);
    } catch (error: any) {
      if (!isQuotaError(error) && !isPermissionError(error)) {
        console.error("Chat Error:", error);
      }
      
      let errorMsg = "Sorry, I'm having trouble connecting to the network right now.";
      if (isQuotaError(error)) {
        errorMsg = "Sorry, my neural link quota has been exhausted (429/RESOURCE_EXHAUSTED). Please wait for a buffer reset.";
      } else if (isPermissionError(error)) {
        errorMsg = "Sorry, my neural access is restricted (403). Grounding tools unavailable. Check API key.";
      }
      setMessages(prev => [...prev, { id: `error-${Date.now()}-${Math.random().toString(36).substring(2,7)}`, role: 'model', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      {isOpen && (
        <div 
          style={{ height: `${chatHeight}px` }}
          className="bg-white w-[350px] sm:w-[380px] rounded-2xl shadow-2xl border border-slate-200 mb-4 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300 relative transition-[width] duration-300"
        >
          {/* Draggable Pull Handle "Pill" Bar */}
          <div 
            onMouseDown={handleResizeMouseDown}
            onTouchStart={handleResizeTouchStart}
            className="h-5 bg-slate-50 hover:bg-slate-100 border-b border-slate-150 flex items-center justify-center cursor-ns-resize shrink-0 select-none touch-none group/drag transition-colors"
            title="Drag up or down to adjust support panel height"
          >
            <div className="w-14 h-1 bg-slate-300 group-hover/drag:bg-indigo-400 rounded-full transition-colors" />
          </div>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">Crystal AI Support</h3>
                <p className="text-[10px] text-indigo-100 opacity-80">{isSmart ? 'Deep Reasoning Active' : 'Grounded Intelligence Active'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSmart(!isSmart)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${isSmart ? 'bg-amber-400 text-indigo-900 shadow-lg shadow-amber-400/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={isSmart ? "Smart Mode (High Reasoning) Enabled" : "Enable Smart Mode (High Reasoning)"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isSmart ? 'animate-pulse' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                {isSmart ? 'SMART' : 'FAST'}
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Active Diffraction context panel */}
          {activeResult ? (
            <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2.5 flex flex-col gap-1.5 shrink-0 select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex relative">
                    <Database className="w-3.5 h-3.5 text-indigo-500" />
                    <Sparkles className="w-2.5 h-2.5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider truncate">
                    Ingested: {activeResult.phase_name} ({activeResult.formula})
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={refreshActiveResult}
                    type="button"
                    className="p-1 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Refresh alignment data"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeActiveContext}
                      onChange={(e) => setIncludeActiveContext(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3"></div>
                  </label>
                </div>
              </div>
              
              {includeActiveContext ? (
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-500 font-mono bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                  <div className="truncate"><span className="text-slate-400">Match Conf:</span> <span className="font-bold text-indigo-600">{activeResult.confidence_score?.toFixed(1)}%</span></div>
                  <div className="truncate"><span className="text-slate-400">Space Group:</span> <span className="font-bold text-slate-700">{activeResult.spaceGroup || 'N/A'}</span></div>
                  {activeResult.fitted_strain_pct !== undefined && (
                    <div className="truncate col-span-2"><span className="text-slate-400">Strain (dL/L):</span> <span className="font-bold text-amber-600">{activeResult.fitted_strain_pct?.toFixed(4)}%</span></div>
                  )}
                </div>
              ) : (
                <div className="text-[9px] text-slate-400 italic">
                  Results excluded from chat prompt context.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border-b border-sidebar-border px-3.5 py-1.5 flex items-center justify-between shrink-0 text-[10px] text-slate-400 font-mono select-none">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" /> No active diffraction results.
              </span>
              <button 
                onClick={refreshActiveResult}
                className="hover:text-indigo-600 transition-colors px-1.5 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-50"
              >
                Scan Now
              </button>
            </div>
          )}

          {/* Guided Analytical Workflows Playbooks */}
          {activeResult && includeActiveContext && (
            <div className="bg-white border-b border-slate-150 px-3.5 py-2.5 flex flex-col gap-2 shrink-0 shadow-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Select Guided Phase ID Playbook:
              </div>
              <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                
                {activeResult.fitted_strain_pct !== undefined && (
                  <button
                    onClick={() => handleSend(undefined, `Analyze and interpret the fitted lattice strain of ${(activeResult.fitted_strain_pct).toFixed(4)}% in my ${(activeResult.phase_name)} (${(activeResult.formula)}) sample. What physical mechanisms (e.g., thermal mismatch, epitaxial stress, vacancy concentrations) typically cause this, and how should I perform an advanced Williamson-Hall or Nelson-Riley plot in this application to confirm?`)}
                    className="text-left w-full text-[10px] p-2 rounded-xl transition-all border border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-400/80 flex flex-col gap-0.5 cursor-pointer shadow-inner"
                  >
                    <span className="font-bold text-amber-800 flex items-center gap-1">📐 Dynamic Strain Distortion Analysis</span>
                    <span className="text-[9px] text-slate-500">Fit d-spacing deviation based on chemical strain profile: {activeResult.fitted_strain_pct.toFixed(4)}%</span>
                  </button>
                )}

                {activeResult.fitted_domain_size_broadening !== undefined && (
                  <button
                    onClick={() => handleSend(undefined, `Based on the fitted broadening parameter of ${(activeResult.fitted_domain_size_broadening).toFixed(2)}° for my ${(activeResult.phase_name)} sample, please walk me through a step-by-step Scherrer domain calculation. What shape factor (K) is most appropriate for a ${(activeResult.crystalSystem || 'cubic')} lattice, and how do I subtract the instrument broadening background to get the true nanometer scale?`)}
                    className="text-left w-full text-[10px] p-2 rounded-xl transition-all border border-indigo-250 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400/80 flex flex-col gap-0.5 cursor-pointer shadow-inner"
                  >
                    <span className="font-bold text-indigo-800 flex items-center gap-1">📏 Nanocrystalline Domain Size Fit</span>
                    <span className="text-[9px] text-slate-500">Calculate crystallite grain metrics using broadening width (&sigma; = {activeResult.fitted_domain_size_broadening.toFixed(2)}°)</span>
                  </button>
                )}

                <button
                  onClick={() => handleSend(undefined, `Let's outline a comprehensive, step-by-step Rietveld structure refinement workflow to validate my ${(activeResult.phase_name)} phase identification. What are the key standard parameters I should refine first (e.g., zero-shift, background coefficients, lattice dimensions) before scaling up to atomic positions, site occupancies, and isotropic/isotropic thermal parameters (B-factors)?`)}
                  className="text-left w-full text-[10px] p-2 rounded-xl transition-all border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 flex flex-col gap-0.5 cursor-pointer shadow-inner"
                >
                  <span className="font-bold text-slate-800 flex items-center gap-1">🔍 Rietveld Refinement Framework Plan</span>
                  <span className="text-[9px] text-slate-500">Establish structural convergence checkpoints, background profiling, & R-factor validation</span>
                </button>

                <button
                  onClick={() => handleSend(undefined, `Can you design a practical chemical synthesis recipe (such as hydrothermal, sol-gel, or solid-state sintering) matching the theoretical density of ${activeResult.density !== undefined ? `${activeResult.density} g/cm³` : 'N/A'} and ${(activeResult.crystalSystem || 'N/A')} structural lattice of ${(activeResult.phase_name)} (${(activeResult.formula)})? Focus on phase purity and minimizing secondary vacancy defects.`)}
                  className="text-left w-full text-[10px] p-2 rounded-xl transition-all border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400/80 flex flex-col gap-0.5 cursor-pointer shadow-inner"
                >
                  <span className="font-bold text-emerald-800 flex items-center gap-1">🧪 Tailored Synthetic Preparation Guide</span>
                  <span className="text-[9px] text-slate-500">Design hydrothermal & calcination profiles to synthesize pure crystalline {activeResult.formula}</span>
                </button>

              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Sources:</p>
                      <div className="flex flex-col gap-0.5">
                        {msg.sources.map((s, i) => (
                          <a key={`${s.uri}-${i}`} href={s.uri} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline truncate">
                            • {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start w-full">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="bg-white p-3 border-t border-slate-200 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about materials or XRD theory..."
              className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || loading}
              className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>

        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-xl transition-all hover:scale-105 active:scale-95 group relative"
      >
        {!isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        
        {/* Notification Dot (if closed and unread - simplistic simulation) */}
        {!isOpen && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500"></span>
          </span>
        )}
      </button>

    </div>
  );
};
