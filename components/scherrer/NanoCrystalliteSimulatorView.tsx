import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  Atom,
  Sliders,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  Compass
} from 'lucide-react';
import { ScherrerInput } from '../../types';
import { calculateWilliamsonHall, calculateMonshiScherrer } from '../../utils/physics';

interface NanoCrystalliteSimulatorViewProps {
  wavelength: number;
  kFactor: number;
  instFwhm: number;
  onApplySimulatedPeaks?: (peaks: ScherrerInput[], label: string) => void;
}

interface CrystalTemplate {
  id: string;
  name: string;
  formula: string;
  latticeA: number;
  reflections: { hkl: [number, number, number]; relInt: number }[];
}

const CRYSTAL_TEMPLATES: CrystalTemplate[] = [
  {
    id: 'si_dc',
    name: 'Silicon (Diamond Cubic)',
    formula: 'Si (a = 5.4309 Å)',
    latticeA: 5.4309,
    reflections: [
      { hkl: [1, 1, 1], relInt: 100 },
      { hkl: [2, 2, 0], relInt: 55 },
      { hkl: [3, 1, 1], relInt: 30 },
      { hkl: [4, 0, 0], relInt: 8 },
      { hkl: [3, 3, 1], relInt: 12 },
      { hkl: [4, 2, 2], relInt: 16 }
    ]
  },
  {
    id: 'ceo2_fcc',
    name: 'Ceria Fluorite Nanopowder',
    formula: 'CeO₂ (a = 5.4113 Å)',
    latticeA: 5.4113,
    reflections: [
      { hkl: [1, 1, 1], relInt: 100 },
      { hkl: [2, 0, 0], relInt: 30 },
      { hkl: [2, 2, 0], relInt: 52 },
      { hkl: [3, 1, 1], relInt: 40 },
      { hkl: [2, 2, 2], relInt: 9 },
      { hkl: [4, 0, 0], relInt: 8 }
    ]
  },
  {
    id: 'au_fcc',
    name: 'Gold Colloidal Nanocrystals',
    formula: 'Au FCC (a = 4.0782 Å)',
    latticeA: 4.0782,
    reflections: [
      { hkl: [1, 1, 1], relInt: 100 },
      { hkl: [2, 0, 0], relInt: 48 },
      { hkl: [2, 2, 0], relInt: 28 },
      { hkl: [3, 1, 1], relInt: 32 },
      { hkl: [2, 2, 2], relInt: 10 }
    ]
  },
  {
    id: 'fe_bcc',
    name: 'α-Iron Milled Nanopowder',
    formula: 'α-Fe BCC (a = 2.8665 Å)',
    latticeA: 2.8665,
    reflections: [
      { hkl: [1, 1, 0], relInt: 100 },
      { hkl: [2, 0, 0], relInt: 19 },
      { hkl: [2, 1, 1], relInt: 30 },
      { hkl: [2, 2, 0], relInt: 10 }
    ]
  }
];

type HabitMode = 'spherical' | 'cube_100' | 'octahedron_111' | 'nanorod_001' | 'platelet_001';

