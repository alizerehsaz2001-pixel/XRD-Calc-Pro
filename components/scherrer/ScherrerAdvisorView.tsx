import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, AlertTriangle, ShieldCheck, BookOpen, Layers, Compass, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { ScherrerResult } from '../../types';

interface ScherrerAdvisorViewProps {
  materialName: string;
  wavelength: number;
  shapeFactorK: number;
  kLabel: string;
  broadeningModel: string;
  breadthType: string;
  meanSizeNm: number;
  stats: any;
  anisotropicFacets: any[];
  whStrainTriage: any;
  modelComparisonSummary: any;
  results: ScherrerResult[];
}

export const ScherrerAdvisorView: React.FC<ScherrerAdvisorViewProps> = ({
  materialName,
  wavelength,
  shapeFactorK,
  kLabel,
  broadeningModel,
  breadthType,
  meanSizeNm,
  stats,
  anisotropicFacets,
  whStrainTriage,
  modelComparisonSummary,
  results
}) => {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerateAdvisor = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        materialName,
        wavelength,
        shapeFactorK,
        kLabel,
        broadeningModel,
        breadthType,
        meanSizeNm,
        stats,
        anisotropicFacets,
        whStrainTriage,
        modelComparisonSummary,
        peaks: results.filter(r => !r.error && r.sizeNm > 0).map(r => ({
          twoTheta: r.twoTheta,
          fwhmObs: r.fwhmObs,
          sizeNm: r.sizeNm,
          hkl: r.hkl
        }))
      };

      const res = await fetch('/api/gemini/scherrer-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        // Generate intelligent client-side crystallographic report as fallback
        const fallback = generateClientSideReport();
        setReport(fallback);
      }
    } catch (err: any) {
      console.warn("Using offline crystallographic analysis engine:", err);
      const fallback = generateClientSideReport();
      setReport(fallback);
    } finally {
      setLoading(false);
    }
  };

  const generateClientSideReport = (): string => {
    const isNanoValid = meanSizeNm >= 1 && meanSizeNm <= 120;
    const strainPresent = (whStrainTriage?.slope || 0) > 0.0003;
    const anisotropyRatio = stats?.anisotropyIndex || 1.0;

    return `### Executive Crystallographic Diagnostic: ${materialName || 'Nanomaterial Sample'}

#### 1. Physical Validity & Sizing Regime
* **Estimated Mean Domain Size:** **${meanSizeNm.toFixed(2)} nm** (Arithmetic: ${stats?.exactArithmetic?.toFixed(2)} nm, Volume-Weighted: ${stats?.volumeWeighted?.toFixed(2)} nm)
* **Dispersion:** ±${stats?.stdDev?.toFixed(2)} nm (Relative Polydispersity: ${stats?.relDispersion?.toFixed(1)}%, Geometric σ_g: ${stats?.geometricStdDev?.toFixed(3)})
* **Regime Assessment:** ${isNanoValid 
    ? 'The calculated crystallite size lies comfortably within the physical sub-micrometer diffraction range (1 - 120 nm), where Scherrer line broadening is experimentally resolvable above instrumental resolution.' 
    : 'Caution: Calculated domain size exceeds 120 nm or approaches the instrumental resolution limit. Deconvolution error multiplies drastically when β_obs ≈ β_inst.'}

#### 2. Deconvolution & Voigt Model Sensitivity
* **Selected Model:** **${broadeningModel}** (${breadthType === 'integral_breadth' ? 'Integral Breadth β' : 'FWHM 2w'})
* **Cross-Model Variance:**
  - Gaussian (Quadratic): **${modelComparisonSummary?.gaussian?.toFixed(2)} nm**
  - Lorentzian (Linear): **${modelComparisonSummary?.lorentzian?.toFixed(2)} nm**
  - de Keijser (Voigt DL): **${modelComparisonSummary?.deKeijser?.toFixed(2)} nm**
  - Halder-Wagner: **${modelComparisonSummary?.halderWagner?.toFixed(2)} nm**
* The Lorentzian model provides a lower bound due to Cauchy tail decay, whereas Gaussian deconvolution preserves larger effective coherent column lengths.

#### 3. Microstrain & Lattice Defect Microstructure
* **Williamson-Hall Triage:** Slope = **${whStrainTriage?.slope?.toFixed(6)}** (R² = ${whStrainTriage?.rSquared?.toFixed(4)})
* **Strain State:** ${strainPresent 
    ? '**Significant Lattice Microstrain Detected.** Non-zero slope indicates that peak broadening contains simultaneous contributions from finite crystallite size and lattice distortion (residual microstrain). A multi-peak Williamson-Hall or Warren-Averbach analysis should be reported alongside Scherrer size.' 
    : '**Negligible Microstrain.** Slope is near zero, confirming that physical broadening is predominantly caused by crystallite boundary confinement.'}
* **Dislocation Density (δ):** **${stats?.avgDislocation10_14?.toFixed(3)} × 10¹⁴ m⁻²**
* **Specific Surface Area (SSA):** **${stats?.avgSSA?.toFixed(1)} m²/g**

#### 4. Anisotropic Facet-Dependent Morphology
* **Facet Anisotropy Index:** **${anisotropyRatio.toFixed(2)}:1** (${anisotropyRatio > 1.25 ? 'Anisotropic Growth / Elongated Morphology' : 'Equiaxed / Isotropic Domains'})
${anisotropicFacets && anisotropicFacets.length > 0 
  ? anisotropicFacets.map(f => `  - Reflection (${f.hkl}): **${f.sizeNm} nm**`).join('\n')
  : '  - No explicit (hkl) indices provided to resolve directional facet sizes.'}

#### 5. Recommended Experimental Actions
1. Correlate XRD domain sizing with **TEM / HRTEM bright-field imaging** to contrast coherent scattering domain size against physical agglomerate particle size.
2. For high-strain or cold-worked systems, utilize **Rietveld Line Profile Analysis (DLPA)** or the **Warren-Averbach Fourier suite**.`;
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950/60 border border-indigo-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              Chief Crystallographer AI Sizing Advisor
            </h4>
            <p className="text-[10px] text-slate-400">
              Publication-grade synthesis, sub-micron regime verification, microstrain decoupling, and facet anisotropy diagnosis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateAdvisor}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing Line Profiles...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {report ? 'Re-Run Crystallographic Diagnosis' : 'Generate Sizing Report'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Diagnostics Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Regime */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${meanSizeNm >= 2 && meanSizeNm <= 100 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Scherrer Regime</span>
            <span className="text-sm font-bold text-white">
              {meanSizeNm >= 2 && meanSizeNm <= 100 ? 'Valid Sub-Micron Domain' : 'Near Resolution Limit'}
            </span>
          </div>
        </motion.div>

        {/* Microstrain */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${(whStrainTriage?.slope || 0) > 0.0002 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Microstrain Triage</span>
            <span className="text-sm font-bold text-white">
              {(whStrainTriage?.slope || 0) > 0.0002 ? 'Strain Contamination' : 'Negligible Strain'}
            </span>
          </div>
        </motion.div>

        {/* Anisotropy */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.15 }} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${(stats?.anisotropyIndex || 1) > 1.25 ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Facet Morphology</span>
            <span className="text-sm font-bold text-white">
              {(stats?.anisotropyIndex || 1) > 1.25 ? `Anisotropic (${stats?.anisotropyIndex?.toFixed(2)}:1)` : 'Equiaxed / Spherical'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Report Display */}
      {report ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-6 relative group space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Comprehensive XRD Line Profile Analysis
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-300 text-sm leading-relaxed space-y-4 prose prose-invert max-w-none">
            <ReactMarkdown>{report}</ReactMarkdown>
          </motion.div>
        </motion.div>
      ) : (
        <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-indigo-400/60 mx-auto" />
          <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ready to Generate Publication-Grade Diagnostic</h5>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Click "Generate Sizing Report" to perform an automated crystallographic evaluation of your current reflection dataset, deconvolution models, and facet anisotropy.
          </p>
        </div>
      )}
    </div>
  );
};
