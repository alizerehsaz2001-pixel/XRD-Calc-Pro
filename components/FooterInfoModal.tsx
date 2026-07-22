import React, { useState } from 'react';
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
  Sparkle
} from 'lucide-react';

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
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'Scientific Inquiry', message: '' });

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
          title: isRTL ? "ماموریت علمی XRD-Calc Pro" : "The Scientific Mission",
          subtitle: isRTL ? "پیشبرد مرزهای بلورشناسی و آنالیز مواد با هوش مصنوعی" : "Advancing Crystallography & Materials Science via AI Engine",
          icon: Award,
          color: "from-violet-500 to-indigo-600",
          body: (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-slate-900 border border-violet-500/30 rounded-2xl">
                <p className="text-base font-medium text-slate-200 leading-relaxed">
                  {isRTL 
                    ? "XRD-Calc Pro با هدف دموکراتیک‌سازی دسترسی به ابزارهای پیشرفته آنالیز پراش پرتو ایکس (XRD) خلق شده است. هدف ما حذف هزینه‌های سنگین لایسنس نرم‌افزارهای تجاری و ارائه محاسبات دقیق ماتریسی، پالایش کوهن و ویلیامسون-هال در قالب یک پلتفرم وب‌بیس سریع و امن است."
                    : "XRD-Calc Pro was engineered to democratize access to high-precision X-Ray Diffraction (XRD) analysis. Our mission is to eliminate expensive legacy software paywalls while equipping researchers worldwide with real-time matrix mechanics, Cohen refinement, and Williamson-Hall microstructural analytics."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                    <Atom className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{isRTL ? "دقت فیزیکی بالا" : "Physical Precision"}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isRTL ? "محاسبات مبتنی بر معادلات دقیق ساختار شبکه و تصحیح جابجایی خطای زاویه‌ای." : "Formulations rooted in exact Bragg-Brentano geometry and matrix error drift functions."}
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{isRTL ? "دسترسی آزاد برای همه" : "Open Scientific Access"}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isRTL ? "بدون نیاز به نصب سنگین، قابل اجرا در مرورگر موبایل، تبلت و کامپیوتر." : "Zero heavy desktop installations needed. Fully responsive for web, mobile, and lab displays."}
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{isRTL ? "هوش مصنوعی گوگل جکینی" : "Google Gemini Integration"}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isRTL ? "شناسایی خودکار فازهای کریستالی و ارائه پیشنهادهای تخصصی بلورشناسی." : "Automated phase matching and intelligent lattice parameter diagnostics via Gemini Models."}
                  </p>
                </div>
              </div>
            </div>
          )
        };

      case 'partners':
        return {
          title: isRTL ? "شرکا و همکاری‌های پژوهشی" : "Partners & Scientific Collaborations",
          subtitle: isRTL ? "شبکه ارتباطی با پایگاه‌های داده جهانی بلورشناسی" : "Connected with Global Crystallographic Repositories & Research Labs",
          icon: Users,
          color: "from-blue-500 to-cyan-600",
          body: (
            <div className="space-y-6">
              <p className="text-sm text-slate-300 leading-relaxed">
                {isRTL 
                  ? "XRD-Calc Pro به طور بومی با فرمت‌ها و استانداردهای متداول داده‌های پراش پرتو ایکس (مانند CIF, XY, RAW, CSV) سازگار بوده و با پایگاه‌های داده بین‌المللی کریستالوگرافی یکپارچه شده است."
                  : "XRD-Calc Pro is architected to seamlessly interface with standard crystallographic data formats (CIF, XY, RAW, CSV) and open-access material databases."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "Crystallography Open Database (COD)", role: isRTL ? "پایگاه داده باز بلورها" : "Open-Access CIF Repository", desc: "Syncs crystallographic information files for phase indexing." },
                  { name: "Materials Project API", role: isRTL ? "مرجع محاسبات کوانتومی مواد" : "Ab-Initio Materials DB", desc: "Provides theoretical lattice parameters and DFT energy band calculations." },
                  { name: "ICDD Powder Diffraction Standards", role: isRTL ? "استناد به استانداردهای PDF" : "PDF Standard Compatibility", desc: "Supports reference intensity ratios (RIR) and d-spacing lookup tables." },
                  { name: "NIST Standard Reference Materials", role: isRTL ? "کالیبراسیون استاندارد سیلیکون" : "Instrumental Line Calibration", desc: "Uses SRM 640 NIST standards for instrumental broadening parameters." }
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
          title: isRTL ? "مطالعات موردی و کاربردهای صنعتی" : "Case Studies & Industrial Research",
          subtitle: isRTL ? "تحلیل‌های واقعی در باتری‌ها، متالورژی و نانومواد" : "Real-World Crystallographic Analyses Across Materials Engineering",
          icon: Microscope,
          color: "from-emerald-500 to-teal-600",
          body: (
            <div className="space-y-4">
              {[
                {
                  title: isRTL ? "۱. آنالیز کرنش شبکه در الکترود باتری‌های لیتیوم-یون" : "1. Lattice Strain in Li-Ion Cathode Materials",
                  tag: "Energy Storage",
                  desc: isRTL 
                    ? "استفاده از روش ویلیامسون-هال (W-H) برای جداسازی اثر اندازه نانوکریستال‌ها از کرنش پسماند در لایه‌های NMC هنگام چرخه شارژ و دشارژ."
                    : "Decoupling microstrain from domain size in NMC cathode particles during electrochemical cycling using Modified Williamson-Hall."
                },
                {
                  title: isRTL ? "۲. تنش‌های پسماند سطحی در قطعات فولادی جوشکاری شده" : "2. Surface Residual Stress in Welded Austenitic Steel",
                  tag: "Metallurgy",
                  desc: isRTL 
                    ? "محاسبه تنش‌های پسماند کششی و فشاری با استفاده از تکنیک sin²ψ و اندازه دقیق تغییرات d-spacing."
                    : "Quantifying residual compressive vs tensile stresses using sin²ψ slope derivation for structural integrity analysis."
                },
                {
                  title: isRTL ? "۳. محاسبه دقیق ثابت شبکه آناتاز و روتیل در نانوذرات TiO₂" : "3. Precision Lattice Parameter Refinement in TiO₂ Nanoparticles",
                  tag: "Nanotechnology",
                  desc: isRTL 
                    ? "پالایش ماتریسی کوهن (Cohen Refinement) برای تعیین ثابت‌های a و c سیستم تتراگونال با تابع خطای نلسون-رایلی."
                    : "Executing Cohen least-squares matrix solver for Tetragonal a and c constants with Nelson-Riley drift function."
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
          title: isRTL ? "مدل قیمت‌گذاری و دسترسی علمی" : "Pricing Model & Open Science Access",
          subtitle: isRTL ? "کاملاً رایگان برای محققان و دانشگاهیان" : "Transparent, Accessible, and 100% Free for Academic Research",
          icon: CheckCircle2,
          color: "from-amber-500 to-orange-600",
          body: (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Academic Plan */}
                <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-3xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                    {isRTL ? "فعال برای همه" : "Current Active Plan"}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{isRTL ? "طرح پژوهشی و پژوهشگاه" : "Academic & Research Tier"}</h4>
                    <div className="text-2xl font-black text-emerald-400 mt-1">$0 <span className="text-xs text-slate-400 font-normal">/ {isRTL ? "همیشگی" : "Forever Free"}</span></div>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {isRTL ? "دسترسی کامل به تمام ۹ ماژول تخصصی XRD" : "Full access to all 9 specialized XRD analysis modules"}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {isRTL ? "پالایش ماتریسی کوهن و ویلیامسون-هال" : "Cohen Matrix Refinement & Williamson-Hall Fitting"}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {isRTL ? "خروجی گزارش PDF و اسکریپت‌های پایتون" : "PDF lab report exports & Python script generators"}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> {isRTL ? "دستیار هوش مصنوعی Gemini" : "Integrated Gemini AI assistant"}</li>
                  </ul>
                </div>

                {/* Enterprise Custom */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                  <div>
                    <h4 className="text-lg font-black text-white">{isRTL ? "سازمانی و آزمایشگاه‌های صنعتی" : "Enterprise & Custom Integration"}</h4>
                    <div className="text-lg font-bold text-slate-400 mt-1">{isRTL ? "سفارشی" : "Custom Dedicated"}</div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isRTL 
                      ? "برای آزمایشگاه‌های صنعتی که نیازمند اتصال مستقیم دستگاه XRD (پروتکل‌های متصل به diffractometer) و سرورهای اختصاصی درون‌سازمانی هستند."
                      : "For industrial laboratories requiring custom diffractometer API pipelines, dedicated database instances, and localized on-premise execution."}
                  </p>
                  <button 
                    onClick={() => onActionNavigate?.('contact-lab')} 
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors border border-white/10"
                  >
                    {isRTL ? "درخواست پشتیبانی اختصاصی" : "Inquire Industrial Setup"}
                  </button>
                </div>
              </div>
            </div>
          )
        };

      case 'security':
        return {
          title: isRTL ? "هسته امنیت و حریم خصوصی داده‌ها" : "Security Core & Data Protection",
          subtitle: isRTL ? "پردازش محلی k-space و امنیت اطلاعات پژوهشی" : "Client-Side Processing & Zero-Knowledge Data Protocols",
          icon: ShieldCheck,
          color: "from-indigo-500 to-purple-600",
          body: (
            <div className="space-y-6">
              <div className="p-5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-start gap-4">
                <Lock className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-white text-sm">{isRTL ? "محاسبات تماماً سمت کلاینت" : "100% Client-Side Computation Safety"}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    {isRTL 
                      ? "تمام محاسبات پیچیده ریاضی، فیتینگ نوسانات، ماتریس‌های کوهن و تبدیل الگوریتمی فایل‌های داده به طور مستقیم درون مرورگر شما اجرا می‌شوند. فایل‌های خام داده‌های آزمایشگاهی شما هرگز بدون اجازه شما آپلود یا فروخته نمی‌شوند."
                      : "Your raw diffraction spectra datasets are processed in-browser using fast WebGL & WebAssembly calculations. Confidential material formulas never leave your device unless explicitly synced."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <Key className="w-5 h-5 text-cyan-400" />
                  <h5 className="font-bold text-white text-xs">{isRTL ? "پروتکل Firebase SSL & Security Rules" : "Encrypted Storage"}</h5>
                  <p className="text-[11px] text-slate-400">
                    {isRTL ? "پروژه‌های ذخیره‌شده شما با قوانین سخت‌گیرانه Firebase Firestore محافظت می‌شوند." : "Saved user projects are secured with authenticated Firestore access rules."}
                  </p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h5 className="font-bold text-white text-xs">{isRTL ? "ذخیره‌سازی محلی و آفلاین" : "Offline LocalStorage Support"}</h5>
                  <p className="text-[11px] text-slate-400">
                    {isRTL ? "قابلیت کارکرد کامل بدون اینترنت پس از بارگذاری اولیه برنامه." : "Full progressive web app capability allowing offline diffraction analysis."}
                  </p>
                </div>
              </div>
            </div>
          )
        };

      // --- SUPPORT CATEGORY ---
      case 'documentation':
        return {
          title: isRTL ? "مستندات علمی و راهنمای فیزیک" : "Scientific Documentation & Physics Manual",
          subtitle: isRTL ? "تئوری و معادلات به کار رفته در پلتفرم XRD-Calc Pro" : "Theoretical Formulations, Bragg Equations, and Refinement Rules",
          icon: BookOpen,
          color: "from-cyan-500 to-blue-600",
          body: (
            <div className="space-y-6">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  {isRTL ? "قانون پراش براگ (Bragg's Law)" : "Bragg's Diffraction Condition"}
                </h4>
                <div className="p-3 bg-black/50 font-mono text-xs text-emerald-300 rounded-xl border border-white/10">
                  λ = 2 · d_hkl · sin(θ)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isRTL 
                    ? "شرکت‌پذیری تداخل سازنده امواج پرتو ایکس پراکنده شده از صفحات کریستالی با فاصله بین‌صفحه‌ای d."
                    : "Constructive interference occurs when the path difference equals an integer number of wavelengths λ."}
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-indigo-400 text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  {isRTL ? "پالایش ماتریسی کوهن (Cohen's Method)" : "Cohen Least Squares Formulation"}
                </h4>
                <div className="p-3 bg-black/50 font-mono text-xs text-indigo-300 rounded-xl border border-white/10">
                  sin²(θ_i) = C · (h_i² + k_i² + l_i²) + D · f(θ_i)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isRTL 
                    ? "روش کمترین مربعات خطی برای اصلاح خطاهای سیستماتیک زاویه‌ای (مانند جابجایی نمونه) و استخراج ثابت‌های شبکه a, b, c."
                    : "Solves normal matrix equations (XᵀX)⁻¹XᵀY to decouple systematic goniometer alignment errors D from lattice parameters."}
                </p>
              </div>
            </div>
          )
        };

      case 'api-reference':
        return {
          title: isRTL ? "راهنمای API و یکپارچه‌سازی" : "Developer API Reference",
          subtitle: isRTL ? "نحوه ارسال داده‌های طیف و دریافت اتوماتیک تحلیل‌ها" : "RESTful & Client API Interfaces for Automated Diffraction Pipelines",
          icon: Terminal,
          color: "from-purple-500 to-indigo-600",
          body: (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                {isRTL 
                  ? "می‌توانید داده‌های خام (طیف 2θ و شدت) را به ورودی‌های ماژول‌ها پاس داده و ثابت‌های شبکه را به صورت JSON دریافت کنید:"
                  : "Integrate XRD-Calc Pro analysis functions directly into your custom Python or Node.js workflow:"}
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
          title: isRTL ? "وضعیت سرورها و شبکه پردازش" : "System Status & Node Telemetry",
          subtitle: isRTL ? "وضعیت زنده تمام سرویس‌ها و ماژول‌های ریاضی" : "Live Operational Health Across Compute Nodes & Databases",
          icon: Server,
          color: "from-emerald-500 to-green-600",
          body: (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-white text-sm">{isRTL ? "تمام سیستم‌ها فعال و بدون اختلال هستند" : "All Scientific Modules Operational"}</span>
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
          title: isRTL ? "مرکز راهنما و پاسخ به سوالات متداول" : "Help Center & Troubleshooting",
          subtitle: isRTL ? "حل مشکلات متداول در آنالیز طیف پراش" : "Frequently Asked Questions Regarding XRD Spectra Fitting",
          icon: HelpCircle,
          color: "from-blue-500 to-indigo-600",
          body: (
            <div className="space-y-4">
              {[
                {
                  q: isRTL ? "چگونه خطای جابجایی زاویه‌ای goniometer را حذف کنیم؟" : "How do I correct for zero-shift and sample displacement?",
                  a: isRTL ? "از ماژول Cohen Refinement استفاده کنید و تابع خطای Nelson-Riley یا Sample Displacement را انتخاب کنید." : "Use Cohen Refinement module and select the Nelson-Riley or Sample Displacement drift function."
                },
                {
                  q: isRTL ? "فرمت‌های فایل پشتیبانی شده کدامند؟" : "Which raw file formats are supported for upload?",
                  a: isRTL ? "فایل‌های .xy, .csv, .txt و .raw به طور مستقیم پشتیبانی می‌شوند." : "Standard .xy, .csv, .txt, and .raw ASCII data files are supported directly."
                },
                {
                  q: isRTL ? "جداسازی Kα1 و Kα2 چگونه انجام می‌شود؟" : "How does the Rachinger Kα2 stripping work?",
                  a: isRTL ? "از ماژول Peak Fitting گزینه Kα2 Stripping را فعال کنید تا doublet‌ها جداسازی شوند." : "Enable Rachinger Kα2 stripping inside the Peak Fitting module."
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
          title: isRTL ? "ارتباط با آزمایشگاه و توسعه‌دهنده" : "Contact Scientific Lab & Developer",
          subtitle: isRTL ? "ارسال پیام مستقیم به علی زره‌ساز" : "Direct Inquiry Channel with Developer Ali Zerehsaz",
          icon: Mail,
          color: "from-rose-500 to-pink-600",
          body: (
            <div>
              {contactSubmitted ? (
                <div className="p-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-lg">{isRTL ? "پیام شما با موفقیت دریافت شد" : "Message Successfully Dispatched"}</h4>
                  <p className="text-xs text-slate-300">{isRTL ? "از ارتباط شما متشکریم. پاسخ به ایمیل شما ارسال خواهد شد." : "Thank you for reaching out. We will review your inquiry shortly."}</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">{isRTL ? "نام و نام خانوادگی" : "Your Name"}</label>
                      <input 
                        type="text" 
                        required
                        value={contactForm.name}
                        onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder={isRTL ? "مثال: دکتر علی زره‌ساز" : "e.g. Dr. Ali Zerehsaz"}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">{isRTL ? "ایمیل دانشگاهی / شغلی" : "Academic / Institutional Email"}</label>
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
                    <label className="block text-xs font-bold text-slate-400 mb-1">{isRTL ? "موضوع پیام" : "Subject"}</label>
                    <select 
                      value={contactForm.subject}
                      onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                    >
                      <option value="Scientific Inquiry">{isRTL ? "پرسش علمی و فیزیکی" : "Scientific & Physical Inquiry"}</option>
                      <option value="Feature Request">{isRTL ? "پیشنهاد ماژول جدید" : "Feature Suggestion"}</option>
                      <option value="Bug Report">{isRTL ? "گزارش باگ یا خطا" : "Bug Report"}</option>
                      <option value="Collaboration">{isRTL ? "همکاری پژوهشی" : "Research Collaboration"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">{isRTL ? "متن پیام" : "Message Details"}</label>
                    <textarea 
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder={isRTL ? "توضیحات سوال یا درخواست خود را بنویسید..." : "Describe your crystallography workflow or inquiry..."}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isRTL ? "ارسال مستقیم به آزمایشگاه" : "Transmit Message"}
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
            title: isRTL ? "هوش مصنوعی تشخیص و الگوریتم فیتینگ پیک‌ها" : "Peak Detection AI & Fitting Engine",
            desc: isRTL ? "تشخیص اتوماتیک پیک‌های طیف پراش با الگوریتم‌های Savitzky-Golay، جداسازی هم‌پوشانی‌ها و محاسبات FWHM." : "Automated Bragg peak identification using second-derivative thresholding, Lorentzian/Gaussian peak fitting, and FWHM extraction.",
            moduleKey: "peak-fitting"
          },
          'phase-match': {
            title: isRTL ? "موتور انطباق و شناسایی فاز کریستالی" : "Phase Matching & Indexing Engine",
            desc: isRTL ? "مقایسه فواصل بین‌صفحه‌ای (d-spacing) و شدت‌های نسبی با فایل‌های مرجع جهت شناسایی کیفی ترکیبات." : "Qualitative phase analysis linking observed d-spacings to open-access crystallographic databases using Gemini AI.",
            moduleKey: "phase-match"
          },
          'refinement': {
            title: isRTL ? "استراتژی پالایش ماتریسی کوهن و ریتولد" : "Lattice Refinement Strategy",
            desc: isRTL ? "پالایش دقیق پارامترهای شبکه سیستم‌های کریستالی شش‌گانه با ماتریس‌های کمترین مربعات و حذف خطای صفر." : "Matrix least-squares refinement eliminating sample displacement drift for Cubic, Tetragonal, Hexagonal, and Orthorhombic systems.",
            moduleKey: "cohen"
          },
          'lattice-analytics': {
            title: isRTL ? "آنالیز میکروستراکچر و کرنش شبکه (Williamson-Hall)" : "Lattice & Microstructure Analytics",
            desc: isRTL ? "جداسازی پهن‌شدگی ناشی از اندازه کریستالیت از پهن‌شدگی ناشی از کرنش شبکه با نمودارهای W-H." : "Size-strain strain decoupling via Williamson-Hall (UDF, USD, UDED) models and Scherrer grain size calculations.",
            moduleKey: "williamson-hall"
          },
          'systematic-absences': {
            title: isRTL ? "خاموشی‌های سیستماتیک و گروه‌های فضایی" : "Systematic Absences & Space Groups",
            desc: isRTL ? "تعیین نوع تمرکز شبکه (P, F, I, C) و گروه‌های فضایی با بررسی قواعد بازتاب‌های مجاز Miller (hkl)." : "Determination of bravais lattice centering (Primitive, Face-Centered, Body-Centered) from extinction rules.",
            moduleKey: "indexing"
          }
        }[modalType];

        return {
          title: suiteDetails.title,
          subtitle: isRTL ? "یکی از ماژول‌های اصلی مجموعه علمی XRD-Calc Pro" : "Core Scientific Module in XRD-Calc Pro Suite",
          icon: Zap,
          color: "from-cyan-500 to-violet-600",
          body: (
            <div className="space-y-6">
              <p className="text-sm text-slate-300 leading-relaxed">{suiteDetails.desc}</p>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{isRTL ? "آماده اجرا در محیط آزمایشگاهی" : "Ready for immediate laboratory calculation"}</span>
                <button 
                  onClick={() => {
                    onClose();
                    onActionNavigate?.(suiteDetails.moduleKey);
                  }}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {isRTL ? "ورود به ماژول" : "Launch Module"}
                </button>
              </div>
            </div>
          )
        };
      }

      // --- ABOUT CREATOR & CREDITS ---
      case 'about-creator':
        return {
          title: isRTL ? "درباره علی زره‌ساز و این پروژه مستقل" : "Designed & Engineered by Ali Zerehsaz",
          subtitle: isRTL ? "یک پروژه علمی کاملاً مستقل و پیشرو در محاسبات مواد" : "An Independent Scientific Computing Initiative",
          icon: Code2,
          color: "from-violet-600 to-indigo-700",
          body: (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-slate-900 border border-violet-500/30 rounded-2xl space-y-3">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  {isRTL ? "خلق شده توسط علی زره‌ساز" : "Created by Ali Zerehsaz"}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isRTL 
                    ? "XRD-Calc Pro یک پروژه کاملاً مستقل است که توسط علی زره‌ساز و بدون حمایت از سوی تیم‌های تجاری بزرگ طراحی و پیاده‌سازی شده است. این ابزار با ترکیب دانش کریستالوگرافی، جبر ماتریسی و وب مدرن، به دنبال ساده‌سازی محاسبات پیچیده فیزیک حالت جامد است."
                    : "XRD-Calc Pro is an independent scientific software created solely by Ali Zerehsaz. Designed without corporate bloat, it delivers a clean, lightning-fast web suite for solid-state physicists, chemists, and materials engineers."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-violet-400 font-mono">v2.5.0</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">{isRTL ? "نسخه فعال" : "Active Release"}</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-cyan-400 font-mono">9+</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">{isRTL ? "ماژول فیزیک" : "Physics Modules"}</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-emerald-400 font-mono">100%</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">{isRTL ? "دسترسی آزاد" : "Open Science"}</span>
                </div>
              </div>
            </div>
          )
        };

      case 'tech-stack':
        return {
          title: isRTL ? "پشته فناوری و معماری نرم‌افزار" : "Tech Stack & System Architecture",
          subtitle: isRTL ? "اجرای سریع و تایپ‌امن با TypeScript, JavaScript و Python" : "Engineered with TypeScript, WebGL Canvas, and Python Computations",
          icon: Boxes,
          color: "from-blue-600 to-violet-600",
          body: (
            <div className="space-y-4">
              {[
                { name: "TypeScript", role: "Frontend Core", desc: isRTL ? "تایپ‌دهی قوی و ساختار امن برای محاسبات ماتریسی پیچیده و حالت‌های برنامه." : "Ensures mathematical strictness and memory-safe matrix transformations." },
                { name: "JavaScript & React 18", role: "UI Engine", desc: isRTL ? "رابط کاربری فوق‌العاده پویا، پاسخگو و تعاملی با کتابخانه‌های Recharts." : "Fast reactive state management and sub-millisecond chart re-renders." },
                { name: "Python Integration", role: "Analytical Scripts", desc: isRTL ? "تولید اسکریپت‌های تحلیلی پایتون جهت پردازش داده‌های XRD با SciPy و NumPy." : "Generates clean Python code snippets for offline SciPy / DiffPy analysis." }
              ].map((t, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-4">
                  <div className="p-2 bg-violet-500/20 text-violet-400 rounded-xl">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{t.name}</h4>
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded font-bold uppercase">{t.role}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        };

      case 'powered-by-google':
        return {
          title: isRTL ? "قدرت‌گرفته از هوش مصنوعی Gemini و گوگل" : "Powered by Gemini AI & Google Infrastructure",
          subtitle: isRTL ? "یکپارچه‌سازی نسل جدید مدل‌های هوش مصنوعی با فیزیک بلورها" : "Intelligent Phase Identification & Structural Recommendations",
          icon: Sparkles,
          color: "from-indigo-500 to-cyan-500",
          body: (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-5 bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-500/30 rounded-2xl space-y-3">
                <p>
                  {isRTL 
                    ? "XRD-Calc Pro از هوش مصنوعی Google Gemini جهت تفسیر خودکار الگوهای پراش، تطبیق پیک‌های مجهول با ساختار کریستالی مواد، و ارائه پیشنهادات تخصصی پالایش پارامترهای شبکه استفاده می‌کند."
                    : "XRD-Calc Pro leverages Google Gemini models to provide automated diffraction pattern indexing, phase composition estimates, and structural space group recommendations."}
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
              {isRTL ? "بستن پنجره" : "Close Window"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
