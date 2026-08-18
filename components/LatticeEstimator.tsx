import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Compass, 
  HelpCircle, 
  Cpu, 
  Layers, 
  CheckCircle, 
  Activity, 
  Zap, 
  Boxes,
  Database,
  ArrowRight,
  RefreshCw,
  Info,
  Sliders,
  Eye,
  EyeOff,
  Minimize2,
  ChevronRight,
  Grid,
  Sparkles,
  BookOpen,
  LineChart as LineChartIcon,
  Maximize2,
  Flame,
  Scale,
  Award,
  Search,
  Check,
  X,
  SlidersHorizontal,
  Table,
  ShieldCheck,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Copy
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Scatter, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';
import { ScientificMathControl } from './ScientificMathControl';
import { 
  SPACE_GROUPS_DATABASE, 
  SpaceGroupInfo, 
  checkExtinction, 
  evaluateSpaceGroupCandidates,
  calculateMultiplicity,
  ExtinctionCheckResult
} from '../utils/spaceGroupExtinctionEngine';
import { 
  runCohenLeastSquaresRefinement, 
  CrystalSystemType, 
  SystematicErrorFunction, 
  WeightingModel,
  RefinementPeak,
  CohenRefinementResult
} from '../utils/cohenLeastSquaresRefinement';

interface LatticeEstimatorProps {
  results: BraggResult[];
}

export type CrystalSystem = CrystalSystemType;
export type BravaisLatticeType = 'P' | 'I' | 'F' | 'A' | 'B' | 'C' | 'R';
type ProjectionPlane = 'XY' | 'XZ' | 'YZ';
type WorkbenchTab = 'refinement' | 'extinctions' | 'spacegroup_finder' | 'reciprocal_probe' | 'hkl_calculator';

export interface ReferenceMaterial {
  id: string;
  name: string;
  system: CrystalSystem;
  bravais: BravaisLatticeType;
  spaceGroupNumber: number;
  spaceGroupSymbol: string;
  a: number;
  b: number;
  c: number;
  beta: number;
  molarMass: number;
  atomsPerCell: number;
}

export const REFERENCE_MATERIALS: ReferenceMaterial[] = [
  { id: 'si', name: 'Silicon (Si)', system: 'Cubic', bravais: 'F', spaceGroupNumber: 227, spaceGroupSymbol: 'Fd-3m', a: 5.4310, b: 5.4310, c: 5.4310, beta: 90, molarMass: 28.085, atomsPerCell: 8 },
  { id: 'au', name: 'Gold (Au)', system: 'Cubic', bravais: 'F', spaceGroupNumber: 225, spaceGroupSymbol: 'Fm-3m', a: 4.0782, b: 4.0782, c: 4.0782, beta: 90, molarMass: 196.97, atomsPerCell: 4 },
  { id: 'cu', name: 'Copper (Cu)', system: 'Cubic', bravais: 'F', spaceGroupNumber: 225, spaceGroupSymbol: 'Fm-3m', a: 3.6149, b: 3.6149, c: 3.6149, beta: 90, molarMass: 63.546, atomsPerCell: 4 },
  { id: 'al', name: 'Aluminum (Al)', system: 'Cubic', bravais: 'F', spaceGroupNumber: 225, spaceGroupSymbol: 'Fm-3m', a: 4.0495, b: 4.0495, c: 4.0495, beta: 90, molarMass: 26.982, atomsPerCell: 4 },
  { id: 'fe', name: 'Iron (α-Fe)', system: 'Cubic', bravais: 'I', spaceGroupNumber: 229, spaceGroupSymbol: 'Im-3m', a: 2.8665, b: 2.8665, c: 2.8665, beta: 90, molarMass: 55.845, atomsPerCell: 2 },
  { id: 'nacl', name: 'Rocksalt (NaCl)', system: 'Cubic', bravais: 'F', spaceGroupNumber: 225, spaceGroupSymbol: 'Fm-3m', a: 5.6402, b: 5.6402, c: 5.6402, beta: 90, molarMass: 58.44, atomsPerCell: 4 },
  { id: 'srtio3', name: 'Strontium Titanate (SrTiO₃)', system: 'Cubic', bravais: 'P', spaceGroupNumber: 221, spaceGroupSymbol: 'Pm-3m', a: 3.9050, b: 3.9050, c: 3.9050, beta: 90, molarMass: 183.49, atomsPerCell: 1 },
  { id: 'gaas', name: 'Gallium Arsenide (GaAs)', system: 'Cubic', bravais: 'F', spaceGroupNumber: 216, spaceGroupSymbol: 'F-43m', a: 5.6533, b: 5.6533, c: 5.6533, beta: 90, molarMass: 144.64, atomsPerCell: 4 },
  { id: 'c', name: 'Diamond (C)', system: 'Cubic', bravais: 'F', spaceGroupNumber: 227, spaceGroupSymbol: 'Fd-3m', a: 3.5670, b: 3.5670, c: 3.5670, beta: 90, molarMass: 12.011, atomsPerCell: 8 },
  { id: 'tio2', name: 'Rutile (TiO₂)', system: 'Tetragonal', bravais: 'P', spaceGroupNumber: 136, spaceGroupSymbol: 'P4_2/mnm', a: 4.5937, b: 4.5937, c: 2.9587, beta: 90, molarMass: 79.866, atomsPerCell: 2 },
  { id: 'anatase', name: 'Anatase (TiO₂)', system: 'Tetragonal', bravais: 'I', spaceGroupNumber: 141, spaceGroupSymbol: 'I4_1/amd', a: 3.7845, b: 3.7845, c: 9.5143, beta: 90, molarMass: 79.866, atomsPerCell: 4 },
  { id: 'ti', name: 'Titanium (α-Ti)', system: 'Hexagonal', bravais: 'P', spaceGroupNumber: 194, spaceGroupSymbol: 'P6_3/mmc', a: 2.9508, b: 2.9508, c: 4.6855, beta: 90, molarMass: 47.867, atomsPerCell: 2 },
  { id: 'zno', name: 'Zinc Oxide (ZnO)', system: 'Hexagonal', bravais: 'P', spaceGroupNumber: 186, spaceGroupSymbol: 'P6_3mc', a: 3.2495, b: 3.2495, c: 5.2069, beta: 90, molarMass: 81.38, atomsPerCell: 2 },
  { id: 'al2o3', name: 'Sapphire / Corundum (α-Al₂O₃)', system: 'Trigonal', bravais: 'R', spaceGroupNumber: 167, spaceGroupSymbol: 'R-3c', a: 4.7580, b: 4.7580, c: 12.9910, beta: 90, molarMass: 101.96, atomsPerCell: 6 },
  { id: 'pnma_perov', name: 'Orthorhombic Perovskite (CaTiO₃)', system: 'Orthorhombic', bravais: 'P', spaceGroupNumber: 62, spaceGroupSymbol: 'Pnma', a: 5.3800, b: 7.6400, c: 5.4400, beta: 90, molarMass: 135.94, atomsPerCell: 4 },
  { id: 'zro2_m', name: 'Monoclinic Zirconia (m-ZrO₂)', system: 'Monoclinic', bravais: 'P', spaceGroupNumber: 14, spaceGroupSymbol: 'P2_1/c', a: 5.1500, b: 5.2120, c: 5.3170, beta: 99.23, molarMass: 123.22, atomsPerCell: 4 }
];

