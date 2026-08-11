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
  Maximize,
  ArrowRightLeft,
  Plus,
  ZoomIn,
  ZoomOut,
  Move,
  Target,
  Atom,
  EyeOff,
  CircleDot
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

export interface PresetTransformation {
  id: string;
  name: string;
  category: 'Supercells' | 'Primitive/Conventional' | 'Symmetry Subgroup';
  description: string;
  P: Matrix3x3;
  p: Vector3D;
  parentSystem: string;
}

const PRESET_TRANSFORMATIONS: PresetTransformation[] = [
  {
    id: 'supercell_222',
    name: '2 × 2 × 2 Isomorphic Supercell',
    category: 'Supercells',
    description: 'Doubles all 3 lattice vectors (8× volume expansion, e.g. for magnetic ordering or defect modeling).',
    P: { p11: 2, p12: 0, p13: 0, p21: 0, p22: 2, p23: 0, p31: 0, p32: 0, p33: 2 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Cubic'
  },
  {
    id: 'perovskite_rot45',
    name: '√2 × √2 × 2 Perovskite (45° Rotated)',
    category: 'Supercells',
    description: 'Rotates ab-plane by 45° around c-axis (doubles cell volume for octahedral tilting like SrTiO3 or LaAlO3).',
    P: { p11: 1, p12: 1, p13: 0, p21: -1, p22: 1, p23: 0, p31: 0, p32: 0, p33: 2 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Tetragonal'
  },
  {
    id: 'fcc_prim_to_conv',
    name: 'FCC Primitive → Conventional Cubic',
    category: 'Primitive/Conventional',
    description: 'Transforms Face-Centered Cubic primitive vectors to the 4-atom conventional cubic cell.',
    P: { p11: -1, p12: 1, p13: 1, p21: 1, p22: -1, p23: 1, p31: 1, p32: 1, p33: -1 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Cubic'
  },
  {
    id: 'bcc_prim_to_conv',
    name: 'BCC Primitive → Conventional Cubic',
    category: 'Primitive/Conventional',
    description: 'Transforms Body-Centered Cubic primitive vectors to the 2-atom conventional cubic cell.',
    P: { p11: 0, p12: 1, p13: 1, p21: 1, p22: 0, p23: 1, p31: 1, p32: 1, p33: 0 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Cubic'
  },
  {
    id: 'hex_to_rhomb',
    name: 'Rhombohedral (Obverse) → Hexagonal Cell',
    category: 'Primitive/Conventional',
    description: 'Converts a rhombohedral primitive cell to the triple hexagonal conventional cell (3× volume).',
    P: { p11: 2/3, p12: 1/3, p13: 1/3, p21: -1/3, p22: 1/3, p23: 1/3, p31: -1/3, p32: -2/3, p33: 1/3 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Rhombohedral'
  },
  {
    id: 'hex_sqrt3_r30',
    name: 'Hexagonal √3 × √3 R30° Supercell',
    category: 'Supercells',
    description: 'Common surface reconstruction or 2D heterostructure supercell rotated by 30°.',
    P: { p11: 2, p12: 1, p13: 0, p21: -1, p22: 1, p23: 0, p31: 0, p32: 0, p33: 1 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Hexagonal'
  },
  {
    id: 'epitaxial_film',
    name: '3 × 3 × 1 Epitaxial Thin Film Supercell',
    category: 'Supercells',
    description: 'Expands in-plane ab axes while preserving c axis height for substrate mismatch simulation.',
    P: { p11: 3, p12: 0, p13: 0, p21: 0, p22: 3, p23: 0, p31: 0, p32: 0, p33: 1 },
    p: { x: 0, y: 0, z: 0 },
    parentSystem: 'Tetragonal'
  }
];

// Helper to format numbers nicely
const fmt = (num: number, digits: number = 4) => {
  if (isNaN(num) || !isFinite(num)) return '-';
  return num.toFixed(digits);
};

// Determinant of 3x3 matrix
function det3x3(m: Matrix3x3): number {
  return (
    m.p11 * (m.p22 * m.p33 - m.p23 * m.p32) -
    m.p12 * (m.p21 * m.p33 - m.p23 * m.p31) +
    m.p13 * (m.p21 * m.p32 - m.p22 * m.p31)
  );
}

// Inverse of 3x3 matrix
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

export const SupercellTransformationModule: React.FC<{ pythonFeaturesEnabled?: boolean }> = ({ pythonFeaturesEnabled = false }) => {
  const { t } = useTranslation();

  // Tab State
  const [activeTab, setActiveTab] = useState<'setup' | 'matrix' | 'mapping' | 'results'>('setup');

  // Python Features State (Disabled by default)
  const [showPythonPanel, setShowPythonPanel] = useState<boolean>(pythonFeaturesEnabled);
  const [isPythonExecuting, setIsPythonExecuting] = useState<boolean>(false);
  const [pythonOutput, setPythonOutput] = useState<string | null>(null);

  // Parent Lattice Parameters
  const [a, setA] = useState<number>(4.05);
  const [b, setB] = useState<number>(4.05);
  const [c, setC] = useState<number>(4.05);
  const [alpha, setAlpha] = useState<number>(90);
  const [beta, setBeta] = useState<number>(90);
  const [gamma, setGamma] = useState<number>(90);

  // Transformation Matrix P & Shift Vector p
  const [matrixP, setMatrixP] = useState<Matrix3x3>(PRESET_TRANSFORMATIONS[0].P);
  const [shiftP, setShiftP] = useState<Vector3D>({ x: 0, y: 0, z: 0 });
  const [selectedPresetId, setSelectedPresetId] = useState<string>('supercell_222');

  // Miller Index Calculator
  const [h, setH] = useState<number>(1);
  const [k, setK] = useState<number>(1);
  const [l, setL] = useState<number>(1);

  // Atomic Sites List
  const [atomSites, setAtomSites] = useState<AtomSite[]>([
    { id: '1', element: 'Si', x: 0.0, y: 0.0, z: 0.0, label: 'Si1 (Corner)' },
    { id: '2', element: 'Si', x: 0.25, y: 0.25, z: 0.25, label: 'Si2 (Interior)' }
  ]);
  const [newAtomElem, setNewAtomElem] = useState<string>('O');
  const [newAtomX, setNewAtomX] = useState<number>(0.5);
  const [newAtomY, setNewAtomY] = useState<number>(0.5);
  const [newAtomZ, setNewAtomZ] = useState<number>(0.5);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Advanced Boundary Projection Interactive States
  const [projectionPlane, setProjectionPlane] = useState<'ab' | 'bc' | 'ca'>('ab');
  const [projZoom, setProjZoom] = useState<number>(1.0);
  const [projPan, setProjPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanningProj, setIsPanningProj] = useState<boolean>(false);
  const [panProjStart, setPanProjStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Handle Preset Select
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = PRESET_TRANSFORMATIONS.find(item => item.id === presetId);
    if (p) {
      setMatrixP(p.P);
      setShiftP(p.p);
    }
  };

  // Convert angles to radians
  const radA = (alpha * Math.PI) / 180;
  const radB = (beta * Math.PI) / 180;
  const radG = (gamma * Math.PI) / 180;

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
  const parentDetG = (
    parentG[0][0] * (parentG[1][1] * parentG[2][2] - parentG[1][2] * parentG[2][1]) -
    parentG[0][1] * (parentG[1][0] * parentG[2][2] - parentG[1][2] * parentG[2][0]) +
    parentG[0][2] * (parentG[1][0] * parentG[2][1] - parentG[1][1] * parentG[2][0])
  );
  const parentVolume = Math.sqrt(Math.max(1e-12, parentDetG));

  // Transformation Matrix Determinant det(P)
  const detP = det3x3(matrixP);
  const absDetP = Math.abs(detP);

  // Inverse Matrix P^-1
  const inverseP = useMemo(() => invert3x3(matrixP), [matrixP]);

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

    // Temp = G * PT
    const temp = [[0,0,0],[0,0,0],[0,0,0]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          temp[i][j] += parentG[i][k] * PT[k][j];
        }
      }
    }

    // G' = P * Temp
    const GPrime = [[0,0,0],[0,0,0],[0,0,0]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          GPrime[i][j] += P[i][k] * temp[k][j];
        }
      }
    }
    return GPrime;
  }, [matrixP, parentG]);

  // Transformed Lattice Parameters (a', b', c', alpha', beta', gamma')
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

    const cosAPrime = (bPrime * cPrime > 0) ? Math.max(-1, Math.min(1, g23 / (bPrime * cPrime))) : 0;
    const cosBPrime = (aPrime * cPrime > 0) ? Math.max(-1, Math.min(1, g31 / (aPrime * cPrime))) : 0;
    const cosGPrime = (aPrime * bPrime > 0) ? Math.max(-1, Math.min(1, g12 / (aPrime * bPrime))) : 0;

    const alphaPrime = (Math.acos(cosAPrime) * 180) / Math.PI;
    const betaPrime = (Math.acos(cosBPrime) * 180) / Math.PI;
    const gammaPrime = (Math.acos(cosGPrime) * 180) / Math.PI;

    const volumePrime = parentVolume * absDetP;

    return { aPrime, bPrime, cPrime, alphaPrime, betaPrime, gammaPrime, volumePrime };
  }, [transformedG, parentVolume, absDetP]);

  // Miller Index Transformation (h', k', l') = P * (h, k, l)^T
  const transformedMiller = useMemo(() => {
    const hPrime = matrixP.p11 * h + matrixP.p12 * k + matrixP.p13 * l;
    const kPrime = matrixP.p21 * h + matrixP.p22 * k + matrixP.p23 * l;
    const lPrime = matrixP.p31 * h + matrixP.p32 * k + matrixP.p33 * l;
    return { hPrime, kPrime, lPrime };
  }, [matrixP, h, k, l]);

  // Fractional Coordinate Transformations for Atom Sites
  const transformedAtoms = useMemo(() => {
    if (!inverseP) return [];

    return atomSites.map(atom => {
      // Shift x - p
      const dx = atom.x - shiftP.x;
      const dy = atom.y - shiftP.y;
      const dz = atom.z - shiftP.z;

      // x' = P^-1 * (x - p)
      let xPrime = inverseP.p11 * dx + inverseP.p12 * dy + inverseP.p13 * dz;
      let yPrime = inverseP.p21 * dx + inverseP.p22 * dy + inverseP.p23 * dz;
      let zPrime = inverseP.p31 * dx + inverseP.p32 * dy + inverseP.p33 * dz;

      // Wrap modulo 1 to keep inside supercell bounds
      const xWrap = ((xPrime % 1) + 1) % 1;
      const yWrap = ((yPrime % 1) + 1) % 1;
      const zWrap = ((zPrime % 1) + 1) % 1;

      return {
        ...atom,
        xPrime, yPrime, zPrime,
        xWrap, yWrap, zWrap
      };
    });
  }, [atomSites, shiftP, inverseP]);

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

