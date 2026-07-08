import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Mail, 
  Building, 
  ArrowRight, 
  FlaskConical, 
  Globe, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  CheckCircle2, 
  Briefcase, 
  Atom, 
  Database, 
  Terminal, 
  Loader2, 
  Check 
} from 'lucide-react';
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

const RESEARCH_ROLES = [
  { value: 'Lead Investigator', label: 'Lead Investigator / Director', classification: 'L-5 Senior Director' },
  { value: 'Senior Scientist', label: 'Senior Scientist', classification: 'L-4 Senior Scientist' },
  { value: 'Postdoctoral Researcher', label: 'Postdoctoral Researcher', classification: 'L-4 Postdoc Scientist' },
  { value: 'PhD Candidate', label: 'PhD Candidate', classification: 'L-3 Doctoral Fellow' },
  { value: 'Crystallography Specialist', label: 'Crystallography Specialist', classification: 'L-4 Senior Analyst' },
  { value: 'Materials Engineer', label: 'Materials Engineer', classification: 'L-4 Research Engineer' },
  { value: 'Undergraduate Scholar', label: 'Undergraduate Scholar', classification: 'L-2 Junior Scholar' },
  { value: 'Guest Academic', label: 'Guest Academic / Professor', classification: 'L-3 Guest Researcher' }
];

