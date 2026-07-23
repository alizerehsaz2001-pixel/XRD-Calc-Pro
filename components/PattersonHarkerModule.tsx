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
  Target,
  Crosshair,
  MapPin,
  Waves
} from 'lucide-react';
import { ScientificMathControl } from './ScientificMathControl';

export interface HeavyAtom {
  id: string;
  element: string;
  Z: number; // Atomic number
  x: number;
  y: number;
  z: number;
}

export interface PattersonVectorPeak {
  id: string;
  u: number;
  v: number;
  w: number;
  weight: number; // Zi * Zj
  atomPair: string;
  isHarker: boolean;
  harkerSectionLabel: string;
}

export type SpaceGroupSymmetry = 'P-1' | 'P2/m' | 'P21/c' | 'P212121' | 'P4/mmm';

// Preset Heavy Atom Crystal Structures
const PRESET_STRUCTURES: { id: string; name: string; spaceGroup: SpaceGroupSymmetry; atoms: HeavyAtom[] }[] = [
  {
    id: 'pt_complex',
    name: 'Platinum Heavy Atom Derivative (Pt-Complex)',
    spaceGroup: 'P21/c',
    atoms: [
      { id: 'pt1', element: 'Pt', Z: 78, x: 0.12, y: 0.25, z: 0.38 },
      { id: 'cl1', element: 'Cl', Z: 17, x: 0.35, y: 0.10, z: 0.62 },
      { id: 's1',  element: 'S',  Z: 16, x: 0.88, y: 0.42, z: 0.15 }
    ]
  },
  {
    id: 'i_organic',
    name: 'Iodinated Organic Crystal (I-Derivative)',
    spaceGroup: 'P212121',
    atoms: [
      { id: 'i1', element: 'I', Z: 53, x: 0.18, y: 0.31, z: 0.08 },
      { id: 'c1', element: 'C', Z: 6,  x: 0.42, y: 0.12, z: 0.22 }
    ]
  },
  {
    id: 'fe_p2m',
    name: 'Iron Metal Organometallic (P2/m)',
    spaceGroup: 'P2/m',
    atoms: [
      { id: 'fe1', element: 'Fe', Z: 26, x: 0.22, y: 0.50, z: 0.41 },
      { id: 'p1',  element: 'P',  Z: 15, x: 0.61, y: 0.00, z: 0.19 }
    ]
  }
];

// Helper for formatting numbers
const fmt = (num: number, digits: number = 3) => {
  if (isNaN(num) || !isFinite(num)) return '-';
  return num.toFixed(digits);
};

