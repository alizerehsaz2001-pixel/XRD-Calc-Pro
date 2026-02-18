
import React, { useState, useEffect } from 'react';
import { BraggInput } from './components/BraggInput';
import { ResultsTable } from './components/ResultsTable';
import { DiffractionChart } from './components/DiffractionChart';
import { GeminiAssistant } from './components/GeminiAssistant';
import { SelectionRulesModule } from './components/SelectionRulesModule';
import { ScherrerModule } from './components/ScherrerModule';
import { WilliamsonHallModule } from './components/WilliamsonHallModule';
import { IntegralBreadthModule } from './components/IntegralBreadthModule';
import { IntegralBreadthAdvancedModule } from './components/IntegralBreadthAdvancedModule';
import { WarrenAverbachModule } from './components/WarrenAverbachModule';
import { RietveldModule } from './components/RietveldModule';
import { NeutronModule } from './components/NeutronModule';
import { MagneticNeutronModule } from './components/MagneticNeutronModule';
import { DeepLearningModule } from './components/DeepLearningModule';
import { FWHMModule } from './components/FWHMModule';
import { ImageAnalysisModule } from './components/ImageAnalysisModule';
import { CrystalMindModule } from './components/CrystalMindModule';
import { ProfilePage } from './components/ProfilePage';
import { AIChatSupport } from './components/AIChatSupport';
import { ModuleIntro } from './components/ModuleIntro';
import { LandingPage } from './components/LandingPage';
import { calculateBragg, parsePeakString } from './utils/physics';
import { BraggResult } from './types';

type Module = 'bragg' | 'fwhm' | 'selection' | 'scherrer' | 'wh' | 'integral' | 'integral_adv' | 'wa' | 'rietveld' | 'neutron' | 'magnetic' | 'dl' | 'image_analysis' | 'crystal_mind' | 'profile';

