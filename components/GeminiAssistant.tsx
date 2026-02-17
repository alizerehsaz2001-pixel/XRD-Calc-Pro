
import React, { useState } from 'react';
import { getMaterialPeaks } from '../services/geminiService';
import { AIResponse } from '../types';

interface GeminiAssistantProps {
  onLoadPeaks: (peaks: number[], wavelength?: number) => void;
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
      onLoadPeaks(suggestion.peaks, suggestion.wavelength);
      setSuggestion(null);
      setQuery('');
    }
  };

  return (
    <div className="bg-indigo-900 text-white rounded-xl shadow-lg p-6 overflow-hidden relative border border-white/10 ring-1 ring-white/5">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-700 rounded-full opacity-50 blur-xl"></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Material Intelligence
        </h3>
        <p className="text-indigo-200 text-xs mb-4">
          Search for properties and peaks of any crystal structure.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Material (e.g., Lead Perovskite)..."
            className="flex-1 px-3 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-white text-indigo-900 font-bold rounded-lg hover:bg-indigo-50 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-indigo-900/20 border-t-indigo-900 rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-xs text-red-200 mb-4 animate-in fade-in zoom-in-95">
            {error}
          </div>
        )}

        {suggestion && (
          <div className="bg-indigo-800/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-extrabold text-white text-lg block leading-tight">{suggestion.material}</span>
                {suggestion.spaceGroup && (
                  <span className="text-[10px] font-mono font-bold bg-indigo-700 text-indigo-100 px-1.5 py-0.5 rounded mt-1 inline-block uppercase tracking-wider">
                    SG: {suggestion.spaceGroup}
                  </span>
                )}
              </div>
              <div className="text-right">
                {suggestion.density && (
                  <span className="text-[10px] text-indigo-300 block font-bold">ρ = {suggestion.density.toFixed(2)} g/cm³</span>
                )}
              </div>
            </div>

            {suggestion.description && (
              <p className="text-[11px] text-indigo-200 leading-relaxed mb-4 italic">
                {suggestion.description}
              </p>
            )}

            {suggestion.latticeParams && (
              <div className="grid grid-cols-3 gap-2 mb-4 bg-black/20 p-2 rounded-lg border border-white/5">
                <div className="text-center">
                  <span className="text-[9px] text-indigo-400 block font-bold">a (Å)</span>
                  <span className="text-xs font-mono font-bold">{suggestion.latticeParams.a.toFixed(3)}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-indigo-400 block font-bold">b (Å)</span>
                  <span className="text-xs font-mono font-bold">{(suggestion.latticeParams.b || suggestion.latticeParams.a).toFixed(3)}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-indigo-400 block font-bold">c (Å)</span>
                  <span className="text-xs font-mono font-bold">{(suggestion.latticeParams.c || suggestion.latticeParams.a).toFixed(3)}</span>
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-[10px] font-bold text-indigo-300 mb-2 uppercase tracking-widest">Major Cu Kα Peaks</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.peaks.slice(0, 8).map((p, i) => (
                  <span key={i} className="text-[11px] bg-white/10 border border-white/10 px-2 py-1 rounded-md font-bold font-mono text-indigo-50">
                    {p.toFixed(2)}°
                  </span>
                ))}
              </div>
            </div>

            {suggestion.sources && suggestion.sources.length > 0 && (
              <div className="mb-4 pt-3 border-t border-white/10">
                <p className="text-[9px] font-bold text-indigo-400 mb-1 uppercase tracking-widest">Verified Sources</p>
                <div className="flex flex-col gap-1">
                  {suggestion.sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-300 hover:text-white transition-colors truncate underline">
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={applySuggestion}
              className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Load Peaks into Engine
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
