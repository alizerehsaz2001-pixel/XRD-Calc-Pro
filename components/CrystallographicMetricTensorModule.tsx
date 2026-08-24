import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Compass, 
  Grid, 
  Cpu, 
  Activity, 
  BookOpen, 
  Terminal, 
  Sparkles, 
  Check, 
  Copy, 
  RotateCcw,
  Sliders,
  Box
} from 'lucide-react';

import { 
  CrystalSystem, 
  LatticeParams, 
  MATERIAL_PRESETS, 
  PRESET_SYSTEMS, 
  fmt 
} from './metric_tensor/metricTensorTypes';

import { MetricTensorOverviewTab } from './metric_tensor/MetricTensorOverviewTab';
import { MetricTensorGeometryTab } from './metric_tensor/MetricTensorGeometryTab';
import { MetricTensorReciprocalNetTab } from './metric_tensor/MetricTensorReciprocalNetTab';
import { MetricTensorBusingLevyTab } from './metric_tensor/MetricTensorBusingLevyTab';
import { MetricTensorStrainThermalTab } from './metric_tensor/MetricTensorStrainThermalTab';
import { MetricTensorLearningGuideTab } from './metric_tensor/MetricTensorLearningGuideTab';
import { MetricTensorPythonTab } from './metric_tensor/MetricTensorPythonTab';
import { WhatDoesThisMeanTooltip } from './common/WhatDoesThisMeanTooltip';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';

interface CrystallographicMetricTensorModuleProps {
  pythonFeaturesEnabled?: boolean;
}

