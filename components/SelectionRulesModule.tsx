import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CrystalSystem, SelectionRuleResult } from '../types';
import { parseHKLString, validateSelectionRule } from '../utils/physics';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, XCircle, Info, RefreshCw, Filter, BookOpen, 
  Layers, Zap, ChevronDown, Check, Maximize, RotateCw, 
  Split, CircleDot, ShieldQuestion, Loader2, Atom, Binary, Beaker,
  Network, Hexagon, Component, Box, Cuboid, Pyramid, Download
} from 'lucide-react';

export const SelectionRulesModule: React.FC = () => {
  const [system, setSystem] = useState<CrystalSystem>('FCC');
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [hklInput, setHklInput] = useState<string>('1 0 0, 1 1 0, 1 1 1, 2 0 0, 2 1 0, 2 2 0, 3 1 1');
  const [results, setResults] = useState<SelectionRuleResult[]>([]);
  const [filter, setFilter] = useState<'All' | 'Allowed' | 'Forbidden'>('All');
  const [maxIndex, setMaxIndex] = useState<number>(3);
  const menuRef = useRef<HTMLDivElement>(null);

  const [symmetryTab, setSymmetryTab] = useState<'visualizer' | 'properties' | 'sandbox'>('visualizer');
  const [showLatticeOutline, setShowLatticeOutline] = useState(true);
  const [showSymmetryAxes, setShowSymmetryAxes] = useState(true);
  const [showMirrorPlanes, setShowMirrorPlanes] = useState(true);
  const [showInversionCenter, setShowInversionCenter] = useState(true);
  
  const [sandboxH, setSandboxH] = useState(1);
  const [sandboxK, setSandboxK] = useState(1);
  const [sandboxL, setSandboxL] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSystemMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const systemGroups = [
    {
      label: 'Cubic',
      icon: <Box className="w-4 h-4" />,
      options: [
        { value: 'SC', label: 'Simple Cubic', badge: 'P', color: 'text-emerald-400' },
        { value: 'BCC', label: 'Body-Centered', badge: 'I', color: 'text-emerald-400' },
        { value: 'FCC', label: 'Face-Centered', badge: 'F', color: 'text-emerald-400' },
        { value: 'Diamond', label: 'Diamond', badge: 'Fd-3m', color: 'text-emerald-400' }
      ]
    },
    {
      label: 'Hexagonal',
      icon: <Hexagon className="w-4 h-4" />,
      options: [
        { value: 'Hexagonal', label: 'Hexagonal', badge: 'HCP', color: 'text-amber-400' }
      ]
    },
    {
      label: 'Tetragonal',
      icon: <Pyramid className="w-4 h-4" />,
      options: [
        { value: 'Tetragonal', label: 'Primitive', badge: 'P', color: 'text-blue-400' },
        { value: 'Tetragonal_I', label: 'Body-Centered', badge: 'I', color: 'text-blue-400' }
      ]
    },
    {
      label: 'Orthorhombic',
      icon: <Cuboid className="w-4 h-4" />,
      options: [
        { value: 'Orthorhombic', label: 'Primitive', badge: 'P', color: 'text-rose-400' },
        { value: 'Orthorhombic_F', label: 'Face-Centered', badge: 'F', color: 'text-rose-400' },
        { value: 'Orthorhombic_C', label: 'Base-Centered', badge: 'C', color: 'text-rose-400' }
      ]
    }
  ];

  const handleValidate = () => {
    const hklList = parseHKLString(hklInput);
    const validationResults = hklList.map(hkl => validateSelectionRule(system, hkl));
    setResults(validationResults);
  };

  const generateHKLs = () => {
    const newHKLs: string[] = [];
    for (let h = 0; h <= maxIndex; h++) {
      for (let k = 0; k <= maxIndex; k++) {
        for (let l = 0; l <= maxIndex; l++) {
          if (h === 0 && k === 0 && l === 0) continue;
          newHKLs.push(`${h} ${k} ${l}`);
        }
      }
    }
    setHklInput(newHKLs.join(', '));
  };

  useEffect(() => {
    handleValidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system]);

  const handleSave = () => {
    if (results.length === 0) return;
    
    const csvHeader = "Reflection (h k l),Status,Reason\n";
    const csvRows = results.map(res => 
      `"(${res.hkl.join(' ')})","${res.status}","${res.reason.replace(/"/g, '""')}"`
    ).join("\n");
    
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `validation_results_${system}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = useMemo(() => {
    if (filter === 'All') return results;
    return results.filter(r => r.status === filter);
  }, [results, filter]);

  const systemDetails = {
    SC: {
      title: "Simple Cubic (SC)",
      rule: "All (h k l) are allowed.",
      origin: "The primitive unit cell has only one lattice point at (0,0,0). No destructive interference occurs between basis atoms.",
      formula: "F(hkl) = f",
      examples: "Polonium (Po), Pyrite (FeS2 - Pa3)"
    },
    BCC: {
      title: "Body-Centered Cubic (BCC)",
      rule: "h + k + l must be even.",
      origin: "Lattice points at (0,0,0) and (½,½,½). Destructive interference occurs when the phase difference is π (odd sum).",
      formula: "F(hkl) = f[1 + exp(πi(h+k+l))]",
      examples: "Iron (α-Fe), Chromium (Cr), Tungsten (W), Sodium (Na)"
    },
    FCC: {
      title: "Face-Centered Cubic (FCC)",
      rule: "h, k, l must be all even or all odd.",
      origin: "Lattice points at (0,0,0), (½,½,0), (½,0,½), (0,½,½). Mixed parity leads to total destructive interference.",
      formula: "F(hkl) = f[1 + e^{πi(h+k)} + e^{πi(h+l)} + e^{πi(k+l)}]",
      examples: "Aluminum (Al), Copper (Cu), Gold (Au), Silver (Ag), Nickel (Ni)"
    },
    Diamond: {
      title: "Diamond Cubic",
      rule: "FCC rules + if all even, h+k+l must be divisible by 4.",
      origin: "Basis of two atoms at (0,0,0) and (¼,¼,¼) combined with FCC lattice. This adds extra extinctions (e.g., 200 forbidden).",
      formula: "F(hkl) = F_{FCC} [1 + exp(πi/2(h+k+l))]",
      examples: "Silicon (Si), Germanium (Ge), Diamond (C)"
    },
    Hexagonal: {
      title: "Hexagonal Close Packed (HCP)",
      rule: "Forbidden if l is odd AND (h + 2k) is divisible by 3.",
      origin: "Basis of two atoms at (0,0,0) and (2/3, 1/3, 1/2) in a primitive hexagonal cell.",
      formula: "F(hkl) = f[1 + exp(2πi(h/3 + 2k/3 + l/2))]",
      examples: "Magnesium (Mg), Titanium (Ti), Zinc (Zn)"
    },
    Tetragonal: {
      title: "Tetragonal (Primitive)",
      rule: "All (h k l) are allowed.",
      origin: "Primitive cell with lattice points only at corners. No centering to cause destructive interference.",
      formula: "F(hkl) = f",
      examples: "Rutile (TiO2), Stishovite (SiO2)"
    },
    Tetragonal_I: {
      title: "Tetragonal (Body Centered)",
      rule: "h + k + l must be even.",
      origin: "Lattice points at (0,0,0) and (½,½,½). Same extinction condition as BCC.",
      formula: "F(hkl) = f[1 + exp(πi(h+k+l))]",
      examples: "Anatase (TiO2), Tin (White Sn)"
    },
    Orthorhombic: {
      title: "Orthorhombic (Primitive)",
      rule: "All (h k l) are allowed.",
      origin: "Primitive cell with lattice points only at corners.",
      formula: "F(hkl) = f",
      examples: "Topaz, Aragonite (CaCO3), Sulfur (α-S)"
    },
    Orthorhombic_F: {
      title: "Orthorhombic (Face Centered)",
      rule: "h, k, l must be all even or all odd.",
      origin: "Lattice points at faces. Same extinction condition as FCC.",
      formula: "F(hkl) = f[1 + e^{πi(h+k)} + e^{πi(h+l)} + e^{πi(k+l)}]",
      examples: "Gallium (Ga - pseudo-orthorhombic)"
    },
    Orthorhombic_C: {
      title: "Orthorhombic (Base Centered C)",
      rule: "h + k must be even.",
      origin: "Lattice points at (0,0,0) and (½,½,0). Centering on C-face causes extinction when h+k is odd.",
      formula: "F(hkl) = f[1 + exp(πi(h+k))]",
      examples: "Alpha-Uranium (α-U)"
    }
  };

  const symmetryDetails: Record<CrystalSystem, {
    rotation: string[];
    reflection: string;
    inversion: boolean;
    identity: string;
    group: string;
    operations: number;
    description: string;
  }> = {
    SC: {
      group: "m-3m (Oh)",
      operations: 48,
      rotation: ["3 x 4-fold (Axes)", "4 x 3-fold (Diagonals)", "6 x 2-fold (Edges)"],
      reflection: "9 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Highest possible crystallographic symmetry. Point group includes full octahedral symmetry."
    },
    BCC: {
      group: "m-3m (Oh)",
      operations: 48,
      rotation: ["3 x 4-fold", "4 x 3-fold", "6 x 2-fold"],
      reflection: "9 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Shares the same point group as SC, but lattice translations differ."
    },
    FCC: {
      group: "m-3m (Oh)",
      operations: 48,
      rotation: ["3 x 4-fold", "4 x 3-fold", "6 x 2-fold"],
      reflection: "9 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Shares the same point group as SC, but with face-centering translations."
    },
    Diamond: {
      group: "m-3m (Oh)",
      operations: 48,
      rotation: ["3 x 4-fold", "4 x 3-fold", "6 x 2-fold"],
      reflection: "9 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "The diamond structure belongs to the Fd-3m space group, sharing the O_h point group."
    },
    Hexagonal: {
      group: "6/mmm (D6h)",
      operations: 24,
      rotation: ["1 x 6-fold (c-axis)", "6 x 2-fold (basal)"],
      reflection: "7 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Hexagonal symmetry requires a 6-fold rotation axis. Characteristic of close-packed HCP."
    },
    Tetragonal: {
      group: "4/mmm (D4h)",
      operations: 16,
      rotation: ["1 x 4-fold (c-axis)", "4 x 2-fold"],
      reflection: "5 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Symmetry is reduced from cubic by stretching one axis. Retains one 4-fold axis."
    },
    Tetragonal_I: {
      group: "4/mmm (D4h)",
      operations: 16,
      rotation: ["1 x 4-fold", "4 x 2-fold"],
      reflection: "5 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Body-centered tetragonal lattice with full 4/mmm point symmetry."
    },
    Orthorhombic: {
      group: "mmm (D2h)",
      operations: 8,
      rotation: ["3 x 2-fold (Orthogonal)"],
      reflection: "3 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Three mutually perpendicular 2-fold axes. Low symmetry relative to cubic."
    },
    Orthorhombic_F: {
      group: "mmm (D2h)",
      operations: 8,
      rotation: ["3 x 2-fold"],
      reflection: "3 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Face-centered variant of the orthorhombic lattice system."
    },
    Orthorhombic_C: {
      group: "mmm (D2h)",
      operations: 8,
      rotation: ["3 x 2-fold"],
      reflection: "3 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Base-centered variant of the orthorhombic lattice system."
    },
    Cubic: {
      group: "m-3m (Oh)",
      operations: 48,
      rotation: ["3 x 4-fold", "4 x 3-fold", "6 x 2-fold"],
      reflection: "9 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "General cubic point group symmetry. Highest density of symmetry operations."
    },
    Monoclinic: {
      group: "2/m (C2h)",
      operations: 4,
      rotation: ["1 x 2-fold (b-axis)"],
      reflection: "1 Mirror Plane",
      inversion: true,
      identity: "1",
      description: "Symmetry follows reaching a single 2-fold axis and a perpendicular mirror plane."
    },
    Triclinic: {
      group: "-1 (Ci)",
      operations: 2,
      rotation: ["None (except identity)"],
      reflection: "No Planes",
      inversion: true,
      identity: "1",
      description: "Lowest possible symmetry. Contains only inversion and identity."
    }
  };

  const generateEquivalentPlanes = (h: number, k: number, l: number, system: CrystalSystem): string[] => {
    const uniq = new Set<string>();
    const add = (x: number, y: number, z: number) => {
      uniq.add(`(${x}, ${y}, ${z})`);
    };

    const cubicPermutations = (x: number, y: number, z: number) => {
      const signs = [-1, 1];
      for (const sx of signs) {
        for (const sy of signs) {
          for (const sz of signs) {
            const px = x * sx;
            const py = y * sy;
            const pz = z * sz;
            add(px, py, pz);
            add(px, pz, py);
            add(py, px, pz);
            add(py, pz, px);
            add(pz, px, py);
            add(pz, py, px);
          }
        }
      }
    };

    const tetragonalPermutations = (x: number, y: number, z: number) => {
      const signs = [-1, 1];
      for (const sx of signs) {
        for (const sy of signs) {
          for (const sz of signs) {
            const px = x * sx;
            const py = y * sy;
            const pz = z * sz;
            add(px, py, pz);
            add(py, px, pz);
          }
        }
      }
    };

    const hexagonalPermutations = (x: number, y: number, z: number) => {
      const base = [
        [x, y, z],
        [-y, x + y, z],
        [-x - y, x, z],
        [-x, -y, z],
        [y, -x - y, z],
        [x + y, -x, z],
        [y, x, -z],
        [-x, x + y, -z],
        [-x - y, y, -z],
        [-y, -x, -z],
        [x, -x - y, -z],
        [x + y, -y, -z]
      ];
      for (const [v1, v2, v3] of base) {
        add(v1, v2, v3);
        add(-v1, -v2, -v3);
      }
    };

    const orthorhombicPermutations = (x: number, y: number, z: number) => {
      const signs = [-1, 1];
      for (const sx of signs) {
        for (const sy of signs) {
          for (const sz of signs) {
            add(x * sx, y * sy, z * sz);
          }
        }
      }
    };

    const monoclinicPermutations = (x: number, y: number, z: number) => {
      add(x, y, z);
      add(-x, y, -z);
      add(-x, -y, -z);
      add(x, -y, z);
    };

    const triclinicPermutations = (x: number, y: number, z: number) => {
      add(x, y, z);
      add(-x, -y, -z);
    };

    if (['Cubic', 'SC', 'BCC', 'FCC', 'Diamond'].includes(system)) {
      cubicPermutations(h, k, l);
    } else if (['Tetragonal', 'Tetragonal_I'].includes(system)) {
      tetragonalPermutations(h, k, l);
    } else if (system === 'Hexagonal') {
      hexagonalPermutations(h, k, l);
    } else if (['Orthorhombic', 'Orthorhombic_F', 'Orthorhombic_C'].includes(system)) {
      orthorhombicPermutations(h, k, l);
    } else if (system === 'Monoclinic') {
      monoclinicPermutations(h, k, l);
    } else {
      triclinicPermutations(h, k, l);
    }

    return Array.from(uniq).sort();
  };

  const currentSymmetry = symmetryDetails[system as keyof typeof symmetryDetails];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500 items-start">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.05)] border border-[#1e293b] relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-600 rounded-full opacity-10 blur-2xl"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Configuration</h2>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="relative" ref={menuRef}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Lattice Architectural Core
                </label>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                  <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
                  <div className="w-1 h-1 rounded-full bg-emerald-500/10" />
                </div>
              </div>
              
              <button
                onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
                className="w-full px-4 py-4 bg-[#0B1221] hover:bg-[#0f172a] border-2 border-[#1e293b] hover:border-emerald-500/40 rounded-2xl outline-none transition-all flex items-center justify-between group shadow-inner backdrop-blur-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 font-black text-xs shadow-inner">
                    {systemGroups.flatMap(g => g.options).find(o => o.value === system)?.badge}
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-base font-black text-white leading-none tracking-tight">
                      {systemGroups.flatMap(g => g.options).find(o => o.value === system)?.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none bg-[#050B14] px-1.5 py-0.5 rounded border border-[#1e293b]">
                        {systemGroups.find(g => g.options.some(o => o.value === system))?.label} System
                      </span>
                      {systemGroups.find(g => g.options.some(o => o.value === system))?.icon}
                    </div>
                  </div>
                </div>
                <div className="p-1.5 bg-[#050B14] rounded-lg group-hover:bg-emerald-500/10 transition-colors border border-[#1e293b]">
                  <ChevronDown className={`w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform duration-300 ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {isSystemMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full left-0 right-0 mt-3 bg-[#0B1221]/95 backdrop-blur-xl rounded-2xl border-2 border-[#1e293b] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 max-h-[400px] overflow-y-auto custom-scrollbar"
                  >
                    {systemGroups.map((group, gIdx) => (
                      <div key={`group-${group.label}-${gIdx}`} className="border-b border-[#1e293b] last:border-0">
                        <div className="px-5 py-3 bg-[#050B14]/80 flex items-center gap-2 shadow-inner">
                          <div className="text-emerald-500/70">{group.icon}</div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {group.label} Architectural Model
                          </span>
                        </div>
                        <div className="p-2 grid grid-cols-1 gap-1">
                          {group.options.map((option, oIdx) => (
                            <button
                              key={`opt-${option.value}-${oIdx}`}
                              onClick={() => {
                                setSystem(option.value as CrystalSystem);
                                setIsSystemMenuOpen(false);
                              }}
                              className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all group/item
                                ${system === option.value ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-[#0f172a] border border-transparent'}
                              `}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-[11px] font-black transition-all
                                  ${system === option.value 
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]' 
                                    : 'bg-[#050B14] border-[#1e293b] text-slate-500 group-hover/item:border-slate-500 shadow-inner'}
                                `}>
                                  {option.badge}
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className={`text-sm font-bold transition-colors ${system === option.value ? 'text-emerald-400' : 'text-slate-300'}`}>
                                    {option.label}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono uppercase">Selection Logic: {option.badge}-centering</span>
                                </div>
                              </div>
                              {system === option.value && (
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-5 bg-[#050B14] rounded-2xl border border-[#1e293b] shadow-inner group/rule transition-all hover:border-emerald-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Extinction Logic</h3>
                </div>
                <Zap className="w-3.5 h-3.5 text-emerald-500/30 group-hover/rule:text-emerald-500/60 transition-colors" />
              </div>
              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 font-mono text-xs text-emerald-400/90 leading-relaxed text-center italic">
                "{systemDetails[system as keyof typeof systemDetails].rule}"
              </div>
            </div>

            <div className="bg-[#0B1221] p-5 rounded-2xl border border-[#1e293b] shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    Index Synthesis
                  </label>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">max_n:</span>
                  <span className="text-xs font-black text-emerald-400 font-mono">{maxIndex}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 px-1">
                  <input 
                    type="range" min="1" max="6" step="1"
                    value={maxIndex}
                    onChange={(e) => setMaxIndex(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all hover:bg-slate-600"
                  />
                  <div className="flex justify-between mt-2 px-0.5">
                    {[1, 2, 3, 4, 5, 6].map(v => (
                       <span key={v} className={`text-[8px] font-bold font-mono transition-colors ${maxIndex === v ? 'text-emerald-500' : 'text-slate-600'}`}>
                         {v}
                       </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={generateHKLs}
                  className="px-5 py-2.5 bg-[#050B14] hover:bg-[#0f172a] text-emerald-400 text-[10px] font-black rounded-xl transition-all border border-[#1e293b] flex items-center gap-2 shadow-inner active:scale-95 uppercase tracking-widest"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Execute
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bgColor-emerald-500/20 rounded border border-emerald-500/30">
                    <Binary className="w-3 h-3 text-emerald-400" />
                  </div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    HKL Vector Array
                  </label>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-1 w-8 bg-[#1e293b] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-full w-full bg-emerald-500/50"
                      />
                   </div>
                   <span className="text-[8px] font-mono text-slate-600">INPUT_ACTIVE</span>
                </div>
              </div>
              <div className="relative group/indices">
                <div className="absolute top-2 right-3 z-10 flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/30" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/30" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
                </div>
                <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500/30 rounded-full my-4 scale-y-0 group-focus-within/indices:scale-y-100 transition-transform duration-500" />
                <textarea
                  value={hklInput}
                  onChange={(e) => setHklInput(e.target.value)}
                  placeholder="e.g. 1 0 0, 1 1 0, 1 1 1"
                  className="w-full h-36 px-5 py-6 bg-[#050B14] text-emerald-400 border-2 border-[#1e293b] rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all font-mono text-sm leading-relaxed resize-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] custom-scrollbar"
                  spellCheck={false}
                />
                <div className="absolute bottom-3 left-5 text-[8px] font-mono text-slate-600 uppercase tracking-widest opacity-0 group-focus-within/indices:opacity-100 transition-opacity">
                  Systematic_Absence_Parser_Ready
                </div>
              </div>
            </div>

            <button
              onClick={handleValidate}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black rounded-2xl shadow-[0_15px_30px_rgba(16,185,129,0.2)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/20 to-emerald-400/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <CheckCircle2 className="w-5 h-5" />
              <span className="uppercase tracking-[0.15em] text-sm font-black">Analyze Diffractive States</span>
            </button>
          </div>
        </div>

                {/* Lattice Centering Quick Reference */}
        <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2rem] text-white border border-[#1e293b] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Component className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Lattice Guide</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Centering Types</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
             {[
               { id: 'P', label: 'Primitive', desc: 'Points at Corners' },
               { id: 'I', label: 'Body-Centered', desc: 'Corners + Center' },
               { id: 'F', label: 'Face-Centered', desc: 'Corners + Faces' },
               { id: 'C', label: 'Base-Centered', desc: 'Corners + Pair' }
             ].map((type) => (
               <div key={type.id} className="bg-[#0B1221] p-3 rounded-xl border border-[#1e293b] flex flex-col items-center text-center hover:bg-[#070D18] transition-all shadow-inner">
                  <span className="text-sm font-black text-emerald-400 mb-1">{type.id}</span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase leading-none mb-1">{type.label}</span>
                  <span className="text-[8px] text-slate-500 leading-tight">{type.desc}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
{/* Physical Context Card */}
        <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2rem] text-white border border-[#1e293b] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] group-hover:bg-blue-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Physical Context</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Scattering Intelligence</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-[#0B1221] p-4 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin of Extinction</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {systemDetails[system as keyof typeof systemDetails].origin}
              </p>
            </div>

            <div className="bg-[#0B1221] p-4 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structure Factor Formula</span>
              </div>
              <div className="bg-[#050B14] p-4 rounded-xl font-mono text-sm text-emerald-400 overflow-x-auto border border-[#1e293b] shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse shrink-0" />
                  <span className="whitespace-normal break-words drop-shadow-sm">{systemDetails[system as keyof typeof systemDetails].formula}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B1221] p-4 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <Beaker className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Natural Occurrence</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {systemDetails[system as keyof typeof systemDetails].examples.split(',').map((ex, i) => (
                  <span key={`ex-${ex.trim()}-${i}`} className="text-[10px] font-bold text-slate-300 bg-[#070D18] px-2 py-1 rounded border border-[#1e293b]">
                    {ex.trim()}
                  </span>
                ))}
              </div>
            </div>
         {/* Symmetry Intelligence Card */}
        <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2rem] text-white border border-[#1e293b] shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-32 h-32 bg-indigo-500/10 rounded-full blur-[60px] group-hover:bg-indigo-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                <ShieldQuestion className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Symmetry Profile</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20 uppercase tracking-widest">{currentSymmetry.group}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-400 leading-none block">{currentSymmetry.operations}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Ops</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-[#0B1221] p-1 rounded-xl border border-[#1e293b] gap-1 mb-5 relative z-10 font-mono">
            <button
              onClick={() => setSymmetryTab('visualizer')}
              className={`flex-grow py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${symmetryTab === 'visualizer' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
            >
              <Box className="w-3.5 h-3.5" />
              <span className="truncate">3D Lattice</span>
            </button>
            <button
              onClick={() => setSymmetryTab('properties')}
              className={`flex-grow py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${symmetryTab === 'properties' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="truncate">Elements</span>
            </button>
            <button
              onClick={() => setSymmetryTab('sandbox')}
              className={`flex-grow py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${symmetryTab === 'sandbox' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span className="truncate">Equivalents</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="relative z-10 min-h-[350px]">
            {symmetryTab === 'visualizer' && (() => {
              // Interactive SVG 3D visualizer
              const isHex = system === 'Hexagonal';
              const isMono = system === 'Monoclinic';
              const isTri = system === 'Triclinic';
              const isOrth = ['Orthorhombic', 'Orthorhombic_F', 'Orthorhombic_C'].includes(system);
              const isTet = ['Tetragonal', 'Tetragonal_I'].includes(system);
              const isCubic = ['SC', 'BCC', 'FCC', 'Cubic', 'Diamond'].includes(system);

              // Viewport projection helper
              const project = (x: number, y: number, z: number) => {
                const angleX = -Math.PI / 6; 
                const angleY = 1.15 * Math.PI; 
                const px = 145 + (x * Math.cos(angleX) + y * Math.cos(angleY)) * 60;
                const py = 100 + (x * Math.sin(angleX) + y * Math.sin(angleY)) * 60 - z * 50;
                return { x: px, y: py };
              };

              // Geometrics mapping
              let vertices: [number, number, number][] = [];
              let axes: { start: [number, number, number], end: [number, number, number], label: string, color: string }[] = [];
              let planes: [number, number, number][][] = [];

              if (isHex) {
                for (let i = 0; i < 6; i++) {
                  const a = (i * Math.PI) / 3;
                  vertices.push([Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.9]);
                }
                for (let i = 0; i < 6; i++) {
                  const a = (i * Math.PI) / 3;
                  vertices.push([Math.cos(a) * 0.9, Math.sin(a) * 0.9, -0.9]);
                }
                axes = [
                  { start: [0, 0, -1.3], end: [0, 0, 1.3], label: '6-fold (C6)', color: '#06b6d4' },
                  { start: [-1.2, 0, 0], end: [1.2, 0, 0], label: '2-fold (C2)', color: '#a855f7' },
                  { start: [-0.6, -1.03, 0], end: [0.6, 1.03, 0], label: '2-fold (C2)', color: '#a855f7' },
                  { start: [0.6, -1.03, 0], end: [-0.6, 1.03, 0], label: '2-fold (C2)', color: '#a855f7' },
                ];
                const hexPlane: [number, number, number][] = [];
                for (let i = 0; i < 6; i++) {
                  const a = (i * Math.PI) / 3;
                  hexPlane.push([Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0]);
                }
                planes = [hexPlane];
              } else {
                let sx = 0.85, sy = 0.85, sz = 0.85;
                if (isTet) { sx = 0.7; sy = 0.7; sz = 1.1; }
                else if (isOrth) { sx = 0.6; sy = 1.0; sz = 1.25; }
                else if (isMono) { sx = 0.6; sy = 0.9; sz = 1.0; }
                else if (isTri) { sx = 0.6; sy = 0.85; sz = 0.95; }

                const getPt = (dx: number, dy: number, dz: number): [number, number, number] => {
                  let rx = dx * sx;
                  let ry = dy * sy;
                  let rz = dz * sz;
                  if (isMono) { ry += dz * 0.35; }
                  else if (isTri) { rx += dy * 0.15 + dz * 0.25; ry += dz * 0.35; }
                  return [rx, ry, rz];
                };

                vertices = [
                  getPt(-1, -1, -1), getPt(1, -1, -1), getPt(1, 1, -1), getPt(-1, 1, -1),
                  getPt(-1, -1, 1),  getPt(1, -1, 1),  getPt(1, 1, 1),  getPt(-1, 1, 1)
                ];

                if (isCubic) {
                  axes = [
                    { start: [0, 0, -1.45 * sz], end: [0, 0, 1.45 * sz], label: '4-fold (C4)', color: '#10b981' },
                    { start: [-1.45 * sx, 0, 0], end: [1.45 * sx, 0, 0], label: '4-fold (C4)', color: '#10b981' },
                    { start: [0, -1.45 * sy, 0], end: [0, 1.45 * sy, 0], label: '4-fold (C4)', color: '#10b981' },
                    { start: getPt(-1.25, -1.25, -1.25), end: getPt(1.25, 1.25, 1.25), label: '3-fold (C3)', color: '#a855f7' }
                  ];
                  planes = [
                    [getPt(-1, -1, 0), getPt(1, -1, 0), getPt(1, 1, 0), getPt(-1, 1, 0)],
                    [getPt(-1, 0, -1), getPt(1, 0, -1), getPt(1, 0, 1), getPt(-1, 0, 1)]
                  ];
                } else if (isTet) {
                  axes = [
                    { start: [0, 0, -1.4 * sz], end: [0, 0, 1.4 * sz], label: '4-fold (C4)', color: '#06b6d4' },
                    { start: [-1.3 * sx, 0, 0], end: [1.3 * sx, 0, 0], label: '2-fold (C2)', color: '#a855f7' },
                    { start: [0, -1.3 * sy, 0], end: [0, 1.3 * sy, 0], label: '2-fold (C2)', color: '#a855f7' }
                  ];
                  planes = [
                    [getPt(-1, -1, 0), getPt(1, -1, 0), getPt(1, 1, 0), getPt(-1, 1, 0)]
                  ];
                } else if (isOrth) {
                  axes = [
                    { start: [-1.3 * sx, 0, 0], end: [1.3 * sx, 0, 0], label: '2-fold (C2)', color: '#a855f7' },
                    { start: [0, -1.3 * sy, 0], end: [0, 1.3 * sy, 0], label: '2-fold (C2)', color: '#a855f7' },
                    { start: [0, 0, -1.3 * sz], end: [0, 0, 1.3 * sz], label: '2-fold (C2)', color: '#a855f7' }
                  ];
                  planes = [
                    [getPt(-1, -1, 0), getPt(1, -1, 0), getPt(1, 1, 0), getPt(-1, 1, 0)]
                  ];
                } else if (isMono) {
                  axes = [
                    { start: [0, -1.35 * sy, 0], end: [0, 1.35 * sy, 0], label: '2-fold (C2)', color: '#db2777' }
                  ];
                  planes = [
                    [getPt(-1, 0, -1), getPt(1, 0, -1), getPt(1, 0, 1), getPt(-1, 0, 1)]
                  ];
                }
              }

              return (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                  {/* SVG Canvas Area */}
                  <div className="h-56 bg-[#050B14] rounded-2xl border border-[#1e293b] relative overflow-hidden flex items-center justify-center shadow-inner">
                    <div className="absolute inset-0 bg-grid-slate-800/20 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] opacity-40 pointer-events-none"></div>
                    
                    <svg className="w-full h-full max-w-[320px] max-h-[220px]" viewBox="0 0 300 200">
                      {/* Grid / coordinate indicators */}
                      <g className="opacity-20 stroke-slate-700" strokeWidth={0.5}>
                        <line x1={0} y1={100} x2={300} y2={100} />
                        <line x1={150} y1={0} x2={150} y2={200} />
                      </g>

                      {/* Mirror Planes Rendering */}
                      {showMirrorPlanes && planes.map((p, idx) => {
                        const pts = p.map(pt => project(pt[0], pt[1], pt[2]));
                        const pathString = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ') + ' Z';
                        return (
                          <path
                            key={`plane-${idx}`}
                            d={pathString}
                            fill="#06b6d4"
                            fillOpacity={0.25}
                            stroke="#06b6d4"
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            className="transition-all"
                          />
                        );
                      })}

                      {/* Unit Cell Wireframe Outline */}
                      {showLatticeOutline && (() => {
                        if (isHex) {
                          const topPts = vertices.slice(0, 6).map(v => project(v[0], v[1], v[2]));
                          const botPts = vertices.slice(6, 12).map(v => project(v[0], v[1], v[2]));
                          const paths = [];
                          paths.push(`M ${topPts[0].x} ${topPts[0].y} ` + topPts.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ') + ' Z');
                          paths.push(`M ${botPts[0].x} ${botPts[0].y} ` + botPts.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ') + ' Z');
                          
                          return (
                            <g stroke="rgba(255,255,255,0.4)" strokeWidth={1} fill="none">
                              <path d={paths[0]} />
                              <path d={paths[1]} />
                              {topPts.map((p, idx) => (
                                <line key={`side-${idx}`} x1={p.x} y1={p.y} x2={botPts[idx].x} y2={botPts[idx].y} />
                              ))}
                            </g>
                          );
                        } else {
                          const pts = vertices.map(v => project(v[0], v[1], v[2]));
                          return (
                            <g stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} fill="none">
                              <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} />
                              <line x1={pts[1].x} y1={pts[1].y} x2={pts[2].x} y2={pts[2].y} />
                              <line x1={pts[2].x} y1={pts[2].y} x2={pts[3].x} y2={pts[3].y} />
                              <line x1={pts[3].x} y1={pts[3].y} x2={pts[0].x} y2={pts[0].y} strokeDasharray="3 3" />

                              <line x1={pts[4].x} y1={pts[4].y} x2={pts[5].x} y2={pts[5].y} />
                              <line x1={pts[5].x} y1={pts[5].y} x2={pts[6].x} y2={pts[6].y} />
                              <line x1={pts[6].x} y1={pts[6].y} x2={pts[7].x} y2={pts[7].y} />
                              <line x1={pts[7].x} y1={pts[7].y} x2={pts[4].x} y2={pts[4].y} />

                              <line x1={pts[0].x} y1={pts[0].y} x2={pts[4].x} y2={pts[4].y} strokeDasharray="3 3" />
                              <line x1={pts[1].x} y1={pts[1].y} x2={pts[5].x} y2={pts[5].y} />
                              <line x1={pts[2].x} y1={pts[2].y} x2={pts[6].x} y2={pts[6].y} />
                              <line x1={pts[3].x} y1={pts[3].y} x2={pts[7].x} y2={pts[7].y} />
                            </g>
                          );
                        }
                      })()}

                      {/* Rotation Axes */}
                      {showSymmetryAxes && axes.map((axis, idx) => {
                        const ptStart = project(axis.start[0], axis.start[1], axis.start[2]);
                        const ptEnd = project(axis.end[0], axis.end[1], axis.end[2]);
                        return (
                          <g key={`axis-group-${idx}`}>
                            <line
                              x1={ptStart.x}
                              y1={ptStart.y}
                              x2={ptEnd.x}
                              y2={ptEnd.y}
                              stroke={axis.color}
                              strokeWidth={2}
                            />
                            <circle cx={ptEnd.x} cy={ptEnd.y} r={2.5} fill={axis.color} />
                          </g>
                        );
                      })}

                      {/* Lattice Vertex Nodes */}
                      {showLatticeOutline && vertices.map((v, idx) => {
                        const p = project(v[0], v[1], v[2]);
                        return (
                          <circle
                            key={`node-${idx}`}
                            cx={p.x}
                            cy={p.y}
                            r={3}
                            fill="#cbd5e1"
                            stroke="#0f172a"
                            strokeWidth={1}
                          />
                        );
                      })}

                      {/* Inversion Center */}
                      {showInversionCenter && currentSymmetry.inversion && (() => {
                        const center = project(0, 0, 0);
                        return (
                          <g>
                            <circle cx={center.x} cy={center.y} r={6} fill="#fbbf24" fillOpacity={0.25} className="animate-pulse" />
                            <circle cx={center.x} cy={center.y} r={3} fill="#f59e0b" stroke="#fff" strokeWidth={1} />
                          </g>
                        );
                      })()}
                    </svg>

                    <div className="absolute bottom-3 right-4 text-[9px] font-mono font-bold text-slate-500 bg-[#070D18]/80 px-2 py-0.5 rounded border border-[#1e293b]">
                      3D Projection
                    </div>
                  </div>

                  {/* Toggle Pill Buttons */}
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <button
                      onClick={() => setShowLatticeOutline(!showLatticeOutline)}
                      className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center justify-between transition-all ${showLatticeOutline ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-[#0B1221] border-[#1e293b] text-slate-500'}`}
                    >
                      <span className="flex items-center gap-1">
                        <Box className="w-3.5 h-3.5" /> Outlines
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${showLatticeOutline ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                    </button>

                    <button
                      onClick={() => setShowSymmetryAxes(!showSymmetryAxes)}
                      className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center justify-between transition-all ${showSymmetryAxes ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-[#0B1221] border-[#1e293b] text-slate-500'}`}
                    >
                      <span className="flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5" /> Axes (Rot)
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${showSymmetryAxes ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                    </button>

                    <button
                      onClick={() => setShowMirrorPlanes(!showMirrorPlanes)}
                      className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center justify-between transition-all ${showMirrorPlanes ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-[#0B1221] border-[#1e293b] text-slate-500'}`}
                    >
                      <span className="flex items-center gap-1">
                        <Split className="w-3.5 h-3.5" /> Planes (σ)
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${showMirrorPlanes ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                    </button>

                    <button
                      onClick={() => setShowInversionCenter(!showInversionCenter)}
                      disabled={!currentSymmetry.inversion}
                      className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center justify-between transition-all ${!currentSymmetry.inversion ? 'opacity-30 cursor-not-allowed bg-slate-900 border-transparent text-slate-600' : showInversionCenter ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-[#0B1221] border-[#1e293b] text-slate-500'}`}
                    >
                      <span className="flex items-center gap-1">
                        <CircleDot className="w-3.5 h-3.5" /> Inversion (i)
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${!currentSymmetry.inversion ? 'bg-slate-800' : showInversionCenter ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                    </button>
                  </div>
                </div>
              );
            })()}

            {symmetryTab === 'properties' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0B1221] p-3.5 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all shadow-inner">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Rotation Ops</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentSymmetry.rotation.map((r, idx) => (
                        <span key={`rot-${r}-${idx}`} className="text-[9px] font-bold font-mono text-indigo-300 bg-[#070D18] px-2 py-0.5 rounded border border-[#1e293b]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0B1221] p-3.5 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all shadow-inner flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Split className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Reflections</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium font-mono">
                        {currentSymmetry.reflection}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0B1221] p-3 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-1.5">
                      <Hexagon className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Inversion (i)</span>
                    </div>
                    <span className={`text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded border ${currentSymmetry.inversion ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-900 border-slate-800'}`}>
                      {currentSymmetry.inversion ? 'Present' : 'Absent'}
                    </span>
                  </div>
                  <div className="bg-[#0B1221] p-3 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-1.5">
                      <Component className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Identity (E)</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 font-black bg-[#070D18] px-2 py-0.5 rounded border border-[#1e293b]">{currentSymmetry.identity}</span>
                  </div>
                </div>

                <div className="bg-[#0B1221] p-3.5 rounded-2xl border border-[#1e293b] shadow-inner">
                   <div className="flex items-center gap-1.5 mb-2.5">
                     <Network className="w-3.5 h-3.5 text-indigo-400" />
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono font-black">Interpretation</span>
                   </div>
                   <div className="bg-[#050B14] p-3.5 rounded-xl font-mono text-[11px] text-indigo-300 border border-[#1e293b] flex gap-2.5 items-start shadow-inner">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse mt-1 shrink-0" />
                      <p className="leading-relaxed">"{currentSymmetry.description}"</p>
                   </div>
                </div>
              </div>
            )}

            {symmetryTab === 'sandbox' && (() => {
              const familyList = generateEquivalentPlanes(sandboxH, sandboxK, sandboxL, system);
              const multiplicity = familyList.length;

              return (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-[#0B1221] p-4 rounded-2xl border border-[#1e293b] shadow-inner">
                    <span className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 font-mono">Input Miller Indices (h k l)</span>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono">h</label>
                        <input
                          type="number"
                          value={sandboxH}
                          onChange={(e) => setSandboxH(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#050B14] border border-[#1e293b] rounded-lg text-center py-1.5 font-mono text-indigo-300 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono font-bold">k</label>
                        <input
                          type="number"
                          value={sandboxK}
                          onChange={(e) => setSandboxK(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#050B14] border border-[#1e293b] rounded-lg text-center py-1.5 font-mono text-indigo-300 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono font-bold">l</label>
                        <input
                          type="number"
                          value={sandboxL}
                          onChange={(e) => setSandboxL(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#050B14] border border-[#1e293b] rounded-lg text-center py-1.5 font-mono text-indigo-300 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0B1221] p-3.5 rounded-xl border border-[#1e293b] flex justify-between items-center shadow-inner">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Peak Multiplicity (m)</span>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Diffraction peak intensity factor</p>
                    </div>
                    <div className="bg-indigo-500/15 text-indigo-400 px-3 py-1 font-black font-mono text-xs rounded border border-indigo-500/30 shadow-inner">
                      {multiplicity} Peaks
                    </div>
                  </div>

                  <div className="bg-[#0B1221] p-3.5 rounded-xl border border-[#1e293b] shadow-inner flex flex-col h-[130px]">
                    <span className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 font-mono">Symmetry-Equivalent Family</span>
                    <div className="flex-1 overflow-y-auto pr-1 flex flex-wrap gap-1.5 content-start custom-scrollbar">
                      {familyList.map((plane, i) => (
                        <span key={`equiv-plane-${plane}-${i}`} className="text-[10px] font-mono font-bold text-indigo-300 bg-[#050B14] px-2 py-0.5 rounded border border-[#1e293b] animate-in zoom-in-95 duration-200">
                          {plane}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  </div>

        {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-[#050B14]/80 backdrop-blur-md rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.05)] border border-[#1e293b] overflow-hidden flex flex-col min-h-[600px] relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none mix-blend-screen" />
          <div className="p-6 border-b border-[#1e293b] bg-[#070D18]/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white">Validation Results</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Systematic absences for {systemDetails[system as keyof typeof systemDetails].title}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-1.5 bg-[#0B1221] p-1.5 rounded-xl border border-[#1e293b]">
                {(['All', 'Allowed', 'Forbidden'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      filter === f 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleSave}
                disabled={results.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-xl transition-all border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed group/save shadow-inner uppercase tracking-widest"
              >
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                Save CSV
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400 p-12 text-center border-t border-[#1e293b]/50">
                <div className="relative group/empty mb-6">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl group-hover/empty:bg-emerald-500/20 transition-all duration-700" />
                  <div className="w-20 h-20 rounded-2xl bg-[#0B1221] border border-[#1e293b] flex items-center justify-center relative z-10 shadow-inner group-hover/empty:border-emerald-500/30 transition-colors">
                    <Hexagon className="w-10 h-10 text-slate-600 group-hover/empty:text-emerald-500/50 transition-colors" />
                  </div>
                </div>
                <h4 className="text-lg font-black text-white mb-2 tracking-wide">Awaiting Lattice Vectors</h4>
                <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
                  Enter custom HKL indices in the configuration panel or use the Index Synthesis engine to generate a theoretical reflection dataset.
                </p>
                <div className="mt-8 flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-widest">Engine Ready</span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-[#0B1221] border-b border-[#1e293b]">
                    <tr>
                      <th className="px-8 py-4 font-bold">Reflection (h k l)</th>
                      <th className="px-8 py-4 font-bold">Status</th>
                      <th className="px-8 py-4 font-bold">Physical Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    <AnimatePresence mode="popLayout">
                      {filteredResults.map((res, index) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={`${res.hkl.join('-')}-${index}`} 
                          className="group hover:bg-[#0B1221] transition-colors"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${res.status === 'Allowed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                              <span className="font-mono font-bold text-white text-base">
                                ({res.hkl.join(' ')})
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                              res.status === 'Allowed' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {res.status === 'Allowed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {res.status}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-slate-400 font-medium text-xs leading-relaxed max-w-full group-hover:text-slate-300 transition-colors">
                              {res.reason}
                            </p>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#0B1221] border-t border-[#1e293b] flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex gap-6">
              <span className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Allowed: {results.filter(r => r.status === 'Allowed').length}
              </span>
              <span className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Forbidden: {results.filter(r => r.status === 'Forbidden').length}
              </span>
            </div>
            <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">Total: {results.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

