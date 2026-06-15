
import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Scatter,
  ReferenceArea
} from 'recharts';
import { Activity, Terminal, RotateCcw, Tag, Camera } from 'lucide-react';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';

interface DiffractionChartProps {
  results: BraggResult[];
  materialName?: string | null;
}

export const DiffractionChart: React.FC<DiffractionChartProps> = ({ results, materialName }) => {
  const { t } = useTranslation();
  const { precision } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zooming states
  const [left, setLeft] = useState<number | string>('dataMin - 5');
  const [right, setRight] = useState<number | string>('dataMax + 5');
  const [refAreaLeft, setRefAreaLeft] = useState<number | string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | string | null>(null);

  // HKL labels toggle
  const [showHKL, setShowHKL] = useState(true);

  const takeSnapshot = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;

    try {
      const svgString = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const bbox = svgEl.getBoundingClientRect();
        // Scale by 2 for ultra-sharp snapshot
        canvas.width = (bbox.width || 800) * 2;
        canvas.height = (bbox.height || 400) * 2;
        
        const context = canvas.getContext('2d');
        if (context) {
          // Fill chart background color
          context.fillStyle = '#0f172a';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const dlLink = document.createElement('a');
              dlLink.download = `${materialName ? materialName.replace(/\s+/g, '_') : 'XRD'}_Diffraction_Spectrum.png`;
              dlLink.href = URL.createObjectURL(blob);
              document.body.appendChild(dlLink);
              dlLink.click();
              document.body.removeChild(dlLink);
            }
          }, 'image/png');
        }
      };
      image.src = blobURL;
    } catch (error) {
      console.error('Error capturing chart snapshot:', error);
    }
  };

  const zoom = () => {
    let zoomLeft = refAreaLeft;
    let zoomRight = refAreaRight;

    if (zoomLeft === zoomRight || zoomRight === null || zoomLeft === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    if (zoomLeft > zoomRight) {
      [zoomLeft, zoomRight] = [zoomRight, zoomLeft];
    }

    setRefAreaLeft(null);
    setRefAreaRight(null);
    setLeft(Number(zoomLeft).toFixed(1));
    setRight(Number(zoomRight).toFixed(1));
  };

  const zoomOut = () => {
    setLeft('dataMin - 5');
    setRight('dataMax + 5');
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const isZoomedIn = left !== 'dataMin - 5' || right !== 'dataMax + 5';

  const chartData = useMemo(() => {
    if (results.length === 0) return { points: [], peakData: [] };

    const minTheta = Math.max(0, Math.min(...results.map(r => r.twoTheta)) - 10);
    const maxTheta = Math.max(...results.map(r => r.twoTheta)) + 10;
    
    const points = [];
    for (let x = minTheta; x <= maxTheta; x += 0.1) {
      let intensity = 5; // Background noise floor
      results.forEach(r => {
        const diff = x - r.twoTheta;
        if (Math.abs(diff) < 1.6) { // 4 * sigma threshold (anything further is mathematically negligible)
          // Gaussian peak simulation using actual intensity if available (defaulting to 100)
          const intensityFactor = r.intensity !== undefined ? r.intensity : 100;
          const sigma = 0.4;
          const peakInt = (intensityFactor * 0.95) * Math.exp(-Math.pow(diff, 2) / 0.32); // 2 * sigma^2 is 0.32
          intensity += peakInt;
        }
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
    let peakData = results.map(r => ({
      twoTheta: r.twoTheta,
      intensity: r.intensity !== undefined ? r.intensity : 100,
      isPeak: true,
      hkl: r.hkl,
      dSpacing: r.dSpacing,
      q: r.qVector,
      isLabelVisible: false
    }));

    // Identify the top 5 most intense peaks
    const sortedPeaks = [...peakData].sort((a, b) => b.intensity - a.intensity);
    const topPeakThetas = new Set(sortedPeaks.slice(0, 5).map(p => p.twoTheta));

    peakData = peakData.map(p => ({
      ...p,
      isLabelVisible: topPeakThetas.has(p.twoTheta)
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
              <p className="text-xl font-black text-white font-mono tracking-tighter">2θ: {d.twoTheta.toFixed(Math.min(precision, 3))}°</p>
            </div>

            {d.isPeak && (
              <>
                {d.hkl && (
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Index</span>
                    <span className="text-xs font-black text-indigo-400 font-mono tracking-widest">({d.hkl})</span>
                  </div>
                )}

                <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Intensity</span>
                  <span className="text-xs font-black text-amber-400 font-mono">{d.intensity.toFixed(1)}%</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                     <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">d-spacing</p>
                     <p className="text-[11px] font-bold text-emerald-400 font-mono">{d.dSpacing?.toFixed(precision)} Å</p>
                   </div>
                   <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                     <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Q-vector</p>
                     <p className="text-[11px] font-bold text-sky-400 font-mono">{d.q?.toFixed(precision)}</p>
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
    <div ref={containerRef} className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[400px] w-full flex flex-col relative overflow-hidden group/chart">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover/chart:bg-indigo-500/10 transition-all duration-1000" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase">{t('Spectral Visualizer', 'Spectral Visualizer')}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex gap-2 items-center">
              <span>{t('Calculated Diffraction Profile', 'Calculated Diffraction Profile')}</span>
              <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[8px] text-slate-400 border border-slate-700">{t('Drag to Zoom', 'Drag to Zoom')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHKL(!showHKL)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border ${
              showHKL 
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30' 
                : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 border-slate-700'
            }`}
          >
            <Tag className="w-3 h-3" />
            {t('HKL Labels', 'HKL Labels')}
          </button>
          <button 
            onClick={takeSnapshot}
            className="flex items-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-indigo-500/30"
          >
            <Camera className="w-3 h-3" />
            {t('Take Snapshot', 'Take Snapshot')}
          </button>
          {isZoomedIn && (
            <button 
              onClick={zoomOut}
              className="flex items-center gap-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-indigo-500/30"
            >
              <RotateCcw className="w-3 h-3" />
              {t('Reset Zoom', 'Reset Zoom')}
            </button>
          )}
          <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-2xl border border-slate-800/50">
             <Terminal className="w-3 h-3 text-slate-600" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('Pattern Synthesis Active', 'Pattern Synthesis Active')}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 min-w-0 relative z-10 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            margin={{ top: 25, right: 20, bottom: 20, left: -20 }}
            onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
            onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
            onMouseUp={zoom}
            onMouseLeave={() => {
              setRefAreaLeft(null);
              setRefAreaRight(null);
            }}
          >
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
              domain={[left, right]} 
              allowDataOverflow={true}
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
              isAnimationActive={!isZoomedIn}
              animationDuration={2000}
            />

            {/* Peak Markers Scatter */}
            <Scatter 
              data={chartData.peakData} 
              fill="#10b981"
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;
                // Only render if within zoom bounds. Left and right might be string or number.
                let l = typeof left === 'string' ? payload.twoTheta - 100 : Number(left);
                let r = typeof right === 'string' ? payload.twoTheta + 100 : Number(right);
                if (payload.twoTheta < l || payload.twoTheta > r) return null;
                
                return (
                  <g>
                    <line x1={cx} y1={cy} x2={cx} y2={cy + 300} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" opacity={0.4} />
                    <circle cx={cx} cy={cy} r={4} fill="#10b981" stroke="#fff" strokeWidth={1} />
                    {showHKL && payload.hkl && (
                      <text x={cx} y={cy - 12} textAnchor="middle" fill="#94a3b8" fontSize="10" className="font-bold font-mono tracking-widest drop-shadow-md">
                        ({payload.hkl})
                      </text>
                    )}
                  </g>
                )
              }}
            />

            {refAreaLeft && refAreaRight ? (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="#6366f1"
                fillOpacity={0.2}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {materialName && (
        <div className="absolute top-8 right-64 px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full z-20 transition-opacity">
           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{materialName} Simulation</span>
        </div>
      )}
    </div>
  );
};
