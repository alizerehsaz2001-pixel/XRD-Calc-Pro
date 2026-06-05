import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Linkedin, 
  Github, 
  MapPin, 
  ExternalLink, 
  Award, 
  Code, 
  Cpu, 
  Globe,
  Terminal,
  Layers,
  ShieldCheck,
  Target,
  Zap,
  Camera,
  Sparkles,
  ChevronRight,
  Activity,
  FileText,
  Microscope,
  Box,
  Brain,
  Database,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Sliders,
  Shield,
  User,
  Save,
  CheckCircle,
  FileBadge
} from 'lucide-react';

interface Skill {
  name: string;
  level: number;
}

interface Research {
  title: string;
  status: string;
  progress: number;
  color: 'emerald' | 'indigo' | 'amber' | 'rose' | 'cyan';
}

interface LinkDetail {
  label: string;
  val: string;
  icon: string;
  url: string;
}

interface Publication {
  title: string;
  journal: string;
  date: string;
}

interface ArchiveItem {
  year: string;
  title: string;
  desc: string;
}

interface LabStats {
  hIndex: number;
  citations: number;
  peerReviews: number;
  scansAnalyzed: number;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  title: string;
  subDescription: string;
  classification: string;
  idReference: string;
  status: string;
  mission: string;
  skills: Skill[];
  research: Research[];
  links: LinkDetail[];
  publications: Publication[];
  archive: ArchiveItem[];
  stats: LabStats;
}

