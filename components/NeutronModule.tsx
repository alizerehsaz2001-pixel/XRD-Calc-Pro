
import React, { useState, useEffect, useRef } from 'react';
import { NeutronAtom, NeutronResult, StandardWavelength, LatticeParameters, CrystalSystem } from '../types';
import { calculateNeutronDiffraction, calculateXRayDiffraction, NEUTRON_SCATTERING_LENGTHS, ATOMIC_NUMBERS, NEUTRON_WAVELENGTHS, calculateCellVolume } from '../utils/physics';
import { fetchStandardWavelengths } from '../services/geminiService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import { Layers, Zap, Atom, Upload, Download, Info, ChevronDown, CheckCircle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const INCOHERENT_CROSS_SECTIONS: Record<string, number> = {
  'H': 80.26,
  'D': 2.05,
  'He': 0.0,
  'Li': 0.9,
  'Be': 0.003,
  'B': 1.7,
  'C': 0.001,
  'N': 0.5,
  'O': 0.0,
  'F': 0.0008,
  'Ne': 0.008,
  'Na': 1.62,
  'Mg': 0.08,
  'Al': 0.01,
  'Si': 0.004,
  'P': 0.005,
  'S': 0.007,
  'Cl': 3.86,
  'Ar': 0.22,
  'K': 0.25,
  'Ca': 0.05,
  'Sc': 4.5,
  'Ti': 2.87,
  'V': 5.08,
  'Cr': 1.66,
  'Mn': 0.4,
  'Fe': 0.4,
  'Co': 4.8,
  'Ni': 4.8,
  'Cu': 0.5,
  'Zn': 0.077,
  'Ga': 0.14,
  'Ge': 0.09,
  'As': 0.06,
  'Se': 0.06,
  'Br': 0.1,
  'Kr': 0.0,
  'Rb': 0.5,
  'Sr': 0.1,
  'Y': 0.15,
  'Zr': 0.02,
  'Nb': 0.002,
  'Mo': 0.04,
  'Tc': 0.0,
  'Ru': 0.05,
  'Rh': 0.0,
  'Pd': 0.09,
  'Ag': 0.58,
  'Cd': 0.0,
  'In': 0.52,
  'Sn': 0.02,
  'Sb': 0.12,
  'Te': 0.09,
  'I': 0.31,
  'Xe': 0.0,
  'Cs': 0.08,
  'Ba': 0.15,
  'La': 1.13,
  'Ce': 0.01,
  'Pr': 1.6,
  'Nd': 2.4,
  'Pm': 0.0,
  'Sm': 0.0,
  'Eu': 0.0,
  'Gd': 0.0,
  'Tb': 0.0,
  'Dy': 3.4,
  'Ho': 0.0,
  'Er': 0.0,
  'Tm': 0.0,
  'Yb': 0.0,
  'Lu': 0.0,
  'Hf': 0.1,
  'Ta': 0.01,
  'W': 0.004,
  'Re': 0.003,
  'Os': 0.02,
  'Ir': 0.3,
  'Pt': 0.06,
  'Au': 0.43,
  'Hg': 0.3,
  'Tl': 0.0,
  'Pb': 0.003,
  'Bi': 0.003,
  'Th': 0.0,
  'U': 0.01
};

