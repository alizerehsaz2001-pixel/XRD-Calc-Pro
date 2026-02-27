
import React, { useState } from 'react';
import { getMaterialPeaks } from '../services/geminiService';
import { AIResponse } from '../types';
import { Brain, Search, Database, Layers, CheckCircle, Zap, FlaskConical, Loader2, Info, Activity } from 'lucide-react';

interface GeminiAssistantProps {
  onLoadPeaks: (peaks: number[], wavelength?: number, hkls?: string[], material?: string) => void;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ onLoadPeaks }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AIResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const data = await getMaterialPeaks(query);
      setSuggestion(data);
    } catch (err) {
      setError("Failed to fetch data from Gemini. Please check API Key or try again.");
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      onLoadPeaks(suggestion.peaks, suggestion.wavelength, suggestion.hkls, suggestion.material);
      setSuggestion(null);
      setQuery('');
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl shadow-lg p-6 overflow-hidden relative border border-slate-700">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-violet-700 rounded-full opacity-20 blur-xl"></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-400" />
          Material Intelligence
        </h3>
        <p className="text-slate-400 text-xs mb-4">
          Search for properties and peaks of any crystal structure using AI.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Material (e.g., Lead Perovskite)..."
              className="w-full px-3 py-2 pl-9 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium transition-all"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition-colors text-sm disabled:opacity-50 disabled:bg-slate-700 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 mb-4 animate-in fade-in zoom-in-95 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {error}
          </div>
        )}

        {suggestion && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            
            {/* Header / Profile */}
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
               <div className="flex items-center gap-2 mb-3">
                 <FlaskConical className="w-4 h-4 text-emerald-400" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Material Profile</span>
               </div>
               <div className="flex justify-between items-start mb-2">
                 <div>
                   <span className="font-extrabold text-white text-xl block leading-tight">{suggestion.material}</span>
                   <div className="flex flex-wrap gap-2 mt-2">
                     {suggestion.spaceGroup && (
                       <span className="text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 px-2 py-1 rounded-md border border-violet-500/30 uppercase tracking-wider">
                         SG: {suggestion.spaceGroup}
                       </span>
                     )}
                     {suggestion.density && (
                       <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded-md border border-slate-600">
                         ρ = {suggestion.density.toFixed(2)} g/cm³
                       </span>
                     )}
                   </div>
                 </div>
               </div>
               {suggestion.description && (
                 <p className="text-xs text-slate-300 leading-relaxed mt-3">
                   {suggestion.description}
                 </p>
               )}
            </div>

            {/* Lattice Params */}
            {suggestion.latticeParams && (
              <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lattice Parameters</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider mb-1">a (Å)</span>
                    <span className="text-sm font-mono font-bold text-white">{suggestion.latticeParams.a.toFixed(3)}</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider mb-1">b (Å)</span>
                    <span className="text-sm font-mono font-bold text-white">{(suggestion.latticeParams.b || suggestion.latticeParams.a).toFixed(3)}</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider mb-1">c (Å)</span>
                    <span className="text-sm font-mono font-bold text-white">{(suggestion.latticeParams.c || suggestion.latticeParams.a).toFixed(3)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Peaks */}
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Peaks & Indices</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestion.peaks.slice(0, 8).map((p, i) => (
                  <div key={i} className="flex flex-col items-center bg-slate-900/50 border border-slate-700 p-2.5 rounded-lg min-w-[60px] group hover:border-violet-500 hover:bg-slate-800 transition-colors cursor-default">
                    <span className="text-xs font-bold font-mono text-white">{p.toFixed(2)}°</span>
                    {suggestion.hkls && suggestion.hkls[i] && (
                      <span className="text-[10px] font-bold text-violet-400 group-hover:text-violet-300 mt-0.5">({suggestion.hkls[i]})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sources */}
            {suggestion.sources && suggestion.sources.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> Verified Sources
                </p>
                <div className="flex flex-col gap-2">
                  {suggestion.sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-violet-300 transition-colors truncate flex items-center gap-2 bg-slate-800/20 p-2 rounded-lg border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-violet-400"></span>
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={applySuggestion}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
            >
              <Zap className="w-4 h-4" />
              Load into Calculator
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
