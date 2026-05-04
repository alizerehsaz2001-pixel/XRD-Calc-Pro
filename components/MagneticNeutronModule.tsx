import React, { useState, useEffect } from 'react';
import { MagneticAtom, MagneticResult } from '../types';
import { calculateMagneticDiffraction, NEUTRON_SCATTERING_LENGTHS, MAGNETIC_FORM_FACTORS } from '../utils/physics';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import { Upload, Atom, Zap, Info, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MagneticNeutronModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(2.4); 
  const [latticeA, setLatticeA] = useState<number>(4.0);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  
  const [atoms, setAtoms] = useState<MagneticAtom[]>([
    { id: '1', element: 'Mn', label: 'Mn (Up)', b: -3.73, x: 0, y: 0, z: 0, B_iso: 0.5, mx: 0, my: 0, mz: 4, ion: 'Mn2+' },
    { id: '2', element: 'Mn', label: 'Mn (Down)', b: -3.73, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5, mx: 0, my: 0, mz: -4, ion: 'Mn2+' },
  ]);

  const [results, setResults] = useState<MagneticResult[]>([]);

  const handleCalculate = () => {
    const computed = calculateMagneticDiffraction(wavelength, { a: latticeA }, atoms);
    setResults(computed);
  };

  useEffect(() => {
    handleCalculate();
  }, [atoms, wavelength, latticeA]);

  const updateAtom = (id: string, field: keyof MagneticAtom, value: any) => {
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

  const handleImport = () => {
    try {
      const data = JSON.parse(importJson);
      if (data.lattice && data.lattice.a) {
        setLatticeA(data.lattice.a);
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
          B_iso: a.B_iso || 0.5,
          mx: a.mx || 0,
          my: a.my || 0,
          mz: a.mz || 0,
          ion: a.ion || ''
        }));
        setAtoms(newAtoms);
      }
      setShowImport(false);
      setImportJson("");
    } catch (e) {
      alert("Invalid JSON format");
    }
  };

  const loadPreset = (type: 'Ferro' | 'AntiFerro') => {
    if (type === 'Ferro') {
      setLatticeA(2.87); 
      setAtoms([
        { id: '1', element: 'Fe', label: 'Fe', b: 9.45, x: 0, y: 0, z: 0, B_iso: 0.4, mx: 0, my: 0, mz: 2.2, ion: 'Fe3+' },
      ]);
    } else if (type === 'AntiFerro') {
      setLatticeA(4.0);
      setAtoms([
        { id: '1', element: 'Mn', label: 'Mn (Up)', b: -3.73, x: 0, y: 0, z: 0, B_iso: 0.5, mx: 0, my: 0, mz: 5, ion: 'Mn2+' },
        { id: '2', element: 'Mn', label: 'Mn (Down)', b: -3.73, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5, mx: 0, my: 0, mz: -5, ion: 'Mn2+' },
      ]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-2xl border border-indigo-500/30">
                <Atom className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Magnetic Cell</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Spin Structure Modeler</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowImport(true)}
                className="p-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/50 transition-colors"
                title="Import Structure"
              >
                <Upload className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-8 relative z-10 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => loadPreset('Ferro')} className="px-4 py-2 bg-slate-950/40 border border-slate-800 rounded-xl transition-all hover:bg-slate-800 hover:border-slate-700 group">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Ferromagnetic</span>
            </button>
            <button onClick={() => loadPreset('AntiFerro')} className="px-4 py-2 bg-slate-950/40 border border-slate-800 rounded-xl transition-all hover:bg-slate-800 hover:border-slate-700 group">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Anti-Ferro</span>
            </button>
          </div>

          <AnimatePresence>
            {showImport && (
              <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-800 relative"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Import Magnetic Structure</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Paste Structure JSON with Moments</p>
                  <textarea
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    placeholder='{"lattice": {"a": 4.0}, "atoms": [{"element": "Mn", "mx": 0, "mz": 4, ...}]}'
                    className="w-full h-48 p-4 bg-black/40 border border-slate-800 rounded-2xl font-mono text-xs mb-8 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-300 resize-none"
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
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-[0_0_30px_rgba(79,70,229,0.2)] transition-all active:scale-95"
                    >
                      Load Data
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Wavelength (Å)</label>
                 <input
                  type="number"
                  step="0.1"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950/50 text-indigo-400 border border-slate-800 rounded-2xl text-sm font-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Lattice a (Å)</label>
                 <input
                  type="number"
                  step="0.01"
                  value={latticeA}
                  onChange={(e) => setLatticeA(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-950/50 text-indigo-400 border border-slate-800 rounded-2xl text-sm font-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                 />
              </div>
            </div>

            <div className="border-t border-slate-800/50 pt-8">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Magnetic Basis</h4>
                 </div>
               </div>
               
               <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                 {atoms.map((atom) => (
                   <div key={atom.id} className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800/80 group/atom hover:border-slate-700 transition-colors">
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-white">{atom.label}</span>
                          <span className="text-[10px] font-bold text-slate-600 bg-black/40 px-2 py-0.5 border border-slate-800 rounded-md">b={atom.b} fm</span>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                       <div className="space-y-1.5">
                         <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">Element</label>
                         <select 
                           value={atom.element}
                           onChange={(e) => updateAtom(atom.id, 'element', e.target.value)}
                           className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                         >
                           {Object.keys(NEUTRON_SCATTERING_LENGTHS).sort().map(el => (
                             <option key={el} value={el}>{el}</option>
                           ))}
                         </select>
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest ml-1">Magnetic Ion</label>
                         <select 
                           value={atom.ion || ''}
                           onChange={(e) => updateAtom(atom.id, 'ion', e.target.value)}
                           className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                         >
                           <option value="">Generic</option>
                           {Object.keys(MAGNETIC_FORM_FACTORS).sort().map(ion => (
                             <option key={ion} value={ion}>{ion}</option>
                           ))}
                         </select>
                       </div>
                     </div>

                     <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-600 px-1 uppercase tracking-widest">x</label><input type="number" step="0.1" value={atom.x} onChange={(e) => updateAtom(atom.id, 'x', parseFloat(e.target.value))} className="w-full bg-black/40 text-white border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-[11px] font-black"/></div>
                          <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-600 px-1 uppercase tracking-widest">y</label><input type="number" step="0.1" value={atom.y} onChange={(e) => updateAtom(atom.id, 'y', parseFloat(e.target.value))} className="w-full bg-black/40 text-white border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-[11px] font-black"/></div>
                          <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-600 px-1 uppercase tracking-widest">z</label><input type="number" step="0.1" value={atom.z} onChange={(e) => updateAtom(atom.id, 'z', parseFloat(e.target.value))} className="w-full bg-black/40 text-white border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-[11px] font-black"/></div>
                     </div>

                     <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Moment Vector (μB)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                           <div className="space-y-1"><span className="text-[8px] text-indigo-500/60 font-black px-1 uppercase tracking-widest">Mx</span><input type="number" step="0.1" value={atom.mx} onChange={(e) => updateAtom(atom.id, 'mx', parseFloat(e.target.value))} className="w-full bg-slate-950 text-indigo-400 border border-indigo-500/20 rounded-lg px-2 py-1 font-mono text-[11px] font-black focus:ring-1 focus:ring-indigo-500/30 outline-none"/></div>
                           <div className="space-y-1"><span className="text-[8px] text-indigo-500/60 font-black px-1 uppercase tracking-widest">My</span><input type="number" step="0.1" value={atom.my} onChange={(e) => updateAtom(atom.id, 'my', parseFloat(e.target.value))} className="w-full bg-slate-950 text-indigo-400 border border-indigo-500/20 rounded-lg px-2 py-1 font-mono text-[11px] font-black focus:ring-1 focus:ring-indigo-500/30 outline-none"/></div>
                           <div className="space-y-1"><span className="text-[8px] text-indigo-500/60 font-black px-1 uppercase tracking-widest">Mz</span><input type="number" step="0.1" value={atom.mz} onChange={(e) => updateAtom(atom.id, 'mz', parseFloat(e.target.value))} className="w-full bg-slate-950 text-indigo-400 border border-indigo-500/20 rounded-lg px-2 py-1 font-mono text-[11px] font-black focus:ring-1 focus:ring-indigo-500/30 outline-none"/></div>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-500/5 p-6 rounded-3xl border border-indigo-500/10 flex items-start gap-5">
           <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shrink-0">
             <Zap className="w-5 h-5 text-indigo-400" />
           </div>
           <div>
             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Magnetic Interaction Case</h4>
             <p className="text-xs text-slate-400 leading-relaxed font-medium">
               Magnetic scattering only occurs if the component of the magnetic moment is <span className="text-indigo-400 font-bold">perpendicular</span> to the scattering vector Q. This allows neutrons to "see" spin orientations.
             </p>
           </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 h-[400px] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              Mixed Diffraction Spectrum
            </h3>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-slate-500" />
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nuclear</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Magnetic</span>
               </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={results} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="twoTheta" 
                  label={{ value: '2θ (deg)', position: 'bottom', fill: '#64748b', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}
                  type="number"
                  domain={[0, 'auto']}
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis hide/>
                <Tooltip 
                  cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as MagneticResult;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-2">Reflection profile: ({d.hkl.join(' ')})</p>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center gap-8">
                                <span className="text-[11px] font-bold text-slate-400">Nuclear</span>
                                <span className="text-xs font-mono font-black text-slate-200">{d.nuclearIntensity.toFixed(1)}</span>
                             </div>
                             <div className="flex justify-between items-center gap-8">
                                <span className="text-[11px] font-bold text-indigo-400">Magnetic</span>
                                <span className="text-xs font-mono font-black text-indigo-400">{d.magneticIntensity.toFixed(1)}</span>
                             </div>
                             <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-8">
                                <span className="text-[11px] font-black text-white">Total Int.</span>
                                <span className="text-sm font-mono font-black text-white">{d.totalIntensity.toFixed(1)}</span>
                             </div>
                             <p className="text-[9px] font-mono font-bold text-slate-600 pt-1">At 2θ = {d.twoTheta.toFixed(2)}°</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="nuclearIntensity" stackId="a" fill="#475569" name="Nuclear" barSize={8} radius={[2, 2, 0, 0]} />
                <Bar dataKey="magneticIntensity" stackId="a" fill="#6366f1" name="Magnetic" barSize={8} radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden flex flex-col max-h-[450px]">
          <div className="p-6 border-b border-slate-800 bg-slate-950/20 flex justify-between items-center">
             <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Reflections Manifest
             </h3>
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Calculated Intensity Spectrum</span>
          </div>
          <div className="overflow-auto flex-1 custom-scrollbar">
             <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-[9px] text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky top-0 backdrop-blur-sm z-10 border-b border-slate-800">
                   <tr>
                      <th className="px-6 py-4 font-black">HKL Plane</th>
                      <th className="px-6 py-4 font-black text-right">Position (2θ)</th>
                      <th className="px-6 py-4 font-black text-right">d-Spacing</th>
                      <th className="px-6 py-4 font-black text-right text-slate-500">Nuc</th>
                      <th className="px-6 py-4 font-black text-right text-indigo-400">Mag</th>
                      <th className="px-6 py-4 font-black text-right text-white">Total</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                   {results.map((r, i) => (
                      <tr key={`${r.twoTheta}-${i}`} className="bg-transparent hover:bg-slate-800/40 transition-colors group">
                         <td className="px-6 py-3.5 font-mono font-black text-slate-200 group-hover:text-white transition-colors">
                           <span className="opacity-40">[</span>{r.hkl.join(' ')}<span className="opacity-40">]</span>
                         </td>
                         <td className="px-6 py-3.5 text-right text-slate-400 font-bold font-mono">{r.twoTheta.toFixed(2)}°</td>
                         <td className="px-6 py-3.5 text-right text-slate-500 font-bold font-mono">{r.dSpacing.toFixed(3)}</td>
                         <td className="px-6 py-3.5 text-right text-slate-500 font-bold font-mono">{r.nuclearIntensity.toFixed(1)}</td>
                         <td className="px-6 py-3.5 text-right font-mono text-indigo-400 font-black bg-indigo-500/5">{r.magneticIntensity.toFixed(1)}</td>
                         <td className="px-6 py-3.5 text-right font-black text-white">{r.totalIntensity.toFixed(1)}</td>
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