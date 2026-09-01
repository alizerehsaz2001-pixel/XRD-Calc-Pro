import React, { useState } from 'react';
import { XRRLayer, XRRSimulationConfig, FitQualityResult, KiessigAnalysisResult, CriticalAngleResult } from '../utils/xrrPhysics';
import { Bot, Sparkles, RefreshCw, Send, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';

interface XRRAIAdvisorTabProps {
  layers: XRRLayer[];
  config: XRRSimulationConfig;
  fitQuality: FitQualityResult;
  kiessigResult: KiessigAnalysisResult | null;
  critAngleResult: CriticalAngleResult | null;
}

export const XRRAIAdvisorTab: React.FC<XRRAIAdvisorTabProps> = ({
  layers,
  config,
  fitQuality,
  kiessigResult,
  critAngleResult
}) => {
  const [reportText, setReportText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('');

  const handleRequestAnalysis = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/gemini/xrr-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layers,
          config,
          fitQuality,
          kiessigResult,
          critAngleResult
        })
      });

      const data = await response.json();
      if (data.success) {
        setReportText(data.text);
        setModelUsed(data.modelUsed || 'Gemini 2.5');
      } else {
        setErrorMsg(data.error || 'Failed to generate AI XRR analysis.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error communicating with XRR Advisor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="xrr-ai-advisor-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            Senior Thin Film & XRR Physics Advisor (Gemini AI)
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Generates deep crystallographic and physical evaluation of your multilayer stack, including interface roughness damping, porosity deficits, oxidation layers, and optimal refinement strategies.
          </p>
        </div>

        <button
          id="run-xrr-ai-btn"
          onClick={handleRequestAnalysis}
          disabled={loading}
          className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-md shadow-cyan-950 transition-all cursor-pointer"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analyzing Physics Model...' : 'Run AI XRR Diagnostic'}
        </button>
      </div>

      {/* Error display */}
      {errorMsg && (
        <div className="bg-red-950/50 border border-red-800/80 rounded-xl p-4 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Report Markdown Container */}
      {reportText && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">XRR Diagnostic Report</span>
            </div>
            {modelUsed && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                {modelUsed}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-300 leading-relaxed prose prose-invert max-w-none">
            <Markdown>{reportText}</Markdown>
          </div>
        </div>
      )}

      {/* Default placeholder */}
      {!reportText && !loading && (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-10 text-center">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h5 className="text-sm font-medium text-slate-300">Ready for Thin Film Evaluation</h5>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Click &ldquo;Run AI XRR Diagnostic&rdquo; to send the current multilayer architecture, Kiessig fringe analysis, and SLD profile to the Gemini Crystallography engine.
          </p>
        </div>
      )}
    </div>
  );
};