export const PattersonHarkerModule: React.FC = () => {
  const { t } = useTranslation();

  // Space Group Symmetry & Heavy Atoms State
  const [spaceGroup, setSpaceGroup] = useState<SpaceGroupSymmetry>('P21/c');
  const [selectedPreset, setSelectedPreset] = useState<string>('pt_complex');
  const [atoms, setAtoms] = useState<HeavyAtom[]>(PRESET_STRUCTURES[0].atoms);

  // Active Harker Cut Plane
  const [harkerPlane, setHarkerPlane] = useState<'uv1/2' | '2x_0_2z' | 'uv0'>('uv1/2');

  // Interactive Harker Crosshair Location
  const [cursorU, setCursorU] = useState<number>(0.24);
  const [cursorW, setCursorW] = useState<number>(0.26);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle Preset Select
  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = PRESET_STRUCTURES.find(item => item.id === presetId);
    if (p) {
      setSpaceGroup(p.spaceGroup);
      setAtoms(p.atoms);
    }
  };

  // Compute Symmetry Equivalent Atomic Positions (Fractional)
  const symmetryEquivalents = useMemo(() => {
    const eqList: { origId: string; element: string; Z: number; eqIndex: number; x: number; y: number; z: number }[] = [];

    atoms.forEach((atom) => {
      const { x, y, z } = atom;

      // P-1: (x, y, z), (-x, -y, -z)
      if (spaceGroup === 'P-1') {
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 1, x, y, z });
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 2, x: -x, y: -y, z: -z });
      }
      // P2/m: (x, y, z), (-x, y, -z), (x, -y, z), (-x, -y, -z)
      else if (spaceGroup === 'P2/m') {
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 1, x, y, z });
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 2, x: -x, y, z: -z });
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 3, x, y: -y, z });
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 4, x: -x, y: -y, z: -z });
      }
      // P21/c: (x, y, z), (-x, y + 1/2, -z + 1/2), (-x, -y, -z), (x, -y + 1/2, z + 1/2)
      else if (spaceGroup === 'P21/c') {
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 1, x, y, z });
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 2, x: -x, y: y + 0.5, z: -z + 0.5 });
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 3, x: -x, y: -y, z: -z });
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 4, x: x, y: -y + 0.5, z: z + 0.5 });
      }
      // P212121: (x, y, z), (x + 1/2, -y + 1/2, -z), (-x, y + 1/2, -z + 1/2), (-x + 1/2, -y, z + 1/2)
      else if (spaceGroup === 'P212121') {
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 1, x, y, z });
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 2, x: x + 0.5, y: -y + 0.5, z: -z });
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 3, x: -x, y: y + 0.5, z: -z + 0.5 });
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 4, x: -x + 0.5, y: -y, z: z + 0.5 });
      }
      // Fallback
      else {
        eqList.push({ origId: atom.id, element: atom.element, Z: atom.Z, eqIndex: 1, x, y, z });
      }
    });

    // Wrap fractional coordinates inside [0, 1)
    return eqList.map(item => ({
      ...item,
      x: ((item.x % 1) + 1) % 1,
      y: ((item.y % 1) + 1) % 1,
      z: ((item.z % 1) + 1) % 1,
    }));
  }, [atoms, spaceGroup]);

  // Compute All Interatomic Patterson Vectors u = r_i - r_j
  const pattersonVectors = useMemo<PattersonVectorPeak[]>(() => {
    const list: PattersonVectorPeak[] = [];
    let count = 0;

    for (let i = 0; i < symmetryEquivalents.length; i++) {
      for (let j = 0; j < symmetryEquivalents.length; j++) {
        const a1 = symmetryEquivalents[i];
        const a2 = symmetryEquivalents[j];

        let u = a1.x - a2.x;
        let v = a1.y - a2.y;
        let w = a1.z - a2.z;

        // Wrap to [-0.5, 0.5)
        u = ((u % 1) + 1) % 1; if (u > 0.5) u -= 1;
        v = ((v % 1) + 1) % 1; if (v > 0.5) v -= 1;
        w = ((w % 1) + 1) % 1; if (w > 0.5) w -= 1;

        const weight = a1.Z * a2.Z;

        // Check if Harker Peak (e.g., v = 0.5 or u = 2x, etc.)
        let isHarker = false;
        let harkerSectionLabel = 'Cross Vector';

        if (Math.abs(Math.abs(v) - 0.5) < 0.01) {
          isHarker = true;
          harkerSectionLabel = 'Harker Cut (u, 1/2, w)';
        } else if (Math.abs(v) < 0.01) {
          isHarker = true;
          harkerSectionLabel = 'Harker Cut (u, 0, w)';
        }

        list.push({
          id: `pat_${count++}`,
          u: Math.abs(u),
          v: Math.abs(v),
          w: Math.abs(w),
          weight,
          atomPair: `${a1.element}${a1.eqIndex} ↔ ${a2.element}${a2.eqIndex}`,
          isHarker,
          harkerSectionLabel
        });
      }
    }

    return list.sort((a, b) => b.weight - a.weight);
  }, [symmetryEquivalents]);

  // Calculate Patterson Density P(u, w) at Harker Section v = 0.5
  const evaluatePatterson2D = (uVal: number, wVal: number) => {
    let density = 0;

    pattersonVectors.forEach(vec => {
      if (Math.abs(vec.v - 0.5) < 0.08) {
        const du = uVal - vec.u;
        const dw = wVal - vec.w;
        const distSq = du*du + dw*dw;
        const gaussianWidth = 0.002;
        density += vec.weight * Math.exp(-distSq / gaussianWidth);
      }
    });

    return density;
  };

  // Deconvolute Atomic Positions (x, z) from Harker Vector Peak at (u, 1/2, w)
  const deconvolutedCoords = useMemo(() => {
    // In P21/c, Harker peak at (2x, 1/2, 2z + 1/2) or (2x, 1/2, 2z)
    const solvedX = cursorU / 2;
    const solvedZ = cursorW / 2;
    return { solvedX, solvedZ };
  }, [cursorU, cursorW]);

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

