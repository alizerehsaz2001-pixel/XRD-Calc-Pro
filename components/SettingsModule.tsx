import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Hash, Palette, Sparkles, Volume2, Settings } from 'lucide-react';
import { motion } from 'motion/react';

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">{t('Settings')}</h2>
          <p className="text-slate-500 font-medium">Configure your laboratory environment behavior and appearance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Localization & Precision */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-xl space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                <Languages className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t('Appearance')} & {t('Language')}</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t('Language')}</label>
              <select 
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
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
                <option value="ms">Bahasa Melayu (MS)</option>
                <option value="tl">Tagalog (TL)</option>
                <option value="cs">Čeština (CS)</option>
                <option value="sk">Slovenčina (SK)</option>
                <option value="ro">Română (RO)</option>
                <option value="hr">Hrvatski (HR)</option>
                <option value="sr">Српски (SR)</option>
                <option value="sl">Slovenščina (SL)</option>
                <option value="ca">Català (CA)</option>
                <option value="bg">Български (BG)</option>
                <option value="el">Ελληνικά (EL)</option>
                <option value="ru">Русский (RU)</option>
                <option value="uk">Українська (UK)</option>
                <option value="tr">Türkçe (TR)</option>
                <option value="vi">Tiếng Việt (VI)</option>
                <option value="id">Bahasa Indonesia (ID)</option>
                <option value="ja">日本語 (JA)</option>
                <option value="zh">简体中文 (ZH)</option>
                <option value="ko">한국어 (KO)</option>
                <option value="hi">हिन्दी (HI)</option>
                <option value="bn">বাংলা (BN)</option>
                <option value="fa">فارסי (FA)</option>
                <option value="ar">العربية (AR)</option>
                <option value="he">עברית (HE)</option>
                <option value="sv">Svenska (SV)</option>
                <option value="da">Dansk (DA)</option>
                <option value="no">Norsk (NO)</option>
                <option value="fi">Suomi (FI)</option>
                <option value="th">ไทย (TH)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t('Theme')}</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'light', label: 'Light Lux' },
                  { id: 'dark', label: 'Dark Matter' },
                  { id: 'cyberpunk', label: 'Cyber Net' },
                  { id: 'terminal', label: 'Mainframe' },
                  { id: 'synthwave', label: 'Neon City' }
                ].map((tOption) => (
                  <button
                    key={tOption.id}
                    onClick={() => setTheme(tOption.id as any)}
                    className={`p-3 rounded-xl border text-[11px] font-bold transition-all ${
                      theme === tOption.id
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                    }`}
                  >
                    {tOption.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System & Precision */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-xl space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                <Hash className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">{t('System')} & {t('Precision')}</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{t('Precision')}</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 2, label: '2.00 (Std)' },
                  { val: 4, label: '4.0000 (High)' },
                  { val: 6, label: '6.000000 (Analyt)' },
                  { val: 8, label: '8.00000000 (Sci)' }
                ].map((pOption) => (
                  <button
                    key={pOption.val}
                    onClick={() => setPrecision(pOption.val)}
                    className={`p-3 rounded-xl border text-[11px] font-bold transition-all ${
                      precision === pOption.val
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                    }`}
                  >
                    {pOption.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Animations')}</span>
                </div>
                <button 
                  onClick={() => setAnimationsEnabled(!animationsEnabled)}
                  className={`w-12 h-6 rounded-full transition-all relative ${animationsEnabled ? 'bg-indigo-600' : 'bg-slate-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${animationsEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Sound Effects')}</span>
                </div>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-12 h-6 rounded-full transition-all relative ${soundEnabled ? 'bg-indigo-600' : 'bg-slate-400'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-white/5 text-center">
        <p className="text-slate-400 text-xs font-medium">
          Lab Configuration v2.5.0 • All changes are synchronized with your local laboratory environment.
        </p>
      </div>
    </motion.div>
  );
};
