import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  FileSpreadsheet, 
  Activity, 
  Atom, 
  Cpu, 
  CheckCircle2, 
  ExternalLink,
  BookOpen,
  FlaskConical,
  Layers
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (mode: 'login' | 'register', targetModule?: string) => void;
  isRTL?: boolean;
}

const TOUR_STEPS = [
  {
    step: 1,
    titleEn: '1. Ingestion & COD Standards',
    titleFa: '۱. بارگذاری داده و استانداردهای COD',
    descEn: 'Load your laboratory diffractograms in raw .xy, .csv, .dat, .cif formats, or query our local index of 1,200,000+ Crystallography Open Database (COD) phase standards.',
    descFa: 'داده‌های آزمایشگاهی خود را در قالب‌های .xy، .csv، .dat، .cif بارگذاری کنید یا در میان بیش از ۱.۲ میلیون استاندارد بلورشناسی پایگاه COD جستجو نمایید.',
    icon: FileSpreadsheet,
    badge: 'Step 1 • Ingestion',
    color: 'from-cyan-500 to-blue-500',
    targetModule: 'database',
    features: ['Universal File Drag & Drop', 'COD Instant Match', 'Multi-pattern Overlay']
  },
  {
    step: 2,
    titleEn: '2. Baseline & Doublet Stripping',
    titleFa: '۲. اصلاح خط مبنا و حذف Kα2',
    descEn: 'Automate polynomial background subtraction to eliminate amorphous sample holder humps, and strip Ka2 radiation doublets using the Rachinger-Ladell analytical algorithm.',
    descFa: 'حذف خودکار خط مبنای چندجمله‌ای برای حذف اثرات بی‌شکل و جداسازی دوتایی‌های پرتو Kα2 با استفاده از الگوریتم تحلیلی راشینگر.',
    icon: Activity,
    badge: 'Step 2 • Processing',
    color: 'from-violet-500 to-indigo-500',
    targetModule: 'wh',
    features: ['Adaptive Polynomial Baseline', 'Rachinger Kα2 Stripping', 'Automatic Peak Detection']
  },
  {
    step: 3,
    titleEn: '3. Nanocrystal Size & Strain',
    titleFa: '۳. اندازه بلورک و ریزکرنش شبکه',
    descEn: 'Calculate domain crystallite size D and lattice microstrain ε through standard Scherrer formula, Williamson-Hall (UDM/USDM/UDEDM), and Halder-Wagner plots.',
    descFa: 'محاسبه دقیق اندازه بلورک‌ها D و کرنش شبکه ε با استفاده از فرمول شرر، نمودارهای ویلیامسون-هال و هلدر-واگنر.',
    icon: Atom,
    badge: 'Step 3 • Microstructure',
    color: 'from-emerald-500 to-teal-500',
    targetModule: 'scherrer',
    features: ['Scherrer Shape Factors (K)', 'Williamson-Hall 3-Model Fit', 'Instrumental Broadening Calibration']
  },
  {
    step: 4,
    titleEn: '4. Rietveld & AI Phase Match',
    titleFa: '۴. پالایش ریتولد و تطبیق فاز هوشمند',
    descEn: 'Perform least-squares whole-pattern profile fitting (Rietveld), verify extinction conditions for all 230 space groups, and let AI identify unknown multi-phase mixtures.',
    descFa: 'پالایش کامل پروفایل به روش ریتولد، اعتبارسنجی شرایط خاموشی برای تمام ۲۳۰ گروه فضایی و شناسایی فازهای ناشناخته با هوش مصنوعی.',
    icon: Cpu,
    badge: 'Step 4 • Full Analysis',
    color: 'from-amber-500 to-rose-500',
    targetModule: 'bragg',
    features: ['Rietveld Profile Simulation', 'Space Group Extinction Validator', 'Multi-Phase Quantitative Analysis']
  }
];

export const WelcomeTourModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onLaunch,
  isRTL = false
}) => {
  const { t } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl -z-10"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#060B16] border border-white/15 rounded-[2.5rem] shadow-2xl p-6 sm:p-8 overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {t("XRD CalcPro Quick-Start Guide", "XRD CalcPro Quick-Start Guide")}
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  {t("4-Stage Academic Crystallography Workflow", "4-Stage Academic Crystallography Workflow")}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                    : idx < currentStepIndex
                    ? 'bg-violet-600/60'
                    : 'bg-slate-800'
                }`}
                title={s.titleEn}
              />
            ))}
          </div>

          {/* Active Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {currentStep.badge}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {currentStepIndex + 1} / {TOUR_STEPS.length}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentStep.color} p-0.5 shrink-0 shadow-lg`}>
                  <div className="w-full h-full bg-[#060B16] rounded-2xl flex items-center justify-center">
                    <StepIcon className="w-7 h-7 text-white" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-black text-white tracking-tight mb-2">
                    {t(currentStep.titleEn, currentStep.titleEn)}
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {t(currentStep.descEn, currentStep.descEn)}
                  </p>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {currentStep.features.map((feat, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-xs font-mono text-slate-300">{feat}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <button
                disabled={currentStepIndex === TOUR_STEPS.length - 1}
                onClick={() => setCurrentStepIndex(prev => Math.min(TOUR_STEPS.length - 1, prev + 1))}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onLaunch('login', currentStep.targetModule);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs font-mono shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <FlaskConical className="w-4 h-4 text-cyan-200" />
                <span>Launch This Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default WelcomeTourModal;
