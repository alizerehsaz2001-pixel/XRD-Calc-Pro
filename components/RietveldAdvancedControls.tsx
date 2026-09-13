import React, { useState } from 'react';
import { 
  Lock, Unlock, Play, RefreshCw, Zap, Download, FileText, CheckCircle2, 
  AlertTriangle, Copy, Layers, Database, Sparkles, Upload, HelpCircle, ChevronRight, X
} from 'lucide-react';
import { 
  PhaseModel, RefinementFlags, SolverStepResult, QpaResult, 
  calculateHillHowardQpa, NIST_STANDARDS, NistStandard,
  exportToFullProfPcr, exportToTopasInp, exportToGsasIiPython 
} from '../utils/rietveldSolver';

interface RietveldAdvancedControlsProps {
  phases: PhaseModel[];
  backgroundLevel: number;
  zeroShift: number;
  wavelength?: number;
  refinementFlags: RefinementFlags;
  onUpdateFlags: (flags: RefinementFlags) => void;
  onRunLmStep: () => void;
  onRunMultiCycle: (cycles: number) => void;
  onRunProtocol: () => void;
  isRefining: boolean;
  refineProgress?: { current: number; total: number; message: string };
  lastSolverResult?: SolverStepResult | null;
  onLoadNistStandard: (std: NistStandard) => void;
  onLoadCustomExperimentalData: (name: string, points: Array<{ twoTheta: number; obs: number }>) => void;
  qpaResults: QpaResult[];
}