export const NeutronModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.54); 
  const [availableWavelengths, setAvailableWavelengths] = useState<StandardWavelength[]>([
    { label: 'Thermal', value: 1.54, type: 'Neutron' },
    { label: 'Cold (Be Filter)', value: 3.96, type: 'Neutron' },
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lattice, setLattice] = useState<LatticeParameters>({
    a: 4.20, b: 4.20, c: 4.20, alpha: 90, beta: 90, gamma: 90
  });
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystem>('Cubic');
  const [activeRightTab, setActiveRightTab] = useState<'pattern' | 'projection' | 'contrast' | 'rings' | 'solvent'>('pattern');
  const [projectionPlane, setProjectionPlane] = useState<'ab' | 'bc' | 'ca'>('ab');
  const [ringRenderMode, setRingRenderMode] = useState<'total' | 'neutron' | 'xray'>('total');
  const [showIncoherentNoise, setShowIncoherentNoise] = useState(true);
  const [d2oFraction, setD2oFraction] = useState(50);
  const ringsCanvasRef = useRef<HTMLCanvasElement>(null);
  const [atoms, setAtoms] = useState<NeutronAtom[]>([
    { id: '1', element: 'O', label: 'Oxygen', b: 5.80, x: 0, y: 0, z: 0, B_iso: 0.5 },
    { id: '2', element: 'Mg', label: 'Magnesium', b: 5.38, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.4 },
  ]);

  const applySymmetry = (system: CrystalSystem, l: LatticeParameters) => {
    switch (system) {
      case 'Cubic':
        return { ...l, b: l.a, c: l.a, alpha: 90, beta: 90, gamma: 90 };
      case 'Tetragonal':
        return { ...l, b: l.a, alpha: 90, beta: 90, gamma: 90 };
      case 'Hexagonal':
        return { ...l, b: l.a, alpha: 90, beta: 90, gamma: 120 };
      case 'Orthorhombic':
        return { ...l, alpha: 90, beta: 90, gamma: 90 };
      case 'Monoclinic':
        return { ...l, alpha: 90, gamma: 90 };
      default:
        return l;
    }
  };

  const handleLatticeChange = (field: keyof LatticeParameters, value: number) => {
    const nextLattice = { ...lattice, [field]: value };
    setLattice(applySymmetry(crystalSystem, nextLattice));
  };

  const [neutronResults, setNeutronResults] = useState<NeutronResult[]>([]);
  const [xrayResults, setXrayResults] = useState<NeutronResult[]>([]);

  const handleCalculate = () => {
    const nResults = calculateNeutronDiffraction(wavelength, lattice, atoms);
    setNeutronResults(nResults);

    if (comparisonMode) {
      const xResults = calculateXRayDiffraction(wavelength, lattice, atoms);
      setXrayResults(xResults);
    } else {
      setXrayResults([]);
    }
  };

  const handleExport = () => {
    const data = {
      lattice,
      atoms,
      wavelength,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neutron-structure-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const latest = await fetchStandardWavelengths();
      if (latest.length > 0) {
        setAvailableWavelengths(latest.filter(w => w.type === 'Neutron'));
      }
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importJson);
      if (data.lattice) {
        setLattice({
          a: data.lattice.a || 4.2,
          b: data.lattice.b || data.lattice.a || 4.2,
          c: data.lattice.c || data.lattice.a || 4.2,
          alpha: data.lattice.alpha || 90,
          beta: data.lattice.beta || 90,
          gamma: data.lattice.gamma || 90
        });
      }
      if (data.atoms && Array.isArray(data.atoms)) {
        const newAtoms = data.atoms.map((a: any) => ({
          id: a.id || Date.now().toString() + Math.random(),
          element: a.element,
          label: a.label || a.element,
          b: a.b || NEUTRON_SCATTERING_LENGTHS[a.element] || 0,
          x: a.x,
          y: a.y,
          z: a.z,
          B_iso: a.B_iso || 0.5
        }));
        setAtoms(newAtoms);
      }
      setShowImport(false);
      setImportJson("");
      setImportError(null);
    } catch (e) {
      setImportError("Invalid JSON structure. Please check commas, quotes, and braces.");
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [atoms, wavelength, lattice, comparisonMode]);

  const addAtom = () => {
    setAtoms([...atoms, { 
      id: Date.now().toString(), 
      element: 'H', 
      label: 'Hydrogen', 
      b: -3.74, 
      x: 0, 
      y: 0, 
      z: 0, 
      B_iso: 0 
    }]);
  };

  const removeAtom = (id: string) => {
    setAtoms(atoms.filter(a => a.id !== id));
  };

  const updateAtom = (id: string, field: keyof NeutronAtom, value: any) => {
    setAtoms(atoms.map(a => {
      if (a.id === id) {
        const updated = { ...a, [field]: value };
        if (field === 'element' && NEUTRON_SCATTERING_LENGTHS[value]) {
          updated.b = NEUTRON_SCATTERING_LENGTHS[value];
        }
        return updated;
      }
      return a;
    }));
  };

  const loadPreset = (type: 'MgO' | 'D2O' | 'SrTiO3' | 'MnO') => {
    if (type === 'MgO') {
       setLattice({ a: 4.21, b: 4.21, c: 4.21, alpha: 90, beta: 90, gamma: 90 });
       setAtoms([
         { id: '1', element: 'Mg', label: 'Mg', b: 5.38, x: 0, y: 0, z: 0, B_iso: 0.3 },
         { id: '2', element: 'O', label: 'O', b: 5.80, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5 }
       ]);
    } else if (type === 'D2O') {
       setLattice({ a: 6.35, b: 6.35, c: 6.35, alpha: 90, beta: 90, gamma: 90 });
       setAtoms([
         { id: '1', element: 'O', label: 'O', b: 5.80, x: 0, y: 0, z: 0, B_iso: 1.0 },
         { id: '2', element: 'D', label: 'D', b: 6.67, x: 0.33, y: 0.33, z: 0.33, B_iso: 1.5 },
         { id: '3', element: 'D', label: 'D', b: 6.67, x: 0.66, y: 0.66, z: 0.66, B_iso: 1.5 }
       ]);
    } else if (type === 'SrTiO3') {
       setLattice({ a: 3.905, b: 3.905, c: 3.905, alpha: 90, beta: 90, gamma: 90 });
       setAtoms([
         { id: '1', element: 'Sr', label: 'Sr', b: 7.02, x: 0, y: 0, z: 0, B_iso: 0.4 },
         { id: '2', element: 'Ti', label: 'Ti', b: -3.44, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.4 },
         { id: '3', element: 'O', label: 'O', b: 5.80, x: 0.5, y: 0.5, z: 0, B_iso: 0.6 },
         { id: '4', element: 'O', label: 'O', b: 5.80, x: 0.5, y: 0, z: 0.5, B_iso: 0.6 },
         { id: '5', element: 'O', label: 'O', b: 5.80, x: 0, y: 0.5, z: 0.5, B_iso: 0.6 },
       ]);
    } else if (type === 'MnO') {
      setLattice({ a: 4.44, b: 4.44, c: 4.44, alpha: 90, beta: 90, gamma: 90 });
      setAtoms([
        { id: '1', element: 'Mn', label: 'Mn (Neg b!)', b: -3.73, x: 0, y: 0, z: 0, B_iso: 0.5 },
        { id: '2', element: 'O', label: 'O', b: 5.80, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5 }
      ]);
    }
  };

  // Debye-Scherrer powder rings canvas effect
  useEffect(() => {
    const canvas = ringsCanvasRef.current;
    if (!canvas || activeRightTab !== 'rings') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Background: dark space look
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Center beam stop (classical detector design)
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Beam stop outline/lead cup shadow
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Scale parameter for rings
    const scaleFactor = width / 2.3;

    // Calculate background noise level based on incoherent scattering
    const totalInc = atoms.reduce((acc, atom) => {
      const cs = INCOHERENT_CROSS_SECTIONS[atom.element] ?? 0.1;
      return acc + cs;
    }, 0);
    const noiseFactor = showIncoherentNoise ? Math.min(0.8, (totalInc / (atoms.length || 1)) * 0.12) : 0;

    // Draw diffuse incoherent haze if noise is present
    if (noiseFactor > 0) {
      const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, width * 0.7);
      gradient.addColorStop(0, `rgba(148, 163, 184, ${noiseFactor * 0.35})`);
      gradient.addColorStop(0.5, `rgba(148, 163, 184, ${noiseFactor * 0.18})`);
      gradient.addColorStop(1, 'rgba(148, 163, 184, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Draw background noise speckles (haze)
      ctx.fillStyle = `rgba(148, 163, 184, ${noiseFactor * 0.45})`;
      const speckleCount = Math.floor(noiseFactor * 250);
      for (let s = 0; s < speckleCount; s++) {
        const sx = Math.random() * width;
        const sy = Math.random() * height;
        ctx.fillRect(sx, sy, 1, 1);
      }
    }

    const currentResults = ringRenderMode === 'xray' ? xrayResults : neutronResults;

    currentResults.forEach((r) => {
      const intensity = r.intensity;
      let color = ringRenderMode === 'xray' ? 'rgba(168, 85, 247, 0.45)' : 'rgba(59, 130, 246, 0.45)';

      if (intensity < 0.1) return;

      const twoThetaRad = (r.twoTheta / 2) * (Math.PI / 180);
      if (r.twoTheta >= 90) return; // falls out of front plate detector

      const R = scaleFactor * Math.tan(twoThetaRad * 2);
      if (R <= 0 || R > width) return;

      // Draw the main blurred ring
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      const alpha = Math.max(0.05, 0.15 + (intensity / 100) * 0.65 - noiseFactor * 0.12);
      ctx.strokeStyle = color.replace('0.45', alpha.toString());
      ctx.lineWidth = 1.0 + (intensity / 100) * 3;
      ctx.stroke();

      // Add spotty graininess (powder speckles)
      const spotCount = Math.floor(intensity * 1.8);
      ctx.fillStyle = color.replace('0.45', '0.85');
      for (let s = 0; s < spotCount; s++) {
        const angle = Math.random() * 2 * Math.PI;
        const rDev = (Math.random() - 0.5) * (1.2 + (intensity / 100) * 1.5);
        const sx = cx + (R + rDev) * Math.cos(angle);
        const sy = cy + (R + rDev) * Math.sin(angle);
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }
    });

    // Label for the center beam stop
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ringRenderMode === 'xray' ? 'X-RAY BEAM STOP' : 'NEUTRON BEAM STOP', cx, cy - 10);
  }, [neutronResults, xrayResults, activeRightTab, ringRenderMode, showIncoherentNoise, atoms]);

  // Incoherent scattering calculation
  const totalIncoherentCrossSection = atoms.reduce((acc, atom) => {
    const cs = INCOHERENT_CROSS_SECTIONS[atom.element] ?? 0.1;
    return acc + cs;
  }, 0);
  const averageIncoherentCrossSection = totalIncoherentCrossSection / (atoms.length || 1);

  // Merge results for chart
  const chartData = neutronResults.map(n => {
    const x = xrayResults.find(x => x.hkl.join('') === n.hkl.join(''));
    return {
      ...n,
      xrayIntensity: x ? x.intensity : 0,
      label: n.hkl.join('')
    };
  });

  // Physical parameters of the Neutron Unit Cell
  const cellVolume = calculateCellVolume ? calculateCellVolume(lattice) : (lattice.a * lattice.b * lattice.c);
  const totalB = atoms.reduce((acc, atom) => acc + atom.b, 0);
  const sumBSq = atoms.reduce((acc, atom) => acc + atom.b * atom.b, 0);
  const cellSLD = cellVolume > 0 ? (10 * totalB) / cellVolume : 0;
  const coherentCrossSection = sumBSq * 4 * Math.PI * 0.01; // barns

  // Solvent Contrast Matching calculations
  const solventSLD = (d2oFraction / 100) * 6.38 + (1 - d2oFraction / 100) * (-0.56);
  const contrastFactor = Math.pow(cellSLD - solventSLD, 2);

  const contrastPoints = Array.from({ length: 11 }, (_, i) => {
    const pct = i * 10;
    const solvSLD = (pct / 100) * 6.38 + (1 - pct / 100) * (-0.56);
    return {
      d2o: pct,
      solventSLD: parseFloat(solvSLD.toFixed(3)),
      sampleSLD: parseFloat(cellSLD.toFixed(3)),
      contrastSq: parseFloat(Math.pow(cellSLD - solvSLD, 2).toFixed(3))
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-600 rounded-full opacity-10 blur-2xl"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-2xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <Atom className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Neutron Cell</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Nuclear Structure Configuration</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowImport(true)}
                className="group relative px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl transition-all hover:border-indigo-500/50"
              >
                <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 rounded-xl transition-colors" />
                <div className="flex items-center gap-2 relative z-10">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Import</span>
                </div>
              </button>
              <button 
                onClick={handleExport}
                className="group relative px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl transition-all hover:border-emerald-500/50"
              >
                <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 rounded-xl transition-colors" />
                <div className="flex items-center gap-2 relative z-10">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Export</span>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-8 relative z-10 overflow-x-auto pb-2 scrollbar-hide">
            {[ 
              { id: 'MgO', label: 'MgO', color: 'blue' },
              { id: 'D2O', label: 'D₂O', color: 'indigo' },
              { id: 'SrTiO3', label: 'SrTiO₃', color: 'cyan' },
              { id: 'MnO', label: 'MnO', color: 'rose' }
            ].map((preset) => (
              <button 
                key={preset.id}
                onClick={() => loadPreset(preset.id as any)} 
                className="px-4 py-2 bg-slate-950/40 border border-slate-800 rounded-xl transition-all hover:bg-slate-800 hover:border-slate-700 active:scale-95 group shrink-0"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{preset.label}</span>
              </button>
            ))}
          </div>

          {showImport && (
            <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-800 relative text-left"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Import Crystal Structure</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Paste Structure JSON</p>
                
                {importError && (
                  <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono font-medium leading-relaxed">
                    ⚠ {importError}
                  </div>
                )}

                <textarea
                  value={importJson}
                  onChange={(e) => {
                    setImportJson(e.target.value);
                    if (importError) setImportError(null);
                  }}
                  placeholder='{"lattice": {"a": 4.2}, "atoms": [...]}'
                  className="w-full h-48 p-4 bg-black/40 border border-slate-800 rounded-2xl font-mono text-xs mb-6 focus:ring-2 focus:ring-blue-500 outline-none text-slate-300 resize-none"
                />
                <div className="flex justify-end gap-4">
                  <button 
                    onClick={() => {
                      setShowImport(false);
                      setImportError(null);
                    }}
                    className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleImport}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.2)] transition-all active:scale-95"
                  >
                    Load Data
                  </button>
                </div>
              </motion.div>
            </div>
          )}

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Crystal System</label>
                <div className="relative">
                  <select
                    value={crystalSystem}
                    onChange={(e) => {
                      const sys = e.target.value as CrystalSystem;
                      setCrystalSystem(sys);
                      setLattice(applySymmetry(sys, lattice));
                    }}
                    className="w-full appearance-none px-4 py-3 bg-slate-950/50 text-blue-400 border border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer pr-10"
                  >
                    {['Cubic', 'Tetragonal', 'Hexagonal', 'Orthorhombic', 'Monoclinic', 'Triclinic'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Wavelength (Å)</label>
                   <button onClick={handleSync} disabled={isSyncing} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/5 text-[9px] font-black text-blue-400 hover:bg-blue-500/10 transition-colors uppercase tracking-widest border border-blue-500/20">
                     <Zap className={`w-2.5 h-2.5 ${isSyncing ? 'animate-pulse' : ''}`} /> Sync
                   </button>
                 </div>
                 <div className="relative group">
                   <input
                    type="number"
                    step="0.01"
                    value={wavelength}
                    onChange={(e) => setWavelength(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-950/50 text-blue-400 border border-slate-800 rounded-2xl text-sm font-black font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all group-hover:border-slate-700 shadow-inner"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-700 uppercase tracking-widest">Å</span>
                 </div>
                 <div className="mt-3 grid grid-cols-2 gap-2">
                   {Object.entries(NEUTRON_WAVELENGTHS).map(([name, val]) => (
                     <button
                       key={name}
                       onClick={() => setWavelength(val)}
                       className={`py-1.5 px-2 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all
                         ${wavelength === val 
                           ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                           : 'bg-black/20 border-slate-800 text-slate-500 hover:text-slate-400 hover:border-slate-700'
                         }
                       `}
                     >
                       {name.replace(' (avg)', '')}
                     </button>
                   ))}
                 </div>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { axis: 'a', disabled: false },
                      { axis: 'b', disabled: ['Cubic', 'Tetragonal', 'Hexagonal'].includes(crystalSystem) },
                      { axis: 'c', disabled: ['Cubic'].includes(crystalSystem) }
                    ].map((item) => (
                      <div key={item.axis} className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{item.axis} (Å)</label>
                        <input
                          type="number"
                          step="0.01"
                          disabled={item.disabled}
                          value={lattice[item.axis as keyof LatticeParameters]}
                          onChange={(e) => handleLatticeChange(item.axis as keyof LatticeParameters, parseFloat(e.target.value))}
                          className={`w-full px-3 py-2 bg-slate-950/50 text-blue-400 border border-slate-800 rounded-xl text-xs font-black font-mono focus:ring-2 focus:ring-blue-500/50 outline-none transition-all ${item.disabled ? 'opacity-40 cursor-not-allowed bg-slate-900 border-dashed' : 'hover:border-slate-700'}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { angle: 'alpha', label: 'α', disabled: ['Cubic', 'Tetragonal', 'Hexagonal', 'Orthorhombic', 'Monoclinic'].includes(crystalSystem) },
                      { angle: 'beta', label: 'β', disabled: ['Cubic', 'Tetragonal', 'Hexagonal', 'Orthorhombic'].includes(crystalSystem) },
                      { angle: 'gamma', label: 'γ', disabled: ['Cubic', 'Tetragonal', 'Hexagonal', 'Orthorhombic', 'Monoclinic'].includes(crystalSystem) }
                    ].map((item) => (
                      <div key={item.angle} className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{item.label}°</label>
                        <input
                          type="number"
                          step="0.1"
                          disabled={item.disabled}
                          value={lattice[item.angle as keyof LatticeParameters]}
                          onChange={(e) => handleLatticeChange(item.angle as keyof LatticeParameters, parseFloat(e.target.value))}
                          className={`w-full px-3 py-2 bg-slate-950/50 text-blue-400 border border-slate-800 rounded-xl text-xs font-black font-mono focus:ring-2 focus:ring-blue-500/50 outline-none transition-all ${item.disabled ? 'opacity-40 cursor-not-allowed bg-slate-900 border-dashed' : 'hover:border-slate-700'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            <div className="pt-8 border-t border-slate-800/50">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-3 bg-blue-500 rounded-full" />
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Atomic Basis</h4>
                </div>
                <button 
                  onClick={addAtom} 
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Atom className="w-3.5 h-3.5" />
                  Add Atom
                </button>
              </div>
              
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                {atoms.map((atom, idx) => (
                  <div key={atom.id || idx} className="bg-[#0B1221]/50 p-5 rounded-2xl border border-slate-800/80 group/atom hover:border-blue-500/30 hover:bg-[#0B1221]/80 transition-all relative">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                       <div className="flex flex-wrap items-center gap-2">
                         <div className="relative">
                            <select 
                              value={atom.element}
                              onChange={(e) => updateAtom(atom.id, 'element', e.target.value)}
                              className="appearance-none font-black bg-slate-900 text-white border border-slate-800 px-4 py-2 rounded-xl cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-24 text-center pr-8"
                            >
                              {Object.keys(NEUTRON_SCATTERING_LENGTHS).sort().map(el => (
                                <option key={el} value={el}>{el}</option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                         </div>
                         {atom.b < 0 && (
                            <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider animate-pulse whitespace-nowrap shrink-0">
                              Negative b
                            </span>
                         )}
                         {atom.element === 'H' && (
                            <button
                              onClick={() => {
                                updateAtom(atom.id, 'element', 'D');
                              }}
                              className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[9px] font-black uppercase tracking-wider hover:bg-violet-500/20 hover:border-violet-400 transition-colors shrink-0"
                              title="Exchange to Deuterium for higher coherent contrast"
                            >
                              ➔ D₂O Swap
                            </button>
                         )}
                         {atom.element === 'D' && (
                            <button
                              onClick={() => {
                                updateAtom(atom.id, 'element', 'H');
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-wider hover:bg-blue-500/20 hover:border-blue-400 transition-colors shrink-0"
                            >
                              ➔ H Swap
                            </button>
                         )}
                       </div>

                       <div className="flex-1 flex items-center justify-between px-4 py-2 bg-[#050B14] border border-slate-850 rounded-xl min-w-[140px]">
                          <div className="flex items-center gap-4">
                            <div className="space-y-0.5 text-left">
                              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Width b</p>
                              <p className={`text-xs font-mono font-black ${atom.b < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {atom.b.toFixed(2)} <span className="text-[8px] opacity-60 font-sans font-medium text-slate-500">fm</span>
                              </p>
                            </div>
                            <div className="w-px h-6 bg-slate-850" />
                            <div className="space-y-0.5 text-left">
                              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Atomic Z</p>
                              <p className="text-xs font-mono font-black text-blue-400">
                                {ATOMIC_NUMBERS[atom.element] || '?'}
                              </p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => removeAtom(atom.id)} 
                            className="p-1.5 text-slate-600 hover:text-rose-400 bg-slate-900 border border-slate-850 rounded-lg hover:border-rose-500/30 transition-all opacity-0 group-hover/atom:opacity-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {['x', 'y', 'z', 'B_iso'].map((field) => (
                        <div key={field} className="space-y-1.5 relative text-left">
                          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">{field === 'B_iso' ? 'B-fact' : field}</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={atom[field as keyof typeof atom]} 
                            onChange={(e) => updateAtom(atom.id, field as any, parseFloat(e.target.value))} 
                            className="w-full px-3 py-2 bg-black/40 text-slate-300 border border-slate-800 rounded-xl font-mono text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0B1528] p-6 rounded-3xl border border-blue-500/10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
           
           <div className="flex items-center gap-3 mb-5 relative z-10 text-left">
             <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/30">
               <Database className="w-4 h-4 text-blue-400" />
             </div>
             <div>
               <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">Nuclear Physical Signatures</h4>
               <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 block">Computed Unit Cell Properties</span>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4 relative z-10 text-left">
             <div className="bg-[#070D18]/70 p-3 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Cell Volume</span>
                <span className="text-xs font-mono font-black text-blue-400 block mt-1">{cellVolume.toFixed(2)} <span className="text-[9px] text-slate-600 font-sans font-bold">Å³</span></span>
             </div>
             
             <div className="bg-[#070D18]/70 p-3 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Net b length</span>
                <span className={`text-xs font-mono font-black block mt-1 ${totalB < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{totalB.toFixed(2)} <span className="text-[9px] text-slate-600 font-sans font-bold">fm</span></span>
             </div>

             <div className="bg-[#070D18]/70 p-3 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">SLD (Nuclear)</span>
                <span className="text-xs font-mono font-black text-amber-400 block mt-1">{cellSLD.toFixed(3)} <span className="text-[8px] text-slate-600 font-sans font-bold">10⁻⁶Å⁻²</span></span>
             </div>

             <div className="bg-[#070D18]/70 p-3 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Est. Coherent σ</span>
                <span className="text-xs font-mono font-black text-purple-400 block mt-1">{coherentCrossSection.toFixed(2)} <span className="text-[9px] text-slate-600 font-sans font-bold">barn</span></span>
             </div>
           </div>

           <div className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[10px] text-slate-400 leading-normal relative z-10 text-left select-none">
             <strong>Neutron scattering</strong> relies on nuclear interactions. Unlike X-rays, scattering lengths fluctuate non-linearly with Z, enabling superior detection of light elements (e.g., ¹H vs ²D isotopic swaps).
           </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        {/* Dynamic Display Panel */}
        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 sm:p-8 flex flex-col relative overflow-hidden min-h-[500px] transition-all duration-500 hover:border-slate-700/80 shadow-2xl">
           <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />

           {/* Tab Controls */}
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800 relative z-10">
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-slate-800/80">
                 {[
                   { id: 'pattern', label: 'Diffraction Map', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
                    { id: 'rings', label: '2D Detector Rings', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
                    { id: 'solvent', label: 'Solvent Contrast', color: 'text-pink-500 bg-pink-500/10 border-pink-500/30' },
                   { id: 'projection', label: 'Unit Cell Projector', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                   { id: 'contrast', label: 'Contrast analysis', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' }
                 ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveRightTab(t.id as any)}
                      className={`px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all select-none ${
                        activeRightTab === t.id 
                          ? `${t.color} shadow-inner border` 
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      {t.label}
                    </button>
                 ))}
              </div>

              {activeRightTab === 'pattern' && (
                <button
                  onClick={() => setComparisonMode(!comparisonMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all border shrink-0 ${
                    comparisonMode 
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/25' 
                      : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  {comparisonMode ? 'X-ray Compare: ON' : 'Compare with X-ray'}
                </button>
              )}

              {activeRightTab === 'projection' && (
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-slate-800">
                  {['ab', 'bc', 'ca'].map((plane) => (
                    <button
                      key={plane}
                      onClick={() => setProjectionPlane(plane as any)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        projectionPlane === plane
                          ? 'bg-emerald-500/20 text-emerald-400 font-black'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {plane.toUpperCase()}-Plane
                    </button>
                  ))}
                </div>
              )}


           {activeRightTab === 'rings' && (
                 <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-slate-800 shrink-0">
                   <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">Radiation:</span>
                   {[
                     { id: 'total', label: 'Neutron' },
                     { id: 'xray', label: 'X-Ray' }
                   ].map((mode) => (
                     <button
                       key={mode.id}
                       onClick={() => setRingRenderMode(mode.id as any)}
                       className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                         ringRenderMode === mode.id
                           ? mode.id === 'xray' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                           : 'text-slate-600 hover:text-slate-400'
                       }`}
                     >
                       {mode.label}
                     </button>
                   ))}
                   <div className="w-px h-4 bg-slate-850 mx-1" />
                   <button
                     onClick={() => setShowIncoherentNoise(!showIncoherentNoise)}
                     className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                       showIncoherentNoise
                         ? 'bg-amber-500/20 text-amber-400'
                         : 'text-slate-600 hover:text-slate-400'
                     }`}
                     title="Toggle isotropic incoherent background noise haze"
                   >
                     Haze: {showIncoherentNoise ? 'ON' : 'OFF'}
                   </button>
                 </div>
               )}

               {activeRightTab === 'solvent' && (
                 <div className="flex items-center gap-2 shrink-0 bg-black/40 px-3 py-1.5 rounded-xl border border-slate-800">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Solvent Mix</span>
                   <span className="text-[10px] font-mono text-pink-400 font-extrabold bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/25">
                     {100 - d2oFraction}% H₂O / {d2oFraction}% D₂O
                   </span>
                 </div>
               )}
            </div>

            {/* Panels Content */}
           <div className="flex-1 flex flex-col justify-between relative z-10">
              {activeRightTab === 'pattern' && (
                 <div className="h-[360px] w-full relative z-10 flex flex-col justify-between">
                    <div className="absolute top-0 left-0 -mt-4 -ml-4 w-32 h-32 bg-blue-600 rounded-full opacity-5 blur-3xl" />
                    <div className="flex-1 w-full min-h-0 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                          <XAxis 
                            dataKey="twoTheta" 
                            label={{ value: '2θ (degrees)', position: 'bottom', offset: 0, fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                            type="number" 
                            domain={[0, 'auto']}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                          />
                          <YAxis hide />
                          <Tooltip 
                            cursor={{fill: 'rgba(51, 65, 85, 0.2)'}} 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                            itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-slate-800">
                                    <p className="font-extrabold border-b border-slate-800/80 pb-2 mb-2 text-xs uppercase tracking-wider text-slate-300">Plane ({d.hkl.join(' ')}) at {d.twoTheta.toFixed(2)}°</p>
                                    <div className="space-y-1.5 min-w-[150px]">
                                      <p className="text-blue-400 font-black text-xs flex justify-between gap-4"><span>Neutron Intensity:</span> <span>{d.intensity.toFixed(1)}%</span></p>
                                      {comparisonMode && (
                                        <p className="text-purple-400 font-black text-xs flex justify-between gap-4"><span>X-ray Intensity:</span> <span>{d.xrayIntensity.toFixed(1)}%</span></p>
                                      )}
                                      <div className="w-full h-px bg-slate-800/60 my-2" />
                                      <p className="text-slate-500 text-[10px] font-mono flex justify-between">
                                         <span>d-Spacing:</span>
                                         <span>{d.dSpacing.toFixed(3)} Å</span>
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                          <Bar name="Neutron Intensity" dataKey="intensity" barSize={8} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          {comparisonMode && (
                            <Bar name="X-ray Intensity" dataKey="xrayIntensity" barSize={8} fill="#a855f7" radius={[4, 4, 0, 0]} />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              )}

              {activeRightTab === 'projection' && (
                 <div className="flex flex-col lg:flex-row gap-6 items-center flex-1 py-2">
                    <div className="relative w-[280px] h-[280px] bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-850 flex items-center justify-center p-2 shadow-sm dark:shadow-inner scale-100 shrink-0 overflow-hidden group/projection transition-all hover:shadow-md dark:hover:shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]">
                       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.03)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.05)_0%,transparent_70%)] pointer-events-none opacity-0 group-hover/projection:opacity-100 transition-opacity duration-700" />
                       {/* SVG grid renderer */}
                       <svg width="260" height="260" viewBox="0 0 300 300" className="w-full h-full drop-shadow-sm">
                          {/* Outer cell wireframe box */}
                          <rect x="40" y="40" width="220" height="220" fill="rgba(255,255,255,0.02)" stroke="#94a3b8" strokeWidth="2.5" className="dark:stroke-[#334155] dark:fill-none" />
                          <rect x="40" y="40" width="220" height="220" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-60 dark:opacity-40 animate-pulse dark:stroke-[#10b981]" />
                          
                          {/* Inner grid lines representing 0.25 steps */}
                          {[0.25, 0.5, 0.75].map((g) => (
                             <React.Fragment key={g}>
                               <line x1={40 + g*220} y1="40" x2={40 + g*220} y2="260" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" className="dark:stroke-[#1e293b]" />
                               <line x1="40" y1={40 + g*220} x2="260" y2={40 + g*220} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" className="dark:stroke-[#1e293b]" />
                             </React.Fragment>
                          ))}

                          {/* Axes indicators */}
                          <text x="32" y="275" fill="#64748b" className="text-[10px] font-mono font-bold uppercase dark:fill-[#475569]">
                             {projectionPlane === 'ab' ? 'X' : projectionPlane === 'bc' ? 'Y' : 'Z'}
                          </text>
                          <text x="20" y="50" fill="#64748b" className="text-[10px] font-mono font-bold uppercase dark:fill-[#475569]">
                             {projectionPlane === 'ab' ? 'Y' : projectionPlane === 'bc' ? 'Z' : 'X'}
                          </text>

                          {/* Directional small arrows on axes */}
                          <path d="M 40 260 L 60 260 M 55 257 L 60 260 L 55 263" fill="none" stroke="#64748b" strokeWidth="1.5" className="dark:stroke-[#475569]" />
                          <path d="M 40 260 L 40 240 M 37 245 L 40 240 L 43 245" fill="none" stroke="#64748b" strokeWidth="1.5" className="dark:stroke-[#475569]" />

                          {/* Atoms rendering */}
                          {atoms.map((atom, idx) => {
                             let coord1 = 0; let coord2 = 0;
                             if (projectionPlane === 'ab') {
                                coord1 = atom.x; coord2 = atom.y;
                             } else if (projectionPlane === 'bc') {
                                coord1 = atom.y; coord2 = atom.z;
                             } else {
                                coord1 = atom.z; coord2 = atom.x;
                             }

                             // Ensure valid coordinates wrapped to 0-1 range gracefully
                             const w1 = ((coord1 % 1) + 1) % 1;
                             const w2 = ((coord2 % 1) + 1) % 1;

                             const cx = 40 + w1 * 220;
                             const cy = 260 - w2 * 220;

                             const r = Math.max(8, 12 + Math.abs(atom.b) * 1.2);
                             const isNegative = atom.b < 0;

                             return (
                               <g key={atom.id + idx} className="group/projection-atom cursor-pointer">
                                  {isNegative ? (
                                    <>
                                      {/* Negative width scatterer gets dashed indicators */}
                                      <circle cx={cx} cy={cy} r={r * 1.6} fill="url(#negGlow)" opacity="0" className="group-hover/projection-atom:opacity-100 transition-opacity duration-300" />
                                      <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 4" className="opacity-80 animate-[spin_6s_linear_infinite]" />
                                      <circle cx={cx} cy={cy} r={r} fill="url(#negGrad)" stroke="#be123c" strokeWidth="2.5" className="dark:stroke-[#f43f5e] group-hover/projection-atom:scale-110 transition-transform duration-300 drop-shadow-md" />
                                    </>
                                  ) : (
                                    <>
                                      {/* Positive width scatterers get gorgeous cyan/emerald gradients */}
                                      <circle cx={cx} cy={cy} r={r * 1.6} fill="url(#posGlow)" opacity="0" className="group-hover/projection-atom:opacity-100 transition-opacity duration-300" />
                                      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#059669" strokeWidth="1.2" className="opacity-40 animate-[spin_8s_linear_infinite]" strokeDasharray="8 4" />
                                      <circle cx={cx} cy={cy} r={r} fill="url(#posGrad)" stroke="#047857" strokeWidth="2.5" className="dark:stroke-[#10b981] group-hover/projection-atom:scale-110 transition-transform duration-300 drop-shadow-md" />
                                    </>
                                  )}
                                  
                                  {/* Symbol Label inside the atom */}
                                  <text 
                                    x={cx} 
                                    y={cy + 3.5} 
                                    textAnchor="middle" 
                                    fill="#ffffff" 
                                    className="text-[10px] font-black font-sans pointer-events-none select-none text-center drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                                  >
                                     {atom.element}
                                  </text>

                                  {/* Detailed tooltip on hover */}
                                  <title>
                                     {atom.label} ({atom.element})&#10;
                                     Pos: ({atom.x.toFixed(2)}, {atom.y.toFixed(2)}, {atom.z.toFixed(2)})&#10;
                                     Scattering length b: {atom.b.toFixed(2)} fm
                                  </title>
                               </g>
                             );
                          })}

                          {/* SVG Definitions for rich gradients */}
                          <defs>
                             <radialGradient id="posGrad" cx="30%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#6ee7b7" className="dark:stop-color-[#34d399]" />
                                <stop offset="50%" stopColor="#10b981" className="dark:stop-color-[#059669]" />
                                <stop offset="100%" stopColor="#047857" className="dark:stop-color-[#064e3b]" />
                             </radialGradient>
                             <radialGradient id="negGrad" cx="30%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#fca5a5" className="dark:stop-color-[#fca5a5]" />
                                <stop offset="50%" stopColor="#e11d48" className="dark:stop-color-[#e11d48]" />
                                <stop offset="100%" stopColor="#9f1239" className="dark:stop-color-[#881337]" />
                             </radialGradient>
                             <radialGradient id="posGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                             </radialGradient>
                             <radialGradient id="negGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#e11d48" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
                             </radialGradient>
                          </defs>
                       </svg>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-4 text-left">
                       <div className="space-y-1">
                          <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.25em]">Nuclear Projection</h4>
                          <h3 className="text-base font-black text-slate-800 dark:text-white capitalize leading-tight">Unit Cell Perspective Looking Down</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                             This visual map projects the exact $(x, y, z)$ coordinates inside your unit cell onto a 2D plane. 
                          </p>
                       </div>
                       
                       <div className="space-y-2.5 bg-white dark:bg-black/40 p-4 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm dark:shadow-none">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400">
                             <span className="font-bold flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm"/> Positive b (fm)</span>
                             <span className="text-slate-800 dark:text-white font-black">Solid Emerald Spheres</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400">
                             <span className="font-bold flex items-center gap-1.5">
                               <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm relative">
                                 <span className="absolute inset-0 rounded-full border border-rose-500 animate-ping"></span>
                               </span> Negative b (fm)
                             </span>
                             <span className="text-rose-600 dark:text-rose-400 font-extrabold">Dashed Glowing Pink Spheres</span>
                          </div>
                          <div className="w-full h-px bg-slate-200 dark:bg-slate-800/80 my-1" />
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400">
                             <span className="font-bold">Calculated Volume</span>
                             <span className="text-blue-600 dark:text-blue-400 font-black bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-500/20">{calculateCellVolume ? calculateCellVolume(lattice).toFixed(2) : (lattice.a*lattice.b*lattice.c).toFixed(2)} Å³</span>
                          </div>
                       </div>
                       <p className="text-[10px] italic text-slate-500 font-medium bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                           <span className="font-bold text-amber-600 dark:text-amber-500">*Hint:</span> Negative scattering length means the nucleus scatters neutrons out-of-phase (180° shift) relative to positive cores. This only happens with specific isotopes like 1H, 48Ti, or 55Mn!
                        </p>
                    </div>
                 </div>
              )}

              {activeRightTab === 'contrast' && (
                 <div className="flex flex-col gap-6 flex-1 py-1">
                    <div className="space-y-1 text-left">
                       <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em]">Light Element Contrast</h4>
                       <h3 className="text-base font-black text-white">X-ray (Z) vs. Neutron Scattering Length (|b|)</h3>
                       <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                          X-rays scatter from electron shells, so heavy elements render light elements completely invisible. Neutrons scatter from nuclei and can detect light elements easily.
                       </p>
                    </div>

                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                       {atoms.map((atom, idx) => {
                          const xrayVal = ATOMIC_NUMBERS[atom.element] || 1;
                          const neutronVal = Math.abs(atom.b);
                          
                          // Normalize scales
                          const xrayPct = Math.min((xrayVal / 92) * 100, 100);
                          const neutronPct = Math.min((neutronVal / 15) * 100, 100);

                          return (
                             <div key={atom.id + '-' + idx} className="bg-black/35 p-3 sm:p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-[11px] font-black">
                                   <span className="text-white font-mono flex items-center gap-2">
                                      <span className="w-2 h-2 rounded bg-amber-400" />
                                      {atom.label} ({atom.element})
                                   </span>
                                   <span className="text-slate-500 font-mono text-[10px]">
                                      Z = {xrayVal} | b = {atom.b.toFixed(2)} fm
                                   </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                   {/* X-Ray strength bar */}
                                   <div className="flex flex-col gap-1">
                                      <div className="flex justify-between text-[8px] font-black text-purple-400 uppercase tracking-wider leading-none">
                                         <span>X-Ray (Electrons)</span>
                                         <span>f ~ {xrayVal}</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                         <div className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)] rounded-full transition-all duration-500" style={{ width: `${xrayPct}%` }} />
                                      </div>
                                   </div>

                                   {/* Neutron strength bar */}
                                   <div className="flex flex-col gap-1">
                                      <div className="flex justify-between text-[8px] font-black text-blue-400 uppercase tracking-wider leading-none">
                                         <span>Neutron (Nuclei)</span>
                                         <span>|b| = {neutronVal.toFixed(1)}</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-[#1e293b]">
                                         <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)] rounded-full transition-all duration-500" style={{ width: `${neutronPct}%` }} />
                                      </div>
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                    </div>

                    <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 text-xs text-amber-300/90 leading-relaxed font-semibold italic text-left flex items-start gap-3 mt-auto">
                       <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                       <div>
                          Notice how <strong className="text-amber-400">Hydrogen / Deuterium</strong> has virtually zero representation on the X-Ray scale, but stands out as a major coherent scatterer on the Neutron scale. Swapping H to D improves coherent signals immensely!
                       </div>
                    </div>
                 </div>
              )}

               {activeRightTab === 'rings' && (
                  <div className="flex flex-col lg:flex-row gap-6 items-center flex-1 py-1 animate-fadeIn">
                     <div className="relative w-[280px] h-[280px] bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center p-2 shadow-inner scale-100 shrink-0 overflow-hidden group/rings transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                        <canvas 
                          ref={ringsCanvasRef} 
                          className="w-full h-full rounded-2xl cursor-crosshair"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="absolute bottom-3 right-3 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-slate-400 border border-slate-800 pointer-events-none">
                           2D Powder Plate
                        </div>
                     </div>

                     <div className="flex-1 flex flex-col justify-center gap-4 text-left">
                        <div className="space-y-1">
                           <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.25em]">2D Debye-Scherrer Rings</h4>
                           <h3 className="text-base font-black text-white capitalize leading-tight">Diffraction Cone Projection</h3>
                           <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                              This detector simulates a flat-plate pixel tracker intercepting the 3D Debye-Scherrer diffraction cones backscattered from a powder sample.
                           </p>
                        </div>
                        
                        <div className="space-y-2.5 bg-black/40 p-4 border border-slate-800 rounded-2xl">
                           <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                              <span className="font-bold flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block shadow-sm"/> Coherent Signal</span>
                              <span className="text-white font-black">Concentric Debye Rings</span>
                           </div>
                           <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                              <span className="font-bold flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block shadow-sm"/> Background Noise</span>
                              <span className="text-amber-500 font-black">
                                 {showIncoherentNoise && averageIncoherentCrossSection > 4 ? 'High Haze (H-Incoherent)' : 'Low Haze'}
                              </span>
                           </div>
                           <div className="w-full h-px bg-slate-800/80 my-1" />
                           <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                              <span className="font-bold">Total Inc. Cross Section</span>
                              <span className="text-amber-400 font-black">{totalIncoherentCrossSection.toFixed(2)} barns</span>
                           </div>
                        </div>

                        {showIncoherentNoise && averageIncoherentCrossSection > 4 && (
                          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[10px] text-amber-400 leading-snug">
                             <span className="font-extrabold block uppercase tracking-wider mb-0.5">⚠️ High Incoherent Haze:</span>
                             Hydrogen has a massive incoherent cross-section (80.26 barns) that creates a diffuse isotropic background "haze", obscuring coherent rings. Click the <strong className="text-white">"D₂O Swap" preset</strong> or deuterate your atoms to clean up the signal!
                          </div>
                        )}
                     </div>
                  </div>
               )}

               {activeRightTab === 'solvent' && (
                  <div className="flex flex-col gap-5 flex-1 py-1 animate-fadeIn">
                     <div className="space-y-1 text-left">
                        <h4 className="text-[10px] font-black text-pink-400 uppercase tracking-[0.25em]">Solvent Contrast Matching</h4>
                        <h3 className="text-base font-black text-white">Scattering Length Density (SLD) Matching Curve</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                           In SANS/neutron diffraction, mixing H₂O ($b_H = -3.74$ fm) and D₂O ($b_D = 6.67$ fm) lets you vary the solvent's SLD to match specific parts of the sample, rendering them invisible and isolating other structures.
                        </p>
                     </div>

                     <div className="h-[200px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                           <ComposedChart data={contrastPoints} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                              <XAxis 
                                 dataKey="d2o" 
                                 label={{ value: '% D₂O in H₂O / D₂O solvent mix', position: 'bottom', offset: 5, fill: '#64748b', fontSize: 9, fontWeight: 700 }} 
                                 tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                              />
                              <YAxis 
                                 label={{ value: 'SLD (10⁻⁶ Å⁻²)', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                                 tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                              />
                              <Tooltip 
                                 contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                                 content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                       const d = payload[0].payload;
                                       return (
                                          <div className="bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-[10px] space-y-1 text-left">
                                             <p className="font-bold text-pink-400">{d.d2o}% D₂O Solvent Mix</p>
                                             <p className="text-slate-300">Solvent SLD: <strong>{d.solventSLD} 10⁻⁶ Å⁻²</strong></p>
                                             <p className="text-slate-300">Sample SLD: <strong>{d.sampleSLD} 10⁻⁶ Å⁻²</strong></p>
                                             <p className="text-slate-400">Relative Contrast: <strong>{d.contrastSq} 10⁻¹² Å⁻⁴</strong></p>
                                          </div>
                                       );
                                    }
                                    return null;
                                 }}
                              />
                              <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }} />
                              <Line name="Solvent SLD" type="monotone" dataKey="solventSLD" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} />
                              <Line name="Sample SLD" type="monotone" dataKey="sampleSLD" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                           </ComposedChart>
                        </ResponsiveContainer>
                     </div>

                     <div className="bg-black/35 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                           <div className="flex-1">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1.5">
                                 <span className="text-slate-400">Solvent D₂O Fraction</span>
                                 <span className="text-pink-400">{d2oFraction}%</span>
                              </div>
                              <input 
                                 type="range" 
                                 min="0" 
                                 max="100" 
                                 value={d2oFraction} 
                                 onChange={(e) => setD2oFraction(parseInt(e.target.value))}
                                 className="w-full accent-pink-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer border border-slate-800"
                              />
                           </div>
                           
                           <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 min-w-[140px] text-center flex flex-col justify-center">
                              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest">Relative Contrast</span>
                              <span className={`text-base font-black font-mono mt-0.5 ${contrastFactor < 0.15 ? 'text-emerald-400' : 'text-pink-400 shadow-pulse'}`}>
                                 {Math.max(0, contrastFactor * 10).toFixed(2)}
                              </span>
                              <span className="text-[7px] text-slate-400 uppercase mt-0.5">arbitrary scale</span>
                           </div>
                        </div>

                        <div className="w-full h-px bg-slate-800/80" />

                        <div className="text-[10px] font-mono leading-relaxed text-slate-400 text-left">
                           {contrastFactor < 0.15 ? (
                              <p className="text-emerald-400 font-bold animate-pulse flex items-center gap-2">
                                 ✨ MATCH POINT ACHIEVED ({d2oFraction}% D₂O): The average nuclear scattering of the solvent perfectly matches your crystal cell! The coherent scattering signal of the cell vanishes.
                              </p>
                           ) : (
                              <p>
                                 Solvent SLD is <strong className="text-pink-400 font-bold">{solventSLD.toFixed(2)} 10⁻⁶ Å⁻²</strong>. Crystal SLD is <strong className="text-blue-400 font-bold">{cellSLD.toFixed(2)} 10⁻⁶ Å⁻²</strong>. Adjust the slider to find the crossing point where contrast drops to 0!
                              </p>
                           )}
                        </div>
                     </div>
                  </div>
               )}
           </div>
        </div>

        <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden flex flex-col max-h-[400px]">
          <div className="p-4 border-b border-slate-800 bg-slate-800/40">
             <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
               <span className="w-4 h-[1px] bg-slate-600"></span> Reflections Table
             </h3>
          </div>
           <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-sm text-left text-slate-300 border-collapse">
                 <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                       <th className="px-5 py-4 font-black border-b border-slate-800">HKL Plane</th>
                       <th className="px-5 py-4 font-black border-b border-slate-800 text-center">2θ (°)</th>
                       <th className="px-5 py-4 font-black border-b border-slate-800 text-center">d (Å)</th>
                       <th className="px-5 py-4 font-black border-b border-slate-800 text-right">|F|²</th>
                       <th className="px-5 py-4 font-black border-b border-slate-800 text-right text-blue-400">Int %</th>
                       {comparisonMode && (
                         <th className="px-5 py-4 font-black border-b border-slate-800 text-right text-purple-400">X-Ray %</th>
                       )}
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/30">
                    {chartData.map((r, i) => (
                       <tr key={`${r.twoTheta}-${i}`} className="bg-slate-900 hover:bg-slate-800/80 transition-colors group">
                          <td className="px-5 py-3 font-mono font-bold text-slate-200 group-hover:text-white transition-colors">
                            <span className="opacity-30 mr-1 text-[10px]">[</span>
                            {r.hkl.join(' ')}
                            <span className="opacity-30 ml-1 text-[10px]">]</span>
                          </td>
                          <td className="px-5 py-3 text-slate-400 font-medium text-center">{r.twoTheta.toFixed(2)}</td>
                          <td className="px-5 py-3 text-slate-500 font-medium font-mono text-center">{r.dSpacing.toFixed(3)}</td>
                          <td className="px-5 py-3 text-right font-mono text-xs text-slate-400">
                             {r.F_squared.toFixed(1)}
                          </td>
                          <td className="px-5 py-3 font-bold text-right text-blue-400 bg-blue-500/5 transition-colors group-hover:bg-blue-500/10">
                            {r.intensity.toFixed(1)}
                          </td>
                          {comparisonMode && (
                            <td className="px-5 py-3 font-bold text-right text-purple-400 bg-purple-500/5 transition-colors group-hover:bg-purple-500/10">
                              {r.xrayIntensity?.toFixed(1)}
                            </td>
                          )}
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};
