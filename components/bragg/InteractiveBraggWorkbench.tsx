import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  Compass,
  Sliders,
  Plus,
  Trash2,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  Target,
  Calculator,
  Layers,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { BraggResult } from '../../types';
import { parseSingleHKL, validateHKLAgainstCrystalSystem } from '../../utils/braggCore';
import { playSynthTone } from '../../utils/sound';
import { BraggCadSchematic } from './BraggCadSchematic';

export interface AnodeTargetPreset {
  id: string;
  symbol: string;
  label: string;
  wavelength: number; // Å
  energyKeV: number;
  notes: string;
}

export const ANODE_TARGETS: AnodeTargetPreset[] = [
  { id: 'CuKa1', symbol: 'Cu Kα₁', label: 'Copper Kα₁', wavelength: 1.54056, energyKeV: 8.048, notes: 'Standard laboratory powder XRD' },
  { id: 'CuKaAvg', symbol: 'Cu Kα (avg)', label: 'Copper Kα doublet', wavelength: 1.54184, energyKeV: 8.041, notes: 'Unresolved Kα₁/Kα₂ weighted mean' },
  { id: 'CoKa1', symbol: 'Co Kα₁', label: 'Cobalt Kα₁', wavelength: 1.78897, energyKeV: 6.930, notes: 'Eliminates Fe fluorescence in steels/iron oxides' },
  { id: 'MoKa1', symbol: 'Mo Kα₁', label: 'Molybdenum Kα₁', wavelength: 0.70930, energyKeV: 17.479, notes: 'High Q_max for single-crystal & PDF analysis' },
  { id: 'CrKa1', symbol: 'Cr Kα₁', label: 'Chromium Kα₁', wavelength: 2.28970, energyKeV: 5.415, notes: 'High angular dispersion for residual stress' },
  { id: 'FeKa1', symbol: 'Fe Kα₁', label: 'Iron Kα₁', wavelength: 1.93604, energyKeV: 6.404, notes: 'Preferred for Cr/Mn-rich mineral phases' },
  { id: 'AgKa1', symbol: 'Ag Kα₁', label: 'Silver Kα₁', wavelength: 0.55941, energyKeV: 22.163, notes: 'Deep penetration & pair distribution function' },
  { id: 'Sync30keV', symbol: 'Synch. 30keV', label: 'Synchrotron 30 keV', wavelength: 0.41328, energyKeV: 30.000, notes: 'Ultra-high resolution beamline optics' }
];

export interface QuickReferenceMaterial {
  id: string;
  name: string;
  formula: string;
  sampleId: string;
  crystalSystem: string;
  a0: number;
  c0?: number;
  wavelength: number;
  peaks: string;
  hkls: string;
}

export const QUICK_REFERENCE_MATERIALS: QuickReferenceMaterial[] = [
  {
    id: 'si_640f',
    name: 'Silicon (NIST SRM 640f)',
    formula: 'Si (Fd-3m)',
    sampleId: 'NIST-640f-Si',
    crystalSystem: 'Diamond',
    a0: 5.43102,
    wavelength: 1.54056,
    peaks: '28.442:100, 47.302:55, 56.121:30, 69.130:6, 76.376:11, 88.031:12',
    hkls: '111, 220, 311, 400, 331, 422'
  },
  {
    id: 'lab6_660c',
    name: 'LaB₆ (NIST SRM 660c)',
    formula: 'LaB₆ (Pm-3m)',
    sampleId: 'NIST-660c-LaB6',
    crystalSystem: 'SC',
    a0: 4.15683,
    wavelength: 1.54056,
    peaks: '21.355:62, 30.384:100, 37.441:45, 43.506:24, 48.956:52, 53.987:28',
    hkls: '100, 110, 111, 200, 210, 211'
  },
  {
    id: 'ceo2_674b',
    name: 'Ceria (NIST SRM 674b)',
    formula: 'CeO₂ (Fm-3m)',
    sampleId: 'NIST-674b-CeO2',
    crystalSystem: 'FCC',
    a0: 5.41153,
    wavelength: 1.54056,
    peaks: '28.555:100, 33.082:28, 47.479:51, 56.335:40, 59.088:8, 69.414:7',
    hkls: '111, 200, 220, 311, 222, 400'
  },
  {
    id: 'au_fcc',
    name: 'Gold Nanocrystals',
    formula: 'Au (Fm-3m)',
    sampleId: 'Au-FCC-Standard',
    crystalSystem: 'FCC',
    a0: 4.0782,
    wavelength: 1.54056,
    peaks: '38.184:100, 44.392:46, 64.576:25, 77.547:24, 81.721:7',
    hkls: '111, 200, 220, 311, 222'
  },
  {
    id: 'fe_bcc',
    name: 'α-Iron (Ferrite)',
    formula: 'α-Fe (Im-3m)',
    sampleId: 'Alpha-Fe-BCC',
    crystalSystem: 'BCC',
    a0: 2.8665,
    wavelength: 1.54056,
    peaks: '44.673:100, 65.021:19, 82.333:30, 98.945:9, 116.385:12',
    hkls: '110, 200, 211, 220, 310'
  },
  {
    id: 'ti_hcp',
    name: 'α-Titanium (HCP)',
    formula: 'α-Ti (P6₃/mmc)',
    sampleId: 'Alpha-Ti-HCP',
    crystalSystem: 'Hexagonal',
    a0: 2.9508,
    c0: 4.6855,
    wavelength: 1.54056,
    peaks: '35.093:26, 38.421:30, 40.170:100, 53.004:13, 62.949:15, 70.660:16',
    hkls: '100, 002, 101, 102, 110, 103'
  }
];

interface InteractiveBraggWorkbenchProps {
  sampleId: string;
  setSampleId: (val: string) => void;
  materialName?: string | null;
  setMaterialName?: (val: string | null) => void;
  wavelength: number;
  setWavelength: (val: number) => void;
  rawPeaks: string;
  setRawPeaks: (val: string) => void;
  rawHKL: string;
  setRawHKL: (val: string) => void;
  crystalSystem: string;
  setCrystalSystem: (val: string) => void;
  zeroShift: number;
  setZeroShift: (val: number) => void;
  sampleDisplacement: number;
  setSampleDisplacement: (val: number) => void;
  goniometerRadius: number;
  setGoniometerRadius: (val: number) => void;
  results: BraggResult[];
  activePeakIndex: number;
  setActivePeakIndex: (idx: number) => void;
  onSaveSnapshot: () => void;
  onJumpToModule?: (moduleId: string) => void;
}

