import React, { useState } from 'react';
import { 
  Activity, 
  Flame, 
  Sparkles, 
  Layers, 
  RotateCcw, 
  Check, 
  Copy,
  Sliders,
  Scale
} from 'lucide-react';
import { LatticeParams, CrystalSystem, fmt, solveSymmetricEigenvalues3x3 } from './metricTensorTypes';

interface MetricTensorStrainThermalTabProps {
  system: CrystalSystem;
  params: LatticeParams;
  volumeV: number;
  metricG: number[][];
}

const STRAIN_PRESETS = [
  {
    name: 'Hydrostatic Compression (-0.5% volume)',
    e11: -0.00167, e22: -0.00167, e33: -0.00167, e12: 0, e23: 0, e13: 0
  },
  {
    name: 'Uniaxial Tension along c (+0.8%)',
    e11: -0.002, e22: -0.002, e33: 0.008, e12: 0, e23: 0, e13: 0
  },
  {
    name: 'Biaxial In-Plane Strain (+0.4% in ab)',
    e11: 0.004, e22: 0.004, e33: -0.0025, e12: 0, e23: 0, e13: 0
  },
  {
    name: 'Monoclinic Shear Distortion (ε₁₃ = 0.5%)',
    e11: 0, e22: 0, e33: 0, e12: 0, e23: 0, e13: 0.005
  },
  {
    name: 'Pure Engineering Shear (γ₁₂ = 0.6%)',
    e11: 0, e22: 0, e33: 0, e12: 0.003, e23: 0, e13: 0
  },
  {
    name: 'Reset Zero Strain',
    e11: 0, e22: 0, e33: 0, e12: 0, e23: 0, e13: 0
  }
];