export const RietveldAdvancedControls: React.FC<RietveldAdvancedControlsProps> = ({
  phases,
  backgroundLevel,
  zeroShift,
  wavelength = 1.5406,
  refinementFlags,
  onUpdateFlags,
  onRunLmStep,
  onRunMultiCycle,
  onRunProtocol,
  isRefining,
  refineProgress,
  lastSolverResult,
  onLoadNistStandard,
  onLoadCustomExperimentalData,
  qpaResults
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNistModal, setShowNistModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'fullprof' | 'topas' | 'gsas' | 'csv'>('fullprof');
  const [copied, setCopied] = useState(false);

  // File upload state
  const [uploadError, setUploadError] = useState<string | null>(null);

  const toggleFlag = (flag: keyof RefinementFlags) => {
    onUpdateFlags({
      ...refinementFlags,
      [flag]: !refinementFlags[flag]
    });
  };

  const getExportText = () => {
    switch (exportFormat) {
      case 'fullprof':
        return exportToFullProfPcr(phases, backgroundLevel, zeroShift, wavelength);
      case 'topas':
        return exportToTopasInp(phases, backgroundLevel, zeroShift, wavelength);
      case 'gsas':
        return exportToGsasIiPython(phases, backgroundLevel, zeroShift, wavelength);
      case 'csv': {
        let csv = "two_theta,obs,calc,bkg,diff\n";
        // Header only if points not provided in generator
        return csv;
      }
    }
  };

  const handleCopy = () => {
    const text = getExportText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = getExportText();
    const ext = exportFormat === 'fullprof' ? 'pcr' : exportFormat === 'topas' ? 'inp' : exportFormat === 'gsas' ? 'py' : 'csv';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rietveld_refinement_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/);
        const points: Array<{ twoTheta: number; obs: number }> = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!') || trimmed.startsWith('//')) continue;
          const parts = trimmed.split(/[\s,;]+/);
          if (parts.length >= 2) {
            const twoT = parseFloat(parts[0]);
            const intensity = parseFloat(parts[1]);
            if (!isNaN(twoT) && !isNaN(intensity) && twoT >= 10 && twoT <= 90) {
              points.push({ twoTheta: twoT, obs: intensity });
            }
          }
        }

        if (points.length < 50) {
          setUploadError("File must contain at least 50 valid (2θ, intensity) rows in range 10° to 90°.");
          return;
        }

        onLoadCustomExperimentalData(file.name.replace(/\.[^/.]+$/, ""), points);
        setShowNistModal(false);
      } catch (err: any) {
        setUploadError(`Failed to parse file: ${err.message || 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="bg-[#050B14] p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Analytical Non-Linear Least Squares (Levenberg-Marquardt)
            </h4>
            <p className="text-[9px] text-slate-400 font-mono">
              In-browser matrix inversion • Damped Gauss-Newton • Real-time residuals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1-Cycle Step */}
          <button
            onClick={onRunLmStep}
            disabled={isRefining}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 hover:border-teal-500/60 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            title="Perform 1 cycle of Levenberg-Marquardt profile least-squares"
          >
            <Play className="w-3.5 h-3.5 text-teal-400" />
            1-Cycle Step
          </button>

          {/* 5-Cycles */}
          <button
            onClick={() => onRunMultiCycle(5)}
            disabled={isRefining}
            className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 hover:border-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.15)] transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            title="Perform 5 iterations of Levenberg-Marquardt profile refinement"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isRefining ? 'animate-spin' : ''}`} />
            5 Cycles
          </button>

          {/* Complete 5-Stage Protocol */}
          <button
            onClick={onRunProtocol}
            disabled={isRefining}
            className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            title="Execute standard 5-stage sequential crystallographic protocol"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            5-Stage Protocol
          </button>

          {/* NIST Benchmarks & Import */}
          <button
            onClick={() => setShowNistModal(true)}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 transition-all flex items-center gap-1.5 active:scale-95"
            title="Load NIST SRM Standards or import custom experimental powder pattern"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            NIST Standards & Upload
          </button>

          {/* Export Deck */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 transition-all flex items-center gap-1.5 active:scale-95"
            title="Export FullProf (.pcr), GSAS-II, or TOPAS control deck"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export Decks
          </button>
        </div>
      </div>

      {/* Protocol Progress Notification if Active */}
      {refineProgress && isRefining && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-300">
                Step {refineProgress.current} of {refineProgress.total}:
              </span>
              <p className="text-xs text-emerald-200 font-bold">{refineProgress.message}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-black text-emerald-400">
              {Math.round((refineProgress.current / refineProgress.total) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Parameter Lock Matrix & Convergence Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Lock Controls (7 cols) */}
        <div className="md:col-span-7 bg-[#050B14] p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                Refinement Matrix & Parameter Locks
              </span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">
              Toggle 🔒 Lock / 🔓 Free
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Scale Factor */}
            <button
              onClick={() => toggleFlag('refineScale')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                refinementFlags.refineScale
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div>
                <span className="text-[9px] font-mono font-bold block">Scale Factor (S)</span>
                <span className="text-[8px] uppercase tracking-wider opacity-75">Intensity match</span>
              </div>
              {refinementFlags.refineScale ? (
                <Unlock className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            {/* Lattice Parameter */}
            <button
              onClick={() => toggleFlag('refineLattice')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                refinementFlags.refineLattice
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div>
                <span className="text-[9px] font-mono font-bold block">Lattice (a)</span>
                <span className="text-[8px] uppercase tracking-wider opacity-75">Peak 2θ centers</span>
              </div>
              {refinementFlags.refineLattice ? (
                <Unlock className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            {/* Peak Width (FWHM) */}
            <button
              onClick={() => toggleFlag('refineFwhm')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                refinementFlags.refineFwhm
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div>
                <span className="text-[9px] font-mono font-bold block">Peak Width (FWHM)</span>
                <span className="text-[8px] uppercase tracking-wider opacity-75">Profile width</span>
              </div>
              {refinementFlags.refineFwhm ? (
                <Unlock className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            {/* Pseudo-Voigt Eta */}
            <button
              onClick={() => toggleFlag('refineEta')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                refinementFlags.refineEta
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div>
                <span className="text-[9px] font-mono font-bold block">Lorentzian (η)</span>
                <span className="text-[8px] uppercase tracking-wider opacity-75">Peak tails</span>
              </div>
              {refinementFlags.refineEta ? (
                <Unlock className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            {/* Zero Shift */}
            <button
              onClick={() => toggleFlag('refineZeroShift')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                refinementFlags.refineZeroShift
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div>
                <span className="text-[9px] font-mono font-bold block">Zero Shift (2θ₀)</span>
                <span className="text-[8px] uppercase tracking-wider opacity-75">Goniometer error</span>
              </div>
              {refinementFlags.refineZeroShift ? (
                <Unlock className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>

            {/* Background */}
            <button
              onClick={() => toggleFlag('refineBkg')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                refinementFlags.refineBkg
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div>
                <span className="text-[9px] font-mono font-bold block">Background (Bkg)</span>
                <span className="text-[8px] uppercase tracking-wider opacity-75">Diffuse baseline</span>
              </div>
              {refinementFlags.refineBkg ? (
                <Unlock className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Quantitative Phase Analysis (QPA) & Residual Metrics (5 cols) */}
        <div className="md:col-span-5 bg-[#050B14] p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                Quantitative Phase Analysis (QPA)
              </span>
            </div>
            <span className="text-[8px] text-amber-400/80 font-mono font-bold">Hill & Howard Method</span>
          </div>

          {qpaResults.length > 0 ? (
            <div className="space-y-2">
              {/* Stacked relative percentage bar */}
              <div className="h-3 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800 shadow-inner">
                {qpaResults.map((q, idx) => {
                  const colors = ['bg-teal-500', 'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500'];
                  return (
                    <div
                      key={q.phaseId}
                      style={{ width: `${Math.max(1, q.weightFraction)}%` }}
                      className={`h-full ${colors[idx % colors.length]} transition-all`}
                      title={`${q.phaseName}: ${q.weightFraction.toFixed(1)} wt%`}
                    />
                  );
                })}
              </div>

              <div className="space-y-1.5">
                {qpaResults.map((q, idx) => {
                  const colors = ['text-teal-400', 'text-indigo-400', 'text-rose-400', 'text-amber-400', 'text-cyan-400'];
                  return (
                    <div key={q.phaseId} className="flex items-center justify-between text-xs bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60">
                      <span className="text-slate-300 font-bold truncate max-w-[140px]">{q.phaseName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-500">V = {q.volume.toFixed(1)} Å³</span>
                        <span className={`font-mono font-black ${colors[idx % colors.length]}`}>
                          {q.weightFraction.toFixed(1)} wt%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500 text-xs font-mono">
              Enable multiple phases to compute mass fractions
            </div>
          )}

          {/* Durbin-Watson & ChiSq */}
          {lastSolverResult && (
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-[9px] font-mono">
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Durbin-Watson (d)</span>
                <span className="font-bold text-slate-300">{lastSolverResult.durbinWatson.toFixed(3)}</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">Damping (λ)</span>
                <span className="font-bold text-slate-300">{lastSolverResult.lambda.toExponential(1)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NIST Standards Modal */}
      {showNistModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">NIST Standard Reference Materials (SRMs) & Import</h3>
                  <p className="text-xs text-slate-400">Certified crystallographic calibration benchmarks</p>
                </div>
              </div>
              <button
                onClick={() => setShowNistModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Standard Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NIST_STANDARDS.map(std => (
                <div
                  key={std.id}
                  onClick={() => {
                    onLoadNistStandard(std);
                    setShowNistModal(false);
                  }}
                  className="p-4 rounded-2xl bg-slate-900/80 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-mono">
                      {std.code}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                      a = {std.certifiedA.toFixed(4)} Å
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                    {std.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {std.description}
                  </p>
                  <div className="text-[9px] font-mono text-slate-500">
                    Symmetry: {std.spaceGroup}
                  </div>
                </div>
              ))}
            </div>

            {/* Experimental File Uploader */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-400" />
                Import Custom Experimental Diffractogram (.xy, .dat, .csv)
              </h4>
              <p className="text-[10px] text-slate-400">
                Upload ASCII 2-column data (<span className="text-teal-400 font-mono">2θ, Intensity</span>) to refine directly against your experimental scan.
              </p>

              <label className="block p-4 border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-2xl cursor-pointer text-center bg-slate-900/40 hover:bg-teal-500/5 transition-all">
                <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-300 block">Click or Drag & Drop experimental XRD file</span>
                <span className="text-[9px] text-slate-500 block mt-1">Supports .xy, .dat, .csv, .txt formats</span>
                <input
                  type="file"
                  accept=".xy,.dat,.csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {uploadError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Deck Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A101D] border border-slate-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Export Rietveld Control Decks</h3>
                  <p className="text-xs text-slate-400">Generate input decks for production crystallography engines</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Format Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setExportFormat('fullprof')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  exportFormat === 'fullprof'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                FullProf (.pcr)
              </button>
              <button
                onClick={() => setExportFormat('topas')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  exportFormat === 'topas'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Bruker TOPAS (.inp)
              </button>
              <button
                onClick={() => setExportFormat('gsas')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  exportFormat === 'gsas'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                GSAS-II (Python)
              </button>
            </div>

            {/* Code Deck Preview */}
            <div className="relative">
              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-teal-300 max-h-72 overflow-y-auto custom-scrollbar leading-relaxed">
                {getExportText()}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={handleDownload}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Download className="w-4 h-4" />
                Download Control File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
