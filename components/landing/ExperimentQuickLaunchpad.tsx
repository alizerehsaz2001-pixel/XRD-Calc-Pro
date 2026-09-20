import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  ArrowRight, 
  Atom, 
  Activity, 
  Layers, 
  Cpu, 
  Scale, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Info,
  Flame,
  Binary
} from 'lucide-react';

export interface ExperimentPreset {
  id: string;
  titleEn: string;
  titleFa: string;
  categoryEn: string;
  categoryFa: string;
  formula: string;
  spaceGroup: string;
  crystalSystem: string;
  keyMetric: string;
  metricLabelEn: string;
  metricLabelFa: string;
  targetModule: string;
  color: string;
  accentBorder: string;
  glowColor: string;
  icon: React.ElementType;
  descriptionEn: string;
  descriptionFa: string;
  samplePeaks: { twoTheta: number; hkl: string; intensity: number; fwhm: number }[];
  equation: string;
  tags: string[];
}

export const EXPERIMENT_PRESETS: ExperimentPreset[] = [
  {
    id: 'silicon_nist',
    titleEn: 'NIST Silicon SRM 640f Standard',
    titleFa: 'استاندارد سیلیکون NIST SRM 640f',
    categoryEn: 'Calibration Benchmark',
    categoryFa: 'کالیبراسیون و انحراف صفر',
    formula: 'Si',
    spaceGroup: 'Fd-3m (#227)',
    crystalSystem: 'Cubic (Diamond)',
    keyMetric: '2θ = 28.44° (111)',
    metricLabelEn: 'Primary Reflection',
    metricLabelFa: 'بازتاب اصلی',
    targetModule: 'bragg',
    color: 'from-cyan-500/20 to-blue-500/10',
    accentBorder: 'border-cyan-500/30 hover:border-cyan-400',
    glowColor: 'rgba(34, 211, 238, 0.4)',
    icon: Atom,
    descriptionEn: 'Standard reference material for calibrating diffractometer zero-angle offset, goniometer alignment, and instrumental line broadening.',
    descriptionFa: 'ماده استاندارد مرجع جهت کالیبراسیون خطای زاویه صفر، تنظیم گونیومتر و سنجش پهن‌شدگی دستگاهی.',
    samplePeaks: [
      { twoTheta: 28.44, hkl: '(111)', intensity: 100, fwhm: 0.15 },
      { twoTheta: 47.30, hkl: '(220)', intensity: 55, fwhm: 0.18 },
      { twoTheta: 56.12, hkl: '(311)', intensity: 30, fwhm: 0.21 }
    ],
    equation: 'nλ = 2d_{hkl} \\sin\\theta \\quad (a = 5.43119 \\text{ Å})',
    tags: ['Cu-Kα', 'Instrument Calibration', 'Zero Shift', 'Cubic']
  },
  {
    id: 'zno_nanocrystals',
    titleEn: 'ZnO Nanocrystal Domain Sizing',
    titleFa: 'محاسبه ابعاد بلورک‌های نانوذرات ZnO',
    categoryEn: 'Scherrer Broadening',
    categoryFa: 'محاسبه پهن‌شدگی شرر',
    formula: 'ZnO',
    spaceGroup: 'P6_3mc (#186)',
    crystalSystem: 'Hexagonal (Wurtzite)',
    keyMetric: 'D = 22.4 nm (K=0.94)',
    metricLabelEn: 'Mean Domain Size',
    metricLabelFa: 'میانگین قطر بلورک',
    targetModule: 'scherrer',
    color: 'from-emerald-500/20 to-teal-500/10',
    accentBorder: 'border-emerald-500/30 hover:border-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    icon: Activity,
    descriptionEn: 'Calculate volume-weighted crystallite domain dimensions from the (100), (002), and (101) triplet peaks using Gaussian and Lorentzian deconvolution.',
    descriptionFa: 'محاسبه اندازه بلورک‌ها از سه‌گانه قله‌های (100)، (002) و (101) با جداسازی پهن‌شدگی دستگاهی و فرمول کلاسیک شرر.',
    samplePeaks: [
      { twoTheta: 31.77, hkl: '(100)', intensity: 57, fwhm: 0.42 },
      { twoTheta: 34.42, hkl: '(002)', intensity: 44, fwhm: 0.39 },
      { twoTheta: 36.25, hkl: '(101)', intensity: 100, fwhm: 0.45 }
    ],
    equation: 'D = \\frac{K \\lambda}{\\beta_{\\text{size}} \\cos\\theta}',
    tags: ['Nanomaterials', 'FWHM Analysis', 'Scherrer', 'Wurtzite']
  },
  {
    id: 'tio2_strain',
    titleEn: 'TiO₂ Anatase Microstrain Analysis',
    titleFa: 'تحلیل ریزکرنش شبکه TiO₂ آناتاز',
    categoryEn: 'Williamson-Hall Plot',
    categoryFa: 'نمودار ویلیامسون-هال',
    formula: 'TiO₂',
    spaceGroup: 'I4_1/amd (#141)',
    crystalSystem: 'Tetragonal',
    keyMetric: 'ε = 0.118 % (UDM)',
    metricLabelEn: 'Lattice Microstrain',
    metricLabelFa: 'ریزکرنش شبکه',
    targetModule: 'wh',
    color: 'from-violet-500/20 to-indigo-500/10',
    accentBorder: 'border-violet-500/30 hover:border-violet-400',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    icon: Layers,
    descriptionEn: 'Separate microstrain broadening from finite crystallite size using Uniform Deformation Model (UDM) and Uniform Stress Deformation Model (USDM).',
    descriptionFa: 'تفکیک اثرات ریزکرنش بلوری از اندازه دامنه با نمودار خطی ویلیامسون-هال و تعیین انرژی ذخیره شده در شبکه بلوری.',
    samplePeaks: [
      { twoTheta: 25.28, hkl: '(101)', intensity: 100, fwhm: 0.38 },
      { twoTheta: 37.80, hkl: '(004)', intensity: 22, fwhm: 0.43 },
      { twoTheta: 48.05, hkl: '(200)', intensity: 36, fwhm: 0.47 }
    ],
    equation: '\\beta \\cos\\theta = \\frac{K\\lambda}{D} + 4\\epsilon \\sin\\theta',
    tags: ['Microstrain', 'Uniform Deformation', 'Titania', 'Tetragonal']
  },
  {
    id: 'rir_mixture',
    titleEn: 'Quartz & Corundum Chung RIR',
    titleFa: 'آنالیز کمی فاز کوارتز و کوراندوم با روش RIR',
    categoryEn: 'Quantitative Phase (QPA)',
    categoryFa: 'آنالیز کمی فاز',
    formula: 'SiO₂ + Al₂O₃',
    spaceGroup: 'P3_221 / R-3c',
    crystalSystem: 'Hexagonal / Trigonal',
    keyMetric: 'I/I_cor = 3.41 (SiO₂)',
    metricLabelEn: 'Chung Matrix Ratio',
    metricLabelFa: 'نسبت ماتریس چانگ',
    targetModule: 'rir',
    color: 'from-amber-500/20 to-orange-500/10',
    accentBorder: 'border-amber-500/30 hover:border-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    icon: Scale,
    descriptionEn: 'Perform internal standard quantitative phase analysis (Chung method) without complex full-profile Rietveld convergence, accounting for absorption.',
    descriptionFa: 'محاسبه درصد وزنی دقیق فازها با استفاده از ضرایب شدت مرجع (RIR) چانگ بدون نیاز به پالایش پیچیده ساختاری.',
    samplePeaks: [
      { twoTheta: 26.64, hkl: 'SiO₂ (101)', intensity: 100, fwhm: 0.18 },
      { twoTheta: 35.15, hkl: 'Al₂O₃ (104)', intensity: 88, fwhm: 0.19 },
      { twoTheta: 43.36, hkl: 'Al₂O₃ (113)', intensity: 100, fwhm: 0.20 }
    ],
    equation: 'W_i = \\frac{I_i / \\text{RIR}_i}{\\sum_j (I_j / \\text{RIR}_j)}',
    tags: ['Chung Method', 'Phase Quantification', 'Internal Standard', 'Multi-Phase']
  },
  {
    id: 'ai_phase_id',
    titleEn: 'AI Neural Phase Identification',
    titleFa: 'شناسایی هوشمند فاز با شبکه عصبی عمیق',
    categoryEn: 'Deep Learning & COD',
    categoryFa: 'هوش مصنوعی و پایگاه COD',
    formula: 'Unknown Mix',
    spaceGroup: 'Multi-Phase Search',
    crystalSystem: 'All 7 Crystal Systems',
    keyMetric: '99.4% Match Rate',
    metricLabelEn: 'Top-1 Confidence',
    metricLabelFa: 'اطمینان پیش‌بینی',
    targetModule: 'dl',
    color: 'from-rose-500/20 to-pink-500/10',
    accentBorder: 'border-rose-500/30 hover:border-rose-400',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    icon: Cpu,
    descriptionEn: 'Autonomous convolutional pattern match against 1,200,000+ COD reference entries, resolving overlapping peaks and background noise.',
    descriptionFa: 'شناسایی خودکار قله‌ها و تطبیق ساختار با شبکه عصبی پیشرفته در میان بیش از ۱.۲ میلیون رکورد استاندارد بلورشناسی.',
    samplePeaks: [
      { twoTheta: 22.10, hkl: 'Phase A (110)', intensity: 45, fwhm: 0.28 },
      { twoTheta: 28.45, hkl: 'Phase B (111)', intensity: 100, fwhm: 0.22 },
      { twoTheta: 38.20, hkl: 'Phase A (211)', intensity: 62, fwhm: 0.31 }
    ],
    equation: 'P(c|X) = \\text{Softmax}(\\mathbf{W} \\cdot \\Phi(I_{2\\theta}))',
    tags: ['Deep Learning', 'COD Database', 'Noise Robust', 'Automated ID']
  }
];

