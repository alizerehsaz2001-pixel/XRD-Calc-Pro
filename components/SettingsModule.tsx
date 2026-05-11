import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Languages, Hash, Palette, Sparkles, Volume2, Settings, 
  Activity, Cpu, Shield, Zap, Info, Database, Globe,
  Beaker, Monitor, Sliders, Server, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModuleProps {
  theme: 'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave';
  setTheme: (theme: 'light' | 'dark' | 'cyberpunk' | 'terminal' | 'synthwave') => void;
  precision: number;
  setPrecision: (precision: number) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
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
}) => {
  const { t, i18n } = useTranslation();

  const themeOptions = [
    { id: 'light', label: 'Light Lux', color: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-200' },
    { id: 'dark', label: 'Dark Matter', color: 'bg-slate-900', text: 'text-white', border: 'border-slate-700' },
    { id: 'cyberpunk', label: 'Cyber Net', color: 'bg-black', text: 'text-yellow-400', border: 'border-yellow-500' },
    { id: 'terminal', label: 'Mainframe', color: 'bg-black', text: 'text-green-500', border: 'border-green-500' },
    { id: 'synthwave', label: 'Neon City', color: 'bg-indigo-950', text: 'text-pink-500', border: 'border-pink-500' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 p-4 md:p-0 pb-12"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-[0_0_50px_rgba(79,70,229,0.3)] relative group">
            <Settings className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-slate-950 rounded-full" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">
              Lab<span className="text-indigo-600">Config</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                <Shield className="w-2.5 h-2.5" /> {t('Secure Protocol', 'Secure Protocol')} v2.5
              </span>
              <p className="text-slate-500 font-bold text-xs">{t('Laboratory Environment')} v2.5.0</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[180px] shadow-sm">
             <div className="p-2 bg-amber-500/10 rounded-xl">
               <Zap className="w-5 h-5 text-amber-500" />
             </div>
             <div>
               <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{t('Engine Status', 'Engine Status')}</div>
               <div className="text-xs font-black uppercase italic text-emerald-500">{t('Operational', 'Operational')}</div>
             </div>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[180px] shadow-sm">
             <div className="p-2 bg-indigo-500/10 rounded-xl">
               <Activity className="w-5 h-5 text-indigo-500" />
             </div>
             <div>
               <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{t('Sync Latency', 'Sync Latency')}</div>
               <div className="text-xs font-black uppercase italic text-slate-700 dark:text-slate-300">12ms ({t('Global', 'Global')})</div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appearance & Identity */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32 transition-colors group-hover:bg-indigo-500/10" />
            
            <div className="flex items-center gap-4 mb-10">
               <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
                 <Monitor className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">{t('Environment Appearance', 'Environment Appearance')}</h3>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{t('Customize your visual interface protocol', 'Customize your visual interface protocol')}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    <Globe className="w-3.5 h-3.5" /> {t('Language')}
                  </label>
                  <div className="relative group">
                    <select 
                      value={i18n.language}
                      onChange={(e) => i18n.changeLanguage(e.target.value)}
                      className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-white/10 rounded-[1.5rem] text-sm font-black uppercase italic tracking-tighter outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-sm"
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
                      <option value="pl">Polski (PL)</option>
                      <option value="ro">Română (RO)</option>
                      <option value="bg">Български (BG)</option>
                      <option value="el">Ελληνικά (EL)</option>
                      <option value="hr">Hrvatski (HR)</option>
                      <option value="sr">Српски (SR)</option>
                      <option value="sl">Slovenščina (SL)</option>
                      <option value="ca">Català (CA)</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <Languages className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    <Sliders className="w-3.5 h-3.5" /> {t('Precision')}
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
                        onClick={() => setPrecision(pOption.val)}
                        className={`group p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                          precision === pOption.val
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'
                        }`}
                      >
                        <div className="relative z-10 text-left">
                          <div className={`text-[9px] font-black uppercase tracking-widest ${precision === pOption.val ? 'text-indigo-200' : 'text-slate-400'}`}>{pOption.label}</div>
                          <div className="text-xs font-black font-mono italic">{pOption.sub}</div>
                        </div>
                        {precision === pOption.val && (
                          <motion.div layoutId="precision-glow" className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  <Palette className="w-3.5 h-3.5" /> {t('Theme Visual Protocol', 'Theme Visual Protocol')}
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {themeOptions.map((tOption) => (
                    <button
                      key={tOption.id}
                      onClick={() => setTheme(tOption.id as any)}
                      className={`group flex items-center justify-between p-4 rounded-[1.5rem] border-2 transition-all ${
                        theme === tOption.id
                          ? 'border-indigo-600 bg-indigo-500/5 shadow-inner'
                          : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-8 rounded-lg ${tOption.color} ${tOption.border} border-2 flex items-center justify-center overflow-hidden relative shadow-sm`}>
                          <div className={`text-[8px] font-black italic ${tOption.text}`}>Abc</div>
                        </div>
                        <div className="text-left">
                          <div className={`text-[11px] font-black uppercase tracking-widest ${theme === tOption.id ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            {tOption.label}
                          </div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                            {tOption.id === 'cyberpunk' ? 'High Contrast Tech' : 'Standard Interface'}
                          </div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-4 transition-all ${
                        theme === tOption.id ? 'border-indigo-600 bg-indigo-600 scale-110' : 'border-slate-300 dark:border-white/10 translate-x-0'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-white/10 shadow-xl space-y-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{t('System Dynamics', 'System Dynamics')}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border-2 border-slate-200 dark:border-white/5 group hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl transition-colors ${animationsEnabled ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('Animations')}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{t('Motion Dynamics', 'Motion Dynamics')}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setAnimationsEnabled(!animationsEnabled)}
                  className={`w-11 h-6 rounded-full transition-all relative ${animationsEnabled ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-700'}`}
                >
                  <motion.div 
                    animate={{ x: animationsEnabled ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md" 
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border-2 border-slate-200 dark:border-white/5 group hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl transition-colors ${soundEnabled ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t('Sound Effects')}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{t('Audio Feedback', 'Audio Feedback')}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-11 h-6 rounded-full transition-all relative ${soundEnabled ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-700'}`}
                >
                  <motion.div 
                    animate={{ x: soundEnabled ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md" 
                  />
                </button>
              </div>
            </div>

            <div className="p-6 bg-indigo-600 rounded-[2rem] text-white relative overflow-hidden group shadow-xl">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-3">
                   <Lock className="w-4 h-4 text-indigo-200" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200">{t('Security Layer', 'Security Layer')}</span>
                 </div>
                 <h4 className="text-xl font-black uppercase italic tracking-tighter mb-1">{t('Encrypted Core', 'Encrypted Core')}</h4>
                 <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest leading-relaxed">
                   {t('AI Studio Distributed Network • End-to-End Scientific Privacy', 'AI Studio Distributed Network • End-to-End Scientific Privacy')}
                 </p>
               </div>
            </div>
          </section>

          <section className="bg-slate-950 border border-white/5 rounded-[2.5rem] p-10 space-y-8">
             <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('Node Information', 'Node Information')}</span>
             </div>
             <div className="space-y-5">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-3">
                   <span className="text-slate-500">{t('Host Version', 'Host Version')}</span>
                   <span className="text-slate-300">v2.5.0-PRO</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest border-b border-white/5 pb-3">
                   <span className="text-slate-500">{t('Database Engine', 'Database Engine')}</span>
                   <span className="text-slate-300 font-mono">FIRESTORE-E2</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                   <span className="text-slate-500">{t('AI Model', 'AI Model')}</span>
                   <span className="text-indigo-400">GEMINI-3-FLASH</span>
                </div>
             </div>
          </section>
        </div>
      </div>

      <div className="pt-16 pb-8 text-center border-t border-slate-200 dark:border-white/5">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] max-w-lg mx-auto leading-relaxed">
          {t('All configuration changes are applied in real-time. persistence is managed via the secure cloud synchronization protocol.', 'All configuration changes are applied in real-time. persistence is managed via the secure cloud synchronization protocol.')}
        </p>
      </div>
    </motion.div>
  );
};
