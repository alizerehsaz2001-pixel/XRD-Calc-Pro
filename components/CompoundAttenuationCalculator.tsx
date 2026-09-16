import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Activity,
  Layers,
  Info,
  Copy,
  Check,
  Zap,
  Atom,
  AlertTriangle,
  ShieldCheck,
  Code2,
  Sliders,
  ChevronRight,
  TrendingDown,
  Maximize2,
  Minimize2,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import {
  XRAY_ANODE_SOURCES,
  ELEMENT_ATTENUATION_DB,
  calculateExtendedCompoundAttenuation,
  CompoundCalculationResult,
  getElementMuRhoAtEnergy
} from '../utils/attenuationPhysics';
import { ATTENUATION_PRESETS, AttenuationPreset } from '../utils/attenuationPresets';
import { playSynthTone } from '../utils/sound';

interface CompoundAttenuationCalculatorProps {
  elementWeightsMap?: Record<string, { z: number; weight: number }>;
  initialFormula?: string;
  onSelectElement?: (z: number) => void;
}

type InputMode = 'formula' | 'alloy_wt' | 'atomic_ratio';
type ActiveTab = 'metrics' | 'geometry' | 'spectra' | 'fluorescence' | 'python_export';
type CategoryFilter = 'All' | 'Engineering Alloy' | 'Battery' | 'Semiconductor' | 'Superconductor' | 'Ceramic & Mineral' | 'Shielding' | 'Polymer & Bio';

const ELEMENT_COLORS = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#14b8a6', '#f97316', '#e11d48', '#3b82f6'
];

