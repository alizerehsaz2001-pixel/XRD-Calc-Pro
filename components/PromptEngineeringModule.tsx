import React, { useState } from 'react';
import { Sparkles, ArrowRight, Wand2, Copy, CheckCircle2, Loader2, BookOpen, MessageSquare, Lightbulb } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const PromptEngineeringModule: React.FC = () => {
  const [inputPrompt, setInputPrompt] = useState('Generate a simulated XRD pattern for Silicon (Si) using Cu K-alpha radiation, including peak positions and intensities, formatted as a markdown table.');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEnhance = async () => {
    if (!inputPrompt.trim()) return;
    
    setIsEnhancing(true);
    setEnhancedPrompt('');
    setCopied(false);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const systemInstruction = `You are an expert prompt engineer for crystallography and materials science.
Your goal is to take a user's simple or vague request and rewrite it into a highly detailed, professional, and scientifically precise prompt tailored for the 'Crystal Intelligence Hub' (an advanced LLM capable of deep reasoning and database grounding).
The enhanced prompt should:
1. Provide clear context and establish a scientific persona.
2. Structure the request with explicit constraints (e.g., specifying XRD parameters like Cu K-alpha if relevant, or requesting specific space group notations).
3. Ask for step-by-step reasoning or derivations if applicable.
4. Request specific formatting (e.g., markdown tables, bullet points).
Do not answer the user's question. ONLY output the newly enhanced prompt text. Do not wrap it in quotes unless necessary. Make it ready to be copy-pasted directly into the AI Hub.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Make this into an advanced crystallography prompt:\n"${inputPrompt}"`,
        config: {
          systemInstruction,
        }
      });
      
      if (response.text) {
        setEnhancedPrompt(response.text.trim());
      }
    } catch (error: any) {
      console.error("Error enhancing prompt:", error);
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      const isQuota = errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED');
      const isPermission = errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED') || errorStr.includes('permission');

      if (isQuota) {
        setEnhancedPrompt("Quota exhausted (429/RESOURCE_EXHAUSTED). Please wait and try again.");
      } else if (isPermission) {
        setEnhancedPrompt("Permission denied (403/PERMISSION_DENIED). AI prompt enhancement restricted.");
      } else {
        setEnhancedPrompt("Error connecting to the prompt engineering engine. Please try again.");
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopy = () => {
    if (enhancedPrompt) {
      navigator.clipboard.writeText(enhancedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const suggestions = [
    "Simulate Silicon (Si) XRD pattern with Cu K-alpha",
    "Compare X-ray vs Neutron scattering for light elements",
    "Identify space group and atoms for Anatase TiO2",
    "Guide for Williamson-Hall plot strain analysis",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      
      {/* Input Section */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-fuchsia-600 rounded-full opacity-10 blur-3xl"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-fuchsia-500/20 rounded-xl border border-fuchsia-500/30">
              <MessageSquare className="w-6 h-6 text-fuchsia-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Draft Request</h2>
              <p className="text-xs text-slate-400">Write your question in plain English</p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="bg-slate-950/50 p-1 rounded-2xl border border-slate-700/50 focus-within:border-fuchsia-500/50 focus-within:ring-1 focus-within:ring-fuchsia-500/20 transition-all shadow-inner">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="e.g. Help me interpret my XRD data for a thin film..."
                className="w-full h-40 bg-transparent text-white placeholder-slate-500 p-4 resize-none outline-none text-sm leading-relaxed"
                spellCheck={false}
              />
            </div>
            
            <button
              onClick={handleEnhance}
              disabled={!inputPrompt.trim() || isEnhancing}
              className="w-full py-3.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg hover:shadow-fuchsia-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Optimizing Prompt...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Scientific Prompt
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Quick Starters
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={`prompt-sugg-${s.substring(0, 5)}-${i}`}
                onClick={() => setInputPrompt(s)}
                className="text-[11px] font-medium bg-slate-800 text-slate-300 hover:bg-fuchsia-900/40 hover:text-fuchsia-300 hover:border-fuchsia-500/30 px-3 py-2 rounded-lg border border-slate-700 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output Section */}
      <div className="lg:col-span-7">
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 h-full flex flex-col relative overflow-hidden min-h-[500px]">
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-indigo-600 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Enhanced Prompt</h3>
            </div>
            
            {enhancedPrompt && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <div className="flex-1 relative z-10 bg-slate-950/80 rounded-2xl border border-slate-800 p-1 flex">
             {enhancedPrompt ? (
               <div className="flex-1 p-5 overflow-auto custom-scrollbar text-sm text-indigo-100/90 leading-loose prose prose-invert prose-p:my-2 prose-headings:text-indigo-300 font-medium">
                 {enhancedPrompt}
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                 <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
                   <ArrowRight className="w-8 h-8 opacity-50" />
                 </div>
                 <p className="font-semibold text-slate-400 mb-2">Awaiting Input</p>
                 <p className="text-xs max-w-sm leading-relaxed">
                   Enter a basic question and we will engineer a highly specific prompt designed for structural analysis AI agents.
                 </p>
               </div>
             )}
          </div>
          
          {enhancedPrompt && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-start gap-3 relative z-10">
               <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shrink-0">
                 <BookOpen className="w-4 h-4 text-emerald-400" />
               </div>
               <p className="text-xs text-slate-400 leading-relaxed font-medium">
                 <strong className="text-slate-300">Pro Tip:</strong> Copy this optimized text and paste it directly into the <strong>Crystal Intelligence Hub</strong> for the most scientifically accurate and comprehensive response.
               </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