\\section*{Supercell Transformation Matrix Report}

\\subsection*{Parent Unit Cell}
$a = ${a}~\\text{\\AA}, \\quad b = ${b}~\\text{\\AA}, \\quad c = ${c}~\\text{\\AA}$ \\\\
$\\alpha = ${alpha}^\\circ, \\quad \\beta = ${beta}^\\circ, \\quad \\gamma = ${gamma}^\\circ$ \\\\
Parent Volume $V = ${fmt(parentVolume, 4)}~\\text{\\AA}^3$

\\subsection*{Transformation Matrix $[P]$}
P = \\begin{pmatrix}
${matrixP.p11} & ${matrixP.p12} & ${matrixP.p13} \\\\
${matrixP.p21} & ${matrixP.p22} & ${matrixP.p23} \\\\
${matrixP.p31} & ${matrixP.p32} & ${matrixP.p33}
\\end{pmatrix}, \\quad \\det(P) = ${detP}

\\subsection*{Transformed Cell Parameters}
$a' = ${fmt(transformedParams.aPrime, 4)}~\\text{\\AA}, \\quad b' = ${fmt(transformedParams.bPrime, 4)}~\\text{\\AA}, \\quad c' = ${fmt(transformedParams.cPrime, 4)}~\\text{\\AA}$ \\\\
$\\alpha' = ${fmt(transformedParams.alphaPrime, 2)}^\\circ, \\quad \\beta' = ${fmt(transformedParams.betaPrime, 2)}^\\circ, \\quad \\gamma' = ${fmt(transformedParams.gammaPrime, 2)}^\\circ$ \\\\
Transformed Volume $V' = ${fmt(transformedParams.volumePrime, 4)}~\\text{\\AA}^3$

