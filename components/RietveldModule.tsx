import React, { useState } from 'react';
import { RietveldPhaseInput, RietveldSetupResult, CrystalSystem } from '../types';
import { generateRietveldSetup } from '../utils/physics';

export const RietveldModule: React.FC = () => {
  const [phases, setPhases] = useState<RietveldPhaseInput[]>([
    { name: 'Phase 1', crystalSystem: 'Cubic', a: 5.43 }
  ]);
  const [maxObsIntensity, setMaxObsIntensity] = useState<number>(5000);
  const [bgModel, setBgModel] = useState<'Chebyshev_6_term' | 'Linear_Interpolation'>('Chebyshev_6_term');
  const [profileShape, setProfileShape] = useState<'Thompson-Cox-Hastings' | 'Pseudo-Voigt'>('Thompson-Cox-Hastings');
  const [result, setResult] = useState<RietveldSetupResult | null>(null);

  const updatePhase = (index: number, field: keyof RietveldPhaseInput, value: any) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setPhases(newPhases);
  };

  const addPhase = () => {
    setPhases([...phases, { name: `Phase ${phases.length + 1}`, crystalSystem: 'Cubic', a: 5.0 }]);
  };

  const removePhase = (index: number) => {
    if (phases.length > 1) {
      setPhases(phases.filter((_, i) => i !== index));
    }
  };

  const handleGenerate = () => {
    const output = generateRietveldSetup({
      phases,
      maxObsIntensity,
      backgroundModel: bgModel,
      profileShape
    });
    setResult(output);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Configuration */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Refinement Setup
          </h2>

          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wide">Global Parameters</h3>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Max Observed Intensity</label>
                <input
                  type="number"
                  value={maxObsIntensity}
                  onChange={(e) => setMaxObsIntensity(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 text-white border border-slate-700 rounded text-sm font-bold font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Background Model</label>
                   <select 
                      value={bgModel}
                      onChange={(e) => setBgModel(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-slate-900 text-white border border-slate-700 rounded text-sm font-medium"
                   >
                     <option value="Chebyshev_6_term">Chebyshev (6-term)</option>
                     <option value="Linear_Interpolation">Linear Interp</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Profile Function</label>
                   <select 
                      value={profileShape}
                      onChange={(e) => setProfileShape(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-slate-900 text-white border border-slate-700 rounded text-sm font-medium"
                   >
                     <option value="Thompson-Cox-Hastings">Thompson-Cox-Hastings</option>
                     <option value="Pseudo-Voigt">Pseudo-Voigt</option>
                   </select>
                </div>
              </div>
            </div>

            {/* Phases */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wide">Phases</h3>
                 <button onClick={addPhase} className="text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
                   + Add Phase
                 </button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {phases.map((phase, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 relative group">
                    {phases.length > 1 && (
                      <button 
                        onClick={() => removePhase(idx)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                    
                    <div className="grid gap-3">
                      <div>
                        <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Phase Name</label>
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-900 text-white border border-slate-700 rounded text-sm font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">System</label>
                          <select
                            value={phase.crystalSystem}
                            onChange={(e) => updatePhase(idx, 'crystalSystem', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-900 text-white border border-slate-700 rounded text-xs"
                          >
                            <option value="Cubic">Cubic</option>
                            <option value="Tetragonal">Tetragonal</option>
                            <option value="Orthorhombic">Orthorhombic</option>
                            <option value="Hexagonal">Hexagonal</option>
                            <option value="Monoclinic">Monoclinic</option>
                            <option value="Triclinic">Triclinic</option>
                          </select>
                        </div>
                        <div>
                           <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">a (Å)</label>
                           <input
                            type="number"
                            step="0.01"
                            value={phase.a}
                            onChange={(e) => updatePhase(idx, 'a', parseFloat(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-900 text-white border border-slate-700 rounded text-sm font-bold font-mono"
                          />
                        </div>
                      </div>
                      
                      {/* Conditional inputs for non-cubic */}
                      {['Tetragonal', 'Orthorhombic', 'Hexagonal', 'Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                        <div className="grid grid-cols-3 gap-2">
                             {['Orthorhombic', 'Monoclinic', 'Triclinic', 'Hexagonal', 'Tetragonal'].includes(phase.crystalSystem) && (
                                <div>
                                   <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">c (Å)</label>
                                   <input
                                      type="number"
                                      step="0.01"
                                      value={phase.c || phase.a}
                                      onChange={(e) => updatePhase(idx, 'c', parseFloat(e.target.value))}
                                      className="w-full px-2 py-1 bg-slate-900 text-white border border-slate-700 rounded text-sm font-bold font-mono"
                                    />
                                </div>
                             )}
                             {['Orthorhombic', 'Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                                <div>
                                   <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">b (Å)</label>
                                   <input
                                      type="number"
                                      step="0.01"
                                      value={phase.b || phase.a}
                                      onChange={(e) => updatePhase(idx, 'b', parseFloat(e.target.value))}
                                      className="w-full px-2 py-1 bg-slate-900 text-white border border-slate-700 rounded text-sm font-bold font-mono"
                                    />
                                </div>
                             )}
                             {['Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                                <div>
                                   <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">β (°)</label>
                                   <input
                                      type="number"
                                      step="0.1"
                                      value={phase.beta || 90}
                                      onChange={(e) => updatePhase(idx, 'beta', parseFloat(e.target.value))}
                                      className="w-full px-2 py-1 bg-slate-900 text-white border border-slate-700 rounded text-sm font-bold font-mono"
                                    />
                                </div>
                             )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Generate Control Parameters
            </button>
          </div>
        </div>
      </div>

      {/* Results Output */}
      <div className="lg:col-span-7">
        <div className="flex flex-col gap-6 h-full">
           
           {/* Strategy Card */}
           {result && (
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase tracking-wide">Refinement Strategy</h3>
               <div className="space-y-2">
                 {result.refinement_strategy.map((step, i) => (
                   <div key={i} className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                     <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                       {i+1}
                     </div>
                     {step.replace(/^\d+\.\s*/, '')}
                   </div>
                 ))}
               </div>
             </div>
           )}

           {/* JSON Output */}
           <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col flex-1 min-h-[400px]">
             <div className="p-3 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
               <h3 className="font-mono text-sm text-teal-400">control_file.json</h3>
               <button 
                  onClick={() => result && navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
               >
                 Copy JSON
               </button>
             </div>
             <div className="p-4 overflow-auto flex-1 custom-scrollbar">
                {result ? (
                  <pre className="font-mono text-xs md:text-sm text-slate-300 leading-relaxed">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600 text-sm font-mono">
                    // Configure parameters and click generate
                  </div>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
