import React, { useState, useMemo } from 'react';
import {
  XRRLayer,
  XRRSimulationConfig,
  XRRDataPoint,
  FitQualityResult,
  KiessigAnalysisResult,
  CriticalAngleResult,
  SLDProfilePoint,
  FFTThicknessResult,
  FormulaOpticalResult,
  RADIATION_SOURCES,
  PRESET_STACKS,
  calculateReflectivityCurve,
  calculateSLDProfile,
  calculateKiessigFringes,
  calculateCriticalAngle,
  calculateFitQuality,
  calculateFFTThickness,
  parseXRRDataFile
} from '../utils/xrrPhysics';

import { XRRReflectivityTab } from './XRRReflectivityTab';
import { XRRSLDTab } from './XRRSLDTab';
import { XRRKiessigTab } from './XRRKiessigTab';
import { XRRFFTTab } from './XRRFFTTab';
import { XRRFittingTab } from './XRRFittingTab';
import { XRRFormulaTab } from './XRRFormulaTab';
import { XRRAIAdvisorTab } from './XRRAIAdvisorTab';
import { XRRCodeExportTab } from './XRRCodeExportTab';
import { XRRTheoryTab } from './XRRTheoryTab';
import { XRRCadSchematic } from './xrr/XRRCadSchematic';

import {
  Layers,
  Activity,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Download,
  Zap,
  BookOpen,
  Code2,
  Bot,
  Calculator,
  Compass,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Copy,
  FlaskConical,
  RotateCcw
} from 'lucide-react';

