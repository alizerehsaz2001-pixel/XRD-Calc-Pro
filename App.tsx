
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
import { ImageGenerationModule } from './components/ImageGenerationModule';
import { ProfilePage } from './components/ProfilePage';
import { LearnModule } from './components/LearnModule';
import { AIChatSupport } from './components/AIChatSupport';
import { ModuleIntro } from './components/ModuleIntro';
import { LandingPage } from './components/LandingPage';
import { RegistrationPage } from './components/RegistrationPage';
import { BraggHistory } from './components/BraggHistory';
import { calculateBragg, parsePeakString } from './utils/physics';
import { BraggResult, BraggHistoryItem } from './types';
import { Zap } from 'lucide-react';

type Module = 'bragg' | 'fwhm' | 'selection' | 'scherrer' | 'wh' | 'integral' | 'integral_adv' | 'wa' | 'rietveld' | 'neutron' | 'magnetic' | 'dl' | 'image_analysis' | 'crystal_mind' | 'image_gen' | 'learn' | 'profile';

const App: React.FC = () => {
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    return !!localStorage.getItem('xrd_user_registration');
  });
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<Module>('bragg');
  const [isExplained, setIsExplained] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'cyberpunk'>('light');
  
  // Bragg State
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [rawPeaks, setRawPeaks] = useState<string>('28.44, 47.30, 56.12, 69.13, 76.38'); 
  const [rawHKL, setRawHKL] = useState<string>('111, 220, 311, 400, 331');
  const [results, setResults] = useState<BraggResult[]>([]);
  const [braggHistory, setBraggHistory] = useState<BraggHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('xrd_bragg_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Reset explanation state when module changes (except for profile/learn)
  useEffect(() => {
    if (activeModule !== 'profile' && activeModule !== 'learn') {
      setIsExplained(false);
    } else {
      setIsExplained(true); // Auto-explain profile/learn
    }
  }, [activeModule]);

  // Apply theme classes to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'cyberpunk');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'cyberpunk') {
      root.classList.add('cyberpunk');
    }
  }, [theme]);

  const handleCalculate = (saveToHistory = true) => {
    const peaks = parsePeakString(rawPeaks);
    const hklList = rawHKL
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '');

    const computed = peaks
      .map((theta, idx) => {
        const res = calculateBragg(wavelength, theta);
        if (res) {
          return { ...res, hkl: hklList[idx] || '' } as BraggResult;
        }
        return null;
      })
      .filter((res): res is BraggResult => res !== null);
    
    setResults(computed);

    // Save to history
    if (saveToHistory && computed.length > 0) {
      const newItem: BraggHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        wavelength,
        rawPeaks,
        rawHKL,
        results: computed
      };
      
      setBraggHistory(prev => {
        const updated = [newItem, ...prev].slice(0, 10); // Keep last 10
        localStorage.setItem('xrd_bragg_history', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const restoreHistory = (item: BraggHistoryItem) => {
    setWavelength(item.wavelength);
    setRawPeaks(item.rawPeaks);
    setRawHKL(item.rawHKL);
    setResults(item.results);
  };

  const clearHistory = () => {
    setBraggHistory([]);
    localStorage.removeItem('xrd_bragg_history');
  };

  const handleAILoad = (peaks: number[], newWavelength?: number, hkls?: string[]) => {
    if (newWavelength) setWavelength(newWavelength);
    setRawPeaks(peaks.join(', '));
    if (hkls && hkls.length > 0) {
      setRawHKL(hkls.join(', '));
    }
  };

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

  useEffect(() => {
    handleCalculate(false);
  }, []);

  if (!isRegistered) {
    return <RegistrationPage onRegister={() => setIsRegistered(true)} />;
  }

  if (!hasEntered) {
    return (
      <div className={theme === 'light' ? '' : theme}>
        <LandingPage onEnter={() => setHasEntered(true)} />
      </div>
    );
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
    { id: 'image_gen', label: 'Scientific Illustrator', group: 'AI Tools' },
    { id: 'crystal_mind', label: 'CrystalMind Control', group: 'AI Tools' },
    { id: 'learn', label: 'App Tutorial', group: 'About' },
    { id: 'profile', label: 'Designer Profile', group: 'About' },
  ];

  return (
    <div className={`${theme === 'light' ? '' : theme} h-full`}>
      <div className={`flex h-screen ${theme === 'cyberpunk' ? 'bg-black' : 'bg-slate-50 dark:bg-slate-950'} text-slate-900 dark:text-slate-100 overflow-hidden animate-in fade-in duration-700 transition-colors`}>
        
        {/* Sidebar Navigation */}
        <aside className={`hidden md:flex w-72 flex-col ${theme === 'cyberpunk' ? 'bg-black border-cyber-accent/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10'} border-r h-full shrink-0 z-20 shadow-2xl relative transition-colors`}>
          <div className={`p-6 border-b ${theme === 'cyberpunk' ? 'border-cyber-accent/30 bg-black' : 'border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50'} flex items-center gap-3 backdrop-blur-md`}>
             <div className={`w-10 h-10 ${theme === 'cyberpunk' ? 'bg-cyber-pink shadow-[0_0_15px_rgba(255,0,255,0.5)]' : 'bg-indigo-600 shadow-lg shadow-indigo-500/20'} rounded-xl flex items-center justify-center text-white font-bold text-xl border border-white/10`}>
               λ
             </div>
             <div>
               <span className={`font-extrabold text-xl tracking-tight ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-slate-900 dark:text-white'} block leading-none`}>
                 XRD-Calc<span className={theme === 'cyberpunk' ? 'text-cyber-pink' : 'text-indigo-600 dark:text-indigo-400'}>Pro</span>
               </span>
               <span className={`text-[10px] ${theme === 'cyberpunk' ? 'text-cyber-blue' : 'text-slate-500'} font-mono uppercase tracking-widest mt-1 block`}>Scientific Suite</span>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            {['Fundamentals', 'Size & Strain', 'Advanced Sim', 'AI Tools', 'About'].map((group) => (
              <div key={group} className="space-y-2">
                <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">
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
                          : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {activeModule === m.id && (
                        <span className="absolute left-0 w-1 h-5 bg-white rounded-r-full" />
                      )}
                      <span className={`w-1.5 h-1.5 rounded-full ${activeModule === m.id ? 'bg-white' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-400 dark:group-hover:bg-slate-500'}`} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="h-8"></div>
          </div>
          
          <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-1">
              <button 
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                title="Light Mode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                title="Dark Mode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
              <button 
                onClick={() => setTheme('cyberpunk')}
                className={`flex items-center justify-center p-2 rounded-lg transition-all ${theme === 'cyberpunk' ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(219,39,119,0.5)]' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-pink-500'}`}
                title="Cyberpunk Mode"
              >
                <Zap className="h-4 w-4" />
              </button>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
              <div className="mb-1 font-bold">v2.5.0 • Lab Active</div>
              <div className="opacity-60">Designed by Ali Zerehsaz</div>
            </div>
          </div>
        </aside>

        <div className={`flex-1 flex flex-col h-full overflow-hidden ${theme === 'cyberpunk' ? 'bg-black' : 'bg-slate-50 dark:bg-slate-950'} text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
          <div className={`md:hidden ${theme === 'cyberpunk' ? 'bg-black border-cyber-accent/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10'} border-b p-4 flex justify-between items-center z-20 shrink-0`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 ${theme === 'cyberpunk' ? 'bg-cyber-pink' : 'bg-indigo-600'} rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                λ
              </div>
              <span className={`font-bold text-lg ${theme === 'cyberpunk' ? 'text-cyber-accent' : 'text-slate-900 dark:text-white'}`}>XRD-Calc Pro</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className={`block w-24 rounded-lg border ${theme === 'cyberpunk' ? 'bg-black border-cyber-accent text-cyber-accent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'} py-1.5 pl-2 pr-2 text-[10px] outline-none`}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="cyberpunk">Cyber</option>
              </select>
              <select
                value={activeModule}
                onChange={(e) => setActiveModule(e.target.value as Module)}
                className={`block w-32 rounded-lg border ${theme === 'cyberpunk' ? 'bg-black border-cyber-accent text-cyber-accent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'} py-1.5 pl-2 pr-2 text-xs outline-none`}
              >
                {modules.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
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
                          onCalculate={() => handleCalculate(true)}
                        />
                        <BraggHistory 
                          history={braggHistory} 
                          onRestore={restoreHistory} 
                          onClear={clearHistory} 
                        />
                        <GeminiAssistant onLoadPeaks={handleAILoad} />
                        
                        <div className="bg-slate-900 dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-800 dark:border-white/5 ring-1 ring-white/10">
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
                  {activeModule === 'image_gen' && <ImageGenerationModule />}
                  {activeModule === 'crystal_mind' && <CrystalMindModule />}
                  {activeModule === 'learn' && <LearnModule />}
                  {activeModule === 'profile' && <ProfilePage />}
                </>
              )}
            </div>
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs">
                XRD-Calc Pro Laboratory Environment • Designed by Ali Zerehsaz
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 max-w-2xl mx-auto italic leading-relaxed">
                Disclaimer: AI-generated insights and phase identifications are probabilistic. Scientific results should always be manually verified against standard databases (ICDD/COD) before publication or critical decision-making.
              </p>
            </div>
          </main>
          <AIChatSupport />
        </div>
      </div>
    </div>
  );
};

export default App;
