import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  Check,
  Code2,
  Compass,
  Copy,
  Download,
  Flame,
  Layers,
  Lock,
  Play,
  RotateCcw,
  Sliders,
  Unlock,
} from 'lucide-react';
import {
  CAGLIOTI_PRESETS,
  DRILLDOWN_SPACE_GROUP_INFO,
  generateSymmetryOrbit,
  ProtocolSubTab,
  QPA_PRESETS,
  RIETVELD_STEPS,
} from './protocolData';
import { LatexBlock, LatexInline, ProtocolHeader, StatusIndicator } from './ProtocolShared';

interface RietveldProtocolSectionProps {
  activeSubTab: ProtocolSubTab;
  setActiveSubTab: (tab: ProtocolSubTab) => void;
}

const SUBTABS: { id: ProtocolSubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'checklist', label: 'Sequential Locks', icon: <Lock size={13} /> },
  { id: 'symmetry', label: 'Symmetry Operations', icon: <Compass size={13} /> },
  { id: 'qpa', label: 'Hill-Howard QPA', icon: <Layers size={13} /> },
  { id: 'caglioti', label: 'Caglioti FWHM', icon: <Sliders size={13} /> },
  { id: 'preferred', label: 'March-Dollase Texture', icon: <BarChart2 size={13} /> },
  { id: 'python', label: 'Python SDK', icon: <Code2 size={13} /> },
];

const QUICK_HKLS: [number, number, number][] = [
  [1, 0, 0],
  [1, 1, 0],
  [1, 1, 1],
  [0, 0, 1],
  [0, 0, 2],
  [0, 0, 3],
];