const RESEARCH_FIELDS = [
  { value: 'Condensed Matter Physics', label: 'Condensed Matter Physics' },
  { value: 'Solid-State Chemistry', label: 'Solid-State Chemistry' },
  { value: 'Metallurgy & Alloys', label: 'Metallurgy & Alloys' },
  { value: 'Nanomaterials & Quantum Dots', label: 'Nanomaterials & Quantum Dots' },
  { value: 'Pharmaceutical Crystallography', label: 'Pharmaceutical Crystallography' },
  { value: 'Superconductors & Thin Films', label: 'Superconductors & Thin Films' },
  { value: 'Polymer Structure & Biomaterials', label: 'Polymer & Biomaterials' }
];

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onRegister, onBack, initialMode = 'register' }) => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  
  // Core Registration States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [nationality, setNationality] = useState('');
  const [researchRole, setResearchRole] = useState(RESEARCH_ROLES[3].value); // PhD Candidate default
  const [researchField, setResearchField] = useState(RESEARCH_FIELDS[0].value); // Condensed Matter default
  const [securityKey, setSecurityKey] = useState('');
  
  // Select states
  const [isNationDropdownOpen, setIsNationDropdownOpen] = useState(false);
  const [nationSearch, setNationSearch] = useState('');
  const [selectedNation, setSelectedNation] = useState<Nationality | null>(null);
  
  // Custom interactive loaders & errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simSteps, setSimSteps] = useState<string[]>([]);
  const [activeSimIndex, setActiveSimIndex] = useState(-1);
  const [simComplete, setSimComplete] = useState(false);
  const [simulatingTitle, setSimulatingTitle] = useState('');

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
    setSimComplete(false);
    setSimulatingTitle('CLOUD GATEWAY SYNCHRONIZATION');
    
    setSimSteps([
      'CONNECTING TO GOOGLE AUTH SECURE TOKENS...',
      'ACQUIRING CRYPTOGRAPHIC ACCOUNT SIGNATURES...',
      'UPSERTING SECURE CREDENTIALS INTO CLOUD FIRESTORE...',
      'CONSTRUCTING INTEGRATED LAB DOSSIER METADATA...',
      'SYNCHRONIZING RECENT MATERIALS DATABASE INDEXES...',
      'SECURE HANDSHAKE SUCCESSFUL. NODE REGISTERED!'
    ]);
    setActiveSimIndex(0);

    try {
      const { signIn } = await import('../services/firebase');
      await signIn();
      
      // Keep running the simulation steps beautifully
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step < 6) {
          setActiveSimIndex(step);
        } else {
          clearInterval(interval);
          setSimComplete(true);
          setTimeout(() => {
            setIsSubmitting(false);
            onRegister();
          }, 800);
        }
      }, 400);

    } catch (err: any) {
      console.error(err);
      setErrors({ form: err.message || 'Authentication failed' });
      setIsSubmitting(false);
      setActiveSimIndex(-1);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (mode === 'register') {
      if (!name.trim()) newErrors.name = 'Full Name is required';
      if (!organization.trim()) newErrors.organization = 'Academic Organization is required';
      if (!nationality.trim()) newErrors.nationality = 'Citizenship / Nationality is required';
    }
    if (!email.trim()) newErrors.email = 'Email Address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email address format is invalid';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createPersonalizedProfile = (userName: string, userEmail: string, userOrg: string, userNation: string, userRole: string, userField: string) => {
    const nameParts = userName.trim().split(/\s+/);
    const first = nameParts[0] || 'Crystallographer';
    const last = nameParts.slice(1).join(' ') || 'Node';
    const selectedRoleObj = RESEARCH_ROLES.find(r => r.value === userRole) || RESEARCH_ROLES[3];
    const initialReference = `${first[0]?.toUpperCase() || 'X'}${last[0]?.toUpperCase() || 'R'}-${new Date().getFullYear()}-CORE`;

    const dynamicProfile = {
      firstName: first,
      lastName: last,
      title: `${selectedRoleObj.label} in ${userField}`,
      subDescription: `Leading specialized material characterization in ${userField} within ${userOrg}.`,
      classification: selectedRoleObj.classification,
      idReference: initialReference,
      status: 'Active',
      mission: `To systematically resolve structural Overlapping peaks and lattice microstrains, empowering ${userOrg} with high-fidelity scientific discoveries in ${userField}.`,
      skills: [
        { name: 'Diffraction Physics', level: 85 + Math.floor(Math.random() * 11) },
        { name: 'Symmetry Logic', level: 80 + Math.floor(Math.random() * 15) },
        { name: 'Phase Identification', level: 75 + Math.floor(Math.random() * 20) },
        { name: 'Spectrum Deconvolution', level: 70 + Math.floor(Math.random() * 20) },
        { name: 'Lattice Topology', level: 65 + Math.floor(Math.random() * 25) },
        { name: 'Atomic Peak Refining', level: 90 + Math.floor(Math.random() * 9) }
      ],
      research: [
        { title: `Project ${userField.toUpperCase().split(' ')[0] || 'CRYSTAL'}`, status: 'In Optimization', progress: 45, color: 'indigo' },
        { title: `Structural Characterization at ${userOrg}`, status: 'In Progress', progress: 28, color: 'emerald' }
      ],
      links: [
        { label: 'Authorized Node', val: userEmail, icon: 'Mail', url: `mailto:${userEmail}` },
        { label: 'Academic Network', val: userName.toLowerCase().replace(/\s+/g, '-'), icon: 'Linkedin', url: 'https://linkedin.com' },
        { label: 'Research Repositories', val: first.toLowerCase() + '-lab', icon: 'Github', url: 'https://github.com' }
      ],
      publications: [
        { title: `High-resolution powder diffraction profile of ${userField} lattices`, journal: 'Journal of Applied Crystallography', date: '2026' }
      ],
      archive: [
        { year: '2026', title: 'Authorized Node Provisioning', desc: `Successfully completed onboarding of researcher node for ${userOrg} with classification ${selectedRoleObj.classification}.` }
      ],
      stats: {
        hIndex: 1 + Math.floor(Math.random() * 6),
        citations: 15 + Math.floor(Math.random() * 120),
        peerReviews: 2 + Math.floor(Math.random() * 10),
        scansAnalyzed: 8 + Math.floor(Math.random() * 40)
      }
    };

    localStorage.setItem('lab_director_profile_payload', JSON.stringify(dynamicProfile));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setSimComplete(false);
      setSimulatingTitle('SECURE RESEARCHER PROVISIONING');
      
      setSimSteps([
        'VERIFYING ACADEMIC SECURITY PROTOCOLS...',
        'INITIALIZING INDEXED DATABASES & LOCAL SANDBOX...',
        'COMPILING CRYPTOGRAPHIC RSA-256 SIGNATURE KEY...',
        'SYNCING SYSTEMATIC ABSENCES & CORRELATION MAPS...',
        'RESOLVING MULTI-PEAK SPACING CALIBRATION MATRIX...',
        'PROVISION COMPLETE! LAB ACCREDITATION GRANTED.'
      ]);
      setActiveSimIndex(0);

      let userData: any;
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
            researchRole: 'Crystallography Specialist',
            researchField: 'Condensed Matter Physics',
            registeredAt: new Date().toISOString()
          };
        }
      } else {
        userData = { 
          name, 
          email, 
          organization, 
          nationality, 
          researchRole, 
          researchField, 
          registeredAt: new Date().toISOString() 
        };
      }

      // Automatically run simulation steps before registering
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step < 6) {
          setActiveSimIndex(step);
        } else {
          clearInterval(interval);
          setSimComplete(true);
          
          // Save parameters to localStorage
          localStorage.setItem('xrd_user_registration', JSON.stringify(userData));
          createPersonalizedProfile(
            userData.name, 
            userData.email, 
            userData.organization, 
            userData.nationality, 
            userData.researchRole || researchRole, 
            userData.researchField || researchField
          );

          setTimeout(() => {
            setIsSubmitting(false);
            onRegister();
          }, 800);
        }
      }, 350);
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
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#4f46e512,transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
        
        {/* Lattice Grid overlay */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Floating Glowing Orbs */}
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[15%] w-64 h-64 bg-indigo-600/15 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]" 
        />
      </div>

      {/* Language Toggle */}
      <div className="absolute top-8 right-8 z-50">
        <LanguageSelector compact={true} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 font-extrabold uppercase tracking-wider text-[10px] mb-6 group transition-colors cursor-pointer bg-slate-900/60 px-4 py-2.5 rounded-xl border border-white/5 hover:border-cyan-500/20 shadow-md backdrop-blur-md"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-1 transition-transform text-cyan-400" />
            {t('Back to Welcome')}
          </button>
        )}
        
        <div className="text-center mb-8">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-violet-650 to-cyan-500 rounded-[2rem] shadow-[0_0_50px_rgba(139,92,246,0.4)] mb-6 text-4xl font-black text-white relative group"
          >
            <div className="absolute inset-0 bg-white/10 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="italic tracking-tighter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">λ</span>
            <FlaskConical className="absolute -bottom-1.5 -right-1.5 w-8 h-8 text-cyan-300 bg-[#0B1221] rounded-full p-1.5 border border-cyan-500/30 shadow-lg" />
          </motion.div>
          
          <div className="flex flex-col mb-2">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-bold text-cyan-400 uppercase tracking-[0.25em] mb-1.5 flex justify-center items-center gap-3 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              <span className="w-8 h-px bg-cyan-400/30 hidden sm:block"></span>
               Welcome To
              <span className="w-8 h-px bg-cyan-400/30 hidden sm:block"></span>
            </motion.h1>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none flex justify-center items-baseline gap-1 relative z-10">
              XRD-Calc<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]">Pro</span>
            </h2>
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.4em] text-slate-400 mt-3 flex justify-center items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              Advanced {t('Computational Suite')}
            </span>
          </div>
          <p className="text-sm text-slate-400 font-medium tracking-tight">
            Register or authenticate your secure lab credential to enter the computational deck.
          </p>
        </div>

        <div className="bg-[#0B1221]/70 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.85)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 via-violet-500 to-indigo-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
          
          {/* Tab Switcher */}
          <div className="flex gap-2 p-1.5 bg-slate-950/80 border border-white/5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrors({});
              }}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
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
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Sign In / Log In
            </button>
          </div>

          {/* Guest Fast-Track Access */}
          {mode === 'register' ? (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 text-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-lg" />
              <p className="text-xs text-slate-300 font-bold mb-2 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Short on time? Spin up an instant guest node
              </p>
              <button
                type="button"
                onClick={() => {
                  const guestUser = {
                    name: "Amelia Vance (Guest Scientist)",
                    email: "amelia.vance@quantumlab.org",
                    organization: "Global Materials Institute",
                    nationality: "American",
                    researchRole: "Lead Investigator",
                    researchField: "Condensed Matter Physics"
                  };
                  setName(guestUser.name);
                  setEmail(guestUser.email);
                  setOrganization(guestUser.organization);
                  setNationality(guestUser.nationality);
                  setResearchRole(guestUser.researchRole);
                  setResearchField(guestUser.researchField);
                  setSelectedNation({ name: 'American', code: 'US', langCode: 'en', langName: 'English (US)', flag: '🇺🇸' });
                  
                  // Run submission beautifully with delay
                  setIsSubmitting(true);
                  setSimComplete(false);
                  setSimulatingTitle('SPINNING GUEST SANDBOX NODE');
                  setSimSteps([
                    'COMPILING TEMPORARY RESEARCH IDENTITY...',
                    'PROVISIONING SANDBOX STORAGE ALLOCATION...',
                    'ESTABLISHING COLLABORATION CHANNELS...',
                    'LOADING CRYSTALLOGRAPHIC DEFAULTS...',
                    'SUCCESS! GUEST ACCESS PROTOCOL REVENUE GRANTED.'
                  ]);
                  setActiveSimIndex(0);

                  let s = 0;
                  const intv = setInterval(() => {
                    s++;
                    if (s < 5) {
                      setActiveSimIndex(s);
                    } else {
                      clearInterval(intv);
                      setSimComplete(true);
                      
                      localStorage.setItem('xrd_user_registration', JSON.stringify({
                        ...guestUser,
                        registeredAt: new Date().toISOString()
                      }));
                      createPersonalizedProfile(
                        guestUser.name,
                        guestUser.email,
                        guestUser.organization,
                        guestUser.nationality,
                        guestUser.researchRole,
                        guestUser.researchField
                      );

                      setTimeout(() => {
                        setIsSubmitting(false);
                        onRegister();
                      }, 700);
                    }
                  }, 300);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-[10px] py-2.5 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer inline-flex items-center justify-center gap-2 border border-indigo-500/30"
              >
                Launch One-Click Guest Node
              </button>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-cyan-550/10 rounded-full blur-lg" />
              <p className="text-xs text-slate-300 font-bold mb-1">
                🔐 Authorized Researcher Node Login
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                Enter your secure credential key or sign-in with your Google profile
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    Researcher Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550 group-focus-within:text-cyan-400 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      required
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border ${errors.name ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-cyan-400 focus:bg-slate-950/90'} rounded-xl text-white text-xs placeholder-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.1)]`}
                      placeholder="e.g. Dr. Jane Doe"
                    />
                  </div>
                </div>
              )}

              <div className={`space-y-1.5 ${mode === 'login' ? 'col-span-full' : ''}`}>
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Academic Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550 group-focus-within:text-cyan-400 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border ${errors.email ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-cyan-400 focus:bg-slate-950/90'} rounded-xl text-white text-xs placeholder-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.1)]`}
                    placeholder="e.g. j.doe@university.edu"
                  />
                </div>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Organization */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                      Academic Organization / Lab
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550 group-focus-within:text-cyan-400 transition-colors">
                        <Building className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={organization}
                        required
                        onChange={(e) => setOrganization(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border ${errors.organization ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-cyan-400 focus:bg-slate-950/90'} rounded-xl text-white text-xs placeholder-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.1)]`}
                        placeholder="e.g. MIT, CERN, Stanford"
                      />
                    </div>
                  </div>

                  {/* Nationality */}
                  <div ref={nationRef} className="space-y-1.5 relative">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                      Citizenship / Nationality
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550 group-focus-within:text-cyan-400 transition-colors">
                        {selectedNation ? (
                          <span className="text-base filter drop-shadow-sm select-none">{selectedNation.flag}</span>
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </div>
                      <input
                        type="text"
                        required
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
                        className={`w-full pl-10 pr-10 py-3.5 bg-slate-950/60 border ${errors.nationality ? 'border-red-500 bg-red-500/5' : 'border-white/10 focus:border-cyan-400 focus:bg-slate-950/90'} rounded-xl text-white text-xs placeholder-slate-500 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.1)]`}
                        placeholder="Search or select nationality..."
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-500 hover:text-white" onClick={() => setIsNationDropdownOpen(!isNationDropdownOpen)}>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isNationDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {isNationDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 left-0 right-0 mt-2 max-h-[160px] overflow-y-auto bg-slate-950 border border-white/15 rounded-xl shadow-2xl p-2 space-y-0.5 custom-scrollbar text-left"
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
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-150"
                              >
                                <span className="text-base filter drop-shadow-sm select-none">{nation.flag}</span>
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

                {/* Role and Field selects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Research Role */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                      Academic Role / Title
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550 group-focus-within:text-cyan-400 transition-colors">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <select
                        value={researchRole}
                        onChange={(e) => setResearchRole(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-white/10 focus:border-cyan-400 focus:bg-slate-950/90 rounded-xl text-white text-xs placeholder-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.1)] appearance-none cursor-pointer"
                      >
                        {RESEARCH_ROLES.map((role) => (
                          <option key={role.value} value={role.value} className="bg-slate-950 text-slate-200">
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Research Field */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                      Primary Research Field
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550 group-focus-within:text-cyan-400 transition-colors">
                        <Atom className="w-4 h-4" />
                      </div>
                      <select
                        value={researchField}
                        onChange={(e) => setResearchField(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-white/10 focus:border-cyan-400 focus:bg-slate-950/90 rounded-xl text-white text-xs placeholder-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.1)] appearance-none cursor-pointer"
                      >
                        {RESEARCH_FIELDS.map((field) => (
                          <option key={field.value} value={field.value} className="bg-slate-950 text-slate-200">
                            {field.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {mode === 'login' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Security Passpoint Key (Optional)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550 group-focus-within:text-cyan-400 transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={securityKey}
                    onChange={(e) => setSecurityKey(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-white/10 focus:border-cyan-400 focus:bg-slate-950/90 rounded-xl text-white text-xs placeholder-slate-600 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                    placeholder="••••••••••••"
                  />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-cyan-400/80 ml-1 block font-mono">
                  Multi-factor local session persistence is auto-active.
                </span>
              </div>
            )}

            {/* Language Recommendation Badge */}
            <AnimatePresence>
              {recommendation && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-3.5 bg-indigo-500/10 border border-indigo-500/15 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                    <p className="text-[11px] text-slate-350 font-medium leading-relaxed truncate">
                      Recommend UI localized in: <span className="text-white font-black">{recommendation.langName}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => i18n.changeLanguage(recommendation.langCode)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[9px] font-black uppercase tracking-widest text-white rounded-lg transition-all hover:scale-105 active:scale-95 shrink-0 shadow"
                  >
                    Switch Language
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Errors */}
            <AnimatePresence>
              {errors.form && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold uppercase tracking-wider text-center"
                >
                  {errors.form}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] italic text-xs rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all hover:translate-y-[-1px] active:translate-y-[1px] flex items-center justify-center gap-2 relative group overflow-hidden border border-white/10 cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                {mode === 'login' ? 'Authorize & Sign In' : t('Complete Registration')}
              </span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform text-cyan-300" />
            </button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/80"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[#0B1221] text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Or Integrate Credentials
                </span>
              </div>
            </div>

            {/* Google Authentication Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleAuth}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-cyan-400 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 border border-white/10 cursor-pointer shadow-sm shadow-black/40"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign In with Google Cloud Node
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-left">
             <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Secure Protocol</span>
             </div>
             <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Global Sync</span>
             </div>
          </div>
        </div>
        
        <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-8 max-w-sm mx-auto leading-relaxed">
          {t('Agreement')}
        </p>
      </motion.div>

      {/* --- Onboarding Handshake Simulation Overlay --- */}
      <AnimatePresence>
        {isSubmitting && activeSimIndex >= 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020617]/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="w-full max-w-lg relative p-8 md:p-10 bg-slate-950/80 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#4f46e510,transparent_60%)]" />
              
              {/* Rotating Crystallographic Lattice Scanner Visual */}
              <div className="relative flex justify-center mb-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="w-32 h-32 rounded-full border border-dashed border-cyan-500/20 flex items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="w-24 h-24 rounded-full border border-double border-violet-500/30 flex items-center justify-center relative"
                  >
                    {/* Glowing Atoms */}
                    <span className="absolute top-0 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,1)]" />
                    <span className="absolute bottom-0 w-2.5 h-2.5 bg-violet-400 rounded-full shadow-[0_0_12px_rgba(139,92,246,1)]" />
                    <span className="absolute left-0 w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,1)]" />
                    <span className="absolute right-0 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,1)]" />
                    
                    <FlaskConical className="w-8 h-8 text-cyan-300 animate-pulse" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Status title */}
              <h3 className="text-sm font-black font-mono uppercase tracking-[0.3em] text-cyan-400 mb-6 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                {simulatingTitle}
              </h3>

              {/* Sequential terminal log items */}
              <div className="bg-black/70 border border-white/5 rounded-2xl p-5 text-left font-mono text-[10px] space-y-2 text-slate-400 max-h-48 overflow-y-auto custom-scrollbar">
                {simSteps.map((stepText, index) => {
                  const isActive = index === activeSimIndex;
                  const isFinished = index < activeSimIndex;
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex gap-3 items-center leading-relaxed transition-all ${
                        isActive ? 'text-white font-bold scale-[1.01]' : 
                        isFinished ? 'text-emerald-500/90' : 'opacity-25'
                      }`}
                    >
                      {isFinished ? (
                        <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 shrink-0 text-cyan-400 animate-spin" />
                      ) : (
                        <span className="w-3.5 h-3.5 shrink-0 block border border-slate-700 rounded-full" />
                      )}
                      <span>{stepText}</span>
                    </div>
                  );
                })}
              </div>

              {/* Sim Complete Success State */}
              <AnimatePresence>
                {simComplete && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-400 font-mono text-[11px] font-black uppercase tracking-widest mt-6 animate-pulse"
                  >
                    ✔ Connection Authorized. Entering Studio deck.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
