import React from 'react';
import { Layers, Eye, EyeOff, CheckCircle, AlertTriangle, Atom, Ruler, TrendingUp, HelpCircle } from 'lucide-react';
import { DoubleVoigtResult, DoubleVoigtPoint } from '../../types';
import { useSettings, convertLength } from '../SettingsContext';

interface DoubleVoigtSinglePeakTableProps {
  result: DoubleVoigtResult;
  onTogglePeakExclusion: (index: number) => void;
  onSelectPeak: (index: number) => void;
  selectedPeakIdx: number;
}

export const DoubleVoigtSinglePeakTable: React.FC<DoubleVoigtSinglePeakTableProps> = ({
  result,
  onTogglePeakExclusion,
  onSelectPeak,
  selectedPeakIdx
}) => {
  const { lengthUnit = 'Å' } = useSettings();

  if (!result || !result.points || result.points.length === 0) {
    return null;
  }

  const activePointsCount = result.points.filter(p => !p.isExcluded).length;

  return (
    <div className="space-y-4 bg-[#030710]/70 p-4 sm:p-6 rounded-2xl border border-indigo-500/20 relative shadow-inner">
      {/* Header & Reflection Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 font-mono">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Single-Peak Langford Deconvolution & Reflection Table
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Active Reflections:</span>
          <span className="text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {activePointsCount} of {result.points.length}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300">
        Each Bragg reflection is independently deconvoluted into Cauchy (size) and Gaussian (strain) components using Langford single-line formalism. Click on any row to inspect its profile or toggle the <span className="text-cyan-300 font-mono font-bold">Include/Exclude</span> switch to filter outliers.
      </p>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-white/10 shadow-inner">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase bg-black/60">
              <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              <th className="py-2.5 px-3 font-semibold">2θ [°]</th>
              <th className="py-2.5 px-3 font-semibold text-center">hkl</th>
              <th className="py-2.5 px-3 font-semibold">d [Å]</th>
              <th className="py-2.5 px-3 font-semibold">FWHM [°]</th>
              <th className="py-2.5 px-3 font-semibold">η (obs)</th>
              <th className="py-2.5 px-3 font-semibold text-indigo-300">β_C* [nm⁻¹]</th>
              <th className="py-2.5 px-3 font-semibold text-purple-300">(β_G*)² [nm⁻²]</th>
              <th className="py-2.5 px-3 font-semibold text-emerald-300">Single D_V</th>
              <th className="py-2.5 px-3 font-semibold text-purple-300">Single e_app</th>
              <th className="py-2.5 px-3 font-semibold text-cyan-300">ρ_d [m⁻²]</th>
              <th className="py-2.5 px-3 font-semibold text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {result.points.map((p, idx) => {
              const isSelected = selectedPeakIdx === idx;
              return (
                <tr
                  key={idx}
                  onClick={() => onSelectPeak(idx)}
                  className={`transition-colors cursor-pointer ${
                    p.isExcluded
                      ? 'opacity-40 bg-rose-950/10 hover:bg-rose-950/20'
                      : isSelected
                      ? 'bg-indigo-950/40 border-l-2 border-l-indigo-400'
                      : idx % 2 === 0
                      ? 'bg-black/20 hover:bg-white/5'
                      : 'bg-black/40 hover:bg-white/5'
                  }`}
                >
                  {/* Inclusion Toggle */}
                  <td className="py-2 px-3 text-center" onClick={(e) => { e.stopPropagation(); onTogglePeakExclusion(idx); }}>
                    <button
                      title={p.isExcluded ? 'Include reflection in regression' : 'Exclude reflection from regression'}
                      className={`p-1 rounded-lg border transition-all cursor-pointer ${
                        p.isExcluded
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                    >
                      {p.isExcluded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </td>

                  {/* 2theta */}
                  <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                    {p.twoTheta !== undefined ? `${p.twoTheta.toFixed(2)}°` : '—'}
                  </td>

                  {/* hkl */}
                  <td className="py-2 px-3 text-center">
                    {p.hkl ? (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold">
                        ({p.hkl.join('')})
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  {/* d-spacing */}
                  <td className="py-2 px-3 text-slate-300">
                    {p.dSpacingA ? p.dSpacingA.toFixed(4) : '—'}
                  </td>

                  {/* FWHM */}
                  <td className="py-2 px-3 text-slate-300">
                    {p.fwhmObs ? p.fwhmObs.toFixed(3) : '—'}
                  </td>

                  {/* eta */}
                  <td className="py-2 px-3 text-slate-300">
                    {p.etaObs !== undefined ? p.etaObs.toFixed(2) : '0.50'}
                  </td>

                  {/* beta_C* */}
                  <td className="py-2 px-3 text-indigo-300 font-bold">
                    {p.betaCStar !== undefined ? p.betaCStar.toFixed(5) : '—'}
                  </td>

                  {/* beta_G*^2 */}
                  <td className="py-2 px-3 text-purple-300 font-bold">
                    {p.betaGStarSq !== undefined ? p.betaGStarSq.toFixed(5) : '—'}
                  </td>

                  {/* Single D_V */}
                  <td className="py-2 px-3 text-emerald-300 font-bold">
                    {p.singleDvNm > 0
                      ? `${convertLength(p.singleDvNm * 10, lengthUnit).toFixed(1)} ${lengthUnit}`
                      : '—'}
                  </td>

                  {/* Single Strain */}
                  <td className="py-2 px-3 text-purple-300">
                    {p.singleStrain !== undefined ? `${(p.singleStrain * 100).toFixed(3)}%` : '—'}
                  </td>

                  {/* Single Dislocation Density */}
                  <td className="py-2 px-3 text-cyan-300">
                    {p.singleDislocationDensityM2 && p.singleDislocationDensityM2 > 0
                      ? p.singleDislocationDensityM2.toExponential(2)
                      : '—'}
                  </td>

                  {/* Inspect Button */}
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => onSelectPeak(idx)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        isSelected
                          ? 'bg-indigo-500 text-white border-indigo-400'
                          : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Viewing' : 'Select'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Notes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 font-mono pt-1">
        <span>* Single-line apparent parameters use pure specimen breadths: β_C,f = β_C,h - β_C,g & β_G,f² = β_G,h² - β_G,g².</span>
        <span className="text-indigo-300">Williamson-Smallman Burgers vector b = {result.burgersVectorNm || 0.25} nm</span>
      </div>
    </div>
  );
};
