
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
import { BraggResult } from '../types';

interface DiffractionChartProps {
  results: BraggResult[];
  materialName?: string | null;
}

export const DiffractionChart: React.FC<DiffractionChartProps> = ({ results, materialName }) => {
  // Transform data for the chart. 
  // We simulate intensity as 100% for all peaks since we don't have intensity data.
  const data = results.map(r => ({
    name: r.twoTheta.toFixed(2),
    intensity: 100, 
    twoTheta: r.twoTheta,
    dSpacing: r.dSpacing,
    q: r.qVector,
    hkl: r.hkl
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      // Theoretical Scherrer size calculation for FWHM = 0.1 deg
      // D = K * lambda / (beta * cos(theta))
      // beta = 0.1 * pi / 180
      // lambda = 2 * d * sin(theta)
      // D = 0.9 * lambda / (0.001745 * cos(theta))
      // Simplified: D (nm) approx 8.9 / cos(theta) for Cu Ka
      // Let's just use a generic placeholder calculation for educational value
      const thetaRad = (d.twoTheta / 2) * Math.PI / 180;
      const estSizeNm = 0.15406 * 0.9 / ((0.1 * Math.PI / 180) * Math.cos(thetaRad));

      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-700 min-w-[180px]">
          {materialName && (
            <div className="mb-2 pb-2 border-b border-slate-600">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Phase</span>
              <p className="font-bold text-indigo-300">{materialName}</p>
            </div>
          )}
          <p className="font-bold mb-1 text-sm">Peak at {d.twoTheta.toFixed(2)}°</p>
          {d.hkl && <p className="text-slate-300 mb-1">Reflection: <span className="font-mono font-bold">({d.hkl})</span></p>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
             <span className="text-slate-400">d-spacing:</span>
             <span className="text-indigo-300 font-mono text-right">{d.dSpacing.toFixed(4)} Å</span>
             
             <span className="text-slate-400">Q-vector:</span>
             <span className="text-emerald-300 font-mono text-right">{d.q.toFixed(4)} Å⁻¹</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700">
             <span className="text-[10px] text-slate-500 block mb-0.5">Theoretical Size (if FWHM=0.1°)</span>
             <span className="text-orange-300 font-mono">~{estSizeNm.toFixed(1)} nm</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-64 md:h-80 w-full flex flex-col transition-colors">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4 ml-2">Simulated Diffraction Pattern</h3>
      <div className="flex-1 w-full min-h-0 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
            <XAxis 
              dataKey="twoTheta" 
              type="number"
              domain={[0, 'dataMax + 10']} 
              label={{ value: '2θ (degrees)', position: 'bottom', offset: 0, fontSize: 12, fill: '#64748b' }}
              tick={{ fontSize: 10, fill: '#64748b' }}
              allowDataOverflow={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
            <Bar dataKey="intensity" barSize={2} isAnimationActive={true}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="var(--chart-bar)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
