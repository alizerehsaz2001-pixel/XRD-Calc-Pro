import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DiffractionChart } from './DiffractionChart';
import { MATERIAL_DB } from '../utils/materialDB';
import { BraggResult } from '../types';
import { Layers, ChevronDown, Check, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea } from 'recharts';

interface DiffractionCompareModuleProps {
  activeResults?: BraggResult[];
  activeMaterialName?: string | null;
}

export const DiffractionCompareModule: React.FC<DiffractionCompareModuleProps> = ({
  activeResults = [],
  activeMaterialName = null
}) => {
  const { t } = useTranslation();

  const userSampleMaterial = useMemo(() => {
    if (!activeResults || activeResults.length === 0) return null;
    return {
      name: 'My Synthesized Sample',
      formula: activeMaterialName || 'Unknown Phase',
      crystalSystem: t('Synthesized'),
      spaceGroup: t('Custom Peaks'),
      isUserSample: true,
      pattern: activeResults.map(r => `${r.twoTheta}(${r.hkl || ''})`).join(', '),
      results: activeResults
    };
  }, [activeResults, activeMaterialName, t]);

  const [selectedMaterialAName, setSelectedMaterialAName] = useState<string>(() => {
    if (activeResults && activeResults.length > 0) {
      return 'active_sample';
    }
    return MATERIAL_DB[1].name;
  });

  const [selectedMaterialBName, setSelectedMaterialBName] = useState<string>(() => {
    if (activeMaterialName) {
      const match = MATERIAL_DB.find(m => m.name.toLowerCase().includes(activeMaterialName.toLowerCase()) || activeMaterialName.toLowerCase().includes(m.name.toLowerCase()));
      if (match) return match.name;
    }
    // Try to find Hydroxyapatite as a generic default if available
    const haMatch = MATERIAL_DB.find(m => m.name.toLowerCase().includes('hydroxyapatite'));
    if (haMatch) return haMatch.name;
    return MATERIAL_DB[5].name;
  });

  const materialA = useMemo(() => {
    if (selectedMaterialAName === 'active_sample' && userSampleMaterial) {
      return userSampleMaterial;
    }
    return MATERIAL_DB.find(m => m.name === selectedMaterialAName) || MATERIAL_DB[1];
  }, [selectedMaterialAName, userSampleMaterial]);

  const materialB = useMemo(() => {
    if (selectedMaterialBName === 'active_sample' && userSampleMaterial) {
      return userSampleMaterial;
    }
    return MATERIAL_DB.find(m => m.name === selectedMaterialBName) || MATERIAL_DB[5];
  }, [selectedMaterialBName, userSampleMaterial]);
  
  const generateChartData = (matA: any, matB: any) => {
    // We will generate the superimposed data here
    const minTheta = 10;
    const maxTheta = 90;
    const step = 0.1;
    
    // Quick helper to generate simulated peaks for a material
    const parsePattern = (material: any) => {
        if (!material) return [];
        if (material.isUserSample) {
            return (material.results || []).map((r: any) => ({
                twoTheta: r.twoTheta,
                intensity: r.intensity !== undefined ? r.intensity : 100,
                hkl: r.hkl || ''
            }));
        }
        const pattern = material.pattern || '';
        return pattern.split(',').map((s: string) => {
            const [thetaStr, hklStr] = s.split('(');
            const theta = parseFloat(thetaStr.trim());
            return {
                twoTheta: theta,
                intensity: 100, // Normalized max intensity
                hkl: hklStr ? hklStr.replace(')', '').trim() : ''
            };
        }).filter((p: any) => !isNaN(p.twoTheta));
    };

    const peaksA = parsePattern(matA);
    const peaksB = parsePattern(matB);
    
    const points = [];
    for (let x = minTheta; x <= maxTheta; x += step) {
      // Baseline noise to simulate experimental background
      let intensityA = Math.random() * 1.5 + 2; 
      let intensityB = Math.random() * 1.5 + 2; 
      
      const hwA = 0.08; // half-width for pseudo-Voigt
      peaksA.forEach(p => {
        const diff = x - p.twoTheta;
        if (Math.abs(diff) < 2.0) {
            // Pseudo-Voigt (50% Gaussian, 50% Lorentzian) for realistic XRD peaks
            const g = Math.exp(-Math.log(2) * Math.pow(diff / hwA, 2));
            const l = 1 / (1 + Math.pow(diff / hwA, 2));
            intensityA += p.intensity * (0.5 * g + 0.5 * l);
        }
      });
      
      const hwB = 0.08;
      peaksB.forEach(p => {
        const diff = x - p.twoTheta;
        if (Math.abs(diff) < 2.0) {
            const g = Math.exp(-Math.log(2) * Math.pow(diff / hwB, 2));
            const l = 1 / (1 + Math.pow(diff / hwB, 2));
            intensityB += p.intensity * (0.5 * g + 0.5 * l);
        }
      });
      
      points.push({
        twoTheta: Number(x.toFixed(2)),
        intensityA: Number(intensityA.toFixed(1)),
        intensityB: Number(intensityB.toFixed(1)),
      });
    }

    return { points, peaksA, peaksB };
  };

  const [left, setLeft] = useState<number | string>('dataMin');
  const [right, setRight] = useState<number | string>('dataMax');
  const [refAreaLeft, setRefAreaLeft] = useState<number | string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | string | null>(null);

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
    setLeft(zoomLeft);
    setRight(zoomRight);
  };

  const zoomOut = () => {
    setLeft('dataMin');
    setRight('dataMax');
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const panLeft = () => {
    if (typeof left === 'number' && typeof right === 'number') {
      const range = right - left;
      const shift = Math.max(10, range * 0.1);
      setLeft(left - shift);
      setRight(right - shift);
    }
  };

  const panRight = () => {
    if (typeof left === 'number' && typeof right === 'number') {
      const range = right - left;
      const shift = Math.max(10, range * 0.1);
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
      setLeft(Math.max(10, left - shift)); // minTheta is 10
      setRight(Math.min(90, right + shift)); // maxTheta is 90
    }
  };

  const isZoomedIn = typeof left === 'number' && typeof right === 'number';

  const { points } = useMemo(() => generateChartData(materialA, materialB), [materialA, materialB]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
            {t('Sample A (Synthesized Sample / Base)', 'Sample A (Synthesized Sample / Base)')}
          </label>
          <div className="relative">
            <select
              value={selectedMaterialAName}
              onChange={(e) => setSelectedMaterialAName(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-black/60 border border-slate-800 text-slate-200 outline-none rounded-xl text-xs font-mono font-bold appearance-none hover:border-indigo-500/50 transition-colors"
            >
              {userSampleMaterial && (
                <option value="active_sample">🧪 {t('My Synthesized Sample', 'My Synthesized Sample')} ({userSampleMaterial.formula})</option>
              )}
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
          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            {t('Sample B (Comparison Database)', 'Sample B (Comparison Database)')}
          </label>
          <div className="relative">
            <select
              value={selectedMaterialBName}
              onChange={(e) => setSelectedMaterialBName(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-black/60 border border-slate-800 text-slate-200 outline-none rounded-xl text-xs font-mono font-bold appearance-none hover:border-emerald-500/50 transition-colors"
            >
              {userSampleMaterial && (
                <option value="active_sample">🧪 {t('My Synthesized Sample', 'My Synthesized Sample')} ({userSampleMaterial.formula})</option>
              )}
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

      <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[800px] w-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">{t('Diffraction Compare', 'Diffraction Compare')}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex gap-2 items-center">
                <span>{t('Comparative Overlay Analysis', 'Comparative Overlay Analysis')}</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[8px] text-slate-400 border border-slate-700">{t('Drag to Zoom', 'Drag to Zoom')}</span>
              </p>
            </div>
          </div>

          {isZoomedIn && (
            <div className="flex items-center gap-2">
              <button onClick={panLeft} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700 hover:border-indigo-500/50" title="Pan Left">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={panRight} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700 hover:border-indigo-500/50" title="Pan Right">
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <button onClick={zoomInStep} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700 hover:border-indigo-500/50" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={zoomOutStep} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700 hover:border-indigo-500/50" title="Zoom Out">
                 <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={zoomOut} className="flex items-center gap-1.5 ml-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-indigo-500/30" title="Reset">
                 <RotateCcw className="w-3 h-3" />
                 {t('Reset Zoom', 'Reset Zoom')}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 w-full flex flex-col gap-0 relative z-10 select-none bg-[#e6e6e6] p-1 border-2 border-slate-400">
          
          {/* Top Chart */}
          <div className="flex-[3] w-full bg-white relative border-2 border-slate-500">
            <div className="absolute top-2 left-16 text-black text-[11px] font-mono z-10 px-1 border border-transparent">
              {materialA?.name ? t(materialA.name) : t('Sample A')} ({materialA?.formula})
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                syncId="compareSync"
                data={points} 
                margin={{ top: 25, right: 10, bottom: 20, left: 10 }}
                onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                onMouseUp={zoom}
                onMouseLeave={() => {
                  setRefAreaLeft(null);
                  setRefAreaRight(null);
                }}
              >
                <XAxis 
                  dataKey="twoTheta" 
                  type="number"
                  domain={[left, right]}
                  allowDataOverflow={true}
                  tick={{ fontSize: 11, fill: '#000', fontFamily: 'sans-serif' }}
                  axisLine={{ stroke: '#000' }}
                  tickLine={{ stroke: '#000' }}
                  label={{ value: t('Position [°2Theta]', 'Position [°2Theta]'), position: 'bottom', offset: 0, fill: '#000', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 120]} 
                  tick={{ fontSize: 11, fill: '#000' }}
                  axisLine={{ stroke: '#000' }}
                  tickLine={{ stroke: '#000' }}
                  label={{ value: t('Counts', 'Counts'), angle: -90, position: 'insideTopLeft', fill: '#000', fontSize: 12, dy: 30, dx: 15 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="intensityA" 
                  stroke="#ef4444" 
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                 />
                 {refAreaLeft && refAreaRight ? (
                   <ReferenceArea
                     x1={refAreaLeft}
                     x2={refAreaRight}
                     strokeOpacity={0.5}
                     fill="#1d4ed8"
                     fillOpacity={0.2}
                   />
                 ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Separation Bar (like HighScore "Analyze" toolbar) */}
          <div className="bg-[#f0f0f0] border-x border-slate-400 h-7 flex items-end">
            <div className="flex h-5 items-center gap-1 px-2 border-b-2 border-transparent">
               <div className="px-2 h-full text-[10px] text-gray-500 font-sans border-r border-[#ccc] flex items-center bg-white rounded-t-sm border border-b-0 border-slate-300">Default</div>
               <div className="px-2 h-full text-[10px] text-gray-800 font-sans border-t border-x border-slate-400 flex items-center bg-[#e6e6e6] font-bold">IdeAll</div>
               <div className="px-2 h-full text-[10px] text-gray-500 font-sans border border-[#ccc] flex items-center bg-white rounded-t-sm border-b-0">IdeCom</div>
            </div>
            <div className="h-full border-b border-slate-400 flex-1 ml-1" />
          </div>

          <div className="bg-[#e6e6e6] text-[#333] px-2 py-0.5 text-[10px] font-sans border-x border-slate-400">
            Additional Graphics
          </div>

          {/* Bottom Chart */}
          <div className="flex-[2] w-full bg-black relative border-2 border-slate-400">
            <div className="absolute top-2 left-16 text-white text-[11px] font-mono z-10 px-1">
              {materialB?.name ? t(materialB.name) : t('Sample B')} ({materialB?.formula})
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none z-0">
               <div className="w-2 h-[2px] bg-white"></div>
               <div className="w-2 h-[2px] bg-white"></div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                syncId="compareSync"
                data={points} 
                margin={{ top: 25, right: 10, bottom: 10, left: 10 }}
                onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                onMouseUp={zoom}
                onMouseLeave={() => {
                  setRefAreaLeft(null);
                  setRefAreaRight(null);
                }}
              >
                <XAxis 
                  dataKey="twoTheta" 
                  type="number"
                  domain={[left, right]}
                  allowDataOverflow={true}
                  tick={{ fontSize: 11, fill: '#fff', fontFamily: 'sans-serif' }}
                  axisLine={{ stroke: '#fff' }}
                  tickLine={{ stroke: '#fff' }}
                />
                <YAxis 
                  domain={[0, 120]} 
                  tick={{ fontSize: 11, fill: '#fff' }}
                  axisLine={{ stroke: '#fff' }}
                  tickLine={{ stroke: '#fff' }}
                  label={{ value: t('Counts', 'Counts'), angle: -90, position: 'insideTopLeft', fill: '#fff', fontSize: 12, dy: 30, dx: 15 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="intensityB" 
                  stroke="#00ffff" /* Cyan typical of HighScore lower graph */
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                 />
                 {refAreaLeft && refAreaRight ? (
                   <ReferenceArea
                     x1={refAreaLeft}
                     x2={refAreaRight}
                     strokeOpacity={0.5}
                     fill="#1d4ed8"
                     fillOpacity={0.5}
                   />
                 ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#f0f0f0] border-t border-slate-400 h-6 flex items-center px-2">
            <div className="flex items-center gap-2 text-[10px] text-gray-700 font-sans mt-0.5">
               <span className="cursor-pointer hover:bg-slate-300 px-1 py-0.5 border border-transparent">Default</span>
               <span className="cursor-pointer bg-slate-300 px-1 py-0.5 border border-slate-400 shadow-sm font-bold">IdeAll</span>
               <span className="cursor-pointer hover:bg-slate-300 px-1 py-0.5 border border-transparent">IdeCom</span>
               <span className="cursor-pointer hover:bg-slate-300 px-1 py-0.5 border border-transparent">IdeMin</span>
               <span className="cursor-pointer hover:bg-slate-300 px-1 py-0.5 border border-transparent">MinorMinerals</span>
               <span className="cursor-pointer hover:bg-slate-300 px-1 py-0.5 border border-transparent text-slate-400">PrintIdeAll</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
