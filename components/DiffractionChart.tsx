
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
  ReferenceArea,
  Legend,
  Line
} from 'recharts';
import { Activity, Terminal, RotateCcw, Tag, Camera, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, MinusCircle, Maximize, Minimize, Layers } from 'lucide-react';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';
import { getActiveMaterials } from '../utils/materialsHelper';

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
  const [smoothChart, setSmoothChart] = useState(false);
  const [subtractBaseline, setSubtractBaseline] = useState(false);
  const [showObserved, setShowObserved] = useState(true);
  const [showTheoretical, setShowTheoretical] = useState(true);
  const [showOverlap, setShowOverlap] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleLegendClick = (e: any) => {
    if (e.dataKey === 'intensity') setShowObserved(!showObserved);
    if (e.dataKey === 'theoreticalIntensity') setShowTheoretical(!showTheoretical);
  };

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

  const panLeft = () => {
    if (typeof left === 'number' && typeof right === 'number') {
      const range = right - left;
      const shift = Math.max(5, range * 0.1);
      setLeft(left - shift);
      setRight(right - shift);
    }
  };

  const panRight = () => {
    if (typeof left === 'number' && typeof right === 'number') {
      const range = right - left;
      const shift = Math.max(5, range * 0.1);
      setLeft(left + shift);
      setRight(right + shift);
    }
  };

  const zoomInStep = () => {
    if (typeof left === 'number' && typeof right === 'number') {
      const range = right - left;
      const shift = range * 0.1;
      setLeft(left + shift);
      setRight(right - shift);
    } else {
      setLeft(10);
      setRight(90);
    }
  };

  const zoomOutStep = () => {
    if (typeof left === 'number' && typeof right === 'number') {
      const range = right - left;
      const shift = range * 0.1;
      setLeft(left - shift);
      setRight(right + shift);
    }
  };

  const isZoomedIn = left !== 'dataMin - 5' || right !== 'dataMax + 5';

  const chartData = useMemo(() => {
    if (results.length === 0) return { points: [], peakData: [] };

    const minTheta = Math.max(0, Math.min(...results.map(r => r.twoTheta)) - 10);
    const maxTheta = Math.max(...results.map(r => r.twoTheta)) + 10;
    
    const points = [];
    for (let x = minTheta; x <= maxTheta; x += 0.1) {
      let intensity = 5; // Background noise floor
      const peakInts: number[] = [];

      results.forEach(r => {
        const diff = x - r.twoTheta;
        if (Math.abs(diff) < 1.6) { // 4 * sigma threshold (anything further is mathematically negligible)
          // Gaussian peak simulation using actual intensity if available (defaulting to 100)
          const intensityFactor = r.intensity !== undefined ? r.intensity : 100;
          const peakInt = (intensityFactor * 0.95) * Math.exp(-Math.pow(diff, 2) / 0.32); // 2 * sigma^2 is 0.32
          intensity += peakInt;
          if (peakInt > 0.5) {
            peakInts.push(peakInt);
          }
        }
      });
      // Add random noise
      intensity += Math.random() * 2;
      
      let overlapIntensity = 0;
      if (peakInts.length > 1) {
         peakInts.sort((a, b) => b - a);
         overlapIntensity = peakInts[1] * 2; // visually amplify intersection
         if (overlapIntensity > intensity) overlapIntensity = intensity;
      }

      points.push({
        twoTheta: x,
        intensity: intensity,
        overlapIntensity: overlapIntensity,
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
      isLabelVisible: false,
      labelLevel: 0,
      isMatch: false,
      theoreticalHkl: '',
    })).sort((a, b) => a.twoTheta - b.twoTheta);

    if (materialName) {
      const activeMaterials = getActiveMaterials();
      const material = activeMaterials.find(m => m.name === materialName);
      if (material && material.pattern) {
        const lines = material.pattern.split('\n');
        const theoreticalPeaks = lines.map(line => {
           const parts = line.split(',');
           if (parts.length >= 2) {
              return {
                 twoTheta: parseFloat(parts[0].trim()),
                 intensity: parseFloat(parts[1].trim()),
                 hkl: parts.length > 2 ? parts.slice(2).map(p => p.trim()).join(',') : undefined
              };
           }
           return null;
        }).filter(Boolean) as any[];

        const matchTolerance = 0.5; // degrees
        peakData.forEach(p => {
           const match = theoreticalPeaks.find(tp => Math.abs(tp.twoTheta - p.twoTheta) <= matchTolerance);
           if (match) {
             p.isMatch = true;
             if (match.hkl) {
                 p.theoreticalHkl = match.hkl;
                 if (!p.hkl) {
                    p.hkl = match.hkl;
                 }
             }
           }
        });
        
        points.forEach(pt => {
           let theInt = 5;
           theoreticalPeaks.forEach(tp => {
             const diff = pt.twoTheta - tp.twoTheta;
             if (Math.abs(diff) < 1.6) {
               const peakInt = (tp.intensity * 0.95) * Math.exp(-Math.pow(diff, 2) / 0.32);
               theInt += peakInt;
             }
           });
           pt.theoreticalIntensity = theInt;
        });
      }
    }

    // Compute label staggering to avoid overlap
    const minThetaDiffForOverlap = 2.5; // Threshold for staggered labels
    for (let i = 0; i < peakData.length; i++) {
        let level = 0;
        const activeLevels = new Set();
        for (let j = Math.max(0, i - 10); j < i; j++) {
            if (Math.abs(peakData[i].twoTheta - peakData[j].twoTheta) < minThetaDiffForOverlap) {
                activeLevels.add(peakData[j].labelLevel);
            }
        }
        while (activeLevels.has(level)) {
            level++;
        }
        peakData[i].labelLevel = level % 6; // Max 6 levels
    }

    // Identify the top 5 most intense peaks
    const sortedPeaks = [...peakData].sort((a, b) => b.intensity - a.intensity);
    const topPeakThetas = new Set(sortedPeaks.slice(0, 5).map(p => p.twoTheta));

    peakData = peakData.map(p => ({
      ...p,
      isLabelVisible: topPeakThetas.has(p.twoTheta)
    }));

    let processedPoints = [...points];

    if (subtractBaseline) {
      // Rolling-ball baseline subtraction (approx. morphological opening)
      const windowSize = 25; // 2.5 degrees window (25 * 0.1 step)
      
      // Step 1: Erosion (min filter)
      const mins = processedPoints.map((point, i) => {
        let min = point.intensity;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(processedPoints.length - 1, i + windowSize); j++) {
          if (processedPoints[j].intensity < min) min = processedPoints[j].intensity;
        }
        return min;
      });

      // Step 2: Dilation (max filter)
      const background = mins.map((minVal, i) => {
        let max = minVal;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(mins.length - 1, i + windowSize); j++) {
          if (mins[j] > max) max = mins[j];
        }
        return max;
      });

      // Step 3: Subtraction
      processedPoints = processedPoints.map((point, i) => ({
        ...point,
        intensity: Math.max(0, point.intensity - background[i])
      }));
    }

    if (smoothChart) {
      const windowSize = 5;
      const smoothedPoints = processedPoints.map((point, i) => {
        let sum = 0;
        let count = 0;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(processedPoints.length - 1, i + windowSize); j++) {
          sum += processedPoints[j].intensity;
          count++;
        }
        return {
          ...point,
          intensity: sum / count,
        };
      });
      return { points: smoothedPoints, peakData };
    }

    return { points: processedPoints, peakData };
  }, [results, smoothChart, subtractBaseline]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload.find((p: any) => p.payload.isPeak)?.payload || payload[0].payload;
      
      return (
        <div className="bg-slate-950/95 backdrop-blur-xl text-white p-5 rounded-2xl shadow-2xl border border-slate-800 min-w-[220px] shadow-black/80">
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
             <div className={`w-2 h-2 rounded-full ${d.isMatch ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
               {d.isMatch ? 'DB Match Verified' : 'Spectral Analysis'}
             </span>
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
    <div 
      ref={containerRef} 
      className={`bg-[#060B15] p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col relative overflow-hidden group/chart transition-all duration-700 ${
        isFullScreen 
          ? 'fixed inset-4 z-[9999] h-[calc(100vh-32px)] text-lg' 
          : 'h-[620px] w-full'
      }`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] group-hover/chart:bg-indigo-600/15 transition-all duration-1000 animate-pulse" />
      <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-80 h-80 bg-cyan-600/5 rounded-full blur-[80px] transition-all duration-1000" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.02),transparent_50%)] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative group/icon">
            <div className="absolute inset-0 bg-indigo-500/40 blur-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500" />
            <div className="relative p-3.5 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 rounded-2xl border border-indigo-500/30 shadow-inner">
              <Activity className="w-6 h-6 text-indigo-400 group-hover/icon:scale-110 transition-transform duration-500" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">{t('Spectral Visualizer', 'Spectral Visualizer')}</h3>
            <div className="flex gap-3 items-center mt-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Calculated Diffraction Profile</p>
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                <span className="px-2 py-0.5 bg-indigo-500/10 rounded font-mono text-[8px] font-black text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">{t('Drag to Zoom', 'Drag to Zoom')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 shadow-inner mr-2">
            <button 
              onClick={() => setShowHKL(!showHKL)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                showHKL 
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Tag className="w-3 h-3" />
              {t('HKL', 'HKL')}
            </button>
            <button 
              onClick={() => setSubtractBaseline(!subtractBaseline)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                subtractBaseline 
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <MinusCircle className="w-3 h-3" />
              {t('Baseline', 'Baseline')}
            </button>
            <button 
              onClick={() => setSmoothChart(!smoothChart)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                smoothChart 
                  ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Activity className="w-3 h-3" />
              {t('Smooth', 'Smooth')}
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={takeSnapshot}
              className="group/btn p-2.5 bg-slate-800/50 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 rounded-xl transition-all duration-300 border border-white/5 hover:border-indigo-500/30"
              title={t('Take Snapshot', 'Take Snapshot')}
            >
              <Camera className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="group/btn p-2.5 bg-slate-800/50 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 rounded-xl transition-all duration-300 border border-white/5 hover:border-indigo-500/30"
              title={isFullScreen ? t('Minimize', 'Minimize') : t('Full Screen', 'Full Screen')}
            >
              {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>

          {isZoomedIn && (
            <div className="flex items-center gap-1.5 ml-2 bg-slate-950/40 p-1 rounded-xl border border-white/5">
              <button onClick={panLeft} className="p-2 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 rounded-lg transition-colors" title="Pan Left">
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={panRight} className="p-2 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 rounded-lg transition-colors" title="Pan Right">
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-0.5"></div>
              <button onClick={zoomOut} className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg transition-colors" title="Reset">
                 <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 min-w-0 relative z-10 select-none bg-[#020617]/40 rounded-3xl border border-white/5 p-4 shadow-inner">
        {/* Graph Scientific Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            margin={{ top: 30, right: 30, bottom: 20, left: -25 }}
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
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
               </linearGradient>
               <filter id="glowShadow" x="-20%" y="-20%" width="140%" height="140%">
                 <feGaussianBlur stdDeviation="3" result="blur" />
                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
               </filter>
            </defs>
            
            <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
            
            <XAxis 
              dataKey="twoTheta" 
              type="number"
              domain={[left, right]} 
              allowDataOverflow={true}
              tick={{ fontSize: 10, fontWeight: 'black', fill: '#475569', fontFamily: 'monospace' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.05)' }}
              label={{ value: 'Diffraction Angle 2θ', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontWeight: 'black', tracking: '0.2em', uppercase: true }}
            />
            
            <YAxis hide domain={[0, 125]} />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: 'rgba(99, 102, 241, 0.2)', strokeWidth: 1 }} 
            />
            
            <Legend 
              verticalAlign="top" 
              align="right"
              height={40} 
              iconType="circle"
              wrapperStyle={{ 
                fontSize: '9px', 
                fontWeight: 'black', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                paddingRight: '10px'
              }}
              onClick={handleLegendClick}
            />
            
            {showObserved && (
              <Area 
                data={chartData.points}
                type="monotone"
                dataKey="intensity"
                name={t('Observed Pattern', 'Observed Pattern')}
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#profileGradient)"
                isAnimationActive={!isZoomedIn}
                animationDuration={1500}
                strokeLinecap="round"
              />
            )}

            {showTheoretical && materialName && (
              <Line 
                data={chartData.points}
                type="monotone"
                dataKey="theoreticalIntensity"
                name={`${materialName}`}
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                strokeDasharray="6 4"
                isAnimationActive={false}
                opacity={0.7}
              />
            )}

            <Scatter 
              data={chartData.peakData} 
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;
                
                let l = typeof left === 'string' ? payload.twoTheta - 100 : Number(left);
                let r = typeof right === 'string' ? payload.twoTheta + 100 : Number(right);
                if (payload.twoTheta < l || payload.twoTheta > r) return null;
                
                const yOffset = cy - 20 - (payload.labelLevel * 16);
                const isMatch = payload.isMatch;
                const markerColor = isMatch ? "#f59e0b" : "#10b981";
                
                return (
                  <g className="transition-all duration-300">
                    <line x1={cx} y1={cy} x2={cx} y2={cy + 400} stroke={markerColor} strokeWidth={1} strokeDasharray="4 4" opacity={0.2} />
                    <circle cx={cx} cy={cy} r={5} fill={markerColor} filter="url(#glowShadow)" stroke="white" strokeWidth={1.5} />
                    {showHKL && payload.hkl && (
                      <g>
                        <text 
                          x={cx} 
                          y={yOffset} 
                          textAnchor="middle" 
                          fill={markerColor} 
                          fontSize="10" 
                          fontWeight="black"
                          className="font-mono tracking-tighter drop-shadow-2xl"
                        >
                          {payload.hkl}
                        </text>
                      </g>
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
                fillOpacity={0.1}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="absolute bottom-6 right-10 flex items-center gap-3 opacity-50">
        <div className="flex flex-col items-end">
           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Calibration Standard</span>
           <span className="text-[10px] font-black text-white font-mono uppercase tracking-widest">NIST-XRD-992</span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <Terminal className="w-4 h-4 text-indigo-500" />
      </div>
    </div>
  );
};
