import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface AIAnalysisProps {
  methodName: string;
  resultData: any;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ methodName, resultData }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAnalyze = async () => {
    if (!resultData) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setIsExpanded(true);

    try {
      const response = await fetch('/api/gemini/analyze-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: methodName,
          payload: resultData
        })
      });

      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.text);
      } else {
        setAnalysisResult(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setAnalysisResult(`Failed to analyze: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 rounded-3xl border border-indigo-500/20 overflow-hidden shadow-2xl backdrop-blur-xl relative group">
      <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Gemini AI Analysis</h3>
              <p className="text-slate-400 text-xs mt-0.5">High-level scientific interpretation using Gemini 3.1 Pro</p>
            </div>
          </div>
          
          {!analysisResult && !isAnalyzing ? (
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Analyze Results
            </button>
          ) : (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (isAnalyzing || analysisResult) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-6"
            >
              <div className="pt-4 border-t border-white/10">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-indigo-300">Gemini is thinking...</p>
                      <p className="text-xs text-slate-400 mt-1">Applying advanced reasoning models to interpret your data.</p>
                    </div>
                  </div>
                ) : analysisResult ? (
                  <div className="prose prose-invert prose-indigo max-w-none prose-sm">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {analysisResult}
                    </ReactMarkdown>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
