
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BraggInput } from './components/BraggInput';
import { ResultsTable } from './components/ResultsTable';
import { DiffractionChart } from './components/DiffractionChart';
import { TestMaterialsModule } from './components/TestMaterialsModule';
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
import { ImageGenerationModule } from './components/ImageGenerationModule';
import { SettingsModule } from './components/SettingsModule';
import { ProfilePage } from './components/ProfilePage';
import { LearnModule } from './components/LearnModule';
import { AIChatSupport } from './components/AIChatSupport';
import { ModuleIntro } from './components/ModuleIntro';
import { LandingPage } from './components/LandingPage';
import { RegistrationPage } from './components/RegistrationPage';
import { SideSeekBar } from './components/SideSeekBar';
import { BraggHistory } from './components/BraggHistory';
import { BraggVisualization } from './components/BraggVisualization';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsContext } from './components/SettingsContext';
import { calculateBragg, parsePeakString } from './utils/physics';
import { BraggResult, BraggHistoryItem } from './types';
import { Zap, Terminal, Music, Languages, Palette, Hash, Sparkles, Volume2, Settings2, Check } from 'lucide-react';

type Module = 'bragg' | 'fwhm' | 'selection' | 'scherrer' | 'wh' | 'integral' | 'integral_adv' | 'wa' | 'rietveld' | 'neutron' | 'magnetic' | 'dl' | 'image_analysis' | 'image_gen' | 'learn' | 'profile' | 'settings';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    return !!localStorage.getItem('xrd_user_registration');
  });
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<Module>('bragg');
  const [isExplained, setIsExplained] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave'>('light');
  const [precision, setPrecision] = useState<number>(4);
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  // Bragg State
  const [sampleId, setSampleId] = useState<string>('');
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [rawPeaks, setRawPeaks] = useState<string>('28.44, 47.30, 56.12, 69.13, 76.38'); 
  const [rawHKL, setRawHKL] = useState<string>('111, 220, 311, 400, 331');
  const [materialName, setMaterialName] = useState<string | null>(null);
  const [results, setResults] = useState<BraggResult[]>([]);
  const [braggHistory, setBraggHistory] = useState<BraggHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('xrd_bragg_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Reset explanation state when module changes (except for profile/learn/settings)
  useEffect(() => {
    if (activeModule !== 'profile' && activeModule !== 'learn' && activeModule !== 'settings') {
      setIsExplained(false);
    } else {
      setIsExplained(true); // Auto-explain profile/learn/settings
    }
  }, [activeModule]);

  // Apply theme classes to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'cyberpunk', 'terminal', 'synthwave');
    if (theme !== 'light') {
      root.classList.add(theme);
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
        sampleId: sampleId.trim() || undefined,
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
    if (item.sampleId) setSampleId(item.sampleId);
    setWavelength(item.wavelength);
    setRawPeaks(item.rawPeaks);
    setRawHKL(item.rawHKL);
    setResults(item.results);
  };

  const clearHistory = () => {
    setBraggHistory([]);
    localStorage.removeItem('xrd_bragg_history');
  };

  const handleAILoad = (peaks: number[], newWavelength?: number, hkls?: string[], material?: string) => {
    if (newWavelength) setWavelength(newWavelength);
    setRawPeaks(peaks.join(', '));
    if (hkls && hkls.length > 0) {
      setRawHKL(hkls.join(', '));
    }
    if (material) {
      setMaterialName(material);
    }
  };

  const braggJsonOutput = {
    module: "Bragg-Basics",
    material: materialName || "Unknown",
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
        <LandingPage onEnter={() => setHasEntered(true)} theme={theme} setTheme={setTheme} />
      </div>
    );
  }

  const modules: { id: Module; label: string; icon?: string; group?: string }[] = [
    { id: 'bragg', label: t('Bragg Basics'), group: t('Fundamentals') },
    { id: 'fwhm', label: t('FWHM Analysis'), group: t('Fundamentals') },
    { id: 'selection', label: t('Selection Rules'), group: t('Fundamentals') },
    { id: 'scherrer', label: t('Scherrer Method'), group: t('Size & Strain') },
    { id: 'wh', label: t('Williamson-Hall'), group: t('Size & Strain') },
    { id: 'integral', label: t('Integral Breadth'), group: t('Size & Strain') },
    { id: 'integral_adv', label: t('IB Advanced (W-H)'), group: t('Size & Strain') },
    { id: 'wa', label: t('Warren-Averbach'), group: t('Size & Strain') },
    { id: 'rietveld', label: t('Rietveld Setup'), group: t('Advanced Sim') },
    { id: 'neutron', label: t('Neutron Diffraction'), group: t('Advanced Sim') },
    { id: 'magnetic', label: t('Magnetic Diffraction'), group: t('Advanced Sim') },
    { id: 'dl', label: t('PhaseID Neural Net'), group: t('AI Tools') },
    { id: 'image_analysis', label: t('Image Analysis'), group: t('AI Tools') },
    { id: 'image_gen', label: t('Scientific Illustrator'), group: t('AI Tools') },
    { id: 'learn', label: t('Protocol Guide'), group: t('Intelligence') },
    { id: 'profile', label: t('Laboratory Director'), group: t('Intelligence') },
    { id: 'settings', label: t('Settings'), group: t('Intelligence') },
  ];

  const isRTL = i18n.language === 'he' || i18n.language === 'fa';

  return (
    <SettingsContext.Provider value={{ precision }}>
      <div className={`${theme === 'light' ? '' : theme} h-full`} dir={isRTL ? 'rtl' : 'ltr'}>
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
               <span className={`text-[10px] ${theme === 'cyberpunk' ? 'text-cyber-blue' : 'text-slate-500'} font-mono uppercase tracking-widest mt-1 block`}>{t('Scientific Suite')}</span>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            {[t('Fundamentals'), t('Size & Strain'), t('Advanced Sim'), t('AI Tools'), t('Intelligence')].map((group) => (
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
          </div>
          
          <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
              <div className="mb-1 font-bold uppercase tracking-widest">v2.5.0 • {t('Lab Active')}</div>
              <div className="opacity-60">{t('Designed by')} Ali Zerehsaz</div>
            </div>
          </div>
        </aside>
        
        <SideSeekBar targetRef={mainContentRef} theme={theme} />

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
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className={`block w-20 rounded-lg border ${theme !== 'light' && theme !== 'dark' ? 'bg-black border-slate-700 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'} py-1.5 pl-1 pr-1 text-[10px] outline-none`}
              >
                <option value="en">EN</option>
                <option value="de">DE</option>
                <option value="fr">FR</option>
                <option value="es">ES</option>
                <option value="pt">PT</option>
                <option value="it">IT</option>
                <option value="nl">NL</option>
                <option value="ca">CA</option>
                <option value="ru">RU</option>
                <option value="uk">UK</option>
                <option value="bg">BG</option>
                <option value="cs">CS</option>
                <option value="sk">SK</option>
                <option value="ro">RO</option>
                <option value="hu">HU</option>
                <option value="pl">PL</option>
                <option value="hr">HR</option>
                <option value="sr">SR</option>
                <option value="sl">SL</option>
                <option value="tr">TR</option>
                <option value="el">EL</option>
                <option value="he">HE</option>
                <option value="fa">FA</option>
                <option value="ar">AR</option>
                <option value="hi">HI</option>
                <option value="bn">BN</option>
                <option value="ja">JA</option>
                <option value="zh">ZH</option>
                <option value="ko">KO</option>
                <option value="ms">MS</option>
                <option value="tl">TL</option>
                <option value="vi">VI</option>
                <option value="id">ID</option>
                <option value="sv">SV</option>
                <option value="da">DA</option>
                <option value="no">NO</option>
                <option value="fi">FI</option>
                <option value="th">TH</option>
              </select>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className={`block w-28 rounded-lg border ${theme !== 'light' && theme !== 'dark' ? 'bg-black border-slate-700 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'} py-1.5 pl-2 pr-2 text-[10px] outline-none`}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="cyberpunk">Cyber</option>
                <option value="terminal">Terminal</option>
                <option value="synthwave">Synth</option>
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

          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar relative">
            <div className="max-w-7xl mx-auto">
              {!isExplained ? (
                <ModuleIntro 
                  module={activeModule} 
                  onUnderstand={() => setIsExplained(true)} 
                />
              ) : (
                <ErrorBoundary key={activeModule}>
                  {activeModule === 'bragg' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 items-start">
                      <div className="lg:col-span-4 space-y-6">
                        <BraggInput 
                          sampleId={sampleId}
                          setSampleId={setSampleId}
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
                        <TestMaterialsModule onLoadMaterial={handleAILoad} />
                        
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
                        <BraggVisualization 
                          wavelength={wavelength} 
                          twoTheta={results.length > 0 ? results[0].twoTheta : 20} 
                        />
                        <DiffractionChart results={results} materialName={materialName} />
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
                  {activeModule === 'learn' && <LearnModule />}
                  {activeModule === 'profile' && <ProfilePage />}
                  {activeModule === 'settings' && (
                    <SettingsModule 
                      theme={theme}
                      setTheme={setTheme}
                      precision={precision}
                      setPrecision={setPrecision}
                      animationsEnabled={animationsEnabled}
                      setAnimationsEnabled={setAnimationsEnabled}
                      soundEnabled={soundEnabled}
                      setSoundEnabled={setSoundEnabled}
                    />
                  )}
                </ErrorBoundary>
              )}
            </div>
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs">
                XRD-Calc Pro {t('Laboratory Environment')} • {t('Designed by')} Ali Zerehsaz
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 max-w-2xl mx-auto italic leading-relaxed">
                {t('Disclaimer')}
              </p>
            </div>
          </main>
          <AIChatSupport />
        </div>
      </div>
    </div>
    </SettingsContext.Provider>
  );
};

export default App;
