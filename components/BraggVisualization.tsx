import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Play, 
  Pause, 
  Waves, 
  Compass, 
  Sliders, 
  Zap, 
  Layers, 
  Atom, 
  Grid, 
  RotateCw, 
  RotateCcw,
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  ArrowRight,
  Info,
  Maximize2,
  Minimize2,
  Box,
  Copy,
  Check,
  Download,
  Share2,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Gauge,
  Cpu,
  Bookmark,
  Volume2,
  VolumeX,
  Keyboard
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
  Vector3D
} from '../utils/braggBasisEngine';

interface BraggVisualizationProps {
  wavelength: number;
  twoTheta: number;
}

type BasisTab = 'kinematics' | 'atomic_basis' | 'reciprocal_basis' | 'plane_stacking' | '2d_lattice';

export const BraggVisualization: React.FC<BraggVisualizationProps> = ({ 
  wavelength, 
  twoTheta: initialTwoTheta 
}) => {
  const { precision } = useSettings();
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);
  const [scanSpeed, setScanSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  // Advanced mode state
  const [advancedMode, setAdvancedMode] = useState(false);
  
  // Active Tab
  const [activeTab, setActiveTab] = useState<BasisTab>('kinematics');

  // Goniometer & Kinematics state
  const [localTwoTheta, setLocalTwoTheta] = useState(initialTwoTheta);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [reflectionOrder, setReflectionOrder] = useState<number>(1);
  const [debyeWallerB, setDebyeWallerB] = useState<number>(0.5); // B-factor in A^2
  const [showQVectors, setShowQVectors] = useState(false);
  const [showPhasor, setShowPhasor] = useState(true);

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

  // 3D Visualizer Rotation & Interaction State
  const [rotX, setRotX] = useState<number>(-20);
  const [rotY, setRotY] = useState<number>(35);
  const [zoom3D, setZoom3D] = useState<number>(1.0);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [isAutoRotate3D, setIsAutoRotate3D] = useState<boolean>(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

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
    let interval: any;
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
    return () => clearInterval(interval);
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
      // Set reasonable default HKL for the selected preset
      if (presetId === 'bcc') {
        setMillerH(1); setMillerK(1); setMillerL(0);
      } else if (presetId === 'fcc' || presetId === 'diamond' || presetId === 'nacl') {
        setMillerH(1); setMillerK(1); setMillerL(1);
      } else if (presetId === 'hcp') {
        setMillerH(1); setMillerK(0); setMillerL(0);
      } else {
        setMillerH(1); setMillerK(0); setMillerL(0);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Calculated Basis & Structure Factor Results
  // ---------------------------------------------------------------------------
  const basisAndReciprocal: DirectAndReciprocalBasis = useMemo(() => {
    return computeDirectAndReciprocalBasis(unitCell);
  }, [unitCell]);

  const structureFactorResult: StructureFactorResult = useMemo(() => {
    return calculateStructureFactor(millerH, millerK, millerL, unitCell, basisAtoms, wavelength);
  }, [millerH, millerK, millerL, unitCell, basisAtoms, wavelength]);

  // ---------------------------------------------------------------------------
  // 2D Ray Tracing / Kinematics Physics Calculations
  // ---------------------------------------------------------------------------
  const width = 640;
  const height = 380;
  const planeSpacing = 90;
  const centerY = height / 2 + 15;
  const centerX = width / 2;

  const theta = (localTwoTheta || 0) / 2;
  const thetaRad = isNaN(theta) ? 0 : (theta * Math.PI) / 180;
  
  // Reference d-spacing derived from initial condition assuming n=1 peak
  const dRefTheta = (initialTwoTheta || 28.44) / 2;
  const dRefThetaRad = (dRefTheta * Math.PI) / 180;
  const dSpacing = wavelength / (2 * Math.max(0.0001, Math.sin(dRefThetaRad)));

  // Calculate exact Bragg Peak angles for Quick Presets
  const peak1TwoTheta = useMemo(() => {
    const sin1 = wavelength / (2 * dSpacing);
    if (sin1 > 1) return null;
    return (2 * Math.asin(sin1) * 180) / Math.PI;
  }, [wavelength, dSpacing]);

  const peak2TwoTheta = useMemo(() => {
    const sin2 = (2 * wavelength) / (2 * dSpacing);
    if (sin2 > 1) return null;
    return (2 * Math.asin(sin2) * 180) / Math.PI;
  }, [wavelength, dSpacing]);

  const nullTwoTheta = useMemo(() => {
    const sinNull = (0.5 * wavelength) / (2 * dSpacing);
    if (sinNull > 1) return null;
    return (2 * Math.asin(sinNull) * 180) / Math.PI;
  }, [wavelength, dSpacing]);

  // Exact path difference delta = 2 * d * sin(theta)
  const pathLengthDiff = 2 * dSpacing * Math.sin(thetaRad);
  const phaseDiffRad = (2 * Math.PI * pathLengthDiff) / Math.max(0.0001, wavelength);
  const phaseDiffDeg = ((phaseDiffRad * 180 / Math.PI) % 360 + 360) % 360;

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
    amplitudeVal: number = 6
  ) => {
    const steps = 80;
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
  const rayLength = 280;

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

  const atoms = [];
  const atomSpacing = 44;
  const atomsCount = 14;
  for (let i = -atomsCount/2; i <= atomsCount/2; i++) {
    atoms.push({ x: centerX + i * atomSpacing, y: topAtomY });
    atoms.push({ x: centerX + i * atomSpacing, y: bottomAtomY });
  }

  const waveAnimDuration = 1.2;

  const rayNodeDots = [];
  const dotCount = 8;
  for (let i = 1; i <= dotCount; i++) {
    const dist = (i / (dotCount + 1)) * rayLength;
    rayNodeDots.push({ x: inc2StartX + dist * Math.cos(thetaRad), y: inc2StartY + dist * Math.sin(thetaRad) });
    rayNodeDots.push({ x: inc1StartX + dist * Math.cos(thetaRad), y: inc1StartY + dist * Math.sin(thetaRad) });
    rayNodeDots.push({ x: ax + dist * Math.cos(thetaRad), y: ay - dist * Math.sin(thetaRad) });
    rayNodeDots.push({ x: bx + dist * Math.cos(thetaRad), y: by - dist * Math.sin(thetaRad) });
  }

  const scopePoints = useMemo(() => {
    const pts = [];
    const numSteps = 80;
    for (let i = 0; i <= numSteps; i++) {
      const t = (i / numSteps) * 4 * Math.PI;
      const e1 = Math.sin(t);
      const e2 = Math.sin(t - phaseDiffRad);
      const eSum = e1 + e2;
      pts.push({ t, e1, e2, eSum });
    }
    return pts;
  }, [phaseDiffRad]);

  // ---------------------------------------------------------------------------
  // 3D Projection Helpers for Unit Cell & Basis Vectors
  // ---------------------------------------------------------------------------
  const project3D = (v: Vector3D, scale = 25, originX = 180, originY = 160) => {
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
      coords: [0, 0, 0],
      occupancy: 1.0,
      bFactor: 0.5,
      color: '#38bdf8'
    };
    setBasisAtoms([...basisAtoms, newAtom]);
    setSelectedPresetId('custom');
  };

  const handleRemoveAtom = (id: string) => {
    setBasisAtoms(basisAtoms.filter(a => a.id !== id));
    setSelectedPresetId('custom');
  };

  const handleUpdateAtom = (id: string, updates: Partial<BasisAtomDefinition>) => {
    setBasisAtoms(basisAtoms.map(a => (a.id === id ? { ...a, ...updates } : a)));
    setSelectedPresetId('custom');
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
          : "bg-[#080B11] border border-slate-800/80 p-5 sm:p-6 shadow-2xl relative font-mono text-slate-300 transition-all duration-300"
      }
    >
      {/* Fullscreen Sticky Quick Header HUD */}
      {isFullscreen && (
        <div className="sticky top-0 z-40 bg-[#05070D]/95 backdrop-blur-xl -mt-3 sm:-mt-5 md:-mt-6 -mx-3 sm:-mx-5 md:-mx-6 px-4 py-2.5 border-b border-sky-500/20 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-sky-300 flex items-center gap-1.5">
                <Atom className="w-4 h-4 text-sky-400" />
                Bragg Basis Studio Fullscreen
              </span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
              <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 text-slate-200 font-bold">
                λ = {wavelength.toFixed(4)} Å
              </span>
              <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 text-emerald-400 font-bold">
                ({millerH} {millerK} {millerL})
              </span>
              <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 text-amber-400 font-bold">
                d = {structureFactorResult.dSpacing > 0 ? structureFactorResult.dSpacing.toFixed(4) : '--'} Å
              </span>
              <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 text-sky-400 font-bold">
                2θ = {localTwoTheta.toFixed(2)}°
              </span>
              <span className={`px-2 py-0.5 font-bold border ${structureFactorResult.isExtinct ? 'bg-rose-950/40 text-rose-400 border-rose-600/40' : 'bg-emerald-950/40 text-emerald-400 border-emerald-600/40'}`}>
                {structureFactorResult.isExtinct ? 'FORBIDDEN' : 'ALLOWED'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors text-[10px] flex items-center gap-1"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Shortcuts (?)</span>
            </button>

            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5">
              <button
                onClick={() => handleCopyData('latex')}
                className="px-2 py-1 text-[9px] font-bold text-slate-400 hover:text-amber-300 transition-colors"
                title="Copy LaTeX Formula"
              >
                {copiedCode === 'latex' ? <Check className="w-3 h-3 text-emerald-400 inline" /> : 'LaTeX'}
              </button>
              <button
                onClick={() => handleCopyData('json')}
                className="px-2 py-1 text-[9px] font-bold text-slate-400 hover:text-sky-300 transition-colors"
                title="Copy JSON state"
              >
                {copiedCode === 'json' ? <Check className="w-3 h-3 text-emerald-400 inline" /> : 'JSON'}
              </button>
              <button
                onClick={() => handleCopyData('cif')}
                className="px-2 py-1 text-[9px] font-bold text-slate-400 hover:text-emerald-300 transition-colors"
                title="Copy CIF block"
              >
                {copiedCode === 'cif' ? <Check className="w-3 h-3 text-emerald-400 inline" /> : 'CIF'}
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
              title="Exit Fullscreen (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Header HUD */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 pb-4 border-b border-white/10 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
            <Atom className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-wider text-slate-100 uppercase flex items-center gap-2">
                Bragg Basis & Crystallographic Kinematics Engine
              </h2>
              <span className="text-[9px] px-2 py-0.5 bg-sky-950/60 border border-sky-500/30 text-sky-300 font-bold uppercase tracking-wider hidden sm:inline">
                {STANDARD_BASIS_PRESETS.find(p => p.id === selectedPresetId)?.formula || 'Custom'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
              Direct/Reciprocal Basis Vectors • Atomic Basis Fractions • Structure Factor Phasor Summation
            </p>
          </div>
        </div>

        {/* Tab Selector & Fullscreen Toggle */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 bg-black/60 p-1 border border-slate-800/80 overflow-x-auto max-w-full">
            <button
              id="tab-kinematics"
              onClick={() => setActiveTab('kinematics')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'kinematics'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>1. Kinematics</span>
            </button>

            <button
              id="tab-atomic-basis"
              onClick={() => setActiveTab('atomic_basis')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'atomic_basis'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>2. Atomic Basis & F(hkl)</span>
            </button>

            <button
              id="tab-reciprocal-basis"
              onClick={() => setActiveTab('reciprocal_basis')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'reciprocal_basis'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>3. Dual Basis 3D</span>
            </button>

            <button
              id="tab-plane-stacking"
              onClick={() => setActiveTab('plane_stacking')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'plane_stacking'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>4. Sub-Planes</span>
            </button>

            <button
              id="tab-2d-lattice"
              onClick={() => setActiveTab('2d_lattice')}
              className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === '2d_lattice'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>5. 2D Real-Space</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider border transition-all flex items-center gap-1 ${
                advancedMode 
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' 
                  : 'bg-black/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Advanced Phasors & Formulas"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span className="hidden sm:inline">Advanced</span>
            </button>

            <button
              id="btn-bragg-fullscreen-toggle"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 text-[10px] uppercase font-bold tracking-wider border transition-all flex items-center gap-1.5 ${
                isFullscreen
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
              }`}
              title={isFullscreen ? 'Exit Fullscreen (F / Esc)' : 'Fullscreen Bragg Basis (F)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
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
                  <span className="text-slate-400">Tabs 1 to 5:</span>
                  <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-emerald-300 font-bold">1 - 5</kbd>
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
                  Got It (Close)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: KINEMATICS & WAVE SUPERPOSITION */}
      {activeTab === 'kinematics' && (
        <div className="space-y-4">
          {/* Quick Goniometer Angle Controls HUD */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-black/60 p-2.5 border border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goniometer (2θ)</span>
              <input 
                type="range" 
                min="10" 
                max="90" 
                step="0.05"
                value={String(localTwoTheta) === 'NaN' ? '' : localTwoTheta}
                onChange={(e) => {
                  setLocalTwoTheta(parseFloat(e.target.value));
                  setIsAutoScanning(false);
                }}
                className="w-28 sm:w-36 accent-sky-400 hover:accent-sky-300 transition-all cursor-pointer h-1.5 bg-slate-800 appearance-none rounded-none"
              />
              <span className="text-xs font-bold text-sky-400 tabular-nums bg-sky-950/40 px-2.5 py-0.5 border border-sky-500/30">
                {localTwoTheta.toFixed(2)}°
              </span>
              <button 
                onClick={() => setIsAutoScanning(!isAutoScanning)}
                className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest border transition-all flex items-center gap-1.5 ${
                  isAutoScanning 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
                }`}
              >
                {isAutoScanning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isAutoScanning ? 'Scanning' : 'Auto-Scan'}
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5">
              {peak1TwoTheta && (
                <button
                  onClick={() => { setLocalTwoTheta(peak1TwoTheta); setIsAutoScanning(false); setReflectionOrder(1); }}
                  className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  Peak n=1 ({peak1TwoTheta.toFixed(1)}°)
                </button>
              )}
              {peak2TwoTheta && (
                <button
                  onClick={() => { setLocalTwoTheta(peak2TwoTheta); setIsAutoScanning(false); setReflectionOrder(2); }}
                  className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all"
                >
                  Peak n=2 ({peak2TwoTheta.toFixed(1)}°)
                </button>
              )}
              {nullTwoTheta && (
                <button
                  onClick={() => { setLocalTwoTheta(nullTwoTheta); setIsAutoScanning(false); }}
                  className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all"
                >
                  Null (180°)
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Telemetry & Physics Controls Panel */}
            <div className="lg:col-span-1 space-y-3">
              {/* Angle & Spacing Telemetry */}
              <div className="bg-[#0B0F17] p-3.5 border border-slate-800/80 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1 flex justify-between">
                  <span>Geometric Parameters</span>
                  <span className="text-sky-400 font-mono">λ = {wavelength.toFixed(4)} Å</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block">θ (Bragg Angle)</span>
                    <span className="font-bold text-slate-200">{theta.toFixed(precision)}°</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">d-spacing (d_hkl)</span>
                    <span className="font-bold text-emerald-400">{dSpacing.toFixed(precision)} Å</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Scattering Vector |Q|</span>
                    <span className="font-bold text-sky-400">{qMagnitude.toFixed(4)} Å⁻¹</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Photon Energy (E)</span>
                    <span className="font-bold text-amber-400">{energyKeV.toFixed(2)} keV</span>
                  </div>
                </div>
              </div>

              {/* Reflection Order & Thermal Factor Control */}
              <div className="bg-[#0B0F17] p-3.5 border border-slate-800/80 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1">
                  Physics Controls
                </div>
                
                {/* Reflection Order n */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Order (n):</span>
                  <div className="flex bg-black/60 border border-slate-800/80 p-0.5">
                    {[1, 2, 3].map(order => (
                      <button
                        key={order}
                        onClick={() => setReflectionOrder(order)}
                        className={`px-2.5 py-0.5 text-[10px] font-bold ${
                          reflectionOrder === order 
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        n={order}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Debye-Waller B Factor Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                    <span>Debye-Waller (B):</span>
                    <span className="text-amber-400 font-bold">{debyeWallerB.toFixed(2)} Å²</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.05"
                    value={debyeWallerB}
                    onChange={(e) => setDebyeWallerB(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 appearance-none rounded-none accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Phase & Interference Status */}
              <div className="bg-[#0B0F17] p-3.5 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-white/5 pb-1">
                  <span>Phase Shift & Intensity</span>
                  <span className={`px-1.5 py-0.5 border ${
                    resonanceStrength > 0.85 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'bg-black text-slate-500 border-white/10'
                  }`}>
                    {resonanceStrength > 0.85 ? 'Bragg Peak' : 'Off-Peak'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[9px] text-slate-500 block">Path Diff (Δ)</span>
                    <span className="font-bold text-slate-300">{pathLengthDiff.toFixed(3)} Å</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Phase (Δφ)</span>
                    <span className="font-bold text-purple-400">{phaseDiffDeg.toFixed(1)}°</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase tracking-wider">
                    <span>Relative Intensity (I/I₀)</span>
                    <span className="font-bold text-sky-400">{(totalNormalizedIntensity * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-black border border-slate-800/80 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-amber-400 transition-all duration-150"
                      style={{ width: `${Math.min(100, Math.max(0, totalNormalizedIntensity * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Superposition Oscilloscope Display & Phasor Wheel */}
              <div className="bg-[#0B0F17] p-3 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Waves className="w-3 h-3 text-sky-400" /> Superposition & Phasors</span>
                  <button 
                    onClick={() => setShowPhasor(!showPhasor)}
                    className="text-[8px] uppercase tracking-wider text-sky-400 hover:underline"
                  >
                    {showPhasor ? 'Hide Phasor' : 'Show Phasor'}
                  </button>
                </div>

                <div className="bg-[#030508] border border-slate-800/80 p-1 relative min-h-20 flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full h-20 relative">
                    <svg className="w-full h-full overflow-visible">
                      <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" />
                      <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" />

                      <path
                        d={scopePoints.map((p, idx) => {
                          const x = (idx / (scopePoints.length - 1)) * 180;
                          const y = 35 - p.e1 * 14;
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1"
                        opacity="0.6"
                      />

                      <path
                        d={scopePoints.map((p, idx) => {
                          const x = (idx / (scopePoints.length - 1)) * 180;
                          const y = 35 - p.e2 * 14;
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#c084fc"
                        strokeWidth="1"
                        opacity="0.6"
                      />

                      <path
                        d={scopePoints.map((p, idx) => {
                          const x = (idx / (scopePoints.length - 1)) * 180;
                          const y = 35 - (p.eSum / 2) * 28;
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </div>

                  {showPhasor && (
                    <div className="w-20 h-20 shrink-0 bg-black/80 border border-slate-800 p-1 flex flex-col items-center justify-center relative">
                      <svg width="70" height="70" viewBox="0 0 100 100" className="overflow-visible">
                        <circle cx="50" cy="50" r="32" stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" fill="none" />
                        <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.1)" />
                        <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.1)" />

                        <line x1="50" y1="50" x2="74" y2="50" stroke="#38bdf8" strokeWidth="1.5" />
                        <circle cx="74" cy="50" r="1.5" fill="#38bdf8" />

                        {(() => {
                          const e2x = 74 + 24 * Math.cos(phaseDiffRad);
                          const e2y = 50 - 24 * Math.sin(phaseDiffRad);
                          const totX = 50 + 24 * (1 + Math.cos(phaseDiffRad));
                          const totY = 50 - 24 * Math.sin(phaseDiffRad);
                          return (
                            <>
                              <line x1="74" y1="50" x2={e2x} y2={e2y} stroke="#c084fc" strokeWidth="1.5" />
                              <circle cx={e2x} cy={e2y} r="1.5" fill="#c084fc" />
                              <line x1="50" y1="50" x2={totX} y2={totY} stroke="#fbbf24" strokeWidth="2" />
                              <circle cx={totX} cy={totY} r="2" fill="#fbbf24" />
                            </>
                          );
                        })()}
                      </svg>
                      <span className="text-[7px] text-amber-300 font-bold uppercase tracking-tighter absolute bottom-0.5">
                        Argand Phasor
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Diffraction Ray-Tracing Diagram */}
            <div className="lg:col-span-3 flex flex-col justify-between">
              <div className="w-full bg-[#020408] border border-slate-800/80 relative shadow-2xl aspect-[16/9] overflow-hidden">
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                  <button
                    onClick={() => setShowQVectors(!showQVectors)}
                    className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md transition-all ${
                      showQVectors 
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                        : 'bg-black/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {showQVectors ? 'Hide Vectors (Q)' : 'Show Vectors (k_i, k_f, Q)'}
                  </button>
                </div>

                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="pointer-events-none p-2" preserveAspectRatio="xMidYMid meet">
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
                  </defs>

                  <line x1="20" y1={topAtomY} x2={width - 20} y2={topAtomY} stroke="#f1f5f9" strokeWidth="1.8" />
                  <line x1="20" y1={bottomAtomY} x2={width - 20} y2={bottomAtomY} stroke="#f1f5f9" strokeWidth="1.8" />
                  
                  <text x="25" y={topAtomY - 10} fill="#cbd5e1" fontSize="11" className="font-mono font-bold uppercase tracking-wider">atomic plane</text>
                  <text x="25" y={bottomAtomY + 18} fill="#cbd5e1" fontSize="11" className="font-mono font-bold uppercase tracking-wider">atomic plane</text>

                  {atoms.map((atom, i) => (
                    <circle key={`atom-${atom.x}-${atom.y}-${i}`} cx={atom.x} cy={atom.y} r="4.5" fill="#000000" stroke="#f8fafc" strokeWidth="1" />
                  ))}

                  <line x1={inc2StartX} y1={inc2StartY} x2={ax} y2={ay} stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1={inc1StartX} y1={inc1StartY} x2={bx} y2={by} stroke="#38bdf8" strokeWidth="1.5" />
                  <line x1={ax} y1={ay} x2={diff2EndX} y2={diff2EndY} stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrowhead-sky)" />
                  <line x1={bx} y1={by} x2={diff1EndX} y2={diff1EndY} stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrowhead-sky)" />

                  <line x1={inc2StartX} y1={inc2StartY} x2={inc1StartX} y2={inc1StartY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1={diff2EndX} y1={diff2EndY} x2={diff1EndX} y2={diff1EndY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />

                  <motion.path 
                    d={generateWavePath(inc2StartX, inc2StartY, thetaRad, rayLength, 0, 7)} 
                    stroke="#f43f5e" strokeWidth="2" fill="none"
                    animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
                    transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                  />

                  <motion.path 
                    d={generateWavePath(inc1StartX, inc1StartY, thetaRad, rayLength, 0, 7)} 
                    stroke="#10b981" strokeWidth="2" fill="none"
                    animate={{ x: [0, lambdaVis * Math.cos(thetaRad)], y: [0, lambdaVis * Math.sin(thetaRad)] }}
                    transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                  />

                  <motion.path 
                    d={generateWavePath(ax, ay, -thetaRad, rayLength, 0, 7)} 
                    stroke={resonanceStrength > 0.85 ? "#fbbf24" : "#f43f5e"} 
                    strokeWidth={resonanceStrength > 0.85 ? "2.5" : "2"} fill="none"
                    animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
                    transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                  />

                  <motion.path 
                    d={generateWavePath(bx, by, -thetaRad, rayLength, 0, 7)} 
                    stroke={resonanceStrength > 0.85 ? "#fbbf24" : "#10b981"} 
                    strokeWidth={resonanceStrength > 0.85 ? "2.5" : "2"} fill="none"
                    animate={{ x: [0, lambdaVis * Math.cos(-thetaRad)], y: [0, lambdaVis * Math.sin(-thetaRad)] }}
                    transition={{ repeat: Infinity, duration: waveAnimDuration, ease: "linear" }}
                  />

                  {rayNodeDots.map((dot, idx) => (
                    <circle key={`dot-${idx}`} cx={dot.x} cy={dot.y} r="2.5" fill="#000000" stroke="#38bdf8" strokeWidth="0.5" />
                  ))}

                  <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#f8fafc" strokeWidth="2" />
                  <text x={ax + 6} y={(ay + by) / 2 + 3} fill="#f8fafc" fontSize="12" className="font-mono font-bold">d</text>

                  <line x1={ax} y1={ay} x2={cx} y2={cy} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />
                  <line x1={ax} y1={ay} x2={dx} y2={dy} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" />

                  <circle cx={ax} cy={ay} r="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
                  <text x={ax - 12} y={ay - 8} fill="#f8fafc" fontSize="12" className="font-mono font-bold italic">A</text>

                  <circle cx={bx} cy={by} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                  <text x={bx - 12} y={by + 16} fill="#f8fafc" fontSize="12" className="font-mono font-bold italic">B</text>

                  <circle cx={cx} cy={cy} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                  <text x={cx - 14} y={cy + 4} fill="#38bdf8" fontSize="11" className="font-mono font-bold italic">C</text>

                  <circle cx={dx} cy={dy} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                  <text x={dx + 6} y={dy + 4} fill="#38bdf8" fontSize="11" className="font-mono font-bold italic">D</text>

                  <line x1={cx} y1={cy + 10} x2={bx} y2={by + 10} stroke="#38bdf8" strokeWidth="1" />
                  <text x={(cx + bx) / 2 - 20} y={cy + 22} fill="#38bdf8" fontSize="11" className="font-mono font-bold">d sin θ</text>
                  <text x={(bx + dx) / 2 + 4} y={dy + 22} fill="#38bdf8" fontSize="11" className="font-mono font-bold">d sin θ</text>

                  {showQVectors && (
                    <g className="animate-in fade-in duration-300">
                      <line 
                        x1={ax - 55 * Math.cos(thetaRad)} 
                        y1={ay - 55 * Math.sin(thetaRad)} 
                        x2={ax} 
                        y2={ay} 
                        stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrowhead-sky)" 
                      />
                      <text x={ax - 65 * Math.cos(thetaRad) - 10} y={ay - 65 * Math.sin(thetaRad)} fill="#38bdf8" fontSize="11" className="font-mono font-bold">k_i</text>

                      <line 
                        x1={ax} 
                        y1={ay} 
                        x2={ax + 55 * Math.cos(thetaRad)} 
                        y2={ay - 55 * Math.sin(thetaRad)} 
                        stroke="#fbbf24" strokeWidth="2.5" markerEnd="url(#arrowhead-amber)" 
                      />
                      <text x={ax + 60 * Math.cos(thetaRad)} y={ay - 60 * Math.sin(thetaRad)} fill="#fbbf24" fontSize="11" className="font-mono font-bold">k_f</text>

                      {(() => {
                        const qLen = 110 * Math.sin(thetaRad);
                        return (
                          <>
                            <line 
                              x1={ax} 
                              y1={ay} 
                              x2={ax} 
                              y2={ay - qLen} 
                              stroke="#10b981" strokeWidth="3" markerEnd="url(#arrowhead-emerald)" 
                            />
                            <text x={ax + 8} y={ay - qLen / 2} fill="#10b981" fontSize="11" className="font-mono font-bold">
                              Q = k_f - k_i
                            </text>
                          </>
                        );
                      })()}
                    </g>
                  )}

                  <text x={inc2StartX + 20} y={inc2StartY - 12} fill="#f43f5e" fontSize="12" className="font-mono font-bold">wave 2</text>
                  <text x={inc1StartX + 20} y={inc1StartY - 12} fill="#10b981" fontSize="12" className="font-mono font-bold">wave 1</text>
                  <text x={inc2StartX + 120} y={inc2StartY - 14} fill="#cbd5e1" fontSize="11" className="font-mono font-bold">|← λ →|</text>
                  <text x={inc1StartX + 100} y={inc1StartY + 24} fill="#cbd5e1" fontSize="11" className="font-mono font-bold">|← λ →|</text>

                  <line x1={50} y1={topAtomY} x2={50} y2={bottomAtomY} stroke="#f8fafc" strokeWidth="1.5" />
                  <line x1={45} y1={topAtomY} x2={55} y2={topAtomY} stroke="#f8fafc" strokeWidth="1.5" />
                  <line x1={45} y1={bottomAtomY} x2={55} y2={bottomAtomY} stroke="#f8fafc" strokeWidth="1.5" />
                  <text x={38} y={(topAtomY + bottomAtomY) / 2 + 4} fill="#f8fafc" fontSize="12" className="font-mono font-bold italic">d</text>

                  <text x={width - 80} y={(topAtomY + bottomAtomY) / 2 + 4} fill="#38bdf8" fontSize="13" className="font-mono font-bold">n = {reflectionOrder}</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATOMIC BASIS & STRUCTURE FACTOR F(hkl) SYNTHESIZER */}
      {activeTab === 'atomic_basis' && (
        <div className="space-y-5">
          {/* Preset Selector & HKL Control Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0B0F17] p-3.5 border border-slate-800/80">
            {/* Standard Crystal Basis Preset */}
            <div className="md:col-span-6 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Crystal Basis Preset</span>
                <span className="text-emerald-400 font-mono text-[9px]">
                  {STANDARD_BASIS_PRESETS.find(p => p.id === selectedPresetId)?.spaceGroup || 'Custom Basis'}
                </span>
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="w-full bg-black/80 border border-slate-700/80 px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 outline-none rounded-none font-mono"
              >
                {STANDARD_BASIS_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} — {preset.formula} ({preset.spaceGroup})
                  </option>
                ))}
                <option value="custom">★ Custom User-Defined Basis</option>
              </select>
            </div>

            {/* Miller Indices (h, k, l) Selector */}
            <div className="md:col-span-6 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Miller Indices (h k l)</span>
                <span className="text-sky-400 font-mono text-[9px]">
                  d = {structureFactorResult.dSpacing > 0 ? structureFactorResult.dSpacing.toFixed(4) : '--'} Å
                </span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/80 border border-slate-700/80 px-2 py-1 flex-1">
                  <span className="text-[10px] font-bold text-slate-500">h:</span>
                  <input
                    type="number"
                    value={millerH}
                    onChange={(e) => setMillerH(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-bold text-sky-400 text-center outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 bg-black/80 border border-slate-700/80 px-2 py-1 flex-1">
                  <span className="text-[10px] font-bold text-slate-500">k:</span>
                  <input
                    type="number"
                    value={millerK}
                    onChange={(e) => setMillerK(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-bold text-sky-400 text-center outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 bg-black/80 border border-slate-700/80 px-2 py-1 flex-1">
                  <span className="text-[10px] font-bold text-slate-500">l:</span>
                  <input
                    type="number"
                    value={millerL}
                    onChange={(e) => setMillerL(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-bold text-sky-400 text-center outline-none"
                  />
                </div>

                {/* Quick HKL Stepper Presets */}
                <div className="flex items-center gap-1">
                  {['100', '110', '111', '200', '220', '311'].map((hklStr) => (
                    <button
                      key={hklStr}
                      onClick={() => {
                        setMillerH(parseInt(hklStr[0]));
                        setMillerK(parseInt(hklStr[1]));
                        setMillerL(parseInt(hklStr[2]));
                      }}
                      className="px-2 py-1 text-[9px] font-bold uppercase bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-sky-500 transition-all"
                    >
                      {hklStr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Structure Factor Output Telemetry Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className={`p-3 border ${structureFactorResult.isExtinct ? 'bg-rose-950/20 border-rose-500/40 text-rose-300' : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'}`}>
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Diffraction Status</span>
              <span className="text-sm font-black flex items-center gap-1.5 mt-0.5">
                {structureFactorResult.isExtinct ? (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>FORBIDDEN</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>ALLOWED</span>
                  </>
                )}
              </span>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800/80">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">|F({millerH}{millerK}{millerL})|</span>
              <span className="text-sm font-black text-amber-400 mt-0.5 block tabular-nums">
                {structureFactorResult.fMag.toFixed(3)}
              </span>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800/80">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">F² = |F(hkl)|²</span>
              <span className="text-sm font-black text-sky-400 mt-0.5 block tabular-nums">
                {structureFactorResult.fSquared.toFixed(2)}
              </span>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800/80">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Phase Angle α</span>
              <span className="text-sm font-black text-purple-400 mt-0.5 block tabular-nums">
                {structureFactorResult.fPhaseDeg.toFixed(1)}°
              </span>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800/80">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Bragg Angle (2θ)</span>
              <span className="text-sm font-black text-slate-200 mt-0.5 block tabular-nums">
                {structureFactorResult.isBraggAllowedByWavelength 
                  ? `${structureFactorResult.twoTheta.toFixed(2)}°`
                  : 'Out of Range'}
              </span>
            </div>

            <div className="p-3 bg-[#0B0F17] border border-slate-800/80">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Powder Multiplicity</span>
              <span className="text-sm font-black text-slate-300 mt-0.5 block tabular-nums">
                M = {structureFactorResult.multiplicity}
              </span>
            </div>
          </div>

          {/* Phasor Polygon Diagram & Basis Atoms Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Argand Phasor Summation Complex Plane (5 Cols) */}
            {advancedMode && (
              <div className="lg:col-span-5 bg-[#020408] border border-slate-800/80 p-4 relative flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-sky-400" />
                    Structure Factor Complex Phasor Chain
                  </span>
                  <span className="text-[9px] font-mono text-purple-400">
                    F = {structureFactorResult.fReal.toFixed(2)} + i({structureFactorResult.fImag.toFixed(2)})
                  </span>
                </div>

                {/* Complex Plane SVG */}
                <div className="w-full aspect-square relative my-3 flex items-center justify-center">
                  <svg width="100%" height="100%" viewBox="-120 -120 240 240" className="overflow-visible">
                    {/* Grid circle and axes */}
                    <circle cx="0" cy="0" r="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" fill="none" />
                    <circle cx="0" cy="0" r="60" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" fill="none" />
                    <line x1="-110" y1="0" x2="110" y2="0" stroke="rgba(255,255,255,0.15)" />
                    <line x1="0" y1="-110" x2="0" y2="110" stroke="rgba(255,255,255,0.15)" />
                    
                    <text x="95" y="12" fill="#64748b" fontSize="8" className="font-mono">Re(F)</text>
                    <text x="4" y="-95" fill="#64748b" fontSize="8" className="font-mono">Im(F)</text>

                    {/* Phasor Polygon Chain */}
                    {(() => {
                      const maxMag = Math.max(
                        1,
                        structureFactorResult.fMag,
                        ...structureFactorResult.phasors.map(p => Math.sqrt(p.endX * p.endX + p.endY * p.endY))
                      );
                      const scaleFactor = 90 / Math.max(1, maxMag);

                      return (
                        <>
                          {structureFactorResult.phasors.map((p, idx) => {
                            const sx = p.startX * scaleFactor;
                            const sy = -p.startY * scaleFactor;
                            const ex = p.endX * scaleFactor;
                            const ey = -p.endY * scaleFactor;

                            return (
                              <g key={`phasor-seg-${idx}`}>
                                <line
                                  x1={sx}
                                  y1={sy}
                                  x2={ex}
                                  y2={ey}
                                  stroke={p.atom.color}
                                  strokeWidth="2"
                                />
                                <circle cx={ex} cy={ey} r="2" fill={p.atom.color} />
                              </g>
                            );
                          })}

                          {/* Resultant Total Vector F_total (Gold Arrow from Origin) */}
                          {structureFactorResult.fMag > 1e-4 && (
                            <g>
                              <line
                                x1="0"
                                y1="0"
                                x2={structureFactorResult.fReal * scaleFactor}
                                y2={-structureFactorResult.fImag * scaleFactor}
                                stroke="#fbbf24"
                                strokeWidth="3"
                              />
                              <circle
                                cx={structureFactorResult.fReal * scaleFactor}
                                cy={-structureFactorResult.fImag * scaleFactor}
                                r="3.5"
                                fill="#fbbf24"
                              />
                            </g>
                          )}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Phasor Status Footer */}
                <div className="text-[9px] bg-black/60 p-2 border border-slate-800 text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Atomic Summation:</span>
                    <span className="text-slate-200 font-bold">N = {basisAtoms.length} basis nodes</span>
                  </div>
                  {structureFactorResult.extinctionReason && (
                    <p className="text-rose-400 italic pt-0.5">
                      {structureFactorResult.extinctionReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Basis Atoms Fractional Coordinate Editor (7 Cols) */}
            <div className={`${advancedMode ? 'lg:col-span-7' : 'lg:col-span-12'} bg-[#0B0F17] border border-slate-800/80 p-4 space-y-3`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-emerald-400" />
                  Basis Atoms & Fractional Coordinates r_j = (x, y, z)
                </span>
                <button
                  onClick={handleAddAtom}
                  className="px-2 py-1 text-[9px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Atom
                </button>
              </div>

              {/* Basis Atoms List Table */}
              <div className="overflow-x-auto custom-scrollbar max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[9px] uppercase font-bold text-slate-500">
                      <th className="pb-1.5 px-2">Label</th>
                      <th className="pb-1.5 px-2">Element</th>
                      <th className="pb-1.5 px-2">x</th>
                      <th className="pb-1.5 px-2">y</th>
                      <th className="pb-1.5 px-2">z</th>
                      <th className="pb-1.5 px-2">f(s)</th>
                      <th className="pb-1.5 px-2">Phase φ</th>
                      <th className="pb-1.5 px-1 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {structureFactorResult.phasors.map((p, idx) => (
                      <tr key={p.atom.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2 px-2 text-[11px] font-semibold text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.atom.color }} />
                            <span className="truncate max-w-[100px]">{p.atom.label}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={p.atom.element}
                            onChange={(e) => handleUpdateAtom(p.atom.id, { element: e.target.value })}
                            className="w-10 bg-black/60 border border-slate-700 text-center text-xs text-sky-400 font-bold px-1 py-0.5 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.125"
                            value={p.atom.coords[0]}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              handleUpdateAtom(p.atom.id, { coords: [v, p.atom.coords[1], p.atom.coords[2]] });
                            }}
                            className="w-12 bg-black/60 border border-slate-700 text-center text-xs text-slate-200 px-1 py-0.5 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.125"
                            value={p.atom.coords[1]}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              handleUpdateAtom(p.atom.id, { coords: [p.atom.coords[0], v, p.atom.coords[2]] });
                            }}
                            className="w-12 bg-black/60 border border-slate-700 text-center text-xs text-slate-200 px-1 py-0.5 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.125"
                            value={p.atom.coords[2]}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              handleUpdateAtom(p.atom.id, { coords: [p.atom.coords[0], p.atom.coords[1], v] });
                            }}
                            className="w-12 bg-black/60 border border-slate-700 text-center text-xs text-slate-200 px-1 py-0.5 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-[10px] text-amber-400 font-mono">
                          {p.fEff.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-[10px] text-purple-400 font-mono">
                          {p.phaseDeg.toFixed(0)}°
                        </td>
                        <td className="py-2 px-1 text-right">
                          <button
                            onClick={() => handleRemoveAtom(p.atom.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            title="Delete basis atom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Basis Formula Reference Helper */}
              {advancedMode && (
                <div className="p-3 bg-black/50 border border-slate-800 text-[10px] text-slate-400 space-y-1.5">
                  <div className="font-bold text-slate-300 uppercase tracking-wider">
                    Crystallographic Structure Factor Equation:
                  </div>
                  <div className="font-mono text-emerald-400 text-xs">
                    F(hkl) = ∑ f_j(s) · exp(-B_j s²) · exp[ 2πi (h x_j + k y_j + l z_j) ]
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    Where <span className="text-slate-300">f_j(s)</span> is the analytical Cromer-Mann atomic form factor evaluated at <span className="text-slate-300">s = sin(θ)/λ = 1/(2 d_hkl)</span>, and <span className="text-slate-300">(x_j, y_j, z_j)</span> are the fractional coordinates of the basis atoms.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2.5: 2D LATTICE PROJECTION (Real Space) */}
      {activeTab === '2d_lattice' && (
        <div className="space-y-5">
          {/* Preset Selector & HKL Control Bar (Shared or duplicated) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0B0F17] p-3.5 border border-slate-800/80">
            {/* Standard Crystal Basis Preset */}
            <div className="md:col-span-6 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Crystal Basis Preset</span>
                <span className="text-emerald-400 font-mono text-[9px]">
                  {STANDARD_BASIS_PRESETS.find(p => p.id === selectedPresetId)?.spaceGroup || 'Custom Basis'}
                </span>
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="w-full bg-black/80 border border-slate-700/80 px-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 outline-none rounded-none font-mono"
              >
                {STANDARD_BASIS_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} — {preset.formula} ({preset.spaceGroup})
                  </option>
                ))}
                <option value="custom">★ Custom User-Defined Basis</option>
              </select>
            </div>

            {/* Miller Indices (h, k, l) Selector */}
            <div className="md:col-span-6 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Miller Indices (h k l)</span>
                <span className="text-sky-400 font-mono text-[9px]">
                  d = {structureFactorResult.dSpacing > 0 ? structureFactorResult.dSpacing.toFixed(4) : '--'} Å
                </span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/80 border border-slate-700/80 px-2 py-1 flex-1">
                  <span className="text-[10px] font-bold text-slate-500">h:</span>
                  <input
                    type="number"
                    value={millerH}
                    onChange={(e) => setMillerH(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-bold text-sky-400 text-center outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 bg-black/80 border border-slate-700/80 px-2 py-1 flex-1">
                  <span className="text-[10px] font-bold text-slate-500">k:</span>
                  <input
                    type="number"
                    value={millerK}
                    onChange={(e) => setMillerK(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-bold text-sky-400 text-center outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 bg-black/80 border border-slate-700/80 px-2 py-1 flex-1">
                  <span className="text-[10px] font-bold text-slate-500">l:</span>
                  <input
                    type="number"
                    value={millerL}
                    onChange={(e) => setMillerL(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-bold text-sky-400 text-center outline-none"
                  />
                </div>

                {/* Quick HKL Stepper Presets */}
                <div className="flex items-center gap-1">
                  {['100', '110', '111', '200', '220', '311'].map((hklStr) => (
                    <button
                      key={hklStr}
                      onClick={() => {
                        setMillerH(parseInt(hklStr[0]));
                        setMillerK(parseInt(hklStr[1]));
                        setMillerL(parseInt(hklStr[2]));
                      }}
                      className="px-2 py-1 text-[9px] font-bold uppercase bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-sky-500 transition-all"
                    >
                      {hklStr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2D Grid Visualizer */}
          <div className="bg-[#020408] border border-slate-800/80 p-5 w-full flex justify-center relative overflow-hidden">
            <svg width="100%" viewBox="-150 -150 300 300" className="max-w-2xl overflow-visible aspect-square md:aspect-[16/9]">
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#38bdf8" />
                </marker>
              </defs>
              <g transform="scale(1, -1)"> {/* Invert Y for standard Cartesian */}
              {(() => {
                const { aVec, bVec } = basisAndReciprocal;
                const scale = 30; // pixels per Angstrom
                const gridLines = [];

                // Draw cell grids (u, v from -4 to 4)
                for (let u = -4; u <= 4; u++) {
                  for (let v = -4; v <= 4; v++) {
                    const x = (u * aVec.x + v * bVec.x) * scale;
                    const y = (u * aVec.y + v * bVec.y) * scale;
                    // draw unit cell boundary
                    const nextUx = ((u+1) * aVec.x + v * bVec.x) * scale;
                    const nextUy = ((u+1) * aVec.y + v * bVec.y) * scale;
                    const nextVx = (u * aVec.x + (v+1) * bVec.x) * scale;
                    const nextVy = (u * aVec.y + (v+1) * bVec.y) * scale;
                    
                    gridLines.push(
                      <line key={`gu-${u}-${v}`} x1={x} y1={y} x2={nextUx} y2={nextUy} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    );
                    gridLines.push(
                      <line key={`gv-${u}-${v}`} x1={x} y1={y} x2={nextVx} y2={nextVy} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    );
                  }
                }

                // Draw (hkl) planes where h*u + k*v = n
                const planeLines = [];
                if (millerH !== 0 || millerK !== 0) {
                  for (let n = -15; n <= 15; n++) {
                    let u1, v1, u2, v2;
                    if (Math.abs(millerK) > 1e-5) {
                      u1 = -6; v1 = (n - millerH * u1) / millerK;
                      u2 = 6; v2 = (n - millerH * u2) / millerK;
                    } else {
                      u1 = n / millerH; v1 = -6;
                      u2 = n / millerH; v2 = 6;
                    }
                    const px1 = (u1 * aVec.x + v1 * bVec.x) * scale;
                    const py1 = (u1 * aVec.y + v1 * bVec.y) * scale;
                    const px2 = (u2 * aVec.x + v2 * bVec.x) * scale;
                    const py2 = (u2 * aVec.y + v2 * bVec.y) * scale;

                    planeLines.push(
                      <line key={`p-${n}`} x1={px1} y1={py1} x2={px2} y2={py2} stroke="#c084fc" strokeWidth="1.5" strokeDasharray="4 4" opacity={n === 0 ? "0.8" : "0.3"} />
                    );
                  }
                }

                // Draw basis atoms over the central and adjacent cells
                const atomCircles = [];
                for (let u = -3; u <= 3; u++) {
                  for (let v = -3; v <= 3; v++) {
                    basisAtoms.forEach((atom, idx) => {
                      const fracX = u + atom.coords[0];
                      const fracY = v + atom.coords[1];
                      const cx = (fracX * aVec.x + fracY * bVec.x) * scale;
                      const cy = (fracX * aVec.y + fracY * bVec.y) * scale;
                      
                      const isCenter = u === 0 && v === 0;
                      atomCircles.push(
                        <circle key={`atom-${u}-${v}-${idx}`} cx={cx} cy={cy} r={isCenter ? "4" : "3"} fill={atom.color} opacity={isCenter ? "1" : "0.4"} stroke="#000" strokeWidth="1" />
                      );
                    });
                  }
                }

                return (
                  <>
                    {gridLines}
                    {planeLines}
                    {atomCircles}
                    
                    {/* Origin & Axes */}
                    <circle cx="0" cy="0" r="3" fill="#fff" />
                    <line x1="0" y1="0" x2={aVec.x * scale} y2={aVec.y * scale} stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrowhead)" />
                    <line x1="0" y1="0" x2={bVec.x * scale} y2={bVec.y * scale} stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrowhead)" />
                  </>
                );
              })()}
              </g>
            </svg>
            <div className="absolute top-2 right-2 text-[10px] text-slate-400 bg-black/60 px-2 py-1 border border-slate-800">
              <span className="text-purple-400 font-bold mr-1">- - -</span> ({millerH}{millerK}{millerL}) Planes Projected on ab-plane
            </div>
            <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-black/60 px-2 py-1 border border-slate-800 flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-rose-500"></span> a-axis</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-500"></span> b-axis</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DUAL DIRECT & RECIPROCAL BASIS VECTORS */}
      {activeTab === 'reciprocal_basis' && (
        <div className="space-y-5">
          {/* Unit Cell Parameters Input HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-[#0B0F17] p-3.5 border border-slate-800/80">
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block">a (Å)</label>
              <input
                type="number"
                step="0.01"
                value={unitCell.a}
                onChange={(e) => setUnitCell({ ...unitCell, a: parseFloat(e.target.value) || 1 })}
                className="w-full bg-black/80 border border-slate-700 text-xs font-bold text-sky-400 px-2 py-1 mt-1 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block">b (Å)</label>
              <input
                type="number"
                step="0.01"
                value={unitCell.b}
                onChange={(e) => setUnitCell({ ...unitCell, b: parseFloat(e.target.value) || 1 })}
                className="w-full bg-black/80 border border-slate-700 text-xs font-bold text-sky-400 px-2 py-1 mt-1 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block">c (Å)</label>
              <input
                type="number"
                step="0.01"
                value={unitCell.c}
                onChange={(e) => setUnitCell({ ...unitCell, c: parseFloat(e.target.value) || 1 })}
                className="w-full bg-black/80 border border-slate-700 text-xs font-bold text-sky-400 px-2 py-1 mt-1 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block">α (°)</label>
              <input
                type="number"
                step="0.1"
                value={unitCell.alpha}
                onChange={(e) => setUnitCell({ ...unitCell, alpha: parseFloat(e.target.value) || 90 })}
                className="w-full bg-black/80 border border-slate-700 text-xs font-bold text-purple-400 px-2 py-1 mt-1 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block">β (°)</label>
              <input
                type="number"
                step="0.1"
                value={unitCell.beta}
                onChange={(e) => setUnitCell({ ...unitCell, beta: parseFloat(e.target.value) || 90 })}
                className="w-full bg-black/80 border border-slate-700 text-xs font-bold text-purple-400 px-2 py-1 mt-1 outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block">γ (°)</label>
              <input
                type="number"
                step="0.1"
                value={unitCell.gamma}
                onChange={(e) => setUnitCell({ ...unitCell, gamma: parseFloat(e.target.value) || 90 })}
                className="w-full bg-black/80 border border-slate-700 text-xs font-bold text-purple-400 px-2 py-1 mt-1 outline-none"
              />
            </div>
          </div>

          {/* 3D Basis Vector Stage & Metric Tensor Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 3D Interactive Basis Vector Orbit Canvas (7 Cols) */}
            <div 
              className="lg:col-span-7 bg-[#020408] border border-slate-800/80 relative aspect-[4/3] overflow-hidden select-none cursor-grab active:cursor-grabbing"
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
              <div className="absolute top-3 left-3 z-10 text-[9px] bg-black/70 px-2.5 py-1 border border-slate-800 pointer-events-none">
                <span className="text-slate-400">Drag to rotate 3D Basis • </span>
                <span className="text-sky-400 font-bold">RotX: {rotX.toFixed(0)}° RotY: {rotY.toFixed(0)}°</span>
              </div>

              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                <div className="flex items-center bg-black/80 border border-slate-700 p-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setZoom3D(prev => Math.min(2.5, prev + 0.15)); }}
                    className="px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-sky-300 font-bold"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <span className="text-[8px] text-slate-500 px-1 font-mono">{zoom3D.toFixed(1)}x</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setZoom3D(prev => Math.max(0.5, prev - 0.15)); }}
                    className="px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-sky-300 font-bold"
                    title="Zoom Out"
                  >
                    -
                  </button>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setRotX(-20); setRotY(35); setZoom3D(1.0); }}
                  className="px-2 py-1 text-[9px] font-bold uppercase border bg-black/60 text-slate-400 border-slate-700 hover:text-white transition-all flex items-center gap-1"
                  title="Reset View"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); setIsAutoRotate3D(!isAutoRotate3D); }}
                  className={`px-2 py-1 text-[9px] font-bold uppercase border transition-all ${
                    isAutoRotate3D ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-black/60 text-slate-400 border-slate-700'
                  }`}
                >
                  {isAutoRotate3D ? 'Auto-Orbiting' : 'Auto-Orbit'}
                </button>
              </div>

              {/* 3D SVG Projection */}
              <svg width="100%" height="100%" viewBox="0 0 360 300" className="w-full h-full">
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
                </defs>

                {(() => {
                  const o = project3D({ x: 0, y: 0, z: 0 }, 28, 180, 160);
                  const aPt = project3D(basisAndReciprocal.aVec, 28, 180, 160);
                  const bPt = project3D(basisAndReciprocal.bVec, 28, 180, 160);
                  const cPt = project3D(basisAndReciprocal.cVec, 28, 180, 160);

                  const abPt = project3D({
                    x: basisAndReciprocal.aVec.x + basisAndReciprocal.bVec.x,
                    y: basisAndReciprocal.aVec.y + basisAndReciprocal.bVec.y,
                    z: basisAndReciprocal.aVec.z + basisAndReciprocal.bVec.z
                  }, 28, 180, 160);

                  const acPt = project3D({
                    x: basisAndReciprocal.aVec.x + basisAndReciprocal.cVec.x,
                    y: basisAndReciprocal.aVec.y + basisAndReciprocal.cVec.y,
                    z: basisAndReciprocal.aVec.z + basisAndReciprocal.cVec.z
                  }, 28, 180, 160);

                  const bcPt = project3D({
                    x: basisAndReciprocal.bVec.x + basisAndReciprocal.cVec.x,
                    y: basisAndReciprocal.bVec.y + basisAndReciprocal.cVec.y,
                    z: basisAndReciprocal.bVec.z + basisAndReciprocal.cVec.z
                  }, 28, 180, 160);

                  const abcPt = project3D({
                    x: basisAndReciprocal.aVec.x + basisAndReciprocal.bVec.x + basisAndReciprocal.cVec.x,
                    y: basisAndReciprocal.aVec.y + basisAndReciprocal.bVec.y + basisAndReciprocal.cVec.y,
                    z: basisAndReciprocal.aVec.z + basisAndReciprocal.bVec.z + basisAndReciprocal.cVec.z
                  }, 28, 180, 160);

                  // Reciprocal normal vector G_hkl
                  const gVecScaled: Vector3D = {
                    x: structureFactorResult.gHklVec.x * 12,
                    y: structureFactorResult.gHklVec.y * 12,
                    z: structureFactorResult.gHklVec.z * 12
                  };
                  const gPt = project3D(gVecScaled, 28, 180, 160);

                  return (
                    <g>
                      {/* Unit Cell Wireframe Edges */}
                      <line x1={aPt.x} y1={aPt.y} x2={abPt.x} y2={abPt.y} stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                      <line x1={bPt.x} y1={bPt.y} x2={abPt.x} y2={abPt.y} stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                      <line x1={aPt.x} y1={aPt.y} x2={acPt.x} y2={acPt.y} stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                      <line x1={cPt.x} y1={cPt.y} x2={acPt.x} y2={acPt.y} stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                      <line x1={bPt.x} y1={bPt.y} x2={bcPt.x} y2={bcPt.y} stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                      <line x1={cPt.x} y1={cPt.y} x2={bcPt.x} y2={bcPt.y} stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                      <line x1={abPt.x} y1={abPt.y} x2={abcPt.x} y2={abcPt.y} stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                      <line x1={acPt.x} y1={acPt.y} x2={abcPt.x} y2={abcPt.y} stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />
                      <line x1={bcPt.x} y1={bcPt.y} x2={abcPt.x} y2={abcPt.y} stroke="rgba(255,255,255,0.15)" strokeDasharray="2 2" />

                      {/* Direct Basis Vector a (Rose) */}
                      <line x1={o.x} y1={o.y} x2={aPt.x} y2={aPt.y} stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrow-a)" />
                      <text x={aPt.x + 4} y={aPt.y} fill="#f43f5e" fontSize="11" className="font-bold">a</text>

                      {/* Direct Basis Vector b (Green) */}
                      <line x1={o.x} y1={o.y} x2={bPt.x} y2={bPt.y} stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow-b)" />
                      <text x={bPt.x + 4} y={bPt.y} fill="#10b981" fontSize="11" className="font-bold">b</text>

                      {/* Direct Basis Vector c (Sky Blue) */}
                      <line x1={o.x} y1={o.y} x2={cPt.x} y2={cPt.y} stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow-c)" />
                      <text x={cPt.x + 4} y={cPt.y} fill="#38bdf8" fontSize="11" className="font-bold">c</text>

                      {/* Reciprocal Lattice Vector G_hkl (Gold) */}
                      {vectorLength(structureFactorResult.gHklVec) > 1e-4 && (
                        <g>
                          <line x1={o.x} y1={o.y} x2={gPt.x} y2={gPt.y} stroke="#fbbf24" strokeWidth="3" markerEnd="url(#arrow-g)" />
                          <text x={gPt.x + 6} y={gPt.y} fill="#fbbf24" fontSize="11" className="font-bold">
                            G_{millerH}{millerK}{millerL}
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
                        const pt = project3D(cartPos, 28, 180, 160);
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
            <div className="lg:col-span-5 bg-[#0B0F17] border border-slate-800/80 p-4 space-y-4">
              {/* Unit Cell Volumes */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-black/60 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Direct Volume (V)</span>
                  <span className="font-bold text-sky-400 text-sm">
                    {basisAndReciprocal.directVolume.toFixed(3)} Å³
                  </span>
                </div>
                <div className="p-2.5 bg-black/60 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">Reciprocal Volume (V*)</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {basisAndReciprocal.reciprocalVolume.toFixed(5)} Å⁻³
                  </span>
                </div>
              </div>

              {/* Direct Metric Tensor G */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Direct Metric Tensor [G_ij = a_i · a_j]</span>
                </div>
                <div className="bg-black/80 border border-slate-800 p-2 text-[10px] font-mono grid grid-cols-3 gap-1 text-center">
                  {basisAndReciprocal.directMetricTensor.flatMap((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <span key={`g-${rIdx}-${cIdx}`} className="text-slate-300 py-0.5 bg-slate-900/60">
                        {val.toFixed(2)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Reciprocal Metric Tensor G* */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>Reciprocal Metric Tensor [G*_ij = a*_i · a*_j]</span>
                </div>
                <div className="bg-black/80 border border-slate-800 p-2 text-[10px] font-mono grid grid-cols-3 gap-1 text-center">
                  {basisAndReciprocal.reciprocalMetricTensor.flatMap((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <span key={`gstar-${rIdx}-${cIdx}`} className="text-amber-300/90 py-0.5 bg-amber-950/20">
                        {val.toFixed(4)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Reciprocal Basis Vector Lengths */}
              <div className="p-2.5 bg-black/60 border border-slate-800 text-[10px] space-y-1">
                <div className="text-slate-400 font-bold uppercase tracking-wider">Reciprocal Lengths & Angles</div>
                <div className="grid grid-cols-3 gap-1 font-mono text-emerald-400">
                  <span>a* = {basisAndReciprocal.reciprocalParams.aStar.toFixed(4)}</span>
                  <span>b* = {basisAndReciprocal.reciprocalParams.bStar.toFixed(4)}</span>
                  <span>c* = {basisAndReciprocal.reciprocalParams.cStar.toFixed(4)}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 font-mono text-purple-400 text-[9px] pt-1">
                  <span>α* = {basisAndReciprocal.reciprocalParams.alphaStar.toFixed(1)}°</span>
                  <span>β* = {basisAndReciprocal.reciprocalParams.betaStar.toFixed(1)}°</span>
                  <span>γ* = {basisAndReciprocal.reciprocalParams.gammaStar.toFixed(1)}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUB-PLANE INTERFERENCE & ATOMIC STACKING */}
      {activeTab === 'plane_stacking' && (
        <div className="space-y-5">
          <div className="bg-[#0B0F17] p-4 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Atomic Basis Sub-Plane Stacking for Reflection ({millerH} {millerK} {millerL})
              </h3>
              <span className="text-[10px] font-mono text-sky-400 font-bold">
                d_hkl = {structureFactorResult.dSpacing.toFixed(4)} Å
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              When a non-primitive crystal contains multiple basis atoms inside the unit cell, the basis atoms form sub-planes spaced at fractional intervals of <span className="text-slate-200 font-bold">d_hkl</span>. If the phase difference from sub-plane reflections equals 180° (destructive interference), the Bragg peak completely disappears from the powder XRD pattern (Systematic Extinction).
            </p>
          </div>

          {/* Sub-Plane Diagram */}
          <div className="bg-[#020408] border border-slate-800/80 p-5">
            <div className="w-full aspect-[21/9] relative overflow-hidden flex flex-col justify-around py-3">
              {/* Primary Lattice Plane n=0 */}
              <div className="relative border-b-2 border-dashed border-sky-400/80 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-400 uppercase font-mono">
                  Primary Bragg Plane (Phase φ = 0°)
                </span>
                <span className="text-[9px] font-mono text-slate-400">z = 0.00 d_hkl</span>
              </div>

              {/* Basis Sub-Planes dynamically rendered */}
              {structureFactorResult.phasors.map((p, idx) => {
                const normPhase = ((p.phaseDeg % 360) + 360) % 360;
                return (
                  <div 
                    key={`sub-plane-${idx}`} 
                    className="relative border-b border-purple-500/50 py-1.5 flex items-center justify-between group hover:bg-white/[0.02] px-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.atom.color }} />
                      <span className="text-xs font-bold text-slate-200">{p.atom.label}</span>
                      <span className="text-[10px] text-amber-400 font-mono">f = {p.fEff.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-purple-300 font-bold">
                        Phase φ = {normPhase.toFixed(1)}°
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        Shift = {((normPhase / 360) * structureFactorResult.dSpacing).toFixed(3)} Å
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Primary Lattice Plane n=1 */}
              <div className="relative border-t-2 border-dashed border-sky-400/80 pt-1 flex items-center justify-between">
                <span className="text-[10px] font-bold text-sky-400 uppercase font-mono">
                  Next Bragg Plane (Phase φ = 360° / 2π)
                </span>
                <span className="text-[9px] font-mono text-slate-400">z = 1.00 d_hkl</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
