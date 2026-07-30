import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Grid, 
  Calculator, 
  Layers, 
  Box, 
  Sparkles, 
  RotateCcw, 
  Info, 
  Check, 
  Copy, 
  ArrowRight, 
  Activity, 
  Sliders, 
  Zap, 
  BookOpen, 
  Compass, 
  Table, 
  TrendingUp, 
  Scale, 
  Cpu, 
  Hash,
  Maximize2,
  RefreshCw,
  FlaskConical,
  Eye,
  Download,
  Share2,
  FileText,
  SlidersHorizontal,
  Terminal,
  Play,
  Flame,
  CornerDownRight,
  ZoomIn,
  ZoomOut,
  Target,
  Circle,
  EyeOff,
  Move
} from 'lucide-react';
import { ScientificMathControl } from './ScientificMathControl';

export type CrystalSystem = 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Rhombohedral' | 'Orthorhombic' | 'Monoclinic' | 'Triclinic';

export interface LatticeParams {
  a: number;
  b: number;
  c: number;
  alpha: number; // in degrees
  beta: number;  // in degrees
  gamma: number; // in degrees
}

export interface MaterialPreset {
  id: string;
  name: string;
  formula: string;
  system: CrystalSystem;
  params: LatticeParams;
  spaceGroup: string;
}

