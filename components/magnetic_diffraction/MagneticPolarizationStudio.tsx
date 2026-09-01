import React, { useState } from 'react';
import { MagneticReflection, PolarizationConfig } from '../../utils/magneticDiffractionPhysics';
import { Radio, Sliders, Shield, Zap, RefreshCw, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface MagneticPolarizationStudioProps {
  reflections: MagneticReflection[];
  polarizationConfig: PolarizationConfig;
  onPolarizationChange: (config: PolarizationConfig) => void;
  wavelength: number;
}

export const MagneticPolarizationStudio: React.FC<MagneticPolarizationStudioProps> = ({
  reflections,
  polarizationConfig,
  onPolarizationChange,
  wavelength
}) => {
  const [activeChannel, setActiveChannel] = useState<'total' | 'spin_flip' | 'polarized_up_down' | 'flipping_ratio' | 'chiral_asymmetry'>('polarized_up_down');

  // Guide field angles in spherical coordinates (deg)
  const [thetaGuide, setThetaGuide] = useState<number>(0);
  const [phiGuide, setPhiGuide] = useState<number>(0);

  const handleAngleUpdate = (newTheta: number, newPhi: number) => {
    setThetaGuide(newTheta);
    setPhiGuide(newPhi);
    const radTheta = (newTheta * Math.PI) / 180;
    const radPhi = (newPhi * Math.PI) / 180;

    const gx = Math.sin(radTheta) * Math.cos(radPhi);
    const gy = Math.sin(radTheta) * Math.sin(radPhi);
    const gz = Math.cos(radTheta);

    onPolarizationChange({
      ...polarizationConfig,
      guideFieldDirection: { x: gx, y: gy, z: gz }
    });
  };

  // Prepare chart dataset
  const chartData = reflections.map(r => ({
    twoTheta: Number(r.twoTheta.toFixed(2)),
    dSpacing: Number(r.dSpacing.toFixed(3)),
    label: r.label,
    total: Number(r.totalIntensity.toFixed(2)),
    nuclear: Number(r.nuclearIntensity.toFixed(2)),
    magnetic: Number(r.magneticIntensity.toFixed(2)),
    iUp: Number((r.polarizedUpIntensity || 0).toFixed(2)),
    iDown: Number((r.polarizedDownIntensity || 0).toFixed(2)),
    flippingRatio: Number((r.flippingRatio || 1).toFixed(2)),
    iSF: Number((r.spinFlipIntensity || 0).toFixed(2)),
    iNSF: Number((r.nonSpinFlipIntensity || 0).toFixed(2)),
    asymmetry: Number(((r.chiralAsymmetry || 0) * 100).toFixed(1))
  }));

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/20 p-5 shadow-2xl relative overflow-hidden text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
            <Radio className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Polarized Neutron Scattering &amp; XYZ Polarimetry Studio
            </h3>
            <p className="text-[10px] text-slate-400">
              Moon-Riste-Koehler spin-flip/non-spin-flip cross sections &amp; flipping ratio
            </p>
          </div>
        </div>

        {/* Channel switchers */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveChannel('polarized_up_down')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              activeChannel === 'polarized_up_down'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            I⁺(P↑) / I⁻(P↓)
          </button>
          <button
            onClick={() => setActiveChannel('spin_flip')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              activeChannel === 'spin_flip'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            SF (I_sf) / NSF (I_nsf)
          </button>
          <button
            onClick={() => setActiveChannel('flipping_ratio')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              activeChannel === 'flipping_ratio'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Flipping Ratio R(2θ)
          </button>
          <button
            onClick={() => setActiveChannel('chiral_asymmetry')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              activeChannel === 'chiral_asymmetry'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chiral Asymmetry %
          </button>
        </div>
      </div>

      {/* Guide Field & Beamline Efficiency Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs">
        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>Guide Field Polar Angle (θ_P)</span>
            <span className="text-cyan-400 font-bold">{thetaGuide}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={180}
            step={5}
            value={thetaGuide}
            onChange={e => handleAngleUpdate(Number(e.target.value), phiGuide)}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>Guide Field Azimuth Angle (φ_P)</span>
            <span className="text-cyan-400 font-bold">{phiGuide}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            step={10}
            value={phiGuide}
            onChange={e => handleAngleUpdate(thetaGuide, Number(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>Polarizer Efficiency (P_0)</span>
            <span className="text-indigo-400 font-bold">{(polarizationConfig.polarizationEfficiency * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0.80}
            max={1.00}
            step={0.01}
            value={polarizationConfig.polarizationEfficiency}
            onChange={e => onPolarizationChange({ ...polarizationConfig, polarizationEfficiency: Number(e.target.value) })}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Recharts Polarized Spectrum */}
      <div className="bg-[#060a14] rounded-2xl border border-slate-800 p-3 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
            <XAxis
              dataKey="twoTheta"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={val => `${val}°`}
              label={{ value: '2θ (degrees)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }}
            />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
              labelFormatter={label => `2θ = ${label}°`}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />

            {activeChannel === 'polarized_up_down' && (
              <>
                <Bar dataKey="iUp" name="I⁺ (Spin-Up Intensity)" fill="#06b6d4" barSize={10} />
                <Bar dataKey="iDown" name="I⁻ (Spin-Down Intensity)" fill="#f43f5e" barSize={10} />
              </>
            )}

            {activeChannel === 'spin_flip' && (
              <>
                <Bar dataKey="iNSF" name="Non-Spin-Flip (I_NSF)" fill="#3b82f6" barSize={10} />
                <Bar dataKey="iSF" name="Spin-Flip (I_SF)" fill="#ec4899" barSize={10} />
              </>
            )}

            {activeChannel === 'flipping_ratio' && (
              <Line type="monotone" dataKey="flippingRatio" name="Flipping Ratio R = I⁺/I⁻" stroke="#eab308" strokeWidth={2.5} dot={{ r: 4, fill: '#eab308' }} />
            )}

            {activeChannel === 'chiral_asymmetry' && (
              <Line type="monotone" dataKey="asymmetry" name="Chiral Asymmetry (%)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
