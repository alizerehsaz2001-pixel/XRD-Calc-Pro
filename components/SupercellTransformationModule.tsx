import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { playSynthTone } from '../utils/sound';
import {
  Grid,
  Calculator,
  Layers,
  Box,
  Sparkles,
  Info,
  Check,
  Copy,
  ArrowRight,
  Activity,
  Compass,
  Table,
  Scale,
  Cpu,
  RefreshCw,
  FlaskConical,
  Download,
  FileText,
  Terminal,
  Play,
  ArrowRightLeft,
  Plus,
  ZoomIn,
  ZoomOut,
  Atom,
  RotateCcw,
  Trash2,
  FlipHorizontal,
  Repeat,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ScientificMathControl } from './ScientificMathControl';

export interface Matrix3x3 {
  p11: number; p12: number; p13: number;
  p21: number; p22: number; p23: number;
  p31: number; p32: number; p33: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface AtomSite {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  label: string;
}

export interface ReplicatedSupercellAtom {
  id: string;
  parentId: string;
  element: string;
  label: string;
  translation: [number, number, number];
  xWrap: number;
  yWrap: number;
  zWrap: number;
  cartX: number;
  cartY: number;
  cartZ: number;
}

export interface PresetTransformation {
  id: string;
  name: string;
  category: 'Supercells' | 'Primitive/Conventional' | 'Symmetry Subgroup';
  description: string;
  P: Matrix3x3;
  p: Vector3D;
  parentSystem: string;
}

export interface StructureTemplate {
  id: string;
  name: string;
  formula: string;
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
  sites: AtomSite[];
}

const PRESET_TRANSFORMATIONS: PresetTransformation[] = [
  {
    id: 'supercell_222',
    name: '2 × 2 × 2 Isomorphic Supercell (8×)',
    category: 'Supercells',
    description: 'Doubles all three basis vectors (det(P) = 8) for point-defect dilution, phonon dispersion, or magnetic ordering.',
    P: { p11: 2, p12: 0, p13: 0, p21: 0, p22: 2, p23: 0, p31: 0, p32: 0, p33: 2 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Cubic'
  },
  {
    id: 'perovskite_rot45',
    name: '√2 × √2 × 2 Perovskite Tilt (45°, 2×)',
    category: 'Supercells',
    description: 'Rotates ab-plane by 45° around c-axis and doubles c (det(P) = 2); standard Glazer octahedral tilt cell (e.g., Pnma SrTiO₃ / LaAlO₃).',
    P: { p11: 1, p12: 1, p13: 0, p21: -1, p22: 1, p23: 0, p31: 0, p32: 0, p33: 2 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Tetragonal'
  },
  {
    id: 'hex_sqrt3_r30',
    name: '√3 × √3 R30° Hexagonal Supercell (3×)',
    category: 'Supercells',
    description: 'Rotates hexagonal basal plane by 30° with √3 expansion (det(P) = 3); classic 2D charge-density-wave and surface adsorption cell.',
    P: { p11: 2, p12: 1, p13: 0, p21: -1, p22: 1, p23: 0, p31: 0, p32: 0, p33: 1 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Hexagonal'
  },
  {
    id: 'sqrt5_r26',
    name: '√5 × √5 R26.57° Surface Supercell (5×)',
    category: 'Supercells',
    description: 'Commensurate √5 × √5 surface reconstruction rotated by arctan(1/2) = 26.565° in the ab-plane (det(P) = 5).',
    P: { p11: 2, p12: 1, p13: 0, p21: -1, p22: 2, p23: 0, p31: 0, p32: 0, p33: 1 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Tetragonal'
  },
  {
    id: 'epitaxial_film',
    name: '3 × 3 × 1 Epitaxial Slab Supercell (9×)',
    category: 'Supercells',
    description: 'Expands in-plane ab axes 3×3 while preserving c height (det(P) = 9) for thin-film interface and surface slab modeling.',
    P: { p11: 3, p12: 0, p13: 0, p21: 0, p22: 3, p23: 0, p31: 0, p32: 0, p33: 1 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Tetragonal'
  },
  {
    id: 'fcc_prim_to_conv',
    name: 'FCC Primitive → Conventional Cubic (4×)',
    category: 'Primitive/Conventional',
    description: 'Transforms rhombohedral 60° Face-Centered Cubic primitive vectors into the 4-atom conventional F-centered cubic cell.',
    P: { p11: -1, p12: 1, p13: 1, p21: 1, p22: -1, p23: 1, p31: 1, p32: 1, p33: -1 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Cubic'
  },
  {
    id: 'fcc_conv_to_prim',
    name: 'Conventional Cubic → FCC Primitive (0.25×)',
    category: 'Primitive/Conventional',
    description: 'Reduces a 4-atom F-centered cubic cell to its minimal 1-lattice-point rhombohedral primitive cell (det(P) = 0.25).',
    P: { p11: 0, p12: 0.5, p13: 0.5, p21: 0.5, p22: 0, p23: 0.5, p31: 0.5, p32: 0.5, p33: 0 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Cubic'
  },
  {
    id: 'bcc_prim_to_conv',
    name: 'BCC Primitive → Conventional Cubic (2×)',
    category: 'Primitive/Conventional',
    description: 'Transforms Body-Centered Cubic primitive vectors into the 2-atom conventional I-centered cubic cell (det(P) = 2).',
    P: { p11: 0, p12: 1, p13: 1, p21: 1, p22: 0, p23: 1, p31: 1, p32: 1, p33: 0 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Cubic'
  },
  {
    id: 'rhomb_to_hex',
    name: 'Rhombohedral Primitive → Triple Hexagonal (3×)',
    category: 'Primitive/Conventional',
    description: 'Converts a primitive rhombohedral cell (α = β = γ) to the obverse triple hexagonal setting (det(P) = 3).',
    P: { p11: 1, p12: -1, p13: 0, p21: 0, p22: 1, p23: -1, p31: 1, p32: 1, p33: 1 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Rhombohedral'
  },
  {
    id: 'bain_bct_to_fcc',
    name: 'Bain Path: BCT → FCC (√2 × √2 × 1)',
    category: 'Symmetry Subgroup',
    description: 'Martensitic Bain correspondence transforming a body-centered tetragonal subcell into face-centered cubic axes.',
    P: { p11: 1, p12: -1, p13: 0, p21: 1, p22: 1, p23: 0, p31: 0, p32: 0, p33: 1 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Tetragonal'
  },
  {
    id: 'monoclinic_c2c_i2a',
    name: 'Monoclinic C2/c → I2/a Setting (1×)',
    category: 'Symmetry Subgroup',
    description: 'Unimodular basis change (det(P) = 1) converting C-centered monoclinic setting to I-centered setting with smaller β angle.',
    P: { p11: 1, p12: 0, p13: 1, p21: 0, p22: 1, p23: 0, p31: 0, p32: 0, p33: 1 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Monoclinic'
  },
  {
    id: 'orthorhombic_pbnm_pnma',
    name: 'Orthorhombic cab (Pbnm) → abc (Pnma) (1×)',
    category: 'Symmetry Subgroup',
    description: 'Right-handed cyclic axis permutation (a,b,c) → (b,c,a) preserving cell volume (det(P) = +1).',
    P: { p11: 0, p12: 1, p13: 0, p21: 0, p22: 0, p23: 1, p31: 1, p32: 0, p33: 0 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Orthorhombic'
  }
];

const STRUCTURE_TEMPLATES: StructureTemplate[] = [
  {
    id: 'srtio3',
    name: 'SrTiO₃ Perovskite (Pm-3m)',
    formula: 'SrTiO3',
    a: 3.905, b: 3.905, c: 3.905,
    alpha: 90, beta: 90, gamma: 90,
    sites: [
      { id: 's1', element: 'Sr', x: 0.0, y: 0.0, z: 0.0, label: 'Sr (1a)' },
      { id: 's2', element: 'Ti', x: 0.5, y: 0.5, z: 0.5, label: 'Ti (1b)' },
      { id: 's3', element: 'O', x: 0.5, y: 0.5, z: 0.0, label: 'O1 (3c)' },
      { id: 's4', element: 'O', x: 0.5, y: 0.0, z: 0.5, label: 'O2 (3c)' },
      { id: 's5', element: 'O', x: 0.0, y: 0.5, z: 0.5, label: 'O3 (3c)' }
    ]
  },
  {
    id: 'si_prim',
    name: 'Silicon Sub-Basis (Fd-3m)',
    formula: 'Si',
    a: 5.431, b: 5.431, c: 5.431,
    alpha: 90, beta: 90, gamma: 90,
    sites: [
      { id: 'si1', element: 'Si', x: 0.0, y: 0.0, z: 0.0, label: 'Si1 (Corner)' },
      { id: 'si2', element: 'Si', x: 0.25, y: 0.25, z: 0.25, label: 'Si2 (Tetrahedral)' }
    ]
  },
  {
    id: 'zno_wurtzite',
    name: 'ZnO Wurtzite (P6_3mc)',
    formula: 'ZnO',
    a: 3.250, b: 3.250, c: 5.207,
    alpha: 90, beta: 90, gamma: 120,
    sites: [
      { id: 'z1', element: 'Zn', x: 0.3333, y: 0.6667, z: 0.0, label: 'Zn1 (2b)' },
      { id: 'z2', element: 'Zn', x: 0.6667, y: 0.3333, z: 0.5, label: 'Zn2 (2b)' },
      { id: 'o1', element: 'O', x: 0.3333, y: 0.6667, z: 0.382, label: 'O1 (2b)' },
      { id: 'o2', element: 'O', x: 0.6667, y: 0.3333, z: 0.882, label: 'O2 (2b)' }
    ]
  },
  {
    id: 'fe_bcc',
    name: 'α-Fe Body-Centered Cubic (Im-3m)',
    formula: 'Fe',
    a: 2.866, b: 2.866, c: 2.866,
    alpha: 90, beta: 90, gamma: 90,
    sites: [
      { id: 'f1', element: 'Fe', x: 0.0, y: 0.0, z: 0.0, label: 'Fe1 (Corner)' },
      { id: 'f2', element: 'Fe', x: 0.5, y: 0.5, z: 0.5, label: 'Fe2 (Body Center)' }
    ]
  }
];

const fmt = (num: number, digits: number = 4) => {
  if (isNaN(num) || !isFinite(num)) return '-';
  return num.toFixed(digits);
};

function det3x3(m: Matrix3x3): number {
  return (
    m.p11 * (m.p22 * m.p33 - m.p23 * m.p32) -
    m.p12 * (m.p21 * m.p33 - m.p23 * m.p31) +
    m.p13 * (m.p21 * m.p32 - m.p22 * m.p31)
  );
}

function invert3x3(m: Matrix3x3): Matrix3x3 | null {
  const det = det3x3(m);
  if (Math.abs(det) < 1e-10) return null;
  const invDet = 1 / det;

  return {
    p11: (m.p22 * m.p33 - m.p23 * m.p32) * invDet,
    p12: (m.p13 * m.p32 - m.p12 * m.p33) * invDet,
    p13: (m.p12 * m.p23 - m.p13 * m.p22) * invDet,
    p21: (m.p23 * m.p31 - m.p21 * m.p33) * invDet,
    p22: (m.p11 * m.p33 - m.p13 * m.p31) * invDet,
    p23: (m.p13 * m.p21 - m.p11 * m.p23) * invDet,
    p31: (m.p21 * m.p32 - m.p22 * m.p31) * invDet,
    p32: (m.p12 * m.p31 - m.p11 * m.p32) * invDet,
    p33: (m.p11 * m.p22 - m.p12 * m.p21) * invDet
  };
}

function invertArray3x3(M: number[][]): number[][] | null {
  const [
    [a, b, c],
    [d, e, f],
    [g, h, i]
  ] = M;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  const inv = 1 / det;
  return [
    [A * inv, D * inv, G * inv],
    [B * inv, E * inv, H * inv],
    [C * inv, F * inv, I * inv]
  ];
}

export const SupercellTransformationModule: React.FC<{ pythonFeaturesEnabled?: boolean }> = ({
  pythonFeaturesEnabled = false
}) => {
  // Active Workspace Section Tab
  const [activeTab, setActiveTab] = useState<'visualizer' | 'tensors' | 'reciprocal' | 'atoms' | 'export'>('visualizer');
  const [showPythonPanel, setShowPythonPanel] = useState<boolean>(pythonFeaturesEnabled);
  const [isPythonExecuting, setIsPythonExecuting] = useState<boolean>(false);
  const [pythonOutput, setPythonOutput] = useState<string | null>(null);

  // Parent Lattice Parameters
  const [a, setA] = useState<number>(3.905);
  const [b, setB] = useState<number>(3.905);
  const [c, setC] = useState<number>(3.905);
  const [alpha, setAlpha] = useState<number>(90);
  const [beta, setBeta] = useState<number>(90);
  const [gamma, setGamma] = useState<number>(90);

  // Transformation Matrix P & Shift Vector p
  const [matrixP, setMatrixP] = useState<Matrix3x3>(PRESET_TRANSFORMATIONS[0].P);
  const [shiftP, setShiftP] = useState<Vector3D>({ x: 0, y: 0, z: 0 });
  const [selectedPresetId, setSelectedPresetId] = useState<string>('supercell_222');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('srtio3');

  // Miller Plane (hkl) & Zone Axis [uvw] Calculator
  const [h, setH] = useState<number>(1);
  const [k, setK] = useState<number>(1);
  const [l, setL] = useState<number>(1);
  const [u, setU] = useState<number>(1);
  const [v, setV] = useState<number>(0);
  const [w, setW] = useState<number>(0);

  // Atomic Sites List
  const [atomSites, setAtomSites] = useState<AtomSite[]>(STRUCTURE_TEMPLATES[0].sites);
  const [newAtomElem, setNewAtomElem] = useState<string>('O');
  const [newAtomX, setNewAtomX] = useState<number>(0.5);
  const [newAtomY, setNewAtomY] = useState<number>(0.5);
  const [newAtomZ, setNewAtomZ] = useState<number>(0.5);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 2D / 3D Canvas Projection States
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [projectionPlane, setProjectionPlane] = useState<'ab' | 'bc' | 'ca'>('ab');
  const [projZoom, setProjZoom] = useState<number>(1.0);
  const [projPan, setProjPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rot3D, setRot3D] = useState<{ yaw: number; pitch: number }>({ yaw: -35, pitch: 24 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showSubGrid, setShowSubGrid] = useState<boolean>(true);
  const [showAtomsProj, setShowAtomsProj] = useState<boolean>(true);
  const [showShiftVector, setShowShiftVector] = useState<boolean>(true);
  const [showVectorsProj, setShowVectorsProj] = useState<boolean>(true);

  const [hoveredProjAtom, setHoveredProjAtom] = useState<{
    elem: string;
    label: string;
    x: number;
    y: number;
    xP: number;
    yP: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Select Preset Matrix
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = PRESET_TRANSFORMATIONS.find(item => item.id === presetId);
    if (p) {
      setMatrixP({ ...p.P });
      setShiftP({ ...p.p });
      playSynthTone('tick');
    }
  };

  // Select Parent Structure Template
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = STRUCTURE_TEMPLATES.find(item => item.id === templateId);
    if (tpl) {
      setA(tpl.a);
      setB(tpl.b);
      setC(tpl.c);
      setAlpha(tpl.alpha);
      setBeta(tpl.beta);
      setGamma(tpl.gamma);
      setAtomSites(tpl.sites.map(s => ({ ...s })));
      playSynthTone('tick');
    }
  };

  // Matrix Quick Operations
  const handleTransposeP = () => {
    setMatrixP(prev => ({
      p11: prev.p11, p12: prev.p21, p13: prev.p31,
      p21: prev.p12, p22: prev.p22, p23: prev.p32,
      p31: prev.p13, p32: prev.p23, p33: prev.p33
    }));
    setSelectedPresetId('');
  };

  const handleSwapWithInverseP = () => {
    const inv = invert3x3(matrixP);
    if (inv) {
      setMatrixP({
        p11: Number(inv.p11.toFixed(4)), p12: Number(inv.p12.toFixed(4)), p13: Number(inv.p13.toFixed(4)),
        p21: Number(inv.p21.toFixed(4)), p22: Number(inv.p22.toFixed(4)), p23: Number(inv.p23.toFixed(4)),
        p31: Number(inv.p31.toFixed(4)), p32: Number(inv.p32.toFixed(4)), p33: Number(inv.p33.toFixed(4))
      });
      setSelectedPresetId('');
    }
  };

  const handleSetDiagonalSupercell = (na: number, nb: number, nc: number) => {
    setMatrixP({
      p11: na, p12: 0, p13: 0,
      p21: 0, p22: nb, p23: 0,
      p31: 0, p32: 0, p33: nc
    });
    setSelectedPresetId('');
  };

  // Convert angles to radians
  const radA = (alpha * Math.PI) / 180;
  const radB = (beta * Math.PI) / 180;
  const radG = (gamma * Math.PI) / 180;

  // Parent Cartesian Lattice Matrix M_parent (rows = a, b, c vectors in Cartesian Å)
  const parentCartesianVectors = useMemo(() => {
    const cosA = Math.cos(radA);
    const cosB = Math.cos(radB);
    const cosG = Math.cos(radG);
    const sinG = Math.max(1e-6, Math.sin(radG));

    const ax = a;
    const ay = 0;
    const az = 0;

    const bx = b * cosG;
    const by = b * sinG;
    const bz = 0;

    const cx = c * cosB;
    const cy = (c * (cosA - cosB * cosG)) / sinG;
    const cz = c * Math.sqrt(Math.max(1e-8, 1 - cosB * cosB - Math.pow((cosA - cosB * cosG) / sinG, 2)));

    return [
      [ax, ay, az],
      [bx, by, bz],
      [cx, cy, cz]
    ];
  }, [a, b, c, radA, radB, radG]);

  // Direct Parent Metric Tensor G (3x3 array)
  const parentG = useMemo(() => {
    const g11 = a * a;
    const g22 = b * b;
    const g33 = c * c;
    const g12 = a * b * Math.cos(radG);
    const g23 = b * c * Math.cos(radA);
    const g31 = c * a * Math.cos(radB);

    return [
      [g11, g12, g31],
      [g12, g22, g23],
      [g31, g23, g33]
    ];
  }, [a, b, c, radA, radB, radG]);

  // Parent Volume V = sqrt(det(G))
  const parentDetG =
    parentG[0][0] * (parentG[1][1] * parentG[2][2] - parentG[1][2] * parentG[2][1]) -
    parentG[0][1] * (parentG[1][0] * parentG[2][2] - parentG[1][2] * parentG[2][0]) +
    parentG[0][2] * (parentG[1][0] * parentG[2][1] - parentG[1][1] * parentG[2][0]);
  const parentVolume = Math.sqrt(Math.max(1e-12, parentDetG));

  // Parent Reciprocal Metric Tensor G* = G^-1
  const parentGStar = useMemo(() => invertArray3x3(parentG), [parentG]);

  // Transformation Matrix Determinant det(P) & Inverse P^-1
  const detP = det3x3(matrixP);
  const absDetP = Math.abs(detP);
  const inverseP = useMemo(() => invert3x3(matrixP), [matrixP]);

  // Transformed Cartesian Basis Vectors M_super = P * M_parent
  const superCartesianVectors = useMemo(() => {
    const P = [
      [matrixP.p11, matrixP.p12, matrixP.p13],
      [matrixP.p21, matrixP.p22, matrixP.p23],
      [matrixP.p31, matrixP.p32, matrixP.p33]
    ];
    const res = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let m = 0; m < 3; m++) {
          res[i][j] += P[i][m] * parentCartesianVectors[m][j];
        }
      }
    }
    return res;
  }, [matrixP, parentCartesianVectors]);

  // Transformed Direct Metric Tensor G' = P * G * P^T
  const transformedG = useMemo(() => {
    const P = [
      [matrixP.p11, matrixP.p12, matrixP.p13],
      [matrixP.p21, matrixP.p22, matrixP.p23],
      [matrixP.p31, matrixP.p32, matrixP.p33]
    ];
    const PT = [
      [matrixP.p11, matrixP.p21, matrixP.p31],
      [matrixP.p12, matrixP.p22, matrixP.p32],
      [matrixP.p13, matrixP.p23, matrixP.p33]
    ];

    const temp = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let m = 0; m < 3; m++) {
          temp[i][j] += parentG[i][m] * PT[m][j];
        }
      }
    }

    const GPrime = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let m = 0; m < 3; m++) {
          GPrime[i][j] += P[i][m] * temp[m][j];
        }
      }
    }
    return GPrime;
  }, [matrixP, parentG]);

  // Transformed Reciprocal Metric Tensor G'* = (G')^-1
  const transformedGStar = useMemo(() => invertArray3x3(transformedG), [transformedG]);

  // Transformed Lattice Parameters (a', b', c', alpha', beta', gamma') & Niggli check
  const transformedParams = useMemo(() => {
    const g11 = transformedG[0][0];
    const g22 = transformedG[1][1];
    const g33 = transformedG[2][2];
    const g12 = transformedG[0][1];
    const g23 = transformedG[1][2];
    const g31 = transformedG[2][0];

    const aPrime = Math.sqrt(Math.max(0, g11));
    const bPrime = Math.sqrt(Math.max(0, g22));
    const cPrime = Math.sqrt(Math.max(0, g33));

    const cosAPrime = bPrime * cPrime > 0 ? Math.max(-1, Math.min(1, g23 / (bPrime * cPrime))) : 0;
    const cosBPrime = aPrime * cPrime > 0 ? Math.max(-1, Math.min(1, g31 / (aPrime * cPrime))) : 0;
    const cosGPrime = aPrime * bPrime > 0 ? Math.max(-1, Math.min(1, g12 / (aPrime * bPrime))) : 0;

    const alphaPrime = (Math.acos(cosAPrime) * 180) / Math.PI;
    const betaPrime = (Math.acos(cosBPrime) * 180) / Math.PI;
    const gammaPrime = (Math.acos(cosGPrime) * 180) / Math.PI;

    const volumePrime = parentVolume * absDetP;

    // Reciprocal parameters a'*, b'*, c'*
    const aStarPrime = transformedGStar ? Math.sqrt(Math.max(0, transformedGStar[0][0])) : 0;
    const bStarPrime = transformedGStar ? Math.sqrt(Math.max(0, transformedGStar[1][1])) : 0;
    const cStarPrime = transformedGStar ? Math.sqrt(Math.max(0, transformedGStar[2][2])) : 0;

    // Niggli reduction conditions: g11 <= g22 <= g33 and |2*g23| <= g22, |2*g13| <= g11, |2*g12| <= g11
    const isNiggliOrdered = g11 <= g22 + 1e-4 && g22 <= g33 + 1e-4;
    const isNiggliAngles =
      Math.abs(2 * g23) <= g22 + 1e-4 &&
      Math.abs(2 * g31) <= g11 + 1e-4 &&
      Math.abs(2 * g12) <= g11 + 1e-4;
    const isNiggliReduced = isNiggliOrdered && isNiggliAngles;

    // In-plane rotation angle between a and a'
    const ax = parentCartesianVectors[0][0];
    const ay = parentCartesianVectors[0][1];
    const apx = superCartesianVectors[0][0];
    const apy = superCartesianVectors[0][1];
    const inPlaneRotDeg = (Math.atan2(apy, apx) - Math.atan2(ay, ax)) * (180 / Math.PI);

    return {
      aPrime,
      bPrime,
      cPrime,
      alphaPrime,
      betaPrime,
      gammaPrime,
      volumePrime,
      aStarPrime,
      bStarPrime,
      cStarPrime,
      isNiggliReduced,
      inPlaneRotDeg
    };
  }, [transformedG, transformedGStar, parentVolume, absDetP, parentCartesianVectors, superCartesianVectors]);

  // Miller Plane (hkl) & Zone Axis [uvw] Transformation + d-Spacing Invariance Verification
  const reciprocalAndZoneMetrics = useMemo(() => {
    // Covariant Miller indices: (h', k', l')^T = P * (h, k, l)^T
    const hPrime = matrixP.p11 * h + matrixP.p12 * k + matrixP.p13 * l;
    const kPrime = matrixP.p21 * h + matrixP.p22 * k + matrixP.p23 * l;
    const lPrime = matrixP.p31 * h + matrixP.p32 * k + matrixP.p33 * l;

    // Contravariant Zone axis [u', v', w']^T = P^-1 * [u, v, w]^T
    const uPrime = inverseP ? inverseP.p11 * u + inverseP.p12 * v + inverseP.p13 * w : 0;
    const vPrime = inverseP ? inverseP.p21 * u + inverseP.p22 * v + inverseP.p23 * w : 0;
    const wPrime = inverseP ? inverseP.p31 * u + inverseP.p32 * v + inverseP.p33 * w : 0;

    // Verify d_hkl invariance: 1/d^2 = h^T G* h = h'^T G'* h'
    let invD2Parent = 0;
    const hVec = [h, k, l];
    if (parentGStar) {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          invD2Parent += hVec[i] * parentGStar[i][j] * hVec[j];
        }
      }
    }
    const dSpacingAngstrom = invD2Parent > 1e-10 ? 1 / Math.sqrt(invD2Parent) : 0;
    const lambdaCu = 1.54056;
    const sinTh = dSpacingAngstrom > 0 ? lambdaCu / (2 * dSpacingAngstrom) : 2;
    const twoThetaCuDeg = sinTh <= 1 ? (2 * Math.asin(sinTh) * 180) / Math.PI : null;

    // Direct vector length |r_uvw|^2 = u^T G u
    const uVec = [u, v, w];
    let r2Parent = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        r2Parent += uVec[i] * parentG[i][j] * uVec[j];
      }
    }
    const zoneLengthAngstrom = Math.sqrt(Math.max(0, r2Parent));

    // Weiss Zone Law scalar product: h*u + k*v + l*w === h'*u' + k'*v' + l'*w'
    const weissScalar = h * u + k * v + l * w;

    return {
      hPrime,
      kPrime,
      lPrime,
      uPrime,
      vPrime,
      wPrime,
      dSpacingAngstrom,
      twoThetaCuDeg,
      zoneLengthAngstrom,
      weissScalar
    };
  }, [matrixP, inverseP, h, k, l, u, v, w, parentGStar, parentG]);

