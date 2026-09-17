import React, { useState } from 'react';
import { Database, Scale, Layers, ChevronDown, ChevronUp, Info, HelpCircle, ShieldCheck } from 'lucide-react';
import { CrystalSystem } from './CohenPresetsDb';

interface CohenMetricTensorCardProps {
  lattice: { 
    a: number; 
    b: number; 
    c: number; 
    alphaDeg?: number;
    betaDeg?: number; 
    gammaDeg?: number;
    rhombohedralA?: number;
    rhombohedralAlpha?: number;
  };
  sigma: { 
    sigmaA: number; 
    sigmaB: number; 
    sigmaC: number; 
    sigmaAlpha?: number;
    sigmaBeta?: number;
    sigmaGamma?: number;
    sigmaVolume: number;
  };
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

  const { 
    a, 
    b, 
    c, 
    alphaDeg = 90, 
    betaDeg = 90, 
    gammaDeg = 90, 
    rhombohedralA, 
    rhombohedralAlpha 
  } = lattice;

  const alphaRad = (alphaDeg * Math.PI) / 180;
  const betaRad = (betaDeg * Math.PI) / 180;
  const gammaRad = (gammaDeg * Math.PI) / 180;

  const cosA = Math.cos(alphaRad);
  const cosB = Math.cos(betaRad);
  const cosG = Math.cos(gammaRad);

  // Direct Metric Tensor G
  // G = [ [a^2, a*b*cos(gamma), a*c*cos(beta)], [b*a*cos(gamma), b^2, b*c*cos(alpha)], [c*a*cos(beta), c*b*cos(alpha), c^2] ]
  const G: number[][] = [
    [a * a, a * b * cosG, a * c * cosB],
    [b * a * cosG, b * b, b * c * cosA],
    [c * a * cosB, c * b * cosA, c * c]
  ];

  // Invert 3x3 to get reciprocal metric tensor G*
  const detG = volume * volume;
  let GStar: number[][] = [
    [1 / (a * a), 0, 0],
    [0, 1 / (b * b), 0],
    [0, 0, 1 / (c * c)]
  ];

  if (detG > 0) {
    const invA = (G[1][1] * G[2][2] - G[1][2] * G[2][1]) / detG;
    const invB = -(G[0][1] * G[2][2] - G[0][2] * G[2][1]) / detG;
    const invC = (G[0][1] * G[1][2] - G[0][2] * G[1][1]) / detG;
    const invD = -(G[1][0] * G[2][2] - G[1][2] * G[2][0]) / detG;
    const invE = (G[0][0] * G[2][2] - G[0][2] * G[2][0]) / detG;
    const invF = -(G[0][0] * G[1][2] - G[0][2] * G[1][0]) / detG;
    const invG = (G[1][0] * G[2][1] - G[1][1] * G[2][0]) / detG;
    const invH = -(G[0][0] * G[2][1] - G[0][1] * G[2][0]) / detG;
    const invI = (G[0][0] * G[1][1] - G[0][1] * G[1][0]) / detG;

    GStar = [
      [invA, invB, invC],
      [invD, invE, invF],
      [invG, invH, invI]
    ];
  }

  // Reciprocal Lattice Lengths & Angles
  const aStar = Math.sqrt(Math.max(1e-12, GStar[0][0]));
  const bStar = Math.sqrt(Math.max(1e-12, GStar[1][1]));
  const cStar = Math.sqrt(Math.max(1e-12, GStar[2][2]));

  const cosAlphaStar = Math.max(-1, Math.min(1, GStar[1][2] / (bStar * cStar)));
  const cosBetaStar = Math.max(-1, Math.min(1, GStar[0][2] / (aStar * cStar)));
  const cosGammaStar = Math.max(-1, Math.min(1, GStar[0][1] / (aStar * bStar)));

  const alphaStarDeg = Math.acos(cosAlphaStar) * (180 / Math.PI);
  const betaStarDeg = Math.acos(cosBetaStar) * (180 / Math.PI);
  const gammaStarDeg = Math.acos(cosGammaStar) * (180 / Math.PI);

  // X-ray Density rho = (Z * M) / (N_A * V * 10^-24)
  // N_A = 6.02214076 * 10^23 mol^-1
  const NA = 6.02214076e23;
  const densityGcm3 = volume > 0 && customZ > 0 && customM > 0
    ? (customZ * customM) / (NA * volume * 1e-24)
    : 0;

  const sigmaDensity = volume > 0 && densityGcm3 > 0
    ? densityGcm3 * (sigma.sigmaVolume / volume)
    : 0;

  // Relative error in ppm for parameter a: (sigmaA / a) * 10^6
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
          <span>{showAdvancedMetrics ? 'Simple View' : 'Reciprocal Tensor Details'}</span>
          {showAdvancedMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Grid: Direct Tensor & Crystallographic Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Direct Metric Tensor Matrix [G] */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Direct Metric Tensor [G] (Å²)
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              det(G) = V² = {detG.toFixed(2)} Å⁶
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs overflow-x-auto">
            <table className="w-full text-center">
              <tbody>
                {G.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-1.5 ${
                          rIdx === cIdx
                            ? 'font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 rounded'
                            : 'text-slate-600 dark:text-slate-400'
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

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Direct Angles: α={alphaDeg.toFixed(2)}°, β={betaDeg.toFixed(2)}°, γ={gammaDeg.toFixed(2)}°</span>
            {rhombohedralA && (
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                a_r={rhombohedralA.toFixed(4)}Å, α_r={rhombohedralAlpha?.toFixed(2)}°
              </span>
            )}
          </div>
        </div>

        {/* X-ray Theoretical Density Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Crystallographic X-Ray Density (ρ_calc)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              ±{ppmErrorA} ppm precision
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {densityGcm3.toFixed(precision)}
            </span>
            <span className="text-sm font-bold text-slate-500">g / cm³</span>
            {sigmaDensity > 0 && (
              <span className="text-xs font-mono text-slate-400 ml-2">
                ±{sigmaDensity.toFixed(Math.min(6, precision + 1))}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Formula Units Z:
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={customZ}
                onChange={(e) => setCustomZ(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-2 py-1 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Molar Mass M (g/mol):
              </label>
              <input
                type="number"
                min="0.1"
                step="0.01"
                value={customM}
                onChange={(e) => setCustomM(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-full px-2 py-1 text-xs font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Reciprocal Tensor Matrix [G*] */}
      {showAdvancedMetrics && (
        <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Reciprocal Metric Tensor [G*] = [G]⁻¹ (Å⁻²)
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              a* = {aStar.toFixed(5)} Å⁻¹, b* = {bStar.toFixed(5)} Å⁻¹, c* = {cStar.toFixed(5)} Å⁻¹
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs overflow-x-auto">
            <table className="w-full text-center">
              <tbody>
                {GStar.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-1.5 ${
                          rIdx === cIdx
                            ? 'font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 rounded'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {val.toFixed(6)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Reciprocal Angles: α* = {alphaStarDeg.toFixed(2)}°, β* = {betaStarDeg.toFixed(2)}°, γ* = {gammaStarDeg.toFixed(2)}°
          </div>
        </div>
      )}
    </div>
  );
};
