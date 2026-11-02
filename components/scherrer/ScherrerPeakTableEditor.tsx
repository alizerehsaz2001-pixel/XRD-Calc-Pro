import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, ArrowUpDown, Percent, Check, AlertCircle, 
  Sparkles, Wand2, Eye, EyeOff, Copy, RotateCcw, Compass, Sliders,
  BarChart2, Layers, Minimize2
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
  kAlpha2Correction?: boolean;
  zeroShiftDeg?: number;
  morphologyKMode?: 'Isotropic' | 'Cube' | 'Octahedron' | 'Tetrahedron' | 'HexagonalRod';
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
  breadthType = 'fwhm',
  kAlpha2Correction = false,
  zeroShiftDeg = 0,
  morphologyKMode = 'Isotropic'
}) => {
  const [newTwoTheta, setNewTwoTheta] = useState<string>('');
  const [newFwhm, setNewFwhm] = useState<string>('');
  const [newIntensity, setNewIntensity] = useState<string>('100');
  const [newH, setNewH] = useState<string>('');
  const [newK, setNewK] = useState<string>('');
  const [newL, setNewL] = useState<string>('');

  // Graphic visualizer mode & selected reflection index
  const [graphicMode, setGraphicMode] = useState<'spectrum' | 'deconv' | 'domain'>('spectrum');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);

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

      const effTwoTheta = p.twoTheta - zeroShiftDeg;
      const thetaRad = (effTwoTheta / 2) * (Math.PI / 180);
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
        breadthType,
        0.256,
        {
          kAlpha2Correction,
          zeroShiftDeg,
          morphologyKMode
        }
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

      const planesN = isResolved && calc && dSpacing > 0
        ? Math.max(2, Math.round((calc.sizeNm * 10) / dSpacing))
        : 0;

      return {
        dSpacing,
        qVector,
        curInstFwhm,
        sizeNm: isResolved && calc ? calc.sizeNm : null,
        betaCorrected: isResolved && calc ? calc.betaCorrected : null,
        effectiveK: calc?.effectiveK ?? constantK,
        kAlpha2BroadeningDeg: calc?.kAlpha2BroadeningDeg ?? 0,
        planesN,
        error: calc?.error,
        aEst
      };
    });

    const activePeaks = peaks.filter(p => !p.excluded);
    const twoThetas = activePeaks.map(p => p.twoTheta);
    const min2T = twoThetas.length > 0 ? Math.min(...twoThetas) : 0;
    const max2T = twoThetas.length > 0 ? Math.max(...twoThetas) : 0;
    const maxIntensity = peaks.length > 0 ? Math.max(...peaks.map(p => p.intensity || 100), 1) : 100;
    const maxObsFwhm = peaks.length > 0 ? Math.max(...peaks.map(p => p.fwhmObs || 0.1), 0.1) : 0.5;

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
      maxIntensity,
      maxObsFwhm,
      meanA,
      stdA
    };
  }, [peaks, wavelength, constantK, instFwhm, useCaglioti, caglioti, broadeningModel, materialDensity, pseudoVoigtEta, breadthType, kAlpha2Correction, zeroShiftDeg, morphologyKMode]);

  const safeSelectedIdx = peaks.length > 0 ? Math.min(selectedPeakIdx, peaks.length - 1) : 0;

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
    setSelectedPeakIdx(updated.length - 1);

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
    if (selectedPeakIdx >= updated.length) {
      setSelectedPeakIdx(Math.max(0, updated.length - 1));
    }
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
            <span className="text-[11px] font-black text-white uppercase tracking-wider tabular-nums">
              Total Reflections: {reflectionMetrics.total}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] font-mono tabular-nums text-emerald-400 font-bold">
              {reflectionMetrics.activeCount} Active
            </span>
            {reflectionMetrics.excludedCount > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] font-mono tabular-nums text-amber-400 font-bold">
                  {reflectionMetrics.excludedCount} Excluded
                </span>
              </>
            )}
          </div>

          {reflectionMetrics.meanA && (
            <div className="text-[10px] font-mono tabular-nums text-indigo-300 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-indigo-400" />
              <span>Est. a₀ = <strong>{reflectionMetrics.meanA.toFixed(4)} Å</strong></span>
              {reflectionMetrics.stdA > 0 && (
                <span className="text-slate-500">(±{reflectionMetrics.stdA.toFixed(4)})</span>
              )}
            </div>
          )}
        </div>

        {/* Reflection Coverage & Resolution Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/70 text-[10px] font-mono tabular-nums text-slate-400">
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
          <div className="flex items-center gap-1.5 flex-wrap">
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

      {/* Interactive 3-Mode Scherrer Reflections SVG Graphic */}
      {peaks.length > 0 && (
        <div className="bg-[#050A14] border border-slate-800/90 rounded-2xl p-3 space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                Scherrer Reflection Graphic
              </span>
            </div>
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[9px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setGraphicMode('spectrum')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  graphicMode === 'spectrum'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <BarChart2 className="w-2.5 h-2.5" />
                XRD Pattern
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode('deconv')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  graphicMode === 'deconv'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Layers className="w-2.5 h-2.5" />
                β Deconv
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode('domain')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  graphicMode === 'domain'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Minimize2 className="w-2.5 h-2.5" />
                Bragg N·d
              </button>
            </div>
          </div>

          {/* Mode 1: Interactive XRD Stick & Broadened Envelope Spectrum */}
          {graphicMode === 'spectrum' && (
            <div className="space-y-1.5">
              <svg viewBox="0 0 360 128" className="w-full h-32 bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-visible select-none">
                <defs>
                  <linearGradient id="scherrerStickGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="scherrerBellFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle Grid Lines */}
                {[28, 56, 84].map((yVal) => (
                  <line key={yVal} x1="24" y1={yVal} x2="346" y2={yVal} stroke="#1e293b" strokeWidth="0.6" strokeDasharray="2 2" />
                ))}
                <line x1="24" y1="104" x2="346" y2="104" stroke="#334155" strokeWidth="1" />

                {(() => {
                  const minAngle = Math.max(5, Math.floor((reflectionMetrics.min2T || 20) - 6));
                  const maxAngle = Math.min(160, Math.ceil((reflectionMetrics.max2T || 80) + 6));
                  const spanAngle = Math.max(10, maxAngle - minAngle);

                  return (
                    <>
                      {/* 2Theta Axis Ticks */}
                      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                        const x = 28 + t * 312;
                        const deg = minAngle + t * spanAngle;
                        return (
                          <g key={i}>
                            <line x1={x} y1="104" x2={x} y2="108" stroke="#475569" strokeWidth="0.8" />
                            <text x={x} y="118" fill="#64748b" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                              {deg.toFixed(0)}°
                            </text>
                          </g>
                        );
                      })}

                      {/* Render each reflection stick & broadened Pseudo-Voigt bell */}
                      {peaks.map((p, idx) => {
                        const m = reflectionMetrics.rows[idx];
                        const isSel = idx === safeSelectedIdx;
                        const isExcl = !!p.excluded;
                        const xPos = 28 + Math.max(0, Math.min(1, (p.twoTheta - minAngle) / spanAngle)) * 312;
                        const relI = Math.max(0.08, (p.intensity ?? 100) / reflectionMetrics.maxIntensity);
                        const stickH = relI * 72;
                        const yTop = 104 - stickH;

                        // Visual width proportional to FWHM_obs
                        const halfW = Math.max(3.5, Math.min(24, (p.fwhmObs / Math.max(0.15, reflectionMetrics.maxObsFwhm)) * 14));
                        const bellPath = `M ${(xPos - halfW * 2.1).toFixed(1)} 104 Q ${(xPos - halfW * 0.65).toFixed(1)} 104 ${(xPos - halfW * 0.45).toFixed(1)} ${(104 - stickH * 0.5).toFixed(1)} Q ${xPos.toFixed(1)} ${(yTop - 4).toFixed(1)} ${(xPos + halfW * 0.45).toFixed(1)} ${(104 - stickH * 0.5).toFixed(1)} Q ${(xPos + halfW * 0.65).toFixed(1)} 104 ${(xPos + halfW * 2.1).toFixed(1)} 104`;

                        const hklText = p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`;

                        return (
                          <g
                            key={idx}
                            onClick={() => setSelectedPeakIdx(idx)}
                            className="cursor-pointer transition-opacity"
                            opacity={isExcl ? 0.3 : 1}
                          >
                            {/* Broadened Bell Envelope */}
                            <path
                              d={bellPath}
                              fill={isSel ? 'url(#scherrerBellFill)' : 'rgba(99,102,241,0.12)'}
                              stroke={isSel ? '#f59e0b' : '#6366f1'}
                              strokeWidth={isSel ? '1.3' : '0.8'}
                            />
                            {/* FWHM Caliper on Selected Peak */}
                            {isSel && (
                              <g>
                                <line
                                  x1={xPos - halfW * 0.5}
                                  y1={104 - stickH * 0.5}
                                  x2={xPos + halfW * 0.5}
                                  y2={104 - stickH * 0.5}
                                  stroke="#10b981"
                                  strokeWidth="1.2"
                                />
                                <circle cx={xPos - halfW * 0.5} cy={104 - stickH * 0.5} r="1.3" fill="#10b981" />
                                <circle cx={xPos + halfW * 0.5} cy={104 - stickH * 0.5} r="1.3" fill="#10b981" />
                              </g>
                            )}
                            {/* Stick */}
                            <line
                              x1={xPos}
                              y1="104"
                              x2={xPos}
                              y2={yTop}
                              stroke={isSel ? '#fbbf24' : 'url(#scherrerStickGrad)'}
                              strokeWidth={isSel ? '2' : '1.4'}
                            />
                            <circle
                              cx={xPos}
                              cy={yTop}
                              r={isSel ? '2.8' : '2'}
                              fill={m?.error ? '#f43f5e' : isSel ? '#fbbf24' : '#818cf8'}
                            />
                            {/* Label */}
                            <text
                              x={xPos}
                              y={Math.max(12, yTop - 6)}
                              fill={isSel ? '#fbbf24' : '#cbd5e1'}
                              fontSize={isSel ? '7.5' : '6.8'}
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {hklText}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>

              {/* Selected Peak Telemetry Bar */}
              {peaks[safeSelectedIdx] && (() => {
                const selP = peaks[safeSelectedIdx];
                const selM = reflectionMetrics.rows[safeSelectedIdx];
                return (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 bg-slate-900/70 rounded-lg border border-slate-800/80 text-[9.5px] font-mono tabular-nums">
                    <span className="text-amber-300 font-bold">
                      {selP.hkl ? `(${selP.hkl.join('')})` : `Peak #${safeSelectedIdx + 1}`} @ {selP.twoTheta.toFixed(3)}°
                    </span>
                    <span className="text-slate-400">
                      β_obs: <strong className="text-slate-200">{selP.fwhmObs.toFixed(3)}°</strong> → β_phys: <strong className="text-emerald-300">{selM?.betaCorrected ? `${selM.betaCorrected.toFixed(3)}°` : 'Limit'}</strong>
                    </span>
                    <span className="text-indigo-300 font-bold">
                      D = {selM?.sizeNm ? `${selM.sizeNm.toFixed(2)} nm` : 'Unresolved'}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Mode 2: FWHM Broadening Deconvolution Graphic (β_obs = β_inst ⊕ β_phys) */}
          {graphicMode === 'deconv' && (
            <div className="space-y-1.5">
              <svg viewBox="0 0 360 128" className="w-full h-32 bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-visible select-none">
                <line x1="28" y1="102" x2="346" y2="102" stroke="#334155" strokeWidth="1" />
                {peaks.map((p, idx) => {
                  const m = reflectionMetrics.rows[idx];
                  const isSel = idx === safeSelectedIdx;
                  const count = Math.max(1, peaks.length);
                  const slotW = 310 / count;
                  const cx = 32 + idx * slotW + slotW * 0.5;
                  const barW = Math.min(26, Math.max(10, slotW * 0.56));

                  const maxB = Math.max(0.2, reflectionMetrics.maxObsFwhm);
                  const totalH = Math.min(76, (p.fwhmObs / maxB) * 76);
                  const instH = Math.min(totalH, ((m?.curInstFwhm || 0) / maxB) * 76);
                  const physH = Math.max(0, totalH - instH);

                  const hklText = p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`;

                  return (
                    <g
                      key={idx}
                      onClick={() => setSelectedPeakIdx(idx)}
                      className="cursor-pointer"
                      opacity={p.excluded ? 0.35 : 1}
                    >
                      {/* Instrumental Base Segment */}
                      <rect
                        x={cx - barW / 2}
                        y={102 - instH}
                        width={barW}
                        height={Math.max(1.5, instH)}
                        rx="2"
                        fill="#f59e0b"
                        fillOpacity="0.45"
                        stroke="#f59e0b"
                        strokeWidth={isSel ? '1' : '0.5'}
                      />
                      {/* Physical Size Broadening Segment */}
                      {physH > 0 && (
                        <rect
                          x={cx - barW / 2}
                          y={102 - instH - physH}
                          width={barW}
                          height={physH}
                          rx="2"
                          fill="#10b981"
                          fillOpacity="0.65"
                          stroke="#10b981"
                          strokeWidth={isSel ? '1.2' : '0.6'}
                        />
                      )}
                      {/* Top D_hkl readout */}
                      <text
                        x={cx}
                        y={Math.max(11, 102 - totalH - 5)}
                        fill={m?.sizeNm ? '#6ee7b7' : '#fb7185'}
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {m?.sizeNm ? `${m.sizeNm.toFixed(1)}nm` : 'Lim'}
                      </text>
                      {/* Bottom hkl label */}
                      <text
                        x={cx}
                        y="115"
                        fill={isSel ? '#fbbf24' : '#94a3b8'}
                        fontSize="7.2"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {hklText}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex items-center justify-between px-2 text-[9px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-emerald-500/80 inline-block" />
                  Physical Size β_phys
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-amber-500/60 inline-block" />
                  Instrument β_inst ({broadeningModel})
                </span>
              </div>
            </div>
          )}

          {/* Mode 3: Coherent Crystallite Domain & Bragg Interference Schematic (D = N * d_hkl) */}
          {graphicMode === 'domain' && (() => {
            const selP = peaks[safeSelectedIdx] || peaks[0];
            const selM = reflectionMetrics.rows[safeSelectedIdx] || reflectionMetrics.rows[0];
            const dVal = selM?.dSpacing || 3.135;
            const sizeNm = selM?.sizeNm || 25.0;
            const planesN = selM?.planesN || Math.round((sizeNm * 10) / dVal);
            const thetaDeg = (selP?.twoTheta || 28.4) / 2;
            const visiblePlanes = Math.min(9, Math.max(4, Math.round(planesN / 12)));

            return (
              <div className="space-y-1.5">
                <svg viewBox="0 0 360 128" className="w-full h-32 bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-visible select-none">
                  {/* Left: Stacked Coherent Atomic Planes N * d_hkl */}
                  <g transform="translate(18, 16)">
                    <rect x="0" y="0" width="148" height="96" rx="8" fill="#09101f" stroke="#1e293b" strokeWidth="1" />
                    <text x="74" y="13" fill="#94a3b8" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      COHERENT DOMAIN D = N·d_hkl
                    </text>

                    {/* Render parallel atomic lattice planes */}
                    {Array.from({ length: visiblePlanes }).map((_, pIdx) => {
                      const y = 26 + (pIdx * 54) / Math.max(1, visiblePlanes - 1);
                      return (
                        <g key={pIdx}>
                          <line x1="22" y1={y} x2="112" y2={y} stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" opacity="0.75" />
                          {[28, 48, 68, 88, 106].map((ax, aIdx) => (
                            <circle key={aIdx} cx={ax} cy={y} r="2" fill="#38bdf8" />
                          ))}
                        </g>
                      );
                    })}

                    {/* Incident & Diffracted X-Ray Wave Beams */}
                    <line x1="8" y1="16" x2="68" y2="44" stroke="#f59e0b" strokeWidth="1.5" />
                    <line x1="68" y1="44" x2="128" y2="16" stroke="#10b981" strokeWidth="1.5" />
                    <text x="16" y="34" fill="#fbbf24" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      θ={thetaDeg.toFixed(1)}°
                    </text>

                    {/* Vertical Dimension Caliper for D_hkl */}
                    <line x1="126" y1="26" x2="126" y2="80" stroke="#f59e0b" strokeWidth="1.2" />
                    <line x1="122" y1="26" x2="130" y2="26" stroke="#f59e0b" strokeWidth="1.2" />
                    <line x1="122" y1="80" x2="130" y2="80" stroke="#f59e0b" strokeWidth="1.2" />
                    <text x="136" y="56" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle" transform="rotate(-90 136 56)">
                      N≈{planesN}
                    </text>

                    <text x="74" y="91" fill="#67e8f9" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      d = {dVal.toFixed(3)} Å · K = {(selM?.effectiveK ?? constantK).toFixed(3)}
                    </text>
                  </g>

                  {/* Right: Scherrer Inverse Relation Curve D(β) */}
                  <g transform="translate(180, 16)">
                    <rect x="0" y="0" width="162" height="96" rx="8" fill="#09101f" stroke="#1e293b" strokeWidth="1" />
                    <text x="81" y="13" fill="#94a3b8" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      SCHERRER LAW: D = Kλ / (β·cosθ)
                    </text>
                    {/* Hyperbolic Curve D vs Beta */}
                    <path
                      d="M 22 24 Q 36 74 142 82"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="1.6"
                    />
                    {/* Active operating point */}
                    <circle cx="64" cy="56" r="4" fill="#f59e0b" stroke="#fff" strokeWidth="1" />
                    <line x1="64" y1="56" x2="64" y2="84" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="2 2" />
                    <line x1="20" y1="56" x2="64" y2="56" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="2 2" />
                    <text x="72" y="52" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      D = {selM?.sizeNm ? `${selM.sizeNm.toFixed(1)} nm` : 'Limit'}
                    </text>
                    <text x="72" y="63" fill="#34d399" fontSize="7.2" fontFamily="monospace">
                      β_s = {selM?.betaCorrected ? `${selM.betaCorrected.toFixed(3)}°` : '—'}
                    </text>
                    <text x="81" y="91" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">
                      Peak {selP?.hkl ? `(${selP.hkl.join('')})` : `#${safeSelectedIdx + 1}`} @ 2θ={selP?.twoTheta.toFixed(2)}°
                    </text>
                  </g>
                </svg>
              </div>
            );
          })()}
        </div>
      )}

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

              <div className="grid grid-cols-3 gap-2.5 font-mono text-[10px] tabular-nums">
                <div>
                  <label className="text-slate-400 block mb-1">Target D (nm)</label>
                  <input
                    type="number"
                    min="2"
                    max="250"
                    step="1"
                    value={synthTargetSizeNm}
                    onChange={(e) => setSynthTargetSizeNm(parseFloat(e.target.value) || 25)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-300 font-bold tabular-nums focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-indigo-300 font-bold tabular-nums focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-emerald-300 font-bold tabular-nums focus:outline-none focus:border-emerald-500"
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

      {/* Zero-Horizontal-Scroll Responsive Reflection Cards */}
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence initial={false}>
          {peaks.map((p, idx) => {
            const m = reflectionMetrics.rows[idx];
            const isExcluded = !!p.excluded;
            const isSelected = idx === safeSelectedIdx;
            const dSpacingStr = m && m.dSpacing > 0 ? m.dSpacing.toFixed(3) : '—';
            const relWeightPct = Math.min(100, Math.round(((p.intensity ?? 100) / reflectionMetrics.maxIntensity) * 100));
            const physFractionPct = m?.betaCorrected && p.fwhmObs > 0
              ? Math.min(100, Math.max(5, Math.round((m.betaCorrected / p.fwhmObs) * 100)))
              : 0;

            return (
              <motion.div
                key={`peak-card-${idx}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: isExcluded ? 0.45 : 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                onClick={() => setSelectedPeakIdx(idx)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900/95 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                    : 'bg-slate-950/75 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Use Toggle + Index + Inline (hkl) + Live Calculated Badges + Delete */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap mb-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleExcludeRow(idx);
                      }}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${
                        isExcluded
                          ? 'bg-slate-900 border-slate-700 text-slate-500 hover:text-amber-400'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                      }`}
                      title={isExcluded ? 'Excluded from Mean Sizing (click to include)' : `Peak #${idx + 1} included (click to exclude)`}
                    >
                      {isExcluded ? <EyeOff className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    </button>

                    <span className="text-[10px] font-mono font-black text-slate-400 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 tabular-nums">
                      #{idx + 1}
                    </span>

                    {/* Inline Miller Indices (h k l) */}
                    <div className="flex items-center gap-0.5 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-800" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[9px] font-mono text-slate-500">(</span>
                      <input
                        type="number"
                        placeholder="h"
                        value={p.hkl ? p.hkl[0] : ''}
                        onChange={(e) => handleUpdateRow(idx, 'h', e.target.value)}
                        className="w-5 bg-transparent text-center text-indigo-300 font-mono text-[10px] font-bold tabular-nums focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="k"
                        value={p.hkl ? p.hkl[1] : ''}
                        onChange={(e) => handleUpdateRow(idx, 'k', e.target.value)}
                        className="w-5 bg-transparent text-center text-indigo-300 font-mono text-[10px] font-bold tabular-nums focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="l"
                        value={p.hkl ? p.hkl[2] : ''}
                        onChange={(e) => handleUpdateRow(idx, 'l', e.target.value)}
                        className="w-5 bg-transparent text-center text-indigo-300 font-mono text-[10px] font-bold tabular-nums focus:outline-none"
                      />
                      <span className="text-[9px] font-mono text-slate-500">)</span>
                    </div>
                  </div>

                  {/* Live Calculated Telemetry Pills: d-spacing, β_phys, and Size D_hkl */}
                  <div className="flex items-center gap-1.5 ml-auto font-mono tabular-nums">
                    <span className="text-[9.5px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                      d={dSpacingStr}Å
                    </span>
                    {m?.sizeNm ? (
                      <span className="text-[10px] font-black text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                        {m.sizeNm.toFixed(1)} nm
                      </span>
                    ) : (
                      <span
                        className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30 flex items-center gap-1"
                        title={m?.error || 'Observed width ≤ Instrumental width'}
                      >
                        <AlertCircle className="w-2.5 h-2.5" />
                        Limit
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRow(idx);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                      title="Delete reflection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: 3 Clean Numeric Inputs (2Theta, FWHM_obs, Relative Intensity) */}
                <div className="grid grid-cols-3 gap-2 font-mono tabular-nums" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-slate-950/90 px-2 py-1 rounded-lg border border-slate-800/90 focus-within:border-indigo-500/60">
                    <span className="text-[8.5px] font-sans font-bold uppercase tracking-wider text-slate-500 block">
                      2θ Angle (°)
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      value={p.twoTheta || ''}
                      onChange={(e) => handleUpdateRow(idx, 'twoTheta', e.target.value)}
                      className="w-full bg-transparent text-indigo-300 font-mono text-[11px] font-bold tabular-nums focus:outline-none"
                    />
                  </div>

                  <div className={`bg-slate-950/90 px-2 py-1 rounded-lg border ${
                    m?.error ? 'border-rose-500/50' : 'border-slate-800/90 focus-within:border-amber-500/60'
                  }`}>
                    <span className="text-[8.5px] font-sans font-bold uppercase tracking-wider text-slate-500 block">
                      FWHM β_obs (°)
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      value={p.fwhmObs || ''}
                      onChange={(e) => handleUpdateRow(idx, 'fwhmObs', e.target.value)}
                      className={`w-full bg-transparent font-mono text-[11px] font-bold tabular-nums focus:outline-none ${
                        m?.error ? 'text-rose-300' : 'text-amber-300'
                      }`}
                    />
                  </div>

                  <div className="bg-slate-950/90 px-2 py-1 rounded-lg border border-slate-800/90 focus-within:border-emerald-500/60">
                    <span className="text-[8.5px] font-sans font-bold uppercase tracking-wider text-slate-500 block">
                      Intensity (%)
                    </span>
                    <input
                      type="number"
                      step="1"
                      value={p.intensity ?? 100}
                      onChange={(e) => handleUpdateRow(idx, 'intensity', e.target.value)}
                      className="w-full bg-transparent text-emerald-300 font-mono text-[11px] font-bold tabular-nums focus:outline-none"
                    />
                  </div>
                </div>

                {/* Micro Telemetry Bar: Physical Broadening Share & Intensity Weight */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-950 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500/80 transition-all duration-300"
                      style={{ width: `${physFractionPct}%` }}
                      title={`Physical Sample Broadening Share: ${physFractionPct}%`}
                    />
                    <div
                      className="h-full bg-amber-500/40 transition-all duration-300"
                      style={{ width: `${Math.max(0, 100 - physFractionPct)}%` }}
                      title="Instrumental Resolution Share"
                    />
                  </div>
                  <span className="text-[8.5px] font-mono tabular-nums text-slate-500 shrink-0">
                    β_phys: {m?.betaCorrected ? `${m.betaCorrected.toFixed(3)}°` : '—'} · I={relWeightPct}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {peaks.length === 0 && (
          <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800/80">
            No reflection peaks entered yet. Use the quick-add bar below or click Synthesize.
          </div>
        )}
      </div>

      {/* Quick Add Reflection Bar */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-amber-400" /> Append Reflection Peak
          </span>
          <span className="text-[9px] font-mono text-slate-500">2θ, FWHM, I% & optional (hkl)</span>
        </div>
        <div className="grid grid-cols-3 gap-2 font-mono tabular-nums">
          <input
            type="number"
            placeholder="2θ [°]"
            step="0.001"
            value={newTwoTheta}
            onChange={(e) => setNewTwoTheta(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-mono font-bold tabular-nums placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            placeholder="FWHM [°]"
            step="0.001"
            value={newFwhm}
            onChange={(e) => setNewFwhm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold tabular-nums placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
          />
          <input
            type="number"
            placeholder="I [%]"
            value={newIntensity}
            onChange={(e) => setNewIntensity(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-bold tabular-nums placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-slate-500 mr-1">(hkl):</span>
            <input
              type="number"
              placeholder="h"
              value={newH}
              onChange={(e) => setNewH(e.target.value)}
              className="w-9 bg-slate-950 border border-slate-700/60 rounded-lg px-1 py-1 text-xs text-center text-slate-300 font-mono font-bold tabular-nums placeholder:text-slate-600"
            />
            <input
              type="number"
              placeholder="k"
              value={newK}
              onChange={(e) => setNewK(e.target.value)}
              className="w-9 bg-slate-950 border border-slate-700/60 rounded-lg px-1 py-1 text-xs text-center text-slate-300 font-mono font-bold tabular-nums placeholder:text-slate-600"
            />
            <input
              type="number"
              placeholder="l"
              value={newL}
              onChange={(e) => setNewL(e.target.value)}
              className="w-9 bg-slate-950 border border-slate-700/60 rounded-lg px-1 py-1 text-xs text-center text-slate-300 font-mono font-bold tabular-nums placeholder:text-slate-600"
            />
          </div>
          <button
            type="button"
            onClick={handleAddPeak}
            disabled={!newTwoTheta || !newFwhm}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Peak
          </button>
        </div>
      </div>
    </div>
  );
};