  // Direct 1-to-1 Fractional Coordinate Mapping for Base Sites
  const transformedAtoms = useMemo(() => {
    if (!inverseP) return [];

    return atomSites.map(atom => {
      const dx = atom.x - shiftP.x;
      const dy = atom.y - shiftP.y;
      const dz = atom.z - shiftP.z;

      const xPrime = inverseP.p11 * dx + inverseP.p12 * dy + inverseP.p13 * dz;
      const yPrime = inverseP.p21 * dx + inverseP.p22 * dy + inverseP.p23 * dz;
      const zPrime = inverseP.p31 * dx + inverseP.p32 * dy + inverseP.p33 * dz;

      const xWrap = ((xPrime % 1) + 1) % 1;
      const yWrap = ((yPrime % 1) + 1) % 1;
      const zWrap = ((zPrime % 1) + 1) % 1;

      return {
        ...atom,
        xPrime,
        yPrime,
        zPrime,
        xWrap,
        yWrap,
        zWrap
      };
    });
  }, [atomSites, shiftP, inverseP]);

  // Full Supercell Atomic Basis Replication (Generates all M * |det(P)| atoms in [0, 1)^3)
  const replicatedSupercellAtoms: ReplicatedSupercellAtom[] = useMemo(() => {
    if (!inverseP || absDetP < 1e-4) return [];

    // Bound search box for integer translations t = (n1, n2, n3)
    const maxN = Math.min(
      5,
      Math.ceil(
        Math.max(
          Math.abs(matrixP.p11) + Math.abs(matrixP.p21) + Math.abs(matrixP.p31),
          Math.abs(matrixP.p12) + Math.abs(matrixP.p22) + Math.abs(matrixP.p32),
          Math.abs(matrixP.p13) + Math.abs(matrixP.p23) + Math.abs(matrixP.p33),
          1
        )
      ) + 1
    );

    const results: ReplicatedSupercellAtom[] = [];
    const tol = 1e-3;

    const wrap01 = (v: number) => {
      let wVal = ((v % 1) + 1) % 1;
      if (Math.abs(wVal - 1) < 1e-5 || Math.abs(wVal) < 1e-5) wVal = 0;
      return wVal;
    };

    const pDist = (a1: number, b1: number) => {
      const diff = Math.abs(a1 - b1);
      return Math.min(diff, 1 - diff);
    };

    for (const site of atomSites) {
      const siteReplicas: ReplicatedSupercellAtom[] = [];
      for (let n1 = -maxN; n1 <= maxN; n1++) {
        for (let n2 = -maxN; n2 <= maxN; n2++) {
          for (let n3 = -maxN; n3 <= maxN; n3++) {
            const dx = site.x + n1 - shiftP.x;
            const dy = site.y + n2 - shiftP.y;
            const dz = site.z + n3 - shiftP.z;

            const xp = inverseP.p11 * dx + inverseP.p12 * dy + inverseP.p13 * dz;
            const yp = inverseP.p21 * dx + inverseP.p22 * dy + inverseP.p23 * dz;
            const zp = inverseP.p31 * dx + inverseP.p32 * dy + inverseP.p33 * dz;

            const xW = wrap01(xp);
            const yW = wrap01(yp);
            const zW = wrap01(zp);

            const isDuplicate = siteReplicas.some(
              ex => pDist(ex.xWrap, xW) < tol && pDist(ex.yWrap, yW) < tol && pDist(ex.zWrap, zW) < tol
            );

            if (!isDuplicate) {
              const cartX =
                xW * superCartesianVectors[0][0] +
                yW * superCartesianVectors[1][0] +
                zW * superCartesianVectors[2][0];
              const cartY =
                xW * superCartesianVectors[0][1] +
                yW * superCartesianVectors[1][1] +
                zW * superCartesianVectors[2][1];
              const cartZ =
                xW * superCartesianVectors[0][2] +
                yW * superCartesianVectors[1][2] +
                zW * superCartesianVectors[2][2];

              siteReplicas.push({
                id: `${site.id}_${n1}_${n2}_${n3}`,
                parentId: site.id,
                element: site.element,
                label: site.label,
                translation: [n1, n2, n3],
                xWrap: xW,
                yWrap: yW,
                zWrap: zW,
                cartX,
                cartY,
                cartZ
              });
            }
          }
        }
      }
      results.push(...siteReplicas);
    }

    return results;
  }, [atomSites, shiftP, inverseP, absDetP, matrixP, superCartesianVectors]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate VASP POSCAR File
  const vaspPoscarText = useMemo(() => {
    const grouped = new Map<string, ReplicatedSupercellAtom[]>();
    for (const at of replicatedSupercellAtoms) {
      const el = at.element.trim();
      if (!grouped.has(el)) grouped.set(el, []);
      grouped.get(el)!.push(at);
    }
    const elements = Array.from(grouped.keys());
    const counts = elements.map(e => grouped.get(e)!.length);

    let poscar = `Supercell_${selectedTemplateId}_det_${fmt(absDetP, 2)}\n`;
    poscar += `1.000000\n`;
    for (let i = 0; i < 3; i++) {
      poscar += `  ${superCartesianVectors[i][0].toFixed(8).padStart(14)}  ${superCartesianVectors[i][1].toFixed(8).padStart(14)}  ${superCartesianVectors[i][2].toFixed(8).padStart(14)}\n`;
    }
    poscar += `  ${elements.join('   ')}\n`;
    poscar += `  ${counts.join('   ')}\n`;
    poscar += `Direct\n`;
    for (const el of elements) {
      for (const at of grouped.get(el)!) {
        poscar += `  ${at.xWrap.toFixed(6)}  ${at.yWrap.toFixed(6)}  ${at.zWrap.toFixed(6)}   ! ${at.element} (${at.translation.join(',')})\n`;
      }
    }
    return poscar;
  }, [replicatedSupercellAtoms, superCartesianVectors, selectedTemplateId, absDetP]);

  // Generate Crystallographic CIF File
  const cifText = useMemo(() => {
    let cif = `data_transformed_supercell\n`;
    cif += `_symmetry_space_group_name_H-M    'P 1'\n`;
    cif += `_symmetry_Int_Tables_number       1\n`;
    cif += `_cell_length_a                    ${fmt(transformedParams.aPrime, 5)}\n`;
    cif += `_cell_length_b                    ${fmt(transformedParams.bPrime, 5)}\n`;
    cif += `_cell_length_c                    ${fmt(transformedParams.cPrime, 5)}\n`;
    cif += `_cell_angle_alpha                 ${fmt(transformedParams.alphaPrime, 4)}\n`;
    cif += `_cell_angle_beta                  ${fmt(transformedParams.betaPrime, 4)}\n`;
    cif += `_cell_angle_gamma                 ${fmt(transformedParams.gammaPrime, 4)}\n`;
    cif += `_cell_volume                      ${fmt(transformedParams.volumePrime, 4)}\n\n`;
    cif += `loop_\n`;
    cif += `  _atom_site_label\n`;
    cif += `  _atom_site_type_symbol\n`;
    cif += `  _atom_site_fract_x\n`;
    cif += `  _atom_site_fract_y\n`;
    cif += `  _atom_site_fract_z\n`;
    replicatedSupercellAtoms.forEach((at, idx) => {
      cif += `  ${at.element}${idx + 1}  ${at.element}  ${at.xWrap.toFixed(5)}  ${at.yWrap.toFixed(5)}  ${at.zWrap.toFixed(5)}\n`;
    });
    return cif;
  }, [transformedParams, replicatedSupercellAtoms]);

  // Generate LaTeX Export Code
  const generateLaTeX = () => {
    return `\\documentclass{article}
\\usepackage{amsmath}
\\begin{document}

\\section*{Supercell & Coordinate Transformation Matrix Report}

\\subsection*{Parent Unit Cell}
$a = ${a}~\\text{\\AA}, \\quad b = ${b}~\\text{\\AA}, \\quad c = ${c}~\\text{\\AA}$ \\\\
$\\alpha = ${alpha}^\\circ, \\quad \\beta = ${beta}^\\circ, \\quad \\gamma = ${gamma}^\\circ, \\quad V = ${fmt(parentVolume, 4)}~\\text{\\AA}^3$

\\subsection*{Transformation Matrix $[\\mathbf{P}]$ and Shift Vector $[\\mathbf{p}]$}
\\[
\\mathbf{P} = \\begin{pmatrix}
${matrixP.p11} & ${matrixP.p12} & ${matrixP.p13} \\\\
${matrixP.p21} & ${matrixP.p22} & ${matrixP.p23} \\\\
${matrixP.p31} & ${matrixP.p32} & ${matrixP.p33}
\\end{pmatrix}, \\quad \\mathbf{p} = \\begin{pmatrix}${shiftP.x}\\\\${shiftP.y}\\\\${shiftP.z}\\end{pmatrix}, \\quad \\det(\\mathbf{P}) = ${fmt(detP, 4)}
\\]

\\subsection*{Transformed Supercell Parameters}
$a' = ${fmt(transformedParams.aPrime, 4)}~\\text{\\AA}, \\quad b' = ${fmt(transformedParams.bPrime, 4)}~\\text{\\AA}, \\quad c' = ${fmt(transformedParams.cPrime, 4)}~\\text{\\AA}$ \\\\
$\\alpha' = ${fmt(transformedParams.alphaPrime, 2)}^\\circ, \\quad \\beta' = ${fmt(transformedParams.betaPrime, 2)}^\\circ, \\quad \\gamma' = ${fmt(transformedParams.gammaPrime, 2)}^\\circ, \\quad V' = ${fmt(transformedParams.volumePrime, 4)}~\\text{\\AA}^3$

\\subsection*{Covariant Miller Plane \\& Contravariant Zone Axis Mapping}
$(hkl) = (${h}, ${k}, ${l}) \\longrightarrow (h'k'l') = (${fmt(reciprocalAndZoneMetrics.hPrime, 2)}, ${fmt(reciprocalAndZoneMetrics.kPrime, 2)}, ${fmt(reciprocalAndZoneMetrics.lPrime, 2)}), \\quad d = ${fmt(reciprocalAndZoneMetrics.dSpacingAngstrom, 4)}~\\text{\\AA}$ \\\\
$[uvw] = [${u}, ${v}, ${w}] \\longrightarrow [u'v'w'] = [${fmt(reciprocalAndZoneMetrics.uPrime, 3)}, ${fmt(reciprocalAndZoneMetrics.vPrime, 3)}, ${fmt(reciprocalAndZoneMetrics.wPrime, 3)}]$

\\end{document}`;
  };

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportProjectionCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `supercell-${viewMode}-${projectionPlane}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Planar metrics calculations for current projection plane
  const planarProps = useMemo(() => {
    if (projectionPlane === 'bc') {
      const area = b * c * Math.sin(radA);
      const det = Math.abs(matrixP.p22 * matrixP.p33 - matrixP.p23 * matrixP.p32);
      return {
        name: 'bc-Plane',
        v1Label: 'b', v2Label: 'c',
        v1PrimeLabel: "b'", v2PrimeLabel: "c'",
        parentArea: area,
        det2D: det,
        transformedArea: area * (det > 0 ? det : absDetP)
      };
    } else if (projectionPlane === 'ca') {
      const area = c * a * Math.sin(radB);
      const det = Math.abs(matrixP.p33 * matrixP.p11 - matrixP.p31 * matrixP.p13);
      return {
        name: 'ca-Plane',
        v1Label: 'c', v2Label: 'a',
        v1PrimeLabel: "c'", v2PrimeLabel: "a'",
        parentArea: area,
        det2D: det,
        transformedArea: area * (det > 0 ? det : absDetP)
      };
    } else {
      const area = a * b * Math.sin(radG);
      const det = Math.abs(matrixP.p11 * matrixP.p22 - matrixP.p12 * matrixP.p21);
      return {
        name: 'ab-Plane',
        v1Label: 'a', v2Label: 'b',
        v1PrimeLabel: "a'", v2PrimeLabel: "b'",
        parentArea: area,
        det2D: det,
        transformedArea: area * (det > 0 ? det : absDetP)
      };
    }
  }, [projectionPlane, a, b, c, radA, radB, radG, matrixP, absDetP]);

  // Canvas Drawing Effect supporting both 2D Planar Projection AND 3D Interactive Wireframe + Replicated Atoms
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 24) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i < height; i += 24) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    const getElemColor = (elem: string) => {
      const e = (elem || '').trim().toUpperCase();
      if (e.startsWith('SR')) return '#38bdf8';
      if (e.startsWith('TI')) return '#818cf8';
      if (e.startsWith('SI')) return '#10b981';
      if (e.startsWith('O')) return '#f43f5e';
      if (e.startsWith('FE')) return '#f59e0b';
      if (e.startsWith('ZN')) return '#a855f7';
      return '#22d3ee';
    };

    if (viewMode === '3d') {
      // 3D Orthographic Projection of Parent Cell & Supercell Parallelepipeds + Replicated Atoms
      const yawRad = (rot3D.yaw * Math.PI) / 180;
      const pitchRad = (rot3D.pitch * Math.PI) / 180;
      const cosY = Math.cos(yawRad), sinY = Math.sin(yawRad);
      const cosP = Math.cos(pitchRad), sinP = Math.sin(pitchRad);

      const rotate3D = (pt: [number, number, number]) => {
        const [x, y, z] = pt;
        // Rotate around Z (yaw), then X (pitch)
        const x1 = x * cosY - y * sinY;
        const y1 = x * sinY + y * cosY;
        const z1 = z;

        const x2 = x1;
        const y2 = y1 * sinP - z1 * cosP;
        const depth = y1 * cosP + z1 * sinP;
        return { x: x2, y: y2, depth };
      };

      const pA = parentCartesianVectors[0] as [number, number, number];
      const pB = parentCartesianVectors[1] as [number, number, number];
      const pC = parentCartesianVectors[2] as [number, number, number];

      const sA = superCartesianVectors[0] as [number, number, number];
      const sB = superCartesianVectors[1] as [number, number, number];
      const sC = superCartesianVectors[2] as [number, number, number];

      const shiftCart: [number, number, number] = [
        shiftP.x * pA[0] + shiftP.y * pB[0] + shiftP.z * pC[0],
        shiftP.x * pA[1] + shiftP.y * pB[1] + shiftP.z * pC[1],
        shiftP.x * pA[2] + shiftP.y * pB[2] + shiftP.z * pC[2]
      ];

      const getBoxVertices = (
        v1: [number, number, number],
        v2: [number, number, number],
        v3: [number, number, number],
        orig: [number, number, number]
      ): [number, number, number][] => {
        const verts: [number, number, number][] = [];
        for (let i = 0; i <= 1; i++) {
          for (let j = 0; j <= 1; j++) {
            for (let m = 0; m <= 1; m++) {
              verts.push([
                orig[0] + i * v1[0] + j * v2[0] + m * v3[0],
                orig[1] + i * v1[1] + j * v2[1] + m * v3[1],
                orig[2] + i * v1[2] + j * v2[2] + m * v3[2]
              ]);
            }
          }
        }
        return verts;
      };

      const parentVerts = getBoxVertices(pA, pB, pC, [0, 0, 0]);
      const superVerts = getBoxVertices(sA, sB, sC, shiftCart);
      const allProjected = [...parentVerts, ...superVerts].map(rotate3D);

      const minX = Math.min(...allProjected.map(p => p.x));
      const maxX = Math.max(...allProjected.map(p => p.x));
      const minY = Math.min(...allProjected.map(p => p.y));
      const maxY = Math.max(...allProjected.map(p => p.y));

      const pad = 42;
      const baseScale = Math.min(
        (width - pad * 2) / Math.max(1, maxX - minX),
        (height - pad * 2) / Math.max(1, maxY - minY)
      );
      const scale = baseScale * projZoom;
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      const toScreen = (pt: [number, number, number]) => {
        const r = rotate3D(pt);
        return {
          x: width / 2 + (r.x - midX) * scale + projPan.x,
          y: height / 2 + (r.y - midY) * scale + projPan.y,
          depth: r.depth
        };
      };

      const edges = [
        [0, 1], [0, 2], [0, 4],
        [1, 3], [1, 5], [2, 3],
        [2, 6], [3, 7], [4, 5],
        [4, 6], [5, 7], [6, 7]
      ];

      // Draw Parent Unit Cell Box (dashed blue)
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      for (const [e1, e2] of edges) {
        const s1 = toScreen(parentVerts[e1]);
        const s2 = toScreen(parentVerts[e2]);
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
      }
      ctx.restore();

      // Draw Supercell Box (solid cyan)
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.2;
      for (const [e1, e2] of edges) {
        const s1 = toScreen(superVerts[e1]);
        const s2 = toScreen(superVerts[e2]);
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
      }
      ctx.restore();

      // Draw Basis Vector Labels for Supercell
      if (showVectorsProj) {
        const oS = toScreen(shiftCart);
        const aS = toScreen(superVerts[4]); // i=1,j=0,m=0
        const bS = toScreen(superVerts[2]); // i=0,j=1,m=0
        const cS = toScreen(superVerts[1]); // i=0,j=0,m=1
        ctx.save();
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#22d3ee';
        ctx.fillText("a'", aS.x + 6, aS.y - 4);
        ctx.fillText("b'", bS.x + 6, bS.y - 4);
        ctx.fillText("c'", cS.x + 6, cS.y - 4);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(oS.x, oS.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Replicated Supercell Atoms sorted by depth
      if (showAtomsProj && replicatedSupercellAtoms.length > 0) {
        const projectedAtoms = replicatedSupercellAtoms
          .map(at => {
            const scr = toScreen([
              shiftCart[0] + at.cartX,
              shiftCart[1] + at.cartY,
              shiftCart[2] + at.cartZ
            ]);
            return { ...at, scr };
          })
          .sort((u1, u2) => u1.scr.depth - u2.scr.depth);

        for (const at of projectedAtoms) {
          ctx.save();
          ctx.fillStyle = getElemColor(at.element);
          ctx.beginPath();
          ctx.arc(at.scr.x, at.scr.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }
      return;
    }

    // 2D Planar Projection Mode
    let len1 = a, len2 = b, angleRad = radG;
    let m11 = matrixP.p11, m12 = matrixP.p12, m21 = matrixP.p21, m22 = matrixP.p22;
    let sX = shiftP.x, sY = shiftP.y;
    let lbl1 = 'a', lbl2 = 'b', lbl1P = "a'", lbl2P = "b'";
    let getSiteCoords = (site: { x: number; y: number; z: number }) => ({ x: site.x, y: site.y });

    if (projectionPlane === 'bc') {
      len1 = b; len2 = c; angleRad = radA;
      m11 = matrixP.p22; m12 = matrixP.p23; m21 = matrixP.p32; m22 = matrixP.p33;
      sX = shiftP.y; sY = shiftP.z;
      lbl1 = 'b'; lbl2 = 'c'; lbl1P = "b'"; lbl2P = "c'";
      getSiteCoords = (site) => ({ x: site.y, y: site.z });
    } else if (projectionPlane === 'ca') {
      len1 = c; len2 = a; angleRad = radB;
      m11 = matrixP.p33; m12 = matrixP.p31; m21 = matrixP.p13; m22 = matrixP.p11;
      sX = shiftP.z; sY = shiftP.x;
      lbl1 = 'c'; lbl2 = 'a'; lbl1P = "c'"; lbl2P = "a'";
      getSiteCoords = (site) => ({ x: site.z, y: site.x });
    }

    const ax = len1;
    const ay = 0;
    const bx = len2 * Math.cos(angleRad);
    const by = len2 * Math.sin(angleRad);

    const aPrimeX = m11 * ax + m12 * bx;
    const aPrimeY = m11 * ay + m12 * by;
    const bPrimeX = m21 * ax + m22 * bx;
    const bPrimeY = m21 * ay + m22 * by;

    const shiftX = sX * ax + sY * bx;
    const shiftY = sX * ay + sY * by;

    const parentCorners = [
      { x: 0, y: 0 },
      { x: ax, y: ay },
      { x: ax + bx, y: ay + by },
      { x: bx, y: by }
    ];

    const supercellCorners = [
      { x: shiftX, y: shiftY },
      { x: shiftX + aPrimeX, y: shiftY + aPrimeY },
      { x: shiftX + aPrimeX + bPrimeX, y: shiftY + aPrimeY + bPrimeY },
      { x: shiftX + bPrimeX, y: shiftY + bPrimeY }
    ];

    const allCorners = [...parentCorners, ...supercellCorners];
    const minX = Math.min(...allCorners.map((p) => p.x));
    const maxX = Math.max(...allCorners.map((p) => p.x));
    const minY = Math.min(...allCorners.map((p) => p.y));
    const maxY = Math.max(...allCorners.map((p) => p.y));

    const rangeX = Math.max(1, maxX - minX);
    const rangeY = Math.max(1, maxY - minY);

    const pad = 40;
    const baseScale = Math.min((width - pad * 2) / rangeX, (height - pad * 2) / rangeY);
    const scale = baseScale * projZoom;

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const centerX = width / 2 - midX * scale + projPan.x;
    const centerY = height / 2 + midY * scale + projPan.y;

    const toCanvas = (x: number, y: number) => ({
      x: centerX + x * scale,
      y: centerY - y * scale
    });

    if (showSubGrid) {
      const minI = Math.max(-8, Math.floor(minX / Math.max(1, ax)) - 1);
      const maxI = Math.min(8, Math.ceil(maxX / Math.max(1, ax)) + 1);
      const minJ = Math.max(-8, Math.floor(minY / Math.max(1, by)) - 1);
      const maxJ = Math.min(8, Math.ceil(maxY / Math.max(1, by)) + 1);

      ctx.save();
      ctx.strokeStyle = '#1e293b';
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 1;

      for (let i = minI; i <= maxI; i++) {
        for (let j = minJ; j <= maxJ; j++) {
          const originSub = { x: i * ax + j * bx, y: i * ay + j * by };
          const p0 = toCanvas(originSub.x, originSub.y);
          const p1 = toCanvas(originSub.x + ax, originSub.y + ay);
          const p2 = toCanvas(originSub.x + ax + bx, originSub.y + ay + by);
          const p3 = toCanvas(originSub.x + bx, originSub.y + by);

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    const sc0 = toCanvas(shiftX, shiftY);
    const sc1 = toCanvas(shiftX + aPrimeX, shiftY + aPrimeY);
    const sc2 = toCanvas(shiftX + aPrimeX + bPrimeX, shiftY + aPrimeY + bPrimeY);
    const sc3 = toCanvas(shiftX + bPrimeX, shiftY + bPrimeY);

    ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
    ctx.beginPath();
    ctx.moveTo(sc0.x, sc0.y);
    ctx.lineTo(sc1.x, sc1.y);
    ctx.lineTo(sc2.x, sc2.y);
    ctx.lineTo(sc3.x, sc3.y);
    ctx.closePath();
    ctx.fill();

    ctx.setLineDash([]);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const pc0 = toCanvas(0, 0);
    const pc1 = toCanvas(ax, ay);
    const pc2 = toCanvas(ax + bx, ay + by);
    const pc3 = toCanvas(bx, by);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.beginPath();
    ctx.moveTo(pc0.x, pc0.y);
    ctx.lineTo(pc1.x, pc1.y);
    ctx.lineTo(pc2.x, pc2.y);
    ctx.lineTo(pc3.x, pc3.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (showShiftVector && (sX !== 0 || sY !== 0)) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pc0.x, pc0.y);
      ctx.lineTo(sc0.x, sc0.y);
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`p(${sX}, ${sY})`, (pc0.x + sc0.x) / 2 + 6, (pc0.y + sc0.y) / 2 - 6);
      ctx.restore();
    }

    const drawArrow = (
      fromX: number, fromY: number, toX: number, toY: number,
      strokeColor: string, label: string, isThick: boolean = false
    ) => {
      const pFrom = toCanvas(fromX, fromY);
      const pTo = toCanvas(toX, toY);
      const dx = pTo.x - pFrom.x;
      const dy = pTo.y - pFrom.y;
      const angle = Math.atan2(dy, dx);
      const headlen = 10;

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isThick ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(pFrom.x, pFrom.y);
      ctx.lineTo(pTo.x, pTo.y);
      ctx.stroke();

      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(pTo.x, pTo.y);
      ctx.lineTo(pTo.x - headlen * Math.cos(angle - Math.PI / 6), pTo.y - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(pTo.x - headlen * Math.cos(angle + Math.PI / 6), pTo.y - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      if (showVectorsProj) {
        ctx.font = 'bold 12px monospace';
        ctx.fillText(label, pTo.x + 8, pTo.y - 4);
      }
      ctx.restore();
    };

    drawArrow(0, 0, ax, ay, '#3b82f6', lbl1);
    drawArrow(0, 0, bx, by, '#3b82f6', lbl2);
    drawArrow(shiftX, shiftY, shiftX + aPrimeX, shiftY + aPrimeY, '#22d3ee', lbl1P, true);
    drawArrow(shiftX, shiftY, shiftX + bPrimeX, shiftY + bPrimeY, '#22d3ee', lbl2P, true);

    if (showAtomsProj && atomSites.length > 0) {
      const rangeI = Math.ceil(Math.abs(m11) + Math.abs(m12)) + 1;
      const rangeJ = Math.ceil(Math.abs(m21) + Math.abs(m22)) + 1;

      for (let i = -1; i <= rangeI; i++) {
        for (let j = -1; j <= rangeJ; j++) {
          atomSites.forEach((site) => {
            const sc = getSiteCoords(site);
            const realX = (i + sc.x) * ax + (j + sc.y) * bx;
            const realY = (i + sc.x) * ay + (j + sc.y) * by;
            const pCanvas = toCanvas(realX, realY);

            if (pCanvas.x < -10 || pCanvas.x > width + 10 || pCanvas.y < -10 || pCanvas.y > height + 10) return;

            const elemColor = getElemColor(site.element);
            const isMainCell = i === 0 && j === 0;

            ctx.save();
            ctx.fillStyle = elemColor;
            ctx.beginPath();
            ctx.arc(pCanvas.x, pCanvas.y, isMainCell ? 5.5 : 3.5, 0, Math.PI * 2);
            ctx.fill();

            if (isMainCell) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.2;
              ctx.stroke();
              ctx.fillStyle = '#e2e8f0';
              ctx.font = 'bold 10px monospace';
              ctx.fillText(`${site.element}`, pCanvas.x + 7, pCanvas.y + 3);
            }
            ctx.restore();
          });
        }
      }
    }
  }, [
    viewMode,
    rot3D,
    projectionPlane,
    a,
    b,
    c,
    radA,
    radB,
    radG,
    matrixP,
    shiftP,
    atomSites,
    replicatedSupercellAtoms,
    parentCartesianVectors,
    superCartesianVectors,
    projZoom,
    projPan,
    showSubGrid,
    showAtomsProj,
    showShiftVector,
    showVectorsProj
  ]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingCanvas) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    if (viewMode === '3d' && !e.shiftKey) {
      setRot3D(prev => ({
        yaw: prev.yaw + dx * 0.6,
        pitch: Math.max(-85, Math.min(85, prev.pitch + dy * 0.6))
      }));
    } else {
      setProjPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Scientific Console Header & Configuration Ribbon */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-lg space-y-5">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold uppercase tracking-wider">
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                IUCr Basis &amp; Supercell Engine (P, p)
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                  Math.abs(detP) < 1e-6
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : detP > 0
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                det(P) = {fmt(detP, 3)} ({Math.abs(detP) < 1e-6 ? 'Singular' : detP > 0 ? 'Right-Handed' : 'Left-Handed'})
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                {replicatedSupercellAtoms.length} Supercell Atoms ({atomSites.length} Parent × {fmt(absDetP, 2)})
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono border ${
                  transformedParams.isNiggliReduced
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {transformedParams.isNiggliReduced ? 'Niggli-Reduced Cell' : 'Non-Niggli Setting'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Supercell &amp; Coordinate Transformation Matrix Engine
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Real-time covariant/contravariant transformation of direct &amp; reciprocal metric tensors (<strong>G&apos; = P G P<sup>T</sup></strong>), Miller planes (<em>hkl</em>), zone axes [<em>uvw</em>], and full |det(<strong>P</strong>)| supercell atomic basis replication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadFile(vaspPoscarText, `POSCAR_${selectedTemplateId}_${fmt(absDetP, 0)}x.vasp`)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              POSCAR
            </button>

            <button
              type="button"
              onClick={() => handleDownloadFile(cifText, `supercell_${selectedTemplateId}.cif`)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              CIF
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(generateLaTeX(), 'latex')}
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              {copiedKey === 'latex' ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {copiedKey === 'latex' ? 'LaTeX Copied' : 'LaTeX Report'}
            </button>

            <button
              type="button"
              onClick={() => setShowPythonPanel(!showPythonPanel)}
              className={`px-3 py-2 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 ${
                showPythonPanel
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              Python
            </button>
          </div>
        </div>

        {/* Preset Transformations & Parent Structure Template Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-1 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              Transformation Matrix Preset (P, p):
            </label>
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full bg-slate-950 text-cyan-300 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-cyan-500"
            >
              {PRESET_TRANSFORMATIONS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} [{preset.category}]
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-4">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-violet-300 mb-1 flex items-center gap-1.5">
              <Atom className="w-3.5 h-3.5" />
              Parent Crystal Structure Basis:
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full bg-slate-950 text-violet-300 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-violet-500"
            >
              {STRUCTURE_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.sites.length} sites)
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3 flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Quick N×N×N:</span>
            {[
              [1, 1, 1],
              [2, 2, 1],
              [2, 2, 2],
              [3, 3, 1],
              [3, 3, 3]
            ].map(([na, nb, nc]) => (
              <button
                key={`${na}${nb}${nc}`}
                type="button"
                onClick={() => handleSetDiagonalSupercell(na, nb, nc)}
                className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white font-mono text-[11px] font-bold border border-slate-700 transition-colors"
              >
                {na}×{nb}×{nc}
              </button>
            ))}
          </div>
        </div>

        {/* Parent Unit Cell Parameters Inline Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800">
          {[
            { label: 'Parent a (Å)', val: a, set: setA, step: '0.001' },
            { label: 'Parent b (Å)', val: b, set: setB, step: '0.001' },
            { label: 'Parent c (Å)', val: c, set: setC, step: '0.001' },
            { label: 'Angle α (°)', val: alpha, set: setAlpha, step: '0.1' },
            { label: 'Angle β (°)', val: beta, set: setBeta, step: '0.1' },
            { label: 'Angle γ (°)', val: gamma, set: setGamma, step: '0.1' }
          ].map((item) => (
            <div key={item.label} className="bg-slate-950/90 px-3 py-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-bold text-slate-400 whitespace-nowrap">{item.label}</span>
              <input
                type="number"
                step={item.step}
                value={item.val}
                onChange={(e) => item.set(parseFloat(e.target.value) || 1)}
                className="w-20 bg-slate-900 text-white font-mono font-bold text-xs px-2 py-1 rounded-lg border border-slate-700 focus:border-cyan-500 text-right outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 6-Card Live Crystallographic Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Supercell a&apos;, b&apos;, c&apos;</span>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">Å</span>
          </div>
          <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">
            {fmt(transformedParams.aPrime, 3)} / {fmt(transformedParams.bPrime, 3)} / {fmt(transformedParams.cPrime, 3)}
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            Parent: {fmt(a, 2)} / {fmt(b, 2)} / {fmt(c, 2)} Å
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Angles α&apos;, β&apos;, γ&apos;</span>
            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">deg</span>
          </div>
          <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">
            {fmt(transformedParams.alphaPrime, 1)}° / {fmt(transformedParams.betaPrime, 1)}° / {fmt(transformedParams.gammaPrime, 1)}°
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            ab-Rotation: {fmt(transformedParams.inPlaneRotDeg, 2)}°
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Supercell Volume V&apos;</span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{fmt(absDetP, 2)}× V₀</span>
          </div>
          <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
            {fmt(transformedParams.volumePrime, 3)} <span className="text-xs font-normal text-slate-400">Å³</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            Parent V₀ = {fmt(parentVolume, 3)} Å³
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Miller Plane (h&apos;k&apos;l&apos;)</span>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">Covariant</span>
          </div>
          <div className="text-sm font-black font-mono text-cyan-600 dark:text-cyan-400">
            ({fmt(reciprocalAndZoneMetrics.hPrime, 1)} {fmt(reciprocalAndZoneMetrics.kPrime, 1)} {fmt(reciprocalAndZoneMetrics.lPrime, 1)})
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            d = {fmt(reciprocalAndZoneMetrics.dSpacingAngstrom, 4)} Å (Invariant)
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Zone Axis [u&apos;v&apos;w&apos;]</span>
            <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400 font-bold">Contravariant</span>
          </div>
          <div className="text-sm font-black font-mono text-violet-600 dark:text-violet-400">
            [{fmt(reciprocalAndZoneMetrics.uPrime, 2)} {fmt(reciprocalAndZoneMetrics.vPrime, 2)} {fmt(reciprocalAndZoneMetrics.wPrime, 2)}]
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            |r| = {fmt(reciprocalAndZoneMetrics.zoneLengthAngstrom, 3)} Å | hu+kv+lw={reciprocalAndZoneMetrics.weissScalar}
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Supercell Basis</span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">|det(P)|={fmt(absDetP, 2)}</span>
          </div>
          <div className="text-base font-black font-mono text-slate-800 dark:text-slate-100">
            {replicatedSupercellAtoms.length} <span className="text-xs font-normal text-slate-400">Atoms</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            {atomSites.length} Parent Wyckoff Sites
          </div>
        </div>
      </div>

      {/* Main Live Interactive Grid: Left = Matrix [P], Inverse [P^-1], & Shift [p] | Right = 2D/3D Supercell Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (6 cols): Matrix [P], Quick Ops, Shift Vector [p], and Inverse [P^-1] */}
        <div className="lg:col-span-6 bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 block">
                Direct Transformation Matrix [P] &amp; Origin Shift [p]
              </span>
              <h3 className="text-sm font-bold text-white">
                (a&apos;, b&apos;, c&apos;)ᵀ = P · (a, b, c)ᵀ
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleTransposeP}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono font-bold flex items-center gap-1"
                title="Transpose Matrix P -> P^T"
              >
                <FlipHorizontal className="w-3 h-3 text-cyan-400" />
                Pᵀ
              </button>
              <button
                type="button"
                onClick={handleSwapWithInverseP}
                disabled={!inverseP}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-violet-300 border border-slate-700 text-[11px] font-mono font-bold flex items-center gap-1 disabled:opacity-40"
                title="Replace P with its inverse P^-1 (Reverse Transformation)"
              >
                <Repeat className="w-3 h-3 text-violet-400" />
                Swap P ↔ P⁻¹
              </button>
              <button
                type="button"
                onClick={() => handleSetDiagonalSupercell(1, 1, 1)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono font-bold"
                title="Reset to 3x3 Identity Matrix I_3"
              >
                I₃
              </button>
            </div>
          </div>

          {/* Side-by-Side Matrix P Editor & Inverse P^-1 Readout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Matrix P 3x3 Inputs */}
            <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-cyan-400 font-bold">Matrix [P]</span>
                <span className="text-slate-400">det(P) = {fmt(detP, 3)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['p11', 'p12', 'p13'],
                    ['p21', 'p22', 'p23'],
                    ['p31', 'p32', 'p33']
                  ] as const
                ).map(row =>
                  row.map(key => (
                    <input
                      key={key}
                      type="number"
                      step="0.25"
                      value={matrixP[key]}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setMatrixP(prev => ({ ...prev, [key]: val }));
                        setSelectedPresetId('');
                      }}
                      className="w-full bg-slate-950 text-cyan-300 font-mono font-bold text-sm py-2 px-1.5 rounded-lg border border-slate-700 text-center focus:border-cyan-400 outline-none"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Inverse Matrix P^-1 Readout */}
            <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-violet-400 font-bold">Inverse [P⁻¹]</span>
                <span className="text-slate-400">det(P⁻¹) = {inverseP ? fmt(1 / detP, 3) : '∞'}</span>
              </div>
              {inverseP ? (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    [inverseP.p11, inverseP.p12, inverseP.p13],
                    [inverseP.p21, inverseP.p22, inverseP.p23],
                    [inverseP.p31, inverseP.p32, inverseP.p33]
                  ].map((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <div
                        key={`inv-${rIdx}-${cIdx}`}
                        className="py-2 px-1 bg-slate-950/90 text-violet-300 font-mono font-bold text-xs rounded-lg border border-slate-800 text-center"
                      >
                        {fmt(val, 3)}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="h-28 flex items-center justify-center text-rose-400 text-xs font-mono text-center bg-rose-950/20 rounded-lg border border-rose-800/40 p-2">
                  Singular Matrix (det(P) = 0)
                </div>
              )}
            </div>
          </div>

          {/* Fractional Origin Shift Vector p = (px, py, pz) */}
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-400 font-mono block">
                Origin Shift Vector p = (pₓ, pᵧ, p_z)
              </span>
              <span className="text-[10px] text-slate-400">
                Shifts new origin relative to parent cell: x&apos; = P⁻¹(x − p)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {(
                [
                  { k: 'x', lbl: 'pₓ', val: shiftP.x },
                  { k: 'y', lbl: 'pᵧ', val: shiftP.y },
                  { k: 'z', lbl: 'p_z', val: shiftP.z }
                ] as const
              ).map(item => (
                <div key={item.k} className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-400">{item.lbl}:</span>
                  <input
                    type="number"
                    step="0.125"
                    value={item.val}
                    onChange={(e) =>
                      setShiftP(prev => ({ ...prev, [item.k]: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-16 bg-slate-950 text-amber-300 font-mono font-bold text-xs py-1.5 px-2 rounded-lg border border-slate-700 text-center outline-none focus:border-amber-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preset Description Note */}
          {selectedPresetId && (
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{PRESET_TRANSFORMATIONS.find(p => p.id === selectedPresetId)?.description}</span>
            </div>
          )}
        </div>

        {/* Right Column (6 cols): Interactive 3D / 2D Supercell & Boundary Projection Canvas */}
        <div className="lg:col-span-6 bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-lg flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    viewMode === '3d'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3D Supercell Box
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    viewMode === '2d'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2D Planar Projection
                </button>
              </div>

              {viewMode === '2d' && (
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
                  {(['ab', 'bc', 'ca'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProjectionPlane(p)}
                      className={`px-2 py-0.5 rounded-lg font-mono font-bold transition-all ${
                        projectionPlane === p
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAtomsProj(!showAtomsProj)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
                  showAtomsProj
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <Atom className="w-3 h-3" />
                Atoms ({replicatedSupercellAtoms.length})
              </button>

              {viewMode === '2d' && (
                <button
                  type="button"
                  onClick={() => setShowSubGrid(!showSubGrid)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    showSubGrid
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Sub-Grid
                </button>
              )}

              <button
                type="button"
                onClick={() => setProjZoom(z => Math.min(2.5, z + 0.2))}
                className="p-1.5 bg-slate-900 text-slate-300 hover:text-cyan-300 rounded-lg border border-slate-800"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setProjZoom(z => Math.max(0.5, z - 0.2))}
                className="p-1.5 bg-slate-900 text-slate-300 hover:text-cyan-300 rounded-lg border border-slate-800"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setProjZoom(1.0);
                  setProjPan({ x: 0, y: 0 });
                  setRot3D({ yaw: -35, pitch: 24 });
                }}
                className="p-1.5 bg-slate-900 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-800"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleExportProjectionCanvas}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 text-[11px] font-bold flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                PNG
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="w-full h-auto max-h-[300px] object-contain cursor-grab active:cursor-grabbing"
            />
            <div className="absolute bottom-2 left-2.5 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
              {viewMode === '3d'
                ? 'Drag to rotate 3D supercell | Shift+Drag to pan'
                : `${planarProps.name}: Parent Area = ${fmt(planarProps.parentArea, 2)} Å² → Supercell Area = ${fmt(planarProps.transformedArea, 2)} Å²`}
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 flex flex-wrap justify-between items-center gap-2 px-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-500 inline-block" /> Parent Unit Cell (a, b, c)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-cyan-400 inline-block" /> Transformed Supercell (a&apos;, b&apos;, c&apos;)
              </span>
            </div>
            <span className="text-emerald-400 font-bold">
              Multiplicity |det(P)| = {fmt(absDetP, 3)}×
            </span>
          </div>
        </div>
      </div>

      {/* Diagnostic Bottom Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'visualizer', icon: Scale, label: 'Cell Comparison & Metric Tensors [G]' },
          { id: 'reciprocal', icon: Compass, label: 'Miller Planes (hkl) & Zone Axes [uvw]' },
          { id: 'atoms', icon: Atom, label: `Supercell Replicated Atoms (${replicatedSupercellAtoms.length})` },
          { id: 'export', icon: FileText, label: 'POSCAR / CIF / LaTeX Export' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: CELL COMPARISON & METRIC TENSORS [G] AND [G*] */}
      {activeTab === 'visualizer' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Parent vs Transformed Lattice Comparison Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    Parent vs. Transformed Supercell Metrics
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  V&apos; / V = {fmt(absDetP, 4)}×
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-3">Parameter</th>
                      <th className="py-2.5 px-3">Parent Cell</th>
                      <th className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400">Transformed Cell</th>
                      <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">Scale / Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    <tr>
                      <td className="py-2 px-3 font-bold">a (Å)</td>
                      <td className="py-2 px-3">{fmt(a, 4)}</td>
                      <td className="py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">{fmt(transformedParams.aPrime, 4)}</td>
                      <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">{(transformedParams.aPrime / a).toFixed(4)}×</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold">b (Å)</td>
                      <td className="py-2 px-3">{fmt(b, 4)}</td>
                      <td className="py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">{fmt(transformedParams.bPrime, 4)}</td>
                      <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">{(transformedParams.bPrime / b).toFixed(4)}×</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold">c (Å)</td>
                      <td className="py-2 px-3">{fmt(c, 4)}</td>
                      <td className="py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">{fmt(transformedParams.cPrime, 4)}</td>
                      <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">{(transformedParams.cPrime / c).toFixed(4)}×</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold">α, β, γ (°)</td>
                      <td className="py-2 px-3">{fmt(alpha, 2)}°, {fmt(beta, 2)}°, {fmt(gamma, 2)}°</td>
                      <td className="py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                        {fmt(transformedParams.alphaPrime, 2)}°, {fmt(transformedParams.betaPrime, 2)}°, {fmt(transformedParams.gammaPrime, 2)}°
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        Δγ = {fmt(transformedParams.gammaPrime - gamma, 2)}°
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold">Reciprocal a*, b*, c* (Å⁻¹)</td>
                      <td className="py-2 px-3">
                        {parentGStar ? `${fmt(Math.sqrt(parentGStar[0][0]), 4)}, ${fmt(Math.sqrt(parentGStar[1][1]), 4)}, ${fmt(Math.sqrt(parentGStar[2][2]), 4)}` : '-'}
                      </td>
                      <td className="py-2 px-3 font-bold text-violet-600 dark:text-violet-400">
                        {fmt(transformedParams.aStarPrime, 4)}, {fmt(transformedParams.bStarPrime, 4)}, {fmt(transformedParams.cStarPrime, 4)}
                      </td>
                      <td className="py-2 px-3 text-slate-500">Contravariant</td>
                    </tr>
                    <tr className="bg-cyan-50/50 dark:bg-cyan-950/20 font-bold">
                      <td className="py-2.5 px-3">Volume V (Å³)</td>
                      <td className="py-2.5 px-3">{fmt(parentVolume, 4)}</td>
                      <td className="py-2.5 px-3 text-cyan-600 dark:text-cyan-400">{fmt(transformedParams.volumePrime, 4)}</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">{fmt(absDetP, 4)}×</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Direct Metric Tensor Transformation G' = P G P^T */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    Metric Tensor Transformation [G&apos;] = [P] [G] [P]ᵀ
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  det(G&apos;) = V&apos;² = {fmt(transformedParams.volumePrime * transformedParams.volumePrime, 2)} Å⁶
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">
                    Parent Metric Tensor [G] (Å²)
                  </span>
                  <table className="w-full text-center font-mono text-xs">
                    <tbody>
                      {parentG.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((val, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-1.5 ${
                                rIdx === cIdx ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                              }`}
                            >
                              {fmt(val, 3)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 block">
                    Transformed Metric Tensor [G&apos;] (Å²)
                  </span>
                  <table className="w-full text-center font-mono text-xs">
                    <tbody>
                      {transformedG.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((val, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-1.5 ${
                                rIdx === cIdx ? 'font-bold text-cyan-600 dark:text-cyan-400' : 'text-slate-500'
                              }`}
                            >
                              {fmt(val, 3)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <ScientificMathControl
                title="Covariant & Contravariant Tensor Transformation Laws"
                formula="\mathbf{G}' = \mathbf{P}\mathbf{G}\mathbf{P}^T, \quad \mathbf{G}'^* = (\mathbf{P}^{-1})^T \mathbf{G}^* \mathbf{P}^{-1}, \quad V' = |\det(\mathbf{P})| \sqrt{\det(\mathbf{G})}"
                description="Direct space basis vectors and Miller plane indices transform covariantly with P, whereas fractional atomic coordinates, zone axes [uvw], and reciprocal basis vectors transform contravariantly with P⁻¹."
                variables={[
                  { symbol: 'det(P)', name: 'Matrix Determinant', value: detP, unit: '-' },
                  { symbol: 'V', name: 'Parent Cell Volume', value: parentVolume, unit: 'Å³' },
                  { symbol: "V'", name: 'Supercell Volume', value: transformedParams.volumePrime, unit: 'Å³' }
                ]}
                result={transformedParams.volumePrime}
                resultUnit="Å³"
                resultName="Supercell Volume V'"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MILLER PLANES (hkl) & ZONE AXES [uvw] RECIPROCAL/DIRECT CALCULATOR */}
      {activeTab === 'reciprocal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Covariant Miller Plane Mapping */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Covariant Miller Plane Mapping: (h&apos;k&apos;l&apos;)ᵀ = P · (hkl)ᵀ
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                d-Spacing Invariant
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500">Parent (h k l) =</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'h', val: h, set: setH },
                    { label: 'k', val: k, set: setK },
                    { label: 'l', val: l, set: setL }
                  ].map(item => (
                    <input
                      key={item.label}
                      type="number"
                      value={item.val}
                      onChange={(e) => item.set(parseInt(e.target.value, 10) || 0)}
                      className="w-12 h-9 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-center text-sm rounded-lg border border-slate-300 dark:border-slate-700 outline-none"
                    />
                  ))}
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-cyan-500 shrink-0" />

              <div className="flex-1 w-full bg-cyan-50/60 dark:bg-cyan-950/30 p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300">(h&apos; k&apos; l&apos;) =</span>
                <span className="font-mono font-black text-base text-cyan-700 dark:text-cyan-300">
                  ({fmt(reciprocalAndZoneMetrics.hPrime, 2)}, {fmt(reciprocalAndZoneMetrics.kPrime, 2)}, {fmt(reciprocalAndZoneMetrics.lPrime, 2)})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Interplanar Spacing d_hkl = d&apos;_h&apos;k&apos;l&apos;</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {fmt(reciprocalAndZoneMetrics.dSpacingAngstrom, 5)} Å
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Bragg Angle 2θ (Cu Kα₁ = 1.54056 Å)</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {reciprocalAndZoneMetrics.twoThetaCuDeg !== null
                    ? `${fmt(reciprocalAndZoneMetrics.twoThetaCuDeg, 3)}°`
                    : 'Outside Ewald Sphere'}
                </span>
              </div>
            </div>
          </div>

          {/* Contravariant Zone Axis Mapping */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-violet-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Contravariant Zone Axis Mapping: [u&apos;v&apos;w&apos;]ᵀ = P⁻¹ · [uvw]ᵀ
                </h3>
              </div>
              <span className="text-[11px] font-mono text-violet-600 dark:text-violet-400 font-bold">
                Weiss Law: hu+kv+lw = {reciprocalAndZoneMetrics.weissScalar}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500">Parent [u v w] =</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'u', val: u, set: setU },
                    { label: 'v', val: v, set: setV },
                    { label: 'w', val: w, set: setW }
                  ].map(item => (
                    <input
                      key={item.label}
                      type="number"
                      value={item.val}
                      onChange={(e) => item.set(parseInt(e.target.value, 10) || 0)}
                      className="w-12 h-9 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-center text-sm rounded-lg border border-slate-300 dark:border-slate-700 outline-none"
                    />
                  ))}
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-violet-500 shrink-0" />

              <div className="flex-1 w-full bg-violet-50/60 dark:bg-violet-950/30 p-3.5 rounded-xl border border-violet-200 dark:border-violet-800/60 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-violet-700 dark:text-violet-300">[u&apos; v&apos; w&apos;] =</span>
                <span className="font-mono font-black text-base text-violet-700 dark:text-violet-300">
                  [{fmt(reciprocalAndZoneMetrics.uPrime, 3)}, {fmt(reciprocalAndZoneMetrics.vPrime, 3)}, {fmt(reciprocalAndZoneMetrics.wPrime, 3)}]
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Direct Vector Length |r_uvw|</span>
                <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                  {fmt(reciprocalAndZoneMetrics.zoneLengthAngstrom, 4)} Å
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Zone Condition (hu + kv + lw = 0)</span>
                <span
                  className={`text-sm font-black ${
                    reciprocalAndZoneMetrics.weissScalar === 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {reciprocalAndZoneMetrics.weissScalar === 0 ? 'Tautozonal (In-Zone)' : `Non-Zero (${reciprocalAndZoneMetrics.weissScalar})`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUPERCELL REPLICATED ATOMIC BASIS */}
      {activeTab === 'atoms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Parent Wyckoff Sites Editor (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-violet-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Parent Unit Cell Basis ({atomSites.length} Sites)
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto max-h-64 border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 px-2.5">Site</th>
                    <th className="py-2 px-2.5">Parent (x, y, z)</th>
                    <th className="py-2 px-2.5 text-cyan-600 dark:text-cyan-400">Base (x&apos;, y&apos;, z&apos;)</th>
                    <th className="py-2 px-2 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {transformedAtoms.map((atom) => (
                    <tr key={atom.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-2.5 font-bold">
                        {atom.element} <span className="text-slate-400 font-normal text-[10px]">{atom.label}</span>
                      </td>
                      <td className="py-2 px-2.5">
                        ({atom.x}, {atom.y}, {atom.z})
                      </td>
                      <td className="py-2 px-2.5 font-bold text-cyan-600 dark:text-cyan-400">
                        ({fmt(atom.xWrap, 3)}, {fmt(atom.yWrap, 3)}, {fmt(atom.zWrap, 3)})
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          disabled={atomSites.length <= 1}
                          onClick={() => setAtomSites(prev => prev.filter(s => s.id !== atom.id))}
                          className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Parent Site Row */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Elem"
                value={newAtomElem}
                onChange={(e) => setNewAtomElem(e.target.value)}
                className="w-14 bg-white dark:bg-slate-900 font-mono font-bold text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
              />
              <input
                type="number"
                step="0.05"
                value={newAtomX}
                onChange={(e) => setNewAtomX(parseFloat(e.target.value) || 0)}
                className="w-14 bg-white dark:bg-slate-900 font-mono font-bold text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-center"
              />
              <input
                type="number"
                step="0.05"
                value={newAtomY}
                onChange={(e) => setNewAtomY(parseFloat(e.target.value) || 0)}
                className="w-14 bg-white dark:bg-slate-900 font-mono font-bold text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-center"
              />
              <input
                type="number"
                step="0.05"
                value={newAtomZ}
                onChange={(e) => setNewAtomZ(parseFloat(e.target.value) || 0)}
                className="w-14 bg-white dark:bg-slate-900 font-mono font-bold text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-center"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newAtomElem.trim()) return;
                  setAtomSites(prev => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      element: newAtomElem.trim(),
                      x: newAtomX,
                      y: newAtomY,
                      z: newAtomZ,
                      label: `${newAtomElem.trim()}${prev.length + 1}`
                    }
                  ]);
                }}
                className="ml-auto px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Site
              </button>
            </div>
          </div>

          {/* Right: Full Replicated Supercell Coordinates Table (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  Replicated Supercell Atomic Coordinates ({replicatedSupercellAtoms.length} Total Atoms)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Generated via lattice translations <strong>x&apos; = P<sup>&minus;1</sup>(x + t &minus; p) (mod 1)</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(vaspPoscarText, 'poscar_copy')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                {copiedKey === 'poscar_copy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'poscar_copy' ? 'POSCAR Copied' : 'Copy VASP POSCAR'}
              </button>
            </div>

            <div className="overflow-x-auto max-h-80 border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Elem</th>
                    <th className="py-2 px-3">Translation t</th>
                    <th className="py-2 px-3 text-cyan-600 dark:text-cyan-400">Supercell Fractional (x&apos;, y&apos;, z&apos;)</th>
                    <th className="py-2 px-3 text-emerald-600 dark:text-emerald-400">Cartesian (X, Y, Z) Å</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {replicatedSupercellAtoms.map((at, idx) => (
                    <tr key={at.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold">{at.element}</td>
                      <td className="py-2 px-3 text-slate-500">
                        [{at.translation[0]}, {at.translation[1]}, {at.translation[2]}]
                      </td>
                      <td className="py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                        ({at.xWrap.toFixed(4)}, {at.yWrap.toFixed(4)}, {at.zWrap.toFixed(4)})
                      </td>
                      <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400">
                        ({at.cartX.toFixed(3)}, {at.cartY.toFixed(3)}, {at.cartZ.toFixed(3)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: POSCAR / CIF / LATEX EXPORT VIEWER */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">
                VASP 5 POSCAR Supercell Structure
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(vaspPoscarText, 'poscar_tab')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5"
              >
                {copiedKey === 'poscar_tab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy POSCAR
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
              {vaspPoscarText}
            </pre>
          </div>

          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
                Crystallographic Information File (.CIF)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(cifText, 'cif_tab')}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center gap-1.5"
              >
                {copiedKey === 'cif_tab' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy CIF
              </button>
            </div>
            <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
              {cifText}
            </pre>
          </div>
        </div>
      )}

      {/* Optional Python Scripting Engine (PyMatGen & DiffPy) */}
      {showPythonPanel && (
        <div className="bg-slate-950 rounded-2xl p-5 sm:p-6 border border-amber-500/40 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold uppercase">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                PyMatGen &amp; ASE Supercell Generator
              </span>
              <h3 className="text-base font-black text-white">
                Python Supercell &amp; Space-Group Subgroup Script
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPythonExecuting(true);
                  setTimeout(() => {
                    setIsPythonExecuting(false);
                    setPythonOutput(`=== PYMATGEN SUPERCELL TRANSFORMATION VERIFIED ===
Determinant det(P): ${fmt(detP, 4)} | Supercell Multiplicity: ${fmt(absDetP, 2)}x
Parent Cell Volume V0: ${fmt(parentVolume, 4)} Å³ -> Supercell V': ${fmt(transformedParams.volumePrime, 4)} Å³
Transformed Cell: a'=${fmt(transformedParams.aPrime, 4)} Å, b'=${fmt(transformedParams.bPrime, 4)} Å, c'=${fmt(transformedParams.cPrime, 4)} Å
Angles: α'=${fmt(transformedParams.alphaPrime, 2)}°, β'=${fmt(transformedParams.betaPrime, 2)}°, γ'=${fmt(transformedParams.gammaPrime, 2)}°
Miller Plane (${h} ${k} ${l}) -> (${fmt(reciprocalAndZoneMetrics.hPrime, 2)} ${fmt(reciprocalAndZoneMetrics.kPrime, 2)} ${fmt(reciprocalAndZoneMetrics.lPrime, 2)}) [d = ${fmt(reciprocalAndZoneMetrics.dSpacingAngstrom, 4)} Å]
Total Replicated Supercell Sites: ${replicatedSupercellAtoms.length} atoms`);
                  }, 300);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
              >
                {isPythonExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Run Verification
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
            <pre className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto">
{`import numpy as np
from pymatgen.core import Lattice, Structure
from pymatgen.transformations.standard_transformations import SupercellTransformation

P = np.array([
    [${matrixP.p11}, ${matrixP.p12}, ${matrixP.p13}],
    [${matrixP.p21}, ${matrixP.p22}, ${matrixP.p23}],
    [${matrixP.p31}, ${matrixP.p32}, ${matrixP.p33}]
])
lat = Lattice.from_parameters(${a}, ${b}, ${c}, ${alpha}, ${beta}, ${gamma})
species = [${atomSites.map(s => `'${s.element}'`).join(', ')}]
coords = [${atomSites.map(s => `[${s.x}, ${s.y}, ${s.z}]`).join(', ')}]
struct = Structure(lat, species, coords)
supercell = SupercellTransformation(P).apply_transformation(struct)
print(supercell)`}
            </pre>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-cyan-300">
              {pythonOutput ? (
                <pre className="whitespace-pre-wrap text-[11px]">{pythonOutput}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Click &quot;Run Verification&quot; to evaluate PyMatGen output
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
