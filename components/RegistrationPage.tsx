import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Building, ArrowRight, FlaskConical, Globe, ShieldCheck, ChevronDown, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LanguageSelector from './LanguageSelector';

interface RegistrationPageProps {
  onRegister: () => void;
  onBack?: () => void;
  initialMode?: 'register' | 'login';
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
  { name: 'Welsh', code: 'GB_WLS', langCode: 'cy', langName: 'Cymraeg (CY)', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { name: 'Frisian (Netherlands)', code: 'NL_FR', langCode: 'fy', langName: 'Frysk (FY)', flag: '🇳🇱' },
  { name: 'Breton (France)', code: 'FR_BR', langCode: 'br', langName: 'Brezhoneg (BR)', flag: '🇫🇷' },
  { name: 'Tatar (Tatarstan)', code: 'RU_TT', langCode: 'tt', langName: 'Татарча (TT)', flag: '🇷🇺' },
  { name: 'Uyghur (Xinjiang)', code: 'CN_UG', langCode: 'ug', langName: 'ئۇيغۇرچە (UG)', flag: '🇨🇳' },
  { name: 'Faroese (Faroe Islands)', code: 'FO', langCode: 'fo', langName: 'Føroyskt (FO)', flag: '🇫🇴' },
  { name: 'Greenlandic (Greenland)', code: 'GL_KL', langCode: 'kl', langName: 'Kalaallisut (KL)', flag: '🇬🇱' },
  { name: 'Quechua (Peru/Andes)', code: 'PE_QU', langCode: 'qu', langName: 'Runasimi (QU)', flag: '🇵🇪' },
  { name: 'Guarani (Paraguay)', code: 'PY_GN', langCode: 'gn', langName: 'Avañe\'ẽ (GN)', flag: '🇵🇾' },
  { name: 'Fijian (Fiji)', code: 'FJ_FJ', langCode: 'fj', langName: 'Na Vosa Vakaviti (FJ)', flag: '🇫🇯' },
  { name: 'Samoan (Samoa)', code: 'WS_SM', langCode: 'sm', langName: 'Gagana Samoa (SM)', flag: '🇼🇸' },
  { name: 'Inuktitut (Inuit/Canada)', code: 'CA_IU', langCode: 'iu', langName: 'ᐃᓄᒃᑎᑐᑦ (IU)', flag: '🇨🇦' }
];

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onRegister, onBack, initialMode = 'register' }) => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [nationality, setNationality] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [isNationDropdownOpen, setIsNationDropdownOpen] = useState(false);
  const [nationSearch, setNationSearch] = useState('');
  const [selectedNation, setSelectedNation] = useState<Nationality | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    try {
      const { signIn } = await import('../services/firebase');
      await signIn();
      // Wait a moment for auth state to propagate to App.tsx
      setTimeout(() => {
         onRegister();
      }, 100);
    } catch (err: any) {
      console.error(err);
      setErrors({ form: err.message || 'Authentication failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (mode === 'register') {
      if (!name.trim()) newErrors.name = 'Name is required';
      if (!organization.trim()) newErrors.organization = 'Organization is required';
      if (!nationality.trim()) newErrors.nationality = 'Citizenship / Nationality is required';
    }
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      let userData;
      if (mode === 'login') {
        const saved = localStorage.getItem('xrd_user_registration');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.email?.toLowerCase() === email.toLowerCase()) {
              userData = parsed;
            }
          } catch (err) {}
        }
        
        if (!userData) {
          const defaultName = email.split('@')[0]
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
          userData = {
            name: 'Dr. ' + defaultName,
            email: email,
            organization: 'Quantum Crystallography Labs',
            nationality: 'American',
            registeredAt: new Date().toISOString()
          };
        }
      } else {
        userData = { name, email, organization, nationality, registeredAt: new Date().toISOString() };
      }
      localStorage.setItem('xrd_user_registration', JSON.stringify(userData));
      onRegister();
    }
  };

  const filteredNationalities = NATIONALITIES.filter(n =>
    n.name.toLowerCase().includes(nationSearch.toLowerCase())
  );

  const recommendation = selectedNation && selectedNation.langCode !== i18n.language ? selectedNation : null;

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-start md:justify-center py-12 md:py-20 px-4 sm:px-6 relative overflow-y-auto overflow-x-hidden selection:bg-indigo-500/30 custom-scrollbar">
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
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 font-bold uppercase tracking-wider text-xs mb-6 group transition-colors cursor-pointer bg-slate-900/40 px-4 py-2 rounded-xl border border-white/5 hover:border-cyan-500/20 shadow-md"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-1 transition-transform" />
            {t('Back to Welcome')}
          </button>
        )}
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-[2.5rem] shadow-[0_0_60px_rgba(79,70,229,0.5)] mb-8 text-5xl font-black text-white relative group"
          >
            <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">λ</span>
            <FlaskConical className="absolute -bottom-2 -right-2 w-10 h-10 text-cyan-400 bg-[#0B1221] rounded-full p-2 border border-cyan-500/40 shadow-lg" />
          </motion.div>
          
          <div className="flex flex-col mb-4">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold text-cyan-400 uppercase tracking-[0.2em] mb-2 flex justify-center items-center gap-3 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]"
            >
              <span className="w-12 h-px bg-cyan-400/50 hidden sm:block"></span>
               Welcome To
              <span className="w-12 h-px bg-cyan-400/50 hidden sm:block"></span>
            </motion.h1>
            <h2 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none flex justify-center items-baseline gap-1 relative z-10">
              XRD-Calc<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]">Pro</span>
            </h2>
            <span className="text-[11px] font-mono font-black uppercase tracking-[0.4em] text-slate-400 mt-4 flex justify-center items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              Advanced {t('Computational Suite')}
            </span>
          </div>
          <p className="text-lg text-slate-400 font-medium tracking-tight">
            Confirm your researcher identity to begin.
          </p>
        </div>

        <div className="bg-[#0B1221]/60 backdrop-blur-3xl border border-white/20 rounded-[3rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 via-violet-500 to-indigo-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
          
          {/* Tab Switcher */}
          <div className="flex gap-2 p-1.5 bg-slate-950/80 border border-white/5 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrors({});
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-violet-650 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Join Lab (Register)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrors({});
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-violet-650 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Sign In / Log In
            </button>
          </div>

          {/* Fast-Track Guest Access Banner */}
          {mode === 'register' ? (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-lg" />
              <p className="text-xs text-slate-300 font-bold mb-2">
                ⚡ Short on time? Launch instantly!
              </p>
              <button
                type="button"
                onClick={() => {
                  const guestUser = {
                    name: "Amelia Vance (Guest Scientist)",
                    email: "amelia.vance@quantumlab.org",
                    organization: "Global Materials Institute",
                    nationality: "American"
                  };
                  setName(guestUser.name);
                  setEmail(guestUser.email);
                  setOrganization(guestUser.organization);
                  setNationality(guestUser.nationality);
                  setSelectedNation({ name: 'American', code: 'US', langCode: 'en', langName: 'English (US)', flag: '🇺🇸' });
                  
                  // Automatically register after a subtle feedback delay
                  setTimeout(() => {
                    localStorage.setItem('xrd_user_registration', JSON.stringify({
                      ...guestUser,
                      registeredAt: new Date().toISOString()
                    }));
                    onRegister();
                  }, 400);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-[10px] py-2.5 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                One-Click Guest Researcher Access
              </button>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-cyan-550/10 rounded-full blur-lg" />
              <p className="text-xs text-slate-300 font-bold mb-1">
                🔐 Authorized Researcher Node
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Enter your registered email to re-authenticate session
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mode === 'register' ? (
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
                      className={`w-full pl-11 pr-4 py-4 bg-slate-900/60 border ${errors.name ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-cyan-400 focus:bg-slate-900/80'} rounded-2xl text-white placeholder-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] font-medium`}
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
              ) : null}

              <div className={`space-y-2 ${mode === 'login' ? 'col-span-full' : ''}`}>
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
                    className={`w-full pl-11 pr-4 py-4 bg-slate-900/60 border ${errors.email ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-cyan-400 focus:bg-slate-900/80'} rounded-2xl text-white placeholder-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] font-medium`}
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

            {mode === 'register' ? (
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
                      className={`w-full pl-11 pr-4 py-4 bg-slate-900/60 border ${errors.organization ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-violet-400 focus:bg-slate-900/80'} rounded-2xl text-white placeholder-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] font-medium`}
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
                      className={`w-full pl-11 pr-10 py-4 bg-slate-900/60 border ${errors.nationality ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-violet-400 focus:bg-slate-900/80'} rounded-2xl text-white placeholder-slate-400 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] font-medium`}
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
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                  Security Passpoint Key (Optional)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={securityKey}
                    onChange={(e) => setSecurityKey(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 bg-slate-900/60 border border-white/10 focus:border-cyan-400 focus:bg-slate-900/80 rounded-2xl text-white placeholder-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] font-medium"
                    placeholder="••••••••••••"
                  />
                </div>
                <span className="text-[9px] uppercase tracking-wider text-cyan-400/80 ml-1">Optional key. Multi-factor local session persistence is enabled.</span>
              </div>
            )}

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
              disabled={isSubmitting}
              className="w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] italic rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all hover:translate-y-[-2px] active:translate-y-[1px] flex items-center justify-center gap-3 relative group overflow-hidden border border-white/10"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                {isSubmitting ? 'Processing...' : (mode === 'login' ? 'Authorize & Sign In' : t('Complete Registration'))}
              </span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform" />
            </button>
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[#0B1221] text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Or
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleAuth}
              className="w-full py-4 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/10"
            >
              Google Account
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
