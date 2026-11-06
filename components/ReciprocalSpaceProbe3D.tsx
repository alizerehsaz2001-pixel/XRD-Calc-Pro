import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  RotateCw,
  Play,
  Pause,
  Compass,
  Check,
  Layers,
  Sliders,
  FileSpreadsheet,
  Zap,
  Target,
  Grid,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye
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
    gamma: 90
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
    gamma: 90
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
    gamma: 90
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
    gamma: 90
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
    gamma: 120
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
    gamma: 120
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
    gamma: 90
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
    gamma: 90
  },
  {
    id: 'forsterite-ortho',
    name: 'Forsterite (Mg₂SiO₄)',
    system: 'Orthorhombic',
    formula: 'Mg2SiO4',
    spaceGroup: 'Pnma (62)',
    a: 10.19,
    b: 5.978,
    c: 4.753,
    alpha: 90,
    beta: 90,
    gamma: 90
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
    gamma: 120
  }
];

const RADIATION_SOURCES = [
  { id: 'cu', label: 'Cu-Kα', wl: 1.54056, energyKeV: '8.05 keV' },
  { id: 'mo', label: 'Mo-Kα', wl: 0.71073, energyKeV: '17.48 keV' },
  { id: 'co', label: 'Co-Kα', wl: 1.78901, energyKeV: '6.93 keV' },
  { id: 'cr', label: 'Cr-Kα', wl: 2.2897, energyKeV: '5.41 keV' },
  { id: 'ag', label: 'Ag-Kα', wl: 0.55941, energyKeV: '22.16 keV' },
  { id: 'sync', label: 'Synch. 30keV', wl: 0.41328, energyKeV: '30.0 keV' },
  { id: 'tem', label: 'TEM 200kV', wl: 0.02508, energyKeV: '200 keV e⁻' }
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
  useTranslation();

  // Preset Selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('si-diamond');

  // Custom Lattice Metric Tensor State
  const [cellA, setCellA] = useState<number>(5.4309);
  const [cellB, setCellB] = useState<number>(5.4309);
  const [cellC, setCellC] = useState<number>(5.4309);
  const [cellAlpha, setCellAlpha] = useState<number>(90);
  const [cellBeta, setCellBeta] = useState<number>(90);
  const [cellGamma, setCellGamma] = useState<number>(90);
  const [showMetricEditor, setShowMetricEditor] = useState<boolean>(false);

  // 3D Camera & Orientation State
  const [recipRotation, setRecipRotation] = useState({ x: 22, y: -38 });
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

  // Scientific visual layers & viewport mode
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
  const [excitationTolerance, setExcitationTolerance] = useState<number>(0.055); // Tolerance in Å⁻¹

  // Physical Radiation & Goniometer
  const [wavelength, setWavelength] = useState<number>(1.54056); // Cu-Kα in Å
  const [beamTiltOmega, setBeamTiltOmega] = useState<number>(14.2); // Incident beam rotation angle (deg)
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
    const VStar = 1 / V;

    // Reciprocal Lattice Lengths in Å⁻¹
    const aStar = (b * c * sinA) / V;
    const bStar = (a * c * sinB) / V;
    const cStar = (a * b * sinG) / V;

    // Reciprocal Angles
    const cosAlphaStar = (cosB * cosG - cosA) / Math.max(1e-5, sinB * sinG);
    const cosBetaStar = (cosA * cosG - cosB) / Math.max(1e-5, sinA * sinG);
    const cosGammaStar = (cosA * cosB - cosG) / Math.max(1e-5, sinA * sinB);

    const alphaStarDeg = (Math.acos(Math.max(-1, Math.min(1, cosAlphaStar))) * 180) / Math.PI;
    const betaStarDeg = (Math.acos(Math.max(-1, Math.min(1, cosBetaStar))) * 180) / Math.PI;
    const gammaStarDeg = (Math.acos(Math.max(-1, Math.min(1, cosGammaStar))) * 180) / Math.PI;

    const sinGammaStar = Math.sqrt(Math.max(0.0001, 1 - cosGammaStar * cosGammaStar));

    // Cartesian Coordinates for Reciprocal Basis Vectors a*, b*, c* (in Å⁻¹)
    const aStarVec = { x: aStar, y: 0, z: 0 };
    const bStarVec = { x: bStar * cosGammaStar, y: bStar * sinGammaStar, z: 0 };
    const cStarVec = {
      x: cStar * cosBetaStar,
      y: (cStar * (cosAlphaStar - cosBetaStar * cosGammaStar)) / sinGammaStar,
      z: 1 / c
    };

    return {
      V,
      VStar,
      aStar,
      bStar,
      cStar,
      alphaStarDeg,
      betaStarDeg,
      gammaStarDeg,
      aStarVec,
      bStarVec,
      cStarVec
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

  // Compute all Ewald-resonant reflections across the current lattice
  const ewaldResonantNodes = useMemo(() => {
    const k0_mag = 1 / Math.max(0.01, wavelength);
    const omegaRad = (beamTiltOmega * Math.PI) / 180;
    const k0_center = {
      x: -k0_mag * Math.cos(omegaRad),
      y: -k0_mag * Math.sin(omegaRad),
      z: 0
    };

    const list: {
      h: number;
      k: number;
      l: number;
      dSpacing: number;
      qMag: number;
      sg: number;
      twoTheta: number;
      gx: number;
      gy: number;
      gz: number;
      intensityWeight: number;
    }[] = [];

    const maxBound = maxIndex;
    for (let h = -maxBound; h <= maxBound; h++) {
      for (let k = -maxBound; k <= maxBound; k++) {
        for (let l = -maxBound; l <= maxBound; l++) {
          if (h === 0 && k === 0 && l === 0) continue;
          const rule = validateSelectionRule(system, [h, k, l]);
          if (rule.status !== 'Allowed') continue;

          const gVec = getCartesianReciprocalVector(h, k, l);
          const distToCenter = Math.hypot(
            gVec.x - k0_center.x,
            gVec.y - k0_center.y,
            gVec.z - k0_center.z
          );
          const sg = distToCenter - k0_mag;
          if (Math.abs(sg) <= excitationTolerance) {
            const sinTh = gVec.dSpacing > 0 ? wavelength / (2 * gVec.dSpacing) : 0;
            const twoTheta = sinTh <= 1 ? (2 * Math.asin(sinTh) * 180) / Math.PI : 0;
            const normSg = sg / Math.max(0.005, excitationTolerance);
            const intensityWeight = Math.exp(-2.2 * normSg * normSg);
            list.push({
              h,
              k,
              l,
              dSpacing: gVec.dSpacing,
              qMag: gVec.qMagnitude,
              sg,
              twoTheta,
              gx: gVec.x,
              gy: gVec.y,
              gz: gVec.z,
              intensityWeight
            });
          }
        }
      }
    }
    return list.sort((a, b) => Math.abs(a.sg) - Math.abs(b.sg));
  }, [
    wavelength,
    beamTiltOmega,
    maxIndex,
    validateSelectionRule,
    system,
    getCartesianReciprocalVector,
    excitationTolerance
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
    const lpFactor =
      hasBraggSolution && radTh > 0
        ? (1 + Math.cos(rad2Th) ** 2) / (Math.sin(radTh) ** 2 * Math.cos(radTh))
        : 0;

    // Excitation Error s_g
    const k0_mag = 1 / Math.max(0.01, wavelength);
    const omegaRad = (beamTiltOmega * Math.PI) / 180;
    const k0_center = {
      x: -k0_mag * Math.cos(omegaRad),
      y: -k0_mag * Math.sin(omegaRad),
      z: 0
    };
    const distToEwaldCenter = Math.sqrt(
      (gVec.x - k0_center.x) ** 2 +
        (gVec.y - k0_center.y) ** 2 +
        (gVec.z - k0_center.z) ** 2
    );
    const s_g = distToEwaldCenter - k0_mag;
    const isEwaldActive = Math.abs(s_g) <= excitationTolerance;
    const isWithinLimitingSphere = gVec.length <= 2 * k0_mag;

    // Compute exact omega tilt in XY plane that brings this reflection onto Ewald sphere (s_g = 0)
    // Condition: |g - k0_center|^2 = k0^2 => g^2 - 2*k0*(gx*cos(w) + gy*sin(w)) = 0
    // => gx*cos(w) + gy*sin(w) = -g^2 / (2*k0)
    const gxy = Math.hypot(gVec.x, gVec.y);
    let exactBraggOmega: number | null = null;
    if (gxy > 1e-5) {
      const rhs = -(gVec.length * gVec.length) / (2 * k0_mag * gxy);
      if (Math.abs(rhs) <= 1.0) {
        const baseAngle = Math.atan2(gVec.y, gVec.x);
        const acosVal = Math.acos(rhs);
        let w1 = ((baseAngle + acosVal) * 180) / Math.PI;
        let w2 = ((baseAngle - acosVal) * 180) / Math.PI;
        const normAngle = (a: number) => {
          let r = ((a + 180) % 360 + 360) % 360 - 180;
          return r;
        };
        w1 = normAngle(w1);
        w2 = normAngle(w2);
        exactBraggOmega = Math.abs(w1 - beamTiltOmega) < Math.abs(w2 - beamTiltOmega) ? w1 : w2;
      }
    }

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
      exactBraggOmega
    };
  }, [
    hoveredNode,
    manualProbe,
    getCartesianReciprocalVector,
    validateSelectionRule,
    system,
    wavelength,
    beamTiltOmega,
    excitationTolerance
  ]);

  // Snap Incident Beam Tilt Omega to exact Bragg resonance for active reflection
  const handleSnapToBraggCondition = () => {
    if (activeNodeDiagnostics.exactBraggOmega !== null) {
      const clamped = Math.max(-90, Math.min(90, Number(activeNodeDiagnostics.exactBraggOmega.toFixed(2))));
      setBeamTiltOmega(clamped);
    } else if (activeNodeDiagnostics.hasBraggSolution) {
      setBeamTiltOmega(Number(activeNodeDiagnostics.thetaDeg.toFixed(2)));
    }
  };

  // Mouse / Touch Event Handlers for 3D Canvas
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
        y: prev.y + dx * 0.5
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
    if (activeViewTab !== '3d_lattice') return;
    const canvas = recipCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Deep Calibrated Scientific Canvas Background
    const bgGrad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.45,
      10,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.75
    );
    bgGrad.addColorStop(0, '#071022');
    bgGrad.addColorStop(0.55, '#040914');
    bgGrad.addColorStop(1, '#02050b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Coordinate Reticle Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 36) {
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

    // Ewald Sphere Center in Å⁻¹ (for ultra-short TEM wavelengths, clamp visual display radius while keeping exact s_g physics)
    const k0_mag_exact = 1 / Math.max(0.01, wavelength);
    const k0_mag_visual = Math.min(k0_mag_exact, maxBound * metricTensor.aStar * 2.4);
    const omegaRad = (beamTiltOmega * Math.PI) / 180;
    const k0_center_exact = {
      x: -k0_mag_exact * Math.cos(omegaRad),
      y: -k0_mag_exact * Math.sin(omegaRad),
      z: 0
    };
    const k0_center_visual = {
      x: -k0_mag_visual * Math.cos(omegaRad),
      y: -k0_mag_visual * Math.sin(omegaRad),
      z: 0
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

          if (h < maxBound && isNodeVisible(h + 1, k, l)) {
            const gNext = getCartesianReciprocalVector(h + 1, k, l);
            const p2 = project(gNext.x, gNext.y, gNext.z);
            elements.push({
              type: 'edge',
              p1,
              p2,
              z: (p1.z + p2.z) / 2
            });
          }
          if (k < maxBound && isNodeVisible(h, k + 1, l)) {
            const gNext = getCartesianReciprocalVector(h, k + 1, l);
            const p2 = project(gNext.x, gNext.y, gNext.z);
            elements.push({
              type: 'edge',
              p1,
              p2,
              z: (p1.z + p2.z) / 2
            });
          }
          if (l < maxBound && isNodeVisible(h, k, l + 1)) {
            const gNext = getCartesianReciprocalVector(h, k, l + 1);
            const p2 = project(gNext.x, gNext.y, gNext.z);
            elements.push({
              type: 'edge',
              p1,
              p2,
              z: (p1.z + p2.z) / 2
            });
          }

          if (h === 0 && k === 0 && l === 0) continue;

          const isSelected = parsedHKLs.some((p) => p[0] === h && p[1] === k && p[2] === l);
          const val = validateSelectionRule(system, [h, k, l]);
          const status = val.status;
          const reason = val.reason;

          // Excitation Error s_g = |k0 + g*| - 1/lambda
          const distToEwaldCenter = Math.sqrt(
            (gVec.x - k0_center_exact.x) ** 2 +
              (gVec.y - k0_center_exact.y) ** 2 +
              (gVec.z - k0_center_exact.z) ** 2
          );
          const excitationError = distToEwaldCenter - k0_mag_exact;
          const isEwaldIntersecting =
            showEwaldSphere && Math.abs(excitationError) <= excitationTolerance;

          // Relrod spike endpoints along c* if enabled and node is allowed
          if (showRelrodGlow && status === 'Allowed' && (isEwaldIntersecting || isSelected)) {
            const relHalfLen = metricTensor.cStar * 0.28;
            const rTop = project(gVec.x, gVec.y, gVec.z + relHalfLen);
            const rBot = project(gVec.x, gVec.y, gVec.z - relHalfLen);
            elements.push({
              type: 'relrod-spike',
              p1: rBot,
              p2: rTop,
              isEwaldIntersecting,
              z: p1.z - 0.01
            });
          }

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
            z: p1.z
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
        [-0.5, 0.5, 0.5]
      ];

      bzCorners.forEach(([ch, ck, cl]) => {
        const gCorner = getCartesianReciprocalVector(ch, ck, cl);
        bzPoints.push(project(gCorner.x, gCorner.y, gCorner.z));
      });

      const bzEdges = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7]
      ];

      bzEdges.forEach(([i1, i2]) => {
        const p1 = bzPoints[i1];
        const p2 = bzPoints[i2];
        elements.push({
          type: 'bz-wire',
          p1,
          p2,
          color: 'rgba(56, 189, 248, 0.55)',
          z: (p1.z + p2.z) / 2
        });
      });
    }

    // 3. Ewald Sphere Geodesic Rings & Volumetric Surface (Radius = 1/λ)
    if (showEwaldSphere) {
      const eCenterPt = project(k0_center_visual.x, k0_center_visual.y, k0_center_visual.z);
      elements.push({
        type: 'ewald-sphere-surface',
        p: eCenterPt,
        radius: k0_mag_visual,
        z: eCenterPt.z
      });

      const ewaldPlanes = [
        { plane: 'xy', color: 'rgba(34, 211, 238, 0.55)', width: 1.5 },
        { plane: 'xz', color: 'rgba(56, 189, 248, 0.32)', width: 1.0 },
        { plane: 'yz', color: 'rgba(56, 189, 248, 0.32)', width: 1.0 },
        { plane: 'lat_pos', color: 'rgba(56, 189, 248, 0.18)', width: 0.8 },
        { plane: 'lat_neg', color: 'rgba(56, 189, 248, 0.18)', width: 0.8 }
      ];

      ewaldPlanes.forEach((ring) => {
        const ringPoints: any[] = [];
        const divisions = 60;
        for (let i = 0; i <= divisions; i++) {
          const phi = (i / divisions) * 2 * Math.PI;
          let rx_val = k0_center_visual.x;
          let ry_val = k0_center_visual.y;
          let rz_val = k0_center_visual.z;

          if (ring.plane === 'xy') {
            rx_val += k0_mag_visual * Math.cos(phi);
            ry_val += k0_mag_visual * Math.sin(phi);
          } else if (ring.plane === 'xz') {
            rx_val += k0_mag_visual * Math.cos(phi);
            rz_val += k0_mag_visual * Math.sin(phi);
          } else if (ring.plane === 'yz') {
            ry_val += k0_mag_visual * Math.cos(phi);
            rz_val += k0_mag_visual * Math.sin(phi);
          } else if (ring.plane === 'lat_pos') {
            const subR = k0_mag_visual * Math.cos(Math.PI / 4);
            rx_val += subR * Math.cos(phi);
            ry_val += subR * Math.sin(phi);
            rz_val += k0_mag_visual * Math.sin(Math.PI / 4);
          } else if (ring.plane === 'lat_neg') {
            const subR = k0_mag_visual * Math.cos(Math.PI / 4);
            rx_val += subR * Math.cos(phi);
            ry_val += subR * Math.sin(phi);
            rz_val -= k0_mag_visual * Math.sin(Math.PI / 4);
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
            lineWidth: ring.width,
            z: (p1.z + p2.z) / 2
          });
        }
      });
    }

    // 4. Limiting Sphere of Reflection (Radius = 2/λ, centered at origin)
    if (showLimitingSphere) {
      const originPt = project(0, 0, 0);
      const r_limit = 2 * k0_mag_visual;

      elements.push({
        type: 'limiting-sphere-surface',
        p: originPt,
        radius: r_limit,
        z: originPt.z
      });

      const limPlanes = [
        { plane: 'xy', color: 'rgba(244, 63, 94, 0.35)' },
        { plane: 'xz', color: 'rgba(244, 63, 94, 0.22)' },
        { plane: 'yz', color: 'rgba(244, 63, 94, 0.22)' }
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
            z: (p1.z + p2.z) / 2
          });
        }
      });
    }

    // 5. Principal Reciprocal Basis Axes (a*, b*, c*)
    const origin = project(0, 0, 0);
    const axA = project(
      metricTensor.aStarVec.x * (maxBound + 0.55),
      metricTensor.aStarVec.y * (maxBound + 0.55),
      metricTensor.aStarVec.z * (maxBound + 0.55)
    );
    const axB = project(
      metricTensor.bStarVec.x * (maxBound + 0.55),
      metricTensor.bStarVec.y * (maxBound + 0.55),
      metricTensor.bStarVec.z * (maxBound + 0.55)
    );
    const axC = project(
      metricTensor.cStarVec.x * (maxBound + 0.55),
      metricTensor.cStarVec.y * (maxBound + 0.55),
      metricTensor.cStarVec.z * (maxBound + 0.55)
    );

    elements.push({
      type: 'axis',
      p1: origin,
      p2: axA,
      label: 'a* [100]',
      color: '#f87171',
      z: origin.z + 0.1
    });
    elements.push({
      type: 'axis',
      p1: origin,
      p2: axB,
      label: 'b* [010]',
      color: '#34d399',
      z: origin.z + 0.1
    });
    elements.push({
      type: 'axis',
      p1: origin,
      p2: axC,
      label: 'c* [001]',
      color: '#38bdf8',
      z: origin.z + 0.1
    });
    elements.push({ type: 'origin', p: origin, z: origin.z });

    // 6. Wavevectors k0 & kh, Scattering Triangle Fill, and Scattering Vector g*
    if (showEwaldSphere && showRecipVectors) {
      const eCenterPt = project(k0_center_visual.x, k0_center_visual.y, k0_center_visual.z);
      elements.push({ type: 'ewald-center', p: eCenterPt, z: eCenterPt.z });

      const activeHkl = hoveredNode || manualProbe;
      if (activeHkl) {
        const gActive = getCartesianReciprocalVector(activeHkl[0], activeHkl[1], activeHkl[2]);
        const pActive = project(gActive.x, gActive.y, gActive.z);

        // Closed Scattering Vector Triangle Fill (C -> O -> G)
        elements.push({
          type: 'scattering-triangle',
          pCenter: eCenterPt,
          pOrigin: origin,
          pNode: pActive,
          z: (eCenterPt.z + origin.z + pActive.z) / 3
        });

        // Diffracted wavevector kh (from Ewald Center to Active Probe Node)
        elements.push({
          type: 'k-vector',
          p1: eCenterPt,
          p2: pActive,
          color: '#c084fc',
          label: 'k_h (Diffracted)',
          z: (eCenterPt.z + pActive.z) / 2 + 0.1
        });

        // Reciprocal scattering vector g* = Q/(2pi) from Origin to Active Node
        elements.push({
          type: 'g-vector',
          p1: origin,
          p2: pActive,
          color: '#fbbf24',
          label: `g* (${activeHkl[0]} ${activeHkl[1]} ${activeHkl[2]})`,
          z: (origin.z + pActive.z) / 2 + 0.15
        });
      }

      // Incident wavevector k0 (from Ewald Center to Origin)
      elements.push({
        type: 'k-vector',
        p1: eCenterPt,
        p2: origin,
        color: '#22d3ee',
        label: 'k₀ (1/λ)',
        z: (eCenterPt.z + origin.z) / 2 + 0.1
      });
    }

    // Sort by Z-depth for correct occlusion
    elements.sort((a, b) => a.z - b.z);

    // DRAW SORTED ELEMENTS
    elements.forEach((el) => {
      if (el.type === 'edge') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.11)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
      } else if (el.type === 'relrod-spike') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.isEwaldIntersecting
          ? 'rgba(251, 191, 36, 0.75)'
          : 'rgba(52, 211, 153, 0.55)';
        ctx.lineWidth = 2.2;
        ctx.stroke();
      } else if (el.type === 'bz-wire') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1.25;
        ctx.setLineDash([3, 2.5]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (el.type === 'scattering-triangle') {
        ctx.beginPath();
        ctx.moveTo(el.pCenter.x, el.pCenter.y);
        ctx.lineTo(el.pOrigin.x, el.pOrigin.y);
        ctx.lineTo(el.pNode.x, el.pNode.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(192, 132, 252, 0.11)';
        ctx.fill();
      } else if (
        el.type === 'ewald-sphere-surface' ||
        el.type === 'limiting-sphere-surface'
      ) {
        const radiusPx =
          (el.radius * scale) /
          (projectionMode === 'perspective'
            ? Math.max(0.2, 1 - el.p.z / ((maxBound * metricTensor.aStar + 1.5) * 2.2))
            : 1);
        if (radiusPx > 0 && radiusPx < 2500) {
          ctx.beginPath();
          ctx.arc(el.p.x, el.p.y, radiusPx, 0, 2 * Math.PI);
          const grad = ctx.createRadialGradient(
            el.p.x - radiusPx * 0.25,
            el.p.y - radiusPx * 0.25,
            radiusPx * 0.08,
            el.p.x,
            el.p.y,
            radiusPx
          );
          if (el.type === 'ewald-sphere-surface') {
            grad.addColorStop(0, 'rgba(34, 211, 238, 0.09)');
            grad.addColorStop(0.7, 'rgba(34, 211, 238, 0.03)');
            grad.addColorStop(1, 'rgba(34, 211, 238, 0.22)');
          } else {
            grad.addColorStop(0, 'rgba(244, 63, 94, 0.07)');
            grad.addColorStop(0.7, 'rgba(244, 63, 94, 0.02)');
            grad.addColorStop(1, 'rgba(244, 63, 94, 0.14)');
          }
          ctx.fillStyle = grad;
          ctx.fill();
        }
      } else if (el.type === 'sphere-wire' || el.type === 'limiting-sphere-wire') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.lineWidth || 1.0;
        ctx.stroke();
      } else if (el.type === 'axis') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        const angle = Math.atan2(el.p2.y - el.p1.y, el.p2.x - el.p1.x);
        const headX = el.p2.x;
        const headY = el.p2.y;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(
          headX - 8 * Math.cos(angle - Math.PI / 6),
          headY - 8 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          headX - 8 * Math.cos(angle + Math.PI / 6),
          headY - 8 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = el.color;
        ctx.fill();

        ctx.fillStyle = el.color;
        ctx.font = 'bold 10px monospace';
        ctx.fillText(el.label, el.p2.x + 6, el.p2.y + 3);
      } else if (el.type === 'origin') {
        ctx.beginPath();
        ctx.arc(el.p.x, el.p.y, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.font = 'bold 9.5px monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('O (000)', el.p.x + 7, el.p.y + 12);
      } else if (el.type === 'ewald-center') {
        ctx.beginPath();
        ctx.arc(el.p.x, el.p.y, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#22d3ee';
        ctx.fill();
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#67e8f9';
        ctx.fillText('C (-k₀)', el.p.x + 6, el.p.y - 6);
      } else if (el.type === 'k-vector') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2.0;
        ctx.stroke();

        const angle = Math.atan2(el.p2.y - el.p1.y, el.p2.x - el.p1.x);
        const headX = el.p2.x;
        const headY = el.p2.y;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(
          headX - 7 * Math.cos(angle - Math.PI / 6),
          headY - 7 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          headX - 7 * Math.cos(angle + Math.PI / 6),
          headY - 7 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = el.color;
        ctx.fill();

        const midX = (el.p1.x + el.p2.x) / 2;
        const midY = (el.p1.y + el.p2.y) / 2;
        ctx.fillStyle = el.color;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(el.label, midX + 5, midY - 5);
      } else if (el.type === 'g-vector') {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([4, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        const midX = (el.p1.x + el.p2.x) / 2;
        const midY = (el.p1.y + el.p2.y) / 2;
        ctx.fillStyle = el.color;
        ctx.font = 'bold 9.5px monospace';
        ctx.fillText(el.label, midX + 6, midY - 6);
      } else if (el.type === 'node') {
        const isHovered =
          hoveredNode &&
          hoveredNode[0] === el.h &&
          hoveredNode[1] === el.k &&
          hoveredNode[2] === el.l;
        const isManual =
          manualProbe &&
          manualProbe[0] === el.h &&
          manualProbe[1] === el.k &&
          manualProbe[2] === el.l;
        const isProbeActive = isHovered || isManual;

        const baseRadius = el.isSelected
          ? isProbeActive
            ? 9.5
            : 7.0
          : isProbeActive
          ? 7.2
          : 4.5;
        const radius = baseRadius * Math.min(1.4, Math.max(0.6, recipZoom));

        // Relrod dynamic excitation halo if intersecting Ewald sphere
        if (el.isEwaldIntersecting && el.status === 'Allowed') {
          ctx.beginPath();
          ctx.arc(el.p.x, el.p.y, radius + (showRelrodGlow ? 6.5 : 3.5), 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }

        // Selection Target Reticle
        if (isProbeActive) {
          ctx.beginPath();
          ctx.rect(
            el.p.x - (radius + 5),
            el.p.y - (radius + 5),
            (radius + 5) * 2,
            (radius + 5) * 2
          );
          ctx.strokeStyle = isHovered ? '#22d3ee' : '#c084fc';
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
          ctx.strokeStyle = el.isSelected
            ? '#34d399'
            : el.isEwaldIntersecting
            ? '#fcd34d'
            : '#047857';
          ctx.lineWidth = el.isSelected || isProbeActive ? 1.6 : 0.8;
        } else {
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

        ctx.globalAlpha =
          el.isSelected || isProbeActive || el.isEwaldIntersecting ? 1.0 : 0.68;
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        if (el.isSelected || isProbeActive || (el.isEwaldIntersecting && el.status === 'Allowed')) {
          ctx.fillStyle = el.isEwaldIntersecting
            ? '#fde047'
            : el.isSelected
            ? '#ffffff'
            : isHovered
            ? '#22d3ee'
            : '#e879f9';
          ctx.font = isProbeActive ? 'bold 10px monospace' : 'bold 8.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(
            `(${el.h}${el.k}${el.l})`,
            el.p.x,
            el.p.y - radius - (isProbeActive ? 8 : 5)
          );
        }
      }
    });

    // Draw 3D Orientation Gimbal in bottom-left
    const gx = 44;
    const gy = height - 44;
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
    ctx.arc(gx, gy, 29, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(7, 11, 20, 0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const gAxes = [
      { p: ga, color: '#f87171', label: 'a*' },
      { p: gb, color: '#34d399', label: 'b*' },
      { p: gc, color: '#38bdf8', label: 'c*' }
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
      ctx.textAlign = 'left';
      ctx.fillText(
        axis.label,
        axis.p.x + (axis.p.x > gx ? 4 : -11),
        axis.p.y + (axis.p.y > gy ? 6 : -3)
      );
    });

    // Calibration Telemetry Overlay Text
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `PITCH: ${Math.round(recipRotation.x)}° · YAW: ${Math.round(recipRotation.y)}° · ZOOM: ${(recipZoom * 100).toFixed(0)}% · k₀ = ${(1 / wavelength).toFixed(3)} Å⁻¹`,
      12,
      54
    );
    ctx.fillStyle = 'rgba(100, 116, 139, 0.85)';
    ctx.font = '9px monospace';
    ctx.fillText(
      'DRAG: ORBIT 3D · SHIFT+DRAG: PAN · WHEEL: ZOOM · CLICK NODE: INJECT/REMOVE BUFFER',
      12,
      67
    );
  }, [
    activeViewTab,
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
    validateSelectionRule
  ]);

  // Export Full Reciprocal Matrix to CSV
  const handleExportCSV = () => {
    let csv = '# 3D RECIPROCAL SPACE PROBE CRYSTALLOGRAPHIC CATALOG\n';
    csv += `# Crystal System: ${system}\n`;
    csv += `# Cell: a=${cellA}Å, b=${cellB}Å, c=${cellC}Å, alpha=${cellAlpha}°, beta=${cellBeta}°, gamma=${cellGamma}°\n`;
    csv += `# Reciprocal Metric: a*=${metricTensor.aStar.toFixed(4)}Å⁻¹, b*=${metricTensor.bStar.toFixed(4)}Å⁻¹, c*=${metricTensor.cStar.toFixed(4)}Å⁻¹, V=${metricTensor.V.toFixed(2)}Å³\n`;
    csv += `# Radiation Wavelength: ${wavelength}Å (k0 = ${(1 / wavelength).toFixed(4)}Å⁻¹)\n\n`;
    csv +=
      'h,k,l,d_Spacing_A,Q_Magnitude_invA,gx_invA,gy_invA,gz_invA,TwoTheta_deg,Status,Excitation_Error_sg_invA,Ewald_Resonance\n';

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
          const k0_center = {
            x: -k0_mag * Math.cos(omegaRad),
            y: -k0_mag * Math.sin(omegaRad),
            z: 0
          };
          const dist = Math.sqrt(
            (gVec.x - k0_center.x) ** 2 +
              (gVec.y - k0_center.y) ** 2 +
              (gVec.z - k0_center.z) ** 2
          );
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

  // Generate 2D Reciprocal Net Slice Spots for activeViewTab === '2d_slice'
  const sliceNodes2D = useMemo(() => {
    const spots: {
      h: number;
      k: number;
      l: number;
      u: number;
      v: number;
      dSpacing: number;
      status: string;
      isSelected: boolean;
      isEwaldActive: boolean;
      sg: number;
    }[] = [];
    const parsedHKLs = parseHKLString(hklInput);
    const k0_mag = 1 / Math.max(0.01, wavelength);
    const omegaRad = (beamTiltOmega * Math.PI) / 180;
    const k0_center = {
      x: -k0_mag * Math.cos(omegaRad),
      y: -k0_mag * Math.sin(omegaRad),
      z: 0
    };

    const m = maxIndex;
    for (let i = -m; i <= m; i++) {
      for (let j = -m; j <= m; j++) {
        let h = 0;
        let k = 0;
        let l = 0;
        if (sliceOrientation === 'hk0') {
          h = i;
          k = j;
          l = 0;
        } else if (sliceOrientation === 'h0l') {
          h = i;
          k = 0;
          l = j;
        } else if (sliceOrientation === '0kl') {
          h = 0;
          k = i;
          l = j;
        } else {
          h = i;
          k = i;
          l = j;
        }

        const gVec = getCartesianReciprocalVector(h, k, l);
        let u = gVec.x;
        let v = gVec.y;
        if (sliceOrientation === 'h0l') {
          u = gVec.x;
          v = gVec.z;
        } else if (sliceOrientation === '0kl') {
          u = gVec.y;
          v = gVec.z;
        } else if (sliceOrientation === 'hhl') {
          u = Math.hypot(gVec.x, gVec.y) * (i >= 0 ? 1 : -1);
          v = gVec.z;
        }

        const rule = h === 0 && k === 0 && l === 0 ? { status: 'Origin', reason: '' } : validateSelectionRule(system, [h, k, l]);
        if (filterAllowedOnly && rule.status !== 'Allowed' && rule.status !== 'Origin') continue;

        const dist = Math.hypot(
          gVec.x - k0_center.x,
          gVec.y - k0_center.y,
          gVec.z - k0_center.z
        );
        const sg = dist - k0_mag;
        const isEwaldActive = Math.abs(sg) <= excitationTolerance;
        const isSelected = parsedHKLs.some((p) => p[0] === h && p[1] === k && p[2] === l);

        spots.push({
          h,
          k,
          l,
          u,
          v,
          dSpacing: gVec.dSpacing,
          status: rule.status,
          isSelected,
          isEwaldActive,
          sg
        });
      }
    }
    return spots;
  }, [
    sliceOrientation,
    maxIndex,
    hklInput,
    wavelength,
    beamTiltOmega,
    excitationTolerance,
    filterAllowedOnly,
    system,
    getCartesianReciprocalVector,
    parseHKLString,
    validateSelectionRule
  ]);

  return (
    <div className="space-y-4 p-5 bg-[#070b14] rounded-2xl border border-slate-800/95 shadow-2xl relative isolate overflow-hidden">
      {/* 1. Header & Mode Switcher Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
            <h3 className="text-sm font-black text-white tracking-tight">
              3D Reciprocal Space &amp; Ewald Sphere Probe
            </h3>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] font-mono text-cyan-300 font-semibold">
              {system} Lattice
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              V = {metricTensor.V.toFixed(2)} Å³ · V* = {metricTensor.VStar.toFixed(5)} Å⁻³
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Reciprocal Metric Tensor G* · Ewald Sphere (1/λ) · Excitation Error s_g · 1st Brillouin Zone
          </p>
        </div>

        {/* Viewport Mode Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#0B0F19] p-0.5 rounded-xl border border-slate-800 text-[10px] font-mono font-bold">
            {(
              [
                { id: '3d_lattice', label: '3D Ewald Stage' },
                { id: '2d_slice', label: '2D Precession Slice' },
                { id: 'detector_laue', label: 'Area Detector (L)' }
              ] as const
            ).map((vt) => (
              <button
                key={vt.id}
                type="button"
                onClick={() => setActiveViewTab(vt.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeViewTab === vt.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {vt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsOrbiting(!isOrbiting)}
            className={`px-2.5 py-1.5 rounded-xl border font-mono text-[10px] flex items-center gap-1.5 transition-all uppercase font-bold cursor-pointer whitespace-nowrap shrink-0 ${
              isOrbiting
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isOrbiting ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3" />}
            <span>{isOrbiting ? 'Orbiting' : 'Auto-Orbit'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all uppercase cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Benchmark Crystallographic Presets + Metric Tensor Toggle Ribbon */}
      <div className="bg-[#0B0F19] p-2.5 rounded-xl border border-slate-800/90 space-y-2.5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap pl-1 mr-1">
              Reference Crystals:
            </span>
            {RECIPROCAL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedPresetId === preset.id
                    ? 'bg-cyan-600 text-white border border-cyan-400 shadow-sm'
                    : 'bg-[#070b14] hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowMetricEditor(!showMetricEditor)}
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              showMetricEditor
                ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-200'
                : 'bg-[#070b14] border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Grid className="w-3 h-3 text-indigo-400" />
            <span>Cell Metric Tensor</span>
            {showMetricEditor ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Direct & Reciprocal Metric Tensor Tuner */}
        {showMetricEditor && (
          <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-3 text-[10px] font-mono animate-in fade-in duration-150">
            <div className="lg:col-span-7 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'a (Å)', val: cellA, set: setCellA, step: 0.05, min: 1.5, max: 25 },
                { label: 'b (Å)', val: cellB, set: setCellB, step: 0.05, min: 1.5, max: 25 },
                { label: 'c (Å)', val: cellC, set: setCellC, step: 0.05, min: 1.5, max: 25 },
                { label: 'α (°)', val: cellAlpha, set: setCellAlpha, step: 1, min: 45, max: 135 },
                { label: 'β (°)', val: cellBeta, set: setCellBeta, step: 1, min: 45, max: 135 },
                { label: 'γ (°)', val: cellGamma, set: setCellGamma, step: 1, min: 45, max: 135 }
              ].map((inp) => (
                <div key={inp.label} className="bg-[#070b14] p-1.5 rounded-lg border border-slate-800">
                  <label className="text-[8.5px] text-slate-500 uppercase block mb-0.5">{inp.label}</label>
                  <input
                    type="number"
                    step={inp.step}
                    min={inp.min}
                    max={inp.max}
                    value={inp.val}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) inp.set(v);
                    }}
                    className="w-full bg-transparent text-white font-bold text-[11px] tabular-nums focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="lg:col-span-5 bg-[#070b14] p-2 rounded-lg border border-slate-800/90 flex flex-wrap items-center justify-between gap-2 tabular-nums">
              <div>
                <span className="text-[8.5px] text-slate-500 uppercase block">Reciprocal Edges</span>
                <span className="text-cyan-300 font-bold">
                  a*={metricTensor.aStar.toFixed(3)} · b*={metricTensor.bStar.toFixed(3)} · c*={metricTensor.cStar.toFixed(3)} Å⁻¹
                </span>
              </div>
              <div>
                <span className="text-[8.5px] text-slate-500 uppercase block">Reciprocal Angles</span>
                <span className="text-indigo-300 font-bold">
                  α*={metricTensor.alphaStarDeg.toFixed(1)}° · β*={metricTensor.betaStarDeg.toFixed(1)}° · γ*={metricTensor.gammaStarDeg.toFixed(1)}°
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Interactive Viewport Stage (3D Lattice / 2D Slice / 2D Area Detector) */}
      <div className="space-y-2">
        {/* Zone Axis & Slice Orienteer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0B0F19] p-2 rounded-xl border border-slate-800/90 text-[10px] font-mono">
          {activeViewTab === '3d_lattice' ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-bold uppercase pl-1 mr-1">Zone Axes:</span>
              {[
                { label: '[100] Front', rot: { x: 0, y: 0 } },
                { label: '[010] Side', rot: { x: 0, y: 90 } },
                { label: '[001] Top', rot: { x: 90, y: 0 } },
                { label: '[110] Edge', rot: { x: 0, y: -45 } },
                { label: '[111] Diag', rot: { x: 35.26, y: -45 } },
                { label: 'Isometric', rot: { x: 22, y: -38 } }
              ].map((za) => (
                <button
                  key={za.label}
                  type="button"
                  onClick={() => {
                    setRecipRotation(za.rot);
                    setIsOrbiting(false);
                  }}
                  className="px-2.5 py-1 bg-[#070b14] hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-cyan-300 font-bold uppercase transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  {za.label}
                </button>
              ))}
            </div>
          ) : activeViewTab === '2d_slice' ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-bold uppercase pl-1 mr-1">Precession Plane:</span>
              {(
                [
                  { id: 'hk0', label: '(hk0) Zero-Layer ZOLZ' },
                  { id: 'h0l', label: '(h0l) Meridional Slice' },
                  { id: '0kl', label: '(0kl) Equatorial Slice' },
                  { id: 'hhl', label: '(hhl) Diagonal Zone Slice' }
                ] as const
              ).map((sl) => (
                <button
                  key={sl.id}
                  type="button"
                  onClick={() => setSliceOrientation(sl.id)}
                  className={`px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    sliceOrientation === sl.id
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sl.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap pl-1">
              <span className="text-cyan-300 font-bold uppercase">
                2D Flat-Panel Detector Projection (Camera Length L = {cameraLength} mm)
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">
                Active Bragg Spots: <strong className="text-amber-300">{ewaldResonantNodes.length}</strong>
              </span>
            </div>
          )}

          {/* Quick Filter: Allowed Only + Snap to Bragg */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setFilterAllowedOnly(!filterAllowedOnly)}
              className={`px-2.5 py-1 rounded-lg border font-bold uppercase transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterAllowedOnly
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Hide structure-factor forbidden reflections"
            >
              {filterAllowedOnly ? 'Allowed Reflections Only' : 'Show All Nodes (Incl. Forbidden)'}
            </button>

            <button
              type="button"
              onClick={handleSnapToBraggCondition}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold uppercase flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Automatically tilt incident beam ω so the active (hkl) reflection lies directly on the Ewald sphere (s_g = 0)"
            >
              <Crosshair className="w-3 h-3" />
              <span>Align ω to Bragg ({activeNodeDiagnostics.h}{activeNodeDiagnostics.k}{activeNodeDiagnostics.l})</span>
            </button>
          </div>
        </div>

        {/* Viewport Display Container */}
        {activeViewTab === '3d_lattice' && (
          <div className="relative rounded-2xl border border-slate-800 overflow-hidden cursor-grab active:cursor-grabbing bg-[#02050b] shadow-inner">
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
              className="w-full h-[400px] block"
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
                  title="Reset Pan, Zoom & Rotation"
                  onClick={() => {
                    setRecipZoom(1.15);
                    setRecipPan({ x: 0, y: 0 });
                    setRecipRotation({ x: 22, y: -38 });
                  }}
                  className="px-2.5 h-7 flex items-center justify-center text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg text-[10px] font-mono font-bold uppercase transition-all border-l border-slate-800 cursor-pointer"
                >
                  Reset 1:1
                </button>
              </div>
            </div>

            {/* Top-Right Legend */}
            <div className="absolute top-3 right-3 flex flex-col items-end gap-2 pointer-events-none z-20">
              <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl text-[9.5px] font-mono font-bold uppercase tracking-wider pointer-events-auto">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300" />
                  <span className="text-emerald-300">Allowed Reflection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-rose-600 rotate-45 border border-rose-400" />
                  <span className="text-rose-300">Extinct (Forbidden)</span>
                </div>
                {showEwaldSphere && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-yellow-200" />
                    <span className="text-amber-300">Ewald Excited ({ewaldResonantNodes.length})</span>
                  </div>
                )}
                {showBrillouinZone && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-0.5 bg-sky-400" />
                    <span className="text-sky-300">1st Brillouin Cage</span>
                  </div>
                )}
                {showLimitingSphere && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-0.5 border-b border-dashed border-rose-400" />
                    <span className="text-rose-300">Limiting Sphere (2/λ)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom-Right Active Node Quick Inspector HUD */}
            <div className="absolute bottom-3 right-3 p-3 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl text-[10px] font-mono text-slate-300 shadow-2xl max-w-[295px] space-y-1.5 z-20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
                <span className="font-black text-cyan-300">
                  Target ({activeNodeDiagnostics.h} {activeNodeDiagnostics.k} {activeNodeDiagnostics.l})
                </span>
                <span
                  className={`text-[9px] font-bold uppercase ${
                    activeNodeDiagnostics.isAllowed ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activeNodeDiagnostics.isAllowed ? '● Allowed' : '✖ Forbidden'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9.5px] tabular-nums">
                <div>
                  <span className="text-slate-500">d(hkl):</span>{' '}
                  <span className="font-bold text-amber-300">
                    {activeNodeDiagnostics.gVec.dSpacing > 0
                      ? `${activeNodeDiagnostics.gVec.dSpacing.toFixed(4)} Å`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">|Q|:</span>{' '}
                  <span className="font-bold text-cyan-300">
                    {activeNodeDiagnostics.gVec.qMagnitude > 0
                      ? `${activeNodeDiagnostics.gVec.qMagnitude.toFixed(3)} Å⁻¹`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">2θ Bragg:</span>{' '}
                  <span className="font-bold text-purple-300">
                    {activeNodeDiagnostics.hasBraggSolution
                      ? `${activeNodeDiagnostics.twoThetaDeg.toFixed(2)}°`
                      : 'No Sol.'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">s_g Error:</span>{' '}
                  <span
                    className={`font-bold ${
                      activeNodeDiagnostics.isEwaldActive ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  >
                    {activeNodeDiagnostics.s_g > 0
                      ? `+${activeNodeDiagnostics.s_g.toFixed(4)}`
                      : activeNodeDiagnostics.s_g.toFixed(4)}{' '}
                    Å⁻¹
                  </span>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 border-t border-slate-800/80 pt-1 leading-relaxed">
                {activeNodeDiagnostics.isEwaldActive && activeNodeDiagnostics.isAllowed ? (
                  <span className="text-amber-300 font-bold">
                    ● BRAGG RESONANCE: Intersects Ewald sphere (|s_g| ≤ {excitationTolerance} Å⁻¹).
                  </span>
                ) : (
                  <span>{activeNodeDiagnostics.rule.reason}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: 2D Precession / Reciprocal Net Slice (hk0 / h0l / 0kl / hhl) */}
        {activeViewTab === '2d_slice' && (
          <div className="rounded-2xl border border-slate-800 bg-[#02050b] p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8 flex justify-center">
              <svg
                viewBox="-220 -180 440 360"
                className="w-full max-w-[560px] h-[360px] bg-[#040914] rounded-xl border border-slate-800/90 select-none"
              >
                {/* Resolution d-spacing circles */}
                {[3.0, 2.0, 1.5, 1.0].map((dVal) => {
                  const gMag = 1 / dVal;
                  const maxG = Math.max(0.5, maxIndex * metricTensor.aStar * 1.25);
                  const rPx = (gMag / maxG) * 155;
                  if (rPx > 175) return null;
                  return (
                    <g key={`d-ring-${dVal}`}>
                      <circle
                        cx={0}
                        cy={0}
                        r={rPx}
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.14)"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                      />
                      <text
                        x={4}
                        y={-rPx + 9}
                        fill="#64748b"
                        fontSize="7.5"
                        fontFamily="monospace"
                      >
                        d={dVal.toFixed(1)}Å
                      </text>
                    </g>
                  );
                })}

                {/* Coordinate Axes */}
                <line x1={-200} y1={0} x2={200} y2={0} stroke="#1e293b" strokeWidth={1} />
                <line x1={0} y1={-165} x2={0} y2={165} stroke="#1e293b" strokeWidth={1} />

                {/* Ewald Sphere Planar Intersection Circle */}
                {showEwaldSphere && (() => {
                  const maxG = Math.max(0.5, maxIndex * metricTensor.aStar * 1.25);
                  const sFactor = 155 / maxG;
                  const k0 = Math.min(1 / Math.max(0.05, wavelength), maxG * 2.2);
                  const omRad = (beamTiltOmega * Math.PI) / 180;
                  const cxE = -k0 * Math.cos(omRad) * sFactor;
                  const cyE = -k0 * Math.sin(omRad) * sFactor;
                  const rE = k0 * sFactor;
                  return (
                    <g>
                      <circle
                        cx={cxE}
                        cy={-cyE}
                        r={rE}
                        fill="rgba(34, 211, 238, 0.05)"
                        stroke="#22d3ee"
                        strokeWidth={1.5}
                        strokeDasharray="5 2.5"
                      />
                      <line
                        x1={cxE}
                        y1={-cyE}
                        x2={0}
                        y2={0}
                        stroke="#22d3ee"
                        strokeWidth={1.2}
                        strokeOpacity={0.7}
                      />
                    </g>
                  );
                })()}

                {/* Reciprocal Lattice Spots in Slice */}
                {sliceNodes2D.map((sp) => {
                  const maxG = Math.max(0.5, maxIndex * metricTensor.aStar * 1.25);
                  const sFactor = 155 / maxG;
                  const px = sp.u * sFactor;
                  const py = -sp.v * sFactor;
                  const isOrigin = sp.h === 0 && sp.k === 0 && sp.l === 0;
                  const isManual =
                    manualProbe[0] === sp.h &&
                    manualProbe[1] === sp.k &&
                    manualProbe[2] === sp.l;

                  return (
                    <g
                      key={`sl-${sp.h}-${sp.k}-${sp.l}`}
                      onClick={() => {
                        if (!isOrigin) {
                          setManualProbe([sp.h, sp.k, sp.l]);
                          toggleHKLNode(sp.h, sp.k, sp.l);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {sp.isEwaldActive && sp.status === 'Allowed' && (
                        <circle
                          cx={px}
                          cy={py}
                          r={8.5}
                          fill="rgba(251, 191, 36, 0.25)"
                          stroke="#fbbf24"
                          strokeWidth={1.2}
                        />
                      )}
                      {isOrigin ? (
                        <circle cx={px} cy={py} r={4.5} fill="#ffffff" stroke="#22d3ee" strokeWidth={2} />
                      ) : sp.status === 'Allowed' ? (
                        <circle
                          cx={px}
                          cy={py}
                          r={isManual || sp.isSelected ? 5.5 : 3.8}
                          fill={
                            sp.isEwaldActive
                              ? '#fbbf24'
                              : sp.isSelected
                              ? '#10b981'
                              : '#34d399'
                          }
                          stroke={isManual ? '#ffffff' : '#064e3b'}
                          strokeWidth={isManual ? 1.5 : 0.8}
                        />
                      ) : (
                        <polygon
                          points={`${px},${py - 3.5} ${px + 3.5},${py} ${px},${py + 3.5} ${px - 3.5},${py}`}
                          fill="#991b1b"
                          stroke="#f87171"
                          strokeWidth={0.7}
                          opacity={0.65}
                        />
                      )}
                      {(isManual || sp.isSelected || sp.isEwaldActive || isOrigin) && (
                        <text
                          x={px}
                          y={py - 7}
                          textAnchor="middle"
                          fill={sp.isEwaldActive ? '#fde047' : '#e2e8f0'}
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {isOrigin ? '(000)' : `${sp.h}${sp.k}${sp.l}`}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="lg:col-span-4 space-y-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-2">
                <div className="text-cyan-300 font-bold uppercase text-[10px]">
                  2D Precession Plane ({sliceOrientation.toUpperCase()})
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Displays an undistorted reciprocal lattice section with constant-resolution d-spacing rings and the planar Ewald sphere intersection arc. Click any reflection spot to target and toggle it in the buffer.
                </p>
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[10.5px] tabular-nums">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Total Spots in Slice</span>
                    <strong className="text-white">{sliceNodes2D.length}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Ewald Resonant</span>
                    <strong className="text-amber-300">
                      {sliceNodes2D.filter((s) => s.isEwaldActive && s.status === 'Allowed').length}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: 2D Area Detector / Laue & SAED Diffraction Pattern */}
        {activeViewTab === 'detector_laue' && (
          <div className="rounded-2xl border border-slate-800 bg-[#02050b] p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8 flex justify-center">
              <svg
                viewBox="-220 -180 440 360"
                className="w-full max-w-[560px] h-[360px] bg-[#03060d] rounded-xl border border-slate-800/90 select-none"
              >
                {/* Detector Debye-Scherrer Rings */}
                {[15, 30, 45, 60].map((twoTh) => {
                  const rDet = (twoTh / 75) * 155 * (cameraLength / 120);
                  if (rDet > 175) return null;
                  return (
                    <g key={`det-ring-${twoTh}`}>
                      <circle
                        cx={0}
                        cy={0}
                        r={rDet}
                        fill="none"
                        stroke="rgba(56, 189, 248, 0.14)"
                        strokeWidth={1}
                        strokeDasharray="2 3"
                      />
                      <text
                        x={4}
                        y={-rDet + 8}
                        fill="#475569"
                        fontSize="7.5"
                        fontFamily="monospace"
                      >
                        2θ={twoTh}°
                      </text>
                    </g>
                  );
                })}

                {/* Detector Crosshair & Central Beam Stop */}
                <line x1={-190} y1={0} x2={190} y2={0} stroke="#1e293b" strokeWidth={0.8} />
                <line x1={0} y1={-165} x2={0} y2={165} stroke="#1e293b" strokeWidth={0.8} />
                <circle cx={0} cy={0} r={8} fill="#0f172a" stroke="#475569" strokeWidth={1.5} />
                <circle cx={0} cy={0} r={2} fill="#22d3ee" />

                {/* Diffracted Bragg Spots on Area Detector */}
                {ewaldResonantNodes.map((sp) => {
                  const scaleDet = (cameraLength / 120) * 95;
                  const px = sp.gy * scaleDet;
                  const py = -sp.gz * scaleDet;
                  const rSpot = 3 + sp.intensityWeight * 4.5;
                  return (
                    <g
                      key={`det-sp-${sp.h}-${sp.k}-${sp.l}`}
                      onClick={() => {
                        setManualProbe([sp.h, sp.k, sp.l]);
                        toggleHKLNode(sp.h, sp.k, sp.l);
                      }}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={px}
                        cy={py}
                        r={rSpot * 2.1}
                        fill="rgba(251, 191, 36, 0.22)"
                      />
                      <circle
                        cx={px}
                        cy={py}
                        r={rSpot}
                        fill="#fef08a"
                        stroke="#f59e0b"
                        strokeWidth={1.2}
                      />
                      <text
                        x={px}
                        y={py - rSpot - 4}
                        textAnchor="middle"
                        fill="#fde047"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        ({sp.h}{sp.k}{sp.l})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="lg:col-span-4 space-y-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
                <div className="text-amber-300 font-bold uppercase text-[10px]">
                  Area Detector &amp; Camera Length Calibration
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Camera Length (L):</span>
                    <span className="text-white font-bold tabular-nums">{cameraLength} mm</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={250}
                    step={5}
                    value={cameraLength}
                    onChange={(e) => setCameraLength(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1 pt-2 border-t border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase block">
                    Excited Detector Reflections ({ewaldResonantNodes.length}):
                  </span>
                  {ewaldResonantNodes.slice(0, 8).map((rn) => (
                    <button
                      key={`rn-btn-${rn.h}-${rn.k}-${rn.l}`}
                      type="button"
                      onClick={() => setManualProbe([rn.h, rn.k, rn.l])}
                      className="w-full flex items-center justify-between px-2 py-1 rounded bg-[#070b14] hover:bg-slate-800 border border-slate-800/80 text-[10px] tabular-nums cursor-pointer"
                    >
                      <span className="text-amber-300 font-bold">
                        ({rn.h} {rn.k} {rn.l})
                      </span>
                      <span className="text-slate-300">d={rn.dSpacing.toFixed(3)}Å</span>
                      <span className="text-cyan-300">2θ={rn.twoTheta.toFixed(1)}°</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Precision Miller Index (h k l) Stepper Dial & Buffer Injector */}
      <div className="p-4 bg-[#0B0F19] rounded-xl border border-slate-800/90 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2 text-[10.5px] uppercase font-black tracking-wider text-slate-200 font-mono">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>Precision Miller Index (h k l) Vector Probe</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono tabular-nums">
            <span className="text-slate-400">
              |g*| ={' '}
              <strong className="text-cyan-300">
                {activeNodeDiagnostics.gVec.length.toFixed(4)} Å⁻¹
              </strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">
              LP(θ) ={' '}
              <strong className="text-indigo-300">
                {activeNodeDiagnostics.lpFactor > 0
                  ? activeNodeDiagnostics.lpFactor.toFixed(2)
                  : '—'}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-7 grid grid-cols-3 gap-2.5">
            {(
              [
                { label: 'Index h', idx: 0, color: 'text-rose-400' },
                { label: 'Index k', idx: 1, color: 'text-emerald-400' },
                { label: 'Index l', idx: 2, color: 'text-sky-400' }
              ] as const
            ).map((axis) => (
              <div
                key={axis.label}
                className="bg-[#070b14] p-2 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase pl-1">
                  {axis.label}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next: [number, number, number] = [...manualProbe] as [
                        number,
                        number,
                        number
                      ];
                      next[axis.idx] = Math.max(-maxIndex, next[axis.idx] - 1);
                      setManualProbe(next);
                    }}
                    className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono font-bold text-xs cursor-pointer flex items-center justify-center"
                  >
                    -
                  </button>
                  <span
                    className={`text-sm font-mono font-black w-6 text-center tabular-nums ${axis.color}`}
                  >
                    {manualProbe[axis.idx]}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next: [number, number, number] = [...manualProbe] as [
                        number,
                        number,
                        number
                      ];
                      next[axis.idx] = Math.min(maxIndex, next[axis.idx] + 1);
                      setManualProbe(next);
                    }}
                    className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono font-bold text-xs cursor-pointer flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-5">
            <button
              type="button"
              onClick={() => {
                if (manualProbe[0] === 0 && manualProbe[1] === 0 && manualProbe[2] === 0) return;
                toggleHKLNode(manualProbe[0], manualProbe[1], manualProbe[2]);
              }}
              className={`w-full py-2.5 px-4 rounded-xl border text-[10.5px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                (() => {
                  const parsed = parseHKLString(hklInput);
                  const exists = parsed.some(
                    (p) =>
                      p[0] === manualProbe[0] &&
                      p[1] === manualProbe[1] &&
                      p[2] === manualProbe[2]
                  );
                  return exists
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300';
                })()
              }`}
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              {(() => {
                const parsed = parseHKLString(hklInput);
                const exists = parsed.some(
                  (p) =>
                    p[0] === manualProbe[0] &&
                    p[1] === manualProbe[1] &&
                    p[2] === manualProbe[2]
                );
                return exists
                  ? `Remove (${manualProbe[0]} ${manualProbe[1]} ${manualProbe[2]}) from Buffer`
                  : `Inject (${manualProbe[0]} ${manualProbe[1]} ${manualProbe[2]}) into Buffer`;
              })()}
            </button>
          </div>
        </div>
      </div>

      {/* 5. INSTRUMENT CALIBRATION & EWALD PROJECTION RIG (Interactive Graphic + Controls) */}
      <div className="p-4 sm:p-5 bg-[#0B0F19] rounded-2xl border border-slate-800/95 space-y-4 shadow-xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <h4 className="text-xs font-black font-mono uppercase tracking-wider text-white">
                Instrument Calibration &amp; Ewald Projection Rig
              </h4>
              <p className="text-[10.5px] text-slate-400 font-mono">
                Interactive Vector Construction (k₀ + g* = k_h + s_g) · Goniometer (ω, ϕ) · Relrod Excitation Window
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10.5px] font-mono tabular-nums">
            <span className="text-slate-400">
              Ewald Radius 1/λ:{' '}
              <strong className="text-cyan-300">{(1 / wavelength).toFixed(4)} Å⁻¹</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">
              Limiting 2/λ:{' '}
              <strong className="text-rose-300">{(2 / wavelength).toFixed(4)} Å⁻¹</strong>
            </span>
          </div>
        </div>

        {/* Interactive Ewald Projection Rig Vector Graphic + Calibration Console */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* Left (5 cols): Live Interactive Ewald Scattering & Goniometer Rig Schematic SVG */}
          <div className="xl:col-span-5 bg-[#040812] rounded-xl border border-slate-800/90 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5 mb-2">
              <span className="text-cyan-300 font-bold uppercase">
                Equatorial Ewald Construction Schematic
              </span>
              <span className="tabular-nums">
                ({activeNodeDiagnostics.h} {activeNodeDiagnostics.k} {activeNodeDiagnostics.l}) · 2θ ={' '}
                {activeNodeDiagnostics.hasBraggSolution
                  ? `${activeNodeDiagnostics.twoThetaDeg.toFixed(1)}°`
                  : 'Extinct'}
              </span>
            </div>

            {(() => {
              // Compute 2D schematic geometry in SVG viewBox (0 0 340 215)
              const originX = 195;
              const originY = 112;
              const rEwaldPx = 76; // Fixed calibrated schematic radius for Ewald circle
              const omRad = (beamTiltOmega * Math.PI) / 180;

              // Center C of Ewald sphere is at (-rEwaldPx * cos(omega), +rEwaldPx * sin(omega) in SVG Y-down)
              const centerX = originX - rEwaldPx * Math.cos(omRad);
              const centerY = originY + rEwaldPx * Math.sin(omRad);

              // Source position upstream along incident beam
              const srcX = centerX - 42 * Math.cos(omRad);
              const srcY = centerY + 42 * Math.sin(omRad);

              // Active reflection g* scaled relative to k0 = 1/lambda
              const k0Real = 1 / Math.max(0.05, wavelength);
              const gReal = activeNodeDiagnostics.gVec.length;
              const gRatio = Math.min(1.85, Math.max(0.22, gReal / k0Real));
              const twoThRad =
                ((activeNodeDiagnostics.hasBraggSolution
                  ? activeNodeDiagnostics.twoThetaDeg
                  : 38) *
                  Math.PI) /
                180;

              // Diffracted wavevector direction from C at angle (omega - 2theta)
              const diffAngle = omRad - twoThRad;
              const ewaldSurfaceX = centerX + rEwaldPx * Math.cos(diffAngle);
              const ewaldSurfaceY = centerY - rEwaldPx * Math.sin(diffAngle);

              // Actual reciprocal node G(hkl) position including excitation error s_g offset
              const sgNorm = Math.max(
                -0.35,
                Math.min(0.35, activeNodeDiagnostics.s_g / Math.max(0.15, k0Real * 0.4))
              );
              const rNodePx = rEwaldPx * (1 + sgNorm);
              const nodeX = centerX + rNodePx * Math.cos(diffAngle) * Math.min(1.15, gRatio + 0.35);
              const nodeY = centerY - rNodePx * Math.sin(diffAngle) * Math.min(1.15, gRatio + 0.35);

              // Detector screen on right
              const detX = 312;

              return (
                <svg
                  viewBox="0 0 340 215"
                  className="w-full h-48 select-none overflow-visible"
                >
                  <defs>
                    <marker
                      id="ew-arrow-cyan"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#22d3ee" />
                    </marker>
                    <marker
                      id="ew-arrow-purple"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" />
                    </marker>
                    <marker
                      id="ew-arrow-amber"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                    </marker>
                  </defs>

                  {/* Optical Axis Reference Line */}
                  <line
                    x1={14}
                    y1={originY}
                    x2={detX}
                    y2={originY}
                    stroke="#1e293b"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />

                  {/* Limiting Sphere Arc (2/λ) */}
                  {showLimitingSphere && (
                    <circle
                      cx={originX}
                      cy={originY}
                      r={rEwaldPx * 1.32}
                      fill="none"
                      stroke="rgba(244, 63, 94, 0.35)"
                      strokeWidth={1}
                      strokeDasharray="3 2"
                    />
                  )}

                  {/* Ewald Sphere Circle (Radius = 1/λ) */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={rEwaldPx}
                    fill="rgba(34, 211, 238, 0.06)"
                    stroke="#22d3ee"
                    strokeWidth={1.5}
                  />

                  {/* Excitation Tolerance Shell Band (±Δs_g) */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={rEwaldPx + Math.min(12, excitationTolerance * 90)}
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.22)"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={Math.max(10, rEwaldPx - Math.min(12, excitationTolerance * 90))}
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.22)"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />

                  {/* Closed Scattering Triangle Shading (C -> O -> G) */}
                  <polygon
                    points={`${centerX},${centerY} ${originX},${originY} ${nodeX},${nodeY}`}
                    fill="rgba(192, 132, 252, 0.12)"
                  />

                  {/* Collimated X-Ray / e- Source Box */}
                  <g transform={`translate(${srcX}, ${srcY})`}>
                    <rect
                      x={-12}
                      y={-6}
                      width={16}
                      height={12}
                      rx={2}
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth={1.2}
                    />
                    <text
                      x={-4}
                      y={-10}
                      textAnchor="middle"
                      fill="#7dd3fc"
                      fontSize="7.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Source
                    </text>
                  </g>

                  {/* Incident Wavevector k0 (C -> O) */}
                  <line
                    x1={srcX + 4}
                    y1={srcY}
                    x2={centerX}
                    y2={centerY}
                    stroke="#38bdf8"
                    strokeWidth={1.2}
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={originX - 4}
                    y2={originY}
                    stroke="#22d3ee"
                    strokeWidth={2}
                    markerEnd="url(#ew-arrow-cyan)"
                  />
                  <text
                    x={(centerX + originX) / 2 - 4}
                    y={(centerY + originY) / 2 + 13}
                    textAnchor="middle"
                    fill="#22d3ee"
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    k₀ (1/λ)
                  </text>

                  {/* Diffracted Wavevector kh (C -> Ewald Surface / G) */}
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={ewaldSurfaceX}
                    y2={ewaldSurfaceY}
                    stroke="#c084fc"
                    strokeWidth={1.8}
                    markerEnd="url(#ew-arrow-purple)"
                  />
                  <text
                    x={(centerX + ewaldSurfaceX) / 2 - 14}
                    y={(centerY + ewaldSurfaceY) / 2 - 6}
                    fill="#d8b4fe"
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    k_h
                  </text>

                  {/* Reciprocal Lattice Vector g* (O -> G) */}
                  <line
                    x1={originX}
                    y1={originY}
                    x2={nodeX}
                    y2={nodeY}
                    stroke="#fbbf24"
                    strokeWidth={2}
                    strokeDasharray="3 1.5"
                    markerEnd="url(#ew-arrow-amber)"
                  />
                  <text
                    x={(originX + nodeX) / 2 + 16}
                    y={(originY + nodeY) / 2 + 2}
                    fill="#fcd34d"
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    g*({activeNodeDiagnostics.h}
                    {activeNodeDiagnostics.k}
                    {activeNodeDiagnostics.l})
                  </text>

                  {/* Excitation Error Vector s_g between Ewald Surface and Node G */}
                  <line
                    x1={ewaldSurfaceX}
                    y1={ewaldSurfaceY}
                    x2={nodeX}
                    y2={nodeY}
                    stroke={activeNodeDiagnostics.isEwaldActive ? '#34d399' : '#f43f5e'}
                    strokeWidth={2.2}
                  />
                  <text
                    x={Math.max(ewaldSurfaceX, nodeX) + 8}
                    y={(ewaldSurfaceY + nodeY) / 2 - 4}
                    fill={activeNodeDiagnostics.isEwaldActive ? '#6ee7b7' : '#fda4af'}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    s_g={activeNodeDiagnostics.s_g >= 0 ? '+' : ''}
                    {activeNodeDiagnostics.s_g.toFixed(3)}
                  </text>

                  {/* Diffracted Ray Extension to Area Detector Plane */}
                  <line
                    x1={ewaldSurfaceX}
                    y1={ewaldSurfaceY}
                    x2={detX}
                    y2={Math.max(24, Math.min(190, ewaldSurfaceY - 22))}
                    stroke="rgba(192, 132, 252, 0.45)"
                    strokeWidth={1.2}
                    strokeDasharray="2.5 2.5"
                  />

                  {/* Area Detector Bar at x = detX */}
                  <line
                    x1={detX}
                    y1={20}
                    x2={detX}
                    y2={195}
                    stroke="#475569"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={detX}
                    cy={Math.max(24, Math.min(190, ewaldSurfaceY - 22))}
                    r={4}
                    fill={activeNodeDiagnostics.isEwaldActive ? '#fbbf24' : '#c084fc'}
                  />
                  <text
                    x={detX - 4}
                    y={14}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="7.5"
                    fontFamily="monospace"
                  >
                    Detector (L={cameraLength}mm)
                  </text>

                  {/* Ewald Center C & Crystal Origin O(000) & Node G(hkl) Nodes */}
                  <circle cx={centerX} cy={centerY} r={4} fill="#22d3ee" stroke="#083344" strokeWidth={1.5} />
                  <text
                    x={centerX - 6}
                    y={centerY + 14}
                    textAnchor="middle"
                    fill="#67e8f9"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    C(-k₀)
                  </text>

                  <circle cx={originX} cy={originY} r={4.5} fill="#ffffff" stroke="#22d3ee" strokeWidth={2} />
                  <text
                    x={originX + 8}
                    y={originY + 13}
                    fill="#f8fafc"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    O(000)
                  </text>

                  <circle
                    cx={nodeX}
                    cy={nodeY}
                    r={4.5}
                    fill={activeNodeDiagnostics.isEwaldActive ? '#fbbf24' : '#10b981'}
                    stroke="#ffffff"
                    strokeWidth={1.2}
                  />
                </svg>
              );
            })()}

            {/* Bottom Schematic Status Strip */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[9.5px] font-mono tabular-nums">
              <span
                className={`font-bold ${
                  activeNodeDiagnostics.isEwaldActive ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {activeNodeDiagnostics.isEwaldActive
                  ? '● Exact Ewald Intersection (Bragg Active)'
                  : '▲ Off-Sphere (Click "Align ω to Bragg" to Excite)'}
              </span>
              <span className="text-slate-400">
                ω={beamTiltOmega.toFixed(1)}° · ϕ={goniometerPhi.toFixed(0)}°
              </span>
            </div>
          </div>

          {/* Right (7 cols): Calibrated Layer Toggles & Goniometer / Wavelength Scrubbers */}
          <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sub-column 1: Visual Layer Toggles & Laue Zone Filter */}
            <div className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800/90 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="text-[10px] font-mono font-bold uppercase text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    Optical &amp; Reciprocal Layers
                  </span>
                  <span>State</span>
                </div>

                {/* Camera Projection Mode */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Camera Projection</span>
                  <div className="flex rounded-lg border border-slate-800 p-0.5 bg-[#0B0F19]">
                    <button
                      type="button"
                      onClick={() => setProjectionMode('perspective')}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        projectionMode === 'perspective'
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Persp
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectionMode('ortho')}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        projectionMode === 'ortho'
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Ortho
                    </button>
                  </div>
                </div>

                {/* Layer Toggle Matrix */}
                {(
                  [
                    {
                      label: 'Ewald Sphere (1/λ)',
                      val: showEwaldSphere,
                      set: setShowEwaldSphere,
                      activeClass: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    },
                    {
                      label: '1st Brillouin Zone Cage',
                      val: showBrillouinZone,
                      set: setShowBrillouinZone,
                      activeClass: 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                    },
                    {
                      label: 'Limiting Sphere (2/λ)',
                      val: showLimitingSphere,
                      set: setShowLimitingSphere,
                      activeClass: 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    },
                    {
                      label: 'Wavevectors (k₀, k_h, g*)',
                      val: showRecipVectors,
                      set: setShowRecipVectors,
                      activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    },
                    {
                      label: 'Relrod Spikes (sinc²)',
                      val: showRelrodGlow,
                      set: setShowRelrodGlow,
                      activeClass: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    }
                  ] as const
                ).map((t) => (
                  <div key={t.label} className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-300">{t.label}</span>
                    <button
                      type="button"
                      onClick={() => t.set(!t.val)}
                      className={`px-2.5 py-0.5 rounded-lg border text-[9.5px] font-bold uppercase transition-all cursor-pointer ${
                        t.val
                          ? t.activeClass
                          : 'bg-[#0B0F19] border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {t.val ? 'Active' : 'Off'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Higher-Order Laue Zone (HOLZ) Selector */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Laue Zone Plane Filter:</span>
                  <span className="text-purple-300 font-bold">{laueZoneFilter}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 bg-[#0B0F19] p-0.5 rounded-lg border border-slate-800">
                  {(['ALL', 'ZOLZ', 'FOLZ', 'SOLZ'] as const).map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setLaueZoneFilter(zone)}
                      className={`py-1 text-[9.5px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${
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

            {/* Sub-column 2: Radiation Source & Goniometer Scrubbers */}
            <div className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800/90 flex flex-col justify-between space-y-3">
              {/* Radiation Source Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-slate-400">
                  <span className="text-slate-200 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Radiation Source
                  </span>
                  <span className="text-cyan-300 tabular-nums">λ = {wavelength.toFixed(4)} Å</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {RADIATION_SOURCES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setWavelength(preset.wl)}
                      title={`${preset.label} (${preset.wl} Å · ${preset.energyKeV})`}
                      className={`px-1.5 py-1 text-[9px] font-mono font-bold rounded-lg border transition-all cursor-pointer truncate ${
                        Math.abs(wavelength - preset.wl) < 0.002
                          ? 'bg-cyan-600 text-white border-cyan-400'
                          : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wavelength Fine Scrubber */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono tabular-nums">
                  <span className="text-slate-400">Wavelength (λ)</span>
                  <span className="font-bold text-cyan-300">
                    {wavelength.toFixed(4)} Å · k₀={(1 / wavelength).toFixed(2)} Å⁻¹
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.6"
                  step="0.01"
                  value={Math.max(0.2, Math.min(2.6, wavelength))}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Beam Incident Angle Omega */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono tabular-nums">
                  <span className="text-slate-400">Incident Beam Tilt (ω)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-300">{beamTiltOmega.toFixed(1)}°</span>
                    <button
                      type="button"
                      onClick={handleSnapToBraggCondition}
                      className="px-1.5 py-0.5 text-[8.5px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded cursor-pointer"
                      title="Snap ω to exact Bragg angle for active reflection"
                    >
                      Snap θ_B
                    </button>
                    {beamTiltOmega !== 0 && (
                      <button
                        type="button"
                        onClick={() => setBeamTiltOmega(0)}
                        className="px-1.5 py-0.5 text-[8.5px] font-mono text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-800 cursor-pointer"
                      >
                        0°
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="0.5"
                  value={beamTiltOmega}
                  onChange={(e) => setBeamTiltOmega(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Crystal Azimuthal Rotation Phi */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px] font-mono tabular-nums">
                  <span className="text-slate-400">Crystal Azimuth (ϕ)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-purple-300">{goniometerPhi.toFixed(0)}°</span>
                    {goniometerPhi !== 0 && (
                      <button
                        type="button"
                        onClick={() => setGoniometerPhi(0)}
                        className="px-1.5 py-0.5 text-[8.5px] font-mono text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-800 cursor-pointer"
                      >
                        0°
                      </button>
                    )}
                  </div>
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

              {/* Relrod Excitation Tolerance s_g */}
              <div className="space-y-1 pt-1 border-t border-slate-800/80">
                <div className="flex justify-between text-[11px] font-mono tabular-nums">
                  <span className="text-slate-400">Relrod Window (Δs_g)</span>
                  <span className="font-bold text-emerald-300">
                    ±{excitationTolerance.toFixed(3)} Å⁻¹
                  </span>
                </div>
                <input
                  type="range"
                  min="0.010"
                  max="0.150"
                  step="0.005"
                  value={excitationTolerance}
                  onChange={(e) => setExcitationTolerance(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Live Ewald-Resonant Reflections Ribbon */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-amber-300 font-bold uppercase flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5" />
              Ewald-Excited Reflections ({ewaldResonantNodes.length}):
            </span>
            {ewaldResonantNodes.length === 0 ? (
              <span className="text-slate-500">
                No allowed reflections within |s_g| ≤ {excitationTolerance.toFixed(3)} Å⁻¹ — click &quot;Snap θ_B&quot; or sweep ω/ϕ.
              </span>
            ) : (
              ewaldResonantNodes.slice(0, 10).map((rn) => {
                const isCurr =
                  manualProbe[0] === rn.h &&
                  manualProbe[1] === rn.k &&
                  manualProbe[2] === rn.l;
                return (
                  <button
                    key={`ew-chip-${rn.h}-${rn.k}-${rn.l}`}
                    type="button"
                    onClick={() => setManualProbe([rn.h, rn.k, rn.l])}
                    className={`px-2 py-0.5 rounded-md border tabular-nums transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isCurr
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                        : 'bg-[#070b14] border-amber-500/35 text-amber-200 hover:border-amber-400'
                    }`}
                    title={`d = ${rn.dSpacing.toFixed(3)} Å · 2θ = ${rn.twoTheta.toFixed(2)}° · s_g = ${rn.sg.toFixed(4)} Å⁻¹`}
                  >
                    ({rn.h}{rn.k}{rn.l}) <span className="opacity-75">{rn.twoTheta.toFixed(1)}°</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
