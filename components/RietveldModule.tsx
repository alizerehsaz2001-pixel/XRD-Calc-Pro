import React, { useState, useMemo, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Area, Scatter, AreaChart, ReferenceLine
} from 'recharts';
import { 
  Activity, Settings, RefreshCw, BarChart2, Download, PlayCircle, RotateCcw, 
  Beaker, Calculator, ChevronRight, BookOpen, Layers, Info, Ruler, Maximize, AlertTriangle, 
  Binary, Zap, Gauge, LineChart as ChartIcon, Database, Scale, Compass, Thermometer, CheckCircle2,
  Globe, ChevronDown, Grid, Lock, Unlock, Edit2, Check, Trash2, Cpu, Terminal
} from 'lucide-react';
import { RietveldPhaseInput, RietveldSetupResult, CrystalSystem, RietveldAtom } from '../types';
import { generateRietveldSetup, calculateBragg, simulatePeak, calculateCellVolume } from '../utils/physics';
import { ScientificMathControl } from './ScientificMathControl';
import { RietveldRFactorCalculator } from './RietveldRFactorCalculator';
import { PhysicalResidualCorrectionsModule } from './PhysicalResidualCorrectionsModule';
import { playSynthTone } from '../utils/sound';
import rietveldBg from '../src/assets/images/rietveld_bg_1785614322504.jpg';
import { WhatDoesThisMeanTooltip } from './common/WhatDoesThisMeanTooltip';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';
import { RietveldAdvancedControls } from './RietveldAdvancedControls';
import { RietveldParameterSet } from './RietveldParameterSet';
import { 
  PhaseModel, RefinementFlags, SolverStepResult, 
  runLevenbergMarquardtStep, calculateHillHowardQpa, NistStandard 
} from '../utils/rietveldSolver';


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
  'Silicon (Diamond Cubic)': { a: 5.431, scale: 1300, fwhm: 0.12, eta: 0.6, zeroShift: 0.0, sampleDisplacement: 0.02, crystalliteSize: 180, microstrain: 0.01, background: 45, noise: 15, peaks: [] },
  'Quartz': { a: 4.913, scale: 800, fwhm: 0.1, eta: 0.7, zeroShift: 0.0, sampleDisplacement: 0.1, crystalliteSize: 200, microstrain: 0.01, background: 80, noise: 30, peaks: [] },
  'Rutile': { a: 4.594, scale: 1000, fwhm: 0.18, eta: 0.6, zeroShift: 0.0, sampleDisplacement: 0, crystalliteSize: 150, microstrain: 0.03, background: 40, noise: 20, peaks: [] },
  'Perovskite': { a: 3.905, scale: 900, fwhm: 0.12, eta: 0.5, zeroShift: 0.0, sampleDisplacement: 0, crystalliteSize: 180, microstrain: 0.02, background: 30, noise: 15, peaks: [] },
  'Alumina (Hexagonal)': { a: 4.758, scale: 1100, fwhm: 0.14, eta: 0.5, zeroShift: 0.0, sampleDisplacement: 0.01, crystalliteSize: 160, microstrain: 0.02, background: 35, noise: 18, peaks: [] },
  'Graphite (Hexagonal)': { a: 2.461, scale: 900, fwhm: 0.22, eta: 0.4, zeroShift: 0.0, sampleDisplacement: 0.05, crystalliteSize: 90, microstrain: 0.04, background: 55, noise: 22, peaks: [] }
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
const ALUMINA_PEAKS = [
  { t: 25.58, i: 75 }, { t: 35.15, i: 90 }, { t: 37.78, i: 40 }, 
  { t: 43.36, i: 100 }, { t: 52.55, i: 45 }, { t: 57.50, i: 95 }, 
  { t: 61.30, i: 15 }, { t: 66.52, i: 30 }, { t: 68.21, i: 50 }
];
const GRAPHITE_PEAKS = [
  { t: 26.54, i: 100 }, { t: 42.43, i: 10 }, { t: 44.39, i: 15 }, 
  { t: 54.54, i: 20 }, { t: 77.24, i: 12 }
];

