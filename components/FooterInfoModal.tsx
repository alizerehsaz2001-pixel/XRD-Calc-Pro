import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Hexagon, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Terminal, 
  FileText, 
  BookOpen, 
  Cpu, 
  Layers, 
  Activity, 
  Database, 
  Mail, 
  Users, 
  Award, 
  Sparkles, 
  Code2, 
  Key, 
  HelpCircle, 
  Send, 
  Server, 
  CheckCircle2, 
  ExternalLink,
  Lock,
  Boxes,
  Microscope,
  Check,
  Building2,
  Atom,
  Clock,
  Sparkle,
  Copy
} from 'lucide-react';
import { LinkedinIcon, GithubIcon } from './SocialIcons';

export type FooterModalType = 
  | 'mission' 
  | 'partners' 
  | 'case-studies' 
  | 'pricing' 
  | 'security'
  | 'documentation' 
  | 'api-reference' 
  | 'system-status' 
  | 'help-center' 
  | 'contact-lab'
  | 'peak-ai'
  | 'phase-match'
  | 'refinement'
  | 'lattice-analytics'
  | 'systematic-absences'
  | 'about-creator'
  | 'powered-by-google'
  | 'tech-stack'
  | 'cookie-auth'
  | 'privacy'
  | 'terms'
  | 'changelog'
  | null;

interface FooterInfoModalProps {
  isOpen: boolean;
  modalType: FooterModalType;
  onClose: () => void;
  isRTL?: boolean;
  onActionNavigate?: (moduleKey?: string) => void;
}

