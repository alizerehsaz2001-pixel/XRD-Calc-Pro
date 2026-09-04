import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Eye, 
  EyeOff, 
  Sliders, 
  Layers, 
  Download, 
  Sparkles, 
  Compass, 
  Calculator, 
  Grid, 
  Check, 
  Atom, 
  RefreshCw,
  Lock,
  Unlock,
  ChevronDown,
  Info
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';
import { 
  CrystalSystemId, 
  CenteringType, 
  CRYSTAL_SYSTEMS_CATALOG, 
  CrystalSystemData 
} from './UnitCellsSection';

interface Interactive3DGeometryVisualizerProps {
  selectedSystemId: CrystalSystemId;
  onSelectSystem: (id: CrystalSystemId) => void;
  activeCentering: CenteringType;
  setActiveCentering: (c: CenteringType) => void;
}

export type AtomStyle = 'ball-and-stick' | 'wireframe-node' | 'space-filling';

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
  fraction: string;
  type: string;
}

export const Interactive3DGeometryVisualizer: React.FC<Interactive3DGeometryVisualizerProps> = ({
  selectedSystemId,
  onSelectSystem,
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
  }, [activeSystem]);

  // Visual Display Layer Toggles
  const [atomStyle, setAtomStyle] = useState<AtomStyle>('ball-and-stick');
  const [atomRadiusScale, setAtomRadiusScale] = useState<number>(7);
  const [showCellFaces, setShowCellFaces] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showIndices, setShowIndices] = useState<boolean>(true);
  const [showCenterings, setShowCenterings] = useState<boolean>(true);
  const [showBonds, setShowBonds] = useState<boolean>(true);
  const [showAngleArcs, setShowAngleArcs] = useState<boolean>(true);
  const [hexPrismMode, setHexPrismMode] = useState<boolean>(true);

  // Miller Plane (hkl) Slicing Overlay
  const [showMillerPlane, setShowMillerPlane] = useState<boolean>(false);
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
  const [activeControlTab, setActiveControlTab] = useState<'params' | 'camera' | 'layers' | 'miller'>('params');

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
  };

  // Parameter slider change handler with symmetry constraints
  const updateLatticeParam = (key: keyof CustomLatticeParams, val: number) => {
    setParams(prev => {
      const next = { ...prev, [key]: val };
      if (!symmetryLocked) return next;

      // Apply system constraints if locked
      if (activeSystem.id === 'cubic') {
        if (key === 'a' || key === 'b' || key === 'c') {
          next.a = val;
          next.b = val;
          next.c = val;
        }
      } else if (activeSystem.id === 'tetragonal') {
        if (key === 'a' || key === 'b') {
          next.a = val;
          next.b = val;
        }
      } else if (activeSystem.id === 'hexagonal') {
        if (key === 'a' || key === 'b') {
          next.a = val;
          next.b = val;
        }
      } else if (activeSystem.id === 'trigonal') {
        if (key === 'a' || key === 'b' || key === 'c') {
          next.a = val;
          next.b = val;
          next.c = val;
        }
        if (key === 'alpha' || key === 'beta' || key === 'gamma') {
          next.alpha = val;
          next.beta = val;
          next.gamma = val;
        }
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

    const term = 1 - Math.pow(Math.cos(aR), 2) - Math.pow(Math.cos(bR), 2) - Math.pow(Math.cos(gR), 2) + 
      2 * Math.cos(aR) * Math.cos(bR) * Math.cos(gR);
    return Math.max(0, a * b * c * Math.sqrt(Math.max(0, term)));
  }, [params]);

  // Reciprocal Lattice Parameters: a*, b*, c*
  const reciprocalParams = useMemo(() => {
    const { a, b, c, alpha, beta, gamma } = params;
    const V = cellVolume;
    if (V <= 0) return { aStar: 0, bStar: 0, cStar: 0 };
    const toRad = Math.PI / 180;
    const aR = alpha * toRad;
    const bR = beta * toRad;
    const gR = gamma * toRad;

    const aStar = (b * c * Math.sin(aR)) / V;
    const bStar = (a * c * Math.sin(bR)) / V;
    const cStar = (a * b * Math.sin(gR)) / V;
    return { aStar, bStar, cStar };
  }, [params, cellVolume]);

  // Live d-spacing and Bragg 2θ calculation
  const dSpacingResult = useMemo(() => {
    const { a, b, c, alpha, beta, gamma } = params;
    const h = hklH;
    const k = hklK;
    const l = hklL;
    if (h === 0 && k === 0 && l === 0) return { d: 0, twoTheta: 0, q: 0 };

    const toRad = Math.PI / 180;
    const aR = alpha * toRad;
    const bR = beta * toRad;
    const gR = gamma * toRad;

    let invD2 = 0;

    switch (activeSystem.id) {
      case 'cubic':
        invD2 = (h * h + k * k + l * l) / (a * a);
        break;
      case 'tetragonal':
        invD2 = (h * h + k * k) / (a * a) + (l * l) / (c * c);
        break;
      case 'orthorhombic':
        invD2 = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
        break;
      case 'hexagonal':
        invD2 = (4 / 3) * ((h * h + h * k + k * k) / (a * a)) + (l * l) / (c * c);
        break;
      case 'monoclinic': {
        const sB = Math.sin(bR);
        const cB = Math.cos(bR);
        invD2 = (1 / (sB * sB)) * ((h * h) / (a * a) + (k * k * sB * sB) / (b * b) + (l * l) / (c * c) - (2 * h * l * cB) / (a * c));
        break;
      }
      default: {
        const V = cellVolume;
        if (V <= 0) return { d: 0, twoTheta: 0, q: 0 };
        const S11 = b * b * c * c * Math.sin(aR) * Math.sin(aR);
        const S22 = a * a * c * c * Math.sin(bR) * Math.sin(bR);
        const S33 = a * a * b * b * Math.sin(gR) * Math.sin(gR);
        const S12 = a * b * c * c * (Math.cos(aR) * Math.cos(bR) - Math.cos(gR));
        const S23 = a * a * b * c * (Math.cos(bR) * Math.cos(gR) - Math.cos(aR));
        const S13 = a * b * b * c * (Math.cos(gR) * Math.cos(aR) - Math.cos(bR));
        invD2 = (1 / (V * V)) * (S11 * h * h + S22 * k * k + S33 * l * l + 2 * S12 * h * k + 2 * S23 * k * l + 2 * S13 * h * l);
        break;
      }
    }

    if (invD2 <= 0) return { d: 0, twoTheta: 0, q: 0 };
    const d = 1 / Math.sqrt(invD2);
    const q = (2 * Math.PI) / d;
    const sinTheta = radiation.wavelength / (2 * d);
    const twoTheta = sinTheta <= 1 ? (2 * Math.asin(sinTheta) * 180) / Math.PI : 0;

    return { d, twoTheta, q };
  }, [params, hklH, hklK, hklL, radiation, activeSystem.id, cellVolume]);

  // 3D Geometric Projection Engine
  const projection = useMemo(() => {
    const { a, b, c, alpha, beta, gamma } = params;
    const toRad = Math.PI / 180;
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;

    // Normalizing scale
    const maxDim = Math.max(a, b, c);
    const baseVisualSize = 135;
    const sa = (a / maxDim) * baseVisualSize * zoom;
    const sb = (b / maxDim) * baseVisualSize * zoom;
    const sc = (c / maxDim) * baseVisualSize * zoom;

    // Crystallographic Cartesian basis vectors
    const ax = sa;
    const ay = 0;
    const az = 0;

    const bx = sb * Math.cos(gamma * toRad);
    const by = sb * Math.sin(gamma * toRad);
    const bz = 0;

    const cx = sc * Math.cos(beta * toRad);
    const cy = sc * (Math.cos(alpha * toRad) - Math.cos(beta * toRad) * Math.cos(gamma * toRad)) / Math.sin(gamma * toRad || 0.001);
    const czTerm = sc * sc - cx * cx - cy * cy;
    const cz = Math.sqrt(Math.max(0, czTerm));

    // Screen Center
    const cxScreen = 260;
    const cyScreen = 210;

    // 3D rotation and projection with depth
    const project = (x: number, y: number, z: number) => {
      // Rotate around Z (yaw)
      const x1 = x * Math.cos(yawRad) - y * Math.sin(yawRad);
      const y1 = x * Math.sin(yawRad) + y * Math.cos(yawRad);
      const z1 = z;

      // Rotate around X (pitch)
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

    // Center offset so cell is centered at origin
    const ox = (ax + bx + cx) / 2;
    const oy = (ay + by + cy) / 2;
    const oz = (az + bz + cz) / 2;

    const fracToCart = (u: number, v: number, w: number) => {
      return {
        x: u * ax + v * bx + w * cx - ox,
        y: u * ay + v * by + w * cy - oy,
        z: u * az + v * bz + w * cz - oz
      };
    };

    // 8 vertices in fractional coordinates
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
      const c = fracToCart(fv.u, fv.v, fv.w);
      const p = project(c.x, c.y, c.z);
      return { ...p, u: fv.u, v: fv.v, w: fv.w, label: fv.label };
    });

    // 12 wireframe edges
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
    ].map(e => {
      const p1 = corners[e.i];
      const p2 = corners[e.j];
      const avgDepth = (p1.depth + p2.depth) / 2;
      return { ...e, p1, p2, avgDepth };
    });

    // 6 Faces for translucent polygon shading
    const faces = [
      { indices: [0, 1, 2, 3], name: 'Bottom (001)' },
      { indices: [4, 5, 6, 7], name: 'Top (001)' },
      { indices: [0, 1, 5, 4], name: 'Front (010)' },
      { indices: [2, 3, 7, 6], name: 'Back (010)' },
      { indices: [1, 2, 6, 5], name: 'Right (100)' },
      { indices: [0, 3, 7, 4], name: 'Left (100)' }
    ].map(f => {
      const pts = f.indices.map(idx => corners[idx]);
      const avgDepth = pts.reduce((sum, pt) => sum + pt.depth, 0) / pts.length;
      const pointsStr = pts.map(p => `${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ');
      return { ...f, pts, avgDepth, pointsStr };
    });

    // Centered Atoms
    interface CenteredPoint {
      px: number;
      py: number;
      depth: number;
      label: string;
      coords: string;
      fraction: string;
      type: 'body' | 'face' | 'base' | 'rhombo';
    }
    const centeredPoints: CenteredPoint[] = [];

    const addCentered = (u: number, v: number, w: number, label: string, coords: string, fraction: string, type: CenteredPoint['type']) => {
      const c = fracToCart(u, v, w);
      const p = project(c.x, c.y, c.z);
      centeredPoints.push({
        px: p.px,
        py: p.py,
        depth: p.depth,
        label,
        coords,
        fraction,
        type
      });
    };

    if (activeCentering === 'I') {
      addCentered(0.5, 0.5, 0.5, 'Body-Center', '(½, ½, ½)', '1 (Exclusively internal)', 'body');
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
    } else if (activeCentering === 'R' && activeSystem.id === 'trigonal') {
      addCentered(2 / 3, 1 / 3, 1 / 3, 'Trigonal R1', '(⅔, ⅓, ⅓)', '1', 'rhombo');
      addCentered(1 / 3, 2 / 3, 2 / 3, 'Trigonal R2', '(⅓, ⅔, ⅔)', '1', 'rhombo');
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
      corners.forEach(c => {
        struts.push({
          p1: c,
          p2: bc,
          color: '#ef4444',
          width: 2.2,
          avgDepth: (c.depth + bc.depth) / 2
        });
      });
    } else if (activeCentering === 'F' && centeredPoints.length >= 6) {
      // Connect face centers to face corners for diagonal bonds
      // Bottom face center (index 0)
      [0, 1, 2, 3].forEach(idx => {
        struts.push({
          p1: corners[idx],
          p2: centeredPoints[0],
          color: '#38bdf8',
          width: 1.5,
          avgDepth: (corners[idx].depth + centeredPoints[0].depth) / 2
        });
      });
      // Top face center (index 1)
      [4, 5, 6, 7].forEach(idx => {
        struts.push({
          p1: corners[idx],
          p2: centeredPoints[1],
          color: '#38bdf8',
          width: 1.5,
          avgDepth: (corners[idx].depth + centeredPoints[1].depth) / 2
        });
      });
    }

    // Hexagonal Prism Geometry
    const isHexPrism = activeSystem.id === 'hexagonal' && hexPrismMode;
    let hexPrismData = null;
    if (isHexPrism) {
      const R = 85 * zoom;
      const H = 135 * zoom;
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
        px: origin.px + ((v1.px - origin.px) + (v2.px - origin.px)) * (frac * 0.65),
        py: origin.py + ((v1.py - origin.py) + (v2.py - origin.py)) * (frac * 0.65)
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

    // Miller Plane (hkl) Slicing Intercepts Polygon
    let millerPlanePolygon: { px: number; py: number }[] | null = null;
    if (showMillerPlane && (hklH !== 0 || hklK !== 0 || hklL !== 0)) {
      // Find intersections with the 12 unit cell edges [u, v, w] in [0, 1]
      // Plane equation: h*u + k*v + l*w = 1
      const edgeDefs: [number[], number[]][] = [
        [[0,0,0], [1,0,0]], [[1,0,0], [1,1,0]], [[1,1,0], [0,1,0]], [[0,1,0], [0,0,0]],
        [[0,0,1], [1,0,1]], [[1,0,1], [1,1,1]], [[1,1,1], [0,1,1]], [[0,1,1], [0,0,1]],
        [[0,0,0], [0,0,1]], [[1,0,0], [1,0,1]], [[1,1,0], [1,1,1]], [[0,1,0], [0,1,1]]
      ];

      const intersectPoints: { x: number; y: number; z: number }[] = [];
      edgeDefs.forEach(([pA, pB]) => {
        const du = pB[0] - pA[0];
        const dv = pB[1] - pA[1];
        const dw = pB[2] - pA[2];
        const denom = hklH * du + hklK * dv + hklL * dw;
        if (Math.abs(denom) > 1e-6) {
          const t = (1 - (hklH * pA[0] + hklK * pA[1] + hklL * pA[2])) / denom;
          if (t >= -1e-4 && t <= 1 + 1e-4) {
            const u = pA[0] + t * du;
            const v = pA[1] + t * dv;
            const w = pA[2] + t * dw;
            intersectPoints.push(fracToCart(u, v, w));
          }
        }
      });

      if (intersectPoints.length >= 3) {
        // Sort intersection points radially around centroid
        const centroid = intersectPoints.reduce(
          (acc, pt) => ({ x: acc.x + pt.x / intersectPoints.length, y: acc.y + pt.y / intersectPoints.length, z: acc.z + pt.z / intersectPoints.length }),
          { x: 0, y: 0, z: 0 }
        );

        // Project centroid to screen
        const cProj = project(centroid.x, centroid.y, centroid.z);
        const projectedPts = intersectPoints.map(pt => project(pt.x, pt.y, pt.z));

        // Sort by angle around 2D screen centroid
        projectedPts.sort((p1, p2) => {
          const a1 = Math.atan2(p1.py - cProj.py, p1.px - cProj.px);
          const a2 = Math.atan2(p2.py - cProj.py, p2.px - cProj.px);
          return a1 - a2;
        });

        millerPlanePolygon = projectedPts;
      }
    }

    return {
      corners,
      edges,
      faces,
      centeredPoints,
      struts,
      angleArcs,
      isHexPrism,
      hexPrismData,
      origin,
      aEnd,
      bEnd,
      cEnd,
      millerPlanePolygon
    };
  }, [params, yaw, pitch, zoom, activeCentering, hexPrismMode, showMillerPlane, hklH, hklK, hklL, activeSystem.id]);

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
    if (atomStyle === 'wireframe-node') return 4;
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
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {activeSystem.name} Unit Cell 3D Projection
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {activeCentering}-Lattice
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {activeSystem.axialRelation} • {activeSystem.angleRelation}
            </p>
          </div>
        </div>

        {/* Centering Switcher & Utility Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Centering buttons */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-500 px-2 uppercase">Lattice:</span>
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
                  {/* High-definition 3D spherical gradients with specular highlights */}
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

                  {/* Marker Arrows for Basis Vectors */}
                  <marker id="arrowA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f43f5e" />
                  </marker>
                  <marker id="arrowB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
                  </marker>
                  <marker id="arrowC" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#06b6d4" />
                  </marker>
                </defs>

                {/* Hexagonal Prism (Image 2 & 3 reproduction) */}
                {projection.isHexPrism && projection.hexPrismData ? (
                  <g>
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
                          stroke="#0284c7"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <line
                          x1={projection.hexPrismData!.tCenter.px}
                          y1={projection.hexPrismData!.tCenter.py}
                          x2={projection.hexPrismData!.tRing[idx].px}
                          y2={projection.hexPrismData!.tRing[idx].py}
                          stroke="#0284c7"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                      </g>
                    ))}
                    {/* Central c-axis */}
                    <line
                      x1={projection.hexPrismData.bCenter.px}
                      y1={projection.hexPrismData.bCenter.py}
                      x2={projection.hexPrismData.tCenter.px}
                      y2={projection.hexPrismData.tCenter.py}
                      stroke="#0ea5e9"
                      strokeWidth="1.5"
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
                    {/* Translucent Shaded Cell Faces (Ordered by Depth) */}
                    {showCellFaces && projection.faces.map((f, idx) => (
                      <polygon
                        key={`face-${idx}`}
                        points={f.pointsStr}
                        fill="#6366f1"
                        fillOpacity={f.avgDepth > 0 ? "0.08" : "0.04"}
                        stroke="none"
                      />
                    ))}

                    {/* Miller Plane (hkl) 3D Slicing Polygon */}
                    {projection.millerPlanePolygon && (
                      <g>
                        <polygon
                          points={projection.millerPlanePolygon.map(p => `${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')}
                          fill="#f59e0b"
                          fillOpacity="0.45"
                          stroke="#fbbf24"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        {projection.millerPlanePolygon.map((p, i) => (
                          <circle key={`mp-${i}`} cx={p.px} cy={p.py} r="3" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
                        ))}
                      </g>
                    )}

                    {/* Struts (BCC/FCC Bonds) */}
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

                    {/* 8 Corner Atoms */}
                    {projection.corners.map((c, idx) => (
                      <g 
                        key={`corner-${idx}`}
                        className="pointer-events-auto cursor-pointer"
                        onMouseEnter={() => setHoveredAtom({
                          x: c.px,
                          y: c.py,
                          label: `Vertex #${idx}`,
                          coords: `(${c.u}, ${c.v}, ${c.w})`,
                          fraction: '⅛ (Shared by 8 adjacent unit cells)',
                          type: 'Corner Vertex Atom'
                        })}
                        onMouseLeave={() => setHoveredAtom(null)}
                      >
                        <circle
                          cx={c.px}
                          cy={c.py}
                          r={effectiveAtomRadius}
                          fill="url(#cornerAtom3D)"
                          stroke="#e0e7ff"
                          strokeWidth="1.5"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                        />
                        {showIndices && (
                          <text
                            x={c.px + effectiveAtomRadius + 3}
                            y={c.py - 3}
                            fill="#94a3b8"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {c.label}
                          </text>
                        )}
                      </g>
                    ))}

                    {/* Centered Atoms (I, F, C, R) */}
                    {showCenterings && projection.centeredPoints.map((pt, idx) => {
                      const grad = pt.type === 'body' 
                        ? 'url(#bodyAtom3D)' 
                        : pt.type === 'face' 
                        ? 'url(#faceAtom3D)' 
                        : pt.type === 'base'
                        ? 'url(#baseAtom3D)'
                        : 'url(#rhomboAtom3D)';

                      const strokeColor = pt.type === 'body' ? '#ffe4e6' : pt.type === 'face' ? '#e0f2fe' : '#d1fae5';

                      return (
                        <g 
                          key={`centered-${idx}`}
                          className="pointer-events-auto cursor-pointer"
                          onMouseEnter={() => setHoveredAtom({
                            x: pt.px,
                            y: pt.py,
                            label: pt.label,
                            coords: pt.coords,
                            fraction: pt.fraction,
                            type: `${pt.type.toUpperCase()} Centering Atom`
                          })}
                          onMouseLeave={() => setHoveredAtom(null)}
                        >
                          <circle
                            cx={pt.px}
                            cy={pt.py}
                            r={effectiveAtomRadius * 1.1}
                            fill={grad}
                            stroke={strokeColor}
                            strokeWidth="2"
                            filter="drop-shadow(0 3px 6px rgba(0,0,0,0.5))"
                          />
                        </g>
                      );
                    })}
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
                    {/* a-vector (Red) */}
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
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      a ({params.a.toFixed(2)}Å)
                    </text>

                    {/* b-vector (Emerald) */}
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
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      b ({params.b.toFixed(2)}Å)
                    </text>

                    {/* c-vector (Cyan) */}
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
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      c ({params.c.toFixed(2)}Å)
                    </text>
                  </g>
                )}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredAtom && (
                <div 
                  className="absolute z-30 pointer-events-none p-3 rounded-2xl bg-slate-950/95 border border-indigo-500/40 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1 transform -translate-x-1/2 -translate-y-full mb-3"
                  style={{ left: hoveredAtom.x, top: hoveredAtom.y }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
                    <span className="text-white font-bold">{hoveredAtom.label}</span>
                    <span className="text-indigo-400 font-bold">{hoveredAtom.coords}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">{hoveredAtom.type}</div>
                  <div className="text-emerald-400 font-bold text-[10px]">{hoveredAtom.fraction}</div>
                </div>
              )}
            </div>

            {/* Bottom Status & Drag Prompt */}
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-300">
                  <Rotate3d className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Click + Drag to Orbit</span>
                </span>
                <span>•</span>
                <span>Scroll to Zoom</span>
                <span>•</span>
                <span className="text-indigo-400 font-bold">Yaw: {Math.round(yaw)}°, Pitch: {Math.round(pitch)}°</span>
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
                {showMillerPlane && (
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> ({hklH}{hklK}{hklL}) Plane
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Control Inspector Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Tabs for Controls */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => { playSynthTone('tick'); setActiveControlTab('params'); }}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeControlTab === 'params'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Dimensions</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setActiveControlTab('layers'); }}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeControlTab === 'layers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rendering</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setActiveControlTab('miller'); }}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeControlTab === 'miller'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>(hkl) Slicer</span>
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

              {/* Axial Lengths Sliders: a, b, c */}
              <div className="space-y-3 text-xs font-mono">
                {/* a slider */}
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

                {/* b slider */}
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

                {/* c slider */}
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
                {/* alpha */}
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
                    disabled={symmetryLocked && activeSystem.id !== 'triclinic'}
                    value={params.alpha}
                    onChange={(e) => updateLatticeParam('alpha', parseFloat(e.target.value))}
                    className={`w-full h-1.5 rounded-lg accent-amber-500 ${
                      symmetryLocked && activeSystem.id !== 'triclinic' ? 'opacity-40 cursor-not-allowed bg-slate-800' : 'bg-slate-800 cursor-pointer'
                    }`}
                  />
                </div>

                {/* beta */}
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
                    disabled={symmetryLocked && activeSystem.id !== 'monoclinic' && activeSystem.id !== 'triclinic'}
                    value={params.beta}
                    onChange={(e) => updateLatticeParam('beta', parseFloat(e.target.value))}
                    className={`w-full h-1.5 rounded-lg accent-purple-500 ${
                      symmetryLocked && activeSystem.id !== 'monoclinic' && activeSystem.id !== 'triclinic'
                        ? 'opacity-40 cursor-not-allowed bg-slate-800' 
                        : 'bg-slate-800 cursor-pointer'
                    }`}
                  />
                </div>

                {/* gamma */}
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
                    disabled={symmetryLocked && activeSystem.id !== 'triclinic'}
                    value={params.gamma}
                    onChange={(e) => updateLatticeParam('gamma', parseFloat(e.target.value))}
                    className={`w-full h-1.5 rounded-lg accent-sky-500 ${
                      symmetryLocked && activeSystem.id !== 'triclinic' ? 'opacity-40 cursor-not-allowed bg-slate-800' : 'bg-slate-800 cursor-pointer'
                    }`}
                  />
                </div>
              </div>

              {/* Real-Time Mathematical Volume & Reciprocal Lattice Box */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Cell Volume (V)</span>
                  <span className="text-base font-bold text-amber-300">{cellVolume.toFixed(2)} Å³</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5 truncate">{activeSystem.volumeFormula}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Reciprocal a*, b*, c*</span>
                  <span className="text-xs font-bold text-indigo-300 block truncate">
                    a*={reciprocalParams.aStar.toFixed(3)} Å⁻¹
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    c*={reciprocalParams.cStar.toFixed(3)} Å⁻¹
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Rendering Layers & Atom Representations */}
          {activeControlTab === 'layers' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
                Atom Style & Visual Layers
              </span>

              {/* Atom Representation Buttons */}
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
                    Ball & Stick
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

              {/* Radius slider if ball-and-stick */}
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
                    value={atomRadiusScale}
                    onChange={(e) => setAtomRadiusScale(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 accent-indigo-500 rounded-lg cursor-pointer"
                  />
                </div>
              )}

              {/* Checkbox Layer Toggles */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showCellFaces}
                    onChange={(e) => setShowCellFaces(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                  />
                  <span>Translucent Faces</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showAxes}
                    onChange={(e) => setShowAxes(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                  />
                  <span>Basis Vectors (a,b,c)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showCenterings}
                    onChange={(e) => setShowCenterings(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                  />
                  <span>Centered Atoms (I,F,C)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showBonds}
                    onChange={(e) => setShowBonds(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
                  />
                  <span>Coordination Struts</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showAngleArcs}
                    onChange={(e) => setShowAngleArcs(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Angle Arcs (α,β,γ)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showIndices}
                    onChange={(e) => setShowIndices(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                  />
                  <span>Vertex Labels [uvw]</span>
                </label>
              </div>

              {/* Hexagonal prism mode toggle */}
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
                      Full Prism (3 Cells)
                    </button>
                    <button
                      onClick={() => setHexPrismMode(false)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        !hexPrismMode ? 'bg-sky-600 text-white border-sky-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Rhombic Unit Cell
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Miller Plane (hkl) 3D Slicer */}
          {activeControlTab === 'miller' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-amber-400" />
                  <span>3D Miller Plane Slicer</span>
                </span>
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

              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Directly slice through this 3D unit cell with any arbitrary crystallographic plane $(hkl)$.
              </p>

              {/* Miller Indices (h, k, l) inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Miller h</label>
                  <input
                    type="number"
                    value={hklH}
                    onChange={(e) => setHklH(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Miller k</label>
                  <input
                    type="number"
                    value={hklK}
                    onChange={(e) => setHklK(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Miller l</label>
                  <input
                    type="number"
                    value={hklL}
                    onChange={(e) => setHklL(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Presets for Common Planes */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block">Quick Family Presets:</span>
                <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                  {[[1,0,0], [1,1,0], [1,1,1], [0,0,1], [0,1,1], [2,0,0], [2,2,0]].map(([ph, pk, pl]) => (
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

              {/* Radiation source picker */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>Radiation:</span>
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
