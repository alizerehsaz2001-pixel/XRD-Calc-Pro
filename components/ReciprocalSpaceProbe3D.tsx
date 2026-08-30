import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  RotateCw,
  Play,
  Pause,
  Compass,
  Check,
  Sparkles,
  Info,
  Layers,
  Eye,
  Sliders,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  Zap,
  Target,
  Grid,
  Sun,
  Camera,
  Share2,
  Flame,
  Atom,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

export interface ReciprocalProbePreset {
  id: string;
  name: string;
  system: string;
  formula: string;
  spaceGroup: string;
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export const RECIPROCAL_PRESETS: ReciprocalProbePreset[] = [
  {
    id: 'si-diamond',
    name: 'Silicon (Si)',
    system: 'FCC',
    formula: 'Si',
    spaceGroup: 'Fd-3m (227)',
    a: 5.4309,
    b: 5.4309,
    c: 5.4309,
    alpha: 90,
    beta: 90,
    gamma: 90,
  },
  {
    id: 'au-fcc',
    name: 'Gold (Au)',
    system: 'FCC',
    formula: 'Au',
    spaceGroup: 'Fm-3m (225)',
    a: 4.0782,
    b: 4.0782,
    c: 4.0782,
    alpha: 90,
    beta: 90,
    gamma: 90,
  },
  {
    id: 'fe-bcc',
    name: 'Alpha-Iron (α-Fe)',
    system: 'BCC',
    formula: 'Fe',
    spaceGroup: 'Im-3m (229)',
    a: 2.8665,
    b: 2.8665,
    c: 2.8665,
    alpha: 90,
    beta: 90,
    gamma: 90,
  },
  {
    id: 'nacl-rocksalt',
    name: 'Halite (NaCl)',
    system: 'FCC',
    formula: 'NaCl',
    spaceGroup: 'Fm-3m (225)',
    a: 5.6402,
    b: 5.6402,
    c: 5.6402,
    alpha: 90,
    beta: 90,
    gamma: 90,
  },
  {
    id: 'mg-hcp',
    name: 'Magnesium (Mg)',
    system: 'Hexagonal',
    formula: 'Mg',
    spaceGroup: 'P6_3/mmc (194)',
    a: 3.2094,
    b: 3.2094,
    c: 5.2108,
    alpha: 90,
    beta: 90,
    gamma: 120,
  },
  {
    id: 'quartz-alpha',
    name: 'Alpha-Quartz (SiO₂)',
    system: 'Hexagonal',
    formula: 'SiO2',
    spaceGroup: 'P3_1 2 1 (152)',
    a: 4.9134,
    b: 4.9134,
    c: 5.4052,
    alpha: 90,
    beta: 90,
    gamma: 120,
  },
  {
    id: 'batio3-tetragonal',
    name: 'Barium Titanate (BaTiO₃)',
    system: 'Tetragonal Primitive',
    formula: 'BaTiO3',
    spaceGroup: 'P4mm (99)',
    a: 3.994,
    b: 3.994,
    c: 4.038,
    alpha: 90,
    beta: 90,
    gamma: 90,
  },
  {
    id: 'tio2-rutile',
    name: 'Rutile (TiO₂)',
    system: 'Tetragonal Primitive',
    formula: 'TiO2',
    spaceGroup: 'P4_2/mnm (136)',
    a: 4.5937,
    b: 4.5937,
    c: 2.9587,
    alpha: 90,
    beta: 90,
    gamma: 90,
  },
  {
    id: 'forsterite-ortho',
    name: 'Forsterite (Mg₂SiO₄)',
    system: 'Orthorhombic',
    formula: 'Mg2SiO4',
    spaceGroup: 'Pnma (62)',
    a: 10.190,
    b: 5.978,
    c: 4.753,
    alpha: 90,
    beta: 90,
    gamma: 90,
  },
  {
    id: 'graphite-2h',
    name: 'Graphite 2H',
    system: 'Hexagonal',
    formula: 'C',
    spaceGroup: 'P6_3/mmc (194)',
    a: 2.461,
    b: 2.461,
    c: 6.708,
    alpha: 90,
    beta: 90,
    gamma: 120,
  }
];

export interface ReciprocalSpaceProbe3DProps {
  system: string;
  hklInput: string;
  setHklInput: (val: string) => void;
  maxIndex?: number;
  validateSelectionRule: (sys: string, hkl: [number, number, number]) => { status: string; reason: string };
  parseHKLString: (str: string) => [number, number, number][];
}

export const ReciprocalSpaceProbe3D: React.FC<ReciprocalSpaceProbe3DProps> = ({
  system,
  hklInput,
  setHklInput,
  maxIndex = 3,
  validateSelectionRule,
  parseHKLString
}) => {
  const { t } = useTranslation();

  // Preset Selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('si-diamond');

  // Custom Lattice Metric Tensor State
  const [cellA, setCellA] = useState<number>(5.4309);
  const [cellB, setCellB] = useState<number>(5.4309);
  const [cellC, setCellC] = useState<number>(5.4309);
  const [cellAlpha, setCellAlpha] = useState<number>(90);
  const [cellBeta, setCellBeta] = useState<number>(90);
  const [cellGamma, setCellGamma] = useState<number>(90);

  // 3D Camera & Orientation State
  const [recipRotation, setRecipRotation] = useState({ x: 22, y: -40 });
  const [recipZoom, setRecipZoom] = useState<number>(1.15);
  const [recipPan, setRecipPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [isRecipDragging, setIsRecipDragging] = useState(false);
  const [recipDragStart, setRecipDragStart] = useState({ x: 0, y: 0 });
  const clickStartPos = useRef({ x: 0, y: 0 });
  const recipCanvasRef = useRef<HTMLCanvasElement>(null);

  // Probe nodes & selection
  const [hoveredNode, setHoveredNode] = useState<[number, number, number] | null>(null);
  const [manualProbe, setManualProbe] = useState<[number, number, number]>([1, 1, 1]);

  // Scientific visual layers
  const [projectionMode, setProjectionMode] = useState<'perspective' | 'ortho'>('perspective');
  const [activeViewTab, setActiveViewTab] = useState<'3d_lattice' | '2d_slice' | 'detector_laue'>('3d_lattice');
  const [sliceOrientation, setSliceOrientation] = useState<'hk0' | 'h0l' | '0kl' | 'hhl'>('hk0');
  const [showEwaldSphere, setShowEwaldSphere] = useState<boolean>(true);
  const [showLimitingSphere, setShowLimitingSphere] = useState<boolean>(false);
  const [showBrillouinZone, setShowBrillouinZone] = useState<boolean>(true);
  const [showRecipVectors, setShowRecipVectors] = useState<boolean>(true);
  const [showRelrodGlow, setShowRelrodGlow] = useState<boolean>(true);
  const [filterAllowedOnly, setFilterAllowedOnly] = useState<boolean>(false);
  const [laueZoneFilter, setLaueZoneFilter] = useState<'ALL' | 'ZOLZ' | 'FOLZ' | 'SOLZ'>('ALL');
  const [excitationTolerance, setExcitationTolerance] = useState<number>(0.045); // Tolerance in Å⁻¹

  // Physical Radiation & Goniometer
  const [wavelength, setWavelength] = useState<number>(1.54056); // Cu-Kα in Å
  const [beamTiltOmega, setBeamTiltOmega] = useState<number>(0); // Incident beam rotation angle (deg)
  const [goniometerPhi, setGoniometerPhi] = useState<number>(0); // Crystal azimuthal rotation (deg)
  const [cameraLength, setCameraLength] = useState<number>(120); // 2D detector screen distance in mm

  // Update lattice parameters when preset is chosen
  const handleSelectPreset = (preset: ReciprocalProbePreset) => {
    setSelectedPresetId(preset.id);
    setCellA(preset.a);
    setCellB(preset.b);
    setCellC(preset.c);
    setCellAlpha(preset.alpha);
    setCellBeta(preset.beta);
    setCellGamma(preset.gamma);
  };

  // Rigorous Reciprocal Metric Tensor & Basis Transformation Computation
  const metricTensor = useMemo(() => {
    const a = Math.max(0.1, cellA);
    const b = Math.max(0.1, cellB);
    const c = Math.max(0.1, cellC);
    const radAlpha = (cellAlpha * Math.PI) / 180;
    const radBeta = (cellBeta * Math.PI) / 180;
    const radGamma = (cellGamma * Math.PI) / 180;

    const cosA = Math.cos(radAlpha);
    const cosB = Math.cos(radBeta);
    const cosG = Math.cos(radGamma);
    const sinA = Math.sin(radAlpha);
    const sinB = Math.sin(radBeta);
    const sinG = Math.sin(radGamma);

    // Direct Unit Cell Volume V = abc * sqrt(1 - cos^2 a - cos^2 b - cos^2 g + 2*cos a*cos b*cos g)
    const volTerm = Math.max(0.0001, 1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG);
    const V = a * b * c * Math.sqrt(volTerm);

    // Reciprocal Lattice Lengths in Å⁻¹
    const aStar = (b * c * sinA) / V;
    const bStar = (a * c * sinB) / V;
    const cStar = (a * b * sinG) / V;

    // Reciprocal Angles
    const cosAlphaStar = (cosB * cosG - cosA) / (sinB * sinG);
    const cosBetaStar = (cosA * cosG - cosB) / (sinA * sinG);
    const cosGammaStar = (cosA * cosB - cosG) / (sinA * sinB);

    const sinGammaStar = Math.sqrt(Math.max(0.0001, 1 - cosGammaStar * cosGammaStar));

    // Cartesian Coordinates for Reciprocal Basis Vectors a*, b*, c* (in Å⁻¹)
    // Convention: a* along X, b* in XY plane, c* completing right-handed system
    const aStarVec = { x: aStar, y: 0, z: 0 };
    const bStarVec = { x: bStar * cosGammaStar, y: bStar * sinGammaStar, z: 0 };
    const cStarVec = {
      x: cStar * cosBetaStar,
      y: (cStar * (cosAlphaStar - cosBetaStar * cosGammaStar)) / sinGammaStar,
      z: 1 / c,
    };

    return {
      V,
      aStar,
      bStar,
      cStar,
      aStarVec,
      bStarVec,
      cStarVec,
    };
  }, [cellA, cellB, cellC, cellAlpha, cellBeta, cellGamma]);

  // Convert (h, k, l) to Cartesian reciprocal vector in Å⁻¹
  const getCartesianReciprocalVector = useCallback(
    (h: number, k: number, l: number) => {
      const { aStarVec, bStarVec, cStarVec } = metricTensor;
      // Rotate by crystal goniometer Phi around Z axis
      const phiRad = (goniometerPhi * Math.PI) / 180;
      const cosP = Math.cos(phiRad);
      const sinP = Math.sin(phiRad);

      const unrotatedX = h * aStarVec.x + k * bStarVec.x + l * cStarVec.x;
      const unrotatedY = h * aStarVec.y + k * bStarVec.y + l * cStarVec.y;
      const unrotatedZ = h * aStarVec.z + k * bStarVec.z + l * cStarVec.z;

      const x = unrotatedX * cosP - unrotatedY * sinP;
      const y = unrotatedX * sinP + unrotatedY * cosP;
      const z = unrotatedZ;

      const length = Math.sqrt(x * x + y * y + z * z);
      const dSpacing = length > 0 ? 1 / length : 0;
      const qMagnitude = length > 0 ? 2 * Math.PI * length : 0;

      return { x, y, z, length, dSpacing, qMagnitude };
    },
    [metricTensor, goniometerPhi]
  );

  // Orbit animation loop
  useEffect(() => {
    if (!isOrbiting) return;
    let animId: number;
    const animate = () => {
      setRecipRotation((prev) => ({ ...prev, y: (prev.y + 0.35) % 360 }));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isOrbiting]);

  // Toggle index in analysis buffer
  const toggleHKLNode = (h: number, k: number, l: number) => {
    const parsed = parseHKLString(hklInput);
    const exists = parsed.some((p) => p[0] === h && p[1] === k && p[2] === l);
    let newParsed: [number, number, number][];
    if (exists) {
      newParsed = parsed.filter((p) => !(p[0] === h && p[1] === k && p[2] === l));
    } else {
      newParsed = [...parsed, [h, k, l]];
    }
    setHklInput(newParsed.map((p) => `${p[0]} ${p[1]} ${p[2]}`).join(', '));
  };

  // Mouse / Touch Event Handlers
  const handleRecipMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsRecipDragging(true);
    setRecipDragStart({ x: e.clientX, y: e.clientY });
    clickStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleRecipMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = recipCanvasRef.current;
    if (!canvas) return;

    if (isRecipDragging) {
      if (e.shiftKey || e.button === 1) {
        const dx = e.clientX - recipDragStart.x;
        const dy = e.clientY - recipDragStart.y;
        setRecipPan((prev) => ({ x: prev.x + dx * 0.8, y: prev.y + dy * 0.8 }));
        setRecipDragStart({ x: e.clientX, y: e.clientY });
        return;
      }

      const dx = e.clientX - recipDragStart.x;
      const dy = e.clientY - recipDragStart.y;
      setRecipRotation((prev) => ({
        x: Math.max(-90, Math.min(90, prev.x - dy * 0.5)),
        y: prev.y + dx * 0.5,
      }));
      setRecipDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found: [number, number, number] | null = null;
    let mindist = 18;

    const cx = rect.width / 2 + recipPan.x;
    const cy = rect.height / 2 + recipPan.y;
    const maxBound = maxIndex;
    const scaleBase = Math.min(rect.width, rect.height) * 0.38 * recipZoom;
    const scale = scaleBase / (maxBound * metricTensor.aStar || 1);
    const rx = (recipRotation.x * Math.PI) / 180;
    const ry = (recipRotation.y * Math.PI) / 180;

    for (let h = -maxBound; h <= maxBound; h++) {
      for (let k = -maxBound; k <= maxBound; k++) {
        for (let l = -maxBound; l <= maxBound; l++) {
          if (h === 0 && k === 0 && l === 0) continue;

          const gVec = getCartesianReciprocalVector(h, k, l);
          const x1 = gVec.x * Math.cos(ry) - gVec.z * Math.sin(ry);
          const z1 = gVec.x * Math.sin(ry) + gVec.z * Math.cos(ry);
          const y2 = gVec.y * Math.cos(rx) - z1 * Math.sin(rx);
          const z2 = gVec.y * Math.sin(rx) + z1 * Math.cos(rx);

          let projX = cx + x1 * scale;
          let projY = cy + y2 * scale;

          if (projectionMode === 'perspective') {
            const cameraDistance = (maxBound * metricTensor.aStar + 1.5) * 2.2;
            const depthFactor = Math.max(0.2, 1 - z2 / cameraDistance);
            projX = cx + (x1 * scale) / depthFactor;
            projY = cy + (y2 * scale) / depthFactor;
          }

          const dist = Math.sqrt((mouseX - projX) ** 2 + (mouseY - projY) ** 2);
          if (dist < mindist) {
            mindist = dist;
            found = [h, k, l];
          }
        }
      }
    }
    setHoveredNode(found);
    if (found) {
      setManualProbe(found);
    }
  };

  const handleRecipWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setRecipZoom((prev) => Math.max(0.4, Math.min(3.5, prev * zoomFactor)));
  };

  const handleRecipMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsRecipDragging(false);

    if (
      Math.abs(e.clientX - clickStartPos.current.x) < 5 &&
      Math.abs(e.clientY - clickStartPos.current.y) < 5
    ) {
      if (hoveredNode) {
        toggleHKLNode(hoveredNode[0], hoveredNode[1], hoveredNode[2]);
      }
    }
  };

  // Main 3D Canvas Render Loop
  useEffect(() => {
    const canvas = recipCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina display sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Deep Dark Scientific Grid Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.5, '#050b18');
    bgGrad.addColorStop(1, '#020610');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const cx = width / 2 + recipPan.x;
    const cy = height / 2 + recipPan.y;
    const maxBound = maxIndex;
    const scaleBase = Math.min(width, height) * 0.38 * recipZoom;
    const scale = scaleBase / (maxBound * metricTensor.aStar || 1);
    const rx = (recipRotation.x * Math.PI) / 180;
    const ry = (recipRotation.y * Math.PI) / 180;

    const parsedHKLs = parseHKLString(hklInput);

    // 3D Projection math
    const project = (gx: number, gy: number, gz: number) => {
      const x1 = gx * Math.cos(ry) - gz * Math.sin(ry);
      const z1 = gx * Math.sin(ry) + gz * Math.cos(ry);
      const y2 = gy * Math.cos(rx) - z1 * Math.sin(rx);
      const z2 = gy * Math.sin(rx) + z1 * Math.cos(rx);

      let projX = cx + x1 * scale;
      let projY = cy + y2 * scale;

      if (projectionMode === 'perspective') {
        const cameraDistance = (maxBound * metricTensor.aStar + 1.5) * 2.2;
        const depthFactor = Math.max(0.2, 1 - z2 / cameraDistance);
        projX = cx + (x1 * scale) / depthFactor;
        projY = cy + (y2 * scale) / depthFactor;
      }

      return { x: projX, y: projY, z: z2 };
    };

    const elements: any[] = [];

    // Ewald Sphere Center in Å⁻¹
    // k0 points towards origin (0,0,0), with wavevector magnitude 1/λ
    const k0_mag = 1 / Math.max(0.1, wavelength);
    const omegaRad = (beamTiltOmega * Math.PI) / 180;
    const k0_center = {
      x: -k0_mag * Math.cos(omegaRad),
      y: -k0_mag * Math.sin(omegaRad),
      z: 0,
    };

    // Helper to test node visibility
    const isNodeVisible = (h: number, k: number, l: number) => {
      if (laueZoneFilter === 'ZOLZ' && l !== 0) return false;
      if (laueZoneFilter === 'FOLZ' && l !== 1) return false;
      if (laueZoneFilter === 'SOLZ' && l !== 2) return false;
      if (filterAllowedOnly) {
        if (h === 0 && k === 0 && l === 0) return true;
        const val = validateSelectionRule(system, [h, k, l]);
        if (val.status !== 'Allowed') return false;
      }
      return true;
    };

    // 1. Grid Edges & Reciprocal Nodes
    for (let h = -maxBound; h <= maxBound; h++) {
      for (let k = -maxBound; k <= maxBound; k++) {
        for (let l = -maxBound; l <= maxBound; l++) {
          if (!isNodeVisible(h, k, l)) continue;

          const gVec = getCartesianReciprocalVector(h, k, l);
          const p1 = project(gVec.x, gVec.y, gVec.z);

          // Grid line edges along principal crystallographic directions
          if (h < maxBound && isNodeVisible(h + 1, k, l)) {
            const gNext = getCartesianReciprocalVector(h + 1, k, l);
            const p2 = project(gNext.x, gNext.y, gNext.z);
            elements.push({
              type: 'edge',
              p1,
              p2,
              z: (p1.z + p2.z) / 2,
            });
          }
          if (k < maxBound && isNodeVisible(h, k + 1, l)) {
            const gNext = getCartesianReciprocalVector(h, k + 1, l);
            const p2 = project(gNext.x, gNext.y, gNext.z);
            elements.push({
              type: 'edge',
              p1,
              p2,
              z: (p1.z + p2.z) / 2,
            });
          }
          if (l < maxBound && isNodeVisible(h, k, l + 1)) {
            const gNext = getCartesianReciprocalVector(h, k, l + 1);
            const p2 = project(gNext.x, gNext.y, gNext.z);
            elements.push({
              type: 'edge',
              p1,
              p2,
              z: (p1.z + p2.z) / 2,
            });
          }

          if (h === 0 && k === 0 && l === 0) continue;

          const isSelected = parsedHKLs.some((p) => p[0] === h && p[1] === k && p[2] === l);
          const val = validateSelectionRule(system, [h, k, l]);
          const status = val.status;
          const reason = val.reason;

          // Excitation Error s_g = |k0 + g*| - 1/lambda
          const distToEwaldCenter = Math.sqrt(
            (gVec.x - k0_center.x) ** 2 +
            (gVec.y - k0_center.y) ** 2 +
            (gVec.z - k0_center.z) ** 2
          );
          const excitationError = distToEwaldCenter - k0_mag;
          const isEwaldIntersecting = showEwaldSphere && Math.abs(excitationError) <= excitationTolerance;

          elements.push({
            type: 'node',
            h,
            k,
            l,
            p: p1,
            gVec,
            isSelected,
            status,
            reason,
            excitationError,
            isEwaldIntersecting,
            z: p1.z,
          });
        }
      }
    }

    // 2. 1st Brillouin Zone Wireframe Box
    if (showBrillouinZone) {
      const bzPoints: { x: number; y: number; z: number }[] = [];
      const bzCorners = [
        [-0.5, -0.5, -0.5],
        [0.5, -0.5, -0.5],
        [0.5, 0.5, -0.5],
        [-0.5, 0.5, -0.5],
        [-0.5, -0.5, 0.5],
        [0.5, -0.5, 0.5],
        [0.5, 0.5, 0.5],
        [-0.5, 0.5, 0.5],
      ];

      bzCorners.forEach(([ch, ck, cl]) => {
        const gCorner = getCartesianReciprocalVector(ch, ck, cl);
        bzPoints.push(project(gCorner.x, gCorner.y, gCorner.z));
      });

      const bzEdges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // bottom
        [4, 5], [5, 6], [6, 7], [7, 4], // top
        [0, 4], [1, 5], [2, 6], [3, 7], // columns
      ];

      bzEdges.forEach(([i1, i2]) => {
        const p1 = bzPoints[i1];
        const p2 = bzPoints[i2];
        elements.push({
          type: 'bz-wire',
          p1,
          p2,
          color: 'rgba(56, 189, 248, 0.5)',
          z: (p1.z + p2.z) / 2,
        });
      });
    }

    // 3. Ewald Sphere Geodesic Rings & Volumetric Surface (Radius = 1/λ)
    if (showEwaldSphere) {
      const eCenterPt = project(k0_center.x, k0_center.y, k0_center.z);
      elements.push({
        type: 'ewald-sphere-surface',
        p: eCenterPt,
        radius: k0_mag,
        z: eCenterPt.z,
      });

      const ewaldPlanes = [
        { plane: 'xy', color: 'rgba(56, 189, 248, 0.35)' },
        { plane: 'xz', color: 'rgba(56, 189, 248, 0.35)' },
        { plane: 'yz', color: 'rgba(56, 189, 248, 0.35)' },
      ];

      ewaldPlanes.forEach((ring) => {
        const ringPoints: any[] = [];
        const divisions = 48;
        for (let i = 0; i <= divisions; i++) {
          const phi = (i / divisions) * 2 * Math.PI;
          let rx_val = k0_center.x;
          let ry_val = k0_center.y;
          let rz_val = k0_center.z;

          if (ring.plane === 'xy') {
            rx_val += k0_mag * Math.cos(phi);
            ry_val += k0_mag * Math.sin(phi);
          } else if (ring.plane === 'xz') {
            rx_val += k0_mag * Math.cos(phi);
            rz_val += k0_mag * Math.sin(phi);
          } else if (ring.plane === 'yz') {
            ry_val += k0_mag * Math.cos(phi);
            rz_val += k0_mag * Math.sin(phi);
          }
          ringPoints.push(project(rx_val, ry_val, rz_val));
        }

        for (let i = 0; i < divisions; i++) {
          const p1 = ringPoints[i];
          const p2 = ringPoints[i + 1];
          elements.push({
            type: 'sphere-wire',
            p1,
            p2,
            color: ring.color,
            z: (p1.z + p2.z) / 2,
          });
        }
      });
    }

    // 4. Limiting Sphere of Reflection & Volumetric Surface (Radius = 2/λ, centered at origin)
    if (showLimitingSphere) {
      const originPt = project(0, 0, 0);
      const r_limit = 2 * k0_mag;

      elements.push({
        type: 'limiting-sphere-surface',
        p: originPt,
        radius: r_limit,
        z: originPt.z,
      });

      const limPlanes = [
        { plane: 'xy', color: 'rgba(244, 63, 94, 0.25)' },
        { plane: 'xz', color: 'rgba(244, 63, 94, 0.25)' },
        { plane: 'yz', color: 'rgba(244, 63, 94, 0.25)' },
      ];

      limPlanes.forEach((ring) => {
        const ringPoints: any[] = [];
        const divisions = 48;
        for (let i = 0; i <= divisions; i++) {
          const phi = (i / divisions) * 2 * Math.PI;
          let rx_val = 0;
          let ry_val = 0;
          let rz_val = 0;

          if (ring.plane === 'xy') {
            rx_val = r_limit * Math.cos(phi);
            ry_val = r_limit * Math.sin(phi);
          } else if (ring.plane === 'xz') {
            rx_val = r_limit * Math.cos(phi);
            rz_val = r_limit * Math.sin(phi);
          } else if (ring.plane === 'yz') {
            ry_val = r_limit * Math.cos(phi);
            rz_val = r_limit * Math.sin(phi);
          }
          ringPoints.push(project(rx_val, ry_val, rz_val));
        }

        for (let i = 0; i < divisions; i++) {
          const p1 = ringPoints[i];
          const p2 = ringPoints[i + 1];
          elements.push({
            type: 'limiting-sphere-wire',
            p1,
            p2,
            color: ring.color,
            z: (p1.z + p2.z) / 2,
          });
        }
      });
    }

    // 5. Principal Reciprocal Basis Axes (a*, b*, c*)
    const origin = project(0, 0, 0);
    const axA = project(metricTensor.aStarVec.x * (maxBound + 0.6), metricTensor.aStarVec.y * (maxBound + 0.6), metricTensor.aStarVec.z * (maxBound + 0.6));
    const axB = project(metricTensor.bStarVec.x * (maxBound + 0.6), metricTensor.bStarVec.y * (maxBound + 0.6), metricTensor.bStarVec.z * (maxBound + 0.6));
    const axC = project(metricTensor.cStarVec.x * (maxBound + 0.6), metricTensor.cStarVec.y * (maxBound + 0.6), metricTensor.cStarVec.z * (maxBound + 0.6));

    elements.push({
      type: 'axis',
      p1: origin,
      p2: axA,
      label: 'a* [100]',
      color: '#ef4444',
      z: origin.z + 0.1,
    });
    elements.push({
      type: 'axis',
      p1: origin,
      p2: axB,
      label: 'b* [010]',
      color: '#10b981',
      z: origin.z + 0.1,
    });
    elements.push({
      type: 'axis',
      p1: origin,
      p2: axC,
      label: 'c* [001]',
      color: '#38bdf8',
      z: origin.z + 0.1,
    });
    elements.push({ type: 'origin', p: origin, z: origin.z });

    // 6. Wavevectors k0 & kh and Scattering Vector Q
    if (showEwaldSphere && showRecipVectors) {
      const eCenterPt = project(k0_center.x, k0_center.y, k0_center.z);

      elements.push({ type: 'ewald-center', p: eCenterPt, z: eCenterPt.z });

      // Incident wavevector k0 (from Ewald Center to Origin)
      elements.push({
        type: 'k-vector',
        p1: eCenterPt,
        p2: origin,
        color: '#38bdf8',
        label: 'k₀ (Incident)',
        z: (eCenterPt.z + origin.z) / 2 + 0.1,
      });

      // Diffracted wavevector kh (from Ewald Center to Active Probe Node)
      const activeHkl = hoveredNode || manualProbe;
      if (activeHkl) {
        const gActive = getCartesianReciprocalVector(activeHkl[0], activeHkl[1], activeHkl[2]);
        const pActive = project(gActive.x, gActive.y, gActive.z);

        elements.push({
          type: 'k-vector',
          p1: eCenterPt,
          p2: pActive,
          color: '#c084fc',
          label: 'k_h (Diffracted)',
          z: (eCenterPt.z + pActive.z) / 2 + 0.1,
        });

        // Reciprocal scattering vector g* = Q/(2pi) from Origin to Active Node
        elements.push({
          type: 'g-vector',
          p1: origin,
          p2: pActive,
          color: '#fbbf24',
          label: `g* (${activeHkl[0]} ${activeHkl[1]} ${activeHkl[2]})`,
          z: (origin.z + pActive.z) / 2 + 0.15,
        });
      }
    }

    // Sort by Z-depth for correct occlusion
    elements.sort((a, b) => a.z - b.z);

    // DRAW SORTED ELEMENTS
    elements.forEach((el) => {
      if (el.type === 'edge') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (el.type === 'bz-wire') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (el.type === 'ewald-sphere-surface' || el.type === 'limiting-sphere-surface') {
        const radiusPx = (el.radius * scale) / (projectionMode === 'perspective' ? Math.max(0.2, 1 - el.p.z / ((maxBound * metricTensor.aStar + 1.5) * 2.2)) : 1);
        if (radiusPx > 0) {
          ctx.beginPath();
          ctx.arc(el.p.x, el.p.y, radiusPx, 0, 2 * Math.PI);
          const grad = ctx.createRadialGradient(el.p.x - radiusPx * 0.3, el.p.y - radiusPx * 0.3, radiusPx * 0.1, el.p.x, el.p.y, radiusPx);
          if (el.type === 'ewald-sphere-surface') {
            grad.addColorStop(0, 'rgba(56, 189, 248, 0.1)');
            grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.04)');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0.18)');
          } else {
            grad.addColorStop(0, 'rgba(244, 63, 94, 0.08)');
            grad.addColorStop(0.7, 'rgba(244, 63, 94, 0.03)');
            grad.addColorStop(1, 'rgba(244, 63, 94, 0.12)');
          }
          ctx.fillStyle = grad;
          ctx.fill();
        }
      } else if (el.type === 'sphere-wire' || el.type === 'limiting-sphere-wire') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      } else if (el.type === 'axis') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(el.p2.y - el.p1.y, el.p2.x - el.p1.x);
        const headX = el.p2.x;
        const headY = el.p2.y;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(headX - 8 * Math.cos(angle - Math.PI / 6), headY - 8 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(headX - 8 * Math.cos(angle + Math.PI / 6), headY - 8 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = el.color;
        ctx.fill();

        // Label
        ctx.fillStyle = el.color;
        ctx.font = 'bold 9.5px monospace';
        ctx.fillText(el.label, el.p2.x + 6, el.p2.y + 3);
      } else if (el.type === 'origin') {
        ctx.beginPath();
        ctx.arc(el.p.x, el.p.y, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(0,0,0)', el.p.x + 6, el.p.y + 12);
      } else if (el.type === 'ewald-center') {
        ctx.beginPath();
        ctx.arc(el.p.x, el.p.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = 'bold 8.5px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('C (Center)', el.p.x + 6, el.p.y - 6);
      } else if (el.type === 'k-vector') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        const angle = Math.atan2(el.p2.y - el.p1.y, el.p2.x - el.p1.x);
        const headX = el.p2.x;
        const headY = el.p2.y;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(headX - 7 * Math.cos(angle - Math.PI / 6), headY - 7 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(headX - 7 * Math.cos(angle + Math.PI / 6), headY - 7 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = el.color;
        ctx.fill();

        const midX = (el.p1.x + el.p2.x) / 2;
        const midY = (el.p1.y + el.p2.y) / 2;
        ctx.fillStyle = el.color;
        ctx.font = 'bold 8.5px monospace';
        ctx.fillText(el.label, midX + 4, midY - 4);
      } else if (el.type === 'g-vector') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([4, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        const midX = (el.p1.x + el.p2.x) / 2;
        const midY = (el.p1.y + el.p2.y) / 2;
        ctx.fillStyle = el.color;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(el.label, midX + 6, midY - 6);
      } else if (el.type === 'node') {
        const isHovered = hoveredNode && hoveredNode[0] === el.h && hoveredNode[1] === el.k && hoveredNode[2] === el.l;
        const isManual = manualProbe && manualProbe[0] === el.h && manualProbe[1] === el.k && manualProbe[2] === el.l;
        const isProbeActive = isHovered || isManual;

        const baseRadius = el.isSelected ? (isProbeActive ? 9.5 : 7.0) : isProbeActive ? 7.0 : 4.5;
        const radius = baseRadius * Math.min(1.4, Math.max(0.6, recipZoom));

        // Relrod dynamic excitation glow if intersecting Ewald sphere
        if (el.isEwaldIntersecting) {
          ctx.beginPath();
          ctx.arc(el.p.x, el.p.y, radius + (showRelrodGlow ? 6 : 3), 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }

        // Selection Target Square
        if (isProbeActive) {
          ctx.beginPath();
          ctx.rect(el.p.x - (radius + 5), el.p.y - (radius + 5), (radius + 5) * 2, (radius + 5) * 2);
          ctx.strokeStyle = isHovered ? '#10b981' : '#a855f7';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([3, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        if (el.status === 'Allowed') {
          const grad = ctx.createRadialGradient(
            el.p.x - radius * 0.35,
            el.p.y - radius * 0.35,
            radius * 0.1,
            el.p.x,
            el.p.y,
            radius
          );

          if (el.isEwaldIntersecting) {
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(0.5, '#f59e0b');
            grad.addColorStop(1, '#78350f');
          } else if (el.isSelected) {
            grad.addColorStop(0, '#a7f3d0');
            grad.addColorStop(0.5, '#10b981');
            grad.addColorStop(1, '#064e3b');
          } else {
            grad.addColorStop(0, '#6ee7b7');
            grad.addColorStop(0.6, '#059669');
            grad.addColorStop(1, '#022c22');
          }

          ctx.arc(el.p.x, el.p.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = grad;
          ctx.strokeStyle = el.isSelected ? '#34d399' : el.isEwaldIntersecting ? '#fcd34d' : '#047857';
          ctx.lineWidth = el.isSelected || isProbeActive ? 1.6 : 0.8;
        } else {
          // Forbidden node: Ruby diamond marker
          ctx.moveTo(el.p.x - radius, el.p.y);
          ctx.lineTo(el.p.x, el.p.y - radius);
          ctx.lineTo(el.p.x + radius, el.p.y);
          ctx.lineTo(el.p.x, el.p.y + radius);
          ctx.closePath();

          const fgrad = ctx.createRadialGradient(el.p.x, el.p.y, 0, el.p.x, el.p.y, radius);
          fgrad.addColorStop(0, el.isSelected ? '#fca5a5' : '#991b1b');
          fgrad.addColorStop(1, el.isSelected ? '#b91c1c' : '#450a0a');
          ctx.fillStyle = fgrad;
          ctx.strokeStyle = el.isSelected ? '#f87171' : 'rgba(225, 29, 72, 0.5)';
          ctx.lineWidth = el.isSelected || isProbeActive ? 1.4 : 0.7;
        }

        ctx.globalAlpha = el.isSelected || isProbeActive || el.isEwaldIntersecting ? 1.0 : 0.65;
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Label on hover/selected
        if (el.isSelected || isProbeActive) {
          ctx.fillStyle = el.isSelected ? '#ffffff' : isHovered ? '#34d399' : '#c084fc';
          ctx.font = isProbeActive ? 'bold 9.5px monospace' : '8.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`(${el.h},${el.k},${el.l})`, el.p.x, el.p.y - radius - (isProbeActive ? 8 : 5));
        }
      }
    });

    // Draw 3D Orientation Gimbal in bottom-left
    const gx = 45;
    const gy = height - 45;
    const gLen = 24;
    const gProject = (vx: number, vy: number, vz: number) => {
      const x1 = vx * Math.cos(ry) - vz * Math.sin(ry);
      const z1 = vx * Math.sin(ry) + vz * Math.cos(ry);
      const y2 = vy * Math.cos(rx) - z1 * Math.sin(rx);
      return { x: gx + x1 * gLen, y: gy + y2 * gLen };
    };

    const ga = gProject(1, 0, 0);
    const gb = gProject(0, 1, 0);
    const gc = gProject(0, 0, 1);

    ctx.beginPath();
    ctx.arc(gx, gy, 28, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(5, 11, 24, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const gAxes = [
      { p: ga, color: '#ef4444', label: 'a*' },
      { p: gb, color: '#22c55e', label: 'b*' },
      { p: gc, color: '#38bdf8', label: 'c*' },
    ];
    gAxes.forEach((axis) => {
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(axis.p.x, axis.p.y);
      ctx.strokeStyle = axis.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(axis.p.x, axis.p.y, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = axis.color;
      ctx.fill();

      ctx.fillStyle = axis.color;
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText(axis.label, axis.p.x + (axis.p.x > gx ? 5 : -11), axis.p.y + (axis.p.y > gy ? 6 : -3));
    });

    // Calibration Overlay Text
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `ROTATION X: ${Math.round(recipRotation.x)}° Y: ${Math.round(recipRotation.y)}° | ZOOM: ${(recipZoom * 100).toFixed(0)}%`,
      12,
      56
    );
    ctx.fillText('DRAG: ROTATE | SHIFT+DRAG: PAN | SCROLL: ZOOM | CLICK: TOGGLE BUFFER', 12, 68);
  }, [
    hklInput,
    recipRotation,
    recipZoom,
    recipPan,
    system,
    metricTensor,
    hoveredNode,
    manualProbe,
    maxIndex,
    projectionMode,
    showEwaldSphere,
    showLimitingSphere,
    showBrillouinZone,
    showRecipVectors,
    showRelrodGlow,
    filterAllowedOnly,
    laueZoneFilter,
    wavelength,
    beamTiltOmega,
    goniometerPhi,
    excitationTolerance,
    getCartesianReciprocalVector,
    parseHKLString,
    validateSelectionRule,
  ]);

  // Derived Probe Diagnostics for Selected/Active Node
  const activeNodeDiagnostics = useMemo(() => {
    const node = hoveredNode || manualProbe;
    const [h, k, l] = node;
    const gVec = getCartesianReciprocalVector(h, k, l);
    const rule = validateSelectionRule(system, [h, k, l]);
    const isAllowed = rule.status === 'Allowed';

    // Bragg condition: lambda = 2 * d * sin(theta) => sin(theta) = lambda / (2*d)
    const sinTheta = gVec.dSpacing > 0 ? wavelength / (2 * gVec.dSpacing) : 0;
    const hasBraggSolution = sinTheta >= 0 && sinTheta <= 1.0;
    const thetaDeg = hasBraggSolution ? Math.asin(sinTheta) * (180 / Math.PI) : 0;
    const twoThetaDeg = thetaDeg * 2;

    // Lorentz-Polarization factor: LP(theta) = (1 + cos^2(2theta)) / (sin^2(theta) * cos(theta))
    const radTh = (thetaDeg * Math.PI) / 180;
    const rad2Th = (twoThetaDeg * Math.PI) / 180;
    const lpFactor = hasBraggSolution && radTh > 0 ? (1 + Math.cos(rad2Th) ** 2) / (Math.sin(radTh) ** 2 * Math.cos(radTh)) : 0;

    // Excitation Error s_g
    const k0_mag = 1 / Math.max(0.1, wavelength);
    const omegaRad = (beamTiltOmega * Math.PI) / 180;
    const k0_center = {
      x: -k0_mag * Math.cos(omegaRad),
      y: -k0_mag * Math.sin(omegaRad),
      z: 0,
    };
    const distToEwaldCenter = Math.sqrt(
      (gVec.x - k0_center.x) ** 2 +
      (gVec.y - k0_center.y) ** 2 +
      (gVec.z - k0_center.z) ** 2
    );
    const s_g = distToEwaldCenter - k0_mag;
    const isEwaldActive = Math.abs(s_g) <= excitationTolerance;
    const isWithinLimitingSphere = gVec.length <= 2 * k0_mag;

    return {
      h,
      k,
      l,
      gVec,
      rule,
      isAllowed,
      hasBraggSolution,
      thetaDeg,
      twoThetaDeg,
      lpFactor,
      s_g,
      isEwaldActive,
      isWithinLimitingSphere,
    };
  }, [hoveredNode, manualProbe, getCartesianReciprocalVector, validateSelectionRule, system, wavelength, beamTiltOmega, excitationTolerance]);

  // Export Full Reciprocal Matrix to CSV
  const handleExportCSV = () => {
    let csv = '# 3D RECIPROCAL SPACE PROBE CRYSTALLOGRAPHIC CATALOG\n';
    csv += `# Crystal System: ${system}\n`;
    csv += `# Cell: a=${cellA}Å, b=${cellB}Å, c=${cellC}Å, alpha=${cellAlpha}°, beta=${cellBeta}°, gamma=${cellGamma}°\n`;
    csv += `# Reciprocal Metric: a*=${metricTensor.aStar.toFixed(4)}Å⁻¹, b*=${metricTensor.bStar.toFixed(4)}Å⁻¹, c*=${metricTensor.cStar.toFixed(4)}Å⁻¹, V=${metricTensor.V.toFixed(2)}Å³\n`;
    csv += `# Radiation Wavelength: ${wavelength}Å (k0 = ${(1/wavelength).toFixed(4)}Å⁻¹)\n\n`;
    csv += 'h,k,l,d_Spacing_A,Q_Magnitude_invA,gx_invA,gy_invA,gz_invA,TwoTheta_deg,Status,Excitation_Error_sg_invA,Ewald_Resonance\n';

    const maxBound = maxIndex;
    for (let h = -maxBound; h <= maxBound; h++) {
      for (let k = -maxBound; k <= maxBound; k++) {
        for (let l = -maxBound; l <= maxBound; l++) {
          if (h === 0 && k === 0 && l === 0) continue;
          const gVec = getCartesianReciprocalVector(h, k, l);
          const rule = validateSelectionRule(system, [h, k, l]);
          const sinTh = gVec.dSpacing > 0 ? wavelength / (2 * gVec.dSpacing) : 0;
          const twoTh = sinTh <= 1.0 ? (Math.asin(sinTh) * (360 / Math.PI)).toFixed(3) : 'N/A';

          const k0_mag = 1 / wavelength;
          const omegaRad = (beamTiltOmega * Math.PI) / 180;
          const k0_center = { x: -k0_mag * Math.cos(omegaRad), y: -k0_mag * Math.sin(omegaRad), z: 0 };
          const dist = Math.sqrt((gVec.x - k0_center.x)**2 + (gVec.y - k0_center.y)**2 + (gVec.z - k0_center.z)**2);
          const sg = dist - k0_mag;
          const isRes = Math.abs(sg) <= excitationTolerance ? 'ACTIVE' : 'OFF';

          csv += `${h},${k},${l},${gVec.dSpacing.toFixed(4)},${gVec.qMagnitude.toFixed(4)},${gVec.x.toFixed(4)},${gVec.y.toFixed(4)},${gVec.z.toFixed(4)},${twoTh},${rule.status},${sg.toFixed(5)},${isRes}\n`;
        }
      }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reciprocal_Space_Matrix_${system}_max${maxBound}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-5 bg-[#070c18] rounded-2xl border-2 border-slate-800/90 shadow-2xl relative isolate overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 blur-[100px] pointer-events-none" />

      {/* 1. Header & Presets Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>3D Reciprocal Space & Ewald Sphere Probe</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Metric Tensor Engine
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Direct & Reciprocal Metric Tensors • Dynamic Ewald Sphere • Excitation Error ($s_g$) • Brillouin Zone
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsOrbiting(!isOrbiting)}
            className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] flex items-center transition-all uppercase tracking-wider font-bold cursor-pointer ${
              isOrbiting
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isOrbiting ? <Pause className="w-3 h-3 mr-1.5 text-cyan-400" /> : <Play className="w-3 h-3 mr-1.5" />}
            {isOrbiting ? 'Orbiting' : 'Auto-Orbit'}
          </button>

          <button
            type="button"
            onClick={() => setRecipRotation({ x: 22, y: -40 })}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center hover:text-white transition-all uppercase tracking-wider font-bold cursor-pointer"
          >
            <RotateCw className="w-3 h-3 mr-1.5 text-slate-400" /> Reset View
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer"
          >
            <FileSpreadsheet className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. Benchmark Crystallographic Presets Ribbon */}
      <div className="bg-[#030712] p-2.5 rounded-xl border border-slate-800/90 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap pl-1">
          Preset Crystals:
        </span>
        <div className="flex items-center gap-1.5">
          {RECIPROCAL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedPresetId === preset.id
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main 3D Canvas Box & Zone Axis Orienteer */}
      <div className="space-y-2">
        {/* Zone Axis Orienteer Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#030712] p-2 rounded-xl border border-slate-800/90">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider pl-1 mr-1">
              Zone Axes:
            </span>
            <button
              type="button"
              onClick={() => { setRecipRotation({ x: 0, y: 0 }); setIsOrbiting(false); }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 hover:text-cyan-300 font-bold uppercase transition-all cursor-pointer"
            >
              [100] Front
            </button>
            <button
              type="button"
              onClick={() => { setRecipRotation({ x: 0, y: 90 }); setIsOrbiting(false); }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 hover:text-cyan-300 font-bold uppercase transition-all cursor-pointer"
            >
              [010] Side
            </button>
            <button
              type="button"
              onClick={() => { setRecipRotation({ x: 90, y: 0 }); setIsOrbiting(false); }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 hover:text-cyan-300 font-bold uppercase transition-all cursor-pointer"
            >
              [001] Top
            </button>
            <button
              type="button"
              onClick={() => { setRecipRotation({ x: 35.26, y: -45 }); setIsOrbiting(false); }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 hover:text-cyan-300 font-bold uppercase transition-all cursor-pointer"
            >
              [111] Diag
            </button>
            <button
              type="button"
              onClick={() => { setRecipRotation({ x: 22, y: -40 }); setIsOrbiting(false); }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 hover:text-cyan-300 font-bold uppercase transition-all cursor-pointer"
            >
              Isometric
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-slate-400 mr-2">
              V(cell): <strong className="text-cyan-300">{metricTensor.V.toFixed(2)} Å³</strong>
            </span>
          </div>
        </div>

        {/* 3D Canvas Box */}
        <div className="relative rounded-2xl border border-slate-800 overflow-hidden cursor-grab active:cursor-grabbing bg-[#020610] shadow-inner">
          <canvas
            ref={recipCanvasRef}
            onMouseDown={handleRecipMouseDown}
            onMouseMove={handleRecipMouseMove}
            onMouseUp={handleRecipMouseUp}
            onWheel={handleRecipWheel}
            onMouseLeave={() => {
              setIsRecipDragging(false);
              setHoveredNode(null);
            }}
            className="w-full h-[380px] block"
          />

          {/* Top-Left Zoom & Reset Floating Overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
            <div className="flex rounded-xl border border-slate-800 bg-slate-950/90 backdrop-blur-md p-0.5 shadow-xl">
              <button
                type="button"
                title="Zoom In"
                onClick={() => setRecipZoom((z) => Math.min(3.5, z * 1.15))}
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-mono font-bold transition-all cursor-pointer"
              >
                +
              </button>
              <button
                type="button"
                title="Zoom Out"
                onClick={() => setRecipZoom((z) => Math.max(0.4, z / 1.15))}
                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-mono font-bold transition-all cursor-pointer"
              >
                -
              </button>
              <button
                type="button"
                title="Reset Pan & Zoom"
                onClick={() => {
                  setRecipZoom(1.15);
                  setRecipPan({ x: 0, y: 0 });
                }}
                className="px-2.5 h-7 flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg text-[10px] font-mono font-bold uppercase transition-all border-l border-slate-800 cursor-pointer"
              >
                1:1
              </button>
            </div>
          </div>

          {/* Top-Right Legend */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-2 pointer-events-none z-20">
            <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl text-[10px] font-mono font-bold uppercase tracking-wider pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-emerald-400" />
                <span className="text-emerald-400">Allowed Node</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-rose-600 rotate-45 shadow-[0_0_8px_rgba(225,29,72,0.5)] border border-rose-500" />
                <span className="text-rose-400">Forbidden Node</span>
              </div>
              {showEwaldSphere && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] border border-amber-400" />
                  <span className="text-amber-400">Ewald Resonant</span>
                </div>
              )}
              {showBrillouinZone && (
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-0.5 bg-sky-400" />
                  <span className="text-sky-300">1st BZ Zone</span>
                </div>
              )}
              {showLimitingSphere && (
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-0.5 border-b border-dashed border-rose-400" />
                  <span className="text-rose-300">Limiting Sphere</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom-Right Active Node Quick Inspector Card */}
          <div className="absolute bottom-3 right-3 p-3 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl text-[10px] font-mono text-slate-300 shadow-2xl pointer-events-none max-w-[280px] space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
              <span className="font-black text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                Reflection ({activeNodeDiagnostics.h} {activeNodeDiagnostics.k} {activeNodeDiagnostics.l})
              </span>
              <span
                className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${
                  activeNodeDiagnostics.isAllowed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {activeNodeDiagnostics.rule.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9.5px]">
              <div>
                <span className="text-slate-500">d(hkl):</span>{' '}
                <span className="font-bold text-amber-300">
                  {activeNodeDiagnostics.gVec.dSpacing > 0 ? `${activeNodeDiagnostics.gVec.dSpacing.toFixed(4)} Å` : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">|Q|:</span>{' '}
                <span className="font-bold text-cyan-300">
                  {activeNodeDiagnostics.gVec.qMagnitude > 0 ? `${activeNodeDiagnostics.gVec.qMagnitude.toFixed(4)} Å⁻¹` : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">2θ:</span>{' '}
                <span className="font-bold text-purple-300">
                  {activeNodeDiagnostics.hasBraggSolution ? `${activeNodeDiagnostics.twoThetaDeg.toFixed(2)}°` : 'Extinct / No Sol.'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Excitation s_g:</span>{' '}
                <span className={`font-bold ${activeNodeDiagnostics.isEwaldActive ? 'text-amber-400' : 'text-slate-400'}`}>
                  {activeNodeDiagnostics.s_g > 0 ? `+${activeNodeDiagnostics.s_g.toFixed(4)}` : activeNodeDiagnostics.s_g.toFixed(4)} Å⁻¹
                </span>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 border-t border-slate-800/80 pt-1 leading-relaxed">
              {activeNodeDiagnostics.isEwaldActive && activeNodeDiagnostics.isAllowed ? (
                <span className="text-amber-300 font-bold">
                  ⚡ DIFFRACTION ACTIVE: Lies on Ewald boundary (s_g ≈ 0).
                </span>
              ) : (
                <span>{activeNodeDiagnostics.rule.reason}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Precision Miller Index (h k l) Stepper Dial & Buffer Injector */}
      <div className="p-4 bg-[#030712] rounded-xl border border-slate-800 space-y-3">
        <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>PRECISION MILLER INDEX (h k l) PROBE DIAL</span>
          </div>
          <span className="text-[9px] font-mono text-slate-500">Direct Vector Targeting</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* H Index */}
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400 mb-1.5 uppercase">Index h</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextH = Math.max(-maxIndex, manualProbe[0] - 1);
                  setManualProbe([nextH, manualProbe[1], manualProbe[2]]);
                }}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono font-bold text-sm transition-all cursor-pointer flex items-center justify-center"
              >
                -
              </button>
              <span className="text-base font-mono font-black text-cyan-400 w-8 text-center">
                {manualProbe[0]}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextH = Math.min(maxIndex, manualProbe[0] + 1);
                  setManualProbe([nextH, manualProbe[1], manualProbe[2]]);
                }}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono font-bold text-sm transition-all cursor-pointer flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* K Index */}
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400 mb-1.5 uppercase">Index k</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextK = Math.max(-maxIndex, manualProbe[1] - 1);
                  setManualProbe([manualProbe[0], nextK, manualProbe[2]]);
                }}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono font-bold text-sm transition-all cursor-pointer flex items-center justify-center"
              >
                -
              </button>
              <span className="text-base font-mono font-black text-cyan-400 w-8 text-center">
                {manualProbe[1]}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextK = Math.min(maxIndex, manualProbe[1] + 1);
                  setManualProbe([manualProbe[0], nextK, manualProbe[2]]);
                }}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono font-bold text-sm transition-all cursor-pointer flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* L Index */}
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400 mb-1.5 uppercase">Index l</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const nextL = Math.max(-maxIndex, manualProbe[2] - 1);
                  setManualProbe([manualProbe[0], manualProbe[1], nextL]);
                }}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono font-bold text-sm transition-all cursor-pointer flex items-center justify-center"
              >
                -
              </button>
              <span className="text-base font-mono font-black text-cyan-400 w-8 text-center">
                {manualProbe[2]}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextL = Math.min(maxIndex, manualProbe[2] + 1);
                  setManualProbe([manualProbe[0], manualProbe[1], nextL]);
                }}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono font-bold text-sm transition-all cursor-pointer flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (manualProbe[0] === 0 && manualProbe[1] === 0 && manualProbe[2] === 0) return;
            toggleHKLNode(manualProbe[0], manualProbe[1], manualProbe[2]);
          }}
          className={`w-full py-2.5 px-4 rounded-xl border text-[11px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            (() => {
              const parsed = parseHKLString(hklInput);
              const exists = parsed.some((p) => p[0] === manualProbe[0] && p[1] === manualProbe[1] && p[2] === manualProbe[2]);
              return exists
                ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300';
            })()
          }`}
        >
          <Check className="w-4 h-4 shrink-0" />
          {(() => {
            const parsed = parseHKLString(hklInput);
            const exists = parsed.some((p) => p[0] === manualProbe[0] && p[1] === manualProbe[1] && p[2] === manualProbe[2]);
            return exists
              ? `Remove Reflection (${manualProbe[0]} ${manualProbe[1]} ${manualProbe[2]}) from Analysis Buffer`
              : `Inject Reflection (${manualProbe[0]} ${manualProbe[1]} ${manualProbe[2]}) into Analysis Buffer`;
          })()}
        </button>
      </div>

      {/* 5. Comprehensive Scientific Calibration & Ewald Core Controls */}
      <div className="p-4 bg-[#030712] rounded-xl border border-slate-800 space-y-4">
        <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Sliders className="w-3.5 h-3.5" />
            INSTRUMENT CALIBRATION & EWALD PROJECTION RIG
          </span>
          <span className="text-[9px] font-mono text-slate-500">Real-time Scattering Parameters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: View & Visual Layer Toggles */}
          <div className="space-y-3">
            {/* Projection Mode */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Camera Projection:</span>
              <div className="flex rounded-lg border border-slate-800 p-0.5 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setProjectionMode('perspective')}
                  className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold transition-all uppercase cursor-pointer ${
                    projectionMode === 'perspective' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Perspective
                </button>
                <button
                  type="button"
                  onClick={() => setProjectionMode('ortho')}
                  className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold transition-all uppercase cursor-pointer ${
                    projectionMode === 'ortho' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Ortho
                </button>
              </div>
            </div>

            {/* Ewald Sphere Toggle */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Ewald Sphere (1/λ):</span>
              <button
                type="button"
                onClick={() => setShowEwaldSphere(!showEwaldSphere)}
                className={`px-3 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  showEwaldSphere
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {showEwaldSphere ? 'VISIBLE' : 'HIDDEN'}
              </button>
            </div>

            {/* 1st Brillouin Zone */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">1st Brillouin Zone:</span>
              <button
                type="button"
                onClick={() => setShowBrillouinZone(!showBrillouinZone)}
                className={`px-3 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  showBrillouinZone
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {showBrillouinZone ? 'ON (Wigner-Seitz)' : 'OFF'}
              </button>
            </div>

            {/* Limiting Sphere */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Limiting Sphere (2/λ):</span>
              <button
                type="button"
                onClick={() => setShowLimitingSphere(!showLimitingSphere)}
                className={`px-3 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  showLimitingSphere
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {showLimitingSphere ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Vectors & Scattering Ray */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Scattering Vectors (k₀, k_h, g*):</span>
              <button
                type="button"
                onClick={() => setShowRecipVectors(!showRecipVectors)}
                className={`px-3 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  showRecipVectors
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {showRecipVectors ? 'SHOW' : 'HIDE'}
              </button>
            </div>

            {/* Laue Zone Selection */}
            <div className="flex flex-col gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Laue Zone Filter:</span>
              <div className="grid grid-cols-4 gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                {(['ALL', 'ZOLZ', 'FOLZ', 'SOLZ'] as const).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setLaueZoneFilter(zone)}
                    className={`py-1 text-[9.5px] font-mono font-bold uppercase rounded-md transition-all cursor-pointer ${
                      laueZoneFilter === zone
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Wavelength & Goniometer Controls */}
          <div className="space-y-3.5">
            {/* Radiation Source Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                Radiation Source Preset:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Cu-Kα', wl: 1.54056 },
                  { label: 'Mo-Kα', wl: 0.71073 },
                  { label: 'Co-Kα', wl: 1.78901 },
                  { label: 'Cr-Kα', wl: 2.28970 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setWavelength(preset.wl)}
                    className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                      Math.abs(wavelength - preset.wl) < 0.001
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wavelength Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Wavelength (λ):</span>
                <span className="font-bold text-cyan-400">{wavelength.toFixed(5)} Å</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="3.0"
                step="0.01"
                value={wavelength}
                onChange={(e) => setWavelength(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Beam Incident Angle Omega */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Incident Beam Tilt (ω):</span>
                <span className="font-bold text-amber-400">{beamTiltOmega.toFixed(1)}°</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={beamTiltOmega}
                  onChange={(e) => setBeamTiltOmega(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                {beamTiltOmega !== 0 && (
                  <button
                    type="button"
                    onClick={() => setBeamTiltOmega(0)}
                    className="px-2 py-0.5 text-[9px] font-mono text-slate-400 hover:text-white bg-slate-800 rounded border border-slate-700 cursor-pointer shrink-0"
                  >
                    0°
                  </button>
                )}
              </div>
            </div>

            {/* Goniometer Azimuthal Rotation Phi */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Crystal Azimuth (ϕ):</span>
                <span className="font-bold text-purple-400">{goniometerPhi.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={goniometerPhi}
                onChange={(e) => setGoniometerPhi(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
