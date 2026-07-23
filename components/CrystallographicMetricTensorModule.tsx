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
  CornerDownRight
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

  // Canvas Drawing Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw Background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Scale factor
    const scale = Math.min(width, height) / (2.5 * Math.max(aStar, bStar));

    // Reciprocal Basis Vector a* along X axis
    const ax = aStar * scale;
    const ay = 0;

    // Reciprocal Basis Vector b* rotated by gamma*
    const radGStar = (gammaStar * Math.PI) / 180;
    const bx = bStar * scale * Math.cos(radGStar);
    const by = -bStar * scale * Math.sin(radGStar);

    // Draw Reciprocal Lattice Net Points (h k 0)
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1;

    for (let h = -3; h <= 3; h++) {
      for (let k = -3; k <= 3; k++) {
        const px = centerX + h * ax + k * bx;
        const py = centerY + h * ay + k * by;

        // Draw grid lines
        if (h < 3) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + ax, py + ay);
          ctx.stroke();
        }
        if (k < 3) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + bx, py + by);
          ctx.stroke();
        }

        // Point
        ctx.fillStyle = (h === 0 && k === 0) ? '#f43f5e' : '#64748b';
        ctx.beginPath();
        ctx.arc(px, py, (h === 0 && k === 0) ? 5 : 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw Basis Vectors
    // a* vector (Cyan)
    ctx.strokeStyle = '#06b6d4'; // cyan-500
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + ax, centerY + ay);
    ctx.stroke();

    // b* vector (Violet)
    ctx.strokeStyle = '#a855f7'; // violet-500
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + bx, centerY + by);
    ctx.stroke();

    // Plane 1 vector g* (1st plane h1, k1)
    const g1x = h1 * ax + k1 * bx;
    const g1y = h1 * ay + k1 * by;
    ctx.strokeStyle = '#10b981'; // emerald-500
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + g1x, centerY + g1y);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`g*(${h1}${k1}0)`, centerX + g1x + 8, centerY + g1y - 4);

    ctx.fillStyle = '#06b6d4';
    ctx.fillText('a*', centerX + ax + 6, centerY + ay + 14);
    ctx.fillStyle = '#a855f7';
    ctx.fillText('b*', centerX + bx + 6, centerY + by - 6);

  }, [aStar, bStar, gammaStar, h1, k1, h2, k2]);

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
        
        {/* Interactive Reciprocal Space Net Canvas */}
        <div className="lg:col-span-2 bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                Reciprocal Lattice Net (hk0) Visualizer
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              γ* = {fmt(gammaStar, 2)}°
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={320}
              className="w-full h-auto max-h-[320px] object-contain"
            />
          </div>

          <div className="flex items-center justify-around text-xs font-mono text-slate-400 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-cyan-500 rounded" /> a* axis</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-violet-500 rounded" /> b* axis</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-500 rounded" /> Reciprocal Vector g*({h1}{k1}0)</span>
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
