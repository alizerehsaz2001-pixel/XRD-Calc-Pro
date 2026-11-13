import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Layers,
  Sparkles,
  ArrowRight,
  Microscope,
  Compass,
  Sliders,
  Radio,
  Orbit,
  Terminal,
  Search,
  BookOpen,
  Play,
  RotateCcw,
  LogOut,
  Palette,
  Menu,
  X,
  ArrowUp,
  CheckCircle2,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  HelpCircle,
  ExternalLink,
  Scale,
  Binary,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { MATERIAL_DB } from '../utils/materialDB';
import { AppLaunchPortal, AnimatedGoToAppButton } from './AppLaunchPortal';
import { FooterInfoModal, FooterModalType } from './FooterInfoModal';
import { WelcomeTourModal } from './landing/WelcomeTourModal';
import { InteractiveHeroDiffractionShowcase } from './landing/InteractiveHeroDiffractionShowcase';
import { ModulesDirectory, SCIENTIFIC_MODULES } from './landing/ModulesDirectory';
import { ExperimentQuickLaunchpad, ExperimentPreset } from './landing/ExperimentQuickLaunchpad';
import { ScherrerBroadeningDemo } from './landing/ScherrerBroadeningDemo';
import { ResumeSectionPickerModal, ResumeModuleId } from './landing/ResumeSectionPickerModal';
import { AppSection } from '../types';

// --- Brand Emblem ---
const CrystallographicBrandEmblem: React.FC = () => (
  <div className="relative w-10 h-10 bg-[#0B0F19] border border-slate-700/90 rounded-sm flex items-center justify-center shrink-0 group-hover:border-cyan-400 transition-colors">
    <svg viewBox="0 0 40 40" className="w-6 h-6 overflow-visible">
      <polygon
        points="20,3 35,11.5 35,28.5 20,37 5,28.5 5,11.5"
        fill="none"
        stroke="#06B6D4"
        strokeWidth="1.6"
      />
      <line x1="20" y1="3" x2="20" y2="37" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="5" y1="11.5" x2="35" y2="28.5" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="35" y1="11.5" x2="5" y2="28.5" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="20" cy="20" r="3.2" fill="#22D3EE" />
      <circle cx="20" cy="3" r="1.8" fill="#38BDF8" />
      <circle cx="35" cy="11.5" r="1.8" fill="#38BDF8" />
      <circle cx="35" cy="28.5" r="1.8" fill="#38BDF8" />
      <circle cx="20" cy="37" r="1.8" fill="#38BDF8" />
      <circle cx="5" cy="28.5" r="1.8" fill="#38BDF8" />
      <circle cx="5" cy="11.5" r="1.8" fill="#38BDF8" />
    </svg>
  </div>
);