export const MetricTensorStrainThermalTab: React.FC<MetricTensorStrainThermalTabProps> = ({
  system,
  params,
  volumeV,
  metricG
}) => {
  // Strain tensor components (dimensionless)
  const [e11, setE11] = useState<number>(0.002);
  const [e22, setE22] = useState<number>(0.002);
  const [e33, setE33] = useState<number>(-0.001);
  const [e12, setE12] = useState<number>(0);
  const [e23, setE23] = useState<number>(0);
  const [e13, setE13] = useState<number>(0);

  // Thermal Expansion simulation state
  const [deltaT, setDeltaT] = useState<number>(300); // in Kelvin
  const [alpha11, setAlpha11] = useState<number>(8.5); // 10^-6 K^-1
  const [alpha22, setAlpha22] = useState<number>(8.5); // 10^-6 K^-1
  const [alpha33, setAlpha33] = useState<number>(14.2); // 10^-6 K^-1

  // Deformed Metric Tensor G' = G + 2 * (Strain in basis)
  // Simplified infinitesimal strain approximation: G'_ij = G_ij + 2 * epsilon_ij * sqrt(G_ii * G_jj)
  const deformedG = [
    [
      metricG[0][0] * (1 + 2 * e11),
      metricG[0][1] + 2 * e12 * Math.sqrt(metricG[0][0] * metricG[1][1]),
      metricG[0][2] + 2 * e13 * Math.sqrt(metricG[0][0] * metricG[2][2]),
    ],
    [
      metricG[1][0] + 2 * e12 * Math.sqrt(metricG[0][0] * metricG[1][1]),
      metricG[1][1] * (1 + 2 * e22),
      metricG[1][2] + 2 * e23 * Math.sqrt(metricG[1][1] * metricG[2][2]),
    ],
    [
      metricG[2][0] + 2 * e13 * Math.sqrt(metricG[0][0] * metricG[2][2]),
      metricG[2][1] + 2 * e23 * Math.sqrt(metricG[1][1] * metricG[2][2]),
      metricG[2][2] * (1 + 2 * e33),
    ]
  ];

  // Deformed parameters
  const defA = Math.sqrt(deformedG[0][0]);
  const defB = Math.sqrt(deformedG[1][1]);
  const defC = Math.sqrt(deformedG[2][2]);

  // Determinant of deformed G
  const detDefG = (
    deformedG[0][0] * (deformedG[1][1] * deformedG[2][2] - deformedG[1][2] * deformedG[2][1]) -
    deformedG[0][1] * (deformedG[1][0] * deformedG[2][2] - deformedG[1][2] * deformedG[2][0]) +
    deformedG[0][2] * (deformedG[1][0] * deformedG[2][1] - deformedG[1][1] * deformedG[2][0])
  );
  const defVolume = detDefG > 0 ? Math.sqrt(detDefG) : volumeV;
  const volumetricStrain = volumeV > 0 ? ((defVolume - volumeV) / volumeV) * 100 : 0;

  // Principal Strains (Eigenvalues of strain tensor)
  const strainMatrix = [
    [e11, e12, e13],
    [e12, e22, e23],
    [e13, e23, e33]
  ];
  const [eps1, eps2, eps3] = solveSymmetricEigenvalues3x3(strainMatrix);

  // Thermal lattice dilation: a(T) = a0 * (1 + alpha11 * 1e-6 * deltaT)
  const thermalA = params.a * (1 + alpha11 * 1e-6 * deltaT);
  const thermalB = params.b * (1 + alpha22 * 1e-6 * deltaT);
  const thermalC = params.c * (1 + alpha33 * 1e-6 * deltaT);
  const thermalVolChangePct = (alpha11 + alpha22 + alpha33) * 1e-6 * deltaT * 100;

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            <span>TENSOR MECHANICS & THERMODYNAMICS</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            3D Lattice Strain & Anisotropic Thermal Expansion
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Simulate how external mechanical stress or thermal heating transforms the crystallographic metric tensor <span className="font-mono text-cyan-300">G → G'</span>, and compute principal strain eigenvalues.
          </p>
        </div>
      </div>

      {/* Strain Tensor Simulation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Strain Inputs & Presets (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 p-6 rounded-3xl border border-slate-800/80 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">
                1. 3D Infinitesimal Strain Tensor (ε_ij)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Dimensionless (1% = 0.01)</span>
          </div>

          {/* Quick Strain Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 block font-mono font-bold">Standard Strain Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {STRAIN_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setE11(p.e11); setE22(p.e22); setE33(p.e33);
                    setE12(p.e12); setE23(p.e23); setE13(p.e13);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 text-[10px] font-mono font-bold border border-slate-800 transition-all cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Normal Strains */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-cyan-300 block">Normal Axial Strains:</span>
            <div className="grid grid-cols-3 gap-3 font-mono">
              {[
                { label: 'ε₁₁ (along a)', val: e11, set: setE11 },
                { label: 'ε₂₂ (along b)', val: e22, set: setE22 },
                { label: 'ε₃₃ (along c)', val: e33, set: setE33 },
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{item.label}</span>
                  <input
                    type="number"
                    step="0.001"
                    value={item.val}
                    onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-white font-mono font-bold text-sm px-2 py-1 rounded border border-slate-700 outline-none focus:border-rose-500 mt-1"
                  />
                  <div className="text-[9px] text-rose-400 mt-0.5 font-bold">
                    {(item.val * 100).toFixed(3)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shear Strains */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-violet-300 block">Shear Strains:</span>
            <div className="grid grid-cols-3 gap-3 font-mono">
              {[
                { label: 'ε₁₂ (ab plane)', val: e12, set: setE12 },
                { label: 'ε₂₃ (bc plane)', val: e23, set: setE23 },
                { label: 'ε₁₃ (ac plane)', val: e13, set: setE13 },
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{item.label}</span>
                  <input
                    type="number"
                    step="0.001"
                    value={item.val}
                    onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-white font-mono font-bold text-sm px-2 py-1 rounded border border-slate-700 outline-none focus:border-violet-500 mt-1"
                  />
                  <div className="text-[9px] text-violet-400 mt-0.5 font-bold">
                    {(item.val * 100).toFixed(3)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deformed Lattice & Principal Strains (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 p-6 rounded-3xl border border-slate-800/80 space-y-5 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  Deformed Lattice & Eigenvalues
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-300">G' = G + 2ε</span>
            </div>

            {/* Principal Strain Eigenvalues */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 font-mono space-y-2">
              <span className="text-[11px] text-slate-400 block font-bold">Principal Strains (Eigenvalues):</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                  <span className="text-[9px] text-emerald-400 block font-bold">ε₁ (Major)</span>
                  <span className="text-white font-bold">{(eps1 * 100).toFixed(3)}%</span>
                </div>
                <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                  <span className="text-[9px] text-emerald-400 block font-bold">ε₂ (Med)</span>
                  <span className="text-white font-bold">{(eps2 * 100).toFixed(3)}%</span>
                </div>
                <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                  <span className="text-[9px] text-emerald-400 block font-bold">ε₃ (Minor)</span>
                  <span className="text-white font-bold">{(eps3 * 100).toFixed(3)}%</span>
                </div>
              </div>
            </div>

            {/* Deformed Parameters Comparison */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-300">
                <span>Original Volume V₀:</span>
                <span className="text-cyan-300 font-bold">{fmt(volumeV, 3)} Å³</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Deformed Volume V':</span>
                <span className="text-emerald-300 font-bold">{fmt(defVolume, 3)} Å³</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-white font-bold">Volumetric Strain (ΔV/V):</span>
                <span className={`font-black text-sm px-2 py-0.5 rounded-md ${
                  volumetricStrain >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {volumetricStrain >= 0 ? '+' : ''}{volumetricStrain.toFixed(3)}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400">
            Deformed Axes: a' = {fmt(defA, 4)} Å | b' = {fmt(defB, 4)} Å | c' = {fmt(defC, 4)} Å
          </div>
        </div>

      </div>

      {/* Anisotropic Thermal Expansion Simulation */}
      <div className="bg-slate-950 p-6 lg:p-8 rounded-3xl border border-slate-800/80 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                2. Anisotropic Thermal Expansion Tensor (α_ij)
              </h3>
              <p className="text-xs text-slate-400">
                Computes directional lattice parameter dilation <span className="font-mono text-amber-300">a_i(T) = a_i₀ · [1 + α_ii · ΔT]</span>
              </p>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800 font-mono text-xs">
            <span className="text-amber-300 font-bold">ΔT = {deltaT > 0 ? `+${deltaT}` : deltaT} K</span>
            <input
              type="range"
              min={-250}
              max={1200}
              step={25}
              value={deltaT}
              onChange={(e) => setDeltaT(Number(e.target.value))}
              className="w-32 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Thermal Coefficients & Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
            <span className="text-slate-400 font-bold block">α₁₁ (along a-axis) [10⁻⁶ K⁻¹]:</span>
            <input
              type="number"
              step="0.5"
              value={alpha11}
              onChange={(e) => setAlpha11(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 text-amber-300 font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
            <div className="text-[11px] text-slate-300 pt-1">
              a({deltaT}K) = <strong className="text-white">{fmt(thermalA, 4)} Å</strong>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
            <span className="text-slate-400 font-bold block">α₂₂ (along b-axis) [10⁻⁶ K⁻¹]:</span>
            <input
              type="number"
              step="0.5"
              value={alpha22}
              onChange={(e) => setAlpha22(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 text-amber-300 font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
            <div className="text-[11px] text-slate-300 pt-1">
              b({deltaT}K) = <strong className="text-white">{fmt(thermalB, 4)} Å</strong>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
            <span className="text-slate-400 font-bold block">α₃₃ (along c-axis) [10⁻⁶ K⁻¹]:</span>
            <input
              type="number"
              step="0.5"
              value={alpha33}
              onChange={(e) => setAlpha33(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 text-amber-300 font-bold px-3 py-1.5 rounded-xl border border-slate-700 outline-none"
            />
            <div className="text-[11px] text-slate-300 pt-1">
              c({deltaT}K) = <strong className="text-white">{fmt(thermalC, 4)} Å</strong>
            </div>
          </div>
        </div>

        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex justify-between items-center font-mono text-xs">
          <span className="text-slate-300">Volumetric Thermal Expansion (α_v = α₁₁ + α₂₂ + α₃₃):</span>
          <span className="text-amber-300 font-bold text-sm">
            {(alpha11 + alpha22 + alpha33).toFixed(2)} × 10⁻⁶ K⁻¹ (ΔV/V = {thermalVolChangePct >= 0 ? '+' : ''}{thermalVolChangePct.toFixed(3)}%)
          </span>
        </div>

      </div>

    </div>
  );
};
