import React, { useState } from 'react';
import { SLDProfilePoint, XRRLayer } from '../utils/xrrPhysics';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Layers, Activity, Eye, Info, ShieldCheck, Gauge } from 'lucide-react';

interface XRRSLDTabProps {
  sldProfile: SLDProfilePoint[];
  layers: XRRLayer[];
}

export const XRRSLDTab: React.FC<XRRSLDTabProps> = ({ sldProfile, layers }) => {
  const [profileMode, setProfileMode] = useState<'sld' | 'electron_density' | 'optical_potential'>('sld');

  if (sldProfile.length === 0) {
    return (
      <div id="xrr-sld-empty" className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
        <Layers className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-200">No SLD Depth Profile Generated</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Add at least one layer to visualize the real-space scattering length density and electron density profile.
        </p>
      </div>
    );
  }

  const yDataKey = profileMode === 'sld' ? 'sldReal' : profileMode === 'electron_density' ? 'electronDensity' : 'opticalPotential';
  const yLabel = profileMode === 'sld' ? 'SLD Re(ρ) (10⁻⁶ Å⁻²)' : profileMode === 'electron_density' ? 'Electron Density (e⁻ / Å³)' : 'Potential V(z) (eV)';

  return (
    <div id="xrr-sld-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Real-Space Depth Profile & Optical Interface Transitions
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Displays scattering length density along sample depth z with error-function (erf) interfacial roughness interdiffusion.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setProfileMode('sld')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              profileMode === 'sld' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SLD ρ(z)
          </button>
          <button
            onClick={() => setProfileMode('electron_density')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              profileMode === 'electron_density' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Electron Density
          </button>
          <button
            onClick={() => setProfileMode('optical_potential')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              profileMode === 'optical_potential' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Potential V(z)
          </button>
        </div>
      </div>

      {/* Profile Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sldProfile} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="sldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="z"
                stroke="#94a3b8"
                label={{ value: 'Sample Depth z (Å)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                stroke="#94a3b8"
                label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [val, yLabel]}
                labelFormatter={(label) => `Depth z = ${label} Å (${(Number(label) / 10).toFixed(2)} nm)`}
              />
              <Area type="monotone" dataKey={yDataKey} stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#sldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Layer Stack Porosity & Density Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {layers.map((layer, idx) => {
          // Estimate theoretical density if known
          const isSub = layer.thickness === 0;
          return (
            <div key={layer.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-300">{layer.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {isSub ? 'Substrate' : `${layer.thickness} Å`}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Material:</span>
                  <span>{layer.formula || layer.material || layer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Density:</span>
                  <span className="text-emerald-400">{layer.density} g/cm³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Roughness σ:</span>
                  <span>{layer.roughness} Å</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dispersion δ:</span>
                  <span>{layer.delta} × 10⁻⁶</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
