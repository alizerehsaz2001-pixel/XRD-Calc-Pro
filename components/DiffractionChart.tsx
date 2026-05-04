
import React, { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Scatter
} from 'recharts';
import { Activity, Terminal } from 'lucide-react';
import { BraggResult } from '../types';

interface DiffractionChartProps {
  results: BraggResult[];
  materialName?: string | null;
}

export const DiffractionChart: React.FC<DiffractionChartProps> = ({ results, materialName }) => {
  const chartData = useMemo(() => {
    if (results.length === 0) return { points: [], peakData: [] };

    const minTheta = Math.max(0, Math.min(...results.map(r => r.twoTheta)) - 10);
    const maxTheta = Math.max(...results.map(r => r.twoTheta)) + 10;
    
    const points = [];
    for (let x = minTheta; x <= maxTheta; x += 0.1) {
      let intensity = 5; // Background noise floor
      results.forEach(r => {
        // Gaussian peak simulation
        const sigma = 0.4;
        const peakInt = 95 * Math.exp(-Math.pow(x - r.twoTheta, 2) / (2 * Math.pow(sigma, 2)));
        intensity += peakInt;
      });
      // Add random noise
      intensity += Math.random() * 2;
      points.push({
        twoTheta: x,
        intensity: intensity,
        isPeak: false
      });
    }

    // Add peak markers for tooltips
    const peakData = results.map(r => ({
      twoTheta: r.twoTheta,
      intensity: 100,
      isPeak: true,
      hkl: r.hkl,
      dSpacing: r.dSpacing,
      q: r.qVector
    }));

    return { points, peakData };
  }, [results]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload.find((p: any) => p.payload.isPeak)?.payload || payload[0].payload;
      
      return (
        <div className="bg-slate-950/95 backdrop-blur-xl text-white p-5 rounded-2xl shadow-2xl border border-slate-800 min-w-[220px] shadow-black/80">
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Spectral Analysis</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Bragg Angularity</p>
              <p className="text-xl font-black text-white font-mono tracking-tighter">2θ: {d.twoTheta.toFixed(3)}°</p>
            </div>

            {d.isPeak && (
              <>
                {d.hkl && (
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Index</span>
                    <span className="text-xs font-black text-indigo-400 font-mono tracking-widest">({d.hkl})</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                     <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">d-spacing</p>
                     <p className="text-[11px] font-bold text-emerald-400 font-mono">{d.dSpacing?.toFixed(4)} Å</p>
                   </div>
                   <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                     <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Q-vector</p>
                     <p className="text-[11px] font-bold text-sky-400 font-mono">{d.q?.toFixed(4)}</p>
                   </div>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[400px] w-full flex flex-col relative overflow-hidden group/chart">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover/chart:bg-indigo-500/10 transition-all duration-1000" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Spectral Visualizer</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Calculated Diffraction Profile</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-2xl border border-slate-800/50">
           <Terminal className="w-3 h-3 text-slate-600" />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Pattern Synthesis Active</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 10, right: 20, bottom: 20, left: -20 }}>
            <defs>
               <linearGradient id="profileGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
               </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis 
              dataKey="twoTheta" 
              type="number"
              domain={['dataMin - 5', 'dataMax + 5']} 
              tick={{ fontSize: 10, fontWeight: 'black', fill: '#475569', fontFamily: 'monospace' }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              label={{ value: '2θ (Degrees)', position: 'bottom', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
            />
            <YAxis hide domain={[0, 120]} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '5 5' }} />
            
            {/* Background Pattern Area */}
            <Area 
              data={chartData.points}
              type="monotone"
              dataKey="intensity"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#profileGradient)"
              isAnimationActive={true}
              animationDuration={2000}
            />

            {/* Peak Markers Scatter */}
            <Scatter 
              data={chartData.peakData} 
              fill="#10b981"
              shape={(props: any) => {
                const { cx, cy } = props;
                if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;
                return (
                  <g>
                    <line x1={cx} y1={cy} x2={cx} y2={cy + 300} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" opacity={0.4} />
                    <circle cx={cx} cy={cy} r={4} fill="#10b981" stroke="#fff" strokeWidth={1} />
                  </g>
                )
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {materialName && (
        <div className="absolute top-8 right-64 px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full z-20">
           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{materialName} Simulation</span>
        </div>
      )}
    </div>
  );
};
