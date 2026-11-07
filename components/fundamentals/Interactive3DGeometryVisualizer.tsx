import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Box, 
  Rotate3d, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Sliders, 
  Layers, 
  Download, 
  Compass, 
  Grid, 
  RefreshCw,
  Lock,
  Unlock,
  Calculator,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';
import { 
  CrystalSystemId, 
  CenteringType, 
  CRYSTAL_SYSTEMS_CATALOG
} from './UnitCellsSection';

interface Interactive3DGeometryVisualizerProps {
  selectedSystemId: CrystalSystemId;
  onSelectSystem: (id: CrystalSystemId) => void;
  activeCentering: CenteringType;
  setActiveCentering: (c: CenteringType) => void;
}

export type AtomStyle = 'ball-and-stick' | 'wireframe-node' | 'space-filling';
export type SupercellMode = '1x1x1' | '2x2x1' | '2x2x2';
export type TrigonalSetting = 'hexagonal_obverse' | 'rhombohedral_primitive';

interface CustomLatticeParams {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
}

interface AtomHoverInfo {
  x: number;
  y: number;
  label: string;
  coords: string;
  cartesianStr: string;
  fraction: string;
  type: string;
}

export const Interactive3DGeometryVisualizer: React.FC<Interactive3DGeometryVisualizerProps> = ({
  selectedSystemId,
  activeCentering,
  setActiveCentering
}) => {
  const activeSystem = useMemo(() => {
    return CRYSTAL_SYSTEMS_CATALOG.find(s => s.id === selectedSystemId) || CRYSTAL_SYSTEMS_CATALOG[0];
  }, [selectedSystemId]);

  // Viewport Orbit / Camera State
  const [yaw, setYaw] = useState<number>(28);
  const [pitch, setPitch] = useState<number>(22);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Trigonal setting state (Hexagonal triple cell vs Primitive rhombohedron)
  const [trigonalSetting, setTrigonalSetting] = useState<TrigonalSetting>('hexagonal_obverse');

  // Supercell Tessellation State
  const [supercellMode, setSupercellMode] = useState<SupercellMode>('1x1x1');

  // Drag interaction state
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Custom Lattice Parameters (live morphing)
  const [params, setParams] = useState<CustomLatticeParams>({
    a: activeSystem.defaultParams.a,
    b: activeSystem.defaultParams.b,
    c: activeSystem.defaultParams.c,
    alpha: activeSystem.defaultParams.alpha,
    beta: activeSystem.defaultParams.beta,
    gamma: activeSystem.defaultParams.gamma
  });

  // Reference atomic mass (g/mol) for live theoretical density calculation
  const [molarMass, setMolarMass] = useState<number>(63.546);

  // Symmetry lock toggle
  const [symmetryLocked, setSymmetryLocked] = useState<boolean>(true);

  // Synchronize params when system changes
  useEffect(() => {
    setParams({
      a: activeSystem.defaultParams.a,
      b: activeSystem.defaultParams.b,
      c: activeSystem.defaultParams.c,
      alpha: activeSystem.defaultParams.alpha,
      beta: activeSystem.defaultParams.beta,
      gamma: activeSystem.defaultParams.gamma
    });
    if (activeSystem.id === 'trigonal') {
      setTrigonalSetting('hexagonal_obverse');
    }
  }, [activeSystem]);

  // Handle switching Trigonal between Hexagonal Obverse (a=b!=c, gamma=120) and Primitive Rhombohedral (a=b=c, alpha=beta=gamma)
  const handleTrigonalSettingChange = (nextSetting: TrigonalSetting) => {
    if (nextSetting === trigonalSetting) return;
    playSynthTone('switch');
    setTrigonalSetting(nextSetting);

    if (nextSetting === 'rhombohedral_primitive') {
      // Convert from current Hexagonal (a_H, c_H) to Rhombohedral (a_R, alpha_R)
      const aH = params.a;
      const cH = params.c;
      const aR = (1 / 3) * Math.sqrt(3 * aH * aH + cH * cH);
      const sinHalfAlpha = Math.min(0.999, 3 / (2 * Math.sqrt(3 + (cH / aH) * (cH / aH))));
      const alphaR = (2 * Math.asin(sinHalfAlpha) * 180) / Math.PI;
      setParams({
        a: parseFloat(aR.toFixed(3)),
        b: parseFloat(aR.toFixed(3)),
        c: parseFloat(aR.toFixed(3)),
        alpha: parseFloat(alphaR.toFixed(2)),
        beta: parseFloat(alphaR.toFixed(2)),
        gamma: parseFloat(alphaR.toFixed(2))
      });
    } else {
      // Convert from Rhombohedral (a_R, alpha_R) to Hexagonal Obverse (a_H, c_H)
      const aR = params.a;
      const alphaRad = (params.alpha * Math.PI) / 180;
      const aH = 2 * aR * Math.sin(alphaRad / 2);
      const cH = aR * Math.sqrt(Math.max(0.01, 3 * (1 + 2 * Math.cos(alphaRad))));
      setParams({
        a: parseFloat(aH.toFixed(3)),
        b: parseFloat(aH.toFixed(3)),
        c: parseFloat(cH.toFixed(3)),
        alpha: 90,
        beta: 90,
        gamma: 120
      });
    }
  };

  // Visual Display Layer Toggles
  const [atomStyle, setAtomStyle] = useState<AtomStyle>('ball-and-stick');
  const [atomRadiusScale, setAtomRadiusScale] = useState<number>(7.5);
  const [showCellFaces, setShowCellFaces] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showIndices, setShowIndices] = useState<boolean>(true);
  const [showCenterings, setShowCenterings] = useState<boolean>(true);
  const [showBonds, setShowBonds] = useState<boolean>(true);
  const [showAngleArcs, setShowAngleArcs] = useState<boolean>(true);
  const [showSymmetryAxes, setShowSymmetryAxes] = useState<boolean>(true);
  const [showCoordinationPolyhedron, setShowCoordinationPolyhedron] = useState<boolean>(false);
  const [hexPrismMode, setHexPrismMode] = useState<boolean>(true);

  // Miller Plane (hkl) Slicing Overlay
  const [showMillerPlane, setShowMillerPlane] = useState<boolean>(false);
  const [showParallelPlaneStack, setShowParallelPlaneStack] = useState<boolean>(true);
  const [hklH, setHklH] = useState<number>(1);
  const [hklK, setHklK] = useState<number>(1);
  const [hklL, setHklL] = useState<number>(1);

  // X-ray Radiation Source
  const [radiation, setRadiation] = useState<{ name: string; wavelength: number }>({
    name: 'Cu Kα',
    wavelength: 1.5406
  });

  // Hovered atom tooltip state
  const [hoveredAtom, setHoveredAtom] = useState<AtomHoverInfo | null>(null);

  // Active parameter accordion tab
  const [activeControlTab, setActiveControlTab] = useState<'params' | 'layers' | 'miller' | 'packing'>('params');

  // Auto-rotation loop
  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setYaw(prev => (prev + 0.75) % 360);
    }, 25);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // Pointer Drag Handlers for 3D Orbiting
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    if (isAutoRotating) setIsAutoRotating(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setYaw(prev => (prev + dx * 0.7) % 360);
    setPitch(prev => Math.max(-88, Math.min(88, prev - dy * 0.7)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom(prev => Math.max(0.5, Math.min(2.5, prev + zoomDelta)));
  };

  // Camera orientation presets
  const setCameraPreset = (preset: 'iso' | 'top' | 'front' | 'side' | 'diagonal') => {
    playSynthTone('tick');
    switch (preset) {
      case 'iso':
        setYaw(28);
        setPitch(22);
        break;
      case 'top':
        setYaw(0);
        setPitch(90);
        break;
      case 'front':
        setYaw(0);
        setPitch(0);
        break;
      case 'side':
        setYaw(90);
        setPitch(0);
        break;
      case 'diagonal':
        setYaw(45);
        setPitch(35.26);
        break;
    }
  };

  const resetCamera = () => {
    playSynthTone('action');
    setYaw(28);
    setPitch(22);
    setZoom(1.0);
  };

  const resetToMineralDefaults = () => {
    playSynthTone('switch');
    setParams({
      a: activeSystem.defaultParams.a,
      b: activeSystem.defaultParams.b,
      c: activeSystem.defaultParams.c,
      alpha: activeSystem.defaultParams.alpha,
      beta: activeSystem.defaultParams.beta,
      gamma: activeSystem.defaultParams.gamma
    });
    if (activeSystem.id === 'trigonal') {
      setTrigonalSetting('hexagonal_obverse');
    }
  };

  // Parameter slider change handler with proper crystallographic symmetry constraints
  const updateLatticeParam = (key: keyof CustomLatticeParams, val: number) => {
    setParams(prev => {
      const next = { ...prev, [key]: val };
      if (!symmetryLocked) return next;

      if (activeSystem.id === 'cubic') {
        if (key === 'a' || key === 'b' || key === 'c') {
          next.a = val;
          next.b = val;
          next.c = val;
        }
        next.alpha = 90;
        next.beta = 90;
        next.gamma = 90;
      } else if (activeSystem.id === 'tetragonal') {
        if (key === 'a' || key === 'b') {
          next.a = val;
          next.b = val;
        }
        next.alpha = 90;
        next.beta = 90;
        next.gamma = 90;
      } else if (activeSystem.id === 'hexagonal') {
        if (key === 'a' || key === 'b') {
          next.a = val;
          next.b = val;
        }
        next.alpha = 90;
        next.beta = 90;
        next.gamma = 120;
      } else if (activeSystem.id === 'trigonal') {
        if (trigonalSetting === 'rhombohedral_primitive') {
          if (key === 'a' || key === 'b' || key === 'c') {
            next.a = val;
            next.b = val;
            next.c = val;
          }
          if (key === 'alpha' || key === 'beta' || key === 'gamma') {
            const clampedAngle = Math.min(118, Math.max(30, val));
            next.alpha = clampedAngle;
            next.beta = clampedAngle;
            next.gamma = clampedAngle;
          }
        } else {
          // Hexagonal obverse setting
          if (key === 'a' || key === 'b') {
            next.a = val;
            next.b = val;
          }
          next.alpha = 90;
          next.beta = 90;
          next.gamma = 120;
        }
      } else if (activeSystem.id === 'orthorhombic') {
        next.alpha = 90;
        next.beta = 90;
        next.gamma = 90;
      } else if (activeSystem.id === 'monoclinic') {
        next.alpha = 90;
        next.gamma = 90;
      }
      return next;
    });
  };

  // Exact Unit Cell Volume calculation V = a·b·c·√(1 - cos²α - cos²β - cos²γ + 2cosα·cosβ·cosγ)
  const cellVolume = useMemo(() => {
    const { a, b, c, alpha, beta, gamma } = params;
    const toRad = Math.PI / 180;
    const aR = alpha * toRad;
    const bR = beta * toRad;
    const gR = gamma * toRad;

    const term =
      1 -
      Math.pow(Math.cos(aR), 2) -
      Math.pow(Math.cos(bR), 2) -
      Math.pow(Math.cos(gR), 2) +
      2 * Math.cos(aR) * Math.cos(bR) * Math.cos(gR);
    return Math.max(0, a * b * c * Math.sqrt(Math.max(0, term)));
  }, [params]);

  // Reciprocal Lattice Parameters: a*, b*, c*, alpha*, beta*, gamma*
  const reciprocalParams = useMemo(() => {
    const { a, b, c, alpha, beta, gamma } = params;
    const V = cellVolume;
    if (V <= 0) return { aStar: 0, bStar: 0, cStar: 0, alphaStar: 90, betaStar: 90, gammaStar: 90 };
    const toRad = Math.PI / 180;
    const aR = alpha * toRad;
    const bR = beta * toRad;
    const gR = gamma * toRad;

    const aStar = (b * c * Math.sin(aR)) / V;
    const bStar = (a * c * Math.sin(bR)) / V;
    const cStar = (a * b * Math.sin(gR)) / V;

    const cosAlphaStar = (Math.cos(bR) * Math.cos(gR) - Math.cos(aR)) / Math.max(1e-6, Math.sin(bR) * Math.sin(gR));
    const cosBetaStar = (Math.cos(aR) * Math.cos(gR) - Math.cos(bR)) / Math.max(1e-6, Math.sin(aR) * Math.sin(gR));
    const cosGammaStar = (Math.cos(aR) * Math.cos(bR) - Math.cos(gR)) / Math.max(1e-6, Math.sin(aR) * Math.sin(bR));

    return {
      aStar,
      bStar,
      cStar,
      alphaStar: (Math.acos(Math.max(-1, Math.min(1, cosAlphaStar))) * 180) / Math.PI,
      betaStar: (Math.acos(Math.max(-1, Math.min(1, cosBetaStar))) * 180) / Math.PI,
      gammaStar: (Math.acos(Math.max(-1, Math.min(1, cosGammaStar))) * 180) / Math.PI
    };
  }, [params, cellVolume]);

  // Direct Metric Tensor G_ij (3x3 symmetric tensor: g_ij = e_i · e_j)
  const metricTensor = useMemo(() => {
    const { a, b, c, alpha, beta, gamma } = params;
    const toRad = Math.PI / 180;
    const g11 = a * a;
    const g22 = b * b;
    const g33 = c * c;
    const g12 = a * b * Math.cos(gamma * toRad);
    const g13 = a * c * Math.cos(beta * toRad);
    const g23 = b * c * Math.cos(alpha * toRad);
    return [
      [g11, g12, g13],
      [g12, g22, g23],
      [g13, g23, g33]
    ];
  }, [params]);

  // Multiplicity Z, Nearest-Neighbor Distance d_NN, Hard-Sphere APF, and Density
  const packingTelemetry = useMemo(() => {
    const { a, b, c } = params;
    const isTrigObverse = activeSystem.id === 'trigonal' && trigonalSetting === 'hexagonal_obverse';
    const netZ =
      activeCentering === 'F'
        ? 4
        : activeCentering === 'I' || activeCentering === 'C'
        ? 2
        : isTrigObverse
        ? 3
        : 1;

    // Calculate shortest lattice vector / nearest-neighbor distance d_NN
    const toRad = Math.PI / 180;
    const ax = a;
    const bx = b * Math.cos(params.gamma * toRad);
    const by = b * Math.sin(params.gamma * toRad);
    const cx = c * Math.cos(params.beta * toRad);
    const cy = c * (Math.cos(params.alpha * toRad) - Math.cos(params.beta * toRad) * Math.cos(params.gamma * toRad)) / Math.max(1e-5, Math.sin(params.gamma * toRad));
    const cz = Math.sqrt(Math.max(0, c * c - cx * cx - cy * cy));

    const candidateFrac: [number, number, number][] = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0],
      [1, -1, 0],
      [1, 0, 1],
      [0, 1, 1]
    ];
    if (activeCentering === 'I') {
      candidateFrac.push([0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, 0.5, 0.5]);
    } else if (activeCentering === 'F') {
      candidateFrac.push([0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5], [0.5, -0.5, 0]);
    } else if (activeCentering === 'C') {
      candidateFrac.push([0.5, 0.5, 0], [0.5, -0.5, 0]);
    } else if (isTrigObverse) {
      candidateFrac.push([2 / 3, 1 / 3, 1 / 3], [1 / 3, 2 / 3, 2 / 3], [-1 / 3, 1 / 3, 1 / 3]);
    }

    let dNN = Infinity;
    candidateFrac.forEach(([u, v, w]) => {
      const dx = u * ax + v * bx + w * cx;
      const dy = v * by + w * cy;
      const dz = w * cz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 1e-4 && dist < dNN) {
        dNN = dist;
      }
    });
    if (!isFinite(dNN)) dNN = a;

    const hardSphereRadius = dNN / 2;
    const sphereVolume = (4 / 3) * Math.PI * Math.pow(hardSphereRadius, 3);
    const apfPercent = cellVolume > 0 ? Math.min(74.05, ((netZ * sphereVolume) / cellVolume) * 100) : 0;

    // Theoretical Density rho = (Z * M) / (N_A * V * 10^-24) = (Z * M * 1.660539) / V_A^3
    const densityGcm3 = cellVolume > 0 ? (netZ * molarMass * 1.660539) / cellVolume : 0;

    const coordNumber =
      activeSystem.id === 'cubic'
        ? activeCentering === 'F'
          ? 12
          : activeCentering === 'I'
          ? 8
          : 6
        : activeSystem.id === 'hexagonal'
        ? 12
        : activeCentering === 'I'
        ? 8
        : 6;

    return {
      netZ,
      dNN,
      hardSphereRadius,
      apfPercent,
      densityGcm3,
      coordNumber,
      cornerCount: 8,
      faceCount: activeCentering === 'F' ? 6 : activeCentering === 'C' ? 2 : 0,
      bodyCount: activeCentering === 'I' ? 1 : isTrigObverse ? 2 : 0
    };
  }, [params, activeCentering, activeSystem.id, trigonalSetting, cellVolume, molarMass]);

  // Live d-spacing and Bragg 2θ calculation using the exact general Reciprocal Metric Tensor
  const dSpacingResult = useMemo(() => {
    const { a, b, c, alpha, beta, gamma } = params;
    const h = hklH;
    const k = hklK;
    const l = hklL;
    if (h === 0 && k === 0 && l === 0) return { d: 0, twoTheta: 0, q: 0 };

    const V = cellVolume;
    if (V <= 0) return { d: 0, twoTheta: 0, q: 0 };

    const toRad = Math.PI / 180;
    const aR = alpha * toRad;
    const bR = beta * toRad;
    const gR = gamma * toRad;

    const S11 = b * b * c * c * Math.sin(aR) * Math.sin(aR);
    const S22 = a * a * c * c * Math.sin(bR) * Math.sin(bR);
    const S33 = a * a * b * b * Math.sin(gR) * Math.sin(gR);
    const S12 = a * b * c * c * (Math.cos(aR) * Math.cos(bR) - Math.cos(gR));
    const S23 = a * a * b * c * (Math.cos(bR) * Math.cos(gR) - Math.cos(aR));
    const S13 = a * b * b * c * (Math.cos(gR) * Math.cos(aR) - Math.cos(bR));

    const invD2 =
      (1 / (V * V)) *
      (S11 * h * h + S22 * k * k + S33 * l * l + 2 * S12 * h * k + 2 * S23 * k * l + 2 * S13 * h * l);

    if (invD2 <= 0) return { d: 0, twoTheta: 0, q: 0 };
    const d = 1 / Math.sqrt(invD2);
    const q = (2 * Math.PI) / d;
    const sinTheta = radiation.wavelength / (2 * d);
    const twoTheta = sinTheta <= 1 ? (2 * Math.asin(sinTheta) * 180) / Math.PI : 0;

    return { d, twoTheta, q };
  }, [params, hklH, hklK, hklL, radiation, cellVolume]);

  // 3D Geometric Projection Engine with True Depth-Sorting (Painter's Algorithm)
  const projection = useMemo(() => {
    const { a, b, c, alpha, beta, gamma } = params;
    const toRad = Math.PI / 180;
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;

    const maxDim = Math.max(a, b, c, 0.1);
    const supercellScaleFactor = supercellMode === '2x2x2' ? 0.56 : supercellMode === '2x2x1' ? 0.65 : 1.0;
    const baseVisualSize = 135 * supercellScaleFactor;
    const sa = (a / maxDim) * baseVisualSize * zoom;
    const sb = (b / maxDim) * baseVisualSize * zoom;
    const sc = (c / maxDim) * baseVisualSize * zoom;

    // Crystallographic Cartesian basis vectors (in visual pixels)
    const ax = sa;
    const ay = 0;
    const az = 0;

    const bx = sb * Math.cos(gamma * toRad);
    const by = sb * Math.sin(gamma * toRad);
    const bz = 0;

    const cx = sc * Math.cos(beta * toRad);
    const cy =
      (sc * (Math.cos(alpha * toRad) - Math.cos(beta * toRad) * Math.cos(gamma * toRad))) /
      Math.max(1e-4, Math.sin(gamma * toRad));
    const czTerm = sc * sc - cx * cx - cy * cy;
    const cz = Math.sqrt(Math.max(0, czTerm));

    // Real-space Angstrom Cartesian basis for tooltips
    const realAx = a;
    const realBx = b * Math.cos(gamma * toRad);
    const realBy = b * Math.sin(gamma * toRad);
    const realCx = c * Math.cos(beta * toRad);
    const realCy =
      (c * (Math.cos(alpha * toRad) - Math.cos(beta * toRad) * Math.cos(gamma * toRad))) /
      Math.max(1e-4, Math.sin(gamma * toRad));
    const realCz = Math.sqrt(Math.max(0, c * c - realCx * realCx - realCy * realCy));

    const cxScreen = 260;
    const cyScreen = 210;

    const project = (x: number, y: number, z: number) => {
      const x1 = x * Math.cos(yawRad) - y * Math.sin(yawRad);
      const y1 = x * Math.sin(yawRad) + y * Math.cos(yawRad);
      const z1 = z;

      const x2 = x1;
      const y2 = y1 * Math.cos(pitchRad) - z1 * Math.sin(pitchRad);
      const z2 = y1 * Math.sin(pitchRad) + z1 * Math.cos(pitchRad);

      return {
        px: cxScreen + x2,
        py: cyScreen - y2,
        depth: z2,
        orig: { x, y, z }
      };
    };

    const nx = supercellMode === '1x1x1' ? 1 : 2;
    const ny = supercellMode === '1x1x1' ? 1 : 2;
    const nz = supercellMode === '2x2x2' ? 2 : 1;

    const ox = (nx * ax + ny * bx + nz * cx) / 2;
    const oy = (nx * ay + ny * by + nz * cy) / 2;
    const oz = (nx * az + ny * bz + nz * cz) / 2;

    const fracToCart = (u: number, v: number, w: number) => {
      return {
        x: u * ax + v * bx + w * cx - ox,
        y: u * ay + v * by + w * cy - oy,
        z: u * az + v * bz + w * cz - oz
      };
    };

    const fracToRealAngstromStr = (u: number, v: number, w: number) => {
      const rx = u * realAx + v * realBx + w * realCx;
      const ry = v * realBy + w * realCy;
      const rz = w * realCz;
      return `[${rx.toFixed(2)}, ${ry.toFixed(2)}, ${rz.toFixed(2)}] Å`;
    };

    // Primary unit cell 8 vertices in fractional coordinates
    const fractionalVertices = [
      { u: 0, v: 0, w: 0, label: '000' },
      { u: 1, v: 0, w: 0, label: '100' },
      { u: 1, v: 1, w: 0, label: '110' },
      { u: 0, v: 1, w: 0, label: '010' },
      { u: 0, v: 0, w: 1, label: '001' },
      { u: 1, v: 0, w: 1, label: '101' },
      { u: 1, v: 1, w: 1, label: '111' },
      { u: 0, v: 1, w: 1, label: '011' }
    ];

    const corners = fractionalVertices.map(fv => {
      const cPt = fracToCart(fv.u, fv.v, fv.w);
      const p = project(cPt.x, cPt.y, cPt.z);
      return {
        ...p,
        u: fv.u,
        v: fv.v,
        w: fv.w,
        label: fv.label,
        cartesianStr: fracToRealAngstromStr(fv.u, fv.v, fv.w)
      };
    });

    // Generate Supercell Ghost Wireframe Edges if supercellMode !== '1x1x1'
    const supercellEdges: { p1: { px: number; py: number }; p2: { px: number; py: number }; isPrimary: boolean; avgDepth: number }[] = [];
    const baseEdgePairs: [number[], number[]][] = [
      [[0,0,0], [1,0,0]], [[1,0,0], [1,1,0]], [[1,1,0], [0,1,0]], [[0,1,0], [0,0,0]],
      [[0,0,1], [1,0,1]], [[1,0,1], [1,1,1]], [[1,1,1], [0,1,1]], [[0,1,1], [0,0,1]],
      [[0,0,0], [0,0,1]], [[1,0,0], [1,0,1]], [[1,1,0], [1,1,1]], [[0,1,0], [0,1,1]]
    ];

    for (let iu = 0; iu < nx; iu++) {
      for (let iv = 0; iv < ny; iv++) {
        for (let iw = 0; iw < nz; iw++) {
          const isPrimary = iu === 0 && iv === 0 && iw === 0;
          baseEdgePairs.forEach(([eA, eB]) => {
            const c1 = fracToCart(eA[0] + iu, eA[1] + iv, eA[2] + iw);
            const c2 = fracToCart(eB[0] + iu, eB[1] + iv, eB[2] + iw);
            const p1 = project(c1.x, c1.y, c1.z);
            const p2 = project(c2.x, c2.y, c2.z);
            supercellEdges.push({
              p1,
              p2,
              isPrimary,
              avgDepth: (p1.depth + p2.depth) / 2
            });
          });
        }
      }
    }

    // Primary 12 wireframe edges sorted by depth
    const edges = [
      { i: 0, j: 1, axis: 'a' },
      { i: 1, j: 2, axis: 'b' },
      { i: 2, j: 3, axis: 'a' },
      { i: 3, j: 0, axis: 'b' },
      { i: 4, j: 5, axis: 'a' },
      { i: 5, j: 6, axis: 'b' },
      { i: 6, j: 7, axis: 'a' },
      { i: 7, j: 4, axis: 'b' },
      { i: 0, j: 4, axis: 'c' },
      { i: 1, j: 5, axis: 'c' },
      { i: 2, j: 6, axis: 'c' },
      { i: 3, j: 7, axis: 'c' }
    ]
      .map(e => {
        const p1 = corners[e.i];
        const p2 = corners[e.j];
        const avgDepth = (p1.depth + p2.depth) / 2;
        return { ...e, p1, p2, avgDepth };
      })
      .sort((aE, bE) => aE.avgDepth - bE.avgDepth);

    // 6 Faces sorted back-to-front (Painter's algorithm)
    const faces = [
      { indices: [0, 1, 2, 3], name: 'Bottom (001)' },
      { indices: [4, 5, 6, 7], name: 'Top (001)' },
      { indices: [0, 1, 5, 4], name: 'Front (010)' },
      { indices: [2, 3, 7, 6], name: 'Back (010)' },
      { indices: [1, 2, 6, 5], name: 'Right (100)' },
      { indices: [0, 3, 7, 4], name: 'Left (100)' }
    ]
      .map(f => {
        const pts = f.indices.map(idx => corners[idx]);
        const avgDepth = pts.reduce((sum, pt) => sum + pt.depth, 0) / pts.length;
        const pointsStr = pts.map(p => `${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ');
        return { ...f, pts, avgDepth, pointsStr };
      })
      .sort((fA, fB) => fA.avgDepth - fB.avgDepth);

    // Centered Atoms
    interface CenteredPoint {
      px: number;
      py: number;
      depth: number;
      label: string;
      coords: string;
      cartesianStr: string;
      fraction: string;
      type: 'body' | 'face' | 'base' | 'rhombo';
    }
    const centeredPoints: CenteredPoint[] = [];

    const addCentered = (
      u: number,
      v: number,
      w: number,
      label: string,
      coords: string,
      fraction: string,
      type: CenteredPoint['type']
    ) => {
      const cPt = fracToCart(u, v, w);
      const p = project(cPt.x, cPt.y, cPt.z);
      centeredPoints.push({
        px: p.px,
        py: p.py,
        depth: p.depth,
        label,
        coords,
        cartesianStr: fracToRealAngstromStr(u, v, w),
        fraction,
        type
      });
    };

    if (activeCentering === 'I') {
      addCentered(0.5, 0.5, 0.5, 'Body-Center', '(½, ½, ½)', '1.00 (100% inside unit cell)', 'body');
    } else if (activeCentering === 'F') {
      addCentered(0.5, 0.5, 0, 'Face (001) Bot', '(½, ½, 0)', '½ (Shared by 2 cells)', 'face');
      addCentered(0.5, 0.5, 1, 'Face (001) Top', '(½, ½, 1)', '½ (Shared by 2 cells)', 'face');
      addCentered(0.5, 0, 0.5, 'Face (010) Front', '(½, 0, ½)', '½ (Shared by 2 cells)', 'face');
      addCentered(0.5, 1, 0.5, 'Face (010) Back', '(½, 1, ½)', '½ (Shared by 2 cells)', 'face');
      addCentered(0, 0.5, 0.5, 'Face (100) Left', '(0, ½, ½)', '½ (Shared by 2 cells)', 'face');
      addCentered(1, 0.5, 0.5, 'Face (100) Right', '(1, ½, ½)', '½ (Shared by 2 cells)', 'face');
    } else if (activeCentering === 'C') {
      addCentered(0.5, 0.5, 0, 'Base (001) Bot', '(½, ½, 0)', '½ (Shared by 2 cells)', 'base');
      addCentered(0.5, 0.5, 1, 'Base (001) Top', '(½, ½, 1)', '½ (Shared by 2 cells)', 'base');
    } else if (activeCentering === 'R' && activeSystem.id === 'trigonal' && trigonalSetting === 'hexagonal_obverse') {
      addCentered(2 / 3, 1 / 3, 1 / 3, 'Obverse R1', '(⅔, ⅓, ⅓)', '1.00 (Internal to triple hex cell)', 'rhombo');
      addCentered(1 / 3, 2 / 3, 2 / 3, 'Obverse R2', '(⅓, ⅔, ⅔)', '1.00 (Internal to triple hex cell)', 'rhombo');
    }

    // Struts
    interface StrutLine {
      p1: { px: number; py: number; depth: number };
      p2: { px: number; py: number; depth: number };
      color: string;
      width: number;
      avgDepth: number;
    }
    const struts: StrutLine[] = [];

    if (activeCentering === 'I' && centeredPoints.length > 0) {
      const bc = centeredPoints[0];
      corners.forEach(cPt => {
        struts.push({
          p1: cPt,
          p2: bc,
          color: '#ef4444',
          width: 2.2,
          avgDepth: (cPt.depth + bc.depth) / 2
        });
      });
    } else if (activeCentering === 'F' && centeredPoints.length >= 6) {
      [0, 1, 2, 3].forEach(idx => {
        struts.push({
          p1: corners[idx],
          p2: centeredPoints[0],
          color: '#38bdf8',
          width: 1.5,
          avgDepth: (corners[idx].depth + centeredPoints[0].depth) / 2
        });
      });
      [4, 5, 6, 7].forEach(idx => {
        struts.push({
          p1: corners[idx],
          p2: centeredPoints[1],
          color: '#38bdf8',
          width: 1.5,
          avgDepth: (corners[idx].depth + centeredPoints[1].depth) / 2
        });
      });
    } else if (activeCentering === 'R' && centeredPoints.length >= 2) {
      struts.push({
        p1: corners[0],
        p2: centeredPoints[0],
        color: '#eab308',
        width: 1.8,
        avgDepth: (corners[0].depth + centeredPoints[0].depth) / 2
      });
      struts.push({
        p1: centeredPoints[0],
        p2: centeredPoints[1],
        color: '#eab308',
        width: 1.8,
        avgDepth: (centeredPoints[0].depth + centeredPoints[1].depth) / 2
      });
      struts.push({
        p1: centeredPoints[1],
        p2: corners[6],
        color: '#eab308',
        width: 1.8,
        avgDepth: (centeredPoints[1].depth + corners[6].depth) / 2
      });
    }

    // Unified Depth-Sorted Atom List (Corners + Centered sites sorted back-to-front)
    interface RenderAtomNode {
      id: string;
      px: number;
      py: number;
      depth: number;
      label: string;
      shortLabel?: string;
      coords: string;
      cartesianStr: string;
      fraction: string;
      typeLabel: string;
      gradientId: string;
      strokeColor: string;
      radiusMult: number;
      isCorner: boolean;
    }

    const sortedAtoms: RenderAtomNode[] = [
      ...corners.map((cPt, idx) => ({
        id: `corner-${idx}`,
        px: cPt.px,
        py: cPt.py,
        depth: cPt.depth,
        label: `Vertex (${cPt.label})`,
        shortLabel: cPt.label,
        coords: `(${cPt.u}, ${cPt.v}, ${cPt.w})`,
        cartesianStr: cPt.cartesianStr,
        fraction: '⅛ (Shared by 8 adjacent unit cells)',
        typeLabel: 'Corner Lattice Site',
        gradientId: 'url(#cornerAtom3D)',
        strokeColor: '#e0e7ff',
        radiusMult: 1 + cPt.depth * 0.0008,
        isCorner: true
      })),
      ...(showCenterings
        ? centeredPoints.map((pt, idx) => ({
            id: `centered-${idx}`,
            px: pt.px,
            py: pt.py,
            depth: pt.depth,
            label: pt.label,
            coords: pt.coords,
            cartesianStr: pt.cartesianStr,
            fraction: pt.fraction,
            typeLabel: `${pt.type.toUpperCase()} Centering Site`,
            gradientId:
              pt.type === 'body'
                ? 'url(#bodyAtom3D)'
                : pt.type === 'face'
                ? 'url(#faceAtom3D)'
                : pt.type === 'base'
                ? 'url(#baseAtom3D)'
                : 'url(#rhomboAtom3D)',
            strokeColor: pt.type === 'body' ? '#ffe4e6' : pt.type === 'face' ? '#e0f2fe' : '#d1fae5',
            radiusMult: 1.12 + pt.depth * 0.0008,
            isCorner: false
          }))
        : [])
    ].sort((aAt, bAt) => aAt.depth - bAt.depth);

    // Hexagonal Prism Geometry dynamically scaled by params.a and params.c!
    const isHexPrism = activeSystem.id === 'hexagonal' && hexPrismMode && supercellMode === '1x1x1';
    let hexPrismData = null;
    if (isHexPrism) {
      const R = sa * 0.78;
      const H = sc * 0.96;
      const bRing = [];
      const tRing = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60 * Math.PI) / 180;
        bRing.push(project(R * Math.cos(ang), R * Math.sin(ang), -H / 2));
        tRing.push(project(R * Math.cos(ang), R * Math.sin(ang), H / 2));
      }
      const bCenter = project(0, 0, -H / 2);
      const tCenter = project(0, 0, H / 2);
      hexPrismData = { bRing, tRing, bCenter, tCenter };
    }

    // Crystallographic Basis Vectors from Origin Corner (0)
    const origin = corners[0];
    const aEnd = corners[1];
    const bEnd = corners[3];
    const cEnd = corners[4];

    // Interaxial angle arcs
    const createArc = (
      v1: { px: number; py: number },
      v2: { px: number; py: number },
      name: string,
      deg: number,
      color: string
    ) => {
      const frac = 0.32;
      const pA = { px: origin.px + (v1.px - origin.px) * frac, py: origin.py + (v1.py - origin.py) * frac };
      const pB = { px: origin.px + (v2.px - origin.px) * frac, py: origin.py + (v2.py - origin.py) * frac };
      const mid = {
        px: origin.px + (v1.px - origin.px + (v2.px - origin.px)) * (frac * 0.65),
        py: origin.py + (v1.py - origin.py + (v2.py - origin.py)) * (frac * 0.65)
      };
      const pathD = `M ${pA.px} ${pA.py} Q ${mid.px} ${mid.py} ${pB.px} ${pB.py}`;
      return {
        pathD,
        labelX: mid.px + (mid.px - origin.px) * 0.45,
        labelY: mid.py + (mid.py - origin.py) * 0.45,
        name,
        deg,
        color
      };
    };

    const angleArcs = [
      createArc(aEnd, bEnd, 'γ', params.gamma, '#38bdf8'),
      createArc(aEnd, cEnd, 'β', params.beta, '#a855f7'),
      createArc(bEnd, cEnd, 'α', params.alpha, '#f59e0b')
    ];

    // Miller Plane (hkl) Slicing Intercepts Polygon Stack (supports negative indices & parallel plane stacks!)
    const millerPlanePolygons: { pts: { px: number; py: number }[]; isPrimaryPlane: boolean }[] = [];
    if (showMillerPlane && (hklH !== 0 || hklK !== 0 || hklL !== 0)) {
      const edgeDefs: [number[], number[]][] = [
        [[0,0,0], [1,0,0]], [[1,0,0], [1,1,0]], [[1,1,0], [0,1,0]], [[0,1,0], [0,0,0]],
        [[0,0,1], [1,0,1]], [[1,0,1], [1,1,1]], [[1,1,1], [0,1,1]], [[0,1,1], [0,0,1]],
        [[0,0,0], [0,0,1]], [[1,0,0], [1,0,1]], [[1,1,0], [1,1,1]], [[0,1,0], [0,1,1]]
      ];

      // Determine range of plane constants C where h*u + k*v + l*w = C intersects [0,1]^3
      const cornerDotVals = fractionalVertices.map(fv => hklH * fv.u + hklK * fv.v + hklL * fv.w);
      const minDot = Math.min(...cornerDotVals);
      const maxDot = Math.max(...cornerDotVals);

      // Primary plane constant C_primary (1 if positive, or shifted if negative indices)
      const primaryC =
        (hklH < 0 ? hklH : 0) +
        (hklK < 0 ? hklK : 0) +
        (hklL < 0 ? hklL : 0) +
        1;

      const planeConstants: number[] = [];
      if (showParallelPlaneStack) {
        for (let cInt = Math.ceil(minDot); cInt <= Math.floor(maxDot); cInt++) {
          planeConstants.push(cInt);
        }
      } else {
        planeConstants.push(primaryC);
      }

      planeConstants.forEach(cVal => {
        const intersectPoints: { x: number; y: number; z: number }[] = [];
        edgeDefs.forEach(([pA, pB]) => {
          const du = pB[0] - pA[0];
          const dv = pB[1] - pA[1];
          const dw = pB[2] - pA[2];
          const denom = hklH * du + hklK * dv + hklL * dw;
          if (Math.abs(denom) > 1e-6) {
            const t = (cVal - (hklH * pA[0] + hklK * pA[1] + hklL * pA[2])) / denom;
            if (t >= -1e-4 && t <= 1 + 1e-4) {
              const u = pA[0] + t * du;
              const v = pA[1] + t * dv;
              const w = pA[2] + t * dw;
              const cart = fracToCart(u, v, w);
              // Deduplicate vertices
              if (!intersectPoints.some(ip => Math.hypot(ip.x - cart.x, ip.y - cart.y, ip.z - cart.z) < 0.5)) {
                intersectPoints.push(cart);
              }
            }
          }
        });

        if (intersectPoints.length >= 3) {
          const centroid = intersectPoints.reduce(
            (acc, pt) => ({
              x: acc.x + pt.x / intersectPoints.length,
              y: acc.y + pt.y / intersectPoints.length,
              z: acc.z + pt.z / intersectPoints.length
            }),
            { x: 0, y: 0, z: 0 }
          );

          const cProj = project(centroid.x, centroid.y, centroid.z);
          const projectedPts = intersectPoints.map(pt => project(pt.x, pt.y, pt.z));

          projectedPts.sort((p1, p2) => {
            const a1 = Math.atan2(p1.py - cProj.py, p1.px - cProj.px);
            const a2 = Math.atan2(p2.py - cProj.py, p2.px - cProj.px);
            return a1 - a2;
          });

          millerPlanePolygons.push({
            pts: projectedPts,
            isPrimaryPlane: cVal === primaryC
          });
        }
      });
    }

    // 3D Crystallographic Symmetry Axes & Operations
    interface SymmetryAxisLine {
      p1: { px: number; py: number };
      p2: { px: number; py: number };
      label: string;
      color: string;
      order: 2 | 3 | 4 | 6 | -1;
    }
    const symmetryAxes: SymmetryAxisLine[] = [];

    const addSymAxis = (
      u1: number, v1: number, w1: number,
      u2: number, v2: number, w2: number,
      label: string,
      color: string,
      order: 2 | 3 | 4 | 6 | -1
    ) => {
      const c1 = fracToCart(u1, v1, w1);
      const c2 = fracToCart(u2, v2, w2);
      symmetryAxes.push({
        p1: project(c1.x, c1.y, c1.z),
        p2: project(c2.x, c2.y, c2.z),
        label,
        color,
        order
      });
    };

    if (activeSystem.id === 'cubic') {
      addSymAxis(-0.08, -0.08, -0.08, 1.08, 1.08, 1.08, '3-fold [111]', '#f59e0b', 3);
      addSymAxis(1.08, -0.08, -0.08, -0.08, 1.08, 1.08, '3-fold [1̄11]', '#f59e0b', 3);
      addSymAxis(1.08, 1.08, -0.08, -0.08, -0.08, 1.08, '3-fold [1̄1̄1]', '#f59e0b', 3);
      addSymAxis(-0.08, 1.08, -0.08, 1.08, -0.08, 1.08, '3-fold [11̄1]', '#f59e0b', 3);
    } else if (activeSystem.id === 'tetragonal') {
      addSymAxis(0.5, 0.5, -0.15, 0.5, 0.5, 1.15, '4-fold [001]', '#f97316', 4);
    } else if (activeSystem.id === 'hexagonal') {
      addSymAxis(0.5, 0.5, -0.15, 0.5, 0.5, 1.15, '6-fold [0001]', '#10b981', 6);
    } else if (activeSystem.id === 'trigonal') {
      if (trigonalSetting === 'rhombohedral_primitive') {
        addSymAxis(-0.1, -0.1, -0.1, 1.1, 1.1, 1.1, '3-fold [111]_R', '#f43f5e', 3);
      } else {
        addSymAxis(0.5, 0.5, -0.15, 0.5, 0.5, 1.15, '3-fold [0001]_H', '#f43f5e', 3);
      }
    } else if (activeSystem.id === 'orthorhombic') {
      addSymAxis(0.5, 0.5, -0.14, 0.5, 0.5, 1.14, '2-fold [001]', '#84cc16', 2);
      addSymAxis(0.5, -0.14, 0.5, 0.5, 1.14, 0.5, '2-fold [010]', '#22c55e', 2);
      addSymAxis(-0.14, 0.5, 0.5, 1.14, 0.5, 0.5, '2-fold [100]', '#10b981', 2);
    } else if (activeSystem.id === 'monoclinic') {
      addSymAxis(0.5, -0.16, 0.5, 0.5, 1.16, 0.5, 'Unique 2-fold [010]', '#38bdf8', 2);
    } else if (activeSystem.id === 'triclinic') {
      addSymAxis(0, 0, 0, 1, 1, 1, 'Inversion 1̄ (½,½,½)', '#06b6d4', -1);
    }

    // 3D Coordination Polyhedron Facets
    const coordinationPolygons: string[] = [];
    if (showCoordinationPolyhedron) {
      if (activeCentering === 'F' && centeredPoints.length >= 6) {
        const fc = centeredPoints;
        const octFaces = [
          [1, 2, 5], [1, 5, 3], [1, 3, 4], [1, 4, 2],
          [0, 2, 5], [0, 5, 3], [0, 3, 4], [0, 4, 2]
        ];
        octFaces.forEach(tri => {
          const pts = tri.map(idx => `${fc[idx].px.toFixed(1)},${fc[idx].py.toFixed(1)}`).join(' ');
          coordinationPolygons.push(pts);
        });
      } else {
        const centerCart = fracToCart(0.5, 0.5, 0.5);
        const centerPt = project(centerCart.x, centerCart.y, centerCart.z);
        const tetIndices = [
          [0, 1, 2], [4, 5, 6], [0, 4, 5], [2, 3, 7]
        ];
        tetIndices.forEach(tri => {
          const pts = [
            `${centerPt.px.toFixed(1)},${centerPt.py.toFixed(1)}`,
            ...tri.map(i => `${corners[i].px.toFixed(1)},${corners[i].py.toFixed(1)}`)
          ].join(' ');
          coordinationPolygons.push(pts);
        });
      }
    }

    // 3D Orientation Gizmo (Bottom-Left HUD Triad)
    const gizmoOrigin = { x: 48, y: 374 };
    const gizmoLen = 26;
    const projectGizmoVec = (vx: number, vy: number, vz: number) => {
      const mag = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      const nxV = (vx / mag) * gizmoLen;
      const nyV = (vy / mag) * gizmoLen;
      const nzV = (vz / mag) * gizmoLen;
      const x1 = nxV * Math.cos(yawRad) - nyV * Math.sin(yawRad);
      const y1 = nxV * Math.sin(yawRad) + nyV * Math.cos(yawRad);
      const y2 = y1 * Math.cos(pitchRad) - nzV * Math.sin(pitchRad);
      return { x: gizmoOrigin.x + x1, y: gizmoOrigin.y - y2 };
    };
    const gizmoVectors = {
      origin: gizmoOrigin,
      a: projectGizmoVec(ax, ay, az),
      b: projectGizmoVec(bx, by, bz),
      c: projectGizmoVec(cx, cy, cz)
    };

    return {
      corners,
      edges,
      supercellEdges,
      faces,
      centeredPoints,
      sortedAtoms,
      struts,
      angleArcs,
      isHexPrism,
      hexPrismData,
      origin,
      aEnd,
      bEnd,
      cEnd,
      millerPlanePolygons,
      symmetryAxes,
      coordinationPolygons,
      gizmoVectors
    };
  }, [
    params,
    yaw,
    pitch,
    zoom,
    activeCentering,
    hexPrismMode,
    showMillerPlane,
    showParallelPlaneStack,
    hklH,
    hklK,
    hklL,
    activeSystem.id,
    showCoordinationPolyhedron,
    showCenterings,
    supercellMode,
    trigonalSetting
  ]);

  // Handle Export SVG vector graphic
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    playSynthTone('action');
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeSystem.id}_unit_cell_${activeCentering}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Dynamic Atom Radius based on style
  const effectiveAtomRadius = useMemo(() => {
    if (atomStyle === 'wireframe-node') return 4.2;
    if (atomStyle === 'space-filling') return 22;
    return atomRadiusScale;
  }, [atomStyle, atomRadiusScale]);

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      
      {/* Visualizer Top Ribbon Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {activeSystem.name} Unit Cell 3D Projection
              </h3>
              <span className="text-xs font-mono text-indigo-400 font-bold">
                · {activeCentering}-Lattice (Z = {packingTelemetry.netZ})
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {activeSystem.axialRelation} · {activeSystem.angleRelation}
            </p>
          </div>
        </div>

        {/* Centering Switcher, Supercell Tessellation & Utility Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Trigonal Setting Switcher */}
          {activeSystem.id === 'trigonal' && (
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              <button
                onClick={() => handleTrigonalSettingChange('hexagonal_obverse')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  trigonalSetting === 'hexagonal_obverse'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Hexagonal Triple Cell Obverse Setting (Z=3)"
              >
                Hex Obverse (Z=3)
              </button>
              <button
                onClick={() => handleTrigonalSettingChange('rhombohedral_primitive')}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  trigonalSetting === 'rhombohedral_primitive'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Primitive Rhombohedral Axes (Z=1, a=b=c, α=β=γ)"
              >
                Rhombohedral (Z=1)
              </button>
            </div>
          )}

          {/* Supercell Tessellation Switcher */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <span className="text-[10px] font-bold text-slate-500 px-1.5 uppercase">Tiling:</span>
            {(['1x1x1', '2x2x1', '2x2x2'] as const).map(sc => (
              <button
                key={sc}
                onClick={() => { playSynthTone('tick'); setSupercellMode(sc); }}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  supercellMode === sc
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>

          {/* Centering buttons */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-500 px-2 uppercase">Bravais:</span>
            {activeSystem.bravaisLattices.map(bl => (
              <button
                key={bl.type}
                onClick={() => { playSynthTone('tick'); setActiveCentering(bl.type); }}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  activeCentering === bl.type
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={bl.name}
              >
                {bl.type}
              </button>
            ))}
          </div>

          {/* Fullscreen & Export SVG */}
          <button
            onClick={handleExportSVG}
            title="Download SVG vector diagram"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => { playSynthTone('action'); setIsFullscreen(!isFullscreen); }}
            title={isFullscreen ? "Exit Fullscreen" : "Expand Theater View"}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid: 3D Canvas + Control Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 3D Interactive Canvas Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div 
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className="relative bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-4 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none min-h-[460px] flex flex-col justify-between"
          >
            {/* Subtle background radial grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

            {/* Floating Top HUD: Camera Presets & Turntable */}
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 pointer-events-auto">
              {/* Presets */}
              <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-800/80 text-[11px] font-mono">
                <button
                  onClick={() => setCameraPreset('iso')}
                  className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white font-bold transition-all"
                  title="Isometric (28°, 22°)"
                >
                  Isometric
                </button>
                <button
                  onClick={() => setCameraPreset('top')}
                  className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white font-bold transition-all"
                  title="Top View [001]"
                >
                  [001]
                </button>
                <button
                  onClick={() => setCameraPreset('front')}
                  className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white font-bold transition-all"
                  title="Front View [010]"
                >
                  [010]
                </button>
                <button
                  onClick={() => setCameraPreset('side')}
                  className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white font-bold transition-all"
                  title="Side View [100]"
                >
                  [100]
                </button>
                <button
                  onClick={() => setCameraPreset('diagonal')}
                  className="px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white font-bold transition-all"
                  title="Body Diagonal [111]"
                >
                  [111]
                </button>
              </div>

              {/* Turntable & Zoom Actions */}
              <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-800/80">
                <button
                  onClick={() => { playSynthTone('tick'); setIsAutoRotating(!isAutoRotating); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                    isAutoRotating
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 animate-pulse'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Toggle Turntable Rotation"
                >
                  {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Spin</span>
                </button>

                <div className="w-[1px] h-4 bg-slate-800 mx-1" />

                <button
                  onClick={() => { playSynthTone('tick'); setShowSymmetryAxes(!showSymmetryAxes); }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    showSymmetryAxes
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Toggle 3D Crystallographic Symmetry Axes"
                >
                  Symmetry
                </button>

                <button
                  onClick={() => { playSynthTone('tick'); setShowCoordinationPolyhedron(!showCoordinationPolyhedron); }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    showCoordinationPolyhedron
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Toggle 3D Coordination Polyhedron Cage"
                >
                  Polyhedron
                </button>

                <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

                <button
                  onClick={() => setZoom(prev => Math.min(2.5, prev + 0.15))}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(prev => Math.max(0.5, prev - 0.15))}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetCamera}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Reset Camera & Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive SVG Projection */}
            <div className="relative flex-1 flex items-center justify-center my-2">
              <svg 
                ref={svgRef}
                viewBox="0 0 520 420" 
                className="w-full h-84 max-w-lg mx-auto filter drop-shadow-2xl overflow-visible pointer-events-none"
              >
                <defs>
                  <radialGradient id="cornerAtom3D" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#c7d2fe" />
                    <stop offset="35%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#312e81" />
                  </radialGradient>
                  <radialGradient id="bodyAtom3D" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#fecdd3" />
                    <stop offset="35%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#881337" />
                  </radialGradient>
                  <radialGradient id="faceAtom3D" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#bae6fd" />
                    <stop offset="35%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#082f49" />
                  </radialGradient>
                  <radialGradient id="baseAtom3D" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#a7f3d0" />
                    <stop offset="35%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#064e3b" />
                  </radialGradient>
                  <radialGradient id="rhomboAtom3D" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="35%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#713f12" />
                  </radialGradient>
                </defs>

                {/* Hexagonal Prism (Dynamically scaled by a & c with highlighted Primitive Rhombic Cell) */}
                {projection.isHexPrism && projection.hexPrismData ? (
                  <g>
                    {/* Highlighted Primitive Rhombic Sub-Cell (1/3 of Hexagonal Prism) */}
                    <polygon
                      points={[
                        projection.hexPrismData.bCenter,
                        projection.hexPrismData.bRing[0],
                        projection.hexPrismData.bRing[1],
                        projection.hexPrismData.bRing[2]
                      ].map(p => `${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')}
                      fill="rgba(16, 185, 129, 0.16)"
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points={[
                        projection.hexPrismData.tCenter,
                        projection.hexPrismData.tRing[0],
                        projection.hexPrismData.tRing[1],
                        projection.hexPrismData.tRing[2]
                      ].map(p => `${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')}
                      fill="rgba(16, 185, 129, 0.16)"
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />

                    {/* Bottom & top ring lines */}
                    {projection.hexPrismData.bRing.map((p, i, arr) => (
                      <line
                        key={`h-bot-${i}`}
                        x1={p.px}
                        y1={p.py}
                        x2={arr[(i + 1) % 6].px}
                        y2={arr[(i + 1) % 6].py}
                        stroke="#38bdf8"
                        strokeWidth="1.8"
                      />
                    ))}
                    {projection.hexPrismData.tRing.map((p, i, arr) => (
                      <line
                        key={`h-top-${i}`}
                        x1={p.px}
                        y1={p.py}
                        x2={arr[(i + 1) % 6].px}
                        y2={arr[(i + 1) % 6].py}
                        stroke="#38bdf8"
                        strokeWidth="1.8"
                      />
                    ))}
                    {projection.hexPrismData.bRing.map((bp, i) => (
                      <line
                        key={`h-pil-${i}`}
                        x1={bp.px}
                        y1={bp.py}
                        x2={projection.hexPrismData!.tRing[i].px}
                        y2={projection.hexPrismData!.tRing[i].py}
                        stroke="#38bdf8"
                        strokeWidth="1.8"
                      />
                    ))}
                    {/* Internal rhombic dividers */}
                    {[0, 2, 4].map(idx => (
                      <g key={`h-div-${idx}`}>
                        <line
                          x1={projection.hexPrismData!.bCenter.px}
                          y1={projection.hexPrismData!.bCenter.py}
                          x2={projection.hexPrismData!.bRing[idx].px}
                          y2={projection.hexPrismData!.bRing[idx].py}
                          stroke="#10b981"
                          strokeWidth="1.4"
                          strokeDasharray="3 2"
                        />
                        <line
                          x1={projection.hexPrismData!.tCenter.px}
                          y1={projection.hexPrismData!.tCenter.py}
                          x2={projection.hexPrismData!.tRing[idx].px}
                          y2={projection.hexPrismData!.tRing[idx].py}
                          stroke="#10b981"
                          strokeWidth="1.4"
                          strokeDasharray="3 2"
                        />
                      </g>
                    ))}
                    {/* Central 6-fold c-axis */}
                    <line
                      x1={projection.hexPrismData.bCenter.px}
                      y1={projection.hexPrismData.bCenter.py}
                      x2={projection.hexPrismData.tCenter.px}
                      y2={projection.hexPrismData.tCenter.py}
                      stroke="#10b981"
                      strokeWidth="1.8"
                      strokeDasharray="4 3"
                    />

                    {/* Ring Atoms */}
                    {projection.hexPrismData.bRing.map((p, i) => (
                      <circle key={`at-b-${i}`} cx={p.px} cy={p.py} r={effectiveAtomRadius} fill="url(#cornerAtom3D)" stroke="#e0e7ff" strokeWidth="1.5" />
                    ))}
                    {projection.hexPrismData.tRing.map((p, i) => (
                      <circle key={`at-t-${i}`} cx={p.px} cy={p.py} r={effectiveAtomRadius} fill="url(#cornerAtom3D)" stroke="#e0e7ff" strokeWidth="1.5" />
                    ))}
                    <circle cx={projection.hexPrismData.bCenter.px} cy={projection.hexPrismData.bCenter.py} r={effectiveAtomRadius * 1.15} fill="url(#faceAtom3D)" stroke="#e0f2fe" strokeWidth="2" />
                    <circle cx={projection.hexPrismData.tCenter.px} cy={projection.hexPrismData.tCenter.py} r={effectiveAtomRadius * 1.15} fill="url(#faceAtom3D)" stroke="#e0f2fe" strokeWidth="2" />
                  </g>
                ) : (
                  <g>
                    {/* Supercell Ghost Tessellation Wireframe */}
                    {supercellMode !== '1x1x1' &&
                      projection.supercellEdges
                        .filter(se => !se.isPrimary)
                        .map((se, idx) => (
                          <line
                            key={`sc-edge-${idx}`}
                            x1={se.p1.px}
                            y1={se.p1.py}
                            x2={se.p2.px}
                            y2={se.p2.py}
                            stroke="#38bdf8"
                            strokeOpacity="0.28"
                            strokeWidth="1.1"
                            strokeDasharray="3 2"
                          />
                        ))}

                    {/* Translucent Shaded Cell Faces (Depth-Sorted Back-to-Front) */}
                    {showCellFaces && projection.faces.map((f, idx) => (
                      <polygon
                        key={`face-${idx}`}
                        points={f.pointsStr}
                        fill="#6366f1"
                        fillOpacity={f.avgDepth > 0 ? "0.08" : "0.04"}
                        stroke="none"
                      />
                    ))}

                    {/* Miller Plane (hkl) 3D Slicing Polygon Stack */}
                    {projection.millerPlanePolygons.map((poly, pIdx) => (
                      <g key={`miller-poly-${pIdx}`}>
                        <polygon
                          points={poly.pts.map(p => `${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')}
                          fill={poly.isPrimaryPlane ? '#f59e0b' : '#38bdf8'}
                          fillOpacity={poly.isPrimaryPlane ? '0.42' : '0.20'}
                          stroke={poly.isPrimaryPlane ? '#fbbf24' : '#38bdf8'}
                          strokeWidth={poly.isPrimaryPlane ? '2.2' : '1.4'}
                          strokeDasharray={poly.isPrimaryPlane ? 'none' : '4 2'}
                          strokeLinejoin="round"
                        />
                        {poly.pts.map((p, i) => (
                          <circle
                            key={`mp-${pIdx}-${i}`}
                            cx={p.px}
                            cy={p.py}
                            r={poly.isPrimaryPlane ? '3' : '2'}
                            fill={poly.isPrimaryPlane ? '#fef08a' : '#bae6fd'}
                            stroke="#0f172a"
                            strokeWidth="1"
                          />
                        ))}
                      </g>
                    ))}

                    {/* 3D Coordination Polyhedron Overlay */}
                    {showCoordinationPolyhedron && projection.coordinationPolygons.map((pts, idx) => (
                      <polygon
                        key={`coord-poly-${idx}`}
                        points={pts}
                        fill="#06b6d4"
                        fillOpacity="0.18"
                        stroke="#22d3ee"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    ))}

                    {/* 3D Crystallographic Symmetry Axes Overlay */}
                    {showSymmetryAxes && projection.symmetryAxes.map((ax, idx) => (
                      <g key={`sym-axis-${idx}`}>
                        <line
                          x1={ax.p1.px}
                          y1={ax.p1.py}
                          x2={ax.p2.px}
                          y2={ax.p2.py}
                          stroke={ax.color}
                          strokeWidth="1.8"
                          strokeDasharray="5 3"
                          opacity="0.88"
                        />
                        {ax.order === 3 && (
                          <polygon
                            points={`${ax.p2.px},${ax.p2.py - 5} ${ax.p2.px - 4.5},${ax.p2.py + 3.5} ${ax.p2.px + 4.5},${ax.p2.py + 3.5}`}
                            fill={ax.color}
                          />
                        )}
                        {ax.order === 4 && (
                          <rect
                            x={ax.p2.px - 4}
                            y={ax.p2.py - 4}
                            width="8"
                            height="8"
                            fill={ax.color}
                            transform={`rotate(45 ${ax.p2.px} ${ax.p2.py})`}
                          />
                        )}
                        {ax.order === 6 && (
                          <circle cx={ax.p2.px} cy={ax.p2.py} r="5" fill={ax.color} stroke="#ecfdf5" strokeWidth="1" />
                        )}
                        {ax.order === 2 && (
                          <ellipse cx={ax.p2.px} cy={ax.p2.py} rx="5" ry="2.6" fill={ax.color} />
                        )}
                        {ax.order === -1 && (
                          <g>
                            <circle
                              cx={(ax.p1.px + ax.p2.px) / 2}
                              cy={(ax.p1.py + ax.p2.py) / 2}
                              r="6"
                              fill="none"
                              stroke={ax.color}
                              strokeWidth="2"
                            />
                            <circle
                              cx={(ax.p1.px + ax.p2.px) / 2}
                              cy={(ax.p1.py + ax.p2.py) / 2}
                              r="2"
                              fill={ax.color}
                            />
                          </g>
                        )}
                        {idx === 0 && (
                          <text
                            x={ax.p2.px + 8}
                            y={ax.p2.py + 3}
                            fill={ax.color}
                            fontSize="9.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {ax.label}
                          </text>
                        )}
                      </g>
                    ))}

                    {/* Struts (BCC/FCC/Rhombohedral Bonds) */}
                    {showBonds && projection.struts.map((s, idx) => (
                      <line
                        key={`strut-${idx}`}
                        x1={s.p1.px}
                        y1={s.p1.py}
                        x2={s.p2.px}
                        y2={s.p2.py}
                        stroke={s.color}
                        strokeWidth={s.width}
                        strokeLinecap="round"
                        opacity={s.avgDepth > 0 ? 0.95 : 0.65}
                      />
                    ))}

                    {/* Unit Cell Wireframe Edges */}
                    {projection.edges.map((e, idx) => (
                      <line
                        key={`edge-${idx}`}
                        x1={e.p1.px}
                        y1={e.p1.py}
                        x2={e.p2.px}
                        y2={e.p2.py}
                        stroke={e.avgDepth > 0 ? '#94a3b8' : '#475569'}
                        strokeWidth={e.avgDepth > 0 ? 1.9 : 1.2}
                        strokeDasharray={e.avgDepth < -20 ? '4 3' : 'none'}
                        strokeLinecap="round"
                      />
                    ))}

                    {/* Depth-Sorted 3D Atoms (Corners + Centered Sites) */}
                    {projection.sortedAtoms.map(atom => (
                      <g
                        key={atom.id}
                        className="pointer-events-auto cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredAtom({
                            x: atom.px,
                            y: atom.py,
                            label: atom.label,
                            coords: atom.coords,
                            cartesianStr: atom.cartesianStr,
                            fraction: atom.fraction,
                            type: atom.typeLabel
                          })
                        }
                        onMouseLeave={() => setHoveredAtom(null)}
                      >
                        <circle
                          cx={atom.px}
                          cy={atom.py}
                          r={Math.max(2.5, effectiveAtomRadius * atom.radiusMult)}
                          fill={atom.gradientId}
                          stroke={atom.strokeColor}
                          strokeWidth={atom.isCorner ? '1.5' : '2'}
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.45))"
                        />
                        {showIndices && atom.shortLabel && (
                          <text
                            x={atom.px + effectiveAtomRadius + 3}
                            y={atom.py - 3}
                            fill="#94a3b8"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {atom.shortLabel}
                          </text>
                        )}
                      </g>
                    ))}
                  </g>
                )}

                {/* Interaxial Angle Arcs (α, β, γ) */}
                {showAngleArcs && !projection.isHexPrism && projection.angleArcs.map((arc, idx) => (
                  <g key={`arc-${idx}`}>
                    <path
                      d={arc.pathD}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth="1.8"
                    />
                    <text
                      x={arc.labelX}
                      y={arc.labelY}
                      fill={arc.color}
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {arc.name}={arc.deg.toFixed(1)}°
                    </text>
                  </g>
                ))}

                {/* Crystallographic Basis Vectors from Origin */}
                {showAxes && (
                  <g>
                    <line
                      x1={projection.origin.px}
                      y1={projection.origin.py}
                      x2={projection.aEnd.px}
                      y2={projection.aEnd.py}
                      stroke="#f43f5e"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <text
                      x={projection.aEnd.px + 10}
                      y={projection.aEnd.py + 4}
                      fill="#f43f5e"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      a ({params.a.toFixed(2)}Å)
                    </text>

                    <line
                      x1={projection.origin.px}
                      y1={projection.origin.py}
                      x2={projection.bEnd.px}
                      y2={projection.bEnd.py}
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <text
                      x={projection.bEnd.px + 8}
                      y={projection.bEnd.py - 6}
                      fill="#10b981"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      b ({params.b.toFixed(2)}Å)
                    </text>

                    <line
                      x1={projection.origin.px}
                      y1={projection.origin.py}
                      x2={projection.cEnd.px}
                      y2={projection.cEnd.py}
                      stroke="#06b6d4"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <text
                      x={projection.cEnd.px - 6}
                      y={projection.cEnd.py - 10}
                      fill="#06b6d4"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      c ({params.c.toFixed(2)}Å)
                    </text>
                  </g>
                )}

                {/* 3D Crystallographic Orientation Gizmo (Bottom-Left Corner Triad) */}
                <g>
                  <circle
                    cx={projection.gizmoVectors.origin.x}
                    cy={projection.gizmoVectors.origin.y}
                    r="32"
                    fill="#020617"
                    fillOpacity="0.75"
                    stroke="#1e293b"
                    strokeWidth="1.2"
                  />
                  <line
                    x1={projection.gizmoVectors.origin.x}
                    y1={projection.gizmoVectors.origin.y}
                    x2={projection.gizmoVectors.a.x}
                    y2={projection.gizmoVectors.a.y}
                    stroke="#f43f5e"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <text
                    x={projection.gizmoVectors.a.x + 3}
                    y={projection.gizmoVectors.a.y + 3}
                    fill="#f43f5e"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    a
                  </text>
                  <line
                    x1={projection.gizmoVectors.origin.x}
                    y1={projection.gizmoVectors.origin.y}
                    x2={projection.gizmoVectors.b.x}
                    y2={projection.gizmoVectors.b.y}
                    stroke="#10b981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <text
                    x={projection.gizmoVectors.b.x + 3}
                    y={projection.gizmoVectors.b.y + 3}
                    fill="#10b981"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    b
                  </text>
                  <line
                    x1={projection.gizmoVectors.origin.x}
                    y1={projection.gizmoVectors.origin.y}
                    x2={projection.gizmoVectors.c.x}
                    y2={projection.gizmoVectors.c.y}
                    stroke="#06b6d4"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <text
                    x={projection.gizmoVectors.c.x - 3}
                    y={projection.gizmoVectors.c.y - 4}
                    fill="#06b6d4"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    c
                  </text>
                  <circle
                    cx={projection.gizmoVectors.origin.x}
                    cy={projection.gizmoVectors.origin.y}
                    r="2.5"
                    fill="#e2e8f0"
                  />
                </g>
              </svg>

              {/* Hover Tooltip Overlay with Fractional + Real Cartesian Coordinates */}
              {hoveredAtom && (
                <div 
                  className="absolute z-30 pointer-events-none p-3 rounded-2xl bg-slate-950/95 border border-indigo-500/40 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1 transform -translate-x-1/2 -translate-y-full mb-3 min-w-[210px]"
                  style={{ left: hoveredAtom.x, top: hoveredAtom.y }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
                    <span className="text-white font-bold">{hoveredAtom.label}</span>
                    <span className="text-indigo-400 font-bold">{hoveredAtom.coords}</span>
                  </div>
                  <div className="text-cyan-300 text-[10px]">Cartesian: {hoveredAtom.cartesianStr}</div>
                  <div className="text-slate-400 text-[10px]">{hoveredAtom.type}</div>
                  <div className="text-emerald-400 font-bold text-[10px]">{hoveredAtom.fraction}</div>
                </div>
              )}
            </div>

            {/* Bottom Status & Drag Prompt */}
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1 text-slate-300">
                  <Rotate3d className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Drag to Orbit</span>
                </span>
                <span>·</span>
                <span>Scroll to Zoom</span>
                <span>·</span>
                <span className="text-indigo-400 font-bold">Yaw {Math.round(yaw)}° · Pitch {Math.round(pitch)}°</span>
              </div>

              {/* Quick Legend */}
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Corner (⅛)
                </span>
                {activeCentering === 'I' && (
                  <span className="flex items-center gap-1 text-rose-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Body (1)
                  </span>
                )}
                {activeCentering === 'F' && (
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Face (½)
                  </span>
                )}
                {activeCentering === 'C' && (
                  <span className="flex items-center gap-1 text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Base (½)
                  </span>
                )}
                {activeCentering === 'R' && trigonalSetting === 'hexagonal_obverse' && (
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Obverse (1)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Live Unit Cell Site Sharing & Z-Multiplicity Breakdown Strip */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[9px] text-slate-500 uppercase block">Net Lattice Points (Z)</span>
              <span className="text-sm font-bold text-emerald-400">
                Z = {packingTelemetry.netZ} pts/cell
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                8×(⅛){packingTelemetry.faceCount > 0 ? ` + ${packingTelemetry.faceCount}×(½)` : ''}
                {packingTelemetry.bodyCount > 0 ? ` + ${packingTelemetry.bodyCount}×(1)` : ''}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[9px] text-slate-500 uppercase block">Nearest Neighbor (d_NN)</span>
              <span className="text-sm font-bold text-cyan-300">
                {packingTelemetry.dNN.toFixed(3)} Å
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                R_touch = {packingTelemetry.hardSphereRadius.toFixed(3)} Å
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[9px] text-slate-500 uppercase block">Hard-Sphere APF</span>
              <span className="text-sm font-bold text-amber-300">
                {packingTelemetry.apfPercent.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Coord. Number CN = {packingTelemetry.coordNumber}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5">
              <span className="text-[9px] text-slate-500 uppercase block">Cell Volume (V_cell)</span>
              <span className="text-sm font-bold text-indigo-300">
                {cellVolume.toFixed(2)} Å³
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {(cellVolume / packingTelemetry.netZ).toFixed(2)} Å³ / lattice pt
              </span>
            </div>
          </div>
        </div>

        {/* Control Inspector Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 4-Tab Control Switcher */}
          <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => { playSynthTone('tick'); setActiveControlTab('params'); }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                activeControlTab === 'params'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Metrics</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setActiveControlTab('packing'); }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                activeControlTab === 'packing'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Density</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setActiveControlTab('layers'); }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                activeControlTab === 'layers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Layers</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setActiveControlTab('miller'); }}
              className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                activeControlTab === 'miller'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>(hkl) Slice</span>
            </button>
          </div>

          {/* TAB 1: Real-Time Lattice Parameter Morphing */}
          {activeControlTab === 'params' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Lattice Parameters
                  </span>
                  <button
                    onClick={() => {
                      playSynthTone('tick');
                      setSymmetryLocked(!symmetryLocked);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border transition-all ${
                      symmetryLocked 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                    title={symmetryLocked ? "Symmetry constraint locked to system" : "Unconstrained morphing enabled"}
                  >
                    {symmetryLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{symmetryLocked ? "Symmetry Locked" : "Free Morph"}</span>
                  </button>
                </div>

                <button
                  onClick={resetToMineralDefaults}
                  className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                  title="Reset to literature standard"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Quick Literature Prototype Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Reference Crystal Structures ({activeSystem.name.split(' ')[0]}):
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                  {(activeSystem.id === 'cubic'
                    ? [
                        { label: 'Cu (cF)', a: 3.615, b: 3.615, c: 3.615, alpha: 90, beta: 90, gamma: 90, cent: 'F' as CenteringType, mass: 63.55 },
                        { label: 'α-Fe (cI)', a: 2.866, b: 2.866, c: 2.866, alpha: 90, beta: 90, gamma: 90, cent: 'I' as CenteringType, mass: 55.85 },
                        { label: 'Si (cF)', a: 5.431, b: 5.431, c: 5.431, alpha: 90, beta: 90, gamma: 90, cent: 'F' as CenteringType, mass: 56.17 },
                        { label: 'Po (cP)', a: 3.359, b: 3.359, c: 3.359, alpha: 90, beta: 90, gamma: 90, cent: 'P' as CenteringType, mass: 208.98 }
                      ]
                    : activeSystem.id === 'hexagonal'
                    ? [
                        { label: 'Mg (hP)', a: 3.209, b: 3.209, c: 5.211, alpha: 90, beta: 90, gamma: 120, cent: 'P' as CenteringType, mass: 48.61 },
                        { label: 'α-Ti (hP)', a: 2.951, b: 2.951, c: 4.683, alpha: 90, beta: 90, gamma: 120, cent: 'P' as CenteringType, mass: 95.73 },
                        { label: 'ZnO (hP)', a: 3.250, b: 3.250, c: 5.207, alpha: 90, beta: 90, gamma: 120, cent: 'P' as CenteringType, mass: 162.76 }
                      ]
                    : activeSystem.id === 'trigonal'
                    ? [
                        { label: 'α-Quartz', a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120, cent: 'R' as CenteringType, mass: 60.08 },
                        { label: 'Corundum', a: 4.759, b: 4.759, c: 12.991, alpha: 90, beta: 90, gamma: 120, cent: 'R' as CenteringType, mass: 203.92 }
                      ]
                    : activeSystem.id === 'tetragonal'
                    ? [
                        { label: 'Rutile TiO₂ (tP)', a: 4.593, b: 4.593, c: 2.959, alpha: 90, beta: 90, gamma: 90, cent: 'P' as CenteringType, mass: 159.73 },
                        { label: 'β-Sn (tI)', a: 5.832, b: 5.832, c: 3.182, alpha: 90, beta: 90, gamma: 90, cent: 'I' as CenteringType, mass: 237.42 },
                        { label: 'BaTiO₃ (tP)', a: 3.992, b: 3.992, c: 4.036, alpha: 90, beta: 90, gamma: 90, cent: 'P' as CenteringType, mass: 233.19 }
                      ]
                    : activeSystem.id === 'orthorhombic'
                    ? [
                        { label: 'Forsterite (oP)', a: 4.75, b: 10.20, c: 5.98, alpha: 90, beta: 90, gamma: 90, cent: 'P' as CenteringType, mass: 562.77 },
                        { label: 'α-Sulfur (oF)', a: 10.46, b: 12.87, c: 24.49, alpha: 90, beta: 90, gamma: 90, cent: 'F' as CenteringType, mass: 1026.0 }
                      ]
                    : activeSystem.id === 'monoclinic'
                    ? [
                        { label: 'Orthoclase (mC)', a: 8.56, b: 12.96, c: 7.21, alpha: 90, beta: 116.0, gamma: 90, cent: 'C' as CenteringType, mass: 556.66 },
                        { label: 'm-ZrO₂ (mP)', a: 5.15, b: 5.21, c: 5.31, alpha: 90, beta: 99.2, gamma: 90, cent: 'P' as CenteringType, mass: 492.89 }
                      ]
                    : [
                        { label: 'Albite (aP)', a: 8.14, b: 12.78, c: 7.16, alpha: 94.3, beta: 116.6, gamma: 87.7, cent: 'P' as CenteringType, mass: 1048.89 },
                        { label: 'CuSO₄·5H₂O', a: 6.12, b: 10.70, c: 5.97, alpha: 82.3, beta: 107.3, gamma: 102.6, cent: 'P' as CenteringType, mass: 499.37 }
                      ]
                  ).map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        playSynthTone('tick');
                        setParams({ a: p.a, b: p.b, c: p.c, alpha: p.alpha, beta: p.beta, gamma: p.gamma });
                        setMolarMass(p.mass);
                        if (activeSystem.id === 'trigonal') setTrigonalSetting('hexagonal_obverse');
                        if (activeSystem.bravaisLattices.some(b => b.type === p.cent)) {
                          setActiveCentering(p.cent);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition-all"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Axial Lengths Sliders: a, b, c */}
              <div className="space-y-3 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> a-axis length:
                    </span>
                    <span className="font-bold text-white">{params.a.toFixed(2)} Å</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="14.0"
                    step="0.05"
                    value={params.a}
                    onChange={(e) => updateLatticeParam('a', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 accent-rose-500 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> b-axis length:
                    </span>
                    <span className="font-bold text-white">{params.b.toFixed(2)} Å</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="14.0"
                    step="0.05"
                    value={params.b}
                    onChange={(e) => updateLatticeParam('b', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 accent-emerald-500 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" /> c-axis length:
                    </span>
                    <span className="font-bold text-white">{params.c.toFixed(2)} Å</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="14.0"
                    step="0.05"
                    value={params.c}
                    onChange={(e) => updateLatticeParam('c', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 accent-cyan-500 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Interaxial Angles Sliders: alpha, beta, gamma */}
              <div className="space-y-3 text-xs font-mono pt-2 border-t border-slate-800">
                {(() => {
                  const canEditAlpha =
                    !symmetryLocked ||
                    activeSystem.id === 'triclinic' ||
                    (activeSystem.id === 'trigonal' && trigonalSetting === 'rhombohedral_primitive');
                  const canEditBeta =
                    !symmetryLocked ||
                    activeSystem.id === 'monoclinic' ||
                    activeSystem.id === 'triclinic' ||
                    (activeSystem.id === 'trigonal' && trigonalSetting === 'rhombohedral_primitive');
                  const canEditGamma =
                    !symmetryLocked ||
                    activeSystem.id === 'triclinic' ||
                    (activeSystem.id === 'trigonal' && trigonalSetting === 'rhombohedral_primitive');

                  return (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-amber-400 font-bold">Angle α (b ∧ c):</span>
                          <span className="font-bold text-white">{params.alpha.toFixed(1)}°</span>
                        </div>
                        <input
                          type="range"
                          min="45"
                          max="135"
                          step="0.5"
                          disabled={!canEditAlpha}
                          value={params.alpha}
                          onChange={(e) => updateLatticeParam('alpha', parseFloat(e.target.value))}
                          className={`w-full h-1.5 rounded-lg accent-amber-500 ${
                            !canEditAlpha ? 'opacity-40 cursor-not-allowed bg-slate-800' : 'bg-slate-800 cursor-pointer'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-purple-400 font-bold">Angle β (a ∧ c):</span>
                          <span className="font-bold text-white">{params.beta.toFixed(1)}°</span>
                        </div>
                        <input
                          type="range"
                          min="45"
                          max="140"
                          step="0.5"
                          disabled={!canEditBeta}
                          value={params.beta}
                          onChange={(e) => updateLatticeParam('beta', parseFloat(e.target.value))}
                          className={`w-full h-1.5 rounded-lg accent-purple-500 ${
                            !canEditBeta ? 'opacity-40 cursor-not-allowed bg-slate-800' : 'bg-slate-800 cursor-pointer'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-sky-400 font-bold">Angle γ (a ∧ b):</span>
                          <span className="font-bold text-white">{params.gamma.toFixed(1)}°</span>
                        </div>
                        <input
                          type="range"
                          min="45"
                          max="140"
                          step="0.5"
                          disabled={!canEditGamma}
                          value={params.gamma}
                          onChange={(e) => updateLatticeParam('gamma', parseFloat(e.target.value))}
                          className={`w-full h-1.5 rounded-lg accent-sky-500 ${
                            !canEditGamma ? 'opacity-40 cursor-not-allowed bg-slate-800' : 'bg-slate-800 cursor-pointer'
                          }`}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Direct Metric Tensor G_ij 3x3 Matrix Readout */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-indigo-400 font-bold uppercase tracking-wider">
                    Direct Metric Tensor G_ij (Å²)
                  </span>
                  <span className="text-slate-500">det(G) = V² = {(cellVolume * cellVolume).toFixed(1)}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                  {metricTensor.map((row, rIdx) =>
                    row.map((val, cIdx) => (
                      <div
                        key={`g-${rIdx}-${cIdx}`}
                        className={`py-1 px-1.5 rounded bg-slate-900 border ${
                          rIdx === cIdx
                            ? 'border-indigo-500/30 text-indigo-200 font-bold'
                            : 'border-slate-800/80 text-slate-400'
                        }`}
                      >
                        {Math.abs(val) < 0.005 ? '0.00' : val.toFixed(2)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Packing, Reciprocal Cell & Theoretical Density Calculator */}
          {activeControlTab === 'packing' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Packing, Density &amp; Reciprocal Cell</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Z = {packingTelemetry.netZ}</span>
              </div>

              {/* Site-Sharing Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold">
                  Unit Cell Site-Sharing Accounting
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>Corner Vertices (8 sites × ⅛):</span>
                    <span className="text-indigo-300 font-bold">1.00 net pt</span>
                  </div>
                  {packingTelemetry.faceCount > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Face/Base Centers ({packingTelemetry.faceCount} sites × ½):</span>
                      <span className="text-cyan-300 font-bold">{(packingTelemetry.faceCount * 0.5).toFixed(2)} net pts</span>
                    </div>
                  )}
                  {packingTelemetry.bodyCount > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Interior Body Sites ({packingTelemetry.bodyCount} site × 1):</span>
                      <span className="text-rose-300 font-bold">{packingTelemetry.bodyCount.toFixed(2)} net pts</span>
                    </div>
                  )}
                  <div className="pt-1 border-t border-slate-800 flex justify-between font-bold text-white">
                    <span>Total Lattice Multiplicity (Z):</span>
                    <span className="text-emerald-400">{packingTelemetry.netZ} points / cell</span>
                  </div>
                </div>
              </div>

              {/* Theoretical Crystal Density Calculator */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Theoretical X-Ray Density (ρ_xrd)
                  </span>
                  <span className="text-[10px] text-amber-300">ρ = (Z · M) / (N_A · V)</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] text-slate-300">Motif Molar Mass M (g/mol):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={molarMass}
                    onChange={(e) => setMolarMass(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-amber-300 font-bold outline-none"
                  />
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-slate-300">Calculated Density ρ:</span>
                  <span className="text-base font-bold text-emerald-300">
                    {packingTelemetry.densityGcm3.toFixed(3)} g/cm³
                  </span>
                </div>
              </div>

              {/* Reciprocal Lattice Parameters */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold">
                  Reciprocal Lattice Parameters (a*, b*, c*, α*, β*, γ*)
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">a* (Å⁻¹)</span>
                    <span className="text-rose-300 font-bold">{reciprocalParams.aStar.toFixed(4)}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">b* (Å⁻¹)</span>
                    <span className="text-emerald-300 font-bold">{reciprocalParams.bStar.toFixed(4)}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">c* (Å⁻¹)</span>
                    <span className="text-cyan-300 font-bold">{reciprocalParams.cStar.toFixed(4)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-purple-300 text-center">
                  <span>α* = {reciprocalParams.alphaStar.toFixed(1)}°</span>
                  <span>β* = {reciprocalParams.betaStar.toFixed(1)}°</span>
                  <span>γ* = {reciprocalParams.gammaStar.toFixed(1)}°</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Rendering Layers & Atom Representations */}
          {activeControlTab === 'layers' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
                Atom Style &amp; Visual Layers
              </span>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 block">Atom Model Presentation:</span>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  <button
                    onClick={() => { playSynthTone('tick'); setAtomStyle('ball-and-stick'); }}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      atomStyle === 'ball-and-stick'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Ball &amp; Stick
                  </button>
                  <button
                    onClick={() => { playSynthTone('tick'); setAtomStyle('wireframe-node'); }}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      atomStyle === 'wireframe-node'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Wireframe Nodes
                  </button>
                  <button
                    onClick={() => { playSynthTone('tick'); setAtomStyle('space-filling'); }}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      atomStyle === 'space-filling'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Space-Filling
                  </button>
                </div>
              </div>

              {atomStyle === 'ball-and-stick' && (
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Atom Sphere Radius:</span>
                    <span className="text-indigo-400 font-bold">{atomRadiusScale} px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="14"
                    step="0.5"
                    value={atomRadiusScale}
                    onChange={(e) => setAtomRadiusScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 accent-indigo-500 rounded-lg cursor-pointer"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showCellFaces}
                    onChange={(e) => setShowCellFaces(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                  />
                  <span>Translucent Faces</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showAxes}
                    onChange={(e) => setShowAxes(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                  />
                  <span>Basis Vectors (a,b,c)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showCenterings}
                    onChange={(e) => setShowCenterings(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                  />
                  <span>Centered Atoms (I,F,C)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showBonds}
                    onChange={(e) => setShowBonds(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-rose-500"
                  />
                  <span>Coordination Struts</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showAngleArcs}
                    onChange={(e) => setShowAngleArcs(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500"
                  />
                  <span>Angle Arcs (α,β,γ)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showIndices}
                    onChange={(e) => setShowIndices(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                  />
                  <span>Vertex Labels [uvw]</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-amber-300">
                  <input
                    type="checkbox"
                    checked={showSymmetryAxes}
                    onChange={(e) => setShowSymmetryAxes(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500"
                  />
                  <span>Symmetry Axes</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-cyan-300">
                  <input
                    type="checkbox"
                    checked={showCoordinationPolyhedron}
                    onChange={(e) => setShowCoordinationPolyhedron(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                  />
                  <span>Coord. Polyhedron</span>
                </label>
              </div>

              {activeSystem.id === 'hexagonal' && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[11px] text-sky-400 font-bold block">Hexagonal Model Type:</span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => setHexPrismMode(true)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        hexPrismMode ? 'bg-sky-600 text-white border-sky-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Full Prism (3 Rhombic Cells)
                    </button>
                    <button
                      onClick={() => setHexPrismMode(false)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        !hexPrismMode ? 'bg-sky-600 text-white border-sky-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Single Rhombic Unit Cell
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Miller Plane (hkl) 3D Slicer */}
          {activeControlTab === 'miller' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-amber-400" />
                  <span>3D Miller Plane Slicer</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowParallelPlaneStack(!showParallelPlaneStack)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                      showParallelPlaneStack
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                    title="Slice all parallel (hkl) planes intersecting the unit cell"
                  >
                    {showParallelPlaneStack ? 'Family Stack' : 'Single Plane'}
                  </button>
                  <button
                    onClick={() => {
                      playSynthTone('tick');
                      setShowMillerPlane(!showMillerPlane);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                      showMillerPlane
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {showMillerPlane ? 'Plane Active' : 'Show Plane'}
                  </button>
                </div>
              </div>

              {/* Miller Indices (h, k, l) inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Miller h</label>
                  <input
                    type="number"
                    value={hklH}
                    onChange={(e) => { setHklH(parseInt(e.target.value) || 0); setShowMillerPlane(true); }}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-sm font-mono font-bold outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Miller k</label>
                  <input
                    type="number"
                    value={hklK}
                    onChange={(e) => { setHklK(parseInt(e.target.value) || 0); setShowMillerPlane(true); }}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-sm font-mono font-bold outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Miller l</label>
                  <input
                    type="number"
                    value={hklL}
                    onChange={(e) => { setHklL(parseInt(e.target.value) || 0); setShowMillerPlane(true); }}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-sm font-mono font-bold outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Presets for Common Planes */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block">Quick Family Presets:</span>
                <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                  {[[1,0,0], [1,1,0], [1,1,1], [0,0,1], [2,0,0], [2,2,0], [1,-1,1]].map(([ph, pk, pl]) => (
                    <button
                      key={`${ph}${pk}${pl}`}
                      onClick={() => {
                        playSynthTone('tick');
                        setHklH(ph);
                        setHklK(pk);
                        setHklL(pl);
                        setShowMillerPlane(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                        hklH === ph && hklK === pk && hklL === pl && showMillerPlane
                          ? 'bg-amber-600/30 text-amber-300 border-amber-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ({ph}{pk}{pl})
                    </button>
                  ))}
                </div>
              </div>

              {/* Live d-Spacing & Diffraction Angle Output */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block uppercase">d({hklH}{hklK}{hklL})</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {dSpacingResult.d > 0 ? dSpacingResult.d.toFixed(4) : '—'} Å
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block uppercase">Bragg 2θ</span>
                  <span className="text-sm font-bold text-emerald-300">
                    {dSpacingResult.twoTheta > 0 ? dSpacingResult.twoTheta.toFixed(2) : '—'}°
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block uppercase">Q Vector</span>
                  <span className="text-sm font-bold text-amber-300">
                    {dSpacingResult.q > 0 ? dSpacingResult.q.toFixed(3) : '—'} Å⁻¹
                  </span>
                </div>
              </div>

              {/* Live Bravais Systematic Absence & Axial Intercepts Diagnostic */}
              {(() => {
                const h = hklH;
                const k = hklK;
                const l = hklL;
                const isZero = h === 0 && k === 0 && l === 0;
                let allowed = true;
                let conditionText = 'All (hkl) allowed';
                let fSqValue = '1 · f²';

                if (activeCentering === 'I') {
                  allowed = ((h + k + l) % 2 + 2) % 2 === 0;
                  conditionText = 'h + k + l = 2n';
                  fSqValue = allowed ? '4 · f²' : '0 (Destructive)';
                } else if (activeCentering === 'F') {
                  const pH = (h % 2 + 2) % 2;
                  const pK = (k % 2 + 2) % 2;
                  const pL = (l % 2 + 2) % 2;
                  allowed = pH === pK && pK === pL;
                  conditionText = 'h, k, l unmixed parity';
                  fSqValue = allowed ? '16 · f²' : '0 (Destructive)';
                } else if (activeCentering === 'C') {
                  allowed = ((h + k) % 2 + 2) % 2 === 0;
                  conditionText = 'h + k = 2n';
                  fSqValue = allowed ? '4 · f²' : '0 (Destructive)';
                } else if (activeCentering === 'R' && trigonalSetting === 'hexagonal_obverse') {
                  allowed = ((-h + k + l) % 3 + 3) % 3 === 0;
                  conditionText = '−h + k + l = 3n';
                  fSqValue = allowed ? '9 · f²' : '0 (Destructive)';
                }

                const intA = h === 0 ? '∞ (∥ a)' : `1/${h} a (${(params.a / h).toFixed(2)} Å)`;
                const intB = k === 0 ? '∞ (∥ b)' : `1/${k} b (${(params.b / k).toFixed(2)} Å)`;
                const intC = l === 0 ? '∞ (∥ c)' : `1/${l} c (${(params.c / l).toFixed(2)} Å)`;

                return (
                  <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {activeCentering}-Lattice Extinction Check
                      </span>
                      {isZero ? (
                        <span className="text-slate-400 text-[10px] font-bold">
                          (000) Origin
                        </span>
                      ) : allowed ? (
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allowed ({fSqValue})
                        </span>
                      ) : (
                        <span className="text-rose-400 text-[10px] font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Systematic Absence
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Rule: <strong className="text-indigo-300">{conditionText}</strong></span>
                      <span>h+k+l = {h + k + l}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-[10px]">
                      <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60">
                        <span className="text-rose-400 font-bold block">x-int</span>
                        <span className="text-slate-300 truncate block">{intA}</span>
                      </div>
                      <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60">
                        <span className="text-emerald-400 font-bold block">y-int</span>
                        <span className="text-slate-300 truncate block">{intB}</span>
                      </div>
                      <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60">
                        <span className="text-blue-400 font-bold block">z-int</span>
                        <span className="text-slate-300 truncate block">{intC}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Radiation source picker */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>Radiation Source:</span>
                <select
                  value={radiation.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Cu Kα') setRadiation({ name: 'Cu Kα', wavelength: 1.5406 });
                    else if (val === 'Mo Kα') setRadiation({ name: 'Mo Kα', wavelength: 0.7107 });
                    else if (val === 'Co Kα') setRadiation({ name: 'Co Kα', wavelength: 1.7890 });
                    else if (val === 'Cr Kα') setRadiation({ name: 'Cr Kα', wavelength: 2.2897 });
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 outline-none"
                >
                  <option value="Cu Kα">Cu Kα (1.5406 Å)</option>
                  <option value="Mo Kα">Mo Kα (0.7107 Å)</option>
                  <option value="Co Kα">Co Kα (1.7890 Å)</option>
                  <option value="Cr Kα">Cr Kα (2.2897 Å)</option>
                </select>
              </div>
            </div>
          )}

          {/* Active System Essential Symmetry Banner */}
          <div className="p-4 rounded-3xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200/90 leading-relaxed space-y-1.5 shadow-md">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block font-mono flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Essential Crystallographic Symmetry</span>
            </span>
            <p className="font-medium text-slate-300">{activeSystem.essentialSymmetry}</p>
            <div className="flex items-center justify-between text-[11px] font-mono text-indigo-300 pt-1">
              <span>{activeSystem.spaceGroupsCount} Space Groups</span>
              <span>{activeSystem.symmetryOrder}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