interface Props {
  onLaunchExperiment: (targetModule: string) => void;
  onOpenTour: () => void;
  isRTL?: boolean;
}

export const ExperimentQuickLaunchpad: React.FC<Props> = ({
  onLaunchExperiment,
  onOpenTour,
  isRTL = false
}) => {
  const { t, i18n } = useTranslation();
  const [selectedId, setSelectedId] = useState<string>(EXPERIMENT_PRESETS[0].id);

  const activePreset = EXPERIMENT_PRESETS.find(p => p.id === selectedId) || EXPERIMENT_PRESETS[0];
  const ActiveIcon = activePreset.icon;

  return (
    <section className="py-12 px-6 relative z-10 border-b border-slate-900 bg-[#030712]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300">
                {t("1-Click Research Workflows", "1-Click Research Workflows")}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t("Instant Crystallography Benchmarks", "Instant Crystallography Benchmarks")}
            </h3>
            <p className="text-slate-400 text-sm font-medium mt-1 max-w-xl">
              {t("Explore pre-loaded laboratory standards. Inspect diffraction parameters and launch directly into the dedicated computation workbench.", "Explore pre-loaded laboratory standards. Inspect diffraction parameters and launch directly into the dedicated computation workbench.")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenTour}
              className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:border-violet-500/50"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>{t("4-Stage Tour Guide", "4-Stage Tour Guide")}</span>
            </button>
          </div>
        </div>

        {/* Interactive Experiment Switcher Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {EXPERIMENT_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedId;
            const Icon = preset.icon;

            return (
              <button
                key={preset.id}
                onClick={() => setSelectedId(preset.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.2)] ring-1 ring-cyan-400/50'
                    : 'bg-[#060B16]/60 border-white/5 hover:border-white/20 hover:bg-slate-900/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400" />
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30' : 'text-slate-500'
                  }`}>
                    {preset.formula}
                  </span>
                </div>

                <div>
                  <h4 className={`text-xs font-bold leading-tight mb-1 ${
                    isSelected ? 'text-white font-black' : 'text-slate-300'
                  }`}>
                    {i18n.language === 'fa' ? preset.titleFa : preset.titleEn}
                  </h4>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    {i18n.language === 'fa' ? preset.categoryFa : preset.categoryEn}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                  <span className={isSelected ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
                    {preset.keyMetric}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                    isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Preset Details Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePreset.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 sm:p-8 rounded-3xl bg-[#070D1C] border border-white/10 shadow-2xl relative overflow-hidden"
          >
            {/* Background Glow */}
            <div 
              className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
              style={{ backgroundColor: activePreset.glowColor }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Information & Description */}
              <div className="lg:col-span-7 space-y-4">
                
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {i18n.language === 'fa' ? activePreset.categoryFa : activePreset.categoryEn}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono">
                    {activePreset.spaceGroup}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                    {activePreset.crystalSystem}
                  </span>
                </div>

                <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {i18n.language === 'fa' ? activePreset.titleFa : activePreset.titleEn}
                </h4>

                <p className="text-slate-300 text-sm leading-relaxed">
                  {i18n.language === 'fa' ? activePreset.descriptionFa : activePreset.descriptionEn}
                </p>

                {/* Mathematical Equation & Tags */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                    <span className="text-slate-500 font-bold">Governing Law:</span>
                    <span className="bg-white/5 px-2 py-1 rounded-lg border border-white/5 text-white font-mono text-xs">
                      {activePreset.equation}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {activePreset.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Sample Reflection Peaks & Action CTA */}
              <div className="lg:col-span-5 bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-4">
                
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Characteristic Diffraction Peaks (Cu-Kα)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                </div>

                {/* Mini Peaks Table */}
                <div className="space-y-2">
                  {activePreset.samplePeaks.map((peak, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5 text-xs font-mono">
                      <span className="font-bold text-cyan-300">Reflection {peak.hkl}</span>
                      <span className="text-slate-300">2θ = {peak.twoTheta.toFixed(2)}°</span>
                      <span className="text-slate-400">Rel I = {peak.intensity}%</span>
                      <span className="text-violet-300">FWHM = {peak.fwhm}°</span>
                    </div>
                  ))}
                </div>

                {/* Launch Button */}
                <button
                  onClick={() => onLaunchExperiment(activePreset.targetModule)}
                  className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs font-mono shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
                >
                  <ActiveIcon className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
                  <span>Launch {activePreset.formula} in {activePreset.titleEn.split(' ')[0]} Studio</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-1 transition-transform" />
                </button>

              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
export default ExperimentQuickLaunchpad;
