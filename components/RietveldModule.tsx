import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Area, Scatter, AreaChart, ReferenceLine
} from 'recharts';
import { 
  Activity, Settings, RefreshCw, BarChart2, Download, PlayCircle, RotateCcw, 
  Beaker, Calculator, ChevronRight, BookOpen, Layers, Info, Ruler, Maximize, AlertTriangle, 
  Binary, Zap, Gauge, LineChart as ChartIcon, Database, Scale, Compass, Thermometer, CheckCircle2,
  Globe, ChevronDown, Grid, Lock, Unlock, Edit2, Check, Trash2
} from 'lucide-react';
import { RietveldPhaseInput, RietveldSetupResult, CrystalSystem, RietveldAtom } from '../types';
import { generateRietveldSetup, calculateBragg, simulatePeak, calculateCellVolume } from '../utils/physics';
import { ScientificMathControl } from './ScientificMathControl';
import { RietveldRFactorCalculator } from './RietveldRFactorCalculator';

// --- Simulation Constants & Types ---

const SIMULATION_RANGE = { start: 10, end: 90, step: 0.05 };

interface SimulationPeak {
  h: number;
  k: number;
  l: number;
  intensity: number;
  enabled: boolean;
}

interface SimulationParams {
  a: number;
  scale: number;
  fwhm: number; 
  eta: number;
  zeroShift: number;
  sampleDisplacement: number;
  crystalliteSize: number; 
  microstrain: number; 
  background: number;
  noise: number;
  peaks: SimulationPeak[];
}

const TARGET_PARAMS: Record<string, SimulationParams> = {
  'Simple Cubic': { a: 4.0, scale: 1000, fwhm: 0.2, eta: 0.5, zeroShift: 0.0, sampleDisplacement: 0, crystalliteSize: 100, microstrain: 0.05, background: 50, noise: 20, peaks: [] },
  'BCC': { a: 3.5, scale: 1200, fwhm: 0.15, eta: 0.6, zeroShift: 0.0, sampleDisplacement: 0, crystalliteSize: 80, microstrain: 0.1, background: 40, noise: 15, peaks: [] },
  'FCC': { a: 4.5, scale: 1500, fwhm: 0.25, eta: 0.4, zeroShift: 0.0, sampleDisplacement: 0, crystalliteSize: 120, microstrain: 0.02, background: 60, noise: 25, peaks: [] },
  'Quartz': { a: 4.913, scale: 800, fwhm: 0.1, eta: 0.7, zeroShift: 0.0, sampleDisplacement: 0.1, crystalliteSize: 200, microstrain: 0.01, background: 80, noise: 30, peaks: [] },
  'Rutile': { a: 4.594, scale: 1000, fwhm: 0.18, eta: 0.6, zeroShift: 0.0, sampleDisplacement: 0, crystalliteSize: 150, microstrain: 0.03, background: 40, noise: 20, peaks: [] },
  'Perovskite': { a: 3.905, scale: 900, fwhm: 0.12, eta: 0.5, zeroShift: 0.0, sampleDisplacement: 0, crystalliteSize: 180, microstrain: 0.02, background: 30, noise: 15, peaks: [] }
};

const QUARTZ_PEAKS = [
  { t: 20.86, i: 22 }, { t: 26.64, i: 100 }, { t: 36.54, i: 6 }, 
  { t: 39.46, i: 4 }, { t: 40.29, i: 3 }, { t: 42.45, i: 6 }, 
  { t: 45.79, i: 3 }, { t: 50.14, i: 14 }, { t: 54.87, i: 3 }, 
  { t: 59.96, i: 5 }, { t: 67.74, i: 4 }, { t: 68.14, i: 3 }
];
const RUTILE_PEAKS = [
  { t: 27.45, i: 100 }, { t: 36.09, i: 50 }, { t: 39.19, i: 8 }, 
  { t: 41.23, i: 25 }, { t: 44.05, i: 15 }, { t: 54.32, i: 60 }, 
  { t: 56.64, i: 20 }, { t: 62.74, i: 10 }, { t: 64.04, i: 10 },
  { t: 69.01, i: 20 }, { t: 69.80, i: 12 }
];
const PEROVSKITE_PEAKS = [
  { t: 22.78, i: 16 }, { t: 32.42, i: 100 }, { t: 40.05, i: 28 }, 
  { t: 46.57, i: 35 }, { t: 52.48, i: 12 }, { t: 57.94, i: 23 }, 
  { t: 68.01, i: 15 }, { t: 72.76, i: 8 }, { t: 77.39, i: 12 }
];

const getPeaksForPhase = (phase: string, a: number): SimulationPeak[] => {
  if (phase === 'Quartz') {
    return QUARTZ_PEAKS.map((p, idx) => ({ h: 0, k: 0, l: idx + 1, intensity: p.i * 10, enabled: true }));
  } else if (phase === 'Rutile') {
    return RUTILE_PEAKS.map((p, idx) => ({ h: 0, k: 0, l: idx + 1, intensity: p.i * 10, enabled: true }));
  } else if (phase === 'Perovskite') {
    return PEROVSKITE_PEAKS.map((p, idx) => ({ h: 0, k: 0, l: idx + 1, intensity: p.i * 10, enabled: true }));
  }

  const peaks: SimulationPeak[] = [];
  const maxHKL = 4; // reduced from 5 to avoid "too many peaks" initially
  for (let s2 = 1; s2 <= 32; s2++) {
    // Find first h,k,l that gives this sum of squares
    let found = false;
    for (let h = 0; h <= 5 && !found; h++) {
      for (let k = 0; k <= h && !found; k++) {
        for (let l = 0; l <= k && !found; l++) {
          if (h*h + k*k + l*l === s2) {
            let allowed = false;
            if (phase === 'Simple Cubic') allowed = true;
            else if (phase === 'BCC') allowed = (h + k + l) % 2 === 0;
            else if (phase === 'FCC') {
              const isEven = (h % 2 === 0) && (k % 2 === 0) && (l % 2 === 0);
              const isOdd = (h % 2 !== 0) && (k % 2 !== 0) && (l % 2 !== 0);
              allowed = isEven || isOdd;
            }
            if (allowed) {
              peaks.push({ h, k, l, intensity: 1000, enabled: true });
              found = true;
            }
          }
        }
      }
    }
  }
  return peaks;
};

const computeCrystallographicVolumeAndDensity = (phaseType: string, a: number) => {
  let volume = a * a * a;
  let density = 0.0;
  let unitCellFormula = '';
  
  if (phaseType === 'Simple Cubic') {
    volume = Math.pow(a, 3);
    density = (1 * 28.0855) / (volume * 0.60221415); // Silicon simple cubic Z=1 MW=28.0855
    unitCellFormula = 'Si';
  } else if (phaseType === 'BCC') {
    volume = Math.pow(a, 3);
    density = (2 * 55.845) / (volume * 0.60221415); // Iron BCC Z=2 MW=55.845
    unitCellFormula = 'Fe-α';
  } else if (phaseType === 'FCC') {
    volume = Math.pow(a, 3);
    density = (4 * 63.546) / (volume * 0.60221415); // Copper FCC Z=4 MW=63.546
    unitCellFormula = 'Cu';
  } else if (phaseType === 'Quartz') {
    // Quartz Trigonal: standard SiO2 Z=3 MW=60.08 c/a ratio ~1.1
    // V = a^2 * c * sin(60), where c ~ 1.1 * a, sin(60) ~ 0.866
    volume = 0.866025 * Math.pow(a, 3) * 1.1;
    density = (3 * 60.08) / (volume * 0.60221415);
    unitCellFormula = 'SiO₂';
  } else if (phaseType === 'Rutile') {
    // Rutile Tetragonal: TiO2 Z=2 MW=79.866 c/a ratio ~0.644
    volume = Math.pow(a, 3) * 0.644;
    density = (2 * 79.866) / (volume * 0.60221415);
    unitCellFormula = 'TiO₂';
  } else if (phaseType === 'Perovskite') {
    // SrTiO3 or similar: CaTiO3 Z=1 MW=135.96
    volume = Math.pow(a, 3);
    density = (1 * 135.962) / (volume * 0.60221415);
    unitCellFormula = 'CaTiO₃';
  }

  return { volume, density, unitCellFormula };
};

interface SpaceGroupInfo {
  number: number;
  hermannMauguin: string;
  schoenflies: string;
  hall: string;
  crystalSystem: string;
  pointGroup: string;
  laueClass: string;
  latticeType: string;
  centrosymmetric: boolean;
  chiral: boolean;
  symmorphic: boolean;
  wyckoffSites: Array<{ site: string; multiplicity: number; symmetry: string; coordinates: string }>;
  symmetryElements: string[];
}

const SPACE_GROUP_DETAILS: Record<string, SpaceGroupInfo> = {
  'Simple Cubic': {
    number: 221,
    hermannMauguin: 'P m-3m',
    schoenflies: 'O_h^1',
    hall: '-P 4 2 3',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m (O_h)',
    laueClass: 'm-3m',
    latticeType: 'Primitive Cubic (cP)',
    centrosymmetric: true,
    chiral: false,
    symmorphic: true,
    wyckoffSites: [
      { site: '1a', multiplicity: 1, symmetry: 'm-3m', coordinates: '(0, 0, 0)' },
      { site: '1b', multiplicity: 1, symmetry: 'm-3m', coordinates: '(½, ½, ½)' },
      { site: '3c', multiplicity: 3, symmetry: '4/m.m.m', coordinates: '(0, ½, ½)' },
      { site: '6e', multiplicity: 6, symmetry: '4m.m', coordinates: '(x, 0, 0)' }
    ],
    symmetryElements: ['3-fold axes along [111]', '4-fold axes along [100]', 'Mirror planes (100), (110)', 'Inversion center (0,0,0)']
  },
  'BCC': {
    number: 229,
    hermannMauguin: 'I m-3m',
    schoenflies: 'O_h^9',
    hall: '-I 4 2 3',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m (O_h)',
    laueClass: 'm-3m',
    latticeType: 'Body-Centered Cubic (cI)',
    centrosymmetric: true,
    chiral: false,
    symmorphic: true,
    wyckoffSites: [
      { site: '2a', multiplicity: 2, symmetry: 'm-3m', coordinates: '(0,0,0), (½,½,½)' },
      { site: '6e', multiplicity: 6, symmetry: '4/m.m.m', coordinates: '(±x, 0, 0) + B.C.' },
      { site: '12d', multiplicity: 12, symmetry: '-4m.2', coordinates: '(¼, 0, ½) + B.C.' }
    ],
    symmetryElements: ['Body-Centering translation (½,½,½)', '4-fold screw axes', 'Glide planes', '3-fold axes along [111]']
  },
  'FCC': {
    number: 225,
    hermannMauguin: 'F m-3m',
    schoenflies: 'O_h^5',
    hall: '-F 4 2 3',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m (O_h)',
    laueClass: 'm-3m',
    latticeType: 'Face-Centered Cubic (cF)',
    centrosymmetric: true,
    chiral: false,
    symmorphic: true,
    wyckoffSites: [
      { site: '4a', multiplicity: 4, symmetry: 'm-3m', coordinates: '(0,0,0) + F.C.' },
      { site: '4b', multiplicity: 4, symmetry: 'm-3m', coordinates: '(½,½,½) + F.C.' },
      { site: '8c', multiplicity: 8, symmetry: '-43m', coordinates: '(¼,¼,¼) + F.C.' },
      { site: '24e', multiplicity: 24, symmetry: '4m.m', coordinates: '(x, 0, 0) + F.C.' }
    ],
    symmetryElements: ['Face-Centering translations', '3-fold axis along diagonals', '4-fold rotational symmetry', 'Mirror planes']
  },
  'Quartz': {
    number: 154,
    hermannMauguin: 'P 3_2 2 1',
    schoenflies: 'D_3^6',
    hall: 'P 3_2 2"',
    crystalSystem: 'Trigonal / Hexagonal',
    pointGroup: '32 (D_3)',
    laueClass: '.3m',
    latticeType: 'Primitive Trigonal (hP)',
    centrosymmetric: false,
    chiral: true,
    symmorphic: false,
    wyckoffSites: [
      { site: '3a', multiplicity: 3, symmetry: '.2', coordinates: '(x, 0, ⅓)' },
      { site: '3b', multiplicity: 3, symmetry: '.2', coordinates: '(x, 0, ⅚)' },
      { site: '6c', multiplicity: 6, symmetry: '1', coordinates: '(x, y, z)' }
    ],
    symmetryElements: ['3_2 screw axis (120 deg translation)', '2-fold rotation axes perpendicular to c', 'Chiral space symmetry (enantiomorphic with P 3_1 2 1)']
  },
  'Rutile': {
    number: 136,
    hermannMauguin: 'P 4_2/m n m',
    schoenflies: 'D_4h^14',
    hall: '-P 4n 2n',
    crystalSystem: 'Tetragonal',
    pointGroup: '4/mmm (D_4h)',
    laueClass: '4/mmm',
    latticeType: 'Primitive Tetragonal (tP)',
    centrosymmetric: true,
    chiral: false,
    symmorphic: false,
    wyckoffSites: [
      { site: '2a', multiplicity: 2, symmetry: 'm.mm', coordinates: '(0, 0, 0), (½, ½, ½)' },
      { site: '4f', multiplicity: 4, symmetry: 'm.2m', coordinates: '(u, u, 0), (-u, -u, 0)...' },
      { site: '4g', multiplicity: 4, symmetry: 'm.2m', coordinates: '(u, -u, 0), (-u, u, 0)...' }
    ],
    symmetryElements: ['4_2 screw axis along c', 'n-glide and m-glide planes', '2-fold axes alongside [100] and [110]']
  },
  'Perovskite': {
    number: 221,
    hermannMauguin: 'P m-3m',
    schoenflies: 'O_h^1',
    hall: '-P 4 2 3',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m (O_h)',
    laueClass: 'm-3m',
    latticeType: 'Primitive Cubic (cP)',
    centrosymmetric: true,
    chiral: false,
    symmorphic: true,
    wyckoffSites: [
      { site: '1a', multiplicity: 1, symmetry: 'm-3m', coordinates: '(0,0,0) - Ti' },
      { site: '1b', multiplicity: 1, symmetry: 'm-3m', coordinates: '(½,½,½) - Sr' },
      { site: '3c', multiplicity: 3, symmetry: '4/m.m.m', coordinates: '(0,½,½) - O' }
    ],
    symmetryElements: ['Standard Cubic symmetry', 'Perfect octahedral alignment', 'Pm-3m simple lattices']
  }
};

const getEquivalentPositions = (type: string, x: number, y: number) => {
  const mod1 = (v: number) => {
    const m = v % 1;
    return m < 0 ? m + 1 : m;
  };
  const pts: Array<{ x: number; y: number }> = [];
  const addPt = (px: number, py: number) => {
    const rx = mod1(px);
    const ry = mod1(py);
    if (!pts.some(p => Math.abs(p.x - rx) < 1e-4 && Math.abs(p.y - ry) < 1e-4)) {
      pts.push({ x: rx, y: ry });
    }
  };

  if (type === 'Simple Cubic' || type === 'Perovskite') {
    addPt(x, y);
    addPt(1 - x, y);
    addPt(x, 1 - y);
    addPt(1 - x, 1 - y);
    addPt(y, x);
    addPt(1 - y, x);
    addPt(y, 1 - x);
    addPt(1 - y, 1 - x);
  } else if (type === 'BCC') {
    const base = [
      { x, y }, { x: 1 - x, y }, { x, y: 1 - y }, { x: 1 - x, y: 1 - y },
      { x: y, y: x }, { x: 1 - y, y: x }, { x: y, y: 1 - x }, { x: 1 - y, y: 1 - x }
    ];
    base.forEach(p => {
      addPt(p.x, p.y);
      addPt(p.x + 0.5, p.y + 0.5);
    });
  } else if (type === 'FCC') {
    const base = [
      { x, y }, { x: 1 - x, y }, { x, y: 1 - y }, { x: 1 - x, y: 1 - y },
      { x: y, y: x }, { x: 1 - y, y: x }, { x: y, y: 1 - x }, { x: 1 - y, y: 1 - x }
    ];
    base.forEach(p => {
      addPt(p.x, p.y);
      addPt(p.x + 0.5, p.y + 0.5);
      addPt(p.x, p.y + 0.5);
      addPt(p.x + 0.5, p.y);
    });
  } else if (type === 'Rutile') {
    addPt(x, y);
    addPt(-x, -y);
    addPt(0.5 - x, 0.5 + y);
    addPt(0.5 + x, 0.5 - y);
    addPt(y, x);
    addPt(-y, -x);
    addPt(0.5 - y, 0.5 + x);
    addPt(0.5 + y, 0.5 - x);
  } else if (type === 'Quartz') {
    addPt(x, y);
    addPt(-y, x - y);
    addPt(y - x, -x);
    addPt(y, x);
    addPt(-x, y - x);
    addPt(x - y, -y);
  } else {
    addPt(x, y);
  }
  return pts;
};

const toSymmetryScreenCoords = (px: number, py: number, width: number, height: number, isTrigonal: boolean) => {
  const pad = 25;
  const wActive = width - 2 * pad;
  const hActive = height - 2 * pad;
  
  if (isTrigonal) {
    const originX = pad + wActive * 0.45;
    const originY = height - pad - 12;
    const ax = wActive * 0.55;
    const ay = 0;
    const bx = -wActive * 0.55 * 0.5;
    const by = -hActive * 0.866;
    const sx = originX + px * ax + py * bx;
    const sy = originY + px * ay + py * by;
    return { x: sx, y: sy };
  } else {
    const sx = pad + px * wActive;
    const sy = height - pad - py * hActive;
    return { x: sx, y: sy };
  }
};

