import React, { useState } from 'react';
import { Sparkles, Bot, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TextureAnalysisMetrics, PreferredOrientationReflection, TextureModelType, CrystalSystemType } from '../../utils/preferredOrientationPhysics';

interface TextureAIAdvisorProps {
  textureModel: TextureModelType;
  primaryAxis: string;
  secondaryAxis?: string;
  rValue: number;
  r2Value?: number;
  fraction: number;
  crystalSystem: CrystalSystemType;
  lattice: { a: number; b: number; c: number };
  metrics: TextureAnalysisMetrics;
  reflections: PreferredOrientationReflection[];
  rwp: number;
  chiSquared: number;
}

export const TextureAIAdvisor: React.FC<TextureAIAdvisorProps> = ({
  textureModel,
  primaryAxis,
  secondaryAxis,
  rValue,
  r2Value,
  fraction,
  crystalSystem,
  lattice,
  metrics,
  reflections,
  rwp,
  chiSquared
}) => {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/texture-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: textureModel,
          primaryAxis,
          secondaryAxis,
          rValue,
          r2Value,
          fraction,
          crystalSystem,
          lattice,
          metrics,
          fitQuality: { rwp, chiSquared },
          reflections
        })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setReport(data.text);
      } else {
        setError(data.error || 'Failed to generate AI Texture diagnostic report.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to AI texture diagnostic endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm dark:shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20 shadow-inner">
            <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              Gemini AI Crystallographic Texture Advisor
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Peer-reviewed academic analysis of growth mechanisms, slip systems, and Rietveld refinement strategies
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isLoading ? 'Analyzing Texture Physics...' : 'Generate Academic Diagnostic'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Report Markdown Container */}
      {report ? (
        <div className="p-5 bg-white dark:bg-black/60 rounded-2xl border border-slate-200 dark:border-white/5 prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed max-h-96 overflow-y-auto">
          <div className="markdown-body">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white dark:bg-black/60 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
          <Bot className="w-8 h-8 text-purple-400 mb-2 opacity-40" />
          Click &quot;Generate Academic Diagnostic&quot; to obtain an automated physical evaluation of growth kinetics, slip systems, and Rietveld texture strategies.
        </div>
      )}
    </div>
  );
};