export const CrystallographicMetricTensorModule: React.FC<CrystallographicMetricTensorModuleProps> = ({
  pythonFeaturesEnabled = true
}) => {
  const [appState, setAppState] = useState<'setup' | 'computing' | 'results'>('setup');
  const [computingStep, setComputingStep] = useState(0);

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'overview' | 'geometry' | 'reciprocal_net' | 'busing_levy' | 'strain_thermal' | 'learning_guide' | 'python_export'
  >('overview');

  // Crystal System & Lattice Parameters
  const [system, setSystem] = useState<CrystalSystem>('Cubic');
  const [params, setParams] = useState<LatticeParams>(PRESET_SYSTEMS.Cubic.params);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('si');
  const [materialCategory, setMaterialCategory] = useState<string>('All');

  // Miller Indices (Planes) & Directions (Vectors)
  const [h1, setH1] = useState<number>(1);
  const [k1, setK1] = useState<number>(1);
  const [l1, setL1] = useState<number>(1);

  const [h2, setH2] = useState<number>(2);
  const [k2, setK2] = useState<number>(0);
  const [l2, setL2] = useState<number>(0);

  const [u1, setU1] = useState<number>(1);
  const [v1, setV1] = useState<number>(1);
  const [w1, setW1] = useState<number>(0);

  const [u2, setU2] = useState<number>(0);
  const [v2, setV2] = useState<number>(0);
  const [w2, setW2] = useState<number>(1);

  // Fractional coordinate for Busing-Levy converter
  const [fracX, setFracX] = useState<number>(0.25);
  const [fracY, setFracY] = useState<number>(0.25);
  const [fracZ, setFracZ] = useState<number>(0.25);

  // Clipboard feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Switch Crystal System handler
  const handleSystemChange = (newSystem: CrystalSystem) => {
    setSystem(newSystem);
    setParams(PRESET_SYSTEMS[newSystem].params);
  };

  // Switch Material Preset handler
  const handleMaterialSelect = (matId: string) => {
    setSelectedMaterialId(matId);
    const mat = MATERIAL_PRESETS.find((m) => m.id === matId);
    if (mat) {
      setSystem(mat.system);
      setParams({ ...mat.params });
    }
  };

  // Custom Lattice Parameter Update with System Constraints
  const updateLatticeParam = (key: keyof LatticeParams, val: number) => {
    const updated = { ...params, [key]: val };

    if (system === 'Cubic') {
      if (key === 'a' || key === 'b' || key === 'c') {
        updated.a = val; updated.b = val; updated.c = val;
      }
      updated.alpha = 90; updated.beta = 90; updated.gamma = 90;
    } else if (system === 'Tetragonal') {
      if (key === 'a' || key === 'b') {
        updated.a = val; updated.b = val;
      }
      updated.alpha = 90; updated.beta = 90; updated.gamma = 90;
    } else if (system === 'Hexagonal') {
      if (key === 'a' || key === 'b') {
        updated.a = val; updated.b = val;
      }
      updated.alpha = 90; updated.beta = 90; updated.gamma = 120;
    } else if (system === 'Rhombohedral') {
      if (key === 'a' || key === 'b' || key === 'c') {
        updated.a = val; updated.b = val; updated.c = val;
      }
      if (key === 'alpha' || key === 'beta' || key === 'gamma') {
        updated.alpha = val; updated.beta = val; updated.gamma = val;
      }
    } else if (system === 'Orthorhombic') {
      updated.alpha = 90; updated.beta = 90; updated.gamma = 90;
    } else if (system === 'Monoclinic') {
      updated.alpha = 90; updated.gamma = 90;
    }

    setParams(updated);
  };

  // ==================== TENSOR CALCULATIONS ====================

  // 1. Direct Metric Tensor G
  const { metricG, detG, volumeV } = useMemo(() => {
    const { a, b, c, alpha, beta, gamma } = params;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const ca = Math.cos(toRad(alpha));
    const cb = Math.cos(toRad(beta));
    const cg = Math.cos(toRad(gamma));

    const g11 = a * a;
    const g22 = b * b;
    const g33 = c * c;
    const g12 = a * b * cg;
    const g13 = a * c * cb;
    const g23 = b * c * ca;

    const G = [
      [g11, g12, g13],
      [g12, g22, g23],
      [g13, g23, g33]
    ];

    const determinant = (
      g11 * (g22 * g33 - g23 * g23) -
      g12 * (g12 * g33 - g23 * g13) +
      g13 * (g12 * g23 - g22 * g13)
    );

    const vol = determinant > 0 ? Math.sqrt(determinant) : 0;
    return { metricG: G, detG: determinant, volumeV: vol };
  }, [params]);

  // 2. Reciprocal Metric Tensor G* = G^-1
  const {
    metricGStar,
    reciprocalVolumeVStar,
    aStar,
    bStar,
    cStar,
    alphaStar,
    betaStar,
    gammaStar
  } = useMemo(() => {
    if (detG <= 0) {
      const zeros = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      return {
        metricGStar: zeros,
        reciprocalVolumeVStar: 0,
        aStar: 0, bStar: 0, cStar: 0,
        alphaStar: 90, betaStar: 90, gammaStar: 90
      };
    }

    const g11 = metricG[0][0], g12 = metricG[0][1], g13 = metricG[0][2];
    const g22 = metricG[1][1], g23 = metricG[1][2];
    const g33 = metricG[2][2];

    const c11 = (g22 * g33 - g23 * g23) / detG;
    const c12 = (g13 * g23 - g12 * g33) / detG;
    const c13 = (g12 * g23 - g13 * g22) / detG;
    const c22 = (g11 * g33 - g13 * g13) / detG;
    const c23 = (g12 * g13 - g11 * g23) / detG;
    const c33 = (g11 * g22 - g12 * g12) / detG;

    const GStar = [
      [c11, c12, c13],
      [c12, c22, c23],
      [c13, c23, c33]
    ];

    const aS = Math.sqrt(Math.max(0, c11));
    const bS = Math.sqrt(Math.max(0, c22));
    const cS = Math.sqrt(Math.max(0, c33));

    const toDeg = (rad: number) => (rad * 180) / Math.PI;
    const alpS = aS > 0 && bS > 0 && cS > 0 ? toDeg(Math.acos(Math.max(-1, Math.min(1, c23 / (bS * cS))))) : 90;
    const betS = aS > 0 && bS > 0 && cS > 0 ? toDeg(Math.acos(Math.max(-1, Math.min(1, c13 / (aS * cS))))) : 90;
    const gamS = aS > 0 && bS > 0 && cS > 0 ? toDeg(Math.acos(Math.max(-1, Math.min(1, c12 / (aS * bS))))) : 90;

    return {
      metricGStar: GStar,
      reciprocalVolumeVStar: volumeV > 0 ? 1 / volumeV : 0,
      aStar: aS,
      bStar: bS,
      cStar: cS,
      alphaStar: alpS,
      betaStar: betS,
      gammaStar: gamS
    };
  }, [metricG, detG, volumeV]);

  // 3. Invariants & Niggli Metric Vector
  const invariantsG = useMemo(() => {
    const I1 = metricG[0][0] + metricG[1][1] + metricG[2][2];
    const I2 = (
      (metricG[0][0] * metricG[1][1] - metricG[0][1] * metricG[0][1]) +
      (metricG[1][1] * metricG[2][2] - metricG[1][2] * metricG[1][2]) +
      (metricG[0][0] * metricG[2][2] - metricG[0][2] * metricG[0][2])
    );
    const I3 = detG;
    return { I1, I2, I3 };
  }, [metricG, detG]);

  const niggliVector = useMemo(() => {
    const A = metricG[0][0];
    const B = metricG[1][1];
    const C = metricG[2][2];
    const D = 2 * metricG[1][2];
    const E = 2 * metricG[0][2];
    const F = 2 * metricG[0][1];
    const isNiggliOrdered = A <= B && B <= C;
    return { A, B, C, D, E, F, isNiggliOrdered };
  }, [metricG]);

  // 4. Crystallographic Geometry Calculations
  const getPlaneProperties = (h: number, k: number, l: number) => {
    const hVec = [h, k, l];
    let invDSq = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        invDSq += hVec[i] * metricGStar[i][j] * hVec[j];
      }
    }
    const d = invDSq > 0 ? 1 / Math.sqrt(invDSq) : 0;
    const gMag = Math.sqrt(Math.max(0, invDSq));
    return { invDSq, d, gMag };
  };

  const plane1Calc = useMemo(() => getPlaneProperties(h1, k1, l1), [h1, k1, l1, metricGStar]);
  const plane2Calc = useMemo(() => getPlaneProperties(h2, k2, l2), [h2, k2, l2, metricGStar]);

  // Interplanar Angle φ between (h1 k1 l1) and (h2 k2 l2)
  const interplanarAngle = useMemo(() => {
    const hA = [h1, k1, l1];
    const hB = [h2, k2, l2];
    let dot = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        dot += hA[i] * metricGStar[i][j] * hB[j];
      }
    }
    const denom = plane1Calc.gMag * plane2Calc.gMag;
    if (denom <= 0) return 0;
    const cosPhi = Math.max(-1, Math.min(1, dot / denom));
    return (Math.acos(cosPhi) * 180) / Math.PI;
  }, [h1, k1, l1, h2, k2, l2, metricGStar, plane1Calc, plane2Calc]);

  // Direct Vector Lengths: ||u|| = sqrt(u^T G u)
  const getDirectionLength = (u: number, v: number, w: number) => {
    const uVec = [u, v, w];
    let lenSq = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        lenSq += uVec[i] * metricG[i][j] * uVec[j];
      }
    }
    return Math.sqrt(Math.max(0, lenSq));
  };

  const lenU1 = useMemo(() => getDirectionLength(u1, v1, w1), [u1, v1, w1, metricG]);
  const lenU2 = useMemo(() => getDirectionLength(u2, v2, w2), [u2, v2, w2, metricG]);

  // Cross Products:
  // Zone axis [uvw] from two planes (h1 k1 l1) and (h2 k2 l2)
  const zoneAxisFromPlanes = useMemo(() => {
    const u = k1 * l2 - l1 * k2;
    const v = l1 * h2 - h1 * l2;
    const w = h1 * k2 - k1 * h2;
    return { u, v, w };
  }, [h1, k1, l1, h2, k2, l2]);

  // Plane (hkl) from two directions [u1 v1 w1] and [u2 v2 w2]
  const planeFromDirections = useMemo(() => {
    const h = v1 * w2 - w1 * v2;
    const k = w1 * u2 - u1 * w2;
    const l = u1 * v2 - v1 * u2;
    return { h, k, l };
  }, [u1, v1, w1, u2, v2, w2]);

  // Weiss Zone Law Check: h1*u1 + k1*v1 + l1*w1 = 0
  const planeZoneDotProduct = useMemo(() => {
    return h1 * u1 + k1 * v1 + l1 * w1;
  }, [h1, k1, l1, u1, v1, w1]);

  // 5. Busing-Levy Cartesian Matrix B (Busing & Levy, 1967)
  const { matrixB, matrixBTB, cartVec } = useMemo(() => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const aS = aStar, bS = bStar, cS = cStar;
    const alS = toRad(alphaStar);
    const beS = toRad(betaStar);
    const gaS = toRad(gammaStar);

    const b11 = aS;
    const b12 = bS * Math.cos(gaS);
    const b13 = cS * Math.cos(beS);

    const b21 = 0;
    const b22 = bS * Math.sin(gaS);
    // cos(alpha) from reciprocal parameters
    const cosAlpha = (Math.cos(beS) * Math.cos(gaS) - Math.cos(alS)) / (Math.sin(beS) * Math.sin(gaS) || 1);
    const b23 = -cS * Math.sin(beS) * cosAlpha;

    const b31 = 0;
    const b32 = 0;
    const b33 = cStar * Math.sqrt(
      1 - Math.cos(beS)*Math.cos(beS) - Math.cos(alS)*Math.cos(alS) - Math.cos(gaS)*Math.cos(gaS) + 2*Math.cos(alS)*Math.cos(beS)*Math.cos(gaS)
    ) / Math.sin(gaS); // Corrected B33

    const B = [
      [b11, b12, b13],
      [b21, b22, b23],
      [b31, b32, isNaN(b33) ? 0 : b33]
    ];

    // Compute B^T * B to prove mathematical identity with G*
    const BTB = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          BTB[i][j] += B[k][i] * B[k][j];
        }
      }
    }

    // Cartesian vector r_Cart = B * [fracX, fracY, fracZ]
    const cx = B[0][0] * fracX + B[0][1] * fracY + B[0][2] * fracZ;
    const cy = B[1][0] * fracX + B[1][1] * fracY + B[1][2] * fracZ;
    const cz = B[2][0] * fracX + B[2][1] * fracY + B[2][2] * fracZ;
    const cLen = Math.sqrt(cx * cx + cy * cy + cz * cz);

    return {
      matrixB: B,
      matrixBTB: BTB,
      cartVec: { x: cx, y: cy, z: cz, length: cLen }
    };
  }, [params, aStar, bStar, cStar, alphaStar, betaStar, gammaStar, fracX, fracY, fracZ]);

  // Reciprocal vector helper for 2D visualizer
  const getReciprocalVectorProps = (h: number, k: number) => {
    let invDSq = 0;
    invDSq = (
      h * h * metricGStar[0][0] +
      k * k * metricGStar[1][1] +
      2 * h * k * metricGStar[0][1]
    );
    const gMag = Math.sqrt(Math.max(0, invDSq));
    const dSpacing = gMag > 0 ? 1 / gMag : 0;
    const lambda = 1.5406;
    const sinTheta = (lambda * gMag) / 2;
    const isValidBragg = sinTheta > 0 && sinTheta <= 1;
    const thetaDeg = isValidBragg ? (Math.asin(sinTheta) * 180) / Math.PI : null;

    return { gMag, dSpacing, thetaDeg, isValidBragg };
  };

  const vec1Props = useMemo(() => getReciprocalVectorProps(h1, k1), [h1, k1, metricGStar]);
  const vec2Props = useMemo(() => getReciprocalVectorProps(h2, k2), [h2, k2, metricGStar]);

  const interVectorAngle = useMemo(() => {
    const dot = (
      h1 * h2 * metricGStar[0][0] +
      k1 * k2 * metricGStar[1][1] +
      (h1 * k2 + k1 * h2) * metricGStar[0][1]
    );
    const denom = vec1Props.gMag * vec2Props.gMag;
    if (denom <= 0) return 0;
    const cosA = Math.max(-1, Math.min(1, dot / denom));
    return (Math.acos(cosA) * 180) / Math.PI;
  }, [h1, k1, h2, k2, metricGStar, vec1Props, vec2Props]);

  const vectorParallelogramArea = useMemo(() => {
    const angleRad = (interVectorAngle * Math.PI) / 180;
    return vec1Props.gMag * vec2Props.gMag * Math.sin(angleRad);
  }, [vec1Props, vec2Props, interVectorAngle]);

  const filteredMaterials = useMemo(() => {
    if (materialCategory === 'All') return MATERIAL_PRESETS;
    return MATERIAL_PRESETS.filter((m) => m.category === materialCategory);
  }, [materialCategory]);

  const startComputation = () => {
    setAppState('computing');
    setComputingStep(0);
    setTimeout(() => setComputingStep(1), 600); // Metric G
    setTimeout(() => setComputingStep(2), 1200); // Volume
    setTimeout(() => setComputingStep(3), 1800); // Metric G*
    setTimeout(() => {
      setAppState('results');
    }, 2500);
  };

  const metricWalkthroughSteps: WizardStep[] = [
    {
      title: 'Direct Metric Tensor G & Basis Dot Products',
      subtitle: 'g_ij = a_i · a_j (Lengths & Inter-axial Angles)',
      explanation: 'Encodes the geometry of the real-space unit cell into a symmetric 3×3 matrix G. Diagonal components represent squared lattice constants (a², b², c²); off-diagonals represent cosine products (ab cosγ, etc.).',
      tip: 'The determinant det(G) is strictly equal to the square of the unit cell volume: V² = det(G).'
    },
    {
      title: 'Reciprocal Dual Metric Tensor G*',
      subtitle: 'G* = G⁻¹ (Contravariant Metric Tensor)',
      explanation: 'Inverse matrix G⁻¹ directly provides the reciprocal basis dot products g*^ij = a*^i · a*^j. It allows exact computation of interplanar d-spacings for any Miller index (hkl) in arbitrary non-orthogonal crystal systems: 1/d² = hᵀ G* h.',
      tip: 'In orthogonal systems (Cubic, Tetragonal, Orthorhombic), G and G* are purely diagonal.'
    },
    {
      title: 'Busing-Levy Cartesian Orientation Matrix (B)',
      subtitle: 'Mapping Direct/Reciprocal Axes to Lab XYZ Frame',
      explanation: 'Constructs the lower triangular B-matrix that converts reciprocal lattice coordinates into Cartesian laboratory coordinates (q_xyz = 2π B · h), essential for single-crystal 4-circle diffractometers.',
      tip: 'The B-matrix maintains a* aligned with X_lab and b* in the XY plane by International Tables crystallographic standard convention.'
    },
    {
      title: 'Niggli Reduction & Invariants',
      subtitle: 'Unit Cell Uniqueness & Invariant Traces',
      explanation: 'Calculates the primary, secondary, and tertiary tensor invariants (I₁, I₂, I₃) and the standard 6-parameter Niggli metric vector [A, B, C, D, E, F] to uniquely classify the Bravais lattice.',
      tip: 'Niggli reduction eliminates ambiguous unit cell choices by finding the shortest possible non-coplanar basis vectors.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6 font-sans">
      {/* 0. Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Crystallographic Metric Tensor Engine (G & G*)"
        description="Master covariant direct metric algebra, contravariant reciprocal duals, Busing-Levy frames, and Niggli reduction."
        steps={metricWalkthroughSteps}
        presetNames={MATERIAL_PRESETS.map(m => `${m.name} (${m.system})`)}
        onLoadBenchmarkPreset={(idx) => {
          const m = MATERIAL_PRESETS[idx];
          if (m) {
            setSystem(m.system);
            setParams(m.params);
            setSelectedMaterialId(m.id);
          }
        }}
      />

      {/* 0.5 Physical Meaning Verdict Banner */}
      {appState === 'results' && (
        <PhysicalMeaningSummary
          title="Direct & Reciprocal Metric Tensor Verdict"
          tone="success"
          statement={`Unit cell exhibits direct volume V = ${fmt(volumeV, 3)} Å³ and reciprocal cell volume V* = ${fmt(reciprocalVolumeVStar, 6)} Å⁻³ with Niggli order [${fmt(niggliVector.A, 1)}, ${fmt(niggliVector.B, 1)}, ${fmt(niggliVector.C, 1)}].`}
          contextNote={`Direct metric determinant det(G) = ${fmt(detG, 3)} Å⁶. Reciprocal parameters: a* = ${fmt(aStar, 4)} Å⁻¹, b* = ${fmt(bStar, 4)} Å⁻¹, c* = ${fmt(cStar, 4)} Å⁻¹. ${system === 'Triclinic' || system === 'Monoclinic' ? 'Non-orthogonal cross-terms actively couple d-spacing calculations across non-zero off-diagonals.' : 'Orthogonal metric maintains decoupled reciprocal axes.'}`}
          metrics={[
            { label: 'Cell Volume V', value: fmt(volumeV, 2), unit: 'Å³' },
            { label: 'det(G) Trace', value: fmt(detG, 2), unit: 'Å⁶' },
            { label: 'Reciprocal a*', value: fmt(aStar, 3), unit: 'Å⁻¹' },
            { label: 'Invariant I₁', value: fmt(invariantsG.I1, 2), unit: 'Å²' }
          ]}
        />
      )}

      {/* Top Banner: Module Header */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Main Title & Global Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>CRYSTALLOGRAPHIC METRIC TENSOR ENGINE</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Metric Tensor Algebra & Reciprocal Geometry
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl">
              Complete dual-space tensor calculations (<strong className="text-violet-300">G</strong> & <strong className="text-cyan-300">G*</strong>), 2D/3D reciprocal lattice slice visualization, Busing-Levy Cartesian frame, and anisotropic strain mechanics.
            </p>
          </div>

          {appState === 'results' && (
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center animate-in fade-in duration-500">
              <span className="px-3 py-1 rounded-xl bg-violet-950/80 border border-violet-800/60 text-violet-300 text-xs font-mono font-bold">
                {system}
              </span>
              <span className="px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-mono font-bold">
                V = {fmt(volumeV, 3)} Å³
              </span>
              <button 
                onClick={() => setAppState('setup')}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Edit Parameters
              </button>
            </div>
          )}
        </div>

        {appState === 'setup' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Material Presets Selector & Category Filter */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Benchmark Crystal Database:
                </span>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1">
                  {(['All', 'Metals & Elements', 'Semiconductors & Solar', 'Oxides & Ceramics', 'Superconductors & 2D', 'Minerals & Clays'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMaterialCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        materialCategory === cat
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Material Buttons */}
              <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto pr-1">
                {filteredMaterials.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => handleMaterialSelect(mat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all text-left cursor-pointer ${
                      selectedMaterialId === mat.id
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-md font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">{mat.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                      <span>{mat.formula}</span>
                      <span>•</span>
                      <span>{mat.system}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Crystal Systems Selector Toolbar */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Select 7 Crystal Systems:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {(Object.keys(PRESET_SYSTEMS) as CrystalSystem[]).map((sys) => {
                  const isActive = system === sys;
                  return (
                    <button
                      key={sys}
                      onClick={() => handleSystemChange(sys)}
                      className={`p-2.5 rounded-2xl text-xs font-mono font-bold transition-all border text-center cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20 font-black'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      {sys}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lattice Parameters Interactive Inputs Bar */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Direct Lattice Parameters (a, b, c, α, β, γ)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {PRESET_SYSTEMS[system].symmetryDesc}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
                {/* a */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 focus-within:border-cyan-500/50 transition-colors">
                  <span className="text-[10px] text-slate-400 block font-bold">a (Å)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={params.a}
                    onChange={(e) => updateLatticeParam('a', parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-white font-mono font-bold text-sm outline-none focus:text-cyan-300"
                  />
                </div>

                {/* b */}
                <div className={`bg-slate-950 p-2.5 rounded-xl border transition-colors ${
                  system === 'Cubic' || system === 'Tetragonal' || system === 'Hexagonal' || system === 'Rhombohedral'
                    ? 'border-slate-800/50' : 'border-slate-800 focus-within:border-cyan-500/50'
                }`}>
                  <span className="text-[10px] text-slate-400 block font-bold">b (Å)</span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={system === 'Cubic' || system === 'Tetragonal' || system === 'Hexagonal' || system === 'Rhombohedral'}
                    value={params.b}
                    onChange={(e) => updateLatticeParam('b', parseFloat(e.target.value) || 0)}
                    className={`w-full bg-transparent font-mono font-bold text-sm outline-none ${
                      system === 'Cubic' || system === 'Tetragonal' || system === 'Hexagonal' || system === 'Rhombohedral'
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-white focus:text-cyan-300'
                    }`}
                  />
                </div>

                {/* c */}
                <div className={`bg-slate-950 p-2.5 rounded-xl border transition-colors ${
                  system === 'Cubic' || system === 'Rhombohedral'
                    ? 'border-slate-800/50' : 'border-slate-800 focus-within:border-cyan-500/50'
                }`}>
                  <span className="text-[10px] text-slate-400 block font-bold">c (Å)</span>
                  <input
                    type="number"
                    step="0.01"
                    disabled={system === 'Cubic' || system === 'Rhombohedral'}
                    value={params.c}
                    onChange={(e) => updateLatticeParam('c', parseFloat(e.target.value) || 0)}
                    className={`w-full bg-transparent font-mono font-bold text-sm outline-none ${
                      system === 'Cubic' || system === 'Rhombohedral'
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-white focus:text-cyan-300'
                    }`}
                  />
                </div>

                {/* alpha */}
                <div className={`bg-slate-950 p-2.5 rounded-xl border transition-colors ${
                  system !== 'Triclinic' && system !== 'Rhombohedral'
                    ? 'border-slate-800/50' : 'border-slate-800 focus-within:border-cyan-500/50'
                }`}>
                  <span className="text-[10px] text-slate-400 block font-bold">α (deg)</span>
                  <input
                    type="number"
                    step="0.1"
                    disabled={system !== 'Triclinic' && system !== 'Rhombohedral'}
                    value={params.alpha}
                    onChange={(e) => updateLatticeParam('alpha', parseFloat(e.target.value) || 0)}
                    className={`w-full bg-transparent font-mono font-bold text-sm outline-none ${
                      system !== 'Triclinic' && system !== 'Rhombohedral'
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-white focus:text-cyan-300'
                    }`}
                  />
                </div>

                {/* beta */}
                <div className={`bg-slate-950 p-2.5 rounded-xl border transition-colors ${
                  system !== 'Triclinic' && system !== 'Monoclinic' && system !== 'Rhombohedral'
                    ? 'border-slate-800/50' : 'border-slate-800 focus-within:border-cyan-500/50'
                }`}>
                  <span className="text-[10px] text-slate-400 block font-bold">β (deg)</span>
                  <input
                    type="number"
                    step="0.1"
                    disabled={system !== 'Triclinic' && system !== 'Monoclinic' && system !== 'Rhombohedral'}
                    value={params.beta}
                    onChange={(e) => updateLatticeParam('beta', parseFloat(e.target.value) || 0)}
                    className={`w-full bg-transparent font-mono font-bold text-sm outline-none ${
                      system !== 'Triclinic' && system !== 'Monoclinic' && system !== 'Rhombohedral'
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-white focus:text-cyan-300'
                    }`}
                  />
                </div>

                {/* gamma */}
                <div className={`bg-slate-950 p-2.5 rounded-xl border transition-colors ${
                  system !== 'Triclinic' && system !== 'Rhombohedral'
                    ? 'border-slate-800/50' : 'border-slate-800 focus-within:border-cyan-500/50'
                }`}>
                  <span className="text-[10px] text-slate-400 block font-bold">γ (deg)</span>
                  <input
                    type="number"
                    step="0.1"
                    disabled={system !== 'Triclinic' && system !== 'Rhombohedral'}
                    value={params.gamma}
                    onChange={(e) => updateLatticeParam('gamma', parseFloat(e.target.value) || 0)}
                    className={`w-full bg-transparent font-mono font-bold text-sm outline-none ${
                      system !== 'Triclinic' && system !== 'Rhombohedral'
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-white focus:text-cyan-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={startComputation} 
                className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-cyan-500/20 transition-all flex items-center gap-3 active:scale-95"
              >
                Compute Metric Tensors
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {appState === 'computing' && (
        <div className="bg-slate-950 rounded-3xl p-12 border border-slate-800/80 shadow-2xl flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-300 min-h-[400px]">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
            <Grid className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>
          
          <div className="space-y-4 w-full max-w-lg">
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 0 ? 'bg-slate-900 border-cyan-500/30 text-cyan-300 shadow-md' : 'bg-slate-900/20 border-slate-800/50 text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-xs">1</span>
                Constructing Basis Vectors (a, b, c)...
              </span>
              {computingStep > 0 && <Check className="w-5 h-5 text-green-400 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 1 ? 'bg-slate-900 border-violet-500/30 text-violet-300 shadow-md' : 'bg-slate-900/20 border-slate-800/50 text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-xs">2</span>
                Computing Direct Metric Tensor [G]...
              </span>
              {computingStep > 1 && <Check className="w-5 h-5 text-green-400 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 2 ? 'bg-slate-900 border-amber-500/30 text-amber-300 shadow-md' : 'bg-slate-900/20 border-slate-800/50 text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-xs">3</span>
                Calculating Cell Volume V = √det(G)...
              </span>
              {computingStep > 2 && <Check className="w-5 h-5 text-green-400 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 3 ? 'bg-slate-900 border-emerald-500/30 text-emerald-300 shadow-md' : 'bg-slate-900/20 border-slate-800/50 text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-xs">4</span>
                Inverting to Reciprocal Tensor [G*]...
              </span>
              {computingStep > 3 && <Check className="w-5 h-5 text-green-400 animate-in zoom-in" />}
            </div>
          </div>
        </div>
      )}

      {appState === 'results' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Navigation Tabs Bar */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'overview', label: '1. Lattice & Dual Tensors [G / G*]', icon: Grid },
              { id: 'geometry', label: '2. Crystallographic Geometry (1/d²)', icon: Compass },
              { id: 'reciprocal_net', label: '3. 2D Reciprocal Net & Ewald Slice', icon: Box },
              { id: 'busing_levy', label: '4. Busing-Levy Cartesian Frame [B]', icon: Cpu },
              { id: 'strain_thermal', label: '5. 3D Strain & Thermal Dilation', icon: Activity },
              { id: 'learning_guide', label: '6. Pedagogical Guide & Concepts', icon: BookOpen },
              { id: 'python_export', label: '7. NumPy / PyMatGen / LaTeX', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'overview' && (
              <MetricTensorOverviewTab
                system={system}
                params={params}
                metricG={metricG}
                metricGStar={metricGStar}
                detG={detG}
                volumeV={volumeV}
                reciprocalVolumeVStar={reciprocalVolumeVStar}
                aStar={aStar}
                bStar={bStar}
                cStar={cStar}
                alphaStar={alphaStar}
                betaStar={betaStar}
                gammaStar={gammaStar}
                invariantsG={invariantsG}
                niggliVector={niggliVector}
                copyToClipboard={copyToClipboard}
                copiedKey={copiedKey}
              />
            )}

            {activeTab === 'geometry' && (
              <MetricTensorGeometryTab
                h1={h1} setH1={setH1}
                k1={k1} setK1={setK1}
                l1={l1} setL1={setL1}
                h2={h2} setH2={setH2}
                k2={k2} setK2={setK2}
                l2={l2} setL2={setL2}
                u1={u1} setU1={setU1}
                v1={v1} setV1={setV1}
                w1={w1} setW1={setW1}
                u2={u2} setU2={setU2}
                v2={v2} setV2={setV2}
                w2={w2} setW2={setW2}
                metricG={metricG}
                metricGStar={metricGStar}
                plane1Calc={plane1Calc}
                plane2Calc={plane2Calc}
                interplanarAngle={interplanarAngle}
                lenU1={lenU1}
                lenU2={lenU2}
                zoneAxisFromPlanes={zoneAxisFromPlanes}
                planeFromDirections={planeFromDirections}
                planeZoneDotProduct={planeZoneDotProduct}
              />
            )}

            {activeTab === 'reciprocal_net' && (
              <MetricTensorReciprocalNetTab
                system={system}
                aStar={aStar}
                bStar={bStar}
                cStar={cStar}
                alphaStar={alphaStar}
                betaStar={betaStar}
                gammaStar={gammaStar}
                h1={h1} setH1={setH1}
                k1={k1} setK1={setK1}
                h2={h2} setH2={setH2}
                k2={k2} setK2={setK2}
                vec1Props={vec1Props}
                vec2Props={vec2Props}
                interVectorAngle={interVectorAngle}
                vectorParallelogramArea={vectorParallelogramArea}
                getReciprocalVectorProps={getReciprocalVectorProps}
              />
            )}

            {activeTab === 'busing_levy' && (
              <MetricTensorBusingLevyTab
                matrixB={matrixB}
                matrixBTB={matrixBTB}
                metricGStar={metricGStar}
                fracX={fracX} setFracX={setFracX}
                fracY={fracY} setFracY={setFracY}
                fracZ={fracZ} setFracZ={setFracZ}
                cartVec={cartVec}
                copyToClipboard={copyToClipboard}
                copiedKey={copiedKey}
              />
            )}

            {activeTab === 'strain_thermal' && (
              <MetricTensorStrainThermalTab
                system={system}
                params={params}
                volumeV={volumeV}
                metricG={metricG}
              />
            )}

            {activeTab === 'learning_guide' && (
              <MetricTensorLearningGuideTab />
            )}

            {activeTab === 'python_export' && (
              <MetricTensorPythonTab
                system={system}
                params={params}
                metricG={metricG}
                metricGStar={metricGStar}
                matrixB={matrixB}
                h1={h1}
                k1={k1}
                l1={l1}
                copyToClipboard={copyToClipboard}
                copiedKey={copiedKey}
              />
            )}
          </div>
        </div>
      )}

    </div>
  );
};
