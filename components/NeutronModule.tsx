
import React, { useState, useEffect } from 'react';
import { NeutronAtom, NeutronResult, StandardWavelength } from '../types';
import { calculateNeutronDiffraction, calculateXRayDiffraction, NEUTRON_SCATTERING_LENGTHS, ATOMIC_NUMBERS } from '../utils/physics';
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
  ComposedChart
} from 'recharts';
import { Layers, Zap, Atom, Upload, Download, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NeutronModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.54); 
  const [availableWavelengths, setAvailableWavelengths] = useState<StandardWavelength[]>([
    { label: 'Thermal', value: 1.54, type: 'Neutron' },
    { label: 'Cold (Be Filter)', value: 3.96, type: 'Neutron' },
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [latticeA, setLatticeA] = useState<number>(4.20); 
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  
  const [atoms, setAtoms] = useState<NeutronAtom[]>([
    { id: '1', element: 'O', label: 'Oxygen', b: 5.80, x: 0, y: 0, z: 0, B_iso: 0.5 },
    { id: '2', element: 'Mg', label: 'Magnesium', b: 5.38, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.4 },
  ]);

  const [neutronResults, setNeutronResults] = useState<NeutronResult[]>([]);
  const [xrayResults, setXrayResults] = useState<NeutronResult[]>([]);

  const handleCalculate = () => {
    const nResults = calculateNeutronDiffraction(wavelength, { a: latticeA }, atoms);
    setNeutronResults(nResults);

    if (comparisonMode) {
      const xResults = calculateXRayDiffraction(wavelength, { a: latticeA }, atoms);
      setXrayResults(xResults);
    } else {
      setXrayResults([]);
    }
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
      if (data.lattice && data.lattice.a) {
        setLatticeA(data.lattice.a);
      }
      if (data.atoms && Array.isArray(data.atoms)) {
        // Map imported atoms to NeutronAtom structure, looking up scattering lengths if needed
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
    } catch (e) {
      alert("Invalid JSON format");
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [atoms, wavelength, latticeA, comparisonMode]);

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
       setLatticeA(4.21);
       setAtoms([
         { id: '1', element: 'Mg', label: 'Mg', b: 5.38, x: 0, y: 0, z: 0, B_iso: 0.3 },
         { id: '2', element: 'O', label: 'O', b: 5.80, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5 }
       ]);
    } else if (type === 'D2O') {
       setLatticeA(6.35);
       setAtoms([
         { id: '1', element: 'O', label: 'O', b: 5.80, x: 0, y: 0, z: 0, B_iso: 1.0 },
         { id: '2', element: 'D', label: 'D', b: 6.67, x: 0.33, y: 0.33, z: 0.33, B_iso: 1.5 },
         { id: '3', element: 'D', label: 'D', b: 6.67, x: 0.66, y: 0.66, z: 0.66, B_iso: 1.5 }
       ]);
    } else if (type === 'SrTiO3') {
       setLatticeA(3.905); 
       setAtoms([
         { id: '1', element: 'Sr', label: 'Sr', b: 7.02, x: 0, y: 0, z: 0, B_iso: 0.4 }, // Sr wasn't in list, using approx or need to add. Let's use Ti for now if Sr missing, or add Sr. Sr is ~7.02.
         { id: '2', element: 'Ti', label: 'Ti', b: -3.44, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.4 },
         { id: '3', element: 'O', label: 'O', b: 5.80, x: 0.5, y: 0.5, z: 0, B_iso: 0.6 },
         { id: '4', element: 'O', label: 'O', b: 5.80, x: 0.5, y: 0, z: 0.5, B_iso: 0.6 },
         { id: '5', element: 'O', label: 'O', b: 5.80, x: 0, y: 0.5, z: 0.5, B_iso: 0.6 },
       ]);
    } else if (type === 'MnO') {
      setLatticeA(4.44);
      setAtoms([
        { id: '1', element: 'Mn', label: 'Mn (Neg b!)', b: -3.73, x: 0, y: 0, z: 0, B_iso: 0.5 },
        { id: '2', element: 'O', label: 'O', b: 5.80, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5 }
      ]);
    }
  };

  // Merge results for chart
  const chartData = neutronResults.map(n => {
    const x = xrayResults.find(x => x.hkl.join('') === n.hkl.join(''));
    return {
      ...n,
      xrayIntensity: x ? x.intensity : 0,
      label: n.hkl.join('')
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
                className="bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-800 relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Import Crystal Structure</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Paste Structure JSON</p>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='{"lattice": {"a": 4.2}, "atoms": [...]}'
                  className="w-full h-48 p-4 bg-black/40 border border-slate-800 rounded-2xl font-mono text-xs mb-8 focus:ring-2 focus:ring-blue-500 outline-none text-slate-300 resize-none"
                />
                <div className="flex justify-end gap-4">
                  <button 
                    onClick={() => setShowImport(false)}
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

          <div className="space-y-8 relative z-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Wavelength</label>
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
                    className="w-full px-4 py-3 bg-slate-950/50 text-blue-400 border border-slate-800 rounded-2xl text-sm font-black font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all group-hover:border-slate-700"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase tracking-widest">Å</span>
                 </div>
                 <div className="flex flex-wrap gap-2 mt-3">
                   {availableWavelengths.map(aw => (
                     <button 
                        key={aw.label} 
                        onClick={() => setWavelength(aw.value)}
                        className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                          wavelength === aw.value 
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                            : 'bg-black/20 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                        }`}
                        title={aw.label}
                     >
                       {aw.label.split(' ')[0]}
                     </button>
                   ))}
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Lattice Parameter</label>
                 <div className="relative group">
                   <input
                    type="number"
                    step="0.01"
                    value={latticeA}
                    onChange={(e) => setLatticeA(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-950/50 text-blue-400 border border-slate-800 rounded-2xl text-sm font-black font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all group-hover:border-slate-700"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase tracking-widest pr-4 border-r border-slate-800">a</span>
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
                {atoms.map((atom) => (
                  <div key={atom.id} className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800/80 group/atom hover:border-slate-700 transition-colors relative">
                    <div className="flex items-center gap-4 mb-4">
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

                       <div className="flex-1 flex items-center justify-between px-4 py-2 bg-black/40 border border-slate-800 rounded-xl">
                          <div className="flex items-center gap-6">
                            <div className="space-y-0.5">
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Width b</p>
                              <p className={`text-xs font-mono font-black ${atom.b < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {atom.b.toFixed(2)} <span className="text-[9px] opacity-60">fm</span>
                              </p>
                            </div>
                            <div className="w-px h-6 bg-slate-800" />
                            <div className="space-y-0.5">
                              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Atomic Z</p>
                              <p className="text-xs font-mono font-black text-blue-400">
                                {ATOMIC_NUMBERS[atom.element] || '?'}
                              </p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => removeAtom(atom.id)} 
                            className="p-2 text-slate-600 hover:text-rose-400 bg-slate-900 border border-slate-800 rounded-lg hover:border-rose-500/30 transition-all opacity-0 group-hover/atom:opacity-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {['x', 'y', 'z', 'B_iso'].map((field) => (
                        <div key={field} className="space-y-1.5 relative">
                          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">{field === 'B_iso' ? 'B-fact' : field}</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={atom[field as keyof NeutronAtom]} 
                            onChange={(e) => updateAtom(atom.id, field as keyof NeutronAtom, parseFloat(e.target.value))} 
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

        <div className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
           <div className="flex gap-5 relative z-10">
             <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shrink-0 self-start">
               <Info className="w-5 h-5 text-blue-400" />
             </div>
             <div className="space-y-2">
               <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Neutron Theory Capsule</h4>
               <p className="text-xs text-slate-400 leading-relaxed font-medium">
                 Neutrons scatter from atomic nuclei via strong interaction. The scattering length <code className="bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-black">b</code> fluctuates randomly across the periodic table and can even be <span className="text-rose-400 font-bold">negative</span> (e.g., Li, Mn, Ti, H) which leads to unique contrast vs X-rays scattering from electron densities.
               </p>
             </div>
           </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 h-[450px] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 -mt-4 -ml-4 w-32 h-32 bg-blue-600 rounded-full opacity-5 blur-3xl"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Diffraction Pattern
            </h3>
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all border ${
                comparisonMode 
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30' 
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {comparisonMode ? 'X-ray Comparison ON' : 'Compare with X-ray'}
            </button>
          </div>
          <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="twoTheta" 
                  label={{ value: '2θ (degrees)', position: 'bottom', offset: 0, fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} 
                  type="number" 
                  domain={[0, 'auto']}
                  tick={{ fill: '#64748b', fontSize: 11 }}
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
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700">
                          <p className="font-bold border-b border-slate-800 pb-2 mb-2 text-sm">({d.hkl.join(' ')}) at {d.twoTheta.toFixed(2)}°</p>
                          <div className="space-y-1.5">
                            <p className="text-blue-400 font-medium text-xs flex justify-between gap-4"><span>Neutron Int:</span> <span>{d.intensity.toFixed(1)}%</span></p>
                            {comparisonMode && (
                              <p className="text-purple-400 font-medium text-xs flex justify-between gap-4"><span>X-ray Int:</span> <span>{d.xrayIntensity.toFixed(1)}%</span></p>
                            )}
                            <p className="text-slate-500 text-[10px] mt-2 pt-2 border-t border-slate-800 font-mono">d = {d.dSpacing.toFixed(3)} Å</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }} />
                <Bar name="Neutron" dataKey="intensity" barSize={6} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                {comparisonMode && (
                  <Bar name="X-ray" dataKey="xrayIntensity" barSize={6} fill="#a855f7" radius={[4, 4, 0, 0]} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden flex flex-col max-h-[400px]">
          <div className="p-4 border-b border-slate-800 bg-slate-800/40">
             <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
               <span className="w-4 h-[1px] bg-slate-600"></span> Reflections Table
             </h3>
          </div>
          <div className="overflow-auto flex-1 custom-scrollbar">
             <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky top-0 backdrop-blur-sm z-10">
                   <tr>
                      <th className="px-5 py-3 font-bold border-b border-slate-800">HKL</th>
                      <th className="px-5 py-3 font-bold border-b border-slate-800">2θ (°)</th>
                      <th className="px-5 py-3 font-bold border-b border-slate-800">d (Å)</th>
                      <th className="px-5 py-3 font-bold border-b border-slate-800 text-right text-blue-400">Neutron %</th>
                      {comparisonMode && (
                        <th className="px-5 py-3 font-bold border-b border-slate-800 text-right text-purple-400">X-ray %</th>
                      )}
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                   {chartData.map((r, i) => (
                      <tr key={`${r.twoTheta}-${i}`} className="bg-slate-900 hover:bg-slate-800/80 transition-colors group">
                         <td className="px-5 py-2.5 font-mono font-bold text-slate-200 group-hover:text-white transition-colors">{r.hkl.join(' ')}</td>
                         <td className="px-5 py-2.5 text-slate-400 font-medium">{r.twoTheta.toFixed(2)}</td>
                         <td className="px-5 py-2.5 text-slate-500 font-medium font-mono">{r.dSpacing.toFixed(3)}</td>
                         <td className="px-5 py-2.5 font-bold text-right text-blue-400 bg-blue-500/5">{r.intensity.toFixed(1)}</td>
                         {comparisonMode && (
                           <td className="px-5 py-2.5 font-bold text-right text-purple-400 bg-purple-500/5">{r.xrayIntensity.toFixed(1)}</td>
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
