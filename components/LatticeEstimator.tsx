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
  Copy,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  CheckCircle2
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';
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

  // Nelson-Riley Plot Display Settings
  const [nrPlotAxis, setNrPlotAxis] = useState<'a' | 'c' | 'volume'>('a');
  const [showNrConfidenceInterval, setShowNrConfidenceInterval] = useState<boolean>(true);

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

              {/* Nelson-Riley / Taylor-Sinclair Extrapolation Studio */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-xl">
                {/* Header & Controls */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                        Nelson-Riley / Taylor-Sinclair Error Extrapolation Function F(θ)
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {systematicError === 'nelson_riley' ? '½(cos²θ/sinθ + cos²θ/θ)' : systematicError}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Systematic error scales to zero at <strong className="text-emerald-400">θ = 90° (F(θ) → 0)</strong>, yielding the true unbiased lattice constant at the vertical intercept.
                    </p>
                  </div>

                  {/* Right: Axis Toggle & Quick Stats */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Axis selector (a vs c vs V) */}
                    <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-[10px] font-mono font-bold">
                      <span className="text-slate-500 px-1.5 uppercase">Plot:</span>
                      <button
                        type="button"
                        onClick={() => {
                          playSynthTone('switch');
                          setNrPlotAxis('a');
                        }}
                        className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                          nrPlotAxis === 'a' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        a (Å)
                      </button>

                      {(crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') && (
                        <button
                          type="button"
                          onClick={() => {
                            playSynthTone('switch');
                            setNrPlotAxis('c');
                          }}
                          className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                            nrPlotAxis === 'c' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          c (Å)
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          playSynthTone('switch');
                          setNrPlotAxis('volume');
                        }}
                        className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                          nrPlotAxis === 'volume' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Vol (Å³)
                      </button>
                    </div>

                    {/* Trendline toggle */}
                    <button
                      type="button"
                      onClick={() => setShowNrConfidenceInterval(!showNrConfidenceInterval)}
                      className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        showNrConfidenceInterval
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-black/40 text-slate-500 border-white/5'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      Fit Line
                    </button>
                  </div>
                </div>

                {/* Key Metrics Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 font-mono text-xs">
                  <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">True Extrapolated a₀ (F=0)</span>
                    <span className="text-sm font-black text-emerald-400">
                      {refinementResult.parameters.a.value.toFixed(5)} Å
                    </span>
                    <span className="text-[9px] text-slate-400 block">± {refinementResult.parameters.a.stdError.toFixed(5)} Å</span>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Linear Fit Slope (m = Δa/ΔF)</span>
                    <span className="text-sm font-black text-indigo-300">
                      {refinementResult.nelsonRileyFitMetrics?.slopeA.toExponential(3) || '0.000e+0'}
                    </span>
                    <span className="text-[9px] text-slate-400 block">Drift Gradient</span>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Extrapolation Fit R²</span>
                    <span className="text-sm font-black text-amber-300">
                      {(refinementResult.nelsonRileyFitMetrics?.r2A ?? 0.999).toFixed(4)}
                    </span>
                    <span className="text-[9px] text-slate-400 block">Regression Quality</span>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Cohen Drift Parameter K</span>
                    <span className="text-sm font-black text-purple-300">
                      {refinementResult.parameters.driftParam ? refinementResult.parameters.driftParam.value.toExponential(3) : 'Disabled'}
                    </span>
                    <span className="text-[9px] text-slate-400 block">Matrix Co-refined</span>
                  </div>
                </div>

                {/* Main Interactive Chart */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={refinementResult.nelsonRileyPlotData.map(r => ({
                        F: Number(r.fTheta.toFixed(4)),
                        yVal: nrPlotAxis === 'a' 
                          ? Number(r.aExtrap.toFixed(5)) 
                          : nrPlotAxis === 'c' 
                            ? Number((r.cExtrap || refinementResult.parameters.c.value).toFixed(5))
                            : Number((r.vExtrap || refinementResult.parameters.volume.value).toFixed(4)),
                        fitVal: showNrConfidenceInterval
                          ? (nrPlotAxis === 'a' 
                              ? Number((r.fitLineA ?? refinementResult.parameters.a.value).toFixed(5))
                              : nrPlotAxis === 'c'
                                ? Number(((r.fitLineA ?? refinementResult.parameters.a.value) * (refinementResult.parameters.c.value / refinementResult.parameters.a.value)).toFixed(5))
                                : Number((refinementResult.parameters.volume.value).toFixed(4)))
                          : undefined,
                        hkl: r.hkl,
                        twoTheta: r.twoTheta,
                        dObs: r.dObs
                      })).sort((a, b) => a.F - b.F)}
                      margin={{ top: 10, right: 25, bottom: 25, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="F" 
                        type="number" 
                        domain={[0, 'auto']} 
                        stroke="#64748b" 
                        fontSize={10} 
                        label={{ 
                          value: `Nelson-Riley Error Function F(θ) → [θ=90° at F=0]`, 
                          position: 'insideBottom', 
                          offset: -14, 
                          fill: '#94a3b8', 
                          fontSize: 10,
                          fontWeight: 'bold'
                        }}
                      />
                      <YAxis 
                        dataKey="yVal" 
                        type="number" 
                        domain={['auto', 'auto']} 
                        stroke="#64748b" 
                        fontSize={10}
                        unit={nrPlotAxis === 'volume' ? ' Å³' : ' Å'}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                        formatter={(val: any, name: string) => [
                          `${val} ${nrPlotAxis === 'volume' ? 'Å³' : 'Å'}`, 
                          name === 'fitVal' ? 'Linear Extrapolation Fit' : `Apparent ${nrPlotAxis.toUpperCase()}`
                        ]}
                        labelFormatter={(label) => `F(θ) = ${label}`}
                      />

                      {showNrConfidenceInterval && (
                        <Line
                          type="linear"
                          dataKey="fitVal"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          name="Extrapolation Fit Line"
                        />
                      )}

                      <Scatter 
                        name="Observed Bragg Reflections" 
                        dataKey="yVal" 
                        fill="#818cf8" 
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Bottom Theoretical Insight Note */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Analytical Formula: <code>Δd / d = -K · [cos²θ/sinθ + cos²θ/θ]</code></span>
                  </div>
                  <div className="text-slate-500">
                    Accounts for specimen absorption, beam divergence, and flat-specimen displacement.
                  </div>
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

          {/* Advanced Real-Space Unit Cell 2D Projection & Lattice Planes Studio */}
          <div className="bg-[#030712] border border-indigo-500/20 rounded-3xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

            <LatticeVisualizer
              system={crystalSystem}
              a={refinementResult.parameters.a.value}
              b={refinementResult.parameters.b.value}
              c={refinementResult.parameters.c.value}
              alpha={refinementResult.parameters.alpha.value}
              beta={refinementResult.parameters.beta.value}
              gamma={refinementResult.parameters.gamma.value}
              projection={projection}
              onProjectionChange={setProjection}
              hkl={activeReflection?.hkl || [1, 1, 1]}
              dSpacing={activeReflection?.dObs || (refinementPeaks[0]?.dObs ?? 0)}
              plane1={plane1}
              plane2={plane2}
              interplanarAngle={interplanarAngle}
              bravais={currentSpaceGroup.bravais}
              spaceGroupSymbol={currentSpaceGroup.symbol}
              spaceGroupNumber={currentSpaceGroup.number}
              reflections={validReflections.map(r => ({ id: r.id, hkl: r.hkl, dObs: r.original.dSpacing }))}
              onSelectReflection={setSelectedReflectionIndex}
              selectedIndex={selectedReflectionIndex}
            />
          </div>

        </div>
      )}
    </div>
  );
};

// =========================================================================
// Enhanced SVG Dynamic 2D Real-Space Lattice & Miller Plane Visualizer
// =========================================================================
export interface LatticeVisualizerProps {
  system: CrystalSystem;
  a: number;
  b: number;
  c: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  projection: ProjectionPlane;
  onProjectionChange?: (p: ProjectionPlane) => void;
  hkl: [number, number, number];
  dSpacing: number;
  plane1?: [number, number, number];
  plane2?: [number, number, number];
  interplanarAngle?: { angleDeg: number; cosPhi: number; zoneAxis: number[] | [number, number, number]; d1: number; d2: number } | null;
  bravais: BravaisLatticeType;
  spaceGroupSymbol?: string;
  spaceGroupNumber?: number;
  reflections?: Array<{ id: string; hkl: [number, number, number]; dObs?: number }>;
  onSelectReflection?: (index: number) => void;
  selectedIndex?: number;
}

export const LatticeVisualizer: React.FC<LatticeVisualizerProps> = ({
  system,
  a,
  b,
  c,
  alpha = 90,
  beta = 90,
  gamma = 90,
  projection,
  onProjectionChange,
  hkl,
  dSpacing,
  plane1 = [1, 1, 1],
  plane2 = [2, 0, 0],
  interplanarAngle,
  bravais,
  spaceGroupSymbol,
  spaceGroupNumber,
  reflections,
  onSelectReflection,
  selectedIndex = 0
}) => {
  // Supercell & Display Modes
  const [supercell, setSupercell] = useState<1 | 2 | 3>(2);
  const [planeMode, setPlaneMode] = useState<'active' | 'plane1' | 'plane2' | 'both' | 'custom'>('active');
  const [customHkl, setCustomHkl] = useState<[number, number, number]>([1, 1, 0]);

  // Display Layers
  const [showPlanes, setShowPlanes] = useState<boolean>(true);
  const [showDSpacing, setShowDSpacing] = useState<boolean>(true);
  const [showNormal, setShowNormal] = useState<boolean>(true);
  const [showAtoms, setShowAtoms] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showSubGrid, setShowSubGrid] = useState<boolean>(false);
  const [showAtomCoords, setShowAtomCoords] = useState<boolean>(false);

  // Zoom & Pan
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hovered Atom State for tooltip
  const [hoveredAtom, setHoveredAtom] = useState<{
    u: number;
    v: number;
    screenX: number;
    screenY: number;
    realX: number;
    realY: number;
    type: string;
  } | null>(null);

  // Copy SVG notification
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);

  const svgRef = React.useRef<SVGSVGElement | null>(null);

  // Effective Miller indices based on planeMode
  const activeHkl = useMemo<[number, number, number]>(() => {
    if (planeMode === 'plane1') return plane1;
    if (planeMode === 'plane2') return plane2;
    if (planeMode === 'custom') return customHkl;
    return hkl;
  }, [planeMode, plane1, plane2, customHkl, hkl]);

  // Viewport Dimensions
  const viewWidth = 640;
  const viewHeight = 440;

  // Real-space 2D Projection Dimensions and Angles
  const { dim1, dim2, axis1Name, axis2Name, inPlaneAngleDeg, h_proj1, k_proj1, h_proj2, k_proj2, zoneAxisName } = useMemo(() => {
    let d1 = a;
    let d2 = b;
    let ax1 = 'a';
    let ax2 = 'b';
    let angDeg = gamma;
    let zAxis = '[0 0 1]';

    if (system === 'Hexagonal' || system === 'Trigonal') {
      angDeg = 120;
    } else if (system === 'Monoclinic') {
      angDeg = 90;
    }

    let hp1 = activeHkl[0];
    let kp1 = activeHkl[1];
    let hp2 = plane2[0];
    let kp2 = plane2[1];

    if (projection === 'XY') {
      d1 = a;
      d2 = b;
      ax1 = 'a';
      ax2 = 'b';
      angDeg = (system === 'Hexagonal' || system === 'Trigonal') ? 120 : (gamma || 90);
      hp1 = activeHkl[0];
      kp1 = activeHkl[1];
      hp2 = plane2[0];
      kp2 = plane2[1];
      zAxis = '[0 0 1] (c-axis)';
    } else if (projection === 'XZ') {
      d1 = a;
      d2 = c;
      ax1 = 'a';
      ax2 = 'c';
      angDeg = (system === 'Monoclinic') ? (beta || 99.2) : (beta || 90);
      hp1 = activeHkl[0];
      kp1 = activeHkl[2];
      hp2 = plane2[0];
      kp2 = plane2[2];
      zAxis = '[0 1 0] (b-axis)';
    } else if (projection === 'YZ') {
      d1 = b;
      d2 = c;
      ax1 = 'b';
      ax2 = 'c';
      angDeg = alpha || 90;
      hp1 = activeHkl[1];
      kp1 = activeHkl[2];
      hp2 = plane2[1];
      kp2 = plane2[2];
      zAxis = '[1 0 0] (a-axis)';
    }

    return {
      dim1: d1 || 5.0,
      dim2: d2 || 5.0,
      axis1Name: ax1,
      axis2Name: ax2,
      inPlaneAngleDeg: angDeg,
      h_proj1: hp1,
      k_proj1: kp1,
      h_proj2: hp2,
      k_proj2: kp2,
      zoneAxisName: zAxis
    };
  }, [projection, system, a, b, c, alpha, beta, gamma, activeHkl, plane2]);

  // In-plane angle in radians
  const inPlaneAngleRad = (inPlaneAngleDeg * Math.PI) / 180;

  // Screen scale calculation to fit the supercell neatly
  const { basisVec1, basisVec2, origin, autoScale } = useMemo(() => {
    // 2D basis vectors in unscaled physical units (Å)
    const v1_phys = [dim1, 0];
    const v2_phys = [dim2 * Math.cos(inPlaneAngleRad), -dim2 * Math.sin(inPlaneAngleRad)];

    // Bounding box of supercell in physical Å units
    const corners = [
      [0, 0],
      [supercell * v1_phys[0], 0],
      [supercell * v2_phys[0], supercell * v2_phys[1]],
      [supercell * (v1_phys[0] + v2_phys[0]), supercell * v2_phys[1]]
    ];

    const xs = corners.map(c => c[0]);
    const ys = corners.map(c => c[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const physWidth = Math.max(1.0, maxX - minX);
    const physHeight = Math.max(1.0, maxY - minY);

    // Fit within inner canvas target (approx 440px wide, 280px high)
    const targetW = 420;
    const targetH = 260;
    const s = Math.min(targetW / physWidth, targetH / physHeight) * zoom;

    const bVec1: [number, number] = [v1_phys[0] * s, 0];
    const bVec2: [number, number] = [v2_phys[0] * s, v2_phys[1] * s];

    // Center of the bounding box on screen
    const physCenterX = (minX + maxX) / 2;
    const physCenterY = (minY + maxY) / 2;

    const origX = viewWidth / 2 - physCenterX * s + pan.x;
    const origY = viewHeight / 2 - physCenterY * s + pan.y;

    return {
      basisVec1: bVec1,
      basisVec2: bVec2,
      origin: [origX, origY] as [number, number],
      autoScale: s
    };
  }, [dim1, dim2, inPlaneAngleRad, supercell, zoom, pan, viewWidth, viewHeight]);

  // Coordinate Conversion: Fractional (u, v) -> Screen (x, y)
  const toScreen = (u: number, v: number): [number, number] => {
    const x = origin[0] + u * basisVec1[0] + v * basisVec2[0];
    const y = origin[1] + u * basisVec1[1] + v * basisVec2[1];
    return [x, y];
  };

  // Helper to generate Miller plane traces for any (h_p, k_p) across the [0, supercell] region
  const generatePlaneTraces = (h_p: number, k_p: number, strokeColor: string, isPrimary: boolean) => {
    if (h_p === 0 && k_p === 0) {
      // Parallel to projection plane
      return { lines: [], isParallel: true };
    }

    const nValues: number[] = [];
    const cornerVals = [
      0,
      h_p * supercell,
      k_p * supercell,
      (h_p + k_p) * supercell
    ];
    const nMin = Math.min(...cornerVals) - 1;
    const nMax = Math.max(...cornerVals) + 1;

    for (let n = nMin; n <= nMax; n++) {
      nValues.push(n);
    }

    const lines: Array<{
      n: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      midX: number;
      midY: number;
      isOrigin: boolean;
      isBraggFirst: boolean;
    }> = [];

    nValues.forEach(n => {
      const intersections: [number, number][] = [];
      const eps = 1e-5;

      // 1. Line u = 0 -> k_p * v = n -> v = n / k_p
      if (Math.abs(k_p) > 0) {
        const v = n / k_p;
        if (v >= -eps && v <= supercell + eps) intersections.push([0, Math.max(0, Math.min(supercell, v))]);
      }
      // 2. Line u = supercell -> k_p * v = n - h_p * supercell
      if (Math.abs(k_p) > 0) {
        const v = (n - h_p * supercell) / k_p;
        if (v >= -eps && v <= supercell + eps) intersections.push([supercell, Math.max(0, Math.min(supercell, v))]);
      }
      // 3. Line v = 0 -> h_p * u = n -> u = n / h_p
      if (Math.abs(h_p) > 0) {
        const u = n / h_p;
        if (u >= -eps && u <= supercell + eps) intersections.push([Math.max(0, Math.min(supercell, u)), 0]);
      }
      // 4. Line v = supercell -> h_p * u = n - k_p * supercell
      if (Math.abs(h_p) > 0) {
        const u = (n - k_p * supercell) / h_p;
        if (u >= -eps && u <= supercell + eps) intersections.push([Math.max(0, Math.min(supercell, u)), supercell]);
      }

      // Filter distinct intersections
      const uniquePts: [number, number][] = [];
      for (const pt of intersections) {
        if (!uniquePts.some(p => Math.hypot(p[0] - pt[0], p[1] - pt[1]) < 1e-4)) {
          uniquePts.push(pt);
        }
      }

      if (uniquePts.length >= 2) {
        const [p1, p2] = [uniquePts[0], uniquePts[1]];
        const [sx1, sy1] = toScreen(p1[0], p1[1]);
        const [sx2, sy2] = toScreen(p2[0], p2[1]);

        lines.push({
          n,
          x1: sx1,
          y1: sy1,
          x2: sx2,
          y2: sy2,
          midX: (sx1 + sx2) / 2,
          midY: (sy1 + sy2) / 2,
          isOrigin: n === 0,
          isBraggFirst: n === 1
        });
      }
    });

    return { lines, isParallel: false };
  };

  const primaryTraces = useMemo(() => {
    return generatePlaneTraces(h_proj1, k_proj1, '#06b6d4', true);
  }, [h_proj1, k_proj1, supercell, basisVec1, basisVec2, origin]);

  const secondaryTraces = useMemo(() => {
    if (planeMode !== 'both') return { lines: [], isParallel: false };
    return generatePlaneTraces(h_proj2, k_proj2, '#f43f5e', false);
  }, [planeMode, h_proj2, k_proj2, supercell, basisVec1, basisVec2, origin]);

  // Reciprocal Normal Vector direction g* (perpendicular to plane trace)
  const normalVectorData = useMemo(() => {
    if (primaryTraces.isParallel || primaryTraces.lines.length === 0) return null;

    // Normal vector direction in Cartesian screen coordinates
    // Line direction vector is (dx, dy)
    const line0 = primaryTraces.lines.find(l => l.isOrigin) || primaryTraces.lines[0];
    const dx = line0.x2 - line0.x1;
    const dy = line0.y2 - line0.y1;
    const len = Math.hypot(dx, dy);
    if (len <= 1e-4) return null;

    // Perpendicular vector (-dy, dx) or (dy, -dx) pointing towards n > 0
    let nx = -dy / len;
    let ny = dx / len;

    const line1 = primaryTraces.lines.find(l => l.n === 1);
    if (line1) {
      const vdx = line1.midX - line0.midX;
      const vdy = line1.midY - line0.midY;
      if (nx * vdx + ny * vdy < 0) {
        nx = -nx;
        ny = -ny;
      }
    }

    const startX = origin[0];
    const startY = origin[1];
    const vecLen = 70;
    const endX = startX + nx * vecLen;
    const endY = startY + ny * vecLen;

    return {
      startX,
      startY,
      endX,
      endY,
      nx,
      ny
    };
  }, [primaryTraces, origin]);

  // Interplanar d-spacing bracket calculation
  const dSpacingBracket = useMemo(() => {
    const l0 = primaryTraces.lines.find(l => l.n === 0);
    const l1 = primaryTraces.lines.find(l => l.n === 1);
    if (!l0 || !l1 || !normalVectorData) return null;

    const px0 = origin[0];
    const py0 = origin[1];
    const px1 = origin[0] + normalVectorData.nx * (dSpacing * autoScale);
    const py1 = origin[1] + normalVectorData.ny * (dSpacing * autoScale);

    return {
      x0: px0,
      y0: py0,
      x1: px1,
      y1: py1,
      midX: (px0 + px1) / 2 + normalVectorData.ny * 12,
      midY: (py0 + py1) / 2 - normalVectorData.nx * 12
    };
  }, [primaryTraces, normalVectorData, origin, dSpacing, autoScale]);

  // Atomic Sites Generation across the Supercell
  const atomsList = useMemo(() => {
    const baseSites: Array<{ u: number; v: number; type: 'corner' | 'body' | 'face' | 'basis' }> = [
      { u: 0, v: 0, type: 'corner' },
      { u: 1, v: 0, type: 'corner' },
      { u: 0, v: 1, type: 'corner' },
      { u: 1, v: 1, type: 'corner' }
    ];

    if (bravais === 'I') {
      baseSites.push({ u: 0.5, v: 0.5, type: 'body' });
    } else if (bravais === 'F') {
      baseSites.push(
        { u: 0.5, v: 0.5, type: 'face' },
        { u: 0.5, v: 0, type: 'face' },
        { u: 0, v: 0.5, type: 'face' },
        { u: 1, v: 0.5, type: 'face' },
        { u: 0.5, v: 1, type: 'face' }
      );
    } else if (bravais === 'C' && projection === 'XY') {
      baseSites.push({ u: 0.5, v: 0.5, type: 'face' });
    }

    if (system === 'Hexagonal' || system === 'Trigonal') {
      baseSites.push(
        { u: 1 / 3, v: 2 / 3, type: 'basis' },
        { u: 2 / 3, v: 1 / 3, type: 'basis' }
      );
    }

    const allAtoms: Array<{
      u: number;
      v: number;
      screenX: number;
      screenY: number;
      type: 'corner' | 'body' | 'face' | 'basis';
      id: string;
    }> = [];

    for (let cx = 0; cx < supercell; cx++) {
      for (let cy = 0; cy < supercell; cy++) {
        for (const site of baseSites) {
          const uGlobal = site.u + cx;
          const vGlobal = site.v + cy;
          const [sx, sy] = toScreen(uGlobal, vGlobal);

          // Avoid duplicate atoms at shared unit cell boundaries
          if (!allAtoms.some(a => Math.hypot(a.screenX - sx, a.screenY - sy) < 1.0)) {
            allAtoms.push({
              u: uGlobal,
              v: vGlobal,
              screenX: sx,
              screenY: sy,
              type: site.type,
              id: `atom-${cx}-${cy}-${site.u.toFixed(2)}-${site.v.toFixed(2)}`
            });
          }
        }
      }
    }

    return allAtoms;
  }, [bravais, system, projection, supercell, basisVec1, basisVec2, origin]);

  // Handlers for Pan & Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    playSynthTone('switch');
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    playSynthTone('success');
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unit_cell_2d_${projection}_plane_hkl_${activeHkl.join('_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySvg = () => {
    if (!svgRef.current) return;
    playSynthTone('switch');
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    navigator.clipboard.writeText(svgData);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2500);
  };

  // Projected 2D cell area
  const projectedArea = dim1 * dim2 * Math.sin(inPlaneAngleRad);

  return (
    <div className="space-y-4">
      {/* Top Header & Interactive Mode Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <Grid className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wide">
                Real-Space Unit Cell 2D Projection & Lattice Planes
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                {system} • {spaceGroupSymbol || 'P1'} (#{spaceGroupNumber || 1})
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive crystallographic direct-space plane traces $hu + kv + lw = n$ with atomic sites and metric projection.
            </p>
          </div>
        </div>

        {/* Viewplane Selection Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-2xl border border-white/10 shadow-inner self-stretch sm:self-auto justify-between sm:justify-start">
          {(['XY', 'XZ', 'YZ'] as ProjectionPlane[]).map(plane => (
            <motion.button
              key={plane}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                playSynthTone('switch');
                onProjectionChange?.(plane);
              }}
              className={`px-3.5 py-1.5 text-xs font-mono font-black uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                projection === plane
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400/40'
                  : 'text-slate-400 hover:text-slate-200 bg-transparent hover:bg-white/5'
              }`}
            >
              <span>{plane} Plane</span>
              <span className="text-[9px] opacity-70 font-normal">
                ({plane === 'XY' ? 'ab' : plane === 'XZ' ? 'ac' : 'bc'})
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Control Strip: Plane Source + Supercell + Toggles + Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        {/* Left: Plane Selector Sub-panel */}
        <div className="xl:col-span-8 flex flex-wrap items-center gap-2 bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 pl-1">
            Plane Source:
          </span>

          {/* Active Peak Selector */}
          <button
            type="button"
            onClick={() => {
              playSynthTone('switch');
              setPlaneMode('active');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              planeMode === 'active'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Peak ({hkl.join(' ')})</span>
          </button>

          {/* Plane 1 */}
          <button
            type="button"
            onClick={() => {
              playSynthTone('switch');
              setPlaneMode('plane1');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              planeMode === 'plane1'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/60 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
            }`}
          >
            <span>Plane 1 ({plane1.join(' ')})</span>
          </button>

          {/* Plane 2 */}
          <button
            type="button"
            onClick={() => {
              playSynthTone('switch');
              setPlaneMode('plane2');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              planeMode === 'plane2'
                ? 'bg-rose-500/20 text-rose-300 border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
            }`}
          >
            <span>Plane 2 ({plane2.join(' ')})</span>
          </button>

          {/* Compare Dual Overlay */}
          <button
            type="button"
            onClick={() => {
              playSynthTone('switch');
              setPlaneMode('both');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              planeMode === 'both'
                ? 'bg-gradient-to-r from-indigo-500/30 to-rose-500/30 text-white border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            <span>Dual Overlay (1 & 2)</span>
          </button>

          {/* Custom HKL */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                playSynthTone('switch');
                setPlaneMode('custom');
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                planeMode === 'custom'
                  ? 'bg-amber-500 text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom
            </button>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((idx) => (
                <input
                  key={idx}
                  type="number"
                  value={customHkl[idx]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;
                    const next: [number, number, number] = [...customHkl];
                    next[idx] = val;
                    setCustomHkl(next);
                    setPlaneMode('custom');
                  }}
                  className="w-8 h-6 bg-slate-800 text-white font-mono text-center font-bold text-xs rounded border border-white/10 focus:border-amber-400 focus:outline-none"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Supercell & View Action Controls */}
        <div className="xl:col-span-4 flex items-center justify-between xl:justify-end gap-2 bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
          {/* Supercell selector */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
            <span className="text-[10px] font-mono text-slate-400 px-1.5 uppercase font-bold">Cell:</span>
            {([1, 2, 3] as const).map(sc => (
              <button
                key={sc}
                type="button"
                onClick={() => {
                  playSynthTone('switch');
                  setSupercell(sc);
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
                  supercell === sc
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sc}×{sc}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setZoom(z => Math.max(0.5, z - 0.15))}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleResetView}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* SVG Export / Copy */}
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadSvg}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
              title="Download SVG"
            >
              <Download className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopySvg}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                copiedSvg ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
              title="Copy SVG to Clipboard"
            >
              {copiedSvg ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Layer Visibility Toggles & Fast Feature Switches */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold pr-1">Layers:</span>
          <button
            type="button"
            onClick={() => setShowPlanes(!showPlanes)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showPlanes ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-black/40 text-slate-500 border-white/5'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showPlanes ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>(hkl) Plane Traces</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDSpacing(!showDSpacing)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showDSpacing ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-black/40 text-slate-500 border-white/5'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showDSpacing ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            <span>d_hkl Spacing Callout</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNormal(!showNormal)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showNormal ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-black/40 text-slate-500 border-white/5'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showNormal ? 'bg-purple-400' : 'bg-slate-600'}`} />
            <span>g* Reciprocal Normal</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAtoms(!showAtoms)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showAtoms ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-black/40 text-slate-500 border-white/5'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showAtoms ? 'bg-indigo-400' : 'bg-slate-600'}`} />
            <span>Lattice Atoms</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAtomCoords(!showAtomCoords)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showAtomCoords ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-black/40 text-slate-500 border-white/5'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showAtomCoords ? 'bg-blue-400' : 'bg-slate-600'}`} />
            <span>(u,v) Coordinates</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showGrid ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-black/40 text-slate-500 border-white/5'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showGrid ? 'bg-amber-400' : 'bg-slate-600'}`} />
            <span>Unit Cell Outlines</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSubGrid(!showSubGrid)}
            className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showSubGrid ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-black/40 text-slate-500 border-white/5'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${showSubGrid ? 'bg-pink-400' : 'bg-slate-600'}`} />
            <span>Fractional Subgrid</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-500 font-mono hidden md:block">
          💡 Drag canvas to Pan • Scroll to Zoom
        </div>
      </div>

      {/* Quick Reflection Selector Strip (if reflections available) */}
      {reflections && reflections.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-indigo-500/30">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Peaks:
          </span>
          <div className="flex items-center gap-1.5">
            {reflections.slice(0, 10).map((ref, idx) => {
              const isSelected = selectedIndex === idx && planeMode === 'active';
              return (
                <button
                  key={ref.id || idx}
                  type="button"
                  onClick={() => {
                    playSynthTone('switch');
                    onSelectReflection?.(idx);
                    setPlaneMode('active');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-slate-200'
                  }`}
                >
                  ({ref.hkl.join(' ')})
                  {ref.dObs ? <span className="opacity-70 text-[8.5px] ml-1 font-normal">{ref.dObs.toFixed(3)}Å</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Interactive Canvas Area */}
      <div
        className={`relative w-full h-[390px] sm:h-[450px] bg-[#020617] rounded-3xl border border-indigo-500/30 overflow-hidden shadow-2xl flex items-center justify-center select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
          setZoom(z => Math.max(0.4, Math.min(3.0, z * zoomFactor)));
        }}
      >
        {/* Subtle grid background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />

        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Atom Shading Gradients */}
            <radialGradient id="cornerAtomGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="40%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#083344" />
            </radialGradient>
            <radialGradient id="bodyAtomGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#451a03" />
            </radialGradient>
            <radialGradient id="faceAtomGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#f5d0fe" />
              <stop offset="40%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#4a044e" />
            </radialGradient>
            <radialGradient id="basisAtomGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="40%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#064e3b" />
            </radialGradient>

            {/* Glowing filter */}
            <filter id="planeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="originGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Arrow Markers */}
            <marker id="arrowPrimary" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 Z" fill="#06b6d4" />
            </marker>
            <marker id="arrowSecondary" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f43f5e" />
            </marker>
            <marker id="arrowNormal" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 Z" fill="#a855f7" />
            </marker>
            <marker id="arrowDSpacing" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill="#10b981" />
            </marker>
          </defs>

          {/* Fractional Subgrid (0.25, 0.5, 0.75) */}
          {showSubGrid && (
            <g stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.25">
              {Array.from({ length: supercell * 4 + 1 }).map((_, i) => {
                const u = i * 0.25;
                const [p1x, p1y] = toScreen(u, 0);
                const [p2x, p2y] = toScreen(u, supercell);
                return <line key={`sub-u-${i}`} x1={p1x} y1={p1y} x2={p2x} y2={p2y} />;
              })}
              {Array.from({ length: supercell * 4 + 1 }).map((_, i) => {
                const v = i * 0.25;
                const [p1x, p1y] = toScreen(0, v);
                const [p2x, p2y] = toScreen(supercell, v);
                return <line key={`sub-v-${i}`} x1={p1x} y1={p1y} x2={p2x} y2={p2y} />;
              })}
            </g>
          )}

          {/* Unit Cell & Supercell Grid Boundaries */}
          {showGrid && (
            <g>
              {/* Internal cell dividers */}
              {Array.from({ length: supercell }).map((_, cx) =>
                Array.from({ length: supercell }).map((_, cy) => {
                  const [p00x, p00y] = toScreen(cx, cy);
                  const [p10x, p10y] = toScreen(cx + 1, cy);
                  const [p11x, p11y] = toScreen(cx + 1, cy + 1);
                  const [p01x, p01y] = toScreen(cx, cy + 1);

                  const isPrimaryCell = cx === 0 && cy === 0;

                  return (
                    <polygon
                      key={`cell-${cx}-${cy}`}
                      points={`${p00x},${p00y} ${p10x},${p10y} ${p11x},${p11y} ${p01x},${p01y}`}
                      fill={isPrimaryCell ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.01)'}
                      stroke={isPrimaryCell ? '#818cf8' : '#334155'}
                      strokeWidth={isPrimaryCell ? 1.8 : 0.9}
                      strokeDasharray={isPrimaryCell ? 'none' : '4,3'}
                    />
                  );
                })
              )}
            </g>
          )}

          {/* In-Plane Axis Vectors (a1 & a2) */}
          <g strokeWidth="2.5">
            {/* Axis 1 (dim1) */}
            <line
              x1={origin[0]}
              y1={origin[1]}
              x2={origin[0] + basisVec1[0]}
              y2={origin[1] + basisVec1[1]}
              stroke="#f59e0b"
              markerEnd="url(#arrowPrimary)"
            />
            {/* Axis 2 (dim2) */}
            <line
              x1={origin[0]}
              y1={origin[1]}
              x2={origin[0] + basisVec2[0]}
              y2={origin[1] + basisVec2[1]}
              stroke="#10b981"
              markerEnd="url(#arrowPrimary)"
            />

            {/* Axis Labels */}
            <text
              x={origin[0] + basisVec1[0] + 12}
              y={origin[1] + basisVec1[1] + 4}
              fill="#fbbf24"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="900"
            >
              {axis1Name} ({dim1.toFixed(3)} Å)
            </text>
            <text
              x={origin[0] + basisVec2[0] - 12}
              y={origin[1] + basisVec2[1] - 8}
              fill="#34d399"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="900"
            >
              {axis2Name} ({dim2.toFixed(3)} Å)
            </text>

            {/* Angle Indicator Arc */}
            <path
              d={`M ${origin[0] + 25} ${origin[1]} A 25 25 0 0 0 ${origin[0] + 25 * Math.cos(inPlaneAngleRad)} ${origin[1] - 25 * Math.sin(inPlaneAngleRad)}`}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <text
              x={origin[0] + 32 * Math.cos(inPlaneAngleRad / 2)}
              y={origin[1] - 32 * Math.sin(inPlaneAngleRad / 2)}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {inPlaneAngleDeg.toFixed(1)}°
            </text>
          </g>

          {/* Secondary Plane Traces (in Dual Compare Mode) */}
          {showPlanes && planeMode === 'both' && !secondaryTraces.isParallel && (
            <g>
              {secondaryTraces.lines.map((l) => (
                <g key={`plane2-line-${l.n}`}>
                  <line
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    stroke="#f43f5e"
                    strokeWidth={l.isOrigin ? 2.5 : 1.5}
                    strokeDasharray={l.isOrigin ? 'none' : '4,3'}
                    opacity={l.isOrigin ? 0.9 : 0.6}
                  />
                  <rect
                    x={l.midX - 10}
                    y={l.midY - 7}
                    width="20"
                    height="14"
                    rx="3"
                    fill="#1e1124"
                    stroke="#f43f5e"
                    strokeWidth="0.8"
                  />
                  <text
                    x={l.midX}
                    y={l.midY + 3.5}
                    textAnchor="middle"
                    fill="#fecdd3"
                    fontSize="8"
                    fontWeight="black"
                    fontFamily="monospace"
                  >
                    n={l.n}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Primary Miller Plane Traces */}
          {showPlanes && !primaryTraces.isParallel && (
            <g>
              {primaryTraces.lines.map((l) => (
                <g key={`plane1-line-${l.n}`}>
                  {/* Outer Glow */}
                  {l.isOrigin && (
                    <line
                      x1={l.x1}
                      y1={l.y1}
                      x2={l.x2}
                      y2={l.y2}
                      stroke="#06b6d4"
                      strokeWidth="6"
                      opacity="0.25"
                      filter="url(#originGlow)"
                    />
                  )}

                  {/* Main Line */}
                  <line
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    stroke={l.isOrigin ? '#22d3ee' : l.isBraggFirst ? '#38bdf8' : '#0284c7'}
                    strokeWidth={l.isOrigin ? 2.8 : l.isBraggFirst ? 2.0 : 1.4}
                    strokeDasharray={l.isOrigin ? 'none' : '6,3'}
                    opacity={l.isOrigin ? 1.0 : l.isBraggFirst ? 0.85 : 0.6}
                  />

                  {/* Plane Order Badge */}
                  <rect
                    x={l.midX - 11}
                    y={l.midY - 7.5}
                    width="22"
                    height="15"
                    rx="3.5"
                    fill="#082f49"
                    stroke={l.isOrigin ? '#22d3ee' : '#0284c7'}
                    strokeWidth={l.isOrigin ? 1.2 : 0.8}
                  />
                  <text
                    x={l.midX}
                    y={l.midY + 3.5}
                    textAnchor="middle"
                    fill={l.isOrigin ? '#a5f3fc' : '#bae6fd'}
                    fontSize="8"
                    fontWeight="black"
                    fontFamily="monospace"
                  >
                    n={l.n}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* Parallel Plane Banner (when plane is parallel to viewing plane) */}
          {showPlanes && primaryTraces.isParallel && (
            <g>
              <rect
                x={origin[0] + 10}
                y={origin[1] - 80}
                width="340"
                height="50"
                rx="12"
                fill="rgba(15, 23, 42, 0.85)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4,3"
              />
              <text
                x={origin[0] + 180}
                y={origin[1] - 58}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="11"
                fontWeight="black"
                fontFamily="monospace"
              >
                Plane ({activeHkl.join(' ')}) is Parallel to {projection} Viewplane
              </text>
              <text
                x={origin[0] + 180}
                y={origin[1] - 42}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
                fontFamily="sans-serif"
              >
                Lattice planes form depth sheets along the perpendicular {zoneAxisName}
              </text>
            </g>
          )}

          {/* Interplanar d-Spacing Dimension Callout */}
          {showDSpacing && dSpacingBracket && (
            <g>
              <line
                x1={dSpacingBracket.x0}
                y1={dSpacingBracket.y0}
                x2={dSpacingBracket.x1}
                y2={dSpacingBracket.y1}
                stroke="#10b981"
                strokeWidth="1.8"
                markerStart="url(#arrowDSpacing)"
                markerEnd="url(#arrowDSpacing)"
              />
              {/* Bracket background badge */}
              <rect
                x={dSpacingBracket.midX - 35}
                y={dSpacingBracket.midY - 9}
                width="70"
                height="18"
                rx="4"
                fill="#022c22"
                stroke="#10b981"
                strokeWidth="1"
              />
              <text
                x={dSpacingBracket.midX}
                y={dSpacingBracket.midY + 3.5}
                textAnchor="middle"
                fill="#a7f3d0"
                fontSize="9"
                fontWeight="black"
                fontFamily="monospace"
              >
                d = {dSpacing.toFixed(4)} Å
              </text>
            </g>
          )}

          {/* Reciprocal Lattice Normal Vector g* */}
          {showNormal && normalVectorData && (
            <g>
              <line
                x1={normalVectorData.startX}
                y1={normalVectorData.startY}
                x2={normalVectorData.endX}
                y2={normalVectorData.endY}
                stroke="#c084fc"
                strokeWidth="2.5"
                markerEnd="url(#arrowNormal)"
              />
              <text
                x={normalVectorData.endX + normalVectorData.nx * 14}
                y={normalVectorData.endY + normalVectorData.ny * 14}
                fill="#e9d5ff"
                fontSize="10"
                fontWeight="black"
                fontFamily="monospace"
              >
                g*({activeHkl.join(' ')})
              </text>
            </g>
          )}

          {/* Dual Overlay Angle Arc between g1* and g2* */}
          {planeMode === 'both' && interplanarAngle && (
            <g>
              <rect
                x="15"
                y="15"
                width="200"
                height="45"
                rx="8"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#c084fc"
                strokeWidth="1"
              />
              <text x="25" y="32" fill="#c084fc" fontSize="10" fontWeight="bold" fontFamily="monospace">
                Interplanar Angle (ϕ):
              </text>
              <text x="25" y="48" fill="#ffffff" fontSize="12" fontWeight="black" fontFamily="monospace">
                {interplanarAngle.angleDeg.toFixed(3)}°
              </text>
            </g>
          )}

          {/* Lattice Atoms */}
          {showAtoms && (
            <g>
              {atomsList.map((atom) => {
                const isHovered = hoveredAtom?.u === atom.u && hoveredAtom?.v === atom.v;
                let gradId = 'cornerAtomGrad';
                let radius = 6.5;

                if (atom.type === 'body') {
                  gradId = 'bodyAtomGrad';
                  radius = 5.5;
                } else if (atom.type === 'face') {
                  gradId = 'faceAtomGrad';
                  radius = 5.5;
                } else if (atom.type === 'basis') {
                  gradId = 'basisAtomGrad';
                  radius = 5.0;
                }

                return (
                  <g
                    key={atom.id}
                    onMouseEnter={() => {
                      setHoveredAtom({
                        u: atom.u,
                        v: atom.v,
                        screenX: atom.screenX,
                        screenY: atom.screenY,
                        realX: atom.u * dim1,
                        realY: atom.v * dim2,
                        type: atom.type
                      });
                    }}
                    onMouseLeave={() => setHoveredAtom(null)}
                    className="cursor-pointer"
                  >
                    {/* Shadow */}
                    <circle
                      cx={atom.screenX + 1.5}
                      cy={atom.screenY + 1.5}
                      r={radius}
                      fill="rgba(0,0,0,0.5)"
                    />
                    {/* Sphere */}
                    <circle
                      cx={atom.screenX}
                      cy={atom.screenY}
                      r={isHovered ? radius + 2.5 : radius}
                      fill={`url(#${gradId})`}
                      stroke={isHovered ? '#ffffff' : '#ffffff88'}
                      strokeWidth={isHovered ? 2 : 1}
                      className="transition-all duration-150"
                    />

                    {/* Coordinate Label */}
                    {showAtomCoords && (
                      <text
                        x={atom.screenX}
                        y={atom.screenY - radius - 3}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        ({atom.u.toFixed(2)}, {atom.v.toFixed(2)})
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Hover Tooltip inside SVG */}
          {hoveredAtom && (
            <g transform={`translate(${hoveredAtom.screenX + 10}, ${hoveredAtom.screenY - 35})`}>
              <rect
                x="0"
                y="0"
                width="145"
                height="45"
                rx="6"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="1.2"
                filter="url(#planeGlow)"
              />
              <text x="8" y="14" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                Site: {hoveredAtom.type.toUpperCase()}
              </text>
              <text x="8" y="27" fill="#ffffff" fontSize="8" fontFamily="monospace">
                [u, v] = [{hoveredAtom.u.toFixed(3)}, {hoveredAtom.v.toFixed(3)}]
              </text>
              <text x="8" y="38" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                r = ({hoveredAtom.realX.toFixed(2)} Å, {hoveredAtom.realY.toFixed(2)} Å)
              </text>
            </g>
          )}

          {/* Projection Info Badge Bottom Left */}
          <g transform={`translate(15, ${viewHeight - 30})`}>
            <rect
              x="0"
              y="0"
              width="280"
              height="20"
              rx="5"
              fill="rgba(2, 6, 23, 0.85)"
              stroke="#1e293b"
            />
            <text
              x="140"
              y="13.5"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="monospace"
            >
              Projection: {projection} ({axis1Name} ⊥ {axis2Name}) | Supercell: {supercell}×{supercell}
            </text>
          </g>
        </svg>
      </div>

      {/* Real-Space Metrics HUD Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs font-mono">
        {/* 1. Projected Cell Area */}
        <div className="bg-[#050C17]/90 p-3 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Projected 2D Area</span>
          <div className="text-base font-black text-indigo-300">
            {projectedArea.toFixed(3)} <span className="text-[10px] font-normal text-slate-400">Å²</span>
          </div>
          <span className="text-[9px] text-slate-500">|{axis1Name} × {axis2Name}|</span>
        </div>

        {/* 2. In-Plane Axis Angle */}
        <div className="bg-[#050C17]/90 p-3 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">In-Plane Angle</span>
          <div className="text-base font-black text-emerald-300">
            {inPlaneAngleDeg.toFixed(2)}°
          </div>
          <span className="text-[9px] text-slate-500">∠({axis1Name}, {axis2Name})</span>
        </div>

        {/* 3. Interplanar Spacing d_hkl */}
        <div className="bg-[#050C17]/90 p-3 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">d_hkl Spacing</span>
          <div className="text-base font-black text-cyan-300">
            {dSpacing.toFixed(4)} <span className="text-[10px] font-normal text-slate-400">Å</span>
          </div>
          <span className="text-[9px] text-slate-500">({activeHkl.join(' ')}) reflection</span>
        </div>

        {/* 4. In-Plane Trace Slope */}
        <div className="bg-[#050C17]/90 p-3 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Trace Slope m</span>
          <div className="text-base font-black text-amber-300">
            {k_proj1 !== 0 ? (-h_proj1 / k_proj1).toFixed(3) : '∞ (Vertical)'}
          </div>
          <span className="text-[9px] text-slate-500">m = -h/k</span>
        </div>

        {/* 5. Projected Zone Axis */}
        <div className="bg-[#050C17]/90 p-3 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Viewing Axis [uvw]</span>
          <div className="text-base font-black text-purple-300">
            {zoneAxisName.split(' ')[0]}
          </div>
          <span className="text-[9px] text-slate-500">⊥ to screen</span>
        </div>

        {/* 6. Lattice Points Count */}
        <div className="bg-[#050C17]/90 p-3 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Atoms in Supercell</span>
          <div className="text-base font-black text-pink-300">
            {atomsList.length} <span className="text-[10px] font-normal text-slate-400">sites</span>
          </div>
          <span className="text-[9px] text-slate-500">{bravais}-centering</span>
        </div>
      </div>
    </div>
  );
};
