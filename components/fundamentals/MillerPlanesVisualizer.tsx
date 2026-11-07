import React, { useState, useMemo, useRef } from 'react';
import { 
  Layers, 
  Rotate3d, 
  Sliders, 
  Info, 
  Sparkles,
  Compass,
  Grid,
  Calculator,
  Eye,
  Crosshair,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';
import {
  CrystalSystemId,
  CenteringType,
  CRYSTAL_SYSTEMS_CATALOG
} from './UnitCellsSection';

export interface MillerPlanePreset {
  name: string;
  h: number;
  k: number;
  l: number;
  label: string;
  category: 'Pinacoid {100}' | 'Diagonal Prism {110}' | 'Octahedral {111}' | 'High-Index {hkl}';
  description: string;
}

export const MILLER_PRESETS: MillerPlanePreset[] = [
  { name: '(001)', h: 0, k: 0, l: 1, label: '(001)', category: 'Pinacoid {100}', description: 'Basal pinacoid parallel to a and b axes; cuts c-axis at z = 1.' },
  { name: '(100)', h: 1, k: 0, l: 0, label: '(100)', category: 'Pinacoid {100}', description: 'Front pinacoid parallel to b and c axes; cuts a-axis at x = 1.' },
  { name: '(010)', h: 0, k: 1, l: 0, label: '(010)', category: 'Pinacoid {100}', description: 'Side pinacoid parallel to a and c axes; cuts b-axis at y = 1.' },
  
  { name: '(101)', h: 1, k: 0, l: 1, label: '(101)', category: 'Diagonal Prism {110}', description: 'Rhombic prism plane cutting a and c at 1, parallel to b-axis.' },
  { name: '(110)', h: 1, k: 1, l: 0, label: '(110)', category: 'Diagonal Prism {110}', description: 'Vertical diagonal plane cutting a and b at 1, parallel to c-axis.' },
  { name: '(011)', h: 0, k: 1, l: 1, label: '(011)', category: 'Diagonal Prism {110}', description: 'Diagonal prism cutting b and c at 1, parallel to a-axis.' },
  
  { name: '(111)', h: 1, k: 1, l: 1, label: '(111)', category: 'Octahedral {111}', description: 'Octahedral close-packed facet cutting all three axes at (1, 1, 1).' },
  { name: '(1-11)', h: 1, k: -1, l: 1, label: '(11̄1)', category: 'Octahedral {111}', description: 'Oblique octahedral plane with negative k-intercept along −b.' },
  { name: '(-111)', h: -1, k: 1, l: 1, label: '(1̄11)', category: 'Octahedral {111}', description: 'Oblique octahedral plane with negative h-intercept along −a.' },

  { name: '(200)', h: 2, k: 0, l: 0, label: '(200)', category: 'High-Index {hkl}', description: 'Second-order pinacoid reflection cutting a-axis at ½ (d₂₀₀ = a/2).' },
  { name: '(210)', h: 2, k: 1, l: 0, label: '(210)', category: 'High-Index {hkl}', description: 'Pentagonal dodecahedral (pyritohedron) plane cutting a at ½, b at 1.' },
  { name: '(211)', h: 2, k: 1, l: 1, label: '(211)', category: 'High-Index {hkl}', description: 'Trapezohedral (icositetrahedral) plane cutting a at ½, b at 1, c at 1.' },
];

interface MillerPlanesVisualizerProps {
  selectedSystemId?: CrystalSystemId;
  activeCentering?: CenteringType;
  onSelectSystem?: (id: CrystalSystemId) => void;
  setActiveCentering?: (c: CenteringType) => void;
}

// Greatest common divisor for 2 or 3 integers
function gcd2(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function gcd3(a: number, b: number, c: number): number {
  return gcd2(gcd2(a, b), c) || 1;
}

// Format single index with overbar for negatives
function fmtBar(n: number): string {
  if (n < 0) return `${Math.abs(n)}\u0304`;
  return `${n}`;
}

function formatMillerLabel(h: number, k: number, l: number, showBravais4 = false): string {
  if (showBravais4) {
    const i = -(h + k);
    return `(${fmtBar(h)}${fmtBar(k)}${fmtBar(i)}${fmtBar(l)})`;
  }
  return `(${fmtBar(h)}${fmtBar(k)}${fmtBar(l)})`;
}

// Compute exact cubic/general multiplicity of {hkl} family
function getFamilyMultiplicity(h: number, k: number, l: number, systemId: CrystalSystemId): { familyLabel: string; count: number; formName: string } {
  const ah = Math.abs(h);
  const ak = Math.abs(k);
  const al = Math.abs(l);
  const sorted = [ah, ak, al].sort((a, b) => b - a);
  const [x, y, z] = sorted;

  if (x === 0 && y === 0 && z === 0) {
    return { familyLabel: '{000}', count: 0, formName: 'Degenerate Null Plane' };
  }

  if (systemId === 'cubic') {
    if (y === 0 && z === 0) return { familyLabel: `{${x}00}`, count: 6, formName: 'Hexahedron (Cube Pinacoid)' };
    if (x === y && z === 0) return { familyLabel: `{${x}${y}0}`, count: 12, formName: 'Rhombic Dodecahedron' };
    if (x === y && y === z) return { familyLabel: `{${x}${y}${z}}`, count: 8, formName: 'Octahedron' };
    if (z === 0 && x !== y) return { familyLabel: `{${x}${y}0}`, count: 24, formName: 'Tetrahexahedron' };
    if (x === y || y === z) return { familyLabel: `{${x}${y}${z}}`, count: 24, formName: x > y ? 'Icositetrahedron (Trapezohedron)' : 'Trisoctahedron' };
    return { familyLabel: `{${x}${y}${z}}`, count: 48, formName: 'Hexoctahedron (General Form)' };
  }

  if (systemId === 'hexagonal' || systemId === 'trigonal') {
    const i = -(h + k);
    if (h === 0 && k === 0) return { familyLabel: `{000${al}}`, count: 2, formName: 'Basal Pinacoid' };
    if (l === 0 && (ah === ak || ah === 0 || ak === 0)) return { familyLabel: `{${ fmtBar(ah) }${ fmtBar(ak) }${ fmtBar(Math.abs(i)) }0}`, count: 6, formName: 'Hexagonal Prism' };
    if (l !== 0 && (ah === ak || ah === 0 || ak === 0)) return { familyLabel: `{${ fmtBar(ah) }${ fmtBar(ak) }${ fmtBar(Math.abs(i)) }${al}}`, count: 12, formName: 'Hexagonal Bipyramid' };
    return { familyLabel: `{${fmtBar(h)}${fmtBar(k)}${fmtBar(i)}${fmtBar(l)}}`, count: systemId === 'hexagonal' ? 24 : 12, formName: 'Dihexagonal / Scalenohedral Form' };
  }

  if (systemId === 'tetragonal') {
    if (ah === 0 && ak === 0) return { familyLabel: `{00${al}}`, count: 2, formName: 'Basal Pinacoid' };
    if (al === 0 && (ah === 0 || ak === 0 || ah === ak)) return { familyLabel: `{${Math.max(ah, ak)}${Math.min(ah, ak)}0}`, count: 4, formName: 'Tetragonal Prism' };
    if (al === 0) return { familyLabel: `{${ah}${ak}0}`, count: 8, formName: 'Ditetragonal Prism' };
    if (ah === ak || ah === 0 || ak === 0) return { familyLabel: `{${ah}${ak}${al}}`, count: 8, formName: 'Tetragonal Bipyramid' };
    return { familyLabel: `{${ah}${ak}${al}}`, count: 16, formName: 'Ditetragonal Bipyramid' };
  }

  if (systemId === 'orthorhombic') {
    const nonZero = [ah > 0, ak > 0, al > 0].filter(Boolean).length;
    const count = nonZero === 1 ? 2 : nonZero === 2 ? 4 : 8;
    const formName = nonZero === 1 ? 'Pinacoid' : nonZero === 2 ? 'Rhombic Prism' : 'Rhombic Bipyramid';
    return { familyLabel: `{${ah}${ak}${al}}`, count, formName };
  }

  if (systemId === 'monoclinic') {
    const count = (h === 0 && l === 0) || k === 0 ? 2 : 4;
    return { familyLabel: `{${fmtBar(h)}${fmtBar(k)}${fmtBar(l)}}`, count, formName: count === 2 ? 'Pinacoid' : 'Rhombic Prism' };
  }

  return { familyLabel: `{${fmtBar(h)}${fmtBar(k)}${fmtBar(l)}}`, count: 2, formName: 'Triclinic Pedion / Pinacoid Pair' };
}

// Compute plane-box intersection polygon in fractional coordinates [0,1]^3
function sliceUnitCellPlane(
  h: number,
  k: number,
  l: number,
  planeOffsetC: number
): [number, number, number][] {
  if (h === 0 && k === 0 && l === 0) return [];

  const corners: [number, number, number][] = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];

  const rawPts: [number, number, number][] = [];
  edges.forEach(([i1, i2]) => {
    const p1 = corners[i1];
    const p2 = corners[i2];
    const v1 = h * p1[0] + k * p1[1] + l * p1[2] - planeOffsetC;
    const v2 = h * p2[0] + k * p2[1] + l * p2[2] - planeOffsetC;

    if (Math.abs(v1) < 1e-6 && Math.abs(v2) < 1e-6) {
      rawPts.push(p1, p2);
    } else if (Math.abs(v1) < 1e-6) {
      rawPts.push(p1);
    } else if (Math.abs(v2) < 1e-6) {
      rawPts.push(p2);
    } else if ((v1 > 0 && v2 < 0) || (v1 < 0 && v2 > 0)) {
      const t = v1 / (v1 - v2);
      rawPts.push([
        p1[0] + t * (p2[0] - p1[0]),
        p1[1] + t * (p2[1] - p1[1]),
        p1[2] + t * (p2[2] - p1[2])
      ]);
    }
  });

  // Deduplicate
  const unique: [number, number, number][] = [];
  rawPts.forEach(pt => {
    if (!unique.some(u => Math.hypot(u[0] - pt[0], u[1] - pt[1], u[2] - pt[2]) < 1e-4)) {
      unique.push(pt);
    }
  });

  if (unique.length < 3) return [];

  // Sort cyclically around centroid
  const cx = unique.reduce((s, p) => s + p[0], 0) / unique.length;
  const cy = unique.reduce((s, p) => s + p[1], 0) / unique.length;
  const cz = unique.reduce((s, p) => s + p[2], 0) / unique.length;

  const nLen = Math.hypot(h, k, l) || 1;
  const nx = h / nLen, ny = k / nLen, nz = l / nLen;

  const uVec = [unique[0][0] - cx, unique[0][1] - cy, unique[0][2] - cz];
  const uLen = Math.hypot(uVec[0], uVec[1], uVec[2]) || 1;
  const ux = uVec[0] / uLen, uy = uVec[1] / uLen, uz = uVec[2] / uLen;

  const vx = ny * uz - nz * uy;
  const vy = nz * ux - nx * uz;
  const vz = nx * uy - ny * ux;

  unique.sort((a, b) => {
    const dax = a[0] - cx, day = a[1] - cy, daz = a[2] - cz;
    const dbx = b[0] - cx, dby = b[1] - cy, dbz = b[2] - cz;
    const angA = Math.atan2(dax * vx + day * vy + daz * vz, dax * ux + day * uy + daz * uz);
    const angB = Math.atan2(dbx * vx + dby * vy + dbz * vz, dbx * ux + dby * uy + dbz * uz);
    return angA - angB;
  });

  return unique;
}

// Compute standard origin-shifted offset C so hu + kv + lw = C slices cleanly through [0,1]^3
function getPrimaryPlaneOffset(h: number, k: number, l: number): {
  offsetC: number;
  shiftedOrigin: [number, number, number];
} {
  // When an index is negative, crystallographers place the local origin at the corresponding corner = 1
  const ox = h < 0 ? 1 : 0;
  const oy = k < 0 ? 1 : 0;
  const oz = l < 0 ? 1 : 0;
  // Plane equation relative to shifted origin: h*(u - ox) + k*(v - oy) + l*(w - oz) = 1
  // => h*u + k*v + l*w = 1 + h*ox + k*oy + l*oz
  const offsetC = 1 + h * ox + k * oy + l * oz;
  return {
    offsetC,
    shiftedOrigin: [ox, oy, oz]
  };
}

// Mini SVG thumbnail for the 9 canonical planes
const MillerMiniThumbnail: React.FC<{ h: number; k: number; l: number; isSelected: boolean }> = ({ h, k, l, isSelected }) => {
  const pts = useMemo(() => {
    const s = 18;
    const yawRad = (28 * Math.PI) / 180;
    const pitchRad = (22 * Math.PI) / 180;
    const proj = (u: number, v: number, w: number) => {
      const cx0 = (u - 0.5) * s;
      const cy0 = (v - 0.5) * s;
      const cz0 = (w - 0.5) * s;
      const x1 = cx0 * Math.cos(yawRad) - cy0 * Math.sin(yawRad);
      const y1 = cx0 * Math.sin(yawRad) + cy0 * Math.cos(yawRad);
      const y2 = y1 * Math.cos(pitchRad) - cz0 * Math.sin(pitchRad);
      return { x: 22 + x1, y: 20 - y2 };
    };

    const corners = [
      [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
      [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
    ].map(([u, v, w]) => proj(u, v, w));

    const { offsetC } = getPrimaryPlaneOffset(h, k, l);
    const poly3D = sliceUnitCellPlane(h, k, l, offsetC);
    const poly2D = poly3D.map(([u, v, w]) => proj(u, v, w));

    return { corners, poly2D };
  }, [h, k, l]);

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];

  return (
    <svg viewBox="0 0 44 40" className="w-11 h-10 shrink-0 overflow-visible">
      {edges.map(([i, j], idx) => (
        <line
          key={idx}
          x1={pts.corners[i].x}
          y1={pts.corners[i].y}
          x2={pts.corners[j].x}
          y2={pts.corners[j].y}
          stroke={isSelected ? '#64748b' : '#334155'}
          strokeWidth="1"
        />
      ))}
      {pts.poly2D.length >= 3 && (
        <polygon
          points={pts.poly2D.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          fill={isSelected ? '#10b981' : '#22c55e'}
          fillOpacity={isSelected ? 0.65 : 0.4}
          stroke={isSelected ? '#34d399' : '#16a34a'}
          strokeWidth="1.2"
        />
      )}
    </svg>
  );
};

export const MillerPlanesVisualizer: React.FC<MillerPlanesVisualizerProps> = ({
  selectedSystemId = 'cubic',
  activeCentering = 'P',
  onSelectSystem,
  setActiveCentering
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('(111)');
  const [customH, setCustomH] = useState<number>(1);
  const [customK, setCustomK] = useState<number>(1);
  const [customL, setCustomL] = useState<number>(1);
  const [useCustom, setUseCustom] = useState<boolean>(false);

  // Secondary Comparison Plane for Interplanar Angle & Zone Axis Intersection
  const [showSecondaryPlane, setShowSecondaryPlane] = useState<boolean>(false);
  const [secH, setSecH] = useState<number>(1);
  const [secK, setSecK] = useState<number>(1);
  const [secL, setSecL] = useState<number>(0);

  // 3D View Controls
  const [yaw, setYaw] = useState<number>(32);
  const [pitch, setPitch] = useState<number>(22);
  const [planeOpacity, setPlaneOpacity] = useState<number>(0.62);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [showNormalVector, setShowNormalVector] = useState<boolean>(true);
  const [showParallelStack, setShowParallelStack] = useState<boolean>(false);
  const [showCenteringAtoms, setShowCenteringAtoms] = useState<boolean>(true);
  const [useTrueCrystalCell, setUseTrueCrystalCell] = useState<boolean>(true);

  // Interactive Intercept-to-Miller Converter State
  const [interceptA, setInterceptA] = useState<string>('1');
  const [interceptB, setInterceptB] = useState<string>('2');
  const [interceptC, setInterceptC] = useState<string>('∞');

  // Drag rotation state
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeSystem = useMemo(() => {
    return CRYSTAL_SYSTEMS_CATALOG.find(s => s.id === selectedSystemId) || CRYSTAL_SYSTEMS_CATALOG[0];
  }, [selectedSystemId]);

  const isHexOrTrig = selectedSystemId === 'hexagonal' || selectedSystemId === 'trigonal';

  // Active indices (h, k, l)
  const { h, k, l, label, bravais4Label } = useMemo(() => {
    let curH = customH;
    let curK = customK;
    let curL = customL;
    if (!useCustom) {
      const preset = MILLER_PRESETS.find(p => p.name === selectedPreset) || MILLER_PRESETS[6];
      curH = preset.h;
      curK = preset.k;
      curL = preset.l;
    }
    return {
      h: curH,
      k: curK,
      l: curL,
      label: formatMillerLabel(curH, curK, curL, false),
      bravais4Label: formatMillerLabel(curH, curK, curL, true)
    };
  }, [useCustom, selectedPreset, customH, customK, customL]);

  // Handle Preset selection
  const handleSelectPreset = (p: MillerPlanePreset) => {
    playSynthTone('tick');
    setUseCustom(false);
    setSelectedPreset(p.name);
    setCustomH(p.h);
    setCustomK(p.k);
    setCustomL(p.l);
  };

  // Crystallographic Metric Tensor, d-spacing, Reciprocal Normal, Interplanar Angle, Zone Axis & Extinction
  const crystalMetrics = useMemo(() => {
    const p = useTrueCrystalCell
      ? activeSystem.defaultParams
      : { a: 4.05, b: 4.05, c: 4.05, alpha: 90, beta: 90, gamma: 90 };

    const a = p.a, b = p.b, c = p.c;
    const alphaRad = (p.alpha * Math.PI) / 180;
    const betaRad = (p.beta * Math.PI) / 180;
    const gammaRad = (p.gamma * Math.PI) / 180;

    const cosA = Math.cos(alphaRad), sinA = Math.sin(alphaRad);
    const cosB = Math.cos(betaRad), sinB = Math.sin(betaRad);
    const cosG = Math.cos(gammaRad), sinG = Math.sin(gammaRad);

    // Direct basis vectors in Cartesian space (Å)
    // a along X, b in XY plane, c general
    const vecA: [number, number, number] = [a, 0, 0];
    const vecB: [number, number, number] = [b * cosG, b * sinG, 0];
    const cx = c * cosB;
    const cy = c * (cosA - cosB * cosG) / (sinG || 1);
    const czSq = Math.max(0.01, c * c - cx * cx - cy * cy);
    const cz = Math.sqrt(czSq);
    const vecC: [number, number, number] = [cx, cy, cz];

    // Volume V = a · (b × c)
    const vol = a * b * sinG * cz;

    // Reciprocal basis vectors a*, b*, c* (Å^-1, without 2π factor)
    const crossBC: [number, number, number] = [
      vecB[1] * vecC[2] - vecB[2] * vecC[1],
      vecB[2] * vecC[0] - vecB[0] * vecC[2],
      vecB[0] * vecC[1] - vecB[1] * vecC[0]
    ];
    const crossCA: [number, number, number] = [
      vecC[1] * vecA[2] - vecC[2] * vecA[1],
      vecC[2] * vecA[0] - vecC[0] * vecA[2],
      vecC[0] * vecA[1] - vecC[1] * vecA[0]
    ];
    const crossAB: [number, number, number] = [
      vecA[1] * vecB[2] - vecA[2] * vecB[1],
      vecA[2] * vecB[0] - vecA[0] * vecB[2],
      vecA[0] * vecB[1] - vecA[1] * vecB[0]
    ];

    const vecAStar: [number, number, number] = [crossBC[0] / vol, crossBC[1] / vol, crossBC[2] / vol];
    const vecBStar: [number, number, number] = [crossCA[0] / vol, crossCA[1] / vol, crossCA[2] / vol];
    const vecCStar: [number, number, number] = [crossAB[0] / vol, crossAB[1] / vol, crossAB[2] / vol];

    // Reciprocal vector g_1 = h*a* + k*b* + l*c*
    const gx = h * vecAStar[0] + k * vecBStar[0] + l * vecCStar[0];
    const gy = h * vecAStar[1] + k * vecBStar[1] + l * vecCStar[1];
    const gz = h * vecAStar[2] + k * vecBStar[2] + l * vecCStar[2];
    const gMag = Math.hypot(gx, gy, gz);
    const dSpacing = gMag > 1e-6 ? 1 / gMag : 0;

    // Secondary plane g_2 = secH*a* + secK*b* + secL*c*
    const g2x = secH * vecAStar[0] + secK * vecBStar[0] + secL * vecCStar[0];
    const g2y = secH * vecAStar[1] + secK * vecBStar[1] + secL * vecCStar[1];
    const g2z = secH * vecAStar[2] + secK * vecBStar[2] + secL * vecCStar[2];
    const g2Mag = Math.hypot(g2x, g2y, g2z);
    const d2Spacing = g2Mag > 1e-6 ? 1 / g2Mag : 0;

    // Interplanar angle between (hkl) and (secH, secK, secL)
    let interplanarAngleDeg = 0;
    if (gMag > 1e-6 && g2Mag > 1e-6) {
      const cosPhi = Math.max(-1, Math.min(1, (gx * g2x + gy * g2y + gz * g2z) / (gMag * g2Mag)));
      interplanarAngleDeg = (Math.acos(cosPhi) * 180) / Math.PI;
    }

    // Zone axis [u v w] = (h,k,l) × (secH,secK,secL) reduced by gcd
    const rawU = k * secL - l * secK;
    const rawV = l * secH - h * secL;
    const rawW = h * secK - k * secH;
    const zoneGcd = gcd3(rawU, rawV, rawW);
    const zoneAxis: [number, number, number] = [rawU / zoneGcd, rawV / zoneGcd, rawW / zoneGcd];

    // Order of reflection n = gcd(|h|,|k|,|l|)
    const orderN = gcd3(h, k, l);
    const primH = orderN > 0 ? h / orderN : h;
    const primK = orderN > 0 ? k / orderN : k;
    const primL = orderN > 0 ? l / orderN : l;

    // Bragg 2θ for Cu Kα (1.5406 Å) and Mo Kα (0.7107 Å)
    const sinThetaCu = dSpacing > 0 ? 1.5406 / (2 * dSpacing) : 2;
    const twoThetaCu = sinThetaCu <= 1 ? (2 * Math.asin(sinThetaCu) * 180) / Math.PI : null;

    const sinThetaMo = dSpacing > 0 ? 0.7107 / (2 * dSpacing) : 2;
    const twoThetaMo = sinThetaMo <= 1 ? (2 * Math.asin(sinThetaMo) * 180) / Math.PI : null;

    // Systematic extinction check for activeCentering
    let isAllowed = true;
    let extinctionReason = 'Primitive (P): All (hkl) reflections allowed';
    if (activeCentering === 'I') {
      isAllowed = (h + k + l) % 2 === 0;
      extinctionReason = isAllowed
        ? `Body-Centered (I): h+k+l = ${h + k + l} (Even → Constructive)`
        : `Body-Centered (I): h+k+l = ${h + k + l} (Odd → Destructive Extinction)`;
    } else if (activeCentering === 'F') {
      const pH = Math.abs(h % 2), pK = Math.abs(k % 2), pL = Math.abs(l % 2);
      isAllowed = pH === pK && pK === pL;
      extinctionReason = isAllowed
        ? `Face-Centered (F): (${h},${k},${l}) unmixed parity → Constructive (F = 4f)`
        : `Face-Centered (F): (${h},${k},${l}) mixed parity → Destructive Extinction`;
    } else if (activeCentering === 'C') {
      isAllowed = (h + k) % 2 === 0;
      extinctionReason = isAllowed
        ? `Base-Centered (C): h+k = ${h + k} (Even → Constructive)`
        : `Base-Centered (C): h+k = ${h + k} (Odd → Destructive Extinction)`;
    } else if (activeCentering === 'R') {
      isAllowed = (-h + k + l) % 3 === 0;
      extinctionReason = isAllowed
        ? `Rhombohedral Obverse (R): −h+k+l = ${-h + k + l} (3n → Constructive)`
        : `Rhombohedral Obverse (R): −h+k+l = ${-h + k + l} (≠ 3n → Extinct)`;
    }

    const multiplicity = getFamilyMultiplicity(h, k, l, useTrueCrystalCell ? selectedSystemId : 'cubic');

    return {
      params: p,
      vecA,
      vecB,
      vecC,
      vol,
      vecAStar,
      vecBStar,
      vecCStar,
      gVec: [gx, gy, gz] as [number, number, number],
      gMag,
      dSpacing,
      d2Spacing,
      interplanarAngleDeg,
      zoneAxis,
      orderN,
      primH,
      primK,
      primL,
      twoThetaCu,
      twoThetaMo,
      isAllowed,
      extinctionReason,
      multiplicity
    };
  }, [activeSystem, useTrueCrystalCell, selectedSystemId, activeCentering, h, k, l, secH, secK, secL]);

  // 3D Geometry calculation for Unit Cell and Plane Slicing
  const geometry = useMemo(() => {
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;

    const { vecA, vecB, vecC, gVec, gMag } = crystalMetrics;
    const maxDim = Math.max(
      Math.hypot(...vecA),
      Math.hypot(...vecB),
      Math.hypot(...vecC)
    ) || 4.05;
    const scale = 148 / maxDim;

    // Fractional [u,v,w] -> 3D Cartesian centered at (0.5, 0.5, 0.5)
    const fracToCart = (u: number, v: number, w: number): [number, number, number] => {
      const du = u - 0.5;
      const dv = v - 0.5;
      const dw = w - 0.5;
      return [
        (du * vecA[0] + dv * vecB[0] + dw * vecC[0]) * scale,
        (du * vecA[1] + dv * vecB[1] + dw * vecC[1]) * scale,
        (du * vecA[2] + dv * vecB[2] + dw * vecC[2]) * scale
      ];
    };

    const projectCart = (cx0: number, cy0: number, cz0: number) => {
      // Yaw (around Z)
      const x1 = cx0 * Math.cos(yawRad) - cy0 * Math.sin(yawRad);
      const y1 = cx0 * Math.sin(yawRad) + cy0 * Math.cos(yawRad);
      const z1 = cz0;

      // Pitch (around X)
      const x2 = x1;
      const y2 = y1 * Math.cos(pitchRad) - z1 * Math.sin(pitchRad);
      const z2 = y1 * Math.sin(pitchRad) + z1 * Math.cos(pitchRad);

      return {
        px: 250 + x2,
        py: 205 - y2,
        depth: z2
      };
    };

    const project = (u: number, v: number, w: number) => {
      const [cx, cy, cz] = fracToCart(u, v, w);
      return projectCart(cx, cy, cz);
    };

    // 8 unit cell corners in fractional coords [u, v, w]
    const corners: [number, number, number][] = [
      [0, 0, 0], // 0: Origin
      [1, 0, 0], // 1: +a
      [1, 1, 0], // 2: +a+b
      [0, 1, 0], // 3: +b
      [0, 0, 1], // 4: +c
      [1, 0, 1], // 5: +a+c
      [1, 1, 1], // 6: +a+b+c
      [0, 1, 1]  // 7: +b+c
    ];

    const projectedCorners = corners.map(([u, v, w]) => project(u, v, w));

    // 12 edges
    const edges: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    // Primary plane offset and shifted origin
    const { offsetC, shiftedOrigin } = getPrimaryPlaneOffset(h, k, l);
    const primaryPoly3D = sliceUnitCellPlane(h, k, l, offsetC);
    const planePolygonPoints = primaryPoly3D.map(([u, v, w]) => project(u, v, w));

    // Calculate physical slice area in Å^2 for 2D planar density
    let sliceAreaAngstrom2 = 0;
    if (primaryPoly3D.length >= 3) {
      const p0 = primaryPoly3D[0];
      const cart0 = [
        p0[0] * vecA[0] + p0[1] * vecB[0] + p0[2] * vecC[0],
        p0[0] * vecA[1] + p0[1] * vecB[1] + p0[2] * vecC[1],
        p0[0] * vecA[2] + p0[1] * vecB[2] + p0[2] * vecC[2]
      ];
      for (let i = 1; i < primaryPoly3D.length - 1; i++) {
        const p1 = primaryPoly3D[i];
        const p2 = primaryPoly3D[i + 1];
        const v1 = [
          (p1[0] - p0[0]) * vecA[0] + (p1[1] - p0[1]) * vecB[0] + (p1[2] - p0[2]) * vecC[0],
          (p1[0] - p0[0]) * vecA[1] + (p1[1] - p0[1]) * vecB[1] + (p1[2] - p0[2]) * vecC[1],
          (p1[0] - p0[0]) * vecA[2] + (p1[1] - p0[2]) * vecB[2] + (p1[2] - p0[2]) * vecC[2]
        ];
        const v2 = [
          (p2[0] - p0[0]) * vecA[0] + (p2[1] - p0[1]) * vecB[0] + (p2[2] - p0[2]) * vecC[0],
          (p2[0] - p0[0]) * vecA[1] + (p2[1] - p0[1]) * vecB[1] + (p2[2] - p0[2]) * vecC[1],
          (p2[0] - p0[0]) * vecA[2] + (p2[1] - p0[1]) * vecB[2] + (p2[2] - p0[2]) * vecC[2]
        ];
        const cx = v1[1] * v2[2] - v1[2] * v2[1];
        const cy = v1[2] * v2[0] - v1[0] * v2[2];
        const cz = v1[0] * v2[1] - v1[1] * v2[0];
        sliceAreaAngstrom2 += 0.5 * Math.hypot(cx, cy, cz);
      }
      void cart0;
    }

    // Parallel family stack planes (hu + kv + lw = m)
    const stackPolygons: { m: number; points: { px: number; py: number }[]; isPrimary: boolean }[] = [];
    if (showParallelStack && (h !== 0 || k !== 0 || l !== 0)) {
      const cornerVals = corners.map(([u, v, w]) => h * u + k * v + l * w);
      const minM = Math.ceil(Math.min(...cornerVals));
      const maxM = Math.floor(Math.max(...cornerVals));
      for (let m = minM; m <= maxM; m++) {
        const poly = sliceUnitCellPlane(h, k, l, m);
        if (poly.length >= 3) {
          stackPolygons.push({
            m,
            points: poly.map(([u, v, w]) => project(u, v, w)),
            isPrimary: m === offsetC
          });
        }
      }
    }

    // Secondary comparison plane
    const { offsetC: secOffsetC } = getPrimaryPlaneOffset(secH, secK, secL);
    const secondaryPoly3D = showSecondaryPlane ? sliceUnitCellPlane(secH, secK, secL, secOffsetC) : [];
    const secondaryPolygonPoints = secondaryPoly3D.map(([u, v, w]) => project(u, v, w));

    // Axis intercept markers relative to shiftedOrigin [ox, oy, oz]
    const [ox, oy, oz] = shiftedOrigin;
    const interceptMarkers: { axis: 'a' | 'b' | 'c'; coord: [number, number, number]; proj: { px: number; py: number }; text: string; color: string }[] = [];
    if (h !== 0) {
      const uInt = ox + 1 / h;
      if (uInt >= -0.01 && uInt <= 1.01) {
        interceptMarkers.push({
          axis: 'a',
          coord: [uInt, oy, oz],
          proj: project(uInt, oy, oz),
          text: Math.abs(h) === 1 ? 'a' : `a/${Math.abs(h)}`,
          color: '#f43f5e'
        });
      }
    }
    if (k !== 0) {
      const vInt = oy + 1 / k;
      if (vInt >= -0.01 && vInt <= 1.01) {
        interceptMarkers.push({
          axis: 'b',
          coord: [ox, vInt, oz],
          proj: project(ox, vInt, oz),
          text: Math.abs(k) === 1 ? 'b' : `b/${Math.abs(k)}`,
          color: '#10b981'
        });
      }
    }
    if (l !== 0) {
      const wInt = oz + 1 / l;
      if (wInt >= -0.01 && wInt <= 1.01) {
        interceptMarkers.push({
          axis: 'c',
          coord: [ox, oy, wInt],
          proj: project(ox, oy, wInt),
          text: Math.abs(l) === 1 ? 'c' : `c/${Math.abs(l)}`,
          color: '#38bdf8'
        });
      }
    }

    // Reciprocal normal vector g_hkl projected from plane centroid (or cell center)
    const centroid3D: [number, number, number] = primaryPoly3D.length >= 3
      ? [
          primaryPoly3D.reduce((s, p) => s + p[0], 0) / primaryPoly3D.length,
          primaryPoly3D.reduce((s, p) => s + p[1], 0) / primaryPoly3D.length,
          primaryPoly3D.reduce((s, p) => s + p[2], 0) / primaryPoly3D.length
        ]
      : [0.5, 0.5, 0.5];

    const normStart = project(centroid3D[0], centroid3D[1], centroid3D[2]);
    const [cxStart, cyStart, czStart] = fracToCart(centroid3D[0], centroid3D[1], centroid3D[2]);
    const normArrowLen = 58;
    const nx = gMag > 1e-6 ? (gVec[0] / gMag) * normArrowLen : 0;
    const ny = gMag > 1e-6 ? (gVec[1] / gMag) * normArrowLen : 0;
    const nz = gMag > 1e-6 ? (gVec[2] / gMag) * normArrowLen : 0;
    const normEnd = projectCart(cxStart + nx, cyStart + ny, czStart + nz);

    // All lattice atoms in unit cell (8 corners + centering sites) and test if they lie on the primary plane
    const allSites: { u: number; v: number; w: number; role: 'corner' | 'centered' }[] = corners.map(([u, v, w]) => ({
      u, v, w, role: 'corner' as const
    }));
    if (showCenteringAtoms && useTrueCrystalCell) {
      if (activeCentering === 'I') {
        allSites.push({ u: 0.5, v: 0.5, w: 0.5, role: 'centered' });
      } else if (activeCentering === 'F') {
        allSites.push(
          { u: 0.5, v: 0.5, w: 0, role: 'centered' },
          { u: 0.5, v: 0.5, w: 1, role: 'centered' },
          { u: 0.5, v: 0, w: 0.5, role: 'centered' },
          { u: 0.5, v: 1, w: 0.5, role: 'centered' },
          { u: 0, v: 0.5, w: 0.5, role: 'centered' },
          { u: 1, v: 0.5, w: 0.5, role: 'centered' }
        );
      } else if (activeCentering === 'C') {
        allSites.push(
          { u: 0.5, v: 0.5, w: 0, role: 'centered' },
          { u: 0.5, v: 0.5, w: 1, role: 'centered' }
        );
      } else if (activeCentering === 'R') {
        allSites.push(
          { u: 2 / 3, v: 1 / 3, w: 1 / 3, role: 'centered' },
          { u: 1 / 3, v: 2 / 3, w: 2 / 3, role: 'centered' }
        );
      }
    }

    const projectedAtoms = allSites.map(site => {
      const pr = project(site.u, site.v, site.w);
      const onPlane = Math.abs(h * site.u + k * site.v + l * site.w - offsetC) < 1e-4;
      return {
        ...site,
        ...pr,
        onPlane
      };
    }).sort((a, b) => a.depth - b.depth);

    // Basis axis arrows from shiftedOrigin
    const originProj = project(ox, oy, oz);
    const axisEndA = project(ox === 0 ? 1 : 0, oy, oz);
    const axisEndB = project(ox, oy === 0 ? 1 : 0, oz);
    const axisEndC = project(ox, oy, oz === 0 ? 1 : 0);

    return {
      projectedCorners,
      edges,
      primaryPoly3D,
      planePolygonPoints,
      stackPolygons,
      secondaryPolygonPoints,
      interceptMarkers,
      shiftedOrigin,
      originProj,
      axisEndA,
      axisEndB,
      axisEndC,
      normStart,
      normEnd,
      projectedAtoms,
      sliceAreaAngstrom2
    };
  }, [yaw, pitch, crystalMetrics, h, k, l, secH, secK, secL, showParallelStack, showSecondaryPlane, showCenteringAtoms, useTrueCrystalCell, activeCentering]);

  // Step-by-step Intercept -> Miller Index (hkl) Calculator
  const interceptConversion = useMemo(() => {
    const parseFractionOrInf = (str: string): number | null => {
      const clean = str.trim().toLowerCase();
      if (clean === '∞' || clean === 'inf' || clean === 'infinity' || clean === '0') return Infinity;
      if (clean.includes('/')) {
        const [num, den] = clean.split('/').map(Number);
        if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
      }
      const val = parseFloat(clean);
      return isNaN(val) || val === 0 ? Infinity : val;
    };

    const pa = parseFractionOrInf(interceptA);
    const pb = parseFractionOrInf(interceptB);
    const pc = parseFractionOrInf(interceptC);

    const ra = pa === Infinity || pa === null ? 0 : 1 / pa;
    const rb = pb === Infinity || pb === null ? 0 : 1 / pb;
    const rc = pc === Infinity || pc === null ? 0 : 1 / pc;

    // Multiply by common scale factor (up to 12) to clear fractions
    let bestMult = 1;
    for (let m = 1; m <= 24; m++) {
      const epsA = Math.abs(Math.round(ra * m) - ra * m);
      const epsB = Math.abs(Math.round(rb * m) - rb * m);
      const epsC = Math.abs(Math.round(rc * m) - rc * m);
      if (epsA < 1e-3 && epsB < 1e-3 && epsC < 1e-3) {
        bestMult = m;
        break;
      }
    }

    const rawH = Math.round(ra * bestMult);
    const rawK = Math.round(rb * bestMult);
    const rawL = Math.round(rc * bestMult);
    const g = gcd3(rawH, rawK, rawL);

    return {
      ra: ra.toFixed(2),
      rb: rb.toFixed(2),
      rc: rc.toFixed(2),
      bestMult,
      rawH,
      rawK,
      rawL,
      redH: rawH / g,
      redK: rawK / g,
      redL: rawL / g
    };
  }, [interceptA, interceptB, interceptC]);

  // Mouse drag handlers on SVG
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    setYaw(prev => Math.max(-180, Math.min(180, prev + Math.round(dx * 0.6))));
    setPitch(prev => Math.max(-75, Math.min(75, prev + Math.round(dy * 0.5))));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono uppercase tracking-wider">
            <span className="text-emerald-400 font-bold">
              Crystallographic Plane Slicing & Indexing Engine
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-indigo-300 font-bold">
              {useTrueCrystalCell ? `${activeSystem.name} (${activeCentering})` : 'Ideal Reference Cube'}
            </span>
            {isHexOrTrig && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-amber-300 font-bold">
                  4-Index Miller-Bravais {bravais4Label} Active
                </span>
              </>
            )}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Miller Indices (hkl) & Reciprocal Plane Geometry
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Inspect 3D crystallographic planes <span className="font-mono text-emerald-300">hu + kv + lw = m</span> across all 7 crystal systems with origin-shifted negative index slicing, parallel <span className="font-mono text-cyan-300">d_hkl</span> plane stacks, reciprocal normal vectors <span className="font-mono text-amber-300">g_hkl</span>, and interplanar angle &amp; zone axis <span className="font-mono text-indigo-300">[uvw]</span> analysis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle between True Crystal System Cell vs Reference Cube */}
          <button
            onClick={() => { playSynthTone('tick'); setUseTrueCrystalCell(prev => !prev); }}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
              useTrueCrystalCell
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{useTrueCrystalCell ? `Metric: ${activeSystem.name.split(' ')[0]}` : 'Metric: Unit Cube'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => { playSynthTone('tick'); setUseCustom(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                !useCustom ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              12 Canonical Presets
            </button>
            <button
              onClick={() => { playSynthTone('tick'); setUseCustom(true); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                useCustom ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom (hkl) Slicer
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: 3D Sliced Unit Cell Canvas + Live Telemetry */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          
          {/* Top Telemetry Strip */}
          <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase">
                <span>Active Crystallographic Plane</span>
                {crystalMetrics.orderN > 1 && (
                  <span className="text-amber-300 font-bold">
                    · Order n={crystalMetrics.orderN} Harmonic of ({fmtBar(crystalMetrics.primH)}{fmtBar(crystalMetrics.primK)}{fmtBar(crystalMetrics.primL)})
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3 mt-0.5 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {label}
                </span>
                {isHexOrTrig && (
                  <span className="text-lg font-bold text-amber-300 font-mono" title="4-Index Miller-Bravais Notation (i = -(h+k))">
                    = {bravais4Label}
                  </span>
                )}
                <span className="text-xs font-mono text-slate-400">
                  {crystalMetrics.multiplicity.formName} · <strong className="text-indigo-300">{crystalMetrics.multiplicity.familyLabel}</strong> ({crystalMetrics.multiplicity.count} eq. faces)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 text-emerald-300 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400/80 block">Interplanar d_hkl</span>
                <strong>{crystalMetrics.dSpacing > 0 ? `${crystalMetrics.dSpacing.toFixed(3)} Å` : '∞'}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-indigo-950/50 text-indigo-300 border border-indigo-500/30">
                <span className="text-[10px] text-indigo-400/80 block">Cu Kα Bragg 2θ</span>
                <strong>{crystalMetrics.twoThetaCu !== null ? `${crystalMetrics.twoThetaCu.toFixed(2)}°` : 'Out of range'}</strong>
              </div>
            </div>
          </div>

          {/* Interactive 3D SVG Viewport */}
          <div className="relative flex-1 flex items-center justify-center my-1 select-none bg-slate-900/40 rounded-2xl border border-slate-900 overflow-hidden">
            {/* Drag Hint & Quick Camera Reset */}
            <div className="absolute top-3 left-3 flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/85 px-2.5 py-1 rounded-lg border border-slate-800">
              <Rotate3d className="w-3.5 h-3.5 text-emerald-400" />
              <span>Drag to Rotate 3D · Origin O({geometry.shiftedOrigin.join(',')})</span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                onClick={() => { playSynthTone('tick'); setYaw(32); setPitch(22); }}
                className="px-2 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-800 flex items-center gap-1"
                title="Reset 3D Camera"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Iso</span>
              </button>
              <button
                onClick={() => { playSynthTone('tick'); setYaw(0); setPitch(90); }}
                className="px-2 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-800"
                title="Project along c-axis (001)"
              >
                [001]
              </button>
              <button
                onClick={() => { playSynthTone('tick'); setYaw(45); setPitch(35); }}
                className="px-2 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-800"
                title="Project along [111]"
              >
                [111]
              </button>
            </div>

            <svg 
              viewBox="0 0 500 410" 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-88 max-w-lg mx-auto cursor-grab active:cursor-grabbing overflow-visible"
            >
              <defs>
                <linearGradient id="millerPlaneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="secondaryPlaneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>

              {/* Unit Cell Wireframe Edges */}
              {showWireframe && geometry.edges.map(([i, j], idx) => {
                const p1 = geometry.projectedCorners[i];
                const p2 = geometry.projectedCorners[j];
                const avgDepth = (p1.depth + p2.depth) / 2;
                const isBackEdge = avgDepth < -15;
                return (
                  <line
                    key={`edge-${idx}`}
                    x1={p1.px}
                    y1={p1.py}
                    x2={p2.px}
                    y2={p2.py}
                    stroke={isBackEdge ? '#334155' : '#64748b'}
                    strokeWidth={isBackEdge ? '1.5' : '2.2'}
                    strokeDasharray={isBackEdge ? '4 3' : undefined}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Crystallographic Axis Vectors a (red), b (green), c (blue) from shifted origin */}
              <g>
                <line
                  x1={geometry.originProj.px}
                  y1={geometry.originProj.py}
                  x2={geometry.axisEndA.px}
                  y2={geometry.axisEndA.py}
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                />
                <text x={geometry.axisEndA.px + 6} y={geometry.axisEndA.py + 4} fill="#fb7185" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {geometry.shiftedOrigin[0] === 1 ? '−a' : '+a'}
                </text>

                <line
                  x1={geometry.originProj.px}
                  y1={geometry.originProj.py}
                  x2={geometry.axisEndB.px}
                  y2={geometry.axisEndB.py}
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
                <text x={geometry.axisEndB.px + 6} y={geometry.axisEndB.py + 4} fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {geometry.shiftedOrigin[1] === 1 ? '−b' : '+b'}
                </text>

                <line
                  x1={geometry.originProj.px}
                  y1={geometry.originProj.py}
                  x2={geometry.axisEndC.px}
                  y2={geometry.axisEndC.py}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                <text x={geometry.axisEndC.px - 4} y={geometry.axisEndC.py - 8} fill="#7dd3fc" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {geometry.shiftedOrigin[2] === 1 ? '−c' : '+c'}
                </text>

                {/* Shifted Origin Marker O */}
                <circle
                  cx={geometry.originProj.px}
                  cy={geometry.originProj.py}
                  r="4.5"
                  fill="#fbbf24"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
                <text x={geometry.originProj.px - 14} y={geometry.originProj.py + 14} fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  O
                </text>
              </g>

              {/* Parallel Family Stack Planes (hu + kv + lw = m) */}
              {showParallelStack && geometry.stackPolygons.map((sp, idx) => (
                !sp.isPrimary && (
                  <polygon
                    key={`stack-${idx}`}
                    points={sp.points.map(p => `${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')}
                    fill="#10b981"
                    fillOpacity={planeOpacity * 0.35}
                    stroke="#34d399"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                )
              ))}

              {/* Secondary Comparison Plane (h₂k₂l₂) */}
              {showSecondaryPlane && geometry.secondaryPolygonPoints.length >= 3 && (
                <polygon
                  points={geometry.secondaryPolygonPoints.map(p => `${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')}
                  fill="url(#secondaryPlaneGrad)"
                  fillOpacity={planeOpacity * 0.55}
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeDasharray="5 3"
                />
              )}

              {/* Primary Sliced Miller Plane */}
              {geometry.planePolygonPoints.length >= 3 && (
                <g>
                  <polygon
                    points={geometry.planePolygonPoints.map(p => `${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')}
                    fill="url(#millerPlaneGrad)"
                    fillOpacity={planeOpacity}
                    stroke="#10b981"
                    strokeWidth="2.8"
                    strokeLinejoin="round"
                  />

                  {/* Polygon Vertex Nodes */}
                  {geometry.planePolygonPoints.map((pt, idx) => (
                    <circle
                      key={`poly-pt-${idx}`}
                      cx={pt.px}
                      cy={pt.py}
                      r="4"
                      fill="#a7f3d0"
                      stroke="#064e3b"
                      strokeWidth="1.5"
                    />
                  ))}
                </g>
              )}

              {/* Axis Intercept Callout Badges (a/h, b/k, c/l) */}
              {geometry.interceptMarkers.map((im, idx) => (
                <g key={`int-${idx}`}>
                  <circle
                    cx={im.proj.px}
                    cy={im.proj.py}
                    r="5.5"
                    fill={im.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <rect
                    x={im.proj.px + 7}
                    y={im.proj.py - 10}
                    width={im.text.length * 7 + 10}
                    height="17"
                    rx="4"
                    fill="#0f172a"
                    stroke={im.color}
                    strokeWidth="1"
                  />
                  <text
                    x={im.proj.px + 12}
                    y={im.proj.py + 2}
                    fill="#f8fafc"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {im.text}
                  </text>
                </g>
              ))}

              {/* Reciprocal Plane Normal Vector g_hkl */}
              {showNormalVector && (h !== 0 || k !== 0 || l !== 0) && (
                <g>
                  <line
                    x1={geometry.normStart.px}
                    y1={geometry.normStart.py}
                    x2={geometry.normEnd.px}
                    y2={geometry.normEnd.py}
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="4 3"
                  />
                  <circle
                    cx={geometry.normEnd.px}
                    cy={geometry.normEnd.py}
                    r="4.5"
                    fill="#f59e0b"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={geometry.normEnd.px + 8}
                    y={geometry.normEnd.py - 5}
                    fill="#fbbf24"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    g*({h},{k},{l})
                  </text>
                </g>
              )}

              {/* Depth-Sorted Unit Cell Atoms (highlighting atoms sliced by the active plane!) */}
              {geometry.projectedAtoms.map((atom, idx) => (
                <g key={`atom-${idx}`}>
                  {atom.onPlane && (
                    <circle
                      cx={atom.px}
                      cy={atom.py}
                      r={atom.role === 'centered' ? 9 : 7.5}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="1.8"
                    />
                  )}
                  <circle
                    cx={atom.px}
                    cy={atom.py}
                    r={atom.role === 'centered' ? 5.5 : 4}
                    fill={atom.onPlane ? '#10b981' : atom.role === 'centered' ? '#38bdf8' : '#94a3b8'}
                    stroke="#0f172a"
                    strokeWidth="1.2"
                  />
                </g>
              ))}
            </svg>

            {/* Bottom Overlay Status Bar: Extinction & Planar Cut Info */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between flex-wrap gap-2 bg-slate-950/90 border border-slate-800/90 px-3 py-1.5 rounded-xl text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                {crystalMetrics.isAllowed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className={crystalMetrics.isAllowed ? 'text-emerald-300' : 'text-rose-300'}>
                  {crystalMetrics.extinctionReason}
                </span>
              </div>
              <span className="text-slate-400">
                Atoms on plane: <strong className="text-emerald-400">{geometry.projectedAtoms.filter(a => a.onPlane).length}</strong> · Slice Area: <strong className="text-cyan-300">{geometry.sliceAreaAngstrom2.toFixed(1)} Å²</strong>
              </span>
            </div>
          </div>

          {/* Interactive Controls Bar */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Azimuth (Yaw)</span>
                  <span className="text-emerald-400 font-bold">{yaw}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={yaw}
                  onChange={(e) => setYaw(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 accent-emerald-500 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Elevation (Pitch)</span>
                  <span className="text-emerald-400 font-bold">{pitch}°</span>
                </div>
                <input
                  type="range"
                  min="-75"
                  max="75"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 accent-emerald-500 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Plane Opacity</span>
                  <span className="text-emerald-400 font-bold">{Math.round(planeOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.95"
                  step="0.05"
                  value={planeOpacity}
                  onChange={(e) => setPlaneOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 accent-emerald-500 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 flex-wrap text-[11px] font-mono">
              <button
                onClick={() => { playSynthTone('tick'); setShowParallelStack(prev => !prev); }}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                  showParallelStack
                    ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Parallel Stack (m·d_hkl)</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setShowNormalVector(prev => !prev); }}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                  showNormalVector
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Normal Vector g*</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setShowCenteringAtoms(prev => !prev); }}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                  showCenteringAtoms
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{activeCentering}-Centered Sites</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setShowSecondaryPlane(prev => !prev); }}
                className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                  showSecondaryPlane
                    ? 'bg-sky-600/25 border-sky-400 text-sky-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Compare Plane 2 ({fmtBar(secH)}{fmtBar(secK)}{fmtBar(secL)})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Canonical 12 Presets / Custom (hkl) Slicer + Interplanar Angle & Intercept Converter */}
        <div className="lg:col-span-5 space-y-5">
          {!useCustom ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Canonical Miller Plane Gallery</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Live 3D Schematics</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {MILLER_PRESETS.map((preset) => {
                  const isSelected = !useCustom && selectedPreset === preset.name;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <MillerMiniThumbnail h={preset.h} k={preset.k} l={preset.l} isSelected={isSelected} />
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-emerald-300 truncate">
                          {preset.label}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {preset.category.split(' ')[0]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Plane Crystallographic Breakdown */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 font-mono">
                    {label} {isHexOrTrig ? `/ ${bravais4Label}` : ''} Plane Telemetry
                  </span>
                  <span className="font-mono text-[10px] text-indigo-300">
                    {crystalMetrics.multiplicity.familyLabel}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {MILLER_PRESETS.find(item => item.name === selectedPreset)?.description}
                </p>
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Intercepts (a,b,c)</span>
                    <span className="text-slate-200 font-bold">
                      {h ? (h === 1 ? '1a' : h === -1 ? '−1a' : `a/${h}`) : '∞'},{' '}
                      {k ? (k === 1 ? '1b' : k === -1 ? '−1b' : `b/${k}`) : '∞'},{' '}
                      {l ? (l === 1 ? '1c' : l === -1 ? '−1c' : `c/${l}`) : '∞'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Multiplicity</span>
                    <span className="text-emerald-300 font-bold">
                      m = {crystalMetrics.multiplicity.count} faces
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Mo Kα 2θ</span>
                    <span className="text-cyan-300 font-bold">
                      {crystalMetrics.twoThetaMo !== null ? `${crystalMetrics.twoThetaMo.toFixed(2)}°` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Custom Miller Index (hkl) Controls</span>
                </h3>
                <span className="text-[10px] font-mono text-indigo-400">h, k, l ∈ [−4, 4]</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Miller Index h (a-axis)', val: customH, setter: setCustomH, color: 'text-rose-400', accent: 'accent-rose-500' },
                  { label: 'Miller Index k (b-axis)', val: customK, setter: setCustomK, color: 'text-emerald-400', accent: 'accent-emerald-500' },
                  { label: 'Miller Index l (c-axis)', val: customL, setter: setCustomL, color: 'text-sky-400', accent: 'accent-sky-500' }
                ].map((axisCtrl, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-300">{axisCtrl.label}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => axisCtrl.setter(Math.max(-4, axisCtrl.val - 1))}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                        >
                          −
                        </button>
                        <span className={`${axisCtrl.color} font-bold w-6 text-center`}>{axisCtrl.val}</span>
                        <button
                          onClick={() => axisCtrl.setter(Math.min(4, axisCtrl.val + 1))}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-4"
                      max="4"
                      value={axisCtrl.val}
                      onChange={(e) => axisCtrl.setter(parseInt(e.target.value))}
                      className={`w-full h-1.5 bg-slate-900 ${axisCtrl.accent} rounded-lg cursor-pointer`}
                    />
                  </div>
                ))}

                {isHexOrTrig && (
                  <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30 flex justify-between items-center text-xs font-mono">
                    <span className="text-amber-300">Redundant 3rd Basal Index i = −(h+k):</span>
                    <span className="text-amber-400 font-bold text-sm">i = {-(customH + customK)} → {bravais4Label}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interplanar Angle (h₁k₁l₁) ∠ (h₂k₂l₂) & Zone Axis [uvw] Calculator */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Interplanar Angle &amp; Zone Axis [uvw]</span>
              </h3>
              <button
                onClick={() => { playSynthTone('tick'); setShowSecondaryPlane(prev => !prev); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                  showSecondaryPlane
                    ? 'bg-sky-600 text-white border-sky-400'
                    : 'bg-slate-950 text-sky-300 border-sky-500/30 hover:bg-slate-800'
                }`}
              >
                {showSecondaryPlane ? '3D Overlay Active' : 'Show Plane 2 in 3D'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {[
                { lbl: 'h₂', val: secH, set: setSecH },
                { lbl: 'k₂', val: secK, set: setSecK },
                { lbl: 'l₂', val: secL, set: setSecL }
              ].map((item, i) => (
                <div key={i} className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">{item.lbl}:</span>
                  <input
                    type="number"
                    min="-4"
                    max="4"
                    value={item.val}
                    onChange={(e) => item.set(Math.max(-4, Math.min(4, parseInt(e.target.value) || 0)))}
                    className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right text-sky-300 font-bold"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Interplanar Angle φ</span>
                <span className="text-base font-extrabold text-amber-300">
                  {crystalMetrics.interplanarAngleDeg.toFixed(2)}°
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {label} ∠ ({fmtBar(secH)}{fmtBar(secK)}{fmtBar(secL)})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Zone Axis Intersection</span>
                <span className="text-base font-extrabold text-indigo-300">
                  [{fmtBar(crystalMetrics.zoneAxis[0])} {fmtBar(crystalMetrics.zoneAxis[1])} {fmtBar(crystalMetrics.zoneAxis[2])}]
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  u·h + v·k + w·l = 0
                </span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Fractional Intercept -> Miller Index (hkl) Converter */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Fractional Intercept → (hkl) Solver</span>
              </h3>
              <button
                onClick={() => {
                  playSynthTone('tick');
                  setUseCustom(true);
                  setCustomH(Math.max(-4, Math.min(4, interceptConversion.redH)));
                  setCustomK(Math.max(-4, Math.min(4, interceptConversion.redK)));
                  setCustomL(Math.max(-4, Math.min(4, interceptConversion.redL)));
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
              >
                <span>Plot in 3D</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {[
                { lbl: 'x / a', val: interceptA, set: setInterceptA, presets: ['1', '1/2', '∞', '-1'] },
                { lbl: 'y / b', val: interceptB, set: setInterceptB, presets: ['1', '2', '∞', '-1'] },
                { lbl: 'z / c', val: interceptC, set: setInterceptC, presets: ['1', '1/3', '∞', '-1'] }
              ].map((inp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Intercept {inp.lbl}</span>
                    <button
                      onClick={() => inp.set(inp.val === '∞' ? '1' : '∞')}
                      className="text-indigo-400 hover:underline"
                    >
                      {inp.val === '∞' ? 'Set 1' : 'Set ∞'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={inp.val}
                    onChange={(e) => inp.set(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-300 font-bold text-center"
                    placeholder="e.g. 1/2 or ∞"
                  />
                </div>
              ))}
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">1. Reciprocals (1/p):</span>
                <span>({interceptConversion.ra}, {interceptConversion.rb}, {interceptConversion.rc})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">2. Clear Fractions (×{interceptConversion.bestMult}):</span>
                <span>({interceptConversion.rawH}, {interceptConversion.rawK}, {interceptConversion.rawL})</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800/80">
                <span>3. Coprime Miller Indices:</span>
                <span>{formatMillerLabel(interceptConversion.redH, interceptConversion.redK, interceptConversion.redL)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
