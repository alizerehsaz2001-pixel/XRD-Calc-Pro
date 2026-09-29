import React, { useState, useMemo, useCallback } from 'react';
import { 
  Database, Plus, Trash2, Check, AlertCircle, AlertTriangle, 
  Sparkles, Wand2, Eye, EyeOff, Copy, RotateCcw, ArrowUpDown,
  Download, FileText, CheckCircle2, ChevronDown, ChevronUp,
  Sliders, Info, Activity, Layers, Scale, Play, Zap, FileSpreadsheet,
  Table
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MethodOfMomentsResult, MomentDataPoint } from '../../types';
import { playSynthTone } from '../../utils/sound';

export interface VarianceMatrixRow {
  id: string;
  sigmaDeg: number;
  varianceDeg2: number;
  mu3Rad3?: number;
  mu4Rad4?: number;
  excluded?: boolean;
}

export interface VarianceRangeDatasetMatrixProps {
  inputData: string;
  onInputDataChange: (data: string) => void;
  result?: MethodOfMomentsResult | null;
  twoTheta0: number;
  wavelength: number;
  shapeK?: number;
  onTriggerCalculate?: () => void;
  isReadOnly?: boolean;
  className?: string;
}

export const VARIANCE_REFERENCE_PRESETS = [
  {
    name: 'CeO₂ Nanocrystals (NIST SRM 674b)',
    tag: 'Pure Size Broadening',
    twoTheta0: 28.55,
    wavelength: 1.54056,
    expectedSizeNm: 18.5,
    expectedStrain: 0.0004,
    data: "0.20, 0.00182, 0.000009\n0.30, 0.00285, 0.000022\n0.40, 0.00392, 0.000041\n0.50, 0.00498, 0.000067\n0.60, 0.00605, 0.000099\n0.70, 0.00714, 0.000139\n0.80, 0.00822, 0.000185\n0.90, 0.00931, 0.000238\n1.00, 0.01041, 0.000299",
    desc: 'NIST fluorite ceria nanopowder with linear variance slope and negligible quadratic strain curvature.'
  },
  {
    name: 'Severe Plastic Deformed Ni',
    tag: 'Size + Dislocation Strain',
    twoTheta0: 44.51,
    wavelength: 1.54056,
    expectedSizeNm: 42.0,
    expectedStrain: 0.0028,
    data: "0.20, 0.00210, 0.000012\n0.35, 0.00395, 0.000038\n0.50, 0.00612, 0.000088\n0.65, 0.00862, 0.000168\n0.80, 0.01145, 0.000288\n0.95, 0.01460, 0.000455\n1.10, 0.01810, 0.000680\n1.25, 0.02192, 0.000970",
    desc: 'Dense dislocation forest driving high quadratic curvature in the variance-range plot.'
  },
  {
    name: 'Ultrafine Anatase TiO₂',
    tag: 'High Surface Area Nanopowder',
    twoTheta0: 25.28,
    wavelength: 1.54056,
    expectedSizeNm: 14.2,
    expectedStrain: 0.0008,
    data: "0.25, 0.00295, 0.000021\n0.40, 0.00485, 0.000055\n0.55, 0.00682, 0.000108\n0.70, 0.00886, 0.000182\n0.85, 0.01096, 0.000280\n1.00, 0.01314, 0.000405\n1.15, 0.01538, 0.000558",
    desc: 'Catalytic anatase titania with progressive range truncations up to 1.15 degrees.'
  },
  {
    name: 'Cold-Worked Cu-Al Alloy',
    tag: 'Heavy Microstrain Dominant',
    twoTheta0: 43.30,
    wavelength: 1.54056,
    expectedSizeNm: 68.0,
    expectedStrain: 0.0045,
    data: "0.30, 0.00340, 0.000030\n0.50, 0.00650, 0.000100\n0.70, 0.01040, 0.000250\n0.90, 0.01510, 0.000510\n1.10, 0.02060, 0.000920\n1.30, 0.02690, 0.001530",
    desc: 'Heavily deformed face-centered cubic alloy dominated by strain broadening.'
  },
  {
    name: 'Ball-Milled WC-Co Cermet',
    tag: 'Refractory Hardmetal',
    twoTheta0: 35.64,
    wavelength: 1.54056,
    expectedSizeNm: 22.4,
    expectedStrain: 0.0016,
    data: "0.20, 0.00245, 0.000018\n0.35, 0.00460, 0.000062\n0.50, 0.00715, 0.000145\n0.65, 0.01010, 0.000275\n0.80, 0.01342, 0.000460\n0.95, 0.01710, 0.000710\n1.10, 0.02115, 0.001040",
    desc: 'Nano-milled tungsten carbide cermet showing simultaneous size refinement and residual stress.'
  },
  {
    name: 'Deformed 316L Stainless Steel',
    tag: 'Planar Faults & Asymmetry',
    twoTheta0: 50.75,
    wavelength: 1.54056,
    expectedSizeNm: 35.0,
    expectedStrain: 0.0022,
    data: "0.25, 0.00280, 0.000028\n0.45, 0.00560, 0.000095\n0.65, 0.00890, 0.000220\n0.85, 0.01275, 0.000430\n1.05, 0.01715, 0.000740\n1.25, 0.02210, 0.001160",
    desc: 'High kurtosis and asymmetric line broadening originating from stacking fault planar defects.'
  }
];

