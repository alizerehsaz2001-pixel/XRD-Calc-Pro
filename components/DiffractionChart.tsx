
import React, { useMemo, useState, useRef, useEffect } from 'react';
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
import { 
  Activity, 
  Terminal, 
  RotateCcw, 
  Tag, 
  Camera, 
  ArrowLeft, 
  ArrowRight, 
  ZoomIn, 
  ZoomOut, 
  MinusCircle, 
  Maximize, 
  Minimize, 
  Layers,
  SlidersHorizontal,
  FileDown,
  Sparkles,
  Flame,
  Binary,
  Check,
  TrendingDown,
  Gauge,
  BarChart3,
  Microscope
} from 'lucide-react';
import { BraggResult } from '../types';
import { useSettings, convertLength } from './SettingsContext';
import { getActiveMaterials } from '../utils/materialsHelper';
import { calculateBragg } from '../utils/physics';
import { 
  synthesizeCalculatedProfile, 
  DEFAULT_PROFILE_PARAMS, 
  ProfileCalculationParams, 
  exportDiffractogramXY, 
  XAxisUnit, 
  identifyAnode 
} from '../utils/calculatedProfileEngine';
import { ProfileTuningPanel } from './ProfileTuningPanel';
import { ReflectionInspector } from './ReflectionInspector';

interface DiffractionChartProps {
  results: BraggResult[];
  materialName?: string | null;
  wavelength?: number;
  onResultsChange?: (newResults: BraggResult[]) => void;
}

const SUBPEAK_PALETTE = [
  '#38bdf8', // sky
  '#a855f7', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
  '#8b5cf6', // violet
];

