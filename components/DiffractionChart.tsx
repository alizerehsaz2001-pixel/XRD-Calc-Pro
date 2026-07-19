
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
  ReferenceLine,
  Legend,
  Line,
  Label
} from 'recharts';
import { Activity, Terminal, RotateCcw, Tag, Camera, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, MinusCircle, Maximize, Minimize, Layers } from 'lucide-react';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';
import { getActiveMaterials } from '../utils/materialsHelper';
import { calculateBragg } from '../utils/physics';

interface DiffractionChartProps {
  results: BraggResult[];
  materialName?: string | null;
  wavelength?: number;
  onResultsChange?: (newResults: BraggResult[]) => void;
}

export const DiffractionChart: React.FC<DiffractionChartProps> = ({ results, materialName, wavelength, onResultsChange }) => {
  const { t } = useTranslation();
  const { precision } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zooming states
  const [left, setLeft] = useState<number | null>(null);
  const [right, setRight] = useState<number | null>(null);
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

  // Reference peaks overlay states
  const [showRefPeaks, setShowRefPeaks] = useState(false);
  const [refMaterial, setRefMaterial] = useState('Silicon');

  const parsedRefPeaks = useMemo(() => {
    if (!showRefPeaks) return [];
    const lambdaCu = 0.154059; // Cu Kα in nm
    // wavelength is in Angstroms, so convert to nm (or default to 1.54059 Å -> 0.154059 nm)
    const targetWavelength = wavelength ? wavelength / 10 : 0.154059;

    const shiftPeak = (thetaCu: number): { theta: number; dSpacing: number; isSuppressed: boolean } => {
      const thetaRad = (thetaCu / 2) * (Math.PI / 180);
      const d = lambdaCu / (2 * Math.sin(thetaRad)); // in nm

      const sinThetaNew = targetWavelength / (2 * d);
      if (sinThetaNew > 0.999) {
        return { theta: 0, dSpacing: d * 10, isSuppressed: true };
      }
      const thetaNewRad = Math.asin(sinThetaNew);
      const twoThetaNew = 2 * thetaNewRad * (180 / Math.PI);
      return { theta: twoThetaNew, dSpacing: d * 10, isSuppressed: false };
    };

    const PRESETS: Record<string, { theta: number; label: string }[]> = {
      'Silicon': [
        { theta: 28.442, label: 'Si (111)' },
        { theta: 47.302, label: 'Si (220)' },
        { theta: 56.122, label: 'Si (311)' },
        { theta: 69.130, label: 'Si (400)' },
        { theta: 88.030, label: 'Si (422)' }
      ],
      'Gold': [
        { theta: 38.184, label: 'Au (111)' },
        { theta: 44.392, label: 'Au (200)' },
        { theta: 64.576, label: 'Au (220)' },
        { theta: 77.547, label: 'Au (311)' },
        { theta: 81.721, label: 'Au (222)' }
      ],
      'NaCl': [
        { theta: 27.351, label: 'NaCl (111)' },
        { theta: 31.693, label: 'NaCl (200)' },
        { theta: 45.412, label: 'NaCl (220)' },
        { theta: 53.864, label: 'NaCl (311)' },
        { theta: 56.431, label: 'NaCl (222)' }
      ],
      'Pyrite': [
        { theta: 28.532, label: 'FeS2 (111)' },
        { theta: 33.041, label: 'FeS2 (200)' },
        { theta: 37.083, label: 'FeS2 (210)' },
        { theta: 40.781, label: 'FeS2 (211)' },
        { theta: 56.324, label: 'FeS2 (311)' }
      ],
      'Quartz': [
        { theta: 20.855, label: 'SiO2 (100)' },
        { theta: 26.643, label: 'SiO2 (101)' },
        { theta: 36.542, label: 'SiO2 (110)' },
        { theta: 50.138, label: 'SiO2 (112)' },
        { theta: 59.954, label: 'SiO2 (211)' }
      ],
      'Aluminum': [
        { theta: 38.472, label: 'Al (111)' },
        { theta: 44.724, label: 'Al (200)' },
        { theta: 65.096, label: 'Al (220)' },
        { theta: 78.228, label: 'Al (311)' },
        { theta: 82.435, label: 'Al (222)' }
      ],
      'Copper': [
        { theta: 43.297, label: 'Cu (111)' },
        { theta: 50.433, label: 'Cu (200)' },
        { theta: 74.130, label: 'Cu (220)' },
        { theta: 89.931, label: 'Cu (311)' },
        { theta: 95.142, label: 'Cu (222)' }
      ],
      'Platinum': [
        { theta: 39.761, label: 'Pt (111)' },
        { theta: 46.244, label: 'Pt (200)' },
        { theta: 67.452, label: 'Pt (220)' },
        { theta: 81.285, label: 'Pt (311)' },
        { theta: 85.710, label: 'Pt (222)' }
      ],
      'Diamond': [
        { theta: 43.915, label: 'C (111)' },
        { theta: 75.302, label: 'C (220)' },
        { theta: 91.495, label: 'C (311)' }
      ]
    };

    const originalPeaks = PRESETS[refMaterial] || [];
    return originalPeaks.map(p => {
      const shifted = shiftPeak(p.theta);
      return {
        theta: shifted.theta,
        label: p.label,
        dSpacing: shifted.dSpacing,
        isSuppressed: shifted.isSuppressed,
        originalTheta: p.theta
      };
    }).filter(p => !p.isSuppressed);
  }, [showRefPeaks, refMaterial, wavelength]);

  // Hovered peak highlight states
  const [hoveredPeakTheta, setHoveredPeakTheta] = useState<number | null>(null);
  const [hoveredPeakData, setHoveredPeakData] = useState<any | null>(null);

  const [hoveredTwoThetaVal, setHoveredTwoThetaVal] = useState<number | null>(null);
  const [draggedPeakIndex, setDraggedPeakIndex] = useState<number | null>(null);

  const activeWavelengthVal = wavelength || 1.54059;

  const updatePeakTwoTheta = (index: number, newTwoTheta: number) => {
    if (!onResultsChange) return;
    const clampedTwoTheta = Math.max(1, Math.min(179, newTwoTheta));
    const updated = results.map((r, i) => {
      if (i === index) {
        const recalculated = calculateBragg(activeWavelengthVal, clampedTwoTheta);
        if (recalculated) {
          return {
            ...r,
            ...recalculated,
            intensity: r.intensity // preserve intensity
          };
        }
      }
      return r;
    });
    onResultsChange(updated);
  };

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

  // Get default / full-range boundaries based on peaks in data
  const dataMinTheta = useMemo(() => {
    if (results.length === 0) return 10;
    return Math.max(0, Math.min(...results.map(r => r.twoTheta)) - 10);
  }, [results]);

  const dataMaxTheta = useMemo(() => {
    if (results.length === 0) return 90;
    return Math.max(...results.map(r => r.twoTheta)) + 10;
  }, [results]);

  const currentLeft = useMemo(() => {
    return left !== null ? left : dataMinTheta;
  }, [left, dataMinTheta]);

  const currentRight = useMemo(() => {
    return right !== null ? right : dataMaxTheta;
  }, [right, dataMaxTheta]);

  const isZoomedIn = left !== null && right !== null;

  const zoom = () => {
    let zoomLeft = refAreaLeft;
    let zoomRight = refAreaRight;

    if (zoomLeft === zoomRight || zoomRight === null || zoomLeft === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    if (Number(zoomLeft) > Number(zoomRight)) {
      [zoomLeft, zoomRight] = [zoomRight, zoomLeft];
    }

    setRefAreaLeft(null);
    setRefAreaRight(null);
    setLeft(Number(Number(zoomLeft).toFixed(2)));
    setRight(Number(Number(zoomRight).toFixed(2)));
  };

  const zoomOut = () => {
    setLeft(null);
    setRight(null);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const panLeft = () => {
    const range = currentRight - currentLeft;
    const shift = range * 0.15; // Shift by 15% of current range
    const newLeft = Math.max(0, currentLeft - shift);
    const newRight = newLeft + range;
    setLeft(Number(newLeft.toFixed(2)));
    setRight(Number(newRight.toFixed(2)));
  };

  const panRight = () => {
    const range = currentRight - currentLeft;
    const shift = range * 0.15; // Shift by 15% of current range
    const newRight = Math.min(180, currentRight + shift); // Max 2-theta is 180°
    const newLeft = newRight - range;
    setLeft(Number(newLeft.toFixed(2)));
    setRight(Number(newRight.toFixed(2)));
  };

  const zoomInStep = () => {
    const range = currentRight - currentLeft;
    if (range <= 1.0) return; // limit minimum range to 1 degree
    const shift = range * 0.15; // Zoom in 15% from each side
    setLeft(Number((currentLeft + shift).toFixed(2)));
    setRight(Number((currentRight - shift).toFixed(2)));
  };

  const zoomOutStep = () => {
    const range = currentRight - currentLeft;
    const shift = range * 0.15;
    const newLeft = Math.max(0, currentLeft - shift);
    const newRight = Math.min(180, currentRight + shift);
    
    // If we've reached or expanded beyond default, reset to null
    if (newLeft <= dataMinTheta && newRight >= dataMaxTheta) {
      zoomOut();
    } else {
      setLeft(Number(newLeft.toFixed(2)));
      setRight(Number(newRight.toFixed(2)));
    }
  };

  // Zoom to a specific peak or peak cluster
  const zoomToPrimaryPeak = () => {
    if (results.length === 0) return;
    const sorted = [...results].sort((a, b) => (b.intensity ?? 100) - (a.intensity ?? 100));
    const primary = sorted[0];
    setLeft(Number(Math.max(0, primary.twoTheta - 4).toFixed(2)));
    setRight(Number(Math.min(180, primary.twoTheta + 4).toFixed(2)));
  };

  const zoomToWeakPeaks = () => {
    if (results.length === 0) return;
    // Weaker peaks typically have lower intensity (e.g. < 45%)
    const weakPeaks = results.filter(r => (r.intensity ?? 100) < 45);
    if (weakPeaks.length === 0) {
      // Fallback to highest 2θ angle peaks which are usually weaker
      const highestTheta = Math.max(...results.map(r => r.twoTheta));
      setLeft(Number(Math.max(0, highestTheta - 6).toFixed(2)));
      setRight(Number(Math.min(180, highestTheta + 6).toFixed(2)));
    } else {
      // Find the weak peak closest to other weak peaks, or just take the first weak peak
      const target = weakPeaks[0];
      setLeft(Number(Math.max(0, target.twoTheta - 5).toFixed(2)));
      setRight(Number(Math.min(180, target.twoTheta + 5).toFixed(2)));
    }
  };

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
    let peakData = results.map((r, originalIdx) => ({
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
      originalIdx,
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

  const currentHoverPoint = useMemo(() => {
    if (hoveredTwoThetaVal === null || chartData.points.length === 0) return null;
    const closest = chartData.points.reduce((prev, curr) => {
      return Math.abs(curr.twoTheta - hoveredTwoThetaVal) < Math.abs(prev.twoTheta - hoveredTwoThetaVal) ? curr : prev;
    }, chartData.points[0]);
    return closest;
  }, [hoveredTwoThetaVal, chartData.points]);

  const hoverCrystallographyMetrics = useMemo(() => {
    if (hoveredTwoThetaVal === null) return null;
    const thetaRad = (hoveredTwoThetaVal / 2) * (Math.PI / 180);
    const d = activeWavelengthVal / (2 * Math.sin(thetaRad));
    const q = (4 * Math.PI * Math.sin(thetaRad)) / activeWavelengthVal;
    return {
      d: isFinite(d) && d > 0 ? d : null,
      q: isFinite(q) ? q : null,
      energyKeV: 12.3984 / activeWavelengthVal,
    };
  }, [hoveredTwoThetaVal, activeWavelengthVal]);

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
      className={`bg-[#060B15] p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col relative overflow-y-auto group/chart transition-all duration-700 ${
        isFullScreen 
          ? 'fixed inset-4 z-[9999] h-[calc(100vh-32px)] text-lg' 
          : 'min-h-[920px] h-auto w-full'
      }`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] group-hover/chart:bg-indigo-600/15 transition-all duration-1000 animate-pulse" />
      <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-80 h-80 bg-cyan-600/5 rounded-full blur-[80px] transition-all duration-1000" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.02),transparent_50%)] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-5">
          <div className="relative group/icon">
            <div className="absolute inset-0 bg-indigo-500/40 blur-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500" />
            <div className="relative p-3.5 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 rounded-2xl border border-indigo-500/30 shadow-inner">
              <Activity className="w-6 h-6 text-indigo-400 group-hover/icon:scale-110 transition-transform duration-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">{t('Spectral Visualizer', 'Spectral Visualizer')}</h3>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-xl font-mono text-[9px] font-bold text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>{activeWavelengthVal.toFixed(5)} Å ({activeWavelengthVal === 0.154059 ? 'Cu Kα' : activeWavelengthVal === 0.178901 ? 'Co Kα' : activeWavelengthVal === 0.193604 ? 'Fe Kα' : activeWavelengthVal === 0.228970 ? 'Cr Kα' : activeWavelengthVal === 0.070930 ? 'Mo Kα' : 'Custom'})</span>
              </div>
            </div>
            <div className="flex gap-3 items-center">
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
            <button 
              onClick={() => setShowRefPeaks(!showRefPeaks)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                showRefPeaks 
                  ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/30' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={t('Toggle Reference Peaks overlay', 'Toggle Reference Peaks overlay')}
            >
              <Layers className="w-3 h-3" />
              {t('Reference', 'Reference')}
            </button>
            {showRefPeaks && (
              <select
                value={refMaterial}
                onChange={(e) => setRefMaterial(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-2 py-1 text-[9px] font-black text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[120px] transition-all cursor-pointer uppercase tracking-wider font-mono"
              >
                <option value="Silicon">Si (Silicon)</option>
                <option value="Gold">Au (Gold)</option>
                <option value="NaCl">Halite (NaCl)</option>
                <option value="Pyrite">FeS2 (Pyrite)</option>
                <option value="Quartz">SiO2 (Quartz)</option>
                <option value="Aluminum">Al (Aluminum)</option>
                <option value="Copper">Cu (Copper)</option>
                <option value="Platinum">Pt (Platinum)</option>
                <option value="Diamond">C (Diamond)</option>
              </select>
            )}
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
        </div>
      </div>

      {/* Real-time Laboratory Digital Monitor */}
      <div className="relative z-10 mb-6 bg-slate-950/80 border border-white/5 rounded-2xl p-4 shadow-lg grid grid-cols-2 sm:grid-cols-5 gap-4">
        {/* Angle 2-Theta Monitor */}
        <div className="bg-[#020617]/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[64px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Angle (2θ)</span>
          <span className="text-lg font-black text-indigo-400 font-mono tracking-tighter">
            {hoveredTwoThetaVal !== null ? `${hoveredTwoThetaVal.toFixed(3)}°` : '---'}
          </span>
        </div>
        {/* d-Spacing Monitor */}
        <div className="bg-[#020617]/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[64px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Interplanar (d)</span>
          <span className="text-lg font-black text-emerald-400 font-mono tracking-tighter">
            {hoverCrystallographyMetrics?.d ? `${hoverCrystallographyMetrics.d.toFixed(4)} Å` : '---'}
          </span>
        </div>
        {/* Scattering Vector Q Monitor */}
        <div className="bg-[#020617]/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[64px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Wavevector (Q)</span>
          <span className="text-lg font-black text-sky-400 font-mono tracking-tighter">
            {hoverCrystallographyMetrics?.q ? `${hoverCrystallographyMetrics.q.toFixed(4)} Å⁻¹` : '---'}
          </span>
        </div>
        {/* Simulated Intensity Monitor */}
        <div className="bg-[#020617]/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[64px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Intensity (I)</span>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-lg font-black text-amber-400 font-mono tracking-tighter leading-none">
              {currentHoverPoint ? `${currentHoverPoint.intensity.toFixed(1)}%` : '---'}
            </span>
            {currentHoverPoint && (
              <div className="hidden xs:block w-12 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-amber-400 h-full rounded-full transition-all duration-150" style={{ width: `${Math.min(100, currentHoverPoint.intensity)}%` }} />
              </div>
            )}
          </div>
        </div>
        {/* Target Anode Physics Energy */}
        <div className="bg-[#020617]/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[64px] col-span-2 sm:col-span-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Anode Energy</span>
          <span className="text-sm font-bold text-slate-300 font-mono tracking-tighter block mt-1">
            {(12.3984 / activeWavelengthVal).toFixed(2)} keV
          </span>
          <span className="text-[8px] font-black text-indigo-500 font-mono uppercase tracking-widest leading-none">
            {activeWavelengthVal === 0.154059 ? 'Copper (Cu)' : activeWavelengthVal === 0.070930 ? 'Moly (Mo)' : 'Synchrotron'}
          </span>
        </div>
      </div>

      <div className={`w-full min-w-0 relative z-10 select-none bg-[#020617]/40 rounded-3xl border border-white/5 p-4 shadow-inner ${isFullScreen ? 'h-[500px]' : 'h-[400px]'}`}>
        {/* Floating Zoom & Pan Control Center */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-[#0b1329]/90 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg shadow-black/50">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 border-r border-white/10 select-none">
            Zoom & Pan
          </span>

          <button 
            onClick={zoomInStep} 
            className="p-1.5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 rounded-lg transition-all" 
            title={t('Zoom In', 'Zoom In')}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          
          <button 
            onClick={zoomOutStep} 
            className="p-1.5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 rounded-lg transition-all" 
            title={t('Zoom Out', 'Zoom Out')}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/10" />

          <button 
            onClick={panLeft} 
            className={`p-1.5 rounded-lg transition-all ${
              isZoomedIn 
                ? 'hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300' 
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`} 
            disabled={!isZoomedIn}
            title={t('Pan Left', 'Pan Left')}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={panRight} 
            className={`p-1.5 rounded-lg transition-all ${
              isZoomedIn 
                ? 'hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300' 
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`} 
            disabled={!isZoomedIn}
            title={t('Pan Right', 'Pan Right')}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/10" />

          {/* Preset Buttons */}
          <button 
            onClick={zoomToPrimaryPeak} 
            className="px-2.5 py-1 hover:bg-amber-500/15 text-amber-500/80 hover:text-amber-400 rounded-md text-[8px] font-black uppercase tracking-wider transition-all border border-amber-500/20 shadow-sm"
            title={t('Focus on highest intensity peak', 'Focus on highest intensity peak')}
          >
            {t('Primary Peak', 'Primary Peak')}
          </button>

          <button 
            onClick={zoomToWeakPeaks} 
            className="px-2.5 py-1 hover:bg-emerald-500/15 text-emerald-500/80 hover:text-emerald-400 rounded-md text-[8px] font-black uppercase tracking-wider transition-all border border-emerald-500/20 shadow-sm"
            title={t('Inspect weak peaks at lower intensity', 'Inspect weak peaks at lower intensity')}
          >
            {t('Weak Peaks', 'Weak Peaks')}
          </button>

          {isZoomedIn && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <button 
                onClick={zoomOut} 
                className="p-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-all" 
                title={t('Reset Zoom', 'Reset Zoom')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Current Domain Indicator */}
          {isZoomedIn && (
            <span className="text-[8px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded ml-1 select-none">
              {currentLeft.toFixed(1)}° - {currentRight.toFixed(1)}°
            </span>
          )}
        </div>

        {/* Floating Interactive Peak Legend */}
        {chartData.peakData.length > 0 && (
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5 max-w-[60%] sm:max-w-[45%] lg:max-w-[35%] pointer-events-auto">
            <div className="flex items-center gap-1.5 bg-[#0b1329]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg shadow-black/50">
              <Tag className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider select-none">
                {t('Reflections Legend', 'Reflections Legend')}
              </span>
              <span className="text-[8px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md font-mono font-bold border border-indigo-500/10">
                {chartData.peakData.length} {t('Peaks', 'Peaks')}
              </span>
            </div>

            {/* Scrollable list of peak badges */}
            <div className="flex flex-wrap gap-1 justify-end max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
              {chartData.peakData.map((peak, idx) => {
                const isHovered = hoveredPeakTheta === peak.twoTheta;
                const markerColor = peak.isMatch 
                  ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15 text-amber-300" 
                  : "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-300";
                
                return (
                  <div
                    key={`legend-peak-${idx}`}
                    className="relative group"
                    onMouseEnter={() => {
                      setHoveredPeakTheta(peak.twoTheta);
                      setHoveredPeakData(peak);
                    }}
                    onMouseLeave={() => {
                      setHoveredPeakTheta(null);
                      setHoveredPeakData(null);
                    }}
                  >
                    <button
                      onClick={() => {
                        // Focus/Zoom into this peak
                        setLeft(Number(Math.max(0, peak.twoTheta - 4).toFixed(2)));
                        setRight(Number(Math.min(180, peak.twoTheta + 4).toFixed(2)));
                      }}
                      className={`px-2 py-1 rounded-lg border text-[9px] font-mono font-bold transition-all duration-300 flex items-center gap-1 shadow-sm ${
                        isHovered 
                          ? 'border-indigo-500 bg-indigo-500/20 text-white scale-105 shadow-md shadow-indigo-500/10 z-30' 
                          : markerColor
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${peak.isMatch ? 'bg-amber-400' : 'bg-emerald-400'} ${isHovered ? 'animate-ping' : ''}`} />
                      <span>
                        {peak.hkl ? `(${peak.hkl})` : `${peak.twoTheta.toFixed(2)}°`}
                      </span>
                    </button>

                    {/* Interactive legend tooltip popover/card displayed on hover */}
                    {isHovered && (
                      <div className="absolute right-0 top-full mt-2 z-[999] bg-[#0c1326]/95 backdrop-blur-xl text-white p-4 rounded-xl shadow-2xl border border-white/10 w-[240px] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {peak.isMatch ? t('Database Confirmed', 'Database Confirmed') : t('Detected Reflection', 'Detected Reflection')}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${peak.isMatch ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        </div>

                        <div className="space-y-2.5 font-mono text-[11px]">
                          {peak.hkl && (
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-slate-400 text-[9px] uppercase tracking-wider">Miller Indices</span>
                              <span className="font-extrabold text-indigo-400">({peak.hkl})</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center py-1 border-b border-white/5">
                            <span className="text-slate-400 text-[9px] uppercase tracking-wider">Angle (2θ)</span>
                            <span className="font-bold text-white">{peak.twoTheta.toFixed(3)}°</span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-white/5">
                            <span className="text-slate-400 text-[9px] uppercase tracking-wider">d-spacing (d)</span>
                            <span className="font-bold text-emerald-400">{peak.dSpacing?.toFixed(precision)} Å</span>
                          </div>

                          <div className="flex justify-between items-center py-1 border-b border-white/5">
                            <span className="text-slate-400 text-[9px] uppercase tracking-wider">Relative Intensity</span>
                            <span className="font-bold text-amber-400">{peak.intensity.toFixed(1)}%</span>
                          </div>

                          {peak.q !== undefined && (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-400 text-[9px] uppercase tracking-wider">Q-vector (Q)</span>
                              <span className="font-bold text-sky-400">{peak.q.toFixed(precision)} Å⁻¹</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 text-[8px] text-slate-500 text-right leading-none select-none italic font-sans">
                          {t('Click to Zoom onto Peak', 'Click to Zoom onto Peak')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Graph Scientific Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            margin={{ top: 30, right: 30, bottom: 20, left: -25 }}
            onMouseDown={(e: any) => e && !draggedPeakIndex && setRefAreaLeft(e.activeLabel)}
            onMouseMove={(e: any) => {
              if (draggedPeakIndex !== null && e && e.activeLabel) {
                updatePeakTwoTheta(draggedPeakIndex, Number(e.activeLabel));
              } else {
                if (refAreaLeft && e) setRefAreaRight(e.activeLabel);
                if (e && e.activeLabel) {
                  setHoveredTwoThetaVal(Number(e.activeLabel));
                } else {
                  setHoveredTwoThetaVal(null);
                }
              }
            }}
            onMouseUp={() => {
              if (draggedPeakIndex !== null) {
                setDraggedPeakIndex(null);
              } else {
                zoom();
              }
            }}
            onMouseLeave={() => {
              setRefAreaLeft(null);
              setRefAreaRight(null);
              setHoveredTwoThetaVal(null);
              setDraggedPeakIndex(null);
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
              domain={[left !== null ? left : 'dataMin - 10', right !== null ? right : 'dataMax + 10']} 
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
                
                let l = left !== null ? left : dataMinTheta;
                let r = right !== null ? right : dataMaxTheta;
                if (payload.twoTheta < l || payload.twoTheta > r) return null;
                
                const yOffset = cy - 20 - (payload.labelLevel * 16);
                const isMatch = payload.isMatch;
                const markerColor = isMatch ? "#f59e0b" : "#10b981";
                const isThisDragged = draggedPeakIndex === payload.originalIdx;
                
                return (
                  <g className="transition-all duration-300">
                    {/* Active Drag Helper Line */}
                    <line 
                      x1={cx} 
                      y1={cy} 
                      x2={cx} 
                      y2={cy + 400} 
                      stroke={isThisDragged ? "#3b82f6" : markerColor} 
                      strokeWidth={isThisDragged ? 3 : 1.5} 
                      strokeDasharray={isThisDragged ? "0" : "4 4"} 
                      opacity={isThisDragged ? 0.9 : 0.3} 
                      className="cursor-ew-resize hover:stroke-indigo-400 transition-all duration-150"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDraggedPeakIndex(payload.originalIdx);
                      }}
                    />
                    
                    {/* Circle handle */}
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={isThisDragged ? 8 : 6} 
                      fill={isThisDragged ? "#3b82f6" : markerColor} 
                      filter="url(#glowShadow)" 
                      stroke="white" 
                      strokeWidth={2} 
                      className="cursor-ew-resize hover:scale-125 transition-all duration-150"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDraggedPeakIndex(payload.originalIdx);
                      }}
                    />
                    
                    {showHKL && payload.hkl && (
                      <g>
                        <text 
                          x={cx} 
                          y={yOffset} 
                          textAnchor="middle" 
                          fill={isThisDragged ? "#3b82f6" : markerColor} 
                          fontSize="10" 
                          fontWeight="black"
                          className="font-mono tracking-tighter drop-shadow-2xl select-none pointer-events-none"
                        >
                          {payload.hkl}
                        </text>
                      </g>
                    )}
                  </g>
                )
              }}
            />

            {/* Live Dragging Guide Line */}
            {draggedPeakIndex !== null && results[draggedPeakIndex] && (
              <ReferenceLine 
                x={results[draggedPeakIndex].twoTheta} 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="3 3"
                className="animate-pulse"
                label={{ 
                  value: `Fine Tuning: ${results[draggedPeakIndex].twoTheta.toFixed(3)}°`, 
                  position: 'top', 
                  fill: '#3b82f6', 
                  fontSize: 10, 
                  fontWeight: 'black',
                  fontFamily: 'monospace'
                }}
              />
            )}

            {/* Hovered Peak Legend Highlight Marker */}
            {hoveredPeakTheta !== null && hoveredPeakData && (
              <>
                <ReferenceLine 
                  x={hoveredPeakTheta} 
                  stroke={hoveredPeakData.isMatch ? "#f59e0b" : "#10b981"} 
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  opacity={0.8}
                />
                <ReferenceArea
                  x1={hoveredPeakTheta - 0.25}
                  x2={hoveredPeakTheta + 0.25}
                  y1={0}
                  y2={125}
                  fill={hoveredPeakData.isMatch ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.08)"}
                />
              </>
            )}

            {/* Reference Peaks Overlay Lines */}
            {showRefPeaks && parsedRefPeaks.map((peak, idx) => {
              const xMin = left !== null ? left : 10;
              const xMax = right !== null ? right : 100;
              if (peak.theta >= xMin && peak.theta <= xMax) {
                return (
                  <ReferenceLine 
                    key={`chart-ref-peak-${idx}`} 
                    x={peak.theta} 
                    stroke="rgba(6, 182, 212, 0.6)" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                  >
                     <Label 
                       value={`${peak.label} (${peak.theta.toFixed(2)}°)`} 
                       position="insideTopLeft" 
                       fill="#06b6d4" 
                       fontSize={9} 
                       fontWeight="700" 
                       offset={12} 
                     />
                  </ReferenceLine>
                );
              }
              return null;
            })}

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

      {/* Crystallographic Phase Metrology Table */}
      {results.length > 0 && (
        <div className="relative z-10 mt-6 bg-slate-950/40 border border-white/5 rounded-3xl p-6 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest">
                {t('Reflections Metrology Workbench', 'Reflections Metrology Workbench')}
              </h4>
              <span className="text-[8px] px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20 font-mono font-bold text-indigo-400">
                {results.length} Reflections Identified
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              {t('Click Row to Snap Center • Hover Row to Highlight', 'Click Row to Snap Center • Hover Row to Highlight')}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="py-2.5 px-3">{t('Index', 'Index')}</th>
                  <th className="py-2.5 px-3">{t('Angle (2θ)', 'Angle (2θ)')}</th>
                  <th className="py-2.5 px-3">{t('Miller (hkl)', 'Miller (hkl)')}</th>
                  <th className="py-2.5 px-3">{t('d-spacing (Å)', 'd-spacing (Å)')}</th>
                  <th className="py-2.5 px-3">{t('Wavevector Q (Å⁻¹)', 'Wavevector Q (Å⁻¹)')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Rel. Intensity', 'Rel. Intensity')}</th>
                  <th className="py-2.5 px-3 text-center">{t('Fine Tuning', 'Fine Tuning')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Phase Alignment', 'Phase Alignment')}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((peak, idx) => {
                  const isHovered = hoveredPeakTheta === peak.twoTheta;
                  const isMatch = chartData.peakData.find(pd => Math.abs(pd.twoTheta - peak.twoTheta) < 0.05)?.isMatch;
                  
                  return (
                    <tr 
                      key={`table-peak-row-${idx}`}
                      onClick={() => {
                        setLeft(Number(Math.max(0, peak.twoTheta - 4).toFixed(2)));
                        setRight(Number(Math.min(180, peak.twoTheta + 4).toFixed(2)));
                      }}
                      onMouseEnter={() => {
                        setHoveredPeakTheta(peak.twoTheta);
                        setHoveredPeakData({
                          ...peak,
                          isMatch,
                          labelLevel: 0
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredPeakTheta(null);
                        setHoveredPeakData(null);
                      }}
                      className={`border-b border-white/5 cursor-pointer transition-all duration-150 ${
                        isHovered 
                          ? 'bg-indigo-500/15 text-white border-indigo-500/30' 
                          : 'hover:bg-slate-900/40 text-slate-300 hover:text-white'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-extrabold text-indigo-400">{peak.twoTheta.toFixed(3)}°</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                          peak.hkl 
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' 
                            : 'bg-slate-800/50 text-slate-500'
                        }`}>
                          {peak.hkl ? `(${peak.hkl})` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{peak.dSpacing.toFixed(4)} Å</td>
                      <td className="py-3 px-3 font-mono text-sky-400">{(4 * Math.PI * Math.sin((peak.twoTheta / 2) * (Math.PI / 180)) / activeWavelengthVal).toFixed(4)}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono font-bold text-amber-400">{(peak.intensity ?? 100).toFixed(1)}%</span>
                          <div className="w-12 bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${peak.intensity ?? 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            title={t('Decrease Angle by 0.05°', 'Decrease Angle by 0.05°')}
                            onClick={() => updatePeakTwoTheta(idx, peak.twoTheta - 0.05)}
                            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded transition-colors"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="180"
                            value={isNaN(Number(peak.twoTheta.toFixed(3))) ? '' : Number(peak.twoTheta.toFixed(3))}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                updatePeakTwoTheta(idx, val);
                              }
                            }}
                            className="w-16 text-center bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 font-mono text-[10px] text-white focus:outline-none focus:border-indigo-500"
                          />

                          <button
                            type="button"
                            title={t('Increase Angle by 0.05°', 'Increase Angle by 0.05°')}
                            onClick={() => updatePeakTwoTheta(idx, peak.twoTheta + 0.05)}
                            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded transition-colors"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isMatch 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          <span className="w-1 h-1 rounded-full bg-current animate-ping" />
                          {isMatch ? t('Match Verified', 'Match Verified') : t('Phase Peak', 'Phase Peak')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer calibration details */}
      <div className="relative z-10 mt-6 pt-4 border-t border-white/5 flex items-center justify-between opacity-50 text-xs">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Metrology Engine v4.2 • Precision {precision} Å</span>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-sans">Calibration Standard</span>
             <span className="text-[10px] font-black text-white font-mono uppercase tracking-widest">NIST-XRD-992</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <Terminal className="w-4 h-4 text-indigo-500" />
        </div>
      </div>
    </div>
  );
};
