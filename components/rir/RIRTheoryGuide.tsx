import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Sparkles,
  Layers,
  Calculator,
  Grid,
  ShieldAlert,
  Scale,
  FlaskConical,
  HelpCircle,
  Zap,
  Activity,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export const RIRTheoryGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'chung' | 'matrix' | 'error' | 'internal' | 'mac'>('chung');

  const renderMathBlock = (tex: string) => (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 shadow-inner flex justify-center overflow-x-auto my-3 prose prose-invert prose-p:my-0 prose-math:text-emerald-400">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {`$$${tex}$$`}
      </ReactMarkdown>
    </div>
  );

  const TABS = [
    { id: 'chung', label: 'Chung Adiabatic', icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: 'matrix', label: 'Matrix Formalism', icon: <Grid className="w-3.5 h-3.5" /> },
    { id: 'error', label: 'Jacobian Covariance', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'internal', label: 'Spiking & Amorphous', icon: <Fingerprint className="w-3.5 h-3.5" /> },
    { id: 'mac', label: 'Volumetric & MAC', icon: <Layers className="w-3.5 h-3.5" /> }
  ] as const;

  return (
    <div className="bg-gradient-to-br from-slate-900/95 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 text-slate-100 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-2xl blur group-hover:blur-md transition-all" />
            <BookOpen className="w-6 h-6 relative z-10" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              Theoretical Foundation <Sparkles className="w-4 h-4 text-emerald-400" />
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
              Rigorous derivation of Chung's adiabatic flushing method, matrix algebraic formulations, Jacobian error propagation, and absorption corrections.
            </p>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1.5 shadow-inner relative z-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { playSynthTone('tick'); setActiveSection(tab.id); }}
            className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeSection === tab.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area with Animation */}
      <div className="relative z-10 min-h-[350px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.25 }}
            className="space-y-6 text-sm text-slate-300 leading-relaxed"
          >
            {activeSection === 'chung' && (
              <>
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 shadow-sm hover:border-emerald-500/20 transition-colors">
                  <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                    <Zap className="w-4 h-4" /> The Klug-Alexander General Intensity Equation
                  </h3>
                  <p className="text-[13px] text-slate-400">
                    The integrated intensity <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded">I_i</code> of a diffraction peak from crystalline phase <code className="text-emerald-300 bg-emerald-500/10 px-1 rounded">i</code> in a multi-phase mixture is governed by:
                  </p>
                  {renderMathBlock('I_i = \\frac{K_i \\cdot W_i}{\\rho_i \\cdot \\mu_m^*}')}
                  <p className="text-[13px] text-slate-400">
                    where <code className="text-slate-200">W_i</code> is the weight fraction of phase <code className="text-slate-200">i</code>, <code className="text-slate-200">\rho_i</code> is its crystallographic density, <code className="text-slate-200">K_i</code> is a structure factor and instrument proportionality constant, and <code className="text-slate-200">\mu_m^*</code> is the total mass attenuation coefficient (MAC) of the mixture.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 shadow-sm hover:border-emerald-500/20 transition-colors">
                  <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                    <Scale className="w-4 h-4" /> Chung's Elimination of Matrix Absorption
                  </h3>
                  <p className="text-[13px] text-slate-400">
                    In 1974, F. H. Chung demonstrated that when all crystalline components in a sample are identified and the sum of crystalline fractions equals 100% (<ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\sum W_i = 1$`}</ReactMarkdown>), the unknown mixture absorption <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\mu_m^*$`}</ReactMarkdown> cancels out completely when dividing each phase intensity by its Reference Intensity Ratio (<ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$RIR_i = I_i / I_c$`}</ReactMarkdown> relative to Corundum α-Al₂O₃):
                  </p>
                  {renderMathBlock('W_i = \\frac{\\frac{I_i}{RIR_i}}{\\sum_{j=1}^n \\frac{I_j}{RIR_j}}')}
                </div>
              </>
            )}

            {activeSection === 'matrix' && (
              <>
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 shadow-sm hover:border-emerald-500/20 transition-colors">
                  <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                    <Grid className="w-4 h-4" /> Vector & Matrix Representation
                  </h3>
                  <p className="text-[13px] text-slate-400">
                    Let <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\mathbf{I} = [I_1, I_2, \\dots, I_n]^T$`}</ReactMarkdown> be the vector of observed Bragg peak intensities and <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\mathbf{K} = [K_1, K_2, \\dots, K_n]^T$`}</ReactMarkdown> be the vector of RIR constants. We define the diagonal scaling matrix <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\mathbf{K}^{-1}$`}</ReactMarkdown>:
                  </p>
                  {renderMathBlock('\\mathbf{K}^{-1} = \\begin{bmatrix} 1/K_1 & 0 & \\dots & 0 \\\\ 0 & 1/K_2 & \\dots & 0 \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ 0 & 0 & \\dots & 1/K_n \\end{bmatrix}')}
                  <p className="text-[13px] text-slate-400">
                    The reduced intensity vector is defined as <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\tilde{\\mathbf{I}} = \\mathbf{K}^{-1} \\mathbf{I}$`}</ReactMarkdown>. The scalar total reduced intensity <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$S$`}</ReactMarkdown> is given by the inner product with the all-ones vector <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\mathbf{1}$`}</ReactMarkdown>:
                  </p>
                  {renderMathBlock('S = \\mathbf{1}^T \\tilde{\\mathbf{I}} = \\mathbf{1}^T \\mathbf{K}^{-1} \\mathbf{I} = \\sum_{k=1}^n \\frac{I_k}{K_k}')}
                  <p className="text-[13px] text-slate-400">
                    The normalized weight fraction vector <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\mathbf{w}$`}</ReactMarkdown> is thus:
                  </p>
                  {renderMathBlock('\\mathbf{w} = \\frac{1}{S} \\tilde{\\mathbf{I}} = \\frac{\\mathbf{K}^{-1} \\mathbf{I}}{\\mathbf{1}^T \\mathbf{K}^{-1} \\mathbf{I}}')}
                </div>
              </>
            )}

            {activeSection === 'error' && (
              <>
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 shadow-sm hover:border-emerald-500/20 transition-colors">
                  <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                    <Activity className="w-4 h-4" /> Multivariate Analytical Error Propagation
                  </h3>
                  <p className="text-[13px] text-slate-400">
                    Because the normalization constraint creates cross-phase statistical correlations (<ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\sum w_i = 1$`}</ReactMarkdown>), naive independent error propagation is mathematically invalid. We compute the exact Jacobian tensor:
                  </p>
                  {renderMathBlock('J_{I, ij} = \\frac{\\partial w_i}{\\partial I_j} = \\frac{1}{S \\cdot K_j} (\\delta_{ij} - w_i)')}
                  {renderMathBlock('J_{K, ij} = \\frac{\\partial w_i}{\\partial K_j} = -\\frac{w_i}{K_j} (\\delta_{ij} - w_j)')}
                  <p className="text-[13px] text-slate-400">
                    Applying the generalized tensor covariance transformation yields the complete <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$n \\times n$`}</ReactMarkdown> covariance matrix:
                  </p>
                  {renderMathBlock('\\mathbf{\\Sigma}_{\\mathbf{w}} = \\mathbf{J}_{\\mathbf{I}} \\mathbf{\\Sigma}_{\\mathbf{I}} \\mathbf{J}_{\\mathbf{I}}^T + \\mathbf{J}_{\\mathbf{K}} \\mathbf{\\Sigma}_{\\mathbf{K}} \\mathbf{J}_{\\mathbf{K}}^T')}
                </div>
              </>
            )}

            {activeSection === 'internal' && (
              <>
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 shadow-sm hover:border-emerald-500/20 transition-colors">
                  <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                    <Fingerprint className="w-4 h-4" /> Spiking Standard Dilution & Direct Amorphous Determination
                  </h3>
                  <p className="text-[13px] text-slate-400">
                    When an amorphous (non-crystalline) phase is present, standard RIR overestimates crystalline weight fractions because the amorphous content does not produce sharp Bragg peaks. Adding a known mass fraction <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$W_s$`}</ReactMarkdown> of an internal standard solves this directly:
                  </p>
                  {renderMathBlock('W_i^{\\text{orig}} = \\left( \\frac{I_i}{I_s} \\right) \\left( \\frac{RIR_s}{RIR_i} \\right) \\left( \\frac{W_s}{1 - W_s} \\right)')}
                  {renderMathBlock('W_{\\text{amorphous}} = 100\\% - \\sum_{i=1}^n W_i^{\\text{orig}}')}
                </div>
              </>
            )}

            {activeSection === 'mac' && (
              <>
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 shadow-sm hover:border-emerald-500/20 transition-colors">
                  <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                    <Layers className="w-4 h-4" /> Volumetric Fraction Transformation
                  </h3>
                  <p className="text-[13px] text-slate-400">
                    Given crystalline weight fractions <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$w_i$`}</ReactMarkdown> and crystallographic densities <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\rho_i$`}</ReactMarkdown> (g/cm³), volume fractions <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$v_i$`}</ReactMarkdown> are obtained through the diagonal density matrix <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="inline-block prose prose-invert prose-p:my-0 prose-math:text-slate-300">{`$\\mathbf{D} = \\text{diag}(\\rho_1, \\dots, \\rho_n)$`}</ReactMarkdown>:
                  </p>
                  {renderMathBlock('v_i = \\frac{\\frac{w_i}{\\rho_i}}{\\sum_{j=1}^n \\frac{w_j}{\\rho_j}} = \\frac{\\mathbf{D}^{-1} \\mathbf{w}}{\\mathbf{1}^T \\mathbf{D}^{-1} \\mathbf{w}}')}
                </div>

                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 shadow-sm hover:border-emerald-500/20 transition-colors">
                  <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                    <Cpu className="w-4 h-4" /> Total Mixture Mass Attenuation Coefficient
                  </h3>
                  <p className="text-[13px] text-slate-400">
                    The effective mass attenuation coefficient of the whole composite sample is the linear sum of component MACs weighted by their true mass fractions:
                  </p>
                  {renderMathBlock('\\mu_{\\text{sample}}^* = \\sum_{i=1}^n W_i^{\\text{total}} \\mu_i^* + W_{\\text{amorphous}} \\mu_{\\text{amorphous}}^*')}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
