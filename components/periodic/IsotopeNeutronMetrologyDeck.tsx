import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Atom,
  Activity,
  Layers,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend
} from 'recharts';
import { getElementNuclearProfile, ElementNuclearProfile } from './isotopeNeutronData';
import { CrystalElement } from './types';

interface IsotopeNeutronMetrologyDeckProps {
  element: CrystalElement;
}

export const IsotopeNeutronMetrologyDeck: React.FC<IsotopeNeutronMetrologyDeckProps> = ({ element }) => {
  const { t } = useTranslation();
  const profile: ElementNuclearProfile = React.useMemo(() => {
    return getElementNuclearProfile(element.number, element.symbol, element.name);
  }, [element.number, element.symbol, element.name]);

  const isNegativeScattering = profile.boundCohLengthFm < 0;

  // Comparison between X-ray scattering power (f ~ Z) vs Neutron scattering length |b|
  const contrastComparisonData = [
    { name: 'X-Ray f(0) = Z', value: element.number, unit: 'e⁻ (electrons)' },
    { name: 'Neutron |b_coh|', value: Math.abs(profile.boundCohLengthFm), unit: 'fm (fermi)' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      {/* Overview Banner */}
      <div className={`p-4 rounded-2xl border ${
        isNegativeScattering
          ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
          : 'bg-[#0B0F19] border-white/5 text-slate-300'
      } relative overflow-hidden shadow-inner`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isNegativeScattering
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
            }`}>
              <Atom className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {element.name} ({element.symbol}) Nuclear & Neutron Diffraction Profile
                </span>
                {isNegativeScattering && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                    Negative Scattering Length (b &lt; 0)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {profile.crystallographicNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-slate-400">
            <span>Bound Coherent Length (b_coh)</span>
            <Info className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-xl font-black font-mono tracking-tight text-white flex items-baseline gap-1">
            <span className={profile.boundCohLengthFm < 0 ? 'text-rose-400' : 'text-cyan-400'}>
              {profile.boundCohLengthFm > 0 ? `+${profile.boundCohLengthFm.toFixed(2)}` : profile.boundCohLengthFm.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-normal">fm</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Governs constructive Bragg diffraction peak intensity
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-slate-400">
            <span>Incoherent Cross-Section (σ_inc)</span>
            <Info className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-xl font-black font-mono tracking-tight text-amber-400 flex items-baseline gap-1">
            <span>{profile.incohCrossSectionBarns.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-normal">barns</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Produces isotropic flat background haze in powder patterns
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-slate-400">
            <span>Thermal Absorption (σ_abs)</span>
            <Info className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-xl font-black font-mono tracking-tight text-purple-400 flex items-baseline gap-1">
            <span>{profile.absorpCrossSectionBarns.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-normal">barns</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Attenuation for thermal neutrons at v = 2200 m/s (λ = 1.798 Å)
          </p>
        </div>
      </div>

      {/* Isotopic Abundance & Nuclear Spin Table */}
      <div className="rounded-2xl border border-white/5 bg-[#0B0F19] overflow-hidden">
        <div className="p-3 bg-slate-900/80 border-b border-white/5 flex items-center justify-between text-xs font-bold text-slate-200">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Natural Isotopic Abundance & Nuclear Spins
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Total Isotopes: {profile.isotopes.length}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-slate-950/60 text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-2.5">Isotope</th>
                <th className="p-2.5">Abundance (%)</th>
                <th className="p-2.5">Nuclear Spin (I)</th>
                <th className="p-2.5 text-cyan-400">b_coh (fm)</th>
                <th className="p-2.5 text-amber-400">σ_inc (barns)</th>
                <th className="p-2.5 text-purple-400">σ_abs (barns)</th>
                <th className="p-2.5">Stability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profile.isotopes.map((iso) => (
                <tr key={iso.symbol} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-2.5 font-bold font-sans text-white">{iso.symbol}</td>
                  <td className="p-2.5 font-bold text-slate-200">{iso.abundancePct.toFixed(2)}%</td>
                  <td className="p-2.5 text-slate-400">{iso.nuclearSpin}</td>
                  <td className="p-2.5 font-bold text-cyan-400">
                    {iso.bCohFm > 0 ? `+${iso.bCohFm.toFixed(2)}` : iso.bCohFm.toFixed(2)}
                  </td>
                  <td className="p-2.5 text-amber-300">{iso.sigmaIncBarns.toFixed(2)}</td>
                  <td className="p-2.5 text-purple-300">{iso.sigmaAbsBarns.toFixed(2)}</td>
                  <td className="p-2.5">
                    {iso.isStable ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-sans font-bold">
                        Stable
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-sans font-bold">
                        {iso.halfLife || 'Radioactive'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* X-Ray vs Neutron Contrast Explanation Card */}
      <div className="p-4 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Why Neutron Diffraction Complements XRD for {element.name}
          </span>
          <span className="text-[10px] font-mono text-slate-400">Atomic Number Z={element.number}</span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          In <strong>X-ray diffraction</strong>, scattering amplitude scales linearly with atomic number ($f \propto Z$). Heavy atoms overwhelm light elements. In contrast, <strong>neutron scattering lengths ($b$)</strong> depend on nuclear force resonances rather than electron count, enabling crystallographers to locate light atoms (H, Li, C, O) in the presence of heavy matrix metals (Pb, Bi, U).
        </p>

        <div className="h-32 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contrastComparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Bar dataKey="value" name="Scattering Magnitude" fill="#06b6d4">
                <Cell fill="#6366f1" />
                <Cell fill={isNegativeScattering ? '#f43f5e' : '#06b6d4'} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
