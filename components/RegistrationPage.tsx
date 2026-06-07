import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Building, ArrowRight, FlaskConical, Globe, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LanguageSelector from './LanguageSelector';

interface RegistrationPageProps {
  onRegister: () => void;
}

interface Nationality {
  name: string;
  code: string;
  langCode: string;
  langName: string;
  flag: string;
}

const NATIONALITIES: Nationality[] = [
  { name: 'American', code: 'US', langCode: 'en', langName: 'English (US)', flag: '🇺🇸' },
  { name: 'Afghani', code: 'AF', langCode: 'fa', langName: 'Farsi (فارسی)', flag: '🇦🇫' },
  { name: 'Algerian', code: 'DZ', langCode: 'ar', langName: 'Arabic (العربية)', flag: '🇩🇿' },
  { name: 'Argentinian', code: 'AR', langCode: 'es', langName: 'Español (ES)', flag: '🇦🇷' },
  { name: 'Australian', code: 'AU', langCode: 'en', langName: 'English (US)', flag: '🇦🇺' },
  { name: 'Austrian', code: 'AT', langCode: 'de', langName: 'Deutsch (DE)', flag: '🇦🇹' },
  { name: 'Bangladeshi', code: 'BD', langCode: 'bn', langName: 'Bengali (বাংলা)', flag: '🇧🇩' },
  { name: 'Basque', code: 'EU_ES', langCode: 'eu', langName: 'Euskara (EU)', flag: '🏴' },
  { name: 'Belgian', code: 'BE', langCode: 'nl', langName: 'Nederlands (NL)', flag: '🇧🇪' },
  { name: 'Brazilian', code: 'BR', langCode: 'pt', langName: 'Português (PT)', flag: '🇧🇷' },
  { name: 'British', code: 'GB', langCode: 'en', langName: 'English (US)', flag: '🇬🇧' },
  { name: 'Bulgarian', code: 'BG', langCode: 'bg', langName: 'Български (BG)', flag: '🇧🇬' },
  { name: 'Canadian', code: 'CA', langCode: 'en', langName: 'English (US)', flag: '🇨🇦' },
  { name: 'Catalan', code: 'CAT', langCode: 'ca', langName: 'Català (CA)', flag: '🇪🇸' },
  { name: 'Chinese', code: 'CN', langCode: 'zh', langName: '简体中文 (ZH)', flag: '🇨🇳' },
  { name: 'Colombian', code: 'CO', langCode: 'es', langName: 'Español (ES)', flag: '🇨🇴' },
  { name: 'Croatian', code: 'HR', langCode: 'hr', langName: 'Hrvatski (HR)', flag: '🇭🇷' },
  { name: 'Cypriot', code: 'CY', langCode: 'el', langName: 'Ελληνικά (EL)', flag: '🇨🇾' },
  { name: 'Czech', code: 'CZ', langCode: 'cs', langName: 'Čeština (CS)', flag: '🇨🇿' },
  { name: 'Danish', code: 'DK', langCode: 'da', langName: 'Dansk (DA)', flag: '🇩🇰' },
  { name: 'Dutch', code: 'NL', langCode: 'nl', langName: 'Nederlands (NL)', flag: '🇳🇱' },
  { name: 'Egyptian', code: 'EG', langCode: 'ar', langName: 'Arabic (العربية)', flag: '🇪🇬' },
  { name: 'Emirati', code: 'AE', langCode: 'ar', langName: 'Arabic (العربية)', flag: '🇦🇪' },
  { name: 'Esperantist', code: 'EO_GL', langCode: 'eo', langName: 'Esperanto (EO)', flag: '🟢' },
  { name: 'Finnish', code: 'FI', langCode: 'fi', langName: 'Suomi (FI)', flag: '🇫🇮' },
  { name: 'French', code: 'FR', langCode: 'fr', langName: 'Français (FR)', flag: '🇫🇷' },
  { name: 'German', code: 'DE', langCode: 'de', langName: 'Deutsch (DE)', flag: '🇩🇪' },
  { name: 'Greek', code: 'GR', langCode: 'el', langName: 'Ελληνικά (EL)', flag: '🇬🇷' },
  { name: 'Hebrew / Israeli', code: 'IL', langCode: 'he', langName: 'עברית (HE)', flag: '🇮🇱' },
  { name: 'Hungarian', code: 'HU', langCode: 'hu', langName: 'Magyar (HU)', flag: '🇭🇺' },
  { name: 'Indian (Hindi)', code: 'IN_HI', langCode: 'hi', langName: 'हिन्दी (HI)', flag: '🇮🇳' },
  { name: 'Indian (Bengali)', code: 'IN_BN', langCode: 'bn', langName: 'বাংলা (BN)', flag: '🇮🇳' },
  { name: 'Indonesian', code: 'ID', langCode: 'id', langName: 'Bahasa Indonesia (ID)', flag: '🇮🇩' },
  { name: 'Iranian', code: 'IR', langCode: 'fa', langName: 'Farsi (FA)', flag: '🇮🇷' },
  { name: 'Irish', code: 'IE', langCode: 'ga', langName: 'Gaeilge (GA)', flag: '🇮🇪' },
  { name: 'Icelandic', code: 'IS', langCode: 'is', langName: 'Íslenska (IS)', flag: '🇮🇸' },
  { name: 'Italian', code: 'IT', langCode: 'it', langName: 'Italiano (IT)', flag: '🇮🇹' },
  { name: 'Japanese', code: 'JP', langCode: 'ja', langName: '日本語 (JA)', flag: '🇯🇵' },
  { name: 'Korean', code: 'KR', langCode: 'ko', langName: '한국어 (KO)', flag: '🇰🇷' },
  { name: 'Malaysian', code: 'MY', langCode: 'ms', langName: 'Bahasa Melayu (MS)', flag: '🇲🇾' },
  { name: 'Maltese', code: 'MT', langCode: 'mt', langName: 'Malti (MT)', flag: '🇲🇹' },
  { name: 'Mexican', code: 'MX', langCode: 'es', langName: 'Español (ES)', flag: '🇲🇽' },
  { name: 'New Zealander', code: 'NZ', langCode: 'en', langName: 'English (US)', flag: '🇳🇿' },
  { name: 'Norwegian', code: 'NO', langCode: 'no', langName: 'Norsk (NO)', flag: '🇳🇴' },
  { name: 'Polish', code: 'PL', langCode: 'pl', langName: 'Polski (PL)', flag: '🇵🇱' },
  { name: 'Portuguese', code: 'PT', langCode: 'pt', langName: 'Português (PT)', flag: '🇵🇹' },
  { name: 'Romanian', code: 'RO', langCode: 'ro', langName: 'Română (RO)', flag: '🇷🇴' },
  { name: 'Russian', code: 'RU', langCode: 'ru', langName: 'Русский (RU)', flag: '🇷🇺' },
  { name: 'Saudi Arabian', code: 'SA', langCode: 'ar', langName: 'Arabic (العربية)', flag: '🇸🇦' },
  { name: 'Scottish', code: 'GB_SCT', langCode: 'gd', langName: 'Gàidhlig (GD)', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { name: 'Serbian', code: 'RS', langCode: 'sr', langName: 'Српски (SR)', flag: '🇷🇸' },
  { name: 'Slovak', code: 'SK', langCode: 'sk', langName: 'Slovenčina (SK)', flag: '🇸🇰' },
  { name: 'Slovenian', code: 'SI', langCode: 'sl', langName: 'Slovenščina (SL)', flag: '🇸🇮' },
  { name: 'Spanish', code: 'ES', langCode: 'es', langName: 'Español (ES)', flag: '🇪🇸' },
  { name: 'Swedish', code: 'SE', langCode: 'sv', langName: 'Svenska (SV)', flag: '🇸🇪' },
  { name: 'Swiss', code: 'CH', langCode: 'de', langName: 'Deutsch (DE)', flag: '🇨🇭' },
  { name: 'Taiwanese', code: 'TW', langCode: 'zh', langName: '简体中文 (ZH)', flag: '🇹🇼' },
  { name: 'Thai', code: 'TH', langCode: 'th', langName: 'ไทย (TH)', flag: '🇹🇭' },
  { name: 'Turkish', code: 'TR', langCode: 'tr', langName: 'Türkçe (TR)', flag: '🇹🇷' },
  { name: 'Ukrainian', code: 'UA', langCode: 'uk', langName: 'Українська (UK)', flag: '🇺🇦' },
  { name: 'Vatican / Latin Scholar', code: 'VA', langCode: 'la', langName: 'Latina (LA)', flag: '🏛️' },
  { name: 'Vietnamese', code: 'VN', langCode: 'vi', langName: 'Tiếng Việt (VI)', flag: '🇻🇳' },
  { name: 'Welsh', code: 'GB_WLS', langCode: 'cy', langName: 'Cymraeg (CY)', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' }
];

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onRegister }) => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [nationality, setNationality] = useState('');
  const [isNationDropdownOpen, setIsNationDropdownOpen] = useState(false);
  const [nationSearch, setNationSearch] = useState('');
  const [selectedNation, setSelectedNation] = useState<Nationality | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const nationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (nationRef.current && !nationRef.current.contains(event.target as Node)) {
        setIsNationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!organization.trim()) newErrors.organization = 'Organization is required';
    if (!nationality.trim()) newErrors.nationality = 'Citizenship / Nationality is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const userData = { name, email, organization, nationality, registeredAt: new Date().toISOString() };
      localStorage.setItem('xrd_user_registration', JSON.stringify(userData));
      onRegister();
    }
  };

  const filteredNationalities = NATIONALITIES.filter(n =>
    n.name.toLowerCase().includes(nationSearch.toLowerCase())
  );

  const recommendation = selectedNation && selectedNation.langCode !== i18n.language ? selectedNation : null;

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#4f46e510,transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Floating elements */}
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[15%] w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" 
        />
      </div>

      {/* Language Toggle */}
      <div className="absolute top-8 right-8 z-55">
        <LanguageSelector compact={true} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-[0_0_40px_rgba(79,70,229,0.4)] mb-8 text-4xl font-black text-white relative group"
          >
            <div className="absolute inset-0 bg-white/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="italic tracking-tighter">λ</span>
            <FlaskConical className="absolute -bottom-2 -right-2 w-8 h-8 text-indigo-400 bg-slate-950 rounded-full p-1.5 border border-indigo-500/30" />
          </motion.div>
          
          <div className="flex flex-col mb-4">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none flex justify-center items-baseline gap-1">
              XRD-Calc<span className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]">Pro</span>
            </h1>
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-slate-400 mt-3 flex justify-center items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Advanced {t('Computational Suite')}
            </span>
          </div>
          <p className="text-lg text-slate-400 font-medium tracking-tight">
            {t('Register description')}
          </p>
        </div>

        <div className="bg-[#0B1221]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  {t('Full Name')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-11 pr-4 py-4 bg-slate-950/50 border ${errors.name ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'} rounded-2xl text-white placeholder-slate-700 outline-none transition-all focus:ring-1 focus:ring-indigo-500/30 font-medium`}
                    placeholder="Dr. Jane Doe"
                  />
                </div>
                <AnimatePresence>
                  {errors.name && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-[10px] font-bold uppercase tracking-wider ml-1"
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  {t('Email Address')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-11 pr-4 py-4 bg-slate-950/50 border ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'} rounded-2xl text-white placeholder-slate-700 outline-none transition-all focus:ring-1 focus:ring-indigo-500/30 font-medium`}
                    placeholder="jane.doe@university.edu"
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-[10px] font-bold uppercase tracking-wider ml-1"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  {t('Organization')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className={`w-full pl-11 pr-4 py-4 bg-slate-950/50 border ${errors.organization ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'} rounded-2xl text-white placeholder-slate-700 outline-none transition-all focus:ring-1 focus:ring-indigo-500/30 font-medium`}
                    placeholder="MIT, Stanford, CERN, etc."
                  />
                </div>
                <AnimatePresence>
                  {errors.organization && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-[10px] font-bold uppercase tracking-wider ml-1"
                    >
                      {errors.organization}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div ref={nationRef} className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  {t('Citizenship / Nationality')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                    {selectedNation ? (
                      <span className="text-base filter drop-shadow-sm select-none">{selectedNation.flag}</span>
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={isNationDropdownOpen ? nationSearch : (selectedNation ? selectedNation.name : nationality)}
                    onFocus={() => {
                      setIsNationDropdownOpen(true);
                      setNationSearch('');
                    }}
                    onChange={(e) => {
                      setNationSearch(e.target.value);
                      setNationality(e.target.value);
                      const match = NATIONALITIES.find(n => n.name.toLowerCase() === e.target.value.toLowerCase());
                      if (match) {
                        setSelectedNation(match);
                      } else {
                        setSelectedNation(null);
                      }
                    }}
                    className={`w-full pl-11 pr-10 py-4 bg-slate-950/50 border ${errors.nationality ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'} rounded-2xl text-white placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-indigo-500/30 font-medium`}
                    placeholder="Select nationality..."
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-500 hover:text-white" onClick={() => setIsNationDropdownOpen(!isNationDropdownOpen)}>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isNationDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                
                <AnimatePresence>
                  {errors.nationality && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-[10px] font-bold uppercase tracking-wider ml-1"
                    >
                      {errors.nationality}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Dropdown list */}
                <AnimatePresence>
                  {isNationDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 left-0 right-0 mt-2 max-h-[180px] overflow-y-auto bg-slate-950 border border-white/15 rounded-2xl shadow-2xl p-2 space-y-0.5 custom-scrollbar"
                    >
                      {filteredNationalities.length > 0 ? (
                        filteredNationalities.map((nation) => (
                          <button
                            key={nation.code}
                            type="button"
                            onClick={() => {
                              setSelectedNation(nation);
                              setNationality(nation.name);
                              setIsNationDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-150"
                          >
                            <span className="text-lg filter drop-shadow-sm select-none">{nation.flag}</span>
                            <span className="font-extrabold tracking-tight truncate">{nation.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-500 uppercase tracking-widest font-black">
                          No Matches
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Language Recommendation System */}
            <AnimatePresence>
              {recommendation && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                    <p className="text-xs text-slate-300 font-medium leading-relaxed truncate">
                      Recommend language: <span className="text-white font-extrabold">{recommendation.langName}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => i18n.changeLanguage(recommendation.langCode)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0 shadow-lg shadow-indigo-600/20"
                  >
                    Switch Now
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] italic rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:translate-y-[-2px] active:translate-y-[1px] flex items-center justify-center gap-3 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10">{t('Complete Registration')}</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
             <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Secure Protocol</span>
             </div>
             <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Global Sync</span>
             </div>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-8 max-w-sm mx-auto leading-relaxed">
          {t('Agreement')}
        </p>
      </motion.div>
    </div>
  );
};