const PRESETS: Record<string, ProfileData> = {
  ali: {
    firstName: 'Ali',
    lastName: 'Zerehsaz',
    title: 'Founder & Laboratory Architect',
    subDescription: 'Pioneering high-fidelity computational frameworks for experimental physics and neuro-analytical material discovery.',
    classification: 'L-5 Senior Director',
    idReference: 'AZ-2001-CORE',
    status: 'Active',
    mission: 'To engineer the most intuitive and scientifically accurate platform for diffraction analysis, empowering researchers with instant, high-fidelity insights.',
    skills: [
      { name: 'Diffraction Physics', level: 95 },
      { name: 'Symmetry Logic', level: 91 },
      { name: 'Neural Architecture', level: 87 },
      { name: 'Phase Identification', level: 83 },
      { name: 'Spectrum Analysis', level: 79 },
      { name: 'Lattice Topology', level: 75 }
    ],
    research: [
      { title: 'Project NEURON (Lattice-LLM)', status: 'In Optimization', progress: 88, color: 'indigo' },
      { title: 'Deconvolution Peak Mapping', status: 'In Progress', progress: 65, color: 'emerald' }
    ],
    links: [
      { label: 'Network Node', val: 'ali@zerehsaz.dev', icon: 'Mail', url: 'mailto:ali@zerehsaz.dev' },
      { label: 'LinkedIn Mesh', val: 'ali-zerehsaz', icon: 'Linkedin', url: 'https://linkedin.com' },
      { label: 'GitHub Forge', val: 'ali-zerehsaz', icon: 'Github', url: 'https://github.com' }
    ],
    publications: [
      { title: 'Neural XRD identification for multicomponent alloys', journal: 'Nature Materials', date: '2025' },
      { title: 'Symmetry group optimization using reinforcement learning', journal: 'Applied Physics Letters', date: '2024' }
    ],
    archive: [
      { year: '2021', title: 'Calculus Alpha', desc: 'Initial physics core developed for basic Bragg diffraction. Foundation of the XRD-Calc engine.' },
      { year: '2023', title: 'Macro-Structure Sync', desc: 'Integration of Williamson-Hall and Warren-Averbach protocols for advanced microstructural mapping.' },
      { year: '2025', title: 'Neural PhaseID Nodes', desc: 'Deployment of the first AI-driven phase identification node, providing probabilistic matching on raw scan data.' }
    ],
    stats: {
      hIndex: 42,
      citations: 1840,
      peerReviews: 128,
      scansAnalyzed: 9420
    }
  },
  bragg: {
    firstName: 'Elizabeth',
    lastName: 'Bragg',
    title: 'Synchrotron Science Division Lead',
    subDescription: 'Advancing ultra-high flux x-ray scattering methodologies for complex solid-state crystal transformations.',
    classification: 'L-5 Lead Investigator',
    idReference: 'EB-1890-SYNC',
    status: 'Active',
    mission: 'To maximize structural exploration pathways under extreme atomic pressure conditions using high-luminosity modern beamlines.',
    skills: [
      { name: 'Synchrotron Scattering', level: 98 },
      { name: 'High-Pressure Crystallography', level: 94 },
      { name: 'Bragg Diffraction Optics', level: 90 },
      { name: 'Fourier Electron Densities', level: 86 },
      { name: 'Sample Rotation Dynamics', level: 82 },
      { name: 'X-Ray Safety Protocols', level: 99 }
    ],
    research: [
      { title: 'Diamond Anvil Cell In-Situ Scans', status: 'Active Run', progress: 92, color: 'cyan' },
      { title: 'Beamline High-Flux Monochromator', status: 'Deployment', progress: 78, color: 'rose' }
    ],
    links: [
      { label: 'Synchrotron Node', val: 'e.bragg@synchrotron.org', icon: 'Mail', url: 'mailto:e.bragg@synchrotron.org' },
      { label: 'Research Mesh', val: 'elizabeth-bragg-xrd', icon: 'Linkedin', url: 'https://linkedin.com' },
      { label: 'Optics Forge', val: 'bragg-diffraction-labs', icon: 'Github', url: 'https://github.com' }
    ],
    publications: [
      { title: 'In-situ diffraction under megabar pressures', journal: 'Science', date: '2026' },
      { title: 'Sub-nanosecond beamline pulse timing calibration', journal: 'Journal of Synchrotron Radiation', date: '2025' }
    ],
    archive: [
      { year: '2020', title: 'DAC Automation v1', desc: 'Introduced automated rotational control alignment for diamond anvil cells.' },
      { year: '2023', title: 'Multibeam Coherence Fit', desc: 'Pioneered split-beam crystal indexing algorithms for multi-domain crystallites.' },
      { year: '2026', title: 'Megabar Oxide Synthesis', desc: 'Identified superconducting properties of novel dense oxides using specialized micro-diffraction.' }
    ],
    stats: {
      hIndex: 56,
      citations: 3120,
      peerReviews: 240,
      scansAnalyzed: 14250
    }
  },
  rietveld: {
    firstName: 'Joseph',
    lastName: 'Rietveld',
    title: 'Senior Mathematical Crystallographer',
    subDescription: 'Formulating rigorous numerical least-squares algorithms for structural profile refinement and multi-phase powder resolving.',
    classification: 'L-4 Structure Expert',
    idReference: 'JR-1969-REFN',
    status: 'Active',
    mission: 'To eliminate peak fitting residuals by decoupling overlapping lattice parameters and specimen displacement errors systematically.',
    skills: [
      { name: 'Least-Squares Refinement', level: 99 },
      { name: 'Caglioti Shape Functions', level: 96 },
      { name: 'Space Group Symmetry', level: 92 },
      { name: 'Texture & Orientation Models', level: 88 },
      { name: 'Instrumental Peak Broadening', level: 85 },
      { name: 'Anisotropic Microstrain', level: 80 }
    ],
    research: [
      { title: 'Genetic Algorithm Peak Deconvolution', status: 'Algorithmic Test', progress: 74, color: 'amber' },
      { title: 'Space-Group Matrix Auto-Resolver', status: 'Stable Release', progress: 95, color: 'indigo' }
    ],
    links: [
      { label: 'Mathematical Node', val: 'j.rietveld@structure.edu', icon: 'Mail', url: 'mailto:j.rietveld@structure.edu' },
      { label: 'Refinement Link', val: 'rietveld-refinement-core', icon: 'Linkedin', url: 'https://linkedin.com' },
      { label: 'Matrix Codebase', val: 'rietveld-profile-fit', icon: 'Github', url: 'https://github.com' }
    ],
    publications: [
      { title: 'A standard profile refinement algorithm for powder scans', journal: 'Journal of Applied Crystallography', date: '2024' },
      { title: 'Modelling preferred orientation in disordered materials', journal: 'Acta Crystallographica', date: '2023' }
    ],
    archive: [
      { year: '2019', title: 'Caglioti Variable Matrix', desc: 'Coded a highly converging solver loop mapping instrumental peak broadness.' },
      { year: '2022', title: 'Integrated Multi-Phase Fit', desc: 'Upgraded code engine to fit up to 8 crystalline structures concurrently.' },
      { year: '2025', title: 'Full Profile Fitting Engine', desc: 'Achieved fully automatic background subtraction, minimizing user bias error codes.' }
    ],
    stats: {
      hIndex: 78,
      citations: 6490,
      peerReviews: 310,
      scansAnalyzed: 18900
    }
  }
};

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'configurator' | 'credentials'>('dossier');
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    return localStorage.getItem('lab_director_custom_avatar') || null;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core profile data loaded from localStorage or default
  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('lab_director_profile_payload');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        // Fallback
      }
    }
    return PRESETS.ali;
  });

  // Load standard database configurations
  const [profileDbConfigs, setProfileDbConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem('xrd_database_configs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      ICDD: { enabled: true, version: 'PDF-4+ 2026', key: 'ICDD-AZ92-U81', path: '/usr/share/ref/icdd/', priority: 'High' },
      COD: { enabled: true, version: 'COD Release 2025', key: 'OPEN-ACCESS-FREE', path: '/var/db/cod/', priority: 'High' },
      RRUFF: { enabled: true, version: 'RRUFF Core 2024', key: 'RRUFF-GEOLOGY-R1', path: '/opt/rruff/', priority: 'Medium' },
      ICSD: { enabled: true, version: 'ICSD 4.1.0', key: 'ICSD-LIC-8821', path: '/usr/local/db/icsd/', priority: 'Medium' },
      CSD: { enabled: true, version: 'CSD Release 2025', key: 'CSD-ORG-LIC-90', path: '/usr/local/db/csd/', priority: 'Low' },
    };
  });

  useEffect(() => {
    // Sync from settings whenever profile page is shown or storage is updated
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('xrd_database_configs');
        if (saved) setProfileDbConfigs(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeTab]);

  // Save profile state helper
  const saveProfileData = (newProfile: ProfileData) => {
    setProfile(newProfile);
    localStorage.setItem('lab_director_profile_payload', JSON.stringify(newProfile));
  };

  // Preset changer
  const handlePresetSelect = (presetKey: string) => {
    if (PRESETS[presetKey]) {
      const selected = PRESETS[presetKey];
      saveProfileData(selected);
      // Reset avatar if custom profile is swapped to let presets show default colors or loaded custom
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileImage(base64);
        localStorage.setItem('lab_director_custom_avatar', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearProfileImage = () => {
    setProfileImage(null);
    localStorage.removeItem('lab_director_custom_avatar');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Editors utilities
  const handleSkillChange = (index: number, level: number) => {
    const updatedSkills = [...profile.skills];
    updatedSkills[index] = { ...updatedSkills[index], level };
    saveProfileData({ ...profile, skills: updatedSkills });
  };

  const handleSkillNameChange = (index: number, name: string) => {
    const updatedSkills = [...profile.skills];
    updatedSkills[index] = { ...updatedSkills[index], name };
    saveProfileData({ ...profile, skills: updatedSkills });
  };

  const addNewSkill = () => {
    const updatedSkills = [...profile.skills, { name: 'New Material Science Skill', level: 80 }];
    saveProfileData({ ...profile, skills: updatedSkills });
  };

  const deleteSkill = (index: number) => {
    const updatedSkills = profile.skills.filter((_, i) => i !== index);
    saveProfileData({ ...profile, skills: updatedSkills });
  };

  // Research Project helpers
  const handleResearchChange = (index: number, field: string, value: any) => {
    const updatedResearch = [...profile.research];
    updatedResearch[index] = { ...updatedResearch[index], [field]: value };
    saveProfileData({ ...profile, research: updatedResearch });
  };

  const addNewResearch = () => {
    const updated: Research[] = [...profile.research, { 
      title: 'Structural Quantum Phase Probe', 
      status: 'In Planning', 
      progress: 10, 
      color: 'cyan' 
    }];
    saveProfileData({ ...profile, research: updated });
  };

  const deleteResearch = (index: number) => {
    const updated = profile.research.filter((_, i) => i !== index);
    saveProfileData({ ...profile, research: updated });
  };

  // Publication helpers
  const handlePubChange = (index: number, field: string, value: string) => {
    const updated = [...profile.publications];
    updated[index] = { ...updated[index], [field]: value };
    saveProfileData({ ...profile, publications: updated });
  };

  const addNewPub = () => {
    const updated = [...profile.publications, { 
      title: 'High-Performance Rietveld refinements on multicrystal systems', 
      journal: 'Acta Materialia', 
      date: '2026' 
    }];
    saveProfileData({ ...profile, publications: updated });
  };

  const deletePub = (index: number) => {
    const updated = profile.publications.filter((_, i) => i !== index);
    saveProfileData({ ...profile, publications: updated });
  };

  // Archive milestones helpers
  const handleArchiveChange = (index: number, field: string, value: string) => {
    const updated = [...profile.archive];
    updated[index] = { ...updated[index], [field]: value };
    saveProfileData({ ...profile, archive: updated });
  };

  const addNewMilestone = () => {
    const updated = [...profile.archive, { 
      year: '2026', 
      title: 'Advanced Lattice Synch Integration', 
      desc: 'Seamless integration with international synchrotron databases.' 
    }];
    saveProfileData({ ...profile, archive: updated });
  };

  const deleteMilestone = (index: number) => {
    const updated = profile.archive.filter((_, i) => i !== index);
    saveProfileData({ ...profile, archive: updated });
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Mail': return Mail;
      case 'Linkedin': return Linkedin;
      case 'Github': return Github;
      default: return Globe;
    }
  };

  // Preset colors for reactor avatar background fallback
  const getPresetGlow = () => {
    if (profile.firstName === 'Ali') return 'from-indigo-600/30 to-fuchsia-600/10';
    if (profile.firstName === 'Elizabeth') return 'from-cyan-650/40 to-blue-500/10';
    return 'from-amber-600/30 to-orange-500/10';
  };

  const getPresetPrimaryColor = () => {
    if (profile.firstName === 'Ali') return 'text-indigo-500';
    if (profile.firstName === 'Elizabeth') return 'text-cyan-500';
    return 'text-amber-500';
  };

  const getPresetBadgeBorder = () => {
    if (profile.firstName === 'Ali') return 'border-indigo-500/20 bg-indigo-505/10 text-indigo-500';
    if (profile.firstName === 'Elizabeth') return 'border-cyan-500/20 bg-cyan-505/10 text-cyan-500';
    return 'border-amber-500/20 bg-amber-505/10 text-amber-500';
  };

  return (
    <div className="min-h-screen animate-in fade-in duration-700 p-4 lg:p-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Decorative Blueprint Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-indigo-500/20 rounded-full animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-10">
        
        {/* Lab Director Navigation Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-650/40">
              {profile.firstName[0]}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Crystallography Station</p>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight mt-1">{profile.firstName} {profile.lastName} Dpt</h2>
            </div>
          </div>

          {/* Module Tabs */}
          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
            {(['dossier', 'configurator', 'credentials'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {tab === 'dossier' && <User size={13} />}
                {tab === 'configurator' && <Sliders size={13} />}
                {tab === 'credentials' && <Award size={13} />}
                <span>
                  {tab === 'dossier' && 'Dossier Overview'}
                  {tab === 'configurator' && 'Customize Profile'}
                  {tab === 'credentials' && 'Clearances & Badges'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Inner Dashboard */}
        <AnimatePresence mode="wait">
          {activeTab === 'dossier' && (
            <motion.div
              key="dossier"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12"
            >
              {/* Dossier Header Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                
                {/* ID badge card */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="relative group">
                     <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-25 transition-opacity duration-700" />
                     <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-3 overflow-hidden shadow-2xl">
                        <div className="aspect-square rounded-[2.5rem] bg-slate-950 flex items-center justify-center relative overflow-hidden border border-slate-200 dark:border-slate-800 group">
                           <div className={`absolute inset-0 bg-gradient-to-tr ${getPresetGlow()}`} />
                           
                           {profileImage ? (
                              <img 
                                src={profileImage} 
                                alt="Director identity" 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                              />
                           ) : (
                              <div className="flex flex-col items-center">
                                 <div className="w-48 h-48 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center relative mb-4">
                                    <div className="w-40 h-40 bg-slate-800 rounded-full border border-indigo-500/20 flex items-center justify-center p-8">
                                       <Zap className="w-20 h-20 text-indigo-400 group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div className="absolute inset-0 border-2 border-indigo-500/10 rounded-full animate-spin-slow" />
                                 </div>
                                 <span className="text-4xl font-black text-white/25 select-none tracking-tighter uppercase font-mono">{profile.firstName[0]}{profile.lastName[0]} MODEL</span>
                              </div>
                           )}

                           <div 
                              onClick={triggerFileInput}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm z-25"
                           >
                              <Camera className="w-10 h-10 text-white mb-2 animate-bounce" />
                              <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Upload Photo File</span>
                              {profileImage && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clearProfileImage();
                                  }}
                                  className="mt-3 px-3 py-1 bg-rose-600 text-white rounded-lg text-[9px] font-black hover:bg-rose-500"
                                >
                                  Remove Photo
                                </button>
                              )}
                           </div>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageChange} 
                          className="hidden" 
                          accept="image/*"
                        />
                     </div>
                  </div>

                  {/* Operational security metrics card */}
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl">
                           <ShieldCheck className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-sans">Lab Security Credentials</h3>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                           <span className="text-xs font-bold text-slate-500">Classification</span>
                           <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${getPresetBadgeBorder()}`}>
                             {profile.classification}
                           </span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                           <span className="text-xs font-bold text-slate-500">ID Reference</span>
                           <span className="text-xs font-mono text-slate-600 dark:text-slate-300 font-bold">{profile.idReference}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-500">Node Status</span>
                           <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 bg-emerald-550 rounded-full animate-pulse" />
                              <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">{profile.status}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* High Quality Barcode Badge Decal */}
                  <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 flex flex-col justify-between h-40 font-mono text-slate-400 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Code className="w-32 h-32" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black tracking-widest uppercase text-indigo-400">Security Encrypted Token</p>
                      <p className="text-xs font-bold text-white mt-1">SHA-256 MATCH VERIFIED</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex gap-0.5 h-10 items-end justify-between bg-white/5 p-1 rounded-md">
                        {[1,4,2,7,1,3,9,1,2,5,8,3,1,6,2,4,8,3,1,5,2,9,6,1,4,2,7,3,8,2,1].map((wt, i) => (
                          <div 
                            key={i} 
                            style={{ width: `${wt === 1 ? '1px' : wt === 2 ? '2px' : '3px'}` }} 
                            className="bg-slate-300 h-full inline-block" 
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] font-normal tracking-[0.2em] font-mono">
                        <span>SYSTEM PORT_3000</span>
                        <span>{profile.idReference}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Director Core Bio */}
                <div className="lg:col-span-8 space-y-10">
                   <div className="space-y-4 lg:space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="h-px w-12 bg-indigo-500/30" />
                         <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500">Crystallography Architect</span>
                      </div>
                      <h1 className="text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase italic font-sans break-words">
                         {profile.firstName} <br />
                         <span className="text-transparent bg-clip-text bg-gradient-to-tr from-indigo-600 via-indigo-450 to-cyan-400">
                           {profile.lastName}
                         </span>
                      </h1>
                      <p className="text-xl lg:text-2xl text-slate-500 dark:text-slate-400 font-bold max-w-2xl leading-tight">
                        {profile.subDescription}
                      </p>
                   </div>

                   {/* Grid of Dynamic counters / Science Metrics */}
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     {[
                       { label: 'h-index metric', val: profile.stats.hIndex, desc: 'Academic H-Index' },
                       { label: 'total citations', val: profile.stats.citations, desc: 'Scopus/Nature citation records' },
                       { label: 'peer reports', val: profile.stats.peerReviews, desc: 'Approved journal reviews' },
                       { label: 'xrd scans fit', val: profile.stats.scansAnalyzed, desc: 'Dataset calculations completed' }
                     ].map((st, idx) => (
                       <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden group">
                         <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-455 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                         <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">{st.label}</span>
                         <h3 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none my-1">{st.val.toLocaleString()}</h3>
                         <p className="text-[9px] text-slate-455 font-bold mt-1.5 leading-tight">{st.desc}</p>
                       </div>
                     ))}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     
                     {/* Skills list cards */}
                     <div className="group p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-500/10 rounded-2xl">
                             <Layers className="w-5 h-5 text-amber-500" />
                          </div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">Specialized Disciplines</h3>
                        </div>
                        <div className="space-y-4">
                          {profile.skills.map((skill, index) => (
                            <div key={index} className="space-y-1.5">
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{skill.name}</span>
                                <span className="text-[9px] font-mono font-bold text-indigo-500">{skill.level}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${skill.level}%` }}
                                  transition={{ duration: 1.2, delay: 0.1 * index }}
                                  className={`h-full ${index % 2 === 0 ? 'bg-indigo-500' : 'bg-cyan-500'}`} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                     </div>

                     <div className="space-y-8">
                        {/* Active Research card */}
                        <div className="group p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 transition-all shadow-sm space-y-6">
                           <div className="flex items-center gap-4">
                             <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <Activity className="w-5 h-5 text-emerald-500" />
                             </div>
                             <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">Research Milestones</h3>
                           </div>
                           <div className="space-y-4">
                             {profile.research.map((item, i) => (
                               <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                                  <div className="flex justify-between items-center">
                                     <span className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">{item.title}</span>
                                     <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 px-2 py-0.5 bg-indigo-500/10 rounded-full">
                                       {item.status}
                                     </span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                       <motion.div 
                                         initial={{ width: 0 }}
                                         animate={{ width: `${item.progress}%` }}
                                         className="h-full bg-indigo-500" 
                                       />
                                    </div>
                                    <div className="flex justify-between text-[8px] font-mono text-slate-400">
                                      <span>CONVERGENCE</span>
                                      <span>{item.progress}%</span>
                                    </div>
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* Mission Quote */}
                        <div className="p-8 bg-indigo-600 rounded-[3rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
                              <Target className="w-32 h-32" />
                           </div>
                           <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-75">Lab Mission Command</h3>
                           <p className="text-lg font-bold leading-relaxed relative z-10 italic">
                             "{profile.mission}"
                           </p>
                        </div>
                     </div>

                   </div>

                   {/* Grid of details contact and secure links */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     
                     {/* Secure Links info */}
                     <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-sky-500/10 rounded-2xl">
                             <Globe className="w-5 h-5 text-sky-500" />
                          </div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">Laboratory Directory Mesh</h3>
                        </div>
                        <div className="space-y-4">
                          {profile.links.map((link, i) => {
                            const LinkIcon = getIconComponent(link.icon);
                            return (
                              <a 
                                key={i} 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-4 group/link"
                              >
                                 <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover/link:bg-indigo-500/10 transition-colors">
                                    <LinkIcon className="w-4 h-4 text-slate-450 group-hover/link:text-indigo-500" />
                                 </div>
                                 <div className="flex-1">
                                    <span className="block text-[8px] font-black uppercase text-slate-400 tracking-widest">{link.label}</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover/link:text-indigo-500 transition-colors uppercase italic font-serif tracking-tight">{link.val}</span>
                                 </div>
                                 <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover/link:opacity-100 transition-all -translate-x-2 group-hover/link:translate-x-0" />
                              </a>
                            );
                          })}
                        </div>
                     </div>

                     {/* Publications block list */}
                     <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-500/10 rounded-2xl">
                             <FileText className="w-5 h-5 text-blue-500" />
                          </div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">Recent Journal Publications</h3>
                        </div>
                        <div className="space-y-4">
                          {profile.publications.slice(0, 3).map((pub, i) => (
                            <div key={i} className="group/pub cursor-pointer border-l-2 border-indigo-650 pl-3 py-0.5 whitespace-normal">
                               <span className="block text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">{pub.journal} • {pub.date}</span>
                               <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 group-hover/pub:text-indigo-500 transition-colors uppercase tracking-tight leading-normal">{pub.title}</p>
                            </div>
                          ))}
                        </div>
                     </div>

                   </div>

                </div>

              </div>

                    {/* Standard Reference Database Sync Monitor */}
                    <div className="p-8 md:p-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-sm space-y-8 mt-12 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                       
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-wrap">
                             <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20 animate-pulse">
                                <Database className="w-5 h-5" />
                             </div>
                             <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-800 dark:text-slate-300 font-sans">Scientific Reference Databases</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Sovereign lattice matching index node matrices</p>
                             </div>
                          </div>
                          
                          <div className="flex gap-2 text-[8px] font-black uppercase tracking-widest leading-none shrink-0">
                             <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded font-mono font-black">
                                SYSTEM CONVERGENCE: STABLE
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          {(['ICDD', 'COD', 'RRUFF', 'ICSD', 'CSD'] as const).map((dbKey) => {
                             const item = profileDbConfigs[dbKey];
                             
                             const colorClass = dbKey === 'ICDD' ? 'text-amber-500 border-amber-500/15 bg-amber-500/5' :
                                                dbKey === 'COD' ? 'text-emerald-500 border-emerald-500/15 bg-emerald-500/5' :
                                                dbKey === 'RRUFF' ? 'text-cyan-500 border-cyan-500/15 bg-cyan-500/5' :
                                                dbKey === 'ICSD' ? 'text-indigo-400 border-indigo-500/15 bg-indigo-500/5' :
                                                'text-rose-500 border-rose-500/15 bg-rose-500/5';
                                                
                             const recCount = dbKey === 'ICDD' ? '485,280 Peaks' :
                                              dbKey === 'COD' ? '512,940 Cells' :
                                              dbKey === 'RRUFF' ? '32,410 Raman' :
                                              dbKey === 'ICSD' ? '239,180 Inorg' :
                                              '1,250,910 Organic';

                             return (
                                <div key={dbKey} className="p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-white/5 space-y-4 hover:border-indigo-500/30 transition-all flex flex-col justify-between">
                                   <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                         <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded border uppercase ${colorClass}`}>
                                            {dbKey}
                                         </span>
                                         <div className="flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${item.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-tighter">
                                               {item.enabled ? 'ONLINE' : 'MUTED'}
                                            </span>
                                         </div>
                                      </div>

                                      <div className="space-y-0.5">
                                         <div className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">Catalog Version</div>
                                         <div className="text-[10px] font-mono font-extrabold text-slate-705 dark:text-slate-200 uppercase truncate">
                                            {item.version}
                                         </div>
                                      </div>
                                   </div>

                                   <div className="space-y-3.5 pt-3 border-t border-slate-100 dark:border-white/5 mt-auto">
                                      <div className="grid grid-cols-2 gap-1 text-[8px] font-sans font-bold uppercase text-slate-450 dark:text-slate-500 leading-normal">
                                         <div>
                                            <div className="text-slate-400">INDEXED CORES</div>
                                            <div className="text-[9.5px] font-extrabold font-mono text-slate-600 dark:text-slate-350">{recCount}</div>
                                         </div>
                                         <div>
                                            <div className="text-slate-400">PRIORITY</div>
                                            <div className="text-[9.5px] font-extrabold font-mono text-slate-650 dark:text-slate-350">{item.priority}</div>
                                         </div>
                                      </div>

                                      <div className="space-y-1">
                                         <span className="block text-[8px] font-black uppercase text-slate-400">AUTHORIZED AT:</span>
                                         <span className="block text-[8px] font-mono uppercase bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-white/5 py-1 px-1.5 rounded text-slate-500 dark:text-slate-400 truncate" title={item.path}>
                                            {item.path}
                                         </span>
                                      </div>
                                   </div>
                                </div>
                             );
                          })}
                       </div>

                       <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-[9.5px] leading-relaxed text-slate-500 text-center font-medium">
                          ℹ <strong>Sovereign Credentials Verified:</strong> Standard Reference Databases are checked and authenticated by the Laboratory Director for the analysis pipeline. Changes can be applied within the <strong>Settings tab</strong>.
                       </div>
                    </div>

              {/* Milestones / Archive section */}
              <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800 space-y-8">
                 <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2 font-sans">Director's Archive</h2>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Scientific Milestones & High-Fidelity Breakthroughs</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {profile.archive.map((item, i) => (
                      <div key={i} className="relative p-8 lg:p-10 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all shadow-md group">
                         <div className="absolute -top-3.5 left-10 px-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-black italic text-indigo-500 font-mono shadow-xs">
                            {item.year}
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase italic mt-1 font-sans">{item.title}</h3>
                         <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}

          {/* ActiveTab 2: Configuration form & Archetypes */}
          {activeTab === 'configurator' && (
            <motion.div
              key="configurator"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-250 dark:border-white/10 p-8 lg:p-12 shadow-2xl space-y-10"
            >
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-100 dark:border-slate-800 pb-10">
                <div className="lg:col-span-4 space-y-3">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20 font-mono">Dossier Presets</span>
                  <p className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Switch Lab Archetype</p>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed">
                    Selecting an archetype auto-refreshes all scientific variables, h-indexes, citations, and milestone models.
                  </p>
                </div>
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'ali', name: 'Ali Zerehsaz', label: 'Computing Lead' },
                    { key: 'bragg', name: 'Elizabeth Bragg', label: 'Synchrotron Lead' },
                    { key: 'rietveld', name: 'Joseph Rietveld', label: 'Mathematical Lead' }
                  ].map((pres) => (
                    <button
                      key={pres.key}
                      onClick={() => handlePresetSelect(pres.key)}
                      className={`p-5 rounded-2xl text-left border flex flex-col justify-between transition-all ${
                        profile.idReference === PRESETS[pres.key].idReference
                          ? 'border-indigo-650 bg-indigo-500/5 dark:bg-indigo-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-transparent'
                      }`}
                    >
                      <div>
                        <p className="text-[10px] font-mono text-indigo-505 dark:text-indigo-400 font-black tracking-wider uppercase">{pres.label}</p>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 uppercase italic leading-none">{pres.name}</h4>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase mt-4 block">{PRESETS[pres.key].classification}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form editing container */}
              <div className="space-y-8">
                
                {/* 1. Core Metadata */}
                <div className="space-y-4">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
                     <User size={13} className="text-indigo-500" /> Identity Information
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">First Name</label>
                       <input 
                         type="text" 
                         value={profile.firstName} 
                         onChange={(e) => saveProfileData({ ...profile, firstName: e.target.value })}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                       />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Last Name</label>
                       <input 
                         type="text" 
                         value={profile.lastName} 
                         onChange={(e) => saveProfileData({ ...profile, lastName: e.target.value })}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                       />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Title</label>
                       <input 
                         type="text" 
                         value={profile.title} 
                         onChange={(e) => saveProfileData({ ...profile, title: e.target.value })}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                       />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">ID Reference Code</label>
                       <input 
                         type="text" 
                         value={profile.idReference} 
                         onChange={(e) => saveProfileData({ ...profile, idReference: e.target.value })}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                       />
                     </div>
                   </div>
                   <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Sub-Description / Active Subtitle</label>
                     <input 
                       type="text" 
                       value={profile.subDescription} 
                       onChange={(e) => saveProfileData({ ...profile, subDescription: e.target.value })}
                       className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                     />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Mission Command Statement</label>
                     <textarea 
                       rows={2}
                       value={profile.mission} 
                       onChange={(e) => saveProfileData({ ...profile, mission: e.target.value })}
                       className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                     />
                   </div>
                </div>

                {/* 2. Core Stats Counters */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
                     <Activity size={13} className="text-indigo-500" /> Scientific Impact Statistics
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">H-Index</label>
                       <input 
                         type="number" 
                         value={profile.stats.hIndex} 
                         onChange={(e) => saveProfileData({ ...profile, stats: { ...profile.stats, hIndex: parseInt(e.target.value) || 0 } })}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                       />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-sans">Total Citations</label>
                       <input 
                         type="number" 
                         value={profile.stats.citations} 
                         onChange={(e) => saveProfileData({ ...profile, stats: { ...profile.stats, citations: parseInt(e.target.value) || 0 } })}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                       />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Peer Reviews Verified</label>
                       <input 
                         type="number" 
                         value={profile.stats.peerReviews} 
                         onChange={(e) => saveProfileData({ ...profile, stats: { ...profile.stats, peerReviews: parseInt(e.target.value) || 0 } })}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                       />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">XRD Datasets Analyzed</label>
                       <input 
                         type="number" 
                         value={profile.stats.scansAnalyzed} 
                         onChange={(e) => saveProfileData({ ...profile, stats: { ...profile.stats, scansAnalyzed: parseInt(e.target.value) || 0 } })}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                       />
                     </div>
                  </div>
                </div>

                {/* 3. Skill Matrices Editor */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                       <Layers size={13} className="text-indigo-500" /> Operational Disciplines Range
                     </h3>
                     <button
                       onClick={addNewSkill}
                       className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                     >
                       <Plus size={10} /> Add Domain
                     </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.skills.map((skill, index) => (
                      <div key={index} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 space-y-1.5 w-full">
                          <input 
                            type="text" 
                            value={skill.name} 
                            onChange={(e) => handleSkillNameChange(index, e.target.value)}
                            className="bg-transparent text-xs font-black uppercase text-slate-800 dark:text-slate-200 outline-none w-full border-b border-dotted border-slate-350 focus:border-indigo-500 pb-1"
                          />
                          <div className="flex items-center gap-3">
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={skill.level} 
                              onChange={(e) => handleSkillChange(index, parseInt(e.target.value))}
                              className="flex-1 accent-indigo-600"
                            />
                            <span className="font-mono text-[10px] font-black text-indigo-500 w-8 text-right">{skill.level}%</span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteSkill(index)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                          title="Delete skill"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Active Publications & Archive Milestones */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  
                  {/* Publications */}
                  <div className="space-y-4 shadow-xs">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <FileText size={13} className="text-indigo-500" /> Publications Array
                        </h3>
                        <button
                          onClick={addNewPub}
                          className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/15 rounded text-[8px] font-black uppercase tracking-wider"
                        >
                          Add Item
                        </button>
                     </div>
                     <div className="space-y-3">
                       {profile.publications.map((pub, idx) => (
                         <div key={idx} className="p-4 bg-slate-55/40 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 relative">
                           <button 
                             onClick={() => deletePub(idx)} 
                             className="absolute top-3 right-3 text-slate-400 hover:text-rose-500"
                           >
                             <Trash2 size={12} />
                           </button>

                           <div className="space-y-1 pr-6">
                             <input 
                               type="text" 
                               value={pub.title} 
                               placeholder="Title"
                               onChange={(e) => handlePubChange(idx, 'title', e.target.value)}
                               className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none border-b border-slate-200 dark:border-slate-800 focus:border-indigo-500 pb-0.5"
                             />
                             <div className="grid grid-cols-2 gap-2 mt-1">
                               <input 
                                 type="text" 
                                 value={pub.journal} 
                                 placeholder="Journal Name"
                                 onChange={(e) => handlePubChange(idx, 'journal', e.target.value)}
                                 className="w-full bg-transparent text-[10px] font-mono text-indigo-530 dark:text-indigo-400 outline-none"
                               />
                               <input 
                                 type="text" 
                                 value={pub.date} 
                                 placeholder="Year"
                                 onChange={(e) => handlePubChange(idx, 'date', e.target.value)}
                                 className="w-full bg-transparent text-[10px] font-mono text-slate-400 outline-none text-right"
                               />
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>

                  {/* Milestones Archive */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Award size={13} className="text-indigo-500" /> Milestone Archive
                        </h3>
                        <button
                          onClick={addNewMilestone}
                          className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/15 rounded text-[8px] font-black uppercase tracking-wider"
                        >
                          Add Year
                        </button>
                     </div>
                     <div className="space-y-3">
                       {profile.archive.map((item, idx) => (
                         <div key={idx} className="p-4 bg-slate-55/40 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 relative">
                           <button 
                             onClick={() => deleteMilestone(idx)} 
                             className="absolute top-3 right-3 text-slate-400 hover:text-rose-500"
                           >
                             <Trash2 size={12} />
                           </button>

                           <div className="grid grid-cols-12 gap-3 pr-6">
                             <div className="col-span-3">
                               <input 
                                 type="text" 
                                 value={item.year} 
                                 placeholder="Year (e.g. 2026)"
                                 onChange={(e) => handleArchiveChange(idx, 'year', e.target.value)}
                                 className="w-full bg-transparent text-xs font-bold text-indigo-500 outline-none border-b border-slate-200 dark:border-slate-800 focus:border-indigo-500 font-mono pb-0.5"
                               />
                             </div>
                             <div className="col-span-9">
                               <input 
                                 type="text" 
                                 value={item.title} 
                                 placeholder="Title of Milestone"
                                 onChange={(e) => handleArchiveChange(idx, 'title', e.target.value)}
                                 className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none border-b border-slate-200 dark:border-slate-800 focus:border-indigo-500 pb-0.5"
                               />
                             </div>
                           </div>
                           <textarea 
                             rows={2}
                             value={item.desc}
                             placeholder="Description of milestone accomplishment..."
                             onChange={(e) => handleArchiveChange(idx, 'desc', e.target.value)}
                             className="w-full bg-transparent text-[10px] text-slate-500 dark:text-slate-400 outline-none resize-none leading-relaxed"
                           />
                         </div>
                       ))}
                     </div>
                  </div>

                </div>

              </div>

              {/* Status footer save button container */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                   <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                   <p className="text-xs text-slate-505 dark:text-slate-405 font-bold">
                     All modifications are sync-saved directly to local storage profiles automatically.
                   </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('dossier');
                  }}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-650/30 hover:bg-indigo-500 transition-colors"
                >
                  <Save size={13} /> Return to Dossier
                </button>
              </div>

            </motion.div>
          )}

          {/* ActiveTab 3: Credentials Academic clearance badges */}
          {activeTab === 'credentials' && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                  Laboratory Clearance Tokens
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-3xl leading-relaxed">
                  Authorized laboratory personnel and safety clearance documents generated interactively based on your selected node profile.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Badge 1 */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Shield className="w-24 h-24 text-indigo-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-indigo-550/10 text-indigo-650 dark:text-indigo-400 rounded-2xl">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-emerald-550 px-2 py-0.5 bg-emerald-500/10 rounded-full uppercase">Security: Active</span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight font-sans">X-Ray Radiation Safety</h4>
                      <p className="text-xs text-slate-455 font-bold leading-normal mt-1">
                        Authorization for unsupervised high-energy synchrotron and powder diffraction instrumentation rooms with absolute zero exposure limits.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 text-slate-450 text-[10px] leading-loose font-mono">
                    <p>&gt; Clearer: Radiation Control Board</p>
                    <p>&gt; License Ref: RC-SAFE-9214</p>
                    <p>&gt; Signed: {profile.firstName} {profile.lastName}</p>
                  </div>
                </div>

                {/* Badge 2 */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Award className="w-24 h-24 text-cyan-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-cyan-550/10 text-cyan-650 dark:text-cyan-400 rounded-2xl">
                        <Award className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-indigo-500 px-2 py-0.5 bg-indigo-500/10 rounded-full uppercase">Permanent</span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight font-sans">Crystallography Expert</h4>
                      <p className="text-xs text-slate-455 font-bold leading-normal mt-1">
                        Elected lifelong member of the International Crystallography Union for substantial algorithmic developments in profile modelling equations.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 text-slate-450 text-[10px] leading-loose font-mono">
                    <p>&gt; Holder: {profile.firstName} {profile.lastName}</p>
                    <p>&gt; Reference: ICU-GOLD-2024</p>
                    <p>&gt; Rank: Fellow of the Union</p>
                  </div>
                </div>

                {/* Badge 3 */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Database className="w-24 h-24 text-amber-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-amber-550/10 text-amber-655 dark:text-amber-400 rounded-2xl">
                        <Database className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-full uppercase">Level L-5</span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight font-sans">Symmetry Structure Key</h4>
                      <p className="text-xs text-slate-455 font-bold leading-normal mt-1">
                        High priority node security key authorizing full system matrix search calculations across classified ICSD structural crystal records.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 text-slate-450 text-[10px] leading-loose font-mono">
                    <p>&gt; Cipher Hash: SHA-CRYPT-X52B</p>
                    <p>&gt; Token State: SYNC_ESTABLISHED</p>
                    <p>&gt; Clearance Grade: {profile.classification}</p>
                  </div>
                </div>

              </div>

              {/* Dynamic printed certificate card */}
              <div className="bg-slate-950 p-8 lg:p-12 border border-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden font-serif max-w-4xl mx-auto text-slate-300">
                
                {/* Certificate framing elements */}
                <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-amber-600 via-indigo-600 to-cyan-500 opacity-60" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/5 rounded-full flex items-center justify-center pointer-events-none p-10 text-center">
                  <span className="text-[120px] font-black text-white/[0.01] uppercase tracking-tighter select-none font-sans">L-5 SECURE SEAL</span>
                </div>

                <div className="space-y-8 relative z-10 text-center">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black font-sans uppercase tracking-[0.4em] text-indigo-400 block">Universal Crystallographic Commission</span>
                    <h3 className="text-3xl text-white tracking-tight uppercase italic leading-none">Certificate of Analytical Eminence</h3>
                  </div>

                  <div className="w-16 h-px bg-amber-500/30 mx-auto" />

                  <p className="text-sm font-light leading-relaxed max-w-2xl mx-auto text-slate-400">
                    This document explicitly and securely registers structural credentials verifying that <span className="font-bold text-white italic underline">{profile.firstName} {profile.lastName}</span> has satisfied compliance safety indices, qualifying as an approved expert in diffraction physics models.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    <div className="space-y-1 text-center md:text-left font-sans">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Commission Signature</span>
                      <p className="text-xs font-bold text-white mt-1 border-b border-white/10 pb-1 italic font-serif">International XRD Board</p>
                    </div>

                    <div className="flex items-center justify-center p-3">
                       <ShieldCheck className="w-12 h-12 text-amber-505/30" />
                    </div>

                    <div className="space-y-1 text-center md:text-right font-sans">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest font-sans">Security Identification Code</span>
                      <p className="text-xs font-mono font-bold text-indigo-400 mt-1 border-b border-indigo-500/10 pb-1">{profile.idReference}</p>
                    </div>
                  </div>

                  <p className="text-[9px] font-mono text-slate-600 tracking-wider">
                    Bar hash validation verified on host port 3000 locally. Auth checksum encrypted using standard cryptographic functions.
                  </p>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Global credentials footnote */}
        <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[9px] font-black uppercase tracking-[0.4em]">
             {profile.firstName} {profile.lastName} Studios • Established 2001
          </div>
        </div>

      </div>

    </div>
  );
};