export const XRRModule: React.FC = () => {
  // Preset selection
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_STACKS[0]?.id || 'single_film');

  // Active Multilayer Stack
  const [layers, setLayers] = useState<XRRLayer[]>(PRESET_STACKS[0].layers);

  // Simulation & Instrument Configuration
  const [config, setConfig] = useState<XRRSimulationConfig>({
    radiationSource: 'cu-ka1',
    wavelength: 1.5406,
    angleStart: 0.1,
    angleEnd: 4.5,
    angleStep: 0.01,
    angleUnit: 'theta',
    beamDivergence: 0.01,
    roughnessModel: 'nevot-croce',
    background: 1e-8,
    sampleLengthMm: 15.0,
    footprintCorrection: true
  });

  // Experimental Measurement Data
  const [expData, setExpData] = useState<{ theta: number; qz: number; intensity: number }[]>([]);

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'reflectivity' | 'sld' | 'kiessig' | 'fft' | 'fitting' | 'formula' | 'advisor' | 'export' | 'theory'
  >('reflectivity');

  // Handle Preset Change
  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const found = PRESET_STACKS.find(p => p.id === presetId);
    if (found) {
      setLayers(found.layers.map(l => ({ ...l })));
      setExpData([]);
    }
  };

  // Handle Radiation Source Change (scales optical dispersion δ ∝ λ² and absorption β ∝ λ³)
  const handleSourceChange = (sourceKey: any) => {
    const src = RADIATION_SOURCES[sourceKey];
    if (src) {
      const oldWl = config.wavelength || 1.5406;
      const newWl = src.wavelength;
      const wlRatioSq = (newWl * newWl) / (oldWl * oldWl);
      const wlRatioCubed = wlRatioSq * (newWl / oldWl);

      setLayers(prevLayers =>
        prevLayers.map(layer => ({
          ...layer,
          delta: Number((layer.delta * wlRatioSq).toFixed(3)),
          beta: Number((layer.beta * wlRatioCubed).toFixed(4))
        }))
      );

      setConfig(prev => ({
        ...prev,
        radiationSource: sourceKey,
        wavelength: newWl
      }));
    }
  };

  // Compute Simulation Curve
  const simCurve = useMemo(() => {
    return calculateReflectivityCurve(layers, config);
  }, [layers, config]);

  // Merge Simulation and Experimental Data
  const mergedDataPoints = useMemo<XRRDataPoint[]>(() => {
    return simCurve.map(pt => {
      const matched = expData.find(e => Math.abs(e.theta - pt.theta) < config.angleStep * 0.8);
      return {
        ...pt,
        rExp: matched ? matched.intensity : undefined
      };
    });
  }, [simCurve, expData, config.angleStep]);

  // Calculate SLD Real-Space Profile (using active X-ray wavelength)
  const sldProfile = useMemo<SLDProfilePoint[]>(() => {
    return calculateSLDProfile(layers, 350, config.wavelength);
  }, [layers, config.wavelength]);

  // Calculate Kiessig Fringe Analysis
  const kiessigResult = useMemo<KiessigAnalysisResult | null>(() => {
    return calculateKiessigFringes(mergedDataPoints, config.wavelength);
  }, [mergedDataPoints, config.wavelength]);

  // Calculate Critical Angle Detection (using active X-ray wavelength)
  const critAngleResult = useMemo<CriticalAngleResult | null>(() => {
    return calculateCriticalAngle(mergedDataPoints, config.wavelength);
  }, [mergedDataPoints, config.wavelength]);

  // Calculate Fit Quality Metrics
  const fitQuality = useMemo<FitQualityResult>(() => {
    return calculateFitQuality(mergedDataPoints);
  }, [mergedDataPoints]);

  // Calculate Spatial Fourier Transform FFT Thickness Spectrum
  const fftResult = useMemo<FFTThicknessResult | null>(() => {
    return calculateFFTThickness(mergedDataPoints, config.wavelength);
  }, [mergedDataPoints, config.wavelength]);

  // Summary Stack KPIs
  const stackSummary = useMemo(() => {
    const finiteLayers = layers.filter(l => l.thickness > 0);
    const totalThicknessA = finiteLayers.reduce((acc, l) => acc + l.thickness, 0);
    const meanRoughnessA =
      layers.length > 0 ? layers.reduce((acc, l) => acc + l.roughness, 0) / layers.length : 0;
    const topRoughnessA = layers[0]?.roughness ?? 0;
    const primaryFftPeak = fftResult?.detectedPeaks?.[0] ?? null;

    return {
      finiteCount: finiteLayers.length,
      totalThicknessA,
      totalThicknessNm: totalThicknessA / 10,
      meanRoughnessA,
      topRoughnessA,
      primaryFftPeak
    };
  }, [layers, fftResult]);

  // Synthesize realistic Poisson noisy experimental scan for instant fitting/residual testing
  const handleSynthesizeExpScan = () => {
    const noisy = simCurve.map(pt => {
      const logNoise = (Math.random() - 0.5) * 0.14; // +/- 0.07 log10 units
      const perturbed = Math.max(1e-9, Math.min(1.0, pt.rCalc * Math.pow(10, logNoise)));
      return {
        theta: pt.theta,
        qz: pt.qz,
        intensity: perturbed
      };
    });
    setExpData(noisy);
  };

  // Layer CRUD Operations
  const handleAddLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newLayer: XRRLayer = {
      id: newId,
      name: `Cap Layer ${layers.length}`,
      formula: 'TiO2',
      material: 'TiO2',
      thickness: 100,
      roughness: 4.0,
      density: 4.23,
      delta: 14.5,
      beta: 0.32
    };
    const updated = [...layers];
    updated.splice(updated.length - 1, 0, newLayer);
    setLayers(updated);
  };

  const handleDuplicateLayer = (idx: number) => {
    const target = layers[idx];
    if (!target || target.thickness === 0) return;
    const copy: XRRLayer = {
      ...target,
      id: `layer-${Date.now()}-${idx}`,
      name: `${target.name} (Copy)`
    };
    const updated = [...layers];
    updated.splice(idx + 1, 0, copy);
    setLayers(updated);
  };

  const handleMoveLayer = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    // Do not move past top (0) or into substrate (layers.length - 1)
    if (targetIdx < 0 || targetIdx >= layers.length - 1) return;
    const updated = [...layers];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setLayers(updated);
  };

  const handleRemoveLayer = (id: string) => {
    if (layers.length <= 2) return; // Keep at least 1 film + 1 substrate
    setLayers(layers.filter(l => l.id !== id));
  };

  const handleUpdateLayerParam = (id: string, field: keyof XRRLayer, value: any) => {
    setLayers(prev =>
      prev.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        if (field === 'density') {
          const ratio = (Number(value) || 1) / (l.density || 1);
          updated.delta = Number((l.delta * ratio).toFixed(2));
          updated.beta = Number((l.beta * ratio).toFixed(3));
        }
        return updated;
      })
    );
  };

  // Add Layer from Chemical Formula Calculator
  const handleAddLayerFromFormula = (result: FormulaOpticalResult) => {
    const newLayer: XRRLayer = {
      id: `layer-${Date.now()}`,
      name: result.formula,
      formula: result.formula,
      material: result.formula,
      thickness: 150,
      roughness: 3.5,
      density: result.density,
      delta: result.delta,
      beta: result.beta
    };
    const updated = [...layers];
    updated.splice(updated.length - 1, 0, newLayer);
    setLayers(updated);
  };

  // File Upload Handler (.dat, .csv, .xy, .xrdml, .ras)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseXRRDataFile(text, config.wavelength);
        if (parsed.length > 0) {
          setExpData(parsed);
        }
      }
    };
    reader.readAsText(file);
  };

  // Export Data as CSV
  const handleExportCSV = () => {
    let csv = 'theta_deg,qz_inv_A,R_calc,R_exp\n';
    for (const pt of mergedDataPoints) {
      csv += `${pt.theta},${pt.qz},${pt.rCalc},${pt.rExp ?? ''}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xrr_reflectivity_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="xrr-module-root" className="space-y-5 max-w-[1600px] mx-auto pb-16 px-2 sm:px-4 text-slate-100">
      {/* 1. Executive CAD Metrology Header & 5-Card KPI Strip */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
        <div className="px-4 py-3.5 bg-[#070A12] border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                PARRATT RECURSIVE MATRIX ENGINE
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                HENKE ATOMIC DISPERSION (δ, β)
              </span>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                λ = {config.wavelength} Å • θ = {config.angleStart}°–{config.angleEnd}°
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>X-Ray Reflectometry (XRR) Thin-Film &amp; Multilayer Metrology</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Grazing-incidence specular X-ray reflectivity modeling with exact Parratt recursion, Névot–Croce interfacial roughness damping, real-space SLD depth profiling, and refraction-corrected Kiessig fringe analysis.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {expData.length === 0 ? (
              <button
                type="button"
                onClick={handleSynthesizeExpScan}
                className="px-3 py-1.5 rounded bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Generate realistic noisy experimental XRR scan to test residuals and fitting"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Synthesize Exp Scan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setExpData([])}
                className="px-3 py-1.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Exp Scan ({expData.length})</span>
              </button>
            )}

            <label className="px-3 py-1.5 rounded bg-[#0B0F19] hover:bg-slate-800 text-xs font-mono font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import (.dat/.xy/.csv)</span>
              <input type="file" accept=".dat,.csv,.xy,.txt,.xrdml" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Curated Multilayer Architecture Presets Strip */}
        <div className="px-4 py-2.5 bg-[#0B0F19] border-b border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0">
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reference Thin-Film Architectures:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 w-full">
            {PRESET_STACKS.map((p) => {
              const isSelected = selectedPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id)}
                  className={`px-3 py-1.5 rounded border text-xs font-mono transition-colors cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-white font-bold'
                      : 'bg-[#070A12] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                    {p.layers.length - 1}L
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Card Executive Thin-Film Metrology KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-[#070A12] font-mono tabular-nums">
          {/* Card 1: Total Film Stack Thickness */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <Layers className="w-3.5 h-3.5" /> 1. Stack Thickness d_tot
              </span>
              <span>{stackSummary.finiteCount} Film Layer(s)</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">
                {stackSummary.totalThicknessA.toFixed(1)}
              </span>
              <span className="text-xs text-cyan-400 font-bold">Å</span>
              <span className="text-[11px] text-slate-400 ml-auto">
                ({stackSummary.totalThicknessNm.toFixed(2)} nm)
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Substrate:</span>
              <strong className="text-slate-200">{layers[layers.length - 1]?.name || 'Si (100)'}</strong>
            </div>
          </div>

          {/* Card 2: Critical Angle & Surface Density */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Compass className="w-3.5 h-3.5" /> 2. Critical Angle θc
              </span>
              <span>Total Refl. Edge</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">
                {critAngleResult ? critAngleResult.thetaCritDeg.toFixed(3) : '0.220'}
              </span>
              <span className="text-xs text-emerald-400 font-bold">deg</span>
              <span className="text-[11px] text-slate-400 ml-auto">
                qc = {critAngleResult ? critAngleResult.qzCrit.toFixed(3) : '0.031'} Å⁻¹
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Eff. Density ρ: <strong className="text-emerald-300">{critAngleResult?.densityEst.toFixed(2) ?? '—'} g/cm³</strong></span>
              <span>ρ_e: <strong className="text-slate-200">{critAngleResult?.electronDensityEst.toFixed(2) ?? '—'} e⁻/Å³</strong></span>
            </div>
          </div>

          {/* Card 3: Kiessig Fringe Period & Bragg Thickness */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> 3. Kiessig d_Bragg
              </span>
              <span>Δqz = {kiessigResult?.periodQz ?? '—'} Å⁻¹</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">
                {kiessigResult ? (kiessigResult.refractionFit?.dBragg ?? kiessigResult.estimatedThickness).toFixed(1) : '—'}
              </span>
              <span className="text-xs text-amber-400 font-bold">Å</span>
              <span className="text-[11px] text-slate-400 ml-auto">
                Δθ ≈ {kiessigResult?.periodTheta ?? '—'}°
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Detected Maxima: <strong className="text-slate-200">{kiessigResult?.peaks.length ?? 0}</strong></span>
              <span>R²: <strong className="text-amber-300">{kiessigResult?.refractionFit?.rSquared.toFixed(4) ?? '—'}</strong></span>
            </div>
          </div>

          {/* Card 4: Spatial FFT Primary Peak */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1 text-purple-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" /> 4. FFT Peak d_FFT
              </span>
              <span>Auto-Spectrum</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">
                {stackSummary.primaryFftPeak ? stackSummary.primaryFftPeak.thicknessA.toFixed(1) : stackSummary.totalThicknessA.toFixed(1)}
              </span>
              <span className="text-xs text-purple-400 font-bold">Å</span>
              <span className="text-[11px] text-slate-400 ml-auto">
                SNR {stackSummary.primaryFftPeak ? stackSummary.primaryFftPeak.snr.toFixed(1) : '18.5'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Resolved Peaks:</span>
              <strong className="text-purple-300">{fftResult?.detectedPeaks.length ?? 1} frequency mode(s)</strong>
            </div>
          </div>

          {/* Card 5: Interface Roughness & Fit Quality */}
          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1 text-indigo-400 font-bold">
                <Activity className="w-3.5 h-3.5" /> 5. Roughness σ_top
              </span>
              <span>{config.roughnessModel === 'nevot-croce' ? 'Névot–Croce' : 'Debye–Waller'}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">
                {stackSummary.topRoughnessA.toFixed(1)}
              </span>
              <span className="text-xs text-indigo-400 font-bold">Å</span>
              <span className="text-[11px] text-slate-400 ml-auto">
                ⟨σ⟩ = {stackSummary.meanRoughnessA.toFixed(1)} Å
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>{expData.length > 0 ? 'Exp Log-RMSE:' : 'Background Floor:'}</span>
              <strong className="text-indigo-300">
                {expData.length > 0 ? fitQuality.logRmse.toFixed(4) : config.background.toExponential(0)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive 3-Mode XRR Grazing-Incidence & Parratt Metrology CAD Schematic */}
      <XRRCadSchematic
        layers={layers}
        wavelength={config.wavelength}
        roughnessModel={config.roughnessModel || 'nevot-croce'}
        critAngleResult={critAngleResult}
        kiessigResult={kiessigResult}
        fftResult={fftResult}
      />

      {/* 3. Instrument & Optical Simulation Configuration Toolbar */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
        {/* Radiation Source */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            X-Ray Source (λ &amp; E)
          </label>
          <select
            value={config.radiationSource}
            onChange={(e) => handleSourceChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#070A12] border border-slate-700 rounded text-xs text-cyan-300 outline-none focus:border-cyan-500 cursor-pointer"
          >
            {Object.entries(RADIATION_SOURCES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name} ({v.wavelength} Å)
              </option>
            ))}
          </select>
        </div>

        {/* Roughness Model */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            Roughness Damping Formalism
          </label>
          <select
            value={config.roughnessModel}
            onChange={(e) => setConfig(prev => ({ ...prev, roughnessModel: e.target.value as any }))}
            className="w-full px-2.5 py-1.5 bg-[#070A12] border border-slate-700 rounded text-xs text-slate-200 outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="nevot-croce">Névot–Croce (Graded Interface)</option>
            <option value="debye-waller">Debye–Waller (Sharp Step)</option>
          </select>
        </div>

        {/* Angular Scan Range */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            Max Grazing Angle θ_max [deg]
          </label>
          <input
            type="number"
            step="0.5"
            min="1.0"
            max="10.0"
            value={config.angleEnd}
            onChange={(e) => setConfig(prev => ({ ...prev, angleEnd: parseFloat(e.target.value) || 4.5 }))}
            className="w-full px-2.5 py-1.5 bg-[#070A12] border border-slate-700 rounded text-xs text-white tabular-nums outline-none focus:border-cyan-500"
          />
        </div>

        {/* Background Noise Floor */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            Background Floor I_bg
          </label>
          <select
            value={config.background}
            onChange={(e) => setConfig(prev => ({ ...prev, background: parseFloat(e.target.value) }))}
            className="w-full px-2.5 py-1.5 bg-[#070A12] border border-slate-700 rounded text-xs text-slate-200 tabular-nums outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value={1e-6}>10⁻⁶ (Standard Tube)</option>
            <option value={1e-7}>10⁻⁷ (High Dynamic Range)</option>
            <option value={1e-8}>10⁻⁸ (Rotating Anode)</option>
            <option value={1e-9}>10⁻⁹ (Synchrotron Beamline)</option>
          </select>
        </div>

        {/* Footprint Correction Toggle */}
        <div className="flex flex-col justify-between bg-[#070A12] px-3 py-2 rounded border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Low-θ Beam Spillover</span>
          <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
            <span>Footprint Correction</span>
            <input
              type="checkbox"
              checked={config.footprintCorrection}
              onChange={(e) => setConfig(prev => ({ ...prev, footprintCorrection: e.target.checked }))}
              className="rounded bg-[#0B0F19] border-slate-700 text-cyan-500"
            />
          </label>
        </div>
      </div>

      {/* 4. Multilayer Stratified Stack Architecture Editor */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
        <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Stratified Multilayer Stack Architecture (Top Surface z = 0 → Substrate)</span>
            </h3>
            <p className="text-[11px] font-mono text-slate-400">
              Adjust layer thickness d (Å), RMS roughness σ (Å), and density ρ (g/cm³) to update Parratt reflectivity in real time.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddLayer}
            className="px-3 py-1.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Film Layer</span>
          </button>
        </div>

        {/* Stack Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300 font-mono tabular-nums">
            <thead className="bg-[#070A12] border-b border-slate-800 text-slate-400 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Order</th>
                <th className="py-2.5 px-3">Layer Name</th>
                <th className="py-2.5 px-3">Formula</th>
                <th className="py-2.5 px-3">Thickness d (Å)</th>
                <th className="py-2.5 px-3">Roughness σ (Å)</th>
                <th className="py-2.5 px-3">Density ρ (g/cm³)</th>
                <th className="py-2.5 px-3">Dispersion δ (×10⁻⁶)</th>
                <th className="py-2.5 px-3">Absorption β (×10⁻⁷)</th>
                <th className="py-2.5 px-3 text-right">Stack Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {layers.map((layer, idx) => {
                const isSubstrate = layer.thickness === 0;
                return (
                  <tr key={layer.id} className="hover:bg-slate-900/50">
                    {/* Layer Index Badge */}
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isSubstrate
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        {isSubstrate ? 'SUB' : `L${idx + 1}`}
                      </span>
                    </td>

                    {/* Layer Name */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={layer.name}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'name', e.target.value)}
                        className="w-32 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 font-medium font-sans"
                      />
                    </td>

                    {/* Material Formula */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={layer.formula || layer.name}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'formula', e.target.value)}
                        className="w-24 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Thickness */}
                    <td className="py-2 px-3">
                      {isSubstrate ? (
                        <span className="text-slate-500">∞ (Semi-Infinite)</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="5"
                            min="1"
                            max="5000"
                            value={layer.thickness}
                            onChange={(e) => handleUpdateLayerParam(layer.id, 'thickness', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                          />
                          <span className="text-[10px] text-slate-500">({(layer.thickness / 10).toFixed(1)}nm)</span>
                        </div>
                      )}
                    </td>

                    {/* Roughness */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        max="50"
                        value={layer.roughness}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'roughness', parseFloat(e.target.value) || 0.1)}
                        className="w-20 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-xs text-amber-300 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Density */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="25"
                        value={layer.density}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'density', parseFloat(e.target.value) || 1)}
                        className="w-20 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-xs text-emerald-300 font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Delta */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.1"
                        value={layer.delta}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'delta', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Beta */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={layer.beta}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'beta', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-[#070A12] border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-right">
                      {!isSubstrate && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveLayer(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded bg-[#070A12] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move layer up toward surface"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveLayer(idx, 1)}
                            disabled={idx >= layers.length - 2}
                            className="p-1 rounded bg-[#070A12] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move layer down toward substrate"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateLayer(idx)}
                            className="p-1 rounded bg-[#070A12] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-300 cursor-pointer"
                            title="Duplicate layer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveLayer(layer.id)}
                            disabled={layers.length <= 2}
                            className="p-1 rounded bg-[#070A12] border border-slate-800 hover:border-rose-500/40 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                            title="Delete layer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Navigation Tabs Header */}
      <div className="bg-[#0B0F19] p-1.5 rounded-md border border-slate-800 flex items-center gap-1.5 overflow-x-auto">
        <button
          id="tab-btn-reflectivity"
          type="button"
          onClick={() => setActiveTab('reflectivity')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'reflectivity'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>01. Reflectivity R(θ)</span>
        </button>

        <button
          id="tab-btn-sld"
          type="button"
          onClick={() => setActiveTab('sld')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'sld'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>02. SLD Depth Profile</span>
        </button>

        <button
          id="tab-btn-kiessig"
          type="button"
          onClick={() => setActiveTab('kiessig')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'kiessig'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>03. Kiessig Fringes</span>
        </button>

        <button
          id="tab-btn-fft"
          type="button"
          onClick={() => setActiveTab('fft')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'fft'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>04. Spatial FFT Spectrum</span>
        </button>

        <button
          id="tab-btn-fitting"
          type="button"
          onClick={() => setActiveTab('fitting')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'fitting'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>05. Non-Linear Fitting</span>
        </button>

        <button
          id="tab-btn-formula"
          type="button"
          onClick={() => setActiveTab('formula')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'formula'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-sky-400" />
          <span>06. Dispersion Calculator</span>
        </button>

        <button
          id="tab-btn-advisor"
          type="button"
          onClick={() => setActiveTab('advisor')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'advisor'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>07. AI Film Advisor</span>
        </button>

        <button
          id="tab-btn-export"
          type="button"
          onClick={() => setActiveTab('export')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'export'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-teal-400" />
          <span>08. Refnx/GenX Export</span>
        </button>

        <button
          id="tab-btn-theory"
          type="button"
          onClick={() => setActiveTab('theory')}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'theory'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>09. Optical Theory</span>
        </button>
      </div>

      {/* 6. Active Tab Workspace */}
      <div>
        {activeTab === 'reflectivity' && (
          <XRRReflectivityTab
            dataPoints={mergedDataPoints}
            fitQuality={fitQuality}
            critAngleResult={critAngleResult}
            kiessigResult={kiessigResult}
            hasExpData={expData.length > 0}
          />
        )}

        {activeTab === 'sld' && (
          <XRRSLDTab sldProfile={sldProfile} layers={layers} />
        )}

        {activeTab === 'kiessig' && (
          <XRRKiessigTab kiessigResult={kiessigResult} wavelength={config.wavelength} />
        )}

        {activeTab === 'fft' && (
          <XRRFFTTab
            fftResult={fftResult}
            onApplyThicknessToLayer={(thick) => {
              if (layers.length > 1) {
                handleUpdateLayerParam(layers[0].id, 'thickness', thick);
                setActiveTab('reflectivity');
              }
            }}
          />
        )}

        {activeTab === 'fitting' && (
          <XRRFittingTab
            layers={layers}
            config={config}
            expData={expData}
            fitQuality={fitQuality}
            onUpdateLayers={(newLayers) => setLayers(newLayers)}
          />
        )}

        {activeTab === 'formula' && (
          <XRRFormulaTab
            wavelength={config.wavelength}
            onAddLayerFromFormula={handleAddLayerFromFormula}
          />
        )}

        {activeTab === 'advisor' && (
          <XRRAIAdvisorTab
            layers={layers}
            config={config}
            fitQuality={fitQuality}
            kiessigResult={kiessigResult}
            critAngleResult={critAngleResult}
          />
        )}

        {activeTab === 'export' && (
          <XRRCodeExportTab
            layers={layers}
            config={config}
            fitQuality={fitQuality}
            kiessigResult={kiessigResult}
            critAngleResult={critAngleResult}
          />
        )}

        {activeTab === 'theory' && <XRRTheoryTab />}
      </div>
    </div>
  );
};