export const DiffractionChart: React.FC<DiffractionChartProps> = ({ results, materialName, wavelength, onResultsChange }) => {
  const { t } = useTranslation();
  const { precision, lengthUnit = 'Å' } = useSettings();
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

  // Calculated Diffraction Profile Synthesis Parameters
  const [profileParams, setProfileParams] = useState<ProfileCalculationParams>(() => ({
    ...DEFAULT_PROFILE_PARAMS,
    wavelength: wavelength || 1.54059,
  }));
  const [showTuningPanel, setShowTuningPanel] = useState(false);
  const [xAxisUnit, setXAxisUnit] = useState<XAxisUnit>('twoTheta');
  const [showSubPeaks, setShowSubPeaks] = useState(false);
  const [showBraggTicks, setShowBraggTicks] = useState(true);
  const [showResidual, setShowResidual] = useState(false);
  const [selectedPeakIndex, setSelectedPeakIndex] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (wavelength) {
      setProfileParams(prev => ({ ...prev, wavelength }));
    }
  }, [wavelength]);

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

  const currentDomain = useMemo(() => {
    if (xAxisUnit === 'twoTheta') {
      const l = left !== null ? left : Math.max(0, dataMinTheta - 5);
      const r = right !== null ? right : dataMaxTheta + 5;
      return [l, r];
    } else if (xAxisUnit === 'q') {
      const l = left !== null ? left : dataMinTheta;
      const r = right !== null ? right : dataMaxTheta;
      const qMin = (4 * Math.PI * Math.sin((Math.max(0.5, l) / 2) * Math.PI / 180)) / activeWavelengthVal;
      const qMax = (4 * Math.PI * Math.sin((Math.min(179, r) / 2) * Math.PI / 180)) / activeWavelengthVal;
      return [Number(qMin.toFixed(3)), Number(qMax.toFixed(3))];
    } else {
      const l = left !== null ? left : dataMinTheta;
      const r = right !== null ? right : dataMaxTheta;
      const dMax = activeWavelengthVal / (2 * Math.sin((Math.max(0.5, l) / 2) * Math.PI / 180));
      const dMin = activeWavelengthVal / (2 * Math.sin((Math.min(179, r) / 2) * Math.PI / 180));
      return [Number(convertLength(dMin, lengthUnit).toFixed(3)), Number(convertLength(dMax, lengthUnit).toFixed(3))];
    }
  }, [xAxisUnit, left, right, dataMinTheta, dataMaxTheta, activeWavelengthVal, lengthUnit]);

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

  const downloadDiffractogram = (format: 'xy' | 'csv') => {
    if (chartData.points.length === 0) return;
    const content = exportDiffractogramXY(
      chartData.points, 
      format, 
      activeWavelengthVal, 
      materialName || 'phase_pattern'
    );
    const mime = format === 'csv' ? 'text/csv' : 'text/plain';
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(materialName || 'calculated_diffraction_profile').toLowerCase().replace(/\s+/g, '_')}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const chartData = useMemo(() => {
    if (results.length === 0) {
      return { 
        points: [], 
        peakData: [], 
        tickData: [],
        metrics: {
          maxIntensity: 0,
          integratedTotalArea: 0,
          averageFwhm: 0,
          peakToBackgroundRatio: 0,
          numReflections: 0
        }
      };
    }

    // 1. Prepare theoretical comparison peaks if active
    let theoreticalPeaks: { twoTheta: number; intensity: number; hkl?: string }[] | undefined;
    if (materialName) {
      const activeMaterials = getActiveMaterials();
      const material = activeMaterials.find(m => m.name === materialName);
      if (material && material.pattern) {
        const lines = material.pattern.split('\n');
        theoreticalPeaks = lines.map(line => {
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
      }
    }

    // 2. Synthesize continuous profile using scientific engine
    const profileParamsWithActiveWavelength: ProfileCalculationParams = {
      ...profileParams,
      wavelength: activeWavelengthVal,
      showSubPeaks,
      showBraggTicks,
    };

    const synthesis = synthesizeCalculatedProfile(
      results,
      profileParamsWithActiveWavelength,
      theoreticalPeaks
    );

    let processedPoints = synthesis.points.map(pt => {
      // Map sub-peaks to individual properties so Recharts can access them via dataKey
      const extendedPt: any = { ...pt };
      if (pt.subPeaks) {
        Object.entries(pt.subPeaks).forEach(([idx, val]) => {
          extendedPt[`subPeak_${idx}`] = val;
        });
      }
      if (pt.subPeaksDisplay) {
        Object.entries(pt.subPeaksDisplay).forEach(([idx, val]) => {
          extendedPt[`subPeakDisplay_${idx}`] = val;
        });
      }
      return extendedPt;
    });

    // 3. Baseline subtraction (rolling-ball morphological filter)
    if (subtractBaseline) {
      const windowSize = 25;
      const mins = processedPoints.map((point, i) => {
        let min = point.intensity;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(processedPoints.length - 1, i + windowSize); j++) {
          if (processedPoints[j].intensity < min) min = processedPoints[j].intensity;
        }
        return min;
      });

      const background = mins.map((minVal, i) => {
        let max = minVal;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(mins.length - 1, i + windowSize); j++) {
          if (mins[j] > max) max = mins[j];
        }
        return max;
      });

      processedPoints = processedPoints.map((point, i) => ({
        ...point,
        intensity: Math.max(0, point.intensity - background[i]),
        intensityDisplay: Math.max(0, (point.intensityDisplay || point.intensity) - background[i])
      }));
    }

    // 4. Moving-average smoothing
    if (smoothChart) {
      const windowSize = 5;
      processedPoints = processedPoints.map((point, i) => {
        let sum = 0;
        let sumDisp = 0;
        let count = 0;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(processedPoints.length - 1, i + windowSize); j++) {
          sum += processedPoints[j].intensity;
          sumDisp += (processedPoints[j].intensityDisplay !== undefined ? processedPoints[j].intensityDisplay : processedPoints[j].intensity);
          count++;
        }
        return {
          ...point,
          intensity: Number((sum / count).toFixed(2)),
          intensityDisplay: Number((sumDisp / count).toFixed(2)),
        };
      });
    }

    // 5. Build enriched peak markers for tooltips and legend
    let peakData = results.map((r, originalIdx) => {
      const meta = synthesis.peakMetadata.find(m => m.index === originalIdx);
      return {
        twoTheta: r.twoTheta,
        intensity: r.intensity !== undefined ? r.intensity : 100,
        isPeak: true,
        hkl: r.hkl,
        dSpacing: r.dSpacing,
        q: r.qVector,
        fwhm: meta?.fwhm || 0.18,
        integralBreadth: meta?.integralBreadth || 0.20,
        integratedArea: meta?.integratedArea || 20,
        scherrerSizeNm: meta?.scherrerSizeNm || 45,
        kaSplitDeg: meta?.kaSplitDeg,
        ka2Theta: meta?.ka2Theta,
        isLabelVisible: false,
        labelLevel: 0,
        isMatch: false,
        theoreticalHkl: '',
        originalIdx,
      };
    }).sort((a, b) => a.twoTheta - b.twoTheta);

    // Theoretical match check
    if (theoreticalPeaks && theoreticalPeaks.length > 0) {
      const matchTolerance = 0.5;
      peakData.forEach(p => {
        const match = theoreticalPeaks!.find(tp => Math.abs(tp.twoTheta - p.twoTheta) <= matchTolerance);
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
    }

    // Compute label staggering
    const minThetaDiffForOverlap = 2.5;
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
      peakData[i].labelLevel = level % 6;
    }

    const sortedPeaks = [...peakData].sort((a, b) => b.intensity - a.intensity);
    const topPeakThetas = new Set(sortedPeaks.slice(0, 5).map(p => p.twoTheta));

    peakData = peakData.map(p => ({
      ...p,
      isLabelVisible: topPeakThetas.has(p.twoTheta)
    }));

    // Stick / tick markers at the baseline for each reflection
    const tickData = peakData.map(p => ({
      twoTheta: p.twoTheta,
      q: p.q,
      dSpacing: p.dSpacing,
      intensity: 6, // small tick height near baseline
      hkl: p.hkl,
      isMatch: p.isMatch,
    }));

    return { 
      points: processedPoints, 
      peakData, 
      tickData,
      metrics: synthesis.globalMetrics,
      agreementMetrics: synthesis.agreementMetrics
    };
  }, [results, materialName, activeWavelengthVal, profileParams, showSubPeaks, showBraggTicks, smoothChart, subtractBaseline]);

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
        <div className="bg-slate-950/95 backdrop-blur-xl text-white p-5 rounded-2xl shadow-2xl border border-slate-800 min-w-[240px] shadow-black/80">
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
             <div className={`w-2 h-2 rounded-full ${d.isMatch ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
               {d.isMatch ? 'DB Match Verified' : 'Calculated Profile'}
             </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Angle (2θ)</p>
                <p className="text-xl font-black text-white font-mono tracking-tighter">{d.twoTheta.toFixed(Math.min(precision, 3))}°</p>
              </div>
              {d.intensity !== undefined && (
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Intensity</p>
                  <p className="text-xl font-black text-amber-400 font-mono tracking-tighter">{d.intensity.toFixed(1)}%</p>
                </div>
              )}
            </div>

            {d.isPeak && (
              <>
                {d.hkl && (
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Index (Miller)</span>
                    <span className="text-xs font-black text-indigo-400 font-mono tracking-widest">({d.hkl})</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                     <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">d-spacing</p>
                     <p className="text-[11px] font-bold text-emerald-400 font-mono">{d.dSpacing ? `${convertLength(d.dSpacing, lengthUnit).toFixed(precision)} ${lengthUnit}` : '---'}</p>
                   </div>
                   <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                     <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Q-vector</p>
                     <p className="text-[11px] font-bold text-sky-400 font-mono">{d.q ? d.q.toFixed(precision) : '---'} Å⁻¹</p>
                   </div>
                </div>

                {d.fwhm && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">FWHM (Γ)</p>
                      <p className="text-[11px] font-bold text-violet-400 font-mono">{d.fwhm.toFixed(3)}°</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Peak Area</p>
                      <p className="text-[11px] font-bold text-amber-300 font-mono">{(d.integratedArea || 0).toFixed(1)}</p>
                    </div>
                  </div>
                )}
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
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative group/icon">
            <div className="absolute inset-0 bg-indigo-500/40 blur-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500" />
            <div className="relative p-3.5 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 rounded-2xl border border-indigo-500/30 shadow-inner">
              <Activity className="w-6 h-6 text-indigo-400 group-hover/icon:scale-110 transition-transform duration-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase leading-none">{t('Spectral Visualizer', 'Spectral Visualizer')}</h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-xl font-mono text-[9px] font-bold text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>{activeWavelengthVal.toFixed(5)} Å • {identifyAnode(activeWavelengthVal).anode} Kα</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400">
                {profileParams.profileShape === 'pseudo_voigt' ? `Pseudo-Voigt (η=${Math.round(profileParams.eta * 100)}%)` : profileParams.profileShape.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5 items-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Calculated Diffraction Profile</p>
              <span className="text-[8px] font-mono font-bold text-slate-600">•</span>
              <div className="flex gap-1 items-center">
                <span className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                <span className="px-1.5 py-0.5 bg-indigo-500/10 rounded font-mono text-[8px] font-black text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">{t('Drag to Zoom', 'Drag to Zoom')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Coordinate System Selector */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 shadow-inner">
            <button
              onClick={() => setXAxisUnit('twoTheta')}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                xAxisUnit === 'twoTheta'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Diffraction Angle 2θ in degrees"
            >
              2θ (°)
            </button>
            <button
              onClick={() => setXAxisUnit('q')}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                xAxisUnit === 'q'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Scattering Vector Q = 4π·sin(θ)/λ in inverse Angstroms"
            >
              Q (Å⁻¹)
            </button>
            <button
              onClick={() => setXAxisUnit('dSpacing')}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                xAxisUnit === 'dSpacing'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={`Interplanar Spacing d in ${lengthUnit}`}
            >
              d ({lengthUnit})
            </button>
          </div>

          {/* Profile Optics Tuning Button */}
          <button
            onClick={() => setShowTuningPanel(!showTuningPanel)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${
              showTuningPanel
                ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_16px_rgba(99,102,241,0.5)]'
                : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-900 border-white/5'
            }`}
            title="Configure profile shape, FWHM, Caglioti parameters, and background"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('Optics & Profile', 'Optics & Profile')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>

          <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            {/* Sub-Peaks Deconvolution */}
            <button 
              onClick={() => setShowSubPeaks(!showSubPeaks)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                showSubPeaks 
                  ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Show individual deconvolved peak profiles"
            >
              <Sparkles className="w-3 h-3" />
              <span>{t('Sub-Peaks', 'Sub-Peaks')}</span>
            </button>

            {/* Kα Doublet Toggle */}
            <button 
              onClick={() => setProfileParams(prev => ({ ...prev, enableKaDoublet: !prev.enableKaDoublet }))}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                profileParams.enableKaDoublet 
                  ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Kα1 / Kα2 doublet peak splitting"
            >
              <Flame className="w-3 h-3" />
              <span>{t('Kα Doublet', 'Kα Doublet')}</span>
            </button>

            {/* Bragg Ticks */}
            <button 
              onClick={() => setShowBraggTicks(!showBraggTicks)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                showBraggTicks 
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Bragg reflection stick markers at baseline"
            >
              <Binary className="w-3 h-3" />
              <span>{t('Ticks', 'Ticks')}</span>
            </button>

            <button 
              onClick={() => setShowHKL(!showHKL)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
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
                className="bg-slate-900 border border-white/10 rounded-xl px-2 py-1 text-[9px] font-black text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[110px] transition-all cursor-pointer uppercase tracking-wider font-mono"
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

            {/* Intensity Scale Segmented Control */}
            <div className="flex items-center bg-slate-900/80 border border-white/10 rounded-xl p-0.5 ml-1 shadow-inner">
              <button
                type="button"
                onClick={() => setProfileParams(p => ({ ...p, intensityScale: 'linear' }))}
                className={`px-2 py-1 rounded-lg text-[9px] font-mono font-black uppercase transition-all ${
                  profileParams.intensityScale === 'linear'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Linear Intensity Scale (0-100%)"
              >
                Lin
              </button>
              <button
                type="button"
                onClick={() => setProfileParams(p => ({ ...p, intensityScale: 'log10' }))}
                className={`px-2 py-1 rounded-lg text-[9px] font-mono font-black uppercase transition-all ${
                  profileParams.intensityScale === 'log10'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Logarithmic Intensity Scale (Log₁₀) for wide dynamic range"
              >
                Log
              </button>
              <button
                type="button"
                onClick={() => setProfileParams(p => ({ ...p, intensityScale: 'sqrt' }))}
                className={`px-2 py-1 rounded-lg text-[9px] font-mono font-black uppercase transition-all ${
                  profileParams.intensityScale === 'sqrt'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Square Root Intensity Scale (√I - Poisson variance matching)"
              >
                √I
              </button>
            </div>

            {/* Rietveld Difference / Residual Curve Quick Toggle */}
            <button 
              onClick={() => {
                setShowResidual(!showResidual);
                setProfileParams(p => ({ ...p, showDifferenceCurve: !p.showDifferenceCurve }));
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ml-1 ${
                (showResidual || profileParams.showDifferenceCurve)
                  ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] border border-pink-400/40' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Rietveld Residual Difference Curve (Ycalc - Ytheor)"
            >
              <TrendingDown className="w-3 h-3" />
              <span>{t('Residuals Δ', 'Residuals Δ')}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 relative">
            {/* Export XY / CSV */}
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="group/btn p-2.5 bg-slate-800/50 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 rounded-xl transition-all duration-300 border border-white/5 hover:border-indigo-500/30 flex items-center gap-1"
                title="Export simulated diffractogram as .xy or .csv"
              >
                <FileDown className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[9px] font-mono font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-white/5">
                    Export Diffractogram
                  </div>
                  <button
                    onClick={() => downloadDiffractogram('xy')}
                    className="w-full text-left px-2.5 py-1.5 mt-1 rounded-lg text-[10px] font-mono font-semibold text-slate-300 hover:text-white hover:bg-indigo-600/30 flex items-center justify-between"
                  >
                    <span>XY Data (.xy)</span>
                    <span className="text-[8px] text-slate-500">2θ vs I</span>
                  </button>
                  <button
                    onClick={() => downloadDiffractogram('csv')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold text-slate-300 hover:text-white hover:bg-indigo-600/30 flex items-center justify-between"
                  >
                    <span>Spreadsheet (.csv)</span>
                    <span className="text-[8px] text-slate-500">CSV Table</span>
                  </button>
                </div>
              )}
            </div>

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

      {/* Profile Optics Tuning Collapsible Panel */}
      {showTuningPanel && (
        <div className="mb-6 relative z-30 animate-in fade-in slide-in-from-top-3 duration-200">
          <ProfileTuningPanel 
            params={profileParams} 
            onChange={setProfileParams} 
            onReset={() => setProfileParams(DEFAULT_PROFILE_PARAMS)}
            xAxisUnit={xAxisUnit}
            onXAxisUnitChange={setXAxisUnit}
            onClose={() => setShowTuningPanel(false)}
          />
        </div>
      )}

      {/* Real-time Laboratory Digital Monitor */}
      <div className="relative z-10 mb-6 bg-slate-950/80 border border-white/5 rounded-2xl p-4 shadow-lg grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Primary Dynamic Coordinate Monitor */}
        <div className="bg-[#020617]/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[64px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            {xAxisUnit === 'twoTheta' ? 'Angle (2θ)' : xAxisUnit === 'q' ? 'Wavevector (Q)' : 'Interplanar (d)'}
          </span>
          <span className="text-lg font-black text-indigo-400 font-mono tracking-tighter">
            {hoveredTwoThetaVal !== null
              ? xAxisUnit === 'twoTheta'
                ? `${hoveredTwoThetaVal.toFixed(3)}°`
                : xAxisUnit === 'q'
                ? `${hoverCrystallographyMetrics?.q ? hoverCrystallographyMetrics.q.toFixed(4) : '---'} Å⁻¹`
                : `${hoverCrystallographyMetrics?.d ? convertLength(hoverCrystallographyMetrics.d, lengthUnit).toFixed(precision) : '---'} ${lengthUnit}`
              : '---'}
          </span>
        </div>

        {/* Complementary Crystallographic Coordinates */}
        <div className="bg-[#020617]/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[64px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            {xAxisUnit === 'twoTheta' ? 'Interplanar (d)' : 'Angle (2θ)'}
          </span>
          <span className="text-lg font-black text-emerald-400 font-mono tracking-tighter">
            {hoverCrystallographyMetrics?.d 
              ? xAxisUnit === 'twoTheta'
                ? `${convertLength(hoverCrystallographyMetrics.d, lengthUnit).toFixed(precision)} ${lengthUnit}`
                : `${hoveredTwoThetaVal?.toFixed(3)}°`
              : '---'}
          </span>
        </div>

        {/* Scattering Vector Q */}
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

        {/* Target Anode & Photon Energy */}
        <div className="bg-[#020617]/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[64px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Anode Radiation</span>
          <span className="text-sm font-bold text-slate-300 font-mono tracking-tighter block mt-0.5">
            {(12.3984 / activeWavelengthVal).toFixed(2)} keV
          </span>
          <span className="text-[8px] font-black text-indigo-400 font-mono uppercase tracking-widest leading-none">
            {identifyAnode(activeWavelengthVal).anode} Kα
          </span>
        </div>

        {/* Profile Optics & Line Breadth */}
        <div className="bg-[#020617]/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between min-h-[64px]">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Profile Optics</span>
          <span className="text-xs font-bold text-violet-400 font-mono tracking-tighter block mt-0.5">
            Γ̄ = {chartData.metrics.averageFwhm.toFixed(3)}°
          </span>
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider leading-none">
            Area: {Math.round(chartData.metrics.integratedTotalArea)}
          </span>
        </div>
      </div>

      {/* Rietveld Agreement Metrics Banner */}
      {chartData.agreementMetrics && (
        <div className="relative z-10 mb-4 bg-gradient-to-r from-indigo-950/60 via-purple-950/50 to-pink-950/60 border border-indigo-500/30 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {t('Rietveld Agreement Metrics', 'Rietveld Agreement Metrics')}
            </span>
            <span className="text-[8px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold">
              vs. {materialName || 'Theoretical Reference'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-xs">
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-400 font-sans font-bold">Rp:</span>
              <span className="font-extrabold text-emerald-400">{chartData.agreementMetrics.rp.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-400 font-sans font-bold">Rwp:</span>
              <span className="font-extrabold text-amber-400">{chartData.agreementMetrics.rwp.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-400 font-sans font-bold">χ² (GoF):</span>
              <span className="font-extrabold text-indigo-400">{chartData.agreementMetrics.chi2.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-400 font-sans font-bold">P/B:</span>
              <span className="font-extrabold text-teal-400">{chartData.metrics.peakToBackgroundRatio.toFixed(1)}:1</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-400 font-sans font-bold">Scale:</span>
              <span className="font-extrabold text-cyan-300 uppercase text-[10px]">{profileParams.intensityScale}</span>
            </div>
          </div>
        </div>
      )}

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
                            <span className="font-bold text-emerald-400">{peak.dSpacing ? `${convertLength(peak.dSpacing, lengthUnit).toFixed(precision)} ${lengthUnit}` : '---'}</span>
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
              dataKey={xAxisUnit === 'twoTheta' ? 'twoTheta' : xAxisUnit === 'q' ? 'q' : 'dSpacing'} 
              type="number"
              domain={currentDomain} 
              allowDataOverflow={true}
              tick={{ fontSize: 10, fontWeight: 'black', fill: '#475569', fontFamily: 'monospace' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.05)' }}
              label={{ 
                value: xAxisUnit === 'twoTheta' ? 'Diffraction Angle 2θ (°)' : xAxisUnit === 'q' ? 'Scattering Vector Q (Å⁻¹)' : `Interplanar Spacing d (${lengthUnit})`, 
                position: 'bottom', 
                offset: 0, 
                fill: '#64748b', 
                fontSize: 10, 
                fontWeight: 'black', 
                letterSpacing: '0.15em' 
              }}
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

            {/* Selected Reflection Reticle Marker */}
            {selectedPeakIndex !== null && results[selectedPeakIndex] && (
              <ReferenceLine 
                x={xAxisUnit === 'twoTheta' ? results[selectedPeakIndex].twoTheta : xAxisUnit === 'q' ? results[selectedPeakIndex].qVector : results[selectedPeakIndex].dSpacing} 
                stroke="#818cf8" 
                strokeWidth={2} 
                strokeDasharray="3 3"
              />
            )}

            {/* Constituent Sub-Peaks Deconvolution Areas */}
            {showSubPeaks && chartData.peakData.slice(0, 10).map((peak, idx) => (
              <Area 
                key={`subpeak-area-${peak.originalIdx}`}
                data={chartData.points}
                type="monotone"
                dataKey={profileParams.intensityScale !== 'linear' ? `subPeakDisplay_${peak.originalIdx}` : `subPeak_${peak.originalIdx}`}
                name={`Peak #${idx + 1} (${peak.hkl ? `(${peak.hkl})` : `${peak.twoTheta.toFixed(2)}°`})`}
                stroke={SUBPEAK_PALETTE[idx % SUBPEAK_PALETTE.length]}
                strokeWidth={1.5}
                strokeDasharray="4 2"
                fill={SUBPEAK_PALETTE[idx % SUBPEAK_PALETTE.length]}
                fillOpacity={0.12}
                isAnimationActive={false}
              />
            ))}

            {/* Rietveld Residual Difference Curve (Ycalc - Ytheor) */}
            {(showResidual || profileParams.showDifferenceCurve) && (
              <>
                <ReferenceLine 
                  y={8} 
                  stroke="#ec4899" 
                  strokeDasharray="4 4" 
                  strokeWidth={1}
                  opacity={0.5} 
                />
                <Area 
                  data={chartData.points}
                  type="monotone"
                  dataKey="residualDisplay"
                  name={t('Residual (Ycalc - Ytheor)', 'Residual (Ycalc - Ytheor)')}
                  stroke="#ec4899"
                  strokeWidth={1.8}
                  fill="#ec4899"
                  fillOpacity={0.15}
                  isAnimationActive={false}
                />
              </>
            )}

            {/* Baseline Bragg Positions (Ticks) */}
            {showBraggTicks && (
              <Scatter 
                data={chartData.tickData}
                name={t('Bragg Positions (Ticks)', 'Bragg Positions (Ticks)')}
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;
                  
                  let l = left !== null ? left : dataMinTheta;
                  let r = right !== null ? right : dataMaxTheta;
                  if (payload.twoTheta < l || payload.twoTheta > r) return null;
                  
                  return (
                    <line 
                      x1={cx} 
                      y1={cy - 12} 
                      x2={cx} 
                      y2={cy + 2} 
                      stroke={payload.isMatch ? '#f59e0b' : '#38bdf8'} 
                      strokeWidth={2}
                      strokeLinecap="round" 
                    />
                  );
                }}
              />
            )}
            
            {showObserved && (
              <Area 
                data={chartData.points}
                type="monotone"
                dataKey={profileParams.intensityScale !== 'linear' ? "intensityDisplay" : "intensity"}
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
                dataKey={profileParams.intensityScale !== 'linear' ? "theoreticalIntensityDisplay" : "theoreticalIntensity"}
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
                      r={isThisDragged ? 8 : (selectedPeakIndex === payload.originalIdx ? 7 : 6)} 
                      fill={isThisDragged ? "#3b82f6" : (selectedPeakIndex === payload.originalIdx ? "#818cf8" : markerColor)} 
                      filter="url(#glowShadow)" 
                      stroke={selectedPeakIndex === payload.originalIdx ? "#ffffff" : "white"} 
                      strokeWidth={selectedPeakIndex === payload.originalIdx ? 2.5 : 2} 
                      className="cursor-pointer hover:scale-125 transition-all duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPeakIndex(payload.originalIdx);
                      }}
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

      {/* Single-Reflection Metrology Deep Inspector */}
      {selectedPeakIndex !== null && results[selectedPeakIndex] && (
        <div className="relative z-20 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <ReflectionInspector
            reflection={results[selectedPeakIndex]}
            index={selectedPeakIndex}
            metadata={chartData.peakData.find(pd => pd.originalIdx === selectedPeakIndex)}
            params={profileParams}
            wavelength={activeWavelengthVal}
            lengthUnit={lengthUnit}
            precision={precision}
            onUpdateAngle={(newAngle) => updatePeakTwoTheta(selectedPeakIndex, newAngle)}
            onFocusZoom={() => {
              setLeft(Number(Math.max(0, results[selectedPeakIndex].twoTheta - 3).toFixed(2)));
              setRight(Number(Math.min(180, results[selectedPeakIndex].twoTheta + 3).toFixed(2)));
            }}
            onClose={() => setSelectedPeakIndex(null)}
          />
        </div>
      )}

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
              {t('Click Row to Inspect Peak & Snap Center • Hover Row to Highlight', 'Click Row to Inspect Peak & Snap Center • Hover Row to Highlight')}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="py-2.5 px-3">{t('Index', 'Index')}</th>
                  <th className="py-2.5 px-3">{t('Angle (2θ)', 'Angle (2θ)')}</th>
                  <th className="py-2.5 px-3">{t('Miller (hkl)', 'Miller (hkl)')}</th>
                  <th className="py-2.5 px-3">{t(`d-spacing (${lengthUnit})`, `d-spacing (${lengthUnit})`)}</th>
                  <th className="py-2.5 px-3">{t('Wavevector Q (Å⁻¹)', 'Wavevector Q (Å⁻¹)')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Rel. Intensity', 'Rel. Intensity')}</th>
                  <th className="py-2.5 px-3 text-right">{t('FWHM (Γ)', 'FWHM (Γ)')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Size Dhkl', 'Size Dhkl')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Kα Split', 'Kα Split')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Area (∫I)', 'Area (∫I)')}</th>
                  <th className="py-2.5 px-3 text-center">{t('Fine Tuning', 'Fine Tuning')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Phase Alignment', 'Phase Alignment')}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((peak, idx) => {
                  const isHovered = hoveredPeakTheta === peak.twoTheta;
                  const isSelected = selectedPeakIndex === idx;
                  const matchingCalculatedPeak = chartData.peakData.find(pd => pd.originalIdx === idx || Math.abs(pd.twoTheta - peak.twoTheta) < 0.05);
                  const isMatch = matchingCalculatedPeak?.isMatch;
                  
                  return (
                    <tr 
                      key={`table-peak-row-${idx}`}
                      onClick={() => {
                        setSelectedPeakIndex(idx);
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
                        isSelected
                          ? 'bg-indigo-600/20 text-white border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                          : isHovered 
                          ? 'bg-indigo-500/15 text-white border-indigo-500/30' 
                          : 'hover:bg-slate-900/40 text-slate-300 hover:text-white'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          {isSelected && <Microscope className="w-3 h-3 text-indigo-400" />}
                          #{idx + 1}
                        </span>
                      </td>
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
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{convertLength(peak.dSpacing, lengthUnit).toFixed(precision)} {lengthUnit}</td>
                      <td className="py-3 px-3 font-mono text-sky-400">{(4 * Math.PI * Math.sin((peak.twoTheta / 2) * (Math.PI / 180)) / activeWavelengthVal).toFixed(4)}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono font-bold text-amber-400">{(peak.intensity ?? 100).toFixed(1)}%</span>
                          <div className="w-12 bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${peak.intensity ?? 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-violet-400 font-semibold">
                        {matchingCalculatedPeak?.fwhm ? `${matchingCalculatedPeak.fwhm.toFixed(3)}°` : '---'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-teal-300 font-semibold">
                        {matchingCalculatedPeak?.scherrerSizeNm ? `${matchingCalculatedPeak.scherrerSizeNm.toFixed(1)} nm` : '---'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-300 font-semibold">
                        {matchingCalculatedPeak?.kaSplitDeg ? `+${matchingCalculatedPeak.kaSplitDeg.toFixed(3)}°` : '---'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-300 font-semibold">
                        {matchingCalculatedPeak?.integratedArea ? matchingCalculatedPeak.integratedArea.toFixed(1) : '---'}
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
