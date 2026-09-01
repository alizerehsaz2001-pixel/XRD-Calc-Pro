import React, { useState } from 'react';
import { Code2, Copy, Check, Download, FileText } from 'lucide-react';
import { 
  generateTopasScript, 
  generateGsas2Script, 
  generateFullProfScript, 
  generateMaudScript, 
  generatePythonScript, 
  generateLatexTable,
  PreferredOrientationReflection,
  TextureAnalysisMetrics
} from '../../utils/preferredOrientationPhysics';

interface TextureCodeExporterProps {
  primaryAxis: string;
  rValue: number;
  fraction: number;
  reflections: PreferredOrientationReflection[];
  metrics: TextureAnalysisMetrics;
}

export const TextureCodeExporter: React.FC<TextureCodeExporterProps> = ({
  primaryAxis,
  rValue,
  fraction,
  reflections,
  metrics
}) => {
  const [activePlatform, setActivePlatform] = useState<'TOPAS' | 'GSAS-II' | 'FullProf' | 'MAUD' | 'Python' | 'LaTeX' | 'CSV'>('TOPAS');
  const [copied, setCopied] = useState<boolean>(false);

  const getCodeContent = () => {
    switch (activePlatform) {
      case 'TOPAS':
        return generateTopasScript(primaryAxis, rValue, fraction);
      case 'GSAS-II':
        return generateGsas2Script(primaryAxis, rValue, fraction);
      case 'FullProf':
        return generateFullProfScript(primaryAxis, rValue, fraction);
      case 'MAUD':
        return generateMaudScript(primaryAxis, rValue, fraction);
      case 'Python':
        return generatePythonScript(reflections, rValue, fraction, primaryAxis);
      case 'LaTeX':
        return generateLatexTable(reflections, metrics);
      case 'CSV':
        const header = 'h,k,l,alpha_deg,P_alpha,I_std,I_meas,I_calc,residual,harris_TC\n';
        const rows = reflections.map(r => 
          `${r.h},${r.k},${r.l},${r.angleAlpha.toFixed(2)},${r.correctionFactor.toFixed(4)},${r.iStandard},${r.iMeasured},${r.iScaled.toFixed(2)},${r.residual.toFixed(2)},${r.harrisTC.toFixed(3)}`
        ).join('\n');
        return header + rows;
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activePlatform === 'LaTeX' ? 'tex' : activePlatform === 'Python' ? 'py' : activePlatform === 'CSV' ? 'csv' : 'txt';
    const blob = new Blob([getCodeContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `texture_analysis_${activePlatform.toLowerCase()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm dark:shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 shadow-inner">
            <Code2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              Publication & Refinement Script Exporter
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Instant command blocks for Rietveld refinement engines, Python scripts, and LaTeX publication tables
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Script'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(['TOPAS', 'GSAS-II', 'FullProf', 'MAUD', 'Python', 'LaTeX', 'CSV'] as const).map(platform => (
          <button
            key={platform}
            onClick={() => setActivePlatform(platform)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activePlatform === platform
                ? 'bg-blue-500 text-white shadow-sm font-black'
                : 'bg-white dark:bg-black/60 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            {platform}
          </button>
        ))}
      </div>

      {/* Code Editor Box */}
      <div className="relative bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800 max-h-60 shadow-inner">
        <pre>{getCodeContent()}</pre>
      </div>
    </div>
  );
};
