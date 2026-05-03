
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Activity, Database, Info, Terminal } from 'lucide-react';
import { BraggResult } from '../types';

interface DiffractionChartProps {
  results: BraggResult[];
  materialName?: string | null;
}

export const DiffractionChart: React.FC<DiffractionChartProps> = ({ results, materialName }) => {
  const data = results.map(r => ({
    name: r.twoTheta.toFixed(2),
    intensity: 100, 
    twoTheta: r.twoTheta,
    dSpacing: r.dSpacing,
    q: r.qVector,
    hkl: r.hkl
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const thetaRad = (d.twoTheta / 2) * Math.PI / 180;
      const estSizeNm = 0.15406 * 0.9 / ((0.1 * Math.PI / 180) * Math.cos(thetaRad));

      return (
        <div className="bg-slate-950/90 backdrop-blur-xl text-white p-5 rounded-2xl shadow-2xl border border-slate-800 min-w-[220px] shadow-black/80">
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Spectral Analysis</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Bragg Angularity</p>
              <p className="text-xl font-black text-white font-mono tracking-tighter">2θ: {d.twoTheta.toFixed(2)}°</p>
            </div>

            {materialName && d.hkl && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reflection Index</span>
                <span className="text-xs font-black text-indigo-400 font-mono tracking-widest">({d.hkl})</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
               <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                 <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">d-spacing</p>
                 <p className="text-[11px] font-bold text-emerald-400 font-mono">{d.dSpacing.toFixed(4)} Å</p>
               </div>
               <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                 <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Q-vector</p>
                 <p className="text-[11px] font-bold text-sky-400 font-mono">{d.q.toFixed(4)}</p>
               </div>
            </div>

            <div className="pt-2">
               <div className="flex items-center gap-2 mb-1">
                  <Info className="w-3 h-3 text-amber-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Est. Grain Size</span>
               </div>
               <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md">
                 <span className="text-amber-400 font-black font-mono text-xs">~{estSizeNm.toFixed(1)} nm</span>
               </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-80 w-full flex flex-col relative overflow-hidden group/chart">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover/chart:bg-emerald-500/10 transition-all duration-1000" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Spectral Indices</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Predicted Diffraction Vectors</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-2xl border border-slate-800/50">
           <Terminal className="w-3 h-3 text-slate-600" />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Simulation Engine v2.0</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: -20 }}>
            <defs>
               <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
               </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis 
              dataKey="twoTheta" 
              type="number"
              domain={[0, 'dataMax + 10']} 
              tick={{ fontSize: 10, fontWeight: 'black', fill: '#475569', fontFamily: 'monospace' }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
            <Bar dataKey="intensity" isAnimationActive={true} animationDuration={1500}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill="url(#barGradient)" 
                  className="hover:filter hover:brightness-125 transition-all cursor-pointer"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(16, 185, 129, 0.4))' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Material Label Overlay */}
      {materialName && (
        <div className="absolute top-8 right-64 px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full z-20">
           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{materialName} Reference Matrix</span>
        </div>
      )}
    </div>
  );
};
