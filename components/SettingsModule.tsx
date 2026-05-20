import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Languages, Hash, Palette, Sparkles, Volume2, Settings, 
  Activity, Cpu, Shield, Zap, Info, Database, Globe,
  Beaker, Monitor, Sliders, Server, Lock, User, Edit3, 
  Save, Check, AlertCircle, Wrench, Microscope, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSynthTone } from '../utils/sound';

interface SettingsModuleProps {
  theme: 'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave';
  setTheme: (theme: 'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave') => void;
  precision: number;
  setPrecision: (precision: number) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  zeroShift: number;
  setZeroShift: (val: number) => void;
  sampleDisplacement: number;
  setSampleDisplacement: (val: number) => void;
  goniometerRadius: number;
  setGoniometerRadius: (val: number) => void;
  defaultWavelength: number;
  setDefaultWavelength: (val: number) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  theme,
  setTheme,
  precision,
  setPrecision,
  animationsEnabled,
  setAnimationsEnabled,
  soundEnabled,
  setSoundEnabled,
  zeroShift,
  setZeroShift,
  sampleDisplacement,
  setSampleDisplacement,
  goniometerRadius,
  setGoniometerRadius,
  defaultWavelength,
  setDefaultWavelength,
}) => {
  const { t, i18n } = useTranslation();

  // Load and manage Operator identity linked with registration storage
  const [operator, setOperator] = useState(() => {
    try {
      const saved = localStorage.getItem('xrd_user_registration');
      return saved ? JSON.parse(saved) : { 
        name: 'Ali Zerehsaz', 
        email: 'director@xrd-calc.lab', 
        organization: 'Neuro-Analytical Laboratory',
        registeredAt: new Date().toISOString() 
      };
    } catch {
      return { 
        name: 'Ali Zerehsaz', 
        email: 'director@xrd-calc.lab', 
        organization: 'Neuro-Analytical Laboratory',
        registeredAt: new Date().toISOString() 
      };
    }
  });

  const [idName, setIdName] = useState(operator.name);
  const [idEmail, setIdEmail] = useState(operator.email);
  const [idOrg, setIdOrg] = useState(operator.organization);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...operator,
      name: idName,
      email: idEmail,
      organization: idOrg
    };
    setOperator(updated);
    localStorage.setItem('xrd_user_registration', JSON.stringify(updated));
    setSaveSuccess(true);
    playSynthTone('success');
    
    // Auto reset indicator after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const themeOptions = [
    { id: 'light', label: 'Light Lux', color: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-200' },
    { id: 'dark', label: 'Dark Matter', color: 'bg-slate-900', text: 'text-white', border: 'border-slate-700' },
    { id: 'cyberpunk', label: 'Cyber Net', color: 'bg-black', text: 'text-yellow-400', border: 'border-yellow-500' },
    { id: 'terminal', label: 'Mainframe', color: 'bg-black', text: 'text-green-500', border: 'border-green-500' },
    { id: 'synthwave', label: 'Neon City', color: 'bg-indigo-950', text: 'text-pink-500', border: 'border-pink-500' }
  ];

  const wavelengthPresets = [
    { label: 'Copper Cu-Kα (1.5406 Å)', val: 1.5406 },
    { label: 'Cobalt Co-Kα (1.7890 Å)', val: 1.7890 },
    { label: 'Molybdenum Mo-Kα (0.7107 Å)', val: 0.7107 },
    { label: 'Iron Fe-Kα (1.9360 Å)', val: 1.9360 },
    { label: 'Chromium Cr-Kα (2.2897 Å)', val: 2.2897 }
  ];

  // Calculated displacement offset mockup formula representation
  const sampleOffsetThetaMock = Math.abs(zeroShift) > 0 || Math.abs(sampleDisplacement) > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 p-4 md:p-0 pb-12"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_50px_rgba(79,70,229,0.3)] relative group">
            <Settings className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-slate-950 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2 text-slate-900 dark:text-white">
              System<span className="text-indigo-600 font-extrabold">Config</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                <Shield className="w-2.5 h-2.5" /> Secure Protocol v2.5
              </span>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">{t('Laboratory Environment')} • Core Calibration</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[180px] shadow-sm">
             <div className="p-2 bg-emerald-500/10 rounded-xl">
               <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
             </div>
             <div>
               <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Diffraction Core</div>
               <div className="text-xs font-black uppercase italic text-emerald-500">Connected & Synced</div>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[180px] shadow-sm">
             <div className="p-2 bg-indigo-500/10 rounded-xl">
               <Activity className="w-5 h-5 text-indigo-500" />
             </div>
             <div>
               <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Numerical Calibration</div>
               <div className="text-xs font-black uppercase italic text-slate-700 dark:text-slate-200">
                 {sampleOffsetThetaMock ? 'Active offsets' : 'Perfect Zero'}
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Appearance & Precision */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32 transition-colors" />
            
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                 <Monitor className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Environment Aesthetics</h3>
                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Customize workspace colors and numerical displays</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                {/* Language Select */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <Globe className="w-3.5 h-3.5" /> Language Locale
                  </label>
                  <div className="relative">
                    <select 
                      value={i18n.language}
                      onChange={(e) => {
                        i18n.changeLanguage(e.target.value);
                        playSynthTone('switch');
                      }}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/10 rounded-[1.2rem] text-sm font-black uppercase italic tracking-tighter outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-sm"
                    >
                      <option value="en">English (US)</option>
                      <option value="de">Deutsch (DE)</option>
                      <option value="fr">Français (FR)</option>
                      <option value="es">Español (ES)</option>
                      <option value="it">Italiano (IT)</option>
                      <option value="nl">Nederlands (NL)</option>
                      <option value="pt">Português (PT)</option>
                      <option value="pl">Polski (PL)</option>
                      <option value="hu">Magyar (HU)</option>
                      <option value="ru">Русский (RU)</option>
                      <option value="uk">Українська (UK)</option>
                      <option value="tr">Türkçe (TR)</option>
                      <option value="ja">日本語 (JA)</option>
                      <option value="zh">简体中文 (ZH)</option>
                      <option value="ko">한국어 (KO)</option>
                      <option value="hi">हिन्दी (HI)</option>
                      <option value="bn">বাংলা (BN)</option>
                      <option value="ar">العربية (AR)</option>
                      <option value="fa">فارسی (FA)</option>
                      <option value="he">עברית (HE)</option>
                      <option value="vi">Tiếng Việt (VI)</option>
                      <option value="id">Bahasa Indonesia (ID)</option>
                      <option value="ms">Bahasa Melayu (MS)</option>
                      <option value="th">ไทย (TH)</option>
                      <option value="sv">Svenska (SV)</option>
                      <option value="da">Dansk (DA)</option>
                      <option value="no">Norsk (NO)</option>
                      <option value="fi">Suomi (FI)</option>
                      <option value="cs">Čeština (CS)</option>
                      <option value="sk">Slovenčina (SK)</option>
                      <option value="ro">Română (RO)</option>
                      <option value="bg">Български (BG)</option>
                      <option value="el">Ελληνικά (EL)</option>
                      <option value="hr">Hrvatski (HR)</option>
                      <option value="sr">Српски (SR)</option>
                      <option value="sl">Slovenščina (SL)</option>
                      <option value="ca">Català (CA)</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Languages className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Accuracy/Precision Settings */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <Sliders className="w-3.5 h-3.5" /> Precision Decimal Decimals
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: 2, label: 'Standard', sub: '2.00' },
                      { val: 4, label: 'High', sub: '4.0000' },
                      { val: 6, label: 'Analytical', sub: '6.000000' },
                      { val: 8, label: 'Scientific', sub: '8.000...' }
                    ].map((pOption) => (
                      <button
                        key={pOption.val}
                        onClick={() => {
                          setPrecision(pOption.val);
                          playSynthTone('tick');
                        }}
                        className={`group p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                          precision === pOption.val
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'
                        }`}
                      >
                        <div className="relative z-10 text-left">
                          <div className={`text-[9px] font-black uppercase tracking-widest ${precision === pOption.val ? 'text-indigo-200' : 'text-slate-400'}`}>{pOption.label}</div>
                          <div className="text-xs font-black font-mono italic">{pOption.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Theme Configuration */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <Palette className="w-3.5 h-3.5" /> Workspace Display Theme
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {themeOptions.map((tOption) => (
                    <button
                      key={tOption.id}
                      onClick={() => {
                        setTheme(tOption.id as any);
                        playSynthTone('switch');
                      }}
                      className={`group flex items-center justify-between p-3 px-4 rounded-2xl border-2 transition-all ${
                        theme === tOption.id
                          ? 'border-indigo-600 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-inner'
                          : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-7 rounded-md ${tOption.color} ${tOption.border} border flex items-center justify-center overflow-hidden shadow-sm`}>
                          <div className={`text-[8px] font-black italic ${tOption.text}`}>A</div>
                        </div>
                        <div className="text-left">
                          <div className={`text-[11px] font-black uppercase tracking-widest ${theme === tOption.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {tOption.label}
                          </div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                        theme === tOption.id ? 'border-indigo-600 bg-indigo-600 scale-110' : 'border-slate-300 dark:border-white/20'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Instrument Calibration & Alignment */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative">
             <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                 <Wrench className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Instrument Calibration</h3>
                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Define mechanical alignment corrections and default radiation parameters</p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               
               <div className="space-y-6">
                 {/* Zero Shift Correction */}
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Zero-Shift Correction (Δ2θ)
                     </label>
                     <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                       {zeroShift > 0 ? `+${zeroShift.toFixed(3)}` : zeroShift.toFixed(3)}°
                     </span>
                   </div>
                   <input
                     type="range"
                     min="-0.5"
                     max="0.5"
                     step="0.005"
                     value={zeroShift}
                     onChange={(e) => {
                       setZeroShift(parseFloat(e.target.value));
                       if (Math.abs(parseFloat(e.target.value) * 1000 % 10) < 1) {
                         playSynthTone('tick');
                       }
                     }}
                     className="w-full accent-indigo-600 bg-slate-100 dark:bg-slate-950 h-2 rounded-lg cursor-pointer appearance-none"
                   />
                   <p className="text-[9px] text-slate-400 leading-tight">
                     Adjusts peak locations to correct for absolute mechanical zero index offset in the circle goniometer.
                   </p>
                 </div>

                 {/* Sample Displacement misalignment */}
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Sample Displacement (s)
                     </label>
                     <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                       {sampleDisplacement.toFixed(4)} mm
                     </span>
                   </div>
                   <input
                     type="range"
                     min="-0.2"
                     max="0.2"
                     step="0.002"
                     value={sampleDisplacement}
                     onChange={(e) => {
                       setSampleDisplacement(parseFloat(e.target.value));
                       if (Math.abs(parseFloat(e.target.value) * 1000 % 5) < 1) {
                         playSynthTone('tick');
                       }
                     }}
                     className="w-full accent-indigo-600 bg-slate-100 dark:bg-slate-950 h-2 rounded-lg cursor-pointer appearance-none"
                   />
                   <p className="text-[9px] text-slate-400 leading-tight">
                     Misalignment perpendicular to the sample stage. Causes systematic $s \cos(\theta)$ shifting errors.
                   </p>
                 </div>

                 {/* Goniometer Radius */}
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                       Goniometer Radius (R)
                     </label>
                     <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                       {goniometerRadius.toFixed(1)} mm
                     </span>
                   </div>
                   <input
                     type="range"
                     min="100"
                     max="300"
                     step="1.0"
                     value={goniometerRadius}
                     onChange={(e) => {
                       setGoniometerRadius(parseFloat(e.target.value));
                       if (parseFloat(e.target.value) % 10 === 0) {
                         playSynthTone('tick');
                       }
                     }}
                     className="w-full accent-indigo-600 bg-slate-100 dark:bg-slate-950 h-2 rounded-lg cursor-pointer appearance-none"
                   />
                   <p className="text-[9px] text-slate-400 leading-tight">
                     Focusing circle radius. Essential to dynamically scale displacement offset calculations.
                   </p>
                 </div>
               </div>

               <div className="space-y-6">
                 {/* Default Radiation Wavelength Selector */}
                 <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                     <Microscope className="w-3.5 h-3.5" /> Lab Source Default (λ)
                   </label>
                   <div className="grid grid-cols-1 gap-2">
                     {wavelengthPresets.map((preset) => (
                       <button
                         key={preset.val}
                         onClick={() => {
                           setDefaultWavelength(preset.val);
                           playSynthTone('success');
                         }}
                         className={`p-3 text-xs w-full text-left rounded-xl border font-bold transition-all flex justify-between items-center ${
                           Math.abs(defaultWavelength - preset.val) < 0.0001
                             ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                             : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5 hover:border-indigo-500/30'
                         }`}
                       >
                         <span>{preset.label}</span>
                         <span className="font-mono text-[10px] opacity-80">{preset.val.toFixed(5)} Å</span>
                       </button>
                     ))}
                   </div>
                   
                   {/* Custom user overridden value */}
                   <div className="pt-2">
                     <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 block">Custom Numerical Wavelength Override:</label>
                     <div className="flex gap-2">
                       <input 
                         type="number"
                         step="0.00001"
                         value={defaultWavelength}
                         onChange={(e) => setDefaultWavelength(parseFloat(e.target.value) || 0)}
                         className="flex-1 p-2 px-3 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg outline-none focus:border-indigo-500"
                       />
                       <span className="bg-slate-100 dark:bg-slate-950 px-3 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/5 font-mono text-xs font-bold text-slate-500">Å</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          </section>

          {/* Section 3: Operator Identity & Profile Synchronization */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-xl relative">
             <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                 <User className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Operator Identity & Lab Clearance</h3>
                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Integrate user profiles, certificates, and metadata properties</p>
               </div>
             </div>

             <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Operator Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Operator / Researcher Name
                    </label>
                    <input 
                      type="text"
                      required
                      value={idName}
                      onChange={(e) => setIdName(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all shadow-inner"
                      placeholder="e.g. Dr. Jane Smith"
                    />
                  </div>

                  {/* Registered Email */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Security Terminal Registered Email
                    </label>
                    <input 
                      type="email"
                      required
                      value={idEmail}
                      onChange={(e) => setIdEmail(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all shadow-inner"
                      placeholder="e.g. chemist@university.edu"
                    />
                  </div>

                  {/* Organization/Institute */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Laboratory / Center / Institution affiliation
                    </label>
                    <input 
                      type="text"
                      required
                      value={idOrg}
                      onChange={(e) => setIdOrg(e.target.value)}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-600 transition-all shadow-inner"
                      placeholder="e.g. Neuro-Analytical Physics Center"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <AnimatePresence>
                      {saveSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full"
                        >
                          <Check className="w-3.5 h-3.5" /> {t('Saved successfully', 'Saved successfully')}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Identification Records
                  </button>
                </div>
             </form>
          </section>
        </div>

        {/* Sidebar Configuration Controls */}
        <div className="space-y-8">
          
          {/* Diagnostics Card */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-white/10 shadow-xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Environment Systems</h3>
            </div>

            <div className="space-y-4">
              {/* Animations Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-white/5 group transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${animationsEnabled ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('Animations')}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Motion Engine Transitions</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setAnimationsEnabled(!animationsEnabled);
                    playSynthTone('tick');
                  }}
                  className={`w-11 h-6 rounded-full transition-all relative ${animationsEnabled ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-700'}`}
                >
                  <div 
                    style={{ transform: animationsEnabled ? 'translateX(20px)' : 'translateX(0px)' }}
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform" 
                  />
                </button>
              </div>

              {/* Sound FX Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-white/5 group transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${soundEnabled ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('Sound Effects')}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Audio Feedback Synth</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    localStorage.setItem('xrd_sound', (!soundEnabled).toString());
                    setTimeout(() => {
                      playSynthTone('success');
                    }, 50);
                  }}
                  className={`w-11 h-6 rounded-full transition-all relative ${soundEnabled ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-700'}`}
                >
                  <div 
                    style={{ transform: soundEnabled ? 'translateX(20px)' : 'translateX(0px)' }}
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform" 
                  />
                </button>
              </div>
            </div>

            <div className="p-6 bg-indigo-600 rounded-[2rem] text-white relative overflow-hidden group shadow-xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full -mr-16 -mt-16 duration-700" />
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-3">
                   <Lock className="w-4 h-4 text-indigo-200" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200">{t('Security Layer')}</span>
                 </div>
                 <h4 className="text-xl font-black uppercase italic tracking-tighter mb-1">Encrypted Core</h4>
                 <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest leading-relaxed">
                   Decentralized Sandbox • All processing is securely executed client-side inside the lab container
                 </p>
               </div>
            </div>
          </section>

          {/* Active Calibration Offset Auditor */}
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-white/10 shadow-xl space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                   <Compass className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Correction Active Auditor</span>
             </div>
             
             <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3.5">
                <div className="space-y-1">
                   <div className="text-[9px] font-black uppercase text-slate-400">Zero Error Correction (Δ2θ)</div>
                   <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                     2θ_calibrated = 2θ_obs - ({zeroShift >= 0 ? '+' : ''}{zeroShift.toFixed(3)}°)
                   </div>
                </div>

                <div className="space-y-1">
                   <div className="text-[9px] font-black uppercase text-slate-400">Displacement Shift Correction</div>
                   <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                     Shift_rad = 2 * ({sampleDisplacement.toFixed(4)}mm) * cos(θ) / ({goniometerRadius.toFixed(1)}mm)
                   </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                   <span>Auditor Status:</span>
                   <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black tracking-widest ${sampleOffsetThetaMock ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                     {sampleOffsetThetaMock ? 'Applied Compensations' : 'Ideal Alignments'}
                   </span>
                </div>
             </div>
          </section>

          {/* System Terminal details card */}
          <section className="bg-slate-950 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
             <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-slate-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Node details</span>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-2">
                   <span className="text-slate-500">Suite Version</span>
                   <span className="text-slate-300">v2.5.0-PRO</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-2">
                   <span className="text-slate-500">Local Core</span>
                   <span className="text-emerald-400 font-mono">SANDBOX-RUN</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                   <span className="text-slate-500">Synthesizer FX</span>
                   <span className={soundEnabled ? "text-emerald-400" : "text-amber-500"}>
                     {soundEnabled ? 'ONLINE' : 'MUTED'}
                   </span>
                </div>
             </div>
          </section>
        </div>
      </div>

      <div className="pt-16 pb-8 text-center border-t border-slate-200 dark:border-white/5">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] max-w-lg mx-auto leading-relaxed">
          All configuration parameters and calibration matrices process locally inside the tab and are automatically committed to active storage in real-time.
        </p>
      </div>
    </motion.div>
  );
};