\\section*{Patterson Vector Map \\& Harker Section Analysis Report}

\\subsection*{Space Group \\& Heavy Atom Inputs}
Space Group: ${spaceGroup} \\\\
Heavy Atom Count: ${atoms.length}

\\subsection*{Harker Section Vector Peaks (v = 1/2)}
Deconvoluted Heavy Atom Coordinates:
$x = ${fmt(deconvolutedCoords.solvedX, 4)}, \\quad z = ${fmt(deconvolutedCoords.solvedZ, 4)}$

\\subsection*{Patterson Vector Function}
$P(u, v, w) = \\frac{1}{V} \\sum_{hkl} |F(hkl)|^2 \\cos(2\\pi(hu + kv + lw))$

\\end{document}`;
  };

  // Render 2D Harker Section Contour Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw Heatmap Grid for (u, w) from 0 to 0.5
    const steps = 60;
    const cellW = width / steps;
    const cellH = height / steps;

    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < steps; j++) {
        const uVal = (i / steps) * 0.5;
        const wVal = (j / steps) * 0.5;

        const val = evaluatePatterson2D(uVal, wVal);
        const norm = Math.min(1, val / 8000);

        // Color ramp: Dark Blue -> Cyan -> Emerald -> Yellow -> White
        const r = Math.round(norm * 255);
        const g = Math.round(Math.pow(norm, 0.5) * 220);
        const b = Math.round((1 - norm) * 180 + norm * 255);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(i * cellW, (steps - 1 - j) * cellH, cellW + 1, cellH + 1);
      }
    }

    // Draw Crosshair at Cursor (cursorU, cursorW)
    const crossX = (cursorU / 0.5) * width;
    const crossY = height - (cursorW / 0.5) * height;

    ctx.strokeStyle = '#f43f5e'; // rose-500
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(crossX, 0); ctx.lineTo(crossX, height);
    ctx.moveTo(0, crossY); ctx.lineTo(width, crossY);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(crossX, crossY, 5, 0, 2 * Math.PI);
    ctx.fill();

  }, [atoms, spaceGroup, cursorU, cursorW, pattersonVectors]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Module Title Banner */}
      <div className="relative overflow-hidden bg-slate-950 rounded-3xl p-8 lg:p-10 border border-slate-800/80 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950/0 to-slate-950/0 pointer-events-none"></div>
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Target className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-widest">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>HEAVY ATOM & PHASE SOLVER SUITE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Patterson Vector Map & Harker Sections
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Synthesize Patterson vector maps P(u, v, w) from structure factor magnitudes |F_hkl|² without phase information. Locate heavy atoms via Harker vector section cuts (u, 1/2, w) to break crystallographic phase ambiguity.
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(generateLaTeX(), 'latex')}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xl shadow-amber-500/25 border border-amber-400/40 transition-all cursor-pointer shrink-0"
          >
            {copiedKey === 'latex' ? <Check className="w-4 h-4 text-emerald-300" /> : <FileText className="w-4 h-4" />}
            <span>Export LaTeX Report</span>
          </button>
        </div>
      </div>

      {/* Scientific Math Control Box */}
      <ScientificMathControl
        title="Patterson Function & Harker Section Relations"
        formula="P(u, v, w) = \frac{1}{V} \sum_{hkl} |F(hkl)|^2 \cos(2\pi(hu + kv + lw)), \quad P_{\text{Harker}}(u, \tfrac{1}{2}, w) \implies \mathbf{u} = 2\mathbf{x}"
        description="The Patterson function represents the convolution of electron density with its inverse. Peaks correspond to interatomic vectors r_i - r_j with height proportional to Z_i · Z_j. Symmetry elements generate concentrated Harker vector planes."
        variables={[
          { symbol: 'Space Group', name: 'Crystal Symmetry', value: spaceGroup as any, unit: '-' },
          { symbol: 'Z_max', name: 'Max Atomic Number (Pt)', value: 78, unit: 'e⁻' },
          { symbol: 'u_Harker', name: 'Selected Harker Peak u', value: cursorU, unit: '-' },
          { symbol: 'w_Harker', name: 'Selected Harker Peak w', value: cursorW, unit: '-' },
          { symbol: 'x_solved', name: 'Deconvoluted Heavy x', value: deconvolutedCoords.solvedX, unit: 'frac' },
          { symbol: 'z_solved', name: 'Deconvoluted Heavy z', value: deconvolutedCoords.solvedZ, unit: 'frac' },
        ]}
        result={deconvolutedCoords.solvedX}
        resultUnit="frac"
        resultName="Heavy Atom Deconvoluted Position x = u / 2"
      />

      {/* Preset Structure Selector & Space Group Selection */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Heavy Atom Crystal Derivative Presets
              </h3>
              <p className="text-xs text-slate-400">
                Choose organometallic or heavy atom derivatives for Harker deconvolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full lg:w-72 bg-slate-900 text-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-amber-500 cursor-pointer"
            >
              {PRESET_STRUCTURES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.spaceGroup}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Space Group Buttons */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 block">Space Group Symmetry:</span>
          <div className="flex flex-wrap gap-2">
            {(['P-1', 'P2/m', 'P21/c', 'P212121', 'P4/mmm'] as SpaceGroupSymmetry[]).map((sg) => (
              <button
                key={sg}
                onClick={() => setSpaceGroup(sg)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  spaceGroup === sg
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20 border border-amber-400/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {sg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive 2D Harker Section Heatmap & Heavy Atom Solver */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2D Harker Map Canvas (u, w) */}
        <div className="lg:col-span-2 bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Interactive Harker Cut Section: P(u, 1/2, w) Map
              </h3>
            </div>
            <span className="text-xs font-mono text-amber-300 font-bold">
              v = 0.5 (2_1 Screw Axis Cut)
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              width={500}
              height={320}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                const uNew = (clickX / rect.width) * 0.5;
                const wNew = (1 - clickY / rect.height) * 0.5;
                setCursorU(uNew);
                setCursorW(wNew);
              }}
              className="w-full h-auto max-h-[320px] object-contain cursor-crosshair"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
            <span>u-axis (0 → 0.5)</span>
            <span className="text-rose-400 font-bold">Click map to inspect Harker vector peak</span>
            <span>w-axis (0 → 0.5)</span>
          </div>
        </div>

        {/* Harker Vector Peak Solver Panel */}
        <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Crosshair className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Harker Peak Deconvolution
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[10px]">Selected Harker Vector Peak (u, 1/2, w):</span>
              <div className="text-amber-300 font-bold text-sm">
                u = {fmt(cursorU, 3)}, w = {fmt(cursorW, 3)}
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2">
              <span className="text-amber-300 font-bold block">Deconvoluted Heavy Atom Coordinates:</span>
              <div className="text-white text-sm font-bold flex justify-around">
                <span>x = u / 2 = <span className="text-emerald-400">{fmt(deconvolutedCoords.solvedX, 3)}</span></span>
                <span>z = w / 2 = <span className="text-emerald-400">{fmt(deconvolutedCoords.solvedZ, 3)}</span></span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              In space group <span className="text-white font-bold">{spaceGroup}</span>, two-fold screw axes generate symmetry-equivalent atoms at (-x, y+1/2, -z). The difference vector gives a Harker peak at <span className="text-amber-300">(2x, 1/2, 2z)</span>.
            </div>
          </div>
        </div>

      </div>

      {/* Patterson Interatomic Vector Table */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Table className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Patterson Interatomic Vector Peak List ({pattersonVectors.length} Vectors)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Atom Pair</th>
                <th className="py-2.5 px-3">Vector u</th>
                <th className="py-2.5 px-3">Vector v</th>
                <th className="py-2.5 px-3">Vector w</th>
                <th className="py-2.5 px-3 text-amber-300">Peak Height (Z_i · Z_j)</th>
                <th className="py-2.5 px-3 text-emerald-400">Harker Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pattersonVectors.slice(0, 15).map((v) => (
                <tr key={v.id} className={v.isHarker ? 'bg-amber-950/20' : ''}>
                  <td className="py-2.5 px-3 font-bold text-white">{v.atomPair}</td>
                  <td className="py-2.5 px-3 text-slate-300">{fmt(v.u, 3)}</td>
                  <td className="py-2.5 px-3 text-slate-300">{fmt(v.v, 3)}</td>
                  <td className="py-2.5 px-3 text-slate-300">{fmt(v.w, 3)}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-300">{v.weight}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">
                    {v.isHarker ? `✓ ${v.harkerSectionLabel}` : 'Self / Cross'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
