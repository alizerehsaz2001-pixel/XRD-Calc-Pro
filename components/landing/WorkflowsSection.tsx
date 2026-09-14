import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  FileSpreadsheet, 
  Layers, 
  Microscope, 
  Brain, 
  ArrowRight, 
  Compass, 
  Box, 
  Cpu, 
  LineChart, 
  Target,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface WorkflowsSectionProps {
  onLaunchModule: (moduleId: string) => void;
  isRTL?: boolean;
}

export const WorkflowsSection: React.FC<WorkflowsSectionProps> = ({
  onLaunchModule,
  isRTL = false
}) => {
  const { t } = useTranslation();
  const workflows = [
    {
      id: 'powder_analysis',
      title: t('Experimental Powder Pattern Analysis', 'Experimental Powder Pattern Analysis'),
      subtitle: t('From Raw Specimen Scans to Refined Phase Quantification', 'From Raw Specimen Scans to Refined Phase Quantification'),
      color: 'from-violet-600/20 to-indigo-600/5',
      borderColor: 'border-violet-500/30 hover:border-violet-400',
      badge: t('Experimental Path', 'Experimental Path'),
      steps: [
        { name: 'Diffraction Compare', id: 'compare', desc: 'Overlay experimental XY/CSV data with COD crystal standards' },
        { name: 'Scherrer Domain Sizing', id: 'scherrer', desc: 'Determine mean crystallite dimensions via line broadening' },
        { name: 'Williamson-Hall Plot', id: 'wh', desc: 'Disentangle size broadening from lattice microstrain' },
        { name: 'Rietveld Refinement', id: 'rietveld', desc: 'Full-pattern profile fitting & structural parameter minimization' }
      ],
      primaryModule: 'rietveld'
    },
    {
      id: 'crystal_modeling',
      title: t('Crystal Lattice & Symmetry Modeling', 'Crystal Lattice & Symmetry Modeling'),
      subtitle: t('From 3D Bravais Cells to Reciprocal Metric Extinctions', 'From 3D Bravais Cells to Reciprocal Metric Extinctions'),
      color: 'from-cyan-600/20 to-blue-600/5',
      borderColor: 'border-cyan-500/30 hover:border-cyan-400',
      badge: t('Theoretical Path', 'Theoretical Path'),
      steps: [
        { name: 'Unit Cells 3D', id: 'unit_cells', desc: 'Inspect crystal system coordinates, packing, and atomic planes' },
        { name: 'Bragg Solver', id: 'bragg', desc: 'Calculate exact 2θ reflections for target X-ray wavelengths' },
        { name: 'Systematic Absences', id: 'selection', desc: 'Determine Bravais centering rules, glide planes, and screw axes' },
        { name: 'Metric Tensor', id: 'metric_tensor', desc: 'Reciprocal space vectors and interplanar angle computations' }
      ],
      primaryModule: 'unit_cells'
    },
    {
      id: 'thin_films_stress',
      title: t('Thin Films, Surface Coatings & Stress', 'Thin Films, Surface Coatings & Stress'),
      subtitle: t('From Kiessig Fringes to sin²ψ Residual Macrostrain', 'From Kiessig Fringes to sin²ψ Residual Macrostrain'),
      color: 'from-emerald-600/20 to-teal-600/5',
      borderColor: 'border-emerald-500/30 hover:border-emerald-400',
      badge: t('Nanomaterials Path', 'Nanomaterials Path'),
      steps: [
        { name: 'X-Ray Reflectivity (XRR)', id: 'xrr', desc: 'Measure film layer thickness, interface roughness & electron density' },
        { name: 'Residual Stress (sin²ψ)', id: 'residual_stress', desc: 'Biaxial in-plane surface stress tensor from lattice distortion' },
        { name: 'Double-Voigt Sizing', id: 'double_voigt', desc: 'True column-length distribution and physical peak shapes' },
        { name: 'AI Phase Identification', id: 'dl', desc: 'Automated phase matching with deep neural networks' }
      ],
      primaryModule: 'xrr'
    }
  ];

  return (
    <section id="workflows" className="py-24 px-6 relative z-10 border-t border-slate-800/80 bg-[#02050E]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300">
              {t("Guided Scientific Pipelines", "Guided Scientific Pipelines")}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            {t("Start by Your Research Goal", "Start by Your Research Goal")}
          </h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            {isRTL
              ? "مجموعه‌ای از ابزارهای به هم پیوسته برای پاسخ به دقیق‌ترین سوالات علمی آزمایشگاه شما."
              : "Choose a tailored research pipeline below to step seamlessly through your crystallographic workflow."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {workflows.map((wf, idx) => (
            <motion.div
              key={wf.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className={`bg-gradient-to-b ${wf.color} bg-[#060B18] border ${wf.borderColor} rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 shadow-xl`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                    {wf.badge}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">0{idx + 1}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 leading-snug">
                  {wf.title}
                </h3>
                <p className="text-xs text-slate-400 mb-6 font-medium leading-relaxed">
                  {wf.subtitle}
                </p>

                <div className="space-y-3 mb-8">
                  {wf.steps.map((step, stepIdx) => (
                    <div
                      key={step.id}
                      onClick={() => onLaunchModule(step.id)}
                      className="group/step p-3 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-violet-500/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400 shrink-0">
                          {stepIdx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 group-hover/step:text-cyan-300 transition-colors truncate">
                            {step.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover/step:text-cyan-300 group-hover/step:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onLaunchModule(wf.primaryModule)}
                className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Launch This Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
