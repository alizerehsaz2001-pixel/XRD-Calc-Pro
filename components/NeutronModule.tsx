
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
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <Atom className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Neutron Cell</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowImport(true)}
                className="text-[10px] uppercase tracking-widest font-bold bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3 h-3" /> Import JSON
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-6 relative z-10 overflow-x-auto pb-2 custom-scrollbar">
            <button onClick={() => loadPreset('MgO')} className="text-[10px] uppercase tracking-widest font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">MgO</button>
            <button onClick={() => loadPreset('D2O')} className="text-[10px] uppercase tracking-widest font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">D₂O</button>
            <button onClick={() => loadPreset('SrTiO3')} className="text-[10px] uppercase tracking-widest font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">SrTiO₃</button>
            <button onClick={() => loadPreset('MnO')} className="text-[10px] uppercase tracking-widest font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">MnO</button>
          </div>

          {showImport && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-2">Import Crystal Structure</h3>
                <p className="text-xs text-slate-400 mb-4">Paste JSON data from CrystalMind or other sources.</p>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='{"lattice": {"a": 4.2}, "atoms": [...]}'
                  className="w-full h-48 p-4 bg-black/40 border border-slate-700 rounded-xl font-mono text-xs mb-6 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-300"
                />
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowImport(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleImport}
                    className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    Import Data
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                 <div className="flex justify-between items-center mb-2">
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wavelength (Å)</label>
                   <button onClick={handleSync} disabled={isSyncing} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 disabled:opacity-50 uppercase tracking-widest transition-colors">Sync</button>
                 </div>
                 <input
                  type="number"
                  step="0.01"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-3 py-2.5 bg-black/40 text-blue-400 border border-slate-700 rounded-lg text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                 />
                 <div className="flex flex-wrap gap-1.5 mt-3">
                   {availableWavelengths.map(aw => (
                     <button 
                        key={aw.label} 
                        onClick={() => setWavelength(aw.value)}
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border transition-all ${wavelength === aw.value ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-black/40 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-300'}`}
                        title={aw.label}
                     >
                       {aw.label.split(' ')[0]}
                     </button>
                   ))}
                 </div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lattice a (Å)</label>
                 <input
                  type="number"
                  step="0.01"
                  value={latticeA}
                  onChange={(e) => setLatticeA(parseFloat(e.target.value))}
                  className="w-full px-3 py-2.5 bg-black/40 text-blue-400 border border-slate-700 rounded-lg text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                 />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-slate-700"></span> Atoms
                </label>
                <button onClick={addAtom} className="text-[10px] uppercase tracking-widest text-blue-400 font-bold hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20 transition-all">+ Add Atom</button>
              </div>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {atoms.map((atom) => (
                  <div key={atom.id} className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50 relative group">
                    <div className="flex justify-between items-center mb-3">
                       <select 
                         value={atom.element}
                         onChange={(e) => updateAtom(atom.id, 'element', e.target.value)}
                         className="font-bold bg-black/40 text-white border border-slate-700 px-2 py-1 rounded-lg cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                       >
                         {Object.keys(NEUTRON_SCATTERING_LENGTHS).map(el => (
                           <option key={el} value={el}>{el}</option>
                         ))}
                       </select>
                       <div className="flex items-center gap-3">
                         <span className="text-slate-400 font-mono text-[10px] bg-black/40 px-2 py-1 rounded-md border border-slate-700">
                           b={<span className={atom.b < 0 ? 'text-rose-400' : 'text-emerald-400'}>{atom.b}</span>} | Z={ATOMIC_NUMBERS[atom.element] || '?'}
                         </span>
                         <button onClick={() => removeAtom(atom.id)} className="text-slate-500 hover:text-rose-400 bg-black/40 p-1.5 rounded-lg border border-slate-700 hover:border-rose-500/50 transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                           </svg>
                         </button>
                       </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">x</span>
                        <input type="number" step="0.1" value={atom.x} onChange={(e) => updateAtom(atom.id, 'x', parseFloat(e.target.value))} className="w-full pl-6 pr-2 py-1.5 bg-black/40 text-white border border-slate-700 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">y</span>
                        <input type="number" step="0.1" value={atom.y} onChange={(e) => updateAtom(atom.id, 'y', parseFloat(e.target.value))} className="w-full pl-6 pr-2 py-1.5 bg-black/40 text-white border border-slate-700 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">z</span>
                        <input type="number" step="0.1" value={atom.z} onChange={(e) => updateAtom(atom.id, 'z', parseFloat(e.target.value))} className="w-full pl-6 pr-2 py-1.5 bg-black/40 text-white border border-slate-700 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">B</span>
                        <input type="number" step="0.1" value={atom.B_iso} onChange={(e) => updateAtom(atom.id, 'B_iso', parseFloat(e.target.value))} className="w-full pl-6 pr-2 py-1.5 bg-black/40 text-white border border-slate-700 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20 flex items-start gap-4">
           <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 shrink-0">
             <Info className="w-5 h-5 text-blue-400" />
           </div>
           <p className="text-sm text-blue-200 leading-relaxed">
             <strong className="text-blue-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">Neutron vs X-ray Scattering</strong> 
             Neutrons scatter from nuclei (scattering length <code className="bg-blue-900/50 px-1 rounded text-blue-300">b</code> varies randomly, can be negative). X-rays scatter from electron clouds (intensity ~ Z²). Note how Mn (Z=25) has a negative neutron scattering length!
           </p>
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
                      <tr key={i} className="bg-slate-900 hover:bg-slate-800/80 transition-colors group">
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
