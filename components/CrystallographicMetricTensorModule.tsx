import React, { useState, useMemo } from 'react';
import {
  Layers,
  Compass,
  Grid,
  Cpu,
  Activity,
  BookOpen,
  Terminal,
  Sliders,
  Box,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import {
  CrystalSystem,
  LatticeParams,
  MATERIAL_PRESETS,
  PRESET_SYSTEMS,
  fmt
} from './metric_tensor/metricTensorTypes';

import {
  computeDirectMetric,
  computeReciprocalMetric,
  computeDualFrames,
  computeNiggliReduction,
  quadraticForm,
  bilinearForm
} from './metric_tensor/metricTensorEngine';

import { MetricTensorOverviewTab } from './metric_tensor/MetricTensorOverviewTab';
import { MetricTensorGeometryTab } from './metric_tensor/MetricTensorGeometryTab';
import { MetricTensorReciprocalNetTab } from './metric_tensor/MetricTensorReciprocalNetTab';
import { MetricTensorBusingLevyTab } from './metric_tensor/MetricTensorBusingLevyTab';
import { MetricTensorStrainThermalTab } from './metric_tensor/MetricTensorStrainThermalTab';
import { MetricTensorLearningGuideTab } from './metric_tensor/MetricTensorLearningGuideTab';
import { MetricTensorPythonTab } from './metric_tensor/MetricTensorPythonTab';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';

interface CrystallographicMetricTensorModuleProps {
  pythonFeaturesEnabled?: boolean;
}

export const CrystallographicMetricTensorModule: React.FC<CrystallographicMetricTensorModuleProps> = ({
  pythonFeaturesEnabled = true
}) => {
  const [showParameterDock, setShowParameterDock] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'geometry' | 'reciprocal_net' | 'busing_levy' | 'strain_thermal' | 'learning_guide' | 'python_export'
  >('overview');

  // Crystal System & Lattice Parameters
  const [system, setSystem] = useState<CrystalSystem>('Cubic');
  const [params, setParams] = useState<LatticeParams>(MATERIAL_PRESETS[0].params);
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

  // Fractional coordinate for Dual Frame converter
  const [fracX, setFracX] = useState<number>(0.25);
  const [fracY, setFracY] = useState<number>(0.25);
  const [fracZ, setFracZ] = useState<number>(0.25);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSystemChange = (newSystem: CrystalSystem) => {
    setSystem(newSystem);
    setSelectedMaterialId('');
    setParams(PRESET_SYSTEMS[newSystem].params);
  };

  const handleMaterialSelect = (matId: string) => {
    setSelectedMaterialId(matId);
    const mat = MATERIAL_PRESETS.find((m) => m.id === matId);
    if (mat) {
      setSystem(mat.system);
      setParams({ ...mat.params });
    }
  };

  const updateLatticeParam = (key: keyof LatticeParams, val: number) => {
    const safeVal = Math.max(0.1, val);
    const updated = { ...params, [key]: safeVal };

    if (system === 'Cubic') {
      if (key === 'a' || key === 'b' || key === 'c') {
        updated.a = safeVal;
        updated.b = safeVal;
        updated.c = safeVal;
      }
      updated.alpha = 90;
      updated.beta = 90;
      updated.gamma = 90;
    } else if (system === 'Tetragonal') {
      if (key === 'a' || key === 'b') {
        updated.a = safeVal;
        updated.b = safeVal;
      }
      updated.alpha = 90;
      updated.beta = 90;
      updated.gamma = 90;
    } else if (system === 'Hexagonal') {
      if (key === 'a' || key === 'b') {
        updated.a = safeVal;
        updated.b = safeVal;
      }
      updated.alpha = 90;
      updated.beta = 90;
      updated.gamma = 120;
    } else if (system === 'Rhombohedral') {
      if (key === 'a' || key === 'b' || key === 'c') {
        updated.a = safeVal;
        updated.b = safeVal;
        updated.c = safeVal;
      }
      if (key === 'alpha' || key === 'beta' || key === 'gamma') {
        updated.alpha = safeVal;
        updated.beta = safeVal;
        updated.gamma = safeVal;
      }
    } else if (system === 'Orthorhombic') {
      updated.alpha = 90;
      updated.beta = 90;
      updated.gamma = 90;
    } else if (system === 'Monoclinic') {
      updated.alpha = 90;
      updated.gamma = 90;
    }

    setSelectedMaterialId('');
    setParams(updated);
  };

  // ==================== INSTANT LIVE TENSOR ENGINE ====================
  const directMetric = useMemo(() => computeDirectMetric(params), [params]);
  const { G: metricG, detG, volumeV, invariants: invariantsG } = directMetric;

  const recipMetric = useMemo(
    () => computeReciprocalMetric(metricG, detG, volumeV),
    [metricG, detG, volumeV]
  );
  const {
    GStar: metricGStar,
    VStar: reciprocalVolumeVStar,
    aStar,
    bStar,
    cStar,
    alphaStar,
    betaStar,
    gammaStar
  } = recipMetric;

  const dualFrames = useMemo(
    () => computeDualFrames(params, metricG, recipMetric),
    [params, metricG, recipMetric]
  );

  const niggli = useMemo(() => computeNiggliReduction(metricG), [metricG]);

  // Plane properties
  const plane1Calc = useMemo(() => {
    const invDSq = quadraticForm(metricGStar, [h1, k1, l1]);
    const gMag = Math.sqrt(Math.max(0, invDSq));
    return { invDSq, gMag, d: gMag > 1e-12 ? 1 / gMag : 0 };
  }, [h1, k1, l1, metricGStar]);

  const plane2Calc = useMemo(() => {
    const invDSq = quadraticForm(metricGStar, [h2, k2, l2]);
    const gMag = Math.sqrt(Math.max(0, invDSq));
    return { invDSq, gMag, d: gMag > 1e-12 ? 1 / gMag : 0 };
  }, [h2, k2, l2, metricGStar]);

  const interplanarAngle = useMemo(() => {
    const dot = bilinearForm(metricGStar, [h1, k1, l1], [h2, k2, l2]);
    const denom = plane1Calc.gMag * plane2Calc.gMag;
    if (denom <= 1e-12) return 0;
    return (Math.acos(Math.max(-1, Math.min(1, dot / denom))) * 180) / Math.PI;
  }, [h1, k1, l1, h2, k2, l2, metricGStar, plane1Calc.gMag, plane2Calc.gMag]);

  const lenU1 = useMemo(() => Math.sqrt(Math.max(0, quadraticForm(metricG, [u1, v1, w1]))), [u1, v1, w1, metricG]);
  const lenU2 = useMemo(() => Math.sqrt(Math.max(0, quadraticForm(metricG, [u2, v2, w2]))), [u2, v2, w2, metricG]);

  const zoneAxisFromPlanes = useMemo(
    () => ({
      u: k1 * l2 - l1 * k2,
      v: l1 * h2 - h1 * l2,
      w: h1 * k2 - k1 * h2
    }),
    [h1, k1, l1, h2, k2, l2]
  );

  const planeFromDirections = useMemo(
    () => ({
      h: v1 * w2 - w1 * v2,
      k: w1 * u2 - u1 * w2,
      l: u1 * v2 - v1 * u2
    }),
    [u1, v1, w1, u2, v2, w2]
  );

  const planeZoneDotProduct = useMemo(() => h1 * u1 + k1 * v1 + l1 * w1, [h1, k1, l1, u1, v1, w1]);

  const filteredMaterials = useMemo(() => {
    if (materialCategory === 'All') return MATERIAL_PRESETS;
    return MATERIAL_PRESETS.filter((m) => m.category === materialCategory);
  }, [materialCategory]);

  const metricWalkthroughSteps: WizardStep[] = [
    {
      title: 'Covariant Direct Metric Tensor [G]',
      subtitle: 'g_ij = a_i · a_j (Bond Lengths, Directions & Volume V = √det(G))',
      explanation:
        'Encodes unit cell lengths and angles into a symmetric positive-definite 3×3 matrix. Contraction Δxᵀ G Δx evaluates exact atomic bond distances in any skewed crystal frame.',
      tip: 'The condition number κ(G) = λ₁/λ₃ quantifies geometric anisotropy and cell skewness.'
    },
    {
      title: 'Contravariant Reciprocal Tensor [G*]',
      subtitle: 'G* = G⁻¹ (Exact 1/d² = hᵀ G* h across all 230 space groups)',
      explanation:
        'Matrix inverse G⁻¹ computes exact interplanar spacings d_hkl, interplanar angles, Ewald sphere intersections, and mixed-space angles between [uvw] and (hkl)*.',
      tip: 'In orthogonal systems (Cubic, Tetragonal, Orthorhombic), G and G* are strictly diagonal.'
    },
    {
      title: 'Dual Orthogonalization Frames [A & B]',
      subtitle: 'Direct r = A·x_frac (AᵀA = G) vs Reciprocal q = B·h (BᵀB = G*)',
      explanation:
        'Separates direct-space Cartesian coordinates (matrix A in Å) from reciprocal diffractometer scattering vectors (Busing–Levy matrix B in Å⁻¹) while satisfying AᵀB = I₃.',
      tip: 'Verify the scalar invariant r·q = x_frac · h directly in Tab 4.'
    },
    {
      title: 'Křivý–Gruber Niggli Reduction & Continuum Strain',
      subtitle: 'Unimodular SL(3,ℤ) reduction & Finite Strain G′ = Aᵀ(I+ε)²A',
      explanation:
        'Finds the canonical reduced Niggli cell with integer unimodular matrix P (det P = +1), and simulates mechanical or thermal deformation of Bragg peaks.',
      tip: 'Try switching to Triclinic Kaolinite or Calcite to watch Niggli reduction converge in real time.'
    }
  ];

  const tabs = [
    { id: 'overview', label: '1. Dual Tensors & Niggli [G / G*]', icon: Grid },
    { id: 'geometry', label: '2. Geometry & Bond Metrology', icon: Compass },
    { id: 'reciprocal_net', label: '3. Reciprocal Net & Ewald', icon: Box },
    { id: 'busing_levy', label: '4. Dual Cartesian Frames [A / B]', icon: Cpu },
    { id: 'strain_thermal', label: '5. Finite Strain & Thermal [ε / α]', icon: Activity },
    { id: 'learning_guide', label: '6. Tensor Guide', icon: BookOpen },
    ...(pythonFeaturesEnabled ? [{ id: 'python_export', label: '7. Python / PyMatGen / LaTeX', icon: Terminal }] : [])
  ] as const;

  const isCellValid = detG > 1e-8;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-5 font-sans">
      <GuidedWalkthroughWizard
        moduleName="Crystallographic Metric Tensor Engine (G & G*)"
        description="Live dual-space tensor algebra, Křivý–Gruber Niggli reduction, Busing–Levy A/B frames, atomic bond metrology, and finite continuum strain."
        steps={metricWalkthroughSteps}
        presetNames={MATERIAL_PRESETS.map((m) => `${m.name} (${m.system})`)}
        onLoadBenchmarkPreset={(idx) => {
          const m = MATERIAL_PRESETS[idx];
          if (m) {
            setSystem(m.system);
            setParams({ ...m.params });
            setSelectedMaterialId(m.id);
          }
        }}
      />

      {/* Top Module Header & Collapsible Parameter Dock */}
      <div className="bg-slate-950 rounded-2xl p-5 lg:p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[11px] font-mono font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>CRYSTALLOGRAPHIC METRIC TENSOR ENGINE</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Dual-Space Metric Tensor Algebra & Reciprocal Geometry
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl">
              Live covariant <strong className="text-violet-300">[G]</strong> and contravariant{' '}
              <strong className="text-cyan-300">[G*]</strong> calculations, Křivý–Gruber Niggli reduction, Busing–Levy A/B frames, and continuum lattice mechanics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-lg bg-violet-950/70 border border-violet-800/60 text-violet-300 text-xs font-mono font-bold whitespace-nowrap">
              {system}
            </span>
            <span className="px-3 py-1 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-xs font-mono font-bold tabular-nums whitespace-nowrap">
              V = {fmt(volumeV, 3)} Å³
            </span>
            <button
              onClick={() => setShowParameterDock(!showParameterDock)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showParameterDock ? 'Compact Header' : 'Edit Cell & Presets'}</span>
              {showParameterDock ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Live Interactive Crystal & Parameter Dock (Instant Reactivity, Zero Spinner Gate) */}
        {showParameterDock && (
          <div className="space-y-4 pt-3 border-t border-slate-800/80">
            {/* Benchmark Presets + Category Filter */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Benchmark Crystal Library
                </span>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      'All',
                      'Metals & Elements',
                      'Semiconductors & Solar',
                      'Oxides & Ceramics',
                      'Superconductors & 2D',
                      'Minerals & Clays'
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMaterialCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        materialCategory === cat
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto pr-1">
                {filteredMaterials.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => handleMaterialSelect(mat.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors text-left cursor-pointer ${
                      selectedMaterialId === mat.id
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 font-bold'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-[11px] leading-tight">{mat.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {mat.formula} · {mat.system}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 7 Crystal Systems + Direct Lattice Parameters */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
              <div className="xl:col-span-5 grid grid-cols-4 sm:grid-cols-7 xl:grid-cols-4 gap-1.5">
                {(Object.keys(PRESET_SYSTEMS) as CrystalSystem[]).map((sys) => (
                  <button
                    key={sys}
                    onClick={() => handleSystemChange(sys)}
                    className={`py-2 px-1.5 rounded-lg text-[11px] font-mono font-bold transition-colors border text-center cursor-pointer whitespace-nowrap ${
                      system === sys
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {sys}
                  </button>
                ))}
              </div>

              <div className="xl:col-span-7 grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono tabular-nums">
                {[
                  { key: 'a' as const, label: 'a (Å)', step: '0.01', disabled: false },
                  {
                    key: 'b' as const,
                    label: 'b (Å)',
                    step: '0.01',
                    disabled:
                      system === 'Cubic' ||
                      system === 'Tetragonal' ||
                      system === 'Hexagonal' ||
                      system === 'Rhombohedral'
                  },
                  {
                    key: 'c' as const,
                    label: 'c (Å)',
                    step: '0.01',
                    disabled: system === 'Cubic' || system === 'Rhombohedral'
                  },
                  {
                    key: 'alpha' as const,
                    label: 'α (°)',
                    step: '0.1',
                    disabled: system !== 'Triclinic' && system !== 'Rhombohedral'
                  },
                  {
                    key: 'beta' as const,
                    label: 'β (°)',
                    step: '0.1',
                    disabled: system !== 'Triclinic' && system !== 'Monoclinic' && system !== 'Rhombohedral'
                  },
                  {
                    key: 'gamma' as const,
                    label: 'γ (°)',
                    step: '0.1',
                    disabled: system !== 'Triclinic' && system !== 'Rhombohedral'
                  }
                ].map((field) => (
                  <div
                    key={field.key}
                    className={`bg-slate-900/70 p-2 rounded-lg border ${
                      field.disabled ? 'border-slate-800/50 opacity-60' : 'border-slate-800 focus-within:border-cyan-500/50'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 block font-bold">{field.label}</span>
                    <input
                      type="number"
                      step={field.step}
                      disabled={field.disabled}
                      value={params[field.key]}
                      onChange={(e) => updateLatticeParam(field.key, parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-white font-mono font-bold text-xs outline-none disabled:cursor-not-allowed tabular-nums"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Physical Meaning Summary Strip */}
      <PhysicalMeaningSummary
        title="Dual-Space Metric Tensor Verdict"
        tone={isCellValid ? 'success' : 'warning'}
        statement={
          isCellValid
            ? `Direct volume V = ${fmt(volumeV, 3)} Å³ and reciprocal V* = ${fmt(reciprocalVolumeVStar, 6)} Å⁻³; canonical Niggli reduced order [${fmt(niggli.reducedVector.A, 1)}, ${fmt(niggli.reducedVector.B, 1)}, ${fmt(niggli.reducedVector.C, 1)}] (${niggli.type}).`
            : 'Degenerate unit cell parameters (det(G) <= 0): check interaxial angles satisfy triclinic volume inequality.'
        }
        contextNote={`Direct det(G) = ${fmt(detG, 3)} Å⁶ | Reciprocal axes: a* = ${fmt(aStar, 4)}, b* = ${fmt(bStar, 4)}, c* = ${fmt(cStar, 4)} Å⁻¹ | Dual biorthogonal check ||AᵀB − I||_F = ${dualFrames.residualATB.toExponential(1)}.`}
        metrics={[
          { label: 'Cell Volume V', value: fmt(volumeV, 3), unit: 'Å³' },
          { label: 'Condition κ(G)', value: fmt(directMetric.conditionNumber, 2), unit: 'λ₁/λ₃' },
          { label: 'Reciprocal a*', value: fmt(aStar, 4), unit: 'Å⁻¹' },
          { label: 'd_(' + h1 + k1 + l1 + ')', value: fmt(plane1Calc.d, 4), unit: 'Å' }
        ]}
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <MetricTensorOverviewTab
            system={system}
            params={params}
            directMetric={directMetric}
            metricGStar={metricGStar}
            reciprocalVolumeVStar={reciprocalVolumeVStar}
            aStar={aStar}
            bStar={bStar}
            cStar={cStar}
            alphaStar={alphaStar}
            betaStar={betaStar}
            gammaStar={gammaStar}
            niggli={niggli}
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
            metricGStar={metricGStar}
            aStar={aStar}
            bStar={bStar}
            cStar={cStar}
            alphaStar={alphaStar}
            betaStar={betaStar}
            gammaStar={gammaStar}
            h1={h1} setH1={setH1}
            k1={k1} setK1={setK1}
            l1={l1} setL1={setL1}
            h2={h2} setH2={setH2}
            k2={k2} setK2={setK2}
            l2={l2} setL2={setL2}
          />
        )}

        {activeTab === 'busing_levy' && (
          <MetricTensorBusingLevyTab
            dualFrames={dualFrames}
            metricG={metricG}
            metricGStar={metricGStar}
            fracX={fracX} setFracX={setFracX}
            fracY={fracY} setFracY={setFracY}
            fracZ={fracZ} setFracZ={setFracZ}
            h1={h1}
            k1={k1}
            l1={l1}
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
            metricGStar={metricGStar}
            matrixA={dualFrames.matrixA}
            h1={h1}
            k1={k1}
            l1={l1}
          />
        )}

        {activeTab === 'learning_guide' && <MetricTensorLearningGuideTab />}

        {activeTab === 'python_export' && pythonFeaturesEnabled && (
          <MetricTensorPythonTab
            system={system}
            params={params}
            metricG={metricG}
            metricGStar={metricGStar}
            matrixA={dualFrames.matrixA}
            matrixB={dualFrames.matrixB}
            detG={detG}
            volumeV={volumeV}
            niggli={niggli}
            h1={h1}
            k1={k1}
            l1={l1}
            copyToClipboard={copyToClipboard}
            copiedKey={copiedKey}
          />
        )}
      </div>
    </div>
  );
};