const App: React.FC = () => {
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<Module>('bragg');
  const [isExplained, setIsExplained] = useState<boolean>(false);
  
  // Bragg State
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [rawPeaks, setRawPeaks] = useState<string>('28.44, 47.30, 56.12, 69.13, 76.38'); 
  const [rawHKL, setRawHKL] = useState<string>('111, 220, 311, 400, 331');
  const [results, setResults] = useState<BraggResult[]>([]);

  // Reset explanation state when module changes (except for profile)
  useEffect(() => {
    if (activeModule !== 'profile') {
      setIsExplained(false);
    } else {
      setIsExplained(true); // Auto-explain profile since it's just info
    }
  }, [activeModule]);

  const handleCalculate = () => {
    const peaks = parsePeakString(rawPeaks);
    // Robust parsing for HKL: handle commas and spaces between triplets
    const hklList = rawHKL
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '');

    const computed = peaks
      .map((theta, idx) => {
        const res = calculateBragg(wavelength, theta);
        if (res) {
          // Associate peak with corresponding HKL if index exists
          return { ...res, hkl: hklList[idx] || '' } as BraggResult;
        }
        return null;
      })
      .filter((res): res is BraggResult => res !== null);
    
    setResults(computed);
  };

  const handleAILoad = (peaks: number[], newWavelength?: number, hkls?: string[]) => {
    if (newWavelength) setWavelength(newWavelength);
    setRawPeaks(peaks.join(', '));
    if (hkls && hkls.length > 0) {
      setRawHKL(hkls.join(', '));
    }
  };

  // Formatted Output for "Bragg-Basics" mission
  const braggJsonOutput = {
    module: "Bragg-Basics",
    wavelength_angstrom: wavelength,
    results: results.map(r => ({
      "hkl": r.hkl,
      "2theta_deg": r.twoTheta,
      "d_spacing_angstrom": r.dSpacing,
      "q_vector_inverse_angstrom": r.qVector,
      "sin_theta_over_lambda": r.sinThetaOverLambda
    }))
  };

  // Initial calculation on mount
  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasEntered) {
    return <LandingPage onEnter={() => setHasEntered(true)} />;
  }

  const modules: { id: Module; label: string; icon?: string; group?: string }[] = [
    { id: 'bragg', label: 'Bragg Basics', group: 'Fundamentals' },
    { id: 'fwhm', label: 'FWHM Analysis', group: 'Fundamentals' },
    { id: 'selection', label: 'Selection Rules', group: 'Fundamentals' },
    { id: 'scherrer', label: 'Scherrer Method', group: 'Size & Strain' },
    { id: 'wh', label: 'Williamson-Hall', group: 'Size & Strain' },
    { id: 'integral', label: 'Integral Breadth', group: 'Size & Strain' },
    { id: 'integral_adv', label: 'IB Advanced (W-H)', group: 'Size & Strain' },
    { id: 'wa', label: 'Warren-Averbach', group: 'Size & Strain' },
    { id: 'rietveld', label: 'Rietveld Setup', group: 'Advanced Sim' },
    { id: 'neutron', label: 'Neutron Diffraction', group: 'Advanced Sim' },
    { id: 'magnetic', label: 'Magnetic Diffraction', group: 'Advanced Sim' },
    { id: 'dl', label: 'Deep Learning Phase ID', group: 'AI Tools' },
    { id: 'image_analysis', label: 'Image Analysis', group: 'AI Tools' },
    { id: 'crystal_mind', label: 'CrystalMind Control', group: 'AI Tools' },
    { id: 'profile', label: 'Designer Profile', group: 'About' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden animate-in fade-in duration-700">
      
      {/* Sidebar Navigation - The vertical "Bar" */}
      <aside className="hidden md:flex w-72 flex-col bg-slate-900 border-r border-white/10 h-full shrink-0 z-20 shadow-2xl relative">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-slate-900/50 backdrop-blur-md">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20 border border-white/10">
             λ
           </div>
           <div>
             <span className="font-extrabold text-xl tracking-tight text-white block leading-none">
               XRD-Calc<span className="text-indigo-400">Pro</span>
             </span>
             <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1 block">Scientific Suite</span>
           </div>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {['Fundamentals', 'Size & Strain', 'Advanced Sim', 'AI Tools', 'About'].map((group) => (
            <div key={group} className="space-y-2">
              <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">
                {group}
              </h3>
              <div className="space-y-1">
                {modules.filter(m => m.group === group).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveModule(m.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative flex items-center gap-3 ${
                      activeModule === m.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {activeModule === m.id && (
                      <span className="absolute left-0 w-1 h-5 bg-white rounded-r-full" />
                    )}
                    <span className={`w-1.5 h-1.5 rounded-full ${activeModule === m.id ? 'bg-white' : 'bg-slate-700 group-hover:bg-slate-500'}`} />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="h-8"></div>
        </div>
        
        <div className="p-4 border-t border-white/10 text-[10px] text-slate-500 text-center bg-slate-900/80 backdrop-blur-sm">
          <div className="mb-1">v2.5.0 • Lab Environment Active</div>
          <div className="opacity-60">Designed by Ali Zerehsaz</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 text-slate-900">
        <div className="md:hidden bg-slate-900 border-b border-white/10 p-4 flex justify-between items-center z-20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              λ
            </div>
            <span className="font-bold text-lg text-white">XRD-Calc Pro</span>
          </div>
          <select
            value={activeModule}
            onChange={(e) => setActiveModule(e.target.value as Module)}
            className="block w-40 rounded-lg border-white/10 py-1.5 pl-3 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 border bg-slate-800 text-white outline-none"
          >
            {modules.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto">
            {!isExplained ? (
              <ModuleIntro 
                module={activeModule} 
                onUnderstand={() => setIsExplained(true)} 
              />
            ) : (
              <>
                {activeModule === 'bragg' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 items-start">
                    <div className="lg:col-span-4 space-y-6">
                      <BraggInput 
                        wavelength={wavelength}
                        setWavelength={setWavelength}
                        rawPeaks={rawPeaks}
                        setRawPeaks={setRawPeaks}
                        rawHKL={rawHKL}
                        setRawHKL={setRawHKL}
                        onCalculate={handleCalculate}
                      />
                      <GeminiAssistant onLoadPeaks={handleAILoad} />
                      
                      <div className="bg-slate-900 rounded-2xl p-5 shadow-2xl border border-white/5 ring-1 ring-white/10">
                         <div className="flex justify-between items-center mb-3">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                             <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Engine Data Link</span>
                           </div>
                           <button 
                             onClick={() => navigator.clipboard.writeText(JSON.stringify(braggJsonOutput, null, 2))}
                             className="text-[10px] text-white/40 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded-md"
                           >
                             Copy Strict JSON
                           </button>
                         </div>
                         <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto custom-scrollbar leading-relaxed h-48 scrollbar-thin scrollbar-thumb-slate-700">
                            {JSON.stringify(braggJsonOutput, null, 2)}
                         </pre>
                      </div>
                    </div>

                    <div className="lg:col-span-8 space-y-6">
                      <DiffractionChart results={results} />
                      <ResultsTable results={results} />
                    </div>
                  </div>
                )}

                {activeModule === 'fwhm' && <FWHMModule />}
                {activeModule === 'selection' && <SelectionRulesModule />}
                {activeModule === 'scherrer' && <ScherrerModule />}
                {activeModule === 'wh' && <WilliamsonHallModule />}
                {activeModule === 'integral' && <IntegralBreadthModule />}
                {activeModule === 'integral_adv' && <IntegralBreadthAdvancedModule />}
                {activeModule === 'wa' && <WarrenAverbachModule />}
                {activeModule === 'rietveld' && <RietveldModule />}
                {activeModule === 'neutron' && <NeutronModule />}
                {activeModule === 'magnetic' && <MagneticNeutronModule />}
                {activeModule === 'dl' && <DeepLearningModule />}
                {activeModule === 'image_analysis' && <ImageAnalysisModule />}
                {activeModule === 'crystal_mind' && <CrystalMindModule />}
                {activeModule === 'profile' && <ProfilePage />}
              </>
            )}
          </div>
          <div className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
            XRD-Calc Pro Laboratory Environment • Designed by Ali Zerehsaz
          </div>
        </main>
        <AIChatSupport />
      </div>
    </div>
  );
};

export default App;