export const VarianceRangeDatasetMatrix: React.FC<VarianceRangeDatasetMatrixProps> = ({
  inputData,
  onInputDataChange,
  result,
  twoTheta0,
  wavelength,
  shapeK = 1.0,
  onTriggerCalculate,
  isReadOnly = false,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'text'>('table');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);
  const [showSynthesizer, setShowSynthesizer] = useState<boolean>(false);

  // Synthesizer controls
  const [targetSizeNm, setTargetSizeNm] = useState<number>(25);
  const [targetMicrostrain, setTargetMicrostrain] = useState<number>(0.002);
  const [targetNoiseLevel, setTargetNoiseLevel] = useState<number>(1.5); // %
  const [targetNumRanges, setTargetNumRanges] = useState<number>(8);
  const [targetMaxSigma, setTargetMaxSigma] = useState<number>(1.0);

  // Parse input string into matrix rows
  const matrixRows = useMemo<VarianceMatrixRow[]>(() => {
    if (!inputData) return [];
    const lines = inputData.split('\n');
    const rows: VarianceMatrixRow[] = [];

    lines.forEach((line, idx) => {
      const raw = line.trim();
      if (!raw) return;
      const isHeader = (raw.startsWith('#') || raw.startsWith('//')) && !raw.match(/^[#!]\s*\d/);
      if (isHeader) return;

      const isExcluded = raw.startsWith('!') || raw.startsWith('#') || raw.startsWith('//');
      const clean = raw.replace(/^[!#/\s]+/, '');
      const parts = clean.split(/[\s,;\t]+/).map(p => parseFloat(p)).filter(p => !isNaN(p));

      if (parts.length >= 2) {
        const sigmaDeg = parts[0];
        const varianceDeg2 = parts[1];
        let mu3Rad3: number | undefined = undefined;
        let mu4Rad4: number | undefined = undefined;

        if (parts.length === 3) {
          mu4Rad4 = parts[2];
        } else if (parts.length >= 4) {
          mu3Rad3 = parts[2];
          mu4Rad4 = parts[3];
        }

        rows.push({
          id: `row-${idx}-${sigmaDeg}`,
          sigmaDeg,
          varianceDeg2,
          mu3Rad3,
          mu4Rad4,
          excluded: isExcluded
        });
      }
    });

    return rows;
  }, [inputData]);

  // Serialize matrix rows back to text
  const serializeRows = useCallback((rows: VarianceMatrixRow[]) => {
    const text = rows.map(r => {
      const prefix = r.excluded ? '# ' : '';
      if (r.mu3Rad3 !== undefined && r.mu4Rad4 !== undefined) {
        return `${prefix}${r.sigmaDeg.toFixed(3)}, ${r.varianceDeg2.toFixed(6)}, ${r.mu3Rad3.toExponential(4)}, ${r.mu4Rad4.toExponential(4)}`;
      }
      if (r.mu4Rad4 !== undefined) {
        return `${prefix}${r.sigmaDeg.toFixed(3)}, ${r.varianceDeg2.toFixed(6)}, ${r.mu4Rad4.toExponential(4)}`;
      }
      return `${prefix}${r.sigmaDeg.toFixed(3)}, ${r.varianceDeg2.toFixed(6)}`;
    }).join('\n');
    onInputDataChange(text);
  }, [onInputDataChange]);

  const handleUpdateRow = (id: string, updates: Partial<VarianceMatrixRow>) => {
    const updated = matrixRows.map(r => r.id === id ? { ...r, ...updates } : r);
    serializeRows(updated);
  };

  const handleToggleExclude = (id: string) => {
    playSynthTone('tick');
    const updated = matrixRows.map(r => r.id === id ? { ...r, excluded: !r.excluded } : r);
    serializeRows(updated);
  };

  const handleDeleteRow = (id: string) => {
    playSynthTone('tick');
    const updated = matrixRows.filter(r => r.id !== id);
    serializeRows(updated);
  };

  const handleAddRow = () => {
    playSynthTone('tick');
    const lastRow = matrixRows[matrixRows.length - 1];
    const newSigma = lastRow ? parseFloat((lastRow.sigmaDeg + 0.15).toFixed(2)) : 0.20;
    const newVar = lastRow ? parseFloat((lastRow.varianceDeg2 * 1.35).toFixed(6)) : 0.0020;
    const newRow: VarianceMatrixRow = {
      id: `row-${Date.now()}`,
      sigmaDeg: newSigma,
      varianceDeg2: newVar,
      excluded: false
    };
    serializeRows([...matrixRows, newRow]);
  };

  const handleSortBySigma = () => {
    playSynthTone('tick');
    const sorted = [...matrixRows].sort((a, b) => a.sigmaDeg - b.sigmaDeg);
    serializeRows(sorted);
  };

  const handlePruneOutliers = () => {
    if (!result || result.points.length < 4) return;
    playSynthTone('success');
    const residuals = result.fittedPoints.filter(p => !p.excluded && p.residualDeg2 !== undefined).map(p => Math.abs(p.residualDeg2 || 0));
    if (residuals.length === 0) return;
    const meanRes = residuals.reduce((a, b) => a + b, 0) / residuals.length;
    const stdRes = Math.sqrt(residuals.reduce((a, b) => a + Math.pow(b - meanRes, 2), 0) / residuals.length) || 1e-6;

    const updated = matrixRows.map((r, idx) => {
      const f = result.fittedPoints[idx];
      if (f && f.residualDeg2 !== undefined) {
        const zScore = Math.abs(f.residualDeg2 - meanRes) / stdRes;
        if (zScore > 2.2) {
          return { ...r, excluded: true };
        }
      }
      return r;
    });
    serializeRows(updated);
  };

  const handleLoadPreset = (preset: typeof VARIANCE_REFERENCE_PRESETS[0], idx: number) => {
    playSynthTone('success');
    setSelectedPresetIndex(idx);
    onInputDataChange(preset.data);
  };

  // Generate synthetic variance parabola dataset
  const handleGenerateSynthetic = () => {
    playSynthTone('success');
    const DEG_TO_RAD = Math.PI / 180;
    const RAD_TO_DEG = 180 / Math.PI;
    const theta0Rad = (twoTheta0 / 2) * DEG_TO_RAD;
    const cosTheta0 = Math.cos(theta0Rad);
    const tanTheta0 = Math.tan(theta0Rad);

    // K1 = (shapeK * lambda) / (pi^2 * D_V_Ang * cos(theta0))
    const dVAng = targetSizeNm * 10;
    const k1Rad = (shapeK * wavelength) / (Math.PI * Math.PI * dVAng * cosTheta0);
    // K2 = 4 * <e^2> * tan^2(theta0)
    const k2Rad = 4 * (targetMicrostrain * targetMicrostrain) * (tanTheta0 * tanTheta0);
    const w0Rad = 0.00005; // tiny background intercept

    const rows: VarianceMatrixRow[] = [];
    const step = targetMaxSigma / targetNumRanges;

    for (let i = 1; i <= targetNumRanges; i++) {
      const sigDeg = parseFloat((i * step).toFixed(2));
      const sigRad = sigDeg * DEG_TO_RAD;
      const noise = (Math.random() - 0.5) * 2 * (targetNoiseLevel / 100);
      const wRad2 = (w0Rad + k1Rad * sigRad + k2Rad * sigRad * sigRad) * (1 + noise);
      const wDeg2 = wRad2 * RAD_TO_DEG * RAD_TO_DEG;
      const mu4Rad4 = 3 * wRad2 * wRad2; // Gaussian baseline kurtosis

      rows.push({
        id: `synth-${i}`,
        sigmaDeg: sigDeg,
        varianceDeg2: parseFloat(wDeg2.toFixed(6)),
        mu4Rad4: parseFloat(mu4Rad4.toExponential(4)),
        excluded: false
      });
    }

    serializeRows(rows);
    setShowSynthesizer(false);
  };

  // Monotonicity verification
  const monotonicityCheck = useMemo(() => {
    const active = matrixRows.filter(r => !r.excluded);
    if (active.length < 2) return { isMonotonic: true, violations: 0 };
    let violations = 0;
    for (let i = 1; i < active.length; i++) {
      if (active[i].varianceDeg2 <= active[i - 1].varianceDeg2) {
        violations++;
      }
    }
    return { isMonotonic: violations === 0, violations };
  }, [matrixRows]);

  // Clipboard copy helpers
  const handleCopy = (format: 'csv' | 'latex' | 'python' | 'tsv') => {
    let output = '';
    const active = matrixRows.filter(r => !r.excluded);

    if (format === 'csv') {
      output = "Range_Sigma_deg,Variance_W_deg2,Mu3_rad3,Mu4_rad4\n" +
        active.map(r => `${r.sigmaDeg},${r.varianceDeg2},${r.mu3Rad3 ?? ''},${r.mu4Rad4 ?? ''}`).join('\n');
    } else if (format === 'tsv') {
      output = "Range_Sigma_deg\tVariance_W_deg2\tMu3_rad3\tMu4_rad4\n" +
        active.map(r => `${r.sigmaDeg}\t${r.varianceDeg2}\t${r.mu3Rad3 ?? ''}\t${r.mu4Rad4 ?? ''}`).join('\n');
    } else if (format === 'latex') {
      output = "\\begin{tabular}{cccc}\n\\toprule\n$\\sigma$ (deg) & $W(\\sigma)$ (deg$^2$) & $\\mu_3$ (rad$^3$) & $\\mu_4$ (rad$^4$) \\\\\n\\midrule\n" +
        active.map(r => `${r.sigmaDeg.toFixed(2)} & ${r.varianceDeg2.toFixed(6)} & ${r.mu3Rad3 ? r.mu3Rad3.toExponential(2) : '-'} & ${r.mu4Rad4 ? r.mu4Rad4.toExponential(2) : '-'} \\\\`).join('\n') +
        "\n\\bottomrule\n\\end{tabular}";
    } else if (format === 'python') {
      const sigmas = active.map(r => r.sigmaDeg).join(', ');
      const vars = active.map(r => r.varianceDeg2).join(', ');
      output = `import numpy as np\n\nsigma_deg = np.array([${sigmas}])\nvariance_deg2 = np.array([${vars}])\n\n# Convert to radians\nsigma_rad = np.radians(sigma_deg)\nvariance_rad2 = variance_deg2 * (np.pi / 180)**2\n`;
    }

    navigator.clipboard.writeText(output);
    setCopiedKey(format);
    playSynthTone('success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Range_Sigma_deg,Variance_W_deg2,Mu3_rad3,Mu4_rad4,Excluded\n" +
      matrixRows.map(r => `${r.sigmaDeg},${r.varianceDeg2},${r.mu3Rad3 ?? ''},${r.mu4Rad4 ?? ''},${r.excluded ? 'YES' : 'NO'}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Variance_Range_Matrix_${twoTheta0.toFixed(1)}deg.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSynthTone('success');
  };

  const activePointsCount = matrixRows.filter(r => !r.excluded).length;

  return (
    <div className={`bg-[#080E1A]/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden text-slate-200 font-sans ${className}`}>
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-purple-950/30 via-slate-900/50 to-indigo-950/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Variance-Range Dataset Matrix
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                W(σ) vs σ
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Progressive peak truncation limits σ = Δ(2θ)/2 & 2nd central moments
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <button
              type="button"
              onClick={() => { setViewMode('table'); playSynthTone('tick'); }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-purple-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Spreadsheet Grid</span>
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('text'); playSynthTone('tick'); }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'text' ? 'bg-purple-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw Text Editor</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSynthesizer(!showSynthesizer)}
            className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Synthesize ideal variance-range parabola data from target size and strain"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Parabola Synthesizer</span>
          </button>
        </div>
      </div>

      {/* Live Regression & Monotonicity Diagnostics HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-3 bg-black/40 border-b border-white/5 font-mono text-xs">
        <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
          <span className="text-[9px] text-slate-500 uppercase block">Active Data Points</span>
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="text-purple-400">{activePointsCount}</span>
            <span className="text-slate-600">/</span>
            <span>{matrixRows.length} cuts</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
          <span className="text-[9px] text-slate-500 uppercase block">Wilson Fit R²</span>
          <div className="font-bold text-emerald-400">
            {result ? result.rSquared.toFixed(4) : '—'}
          </div>
        </div>

        <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
          <span className="text-[9px] text-slate-500 uppercase block">Apparent Size D_V</span>
          <div className="font-bold text-sky-300">
            {result && result.sizeNm > 0 ? `${result.sizeNm.toFixed(2)} nm` : '—'}
          </div>
        </div>

        <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
          <span className="text-[9px] text-slate-500 uppercase block">RMS Microstrain</span>
          <div className="font-bold text-amber-300">
            {result ? `${(result.rmsStrain * 100).toFixed(3)}%` : '—'}
          </div>
        </div>

        <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
          <span className="text-[9px] text-slate-500 uppercase block">Variance Slope K₁</span>
          <div className="font-bold text-indigo-300">
            {result ? result.slopeK1.toExponential(3) : '—'}
          </div>
        </div>

        <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
          <span className="text-[9px] text-slate-500 uppercase block">Monotonicity</span>
          <div>
            {monotonicityCheck.isMonotonic ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                <Check className="w-3 h-3" /> Valid W(σ)
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]" title={`${monotonicityCheck.violations} non-monotonic drops detected`}>
                <AlertTriangle className="w-3 h-3" /> {monotonicityCheck.violations} Drops
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Parabola Synthesizer Drawer */}
      <AnimatePresence>
        {showSynthesizer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-indigo-500/30 bg-indigo-950/20 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                Forward Physical Variance Parabola Synthesizer
              </span>
              <button
                type="button"
                onClick={() => setShowSynthesizer(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
              <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Size D:</span>
                  <span className="text-sky-300 font-bold">{targetSizeNm} nm</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="1"
                  value={targetSizeNm}
                  onChange={(e) => setTargetSizeNm(parseFloat(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Microstrain:</span>
                  <span className="text-amber-300 font-bold">{(targetMicrostrain * 100).toFixed(3)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.01"
                  step="0.0002"
                  value={targetMicrostrain}
                  onChange={(e) => setTargetMicrostrain(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Noise Level:</span>
                  <span className="text-purple-300 font-bold">{targetNoiseLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={targetNoiseLevel}
                  onChange={(e) => setTargetNoiseLevel(parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Range Cuts:</span>
                  <span className="text-emerald-300 font-bold">{targetNumRanges}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="15"
                  step="1"
                  value={targetNumRanges}
                  onChange={(e) => setTargetNumRanges(parseInt(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGenerateSynthetic}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Matrix</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content: Spreadsheet View or Raw Text Editor */}
      <div className="p-4 sm:p-5 space-y-4">
        {viewMode === 'table' ? (
          <div className="space-y-3">
            {/* Table Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Range Cut</span>
                </button>

                <button
                  type="button"
                  onClick={handleSortBySigma}
                  className="px-2.5 py-1.5 bg-black/40 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                  title="Sort rows by range cutoff sigma ascending"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sort by σ</span>
                </button>

                {result && (
                  <button
                    type="button"
                    onClick={handlePruneOutliers}
                    className="px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                    title="Automatically exclude points with high regression residuals (|z| > 2.2)"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Prune Outliers</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>Centroid 2θ₀: <strong className="text-white">{twoTheta0.toFixed(2)}°</strong></span>
                <span className="text-slate-600">|</span>
                <span>Wavelength: <strong className="text-indigo-300">{wavelength} Å</strong></span>
              </div>
            </div>

            {/* Matrix Spreadsheet Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/60 shadow-inner">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 bg-slate-900/80">
                    <th className="p-3 w-10 text-center">Active</th>
                    <th className="p-3">Range Limit σ (deg)</th>
                    <th className="p-3">Profile Variance W (deg²)</th>
                    <th className="p-3 text-slate-400">Reduced W/σ (deg)</th>
                    <th className="p-3 text-slate-400">4th Moment μ₄ (rad⁴)</th>
                    <th className="p-3 text-slate-400">Kurtosis β₂</th>
                    <th className="p-3 text-slate-400">Fitted W (deg²)</th>
                    <th className="p-3 text-slate-400">Residual ΔW</th>
                    <th className="p-3 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {matrixRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No variance points in matrix. Click &quot;Add Range Cut&quot; or select a material preset below.
                      </td>
                    </tr>
                  ) : (
                    matrixRows.map((row, idx) => {
                      const f = result?.fittedPoints[idx];
                      const reducedW = row.sigmaDeg > 0 ? (row.varianceDeg2 / row.sigmaDeg) : 0;
                      const DEG_TO_RAD = Math.PI / 180;
                      const wRad2 = row.varianceDeg2 * DEG_TO_RAD * DEG_TO_RAD;
                      const kurtosis = row.mu4Rad4 && wRad2 > 0 ? (row.mu4Rad4 / (wRad2 * wRad2)) : 3.0;

                      return (
                        <tr 
                          key={row.id}
                          className={`transition-colors ${
                            row.excluded ? 'bg-rose-950/10 opacity-45' : 'hover:bg-white/5'
                          }`}
                        >
                          {/* Toggle Exclude */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleExclude(row.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                row.excluded
                                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
                                  : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                              }`}
                              title={row.excluded ? "Include in regression fit" : "Exclude point from regression fit"}
                            >
                              {row.excluded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </td>

                          {/* Range Sigma (deg) Input */}
                          <td className="p-2">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={row.sigmaDeg}
                                onChange={(e) => handleUpdateRow(row.id, { sigmaDeg: parseFloat(e.target.value) || 0 })}
                                disabled={isReadOnly}
                                className="w-24 px-2 py-1 bg-black/70 border border-white/10 rounded-lg text-white font-bold outline-none focus:border-purple-500 shadow-inner"
                              />
                              <span className="text-[10px] text-slate-500 ml-1.5">
                                ({(row.sigmaDeg * DEG_TO_RAD).toFixed(4)} rad)
                              </span>
                            </div>
                          </td>

                          {/* Profile Variance W (deg^2) Input */}
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={row.varianceDeg2}
                              onChange={(e) => handleUpdateRow(row.id, { varianceDeg2: parseFloat(e.target.value) || 0 })}
                              disabled={isReadOnly}
                              className="w-28 px-2 py-1 bg-black/70 border border-white/10 rounded-lg text-purple-300 font-bold outline-none focus:border-purple-500 shadow-inner"
                            />
                          </td>

                          {/* Reduced Variance W/sigma */}
                          <td className="p-2 text-sky-300 font-medium">
                            {reducedW.toFixed(5)}
                          </td>

                          {/* 4th Moment mu4 Input */}
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.000001"
                              value={row.mu4Rad4 !== undefined ? row.mu4Rad4 : ''}
                              placeholder="Auto/Opt"
                              onChange={(e) => handleUpdateRow(row.id, { mu4Rad4: e.target.value ? parseFloat(e.target.value) : undefined })}
                              disabled={isReadOnly}
                              className="w-28 px-2 py-1 bg-black/70 border border-white/10 rounded-lg text-slate-300 font-mono text-[11px] outline-none focus:border-purple-500 shadow-inner"
                            />
                          </td>

                          {/* Kurtosis beta_2 */}
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                              kurtosis > 3.5 ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'text-slate-400'
                            }`}>
                              {kurtosis.toFixed(2)}
                            </span>
                          </td>

                          {/* Fitted W */}
                          <td className="p-2 text-emerald-300 font-medium">
                            {f ? f.fittedWDeg2.toFixed(6) : '—'}
                          </td>

                          {/* Residual Delta W */}
                          <td className="p-2">
                            {f && f.residualDeg2 !== undefined ? (
                              <span className={`font-mono text-[11px] ${
                                Math.abs(f.residualDeg2) < 0.0001 ? 'text-emerald-400' : 'text-amber-300'
                              }`}>
                                {f.residualDeg2.toExponential(2)}
                              </span>
                            ) : '—'}
                          </td>

                          {/* Row Delete Action */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              disabled={isReadOnly || matrixRows.length <= 3}
                              className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                              title="Delete this row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Raw Text Editor View */
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Format: <code>Range_σ [deg], Variance_W [deg²], μ₃ [rad³] (opt), μ₄ [rad⁴] (opt)</code></span>
              <span>Use prefix <code>#</code> or <code>!</code> to exclude lines</span>
            </div>
            <textarea
              rows={10}
              value={inputData}
              onChange={(e) => onInputDataChange(e.target.value)}
              placeholder="0.20, 0.00182, 0.000009\n0.35, 0.00395, 0.000038\n0.50, 0.00612, 0.000088\n0.65, 0.00862, 0.000168"
              spellCheck={false}
              className="w-full p-4 bg-black/80 text-purple-300 font-mono text-xs border border-white/10 rounded-xl outline-none focus:border-purple-500/50 hover:border-white/20 transition-all custom-scrollbar leading-relaxed shadow-inner"
            />
          </div>
        )}

        {/* Pre-set Material Benchmark Library */}
        <div className="pt-3 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              NIST & Nanomaterial Benchmark Library
            </span>
            <span className="text-[10px] text-slate-500 font-mono">1-Click Loading</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {VARIANCE_REFERENCE_PRESETS.map((preset, pIdx) => {
              const isSelected = selectedPresetIndex === pIdx;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleLoadPreset(preset, pIdx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group/preset ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover/preset:text-purple-300 transition-colors truncate">
                      {preset.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono shrink-0 ml-1">
                      {preset.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                    {preset.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export & Copy Footer Bar */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Export:</span>
            <button
              type="button"
              onClick={() => handleCopy('csv')}
              className="px-2.5 py-1 bg-black/40 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'csv' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy('tsv')}
              className="px-2.5 py-1 bg-black/40 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'tsv' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span>TSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy('latex')}
              className="px-2.5 py-1 bg-black/40 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'latex' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span>LaTeX</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy('python')}
              className="px-2.5 py-1 bg-black/40 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span>NumPy</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold"
            >
              <Download className="w-3 h-3" />
              <span>Download File</span>
            </button>
          </div>

          {onTriggerCalculate && (
            <button
              type="button"
              onClick={onTriggerCalculate}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Wilson Regression</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
