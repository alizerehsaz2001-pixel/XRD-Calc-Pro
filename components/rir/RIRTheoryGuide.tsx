import React, { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
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
  Zap
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export const RIRTheoryGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'chung' | 'matrix' | 'error' | 'internal' | 'mac'>('chung');

  const renderFormula = (tex: string, displayMode = true) => {
    return (
      <span dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: false, displayMode })
      }} />
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight">
              Theoretical Foundation & Mathematical Formulations
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Rigorous derivation of Chung's adiabatic flushing method, matrix algebraic formulations, Jacobian error propagation, and absorption corrections.
            </p>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1.5 shadow-inner">
        <button
          onClick={() => { playSynthTone('tick'); setActiveSection('chung'); }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all ${
            activeSection === 'chung'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          1. Chung Adiabatic Flushing
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveSection('matrix'); }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all ${
            activeSection === 'matrix'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          2. Matrix Formalism
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveSection('error'); }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all ${
            activeSection === 'error'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          3. Jacobian Covariance (Σ_w)
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveSection('internal'); }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all ${
            activeSection === 'internal'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          4. Spiking & Amorphous Extraction
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setActiveSection('mac'); }}
          className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-bold rounded-xl transition-all ${
            activeSection === 'mac'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          5. MAC & Volumetric Conversion
        </button>
      </div>

      {/* SECTION 1: Chung Adiabatic Flushing */}
      {activeSection === 'chung' && (
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed animate-in fade-in">
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400">The Klug-Alexander General Intensity Equation</h3>
            <p>
              The integrated intensity I_i of a diffraction peak from crystalline phase i in a multi-phase mixture is governed by:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('I_i = \\frac{K_i \\cdot W_i}{\\rho_i \\cdot \\mu_m^*}')}
            </div>
            <p>
              where W_i is the weight fraction of phase i, ρ_i is its crystallographic density, K_i is a structure factor and instrument proportionality constant, and μ_m* is the total mass attenuation coefficient (MAC) of the mixture.
            </p>
          </div>

          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400">Chung's Elimination of Matrix Absorption</h3>
            <p>
              In 1974, F. H. Chung demonstrated that when all crystalline components in a sample are identified and the sum of crystalline fractions equals 100% (Σ W_i = 1), the unknown mixture absorption μ_m* cancels out completely when dividing each phase intensity by its Reference Intensity Ratio (RIR_i = I_i / I_c relative to Corundum α-Al2O3):
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('W_i = \\frac{\\frac{I_i}{RIR_i}}{\\sum_{j=1}^n \\frac{I_j}{RIR_j}}')}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Matrix Formalism */}
      {activeSection === 'matrix' && (
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed animate-in fade-in">
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400">Vector & Matrix Representation</h3>
            <p>
              Let I = [I_1, I_2, ..., I_n]^T be the vector of observed Bragg peak intensities and K = [K_1, K_2, ..., K_n]^T be the vector of RIR constants. We define the diagonal scaling matrix K^-1:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('\\mathbf{K}^{-1} = \\begin{bmatrix} 1/K_1 & 0 & \\dots & 0 \\\\ 0 & 1/K_2 & \\dots & 0 \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ 0 & 0 & \\dots & 1/K_n \\end{bmatrix}')}
            </div>
            <p>
              The reduced intensity vector is defined as I_tilde = K^-1 * I. The scalar total reduced intensity S is given by the inner product with the all-ones vector 1:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('S = \\mathbf{1}^T \\tilde{\\mathbf{I}} = \\mathbf{1}^T \\mathbf{K}^{-1} \\mathbf{I} = \\sum_{k=1}^n \\frac{I_k}{K_k}')}
            </div>
            <p>
              The normalized weight fraction vector w is thus:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('\\mathbf{w} = \\frac{1}{S} \\tilde{\\mathbf{I}} = \\frac{\\mathbf{K}^{-1} \\mathbf{I}}{\\mathbf{1}^T \\mathbf{K}^{-1} \\mathbf{I}}')}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Jacobian & Covariance */}
      {activeSection === 'error' && (
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed animate-in fade-in">
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400">Multivariate Analytical Error Propagation</h3>
            <p>
              Because the normalization constraint creates cross-phase statistical correlations (Σ w_i = 1), naive independent error propagation is mathematically invalid. We compute the exact Jacobian tensor:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('J_{I, ij} = \\frac{\\partial w_i}{\\partial I_j} = \\frac{1}{S \\cdot K_j} (\\delta_{ij} - w_i)')}
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('J_{K, ij} = \\frac{\\partial w_i}{\\partial K_j} = -\\frac{w_i}{K_j} (\\delta_{ij} - w_j)')}
            </div>
            <p>
              Applying the generalized tensor covariance transformation yields the complete n x n covariance matrix:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('\\mathbf{\\Sigma}_{\\mathbf{w}} = \\mathbf{J}_{\\mathbf{I}} \\mathbf{\\Sigma}_{\\mathbf{I}} \\mathbf{J}_{\\mathbf{I}}^T + \\mathbf{J}_{\\mathbf{K}} \\mathbf{\\Sigma}_{\\mathbf{K}} \\mathbf{J}_{\\mathbf{K}}^T')}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Spiking & Amorphous */}
      {activeSection === 'internal' && (
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed animate-in fade-in">
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400">Spiking Standard Dilution & Direct Amorphous Determination</h3>
            <p>
              When an amorphous (non-crystalline) phase is present, standard RIR overestimates crystalline weight fractions because the amorphous content does not produce sharp Bragg peaks. Adding a known mass fraction W_s of an internal standard solves this directly:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('W_i^{\\text{orig}} = \\left( \\frac{I_i}{I_s} \\right) \\left( \\frac{RIR_s}{RIR_i} \\right) \\left( \\frac{W_s}{1 - W_s} \\right)')}
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('W_{\\text{amorphous}} = 100\\% - \\sum_{i=1}^n W_i^{\\text{orig}}')}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: MAC & Volumetric Conversion */}
      {activeSection === 'mac' && (
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed animate-in fade-in">
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400">Volumetric Fraction Transformation</h3>
            <p>
              Given crystalline weight fractions w_i and crystallographic densities ρ_i (g/cm^3), volume fractions v_i are obtained through the diagonal density matrix D = diag(ρ_1, ..., ρ_n):
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('v_i = \\frac{\\frac{w_i}{\\rho_i}}{\\sum_{j=1}^n \\frac{w_j}{\\rho_j}} = \\frac{\\mathbf{D}^{-1} \\mathbf{w}}{\\mathbf{1}^T \\mathbf{D}^{-1} \\mathbf{w}}')}
            </div>
          </div>

          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400">Total Mixture Mass Attenuation Coefficient</h3>
            <p>
              The effective mass attenuation coefficient of the whole composite sample is the linear sum of component MACs weighted by their true mass fractions:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-center text-emerald-300 overflow-x-auto">
              {renderFormula('\\mu_{\\text{sample}}^* = \\sum_{i=1}^n W_i^{\\text{total}} \\mu_i^* + W_{\\text{amorphous}} \\mu_{\\text{amorphous}}^*')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
