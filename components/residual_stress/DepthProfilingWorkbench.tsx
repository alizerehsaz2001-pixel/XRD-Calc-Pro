import React, { useState, useMemo } from 'react';
import {
  computeMooreEvansCorrection,
  calculatePenetrationDepthUm,
  GoniometerGeometry
} from '../../utils/residualStressPhysics';
import {
  Layers,
  ShieldCheck,
  Plus,
  Trash2,
  Download,
  Info,
  Sparkles,
  Zap,
  TrendingDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  Area
} from 'recharts';

interface DepthProfilingWorkbenchProps {
  twoTheta0: number;
  wavelength: number;
  linearMuCm: number;
  isDarkMode: boolean;
}

interface RawDepthRow {
  id: string;
  depthUm: number;
  measuredStressMPa: number;
}

const PRESET_PROFILES: { name: string; description: string; thicknessMm: number; data: { depthUm: number; stress: number }[] }[] = [
  {
    name: 'Shot-Peened Spring Steel (50CrV4)',
    description: 'Deep surface compressive residual stress layer (-750 MPa peak) extending to 200 µm with balanced core tension.',
    thicknessMm: 6.0,
    data: [
      { depthUm: 0, stress: -520 },
      { depthUm: 20, stress: -740 },
      { depthUm: 50, stress: -780 },
      { depthUm: 90, stress: -620 },
      { depthUm: 140, stress: -380 },
      { depthUm: 200, stress: -110 },
      { depthUm: 280, stress: 45 },
      { depthUm: 400, stress: 75 },
    ]
  },
  {
    name: 'Precision Ground Bearing Race (100Cr6 / 52100)',
    description: 'Severe surface grinding burn creating tensile surface peak with sharp compressive sub-layer.',
    thicknessMm: 8.0,
    data: [
      { depthUm: 0, stress: 280 },
      { depthUm: 10, stress: -450 },
      { depthUm: 25, stress: -610 },
      { depthUm: 50, stress: -480 },
      { depthUm: 100, stress: -190 },
      { depthUm: 180, stress: -30 },
      { depthUm: 300, stress: 15 },
    ]
  },
  {
    name: 'Laser Cladded Inconel 718 on Steel',
    description: 'Thermal tensile contraction in clad zone transitioning to substrate compressive balance.',
    thicknessMm: 12.0,
    data: [
      { depthUm: 0, stress: 420 },
      { depthUm: 30, stress: 360 },
      { depthUm: 80, stress: 210 },
      { depthUm: 150, stress: 90 },
      { depthUm: 250, stress: -140 },
      { depthUm: 400, stress: -180 },
      { depthUm: 600, stress: -60 },
    ]
  }
];

