import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from 'recharts';
import { Layers, HelpCircle, ArrowRightLeft, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ScherrerResult } from '../../types';

interface ScherrerModelComparisonProps {
  results: ScherrerResult[];
  activeModel: string;
}

export const ScherrerModelComparison: React.FC<ScherrerModelComparisonProps> = ({
  results,
  activeModel
}) => {
  const validResults = useMemo(() => results.filter(r => !r.error && r.sizeNm > 0), [results]);

  const summary = useMemo(() => {
    if (validResults.length === 0) return null;

    const models = ['gaussian', 'lorentzian', 'pseudoVoigt', 'deKeijser', 'halderWagner'] as const;
    const modelLabels: Record<typeof models[number], string> = {
      gaussian: 'Gaussian (Squared)',
      lorentzian: 'Lorentzian (Linear)',
      pseudoVoigt: 'Pseudo-Voigt (Mixed)',
      deKeijser: 'de Keijser (Voigt DL)',
      halderWagner: 'Halder-Wagner (Voigt)'
    };

    const averages: Record<typeof models[number], number> = {
      gaussian: 0,
      lorentzian: 0,
      pseudoVoigt: 0,
      deKeijser: 0,
      halderWagner: 0
    };

    const stdDevs: Record<typeof models[number], number> = {
      gaussian: 0,
      lorentzian: 0,
      pseudoVoigt: 0,
      deKeijser: 0,
      halderWagner: 0
    };

    models.forEach(m => {
      const vals = validResults.map(r => r.modelComparison ? r.modelComparison[m] : r.sizeNm);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      averages[m] = avg;

      const variance = vals.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / vals.length;
      stdDevs[m] = Math.sqrt(variance);
    });

    const chartData = [
      {
        name: 'Gaussian',
        fullName: 'Gaussian (Quadratic)',
        sizeNm: parseFloat(averages.gaussian.toFixed(2)),
        stdDev: parseFloat(stdDevs.gaussian.toFixed(2)),
        fill: '#6366f1',
        isCurrent: activeModel === 'Gaussian'
      },
      {
        name: 'Lorentzian',
        fullName: 'Lorentzian (Linear)',
        sizeNm: parseFloat(averages.lorentzian.toFixed(2)),
        stdDev: parseFloat(stdDevs.lorentzian.toFixed(2)),
        fill: '#ec4899',
        isCurrent: activeModel === 'Lorentzian'
      },
      {
        name: 'Pseudo-Voigt',
        fullName: 'Pseudo-Voigt Decoupling',
        sizeNm: parseFloat(averages.pseudoVoigt.toFixed(2)),
        stdDev: parseFloat(stdDevs.pseudoVoigt.toFixed(2)),
        fill: '#8b5cf6',
        isCurrent: activeModel === 'Pseudo-Voigt'
      },
      {
        name: 'de Keijser',
        fullName: 'de Keijser Voigt (DL)',
        sizeNm: parseFloat(averages.deKeijser.toFixed(2)),
        stdDev: parseFloat(stdDevs.deKeijser.toFixed(2)),
        fill: '#10b981',
        isCurrent: activeModel === 'de Keijser'
      },
      {
        name: 'Halder-Wagner',
        fullName: 'Halder-Wagner Parabolic',
        sizeNm: parseFloat(averages.halderWagner.toFixed(2)),
        stdDev: parseFloat(stdDevs.halderWagner.toFixed(2)),
        fill: '#f59e0b',
        isCurrent: activeModel === 'Halder-Wagner'
      }
    ];

    const minSize = Math.min(...chartData.map(d => d.sizeNm));
    const maxSize = Math.max(...chartData.map(d => d.sizeNm));
    const deltaSize = maxSize - minSize;
    const percentSpread = ((deltaSize / Math.max(0.1, minSize)) * 100);

    return {
      chartData,
      averages,
      stdDevs,
      minSize,
      maxSize,
      deltaSize,
      percentSpread
    };
  }, [validResults, activeModel]);

  if (!summary || validResults.length === 0) {
    return (
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
        No valid reflection peaks available for model comparison. Please enter valid peaks with observed widths exceeding instrumental broadening.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with spread metrics */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Multi-Model Line Broadening Sensitivity Matrix</h4>
            <p className="text-[10px] text-slate-400">Systematic comparison across 5 classical and modern Voigt convolution models</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800/60 text-right">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Model Variance Spread (ΔD)</span>
            <span className="text-xs font-mono font-bold text-indigo-300">
              {summary.deltaSize.toFixed(2)} nm ({summary.percentSpread.toFixed(1)}%)
            </span>
          </div>
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800/60 text-right">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Active Selected Model</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
              <CheckCircle2 className="w-3 h-3 inline" /> {activeModel}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Average Domain Size by Model</span>
            <span className="text-[9px] text-slate-500">Error bars reflect standard deviation across peaks</span>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.chartData} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tick={{ fontSize: 9 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }}
                  unit=" nm"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  formatter={(val: any) => [`${parseFloat(val).toFixed(2)} nm`, 'Mean Size']}
                  labelFormatter={(label) => `Model: ${label}`}
                />
                <Bar dataKey="sizeNm" radius={[6, 6, 0, 0]}>
                  {summary.chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill} 
                      stroke={entry.isCurrent ? '#ffffff' : 'none'}
                      strokeWidth={entry.isCurrent ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Breakdown Cards */}
        <div className="lg:col-span-5 space-y-2">
          {summary.chartData.map((model, index) => (
            <motion.div 
              key={model.name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-2.5 rounded-xl border transition-all ${
                model.isCurrent 
                  ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm' 
                  : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: model.fill }} />
                  <span className="font-bold text-white text-[11px]">{model.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-200">{model.sizeNm} nm</span>
                  <span className="text-[9px] text-slate-500 font-mono">±{model.stdDev} nm</span>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Physics Insight:</strong> Pure Lorentzian deconvolution assumes Cauchy line shapes with long asymptotic tails, yielding smaller domain sizes. De Keijser isolates Lorentzian size broadening from Gaussian microstrain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