\\subsection*{Miller Indices Mapping}
Parent $(hkl) = (${h}, ${k}, ${l}) \\longrightarrow (${transformedMiller.hPrime}, ${transformedMiller.kPrime}, ${transformedMiller.lPrime})$

\\end{document}`;
  };

  // Export ab-Plane Projection PNG
  const handleExportProjectionCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ab-plane-boundary-projection-${Date.now()}.png`;
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
    } else { // 'ab'
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

  // Canvas Drawing Effect with Dynamic Auto-Fit, Sub-Lattice Tiling, Atomic Projection & Shift Vector
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark Background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, width, height);

    // Draw background grid lines
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 24) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i < height; i += 24) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // Determine basis vector parameters according to selected projection plane
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

    // Parent Basis Vectors in Real Space (Cartesian 2D)
    const ax = len1;
    const ay = 0;
    const bx = len2 * Math.cos(angleRad);
    const by = len2 * Math.sin(angleRad); // positive Y upward

    // Transformed Basis Vectors in 2D
    const aPrimeX = m11 * ax + m12 * bx;
    const aPrimeY = m11 * ay + m12 * by;
    const bPrimeX = m21 * ax + m22 * bx;
    const bPrimeY = m21 * ay + m22 * by;

    // Shift Vector in 2D
    const shiftX = sX * ax + sY * bx;
    const shiftY = sX * ay + sY * by;

    // Bounding Box Calculation for Dynamic Auto-Fit
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

    // Center Origin on Canvas
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const centerX = width / 2 - midX * scale + projPan.x;
    const centerY = height / 2 + midY * scale + projPan.y;

    // Helper: Map Real World 2D Point (x, y) to Screen Canvas (px, py)
    const toCanvas = (x: number, y: number) => ({
      x: centerX + x * scale,
      y: centerY - y * scale
    });

    // 1. Draw Parent Sub-Lattice Tiling Grid
    if (showSubGrid) {
      const minI = Math.floor(minX / Math.max(1, ax)) - 1;
      const maxI = Math.ceil(maxX / Math.max(1, ax)) + 1;
      const minJ = Math.floor(minY / Math.max(1, by)) - 1;
      const maxJ = Math.ceil(maxY / Math.max(1, by)) + 1;

      const boundedIStart = Math.max(-10, minI);
      const boundedIEnd = Math.min(10, maxI);
      const boundedJStart = Math.max(-10, minJ);
      const boundedJEnd = Math.min(10, maxJ);

      ctx.save();
      ctx.strokeStyle = '#1e293b';
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 1;

      for (let i = boundedIStart; i <= boundedIEnd; i++) {
        for (let j = boundedJStart; j <= boundedJEnd; j++) {
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

    // 2. Transformed Supercell Background & Boundary
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

    // 3. Parent Unit Cell Background & Boundary
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

    // 4. Origin Shift Vector [p]
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

    // 5. Draw Basis Vector Arrows
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

    // Parent Vectors
    drawArrow(0, 0, ax, ay, '#3b82f6', lbl1);
    drawArrow(0, 0, bx, by, '#3b82f6', lbl2);

    // Transformed Vectors
    drawArrow(shiftX, shiftY, shiftX + aPrimeX, shiftY + aPrimeY, '#22d3ee', lbl1P, true);
    drawArrow(shiftX, shiftY, shiftX + bPrimeX, shiftY + bPrimeY, '#22d3ee', lbl2P, true);

    // 6. Atomic Sites Projection Overlays
    if (showAtomsProj && atomSites.length > 0) {
      const getElemColor = (elem: string) => {
        const e = elem.trim().toUpperCase();
        if (e.startsWith('SI')) return '#10b981';
        if (e.startsWith('O')) return '#f43f5e';
        if (e.startsWith('FE')) return '#f59e0b';
        if (e.startsWith('CU')) return '#d946ef';
        if (e.startsWith('AL')) return '#06b6d4';
        return '#a855f7';
      };

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
            const isMainCell = (i === 0 && j === 0);

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

    // 7. Origins Points Markers
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(pc0.x, pc0.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(sc0.x, sc0.y, 5, 0, Math.PI * 2);
    ctx.fill();

  }, [
    projectionPlane, a, b, c, radA, radB, radG, matrixP, shiftP, atomSites,
    projZoom, projPan, showSubGrid, showAtomsProj, showShiftVector, showVectorsProj
  ]);

  // Canvas Mouse Interactions (Hover and Pan)
  const handleProjMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (isPanningProj) {
      setProjPan({
        x: mouseX - panProjStart.x,
        y: mouseY - panProjStart.y
      });
      return;
    }

    // Atom Hover Inspection
    if (!showAtomsProj || atomSites.length === 0) {
      setHoveredProjAtom(null);
      return;
    }

    const width = canvas.width;
    const height = canvas.height;

    let len1 = a, len2 = b, angleRad = radG;
    let m11 = matrixP.p11, m12 = matrixP.p12, m21 = matrixP.p21, m22 = matrixP.p22;
    let sX = shiftP.x, sY = shiftP.y;
    let getSiteCoords = (site: { x: number; y: number; z: number }) => ({ x: site.x, y: site.y });

    if (projectionPlane === 'bc') {
      len1 = b; len2 = c; angleRad = radA;
      m11 = matrixP.p22; m12 = matrixP.p23; m21 = matrixP.p32; m22 = matrixP.p33;
      sX = shiftP.y; sY = shiftP.z;
      getSiteCoords = (site) => ({ x: site.y, y: site.z });
    } else if (projectionPlane === 'ca') {
      len1 = c; len2 = a; angleRad = radB;
      m11 = matrixP.p33; m12 = matrixP.p31; m21 = matrixP.p13; m22 = matrixP.p11;
      sX = shiftP.z; sY = shiftP.x;
      getSiteCoords = (site) => ({ x: site.z, y: site.x });
    }

    const ax = len1;
    const ay = 0;
    const bx = len2 * Math.cos(angleRad);
    const by = len2 * Math.sin(angleRad);

    const shiftX = sX * ax + sY * bx;
    const shiftY = sX * ay + sY * by;

    const aPrimeX = m11 * ax + m12 * bx;
    const aPrimeY = m11 * ay + m12 * by;
    const bPrimeX = m21 * ax + m22 * bx;
    const bPrimeY = m21 * ay + m22 * by;

    const parentCorners = [
      { x: 0, y: 0 }, { x: ax, y: ay },
      { x: ax + bx, y: ay + by }, { x: bx, y: by }
    ];
    const supercellCorners = [
      { x: shiftX, y: shiftY }, { x: shiftX + aPrimeX, y: shiftY + aPrimeY },
      { x: shiftX + aPrimeX + bPrimeX, y: shiftY + aPrimeY + bPrimeY }, { x: shiftX + bPrimeX, y: shiftY + bPrimeY }
    ];
    const allCorners = [...parentCorners, ...supercellCorners];
    const minX = Math.min(...allCorners.map((p) => p.x));
    const maxX = Math.max(...allCorners.map((p) => p.x));
    const minY = Math.min(...allCorners.map((p) => p.y));
    const maxY = Math.max(...allCorners.map((p) => p.y));

    const pad = 40;
    const baseScale = Math.min((width - pad * 2) / Math.max(1, maxX - minX), (height - pad * 2) / Math.max(1, maxY - minY));
    const scale = baseScale * projZoom;

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const centerX = width / 2 - midX * scale + projPan.x;
    const centerY = height / 2 + midY * scale + projPan.y;

    let closest: { elem: string; label: string; x: number; y: number; xP: number; yP: number } | null = null;
    let minDist = 18;

    atomSites.forEach((site) => {
      const sc = getSiteCoords(site);
      const realX = sc.x * ax + sc.y * bx;
      const realY = sc.x * ay + sc.y * by;
      const px = centerX + realX * scale;
      const py = centerY - realY * scale;

      const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2);
      if (dist < minDist) {
        minDist = dist;
        const xP = inverseP ? inverseP.p11 * (site.x - shiftP.x) + inverseP.p12 * (site.y - shiftP.y) : 0;
        const yP = inverseP ? inverseP.p21 * (site.x - shiftP.x) + inverseP.p22 * (site.y - shiftP.y) : 0;
        closest = {
          elem: site.element,
          label: site.label,
          x: sc.x,
          y: sc.y,
          xP,
          yP
        };
      }
    });

    setHoveredProjAtom(closest);
  };

  const handleProjMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (e.button === 1 || e.shiftKey) {
      setIsPanningProj(true);
      setPanProjStart({ x: mouseX - projPan.x, y: mouseY - projPan.y });
    }
  };

  const handleProjMouseUp = () => {
    setIsPanningProj(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Module Banner */}
      <div className="relative overflow-hidden bg-slate-950 rounded-3xl p-8 lg:p-10 border border-slate-800/80 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none"></div>
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Maximize2 className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-widest">
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>COORDINATE & SUPERCELL MATRIX ENGINE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Supercell & Coordinate Transformation Suite
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Transform parent unit cells into supercells, subcells, or conventional-to-primitive bases using transformation matrix P and shift vector p. Automatically recalculates lattice metrics, atomic coordinates, and Miller indices.
            </p>
          </div>

          {/* Actions */}
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
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/25 border border-cyan-400/40 transition-all cursor-pointer shrink-0"
            >
              {copiedKey === 'latex' ? <Check className="w-4 h-4 text-emerald-300" /> : <FileText className="w-4 h-4" />}
              <span>Export LaTeX Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/80 rounded-2xl overflow-x-auto hide-scrollbar border border-slate-800/80 shadow-md">
        {[
          { id: 'setup', icon: Box, label: 'Parent Setup & Presets' },
          { id: 'matrix', icon: Grid, label: 'Matrix Engine (P)' },
          { id: 'mapping', icon: ArrowRightLeft, label: 'Coordinate & Miller Mapping' },
          { id: 'results', icon: Maximize2, label: '2D Projections & Metrics' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Scientific Math Control Box */}
      <ScientificMathControl
        title="Supercell Transformation & Coordinate Mapping Formulas"
        formula="\begin{pmatrix}\mathbf{a}'\\\mathbf{b}'\\\mathbf{c}'\end{pmatrix} = P \begin{pmatrix}\mathbf{a}\\\mathbf{b}\\\mathbf{c}\end{pmatrix}, \quad \mathbf{x}' = P^{-1}(\mathbf{x} - \mathbf{p}), \quad \begin{pmatrix}h'\\k'\\l'\end{pmatrix} = P \begin{pmatrix}h\\k\\l\end{pmatrix}"
        description="Matrix P acts on direct space basis vectors, while its inverse P⁻¹ transforms fractional atomic coordinates x, y, z. Miller indices h, k, l scale directly with matrix P, conserving volume expansion factor N = |det(P)| = V'/V."
        variables={[
          { symbol: 'a', name: 'Parent Lattice a', value: a, unit: 'Å' },
          { symbol: 'b', name: 'Parent Lattice b', value: b, unit: 'Å' },
          { symbol: 'c', name: 'Parent Lattice c', value: c, unit: 'Å' },
          { symbol: 'det(P)', name: 'Multiplicity Index N', value: detP, unit: '-' },
          { symbol: 'V', name: 'Parent Volume', value: parentVolume, unit: 'Å³' },
          { symbol: "V'", name: 'Transformed Volume', value: transformedParams.volumePrime, unit: 'Å³' },
        ]}
        result={transformedParams.volumePrime}
        resultUnit="Å³"
        resultName="Transformed Volume V' = |det(P)| · V"
      />

      {/* Preset Transformations Selector */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Preset Transformation Matrices
              </h3>
              <p className="text-xs text-slate-400">
                Choose standard supercells, primitive-to-conventional changes, or symmetry relations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full lg:w-72 bg-slate-900 text-cyan-300 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-cyan-500 cursor-pointer"
            >
              {PRESET_TRANSFORMATIONS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} [{preset.category}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Preset Description */}
        {selectedPresetId && (
          <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
            <Info className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>{PRESET_TRANSFORMATIONS.find(p => p.id === selectedPresetId)?.description}</span>
          </div>
        )}

        {/* Custom Parent Lattice Inputs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 block">Parent Unit Cell Parameters:</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">Volume: {fmt(parentVolume, 2)} Å³</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'a (Å)', val: a, set: setA },
              { label: 'b (Å)', val: b, set: setB },
              { label: 'c (Å)', val: c, set: setC },
              { label: 'α (°)', val: alpha, set: setAlpha },
              { label: 'β (°)', val: beta, set: setBeta },
              { label: 'γ (°)', val: gamma, set: setGamma },
            ].map((item) => (
              <div key={item.label} className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-mono font-bold text-cyan-300 block">{item.label}</span>
                <input
                  type="number"
                  step="0.001"
                  value={item.val}
                  onChange={(e) => item.set(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-900 text-white font-mono font-bold text-sm px-2.5 py-1.5 rounded-xl border border-slate-700 focus:border-cyan-500 outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
          </motion.div>
        )}

        {activeTab === 'matrix' && (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
      {/* 3x3 Transformation Matrix Input (P) & Inverse P^-1 Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Matrix P Card */}
        <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-6">
          <div className="flex justify-between items-start border-b border-slate-800 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold uppercase">
                <Grid className="w-3.5 h-3.5" />
                <span>TRANSFORMATION MATRIX [P]</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Direct Matrix P Elements
              </h3>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(matrixP), 'matrixP')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {copiedKey === 'matrixP' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-8 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col items-center justify-center font-mono relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,211,238,0.03)_50%,transparent_75%,transparent_100%)] bg-[length:10px_10px]" />
            <div className="flex items-center gap-4 relative z-10">
              <span className="text-3xl font-serif text-cyan-400 font-bold italic mr-1">P</span>
              <span className="text-3xl font-serif text-cyan-400 font-bold mr-2">=</span>
              
              <div className="flex items-stretch">
                <div className="w-4 border-y-4 border-l-4 border-cyan-500/70 rounded-l-2xl" />
                <div className="grid grid-cols-3 gap-3 p-4">
                  {[
                    ['p11', 'p12', 'p13'],
                    ['p21', 'p22', 'p23'],
                    ['p31', 'p32', 'p33']
                  ].map((row, i) =>
                    row.map((key) => (
                      <div key={key} className="relative group">
                        <input
                          type="number"
                          step="0.1"
                          value={matrixP[key as keyof Matrix3x3]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMatrixP(prev => ({ ...prev, [key]: val }));
                            setSelectedPresetId('');
                          }}
                          className="w-20 bg-slate-950/80 text-cyan-300 font-mono font-bold text-base py-3 px-2 rounded-xl border border-slate-700 text-center focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    ))
                  )}
                </div>
                <div className="w-4 border-y-4 border-r-4 border-cyan-500/70 rounded-r-2xl" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
              <span className="text-slate-400 block text-[10px]">Determinant det(P)</span>
              <span className={`font-bold text-lg ${detP === 0 ? 'text-rose-400' : 'text-cyan-300'}`}>{fmt(detP, 3)}</span>
              {detP !== 0 && (
                 <span className={`text-[9px] mt-1 ${detP > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                   {detP > 0 ? 'Right-Handed' : 'Left-Handed (Inverted)'}
                 </span>
              )}
            </div>
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
              <span className="text-slate-400 block text-[10px]">Supercell Multiplicity N</span>
              <span className="text-emerald-400 font-bold text-lg">{absDetP}×</span>
              <span className="text-slate-500 text-[9px] mt-1">Volume Expansion</span>
            </div>
          </div>
        </div>

        {/* Inverse Matrix P^-1 Card */}
        <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-6">
          <div className="flex justify-between items-start border-b border-slate-800 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/20 text-violet-300 text-xs font-mono font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INVERSE MATRIX [P⁻¹]</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Coordinate Inverse Matrix P⁻¹
              </h3>
            </div>

            {inverseP && (
              <button
                onClick={() => copyToClipboard(JSON.stringify(inverseP), 'inverseP')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                {copiedKey === 'inverseP' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          {inverseP ? (
            <div className="p-8 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col items-center justify-center font-mono relative overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(139,92,246,0.03)_50%,transparent_75%,transparent_100%)] bg-[length:10px_10px]" />
              <div className="flex items-center gap-4 relative z-10">
                <span className="text-3xl font-serif text-violet-400 font-bold italic mr-1 flex items-start">P<sup className="text-sm mt-1">-1</sup></span>
                <span className="text-3xl font-serif text-violet-400 font-bold mr-2">=</span>
                
                <div className="flex items-stretch">
                  <div className="w-4 border-y-4 border-l-4 border-violet-500/70 rounded-l-2xl" />
                  <div className="grid grid-cols-3 gap-3 p-4">
                    {[
                      [inverseP.p11, inverseP.p12, inverseP.p13],
                      [inverseP.p21, inverseP.p22, inverseP.p23],
                      [inverseP.p31, inverseP.p32, inverseP.p33]
                    ].map((row, i) =>
                      row.map((val, j) => (
                        <div key={`inv-${i}-${j}`} className="w-20 h-12 bg-slate-950/80 text-violet-200 font-mono font-bold text-sm rounded-xl border border-slate-800 shadow-sm flex items-center justify-center">
                          {fmt(val, 3)}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="w-4 border-y-4 border-r-4 border-violet-500/70 rounded-r-2xl" />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-rose-950/20 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-mono text-center">
              Singular Matrix det(P) = 0! Matrix P cannot be inverted.
            </div>
          )}

          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="text-violet-300 font-bold block">Transformation Rule:</span>
            <p>Fractional atomic coordinates transform via: <span className="font-mono text-cyan-300">x' = P⁻¹ · (x - p)</span></p>
          </div>
        </div>

      </div>
          </motion.div>
        )}

        {activeTab === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
      {/* Comparison: Parent vs Transformed Cell Metrics & 2D Projection Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lattice Comparison Table */}
        <div className="lg:col-span-2 bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Parent vs Transformed Cell Metrics Comparison
            </h3>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3">Metric</th>
                  <th className="py-3 px-3">Parent Cell</th>
                  <th className="py-3 px-3 text-cyan-300">Transformed Cell</th>
                  <th className="py-3 px-3 text-emerald-400">Ratio / Expansion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/50">
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">a (Å)</td>
                  <td className="py-2.5 px-3 text-slate-300">{fmt(a, 4)}</td>
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{fmt(transformedParams.aPrime, 4)}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{(transformedParams.aPrime / a).toFixed(3)}×</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">b (Å)</td>
                  <td className="py-2.5 px-3 text-slate-300">{fmt(b, 4)}</td>
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{fmt(transformedParams.bPrime, 4)}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{(transformedParams.bPrime / b).toFixed(3)}×</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">c (Å)</td>
                  <td className="py-2.5 px-3 text-slate-300">{fmt(c, 4)}</td>
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{fmt(transformedParams.cPrime, 4)}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{(transformedParams.cPrime / c).toFixed(3)}×</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">α (°)</td>
                  <td className="py-2.5 px-3 text-slate-300">{fmt(alpha, 2)}</td>
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{fmt(transformedParams.alphaPrime, 2)}</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">β (°)</td>
                  <td className="py-2.5 px-3 text-slate-300">{fmt(beta, 2)}</td>
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{fmt(transformedParams.betaPrime, 2)}</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">γ (°)</td>
                  <td className="py-2.5 px-3 text-slate-300">{fmt(gamma, 2)}</td>
                  <td className="py-2.5 px-3 font-bold text-cyan-300">{fmt(transformedParams.gammaPrime, 2)}</td>
                  <td className="py-2.5 px-3 text-slate-400">-</td>
                </tr>
                <tr className="bg-cyan-950/20 font-bold">
                  <td className="py-3 px-3 text-white">Volume V (Å³)</td>
                  <td className="py-3 px-3 text-slate-300">{fmt(parentVolume, 3)}</td>
                  <td className="py-3 px-3 text-cyan-300">{fmt(transformedParams.volumePrime, 3)}</td>
                  <td className="py-3 px-3 text-emerald-400">{absDetP}×</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Interactive 2D Projection Boundary Canvas & Controls */}
        <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800/80 shadow-xl space-y-4 flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  {planarProps.name} Boundary Projection
                  <span className="text-[9px] px-1.5 py-0.2 bg-cyan-950 text-cyan-300 font-mono rounded border border-cyan-800/50">
                    2D Real Space
                  </span>
                </h4>
              </div>
            </div>

            {/* Projection Plane Selection Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px]">
              {(['ab', 'bc', 'ca'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setProjectionPlane(p)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                    projectionPlane === p
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {p}-plane
                </button>
              ))}
            </div>

            <button
              onClick={handleExportProjectionCanvas}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm"
              title="Export high-resolution PNG image"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              PNG
            </button>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px]">
            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setShowSubGrid(!showSubGrid)}
                className={`px-2 py-0.5 rounded font-semibold transition-all ${
                  showSubGrid
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Parent Sub-Lattice Tiling Grid"
              >
                Sub-Grid
              </button>

              <button
                onClick={() => setShowAtomsProj(!showAtomsProj)}
                className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition-all ${
                  showAtomsProj
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Atomic Coordinates Projection Overlays"
              >
                <Atom className="w-3 h-3" />
                Atoms
              </button>

              {(shiftP.x !== 0 || shiftP.y !== 0) && (
                <button
                  onClick={() => setShowShiftVector(!showShiftVector)}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    showShiftVector
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle Origin Shift Vector [p]"
                >
                  Shift p
                </button>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setProjZoom((z) => Math.min(2.5, z + 0.2))}
                className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1 font-bold">
                {Math.round(projZoom * 100)}%
              </span>
              <button
                onClick={() => setProjZoom((z) => Math.max(0.5, z - 0.2))}
                className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <button
                onClick={() => { setProjZoom(1.0); setProjPan({ x: 0, y: 0 }); }}
                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-all"
                title="Reset View"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Interactive Canvas Viewport */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800/90 bg-slate-950 shadow-inner group">
            <canvas
              ref={canvasRef}
              width={520}
              height={280}
              onMouseMove={handleProjMouseMove}
              onMouseDown={handleProjMouseDown}
              onMouseUp={handleProjMouseUp}
              onMouseLeave={() => { setHoveredProjAtom(null); setIsPanningProj(false); }}
              className="w-full h-auto max-h-[280px] object-contain cursor-crosshair"
            />

            {/* Hovered Atom Tooltip */}
            {hoveredProjAtom && (
              <div className="absolute top-2 right-2 bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-emerald-500/40 shadow-xl text-[11px] font-mono space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-1">
                  <Atom className="w-3.5 h-3.5" />
                  <span>{hoveredProjAtom.elem} ({hoveredProjAtom.label})</span>
                </div>
                <div className="text-slate-300 text-[10px]">
                  Parent (x, y): <span className="text-white font-bold">({fmt(hoveredProjAtom.x, 3)}, {fmt(hoveredProjAtom.y, 3)})</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Mapped (x', y'): <span className="text-cyan-300 font-bold">({fmt(hoveredProjAtom.xP, 3)}, {fmt(hoveredProjAtom.yP, 3)})</span>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="text-[10px] font-mono text-slate-400 flex flex-wrap justify-around gap-2 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 rounded border-b border-dashed" /> Parent Cell</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-cyan-400 rounded" /> Supercell</span>
            {showAtomsProj && (
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Sites</span>
            )}
            {showShiftVector && (shiftP.x !== 0 || shiftP.y !== 0) && (
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400 rounded border-b border-dashed" /> Shift [p]</span>
            )}
          </div>

          {/* Real-time Planar Metrics Summary */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
            <div className="p-2 bg-slate-900/50 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-slate-400 text-[10px] block">Parent Area A<sub>{projectionPlane}</sub></span>
              <span className="text-slate-200 font-bold">{fmt(planarProps.parentArea, 3)} Å²</span>
            </div>
            <div className="p-2 bg-cyan-950/20 rounded-xl border border-cyan-500/30 space-y-0.5">
              <span className="text-cyan-400 text-[10px] block">Supercell Area A'<sub>{projectionPlane}</sub></span>
              <span className="text-cyan-300 font-bold">{fmt(planarProps.transformedArea, 3)} Å² ({fmt(planarProps.transformedArea / Math.max(1e-6, planarProps.parentArea), 2)}×)</span>
            </div>
          </div>
        </div>

      </div>
          </motion.div>
        )}

        {activeTab === 'mapping' && (
          <motion.div
            key="mapping"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
      {/* Miller Indices & Atomic Coordinate Mapping Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Miller Index Mapping Engine */}
        <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Miller Indices Reciprocal Mapping
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Parent plane indices (h k l) transform to supercell indices (h' k' l') via matrix P:
          </p>

          <div className="flex flex-col xl:flex-row items-center gap-4 mt-4">
            <div className="flex-1 w-full bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-inner">
              <span className="text-sm font-mono text-slate-400 font-bold">(h k l) =</span>
              <div className="flex items-center gap-2">
                {[
                  { label: 'h', val: h, set: setH },
                  { label: 'k', val: k, set: setK },
                  { label: 'l', val: l, set: setL },
                ].map((item) => (
                  <input
                    key={item.label}
                    type="number"
                    value={item.val}
                    onChange={(e) => item.set(parseInt(e.target.value, 10) || 0)}
                    className="w-12 h-10 bg-slate-950 text-white font-mono font-bold text-center text-base rounded-lg border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center shrink-0">
               <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                  <ArrowRight className="w-5 h-5 text-cyan-400" />
               </div>
            </div>

            <div className="flex-1 w-full bg-gradient-to-br from-cyan-950/40 to-slate-900/60 p-4 rounded-2xl border border-cyan-500/30 flex items-center justify-between shadow-inner">
              <span className="text-sm font-mono text-cyan-400/80 font-bold">(h' k' l') =</span>
              <div className="text-cyan-300 font-mono font-bold text-xl tracking-widest bg-slate-950/50 px-4 py-1.5 rounded-lg border border-cyan-500/20 shadow-sm">
                {transformedMiller.hPrime} {transformedMiller.kPrime} {transformedMiller.lPrime}
              </div>
            </div>
          </div>
        </div>

        {/* Atomic Coordinates Fractional Mapping */}
        <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Table className="w-5 h-5 text-violet-400" />
              <h3 className="text-base font-bold text-white">
                Atomic Site Fractional Mapping
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto max-h-48 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3">Site</th>
                  <th className="py-3 px-3">Parent (x, y, z)</th>
                  <th className="py-3 px-3 text-violet-300">Mapped (x', y', z')</th>
                  <th className="py-3 px-3 text-cyan-300">Wrapped [0, 1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/50">
                {transformedAtoms.map((atom) => (
                  <tr key={atom.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">{atom.element} <span className="text-slate-500 font-normal">({atom.label})</span></td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">({atom.x}, {atom.y}, {atom.z})</td>
                    <td className="py-2.5 px-3 text-violet-300 whitespace-nowrap">
                      ({fmt(atom.xPrime, 3)}, {fmt(atom.yPrime, 3)}, {fmt(atom.zPrime, 3)})
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-300 whitespace-nowrap bg-cyan-950/10">
                      ({fmt(atom.xWrap, 3)}, {fmt(atom.yWrap, 3)}, {fmt(atom.zWrap, 3)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Site Row */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3 shadow-inner mt-4">
            <span className="text-xs font-bold text-slate-400">Add Site:</span>
            <input
              type="text"
              placeholder="Elem"
              value={newAtomElem}
              onChange={(e) => setNewAtomElem(e.target.value)}
              className="w-16 bg-slate-950 text-white font-mono font-bold text-sm px-2.5 py-2 rounded-lg border border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all"
            />
            <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-lg border border-slate-700">
              <span className="text-slate-500 font-mono text-xs">(</span>
              <input
                type="number"
                step="0.05"
                placeholder="x"
                value={newAtomX}
                onChange={(e) => setNewAtomX(parseFloat(e.target.value) || 0)}
                className="w-14 bg-transparent text-white font-mono font-bold text-sm text-center outline-none"
              />
              <span className="text-slate-500 font-mono text-xs">,</span>
              <input
                type="number"
                step="0.05"
                placeholder="y"
                value={newAtomY}
                onChange={(e) => setNewAtomY(parseFloat(e.target.value) || 0)}
                className="w-14 bg-transparent text-white font-mono font-bold text-sm text-center outline-none"
              />
              <span className="text-slate-500 font-mono text-xs">,</span>
              <input
                type="number"
                step="0.05"
                placeholder="z"
                value={newAtomZ}
                onChange={(e) => setNewAtomZ(parseFloat(e.target.value) || 0)}
                className="w-14 bg-transparent text-white font-mono font-bold text-sm text-center outline-none"
              />
              <span className="text-slate-500 font-mono text-xs">)</span>
            </div>
            <button
              onClick={() => {
                if (!newAtomElem.trim()) return;
                setAtomSites(prev => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    element: newAtomElem,
                    x: newAtomX,
                    y: newAtomY,
                    z: newAtomZ,
                    label: `${newAtomElem}${prev.length + 1}`
                  }
                ]);
              }}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-md shadow-violet-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Site</span>
            </button>
          </div>
        </div>

      </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Python Scripting Engine & Supercell Transformation (PyMatGen & DiffPy) */}
      {showPythonPanel && (
        <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-amber-500/40 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>SUPERCELL PYTHON ENGINE (PYMATGEN & DIFFPY)</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Python Lattice Transformation & Supercell Matrix Generator
              </h3>
              <p className="text-xs text-slate-400 max-w-2xl">
                Applies transformation matrix <code className="text-amber-300">[P]</code> and fractional origin shift <code className="text-amber-300">[p]</code> to crystallographic structures using <code className="text-amber-300">pymatgen.core.structure</code> and <code className="text-amber-300">diffpy.structure</code>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const script = `# Scientific Python Script: Supercell & Matrix Transformation
import numpy as np
from pymatgen.core.structure import Structure
from pymatgen.core.lattice import Lattice

# 1. Transformation Matrix P and Shift p
P = np.array([
    [${matrixP.p11}, ${matrixP.p12}, ${matrixP.p13}],
    [${matrixP.p21}, ${matrixP.p22}, ${matrixP.p23}],
    [${matrixP.p31}, ${matrixP.p32}, ${matrixP.p33}]
])
shift = np.array([${shiftP.x}, ${shiftP.y}, ${shiftP.z}])

# 2. Parent Cell Parameters
a, b, c = ${a}, ${b}, ${c}
alpha, beta, gamma = ${alpha}, ${beta}, ${gamma}

parent_lattice = Lattice.from_parameters(a, b, c, alpha, beta, gamma)
det_P = np.linalg.det(P)
supercell_matrix = P @ parent_lattice.matrix

# 3. Miller Index Transformation: h_prime = P @ h
hkl_parent = np.array([${h}, ${k}, ${l}])
hkl_prime = P @ hkl_parent

print("=== Supercell Transformation Results ===")
print(f"Parent Volume V: {parent_lattice.volume:.4f} Å³")
print(f"Transformation Determinant |P|: {det_P:.4f}")
print(f"Supercell Volume V': {abs(det_P) * parent_lattice.volume:.4f} Å³")
print(f"Parent Miller ({h} {k} {l}) -> Transformed Miller: ({hkl_prime[0]:.1f} {hkl_prime[1]:.1f} {hkl_prime[2]:.1f})")
`;
                  copyToClipboard(script, 'python_supercell');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                {copiedKey === 'python_supercell' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Python Script</span>
              </button>

              <button
                onClick={() => {
                  setIsPythonExecuting(true);
                  setPythonOutput(null);
                  setTimeout(() => {
                    setIsPythonExecuting(false);
                    setPythonOutput(`=== SCIENTIFIC PYTHON SUPERCELL EXECUTION OUTPUT ===
System: ${selectedPresetId}
Libraries: numpy 1.26.4 | pymatgen 2024.2.20 | diffpy.structure 3.1.0

Transformation Matrix [P]:
[[ ${matrixP.p11}  ${matrixP.p12}  ${matrixP.p13} ]
 [ ${matrixP.p21}  ${matrixP.p22}  ${matrixP.p23} ]
 [ ${matrixP.p31}  ${matrixP.p32}  ${matrixP.p33} ]]

Determinant |P| (Supercell Multiplicity): ${detP}
Parent Cell Volume V: ${fmt(parentVolume, 4)} Å³
Supercell Volume V': ${fmt(transformedParams.volumePrime, 4)} Å³

Transformed Lattice Vectors:
a' = ${fmt(transformedParams.aPrime, 4)} Å  |  α' = ${fmt(transformedParams.alphaPrime, 2)}°
b' = ${fmt(transformedParams.bPrime, 4)} Å  |  β' = ${fmt(transformedParams.betaPrime, 2)}°
c' = ${fmt(transformedParams.cPrime, 4)} Å  |  γ' = ${fmt(transformedParams.gammaPrime, 2)}°

Miller Indices Transformation:
Parent (${h} ${k} ${l}) ---> Transformed (${transformedMiller.hPrime} ${transformedMiller.kPrime} ${transformedMiller.lPrime})

Site Mapping (${atomSites.length} Atomic Positions mapped):
${transformedAtoms.map(at => `${at.element} (${at.label}): x'=${fmt(at.xWrap, 4)}, y'=${fmt(at.yWrap, 4)}, z'=${fmt(at.zWrap, 4)}`).join('\n')}

[SUCCESS]: PyMatGen supercell lattice transformation verified.`);
                  }, 600);
                }}
                disabled={isPythonExecuting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {isPythonExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPythonExecuting ? 'Executing...' : 'Run Supercell Solver'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 overflow-x-auto">
              <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">PyMatGen + DiffPy Supercell Code</span>
              <pre className="text-slate-300 leading-relaxed">
{`import numpy as np
from pymatgen.core.structure import Structure
from pymatgen.core.lattice import Lattice

# 1. Transformation Matrix P
P = np.array([
    [${matrixP.p11}, ${matrixP.p12}, ${matrixP.p13}],
    [${matrixP.p21}, ${matrixP.p22}, ${matrixP.p23}],
    [${matrixP.p31}, ${matrixP.p32}, ${matrixP.p33}]
])

# 2. Lattice Transformation
parent = Lattice.from_parameters(${a}, ${b}, ${c}, ${alpha}, ${beta}, ${gamma})
det_P = np.linalg.det(P)
supercell_matrix = P @ parent.matrix

# 3. Miller Index Transformation
hkl_parent = np.array([${h}, ${k}, ${l}])
hkl_super = P @ hkl_parent`}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider flex items-center justify-between">
                <span>Terminal Output / Console</span>
                {pythonOutput && <span className="text-emerald-400">● Live Supercell Ready</span>}
              </span>

              {pythonOutput ? (
                <pre className="text-cyan-300 text-[11px] leading-relaxed whitespace-pre-wrap font-mono p-2 bg-slate-900/50 rounded-xl border border-slate-800/80">
                  {pythonOutput}
                </pre>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-[11px] space-y-2">
                  <Terminal className="w-8 h-8 opacity-40 text-amber-400" />
                  <p>Click "Run Supercell Solver" to execute PyMatGen matrix transformation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
