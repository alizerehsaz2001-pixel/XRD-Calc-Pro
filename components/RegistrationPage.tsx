import React, { useState, useEffect } from 'react';
import { User, Mail, Building, ArrowRight } from 'lucide-react';

interface RegistrationPageProps {
  onRegister: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onRegister }) => {
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900 rounded-full blur-[150px]"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-violet-900 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-6 text-3xl font-bold text-white">
            λ
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to XRD-Calc Pro</h1>
          <p className="text-slate-400">Please register to access the laboratory.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-indigo-500'} rounded-xl text-white placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors`}
                  placeholder="Dr. Jane Doe"
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-indigo-500'} rounded-xl text-white placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors`}
                  placeholder="jane.doe@university.edu"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Organization / Institute</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900/50 border ${errors.organization ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-indigo-500'} rounded-xl text-white placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors`}
                  placeholder="MIT, Stanford, etc."
                />
              </div>
              {errors.organization && <p className="text-red-400 text-xs mt-1">{errors.organization}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              Complete Registration <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-500 mt-6">
          By registering, you agree to use this tool for scientific and educational purposes.
        </p>
      </div>
    </div>
  );
};