export const RietveldProtocolSection: React.FC<RietveldProtocolSectionProps> = ({
  activeSubTab,
  setActiveSubTab,
}) => {
  // 1. Sequential Locks state
  const [unlockedStep, setUnlockedStep] = useState<number>(1);
  const [divergedMode, setDivergedMode] = useState<boolean>(false);

  // 2. Symmetry Operations state
  const groupKeys = Object.keys(DRILLDOWN_SPACE_GROUP_INFO);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>('Rutile');
  const [symmetryPlane, setSymmetryPlane] = useState<'ab' | 'bc' | 'ac'>('ab');
  const [coordX, setCoordX] = useState<number>(0.305);
  const [coordY, setCoordY] = useState<number>(0.305);
  const [coordZ, setCoordZ] = useState<number>(0.125);
  const [selectedOpIdx, setSelectedOpIdx] = useState<number>(0);
  const [hklInput, setHklInput] = useState<[number, number, number]>([1, 1, 0]);
  const [asymS, setAsymS] = useState<number>(0.025);
  const [etaMix, setEtaMix] = useState<number>(0.45);

  // 3. Hill-Howard QPA state
  const [ternaryEnabled, setTernaryEnabled] = useState<boolean>(true);
  const [qpaPhases, setQpaPhases] = useState([
    { ...QPA_PRESETS[0].p1 },
    { ...QPA_PRESETS[0].p2 },
    { ...QPA_PRESETS[0].p3 },
  ]);

  // 4. Caglioti state
  const [cagU, setCagU] = useState<number>(CAGLIOTI_PRESETS[1].u);
  const [cagV, setCagV] = useState<number>(CAGLIOTI_PRESETS[1].v);
  const [cagW, setCagW] = useState<number>(CAGLIOTI_PRESETS[1].w);
  const [cagHoverTheta, setCagHoverTheta] = useState<number | null>(null);

  // 5. March-Dollase state
  const [marchR, setMarchR] = useState<number>(0.55);
  const [marchHoverAlpha, setMarchHoverAlpha] = useState<number | null>(null);

  // 6. Python SDK state
  const [sdkBackend, setSdkBackend] = useState<'scipy' | 'gsas2'>('scipy');
  const [customPrompt, setCustomPrompt] = useState<string>(
    'Generate a Levenberg-Marquardt pseudo-Voigt Rietveld refinement script with Chebyshev background and specimen displacement correction.'
  );
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // --- Computed: Sequential Refinement Profile ---
  const activeMetrics = divergedMode
    ? { rFactor: 94.8, rBragg: 78.2, rExp: 6.4, chi2: 14.81 }
    : RIETVELD_STEPS[unlockedStep - 1].metrics;

  const rietveldProfile = useMemo(() => {
    const pts: { x: number; obs: number; calc: number; diff: number }[] = [];
    const shiftErr = divergedMode ? 1.85 : Math.max(0, (2 - unlockedStep) * 0.45);
    const scaleErr = divergedMode ? 0.35 : unlockedStep >= 1 ? 1.0 : 0.65;
    const widthErr = divergedMode ? 2.1 : Math.max(0, (4 - unlockedStep) * 0.14);
    const ampErr = divergedMode ? 0.55 : unlockedStep >= 5 ? 1.0 : 0.86;

    const obsPeaks = [
      { pos: 28.44, amp: 88, sig: 0.42 },
      { pos: 47.3, amp: 54, sig: 0.48 },
      { pos: 56.12, amp: 36, sig: 0.52 },
      { pos: 69.13, amp: 24, sig: 0.58 },
    ];

    for (let t = 20; t <= 78; t += 0.35) {
      let yObs = 8 + Math.exp(-t / 30) * 6 + Math.sin(t * 7.3) * 0.6;
      let yCalc =
        (unlockedStep >= 1 ? 8 + Math.exp(-t / 30) * 6 : 2) * (divergedMode ? 1.8 : 1);

      obsPeaks.forEach((p, idx) => {
        yObs += p.amp * Math.exp(-Math.pow(t - p.pos, 2) / (2 * p.sig * p.sig));
        const cPos = p.pos + shiftErr * (idx % 2 === 0 ? 1 : -0.6);
        const cSig = p.sig + widthErr;
        const cAmp = p.amp * scaleErr * (idx === 1 ? ampErr : 1.0);
        yCalc += cAmp * Math.exp(-Math.pow(t - cPos, 2) / (2 * cSig * cSig));
      });

      const sx = 25 + ((t - 20) / 58) * 390;
      const syObs = 115 - Math.min(100, yObs);
      const syCalc = 115 - Math.min(100, yCalc);
      const syDiff = 148 - Math.max(-22, Math.min(22, (yObs - yCalc) * 0.42));
      pts.push({ x: sx, obs: syObs, calc: syCalc, diff: syDiff });
    }

    const braggTicks = obsPeaks.map((p) => 25 + ((p.pos - 20) / 58) * 390);
    return { pts, braggTicks };
  }, [unlockedStep, divergedMode]);

  // --- Computed: Space Group & Symmetry Orbit ---
  const sg = DRILLDOWN_SPACE_GROUP_INFO[selectedGroupKey] ?? DRILLDOWN_SPACE_GROUP_INFO.Rutile;
  const safeOpIdx = Math.min(selectedOpIdx, sg.operators.length - 1);
  const activeOp = sg.operators[safeOpIdx];
  const detW = useMemo(() => {
    const m = activeOp.matrix;
    return (
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    );
  }, [activeOp]);
  const traceW = activeOp.matrix[0][0] + activeOp.matrix[1][1] + activeOp.matrix[2][2];

  const orbitPoints = useMemo(
    () => generateSymmetryOrbit(selectedGroupKey, coordX, coordY, coordZ),
    [selectedGroupKey, coordX, coordY, coordZ]
  );

  const fSymTable = useMemo(() => {
    const evalHkl = (h: number, k: number, l: number) => {
      let re = 0;
      let im = 0;
      orbitPoints.forEach((pt) => {
        const phase = 2 * Math.PI * (h * pt.x + k * pt.y + l * pt.z);
        re += Math.cos(phase);
        im += Math.sin(phase);
      });
      const mag = Math.sqrt(re * re + im * im);
      const normalized = mag / Math.max(1, orbitPoints.length);
      return { h, k, l, re, im, mag, normalized, allowed: mag > 1e-4 };
    };

    const custom = evalHkl(hklInput[0], hklInput[1], hklInput[2]);
    const table = QUICK_HKLS.map(([h, k, l]) => evalHkl(h, k, l));
    return { custom, table };
  }, [orbitPoints, hklInput]);

  // --- Computed: QPA Hill-Howard ---
  const qpaComputed = useMemo(() => {
    const active = ternaryEnabled ? qpaPhases : qpaPhases.slice(0, 2);
    const items = active.map((p) => {
      const szmv = Math.max(0, p.scale) * p.z * p.mass * p.vol;
      const rho = p.vol > 0 ? (p.z * p.mass) / (0.602214 * p.vol) : 0;
      return { ...p, szmv, rho };
    });
    const totalSzmv = Math.max(1e-12, items.reduce((acc, i) => acc + i.szmv, 0));
    return items.map((i) => ({ ...i, wtPct: (i.szmv / totalSzmv) * 100 }));
  }, [qpaPhases, ternaryEnabled]);

  // --- Computed: Caglioti FWHM ---
  const cagliotiCurve = useMemo(() => {
    const pts: { twoTheta: number; hSq: number; fwhm: number; valid: boolean }[] = [];
    for (let tt = 10; tt <= 120; tt += 1) {
      const tanT = Math.tan(((tt / 2) * Math.PI) / 180);
      const hSq = cagU * tanT * tanT + cagV * tanT + cagW;
      pts.push({
        twoTheta: tt,
        hSq,
        fwhm: hSq > 0 ? Math.sqrt(hSq) : 0,
        valid: hSq > 0,
      });
    }
    const minFwhm = Math.min(...pts.filter((p) => p.valid).map((p) => p.fwhm), 0);
    const hasNegative = pts.some((p) => !p.valid);
    const disc = cagV * cagV - 4 * cagU * cagW;
    return { pts, minFwhm, hasNegative, hasUnphysicalRoot: disc > 0 && cagU > 0 };
  }, [cagU, cagV, cagW]);

  // --- Computed: March-Dollase Curve ---
  const marchCurve = useMemo(() => {
    const evalMarch = (alphaDeg: number, r: number) => {
      const rad = (alphaDeg * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      const denom = r * r * c * c + (s * s) / Math.max(0.05, r);
      return Math.pow(denom, -1.5);
    };
    const pts = Array.from({ length: 91 }, (_, deg) => ({
      alpha: deg,
      p: evalMarch(deg, marchR),
    }));
    return {
      pts,
      p0: evalMarch(0, marchR),
      p90: evalMarch(90, marchR),
      morphology:
        marchR < 0.92
          ? 'Platy / Micaceous Texture (00l enhanced)'
          : marchR > 1.08
          ? 'Acicular / Needle Texture (hk0 enhanced)'
          : 'Near-Isotropic Powder Distribution',
    };
  }, [marchR]);

  const defaultPythonScript = useMemo(() => {
    if (sdkBackend === 'gsas2') {
      return `"""
XRD-Calc Automated Rietveld SOP Script (GSAS-II Python API)
Enforces 5-Gate Sequential Refinement Locks to prevent Jacobian divergence.
"""
import GSASIIscriptable as G2sc

gpx = G2sc.G2Project(newgpx="refinement_sop.gpx")
hist = gpx.add_powder_histogram("sample_scan.xye", "CuKa_Lab_IRF.instprm")
phase = gpx.add_phase("structure_model.cif", phasename="TargetPhase", histograms=[hist])

# Gate 1: Background & Scale ONLY
gpx.do_refinements([{"set": {"Background": {"type": "chebyschev-1", "no. coeffs": 6, "refine": True}, "Scale": True}}])

# Gate 2: Zero-Shift & Specimen Displacement (s * cos theta)
gpx.do_refinements([{"set": {"Sample Parameters": ["Shift"]}}])

# Gate 3: Bravais Cell Lattice Constants
gpx.do_refinements([{"set": {"Cell": True}}])

# Gate 4: Caglioti Profile Broadening (U, V, W) & Mixing (eta)
gpx.do_refinements([{"set": {"Instrument Parameters": ["U", "V", "W", "X", "Y"]}}])

# Gate 5: Fractional Coordinates & Thermal B_iso
gpx.do_refinements([{"set": {"Atoms": {"all": "XU"}}}])

print(f"Converged Rwp = {hist.get_wR():.3f}% | GoF = {gpx.get_GoF():.3f}")
`;
    }
    return `"""
Standalone NumPy/SciPy Rietveld Profile Least-Squares Kernel
Demonstrates Caglioti FWHM + Pseudo-Voigt + Hill-Howard QPA Check
"""
import numpy as np
from scipy.optimize import least_squares

def caglioti_fwhm(two_theta_deg, U=${cagU.toFixed(4)}, V=${cagV.toFixed(4)}, W=${cagW.toFixed(4)}):
    tan_t = np.tan(np.radians(two_theta_deg / 2.0))
    h2 = np.maximum(1e-6, U * tan_t**2 + V * tan_t + W)
    return np.sqrt(h2)

def pseudo_voigt(x, x0, amp, fwhm, eta=${etaMix.toFixed(2)}):
    sigma = fwhm / (2.0 * np.sqrt(2.0 * np.log(2.0)))
    gamma = fwhm / 2.0
    G = np.exp(-0.5 * ((x - x0) / sigma)**2)
    L = 1.0 / (1.0 + ((x - x0) / gamma)**2)
    return amp * (eta * L + (1.0 - eta) * G)

if __name__ == "__main__":
    tt = np.linspace(20.0, 80.0, 1200)
    fwhm = caglioti_fwhm(tt)
    y_calc = pseudo_voigt(tt, 28.443, 1000.0, caglioti_fwhm(28.443))
    print(f"Peak @ 28.443 deg: FWHM = {caglioti_fwhm(28.443):.4f} deg | Max I = {y_calc.max():.1f}")
`;
  }, [sdkBackend, cagU, cagV, cagW, etaMix]);

  const activeScript = generatedCode ?? defaultPythonScript;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1600);
  };

  const handleDownloadPy = () => {
    const blob = new Blob([activeScript], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sdkBackend === 'gsas2' ? 'rietveld_gsas2_sop.py' : 'rietveld_scipy_kernel.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateCustomScript = async () => {
    if (!customPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setCodeError(null);
    try {
      const res = await fetch('/api/gemini/coder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          context: {
            backend: sdkBackend,
            caglioti: { U: cagU, V: cagV, W: cagW },
            marchDollaseR: marchR,
            spaceGroup: sg.hermannMauguin,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        setGeneratedCode(data.text);
      } else {
        setCodeError(data.error || 'Failed to synthesize script on server.');
      }
    } catch {
      setCodeError('Network error communicating with script synthesis endpoint.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatOpMatrixTex = (op: typeof activeOp) => {
    const row = (r: number) =>
      `${op.matrix[r][0]} & ${op.matrix[r][1]} & ${op.matrix[r][2]}`;
    const fmtFrac = (v: number) =>
      Math.abs(v - 0.5) < 1e-4
        ? '\\frac{1}{2}'
        : Math.abs(v - 1 / 3) < 1e-4
        ? '\\frac{1}{3}'
        : Math.abs(v - 2 / 3) < 1e-4
        ? '\\frac{2}{3}'
        : '0';
    return `W = \\begin{pmatrix} ${row(0)} \\\\ ${row(1)} \\\\ ${row(2)} \\end{pmatrix},\\quad \\mathbf{w} = \\begin{pmatrix} ${fmtFrac(op.translation[0])} \\\\ ${fmtFrac(op.translation[1])} \\\\ ${fmtFrac(op.translation[2])} \\end{pmatrix}`;
  };

  return (
    <div className="space-y-6">
      <ProtocolHeader
        badge="SOP-05 • Rietveld & Crystallographic Kernels"
        badgeTone="amber"
        title="Rietveld Structure Refinement & Mathematical Protocol Lab"
        subtitle="Master sequential least-squares parameter locking, 3D space-group affine matrix transformations, Hill-Howard QPA quantification, Caglioti FWHM calibration, and March-Dollase texture corrections."
      />

      {/* Sub-Navigation Bar */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
        {SUBTABS.map((t) => {
          const active = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveSubTab(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SEQUENTIAL LOCKS */}
      {activeSubTab === 'checklist' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500">
                Sequential Release Gates (1 → 5)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDivergedMode((d) => !d)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    divergedMode
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                  }`}
                >
                  <Flame size={11} />
                  {divergedMode ? 'Exit Divergence' : 'Test Divergence (Unlock All)'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDivergedMode(false);
                    setUnlockedStep(1);
                  }}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                >
                  <RotateCcw size={11} />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {RIETVELD_STEPS.map((s) => {
                const unlocked = !divergedMode && s.step <= unlockedStep;
                const current = !divergedMode && s.step === unlockedStep;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      setDivergedMode(false);
                      setUnlockedStep(s.step);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                      divergedMode
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40'
                        : current
                        ? 'bg-amber-50/60 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500/50'
                        : unlocked
                        ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        divergedMode
                          ? 'bg-rose-600 text-white'
                          : unlocked
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {unlocked || divergedMode ? <Unlock size={12} /> : <Lock size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Gate {s.step}: {s.title}
                        </h4>
                        <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                          R_wp {s.metrics.rFactor}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-5 text-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                  Least-Squares Profile Residual Monitor
                </span>
                <h3 className="text-sm font-bold text-white">
                  {divergedMode
                    ? 'SOLVER DIVERGENCE — Simultaneous Covariance Explosion'
                    : `Gate ${unlockedStep} Active: ${RIETVELD_STEPS[unlockedStep - 1].status}`}
                </h3>
              </div>
              <StatusIndicator
                tone={divergedMode ? 'critical' : unlockedStep === 5 ? 'nominal' : 'warning'}
                label={
                  divergedMode
                    ? 'Singular Jacobian'
                    : unlockedStep === 5
                    ? 'Structure Converged'
                    : `Step ${unlockedStep}/5`
                }
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">R_wp (%)</span>
                <span
                  className={`text-xl font-bold tabular-nums ${
                    divergedMode ? 'text-rose-400' : unlockedStep >= 4 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {activeMetrics.rFactor.toFixed(1)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">R_Bragg (%)</span>
                <span className="text-xl font-bold tabular-nums text-cyan-400">
                  {activeMetrics.rBragg.toFixed(1)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">R_exp (%)</span>
                <span className="text-xl font-bold tabular-nums text-slate-300">
                  {activeMetrics.rExp.toFixed(1)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">χ² (GoF)</span>
                <span
                  className={`text-xl font-bold tabular-nums ${
                    divergedMode ? 'text-rose-400' : activeMetrics.chi2 <= 1.5 ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {activeMetrics.chi2.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span>DIFFRACTION PROFILE: Y_obs (Circles) vs Y_calc (Line)</span>
                <div className="flex gap-3">
                  <span className="text-cyan-400">— Y_calc</span>
                  <span className="text-amber-400">| hkl</span>
                  <span className="text-rose-400">— Y_obs - Y_calc</span>
                </div>
              </div>
              <svg viewBox="0 0 430 180" className="w-full h-56">
                <line x1="25" y1="115" x2="415" y2="115" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
                <line x1="25" y1="148" x2="415" y2="148" stroke="rgba(148,163,184,0.18)" strokeWidth="0.8" strokeDasharray="3 3" />
                <polyline
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  points={rietveldProfile.pts.map((p) => `${p.x.toFixed(1)},${p.obs.toFixed(1)}`).join(' ')}
                />
                <polyline
                  fill="none"
                  stroke={divergedMode ? '#f43f5e' : '#22d3ee'}
                  strokeWidth="2"
                  points={rietveldProfile.pts.map((p) => `${p.x.toFixed(1)},${p.calc.toFixed(1)}`).join(' ')}
                />
                {rietveldProfile.braggTicks.map((bx, i) => (
                  <line key={i} x1={bx} y1="120" x2={bx} y2="127" stroke="#fbbf24" strokeWidth="1.8" />
                ))}
                <polyline
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="1.3"
                  points={rietveldProfile.pts.map((p) => `${p.x.toFixed(1)},${p.diff.toFixed(1)}`).join(' ')}
                />
                <text x="25" y="175" fontSize="8" fontFamily="monospace" fill="#64748b">20° 2θ</text>
                <text x="220" y="175" fontSize="8" fontFamily="monospace" fill="#64748b" textAnchor="middle">Residuals (Y_obs − Y_calc)</text>
                <text x="415" y="175" fontSize="8" fontFamily="monospace" fill="#64748b" textAnchor="end">78° 2θ</text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYMMETRY OPERATIONS */}
      {activeSubTab === 'symmetry' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap gap-1.5">
              {groupKeys.map((gk) => (
                <button
                  key={gk}
                  type="button"
                  onClick={() => {
                    setSelectedGroupKey(gk);
                    setSelectedOpIdx(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap ${
                    selectedGroupKey === gk
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {gk} ({DRILLDOWN_SPACE_GROUP_INFO[gk].hermannMauguin})
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              IT #{sg.number} • {sg.crystalSystem} • {sg.centrosymmetric ? 'Centrosymmetric' : 'Non-Centrosymmetric / Chiral'}
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-5 text-white space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                    2D Fractional Plane Projection (Click to Move Atom)
                  </span>
                  <span className="text-xs font-mono text-amber-400">
                    Orbit Multiplicity = {orbitPoints.length} equivalent sites
                  </span>
                </div>
                <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {(['ab', 'bc', 'ac'] as const).map((pl) => (
                    <button
                      key={pl}
                      type="button"
                      onClick={() => setSymmetryPlane(pl)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        symmetryPlane === pl ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pl}
                    </button>
                  ))}
                </div>
              </div>

              <svg
                viewBox="0 0 240 240"
                className="w-full max-w-[300px] mx-auto bg-slate-900 rounded-xl border border-slate-800 cursor-crosshair"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ux = Math.max(0.02, Math.min(0.98, ((e.clientX - rect.left) / rect.width - 0.1) / 0.8));
                  const uy = Math.max(0.02, Math.min(0.98, 1 - ((e.clientY - rect.top) / rect.height - 0.1) / 0.8));
                  if (symmetryPlane === 'ab') {
                    setCoordX(Number(ux.toFixed(3)));
                    setCoordY(Number(uy.toFixed(3)));
                  } else if (symmetryPlane === 'bc') {
                    setCoordY(Number(ux.toFixed(3)));
                    setCoordZ(Number(uy.toFixed(3)));
                  } else {
                    setCoordX(Number(ux.toFixed(3)));
                    setCoordZ(Number(uy.toFixed(3)));
                  }
                }}
              >
                {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                  const p = 24 + g * 192;
                  return (
                    <g key={g}>
                      <line x1={p} y1="24" x2={p} y2="216" stroke={g === 0.5 ? '#475569' : '#1e293b'} strokeWidth="1" strokeDasharray={g === 0.5 ? '3 3' : undefined} />
                      <line x1="24" y1={p} x2="216" y2={p} stroke={g === 0.5 ? '#475569' : '#1e293b'} strokeWidth="1" strokeDasharray={g === 0.5 ? '3 3' : undefined} />
                    </g>
                  );
                })}
                <rect x="24" y="24" width="192" height="192" fill="none" stroke="#64748b" strokeWidth="1.5" />
                {orbitPoints.map((pt, i) => {
                  const u = symmetryPlane === 'ab' ? pt.x : symmetryPlane === 'bc' ? pt.y : pt.x;
                  const v = symmetryPlane === 'ab' ? pt.y : symmetryPlane === 'bc' ? pt.z : pt.z;
                  const depth = symmetryPlane === 'ab' ? pt.z : symmetryPlane === 'bc' ? pt.x : pt.y;
                  const cx = 24 + u * 192;
                  const cy = 216 - v * 192;
                  return (
                    <g key={i}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={pt.isSource ? 6 : 4.5}
                        fill={pt.isSource ? '#fbbf24' : i === safeOpIdx ? '#22d3ee' : '#818cf8'}
                        stroke="#0f172a"
                        strokeWidth="1.2"
                      />
                      <text x={cx + 6} y={cy - 4} fontSize="7" fontFamily="monospace" fill="#cbd5e1">
                        {depth.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
                <text x="120" y="232" fontSize="9" fontFamily="monospace" fill="#94a3b8" textAnchor="middle">
                  {symmetryPlane === 'ab' ? 'a (x)' : symmetryPlane === 'bc' ? 'b (y)' : 'a (x)'}
                </text>
                <text x="12" y="120" fontSize="9" fontFamily="monospace" fill="#94a3b8" textAnchor="middle" transform="rotate(-90 12 120)">
                  {symmetryPlane === 'ab' ? 'b (y)' : 'c (z)'}
                </text>
              </svg>

              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {[
                  { label: 'x', val: coordX, set: setCoordX },
                  { label: 'y', val: coordY, set: setCoordY },
                  { label: 'z', val: coordZ, set: setCoordZ },
                ].map((c) => (
                  <div key={c.label} className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{c.label}</span>
                      <span className="text-white">{c.val.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={c.val}
                      onChange={(e) => c.set(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="xl:col-span-7 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                    Seitz Affine Matrix Operator [W | w]
                  </span>
                  <div className="flex gap-2 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      det(W) = {detW >= 0 ? `+${detW}` : detW} ({detW > 0 ? 'Proper' : 'Improper'})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      tr(W) = {traceW}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {sg.operators.map((op, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedOpIdx(idx)}
                      className={`px-2 py-1 rounded text-[11px] font-mono border ${
                        safeOpIdx === idx
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      ({idx + 1}) {op.algebraic}
                    </button>
                  ))}
                </div>

                <LatexBlock tex={formatOpMatrixTex(activeOp)} />
                <p className="text-xs text-slate-600 dark:text-slate-400">{sg.extinctionRuleSummary}</p>
              </div>

              {/* Systematic Extinction Structure Factor F_sym(hkl) Solver */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Exact <LatexInline tex="|F_{\text{sym}}(hkl)|" /> Extinction Verifier
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {QUICK_HKLS.map(([h, k, l]) => (
                      <button
                        key={`${h}${k}${l}`}
                        type="button"
                        onClick={() => setHklInput([h, k, l])}
                        className={`px-2 py-0.5 rounded font-mono text-[10px] border ${
                          hklInput[0] === h && hklInput[1] === k && hklInput[2] === l
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        ({h}{k}{l})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                        <th className="py-1.5 pr-3">hkl</th>
                        <th className="py-1.5 pr-3">Σ cos(φ)</th>
                        <th className="py-1.5 pr-3">Σ sin(φ)</th>
                        <th className="py-1.5 pr-3">|F_sym|</th>
                        <th className="py-1.5">Selection Rule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fSymTable.table.map((row) => (
                        <tr key={`${row.h}${row.k}${row.l}`} className="border-b border-slate-200/60 dark:border-slate-800/60">
                          <td className="py-1.5 pr-3 font-bold text-slate-900 dark:text-white">({row.h}{row.k}{row.l})</td>
                          <td className="py-1.5 pr-3 tabular-nums text-slate-600 dark:text-slate-300">{row.re.toFixed(2)}</td>
                          <td className="py-1.5 pr-3 tabular-nums text-slate-600 dark:text-slate-300">{row.im.toFixed(2)}</td>
                          <td className="py-1.5 pr-3 tabular-nums font-bold text-indigo-600 dark:text-indigo-400">{row.mag.toFixed(2)}</td>
                          <td className="py-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.allowed
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                              }`}
                            >
                              {row.allowed ? 'ALLOWED' : 'SYSTEMATICALLY EXTINCT'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Split Pseudo-Voigt Asymmetry */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                      Axial Divergence Asymmetry (Split Pseudo-Voigt)
                    </span>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        <span>Asymmetry S/L</span>
                        <span>{asymS.toFixed(3)}</span>
                      </div>
                      <input type="range" min="0" max="0.08" step="0.002" value={asymS} onChange={(e) => setAsymS(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-300">
                        <span>Lorentzian Mixing η</span>
                        <span>{etaMix.toFixed(2)}</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05" value={etaMix} onChange={(e) => setEtaMix(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
                    </div>
                  </div>
                  <svg viewBox="0 0 220 75" className="w-full h-24 bg-slate-950 rounded-xl border border-slate-800">
                    <line x1="15" y1="62" x2="205" y2="62" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
                    <polyline
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2"
                      points={Array.from({ length: 81 }, (_, i) => {
                        const dx = (i - 45) / 10;
                        const w = dx < 0 ? 0.55 + asymS * 18 : 0.55;
                        const g = Math.exp(-0.5 * (dx / w) * (dx / w));
                        const l = 1 / (1 + (dx / w) * (dx / w));
                        const y = 48 * (etaMix * l + (1 - etaMix) * g);
                        return `${(15 + (i / 80) * 190).toFixed(1)},${(62 - y).toFixed(1)}`;
                      }).join(' ')}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HILL-HOWARD QPA */}
      {activeSubTab === 'qpa' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {QPA_PRESETS.map((pr) => (
                <button
                  key={pr.name}
                  type="button"
                  onClick={() => {
                    setTernaryEnabled(pr.ternary);
                    setQpaPhases([{ ...pr.p1 }, { ...pr.p2 }, { ...pr.p3 }]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  {pr.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTernaryEnabled((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-mono font-bold"
            >
              Mode: {ternaryEnabled ? 'Ternary (3 Phases)' : 'Binary (2 Phases)'}
            </button>
          </div>

          <LatexBlock tex="W_\alpha = \frac{S_\alpha (Z M V)_\alpha}{\sum_j S_j (Z M V)_j}, \qquad \rho_\alpha = \frac{Z_\alpha M_\alpha}{0.602214 \cdot V_\alpha}\; [\text{g/cm}^3]" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {qpaComputed.map((p, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h4>
                  <span className="text-lg font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    {p.wtPct.toFixed(1)} wt%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>Rietveld Scale S</span>
                    <span>{p.scale.toFixed(5)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0001"
                    max="0.006"
                    step="0.0001"
                    value={p.scale}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setQpaPhases((prev) => prev.map((item, i) => (i === idx ? { ...item, scale: val } : item)));
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] text-slate-500 pt-1">
                  <div className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="block">V (Å³)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.vol}</span>
                  </div>
                  <div className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="block">Z · M</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{(p.z * p.mass).toFixed(0)}</span>
                  </div>
                  <div className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="block">ρ (g/cm³)</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{p.rho.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Normalized Phase Fraction Distribution
            </span>
            <div className="h-6 w-full rounded-lg overflow-hidden flex border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold">
              {qpaComputed.map((p, idx) => (
                <div
                  key={idx}
                  style={{ width: `${p.wtPct}%` }}
                  className={`h-full flex items-center justify-center truncate px-1 text-white ${
                    idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-cyan-600' : 'bg-indigo-600'
                  }`}
                >
                  {p.wtPct > 8 ? `${p.wtPct.toFixed(1)}%` : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CAGLIOTI FWHM */}
      {activeSubTab === 'caglioti' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {CAGLIOTI_PRESETS.map((cp) => (
              <button
                key={cp.name}
                type="button"
                onClick={() => {
                  setCagU(cp.u);
                  setCagV(cp.v);
                  setCagW(cp.w);
                }}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                {cp.name}
              </button>
            ))}
          </div>

          {cagliotiCurve.hasNegative && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 flex items-center gap-3 text-xs text-rose-800 dark:text-rose-200">
              <AlertTriangle size={16} className="shrink-0 text-rose-500" />
              <span>Unphysical negative <span className="font-mono font-bold">H² &lt; 0</span> detected across scan span. Increase W or reduce negative V magnitude.</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <LatexInline tex="H^2(\theta) = U\tan^2\theta + V\tan\theta + W" className="block text-center text-sm" />
              {[
                { label: 'U (Strain / High-2θ)', val: cagU, set: setCagU, min: 0, max: 0.25, step: 0.001 },
                { label: 'V (Focusing / Mid-2θ)', val: cagV, set: setCagV, min: -0.2, max: 0.1, step: 0.001 },
                { label: 'W (Zero-Angle Floor)', val: cagW, set: setCagW, min: 0.0005, max: 0.1, step: 0.0005 },
              ].map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
                    <span>{s.label}</span>
                    <span className="font-bold">{s.val.toFixed(4)}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={(e) => s.set(parseFloat(e.target.value))} className="w-full accent-amber-500" />
                </div>
              ))}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs flex justify-between">
                <span className="text-slate-500">Min Resolution H_min</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{cagliotiCurve.minFwhm.toFixed(4)}°</span>
              </div>
            </div>

            <div className="lg:col-span-8 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-white space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>INSTRUMENTAL RESOLUTION CURVE (FWHM vs 2θ)</span>
                <span className="text-amber-400">
                  {cagHoverTheta !== null
                    ? (() => {
                        const tt = Math.round(cagHoverTheta);
                        const pt = cagliotiCurve.pts.find((p) => p.twoTheta === tt);
                        return pt ? `2θ = ${pt.twoTheta}° | H = ${pt.fwhm.toFixed(4)}°` : '';
                      })()
                    : 'Hover plot for coordinate telemetry'}
                </span>
              </div>
              <svg
                viewBox="0 0 440 190"
                className="w-full h-56 cursor-crosshair"
                onMouseLeave={() => setCagHoverTheta(null)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ux = ((e.clientX - rect.left) / rect.width) * 440;
                  setCagHoverTheta(Math.max(10, Math.min(120, 10 + ((ux - 35) / 385) * 110)));
                }}
              >
                <line x1="35" y1="160" x2="420" y2="160" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
                <line x1="35" y1="20" x2="35" y2="160" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
                <polyline
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.2"
                  points={cagliotiCurve.pts
                    .map((p) => {
                      const x = 35 + ((p.twoTheta - 10) / 110) * 385;
                      const y = 160 - Math.min(135, (p.fwhm / 0.8) * 135);
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ')}
                />
                {cagHoverTheta !== null && (() => {
                  const pt = cagliotiCurve.pts.find((p) => p.twoTheta === Math.round(cagHoverTheta));
                  if (!pt) return null;
                  const hx = 35 + ((pt.twoTheta - 10) / 110) * 385;
                  const hy = 160 - Math.min(135, (pt.fwhm / 0.8) * 135);
                  return (
                    <>
                      <line x1={hx} y1="20" x2={hx} y2="160" stroke="#94a3b8" strokeWidth="0.7" strokeDasharray="2 2" />
                      <circle cx={hx} cy={hy} r="3.5" fill="#22d3ee" />
                    </>
                  );
                })()}
                <text x="35" y="176" fontSize="8" fontFamily="monospace" fill="#94a3b8">10°</text>
                <text x="420" y="176" fontSize="8" fontFamily="monospace" fill="#94a3b8" textAnchor="end">120° 2θ</text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MARCH-DOLLASE TEXTURE */}
      {activeSubTab === 'preferred' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <LatexInline tex="P_{\text{MD}}(\alpha) = \left( r^2 \cos^2\alpha + \frac{\sin^2\alpha}{r} \right)^{-3/2}" className="block text-center text-sm" />
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Platelets (r=0.45)', r: 0.45 },
                { label: 'Isotropic (r=1.00)', r: 1.0 },
                { label: 'Needles (r=1.65)', r: 1.65 },
              ].map((pr) => (
                <button
                  key={pr.label}
                  type="button"
                  onClick={() => setMarchR(pr.r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border ${
                    Math.abs(marchR - pr.r) < 0.02
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {pr.label}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
                <span>March-Dollase Coefficient (r)</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{marchR.toFixed(2)}</span>
              </div>
              <input type="range" min="0.35" max="2.0" step="0.05" value={marchR} onChange={(e) => setMarchR(parseFloat(e.target.value))} className="w-full accent-amber-500" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Basal (00l) α=0°</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{marchCurve.p0.toFixed(2)}×</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">Orthogonal (hk0) α=90°</span>
                <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{marchCurve.p90.toFixed(2)}×</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{marchCurve.morphology}</p>
          </div>

          <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-white space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>POLE ORIENTATION INTENSITY SCALING P_MD(α)</span>
              <span className="text-amber-400">
                {marchHoverAlpha !== null
                  ? `α = ${Math.round(marchHoverAlpha)}° | P_MD = ${marchCurve.pts[Math.round(marchHoverAlpha)]?.p.toFixed(2)}×`
                  : 'Hover curve for multiplier'}
              </span>
            </div>
            <svg
              viewBox="0 0 420 185"
              className="w-full h-56 cursor-crosshair"
              onMouseLeave={() => setMarchHoverAlpha(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ux = ((e.clientX - rect.left) / rect.width) * 420;
                setMarchHoverAlpha(Math.max(0, Math.min(90, ((ux - 35) / 365) * 90)));
              }}
            >
              <line x1="35" y1="155" x2="400" y2="155" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
              <line x1="35" y1="20" x2="35" y2="155" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.4"
                points={marchCurve.pts
                  .map((pt) => {
                    const x = 35 + (pt.alpha / 90) * 365;
                    const y = 155 - Math.min(130, (pt.p / 6) * 130);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ')}
              />
              {marchHoverAlpha !== null && (() => {
                const pt = marchCurve.pts[Math.round(marchHoverAlpha)];
                if (!pt) return null;
                const hx = 35 + (pt.alpha / 90) * 365;
                const hy = 155 - Math.min(130, (pt.p / 6) * 130);
                return <circle cx={hx} cy={hy} r="3.5" fill="#fbbf24" />;
              })()}
              <text x="35" y="172" fontSize="8" fontFamily="monospace" fill="#94a3b8">0° (Basal)</text>
              <text x="400" y="172" fontSize="8" fontFamily="monospace" fill="#94a3b8" textAnchor="end">90° (Orthogonal)</text>
            </svg>
          </div>
        </div>
      )}

      {/* TAB 6: PYTHON SDK */}
      {activeSubTab === 'python' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              {(['scipy', 'gsas2'] as const).map((bk) => (
                <button
                  key={bk}
                  type="button"
                  onClick={() => {
                    setSdkBackend(bk);
                    setGeneratedCode(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
                    sdkBackend === bk
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {bk === 'scipy' ? 'NumPy / SciPy Kernel' : 'GSAS-II API Pipeline'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPy}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Download size={13} /> Download .py
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
              placeholder="Describe custom Python refinement workflow..."
            />
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateCustomScript}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Play size={13} />
              {isGenerating ? 'Synthesizing...' : 'Generate Custom Script'}
            </button>
          </div>

          {codeError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
              {codeError}
            </div>
          )}

          <pre className="p-5 bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 font-mono text-xs leading-relaxed overflow-x-auto max-h-[420px]">
            <code>{activeScript}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
