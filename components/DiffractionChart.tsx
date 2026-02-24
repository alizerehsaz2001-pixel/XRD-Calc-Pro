
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
}

export const DiffractionChart: React.FC<DiffractionChartProps> = ({ results }) => {
  // Transform data for the chart. 
  // We simulate intensity as 100% for all peaks since we don't have intensity data.
  const data = results.map(r => ({
    name: r.twoTheta.toFixed(2),
    intensity: 100, 
    twoTheta: r.twoTheta,
    dSpacing: r.dSpacing,
    q: r.qVector
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-700">
          <p className="font-bold mb-1">Peak at {d.twoTheta.toFixed(2)}°</p>
          <p>d-spacing: <span className="text-indigo-300">{d.dSpacing.toFixed(4)} Å</span></p>
          <p>Q-vector: <span className="text-emerald-300">{d.q.toFixed(4)} Å⁻¹</span></p>
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
