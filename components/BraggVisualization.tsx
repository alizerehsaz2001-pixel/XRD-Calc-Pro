import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Waves, 
  Compass, 
  Layers, 
  Atom, 
  Grid, 
  RotateCcw,
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  SlidersHorizontal,
  Keyboard,
  BarChart3,
  Target,
  Split,
  Crosshair,
  Sparkles,
  Eye
} from 'lucide-react';
import { useSettings } from './SettingsContext';
import {
  UnitCellParams,
  BasisAtomDefinition,
  STANDARD_BASIS_PRESETS,
  calculateStructureFactor,
  computeDirectAndReciprocalBasis,
  StructureFactorResult,
  DirectAndReciprocalBasis,
  vectorLength,
  Vector3D,
  calculateInterplanarAngle,
  calculateEwaldSphereKinematics,
  generateKinematicPowderSpectrum,
  KinematicPeakSummary,
  EwaldKinematicsResult,
  InterplanarAngleResult
} from '../utils/braggBasisEngine';

interface BraggVisualizationProps {
  wavelength: number;
  twoTheta: number;
}

type BasisTab = 'kinematics' | 'atomic_basis' | 'reciprocal_basis' | 'plane_stacking' | '2d_lattice' | 'powder_spectrum' | 'ewald_sphere';

