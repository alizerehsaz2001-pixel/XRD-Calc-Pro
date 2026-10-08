import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Atom, 
  Sparkles, 
  Activity, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Box,
  Compass,
  Sliders,
  X
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';

export interface XRDSectionInfo {
  id: string;
  name: string;
  group?: string;
  formula?: string;
  twoTheta?: number;
  hkl?: string;
}

const SECTION_METADATA: Record<string, { name: string; group: string; formula: string; twoTheta: number; hkl: string }> = {
  bragg: { name: "Bragg's Law Solver", group: 'Fundamentals', formula: 'nλ = 2d sin θ', twoTheta: 28.44, hkl: '(111)' },
  fwhm: { name: 'FWHM & Peak Profiling', group: 'Fundamentals', formula: 'H² = U tan²θ + V tanθ + W', twoTheta: 34.12, hkl: '(200)' },
  selection: { name: 'Systematic Absences', group: 'Fundamentals', formula: 'h + k = 2n (Bravais)', twoTheta: 40.50, hkl: '(220)' },
  metric_tensor: { name: 'Crystallographic Metric Tensor', group: 'Fundamentals', formula: 'd* = √(hᵀ G* h)', twoTheta: 47.30, hkl: '(311)' },
  supercell_transform: { name: 'Supercell Transformations', group: 'Fundamentals', formula: 'a\' = M · a', twoTheta: 52.10, hkl: '(222)' },
  scherrer: { name: 'Scherrer Domain Sizing', group: 'Size & Strain', formula: 'D = Kλ / (β cos θ)', twoTheta: 25.28, hkl: '(101)' },
  monshi_scherrer: { name: 'Monshi-Scherrer Method', group: 'Size & Strain', formula: 'ln(β) = ln(Kλ/D) - ln(cos θ)', twoTheta: 38.20, hkl: '(111)' },
  wh: { name: 'Williamson-Hall Plot', group: 'Size & Strain', formula: 'β cos θ = Kλ/D + 4ε sin θ', twoTheta: 44.50, hkl: '(200)' },
  double_voigt: { name: 'Double-Voigt Method', group: 'Size & Strain', formula: 'β_f* = β_D* + 2e* s', twoTheta: 56.12, hkl: '(311)' },
  integral: { name: 'Integral Breadth Sizing', group: 'Size & Strain', formula: 'β_IB = Area / I_max', twoTheta: 64.80, hkl: '(222)' },
  integral_adv: { name: 'Advanced Integral Breadth', group: 'Size & Strain', formula: 'Apparent Size & Distortion', twoTheta: 69.13, hkl: '(400)' },
  wa: { name: 'Warren-Averbach Fourier', group: 'Size & Strain', formula: 'A(L) = A_S(L) · A_D(L)', twoTheta: 77.50, hkl: '(331)' },
  method_of_moments: { name: 'Method of Moments', group: 'Size & Strain', formula: 'μ_n = ∫ (2θ - 2θ_0)ⁿ I d(2θ)', twoTheta: 82.30, hkl: '(420)' },
  residual_stress: { name: 'sin²ψ Residual Stress', group: 'Size & Strain', formula: 'σ_φ = (E / 1+ν) · (∂d/∂sin²ψ)', twoTheta: 156.40, hkl: '(211)' },
  preferred_orientation: { name: 'March-Dollase Texture', group: 'Size & Strain', formula: 'P_K = (r² cos²α + r⁻¹ sin²α)⁻¹·⁵', twoTheta: 43.30, hkl: '(002)' },
  cohen: { name: 'Cohen Least-Squares', group: 'Refinement', formula: 'Σ δ² = min [λ²(h²+k²+l²)/4a²]', twoTheta: 32.70, hkl: '(110)' },
  pawley_lebail: { name: 'Pawley & Le Bail Profile', group: 'Refinement', formula: 'y_ci = Σ I_k S_k(2θ_i - 2θ_k) + b_i', twoTheta: 45.20, hkl: '(211)' },
  rir: { name: 'RIR Quantitative Phase', group: 'Refinement', formula: 'W_a = (I_a / RIR_a) / Σ (I_i / RIR_i)', twoTheta: 25.58, hkl: '(012)' },
  rietveld: { name: 'Rietveld Refinement', group: 'Refinement', formula: 'R_wp = √[Σ w_i (y_oi - y_ci)² / Σ w_i y_oi²]', twoTheta: 38.45, hkl: '(111)' },
  unit_cells: { name: 'Unit Cells & Lattices 3D', group: 'Simulation', formula: 'V = abc√(1 - cos²α - ...)', twoTheta: 28.44, hkl: '(111)' },
  xrr: { name: 'X-Ray Reflectivity (XRR)', group: 'Simulation', formula: 'R(q) = |r_Fresnel|² · e⁻⁴q²σ²', twoTheta: 2.15, hkl: 'Kiessig' },
  compare: { name: 'Diffraction Pattern Compare', group: 'Analysis', formula: 'Experimental vs Standard COD', twoTheta: 35.15, hkl: '(104)' },
  dl: { name: 'PhaseID Neural Net', group: 'AI & Tools', formula: 'Deep ResNet Crystallography', twoTheta: 38.00, hkl: 'AI-Infer' },
  database: { name: 'COD Materials Database', group: 'Registry', formula: 'Crystallography Open Database', twoTheta: 28.44, hkl: 'COD-Lib' },
  periodic_table: { name: 'Periodic Table Elements', group: 'Registry', formula: 'Z, Atomic Form Factors f₀(s)', twoTheta: 44.00, hkl: 'FormFactor' },
  profile: { name: 'Researcher Lab Profile', group: 'Lab', formula: 'Lab ID & Credentials', twoTheta: 0, hkl: 'ID' },
  settings: { name: 'Diffractometer Settings', group: 'Config', formula: 'Zero Shift, Radii, Wavelength', twoTheta: 0, hkl: 'CFG' }
};

