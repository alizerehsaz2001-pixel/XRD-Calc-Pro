import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Building, ArrowRight, FlaskConical, Globe, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegistrationPageProps {
  onRegister: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onRegister }) => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!organization.trim()) newErrors.organization = 'Organization is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const userData = { name, email, organization, registeredAt: new Date().toISOString() };
      localStorage.setItem('xrd_user_registration', JSON.stringify(userData));
      onRegister();
    }
  };

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
      <div className="absolute top-8 right-8 z-50">
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl">
          <Globe className="w-4 h-4 text-indigo-400" />
          <select 
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="bg-transparent border-none text-[11px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer focus:ring-0"
          >
            <option value="en" className="bg-slate-900">EN</option>
            <option value="de" className="bg-slate-900">DE</option>
            <option value="fr" className="bg-slate-900">FR</option>
            <option value="es" className="bg-slate-900">ES</option>
            <option value="it" className="bg-slate-900">IT</option>
            <option value="nl" className="bg-slate-900">NL</option>
            <option value="ru" className="bg-slate-900">RU</option>
            <option value="tr" className="bg-slate-900">TR</option>
            <option value="ja" className="bg-slate-900">JA</option>
            <option value="zh" className="bg-slate-900">ZH</option>
            <option value="ko" className="bg-slate-900">KO</option>
            <option value="ar" className="bg-slate-900">AR</option>
            <option value="fa" className="bg-slate-900">FA</option>
            <option value="he" className="bg-slate-900">HE</option>
            <option value="hi" className="bg-slate-900">HI</option>
            <option value="pt" className="bg-slate-900">PT</option>
            <option value="pl" className="bg-slate-900">PL</option>
            <option value="cs" className="bg-slate-900">CS</option>
            <option value="sk" className="bg-slate-900">SK</option>
            <option value="hr" className="bg-slate-900">HR</option>
            <option value="sr" className="bg-slate-900">SR</option>
            <option value="sl" className="bg-slate-900">SL</option>
            <option value="ca" className="bg-slate-900">CA</option>
            <option value="bg" className="bg-slate-900">BG</option>
            <option value="ro" className="bg-slate-900">RO</option>
            <option value="hu" className="bg-slate-900">HU</option>
            <option value="uk" className="bg-slate-900">UK</option>
            <option value="ms" className="bg-slate-900">MS</option>
            <option value="tl" className="bg-slate-900">TL</option>
            <option value="vi" className="bg-slate-900">VI</option>
            <option value="id" className="bg-slate-900">ID</option>
            <option value="sv" className="bg-slate-900">SV</option>
            <option value="da" className="bg-slate-900">DA</option>
            <option value="no" className="bg-slate-900">NO</option>
            <option value="fi" className="bg-slate-900">FI</option>
            <option value="th" className="bg-slate-900">TH</option>
          </select>
        </div>
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
          
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase italic tracking-tighter leading-none">
            XRD-Calc<span className="text-indigo-400">Pro</span>
          </h1>
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

