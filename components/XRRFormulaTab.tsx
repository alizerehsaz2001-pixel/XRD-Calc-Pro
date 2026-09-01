import React, { useState, useEffect } from 'react';
import { calculateOpticalConstantsFromFormula, FormulaOpticalResult, RADIATION_SOURCES } from '../utils/xrrPhysics';
import { Calculator, Plus, Zap, Check, Sparkles, BookOpen, Layers } from 'lucide-react';

interface XRRFormulaTabProps {
  wavelength: number;
  onAddLayerFromFormula: (result: FormulaOpticalResult) => void;
}

export const XRRFormulaTab: React.FC<XRRFormulaTabProps> = ({ wavelength, onAddLayerFromFormula }) => {
  const [formulaInput, setFormulaInput] = useState('SrTiO3');
  const [densityInput, setDensityInput] = useState('5.12');
  const [result, setResult] = useState<FormulaOpticalResult | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    const densNum = parseFloat(densityInput);
    const calc = calculateOpticalConstantsFromFormula(formulaInput, isNaN(densNum) ? undefined : densNum, wavelength);
    setResult(calc);
  }, [formulaInput, densityInput, wavelength]);

  const handleAdd = () => {
    if (result) {
      onAddLayerFromFormula(result);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  const sampleFormulas = [
    { formula: 'TiO2', density: 4.23, label: 'Titanium Dioxide' },
    { formula: 'Al2O3', density: 3.98, label: 'Alumina' },
    { formula: 'HfO2', density: 9.68, label: 'Hafnia (High-k)' },
    { formula: 'SrTiO3', density: 5.12, label: 'Strontium Titanate' },
    { formula: 'Bi2Te3', density: 7.86, label: 'Bismuth Telluride' },
    { formula: 'YBa2Cu3O7', density: 6.38, label: 'YBCO Superconductor' },
    { formula: 'CH3NH3PbI3', density: 4.16, label: 'MAPbI3 Perovskite' },
    { formula: 'Li7La3Zr2O12', density: 5.10, label: 'LLZO Electrolyte' },
  ];

  return (
    <div id="xrr-formula-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400" />
          Chemical Stoichiometry & Optical Constants Engine
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Enter any chemical formula or stoichiometry to compute exact Henke atomic scattering dispersion (δ), absorption (β), electron density (ρe), and critical angle (θc) at the current wavelength (λ = {wavelength} Å).
        </p>

        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Chemical Formula (e.g. TiO2, SrTiO3, Ba0.5Sr0.5TiO3, YBa2Cu3O7)
            </label>
            <input
              id="xrr-formula-input"
              type="text"
              value={formulaInput}
              onChange={(e) => setFormulaInput(e.target.value)}
              placeholder="e.g. TiO2 or Al2O3"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Mass Density ρ (g/cm³)
            </label>
            <input
              id="xrr-density-input"
              type="number"
              step="0.01"
              value={densityInput}
              onChange={(e) => setDensityInput(e.target.value)}
              placeholder="Theoretical if blank"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] text-slate-400 mr-1">Quick Presets:</span>
          {sampleFormulas.map((s) => (
            <button
              key={s.formula}
              onClick={() => {
                setFormulaInput(s.formula);
                setDensityInput(s.density.toString());
              }}
              className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 font-mono transition-colors"
            >
              {s.formula}
            </button>
          ))}
        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-mono">
                {result.formula}
              </h3>
              <p className="text-xs text-slate-400">
                Molar Mass: <span className="font-mono text-emerald-400">{result.molarMass} g/mol</span> • Mass Density: <span className="font-mono text-emerald-400">{result.density} g/cm³</span>
              </p>
            </div>

            <button
              id="add-layer-from-calc-btn"
              onClick={handleAdd}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                addedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-950'
              }`}
            >
              {addedSuccess ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {addedSuccess ? 'Added to Multilayer Stack!' : 'Add to Multilayer Stack'}
            </button>
          </div>

          {/* Optical Constants Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Dispersion (δ × 10⁻⁶)</span>
              <span className="text-xl font-bold text-cyan-300 font-mono">{result.delta}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Refraction decrement</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Absorption (β × 10⁻⁷)</span>
              <span className="text-xl font-bold text-amber-300 font-mono">{result.beta}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Extinction coefficient</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Critical Angle (θc)</span>
              <span className="text-xl font-bold text-emerald-300 font-mono">{result.criticalAngleDeg}°</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Total external reflection</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 block">Electron Density (ρe)</span>
              <span className="text-xl font-bold text-purple-300 font-mono">{result.electronDensity}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">e⁻ / Å³</span>
            </div>
          </div>

          {/* Stoichiometric Element Breakdown */}
          <div>
            <h5 className="text-xs font-semibold text-slate-300 mb-2">Atomic Scattering Factors (Henke Database):</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {result.elements.map((el) => (
                <div key={el.element} className="bg-slate-950/80 border border-slate-800 rounded p-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>{el.element} (Z={el.atomicZ})</span>
                    <span className="text-cyan-400">×{el.count}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    f₁' = {el.f1} • f₂'' = {el.f2}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