interface XRDSectionScanAnimationProps {
  activeModule: string;
  theme?: string;
  onAnimationComplete?: () => void;
}

export const XRDSectionScanAnimation: React.FC<XRDSectionScanAnimationProps> = ({
  activeModule,
  theme = 'light',
  onAnimationComplete
}) => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [scanAngle, setScanAngle] = useState(10);
  const [sectionData, setSectionData] = useState<XRDSectionInfo | null>(null);

  useEffect(() => {
    if (!activeModule) return;

    const meta = SECTION_METADATA[activeModule] || {
      name: activeModule.toUpperCase().replace('_', ' '),
      group: 'Analytical Instrument',
      formula: 'nλ = 2d sin θ',
      twoTheta: 38.45,
      hkl: '(111)'
    };

    setSectionData({
      id: activeModule,
      name: meta.name,
      group: meta.group,
      formula: meta.formula,
      twoTheta: meta.twoTheta,
      hkl: meta.hkl
    });

    setIsScanning(true);
    setScanAngle(10);

    // Play high-tech XRD scan acoustic chirp
    try {
      playSynthTone('xrd_scan');
    } catch {}

    const startTime = Date.now();
    const duration = 520; // ms

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const target2Theta = meta.twoTheta > 0 ? meta.twoTheta : 42.5;
      const currentAng = 10 + progress * (target2Theta - 10 + 15);
      setScanAngle(Number(currentAng.toFixed(1)));

      if (progress >= 1) {
        clearInterval(interval);
        setTimeout(() => {
          setIsScanning(false);
          if (onAnimationComplete) onAnimationComplete();
        }, 120);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [activeModule]);

  if (!isScanning || !sectionData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
        className="relative z-30 mb-4 select-none"
      >
        <div className={`w-full rounded-2xl overflow-hidden border backdrop-blur-xl shadow-2xl relative ${
          theme === 'cyberpunk'
            ? 'bg-black/95 border-cyber-accent text-cyber-accent shadow-[0_0_25px_rgba(0,255,200,0.25)]'
            : 'bg-slate-950/90 text-white border-violet-500/40 shadow-indigo-950/40'
        }`}>
          {/* Top High-Voltage Laser Beam Line */}
          <div className="relative w-full h-1 bg-slate-900 overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee]"
            />
          </div>

          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 relative z-10">
            {/* Left: Active XRD Scan Badge & Section Title */}
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,211,238,0.5)] shrink-0">
                <Atom className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-300 animate-pulse" />
                    <span>XRD SCAN ACQUISITION</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    {sectionData.group}
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-black text-white tracking-tight font-mono flex items-center gap-2 mt-0.5">
                  <span>{sectionData.name}</span>
                  <span className="text-xs text-indigo-300 font-normal">
                    {sectionData.formula}
                  </span>
                </h4>
              </div>
            </div>

            {/* Center: Live Goniometer 2θ Angle Sweep & Crystallography HUD */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="bg-slate-900/90 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">2θ Goniometer</span>
                  <span className="text-cyan-300 font-bold text-sm leading-none mt-0.5">
                    {scanAngle.toFixed(1)}°
                  </span>
                </div>

                <div className="w-px h-6 bg-white/10" />

                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Reflection</span>
                  <span className="text-violet-300 font-bold text-sm leading-none mt-0.5">
                    {sectionData.hkl}
                  </span>
                </div>

                <div className="w-px h-6 bg-white/10 hidden md:block" />

                <div className="hidden md:flex flex-col">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Anode λ</span>
                  <span className="text-emerald-300 font-bold text-sm leading-none mt-0.5">
                    1.5406 Å
                  </span>
                </div>
              </div>

              {/* Close Button if user wants to dismiss early */}
              <button
                onClick={() => setIsScanning(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Oscilloscope Mini Diffraction Peak Trace */}
          <div className="h-6 w-full bg-slate-950/80 border-t border-white/5 flex items-end px-4 gap-1 overflow-hidden">
            {Array.from({ length: 32 }).map((_, i) => {
              const peakCenter = 16;
              const dist = Math.abs(i - peakCenter);
              const heightPct = Math.max(8, Math.exp(-(dist * dist) / 10) * 90);
              return (
                <motion.div
                  key={i}
                  initial={{ height: 2 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.35, delay: i * 0.008 }}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-600 via-indigo-500 to-cyan-400 opacity-75"
                />
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
