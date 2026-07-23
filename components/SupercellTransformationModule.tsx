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
  Flame,
  CornerDownRight,
  Maximize,
  ArrowRightLeft,
  Plus
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

export const SupercellTransformationModule: React.FC = () => {
  const { t } = useTranslation();

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

  // Canvas Drawing Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i < height; i += 20) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    const centerX = 80;
    const centerY = height - 80;
    const scale = 35;

    // Parent vectors projection on XY
    const ax = a * scale;
    const ay = 0;
    const bx = b * scale * Math.cos(radG);
    const by = -b * scale * Math.sin(radG);

    // Parent cell background fill
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + ax, centerY + ay);
    ctx.lineTo(centerX + ax + bx, centerY + ay + by);
    ctx.lineTo(centerX + bx, centerY + by);
    ctx.closePath();
    ctx.fill();

    // Parent cell boundary
    ctx.strokeStyle = '#3b82f6'; // blue-500
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + ax, centerY + ay);
    ctx.lineTo(centerX + ax + bx, centerY + ay + by);
    ctx.lineTo(centerX + bx, centerY + by);
    ctx.closePath();
    ctx.stroke();

    // Transformed vectors a' and b'
    const aPrimeX = matrixP.p11 * ax + matrixP.p12 * bx;
    const aPrimeY = matrixP.p11 * ay + matrixP.p12 * by;
    const bPrimeX = matrixP.p21 * ax + matrixP.p22 * bx;
    const bPrimeY = matrixP.p21 * ay + matrixP.p22 * by;

    // Transformed supercell background fill
    ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + aPrimeX, centerY + aPrimeY);
    ctx.lineTo(centerX + aPrimeX + bPrimeX, centerY + aPrimeY + bPrimeY);
    ctx.lineTo(centerX + bPrimeX, centerY + bPrimeY);
    ctx.closePath();
    ctx.fill();

    // Transformed supercell boundary (Solid Cyan)
    ctx.setLineDash([]);
    ctx.strokeStyle = '#22d3ee'; // cyan-400
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + aPrimeX, centerY + aPrimeY);
    ctx.lineTo(centerX + aPrimeX + bPrimeX, centerY + aPrimeY + bPrimeY);
    ctx.lineTo(centerX + bPrimeX, centerY + bPrimeY);
    ctx.closePath();
    ctx.stroke();

    // Origin point
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Vector arrows
    const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, color: string, label: string) => {
      const headlen = 10;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const angle = Math.atan2(dy, dx);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
      
      ctx.fillStyle = color;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(label, toX + 8, toY + 8);
    };

    drawArrow(centerX, centerY, centerX + ax, centerY + ay, '#3b82f6', 'a');
    drawArrow(centerX, centerY, centerX + bx, centerY + by, '#3b82f6', 'b');
    drawArrow(centerX, centerY, centerX + aPrimeX, centerY + aPrimeY, '#22d3ee', "a'");
    drawArrow(centerX, centerY, centerX + bPrimeX, centerY + bPrimeY, '#22d3ee', "b'");

  }, [a, b, c, radG, matrixP]);

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

          <button
            onClick={() => copyToClipboard(generateLaTeX(), 'latex')}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/25 border border-cyan-400/40 transition-all cursor-pointer shrink-0"
          >
            {copiedKey === 'latex' ? <Check className="w-4 h-4 text-emerald-300" /> : <FileText className="w-4 h-4" />}
            <span>Export LaTeX Report</span>
          </button>
        </div>
      </div>

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
          <span className="text-xs font-bold text-slate-300 block">Parent Unit Cell Parameters:</span>
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
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Determinant det(P)</span>
              <span className={`font-bold text-sm ${detP === 0 ? 'text-rose-400' : 'text-cyan-300'}`}>{fmt(detP, 3)}</span>
            </div>
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-400 block text-[10px]">Supercell Multiplicity N</span>
              <span className="text-emerald-400 font-bold text-sm">{absDetP}×</span>
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

        {/* 2D Projection Boundary Canvas */}
        <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800/80 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white">ab-Plane Boundary Projection</span>
            <span className="text-[10px] font-mono text-cyan-400">Supercell Boundary</span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              width={280}
              height={220}
              className="w-full h-auto max-h-[220px] object-contain"
            />
          </div>

          <div className="text-[10px] font-mono text-slate-400 text-center flex justify-around">
            <span className="text-blue-400">-- Parent Cell</span>
            <span className="text-cyan-300">━ Transformed Cell</span>
          </div>
        </div>

      </div>

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

    </div>
  );
};