export const DepthProfilingWorkbench: React.FC<DepthProfilingWorkbenchProps> = ({
  twoTheta0,
  linearMuCm,
  isDarkMode
}) => {
  const [plateThicknessMm, setPlateThicknessMm] = useState<number>(6.0);
  const [geometry, setGeometry] = useState<GoniometerGeometry>('side_inclination');
  const [depthRows, setDepthRows] = useState<RawDepthRow[]>([
    { id: 'd1', depthUm: 0, measuredStressMPa: -520 },
    { id: 'd2', depthUm: 20, measuredStressMPa: -740 },
    { id: 'd3', depthUm: 50, measuredStressMPa: -780 },
    { id: 'd4', depthUm: 90, measuredStressMPa: -620 },
    { id: 'd5', depthUm: 140, measuredStressMPa: -380 },
    { id: 'd6', depthUm: 200, measuredStressMPa: -110 },
    { id: 'd7', depthUm: 280, measuredStressMPa: 45 },
    { id: 'd8', depthUm: 400, measuredStressMPa: 75 },
  ]);

  // Moore-Evans correction computation
  const correctedLayers = useMemo(() => {
    const raw = depthRows.map(r => ({ depthUm: r.depthUm, measuredStressMPa: r.measuredStressMPa }));
    return computeMooreEvansCorrection(raw, plateThicknessMm);
  }, [depthRows, plateThicknessMm]);

  // Penetration depth curve vs psi
  const penetrationData = useMemo(() => {
    const angles = [0, 10, 20, 30, 40, 50, 60, 70];
    return angles.map(psi => {
      const depthUm = calculatePenetrationDepthUm(twoTheta0, psi, linearMuCm, geometry);
      return {
        psi: `${psi}°`,
        psiDeg: psi,
        depthUm: parseFloat(depthUm.toFixed(2)),
        sin2psi: parseFloat(Math.pow(Math.sin((psi * Math.PI) / 180), 2).toFixed(3))
      };
    });
  }, [twoTheta0, linearMuCm, geometry]);

  const loadPresetProfile = (preset: typeof PRESET_PROFILES[0]) => {
    setPlateThicknessMm(preset.thicknessMm);
    setDepthRows(preset.data.map((d, idx) => ({
      id: `p_${idx}_${Date.now()}`,
      depthUm: d.depthUm,
      measuredStressMPa: d.stress
    })));
  };

  const addRow = () => {
    const last = depthRows[depthRows.length - 1];
    const newDepth = last ? last.depthUm + 50 : 0;
    setDepthRows([...depthRows, { id: 'd_' + Date.now(), depthUm: newDepth, measuredStressMPa: 0 }]);
  };

  const removeRow = (id: string) => {
    setDepthRows(depthRows.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: 'depthUm' | 'measuredStressMPa', value: number) => {
    setDepthRows(depthRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Peak compressive stress & crossing depth
  const stats = useMemo(() => {
    if (correctedLayers.length === 0) return null;
    let minStress = Infinity;
    let minDepth = 0;
    let maxStress = -Infinity;
    let crossoverDepth = 0;

    correctedLayers.forEach((l, idx) => {
      if (l.correctedStressMPa < minStress) {
        minStress = l.correctedStressMPa;
        minDepth = l.depthUm;
      }
      if (l.correctedStressMPa > maxStress) {
        maxStress = l.correctedStressMPa;
      }
      if (idx > 0 && ((correctedLayers[idx - 1].correctedStressMPa < 0 && l.correctedStressMPa > 0) || (correctedLayers[idx - 1].correctedStressMPa > 0 && l.correctedStressMPa < 0))) {
        // Interpolate zero crossing
        const s1 = correctedLayers[idx - 1].correctedStressMPa;
        const s2 = l.correctedStressMPa;
        const d1 = correctedLayers[idx - 1].depthUm;
        const d2 = l.depthUm;
        crossoverDepth = d1 + (-s1 / (s2 - s1)) * (d2 - d1);
      }
    });

    return {
      peakCompressiveMPa: minStress < 0 ? minStress : 0,
      peakCompressiveDepthUm: minDepth,
      peakTensileMPa: maxStress > 0 ? maxStress : 0,
      crossoverDepthUm: crossoverDepth
    };
  }, [correctedLayers]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Preset Selector */}
      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            Moore-Evans Subsurface Stress Profiling & Layer Removal
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Correct for elastic stress relaxation caused by electropolishing layer removal (SAE HS-784 / ASTM Standard) with plate moment rebalancing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESET_PROFILES.map(p => (
            <button
              key={p.name}
              onClick={() => loadPresetProfile(p)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Data Table & Specimen Parameters (5 cols) */}
        <div className="xl:col-span-5 space-y-5">
          {/* Specimen Configuration */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Specimen Geometry & Thickness
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Initial Plate Thickness (mm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={plateThicknessMm}
                  onChange={e => setPlateThicknessMm(Math.max(0.5, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Goniometer Tilt Mode
                </label>
                <select
                  value={geometry}
                  onChange={e => setGeometry(e.target.value as GoniometerGeometry)}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="side_inclination">Side-Inclination (Ψ-tilt)</option>
                  <option value="iso_inclination">Iso-Inclination (Ω-tilt)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Depth Profiling Table */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[380px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Layer Removal Points ({depthRows.length})
              </h4>
              <button
                onClick={addRow}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Depth
              </button>
            </div>

            <div className="flex-1 overflow-auto pr-1 custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95 z-10 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-1 text-[10px] text-slate-400">Depth (µm)</th>
                    <th className="py-2 px-1 text-[10px] text-slate-400">Measured (MPa)</th>
                    <th className="py-2 px-1 text-[10px] text-slate-400 text-indigo-600 dark:text-indigo-400">Corrected</th>
                    <th className="py-2 px-1 text-center w-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {depthRows.map((r, idx) => {
                    const corr = correctedLayers[idx];
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            value={r.depthUm}
                            onChange={e => updateRow(r.id, 'depthUm', Number(e.target.value))}
                            className="w-20 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            value={r.measuredStressMPa}
                            onChange={e => updateRow(r.id, 'measuredStressMPa', Number(e.target.value))}
                            className="w-24 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                          />
                        </td>
                        <td className="py-1 px-1 font-bold text-indigo-600 dark:text-indigo-400">
                          {corr ? corr.correctedStressMPa.toFixed(1) : '---'}
                        </td>
                        <td className="py-1 px-1 text-center">
                          <button
                            onClick={() => removeRow(r.id)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Depth Charts (7 cols) */}
        <div className="xl:col-span-7 space-y-5">
          {/* Depth Profile Metric Summary */}
          {stats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Peak Compression</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
                  {stats.peakCompressiveMPa.toFixed(1)} MPa
                </span>
                <span className="text-[10px] text-slate-500 block">at z = {stats.peakCompressiveDepthUm} µm</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Core Tension Peak</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                  +{stats.peakTensileMPa.toFixed(1)} MPa
                </span>
                <span className="text-[10px] text-slate-500 block">bulk equilibrium</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Zero Crossover Depth</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {stats.crossoverDepthUm.toFixed(0)} µm
                </span>
                <span className="text-[10px] text-slate-500 block">compressive layer depth</span>
              </div>
            </div>
          )}

          {/* Main Residual Stress vs Depth Profile Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-indigo-500" />
                Residual Stress Depth Distribution σ(z)
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                Moore-Evans Plate Correction
              </span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={correctedLayers} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                  <XAxis
                    dataKey="depthUm"
                    type="number"
                    tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                    label={{ value: 'Subsurface Depth z (µm)', position: 'bottom', offset: 0, fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}
                  />
                  <YAxis
                    dataKey="correctedStressMPa"
                    tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                    label={{ value: 'Residual Stress (MPa)', angle: -90, position: 'insideLeft', fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#090d16' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                    formatter={(val: any, name: string) => [
                      `${Number(val).toFixed(1)} MPa`,
                      name === 'measuredStressMPa' ? 'Raw Measured' : 'Moore-Evans Corrected'
                    ]}
                    labelFormatter={l => `Depth z = ${l} µm`}
                  />
                  <ReferenceLine y={0} stroke={isDarkMode ? '#64748b' : '#94a3b8'} strokeDasharray="4 4" />
                  
                  {/* Raw measured points */}
                  <Line
                    type="monotone"
                    dataKey="measuredStressMPa"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={{ r: 3.5, fill: '#94a3b8' }}
                    name="measuredStressMPa"
                  />

                  {/* Moore-Evans corrected curve */}
                  <Line
                    type="monotone"
                    dataKey="correctedStressMPa"
                    stroke={isDarkMode ? '#818cf8' : '#4f46e5'}
                    strokeWidth={3}
                    dot={{ r: 5, fill: isDarkMode ? '#818cf8' : '#4f46e5' }}
                    name="correctedStressMPa"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4 text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 border-t-2 border-dashed border-slate-400" />
                  Raw Measured
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 border-t-2 border-indigo-600" />
                  Moore-Evans Corrected True Stress
                </span>
              </div>
            </div>
          </div>

          {/* X-Ray Penetration Depth vs Tilt Angle Info Box */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-sans">
                X-Ray Information Penetration Depth (1/e)
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                At ψ = 0°: <strong className="text-slate-800 dark:text-slate-200 font-mono">{penetrationData[0]?.depthUm} µm</strong> → At ψ = 60°: <strong className="text-slate-800 dark:text-slate-200 font-mono">{penetrationData[6]?.depthUm} µm</strong>
              </span>
            </div>
            <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1 rounded-lg">
              µ = {linearMuCm} cm⁻¹
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