/**
 * Local deterministic cubic/Bravais auto-indexer based on sin²θ / sin²θ₁ ratios
 */
function autoIndexCubicReflections(results: BraggResult[], preferredSystem: string) {
  if (results.length === 0) return null;

  const ALLOWED_N: Record<string, { n: number; hkl: string }[]> = {
    SC: [
      { n: 1, hkl: '100' }, { n: 2, hkl: '110' }, { n: 3, hkl: '111' },
      { n: 4, hkl: '200' }, { n: 5, hkl: '210' }, { n: 6, hkl: '211' },
      { n: 8, hkl: '220' }, { n: 9, hkl: '300' }, { n: 10, hkl: '310' },
      { n: 11, hkl: '311' }, { n: 12, hkl: '222' }, { n: 14, hkl: '321' },
      { n: 16, hkl: '400' }
    ],
    BCC: [
      { n: 2, hkl: '110' }, { n: 4, hkl: '200' }, { n: 6, hkl: '211' },
      { n: 8, hkl: '220' }, { n: 10, hkl: '310' }, { n: 12, hkl: '222' },
      { n: 14, hkl: '321' }, { n: 16, hkl: '400' }, { n: 18, hkl: '411' },
      { n: 20, hkl: '420' }
    ],
    FCC: [
      { n: 3, hkl: '111' }, { n: 4, hkl: '200' }, { n: 8, hkl: '220' },
      { n: 11, hkl: '311' }, { n: 12, hkl: '222' }, { n: 16, hkl: '400' },
      { n: 19, hkl: '331' }, { n: 20, hkl: '420' }, { n: 24, hkl: '422' },
      { n: 27, hkl: '511' }
    ],
    Diamond: [
      { n: 3, hkl: '111' }, { n: 8, hkl: '220' }, { n: 11, hkl: '311' },
      { n: 16, hkl: '400' }, { n: 19, hkl: '331' }, { n: 24, hkl: '422' },
      { n: 27, hkl: '511' }, { n: 32, hkl: '440' }, { n: 35, hkl: '531' }
    ]
  };

  const candidates = ['FCC', 'BCC', 'Diamond', 'SC'];
  let bestFit: {
    system: string;
    hkls: string[];
    aValues: number[];
    meanA: number;
    stdA: number;
    rmsError: number;
  } | null = null;

  const sin2List = results.map(r => {
    const thetaRad = (r.twoTheta / 2) * (Math.PI / 180);
    return Math.pow(Math.sin(thetaRad), 2);
  });

  if (sin2List[0] <= 1e-6) return null;

  for (const sys of candidates) {
    const table = ALLOWED_N[sys];
    const n1 = table[0].n; // Assume 1st peak is fundamental allowed reflection
    const baseUnit = sin2List[0] / n1;
    let totalSqErr = 0;
    const assignedHkls: string[] = [];
    const aEstList: number[] = [];

    for (let i = 0; i < results.length; i++) {
      const targetN = sin2List[i] / baseUnit;
      // Find closest allowed N in this Bravais lattice
      let closest = table[0];
      let minDiff = Math.abs(targetN - closest.n);
      for (const entry of table) {
        const diff = Math.abs(targetN - entry.n);
        if (diff < minDiff) {
          minDiff = diff;
          closest = entry;
        }
      }
      totalSqErr += minDiff * minDiff;
      assignedHkls.push(closest.hkl);
      aEstList.push(results[i].dSpacing * Math.sqrt(closest.n));
    }

    const rms = Math.sqrt(totalSqErr / results.length);
    const meanA = aEstList.reduce((s, v) => s + v, 0) / aEstList.length;
    const stdA = Math.sqrt(
      aEstList.reduce((s, v) => s + Math.pow(v - meanA, 2), 0) / aEstList.length
    );

    // Prefer user's selected system if close, otherwise minimum RMS
    const penalty = sys === preferredSystem ? 0.75 : 1.0;
    if (!bestFit || rms * penalty < bestFit.rmsError) {
      bestFit = {
        system: sys,
        hkls: assignedHkls,
        aValues: aEstList,
        meanA,
        stdA,
        rmsError: rms * penalty
      };
    }
  }

  return bestFit;
}

