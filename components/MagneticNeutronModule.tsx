import React, { useState, useEffect } from 'react';
import { MagneticAtom, MagneticResult } from '../types';
import { calculateMagneticDiffraction, NEUTRON_SCATTERING_LENGTHS } from '../utils/physics';
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

export const MagneticNeutronModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(2.4); // Typical cold neutron wavelength
  const [latticeA, setLatticeA] = useState<number>(4.0);
  
  // Default: AF MnO-like structure
  const [atoms, setAtoms] = useState<MagneticAtom[]>([
    { id: '1', element: 'Mn', label: 'Mn (Up)', b: -3.73, x: 0, y: 0, z: 0, B_iso: 0.5, mx: 0, my: 0, mz: 4 },
    { id: '2', element: 'Mn', label: 'Mn (Down)', b: -3.73, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5, mx: 0, my: 0, mz: -4 },
  ]);

  const [results, setResults] = useState<MagneticResult[]>([]);

  const handleCalculate = () => {
    const computed = calculateMagneticDiffraction(wavelength, { a: latticeA }, atoms);
    setResults(computed);
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadPreset = (type: 'Ferro' | 'AntiFerro') => {
    if (type === 'Ferro') {
      setLatticeA(3.0);
      setAtoms([
        { id: '1', element: 'Fe', label: 'Fe', b: 9.45, x: 0, y: 0, z: 0, B_iso: 0.4, mx: 0, my: 0, mz: 2.2 },
      ]);
    } else if (type === 'AntiFerro') {
      setLatticeA(4.0);
      setAtoms([
        { id: '1', element: 'Mn', label: 'Mn (Up)', b: -3.73, x: 0, y: 0, z: 0, B_iso: 0.5, mx: 0, my: 0, mz: 5 },
        { id: '2', element: 'Mn', label: 'Mn (Down)', b: -3.73, x: 0.5, y: 0.5, z: 0.5, B_iso: 0.5, mx: 0, my: 0, mz: -5 },
      ]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Input Configuration */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Magnetic Cell
            </h2>
            <div className="flex gap-2">
              <button onClick={() => loadPreset('Ferro')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">Ferro</button>
              <button onClick={() => loadPreset('AntiFerro')} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">Anti-Ferro</button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Wavelength (Å)</label>
                 <input
                  type="number"
                  step="0.1"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 text-white border border-slate-700 rounded text-sm font-bold font-mono"
                 />
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
               <label className="block text-sm font-medium text-slate-700 mb-2">Magnetic Atoms</label>
               <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                 {atoms.map((atom) => (
                   <div key={atom.id} className="bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                     <div className="flex justify-between items-center mb-2 font-semibold text-slate-700">
                        <span>{atom.label}</span>
                        <span className="text-slate-400 font-normal">b={atom.b} fm</span>
                     </div>
                     <div className="grid grid-cols-3 gap-2 mb-2">
                       <div className="col-span-1"><span className="text-[10px] text-slate-400 block">Element</span>
                       <select 
                         value={atom.element}
                         onChange={(e) => updateAtom(atom.id, 'element', e.target.value)}
                         className="w-full px-1 py-1 bg-slate-900 text-white border border-slate-700 rounded text-sm font-bold"
                       >
                         {Object.keys(NEUTRON_SCATTERING_LENGTHS).map(el => (
                           <option key={el} value={el}>{el}</option>
                         ))}
                       </select>
                       </div>
                       <div className="col-span-2 grid grid-cols-3 gap-1">
                         <div><span className="text-[10px] text-slate-400 block">x</span><input type="number" step="0.1" value={atom.x} onChange={(e) => updateAtom(atom.id, 'x', parseFloat(e.target.value))} className="w-full bg-slate-900 text-white border border-slate-700 rounded px-1 font-mono font-bold"/></div>
                         <div><span className="text-[10px] text-slate-400 block">y</span><input type="number" step="0.1" value={atom.y} onChange={(e) => updateAtom(atom.id, 'y', parseFloat(e.target.value))} className="w-full bg-slate-900 text-white border border-slate-700 rounded px-1 font-mono font-bold"/></div>
                         <div><span className="text-[10px] text-slate-400 block">z</span><input type="number" step="0.1" value={atom.z} onChange={(e) => updateAtom(atom.id, 'z', parseFloat(e.target.value))} className="w-full bg-slate-900 text-white border border-slate-700 rounded px-1 font-mono font-bold"/></div>
                       </div>
                     </div>
                     <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                        <span className="text-[10px] text-indigo-800 font-bold block mb-1">Moment Vector (μB)</span>
                        <div className="grid grid-cols-3 gap-2">
                           <div><span className="text-[10px] text-indigo-400 block">Mx</span><input type="number" step="0.1" value={atom.mx} onChange={(e) => updateAtom(atom.id, 'mx', parseFloat(e.target.value))} className="w-full bg-slate-900 text-white border border-indigo-400 rounded px-1 font-mono font-bold"/></div>
                           <div><span className="text-[10px] text-indigo-400 block">My</span><input type="number" step="0.1" value={atom.my} onChange={(e) => updateAtom(atom.id, 'my', parseFloat(e.target.value))} className="w-full bg-slate-900 text-white border border-indigo-400 rounded px-1 font-mono font-bold"/></div>
                           <div><span className="text-[10px] text-indigo-400 block">Mz</span><input type="number" step="0.1" value={atom.mz} onChange={(e) => updateAtom(atom.id, 'mz', parseFloat(e.target.value))} className="w-full bg-slate-900 text-white border border-indigo-400 rounded px-1 font-mono font-bold"/></div>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-800">
           <strong>Magnetic Scattering:</strong> Only the component of M perpendicular to the scattering vector Q contributes.
        </div>
      </div>

      {/* Output Section */}
      <div className="lg:col-span-7 space-y-6">
        {/* Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-80 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 ml-2">Diffraction Pattern (Nuclear + Magnetic)</h3>
          <div className="flex-1 w-full min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={results} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="twoTheta" 
                  label={{ value: '2θ (degrees)', position: 'bottom', offset: 0 }}
                  type="number"
                  domain={[0, 'auto']}
                />
                <YAxis hide/>
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as MagneticResult;
                      return (
                        <div className="bg-slate-800 text-white p-2 rounded text-xs">
                          <p><strong>({d.hkl.join(' ')})</strong> at {d.twoTheta.toFixed(2)}°</p>
                          <p className="text-slate-300">Nuclear: {d.nuclearIntensity.toFixed(1)}</p>
                          <p className="text-indigo-300">Magnetic: {d.magneticIntensity.toFixed(1)}</p>
                          <p className="font-bold border-t border-slate-600 mt-1 pt-1">Total: {d.totalIntensity.toFixed(1)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="nuclearIntensity" stackId="a" fill="#94a3b8" name="Nuclear" barSize={4} />
                <Bar dataKey="magneticIntensity" stackId="a" fill="#4f46e5" name="Magnetic" barSize={4} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col max-h-[400px]">
          <div className="p-3 border-b border-slate-300 bg-slate-100 flex justify-between">
             <h3 className="font-bold text-slate-800 text-sm">Reflections</h3>
             <span className="text-xs text-slate-500 self-center">Normalized Intensities</span>
          </div>
          <div className="overflow-auto flex-1 custom-scrollbar">
             <table className="w-full text-sm text-left text-slate-800">
                <thead className="text-xs text-slate-900 uppercase bg-slate-200 sticky top-0">
                   <tr>
                      <th className="px-4 py-2 font-bold border-b border-slate-300">HKL</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300">2θ</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300">d (Å)</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300 text-right text-slate-500">Nuc</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300 text-right text-indigo-700">Mag</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300 text-right text-slate-900">Total</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                   {results.map((r, i) => (
                      <tr key={i} className="bg-white hover:bg-slate-50 transition-colors">
                         <td className="px-4 py-2 font-mono font-bold text-slate-900">
                           {r.hkl.join(' ')}
                         </td>
                         <td className="px-4 py-2 text-slate-900 font-medium">{r.twoTheta.toFixed(2)}</td>
                         <td className="px-4 py-2 text-slate-700 font-medium">{r.dSpacing.toFixed(3)}</td>
                         <td className="px-4 py-2 text-right text-slate-500 font-medium">{r.nuclearIntensity.toFixed(1)}</td>
                         <td className="px-4 py-2 text-right font-mono text-indigo-700 font-bold">{r.magneticIntensity.toFixed(1)}</td>
                         <td className="px-4 py-2 text-right font-bold text-slate-900">{r.totalIntensity.toFixed(1)}</td>
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