// --- Interactive Bragg Optical Bench Sandbox ---
const BraggOpticalBenchSandbox: React.FC<{ onEnter: (targetModule?: AppSection) => void }> = ({ onEnter }) => {
  const [lambda, setLambda] = useState<number>(1.5406);
  const [dSpace, setDSpace] = useState<number>(3.1355);
  const [harmonicOrder, setHarmonicOrder] = useState<number>(1);

  const sinTheta = (harmonicOrder * lambda) / (2 * dSpace);
  const isValid = sinTheta <= 1.0 && sinTheta > 0;
  const thetaRad = isValid ? Math.asin(sinTheta) : 0;
  const thetaDeg = isValid ? (thetaRad * 180) / Math.PI : 0;
  const twoThetaDeg = thetaDeg * 2;
  const qVector = isValid ? (4 * Math.PI * sinTheta) / lambda : 0;

  const ANODES = [
    { label: 'Cu Kα₁', val: 1.5406 },
    { label: 'Co Kα₁', val: 1.7890 },
    { label: 'Mo Kα₁', val: 0.7093 },
    { label: 'Cr Kα₁', val: 2.2897 },
    { label: 'Ag Kα₁', val: 0.5594 },
  ];

  const LATTICE_PRESETS = [
    { label: 'Si (111)', d: 3.1355, lambda: 1.5406 },
    { label: 'Si (220)', d: 1.9201, lambda: 1.5406 },
    { label: 'Au (111)', d: 2.355, lambda: 1.5406 },
    { label: 'NaCl (200)', d: 2.8201, lambda: 1.5406 },
    { label: 'α-Fe (110)', d: 2.0268, lambda: 1.7890 },
  ];

  return (
    <section
      id="bragg-optical-bench"
      className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-800/80 bg-[#070A12]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
              <span>● INTERACTIVE OPTICAL RAYBENCH</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">PATH-DIFFERENCE COHERENCE SOLVER</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Bragg’s Law &amp; Reciprocal Lattice Geometry
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LATTICE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setDSpace(p.d);
                  setLambda(p.lambda);
                  setHarmonicOrder(1);
                }}
                className={`px-2.5 py-1.5 text-xs font-mono rounded-sm border transition-colors cursor-pointer ${
                  Math.abs(dSpace - p.d) < 0.005
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 font-bold'
                    : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {p.label} ({p.d.toFixed(3)} Å)
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 border border-slate-800 bg-[#0B0F19] rounded-sm overflow-hidden shadow-2xl">
          {/* Left Column: Controls & Governing Equations */}
          <div className="lg:col-span-5 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Equation Display */}
              <div className="p-3.5 bg-[#070A12] border border-slate-800 rounded-sm flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Constructive Condition:</span>
                <span className="text-sm font-mono font-bold text-cyan-300">2d_hkl · sin(θ) = nλ</span>
              </div>

              {/* X-Ray Anode Target Selector */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-2">
                  <span className="text-slate-400 uppercase">Incident Wavelength (λ)</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{lambda.toFixed(4)} Å</span>
                </div>
                <div className="grid grid-cols-5 gap-1 mb-2.5">
                  {ANODES.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => setLambda(a.val)}
                      className={`py-1 text-[10px] font-mono font-bold rounded-sm border transition-colors ${
                        Math.abs(lambda - a.val) < 0.002
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                          : 'bg-[#070A12] text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.005}
                  value={lambda}
                  onChange={(e) => setLambda(parseFloat(e.target.value))}
                  aria-label="Incident Wavelength Lambda in Angstroms"
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 cursor-pointer"
                />
              </div>

              {/* Interplanar Spacing d(hkl) */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-2">
                  <span className="text-slate-400 uppercase">Interplanar Spacing d(hkl)</span>
                  <span className="text-emerald-400 font-bold tabular-nums">{dSpace.toFixed(4)} Å</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={6.0}
                  step={0.005}
                  value={dSpace}
                  onChange={(e) => setDSpace(parseFloat(e.target.value))}
                  aria-label="Interplanar Spacing d in Angstroms"
                  className="w-full accent-emerald-400 h-1.5 bg-slate-800 cursor-pointer"
                />
              </div>

              {/* Diffraction Order n */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-400">Harmonic Order (n)</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setHarmonicOrder(n)}
                      className={`px-3 py-1 text-xs font-mono font-bold rounded-sm border transition-colors ${
                        harmonicOrder === n
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                          : 'bg-[#070A12] text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      n = {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Output Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-[#070A12] border border-slate-800 rounded-sm">
                <div className="text-[10px] font-mono uppercase text-slate-500">Detector Angle 2θ</div>
                <div className="text-lg font-mono font-bold text-cyan-400 tabular-nums mt-0.5">
                  {isValid ? `${twoThetaDeg.toFixed(2)}°` : 'EVANESCENT'}
                </div>
                <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                  θ_Bragg = {isValid ? `${thetaDeg.toFixed(2)}°` : 'sinθ > 1'}
                </div>
              </div>
              <div className="p-3 bg-[#070A12] border border-slate-800 rounded-sm">
                <div className="text-[10px] font-mono uppercase text-slate-500">Momentum Transfer Q</div>
                <div className="text-lg font-mono font-bold text-indigo-300 tabular-nums mt-0.5">
                  {isValid ? `${qVector.toFixed(3)} Å⁻¹` : '—'}
                </div>
                <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                  Δ = 2d·sinθ = {(harmonicOrder * lambda).toFixed(3)} Å
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('xrd_sandbox_lambda', String(lambda));
                    localStorage.setItem('xrd_sandbox_d', String(dSpace));
                  } catch {}
                  onEnter('bragg');
                }}
                className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Transfer to Bragg Workstation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Live Geometric Ray-Tracing CAD Schematic */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-[#070A12] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Real-Space Atomic Planes &amp; Path Retardation 2d·sinθ
                </span>
                <h4 className="text-sm font-mono font-bold text-white">
                  Specular Reflection Geometry off (hkl) Miller Planes
                </h4>
              </div>
              <span
                className={`text-xs font-mono font-bold ${
                  isValid ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isValid ? '● CONSTRUCTIVE INTERFERENCE' : '● VIOLATES nλ ≤ 2d'}
              </span>
            </div>

            <div className="relative bg-[#0B0F19] border border-slate-800 rounded-sm p-4 flex items-center justify-center">
              <svg viewBox="0 0 560 250" className="w-full h-60 overflow-visible">
                {/* Crystal Atomic Planes */}
                {(() => {
                  const planeGap = Math.max(28, Math.min(72, dSpace * 14));
                  const topY = 125;
                  const bottomY = topY + planeGap;
                  const rayAngleRad = isValid ? Math.max(0.18, Math.min(1.25, thetaRad)) : 0.45;
                  const dx = 180 * Math.cos(rayAngleRad);
                  const dy = 180 * Math.sin(rayAngleRad);

                  // Second ray shift to hit lower plane at (280, bottomY)
                  return (
                    <g>
                      {/* Plane 1 & Plane 2 */}
                      <line x1="60" y1={topY} x2="500" y2={topY} stroke="#334155" strokeWidth="1.5" />
                      <line x1="60" y1={bottomY} x2="500" y2={bottomY} stroke="#334155" strokeWidth="1.5" />

                      {/* Atomic Lattice Nodes */}
                      {[90, 155, 215, 280, 345, 405, 470].map((cx) => (
                        <g key={cx}>
                          <circle cx={cx} cy={topY} r="4.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.8" />
                          <circle cx={cx} cy={bottomY} r="4.5" fill="#0F172A" stroke="#10B981" strokeWidth="1.8" />
                        </g>
                      ))}

                      {/* d-Spacing Callout on Left */}
                      <line x1="42" y1={topY} x2="42" y2={bottomY} stroke="#10B981" strokeWidth="1.5" />
                      <line x1="36" y1={topY} x2="48" y2={topY} stroke="#10B981" strokeWidth="1.5" />
                      <line x1="36" y1={bottomY} x2="48" y2={bottomY} stroke="#10B981" strokeWidth="1.5" />
                      <text
                        x="32"
                        y={(topY + bottomY) / 2 + 4}
                        textAnchor="end"
                        fill="#10B981"
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="bold"
                      >
                        d={dSpace.toFixed(2)}Å
                      </text>

                      {/* Surface Normal */}
                      <line
                        x1="280"
                        y1={topY - 95}
                        x2="280"
                        y2={bottomY + 25}
                        stroke="#475569"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />

                      {isValid ? (
                        <>
                          {/* Top Incident & Diffracted Ray */}
                          <line
                            x1={280 - dx}
                            y1={topY - dy}
                            x2="280"
                            y2={topY}
                            stroke="#22D3EE"
                            strokeWidth="2.2"
                          />
                          <line
                            x1="280"
                            y1={topY}
                            x2={280 + dx}
                            y2={topY - dy}
                            stroke="#22D3EE"
                            strokeWidth="2.2"
                          />

                          {/* Bottom Incident & Diffracted Ray */}
                          <line
                            x1={280 - dx}
                            y1={bottomY - dy}
                            x2="280"
                            y2={bottomY}
                            stroke="#38BDF8"
                            strokeWidth="1.6"
                            strokeDasharray="4 2"
                          />
                          <line
                            x1="280"
                            y1={bottomY}
                            x2={280 + dx}
                            y2={bottomY - dy}
                            stroke="#38BDF8"
                            strokeWidth="1.6"
                            strokeDasharray="4 2"
                          />

                          {/* Path Retardation Highlight 2d sinθ */}
                          <line
                            x1="280"
                            y1={topY}
                            x2={280 - planeGap * Math.sin(rayAngleRad) * Math.cos(rayAngleRad)}
                            y2={topY + planeGap * Math.pow(Math.cos(rayAngleRad), 2)}
                            stroke="#F59E0B"
                            strokeWidth="1.5"
                          />
                          <line
                            x1="280"
                            y1={topY}
                            x2={280 + planeGap * Math.sin(rayAngleRad) * Math.cos(rayAngleRad)}
                            y2={topY + planeGap * Math.pow(Math.cos(rayAngleRad), 2)}
                            stroke="#F59E0B"
                            strokeWidth="1.5"
                          />

                          {/* Labels */}
                          <text
                            x={280 - dx + 10}
                            y={topY - dy - 8}
                            fill="#22D3EE"
                            fontSize="10"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            Incident k₀ (λ = {lambda.toFixed(4)} Å)
                          </text>
                          <text
                            x={280 + dx - 10}
                            y={topY - dy - 8}
                            textAnchor="end"
                            fill="#22D3EE"
                            fontSize="10"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            Diffracted k (2θ = {twoThetaDeg.toFixed(2)}°)
                          </text>
                        </>
                      ) : (
                        <text
                          x="280"
                          y="70"
                          textAnchor="middle"
                          fill="#F43F5E"
                          fontSize="12"
                          fontFamily="JetBrains Mono, monospace"
                          fontWeight="bold"
                        >
                          Condition Violated: nλ ({(harmonicOrder * lambda).toFixed(2)} Å) &gt; 2d ({(2 * dSpace).toFixed(2)} Å)
                        </text>
                      )}
                    </g>
                  );
                })()}
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[#0B0F19] border border-slate-800 rounded-sm">
                <span className="text-[10px] text-slate-500 block">SIN(θ) RATIO</span>
                <span className="text-white font-bold tabular-nums">{sinTheta.toFixed(4)}</span>
              </div>
              <div className="p-2.5 bg-[#0B0F19] border border-slate-800 rounded-sm">
                <span className="text-[10px] text-slate-500 block">RECIPROCAL d* = 1/d</span>
                <span className="text-emerald-400 font-bold tabular-nums">{(1 / dSpace).toFixed(4)} Å⁻¹</span>
              </div>
              <div className="p-2.5 bg-[#0B0F19] border border-slate-800 rounded-sm">
                <span className="text-[10px] text-slate-500 block">EWALD LIMIT d_min</span>
                <span className="text-amber-300 font-bold tabular-nums">{(lambda / 2).toFixed(4)} Å</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Comparative Crystallographic Formalism Matrix ---
const FORMALISM_MATRIX: {
  id: AppSection;
  method: string;
  equation: string;
  reciprocalSpaceVar: string;
  observables: string;
  regime: string;
}[] = [
  {
    id: 'rietveld',
    method: 'Rietveld Full-Pattern Refinement',
    equation: 'Y_calc(2θ_i) = s ∑ I_K φ(Δ2θ_i) + y_b(2θ_i)',
    reciprocalSpaceVar: 'Full 2θ / Q Scan',
    observables: 'Unit cell (a,b,c), Wyckoff coordinates, Caglioti UVW, Rwp',
    regime: 'Single & Multi-Phase Crystalline Powders',
  },
  {
    id: 'pdf_analysis',
    method: 'Pair Distribution Function (PDF)',
    equation: 'G(r) = (2/π) ∫ Q[S(Q) − 1] sin(Qr) dQ',
    reciprocalSpaceVar: 'Q up to 25–35 Å⁻¹',
    observables: 'Bond lengths r_ij, coordination N_c, local disorder σ_ij',
    regime: 'Amorphous Glasses, Liquids & Nanocrystals',
  },
  {
    id: 'xrr',
    method: 'Specular X-Ray Reflectometry (XRR)',
    equation: 'R_{j,j+1} = r_{j,j+1} exp(−2 k_{z,j} k_{z,j+1} σ_j²)',
    reciprocalSpaceVar: 'Q_z = (4π/λ) sinθ (0–0.6 Å⁻¹)',
    observables: 'Film thickness d, mass density ρ, interfacial roughness σ',
    regime: 'Epitaxial & Multilayer Thin-Film Stacks',
  },
  {
    id: 'warren',
    method: 'Warren–Averbach Fourier Analysis',
    equation: 'ln A(L) = ln A^S(L) − 2π² L² ⟨ε²(L)⟩ / d_{hkl}²',
    reciprocalSpaceVar: 'Fourier Length L = n a_3',
    observables: 'Area-weighted size ⟨D⟩_A, column distribution p(L), RMS ⟨ε²(L)⟩¹/²',
    regime: 'Multiple Harmonic Reflections (hkl / 2h 2k 2l)',
  },
  {
    id: 'williamson',
    method: 'Williamson–Hall (UDM / USDM / UDEDM)',
    equation: 'β_T cosθ = Kλ/D + 4ε sinθ',
    reciprocalSpaceVar: '4 sinθ vs. β cosθ',
    observables: 'Volume-weighted domain size ⟨D⟩_V, lattice microstrain ε',
    regime: 'Isotropic & Anisotropic Strained Polycrystals',
  },
  {
    id: 'moments',
    method: 'Method of Moments (Variance–Range)',
    equation: 'W_2θ(σ) = [cosθ/(π²λD)]σ − (λ/4π²D²)cos²θ',
    reciprocalSpaceVar: 'Truncation Range ±σ',
    observables: 'Asymptotic domain size D_M, dislocation density ρ_d',
    regime: 'High-SNR Isolated Diffraction Profiles',
  },
  {
    id: 'double_voigt',
    method: 'Double-Voigt Convolution Method',
    equation: 'β_G² = β_{GS}² + β_{GD}²,  β_L = β_{LS} + β_{LD}',
    reciprocalSpaceVar: 's = 2 sinθ / λ',
    observables: 'Lorentzian & Gaussian size/distortion integral breadths',
    regime: 'Voigt-Symmetry Deconvolved Reflections',
  },
  {
    id: 'dl',
    method: 'Physics-Informed Neural Net (PINN)',
    equation: 'L_total = L_CE + λ_ext ||P ⊙ M_SG|| + λ_V ||θ_V − θ̂_V||²',
    reciprocalSpaceVar: '1D Tensor I(2θ) ∈ ℝ^2048',
    observables: '230 Space Group ID, Grad-CAM saliency, latent manifold ℝ³',
    regime: 'Rapid High-Throughput Phase & Symmetry Screening',
  },
];

// --- Legal Content ---
const PRIVACY_POLICY_DATA = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'July 18, 2026',
    sections: [
      {
        title: '1. Data Collection',
        content:
          'We collect computational metadata and basic analytical parameters to improve our XRD processing algorithms. No sensitive personal data is stored on our servers.',
      },
      {
        title: '2. Analytical Data',
        content:
          'Experimental diffractograms uploaded to our suite remain private to your active laboratory session.',
      },
      {
        title: '3. Local Persistence',
        content:
          'We use local storage keys to maintain session states and your customized crystallography workbench preferences.',
      },
    ],
  },
  fa: {
    title: 'سیاست حریم خصوصی',
    lastUpdated: '۲۸ تیر ۱۴۰۵',
    sections: [
      {
        title: '۱. جمع‌آوری داده‌ها',
        content:
          'ما متادیتای محاسباتی و پارامترهای تحلیلی پایه را برای بهبود الگوریتم‌های پردازش XRD جمع‌آوری می‌کنیم.',
      },
      {
        title: '۲. داده‌های تحلیلی',
        content: 'پراش‌نگارهای آزمایشی در جلسه کاری آزمایشگاهی شما محفوظ می‌مانند.',
      },
      {
        title: '۳. ذخیره‌سازی محلی',
        content: 'ما از حافظه محلی برای حفظ وضعیت جلسات و تنظیمات میز کار بلورشناسی شما استفاده می‌کنیم.',
      },
    ],
  },
};

const CHANGELOG_DATA = {
  en: {
    title: 'Version History',
    lastUpdated: 'November 2026',
    sections: [
      {
        title: 'v2.5.0 - Total Scattering PDF, Rietveld & PINN Upgrade',
        content:
          'Added full 7-stage Rietveld Structure Refinement, Sine-Fourier Pair Distribution Function G(r) workstation, Parratt XRR optical engine, and Physics-Informed Neural Network (PINN) workbench.',
      },
      {
        title: 'v2.2.0 - Microstructure & Line Profile Workstations',
        content:
          'Upgraded Williamson–Hall (UDM/USDM/UDEDM), Warren–Averbach Fourier analysis, Method of Moments W(σ), and Double-Voigt deconvolution engines.',
      },
    ],
  },
  fa: {
    title: 'تاریخچه نسخه‌ها',
    lastUpdated: 'آبان ۱۴۰۵',
    sections: [
      {
        title: 'v2.5.0 - ارتقای کامل Rietveld، PDF و شبکه عصبی PINN',
        content:
          'افزودن پالایش ساختاری Rietveld، تحلیل تابع توزیع جفت G(r)، بازتاب‌سنجی اشعه ایکس (XRR) و شبکه عصبی آگاه از فیزیک.',
      },
    ],
  },
};

const TERMS_OF_USE_DATA = {
  en: {
    title: 'Terms of Use',
    lastUpdated: 'July 18, 2026',
    sections: [
      {
        title: '1. Scientific License',
        content:
          'XRD-Calc Pro grants researchers and students access to computational diffraction tools for materials characterization and academic instruction.',
      },
      {
        title: '2. Metrological Verification',
        content:
          'Researchers should cross-verify critical structural refinements against certified NIST Standard Reference Materials (e.g., SRM 640f / SRM 660c).',
      },
    ],
  },
  fa: {
    title: 'شرایط استفاده',
    lastUpdated: '۲۸ تیر ۱۴۰۵',
    sections: [
      {
        title: '۱. مجوز علمی',
        content: 'این مجموعه برای پژوهش‌های بلورشناسی، علم مواد و آموزش دانشگاهی طراحی شده است.',
      },
    ],
  },
};

const LegalModal = ({
  isOpen,
  onClose,
  content,
  isRTL,
}: {
  isOpen: boolean;
  onClose: () => void;
  content: { title: string; lastUpdated: string; sections: { title: string; content: string }[] };
  isRTL: boolean;
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div onClick={onClose} className="absolute inset-0 bg-[#070A12]/85 backdrop-blur-md" />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0B0F19] border border-slate-800 rounded-sm overflow-hidden shadow-2xl flex flex-col">
        <div
          className={`px-6 py-4 border-b border-slate-800 bg-[#070A12] flex items-center justify-between ${
            isRTL ? 'flex-row-reverse' : ''
          }`}
        >
          <div>
            <h3 className="text-lg font-bold text-white">{content.title}</h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
              Updated: {content.lastUpdated}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 space-y-5 ${isRTL ? 'text-right' : 'text-left'}`}>
          {content.sections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <h4 className="text-sm font-mono font-bold text-cyan-400">{section.title}</h4>
              <p className="text-slate-300 leading-relaxed text-xs">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#070A12] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold rounded-sm text-xs uppercase tracking-wider"
          >
            {t('Acknowledge', 'Acknowledge')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const LandingPage = ({
  onEnter,
  setTheme,
  theme,
  isRegistered,
  onSignOut,
  activeModule,
  onReturnToApp,
  onOpenWhyXrd,
}: {
  onEnter: (mode?: 'register' | 'login', targetModule?: any) => void;
  setTheme: (theme: any) => void;
  theme: string;
  isRegistered?: boolean;
  onSignOut?: () => void;
  activeModule?: string;
  onReturnToApp?: (targetModule?: any) => void;
  onOpenWhyXrd?: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = ['he', 'fa', 'ar', 'ur', 'ps', 'yi', 'sd', 'ku', 'ug'].includes(i18n.language);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [heroSearchTerm, setHeroSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'diffraction' | 'crystallite' | 'ai' | 'standards'>('all');
  const [showHeroSuggestions, setShowHeroSuggestions] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [footerModal, setFooterModal] = useState<FooterModalType>(null);
  const [isEnteringApp, setIsEnteringApp] = useState(false);
  const [isResumingApp, setIsResumingApp] = useState(false);
  const [showResumePickerModal, setShowResumePickerModal] = useState(false);
  const [pendingLaunchMode, setPendingLaunchMode] = useState<'login' | 'register'>('login');
  const [pendingTargetModule, setPendingTargetModule] = useState<any>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const heroSearchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const themePickerRef = useRef<HTMLDivElement>(null);

  const handleEnterApp = (mode: 'login' | 'register' = 'login', targetModule?: any) => {
    setIsResumingApp(false);
    setPendingLaunchMode(mode);
    setPendingTargetModule(targetModule || null);
    setIsEnteringApp(true);
  };

  const handleResumeApp = () => {
    setShowResumePickerModal(true);
  };

  const handleSelectResumeSection = (selectedModule: ResumeModuleId) => {
    setShowResumePickerModal(false);
    setIsResumingApp(true);
    setPendingLaunchMode(isRegistered ? 'login' : 'register');
    setPendingTargetModule(selectedModule);
    setIsEnteringApp(true);
  };

  // Global keyboard shortcut to focus search (/ or Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
          heroSearchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setShowHeroSuggestions(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(event.target as Node)) {
        setShowHeroSuggestions(false);
      }
      if (themePickerRef.current && !themePickerRef.current.contains(event.target as Node)) {
        setShowThemePicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('xrd_user_registration');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name) setUserName(parsed.name);
      } else {
        setUserName('');
      }
    } catch {}
  }, [isRegistered]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredHeroSuggestions = useMemo(() => {
    if (!heroSearchTerm || heroSearchTerm.length < 1) return [];
    const term = heroSearchTerm.toLowerCase().trim();

    const matchedModules = SCIENTIFIC_MODULES.filter((m) => {
      if (searchCategory === 'diffraction') {
        return m.category === 'diffraction';
      } else if (searchCategory === 'crystallite') {
        return m.category === 'microstructure';
      } else if (searchCategory === 'ai') {
        return m.category === 'ai_database' || m.category === 'refinement';
      } else if (searchCategory === 'standards') {
        return false;
      }

      return (
        m.title.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term) ||
        (m.formula && m.formula.toLowerCase().includes(term)) ||
        (m.badge && m.badge.toLowerCase().includes(term)) ||
        m.categoryLabel.toLowerCase().includes(term)
      );
    })
      .slice(0, 5)
      .map((m) => ({
        type: 'module' as const,
        id: m.id,
        name: m.title,
        description: m.description,
        badge: m.badge || m.categoryLabel,
        formula: m.formula,
        category: m.categoryLabel,
      }));

    const matchedMaterials =
      searchCategory === 'crystallite' || searchCategory === 'ai'
        ? []
        : MATERIAL_DB
            .filter(
              (item) =>
                item.name.toLowerCase().includes(term) ||
                item.formula.toLowerCase().includes(term) ||
                (item.crystalSystem && item.crystalSystem.toLowerCase().includes(term))
            )
            .slice(0, 4)
            .map((item) => ({
              type: 'material' as const,
              id: item.name,
              name: item.name,
              description: item.description,
              badge: item.formula,
              formula: item.crystalSystem,
              category: 'Crystal Standard',
            }));

    return [...matchedModules, ...matchedMaterials].slice(0, 7);
  }, [heroSearchTerm, searchCategory]);

  const defaultPopularSuggestions = useMemo(
    () => [
      {
        type: 'module' as const,
        id: 'rietveld',
        name: 'Rietveld Full-Pattern Refinement',
        description: '7-stage whole-powder-pattern least-squares solver with Caglioti UVW and Wyckoff sites.',
        badge: 'FULL-PATTERN',
        formula: 'Rwp / χ² Solver',
        category: 'Refinement',
      },
      {
        type: 'module' as const,
        id: 'pdf_analysis',
        name: 'Pair Distribution Function G(r)',
        description: 'Sine-Fourier transform of total scattering S(Q) into real-space atomic pair correlations.',
        badge: 'TOTAL SCATTERING',
        formula: 'G(r) = (2/π)∫Q[S(Q)-1]sin(Qr)dQ',
        category: 'Diffraction & PDF',
      },
      {
        type: 'module' as const,
        id: 'xrr',
        name: 'X-Ray Reflectometry (XRR) Engine',
        description: 'Parratt optical recursion for thin-film thickness, critical angle θc, and roughness.',
        badge: 'THIN-FILM',
        formula: 'Parratt & Kiessig FFT',
        category: 'Reflectometry',
      },
      {
        type: 'module' as const,
        id: 'williamson',
        name: 'Williamson–Hall (UDM / USDM / UDEDM)',
        description: 'Deconvolve finite domain size D from isotropic or anisotropic lattice microstrain ε.',
        badge: 'MICROSTRAIN',
        formula: 'β cosθ = Kλ/D + 4ε sinθ',
        category: 'Line Broadening',
      },
      {
        type: 'module' as const,
        id: 'dl',
        name: 'Physics-Informed Neural Net (PINN)',
        description: '1D-ResNet + Multi-Head Attention with 230 space-group extinction masks and Grad-CAM.',
        badge: 'PINN AI',
        formula: '230 Space Groups',
        category: 'Neural Crystallography',
      },
      {
        type: 'material' as const,
        id: 'Silicon',
        name: 'Silicon NIST SRM 640f',
        description: 'Certified diamond cubic reference standard (Fd-3m, a = 5.43119 Å) for instrumental calibration.',
        badge: 'Si SRM 640f',
        formula: 'Fd-3m (#227)',
        category: 'Crystal Standard',
      },
    ],
    []
  );

  const displaySuggestions = useMemo(() => {
    if (!heroSearchTerm || heroSearchTerm.trim().length === 0) {
      return defaultPopularSuggestions;
    }
    return filteredHeroSuggestions;
  }, [heroSearchTerm, defaultPopularSuggestions, filteredHeroSuggestions]);

  const pythonSnippet = `import xrd_core as xrd

# 1. Load Experimental Powder Pattern & NIST SRM 640f Caglioti Calibration
scan = xrd.load_scan("BaTiO3_perovskite_CuKa1.xy", wavelength=1.540598)
inst = xrd.CagliotiResolution(U=0.0042, V=-0.0028, W=0.0054, eta0=0.22)

# 2. Execute 7-Stage Rietveld Refinement & Total Scattering PDF G(r)
rietveld = xrd.RietveldEngine(scan, space_group="P4mm", resolution=inst).refine()
pdf = xrd.compute_pdf_Gr(scan, q_max=24.0, lorch_damping=True)

print(f"Rwp: {rietveld.rwp:.2f}% | c/a: {rietveld.c / rietveld.a:.4f} | Ti-O r1: {pdf.first_shell:.3f} Å")`;

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 relative">
      {/* Subtle Scientific Grid Backdrop */}
      <div
        className="fixed inset-0 opacity-[0.06] pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Unified Fixed Header */}
      <header className="fixed top-0 left-0 w-full z-40">
        {/* Active Session Quick-Resume Strip */}
        {onReturnToApp && (
          <div className="bg-[#0B0F19] border-b border-slate-800 px-4 py-1.5 text-xs select-none">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 font-mono">
                <span className="text-emerald-400 font-bold">● ACTIVE SESSION</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300 truncate">
                  MOUNTED ENGINE:{' '}
                  <strong className="text-cyan-400">
                    {activeModule ? activeModule.toUpperCase() : 'BRAGG WORKSTATION'}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleResumeApp()}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-sm font-mono font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <span>Resume Workstation</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Primary Instrument Navigation Bar */}
        <nav
          className={`w-full transition-colors duration-200 ${
            isScrolled
              ? 'bg-[#070A12]/95 backdrop-blur-md border-b border-slate-800 py-2.5 shadow-xl'
              : 'bg-[#070A12]/85 backdrop-blur-sm border-b border-slate-800/80 py-3.5'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
            {/* Brand Identity */}
            <div
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => handleEnterApp(isRegistered ? 'login' : 'register')}
            >
              <CrystallographicBrandEmblem />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono">
                    XRD<span className="text-cyan-400">CalcPro</span>
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 border border-slate-800 bg-[#0B0F19] px-1.5 py-0.5 rounded-sm">
                    v2.5 STUDIO
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">
                  ● Computational Crystallography &amp; Scattering Suite
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-5 text-xs font-mono uppercase tracking-wider text-slate-300">
              <button
                type="button"
                onClick={() =>
                  document.getElementById('modules-directory-section')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                17 Workstations
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('bragg-optical-bench')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Bragg Bench
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('formalism-matrix-section')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Formalism Matrix
              </button>
              {onOpenWhyXrd && (
                <button
                  type="button"
                  onClick={onOpenWhyXrd}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Theory &amp; Guide</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowWelcomeTour(true)}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tour</span>
              </button>
            </div>

            {/* Right Controls: Language, Theme, Auth & Launch */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSelector compact={true} />

              {/* Theme Selector */}
              <div className="relative" ref={themePickerRef}>
                <button
                  type="button"
                  onClick={() => setShowThemePicker(!showThemePicker)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0B0F19] hover:bg-slate-900 border border-slate-800 rounded-sm text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Select UI Theme"
                >
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="capitalize">{theme}</span>
                </button>

                {showThemePicker && (
                  <div className="absolute top-9 right-0 z-[120] w-44 p-1.5 bg-[#0B0F19] border border-slate-800 rounded-sm shadow-2xl grid grid-cols-1 gap-0.5">
                    <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-slate-500 border-b border-slate-800 mb-1">
                      Color Calibration
                    </div>
                    {[
                      { id: 'dark', label: 'Obsidian Dark', dot: 'bg-cyan-400' },
                      { id: 'light', label: 'Laboratory Light', dot: 'bg-sky-500' },
                      { id: 'cyberpunk', label: 'Synchrotron Neon', dot: 'bg-fuchsia-500' },
                      { id: ' emerald', label: 'Phosphor Emerald', dot: 'bg-emerald-400' },
                      { id: 'sunset', label: 'Thermal Amber', dot: 'bg-amber-500' },
                      { id: 'ocean', label: 'Cherenkov Blue', dot: 'bg-blue-400' },
                    ].map((tOption) => {
                      const cleanId = tOption.id.trim();
                      const isActive = theme === cleanId;
                      return (
                        <button
                          key={cleanId}
                          type="button"
                          onClick={() => {
                            setTheme(cleanId);
                            setShowThemePicker(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-left text-[11px] font-mono transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-cyan-950/60 text-cyan-300 font-bold'
                              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${tOption.dot}`} />
                            <span>{tOption.label}</span>
                          </div>
                          {isActive && <span className="text-cyan-400">●</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {isRegistered ? (
                <div className="flex items-center gap-2">
                  <AnimatedGoToAppButton
                    variant="navbar"
                    onClick={() =>
                      onReturnToApp ? handleResumeApp() : handleEnterApp('login')
                    }
                    label={onReturnToApp ? 'Resume Studio' : 'Open Studio'}
                  />
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="p-2 bg-[#0B0F19] hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-sm transition-colors cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEnterApp('login')}
                    className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white border border-slate-800 bg-[#0B0F19] rounded-sm transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <AnimatedGoToAppButton
                    variant="navbar"
                    onClick={() => handleEnterApp('register')}
                    label="Launch Studio"
                  />
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              <LanguageSelector compact={true} />
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
                className="p-2 rounded-sm bg-[#0B0F19] border border-slate-800 text-slate-300 hover:text-white"
                aria-label="Toggle Menu"
              >
                {isMobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isMobileDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-[#0B0F19] border-b border-slate-800 px-6 py-5 shadow-2xl space-y-4"
            >
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    document.getElementById('modules-directory-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-2.5 bg-[#070A12] border border-slate-800 rounded-sm text-left text-slate-300"
                >
                  17 Workstations
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    document.getElementById('bragg-optical-bench')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-2.5 bg-[#070A12] border border-slate-800 rounded-sm text-left text-slate-300"
                >
                  Bragg Optical Bench
                </button>
                {onOpenWhyXrd && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenWhyXrd();
                    }}
                    className="p-2.5 bg-[#070A12] border border-slate-800 rounded-sm text-left text-cyan-400"
                  >
                    Theory Compendium
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setShowWelcomeTour(true);
                  }}
                  className="p-2.5 bg-[#070A12] border border-slate-800 rounded-sm text-left text-slate-300"
                >
                  Guided Tour
                </button>
              </div>
              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    handleEnterApp(isRegistered ? 'login' : 'register');
                  }}
                  className="w-full py-3 bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-sm"
                >
                  Launch Crystallography Suite
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ===================================================================
          HERO SECTION: HIGH-PRECISION CRYSTALLOGRAPHIC OBSERVATORY
         =================================================================== */}
      <main className="flex-1 pt-28 sm:pt-32">
        <section className="relative z-10 px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            {/* Top Telemetry Status Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-8 border-b border-slate-800 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-emerald-400 font-bold">● SYSTEM CALIBRATED: NIST SRM 640f (Si)</span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-400">17 SPECIALIZED ENGINES</span>
                <span className="text-slate-700 hidden sm:inline">|</span>
                <span className="text-cyan-400 hidden sm:inline">
                  RIETVELD · PARRATT XRR · TOTAL SCATTERING PDF G(r) · PINN AI
                </span>
              </div>
              {userName && (
                <div className="text-slate-300">
                  Operator: <span className="text-cyan-400 font-bold">{userName}</span>
                </div>
              )}
            </div>

            {/* 12-Column Asymmetric Hero Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left 5 Columns: Authority Typography, Command Bar & Direct Launch */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">
                    RECIPROCAL &amp; REAL-SPACE SCATTERING WORKSTATION
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-[1.08]">
                    Precision X-Ray Diffraction &amp; Structural Refinement.
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed mt-4">
                    Full-spectrum crystallographic studio uniting 7-stage{' '}
                    <span className="text-slate-200 font-medium">Rietveld refinement</span>,{' '}
                    <span className="text-slate-200 font-medium">Sine-Fourier Pair Distribution Functions G(r)</span>,{' '}
                    <span className="text-slate-200 font-medium">Parratt specular XRR</span>,{' '}
                    <span className="text-slate-200 font-medium">Warren–Averbach Fourier broadening</span>, and{' '}
                    <span className="text-slate-200 font-medium">Physics-Informed Neural Phase ID</span>.
                  </p>
                </div>

                {/* Global Command & Standard Search Bar */}
                <div ref={heroSearchRef} className="relative z-30">
                  <div className="bg-[#0B0F19] border border-slate-800 focus-within:border-cyan-500/70 rounded-sm p-1.5 shadow-xl">
                    {/* Category Filter Strip */}
                    <div className="flex items-center gap-1 pb-1.5 mb-1.5 border-b border-slate-800/80 px-1 overflow-x-auto">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'diffraction', label: 'Bragg & PDF' },
                        { id: 'crystallite', label: 'Size & Strain' },
                        { id: 'ai', label: 'Rietveld & PINN' },
                        { id: 'standards', label: 'CIF Standards' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setSearchCategory(tab.id as any);
                            setShowHeroSuggestions(true);
                          }}
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                            searchCategory === tab.id
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-cyan-400 ml-2.5 shrink-0" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={heroSearchTerm}
                        onFocus={() => setShowHeroSuggestions(true)}
                        onChange={(e) => {
                          setHeroSearchTerm(e.target.value);
                          setShowHeroSuggestions(true);
                          setActiveSuggestionIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          if (!showHeroSuggestions || displaySuggestions.length === 0) return;
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setActiveSuggestionIndex((prev) =>
                              prev < displaySuggestions.length - 1 ? prev + 1 : 0
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setActiveSuggestionIndex((prev) =>
                              prev > 0 ? prev - 1 : displaySuggestions.length - 1
                            );
                          } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
                            e.preventDefault();
                            const item = displaySuggestions[activeSuggestionIndex];
                            if (item) {
                              setShowHeroSuggestions(false);
                              handleEnterApp(
                                isRegistered ? 'login' : 'register',
                                item.type === 'module' ? item.id : 'database'
                              );
                            }
                          } else if (e.key === 'Escape') {
                            setShowHeroSuggestions(false);
                          }
                        }}
                        placeholder="Jump to module, equation, or standard (Press / or ⌘K)..."
                        className="w-full bg-transparent px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                      />
                      {heroSearchTerm ? (
                        <button
                          type="button"
                          onClick={() => setHeroSearchTerm('')}
                          className="mr-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-white bg-slate-900 rounded-sm"
                        >
                          CLR
                        </button>
                      ) : (
                        <kbd className="hidden sm:inline-block mr-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-[#070A12] border border-slate-800 rounded-sm">
                          ⌘K
                        </kbd>
                      )}
                    </div>
                  </div>

                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {showHeroSuggestions && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute left-0 right-0 mt-1.5 bg-[#0B0F19] border border-slate-700 rounded-sm shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto divide-y divide-slate-800/80"
                      >
                        {displaySuggestions.map((item, idx) => (
                          <div
                            key={`${item.type}-${item.id}-${idx}`}
                            onClick={() => {
                              setShowHeroSuggestions(false);
                              handleEnterApp(
                                isRegistered ? 'login' : 'register',
                                item.type === 'module' ? item.id : 'database'
                              );
                            }}
                            className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              activeSuggestionIndex === idx ? 'bg-slate-800' : 'hover:bg-slate-900/90'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-white truncate">
                                  {item.name}
                                </span>
                                <span className="text-[10px] font-mono text-cyan-400">
                                  [{item.badge}]
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {onReturnToApp ? (
                    <AnimatedGoToAppButton
                      variant="resume"
                      onClick={() => handleResumeApp()}
                      label="Resume Active Session"
                      sublabel={`Select target workstation (Current: ${activeModule ? activeModule.toUpperCase() : 'BRAGG'})`}
                    />
                  ) : (
                    <AnimatedGoToAppButton
                      variant="hero"
                      onClick={() => handleEnterApp(isRegistered ? 'login' : 'register')}
                      label={isRegistered ? 'Enter Crystallography Studio' : 'Launch Workstation Suite'}
                      sublabel="Direct access to all 17 analytical engines"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById('modules-directory-section')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="px-4 py-3.5 bg-[#0B0F19] hover:bg-slate-900 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-sm font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Explore 17 Engines
                  </button>
                </div>

                {/* Quick Direct-Launch Workstation Matrix */}
                <div className="pt-4 border-t border-slate-800/90">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2.5">
                    Direct Workstation Jump:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { id: 'rietveld', label: 'Rietveld Refinement', code: 'Rwp/χ²' },
                      { id: 'pdf_analysis', label: 'Total Scattering PDF', code: 'G(r)' },
                      { id: 'xrr', label: 'Specular XRR Engine', code: 'Parratt' },
                      { id: 'williamson', label: 'Williamson–Hall', code: 'UDM/USDM' },
                      { id: 'warren', label: 'Warren–Averbach', code: 'Fourier' },
                      { id: 'dl', label: 'Neural Phase ID', code: 'PINN-1D' },
                    ].map((quick) => (
                      <button
                        key={quick.id}
                        type="button"
                        onClick={() => handleEnterApp(isRegistered ? 'login' : 'register', quick.id)}
                        className="px-2.5 py-2 bg-[#0B0F19] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-sm text-left transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                          <span>{quick.code}</span>
                          <ArrowRight className="w-2.5 h-2.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate mt-0.5">
                          {quick.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 7 Columns: Live θ–2θ Goniometer & Rietveld Residual Console */}
              <div className="lg:col-span-7">
                <InteractiveHeroDiffractionShowcase
                  onLaunchSection={(section) =>
                    handleEnterApp(isRegistered ? 'login' : 'register', section)
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 1: INSTANT CRYSTALLOGRAPHIC BENCHMARK SUITE
           =================================================================== */}
        <ExperimentQuickLaunchpad
          onSelectPreset={(preset: ExperimentPreset) => {
            handleEnterApp(isRegistered ? 'login' : 'register', preset.targetSection);
          }}
        />

        {/* ===================================================================
            SECTION 2: COMPLETE 17-WORKSTATION ENGINE DIRECTORY
           =================================================================== */}
        <ModulesDirectory
          onSelectModule={(moduleId) => {
            handleEnterApp(isRegistered ? 'login' : 'register', moduleId);
          }}
        />

        {/* ===================================================================
            SECTION 3: INTERACTIVE BRAGG RAYBENCH & SCHERRER BROADENING SANDBOX
           =================================================================== */}
        <BraggOpticalBenchSandbox
          onEnter={(targetModule) =>
            handleEnterApp(isRegistered ? 'login' : 'register', targetModule || 'bragg')
          }
        />

        <ScherrerBroadeningDemo
          onLaunchScherrer={(target) =>
            handleEnterApp(isRegistered ? 'login' : 'register', target)
          }
        />

        {/* ===================================================================
            SECTION 4: CRYSTALLOGRAPHIC METHODOLOGY & FORMALISM MATRIX
           =================================================================== */}
        <section
          id="formalism-matrix-section"
          className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-800/80 bg-[#070A12]"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
                  <span>● MATHEMATICAL &amp; PHYSICAL FORMALISM</span>
                  <span className="text-slate-700">|</span>
                  <span className="text-slate-400">DIRECT SOLVER SELECTION MATRIX</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  Analytical Methodology &amp; Governing Equations
                </h2>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                Compare reciprocal-space coordinates, governing integral/differential equations, and extracted physical
                observables across our primary characterization engines.
              </p>
            </div>

            <div className="border border-slate-800 bg-[#0B0F19] rounded-sm overflow-x-auto shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#070A12] text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Analytical Engine</th>
                    <th className="py-3.5 px-4">Governing Mathematical Formalism</th>
                    <th className="py-3.5 px-4">Domain / Coordinate</th>
                    <th className="py-3.5 px-4">Extracted Physical Observables</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {FORMALISM_MATRIX.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleEnterApp(isRegistered ? 'login' : 'register', row.id)}
                      className="hover:bg-slate-900/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-semibold text-white group-hover:text-cyan-300 whitespace-nowrap">
                        {row.method}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-300 whitespace-nowrap">
                        {row.equation}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        {row.reciprocalSpaceVar}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <div>{row.observables}</div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">{row.regime}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-cyan-400 group-hover:translate-x-0.5 transition-transform uppercase">
                          Launch <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 5: REPRODUCIBLE PYTHON SCRIPTING & TELEMETRY PIPELINE
           =================================================================== */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-800/80 bg-[#070A12]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 border border-slate-800 bg-[#0B0F19] rounded-sm overflow-hidden shadow-2xl">
              {/* Left Column: Reproducible Workflows & Export Capabilities */}
              <div className="lg:col-span-5 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                    ● REPRODUCIBLE CRYSTALLOGRAPHIC PIPELINE
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Publication-Grade Telemetry &amp; Scriptable Batch Workflows
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Every refinement, Fourier deconvolution, and PDF transformation preserves full metrological
                    provenance—from Caglioti instrumental resolution matrices to standard uncertainties.
                  </p>

                  <div className="space-y-2.5 pt-2">
                    {[
                      {
                        title: 'NIST SRM 640f / 660c Instrumental Baseline',
                        desc: 'Automatic subtraction of instrumental Gaussian & Lorentzian breadths across 2θ.',
                      },
                      {
                        title: 'Multi-Format Scientific Data I/O',
                        desc: 'Import/export XY, CSV, CIF structural cards, and high-resolution SVG/PNG figures.',
                      },
                      {
                        title: 'Deterministic Floating-Point Solvers',
                        desc: 'Zero black-box heuristics—inspect every Jacobian matrix, Fourier harmonic, and residual.',
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-[#070A12] border border-slate-800 rounded-sm">
                        <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                          <span className="text-cyan-400">0{idx + 1}</span>
                          <span>{item.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEnterApp(isRegistered ? 'login' : 'register')}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span>Open Full Workstation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFooterModal('api-reference')}
                    className="px-4 py-2.5 bg-[#070A12] hover:bg-slate-900 text-slate-300 border border-slate-800 font-mono font-bold text-xs uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                  >
                    API Reference
                  </button>
                </div>
              </div>

              {/* Right Column: Code & Live Execution Output */}
              <div className="lg:col-span-7 bg-[#070A12] flex flex-col justify-between">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#0B0F19]">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span>rietveld_pdf_pipeline.py</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(pythonSnippet);
                      setCopiedSdk(true);
                      setTimeout(() => setCopiedSdk(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-[#070A12] hover:bg-slate-900 border border-slate-800 rounded-sm text-[10px] font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSdk ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>COPY SCRIPT</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  <code>{pythonSnippet}</code>
                </pre>

                {/* Simulated Execution Telemetry Output */}
                <div className="border-t border-slate-800 bg-[#050811] p-4 font-mono text-xs space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    STDOUT · SOLVER CONVERGENCE TELEMETRY
                  </div>
                  <div className="text-slate-300">
                    <span className="text-emerald-400">[OK]</span> Loaded 4,500 steps (10.0°–100.0° 2θ, Δ2θ = 0.020°)
                  </div>
                  <div className="text-slate-300">
                    <span className="text-cyan-400">[RIETVELD]</span> Converged in 7 iterations: Rwp = 2.18%, Rp =
                    1.64%, χ² = 1.34 (P4mm BaTiO₃)
                  </div>
                  <div className="text-slate-300">
                    <span className="text-amber-300">[PDF G(r)]</span> Sine-Fourier transform complete (Qmax = 24.0
                    Å⁻¹): r(Ti–O) = 1.998 Å, N_c = 6.02
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===================================================================
          SCIENTIFIC FOOTER & ATTRIBUTION
         =================================================================== */}
      <footer className="bg-[#050811] border-t border-slate-800 pt-14 pb-10 px-4 sm:px-6 lg:px-8 relative z-10 text-xs">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800/80">
            {/* Col 1-2: Brand & Mission */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <CrystallographicBrandEmblem />
                <div>
                  <span className="text-lg font-bold font-mono text-white">
                    XRD<span className="text-cyan-400">CalcPro</span>
                  </span>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    Computational Crystallography Observatory
                  </div>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-sm">
                Integrated analytical environment for powder diffraction, full-pattern Rietveld refinement, thin-film
                reflectometry, total scattering PDF analysis, and physics-informed neural phase identification.
              </p>
            </div>

            {/* Col 3: Core Workstations */}
            <div className="space-y-2">
              <div className="font-mono font-bold uppercase tracking-wider text-white mb-2">
                Core Workstations
              </div>
              {[
                { label: 'Bragg’s Law & d-Spacing', mod: 'bragg' },
                { label: 'Rietveld Refinement', mod: 'rietveld' },
                { label: 'Pair Distribution PDF G(r)', mod: 'pdf_analysis' },
                { label: 'X-Ray Reflectometry (XRR)', mod: 'xrr' },
                { label: 'Physics-Informed Neural ID', mod: 'dl' },
              ].map((link) => (
                <button
                  key={link.mod}
                  type="button"
                  onClick={() => handleEnterApp(isRegistered ? 'login' : 'register', link.mod)}
                  className="block text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Col 4: Line Profile & Strain */}
            <div className="space-y-2">
              <div className="font-mono font-bold uppercase tracking-wider text-white mb-2">
                Microstructure &amp; Strain
              </div>
              {[
                { label: 'Scherrer Domain Sizing', mod: 'scherrer' },
                { label: 'Williamson–Hall (UDM/USDM)', mod: 'williamson' },
                { label: 'Warren–Averbach Fourier', mod: 'warren' },
                { label: 'Double-Voigt Deconvolution', mod: 'double_voigt' },
                { label: 'Method of Moments W(σ)', mod: 'moments' },
              ].map((link) => (
                <button
                  key={link.mod}
                  type="button"
                  onClick={() => handleEnterApp(isRegistered ? 'login' : 'register', link.mod)}
                  className="block text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Col 5: Documentation & Legal */}
            <div className="space-y-2">
              <div className="font-mono font-bold uppercase tracking-wider text-white mb-2">
                Documentation &amp; Governance
              </div>
              <button
                type="button"
                onClick={() => setFooterModal('documentation')}
                className="block text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Methodology Documentation
              </button>
              <button
                type="button"
                onClick={() => setFooterModal('api-reference')}
                className="block text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Python SDK Reference
              </button>
              <button
                type="button"
                onClick={() => setShowChangelogModal(true)}
                className="block text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Version Changelog (v2.5)
              </button>
              <button
                type="button"
                onClick={() => setFooterModal('about-creator')}
                className="block text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer font-semibold"
              >
                About Creator (Ali Zerehsaz)
              </button>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="block text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="block text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Terms of Use
              </button>
            </div>
          </div>

          {/* Bottom Attribution Strip */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-500">
            <div>
              © {new Date().getFullYear()} XRD-CalcPro Scientific Suite. Designed &amp; engineered by{' '}
              <button
                type="button"
                onClick={() => setFooterModal('about-creator')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-cyan-500/40 underline-offset-4 cursor-pointer"
              >
                Ali Zerehsaz
              </button>
              .
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="mailto:alizerehsaz2001@gmail.com"
                className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <span>alizerehsaz2001@gmail.com</span>
              </a>
              <span className="text-slate-700">|</span>
              <a
                href="https://github.com/alizerehsaz2001-pixel"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-700">|</span>
              <span className="text-emerald-400">● ALL 17 SOLVERS OPERATIONAL</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 p-2.5 bg-[#0B0F19] hover:bg-slate-900 text-cyan-400 border border-slate-700 rounded-sm shadow-xl cursor-pointer"
            title="Scroll to Top"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modals */}
      <LegalModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        content={i18n.language === 'fa' ? PRIVACY_POLICY_DATA.fa : PRIVACY_POLICY_DATA.en}
        isRTL={isRTL}
      />
      <LegalModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        content={i18n.language === 'fa' ? TERMS_OF_USE_DATA.fa : TERMS_OF_USE_DATA.en}
        isRTL={isRTL}
      />
      <LegalModal
        isOpen={showChangelogModal}
        onClose={() => setShowChangelogModal(false)}
        content={i18n.language === 'fa' ? CHANGELOG_DATA.fa : CHANGELOG_DATA.en}
        isRTL={isRTL}
      />

      <FooterInfoModal
        isOpen={footerModal !== null}
        modalType={footerModal}
        onClose={() => setFooterModal(null)}
        isRTL={isRTL}
        onActionNavigate={(mod) => {
          setFooterModal(null);
          handleEnterApp(isRegistered ? 'login' : 'register', mod);
        }}
      />

      <WelcomeTourModal
        isOpen={showWelcomeTour}
        onClose={() => setShowWelcomeTour(false)}
        isRTL={isRTL}
        onLaunch={(mode, mod) => {
          setShowWelcomeTour(false);
          handleEnterApp(mode, mod);
        }}
      />

      <ResumeSectionPickerModal
        isOpen={showResumePickerModal}
        onClose={() => setShowResumePickerModal(false)}
        onSelectSection={handleSelectResumeSection}
        previousActiveModule={activeModule}
        isRTL={isRTL}
      />

      <AppLaunchPortal
        isOpen={isEnteringApp}
        targetModule={pendingTargetModule}
        mode={isResumingApp ? 'resume' : pendingLaunchMode}
        userName={userName}
        onComplete={() => {
          setIsEnteringApp(false);
          if (isResumingApp && onReturnToApp) {
            onReturnToApp(pendingTargetModule);
          } else {
            onEnter(pendingLaunchMode, pendingTargetModule);
          }
        }}
      />
    </div>
  );
};
