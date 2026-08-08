import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MATERIAL_DB } from '../utils/materialDB';
import { BraggResult } from '../types';
import spectralDiffBg from '../src/assets/images/spectral_diff_bg_1786058246516.jpg';
import { 
  Layers, 
  ChevronDown, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Database, 
  Upload, 
  Search, 
  Plus, 
  Sparkles, 
  FlaskConical, 
  FileText, 
  Sliders,
  AlertTriangle,
  Info,
  Activity,
  Grid,
  Eye,
  Download,
  Layers3,
  Maximize2,
  SlidersHorizontal,
  Zap,
  MoveHorizontal,
  Scale,
  Crosshair,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  X,
  FileSpreadsheet,
  Play,
  Lightbulb
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine
} from 'recharts';

interface DiffractionCompareModuleProps {
  activeResults?: BraggResult[];
  activeMaterialName?: string | null;
}

export const DiffractionCompareModule: React.FC<DiffractionCompareModuleProps> = ({
  activeResults = [],
  activeMaterialName = null
}) => {
  const { t } = useTranslation();

  // ----------------------------------------------------
  // Robust Dynamic Custom Pattern Parser
  // ----------------------------------------------------
  const parseCustomPattern = (patternStr: string) => {
    if (!patternStr) return [];
    const entries = patternStr.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
    return entries.map(entry => {
      let twoTheta = NaN;
      let hkl = '';
      let intensity = 100;

      const parenIndex = entry.indexOf('(');
      if (parenIndex !== -1) {
        const thetaStr = entry.substring(0, parenIndex).trim();
        twoTheta = parseFloat(thetaStr);

        const insideParen = entry.substring(parenIndex + 1, entry.indexOf(')'));
        const insideParts = insideParen.split(',').map(p => p.trim());
        if (insideParts.length > 0) {
          const numericPart = parseFloat(insideParts[0]);
          if (!isNaN(numericPart) && insideParts.length === 1) {
            intensity = numericPart;
            hkl = '';
          } else if (insideParts.length === 2) {
            hkl = insideParts[0];
            const parsedInt = parseFloat(insideParts[1]);
            if (!isNaN(parsedInt)) {
              intensity = parsedInt;
            }
          } else {
            hkl = insideParts[0];
          }
        }
      } else {
        const parts = entry.replace(/\s+/g, ' ').split(' ');
        if (parts.length >= 1) {
          twoTheta = parseFloat(parts[0]);
        }
        if (parts.length >= 2) {
          const parsedValue = parseFloat(parts[1]);
          if (!isNaN(parsedValue)) {
            intensity = parsedValue;
          } else {
            hkl = parts[1];
          }
        }
        if (parts.length >= 3) {
          const parsedValue = parseFloat(parts[2]);
          if (!isNaN(parsedValue)) {
            intensity = parsedValue;
          }
        }
      }
      return { twoTheta, intensity, hkl };
    }).filter(p => !isNaN(p.twoTheta));
  };

  // ----------------------------------------------------
  // State Initialization
  // ----------------------------------------------------
  
  // Experimental Mode (Sample A)
  const [expMode, setExpMode] = useState<'active' | 'custom'>(() => {
    return activeResults && activeResults.length > 0 ? 'active' : 'custom';
  });
  const [customExpName, setCustomExpName] = useState<string>('My Synthesized Sample (HAp-Exp)');
  const [customExpFormula, setCustomExpFormula] = useState<string>('Ca10(PO4)6(OH)2');
  const [customExpPattern, setCustomExpPattern] = useState<string>(
    '25.87(30), 31.77(100), 32.19(70), 32.90(65), 34.08(45), 46.71(35), 49.46(30)'
  );

  // Database / Reference Mode (Sample B)
  const [refMode, setRefMode] = useState<'preset' | 'custom'>('preset');
  const [selectedMaterialBName, setSelectedMaterialBName] = useState<string>(() => {
    if (activeMaterialName) {
      const match = MATERIAL_DB.find(
        m => m.name.toLowerCase().includes(activeMaterialName.toLowerCase()) || 
             activeMaterialName.toLowerCase().includes(m.name.toLowerCase())
      );
      if (match) return match.name;
    }
    // Preferred default Hydroxyapatite
    const haMatch = MATERIAL_DB.find(m => m.name.toLowerCase().includes('hydroxyapatite'));
    if (haMatch) return haMatch.name;
    return MATERIAL_DB[5].name;
  });

  const [customRefName, setCustomRefName] = useState<string>('Hydroxyapatite PDF Reference (ASTM-09)');
  const [customRefFormula, setCustomRefFormula] = useState<string>('Ca10(PO4)6(OH)2');
  const [customRefCrystalSystem, setCustomRefCrystalSystem] = useState<string>('Hexagonal');
  const [customRefSpaceGroup, setCustomRefSpaceGroup] = useState<string>('P63/m');
  const [customRefPattern, setCustomRefPattern] = useState<string>(
    '25.88(25), 31.78(100), 32.20(60), 32.90(60), 34.00(40), 46.72(30), 49.48(25)'
  );

  const [searchBText, setSearchBText] = useState<string>('');

  // ----------------------------------------------------
  // Material Derivations
  // ----------------------------------------------------
  const userSampleMaterial = useMemo(() => {
    if (!activeResults || activeResults.length === 0) return null;
    return {
      name: 'Active Experimental Results',
      formula: activeMaterialName || 'Unknown Phase',
      crystalSystem: t('Synthesized'),
      spaceGroup: t('Custom Peaks'),
      isUserSample: true,
      pattern: activeResults.map(r => `${r.twoTheta}(${r.hkl || ''})`).join(', '),
      results: activeResults
    };
  }, [activeResults, activeMaterialName, t]);

  const materialA = useMemo(() => {
    if (expMode === 'active' && userSampleMaterial) {
      return userSampleMaterial;
    }
    return {
      name: customExpName,
      formula: customExpFormula,
      crystalSystem: t('Experimental'),
      spaceGroup: t('Custom Peaks'),
      isUserSample: true,
      results: parseCustomPattern(customExpPattern)
    };
  }, [expMode, userSampleMaterial, customExpName, customExpFormula, customExpPattern, t]);

  const materialB = useMemo(() => {
    if (refMode === 'preset') {
      return MATERIAL_DB.find(m => m.name === selectedMaterialBName) || MATERIAL_DB[5];
    }
    return {
      name: customRefName,
      formula: customRefFormula,
      crystalSystem: customRefCrystalSystem,
      spaceGroup: customRefSpaceGroup,
      isUserSample: true,
      results: parseCustomPattern(customRefPattern)
    };
  }, [refMode, selectedMaterialBName, customRefName, customRefFormula, customRefCrystalSystem, customRefSpaceGroup, customRefPattern]);

  // Clone active preset values to custom fields to tweak
  const handleCopyPresetToCustom = () => {
    const activePreset = MATERIAL_DB.find(m => m.name === selectedMaterialBName) || MATERIAL_DB[5];
    setCustomRefName(`${activePreset.name} (Tweak/Import)`);
    setCustomRefFormula(activePreset.formula);
    setCustomRefCrystalSystem(activePreset.crystalSystem || 'Orthorhombic');
    setCustomRefSpaceGroup(activePreset.spaceGroup || 'P21/c');
    setCustomRefPattern(activePreset.pattern || '');
    setRefMode('custom');
  };

  // Swap Sample A and Sample B
  const handleSwapSamples = () => {
    const curA = materialA as any;
    const curB = materialB as any;

    if (!curA || !curB) return;

    setExpMode('custom');
    setCustomExpName(curB.name || 'Reference Copy');
    setCustomExpFormula(curB.formula || '');
    if (curB.pattern) {
      setCustomExpPattern(curB.pattern);
    } else if (curB.results) {
      setCustomExpPattern(curB.results.map((r: any) => `${r.twoTheta}(${r.intensity !== undefined ? r.intensity : 100})`).join(', '));
    }

    setRefMode('custom');
    setCustomRefName(curA.name || 'Experimental Copy');
    setCustomRefFormula(curA.formula || '');
    setCustomRefCrystalSystem(curA.crystalSystem || 'Experimental');
    setCustomRefSpaceGroup(curA.spaceGroup || 'Custom');
    if (curA.pattern) {
      setCustomRefPattern(curA.pattern);
    } else if (curA.results) {
      setCustomRefPattern(curA.results.map((r: any) => `${r.twoTheta}(${r.intensity !== undefined ? r.intensity : 100})`).join(', '));
    }
  };

  // User Help & Guide Modal State
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // 1-Click Preset Demonstration Scenarios
  const handleLoadPresetScenario = (key: string) => {
    if (key === 'pure-ha') {
      const ha = MATERIAL_DB.find(m => m.name.toLowerCase().includes('hydroxyapatite')) || MATERIAL_DB[5];
      setExpMode('custom');
      setCustomExpName('Synthesized HAp (Single Phase)');
      setCustomExpFormula(ha.formula);
      setCustomExpPattern(ha.pattern);
      setRefMode('preset');
      setSelectedMaterialBName(ha.name);
      setShiftTwoTheta(0);
      setScaleSampleB(1.0);
    } else if (key === 'strained-ha') {
      const ha = MATERIAL_DB.find(m => m.name.toLowerCase().includes('hydroxyapatite')) || MATERIAL_DB[5];
      setExpMode('custom');
      setCustomExpName('Strained HAp (Substituted)');
      setCustomExpFormula('Ca9.5Mg0.5(PO4)6(OH)2');
      setCustomExpPattern('25.99(30), 31.89(100), 32.31(70), 33.02(65), 34.20(45), 46.83(35), 49.58(30)');
      setRefMode('preset');
      setSelectedMaterialBName(ha.name);
      setShiftTwoTheta(0);
      setScaleSampleB(1.0);
    } else if (key === 'biphasic-ha-tcp') {
      const ha = MATERIAL_DB.find(m => m.name.toLowerCase().includes('hydroxyapatite')) || MATERIAL_DB[5];
      setExpMode('custom');
      setCustomExpName('Biphasic HAp + TCP Mixture');
      setCustomExpFormula('Ca10(PO4)6(OH)2 + Ca3(PO4)2');
      setCustomExpPattern('25.87(30), 31.02(45), 31.77(100), 32.19(70), 32.90(65), 34.08(45), 34.30(35), 46.71(35), 49.46(30)');
      setRefMode('preset');
      setSelectedMaterialBName(ha.name);
      setShiftTwoTheta(0);
      setScaleSampleB(1.0);
    } else if (key === 'quartz') {
      const qz = MATERIAL_DB.find(m => m.name.toLowerCase().includes('quartz')) || MATERIAL_DB[0];
      setExpMode('custom');
      setCustomExpName('Quartz Standard (Alpha-SiO2)');
      setCustomExpFormula(qz.formula);
      setCustomExpPattern(qz.pattern);
      setRefMode('preset');
      setSelectedMaterialBName(qz.name);
      setShiftTwoTheta(0);
      setScaleSampleB(1.0);
    }
  };

  // ----------------------------------------------------
  // Match & Residual Diagnostics Logic
  // ----------------------------------------------------
  const analysis = useMemo(() => {
    const parsePatternToPeaks = (mat: any) => {
      if (!mat) return [];
      if (mat.isUserSample) {
        return (mat.results || []).map((r: any) => ({
          twoTheta: r.twoTheta,
          intensity: r.intensity !== undefined ? r.intensity : 100
        }));
      }
      const pattern = mat.pattern || '';
      return pattern.split(',').map((s: string) => {
        const [thetaStr] = s.split('(');
        return {
          twoTheta: parseFloat(thetaStr.trim()),
          intensity: 100
        };
      }).filter((p: any) => !isNaN(p.twoTheta));
    };

    const pA = parsePatternToPeaks(materialA);
    const pB = parsePatternToPeaks(materialB);

    const shifts: { peak: number; shift: number; type: string }[] = [];
    const missingInA: number[] = [];
    const extraInA: number[] = [];

    // Find shifts and extra peaks in A compared to reference B
    pA.forEach((peakA: any) => {
      // Find closest reference peak in B within 1.0 degrees
      const closestRef = pB.reduce((prev: any, curr: any) => {
        if (!prev) return curr;
        return Math.abs(curr.twoTheta - peakA.twoTheta) < Math.abs(prev.twoTheta - peakA.twoTheta) ? curr : prev;
      }, null);

      if (closestRef && Math.abs(closestRef.twoTheta - peakA.twoTheta) <= 0.6) {
        const shiftVal = peakA.twoTheta - closestRef.twoTheta;
        if (Math.abs(shiftVal) >= 0.005) {
          shifts.push({
            peak: peakA.twoTheta,
            shift: shiftVal,
            type: shiftVal > 0 ? 'higher' : 'lower'
          });
        }
      } else {
        extraInA.push(peakA.twoTheta);
      }
    });

    // Find missing peaks in A that are expected in Reference B
    pB.forEach((peakB: any) => {
      const closestA = pA.reduce((prev: any, curr: any) => {
        if (!prev) return curr;
        return Math.abs(curr.twoTheta - peakB.twoTheta) < Math.abs(prev.twoTheta - peakB.twoTheta) ? curr : prev;
      }, null);

      if (!closestA || Math.abs(closestA.twoTheta - peakB.twoTheta) > 0.6) {
        missingInA.push(peakB.twoTheta);
      }
    });

    let meanShift = 0;
    let avgStrain = 0;
    if (shifts.length > 0) {
      const sumShift = shifts.reduce((acc, s) => acc + s.shift, 0);
      meanShift = sumShift / shifts.length;
      const strains = shifts.map(s => {
        const thetaRad = (s.peak / 2) * (Math.PI / 180);
        const deltaRad = (s.shift) * (Math.PI / 180);
        return -0.5 * deltaRad / Math.tan(thetaRad || 0.1);
      });
      avgStrain = (strains.reduce((acc, st) => acc + st, 0) / strains.length) * 100;
    }

    let matchQuality: 'exact' | 'strained' | 'multiphase' | 'poor' = 'exact';
    if (extraInA.length > 1 && missingInA.length > 1) {
      matchQuality = 'poor';
    } else if (extraInA.length > 0) {
      matchQuality = 'multiphase';
    } else if (Math.abs(meanShift) > 0.03 || shifts.length > 0) {
      matchQuality = 'strained';
    }

    // Indexed Peak Table & Phase Estimation computation
    const lambda = 1.5406; // Cu-Ka wavelength
    const indexedPeaks: Array<{
      id: number;
      twoThetaA: number;
      twoThetaB: number | null;
      dSpacingA: string;
      dSpacingB: string;
      shift: number | null;
      intensityA: number;
      intensityB: number;
      status: 'matched' | 'shifted' | 'extra' | 'missing';
    }> = [];

    let peakId = 1;

    pA.forEach((peakA: any) => {
      const thetaRadA = (peakA.twoTheta / 2) * (Math.PI / 180);
      const dA = thetaRadA > 0 ? (lambda / (2 * Math.sin(thetaRadA))).toFixed(4) : '-';

      const closestRef = pB.reduce((prev: any, curr: any) => {
        if (!prev) return curr;
        return Math.abs(curr.twoTheta - peakA.twoTheta) < Math.abs(prev.twoTheta - peakA.twoTheta) ? curr : prev;
      }, null);

      if (closestRef && Math.abs(closestRef.twoTheta - peakA.twoTheta) <= 0.6) {
        const shiftVal = peakA.twoTheta - closestRef.twoTheta;
        const thetaRadB = (closestRef.twoTheta / 2) * (Math.PI / 180);
        const dB = thetaRadB > 0 ? (lambda / (2 * Math.sin(thetaRadB))).toFixed(4) : '-';

        indexedPeaks.push({
          id: peakId++,
          twoThetaA: peakA.twoTheta,
          twoThetaB: closestRef.twoTheta,
          dSpacingA: dA,
          dSpacingB: dB,
          shift: Number(shiftVal.toFixed(3)),
          intensityA: peakA.intensity,
          intensityB: closestRef.intensity,
          status: Math.abs(shiftVal) >= 0.02 ? 'shifted' : 'matched'
        });
      } else {
        indexedPeaks.push({
          id: peakId++,
          twoThetaA: peakA.twoTheta,
          twoThetaB: null,
          dSpacingA: dA,
          dSpacingB: '-',
          shift: null,
          intensityA: peakA.intensity,
          intensityB: 0,
          status: 'extra'
        });
      }
    });

    pB.forEach((peakB: any) => {
      const closestA = pA.reduce((prev: any, curr: any) => {
        if (!prev) return curr;
        return Math.abs(curr.twoTheta - peakB.twoTheta) < Math.abs(prev.twoTheta - peakB.twoTheta) ? curr : prev;
      }, null);

      if (!closestA || Math.abs(closestA.twoTheta - peakB.twoTheta) > 0.6) {
        const thetaRadB = (peakB.twoTheta / 2) * (Math.PI / 180);
        const dB = thetaRadB > 0 ? (lambda / (2 * Math.sin(thetaRadB))).toFixed(4) : '-';

        indexedPeaks.push({
          id: peakId++,
          twoThetaA: 0,
          twoThetaB: peakB.twoTheta,
          dSpacingA: '-',
          dSpacingB: dB,
          shift: null,
          intensityA: 0,
          intensityB: peakB.intensity,
          status: 'missing'
        });
      }
    });

    // Phase purity & fraction estimation
    const sumIntA = pA.reduce((acc: number, p: any) => acc + p.intensity, 0);
    const matchedIntA = indexedPeaks
      .filter(p => p.status === 'matched' || p.status === 'shifted')
      .reduce((acc, p) => acc + p.intensityA, 0);

    const primaryPhasePurity = sumIntA > 0 ? Math.round((matchedIntA / sumIntA) * 100) : 100;
    const secondaryPhaseEst = Math.max(0, 100 - primaryPhasePurity);

    return { 
      shifts, 
      missingInA, 
      extraInA, 
      meanShift, 
      avgStrain, 
      matchQuality, 
      indexedPeaks, 
      primaryPhasePurity, 
      secondaryPhaseEst 
    };
  }, [materialA, materialB]);

  // ----------------------------------------------------
  // Simulated Pattern Generator with 2θ Shift & Relative Scale
  // ----------------------------------------------------
  const generateChartData = (matA: any, matB: any, shift: number = 0, scaleB: number = 1.0) => {
    const minTheta = 10;
    const maxTheta = 90;
    const step = 0.1;

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
          intensity: 100, // standard peak
          hkl: hklStr ? hklStr.replace(')', '').trim() : ''
        };
      }).filter((p: any) => !isNaN(p.twoTheta));
    };

    const peaksA = parsePattern(matA);
    const peaksB = parsePattern(matB);

    const rawPoints = [];
    for (let x = minTheta; x <= maxTheta; x += step) {
      let intensityA = Math.random() * 0.5 + 1.5; // low experimental noise
      let intensityB = Math.random() * 0.5 + 1.5; 

      const hwA = 0.12; // narrow width
      peaksA.forEach(p => {
        const diff = x - p.twoTheta;
        if (Math.abs(diff) < 2.0) {
          const g = Math.exp(-Math.log(2) * Math.pow(diff / hwA, 2));
          const l = 1 / (1 + Math.pow(diff / hwA, 2));
          intensityA += p.intensity * (0.5 * g + 0.5 * l);
        }
      });

      const hwB = 0.12;
      peaksB.forEach(p => {
        const diff = x - (p.twoTheta + shift);
        if (Math.abs(diff) < 2.0) {
          const g = Math.exp(-Math.log(2) * Math.pow(diff / hwB, 2));
          const l = 1 / (1 + Math.pow(diff / hwB, 2));
          intensityB += p.intensity * scaleB * (0.5 * g + 0.5 * l);
        }
      });

      const finalA = Math.min(100, intensityA);
      const finalB = Math.min(100, intensityB);
      const difference = finalA - finalB;

      const posDiff = Math.max(0, Number((finalA - finalB).toFixed(1)));
      const negDiff = Math.max(0, Number((finalB - finalA).toFixed(1)));
      const toleranceUpper = Number((finalB + 5.0).toFixed(1));
      const toleranceLower = Number(Math.max(0, finalB - 5.0).toFixed(1));

      rawPoints.push({
        twoTheta: Number(x.toFixed(2)),
        intensityA: Number(finalA.toFixed(1)),
        intensityB: Number(finalB.toFixed(1)),
        mirroredB: Number((-finalB).toFixed(1)),
        difference: Number(difference.toFixed(1)),
        posDiff,
        negDiff,
        toleranceUpper,
        toleranceLower
      });
    }

    // Calculate 1st Derivative dI/d2Theta
    const points = rawPoints.map((pt, i, arr) => {
      const prevA = arr[Math.max(0, i - 1)].intensityA;
      const nextA = arr[Math.min(arr.length - 1, i + 1)].intensityA;
      const derivA = Number(((nextA - prevA) / (2 * step)).toFixed(1));

      const prevB = arr[Math.max(0, i - 1)].intensityB;
      const nextB = arr[Math.min(arr.length - 1, i + 1)].intensityB;
      const derivB = Number(((nextB - prevB) / (2 * step)).toFixed(1));

      return {
        ...pt,
        derivA,
        derivB
      };
    });

    const peaksBWithShift = peaksB.map((p: any) => ({
      twoTheta: Number((p.twoTheta + shift).toFixed(2)),
      intensity: Number((p.intensity * scaleB).toFixed(1)),
      hkl: p.hkl
    }));

    return { points, peaksA, peaksB, peaksBWithShift };
  };

  // ----------------------------------------------------
  // Zooming & UI states
  // ----------------------------------------------------
  const [left, setLeft] = useState<number | string>('dataMin');
  const [right, setRight] = useState<number | string>('dataMax');
  const [refAreaLeft, setRefAreaLeft] = useState<number | string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | string | null>(null);

  // Spectral Diff Custom UI Controls
  const [viewMode, setViewMode] = useState<'stacked' | 'unified' | 'mirrored' | 'derivative'>('stacked');
  const [diffTheme, setDiffTheme] = useState<'neon' | 'emerald' | 'amber'>('neon');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showDiffArea, setShowDiffArea] = useState<boolean>(true);

  // Diagnostics Panel View Tabs
  const [diagViewMode, setDiagViewMode] = useState<'cards' | 'table' | 'quant'>('cards');
  const [tableSearchFilter, setTableSearchFilter] = useState<string>('');

  // Enhanced Spectral Diff Overlay Controls
  const [showPosNegDiff, setShowPosNegDiff] = useState<boolean>(true);
  const [showToleranceBand, setShowToleranceBand] = useState<boolean>(false);
  const [showBraggLines, setShowBraggLines] = useState<boolean>(true);
  const [refLineStyle, setRefLineStyle] = useState<'dashed' | 'solid'>('dashed');

  // Advanced Spectral Alignment & Calibration Controls
  const [shiftTwoTheta, setShiftTwoTheta] = useState<number>(0);
  const [scaleSampleB, setScaleSampleB] = useState<number>(1.0);
  const [showDerivative, setShowDerivative] = useState<boolean>(false);
  const [noiseThreshold, setNoiseThreshold] = useState<number>(10);

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
      setLeft(Math.max(10, left - shift));
      setRight(Math.min(90, right + shift));
    }
  };

  const isZoomedIn = typeof left === 'number' && typeof right === 'number';

  const { points, peaksBWithShift } = useMemo(
    () => generateChartData(materialA, materialB, shiftTwoTheta, scaleSampleB), 
    [materialA, materialB, shiftTwoTheta, scaleSampleB]
  );

  // Top Discrepancy Peaks (Residual Mismatches Navigator)
  const topMismatches = useMemo(() => {
    if (!points || points.length === 0) return [];
    const sorted = [...points].sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    const uniquePeaks: typeof points = [];
    sorted.forEach(p => {
      if (Math.abs(p.difference) >= noiseThreshold) {
        const exists = uniquePeaks.some(u => Math.abs(u.twoTheta - p.twoTheta) < 2.5);
        if (!exists && uniquePeaks.length < 5) {
          uniquePeaks.push(p);
        }
      }
    });
    return uniquePeaks;
  }, [points, noiseThreshold]);

  const zoomToTheta = (theta: number) => {
    setLeft(Math.max(10, Number((theta - 3.5).toFixed(1))));
    setRight(Math.min(90, Number((theta + 3.5).toFixed(1))));
  };

  const handleAutoAlign = () => {
    const parsePatternToPeaks = (mat: any) => {
      if (!mat) return [];
      if (mat.isUserSample) {
        return (mat.results || []).map((r: any) => ({
          twoTheta: r.twoTheta,
          intensity: r.intensity !== undefined ? r.intensity : 100
        }));
      }
      const pattern = mat.pattern || '';
      return pattern.split(',').map((s: string) => {
        const [thetaStr] = s.split('(');
        return { twoTheta: parseFloat(thetaStr.trim()), intensity: 100 };
      }).filter((p: any) => !isNaN(p.twoTheta));
    };

    const pA = parsePatternToPeaks(materialA);
    const pB = parsePatternToPeaks(materialB);

    if (pA.length > 0 && pB.length > 0) {
      const maxA = Math.max(...pA.map((p: any) => p.intensity || 100));
      const maxB = Math.max(...pB.map((p: any) => p.intensity || 100));
      if (maxB > 0) {
        setScaleSampleB(Number((maxA / maxB).toFixed(2)));
      }
      const topA = pA.reduce((prev: any, curr: any) => (curr.intensity > prev.intensity ? curr : prev), pA[0]);
      const closestB = pB.reduce((prev: any, curr: any) => {
        return Math.abs(curr.twoTheta - topA.twoTheta) < Math.abs(prev.twoTheta - topA.twoTheta) ? curr : prev;
      }, pB[0]);
      if (closestB) {
        const shift = topA.twoTheta - closestB.twoTheta;
        if (Math.abs(shift) <= 3.0) {
          setShiftTwoTheta(Number(shift.toFixed(2)));
        }
      }
    }
  };

  const handleResetAlign = () => {
    setShiftTwoTheta(0);
    setScaleSampleB(1.0);
  };

  // Real-time scientific residuals & goodness of fit metrics
  const spectralMetrics = useMemo(() => {
    if (!points || points.length === 0) return { rP: '0.00', rWP: '0.00', pearsonR: '0.0', maxDiff: '0.0', rmsd: '0.00' };
    let sumAbsDiff = 0;
    let sumObsA = 0;
    let sumSqDiff = 0;
    let sumSqObsA = 0;
    let sumA = 0;
    let sumB = 0;
    let maxDiff = 0;

    points.forEach(p => {
      const diff = Math.abs(p.difference);
      sumAbsDiff += diff;
      sumObsA += p.intensityA;
      sumSqDiff += Math.pow(p.difference, 2);
      sumSqObsA += Math.pow(p.intensityA, 2);
      sumA += p.intensityA;
      sumB += p.intensityB;
      if (diff > maxDiff) maxDiff = diff;
    });

    const n = points.length;
    const meanA = sumA / n;
    const meanB = sumB / n;

    let numPearson = 0;
    let denA = 0;
    let denB = 0;

    points.forEach(p => {
      const dA = p.intensityA - meanA;
      const dB = p.intensityB - meanB;
      numPearson += dA * dB;
      denA += dA * dA;
      denB += dB * dB;
    });

    const rP = sumObsA > 0 ? (sumAbsDiff / sumObsA) * 100 : 0;
    const rWP = sumSqObsA > 0 ? Math.sqrt(sumSqDiff / sumSqObsA) * 100 : 0;
    const pearsonR = (denA > 0 && denB > 0) ? (numPearson / Math.sqrt(denA * denB)) * 100 : 0;
    const rmsd = Math.sqrt(sumSqDiff / n);

    return {
      rP: rP.toFixed(2),
      rWP: rWP.toFixed(2),
      pearsonR: pearsonR.toFixed(1),
      maxDiff: maxDiff.toFixed(1),
      rmsd: rmsd.toFixed(2)
    };
  }, [points]);

  const filteredPresetMaterials = useMemo(() => {
    if (!searchBText) return MATERIAL_DB;
    const lower = searchBText.toLowerCase();
    return MATERIAL_DB.filter(m => 
      m.name.toLowerCase().includes(lower) || 
      m.formula.toLowerCase().includes(lower) ||
      (m.crystalSystem && m.crystalSystem.toLowerCase().includes(lower))
    );
  }, [searchBText]);

  // Export Report to CSV
  const handleExportReportCSV = () => {
    let csv = `XRD Compare & Residual Diagnostics Report\n`;
    csv += `Sample A (Experimental):,${materialA.name} (${materialA.formula})\n`;
    csv += `Sample B (Reference):,${materialB?.name} (${materialB?.formula})\n`;
    csv += `Shift 2Theta:,${shiftTwoTheta}°\n`;
    csv += `Scale Sample B:,${scaleSampleB}x\n`;
    csv += `Metrics:,Rp = ${spectralMetrics.rP}%, Rwp = ${spectralMetrics.rWP}%, Pearson R = ${spectralMetrics.pearsonR}%, RMS Error = ${spectralMetrics.rmsd}\n`;
    csv += `Match Quality:,${analysis.matchQuality.toUpperCase()}, Mean Shift = ${analysis.meanShift.toFixed(3)} deg, Microstrain = ${analysis.avgStrain.toFixed(3)}%\n`;
    csv += `Primary Phase Purity Estimate:,${analysis.primaryPhasePurity}%\n\n`;

    csv += `INDEXED PEAK MATCHING TABLE\n`;
    csv += `Peak_ID,Exp_2Theta,Ref_2Theta,Shift_2Theta,Exp_d_Spacing_A,Ref_d_Spacing_A,Intensity_A,Intensity_B,Status\n`;
    analysis.indexedPeaks.forEach(p => {
      csv += `${p.id},${p.twoThetaA || ''},${p.twoThetaB || ''},${p.shift !== null ? p.shift : ''},${p.dSpacingA},${p.dSpacingB},${p.intensityA},${p.intensityB},${p.status.toUpperCase()}\n`;
    });

    csv += `\nFULL SPECTRAL PROFILE POINTS\n`;
    csv += `2Theta_deg,Intensity_A,Intensity_B_Scaled,Delta_Residual,Deriv_A,Deriv_B\n`;
    points.forEach(p => {
      csv += `${p.twoTheta},${p.intensityA},${p.intensityB},${p.difference},${p.derivA},${p.derivB}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `XRD_Compare_${materialA.name.replace(/\s+/g, '_')}_vs_${materialB?.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Automated Plain-English AI Interpretation
  const plainEnglishSummary = useMemo(() => {
    const { meanShift, avgStrain, extraInA } = analysis;
    const pVal = parseFloat(spectralMetrics.pearsonR);
    const rpVal = parseFloat(spectralMetrics.rP);

    if (pVal >= 95 && rpVal < 15 && Math.abs(meanShift) < 0.04 && extraInA.length === 0) {
      return {
        badge: 'Single Phase High Pure Match',
        badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        title: `Excellent match with ${materialB?.name} standard (${pVal}% correlation)`,
        description: `Sample A matches reference standard with minimal residual deviation (Profile Residual Rp = ${rpVal}%). No significant unit cell strain or secondary phase impurities detected.`,
        bullets: [
          'Suitable for phase quantification and crystallite size determination.',
          'Peak positions align within standard instrumental tolerance (Δ2θ < 0.04°).'
        ]
      };
    } else if (Math.abs(meanShift) >= 0.04 || Math.abs(avgStrain) >= 0.05) {
      return {
        badge: 'Lattice Strain / Peak Shift',
        badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        title: `Systematic peak shift detected (Average Δ2θ = ${meanShift > 0 ? '+' : ''}${meanShift.toFixed(3)}°)`,
        description: `Reflections are displaced from ideal reference positions, indicating unit cell ${meanShift > 0 ? 'contraction (compressive strain)' : 'expansion (tensile strain)'}. Microstrain estimate ε ≈ ${avgStrain > 0 ? '+' : ''}${avgStrain.toFixed(3)}%.`,
        bullets: [
          'Commonly caused by ionic substitution (doping), thermal stress, or residual lattice strain.',
          'Use the "Auto Align" button to zero-shift before strain calculation.'
        ]
      };
    } else if (extraInA.length > 0) {
      return {
        badge: 'Secondary Phase / Impurity',
        badgeClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        title: `Multiphase mixture detected (${extraInA.length} unindexed reflections)`,
        description: `Sample A contains extra diffraction peaks not indexed by reference ${materialB?.name} (e.g. 2θ = ${extraInA.slice(0, 3).map(x => x.toFixed(2) + '°').join(', ')}).`,
        bullets: [
          'Indicates secondary crystalline phase formation or unreacted precursor residues.',
          'Click any unindexed peak button below to zoom chart directly to the discrepancy.'
        ]
      };
    } else {
      return {
        badge: 'Phase Discrepancy',
        badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        title: `Moderate correlation (${pVal}%) with profile residual Rp = ${rpVal}%`,
        description: `Notable intensity discrepancy between Sample A and reference ${materialB?.name}.`,
        bullets: [
          'May indicate preferred orientation (texture) or low crystallite size/amorphous broadening.',
          'Try adjusting reference scaling or searching for alternative polymorphs.'
        ]
      };
    }
  }, [analysis, spectralMetrics, materialB]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" id="diffraction-compare-module">
      {/* Quick Demo Scenarios & Guide Ribbon */}
      <div className="bg-[#080d1a] border border-slate-800/90 p-4 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              {t('1-Click Test Scenarios')}:
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
              ({t('Select a scenario to test XRD match diagnostics instantly')})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('Guide & Interpretation')}</span>
            </button>
            <button
              onClick={handleExportReportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95"
              title="Download comparison analysis report as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('Export CSV Report')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleLoadPresetScenario('pure-ha')}
            className="flex items-center gap-2 px-3 py-2 bg-[#030712] hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all text-left group"
          >
            <div className="p-1 bg-emerald-500/10 rounded group-hover:bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate">{t('Pure HAp Match')}</span>
              <span className="text-[8px] text-slate-500 font-normal">{t('Single Phase 99%')}</span>
            </div>
          </button>

          <button
            onClick={() => handleLoadPresetScenario('strained-ha')}
            className="flex items-center gap-2 px-3 py-2 bg-[#030712] hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all text-left group"
          >
            <div className="p-1 bg-amber-500/10 rounded group-hover:bg-amber-500/20 text-amber-400">
              <MoveHorizontal className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate">{t('Strained Lattice')}</span>
              <span className="text-[8px] text-slate-500 font-normal">{t('+0.12° 2θ Shift')}</span>
            </div>
          </button>

          <button
            onClick={() => handleLoadPresetScenario('biphasic-ha-tcp')}
            className="flex items-center gap-2 px-3 py-2 bg-[#030712] hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all text-left group"
          >
            <div className="p-1 bg-indigo-500/10 rounded group-hover:bg-indigo-500/20 text-indigo-400">
              <Layers3 className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate">{t('Biphasic Impurity')}</span>
              <span className="text-[8px] text-slate-500 font-normal">{t('HAp + TCP Mixture')}</span>
            </div>
          </button>

          <button
            onClick={() => handleLoadPresetScenario('quartz')}
            className="flex items-center gap-2 px-3 py-2 bg-[#030712] hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-[10px] font-mono font-bold text-slate-300 hover:text-white transition-all text-left group"
          >
            <div className="p-1 bg-cyan-500/10 rounded group-hover:bg-cyan-500/20 text-cyan-400">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate">{t('Quartz α-SiO2')}</span>
              <span className="text-[8px] text-slate-500 font-normal">{t('High-Crystallinity')}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Sample Swap & Quick Configuration Ribbon */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#080d1a] border border-slate-800/90 px-5 py-3.5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
            <FlaskConical className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider">{t('Sample A: Experimental / Synthesized')}</span>
              <span className="text-xs font-mono font-bold text-white">{materialA.name} ({materialA.formula})</span>
            </div>
          </div>

          <span className="text-slate-500 font-black font-mono text-xs hidden sm:inline">VS</span>

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">{t('Sample B: Database / Reference')}</span>
              <span className="text-xs font-mono font-bold text-white">{materialB?.name} ({materialB?.formula})</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSwapSamples}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md shrink-0"
          title="Swap Sample A (Experimental) and Sample B (Reference Standard)"
        >
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          <span>{t('Swap Sample A & B')}</span>
        </button>
      </div>

      {/* ----------------------------------------------------
          Configuration Header Grid (Two-Column Layout)
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sample A: Experimental / Target Data Container */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-indigo-400" />
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  {t('Sample A: Experimental / Synthesized Data')}
                </label>
              </div>
              
              {/* Tabs for Experimental data origin */}
              <div className="bg-black/40 p-0.5 rounded-lg border border-slate-800 flex gap-1">
                {userSampleMaterial && (
                  <button 
                    onClick={() => setExpMode('active')}
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${
                      expMode === 'active' 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t('Active Results')}
                  </button>
                )}
                <button 
                  onClick={() => setExpMode('custom')}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${
                    expMode === 'custom' 
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('Paste Peaks')}
                </button>
              </div>
            </div>

            {expMode === 'active' && userSampleMaterial ? (
              <div className="space-y-4">
                <div className="p-4 bg-black/40 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black">{t('Target Name/Phase')}</span>
                    <span className="text-xs text-white font-bold">{userSampleMaterial.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black">{t('Formula Reference')}</span>
                    <span className="text-xs text-indigo-300 font-mono font-bold">{userSampleMaterial.formula}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase font-black">{t('Peaks Detected')}</span>
                    <span className="text-xs text-indigo-400 font-mono font-bold">
                      {activeResults.length} {t('Peaks')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">{t('Sample Label')}</span>
                    <input 
                      type="text" 
                      value={customExpName}
                      onChange={(e) => setCustomExpName(e.target.value)}
                      placeholder={t('My Phase A')}
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-indigo-500/50 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">{t('Chemical Formula')}</span>
                    <input 
                      type="text" 
                      value={customExpFormula}
                      onChange={(e) => setCustomExpFormula(e.target.value)}
                      placeholder="e.g. Ca5(PO4)3OH"
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-indigo-500/50 outline-none font-bold"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{t('Raw Peaks list')}</span>
                    <span className="text-[8px] text-slate-500 font-mono">{t('Format: 2θ(Relative_Intensity)')}</span>
                  </div>
                  <textarea 
                    value={customExpPattern}
                    onChange={(e) => setCustomExpPattern(e.target.value)}
                    rows={2}
                    className="w-full bg-black/60 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl focus:border-indigo-500/50 outline-none font-mono tracking-tight resize-none"
                    placeholder="25.87(20), 31.77(100), 32.19(60)"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/60">
            <div className="px-3 py-1.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase border border-indigo-500/15">
              {materialA?.crystalSystem ? t(materialA.crystalSystem) : t("Unknown")}
            </div>
            <div className="px-3 py-1.5 rounded bg-slate-800/40 text-slate-400 text-[10px] font-mono border border-slate-800">
              SG: {materialA?.spaceGroup || "Unknown"}
            </div>
          </div>
        </div>

        {/* Sample B: Dedicated Database / Reference Material Container */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  {t('Sample B: Database / Reference Material')}
                </label>
              </div>

              {/* Toggle tabs for preset vs importing reference material */}
              <div className="bg-black/40 p-0.5 rounded-lg border border-slate-800 flex gap-1">
                <button 
                  onClick={() => setRefMode('preset')}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${
                    refMode === 'preset' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('Preset Database')}
                </button>
                <button 
                  onClick={() => setRefMode('custom')}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${
                    refMode === 'custom' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t('Import / Custom')}
                </button>
              </div>
            </div>

            {refMode === 'preset' ? (
              <div className="space-y-3">
                {/* Search presets bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-3" />
                  <input 
                    type="text"
                    value={searchBText}
                    onChange={(e) => setSearchBText(e.target.value)}
                    placeholder={t('Search Database Materials (e.g. Quartz, Hydroxyapatite)...')}
                    className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs pl-9 pr-4 py-2.5 rounded-xl focus:border-emerald-500/50 outline-none font-medium placeholder-slate-600 transition-colors"
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedMaterialBName}
                    onChange={(e) => setSelectedMaterialBName(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-black/60 border border-slate-800 text-slate-200 outline-none rounded-xl text-xs font-mono font-bold appearance-none hover:border-emerald-500/50 transition-colors"
                  >
                    {filteredPresetMaterials.map(m => (
                      <option key={m.name} value={m.name}>
                        {t(m.name)} ({m.formula})
                      </option>
                    ))}
                    {filteredPresetMaterials.length === 0 && (
                      <option value="" disabled>{t('No matching materials found')}</option>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-3.5 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {t('Reference Name')}
                    </span>
                    <input 
                      type="text" 
                      value={customRefName}
                      onChange={(e) => setCustomRefName(e.target.value)}
                      placeholder={t('PDF Card #09-0432')}
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-emerald-500/50 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {t('Ref Formula')}
                    </span>
                    <input 
                      type="text" 
                      value={customRefFormula}
                      onChange={(e) => setCustomRefFormula(e.target.value)}
                      placeholder="Ca10(PO4)6(OH)2"
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-emerald-500/50 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {t('Crystal System')}
                    </span>
                    <input 
                      type="text" 
                      value={customRefCrystalSystem}
                      onChange={(e) => setCustomRefCrystalSystem(e.target.value)}
                      placeholder="Hexagonal"
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-emerald-500/50 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {t('Space Group')}
                    </span>
                    <input 
                      type="text" 
                      value={customRefSpaceGroup}
                      onChange={(e) => setCustomRefSpaceGroup(e.target.value)}
                      placeholder="P63/m"
                      className="w-full bg-black/60 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:border-emerald-500/50 outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      {t('Peaks or PDF Card Pattern')}
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">
                      {t('Format: 2θ(Intensity) or 2θ(HKL, Intensity)')}
                    </span>
                  </div>
                  <textarea 
                    value={customRefPattern}
                    onChange={(e) => setCustomRefPattern(e.target.value)}
                    rows={2}
                    className="w-full bg-black/60 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl focus:border-emerald-500/50 outline-none font-mono tracking-tight resize-none"
                    placeholder="25.88(25), 31.78(100), 32.20(60)"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800/60">
            <div className="flex gap-2">
              <div className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/15">
                {materialB?.crystalSystem ? t(materialB.crystalSystem) : t("Unknown")}
              </div>
              <div className="px-3 py-1.5 rounded bg-slate-800/40 text-slate-400 text-[10px] font-mono border border-slate-800">
                SG: {materialB?.spaceGroup || "Unknown"}
              </div>
            </div>

            {refMode === 'preset' && (
              <button 
                onClick={handleCopyPresetToCustom}
                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors py-1 px-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15"
                title={t('Tweak and modify this preset pattern')}
              >
                <Sparkles className="w-3 h-3" />
                {t('Tweak Reference')}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ----------------------------------------------------
          Diagnostics & Shift Analyzer Panel
          ---------------------------------------------------- */}
      <div className="bg-[#080d1a] border border-slate-800/90 p-5 md:p-6 rounded-2xl shadow-2xl space-y-5">
        
        {/* Header & Match Status Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Sliders className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase text-white tracking-wider">{t('Diffraction Match & Residual Diagnostics')}</span>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 rounded border border-indigo-500/20 font-mono">
                  {t('v2.0 Advanced')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {t('Systematic peak shifts, missing reflections & phase impurity analysis')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Match Status Badge */}
            {analysis.matchQuality === 'exact' && (
              <span className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('Single Phase Match')}
              </span>
            )}
            {analysis.matchQuality === 'strained' && (
              <span className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 rounded-xl border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {t('Lattice Strain / Shifted')}
              </span>
            )}
            {analysis.matchQuality === 'multiphase' && (
              <span className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 rounded-xl border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                {t('Secondary Phase Detected')}
              </span>
            )}
            {analysis.matchQuality === 'poor' && (
              <span className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black font-mono uppercase tracking-wider text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                {t('Phase Discrepancy')}
              </span>
            )}

            {/* Quick Metrics Pills */}
            <div className="flex items-center gap-2 bg-[#050a14] border border-slate-800 px-3 py-1 rounded-xl text-[10px] font-mono">
              <span className="text-slate-400">{t('Mean Δ2θ')}:</span>
              <span className={`font-bold ${analysis.meanShift > 0 ? 'text-amber-400' : analysis.meanShift < 0 ? 'text-cyan-400' : 'text-slate-200'}`}>
                {analysis.meanShift > 0 ? `+${analysis.meanShift.toFixed(3)}°` : `${analysis.meanShift.toFixed(3)}°`}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-[#050a14] border border-slate-800 px-3 py-1 rounded-xl text-[10px] font-mono">
              <span className="text-slate-400">{t('Microstrain (ε)')}:</span>
              <span className={`font-bold ${Math.abs(analysis.avgStrain) > 0.05 ? 'text-purple-400' : 'text-slate-200'}`}>
                {analysis.avgStrain > 0 ? `+${analysis.avgStrain.toFixed(3)}%` : `${analysis.avgStrain.toFixed(3)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Live Alignment & Scale Quick Controls Strip */}
        <div className="bg-[#030712]/90 border border-slate-800/80 p-3 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MoveHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              {t('2θ Alignment')}:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShiftTwoTheta(s => Number((s - 0.05).toFixed(2)))}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all"
                title="Shift -0.05° 2θ"
              >-0.05°</button>
              <button
                onClick={() => setShiftTwoTheta(s => Number((s - 0.01).toFixed(2)))}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all"
                title="Shift -0.01° 2θ"
              >-0.01°</button>
              <div className="px-2.5 py-1 bg-indigo-950/60 border border-indigo-800/50 rounded font-bold text-indigo-300 text-[11px] min-w-[65px] text-center">
                {shiftTwoTheta > 0 ? `+${shiftTwoTheta.toFixed(2)}°` : `${shiftTwoTheta.toFixed(2)}°`}
              </div>
              <button
                onClick={() => setShiftTwoTheta(s => Number((s + 0.01).toFixed(2)))}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all"
                title="Shift +0.01° 2θ"
              >+0.01°</button>
              <button
                onClick={() => setShiftTwoTheta(s => Number((s + 0.05).toFixed(2)))}
                className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all"
                title="Shift +0.05° 2θ"
              >+0.05°</button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                {t('Ref Scale')}:
              </span>
              <div className="flex items-center gap-1">
                {[0.5, 1.0, 1.5, 2.0].map(sVal => (
                  <button
                    key={sVal}
                    onClick={() => setScaleSampleB(sVal)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      scaleSampleB === sVal
                        ? 'bg-emerald-500 text-black font-black'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {sVal.toFixed(1)}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAutoAlign}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
                title="Automatically match dominant peak 2θ offset and scale"
              >
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span>{t('Auto Align')}</span>
              </button>
              <button
                onClick={handleResetAlign}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
                title="Reset Shift & Scale"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Plain-English AI Synthesis Card */}
        <div className="bg-[#030712] border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-start gap-3.5 relative overflow-hidden">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shrink-0 mt-0.5">
            <Lightbulb className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded font-mono border ${plainEnglishSummary.badgeClass}`}>
                {plainEnglishSummary.badge}
              </span>
              <h4 className="text-xs font-bold text-white font-mono">
                {plainEnglishSummary.title}
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {plainEnglishSummary.description}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              {plainEnglishSummary.bullets.map((b, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnostics View Mode Switcher Ribbon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#030712] border border-slate-800 p-2 rounded-xl text-xs font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setDiagViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                diagViewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{t('3-Column Diagnostics')}</span>
            </button>

            <button
              onClick={() => setDiagViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                diagViewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t('Indexed Peak Table')}</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-slate-900 text-indigo-300 rounded font-black border border-indigo-500/30">
                {analysis.indexedPeaks.length}
              </span>
            </button>

            <button
              onClick={() => setDiagViewMode('quant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                diagViewMode === 'quant'
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t('Phase Fraction Estimate')}</span>
            </button>
          </div>

          {diagViewMode === 'table' && (
            <div className="relative w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                value={tableSearchFilter}
                onChange={(e) => setTableSearchFilter(e.target.value)}
                placeholder={t('Filter peaks...')}
                className="bg-black/60 border border-slate-800 text-slate-200 text-[10px] pl-8 pr-3 py-1.5 rounded-lg outline-none focus:border-indigo-500/50 w-full sm:w-48 font-mono"
              />
            </div>
          )}
        </div>

        {/* Dynamic Diagnostics Content Render Scope */}
        {diagViewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Column 1: Position Shift Analysis */}
            <div className="bg-[#030712]/80 p-4 border border-slate-800/90 rounded-xl space-y-3 flex flex-col justify-between group/card hover:border-amber-500/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                    <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-wider">{t('Position Shift Analysis')}</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                    {analysis.shifts.length} {t('peaks')}
                  </span>
                </div>
                
                <div className="h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                  {analysis.shifts.length > 0 ? (
                    analysis.shifts.map((s, idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-center bg-slate-900/80 hover:bg-amber-950/30 p-2 rounded-lg border border-slate-800 hover:border-amber-500/30 transition-all group/item"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => zoomToTheta(s.peak)}
                            className="p-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded transition-colors"
                            title={`Click to zoom chart to 2θ = ${s.peak.toFixed(2)}°`}
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-mono font-bold text-slate-200">2θ ≈ {s.peak.toFixed(2)}°</span>
                        </div>
                        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded ${
                          s.shift > 0 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {s.shift > 0 ? `+${s.shift.toFixed(3)}°` : `${s.shift.toFixed(3)}°`}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 h-full text-[10px] italic py-6 text-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500/60 mb-1" />
                      <span>{t('No systematic peak shifts detected')}</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800/60">
                {t('Systematic shifts indicate lattice parameter changes caused by substitution, solid solutions, thermal expansion or microstrain.')}
              </p>
            </div>

            {/* Column 2: Suppressed / Missing Peaks */}
            <div className="bg-[#030712]/80 p-4 border border-slate-800/90 rounded-xl space-y-3 flex flex-col justify-between group/card hover:border-rose-500/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                    <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-wider">{t('Suppressed / Missing')}</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                    {analysis.missingInA.length} {t('ref peaks')}
                  </span>
                </div>

                <div className="h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                  {analysis.missingInA.length > 0 ? (
                    analysis.missingInA.map((theta, idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-center bg-slate-900/80 hover:bg-rose-950/30 p-2 rounded-lg border border-slate-800 hover:border-rose-500/30 transition-all group/item"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => zoomToTheta(theta)}
                            className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition-colors"
                            title={`Click to zoom chart to 2θ = ${theta.toFixed(2)}°`}
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{t('Ref Peak')}</span>
                        </div>
                        <span className="text-[10px] font-black font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">
                          2θ = {theta.toFixed(2)}°
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 h-full text-[10px] italic py-6 text-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500/60 mb-1" />
                      <span>{t('All reference reflections observed')}</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800/60">
                {t('Missing reference peaks point to preferred orientation (texture), low crystallinity, nanostructured peak broadening, or extinct reflections.')}
              </p>
            </div>

            {/* Column 3: Impurities / Extra Peaks */}
            <div className="bg-[#030712]/80 p-4 border border-slate-800/90 rounded-xl space-y-3 flex flex-col justify-between group/card hover:border-indigo-500/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                    <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-wider">{t('Extra / Impurity Peaks')}</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                    {analysis.extraInA.length} {t('extra')}
                  </span>
                </div>

                <div className="h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                  {analysis.extraInA.length > 0 ? (
                    analysis.extraInA.map((theta, idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-center bg-slate-900/80 hover:bg-indigo-950/30 p-2 rounded-lg border border-slate-800 hover:border-indigo-500/30 transition-all group/item"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => zoomToTheta(theta)}
                            className="p-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded transition-colors"
                            title={`Click to zoom chart to 2θ = ${theta.toFixed(2)}°`}
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{t('Atypical')}</span>
                        </div>
                        <span className="text-[10px] font-black font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded">
                          2θ = {theta.toFixed(2)}°
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 h-full text-[10px] italic py-6 text-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500/60 mb-1" />
                      <span>{t('No unindexed secondary phase peaks')}</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800/60">
                {t('Atypical extra reflections indicate unreacted raw precursors, secondary crystalline phase formation, or sample impurities.')}
              </p>
            </div>

          </div>
        )}

        {/* Tab View 2: Full Indexed Peak Table */}
        {diagViewMode === 'table' && (
          <div className="bg-[#030712] border border-slate-800 rounded-xl overflow-hidden font-mono text-xs shadow-inner">
            <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#080d1a] border-b border-slate-800 sticky top-0 z-10 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5 text-center">#</th>
                    <th className="p-2.5">Exp 2θ (°)</th>
                    <th className="p-2.5">Ref 2θ (°)</th>
                    <th className="p-2.5">Shift Δ2θ (°)</th>
                    <th className="p-2.5">Exp d-Spacing (Å)</th>
                    <th className="p-2.5">Ref d-Spacing (Å)</th>
                    <th className="p-2.5">Int A (%)</th>
                    <th className="p-2.5">Int B (%)</th>
                    <th className="p-2.5">Indexing Status</th>
                    <th className="p-2.5 text-center">Zoom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px] text-slate-300">
                  {analysis.indexedPeaks
                    .filter(p => {
                      if (!tableSearchFilter) return true;
                      const search = tableSearchFilter.toLowerCase();
                      return (
                        p.twoThetaA.toString().includes(search) ||
                        (p.twoThetaB && p.twoThetaB.toString().includes(search)) ||
                        p.status.toLowerCase().includes(search) ||
                        p.dSpacingA.includes(search)
                      );
                    })
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-indigo-950/20 transition-colors">
                        <td className="p-2.5 text-center text-slate-500 font-bold">{p.id}</td>
                        <td className="p-2.5 font-bold text-slate-100">
                          {p.twoThetaA > 0 ? `${p.twoThetaA.toFixed(2)}°` : '-'}
                        </td>
                        <td className="p-2.5 text-emerald-400 font-bold">
                          {p.twoThetaB ? `${p.twoThetaB.toFixed(2)}°` : '-'}
                        </td>
                        <td className="p-2.5 font-bold">
                          {p.shift !== null ? (
                            <span className={p.shift > 0 ? 'text-amber-400' : p.shift < 0 ? 'text-cyan-400' : 'text-slate-400'}>
                              {p.shift > 0 ? `+${p.shift.toFixed(3)}°` : `${p.shift.toFixed(3)}°`}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-2.5 text-slate-400">{p.dSpacingA}</td>
                        <td className="p-2.5 text-slate-400">{p.dSpacingB}</td>
                        <td className="p-2.5 text-slate-300">{p.intensityA}%</td>
                        <td className="p-2.5 text-emerald-400">{p.intensityB}%</td>
                        <td className="p-2.5">
                          {p.status === 'matched' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Matched
                            </span>
                          )}
                          {p.status === 'shifted' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Shifted
                            </span>
                          )}
                          {p.status === 'extra' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                              Unindexed
                            </span>
                          )}
                          {p.status === 'missing' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              Suppressed
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => zoomToTheta(p.twoThetaA || p.twoThetaB || 30)}
                            className="p-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded transition-colors inline-flex items-center"
                            title="Zoom Chart to this 2θ position"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab View 3: Phase Fraction & Purity Estimator */}
        {diagViewMode === 'quant' && (
          <div className="bg-[#030712] border border-slate-800 p-5 rounded-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{t('Semi-Quantitative Phase Composition Estimate')}</h4>
                  <p className="text-[10px] text-slate-400">{t('Relative integrated intensity scaling ratio for main phase vs impurity reflections')}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase rounded">
                RIR Model
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-indigo-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  {materialA?.name} ({t('Primary Indexed Phase')}): {analysis.primaryPhasePurity}%
                </span>
                <span className="text-rose-400 flex items-center gap-1.5">
                  {materialB?.name} / {t('Unindexed Reflections')}: {analysis.secondaryPhaseEst}%
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                </span>
              </div>

              {/* Progress Dual Bar */}
              <div className="w-full h-4 bg-slate-900 rounded-full border border-slate-800 overflow-hidden flex shadow-inner">
                <div 
                  style={{ width: `${analysis.primaryPhasePurity}%` }} 
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500 flex items-center justify-center text-[9px] font-black text-white"
                >
                  {analysis.primaryPhasePurity >= 15 ? `${analysis.primaryPhasePurity}%` : ''}
                </div>
                <div 
                  style={{ width: `${analysis.secondaryPhaseEst}%` }} 
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500 flex items-center justify-center text-[9px] font-black text-white"
                >
                  {analysis.secondaryPhaseEst >= 15 ? `${analysis.secondaryPhaseEst}%` : ''}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] text-slate-300 leading-relaxed">
              <div className="bg-[#080d1a] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-indigo-400 font-bold uppercase text-[10px]">{t('Interpretation & Quality')}</span>
                <p className="text-slate-400 text-[10px]">
                  • High primary phase purity ({analysis.primaryPhasePurity}%) denotes clean crystallization without major secondary phase precipitation.
                  <br />
                  • For precise Rietveld refinement, import full CIF structural parameters.
                </p>
              </div>
              <div className="bg-[#080d1a] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold uppercase text-[10px]">{t('Quantitative Actionable Advice')}</span>
                <p className="text-slate-400 text-[10px]">
                  • {analysis.secondaryPhaseEst > 0 
                      ? `Investigate unindexed peaks at 2θ positions ${analysis.extraInA.slice(0, 3).map(t => t.toFixed(2) + '°').join(', ')} to identify secondary phases.`
                      : 'No secondary phase impurity reflections detected.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          Visual Spectral Diff/Compare Charts
          ---------------------------------------------------- */}
      <div className="bg-[#050A14] border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden group space-y-6">
        
        {/* Custom Background Graphic */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
          <img src={spectralDiffBg} alt="Spectral Overlay Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-[#050A14]/40" />
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700 pointer-events-none" />

        {/* Header Title & Badges */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="relative group/icon cursor-default">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover/icon:bg-indigo-400/30 transition-all duration-700 pointer-events-none" />
              <div className="w-14 h-14 bg-[#080d1a] rounded-2xl border border-indigo-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] group-hover/icon:border-indigo-400 transition-colors duration-500 overflow-hidden">
                <Layers className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)] group-hover/icon:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <span>{t('Spectral Diff Overlay')}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-widest">
                  v2.0 HUD
                </span>
              </h3>
              <p className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-[pulse_2s_ease-in-out_infinite]" />
                {t('Experimental (Sample A) vs Reference (Sample B) & Intensity Residuals')}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="bg-[#030712]/80 backdrop-blur-xl border-l-2 border-l-rose-500 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-8 h-8 text-rose-500" />
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-0.5">Residual R_p</span>
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-mono font-black text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">{spectralMetrics.rP}</span>
                <span className="text-[10px] font-mono text-rose-500/70 font-bold mb-1">%</span>
              </div>
            </div>
            
            <div className="bg-[#030712]/80 backdrop-blur-xl border-l-2 border-l-amber-500 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Layers3 className="w-8 h-8 text-amber-500" />
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-0.5">Weighted R_wp</span>
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-mono font-black text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">{spectralMetrics.rWP}</span>
                <span className="text-[10px] font-mono text-amber-500/70 font-bold mb-1">%</span>
              </div>
            </div>

            <div className="bg-[#030712]/80 backdrop-blur-xl border-l-2 border-l-emerald-500 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-8 h-8 text-emerald-500" />
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-0.5">Cross-Corr (r)</span>
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-mono font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">{spectralMetrics.pearsonR}</span>
                <span className="text-[10px] font-mono text-emerald-500/70 font-bold mb-1">%</span>
              </div>
            </div>

            <div className="bg-[#030712]/80 backdrop-blur-xl border-l-2 border-l-cyan-500 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-8 h-8 text-cyan-500" />
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-0.5">RMS Error</span>
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-mono font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">{spectralMetrics.rmsd}</span>
                <span className="text-[10px] font-mono text-cyan-500/70 font-bold mb-1">cnt</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 bg-[#080E1C]/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800">
          
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-[#030712] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('stacked')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                viewMode === 'stacked' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers3 className="w-3.5 h-3.5" />
              <span>3-Pane Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                viewMode === 'unified' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Unified Overlay</span>
            </button>
            <button
              onClick={() => setViewMode('mirrored')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                viewMode === 'mirrored' 
                  ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Butterfly Mirror</span>
            </button>
            <button
              onClick={() => setViewMode('derivative')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                viewMode === 'derivative' 
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>Derivative dI/d2θ</span>
            </button>
          </div>

          {/* Theme & Display Options */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Color Palette Selector */}
            <div className="flex items-center gap-1 bg-[#030712] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setDiffTheme('neon')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  diffTheme === 'neon' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Neon
              </button>
              <button
                onClick={() => setDiffTheme('emerald')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  diffTheme === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Emerald
              </button>
              <button
                onClick={() => setDiffTheme('amber')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                  diffTheme === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Amber
              </button>
            </div>

            {/* Grid Toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors ${
                showGrid ? 'bg-slate-800 text-cyan-400 border-cyan-500/30' : 'bg-[#030712] text-slate-500 border-slate-800'
              }`}
              title="Toggle Gridlines"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Diff Fill Toggle */}
            <button
              onClick={() => setShowDiffArea(!showDiffArea)}
              className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors ${
                showDiffArea ? 'bg-slate-800 text-amber-400 border-amber-500/30' : 'bg-[#030712] text-slate-500 border-slate-800'
              }`}
              title="Toggle Diff Area Fill"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Export CSV */}
            <button
              onClick={() => {
                if (!points || points.length === 0) return;
                const headers = "2Theta_deg,Intensity_A_Exp,Intensity_B_Ref,Delta_Residual\n";
                const rows = points.map(p => `${p.twoTheta},${p.intensityA},${p.intensityB},${p.difference}`).join('\n');
                const blob = new Blob([headers + rows], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `spectral_diff_${materialA.name.replace(/\s+/g, '_')}_vs_${materialB.name.replace(/\s+/g, '_')}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase border border-indigo-500/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Zoom Controls */}
            {isZoomedIn && (
              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
                <button onClick={panLeft} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Pan Left')}>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={panRight} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Pan Right')}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomInStep} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Zoom In')}>
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomOutStep} className="p-1.5 bg-slate-800 hover:bg-indigo-500/30 text-indigo-300 rounded-lg transition-colors border border-slate-700" title={t('Zoom Out')}>
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button onClick={zoomOut} className="flex items-center gap-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border border-indigo-500/30" title={t('Reset')}>
                  <RotateCcw className="w-3 h-3" />
                  {t('Reset')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Peak Calibration & Alignment Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10 bg-[#080E1C]/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800/90">
          
          {/* 2θ Shift / Calibration Zero Error */}
          <div className="space-y-1 bg-[#030712] p-2.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <MoveHorizontal className="w-3.5 h-3.5" />
                2θ Shift Offset
              </span>
              <span className="text-white font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                {shiftTwoTheta >= 0 ? `+${shiftTwoTheta.toFixed(2)}°` : `${shiftTwoTheta.toFixed(2)}°`}
              </span>
            </div>
            <input 
              type="range"
              min="-2.0"
              max="2.0"
              step="0.02"
              value={shiftTwoTheta}
              onChange={(e) => setShiftTwoTheta(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 hover:accent-cyan-300 h-1.5 bg-slate-800 appearance-none rounded cursor-pointer"
            />
          </div>

          {/* Sample B Relative Scale Factor */}
          <div className="space-y-1 bg-[#030712] p-2.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Scale className="w-3.5 h-3.5" />
                Sample B Scale (I_B)
              </span>
              <span className="text-white font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                {scaleSampleB.toFixed(2)}x
              </span>
            </div>
            <input 
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={scaleSampleB}
              onChange={(e) => setScaleSampleB(parseFloat(e.target.value))}
              className="w-full accent-amber-400 hover:accent-amber-300 h-1.5 bg-slate-800 appearance-none rounded cursor-pointer"
            />
          </div>

          {/* Auto-Align & Reset Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoAlign}
              className="flex-1 h-full min-h-[46px] flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
              title="Auto-match strongest peak intensity and zero offset"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Align Peaks</span>
            </button>
            <button
              onClick={handleResetAlign}
              className="h-full min-h-[46px] px-3 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[10px] font-mono font-bold transition-all active:scale-95"
              title="Reset 2θ shift and scale"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Derivative Mode & Threshold Controls */}
          <div className="flex items-center justify-between gap-2 bg-[#030712] p-2.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setShowDerivative(!showDerivative)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                showDerivative ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              title="Display 1st derivative dI/d2Theta curve"
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>Derivative dI/d2θ</span>
            </button>
            
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-mono text-slate-500 font-bold uppercase">Threshold</span>
              <select
                value={noiseThreshold}
                onChange={(e) => setNoiseThreshold(Number(e.target.value))}
                className="bg-slate-900 text-cyan-400 border border-slate-700 rounded px-1.5 py-1 text-[9px] font-mono font-bold focus:outline-none"
              >
                <option value={5}>5%</option>
                <option value={8}>8%</option>
                <option value={10}>10%</option>
                <option value={15}>15%</option>
                <option value={20}>20%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top Discrepancy Peaks (Residual Mismatches Jump Bar) */}
        {topMismatches.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative z-10 bg-gradient-to-r from-rose-950/40 to-[#080E1C]/80 backdrop-blur-md px-4 py-3 rounded-xl border border-rose-500/30 shadow-[0_4px_20px_rgba(244,63,94,0.1)]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-500/20 rounded-lg border border-rose-500/30 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-300">
                  Critical Mismatches
                </span>
                <span className="text-[9px] font-mono text-rose-400/70">
                  Δ &gt; {noiseThreshold}% intensity diff
                </span>
              </div>
            </div>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {topMismatches.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => zoomToTheta(m.twoTheta)}
                  className="group flex items-center gap-2 bg-[#050A14] hover:bg-rose-950/50 border border-slate-700 hover:border-rose-500/50 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
                  title={`Click to zoom to 2θ = ${m.twoTheta}°`}
                >
                  <Crosshair className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 transition-colors" />
                  <span className="text-slate-300 group-hover:text-white transition-colors">{m.twoTheta}°</span>
                  <div className="h-3.5 w-[1px] bg-slate-700 group-hover:bg-rose-500/30 mx-0.5" />
                  <span className={`font-black ${m.difference > 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {m.difference > 0 ? `+${m.difference}` : m.difference}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Display Stage */}
        <div className="w-full relative z-10 select-none bg-[#030712] p-4 rounded-2xl border border-slate-800 shadow-inner flex flex-col gap-4 min-h-[640px]">
          
          {/* Active Palette Config */}
          {(() => {
            const paletteMap = {
              neon: { colorA: '#f43f5e', colorB: '#06b6d4', colorDiff: '#f59e0b' },
              emerald: { colorA: '#10b981', colorB: '#a855f7', colorDiff: '#3b82f6' },
              amber: { colorA: '#fbbf24', colorB: '#6366f1', colorDiff: '#f43f5e' }
            };
            const pal = paletteMap[diffTheme];

            // Custom Tooltip component inside render scope
            const RenderTooltip = ({ active, payload, label }: any) => {
              if (active && payload && payload.length) {
                const twoTheta = label;
                const lambda = 1.5406;
                const thetaRad = (twoTheta / 2) * (Math.PI / 180);
                const dSpacing = thetaRad > 0 ? (lambda / (2 * Math.sin(thetaRad))).toFixed(4) : 'N/A';

                const valA = payload.find((p: any) => p.dataKey === 'intensityA')?.value;
                const valB = payload.find((p: any) => p.dataKey === 'intensityB')?.value;
                const valDiff = payload.find((p: any) => p.dataKey === 'difference')?.value;
                const valMirroredB = payload.find((p: any) => p.dataKey === 'mirroredB')?.value;
                const valDerivA = payload.find((p: any) => p.dataKey === 'derivA')?.value;
                const valDerivB = payload.find((p: any) => p.dataKey === 'derivB')?.value;

                return (
                  <div className="bg-[#050A14]/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs font-mono space-y-1.5 z-50 min-w-[210px]">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1">
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">2θ Angle</span>
                      <span className="text-cyan-400 font-black text-sm">{twoTheta}°</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">d-spacing:</span>
                      <span className="text-slate-200 font-bold">{dSpacing} Å</span>
                    </div>
                    {valA !== undefined && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorA }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorA }} />
                          Sample A (Exp):
                        </span>
                        <span className="font-bold text-white">{valA} %</span>
                      </div>
                    )}
                    {valB !== undefined && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          Sample B (Ref):
                        </span>
                        <span className="font-bold text-white">{valB} %</span>
                      </div>
                    )}
                    {valMirroredB !== undefined && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          Sample B (Ref):
                        </span>
                        <span className="font-bold text-white">{Math.abs(valMirroredB)} %</span>
                      </div>
                    )}
                    {valDiff !== undefined && (
                      <div className="flex justify-between items-center text-[11px] border-t border-slate-800/80 pt-1 mt-1">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: pal.colorDiff }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorDiff }} />
                          Δ Residual:
                        </span>
                        <span className={`font-black ${valDiff > 0 ? 'text-rose-400' : valDiff < 0 ? 'text-cyan-400' : 'text-slate-300'}`}>
                          {valDiff > 0 ? `+${valDiff}` : valDiff} %
                        </span>
                      </div>
                    )}
                    {valDerivA !== undefined && (
                      <div className="flex justify-between items-center text-[10px] border-t border-slate-800/80 pt-1 mt-1 text-indigo-300 font-mono">
                        <span>dI_A/d2θ:</span>
                        <span className="font-bold">{valDerivA}</span>
                      </div>
                    )}
                    {valDerivB !== undefined && (
                      <div className="flex justify-between items-center text-[10px] text-cyan-300 font-mono">
                        <span>dI_B/d2θ:</span>
                        <span className="font-bold">{valDerivB}</span>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            };

            if (viewMode === 'unified') {
              return (
                <div className="w-full flex flex-col gap-4">
                  {/* Spectral Diff Overlay Control Ribbon */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#080d1a] border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">{t('Spectral Overlay Controls')}:</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setShowPosNegDiff(!showPosNegDiff)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          showPosNegDiff 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
                            : 'bg-[#030712] text-slate-500 border border-slate-800'
                        }`}
                        title="Highlight positive (+A excess in Rose) and negative (-B deficit in Cyan) spectrum gaps"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                        <span>{t('Split +/- Diff Fill')}</span>
                      </button>

                      <button
                        onClick={() => setShowToleranceBand(!showToleranceBand)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          showToleranceBand 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                            : 'bg-[#030712] text-slate-500 border border-slate-800'
                        }`}
                        title="Toggle ±5% Noise Corridor envelope around Reference B"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span>{t('±5% Noise Envelope')}</span>
                      </button>

                      <button
                        onClick={() => setShowBraggLines(!showBraggLines)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          showBraggLines 
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                            : 'bg-[#030712] text-slate-500 border border-slate-800'
                        }`}
                        title="Toggle vertical Bragg peak markers for Reference B"
                      >
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span>{t('Bragg Position Lines')}</span>
                      </button>

                      <button
                        onClick={() => setRefLineStyle(refLineStyle === 'dashed' ? 'solid' : 'dashed')}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#030712] hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[10px] font-bold uppercase transition-colors"
                        title="Toggle reference curve stroke style"
                      >
                        <span>{t('Ref Stroke')}:</span>
                        <span className="text-indigo-400">{refLineStyle.toUpperCase()}</span>
                      </button>
                    </div>
                  </div>

                  {/* Discrepancy Peaks Navigator Pill Ribbon */}
                  {topMismatches.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[10px] font-mono scrollbar-none">
                      <span className="text-slate-500 font-bold uppercase shrink-0 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        {t('Major Peak Discrepancies')}:
                      </span>
                      {topMismatches.map((m, idx) => (
                        <button
                          key={idx}
                          onClick={() => zoomToTheta(m.twoTheta)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold shrink-0 transition-all active:scale-95 ${
                            m.difference > 0
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          <span>2θ = {m.twoTheta}°</span>
                          <span className="font-black">({m.difference > 0 ? `+${m.difference}` : m.difference}%)</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Single Unified Chart */}
                  <div className="w-full h-[420px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col shadow-xl">
                    <div className="flex items-center justify-between mb-2 z-10 px-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorA }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                          {t('Sample A')}: {materialA.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          {t('Sample B')}: {materialB?.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {t('Spectral Diff Overlay Active')}
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        <defs>
                          <linearGradient id="posDiffGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="negDiffGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="toleranceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="colorA_unified" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={pal.colorA} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={pal.colorA} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorB_unified" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={pal.colorB} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={pal.colorB} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis 
                          dataKey="twoTheta" 
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow={true}
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          domain={[0, 110]} 
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: t('Counts [%]'), angle: -90, position: 'insideTopLeft', fill: '#94a3b8', fontSize: 10, dy: 20, dx: 10 }}
                        />
                        <Tooltip content={<RenderTooltip />} />

                        {/* Tolerance Envelope Corridor */}
                        {showToleranceBand && (
                          <Area type="monotone" dataKey="toleranceUpper" fill="url(#toleranceGrad)" stroke="none" />
                        )}

                        {/* Split Positive & Negative Difference Fills */}
                        {showPosNegDiff ? (
                          <>
                            <Area type="monotone" dataKey="posDiff" fill="url(#posDiffGrad)" stroke="none" />
                            <Area type="monotone" dataKey="negDiff" fill="url(#negDiffGrad)" stroke="none" />
                          </>
                        ) : showDiffArea ? (
                          <>
                            <Area type="monotone" dataKey="intensityA" fill="url(#colorA_unified)" stroke="none" />
                            <Area type="monotone" dataKey="intensityB" fill="url(#colorB_unified)" stroke="none" />
                          </>
                        ) : null}

                        {/* Primary Diffraction Lines */}
                        <Line 
                          type="monotone" 
                          dataKey="intensityA" 
                          stroke={pal.colorA} 
                          strokeWidth={2.5} 
                          dot={false} 
                          isAnimationActive={false} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="intensityB" 
                          stroke={pal.colorB} 
                          strokeWidth={2} 
                          strokeDasharray={refLineStyle === 'dashed' ? '5 3' : undefined} 
                          dot={false} 
                          isAnimationActive={false} 
                        />

                        {/* Bragg Position Indicators */}
                        {showBraggLines && peaksBWithShift?.map((p: any, idx: number) => (
                          <ReferenceLine 
                            key={idx} 
                            x={p.twoTheta} 
                            stroke={pal.colorB} 
                            strokeDasharray="2 2" 
                            strokeOpacity={0.5} 
                            label={{ 
                              value: p.hkl ? `(${p.hkl})` : `${p.twoTheta}°`, 
                              position: 'top', 
                              fill: pal.colorB, 
                              fontSize: 9, 
                              fontFamily: 'monospace' 
                            }} 
                          />
                        ))}

                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Residual Lower Pane */}
                  <div className="w-full h-[200px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col shadow-xl">
                    <div className="flex items-center justify-between mb-1 z-10 px-2">
                      <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {t('Δ Residual Profile (I_SampleA - I_SampleB)')}
                      </span>
                      <span className="text-[9px] font-mono text-rose-400 font-bold uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        {t('Diff Residual Spectrum')}
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 10, right: 15, bottom: 20, left: 10 }}
                        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        <defs>
                          <linearGradient id="colorDiff_unified" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={pal.colorDiff} stopOpacity={0.45} />
                            <stop offset="95%" stopColor={pal.colorDiff} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis 
                          dataKey="twoTheta" 
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow={true}
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <YAxis 
                          domain={[-100, 100]} 
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3"/>
                        <ReferenceLine y={10} stroke="#f43f5e" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.4} />
                        <ReferenceLine y={-10} stroke="#06b6d4" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.4} />

                        {showDiffArea && (
                          <Area type="monotone" dataKey="difference" fill="url(#colorDiff_unified)" stroke="none" />
                        )}
                        <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={2} dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }

            if (viewMode === 'mirrored') {
              return (
                <div className="w-full flex flex-col gap-4">
                  {/* Butterfly Mirrored Chart */}
                  <div className="w-full h-[450px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-2 z-10 px-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorA }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                          {t('Sample A (Exp - Upward)')}: {materialA.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          {t('Sample B (Ref - Downward)')}: {materialB?.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-400/80 font-bold uppercase tracking-widest">Butterfly Mirrored Mode</span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        <defs>
                          <linearGradient id="colorA_mirrored" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={pal.colorA} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={pal.colorA} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorB_mirrored" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="5%" stopColor={pal.colorB} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={pal.colorB} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis 
                          dataKey="twoTheta" 
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow={true}
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          domain={[-110, 110]} 
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                        {showDiffArea && (
                          <>
                            <Area type="monotone" dataKey="intensityA" fill="url(#colorA_mirrored)" stroke="none" />
                            <Area type="monotone" dataKey="mirroredB" fill="url(#colorB_mirrored)" stroke="none" />
                          </>
                        )}
                        <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="mirroredB" stroke={pal.colorB} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Residual Lower Pane */}
                  <div className="w-full h-[180px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-1 z-10 px-2">
                      <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('Δ Residual Profile (I_SampleA - I_SampleB)')}
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 10, right: 15, bottom: 20, left: 10 }}
                        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                        <YAxis domain={[-100, 100]} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                        {showDiffArea && (
                          <Area type="monotone" dataKey="difference" fill={pal.colorDiff} fillOpacity={0.15} stroke="none" />
                        )}
                        <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }

            if (viewMode === 'derivative') {
              return (
                <div className="w-full flex flex-col gap-4">
                  {/* 1st Derivative Spectrogram Comparison */}
                  <div className="w-full h-[450px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-2 z-10 px-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorA }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                          dI_A/d2θ ({materialA.name})
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorB }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                          dI_B/d2θ ({materialB?.name})
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-widest bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                        1st Derivative Mode
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        <defs>
                          <linearGradient id="colorA_deriv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={pal.colorA} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={pal.colorA} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorB_deriv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={pal.colorB} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={pal.colorB} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis 
                          dataKey="twoTheta" 
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow={true}
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                          label={{ value: 'dI / d(2Theta)', angle: -90, position: 'insideTopLeft', fill: '#94a3b8', fontSize: 10, dy: 20, dx: 10 }}
                        />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} strokeDasharray="2 2" />
                        <Area type="monotone" dataKey="derivA" fill="url(#colorA_deriv)" stroke="none" />
                        <Area type="monotone" dataKey="derivB" fill="url(#colorB_deriv)" stroke="none" />
                        <Line type="monotone" dataKey="derivA" stroke={pal.colorA} strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="derivB" stroke={pal.colorB} strokeWidth={2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#a855f7" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Residual Lower Pane */}
                  <div className="w-full h-[180px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                    <div className="flex items-center justify-between mb-1 z-10 px-2">
                      <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('Δ Residual Intensity Profile')}
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        syncId="compareSync"
                        data={points}
                        margin={{ top: 10, right: 15, bottom: 20, left: 10 }}
                        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                        onMouseUp={zoom}
                        onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                      >
                        <defs>
                          <linearGradient id="colorDiff_deriv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={pal.colorDiff} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={pal.colorDiff} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                        <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                        <YAxis domain={[-100, 100]} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                        <Tooltip content={<RenderTooltip />} />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                        {showDiffArea && (
                          <Area type="monotone" dataKey="difference" fill="url(#colorDiff_deriv)" stroke="none" />
                        )}
                        <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={2} dot={false} isAnimationActive={false} />
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#a855f7" fillOpacity={0.25} />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }

            // Default Stacked 3-Pane View
            return (
              <div className="w-full flex flex-col gap-3">
                {/* Pane 1: Sample A */}
                <div className="w-full h-[220px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                  <div className="flex items-center justify-between mb-1 z-10 px-2">
                    <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorA }}>
                      <FlaskConical className="w-3.5 h-3.5" />
                      {t('Sample A (Experimental)')}: {materialA.name} {materialA.formula && '[' + materialA.formula + ']'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 1</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      syncId="compareSync"
                      data={points}
                      margin={{ top: 10, right: 15, bottom: 15, left: 10 }}
                      onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                      onMouseUp={zoom}
                      onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                    >
                      <defs>
                        <linearGradient id="colorA_stacked" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={pal.colorA} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={pal.colorA} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                      <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <Tooltip content={<RenderTooltip />} />
                      {showDiffArea && <Area type="monotone" dataKey="intensityA" fill="url(#colorA_stacked)" stroke="none" />}
                      <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2} dot={false} isAnimationActive={false} />
                      {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                      ) : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Pane 2: Sample B */}
                <div className="w-full h-[220px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                  <div className="flex items-center justify-between mb-1 z-10 px-2">
                    <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorB }}>
                      <Database className="w-3.5 h-3.5" />
                      {t('Sample B (Reference)')}: {materialB?.name} {materialB?.formula && '[' + materialB?.formula + ']'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 2</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      syncId="compareSync"
                      data={points}
                      margin={{ top: 10, right: 15, bottom: 15, left: 10 }}
                      onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                      onMouseUp={zoom}
                      onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                    >
                      <defs>
                        <linearGradient id="colorB_stacked" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={pal.colorB} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={pal.colorB} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                      <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <Tooltip content={<RenderTooltip />} />
                      {showDiffArea && <Area type="monotone" dataKey="intensityB" fill="url(#colorB_stacked)" stroke="none" />}
                      <Line type="monotone" dataKey="intensityB" stroke={pal.colorB} strokeWidth={2} dot={false} isAnimationActive={false} />
                      {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                      ) : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Pane 3: Residual Curve */}
                <div className="w-full h-[200px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
                  <div className="flex items-center justify-between mb-1 z-10 px-2">
                    <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      {t('Δ Residual Profile (I_SampleA - I_SampleB)')}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 3</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      syncId="compareSync"
                      data={points}
                      margin={{ top: 10, right: 15, bottom: 25, left: 10 }}
                      onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
                      onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                      onMouseUp={zoom}
                      onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                    >
                      <defs>
                        <linearGradient id="colorDiff_stacked" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={pal.colorDiff} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={pal.colorDiff} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                      <XAxis 
                        dataKey="twoTheta" 
                        type="number"
                        domain={[left, right]}
                        allowDataOverflow={true}
                        tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                        axisLine={{ stroke: '#334155' }}
                        tickLine={{ stroke: '#334155' }}
                        label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                      />
                      <YAxis domain={[-100, 100]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                      <Tooltip content={<RenderTooltip />} />
                      <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                      {showDiffArea && (
                        <Area type="monotone" dataKey="difference" fill="url(#colorDiff_stacked)" stroke="none" />
                      )}
                      <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={2} dot={false} isAnimationActive={false} />
                      {refAreaLeft && refAreaRight ? (
                        <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                      ) : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Interactive Guide & Interpretation Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#080d1a] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t('How to Interpret XRD Compare & Residuals')}</h3>
                  <p className="text-xs text-slate-400 font-mono">{t('Crystallographic Match & Diagnostics User Guide')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-mono">
              <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[11px]">
                  <Activity className="w-4 h-4" />
                  <span>1. Quantitative Residual Metrics (Rp, Rwp, Pearson r)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • <strong className="text-rose-400">Profile Residual (Rp):</strong> Sum of absolute differences |I_A - I_B| divided by total intensity. Values below 10-15% denote excellent profile agreement.
                  <br />
                  • <strong className="text-amber-400">Weighted Profile Residual (Rwp):</strong> Gives higher statistical weight to strong diffraction peaks.
                  <br />
                  • <strong className="text-emerald-400">Pearson Cross-Correlation (r):</strong> Measure of shape and peak profile alignment. Values &gt; 95% indicate strong phase identity.
                </p>
              </div>

              <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px]">
                  <MoveHorizontal className="w-4 h-4" />
                  <span>2. Position Shifts (Δ2θ) & Lattice Strain</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • A positive shift (+Δ2θ) indicates unit cell contraction (smaller d-spacing), often caused by smaller ionic substitutions or compressive stress.
                  <br />
                  • A negative shift (-Δ2θ) indicates unit cell expansion (larger d-spacing).
                  <br />
                  • Click <strong className="text-amber-300">Auto Align</strong> to compensate for zero-point detector offset or sample displacement errors.
                </p>
              </div>

              <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[11px]">
                  <Layers3 className="w-4 h-4" />
                  <span>3. Unindexed Reflections & Impurities</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • Any peaks in Sample A that do not match reference Sample B appear in the <strong className="text-indigo-300">Extra / Impurity Peaks</strong> table.
                  <br />
                  • Clicking on any peak button in the jump bar automatically zooms the charts directly to that 2θ position.
                </p>
              </div>

              <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px]">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>4. View Modes (3-Pane Split vs Overlay vs Butterfly)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  • <strong className="text-white">3-Pane Split:</strong> Stacked view showing Sample A, Sample B, and the Delta Residual profile simultaneously.
                  <br />
                  • <strong className="text-white">Unified Overlay:</strong> Overlay both patterns on a single axis for direct peak comparison.
                  <br />
                  • <strong className="text-white">Butterfly Mirror:</strong> Mirrors Sample B below the zero axis for visual symmetry inspection.
                  <br />
                  • <strong className="text-white">1st Derivative:</strong> Computes dI/d2θ to identify subtle shoulders and hidden doublet peaks.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                {t('Got It')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
