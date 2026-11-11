import React, { useState, useMemo, useId } from 'react';
import { 
  Plus, Trash2, ArrowUpDown, Percent, Check, AlertCircle, 
  Sparkles, Wand2, EyeOff, Copy, RotateCcw, Compass, Sliders,
  BarChart2, Layers, Minimize2, Table, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScherrerInput } from '../../types';
import { suggestHKLPlanesAlgorithmic, calculateScherrer, parseScherrerInput } from '../../utils/physics';

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
  const uid = useId().replace(/:/g, '');
  const [viewMode, setViewMode] = useState<'cards' | 'raw'>('cards');
  const [rawText, setRawText] = useState<string>('');

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
        <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200">
                Scherrer Reflection Graphic
              </span>
              <span className="text-slate-700">·</span>
              <span className="text-[9px] font-mono text-amber-400 tabular-nums">
                λ = {wavelength.toFixed(4)} Å
              </span>
            </div>

            <div className="flex bg-[#0B0F19] p-0.5 rounded-lg border border-slate-800 text-[9px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setGraphicMode('spectrum')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  graphicMode === 'spectrum'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-2.5 h-2.5" />
                XRD Pattern &amp; FWHM
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode('deconv')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  graphicMode === 'deconv'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-2.5 h-2.5" />
                β Deconv &amp; Caglioti
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode('domain')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  graphicMode === 'domain'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Minimize2 className="w-2.5 h-2.5" />
                Bragg N·d &amp; D(β)
              </button>
            </div>
          </div>

          {/* Mode 1: Calibrated Multi-Peak Pseudo-Voigt XRD Diffractogram + Active Peak Caliper Inset */}
          {graphicMode === 'spectrum' && (() => {
            const svgW = 460;
            const svgH = 148;
            const padL = 28;
            const padR = 146; // Right 136px dedicated to Active Peak FWHM/Profile Inspector
            const padT = 18;
            const padB = 24;
            const plotW = svgW - padL - padR;
            const plotH = svgH - padT - padB;
            const baseY = padT + plotH;

            const minAngle = Math.max(5, Math.floor((reflectionMetrics.min2T || 20) - 6));
            const maxAngle = Math.min(165, Math.ceil((reflectionMetrics.max2T || 80) + 6));
            const spanAngle = Math.max(10, maxAngle - minAngle);

            const xOf = (tt: number) => padL + ((tt - minAngle) / spanAngle) * plotW;
            const yOf = (relI: number) => baseY - (Math.min(100, Math.max(0, relI)) / 100) * plotH;

            // Sample continuous Pseudo-Voigt diffractogram across plotW
            const numPts = 160;
            const curvePts: string[] = [];
            const areaPts: string[] = [`${padL},${baseY}`];
            for (let i = 0; i <= numPts; i++) {
              const tt = minAngle + (i / numPts) * spanAngle;
              let ySum = 0;
              peaks.forEach((p) => {
                if (p.excluded) return;
                const relI = ((p.intensity ?? 100) / reflectionMetrics.maxIntensity) * 100;
                const visHwhm = Math.max(0.35, p.fwhmObs * 1.35);
                const dx = (tt - p.twoTheta) / visHwhm;
                if (Math.abs(dx) < 6) {
                  const g = Math.exp(-Math.LN2 * dx * dx);
                  const l = 1 / (1 + dx * dx);
                  ySum += relI * ((1 - pseudoVoigtEta) * g + pseudoVoigtEta * l);
                }
              });
              const px = padL + (i / numPts) * plotW;
              const py = yOf(Math.min(100, ySum));
              curvePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              areaPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
            }
            areaPts.push(`${padL + plotW},${baseY}`);

            const selP = peaks[safeSelectedIdx] || peaks[0];
            const selM = reflectionMetrics.rows[safeSelectedIdx] || reflectionMetrics.rows[0];

            // Build Active Peak Inset Profile (Observed vs Physical vs Instrumental)
            const insetX = padL + plotW + 10;
            const insetW = 130;
            const insetCx = insetX + insetW / 2;
            const insetBaseY = baseY - 16;
            const insetPeakH = plotH - 22;

            const obsPts: string[] = [];
            const physPts: string[] = [];
            const instPts: string[] = [];
            const bObs = Math.max(0.05, selP?.fwhmObs || 0.25);
            const bPhys = Math.max(0.01, selM?.betaCorrected || bObs * 0.6);
            const bInst = Math.max(0.01, selM?.curInstFwhm || 0.1);

            for (let i = 0; i <= 48; i++) {
              const u = (i / 48) - 0.5; // -0.5 to 0.5
              const px = insetX + 6 + (i / 48) * (insetW - 12);
              const xDeg = u * bObs * 3.0;

              const evalPV = (w: number, amp: number) => {
                const d = xDeg / (w / 2);
                return amp * ((1 - pseudoVoigtEta) * Math.exp(-Math.LN2 * d * d) + pseudoVoigtEta / (1 + d * d));
              };
              obsPts.push(`${px.toFixed(1)},${(insetBaseY - evalPV(bObs, 1.0) * insetPeakH).toFixed(1)}`);
              physPts.push(`${px.toFixed(1)},${(insetBaseY - evalPV(bPhys, 0.86) * insetPeakH).toFixed(1)}`);
              instPts.push(`${px.toFixed(1)},${(insetBaseY - evalPV(bInst, 0.68) * insetPeakH).toFixed(1)}`);
            }

            const fwhmPxHalf = ((insetW - 12) / 6.0);

            return (
              <div className="space-y-1.5">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-36 bg-[#0B0F19] rounded-lg border border-slate-800/90 overflow-visible select-none">
                  <defs>
                    <linearGradient id={`schSpecFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Reference Grid */}
                  {[0.25, 0.5, 0.75, 1].map((g, i) => {
                    const gy = padT + plotH * (1 - g);
                    return (
                      <g key={i}>
                        <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#1e293b" strokeWidth="0.7" strokeDasharray="2 2" />
                        <text x={padL - 4} y={gy + 2.5} textAnchor="end" fill="#475569" fontSize="6.5" fontFamily="monospace">
                          {Math.round(g * 100)}
                        </text>
                      </g>
                    );
                  })}

                  <line x1={padL} y1={baseY} x2={padL + plotW} y2={baseY} stroke="#334155" strokeWidth="1" />

                  {/* 2Theta Ticks */}
                  {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                    const tx = padL + t * plotW;
                    const deg = minAngle + t * spanAngle;
                    return (
                      <g key={i}>
                        <line x1={tx} y1={baseY} x2={tx} y2={baseY + 4} stroke="#475569" strokeWidth="0.8" />
                        <text x={tx} y={svgH - 7} fill="#64748b" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                          {deg.toFixed(0)}°
                        </text>
                      </g>
                    );
                  })}

                  {/* Continuous Pseudo-Voigt Envelope */}
                  <polygon points={areaPts.join(' ')} fill={`url(#schSpecFill-${uid})`} />
                  <polyline fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.75" points={curvePts.join(' ')} />

                  {/* Individual Reflection Sticks & Interactive Markers */}
                  {peaks.map((p, idx) => {
                    const m = reflectionMetrics.rows[idx];
                    const isSel = idx === safeSelectedIdx;
                    const isExcl = !!p.excluded;
                    const xPos = xOf(p.twoTheta);
                    const relI = Math.max(8, ((p.intensity ?? 100) / reflectionMetrics.maxIntensity) * 100);
                    const topY = yOf(relI);
                    const hklText = p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`;

                    return (
                      <g
                        key={idx}
                        onClick={() => setSelectedPeakIdx(idx)}
                        className="cursor-pointer"
                        opacity={isExcl ? 0.3 : 1}
                      >
                        {isSel && (
                          <line x1={xPos} y1={padT} x2={xPos} y2={baseY} stroke="#f59e0b" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.6" />
                        )}
                        <line
                          x1={xPos}
                          y1={baseY}
                          x2={xPos}
                          y2={topY}
                          stroke={m?.error ? '#f43f5e' : isSel ? '#f59e0b' : '#38bdf8'}
                          strokeWidth={isSel ? '2.2' : '1.4'}
                        />
                        <circle
                          cx={xPos}
                          cy={topY}
                          r={isSel ? '3.2' : '2.1'}
                          fill={m?.error ? '#f43f5e' : isSel ? '#f59e0b' : '#38bdf8'}
                          stroke="#070A12"
                          strokeWidth="0.9"
                        />
                        <text
                          x={xPos}
                          y={Math.max(11, topY - 5)}
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

                  {/* Right Inset: Selected Reflection Profile & FWHM Caliper */}
                  <g>
                    <rect x={insetX} y={padT - 4} width={insetW} height={plotH + 8} rx="6" fill="#070A12" stroke="#1e293b" strokeWidth="1" />
                    <text x={insetCx} y={padT + 7} textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      {selP?.hkl ? `(${selP.hkl.join('')})` : `PEAK #${safeSelectedIdx + 1}`} PROFILE CALIPER
                    </text>
                    <line x1={insetX + 6} y1={insetBaseY} x2={insetX + insetW - 6} y2={insetBaseY} stroke="#334155" strokeWidth="0.8" />
                    <polyline fill="none" stroke="#38bdf8" strokeWidth="1.5" points={obsPts.join(' ')} />
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="2.5 1.5" points={physPts.join(' ')} />
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="1.1" strokeDasharray="1.5 1.5" points={instPts.join(' ')} />

                    {/* Half-Maximum Caliper Line */}
                    <line
                      x1={insetCx - fwhmPxHalf}
                      y1={insetBaseY - insetPeakH * 0.5}
                      x2={insetCx + fwhmPxHalf}
                      y2={insetBaseY - insetPeakH * 0.5}
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />
                    <circle cx={insetCx - fwhmPxHalf} cy={insetBaseY - insetPeakH * 0.5} r="1.6" fill="#38bdf8" />
                    <circle cx={insetCx + fwhmPxHalf} cy={insetBaseY - insetPeakH * 0.5} r="1.6" fill="#38bdf8" />

                    <text x={insetCx} y={baseY - 4} textAnchor="middle" fill="#e2e8f0" fontSize="6.8" fontFamily="monospace" fontWeight="bold">
                      β_obs={bObs.toFixed(3)}° · β_s={bPhys.toFixed(3)}°
                    </text>
                  </g>
                </svg>

                {/* Selected Peak Telemetry Bar */}
                {selP && (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 bg-[#0B0F19] rounded-lg border border-slate-800 text-[9.5px] font-mono tabular-nums">
                    <span className="text-cyan-300 font-bold">
                      {selP.hkl ? `(${selP.hkl.join('')})` : `Peak #${safeSelectedIdx + 1}`} @ 2θ = {selP.twoTheta.toFixed(3)}° · d = {selM?.dSpacing.toFixed(4)} Å
                    </span>
                    <span className="text-slate-400">
                      β_obs: <strong className="text-slate-200">{selP.fwhmObs.toFixed(3)}°</strong> · β_inst: <strong className="text-amber-300">{selM?.curInstFwhm.toFixed(3)}°</strong> · β_phys: <strong className="text-emerald-300">{selM?.betaCorrected ? `${selM.betaCorrected.toFixed(3)}°` : 'Limit'}</strong>
                    </span>
                    <span className="text-amber-300 font-bold">
                      D_hkl = {selM?.sizeNm ? `${selM.sizeNm.toFixed(2)} nm` : 'Unresolved'}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Mode 2: Stacked Broadening Deconvolution + Continuous Caglioti Curve & D_hkl Locus */}
          {graphicMode === 'deconv' && (() => {
            const svgW = 460;
            const svgH = 148;
            const padL = 36;
            const padR = 38;
            const padT = 20;
            const padB = 26;
            const plotW = svgW - padL - padR;
            const plotH = svgH - padT - padB;
            const baseY = padT + plotH;

            const maxB = Math.max(0.18, reflectionMetrics.maxObsFwhm * 1.15);
            const maxD = Math.max(30, ...reflectionMetrics.rows.map(r => r.sizeNm || 0)) * 1.15;
            const count = Math.max(1, peaks.length);
            const slotW = plotW / count;
            const barW = Math.min(28, Math.max(10, slotW * 0.52));

            const dLocusPts: string[] = [];
            const instLocusPts: string[] = [];

            peaks.forEach((_, idx) => {
              const m = reflectionMetrics.rows[idx];
              const cx = padL + (idx + 0.5) * slotW;
              const instY = baseY - ((m?.curInstFwhm || 0) / maxB) * plotH;
              instLocusPts.push(`${cx.toFixed(1)},${instY.toFixed(1)}`);
              if (m?.sizeNm && m.sizeNm > 0) {
                const dY = baseY - (m.sizeNm / maxD) * plotH;
                dLocusPts.push(`${cx.toFixed(1)},${dY.toFixed(1)}`);
              }
            });

            return (
              <div className="space-y-1.5">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-36 bg-[#0B0F19] rounded-lg border border-slate-800/90 overflow-visible select-none">
                  {/* Horizontal Grid & Left/Right Axes */}
                  {[0.25, 0.5, 0.75, 1].map((g, i) => {
                    const gy = padT + plotH * (1 - g);
                    return (
                      <g key={i}>
                        <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#1e293b" strokeWidth="0.7" strokeDasharray="2 2" />
                        <text x={padL - 4} y={gy + 2.5} textAnchor="end" fill="#38bdf8" fontSize="6.5" fontFamily="monospace">
                          {(maxB * g).toFixed(2)}°
                        </text>
                        <text x={padL + plotW + 4} y={gy + 2.5} textAnchor="start" fill="#10b981" fontSize="6.5" fontFamily="monospace">
                          {(maxD * g).toFixed(0)}nm
                        </text>
                      </g>
                    );
                  })}
                  <line x1={padL} y1={baseY} x2={padL + plotW} y2={baseY} stroke="#334155" strokeWidth="1" />

                  {peaks.map((p, idx) => {
                    const m = reflectionMetrics.rows[idx];
                    const isSel = idx === safeSelectedIdx;
                    const cx = padL + (idx + 0.5) * slotW;
                    const totalH = Math.min(plotH, (p.fwhmObs / maxB) * plotH);
                    const instH = Math.min(totalH, ((m?.curInstFwhm || 0) / maxB) * plotH);
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
                          y={baseY - instH}
                          width={barW}
                          height={Math.max(1.5, instH)}
                          rx="1.5"
                          fill="#f59e0b"
                          fillOpacity="0.65"
                          stroke="#f59e0b"
                          strokeWidth={isSel ? '1.1' : '0.5'}
                        />
                        {/* Physical Size Broadening Segment */}
                        {physH > 0 && (
                          <rect
                            x={cx - barW / 2}
                            y={baseY - instH - physH}
                            width={barW}
                            height={physH}
                            rx="1.5"
                            fill="#38bdf8"
                            fillOpacity={isSel ? '0.85' : '0.6'}
                            stroke={isSel ? '#e0f2fe' : '#38bdf8'}
                            strokeWidth={isSel ? '1.2' : '0.6'}
                          />
                        )}
                        {/* Top D_hkl readout */}
                        <text
                          x={cx}
                          y={Math.max(11, baseY - totalH - 4)}
                          fill={m?.sizeNm ? '#6ee7b7' : '#fb7185'}
                          fontSize="7"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {m?.sizeNm ? `${m.sizeNm.toFixed(1)}nm` : 'Lim'}
                        </text>
                        {/* Bottom hkl & 2theta label */}
                        <text
                          x={cx}
                          y={svgH - 12}
                          fill={isSel ? '#fbbf24' : '#cbd5e1'}
                          fontSize="7.2"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {hklText}
                        </text>
                        <text
                          x={cx}
                          y={svgH - 3.5}
                          fill="#64748b"
                          fontSize="6.5"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {p.twoTheta.toFixed(1)}°
                        </text>
                      </g>
                    );
                  })}

                  {/* Caglioti / Instrumental Curve */}
                  {instLocusPts.length > 1 && (
                    <polyline fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" points={instLocusPts.join(' ')} />
                  )}
                  {/* Crystallite Size D_hkl Trajectory */}
                  {dLocusPts.length > 1 && (
                    <polyline fill="none" stroke="#10b981" strokeWidth="1.4" points={dLocusPts.join(' ')} />
                  )}
                </svg>

                <div className="flex items-center justify-between px-2 text-[9px] font-mono text-slate-400 flex-wrap gap-2">
                  <span>Left Axis: <strong className="text-cyan-300">β_phys (Cyan)</strong> + <strong className="text-amber-300">β_inst (Amber)</strong></span>
                  <span>Right Axis: <strong className="text-emerald-400">D_hkl Locus (nm)</strong> · Model: <strong className="text-slate-200">{broadeningModel}</strong></span>
                </div>
              </div>
            );
          })()}

          {/* Mode 3: 3D Coherent Domain N*d_hkl & Mathematically Plotted Scherrer Hyperbola D(β_phys) */}
          {graphicMode === 'domain' && (() => {
            const selP = peaks[safeSelectedIdx] || peaks[0];
            const selM = reflectionMetrics.rows[safeSelectedIdx] || reflectionMetrics.rows[0];
            const dVal = selM?.dSpacing || 3.135;
            const sizeNm = selM?.sizeNm || 25.0;
            const planesN = selM?.planesN || Math.round((sizeNm * 10) / dVal);
            const thetaDeg = (selP?.twoTheta || 28.4) / 2;
            const thetaRad = (thetaDeg * Math.PI) / 180;
            const cosTheta = Math.max(0.2, Math.cos(thetaRad));
            const effK = selM?.effectiveK ?? constantK;
            const visiblePlanes = Math.min(8, Math.max(4, Math.round(planesN / 14)));

            // Plot true mathematical Scherrer curve D(beta_deg) = (K * lambda) / ((beta_deg * pi/180) * cosTheta * 10)
            // Across beta_deg in [0.04° .. maxBetaPlot]
            const maxBetaPlot = Math.max(0.45, ...reflectionMetrics.rows.map(r => (r.betaCorrected || 0.2) * 1.35));
            const minBetaPlot = 0.03;
            const maxDPlot = 140;

            const mapBetaX = (bDeg: number) => 22 + ((Math.min(maxBetaPlot, Math.max(minBetaPlot, bDeg)) - minBetaPlot) / (maxBetaPlot - minBetaPlot)) * 150;
            const mapDY = (dNm: number) => 92 - (Math.min(maxDPlot, Math.max(0, dNm)) / maxDPlot) * 66;

            const curvePts: string[] = [];
            for (let i = 0; i <= 60; i++) {
              const bDeg = minBetaPlot + (i / 60) * (maxBetaPlot - minBetaPlot);
              const bRad = (bDeg * Math.PI) / 180;
              const dNm = (effK * wavelength) / (bRad * cosTheta * 10);
              curvePts.push(`${mapBetaX(bDeg).toFixed(1)},${mapDY(dNm).toFixed(1)}`);
            }

            return (
              <div className="space-y-1.5">
                <svg viewBox="0 0 460 148" className="w-full h-36 bg-[#0B0F19] rounded-lg border border-slate-800/90 overflow-visible select-none">
                  {/* Left Panel: 3D Isometric Coherent Domain Stack D = N * d_hkl */}
                  <g transform="translate(10, 10)">
                    <rect x="0" y="0" width="218" height="128" rx="6" fill="#070A12" stroke="#1e293b" strokeWidth="1" />
                    <text x="109" y="13" fill="#38bdf8" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      COHERENT COLUMN D_hkl = N · d_hkl
                    </text>

                    {/* Isometric Parallel Lattice Planes */}
                    {Array.from({ length: visiblePlanes }).map((_, pIdx) => {
                      const y = 30 + (pIdx * 64) / Math.max(1, visiblePlanes - 1);
                      return (
                        <g key={pIdx}>
                          <polygon
                            points={`26,${y + 4} 52,${y - 5} 152,${y - 5} 126,${y + 4}`}
                            fill="rgba(56, 189, 248, 0.08)"
                            stroke="#38bdf8"
                            strokeWidth="0.9"
                          />
                          {[42, 68, 94, 120].map((ax, aIdx) => (
                            <circle key={aIdx} cx={ax} cy={y} r="2" fill="#e0f2fe" stroke="#0284c7" strokeWidth="0.6" />
                          ))}
                        </g>
                      );
                    })}

                    {/* Incident k_0 & Diffracted k X-Ray Wavevectors */}
                    <line x1="14" y1="18" x2="86" y2="48" stroke="#f59e0b" strokeWidth="1.6" />
                    <line x1="86" y1="48" x2="158" y2="18" stroke="#10b981" strokeWidth="1.6" />
                    <text x="20" y="39" fill="#fbbf24" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      θ_B={thetaDeg.toFixed(2)}°
                    </text>

                    {/* Vertical Caliper for N Planes */}
                    <line x1="172" y1="28" x2="172" y2="94" stroke="#f59e0b" strokeWidth="1.2" />
                    <line x1="167" y1="28" x2="177" y2="28" stroke="#f59e0b" strokeWidth="1.2" />
                    <line x1="167" y1="94" x2="177" y2="94" stroke="#f59e0b" strokeWidth="1.2" />
                    <text x="194" y="56" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      N ≈ {planesN}
                    </text>
                    <text x="194" y="68" fill="#94a3b8" fontSize="6.5" fontFamily="monospace" textAnchor="middle">
                      planes
                    </text>

                    <text x="109" y="117" fill="#cbd5e1" fontSize="7.2" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      d_hkl = {dVal.toFixed(4)} Å · K_eff = {effK.toFixed(3)}
                    </text>
                  </g>

                  {/* Right Panel: Live Mathematical Scherrer Hyperbola D(β_phys) */}
                  <g transform="translate(238, 10)">
                    <rect x="0" y="0" width="212" height="128" rx="6" fill="#070A12" stroke="#1e293b" strokeWidth="1" />
                    <text x="106" y="13" fill="#f59e0b" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      SCHERRER LOCUS: D = Kλ / (β_phys·cosθ)
                    </text>

                    {/* Axes */}
                    <line x1="22" y1="22" x2="22" y2="92" stroke="#334155" strokeWidth="1" />
                    <line x1="22" y1="92" x2="196" y2="92" stroke="#334155" strokeWidth="1" />
                    <text x="108" y="104" fill="#64748b" fontSize="6.5" fontFamily="monospace" textAnchor="middle">
                      Physical Broadening β_phys (° 2θ)
                    </text>

                    {/* Hyperbola Curve */}
                    <polyline fill="none" stroke="#38bdf8" strokeWidth="1.5" points={curvePts.join(' ')} />

                    {/* Plot all active reflections on the hyperbola */}
                    {peaks.map((p, idx) => {
                      const m = reflectionMetrics.rows[idx];
                      if (!m?.betaCorrected || !m?.sizeNm || p.excluded) return null;
                      const px = mapBetaX(m.betaCorrected);
                      const py = mapDY(m.sizeNm);
                      const isSel = idx === safeSelectedIdx;
                      return (
                        <g key={idx} onClick={() => setSelectedPeakIdx(idx)} className="cursor-pointer">
                          {isSel && (
                            <>
                              <line x1={px} y1={py} x2={px} y2="92" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="2 2" />
                              <line x1="22" y1={py} x2={px} y2={py} stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="2 2" />
                              <circle cx={px} cy={py} r="6" fill="rgba(245, 158, 11, 0.2)" />
                            </>
                          )}
                          <circle
                            cx={px}
                            cy={py}
                            r={isSel ? '3.5' : '2.3'}
                            fill={isSel ? '#f59e0b' : '#10b981'}
                            stroke="#070A12"
                            strokeWidth="0.9"
                          />
                        </g>
                      );
                    })}

                    <text x="106" y="117" fill="#e2e8f0" fontSize="7.2" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      {selP?.hkl ? `(${selP.hkl.join('')})` : `#${safeSelectedIdx + 1}`}: β_phys={selM?.betaCorrected ? `${selM.betaCorrected.toFixed(3)}°` : '—'} → D={selM?.sizeNm ? `${selM.sizeNm.toFixed(1)} nm` : 'Lim'}
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
