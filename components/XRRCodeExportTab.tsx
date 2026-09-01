import React, { useState } from 'react';
import { XRRLayer, XRRSimulationConfig, FitQualityResult, KiessigAnalysisResult, CriticalAngleResult, generatePythonXRRScript, generateGenXScript, generateBornAgainScript, generateLatexTable } from '../utils/xrrPhysics';
import { Code2, Copy, Check, FileText, Download } from 'lucide-react';

interface XRRCodeExportTabProps {
  layers: XRRLayer[];
  config: XRRSimulationConfig;
  fitQuality?: FitQualityResult;
  kiessigResult?: KiessigAnalysisResult | null;
  critAngleResult?: CriticalAngleResult | null;
}

export const XRRCodeExportTab: React.FC<XRRCodeExportTabProps> = ({
  layers,
  config,
  fitQuality,
  kiessigResult,
  critAngleResult
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'refnx' | 'genx' | 'bornagain' | 'latex'>('refnx');
  const [copied, setCopied] = useState(false);

  let outputCode = '';
  if (selectedFormat === 'refnx') {
    outputCode = generatePythonXRRScript(layers, config);
  } else if (selectedFormat === 'genx') {
    outputCode = generateGenXScript(layers, config);
  } else if (selectedFormat === 'bornagain') {
    outputCode = generateBornAgainScript(layers, config);
  } else if (selectedFormat === 'latex') {
    outputCode = generateLatexTable(layers, fitQuality, kiessigResult, critAngleResult);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = selectedFormat === 'latex' ? 'tex' : 'py';
    const blob = new Blob([outputCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xrr_model_${selectedFormat}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="xrr-export-container" className="space-y-6">
      {/* Selector & Actions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFormat('refnx')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFormat === 'refnx' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Refnx (Python)
          </button>
          <button
            onClick={() => setSelectedFormat('genx')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFormat === 'genx' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            GenX (Diff. Evol.)
          </button>
          <button
            onClick={() => setSelectedFormat('bornagain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFormat === 'bornagain' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            BornAgain (GISAXS)
          </button>
          <button
            onClick={() => setSelectedFormat('latex')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedFormat === 'latex' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            LaTeX Table
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs text-slate-950 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <pre className="text-xs text-slate-300 font-mono leading-relaxed">
          <code>{outputCode}</code>
        </pre>
      </div>
    </div>
  );
};
