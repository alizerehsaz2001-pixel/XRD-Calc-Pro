import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, ArrowUpDown, Percent, Check, AlertCircle, 
  Sparkles, Wand2, Eye, EyeOff, Copy, RotateCcw, Compass, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScherrerInput } from '../../types';
import { suggestHKLPlanesAlgorithmic, calculateScherrer } from '../../utils/physics';

interface ScherrerPeakTableEditorProps {
  peaks: ScherrerInput[];
  onChange: (peaks: ScherrerInput[]) => void;
  wavelength: number;
  constantK?: number;
  instFwhm?: number;
  useCaglioti?: boolean;
  caglioti?: { u: number; v: number; w: number };
  broadeningModel?: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'de Keijser' | 'Halder-Wagner';
  materialDensity?: number;
  pseudoVoigtEta?: number;
  breadthType?: 'fwhm' | 'integral_breadth';
}

export const ScherrerPeakTableEditor: React.FC<ScherrerPeakTableEditorProps> = ({
  peaks,
  onChange,
  wavelength,
  constantK = 0.9,
  instFwhm = 0.1,
  useCaglioti = false,
  caglioti = { u: 0.004, v: -0.002, w: 0.01 },
  broadeningModel = 'Gaussian',
  materialDensity = 2.33,
  pseudoVoigtEta = 0.5,
  breadthType = 'fwhm'
}) => {
  const [newTwoTheta, setNewTwoTheta] = useState<string>('');
  const [newFwhm, setNewFwhm] = useState<string>('');
  const [newIntensity, setNewIntensity] = useState<string>('100');
  const [newH, setNewH] = useState<string>('');
  const [newK, setNewK] = useState<string>('');
  const [newL, setNewL] = useState<string>('');

  // Indexing & Synthesis tools state
  const [crystalSystem, setCrystalSystem] = useState<'Diamond' | 'FCC' | 'BCC' | 'SC' | 'Hexagonal'>('Diamond');
  const [showSynthesizer, setShowSynthesizer] = useState<boolean>(false);
  const [synthTargetSizeNm, setSynthTargetSizeNm] = useState<number>(28);
  const [synthStrainPct, setSynthStrainPct] = useState<number>(0.04);
  const [synthLatticeA, setSynthLatticeA] = useState<number>(5.431);
  const [copiedTable, setCopiedTable] = useState<boolean>(false);
  const [indexingMessage, setIndexingMessage] = useState<string | null>(null);

  // Compute live per-peak metrics & summary stats for Total Reflections
  const reflectionMetrics = useMemo(() => {
    let activeCount = 0;
    let excludedCount = 0;
    let resolvedCount = 0;
    let unresolvedCount = 0;
    const latticeEstimates: number[] = [];

    const rows = peaks.map((p) => {
      const isExcluded = !!p.excluded;
      if (isExcluded) excludedCount++;
      else activeCount++;

      const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
      const sinTheta = Math.sin(thetaRad);
      const dSpacing = sinTheta > 0 && wavelength > 0 ? wavelength / (2 * sinTheta) : 0;
      const qVector = sinTheta > 0 && wavelength > 0 ? (4 * Math.PI * sinTheta) / wavelength : 0;

      const curInstFwhm = useCaglioti
        ? Math.sqrt(Math.max(0.000001, caglioti.u * Math.pow(Math.tan(thetaRad), 2) + caglioti.v * Math.tan(thetaRad) + caglioti.w))
        : instFwhm;

      const calc = calculateScherrer(
        wavelength,
        constantK,
        curInstFwhm,
        p,
        broadeningModel,
        materialDensity,
        pseudoVoigtEta,
        breadthType
      );

      const isResolved = calc !== null && !calc.error && calc.sizeNm > 0;
      if (!isExcluded) {
        if (isResolved) resolvedCount++;
        else unresolvedCount++;
      }

      // Estimate cubic lattice parameter a = d * sqrt(h^2 + k^2 + l^2) if hkl provided
      let aEst: number | null = null;
      if (p.hkl && dSpacing > 0) {
        const s = p.hkl[0] * p.hkl[0] + p.hkl[1] * p.hkl[1] + p.hkl[2] * p.hkl[2];
        if (s > 0) {
          aEst = dSpacing * Math.sqrt(s);
          if (!isExcluded) latticeEstimates.push(aEst);
        }
      }

      return {
        dSpacing,
        qVector,
        curInstFwhm,
        sizeNm: isResolved && calc ? calc.sizeNm : null,
        betaCorrected: isResolved && calc ? calc.betaCorrected : null,
        error: calc?.error,
        aEst
      };
    });

    const activePeaks = peaks.filter(p => !p.excluded);
    const twoThetas = activePeaks.map(p => p.twoTheta);
    const min2T = twoThetas.length > 0 ? Math.min(...twoThetas) : 0;
    const max2T = twoThetas.length > 0 ? Math.max(...twoThetas) : 0;

    const meanA = latticeEstimates.length > 0
      ? latticeEstimates.reduce((a, b) => a + b, 0) / latticeEstimates.length
      : null;
    const stdA = latticeEstimates.length > 1 && meanA
      ? Math.sqrt(latticeEstimates.reduce((acc, val) => acc + Math.pow(val - meanA, 2), 0) / latticeEstimates.length)
      : 0;

    return {
      rows,
      total: peaks.length,
      activeCount,
      excludedCount,
      resolvedCount,
      unresolvedCount,
      min2T,
      max2T,
      meanA,
      stdA
    };
  }, [peaks, wavelength, constantK, instFwhm, useCaglioti, caglioti, broadeningModel, materialDensity, pseudoVoigtEta, breadthType]);

  const handleAddPeak = () => {
    const tt = parseFloat(newTwoTheta);
    const f = parseFloat(newFwhm);
    const intens = parseFloat(newIntensity) || 100;
    
    if (isNaN(tt) || tt <= 0 || tt >= 180 || isNaN(f) || f <= 0) return;

    let hkl: [number, number, number] | undefined = undefined;
    const h = parseInt(newH, 10);
    const k = parseInt(newK, 10);
    const l = parseInt(newL, 10);
    if (!isNaN(h) && !isNaN(k) && !isNaN(l)) {
      hkl = [h, k, l];
    }

    const updated: ScherrerInput[] = [...peaks, { twoTheta: tt, fwhmObs: f, intensity: intens, hkl, excluded: false }];
    onChange(updated);

    setNewTwoTheta('');
    setNewFwhm('');
    setNewIntensity('100');
    setNewH('');
    setNewK('');
    setNewL('');
  };

  const handleUpdateRow = (index: number, field: string, val: string) => {
    const updated = [...peaks];
    const peak = { ...updated[index] };

    if (field === 'twoTheta') peak.twoTheta = parseFloat(val) || 0;
    if (field === 'fwhmObs') peak.fwhmObs = parseFloat(val) || 0;
    if (field === 'intensity') peak.intensity = parseFloat(val) || 0;
    if (field === 'h' || field === 'k' || field === 'l') {
      const currentHkl = peak.hkl || [0, 0, 0];
      const h = field === 'h' ? (parseInt(val, 10) || 0) : currentHkl[0];
      const k = field === 'k' ? (parseInt(val, 10) || 0) : currentHkl[1];
      const l = field === 'l' ? (parseInt(val, 10) || 0) : currentHkl[2];
      peak.hkl = [h, k, l];
    }

    updated[index] = peak;
    onChange(updated);
  };

  const handleToggleExcludeRow = (index: number) => {
    const updated = [...peaks];
    updated[index] = {
      ...updated[index],
      excluded: !updated[index].excluded
    };
    onChange(updated);
  };

  const handleDeleteRow = (index: number) => {
    const updated = peaks.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleSortByTwoTheta = () => {
    const sorted = [...peaks].sort((a, b) => a.twoTheta - b.twoTheta);
    onChange(sorted);
  };

  const handleNormalizeIntensities = () => {
    if (peaks.length === 0) return;
    const maxI = Math.max(...peaks.map(p => p.intensity || 100));
    if (maxI <= 0) return;
    const normalized = peaks.map(p => ({
      ...p,
      intensity: Math.round(((p.intensity || 100) / maxI) * 100)
    }));
    onChange(normalized);
  };

  const handleIncludeAll = () => {
    const updated = peaks.map(p => ({ ...p, excluded: false }));
    onChange(updated);
  };

  // Deterministic Auto-Indexing of Miller Indices (hkl)
  const handleAutoIndexHkl = () => {
    if (peaks.length === 0) return;
    const twoThetas = peaks.map(p => p.twoTheta);
    const indexed = suggestHKLPlanesAlgorithmic(twoThetas, crystalSystem, wavelength);
    if (indexed.success && indexed.suggestions.length > 0) {
      const updated = peaks.map(p => {
        const match = indexed.suggestions.find(s => Math.abs(s.twoTheta - p.twoTheta) < 0.05);
        if (match) {
          return {
            ...p,
            hkl: [match.h, match.k, match.l] as [number, number, number]
          };
        }
        return p;
      });
      onChange(updated);
      setIndexingMessage(indexed.estimatedLatticeConstant || `Indexed ${peaks.length} reflections (${crystalSystem})`);
      setTimeout(() => setIndexingMessage(null), 4000);
    }
  };

  // Synthesize realistic diffraction reflections for target crystallite size & microstrain
  const handleSynthesizeReflections = () => {
    const planesBySystem: Record<string, { hkl: [number, number, number]; relInt: number }[]> = {
      Diamond: [
        { hkl: [1, 1, 1], relInt: 100 },
        { hkl: [2, 2, 0], relInt: 55 },
        { hkl: [3, 1, 1], relInt: 32 },
        { hkl: [4, 0, 0], relInt: 14 },
        { hkl: [3, 3, 1], relInt: 18 },
        { hkl: [4, 2, 2], relInt: 16 }
      ],
      FCC: [
        { hkl: [1, 1, 1], relInt: 100 },
        { hkl: [2, 0, 0], relInt: 48 },
        { hkl: [2, 2, 0], relInt: 26 },
        { hkl: [3, 1, 1], relInt: 30 },
        { hkl: [2, 2, 2], relInt: 11 }
      ],
      BCC: [
        { hkl: [1, 1, 0], relInt: 100 },
        { hkl: [2, 0, 0], relInt: 20 },
        { hkl: [2, 1, 1], relInt: 38 },
        { hkl: [2, 2, 0], relInt: 12 },
        { hkl: [3, 1, 0], relInt: 16 }
      ],
      SC: [
        { hkl: [1, 0, 0], relInt: 100 },
        { hkl: [1, 1, 0], relInt: 70 },
        { hkl: [1, 1, 1], relInt: 45 },
        { hkl: [2, 0, 0], relInt: 28 },
        { hkl: [2, 1, 0], relInt: 22 }
      ],
      Hexagonal: [
        { hkl: [1, 0, 0], relInt: 60 },
        { hkl: [0, 0, 2], relInt: 48 },
        { hkl: [1, 0, 1], relInt: 100 },
        { hkl: [1, 0, 2], relInt: 26 },
        { hkl: [1, 1, 0], relInt: 54 },
        { hkl: [1, 0, 3], relInt: 28 }
      ]
    };

    const planes = planesBySystem[crystalSystem] || planesBySystem.Diamond;
    const a = Math.max(2.0, synthLatticeA);
    const c = a * 1.602;
    const targetD_A = Math.max(2, synthTargetSizeNm) * 10; // in Angstroms
    const strain = Math.max(0, synthStrainPct) / 100;

    const synthesized: ScherrerInput[] = [];
    for (const pl of planes) {
      const [h, k, l] = pl.hkl;
      let invD2 = 0;
      if (crystalSystem === 'Hexagonal') {
        invD2 = (4 / 3) * (h * h + h * k + k * k) / (a * a) + (l * l) / (c * c);
      } else {
        invD2 = (h * h + k * k + l * l) / (a * a);
      }
      const d = 1 / Math.sqrt(invD2);
      const sinTheta = wavelength / (2 * d);
      if (sinTheta >= 0.96) continue;

      const thetaRad = Math.asin(sinTheta);
      const twoTheta = (2 * thetaRad) * (180 / Math.PI);

      // Size broadening in rad: beta_D = (K * lambda) / (D * cos(theta))
      const betaSizeRad = (constantK * wavelength) / (targetD_A * Math.cos(thetaRad));
      // Strain broadening in rad: beta_e = 4 * e * tan(theta)
      const betaStrainRad = 4 * strain * Math.tan(thetaRad);
      const betaSampleDeg = (betaSizeRad + betaStrainRad) * (180 / Math.PI);

      const curInst = useCaglioti
        ? Math.sqrt(Math.max(0.000001, caglioti.u * Math.pow(Math.tan(thetaRad), 2) + caglioti.v * Math.tan(thetaRad) + caglioti.w))
        : instFwhm;

      const fwhmObs = broadeningModel === 'Lorentzian'
        ? betaSampleDeg + curInst
        : Math.sqrt(betaSampleDeg * betaSampleDeg + curInst * curInst);

      synthesized.push({
        twoTheta: parseFloat(twoTheta.toFixed(3)),
        fwhmObs: parseFloat(fwhmObs.toFixed(3)),
        intensity: pl.relInt,
        hkl: pl.hkl,
        excluded: false
      });
    }

    if (synthesized.length > 0) {
      onChange(synthesized);
      setShowSynthesizer(false);
    }
  };

  const handleCopyCSV = () => {
    const text = peaks.map(p => {
      const prefix = p.excluded ? '! ' : '';
      const hklPart = p.hkl ? `, ${p.hkl[0]}, ${p.hkl[1]}, ${p.hkl[2]}` : '';
      return `${prefix}${p.twoTheta.toFixed(3)}, ${p.fwhmObs.toFixed(3)}, ${p.intensity ?? 100}${hklPart}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Total Reflections Header Card & Diagnostics Strip */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-white uppercase tracking-wider">
              Total Reflections: {reflectionMetrics.total}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {reflectionMetrics.activeCount} Active
            </span>
            {reflectionMetrics.excludedCount > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  {reflectionMetrics.excludedCount} Excluded
                </span>
              </>
            )}
          </div>

          {reflectionMetrics.meanA && (
            <div className="text-[10px] font-mono text-indigo-300 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-indigo-400" />
              <span>Est. a₀ = <strong>{reflectionMetrics.meanA.toFixed(4)} Å</strong></span>
              {reflectionMetrics.stdA > 0 && (
                <span className="text-slate-500">(±{reflectionMetrics.stdA.toFixed(4)})</span>
              )}
            </div>
          )}
        </div>

        {/* Reflection Coverage & Resolution Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/70 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              2θ Span: <strong className="text-slate-200">{reflectionMetrics.min2T.toFixed(1)}°–{reflectionMetrics.max2T.toFixed(1)}°</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span>
              Resolved: <strong className={reflectionMetrics.unresolvedCount > 0 ? 'text-amber-300' : 'text-emerald-300'}>
                {reflectionMetrics.resolvedCount}/{reflectionMetrics.activeCount}
              </strong>
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-1">
            {reflectionMetrics.excludedCount > 0 && (
              <button
                type="button"
                onClick={handleIncludeAll}
                className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                title="Re-enable all excluded reflections"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Enable All
              </button>
            )}
            <button
              type="button"
              onClick={handleSortByTwoTheta}
              disabled={peaks.length < 2}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
              title="Sort reflections in ascending 2θ order"
            >
              <ArrowUpDown className="w-2.5 h-2.5 text-indigo-400" />
              Sort 2θ
            </button>
            <button
              type="button"
              onClick={handleNormalizeIntensities}
              disabled={peaks.length === 0}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
              title="Normalize reflection intensities to 100% max"
            >
              <Percent className="w-2.5 h-2.5 text-emerald-400" />
              Norm I%
            </button>
            <button
              type="button"
              onClick={() => setShowSynthesizer(!showSynthesizer)}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border ${
                showSynthesizer
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800'
              }`}
              title="Synthesize diffraction reflections from target crystallite size & strain"
            >
              <Sliders className="w-2.5 h-2.5" />
              Synthesize
            </button>
            <button
              type="button"
              onClick={handleCopyCSV}
              disabled={peaks.length === 0}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
              title="Copy reflections as CSV"
            >
              {copiedTable ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
              {copiedTable ? 'Copied' : 'CSV'}
            </button>
          </div>
        </div>

        {/* Auto-Indexing & Symmetry Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/70">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Symmetry:</span>
            {(['Diamond', 'FCC', 'BCC', 'SC', 'Hexagonal'] as const).map(sys => (
              <button
                key={sys}
                type="button"
                onClick={() => setCrystalSystem(sys)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-colors cursor-pointer ${
                  crystalSystem === sys
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-900 text-slate-500 hover:text-slate-300 border border-slate-800'
                }`}
              >
                {sys}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAutoIndexHkl}
            disabled={peaks.length === 0}
            className="px-2.5 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            title="Automatically index (hkl) planes based on 2θ sin²θ ratios"
          >
            <Wand2 className="w-3 h-3 text-indigo-400" />
            Auto-Index (hkl)
          </button>
        </div>

        {indexingMessage && (
          <div className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{indexingMessage}</span>
          </div>
        )}
      </div>

      {/* Expandable Reflection Pattern Synthesizer */}
      <AnimatePresence>
        {showSynthesizer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Forward Diffraction Broadening Synthesizer ({crystalSystem})
                </span>
                <span className="text-[9px] font-mono text-slate-400">Generates 2θ, FWHM & (hkl)</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 font-mono text-[10px]">
                <div>
                  <label className="text-slate-400 block mb-1">Target D (nm)</label>
                  <input
                    type="number"
                    min="2"
                    max="250"
                    step="1"
                    value={synthTargetSizeNm}
                    onChange={(e) => setSynthTargetSizeNm(parseFloat(e.target.value) || 25)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Strain ε (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.01"
                    value={synthStrainPct}
                    onChange={(e) => setSynthStrainPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Lattice a₀ (Å)</label>
                  <input
                    type="number"
                    min="2.0"
                    max="15.0"
                    step="0.001"
                    value={synthLatticeA}
                    onChange={(e) => setSynthLatticeA(parseFloat(e.target.value) || 5.431)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSynthesizeReflections}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
              >
                Synthesize Multi-Peak Reflection Table
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Reflections Spreadsheet Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60 max-h-[310px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[9px] font-bold uppercase tracking-wider text-slate-400 sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="py-2 px-2 text-center" title="Include or exclude reflection from Mean Crystallite Sizing">Use</th>
              <th className="py-2 px-2">2θ [°]</th>
              <th className="py-2 px-2">FWHM [°]</th>
              <th className="py-2 px-2">I [%]</th>
              <th className="py-2 px-2">d [Å]</th>
              <th className="py-2 px-2 text-amber-400">D_hkl</th>
              <th className="py-2 px-2">(h k l)</th>
              <th className="py-2 px-2 text-center">Del</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            <AnimatePresence initial={false}>
              {peaks.map((p, idx) => {
                const m = reflectionMetrics.rows[idx];
                const isExcluded = !!p.excluded;
                const dSpacingStr = m && m.dSpacing > 0 ? m.dSpacing.toFixed(3) : '-';

                return (
                  <motion.tr 
                    key={`peak-${idx}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: isExcluded ? 0.45 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`transition-colors border-b border-slate-800/40 last:border-0 ${
                      isExcluded ? 'bg-slate-950/40' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Active / Exclude Toggle */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleExcludeRow(idx)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer mx-auto border ${
                          isExcluded
                            ? 'bg-slate-900 border-slate-700 text-slate-500 hover:text-amber-400'
                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                        }`}
                        title={isExcluded ? 'Excluded from Mean Sizing (click to include)' : `Peak #${idx + 1} included (click to exclude)`}
                      >
                        {isExcluded ? <EyeOff className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                      </button>
                    </td>

                    {/* 2Theta */}
                    <td className="py-2 px-1.5">
                      <input
                        type="number"
                        step="0.001"
                        value={p.twoTheta || ''}
                        onChange={(e) => handleUpdateRow(idx, 'twoTheta', e.target.value)}
                        className="w-16 bg-slate-950/80 border border-slate-700/60 rounded-md px-1.5 py-1 text-indigo-300 font-mono text-[11px] font-bold focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </td>

                    {/* Observed FWHM */}
                    <td className="py-2 px-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.001"
                          value={p.fwhmObs || ''}
                          onChange={(e) => handleUpdateRow(idx, 'fwhmObs', e.target.value)}
                          className={`w-15 bg-slate-950/80 border rounded-md px-1.5 py-1 font-mono text-[11px] font-bold focus:outline-none transition-all ${
                            m?.error
                              ? 'border-rose-500/60 text-rose-300 focus:border-rose-500'
                              : 'border-slate-700/60 text-amber-300 focus:border-amber-500'
                          }`}
                        />
                        {m?.error && (
                          <span title={m.error} className="text-rose-400 shrink-0">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Relative Intensity */}
                    <td className="py-2 px-1.5">
                      <input
                        type="number"
                        step="1"
                        value={p.intensity ?? 100}
                        onChange={(e) => handleUpdateRow(idx, 'intensity', e.target.value)}
                        className="w-12 bg-slate-950/80 border border-slate-700/60 rounded-md px-1.5 py-1 text-slate-300 font-mono text-[11px] font-bold focus:outline-none focus:border-slate-500 transition-all"
                      />
                    </td>

                    {/* d-Spacing */}
                    <td className="py-2 px-1.5 text-slate-400 text-[10px] font-bold whitespace-nowrap">
                      {dSpacingStr}
                    </td>

                    {/* Live Per-Peak Scherrer Size D_hkl */}
                    <td className="py-2 px-1.5 whitespace-nowrap">
                      {m?.sizeNm ? (
                        <span className="text-amber-300 font-bold text-[11px]">
                          {m.sizeNm.toFixed(1)} <span className="text-[9px] text-slate-500">nm</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 text-[9px] uppercase font-bold" title={m?.error || 'Below instrument resolution'}>
                          Limit
                        </span>
                      )}
                    </td>

                    {/* Miller Indices (h k l) */}
                    <td className="py-2 px-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="h"
                          value={p.hkl ? p.hkl[0] : ''}
                          onChange={(e) => handleUpdateRow(idx, 'h', e.target.value)}
                          className="w-7 bg-slate-950/80 border border-slate-700/60 rounded px-1 py-1 text-center text-slate-300 text-[10px] font-bold focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="number"
                          placeholder="k"
                          value={p.hkl ? p.hkl[1] : ''}
                          onChange={(e) => handleUpdateRow(idx, 'k', e.target.value)}
                          className="w-7 bg-slate-950/80 border border-slate-700/60 rounded px-1 py-1 text-center text-slate-300 text-[10px] font-bold focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="number"
                          placeholder="l"
                          value={p.hkl ? p.hkl[2] : ''}
                          onChange={(e) => handleUpdateRow(idx, 'l', e.target.value)}
                          className="w-7 bg-slate-950/80 border border-slate-700/60 rounded px-1 py-1 text-center text-slate-300 text-[10px] font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </td>

                    {/* Delete Action */}
                    <td className="py-2 px-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {peaks.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                  No reflection peaks entered yet. Use the quick-add bar below or click Synthesize.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Add Reflection Bar */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add:
        </span>
        <input
          type="number"
          placeholder="2θ [°]"
          step="0.001"
          value={newTwoTheta}
          onChange={(e) => setNewTwoTheta(e.target.value)}
          className="w-18 bg-slate-950 border border-slate-700/60 rounded-lg px-2 py-1 text-xs text-indigo-300 font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
        />
        <input
          type="number"
          placeholder="FWHM [°]"
          step="0.001"
          value={newFwhm}
          onChange={(e) => setNewFwhm(e.target.value)}
          className="w-18 bg-slate-950 border border-slate-700/60 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
        />
        <input
          type="number"
          placeholder="I [%]"
          value={newIntensity}
          onChange={(e) => setNewIntensity(e.target.value)}
          className="w-14 bg-slate-950 border border-slate-700/60 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="h"
            value={newH}
            onChange={(e) => setNewH(e.target.value)}
            className="w-8 bg-slate-950 border border-slate-700/60 rounded-lg px-1 py-1 text-xs text-center text-slate-300 font-mono font-bold placeholder:text-slate-600"
          />
          <input
            type="number"
            placeholder="k"
            value={newK}
            onChange={(e) => setNewK(e.target.value)}
            className="w-8 bg-slate-950 border border-slate-700/60 rounded-lg px-1 py-1 text-xs text-center text-slate-300 font-mono font-bold placeholder:text-slate-600"
          />
          <input
            type="number"
            placeholder="l"
            value={newL}
            onChange={(e) => setNewL(e.target.value)}
            className="w-8 bg-slate-950 border border-slate-700/60 rounded-lg px-1 py-1 text-xs text-center text-slate-300 font-mono font-bold placeholder:text-slate-600"
          />
        </div>
        <button
          type="button"
          onClick={handleAddPeak}
          disabled={!newTwoTheta || !newFwhm}
          className="px-3 py-1 ml-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  );
};