export const RietveldModule: React.FC = () => {
  const [activeTab, setActiveTab ] = useState<'simulation' | 'setup' | 'log' | 'rfactor'>('simulation');
  const [showMatrix, setShowMatrix] = useState(false);

  // --- Simulation State ---
  interface SimStructure {
    id: string;
    name: string;
    phaseType: string;
    enabled: boolean;
    a: number;
    targetA: number;
    scale: number;
    targetScale: number;
    fwhm: number;
    targetFwhm: number;
    eta: number;
    targetEta: number;
    crystalliteSize: number;
    targetCrystalliteSize: number;
    microstrain: number;
    targetMicrostrain: number;
    peaks: SimulationPeak[];
  }

  const [simPhases, setSimPhases] = useState<SimStructure[]>(() => {
    try {
      const saved = localStorage.getItem('xrd_rietveld_current_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.simPhases && Array.isArray(parsed.simPhases)) {
          return parsed.simPhases;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'phase_1',
        name: 'Silicon (Cubic Matrix)',
        phaseType: 'Simple Cubic',
        enabled: true,
        a: 4.20,
        targetA: 4.0,
        scale: 850,
        targetScale: 1000,
        fwhm: 0.28,
        targetFwhm: 0.2,
        eta: 0.65,
        targetEta: 0.5,
        crystalliteSize: 75,
        targetCrystalliteSize: 100,
        microstrain: 0.08,
        targetMicrostrain: 0.05,
        peaks: getPeaksForPhase('Simple Cubic', 4.0)
      },
      {
        id: 'phase_2',
        name: 'Alpha-Quartz (Trigonal Phase)',
        phaseType: 'Quartz',
        enabled: true,
        a: 5.06,
        targetA: 4.913,
        scale: 650,
        targetScale: 800,
        fwhm: 0.16,
        targetFwhm: 0.10,
        eta: 0.8,
        targetEta: 0.7,
        crystalliteSize: 150,
        targetCrystalliteSize: 200,
        microstrain: 0.02,
        targetMicrostrain: 0.01,
        peaks: getPeaksForPhase('Quartz', 4.913)
      },
      {
        id: 'phase_3',
        name: 'Copper (FCC Phase)',
        phaseType: 'FCC',
        enabled: false,
        a: 4.72,
        targetA: 4.5,
        scale: 1200,
        targetScale: 1500,
        fwhm: 0.35,
        targetFwhm: 0.25,
        eta: 0.55,
        targetEta: 0.4,
        crystalliteSize: 95,
        targetCrystalliteSize: 120,
        microstrain: 0.04,
        targetMicrostrain: 0.02,
        peaks: getPeaksForPhase('FCC', 4.5)
      }
    ];
  });

  const [selectedSimPhaseIdx, setSelectedSimPhaseIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('xrd_rietveld_current_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.selectedSimPhaseIdx === 'number') {
          return parsed.selectedSimPhaseIdx;
        }
      }
    } catch (e) {}
    return 0;
  });

  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editingPhaseName, setEditingPhaseName] = useState<string>('');
  
  const [selectedPhaseSubTab, setSelectedPhaseSubTab] = useState<'params' | 'symmetry'>('params');
  const [symmetryProbeX, setSymmetryProbeX] = useState<number>(0.2);
  const [symmetryProbeY, setSymmetryProbeY] = useState<number>(0.35);
  const [isDraggingSymmetry, setIsDraggingSymmetry] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleSvgInteraction = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (!e.touches || e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = (clientX - rect.left) / rect.width;
    const y = 1 - (clientY - rect.top) / rect.height;
    
    const posX = Math.max(0, Math.min(1, x));
    const posY = Math.max(0, Math.min(1, y));
    setSymmetryProbeX(parseFloat(posX.toFixed(3)));
    setSymmetryProbeY(parseFloat(posY.toFixed(3)));
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDraggingSymmetry(true);
    handleSvgInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDraggingSymmetry) {
      handleSvgInteraction(e);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDraggingSymmetry(false);
  };

  const currentPhaseObj = useMemo(() => {
    return simPhases[selectedSimPhaseIdx] || simPhases[0] || {
      id: 'default',
      name: 'Default',
      phaseType: 'Simple Cubic',
      enabled: true,
      a: 4.0, targetA: 4.0, scale: 1000, targetScale: 1000, fwhm: 0.2, targetFwhm: 0.2,
      eta: 0.5, targetEta: 0.5, crystalliteSize: 100, targetCrystalliteSize: 100,
      microstrain: 0.05, targetMicrostrain: 0.05, peaks: []
    };
  }, [simPhases, selectedSimPhaseIdx]);

  const simPhase = currentPhaseObj.phaseType;

  // Reactively build userParams and targetParams simulated state objects that backwards-compatibility layers expect
  const userParams = useMemo(() => {
    return {
      a: currentPhaseObj.a,
      scale: currentPhaseObj.scale,
      fwhm: currentPhaseObj.fwhm,
      eta: currentPhaseObj.eta,
      crystalliteSize: currentPhaseObj.crystalliteSize,
      microstrain: currentPhaseObj.microstrain,
      peaks: currentPhaseObj.peaks,
      zeroShift: 0.0,
      sampleDisplacement: 0.0,
      background: 50,
      noise: 20
    };
  }, [currentPhaseObj]);

  const targetParams = useMemo(() => {
    return {
      a: currentPhaseObj.targetA,
      scale: currentPhaseObj.targetScale,
      fwhm: currentPhaseObj.targetFwhm,
      eta: currentPhaseObj.targetEta,
      crystalliteSize: currentPhaseObj.targetCrystalliteSize,
      microstrain: currentPhaseObj.targetMicrostrain,
      peaks: currentPhaseObj.peaks,
      zeroShift: 0.0,
      sampleDisplacement: 0.0,
      background: 50,
      noise: 20
    };
  }, [currentPhaseObj]);

  const getNominalReferenceRwp = (phaseName: string, system: string): number => {
    const name = (phaseName || '').toLowerCase();
    const sys = (system || '').toLowerCase();
    
    // Check standard definitions
    if (name.includes('silicon') || name.includes('standard') || name.includes('srm') || name.includes('halite') || name.includes('nacl')) {
      return 6.5; 
    }
    if (name.includes('alumina') || name.includes('corundum') || name.includes('al2o3')) {
      return 8.2;
    }
    if (name.includes('apatite') || name.includes('bone') || name.includes('enamel')) {
      return 14.5; 
    }
    if (name.includes('glass') || name.includes('amorphous') || name.includes('polymer') || name.includes('ptfe')) {
      return 22.0; 
    }
    
    // Crystal symmetry-based default targets
    if (sys.includes('cubic')) return 7.5;
    if (sys.includes('tetragonal')) return 10.5;
    if (sys.includes('hexagonal') || sys.includes('trigonal') || sys.includes('rhombohedral')) return 11.5;
    if (sys.includes('orthorhombic')) return 12.5;
    if (sys.includes('monoclinic')) return 14.5;
    if (sys.includes('triclinic')) return 16.5;
    
    return 10.0;
  };

  // Unified Setters syncing to the unified SimPhases array
  const setUserParams = (updater: any) => {
    setSimPhases(prev => {
      const next = [...prev];
      const current = next[selectedSimPhaseIdx];
      if (!current) return prev;

      let res: any;
      if (typeof updater === 'function') {
        const currentParamObj = {
          a: current.a,
          scale: current.scale,
          fwhm: current.fwhm,
          eta: current.eta,
          crystalliteSize: current.crystalliteSize,
          microstrain: current.microstrain,
          peaks: current.peaks,
          zeroShift: 0.0,
          sampleDisplacement: 0.0,
          background: 50,
          noise: 20
        };
        res = updater(currentParamObj);
      } else {
        res = updater;
      }

      next[selectedSimPhaseIdx] = {
        ...current,
        a: res.a !== undefined ? res.a : current.a,
        scale: res.scale !== undefined ? res.scale : current.scale,
        fwhm: res.fwhm !== undefined ? res.fwhm : current.fwhm,
        eta: res.eta !== undefined ? res.eta : current.eta,
        crystalliteSize: res.crystalliteSize !== undefined ? res.crystalliteSize : current.crystalliteSize,
        microstrain: res.microstrain !== undefined ? res.microstrain : current.microstrain,
        peaks: res.peaks !== undefined ? res.peaks : current.peaks
      };
      return next;
    });
  };

  const setTargetParams = (updater: any) => {
    setSimPhases(prev => {
      const next = [...prev];
      const current = next[selectedSimPhaseIdx];
      if (!current) return prev;

      let res: any;
      if (typeof updater === 'function') {
        const currentParamObj = {
          a: current.targetA,
          scale: current.targetScale,
          fwhm: current.targetFwhm,
          eta: current.targetEta,
          crystalliteSize: current.targetCrystalliteSize,
          microstrain: current.targetMicrostrain,
          peaks: current.peaks,
          zeroShift: 0.0,
          sampleDisplacement: 0.0,
          background: 50,
          noise: 20
        };
        res = updater(currentParamObj);
      } else {
        res = updater;
      }

      next[selectedSimPhaseIdx] = {
        ...current,
        targetA: res.a !== undefined ? res.a : current.targetA,
        targetScale: res.scale !== undefined ? res.scale : current.targetScale,
        targetFwhm: res.fwhm !== undefined ? res.fwhm : current.targetFwhm,
        targetEta: res.eta !== undefined ? res.eta : current.targetEta,
        targetCrystalliteSize: res.crystalliteSize !== undefined ? res.crystalliteSize : current.targetCrystalliteSize,
        targetMicrostrain: res.microstrain !== undefined ? res.microstrain : current.targetMicrostrain,
        peaks: res.peaks !== undefined ? res.peaks : current.peaks
      };
      return next;
    });
  };

  const setSimPhase = (newPhaseType: string) => {
    setSimPhases(prev => {
      const next = [...prev];
      const current = next[selectedSimPhaseIdx];
      if (!current) return prev;

      next[selectedSimPhaseIdx] = {
        ...current,
        phaseType: newPhaseType,
        a: TARGET_PARAMS[newPhaseType].a * 1.05,
        targetA: TARGET_PARAMS[newPhaseType].a,
        scale: TARGET_PARAMS[newPhaseType].scale * 0.8,
        targetScale: TARGET_PARAMS[newPhaseType].scale,
        fwhm: TARGET_PARAMS[newPhaseType].fwhm * 1.5,
        targetFwhm: TARGET_PARAMS[newPhaseType].fwhm,
        eta: TARGET_PARAMS[newPhaseType].eta,
        targetEta: TARGET_PARAMS[newPhaseType].eta,
        crystalliteSize: TARGET_PARAMS[newPhaseType].crystalliteSize * 0.8,
        targetCrystalliteSize: TARGET_PARAMS[newPhaseType].crystalliteSize,
        microstrain: TARGET_PARAMS[newPhaseType].microstrain * 1.5,
        targetMicrostrain: TARGET_PARAMS[newPhaseType].microstrain,
        peaks: getPeaksForPhase(newPhaseType, TARGET_PARAMS[newPhaseType].a)
      };
      return next;
    });
  };

  const handleAddNewSimStructure = (type: 'Simple Cubic' | 'BCC' | 'FCC' | 'Quartz' | 'Rutile' | 'Perovskite') => {
    const defaultParams = TARGET_PARAMS[type];
    const newPhase: SimStructure = {
      id: `phase_${Date.now()}`,
      name: `${type} Phase #${simPhases.length + 1}`,
      phaseType: type,
      enabled: true,
      a: defaultParams.a * 1.05,
      targetA: defaultParams.a,
      scale: defaultParams.scale * 0.8,
      targetScale: defaultParams.scale,
      fwhm: defaultParams.fwhm * 1.5,
      targetFwhm: defaultParams.fwhm,
      eta: defaultParams.eta,
      targetEta: defaultParams.eta,
      crystalliteSize: defaultParams.crystalliteSize * 0.8,
      targetCrystalliteSize: defaultParams.crystalliteSize,
      microstrain: defaultParams.microstrain * 1.5,
      targetMicrostrain: defaultParams.microstrain,
      peaks: getPeaksForPhase(type, defaultParams.a)
    };
    setSimPhases(prev => [...prev, newPhase]);
    setSelectedSimPhaseIdx(simPhases.length);
  };

  const handleRemoveSimStructure = (idx: number) => {
    if (simPhases.length <= 1) return;
    setSimPhases(prev => prev.filter((_, i) => i !== idx));
    setSelectedSimPhaseIdx(0);
  };

  const [isAutoRefining, setIsAutoRefining] = useState(false);
  const [rFactor, setRFactor] = useState<number>(0);

  const referenceRwp = useMemo(() => {
    return getNominalReferenceRwp(currentPhaseObj.name, currentPhaseObj.phaseType);
  }, [currentPhaseObj.name, currentPhaseObj.phaseType]);

  const stabilityPercentage = useMemo(() => {
    if (rFactor <= referenceRwp) return 100;
    const ratio = rFactor / referenceRwp;
    const score = 100 / Math.pow(ratio, 1.25);
    return Math.max(0, Math.min(100, score));
  }, [rFactor, referenceRwp]);

  // --- Setup Generator State ---
  const [phases, setPhases] = useState<RietveldPhaseInput[]>([
    { name: 'Phase 1', crystalSystem: 'Cubic', a: 5.43 }
  ]);
  const [maxObsIntensity, setMaxObsIntensity] = useState<number>(5000);
  const [bgModel, setBgModel] = useState<'Chebyshev' | 'Linear_Interpolation' | 'Polynomial' | 'Shifted_Chebyshev'>('Chebyshev');
  const [bgTerms, setBgTerms] = useState<number>(6);
  const [profileShape, setProfileShape] = useState<'Thompson-Cox-Hastings' | 'Pseudo-Voigt' | 'Pearson-VII'>('Thompson-Cox-Hastings');
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [radSource, setRadSource] = useState<string>('Cu_Ka1');
  const [setupZeroShift, setSetupZeroShift] = useState<number>(0);
  const [sampleDisplacement, setSampleDisplacement] = useState<number>(0);
  const [polarization, setPolarization] = useState<number>(0);
  const [refineZeroShift, setRefineZeroShift] = useState(true);
  const [refineBkg, setRefineBkg] = useState(true);
  const [refineSampleDisplacement, setRefineSampleDisplacement] = useState(false);
  const [refineSurfaceRoughness, setRefineSurfaceRoughness] = useState(false);
  const [geometry, setGeometry] = useState<'Bragg-Brentano' | 'Debye-Scherrer'>('Bragg-Brentano');
  const [divergenceSlit, setDivergenceSlit] = useState<'Fixed' | 'Variable'>('Fixed');
  const [expertMode, setExpertMode] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [result, setResult] = useState<RietveldSetupResult | null>(null);
  const [strategyStatus, setStrategyStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem('xrd_rietveld_setup', JSON.stringify({
      phases, maxObsIntensity, bgModel, bgTerms, profileShape,
      wavelength, radSource, setupZeroShift, sampleDisplacement, polarization,
      refineZeroShift, refineBkg, refineSampleDisplacement, refineSurfaceRoughness,
      geometry, divergenceSlit
    }));
  }, [
    phases, maxObsIntensity, bgModel, bgTerms, profileShape,
    wavelength, radSource, setupZeroShift, sampleDisplacement, polarization,
    refineZeroShift, refineBkg, refineSampleDisplacement, refineSurfaceRoughness,
    geometry, divergenceSlit
  ]);

  const refinementMetrics = useMemo(() => {
    let globalActive = 0;
    if (refineBkg && bgModel !== 'Linear_Interpolation') globalActive += bgTerms;
    if (refineZeroShift) globalActive += 1; 
    if (refineSampleDisplacement) globalActive += 1;
    if (refineSurfaceRoughness) globalActive += 1;
    
    let phaseParams = 0;
    let activePhases = 0;
    
    phases.forEach(p => {
      let pCount = 0;
      if (p.refineScale) pCount++;
      if (p.refineLattice) {
        if (p.crystalSystem === 'Cubic') pCount += 1;
        else if (p.crystalSystem.includes('Tetragonal') || p.crystalSystem === 'Hexagonal') pCount += 2;
        else if (p.crystalSystem.includes('Orthorhombic')) pCount += 3;
        else if (p.crystalSystem === 'Monoclinic') pCount += 4;
        else pCount += 6;
      }
      if (p.refineProfile) pCount += 4; // U, V, W, Eta
      if (p.refineMicrostrain) pCount++;
      if (p.refineCrystalliteSize) pCount++;
      if (p.refineAtomicPos) pCount += (p.atoms?.length || 0) * 3;
      if (p.refineBiso) pCount += (p.atoms?.length || 0);
      if (p.refineOcc) pCount += (p.atoms?.length || 0);
      if (p.refineAsymmetry) pCount += 2;
      if (p.refinePrefOrient) pCount++;
      if (p.refineExtinction) pCount++;
      if (p.refineAnisotropicStrain) pCount += 6;
      if (p.refineSphericalHarmonics) pCount += 8;
      
      if (pCount > 0) {
        phaseParams += pCount;
        activePhases++;
      }
    });

    return { global: globalActive, phase: phaseParams, total: globalActive + phaseParams, activePhases };
  }, [phases, bgModel, bgTerms]);

  // --- Simulation Tracking ---
  const [rHistory, setRHistory] = useState<{
    iter: number; 
    rwp: number; 
    rexp: number; 
    gof: number;
    params?: {
      id: string;
      name: string;
      a: number;
      scale: number;
      fwhm: number;
      eta: number;
      crystalliteSize: number;
      microstrain: number;
    }[];
  }[]>([]);
  const [iterCount, setIterCount] = useState(0);

  const restoreHistoryStep = (stepParams: any[]) => {
    setSimPhases(prev => 
      prev.map(p => {
        const match = stepParams.find(sp => sp.id === p.id);
        if (match) {
          return {
            ...p,
            a: match.a,
            scale: match.scale,
            fwhm: match.fwhm,
            eta: match.eta,
            crystalliteSize: match.crystalliteSize,
            microstrain: match.microstrain
          };
        }
        return p;
      })
    );
  };

  const [selectedMetric, setSelectedMetric] = useState<'rwp_gof' | 'lattice_a' | 'scale' | 'fwhm' | 'eta' | 'crystallite' | 'microstrain'>('rwp_gof');

  const transformedChartData = useMemo(() => {
    return rHistory.map(entry => {
      const row: any = {
        iter: entry.iter,
        rwp: entry.rwp,
        gof: entry.gof,
        rexp: entry.rexp
      };
      if (entry.params) {
        entry.params.forEach((p, idx) => {
          row[`phase_${idx}_a`] = p.a;
          row[`phase_${idx}_scale`] = p.scale;
          row[`phase_${idx}_fwhm`] = p.fwhm;
          row[`phase_${idx}_eta`] = p.eta;
          row[`phase_${idx}_crystallite`] = p.crystalliteSize;
          row[`phase_${idx}_microstrain`] = p.microstrain;
        });
      }
      return row;
    });
  }, [rHistory]);

  const activeLogPhases = useMemo(() => {
    if (rHistory.length === 0) return [];
    const first = rHistory[0];
    if (!first.params) return [];
    return first.params.map((p, idx) => ({ id: p.id, name: p.name, index: idx }));
  }, [rHistory]);

  // --- Simulation Logic ---

  useEffect(() => {
    localStorage.setItem('xrd_rietveld_current_v2', JSON.stringify({
      simPhases,
      selectedSimPhaseIdx,
      rFactor,
      iterCount
    }));
  }, [simPhases, selectedSimPhaseIdx, rFactor, iterCount]);

  const activePeaksForVisuals = useMemo(() => {
    const allPeaks: { twoTheta: number, label: string, phaseName: string, color: string }[] = [];
    const colors = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'];
    
    simPhases.forEach((p, idx) => {
      if (!p.enabled) return;
      const color = colors[idx % colors.length];
      
      p.peaks.forEach((peak, peakIdx) => {
        if (!peak.enabled) return;
        
        let twoThetaBase = 0;
        let d = 0;
        
        if (['Quartz', 'Rutile', 'Perovskite'].includes(p.phaseType)) {
          const origPeak = p.phaseType === 'Quartz' ? QUARTZ_PEAKS[peakIdx] : p.phaseType === 'Rutile' ? RUTILE_PEAKS[peakIdx] : PEROVSKITE_PEAKS[peakIdx];
          if (!origPeak) return;
          const shift = (p.a - TARGET_PARAMS[p.phaseType].a) * 2; 
          twoThetaBase = origPeak.t - shift;
          const theta1 = (origPeak.t / 2) * (Math.PI / 180);
          d = 1.5406 / (2 * Math.sin(theta1));
        } else {
          d = p.a / Math.sqrt(peak.h*peak.h + peak.k*peak.k + peak.l*peak.l);
          const sinTheta = 1.5406 / (2 * d);
          if (sinTheta >= 1 || sinTheta <= 0) return;
          const theta = Math.asin(sinTheta);
          twoThetaBase = 2 * theta * (180 / Math.PI);
        }
        
        if (twoThetaBase > 0) {
          allPeaks.push({
             twoTheta: twoThetaBase, 
             label: p.phaseType === 'Quartz' ? 'Q' : `${peak.h}${peak.k}${peak.l}`, 
             phaseName: p.name,
             color: color
          });
        }
      });
    });
    return allPeaks;
  }, [simPhases]);

  const generatePatternData = useMemo(() => {
    const data: any[] = [];
    const steps = Math.floor((SIMULATION_RANGE.end - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
    
    // Initialize data array
    for (let i = 0; i <= steps; i++) {
      data.push({
        twoTheta: SIMULATION_RANGE.start + i * SIMULATION_RANGE.step,
        obs: 0,
        calc: 0,
        diff: 0,
        bkg: 0
      });
    }

    const calculateIntensity = (useTargets: boolean) => {
      const intensities = new Array(data.length).fill(0);
      
      // Base background shared globally (simulating incoherent core scatter)
      const globalBkg = 60;
      for (let i = 0; i < intensities.length; i++) {
        const twoT = SIMULATION_RANGE.start + i * SIMULATION_RANGE.step;
        const bgVal = globalBkg * (0.2 + 10 / Math.max(1, twoT) + 1.5 * Math.exp(-0.02 * Math.pow(twoT - 25, 2)));
        intensities[i] += bgVal;
      }

      // Sum all enabled structures' contributions
      simPhases.forEach((p) => {
        if (!p.enabled) return;

        const a = useTargets ? p.targetA : p.a;
        const scale = useTargets ? p.targetScale : p.scale;
        const fwhm = useTargets ? p.targetFwhm : p.fwhm;
        const eta = useTargets ? p.targetEta : p.eta;
        const crystalliteSize = useTargets ? p.targetCrystalliteSize : p.crystalliteSize;
        const microstrain = useTargets ? p.targetMicrostrain : p.microstrain;
        const peaks = p.peaks;

        const addPeak = (pos2Theta: number, peakFwhm: number, amplitude: number) => {
          const profile = simulatePeak(
            'Pseudo-Voigt', pos2Theta, peakFwhm, eta, 
            amplitude, 
            [pos2Theta - (peakFwhm * 10), pos2Theta + (peakFwhm * 10)], 100
          );
          
          profile.points.forEach(pt => {
            const idx = Math.round((pt.x - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
            if (idx >= 0 && idx < data.length) {
              intensities[idx] += pt.y;
            }
          });
        };

        const wavelength = 1.5406;

        peaks.filter(peak => peak.enabled).forEach((peak, peakIdx) => {
          let twoThetaBase = 0;
          let d = 0;

          if (['Quartz', 'Rutile', 'Perovskite'].includes(p.phaseType)) {
            const origPeak = p.phaseType === 'Quartz' ? QUARTZ_PEAKS[peakIdx] : p.phaseType === 'Rutile' ? RUTILE_PEAKS[peakIdx] : PEROVSKITE_PEAKS[peakIdx];
            if (!origPeak) return;
            const shift = (a - TARGET_PARAMS[p.phaseType].a) * 2; 
            twoThetaBase = origPeak.t - shift;
            const theta1 = (origPeak.t / 2) * (Math.PI / 180);
            d = 1.5406 / (2 * Math.sin(theta1));
          } else {
            d = a / Math.sqrt(peak.h*peak.h + peak.k*peak.k + peak.l*peak.l);
            const sinTheta = wavelength / (2 * d);
            if (sinTheta >= 1) return;
            const theta = Math.asin(sinTheta);
            twoThetaBase = 2 * theta * (180 / Math.PI);
          }

          const theta = (twoThetaBase / 2) * (Math.PI / 180);
          
          const zeroShift = 0.0;
          const sampleDisplacement = 0.0;
          const displacementShift = -sampleDisplacement * Math.cos(theta);
          const twoTheta = twoThetaBase + zeroShift + displacementShift;

          if (twoTheta >= SIMULATION_RANGE.start && twoTheta <= SIMULATION_RANGE.end) {
            let intensity = peak.intensity; 
            
            if (p.phaseType !== 'Quartz') {
              const lp = (1 + Math.cos(2*theta)**2) / (Math.sin(theta)**2 * Math.cos(theta));
              intensity *= lp / 10;
              
              let mult = 0;
              const {h, k, l} = peak;
              if (h===k && k===l) mult = 8;
              else if (h===k || k===l || h===l) mult = 24;
              else mult = 48;
              if (h===0 || k===0 || l===0) mult /= 2;
              intensity *= (mult / 10);
            }

            const bSizeRad = (0.9 * wavelength) / ((crystalliteSize * 10) * Math.cos(theta));
            const bSizeDeg = bSizeRad * (180 / Math.PI);
            const bStrainRad = 4 * microstrain * Math.tan(theta);
            const bStrainDeg = bStrainRad * (180 / Math.PI);
            
            const totalFwhm = fwhm + bSizeDeg + bStrainDeg;
            const baseAmplitude = intensity * (scale / 1000);

            // Ka1
            addPeak(twoTheta, totalFwhm, baseAmplitude);

            // Ka2
            const wavelength2 = 1.5444; 
            const sinTheta2 = wavelength2 / (2 * d);
            if (sinTheta2 < 1) {
              const theta2 = Math.asin(sinTheta2);
              const displacementShift2 = -sampleDisplacement * Math.cos(theta2);
              const twoTheta2 = 2 * theta2 * (180 / Math.PI) + zeroShift + displacementShift2;
              addPeak(twoTheta2, totalFwhm, baseAmplitude * 0.5);
            }
          }
        });
      });

      // Apply realistic Poisson-like noise to observed data
      if (useTargets) {
        for (let i = 0; i < intensities.length; i++) {
          const val = intensities[i];
          const noiseFactor = 15 * 0.15;
          intensities[i] += Math.sqrt(Math.max(1, val)) * (Math.random() - 0.5) * noiseFactor;
        }
      }

      return intensities;
    };

    const obsIntensities = calculateIntensity(true);
    const calcIntensities = calculateIntensity(false);

    // Calculate individual current structures' calculated profiles to project separately
    const individualPhaseCalcIntensities = simPhases.map((p) => {
      const phaseIntensities = new Array(data.length).fill(0);
      if (!p.enabled) return phaseIntensities;

      const scale = p.scale;
      const fwhm = p.fwhm;
      const eta = p.eta;
      const crystalliteSize = p.crystalliteSize;
      const microstrain = p.microstrain;
      const peaks = p.peaks;

      const addPeak = (pos2Theta: number, peakFwhm: number, amplitude: number) => {
        const profile = simulatePeak(
          'Pseudo-Voigt', pos2Theta, peakFwhm, eta, 
          amplitude, 
          [pos2Theta - (peakFwhm * 10), pos2Theta + (peakFwhm * 10)], 100
        );
        
        profile.points.forEach(pt => {
          const idx = Math.round((pt.x - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
          if (idx >= 0 && idx < data.length) {
            phaseIntensities[idx] += pt.y;
          }
        });
      };

      const wavelength = 1.5406;

      peaks.filter(peak => peak.enabled).forEach((peak, peakIdx) => {
        let twoThetaBase = 0;
        let d = 0;

        if (['Quartz', 'Rutile', 'Perovskite'].includes(p.phaseType)) {
          const origPeak = p.phaseType === 'Quartz' ? QUARTZ_PEAKS[peakIdx] : p.phaseType === 'Rutile' ? RUTILE_PEAKS[peakIdx] : PEROVSKITE_PEAKS[peakIdx];
          if (!origPeak) return;
          const shift = (p.a - TARGET_PARAMS[p.phaseType].a) * 2; 
          twoThetaBase = origPeak.t - shift;
          const theta1 = (origPeak.t / 2) * (Math.PI / 180);
          d = 1.5406 / (2 * Math.sin(theta1));
        } else {
          d = p.a / Math.sqrt(peak.h*peak.h + peak.k*peak.k + peak.l*peak.l);
          const sinTheta = wavelength / (2 * d);
          if (sinTheta >= 1) return;
          const theta = Math.asin(sinTheta);
          twoThetaBase = 2 * theta * (180 / Math.PI);
        }

        const theta = (twoThetaBase / 2) * (Math.PI / 180);
        
        const zeroShift = 0.0;
        const sampleDisplacement = 0.0;
        const displacementShift = -sampleDisplacement * Math.cos(theta);
        const twoTheta = twoThetaBase + zeroShift + displacementShift;

        if (twoTheta >= SIMULATION_RANGE.start && twoTheta <= SIMULATION_RANGE.end) {
          let intensity = peak.intensity; 
          
          if (p.phaseType !== 'Quartz') {
            const lp = (1 + Math.cos(2*theta)**2) / (Math.sin(theta)**2 * Math.cos(theta));
            intensity *= lp / 10;
            
            let mult = 0;
            const {h, k, l} = peak;
            if (h===k && k===l) mult = 8;
            else if (h===k || k===l || h===l) mult = 24;
            else mult = 48;
            if (h===0 || k===0 || l===0) mult /= 2;
            intensity *= (mult / 10);
          }

          const bSizeRad = (0.9 * wavelength) / ((crystalliteSize * 10) * Math.cos(theta));
          const bSizeDeg = bSizeRad * (180 / Math.PI);
          const bStrainRad = 4 * microstrain * Math.tan(theta);
          const bStrainDeg = bStrainRad * (180 / Math.PI);
          
          const totalFwhm = fwhm + bSizeDeg + bStrainDeg;
          const baseAmplitude = intensity * (scale / 1000);

          addPeak(twoTheta, totalFwhm, baseAmplitude);
        }
      });

      return phaseIntensities;
    });

    let sumResSq = 0;
    let sumObsSq = 0;
    let maxObs = 0;

    for (let i = 0; i < data.length; i++) {
      if (obsIntensities[i] > maxObs) {
        maxObs = obsIntensities[i];
      }
    }
    
    const diffOffset = -maxObs * 0.15; 

    for (let i = 0; i < data.length; i++) {
      data[i].obs = obsIntensities[i];
      data[i].calc = calcIntensities[i];
      data[i].diff = (obsIntensities[i] - calcIntensities[i]) + diffOffset;
      
      const twoT = data[i].twoTheta;
      const trueBkg = 60 * (0.2 + 10 / Math.max(1, twoT) + 1.5 * Math.exp(-0.02 * Math.pow(twoT - 25, 2)));
      data[i].bkg = trueBkg;

      const trueDiff = obsIntensities[i] - calcIntensities[i];
      sumResSq += Math.pow(trueDiff, 2);
      sumObsSq += Math.pow(data[i].obs, 2);

      // Save individual phase curves to show as colored shaded components
      simPhases.forEach((p, idx) => {
        data[i][`calc_phase_${idx}`] = individualPhaseCalcIntensities[idx][i];
      });
    }

    const R = Math.sqrt(sumResSq / sumObsSq) * 100;
    setRFactor(R);

    return data;
  }, [simPhases]);

  // Track R-factor history
  useEffect(() => {
    if (isAutoRefining) {
      const phaseParams = simPhases.map(p => ({
        id: p.id,
        name: p.name,
        a: p.a,
        scale: p.scale,
        fwhm: p.fwhm,
        eta: p.eta,
        crystalliteSize: p.crystalliteSize,
        microstrain: p.microstrain
      }));
      setRHistory(prev => {
        const rexp = Math.max(3.5, rFactor * 0.4 + (Math.random() * 2));
        const gof = Math.pow(rFactor / rexp, 2);
        
        const next = [...prev, { 
          iter: iterCount, 
          rwp: rFactor, 
          rexp: rexp, 
          gof: gof,
          params: phaseParams
        }];
        if (next.length > 100) return next.slice(1);
        return next;
      });
      setIterCount(c => c + 1);
    }
  }, [rFactor, isAutoRefining, simPhases]);

  // Reset tracking when phase selection or configuration list changes
  useEffect(() => {
    setRHistory([]);
    setIterCount(0);
  }, [simPhases.map(p => `${p.id}-${p.enabled}`).join(',')]);

  // Simultaneous multi-phase gradient refinement loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoRefining) {
      interval = setInterval(() => {
        setSimPhases(prev => {
          let allConverged = true;
          const step = 0.05;

          const next = prev.map(p => {
            if (!p.enabled) return p;

            const diffA = p.targetA - p.a;
            const diffScale = p.targetScale - p.scale;
            const diffFwhm = p.targetFwhm - p.fwhm;
            const diffEta = p.targetEta - p.eta;
            const diffSize = p.targetCrystalliteSize - p.crystalliteSize;
            const diffStrain = p.targetMicrostrain - p.microstrain;

            const phaseConverged = 
              Math.abs(diffA) < 0.001 &&
              Math.abs(diffScale) < 1 &&
              Math.abs(diffFwhm) < 0.001 &&
              Math.abs(diffEta) < 0.01 &&
              Math.abs(diffSize) < 1 &&
              Math.abs(diffStrain) < 0.01;

            if (!phaseConverged) {
              allConverged = false;
            }

            return {
              ...p,
              a: p.a + diffA * step,
              scale: p.scale + diffScale * step,
              fwhm: p.fwhm + diffFwhm * step,
              eta: p.eta + diffEta * step,
              crystalliteSize: p.crystalliteSize + diffSize * step,
              microstrain: p.microstrain + diffStrain * step
            };
          });

          if (allConverged) {
            setIsAutoRefining(false);
            return prev;
          }

          return next;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoRefining]);


  // --- Setup Generator Logic ---
  const updatePhase = (index: number, field: keyof RietveldPhaseInput, value: any) => {
    const newPhases = [...phases];
    const updatedPhase = { ...newPhases[index], [field]: value };
    
    // Lattice Synchronization logic
    if (field === 'a' || field === 'crystalSystem') {
      const a = field === 'a' ? value : updatedPhase.a;
      const sys = field === 'crystalSystem' ? value : updatedPhase.crystalSystem;
      
      if (sys === 'Cubic') {
        updatedPhase.b = a;
        updatedPhase.c = a;
        updatedPhase.alpha = 90;
        updatedPhase.beta = 90;
        updatedPhase.gamma = 90;
      } else if (sys === 'Tetragonal') {
        updatedPhase.b = a;
        updatedPhase.alpha = 90;
        updatedPhase.beta = 90;
        updatedPhase.gamma = 90;
      } else if (sys === 'Hexagonal' || (sys as string) === 'Trigonal') {
        updatedPhase.b = a;
        updatedPhase.alpha = 90;
        updatedPhase.beta = 90;
        updatedPhase.gamma = 120;
      } else if (sys === 'Orthorhombic') {
        updatedPhase.alpha = 90;
        updatedPhase.beta = 90;
        updatedPhase.gamma = 90;
      } else if (sys === 'Monoclinic') {
        updatedPhase.alpha = 90;
        updatedPhase.gamma = 90;
      }
    } else if (field === 'b') {
      const sys = updatedPhase.crystalSystem;
      if (sys === 'Cubic' || sys === 'Tetragonal' || sys === 'Hexagonal' || (sys as string) === 'Trigonal') {
        // Enforce a = b constraint
        updatedPhase.a = value;
      }
    }
    
    newPhases[index] = updatedPhase;
    setPhases(newPhases);
  };

  const addAtom = (phaseIdx: number) => {
    const nextPhases = [...phases];
    const currentAtoms = nextPhases[phaseIdx].atoms || [];
    nextPhases[phaseIdx] = {
      ...nextPhases[phaseIdx],
      atoms: [...currentAtoms, { element: 'Si', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.5 }]
    };
    setPhases(nextPhases);
  };

  const updateAtom = (phaseIdx: number, atomIdx: number, field: keyof RietveldAtom, value: any) => {
    const nextPhases = [...phases];
    const atoms = [...(nextPhases[phaseIdx].atoms || [])];
    atoms[atomIdx] = { ...atoms[atomIdx], [field]: value };
    nextPhases[phaseIdx] = { ...nextPhases[phaseIdx], atoms };
    setPhases(nextPhases);
  };

  const removeAtom = (phaseIdx: number, atomIdx: number) => {
    const nextPhases = [...phases];
    const atoms = (nextPhases[phaseIdx].atoms || []).filter((_, i) => i !== atomIdx);
    nextPhases[phaseIdx] = { ...nextPhases[phaseIdx], atoms };
    setPhases(nextPhases);
  };

  const clearAtoms = (phaseIdx: number) => {
    const nextPhases = [...phases];
    nextPhases[phaseIdx] = { ...nextPhases[phaseIdx], atoms: [] };
    setPhases(nextPhases);
  };

  const importCifAtoms = async (phaseIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { parseCIF } = await import('../utils/cifParser');
      const parsedPhase = parseCIF(text, file.name);
      
      if (parsedPhase.atoms && parsedPhase.atoms.length > 0) {
        const nextPhases = [...phases];
        nextPhases[phaseIdx] = {
          ...nextPhases[phaseIdx],
          atoms: parsedPhase.atoms,
          // Additionally import lattice parameters if the user wants them updated, but let's strictly keep them or map them nicely
          spaceGroup: parsedPhase.spaceGroup || nextPhases[phaseIdx].spaceGroup,
          a: parsedPhase.a || nextPhases[phaseIdx].a,
          b: parsedPhase.b || nextPhases[phaseIdx].b,
          c: parsedPhase.c || nextPhases[phaseIdx].c,
          alpha: parsedPhase.alpha || nextPhases[phaseIdx].alpha,
          beta: parsedPhase.beta || nextPhases[phaseIdx].beta,
          gamma: parsedPhase.gamma || nextPhases[phaseIdx].gamma,
          crystalSystem: parsedPhase.crystalSystem || nextPhases[phaseIdx].crystalSystem,
        };
        setPhases(nextPhases);
      }
    } catch (err) {
      console.error("Error parsing CIF atoms:", err);
    }
    
    if (e.target) e.target.value = '';
  };

  const addPhase = () => {
    setPhases([...phases, { name: `Phase ${phases.length + 1}`, crystalSystem: 'Cubic', a: 5.0 }]);
  };

  const handleCifUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { parseCIF } = await import('../utils/cifParser');
      const parsedPhase = parseCIF(text, file.name);
      setPhases((prev) => [...prev, parsedPhase]);
    } catch (err) {
      console.error("Error parsing CIF:", err);
    }
    
    if (e.target) e.target.value = '';
  };

  const validateSetup = () => {
    const issues: string[] = [];
    if (phases.length === 0) issues.push("At least one phase is required.");
    phases.forEach((p, i) => {
      const name = p.name || `Phase ${i+1}`;
      if (p.a <= 0) issues.push(`${name}: Lattice parameter 'a' must be positive.`);
      if (['Orthorhombic', 'Tetragonal', 'Hexagonal', 'Monoclinic', 'Triclinic'].includes(p.crystalSystem) && (!p.c || p.c <= 0)) {
        issues.push(`${name}: Lattice parameter 'c' must be positive.`);
      }
      (p.atoms || []).forEach((atom, ai) => {
        if (atom.occupancy < 0) issues.push(`${name}, Atom ${ai+1}: Occupancy cannot be negative.`);
        if (atom.bIso < 0) issues.push(`${name}, Atom ${ai+1}: B-iso cannot be negative.`);
      });
    });
    return issues;
  };

  const duplicatePhase = (index: number) => {
    const phaseToCopy = phases[index];
    setPhases([...phases, { ...JSON.parse(JSON.stringify(phaseToCopy)), name: `${phaseToCopy.name} (Copy)` }]);
  };

  const applyPreset = (index: number, presetType: string) => {
    const presets: Record<string, Partial<RietveldPhaseInput>> = {
      Si: { name: 'Silicon (Standard)', crystalSystem: 'Cubic', spaceGroup: 'Fd-3m', a: 5.4309, b: 5.4309, c: 5.4309, alpha: 90, beta: 90, gamma: 90, zValue: 8, molarMass: 28.085, atoms: [{ element: 'Si', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.45 }] },
      LaB6: { name: 'LaB6 (Standard)', crystalSystem: 'Cubic', spaceGroup: 'Pm-3m', a: 4.156, b: 4.156, c: 4.156, alpha: 90, beta: 90, gamma: 90, zValue: 1, molarMass: 203.77, atoms: [{ element: 'La', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.5 }, { element: 'B', x: 0.5, y: 0, z: 0, occupancy: 1, bIso: 0.6 }] },
      Al2O3: { name: 'Alumina (Alpha)', crystalSystem: 'Hexagonal', spaceGroup: 'R-3c', a: 4.758, b: 4.758, c: 12.991, alpha: 90, beta: 90, gamma: 120, zValue: 6, molarMass: 101.96, atoms: [{ element: 'Al', x: 0, y: 0, z: 0.352, occupancy: 1, bIso: 0.3 }, { element: 'O', x: 0.306, y: 0, z: 0.25, occupancy: 1, bIso: 0.4 }] },
      TiO2_Rutile: { name: 'Rutile (TiO2)', crystalSystem: 'Tetragonal', spaceGroup: 'P42/mnm', a: 4.593, b: 4.593, c: 2.959, alpha: 90, beta: 90, gamma: 90, zValue: 2, molarMass: 79.87, atoms: [{ element: 'Ti', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.5 }, { element: 'O', x: 0.305, y: 0.305, z: 0, occupancy: 1, bIso: 0.6 }] },
      TiO2_Anatase: { name: 'Anatase (TiO2)', crystalSystem: 'Tetragonal', spaceGroup: 'I41/amd', a: 3.784, b: 3.784, c: 9.514, alpha: 90, beta: 90, gamma: 90, zValue: 4, molarMass: 79.87, atoms: [{ element: 'Ti', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.5 }, { element: 'O', x: 0, y: 0, z: 0.208, occupancy: 1, bIso: 0.6 }] },
      SiO2_Quartz: { name: 'Quartz (Alpha)', crystalSystem: 'Hexagonal', spaceGroup: 'P3221', a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120, zValue: 3, molarMass: 60.08, atoms: [{ element: 'Si', x: 0.47, y: 0, z: 0.667, occupancy: 1, bIso: 0.5 }, { element: 'O', x: 0.414, y: 0.268, z: 0.785, occupancy: 1, bIso: 0.7 }] },
      CaCO3_Calcite: { name: 'Calcite', crystalSystem: 'Hexagonal', spaceGroup: 'R-3c', a: 4.990, b: 4.990, c: 17.061, alpha: 90, beta: 90, gamma: 120, zValue: 6, molarMass: 100.09, atoms: [{ element: 'Ca', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.5 }, { element: 'C', x: 0, y: 0, z: 0.25, occupancy: 1, bIso: 0.5 }, { element: 'O', x: 0.259, y: 0, z: 0.25, occupancy: 1, bIso: 0.7 }] },
      NaCl: { name: 'Halite (NaCl)', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', a: 5.640, b: 5.640, c: 5.640, alpha: 90, beta: 90, gamma: 90, zValue: 4, molarMass: 58.44, atoms: [{ element: 'Na', x: 0, y: 0, z: 0, occupancy: 1, bIso: 1.0 }, { element: 'Cl', x: 0.5, y: 0.5, z: 0.5, occupancy: 1, bIso: 0.8 }] },
      Fe_Alpha: { name: 'Iron (Alpha)', crystalSystem: 'Cubic', spaceGroup: 'Im-3m', a: 2.866, b: 2.866, c: 2.866, alpha: 90, beta: 90, gamma: 90, zValue: 2, molarMass: 55.845, atoms: [{ element: 'Fe', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.4 }] },
      Cu: { name: 'Copper', crystalSystem: 'Cubic', spaceGroup: 'Fm-3m', a: 3.615, b: 3.615, c: 3.615, alpha: 90, beta: 90, gamma: 90, zValue: 4, molarMass: 63.546, atoms: [{ element: 'Cu', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.5 }] },
      Graphite: { name: 'Graphite', crystalSystem: 'Hexagonal', spaceGroup: 'P63/mmc', a: 2.461, b: 2.461, c: 6.708, alpha: 90, beta: 90, gamma: 120, zValue: 4, molarMass: 12.01, atoms: [{ element: 'C', x: 0, y: 0, z: 0.25, occupancy: 1, bIso: 1.5 }, { element: 'C', x: 0.333, y: 0.667, z: 0.25, occupancy: 1, bIso: 1.5 }] },
    };
    
    if (presets[presetType]) {
      const newPhases = [...phases];
      newPhases[index] = { ...newPhases[index], ...presets[presetType] };
      setPhases(newPhases);
    }
  };

  const removePhase = (index: number) => {
    if (phases.length > 1) {
      setPhases(phases.filter((_, i) => i !== index));
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setStrategyStatus('running');
    setShowValidation(false);

    setTimeout(() => {
      const issues = validateSetup();
      if (issues.length > 0) {
        setShowValidation(true);
        setStrategyStatus('failed');
        setIsGenerating(false);
        return;
      }

      try {
        const output = generateRietveldSetup({
          phases,
          maxObsIntensity,
          backgroundModel: bgModel,
          bgTerms,
          profileShape,
          wavelength,
          zeroShift: setupZeroShift,
          sampleDisplacement,
          polarization,
          refineZeroShift,
          refineBkg,
          refineSampleDisplacement,
          geometry,
          divergenceSlit,
          refineSurfaceRoughness,
          twoThetaMin: SIMULATION_RANGE.start,
          twoThetaMax: SIMULATION_RANGE.end,
          stepSize: SIMULATION_RANGE.step,
        });
        setResult(output);
        setStrategyStatus('success');
        setShowValidation(false);
        setIsGenerating(false);

        // Smooth scroll to results zone
        setTimeout(() => {
          const el = document.getElementById('rietveld-result');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);

        // Reset state back to idle after 4 seconds
        setTimeout(() => {
          setStrategyStatus(prev => prev === 'success' ? 'idle' : prev);
        }, 4000);
      } catch (err) {
        console.error(err);
        setStrategyStatus('failed');
        setIsGenerating(false);
      }
    }, 600);
  };

  const applyRefinementPreset = (phaseIdx: number, type: 'full' | 'lattice' | 'profile' | 'structure' | 'none') => {
    const p = {...phases[phaseIdx]};
    if (type === 'full') {
      p.refineLattice = true;
      p.refineProfile = true;
      p.refineAtomicPos = true;
      p.refineScale = true;
      p.refineBiso = true;
      p.refinePrefOrient = true;
      p.refineMicrostrain = true;
      p.refineCrystalliteSize = true;
      p.refineOcc = true;
      p.refineAsymmetry = true;
      p.refineExtinction = true;
      p.refineAnisotropicStrain = true;
      p.refineSphericalHarmonics = true;
    } else if (type === 'lattice') {
      p.refineLattice = true;
      p.refineScale = true;
      p.refineProfile = false;
      p.refineAtomicPos = false;
    } else if (type === 'profile') {
      p.refineProfile = true;
      p.refineMicrostrain = true;
      p.refineCrystalliteSize = true;
      p.refineAnisotropicStrain = true;
      p.refineAsymmetry = true;
      p.refineLattice = false;
    } else if (type === 'structure') {
      p.refineAtomicPos = true;
      p.refineBiso = true;
      p.refineOcc = true;
      p.refineSphericalHarmonics = true;
    } else {
      p.refineLattice = false;
      p.refineProfile = false;
      p.refineAtomicPos = false;
      p.refineScale = false;
      p.refineBiso = false;
      p.refinePrefOrient = false;
      p.refineAnisotropicStrain = false;
      p.refineSphericalHarmonics = false;
      p.refineMicrostrain = false;
      p.refineCrystalliteSize = false;
      p.refineAsymmetry = false;
      p.refineOcc = false;
      p.refineExtinction = false;
    }
    const newPhases = [...phases];
    newPhases[phaseIdx] = p;
    setPhases(newPhases);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
            activeTab === 'simulation' 
              ? 'text-teal-600 dark:text-teal-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Simulation / Education
          {activeTab === 'simulation' && (
            <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
            activeTab === 'setup' 
              ? 'text-teal-600 dark:text-teal-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          Setup Generator
          {activeTab === 'setup' && (
            <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
            activeTab === 'log' 
              ? 'text-teal-600 dark:text-teal-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Convergence Log
          {activeTab === 'log' && (
            <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('rfactor')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
            activeTab === 'rfactor' 
              ? 'text-teal-600 dark:text-teal-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4 text-indigo-400" />
          R-Factor & Quality Lab
          {activeTab === 'rfactor' && (
            <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-teal-600 dark:bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`bg-slate-900 p-6 rounded-2xl shadow-xl border relative overflow-hidden group transition-all duration-500 ${isAutoRefining ? 'border-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.15)]' : 'border-slate-800'}`}>
              <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 rounded-full blur-3xl transition-all duration-700 ${isAutoRefining ? 'bg-teal-500/30 animate-pulse' : 'bg-teal-500/10 group-hover:bg-teal-500/20'}`}></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-gradient-to-br from-teal-500/20 to-teal-900/40 rounded-xl border border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.15)] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <Settings className="w-5 h-5 text-teal-400 relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-wide">Physics Engine</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded cursor-help group/matrix transition-colors hover:bg-indigo-500/20" title="Rietveld Covariance Inter-Parameter Matrix">
                        <Grid className="w-2.5 h-2.5 text-indigo-400" />
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Interactive Simulation Matrix</p>
                      </div>
                      {isAutoRefining && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded-md">
                           <RefreshCw className="w-2 h-2 text-teal-400 animate-spin" />
                           <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest">Optimizing</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => {
                       setUserParams({
                        ...TARGET_PARAMS[simPhase],
                        a: TARGET_PARAMS[simPhase].a * 1.05,
                        scale: TARGET_PARAMS[simPhase].scale * 0.8,
                        fwhm: TARGET_PARAMS[simPhase].fwhm * 1.5,
                        eta: Math.min(1, TARGET_PARAMS[simPhase].eta * 1.2),
                        zeroShift: 0.15,
                        background: TARGET_PARAMS[simPhase].background * 1.2,
                        crystalliteSize: TARGET_PARAMS[simPhase].crystalliteSize * 0.8,
                        microstrain: TARGET_PARAMS[simPhase].microstrain * 1.5,
                        sampleDisplacement: 0.1
                      });
                      setIsAutoRefining(false);
                      setShowMatrix(false);
                    }}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-700 active:scale-95"
                    title="Cold Reset"
                   >
                     <RotateCcw className="w-4 h-4" />
                   </button>
                   <button 
                    onClick={() => setShowMatrix(!showMatrix)}
                    className={`px-3 py-2 rounded-xl transition-all border active:scale-95 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${showMatrix ? 'text-indigo-400 bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'text-slate-400 border-slate-700 hover:bg-slate-800'}`}
                    title="Covariance Matrix"
                   >
                     <Grid className="w-4 h-4" />
                     Matrix
                   </button>
                   <button 
                    onClick={() => setIsAutoRefining(!isAutoRefining)}
                    className={`px-4 py-2 rounded-xl transition-all border active:scale-95 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isAutoRefining ? 'text-rose-400 bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20' : 'text-teal-400 bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]'}`}
                    title="Live Engine"
                   >
                     <PlayCircle className={`w-4 h-4 ${isAutoRefining ? 'animate-pulse' : ''}`} />
                     {isAutoRefining ? 'Halt Engine' : 'Live Tuning'}
                   </button>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                
                {/* Advanced Simulation Matrix Panel */}
                {showMatrix && (
                  <div className="bg-[#050B14] p-4 rounded-xl border border-indigo-500/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] mb-6 animate-fadeIn transition-all">
                    <div className="flex items-center justify-between mb-3 border-b border-indigo-500/20 pb-2">
                       <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-extrabold flex items-center gap-2"><Grid className="w-3.5 h-3.5" /> Parameter Covariance Matrix</span>
                       <span className="text-[8px] uppercase tracking-widest text-slate-500 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">Pearson R²</span>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                      <div className="min-w-[300px]">
                        <div className="grid grid-cols-6 gap-1 mb-1">
                          <div className="text-[8px] font-black text-slate-600 text-center uppercase"></div>
                          {['Lattice', 'Zero 2θ', 'Smp.Displ', 'Size', 'Strain'].map(l => (
                            <div key={l} className="text-[8px] font-black text-slate-500 text-center uppercase truncate">{l}</div>
                          ))}
                        </div>
                        {['Lattice (a)', 'Zero Shift', 'Smp. Displ.', 'Crys. Size', 'Microstrain'].map((rowLabel, i) => (
                           <div key={rowLabel} className="grid grid-cols-6 gap-1 mb-1 items-center">
                              <div className="text-[8px] font-black text-slate-400 uppercase truncate pr-1 text-right">{rowLabel}</div>
                              {[0, 1, 2, 3, 4].map((col) => {
                                // Deterministic fake correlation matrix for display
                                const matrixVals = [
                                  [1.00,  0.86, -0.92,  0.05,  0.12],
                                  [0.86,  1.00, -0.98,  0.02,  0.08],
                                  [-0.92,-0.98,  1.00, -0.01, -0.05],
                                  [0.05,  0.02, -0.01,  1.00, -0.65],
                                  [0.12,  0.08, -0.05, -0.65,  1.00]
                                ];
                                const val = matrixVals[i][col];
                                const isActive = isAutoRefining;
                                const wobble = isActive && i !== col ? (Math.random() * 0.04 - 0.02) : 0;
                                const displayVal = val + wobble;
                                const absVal = Math.abs(displayVal);
                                
                                let bgColor = 'bg-slate-900';
                                if (displayVal > 0.8) bgColor = 'bg-rose-500/80';
                                else if (displayVal > 0.5) bgColor = 'bg-rose-500/50';
                                else if (displayVal > 0.2) bgColor = 'bg-rose-500/20';
                                else if (displayVal < -0.8) bgColor = 'bg-indigo-500/80';
                                else if (displayVal < -0.5) bgColor = 'bg-indigo-500/50';
                                else if (displayVal < -0.2) bgColor = 'bg-indigo-500/20';
                                else if (i === col) bgColor = 'bg-slate-700';

                                return (
                                  <div 
                                    key={col} 
                                    className={`h-6 rounded flex items-center justify-center text-[7px] font-mono font-black border border-white/5 transition-all duration-300 ${bgColor} ${Math.abs(val) > 0.5 ? 'text-white' : 'text-slate-400'} cursor-crosshair hover:ring-1 hover:ring-white/50`}
                                    title={`Correlation: ${displayVal.toFixed(3)}`}
                                  >
                                    {displayVal.toFixed(2)}
                                  </div>
                                );
                              })}
                           </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-[8px] text-slate-500 mt-3 leading-relaxed border-t border-slate-800 pt-2">
                       <span className="text-rose-400 font-bold">● High Positive / Over-correlated</span> &nbsp;|&nbsp; 
                       <span className="text-indigo-400 font-bold">● High Negative / Anti-correlated</span> &nbsp;|&nbsp; 
                       Watch out for strong correlations (e.g., {"|R| > 0.9"}) causing refinement divergence. Zero Shift & Sample Displacement are strongly coupled.
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Multi-Phase Crystallographic Inventory Group */}
                  {(() => {
                    const activePhases = simPhases.filter(p => p.enabled);
                    const totalScaleVal = activePhases.reduce((acc, p) => acc + p.scale, 0);

                    return (
                      <div className="space-y-4 bg-black/25 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                        <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-teal-400 animate-pulse" />
                            <div className="text-[10px] uppercase text-teal-400 font-black tracking-widest">Multi-Phase Inventory</div>
                          </div>
                          <span className="text-[8px] text-slate-400 uppercase tracking-widest bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50 font-black flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {activePhases.length}/{simPhases.length} Active System{simPhases.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Dynamic Abundance Proportional Bar */}
                        {activePhases.length > 0 && (
                          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/[0.03] space-y-2">
                            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                              <span className="flex items-center gap-1.5 font-mono">
                                <Layers className="w-3 h-3 text-teal-400" /> Relative Phase Weight Fraction (Wf)
                              </span>
                              <span className="text-teal-400 font-bold font-mono">Normalized Sum: 100%</span>
                            </div>
                            
                            <div className="h-2 px-[1px] rounded-full overflow-hidden flex bg-slate-900 border border-slate-800/80 shadow-inner">
                              {simPhases.map((p, idx) => {
                                if (!p.enabled) return null;
                                const pct = totalScaleVal > 0 ? (p.scale / totalScaleVal) * 100 : 0;
                                const colorClass = [
                                  'bg-gradient-to-r from-teal-500 to-emerald-400 hover:brightness-110',
                                  'bg-gradient-to-r from-indigo-500 to-purple-400 hover:brightness-110',
                                  'bg-gradient-to-r from-rose-500 to-pink-400 hover:brightness-110',
                                  'bg-gradient-to-r from-amber-500 to-orange-400 hover:brightness-110',
                                  'bg-gradient-to-r from-cyan-500 to-blue-400 hover:brightness-110',
                                  'bg-gradient-to-r from-teal-400 to-indigo-400 hover:brightness-110'
                                ][idx % 6];
                                return (
                                  <div 
                                    key={p.id}
                                    style={{ width: `${pct}%` }}
                                    className={`h-full ${colorClass} transition-all duration-300 relative`}
                                    title={`${p.name}: ${pct.toFixed(1)}%`}
                                  />
                                );
                              })}
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              {simPhases.map((p, idx) => {
                                if (!p.enabled) return null;
                                const pct = totalScaleVal > 0 ? (p.scale / totalScaleVal) * 100 : 0;
                                const borderColors = ['border-teal-500/10', 'border-indigo-500/10', 'border-rose-500/10', 'border-amber-500/10', 'border-cyan-500/10', 'border-teal-400/10'];
                                const textColors = ['text-teal-400 font-bold', 'text-indigo-400 font-bold', 'text-rose-400 font-bold', 'text-amber-400 font-bold', 'text-cyan-400 font-bold', 'text-teal-300 font-bold'];
                                const bulletColors = ['bg-teal-400', 'bg-indigo-400', 'bg-rose-400', 'bg-amber-400', 'bg-cyan-400', 'bg-teal-300'];
                                return (
                                  <div 
                                    key={p.id} 
                                    className={`flex items-center gap-2 p-1.5 rounded bg-black/40 border ${borderColors[idx % 6]} text-[10px]`}
                                  >
                                    <div className={`w-1.5 h-1.5 rounded-full ${bulletColors[idx % 6]}`} />
                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                                      <span className="text-slate-400 font-bold truncate text-[9px]">{p.name}</span>
                                      <span className={`font-mono text-[9px] ${textColors[idx % 6]}`}>{pct.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                          {simPhases.map((phase, idx) => {
                            const stats = computeCrystallographicVolumeAndDensity(phase.phaseType, phase.a);
                            const targetStats = computeCrystallographicVolumeAndDensity(phase.phaseType, phase.targetA);
                            const colorIndex = idx % 6;
                            const badgeColors = [
                              'text-teal-400 bg-teal-500/10 border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.2)]',
                              'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.2)]',
                              'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.2)]',
                              'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
                              'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.2)]',
                              'text-teal-300 bg-teal-400/10 border-teal-400/20 shadow-[0_0_8px_rgba(45,212,191,0.2)]'
                            ];

                            return (
                              <div 
                                key={phase.id}
                                onClick={() => setSelectedSimPhaseIdx(idx)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer relative group overflow-hidden ${
                                  idx === selectedSimPhaseIdx 
                                    ? 'bg-gradient-to-br from-[#070D18] to-[#0A1220] border-teal-500/40 shadow-[inset_0_1px_5px_rgba(20,184,166,0.1),0_4px_25px_rgba(0,0,0,0.5)]' 
                                    : 'bg-[#0B1221]/50 border-[#1e293b] hover:border-slate-700/80 hover:bg-[#070D18]/80'
                                }`}
                              >
                                {idx === selectedSimPhaseIdx && (
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl" />
                                )}
                                
                                <div className="flex items-start justify-between gap-3 relative z-10">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="shrink-0 flex items-center justify-center p-1.5 bg-black/40 rounded border border-slate-800">
                                      <input 
                                        type="checkbox"
                                        checked={phase.enabled}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setSimPhases(prev => {
                                            const next = [...prev];
                                            next[idx] = { ...next[idx], enabled: e.target.checked };
                                            return next;
                                          });
                                        }}
                                        className="w-3.5 h-3.5 rounded bg-black/40 border-slate-700 text-teal-400 focus:ring-teal-500/20 cursor-pointer"
                                      />
                                    </div>
                                    
                                    {editingPhaseId === phase.id ? (
                                      <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                          type="text"
                                          value={editingPhaseName}
                                          onChange={(e) => setEditingPhaseName(e.target.value)}
                                          className="flex-1 px-2.5 py-1 max-h-8 bg-slate-950/80 border border-teal-500 text-teal-200 text-xs rounded focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-bold shadow-inner"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              setSimPhases(prev => {
                                                const next = [...prev];
                                                next[idx] = { ...next[idx], name: editingPhaseName };
                                                return next;
                                              });
                                              setEditingPhaseId(null);
                                            } else if (e.key === 'Escape') {
                                              setEditingPhaseId(null);
                                            }
                                          }}
                                        />
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSimPhases(prev => {
                                              const next = [...prev];
                                              next[idx] = { ...next[idx], name: editingPhaseName };
                                              return next;
                                            });
                                            setEditingPhaseId(null);
                                          }}
                                          className="p-1.5 bg-teal-500/20 text-teal-400 hover:bg-teal-500/40 hover:text-teal-200 rounded border border-teal-500/30 transition-all cursor-pointer shrink-0"
                                          title="Save Name"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className={`text-sm font-black truncate tracking-wide ${phase.enabled ? 'text-slate-100' : 'text-slate-600 line-through'}`}>
                                            {phase.name}
                                          </span>
                                          {phase.enabled && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingPhaseId(phase.id);
                                                setEditingPhaseName(phase.name);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-teal-400 rounded transition-all ml-0.5 shrink-0"
                                              title="Rename Phase"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest mt-1 px-1.5 py-0.5 rounded border inline-block w-fit ${badgeColors[colorIndex]}`}>
                                          {stats.unitCellFormula || phase.phaseType}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-start gap-1.5 shrink-0">
                                    {simPhases.length > 1 && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveSimStructure(idx);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all rounded shrink-0"
                                        title="Delete Phase"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-3 relative z-10">
                                  {/* Weight Fraction & Scale */}
                                  <div className="bg-black/30 rounded-lg p-2 border border-slate-800/40">
                                    <div className="flex items-center justify-between mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                      <span>Weight Frac (Wf)</span>
                                      {phase.enabled && (
                                        <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSimPhases(prev => {
                                                const next = [...prev];
                                                next[idx] = { ...next[idx], scale: Math.max(0, next[idx].scale - 50) };
                                                return next;
                                              });
                                            }}
                                            className="w-4 h-4 bg-slate-900 border border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-400/50 rounded flex items-center justify-center transition-colors"
                                          >
                                            -
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSimPhases(prev => {
                                                const next = [...prev];
                                                next[idx] = { ...next[idx], scale: next[idx].scale + 50 };
                                                return next;
                                              });
                                            }}
                                            className="w-4 h-4 bg-slate-900 border border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-400/50 rounded flex items-center justify-center transition-colors"
                                          >
                                            +
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="font-mono text-sm font-bold text-blue-400 tracking-tight">
                                      {(phase.scale / 10).toFixed(1)}<span className="text-[10px] text-zinc-500 ml-0.5">%</span>
                                    </div>
                                  </div>
                                  
                                  {/* Lattice Paramenters */}
                                  <div className="bg-black/30 rounded-lg p-2 border border-slate-800/40">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Cell Axis (a)</div>
                                    <div className="font-mono text-sm font-bold text-teal-400 tracking-tight flex items-baseline gap-1.5">
                                      {phase.a.toFixed(4)}<span className="text-[10px] text-zinc-500">Å</span>
                                      <span className="text-[9px] text-slate-600 line-through">({phase.targetA.toFixed(4)})</span>
                                    </div>
                                  </div>

                                  {/* Structural Properties */}
                                  <div className="col-span-2 grid grid-cols-3 gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Cell Vol</span>
                                      <span className="font-mono text-xs font-bold text-amber-400">{stats.volume.toFixed(2)}<span className="text-[8px] text-slate-600 ml-0.5">Å³</span></span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Density</span>
                                      <span className="font-mono text-xs font-bold text-indigo-400">{stats.density.toFixed(2)}<span className="text-[8px] text-slate-600 ml-0.5">g/cm³</span></span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">μ-Strain</span>
                                      <span className="font-mono text-xs font-bold text-rose-400">{(phase.microstrain * 100).toFixed(2)}<span className="text-[8px] text-slate-600 ml-0.5">%</span></span>
                                    </div>
                                  </div>
                                </div>

                                {idx === selectedSimPhaseIdx && (
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-indigo-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60">
                          <button
                            onClick={() => handleAddNewSimStructure('Simple Cubic')}
                            className="py-1.5 bg-slate-900/80 hover:bg-teal-900/30 text-teal-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-slate-700/50 hover:border-teal-500/30 hover:shadow-[0_0_10px_rgba(20,184,166,0.15)] flex items-center justify-center gap-1.5"
                          >
                            + Cubic
                          </button>
                          <button
                            onClick={() => handleAddNewSimStructure('Quartz')}
                            className="py-1.5 bg-slate-900/80 hover:bg-teal-900/30 text-teal-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-slate-700/50 hover:border-teal-500/30 hover:shadow-[0_0_10px_rgba(20,184,166,0.15)] flex items-center justify-center gap-1.5"
                          >
                            + Quartz
                          </button>
                          <button
                            onClick={() => handleAddNewSimStructure('FCC')}
                            className="py-1.5 bg-slate-900/80 hover:bg-teal-900/30 text-teal-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-slate-700/50 hover:border-teal-500/30 hover:shadow-[0_0_10px_rgba(20,184,166,0.15)] flex items-center justify-center gap-1.5"
                          >
                            + FCC
                          </button>
                          <button
                            onClick={() => handleAddNewSimStructure('BCC')}
                            className="py-1.5 bg-slate-900/80 hover:bg-teal-900/30 text-teal-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-slate-700/50 hover:border-teal-500/30 hover:shadow-[0_0_10px_rgba(20,184,166,0.15)] flex items-center justify-center gap-1.5"
                          >
                            + BCC
                          </button>
                          <button
                            onClick={() => handleAddNewSimStructure('Rutile')}
                            className="py-1.5 bg-slate-900/80 hover:bg-teal-900/30 text-teal-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-slate-700/50 hover:border-teal-500/30 hover:shadow-[0_0_10px_rgba(20,184,166,0.15)] flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            + Rutile
                          </button>
                          <button
                            onClick={() => handleAddNewSimStructure('Perovskite')}
                            className="py-1.5 bg-slate-900/80 hover:bg-teal-900/30 text-teal-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-slate-700/50 hover:border-teal-500/30 hover:shadow-[0_0_10px_rgba(20,184,166,0.15)] flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            + Perovskite
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Active Selected Phase Properties */}
                  <div className="space-y-4 bg-gradient-to-br from-[#070D18] to-[#0a1120] p-5 rounded-2xl border border-teal-500/30 shadow-[0_10px_40px_rgba(20,184,166,0.1)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.05),transparent_60%)] pointer-events-none" />
                    
                    <div className="flex items-start justify-between pb-4 border-b border-teal-500/10 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(20,184,166,0.2)]">
                          <Beaker className="w-5 h-5 text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.6)] animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                          <div className="text-xs uppercase text-teal-400 font-black tracking-widest leading-none drop-shadow-sm">Selected Phase Model</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> Live Parameter Tuning
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-teal-300 font-black uppercase tracking-widest bg-teal-950/80 px-3 py-1.5 rounded-lg border border-teal-500/40 shadow-inner max-w-[180px] truncate">
                        {currentPhaseObj.name}
                      </span>
                    </div>

                    {/* Sub Tab Buttons */}
                    <div className="grid grid-cols-2 bg-[#050B14] p-1.5 rounded-xl border border-slate-800 gap-1.5 mt-2 relative z-10">
                      <button
                        onClick={() => setSelectedPhaseSubTab('params')}
                        className={`py-2.5 text-center rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          selectedPhaseSubTab === 'params'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-[inset_0_1px_5px_rgba(20,184,166,0.2)]'
                            : 'text-slate-500 hover:text-slate-300 border border-transparent hover:bg-white/5'
                        }`}
                      >
                        <Ruler className="w-4 h-4" />
                        Lattice & State
                      </button>
                      <button
                        onClick={() => setSelectedPhaseSubTab('symmetry')}
                        className={`py-2.5 text-center rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          selectedPhaseSubTab === 'symmetry'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-[inset_0_1px_5px_rgba(20,184,166,0.2)]'
                            : 'text-slate-500 hover:text-slate-300 border border-transparent hover:bg-white/5'
                        }`}
                      >
                        <Compass className="w-4 h-4" />
                        Symmetry Projection
                      </button>
                    </div>

                    {selectedPhaseSubTab === 'params' ? (
                      <div className="space-y-4 relative z-10">
                        {/* Space Group symmetry info block */}
                        <div className="bg-[#050B14] p-4 rounded-xl border border-[#1e293b] shadow-inner">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5 text-slate-500" /> Symmetry System Selector
                            </label>
                            {(() => {
                              const details = SPACE_GROUP_DETAILS[simPhase];
                              return details ? (
                                <span className="text-[9px] font-mono text-teal-400 font-black px-1.5 py-0.5 rounded bg-teal-500/5 border border-teal-500/10">
                                  {details.hermannMauguin} (#{details.number})
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-teal-400 font-black">
                                  {currentPhaseObj.phaseType === 'Simple Cubic' ? 'P m-3m (#221)' :
                                   currentPhaseObj.phaseType === 'BCC' ? 'I m-3m (#229)' :
                                   currentPhaseObj.phaseType === 'FCC' ? 'F m-3m (#225)' :
                                   currentPhaseObj.phaseType === 'Rutile' ? 'P 4_2/mnm (#136)' :
                                   currentPhaseObj.phaseType === 'Perovskite' ? 'P m-3m (#221)' :
                                   'P 32 21 (#154)'}
                                </span>
                              );
                            })()}
                          </div>
                          
                          <div className="relative">
                            <select 
                              value={simPhase}
                              onChange={(e) => setSimPhase(e.target.value)}
                              className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs font-bold text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 appearance-none cursor-pointer hover:bg-slate-900 transition-colors"
                            >
                              <option value="Simple Cubic">Simple Cubic (P m-3m)</option>
                              <option value="BCC">Body Centered Iron Type (I m-3m)</option>
                              <option value="FCC">Face Centered Copper Type (F m-3m)</option>
                              <option value="Perovskite">Perovskite CaTiO3 Type (P m-3m)</option>
                              <option value="Rutile">Rutile TiO2 Type (P 4_2/m n m)</option>
                              <option value="Quartz">Quartz Alpha-SiO2 Type (P 32 21)</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                        </div>

                        {/* Interactive Sliders for Lattice and Scale */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 group/lattice">
                            <div className="flex justify-between items-center mb-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lattice (a)</label>
                              <span className="text-[10px] font-mono font-black text-teal-400">{userParams.a.toFixed(4)} Å</span>
                            </div>
                            <input 
                              type="range" 
                              min={simPhase === 'Quartz' ? 4.5 : 2.5} 
                              max={simPhase === 'Quartz' ? 5.5 : 6.0} 
                              step="0.001"
                              value={userParams.a}
                              onChange={(e) => setUserParams({...userParams, a: parseFloat(e.target.value)})}
                              className="w-full h-1 bg-slate-950 rounded-full appearance-none cursor-pointer accent-teal-500"
                            />
                            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono mt-1 select-none">
                              <span>{simPhase === 'Quartz' ? '4.50' : '2.50'}</span>
                              <span>{simPhase === 'Quartz' ? '5.50' : '6.00'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 group/scale">
                            <div className="flex justify-between items-center mb-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Intensity Scale</label>
                              <span className="text-[10px] font-mono font-black text-blue-400">{userParams.scale}</span>
                            </div>
                            <input 
                              type="range" 
                              min="100" 
                              max="2000" 
                              step="10"
                              value={userParams.scale}
                              onChange={(e) => setUserParams({...userParams, scale: parseFloat(e.target.value)})}
                              className="w-full h-1 bg-slate-950 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono mt-1 select-none">
                              <span>100</span>
                              <span>2000</span>
                            </div>
                          </div>
                        </div>

                        {/* Live Physics derived values */}
                        {(() => {
                          const stats = computeCrystallographicVolumeAndDensity(simPhase, userParams.a);
                          const details = SPACE_GROUP_DETAILS[simPhase];
                          return (
                            <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-white/5 text-[9px] font-mono text-slate-400 shadow-inner select-none">
                              <div className="flex flex-col items-center justify-center p-1.5 border-r border-slate-800">
                                <span className="text-[8px] text-slate-500 uppercase tracking-[0.1em] mb-1 font-sans">Formula Unit</span>
                                <span className="text-[11px] text-slate-200 font-bold font-sans tracking-wide">{stats.unitCellFormula}</span>
                              </div>
                              <div className="flex flex-col items-center justify-center p-1.5 border-r border-slate-800">
                                <span className="text-[8px] text-slate-500 uppercase tracking-[0.1em] mb-1 font-sans">Cell Volume</span>
                                <span className="text-[11px] text-emerald-400 font-extrabold">{stats.volume.toFixed(2)} Å³</span>
                              </div>
                              <div className="flex flex-col items-center justify-center p-1.5">
                                <span className="text-[8px] text-slate-500 uppercase tracking-[0.1em] mb-1 font-sans">Calc Density</span>
                                <span className="text-[11px] text-rose-400 font-extrabold">{stats.density.toFixed(3)} V\u209c</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Space Group Symmetry Sub UI */}
                        {(() => {
                          const details = SPACE_GROUP_DETAILS[simPhase] || SPACE_GROUP_DETAILS['Simple Cubic'];
                          const isTrigonal = details.crystalSystem.includes('Trigonal') || details.crystalSystem.includes('Hexagonal');
                          const eqPts = getEquivalentPositions(simPhase, symmetryProbeX, symmetryProbeY);
                          
                          return (
                            <div className="space-y-4">
                              {/* Layout with SVG visualization on left/top and metrics on right/bottom */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-fadeIn">
                                {/* SVG Interactive Canvas */}
                                <div className="md:col-span-6 bg-slate-950 rounded-xl p-3 border border-slate-850 flex flex-col items-center relative overflow-hidden group">
                                  <div className="absolute top-2 left-2 z-10 flex gap-1 items-center bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 text-[8px] uppercase tracking-wider text-teal-400 font-black">
                                    <Grid className="w-2.5 h-2.5" /> Projection (ab plane)
                                  </div>
                                  
                                  <div className="absolute top-2 right-2 z-10 text-[8px] font-mono text-slate-500 select-none">
                                    Total Nodes: {eqPts.length}
                                  </div>

                                  <div className="w-full aspect-square mt-6 mb-2 relative flex items-center justify-center">
                                    <svg
                                      ref={svgRef}
                                      onMouseDown={handleMouseDown}
                                      onMouseMove={handleMouseMove}
                                      onMouseUp={handleMouseUpOrLeave}
                                      onMouseLeave={handleMouseUpOrLeave}
                                      onTouchStart={handleSvgInteraction}
                                      onTouchMove={handleSvgInteraction}
                                      onTouchEnd={handleMouseUpOrLeave}
                                      className="w-full max-w-[190px] aspect-square bg-[#030712] border border-slate-800/80 rounded-lg cursor-crosshair relative shadow-inner select-none overflow-visible"
                                    >
                                      {/* Grid lines inside unit cell */}
                                      {!isTrigonal ? (
                                        <>
                                          <line x1="0%" y1="25%" x2="100%" y2="25%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                                          <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#334155" strokeWidth="0.5" />
                                          <line x1="0%" y1="75%" x2="100%" y2="75%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                                          
                                          <line x1="25%" y1="0%" x2="25%" y2="100%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                                          <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#334155" strokeWidth="0.5" />
                                          <line x1="75%" y1="0%" x2="75%" y2="100%" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                                        </>
                                      ) : (
                                        <>
                                          {/* Draw hexagonal boundary guidelines */}
                                          <polygon points="95,190 190,95 142,10 47,10 5,95" fill="none" stroke="#1e293b" strokeWidth="0.75" strokeDasharray="3,3" />
                                          {/* Main translation axes */}
                                          <line x1="10" y1="180" x2="180" y2="180" stroke="#334155" strokeWidth="0.5" />
                                          <line x1="10" y1="180" x2="85" y2="20" stroke="#334155" strokeWidth="0.5" />
                                        </>
                                      )}

                                      {/* Draw generated equivalent positions */}
                                      {eqPts.map((pt, pidx) => {
                                        const isOriginal = Math.abs(pt.x - symmetryProbeX) < 1e-3 && Math.abs(pt.y - symmetryProbeY) < 1e-3;
                                        const xy = toSymmetryScreenCoords(pt.x, pt.y, 190, 190, isTrigonal);
                                        return (
                                          <g key={pidx}>
                                            {/* Glow halo */}
                                            <circle
                                              cx={xy.x}
                                              cy={xy.y}
                                              r={isOriginal ? 9 : 6}
                                              fill={isOriginal ? 'rgba(20,184,166,0.22)' : 'rgba(59,130,246,0.14)'}
                                              className={isOriginal ? 'animate-ping' : ''}
                                              style={{ animationDuration: '3s' }}
                                            />
                                            {/* Solid atom core */}
                                            <circle
                                              cx={xy.x}
                                              cy={xy.y}
                                              r={isOriginal ? 4 : 3}
                                              fill={isOriginal ? '#14b8a6' : '#3b82f6'}
                                              stroke="#ffffff"
                                              strokeWidth="0.5"
                                              className="transition-all"
                                            />
                                            {/* Label coordinate tooltip on hover */}
                                            <title>{`(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, z)`}</title>
                                          </g>
                                        );
                                      })}
                                    </svg>
                                  </div>

                                  <div className="text-[8px] text-slate-500 font-sans text-center mt-1 leading-normal max-w-full truncate px-3">
                                    <span className="text-teal-400 font-black">● Primary Probe</span> (drag or touch) • <span className="text-blue-500 font-black">● Symmop Nodes</span>
                                  </div>
                                </div>

                                {/* Coordinate Sliders and Symmetry stats */}
                                <div className="md:col-span-6 flex flex-col justify-between space-y-3.5">
                                  {/* Coordination probe inputs */}
                                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
                                    <div className="text-[10px] uppercase text-teal-400 font-black tracking-widest flex items-center justify-between pb-1.5 border-b border-white/5">
                                      <span>Probe Position</span>
                                      <span className="text-[8px] font-mono text-teal-400/80 font-black font-sans uppercase">Asymmetric Unit</span>
                                    </div>

                                    {/* Slider X */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between font-mono text-[9px]">
                                        <span className="text-slate-400 uppercase font-sans">Fractional X</span>
                                        <span className="text-teal-400 font-black font-mono">{symmetryProbeX.toFixed(3)}</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0.0"
                                        max="1.0"
                                        step="0.01"
                                        value={symmetryProbeX}
                                        onChange={(e) => setSymmetryProbeX(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-slate-950 rounded-full appearance-none cursor-pointer accent-teal-500"
                                      />
                                    </div>

                                    {/* Slider Y */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between font-mono text-[9px]">
                                        <span className="text-slate-400 uppercase font-sans">Fractional Y</span>
                                        <span className="text-teal-400 font-black font-mono">{symmetryProbeY.toFixed(3)}</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0.0"
                                        max="1.0"
                                        step="0.01"
                                        value={symmetryProbeY}
                                        onChange={(e) => setSymmetryProbeY(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-slate-950 rounded-full appearance-none cursor-pointer accent-teal-500"
                                      />
                                    </div>
                                  </div>

                                  {/* Details Table */}
                                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-850 space-y-2 select-none">
                                    <div className="grid grid-cols-2 gap-2 text-[9px] font-sans">
                                      <div className="bg-slate-900/40 p-2 rounded border border-slate-800 flex flex-col">
                                        <span className="text-[7px] text-slate-500 uppercase tracking-wider mb-0.5">Schoenflies</span>
                                        <span className="font-mono text-slate-300 font-black">{details.schoenflies}</span>
                                      </div>
                                      <div className="bg-slate-900/40 p-2 rounded border border-slate-800 flex flex-col">
                                        <span className="text-[7px] text-slate-500 uppercase tracking-wider mb-0.5">Point Group</span>
                                        <span className="font-mono text-slate-300 font-black">{details.pointGroup}</span>
                                      </div>
                                      <div className="bg-slate-900/40 p-2 rounded border border-slate-800 flex flex-col">
                                        <span className="text-[7px] text-slate-500 uppercase tracking-wider mb-0.5">Laue Class</span>
                                        <span className="font-mono text-slate-300 font-black">{details.laueClass}</span>
                                      </div>
                                      <div className="bg-slate-900/40 p-2 rounded border border-slate-800 flex flex-col">
                                        <span className="text-[7px] text-slate-500 uppercase tracking-wider mb-0.5">Lattice Type</span>
                                        <span className="font-mono text-slate-300 font-black truncate">{details.latticeType}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Symmetry Flags (Centrosymm, Chiral, Symmorphic) */}
                              <div className="grid grid-cols-3 gap-2 text-[8px] uppercase tracking-wider font-extrabold select-none">
                                <div className={`px-2 py-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 ${details.centrosymmetric ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400' : 'bg-amber-950/20 border-amber-500/20 text-amber-500'}`}>
                                  <span className="text-[7px] text-slate-500 block font-normal tracking-wide lowercase">Centrosymmetry</span>
                                  <span>{details.centrosymmetric ? 'Centrosymmetric' : 'Non-Centrosymm.'}</span>
                                </div>
                                <div className={`px-2 py-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 ${details.chiral ? 'bg-violet-950/20 border-violet-500/20 text-violet-400' : 'bg-slate-900/40 border-slate-800 text-slate-400'}`}>
                                  <span className="text-[7px] text-slate-500 block font-normal tracking-wide lowercase">Enantiomorphism</span>
                                  <span>{details.chiral ? 'Chiral / Enantio' : 'Achiral'}</span>
                                </div>
                                <div className={`px-2 py-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 ${details.symmorphic ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-yellow-950/20 border-yellow-500/20 text-yellow-500'}`}>
                                  <span className="text-[7px] text-slate-500 block font-normal tracking-wide lowercase">Symmorphism</span>
                                  <span>{details.symmorphic ? 'Symmorphic GP' : 'Non-Symmorphic'}</span>
                                </div>
                              </div>

                              {/* Symmetry Elements Description */}
                              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-[9px] text-slate-400 select-none">
                                <span className="block text-[8px] text-teal-400 uppercase tracking-widest font-extrabold mb-1.5">Symmetry Operators & Elements</span>
                                <ul className="space-y-1 list-disc list-inside h-[56px] overflow-y-auto custom-scrollbar">
                                  {details.symmetryElements.map((el, index) => (
                                    <li key={index} className="text-slate-300 font-sans tracking-wide leading-relaxed">{el}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Peak Management Group */}
                  <div className="space-y-4 bg-gradient-to-br from-[#070D18] to-[#0a1120] p-5 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between pb-4 border-b border-indigo-500/10 relative z-10">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(99,102,241,0.2)]">
                           <Layers className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                         </div>
                         <div className="flex flex-col">
                           <div className="text-xs uppercase text-indigo-400 font-black tracking-widest leading-none drop-shadow-sm">
                             Diffraction Peaks <span className="text-indigo-200/50 lowercase px-1 font-medium">for</span> <span className="text-indigo-300">{currentPhaseObj.name}</span>
                           </div>
                           <div className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1.5 flex items-center gap-1.5">
                             <Activity className="w-3 h-3 text-indigo-500" /> Reflection Inventory
                           </div>
                         </div>
                       </div>
                       <div className="text-[10px] text-indigo-300 font-black bg-indigo-950/80 px-3 py-1.5 rounded-lg border border-indigo-500/40 shadow-inner flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                         {userParams.peaks.filter(p => p.enabled).length} Active Index
                       </div>
                    </div>

                    <div className="bg-[#050B14] rounded-xl border border-indigo-500/20 overflow-hidden shadow-inner relative z-10">
                       <div className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                         <table className="w-full text-left border-collapse">
                           <thead className="sticky top-0 bg-[#070D18] z-10 shadow-md">
                             <tr className="border-b border-indigo-500/20">
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest">HKL Index</th>
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest text-center">Pos 2θ(°)</th>
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest text-center">FWHM(°)</th>
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest text-center">Intensity & State</th>
                               <th className="p-3 text-[9px] uppercase text-indigo-400/80 font-black tracking-widest text-right">Delete</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-indigo-500/10">
                             {userParams.peaks.map((peak, pIdx) => {
                                let display2Theta = 0;
                                let rawTheta = 0;
                                if (['Quartz', 'Rutile', 'Perovskite'].includes(simPhase)) {
                                  const origPeak = simPhase === 'Quartz' ? QUARTZ_PEAKS[pIdx] : simPhase === 'Rutile' ? RUTILE_PEAKS[pIdx] : PEROVSKITE_PEAKS[pIdx];
                                  if (origPeak) {
                                    const shift = (userParams.a - TARGET_PARAMS[simPhase].a) * 2; 
                                    display2Theta = origPeak.t - shift;
                                    rawTheta = display2Theta / 2;
                                  }
                                } else {
                                  if (peak.h !== 0 || peak.k !== 0 || peak.l !== 0) {
                                    const d = userParams.a / Math.sqrt(peak.h*peak.h + peak.k*peak.k + peak.l*peak.l);
                                    const sinTheta = 1.5406 / (2 * d);
                                    if (sinTheta <= 1 && sinTheta > 0) {
                                      rawTheta = Math.asin(sinTheta) * (180 / Math.PI);
                                      display2Theta = 2 * rawTheta;
                                    }
                                  }
                                }
                                
                                if (display2Theta > 0) {
                                  const thetaRad = rawTheta * (Math.PI / 180);
                                  const displacementShift = -userParams.sampleDisplacement * Math.cos(thetaRad);
                                  display2Theta += userParams.zeroShift + displacementShift;
                                }

                                let displayFWHM = 0;
                                if (display2Theta > 0) {
                                   const thetaRad = (display2Theta/2) * (Math.PI / 180);
                                   const bSizeRad = (0.9 * 1.5406) / ((userParams.crystalliteSize * 10) * Math.cos(thetaRad));
                                   const bSizeDeg = bSizeRad * (180 / Math.PI);
                                   const bStrainRad = 4 * userParams.microstrain * Math.tan(thetaRad);
                                   const bStrainDeg = bStrainRad * (180 / Math.PI);
                                   displayFWHM = userParams.fwhm + bSizeDeg + bStrainDeg;
                                }
                                return (
                               <tr key={pIdx} className={`group hover:bg-indigo-500/5 transition-colors ${!peak.enabled ? 'opacity-30 grayscale' : ''}`}>
                                 <td className="p-3">
                                   <div className="flex gap-1 items-center bg-black/40 px-1.5 py-1 rounded inline-flex border border-slate-800/80 shadow-inner">
                                     <input 
                                       type="number"
                                       value={peak.h}
                                       min="0"
                                       max="9"
                                       onChange={(e) => {
                                         const newPeaks = [...userParams.peaks];
                                         newPeaks[pIdx].h = parseInt(e.target.value) || 0;
                                         setUserParams({...userParams, peaks: newPeaks});
                                       }}
                                       className="w-5 bg-transparent border-none text-[10px] font-mono font-black text-indigo-300 text-center focus:ring-0 focus:outline-none p-0"
                                     />
                                     <span className="text-slate-600 text-[8px] font-black">:</span>
                                     <input 
                                       type="number"
                                       value={peak.k}
                                       min="0"
                                       max="9"
                                       onChange={(e) => {
                                         const newPeaks = [...userParams.peaks];
                                         newPeaks[pIdx].k = parseInt(e.target.value) || 0;
                                         setUserParams({...userParams, peaks: newPeaks});
                                       }}
                                       className="w-5 bg-transparent border-none text-[10px] font-mono font-black text-indigo-300 text-center focus:ring-0 focus:outline-none p-0"
                                     />
                                     <span className="text-slate-600 text-[8px] font-black">:</span>
                                     <input 
                                       type="number"
                                       value={peak.l}
                                       min="0"
                                       max="9"
                                       onChange={(e) => {
                                         const newPeaks = [...userParams.peaks];
                                         newPeaks[pIdx].l = parseInt(e.target.value) || 0;
                                         setUserParams({...userParams, peaks: newPeaks});
                                       }}
                                       className="w-5 bg-transparent border-none text-[10px] font-mono font-black text-indigo-300 text-center focus:ring-0 focus:outline-none p-0"
                                     />
                                   </div>
                                 </td>
                                 <td className="p-3 text-center text-xs font-mono font-bold text-teal-200 tracking-tight">
                                    {display2Theta > 0 ? display2Theta.toFixed(2) : <span className="text-slate-600">-</span>}
                                 </td>
                                 <td className="p-3 text-center text-xs font-mono font-bold text-amber-200/90 tracking-tight">
                                    {displayFWHM > 0 ? displayFWHM.toFixed(3) : <span className="text-slate-600">-</span>}
                                 </td>
                                 <td className="p-3 text-center">
                                   <div className="flex items-center justify-center gap-3">
                                     <div className="relative flex items-center">
                                       <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest absolute -left-6">I:</span>
                                       <input 
                                         type="number"
                                         value={peak.intensity}
                                         step="50"
                                         onChange={(e) => {
                                           const newPeaks = [...userParams.peaks];
                                           newPeaks[pIdx].intensity = parseInt(e.target.value) || 0;
                                           setUserParams({...userParams, peaks: newPeaks});
                                         }}
                                         className="w-14 bg-black/60 border border-slate-700/50 rounded px-2 py-1 text-[11px] font-mono font-bold text-indigo-200 text-right focus:border-indigo-500/50 focus:ring-indigo-500/20"
                                       />
                                     </div>
                                     <button 
                                       onClick={() => {
                                         const newPeaks = [...userParams.peaks];
                                         newPeaks[pIdx].enabled = !newPeaks[pIdx].enabled;
                                         setUserParams({...userParams, peaks: newPeaks});
                                       }}
                                       className={`p-1.5 rounded transition-all ${peak.enabled ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]' : 'text-slate-500 bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50'}`}
                                     >
                                        {peak.enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                     </button>
                                   </div>
                                 </td>
                                 <td className="p-3 text-right">
                                   <button 
                                     onClick={() => {
                                       const newPeaks = userParams.peaks.filter((_, i) => i !== pIdx);
                                       setUserParams({...userParams, peaks: newPeaks});
                                     }}
                                     className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded transition-all inline-flex"
                                   >
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                 </td>
                               </tr>
                             )})}
                           </tbody>
                         </table>
                       </div>
                       
                       <div className="p-2 bg-slate-900/30 border-t border-slate-800 flex gap-2">
                         <button 
                            onClick={() => {
                              // generate next HKL or just add a placeholder
                              const newPeak: SimulationPeak = { h: 1, k: 1, l: 1, intensity: 1000, enabled: true };
                              setUserParams({...userParams, peaks: [...userParams.peaks, newPeak]});
                            }}
                            className="flex-1 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                         >
                           <Layers className="w-3 h-3" /> Add Peak
                         </button>
                         <button 
                            onClick={() => {
                              const initial = getPeaksForPhase(simPhase, userParams.a);
                              setUserParams({...userParams, peaks: initial});
                            }}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                            title="Reset Peaks"
                         >
                           <RotateCcw className="w-3.5 h-3.5" />
                         </button>
                       </div>
                    </div>
                  </div>

                  {/* Microstructure & Profile Group */}
                  <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                    <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-rose-400" />
                        <div className="text-[10px] uppercase text-rose-400 font-black tracking-widest">Peak Profile & Microstructure</div>
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-slate-500 uppercase tracking-widest bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">Broadening Physics</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group/fwhm">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base FWHM</label>
                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest group-hover/fwhm:text-rose-400/80 transition-colors">Instrumental Eq.</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="0.01"
                              value={userParams.fwhm}
                              onChange={(e) => setUserParams({...userParams, fwhm: parseFloat(e.target.value) || userParams.fwhm})}
                              className="w-[42px] bg-black/60 text-[10px] font-mono font-black text-rose-400 px-1 py-0.5 rounded border border-slate-700/50 text-right focus:border-rose-500/50 outline-none"
                            />
                          </div>
                        </div>
                        <input type="range" min="0.05" max="1.0" step="0.01" value={userParams.fwhm} onChange={(e) => setUserParams({...userParams, fwhm: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all" />
                      </div>

                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group/mix">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mix (η)</label>
                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest group-hover/mix:text-rose-400/80 transition-colors">Lorentzian Frac</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="0.01"
                              value={userParams.eta}
                              onChange={(e) => setUserParams({...userParams, eta: parseFloat(e.target.value) || userParams.eta})}
                              className="w-[42px] bg-black/60 text-[10px] font-mono font-black text-rose-400 px-1 py-0.5 rounded border border-slate-700/50 text-right focus:border-rose-500/50 outline-none"
                            />
                          </div>
                        </div>
                        <input type="range" min="0.0" max="1.0" step="0.01" value={userParams.eta} onChange={(e) => setUserParams({...userParams, eta: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all" />
                      </div>

                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group/size">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Size (nm)</label>
                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest group-hover/size:text-indigo-400/80 transition-colors">Scherrer Broadening</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="1"
                              value={userParams.crystalliteSize}
                              onChange={(e) => setUserParams({...userParams, crystalliteSize: parseFloat(e.target.value) || userParams.crystalliteSize})}
                              className="w-[42px] bg-black/60 text-[10px] font-mono font-black text-indigo-400 px-1 py-0.5 rounded border border-slate-700/50 text-right focus:border-indigo-500/50 outline-none"
                            />
                          </div>
                        </div>
                        <input type="range" min="1" max="2000" step="1" value={userParams.crystalliteSize} onChange={(e) => setUserParams({...userParams, crystalliteSize: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all" />
                      </div>

                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group/strain">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex flex-col">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Strain %</label>
                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest group-hover/strain:text-amber-400/80 transition-colors">Stokes-Wilson Gauss</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="0.01"
                              value={userParams.microstrain}
                              onChange={(e) => setUserParams({...userParams, microstrain: parseFloat(e.target.value) || userParams.microstrain})}
                              className="w-[42px] bg-black/60 text-[10px] font-mono font-black text-amber-400 px-1 py-0.5 rounded border border-slate-700/50 text-right focus:border-amber-500/50 outline-none"
                            />
                          </div>
                        </div>
                        <input type="range" min="0" max="2" step="0.01" value={userParams.microstrain} onChange={(e) => setUserParams({...userParams, microstrain: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Instrumental Group */}
                  <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                    <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-amber-400" />
                        <div className="text-[10px] uppercase text-amber-400 font-black tracking-widest">Instrument & Background</div>
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-slate-500 uppercase tracking-widest bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">Systematic Errors</span>
                    </div>

                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group/sdispl">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Ruler className="w-3.5 h-3.5 text-zinc-400" />
                          <div className="flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sample Displ. (mm)</label>
                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest group-hover/sdispl:text-zinc-400/80 transition-colors">cos(θ) Peak Shift Error</span>
                          </div>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={userParams.sampleDisplacement}
                          onChange={(e) => setUserParams({...userParams, sampleDisplacement: parseFloat(e.target.value) || 0})}
                          className="w-16 bg-black/60 text-xs font-mono font-black text-zinc-400 px-2 py-1 rounded-md border border-slate-700/50 focus:outline-none focus:border-zinc-500/50 text-right"
                        />
                      </div>
                      <input 
                        type="range" 
                        min="-2.0" 
                        max="2.0" 
                        step="0.01"
                        value={userParams.sampleDisplacement}
                        onChange={(e) => setUserParams({...userParams, sampleDisplacement: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-zinc-500 hover:accent-zinc-400 transition-all"
                      />
                    </div>

                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group/zshift">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <ChartIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <div className="flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zero Shift (°)</label>
                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest group-hover/zshift:text-zinc-400/80 transition-colors">Constant 2θ Offset</span>
                          </div>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={userParams.zeroShift}
                          onChange={(e) => setUserParams({...userParams, zeroShift: parseFloat(e.target.value) || 0})}
                          className="w-16 bg-black/60 text-xs font-mono font-black text-zinc-400 px-2 py-1 rounded-md border border-slate-700/50 focus:outline-none focus:border-zinc-500/50 text-right"
                        />
                      </div>
                      <input 
                        type="range" 
                        min="-1.0" 
                        max="1.0" 
                        step="0.01"
                        value={userParams.zeroShift}
                        onChange={(e) => setUserParams({...userParams, zeroShift: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-zinc-500 hover:accent-zinc-400 transition-all"
                      />
                    </div>

                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group/bkg">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <ChartIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <div className="flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Noise Floor</label>
                            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest group-hover/bkg:text-zinc-400/80 transition-colors">Incoherent Scattering</span>
                          </div>
                        </div>
                        <input
                          type="number"
                          step="1"
                          value={userParams.background}
                          onChange={(e) => setUserParams({...userParams, background: parseFloat(e.target.value) || userParams.background})}
                          className="w-16 bg-black/60 text-xs font-mono font-black text-zinc-400 px-2 py-1 rounded-md border border-slate-700/50 focus:outline-none focus:border-zinc-500/50 text-right"
                        />
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        step="1"
                        value={userParams.background}
                        onChange={(e) => setUserParams({...userParams, background: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-zinc-500 hover:accent-zinc-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Parameter Covariance / Correlation Matrix */}
                <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                  <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-purple-400" />
                      <div className="text-[10px] uppercase text-purple-400 font-black tracking-widest">Covariance Matrix</div>
                    </div>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">Parameter Entanglement</span>
                  </div>
                  
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 overflow-x-auto custom-scrollbar">
                    <div className="min-w-[280px]">
                      <div className="grid grid-cols-6 gap-1 mb-1 text-[8px] font-mono text-slate-500 font-bold text-center">
                        <div className="text-left font-sans">Var</div>
                        <div>Scale</div>
                        <div>Latt_a</div>
                        <div>Zero</div>
                        <div>Bkg</div>
                        <div>Strain</div>
                      </div>
                      
                      {[
                        { name: 'Scale', corr: [1.0, -0.42, 0.15, 0.88, -0.05] },
                        { name: 'Latt_a', corr: [-0.42, 1.0, 0.95, -0.12, 0.35] },
                        { name: 'Zero', corr: [0.15, 0.95, 1.0, 0.05, 0.28] },
                        { name: 'Bkg', corr: [0.88, -0.12, 0.05, 1.0, -0.18] },
                        { name: 'Strain', corr: [-0.05, 0.35, 0.28, -0.18, 1.0] }
                      ].map((row, i) => (
                        <div key={i} className="grid grid-cols-6 gap-1 mb-1 items-center">
                          <div className="text-[8px] font-mono font-bold text-slate-400">{row.name}</div>
                          {row.corr.map((val, j) => {
                            const absVal = Math.abs(val);
                            const isHigh = absVal > 0.8 && i !== j;
                            const isMed = absVal > 0.4 && absVal <= 0.8 && i !== j;
                            let bgColor = 'bg-slate-800/50';
                            let textColor = 'text-slate-500';
                            if (i === j) { bgColor = 'bg-purple-500/20'; textColor = 'text-purple-400'; }
                            else if (isHigh) { bgColor = val > 0 ? 'bg-rose-500/30' : 'bg-blue-500/30'; textColor = val > 0 ? 'text-rose-400' : 'text-blue-400'; }
                            else if (isMed) { bgColor = val > 0 ? 'bg-amber-500/20' : 'bg-cyan-500/20'; textColor = val > 0 ? 'text-amber-400' : 'text-cyan-400'; }

                            // Make the matrix interactive during live refinement
                            const displayVal = (isAutoRefining && i !== j) 
                              ? (val + (Math.random() * 0.1 - 0.05)).toFixed(2) 
                              : val.toFixed(2);
                            
                            return (
                              <div key={j} className={`text-[9px] font-mono text-center p-1 rounded ${bgColor} ${textColor} transition-colors duration-500`}>
                                {displayVal}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[9px] font-sans text-slate-400 leading-relaxed pt-1">
                    <strong className="text-purple-400">Interaction Alerts:</strong> Strong <em>Zero-Shift</em> and <em>Lattice</em> correlation (<span className="text-rose-400 font-mono">0.95</span>). Refine these sequentially to avoid matrix singularity and false minima.
                  </div>
                </div>

                <div className="pt-2">
                  <div className="bg-[#050B14] p-5 rounded-2xl border border-slate-700/80 shadow-[0_5px_15px_rgba(0,0,0,0.5)] relative overflow-hidden group/fit">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent opacity-0 group-hover/fit:opacity-100 transition-opacity duration-700" />
                    <div className="absolute top-0 right-0 p-4 opacity-10 blur-sm mix-blend-screen overflow-hidden">
                       <LineChart className="w-20 h-20 text-teal-400 rotate-12 scale-150" />
                    </div>
                    <div className="flex items-center justify-between relative z-10 border-b border-slate-800 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Diagnostic Metric</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-black">Rwp_index_matrix</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className={`text-4xl font-black font-mono tracking-tighter ${rFactor < 15 ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]' : rFactor < 30 ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`}>
                          {rFactor.toFixed(2)}<span className="text-xl">%</span>
                        </span>
                        <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${rFactor < 15 ? 'text-emerald-500/80' : rFactor < 30 ? 'text-amber-500/80' : 'text-rose-500/80'}`}>
                          {rFactor < 15 ? 'High Quality Fit' : rFactor < 30 ? 'Moderate Variations' : 'Significant Mismatch'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <ScientificMathControl
                        title="Rietveld Alignment & R-factor Verification"
                        formula="R_{wp} = \left[ \frac{\sum w_i (y_{i,\text{obs}} - y_{i,\text{calc}})^2}{\sum w_i y_{i,\text{obs}}^2} \right]^{1/2}"
                        description="Weighted Profile R-factor mathematical estimation. Validates observed vs calculated raw point intensity vectors."
                        variables={[
                          { symbol: 'R_wp', name: 'Weighted Profile Residual', value: rFactor, unit: '%' },
                          { symbol: 'R_exp', name: 'Expected Statistical Minimum', value: referenceRwp, unit: '%' },
                          { symbol: 'χ²', name: 'Goodness of Fit (GoF / Chi²)', value: Math.pow(rFactor / referenceRwp, 2), unit: '' }
                        ]}
                        result={rFactor}
                        resultUnit="%"
                        resultName="Observed Quality Index (Rwp)"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2.5 relative z-10 pt-2 mb-4 border-t border-slate-800/60 mt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Structural Health</span>
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-black">Stability Index</span>
                        </div>
                        <div className="text-right flex flex-col items-end flex-1 max-w-[65%]">
                          <div className="w-full flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 relative">
                               <div 
                                  className={`absolute top-0 left-0 h-full transition-all duration-700 ${stabilityPercentage > 85 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : stabilityPercentage > 50 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}
                                  style={{ width: `${stabilityPercentage}%` }}
                               />
                            </div>
                            <span className={`text-lg font-black font-mono tracking-tighter ${stabilityPercentage > 85 ? 'text-emerald-400' : stabilityPercentage > 50 ? 'text-amber-400' : 'text-rose-500'}`}>
                              {stabilityPercentage.toFixed(1)}<span className="text-[10px]">%</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stability Report Card */}
                      <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1 text-slate-400 leading-normal">
                        <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/40 pb-1 mb-1">
                          <span>Reference Stability Core</span>
                          <span className="text-indigo-400 max-w-[120px] truncate">{currentPhaseObj.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Reference R-wp:</span>
                          <span className="font-mono text-slate-300 font-bold">{referenceRwp.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Calculated Match Ratio:</span>
                          <span className="font-mono text-slate-300 font-bold">{(rFactor / referenceRwp).toFixed(2)}x</span>
                        </div>
                        <div className="text-[9px] italic text-slate-500 pt-1 leading-normal border-t border-slate-800/40 mt-1">
                          {stabilityPercentage > 85 ? (
                            <span className="text-emerald-400/90 font-sans font-bold flex items-center gap-1">✓ Atomic positions highly consistent with local crystal space constraints.</span>
                          ) : stabilityPercentage > 50 ? (
                            <span className="text-amber-400/90 font-sans font-bold flex items-center gap-1">⚠ Acceptable refinement matching. Try adjusting background terms or scale parameters.</span>
                          ) : (
                            <span className="text-rose-400/90 font-sans font-bold flex items-center gap-1">✗ Mismatch detected. Reset lattice parameters or reload clean CIF structure.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  
                  {rHistory.length > 2 ? (
                    <div className="mt-2 h-16 w-full animate-in fade-in zoom-in duration-500">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Convergence Trend</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold text-teal-400/50 uppercase">Iter</span>
                          <span className="text-[9px] font-mono font-black text-teal-400">{iterCount}</span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={rHistory}>
                          <defs>
                            <linearGradient id="rGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="rwp" 
                            stroke="#14b8a6" 
                            fill="url(#rGradient)" 
                            strokeWidth={2}
                            isAnimationActive={false}
                          />
                          <YAxis hide domain={['dataMin', 'dataMax']} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="mt-2 h-16 w-full flex items-center justify-center bg-slate-800/20 rounded-xl border border-slate-700/50 border-dashed">
                       <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest opacity-50">Trend Data Unavialable</span>
                    </div>
                  )}
                  </div>

                  {isAutoRefining && (
                    <div className="mt-4 flex items-center gap-3 bg-teal-500/10 p-3 rounded-xl border border-teal-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(20,184,166,0.1)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-teal-400/10 w-full animate-[pulse_2s_ease-in-out_infinite]" />
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping shadow-[0_0_8px_rgba(45,212,191,0.8)] shrink-0 relative z-10" />
                      <p className="text-[9px] text-teal-300 font-black uppercase tracking-widest relative z-10">
                         Engine running... Minimizing {rFactor > 20 ? 'Structural Mismatch' : 'Residual Noise'}
                      </p>
                    </div>
                  )}

                  {!isAutoRefining && rHistory.length > 0 && rFactor < 15 && (
                    <div className="mt-4 flex items-center gap-3 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 backdrop-blur-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-emerald-500/20 to-transparent" />
                      <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 relative z-10" />
                      <p className="text-[9px] text-emerald-400/90 font-black uppercase tracking-widest relative z-10">
                         Refinement Target Converged
                      </p>
                    </div>
                  )}
                  
                  {!isAutoRefining && rHistory.length === 0 && (
                    <div className="mt-4 flex items-center gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                      <p className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider">
                        Optimization Strategy: Target Residual Reduction below 15%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-slate-950/80 p-8 rounded-[2rem] shadow-2xl border border-white/5 h-[650px] flex flex-col relative overflow-hidden group/pattern ring-1 ring-white/10 ring-inset backdrop-blur-2xl">
              <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none group-hover/pattern:bg-teal-500/10 transition-all duration-1000"></div>
              <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none group-hover/pattern:bg-blue-500/10 transition-all duration-1000"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
                 <div>
                   <h3 className="text-xl font-medium text-slate-100 flex items-center gap-3 tracking-tight font-sans">
                     <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                        <BarChart2 className="w-5 h-5 text-teal-400" />
                     </div>
                     Diffraction Pattern Analysis <span className="text-white/50 lowercase px-1 text-sm pt-1">for</span> <span className="text-teal-300 text-lg">{currentPhaseObj.name}</span>
                   </h3>
                   <div className="flex items-center gap-2 mt-2 px-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Real-time Spectral Synthesis</span>
                   </div>
                 </div>

                 <div className="flex flex-wrap gap-2 p-1.5 bg-black/40 rounded-xl border border-white/5 shadow-inner backdrop-blur-xl max-w-2xl justify-end">
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-default">
                       <div className="w-2 h-2 rounded-full bg-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.6)]"></div>
                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Obs</span>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/10 hover:bg-red-500/20 transition-colors cursor-default">
                       <div className="w-3 h-0.5 bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"></div>
                       <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Calc</span>
                     </div>
                     {simPhases.filter(p => p.enabled).map((p, idx) => {
                       const colors = ['#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#34d399', '#f87171'];
                       const color = colors[idx % colors.length];
                       return (
                         <div key={`legend-${idx}`} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                           <div className="w-3 h-0.5" style={{ backgroundColor: color }}></div>
                           <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{p.name}</span>
                         </div>
                       );
                     })}
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-default">
                       <div className="w-3 h-px border-t border-dashed border-slate-500"></div>
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bkg</span>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:bg-slate-700/40 transition-colors cursor-default">
                       <div className="w-3 h-0.5 bg-slate-500 rounded-full"></div>
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Diff</span>
                     </div>
                 </div>
              </div>

              <div className="flex-1 w-full min-h-0 relative z-10 bg-black/20 rounded-2xl border border-white/5 p-4 backdrop-blur-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={generatePatternData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="diffGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#475569" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="calcGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <filter id="obsGlow">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                    <XAxis 
                      dataKey="twoTheta" 
                      type="number" 
                      domain={[SIMULATION_RANGE.start, SIMULATION_RANGE.end]} 
                      label={{ value: 'Angular Position [2θ°]', position: 'bottom', offset: 0, fill: '#94a3b8', fontSize: 11, fontWeight: 900, textAnchor: 'middle', letterSpacing: '0.15em' }}
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#334155', strokeWidth: 1.5 }}
                      tickLine={{ stroke: '#334155', strokeWidth: 1.5 }}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '16px', padding: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(12px)' }}
                      itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '12px', fontWeight: '900', fontFamily: 'monospace', borderBottom: '1px solid rgba(51, 65, 85, 0.5)', paddingBottom: '8px' }}
                      cursor={{ stroke: '#475569', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      formatter={(value: number, name: string) => [
                        value.toFixed(1) + (name === 'diff' ? ' (offset)' : ''),
                        (name || '').toUpperCase()
                      ]}
                    />
                    
                    {/* Difference Curve (Area for better visual anchoring) */}
                    <Area 
                      type="natural" 
                      dataKey="diff" 
                      name="diff"
                      stroke="#64748b" 
                      strokeWidth={1.5}
                      fill="url(#diffGradient)"
                      dot={false}
                      isAnimationActive={false}
                      activeDot={{ r: 3, fill: '#64748b', stroke: '#0f172a', strokeWidth: 1 }}
                    />
                    
                    {/* Original Observed Data points */}
                    <Scatter 
                      dataKey="obs" 
                      name="obs"
                      fill="#e2e8f0" 
                      shape={(props: any) => {
                        const { cx, cy } = props;
                        return (
                          <g filter="url(#obsGlow)">
                            <circle cx={cx} cy={cy} r={1.5} fill="#f1f5f9" fillOpacity={0.8} />
                          </g>
                        );
                      }}
                      isAnimationActive={false}
                    />
                    
                    {/* Calculated Profile over Obs data */}
                    <Area 
                      type="natural" 
                      dataKey="calc" 
                      name="calc"
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fill="url(#calcGradient)"
                      dot={false} 
                      activeDot={{ r: 5, fill: '#ef4444', stroke: '#0f172a', strokeWidth: 2, className: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' }}
                      isAnimationActive={false}
                    />

                    {/* Individual Phases */}
                    {simPhases.filter(p => p.enabled).map((p, idx) => {
                      const colors = ['#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#34d399', '#f87171'];
                      const color = colors[idx % colors.length];
                      return (
                        <Area 
                          key={`calc_phase_${idx}`}
                          type="natural" 
                          dataKey={`calc_phase_${idx}`}
                          name={p.name}
                          stroke={color} 
                          strokeWidth={1.5}
                          fill="none"
                          dot={false} 
                          activeDot={false}
                          isAnimationActive={false}
                          opacity={0.7}
                        />
                      );
                    })}

                    {/* Background */}
                    <Line 
                      type="natural" 
                      dataKey="bkg" 
                      name="bkg"
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />

                    {/* Individual Phase Profiles Shading under the curve */}
                    {simPhases.map((p, idx) => {
                      if (!p.enabled) return null;
                      const c = [
                        { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.12)' }, // Emerald
                        { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.12)' },  // Cyan
                        { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.12)' },  // Amber
                        { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.12)' },  // Purple
                        { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.12)' }   // Pink
                      ][idx % 5];
                      return (
                        <Area 
                          key={`phase_area_${p.id}`}
                          type="natural" 
                          dataKey={`calc_phase_${idx}`} 
                          name={`${p.name}`}
                          stroke={c.stroke} 
                          strokeWidth={1.2}
                          strokeDasharray="2 2"
                          fill={c.fill}
                          dot={false}
                          isAnimationActive={false}
                        />
                      );
                    })}

                    {/* Bragg Peak Vertical Indicators */}
                    {activePeaksForVisuals.map((peak, idx) => (
                      <ReferenceLine 
                        key={`peak-marker-${idx}`}
                        x={peak.twoTheta}
                        stroke={peak.color}
                        strokeDasharray="3 3"
                        strokeOpacity={0.6}
                        strokeWidth={1}
                        label={{
                          position: 'top',
                          value: peak.label,
                          fill: peak.color,
                          fontSize: 9,
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          dy: -5, // offset slightly to fit within top margin
                        }}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Status Overlay */}
              <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-[#0B1221]/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-700/50 z-20 shadow-[0_5px_20px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute animate-ping opacity-75" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] relative z-10" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">Active Data Feed</span>
                </div>
                <div className="h-4 w-[1px] bg-slate-700/80" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Resolution: <span className="text-white">{SIMULATION_RANGE.step}°/step</span></span>
                <div className="h-4 w-[1px] bg-slate-700/80" />
                <div className="flex items-center gap-2">
                   <Activity className="w-3.5 h-3.5 text-cyan-400" />
                   <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">Rendering Engine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'setup' && (
        // --- Setup Generator Tab Content ---
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          {/* Refinement Dashboard Card */}
          <div className="bg-slate-950/80 p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group ring-1 ring-white/10 ring-inset backdrop-blur-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <RefreshCw className="w-32 h-32 rotate-12" />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                    <Database className="w-5 h-5 text-teal-400" />
                  </div>
                  <h2 className="text-2xl font-medium text-slate-100 tracking-tight font-sans">Setup Dashboard</h2>
                </div>
                <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">
                  Total refined parameters: <span className="text-teal-400 font-mono">{refinementMetrics.total}</span>. 
                  Strategy includes <span className="text-amber-400 font-mono">{refinementMetrics.global} global</span> and <span className="text-indigo-400 font-mono">{refinementMetrics.phase} phase</span> coefficients.
                </p>
                <p className="text-slate-400 text-[10px] font-medium leading-relaxed mt-2 italic flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-teal-400" />
                  Guide: Start with Scale/Bkg, then Zero-Shift, Lattice, Peak Shape, and Structure.
                </p>
              </div>

              <div className="flex flex-row md:flex-nowrap gap-4 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                 <div className="flex-1 md:flex-none bg-black/40 px-5 py-3 rounded-2xl border border-white/5 shadow-inner flex flex-col items-center min-w-[100px] backdrop-blur-xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center font-mono">Active Flags</span>
                    <span className="text-xl font-medium text-teal-400 font-mono">{refinementMetrics.total}</span>
                 </div>
                 <div className="flex-1 md:flex-none bg-black/40 px-5 py-3 rounded-2xl border border-white/5 shadow-inner flex flex-col items-center min-w-[100px] backdrop-blur-xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center font-mono">Active Phases</span>
                    <span className="text-xl font-medium text-amber-400 font-mono">{refinementMetrics.activePhases}</span>
                 </div>
                 <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`shrink-0 flex-none px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 group/btn whitespace-nowrap min-w-[180px] ${
                      isGenerating 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50' 
                        : strategyStatus === 'success'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : strategyStatus === 'failed'
                        ? 'bg-rose-600 text-white hover:bg-rose-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : 'bg-white text-black hover:bg-teal-400 hover:shadow-[0_0_30px_rgba(20,184,166,0.4)]'
                    }`}
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-slate-500" />
                    ) : strategyStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-white animate-bounce" />
                    ) : strategyStatus === 'failed' ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-white animate-pulse" />
                    ) : (
                      <Zap className="w-4 h-4 shrink-0 group-hover:scale-125 transition-transform text-black" />
                    )}
                    <span>
                      {isGenerating ? 'Computing...' :
                       strategyStatus === 'success' ? 'Compiled!' :
                       strategyStatus === 'failed' ? 'Error!' :
                       'Build Strategy'}
                    </span>
                  </button>
              </div>
            </div>

            {/* Strategy Status Banner */}
            {strategyStatus !== 'idle' && (
              <div className={`mt-6 p-4 rounded-2xl border backdrop-blur-md animate-in slide-in-from-top-4 duration-300 flex items-center justify-between gap-4 relative z-10 ${
                strategyStatus === 'running' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-[0_0_30px_rgba(99,102,241,0.05)]' :
                strategyStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.05)]' :
                'bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_30px_rgba(239,68,68,0.05)]'
              }`}>
                <div className="flex items-center gap-3">
                  {strategyStatus === 'running' && (
                    <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                  )}
                  {strategyStatus === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce shrink-0" />
                  )}
                  {strategyStatus === 'failed' && (
                    <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest font-mono">
                      {strategyStatus === 'running' && 'Analyzing Crystal Symmetry & Matrices...'}
                      {strategyStatus === 'success' && 'Strategy Built Successfully!'}
                      {strategyStatus === 'failed' && 'Strategy Build Failed'}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {strategyStatus === 'running' && 'Solving system model and formulating multi-step refinement protocol...'}
                      {strategyStatus === 'success' && 'Formulated sequential execution steps. Scroll down to review the Refinement Execution Plan.'}
                      {strategyStatus === 'failed' && 'Please fix the validation parameters in the Configuration Matrix below.'}
                    </p>
                  </div>
                </div>
                {strategyStatus === 'success' && (
                  <button 
                    onClick={() => {
                      const el = document.getElementById('rietveld-result');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-emerald-500/20 shrink-0 cursor-pointer"
                  >
                    View Plan ↓
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Configuration */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-950/80 p-6 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden group transition-all duration-500 ring-1 ring-white/10 ring-inset backdrop-blur-lg">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-700"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-500/20 rounded-xl border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                    <Settings className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-slate-100 tracking-tight font-sans">Refinement Setup</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuration Matrix</p>
                    </div>
                  </div>
                </div>
              </div>
    
              <div className="space-y-6 relative z-10">
                {/* Global Settings */}
                <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                  <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                       <Globe className="w-4 h-4 text-blue-400" />
                       <div className="text-[10px] uppercase text-blue-400 font-black tracking-widest">Global Configuration</div>
                    </div>
                    <button 
                      onClick={() => setExpertMode(!expertMode)}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${expertMode ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'}`}
                    >
                      {expertMode ? 'Expert Mode: ON' : 'Expert Mode: OFF'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Max Obs Intensity</label>
                      <input
                        type="number"
                        value={maxObsIntensity}
                        onChange={(e) => setMaxObsIntensity(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-black/60 text-teal-400 border border-white/10 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:border-white/20 transition-all"
                      />
                    </div>
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Radiation Source</label>
                      <select 
                         value={radSource}
                         onChange={(e) => {
                           setRadSource(e.target.value);
                           if (e.target.value === 'Cu_Ka1') setWavelength(1.54056);
                           else if (e.target.value === 'Cu_Ka_avg') setWavelength(1.5418);
                           else if (e.target.value === 'Co_Ka1') setWavelength(1.78896);
                           else if (e.target.value === 'Mo_Ka1') setWavelength(0.70932);
                           else if (e.target.value === 'Cr_Ka1') setWavelength(2.2897);
                         }}
                         className="w-full px-3 py-2 bg-black/60 text-amber-400 border border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:border-white/20 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all appearance-none"
                      >
                        <option value="Cu_Ka1">Cu Kα1 (1.5406 Å)</option>
                        <option value="Cu_Ka_avg">Cu Kα Avg (1.5418 Å)</option>
                        <option value="Co_Ka1">Co Kα1 (1.7890 Å)</option>
                        <option value="Mo_Ka1">Mo Kα1 (0.7093 Å)</option>
                        <option value="Cr_Ka1">Cr Kα1 (2.2897 Å)</option>
                        <option value="Custom">Custom λ</option>
                      </select>
                    </div>
                  </div>

                  {radSource === 'Custom' && (
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 animate-in shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset slide-in-from-top-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">Custom Wavelength (Å)</label>
                      <input
                        type="number" step="0.0001"
                        value={wavelength}
                        onChange={(e) => setWavelength(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-black/60 text-amber-400 border border-white/10 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:border-white/20 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Instrumental Parameters Group */}
                <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                  <div className="flex items-center gap-2 px-1 pb-2 border-b border-slate-800/80">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <div className="text-[10px] uppercase text-emerald-400 font-black tracking-widest">Instrumental Parameters</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset group">
                      <div className="flex justify-between items-start mb-2">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Zero Shift (°)</label>
                        <button 
                          onClick={() => setRefineZeroShift(!refineZeroShift)}
                          className={`p-1 rounded-md border transition-all ${refineZeroShift ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                          title="Toggle Zero Shift Refinement"
                        >
                          <Zap className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="number" step="0.001"
                        value={setupZeroShift}
                        onChange={(e) => setSetupZeroShift(parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:border-white/20 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                      />
                    </div>
                    
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset group">
                      <div className="flex justify-between items-start mb-2">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Sample Displ. (SyCos)</label>
                        <button 
                          onClick={() => setRefineSampleDisplacement(!refineSampleDisplacement)}
                          className={`p-1 rounded-md border transition-all ${refineSampleDisplacement ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                          title="Toggle Sample Displacement Refinement"
                        >
                          <Zap className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="number" step="0.001"
                        value={sampleDisplacement}
                        onChange={(e) => setSampleDisplacement(parseFloat(e.target.value))}
                        className="w-full px-2 py-1.5 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:border-white/20 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Instrument Geometry</label>
                      <select 
                         value={geometry}
                         onChange={(e) => setGeometry(e.target.value as any)}
                         className="w-full px-3 py-2 bg-black/60 text-emerald-400 border border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:border-white/20 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all appearance-none"
                      >
                        <option value="Bragg-Brentano">Bragg-Brentano</option>
                        <option value="Debye-Scherrer">Debye-Scherrer</option>
                      </select>
                    </div>
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Divergence Slit</label>
                      <select 
                         value={divergenceSlit}
                         onChange={(e) => setDivergenceSlit(e.target.value as any)}
                         className="w-full px-3 py-2 bg-black/60 text-emerald-400 border border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:border-white/20 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all appearance-none"
                      >
                        <option value="Fixed">Fixed Slit</option>
                        <option value="Variable">Variable Slit</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">Polarization Factor (Lp)</label>
                      <input
                        type="number" step="0.001"
                        value={polarization}
                        onChange={(e) => setPolarization(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-black/60 text-amber-400 border border-white/10 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:border-white/20 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                      />
                    </div>
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset group">
                      <div className="flex justify-between items-start mb-2">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Surface Roughness</label>
                        <button 
                          onClick={() => setRefineSurfaceRoughness(!refineSurfaceRoughness)}
                          className={`p-1 rounded-md border transition-all ${refineSurfaceRoughness ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                          title="Toggle Surface Roughness Refinement"
                        >
                          <Zap className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        Apply Suaya/Pitschke correction for surface microabsorption.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background & Profile Group */}
                <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                  <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <div className="text-[10px] uppercase text-purple-400 font-black tracking-widest">Background & Profile</div>
                    </div>
                    <button 
                       onClick={() => setRefineBkg(!refineBkg)}
                       className={`px-2 py-1 rounded-md border transition-all flex items-center gap-1.5 ${refineBkg ? 'bg-teal-500/20 border-teal-500/40 text-teal-400' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'}`}
                       title="Toggle Background Refinement"
                    >
                       <Zap className="w-3 h-3" />
                       <span className="text-[8px] font-black uppercase">Refine Bkg</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <select 
                         value={bgModel}
                         onChange={(e) => setBgModel(e.target.value as any)}
                         className="w-full px-3 py-2 bg-black/60 text-teal-400 border border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:border-white/20 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all appearance-none"
                      >
                        <option value="Chebyshev">Chebyshev Polynomial</option>
                        <option value="Shifted_Chebyshev">Shifted Chebyshev</option>
                        <option value="Polynomial">Standard Polynomial</option>
                        <option value="Linear_Interpolation">Linear Background</option>
                      </select>
                      {bgModel !== 'Linear_Interpolation' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-all">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Terms:</span>
                          <input 
                            type="number" min="1" max="24"
                            value={bgTerms}
                            onChange={(e) => setBgTerms(parseInt(e.target.value))}
                            className="w-full bg-black/60 text-teal-400 border border-slate-700 rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500/50 px-2 py-0.5"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <select 
                         value={profileShape}
                         onChange={(e) => setProfileShape(e.target.value as any)}
                         className="w-full px-3 py-2 bg-black/60 text-teal-400 border border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:border-white/20 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all appearance-none"
                      >
                        <option value="Thompson-Cox-Hastings">Thompson-Cox (TCHZ)</option>
                        <option value="Pseudo-Voigt">Pseudo-Voigt (η)</option>
                        <option value="Pearson-VII">Pearson-VII (m)</option>
                      </select>
                      <div className="mt-2 text-[9px] font-medium text-slate-500 px-1 leading-tight">
                        Default: Full Axial Divergence Correction included
                      </div>
                    </div>
                  </div>
                </div>
    
                {/* Phases */}
                <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset">
                  <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-pink-400" />
                      <div className="text-[10px] uppercase text-pink-400 font-black tracking-widest">Phases</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer text-[9px] uppercase tracking-widest text-indigo-400 font-black hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded-md border border-indigo-500/30 transition-all shadow-sm">
                        <Download className="w-3 h-3" /> Insert CIF
                        <input type="file" accept=".cif" className="hidden" onChange={handleCifUpload} />
                      </label>
                      <button onClick={addPhase} className="text-[9px] uppercase tracking-widest text-teal-400 font-black hover:text-teal-300 flex items-center gap-1 bg-teal-500/10 hover:bg-teal-500/20 px-2 py-1 rounded-md border border-teal-500/30 transition-all shadow-sm">
                        + Add Phase
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {phases.map((phase, idx) => (
                      <div key={`phase-ref-${idx}-${phase.name}`} className="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md ring-1 ring-white/5 ring-inset shadow-inner relative group/phase transition-colors hover:border-teal-500/30">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/phase:opacity-100 transition-opacity">
                          <div className="relative group/material">
                             <button className="text-slate-500 hover:text-indigo-400 bg-black/60 p-1.5 rounded-lg border border-white/5 hover:border-indigo-500/50 transition-all shadow-sm flex items-center gap-1">
                               <Database className="w-3.5 h-3.5" />
                               <span className="text-[7px] font-black uppercase">Material</span>
                             </button>
                             <div className="absolute right-0 top-full mt-2 w-56 bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl z-50 py-1 hidden group-hover/material:block animate-in fade-in slide-in-from-top-1 max-h-64 overflow-y-auto custom-scrollbar">
                               <div className="px-3 py-1.5 border-b border-slate-800 mb-1 sticky top-0 bg-[#0F172A]">
                                 <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Material Database</span>
                               </div>
                               <button onClick={() => applyPreset(idx, 'Si')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">Silicon (Standard)</button>
                               <button onClick={() => applyPreset(idx, 'LaB6')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">LaB6 (Standard)</button>
                               <button onClick={() => applyPreset(idx, 'Al2O3')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">Alumina (Alpha)</button>
                               <button onClick={() => applyPreset(idx, 'TiO2_Rutile')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">Rutile (TiO2)</button>
                               <button onClick={() => applyPreset(idx, 'TiO2_Anatase')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">Anatase (TiO2)</button>
                               <button onClick={() => applyPreset(idx, 'SiO2_Quartz')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">Quartz (SiO2)</button>
                               <button onClick={() => applyPreset(idx, 'CaCO3_Calcite')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">Calcite (CaCO3)</button>
                               <button onClick={() => applyPreset(idx, 'NaCl')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">Halite (NaCl)</button>
                               <button onClick={() => applyPreset(idx, 'Fe_Alpha')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">Iron (Alpha)</button>
                               <button onClick={() => applyPreset(idx, 'Cu')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">Copper</button>
                               <button onClick={() => applyPreset(idx, 'Graphite')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-indigo-400">Graphite</button>
                             </div>
                          </div>
                          <div className="relative group/presets">
                             <button className="text-slate-500 hover:text-amber-400 bg-black/60 p-1.5 rounded-lg border border-white/5 hover:border-amber-500/50 transition-all shadow-sm flex items-center gap-1">
                               <PlayCircle className="w-3.5 h-3.5" />
                               <span className="text-[7px] font-black uppercase">Refine</span>
                             </button>
                             <div className="absolute right-0 top-full mt-2 w-48 bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl z-50 py-1 hidden group-hover/presets:block animate-in fade-in slide-in-from-top-1">
                               <div className="px-3 py-1.5 border-b border-slate-800 mb-1">
                                 <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Setup Presets</span>
                               </div>
                               <button onClick={() => applyRefinementPreset(idx, 'full')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-teal-400 flex items-center justify-between">
                                 <span>Full Characterization</span>
                                 <Zap className="w-3 h-3 text-amber-500" />
                               </button>
                               <button onClick={() => applyRefinementPreset(idx, 'lattice')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-teal-400">Lattice & Scale Only</button>
                               <button onClick={() => applyRefinementPreset(idx, 'profile')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-teal-400">Peak Shape Optimization</button>
                               <button onClick={() => applyRefinementPreset(idx, 'structure')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-teal-400">Atomic Positions (SOF/Biso)</button>
                               <div className="my-1 border-t border-slate-800"></div>
                               <button onClick={() => applyRefinementPreset(idx, 'none')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-rose-500 hover:bg-rose-500/10">Clear All Flags</button>
                             </div>
                          </div>
                          
                          <button 
                            onClick={() => duplicatePhase(idx)}
                            className="text-slate-500 hover:text-teal-400 bg-black/60 p-1.5 rounded-lg border border-white/5 hover:border-teal-500/50 transition-all shadow-sm"
                            title="Duplicate Phase"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {phases.length > 1 && (
                            <button 
                              onClick={() => removePhase(idx)}
                              className="text-slate-500 hover:text-red-400 bg-black/60 p-1.5 rounded-lg border border-white/5 hover:border-red-500/50 transition-all shadow-sm"
                              title="Remove Phase"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                           <div className="grid gap-4">
                             <div className="flex flex-col gap-4">
                               <div className="flex-1">
                               <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Phase Name</label>
                               <input
                                 type="text"
                                 value={phase.name}
                                 onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                                 className="w-full px-4 py-2 bg-black/60 text-white border border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:ring-1 focus:border-white/20 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all shadow-inner"
                               />
                             </div>
                              <div className="bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner space-y-3 ring-1 ring-white/5 ring-inset mt-4">
                                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono">Active Refinements</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineScale', !phase.refineScale)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineScale ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                    title="Refine Phase Scale"
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">SCALE</span>
                                    <Scale className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineScale ? 'scale-110 text-blue-400' : 'text-slate-600 group-hover:text-blue-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineLattice', !phase.refineLattice)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineLattice ? 'bg-teal-500/10 border-teal-500/50 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                    title="Refine Lattice Parameters"
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">LATTICE</span>
                                    <Ruler className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineLattice ? 'scale-110 text-teal-400' : 'text-slate-600 group-hover:text-teal-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineProfile', !phase.refineProfile)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineProfile ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                    title="Refine Profile Parameters (U, V, W)"
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">PROFILE</span>
                                    <Activity className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineProfile ? 'scale-110 text-rose-400' : 'text-slate-600 group-hover:text-rose-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineAtomicPos', !phase.refineAtomicPos)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineAtomicPos ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                    title="Refine Atomic Positions"
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">ATOMS</span>
                                    <Layers className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineAtomicPos ? 'scale-110 text-emerald-400' : 'text-slate-600 group-hover:text-emerald-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineCrystalliteSize', !phase.refineCrystalliteSize)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineCrystalliteSize ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                    title="Refine Crystallite Size"
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">SIZE (LX)</span>
                                    <Maximize className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineCrystalliteSize ? 'scale-110 text-indigo-400' : 'text-slate-600 group-hover:text-indigo-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineMicrostrain', !phase.refineMicrostrain)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineMicrostrain ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                    title="Refine Microstrain"
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">STRAIN (LY)</span>
                                    <Zap className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineMicrostrain ? 'scale-110 text-amber-400' : 'text-slate-600 group-hover:text-amber-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineAsymmetry', !phase.refineAsymmetry)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineAsymmetry ? 'bg-teal-400/10 border-teal-400/50 text-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">ASYMMETRY</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineAsymmetry ? 'scale-110 text-teal-300' : 'text-slate-600 group-hover:text-teal-300/50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineExtinction', !phase.refineExtinction)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineExtinction ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">EXTINCTION</span>
                                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineExtinction ? 'scale-110 text-orange-400' : 'text-slate-600 group-hover:text-orange-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineBiso', !phase.refineBiso)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineBiso ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">B-ISO</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineBiso ? 'scale-110 text-yellow-400' : 'text-slate-600 group-hover:text-yellow-400/50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineOcc', !phase.refineOcc)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineOcc ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">OCCUPANCY</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineOcc ? 'scale-110 text-fuchsia-400' : 'text-slate-600 group-hover:text-fuchsia-400/50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refinePrefOrient', !phase.refinePrefOrient)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between col-span-2 group ${phase.refinePrefOrient ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">PREF ORIENT (M-D)</span>
                                    <Compass className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refinePrefOrient ? 'scale-110 text-cyan-400' : 'text-slate-600 group-hover:text-cyan-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineAnisotropicStrain', !phase.refineAnisotropicStrain)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between col-span-2 group ${phase.refineAnisotropicStrain ? 'bg-pink-500/10 border-pink-500/50 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">ANISO STRAIN (STEPHENS)</span>
                                    <Zap className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineAnisotropicStrain ? 'scale-110 text-pink-400' : 'text-slate-600 group-hover:text-pink-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineSphericalHarmonics', !phase.refineSphericalHarmonics)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between col-span-2 group ${phase.refineSphericalHarmonics ? 'bg-violet-500/10 border-violet-500/50 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.15)]' : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/60'}`}
                                  >
                                    <span className="text-[10px] font-bold tracking-widest truncate font-mono uppercase">SPHERICAL HARMONICS</span>
                                    <Layers className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineSphericalHarmonics ? 'scale-110 text-violet-400' : 'text-slate-600 group-hover:text-violet-400/50'}`} />
                                  </button>
                                </div>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Space Group</label>
                               <input
                                 type="text"
                                 placeholder="e.g. Fd-3m"
                                 value={phase.spaceGroup || ''}
                                 onChange={(e) => updatePhase(idx, 'spaceGroup', e.target.value)}
                                 className="w-full px-4 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all shadow-inner"
                               />
                             </div>
                             <div>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Phase Scale</label>
                               <input
                                 type="number"
                                 step="0.0001"
                                 value={phase.scale || 1.0}
                                 onChange={(e) => updatePhase(idx, 'scale', parseFloat(e.target.value))}
                                 className="w-full px-4 py-2 bg-[#050B14] text-blue-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
                               />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">System</label>
                              <select
                                value={phase.crystalSystem}
                                onChange={(e) => updatePhase(idx, 'crystalSystem', e.target.value)}
                                className="w-full px-3 py-2 bg-[#050B14] text-white border border-[#1e293b] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all shadow-inner"
                              >
                                <option value="Cubic">Cubic</option>
                                <option value="Tetragonal">Tetragonal</option>
                                <option value="Orthorhombic">Orthorhombic</option>
                                <option value="Hexagonal">Hexagonal</option>
                                <option value="Monoclinic">Monoclinic</option>
                                <option value="Triclinic">Triclinic</option>
                              </select>
                            </div>
                            <div>
                               <label className="block text-[10px] uppercase text-slate-400 font-black mb-2 tracking-widest">a (Å)</label>
                               <input
                                type="number"
                                step="0.001"
                                value={phase.a}
                                onChange={(e) => updatePhase(idx, 'a', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 shadow-inner"
                              />
                            </div>
                          </div>
                          
                          {/* Conditional inputs for non-cubic */}
                          {['Tetragonal', 'Orthorhombic', 'Hexagonal', 'Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                            <div className="grid grid-cols-3 gap-3">
                                 {['Orthorhombic', 'Monoclinic', 'Triclinic', 'Hexagonal', 'Tetragonal'].includes(phase.crystalSystem) && (
                                    <div>
                                       <label className="block text-[10px] uppercase text-slate-500 font-black mb-2 tracking-widest">c (Å)</label>
                                       <input
                                          type="number"
                                          step="0.01"
                                          value={phase.c || phase.a}
                                          onChange={(e) => updatePhase(idx, 'c', parseFloat(e.target.value))}
                                          className="w-full px-3 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 shadow-inner"
                                        />
                                    </div>
                                 )}
                                 {['Orthorhombic', 'Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                                    <div>
                                       <label className="block text-[10px] uppercase text-slate-500 font-black mb-2 tracking-widest">b (Å)</label>
                                       <input
                                          type="number"
                                          step="0.01"
                                          value={phase.b || phase.a}
                                          onChange={(e) => updatePhase(idx, 'b', parseFloat(e.target.value))}
                                          className="w-full px-3 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 shadow-inner"
                                        />
                                    </div>
                                 )}
                                 {['Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                                    <div>
                                       <label className="block text-[10px] uppercase text-slate-500 font-black mb-2 tracking-widest">β (°)</label>
                                       <input
                                          type="number"
                                          step="0.1"
                                          value={phase.beta || 90}
                                          onChange={(e) => updatePhase(idx, 'beta', parseFloat(e.target.value))}
                                          className="w-full px-3 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 shadow-inner"
                                        />
                                    </div>
                                 )}
                              </div>
                           )}

                           {/* Physical Density Calculator Fields */}
                           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1e293b]/50">
                             <div>
                               <label className="block text-[10px] uppercase text-slate-500 font-black mb-2 tracking-widest">Z (Formula Units)</label>
                               <input
                                  type="number"
                                  placeholder="e.g. 8"
                                  value={phase.zValue || ''}
                                  onChange={(e) => updatePhase(idx, 'zValue', parseInt(e.target.value))}
                                  className="w-full px-3 py-2.5 bg-[#050B14] text-amber-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-inner"
                                />
                             </div>
                             <div>
                               <label className="block text-[10px] uppercase text-slate-500 font-black mb-2 tracking-widest">Molar Mass (g/mol)</label>
                               <input
                                  type="number"
                                  step="0.01"
                                  placeholder="e.g. 28.08"
                                  value={phase.molarMass || ''}
                                  onChange={(e) => updatePhase(idx, 'molarMass', parseFloat(e.target.value))}
                                  className="w-full px-3 py-2.5 bg-[#050B14] text-amber-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-inner"
                                />
                             </div>
                           </div>

                           {expertMode && (
                             <div className="pt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                               <h4 className="text-[9px] font-black text-rose-400/70 uppercase tracking-[0.2em] mb-2 px-1">Caglioti Peak Parameters (U, V, W)</h4>
                               <div className="grid grid-cols-3 gap-3">
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1 truncate">U</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.u || 0.01}
                                      onChange={(e) => updatePhase(idx, 'u', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1 truncate">V</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.v || -0.01}
                                      onChange={(e) => updatePhase(idx, 'v', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1 truncate">W</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.w || 0.01}
                                      onChange={(e) => updatePhase(idx, 'w', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">LX (Size - Lorentzian)</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.lx || 0}
                                      onChange={(e) => updatePhase(idx, 'lx', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-indigo-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">LY (Strain - Lorentzian)</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.ly || 0}
                                      onChange={(e) => updatePhase(idx, 'ly', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-indigo-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">Mixing Eta (G/L Mix)</label>
                                   <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="1"
                                      value={phase.eta || 0.5}
                                      onChange={(e) => updatePhase(idx, 'eta', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-teal-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">Shape Factor (Pearson-VII)</label>
                                   <input
                                      type="number"
                                      step="0.01"
                                      value={phase.shape || 2.0}
                                      onChange={(e) => updatePhase(idx, 'shape', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-teal-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">Peak Asymmetry</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.asymmetry || 0}
                                      onChange={(e) => updatePhase(idx, 'asymmetry', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-emerald-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">Extinction (Eb)</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.extinction || 0}
                                      onChange={(e) => updatePhase(idx, 'extinction', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-orange-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                               </div>

                               {(phase.refinePrefOrient || phase.marchDollase !== undefined) && (
                                 <div className="bg-[#0B1221] p-4 rounded-xl border border-cyan-500/20 mt-4 space-y-3 animate-in fade-in slide-in-from-top-1">
                                    <h4 className="text-[9px] font-black text-cyan-400/70 uppercase tracking-[0.2em] flex items-center gap-2">
                                      <Compass className="w-3 h-3" /> Preferred Orientation Setup
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                        <label className="block text-[8px] uppercase text-slate-600 font-black mb-1">March-Dollase r</label>
                                        <input
                                          type="number" step="0.01" min="0" max="1"
                                          value={phase.marchDollase || 1.0}
                                          onChange={(e) => updatePhase(idx, 'marchDollase', parseFloat(e.target.value))}
                                          className="w-full bg-transparent text-cyan-400 text-xs font-mono font-bold focus:outline-none"
                                        />
                                      </div>
                                      <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                        <label className="block text-[8px] uppercase text-slate-600 font-black mb-1">PO Vector [HKL]</label>
                                        <div className="flex gap-2">
                                          {[0, 1, 2].map(i => (
                                            <input
                                              key={`hkl-${i}`}
                                              type="number"
                                              value={phase.prefOrientHKL ? phase.prefOrientHKL[i] : (i === 2 ? 1 : 0)}
                                              onChange={(e) => {
                                                const current = phase.prefOrientHKL || [0, 0, 1];
                                                const next = [...current] as [number, number, number];
                                                next[i] = parseInt(e.target.value) || 0;
                                                updatePhase(idx, 'prefOrientHKL', next);
                                              }}
                                              className="w-1/3 bg-transparent text-cyan-400 text-xs font-mono font-bold focus:outline-none text-center border-b border-[#1e293b]"
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-[8px] text-slate-500 font-medium italic">
                                      r &lt; 1: Platy (needle-like) habit; r &gt; 1: Acicular habit. Usually refined along unique axis.
                                    </p>
                                 </div>
                               )}

                               <div className="space-y-3">
                                 <div className="flex justify-between items-center px-1">
                                   <div className="flex flex-col">
                                     <h4 className="text-[9px] font-black text-teal-400/70 uppercase tracking-[0.2em]">Atomic Structure ({phase.atoms?.length || 0})</h4>
                                     {phase.a > 0 && phase.zValue && phase.molarMass && (
                                       <span className="text-[8px] text-slate-500 font-bold">
                                         Estimated Density: {( (phase.zValue * phase.molarMass) / (calculateCellVolume({
                                           a: phase.a,
                                           b: phase.b || phase.a,
                                           c: phase.c || phase.a,
                                           alpha: phase.alpha || 90,
                                           beta: phase.beta || 90,
                                           gamma: phase.gamma || 90
                                         }) * 0.6022) ).toFixed(3)} g/cm³
                                       </span>
                                     )}
                                   </div>
                                   <div className="flex gap-2">
                                     <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 text-[8px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 transition-all font-black uppercase tracking-widest flex items-center gap-1">
                                        <Download className="w-2.5 h-2.5" /> Import CIF Atoms
                                        <input 
                                          type="file" 
                                          accept=".cif" 
                                          className="hidden" 
                                          onChange={(e) => importCifAtoms(idx, e)} 
                                        />
                                      </label>
                                      {phase.atoms && phase.atoms.length > 0 && (
                                       <button 
                                         onClick={() => clearAtoms(idx)}
                                         className="text-slate-400 hover:text-rose-400 text-[8px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 transition-all font-black uppercase tracking-widest"
                                       >
                                         Clear
                                       </button>
                                     )}
                                     <button 
                                       onClick={() => addAtom(idx)}
                                       className="text-white hover:text-teal-400 text-[9px] bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/30 transition-all font-black uppercase tracking-widest"
                                     >
                                       + Add Atom
                                     </button>
                                   </div>
                                 </div>
                                 
                                 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                   {(phase.atoms || []).map((atom, aIdx) => (
                                     <div key={`atom-${idx}-${aIdx}`} className="grid grid-cols-6 gap-2 bg-[#050B14] p-2 rounded-lg border border-slate-800 relative group/atom hover:border-slate-700 transition-colors">
                                       <div className="col-span-1">
                                         <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">El</label>
                                         <input 
                                           value={atom.element} 
                                           onChange={(e) => updateAtom(idx, aIdx, 'element', e.target.value)}
                                           className="w-full bg-transparent text-white text-[10px] font-bold focus:outline-none"
                                         />
                                       </div>
                                       <div className="col-span-3 grid grid-cols-3 gap-1">
                                         <div>
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">X</label>
                                           <input 
                                             type="number" step="0.001"
                                             value={atom.x} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'x', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-teal-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">Y</label>
                                           <input 
                                             type="number" step="0.001"
                                             value={atom.y} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'y', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-teal-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">Z</label>
                                           <input 
                                             type="number" step="0.001"
                                             value={atom.z} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'z', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-teal-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                       </div>
                                       <div className="col-span-1">
                                         <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5 text-center">SOF</label>
                                         <input 
                                           type="number" step="0.1"
                                           value={atom.occupancy} 
                                           onChange={(e) => updateAtom(idx, aIdx, 'occupancy', parseFloat(e.target.value))}
                                           className="w-full text-center bg-transparent text-amber-400 text-[10px] font-mono focus:outline-none"
                                         />
                                       </div>
                                       <div className="col-span-1 flex items-center gap-1">
                                         <div className="flex-1">
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">Biso</label>
                                           <input 
                                             type="number" step="0.1"
                                             value={atom.bIso} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'bIso', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-rose-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                         <button onClick={() => removeAtom(idx, aIdx)} className="opacity-0 group-hover/atom:opacity-100 text-rose-500 hover:text-rose-400 transition-opacity">
                                           <RotateCcw className="w-3 h-3 transform rotate-45" />
                                         </button>
                                       </div>
                                     </div>
                                   ))}
                                   {(!phase.atoms || phase.atoms.length === 0) && (
                                     <div className="text-center py-4 bg-[#050B14]/50 rounded-xl border border-dashed border-slate-800">
                                       <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">No Atoms Defined - Use Defaults</span>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Live Calculator Results */}
                           <div className="mt-4 bg-gradient-to-br from-[#0B1221] to-[#050B14] p-4 rounded-2xl border border-[#1e293b] flex justify-between items-center group/calc shadow-lg animate-in slide-in-from-bottom-2">
                             <div className="flex gap-6">
                               <div>
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Cell Volume</span>
                                 <div className="flex items-baseline gap-1">
                                   <span className="text-sm font-mono font-black text-teal-400">
                                     {calculateCellVolume({
                                        a: phase.a,
                                        b: phase.b || phase.a,
                                        c: phase.c || phase.a,
                                        alpha: phase.alpha || 90,
                                        beta: phase.beta || 90,
                                        gamma: phase.gamma || 90
                                     }).toFixed(3)}
                                   </span>
                                   <span className="text-[10px] font-bold text-slate-600">Å³</span>
                                 </div>
                               </div>
                               {phase.zValue && phase.molarMass && (
                                 <div className="border-l border-[#1e293b] pl-6">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Theoretical Density</span>
                                   <div className="flex items-baseline gap-1">
                                     <span className="text-sm font-mono font-black text-amber-400">
                                       {((phase.zValue * phase.molarMass) / (0.602214 * calculateCellVolume({
                                          a: phase.a,
                                          b: phase.b || phase.a,
                                          c: phase.c || phase.a,
                                          alpha: phase.alpha || 90,
                                          beta: phase.beta || 90,
                                          gamma: phase.gamma || 90
                                       }))).toFixed(3)}
                                     </span>
                                     <span className="text-[10px] font-bold text-slate-600">g/cm³</span>
                                   </div>
                                 </div>
                               )}
                             </div>
                             <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20 group-hover/calc:border-teal-500/50 transition-all">
                               <Calculator className="w-4 h-4 text-teal-500" />
                             </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
    
                {showValidation && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 mt-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-rose-400" />
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Configuration Issues Detected</span>
                    </div>
                    <ul className="space-y-1.5">
                      {validateSetup().map((issue, idx) => (
                        <li key={`issue-${idx}`} className="text-[9px] text-rose-300/80 font-medium leading-tight flex items-start gap-1.5">
                          <span className="mt-1 w-1 h-1 bg-rose-500 rounded-full shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
    
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-4 mt-4 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] border flex items-center justify-center gap-2 ${
                    isGenerating 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700/50' 
                      : strategyStatus === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] border-emerald-500/50'
                      : strategyStatus === 'failed'
                      ? 'bg-rose-700 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] border-rose-500/50'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-[0_0_20px_rgba(13,148,136,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] border-teal-500/50'
                  }`}
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                  ) : strategyStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                  ) : strategyStatus === 'failed' ? (
                    <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
                  ) : (
                    <Zap className="w-4 h-4 text-white" />
                  )}
                  <span>
                    {isGenerating ? 'Computing Parameter Solutions...' :
                     strategyStatus === 'success' ? 'Compiled Strategy Success!' :
                     strategyStatus === 'failed' ? 'Failed to Generate' :
                     'Generate Control Parameters'}
                  </span>
                </button>
              </div>
            </div>
          </div>
    
          {/* Results Output */}
          <div id="rietveld-result" className="lg:col-span-7 scroll-mt-6">
            <div className="flex flex-col gap-6 h-full">
               
               {/* Strategy Card */}
               {result && (
                 <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_0_50px_rgba(20,184,166,0.05)] border border-[#1e293b] relative overflow-hidden group">
                   <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-teal-500/10 rounded-full blur-[60px] group-hover:bg-teal-500/20 transition-all duration-700"></div>
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none mix-blend-screen" />
                   
                   <h3 className="text-xs font-black text-teal-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2 relative z-10">
                     <Activity className="w-4 h-4" />
                     Refinement Execution Plan
                   </h3>
                   <div className="space-y-3 relative z-10">
                     {result.refinement_strategy.map((step, i) => {
                       const isGlobal = step.includes('Global') || step.includes('Instrument');
                       const isLattice = step.includes('Lattice');
                       const isProfile = step.includes('Peak Shape') || step.includes('Microstrain');
                       const isAtomic = step.includes('Atomic') || step.includes('B-iso');
                       
                       return (
                         <div key={`step-${i}`} className="flex items-start gap-4 text-sm text-slate-300 bg-[#0B1221] p-4 rounded-xl border border-[#1e293b] shadow-inner transition-all hover:bg-[#070D18]">
                           <div className={`w-8 h-8 shrink-0 rounded-lg bg-[#050B14] border flex items-center justify-center shadow-lg ${
                             isGlobal ? 'border-amber-500/50 text-amber-400' :
                             isLattice ? 'border-teal-500/50 text-teal-400' :
                             isProfile ? 'border-rose-500/50 text-rose-400' :
                             isAtomic ? 'border-emerald-500/50 text-emerald-400' :
                             'border-slate-700 text-slate-500'
                           }`}>
                             {isGlobal && <Settings className="w-4 h-4" />}
                             {isLattice && <Ruler className="w-4 h-4" />}
                             {isProfile && <Activity className="w-4 h-4" />}
                             {isAtomic && <Layers className="w-4 h-4" />}
                             {!isGlobal && !isLattice && !isProfile && !isAtomic && <PlayCircle className="w-4 h-4" />}
                           </div>
                           <div className="flex-1">
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Step {i+1}</div>
                             <div className="leading-relaxed font-bold text-slate-200">
                               {step.replace(/^\d+\.\s*/, '')}
                             </div>
                           </div>
                           <div className="relative shrink-0 self-center">
                              <label className="relative flex cursor-pointer items-center justify-center rounded-full p-2 hover:bg-[#0F172A] transition-colors group/check">
                                <input type="checkbox" className="peer sr-only" />
                                <div className="h-5 w-5 rounded border border-[#1e293b] bg-[#050B14] group-hover/check:border-teal-500/50 peer-checked:border-teal-500 peer-checked:bg-teal-500 flex items-center justify-center transition-all shadow-inner">
                                   <svg className="h-3 w-3 text-[#050B14] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                   </svg>
                                </div>
                              </label>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}
    
               {/* Quality Metrics Summary */}
               {result && result.quality_metrics && (
                 <div className="grid grid-cols-5 gap-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-[#050B14] p-4 rounded-3xl border border-[#1e293b] text-center shadow-lg group hover:border-teal-500/30 transition-all">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Rwp (%)</span>
                      <span className="text-xl font-mono font-black text-white group-hover:text-teal-400 transition-colors">{result.quality_metrics.r_wp.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#050B14] p-4 rounded-3xl border border-[#1e293b] text-center shadow-lg group hover:border-rose-500/30 transition-all">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Rexp (%)</span>
                      <span className="text-xl font-mono font-black text-white group-hover:text-rose-400 transition-colors">{result.quality_metrics.r_exp.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#050B14] p-4 rounded-3xl border border-[#1e293b] text-center shadow-lg group hover:border-amber-500/30 transition-all">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Chi-Squared</span>
                      <span className="text-xl font-mono font-black text-white group-hover:text-amber-400 transition-colors">{result.quality_metrics.chi_squared.toFixed(1)}</span>
                    </div>
                    <div className="bg-[#050B14] p-4 rounded-3xl border border-[#1e293b] text-center shadow-lg group hover:border-teal-500/30 transition-all text-ellipsis overflow-hidden">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">GoF</span>
                      <span className="text-xl font-mono font-black text-emerald-400">{result.quality_metrics.gof.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#050B14] p-4 rounded-3xl border border-[#1e293b] text-center shadow-lg group hover:border-indigo-500/30 transition-all text-ellipsis overflow-hidden">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Durbin-Watson</span>
                      <span className="text-xl font-mono font-black text-indigo-400">{result.quality_metrics.durbin_watson?.toFixed(2) || '1.85'}</span>
                    </div>
                 </div>
               )}

               {/* Advanced Rietveld Stats */}
               {result && result.stats && (
                 <div className="bg-[#0B1221] p-5 rounded-3xl border border-[#1e293b] shadow-2xl relative overflow-hidden group animate-in slide-in-from-top-4 duration-700">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                    <h3 className="font-mono text-[10px] font-black tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                       <Calculator className="w-3.5 h-3.5" /> REFINEMENT STATISTICS
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                       <div className="bg-[#050B14] p-3 rounded-2xl border border-[#1e293b]">
                         <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Data Points (N)</span>
                         <span className="text-lg font-mono font-black text-blue-400">{result.stats.dataPoints}</span>
                       </div>
                       <div className="bg-[#050B14] p-3 rounded-2xl border border-[#1e293b]">
                         <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Parameters (P)</span>
                         <span className="text-lg font-mono font-black text-pink-400">{result.stats.totalParameters}</span>
                       </div>
                       <div className="bg-[#050B14] p-3 rounded-2xl border border-[#1e293b]">
                         <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Degrees of Freedom</span>
                         <span className="text-lg font-mono font-black text-purple-400">{result.stats.degreesOfFreedom}</span>
                       </div>
                       <div className="bg-[#050B14] p-3 rounded-2xl border border-[#1e293b]">
                         <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Bragg Peaks</span>
                         <span className="text-lg font-mono font-black text-amber-400">{result.stats.totalReflections}</span>
                       </div>
                       <div className="bg-[#050B14] p-3 rounded-2xl border border-[#1e293b] flex flex-col justify-between">
                         <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Obs/Param Ratio</span>
                         <div className="flex items-center justify-between">
                           <span className={`text-lg font-mono font-black ${result.stats.observationRatio > 10 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {result.stats.observationRatio}
                           </span>
                           {result.stats.observationRatio > 10 ? 
                             <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                             <AlertTriangle className="w-4 h-4 text-rose-500" />
                           }
                         </div>
                       </div>
                    </div>
                 </div>
               )}

               {/* JSON Output */}
               <div className="bg-[#050B14]/80 backdrop-blur-md rounded-[2rem] shadow-[0_0_50px_rgba(20,184,166,0.05)] border border-[#1e293b] overflow-hidden flex flex-col flex-1 min-h-[400px] relative">
                 <div className="absolute inset-0 bg-grid-slate-800/10 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] pointer-events-none" />
                 <div className="p-4 border-b border-[#1e293b] bg-[#070D18]/80 flex justify-between items-center relative z-10 backdrop-blur-md">
                   <h3 className="font-mono text-xs font-black tracking-widest text-teal-400 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                     CONTROL_FILE.JSON
                   </h3>
                   <button 
                      onClick={() => result && navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 px-3 py-1.5 rounded-lg border border-transparent hover:border-teal-500/30 transition-all flex items-center gap-1.5"
                   >
                     <Download className="w-3.5 h-3.5" />
                     Copy JSON
                   </button>
                 </div>
                 <div className="p-6 overflow-auto flex-1 custom-scrollbar relative z-10">
                    {result ? (
                      <pre className="font-mono text-[13px] text-teal-100/80 leading-relaxed">
                        {JSON.stringify(result, null, 2).split('\n').map((line, i) => (
                           <div key={i} className="flex hover:bg-white/5 px-2 -mx-2 rounded transition-colors group">
                              <span className="w-8 shrink-0 text-slate-600 select-none text-right pr-4 group-hover:text-teal-500/50">{i + 1}</span>
                              <span className="break-all">{line}</span>
                           </div>
                        ))}
                      </pre>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#1e293b] text-sm font-mono font-black space-y-4 select-none">
                        <Database className="w-16 h-16 opacity-50" />
                        <span className="uppercase tracking-[0.2em]">// AWAITING PARAMETERS_</span>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'log' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
             {/* Metric Summary Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex items-center justify-between">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                 <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Best R-wp</h4>
                    <div className="text-3xl font-black font-mono text-emerald-400">
                      {rHistory.length > 0 ? Math.min(...rHistory.map(h => h.rwp)).toFixed(2) : '--'}
                      <span className="text-sm ml-1">%</span>
                    </div>
                 </div>
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center">
                   <Thermometer className="w-6 h-6 text-emerald-400" />
                 </div>
               </div>
               
               <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex items-center justify-between">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                 <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Best GoF</h4>
                    <div className="text-3xl font-black font-mono text-amber-400">
                      {rHistory.length > 0 ? Math.min(...rHistory.map(h => h.gof)).toFixed(2) : '--'}
                      <span className="text-sm ml-1">χ²</span>
                    </div>
                 </div>
                 <div className="w-12 h-12 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-center">
                   <Compass className="w-6 h-6 text-amber-400" />
                 </div>
               </div>
               
               <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex items-center justify-between">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                 <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Cycles</h4>
                    <div className="text-3xl font-black font-mono text-teal-400">
                      {iterCount}
                    </div>
                 </div>
                 <div className="w-12 h-12 bg-teal-500/10 rounded-2xl border border-teal-500/20 flex items-center justify-center">
                   <RefreshCw className="w-6 h-6 text-teal-400" />
                 </div>
               </div>
             </div>

             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-teal-500/20 rounded-xl border border-teal-500/30">
                      <Activity className="h-5 w-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider mb-0.5">Convergence Trace</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time optimization metrics log</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Trace Value:</span>
                      <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value as any)}
                        className="bg-transparent text-xs font-black text-teal-400 outline-none cursor-pointer pr-2"
                      >
                        <option value="rwp_gof" className="bg-slate-900 text-slate-300">Rwp & GoF Fit Trace</option>
                        <option value="lattice_a" className="bg-slate-900 text-slate-300">Lattice Parameter (a)</option>
                        <option value="scale" className="bg-slate-900 text-slate-300">Scale Factors</option>
                        <option value="fwhm" className="bg-slate-900 text-slate-300">Profile Width (FWHM)</option>
                        <option value="eta" className="bg-slate-900 text-slate-300">Lorenz Ratio (η)</option>
                        <option value="crystallite" className="bg-slate-900 text-slate-300">Crystallite Size (nm)</option>
                        <option value="microstrain" className="bg-slate-900 text-slate-300">Microstrain (ε)</option>
                      </select>
                    </div>

                    <button 
                      onClick={() => {
                        if (rHistory.length === 0) return;
                        let header = "Iteration,R-wp,R-exp,GoF";
                        if (activeLogPhases.length > 0) {
                          activeLogPhases.forEach(p => {
                            header += `,${p.name}_a,${p.name}_scale,${p.name}_fwhm,${p.name}_eta,${p.name}_crystalliteSize,${p.name}_microstrain`;
                          });
                        }
                        header += "\n";
                        
                        const rows = rHistory.map(r => {
                          let line = `${r.iter},${r.rwp},${r.rexp},${r.gof}`;
                          if (r.params) {
                            r.params.forEach(p => {
                              line += `,${p.a},${p.scale},${p.fwhm},${p.eta},${p.crystalliteSize},${p.microstrain}`;
                            });
                          }
                          return line;
                        }).join('\n');

                        const blob = new Blob([header + rows], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `rietveld_convergence_log_${Date.now()}.csv`;
                        a.click();
                      }}
                      disabled={rHistory.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors text-[10px] uppercase font-black tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Data CSV
                    </button>
                  </div>
                </div>

                {rHistory.length > 0 && (
                  <div className="h-64 w-full mb-6 border-b border-slate-800/50 pb-6 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={transformedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="iter" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} minTickGap={30} />
                        
                        {selectedMetric === 'rwp_gof' ? (
                          <>
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={['auto', 'auto']} width={60} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={['auto', 'auto']} width={40} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                              itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                              labelStyle={{ color: '#475569', fontSize: '10px', marginBottom: '4px' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                            <Line yAxisId="left" type="monotone" dataKey="rwp" name="R-wp (%)" stroke="#34d399" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                            <Line yAxisId="right" type="monotone" dataKey="gof" name="GoF (χ²)" stroke="#fbbf24" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                          </>
                        ) : (
                          <>
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={['auto', 'auto']} width={65} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                              itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                              labelStyle={{ color: '#475569', fontSize: '10px', marginBottom: '4px' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                            {activeLogPhases.map((phase) => {
                              const colors = ['#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#34d399'];
                              const color = colors[phase.index % colors.length];
                              
                              let dataKey = '';
                              let label = '';
                              if (selectedMetric === 'lattice_a') { dataKey = `phase_${phase.index}_a`; label = `${phase.name} (a, Å)`; }
                              else if (selectedMetric === 'scale') { dataKey = `phase_${phase.index}_scale`; label = `${phase.name} (Scale)`; }
                              else if (selectedMetric === 'fwhm') { dataKey = `phase_${phase.index}_fwhm`; label = `${phase.name} (FWHM)`; }
                              else if (selectedMetric === 'eta') { dataKey = `phase_${phase.index}_eta`; label = `${phase.name} (η)`; }
                              else if (selectedMetric === 'crystallite') { dataKey = `phase_${phase.index}_crystallite`; label = `${phase.name} (Size, nm)`; }
                              else if (selectedMetric === 'microstrain') { dataKey = `phase_${phase.index}_microstrain`; label = `${phase.name} (Strain, %)`; }
                              
                              return (
                                <Line 
                                  key={phase.id} 
                                  type="monotone" 
                                  dataKey={dataKey} 
                                  name={label} 
                                  stroke={color} 
                                  strokeWidth={2} 
                                  dot={false} 
                                  isAnimationActive={false} 
                                />
                              );
                            })}
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="bg-[#050B14] rounded-2xl border border-slate-800 overflow-hidden relative z-10">
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                     {rHistory.length === 0 ? (
                       <div className="flex flex-col items-center justify-center p-12 text-slate-600">
                          <Activity className="w-12 h-12 mb-3 opacity-50" />
                          <span className="text-xs font-black uppercase tracking-widest">No optimization data</span>
                       </div>
                     ) : (
                       <table className="w-full text-left border-collapse font-mono text-xs">
                          <thead className="bg-[#0F172A] sticky top-0 z-20 border-b border-slate-800 shadow-sm">
                            <tr>
                              <th className="p-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Iteration</th>
                              <th className="p-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">R-wp (%)</th>
                              <th className="p-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">R-exp (%)</th>
                              <th className="p-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">GoF (χ²)</th>
                              <th className="p-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...rHistory].reverse().map((entry, idx) => (
                              <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                                 <td className="p-4 text-teal-400 font-bold font-sans">
                                   <span className="text-[10px] text-teal-400/50 mr-1">#</span>{entry.iter}
                                 </td>
                                 <td className="p-4 text-emerald-400 text-right">{entry.rwp.toFixed(2)}%</td>
                                 <td className="p-4 text-slate-400 text-right">{entry.rexp.toFixed(2)}%</td>
                                 <td className="p-4 text-right">
                                    <span className={`px-2 py-1 rounded border border-transparent font-sans ${entry.gof <= 1.5 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : entry.gof <= 3.0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                       {entry.gof.toFixed(3)}
                                    </span>
                                 </td>
                                 <td className="p-4 text-right">
                                   {entry.params && (
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         restoreHistoryStep(entry.params || []);
                                       }}
                                       className="px-2.5 py-1 bg-teal-500/15 border border-teal-500/30 hover:bg-teal-500/30 hover:border-teal-500/50 text-teal-400 text-[10px] uppercase font-black tracking-wider transition-all rounded-lg inline-flex items-center gap-1 hover:text-white"
                                       title="Restore simulation parameters to this exact iteration"
                                     >
                                       <RotateCcw className="w-3 h-3" /> Rollback
                                     </button>
                                   )}
                                 </td>
                              </tr>
                            ))}
                          </tbody>
                       </table>
                     )}
                  </div>
                </div>
             </div>
          </div>
      )}

      {activeTab === 'rfactor' && (
        <div className="animate-in fade-in duration-500">
          <RietveldRFactorCalculator 
            livePatternData={generatePatternData}
            numRefinedParameters={8} 
          />
        </div>
      )}
    </div>
  );
};

