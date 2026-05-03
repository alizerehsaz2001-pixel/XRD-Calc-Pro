import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CrystalSystem, SelectionRuleResult } from '../types';
import { parseHKLString, validateSelectionRule } from '../utils/physics';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, XCircle, Info, RefreshCw, Filter, BookOpen, 
  Layers, Zap, ChevronDown, Check, Maximize, RotateCw, 
  Split, CircleDot, ShieldQuestion, Loader2, Atom, Binary, Beaker,
  Network, Hexagon, Component, Box, Cuboid, Pyramid
} from 'lucide-react';

export const SelectionRulesModule: React.FC = () => {
  const [system, setSystem] = useState<CrystalSystem>('FCC');
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [hklInput, setHklInput] = useState<string>('1 0 0, 1 1 0, 1 1 1, 2 0 0, 2 1 0, 2 2 0, 3 1 1');
  const [results, setResults] = useState<SelectionRuleResult[]>([]);
  const [filter, setFilter] = useState<'All' | 'Allowed' | 'Forbidden'>('All');
  const [maxIndex, setMaxIndex] = useState<number>(3);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const currentSymmetry = symmetryDetails[system as keyof typeof symmetryDetails];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500 items-start">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
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
                className="w-full px-4 py-4 bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700/50 hover:border-emerald-500/40 rounded-2xl outline-none transition-all flex items-center justify-between group shadow-xl backdrop-blur-sm"
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
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                        {systemGroups.find(g => g.options.some(o => o.value === system))?.label} System
                      </span>
                      {systemGroups.find(g => g.options.some(o => o.value === system))?.icon}
                    </div>
                  </div>
                </div>
                <div className="p-1.5 bg-slate-900/50 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
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
                    className="absolute top-full left-0 right-0 mt-3 bg-slate-900/95 backdrop-blur-xl rounded-2xl border-2 border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 max-h-[400px] overflow-y-auto custom-scrollbar"
                  >
                    {systemGroups.map((group, gIdx) => (
                      <div key={gIdx} className="border-b border-slate-800/50 last:border-0">
                        <div className="px-5 py-3 bg-slate-800/30 flex items-center gap-2">
                          <div className="text-emerald-500/70">{group.icon}</div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {group.label} Architectural Model
                          </span>
                        </div>
                        <div className="p-2 grid grid-cols-1 gap-1">
                          {group.options.map((option, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => {
                                setSystem(option.value as CrystalSystem);
                                setIsSystemMenuOpen(false);
                              }}
                              className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all group/item
                                ${system === option.value ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-slate-800/80 border border-transparent'}
                              `}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-[11px] font-black transition-all
                                  ${system === option.value 
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]' 
                                    : 'bg-slate-900 border-slate-700 text-slate-500 group-hover/item:border-slate-500 shadow-inner'}
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

            <div className="p-5 bg-black/60 rounded-2xl border border-slate-700/50 shadow-inner group/rule transition-all hover:border-emerald-500/30">
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

            <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 shadow-inner">
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
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all hover:bg-slate-600"
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
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black rounded-xl transition-all border border-slate-600 flex items-center gap-2 shadow-lg active:scale-95 uppercase tracking-widest"
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
                   <div className="h-1 w-8 bg-slate-800 rounded-full overflow-hidden">
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
                  className="w-full h-36 px-5 py-6 bg-[#0a0f18] text-emerald-400 border-2 border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all font-mono text-sm leading-relaxed resize-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] custom-scrollbar"
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

        {/* Physical Context Card */}
        <div className="bg-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
          
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
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin of Extinction</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {systemDetails[system as keyof typeof systemDetails].origin}
              </p>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structure Factor Formula</span>
              </div>
              <div className="bg-black/60 p-4 rounded-xl font-mono text-sm text-emerald-400 overflow-x-auto border border-slate-700 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span className="truncate">{systemDetails[system as keyof typeof systemDetails].formula}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Beaker className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Natural Occurrence</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {systemDetails[system as keyof typeof systemDetails].examples.split(',').map((ex, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-300 bg-slate-700/50 px-2 py-1 rounded border border-slate-600/50">
                    {ex.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Symmetry Intelligence Card */}
        <div className="bg-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
          
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

          <div className="space-y-4 relative z-10 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <RotateCw className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rotation Ops</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentSymmetry.rotation.map((r, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Split className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reflection Planes</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {currentSymmetry.reflection}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hexagon className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversion</span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${currentSymmetry.inversion ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                  {currentSymmetry.inversion ? 'Present' : 'Absent'}
                </span>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Component className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</span>
                </div>
                <span className="text-[11px] font-mono text-indigo-400 font-black bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{currentSymmetry.identity}</span>
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 shadow-inner">
               <div className="flex items-center gap-2 mb-3">
                 <Network className="w-4 h-4 text-indigo-400" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine Interpretation</span>
               </div>
               <div className="bg-black/60 p-4 rounded-xl font-mono text-xs text-indigo-300 border border-slate-700 flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse mt-1.5 shrink-0" />
                  <p className="leading-relaxed">"{currentSymmetry.description}"</p>
               </div>
            </div>
            
            {/* Visualizer Mockup Area */}
            <div className="h-24 bg-black/40 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-grid-slate-800/20 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]"></div>
               
               <motion.div 
                 key={system}
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="relative z-10"
               >
                 <div className="flex gap-4">
                   {/* Simplified Symmetry Symbol Visual */}
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     className="w-12 h-12 border border-indigo-500/30 rounded-lg flex items-center justify-center relative bg-slate-900/50 backdrop-blur-sm"
                   >
                     <div className="absolute inset-0 border-t border-indigo-500/50 scale-x-125 rotate-45" />
                     <div className="absolute inset-0 border-t border-indigo-500/50 scale-x-125 -rotate-45" />
                     <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                   </motion.div>
                   
                   <div className="flex flex-col justify-center">
                     <div className="flex gap-1.5 mb-1.5">
                        {[...Array(Math.min(5, Math.ceil(currentSymmetry.operations / 8)))].map((_, i) => (
                          <motion.div 
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                            className="w-4 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_5px_rgba(99,102,241,0.5)]" 
                          />
                        ))}
                     </div>
                     <span className="text-[9px] font-mono font-bold text-indigo-400/80 uppercase tracking-widest">Actively Scanning</span>
                   </div>
                 </div>
               </motion.div>
            </div>
          </div>
        </div>
        {/* Lattice Centering Quick Reference */}
        <div className="bg-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          
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
               <div key={type.id} className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 flex flex-col items-center text-center hover:bg-slate-800/60 transition-all">
                  <span className="text-sm font-black text-emerald-400 mb-1">{type.id}</span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase leading-none mb-1">{type.label}</span>
                  <span className="text-[8px] text-slate-500 leading-tight">{type.desc}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Validation Results</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Systematic absences for {systemDetails[system as keyof typeof systemDetails].title}</p>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700">
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
          </div>

          <div className="flex-1 overflow-auto">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center">
                <Filter className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-slate-400">No indices provided</p>
                <p className="text-xs mt-1">Enter HKL values or use the generator to start</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-800/40 border-b border-slate-700">
                    <tr>
                      <th className="px-8 py-4 font-bold">Reflection (h k l)</th>
                      <th className="px-8 py-4 font-bold">Status</th>
                      <th className="px-8 py-4 font-bold">Physical Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    <AnimatePresence mode="popLayout">
                      {filteredResults.map((res, index) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={`${res.hkl.join('-')}-${index}`} 
                          className="group hover:bg-slate-800/30 transition-colors"
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
                            <p className="text-slate-400 font-medium text-xs leading-relaxed max-w-xs group-hover:text-slate-300 transition-colors">
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

          <div className="p-4 bg-slate-800/40 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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

