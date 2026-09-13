import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserCheck, Shield, Award, CheckCircle2, 
  Copy, Check, Sparkles, Building2, Fingerprint, 
  CreditCard, KeyRound
} from 'lucide-react';
import { motion } from 'motion/react';
import { playSynthTone } from '../../utils/sound';

export const IdentitySettingsTab: React.FC = () => {
  const { t } = useTranslation();

  const [operatorName, setOperatorName] = useState<string>(() => {
    return localStorage.getItem('xrd_operator_name') || 'Ali Zerehsaz';
  });
  const [operatorTitle, setOperatorTitle] = useState<string>(() => {
    return localStorage.getItem('xrd_operator_title') || 'Lead Materials Scientist & Lab Director';
  });
  const [institutionName, setInstitutionName] = useState<string>(() => {
    return localStorage.getItem('xrd_institution_name') || 'Advanced Crystallography & Diffraction Laboratory';
  });
  const [clearanceLevel, setClearanceLevel] = useState<string>(() => {
    return localStorage.getItem('xrd_clearance_level') || 'L4-DIRECTOR';
  });
  const [certifications, setCertifications] = useState<string[]>(() => {
    const saved = localStorage.getItem('xrd_certifications');
    return saved ? JSON.parse(saved) : ['ICDD Certified XRD Analyst', 'ISO/IEC 17025 Metrology Specialist', 'Rietveld Refinement Lead'];
  });
  const [copiedToken, setCopiedToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const availableCerts = [
    'ICDD Certified XRD Analyst',
    'ISO/IEC 17025 Metrology Specialist',
    'Rietveld Refinement Lead',
    'Radiation Safety Officer (RSO)',
    'Single-Crystal Structure Specialist',
    'Thin-Film & Grazing Incidence (GIXRD) Certified'
  ];

  const toggleCert = (cert: string) => {
    let updated: string[];
    if (certifications.includes(cert)) {
      updated = certifications.filter(c => c !== cert);
    } else {
      updated = [...certifications, cert];
    }
    setCertifications(updated);
    localStorage.setItem('xrd_certifications', JSON.stringify(updated));
    playSynthTone('switch');
  };

  const handleSaveProfile = () => {
    localStorage.setItem('xrd_operator_name', operatorName);
    localStorage.setItem('xrd_operator_title', operatorTitle);
    localStorage.setItem('xrd_institution_name', institutionName);
    localStorage.setItem('xrd_clearance_level', clearanceLevel);
    localStorage.setItem('xrd_certifications', JSON.stringify(certifications));
    setSaveSuccess(true);
    playSynthTone('success');
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const digitalToken = `XRD-AUTH-${btoa(operatorName + clearanceLevel).slice(0, 16)}-2026`;

  return (
    <motion.div 
      key="identity"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-indigo-500" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t('Laboratory Operator Credentials')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('Manage investigator identity, certifications, and clearance tier')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setOperatorName('Ali Zerehsaz');
                setOperatorTitle('Lead Materials Scientist & Lab Director');
                setInstitutionName('Advanced Crystallography & Diffraction Laboratory');
                setClearanceLevel('L4-DIRECTOR');
                setCertifications(['ICDD Certified XRD Analyst', 'ISO/IEC 17025 Metrology Specialist', 'Rietveld Refinement Lead']);
                playSynthTone('switch');
              }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Director Preset
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('Investigator Full Name')}
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                placeholder="Dr. Jane Doe"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('Title / Academic Rank')}
                </label>
                <input
                  type="text"
                  value={operatorTitle}
                  onChange={(e) => setOperatorTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                  placeholder="Senior Crystallographer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('Clearance Authorization Tier')}
                </label>
                <select
                  value={clearanceLevel}
                  onChange={(e) => {
                    setClearanceLevel(e.target.value);
                    playSynthTone('switch');
                  }}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="L1-GUEST">L1 - Guest / Student Observer</option>
                  <option value="L2-ANALYST">L2 - Certified XRD Analyst</option>
                  <option value="L3-SENIOR">L3 - Senior Crystallographer</option>
                  <option value="L4-DIRECTOR">L4 - Laboratory Director / PI</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {t('Facility / Institution Name')}
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                placeholder="National Institute of Materials Science"
              />
            </div>

            {/* Certifications Checkboxes */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                {t('Active Qualifications & Metrology Certifications')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableCerts.map((cert) => {
                  const isChecked = certifications.includes(cert);
                  return (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => toggleCert(cert)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-2.5 ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span className="truncate">{cert}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Profile Synchronized Successfully
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Save Credentials & Update Digital Badge
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Digital Badge Card Preview */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl overflow-hidden">
            {/* Holographic accent glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                  LABORATORY CLEARANCE ID
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                VERIFIED
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Fingerprint className="w-8 h-8 text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white tracking-tight">
                    {operatorName || 'Ali Zerehsaz'}
                  </h4>
                  <p className="text-xs text-indigo-300 font-medium mt-0.5">
                    {operatorTitle || 'Laboratory Director'}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    {institutionName || 'XRD Central Lab'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px] font-mono">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[9px]">AUTHORIZATION</span>
                  <span className="text-amber-300 font-bold">{clearanceLevel}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[9px]">QUALIFICATIONS</span>
                  <span className="text-emerald-300 font-bold">{certifications.length} Certified</span>
                </div>
              </div>

              {/* Barcode & Digital Token */}
              <div className="pt-2">
                <div className="h-6 w-full bg-white/10 rounded flex items-center justify-around px-2 opacity-70">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-4 bg-white ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`} 
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-1.5">
                  <span>TOKEN: {digitalToken}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(digitalToken);
                      setCopiedToken(true);
                      playSynthTone('switch');
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedToken ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <span className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              Role-Based Access Enforcement
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Active clearance level grants administrative execution rights for Rietveld profile parameter overrides, raw data exports, and batch PDF generation.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