export const BraggVisualization: React.FC<BraggVisualizationProps> = ({ 
  wavelength, 
  twoTheta: initialTwoTheta 
}) => {
  const { precision } = useSettings();
  
  // Fullscreen & Modal state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);
  const [scanSpeed, setScanSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [advancedMode, setAdvancedMode] = useState<boolean>(true);
  
  // Active Tab
  const [activeTab, setActiveTab] = useState<BasisTab>('kinematics');

  // Goniometer & Kinematics state
  const [localTwoTheta, setLocalTwoTheta] = useState<number>(initialTwoTheta);
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(false);
  const [reflectionOrder, setReflectionOrder] = useState<number>(1);
  const [debyeWallerB, setDebyeWallerB] = useState<number>(0.5);
  const [showQVectors, setShowQVectors] = useState<boolean>(true);
  const [showPhasor, setShowPhasor] = useState<boolean>(true);
  const [syncDWithCrystal, setSyncDWithCrystal] = useState<boolean>(true);

  // Basis & Structure Factor State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('fcc');
  const [unitCell, setUnitCell] = useState<UnitCellParams>(
    STANDARD_BASIS_PRESETS.find(p => p.id === 'fcc')?.defaultLattice || { a: 3.615, b: 3.615, c: 3.615, alpha: 90, beta: 90, gamma: 90 }
  );
  const [basisAtoms, setBasisAtoms] = useState<BasisAtomDefinition[]>(
    STANDARD_BASIS_PRESETS.find(p => p.id === 'fcc')?.basisAtoms || []
  );

  // Active Miller Index for Basis calculations
  const [millerH, setMillerH] = useState<number>(1);
  const [millerK, setMillerK] = useState<number>(1);
  const [millerL, setMillerL] = useState<number>(1);

  // Interactive Atom Hover State (links Table <-> Argand Phasor <-> Sub-planes)
  const [hoveredAtomId, setHoveredAtomId] = useState<string | null>(null);

  // 3D Visualizer Rotation & Interaction State
  const [rotX, setRotX] = useState<number>(-20);
  const [rotY, setRotY] = useState<number>(35);
  const [zoom3D, setZoom3D] = useState<number>(1.0);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [isAutoRotate3D, setIsAutoRotate3D] = useState<boolean>(false);
  const [showReciprocalVectors3D, setShowReciprocalVectors3D] = useState<boolean>(true);
  const [showHklPlane3D, setShowHklPlane3D] = useState<boolean>(true);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Advanced Kinematics & Powder XRD States
  const [includeAnomalous, setIncludeAnomalous] = useState<boolean>(false);
  const [radiationSource, setRadiationSource] = useState<'CuKa' | 'MoKa' | 'Custom'>('CuKa');
  const [twoThetaMaxSpectrum, setTwoThetaMaxSpectrum] = useState<number>(90);
  const [filterExtinctSpectrum, setFilterExtinctSpectrum] = useState<boolean>(false);
  const [showContinuousProfile, setShowContinuousProfile] = useState<boolean>(true);
  const [interplanarH1, setInterplanarH1] = useState<[number, number, number]>([1, 0, 0]);
  const [interplanarH2, setInterplanarH2] = useState<[number, number, number]>([1, 1, 1]);
  const [crystalliteThicknessA, setCrystalliteThicknessA] = useState<number>(250);
  const [selectedSpectrumPeak, setSelectedSpectrumPeak] = useState<KinematicPeakSummary | null>(null);

  // 2D Projection axis in lattice tab
  const [projectionPlane, setProjectionPlane] = useState<'ab' | 'bc' | 'ac'>('ab');
  const [gridCellsCount, setGridCellsCount] = useState<number>(3);

  // Sync initial twoTheta from parent
  useEffect(() => {
    setLocalTwoTheta(initialTwoTheta);
  }, [initialTwoTheta]);

  // Lock body scroll during Fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Keyboard Shortcuts in Fullscreen and Standard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        if (e.key === 'Escape' && isFullscreen) {
          setIsFullscreen(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAutoScanning(prev => !prev);
      } else if (e.key === '1') {
        setActiveTab('kinematics');
      } else if (e.key === '2') {
        setActiveTab('atomic_basis');
      } else if (e.key === '3') {
        setActiveTab('reciprocal_basis');
      } else if (e.key === '4') {
        setActiveTab('plane_stacking');
      } else if (e.key === '5') {
        setActiveTab('2d_lattice');
      } else if (e.key === '6') {
        setActiveTab('powder_spectrum');
      } else if (e.key === '7') {
        setActiveTab('ewald_sphere');
      } else if (e.key === '[' || e.key === '{') {
        e.preventDefault();
        setLocalTwoTheta(prev => Math.max(5, parseFloat((prev - 0.2).toFixed(2))));
        setIsAutoScanning(false);
      } else if (e.key === ']' || e.key === '}') {
        e.preventDefault();
        setLocalTwoTheta(prev => Math.min(160, parseFloat((prev + 0.2).toFixed(2))));
        setIsAutoScanning(false);
      } else if (e.key === 'r' || e.key === 'R') {
        setRotX(-20);
        setRotY(35);
        setZoom3D(1.0);
      } else if (e.key === '?') {
        setShowShortcutsHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, showShortcutsHelp]);

  // Auto scanner interval with configurable speeds
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isAutoScanning) {
      const step = scanSpeed === 'slow' ? 0.05 : scanSpeed === 'fast' ? 0.35 : 0.15;
      const ms = scanSpeed === 'slow' ? 50 : scanSpeed === 'fast' ? 30 : 40;
      interval = setInterval(() => {
        setLocalTwoTheta(prev => {
          const next = prev + step;
          return next > 90 ? 10 : parseFloat(next.toFixed(2));
        });
      }, ms);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoScanning, scanSpeed]);

  // Auto 3D orbit rotation
  useEffect(() => {
    if (!isAutoRotate3D || isOrbiting) return;
    const interval = setInterval(() => {
      setRotY(prev => (prev + 0.6) % 360);
    }, 35);
    return () => clearInterval(interval);
  }, [isAutoRotate3D, isOrbiting]);

  // Handle Preset Change
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = STANDARD_BASIS_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setUnitCell({ ...preset.defaultLattice });
      setBasisAtoms(preset.basisAtoms.map(a => ({ ...a })));
      if (presetId === 'bcc') {
        setMillerH(1); setMillerK(1); setMillerL(0);
      } else if (presetId === 'fcc' || presetId === 'diamond' || presetId === 'nacl') {
        setMillerH(1); setMillerK(1); setMillerL(1);
      } else {
        setMillerH(1); setMillerK(0); setMillerL(0);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Calculated Basis & Structure Factor Results
  // ---------------------------------------------------------------------------
  const currentPreset = useMemo(
    () => STANDARD_BASIS_PRESETS.find(p => p.id === selectedPresetId),
    [selectedPresetId]
  );

  const basisAndReciprocal: DirectAndReciprocalBasis = useMemo(() => {
    return computeDirectAndReciprocalBasis(unitCell);
  }, [unitCell]);

  const structureFactorResult: StructureFactorResult = useMemo(() => {
    return calculateStructureFactor(millerH, millerK, millerL, unitCell, basisAtoms, wavelength, {
      includeAnomalous,
      radiationType: radiationSource,
      crystalSystem: currentPreset?.crystalSystem || 'Cubic',
      spaceGroup: currentPreset?.spaceGroup || '',
      spaceGroupNumber: currentPreset?.spaceGroupNumber || 0
    });
  }, [millerH, millerK, millerL, unitCell, basisAtoms, wavelength, includeAnomalous, radiationSource, currentPreset]);

  // Full Kinematic Powder XRD Spectrum
  const powderSpectrum: KinematicPeakSummary[] = useMemo(() => {
    return generateKinematicPowderSpectrum(unitCell, basisAtoms, wavelength, twoThetaMaxSpectrum, {
      includeAnomalous,
      radiationType: radiationSource,
      crystalSystem: currentPreset?.crystalSystem || 'Cubic',
      spaceGroup: currentPreset?.spaceGroup || '',
      spaceGroupNumber: currentPreset?.spaceGroupNumber || 0,
      debyeWallerB
    });
  }, [unitCell, basisAtoms, wavelength, twoThetaMaxSpectrum, includeAnomalous, radiationSource, currentPreset, debyeWallerB]);

  // Ewald Sphere Kinematics & Deviation Error
  const ewaldKinematics: EwaldKinematicsResult = useMemo(() => {
    return calculateEwaldSphereKinematics(
      wavelength,
      localTwoTheta,
      structureFactorResult.dSpacing,
      reflectionOrder,
      crystalliteThicknessA
    );
  }, [wavelength, localTwoTheta, structureFactorResult.dSpacing, reflectionOrder, crystalliteThicknessA]);

  // Interplanar Angles & Zone Axis Geometry
  const interplanarResult: InterplanarAngleResult = useMemo(() => {
    return calculateInterplanarAngle(
      interplanarH1[0], interplanarH1[1], interplanarH1[2],
      interplanarH2[0], interplanarH2[1], interplanarH2[2],
      unitCell
    );
  }, [interplanarH1, interplanarH2, unitCell]);

  // ---------------------------------------------------------------------------
  // 2D Ray Tracing / Kinematics Physics Calculations
  // ---------------------------------------------------------------------------
  const width = 680;
  const height = 360;
  const planeSpacing = 88;
  const centerY = height / 2 + 12;
  const centerX = width / 2 - 20;

  const theta = (localTwoTheta || 0) / 2;
  const thetaRad = isNaN(theta) ? 0 : (theta * Math.PI) / 180;
  
  // Reference d-spacing derived either from active (hkl) crystal reflection or initial parent peak
  const dRefTheta = (initialTwoTheta || 28.44) / 2;
  const dRefThetaRad = (dRefTheta * Math.PI) / 180;
  const parentRefDSpacing = wavelength / (2 * Math.max(0.0001, Math.sin(dRefThetaRad)));
  const dSpacing = syncDWithCrystal && structureFactorResult.dSpacing > 0
    ? structureFactorResult.dSpacing
    : parentRefDSpacing;

  // Calculate exact Bragg Peak angles for Quick Presets
  const peak1TwoTheta = useMemo(() => {
    const sin1 = wavelength / (2 * dSpacing);
    if (sin1 > 1 || sin1 <= 0) return null;
    return (2 * Math.asin(sin1) * 180) / Math.PI;
  }, [wavelength, dSpacing]);

  const peak2TwoTheta = useMemo(() => {
    const sin2 = (2 * wavelength) / (2 * dSpacing);
    if (sin2 > 1 || sin2 <= 0) return null;
    return (2 * Math.asin(sin2) * 180) / Math.PI;
  }, [wavelength, dSpacing]);

  const nullTwoTheta = useMemo(() => {
    const sinNull = (0.5 * wavelength) / (2 * dSpacing);
    if (sinNull > 1 || sinNull <= 0) return null;
    return (2 * Math.asin(sinNull) * 180) / Math.PI;
  }, [wavelength, dSpacing]);

  // Exact path difference delta = 2 * d * sin(theta)
  const pathLengthDiff = 2 * dSpacing * Math.sin(thetaRad);
  const phaseDiffRad = (2 * Math.PI * pathLengthDiff) / Math.max(0.0001, wavelength);
  const phaseDiffDeg = ((phaseDiffRad * 180 / Math.PI) % 360 + 360) % 360;
  const pathDiffInWaves = pathLengthDiff / Math.max(0.0001, wavelength);

  const qMagnitude = (4 * Math.PI * Math.sin(thetaRad)) / Math.max(0.0001, wavelength);
  const energyKeV = 12.3984 / Math.max(0.001, wavelength);

  const sinOverLambda = Math.sin(thetaRad) / Math.max(0.0001, wavelength);
  const debyeWallerDamping = Math.exp(-2 * debyeWallerB * Math.pow(sinOverLambda, 2));

  const braggConditionSin = (reflectionOrder * wavelength) / (2 * dSpacing);
  const sinDiff = Math.abs(Math.sin(thetaRad) - braggConditionSin);
  const resonanceStrength = Math.exp(-Math.pow(sinDiff * 45, 2));
  const totalNormalizedIntensity = Math.pow(Math.cos(phaseDiffRad / 2), 2) * debyeWallerDamping;

  const lambdaVis = 32;

  const generateWavePath = (
    startX: number, 
    startY: number, 
    angleRad: number, 
    length: number, 
    phaseOffset: number = 0,
    amplitudeVal: number = 6.5
  ) => {
    const steps = 84;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const twoPiOverLambda = (2 * Math.PI) / lambdaVis;

    let path = `M ${startX.toFixed(1)},${startY.toFixed(1)}`;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const dist = t * length;
      const waveY = amplitudeVal * Math.sin((dist - phaseOffset) * twoPiOverLambda);
      const px = startX + (dist * cosA - waveY * sinA);
      const py = startY + (dist * sinA + waveY * cosA);
      path += ` L ${px.toFixed(1)},${py.toFixed(1)}`;
    }
    return path;
  };

  const topAtomY = centerY - planeSpacing / 2;
  const bottomAtomY = centerY + planeSpacing / 2;
  const rayLength = 250;

  const ax = centerX;
  const ay = topAtomY;
  const bx = centerX;
  const by = bottomAtomY;

  const dSinTheta = planeSpacing * Math.sin(thetaRad);
  const cx = bx - dSinTheta * Math.cos(thetaRad);
  const cy = by - dSinTheta * Math.sin(thetaRad);
  const dx = bx + dSinTheta * Math.cos(thetaRad);
  const dy = by - dSinTheta * Math.sin(thetaRad);

  const inc2StartX = ax - rayLength * Math.cos(thetaRad);
  const inc2StartY = ay - rayLength * Math.sin(thetaRad);
  const inc1StartX = bx - rayLength * Math.cos(thetaRad);
  const inc1StartY = by - rayLength * Math.sin(thetaRad);
  const diff2EndX = ax + rayLength * Math.cos(thetaRad);
  const diff2EndY = ay - rayLength * Math.sin(thetaRad);
  const diff1EndX = bx + rayLength * Math.cos(thetaRad);
  const diff1EndY = by - rayLength * Math.sin(thetaRad);

  const atoms = useMemo(() => {
    const arr = [];
    const atomSpacing = 44;
    const atomsCount = 14;
    for (let i = -atomsCount / 2; i <= atomsCount / 2; i++) {
      arr.push({ x: centerX + i * atomSpacing, y: topAtomY, plane: 1 });
      arr.push({ x: centerX + i * atomSpacing, y: bottomAtomY, plane: 2 });
    }
    return arr;
  }, [centerX, topAtomY, bottomAtomY]);

  const waveAnimDuration = 1.2;

  const rayNodeDots = useMemo(() => {
    const arr = [];
    const dotCount = 7;
    for (let i = 1; i <= dotCount; i++) {
      const dist = (i / (dotCount + 1)) * rayLength;
      arr.push({ x: inc2StartX + dist * Math.cos(thetaRad), y: inc2StartY + dist * Math.sin(thetaRad) });
      arr.push({ x: inc1StartX + dist * Math.cos(thetaRad), y: inc1StartY + dist * Math.sin(thetaRad) });
      arr.push({ x: ax + dist * Math.cos(thetaRad), y: ay - dist * Math.sin(thetaRad) });
      arr.push({ x: bx + dist * Math.cos(thetaRad), y: by - dist * Math.sin(thetaRad) });
    }
    return arr;
  }, [inc2StartX, inc2StartY, inc1StartX, inc1StartY, ax, ay, bx, by, thetaRad, rayLength]);

  const scopePoints = useMemo(() => {
    const pts = [];
    const numSteps = 90;
    for (let i = 0; i <= numSteps; i++) {
      const t = (i / numSteps) * 4 * Math.PI;
      const e1 = Math.sin(t);
      const e2 = Math.sin(t - phaseDiffRad);
      const eSum = (e1 + e2) * Math.sqrt(debyeWallerDamping);
      pts.push({ t, e1, e2, eSum });
    }
    return pts;
  }, [phaseDiffRad, debyeWallerDamping]);

  // ---------------------------------------------------------------------------
  // 3D Projection Helpers for Unit Cell & Basis Vectors
  // ---------------------------------------------------------------------------
  const project3D = (v: Vector3D, scale = 26, originX = 190, originY = 165) => {
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    // Rotation around Y
    const x1 = v.x * Math.cos(radY) + v.z * Math.sin(radY);
    const y1 = v.y;
    const z1 = -v.x * Math.sin(radY) + v.z * Math.cos(radY);

    // Rotation around X
    const x2 = x1;
    const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);

    // Perspective & Zoom factor
    const p = (1 + z2 * 0.003) * zoom3D;
    return {
      x: originX + x2 * scale * p,
      y: originY - y2 * scale * p,
      z: z2
    };
  };

  // Add / Remove Basis Atom Helpers
  const handleAddAtom = () => {
    const newId = `atom-${Date.now()}`;
    const newAtom: BasisAtomDefinition = {
      id: newId,
      label: `Site ${basisAtoms.length + 1}`,
      element: 'Si',
      coords: [0.25, 0.25, 0.25],
      occupancy: 1.0,
      bFactor: 0.5,
      color: '#38bdf8'
    };
    setBasisAtoms([...basisAtoms, newAtom]);
    setSelectedPresetId('custom');
  };

  const handleRemoveAtom = (id: string) => {
    if (basisAtoms.length <= 1) return;
    setBasisAtoms(basisAtoms.filter(a => a.id !== id));
    setSelectedPresetId('custom');
  };

  const handleUpdateAtom = (id: string, updates: Partial<BasisAtomDefinition>) => {
    setBasisAtoms(basisAtoms.map(a => (a.id === id ? { ...a, ...updates } : a)));
    setSelectedPresetId('custom');
  };

  // Snap Goniometer 2theta to active (hkl) Bragg reflection
  const handleSnapToHklBragg = () => {
    if (structureFactorResult.isBraggAllowedByWavelength && structureFactorResult.twoTheta > 0) {
      setLocalTwoTheta(parseFloat(structureFactorResult.twoTheta.toFixed(2)));
      setIsAutoScanning(false);
      setSyncDWithCrystal(true);
    }
  };

  // Copy data formatted
  const handleCopyData = (format: 'json' | 'latex' | 'cif') => {
    let content = '';
    if (format === 'json') {
      content = JSON.stringify({
        preset: selectedPresetId,
        unitCell,
        hkl: [millerH, millerK, millerL],
        wavelength,
        dSpacing: structureFactorResult.dSpacing,
        twoTheta: structureFactorResult.twoTheta,
        structureFactor: {
          fReal: structureFactorResult.fReal,
          fImag: structureFactorResult.fImag,
          fMag: structureFactorResult.fMag,
          fPhaseDeg: structureFactorResult.fPhaseDeg,
          fSquared: structureFactorResult.fSquared,
          isExtinct: structureFactorResult.isExtinct
        },
        basisAtoms
      }, null, 2);
    } else if (format === 'latex') {
      content = `\\begin{aligned}
&\\text{Reflection } (${millerH}\\,${millerK}\\,${millerL}), \\quad \\lambda = ${wavelength.toFixed(4)}\\,\\text{\\AA}, \\quad d = ${structureFactorResult.dSpacing.toFixed(4)}\\,\\text{\\AA}, \\quad 2\\theta = ${structureFactorResult.twoTheta.toFixed(2)}^\\circ \\\\
&F(${millerH}${millerK}${millerL}) = \\sum_{j=1}^{${basisAtoms.length}} f_j(s) e^{-B_j s^2} e^{2\\pi i (${millerH}x_j + ${millerK}y_j + ${millerL}z_j)} = ${structureFactorResult.fReal.toFixed(3)} + ${structureFactorResult.fImag.toFixed(3)}i \\\\
&|F|^2 = ${structureFactorResult.fSquared.toFixed(2)}, \\quad \\alpha = ${structureFactorResult.fPhaseDeg.toFixed(1)}^\\circ \\quad [\\text{${structureFactorResult.isExtinct ? 'FORBIDDEN (EXTINCT)' : 'ALLOWED'}}]
\\end{aligned}`;
    } else {
      content = `data_crystal_basis_${selectedPresetId}
_cell_length_a ${unitCell.a.toFixed(4)}
_cell_length_b ${unitCell.b.toFixed(4)}
_cell_length_c ${unitCell.c.toFixed(4)}
_cell_angle_alpha ${unitCell.alpha.toFixed(2)}
_cell_angle_beta ${unitCell.beta.toFixed(2)}
_cell_angle_gamma ${unitCell.gamma.toFixed(2)}

loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
_atom_site_occupancy
_atom_site_B_iso_or_equiv
${basisAtoms.map(a => `${a.label.replace(/\s+/g, '_')} ${a.element} ${a.coords[0].toFixed(4)} ${a.coords[1].toFixed(4)} ${a.coords[2].toFixed(4)} ${a.occupancy.toFixed(2)} ${a.bFactor.toFixed(2)}`).join('\n')}`;
    }

    navigator.clipboard.writeText(content);
    setCopiedCode(format);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div 
      id="bragg-basis-workbench" 
      className={
        isFullscreen 
          ? "fixed inset-0 z-50 bg-[#05070D] overflow-y-auto p-3 sm:p-5 md:p-6 flex flex-col font-mono text-slate-300 backdrop-blur-3xl transition-all duration-300"
          : "bg-[#080B11] border border-slate-800/80 p-4 sm:p-5 shadow-2xl relative font-mono text-slate-300 transition-all duration-300"
      }
    >
      {/* Fullscreen Sticky Quick Header HUD */}
      {isFullscreen && (
        <div className="sticky top-0 z-40 bg-[#05070D]/95 backdrop-blur-xl -mt-3 sm:-mt-5 md:-mt-6 -mx-3 sm:-mx-5 md:-mx-6 px-4 py-2.5 border-b border-sky-500/20 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-sky-300 flex items-center gap-1.5">
                <Atom className="w-4 h-4 text-sky-400" />
                Bragg Basis &amp; Crystallographic Kinematics Studio
              </span>
            </div>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-slate-400">
              <span>λ = <strong className="text-slate-200">{wavelength.toFixed(4)} Å</strong></span>
              <span>·</span>
              <span>hkl = <strong className="text-emerald-400">({millerH} {millerK} {millerL})</strong></span>
              <span>·</span>
              <span>d = <strong className="text-amber-400">{structureFactorResult.dSpacing > 0 ? structureFactorResult.dSpacing.toFixed(4) : '--'} Å</strong></span>
              <span>·</span>
              <span>2θ = <strong className="text-sky-400">{localTwoTheta.toFixed(2)}°</strong></span>
              <span>·</span>
              <span className={structureFactorResult.isExtinct ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {structureFactorResult.isExtinct ? 'EXTINCT' : 'ALLOWED'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="px-2 py-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-[10px] flex items-center gap-1"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Shortcuts (?)</span>
            </button>

            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-all"
              title="Exit Fullscreen (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Header HUD */}
      <div className="flex flex-col gap-3.5 mb-4 pb-3.5 border-b border-slate-800/90">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/25 text-sky-400 shrink-0">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-wider text-slate-100 uppercase">
                  Bragg Basis &amp; Crystallographic Kinematics Engine
                </h2>
                <span className="text-[10px] text-slate-500 hidden sm:inline">·</span>
                <span className="text-[11px] font-bold text-sky-400">
                  {currentPreset ? `${currentPreset.formula} (${currentPreset.spaceGroup})` : 'Custom Basis'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wide mt-0.5">
                Direct &amp; Reciprocal Metric Tensors · Cromer-Mann Form Factors · Argand Phasor Summation · Ewald Sphere
              </p>
            </div>
          </div>

          {/* Export Copy Tools & Fullscreen Toggle */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-[#04060A] border border-slate-800 p-0.5 text-[10px]">
              <span className="text-[9px] text-slate-500 uppercase px-1.5 font-bold hidden sm:inline">Export:</span>
              <button
                onClick={() => handleCopyData('latex')}
                className="px-2 py-1 font-bold text-slate-400 hover:text-amber-300 hover:bg-slate-900 transition-colors flex items-center gap-1"
                title="Copy Structure Factor LaTeX"
              >
                {copiedCode === 'latex' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 opacity-60" />}
                <span>LaTeX</span>
              </button>
              <button
                onClick={() => handleCopyData('json')}
                className="px-2 py-1 font-bold text-slate-400 hover:text-sky-300 hover:bg-slate-900 transition-colors flex items-center gap-1"
                title="Copy Crystal & Structure Factor JSON"
              >
                {copiedCode === 'json' ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                <span>JSON</span>
              </button>
              <button
                onClick={() => handleCopyData('cif')}
                className="px-2 py-1 font-bold text-slate-400 hover:text-emerald-300 hover:bg-slate-900 transition-colors flex items-center gap-1"
                title="Copy Crystallographic Information File (CIF)"
              >
                {copiedCode === 'cif' ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                <span>CIF</span>
              </button>
            </div>

            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="p-1.5 text-slate-400 hover:text-slate-100 bg-[#04060A] border border-slate-800 hover:border-slate-700 transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            <button
              id="btn-bragg-fullscreen-toggle"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider border transition-all flex items-center gap-1.5 ${
                isFullscreen
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
              }`}
              title={isFullscreen ? 'Exit Fullscreen (F / Esc)' : 'Expand Workbench to Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Minimize' : 'Expand'}</span>
            </button>
          </div>
        </div>

        {/* 7-Tab Navigation Strip */}
        <div className="flex items-center gap-1 bg-[#04060A] p-1 border border-slate-800/90 overflow-x-auto no-scrollbar">
          {([
            { id: 'kinematics', label: '1. Kinematics', icon: Waves, activeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
            { id: 'atomic_basis', label: '2. Atomic Basis & F(hkl)', icon: Atom, activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
            { id: 'reciprocal_basis', label: '3. Dual Basis 3D', icon: Compass, activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
            { id: 'plane_stacking', label: '4. Sub-Planes', icon: Layers, activeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
            { id: '2d_lattice', label: '5. 2D Real-Space', icon: Grid, activeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
            { id: 'powder_spectrum', label: '6. Powder XRD', icon: BarChart3, activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
            { id: 'ewald_sphere', label: '7. Ewald & Geometry', icon: Target, activeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40' }
          ] as const).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id.replace('_', '-')}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                  isActive
                    ? `${tab.activeClass} shadow-sm`
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* UNIFIED GLOBAL CRYSTAL BASIS, MILLER (hkl) & GONIOMETER CONTROL DECK */}
        <div className="bg-[#0B0F17] border border-slate-800/90 p-3 space-y-2.5">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-end">
            {/* Crystal Structure Preset Selector (4 cols) */}
            <div className="xl:col-span-4 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold uppercase tracking-wider">Crystal Basis Structure</span>
                <span className="text-emerald-400 font-mono">
                  {currentPreset ? `${currentPreset.crystalSystem} · ${currentPreset.spaceGroup}` : 'User Defined'}
                </span>
              </div>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="w-full bg-[#04060A] border border-slate-700/80 px-2.5 py-1.5 text-xs text-slate-100 focus:border-sky-500 outline-none font-mono"
              >
                {STANDARD_BASIS_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} — {preset.formula} ({preset.spaceGroup})
                  </option>
                ))}
                <option value="custom">★ Custom User-Defined Basis ({basisAtoms.length} sites)</option>
              </select>
            </div>

            {/* Miller Indices (h k l) Steppers & Quick Pills (5 cols) */}
            <div className="xl:col-span-5 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold uppercase tracking-wider">Reflection Plane (h k l)</span>
                <div className="flex items-center gap-1">
                  {(['100', '110', '111', '200', '220', '311'] as const).map((hklStr) => {
                    const isCurr =
                      millerH === parseInt(hklStr[0]) &&
                      millerK === parseInt(hklStr[1]) &&
                      millerL === parseInt(hklStr[2]);
                    return (
                      <button
                        key={hklStr}
                        onClick={() => {
                          setMillerH(parseInt(hklStr[0]));
                          setMillerK(parseInt(hklStr[1]));
                          setMillerL(parseInt(hklStr[2]));
                        }}
                        className={`px-1.5 py-0.5 text-[9px] font-bold transition-colors border ${
                          isCurr
                            ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                            : 'bg-[#04060A] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {hklStr}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { label: 'h', val: millerH, setter: setMillerH },
                  { label: 'k', val: millerK, setter: setMillerK },
                  { label: 'l', val: millerL, setter: setMillerL }
                ] as const).map((idxObj) => (
                  <div key={idxObj.label} className="flex items-center bg-[#04060A] border border-slate-700/80 px-1.5 py-1">
                    <span className="text-[10px] font-bold text-slate-500 mr-1">{idxObj.label}:</span>
                    <button
                      onClick={() => idxObj.setter(idxObj.val - 1)}
                      className="px-1 text-slate-400 hover:text-white text-xs font-bold"
                      title={`Decrease ${idxObj.label}`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={idxObj.val}
                      onChange={(e) => idxObj.setter(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-xs font-bold text-sky-400 text-center outline-none tabular-nums"
                    />
                    <button
                      onClick={() => idxObj.setter(idxObj.val + 1)}
                      className="px-1 text-slate-400 hover:text-white text-xs font-bold"
                      title={`Increase ${idxObj.label}`}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Goniometer 2Theta Snap & Scan Controls (3 cols) */}
            <div className="xl:col-span-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold uppercase tracking-wider">Goniometer 2θ</span>
                <span className="text-sky-400 font-bold tabular-nums">{localTwoTheta.toFixed(2)}°</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSnapToHklBragg}
                  disabled={!structureFactorResult.isBraggAllowedByWavelength || structureFactorResult.twoTheta <= 0}
                  className="flex-1 py-1.5 px-2 bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 disabled:pointer-events-none border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                  title="Snap Goniometer 2θ to exact Bragg angle for active (hkl)"
                >
                  <Crosshair className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {structureFactorResult.isBraggAllowedByWavelength && structureFactorResult.twoTheta > 0
                      ? `Snap 2θ → ${structureFactorResult.twoTheta.toFixed(1)}°`
                      : 'λ > 2d (Out of Range)'}
                  </span>
                </button>
                <button
                  onClick={() => setIsAutoScanning(!isAutoScanning)}
                  className={`px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider border transition-all flex items-center gap-1 shrink-0 ${
                    isAutoScanning
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-[#04060A] border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle Goniometer 2θ Sweep (Space)"
                >
                  {isAutoScanning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isAutoScanning ? 'Pause' : 'Scan'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Crystallographic Telemetry Summary Bar (Unboxed Clean Metadata Discipline) */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px]">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-400">
              <span>
                Status:{' '}
                <strong className={structureFactorResult.isExtinct ? 'text-rose-400' : 'text-emerald-400'}>
                  {structureFactorResult.isExtinct ? 'FORBIDDEN (EXTINCT)' : 'BRAGG ALLOWED'}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                d({millerH}{millerK}{millerL}) ={' '}
                <strong className="text-emerald-300 tabular-nums">
                  {structureFactorResult.dSpacing > 0 ? `${structureFactorResult.dSpacing.toFixed(precision)} Å` : '--'}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                |F| = <strong className="text-amber-300 tabular-nums">{structureFactorResult.fMag.toFixed(2)}</strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                |F|² = <strong className="text-sky-300 tabular-nums">{structureFactorResult.fSquared.toFixed(1)}</strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                Phase α = <strong className="text-purple-300 tabular-nums">{structureFactorResult.fPhaseDeg.toFixed(1)}°</strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                Multiplicity M = <strong className="text-slate-200 tabular-nums">{structureFactorResult.multiplicity}</strong>
              </span>
            </div>

            {structureFactorResult.extinctionReason && (
              <div className="text-[10px] text-rose-400 font-medium">
                {structureFactorResult.extinctionReason}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal Overlay */}
      <AnimatePresence>
        {showShortcutsHelp && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowShortcutsHelp(false)}
          >
            <div 
              className="bg-[#0B0F17] border border-sky-500/40 p-6 max-w-md w-full shadow-2xl font-mono text-slate-300 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Keyboard className="w-4 h-4" /> Keyboard Navigation Shortcuts
                </span>
                <button 
                  onClick={() => setShowShortcutsHelp(false)}
                  className="text-slate-500 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2 bg-black/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Toggle Fullscreen:</span>
                  <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-sky-300 font-bold">F</kbd>
                </div>
                <div className="p-2 bg-black/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Exit Fullscreen:</span>
                  <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-rose-300 font-bold">ESC</kbd>
                </div>
                <div className="p-2 bg-black/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Play / Pause Scan:</span>
                  <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-amber-300 font-bold">Space</kbd>
                </div>
                <div className="p-2 bg-black/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Tabs 1 to 7:</span>
                  <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-emerald-300 font-bold">1 - 7</kbd>
                </div>
                <div className="p-2 bg-black/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Step 2θ ± 0.2°:</span>
                  <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-purple-300 font-bold">[ / ]</kbd>
                </div>
                <div className="p-2 bg-black/60 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Reset 3D Camera:</span>
                  <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-sky-300 font-bold">R</kbd>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setShowShortcutsHelp(false)}
                  className="w-full py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs uppercase font-bold tracking-wider transition-all"
                >
                  Close Window
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* TAB 1: KINEMATICS & WAVE SUPERPOSITION                                */}
      {/* ===================================================================== */}
      {activeTab === 'kinematics' && (
        <div className="space-y-4">
          {/* Fine Goniometer Angle & Order Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#04060A] p-2.5 border border-slate-800/90">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2θ Scrubber:</span>
              <button
                onClick={() => { setLocalTwoTheta(prev => Math.max(5, parseFloat((prev - 0.1).toFixed(2)))); setIsAutoScanning(false); }}
                className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-[10px] text-slate-300 hover:text-white font-bold"
              >
                -0.1°
              </button>
              <input 
                type="range" 
                min="10" 
                max="120" 
                step="0.05"
                value={String(localTwoTheta) === 'NaN' ? 28.44 : localTwoTheta}
                onChange={(e) => {
                  setLocalTwoTheta(parseFloat(e.target.value));
                  setIsAutoScanning(false);
                }}
                className="w-28 sm:w-44 accent-sky-400 hover:accent-sky-300 transition-all cursor-pointer h-1.5 bg-slate-800 appearance-none"
              />
              <button
                onClick={() => { setLocalTwoTheta(prev => Math.min(150, parseFloat((prev + 0.1).toFixed(2)))); setIsAutoScanning(false); }}
                className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-[10px] text-slate-300 hover:text-white font-bold"
              >
                +0.1°
              </button>

              {/* Quick Bragg Condition Jumps */}
              <div className="flex items-center gap-1 ml-1">
                {peak1TwoTheta && (
                  <button
                    onClick={() => { setLocalTwoTheta(parseFloat(peak1TwoTheta.toFixed(2))); setIsAutoScanning(false); setReflectionOrder(1); }}
                    className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-all"
                  >
                    n=1 ({peak1TwoTheta.toFixed(1)}°)
                  </button>
                )}
                {peak2TwoTheta && (
                  <button
                    onClick={() => { setLocalTwoTheta(parseFloat(peak2TwoTheta.toFixed(2))); setIsAutoScanning(false); setReflectionOrder(2); }}
                    className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all"
                  >
                    n=2 ({peak2TwoTheta.toFixed(1)}°)
                  </button>
                )}
                {nullTwoTheta && (
                  <button
                    onClick={() => { setLocalTwoTheta(parseFloat(nullTwoTheta.toFixed(2))); setIsAutoScanning(false); }}
                    className="px-2 py-0.5 text-[9px] font-bold uppercase bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all"
                  >
                    Destructive (180°)
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncDWithCrystal}
                  onChange={(e) => setSyncDWithCrystal(e.target.checked)}
                  className="accent-sky-400"
                />
                <span>Use ({millerH}{millerK}{millerL}) d-spacing</span>
              </label>

              <button
                onClick={() => setShowQVectors(!showQVectors)}
                className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border transition-all ${
                  showQVectors 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {showQVectors ? 'Vectors (k_i, k_f, Q): ON' : 'Vectors: OFF'}
              </button>
            </div>
          </div>

          {/* FULL-WIDTH INTERACTIVE DIFFRACTION RAY-TRACING & WAVEFRONT STAGE */}
          <div className="w-full bg-[#020408] border border-slate-800/90 relative shadow-2xl overflow-hidden">
            {/* Top-left Stage Telemetry Overlay */}
            <div className="absolute top-2.5 left-3 z-20 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] bg-black/75 backdrop-blur-sm px-2.5 py-1 border border-slate-800/90 pointer-events-none">
              <span className="text-slate-400">
                θ = <strong className="text-sky-300">{theta.toFixed(2)}°</strong>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                Δ = 2d sin θ = <strong className="text-amber-300">{pathLengthDiff.toFixed(3)} Å</strong> ({pathDiffInWaves.toFixed(2)} λ)
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                Δφ = <strong className="text-purple-300">{phaseDiffDeg.toFixed(1)}°</strong>
              </span>
            </div>

            {/* Top-right Resonance Indicator */}
            <div className="absolute top-2.5 right-3 z-20 flex items-center gap-2 pointer-events-none">
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                resonanceStrength > 0.85
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                  : totalNormalizedIntensity < 0.08
                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                  : 'bg-black/75 text-slate-400 border-slate-800'
              }`}>
                {resonanceStrength > 0.85
                  ? `★ Constructive Bragg Peak (n=${reflectionOrder})`
                  : totalNormalizedIntensity < 0.08
                  ? 'Destructive Cancellation (Anti-Phase)'
                  : `Partial Interference (I/I₀ = ${(totalNormalizedIntensity * 100).toFixed(0)}%)`}
              </span>
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[370px] block p-1" preserveAspectRatio="xMidYMid meet">
              <defs>
                <marker id="arrowhead-sky" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                </marker>
                <marker id="arrowhead-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                </marker>
                <marker id="arrowhead-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                </marker>
                <radialGradient id="detectorGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={Math.min(1, totalNormalizedIntensity * 0.95)} />
                  <stop offset="60%" stopColor="#38bdf8" stopOpacity={Math.min(0.6, totalNormalizedIntensity * 0.5)} />
                  <stop offset="100%" stopColor="#020408" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Extra Path Length Shaded Triangle C-B-D */}
              <polygon
                points={`${ax},${ay} ${cx},${cy} ${bx},${by}`}
                fill="rgba(56, 189, 248, 0.12)"
                stroke="none"
              />
              <polygon
                points={`${ax},${ay} ${dx},${dy} ${bx},${by}`}
                fill="rgba(251, 191, 36, 0.12)"
                stroke="none"
              />

              {/* Top and Bottom Crystallographic Planes */}
              <line x1="24" y1={topAtomY} x2={width - 70} y2={topAtomY} stroke="#cbd5e1" strokeWidth="1.6" strokeOpacity="0.8" />
              <line x1="24" y1={bottomAtomY} x2={width - 70} y2={bottomAtomY} stroke="#cbd5e1" strokeWidth="1.6" strokeOpacity="0.8" />
              
              <text x="28" y={topAtomY - 10} fill="#94a3b8" fontSize="10" className="font-mono font-bold uppercase tracking-wider">
                Plane 1 ({millerH}{millerK}{millerL}) · z = 0
              </text>
              <text x="28" y={bottomAtomY + 18} fill="#94a3b8" fontSize="10" className="font-mono font-bold uppercase tracking-wider">
                Plane 2 ({millerH}{millerK}{millerL}) · z = −d_hkl
              </text>

              {/* Lattice Atoms on Planes */}
              {atoms.map((atom, i) => (
                <circle
                  key={`atom-${atom.x}-${atom.y}-${i}`}
                  cx={atom.x}
                  cy={atom.y}
                  r="4.5"
                  fill="#090d16"
                  stroke={atom.x === centerX ? (atom.plane === 1 ? '#f43f5e' : '#10b981') : '#e2e8f0'}
                  strokeWidth={atom.x === centerX ? '2' : '1.2'}
                />
              ))}

              {/* Guide Ray Lines */}
              <line x1={inc2StartX} y1={inc2StartY} x2={ax} y2={ay} stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.55" />
              <line x1={inc1StartX} y1={inc1StartY} x2={bx} y2={by} stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.55" />
              <line x1={ax} y1={ay} x2={diff2EndX} y2={diff2EndY} stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.55" markerEnd="url(#arrowhead-sky)" />
              <line x1={bx} y1={by} x2={diff1EndX} y2={diff1EndY} stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.55" markerEnd="url(#arrowhead-sky)" />

              {/* Highlighted Path Difference Segments CB and BD */}
              <line x1={cx} y1={cy} x2={bx} y2={by} stroke="#fbbf24" strokeWidth="3.5" />
              <line x1={bx} y1={by} x2={dx} y2={dy} stroke="#fbbf24" strokeWidth="3.5" />

              {/* Wavefront Normals */}
              <line x1={inc2StartX} y1={inc2StartY} x2={inc1StartX} y2={inc1StartY} stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={diff2EndX} y1={diff2EndY} x2={diff1EndX} y2={diff1EndY} stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" />

              {/* Incident Traveling Waves */}
              <motion.path 
                d={generateWavePath(inc2StartX, inc2StartY, thetaRad, rayLength, 0, 6.5)} 
                stroke="#f43f5e" strokeWidth="2" fill="none"
                animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
              />

              <motion.path 
                d={generateWavePath(inc1StartX, inc1StartY, thetaRad, rayLength, 0, 6.5)} 
                stroke="#10b981" strokeWidth="2" fill="none"
                animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
              />

              {/* Diffracted Traveling Waves (phase-shifted by path difference on lower ray) */}
              <motion.path 
                d={generateWavePath(ax, ay, -thetaRad, rayLength, 0, 6.5)} 
                stroke={resonanceStrength > 0.85 ? "#fbbf24" : "#f43f5e"} 
                strokeWidth={resonanceStrength > 0.85 ? "2.5" : "2"} fill="none"
                animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
              />

              <motion.path 
                d={generateWavePath(bx, by, -thetaRad, rayLength, (phaseDiffRad / (2 * Math.PI)) * lambdaVis, 6.5)} 
                stroke={resonanceStrength > 0.85 ? "#fbbf24" : "#10b981"} 
                strokeWidth={resonanceStrength > 0.85 ? "2.5" : "2"} fill="none"
                animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
                transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
              />

              {rayNodeDots.map((dot, idx) => (
                <circle key={`dot-${idx}`} cx={dot.x} cy={dot.y} r="2" fill="#020408" stroke="#38bdf8" strokeWidth="0.6" />
              ))}

              {/* Vertical interplanar normal AB */}
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#f8fafc" strokeWidth="1.8" />
              <text x={ax + 6} y={(ay + by) / 2 + 4} fill="#f8fafc" fontSize="11" className="font-mono font-bold">
                d = {dSpacing.toFixed(2)}Å
              </text>

              {/* Wavefront perpendicular drop lines AC and AD */}
              <line x1={ax} y1={ay} x2={cx} y2={cy} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1={ax} y1={ay} x2={dx} y2={dy} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />

              {/* Geometric Vertices A, B, C, D */}
              <circle cx={ax} cy={ay} r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.2" />
              <text x={ax - 12} y={ay - 9} fill="#f8fafc" fontSize="11" className="font-mono font-bold">A</text>

              <circle cx={bx} cy={by} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.2" />
              <text x={bx - 12} y={by + 16} fill="#f8fafc" fontSize="11" className="font-mono font-bold">B</text>

              <circle cx={cx} cy={cy} r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
              <text x={cx - 14} y={cy + 4} fill="#fbbf24" fontSize="10" className="font-mono font-bold">C</text>

              <circle cx={dx} cy={dy} r="3.5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
              <text x={dx + 6} y={dy + 4} fill="#fbbf24" fontSize="10" className="font-mono font-bold">D</text>

              {/* Path difference labels */}
              <text x={(cx + bx) / 2 - 26} y={cy + 20} fill="#fbbf24" fontSize="10" className="font-mono font-bold">d sin θ</text>
              <text x={(bx + dx) / 2 + 4} y={dy + 20} fill="#fbbf24" fontSize="10" className="font-mono font-bold">d sin θ</text>

              {/* Scattering Vector Triangle k_i, k_f, Q */}
              {showQVectors && (
                <g>
                  <line 
                    x1={ax - 58 * Math.cos(thetaRad)} 
                    y1={ay - 58 * Math.sin(thetaRad)} 
                    x2={ax} 
                    y2={ay} 
                    stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrowhead-sky)" 
                  />
                  <text x={ax - 68 * Math.cos(thetaRad) - 12} y={ay - 68 * Math.sin(thetaRad)} fill="#38bdf8" fontSize="10" className="font-mono font-bold">k_i</text>

                  <line 
                    x1={ax} 
                    y1={ay} 
                    x2={ax + 58 * Math.cos(thetaRad)} 
                    y2={ay - 58 * Math.sin(thetaRad)} 
                    stroke="#fbbf24" strokeWidth="2.5" markerEnd="url(#arrowhead-amber)" 
                  />
                  <text x={ax + 64 * Math.cos(thetaRad)} y={ay - 64 * Math.sin(thetaRad)} fill="#fbbf24" fontSize="10" className="font-mono font-bold">k_f</text>

                  {(() => {
                    const qLen = Math.max(18, 116 * Math.sin(thetaRad));
                    return (
                      <>
                        <line 
                          x1={ax} 
                          y1={ay} 
                          x2={ax} 
                          y2={ay - qLen} 
                          stroke="#10b981" strokeWidth="3" markerEnd="url(#arrowhead-emerald)" 
                        />
                        <text x={ax + 8} y={ay - qLen / 2} fill="#10b981" fontSize="10" className="font-mono font-bold">
                          Q ({qMagnitude.toFixed(2)} Å⁻¹)
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* Left d-spacing caliper */}
              <line x1="42" y1={topAtomY} x2="42" y2={bottomAtomY} stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="37" y1={topAtomY} x2="47" y2={topAtomY} stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="37" y1={bottomAtomY} x2="47" y2={bottomAtomY} stroke="#94a3b8" strokeWidth="1.2" />
              <text x="26" y={(topAtomY + bottomAtomY) / 2 + 4} fill="#e2e8f0" fontSize="11" className="font-mono font-bold">d</text>

              {/* Right-hand Detector Screen & Intensity Readout */}
              <g transform={`translate(${width - 52}, 48)`}>
                <rect x="0" y="0" width="38" height={height - 96} fill="#070b12" stroke="#1e293b" strokeWidth="1.2" />
                <circle
                  cx="19"
                  cy={(height - 96) / 2}
                  r="26"
                  fill="url(#detectorGlow)"
                />
                {/* Vertical intensity bar */}
                <rect
                  x="13"
                  y={(height - 96) - 18 - (totalNormalizedIntensity * ((height - 96) - 42))}
                  width="12"
                  height={Math.max(2, totalNormalizedIntensity * ((height - 96) - 42))}
                  fill={resonanceStrength > 0.85 ? '#fbbf24' : '#38bdf8'}
                  opacity="0.85"
                />
                <text x="19" y="14" fill="#94a3b8" fontSize="8" textAnchor="middle" className="font-mono font-bold uppercase">DET</text>
                <text x="19" y={height - 102} fill="#38bdf8" fontSize="8.5" textAnchor="middle" className="font-mono font-bold">
                  {(totalNormalizedIntensity * 100).toFixed(0)}%
                </text>
              </g>
            </svg>
          </div>

          {/* BOTTOM 2-COLUMN PANEL: OSCILLOSCOPE + ARGAND PHASOR & PHYSICS TELEMETRY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Wave Superposition Oscilloscope & Argand Phasor Wheel (7 Cols) */}
            <div className="lg:col-span-7 bg-[#0B0F17] border border-slate-800/90 p-3.5 flex flex-col justify-between space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-sky-400" />
                  Scattered Wave Superposition Oscilloscope &amp; Argand Phasor
                </span>
                <div className="flex items-center gap-3 text-[9px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-rose-500 inline-block" /> E₁ (Plane 1)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> E₂ (Plane 2)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> E_sum = E₁ + E₂</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Oscilloscope SVG */}
                <div className="sm:col-span-8 bg-[#030508] border border-slate-800/80 p-2 h-32 relative">
                  <svg width="100%" height="100%" viewBox="0 0 260 90" preserveAspectRatio="none" className="overflow-visible">
                    <line x1="0" y1="45" x2="260" y2="45" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" />
                    <line x1="130" y1="0" x2="130" y2="90" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />

                    <path
                      d={scopePoints.map((p, idx) => {
                        const x = (idx / (scopePoints.length - 1)) * 260;
                        const y = 45 - p.e1 * 18;
                        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="1.2"
                      opacity="0.7"
                    />

                    <path
                      d={scopePoints.map((p, idx) => {
                        const x = (idx / (scopePoints.length - 1)) * 260;
                        const y = 45 - p.e2 * 18;
                        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.2"
                      opacity="0.7"
                    />

                    <path
                      d={scopePoints.map((p, idx) => {
                        const x = (idx / (scopePoints.length - 1)) * 260;
                        const y = 45 - (p.eSum / 2) * 36;
                        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.2"
                    />
                  </svg>
                  <div className="absolute bottom-1 right-2 text-[9px] text-amber-300 font-mono">
                    |E_sum| / 2E₀ = {Math.abs(Math.cos(phaseDiffRad / 2) * Math.sqrt(debyeWallerDamping)).toFixed(3)}
                  </div>
                </div>

                {/* Argand Phasor Wheel */}
                <div className="sm:col-span-4 bg-[#030508] border border-slate-800/80 p-2 h-32 flex flex-col items-center justify-center relative">
                  <svg width="96" height="96" viewBox="0 0 100 100" className="overflow-visible">
                    <circle cx="50" cy="50" r="36" stroke="rgba(255,255,255,0.14)" strokeDasharray="2 2" fill="none" />
                    <line x1="8" y1="50" x2="92" y2="50" stroke="rgba(255,255,255,0.1)" />
                    <line x1="50" y1="8" x2="50" y2="92" stroke="rgba(255,255,255,0.1)" />

                    {/* E1 Phasor along +Re */}
                    <line x1="50" y1="50" x2="68" y2="50" stroke="#f43f5e" strokeWidth="2" />
                    <circle cx="68" cy="50" r="2" fill="#f43f5e" />

                    {(() => {
                      const e2x = 68 + 18 * Math.cos(phaseDiffRad);
                      const e2y = 50 - 18 * Math.sin(phaseDiffRad);
                      const totX = 50 + 18 * (1 + Math.cos(phaseDiffRad));
                      const totY = 50 - 18 * Math.sin(phaseDiffRad);
                      return (
                        <>
                          <line x1="68" y1="50" x2={e2x} y2={e2y} stroke="#10b981" strokeWidth="2" />
                          <circle cx={e2x} cy={e2y} r="2" fill="#10b981" />
                          <line x1="50" y1="50" x2={totX} y2={totY} stroke="#fbbf24" strokeWidth="2.5" />
                          <circle cx={totX} cy={totY} r="2.5" fill="#fbbf24" />
                        </>
                      );
                    })()}
                  </svg>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider font-mono">
                    Argand Plane (Δφ = {phaseDiffDeg.toFixed(0)}°)
                  </span>
                </div>
              </div>
            </div>

            {/* Kinematics & Thermal Attenuation Controls Card (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0B0F17] border border-slate-800/90 p-3.5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <span>Kinematic Parameters &amp; Thermal Damping</span>
                <span className="text-sky-400 font-mono">E = {energyKeV.toFixed(2)} keV</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-[#04060A] border border-slate-800/80 p-2">
                  <span className="text-[9px] text-slate-500 block uppercase">Path Difference Δ</span>
                  <span className="font-bold text-amber-300 tabular-nums">{pathLengthDiff.toFixed(precision)} Å</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">{pathDiffInWaves.toFixed(3)} λ</span>
                </div>
                <div className="bg-[#04060A] border border-slate-800/80 p-2">
                  <span className="text-[9px] text-slate-500 block uppercase">Momentum Transfer |Q|</span>
                  <span className="font-bold text-emerald-300 tabular-nums">{qMagnitude.toFixed(4)} Å⁻¹</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">s = sinθ/λ = {sinOverLambda.toFixed(3)}</span>
                </div>
              </div>

              {/* Order n & Debye-Waller B-Factor Controls */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Diffraction Order (n):</span>
                  <div className="flex bg-[#04060A] border border-slate-800 p-0.5">
                    {[1, 2, 3].map(order => (
                      <button
                        key={order}
                        onClick={() => setReflectionOrder(order)}
                        className={`px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                          reflectionOrder === order 
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        n={order}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span className="uppercase font-bold">Debye-Waller Thermal Factor (B):</span>
                    <span className="text-amber-300 font-bold tabular-nums">
                      {debyeWallerB.toFixed(2)} Å² (e⁻²ᴹ = {(debyeWallerDamping * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="3.0"
                    step="0.05"
                    value={debyeWallerB}
                    onChange={(e) => setDebyeWallerB(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 appearance-none accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ATOMIC BASIS & STRUCTURE FACTOR F(hkl) SYNTHESIZER             */}
      {/* ===================================================================== */}
      {activeTab === 'atomic_basis' && (
        <div className="space-y-4">
          {/* Anomalous Dispersion & Friedel Pair Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#04060A] p-2.5 border border-slate-800/90 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAnomalous}
                  onChange={(e) => setIncludeAnomalous(e.target.checked)}
                  className="accent-amber-400 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-slate-300">
                  Anomalous Dispersion Correction <span className="text-amber-400 font-mono">(f = f₀(s) + f&apos; + i·f&apos;&apos;)</span>
                </span>
              </label>

              {includeAnomalous && (
                <div className="flex items-center gap-2 bg-slate-900 px-2 py-0.5 border border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Source:</span>
                  <select
                    value={radiationSource}
                    onChange={(e) => setRadiationSource(e.target.value as 'CuKa' | 'MoKa' | 'Custom')}
                    className="bg-transparent text-[11px] font-mono font-bold text-sky-400 outline-none cursor-pointer"
                  >
                    <option value="CuKa" className="bg-slate-900 text-slate-200">Cu Kα (1.5406 Å)</option>
                    <option value="MoKa" className="bg-slate-900 text-slate-200">Mo Kα (0.7107 Å)</option>
                    <option value="Custom" className="bg-slate-900 text-slate-200">Current λ ({wavelength.toFixed(4)} Å)</option>
                  </select>
                </div>
              )}
            </div>

            {includeAnomalous && structureFactorResult.bijvoetRatio !== undefined && (
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-slate-400">Friedel Pair |F(−h−k−l)|:</span>
                <span className="text-amber-300 font-bold">
                  {structureFactorResult.fFriedelMag !== undefined ? structureFactorResult.fFriedelMag.toFixed(3) : '--'}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Bijvoet ΔI/I:</span>
                <span className="text-emerald-400 font-bold">{(structureFactorResult.bijvoetRatio * 100).toFixed(2)}%</span>
              </div>
            )}
          </div>

          {/* Main 12-Col Grid: Always-Visible Argand Phasor Chain (5 Cols) + Editable Fractional Basis Table (7 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Argand Phasor Summation Complex Plane (5 Cols) */}
            <div className="lg:col-span-5 bg-[#020408] border border-slate-800/90 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  Argand Complex Phasor Chain F({millerH}{millerK}{millerL})
                </span>
                <span className="text-[10px] font-mono text-amber-300 font-bold">
                  {structureFactorResult.fReal.toFixed(2)} {structureFactorResult.fImag >= 0 ? '+' : '−'} {Math.abs(structureFactorResult.fImag).toFixed(2)}i
                </span>
              </div>

              {/* Complex Plane SVG */}
              <div className="w-full aspect-square max-h-[300px] mx-auto relative my-2 flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="-125 -125 250 250" className="overflow-visible">
                  <defs>
                    <marker id="phasor-arrow-gold" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                    </marker>
                  </defs>
                  {/* Reference circles and axes */}
                  <circle cx="0" cy="0" r="100" stroke="rgba(255,255,255,0.07)" strokeDasharray="3 3" fill="none" />
                  <circle cx="0" cy="0" r="50" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 2" fill="none" />
                  <line x1="-115" y1="0" x2="115" y2="0" stroke="rgba(255,255,255,0.16)" />
                  <line x1="0" y1="-115" x2="0" y2="115" stroke="rgba(255,255,255,0.16)" />
                  
                  <text x="92" y="12" fill="#64748b" fontSize="8" className="font-mono font-bold">+Re(F)</text>
                  <text x="-112" y="12" fill="#64748b" fontSize="8" className="font-mono">−Re</text>
                  <text x="5" y="-102" fill="#64748b" fontSize="8" className="font-mono font-bold">+Im(F)</text>

                  {/* Tip-to-tail Atomic Phasor Polygon Chain */}
                  {(() => {
                    const maxMag = Math.max(
                      1,
                      structureFactorResult.fMag,
                      ...structureFactorResult.phasors.map(p => Math.sqrt(p.endX * p.endX + p.endY * p.endY)),
                      structureFactorResult.phasors.reduce((acc, p) => acc + p.fEff, 0) * 0.65
                    );
                    const scaleFactor = 92 / Math.max(1, maxMag);

                    return (
                      <>
                        {structureFactorResult.phasors.map((p, idx) => {
                          const sx = p.startX * scaleFactor;
                          const sy = -p.startY * scaleFactor;
                          const ex = p.endX * scaleFactor;
                          const ey = -p.endY * scaleFactor;
                          const isHovered = hoveredAtomId === p.atom.id;

                          return (
                            <g
                              key={`phasor-seg-${p.atom.id}-${idx}`}
                              onMouseEnter={() => setHoveredAtomId(p.atom.id)}
                              onMouseLeave={() => setHoveredAtomId(null)}
                              className="cursor-pointer"
                            >
                              <line
                                x1={sx}
                                y1={sy}
                                x2={ex}
                                y2={ey}
                                stroke={p.atom.color}
                                strokeWidth={isHovered ? '4' : '2.2'}
                                opacity={hoveredAtomId && !isHovered ? 0.4 : 1}
                              />
                              <circle
                                cx={ex}
                                cy={ey}
                                r={isHovered ? '4' : '2.5'}
                                fill={p.atom.color}
                                stroke="#020408"
                                strokeWidth="0.8"
                              />
                              {isHovered && (
                                <text
                                  x={(sx + ex) / 2 + 6}
                                  y={(sy + ey) / 2 - 6}
                                  fill="#f8fafc"
                                  fontSize="9"
                                  className="font-mono font-bold"
                                >
                                  {p.atom.label} (φ={((p.phaseDeg % 360 + 360) % 360).toFixed(0)}°)
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {/* Resultant Total Vector F_total (Gold Arrow from Origin) */}
                        {structureFactorResult.fMag > 1e-4 ? (
                          <g>
                            <line
                              x1="0"
                              y1="0"
                              x2={structureFactorResult.fReal * scaleFactor}
                              y2={-structureFactorResult.fImag * scaleFactor}
                              stroke="#fbbf24"
                              strokeWidth="3"
                              strokeDasharray="4 2"
                              markerEnd="url(#phasor-arrow-gold)"
                            />
                            <circle
                              cx={structureFactorResult.fReal * scaleFactor}
                              cy={-structureFactorResult.fImag * scaleFactor}
                              r="4"
                              fill="#fbbf24"
                            />
                            <text
                              x={structureFactorResult.fReal * scaleFactor + 7}
                              y={-structureFactorResult.fImag * scaleFactor + 3}
                              fill="#fbbf24"
                              fontSize="9"
                              className="font-mono font-bold"
                            >
                              F_total ({structureFactorResult.fMag.toFixed(1)})
                            </text>
                          </g>
                        ) : (
                          <g>
                            <circle cx="0" cy="0" r="6" fill="none" stroke="#f43f5e" strokeWidth="2" />
                            <text x="10" y="-8" fill="#f43f5e" fontSize="9" className="font-mono font-bold">
                              Closed Polygon (|F| = 0)
                            </text>
                          </g>
                        )}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Phasor Status Footer */}
              <div className="text-[10px] bg-[#0B0F17] p-2.5 border border-slate-800/90 text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Tip-to-Tail Vector Sum ({basisAtoms.length} Basis Atoms):</span>
                  <span className="text-amber-300 font-bold">|F| = {structureFactorResult.fMag.toFixed(3)}</span>
                </div>
                <div className="text-[9px] text-slate-500">
                  Hover any atom row or vector segment to inspect its individual Cromer-Mann amplitude f_j(s) and phase angle 2π(hx_j + ky_j + lz_j).
                </div>
              </div>
            </div>

            {/* Basis Atoms Fractional Coordinate Editor (7 Cols) */}
            <div className="lg:col-span-7 bg-[#0B0F17] border border-slate-800/90 p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-emerald-400" />
                  Fractional Coordinates r_j = (x, y, z) &amp; Atomic Form Factors
                </span>
                <button
                  onClick={handleAddAtom}
                  className="px-2.5 py-1 text-[10px] font-bold uppercase bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Basis Site
                </button>
              </div>

              {/* Basis Atoms List Table */}
              <div className="overflow-x-auto custom-scrollbar max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[9px] uppercase font-bold text-slate-500">
                      <th className="pb-1.5 px-2">Site</th>
                      <th className="pb-1.5 px-1.5">Elem</th>
                      <th className="pb-1.5 px-1.5">x</th>
                      <th className="pb-1.5 px-1.5">y</th>
                      <th className="pb-1.5 px-1.5">z</th>
                      <th className="pb-1.5 px-1.5">f_eff(s)</th>
                      <th className="pb-1.5 px-1.5">h·r_j</th>
                      <th className="pb-1.5 px-1.5">Phase φ</th>
                      <th className="pb-1.5 px-1 text-right">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {structureFactorResult.phasors.map((p) => {
                      const isHovered = hoveredAtomId === p.atom.id;
                      const normPhase = ((p.phaseDeg % 360) + 360) % 360;
                      return (
                        <tr
                          key={p.atom.id}
                          onMouseEnter={() => setHoveredAtomId(p.atom.id)}
                          onMouseLeave={() => setHoveredAtomId(null)}
                          className={`transition-colors ${
                            isHovered ? 'bg-sky-500/10' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="py-1.5 px-2 text-[11px] font-semibold text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.atom.color }} />
                              <input
                                type="text"
                                value={p.atom.label}
                                onChange={(e) => handleUpdateAtom(p.atom.id, { label: e.target.value })}
                                className="w-16 bg-transparent text-[11px] text-slate-200 outline-none focus:border-b focus:border-sky-400"
                              />
                            </div>
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="text"
                              value={p.atom.element}
                              onChange={(e) => handleUpdateAtom(p.atom.id, { element: e.target.value })}
                              className="w-10 bg-[#04060A] border border-slate-700/80 text-center text-xs text-sky-400 font-bold px-1 py-0.5 outline-none"
                            />
                          </td>
                          {([0, 1, 2] as const).map((coordIdx) => (
                            <td key={coordIdx} className="py-1.5 px-1.5">
                              <input
                                type="number"
                                step="0.125"
                                value={p.atom.coords[coordIdx]}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value) || 0;
                                  const nextCoords: [number, number, number] = [...p.atom.coords] as [number, number, number];
                                  nextCoords[coordIdx] = v;
                                  handleUpdateAtom(p.atom.id, { coords: nextCoords });
                                }}
                                className="w-14 bg-[#04060A] border border-slate-700/80 text-center text-xs text-slate-200 px-1 py-0.5 outline-none tabular-nums"
                              />
                            </td>
                          ))}
                          <td className="py-1.5 px-1.5 text-[11px] text-amber-300 tabular-nums font-bold">
                            {p.fEff.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-1.5 text-[10px] text-slate-400 tabular-nums">
                            {p.dotProduct.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-1.5 text-[11px] text-purple-300 tabular-nums font-bold">
                            {normPhase.toFixed(0)}°
                          </td>
                          <td className="py-1.5 px-1 text-right">
                            <button
                              onClick={() => handleRemoveAtom(p.atom.id)}
                              disabled={basisAtoms.length <= 1}
                              className="text-slate-500 hover:text-rose-400 disabled:opacity-30 p-1 transition-colors"
                              title="Remove basis site"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Crystallographic Structure Factor Equation Card */}
              <div className="p-3 bg-[#04060A] border border-slate-800/90 text-[10px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase tracking-wider">Structure Factor Summation Formula:</span>
                  <span className="text-sky-400 font-mono">s = sin(θ)/λ = {(1 / (2 * Math.max(0.01, structureFactorResult.dSpacing))).toFixed(4)} Å⁻¹</span>
                </div>
                <div className="font-mono text-emerald-300 text-xs py-0.5">
                  F(hkl) = ∑ f_j(s) · exp(−B_j s²) · exp[ 2πi (h x_j + k y_j + l z_j) ]
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: DUAL DIRECT & RECIPROCAL BASIS VECTORS (3D)                    */}
      {/* ===================================================================== */}
      {activeTab === 'reciprocal_basis' && (
        <div className="space-y-4">
          {/* Unit Cell Parameters Input HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-[#04060A] p-3 border border-slate-800/90">
            {([
              { key: 'a', label: 'a (Å)', step: 0.01, color: 'text-rose-400' },
              { key: 'b', label: 'b (Å)', step: 0.01, color: 'text-emerald-400' },
              { key: 'c', label: 'c (Å)', step: 0.01, color: 'text-sky-400' },
              { key: 'alpha', label: 'α (°)', step: 0.5, color: 'text-purple-400' },
              { key: 'beta', label: 'β (°)', step: 0.5, color: 'text-purple-400' },
              { key: 'gamma', label: 'γ (°)', step: 0.5, color: 'text-purple-400' }
            ] as const).map((param) => (
              <div key={param.key}>
                <label className="text-[9px] font-bold text-slate-500 uppercase block">{param.label}</label>
                <input
                  type="number"
                  step={param.step}
                  value={unitCell[param.key]}
                  onChange={(e) =>
                    setUnitCell({
                      ...unitCell,
                      [param.key]: parseFloat(e.target.value) || (param.key.length === 1 ? 1 : 90)
                    })
                  }
                  className={`w-full bg-[#0B0F17] border border-slate-700/80 text-xs font-bold ${param.color} px-2 py-1 mt-1 outline-none tabular-nums`}
                />
              </div>
            ))}
          </div>

          {/* 3D Basis Vector Stage & Metric Tensor Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 3D Interactive Basis Vector Orbit Canvas (7 Cols) */}
            <div 
              className="lg:col-span-7 bg-[#020408] border border-slate-800/90 relative aspect-[4/3] overflow-hidden select-none cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => {
                setIsOrbiting(true);
                lastMousePos.current = { x: e.clientX, y: e.clientY };
              }}
              onMouseMove={(e) => {
                if (!isOrbiting) return;
                const dx = e.clientX - lastMousePos.current.x;
                const dy = e.clientY - lastMousePos.current.y;
                lastMousePos.current = { x: e.clientX, y: e.clientY };
                setRotY(prev => prev + dx * 0.7);
                setRotX(prev => Math.max(-85, Math.min(85, prev - dy * 0.7)));
              }}
              onMouseUp={() => setIsOrbiting(false)}
              onMouseLeave={() => setIsOrbiting(false)}
            >
              {/* Overlay HUD */}
              <div className="absolute top-2.5 left-3 z-10 text-[9px] bg-black/75 px-2.5 py-1 border border-slate-800 pointer-events-none flex items-center gap-2">
                <span className="text-slate-400">Drag 3D Basis ·</span>
                <span className="text-sky-400 font-bold">Pitch {rotX.toFixed(0)}° · Yaw {rotY.toFixed(0)}°</span>
              </div>

              {/* Layer Toggles & Camera Presets */}
              <div className="absolute bottom-2.5 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-1 bg-black/80 border border-slate-800 p-1">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 px-1 font-bold">Camera:</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRotX(0); setRotY(0); }}
                    className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    Front
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRotX(90); setRotY(0); }}
                    className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    Top
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRotX(-20); setRotY(35); setZoom3D(1.0); }}
                    className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-900 hover:bg-slate-800 text-sky-300"
                  >
                    Iso Reset
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-black/80 border border-slate-800 p-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowReciprocalVectors3D(!showReciprocalVectors3D); }}
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                      showReciprocalVectors3D ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500'
                    }`}
                  >
                    a*, b*, c*
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowHklPlane3D(!showHklPlane3D); }}
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                      showHklPlane3D ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-500'
                    }`}
                  >
                    ({millerH}{millerK}{millerL}) Plane
                  </button>
                </div>
              </div>

              <div className="absolute top-2.5 right-3 z-10 flex items-center gap-1.5">
                <div className="flex items-center bg-black/80 border border-slate-700 p-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setZoom3D(prev => Math.min(2.5, prev + 0.15)); }}
                    className="px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-sky-300 font-bold"
                  >
                    +
                  </button>
                  <span className="text-[8px] text-slate-400 px-1 font-mono">{zoom3D.toFixed(1)}x</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setZoom3D(prev => Math.max(0.5, prev - 0.15)); }}
                    className="px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-sky-300 font-bold"
                  >
                    −
                  </button>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setIsAutoRotate3D(!isAutoRotate3D); }}
                  className={`px-2 py-1 text-[9px] font-bold uppercase border transition-all ${
                    isAutoRotate3D ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-black/60 text-slate-400 border-slate-700'
                  }`}
                >
                  {isAutoRotate3D ? 'Orbiting' : 'Auto-Orbit'}
                </button>
              </div>

              {/* 3D SVG Projection */}
              <svg width="100%" height="100%" viewBox="0 0 380 300" className="w-full h-full">
                <defs>
                  <marker id="arrow-a" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                  </marker>
                  <marker id="arrow-b" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                  </marker>
                  <marker id="arrow-c" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="arrow-g" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                  </marker>
                  <marker id="arrow-recip" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" />
                  </marker>
                </defs>

                {(() => {
                  const o = project3D({ x: 0, y: 0, z: 0 }, 26, 190, 165);
                  const aPt = project3D(basisAndReciprocal.aVec, 26, 190, 165);
                  const bPt = project3D(basisAndReciprocal.bVec, 26, 190, 165);
                  const cPt = project3D(basisAndReciprocal.cVec, 26, 190, 165);

                  const abPt = project3D({
                    x: basisAndReciprocal.aVec.x + basisAndReciprocal.bVec.x,
                    y: basisAndReciprocal.aVec.y + basisAndReciprocal.bVec.y,
                    z: basisAndReciprocal.aVec.z + basisAndReciprocal.bVec.z
                  }, 26, 190, 165);

                  const acPt = project3D({
                    x: basisAndReciprocal.aVec.x + basisAndReciprocal.cVec.x,
                    y: basisAndReciprocal.aVec.y + basisAndReciprocal.cVec.y,
                    z: basisAndReciprocal.aVec.z + basisAndReciprocal.cVec.z
                  }, 26, 190, 165);

                  const bcPt = project3D({
                    x: basisAndReciprocal.bVec.x + basisAndReciprocal.cVec.x,
                    y: basisAndReciprocal.bVec.y + basisAndReciprocal.cVec.y,
                    z: basisAndReciprocal.bVec.z + basisAndReciprocal.cVec.z
                  }, 26, 190, 165);

                  const abcPt = project3D({
                    x: basisAndReciprocal.aVec.x + basisAndReciprocal.bVec.x + basisAndReciprocal.cVec.x,
                    y: basisAndReciprocal.aVec.y + basisAndReciprocal.bVec.y + basisAndReciprocal.cVec.y,
                    z: basisAndReciprocal.aVec.z + basisAndReciprocal.bVec.z + basisAndReciprocal.cVec.z
                  }, 26, 190, 165);

                  // Reciprocal basis vectors scaled for visualization
                  const recipScale = 9;
                  const aStarPt = project3D({
                    x: basisAndReciprocal.aStarVec.x * recipScale,
                    y: basisAndReciprocal.aStarVec.y * recipScale,
                    z: basisAndReciprocal.aStarVec.z * recipScale
                  }, 26, 190, 165);
                  const bStarPt = project3D({
                    x: basisAndReciprocal.bStarVec.x * recipScale,
                    y: basisAndReciprocal.bStarVec.y * recipScale,
                    z: basisAndReciprocal.bStarVec.z * recipScale
                  }, 26, 190, 165);
                  const cStarPt = project3D({
                    x: basisAndReciprocal.cStarVec.x * recipScale,
                    y: basisAndReciprocal.cStarVec.y * recipScale,
                    z: basisAndReciprocal.cStarVec.z * recipScale
                  }, 26, 190, 165);

                  // Reciprocal normal vector G_hkl
                  const gVecScaled: Vector3D = {
                    x: structureFactorResult.gHklVec.x * 10,
                    y: structureFactorResult.gHklVec.y * 10,
                    z: structureFactorResult.gHklVec.z * 10
                  };
                  const gPt = project3D(gVecScaled, 26, 190, 165);

                  // Intercepts for (hkl) plane polygon inside unit cell
                  const planeIntercepts: { x: number; y: number }[] = [];
                  if (showHklPlane3D) {
                    if (millerH !== 0) {
                      const f = 1 / Math.abs(millerH);
                      planeIntercepts.push(project3D({
                        x: basisAndReciprocal.aVec.x * f,
                        y: basisAndReciprocal.aVec.y * f,
                        z: basisAndReciprocal.aVec.z * f
                      }, 26, 190, 165));
                    }
                    if (millerK !== 0) {
                      const f = 1 / Math.abs(millerK);
                      planeIntercepts.push(project3D({
                        x: basisAndReciprocal.bVec.x * f,
                        y: basisAndReciprocal.bVec.y * f,
                        z: basisAndReciprocal.bVec.z * f
                      }, 26, 190, 165));
                    }
                    if (millerL !== 0) {
                      const f = 1 / Math.abs(millerL);
                      planeIntercepts.push(project3D({
                        x: basisAndReciprocal.cVec.x * f,
                        y: basisAndReciprocal.cVec.y * f,
                        z: basisAndReciprocal.cVec.z * f
                      }, 26, 190, 165));
                    }
                  }

                  return (
                    <g>
                      {/* Unit Cell Wireframe Edges */}
                      <line x1={aPt.x} y1={aPt.y} x2={abPt.x} y2={abPt.y} stroke="rgba(255,255,255,0.16)" strokeDasharray="2 2" />
                      <line x1={bPt.x} y1={bPt.y} x2={abPt.x} y2={abPt.y} stroke="rgba(255,255,255,0.16)" strokeDasharray="2 2" />
                      <line x1={aPt.x} y1={aPt.y} x2={acPt.x} y2={acPt.y} stroke="rgba(255,255,255,0.16)" strokeDasharray="2 2" />
                      <line x1={cPt.x} y1={cPt.y} x2={acPt.x} y2={acPt.y} stroke="rgba(255,255,255,0.16)" strokeDasharray="2 2" />
                      <line x1={bPt.x} y1={bPt.y} x2={bcPt.x} y2={bcPt.y} stroke="rgba(255,255,255,0.16)" strokeDasharray="2 2" />
                      <line x1={cPt.x} y1={cPt.y} x2={bcPt.x} y2={bcPt.y} stroke="rgba(255,255,255,0.16)" strokeDasharray="2 2" />
                      <line x1={abPt.x} y1={abPt.y} x2={abcPt.x} y2={abcPt.y} stroke="rgba(255,255,255,0.16)" strokeDasharray="2 2" />
                      <line x1={acPt.x} y1={acPt.y} x2={abcPt.x} y2={abcPt.y} stroke="rgba(255,255,255,0.16)" strokeDasharray="2 2" />
                      <line x1={bcPt.x} y1={bcPt.y} x2={abcPt.x} y2={abcPt.y} stroke="rgba(255,255,255,0.16)" strokeDasharray="2 2" />

                      {/* Optional (hkl) Plane Intercept Triangle */}
                      {planeIntercepts.length === 3 && (
                        <polygon
                          points={planeIntercepts.map(pt => `${pt.x},${pt.y}`).join(' ')}
                          fill="rgba(192, 132, 252, 0.22)"
                          stroke="#c084fc"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Direct Basis Vector a (Rose) */}
                      <line x1={o.x} y1={o.y} x2={aPt.x} y2={aPt.y} stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrow-a)" />
                      <text x={aPt.x + 5} y={aPt.y} fill="#f43f5e" fontSize="11" className="font-bold">a</text>

                      {/* Direct Basis Vector b (Green) */}
                      <line x1={o.x} y1={o.y} x2={bPt.x} y2={bPt.y} stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow-b)" />
                      <text x={bPt.x + 5} y={bPt.y} fill="#10b981" fontSize="11" className="font-bold">b</text>

                      {/* Direct Basis Vector c (Sky Blue) */}
                      <line x1={o.x} y1={o.y} x2={cPt.x} y2={cPt.y} stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow-c)" />
                      <text x={cPt.x + 5} y={cPt.y} fill="#38bdf8" fontSize="11" className="font-bold">c</text>

                      {/* Reciprocal Basis Vectors a*, b*, c* */}
                      {showReciprocalVectors3D && (
                        <g opacity="0.85">
                          <line x1={o.x} y1={o.y} x2={aStarPt.x} y2={aStarPt.y} stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#arrow-recip)" />
                          <text x={aStarPt.x + 4} y={aStarPt.y - 2} fill="#c084fc" fontSize="9" className="font-mono">a*</text>
                          <line x1={o.x} y1={o.y} x2={bStarPt.x} y2={bStarPt.y} stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#arrow-recip)" />
                          <text x={bStarPt.x + 4} y={bStarPt.y - 2} fill="#c084fc" fontSize="9" className="font-mono">b*</text>
                          <line x1={o.x} y1={o.y} x2={cStarPt.x} y2={cStarPt.y} stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#arrow-recip)" />
                          <text x={cStarPt.x + 4} y={cStarPt.y - 2} fill="#c084fc" fontSize="9" className="font-mono">c*</text>
                        </g>
                      )}

                      {/* Reciprocal Lattice Vector G_hkl (Gold) */}
                      {vectorLength(structureFactorResult.gHklVec) > 1e-4 && (
                        <g>
                          <line x1={o.x} y1={o.y} x2={gPt.x} y2={gPt.y} stroke="#fbbf24" strokeWidth="3" markerEnd="url(#arrow-g)" />
                          <text x={gPt.x + 6} y={gPt.y} fill="#fbbf24" fontSize="10" className="font-bold">
                            G({millerH}{millerK}{millerL})
                          </text>
                        </g>
                      )}

                      {/* Basis Atoms projected in unit cell */}
                      {basisAtoms.map((atom) => {
                        const cartPos: Vector3D = {
                          x: atom.coords[0] * basisAndReciprocal.aVec.x + atom.coords[1] * basisAndReciprocal.bVec.x + atom.coords[2] * basisAndReciprocal.cVec.x,
                          y: atom.coords[0] * basisAndReciprocal.aVec.y + atom.coords[1] * basisAndReciprocal.bVec.y + atom.coords[2] * basisAndReciprocal.cVec.y,
                          z: atom.coords[0] * basisAndReciprocal.aVec.z + atom.coords[1] * basisAndReciprocal.bVec.z + atom.coords[2] * basisAndReciprocal.cVec.z
                        };
                        const pt = project3D(cartPos, 26, 190, 165);
                        return (
                          <g key={atom.id}>
                            <circle cx={pt.x} cy={pt.y} r="5" fill={atom.color} stroke="#ffffff" strokeWidth="1" />
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Metric Tensor Matrices & Volume Telemetry (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0B0F17] border border-slate-800/90 p-4 flex flex-col justify-between space-y-3.5">
              {/* Unit Cell Volumes */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-[#04060A] border border-slate-800">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Direct Cell Volume (V)</span>
                  <span className="font-bold text-sky-400 text-sm tabular-nums">
                    {basisAndReciprocal.directVolume.toFixed(3)} Å³
                  </span>
                </div>
                <div className="p-2.5 bg-[#04060A] border border-slate-800">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Reciprocal Volume (V*)</span>
                  <span className="font-bold text-amber-400 text-sm tabular-nums">
                    {basisAndReciprocal.reciprocalVolume.toFixed(5)} Å⁻³
                  </span>
                </div>
              </div>

              {/* Direct Metric Tensor G */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Direct Metric Tensor G_ij = a_i · a_j (Å²)</span>
                  <span className="text-sky-400 font-mono">det(G) = V²</span>
                </div>
                <div className="bg-[#04060A] border border-slate-800 p-2 text-[11px] font-mono grid grid-cols-3 gap-1 text-center tabular-nums">
                  {basisAndReciprocal.directMetricTensor.flatMap((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <span key={`g-${rIdx}-${cIdx}`} className={`py-1 ${rIdx === cIdx ? 'text-sky-300 font-bold bg-sky-950/25' : 'text-slate-400 bg-slate-900/50'}`}>
                        {val.toFixed(3)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Reciprocal Metric Tensor G* */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Reciprocal Metric Tensor G*_ij = a*_i · a*_j (Å⁻²)</span>
                  <span className="text-amber-400 font-mono">1/d² = hᵀ G* h</span>
                </div>
                <div className="bg-[#04060A] border border-slate-800 p-2 text-[11px] font-mono grid grid-cols-3 gap-1 text-center tabular-nums">
                  {basisAndReciprocal.reciprocalMetricTensor.flatMap((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <span key={`gstar-${rIdx}-${cIdx}`} className={`py-1 ${rIdx === cIdx ? 'text-amber-300 font-bold bg-amber-950/25' : 'text-slate-400 bg-slate-900/50'}`}>
                        {val.toFixed(5)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Reciprocal Basis Vector Lengths */}
              <div className="p-2.5 bg-[#04060A] border border-slate-800 text-[10px] space-y-1">
                <div className="text-slate-400 font-bold uppercase tracking-wider">Reciprocal Basis Parameters</div>
                <div className="grid grid-cols-3 gap-1 font-mono text-emerald-400 tabular-nums">
                  <span>a* = {basisAndReciprocal.reciprocalParams.aStar.toFixed(4)}</span>
                  <span>b* = {basisAndReciprocal.reciprocalParams.bStar.toFixed(4)}</span>
                  <span>c* = {basisAndReciprocal.reciprocalParams.cStar.toFixed(4)}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 font-mono text-purple-300 text-[9px] pt-0.5 tabular-nums">
                  <span>α* = {basisAndReciprocal.reciprocalParams.alphaStar.toFixed(1)}°</span>
                  <span>β* = {basisAndReciprocal.reciprocalParams.betaStar.toFixed(1)}°</span>
                  <span>γ* = {basisAndReciprocal.reciprocalParams.gammaStar.toFixed(1)}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: SUB-PLANE INTERFERENCE & STANDING WAVE STACKING                */}
      {/* ===================================================================== */}
      {activeTab === 'plane_stacking' && (
        <div className="space-y-4">
          <div className="bg-[#0B0F17] p-3.5 border border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Fractional Sub-Plane Wavelet Interference for ({millerH} {millerK} {millerL})
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Each basis site j sits at fractional depth z_j / d_hkl = (h·x_j + k·y_j + l·z_j) mod 1, shifting its reflected wavelet by φ_j = 360° · (z_j / d_hkl).
              </p>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-slate-400">Interplanar Spacing: </span>
              <strong className="text-sky-400">{structureFactorResult.dSpacing.toFixed(4)} Å</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Scaled SVG Multi-Plane Depth & Reflected Wavelet Visualizer (7 Cols) */}
            <div className="lg:col-span-7 bg-[#020408] border border-slate-800/90 p-4">
              <svg width="100%" height="100%" viewBox="0 0 520 300" className="w-full h-auto max-h-[320px] overflow-visible">
                {/* Top Primary Plane z = 0 */}
                <line x1="30" y1="35" x2="360" y2="35" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
                <text x="34" y="25" fill="#38bdf8" fontSize="10" className="font-mono font-bold">
                  Primary Plane z = 0.00 d_hkl (φ = 0°)
                </text>

                {/* Bottom Primary Plane z = 1.0 d_hkl */}
                <line x1="30" y1="265" x2="360" y2="265" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
                <text x="34" y="283" fill="#38bdf8" fontSize="10" className="font-mono font-bold">
                  Next Bragg Plane z = 1.00 d_hkl (φ = 360°)
                </text>

                {/* Mid-plane 180 deg destructive reference line */}
                <line x1="30" y1="150" x2="360" y2="150" stroke="rgba(244,63,94,0.25)" strokeWidth="1" strokeDasharray="2 4" />
                <text x="36" y="145" fill="rgba(244,63,94,0.6)" fontSize="8" className="font-mono">
                  z = 0.50 d_hkl (φ = 180° Anti-Phase Line)
                </text>

                {/* Right-side Wavelet Interference Column Header */}
                <text x="440" y="22" fill="#94a3b8" fontSize="9" textAnchor="middle" className="font-mono font-bold uppercase">
                  Reflected Wavelet
                </text>
                <line x1="440" y1="30" x2="440" y2="270" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />

                {/* Basis Atom Sub-Planes */}
                {structureFactorResult.phasors.map((p, idx) => {
                  const fracDepth = ((p.dotProduct % 1) + 1) % 1;
                  const yPos = 35 + fracDepth * 230;
                  const normPhaseDeg = fracDepth * 360;
                  const phaseRad = fracDepth * 2 * Math.PI;
                  const isHovered = hoveredAtomId === p.atom.id;

                  // Generate mini wavelet for this sub-plane on the right
                  const wavePts = [];
                  for (let k = 0; k <= 36; k++) {
                    const wx = 385 + (k / 36) * 110;
                    const wy = yPos - Math.cos((k / 36) * 4 * Math.PI - phaseRad) * 9;
                    wavePts.push(`${k === 0 ? 'M' : 'L'} ${wx.toFixed(1)} ${wy.toFixed(1)}`);
                  }

                  return (
                    <g
                      key={`subplane-svg-${p.atom.id}-${idx}`}
                      onMouseEnter={() => setHoveredAtomId(p.atom.id)}
                      onMouseLeave={() => setHoveredAtomId(null)}
                      className="cursor-pointer"
                    >
                      <line
                        x1="45"
                        y1={yPos}
                        x2="355"
                        y2={yPos}
                        stroke={p.atom.color}
                        strokeWidth={isHovered ? '2.5' : '1.4'}
                        strokeOpacity={isHovered ? '1' : '0.7'}
                      />
                      {/* Representative atoms along the sub-plane */}
                      {[80, 145, 210, 275].map((axPos, aIdx) => (
                        <circle
                          key={aIdx}
                          cx={axPos + (idx % 2) * 18}
                          cy={yPos}
                          r={isHovered ? '5.5' : '4'}
                          fill={p.atom.color}
                          stroke="#020408"
                          strokeWidth="1"
                        />
                      ))}
                      <text
                        x="350"
                        y={yPos - 5}
                        fill="#e2e8f0"
                        fontSize="9"
                        textAnchor="end"
                        className="font-mono font-bold"
                      >
                        {p.atom.label} (z={fracDepth.toFixed(2)}d, φ={normPhaseDeg.toFixed(0)}°)
                      </text>

                      {/* Reflected wavelet trace */}
                      <path
                        d={wavePts.join(' ')}
                        fill="none"
                        stroke={p.atom.color}
                        strokeWidth={isHovered ? '2.4' : '1.6'}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Sub-Plane Phase & Interference Table (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0B0F17] border border-slate-800/90 p-4 flex flex-col justify-between space-y-3">
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800/80">
                Sub-Plane Phase Contributions to Re(F) &amp; Im(F)
              </div>

              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-[9px] text-slate-500 uppercase">
                      <th className="pb-1.5">Atom</th>
                      <th className="pb-1.5">z / d_hkl</th>
                      <th className="pb-1.5">Phase φ</th>
                      <th className="pb-1.5">f·cos φ</th>
                      <th className="pb-1.5 text-right">Interference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {structureFactorResult.phasors.map((p) => {
                      const fracDepth = ((p.dotProduct % 1) + 1) % 1;
                      const cosPhi = Math.cos(p.phaseRad);
                      return (
                        <tr
                          key={`sp-row-${p.atom.id}`}
                          onMouseEnter={() => setHoveredAtomId(p.atom.id)}
                          onMouseLeave={() => setHoveredAtomId(null)}
                          className="hover:bg-white/[0.02]"
                        >
                          <td className="py-1.5 font-bold text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.atom.color }} />
                            <span>{p.atom.label}</span>
                          </td>
                          <td className="py-1.5 text-sky-400 tabular-nums">{fracDepth.toFixed(3)}</td>
                          <td className="py-1.5 text-purple-300 tabular-nums">{(fracDepth * 360).toFixed(0)}°</td>
                          <td className="py-1.5 text-amber-300 tabular-nums">{p.realComponent.toFixed(2)}</td>
                          <td className="py-1.5 text-right text-[10px] font-bold">
                            {cosPhi > 0.15 ? (
                              <span className="text-emerald-400">Constructive</span>
                            ) : cosPhi < -0.15 ? (
                              <span className="text-rose-400">Destructive</span>
                            ) : (
                              <span className="text-amber-400">Quadrature</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-2.5 bg-[#04060A] border border-slate-800 text-[10px] flex items-center justify-between">
                <span className="text-slate-400">Net Superposition Amplitude |F({millerH}{millerK}{millerL})|:</span>
                <strong className={structureFactorResult.isExtinct ? 'text-rose-400' : 'text-emerald-400'}>
                  {structureFactorResult.fMag.toFixed(3)} ({structureFactorResult.isExtinct ? 'Total Cancellation' : 'Active Peak'})
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: 2D LATTICE PROJECTION (REAL SPACE)                             */}
      {/* ===================================================================== */}
      {activeTab === '2d_lattice' && (
        <div className="space-y-4">
          {/* Projection Axis & Grid Supercell Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#04060A] p-3 border border-slate-800/90 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projection Plane:</span>
              <div className="flex bg-[#0B0F17] border border-slate-800 p-0.5">
                {([
                  { id: 'ab', label: 'ab-Plane [001]' },
                  { id: 'bc', label: 'bc-Plane [100]' },
                  { id: 'ac', label: 'ac-Plane [010]' }
                ] as const).map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => setProjectionPlane(pl.id)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-colors ${
                      projectionPlane === pl.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Supercell Range (±{gridCellsCount} cells):
              </span>
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={gridCellsCount}
                onChange={(e) => setGridCellsCount(parseInt(e.target.value) || 3)}
                className="w-24 accent-cyan-400 h-1.5 bg-slate-800"
              />
            </div>
          </div>

          {/* 2D Grid Visualizer */}
          <div className="bg-[#020408] border border-slate-800/90 p-4 w-full flex justify-center relative overflow-hidden">
            <svg width="100%" viewBox="-160 -140 320 280" className="max-w-3xl max-h-[380px] overflow-visible">
              <defs>
                <marker id="arrowhead-u" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#f43f5e" />
                </marker>
                <marker id="arrowhead-v" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
                </marker>
              </defs>
              <g transform="scale(1, -1)">
                {(() => {
                  // Select 2D basis vectors based on projectionPlane
                  const uLen = projectionPlane === 'ab' ? unitCell.a : projectionPlane === 'bc' ? unitCell.b : unitCell.a;
                  const vLen = projectionPlane === 'ab' ? unitCell.b : projectionPlane === 'bc' ? unitCell.c : unitCell.c;
                  const angleDeg = projectionPlane === 'ab' ? unitCell.gamma : projectionPlane === 'bc' ? unitCell.alpha : unitCell.beta;
                  const angleRad = (angleDeg * Math.PI) / 180;

                  const uVec = { x: uLen, y: 0 };
                  const vVec = { x: vLen * Math.cos(angleRad), y: vLen * Math.sin(angleRad) };

                  const hU = projectionPlane === 'ab' ? millerH : projectionPlane === 'bc' ? millerK : millerH;
                  const hV = projectionPlane === 'ab' ? millerK : projectionPlane === 'bc' ? millerL : millerL;
                  const coordIdxU = projectionPlane === 'ab' ? 0 : projectionPlane === 'bc' ? 1 : 0;
                  const coordIdxV = projectionPlane === 'ab' ? 1 : projectionPlane === 'bc' ? 2 : 2;

                  const scale = Math.min(34, 115 / Math.max(1, gridCellsCount * Math.max(uLen, vLen) * 0.32));
                  const gridLines = [];

                  for (let u = -gridCellsCount; u < gridCellsCount; u++) {
                    for (let v = -gridCellsCount; v < gridCellsCount; v++) {
                      const x = (u * uVec.x + v * vVec.x) * scale;
                      const y = (u * uVec.y + v * vVec.y) * scale;
                      const nextUx = ((u + 1) * uVec.x + v * vVec.x) * scale;
                      const nextUy = ((u + 1) * uVec.y + v * vVec.y) * scale;
                      const nextVx = (u * uVec.x + (v + 1) * vVec.x) * scale;
                      const nextVy = (u * uVec.y + (v + 1) * vVec.y) * scale;
                      
                      gridLines.push(
                        <line key={`gu-${u}-${v}`} x1={x} y1={y} x2={nextUx} y2={nextUy} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                      );
                      gridLines.push(
                        <line key={`gv-${u}-${v}`} x1={x} y1={y} x2={nextVx} y2={nextVy} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                      );
                    }
                  }

                  // Draw projected (hkl) planes where hU*u + hV*v = n
                  const planeLines = [];
                  if (hU !== 0 || hV !== 0) {
                    for (let n = -12; n <= 12; n++) {
                      let u1: number, v1: number, u2: number, v2: number;
                      if (Math.abs(hV) > 1e-5) {
                        u1 = -gridCellsCount - 1; v1 = (n - hU * u1) / hV;
                        u2 = gridCellsCount + 1; v2 = (n - hU * u2) / hV;
                      } else {
                        u1 = n / hU; v1 = -gridCellsCount - 1;
                        u2 = n / hU; v2 = gridCellsCount + 1;
                      }
                      const px1 = (u1 * uVec.x + v1 * vVec.x) * scale;
                      const py1 = (u1 * uVec.y + v1 * vVec.y) * scale;
                      const px2 = (u2 * uVec.x + v2 * vVec.x) * scale;
                      const py2 = (u2 * uVec.y + v2 * vVec.y) * scale;

                      planeLines.push(
                        <line
                          key={`p-${n}`}
                          x1={px1}
                          y1={py1}
                          x2={px2}
                          y2={py2}
                          stroke="#c084fc"
                          strokeWidth={n === 0 || n === 1 ? '1.8' : '1.2'}
                          strokeDasharray="4 4"
                          opacity={n === 0 || n === 1 ? '0.85' : '0.32'}
                        />
                      );
                    }
                  }

                  // Draw basis atoms over the supercell
                  const atomCircles = [];
                  for (let u = -gridCellsCount; u < gridCellsCount; u++) {
                    for (let v = -gridCellsCount; v < gridCellsCount; v++) {
                      basisAtoms.forEach((atom, idx) => {
                        const fracU = u + atom.coords[coordIdxU];
                        const fracV = v + atom.coords[coordIdxV];
                        const cx = (fracU * uVec.x + fracV * vVec.x) * scale;
                        const cy = (fracU * uVec.y + fracV * vVec.y) * scale;
                        
                        const isCenter = u === 0 && v === 0;
                        atomCircles.push(
                          <circle
                            key={`atom-${u}-${v}-${idx}`}
                            cx={cx}
                            cy={cy}
                            r={isCenter ? '4.5' : '3'}
                            fill={atom.color}
                            opacity={isCenter ? '1' : '0.45'}
                            stroke="#020408"
                            strokeWidth="1"
                          />
                        );
                      });
                    }
                  }

                  return (
                    <>
                      {gridLines}
                      {planeLines}
                      {atomCircles}
                      
                      {/* Origin & Projected Basis Axes */}
                      <circle cx="0" cy="0" r="3" fill="#fff" />
                      <line x1="0" y1="0" x2={uVec.x * scale} y2={uVec.y * scale} stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrowhead-u)" />
                      <line x1="0" y1="0" x2={vVec.x * scale} y2={vVec.y * scale} stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrowhead-v)" />
                    </>
                  );
                })()}
              </g>
            </svg>

            <div className="absolute top-2.5 right-3 text-[10px] text-slate-300 bg-black/75 px-2.5 py-1 border border-slate-800">
              <span className="text-purple-400 font-bold mr-1">- - -</span> ({millerH}{millerK}{millerL}) Traces on {projectionPlane}-plane
            </div>
            <div className="absolute bottom-2.5 left-3 text-[10px] text-slate-300 bg-black/75 px-2.5 py-1 border border-slate-800 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-rose-500 inline-block" /> {projectionPlane[0]}-axis
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> {projectionPlane[1]}-axis
              </span>
              <span className="text-slate-500">· Central unit cell highlighted</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: KINEMATIC POWDER XRD DIFFRACTION SPECTRUM                      */}
      {/* ===================================================================== */}
      {activeTab === 'powder_spectrum' && (
        <div className="space-y-4">
          {/* Header Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#04060A] p-3 border border-slate-800/90 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">2θ Max:</span>
                <input
                  type="range"
                  min="40"
                  max="140"
                  step="5"
                  value={twoThetaMaxSpectrum}
                  onChange={(e) => setTwoThetaMaxSpectrum(parseInt(e.target.value))}
                  className="w-24 accent-rose-500 h-1.5 bg-slate-800"
                />
                <span className="font-mono text-rose-400 font-bold">{twoThetaMaxSpectrum}°</span>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterExtinctSpectrum}
                  onChange={(e) => setFilterExtinctSpectrum(e.target.checked)}
                  className="accent-rose-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-300">Hide Systematic Absences</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showContinuousProfile}
                  onChange={(e) => setShowContinuousProfile(e.target.checked)}
                  className="accent-sky-400 cursor-pointer"
                />
                <span className="text-[11px] text-slate-300">Broadened Profile Envelope</span>
              </label>
            </div>

            <button
              onClick={() => {
                const headers = 'h,k,l,d_A,two_theta_deg,F_mag,multiplicity,intensity_rel,status\n';
                const rows = powderSpectrum
                  .filter(p => !filterExtinctSpectrum || !p.isExtinct)
                  .map(p => `${p.h},${p.k},${p.l},${p.dSpacing.toFixed(4)},${p.twoTheta.toFixed(3)},${p.fMag.toFixed(3)},${p.multiplicity},${p.relativeIntensity.toFixed(2)},${p.isExtinct ? 'EXTINCT' : 'ALLOWED'}`)
                  .join('\n');
                const blob = new Blob([headers + rows], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `powder_spectrum_${selectedPresetId}_${radiationSource}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> Export Reflections CSV
            </button>
          </div>

          {/* Interactive Powder Diffractogram Stick + Envelope Pattern */}
          <div className="bg-[#020408] border border-slate-800/90 p-4 space-y-2 relative">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
                Kinematic Powder XRD Diffractogram (λ = {wavelength.toFixed(4)} Å · I_hkl ∝ |F|² · M · LP)
              </span>
              <span>
                {powderSpectrum.filter(p => !p.isExtinct).length} Allowed · {powderSpectrum.filter(p => p.isExtinct).length} Extinct
              </span>
            </div>

            <div className="w-full h-56 relative bg-black/60 border border-slate-900 overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none" className="overflow-visible">
                {/* Y-axis gridlines */}
                {[0, 25, 50, 75, 100].map(pct => {
                  const y = 170 - (pct / 100) * 140;
                  return (
                    <g key={`ygrid-${pct}`}>
                      <line x1="40" y1={y} x2="780" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" />
                      <text x="34" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" className="font-mono">{pct}%</text>
                    </g>
                  );
                })}

                {/* 2Theta X-Axis Ticks */}
                {(() => {
                  const ticks = [];
                  const step = twoThetaMaxSpectrum <= 60 ? 10 : 20;
                  for (let tt = 10; tt <= twoThetaMaxSpectrum; tt += step) {
                    const x = 40 + ((tt - 10) / (twoThetaMaxSpectrum - 10)) * 740;
                    ticks.push(
                      <g key={`ttick-${tt}`}>
                        <line x1={x} y1="170" x2={x} y2="175" stroke="#475569" />
                        <text x={x} y="188" fill="#64748b" fontSize="9" textAnchor="middle" className="font-mono">{tt}°</text>
                      </g>
                    );
                  }
                  return ticks;
                })()}

                {/* Continuous Lorentzian/Gaussian Profile Envelope */}
                {showContinuousProfile && (() => {
                  const allowedPeaks = powderSpectrum.filter(p => !p.isExtinct && p.twoTheta >= 10 && p.twoTheta <= twoThetaMaxSpectrum);
                  const pts = [];
                  const steps = 220;
                  for (let i = 0; i <= steps; i++) {
                    const tt = 10 + (i / steps) * (twoThetaMaxSpectrum - 10);
                    let intensitySum = 0;
                    for (let j = 0; j < allowedPeaks.length; j++) {
                      const pk = allowedPeaks[j];
                      const diff = tt - pk.twoTheta;
                      if (Math.abs(diff) < 3.5) {
                        intensitySum += pk.relativeIntensity * Math.exp(-(diff * diff) / 0.18);
                      }
                    }
                    const x = 40 + ((tt - 10) / (twoThetaMaxSpectrum - 10)) * 740;
                    const y = 170 - Math.min(100, intensitySum) * 1.4;
                    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
                  }
                  return (
                    <path
                      d={pts.join(' ')}
                      fill="none"
                      stroke="rgba(56, 189, 248, 0.45)"
                      strokeWidth="1.5"
                    />
                  );
                })()}

                {/* Goniometer Current 2Theta Position Marker */}
                {localTwoTheta >= 10 && localTwoTheta <= twoThetaMaxSpectrum && (
                  <g>
                    {(() => {
                      const curX = 40 + ((localTwoTheta - 10) / (twoThetaMaxSpectrum - 10)) * 740;
                      return (
                        <>
                          <line x1={curX} y1="15" x2={curX} y2="170" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.75" />
                          <circle cx={curX} cy="18" r="3" fill="#38bdf8" />
                          <text x={curX} y="11" fill="#38bdf8" fontSize="8" textAnchor="middle" className="font-mono font-bold">2θ={localTwoTheta.toFixed(1)}°</text>
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* Reflection Peaks (Sticks) */}
                {powderSpectrum.map((peak, idx) => {
                  if (filterExtinctSpectrum && peak.isExtinct) return null;
                  if (peak.twoTheta < 10 || peak.twoTheta > twoThetaMaxSpectrum) return null;

                  const x = 40 + ((peak.twoTheta - 10) / (twoThetaMaxSpectrum - 10)) * 740;
                  const peakHeight = peak.isExtinct ? 8 : Math.max(4, (peak.relativeIntensity / 100) * 140);
                  const yTop = 170 - peakHeight;
                  const isSelected =
                    selectedSpectrumPeak?.hklStr === peak.hklStr ||
                    (millerH === peak.h && millerK === peak.k && millerL === peak.l);

                  return (
                    <g 
                      key={`stick-${peak.hklStr}-${idx}`}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedSpectrumPeak(peak);
                        setMillerH(peak.h);
                        setMillerK(peak.k);
                        setMillerL(peak.l);
                        setLocalTwoTheta(parseFloat(peak.twoTheta.toFixed(2)));
                      }}
                    >
                      <line
                        x1={x}
                        y1="170"
                        x2={x}
                        y2={yTop}
                        stroke={peak.isExtinct ? '#64748b' : isSelected ? '#fbbf24' : '#f43f5e'}
                        strokeWidth={isSelected ? '3.5' : peak.isExtinct ? '1.2' : '2.2'}
                        strokeDasharray={peak.isExtinct ? '2 2' : undefined}
                        opacity={peak.isExtinct ? 0.5 : 0.95}
                      />
                      <circle
                        cx={x}
                        cy={yTop}
                        r={isSelected ? 4 : 2.5}
                        fill={peak.isExtinct ? '#020408' : isSelected ? '#fbbf24' : '#f43f5e'}
                        stroke={peak.isExtinct ? '#64748b' : 'none'}
                        strokeWidth="1"
                      />
                      {peak.relativeIntensity > 12 && !peak.isExtinct && (
                        <text
                          x={x}
                          y={yTop - 6}
                          fill={isSelected ? '#fbbf24' : '#cbd5e1'}
                          fontSize="8"
                          textAnchor="middle"
                          className="font-mono font-bold select-none pointer-events-none"
                        >
                          ({peak.h}{peak.k}{peak.l})
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Reflections Data Table */}
          <div className="bg-[#0B0F17] border border-slate-800/90 p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Kinematic Reflections Table (Click any row to synchronize Miller Plane &amp; Goniometer 2θ)
              </span>
              <span className="text-[9px] font-mono text-slate-400">Sorted by 2θ ascending</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar max-h-64">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[9px] uppercase font-bold text-slate-500">
                    <th className="pb-1.5 px-2">h k l</th>
                    <th className="pb-1.5 px-2">2θ (deg)</th>
                    <th className="pb-1.5 px-2">d (Å)</th>
                    <th className="pb-1.5 px-2">|F(hkl)|</th>
                    <th className="pb-1.5 px-2">Mult (M)</th>
                    <th className="pb-1.5 px-2">LP Factor</th>
                    <th className="pb-1.5 px-2">I / I_max (%)</th>
                    <th className="pb-1.5 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {powderSpectrum
                    .filter(p => !filterExtinctSpectrum || !p.isExtinct)
                    .map((p, idx) => {
                      const isSelected = millerH === p.h && millerK === p.k && millerL === p.l;
                      return (
                        <tr
                          key={`row-${p.hklStr}-${idx}`}
                          onClick={() => {
                            setMillerH(p.h);
                            setMillerK(p.k);
                            setMillerL(p.l);
                            setLocalTwoTheta(parseFloat(p.twoTheta.toFixed(2)));
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-sky-500/15 text-sky-200' : 'hover:bg-white/[0.02] text-slate-300'
                          }`}
                        >
                          <td className="py-1.5 px-2 font-bold text-sky-400">
                            ({p.h} {p.k} {p.l})
                          </td>
                          <td className="py-1.5 px-2 text-slate-200 tabular-nums">{p.twoTheta.toFixed(2)}°</td>
                          <td className="py-1.5 px-2 text-emerald-400 tabular-nums">{p.dSpacing.toFixed(4)}</td>
                          <td className="py-1.5 px-2 text-amber-400 tabular-nums">{p.fMag.toFixed(3)}</td>
                          <td className="py-1.5 px-2 text-slate-400 tabular-nums">{p.multiplicity}</td>
                          <td className="py-1.5 px-2 text-slate-400 tabular-nums">{p.lorentzPolarization.toFixed(2)}</td>
                          <td className="py-1.5 px-2">
                            <div className="flex items-center gap-2">
                              <span className="w-12 text-right font-bold text-rose-400 tabular-nums">{p.relativeIntensity.toFixed(1)}%</span>
                              <div className="w-16 h-1.5 bg-slate-800 overflow-hidden">
                                <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, p.relativeIntensity)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-[9px]">
                            {p.isExtinct ? (
                              <span className="text-rose-400 font-bold">EXTINCT</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">ALLOWED</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: EWALD SPHERE KINEMATICS & INTERPLANAR ANGLES                   */}
      {/* ===================================================================== */}
      {activeTab === 'ewald_sphere' && (
        <div className="space-y-4">
          {/* Ewald Geometry Canvas & Scherrer Rocking Curve */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Ewald Sphere 2D Vector Cut (7 cols) */}
            <div className="lg:col-span-7 bg-[#020408] border border-slate-800/90 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  Ewald Sphere Construction (Radius |k₀| = 1/λ = {(1 / wavelength).toFixed(3)} Å⁻¹)
                </span>
                <span className="text-[10px] font-mono text-purple-300 font-bold">
                  Excitation Error s_g = {ewaldKinematics.excitationError.toFixed(5)} Å⁻¹
                </span>
              </div>

              {/* 2D Vector Cut Visualizer */}
              <div className="w-full aspect-[16/10] relative bg-black/60 border border-slate-900 flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="-165 -120 330 240" className="overflow-visible">
                  <defs>
                    <marker id="ewald-arrow-k0" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                    <marker id="ewald-arrow-kh" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                    </marker>
                    <marker id="ewald-arrow-q" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                    </marker>
                  </defs>

                  {(() => {
                    const radiusPx = 88;
                    const ewaldCenter = { x: -radiusPx, y: 0 };

                    const twoThetaRad = (localTwoTheta * Math.PI) / 180;
                    const diffractedEnd = {
                      x: ewaldCenter.x + radiusPx * Math.cos(twoThetaRad),
                      y: ewaldCenter.y - radiusPx * Math.sin(twoThetaRad)
                    };

                    const braggAngleRad = structureFactorResult.twoTheta > 0 
                      ? (structureFactorResult.twoTheta * Math.PI) / 180 
                      : twoThetaRad;
                    const gNode = {
                      x: ewaldCenter.x + radiusPx * Math.cos(braggAngleRad),
                      y: ewaldCenter.y - radiusPx * Math.sin(braggAngleRad)
                    };

                    return (
                      <g>
                        {/* Ewald Sphere Boundary */}
                        <circle
                          cx={ewaldCenter.x}
                          cy={ewaldCenter.y}
                          r={radiusPx}
                          stroke="rgba(56, 189, 248, 0.28)"
                          strokeWidth="1.6"
                          fill="rgba(56, 189, 248, 0.03)"
                        />
                        <circle cx={ewaldCenter.x} cy={ewaldCenter.y} r="3" fill="#38bdf8" />
                        <text x={ewaldCenter.x - 14} y={ewaldCenter.y - 6} fill="#94a3b8" fontSize="8" className="font-mono">Crystal C</text>

                        {/* Reciprocal Origin (0,0,0) */}
                        <circle cx="0" cy="0" r="4" fill="#ffffff" />
                        <text x="6" y="12" fill="#ffffff" fontSize="9" className="font-mono font-bold">O* (000)</text>

                        {/* Incident beam k_0 */}
                        <line
                          x1={ewaldCenter.x}
                          y1={ewaldCenter.y}
                          x2="0"
                          y2="0"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          markerEnd="url(#ewald-arrow-k0)"
                        />
                        <text x={ewaldCenter.x / 2} y="14" fill="#38bdf8" fontSize="9" className="font-mono font-bold">k₀ (1/λ)</text>

                        {/* Diffracted wavevector k_h */}
                        <line
                          x1={ewaldCenter.x}
                          y1={ewaldCenter.y}
                          x2={diffractedEnd.x}
                          y2={diffractedEnd.y}
                          stroke="#fbbf24"
                          strokeWidth="2"
                          markerEnd="url(#ewald-arrow-kh)"
                        />
                        <text x={(ewaldCenter.x + diffractedEnd.x) / 2 - 12} y={(ewaldCenter.y + diffractedEnd.y) / 2 - 8} fill="#fbbf24" fontSize="9" className="font-mono font-bold">k_h</text>

                        {/* Scattering vector Q = k_h - k_0 from O to diffracted point */}
                        <line
                          x1="0"
                          y1="0"
                          x2={diffractedEnd.x}
                          y2={diffractedEnd.y}
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          markerEnd="url(#ewald-arrow-q)"
                        />
                        <text x={diffractedEnd.x / 2 + 8} y={diffractedEnd.y / 2} fill="#10b981" fontSize="9" className="font-mono font-bold">K = k_h − k₀</text>

                        {/* Reciprocal Lattice Node G_hkl */}
                        <circle cx={gNode.x} cy={gNode.y} r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
                        <text x={gNode.x + 8} y={gNode.y + 4} fill="#f43f5e" fontSize="9" className="font-mono font-bold">
                          G({millerH}{millerK}{millerL})
                        </text>

                        {/* Excitation error vector s_g between reciprocal node and sphere */}
                        <line
                          x1={diffractedEnd.x}
                          y1={diffractedEnd.y}
                          x2={gNode.x}
                          y2={gNode.y}
                          stroke="#c084fc"
                          strokeWidth="2.5"
                        />
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Telemetry Footer */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono bg-[#0B0F17] p-2.5 border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Ewald Radius |k₀|</span>
                  <span className="font-bold text-sky-400 tabular-nums">{(1 / wavelength).toFixed(4)} Å⁻¹</span>
                </div>
                <div>
                  <span className="text-slate-500 block">|G_hkl| = 1/d</span>
                  <span className="font-bold text-rose-400 tabular-nums">{(1 / Math.max(0.01, structureFactorResult.dSpacing)).toFixed(4)} Å⁻¹</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Relrod Intensity</span>
                  <span className="font-bold text-emerald-400 tabular-nums">{(ewaldKinematics.rockingCurveIntensity * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Crystallite Thickness & Rocking Curve (5 cols) */}
            <div className="lg:col-span-5 bg-[#0B0F17] border border-slate-800/90 p-4 flex flex-col justify-between space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  Finite Domain Size &amp; sinc² Rocking Profile
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  t = {crystalliteThicknessA} Å ({(crystalliteThicknessA / 10).toFixed(1)} nm)
                </span>
              </div>

              {/* Thickness Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Coherent Domain Thickness (t):</span>
                  <span className="font-bold text-slate-200 tabular-nums">{crystalliteThicknessA} Å</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="1000"
                  step="10"
                  value={crystalliteThicknessA}
                  onChange={(e) => setCrystalliteThicknessA(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800"
                />
              </div>

              {/* Sinc^2 Rocking Curve Profile with Active Operating Point */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                  <span>Shape Function I(s_g) = sinc²(π · t · s_g)</span>
                  <span className="text-purple-300 font-mono">s_g ∈ [−0.02, +0.02] Å⁻¹</span>
                </div>
                <div className="w-full h-32 bg-[#030508] border border-slate-800 relative p-1">
                  <svg width="100%" height="100%" viewBox="-100 0 200 100" preserveAspectRatio="none" className="overflow-visible">
                    <line x1="0" y1="5" x2="0" y2="92" stroke="rgba(255,255,255,0.12)" strokeDasharray="2 2" />
                    <line x1="-100" y1="90" x2="100" y2="90" stroke="rgba(255,255,255,0.12)" />
                    {(() => {
                      const points = [];
                      for (let px = -100; px <= 100; px += 1.5) {
                        const sVal = (px / 100) * 0.02;
                        const arg = Math.PI * crystalliteThicknessA * sVal;
                        const sincVal = Math.abs(arg) < 1e-4 ? 1 : Math.pow(Math.sin(arg) / arg, 2);
                        const py = 90 - sincVal * 78;
                        points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
                      }
                      const curSgClamped = Math.max(-0.02, Math.min(0.02, ewaldKinematics.excitationError));
                      const curPx = (curSgClamped / 0.02) * 100;
                      const curPy = 90 - ewaldKinematics.rockingCurveIntensity * 78;

                      return (
                        <>
                          <polyline
                            points={points.join(' ')}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                          />
                          <circle cx={curPx} cy={curPy} r="3.5" fill="#fbbf24" stroke="#020408" strokeWidth="1" />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* Scherrer Equation Telemetry */}
              <div className="p-2.5 bg-[#04060A] border border-slate-800 text-[10px] space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Scherrer FWHM Δ(2θ):</span>
                  <span className="font-bold text-emerald-400 tabular-nums">{ewaldKinematics.rockingCurveFwhmDeg.toFixed(3)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Integral Breadth β:</span>
                  <span className="font-bold text-slate-200 tabular-nums">{((ewaldKinematics.rockingCurveFwhmDeg * Math.PI) / 180).toFixed(4)} rad</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interplanar Angles & Weiss Zone Axis Calculator */}
          <div className="bg-[#0B0F17] border border-slate-800/90 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5 text-purple-400" />
                Interplanar Angle φ &amp; Weiss Zone Axis [u v w] Calculator
              </span>
              <span className="text-[10px] font-mono text-purple-300">
                cos φ = d₁ · d₂ · (h₁ᵀ · G* · h₂)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Plane 1 Stepper */}
              <div className="md:col-span-4 bg-[#04060A] p-3 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-sky-400 uppercase">Plane 1 (h₁ k₁ l₁)</span>
                  <button
                    onClick={() => setInterplanarH1([millerH, millerK, millerL])}
                    className="text-[9px] text-slate-400 hover:text-sky-300 underline"
                  >
                    Use Active ({millerH}{millerK}{millerL})
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[0, 1, 2].map(idx => (
                    <input
                      key={`h1-${idx}`}
                      type="number"
                      value={interplanarH1[idx]}
                      onChange={(e) => {
                        const next = [...interplanarH1] as [number, number, number];
                        next[idx] = parseInt(e.target.value) || 0;
                        setInterplanarH1(next);
                      }}
                      className="w-full bg-[#0B0F17] border border-slate-700 text-center font-mono font-bold text-xs py-1 text-slate-200 outline-none tabular-nums"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  d₁ = <strong className="text-slate-200">{interplanarResult.d1.toFixed(4)} Å</strong>
                </span>
              </div>

              {/* Plane 2 Stepper */}
              <div className="md:col-span-4 bg-[#04060A] p-3 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-amber-400 uppercase">Plane 2 (h₂ k₂ l₂)</span>
                  <button
                    onClick={() => setInterplanarH2([millerH, millerK, millerL])}
                    className="text-[9px] text-slate-400 hover:text-amber-300 underline"
                  >
                    Use Active ({millerH}{millerK}{millerL})
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[0, 1, 2].map(idx => (
                    <input
                      key={`h2-${idx}`}
                      type="number"
                      value={interplanarH2[idx]}
                      onChange={(e) => {
                        const next = [...interplanarH2] as [number, number, number];
                        next[idx] = parseInt(e.target.value) || 0;
                        setInterplanarH2(next);
                      }}
                      className="w-full bg-[#0B0F17] border border-slate-700 text-center font-mono font-bold text-xs py-1 text-slate-200 outline-none tabular-nums"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  d₂ = <strong className="text-slate-200">{interplanarResult.d2.toFixed(4)} Å</strong>
                </span>
              </div>

              {/* Calculated Result Card */}
              <div className="md:col-span-4 bg-purple-950/20 border border-purple-500/40 p-3 space-y-1 font-mono text-xs">
                <div className="text-[9px] font-bold text-purple-300 uppercase">Interplanar Angle φ</div>
                <div className="text-xl font-black text-purple-200 tabular-nums">
                  {interplanarResult.angleDeg.toFixed(2)}°
                </div>
                <div className="text-[10px] text-slate-300 pt-0.5">
                  Zone Axis [u v w]: <span className="font-bold text-sky-400">[{interplanarResult.zoneAxis.join(' ')}]</span>
                </div>
                <div className="text-[9px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Weiss Law: h·u + k·v + l·w = 0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