// Helper to parse individual HKL strings
const parseSingleHKL = (hklStr: string): [number, number, number] | null => {
  if (!hklStr) return null;
  const clean = hklStr.replace(/[()]/g, '').trim();
  
  const parts = clean.split(/[\s,]+/).filter(x => x !== '');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const k = parseInt(parts[1], 10);
    const l = parseInt(parts[2], 10);
    if (!isNaN(h) && !isNaN(k) && !isNaN(l)) {
      return [h, k, l];
    }
  }
  
  const matches = clean.match(/^([+-]?\d)([+-]?\d)([+-]?\d)$/);
  if (matches) {
    const h = parseInt(matches[1], 10);
    const k = parseInt(matches[2], 10);
    const l = parseInt(matches[3], 10);
    return [h, k, l];
  }
  
  return null;
};

export const LatticeEstimator: React.FC<LatticeEstimatorProps> = ({ results }) => {
  const { t } = useTranslation();
  const { precision } = useSettings();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('refinement');

  // Refinement Configuration
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystem>('Cubic');
  const [selectedSpaceGroupNumber, setSelectedSpaceGroupNumber] = useState<number>(227); // Default Si Fd-3m
  const [systematicError, setSystematicError] = useState<SystematicErrorFunction>('nelson_riley');
  const [weightingModel, setWeightingModel] = useState<WeightingModel>('statistical');
  const [monoclinicBeta, setMonoclinicBeta] = useState<number>(99.2);
  const [selectedRefMaterial, setSelectedRefMaterial] = useState<string>('si');
  const [selectedReflectionIndex, setSelectedReflectionIndex] = useState<number>(0);

  // Space Group & Extinction Finder State
  const [sgSearchQuery, setSgSearchQuery] = useState<string>('');
  const [sgFilterSystem, setSgFilterSystem] = useState<string>('All');
  const [extinctionFilter, setExtinctionFilter] = useState<'ALL' | 'ALLOWED' | 'EXTINCT'>('ALL');

  // Interactive HKL Probe State
  const [probeH, setProbeH] = useState<number>(2);
  const [probeK, setProbeK] = useState<number>(0);
  const [probeL, setProbeL] = useState<number>(0);

  // Reciprocal Metric & Interplanar Angle State
  const [plane1, setPlane1] = useState<[number, number, number]>([1, 1, 1]);
  const [plane2, setPlane2] = useState<[number, number, number]>([2, 0, 0]);
  const [targetDSpacing, setTargetDSpacing] = useState<string>('');

  // 2D Projection Settings
  const [projection, setProjection] = useState<ProjectionPlane>('XY');
  const [showAtoms, setShowAtoms] = useState<boolean>(true);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);

  // Extract reflections with valid, non-zero parsed HKL values
  const validReflections = useMemo(() => {
    return results
      .map((r, idx) => {
        const hkl = r.hkl ? parseSingleHKL(r.hkl) : null;
        return {
          original: r,
          id: `peak-${idx}`,
          hkl,
        };
      })
      .filter((item): item is { original: BraggResult; id: string; hkl: [number, number, number] } => {
        if (!item.hkl) return false;
        const [h, k, l] = item.hkl;
        return h !== 0 || k !== 0 || l !== 0;
      });
  }, [results]);

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedReflectionIndex >= validReflections.length) {
      setSelectedReflectionIndex(Math.max(0, validReflections.length - 1));
    }
  }, [validReflections, selectedReflectionIndex]);

  // Active space group object
  const currentSpaceGroup = useMemo<SpaceGroupInfo>(() => {
    return SPACE_GROUPS_DATABASE.find(s => s.number === selectedSpaceGroupNumber) || SPACE_GROUPS_DATABASE[0];
  }, [selectedSpaceGroupNumber]);

  // Synchronize space group and crystal system when preset selected
  const handleApplyPreset = (refId: string) => {
    const mat = REFERENCE_MATERIALS.find(m => m.id === refId);
    if (!mat) return;
    setSelectedRefMaterial(refId);
    setCrystalSystem(mat.system);
    setSelectedSpaceGroupNumber(mat.spaceGroupNumber);
    setMonoclinicBeta(mat.beta || 90);
  };

  // Convert valid reflections to Refinement Peaks format
  const refinementPeaks = useMemo<RefinementPeak[]>(() => {
    return validReflections.map(rf => ({
      id: rf.id,
      twoThetaObs: rf.original.twoTheta,
      dObs: rf.original.dSpacing,
      h: rf.hkl[0],
      k: rf.hkl[1],
      l: rf.hkl[2],
      intensity: rf.original.intensity
    }));
  }, [validReflections]);

  // Mean experimental wavelength
  const meanWavelength = useMemo(() => {
    if (validReflections.length === 0) return 1.54059;
    const wls = validReflections
      .map(r => {
        if (!r.original.sinThetaOverLambda || r.original.sinThetaOverLambda <= 0) return 1.54059;
        const thetaRad = (r.original.twoTheta / 2) * (Math.PI / 180);
        return Math.sin(thetaRad) / r.original.sinThetaOverLambda;
      })
      .filter(w => !isNaN(w) && w > 0.1 && w < 10);
    return wls.length > 0 ? wls.reduce((a, b) => a + b, 0) / wls.length : 1.54059;
  }, [validReflections]);

  // Execute High-Precision Cohen's Least-Squares Cell Refinement
  const refinementResult = useMemo<CohenRefinementResult>(() => {
    return runCohenLeastSquaresRefinement(
      refinementPeaks,
      meanWavelength,
      crystalSystem,
      systematicError,
      weightingModel,
      monoclinicBeta
    );
  }, [refinementPeaks, meanWavelength, crystalSystem, systematicError, weightingModel, monoclinicBeta]);

  // Evaluate All Systematic Extinctions on the Current Peak Dataset
  const peakExtinctionAudits = useMemo(() => {
    return validReflections.map(rf => {
      const [h, k, l] = rf.hkl;
      const res = checkExtinction(h, k, l, currentSpaceGroup);
      return {
        reflection: rf,
        extinction: res
      };
    });
  }, [validReflections, currentSpaceGroup]);

  // Live Space Group Inversion & Candidate Evaluator
  const spaceGroupCandidates = useMemo(() => {
    const inputRefls = validReflections.map(rf => ({
      hkl: rf.hkl,
      twoTheta: rf.original.twoTheta,
      intensity: rf.original.intensity
    }));
    return evaluateSpaceGroupCandidates(inputRefls, sgFilterSystem);
  }, [validReflections, sgFilterSystem]);

  // Probe Evaluation for Interactive (hkl) Calculator
  const probeExtinctionResult = useMemo<ExtinctionCheckResult>(() => {
    return checkExtinction(probeH, probeK, probeL, currentSpaceGroup);
  }, [probeH, probeK, probeL, currentSpaceGroup]);

  // Reciprocal Metric Tensor [G*] and Direct Metric Tensor [G]
  const metricTensor = useMemo(() => {
    const a = refinementResult.parameters.a.value || 5.0;
    const b = refinementResult.parameters.b.value || a;
    const c = refinementResult.parameters.c.value || a;
    const alphaRad = (refinementResult.parameters.alpha.value * Math.PI) / 180;
    const betaRad = (refinementResult.parameters.beta.value * Math.PI) / 180;
    const gammaRad = (refinementResult.parameters.gamma.value * Math.PI) / 180;

    // Direct Metric Tensor G
    const G = [
      [a * a, a * b * Math.cos(gammaRad), a * c * Math.cos(betaRad)],
      [a * b * Math.cos(gammaRad), b * b, b * c * Math.cos(alphaRad)],
      [a * c * Math.cos(betaRad), b * c * Math.cos(alphaRad), c * c]
    ];

    const vol = refinementResult.parameters.volume.value || 1.0;
    const volStar = 1 / vol;

    // Reciprocal cell constants
    const aStar = (b * c * Math.sin(alphaRad)) / vol;
    const bStar = (a * c * Math.sin(betaRad)) / vol;
    const cStar = (a * b * Math.sin(gammaRad)) / vol;

    const cosAlphaStar = (Math.cos(betaRad) * Math.cos(gammaRad) - Math.cos(alphaRad)) / (Math.sin(betaRad) * Math.sin(gammaRad));
    const cosBetaStar = (Math.cos(alphaRad) * Math.cos(gammaRad) - Math.cos(betaRad)) / (Math.sin(alphaRad) * Math.sin(gammaRad));
    const cosGammaStar = (Math.cos(alphaRad) * Math.cos(betaRad) - Math.cos(gammaRad)) / (Math.sin(alphaRad) * Math.sin(betaRad));

    // Reciprocal Metric Tensor G*
    const GStar = [
      [aStar * aStar, aStar * bStar * cosGammaStar, aStar * cStar * cosBetaStar],
      [aStar * bStar * cosGammaStar, bStar * bStar, bStar * cStar * cosAlphaStar],
      [aStar * cStar * cosBetaStar, bStar * cStar * cosAlphaStar, cStar * cStar]
    ];

    return {
      G,
      GStar,
      vol,
      volStar,
      aStar,
      bStar,
      cStar
    };
  }, [refinementResult]);

  // Interplanar Angle (phi) using Reciprocal Metric Tensor G*
  const interplanarAngle = useMemo(() => {
    const [h1, k1, l1] = plane1;
    const [h2, k2, l2] = plane2;

    if (h1 === 0 && k1 === 0 && l1 === 0) return null;
    if (h2 === 0 && k2 === 0 && l2 === 0) return null;

    const { GStar } = metricTensor;

    // Dot product h1^T G* h2
    const dot = 
      h1 * (GStar[0][0]*h2 + GStar[0][1]*k2 + GStar[0][2]*l2) +
      k1 * (GStar[1][0]*h2 + GStar[1][1]*k2 + GStar[1][2]*l2) +
      l1 * (GStar[2][0]*h2 + GStar[2][1]*k2 + GStar[2][2]*l2);

    const mag1Sq = 
      h1 * (GStar[0][0]*h1 + GStar[0][1]*k1 + GStar[0][2]*l1) +
      k1 * (GStar[1][0]*h1 + GStar[1][1]*k1 + GStar[1][2]*l1) +
      l1 * (GStar[2][0]*h1 + GStar[2][1]*k1 + GStar[2][2]*l1);

    const mag2Sq = 
      h2 * (GStar[0][0]*h2 + GStar[0][1]*k2 + GStar[0][2]*l2) +
      k2 * (GStar[1][0]*h2 + GStar[1][1]*k2 + GStar[1][2]*l2) +
      l2 * (GStar[2][0]*h2 + GStar[2][1]*k2 + GStar[2][2]*l2);

    if (mag1Sq <= 0 || mag2Sq <= 0) return null;

    const cosPhi = Math.max(-1, Math.min(1, dot / Math.sqrt(mag1Sq * mag2Sq)));
    const angleDeg = (Math.acos(cosPhi) * 180) / Math.PI;

    // Zone axis [uvw] = h1 x h2
    const u = k1 * l2 - l1 * k2;
    const v = l1 * h2 - h1 * l2;
    const w = h1 * k2 - k1 * h2;

    return {
      angleDeg,
      cosPhi,
      zoneAxis: [u, v, w],
      d1: 1 / Math.sqrt(mag1Sq),
      d2: 1 / Math.sqrt(mag2Sq)
    };
  }, [plane1, plane2, metricTensor]);

  // Selected reflection metadata
  const activeReflection = useMemo(() => {
    if (!refinementResult.reflections || refinementResult.reflections.length === 0) return null;
    return refinementResult.reflections[selectedReflectionIndex] || refinementResult.reflections[0];
  }, [refinementResult, selectedReflectionIndex]);

  // Theoretical Allowed Reflection Series Generator
  const theoreticalAllowedSeries = useMemo(() => {
    const a = refinementResult.parameters.a.value || 5.0;
    const b = refinementResult.parameters.b.value || a;
    const c = refinementResult.parameters.c.value || a;
    const { GStar } = metricTensor;

    const list: {
      hkl: [number, number, number];
      hklStr: string;
      dSpacing: number;
      twoTheta: number;
      multiplicity: number;
      lpFactor: number;
      allowed: boolean;
      status: string;
    }[] = [];

    const maxIdx = 4;
    for (let h = 0; h <= maxIdx; h++) {
      for (let k = 0; k <= maxIdx; k++) {
        for (let l = 0; l <= maxIdx; l++) {
          if (h === 0 && k === 0 && l === 0) continue;
          
          const sSq = 
            h * (GStar[0][0]*h + GStar[0][1]*k + GStar[0][2]*l) +
            k * (GStar[1][0]*h + GStar[1][1]*k + GStar[1][2]*l) +
            l * (GStar[2][0]*h + GStar[2][1]*k + GStar[2][2]*l);

          if (sSq <= 0) continue;
          const d = 1 / Math.sqrt(sSq);
          const sinTheta = meanWavelength / (2 * d);
          if (sinTheta > 0.999) continue; // Out of 2theta range

          const thetaRad = Math.asin(sinTheta);
          const twoTheta = thetaRad * 2 * (180 / Math.PI);
          const cosTheta = Math.cos(thetaRad);

          // Lorentz-polarization factor: (1 + cos^2(2theta)) / (sin^2(theta) * cos(theta))
          const cos2T = Math.cos(2 * thetaRad);
          const lp = (1 + cos2T * cos2T) / (Math.pow(sinTheta, 2) * cosTheta);

          const mult = calculateMultiplicity(h, k, l, crystalSystem);
          const extRes = checkExtinction(h, k, l, currentSpaceGroup);

          list.push({
            hkl: [h, k, l],
            hklStr: `(${h} ${k} ${l})`,
            dSpacing: d,
            twoTheta,
            multiplicity: mult,
            lpFactor: lp,
            allowed: extRes.allowed,
            status: extRes.statusLabel
          });
        }
      }
    }

    // Sort by ascending 2theta
    return list.sort((a, b) => a.twoTheta - b.twoTheta);
  }, [refinementResult, metricTensor, meanWavelength, currentSpaceGroup, crystalSystem]);

  if (results.length === 0) {
    return null;
  }

  return (
    <div id="lattice-probe-workbench" className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 pb-5 border-b border-slate-100 dark:border-slate-800/60 gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2.5 tracking-tight uppercase">
            <Boxes className="h-5 w-5 text-indigo-500 shrink-0" />
            LATTICE PROBE & HIGH-PRECISION CELL REFINEMENT WORKBENCH
          </h2>
          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            Cohen's Least-Squares Matrix Solver, International Extinction Rules & Space Group Inversion
          </p>
        </div>

        {/* Primary Sub-Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-x-auto max-w-full">
          {[
            { id: 'refinement', label: 'Cell Refinement', icon: Sliders },
            { id: 'extinctions', label: 'Extinction Audit', icon: ShieldCheck },
            { id: 'spacegroup_finder', label: 'Space Group Finder', icon: Search },
            { id: 'hkl_calculator', label: 'Miller (hkl) Probe', icon: BookOpen },
            { id: 'reciprocal_probe', label: 'Reciprocal Tensor', icon: Compass },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id as WorkbenchTab)}
                className={`px-3 py-2 text-[10px] font-black uppercase rounded-xl transition-all border-none flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {validReflections.length === 0 ? (
        <div className="p-10 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <Info className="h-10 w-10 text-indigo-500/80 mb-3 animate-pulse" />
          <h4 className="text-slate-700 dark:text-slate-200 font-extrabold text-sm uppercase tracking-wider">Crystallographic Assignments Needed</h4>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 max-w-md leading-relaxed font-medium">
            Please map <span className="text-indigo-500 font-bold">Miller Indices (hkl)</span> (e.g., 111, 220, or 311) to identified peak reflections in the metrology dashboard to activate reciprocal space modeling and least-squares unit cell refinements.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Quick Settings & Crystal System Bar */}
          <div className="bg-slate-50/80 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Crystal System Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">System:</span>
                <select
                  id="crystal-system-select"
                  value={crystalSystem}
                  onChange={(e) => setCrystalSystem(e.target.value as CrystalSystem)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {(['Cubic', 'Tetragonal', 'Hexagonal', 'Trigonal', 'Orthorhombic', 'Monoclinic', 'Triclinic'] as CrystalSystem[]).map(sys => (
                    <option key={sys} value={sys}>{sys}</option>
                  ))}
                </select>
              </div>

              {/* Space Group Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Space Group:</span>
                <select
                  id="space-group-select"
                  value={selectedSpaceGroupNumber}
                  onChange={(e) => setSelectedSpaceGroupNumber(Number(e.target.value))}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {SPACE_GROUPS_DATABASE.map(sg => (
                    <option key={sg.number} value={sg.number}>
                      #{sg.number} {sg.symbol} ({sg.crystalSystem})
                    </option>
                  ))}
                </select>
              </div>

              {/* Standard Reference Material Preset */}
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <select
                  id="preset-material-select"
                  value={selectedRefMaterial}
                  onChange={(e) => handleApplyPreset(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {REFERENCE_MATERIALS.map(mat => (
                    <option key={mat.id} value={mat.id}>
                      Preset: {mat.name} ({mat.spaceGroupSymbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Systematic Error & Weighting Scheme Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Drift Model:</span>
                <select
                  id="drift-model-select"
                  value={systematicError}
                  onChange={(e) => setSystematicError(e.target.value as SystematicErrorFunction)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="nelson_riley">Nelson-Riley / Taylor-Sinclair</option>
                  <option value="bradley_jay">Bradley-Jay (cos²θ)</option>
                  <option value="sample_displacement">Sample Displacement</option>
                  <option value="zero_shift">Zero-Shift Offset</option>
                  <option value="none">None (Pure Cell Fit)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Weight:</span>
                <select
                  id="weight-model-select"
                  value={weightingModel}
                  onChange={(e) => setWeightingModel(e.target.value as WeightingModel)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="statistical">Statistical (tan²θ/d²)</option>
                  <option value="inverse_variance">Inverse Variance (1/σ²)</option>
                  <option value="unit">Unit (1.0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: CELL REFINEMENT WORKBENCH */}
          {/* ========================================================================= */}
          {activeTab === 'refinement' && (
            <div className="space-y-6">
              
              {/* Top Parameter Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* a */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Parameter a</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-mono font-black text-slate-800 dark:text-white tabular-nums">
                      {refinementResult.parameters.a.value.toFixed(Math.min(precision + 1, 5))}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Å</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">
                    ± {refinementResult.parameters.a.stdError.toFixed(5)}
                  </span>
                </div>

                {/* b */}
                <div className={`bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between ${
                  crystalSystem === 'Cubic' || crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal' ? 'opacity-50' : ''
                }`}>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Parameter b</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-mono font-black text-slate-800 dark:text-white tabular-nums">
                      {refinementResult.parameters.b.value.toFixed(Math.min(precision + 1, 5))}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Å</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">
                    ± {refinementResult.parameters.b.stdError.toFixed(5)}
                  </span>
                </div>

                {/* c */}
                <div className={`bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between ${
                  crystalSystem === 'Cubic' ? 'opacity-50' : ''
                }`}>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Parameter c</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-mono font-black text-slate-800 dark:text-white tabular-nums">
                      {refinementResult.parameters.c.value.toFixed(Math.min(precision + 1, 5))}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Å</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">
                    ± {refinementResult.parameters.c.stdError.toFixed(5)}
                  </span>
                </div>

                {/* Volume */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Cell Volume V</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {refinementResult.parameters.volume.value.toFixed(Math.min(precision, 4))}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-400">Å³</span>
                  </div>
                  <span className="text-[9px] font-mono text-indigo-400/80 mt-1">
                    ± {refinementResult.parameters.volume.stdError.toFixed(3)}
                  </span>
                </div>

                {/* Reduced Chi-Squared & GoF */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Goodness-of-Fit (GoF)</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-base font-mono font-black tabular-nums ${
                      refinementResult.metrics.gof <= 1.5 ? 'text-emerald-500' : refinementResult.metrics.gof <= 3.0 ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      {refinementResult.metrics.gof.toFixed(3)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">χ_red: {refinementResult.metrics.reducedChiSquared.toFixed(3)}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">
                    DOF = {refinementResult.metrics.degreesOfFreedom}
                  </span>
                </div>

                {/* Profile Residual R_wp */}
                <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Weighted Rwp</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-base font-mono font-black tabular-nums ${
                      refinementResult.metrics.rwpPct < 1.0 ? 'text-emerald-500' : refinementResult.metrics.rwpPct < 5.0 ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      {refinementResult.metrics.rwpPct.toFixed(2)}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">R_Bragg</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">
                    R_B = {refinementResult.metrics.rBraggPct.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Nelson-Riley Extrapolation Plot */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-3xl p-4 relative overflow-hidden">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                      Nelson-Riley / Taylor-Sinclair Error Extrapolation Function F(θ)
                    </h3>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                    <span>Extrapolated a (F=0): <strong className="text-emerald-400">{refinementResult.parameters.a.value.toFixed(5)} Å</strong></span>
                    {refinementResult.parameters.driftParam && (
                      <>
                        <span className="text-slate-600">|</span>
                        <span>Drift Coeff K: {refinementResult.parameters.driftParam.value.toExponential(3)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={refinementResult.nelsonRileyPlotData.map(r => ({
                        F: Number(r.fTheta.toFixed(4)),
                        aExtrap: Number(r.aExtrap.toFixed(5)),
                        hkl: r.hkl,
                        twoTheta: r.twoTheta
                      }))}
                      margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="F" 
                        type="number" 
                        domain={[0, 'auto']} 
                        stroke="#64748b" 
                        fontSize={10} 
                        label={{ value: 'F(θ) = ½(cos²θ/sinθ + cos²θ/θ)', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 9 }}
                      />
                      <YAxis 
                        dataKey="aExtrap" 
                        type="number" 
                        domain={['auto', 'auto']} 
                        stroke="#64748b" 
                        fontSize={10}
                        unit=" Å"
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                        formatter={(val: any) => [`${val} Å`, 'Extrapolated Parameter a']}
                        labelFormatter={(label) => `F(θ) = ${label}`}
                      />
                      <Scatter name="Observed Reflections" dataKey="aExtrap" fill="#6366f1" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Observed vs Calculated Reflections Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Observed vs Refined Reflection Residuals (Δ2θ, Δd)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {refinementResult.reflections.length} reflections refined
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Miller (hkl)</th>
                        <th className="py-2.5 px-3">2θ_obs (°)</th>
                        <th className="py-2.5 px-3">2θ_calc (°)</th>
                        <th className="py-2.5 px-3">Δ2θ (°)</th>
                        <th className="py-2.5 px-3">d_obs (Å)</th>
                        <th className="py-2.5 px-3">d_calc (Å)</th>
                        <th className="py-2.5 px-3">Δd (Å)</th>
                        <th className="py-2.5 px-3">Residual %</th>
                        <th className="py-2.5 px-3">F(θ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {refinementResult.reflections.map((rf, idx) => (
                        <tr 
                          key={rf.id}
                          onClick={() => setSelectedReflectionIndex(idx)}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            selectedReflectionIndex === idx ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-bold' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400 font-bold">{rf.hklString}</td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{rf.twoThetaObs.toFixed(4)}</td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{rf.twoThetaCalc.toFixed(4)}</td>
                          <td className={`py-2 px-3 font-bold ${Math.abs(rf.deltaTwoTheta) < 0.02 ? 'text-emerald-500' : Math.abs(rf.deltaTwoTheta) < 0.08 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {rf.deltaTwoTheta > 0 ? '+' : ''}{rf.deltaTwoTheta.toFixed(4)}
                          </td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{rf.dObs.toFixed(4)}</td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{rf.dCalc.toFixed(4)}</td>
                          <td className="py-2 px-3 text-slate-500">{rf.deltaD > 0 ? '+' : ''}{rf.deltaD.toFixed(5)}</td>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              rf.relativeResidualPct < 0.1 ? 'bg-emerald-500/10 text-emerald-500' : rf.relativeResidualPct < 0.5 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {rf.relativeResidualPct.toFixed(3)}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400">{rf.driftValue.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Variance-Covariance Matrix & Correlation Inspector */}
              {refinementResult.correlationMatrix.length > 0 && (
                <div className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Parameter Correlation Matrix [r_ij]
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-xs font-mono">
                      <thead>
                        <tr>
                          <th className="py-1 px-2 text-slate-400"></th>
                          {refinementResult.parameterNames.map((p, idx) => (
                            <th key={idx} className="py-1 px-2 text-slate-500 dark:text-slate-400 text-[10px]">{p}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {refinementResult.correlationMatrix.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="py-1 px-2 font-bold text-slate-600 dark:text-slate-300 text-[10px]">
                              {refinementResult.parameterNames[rIdx]}
                            </td>
                            {row.map((val, cIdx) => (
                              <td 
                                key={cIdx} 
                                className={`py-1 px-2 text-center rounded ${
                                  rIdx === cIdx 
                                    ? 'font-black text-indigo-500' 
                                    : Math.abs(val) > 0.8 
                                      ? 'bg-rose-500/10 text-rose-500 font-bold' 
                                      : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {val.toFixed(3)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SYSTEMATIC STRUCTURE EXTINCTION AUDIT */}
          {/* ========================================================================= */}
          {activeTab === 'extinctions' && (
            <div className="space-y-6">
              
              {/* Active Space Group Banner */}
              <div className="p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-indigo-500 text-white font-mono text-xs font-black rounded-lg">
                      #{currentSpaceGroup.number}
                    </span>
                    <h3 className="text-base font-black text-slate-800 dark:text-white">
                      Space Group {currentSpaceGroup.symbol} ({currentSpaceGroup.crystalSystem})
                    </h3>
                    <span className="text-xs font-bold text-indigo-400">
                      Point Group: {currentSpaceGroup.pointGroup} | Laue: {currentSpaceGroup.laueClass}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                    {currentSpaceGroup.centeringDescription}
                  </p>
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
                    {(['ALL', 'ALLOWED', 'EXTINCT'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setExtinctionFilter(f)}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg transition-all ${
                          extinctionFilter === f 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-slate-500 dark:text-slate-400 bg-transparent'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Extinction Auditing Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Observed Peaks Extinction & Systematic Absence Audit
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {peakExtinctionAudits.filter(a => a.extinction.allowed).length} Allowed / {peakExtinctionAudits.filter(a => !a.extinction.allowed).length} Extinct
                  </span>
                </div>

                <div className="space-y-3">
                  {peakExtinctionAudits
                    .filter(a => {
                      if (extinctionFilter === 'ALLOWED') return a.extinction.allowed;
                      if (extinctionFilter === 'EXTINCT') return !a.extinction.allowed;
                      return true;
                    })
                    .map((item, idx) => {
                      const { reflection, extinction } = item;
                      const [h, k, l] = reflection.hkl;
                      return (
                        <div 
                          key={idx}
                          className={`p-4 rounded-2xl border transition-all ${
                            extinction.allowed
                              ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                              : 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black ${
                                extinction.allowed
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              }`}>
                                ({h} {k} {l})
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${extinction.allowed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                                    {extinction.statusLabel}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">
                                  2θ = {reflection.original.twoTheta.toFixed(3)}° | d = {reflection.original.dSpacing.toFixed(4)} Å
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Category: {extinction.category.replace('_EXTINCTION', '')}
                            </span>
                          </div>

                          <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-2 bg-white/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            {extinction.ruleExplanation}
                          </p>

                          {/* Specific condition checklist */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2">
                            {extinction.conditionsChecked.map((c, cIdx) => (
                              <span 
                                key={cIdx}
                                className={`text-[9px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                  c.passed 
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                }`}
                              >
                                {c.passed ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                                {c.condition}: {c.reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LIVE SPACE GROUP FINDER & CANDIDATE INVERSION */}
          {/* ========================================================================= */}
          {activeTab === 'spacegroup_finder' && (
            <div className="space-y-6">
              <div className="bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-500" />
                      Space Group Candidate Inversion & Extinction Filter
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Evaluates all observed peak reflections against all 230 space groups to determine crystallographic compatibility.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">System Filter:</span>
                    <select
                      value={sgFilterSystem}
                      onChange={(e) => setSgFilterSystem(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-1.5"
                    >
                      <option value="All">All Systems (1-230)</option>
                      <option value="Cubic">Cubic</option>
                      <option value="Tetragonal">Tetragonal</option>
                      <option value="Hexagonal">Hexagonal</option>
                      <option value="Trigonal">Trigonal</option>
                      <option value="Orthorhombic">Orthorhombic</option>
                      <option value="Monoclinic">Monoclinic</option>
                      <option value="Triclinic">Triclinic</option>
                    </select>
                  </div>
                </div>

                {/* Candidate Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {spaceGroupCandidates.map((cand, idx) => {
                    const isPerfect = cand.compatibilityScore === 100;
                    return (
                      <div
                        key={cand.spaceGroup.number}
                        onClick={() => {
                          setSelectedSpaceGroupNumber(cand.spaceGroup.number);
                          setCrystalSystem(cand.spaceGroup.crystalSystem);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selectedSpaceGroupNumber === cand.spaceGroup.number
                            ? 'ring-2 ring-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 border-indigo-500'
                            : isPerfect
                              ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-black rounded">
                              #{cand.spaceGroup.number}
                            </span>
                            <span className="font-black text-sm text-slate-800 dark:text-slate-100 font-mono">
                              {cand.spaceGroup.symbol}
                            </span>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isPerfect ? 'bg-emerald-500 text-white' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {cand.compatibilityScore.toFixed(0)}% Match
                          </span>
                        </div>

                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                          {cand.spaceGroup.crystalSystem} ({cand.spaceGroup.bravais}-centered) | Point Group {cand.spaceGroup.pointGroup}
                        </div>

                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                          {cand.spaceGroup.centeringDescription}
                        </p>

                        {cand.spaceGroup.famousMaterials && cand.spaceGroup.famousMaterials.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[9px] text-indigo-500 font-bold">
                            Archetypes: {cand.spaceGroup.famousMaterials.slice(0, 2).join(', ')}
                          </div>
                        )}

                        {cand.violations.length > 0 && (
                          <div className="mt-2 text-[9px] font-mono text-rose-500 bg-rose-500/10 p-1.5 rounded">
                            {cand.violations.length} forbidden peak(s) present: ({cand.violations.map(v => v.hkl.join('')).join(', ')})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: INTERACTIVE MILLER (HKL) EXTINCTION PROBE */}
          {/* ========================================================================= */}
          {activeTab === 'hkl_calculator' && (
            <div className="space-y-6">
              <div className="bg-slate-50/60 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Interactive Miller Index (hkl) Extinction & Selection Rule Calculator
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Input any arbitrary Miller plane to calculate its exact extinction status under Space Group #{currentSpaceGroup.number} ({currentSpaceGroup.symbol}).
                    </p>
                  </div>
                </div>

                {/* Miller Index Interactive Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Index h</label>
                    <input
                      id="probe-h-input"
                      type="number"
                      value={probeH}
                      onChange={(e) => setProbeH(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono font-black text-lg rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Index k</label>
                    <input
                      id="probe-k-input"
                      type="number"
                      value={probeK}
                      onChange={(e) => setProbeK(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono font-black text-lg rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Index l</label>
                    <input
                      id="probe-l-input"
                      type="number"
                      value={probeL}
                      onChange={(e) => setProbeL(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono font-black text-lg rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Probe Output Banner */}
                <div className={`p-6 rounded-3xl border transition-all ${
                  probeExtinctionResult.allowed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-black font-mono px-4 py-1.5 rounded-2xl ${
                        probeExtinctionResult.allowed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}>
                        ({probeH} {probeK} {probeL})
                      </span>
                      <div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 block">
                          {probeExtinctionResult.statusLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Multiplicity: {calculateMultiplicity(probeH, probeK, probeL, crystalSystem)}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-500">
                      Space Group: {currentSpaceGroup.symbol} (#{currentSpaceGroup.number})
                    </span>
                  </div>

                  <p className="text-xs font-mono leading-relaxed bg-white/70 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                    {probeExtinctionResult.ruleExplanation}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap gap-3">
                    {probeExtinctionResult.conditionsChecked.map((cond, idx) => (
                      <div 
                        key={idx}
                        className={`text-xs font-mono p-3 rounded-xl border flex-1 min-w-[200px] ${
                          cond.passed
                            ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                            : 'bg-rose-500/5 text-rose-700 dark:text-rose-300 border-rose-500/20'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 mb-1">
                          {cond.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          {cond.type}
                        </div>
                        <div className="text-[10px] opacity-80">{cond.condition}</div>
                        <div className="text-[9px] mt-1 font-semibold">{cond.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theoretical Allowed Series Table for this Space Group */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Theoretical Allowed Reflection Series (2θ ≤ 90°)
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      Generated using a={refinementResult.parameters.a.value.toFixed(4)}Å, λ={meanWavelength.toFixed(4)}Å
                    </span>
                  </div>

                  <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase">
                          <th className="py-2.5 px-3">Miller (hkl)</th>
                          <th className="py-2.5 px-3">2θ_calc (°)</th>
                          <th className="py-2.5 px-3">d_calc (Å)</th>
                          <th className="py-2.5 px-3">Multiplicity</th>
                          <th className="py-2.5 px-3">LP Factor</th>
                          <th className="py-2.5 px-3">Extinction Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {theoreticalAllowedSeries.slice(0, 15).map((item, idx) => (
                          <tr key={idx} className={item.allowed ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through opacity-50'}>
                            <td className="py-2 px-3 font-bold text-indigo-500">{item.hklStr}</td>
                            <td className="py-2 px-3">{item.twoTheta.toFixed(3)}°</td>
                            <td className="py-2 px-3">{item.dSpacing.toFixed(4)}</td>
                            <td className="py-2 px-3">{item.multiplicity}</td>
                            <td className="py-2 px-3">{item.lpFactor.toFixed(2)}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.allowed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: RECIPROCAL TENSOR & METROLOGY PROBE */}
          {/* ========================================================================= */}
          {activeTab === 'reciprocal_probe' && (
            <div className="space-y-6">
              
              {/* Direct & Reciprocal Metric Tensor Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Direct Metric Tensor [G] */}
                <div className="bg-slate-50/60 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        Direct Metric Tensor [G]
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">det(G) = V² = {(metricTensor.vol**2).toFixed(3)} Å⁶</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
                      {metricTensor.G.map((row, rIdx) => 
                        row.map((val, cIdx) => (
                          <div key={`${rIdx}-${cIdx}`} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[9px] text-slate-400 block font-sans">g_{rIdx+1}{cIdx+1}</span>
                            <span className="font-black text-slate-800 dark:text-slate-100">{val.toFixed(4)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Reciprocal Metric Tensor [G*] */}
                <div className="bg-slate-50/60 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        Reciprocal Metric Tensor [G*]
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">det(G*) = V*² = {(metricTensor.volStar**2).toExponential(3)} Å⁻⁶</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
                      {metricTensor.GStar.map((row, rIdx) => 
                        row.map((val, cIdx) => (
                          <div key={`${rIdx}-${cIdx}`} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[9px] text-indigo-400 block font-sans">g*_{rIdx+1}{cIdx+1}</span>
                            <span className="font-black text-indigo-600 dark:text-indigo-400">{val.toFixed(5)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interplanar Angle & Zone Axis Metrology */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Interplanar Angle (ϕ) & Zone Axis [uvw] Metrology
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Plane 1 */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block mb-2">Plane 1 (h₁ k₁ l₁)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={plane1[0]}
                        onChange={(e) => setPlane1([parseInt(e.target.value, 10) || 0, plane1[1], plane1[2]])}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-center font-bold text-sm rounded-xl py-1.5"
                      />
                      <input
                        type="number"
                        value={plane1[1]}
                        onChange={(e) => setPlane1([plane1[0], parseInt(e.target.value, 10) || 0, plane1[2]])}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-center font-bold text-sm rounded-xl py-1.5"
                      />
                      <input
                        type="number"
                        value={plane1[2]}
                        onChange={(e) => setPlane1([plane1[0], plane1[1], parseInt(e.target.value, 10) || 0])}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-center font-bold text-sm rounded-xl py-1.5"
                      />
                    </div>
                  </div>

                  {/* Plane 2 */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block mb-2">Plane 2 (h₂ k₂ l₂)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={plane2[0]}
                        onChange={(e) => setPlane2([parseInt(e.target.value, 10) || 0, plane2[1], plane2[2]])}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-center font-bold text-sm rounded-xl py-1.5"
                      />
                      <input
                        type="number"
                        value={plane2[1]}
                        onChange={(e) => setPlane2([plane2[0], parseInt(e.target.value, 10) || 0, plane2[2]])}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-center font-bold text-sm rounded-xl py-1.5"
                      />
                      <input
                        type="number"
                        value={plane2[2]}
                        onChange={(e) => setPlane2([plane2[0], plane2[1], parseInt(e.target.value, 10) || 0])}
                        className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-center font-bold text-sm rounded-xl py-1.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Angle Result Display */}
                {interplanarAngle && (
                  <div className="mt-5 p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">
                        Exact Interplanar Angle (ϕ)
                      </span>
                      <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {interplanarAngle.angleDeg.toFixed(3)}°
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        cos(ϕ) = {interplanarAngle.cosPhi.toFixed(5)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        Zone Axis [uvw] = h₁ × h₂
                      </span>
                      <div className="text-xl font-black font-mono text-slate-800 dark:text-white">
                        [{interplanarAngle.zoneAxis.join(' ')}]
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Weiss Zone Law: h·u + k·v + l·w = 0
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2D Unit Cell Projection Visualizer */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                  Real-Space Unit Cell 2D Projection & Lattice Planes
                </h3>
              </div>

              {/* Viewplane Projection Toggles */}
              <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
                {(['XY', 'XZ', 'YZ'] as ProjectionPlane[]).map(plane => (
                  <button
                    key={plane}
                    type="button"
                    onClick={() => setProjection(plane)}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded transition-all ${
                      projection === plane
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 bg-transparent'
                    }`}
                  >
                    {plane} Plane
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center p-4 max-h-[260px] w-full bg-slate-950/80 rounded-2xl border border-slate-800">
              <LatticeVisualizer
                system={crystalSystem}
                a={refinementResult.parameters.a.value}
                b={refinementResult.parameters.b.value}
                c={refinementResult.parameters.c.value}
                projection={projection}
                hkl={activeReflection?.hkl || [1, 1, 1]}
                dSpacing={activeReflection?.dObs || 0}
                showAtoms={showAtoms}
                showGrid={showGridLines}
                bravais={currentSpaceGroup.bravais}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

// =========================================================================
// SVG Dynamic 2D Real-Space Lattice & Miller Plane Visualizer
// =========================================================================
interface LatticeVisualizerProps {
  system: CrystalSystem;
  a: number;
  b: number;
  c: number;
  projection: ProjectionPlane;
  hkl: [number, number, number];
  dSpacing: number;
  showAtoms: boolean;
  showGrid: boolean;
  bravais: BravaisLatticeType;
}

export const LatticeVisualizer: React.FC<LatticeVisualizerProps> = ({
  system,
  a,
  b,
  c,
  projection,
  hkl,
  dSpacing,
  showAtoms,
  showGrid,
  bravais
}) => {
  const width = 280;
  const height = 240;
  const origin: [number, number] = [width / 2 - 20, height / 2 + 10];

  let dim1 = a;
  let dim2 = a;
  let axisLabel1 = 'a';
  let axisLabel2 = 'b';
  let h_proj = hkl[0];
  let k_proj = hkl[1];

  if (projection === 'XY') {
    dim1 = a;
    dim2 = b;
    axisLabel1 = 'a';
    axisLabel2 = 'b';
    h_proj = hkl[0];
    k_proj = hkl[1];
  } else if (projection === 'XZ') {
    dim1 = a;
    dim2 = c;
    axisLabel1 = 'a';
    axisLabel2 = 'c';
    h_proj = hkl[0];
    k_proj = hkl[2];
  } else if (projection === 'YZ') {
    dim1 = b;
    dim2 = c;
    axisLabel1 = 'b';
    axisLabel2 = 'c';
    h_proj = hkl[1];
    k_proj = hkl[2];
  }

  const maxDim = Math.max(dim1, dim2, 3.0);
  const scale = 80 / maxDim;

  const basisVectors = useMemo(() => {
    let angle = Math.PI / 2;
    if (system === 'Hexagonal' || system === 'Trigonal') {
      if (projection === 'XY') {
        angle = (120 * Math.PI) / 180;
      }
    }

    const vec1: [number, number] = [dim1 * scale, 0];
    const vec2: [number, number] = [
      dim2 * scale * Math.cos(angle - Math.PI / 2),
      -dim2 * scale * Math.sin(angle - Math.PI / 2)
    ];

    return { vec1, vec2 };
  }, [dim1, dim2, scale, system, projection]);

  const latticePoints = useMemo(() => {
    const pts: [number, number][] = [
      [0, 0], [1, 0], [0, 1], [1, 1]
    ];

    if (bravais === 'I') {
      pts.push([0.5, 0.5]);
    } else if (bravais === 'F') {
      pts.push([0.5, 0.5], [0.5, 0], [0, 0.5], [1, 0.5], [0.5, 1]);
    } else if (bravais === 'C' && projection === 'XY') {
      pts.push([0.5, 0.5]);
    }

    return pts;
  }, [bravais, projection]);

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      <defs>
        <filter id="atomGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Grid Mesh */}
      {showGrid && (
        <g stroke="#334155" strokeWidth="0.5" opacity="0.4">
          <line x1={origin[0]} y1={origin[1]} x2={origin[0] + basisVectors.vec1[0]} y2={origin[1] + basisVectors.vec1[1]} />
          <line x1={origin[0]} y1={origin[1]} x2={origin[0] + basisVectors.vec2[0]} y2={origin[1] + basisVectors.vec2[1]} />
          <line x1={origin[0] + basisVectors.vec1[0]} y1={origin[0] + basisVectors.vec1[1]} x2={origin[0] + basisVectors.vec1[0] + basisVectors.vec2[0]} y2={origin[1] + basisVectors.vec1[1] + basisVectors.vec2[1]} />
          <line x1={origin[0] + basisVectors.vec2[0]} y1={origin[0] + basisVectors.vec2[1]} x2={origin[0] + basisVectors.vec1[0] + basisVectors.vec2[0]} y2={origin[1] + basisVectors.vec2[1] + basisVectors.vec2[1]} />
        </g>
      )}

      {/* Basis Vectors */}
      <g strokeWidth="2">
        <line
          x1={origin[0]}
          y1={origin[1]}
          x2={origin[0] + basisVectors.vec1[0] * 0.8}
          y2={origin[1] + basisVectors.vec1[1] * 0.8}
          stroke="#f59e0b"
        />
        <line
          x1={origin[0]}
          y1={origin[1]}
          x2={origin[0] + basisVectors.vec2[0] * 0.8}
          y2={origin[1] + basisVectors.vec2[1] * 0.8}
          stroke="#10b981"
        />
      </g>

      <text x={origin[0] + basisVectors.vec1[0] * 0.85} y={origin[1] + 12} fill="#f59e0b" fontSize="9" fontWeight="bold">
        {axisLabel1} ({dim1.toFixed(3)}Å)
      </text>
      <text x={origin[0] + basisVectors.vec2[0] * 0.85 - 10} y={origin[1] + basisVectors.vec2[1] * 0.85} fill="#10b981" fontSize="9" fontWeight="bold">
        {axisLabel2} ({dim2.toFixed(3)}Å)
      </text>

      {/* Atoms */}
      {showAtoms && latticePoints.map((pt, idx) => {
        const cx = origin[0] + pt[0] * basisVectors.vec1[0] + pt[1] * basisVectors.vec2[0];
        const cy = origin[1] + pt[0] * basisVectors.vec1[1] + pt[1] * basisVectors.vec2[1];
        const isCorner = pt[0] % 1 === 0 && pt[1] % 1 === 0;

        return (
          <circle
            key={`atom-${idx}`}
            cx={cx}
            cy={cy}
            r={isCorner ? 5.5 : 4}
            fill={isCorner ? "#38bdf8" : "#f472b6"}
            stroke="#ffffff"
            strokeWidth="1.2"
            filter="url(#atomGlow)"
          />
        );
      })}

      {/* Label Badge */}
      <rect
        x="10"
        y={height - 24}
        width={width - 20}
        height="18"
        rx="4"
        fill="#0f172a"
        stroke="#1e293b"
      />
      <text
        x={width / 2}
        y={height - 12}
        textAnchor="middle"
        fill="#a5b4fc"
        fontSize="8"
        fontWeight="black"
        fontFamily="monospace"
      >
        Projection: {projection} | hkl: ({hkl.join(' ')}) | d = {dSpacing.toFixed(4)} Å
      </text>
    </svg>
  );
};
