import React, { useState } from 'react';
import { Database, Scale, Layers, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';
import { CrystalSystem } from './CohenPresetsDb';

interface CohenMetricTensorCardProps {
  lattice: { a: number; b: number; c: number; betaDeg?: number };
  sigma: { sigmaA: number; sigmaB: number; sigmaC: number; sigmaVolume: number };
  volume: number;
  crystalSystem: CrystalSystem;
  molarMass?: number;
  formulaUnitsZ?: number;
  precision?: number;
}

export const CohenMetricTensorCard: React.FC<CohenMetricTensorCardProps> = ({
  lattice,
  sigma,
  volume,
  crystalSystem,
  molarMass = 28.0855,
  formulaUnitsZ = 8,
  precision = 4
}) => {
  const [customZ, setCustomZ] = useState<number>(formulaUnitsZ);
  const [customM, setCustomM] = useState<number>(molarMass);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState<boolean>(false);

  const { a, b, c, betaDeg = 90 } = lattice;
  const betaRad = (betaDeg * Math.PI) / 180;

  // Direct Metric Tensor G
  // G = [ [a^2, a*b*cos(gamma), a*c*cos(beta)], [b*a*cos(gamma), b^2, b*c*cos(alpha)], [c*a*cos(beta), c*b*cos(alpha), c^2] ]
  let G: number[][] = [
    [a * a, 0, 0],
    [0, b * b, 0],
    [0, 0, c * c]
  ];

  if (crystalSystem === 'Hexagonal') {
    // gamma = 120 deg, cos(120) = -0.5
    G = [
      [a * a, -0.5 * a * a, 0],
      [-0.5 * a * a, a * a, 0],
      [0, 0, c * c]
    ];
  } else if (crystalSystem === 'Monoclinic') {
    // beta != 90 deg
    const cosB = Math.cos(betaRad);
    G = [
      [a * a, 0, a * c * cosB],
      [0, b * b, 0],
      [a * c * cosB, 0, c * c]
    ];
  }

  // Reciprocal Lattice Parameters
  // a* = 2pi * (b x c) / V => in crystallography standard, a* = 1/d = lambda / ...
  // Crystallographer's definition without 2pi:
  let aStar = 1 / a;
  let bStar = 1 / b;
  let cStar = 1 / c;

  if (crystalSystem === 'Hexagonal') {
    aStar = 2 / (Math.sqrt(3) * a);
    bStar = aStar;
    cStar = 1 / c;
  } else if (crystalSystem === 'Monoclinic') {
    const sinB = Math.sin(betaRad);
    aStar = 1 / (a * sinB);
    bStar = 1 / b;
    cStar = 1 / (c * sinB);
  }

  // X-ray Density rho = (Z * M) / (N_A * V * 10^-24)
  // N_A = 6.02214076 * 10^23 mol^-1
  // V in A^3 = V * 10^-24 cm^3
  const NA = 6.02214076e23;
  const densityGcm3 = volume > 0 && customZ > 0 && customM > 0
    ? (customZ * customM) / (NA * volume * 1e-24)
    : 0;

  // Error in ppm for parameter a: (sigmaA / a) * 10^6
  const ppmErrorA = a > 0 ? ((sigma.sigmaA / a) * 1e6).toFixed(1) : '0';
  const ppmErrorV = volume > 0 ? ((sigma.sigmaVolume / volume) * 1e6).toFixed(1) : '0';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
            Crystallographic Metric Tensor &amp; Physical Density
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
        >
          {showAdvancedMetrics ? 'Collapse Tensor Matrix' : 'Expand Metric Tensor'}
          {showAdvancedMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: X-ray Density */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Theoretical X-ray Density</span>
            <Scale className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
            {densityGcm3.toFixed(3)} <span className="text-xs font-sans text-slate-500">g/cm³</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Z =</span>
              <input
                type="number"
                value={customZ}
                onChange={(e) => setCustomZ(parseFloat(e.target.value) || 1)}
                className="w-8 px-1 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center font-bold text-slate-700 dark:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">M =</span>
              <input
                type="number"
                step="0.1"
                value={customM}
                onChange={(e) => setCustomM(parseFloat(e.target.value) || 28)}
                className="w-14 px-1 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center font-bold text-slate-700 dark:text-slate-300"
              />
              <span className="text-slate-400">g/mol</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Lattice Precision (ppm) */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Relative Precision σ(a)/a</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold">
              ppm
            </span>
          </div>
          <div className="text-xl font-black font-mono text-indigo-700 dark:text-indigo-400">
            {ppmErrorA} <span className="text-xs font-sans text-slate-500">ppm</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
            Volume Uncertainty: ±{ppmErrorV} ppm
          </div>
        </div>

        {/* Metric 3: Reciprocal Cell Spacings */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Reciprocal Lattice Constants</span>
            <Layers className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="text-sm font-black font-mono text-cyan-700 dark:text-cyan-400 space-y-0.5">
            <div>a* = {aStar.toFixed(4)} Å⁻¹</div>
            {crystalSystem !== 'Cubic' && <div>c* = {cStar.toFixed(4)} Å⁻¹</div>}
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
            d* = 1 / d(hkl) basis
          </div>
        </div>

        {/* Metric 4: Confidence Intervals */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>1σ, 2σ, 3σ Intervals</span>
            <span className="text-[10px] text-amber-500 font-mono font-bold">Gaussian</span>
          </div>
          <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 space-y-0.5">
            <div>68.3% (1σ): ±{(sigma.sigmaA).toFixed(precision + 1)} Å</div>
            <div>95.4% (2σ): ±{(sigma.sigmaA * 2).toFixed(precision + 1)} Å</div>
            <div>99.7% (3σ): ±{(sigma.sigmaA * 3).toFixed(precision + 1)} Å</div>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
            Based on [M⁻¹] variance propagation
          </div>
        </div>
      </div>

      {/* Advanced Metric Tensor View */}
      {showAdvancedMetrics && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Direct Metric Tensor [G] Matrix (Å²):
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              g_ij = a_i · a_j
            </span>
          </div>

          <div className="overflow-x-auto flex justify-center py-2">
            <table className="font-mono text-xs text-center border-collapse">
              <tbody>
                {G.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-2.5 border border-slate-200 dark:border-slate-800 font-bold ${
                          rIdx === cIdx
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {val.toFixed(4)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
