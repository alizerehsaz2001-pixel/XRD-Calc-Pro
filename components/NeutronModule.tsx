
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
import { Layers, Zap, Atom } from 'lucide-react';

export const NeutronModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.54); 
  const [availableWavelengths, setAvailableWavelengths] = useState<StandardWavelength[]>([
    { label: 'Thermal', value: 1.54, type: 'Neutron' },
    { label: 'Cold (Be Filter)', value: 3.96, type: 'Neutron' },
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [latticeA, setLatticeA] = useState<number>(4.20); 
  const [comparisonMode, setComparisonMode] = useState(false);
  
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Atom className="h-5 w-5 text-blue-500" />
              Neutron Cell
            </h2>
            <div className="flex gap-2">
              <button onClick={() => loadPreset('MgO')} className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors">MgO</button>
              <button onClick={() => loadPreset('D2O')} className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors">D₂O</button>
              <button onClick={() => loadPreset('SrTiO3')} className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors">SrTiO₃</button>
              <button onClick={() => loadPreset('MnO')} className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors">MnO</button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                 <div className="flex justify-between items-center mb-1">
                   <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Wavelength (Å)</label>
                   <button onClick={handleSync} disabled={isSyncing} className="text-[9px] font-bold text-blue-600 hover:underline disabled:opacity-50">Sync</button>
                 </div>
                 <input
                  type="number"
                  step="0.01"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-bold font-mono"
                 />
                 <div className="flex flex-wrap gap-1 mt-2">
                   {availableWavelengths.map(aw => (
                     <button 
                        key={aw.label} 
                        onClick={() => setWavelength(aw.value)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${wavelength === aw.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        title={aw.label}
                     >
                       {aw.label.split(' ')[0]}
                     </button>
                   ))}
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Lattice a (Å)</label>
                 <input
                  type="number"
                  step="0.01"
                  value={latticeA}
                  onChange={(e) => setLatticeA(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-bold font-mono"
                 />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Atoms</label>
                <button onClick={addAtom} className="text-xs text-blue-600 font-medium hover:text-blue-700">+ Add Atom</button>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {atoms.map((atom) => (
                  <div key={atom.id} className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-2">
                       <select 
                         value={atom.element}
                         onChange={(e) => updateAtom(atom.id, 'element', e.target.value)}
                         className="font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-1 rounded cursor-pointer"
                       >
                         {Object.keys(NEUTRON_SCATTERING_LENGTHS).map(el => (
                           <option key={el} value={el}>{el}</option>
                         ))}
                       </select>
                       <div className="flex items-center gap-2">
                         <span className="text-slate-500 font-mono text-[10px]">
                           b={atom.b} | Z={ATOMIC_NUMBERS[atom.element] || '?'}
                         </span>
                         <button onClick={() => removeAtom(atom.id)} className="text-red-400 hover:text-red-600">×</button>
                       </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <input type="number" placeholder="x" step="0.1" value={atom.x} onChange={(e) => updateAtom(atom.id, 'x', parseFloat(e.target.value))} className="w-full px-1 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded font-mono font-bold"/>
                      <input type="number" placeholder="y" step="0.1" value={atom.y} onChange={(e) => updateAtom(atom.id, 'y', parseFloat(e.target.value))} className="w-full px-1 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded font-mono font-bold"/>
                      <input type="number" placeholder="z" step="0.1" value={atom.z} onChange={(e) => updateAtom(atom.id, 'z', parseFloat(e.target.value))} className="w-full px-1 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded font-mono font-bold"/>
                      <input type="number" placeholder="B" step="0.1" value={atom.B_iso} onChange={(e) => updateAtom(atom.id, 'B_iso', parseFloat(e.target.value))} className="w-full px-1 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded font-mono font-bold"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
           <strong>Neutron vs X-ray:</strong> Neutrons scatter from nuclei (b varies randomly, can be negative). X-rays scatter from electron clouds (intensity ~ Z²). Note how Mn (Z=25) has a negative neutron scattering length!
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 ml-2">Diffraction Pattern</h3>
            <button
              onClick={() => setComparisonMode(!comparisonMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                comparisonMode 
                  ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              <Layers className="w-3 h-3" />
              {comparisonMode ? 'X-ray Comparison ON' : 'Compare with X-ray'}
            </button>
          </div>
          <div className="flex-1 w-full min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #e2e8f0)" opacity={0.3} />
                <XAxis 
                  dataKey="twoTheta" 
                  label={{ value: '2θ (degrees)', position: 'bottom', offset: 0, fill: 'var(--color-text-secondary, #94a3b8)' }} 
                  type="number" 
                  domain={[0, 'auto']}
                  tick={{ fill: 'var(--color-text-secondary, #94a3b8)' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ backgroundColor: 'var(--color-bg-card, #fff)', borderColor: 'var(--color-border, #e2e8f0)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-text-primary, #0f172a)' }}
                  labelStyle={{ color: 'var(--color-text-secondary, #64748b)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-800 text-white p-2 rounded text-xs shadow-xl border border-slate-700">
                          <p className="font-bold border-b border-slate-700 pb-1 mb-1">({d.hkl.join(' ')}) at {d.twoTheta.toFixed(2)}°</p>
                          <div className="space-y-1">
                            <p className="text-blue-400">Neutron Int: {d.intensity.toFixed(1)}%</p>
                            {comparisonMode && (
                              <p className="text-purple-400">X-ray Int: {d.xrayIntensity.toFixed(1)}%</p>
                            )}
                            <p className="text-slate-400 text-[10px] mt-1">d = {d.dSpacing.toFixed(3)} Å</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar name="Neutron" dataKey="intensity" barSize={4} fill="#3b82f6" radius={[2, 2, 0, 0]} />
                {comparisonMode && (
                  <Bar name="X-ray" dataKey="xrayIntensity" barSize={4} fill="#a855f7" radius={[2, 2, 0, 0]} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-300 dark:border-slate-800 overflow-hidden flex flex-col max-h-[400px]">
          <div className="p-3 border-b border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
             <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Reflections Table</h3>
          </div>
          <div className="overflow-auto flex-1 custom-scrollbar">
             <table className="w-full text-sm text-left text-slate-800 dark:text-slate-200">
                <thead className="text-xs text-slate-900 dark:text-slate-100 uppercase bg-slate-200 dark:bg-slate-800 sticky top-0">
                   <tr>
                      <th className="px-4 py-2 font-bold border-b border-slate-300 dark:border-slate-700">HKL</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300 dark:border-slate-700">2θ (°)</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300 dark:border-slate-700">d (Å)</th>
                      <th className="px-4 py-2 font-bold border-b border-slate-300 dark:border-slate-700 text-right text-blue-600 dark:text-blue-400">Neutron %</th>
                      {comparisonMode && (
                        <th className="px-4 py-2 font-bold border-b border-slate-300 dark:border-slate-700 text-right text-purple-600 dark:text-purple-400">X-ray %</th>
                      )}
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                   {chartData.map((r, i) => (
                      <tr key={i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                         <td className="px-4 py-2 font-mono font-bold text-slate-900 dark:text-slate-100">{r.hkl.join(' ')}</td>
                         <td className="px-4 py-2 text-slate-800 dark:text-slate-300 font-medium">{r.twoTheta.toFixed(2)}</td>
                         <td className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium">{r.dSpacing.toFixed(3)}</td>
                         <td className="px-4 py-2 font-bold text-right text-blue-700 dark:text-blue-400">{r.intensity.toFixed(1)}</td>
                         {comparisonMode && (
                           <td className="px-4 py-2 font-bold text-right text-purple-700 dark:text-purple-400">{r.xrayIntensity.toFixed(1)}</td>
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