const getPeaksForPhase = (phase: string, a: number): SimulationPeak[] => {
  if (phase === 'Quartz') {
    return QUARTZ_PEAKS.map((p, idx) => ({ h: 0, k: 0, l: idx + 1, intensity: p.i * 10, enabled: true }));
  } else if (phase === 'Rutile') {
    return RUTILE_PEAKS.map((p, idx) => ({ h: 0, k: 0, l: idx + 1, intensity: p.i * 10, enabled: true }));
  } else if (phase === 'Perovskite') {
    return PEROVSKITE_PEAKS.map((p, idx) => ({ h: 0, k: 0, l: idx + 1, intensity: p.i * 10, enabled: true }));
  } else if (phase === 'Alumina (Hexagonal)') {
    return ALUMINA_PEAKS.map((p, idx) => ({ h: 0, k: 0, l: idx + 1, intensity: p.i * 10, enabled: true }));
  } else if (phase === 'Graphite (Hexagonal)') {
    return GRAPHITE_PEAKS.map((p, idx) => ({ h: 0, k: 0, l: idx + 1, intensity: p.i * 10, enabled: true }));
  }

  const peaks: SimulationPeak[] = [];
  for (let s2 = 1; s2 <= 32; s2++) {
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
            } else if (phase === 'Silicon (Diamond Cubic)') {
              const isEven = (h % 2 === 0) && (k % 2 === 0) && (l % 2 === 0);
              const isOdd = (h % 2 !== 0) && (k % 2 !== 0) && (l % 2 !== 0);
              const unmixed = isEven || isOdd;
              allowed = unmixed && (!isEven || (h + k + l) % 4 === 0);
            }
            if (allowed) {
              let intensity = 1000;
              if (phase === 'Silicon (Diamond Cubic)') {
                if (h===1 && k===1 && l===1) intensity = 1000;
                else if (h===2 && k===2 && l===0) intensity = 550;
                else if (h===3 && k===1 && l===1) intensity = 300;
                else if (h===4 && k===0 && l===0) intensity = 60;
                else if (h===3 && k===3 && l===1) intensity = 110;
                else if (h===4 && k===2 && l===2) intensity = 120;
                else intensity = 80;
              }
              peaks.push({ h, k, l, intensity, enabled: true });
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
    density = (1 * 28.0855) / (volume * 0.60221415);
    unitCellFormula = 'Si';
  } else if (phaseType === 'BCC') {
    volume = Math.pow(a, 3);
    density = (2 * 55.845) / (volume * 0.60221415);
    unitCellFormula = 'Fe-α';
  } else if (phaseType === 'FCC') {
    volume = Math.pow(a, 3);
    density = (4 * 63.546) / (volume * 0.60221415);
    unitCellFormula = 'Cu';
  } else if (phaseType === 'Silicon (Diamond Cubic)') {
    volume = Math.pow(a, 3);
    density = (8 * 28.0855) / (volume * 0.60221415);
    unitCellFormula = 'Si';
  } else if (phaseType === 'Quartz') {
    volume = 0.866025 * Math.pow(a, 3) * 1.1;
    density = (3 * 60.08) / (volume * 0.60221415);
    unitCellFormula = 'SiO₂';
  } else if (phaseType === 'Rutile') {
    volume = Math.pow(a, 3) * 0.644;
    density = (2 * 79.866) / (volume * 0.60221415);
    unitCellFormula = 'TiO₂';
  } else if (phaseType === 'Perovskite') {
    volume = Math.pow(a, 3);
    density = (1 * 135.962) / (volume * 0.60221415);
    unitCellFormula = 'CaTiO₃';
  } else if (phaseType === 'Alumina (Hexagonal)') {
    volume = 0.866025 * Math.pow(a, 3) * 2.73;
    density = (6 * 101.96) / (volume * 0.60221415);
    unitCellFormula = 'Al₂O₃';
  } else if (phaseType === 'Graphite (Hexagonal)') {
    volume = 0.866025 * Math.pow(a, 3) * 2.72;
    density = (4 * 12.011) / (volume * 0.60221415);
    unitCellFormula = 'C';
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
  },
  'Silicon (Diamond Cubic)': {
    number: 227,
    hermannMauguin: 'F d -3 m',
    schoenflies: 'O_h^7',
    hall: '-F 4y 2',
    crystalSystem: 'Cubic',
    pointGroup: 'm-3m (O_h)',
    laueClass: 'm-3m',
    latticeType: 'Face-Centered Cubic with 2-atom basis (cF)',
    centrosymmetric: true,
    chiral: false,
    symmorphic: false,
    wyckoffSites: [
      { site: '8a', multiplicity: 8, symmetry: '-43m', coordinates: '(0,0,0) + FCC' },
      { site: '8b', multiplicity: 8, symmetry: '-43m', coordinates: '(¼,¼,¼) + FCC' }
    ],
    symmetryElements: ['d-glide planes', 'Screw axes 4_1 along <100>', 'Centering translations', '3-fold axes on diagonals']
  },
  'Alumina (Hexagonal)': {
    number: 167,
    hermannMauguin: 'R -3 c',
    schoenflies: 'D_3d^6',
    hall: '-R 3c',
    crystalSystem: 'Trigonal / Hexagonal',
    pointGroup: '-3m (D_3d)',
    laueClass: '-3m',
    latticeType: 'Rhombohedral / Hexagonal (hR)',
    centrosymmetric: true,
    chiral: false,
    symmorphic: false,
    wyckoffSites: [
      { site: '12c', multiplicity: 12, symmetry: '3.', coordinates: '(0, 0, z)' },
      { site: '18e', multiplicity: 18, symmetry: '.2', coordinates: '(x, 0, ¼)' }
    ],
    symmetryElements: ['3-fold rotoinversion axis', 'c-glide planes', '2-fold rotation axes', 'Inversion center']
  },
  'Graphite (Hexagonal)': {
    number: 194,
    hermannMauguin: 'P 6_3/m m c',
    schoenflies: 'D_6h^4',
    hall: '-P 6c 2c',
    crystalSystem: 'Hexagonal',
    pointGroup: '6/mmm (D_6h)',
    laueClass: '6/mmm',
    latticeType: 'Primitive Hexagonal (hP)',
    centrosymmetric: true,
    chiral: false,
    symmorphic: false,
    wyckoffSites: [
      { site: '2a', multiplicity: 2, symmetry: '-3m', coordinates: '(0, 0, 0)' },
      { site: '2c', multiplicity: 2, symmetry: '-6m2', coordinates: '(⅓, ⅔, ¼)' }
    ],
    symmetryElements: ['6_3 screw axis along c', 'c-glide and d-glide planes', 'Mirror planes', '2-fold axes']
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
  } else if (type === 'FCC' || type === 'Silicon (Diamond Cubic)') {
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
  } else if (type === 'Quartz' || type === 'Alumina (Hexagonal)' || type === 'Graphite (Hexagonal)') {
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

export const RietveldModule: React.FC<{ pythonFeaturesEnabled?: boolean }> = ({ pythonFeaturesEnabled = false }) => {
  const [activeTab, setActiveTab ] = useState<'simulation' | 'setup' | 'log' | 'rfactor'>('simulation');
  const [showMatrix, setShowMatrix] = useState(false);
  const [isPythonActive, setIsPythonActive] = useState<boolean>(pythonFeaturesEnabled);

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

  // Python & Pandas Refinement state
  const [pythonRefineResult, setPythonRefineResult] = useState<any>(null);
  const [isPythonRefining, setIsPythonRefining] = useState<boolean>(false);
  const [pythonRefineError, setPythonRefineError] = useState<string | null>(null);
  const [pythonHistory, setPythonHistory] = useState<any[]>([]);

  // Analytical LM Solver & Experimental Data state
  const [customObsIntensities, setCustomObsIntensities] = useState<Float32Array | null>(null);
  const [customSampleName, setCustomSampleName] = useState<string | null>(null);
  const [refinementFlags, setRefinementFlags] = useState<RefinementFlags>({
    refineScale: true,
    refineLattice: true,
    refineFwhm: false,
    refineEta: false,
    refineZeroShift: true,
    refineBkg: true,
    refineMicrostrain: false,
    refineCrystalliteSize: false
  });
  const [lastSolverResult, setLastSolverResult] = useState<SolverStepResult | null>(null);
  const [isSolverRefining, setIsSolverRefining] = useState(false);
  const [solverProgress, setSolverProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [solverLambda, setSolverLambda] = useState(0.01);

  const qpaResults = useMemo(() => {
    return calculateHillHowardQpa(simPhases);
  }, [simPhases]);

  const runPythonRietveldRefinement = async () => {
    setIsPythonRefining(true);
    setPythonRefineError(null);
    try {
      const response = await fetch('/api/rietveld/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phases: simPhases.filter(p => p.enabled),
          background_model: 'Chebyshev',
          bg_terms: 6,
          wavelength: wavelength || 1.5406,
          two_theta_min: SIMULATION_RANGE.start,
          two_theta_max: SIMULATION_RANGE.end,
          step_size: SIMULATION_RANGE.step,
          refine_scale: refinementFlags.refineScale,
          refine_lattice: refinementFlags.refineLattice,
          refine_fwhm: refinementFlags.refineFwhm,
          refine_eta: refinementFlags.refineEta,
          refine_zero_shift: refinementFlags.refineZeroShift,
          observed_data: customObsIntensities ? Array.from(customObsIntensities) : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        setPythonRefineResult(data);
        
        // Push to local log history
        setPythonHistory(prev => [
          {
            timestamp: new Date().toLocaleTimeString(),
            r_wp_initial: data.r_factors.r_wp_initial,
            r_wp_final: data.r_factors.r_wp_final,
            chi_squared: data.r_factors.chi_squared,
            gof: data.r_factors.gof,
            status: data.optimizer_status,
            phases: data.phases
          },
          ...prev
        ]);

        // Reactively update simPhases parameters with refined parameters
        setSimPhases(prevPhases => {
          return prevPhases.map(p => {
            const refined = data.phases.find((rp: any) => rp.name === p.name);
            if (refined) {
              return {
                ...p,
                a: refined.refined_a,
                scale: refined.refined_scale,
                fwhm: refined.refined_fwhm,
                eta: refined.refined_eta
              };
            }
            return p;
          });
        });
      } else {
        setPythonRefineError(data.error || 'Unknown optimizer error');
      }
    } catch (err: any) {
      setPythonRefineError(err.message || 'Network communication failure');
    } finally {
      setIsPythonRefining(false);
    }
  };
  
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

  // Global simulation instrument and background state for live coupling
  const [simZeroShift, setSimZeroShift] = useState<number>(0.0);
  const [simSampleDisplacement, setSimSampleDisplacement] = useState<number>(0.0);
  const [simBackground, setSimBackground] = useState<number>(50);

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
      zeroShift: simZeroShift,
      sampleDisplacement: simSampleDisplacement,
      background: simBackground,
      noise: 20
    };
  }, [currentPhaseObj, simZeroShift, simSampleDisplacement, simBackground]);

  const targetParams = useMemo(() => {
    const targetLookup: any = TARGET_PARAMS[currentPhaseObj.phaseType] || currentPhaseObj;
    return {
      a: currentPhaseObj.targetA ?? targetLookup.a,
      scale: currentPhaseObj.targetScale ?? targetLookup.scale,
      fwhm: currentPhaseObj.targetFwhm ?? targetLookup.fwhm,
      eta: currentPhaseObj.targetEta ?? targetLookup.eta,
      crystalliteSize: currentPhaseObj.targetCrystalliteSize ?? targetLookup.crystalliteSize,
      microstrain: currentPhaseObj.targetMicrostrain ?? targetLookup.microstrain,
      peaks: currentPhaseObj.peaks,
      zeroShift: 0.0,
      sampleDisplacement: 0.0,
      background: (targetLookup as any).background ?? 50,
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
          zeroShift: simZeroShift,
          sampleDisplacement: simSampleDisplacement,
          background: simBackground,
          noise: 20
        };
        res = updater(currentParamObj);
      } else {
        res = updater;
      }

      if (res.zeroShift !== undefined) {
        setSimZeroShift(res.zeroShift);
        setSetupZeroShift(res.zeroShift);
      }
      if (res.sampleDisplacement !== undefined) {
        setSimSampleDisplacement(res.sampleDisplacement);
        setSampleDisplacement(res.sampleDisplacement);
      }
      if (res.background !== undefined) {
        setSimBackground(res.background);
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

  const handleAddNewSimStructure = (type: 'Simple Cubic' | 'BCC' | 'FCC' | 'Quartz' | 'Rutile' | 'Perovskite' | 'Silicon (Diamond Cubic)' | 'Alumina (Hexagonal)' | 'Graphite (Hexagonal)') => {
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

  const obsIntensities = useMemo(() => {
    const steps = Math.floor((SIMULATION_RANGE.end - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
    const dataLen = steps + 1;
    const intensities = new Float32Array(dataLen);
    
    const globalBkg = 60;
    for (let i = 0; i < dataLen; i++) {
      const twoT = SIMULATION_RANGE.start + i * SIMULATION_RANGE.step;
      intensities[i] += globalBkg * (0.2 + 10 / Math.max(1, twoT) + 1.5 * Math.exp(-0.02 * Math.pow(twoT - 25, 2)));
    }

    simPhases.forEach((p) => {
      if (!p.enabled) return;
      const a = p.targetA;
      const scale = p.targetScale;
      const fwhm = p.targetFwhm;
      const eta = p.targetEta;
      const crystalliteSize = p.targetCrystalliteSize;
      const microstrain = p.targetMicrostrain;
      const peaks = p.peaks;

      const addPeak = (pos2Theta, peakFwhm, amplitude) => {
        const gamma = Math.max(0.0001, peakFwhm / 2);
        const sigma = Math.max(0.0001, peakFwhm / 2.35482);
        const gammaSq = gamma * gamma;
        const sigmaSq2 = 2 * sigma * sigma;
        
        const halfWidth = peakFwhm * 10;
        const minT = Math.max(SIMULATION_RANGE.start, pos2Theta - halfWidth);
        const maxT = Math.min(SIMULATION_RANGE.end, pos2Theta + halfWidth);
        
        const startIdx = Math.max(0, Math.ceil((minT - SIMULATION_RANGE.start) / SIMULATION_RANGE.step));
        const endIdx = Math.min(dataLen - 1, Math.floor((maxT - SIMULATION_RANGE.start) / SIMULATION_RANGE.step));

        for (let idx = startIdx; idx <= endIdx; idx++) {
          const x = SIMULATION_RANGE.start + idx * SIMULATION_RANGE.step;
          const diff = x - pos2Theta;
          const diffSq = diff * diff;
          
          const g = amplitude * Math.exp(-diffSq / sigmaSq2);
          const l = amplitude * (gammaSq / (diffSq + gammaSq));
          intensities[idx] += eta * l + (1 - eta) * g;
        }
      };

      const wavelength = 1.5406;
      peaks.filter(peak => peak.enabled).forEach((peak, peakIdx) => {
        let twoThetaBase = 0;
        let d = 0;
        if (['Quartz', 'Rutile', 'Perovskite', 'Alumina (Hexagonal)', 'Graphite (Hexagonal)'].includes(p.phaseType)) {
          const origPeak = p.phaseType === 'Quartz' ? QUARTZ_PEAKS[peakIdx] : p.phaseType === 'Rutile' ? RUTILE_PEAKS[peakIdx] : p.phaseType === 'Perovskite' ? PEROVSKITE_PEAKS[peakIdx] : p.phaseType === 'Alumina (Hexagonal)' ? ALUMINA_PEAKS[peakIdx] : GRAPHITE_PEAKS[peakIdx];
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

          addPeak(twoTheta, totalFwhm, baseAmplitude);

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

    for (let i = 0; i < dataLen; i++) {
      const val = intensities[i];
      intensities[i] += Math.sqrt(Math.max(1, val)) * (Math.random() - 0.5) * 2.25;
    }
    return intensities;
  }, [simPhases.map(p => `${p.enabled}-${p.targetA}-${p.targetScale}-${p.targetFwhm}-${p.targetEta}-${p.targetCrystalliteSize}-${p.targetMicrostrain}`).join(',')]);

  const generatePatternData = useMemo(() => {
    const steps = Math.floor((SIMULATION_RANGE.end - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
    const dataLen = steps + 1;
    const data = new Array(dataLen);

    const calcIntensities = new Float32Array(dataLen);
    const individualPhaseCalcIntensities = simPhases.map(() => new Float32Array(dataLen));

    simPhases.forEach((p, phaseIdx) => {
      if (!p.enabled) return;
      const a = p.a;
      const scale = p.scale;
      const fwhm = p.fwhm;
      const eta = p.eta;
      const crystalliteSize = p.crystalliteSize;
      const microstrain = p.microstrain;
      const peaks = p.peaks;
      const phaseIntensities = individualPhaseCalcIntensities[phaseIdx];

      const addPeak = (pos2Theta, peakFwhm, amplitude) => {
        const gamma = Math.max(0.0001, peakFwhm / 2);
        const sigma = Math.max(0.0001, peakFwhm / 2.35482);
        const gammaSq = gamma * gamma;
        const sigmaSq2 = 2 * sigma * sigma;
        
        const halfWidth = peakFwhm * 10;
        const minT = Math.max(SIMULATION_RANGE.start, pos2Theta - halfWidth);
        const maxT = Math.min(SIMULATION_RANGE.end, pos2Theta + halfWidth);
        
        const startIdx = Math.max(0, Math.ceil((minT - SIMULATION_RANGE.start) / SIMULATION_RANGE.step));
        const endIdx = Math.min(dataLen - 1, Math.floor((maxT - SIMULATION_RANGE.start) / SIMULATION_RANGE.step));

        for (let idx = startIdx; idx <= endIdx; idx++) {
          const x = SIMULATION_RANGE.start + idx * SIMULATION_RANGE.step;
          const diff = x - pos2Theta;
          const diffSq = diff * diff;
          
          const g = amplitude * Math.exp(-diffSq / sigmaSq2);
          const l = amplitude * (gammaSq / (diffSq + gammaSq));
          const y = eta * l + (1 - eta) * g;
          phaseIntensities[idx] += y;
          calcIntensities[idx] += y;
        }
      };

      const wavelength = 1.5406;
      peaks.filter(peak => peak.enabled).forEach((peak, peakIdx) => {
        let twoThetaBase = 0;
        let d = 0;
        if (['Quartz', 'Rutile', 'Perovskite', 'Alumina (Hexagonal)', 'Graphite (Hexagonal)'].includes(p.phaseType)) {
          const origPeak = p.phaseType === 'Quartz' ? QUARTZ_PEAKS[peakIdx] : p.phaseType === 'Rutile' ? RUTILE_PEAKS[peakIdx] : p.phaseType === 'Perovskite' ? PEROVSKITE_PEAKS[peakIdx] : p.phaseType === 'Alumina (Hexagonal)' ? ALUMINA_PEAKS[peakIdx] : GRAPHITE_PEAKS[peakIdx];
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
        
        const zeroShift = simZeroShift;
        const displacement = simSampleDisplacement;
        const displacementShift = -displacement * Math.cos(theta);
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

          const wavelength2 = 1.5444; 
          const sinTheta2 = wavelength2 / (2 * d);
          if (sinTheta2 < 1) {
            const theta2 = Math.asin(sinTheta2);
            const displacementShift2 = -displacement * Math.cos(theta2);
            const twoTheta2 = 2 * theta2 * (180 / Math.PI) + zeroShift + displacementShift2;
            addPeak(twoTheta2, totalFwhm, baseAmplitude * 0.5);
          }
        }
      });
    });

    let sumResSq = 0;
    let sumObsSq = 0;
    let maxObs = 0;
    for (let i = 0; i < dataLen; i++) {
      if (obsIntensities[i] > maxObs) {
        maxObs = obsIntensities[i];
      }
    }
    
    const diffOffset = -maxObs * 0.15; 
    const globalBkg = simBackground;

    for (let i = 0; i < dataLen; i++) {
      const twoT = SIMULATION_RANGE.start + i * SIMULATION_RANGE.step;
      const trueBkg = globalBkg * (0.2 + 10 / Math.max(1, twoT) + 1.5 * Math.exp(-0.02 * Math.pow(twoT - 25, 2)));
      
      const obs = customObsIntensities ? customObsIntensities[i] : obsIntensities[i];
      const calc = calcIntensities[i] + trueBkg;
      
      const dataPoint = {
        twoTheta: twoT,
        obs: obs,
        calc: calc,
        diff: (obs - calc) + diffOffset,
        bkg: trueBkg
      };

      const trueDiff = obs - calc;
      sumResSq += trueDiff * trueDiff;
      sumObsSq += obs * obs;

      simPhases.forEach((p, idx) => {
        dataPoint[`calc_phase_${idx}`] = individualPhaseCalcIntensities[idx][i] + trueBkg;
      });
      data[i] = dataPoint;
    }

    const R = Math.sqrt(sumResSq / Math.max(0.0001, sumObsSq)) * 100;
    
    return { data, R };
  }, [simPhases, obsIntensities, customObsIntensities, simZeroShift, simSampleDisplacement, simBackground]);

  const rFactor = generatePatternData.R;
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

  const handleApplyPhysicalCorrection = (correction: { key: string; value: any; title: string }) => {
    playSynthTone('success');
    if (correction.key === 'zeroShift') {
      const val = typeof correction.value === 'number' ? correction.value : parseFloat(correction.value);
      setSetupZeroShift(val);
      setRefineZeroShift(true);
      setSimPhases(prev => prev.map((p, idx) => idx === selectedSimPhaseIdx ? { ...p, zeroShift: val } : p));
    } else if (correction.key === 'sampleDisplacement') {
      const val = typeof correction.value === 'number' ? correction.value : parseFloat(correction.value);
      setSampleDisplacement(val);
      setRefineSampleDisplacement(true);
      setSimPhases(prev => prev.map((p, idx) => idx === selectedSimPhaseIdx ? { ...p, sampleDisplacement: val } : p));
    } else if (correction.key === 'bgTerms') {
      const val = typeof correction.value === 'number' ? correction.value : parseInt(correction.value, 10);
      setBgTerms(val);
      setRefineBkg(true);
    } else if (correction.key === 'eta') {
      const val = typeof correction.value === 'number' ? correction.value : parseFloat(correction.value);
      setSimPhases(prev => prev.map((p, idx) => idx === selectedSimPhaseIdx ? { ...p, eta: val } : p));
    } else if (correction.key === 'asymmetry') {
      setSimPhases(prev => prev.map((p, idx) => idx === selectedSimPhaseIdx ? { ...p, refineAsymmetry: true } : p));
    } else if (correction.key === 'marchDollase') {
      const val = typeof correction.value === 'number' ? correction.value : parseFloat(correction.value);
      setSimPhases(prev => prev.map((p, idx) => idx === selectedSimPhaseIdx ? { ...p, marchDollase: val } : p));
    }
  };

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
        
        if (['Quartz', 'Rutile', 'Perovskite', 'Alumina (Hexagonal)', 'Graphite (Hexagonal)'].includes(p.phaseType)) {
          const origPeak = p.phaseType === 'Quartz' ? QUARTZ_PEAKS[peakIdx] : p.phaseType === 'Rutile' ? RUTILE_PEAKS[peakIdx] : p.phaseType === 'Perovskite' ? PEROVSKITE_PEAKS[peakIdx] : p.phaseType === 'Alumina (Hexagonal)' ? ALUMINA_PEAKS[peakIdx] : GRAPHITE_PEAKS[peakIdx];
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStrategyStatus('running');
    setShowValidation(false);

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

      // Call AI Advisor
      try {
        const response = await fetch('/api/gemini/rietveld-advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phases,
            currentSetup: {
              backgroundModel: bgModel,
              profileShape,
              geometry,
              divergenceSlit
            }
          })
        });
        const data = await response.json();
        if (data.success && data.text) {
          output.ai_advice = data.text;
        }
      } catch (err) {
        console.error("AI Advisor Error:", err);
      }

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

  // Stepwise Auto-Refinement Guided Recipe state
  const [stepwiseActive, setStepwiseActive] = useState<boolean>(false);
  const [stepwiseStage, setStepwiseStage] = useState<number>(0);
  const [stepwiseMessage, setStepwiseMessage] = useState<string>('');

  const handleResetCold = () => {
    const target = TARGET_PARAMS[simPhase];
    if (target) {
      setUserParams({
        ...target,
        a: target.a * 1.05,
        scale: target.scale * 0.8,
        fwhm: target.fwhm * 1.5,
        eta: Math.min(1, target.eta * 1.2),
        zeroShift: 0.15,
        background: target.background * 1.2,
        crystalliteSize: target.crystalliteSize * 0.8,
        microstrain: target.microstrain * 1.5,
        sampleDisplacement: 0.1
      });
      setIsAutoRefining(false);
      setShowMatrix(false);
    }
  };

  const handleResetToNominal = () => {
    const target = TARGET_PARAMS[simPhase];
    if (target) {
      setUserParams({
        ...target,
        a: target.a,
        scale: target.scale,
        fwhm: target.fwhm,
        eta: target.eta,
        zeroShift: 0.0,
        sampleDisplacement: 0.0,
        crystalliteSize: target.crystalliteSize,
        microstrain: target.microstrain,
        background: target.background,
        noise: target.noise,
        peaks: getPeaksForPhase(simPhase, target.a)
      });
      setIsAutoRefining(false);
      setShowMatrix(false);
    }
  };

  const handleRunLmStep = () => {
    if (isSolverRefining) return;
    setIsSolverRefining(true);

    try {
      const twoTheta = generatePatternData.data.map(d => d.twoTheta);
      const yObs = generatePatternData.data.map(d => d.obs);

      const solverPhases: PhaseModel[] = simPhases.map(p => ({
        id: p.id,
        name: p.name,
        phaseType: p.phaseType,
        enabled: p.enabled,
        a: p.a,
        scale: p.scale,
        fwhm: p.fwhm,
        eta: p.eta,
        crystalliteSize: p.crystalliteSize,
        microstrain: p.microstrain,
        peaks: p.peaks
      }));

      const res = runLevenbergMarquardtStep(
        twoTheta,
        yObs,
        solverPhases,
        userParams.background,
        setupZeroShift,
        refinementFlags,
        solverLambda,
        wavelength || 1.5406
      );

      setLastSolverResult(res);
      setSolverLambda(res.lambda);
      setSetupZeroShift(res.zeroShift);
      setUserParams(prev => ({
        ...prev,
        background: res.backgroundLevel,
        zeroShift: res.zeroShift
      }));

      setSimPhases(prev => prev.map((p, idx) => {
        const updated = res.phases[idx];
        if (!updated) return p;
        return {
          ...p,
          a: updated.a,
          scale: updated.scale,
          fwhm: updated.fwhm,
          eta: updated.eta,
          crystalliteSize: updated.crystalliteSize,
          microstrain: updated.microstrain
        };
      }));

      setRHistory(prev => [
        ...prev,
        {
          iter: prev.length + 1,
          rwp: res.rwp,
          rexp: res.rexp,
          gof: res.gof,
          params: res.phases.map(p => ({
            id: p.id,
            name: p.name,
            a: p.a,
            scale: p.scale,
            fwhm: p.fwhm,
            eta: p.eta,
            crystalliteSize: p.crystalliteSize,
            microstrain: p.microstrain
          }))
        }
      ]);

      if (res.rwp < rFactor) {
        playSynthTone('success');
      } else {
        playSynthTone('action');
      }
    } catch (e) {
      console.error("Levenberg-Marquardt step error", e);
    } finally {
      setIsSolverRefining(false);
    }
  };

  const handleRunMultiCycle = async (cycles: number) => {
    if (isSolverRefining) return;
    setIsSolverRefining(true);

    let currentLambda = solverLambda;
    let currentZero = setupZeroShift;
    let currentBkg = userParams.background;
    let currentPhases = [...simPhases];

    for (let cycle = 1; cycle <= cycles; cycle++) {
      setSolverProgress({
        current: cycle,
        total: cycles,
        message: `Running LM optimization cycle ${cycle}/${cycles}...`
      });

      const twoTheta = generatePatternData.data.map(d => d.twoTheta);
      const yObs = generatePatternData.data.map(d => d.obs);

      const solverPhases: PhaseModel[] = currentPhases.map(p => ({
        id: p.id,
        name: p.name,
        phaseType: p.phaseType,
        enabled: p.enabled,
        a: p.a,
        scale: p.scale,
        fwhm: p.fwhm,
        eta: p.eta,
        crystalliteSize: p.crystalliteSize,
        microstrain: p.microstrain,
        peaks: p.peaks
      }));

      const res = runLevenbergMarquardtStep(
        twoTheta,
        yObs,
        solverPhases,
        currentBkg,
        currentZero,
        refinementFlags,
        currentLambda,
        wavelength || 1.5406
      );

      currentLambda = res.lambda;
      currentZero = res.zeroShift;
      currentBkg = res.backgroundLevel;

      setLastSolverResult(res);
      setSolverLambda(res.lambda);
      setSetupZeroShift(res.zeroShift);
      setUserParams(prev => ({
        ...prev,
        background: res.backgroundLevel,
        zeroShift: res.zeroShift
      }));

      currentPhases = currentPhases.map((p, idx) => {
        const updated = res.phases[idx];
        if (!updated) return p;
        return {
          ...p,
          a: updated.a,
          scale: updated.scale,
          fwhm: updated.fwhm,
          eta: updated.eta,
          crystalliteSize: updated.crystalliteSize,
          microstrain: updated.microstrain
        };
      });
      setSimPhases(currentPhases);

      setRHistory(prev => [
        ...prev,
        {
          iter: prev.length + 1,
          rwp: res.rwp,
          rexp: res.rexp,
          gof: res.gof,
          params: res.phases.map(p => ({
            id: p.id,
            name: p.name,
            a: p.a,
            scale: p.scale,
            fwhm: p.fwhm,
            eta: p.eta,
            crystalliteSize: p.crystalliteSize,
            microstrain: p.microstrain
          }))
        }
      ]);

      await new Promise(r => setTimeout(r, 120));
    }

    playSynthTone('success');
    setSolverProgress(null);
    setIsSolverRefining(false);
  };

  const handleRunFiveStageProtocol = async () => {
    if (isSolverRefining) return;
    setIsSolverRefining(true);
    setStepwiseActive(true);

    const stages: Array<{ stage: number; title: string; flags: RefinementFlags; cycles: number }> = [
      {
        stage: 1,
        title: 'Stage 1/5: Scale Factor & Incoherent Background Refinement',
        flags: { refineScale: true, refineLattice: false, refineFwhm: false, refineEta: false, refineZeroShift: false, refineBkg: true, refineMicrostrain: false, refineCrystalliteSize: false },
        cycles: 2
      },
      {
        stage: 2,
        title: 'Stage 2/5: Goniometer Zero-Point Shift (2θ₀) Calibration',
        flags: { refineScale: true, refineLattice: false, refineFwhm: false, refineEta: false, refineZeroShift: true, refineBkg: true, refineMicrostrain: false, refineCrystalliteSize: false },
        cycles: 2
      },
      {
        stage: 3,
        title: 'Stage 3/5: Unit Cell Lattice Parameter (a) Optimization',
        flags: { refineScale: true, refineLattice: true, refineFwhm: false, refineEta: false, refineZeroShift: true, refineBkg: true, refineMicrostrain: false, refineCrystalliteSize: false },
        cycles: 3
      },
      {
        stage: 4,
        title: 'Stage 4/5: Peak Width (FWHM) & Pseudo-Voigt Lorentzian (η) Fitting',
        flags: { refineScale: true, refineLattice: true, refineFwhm: true, refineEta: true, refineZeroShift: true, refineBkg: true, refineMicrostrain: false, refineCrystalliteSize: false },
        cycles: 3
      },
      {
        stage: 5,
        title: 'Stage 5/5: Simultaneous Multi-Parameter Convergence & Microstrain',
        flags: { refineScale: true, refineLattice: true, refineFwhm: true, refineEta: true, refineZeroShift: true, refineBkg: true, refineMicrostrain: true, refineCrystalliteSize: true },
        cycles: 3
      }
    ];

    let currentLambda = solverLambda;
    let currentZero = setupZeroShift;
    let currentBkg = userParams.background;
    let currentPhases = [...simPhases];

    for (const st of stages) {
      setStepwiseStage(st.stage);
      setStepwiseMessage(st.title);
      setRefinementFlags(st.flags);

      for (let c = 1; c <= st.cycles; c++) {
        setSolverProgress({
          current: (st.stage - 1) * 3 + c,
          total: 13,
          message: `${st.title} (Cycle ${c}/${st.cycles})`
        });

        const twoTheta = generatePatternData.data.map(d => d.twoTheta);
        const yObs = generatePatternData.data.map(d => d.obs);

        const solverPhases: PhaseModel[] = currentPhases.map(p => ({
          id: p.id,
          name: p.name,
          phaseType: p.phaseType,
          enabled: p.enabled,
          a: p.a,
          scale: p.scale,
          fwhm: p.fwhm,
          eta: p.eta,
          crystalliteSize: p.crystalliteSize,
          microstrain: p.microstrain,
          peaks: p.peaks
        }));

        const res = runLevenbergMarquardtStep(
          twoTheta,
          yObs,
          solverPhases,
          currentBkg,
          currentZero,
          st.flags,
          currentLambda,
          wavelength || 1.5406
        );

        currentLambda = res.lambda;
        currentZero = res.zeroShift;
        currentBkg = res.backgroundLevel;

        setLastSolverResult(res);
        setSolverLambda(res.lambda);
        setSetupZeroShift(res.zeroShift);
        setUserParams(prev => ({
          ...prev,
          background: res.backgroundLevel,
          zeroShift: res.zeroShift
        }));

        currentPhases = currentPhases.map((p, idx) => {
          const updated = res.phases[idx];
          if (!updated) return p;
          return {
            ...p,
            a: updated.a,
            scale: updated.scale,
            fwhm: updated.fwhm,
            eta: updated.eta,
            crystalliteSize: updated.crystalliteSize,
            microstrain: updated.microstrain
          };
        });
        setSimPhases(currentPhases);

        setRHistory(prev => [
          ...prev,
          {
            iter: prev.length + 1,
            rwp: res.rwp,
            rexp: res.rexp,
            gof: res.gof,
            params: res.phases.map(p => ({
              id: p.id,
              name: p.name,
              a: p.a,
              scale: p.scale,
              fwhm: p.fwhm,
              eta: p.eta,
              crystalliteSize: p.crystalliteSize,
              microstrain: p.microstrain
            }))
          }
        ]);

        await new Promise(r => setTimeout(r, 120));
      }

      playSynthTone('switch');
    }

    playSynthTone('success');
    setStepwiseMessage('5-Stage Standard Protocol successfully completed! R_wp minimized.');
    setTimeout(() => {
      setStepwiseActive(false);
      setStepwiseStage(0);
      setStepwiseMessage('');
    }, 4500);

    setSolverProgress(null);
    setIsSolverRefining(false);
  };

  const runStepwiseRefinement = handleRunFiveStageProtocol;

  const handleRunSingleStage = async (stageNumber: number) => {
    if (isSolverRefining) return;
    setIsSolverRefining(true);
    setStepwiseActive(true);

    const stagesConfig: Record<number, { stage: number; title: string; flags: RefinementFlags; cycles: number }> = {
      1: {
        stage: 1,
        title: 'Stage 1: Scale & Background Refinement',
        flags: { refineScale: true, refineLattice: false, refineFwhm: false, refineEta: false, refineZeroShift: false, refineBkg: true, refineMicrostrain: false, refineCrystalliteSize: false },
        cycles: 3
      },
      2: {
        stage: 2,
        title: 'Stage 2: Goniometer Zero-Point Shift (2θ₀) Calibration',
        flags: { refineScale: true, refineLattice: false, refineFwhm: false, refineEta: false, refineZeroShift: true, refineBkg: true, refineMicrostrain: false, refineCrystalliteSize: false },
        cycles: 3
      },
      3: {
        stage: 3,
        title: 'Stage 3: Unit Cell Lattice Parameter (a) Optimization',
        flags: { refineScale: true, refineLattice: true, refineFwhm: false, refineEta: false, refineZeroShift: true, refineBkg: true, refineMicrostrain: false, refineCrystalliteSize: false },
        cycles: 3
      },
      4: {
        stage: 4,
        title: 'Stage 4: Peak Width (FWHM) & Pseudo-Voigt (η) Fitting',
        flags: { refineScale: true, refineLattice: true, refineFwhm: true, refineEta: true, refineZeroShift: true, refineBkg: true, refineMicrostrain: false, refineCrystalliteSize: false },
        cycles: 3
      },
      5: {
        stage: 5,
        title: 'Stage 5: Simultaneous Microstrain & Crystallite Size',
        flags: { refineScale: true, refineLattice: true, refineFwhm: true, refineEta: true, refineZeroShift: true, refineBkg: true, refineMicrostrain: true, refineCrystalliteSize: true },
        cycles: 3
      }
    };

    const st = stagesConfig[stageNumber] || stagesConfig[1];
    setStepwiseStage(st.stage);
    setStepwiseMessage(st.title);
    setRefinementFlags(st.flags);

    let currentLambda = solverLambda;
    let currentZero = simZeroShift;
    let currentBkg = simBackground;
    let currentPhases = [...simPhases];

    for (let c = 1; c <= st.cycles; c++) {
      setSolverProgress({
        current: c,
        total: st.cycles,
        message: `${st.title} (Cycle ${c}/${st.cycles})`
      });

      const twoTheta = generatePatternData.data.map(d => d.twoTheta);
      const yObs = generatePatternData.data.map(d => d.obs);

      const solverPhases: PhaseModel[] = currentPhases.map(p => ({
        id: p.id,
        name: p.name,
        phaseType: p.phaseType,
        enabled: p.enabled,
        a: p.a,
        scale: p.scale,
        fwhm: p.fwhm,
        eta: p.eta,
        crystalliteSize: p.crystalliteSize,
        microstrain: p.microstrain,
        peaks: p.peaks
      }));

      const res = runLevenbergMarquardtStep(
        twoTheta,
        yObs,
        solverPhases,
        currentBkg,
        currentZero,
        st.flags,
        currentLambda,
        wavelength || 1.5406
      );

      currentLambda = res.lambda;
      currentZero = res.zeroShift;
      currentBkg = res.backgroundLevel;

      setLastSolverResult(res);
      setSolverLambda(res.lambda);
      setSetupZeroShift(res.zeroShift);
      setSimZeroShift(res.zeroShift);
      setSimBackground(res.backgroundLevel);
      setUserParams(prev => ({
        ...prev,
        background: res.backgroundLevel,
        zeroShift: res.zeroShift
      }));

      currentPhases = currentPhases.map((p, idx) => {
        const updated = res.phases[idx];
        if (!updated) return p;
        return {
          ...p,
          a: updated.a,
          scale: updated.scale,
          fwhm: updated.fwhm,
          eta: updated.eta,
          crystalliteSize: updated.crystalliteSize,
          microstrain: updated.microstrain
        };
      });
      setSimPhases(currentPhases);

      setRHistory(prev => [
        ...prev,
        {
          iter: prev.length + 1,
          rwp: res.rwp,
          rexp: res.rexp,
          gof: res.gof,
          params: res.phases.map(p => ({
            id: p.id,
            name: p.name,
            a: p.a,
            scale: p.scale,
            fwhm: p.fwhm,
            eta: p.eta,
            crystalliteSize: p.crystalliteSize,
            microstrain: p.microstrain
          }))
        }
      ]);

      await new Promise(r => setTimeout(r, 120));
    }

    playSynthTone('success');
    setStepwiseMessage(`${st.title} finished.`);
    setTimeout(() => {
      setStepwiseActive(false);
      setStepwiseStage(0);
      setStepwiseMessage('');
    }, 3000);

    setSolverProgress(null);
    setIsSolverRefining(false);
  };

  const handleLoadNistStandard = (std: NistStandard) => {
    playSynthTone('switch');
    setCustomObsIntensities(null);
    setCustomSampleName(std.name);

    const stdPhaseType = std.crystalSystem.toLowerCase().includes('hexagonal') || std.crystalSystem.toLowerCase().includes('trigonal')
      ? 'Alumina (Hexagonal)'
      : 'Simple Cubic';
    const stdFwhm = 0.10;

    if (std.id === 'srm_mixture') {
      // Dual-phase Anatase + Rutile
      const anatasePhase: SimStructure = {
        id: 'phase_anatase',
        name: 'Anatase (TiO₂)',
        phaseType: 'Simple Cubic',
        enabled: true,
        a: 3.82,
        targetA: 3.784,
        scale: 750,
        targetScale: 900,
        fwhm: 0.18,
        targetFwhm: 0.12,
        eta: 0.5,
        targetEta: 0.5,
        crystalliteSize: 120,
        targetCrystalliteSize: 150,
        microstrain: 0.02,
        targetMicrostrain: 0.01,
        peaks: getPeaksForPhase('Simple Cubic', 3.784)
      };

      const rutilePhase: SimStructure = {
        id: 'phase_rutile',
        name: 'Rutile (TiO₂)',
        phaseType: 'Rutile',
        enabled: true,
        a: 4.65,
        targetA: 4.594,
        scale: 350,
        targetScale: 400,
        fwhm: 0.22,
        targetFwhm: 0.15,
        eta: 0.6,
        targetEta: 0.6,
        crystalliteSize: 100,
        targetCrystalliteSize: 140,
        microstrain: 0.03,
        targetMicrostrain: 0.015,
        peaks: getPeaksForPhase('Rutile', 4.594)
      };

      setSimPhases([anatasePhase, rutilePhase]);
      setSelectedSimPhaseIdx(0);
      setSimPhase('Simple Cubic');
      setUserParams(prev => ({
        ...prev,
        a: 3.82,
        scale: 750,
        fwhm: 0.18,
        eta: 0.5,
        zeroShift: 0.05,
        background: 40
      }));
      setSetupZeroShift(0.05);
    } else {
      const standardPhase: SimStructure = {
        id: 'nist_' + std.id,
        name: `${std.code} ${std.name}`,
        phaseType: stdPhaseType,
        enabled: true,
        a: std.certifiedA * 1.008,
        targetA: std.certifiedA,
        scale: 900,
        targetScale: 1000,
        fwhm: stdFwhm * 1.4,
        targetFwhm: stdFwhm,
        eta: 0.4,
        targetEta: 0.5,
        crystalliteSize: 150,
        targetCrystalliteSize: 180,
        microstrain: 0.015,
        targetMicrostrain: 0.008,
        peaks: getPeaksForPhase(stdPhaseType, std.certifiedA)
      };

      setSimPhases([standardPhase]);
      setSelectedSimPhaseIdx(0);
      setSimPhase(stdPhaseType);
      setUserParams(prev => ({
        ...prev,
        a: std.certifiedA * 1.008,
        scale: 900,
        fwhm: stdFwhm * 1.4,
        eta: 0.4,
        zeroShift: 0.08,
        background: 45
      }));
      setSetupZeroShift(0.08);
    }

    setRHistory([]);
    setIterCount(0);
  };

  const handleLoadCustomExperimentalData = (name: string, points: Array<{ twoTheta: number; obs: number }>) => {
    playSynthTone('success');
    const steps = Math.floor((SIMULATION_RANGE.end - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
    const dataLen = steps + 1;
    const interp = new Float32Array(dataLen);

    const sorted = [...points].sort((a, b) => a.twoTheta - b.twoTheta);

    for (let i = 0; i < dataLen; i++) {
      const target2T = SIMULATION_RANGE.start + i * SIMULATION_RANGE.step;
      if (target2T <= sorted[0].twoTheta) {
        interp[i] = sorted[0].obs;
      } else if (target2T >= sorted[sorted.length - 1].twoTheta) {
        interp[i] = sorted[sorted.length - 1].obs;
      } else {
        let idx = 0;
        while (idx < sorted.length - 1 && sorted[idx + 1].twoTheta < target2T) {
          idx++;
        }
        const p1 = sorted[idx];
        const p2 = sorted[idx + 1] || p1;
        const span = Math.max(0.0001, p2.twoTheta - p1.twoTheta);
        const frac = (target2T - p1.twoTheta) / span;
        interp[i] = p1.obs + frac * (p2.obs - p1.obs);
      }
    }

    setCustomObsIntensities(interp);
    setCustomSampleName(name);
    setRHistory([]);
    setIterCount(0);
  };

  const rietveldWalkthroughSteps: WizardStep[] = [
    {
      title: '1. Phase Models & Initial Crystal Structures',
      subtitle: 'Starting Lattice Constants (a,b,c), Space Groups & Atoms',
      explanation: 'Define starting structural models for each crystalline phase present in your specimen. Accurate starting lattice parameters and space group symmetry are required to calculate Bragg reflection positions (2θ) from Bragg’s Law λ = 2d sinθ.',
      tip: 'Import standard CIF files or choose from research-grade crystal database presets for rapid structural initialization.'
    },
    {
      title: '2. Background & Instrumental Alignments',
      subtitle: 'Zero-Point Shift (2θ₀), Sample Displacement & Scattering Noise',
      explanation: 'Before refining subtle lattice distortions, calibrate systematic instrument errors. Sample height displacement shifts peaks by -s·cosθ / R, while zero-point error adds a constant angular offset across all reflections.',
      tip: 'Refine scale factor and background coefficients first, then zero-shift, before opening unit cell dimensions.'
    },
    {
      title: '3. Profile Functions & Microstructure Broadening',
      subtitle: 'Pseudo-Voigt (η), Caglioti (U,V,W), Size & Microstrain',
      explanation: 'Model individual reflection profiles using pseudo-Voigt or Pearson VII functions. Peak broadening deconvolves into instrumental divergence (Caglioti parameters), crystallite domain size D (Scherrer), and root-mean-square lattice microstrain ε (Stokes-Wilson).',
      tip: 'Lorentzian fraction η approaching 1.0 indicates dominant size broadening, while Gaussian fraction indicates strain or instrumental resolution.'
    },
    {
      title: '4. Non-Linear Least-Squares & Convergence Audit',
      subtitle: 'Weighted Profile Rwp, Expected Rexp, and Goodness-of-Fit (GoF / χ²)',
      explanation: 'The refinement engine minimizes the weighted sum of squared residuals S = ∑ wᵢ(y_{obs,i} - y_{calc,i})² using Gauss-Newton / Levenberg-Marquardt algorithms. Inspect R_wp (target < 10%) and Goodness of Fit χ² = (R_wp / R_exp)² (target 1.0 – 1.3).',
      tip: 'A flat, featureless difference curve (I_obs - I_calc) confirms that all diffraction intensity has been quantitatively accounted for.'
    }
  ];

  const handleLoadPresetIndex = (idx: number) => {
    const presetDefinitions = [
      {
        name: 'Silicon (NIST SRM 640)',
        phaseType: 'Silicon (Diamond Cubic)',
        a: 5.431,
        targetA: 5.431,
        scale: 1300,
        targetScale: 1300,
        fwhm: 0.12,
        targetFwhm: 0.12,
        eta: 0.6,
        targetEta: 0.6,
        crystalliteSize: 180,
        targetCrystalliteSize: 180,
        microstrain: 0.01,
        targetMicrostrain: 0.01,
        peaks: getPeaksForPhase('Silicon (Diamond Cubic)', 5.431)
      },
      {
        name: 'Alpha-Quartz (Trigonal SiO₂)',
        phaseType: 'Quartz',
        a: 4.913,
        targetA: 4.913,
        scale: 800,
        targetScale: 800,
        fwhm: 0.1,
        targetFwhm: 0.1,
        eta: 0.7,
        targetEta: 0.7,
        crystalliteSize: 200,
        targetCrystalliteSize: 200,
        microstrain: 0.01,
        targetMicrostrain: 0.01,
        peaks: getPeaksForPhase('Quartz', 4.913)
      },
      {
        name: 'BCC Ferrite Alloy (α-Fe)',
        phaseType: 'BCC',
        a: 3.5,
        targetA: 3.5,
        scale: 1200,
        targetScale: 1200,
        fwhm: 0.15,
        targetFwhm: 0.15,
        eta: 0.6,
        targetEta: 0.6,
        crystalliteSize: 80,
        targetCrystalliteSize: 80,
        microstrain: 0.1,
        targetMicrostrain: 0.1,
        peaks: getPeaksForPhase('BCC', 3.5)
      },
      {
        name: 'FCC Copper Nanocrystal (Cu)',
        phaseType: 'FCC',
        a: 4.5,
        targetA: 4.5,
        scale: 1500,
        targetScale: 1500,
        fwhm: 0.25,
        targetFwhm: 0.25,
        eta: 0.4,
        targetEta: 0.4,
        crystalliteSize: 120,
        targetCrystalliteSize: 120,
        microstrain: 0.02,
        targetMicrostrain: 0.02,
        peaks: getPeaksForPhase('FCC', 4.5)
      },
      {
        name: 'Perovskite Ceramic (CaTiO₃)',
        phaseType: 'Perovskite',
        a: 3.905,
        targetA: 3.905,
        scale: 900,
        targetScale: 900,
        fwhm: 0.12,
        targetFwhm: 0.12,
        eta: 0.5,
        targetEta: 0.5,
        crystalliteSize: 180,
        targetCrystalliteSize: 180,
        microstrain: 0.02,
        targetMicrostrain: 0.02,
        peaks: getPeaksForPhase('Perovskite', 3.905)
      },
      {
        name: 'Rutile Titania (TiO₂)',
        phaseType: 'Rutile',
        a: 4.594,
        targetA: 4.594,
        scale: 1000,
        targetScale: 1000,
        fwhm: 0.18,
        targetFwhm: 0.18,
        eta: 0.6,
        targetEta: 0.6,
        crystalliteSize: 150,
        targetCrystalliteSize: 150,
        microstrain: 0.03,
        targetMicrostrain: 0.03,
        peaks: getPeaksForPhase('Rutile', 4.594)
      },
      {
        name: 'Corundum Alumina (α-Al₂O₃)',
        phaseType: 'Alumina (Hexagonal)',
        a: 4.758,
        targetA: 4.758,
        scale: 1100,
        targetScale: 1100,
        fwhm: 0.14,
        targetFwhm: 0.14,
        eta: 0.5,
        targetEta: 0.5,
        crystalliteSize: 160,
        targetCrystalliteSize: 160,
        microstrain: 0.02,
        targetMicrostrain: 0.02,
        peaks: getPeaksForPhase('Alumina (Hexagonal)', 4.758)
      }
    ];

    const preset = presetDefinitions[idx];
    if (!preset) return;

    const newPhase = {
      id: `phase_${Date.now()}`,
      name: preset.name,
      phaseType: preset.phaseType,
      enabled: true,
      a: Number((preset.a * 1.02).toFixed(4)),
      targetA: preset.targetA,
      scale: Math.round(preset.scale * 0.85),
      targetScale: preset.targetScale,
      fwhm: Number((preset.fwhm * 1.25).toFixed(3)),
      targetFwhm: preset.targetFwhm,
      eta: Number(Math.min(0.95, preset.eta * 1.1).toFixed(2)),
      targetEta: preset.targetEta,
      crystalliteSize: Math.round(preset.crystalliteSize * 0.85),
      targetCrystalliteSize: preset.targetCrystalliteSize,
      microstrain: Number((preset.microstrain * 1.4).toFixed(3)),
      targetMicrostrain: preset.targetMicrostrain,
      peaks: preset.peaks
    };

    setSimPhases([newPhase]);
    setSelectedSimPhaseIdx(0);
    setIsAutoRefining(false);
    playSynthTone('chime');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 0. Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Full-Pattern Rietveld Refinement & Structural Optimization Engine"
        description="Master multi-phase powder diffraction modeling, Caglioti profile broadening, Gauss-Newton least-squares optimization, and statistical R-factor quality audits."
        steps={rietveldWalkthroughSteps}
        presetNames={[
          'Silicon NIST Standard (Cubic SRM 640)',
          'Alpha-Quartz (Trigonal SiO₂)',
          'BCC Ferrite Alloy (α-Fe)',
          'FCC Copper Nanocrystals (Cu)',
          'Perovskite Ceramic (CaTiO₃)',
          'Rutile Titania (TiO₂)',
          'Corundum Alumina (α-Al₂O₃)'
        ]}
        onLoadBenchmarkPreset={(idx) => {
          handleLoadPresetIndex(idx);
        }}
      />

      {/* 0.5 Physical Meaning Verdict Banner */}
      <PhysicalMeaningSummary
        title="Rietveld Refinement Quality Verdict"
        tone={rFactor < 10 ? 'success' : rFactor < 20 ? 'warning' : 'info'}
        statement={`Weighted profile residual R_wp = ${rFactor.toFixed(2)}% with Goodness of Fit GoF (χ²) = ${(Math.pow(rFactor / referenceRwp, 2)).toFixed(2)} across ${simPhases.filter(p => p.enabled).length} active crystalline phase(s).`}
        contextNote={`Refinement status: ${
          rFactor < 10
            ? 'Excellent research-grade convergence. Difference curve is flat and random statistical noise is reached.'
            : rFactor < 18
            ? 'Acceptable starting fit. Minor peak shape or background mismatches remain; consider tuning profile broadening (η / FWHM) or zero shift.'
            : 'Significant structural residual detected. Ensure lattice parameters a and sample displacement are close to the target reflections before refining atomic coordinates.'
        } Primary phase: ${currentPhaseObj.name} (Lattice a = ${currentPhaseObj.a.toFixed(4)} Å, Volume V = ${computeCrystallographicVolumeAndDensity(currentPhaseObj.phaseType, currentPhaseObj.a).volume.toFixed(2)} Å³).`}
        metrics={[
          { label: 'R_wp Residual', value: `${rFactor.toFixed(2)}`, unit: '%' },
          { label: 'Expected R_exp', value: `${referenceRwp.toFixed(2)}`, unit: '%' },
          { label: 'Goodness of Fit χ²', value: `${(Math.pow(rFactor / referenceRwp, 2)).toFixed(2)}`, unit: '' },
          { label: 'Active Cell a', value: `${currentPhaseObj.a.toFixed(4)}`, unit: 'Å' },
          { label: 'Stability Index', value: `${stabilityPercentage.toFixed(1)}`, unit: '%' }
        ]}
      />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#020813] via-[#051118] to-[#010912] p-6 md:p-10 border border-teal-500/20 shadow-[0_0_40px_rgba(20,184,166,0.15)] group">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
          <img src={rietveldBg} alt="Rietveld Refinement" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020813] via-[#051118]/80 to-[#010912]/30" />
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-teal-500/20 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-600/20 transition-colors duration-700" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-inner">
              <Database className="w-4 h-4" />
              <span>Full-Pattern Fitting</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-teal-100 to-teal-400 tracking-tight leading-tight drop-shadow-sm">
              Rietveld Parameter Set
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-2xl leading-relaxed">
              Generate structural starting points for least-squares refinement. Optimize crystal structures against the entire diffraction pattern with the interactive physics engine and live covariance matrix.
            </p>
          </div>
          <div className="hidden lg:flex w-24 h-24 rounded-2xl bg-teal-500/10 border border-teal-500/30 items-center justify-center shadow-[inset_0_0_20px_rgba(20,184,166,0.2)] transform rotate-3 group-hover:rotate-6 transition-transform duration-500 backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-teal-400/20 blur-xl rounded-full" />
            <Layers className="w-12 h-12 text-teal-400 relative z-10" />
          </div>
        </div>
      </div>
      
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
        <div className="space-y-6">
          <RietveldAdvancedControls
            phases={simPhases}
            backgroundLevel={userParams.background}
            zeroShift={setupZeroShift}
            wavelength={wavelength}
            refinementFlags={refinementFlags}
            onUpdateFlags={setRefinementFlags}
            onRunLmStep={handleRunLmStep}
            onRunMultiCycle={handleRunMultiCycle}
            onRunProtocol={handleRunFiveStageProtocol}
            isRefining={isSolverRefining}
            refineProgress={solverProgress || undefined}
            lastSolverResult={lastSolverResult}
            onLoadNistStandard={handleLoadNistStandard}
            onLoadCustomExperimentalData={handleLoadCustomExperimentalData}
            qpaResults={qpaResults}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls & Rietveld Parameter Set */}
          <div className="lg:col-span-5 space-y-6">
            <RietveldParameterSet
              simPhases={simPhases}
              setSimPhases={setSimPhases}
              selectedSimPhaseIdx={selectedSimPhaseIdx}
              setSelectedSimPhaseIdx={setSelectedSimPhaseIdx}
              userParams={userParams}
              setUserParams={setUserParams}
              targetParams={targetParams}
              simPhase={simPhase}
              setSimPhase={setSimPhase}
              rFactor={rFactor}
              referenceRwp={referenceRwp}
              stabilityPercentage={stabilityPercentage}
              isAutoRefining={isAutoRefining}
              setIsAutoRefining={setIsAutoRefining}
              stepwiseActive={stepwiseActive}
              stepwiseStage={stepwiseStage}
              stepwiseMessage={stepwiseMessage}
              runStepwiseRefinement={runStepwiseRefinement}
              onRunLmStep={handleRunLmStep}
              onResetCold={handleResetCold}
              onResetToNominal={handleResetToNominal}
              onAddNewSimStructure={handleAddNewSimStructure}
              handleRemoveSimStructure={handleRemoveSimStructure}
              TARGET_PARAMS={TARGET_PARAMS}
              SPACE_GROUP_DETAILS={SPACE_GROUP_DETAILS}
              isPythonActive={isPythonActive}
              setIsPythonActive={setIsPythonActive}
              pythonFeaturesEnabled={pythonFeaturesEnabled}
              isPythonRefining={isPythonRefining}
              runPythonRietveldRefinement={runPythonRietveldRefinement}
              rHistory={rHistory}
              iterCount={iterCount}
              playSynthTone={playSynthTone}
              computeCrystallographicVolumeAndDensity={computeCrystallographicVolumeAndDensity}
              getPeaksForPhase={getPeaksForPhase}
              getEquivalentPositions={getEquivalentPositions}
              toSymmetryScreenCoords={toSymmetryScreenCoords}
              QUARTZ_PEAKS={QUARTZ_PEAKS}
              RUTILE_PEAKS={RUTILE_PEAKS}
              PEROVSKITE_PEAKS={PEROVSKITE_PEAKS}
              ALUMINA_PEAKS={ALUMINA_PEAKS}
              GRAPHITE_PEAKS={GRAPHITE_PEAKS}
              refinementFlags={refinementFlags}
              onUpdateRefinementFlags={setRefinementFlags}
              qpaResults={qpaResults}
              onRunSingleStage={handleRunSingleStage}
            />
          </div>

          <div className="lg:col-span-7">
            <div className="bg-[#050A14] p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800/80 h-[650px] flex flex-col relative overflow-hidden group/pattern ring-1 ring-white/5 ring-inset backdrop-blur-2xl">
              {/* Custom Background Graphic */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-5 group-hover/pattern:opacity-10 transition-opacity duration-1000 mix-blend-screen">
                <img src={rietveldBg} alt="Rietveld Pattern" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
              </div>
              <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none group-hover/pattern:bg-teal-500/10 transition-all duration-1000"></div>
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
                  <ComposedChart data={generatePatternData.data} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
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

          {/* Physical Residual Corrections Advisor */}
          <div className="mt-8">
            <PhysicalResidualCorrectionsModule
              data={generatePatternData.data}
              currentZeroShift={setupZeroShift}
              currentDisplacement={sampleDisplacement}
              currentFwhm={currentPhaseObj.fwhm}
              currentEta={currentPhaseObj.eta}
              bgTerms={bgTerms}
              onApplyCorrection={handleApplyPhysicalCorrection}
            />
          </div>

          {/* Python and Pandas Refinement Report */}
          {(pythonFeaturesEnabled || isPythonActive) && (isPythonRefining || pythonRefineResult || pythonRefineError) && (
            <div className="mt-8 bg-[#050A14] rounded-[2rem] border border-amber-500/20 p-8 shadow-[0_20px_50px_rgba(245,158,11,0.1)] relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              {/* Custom Background Graphic */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000 mix-blend-screen">
                <img src={rietveldBg} alt="Python Refinement" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 font-sans tracking-tight">Python & Pandas Refinement Metrics</h3>
                    <p className="text-xs text-amber-400/80 font-mono tracking-widest mt-0.5">SCIPY.OPTIMIZE // POWELL LE MODELLING</p>
                  </div>
                </div>
                {pythonRefineResult?.pandas_dataframe_enabled && (
                  <span className="px-3 py-1 bg-teal-500/15 border border-teal-500/30 text-teal-400 rounded-full text-[9px] font-black uppercase tracking-widest font-mono shadow-[0_0_10px_rgba(20,184,166,0.1)]">
                    Pandas DataFrame Active
                  </span>
                )}
              </div>

              {isPythonRefining && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-slate-200">Refining Multi-Phase Pattern...</p>
                    <p className="text-xs text-slate-500 font-mono text-center">Running non-linear coordinate descent on parameter covariance matrix via Pandas DataFrames</p>
                  </div>
                </div>
              )}

              {pythonRefineError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl text-xs font-mono flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{pythonRefineError}</span>
                </div>
              )}

              {pythonRefineResult && !isPythonRefining && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Quality factors grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center shadow-lg hover:border-amber-500/20 transition-all">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Initial Rwp</span>
                      <span className="text-lg font-mono font-black text-slate-300">{pythonRefineResult.r_factors.r_wp_initial?.toFixed(2)}%</span>
                    </div>
                    <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20 text-center shadow-lg shadow-amber-500/5">
                      <span className="block text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1.5">Refined Rwp</span>
                      <span className="text-xl font-mono font-black text-amber-400 animate-pulse">{pythonRefineResult.r_factors.r_wp_final?.toFixed(2)}%</span>
                    </div>
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center shadow-lg hover:border-teal-500/20 transition-all">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Expected Rexp</span>
                      <span className="text-lg font-mono font-black text-teal-400">{pythonRefineResult.r_factors.r_exp?.toFixed(2)}%</span>
                    </div>
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center shadow-lg hover:border-indigo-500/20 transition-all">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Goodness-of-Fit</span>
                      <span className="text-lg font-mono font-black text-indigo-400">{pythonRefineResult.r_factors.gof?.toFixed(2)}</span>
                    </div>
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center shadow-lg hover:border-rose-500/30 transition-all col-span-2 md:col-span-1 text-ellipsis overflow-hidden">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Reduced χ²</span>
                      <span className="text-lg font-mono font-black text-rose-400">{pythonRefineResult.r_factors.chi_squared?.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Statistical Pandas report */}
                  <div className="bg-[#0B1221] rounded-2xl border border-white/5 p-5 relative overflow-hidden">
                    <h4 className="text-[10px] font-black tracking-widest text-slate-400 mb-3 uppercase font-mono flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-teal-400" /> Pandas Tabular Residual Analytics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mean Residual Error</span>
                        <span className="text-xs font-mono font-extrabold text-slate-300">{pythonRefineResult.statistics.mean_residual?.toExponential(3)}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Residual Std Dev</span>
                        <span className="text-xs font-mono font-extrabold text-slate-300">{pythonRefineResult.statistics.std_residual?.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Absolute Error</span>
                        <span className="text-xs font-mono font-extrabold text-slate-300">{pythonRefineResult.statistics.max_error?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pearson Correlation (R)</span>
                        <span className="text-xs font-mono font-extrabold text-teal-400">{(pythonRefineResult.statistics.correlation_coefficient * 100).toFixed(4)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Parameter comparisons table */}
                  <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="py-3 px-4">Phase Name</th>
                          <th className="py-3 px-4">Symmetry Type</th>
                          <th className="py-3 px-4 text-right">Lattice a (Init → Opt)</th>
                          <th className="py-3 px-4 text-right">Scale (Init → Opt)</th>
                          <th className="py-3 px-4 text-right">FWHM (Init → Opt)</th>
                          <th className="py-3 px-4 text-right">Cell Vol (Å³)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {pythonRefineResult.phases.map((ph: any, i: number) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-200">{ph.name}</td>
                            <td className="py-4 px-4"><span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[9px] font-black uppercase tracking-widest">{ph.phaseType}</span></td>
                            <td className="py-3 px-4 text-right font-mono font-black text-teal-400">
                              {ph.initial_a.toFixed(3)} → <span className="text-white text-sm bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">{ph.refined_a.toFixed(5)}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-400">
                              {ph.initial_scale.toFixed(0)} → {ph.refined_scale.toFixed(1)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-300">
                              {ph.initial_fwhm.toFixed(3)} → {ph.refined_fwhm.toFixed(4)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-amber-400">{ph.volume.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Status report message */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-wider bg-white/5 px-4 py-2 rounded-xl">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Optimizer report: {pythonRefineResult.optimizer_status}
                  </div>

                </div>
              )}
            </div>
          )}
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
            <div className="bg-[#050A14] p-6 rounded-[2rem] shadow-2xl border border-slate-800/80 hover:border-slate-700 relative overflow-hidden group transition-all duration-500 ring-1 ring-white/5 ring-inset backdrop-blur-lg">
              {/* Custom Background Graphic */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000 mix-blend-screen">
                <img src={rietveldBg} alt="Rietveld Refinement Setup" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
              </div>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-700"></div>
              
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
                        value={String(maxObsIntensity) === 'NaN' ? '' : maxObsIntensity}
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
                        value={String(wavelength) === 'NaN' ? '' : wavelength}
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
                        value={String(setupZeroShift) === 'NaN' ? '' : setupZeroShift}
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
                        value={String(sampleDisplacement) === 'NaN' ? '' : sampleDisplacement}
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
                        value={String(polarization) === 'NaN' ? '' : polarization}
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
                            value={String(bgTerms) === 'NaN' ? '' : bgTerms}
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
                                 value={String(phase.scale || 1.0) === 'NaN' ? '' : phase.scale || 1.0}
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
                                value={String(phase.a) === 'NaN' ? '' : phase.a}
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
                                          value={String(phase.c || phase.a) === 'NaN' ? '' : phase.c || phase.a}
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
                                          value={String(phase.b || phase.a) === 'NaN' ? '' : phase.b || phase.a}
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
                                          value={String(phase.beta || 90) === 'NaN' ? '' : phase.beta || 90}
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
                                  value={String(phase.zValue || '') === 'NaN' ? '' : phase.zValue || ''}
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
                                  value={String(phase.molarMass || '') === 'NaN' ? '' : phase.molarMass || ''}
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
                                      value={String(phase.u || 0.01) === 'NaN' ? '' : phase.u || 0.01}
                                      onChange={(e) => updatePhase(idx, 'u', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1 truncate">V</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={String(phase.v || -0.01) === 'NaN' ? '' : phase.v || -0.01}
                                      onChange={(e) => updatePhase(idx, 'v', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1 truncate">W</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={String(phase.w || 0.01) === 'NaN' ? '' : phase.w || 0.01}
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
                                      value={String(phase.lx || 0) === 'NaN' ? '' : phase.lx || 0}
                                      onChange={(e) => updatePhase(idx, 'lx', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-indigo-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">LY (Strain - Lorentzian)</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={String(phase.ly || 0) === 'NaN' ? '' : phase.ly || 0}
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
                                      value={String(phase.eta || 0.5) === 'NaN' ? '' : phase.eta || 0.5}
                                      onChange={(e) => updatePhase(idx, 'eta', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-teal-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">Shape Factor (Pearson-VII)</label>
                                   <input
                                      type="number"
                                      step="0.01"
                                      value={String(phase.shape || 2.0) === 'NaN' ? '' : phase.shape || 2.0}
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
                                      value={String(phase.asymmetry || 0) === 'NaN' ? '' : phase.asymmetry || 0}
                                      onChange={(e) => updatePhase(idx, 'asymmetry', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-emerald-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">Extinction (Eb)</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={String(phase.extinction || 0) === 'NaN' ? '' : phase.extinction || 0}
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
                                          value={String(phase.marchDollase || 1.0) === 'NaN' ? '' : phase.marchDollase || 1.0}
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
                                             value={String(atom.x) === 'NaN' ? '' : atom.x} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'x', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-teal-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">Y</label>
                                           <input 
                                             type="number" step="0.001"
                                             value={String(atom.y) === 'NaN' ? '' : atom.y} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'y', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-teal-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">Z</label>
                                           <input 
                                             type="number" step="0.001"
                                             value={String(atom.z) === 'NaN' ? '' : atom.z} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'z', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-teal-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                       </div>
                                       <div className="col-span-1">
                                         <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5 text-center">SOF</label>
                                         <input 
                                           type="number" step="0.1"
                                           value={String(atom.occupancy) === 'NaN' ? '' : atom.occupancy} 
                                           onChange={(e) => updateAtom(idx, aIdx, 'occupancy', parseFloat(e.target.value))}
                                           className="w-full text-center bg-transparent text-amber-400 text-[10px] font-mono focus:outline-none"
                                         />
                                       </div>
                                       <div className="col-span-1 flex items-center gap-1">
                                         <div className="flex-1">
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">Biso</label>
                                           <input 
                                             type="number" step="0.1"
                                             value={String(atom.bIso) === 'NaN' ? '' : atom.bIso} 
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
                 <div className="bg-[#050A14] backdrop-blur-md p-6 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-slate-800/80 hover:border-slate-700 relative overflow-hidden group transition-all duration-500">
                   {/* Custom Background Graphic */}
                   <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-1000 mix-blend-screen">
                     <img src={rietveldBg} alt="Rietveld Strategy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
                   </div>
                   <div className="absolute top-0 left-0 -mt-2 -mr-2 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] group-hover:bg-teal-500/20 transition-all duration-700"></div>
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
    
               {/* AI Expert Advice */}
               {result && result.ai_advice && (
                 <div className="bg-[#050A14] p-6 rounded-[2rem] border border-slate-800/80 hover:border-slate-700 shadow-2xl relative overflow-hidden group animate-in slide-in-from-top-4 duration-500 mb-4">
                   {/* Custom Background Graphic */}
                   <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-1000 mix-blend-screen">
                     <img src={rietveldBg} alt="Rietveld Expert Advice" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
                   </div>
                   <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                   <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-fuchsia-500"></div>
                   <h3 className="text-xs font-black text-indigo-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2 relative z-10">
                     <Cpu className="w-4 h-4" />
                     AI Refinement Expert Advice
                   </h3>
                   <div className="relative z-10 text-slate-300 text-sm leading-relaxed font-sans markdown-body prose prose-invert prose-sm max-w-none">
                     <Markdown>{result.ai_advice}</Markdown>
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
                 <div className="bg-[#050A14] p-5 rounded-3xl border border-slate-800/80 hover:border-slate-700 shadow-[0_15px_30px_rgba(0,0,0,0.4)] relative overflow-hidden group animate-in slide-in-from-top-4 duration-700">
                    {/* Custom Background Graphic */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000 mix-blend-screen">
                      <img src={rietveldBg} alt="Rietveld Stats" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/90 to-[#050A14]/40" />
                    </div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-30 group-hover:opacity-100 transition-opacity z-10"></div>
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
            livePatternData={generatePatternData.data}
            numRefinedParameters={8} 
          />
        </div>
      )}
    </div>
  );
};