export const InteractiveBraggWorkbench: React.FC<InteractiveBraggWorkbenchProps> = ({
  sampleId,
  setSampleId,
  materialName: _materialName,
  setMaterialName,
  wavelength,
  setWavelength,
  rawPeaks,
  setRawPeaks,
  rawHKL,
  setRawHKL,
  crystalSystem,
  setCrystalSystem,
  zeroShift,
  setZeroShift,
  sampleDisplacement,
  setSampleDisplacement,
  goniometerRadius,
  setGoniometerRadius,
  results,
  activePeakIndex,
  setActivePeakIndex,
  onSaveSnapshot,
  onJumpToModule
}) => {
  const [preserveDOnAnodeChange, setPreserveDOnAnodeChange] = useState<boolean>(true);
  const [workbenchTab, setWorkbenchTab] = useState<'table' | 'forward_calc' | 'ray_optics'>('table');

  // Bidirectional Single-Reflection Calculator state
  const activePeak = results[activePeakIndex] || results[0] || {
    twoTheta: 28.442,
    dSpacing: 3.1355,
    qVector: 2.0039,
    sinThetaOverLambda: 0.15946,
    hkl: '111',
    intensity: 100
  };

  const [calcTwoTheta, setCalcTwoTheta] = useState<number>(activePeak.twoTheta);
  const [calcDSpacing, setCalcDSpacing] = useState<number>(activePeak.dSpacing);
  const [calcLatticeA, setCalcLatticeA] = useState<number>(5.431);
  const [calcLatticeC, setCalcLatticeC] = useState<number>(4.685);
  const [calcH, setCalcH] = useState<number>(1);
  const [calcK, setCalcK] = useState<number>(1);
  const [calcL, setCalcL] = useState<number>(1);

  // Sync single-reflection calculator when activePeak changes
  useEffect(() => {
    if (activePeak) {
      setCalcTwoTheta(Number(activePeak.twoTheta.toFixed(4)));
      setCalcDSpacing(Number(activePeak.dSpacing.toFixed(5)));
      if (activePeak.hkl) {
        const parsed = parseSingleHKL(activePeak.hkl);
        if (parsed) {
          setCalcH(parsed.h);
          setCalcK(parsed.k);
          setCalcL(parsed.l);
        }
      }
    }
  }, [activePeakIndex, activePeak?.twoTheta, activePeak?.dSpacing, activePeak?.hkl]);

  const handleAnodeSwitch = (newWavelength: number) => {
    if (preserveDOnAnodeChange && results.length > 0) {
      // Transform existing 2theta positions so d-spacings remain invariant under the new X-ray tube wavelength!
      const transformedPeaks: string[] = [];
      const transformedHkls: string[] = [];
      for (const r of results) {
        const sinTheta = newWavelength / (2 * r.dSpacing);
        if (sinTheta > 0 && sinTheta < 0.999) {
          const new2Theta = (2 * Math.asin(sinTheta) * 180) / Math.PI;
          const intSuffix = r.intensity !== undefined ? `:${Math.round(r.intensity)}` : '';
          transformedPeaks.push(`${new2Theta.toFixed(3)}${intSuffix}`);
          if (r.hkl) transformedHkls.push(r.hkl);
        }
      }
      if (transformedPeaks.length > 0) {
        setRawPeaks(transformedPeaks.join(', '));
        if (transformedHkls.length > 0) {
          setRawHKL(transformedHkls.join(', '));
        }
      }
    }
    setWavelength(newWavelength);
    playSynthTone('switch');
  };

  // Update a specific row in rawPeaks / rawHKL directly from the interactive table
  const handleUpdateRow = (
    idx: number,
    newTwoTheta?: number,
    newHkl?: string,
    newIntensity?: number
  ) => {
    const updatedPeaks = results.map((r, i) => {
      const tt = i === idx && newTwoTheta !== undefined ? newTwoTheta : r.twoTheta;
      const inten = i === idx && newIntensity !== undefined ? newIntensity : (r.intensity ?? 100);
      return `${tt.toFixed(3)}:${Math.round(inten)}`;
    });
    const updatedHkls = results.map((r, i) =>
      i === idx && newHkl !== undefined ? newHkl : r.hkl || '100'
    );
    setRawPeaks(updatedPeaks.join(', '));
    setRawHKL(updatedHkls.join(', '));
  };

  const handleDeleteRow = (idx: number) => {
    if (results.length <= 1) return;
    const nextResults = results.filter((_, i) => i !== idx);
    setRawPeaks(
      nextResults
        .map(r => `${r.twoTheta.toFixed(3)}:${Math.round(r.intensity ?? 100)}`)
        .join(', ')
    );
    setRawHKL(nextResults.map(r => r.hkl || '').join(', '));
    if (activePeakIndex >= nextResults.length) {
      setActivePeakIndex(Math.max(0, nextResults.length - 1));
    }
    playSynthTone('tick');
  };

  const handleAddRow = (twoThetaVal: number, hklStr: string, intensityVal = 50) => {
    const existingIdx = results.findIndex(
      r => Math.abs(r.twoTheta - twoThetaVal) < 0.005 && (r.hkl || '') === hklStr
    );
    if (existingIdx !== -1) {
      setActivePeakIndex(existingIdx);
      playSynthTone('tick');
      return;
    }
    const currentPeakTokens = results.map(
      r => `${r.twoTheta.toFixed(3)}:${Math.round(r.intensity ?? 100)}`
    );
    const currentHklTokens = results.map(r => r.hkl || '111');
    currentPeakTokens.push(`${twoThetaVal.toFixed(3)}:${Math.round(intensityVal)}`);
    currentHklTokens.push(hklStr);
    setRawPeaks(currentPeakTokens.join(', '));
    setRawHKL(currentHklTokens.join(', '));
    playSynthTone('success');
  };

  // Automatic Cubic / Bravais Pattern Indexer
  const autoIndexedSolution = useMemo(
    () => autoIndexCubicReflections(results, crystalSystem),
    [results, crystalSystem]
  );

  // Forward calculation from (a, c) + (hkl) -> d_hkl -> 2theta
  const forwardPrediction = useMemo(() => {
    const h = calcH;
    const k = calcK;
    const l = calcL;
    if (h === 0 && k === 0 && l === 0) return null;

    let invD2 = 0;
    if (crystalSystem === 'Hexagonal') {
      invD2 =
        (4 / 3) * ((h * h + h * k + k * k) / (calcLatticeA * calcLatticeA)) +
        (l * l) / (calcLatticeC * calcLatticeC);
    } else {
      invD2 = (h * h + k * k + l * l) / (calcLatticeA * calcLatticeA);
    }
    if (invD2 <= 0) return null;
    const d = 1 / Math.sqrt(invD2);
    const sinTheta = wavelength / (2 * d);
    const twoTheta =
      sinTheta > 0 && sinTheta < 1 ? (2 * Math.asin(sinTheta) * 180) / Math.PI : null;
    const q = (2 * Math.PI) / d;
    const check = validateHKLAgainstCrystalSystem(h, k, l, crystalSystem);
    return { d, twoTheta, q, valid: check.valid, reason: check.reason };
  }, [calcH, calcK, calcL, calcLatticeA, calcLatticeC, crystalSystem, wavelength]);

  const photonEnergyKeV = wavelength > 0 ? 12.39842 / wavelength : 0;

  return (
    <div className="bg-[#0B0F19] rounded-sm border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
      {/* Top Bar: Instrument Header + Live Bragg & Ewald CAD Schematic */}
      <div className="p-4 sm:p-5 bg-[#070A12] border-b border-slate-800 space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
          <div className="xl:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              <span>● BRAGG DIFFRACTOMETER CORE</span>
              <span className="text-slate-700">|</span>
              <span className="text-emerald-400">REAL-TIME KINEMATIC SOLVER</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">E = {photonEnergyKeV.toFixed(2)} keV</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {sampleId ? `Specimen: ${sampleId}` : 'Live 2θ ↔ d-Spacing & Sin²θ Indexing Workbench'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Compute interplanar spacings <span className="font-mono text-cyan-300">d_hkl = nλ / (2 sinθ)</span>,
              momentum transfer vectors <span className="font-mono text-emerald-400">Q = 4πsinθ / λ</span>, and
              perform systematic <span className="font-mono text-amber-300">sin²θ / sin²θ₁</span> Bravais auto-indexing.
            </p>

            {/* Downstream Analysis Quick-Bridge */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onSaveSnapshot}
                className="px-3.5 py-2 rounded-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Save current diffractometer state to calculation history"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Save Snapshot</span>
              </button>
              {onJumpToModule && (
                <>
                  <button
                    type="button"
                    onClick={() => onJumpToModule('scherrer')}
                    className="px-3 py-2 rounded-sm bg-[#0B0F19] hover:bg-slate-900 text-slate-200 border border-slate-800 hover:border-cyan-500/50 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Scherrer Size</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onJumpToModule('wh')}
                    className="px-3 py-2 rounded-sm bg-[#0B0F19] hover:bg-slate-900 text-slate-200 border border-slate-800 hover:border-cyan-500/50 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Williamson–Hall</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onJumpToModule('rietveld')}
                    className="px-3 py-2 rounded-sm bg-[#0B0F19] hover:bg-slate-900 text-slate-200 border border-slate-800 hover:border-cyan-500/50 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Rietveld Fit</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="xl:col-span-5">
            <BraggCadSchematic
              wavelength={wavelength}
              activeTwoTheta={activePeak.twoTheta}
              activeDSpacing={activePeak.dSpacing}
              activeQVector={activePeak.qVector}
              activeHkl={activePeak.hkl}
              crystalSystem={crystalSystem}
              reflectionCount={results.length}
            />
          </div>
        </div>

        {/* Row 1: One-Click Reference Standards */}
        <div className="space-y-1.5 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="uppercase tracking-wider">
              1-Click Certified NIST &amp; Crystal Reference Standards:
            </span>
            <span className="text-cyan-400 tabular-nums">
              λ = {wavelength.toFixed(5)} Å · E = {photonEnergyKeV.toFixed(2)} keV
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {QUICK_REFERENCE_MATERIALS.map((mat) => {
              const isSelected = sampleId === mat.sampleId;
              return (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => {
                    setSampleId(mat.sampleId);
                    setMaterialName?.(mat.formula);
                    setWavelength(mat.wavelength);
                    setRawPeaks(mat.peaks);
                    setRawHKL(mat.hkls);
                    setCrystalSystem(mat.crystalSystem);
                    setCalcLatticeA(mat.a0);
                    if (mat.c0) setCalcLatticeC(mat.c0);
                    setActivePeakIndex(0);
                    playSynthTone('switch');
                  }}
                  className={`p-2.5 rounded-sm border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F172A] border-cyan-500 text-white'
                      : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-cyan-400">{mat.formula}</span>
                    <span className="text-slate-500 tabular-nums">a={mat.a0.toFixed(2)}Å</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-100 truncate mt-0.5">
                    {mat.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Radiation Source (Anode) Switcher */}
        <div className="pt-3 border-t border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mr-1">
              X-Ray Anode:
            </span>
            {ANODE_TARGETS.map((anode) => {
              const isAct = Math.abs(wavelength - anode.wavelength) < 0.0005;
              return (
                <button
                  key={anode.id}
                  type="button"
                  onClick={() => handleAnodeSwitch(anode.wavelength)}
                  title={`${anode.label} (${anode.wavelength} Å, ${anode.energyKeV} keV) — ${anode.notes}`}
                  className={`px-2.5 py-1 rounded-sm text-[11px] font-mono transition-colors cursor-pointer border tabular-nums ${
                    isAct
                      ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/70 font-bold'
                      : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {anode.symbol} ({anode.wavelength.toFixed(4)}Å)
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={preserveDOnAnodeChange}
              onChange={(e) => setPreserveDOnAnodeChange(e.target.checked)}
              className="rounded-sm border-slate-700 bg-[#0B0F19] text-cyan-500 focus:ring-cyan-500"
            />
            <span>Preserve constant d_hkl on anode switch</span>
          </label>
        </div>
      </div>

      {/* Sub-Navigation Tabs inside Workbench */}
      <div className="px-4 sm:px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-[#070A12]">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setWorkbenchTab('table')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
              workbenchTab === 'table'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>01 // Reflection Editor &amp; Sin²θ Indexer ({results.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkbenchTab('forward_calc')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
              workbenchTab === 'forward_calc'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>02 // 2θ ↔ d_hkl ↔ Lattice (a,c)</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkbenchTab('ray_optics')}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
              workbenchTab === 'ray_optics'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>03 // Goniometer Alignment &amp; Optics</span>
          </button>
        </div>

        {/* Active Reflection Telemetry Readout */}
        {activePeak && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 tabular-nums">
            <span>Focused #{activePeakIndex + 1}:</span>
            <strong className="text-white">
              ({activePeak.hkl || '—'}) @ {activePeak.twoTheta.toFixed(3)}°
            </strong>
            <span className="text-slate-700">|</span>
            <span className="text-cyan-400">d = {activePeak.dSpacing.toFixed(4)} Å</span>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-400">Q = {activePeak.qVector.toFixed(3)} Å⁻¹</span>
          </div>
        )}
      </div>

      {/* Tab 1: Interactive Reflection Editor & Sin²θ Ratio Auto-Indexer */}
      {workbenchTab === 'table' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Sin²θ Ratio Auto-Indexing Banner & Visual Bravais Extinction Ladder */}
          {autoIndexedSolution && (
            <div className="p-4 rounded-sm bg-[#070A12] border border-slate-800 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-white flex-wrap">
                    <Wand2 className="w-4 h-4 text-cyan-400" />
                    <span>
                      Sin²θ / Sin²θ₁ PATTERN SOLVER: BEST BRAVAIS MATCH ={' '}
                      <span className="text-cyan-400">{autoIndexedSolution.system}</span>
                    </span>
                    <span className="text-slate-700">|</span>
                    <span className="tabular-nums text-emerald-400">
                      a₀ = {autoIndexedSolution.meanA.toFixed(4)} ± {autoIndexedSolution.stdA.toFixed(4)} Å
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400">
                    Predicted (hkl) sequence:{' '}
                    <span className="text-slate-200">
                      {autoIndexedSolution.hkls.map(h => `(${h})`).join(' · ')}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRawHKL(autoIndexedSolution.hkls.join(', '));
                    setCrystalSystem(autoIndexedSolution.system);
                    playSynthTone('success');
                  }}
                  className="px-3.5 py-2 rounded-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Apply ({autoIndexedSolution.system}) HKLs</span>
                </button>
              </div>

              {/* Visual Sin²θ / Sin²θ₁ Bravais Extinction Ladder SVG */}
              <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3">
                <svg viewBox="0 0 680 112" className="w-full h-auto select-none">
                  <text x="12" y="15" fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    BRAVAIS EXTINCTION LADDER: NORMALIZED N = (h²+k²+l²) ALLOWED RAILS vs. OBSERVED PEAKS
                  </text>
                  {[
                    {
                      label: 'SC (P)',
                      sys: 'SC',
                      norms: [1, 2, 3, 4, 5, 6, 8],
                      baseN1: 1,
                      color: '#818cf8',
                      y: 34
                    },
                    {
                      label: 'BCC (I)',
                      sys: 'BCC',
                      norms: [2, 4, 6, 8, 10, 12, 14],
                      baseN1: 2,
                      color: '#22d3ee',
                      y: 55
                    },
                    {
                      label: 'FCC (F)',
                      sys: 'FCC',
                      norms: [3, 4, 8, 11, 12, 16, 19],
                      baseN1: 3,
                      color: '#34d399',
                      y: 76
                    },
                    {
                      label: 'Diamond',
                      sys: 'Diamond',
                      norms: [3, 8, 11, 16, 19, 24],
                      baseN1: 3,
                      color: '#fbbf24',
                      y: 97
                    }
                  ].map((rail) => {
                    const isBest = autoIndexedSolution.system === rail.sys;
                    const maxRatio = 8.2;
                    return (
                      <g key={rail.sys}>
                        <text
                          x="12"
                          y={rail.y + 3}
                          fill={isBest ? rail.color : '#64748b'}
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight={isBest ? 'bold' : 'normal'}
                        >
                          {rail.label}
                        </text>
                        <line
                          x1="78"
                          y1={rail.y}
                          x2="662"
                          y2={rail.y}
                          stroke={isBest ? rail.color : '#1e293b'}
                          strokeWidth={isBest ? '1.6' : '1'}
                          strokeOpacity={isBest ? 0.65 : 0.9}
                        />
                        {rail.norms.map((nVal) => {
                          const ratio = nVal / rail.baseN1;
                          if (ratio > maxRatio) return null;
                          const xPos = 86 + ((ratio - 1) / (maxRatio - 1)) * 566;
                          return (
                            <g key={nVal}>
                              <line
                                x1={xPos}
                                y1={rail.y - 5}
                                x2={xPos}
                                y2={rail.y + 5}
                                stroke={rail.color}
                                strokeWidth="1.6"
                                strokeOpacity={isBest ? 0.95 : 0.45}
                              />
                              <text
                                x={xPos}
                                y={rail.y - 7}
                                textAnchor="middle"
                                fill={isBest ? '#e2e8f0' : '#475569'}
                                fontSize="7.5"
                                fontFamily="monospace"
                              >
                                N={nVal}
                              </text>
                            </g>
                          );
                        })}
                        {/* Plot experimental sin²θ / sin²θ₁ markers on best-matching rail */}
                        {isBest &&
                          results.map((r, rIdx) => {
                            const sin1 =
                              results.length > 0
                                ? Math.sin((results[0].twoTheta / 2) * (Math.PI / 180))
                                : 1;
                            const sinCurr = Math.sin((r.twoTheta / 2) * (Math.PI / 180));
                            const sinSqRatio =
                              sin1 > 1e-6 ? (sinCurr * sinCurr) / (sin1 * sin1) : 1;
                            if (sinSqRatio > maxRatio) return null;
                            const xObs = 86 + ((sinSqRatio - 1) / (maxRatio - 1)) * 566;
                            return (
                              <circle
                                key={rIdx}
                                cx={xObs}
                                cy={rail.y}
                                r="4"
                                fill="#f43f5e"
                                stroke="#ffffff"
                                strokeWidth="1.2"
                              />
                            );
                          })}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Interactive Peak Table */}
          <div className="overflow-x-auto rounded-sm border border-slate-800 bg-[#070A12]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B0F19] text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3">Peak</th>
                  <th className="py-2.5 px-3">2θ Angle (°)</th>
                  <th className="py-2.5 px-3">Miller (hkl)</th>
                  <th className="py-2.5 px-3">Rel. Int (%)</th>
                  <th className="py-2.5 px-3">d-Spacing (Å)</th>
                  <th className="py-2.5 px-3">Q = 4πsinθ/λ (Å⁻¹)</th>
                  <th className="py-2.5 px-3">sin²θ / sin²θ₁</th>
                  <th className="py-2.5 px-3">Symmetry Check</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono tabular-nums">
                {results.map((r, idx) => {
                  const isFocused = idx === activePeakIndex;
                  const sinTheta1 =
                    results.length > 0
                      ? Math.sin((results[0].twoTheta / 2) * (Math.PI / 180))
                      : 1;
                  const sinThetaCurr = Math.sin((r.twoTheta / 2) * (Math.PI / 180));
                  const sin2Ratio =
                    sinTheta1 > 1e-6
                      ? (sinThetaCurr * sinThetaCurr) / (sinTheta1 * sinTheta1)
                      : 1;

                  const parsedHkl = r.hkl ? parseSingleHKL(r.hkl) : null;
                  const nSum = parsedHkl
                    ? parsedHkl.h * parsedHkl.h +
                      parsedHkl.k * parsedHkl.k +
                      parsedHkl.l * parsedHkl.l
                    : null;

                  return (
                    <tr
                      key={idx}
                      onClick={() => setActivePeakIndex(idx)}
                      className={`transition-colors cursor-pointer ${
                        isFocused
                          ? 'bg-cyan-500/10'
                          : 'hover:bg-slate-900/70'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-slate-200">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isFocused ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-600'
                            }`}
                          />
                          <span>#{idx + 1}</span>
                        </div>
                      </td>

                      {/* Editable 2Theta */}
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          max="179"
                          value={Number(r.twoTheta.toFixed(3))}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0 && val < 180) {
                              handleUpdateRow(idx, val, undefined, undefined);
                            }
                          }}
                          className="w-24 px-2 py-1 rounded-sm bg-[#0B0F19] border border-slate-700 text-slate-100 font-bold text-xs focus:border-cyan-500 outline-none"
                        />
                      </td>

                      {/* Editable HKL */}
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={r.hkl || ''}
                            placeholder="111"
                            onChange={(e) => handleUpdateRow(idx, undefined, e.target.value, undefined)}
                            className="w-16 px-2 py-1 rounded-sm bg-[#0B0F19] border border-slate-700 text-cyan-300 font-bold text-xs text-center focus:border-cyan-500 outline-none"
                          />
                          {nSum !== null && (
                            <span className="text-[10px] text-slate-400" title="h²+k²+l²">
                              N={nSum}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Editable Relative Intensity */}
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          step="1"
                          value={Math.round(r.intensity ?? 100)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              handleUpdateRow(idx, undefined, undefined, Math.max(1, Math.min(100, val)));
                            }
                          }}
                          className="w-16 px-2 py-1 rounded-sm bg-[#0B0F19] border border-slate-700 text-slate-100 text-xs focus:border-cyan-500 outline-none"
                        />
                      </td>

                      {/* Calculated d-Spacing */}
                      <td className="py-2 px-3 font-bold text-cyan-400">
                        {r.dSpacing.toFixed(4)} Å
                      </td>

                      {/* Calculated Q */}
                      <td className="py-2 px-3 text-slate-300">
                        {r.qVector.toFixed(4)}
                      </td>

                      {/* sin²θ / sin²θ₁ ratio */}
                      <td className="py-2 px-3 text-amber-400 font-bold">
                        {sin2Ratio.toFixed(3)}×
                      </td>

                      {/* Symmetry Check */}
                      <td className="py-2 px-3 font-mono">
                        {r.validationError ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold"
                            title={r.validationError}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>FORBIDDEN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>ALLOWED</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActivePeakIndex(idx);
                              playSynthTone('tick');
                            }}
                            className={`px-2 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors border ${
                              isFocused
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                                : 'bg-[#0B0F19] text-slate-300 border-slate-700 hover:border-cyan-500 hover:text-cyan-300'
                            }`}
                            title="Aim Goniometer & Ewald CAD Visualizer at this reflection"
                          >
                            <Target className="w-3 h-3 inline mr-1" />
                            Focus
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            disabled={results.length <= 1}
                            className="p-1 rounded-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 cursor-pointer transition-colors"
                            title="Remove peak"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Add Reflection Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                const last2Theta = results.length > 0 ? results[results.length - 1].twoTheta : 25;
                const next2Theta = Math.min(165, Number((last2Theta + 12.5).toFixed(2)));
                handleAddRow(next2Theta, '220', 45);
              }}
              className="px-3.5 py-2 rounded-sm bg-[#070A12] hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 hover:border-cyan-400 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Reflection Row</span>
            </button>

            <div className="text-[11px] font-mono text-slate-400">
              SELECT ROW TO LOCK EWALD & GONIOMETER CAD VIEWPORT · EDIT 2θ OR (hkl) INLINE
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bidirectional 2θ ↔ d_hkl ↔ Lattice (a, c) Calculator */}
      {workbenchTab === 'forward_calc' && (
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-[#070A12]">
          {/* Left Card: Instant Bidirectional 2θ ↔ d_hkl ↔ Q Converter */}
          <div className="p-4 rounded-sm bg-[#0B0F19] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
                  Bidirectional Bragg Converter (2θ ↔ d ↔ Q)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
                λ = {wavelength.toFixed(5)} Å
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block">
                  Diffraction Angle 2θ (°)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="179"
                  value={calcTwoTheta}
                  onChange={(e) => {
                    const tt = parseFloat(e.target.value);
                    setCalcTwoTheta(tt);
                    if (!isNaN(tt) && tt > 0 && tt < 180) {
                      const sinT = Math.sin((tt / 2) * (Math.PI / 180));
                      if (sinT > 1e-6) {
                        setCalcDSpacing(Number((wavelength / (2 * sinT)).toFixed(5)));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-sm bg-[#070A12] border border-slate-700 font-mono font-bold text-sm text-slate-100 tabular-nums focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block">
                  Interplanar Spacing d_hkl (Å)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.2"
                  max="100"
                  value={calcDSpacing}
                  onChange={(e) => {
                    const dVal = parseFloat(e.target.value);
                    setCalcDSpacing(dVal);
                    if (!isNaN(dVal) && dVal > 0) {
                      const sinT = wavelength / (2 * dVal);
                      if (sinT > 0 && sinT <= 1) {
                        setCalcTwoTheta(Number(((2 * Math.asin(sinT) * 180) / Math.PI).toFixed(4)));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-sm bg-[#070A12] border border-slate-700 font-mono font-bold text-sm text-cyan-400 tabular-nums focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Harmonic Reflection Orders Table (n = 1, 2, 3) */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center tabular-nums">
              {[1, 2, 3].map((orderN) => {
                const sinN = (orderN * wavelength) / (2 * (calcDSpacing || 1));
                const angle2T =
                  sinN > 0 && sinN <= 1 ? ((2 * Math.asin(sinN) * 180) / Math.PI).toFixed(2) + '°' : 'Evanescent';
                return (
                  <div
                    key={orderN}
                    className="p-2.5 rounded-sm bg-[#070A12] border border-slate-800"
                  >
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Order n = {orderN}</div>
                    <div className="text-xs font-bold text-slate-100 mt-0.5">
                      {angle2T}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleAddRow(calcTwoTheta, `${calcH}${calcK}${calcL}`, 65)}
              className="w-full py-2 rounded-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              + Append (2θ = {calcTwoTheta.toFixed(2)}°, d = {calcDSpacing.toFixed(4)} Å)
            </button>
          </div>

          {/* Right Card: Forward Crystal Lattice (a, c) + (hkl) Predictor */}
          <div className="p-4 rounded-sm bg-[#0B0F19] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
                  Forward Unit Cell (a, c) + (hkl) → 2θ Predictor
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">{crystalSystem}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono tabular-nums">
              <div className="col-span-1 sm:col-span-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Lattice a (Å)</label>
                <input
                  type="number"
                  step="0.005"
                  value={calcLatticeA}
                  onChange={(e) => setCalcLatticeA(parseFloat(e.target.value) || 3.5)}
                  className="w-full px-2.5 py-1.5 rounded-sm bg-[#070A12] border border-slate-700 text-xs font-bold text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>
              {crystalSystem === 'Hexagonal' && (
                <div className="col-span-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Lattice c (Å)</label>
                  <input
                    type="number"
                    step="0.005"
                    value={calcLatticeC}
                    onChange={(e) => setCalcLatticeC(parseFloat(e.target.value) || 4.6)}
                    className="w-full px-2.5 py-1.5 rounded-sm bg-[#070A12] border border-slate-700 text-xs font-bold text-slate-100 focus:border-emerald-500 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">h</label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={calcH}
                  onChange={(e) => setCalcH(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-sm bg-[#070A12] border border-slate-700 text-xs font-bold text-center text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">k</label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={calcK}
                  onChange={(e) => setCalcK(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-sm bg-[#070A12] border border-slate-700 text-xs font-bold text-center text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">l</label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={calcL}
                  onChange={(e) => setCalcL(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-sm bg-[#070A12] border border-slate-700 text-xs font-bold text-center text-slate-100 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {forwardPrediction && (
              <div className="p-3 rounded-sm bg-[#070A12] border border-slate-800 space-y-2 font-mono text-xs tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Predicted d_({calcH}{calcK}{calcL}):</span>
                  <strong className="text-cyan-400">
                    {forwardPrediction.d.toFixed(4)} Å
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Predicted Bragg 2θ:</span>
                  <strong className="text-emerald-400">
                    {forwardPrediction.twoTheta !== null
                      ? `${forwardPrediction.twoTheta.toFixed(3)}°`
                      : 'Outside Ewald Sphere (2d < λ)'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Extinction Status:</span>
                  <span
                    className={
                      forwardPrediction.valid
                        ? 'text-emerald-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {forwardPrediction.valid ? 'ALLOWED REFLECTION' : forwardPrediction.reason}
                  </span>
                </div>
              </div>
            )}

            {forwardPrediction && forwardPrediction.twoTheta !== null && (
              <button
                type="button"
                onClick={() =>
                  handleAddRow(
                    forwardPrediction.twoTheta!,
                    `${calcH}${calcK}${calcL}`,
                    forwardPrediction.valid ? 75 : 15
                  )
                }
                className="w-full py-2 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                + Add ({calcH}{calcK}{calcL}) Peak at {forwardPrediction.twoTheta.toFixed(2)}°
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Goniometer Alignment & Wave Interference Optics */}
      {workbenchTab === 'ray_optics' && (
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center bg-[#070A12]">
          {/* Interactive Sliders for Zero Shift, Sample Displacement, and Goniometer Radius */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
                Bragg–Brentano Systematic Error Calibration
              </h4>
              <button
                type="button"
                onClick={() => {
                  setZeroShift(0);
                  setSampleDisplacement(0);
                  setGoniometerRadius(240);
                  playSynthTone('tick');
                }}
                className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET</span>
              </button>
            </div>

            <div className="space-y-3.5 bg-[#0B0F19] p-4 rounded-sm border border-slate-800">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5 tabular-nums">
                  <span className="text-slate-400">Zero-Point Offset (Δ2θ₀):</span>
                  <strong className="text-cyan-400">
                    {zeroShift >= 0 ? `+${zeroShift.toFixed(3)}` : zeroShift.toFixed(3)}°
                  </strong>
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.005"
                  value={zeroShift}
                  onChange={(e) => setZeroShift(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5 tabular-nums">
                  <span className="text-slate-400">Sample Height Displacement (s):</span>
                  <strong className="text-emerald-400">
                    {sampleDisplacement >= 0
                      ? `+${sampleDisplacement.toFixed(3)}`
                      : sampleDisplacement.toFixed(3)}{' '}
                    mm
                  </strong>
                </div>
                <input
                  type="range"
                  min="-0.4"
                  max="0.4"
                  step="0.005"
                  value={sampleDisplacement}
                  onChange={(e) => setSampleDisplacement(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="text-[10px] font-mono text-slate-400 mt-1 tabular-nums">
                  Induced Shift at {activePeak.twoTheta.toFixed(1)}°:{' '}
                  <span className="text-amber-400">
                    {(
                      ((-2 *
                        sampleDisplacement *
                        Math.cos((activePeak.twoTheta / 2) * (Math.PI / 180))) /
                        (goniometerRadius || 240)) *
                      (180 / Math.PI)
                    ).toFixed(4)}
                    °
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5 tabular-nums">
                  <span className="text-slate-400">Goniometer Circle Radius (R):</span>
                  <strong className="text-cyan-400">{goniometerRadius} mm</strong>
                </div>
                <div className="flex gap-1.5">
                  {[185, 200, 240, 285, 320].map((rVal) => (
                    <button
                      key={rVal}
                      type="button"
                      onClick={() => setGoniometerRadius(rVal)}
                      className={`flex-1 py-1.5 rounded-sm text-xs font-mono font-bold border cursor-pointer transition-colors tabular-nums ${
                        goniometerRadius === rVal
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-[#070A12] text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {rVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Dual-Viewport Wave-Interference & Bragg-Brentano Parafocusing Goniometer SVG */}
          <div className="lg:col-span-7 bg-[#0B0F19] rounded-sm border border-slate-800 p-4 flex flex-col items-center">
            {(() => {
              const thetaDeg = Math.max(8, Math.min(72, activePeak.twoTheta / 2));
              const thetaRad = (thetaDeg * Math.PI) / 180;
              const dPx = 36;
              const cx = 135;
              const cy = 96;
              const rayLen = 105;

              const srcX = cx - rayLen * Math.cos(thetaRad);
              const srcY = cy - rayLen * Math.sin(thetaRad);
              const detX = cx + rayLen * Math.cos(thetaRad);
              const detY = cy - rayLen * Math.sin(thetaRad);

              const cy2 = cy + dPx;
              const pA_X = cx - dPx * Math.sin(thetaRad) * Math.cos(thetaRad);
              const pA_Y = cy + dPx * Math.cos(thetaRad) * Math.cos(thetaRad);
              const pB_X = cx + dPx * Math.sin(thetaRad) * Math.cos(thetaRad);
              const pB_Y = pA_Y;

              // Phase offset induced by sample displacement or zero shift
              const inducedDegShift =
                zeroShift +
                ((-2 * sampleDisplacement * Math.cos(thetaRad)) / (goniometerRadius || 240)) *
                  (180 / Math.PI);
              const phaseMismatchRad = inducedDegShift * 3.5;

              // Wave superposition points
              const wave1Pts: string[] = [];
              const wave2Pts: string[] = [];
              const sumWavePts: string[] = [];
              for (let i = 0; i <= 60; i++) {
                const wx = 18 + (i / 60) * 234;
                const phase = (i / 60) * 4 * Math.PI;
                const y1 = 196 - 8 * Math.cos(phase);
                const y2 = 196 - 8 * Math.cos(phase + phaseMismatchRad);
                const ySum = 196 - 8 * (Math.cos(phase) + Math.cos(phase + phaseMismatchRad));
                wave1Pts.push(`${wx.toFixed(1)},${y1.toFixed(1)}`);
                wave2Pts.push(`${wx.toFixed(1)},${y2.toFixed(1)}`);
                sumWavePts.push(`${wx.toFixed(1)},${ySum.toFixed(1)}`);
              }

              // Viewport B: Bragg-Brentano Goniometer Circle
              const gCx = 415;
              const gCy = 118;
              const gR = 76;
              const gSrcX = gCx - gR * Math.cos(thetaRad);
              const gSrcY = gCy - gR * Math.sin(thetaRad);
              const gDetX = gCx + gR * Math.cos(thetaRad);
              const gDetY = gCy - gR * Math.sin(thetaRad);
              const dispPx = Math.max(-18, Math.min(18, -sampleDisplacement * 35));

              return (
                <svg viewBox="0 0 545 228" className="w-full h-auto select-none">
                  {/* Viewport A Background */}
                  <rect x="6" y="6" width="262" height="216" rx="3" fill="#070A12" stroke="#1e293b" />
                  <text x="16" y="22" fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    A. BRAGG PATH DIFFERENCE (2d·sinθ = nλ)
                  </text>

                  {/* Crystal Atomic Planes */}
                  {[0, 1, 2].map((layer) => {
                    const y = cy + layer * dPx;
                    return (
                      <g key={layer}>
                        <line
                          x1="22"
                          y1={y}
                          x2="248"
                          y2={y}
                          stroke="#334155"
                          strokeWidth="1.2"
                          strokeDasharray="4 3"
                        />
                        {Array.from({ length: 7 }).map((_, aIdx) => (
                          <circle
                            key={aIdx}
                            cx={36 + aIdx * 33}
                            cy={y}
                            r="3.5"
                            fill="#38bdf8"
                            fillOpacity={layer === 0 ? 0.95 : 0.6}
                          />
                        ))}
                      </g>
                    );
                  })}

                  {/* Incident & Diffracted Beams */}
                  <line x1={srcX} y1={srcY} x2={cx} y2={cy} stroke="#38bdf8" strokeWidth="2" />
                  <line x1={cx} y1={cy} x2={detX} y2={detY} stroke="#22d3ee" strokeWidth="2" />
                  <line x1={srcX} y1={srcY + dPx} x2={cx} y2={cy2} stroke="#38bdf8" strokeWidth="1.4" strokeOpacity="0.7" />
                  <line x1={cx} y1={cy2} x2={detX} y2={detY + dPx} stroke="#22d3ee" strokeWidth="1.4" strokeOpacity="0.7" />

                  {/* Path difference Highlight Triangle */}
                  <polygon
                    points={`${cx},${cy} ${pA_X},${pA_Y} ${cx},${cy2} ${pB_X},${pB_Y}`}
                    fill="#f59e0b"
                    fillOpacity="0.24"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                  />

                  {/* Interplanar spacing d annotation */}
                  <line x1="26" y1={cy} x2="26" y2={cy2} stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="31" y={(cy + cy2) / 2 + 3} fill="#fbbf24" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    d = {activePeak.dSpacing.toFixed(3)} Å
                  </text>

                  {/* Wave Superposition Strip */}
                  <rect x="14" y="172" width="246" height="42" rx="2" fill="#0B0F19" stroke="#1e293b" />
                  <polyline fill="none" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.55" points={wave1Pts.join(' ')} />
                  <polyline fill="none" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.55" points={wave2Pts.join(' ')} />
                  <polyline fill="none" stroke="#10b981" strokeWidth="1.8" points={sumWavePts.join(' ')} />
                  <text x="20" y="182" fill="#34d399" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    E₁+E₂ Superposition (Δφ = {phaseMismatchRad.toFixed(2)} rad)
                  </text>

                  {/* Viewport B Background: Bragg-Brentano Goniometer Circle */}
                  <rect x="276" y="6" width="263" height="216" rx="3" fill="#070A12" stroke="#1e293b" />
                  <text x="286" y="22" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    B. BRAGG-BRENTANO θ/2θ PARAFOCUSING CIRCLE
                  </text>

                  {/* Goniometer Circle */}
                  <circle
                    cx={gCx}
                    cy={gCy}
                    r={gR}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1.4"
                    strokeDasharray="4 3"
                  />

                  {/* Ideal vs Displaced Sample Stage */}
                  <line x1={gCx - 38} y1={gCy} x2={gCx + 38} y2={gCy} stroke="#475569" strokeWidth="2" />
                  {Math.abs(sampleDisplacement) > 0.001 && (
                    <line
                      x1={gCx - 38}
                      y1={gCy + dispPx}
                      x2={gCx + 38}
                      y2={gCy + dispPx}
                      stroke="#10b981"
                      strokeWidth="2.2"
                    />
                  )}

                  {/* Incident k_i and Scattered k_f rays on Goniometer */}
                  <line x1={gSrcX} y1={gSrcY} x2={gCx} y2={gCy + dispPx} stroke="#38bdf8" strokeWidth="2" />
                  <line x1={gCx} y1={gCy + dispPx} x2={gDetX} y2={gDetY} stroke="#22d3ee" strokeWidth="2" />

                  {/* Momentum Transfer Vector Q = k_f - k_i */}
                  <line x1={gCx} y1={gCy} x2={gCx} y2={gCy - 48} stroke="#f43f5e" strokeWidth="2" />
                  <polygon points={`${gCx},${gCy - 54} ${gCx - 3.5},${gCy - 46} ${gCx + 3.5},${gCy - 46}`} fill="#f43f5e" />
                  <text x={gCx + 6} y={gCy - 42} fill="#fb7185" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    Q = 4πsinθ/λ
                  </text>

                  {/* Source & Detector Nodes on Circle */}
                  <circle cx={gSrcX} cy={gSrcY} r="5" fill="#38bdf8" />
                  <text x={gSrcX - 8} y={gSrcY - 8} textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    X-Ray Tube
                  </text>
                  <circle cx={gDetX} cy={gDetY} r="5" fill="#22d3ee" />
                  <text x={gDetX + 6} y={gDetY - 8} textAnchor="middle" fill="#22d3ee" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    Detector (2θ)
                  </text>

                  {/* Telemetry Footer in Viewport B */}
                  <text x="288" y="198" fill="#cbd5e1" fontSize="8.5" fontFamily="monospace">
                    R = {goniometerRadius} mm · Peak ({activePeak.hkl || 'hkl'}) 2θ = {activePeak.twoTheta.toFixed(2)}°
                  </text>
                  <text x="288" y="212" fill="#fbbf24" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    Total Aberration Δ(2θ) = {inducedDegShift >= 0 ? `+${inducedDegShift.toFixed(4)}` : inducedDegShift.toFixed(4)}°
                  </text>
                </svg>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
