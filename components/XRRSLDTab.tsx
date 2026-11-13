import React, { useState, useMemo } from 'react';
import { SLDProfilePoint, XRRLayer } from '../utils/xrrPhysics';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Layers } from 'lucide-react';

interface XRRSLDTabProps {
  sldProfile: SLDProfilePoint[];
  layers: XRRLayer[];
}

export const XRRSLDTab: React.FC<XRRSLDTabProps> = ({ sldProfile, layers }) => {
  const [profileMode, setProfileMode] = useState<'sld' | 'electron_density' | 'optical_potential'>('sld');

  // Compute cumulative interface depth positions z_j for vertical reference markers
  const interfaceDepths = useMemo(() => {
    const depths: { z: number; label: string }[] = [{ z: 0, label: 'Surface (z=0)' }];
    let acc = 0;
    layers.forEach((l) => {
      if (l.thickness > 0) {
        acc += l.thickness;
        depths.push({ z: acc, label: `${l.name} / Next` });
      }
    });
    return depths;
  }, [layers]);

  if (sldProfile.length === 0) {
    return (
      <div id="xrr-sld-empty" className="bg-[#0B0F19] border border-slate-800 rounded-md p-8 text-center">
        <Layers className="w-10 h-10 text-slate-500 mx-auto mb-2" />
        <h4 className="text-sm font-mono font-bold text-slate-200 uppercase">No SLD Depth Profile Generated</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Add at least one layer to visualize the real-space scattering length density and electron density profile.
        </p>
      </div>
    );
  }

  const yDataKey =
    profileMode === 'sld'
      ? 'sldReal'
      : profileMode === 'electron_density'
      ? 'electronDensity'
      : 'opticalPotential';
  const yLabel =
    profileMode === 'sld'
      ? 'SLD Re(ρ) (10⁻⁶ Å⁻²)'
      : profileMode === 'electron_density'
      ? 'Electron Density ρ_e (e⁻ / Å³)'
      : 'Optical Potential V(z) (eV)';

  return (
    <div id="xrr-sld-container" className="space-y-4">
      {/* Top Banner */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Real-Space Depth Profile &amp; Erf Interfacial Roughness Transitions</span>
          </h4>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Continuous depth profile z (Å) reconstructed with Gaussian error-function (erf) interfacial interdiffusion widths σ_j.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-[#070A12] p-1 rounded border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setProfileMode('sld')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              profileMode === 'sld'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SLD ρ(z)
          </button>
          <button
            type="button"
            onClick={() => setProfileMode('electron_density')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              profileMode === 'electron_density'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Electron ρ_e(z)
          </button>
          <button
            type="button"
            onClick={() => setProfileMode('optical_potential')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              profileMode === 'optical_potential'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Potential V(z)
          </button>
        </div>
      </div>

      {/* Profile Chart */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-4">
        <div className="h-72 w-full bg-[#070A12] p-2 rounded border border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sldProfile} margin={{ top: 12, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="sldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="z"
                stroke="#94a3b8"
                tick={{ fontSize: 11, fontFamily: 'monospace' }}
                label={{ value: 'Depth from Top Surface z (Å)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11, fontFamily: 'monospace' }}
                label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070A12',
                  borderColor: '#334155',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
                formatter={(val: any) => [typeof val === 'number' ? val.toFixed(4) : val, yLabel]}
                labelFormatter={(label) => `Depth z = ${label} Å (${(Number(label) / 10).toFixed(2)} nm)`}
              />
              {interfaceDepths.map((d, i) => (
                <ReferenceLine
                  key={i}
                  x={d.z}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: `z=${d.z}Å`, fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }}
                />
              ))}
              <Area type="monotone" dataKey={yDataKey} stroke="#06b6d4" strokeWidth={2.2} fillOpacity={1} fill="url(#sldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Layer Stack Porosity & Optical Density Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono tabular-nums">
        {layers.map((layer, idx) => {
          const isSub = layer.thickness === 0;
          return (
            <div key={layer.id} className="bg-[#0B0F19] border border-slate-800 rounded-md p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-xs font-bold text-cyan-300">
                  {isSub ? 'SUB' : `L${idx + 1}`} • {layer.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#070A12] border border-slate-800 text-slate-300">
                  {isSub ? 'Substrate (∞)' : `${layer.thickness} Å`}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Formula:</span>
                  <span>{layer.formula || layer.material || layer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mass Density ρ:</span>
                  <span className="text-emerald-400 font-bold">{layer.density.toFixed(2)} g/cm³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roughness σ:</span>
                  <span className="text-amber-300">{layer.roughness.toFixed(1)} Å</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dispersion δ:</span>
                  <span>{layer.delta.toFixed(2)} × 10⁻⁶</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