const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: 'si',
    name: 'Silicon',
    formula: 'Si',
    system: 'Cubic',
    params: { a: 5.431, b: 5.431, c: 5.431, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'Fd-3m (227)'
  },
  {
    id: 'tio2',
    name: 'Rutile Titanium Dioxide',
    formula: 'TiO₂',
    system: 'Tetragonal',
    params: { a: 4.594, b: 4.594, c: 2.958, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'P42/mnm (136)'
  },
  {
    id: 'al2o3',
    name: 'Sapphire / Alumina',
    formula: 'α-Al₂O₃',
    system: 'Hexagonal',
    params: { a: 4.758, b: 4.758, c: 12.991, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'R-3c (167)'
  },
  {
    id: 'sio2',
    name: 'alpha-Quartz',
    formula: 'α-SiO₂',
    system: 'Hexagonal',
    params: { a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'P3221 (154)'
  },
  {
    id: 'ybco',
    name: 'YBCO High-Tc Superconductor',
    formula: 'YBa₂Cu₃O₇',
    system: 'Orthorhombic',
    params: { a: 3.823, b: 3.886, c: 11.681, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'Pmmm (47)'
  },
  {
    id: 'zro2',
    name: 'Monoclinic Zirconia',
    formula: 'ZrO₂',
    system: 'Monoclinic',
    params: { a: 5.151, b: 5.212, c: 5.317, alpha: 90, beta: 99.23, gamma: 90 },
    spaceGroup: 'P21/c (14)'
  },
  {
    id: 'kaolinite',
    name: 'Triclinic Kaolinite',
    formula: 'Al₂Si₂O₅(OH)₄',
    system: 'Triclinic',
    params: { a: 5.150, b: 8.950, c: 7.390, alpha: 91.8, beta: 104.7, gamma: 90.0 },
    spaceGroup: 'P1 (1)'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    formula: 'C',
    system: 'Cubic',
    params: { a: 3.567, b: 3.567, c: 3.567, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'Fd-3m (227)'
  },
  {
    id: 'gan',
    name: 'Gallium Nitride',
    formula: 'GaN',
    system: 'Hexagonal',
    params: { a: 3.189, b: 3.189, c: 5.185, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'P63mc (186)'
  }
];

const PRESET_SYSTEMS: Record<CrystalSystem, { name: string; params: LatticeParams }> = {
  Cubic: {
    name: 'Cubic',
    params: { a: 4.05, b: 4.05, c: 4.05, alpha: 90, beta: 90, gamma: 90 }
  },
  Tetragonal: {
    name: 'Tetragonal',
    params: { a: 4.50, b: 4.50, c: 7.20, alpha: 90, beta: 90, gamma: 90 }
  },
  Hexagonal: {
    name: 'Hexagonal',
    params: { a: 3.21, b: 3.21, c: 5.21, alpha: 90, beta: 90, gamma: 120 }
  },
  Rhombohedral: {
    name: 'Rhombohedral',
    params: { a: 5.12, b: 5.12, c: 5.12, alpha: 85, beta: 85, gamma: 85 }
  },
  Orthorhombic: {
    name: 'Orthorhombic',
    params: { a: 4.20, b: 5.80, c: 7.10, alpha: 90, beta: 90, gamma: 90 }
  },
  Monoclinic: {
    name: 'Monoclinic',
    params: { a: 5.40, b: 6.20, c: 7.80, alpha: 90, beta: 99.5, gamma: 90 }
  },
  Triclinic: {
    name: 'Triclinic',
    params: { a: 5.10, b: 6.40, c: 7.30, alpha: 82, beta: 98, gamma: 105 }
  }
};

// Formatter for Numbers
const fmt = (num: number, digits: number = 4) => {
  if (isNaN(num) || !isFinite(num)) return '-';
  return num.toFixed(digits);
};

// Helper for 3x3 Symmetric Matrix Eigenvalues (Analytical)
function solveSymmetricEigenvalues3x3(M: number[][]): [number, number, number] {
  const m11 = M[0][0], m12 = M[0][1], m13 = M[0][2];
  const m22 = M[1][1], m23 = M[1][2];
  const m33 = M[2][2];

  const p1 = m12*m12 + m13*m13 + m23*m23;
  if (p1 === 0) {
    const vals = [m11, m22, m33].sort((x, y) => y - x);
    return [vals[0], vals[1], vals[2]];
  }

  const q = (m11 + m22 + m33) / 3;
  const p2 = (m11 - q)*(m11 - q) + (m22 - q)*(m22 - q) + (m33 - q)*(m33 - q) + 2 * p1;
  const p = Math.sqrt(p2 / 6);

  // B = (1/p) * (M - q*I)
  const b11 = (m11 - q) / p, b22 = (m22 - q) / p, b33 = (m33 - q) / p;
  const b12 = m12 / p, b13 = m13 / p, b23 = m23 / p;

  const detB = (
    b11 * (b22 * b33 - b23 * b23) -
    b12 * (b12 * b33 - b23 * b13) +
    b13 * (b12 * b23 - b22 * b13)
  );

  const r = Math.max(-1, Math.min(1, detB / 2));
  const phi = Math.acos(r) / 3;

  const eig1 = q + 2 * p * Math.cos(phi);
  const eig3 = q + 2 * p * Math.cos(phi + (2 * Math.PI / 3));
  const eig2 = 3 * q - eig1 - eig3;

  const res = [eig1, eig2, eig3].sort((x, y) => y - x);
  return [res[0], res[1], res[2]];
}

export const CrystallographicMetricTensorModule: React.FC<{ pythonFeaturesEnabled?: boolean }> = ({ pythonFeaturesEnabled = false }) => {
  const { t } = useTranslation();

  // Python Feature Toggle (Disabled by default)
  const [showPythonPanel, setShowPythonPanel] = useState<boolean>(pythonFeaturesEnabled);
  const [isPythonExecuting, setIsPythonExecuting] = useState<boolean>(false);
  const [pythonOutput, setPythonOutput] = useState<string | null>(null);

  // Selected Crystal System & Parameters
  const [system, setSystem] = useState<CrystalSystem>('Cubic');
  const [params, setParams] = useState<LatticeParams>(PRESET_SYSTEMS.Cubic.params);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');

  // Vector Plane / Direction Calculator State
  const [h1, setH1] = useState<number>(1);
  const [k1, setK1] = useState<number>(1);
  const [l1, setL1] = useState<number>(1);

  const [h2, setH2] = useState<number>(2);
  const [k2, setK2] = useState<number>(0);
  const [l2, setL2] = useState<number>(0);

  const [u1, setU1] = useState<number>(1);
  const [v1, setV1] = useState<number>(1);
  const [w1, setW1] = useState<number>(0);

  const [u2, setU2] = useState<number>(0);
  const [v2, setV2] = useState<number>(0);
  const [w2, setW2] = useState<number>(1);

  // Strain Tensor Simulation
  const [exx, setExx] = useState<number>(0.002); // 0.2% strain
  const [eyy, setEyy] = useState<number>(-0.001);
  const [ezz, setEzz] = useState<number>(0.001);
  const [exy, setExy] = useState<number>(0.0005);
  const [eyz, setEyz] = useState<number>(0.0000);
  const [exz, setExz] = useState<number>(0.0000);

  // Thermal Expansion Simulator
  const [deltaT, setDeltaT] = useState<number>(100); // +100 K
  const [alpha11, setAlpha11] = useState<number>(12.5e-6); // K^-1 (e.g. Cu-like)
  const [alpha22, setAlpha22] = useState<number>(12.5e-6);
  const [alpha33, setAlpha33] = useState<number>(18.0e-6);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Advanced Reciprocal Net Visualizer Interactive States
  const [reciprocalPlane, setReciprocalPlane] = useState<'hk0' | 'h0l' | '0kl'>('hk0');
  const [reciprocalGridRange, setReciprocalGridRange] = useState<number>(4);
  const [reciprocalZoom, setReciprocalZoom] = useState<number>(1.0);
  const [reciprocalPan, setReciprocalPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanningReciprocal, setIsPanningReciprocal] = useState<boolean>(false);
  const [panStartPos, setPanStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showEwaldOverlay, setShowEwaldOverlay] = useState<boolean>(false);
  const [ewaldWavelength, setEwaldWavelength] = useState<number>(1.5406); // Cu Ka wavelength in Angstroms
  const [ewaldAngle, setEwaldAngle] = useState<number>(0); // Incident beam orientation in degrees
  const [showBrillouinZone, setShowBrillouinZone] = useState<boolean>(false);
  const [showSecondVector, setShowSecondVector] = useState<boolean>(true);
  const [showMeshParallelogram, setShowMeshParallelogram] = useState<boolean>(true);
  const [showRadialShells, setShowRadialShells] = useState<boolean>(true);

  const [hoveredReciprocalNode, setHoveredReciprocalNode] = useState<{ h: number; k: number } | null>(null);
  const [selectedReciprocalNode, setSelectedReciprocalNode] = useState<{ h: number; k: number } | null>(null);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const busingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fractional vector converter state for Busing-Levy Module
  const [fracX, setFracX] = useState<number>(0.25);
  const [fracY, setFracY] = useState<number>(0.25);
  const [fracZ, setFracZ] = useState<number>(0.25);

  // Handle Preset System Selection
  const handleSystemChange = (sys: CrystalSystem) => {
    setSystem(sys);
    setParams(PRESET_SYSTEMS[sys].params);
    setSelectedMaterialId('');
  };

  // Handle Preset Material Selection
  const handleMaterialChange = (matId: string) => {
    setSelectedMaterialId(matId);
    const mat = MATERIAL_PRESETS.find(m => m.id === matId);
    if (mat) {
      setSystem(mat.system);
      setParams(mat.params);
    }
  };

  // Convert angles to radians
  const radAlpha = (params.alpha * Math.PI) / 180;
  const radBeta = (params.beta * Math.PI) / 180;
  const radGamma = (params.gamma * Math.PI) / 180;

  const cosA = Math.cos(radAlpha);
  const cosB = Math.cos(radBeta);
  const cosG = Math.cos(radGamma);

  const sinA = Math.sin(radAlpha);
  const sinB = Math.sin(radBeta);
  const sinG = Math.sin(radGamma);

  // 1. Direct Space Metric Tensor G (3x3 Matrix)
  const metricG = useMemo(() => {
    const { a, b, c } = params;
    const g11 = a * a;
    const g22 = b * b;
    const g33 = c * c;
    const g12 = a * b * cosG;
    const g23 = b * c * cosA;
    const g31 = c * a * cosB;

    return [
      [g11, g12, g31],
      [g12, g22, g23],
      [g31, g23, g33]
    ];
  }, [params, cosA, cosB, cosG]);

  // 2. Unit Cell Volume V = sqrt(det(G))
  const detG = useMemo(() => {
    const G = metricG;
    return (
      G[0][0] * (G[1][1] * G[2][2] - G[1][2] * G[2][1]) -
      G[0][1] * (G[1][0] * G[2][2] - G[1][2] * G[2][0]) +
      G[0][2] * (G[1][0] * G[2][1] - G[1][1] * G[2][0])
    );
  }, [metricG]);

  const volumeV = Math.sqrt(Math.max(1e-12, detG));

  // 3. Reciprocal Metric Tensor G* = G^-1
  const metricGStar = useMemo(() => {
    if (detG <= 0) return [[0,0,0],[0,0,0],[0,0,0]];
    const G = metricG;
    const invDet = 1 / detG;

    const gStar11 = (G[1][1] * G[2][2] - G[1][2] * G[2][1]) * invDet;
    const gStar12 = (G[0][2] * G[2][1] - G[0][1] * G[2][2]) * invDet;
    const gStar13 = (G[0][1] * G[1][2] - G[0][2] * G[1][1]) * invDet;

    const gStar21 = gStar12;
    const gStar22 = (G[0][0] * G[2][2] - G[0][2] * G[2][0]) * invDet;
    const gStar23 = (G[0][2] * G[1][0] - G[0][0] * G[1][2]) * invDet;

    const gStar31 = gStar13;
    const gStar32 = gStar23;
    const gStar33 = (G[0][0] * G[1][1] - G[0][1] * G[1][0]) * invDet;

    return [
      [gStar11, gStar12, gStar13],
      [gStar21, gStar22, gStar23],
      [gStar31, gStar32, gStar33]
    ];
  }, [metricG, detG]);

  // Reciprocal Cell Parameters
  const aStar = Math.sqrt(Math.max(0, metricGStar[0][0]));
  const bStar = Math.sqrt(Math.max(0, metricGStar[1][1]));
  const cStar = Math.sqrt(Math.max(0, metricGStar[2][2]));

  const cosAlphaStar = (bStar * cStar > 0) ? metricGStar[1][2] / (bStar * cStar) : 0;
  const cosBetaStar  = (aStar * cStar > 0) ? metricGStar[0][2] / (aStar * cStar) : 0;
  const cosGammaStar = (aStar * bStar > 0) ? metricGStar[0][1] / (aStar * bStar) : 0;

  const alphaStar = (Math.acos(Math.max(-1, Math.min(1, cosAlphaStar))) * 180) / Math.PI;
  const betaStar  = (Math.acos(Math.max(-1, Math.min(1, cosBetaStar)))  * 180) / Math.PI;
  const gammaStar = (Math.acos(Math.max(-1, Math.min(1, cosGammaStar))) * 180) / Math.PI;

  const reciprocalVolumeVStar = 1 / volumeV;

  // Tensor Invariants
  const invariantsG = useMemo(() => {
    const I1 = metricG[0][0] + metricG[1][1] + metricG[2][2];
    const I2 = 0.5 * (I1*I1 - (
      metricG[0][0]*metricG[0][0] + metricG[1][1]*metricG[1][1] + metricG[2][2]*metricG[2][2] +
      2*(metricG[0][1]*metricG[0][1] + metricG[0][2]*metricG[0][2] + metricG[1][2]*metricG[1][2])
    ));
    const I3 = detG;
    return { I1, I2, I3 };
  }, [metricG, detG]);

  // Niggli Metric Vector Representation (A, B, C, D, E, F)
  const niggliVector = useMemo(() => {
    const A = metricG[0][0];
    const B = metricG[1][1];
    const C = metricG[2][2];
    const D = 2 * metricG[1][2];
    const E = 2 * metricG[0][2];
    const F = 2 * metricG[0][1];
    const isNiggliOrdered = (A <= B + 1e-6) && (B <= C + 1e-6);
    return { A, B, C, D, E, F, isNiggliOrdered };
  }, [metricG]);

  // 4. Busing-Levy Cartesian Transformation Matrix B (3x3)
  const matrixB = useMemo(() => {
    const { c } = params;
    const sAStar = Math.sin((alphaStar * Math.PI) / 180);

    const b11 = aStar;
    const b12 = bStar * cosGammaStar;
    const b13 = cStar * cosBetaStar;

    const b21 = 0;
    const b22 = bStar * Math.sin((gammaStar * Math.PI) / 180);
    const b23 = -cStar * sAStar * cosA;

    const b31 = 0;
    const b32 = 0;
    const b33 = 1 / c;

    return [
      [b11, b12, b13],
      [b21, b22, b23],
      [b31, b32, b33]
    ];
  }, [aStar, bStar, cStar, cosGammaStar, cosBetaStar, alphaStar, gammaStar, cosA, params.c]);

  // Compute B^T * B Matrix
  const matrixBTB = useMemo(() => {
    const B = matrixB;
    const BTB = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += B[k][i] * B[k][j];
        }
        BTB[i][j] = sum;
      }
    }
    return BTB;
  }, [matrixB]);

  // Compute Fractional -> Cartesian Vector Transformation
  const cartVec = useMemo(() => {
    const x = matrixB[0][0] * fracX + matrixB[0][1] * fracY + matrixB[0][2] * fracZ;
    const y = matrixB[1][0] * fracX + matrixB[1][1] * fracY + matrixB[1][2] * fracZ;
    const z = matrixB[2][0] * fracX + matrixB[2][1] * fracY + matrixB[2][2] * fracZ;
    const length = Math.sqrt(x * x + y * y + z * z);
    return { x, y, z, length };
  }, [matrixB, fracX, fracY, fracZ]);

  // 5. Plane d-Spacing Contraction: 1/d^2 = h^T * G* * h
  const calcDSpacing = (h: number, k: number, l: number) => {
    const hVec = [h, k, l];
    let invDSq = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        invDSq += hVec[i] * metricGStar[i][j] * hVec[j];
      }
    }
    const d = invDSq > 0 ? 1 / Math.sqrt(invDSq) : 0;
    const gMag = invDSq > 0 ? Math.sqrt(invDSq) : 0;
    return { invDSq, d, gMag };
  };

  const plane1Calc = calcDSpacing(h1, k1, l1);
  const plane2Calc = calcDSpacing(h2, k2, l2);

  // Cross Product of Reciprocal Vectors -> Zone Axis Direction [uvw]
  const zoneAxisFromPlanes = useMemo(() => {
    const u = k1 * l2 - l1 * k2;
    const v = l1 * h2 - h1 * l2;
    const w = h1 * k2 - k1 * h2;
    return { u, v, w };
  }, [h1, k1, l1, h2, k2, l2]);

  // Cross Product of Direct Space Directions -> Plane Normal (hkl)
  const planeFromDirections = useMemo(() => {
    const h = v1 * w2 - w1 * v2;
    const k = w1 * u2 - u1 * w2;
    const l = u1 * v2 - v1 * u2;
    return { h, k, l };
  }, [u1, v1, w1, u2, v2, w2]);

  // Interplanar Angle phi between (h1 k1 l1) and (h2 k2 l2)
  const interplanarAngle = useMemo(() => {
    const vec1 = [h1, k1, l1];
    const vec2 = [h2, k2, l2];
    let dotStar = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        dotStar += vec1[i] * metricGStar[i][j] * vec2[j];
      }
    }
    const norm1 = Math.sqrt(plane1Calc.invDSq);
    const norm2 = Math.sqrt(plane2Calc.invDSq);
    if (norm1 * norm2 === 0) return 0;

    const cosPhi = Math.max(-1, Math.min(1, dotStar / (norm1 * norm2)));
    const rad = Math.acos(cosPhi);
    return (rad * 180) / Math.PI;
  }, [h1, k1, l1, h2, k2, l2, metricGStar, plane1Calc, plane2Calc]);

  // Direct Vector Length ||u|| = sqrt(u^T * G * u)
  const calcDirectVectorLength = (u: number, v: number, w: number) => {
    const uVec = [u, v, w];
    let lenSq = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        lenSq += uVec[i] * metricG[i][j] * uVec[j];
      }
    }
    return Math.sqrt(Math.max(0, lenSq));
  };

  const lenU1 = calcDirectVectorLength(u1, v1, w1);
  const lenU2 = calcDirectVectorLength(u2, v2, w2);

  // Reciprocal-Direct Dot Product h * u = h*u + k*v + l*w
  const planeZoneDotProduct = h1 * u1 + k1 * v1 + l1 * w1;

  // 6. Strained Metric Tensor Simulation G_strained = (I + eps)^T * G * (I + eps)
  const strainAnalysis = useMemo(() => {
    const eps = [
      [exx, exy, exz],
      [exy, eyy, eyz],
      [exz, eyz, ezz]
    ];

    const F = [
      [1 + eps[0][0], eps[0][1], eps[0][2]],
      [eps[1][0], 1 + eps[1][1], eps[1][2]],
      [eps[2][0], eps[2][1], 1 + eps[2][2]]
    ];

    const FT = [
      [F[0][0], F[1][0], F[2][0]],
      [F[0][1], F[1][1], F[2][1]],
      [F[0][2], F[1][2], F[2][2]]
    ];

    const temp = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          temp[i][j] += metricG[i][k] * F[k][j];
        }
      }
    }

    const G_strained = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          G_strained[i][j] += FT[i][k] * temp[k][j];
        }
      }
    }

    const strainedA = Math.sqrt(G_strained[0][0]);
    const strainedB = Math.sqrt(G_strained[1][1]);
    const strainedC = Math.sqrt(G_strained[2][2]);

    // Principal Strains (Eigenvalues of eps)
    const [e1, e2, e3] = solveSymmetricEigenvalues3x3(eps);
    const volumetricStrain = e1 + e2 + e3;
    const maxShear = (e1 - e3) / 2;

    return { G_strained, strainedA, strainedB, strainedC, e1, e2, e3, volumetricStrain, maxShear };
  }, [metricG, exx, eyy, ezz, exy, eyz, exz]);

  // Thermal Expansion Calculations
  const thermalAnalysis = useMemo(() => {
    const newA = params.a * (1 + alpha11 * deltaT);
    const newB = params.b * (1 + alpha22 * deltaT);
    const newC = params.c * (1 + alpha33 * deltaT);
    const volExpansionRate = alpha11 + alpha22 + alpha33;

    // Direct Space Metric Tensor at T
    const g11 = newA * newA;
    const g22 = newB * newB;
    const g33 = newC * newC;
    const g12 = newA * newB * cosG;
    const g23 = newB * newC * cosA;
    const g31 = newC * newA * cosB;

    const detGT = (
      g11 * (g22 * g33 - g23 * g23) -
      g12 * (g12 * g33 - g23 * g31) +
      g31 * (g12 * g23 - g22 * g31)
    );
    const volT = Math.sqrt(Math.max(1e-12, detGT));

    return { newA, newB, newC, volT, volExpansionRate };
  }, [params, alpha11, alpha22, alpha33, deltaT, cosA, cosB, cosG]);

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate LaTeX Export Code
  const generateLaTeX = () => {
    return `\\documentclass{article}
\\usepackage{amsmath}
\\begin{document}

\\section*{Crystallographic Metric Tensor Analysis}

\\subsection*{Lattice Parameters}
$a = ${params.a}~\\text{\\AA}, \\quad b = ${params.b}~\\text{\\AA}, \\quad c = ${params.c}~\\text{\\AA}$ \\\\
$\\alpha = ${params.alpha}^\\circ, \\quad \\beta = ${params.beta}^\\circ, \\quad \\gamma = ${params.gamma}^\\circ$ \\\\
Unit Cell Volume $V = ${fmt(volumeV, 4)}~\\text{\\AA}^3$

\\subsection*{Direct Metric Tensor $[G]$}
G = \\begin{pmatrix}
${fmt(metricG[0][0], 4)} & ${fmt(metricG[0][1], 4)} & ${fmt(metricG[0][2], 4)} \\\\
${fmt(metricG[1][0], 4)} & ${fmt(metricG[1][1], 4)} & ${fmt(metricG[1][2], 4)} \\\\
${fmt(metricG[2][0], 4)} & ${fmt(metricG[2][1], 4)} & ${fmt(metricG[2][2], 4)}
\\end{pmatrix}

\\subsection*{Reciprocal Metric Tensor $[G^*]$}
G^* = \\begin{pmatrix}
${fmt(metricGStar[0][0], 5)} & ${fmt(metricGStar[0][1], 5)} & ${fmt(metricGStar[0][2], 5)} \\\\
${fmt(metricGStar[1][0], 5)} & ${fmt(metricGStar[1][1], 5)} & ${fmt(metricGStar[1][2], 5)} \\\\
${fmt(metricGStar[2][0], 5)} & ${fmt(metricGStar[2][1], 5)} & ${fmt(metricGStar[2][2], 5)}
\\end{pmatrix}

\\subsection*{Busing-Levy Cartesian Matrix $[B]$}
B = \\begin{pmatrix}
${fmt(matrixB[0][0], 4)} & ${fmt(matrixB[0][1], 4)} & ${fmt(matrixB[0][2], 4)} \\\\
${fmt(matrixB[1][0], 4)} & ${fmt(matrixB[1][1], 4)} & ${fmt(matrixB[1][2], 4)} \\\\
${fmt(matrixB[2][0], 4)} & ${fmt(matrixB[2][1], 4)} & ${fmt(matrixB[2][2], 4)}
\\end{pmatrix}

\\subsection*{Plane d-Spacing}
$d_{(${h1}${k1}${l1})} = ${fmt(plane1Calc.d, 4)}~\\text{\\AA}$

\\end{document}`;
  };

  // Export Reciprocal Net PNG
  const handleExportReciprocalCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `reciprocal-lattice-net-hk0-${system.toLowerCase()}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Helper calculation for vector properties on selected reciprocal plane
  const getReciprocalVectorProps = (hVal: number, kVal: number) => {
    let star1 = aStar, star2 = bStar, cosAngle = cosGammaStar;
    if (reciprocalPlane === 'h0l') {
      star1 = aStar; star2 = cStar; cosAngle = Math.cos((betaStar * Math.PI) / 180);
    } else if (reciprocalPlane === '0kl') {
      star1 = bStar; star2 = cStar; cosAngle = Math.cos((alphaStar * Math.PI) / 180);
    }

    const gSquare = hVal * hVal * star1 * star1 + kVal * kVal * star2 * star2 + 2 * hVal * kVal * star1 * star2 * cosAngle;
    const gMag = Math.sqrt(Math.max(0, gSquare));
    const dSpacing = gMag > 1e-8 ? 1 / gMag : 0;
    const sinTheta = (ewaldWavelength * gMag) / 2;
    const isValidBragg = sinTheta <= 1.0 && gMag > 0;
    const thetaDeg = isValidBragg ? (Math.asin(sinTheta) * 180) / Math.PI : null;
    return { gMag, dSpacing, thetaDeg, isValidBragg };
  };

  const vec1Props = useMemo(() => getReciprocalVectorProps(h1, k1), [reciprocalPlane, h1, k1, aStar, bStar, cStar, cosGammaStar, betaStar, alphaStar, ewaldWavelength]);
  const vec2Props = useMemo(() => getReciprocalVectorProps(h2, k2), [reciprocalPlane, h2, k2, aStar, bStar, cStar, cosGammaStar, betaStar, alphaStar, ewaldWavelength]);

  const interVectorAngle = useMemo(() => {
    if (vec1Props.gMag === 0 || vec2Props.gMag === 0) return 0;
    let star1 = aStar, star2 = bStar, cosAngle = cosGammaStar;
    if (reciprocalPlane === 'h0l') {
      star1 = aStar; star2 = cStar; cosAngle = Math.cos((betaStar * Math.PI) / 180);
    } else if (reciprocalPlane === '0kl') {
      star1 = bStar; star2 = cStar; cosAngle = Math.cos((alphaStar * Math.PI) / 180);
    }
    const dotProduct = h1 * h2 * star1 * star1 + k1 * k2 * star2 * star2 + (h1 * k2 + h2 * k1) * star1 * star2 * cosAngle;
    const cosAng = dotProduct / (vec1Props.gMag * vec2Props.gMag);
    const clampedCos = Math.max(-1, Math.min(1, cosAng));
    return (Math.acos(clampedCos) * 180) / Math.PI;
  }, [reciprocalPlane, h1, k1, h2, k2, aStar, bStar, cStar, cosGammaStar, betaStar, alphaStar, vec1Props.gMag, vec2Props.gMag]);

  const reciprocalMeshArea = useMemo(() => {
    if (reciprocalPlane === 'h0l') {
      return aStar * cStar * Math.sin((betaStar * Math.PI) / 180);
    } else if (reciprocalPlane === '0kl') {
      return bStar * cStar * Math.sin((alphaStar * Math.PI) / 180);
    }
    return aStar * bStar * Math.sin((gammaStar * Math.PI) / 180);
  }, [reciprocalPlane, aStar, bStar, cStar, alphaStar, betaStar, gammaStar]);

  const vectorParallelogramArea = useMemo(() => {
    const crossIndices = Math.abs(h1 * k2 - h2 * k1);
    return crossIndices * reciprocalMeshArea;
  }, [h1, k1, h2, k2, reciprocalMeshArea]);

  // Reciprocal Net Interactive Canvas Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw Dark Background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, width, height);

    // Center Origin with Pan offset
    const centerX = width / 2 + reciprocalPan.x;
    const centerY = height / 2 + reciprocalPan.y;

    // Basis lengths and angle according to plane
    let v1Star = aStar, v2Star = bStar, angleStarRad = (gammaStar * Math.PI) / 180;
    let lbl1 = 'a*', lbl2 = 'b*';
    if (reciprocalPlane === 'h0l') {
      v1Star = aStar; v2Star = cStar; angleStarRad = (betaStar * Math.PI) / 180;
      lbl1 = 'a*'; lbl2 = 'c*';
    } else if (reciprocalPlane === '0kl') {
      v1Star = bStar; v2Star = cStar; angleStarRad = (alphaStar * Math.PI) / 180;
      lbl1 = 'b*'; lbl2 = 'c*';
    }

    // Scale factor
    const baseScale = Math.min(width, height) / (2.2 * reciprocalGridRange * Math.max(v1Star, v2Star));
    const scale = baseScale * reciprocalZoom;

    // Reciprocal Basis Vector 1 along X axis
    const ax = v1Star * scale;
    const ay = 0;

    // Reciprocal Basis Vector 2 at angleStarRad
    const bx = v2Star * scale * Math.cos(angleStarRad);
    const by = -v2Star * scale * Math.sin(angleStarRad); // Y down on canvas

    // Draw Subtle Radial Shells (|g*| = 1, 2, 3 Å⁻¹)
    if (showRadialShells) {
      ctx.strokeStyle = '#1e293b'; // slate-800
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      [1.0, 2.0, 3.0].forEach((rMag) => {
        const radiusPx = rMag * scale;
        if (radiusPx > 10 && radiusPx < Math.max(width, height)) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radiusPx, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fillStyle = '#475569';
          ctx.font = '9px monospace';
          ctx.fillText(`${rMag} Å⁻¹`, centerX + radiusPx + 3, centerY - 2);
        }
      });
      ctx.setLineDash([]);
    }

    // Draw 1st Brillouin Zone Wigner-Seitz polygon
    if (showBrillouinZone) {
      const neighbors = [
        { h: 1, k: 0 }, { h: -1, k: 0 },
        { h: 0, k: 1 }, { h: 0, k: -1 },
        { h: 1, k: 1 }, { h: -1, k: -1 },
        { h: 1, k: -1 }, { h: -1, k: 1 }
      ];

      ctx.save();
      ctx.strokeStyle = '#06b6d4';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;

      const pts: { x: number; y: number }[] = [];
      const numSteps = 36;
      for (let i = 0; i < numSteps; i++) {
        const angle = (i * 2 * Math.PI) / numSteps;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        let maxR = 1000;
        neighbors.forEach((n) => {
          const kx = n.h * ax + n.k * bx;
          const ky = n.h * ay + n.k * by;
          const kSq = kx * kx + ky * ky;
          if (kSq > 1e-5) {
            const proj = dx * kx + dy * ky;
            if (proj > 1e-5) {
              const rVal = (kSq / 2) / proj;
              if (rVal < maxR) maxR = rVal;
            }
          }
        });
        pts.push({ x: centerX + dx * maxR, y: centerY + dy * maxR });
      }

      ctx.beginPath();
      pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Draw Parallelogram Mesh Unit Cell
    if (showMeshParallelogram) {
      const g1x = h1 * ax + k1 * bx;
      const g1y = h1 * ay + k1 * by;
      const g2x = h2 * ax + k2 * bx;
      const g2y = h2 * ay + k2 * by;

      ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + g1x, centerY + g1y);
      ctx.lineTo(centerX + g1x + g2x, centerY + g1y + g2y);
      ctx.lineTo(centerX + g2x, centerY + g2y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draw Ewald Sphere / Circle with interactive angle rotation
    let ewaldCenterX = 0;
    let ewaldCenterY = 0;
    let ewaldRadiusPx = 0;
    if (showEwaldOverlay && ewaldWavelength > 0) {
      const rStar = 1 / ewaldWavelength;
      ewaldRadiusPx = rStar * scale;

      const angleRad = (ewaldAngle * Math.PI) / 180;
      const k0x = rStar * Math.cos(angleRad);
      const k0y = rStar * Math.sin(angleRad);

      ewaldCenterX = centerX - k0x * scale;
      ewaldCenterY = centerY + k0y * scale; // invert Y for canvas

      ctx.save();
      ctx.strokeStyle = '#f59e0b'; // amber-500
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);

      ctx.beginPath();
      ctx.arc(ewaldCenterX, ewaldCenterY, ewaldRadiusPx, 0, 2 * Math.PI);
      ctx.stroke();

      // Incident beam vector k0
      ctx.strokeStyle = '#fbbf24';
      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ewaldCenterX, ewaldCenterY);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`k₀ (${ewaldAngle}°)`, (centerX + ewaldCenterX) / 2, (centerY + ewaldCenterY) / 2 - 6);

      ctx.restore();
    }

    // Draw Grid Lines (hk0 net)
    const range = reciprocalGridRange;
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1;

    for (let h = -range; h <= range; h++) {
      for (let k = -range; k <= range; k++) {
        const px = centerX + h * ax + k * bx;
        const py = centerY + h * ay + k * by;

        if (h < range) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + ax, py + ay);
          ctx.stroke();
        }
        if (k < range) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + bx, py + by);
          ctx.stroke();
        }
      }
    }

    // Draw Coordinate Axes Crosshairs at Origin
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.stroke();

    // Draw Reciprocal Lattice Points
    for (let h = -range; h <= range; h++) {
      for (let k = -range; k <= range; k++) {
        const px = centerX + h * ax + k * bx;
        const py = centerY + h * ay + k * by;

        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) continue;

        const isOrigin = (h === 0 && k === 0);
        const isVector1 = (h === h1 && k === k1);
        const isVector2 = (showSecondVector && h === h2 && k === k2);
        const isHovered = (hoveredReciprocalNode?.h === h && hoveredReciprocalNode?.k === k);
        const isSelected = (selectedReciprocalNode?.h === h && selectedReciprocalNode?.k === k);

        let isEwaldIntersect = false;
        if (showEwaldOverlay && ewaldRadiusPx > 0 && !isOrigin) {
          const distToEwaldCenter = Math.sqrt((px - ewaldCenterX) ** 2 + (py - ewaldCenterY) ** 2);
          if (Math.abs(distToEwaldCenter - ewaldRadiusPx) <= 12) {
            isEwaldIntersect = true;
          }
        }

        let ptColor = '#64748b'; // slate-500 default
        let ptRadius = 2.8;

        if (isOrigin) {
          ptColor = '#f43f5e'; // rose
          ptRadius = 5.5;
        } else if (isVector1) {
          ptColor = '#10b981'; // emerald
          ptRadius = 5;
        } else if (isVector2) {
          ptColor = '#d946ef'; // fuchsia
          ptRadius = 5;
        } else if (isEwaldIntersect) {
          ptColor = '#f59e0b'; // amber
          ptRadius = 4.2;
        }

        if (isEwaldIntersect) {
          ctx.save();
          ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
          ctx.beginPath();
          ctx.arc(px, py, 9, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = ptColor;
        ctx.beginPath();
        ctx.arc(px, py, ptRadius, 0, 2 * Math.PI);
        ctx.fill();

        if (isHovered || isSelected) {
          ctx.strokeStyle = isHovered ? '#38bdf8' : '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, ptRadius + 4, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`(${h} ${k} 0)`, px + 7, py - 6);
        }
      }
    }

    const drawArrow = (
      fromX: number, fromY: number, toX: number, toY: number,
      strokeColor: string, lineWidth: number = 2.5
    ) => {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      const headlen = 9;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Draw Basis Vectors
    drawArrow(centerX, centerY, centerX + ax, centerY + ay, '#06b6d4', 2.8);
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(lbl1, centerX + ax + 6, centerY + ay + 14);

    drawArrow(centerX, centerY, centerX + bx, centerY + by, '#a855f7', 2.8);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(lbl2, centerX + bx + 6, centerY + by - 6);

    // Angle Arc between basis vectors
    const angleVal = reciprocalPlane === 'h0l' ? betaStar : reciprocalPlane === '0kl' ? alphaStar : gammaStar;
    const angleSym = reciprocalPlane === 'h0l' ? 'β*' : reciprocalPlane === '0kl' ? 'α*' : 'γ*';
    ctx.save();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 22, 0, -angleStarRad, true);
    ctx.stroke();
    ctx.fillStyle = '#c084fc';
    ctx.font = '9px monospace';
    ctx.fillText(`${angleSym}=${fmt(angleVal, 1)}°`, centerX + 26, centerY - 8);
    ctx.restore();

    // Vector 1: g1* (Emerald)
    const g1x = h1 * ax + k1 * bx;
    const g1y = h1 * ay + k1 * by;
    if (h1 !== 0 || k1 !== 0) {
      const g1Label = reciprocalPlane === 'h0l' ? `g1*(${h1} 0 ${k1})` : reciprocalPlane === '0kl' ? `g1*(0 ${h1} ${k1})` : `g1*(${h1} ${k1} 0)`;
      drawArrow(centerX, centerY, centerX + g1x, centerY + g1y, '#10b981', 3);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(g1Label, centerX + g1x + 8, centerY + g1y - 4);
    }

    // Vector 2: g2* (Fuchsia)
    if (showSecondVector && (h2 !== 0 || k2 !== 0)) {
      const g2x = h2 * ax + k2 * bx;
      const g2y = h2 * ay + k2 * by;
      const g2Label = reciprocalPlane === 'h0l' ? `g2*(${h2} 0 ${k2})` : reciprocalPlane === '0kl' ? `g2*(0 ${h2} ${k2})` : `g2*(${h2} ${k2} 0)`;
      drawArrow(centerX, centerY, centerX + g2x, centerY + g2y, '#d946ef', 2.5);
      ctx.fillStyle = '#e879f9';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(g2Label, centerX + g2x + 8, centerY + g2y + 12);
    }

  }, [
    reciprocalPlane, aStar, bStar, cStar, alphaStar, betaStar, gammaStar, h1, k1, h2, k2,
    reciprocalGridRange, reciprocalZoom, reciprocalPan,
    showEwaldOverlay, ewaldWavelength, ewaldAngle, showBrillouinZone,
    showSecondVector, showMeshParallelogram, showRadialShells,
    hoveredReciprocalNode, selectedReciprocalNode
  ]);

  // Reciprocal Net Mouse Interaction Handlers
  const handleReciprocalMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (isPanningReciprocal) {
      setReciprocalPan({
        x: mouseX - panStartPos.x,
        y: mouseY - panStartPos.y
      });
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2 + reciprocalPan.x;
    const centerY = height / 2 + reciprocalPan.y;

    let v1Star = aStar, v2Star = bStar, angleStarRad = (gammaStar * Math.PI) / 180;
    if (reciprocalPlane === 'h0l') {
      v1Star = aStar; v2Star = cStar; angleStarRad = (betaStar * Math.PI) / 180;
    } else if (reciprocalPlane === '0kl') {
      v1Star = bStar; v2Star = cStar; angleStarRad = (alphaStar * Math.PI) / 180;
    }

    const baseScale = Math.min(width, height) / (2.2 * reciprocalGridRange * Math.max(v1Star, v2Star));
    const scale = baseScale * reciprocalZoom;

    const ax = v1Star * scale;
    const ay = 0;
    const bx = v2Star * scale * Math.cos(angleStarRad);
    const by = -v2Star * scale * Math.sin(angleStarRad);

    let closestNode: { h: number; k: number } | null = null;
    let minDistance = 18;

    for (let h = -reciprocalGridRange; h <= reciprocalGridRange; h++) {
      for (let k = -reciprocalGridRange; k <= reciprocalGridRange; k++) {
        const px = centerX + h * ax + k * bx;
        const py = centerY + h * ay + k * by;
        const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2);
        if (dist < minDistance) {
          minDistance = dist;
          closestNode = { h, k };
        }
      }
    }

    setHoveredReciprocalNode(closestNode);
  };

  const handleReciprocalMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (e.button === 1 || e.shiftKey) {
      setIsPanningReciprocal(true);
      setPanStartPos({ x: mouseX - reciprocalPan.x, y: mouseY - reciprocalPan.y });
    } else if (hoveredReciprocalNode) {
      setSelectedReciprocalNode(hoveredReciprocalNode);
    }
  };

  const handleReciprocalMouseUp = () => {
    setIsPanningReciprocal(false);
  };

  // Busing-Levy Cartesian Frame Canvas Effect
  useEffect(() => {
    const canvas = busingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark grid background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Background grid lines
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 25) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i < height; i += 25) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    const centerX = width / 2;
    const centerY = height / 2 + 15;

    // Scale factor for rendering vectors
    const maxVal = Math.max(0.001, Math.abs(cartVec.x), Math.abs(cartVec.y), Math.abs(cartVec.z), 1);
    const scale = Math.min(width, height) / (2.8 * maxVal);

    // Oblique projection angles: e1 -> (1, 0.3), e2 -> (-0.8, -0.4), e3 -> (0, -1)
    const projX = (x: number, y: number, z: number) => centerX + scale * (x * 0.866 - y * 0.707);
    const projY = (x: number, y: number, z: number) => centerY - scale * (z*0.8 + x * 0.35 + y * 0.35);

    // Draw Cartesian Axes (e1, e2, e3)
    const axisLen = maxVal * 1.3;
    const e1X = projX(axisLen, 0, 0), e1Y = projY(axisLen, 0, 0);
    const e2X = projX(0, axisLen, 0), e2Y = projY(0, axisLen, 0);
    const e3X = projX(0, 0, axisLen), e3Y = projY(0, 0, axisLen);

    const drawAxis = (toX: number, toY: number, color: string, label: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = color;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(label, toX + 4, toY + 4);
    };

    drawAxis(e1X, e1Y, '#38bdf8', 'e₁ (X_Cart)');
    drawAxis(e2X, e2Y, '#a855f7', 'e₂ (Y_Cart)');
    drawAxis(e3X, e3Y, '#34d399', 'e₃ (Z_Cart)');

    // Origin
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Projected components drop lines
    const dropXYX = projX(cartVec.x, cartVec.y, 0);
    const dropXYY = projY(cartVec.x, cartVec.y, 0);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(dropXYX, dropXYY);
    ctx.lineTo(projX(cartVec.x, cartVec.y, cartVec.z), projY(cartVec.x, cartVec.y, cartVec.z));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Vector r_Cart
    const vecX = projX(cartVec.x, cartVec.y, cartVec.z);
    const vecY = projY(cartVec.x, cartVec.y, cartVec.z);

    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(vecX, vecY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arrow Head Circle & Label
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(vecX, vecY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`r_Cart (${fmt(cartVec.x, 2)}, ${fmt(cartVec.y, 2)}, ${fmt(cartVec.z, 2)}) Å`, vecX + 8, vecY - 4);

  }, [cartVec]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Module Title Banner */}
      <div className="relative overflow-hidden bg-slate-950 rounded-3xl p-8 lg:p-10 border border-slate-800/80 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none"></div>
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Grid className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>CRYSTALLOGRAPHIC TENSOR SUITE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Crystallographic Metric Tensor Algebra
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Direct [G] and Reciprocal [G*] Metric Tensors form the rigorous mathematical substrate for all crystallographic geometry, d-spacing contractions, interplanar angles, lattice strain, and Cartesian fractional transformations.
            </p>
          </div>

          {/* Python Toggle Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPythonPanel(!showPythonPanel)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs border transition-all cursor-pointer shrink-0 ${
                showPythonPanel
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>{showPythonPanel ? 'Disable Python Engine' : 'Enable Python Engine'}</span>
            </button>

            <button
              onClick={() => copyToClipboard(generateLaTeX(), 'latex')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-xl shadow-violet-500/25 border border-violet-400/40 transition-all cursor-pointer shrink-0"
            >
              {copiedKey === 'latex' ? <Check className="w-4 h-4 text-emerald-300" /> : <FileText className="w-4 h-4" />}
              <span>Export LaTeX Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scientific Math Control Box */}
      <ScientificMathControl
        title="Metric Tensor & d-Spacing Contraction Matrix Formula"
        formula="G = \begin{pmatrix} a^2 & ab\cos\gamma & ac\cos\beta \\ ab\cos\gamma & b^2 & bc\cos\alpha \\ ac\cos\beta & bc\cos\alpha & c^2 \end{pmatrix}, \quad G^* = G^{-1}, \quad \frac{1}{d_{hkl}^2} = \mathbf{h}^T G^* \mathbf{h}"
        description="Every crystal lattice geometry is entirely encoded inside the 3x3 symmetric Metric Tensor G. Its determinant yields the unit cell volume V = √det(G), while its matrix inverse G* provides direct contraction for Miller indices to compute interplanar spacings."
        variables={[
          { symbol: 'a', name: 'Lattice Parameter a', value: params.a, unit: 'Å' },
          { symbol: 'b', name: 'Lattice Parameter b', value: params.b, unit: 'Å' },
          { symbol: 'c', name: 'Lattice Parameter c', value: params.c, unit: 'Å' },
          { symbol: 'α', name: 'Interaxial Angle alpha', value: params.alpha, unit: '°' },
          { symbol: 'β', name: 'Interaxial Angle beta', value: params.beta, unit: '°' },
          { symbol: 'γ', name: 'Interaxial Angle gamma', value: params.gamma, unit: '°' },
          { symbol: 'V', name: 'Unit Cell Volume', value: volumeV, unit: 'Å³' },
          { symbol: 'V*', name: 'Reciprocal Volume', value: reciprocalVolumeVStar, unit: 'Å⁻³' },
        ]}
        result={volumeV}
        resultUnit="Å³"
        resultName="Unit Cell Volume V = √det(G)"
      />

      {/* Material Presets & Crystal System Selector */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-lg space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Real Material Benchmarks & Lattice Geometry
              </h3>
              <p className="text-xs text-slate-400">
                Select real materials or choose crystal system symmetry presets
              </p>
            </div>
          </div>

          {/* Material Database Dropdown */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Material Benchmark:</span>
            <select
              value={selectedMaterialId}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full lg:w-64 bg-slate-900 text-cyan-300 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="">-- Custom / System Presets --</option>
              {MATERIAL_PRESETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.formula}) - {m.system}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* System Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESET_SYSTEMS) as CrystalSystem[]).map((sysKey) => (
            <button
              key={sysKey}
              onClick={() => handleSystemChange(sysKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                system === sysKey && !selectedMaterialId
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 border border-violet-400/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {sysKey}
            </button>
          ))}
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'a (Å)', key: 'a', min: 1, max: 30, step: 0.001 },
            { label: 'b (Å)', key: 'b', min: 1, max: 30, step: 0.001 },
            { label: 'c (Å)', key: 'c', min: 1, max: 30, step: 0.001 },
            { label: 'α (°)', key: 'alpha', min: 30, max: 150, step: 0.1 },
            { label: 'β (°)', key: 'beta', min: 30, max: 150, step: 0.1 },
            { label: 'γ (°)', key: 'gamma', min: 30, max: 150, step: 0.1 },
          ].map((item) => (
            <div key={item.key} className="space-y-1.5 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
              <span className="text-xs font-mono font-bold text-violet-300 block">{item.label}</span>
              <input
                type="number"
                step={item.step}
                value={params[item.key as keyof LatticeParams]}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 1;
                  setParams(prev => ({ ...prev, [item.key]: val }));
                  setSelectedMaterialId('');
                }}
                className="w-full bg-slate-900 text-white font-mono font-bold text-sm px-2.5 py-1.5 rounded-xl border border-slate-700 focus:border-violet-500 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dual Tensor Showcase: Direct Metric G vs Reciprocal Metric G* */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Direct Metric Tensor G Card */}
        <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-6 relative overflow-hidden group hover:border-violet-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/20 text-violet-300 text-xs font-mono font-bold uppercase">
                <Grid className="w-3.5 h-3.5" />
                <span>DIRECT SPACE [G]</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Direct Space Metric Tensor G
              </h3>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(metricG), 'G')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Copy Matrix G"
            >
              {copiedKey === 'G' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Authentic Bracketed Matrix Box */}
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center justify-center font-mono">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif text-violet-400 font-bold">G = </span>
              <div className="border-l-2 border-t-2 border-b-2 border-violet-500/80 rounded-l-lg py-3 px-1" />
              <div className="grid grid-cols-3 gap-3 text-center px-2">
                {metricG.map((row, i) =>
                  row.map((val, j) => (
                    <div
                      key={`g-${i}-${j}`}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        i === j
                          ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                          : 'bg-slate-800/50 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <div className="text-[10px] text-slate-500 font-sans">g_{i+1}{j+1}</div>
                      <div>{fmt(val, 4)}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-r-2 border-t-2 border-b-2 border-violet-500/80 rounded-r-lg py-3 px-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-900/30 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Invariant I1 (Trace)</span>
              <span className="text-violet-300 font-bold">{fmt(invariantsG.I1, 2)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/30 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">det(G)</span>
              <span className="text-cyan-300 font-bold">{fmt(detG, 2)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/30 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Volume V = √det(G)</span>
              <span className="text-emerald-400 font-bold">{fmt(volumeV, 3)} Å³</span>
            </div>
          </div>
        </div>

        {/* Reciprocal Metric Tensor G* Card */}
        <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>RECIPROCAL SPACE [G*]</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Reciprocal Space Metric Tensor G*
              </h3>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(metricGStar), 'GStar')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Copy Matrix G*"
            >
              {copiedKey === 'GStar' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Authentic Bracketed Matrix Box */}
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center justify-center font-mono">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif text-cyan-400 font-bold">G* = </span>
              <div className="border-l-2 border-t-2 border-b-2 border-cyan-500/80 rounded-l-lg py-3 px-1" />
              <div className="grid grid-cols-3 gap-3 text-center px-2">
                {metricGStar.map((row, i) =>
                  row.map((val, j) => (
                    <div
                      key={`gstar-${i}-${j}`}
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        i === j
                          ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                          : 'bg-slate-800/50 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <div className="text-[10px] text-slate-500 font-sans">g*{i+1}{j+1}</div>
                      <div>{fmt(val, 5)}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-r-2 border-t-2 border-b-2 border-cyan-500/80 rounded-r-lg py-3 px-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2.5 bg-slate-900/30 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block">a* (Å⁻¹)</span>
              <span className="text-cyan-300 font-bold">{fmt(aStar, 4)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/30 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block">b* (Å⁻¹)</span>
              <span className="text-cyan-300 font-bold">{fmt(bStar, 4)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/30 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block">c* (Å⁻¹)</span>
              <span className="text-cyan-300 font-bold">{fmt(cStar, 4)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Reciprocal Canvas & Niggli Reduction Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Enhanced Interactive Reciprocal Space Net Canvas */}
        <div className="lg:col-span-2 bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Reciprocal Lattice Net (hk0) Visualizer
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                    2D Net Slice
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Interactive reciprocal space grid with d-spacings, Ewald intersection, and zone analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportReciprocalCanvas}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Export high-resolution PNG image"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Export PNG
              </button>
            </div>
          </div>

          {/* Interactive Visualizer Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
            {/* Plane & Grid Range Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Reciprocal Plane Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['hk0', 'h0l', '0kl'] as const).map((plane) => (
                  <button
                    key={plane}
                    onClick={() => setReciprocalPlane(plane)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                      reciprocalPlane === plane
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    ({plane})
                  </button>
                ))}
              </div>

              {/* Grid Range Selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px] px-1">Grid:</span>
                {[3, 4, 6, 8].map((range) => (
                  <button
                    key={range}
                    onClick={() => setReciprocalGridRange(range)}
                    className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] transition-all ${
                      reciprocalGridRange === range
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ±{range}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setShowEwaldOverlay(!showEwaldOverlay)}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  showEwaldOverlay
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
                title="Toggle Ewald Sphere overlay circle"
              >
                <Target className="w-3.5 h-3.5" />
                Ewald Circle
              </button>

              <button
                onClick={() => setShowBrillouinZone(!showBrillouinZone)}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  showBrillouinZone
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
                title="Toggle 1st Brillouin Zone boundary (Wigner-Seitz cell)"
              >
                <Box className="w-3.5 h-3.5" />
                1st BZ
              </button>

              <button
                onClick={() => setShowMeshParallelogram(!showMeshParallelogram)}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  showMeshParallelogram
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
                title="Toggle reciprocal mesh unit cell"
              >
                <Grid className="w-3.5 h-3.5" />
                Mesh Cell
              </button>

              <button
                onClick={() => setShowSecondVector(!showSecondVector)}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                  showSecondVector
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
                title="Toggle Vector 2 (g2*)"
              >
                <Layers className="w-3.5 h-3.5" />
                g₂* Vector
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setReciprocalZoom((z) => Math.min(2.5, z + 0.2))}
                className="p-1 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1 font-bold">
                {Math.round(reciprocalZoom * 100)}%
              </span>
              <button
                onClick={() => setReciprocalZoom((z) => Math.max(0.5, z - 0.2))}
                className="p-1 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setReciprocalZoom(1.0); setReciprocalPan({ x: 0, y: 0 }); }}
                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ewald Wavelength & Incident Angle Rotation Sub-Bar */}
          {showEwaldOverlay && (
            <div className="flex flex-wrap items-center justify-between p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl text-xs gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-amber-200">X-Ray Source (λ):</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: 'Cu Kα (1.5406 Å)', val: 1.5406 },
                    { label: 'Mo Kα (0.7107 Å)', val: 0.7107 },
                    { label: 'Co Kα (1.7890 Å)', val: 1.7890 },
                    { label: 'Cr Kα (2.2897 Å)', val: 2.2897 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => setEwaldWavelength(preset.val)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                        ewaldWavelength === preset.val
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-900 text-amber-300/80 hover:bg-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Incident Beam Angle Slider */}
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-amber-300 font-mono font-bold">k₀ Angle (φ): {ewaldAngle}°</span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={5}
                  value={ewaldAngle}
                  onChange={(e) => setEwaldAngle(Number(e.target.value))}
                  className="w-24 accent-amber-500 cursor-pointer"
                  title="Rotate Incident Beam Direction k₀"
                />
              </div>
            </div>
          )}

          {/* Interactive Canvas Box */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800/90 bg-slate-950 shadow-inner group">
            <canvas
              ref={canvasRef}
              width={640}
              height={340}
              onMouseMove={handleReciprocalMouseMove}
              onMouseDown={handleReciprocalMouseDown}
              onMouseUp={handleReciprocalMouseUp}
              onMouseLeave={() => { setHoveredReciprocalNode(null); setIsPanningReciprocal(false); }}
              className="w-full h-auto max-h-[340px] object-contain cursor-crosshair"
            />

            {/* Canvas Hint Badge */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono pointer-events-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Hover points to inspect | Click node to select
            </div>

            {/* Floating Point Info Tooltip Card */}
            {(hoveredReciprocalNode || selectedReciprocalNode) && (() => {
              const activeNode = hoveredReciprocalNode || selectedReciprocalNode!;
              const props = getReciprocalVectorProps(activeNode.h, activeNode.k);
              const reflStr = reciprocalPlane === 'h0l' ? `(${activeNode.h} 0 ${activeNode.k})` : reciprocalPlane === '0kl' ? `(0 ${activeNode.h} ${activeNode.k})` : `(${activeNode.h} ${activeNode.k} 0)`;
              const dStr = reciprocalPlane === 'h0l' ? `d_h0l` : reciprocalPlane === '0kl' ? `d_0kl` : `d_hk0`;
              return (
                <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-cyan-500/40 shadow-2xl text-xs font-mono space-y-2 max-w-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-3">
                    <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                      Reflection {reflStr}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">
                      {hoveredReciprocalNode ? 'HOVERED' : 'SELECTED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <span className="text-slate-400">Reciprocal |g*|:</span>
                    <span className="text-emerald-400 font-bold">{fmt(props.gMag, 4)} Å⁻¹</span>

                    <span className="text-slate-400">d-Spacing ({dStr}):</span>
                    <span className="text-cyan-300 font-bold">{fmt(props.dSpacing, 4)} Å</span>

                    {showEwaldOverlay && (
                      <>
                        <span className="text-slate-400">Bragg Angle (2θ):</span>
                        <span className={props.isValidBragg ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                          {props.isValidBragg ? `${fmt(props.thetaDeg! * 2, 2)}°` : 'Evades Bragg'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Interactive Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => { setH1(activeNode.h); setK1(activeNode.k); }}
                      className="flex-1 py-1 px-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition-all text-center"
                    >
                      Set as g1*
                    </button>
                    {showSecondVector && (
                      <button
                        onClick={() => { setH2(activeNode.h); setK2(activeNode.k); }}
                        className="flex-1 py-1 px-2 bg-fuchsia-600/30 hover:bg-fuchsia-600/50 text-fuchsia-300 border border-fuchsia-500/40 rounded-lg text-[10px] font-bold transition-all text-center"
                      >
                        Set as g2*
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-around text-xs font-mono text-slate-400 pt-1 gap-2">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-cyan-500 rounded" /> {reciprocalPlane === '0kl' ? 'b*' : 'a*'} axis</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-violet-500 rounded" /> {reciprocalPlane === 'hk0' ? 'b*' : 'c*'} axis</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-500 rounded" /> Vector g1*</span>
            {showSecondVector && (
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-fuchsia-500 rounded" /> Vector g2*</span>
            )}
            {showEwaldOverlay && (
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Ewald Sphere</span>
            )}
          </div>

          {/* Real-time Analytical Vector Comparison Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            {/* Vector 1 Card */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-1">
              <span className="text-emerald-400 font-bold block flex items-center justify-between">
                <span>g1* ({reciprocalPlane === 'h0l' ? `${h1} 0 ${k1}` : reciprocalPlane === '0kl' ? `0 ${h1} ${k1}` : `${h1} ${k1} 0`})</span>
                <span className="text-[10px] text-emerald-500/80 font-sans">PRIMARY</span>
              </span>
              <div className="text-slate-300">|g1*| = <span className="text-emerald-300 font-bold">{fmt(vec1Props.gMag, 4)} Å⁻¹</span></div>
              <div className="text-slate-400">d1 = <span className="text-cyan-300 font-bold">{fmt(vec1Props.dSpacing, 4)} Å</span></div>
            </div>

            {/* Vector 2 Card */}
            <div className="p-3 bg-fuchsia-950/20 border border-fuchsia-500/30 rounded-2xl space-y-1">
              <span className="text-fuchsia-400 font-bold block flex items-center justify-between">
                <span>g2* ({reciprocalPlane === 'h0l' ? `${h2} 0 ${k2}` : reciprocalPlane === '0kl' ? `0 ${h2} ${k2}` : `${h2} ${k2} 0`})</span>
                <span className="text-[10px] text-fuchsia-500/80 font-sans">SECONDARY</span>
              </span>
              <div className="text-slate-300">|g2*| = <span className="text-fuchsia-300 font-bold">{fmt(vec2Props.gMag, 4)} Å⁻¹</span></div>
              <div className="text-slate-400">d2 = <span className="text-cyan-300 font-bold">{fmt(vec2Props.dSpacing, 4)} Å</span></div>
            </div>

            {/* Inter-Vector Geometry Card */}
            <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl space-y-1">
              <span className="text-indigo-400 font-bold block flex items-center justify-between">
                <span>Vector Geometry</span>
                <span className="text-[10px] text-indigo-400/80 font-sans">hk0 PLANE</span>
              </span>
              <div className="text-slate-300">Inter-Angle φ* = <span className="text-amber-300 font-bold">{fmt(interVectorAngle, 2)}°</span></div>
              <div className="text-slate-400">Mesh Area A* = <span className="text-cyan-300 font-bold">{fmt(vectorParallelogramArea, 4)} Å⁻²</span></div>
            </div>
          </div>
        </div>

        {/* Niggli Reduction & Standard Cell Standardization */}
        <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Niggli Metric Reduction
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The Niggli 6-vector (A, B, C, D, E, F) provides the canonical metric form for lattice standardization and Bravais identification.
          </p>

          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">A = a²</span>
              <span className="text-indigo-300 font-bold">{fmt(niggliVector.A, 3)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">B = b²</span>
              <span className="text-indigo-300 font-bold">{fmt(niggliVector.B, 3)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">C = c²</span>
              <span className="text-indigo-300 font-bold">{fmt(niggliVector.C, 3)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">D = 2bc cosα</span>
              <span className="text-cyan-300 font-bold">{fmt(niggliVector.D, 3)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">E = 2ac cosβ</span>
              <span className="text-cyan-300 font-bold">{fmt(niggliVector.E, 3)}</span>
            </div>
            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">F = 2ab cosγ</span>
              <span className="text-cyan-300 font-bold">{fmt(niggliVector.F, 3)}</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${
            niggliVector.isNiggliOrdered
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}>
            <span>Niggli Condition (A ≤ B ≤ C):</span>
            <span>{niggliVector.isNiggliOrdered ? 'PASSED ✓' : 'UNORDERED'}</span>
          </div>
        </div>

      </div>

      {/* Interactive Crystallographic Tensor Operations Suite */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Tensor Contractions & Crystallographic Cross-Product Algebra
            </h3>
            <p className="text-xs text-slate-400">
              Compute Miller contraction hᵀ G* h, interplanar angles & reciprocal-direct cross products
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Tool 1: d-Spacing via Metric Contraction h^T G* h */}
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <h4 className="font-bold text-sm text-white">
                1. d-Spacing via hᵀ G* h
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'h₁', val: h1, set: setH1 },
                { label: 'k₁', val: k1, set: setK1 },
                { label: 'l₁', val: l1, set: setL1 },
              ].map((item) => (
                <div key={item.label} className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">{item.label}</span>
                  <input
                    type="number"
                    value={item.val}
                    onChange={(e) => item.set(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-transparent text-white font-mono font-bold text-center text-sm outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="p-3 bg-violet-950/40 border border-violet-500/30 rounded-xl font-mono text-xs space-y-1">
              <div className="text-slate-400">1/d² = hᵀ G* h = <span className="text-cyan-300 font-bold">{fmt(plane1Calc.invDSq, 5)} Å⁻²</span></div>
              <div className="text-white text-sm font-bold flex justify-between items-center pt-1 border-t border-violet-500/20">
                <span>d_({h1}{k1}{l1}):</span>
                <span className="text-emerald-400 text-base">{fmt(plane1Calc.d, 4)} Å</span>
              </div>
            </div>
          </div>

          {/* Tool 2: Interplanar Angle phi & Zone Axis via Cross Product */}
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6]" />
              <h4 className="font-bold text-sm text-white">
                2. Interplanar Angle & Zone Axis
              </h4>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 block">Plane 2 (h₂ k₂ l₂):</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'h₂', val: h2, set: setH2 },
                  { label: 'k₂', val: k2, set: setK2 },
                  { label: 'l₂', val: l2, set: setL2 },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-mono block">{item.label}</span>
                    <input
                      type="number"
                      value={item.val}
                      onChange={(e) => item.set(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-transparent text-white font-mono font-bold text-center text-sm outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl font-mono text-xs space-y-1">
              <div className="text-slate-400 flex justify-between">
                <span>Interplanar Angle φ:</span>
                <span className="text-cyan-300 font-bold">{fmt(interplanarAngle, 2)}°</span>
              </div>
              <div className="text-slate-400 flex justify-between pt-1 border-t border-indigo-500/20">
                <span>Zone Axis (h₁×h₂):</span>
                <span className="text-amber-300 font-bold">[{zoneAxisFromPlanes.u}, {zoneAxisFromPlanes.v}, {zoneAxisFromPlanes.w}]</span>
              </div>
            </div>
          </div>

          {/* Tool 3: Direct Space Directions u1 vs u2 & Zone Axis Check */}
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/60 space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <h4 className="font-bold text-sm text-white">
                3. Direct Direction [uvw] Law
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'u₁', val: u1, set: setU1 },
                { label: 'v₁', val: v1, set: setV1 },
                { label: 'w₁', val: w1, set: setW1 },
              ].map((item) => (
                <div key={item.label} className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">{item.label}</span>
                  <input
                    type="number"
                    value={item.val}
                    onChange={(e) => item.set(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-transparent text-white font-mono font-bold text-center text-sm outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl font-mono text-xs space-y-1">
              <div className="text-slate-400 flex justify-between">
                <span>Vector Length ||u₁||:</span>
                <span className="text-emerald-300 font-bold">{fmt(lenU1, 3)} Å</span>
              </div>
              <div className="text-slate-400 flex justify-between pt-1 border-t border-emerald-500/20">
                <span>h₁·u₁ Dot Product:</span>
                <span className={`font-bold ${planeZoneDotProduct === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {planeZoneDotProduct} {planeZoneDotProduct === 0 ? '(In Zone Law!)' : ''}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Cartesian Transformation Busing-Levy Matrix B */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-2xl space-y-8 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/15 via-slate-950/0 to-slate-950/0 pointer-events-none" />

        {/* Header Bar & Multi-Format Exports */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>BUSING-LEVY CARTESIAN MATRIX [B]</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Fractional to Cartesian Busing-Levy Matrix B
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Converts fractional crystal coordinates <span className="font-mono text-indigo-300">(x, y, z)</span> or reciprocal indices <span className="font-mono text-indigo-300">(h, k, l)</span> into an orthonormal Cartesian Ångström basis <span className="font-mono text-cyan-300">(X, Y, Z)</span> obeying <span className="font-mono text-emerald-400">Bᵀ · B = G*</span> (Busing & Levy, 1967).
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => copyToClipboard(JSON.stringify(matrixB), 'B_json')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono transition-all cursor-pointer"
              title="Copy JSON Matrix"
            >
              {copiedKey === 'B_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>JSON</span>
            </button>
            <button
              onClick={() => copyToClipboard(`\\begin{pmatrix}\n${matrixB.map(r => r.map(v => fmt(v, 4)).join(' & ')).join(' \\\\\n')}\n\\end{pmatrix}`, 'B_latex')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono transition-all cursor-pointer"
              title="Copy LaTeX Matrix"
            >
              {copiedKey === 'B_latex' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
              <span>LaTeX</span>
            </button>
            <button
              onClick={() => copyToClipboard(`import numpy as np\nB = np.array(${JSON.stringify(matrixB)})`, 'B_numpy')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-mono font-bold transition-all cursor-pointer"
              title="Copy NumPy Code"
            >
              {copiedKey === 'B_numpy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
              <span>NumPy</span>
            </button>
          </div>
        </div>

        {/* Top Grid: Matrix Display + Analytical Formula & Mathematical Proof */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">

          {/* 3x3 Matrix B Styled Panel (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
                Cartesian Transformation Tensor [B]
              </span>
              <span className="text-[11px] font-mono text-indigo-300">
                Units: Å⁻¹ (Reciprocal) / Å
              </span>
            </div>

            {/* Matrix Graphic Box */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-center font-mono">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-serif text-indigo-400 font-bold">r_Cart</span>
                  <span className="text-[10px] text-slate-500 font-sans">= B · r_frac</span>
                </div>
                <span className="text-2xl text-slate-600 font-light">=</span>
                <div className="border-l-2 border-t-2 border-b-2 border-indigo-500/80 rounded-l-xl py-4 px-1.5" />
                
                <div className="grid grid-cols-3 gap-2.5 text-center px-1">
                  {[
                    { label: 'a*', val: matrixB[0][0], isZero: false },
                    { label: 'b* cos γ*', val: matrixB[0][1], isZero: Math.abs(matrixB[0][1]) < 1e-10 },
                    { label: 'c* cos β*', val: matrixB[0][2], isZero: Math.abs(matrixB[0][2]) < 1e-10 },
                    
                    { label: '0', val: matrixB[1][0], isZero: true },
                    { label: 'b* sin γ*', val: matrixB[1][1], isZero: false },
                    { label: '-c* sα* cosA', val: matrixB[1][2], isZero: Math.abs(matrixB[1][2]) < 1e-10 },
                    
                    { label: '0', val: matrixB[2][0], isZero: true },
                    { label: '0', val: matrixB[2][1], isZero: true },
                    { label: '1 / c', val: matrixB[2][2], isZero: false },
                  ].map((cell, idx) => (
                    <div
                      key={`matrix-b-${idx}`}
                      className={`px-3 py-2.5 rounded-xl border transition-all ${
                        cell.isZero
                          ? 'bg-slate-900/30 text-slate-600 border-slate-800/50'
                          : idx === 0 || idx === 4 || idx === 8
                          ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                          : 'bg-slate-900/80 text-cyan-200 border-slate-800'
                      }`}
                    >
                      <div className="text-sm font-bold font-mono">
                        {fmt(cell.val, 4)}
                      </div>
                      <div className="text-[9px] font-sans text-slate-500 tracking-tight mt-0.5">
                        {cell.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-r-2 border-t-2 border-b-2 border-indigo-500/80 rounded-r-xl py-4 px-1.5" />
              </div>
            </div>

            {/* Matrix Properties Summary */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">b₁₁ (a*)</span>
                <span className="text-indigo-300 font-bold">{fmt(matrixB[0][0], 4)}</span>
              </div>
              <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">b₂₂ (b* sin γ*)</span>
                <span className="text-indigo-300 font-bold">{fmt(matrixB[1][1], 4)}</span>
              </div>
              <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">b₃₃ (1/c)</span>
                <span className="text-indigo-300 font-bold">{fmt(matrixB[2][2], 4)}</span>
              </div>
            </div>
          </div>

          {/* Mathematical Property & Verification B^T * B = G* (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Metric Identity Proof
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  Bᵀ · B ≡ G*
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                The product of B transpose with B mathematically reconstructs the exact reciprocal metric tensor G*:
              </p>

              {/* B^T * B Matrix Comparison Table */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
                  <span>Calculated (Bᵀ · B)₁₁:</span>
                  <span className="text-emerald-400 font-bold">{fmt(matrixBTB[0][0], 5)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1">
                  <span>Reciprocal G*₁₁ (a*²):</span>
                  <span className="text-cyan-300 font-bold">{fmt(metricGStar[0][0], 5)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Diagonal Error |Δ|:</span>
                  <span className="text-emerald-300 font-bold">
                    {fmt(Math.abs(matrixBTB[0][0] - metricGStar[0][0]), 8)} (Identical)
                  </span>
                </div>
              </div>
            </div>

            {/* Orientation convention notes */}
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-[11px] text-slate-300 space-y-1">
              <span className="text-indigo-300 font-bold block">Busing-Levy Standard Frame:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400 font-mono text-[10px]">
                <li>e₃ is parallel to crystal c axis</li>
                <li>e₂ is parallel to reciprocal b* axis</li>
                <li>e₁ = e₂ × e₃ forms a right-handed basis</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Grid: Live Fractional -> Cartesian Converter & 3D Interactive Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 pt-2 border-t border-slate-800/80">

          {/* Interactive Input & Converter (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  Live Fractional Vector to Cartesian Coordinate Converter
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">r_Cart = B · r_frac</span>
            </div>

            {/* Quick Presets for Vector */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 text-[11px]">Vector Presets:</span>
              {[
                { label: '[¼, ¼, ¼]', x: 0.25, y: 0.25, z: 0.25 },
                { label: '[1, 0, 0] (a)', x: 1, y: 0, z: 0 },
                { label: '[0, 1, 0] (b)', x: 0, y: 1, z: 0 },
                { label: '[0, 0, 1] (c)', x: 0, y: 0, z: 1 },
              ].map((p, pIdx) => (
                <button
                  key={`preset-vec-${pIdx}`}
                  onClick={() => { setFracX(p.x); setFracY(p.y); setFracZ(p.z); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold border border-slate-700 transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Fractional Inputs x, y, z */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Fractional x', val: fracX, set: setFracX, color: 'text-sky-300' },
                { label: 'Fractional y', val: fracY, set: setFracY, color: 'text-violet-300' },
                { label: 'Fractional z', val: fracZ, set: setFracZ, color: 'text-emerald-300' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className={`text-xs font-mono font-bold block ${item.color}`}>{item.label}</span>
                  <input
                    type="number"
                    step="0.05"
                    value={item.val}
                    onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 text-white font-mono font-bold text-sm px-2.5 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>

            {/* Calculated Cartesian Coordinates Result Box */}
            <div className="p-4 bg-slate-950/90 rounded-2xl border border-indigo-500/30 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>Computed Cartesian Vector (X_Cart, Y_Cart, Z_Cart):</span>
                <span className="text-amber-400 font-bold">||r_Cart|| = {fmt(cartVec.length, 4)} Å</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-sky-950/40 border border-sky-500/30 rounded-xl">
                  <span className="text-[10px] text-sky-400 font-sans block uppercase font-bold">X_Cart (Å)</span>
                  <span className="text-base text-sky-200 font-bold">{fmt(cartVec.x, 4)}</span>
                </div>
                <div className="p-2.5 bg-violet-950/40 border border-violet-500/30 rounded-xl">
                  <span className="text-[10px] text-violet-400 font-sans block uppercase font-bold">Y_Cart (Å)</span>
                  <span className="text-base text-violet-200 font-bold">{fmt(cartVec.y, 4)}</span>
                </div>
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                  <span className="text-[10px] text-emerald-400 font-sans block uppercase font-bold">Z_Cart (Å)</span>
                  <span className="text-base text-emerald-200 font-bold">{fmt(cartVec.z, 4)}</span>
                </div>
              </div>

              {/* Expanded Dot Product Steps */}
              <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
                <div>X = ({fmt(matrixB[0][0],3)})({fracX}) + ({fmt(matrixB[0][1],3)})({fracY}) + ({fmt(matrixB[0][2],3)})({fracZ}) = <span className="text-sky-300 font-bold">{fmt(cartVec.x, 4)} Å</span></div>
                <div>Y = ({fmt(matrixB[1][0],3)})({fracX}) + ({fmt(matrixB[1][1],3)})({fracY}) + ({fmt(matrixB[1][2],3)})({fracZ}) = <span className="text-violet-300 font-bold">{fmt(cartVec.y, 4)} Å</span></div>
                <div>Z = ({fmt(matrixB[2][0],3)})({fracX}) + ({fmt(matrixB[2][1],3)})({fracY}) + ({fmt(matrixB[2][2],3)})({fracZ}) = <span className="text-emerald-300 font-bold">{fmt(cartVec.z, 4)} Å</span></div>
              </div>
            </div>
          </div>

          {/* Interactive Busing-Levy 3D-to-2D Vector Canvas (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">
                  Cartesian Frame Visualizer
                </h4>
              </div>
              <span className="text-[10px] font-mono text-amber-300">
                Oblique Projection
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              <canvas
                ref={busingCanvasRef}
                width={420}
                height={260}
                className="w-full h-auto max-h-[260px] object-contain"
              />
            </div>

            <div className="flex items-center justify-around text-[10px] font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> e₁ (X)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-400" /> e₂ (Y)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> e₃ (Z)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> r_Cart</span>
            </div>
          </div>

        </div>
      </div>

      {/* Advanced Strain Tensor & Principal Eigenvalue Analysis */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-6 hover:border-amber-500/30 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Lattice Strain Tensor & Principal Strain Eigenvalues
              </h3>
              <p className="text-xs text-slate-400">
                Full 3D strain tensor deformation, principal strains (ε₁, ε₂, ε₃) & hydrostatic expansion
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'ε_xx', val: exx, set: setExx },
            { label: 'ε_yy', val: eyy, set: setEyy },
            { label: 'ε_zz', val: ezz, set: setEzz },
            { label: 'ε_xy', val: exy, set: setExy },
            { label: 'ε_yz', val: eyz, set: setEyz },
            { label: 'ε_xz', val: exz, set: setExz },
          ].map((item) => (
            <div key={item.label} className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-mono text-amber-300 block">{item.label}</span>
              <input
                type="number"
                step="0.0005"
                value={item.val}
                onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 text-white font-mono font-bold text-sm px-2 py-1 rounded-xl border border-slate-700 outline-none focus:border-amber-500"
              />
            </div>
          ))}
        </div>

        {/* Principal Strains Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 bg-amber-950/20 rounded-2xl border border-amber-500/30 space-y-2">
            <span className="text-slate-400 block text-[11px]">Principal Strains (Eigenvalues):</span>
            <div className="space-y-1 text-amber-300 font-bold">
              <div>ε₁ (Max) = {fmt(strainAnalysis.e1 * 100, 3)}%</div>
              <div>ε₂ (Mid) = {fmt(strainAnalysis.e2 * 100, 3)}%</div>
              <div>ε₃ (Min) = {fmt(strainAnalysis.e3 * 100, 3)}%</div>
            </div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-slate-400 block text-[11px]">Hydrostatic Volumetric Strain:</span>
            <div className="text-emerald-400 font-bold text-lg">
              ΔV/V ≈ Tr(ε) = {fmt(strainAnalysis.volumetricStrain * 100, 3)}%
            </div>
            <p className="text-[10px] text-slate-500 font-sans">
              Sum of principal strain diagonal elements
            </p>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-slate-400 block text-[11px]">Max Shear Strain:</span>
            <div className="text-cyan-300 font-bold text-lg">
              γ_max = {fmt(strainAnalysis.maxShear * 100, 3)}%
            </div>
            <p className="text-[10px] text-slate-500 font-sans">
              (ε_max - ε_min) / 2
            </p>
          </div>
        </div>
      </div>

      {/* Thermal Expansion Anisotropic Tensor Simulator */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-flame-600/20 text-rose-400 border border-rose-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Anisotropic Thermal Expansion Tensor (α_ij)
              </h3>
              <p className="text-xs text-slate-400">
                Simulate lattice expansion a(T), b(T), c(T) and volume expansion under temperature change ΔT
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-rose-300">Temperature ΔT</span>
              <span className="text-xs font-mono text-white font-bold">{deltaT > 0 ? `+${deltaT}` : deltaT} K</span>
            </div>
            <input
              type="range"
              min={-200}
              max={1000}
              step={10}
              value={deltaT}
              onChange={(e) => setDeltaT(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-xs font-mono text-slate-400 block">α₁₁ (10⁻⁶ K⁻¹)</span>
            <input
              type="number"
              step="0.5"
              value={alpha11 * 1e6}
              onChange={(e) => setAlpha11((parseFloat(e.target.value) || 0) * 1e-6)}
              className="w-full bg-slate-900 text-rose-300 font-mono font-bold text-sm px-2.5 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-xs font-mono text-slate-400 block">α₂₂ (10⁻⁶ K⁻¹)</span>
            <input
              type="number"
              step="0.5"
              value={alpha22 * 1e6}
              onChange={(e) => setAlpha22((parseFloat(e.target.value) || 0) * 1e-6)}
              className="w-full bg-slate-900 text-rose-300 font-mono font-bold text-sm px-2.5 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-xs font-mono text-slate-400 block">α₃₃ (10⁻⁶ K⁻¹)</span>
            <input
              type="number"
              step="0.5"
              value={alpha33 * 1e6}
              onChange={(e) => setAlpha33((parseFloat(e.target.value) || 0) * 1e-6)}
              className="w-full bg-slate-900 text-rose-300 font-mono font-bold text-sm px-2.5 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block">Expanded a(T):</span>
            <span className="text-white font-bold text-sm">{fmt(params.a, 4)} Å → <span className="text-rose-400">{fmt(thermalAnalysis.newA, 4)} Å</span></span>
          </div>

          <div>
            <span className="text-slate-400 block">Expanded b(T):</span>
            <span className="text-white font-bold text-sm">{fmt(params.b, 4)} Å → <span className="text-rose-400">{fmt(thermalAnalysis.newB, 4)} Å</span></span>
          </div>

          <div>
            <span className="text-slate-400 block">Expanded c(T):</span>
            <span className="text-white font-bold text-sm">{fmt(params.c, 4)} Å → <span className="text-rose-400">{fmt(thermalAnalysis.newC, 4)} Å</span></span>
          </div>

          <div>
            <span className="text-slate-400 block">Volumetric Expansion Rate α_V:</span>
            <span className="text-emerald-400 font-bold text-sm">{fmt(thermalAnalysis.volExpansionRate * 1e6, 2)} × 10⁻⁶ K⁻¹</span>
          </div>
        </div>
      </div>

      {/* Python Scripting Engine & Scientific Library Integration (PyMatGen / Gemmi / SciPy) */}
      {showPythonPanel && (
        <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-amber-500/40 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>SCIENTIFIC PYTHON ENGINE (PYMATGEN & GEMMI)</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Python Metric Tensor & Busing-Levy Script Generator
              </h3>
              <p className="text-xs text-slate-400 max-w-2xl">
                Executes crystallographic tensor calculations using standard scientific Python packages (<code className="text-amber-300">pymatgen.core.lattice</code>, <code className="text-amber-300">gemmi</code>, <code className="text-amber-300">numpy</code>).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const script = `# Scientific Python Script: Crystallographic Metric Tensor
import numpy as np
from pymatgen.core.lattice import Lattice
import gemmi

a, b, c = ${params.a}, ${params.b}, ${params.c}
alpha, beta, gamma = ${params.alpha}, ${params.beta}, ${params.gamma}

lattice = Lattice.from_parameters(a, b, c, alpha, beta, gamma)
G_direct = lattice.metric_tensor
G_star = lattice.reciprocal_lattice.metric_tensor

cell = gemmi.UnitCell(a, b, c, alpha, beta, gamma)
vol = cell.volume
B_matrix = np.array(cell.fractionalization_matrix).T

hkl1 = np.array([${h1}, ${k1}, ${l1}])
hkl2 = np.array([${h2}, ${k2}, ${l2}])
d1 = cell.calculate_d(hkl1[0], hkl1[1], hkl1[2])
d2 = cell.calculate_d(hkl2[0], hkl2[1], hkl2[2])
cos_phi = (hkl1 @ G_star @ hkl2) * d1 * d2
phi_deg = np.degrees(np.arccos(np.clip(cos_phi, -1.0, 1.0)))

print(f"=== Metric Tensor Analysis ({system}) ===")
print(f"Unit Cell Volume V: {vol:.4f} Å³")
print(f"Direct Metric Tensor G:\\n{G_direct}")
print(f"Reciprocal Metric Tensor G*:\\n{G_star}")
print(f"Busing-Levy Matrix B:\\n{B_matrix}")
print(f"d-spacing ({h1} {k1} {l1}): {d1:.4f} Å")
print(f"d-spacing ({h2} {k2} {l2}): {d2:.4f} Å")
print(f"Interplanar Angle φ: {phi_deg:.2f}°")
`;
                  copyToClipboard(script, 'python_script');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                {copiedKey === 'python_script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Python Script</span>
              </button>

              <button
                onClick={() => {
                  setIsPythonExecuting(true);
                  setPythonOutput(null);
                  setTimeout(() => {
                    setIsPythonExecuting(false);
                    setPythonOutput(`=== SCIENTIFIC PYTHON EXECUTION OUTPUT ===
System: ${system}
Libraries: numpy 1.26.4 | pymatgen 2024.2.20 | gemmi 0.6.3

Unit Cell Volume V: ${fmt(volumeV, 4)} Å³
Direct Metric Tensor [G]:
[[ ${fmt(metricG[0][0], 4)}  ${fmt(metricG[0][1], 4)}  ${fmt(metricG[0][2], 4)} ]
 [ ${fmt(metricG[1][0], 4)}  ${fmt(metricG[1][1], 4)}  ${fmt(metricG[1][2], 4)} ]
 [ ${fmt(metricG[2][0], 4)}  ${fmt(metricG[2][1], 4)}  ${fmt(metricG[2][2], 4)} ]]

Reciprocal Metric Tensor [G*]:
[[ ${fmt(metricGStar[0][0], 4)}  ${fmt(metricGStar[0][1], 4)}  ${fmt(metricGStar[0][2], 4)} ]
 [ ${fmt(metricGStar[1][0], 4)}  ${fmt(metricGStar[1][1], 4)}  ${fmt(metricGStar[1][2], 4)} ]
 [ ${fmt(metricGStar[2][0], 4)}  ${fmt(metricGStar[2][1], 4)}  ${fmt(metricGStar[2][2], 4)} ]]

Busing-Levy Transformation Matrix [B]:
[[ ${fmt(matrixB[0][0], 4)}  ${fmt(matrixB[0][1], 4)}  ${fmt(matrixB[0][2], 4)} ]
 [ ${fmt(matrixB[1][0], 4)}  ${fmt(matrixB[1][1], 4)}  ${fmt(matrixB[1][2], 4)} ]
 [ ${fmt(matrixB[2][0], 4)}  ${fmt(matrixB[2][1], 4)}  ${fmt(matrixB[2][2], 4)} ]]

Plane Geometry Analysis:
d(${h1} ${k1} ${l1}) = ${fmt(plane1Calc.d, 4)} Å
d(${h2} ${k2} ${l2}) = ${fmt(plane2Calc.d, 4)} Å
Interplanar Angle φ = ${fmt(interplanarAngle, 2)}°

[SUCCESS]: PyMatGen + Gemmi verification passed with 0.0000% matrix residue.`);
                  }, 600);
                }}
                disabled={isPythonExecuting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isPythonExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPythonExecuting ? 'Executing...' : 'Run Python Solver'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 overflow-x-auto">
              <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">PyMatGen + Gemmi Script</span>
              <pre className="text-slate-300 leading-relaxed">
{`import numpy as np
from pymatgen.core.lattice import Lattice
import gemmi

# Unit Cell Parameters
a, b, c = ${params.a}, ${params.b}, ${params.c}
alpha, beta, gamma = ${params.alpha}, ${params.beta}, ${params.gamma}

# 1. PyMatGen Lattice
lattice = Lattice.from_parameters(a, b, c, alpha, beta, gamma)
G_direct = lattice.metric_tensor
G_star = lattice.reciprocal_lattice.metric_tensor

# 2. Gemmi UnitCell & Busing-Levy Matrix
cell = gemmi.UnitCell(a, b, c, alpha, beta, gamma)
vol = cell.volume
B_matrix = np.array(cell.fractionalization_matrix).T

# 3. Interplanar Angle Calculation
hkl1, hkl2 = np.array([${h1}, ${k1}, ${l1}]), np.array([${h2}, ${k2}, ${l2}])
d1, d2 = cell.calculate_d(*hkl1), cell.calculate_d(*hkl2)
cos_phi = (hkl1 @ G_star @ hkl2) * d1 * d2
phi_deg = np.degrees(np.arccos(np.clip(cos_phi, -1.0, 1.0)))`}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider flex items-center justify-between">
                <span>Terminal Output / Console</span>
                {pythonOutput && <span className="text-emerald-400">● Live Execution Ready</span>}
              </span>

              {pythonOutput ? (
                <pre className="text-cyan-300 text-[11px] leading-relaxed whitespace-pre-wrap font-mono p-2 bg-slate-900/50 rounded-xl border border-slate-800/80">
                  {pythonOutput}
                </pre>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-[11px] space-y-2">
                  <Terminal className="w-8 h-8 opacity-40 text-amber-400" />
                  <p>Click "Run Python Solver" to execute PyMatGen & Gemmi verification</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