export const CompoundAttenuationCalculator: React.FC<CompoundAttenuationCalculatorProps> = ({
  elementWeightsMap = {},
  initialFormula,
  onSelectElement
}) => {
  // Input State
  const [inputMode, setInputMode] = useState<InputMode>('formula');
  const [formula, setFormula] = useState<string>(initialFormula || 'YBa2Cu3O7');
  
  // Multi-element wt% alloy state
  const [alloyElements, setAlloyElements] = useState<{ symbol: string; wtPercent: number }[]>([
    { symbol: 'Ni', wtPercent: 53.0 },
    { symbol: 'Cr', wtPercent: 19.0 },
    { symbol: 'Fe', wtPercent: 18.0 },
    { symbol: 'Nb', wtPercent: 5.0 },
    { symbol: 'Mo', wtPercent: 3.0 },
    { symbol: 'Ti', wtPercent: 1.0 },
    { symbol: 'Al', wtPercent: 1.0 }
  ]);

  // Physical State
  const [density, setDensity] = useState<number>(6.38);
  const [packingFraction, setPackingFraction] = useState<number>(1.0); // 1.0 = solid, 0.5 = loose powder
  
  // X-Ray Radiation State
  const [selectedAnodeId, setSelectedAnodeId] = useState<string>('Cu_Ka');
  const [customEnergyKeV, setCustomEnergyKeV] = useState<number>(8.048);
  const [isCustomEnergy, setIsCustomEnergy] = useState<boolean>(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('metrics');
  const [presetCategory, setPresetCategory] = useState<CategoryFilter>('All');

  // Diffraction Geometry State
  const [twoThetaDeg, setTwoThetaDeg] = useState<number>(40.0);
  const [gixrdAlphaDeg, setGixrdAlphaDeg] = useState<number>(0.5);
  const [filmThicknessNm, setFilmThicknessNm] = useState<number>(500);

  // UI feedback state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Selected Anode info
  const currentAnode = useMemo(() => {
    return XRAY_ANODE_SOURCES.find(a => a.id === selectedAnodeId) || XRAY_ANODE_SOURCES[0];
  }, [selectedAnodeId]);

  const effectiveEnergy = isCustomEnergy ? customEnergyKeV : currentAnode.energyKeV;
  const effectiveAnodeName = isCustomEnergy ? `Custom (${customEnergyKeV.toFixed(2)} keV)` : currentAnode.name;

  // Derive formula from alloy inputs if in alloy mode
  const effectiveFormulaInput = useMemo(() => {
    if (inputMode === 'formula') return formula;
    
    if (inputMode === 'alloy_wt') {
      // Convert wt% to normalized atomic formula
      let totalMoles = 0;
      const moleRatios: { symbol: string; moles: number }[] = [];
      for (const item of alloyElements) {
        const dbEntry = ELEMENT_ATTENUATION_DB[item.symbol];
        const atWeight = dbEntry ? dbEntry.atomicWeight : 50;
        const moles = item.wtPercent / atWeight;
        totalMoles += moles;
        moleRatios.push({ symbol: item.symbol, moles });
      }
      if (totalMoles <= 0) return 'Fe';
      return moleRatios.map(m => `${m.symbol}${Number((m.moles / totalMoles).toFixed(4))}`).join('');
    }

    if (inputMode === 'atomic_ratio') {
      return alloyElements.map(m => `${m.symbol}${m.wtPercent}`).join('');
    }

    return formula;
  }, [inputMode, formula, alloyElements]);

  // Master Calculation Result
  const result = useMemo<CompoundCalculationResult | null>(() => {
    return calculateExtendedCompoundAttenuation(
      effectiveFormulaInput,
      density,
      effectiveEnergy,
      effectiveAnodeName,
      packingFraction
    );
  }, [effectiveFormulaInput, density, effectiveEnergy, effectiveAnodeName, packingFraction]);

  // Diffraction Geometry Penetration Depths
  const geometryResults = useMemo(() => {
    if (!result || result.linearAttenuationMu <= 0) {
      return {
        braggBrentano50Um: 0,
        braggBrentano90Um: 0,
        braggBrentano99Um: 0,
        gixrd50Um: 0,
        gixrd90Um: 0,
        gixrd99Um: 0,
        filmAbsorptionFraction: 0,
        filmTransmissionFraction: 100
      };
    }

    const mu = result.linearAttenuationMu; // cm⁻¹
    const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
    const sinTheta = Math.sin(thetaRad);

    // Bragg-Brentano symmetric: t_G = -ln(1 - G) * sin(theta) / (2 * mu)
    // cm to μm: * 10,000
    const bb50 = sinTheta > 0 ? (0.69315 * sinTheta / (2 * mu)) * 10000 : 0;
    const bb90 = sinTheta > 0 ? (2.30259 * sinTheta / (2 * mu)) * 10000 : 0;
    const bb99 = sinTheta > 0 ? (4.60517 * sinTheta / (2 * mu)) * 10000 : 0;

    // Grazing Incidence GIXRD: t_G = -ln(1 - G) / [ mu * (1/sin(alpha) + 1/sin(2theta - alpha)) ]
    const alphaRad = gixrdAlphaDeg * (Math.PI / 180);
    const twoThetaRad = twoThetaDeg * (Math.PI / 180);
    const exitAngleRad = twoThetaRad - alphaRad;
    const sinAlpha = Math.sin(alphaRad);
    const sinExit = Math.sin(Math.max(0.01, exitAngleRad));

    const pathFactor = (1 / sinAlpha) + (1 / sinExit);
    const gi50 = pathFactor > 0 ? (0.69315 / (mu * pathFactor)) * 10000 : 0;
    const gi90 = pathFactor > 0 ? (2.30259 / (mu * pathFactor)) * 10000 : 0;
    const gi99 = pathFactor > 0 ? (4.60517 / (mu * pathFactor)) * 10000 : 0;

    // Thin Film Normal Transmission: I/I_0 = exp(-mu * t)
    const filmThicknessCm = (filmThicknessNm * 1e-7); // nm to cm
    const filmAbs = (1 - Math.exp(-mu * filmThicknessCm)) * 100;
    const filmTrans = Math.exp(-mu * filmThicknessCm) * 100;

    return {
      braggBrentano50Um: Number(bb50.toFixed(2)),
      braggBrentano90Um: Number(bb90.toFixed(2)),
      braggBrentano99Um: Number(bb99.toFixed(2)),
      gixrd50Um: Number(gi50.toFixed(3)),
      gixrd90Um: Number(gi90.toFixed(3)),
      gixrd99Um: Number(gi99.toFixed(3)),
      filmAbsorptionFraction: Number(filmAbs.toFixed(3)),
      filmTransmissionFraction: Number(filmTrans.toFixed(3))
    };
  }, [result, twoThetaDeg, gixrdAlphaDeg, filmThicknessNm]);

  // Dynamic Chart Data: Attenuation vs Energy Spectrum (1 to 50 keV)
  const attenuationEnergyData = useMemo(() => {
    if (!result) return [];
    const points = [];
    const energies = [
      1.5, 2.0, 3.0, 4.0, 5.0, 5.415, 6.0, 6.404, 6.930, 7.5, 8.048, 9.0, 10.0,
      12.0, 15.0, 17.479, 20.0, 22.163, 25.0, 30.0, 40.0, 50.0
    ];

    for (const e of energies) {
      let compMuRho = 0;
      for (const el of result.elements) {
        const dbEl = ELEMENT_ATTENUATION_DB[el.symbol];
        if (dbEl) {
          const muEl = getElementMuRhoAtEnergy(dbEl, e);
          compMuRho += el.weightFraction * muEl;
        }
      }
      const linearMu = compMuRho * result.effectiveDensity;
      const penetrationUm = linearMu > 0 ? (1 / linearMu) * 10000 : 0;

      points.push({
        energyKeV: e,
        muRho: Number(compMuRho.toFixed(2)),
        linearMu: Number(linearMu.toFixed(1)),
        penetrationUm: Number(penetrationUm.toFixed(2)),
        isCurrentBeam: Math.abs(e - effectiveEnergy) < 0.1
      });
    }
    return points;
  }, [result, effectiveEnergy]);

  // Dynamic Chart Data: Beam Transmission vs Sample Depth (0 to 5 * 1/mu)
  const transmissionDepthData = useMemo(() => {
    if (!result || result.linearAttenuationMu <= 0) return [];
    const maxDepthUm = Math.max(10, result.ninetyNinePercentDepthUm * 1.2);
    const steps = 30;
    const points = [];

    for (let i = 0; i <= steps; i++) {
      const depthUm = (maxDepthUm / steps) * i;
      const depthCm = depthUm / 10000;
      const transPercent = Math.exp(-result.linearAttenuationMu * depthCm) * 100;
      const absPercent = 100 - transPercent;

      points.push({
        depthUm: Number(depthUm.toFixed(1)),
        transmissionPercent: Number(transPercent.toFixed(2)),
        absorptionPercent: Number(absPercent.toFixed(2))
      });
    }
    return points;
  }, [result]);

  // Dynamic Chart Data: Bragg-Brentano Penetration Depth vs 2θ (5° to 120°)
  const penetrationVs2ThetaData = useMemo(() => {
    if (!result || result.linearAttenuationMu <= 0) return [];
    const points = [];
    for (let angle = 5; angle <= 120; angle += 5) {
      const thetaRad = (angle / 2) * (Math.PI / 180);
      const sinTheta = Math.sin(thetaRad);
      const d50 = (0.69315 * sinTheta / (2 * result.linearAttenuationMu)) * 10000;
      const d90 = (2.30259 * sinTheta / (2 * result.linearAttenuationMu)) * 10000;
      const d99 = (4.60517 * sinTheta / (2 * result.linearAttenuationMu)) * 10000;

      points.push({
        twoTheta: angle,
        depth50: Number(d50.toFixed(2)),
        depth90: Number(d90.toFixed(2)),
        depth99: Number(d99.toFixed(2))
      });
    }
    return points;
  }, [result]);

  // Handlers
  const handleApplyPreset = (preset: AttenuationPreset) => {
    setInputMode('formula');
    setFormula(preset.formula);
    setDensity(preset.density);
    if (preset.commonXRayAnode) {
      setSelectedAnodeId(preset.commonXRayAnode);
      setIsCustomEnergy(false);
    }
    playSynthTone('tick');
  };

  const handleCopyReport = () => {
    if (!result) return;
    const lines = [
      `================================================================`,
      `XRD ATTENUATION & PENETRATION REPORT: ${result.normalizedFormula}`,
      `================================================================`,
      `Chemical Formula:       ${result.formula}`,
      `Formula Weight:         ${result.formulaWeight.toFixed(3)} g/mol`,
      `Total Electrons / F.U.: ${result.totalElectrons}`,
      `Theoretical Density:    ${result.densityGPerCm3.toFixed(3)} g/cm³`,
      `Packing Fraction:       ${(result.packingFraction * 100).toFixed(1)} %`,
      `Effective Density:      ${result.effectiveDensity.toFixed(3)} g/cm³`,
      `Radiation Source:       ${result.selectedAnodeName}`,
      `Photon Energy:          ${result.energyKeV.toFixed(3)} keV (λ = ${result.wavelengthAngstrom.toFixed(5)} Å)`,
      `----------------------------------------------------------------`,
      `ATTENUATION PARAMETERS:`,
      `• Mass Attenuation (μ/ρ):        ${result.massAttenuationMuRho.toFixed(2)} cm²/g`,
      `• Linear Attenuation (μ):        ${result.linearAttenuationMu.toFixed(1)} cm⁻¹ (effective)`,
      `• Solid Linear Attenuation (μ₀): ${result.solidLinearAttenuationMu.toFixed(1)} cm⁻¹ (100% dense)`,
      `• 1/μ Penetration Depth:         ${result.oneOverMuDepthUm.toFixed(2)} µm (63.2% absorbed)`,
      `• Half-Value Layer (HVL, 50%):   ${result.halfValueLayerUm.toFixed(2)} µm`,
      `• 90% Absorption Cutoff Depth:   ${result.ninetyPercentDepthUm.toFixed(2)} µm`,
      `• 99% Absorption Cutoff Depth:   ${result.ninetyNinePercentDepthUm.toFixed(2)} µm`,
      `----------------------------------------------------------------`,
      `DIFFRACTION GEOMETRY DEPTHS (at 2θ = ${twoThetaDeg}°):`,
      `• Symmetric Bragg-Brentano (50% signal): ${geometryResults.braggBrentano50Um} µm`,
      `• Symmetric Bragg-Brentano (90% signal): ${geometryResults.braggBrentano90Um} µm`,
      `• Symmetric Bragg-Brentano (99% signal): ${geometryResults.braggBrentano99Um} µm`,
      `• Grazing GIXRD (α = ${gixrdAlphaDeg}°, 99% signal):   ${geometryResults.gixrd99Um} µm`,
      `----------------------------------------------------------------`,
      `TRANSMISSION & CAPILLARY SIZING:`,
      `• Optimum Capillary Diameter (d = 1/μ): ${result.optimumCapillaryDiameterMm.toFixed(3)} mm`,
      `----------------------------------------------------------------`,
      `ELEMENTAL BREAKDOWN:`,
      ...result.elements.map(e => 
        `  ${e.symbol.padEnd(3)} | Z=${String(e.z).padStart(2)} | wt%: ${(e.weightFraction * 100).toFixed(1).padStart(5)}% | at%: ${(e.atomicFraction * 100).toFixed(1).padStart(5)}% | μ/ρ: ${e.muRho.toFixed(1).padStart(6)} cm²/g | Abs Share: ${e.absorptionSharePercent.toFixed(1).padStart(5)}%`
      ),
      `================================================================`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedText('report');
    playSynthTone('chime');
    setTimeout(() => setCopiedText(null), 2200);
  };

  const handleCopyPythonScript = () => {
    if (!result) return;
    const pyScript = `# Standalone Python Simulation for XRD Attenuation & Penetration Depth
# Compound: ${result.normalizedFormula} | Radiation: ${result.selectedAnodeName}
import numpy as np
import matplotlib.pyplot as plt

# Physical constants and parameters
formula = "${result.normalizedFormula}"
density = ${result.effectiveDensity.toFixed(3)} # g/cm3 (effective with packing)
energy_kev = ${result.energyKeV.toFixed(3)} # keV
wavelength_angstrom = ${result.wavelengthAngstrom.toFixed(5)} # Angstroms
mu_linear = ${result.linearAttenuationMu.toFixed(3)} # cm^-1
one_over_mu_um = ${result.oneOverMuDepthUm.toFixed(2)} # micrometers

print(f"--- Attenuation Summary for {formula} ---")
print(f"Incident Energy: {energy_kev:.3f} keV (lambda = {wavelength_angstrom:.5f} A)")
print(f"Linear Attenuation Coefficient (mu): {mu_linear:.2f} cm^-1")
print(f"Penetration Depth (1/mu): {one_over_mu_um:.2f} um")
print(f"Half-Value Layer (HVL): {${result.halfValueLayerUm.toFixed(2)}} um")
print(f"99% Absorption Depth: {${result.ninetyNinePercentDepthUm.toFixed(2)}} um")

# 1. Plot Beam Transmission Decay vs Sample Depth
depth_um = np.linspace(0, ${Math.max(10, result.ninetyNinePercentDepthUm * 1.5).toFixed(1)}, 300)
depth_cm = depth_um * 1e-4
transmission = np.exp(-mu_linear * depth_cm) * 100

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

ax1.plot(depth_um, transmission, 'b-', lw=2, label='Transmission I(x)/I_0')
ax1.axvline(one_over_mu_um, color='r', linestyle='--', label=f'1/mu = {one_over_mu_um:.1f} um (63.2% abs)')
ax1.axvline(${result.halfValueLayerUm.toFixed(2)}, color='g', linestyle=':', label=f'HVL = {${result.halfValueLayerUm.toFixed(2)}} um (50% abs)')
ax1.set_title(f'X-Ray Transmission Decay: {formula}')
ax1.set_xlabel('Sample Depth (micrometers)')
ax1.set_ylabel('Transmitted Intensity (%)')
ax1.grid(True, alpha=0.3)
ax1.legend()

# 2. Plot Bragg-Brentano Information Depth vs 2-Theta
two_theta_deg = np.linspace(10, 110, 200)
theta_rad = np.radians(two_theta_deg / 2)
# Depth from which 99% of diffracted signal originates
t_99_um = (4.605 * np.sin(theta_rad) / (2 * mu_linear)) * 10000
t_50_um = (0.693 * np.sin(theta_rad) / (2 * mu_linear)) * 10000

ax2.plot(two_theta_deg, t_99_um, 'm-', lw=2, label='99% Diffracted Signal Depth')
ax2.plot(two_theta_deg, t_50_um, 'c--', lw=2, label='50% Signal Origin Depth')
ax2.set_title('Bragg-Brentano Information Depth vs 2-Theta')
ax2.set_xlabel('Diffraction Angle 2-Theta (deg)')
ax2.set_ylabel('Information Depth (micrometers)')
ax2.grid(True, alpha=0.3)
ax2.legend()

plt.tight_layout()
plt.show()
`;

    navigator.clipboard.writeText(pyScript);
    setCopiedText('python');
    playSynthTone('chime');
    setTimeout(() => setCopiedText(null), 2200);
  };

  const handleAddAlloyElement = () => {
    setAlloyElements([...alloyElements, { symbol: 'Cu', wtPercent: 5.0 }]);
  };

  const handleRemoveAlloyElement = (index: number) => {
    if (alloyElements.length <= 1) return;
    setAlloyElements(alloyElements.filter((_, i) => i !== index));
  };

  const handleUpdateAlloyElement = (index: number, field: 'symbol' | 'wtPercent', value: any) => {
    const updated = [...alloyElements];
    if (field === 'symbol') {
      updated[index].symbol = value.toUpperCase();
    } else {
      updated[index].wtPercent = Math.max(0, parseFloat(value) || 0);
    }
    setAlloyElements(updated);
  };

  const handleNormalizeAlloy = () => {
    const sum = alloyElements.reduce((acc, el) => acc + el.wtPercent, 0);
    if (sum <= 0) return;
    const normalized = alloyElements.map(el => ({
      symbol: el.symbol,
      wtPercent: Number(((el.wtPercent / sum) * 100).toFixed(2))
    }));
    setAlloyElements(normalized);
    playSynthTone('tick');
  };

  // Filtered Presets
  const filteredPresets = useMemo(() => {
    if (presetCategory === 'All') return ATTENUATION_PRESETS;
    return ATTENUATION_PRESETS.filter(p => p.category === presetCategory);
  }, [presetCategory]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Bar */}
      <div className="bg-[#0B0F19]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-2xl space-y-4 relative isolate overflow-hidden">
        <div className="absolute inset-x-0 -top-24 h-40 bg-indigo-500/10 blur-[60px] pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                <Atom className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Compound & Alloy X-Ray Attenuation Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                NIST XCOM & McMaster Calibrated
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              High-precision linear absorption coefficients (μ), information penetration depths (t99%), Bragg-Brentano / GIXRD substrate deconvolution, capillary Debye-Scherrer transmission, and secondary fluorescence warnings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              disabled={!result}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-40"
            >
              {copiedText === 'report' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText === 'report' ? 'Report Copied!' : 'Copy Scientific Report'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyPythonScript}
              disabled={!result}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-40"
            >
              {copiedText === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5" />}
              <span>{copiedText === 'python' ? 'Python Script Copied!' : 'Export Python Script'}</span>
            </button>
          </div>
        </div>

        {/* Input Mode Selector Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">Input Mode:</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 gap-1">
            <button
              type="button"
              onClick={() => { setInputMode('formula'); playSynthTone('tick'); }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                inputMode === 'formula' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chemical Formula / Stoichiometry
            </button>
            <button
              type="button"
              onClick={() => { setInputMode('alloy_wt'); playSynthTone('tick'); }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                inputMode === 'alloy_wt' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Alloy Weight Fractions (wt%)
            </button>
            <button
              type="button"
              onClick={() => { setInputMode('atomic_ratio'); playSynthTone('tick'); }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                inputMode === 'atomic_ratio' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Atomic Ratios (at%) / HEA
            </button>
          </div>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Control Panel: Chemical / Alloy Input, Density, Radiation Source */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 shadow-xl space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Sample Composition & Physical State
            </span>

            {/* Mode 1: Formula Input */}
            {inputMode === 'formula' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-300 flex justify-between">
                  <span>Chemical Formula</span>
                  <span className="text-slate-500 font-normal">Supports (PO4)3, hydrates, decimals</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="e.g. Ca5(PO4)3(OH), YBa2Cu3O7, LiFePO4"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-mono font-bold text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all"
                  />
                  {result && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {result.formulaWeight.toFixed(2)} g/mol
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 2: Alloy wt% or at% Table */}
            {(inputMode === 'alloy_wt' || inputMode === 'atomic_ratio') && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-slate-300">
                    {inputMode === 'alloy_wt' ? 'Constituent Elements (wt%)' : 'Constituent Elements (at% Ratios)'}
                  </label>
                  {inputMode === 'alloy_wt' && (
                    <button
                      type="button"
                      onClick={handleNormalizeAlloy}
                      className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Normalize to 100%
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {alloyElements.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-white/5">
                      <input
                        type="text"
                        value={item.symbol}
                        onChange={(e) => handleUpdateAlloyElement(idx, 'symbol', e.target.value)}
                        placeholder="El"
                        className="w-16 bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white font-mono font-bold text-xs rounded-lg px-2 py-1 text-center uppercase"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={item.wtPercent}
                        onChange={(e) => handleUpdateAlloyElement(idx, 'wtPercent', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white font-mono text-xs rounded-lg px-2.5 py-1"
                      />
                      <span className="text-[10px] font-mono text-slate-500">
                        {inputMode === 'alloy_wt' ? 'wt%' : 'at%'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAlloyElement(idx)}
                        disabled={alloyElements.length <= 1}
                        className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddAlloyElement}
                  className="w-full py-1.5 bg-slate-950 hover:bg-slate-900 border border-dashed border-slate-800 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Element
                </button>
              </div>
            )}

            {/* Density & Porosity Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Solid Density
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{density.toFixed(2)} g/cm³</span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="25"
                  value={density}
                  onChange={(e) => setDensity(Math.max(0.01, parseFloat(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-mono text-xs rounded-xl px-2.5 py-2 outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Packing Factor
                  </label>
                  <span className="text-[10px] font-mono text-sky-400 font-bold">{(packingFraction * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={packingFraction}
                  onChange={(e) => setPackingFraction(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />
                <div className="flex justify-between text-[8px] font-mono text-slate-500">
                  <span>Loose Powder (50%)</span>
                  <span>Solid (100%)</span>
                </div>
              </div>
            </div>

            {/* Radiation Source & Tube Selection */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> X-Ray Radiation & Anode Target
                </span>
                <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCustomEnergy}
                    onChange={(e) => setIsCustomEnergy(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Synchrotron / Custom keV</span>
                </label>
              </div>

              {!isCustomEnergy ? (
                <div className="grid grid-cols-3 gap-2">
                  {XRAY_ANODE_SOURCES.map(anode => {
                    const isSelected = selectedAnodeId === anode.id;
                    return (
                      <button
                        key={anode.id}
                        type="button"
                        onClick={() => { setSelectedAnodeId(anode.id); playSynthTone('tick'); }}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm'
                            : 'bg-slate-950 border-white/5 text-slate-400 hover:border-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="font-mono font-bold text-xs">{anode.symbol} Kα</div>
                        <div className="text-[9px] font-mono text-slate-500">{anode.energyKeV.toFixed(2)} keV</div>
                        <div className="text-[8px] font-mono text-slate-500">λ={anode.wavelengthAngstrom.toFixed(3)} Å</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-950 p-3 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Beam Energy:</span>
                    <span className="text-amber-400 font-bold">{customEnergyKeV.toFixed(3)} keV</span>
                    <span className="text-slate-500">λ = {(12.3984 / customEnergyKeV).toFixed(4)} Å</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="60.0"
                    step="0.1"
                    value={customEnergyKeV}
                    onChange={(e) => setCustomEnergyKeV(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-slate-500">
                    <span>1.0 keV (Soft X-Ray)</span>
                    <span>17.5 keV (Mo)</span>
                    <span>60.0 keV (Hard X-Ray)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Benchmark Preset Library */}
          <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Curated Materials Library ({filteredPresets.length})
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {(['All', 'Engineering Alloy', 'Battery', 'Semiconductor', 'Superconductor', 'Ceramic & Mineral', 'Shielding', 'Polymer & Bio'] as CategoryFilter[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPresetCategory(cat)}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-mono transition-all cursor-pointer ${
                    presetCategory === cat
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredPresets.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`w-full p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    formula === preset.formula
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                      : 'bg-slate-950 border-white/5 text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-200">{preset.name}</div>
                    <div className="text-[10px] font-mono text-indigo-300">{preset.formula} • {preset.density} g/cm³</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Dashboard Area: Navigation Tabs & Results */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub Tab Navigation */}
          <div className="flex bg-[#0B0F19] p-1.5 rounded-2xl border border-white/5 gap-1 justify-between shadow-inner">
            {[
              { id: 'metrics', label: 'Overview & Attenuation', icon: Activity, color: 'text-indigo-400' },
              { id: 'geometry', label: 'Diffraction Geometry', icon: Layers, color: 'text-cyan-400' },
              { id: 'spectra', label: 'Spectra & Curves', icon: TrendingDown, color: 'text-amber-400' },
              { id: 'fluorescence', label: 'Fluorescence Guard', icon: AlertTriangle, color: 'text-rose-400' },
              { id: 'python_export', label: 'Python & Export', icon: Code2, color: 'text-emerald-400' }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setActiveTab(tab.id as ActiveTab); playSynthTone('tick'); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    active
                      ? `${tab.color} bg-white/5 border border-white/10 shadow-sm`
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview & Primary Attenuation Metrics */}
          {activeTab === 'metrics' && result && (
            <div className="space-y-4 animate-fadeIn">
              {/* Primary KPI Hero Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">Mass Attenuation</span>
                  <div className="text-indigo-400 font-mono font-black text-xl">
                    {result.massAttenuationMuRho.toFixed(2)}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">μ/ρ (cm²/g)</span>
                </div>

                <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">Linear Attenuation</span>
                  <div className="text-cyan-400 font-mono font-black text-xl">
                    {result.linearAttenuationMu.toFixed(1)}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">μ (cm⁻¹)</span>
                </div>

                <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">Penetration Depth</span>
                  <div className="text-emerald-400 font-mono font-black text-xl">
                    {result.oneOverMuDepthUm.toFixed(2)}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">1/μ (µm, 63.2% abs)</span>
                </div>

                <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">99% Cutoff Depth</span>
                  <div className="text-rose-400 font-mono font-black text-xl">
                    {result.ninetyNinePercentDepthUm.toFixed(2)}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">4.605/μ (µm)</span>
                </div>
              </div>

              {/* Penetration Depth Benchmarks Bar */}
              <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Characteristic Penetration & Half-Value Layer (HVL)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    At {result.energyKeV.toFixed(2)} keV ({result.selectedAnodeName})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">50% Half-Value Layer</span>
                    <span className="text-amber-400 font-mono font-bold text-sm">{result.halfValueLayerUm.toFixed(2)} µm</span>
                    <p className="text-[8px] text-slate-500 mt-0.5">ln(2)/μ: 50% beam attenuated</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">90% Absorption Depth</span>
                    <span className="text-sky-400 font-mono font-bold text-sm">{result.ninetyPercentDepthUm.toFixed(2)} µm</span>
                    <p className="text-[8px] text-slate-500 mt-0.5">2.303/μ: 10% transmission</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono uppercase text-slate-500 block">Optimum Capillary</span>
                    <span className="text-purple-400 font-mono font-bold text-sm">{result.optimumCapillaryDiameterMm.toFixed(3)} mm</span>
                    <p className="text-[8px] text-slate-500 mt-0.5">d = 1/μ for Debye-Scherrer</p>
                  </div>
                </div>
              </div>

              {/* Elemental Breakdown Table */}
              <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <PieChartIcon className="w-4 h-4 text-indigo-400" /> Elemental Mass & Absorption Contribution
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Total: {result.elements.length} elements, {result.totalElectrons} e⁻
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase">
                        <th className="pb-2">Element</th>
                        <th className="pb-2 text-right">Z</th>
                        <th className="pb-2 text-right">Weight %</th>
                        <th className="pb-2 text-right">Atomic %</th>
                        <th className="pb-2 text-right">μ/ρ (cm²/g)</th>
                        <th className="pb-2 text-right">Abs. Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {result.elements.map((el, i) => (
                        <tr key={el.symbol} className="hover:bg-white/[0.02]">
                          <td className="py-2 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ELEMENT_COLORS[i % ELEMENT_COLORS.length] }} />
                            <span className="font-bold text-white">{el.symbol}</span>
                            <span className="text-[10px] text-slate-500">{el.name}</span>
                          </td>
                          <td className="py-2 text-right text-slate-400">{el.z}</td>
                          <td className="py-2 text-right text-slate-300">{(el.weightFraction * 100).toFixed(2)}%</td>
                          <td className="py-2 text-right text-slate-300">{(el.atomicFraction * 100).toFixed(2)}%</td>
                          <td className="py-2 text-right text-indigo-400 font-bold">{el.muRho.toFixed(1)}</td>
                          <td className="py-2 text-right">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold text-[11px]">
                              {el.absorptionSharePercent.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Diffraction Geometry & Substrate Deconvolution */}
          {activeTab === 'geometry' && result && (
            <div className="space-y-4 animate-fadeIn">
              {/* Bragg-Brentano vs GIXRD Sizer */}
              <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" /> Symmetric Bragg-Brentano (θ-2θ) Information Depth
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">2θ = {twoThetaDeg.toFixed(1)}°</span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="120"
                  step="1"
                  value={twoThetaDeg}
                  onChange={(e) => setTwoThetaDeg(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">50% Diffracted Signal</span>
                    <span className="text-sm font-mono font-bold text-cyan-400">{geometryResults.braggBrentano50Um} µm</span>
                    <p className="text-[8px] text-slate-500 mt-0.5">Top half of XRD peak intensity</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">90% Diffracted Signal</span>
                    <span className="text-sm font-mono font-bold text-cyan-300">{geometryResults.braggBrentano90Um} µm</span>
                    <p className="text-[8px] text-slate-500 mt-0.5">Major diffraction volume</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">99% Cutoff Depth</span>
                    <span className="text-sm font-mono font-bold text-rose-400">{geometryResults.braggBrentano99Um} µm</span>
                    <p className="text-[8px] text-slate-500 mt-0.5">Bulk threshold for substrate reflection</p>
                  </div>
                </div>
              </div>

              {/* Grazing Incidence GIXRD Thin Film Probing */}
              <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" /> Grazing Incidence XRD (GIXRD) Thin-Film Depth
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">α = {gixrdAlphaDeg.toFixed(2)}°</span>
                </div>

                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.05"
                  value={gixrdAlphaDeg}
                  onChange={(e) => setGixrdAlphaDeg(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">GIXRD 50% Depth</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">{geometryResults.gixrd50Um} µm</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">GIXRD 90% Depth</span>
                    <span className="text-sm font-mono font-bold text-emerald-300">{geometryResults.gixrd90Um} µm</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">GIXRD 99% Depth</span>
                    <span className="text-sm font-mono font-bold text-emerald-200">{geometryResults.gixrd99Um} µm</span>
                  </div>
                </div>
              </div>

              {/* Capillary Debye-Scherrer Transmission Table */}
              <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-3">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" /> Capillary Debye-Scherrer Transmission Sizing (μ·d Criterion)
                </span>
                <p className="text-xs text-slate-400">
                  Optimal capillary diameter is when μ · d ≈ 1.0 (Transmission ≈ 37%). When μ · d &gt; 2.5, peak positions shift and intensities suffer heavy absorption distortion.
                </p>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  {result.capillaryTransmissions.map(cap => (
                    <div
                      key={cap.diameterMm}
                      className={`p-2.5 rounded-xl border text-center font-mono ${
                        cap.status === 'optimal'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : cap.status === 'too_thick'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-slate-950 border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{cap.diameterMm} mm Ø</div>
                      <div className="text-[11px] font-black">{cap.transmissionPercent}% T</div>
                      <div className="text-[8px] opacity-75">μ·d = {cap.muTimesD}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Interactive Attenuation Spectra & Curves */}
          {activeTab === 'spectra' && result && (
            <div className="space-y-5 animate-fadeIn">
              {/* Chart 1: Attenuation vs Photon Energy */}
              <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white">
                    Mass Attenuation Spectrum μ/ρ(E) vs Photon Energy (1 - 50 keV)
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">
                    Current: {result.energyKeV.toFixed(2)} keV
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attenuationEnergyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="energyKeV" stroke="#64748b" tickFormatter={(v) => `${v} keV`} />
                      <YAxis stroke="#64748b" scale="log" domain={['auto', 'auto']} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val: any) => [`${val} cm²/g`, 'μ/ρ']}
                        labelFormatter={(l) => `Energy: ${l} keV`}
                      />
                      <Line type="monotone" dataKey="muRho" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} name="Mass Attenuation μ/ρ" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Beam Transmission Decay vs Sample Depth */}
              <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white">
                    X-Ray Transmission Decay I(x)/I₀ = exp(-μ·x) vs Sample Depth (μm)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    HVL = {result.halfValueLayerUm.toFixed(2)} µm
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={transmissionDepthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="depthUm" stroke="#64748b" tickFormatter={(v) => `${v} µm`} />
                      <YAxis stroke="#64748b" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val: any) => [`${val}%`, 'Transmitted Intensity']}
                        labelFormatter={(l) => `Depth: ${l} µm`}
                      />
                      <Area type="monotone" dataKey="transmissionPercent" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} name="Transmission %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Bragg-Brentano Penetration Depth vs 2θ */}
              <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-3">
                <span className="text-xs font-mono font-bold text-white">
                  Bragg-Brentano Information Depth t99%(2θ) vs Diffraction Angle (5° - 120°)
                </span>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={penetrationVs2ThetaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="twoTheta" stroke="#64748b" tickFormatter={(v) => `${v}°`} />
                      <YAxis stroke="#64748b" tickFormatter={(v) => `${v} µm`} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="depth99" stroke="#f43f5e" strokeWidth={2} name="99% Signal Depth (µm)" />
                      <Line type="monotone" dataKey="depth50" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" name="50% Signal Depth (µm)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Absorption Edge & Secondary Fluorescence Guard */}
          {activeTab === 'fluorescence' && result && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${
                    result.hasAnyFluorescenceWarning
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {result.hasAnyFluorescenceWarning
                        ? `Fluorescence Risk Detected with ${result.selectedAnodeName}`
                        : `No Detrimental Fluorescence with ${result.selectedAnodeName}`}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Secondary fluorescence occurs when the incident beam energy exceeds the elemental K or L absorption edge, generating high isotropic background noise.
                    </p>
                  </div>
                </div>

                {/* Elements Status List */}
                <div className="space-y-2 pt-2">
                  {result.elements.map(el => (
                    <div
                      key={el.symbol}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                        el.fluorescenceSeverity === 'critical'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : el.fluorescenceSeverity === 'moderate'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-slate-950 border-white/5 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white">{el.symbol} ({el.name})</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            K-Edge: {el.kEdgeKeV ? `${el.kEdgeKeV.toFixed(2)} keV` : 'N/A'}
                          </span>
                        </div>
                        {el.warningMessage && (
                          <p className="text-xs mt-1 text-slate-300 font-sans">{el.warningMessage}</p>
                        )}
                      </div>

                      <div className="text-right font-mono text-[10px] flex-shrink-0">
                        {el.fluorescenceSeverity === 'critical' ? (
                          <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold uppercase">
                            High Fluorescence Noise
                          </span>
                        ) : el.fluorescenceSeverity === 'moderate' ? (
                          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase">
                            Moderate Fluorescence
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                            Clean Background
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommended Solutions */}
                {result.hasAnyFluorescenceWarning && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                    <span className="font-mono font-bold uppercase text-amber-400 block">
                      Recommended Practical Solutions:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      <li>
                        <strong>Switch Anode Tube:</strong> If analyzing Fe/Co bearing samples (steels, magnets, cathode active materials), switch to <strong>Co Kα (6.93 keV)</strong> to stay below the Fe K-edge (7.11 keV).
                      </li>
                      <li>
                        <strong>Energy-Dispersive Pixel Detector:</strong> Use a silicon drift detector (SDD) or 1D/2D pixel detector (e.g. Dectris EIGER / PILATUS) with tight energy discrimination thresholds.
                      </li>
                      <li>
                        <strong>Diffracted-Beam Monochromator:</strong> Insert a secondary graphite or silicon crystal monochromator in the secondary optics path to reject isotropic fluorescence photons.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Python Script & Scientific Export */}
          {activeTab === 'python_export' && result && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0B0F19] p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-emerald-400" /> Standalone Python Simulation Script
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPythonScript}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    {copiedText === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'python' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <pre className="bg-slate-950 p-4 rounded-xl border border-white/5 text-slate-300 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
{`# Standalone Python Simulation for XRD Attenuation & Penetration Depth
# Compound: ${result.normalizedFormula} | Radiation: ${result.selectedAnodeName}
import numpy as np
import matplotlib.pyplot as plt

# Physical constants and parameters
formula = "${result.normalizedFormula}"
density = ${result.effectiveDensity.toFixed(3)} # g/cm3 (effective with packing)
energy_kev = ${result.energyKeV.toFixed(3)} # keV
wavelength_angstrom = ${result.wavelengthAngstrom.toFixed(5)} # Angstroms
mu_linear = ${result.linearAttenuationMu.toFixed(3)} # cm^-1
one_over_mu_um = ${result.oneOverMuDepthUm.toFixed(2)} # micrometers

print(f"--- Attenuation Summary for {formula} ---")
print(f"Incident Energy: {energy_kev:.3f} keV (lambda = {wavelength_angstrom:.5f} A)")
print(f"Linear Attenuation Coefficient (mu): {mu_linear:.2f} cm^-1")
print(f"Penetration Depth (1/mu): {one_over_mu_um:.2f} um")
print(f"Half-Value Layer (HVL): {${result.halfValueLayerUm.toFixed(2)}} um")
print(f"99% Absorption Depth: {${result.ninetyNinePercentDepthUm.toFixed(2)}} um")

# 1. Plot Beam Transmission Decay vs Sample Depth
depth_um = np.linspace(0, ${Math.max(10, result.ninetyNinePercentDepthUm * 1.5).toFixed(1)}, 300)
depth_cm = depth_um * 1e-4
transmission = np.exp(-mu_linear * depth_cm) * 100

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

ax1.plot(depth_um, transmission, 'b-', lw=2, label='Transmission I(x)/I_0')
ax1.axvline(one_over_mu_um, color='r', linestyle='--', label=f'1/mu = {one_over_mu_um:.1f} um (63.2% abs)')
ax1.axvline(${result.halfValueLayerUm.toFixed(2)}, color='g', linestyle=':', label=f'HVL = {${result.halfValueLayerUm.toFixed(2)}} um (50% abs)')
ax1.set_title(f'X-Ray Transmission Decay: {formula}')
ax1.set_xlabel('Sample Depth (micrometers)')
ax1.set_ylabel('Transmitted Intensity (%)')
ax1.grid(True, alpha=0.3)
ax1.legend()

# 2. Plot Bragg-Brentano Information Depth vs 2-Theta
two_theta_deg = np.linspace(10, 110, 200)
theta_rad = np.radians(two_theta_deg / 2)
# Depth from which 99% of diffracted signal originates
t_99_um = (4.605 * np.sin(theta_rad) / (2 * mu_linear)) * 10000
t_50_um = (0.693 * np.sin(theta_rad) / (2 * mu_linear)) * 10000

ax2.plot(two_theta_deg, t_99_um, 'm-', lw=2, label='99% Diffracted Signal Depth')
ax2.plot(two_theta_deg, t_50_um, 'c--', lw=2, label='50% Signal Origin Depth')
ax2.set_title('Bragg-Brentano Information Depth vs 2-Theta')
ax2.set_xlabel('Diffraction Angle 2-Theta (deg)')
ax2.set_ylabel('Information Depth (micrometers)')
ax2.grid(True, alpha=0.3)
ax2.legend()

plt.tight_layout()
plt.show()
`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