export const NanoCrystalliteSimulatorView: React.FC<NanoCrystalliteSimulatorViewProps> = ({
  wavelength,
  kFactor,
  instFwhm,
  onApplySimulatedPeaks
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ceo2_fcc');
  const [trueDomainSizeNm, setTrueDomainSizeNm] = useState<number>(14.0);
  const [trueMicrostrainPct, setTrueMicrostrainPct] = useState<number>(0.18);
  const [habitMode, setHabitMode] = useState<HabitMode>('spherical');
  const [aspectRatio, setAspectRatio] = useState<number>(2.5);
  const [appliedBanner, setAppliedBanner] = useState<boolean>(false);

  const template = useMemo(
    () => CRYSTAL_TEMPLATES.find((t) => t.id === selectedTemplateId) || CRYSTAL_TEMPLATES[0],
    [selectedTemplateId]
  );

  // Forward physical synthesis of reflections & whole-pattern profile
  const simulation = useMemo(() => {
    const a = template.latticeA;
    const simulatedPeaks: (ScherrerInput & {
      betaSizeDeg: number;
      betaStrainDeg: number;
      betaInstDeg: number;
      directionalSizeNm: number;
      dSpacing: number;
    })[] = [];

    for (const ref of template.reflections) {
      const [h, k, l] = ref.hkl;
      const h2k2l2 = h * h + k * k + l * l;
      const d = a / Math.sqrt(h2k2l2);
      const sinTheta = wavelength / (2 * d);
      if (sinTheta >= 0.96) continue;

      const thetaRad = Math.asin(sinTheta);
      const twoTheta = (2 * thetaRad * 180) / Math.PI;
      const cosTheta = Math.cos(thetaRad);
      const tanTheta = Math.tan(thetaRad);

      // Compute habit-dependent effective domain thickness D_hkl
      let dirFactor = 1.0;
      const norm = Math.sqrt(h2k2l2);
      const cosPhiZ = Math.abs(l) / norm;
      if (habitMode === 'cube_100') {
        const sumAbs = (Math.abs(h) + Math.abs(k) + Math.abs(l)) / norm;
        dirFactor = 1 / Math.max(0.65, 0.88 * sumAbs);
      } else if (habitMode === 'octahedron_111') {
        const maxAbs = Math.max(Math.abs(h), Math.abs(k), Math.abs(l)) / norm;
        dirFactor = 0.86 / Math.max(0.55, maxAbs);
      } else if (habitMode === 'nanorod_001') {
        // Elongated along [001]
        dirFactor = Math.sqrt(
          Math.pow(cosPhiZ * aspectRatio, 2) + Math.pow(1 - cosPhiZ * cosPhiZ, 2)
        );
      } else if (habitMode === 'platelet_001') {
        // Thin along [001]
        const plateRatio = 1 / Math.max(1.2, aspectRatio);
        dirFactor = Math.sqrt(
          Math.pow(cosPhiZ * plateRatio, 2) + Math.pow(1 - cosPhiZ * cosPhiZ, 2)
        );
      }

      const dHklNm = Math.max(1.2, trueDomainSizeNm * dirFactor);
      const dHklAngstrom = dHklNm * 10;

      // Lorentzian size broadening + Gaussian strain broadening -> Voigt approximation
      const betaSizeRad = (kFactor * wavelength) / (dHklAngstrom * cosTheta);
      const betaStrainRad = 4 * (trueMicrostrainPct / 100) * tanTheta;

      const betaSizeDeg = (betaSizeRad * 180) / Math.PI;
      const betaStrainDeg = (betaStrainRad * 180) / Math.PI;
      const betaInstDeg = Math.max(0.02, instFwhm);

      // Olivero-Longbothum Voigt combination of Lorentzian (size) + Gaussian (strain + inst)
      const fL = betaSizeDeg;
      const fG = Math.sqrt(betaStrainDeg * betaStrainDeg + betaInstDeg * betaInstDeg);
      const fwhmObs = 0.5346 * fL + Math.sqrt(0.2166 * fL * fL + fG * fG);

      simulatedPeaks.push({
        twoTheta: Number(twoTheta.toFixed(3)),
        fwhmObs: Number(fwhmObs.toFixed(4)),
        intensity: ref.relInt,
        hkl: ref.hkl,
        betaSizeDeg: Number(betaSizeDeg.toFixed(4)),
        betaStrainDeg: Number(betaStrainDeg.toFixed(4)),
        betaInstDeg: Number(betaInstDeg.toFixed(4)),
        directionalSizeNm: Number(dHklNm.toFixed(2)),
        dSpacing: Number(d.toFixed(4))
      });
    }

    // Run inverse recovery models on the forward-simulated peaks
    const scherrerSizes = simulatedPeaks.map((p) => {
      const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
      const betaCorr = Math.sqrt(Math.max(1e-6, p.fwhmObs * p.fwhmObs - instFwhm * instFwhm));
      const dAng = (kFactor * wavelength) / ((betaCorr * Math.PI) / 180 * Math.cos(thetaRad));
      return dAng / 10;
    });
    const meanScherrerNm =
      scherrerSizes.reduce((s, v) => s + v, 0) / Math.max(1, scherrerSizes.length);

    const msFit = calculateMonshiScherrer(
      wavelength,
      kFactor,
      instFwhm,
      simulatedPeaks,
      'Gaussian',
      'constant'
    );

    const whUdm = calculateWilliamsonHall(
      wavelength,
      kFactor,
      instFwhm,
      simulatedPeaks,
      'Gaussian',
      'constant',
      undefined,
      130,
      'UDM'
    );

    const whHw = calculateWilliamsonHall(
      wavelength,
      kFactor,
      instFwhm,
      simulatedPeaks,
      'Gaussian',
      'constant',
      undefined,
      130,
      'Halder-Wagner'
    );

    // Generate continuous diffractogram points (20° to 90° 2θ)
    const minDeg = Math.max(15, Math.floor((simulatedPeaks[0]?.twoTheta || 25) - 7));
    const maxDeg = Math.min(105, Math.ceil((simulatedPeaks[simulatedPeaks.length - 1]?.twoTheta || 80) + 7));
    const steps = 220;
    const stepDeg = (maxDeg - minDeg) / steps;

    const patternData = Array.from({ length: steps + 1 }, (_, i) => {
      const tt = minDeg + i * stepDeg;
      let totalInt = 2.0;
      let sizeOnlyInt = 2.0;

      for (const pk of simulatedPeaks) {
        const dx = tt - pk.twoTheta;
        const wTotal = Math.max(0.06, pk.fwhmObs);
        const wSizeOnly = Math.max(0.06, Math.sqrt(pk.betaSizeDeg * pk.betaSizeDeg + pk.betaInstDeg * pk.betaInstDeg));

        if (Math.abs(dx) < wTotal * 5) {
          const hwhm = wTotal / 2;
          const pv = 0.5 * Math.exp(-Math.LN2 * Math.pow(dx / hwhm, 2)) + 0.5 / (1 + Math.pow(dx / hwhm, 2));
          totalInt += pk.intensity * pv;
        }
        if (Math.abs(dx) < wSizeOnly * 5) {
          const hwhm0 = wSizeOnly / 2;
          const pv0 = 0.5 * Math.exp(-Math.LN2 * Math.pow(dx / hwhm0, 2)) + 0.5 / (1 + Math.pow(dx / hwhm0, 2));
          sizeOnlyInt += pk.intensity * pv0;
        }
      }

      return {
        twoTheta: Number(tt.toFixed(2)),
        totalPattern: Number(totalInt.toFixed(2)),
        sizeOnlyPattern: Number(sizeOnlyInt.toFixed(2))
      };
    });

    const benchmarkData = [
      {
        model: 'True Input D₀',
        sizeNm: Number(trueDomainSizeNm.toFixed(2)),
        strainPct: Number(trueMicrostrainPct.toFixed(3)),
        color: '#10b981'
      },
      {
        model: 'Classical Scherrer',
        sizeNm: Number(meanScherrerNm.toFixed(2)),
        strainPct: 0,
        color: '#f59e0b'
      },
      {
        model: 'Monshi-Scherrer',
        sizeNm: Number((msFit?.sizeNm || meanScherrerNm).toFixed(2)),
        strainPct: Number(((msFit?.estimatedStrain || 0) * 100).toFixed(3)),
        color: '#38bdf8'
      },
      {
        model: 'Williamson-Hall (UDM)',
        sizeNm: Number((whUdm?.sizeInterceptNm || trueDomainSizeNm).toFixed(2)),
        strainPct: Number((whUdm?.strainPercent || 0).toFixed(3)),
        color: '#a855f7'
      },
      {
        model: 'Halder-Wagner (Voigt)',
        sizeNm: Number((whHw?.sizeInterceptNm || trueDomainSizeNm).toFixed(2)),
        strainPct: Number((whHw?.strainPercent || 0).toFixed(3)),
        color: '#ec4899'
      }
    ];

    return {
      simulatedPeaks,
      patternData,
      benchmarkData,
      minDeg,
      maxDeg,
      meanScherrerNm,
      whUdm,
      whHw
    };
  }, [template, trueDomainSizeNm, trueMicrostrainPct, habitMode, aspectRatio, kFactor, wavelength, instFwhm]);

  const handlePushToWorkbench = () => {
    if (!onApplySimulatedPeaks) return;
    onApplySimulatedPeaks(
      simulation.simulatedPeaks,
      `${template.name} (D=${trueDomainSizeNm}nm, ε=${trueMicrostrainPct}%)`
    );
    setAppliedBanner(true);
    setTimeout(() => setAppliedBanner(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Header & 1-Click Load Button */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30 shrink-0">
            <Atom className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Interactive Nano-Crystallite & Whole-Pattern Broadening Simulator
              </h4>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-mono font-bold text-cyan-300">
                Forward Voigt Synthesis + Multi-Model Inversion
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Simulate finite nanocrystal size (1.5–100 nm), lattice microstrain ε, and anisotropic habit to observe how Scherrer, Monshi, W-H, and Halder-Wagner recover the true domain size.
            </p>
          </div>
        </div>

        {onApplySimulatedPeaks && (
          <button
            type="button"
            onClick={handlePushToWorkbench}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shrink-0 shadow-md"
          >
            {appliedBanner ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Loaded into Active Peak Table!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Load Simulated Peaks into Workbench</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Interactive Physical Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Crystal Phase & Habit Selector (5 cols) */}
        <div className="md:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            1. Reference Crystal Lattice & Habit
          </label>

          <div className="grid grid-cols-2 gap-1.5">
            {CRYSTAL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplateId(t.id)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedTemplateId === t.id
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[10px] font-bold truncate">{t.name}</div>
                <div className="text-[8.5px] font-mono text-slate-500 truncate">{t.formula}</div>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-400 uppercase">Nanocrystal Morphology:</span>
              <span className="font-mono text-cyan-400 font-bold uppercase">{habitMode.replace('_', ' ')}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { id: 'spherical', label: 'Spherical' },
                { id: 'cube_100', label: 'Cube {100}' },
                { id: 'octahedron_111', label: 'Octa {111}' },
                { id: 'nanorod_001', label: 'c-Axis Rod' },
                { id: 'platelet_001', label: 'Nanoplatelet' }
              ] as const).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHabitMode(h.id)}
                  className={`py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase border cursor-pointer transition-all ${
                    habitMode === h.id
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Domain Size D0, Microstrain & Anisotropy Sliders (7 cols) */}
        <div className="md:col-span-7 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            2. Physical Broadening Parameters (True Ground-Truth State)
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono tabular-nums">
                <span className="text-[10px] font-bold text-slate-300 uppercase">True Domain Size (D₀):</span>
                <span className="text-emerald-400 font-black">{trueDomainSizeNm.toFixed(1)} nm</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="80.0"
                step="0.5"
                value={trueDomainSizeNm}
                onChange={(e) => setTrueDomainSizeNm(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[8.5px] font-mono text-slate-500">
                <span>2 nm (Quantum Dot)</span>
                <span>25 nm (Nanocrystal)</span>
                <span>80 nm (Sub-micron)</span>
              </div>
            </div>

            <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono tabular-nums">
                <span className="text-[10px] font-bold text-slate-300 uppercase">True Microstrain (ε_rms):</span>
                <span className="text-amber-400 font-black">{trueMicrostrainPct.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="0.00"
                max="0.60"
                step="0.01"
                value={trueMicrostrainPct}
                onChange={(e) => setTrueMicrostrainPct(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[8.5px] font-mono text-slate-500">
                <span>0.00% (Annealed)</span>
                <span>0.20% (Strained)</span>
                <span>0.60% (Ball-Milled)</span>
              </div>
            </div>
          </div>

          {(habitMode === 'nanorod_001' || habitMode === 'platelet_001') && (
            <div className="bg-slate-900/70 p-3 rounded-xl border border-indigo-500/30 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono tabular-nums">
                <span className="text-[10px] font-bold text-indigo-300 uppercase">
                  {habitMode === 'nanorod_001' ? 'c-Axis Elongation Ratio (L_c / L_a):' : 'Basal Compression Ratio (L_a / L_c):'}
                </span>
                <span className="text-indigo-300 font-black">{aspectRatio.toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min="1.2"
                max="5.0"
                step="0.1"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          )}

          {/* Live Recovery Accuracy Strip */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {simulation.benchmarkData.slice(1).map((b) => {
              const errPct = ((b.sizeNm - trueDomainSizeNm) / trueDomainSizeNm) * 100;
              return (
                <div key={b.model} className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 font-mono tabular-nums">
                  <span className="text-[8.5px] text-slate-400 uppercase font-bold block truncate">{b.model}</span>
                  <div className="text-xs font-black text-white mt-0.5">{b.sizeNm.toFixed(1)} nm</div>
                  <span
                    className={`text-[8px] font-bold ${
                      Math.abs(errPct) <= 8 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {errPct >= 0 ? '+' : ''}
                    {errPct.toFixed(1)}% vs D₀
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dual Chart Row: Whole-Pattern Diffractogram + Multi-Model Recovery Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Forward-Synthesized Diffractogram (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Forward-Synthesized Powder Pattern (Size + Strain vs Size-Only)
            </span>
            <span>λ = {wavelength.toFixed(4)} Å</span>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={simulation.patternData} margin={{ top: 10, right: 15, left: -20, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="twoTheta"
                  type="number"
                  domain={[simulation.minDeg, simulation.maxDeg]}
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  unit="°"
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Area
                  type="monotone"
                  dataKey="totalPattern"
                  name="Total Broadened Profile (D₀ + ε)"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.22}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="sizeOnlyPattern"
                  name="Pure Size Broadening (ε = 0)"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Model Inversion Benchmark Chart (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Multi-Model Domain Size Recovery (nm)
            </span>
            <span className="text-emerald-400 font-bold">Target: {trueDomainSizeNm.toFixed(1)} nm</span>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simulation.benchmarkData} layout="vertical" margin={{ top: 10, right: 20, left: 25, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} unit=" nm" />
                <YAxis
                  type="category"
                  dataKey="model"
                  width={120}
                  tick={{ fill: '#cbd5e1', fontSize: 9.5, fontFamily: 'monospace', fontWeight: 'bold' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} nm`, 'Recovered Size D']}
                />
                <ReferenceLine x={trueDomainSizeNm} stroke="#10b981" strokeDasharray="3 3" />
                <Bar dataKey="sizeNm" radius={[0, 6, 6, 0]}>
                  {simulation.benchmarkData.map((entry, idx) => (
                    <Cell key={`bench-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
