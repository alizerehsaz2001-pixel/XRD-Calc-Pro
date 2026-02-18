
import React, { useState, useEffect } from 'react';
import { NeutronAtom, NeutronResult, StandardWavelength } from '../types';
import { calculateNeutronDiffraction, NEUTRON_SCATTERING_LENGTHS } from '../utils/physics';
import { fetchStandardWavelengths } from '../services/geminiService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const NeutronModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.54); 
  const [availableWavelengths, setAvailableWavelengths] = useState<StandardWavelength[]>([
    { label: 'Thermal', value: 1.54, type: 'Neutron' },
    { label: 'Cold (Be Filter)', value: 3.96, type: 'Neutron' },
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [latticeA, setLatticeA] = useState<number>(4.20); 
  
  const [atoms, setAtoms] = useState<NeutronAtom[]>([
    { id: '1', element: 'O', label: 'Oxygen', b: 5.80, x: 0, y: 0, z: 0, B_iso: 0.5 },
    { id: '2', element: 'Mg', label: 'Magnesium', b: 5.38, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.4 },
  ]);

  const [results, setResults] = useState<NeutronResult[]>([]);

  const handleCalculate = () => {
    const computed = calculateNeutronDiffraction(wavelength, { a: latticeA }, atoms);
    setResults(computed);
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

  useEffect(() => {
    handleCalculate();
  }, [atoms, wavelength, latticeA]);

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

  const loadPreset = (type: 'MgO' | 'D2O' | 'TiO2') => {
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
    } else if (type === 'TiO2') {
       setLatticeA(3.905); 
       setAtoms([
         { id: '1', element: 'Ti', label: 'Ti (Neg b!)', b: -3.44, x: 0, y: 0, z: 0, B_iso: 0.4 },
         { id: '2', element: 'O', label: 'O', b: 5.80, x: 0.5, y: 0, z: 0, B_iso: 0.6 },
         { id: '3', element: 'O', label: 'O', b: 5.80, x: 0, y: 0.5, z: 0, B_iso: 0.6 },
         { id: '4', element: 'O', label: 'O', b: 5.80, x: 0, y: 0, z: 0.5, B_iso: 0.6 },
       ]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Neutron Cell
            </h2>
            <div className="flex gap-2">
              <button onClick={() => loadPreset('MgO')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">MgO</button>
              <button onClick={() => loadPreset('D2O')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">D₂O Ice</button>
              <button onClick={() => loadPreset('TiO2')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">SrTiO₃</button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                 <div className="flex justify-between items-center mb-1">
                   <label className="block text-xs font-medium text-slate-500">Wavelength (Å)</label>
                   <button onClick={handleSync} disabled={isSyncing} className="text-[9px] font-bold text-blue-600 hover:underline disabled:opacity-50">Sync</button>
                 </div>
                 <input
                  type="number"
                  step="0.01"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 text-white border border-slate-700 rounded text-sm font-bold font-mono"
                 />
                 <div className="flex flex-wrap gap-1 mt-2">
                   {availableWavelengths.map(aw => (
                     <button 
                        key={aw.label} 
                        onClick={() => setWavelength(aw.value)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${wavelength === aw.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                        title={aw.label}
                     >
                       {aw.label.split(' ')[0]}
                     </button>
                   ))}
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Lattice a (Å)</label>
                 <input
                  type="number"
                  step="0.01"
                  value={latticeA}
                  onChange={(e) => setLatticeA(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 text-white border border-slate-700 rounded text-sm font-bold font-mono"
                 />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">Atoms</label>
                <button onClick={addAtom} className="text-xs text-blue-600 font-medium hover:text-blue-700">+ Add Atom</button>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {atoms.map((atom) => (
                  <div key={atom.id} className="bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                    <div className="flex justify-between items-center mb-2">
                       <select 
                         value={atom.element}
                         onChange={(e) => updateAtom(atom.id, 'element', e.target.value)}
                         className="font-bold bg-slate-900 text-white border-none px-1 rounded cursor-pointer"
                       >
                         {Object.keys(NEUTRON_SCATTERING_LENGTHS).map(el => (
                           <option key={el} value={el}>{el}</option>
                         ))}
                       </select>
                       <div className="flex items-center gap-2">
                         <span className="text-slate-500 font-mono">b={atom.b}</span>
                         <button onClick={() => removeAtom(atom.id)} className="text-red-400 hover:text-red-600">×</button>
                       </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <input type="number" placeholder="x" step="0.1" value={atom.x} onChange={(e) => updateAtom(atom.id, 'x', parseFloat(e.target.value))} className="w-full px-1 py-1 bg-slate-900 text-white border border-slate-700 rounded font-mono font-bold"/>
                      <input type="number" placeholder="y" step="0.1" value={atom.y} onChange={(e) => updateAtom(atom.id, 'y', parseFloat(e.target.value))} className="w-full px-1 py-1 bg-slate-900 text-white border border-slate-700 rounded font-mono font-bold"/>
                      <input type="number" placeholder="z" step="0.1" value={atom.z} onChange={(e) => updateAtom(atom.id, 'z', parseFloat(e.target.value))} className="w-full px-1 py-1 bg-slate-900 text-white border border-slate-700 rounded font-mono font-bold"/>
                      <input type="number" placeholder="B" step="0.1" value={atom.B_iso} onChange={(e) => updateAtom(atom.id, 'B_iso', parseFloat(e.target.value))} className="w-full px-1 py-1 bg-slate-900 text-white border border-slate-700 rounded font-mono font-bold"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
           <strong>Contrast Tip:</strong> Neutrons see nuclei. H has negative b (-3.74), D has positive b (6.67). Ti has negative b (-3.44). X-rays only see electron density (Ti is heavy, O is light).
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-64 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 ml-2">Neutron Diffraction Pattern</h3>
          <div className="flex-1 w-full min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="twoTheta" label={{ value: '2θ (degrees)', position: 'bottom', offset: 0 }} type="number" domain={[0, 'auto']}/>
                <Tooltip cursor={{fill: 'transparent'}} content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as NeutronResult;
                      return (
                        <div className="bg-slate-800 text-white p-2 rounded text-xs">
                          <p><strong>({d.hkl.join(' ')})</strong> at {d.twoTheta.toFixed(2)}°</p>
                          <p>Intensity: {d.intensity.toFixed(1)}%</p>
                          <p>F²: {d.F_squared.toFixed(2)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="intensity" barSize={3} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col max-h-[400px]">
          <div className="p-3 border-b border-slate-300 bg-slate-100">
             <h3 className="font-bold text-slate-800 text-sm">Reflections</h3>
          </div>
          <div className="overflow-auto flex-1 custom-scrollbar">
             <table className="w-full text-sm text-left text-slate-800">
                <thead className="text-xs text-slate-900 uppercase bg-slate-200 sticky top-0">
                   <tr>
                      <th className="px-4 py-2 font-bold border-b border-slate-300">HKL</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300">2θ (°)</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300">d (Å)</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300">|F_n|²</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300 text-right">Int (%)</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                   {results.map((r, i) => (
                      <tr key={i} className="bg-white hover:bg-slate-50 transition-colors">
                         <td className="px-4 py-2 font-mono font-bold text-slate-900">{r.hkl.join(' ')}</td>
                         <td className="px-4 py-2 text-slate-800 font-medium">{r.twoTheta.toFixed(2)}</td>
                         <td className="px-4 py-2 text-slate-600 font-medium">{r.dSpacing.toFixed(3)}</td>
                         <td className="px-4 py-2 font-mono text-blue-700 font-bold">{r.F_squared.toFixed(2)}</td>
                         <td className="px-4 py-2 font-bold text-right text-slate-900">{r.intensity.toFixed(1)}</td>
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
