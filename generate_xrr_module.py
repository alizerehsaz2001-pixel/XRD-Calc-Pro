import os

module_code = r"""import React, { useState, useMemo, useEffect } from 'react';
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
  calculateOpticalConstantsFromFormula,
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

import {
  Layers,
  Activity,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Download,
  RotateCcw,
  Zap,
  BookOpen,
  Code2,
  Bot,
  Settings2,
  FileText,
  Calculator,
  ChevronDown
} from 'lucide-react';

export const XRRModule: React.FC = () => {
  // Preset selection
  const [selectedPreset, setSelectedPreset] = useState<string>('single_film');

  // Active Multilayer Stack
  const [layers, setLayers] = useState<XRRLayer[]>(PRESET_STACKS[0].layers);

  // Simulation & Instrument Configuration
  const [config, setConfig] = useState<XRRSimulationConfig>({
    radiationSource: 'Cu-Ka1',
    wavelength: 1.5406,
    thetaMin: 0.1,
    thetaMax: 5.0,
    thetaStep: 0.01,
    roughnessModel: 'nevot-croce',
    background: 1e-8,
    instrumentResolution: 0.01,
    beamLengthMm: 20.0,
    sampleLengthMm: 15.0,
    applyFootprintCorrection: true,
    polarizationFactor: 1.0,
    monteCarloEnvelope: true
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
    }
  };

  // Handle Radiation Source Change
  const handleSourceChange = (sourceKey: string) => {
    const src = RADIATION_SOURCES[sourceKey];
    if (src) {
      setConfig(prev => ({
        ...prev,
        radiationSource: sourceKey,
        wavelength: src.wavelength
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
      const matched = expData.find(e => Math.abs(e.theta - pt.theta) < config.thetaStep * 0.8);
      return {
        ...pt,
        rExp: matched ? matched.intensity : undefined
      };
    });
  }, [simCurve, expData, config.thetaStep]);

  // Calculate SLD Real-Space Profile
  const sldProfile = useMemo<SLDProfilePoint[]>(() => {
    return calculateSLDProfile(layers);
  }, [layers]);

  // Calculate Kiessig Fringe Analysis
  const kiessigResult = useMemo<KiessigAnalysisResult | null>(() => {
    return calculateKiessigFringes(mergedDataPoints, config.wavelength);
  }, [mergedDataPoints, config.wavelength]);

  // Calculate Critical Angle Detection
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

  // Layer CRUD Operations
  const handleAddLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newLayer: XRRLayer = {
      id: newId,
      name: `Cap Layer ${layers.length}`,
      material: 'TiO2',
      thickness: 100,
      roughness: 4.0,
      density: 4.23,
      delta: 14.5,
      beta: 0.32
    };
    // Insert right above substrate
    const updated = [...layers];
    updated.splice(updated.length - 1, 0, newLayer);
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
          // Adjust delta and beta proportionally to density
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
    <div id="xrr-module-root" className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4 text-slate-100">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-800/80 text-[11px] font-semibold tracking-wide uppercase">
                Parratt Matrix Formalism
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-800/80 text-[11px] font-semibold tracking-wide uppercase">
                Henke Dispersion
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-50 mt-2 flex items-center gap-2">
              <Layers className="w-6 h-6 text-cyan-400" />
              X-Ray Reflectometry (XRR) Thin Film Analysis Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              High-precision specular XRR modeling with Parratt recursion, Névot-Croce interface roughness, real-space SLD depth profiling, modified Bragg Kiessig fringe analysis, and spatial FFT extraction.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import Data</span>
              <input type="file" accept=".dat,.csv,.xy,.txt,.xrdml" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset & Instrument Config Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Preset Selector */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Architecture Preset</label>
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
          >
            {PRESET_STACKS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Radiation Source */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">X-Ray Radiation Source</label>
          <select
            value={config.radiationSource}
            onChange={(e) => handleSourceChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {Object.entries(RADIATION_SOURCES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name} ({v.wavelength} Å / {v.energyKeV} keV)
              </option>
            ))}
          </select>
        </div>

        {/* Roughness Model */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Interface Roughness Model</label>
          <select
            value={config.roughnessModel}
            onChange={(e) => setConfig(prev => ({ ...prev, roughnessModel: e.target.value as any }))}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="nevot-croce">Névot-Croce (Graded Transition)</option>
            <option value="debye-waller">Debye-Waller (Static Interface)</option>
          </select>
        </div>

        {/* Footprint Correction Toggle */}
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pb-1">
            <input
              type="checkbox"
              checked={config.applyFootprintCorrection}
              onChange={(e) => setConfig(prev => ({ ...prev, applyFootprintCorrection: e.target.checked }))}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Beam Footprint Geometry</span>
          </label>
        </div>
      </div>

      {/* Multilayer Stack Manager Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Multilayer Stratified Stack Architecture (Parratt Recursion)
          </h3>

          <button
            onClick={handleAddLayer}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Film Layer
          </button>
        </div>

        {/* Stack Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-medium">
              <tr>
                <th className="py-2.5 px-3">Layer Name</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3">Thickness d (Å)</th>
                <th className="py-2.5 px-3">Roughness σ (Å)</th>
                <th className="py-2.5 px-3">Density ρ (g/cm³)</th>
                <th className="py-2.5 px-3">Dispersion δ (×10⁻⁶)</th>
                <th className="py-2.5 px-3">Absorption β (×10⁻⁷)</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {layers.map((layer, idx) => {
                const isSubstrate = layer.thickness === 0;
                return (
                  <tr key={layer.id} className="hover:bg-slate-800/30">
                    {/* Layer Name */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={layer.name}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'name', e.target.value)}
                        className="w-28 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 font-medium font-sans"
                      />
                    </td>

                    {/* Material */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={layer.material}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'material', e.target.value)}
                        className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                      />
                    </td>

                    {/* Thickness */}
                    <td className="py-2 px-3">
                      {isSubstrate ? (
                        <span className="text-slate-500 font-sans">Substrate (∞)</span>
                      ) : (
                        <input
                          type="number"
                          step="1"
                          min="1"
                          max="5000"
                          value={layer.thickness}
                          onChange={(e) => handleUpdateLayerParam(layer.id, 'thickness', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      )}
                    </td>

                    {/* Roughness */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="50"
                        value={layer.roughness}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'roughness', parseFloat(e.target.value) || 0.1)}
                        className="w-18 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
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
                        className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-emerald-300 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Delta */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.1"
                        value={layer.delta}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'delta', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Beta */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={layer.beta}
                        onChange={(e) => handleUpdateLayerParam(layer.id, 'beta', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-right">
                      {!isSubstrate && (
                        <button
                          onClick={() => handleRemoveLayer(layer.id)}
                          className="p-1.5 rounded hover:bg-red-950/50 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete Layer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 pb-2">
        <button
          id="tab-btn-reflectivity"
          onClick={() => setActiveTab('reflectivity')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'reflectivity' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Reflectivity Curve
        </button>

        <button
          id="tab-btn-sld"
          onClick={() => setActiveTab('sld')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'sld' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          SLD Depth Profile
        </button>

        <button
          id="tab-btn-kiessig"
          onClick={() => setActiveTab('kiessig')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'kiessig' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Kiessig Fringes
        </button>

        <button
          id="tab-btn-fft"
          onClick={() => setActiveTab('fft')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'fft' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          FFT Thickness Auto-Extract
        </button>

        <button
          id="tab-btn-fitting"
          onClick={() => setActiveTab('fitting')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'fitting' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Fitting Studio
        </button>

        <button
          id="tab-btn-formula"
          onClick={() => setActiveTab('formula')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'formula' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Chemical Formula Calc
        </button>

        <button
          id="tab-btn-advisor"
          onClick={() => setActiveTab('advisor')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'advisor' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          AI Thin Film Advisor
        </button>

        <button
          id="tab-btn-export"
          onClick={() => setActiveTab('export')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'export' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Export Code & LaTeX
        </button>

        <button
          id="tab-btn-theory"
          onClick={() => setActiveTab('theory')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'theory' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Physics Theory
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
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
"""

with open("components/XRRModule.tsx", "w", encoding="utf-8") as f:
    f.write(module_code)

print("components/XRRModule.tsx written successfully!")
