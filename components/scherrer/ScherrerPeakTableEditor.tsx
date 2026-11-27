import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, ArrowUpDown, Percent, Check, AlertCircle, 
  Sparkles, Wand2, EyeOff, Copy, RotateCcw, Compass, Sliders,
  Table, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScherrerInput } from '../../types';
import { suggestHKLPlanesAlgorithmic, calculateScherrer, parseScherrerInput } from '../../utils/physics';
import { ScherrerReflectionGraphic } from './ScherrerReflectionGraphic';

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
  const [viewMode, setViewMode] = useState<'cards' | 'raw'>('cards');
  const [rawText, setRawText] = useState<string>('');

  const [newTwoTheta, setNewTwoTheta] = useState<string>('');
  const [newFwhm, setNewFwhm] = useState<string>('');
  const [newIntensity, setNewIntensity] = useState<string>('100');
  const [newH, setNewH] = useState<string>('');
  const [newK, setNewK] = useState<string>('');
  const [newL, setNewL] = useState<string>('');

  // Selected reflection index (synced between ScherrerReflectionGraphic and Peak Table)
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);

  // Indexing & Synthesis tools state
  const [crystalSystem, setCrystalSystem] = useState<'Diamond' | 'FCC' | 'BCC' | 'SC' | 'Hexagonal'>('Diamond');
  const [showSynthesizer, setShowSynthesizer] = useState<boolean>(false);
  const [synthTargetSizeNm, setSynthTargetSizeNm] = useState<number>(28);
  const [synthStrainPct, setSynthStrainPct] = useState<number>(0.04);
  const [synthLatticeA, setSynthLatticeA] = useState<number>(5.431);
  const [copiedTable, setCopiedTable] = useState<boolean>(false);
  const [indexingMessage, setIndexingMessage] = useState<string | null>(null);

  // Serialize peaks to CSV text when switching to raw view
  const serializePeaksToCSV = (list: ScherrerInput[]) => {
    return list
      .map(p => {
        const prefix = p.excluded ? '! ' : '';
        const hklPart = p.hkl ? `, ${p.hkl[0]}, ${p.hkl[1]}, ${p.hkl[2]}` : '';
        return `${prefix}${p.twoTheta.toFixed(3)}, ${p.fwhmObs.toFixed(4)}, ${p.intensity ?? 100}${hklPart}`;
      })
      .join('\n');
  };

  const handleSwitchViewMode = (mode: 'cards' | 'raw') => {
    if (mode === 'raw') {
      setRawText(serializePeaksToCSV(peaks));
    }
    setViewMode(mode);
  };

  const handleRawTextChange = (val: string) => {
    setRawText(val);
    const parsed = parseScherrerInput(val);
    if (parsed.length > 0) {
      onChange(parsed);
    }
  };

  // Compute live per-peak metrics & summary stats for Total Reflections
  const reflectionMetrics = useMemo(() => {
    let activeCount = 0;
    let excludedCount = 0;
    let resolvedCount = 0;
    let unresolvedCount = 0;
    const latticeEstimates: number[] = [];
    const validSizes: number[] = [];

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
        if (isResolved && calc) {
          resolvedCount++;
          validSizes.push(calc.sizeNm);
        } else {
          unresolvedCount++;
        }
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

    const meanSizeNm = validSizes.length > 0
      ? validSizes.reduce((a, b) => a + b, 0) / validSizes.length
      : null;

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
      stdA,
      meanSizeNm
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
    if (viewMode === 'raw') setRawText(serializePeaksToCSV(sorted));
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
    if (viewMode === 'raw') setRawText(serializePeaksToCSV(normalized));
  };

  const handleIncludeAll = () => {
    const updated = peaks.map(p => ({ ...p, excluded: false }));
    onChange(updated);
    if (viewMode === 'raw') setRawText(serializePeaksToCSV(updated));
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
      if (viewMode === 'raw') setRawText(serializePeaksToCSV(updated));
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
        fwhmObs: parseFloat(fwhmObs.toFixed(4)),
        intensity: pl.relInt,
        hkl: pl.hkl,
        excluded: false
      });
    }

    if (synthesized.length > 0) {
      onChange(synthesized);
      if (viewMode === 'raw') setRawText(serializePeaksToCSV(synthesized));
      setShowSynthesizer(false);
    }
  };

  const handleCopyCSV = () => {
    const text = serializePeaksToCSV(peaks);
    navigator.clipboard.writeText(text);
    setCopiedTable(true);
    setTimeout(() => setCopiedTable(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Top Reflections Data Metrology Console */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              <span>Reflections Data (2θ, FWHM, I%, hkl)</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-300 tabular-nums">{reflectionMetrics.activeCount}/{reflectionMetrics.total} Active</span>
              {reflectionMetrics.excludedCount > 0 && (
                <>
                  <span className="text-slate-700">·</span>
                  <span className="text-amber-400 tabular-nums">{reflectionMetrics.excludedCount} Excluded</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono tabular-nums text-slate-400 mt-0.5 flex-wrap">
              <span>
                2θ Span: <strong className="text-slate-200">{reflectionMetrics.min2T.toFixed(1)}°–{reflectionMetrics.max2T.toFixed(1)}°</strong>
              </span>
              <span className="text-slate-700">·</span>
              <span>
                Resolved: <strong className={reflectionMetrics.unresolvedCount > 0 ? 'text-amber-300' : 'text-emerald-400'}>
                  {reflectionMetrics.resolvedCount}/{reflectionMetrics.activeCount}
                </strong>
              </span>
              {reflectionMetrics.meanA && (
                <>
                  <span className="text-slate-700">·</span>
                  <span className="text-cyan-300 flex items-center gap-1">
                    <Compass className="w-2.5 h-2.5 text-cyan-400" />
                    <span>a₀ = <strong>{reflectionMetrics.meanA.toFixed(4)} Å</strong></span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Segmented View Switcher: Cards vs Raw CSV */}
          <div className="flex items-center gap-1 bg-[#070A12] p-0.5 rounded-lg border border-slate-800 text-[9px] font-mono font-bold">
            <button
              type="button"
              onClick={() => handleSwitchViewMode('cards')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'cards'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3 h-3" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchViewMode('raw')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'raw'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Raw CSV</span>
            </button>
          </div>
        </div>

        {/* Action & Symmetry Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1">
            {reflectionMetrics.excludedCount > 0 && (
              <button
                type="button"
                onClick={handleIncludeAll}
                className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
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
              className="px-2 py-1 bg-[#070A12] hover:bg-slate-900 disabled:opacity-40 text-slate-300 border border-slate-800 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Sort reflections in ascending 2θ order"
            >
              <ArrowUpDown className="w-2.5 h-2.5 text-cyan-400" />
              Sort 2θ
            </button>
            <button
              type="button"
              onClick={handleNormalizeIntensities}
              disabled={peaks.length === 0}
              className="px-2 py-1 bg-[#070A12] hover:bg-slate-900 disabled:opacity-40 text-slate-300 border border-slate-800 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Normalize reflection intensities to 100% max"
            >
              <Percent className="w-2.5 h-2.5 text-emerald-400" />
              Norm I%
            </button>
            <button
              type="button"
              onClick={() => setShowSynthesizer(!showSynthesizer)}
              className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                showSynthesizer
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-[#070A12] hover:bg-slate-900 text-amber-300 border-slate-800'
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
              className="px-2 py-1 bg-[#070A12] hover:bg-slate-900 disabled:opacity-40 text-slate-300 border border-slate-800 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Copy reflections as CSV"
            >
              {copiedTable ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
              {copiedTable ? 'Copied' : 'CSV'}
            </button>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {(['Diamond', 'FCC', 'BCC', 'SC', 'Hexagonal'] as const).map(sys => (
              <button
                key={sys}
                type="button"
                onClick={() => setCrystalSystem(sys)}
                className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  crystalSystem === sys
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-[#070A12] text-slate-500 hover:text-slate-300 border border-slate-800'
                }`}
              >
                {sys}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAutoIndexHkl}
              disabled={peaks.length === 0}
              className="px-2 py-0.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 rounded text-[8.5px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Automatically index (hkl) planes based on 2θ sin²θ ratios"
            >
              <Wand2 className="w-2.5 h-2.5 text-cyan-400" />
              Index (hkl)
            </button>
          </div>
        </div>

        {indexingMessage && (
          <div className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>{indexingMessage}</span>
          </div>
        )}
      </div>

      {/* Interactive 3-Mode Scherrer Reflection Graphic (Calibrated CAD & Scientific Metrology) */}
      {peaks.length > 0 && (
        <ScherrerReflectionGraphic
          peaks={peaks}
          reflectionMetrics={reflectionMetrics}
          selectedPeakIdx={safeSelectedIdx}
          onSelectPeakIdx={setSelectedPeakIdx}
          wavelength={wavelength}
          constantK={constantK}
          instFwhm={instFwhm}
          useCaglioti={useCaglioti}
          caglioti={caglioti}
          broadeningModel={broadeningModel}
          pseudoVoigtEta={pseudoVoigtEta}
          breadthType={breadthType}
          kAlpha2Correction={kAlpha2Correction}
          zeroShiftDeg={zeroShiftDeg}
        />
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
            <div className="bg-[#0B0F19] border border-amber-500/40 rounded-xl p-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Forward Diffraction Broadening Synthesizer ({crystalSystem})
                </span>
                <span className="text-[9px] font-mono text-slate-400">Generates 2θ, FWHM &amp; (hkl)</span>
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
                    className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-2 py-1.5 text-amber-300 font-bold tabular-nums focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-2 py-1.5 text-cyan-300 font-bold tabular-nums focus:outline-none focus:border-cyan-500"
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
                    className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-2 py-1.5 text-emerald-300 font-bold tabular-nums focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSynthesizeReflections}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-mono font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer"
              >
                Synthesize Multi-Peak Reflection Table
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Reflections Data View: Structured Metrology Cards vs Raw CSV Matrix */}
      {viewMode === 'cards' ? (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
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
                      ? 'bg-[#0B0F19] border-cyan-500/60 shadow-sm'
                      : 'bg-[#070A12] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Row: Use Toggle + Unboxed Telemetry Metadata + Delete */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2 pb-1.5 border-b border-slate-800/80 font-mono tabular-nums text-[10px]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExcludeRow(idx);
                        }}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer border ${
                          isExcluded
                            ? 'bg-[#070A12] border-slate-700 text-slate-500 hover:text-amber-400'
                            : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                        }`}
                        title={isExcluded ? 'Excluded from Mean Sizing (click to include)' : `Peak #${idx + 1} included (click to exclude)`}
                      >
                        {isExcluded ? <EyeOff className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                      </button>

                      <span className="font-bold text-slate-300">#{idx + 1}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-cyan-400 font-bold">
                        {p.hkl ? `(${p.hkl.join('')})` : 'Unindexed'}
                      </span>
                      <span className="text-slate-700">·</span>
                      <span className="text-slate-400">
                        d = <strong className="text-slate-200">{dSpacingStr} Å</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      {m?.sizeNm ? (
                        <span className="font-bold text-amber-300">
                          D = {m.sizeNm.toFixed(1)} nm <span className="text-slate-500 text-[9px]">(N≈{m.planesN})</span>
                        </span>
                      ) : (
                        <span
                          className="font-bold text-rose-400 flex items-center gap-1 text-[9px]"
                          title={m?.error || 'Observed width ≤ Instrumental width'}
                        >
                          <AlertCircle className="w-2.5 h-2.5" />
                          Resolution Limit
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(idx);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: 4 Clean Numeric Inputs (2Theta, FWHM_obs, Intensity %, Miller hkl) */}
                  <div className="grid grid-cols-12 gap-1.5 font-mono tabular-nums" onClick={(e) => e.stopPropagation()}>
                    <div className="col-span-3 bg-[#070A12] px-2 py-1 rounded-lg border border-slate-800 focus-within:border-cyan-500/60">
                      <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-slate-500 block">
                        2θ (°)
                      </span>
                      <input
                        type="number"
                        step="0.001"
                        value={p.twoTheta || ''}
                        onChange={(e) => handleUpdateRow(idx, 'twoTheta', e.target.value)}
                        className="w-full bg-transparent text-cyan-300 font-mono text-[11px] font-bold tabular-nums focus:outline-none"
                      />
                    </div>

                    <div className={`col-span-3 bg-[#070A12] px-2 py-1 rounded-lg border ${
                      m?.error ? 'border-rose-500/50' : 'border-slate-800 focus-within:border-amber-500/60'
                    }`}>
                      <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-slate-500 block">
                        FWHM β (°)
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

                    <div className="col-span-2 bg-[#070A12] px-2 py-1 rounded-lg border border-slate-800 focus-within:border-emerald-500/60">
                      <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-slate-500 block">
                        I (%)
                      </span>
                      <input
                        type="number"
                        step="1"
                        value={p.intensity ?? 100}
                        onChange={(e) => handleUpdateRow(idx, 'intensity', e.target.value)}
                        className="w-full bg-transparent text-emerald-300 font-mono text-[11px] font-bold tabular-nums focus:outline-none"
                      />
                    </div>

                    <div className="col-span-4 bg-[#070A12] px-1.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-slate-500 block text-center">
                        Miller (h k l)
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {(['h', 'k', 'l'] as const).map((axis, aIdx) => (
                          <input
                            key={axis}
                            type="number"
                            placeholder={axis}
                            value={p.hkl ? p.hkl[aIdx] : ''}
                            onChange={(e) => handleUpdateRow(idx, axis, e.target.value)}
                            className="w-full bg-slate-900/80 text-center text-slate-200 font-mono text-[10px] font-bold tabular-nums rounded border border-slate-800/80 focus:border-cyan-500 focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Micro Telemetry Bar: Physical Broadening Share vs Instrumental */}
                  <div className="mt-2 flex items-center gap-2 text-[8.5px] font-mono tabular-nums text-slate-400">
                    <span>β_phys: <strong className="text-cyan-300">{m?.betaCorrected ? `${m.betaCorrected.toFixed(3)}°` : '—'}</strong> ({physFractionPct}%)</span>
                    <div className="flex-1 h-1.5 bg-[#070A12] rounded-full overflow-hidden flex border border-slate-800/80">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-300"
                        style={{ width: `${physFractionPct}%` }}
                      />
                      <div
                        className="h-full bg-amber-500/50 transition-all duration-300"
                        style={{ width: `${Math.max(0, 100 - physFractionPct)}%` }}
                      />
                    </div>
                    <span>β_inst: <strong className="text-amber-300">{m?.curInstFwhm.toFixed(3)}°</strong> · I={relWeightPct}%</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {peaks.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs font-mono bg-[#070A12] rounded-xl border border-slate-800">
              No reflection peaks entered yet. Use the quick-add bar below or click Synthesize.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>Format: <strong className="text-cyan-300">2θ, FWHM, Intensity [, h, k, l]</strong> (Prefix <code className="text-amber-300">!</code> to exclude)</span>
            <button
              type="button"
              onClick={() => setRawText(serializePeaksToCSV(peaks))}
              className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
            >
              Format Columns
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => handleRawTextChange(e.target.value)}
            className="w-full h-44 px-3 py-2.5 bg-[#070A12] text-cyan-300 border border-slate-800 focus:border-cyan-500/60 rounded-lg outline-none font-mono tabular-nums text-xs leading-relaxed custom-scrollbar"
            placeholder="28.443, 0.240, 100, 1, 1, 1"
            spellCheck="false"
          />
        </div>
      )}

      {/* Quick Add Reflection Bar */}
      <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-cyan-400" /> Append Reflection Peak
          </span>
          <span className="text-[9px] font-mono text-slate-500">2θ, FWHM, I% &amp; optional (hkl)</span>
        </div>
        <div className="grid grid-cols-3 gap-2 font-mono tabular-nums">
          <input
            type="number"
            placeholder="2θ [°]"
            step="0.001"
            value={newTwoTheta}
            onChange={(e) => setNewTwoTheta(e.target.value)}
            className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono font-bold tabular-nums placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="number"
            placeholder="FWHM [°]"
            step="0.001"
            value={newFwhm}
            onChange={(e) => setNewFwhm(e.target.value)}
            className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold tabular-nums placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
          />
          <input
            type="number"
            placeholder="I [%]"
            value={newIntensity}
            onChange={(e) => setNewIntensity(e.target.value)}
            className="w-full bg-[#070A12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-bold tabular-nums placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
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
              className="w-9 bg-[#070A12] border border-slate-800 rounded-lg px-1 py-1 text-xs text-center text-slate-200 font-mono font-bold tabular-nums placeholder:text-slate-600"
            />
            <input
              type="number"
              placeholder="k"
              value={newK}
              onChange={(e) => setNewK(e.target.value)}
              className="w-9 bg-[#070A12] border border-slate-800 rounded-lg px-1 py-1 text-xs text-center text-slate-200 font-mono font-bold tabular-nums placeholder:text-slate-600"
            />
            <input
              type="number"
              placeholder="l"
              value={newL}
              onChange={(e) => setNewL(e.target.value)}
              className="w-9 bg-[#070A12] border border-slate-800 rounded-lg px-1 py-1 text-xs text-center text-slate-200 font-mono font-bold tabular-nums placeholder:text-slate-600"
            />
          </div>
          <button
            type="button"
            onClick={handleAddPeak}
            disabled={!newTwoTheta || !newFwhm}
            className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-300 border border-cyan-500/50 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Peak
          </button>
        </div>
      </div>
    </div>
  );
};
