import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { Droplet, Sparkles, Compass, Info, CheckCircle2 } from 'lucide-react';

interface SolventContrastMatchingToolProps {
  cellSLD: number; // in 10^-6 Å^-2
  d2oFraction: number;
  onD2oFractionChange: (d2o: number) => void;
}

export const SolventContrastMatchingTool: React.FC<SolventContrastMatchingToolProps> = ({
  cellSLD,
  d2oFraction,
  onD2oFractionChange
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('sample');

  // Bio & Material SANS presets
  const sansPresets = [
    { id: 'sample', name: 'Current Crystal Cell', sld: cellSLD, desc: 'Computed from your active unit cell' },
    { id: 'protein', name: 'Standard Protein (H-protein)', sld: 1.85, matchD2O: 42, desc: 'Average globular protein in water' },
    { id: 'dna', name: 'DNA / Nucleic Acid', sld: 3.40, matchD2O: 68, desc: 'Double-stranded DNA / RNA' },
    { id: 'lipid_tails', name: 'Lipid Hydrocarbon Tails', sld: -0.35, matchD2O: 6, desc: 'Acyl lipid chains' },
    { id: 'lipid_heads', name: 'Phospholipid Headgroups', sld: 1.50, matchD2O: 36, desc: 'Polar phosphatidylcholine' },
    { id: 'd_protein', name: 'Deuterated Protein (D-protein)', sld: 7.20, matchD2O: 100, desc: 'Fully deuterated biological macromolecule' }
  ];

  const activeTarget = sansPresets.find(p => p.id === selectedPreset) || sansPresets[0];
  const targetSLD = selectedPreset === 'sample' ? cellSLD : activeTarget.sld;

  // Solvent SLD as function of D2O %:
  // Pure H2O SLD = -0.56 x 10^-6 Å^-2
  // Pure D2O SLD = +6.38 x 10^-6 Å^-2
  // SLD_solvent = -0.56 + (6.38 - (-0.56)) * (D2O% / 100) = -0.56 + 6.94 * f
  const solventSLD = -0.56 + 0.0694 * d2oFraction;
  const contrastFactor = Math.abs(solventSLD - targetSLD);
  const contrastSq = Math.pow(contrastFactor, 2);

  // Exact Match Point D2O %
  const matchPointD2O = Math.max(0, Math.min(100, ((targetSLD + 0.56) / 0.0694)));

  // Generate contrast curve data from 0% to 100% D2O
  const curveData = useMemo(() => {
    const points = [];
    for (let d = 0; d <= 100; d += 5) {
      const s_sld = -0.56 + 0.0694 * d;
      const c_sq = Math.pow(s_sld - targetSLD, 2);
      points.push({
        d2o: d,
        solventSLD: parseFloat(s_sld.toFixed(2)),
        sampleSLD: parseFloat(targetSLD.toFixed(2)),
        contrastSq: parseFloat(c_sq.toFixed(3))
      });
    }
    return points;
  }, [targetSLD]);

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      {/* Header & Sub-Bar */}
      <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-pink-500/10 text-pink-400 border border-pink-500/20">
              Solvent Contrast Variation & SANS Match Point
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              H₂O (-0.56) ↔ D₂O (+6.38 × 10⁻⁶ Å⁻²)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tune the aqueous solvent's scattering length density to match specific phases, rendering them invisible to isolate hidden components.
          </p>
        </div>

        {/* Quick Match Point Jump */}
        {matchPointD2O >= 0 && matchPointD2O <= 100 && (
          <button
            onClick={() => onD2oFractionChange(Math.round(matchPointD2O))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-[10px] font-black uppercase tracking-wider transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Jump to Match Point ({matchPointD2O.toFixed(1)}% D₂O)
          </button>
        )}
      </div>

      {/* Preset Selector */}
      <div className="flex flex-wrap gap-2">
        {sansPresets.map(preset => (
          <button
            key={preset.id}
            onClick={() => setSelectedPreset(preset.id)}
            className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${
              selectedPreset === preset.id
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                : 'bg-black/30 text-slate-400 border border-white/5 hover:bg-black/50 hover:text-slate-200'
            }`}
          >
            {preset.name} (SLD: {preset.sld.toFixed(2)})
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SLD Curve Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-[#070D18] p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">
              SLD Matching Curve (10⁻⁶ Å⁻²)
            </h4>
            <span className="text-[10px] font-mono text-pink-400 font-bold">
              Current Solvent: {solventSLD.toFixed(2)} 10⁻⁶ Å⁻²
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curveData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="d2o"
                  label={{ value: '% D₂O in H₂O / D₂O solvent mix', position: 'bottom', offset: 5, fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                />
                <YAxis
                  label={{ value: 'SLD (10⁻⁶ Å⁻²)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-[10px] space-y-1">
                          <p className="font-bold text-pink-400">{d.d2o}% D₂O Solvent Mix</p>
                          <p className="text-slate-300">Solvent SLD: <strong>{d.solventSLD} 10⁻⁶ Å⁻²</strong></p>
                          <p className="text-slate-300">Target SLD: <strong>{d.sampleSLD} 10⁻⁶ Å⁻²</strong></p>
                          <p className="text-slate-400">Contrast (Δρ)²: <strong>{d.contrastSq} 10⁻¹² Å⁻⁴</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: '10px', fontWeight: 800 }} />
                <Line name="Solvent SLD" type="monotone" dataKey="solventSLD" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line name="Target SLD" type="monotone" dataKey="sampleSLD" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* D2O Slider */}
          <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400">Solvent D₂O Fraction:</span>
              <span className="text-pink-400 font-mono font-black">{100 - d2oFraction}% H₂O / {d2oFraction}% D₂O</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={d2oFraction}
              onChange={(e) => onD2oFractionChange(parseInt(e.target.value))}
              className="w-full accent-pink-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right Info Card & Match Status (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0B1528] p-5 rounded-3xl border border-pink-500/20 space-y-4 shadow-xl text-left">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
              Contrast Factor & Match Status
            </h4>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Target Phase:</span>
                <span className="text-white font-mono font-black">{activeTarget.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Target SLD:</span>
                <span className="text-blue-400 font-mono font-black">{targetSLD.toFixed(3)} 10⁻⁶ Å⁻²</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Solvent SLD:</span>
                <span className="text-pink-400 font-mono font-black">{solventSLD.toFixed(3)} 10⁻⁶ Å⁻²</span>
              </div>
              <div className="w-full h-px bg-white/10 my-2" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Relative Contrast (Δρ)²:</span>
                <span className={`font-mono font-black ${contrastFactor < 0.15 ? 'text-emerald-400 text-sm' : 'text-pink-400'}`}>
                  {(contrastSq * 10).toFixed(3)}
                </span>
              </div>
            </div>

            {/* Match Status Banner */}
            {contrastFactor < 0.15 ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <span className="block uppercase tracking-wider text-[10px] text-emerald-400">Match Point Achieved!</span>
                  At {d2oFraction}% D₂O, the solvent's nuclear SLD perfectly equals {targetSLD.toFixed(2)} 10⁻⁶ Å⁻². The target phase is optically invisible to neutrons!
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 text-slate-400 text-xs leading-relaxed">
                Adjust the solvent mix until the pink Solvent curve crosses the blue Target line at the match point ({matchPointD2O.toFixed(1)}% D₂O).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
