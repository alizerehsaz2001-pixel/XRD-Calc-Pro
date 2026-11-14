import React, { useState, useMemo } from 'react';
import {
  PDFCoordinationShell,
  PDFSimulationConfig,
  PDF_MATERIAL_PRESETS,
  calculatePDFAnalysis,
  integrateCoordinationWindow,
  runPDFguiRealSpaceRefinement
} from '../utils/pdfEngine';
import { PDFCadSchematic } from './pdf/PDFCadSchematic';
import { playSynthTone } from '../utils/sound';
import { AIAnalysis } from './AIAnalysis';
import { PythonCodeExporter } from './PythonCodeExporter';
import {
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import {
  Orbit,
  Activity,
  Sliders,
  Layers,
  FlaskConical,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Crosshair,
  Ruler,
  Copy,
  Check,
  RefreshCw,
  RotateCcw
} from 'lucide-react';

export const PairDistributionFunctionModule: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PDF_MATERIAL_PRESETS[0].id);
  const [shells, setShells] = useState<PDFCoordinationShell[]>(PDF_MATERIAL_PRESETS[0].shells);
  const [config, setConfig] = useState<PDFSimulationConfig>({
    qMin: 0.5,
    qMax: PDF_MATERIAL_PRESETS[0].recommendedQMax,
    qDamp: 0.032,
    qBroad: 0.008,
    rMax: 14.0,
    rStep: 0.04,
    rho0: PDF_MATERIAL_PRESETS[0].rho0AtomsPerA3,
    domainDiameterNm: PDF_MATERIAL_PRESETS[0].domainDiameterNm,
    isAmorphous: PDF_MATERIAL_PRESETS[0].isAmorphous,
    amorphousCorrelationA: PDF_MATERIAL_PRESETS[0].amorphousCorrelationA || 6.8,
    windowFunction: 'lorch',
    correlatedMotionDelta1: 0.45,
    addedNoiseLevel: 0.3,
    modelScaleFactor: 1.0
  });

  const [activeTab, setActiveTab] = useState<'grPlot' | 'fqPlot' | 'rdfIntegrator' | 'shellMatrix'>('grPlot');
  const [showEnvelopeLines, setShowEnvelopeLines] = useState<boolean>(true);
  const [showCuKaComparison, setShowCuKaComparison] = useState<boolean>(false);
  const [showShellTickLines, setShowShellTickLines] = useState<boolean>(true);
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false);
  const [refinementBanner, setRefinementBanner] = useState<string | null>(null);

  // Interactive Coordination Shell Integration Bounds [rIntMin, rIntMax]
  const [rIntMin, setRIntMin] = useState<number>(1.32);
  const [rIntMax, setRIntMax] = useState<number>(1.90);

  const activePreset = useMemo(
    () => PDF_MATERIAL_PRESETS.find(p => p.id === selectedPresetId) || PDF_MATERIAL_PRESETS[0],
    [selectedPresetId]
  );

  // Snap integration window around a specific coordination shell
  const handleSnapToShell = (sh: PDFCoordinationShell) => {
    playSynthTone('tick');
    const halfWidth = Math.max(0.26, 3.2 * sh.sigmaAngstrom);
    setRIntMin(Number(Math.max(0.6, sh.rAngstrom - halfWidth).toFixed(2)));
    setRIntMax(Number((sh.rAngstrom + halfWidth).toFixed(2)));
  };

  // Load material preset
  const handleSelectPreset = (presetId: string) => {
    const found = PDF_MATERIAL_PRESETS.find(p => p.id === presetId);
    if (!found) return;
    playSynthTone('tick');
    setSelectedPresetId(found.id);
    setShells(found.shells.map(s => ({ ...s })));
    setConfig(prev => ({
      ...prev,
      qMax: found.recommendedQMax,
      rho0: found.rho0AtomsPerA3,
      domainDiameterNm: found.domainDiameterNm,
      isAmorphous: found.isAmorphous,
      amorphousCorrelationA: found.amorphousCorrelationA || 7.0,
      modelScaleFactor: 1.0
    }));
    setRefinementBanner(null);
    if (found.shells[0]) {
      const r1 = found.shells[0].rAngstrom;
      const hw = Math.max(0.28, 3.2 * found.shells[0].sigmaAngstrom);
      setRIntMin(Number(Math.max(0.6, r1 - hw).toFixed(2)));
      setRIntMax(Number((r1 + hw).toFixed(2)));
    }
  };

  const handleUpdateConfig = (partial: Partial<PDFSimulationConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  // Run Total Scattering & Sine Fourier Transform Engine
  const pdfOutput = useMemo(() => {
    return calculatePDFAnalysis(shells, config);
  }, [shells, config]);

  // Live Radial Distribution Function R(r) integration over [rIntMin, rIntMax]
  const integratedShellResult = useMemo(() => {
    return integrateCoordinationWindow(pdfOutput.rPoints, rIntMin, rIntMax, shells);
  }, [pdfOutput.rPoints, rIntMin, rIntMax, shells]);

  // Prepare R(r) chart data with highlighted window
  const rdfChartData = useMemo(() => {
    return pdfOutput.rPoints.map(pt => ({
      ...pt,
      windowRdf: pt.r >= rIntMin && pt.r <= rIntMax ? pt.rdfR : null
    }));
  }, [pdfOutput.rPoints, rIntMin, rIntMax]);

  // Perturb local bond distances & thermal disorder to test real-space least-squares refinement
  const handlePerturbStructure = () => {
    playSynthTone('switch');
    setShells(prev =>
      prev.map((sh, idx) => ({
        ...sh,
        rAngstrom: Number((sh.rAngstrom * (idx % 2 === 0 ? 1.035 : 0.972)).toFixed(3)),
        sigmaAngstrom: Number((sh.sigmaAngstrom * 1.35).toFixed(3))
      }))
    );
    setConfig(prev => ({
      ...prev,
      windowFunction: 'none',
      addedNoiseLevel: 1.2,
      modelScaleFactor: 0.88
    }));
    setRefinementBanner('Applied +3.5% bond-length perturbation, unwindowed truncation, and scale offset. Click "Auto-Refine PDFgui Model" to converge.');
  };

  // Execute PDFgui Real-Space Least-Squares Refinement
  const handleAutoRefinePDF = () => {
    playSynthTone('success');
    const res = runPDFguiRealSpaceRefinement(shells, config, activePreset);
    setShells(res.refinedShells);
    setConfig(res.refinedConfig);
    setRefinementBanner(
      `PDFgui Real-Space Least-Squares Converged (${res.iterations} cycles): R_w improved from ${res.initialRw.toFixed(2)}% → ${res.finalRw.toFixed(2)}%`
    );
  };

  // Shell CRUD handlers
  const handleUpdateShell = (id: string, field: keyof PDFCoordinationShell, value: any) => {
    setShells(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleAddShell = () => {
    playSynthTone('tick');
    const last = shells[shells.length - 1];
    const nextR = last ? Number((last.rAngstrom + 1.15).toFixed(2)) : 2.20;
    const newShell: PDFCoordinationShell = {
      id: `sh-${Date.now()}`,
      pairLabel: `Shell ${shells.length + 1}`,
      rAngstrom: nextR,
      coordinationN: 6.0,
      sigmaAngstrom: 0.095,
      weightFactor: 1.0
    };
    setShells([...shells, newShell]);
  };

  const handleDeleteShell = (id: string) => {
    if (shells.length <= 1) return;
    playSynthTone('tick');
    setShells(shells.filter(s => s.id !== id));
  };

  const handleExportCSV = () => {
    let csv = 'r_Angstrom,G_obs_invA2,G_calc_invA2,G_diff_invA2,G_obs_CuKa_8A,R_rdf_atoms_per_A,g_pair_density,gamma0_envelope\n';
    pdfOutput.rPoints.forEach(p => {
      csv += `${p.r},${p.gObs},${p.gCalc},${p.gDiff},${p.gObsCuKa},${p.rdfR},${p.pairDensitySmallG},${p.shapeGamma0}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PDF_Gr_${activePreset.id}_Qmax${config.qMax.toFixed(1)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLatex = () => {
    const latex = `\\begin{align*}
G(r) &= \\frac{2}{\\pi} \\int_{${config.qMin.toFixed(1)}}^{${config.qMax.toFixed(1)}} Q[S(Q)-1]\\,W(Q) \\sin(Qr)\\,dQ \\\\
\\Delta r_{\\min} &= \\frac{\\pi}{Q_{\\max}} = ${pdfOutput.deltaRResolutionA.toFixed(3)}\\text{ \\AA}, \\quad R_w = ${pdfOutput.rwFactorPct.toFixed(2)}\\% \\\\
r_1 &= ${pdfOutput.firstShellPeakR.toFixed(3)}\\text{ \\AA}, \\quad N_c([${rIntMin.toFixed(2)}, ${rIntMax.toFixed(2)}]\\text{ \\AA}) = ${integratedShellResult.integratedN.toFixed(2)}\\text{ atoms}
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2500);
  };

  const firstShellDiag = pdfOutput.shellDiagnostics[0];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-16 px-2 sm:px-4 text-slate-100">
      {/* 1. Executive CAD Metrology Header & 5-Card KPI Strip */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
        <div className="px-4 py-3.5 bg-[#070A12] border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            {/* Clean Unboxed Typographic Metadata (Zero-Pill Discipline) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-semibold">Total Scattering S(Q) → G(r)</span>
              <span aria-hidden="true">·</span>
              <span>Local Atomic Structure &amp; Short-Range Order</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums text-slate-300">{pdfOutput.effectiveRadiationLabel}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Orbit className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Pair Distribution Function (PDF) &amp; Total Scattering Workstation</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Direct sine Fourier inversion of total X-ray scattering <span className="font-mono text-cyan-300">F(Q) = Q[S(Q) − 1]</span> into real-space interatomic distance histograms <span className="font-mono text-emerald-300">G(r)</span> for amorphous glasses, quantum dots, and locally distorted crystals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePerturbStructure}
              className="px-3 py-1.5 bg-[#0B0F19] hover:bg-slate-800 text-amber-300 border border-slate-700 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="Introduce realistic bond-length strain and unwindowed noise to test real-space refinement"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Bond Disorder</span>
            </button>
            <button
              type="button"
              onClick={handleAutoRefinePDF}
              className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="Run PDFgui real-space least-squares optimization to minimize R_w"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Refine PDFgui Model</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLatex}
              className="px-3 py-1.5 bg-[#0B0F19] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedLatex ? 'Copied LaTeX' : 'Copy LaTeX'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export G(r) CSV</span>
            </button>
          </div>
        </div>

        {/* Optional Refinement Convergence Banner */}
        {refinementBanner && (
          <div className="px-4 py-2 bg-[#050811] border-b border-slate-800 flex items-center justify-between gap-2 text-xs font-mono text-emerald-300">
            <span>● {refinementBanner}</span>
            <button
              type="button"
              onClick={() => setRefinementBanner(null)}
              className="text-slate-400 hover:text-white text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Curated Total Scattering Material Benchmarks Strip (6 Presets) */}
        <div className="px-4 py-2.5 bg-[#0B0F19] border-b border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-slate-400 shrink-0">
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reference Benchmarks:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-1.5 w-full">
            {PDF_MATERIAL_PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  title={p.description}
                  className={`px-2.5 py-1.5 rounded border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                      : 'bg-[#070A12] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold text-cyan-300 truncate">{p.formula}</span>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">{p.category.split(' ')[0]}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 truncate block mt-0.5">
                    {p.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Card Executive Total Scattering & Real-Space KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-[#070A12] font-mono tabular-nums">
          {/* Card 1: 1st Nearest-Neighbor Bond r1 & N1 */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <Ruler className="w-3.5 h-3.5" /> 1. Nearest Bond r₁
              </span>
              <span className="truncate max-w-[115px]">{shells[0]?.pairLabel || '1st Shell'}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">
                {pdfOutput.firstShellPeakR.toFixed(3)}
              </span>
              <span className="text-xs text-cyan-400 font-bold">Å</span>
              <span className="text-[11px] text-slate-400 ml-auto">
                N₁ = {pdfOutput.firstShellCoordN.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Sharpened σ_eff:</span>
              <strong className="text-cyan-300">{(firstShellDiag?.sigmaEff ?? 0.045).toFixed(3)} Å</strong>
            </div>
          </div>

          {/* Card 2: Real-Space Nyquist Resolution */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-indigo-400 font-bold">
                <Activity className="w-3.5 h-3.5" /> 2. Resolution Δr_min
              </span>
              <span>Q_max = {config.qMax.toFixed(1)} Å⁻¹</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">
                {pdfOutput.deltaRResolutionA.toFixed(3)}
              </span>
              <span className="text-xs text-indigo-400 font-bold">Å</span>
              <span className="text-[11px] text-slate-400 ml-auto">
                (π / Q_max)
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Ripple Period λ:</span>
              <strong className="text-indigo-300">{pdfOutput.terminationRipplePeriodA.toFixed(2)} Å · {config.windowFunction.toUpperCase()}</strong>
            </div>
          </div>

          {/* Card 3: Coherent Domain Diameter / Amorphous Correlation */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Orbit className="w-3.5 h-3.5" /> 3. Coherence Scale
              </span>
              <span>{config.isAmorphous ? 'Amorphous ξ' : 'Envelope γ₀(r)'}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">
                {config.isAmorphous
                  ? `${config.amorphousCorrelationA.toFixed(1)} Å`
                  : config.domainDiameterNm > 0
                  ? `${config.domainDiameterNm.toFixed(1)} nm`
                  : 'Bulk (∞)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Regime:</span>
              <strong className="text-emerald-300">
                {config.isAmorphous ? '● Glassy SRO' : config.domainDiameterNm > 0 ? '● Nanocluster' : '● Long-Range'}
              </strong>
            </div>
          </div>

          {/* Card 4: Real-Space PDFgui Fit R_w */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> 4. PDFgui Fit R_w
              </span>
              <span>Real-Space Residual</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">
                {pdfOutput.rwFactorPct.toFixed(2)}%
              </span>
              <span className={`text-[11px] ml-auto font-semibold ${pdfOutput.rwFactorPct < 14 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {pdfOutput.rwFactorPct < 14 ? '● Converged' : '▲ Truncated'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Cu Kα (8 Å⁻¹) R_w:</span>
              <strong className="text-amber-300">{pdfOutput.cuKaRwFactorPct.toFixed(1)}%</strong>
            </div>
          </div>

          {/* Card 5: Integrated Coordination Number N_c */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-purple-400 font-bold">
                <Crosshair className="w-3.5 h-3.5" /> 5. Integrated N_c
              </span>
              <span>[{rIntMin.toFixed(2)}, {rIntMax.toFixed(2)}] Å</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">
                {integratedShellResult.integratedN.toFixed(2)}
              </span>
              <span className="text-xs text-purple-400 font-bold">atoms</span>
              <span className="text-[11px] text-slate-400 ml-auto">
                ⟨r⟩ = {integratedShellResult.centroidR.toFixed(2)} Å
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Number Density ρ₀:</span>
              <strong className="text-purple-300">{config.rho0.toFixed(4)} at/Å³</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive 3-Mode PDF & Total Scattering CAD Schematic */}
      <PDFCadSchematic
        shells={shells}
        config={config}
        deltaRResolutionA={pdfOutput.deltaRResolutionA}
        terminationRipplePeriodA={pdfOutput.terminationRipplePeriodA}
        rwFactorPct={pdfOutput.rwFactorPct}
        onUpdateConfig={handleUpdateConfig}
        onSelectShellForIntegration={(sh) => {
          handleSnapToShell(sh);
          setActiveTab('rdfIntegrator');
        }}
      />

      {/* 3. Main Unified Side-by-Side CAD Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (4 cols): Fourier Transform & Real-Space Physics Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card A: Reciprocal-Space & Fourier Transform Parameters */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-white">
                  01. Fourier Transform &amp; Q-Space Controls
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">
                Sine Transform
              </span>
            </div>

            <div className="p-4 space-y-3.5 font-mono text-xs tabular-nums">
              {/* Q_max Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Max Momentum Transfer Q_max:</span>
                  <span className="text-cyan-300 font-bold">{config.qMax.toFixed(1)} Å⁻¹</span>
                </div>
                <input
                  type="range"
                  min="6.0"
                  max="30.0"
                  step="0.5"
                  value={config.qMax}
                  onChange={(e) => handleUpdateConfig({ qMax: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>8 Å⁻¹ (Cu Kα)</span>
                  <span>17 Å⁻¹ (Mo Kα)</span>
                  <span>22 Å⁻¹ (Ag Kα)</span>
                  <span>30 Å⁻¹ (Synch)</span>
                </div>
              </div>

              {/* Window Function Selector */}
              <div>
                <label className="block text-[11px] text-slate-300 mb-1.5">
                  Fourier Modification Window W(Q):
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'none', label: 'Step (None)' },
                    { id: 'lorch', label: 'Lorch Sinc' },
                    { id: 'cosine_bell', label: 'Cosine Bell' }
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleUpdateConfig({ windowFunction: w.id as any })}
                      className={`py-1.5 px-2 rounded text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                        config.windowFunction === w.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-[#070A12] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q_damp Instrumental Resolution */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Instrumental Resolution Q_damp:</span>
                  <span className="text-indigo-300 font-bold">{config.qDamp.toFixed(3)} Å⁻¹</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="0.10"
                  step="0.005"
                  value={config.qDamp}
                  onChange={(e) => handleUpdateConfig({ qDamp: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>

              {/* Q_broad Instrumental Peak Broadening */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">High-r Peak Broadening Q_broad:</span>
                  <span className="text-purple-300 font-bold">{(config.qBroad ?? 0.008).toFixed(3)} Å⁻¹</span>
                </div>
                <input
                  type="range"
                  min="0.000"
                  max="0.035"
                  step="0.002"
                  value={config.qBroad ?? 0.008}
                  onChange={(e) => handleUpdateConfig({ qBroad: parseFloat(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>

              {/* Real-space r_max range */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Real-Space Range r_max:</span>
                  <span className="text-emerald-300 font-bold">{config.rMax.toFixed(1)} Å</span>
                </div>
                <input
                  type="range"
                  min="8.0"
                  max="25.0"
                  step="1.0"
                  value={config.rMax}
                  onChange={(e) => handleUpdateConfig({ rMax: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>

              {/* High-Q Noise Level */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">High-Q Counting Noise Level:</span>
                  <span className="text-amber-300 font-bold">{config.addedNoiseLevel.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.2"
                  value={config.addedNoiseLevel}
                  onChange={(e) => handleUpdateConfig({ addedNoiseLevel: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>
            </div>
          </div>

          {/* Card B: Real-Space Microstructure & Envelope Parameters */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Orbit className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold text-white">
                  02. Real-Space Envelope &amp; Density
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                γ₀(r; D)
              </span>
            </div>

            <div className="p-4 space-y-3.5 font-mono text-xs tabular-nums">
              {/* Atomic Number Density rho0 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Number Density ρ₀ [atoms/Å³]:</span>
                  <span className="text-emerald-300 font-bold">{config.rho0.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.020"
                  max="0.110"
                  step="0.002"
                  value={config.rho0}
                  onChange={(e) => handleUpdateConfig({ rho0: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>

              {/* Nanoparticle Diameter D */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Spherical Domain Diameter D:</span>
                  <span className="text-cyan-300 font-bold">
                    {config.domainDiameterNm > 0 ? `${config.domainDiameterNm.toFixed(1)} nm` : 'Bulk (∞)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.2"
                  value={config.domainDiameterNm}
                  onChange={(e) => handleUpdateConfig({ domainDiameterNm: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>

              {/* Correlated Atomic Motion delta1 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300">Correlated Motion Factor δ₁ [Å]:</span>
                  <span className="text-purple-300 font-bold">{config.correlatedMotionDelta1.toFixed(2)} Å</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.2"
                  step="0.05"
                  value={config.correlatedMotionDelta1}
                  onChange={(e) => handleUpdateConfig({ correlatedMotionDelta1: parseFloat(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Sharpens 1st-neighbor covalent bond via σ_eff = σ√(1 − δ₁/r)
                </span>
              </div>

              {/* Amorphous Toggle */}
              <div className="p-2.5 bg-[#070A12] rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Amorphous Topological Decay</span>
                  <span className="text-[10px] text-slate-400">Exponential medium-range damping ξ</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateConfig({ isAmorphous: !config.isAmorphous })}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    config.isAmorphous ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      config.isAmorphous ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols): Interactive Real/Reciprocal Plots & Shell Matrix */}
        <div className="lg:col-span-8 space-y-4">
          {/* Navigation Tabs */}
          <div className="bg-[#0B0F19] p-1.5 rounded-md border border-slate-800 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('grPlot')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'grPlot'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>01. Real-Space PDF G(r) &amp; Residual</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fqPlot')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'fqPlot'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>02. Reciprocal F(Q) &amp; Total S(Q)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rdfIntegrator')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'rdfIntegrator'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>03. Radial R(r) &amp; Shell Integrator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shellMatrix')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'shellMatrix'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>04. Partial PDFs &amp; Shell Diagnostics ({shells.length})</span>
            </button>
          </div>

          {/* TAB 1: REAL-SPACE PDF G(r) & DIFFERENCE RESIDUAL */}
          {activeTab === 'grPlot' && (
            <div className="bg-[#0B0F19] p-4 rounded-md border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Reduced Atomic Pair Distribution Function G(r) = 4πr[ρ(r) − ρ₀γ₀(r)]</span>
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                    {activePreset.name} · Q_max = {config.qMax.toFixed(1)} Å⁻¹ (Δr = {pdfOutput.deltaRResolutionA.toFixed(2)} Å) · PDFgui R_w = {pdfOutput.rwFactorPct.toFixed(2)}%
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEnvelopeLines}
                      onChange={(e) => setShowEnvelopeLines(e.target.checked)}
                      className="rounded bg-[#070A12] border-slate-700 text-cyan-500"
                    />
                    <span>±4πrρ₀γ₀(r) Slope</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showShellTickLines}
                      onChange={(e) => setShowShellTickLines(e.target.checked)}
                      className="rounded bg-[#070A12] border-slate-700 text-cyan-500"
                    />
                    <span>Shell r_k Callouts</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCuKaComparison}
                      onChange={(e) => setShowCuKaComparison(e.target.checked)}
                      className="rounded bg-[#070A12] border-slate-700 text-amber-500"
                    />
                    <span>Compare Cu Kα (8 Å⁻¹)</span>
                  </label>
                </div>
              </div>

              <div className="h-80 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={pdfOutput.rPoints} margin={{ top: 14, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="r"
                      type="number"
                      domain={[0, config.rMax]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'Interatomic Distance r (Å)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'G(r) (Å⁻²)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#070A12',
                        borderColor: '#334155',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                      labelFormatter={(lbl) => `Distance r = ${lbl} Å`}
                    />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />

                    {showShellTickLines &&
                      shells.slice(0, 5).map((sh) => (
                        <ReferenceLine
                          key={sh.id}
                          x={sh.rAngstrom}
                          stroke="#334155"
                          strokeDasharray="2 2"
                          label={{
                            value: `${sh.rAngstrom.toFixed(2)}Å`,
                            position: 'top',
                            fill: '#94a3b8',
                            fontSize: 9
                          }}
                        />
                      ))}

                    {showEnvelopeLines && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="baselineLine"
                          name="−4πrρ₀γ₀(r) Density Slope"
                          stroke="#10b981"
                          strokeDasharray="4 4"
                          strokeWidth={1.3}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="envelopePos"
                          name="+4πrρ₀γ₀(r) Envelope"
                          stroke="#10b981"
                          strokeDasharray="4 4"
                          strokeWidth={1.3}
                          dot={false}
                        />
                      </>
                    )}

                    {showCuKaComparison && (
                      <Line
                        type="monotone"
                        dataKey="gObsCuKa"
                        name="Cu Kα Truncated (Q_max = 8.0 Å⁻¹)"
                        stroke="#f59e0b"
                        strokeDasharray="4 2"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    )}

                    <Line
                      type="monotone"
                      dataKey="gObs"
                      name={`Fourier G_FT(r) (Q_max = ${config.qMax.toFixed(1)} Å⁻¹)`}
                      stroke="#38bdf8"
                      strokeWidth={2.2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="gCalc"
                      name="Real-Space Shell Fit G_calc(r)"
                      stroke="#f43f5e"
                      strokeDasharray="3 3"
                      strokeWidth={1.8}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Synchronized Difference Residual Subplot */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                  <span>Real-Space Residual Difference: ΔG(r) = G_FT(r) − G_calc(r)</span>
                  <span className="text-amber-300 font-bold">PDFgui R_w = {pdfOutput.rwFactorPct.toFixed(2)}%</span>
                </div>
                <div className="h-28 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pdfOutput.rPoints} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="r" type="number" domain={[0, config.rMax]} stroke="#64748b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="gDiff" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="ΔG(r)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECIPROCAL-SPACE F(Q) & TOTAL STRUCTURE FACTOR S(Q) */}
          {activeTab === 'fqPlot' && (
            <div className="bg-[#0B0F19] p-4 rounded-md border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>Reciprocal-Space Reduced Structure Function F(Q) = Q[S(Q) − 1] &amp; Total S(Q)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    High-Q oscillations damped by Debye–Waller thermal factors exp(−½σ²Q²) and modification window W(Q).
                  </p>
                </div>
              </div>

              {/* Top Plot: F(Q) vs Windowed F(Q)*W(Q) */}
              <div className="h-64 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={pdfOutput.qPoints} margin={{ top: 10, right: 20, left: 10, bottom: 18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="q"
                      type="number"
                      domain={[config.qMin, config.qMax]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'Momentum Transfer Q = (4π/λ)sinθ (Å⁻¹)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'F(Q) = Q[S(Q) − 1] (Å⁻¹)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#070A12',
                        borderColor: '#334155',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                      labelFormatter={(lbl) => `Q = ${lbl} Å⁻¹`}
                    />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="fOfQ" name="Unwindowed F(Q)" stroke="#64748b" strokeWidth={1.2} dot={false} />
                    <Line type="monotone" dataKey="fOfQWindowed" name={`Windowed F(Q)·W_${config.windowFunction}(Q)`} stroke="#818cf8" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Plot: Normalized Total Structure Factor S(Q) & Modification Window W(Q) */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Normalized Total Structure Factor S(Q) = 1 + F(Q)/Q (Asymptote → 1.0) &amp; Window W(Q)</span>
                  <span className="text-indigo-300">W(Q_max) → {config.windowFunction === 'none' ? '1.00 (Step)' : '0.00 (Tapered)'}</span>
                </div>
                <div className="h-44 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={pdfOutput.qPoints} margin={{ top: 8, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="q" type="number" domain={[config.qMin, config.qMax]} stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <ReferenceLine y={1} stroke="#475569" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="sOfQ" name="Structure Factor S(Q)" stroke="#38bdf8" strokeWidth={1.6} dot={false} />
                      <Line type="monotone" dataKey="windowVal" name="Window W(Q)" stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.4} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RADIAL DISTRIBUTION FUNCTION R(r) & COORDINATION INTEGRATOR */}
          {activeTab === 'rdfIntegrator' && (
            <div className="bg-[#0B0F19] p-4 rounded-md border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-emerald-400" />
                    <span>Radial Distribution Function R(r) = 4πr²ρ(r) &amp; Coordination Integrator</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Integrating R(r) over [r_min, r_max] directly yields the experimental coordination number N_c.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded bg-[#070A12] border border-emerald-500/40 text-xs font-mono tabular-nums">
                  N_c = <strong className="text-emerald-400">{integratedShellResult.integratedN.toFixed(2)} atoms</strong> (∫R dr = {integratedShellResult.rawAreaRdf.toFixed(2)}, w_ij = {integratedShellResult.effectiveWeight.toFixed(2)}) · ⟨r⟩ = {integratedShellResult.centroidR.toFixed(3)} Å · σ_r = {integratedShellResult.rmsWidthA.toFixed(3)} Å
                </div>
              </div>

              {/* One-Click Coordination Shell Snap Bar */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#070A12] p-2.5 rounded border border-slate-800 font-mono text-xs">
                <span className="text-[11px] text-slate-400 mr-1">Snap Window to Shell:</span>
                {shells.slice(0, 6).map((sh, idx) => (
                  <button
                    key={sh.id}
                    type="button"
                    onClick={() => handleSnapToShell(sh)}
                    className="px-2.5 py-1 rounded bg-[#0B0F19] hover:bg-emerald-500/15 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    S{idx + 1}: {sh.pairLabel.split(' ')[0]} ({sh.rAngstrom.toFixed(2)} Å · N={sh.coordinationN})
                  </button>
                ))}
              </div>

              <div className="h-72 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={rdfChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="rdfShellGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="r"
                      type="number"
                      domain={[0, config.rMax]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'Interatomic Distance r (Å)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'R(r) = 4πr²ρ(r) (atoms/Å)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#070A12',
                        borderColor: '#334155',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <ReferenceLine x={rIntMin} stroke="#10b981" strokeDasharray="3 3" />
                    <ReferenceLine x={rIntMax} stroke="#10b981" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="windowRdf" stroke="#10b981" fill="url(#rdfShellGrad)" name="Integrated Shell Area" />
                    <Line type="monotone" dataKey="rdfR" stroke="#38bdf8" strokeWidth={1.8} dot={false} name="Total R(r)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Integration Window Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#070A12] p-3 rounded border border-slate-800 font-mono text-xs tabular-nums">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Lower Integration Bound r_min:</span>
                    <span className="text-emerald-300 font-bold">{rIntMin.toFixed(2)} Å</span>
                  </div>
                  <input
                    type="range"
                    min="0.80"
                    max="12.0"
                    step="0.05"
                    value={rIntMin}
                    onChange={(e) => setRIntMin(Math.min(rIntMax - 0.1, parseFloat(e.target.value)))}
                    className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Upper Integration Bound r_max:</span>
                    <span className="text-emerald-300 font-bold">{rIntMax.toFixed(2)} Å</span>
                  </div>
                  <input
                    type="range"
                    min="1.00"
                    max="14.0"
                    step="0.05"
                    value={rIntMax}
                    onChange={(e) => setRIntMax(Math.max(rIntMin + 0.1, parseFloat(e.target.value)))}
                    className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PARTIAL PDF DECOMPOSITION & SHELL RESOLUTION DIAGNOSTICS */}
          {activeTab === 'shellMatrix' && (
            <div className="bg-[#0B0F19] p-4 rounded-md border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Partial Coordination Shell Decomposition G_k(r) &amp; Resolution Diagnostics</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Decomposes the real-space radial distribution into 1st-neighbor, 2nd-neighbor, and higher-order coordination sub-shells.
                  </p>
                </div>
              </div>

              <div className="h-60 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={pdfOutput.rPoints} margin={{ top: 10, right: 20, left: 10, bottom: 18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="r"
                      type="number"
                      domain={[0, config.rMax]}
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#070A12',
                        borderColor: '#334155',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="shell1Contrib" name={`1st Shell (${shells[0]?.pairLabel || 'S1'})`} stroke="#22d3ee" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="shell2Contrib" name={`2nd Shell (${shells[1]?.pairLabel || 'S2'})`} stroke="#818cf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="shell3Contrib" name="Higher Shells (S3+)" stroke="#34d399" strokeWidth={1.6} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Shell Resolution Diagnostic Table */}
              <div className="overflow-x-auto bg-[#070A12] border border-slate-800 rounded">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-[#0B0F19]">
                      <th className="p-2.5">Shell</th>
                      <th className="p-2.5">Pair</th>
                      <th className="p-2.5">r_k (Å)</th>
                      <th className="p-2.5">w_ij</th>
                      <th className="p-2.5">σ_eff (Å)</th>
                      <th className="p-2.5">Δr_FT (Å)</th>
                      <th className="p-2.5">Total FWHM (Å)</th>
                      <th className="p-2.5">γ₀(r_k)</th>
                      <th className="p-2.5">Nyquist Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-300">
                    {pdfOutput.shellDiagnostics.map((diag, i) => (
                      <tr key={diag.id} className="hover:bg-slate-900/50">
                        <td className="p-2.5 text-slate-400">S{i + 1}</td>
                        <td className="p-2.5 font-sans font-semibold text-cyan-300">{diag.pairLabel}</td>
                        <td className="p-2.5 font-bold text-white">{diag.rAngstrom.toFixed(3)}</td>
                        <td className="p-2.5 text-slate-400">{diag.weightFactor.toFixed(2)}</td>
                        <td className="p-2.5 text-amber-300">{diag.sigmaEff.toFixed(4)}</td>
                        <td className="p-2.5 text-indigo-300">{diag.fwhmFourierA.toFixed(3)}</td>
                        <td className="p-2.5 font-semibold text-white">{diag.fwhmRealSpace.toFixed(3)}</td>
                        <td className="p-2.5 text-emerald-300">{diag.shapeGamma0.toFixed(3)}</td>
                        <td className="p-2.5">
                          <span className={diag.resolvedFromPrev ? 'text-emerald-400' : 'text-amber-400'}>
                            {diag.resolvedFromPrev ? '● Resolved' : '▲ Overlapped (Increase Q_max)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EDITABLE ATOMIC COORDINATION SHELL MATRIX */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Editable Atomic Coordination Shells Matrix (r_k, N_k, σ_k, w_ij)</span>
                </h4>
                <p className="text-[11px] font-mono text-slate-400">
                  Adjust bond distances, coordination numbers, or Debye–Waller thermal factors to synthesize custom total scattering profiles.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddShell}
                className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Coordination Shell</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#070A12] text-slate-400">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Atomic Pair Label</th>
                    <th className="p-2.5">Distance r_k (Å)</th>
                    <th className="p-2.5">Coordination N_k</th>
                    <th className="p-2.5">Debye–Waller σ_k (Å)</th>
                    <th className="p-2.5">X-Ray Weight w_ij</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-200">
                  {shells.map((sh, idx) => (
                    <tr key={sh.id} className="hover:bg-slate-900/50">
                      <td className="p-2.5 text-slate-400">S{idx + 1}</td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={sh.pairLabel}
                          onChange={(e) => handleUpdateShell(sh.id, 'pairLabel', e.target.value)}
                          className="w-40 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-cyan-300 font-sans text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={sh.rAngstrom}
                          onChange={(e) => handleUpdateShell(sh.id, 'rAngstrom', parseFloat(e.target.value) || 1.5)}
                          className="w-20 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-white font-bold text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.5"
                          value={sh.coordinationN}
                          onChange={(e) => handleUpdateShell(sh.id, 'coordinationN', parseFloat(e.target.value) || 1)}
                          className="w-20 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-emerald-300 font-bold text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.005"
                          value={sh.sigmaAngstrom}
                          onChange={(e) => handleUpdateShell(sh.id, 'sigmaAngstrom', parseFloat(e.target.value) || 0.05)}
                          className="w-20 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-amber-300 text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.05"
                          value={sh.weightFactor}
                          onChange={(e) => handleUpdateShell(sh.id, 'weightFactor', parseFloat(e.target.value) || 1.0)}
                          className="w-20 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-slate-300 text-xs"
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              handleSnapToShell(sh);
                              setActiveTab('rdfIntegrator');
                            }}
                            className="px-2 py-1 rounded bg-[#070A12] border border-slate-800 hover:border-emerald-500/40 text-[10px] text-emerald-300 cursor-pointer"
                            title="Integrate this shell in R(r)"
                          >
                            Integrate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteShell(sh.id)}
                            disabled={shells.length <= 1}
                            className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AI Analysis & Publication Python Script Exporter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        <AIAnalysis
          methodName="Pair Distribution Function (PDF) & Total Scattering Analysis"
          resultData={{
            materialPreset: activePreset.name,
            qMaxInvAngstrom: config.qMax,
            realSpaceResolutionAngstrom: pdfOutput.deltaRResolutionA,
            rwAgreementFactorPct: pdfOutput.rwFactorPct,
            cuKaRwAgreementFactorPct: pdfOutput.cuKaRwFactorPct,
            firstShellDistanceAngstrom: pdfOutput.firstShellPeakR,
            firstShellCoordinationN: pdfOutput.firstShellCoordN,
            integratedWindowCoordinationN: integratedShellResult.integratedN,
            numberDensityAtomsPerA3: config.rho0,
            domainDiameterNm: config.domainDiameterNm
          }}
        />
        <PythonCodeExporter
          methodName="Total Scattering & Pair Distribution Function G(r)"
          customScript={`import numpy as np
import matplotlib.pyplot as plt

# 1. Total Scattering & Sine Fourier Transform Configuration
Q_min, Q_max, dQ = ${config.qMin}, ${config.qMax}, 0.05
Q = np.arange(Q_min, Q_max + dQ, dQ)
r = np.linspace(0.0, ${config.rMax}, 400)
rho_0 = ${config.rho0}  # atoms / A^3

# 2. Atomic Coordination Shells: (r_k [A], N_k, sigma_k [A], weight)
shells = [
${shells.map(s => `    (${s.rAngstrom}, ${s.coordinationN}, ${s.sigmaAngstrom}, ${s.weightFactor}),  # ${s.pairLabel}`).join('\n')}
]

# Synthesize Reduced Structure Function F(Q) = Q * [S(Q) - 1]
F_Q = np.zeros_like(Q)
for r_k, N_k, sig_k, w_k in shells:
    F_Q += (N_k * w_k / r_k) * np.exp(-0.5 * (sig_k * Q)**2) * np.sin(Q * r_k)

# Apply Lorch modification window to suppress Q_max termination ripples
W_lorch = np.sinc(Q / Q_max)
F_Q_win = F_Q * W_lorch

# 3. Direct Sine Fourier Transform -> G(r)
G_r = np.zeros_like(r)
for idx, r_val in enumerate(r):
    G_r[idx] = (2.0 / np.pi) * np.trapz(F_Q_win * np.sin(Q * r_val), Q)

plt.figure(figsize=(8, 4.5), dpi=300)
plt.plot(r, G_r, color='#0284c7', lw=2, label=f'G(r) (Q_max = {Q_max} A^-1)')
plt.plot(r, -4 * np.pi * r * rho_0, '--', color='#10b981', lw=1.2, label='-4*pi*r*rho_0 baseline')
plt.axhline(0, color='gray', lw=0.8, ls=':')
plt.xlabel('Interatomic Distance r [Angstrom]')
plt.ylabel('G(r) [Angstrom^-2]')
plt.title('Atomic Pair Distribution Function G(r) - ${activePreset.formula}')
plt.legend()
plt.tight_layout()
plt.show()
`}
        />
      </div>
    </div>
  );
};
