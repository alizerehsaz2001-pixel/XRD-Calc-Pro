import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DiffractionChart } from './DiffractionChart';
import { MATERIAL_DB } from '../utils/materialDB';
import { BraggResult } from '../types';
import { Layers, ChevronDown, Check } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const DiffractionCompareModule: React.FC = () => {
  const { t } = useTranslation();
  const [materialA, setMaterialA] = useState<any>(MATERIAL_DB[1]); // Default to Quartz
  const [materialB, setMaterialB] = useState<any>(MATERIAL_DB[5]); // Default to Corundum
  
  const generateChartData = (matA: any, matB: any) => {
    // We will generate the superimposed data here
    const minTheta = 10;
    const maxTheta = 90;
    
    // Quick helper to generate simulated peaks for a material based on its pattern string
    const parsePattern = (pattern: string) => {
        if (!pattern) return [];
        return pattern.split(',').map(s => {
            const [thetaStr, hklStr] = s.split('(');
            const theta = parseFloat(thetaStr.trim());
            return {
                twoTheta: theta,
                intensity: 100, // Random intensity or fixed for simplification
                hkl: hklStr ? hklStr.replace(')', '').trim() : ''
            };
        }).filter(p => !isNaN(p.twoTheta));
    };

    const peaksA = parsePattern(matA?.pattern || '');
    const peaksB = parsePattern(matB?.pattern || '');
    
    const points = [];
    for (let x = minTheta; x <= maxTheta; x += 0.2) {
      let intensityA = 5; 
      let intensityB = 5; 
      
      peaksA.forEach(p => {
        const diff = x - p.twoTheta;
        if (Math.abs(diff) < 2) {
          intensityA += 90 * Math.exp(-Math.pow(diff, 2) / 0.15); 
        }
      });
      
      peaksB.forEach(p => {
        const diff = x - p.twoTheta;
        if (Math.abs(diff) < 2) {
          intensityB += 90 * Math.exp(-Math.pow(diff, 2) / 0.15); 
        }
      });
      
      points.push({
        twoTheta: x,
        intensityA: intensityA + Math.random() * 2,
        intensityB: intensityB + Math.random() * 2,
      });
    }

    return { points, peaksA, peaksB };
  };

  const { points } = useMemo(() => generateChartData(materialA, materialB), [materialA, materialB]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{t('Sample A (Base Material)', 'Sample A (Base Material)')}</label>
          <div className="relative">
            <select
              value={materialA?.name}
              onChange={(e) => setMaterialA(MATERIAL_DB.find(m => m.name === e.target.value) || MATERIAL_DB[0])}
              className="w-full pl-4 pr-10 py-3 bg-black/60 border border-slate-800 text-slate-200 outline-none rounded-xl text-xs font-mono font-bold appearance-none hover:border-indigo-500/50 transition-colors"
            >
              {MATERIAL_DB.map(m => (
                <option key={m.name} value={m.name}>{t(m.name)} ({m.formula})</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-3.5 pointer-events-none" />
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase border border-indigo-500/20">
              {materialA?.crystalSystem ? t(materialA.crystalSystem) : t("Unknown")}
            </div>
            <div className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
              SG: {materialA?.spaceGroup || "Unknown"}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{t('Sample B (Comparison)', 'Sample B (Comparison)')}</label>
          <div className="relative">
            <select
              value={materialB?.name}
              onChange={(e) => setMaterialB(MATERIAL_DB.find(m => m.name === e.target.value) || MATERIAL_DB[1])}
              className="w-full pl-4 pr-10 py-3 bg-black/60 border border-slate-800 text-slate-200 outline-none rounded-xl text-xs font-mono font-bold appearance-none hover:border-emerald-500/50 transition-colors"
            >
              {MATERIAL_DB.map(m => (
                <option key={m.name} value={m.name}>{t(m.name)} ({m.formula})</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-3.5 pointer-events-none" />
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-500/20">
              {materialB?.crystalSystem ? t(materialB.crystalSystem) : t("Unknown")}
            </div>
            <div className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
              SG: {materialB?.spaceGroup || "Unknown"}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[500px] w-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">{t('Diffraction Compare', 'Diffraction Compare')}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                {t('Comparative Overlay Analysis', 'Comparative Overlay Analysis')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0 min-w-0 relative z-10 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 25, right: 20, bottom: 20, left: -20 }}>
              <defs>
                 <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                 </linearGradient>
                 <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                 </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis 
                dataKey="twoTheta" 
                type="number"
                domain={['dataMin', 'dataMax']} 
                tick={{ fontSize: 10, fontWeight: 'black', fill: '#475569', fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
                label={{ value: t('2θ (Degrees)', '2θ (Degrees)'), position: 'bottom', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
              />
              <YAxis hide domain={[0, 120]} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}/>
              <Area 
                type="monotone" 
                dataKey="intensityA" 
                name={materialA?.name ? t(materialA.name) : t('Sample A')}
                stroke="#818cf8" 
                fillOpacity={1} 
                fill="url(#colorA)" 
                strokeWidth={2}
               />
              <Area 
                type="monotone" 
                dataKey="intensityB" 
                name={materialB?.name ? t(materialB.name) : t('Sample B')}
                stroke="#34d399" 
                fillOpacity={1} 
                fill="url(#colorB)" 
                strokeWidth={2}
               />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