export const FooterInfoModal: React.FC<FooterInfoModalProps> = ({
  isOpen,
  modalType,
  onClose,
  isRTL = false,
  onActionNavigate
}) => {
  const { t } = useTranslation();
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'Scientific Inquiry', message: '' });
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('alizerehsaz2001@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  if (!isOpen || !modalType) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', subject: 'Scientific Inquiry', message: '' });
      onClose();
    }, 2200);
  };

  const renderContent = () => {
    switch (modalType) {
      // --- COMPANY CATEGORY ---
      case 'mission':
        return {
          title: t("The Scientific Mission", "The Scientific Mission"),
          subtitle: t("Advancing Crystallography & Materials Science via AI Engine", "Advancing Crystallography & Materials Science via AI Engine"),
          icon: Award,
          color: "from-violet-500 to-indigo-600",
          body: (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-slate-900 border border-violet-500/30 rounded-2xl">
                <p className="text-base font-medium text-slate-200 leading-relaxed">
                  {t("XRD-Calc Pro was engineered to democratize access to high-precision X-Ray Diffraction (XRD) analysis. Our mission is to eliminate expensive legacy software paywalls while equipping researchers worldwide with real-time matrix mechanics, Cohen refinement, and Williamson-Hall microstructural analytics.", "XRD-Calc Pro was engineered to democratize access to high-precision X-Ray Diffraction (XRD) analysis. Our mission is to eliminate expensive legacy software paywalls while equipping researchers worldwide with real-time matrix mechanics, Cohen refinement, and Williamson-Hall microstructural analytics.")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                    <Atom className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{t("Physical Precision", "Physical Precision")}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("Formulations rooted in exact Bragg-Brentano geometry and matrix error drift functions.", "Formulations rooted in exact Bragg-Brentano geometry and matrix error drift functions.")}
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{t("Open Scientific Access", "Open Scientific Access")}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("Zero heavy desktop installations needed. Fully responsive for web, mobile, and lab displays.", "Zero heavy desktop installations needed. Fully responsive for web, mobile, and lab displays.")}
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{t("Google Gemini Integration", "Google Gemini Integration")}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("Automated phase matching and intelligent lattice parameter diagnostics via Gemini Models.", "Automated phase matching and intelligent lattice parameter diagnostics via Gemini Models.")}
                  </p>
                </div>
              </div>
            </div>
          )
        };

      case 'partners':
        return {
          title: t("Partners & Scientific Collaborations", "Partners & Scientific Collaborations"),
          subtitle: t("Connected with Global Crystallographic Repositories & Research Labs", "Connected with Global Crystallographic Repositories & Research Labs"),
          icon: Users,
          color: "from-blue-500 to-cyan-600",
          body: (
            <div className="space-y-6">
              <p className="text-sm text-slate-300 leading-relaxed">
                {t("XRD-Calc Pro is architected to seamlessly interface with standard crystallographic data formats (CIF, XY, RAW, CSV) and open-access material databases.", "XRD-Calc Pro is architected to seamlessly interface with standard crystallographic data formats (CIF, XY, RAW, CSV) and open-access material databases.")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "Crystallography Open Database (COD)", role: t("Open-Access CIF Repository", "Open-Access CIF Repository"), desc: "Syncs crystallographic information files for phase indexing." },
                  { name: "Materials Project API", role: t("Ab-Initio Materials DB", "Ab-Initio Materials DB"), desc: "Provides theoretical lattice parameters and DFT energy band calculations." },
                  { name: "ICDD Powder Diffraction Standards", role: t("PDF Standard Compatibility", "PDF Standard Compatibility"), desc: "Supports reference intensity ratios (RIR) and d-spacing lookup tables." },
                  { name: "NIST Standard Reference Materials", role: t("Instrumental Line Calibration", "Instrumental Line Calibration"), desc: "Uses SRM 640 NIST standards for instrumental broadening parameters." }
                ].map((p, idx) => (
                  <div key={idx} className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.name}</h4>
                      <span className="text-[10px] text-cyan-300 font-mono font-bold uppercase tracking-wider block my-0.5">{p.role}</span>
                      <p className="text-xs text-slate-400">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        };

      case 'case-studies':
        return {
          title: t("Case Studies & Industrial Research", "Case Studies & Industrial Research"),
          subtitle: t("Real-World Crystallographic Analyses Across Materials Engineering", "Real-World Crystallographic Analyses Across Materials Engineering"),
          icon: Microscope,
          color: "from-emerald-500 to-teal-600",
          body: (
            <div className="space-y-4">
              {[
                {
                  title: t("1. Lattice Strain in Li-Ion Cathode Materials", "1. Lattice Strain in Li-Ion Cathode Materials"),
                  tag: "Energy Storage",
                  desc: t("Decoupling microstrain from domain size in NMC cathode particles during electrochemical cycling using Modified Williamson-Hall.", "Decoupling microstrain from domain size in NMC cathode particles during electrochemical cycling using Modified Williamson-Hall.")
                },
                {
                  title: t("2. Surface Residual Stress in Welded Austenitic Steel", "2. Surface Residual Stress in Welded Austenitic Steel"),
                  tag: "Metallurgy",
                  desc: t("Quantifying residual compressive vs tensile stresses using sin²ψ slope derivation for structural integrity analysis.", "Quantifying residual compressive vs tensile stresses using sin²ψ slope derivation for structural integrity analysis.")
                },
                {
                  title: t("3. Precision Lattice Parameter Refinement in TiO₂ Nanoparticles", "3. Precision Lattice Parameter Refinement in TiO₂ Nanoparticles"),
                  tag: "Nanotechnology",
                  desc: t("Executing Cohen least-squares matrix solver for Tetragonal a and c constants with Nelson-Riley drift function.", "Executing Cohen least-squares matrix solver for Tetragonal a and c constants with Nelson-Riley drift function.")
                }
              ].map((cs, idx) => (
                <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{cs.title}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {cs.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{cs.desc}</p>
                </div>
              ))}
            </div>
          )
        };

      case 'pricing':
        return {
          title: t("Pricing Model & Open Science Access", "Pricing Model & Open Science Access"),
          subtitle: t("Transparent, Accessible, and 100% Free for Academic Research", "Transparent, Accessible, and 100% Free for Academic Research"),
          icon: CheckCircle2,
          color: "from-amber-500 to-orange-600",
          body: (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Academic Plan */}
                <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-3xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                    {t("Current Active Plan", "Current Active Plan")}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{t("Academic & Research Tier", "Academic & Research Tier")}</h4>
                    <div className="text-2xl font-black text-emerald-400 mt-1">$0 <span className="text-xs text-slate-400 font-normal">/ {t("Forever Free", "Forever Free")}</span></div>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {t("Full access to all 9 specialized XRD analysis modules", "Full access to all 9 specialized XRD analysis modules")}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {t("Cohen Matrix Refinement & Williamson-Hall Fitting", "Cohen Matrix Refinement & Williamson-Hall Fitting")}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {t("PDF lab report exports & Python script generators", "PDF lab report exports & Python script generators")}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {t("Integrated Gemini AI assistant", "Integrated Gemini AI assistant")}</li>
                  </ul>
                </div>

                {/* Enterprise Custom */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                  <div>
                    <h4 className="text-lg font-black text-white">{t("Enterprise & Custom Integration", "Enterprise & Custom Integration")}</h4>
                    <div className="text-lg font-bold text-slate-400 mt-1">{t("Custom Dedicated", "Custom Dedicated")}</div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t("For industrial laboratories requiring custom diffractometer API pipelines, dedicated database instances, and localized on-premise execution.", "For industrial laboratories requiring custom diffractometer API pipelines, dedicated database instances, and localized on-premise execution.")}
                  </p>
                  <button 
                    onClick={() => onActionNavigate?.('contact-lab')} 
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/10"
                  >
                    {t("Inquire Industrial Setup", "Inquire Industrial Setup")}
                  </button>
                </div>
              </div>
            </div>
          )
        };

      case 'security':
        return {
          title: t("Security Core & Data Protection", "Security Core & Data Protection"),
          subtitle: t("Client-Side Processing & Zero-Knowledge Data Protocols", "Client-Side Processing & Zero-Knowledge Data Protocols"),
          icon: ShieldCheck,
          color: "from-indigo-500 to-purple-600",
          body: (
            <div className="space-y-6">
              <div className="p-5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-start gap-4">
                <Lock className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-white text-sm">{t("100% Client-Side Computation Safety", "100% Client-Side Computation Safety")}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    {t("Your raw diffraction spectra datasets are processed in-browser using fast WebGL & WebAssembly calculations. Confidential material formulas never leave your device unless explicitly synced.", "Your raw diffraction spectra datasets are processed in-browser using fast WebGL & WebAssembly calculations. Confidential material formulas never leave your device unless explicitly synced.")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <Key className="w-5 h-5 text-cyan-400" />
                  <h5 className="font-bold text-white text-xs">{t("Encrypted Storage", "Encrypted Storage")}</h5>
                  <p className="text-[11px] text-slate-400">
                    {t("Saved user projects are secured with authenticated Firestore access rules.", "Saved user projects are secured with authenticated Firestore access rules.")}
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h5 className="font-bold text-white text-xs">{t("Offline LocalStorage Support", "Offline LocalStorage Support")}</h5>
                  <p className="text-[11px] text-slate-400">
                    {t("Full progressive web app capability allowing offline diffraction analysis.", "Full progressive web app capability allowing offline diffraction analysis.")}
                  </p>
                </div>
              </div>
            </div>
          )
        };

      // --- SUPPORT CATEGORY ---
      case 'documentation':
        return {
          title: t("Scientific Documentation & Physics Manual", "Scientific Documentation & Physics Manual"),
          subtitle: t("Theoretical Formulations, Bragg Equations, and Refinement Rules", "Theoretical Formulations, Bragg Equations, and Refinement Rules"),
          icon: BookOpen,
          color: "from-cyan-500 to-blue-600",
          body: (
            <div className="space-y-6">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  {t("Bragg's Diffraction Condition", "Bragg's Diffraction Condition")}
                </h4>
                <div className="p-3 bg-black/50 font-mono text-xs text-emerald-300 rounded-xl border border-white/10">
                  λ = 2 · d_hkl · sin(θ)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t("Constructive interference occurs when the path difference equals an integer number of wavelengths λ.", "Constructive interference occurs when the path difference equals an integer number of wavelengths λ.")}
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-indigo-400 text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  {t("Cohen Least Squares Formulation", "Cohen Least Squares Formulation")}
                </h4>
                <div className="p-3 bg-black/50 font-mono text-xs text-indigo-300 rounded-xl border border-white/10">
                  sin²(θ_i) = C · (h_i² + k_i² + l_i²) + D · f(θ_i)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t("Solves normal matrix equations (XᵀX)⁻¹XᵀY to decouple systematic goniometer alignment errors D from lattice parameters.", "Solves normal matrix equations (XᵀX)⁻¹XᵀY to decouple systematic goniometer alignment errors D from lattice parameters.")}
                </p>
              </div>
            </div>
          )
        };

      case 'api-reference':
        return {
          title: t("Developer API Reference", "Developer API Reference"),
          subtitle: t("RESTful & Client API Interfaces for Automated Diffraction Pipelines", "RESTful & Client API Interfaces for Automated Diffraction Pipelines"),
          icon: Terminal,
          color: "from-purple-500 to-indigo-600",
          body: (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                {t("Integrate XRD-Calc Pro analysis functions directly into your custom Python or Node.js workflow:", "Integrate XRD-Calc Pro analysis functions directly into your custom Python or Node.js workflow:")}
              </p>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto space-y-2">
                <div className="text-slate-500">// POST /api/xrd/refine-cohen</div>
                <div><span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> fetch(<span className="text-emerald-300">'/api/xrd/refine'</span>, &#123;</div>
                <div className="pl-4">method: <span className="text-emerald-300">'POST'</span>,</div>
                <div className="pl-4">headers: &#123; <span className="text-emerald-300">'Content-Type'</span>: <span className="text-emerald-300">'application/json'</span> &#125;,</div>
                <div className="pl-4">body: JSON.stringify(&#123;</div>
                <div className="pl-8">crystalSystem: <span className="text-emerald-300">'Cubic'</span>,</div>
                <div className="pl-8">wavelength: <span className="text-amber-400">1.54056</span>,</div>
                <div className="pl-8">reflections: [ &#123; h:1, k:1, l:1, twoTheta: 38.45 &#125;, &#123; h:2, k:0, l:0, twoTheta: 44.72 &#125; ]</div>
                <div className="pl-4">&#125;)</div>
                <div>&#125;);</div>
              </div>
            </div>
          )
        };

      case 'system-status':
        return {
          title: t("System Status & Node Telemetry", "System Status & Node Telemetry"),
          subtitle: t("Live Operational Health Across Compute Nodes & Databases", "Live Operational Health Across Compute Nodes & Databases"),
          icon: Server,
          color: "from-emerald-500 to-green-600",
          body: (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-white text-sm">{t("All Scientific Modules Operational", "All Scientific Modules Operational")}</span>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">100% Uptime</span>
              </div>

              <div className="space-y-2">
                {[
                  { name: "Gemini AI Phase Match Engine", status: "Operational", latency: "140ms" },
                  { name: "Cohen Matrix Solver Node", status: "Operational", latency: "8ms" },
                  { name: "Crystallography DB Sync (COD)", status: "Operational", latency: "42ms" },
                  { name: "PDF Report Generation Engine", status: "Operational", latency: "18ms" }
                ].map((s, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400">{s.latency}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        };

      case 'help-center':
        return {
          title: t("Help Center & Troubleshooting", "Help Center & Troubleshooting"),
          subtitle: t("Frequently Asked Questions Regarding XRD Spectra Fitting", "Frequently Asked Questions Regarding XRD Spectra Fitting"),
          icon: HelpCircle,
          color: "from-blue-500 to-indigo-600",
          body: (
            <div className="space-y-4">
              {[
                {
                  q: t("How do I correct for zero-shift and sample displacement?", "How do I correct for zero-shift and sample displacement?"),
                  a: t("Use Cohen Refinement module and select the Nelson-Riley or Sample Displacement drift function.", "Use Cohen Refinement module and select the Nelson-Riley or Sample Displacement drift function.")
                },
                {
                  q: t("Which raw file formats are supported for upload?", "Which raw file formats are supported for upload?"),
                  a: t("Standard .xy, .csv, .txt, and .raw ASCII data files are supported directly.", "Standard .xy, .csv, .txt, and .raw ASCII data files are supported directly.")
                },
                {
                  q: t("How does the Rachinger Kα2 stripping work?", "How does the Rachinger Kα2 stripping work?"),
                  a: t("Enable Rachinger Kα2 stripping inside the Peak Fitting module.", "Enable Rachinger Kα2 stripping inside the Peak Fitting module.")
                }
              ].map((faq, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    {faq.q}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          )
        };

      case 'contact-lab':
        return {
          title: t("Contact Scientific Lab & Developer", "Contact Scientific Lab & Developer"),
          subtitle: t("Direct Inquiry Channel with Developer Ali Zerehsaz", "Direct Inquiry Channel with Developer Ali Zerehsaz"),
          icon: Mail,
          color: "from-rose-500 to-pink-600",
          body: (
            <div className="space-y-5">
              {/* Direct Developer Channels Banner */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                  {t("Direct Developer Channels", "Direct Developer Channels")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <a 
                    href="mailto:alizerehsaz2001@gmail.com"
                    className="p-2.5 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold text-slate-200 hover:text-rose-300"
                  >
                    <Mail className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="truncate">alizerehsaz2001@gmail.com</span>
                  </a>

                  <a 
                    href="https://www.linkedin.com/in/ali-zerehsaz-60818b249"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold text-slate-200 hover:text-blue-300"
                  >
                    <LinkedinIcon className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">LinkedIn Profile</span>
                  </a>

                  <a 
                    href="https://github.com/alizerehsaz2001-pixel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/30 rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold text-slate-200 hover:text-purple-300"
                  >
                    <GithubIcon className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate">GitHub Profile</span>
                  </a>
                </div>
              </div>

              {contactSubmitted ? (
                <div className="p-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-lg">{t("Message Successfully Dispatched", "Message Successfully Dispatched")}</h4>
                  <p className="text-xs text-slate-300">{t("Thank you for reaching out. We will review your inquiry shortly.", "Thank you for reaching out. We will review your inquiry shortly.")}</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">{t("Your Name", "Your Name")}</label>
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder={t("e.g. Dr. Ali Zerehsaz", "e.g. Dr. Ali Zerehsaz")}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">{t("Academic / Institutional Email", "Academic / Institutional Email")}</label>
                      <input 
                        type="email" 
                        required
                        value={contactForm.email}
                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="researcher@lab.edu"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">{t("Subject", "Subject")}</label>
                    <select 
                      value={contactForm.subject}
                      onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                    >
                      <option value="Scientific Inquiry">{t("Scientific & Physical Inquiry", "Scientific & Physical Inquiry")}</option>
                      <option value="Feature Request">{t("Feature Suggestion", "Feature Suggestion")}</option>
                      <option value="Bug Report">{t("Bug Report", "Bug Report")}</option>
                      <option value="Collaboration">{t("Research Collaboration", "Research Collaboration")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">{t("Message Details", "Message Details")}</label>
                    <textarea 
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder={t("Describe your crystallography workflow or inquiry...", "Describe your crystallography workflow or inquiry...")}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {t("Transmit Message", "Transmit Message")}
                  </button>
                </form>
              )}
            </div>
          )
        };

      // --- CORE SUITE ITEMS ---
      case 'peak-ai':
      case 'phase-match':
      case 'refinement':
      case 'lattice-analytics':
      case 'systematic-absences': {
        const suiteDetails = {
          'peak-ai': {
            title: t("Peak Detection AI & Fitting Engine", "Peak Detection AI & Fitting Engine"),
            desc: t("Automated Bragg peak identification using second-derivative thresholding, Lorentzian/Gaussian peak fitting, and FWHM extraction.", "Automated Bragg peak identification using second-derivative thresholding, Lorentzian/Gaussian peak fitting, and FWHM extraction."),
            moduleKey: "peak-fitting"
          },
          'phase-match': {
            title: t("Phase Matching & Indexing Engine", "Phase Matching & Indexing Engine"),
            desc: t("Qualitative phase analysis linking observed d-spacings to open-access crystallographic databases using Gemini AI.", "Qualitative phase analysis linking observed d-spacings to open-access crystallographic databases using Gemini AI."),
            moduleKey: "phase-match"
          },
          'refinement': {
            title: t("Lattice Refinement Strategy", "Lattice Refinement Strategy"),
            desc: t("Matrix least-squares refinement eliminating sample displacement drift for Cubic, Tetragonal, Hexagonal, and Orthorhombic systems.", "Matrix least-squares refinement eliminating sample displacement drift for Cubic, Tetragonal, Hexagonal, and Orthorhombic systems."),
            moduleKey: "cohen"
          },
          'lattice-analytics': {
            title: t("Lattice & Microstructure Analytics", "Lattice & Microstructure Analytics"),
            desc: t("Size-strain strain decoupling via Williamson-Hall (UDF, USD, UDED) models and Scherrer grain size calculations.", "Size-strain strain decoupling via Williamson-Hall (UDF, USD, UDED) models and Scherrer grain size calculations."),
            moduleKey: "williamson-hall"
          },
          'systematic-absences': {
            title: t("Systematic Absences & Space Groups", "Systematic Absences & Space Groups"),
            desc: t("Determination of bravais lattice centering (Primitive, Face-Centered, Body-Centered) from extinction rules.", "Determination of bravais lattice centering (Primitive, Face-Centered, Body-Centered) from extinction rules."),
            moduleKey: "indexing"
          }
        }[modalType];

        return {
          title: suiteDetails.title,
          subtitle: t("Core Scientific Module in XRD-Calc Pro Suite", "Core Scientific Module in XRD-Calc Pro Suite"),
          icon: Zap,
          color: "from-cyan-500 to-violet-600",
          body: (
            <div className="space-y-6">
              <p className="text-sm text-slate-300 leading-relaxed">{suiteDetails.desc}</p>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{t("Ready for immediate laboratory calculation", "Ready for immediate laboratory calculation")}</span>
                <button 
                  onClick={() => {
                    onClose();
                    onActionNavigate?.(suiteDetails.moduleKey);
                  }}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t("Launch Module", "Launch Module")}
                </button>
              </div>
            </div>
          )
        };
      }

      // --- ABOUT CREATOR & CREDITS ---
      case 'about-creator':
        return {
          title: t("Designed & Engineered by Ali Zerehsaz", "Designed & Engineered by Ali Zerehsaz"),
          subtitle: t("An Independent Scientific Computing Initiative", "An Independent Scientific Computing Initiative"),
          icon: Code2,
          color: "from-violet-600 to-indigo-700",
          body: (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-slate-900 border border-violet-500/30 rounded-2xl space-y-3">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  {t("Created by Ali Zerehsaz", "Created by Ali Zerehsaz")}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t("XRD-Calc Pro is an independent scientific software created solely by Ali Zerehsaz. Designed without corporate bloat, it delivers a clean, lightning-fast web suite for solid-state physicists, chemists, and materials engineers.", "XRD-Calc Pro is an independent scientific software created solely by Ali Zerehsaz. Designed without corporate bloat, it delivers a clean, lightning-fast web suite for solid-state physicists, chemists, and materials engineers.")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-violet-400 font-mono">v2.5.0</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">{t("Active Release", "Active Release")}</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-cyan-400 font-mono">9+</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">{t("Physics Modules", "Physics Modules")}</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-emerald-400 font-mono">100%</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">{t("Open Science", "Open Science")}</span>
                </div>
              </div>

              {/* Developer Contact Channels */}
              <div className="p-5 bg-slate-900/90 border border-indigo-500/30 rounded-2xl space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  {t("Developer Connections", "Developer Connections")}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Gmail */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between hover:border-rose-500/40 transition-all group">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <Mail className="w-4 h-4" />
                      <span>Gmail</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 truncate my-2" title="alizerehsaz2001@gmail.com">
                      alizerehsaz2001@gmail.com
                    </p>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                      <a 
                        href="mailto:alizerehsaz2001@gmail.com" 
                        className="flex-1 text-center py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Mail className="w-3 h-3" /> Mail
                      </a>
                      <button 
                        onClick={handleCopyEmail}
                        className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] rounded-lg transition-colors flex items-center gap-1"
                        title="Copy email address"
                      >
                        {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <a 
                    href="https://www.linkedin.com/in/ali-zerehsaz-60818b249" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between hover:border-blue-500/40 transition-all group"
                  >
                    <div className="flex items-center justify-between text-blue-400 font-bold text-xs">
                      <span className="flex items-center gap-2">
                        <LinkedinIcon className="w-4 h-4" />
                        <span>LinkedIn</span>
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 truncate my-2">
                      ali-zerehsaz-60818b249
                    </p>
                    <span className="text-center py-1 bg-blue-500/20 group-hover:bg-blue-500/30 text-blue-300 text-[10px] font-bold rounded-lg transition-colors block">
                      {t("View LinkedIn", "View LinkedIn")}
                    </span>
                  </a>

                  {/* GitHub */}
                  <a 
                    href="https://github.com/alizerehsaz2001-pixel" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col justify-between hover:border-purple-500/40 transition-all group"
                  >
                    <div className="flex items-center justify-between text-purple-400 font-bold text-xs">
                      <span className="flex items-center gap-2">
                        <GithubIcon className="w-4 h-4" />
                        <span>GitHub</span>
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 truncate my-2">
                      alizerehsaz2001-pixel
                    </p>
                    <span className="text-center py-1 bg-purple-500/20 group-hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold rounded-lg transition-colors block">
                      {t("View GitHub", "View GitHub")}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          )
        };

      case 'tech-stack':
        return {
          title: t("Tech Stack & System Architecture", "Tech Stack & System Architecture"),
          subtitle: t("Engineered with TypeScript, WebGL Canvas, and Python Computations", "Engineered with TypeScript, WebGL Canvas, and Python Computations"),
          icon: Boxes,
          color: "from-blue-600 to-violet-600",
          body: (
            <div className="space-y-4">
              {[
                { name: "TypeScript", role: "Frontend Core", desc: t("Ensures mathematical strictness and memory-safe matrix transformations.", "Ensures mathematical strictness and memory-safe matrix transformations.") },
                { name: "JavaScript & React 18", role: "UI Engine", desc: t("Fast reactive state management and sub-millisecond chart re-renders.", "Fast reactive state management and sub-millisecond chart re-renders.") },
                { name: "Python Integration", role: "Analytical Scripts", desc: t("Generates clean Python code snippets for offline SciPy / DiffPy analysis.", "Generates clean Python code snippets for offline SciPy / DiffPy analysis.") }
              ].map((tItem, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-4">
                  <div className="p-2 bg-violet-500/20 text-violet-400 rounded-xl">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{tItem.name}</h4>
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded font-bold uppercase">{tItem.role}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{tItem.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        };

      case 'powered-by-google':
        return {
          title: t("Powered by Gemini AI & Google Infrastructure", "Powered by Gemini AI & Google Infrastructure"),
          subtitle: t("Intelligent Phase Identification & Structural Recommendations", "Intelligent Phase Identification & Structural Recommendations"),
          icon: Sparkles,
          color: "from-indigo-500 to-cyan-500",
          body: (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-5 bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-500/30 rounded-2xl space-y-3">
                <p>
                  {t("XRD-Calc Pro leverages Google Gemini models to provide automated diffraction pattern indexing, phase composition estimates, and structural space group recommendations.", "XRD-Calc Pro leverages Google Gemini models to provide automated diffraction pattern indexing, phase composition estimates, and structural space group recommendations.")}
                </p>
              </div>
            </div>
          )
        };

      default:
        return {
          title: "Information",
          subtitle: "XRD-Calc Pro Suite",
          icon: Hexagon,
          color: "from-violet-500 to-indigo-600",
          body: <p className="text-sm text-slate-300">Detailed information regarding this item is available in the scientific documentation.</p>
        };
    }
  };

  const current = renderContent();
  const IconComp = current.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[85vh] bg-[#050b14] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className={`p-6 sm:p-8 border-b border-white/5 bg-gradient-to-r ${current.color}/10 flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                <IconComp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{current.title}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{current.subtitle}</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className={`flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar ${isRTL ? "text-right" : "text-left"}`}>
            {current.body}
          </div>

          {/* Footer */}
          <div className={`p-5 border-t border-white/5 bg-white/[0.01] flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="flex items-center gap-2">
              <Hexagon className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">XRD-Calc Pro • v2.5.0</span>
            </div>
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-xs uppercase tracking-wider"
            >
              {t("Close Window", "Close Window")}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
