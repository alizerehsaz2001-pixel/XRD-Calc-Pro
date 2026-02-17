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
    <div className="bg-indigo-900 text-white rounded-xl shadow-lg p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-700 rounded-full opacity-50 blur-xl"></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          AI Material Lookup
        </h3>
        <p className="text-indigo-200 text-sm mb-4">
          Ask for characteristic peaks of any crystal (e.g., "Silicon", "Gold", "Quartz").
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Material name..."
            className="flex-1 px-3 py-2 bg-indigo-800 border border-indigo-700 rounded-lg text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-white text-indigo-900 font-semibold rounded-lg hover:bg-indigo-50 transition-colors text-sm disabled:opacity-50"
          >
            {loading ? '...' : 'Ask'}
          </button>
        </form>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-xs text-red-200 mb-4">
            {error}
          </div>
        )}

        {suggestion && (
          <div className="bg-indigo-800/50 rounded-lg p-3 border border-indigo-700 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold text-indigo-100 block">{suggestion.material}</span>
                {suggestion.description && (
                   <span className="text-[10px] text-indigo-300 block leading-tight mt-1">{suggestion.description}</span>
                )}
              </div>
              {suggestion.wavelength && (
                <span className="text-[10px] bg-indigo-900 px-1.5 py-0.5 rounded text-indigo-300 whitespace-nowrap">
                  λ = {suggestion.wavelength}Å
                </span>
              )}
            </div>
            <div className="mb-3">
              <p className="text-xs text-indigo-300 mb-1">Peaks found:</p>
              <div className="flex flex-wrap gap-1">
                {suggestion.peaks.slice(0, 5).map((p, i) => (
                  <span key={i} className="text-xs bg-indigo-600 px-1.5 py-0.5 rounded">
                    {p}°
                  </span>
                ))}
                {suggestion.peaks.length > 5 && <span className="text-xs text-indigo-400">...</span>}
              </div>
            </div>
            <button
              onClick={applySuggestion}
              className="w-full py-1.5 bg-indigo-500 hover:bg-indigo-400 rounded text-xs font-semibold transition-colors"
            >
              Load Data into Engine
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
