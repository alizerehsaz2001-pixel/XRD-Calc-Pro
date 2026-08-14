import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Sparkles, Layers, Sliders, ShieldAlert, Atom, Activity, Info, Check, Copy } from 'lucide-react';
import { XRayProperties, calculateAtomicFormFactor, getFullXRayProperties } from './XRayScatteringDb';
import { playSynthTone } from '../utils/sound';

interface FormFactorChartProps {
  element?: {
    number: number;
    symbol: string;
    name: string;
    category?: string;
  };
  atomicNumber?: number;
  symbol?: string;
  name?: string;
  compareZ?: number;
  onSelectCompareElement?: (z: number) => void;
  availableElements?: { number: number; symbol: string; name: string }[];
}

export const FormFactorChart: React.FC<FormFactorChartProps> = ({
  element,
  atomicNumber,
  symbol,
  name,
  compareZ,
  onSelectCompareElement,
  availableElements = []
}) => {
  const targetNumber = element?.number || atomicNumber || 14;
  const targetSymbol = element?.symbol || symbol || 'Si';
  const targetName = element?.name || name || 'Silicon';

  const [xAxisMode, setXAxisMode] = useState<'s' | 'q'>('s'); // s = sin(theta)/lambda, q = 4*pi*s
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [selectedRadiation, setSelectedRadiation] = useState<'CuKa' | 'MoKa' | 'CoKa' | 'CrKa'>('CuKa');

  const primaryXRay = useMemo(() => {
    return getFullXRayProperties(targetNumber, targetSymbol, targetName);
  }, [targetNumber, targetSymbol, targetName]);

  const compareXRay = useMemo(() => {
    if (!compareZ) return null;
    const compEl = availableElements.find(e => e.number === compareZ);
    return getFullXRayProperties(compareZ, compEl?.symbol || `Z=${compareZ}`, compEl?.name || '');
  }, [compareZ, availableElements]);

  // Generate scattering curve points from s = 0 to 1.5 A^-1
  const chartData = useMemo(() => {
    const data: { s: number; q: number; label: string; [key: string]: any }[] = [];
    const steps = 60;
    const maxS = 1.5; // Angstrom^-1

    for (let i = 0; i <= steps; i++) {
      const s = (i / steps) * maxS;
      const q = 4 * Math.PI * s;
      const f0Primary = calculateAtomicFormFactor(primaryXRay.formFactorCoeffs, s);

      const row: any = {
        s: Number(s.toFixed(3)),
        q: Number(q.toFixed(2)),
        [primaryXRay.symbol]: Number(f0Primary.toFixed(3))
      };

      if (compareXRay) {
        const f0Compare = calculateAtomicFormFactor(compareXRay.formFactorCoeffs, s);
        row[compareXRay.symbol] = Number(f0Compare.toFixed(3));
      }

      data.push(row);
    }
    return data;
  }, [primaryXRay, compareXRay]);

  const handleCopyCoeffs = () => {
    const text = `Cromer-Mann Coefficients for ${primaryXRay.name} (${primaryXRay.symbol}, Z=${primaryXRay.z}):\n` +
      `a = [${primaryXRay.formFactorCoeffs.a.join(', ')}]\n` +
      `b = [${primaryXRay.formFactorCoeffs.b.join(', ')}]\n` +
      `c = ${primaryXRay.formFactorCoeffs.c}`;
    navigator.clipboard.writeText(text);
    setCopiedFormula(true);
    playSynthTone('chime');
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top control bar: axis mode, comparison element select */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">X-Axis Mode:</span>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => { setXAxisMode('s'); playSynthTone('tick'); }}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                xAxisMode === 's'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              s = sin(θ)/λ (Å⁻¹)
            </button>
            <button
              type="button"
              onClick={() => { setXAxisMode('q'); playSynthTone('tick'); }}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                xAxisMode === 'q'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              q = 4π sin(θ)/λ (Å⁻¹)
            </button>
          </div>
        </div>

        {onSelectCompareElement && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Overlay With:</span>
            <select
              value={compareZ || ''}
              onChange={(e) => onSelectCompareElement(e.target.value ? parseInt(e.target.value) : 0)}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono outline-none cursor-pointer focus:border-indigo-500"
            >
              <option value="">None (Single)</option>
              {availableElements
                .filter(el => el.number !== targetNumber)
                .map(el => (
                  <option key={el.number} value={el.number}>
                    {el.symbol} - {el.name} (Z={el.number})
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Interactive Form Factor Plot */}
      <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5 shadow-inner relative isolate">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Atom className="w-3.5 h-3.5 text-indigo-400" />
              Atomic Scattering Factor f₀({xAxisMode === 's' ? 's' : 'q'})
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono">
              f₀(0) = Z = {targetNumber} e⁻
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCoeffs}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-300 font-mono transition-colors cursor-pointer"
            title="Copy Cromer-Mann coefficients to clipboard"
          >
            {copiedFormula ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFormula ? 'Copied!' : 'Coeffs'}</span>
          </button>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey={xAxisMode === 's' ? 's' : 'q'}
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                unit={xAxisMode === 's' ? ' Å⁻¹' : ' Å⁻¹'}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                unit=" e⁻"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
                formatter={(value: any, name: any) => [`${value} e⁻`, `f₀(${name})`]}
                labelFormatter={(val) => `${xAxisMode === 's' ? 'sin(θ)/λ' : 'q'} = ${val} Å⁻¹`}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              <Line
                type="monotone"
                dataKey={primaryXRay.symbol}
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
                name={`${primaryXRay.symbol} (Z=${primaryXRay.z})`}
              />
              {compareXRay && (
                <Line
                  type="monotone"
                  dataKey={compareXRay.symbol}
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  name={`${compareXRay.symbol} (Z=${compareXRay.z})`}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] text-slate-500 font-mono mt-1 text-center">
          Computed via 9-parameter analytical Cromer-Mann / Waasmaier-Kirfel sum of 4 Gaussians + c.
        </p>
      </div>

      {/* Anomalous Dispersion & Characteristic Absorption Edges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Characteristic Emission Lines & Absorption Edges */}
        <div className="bg-[#0B0F19] p-4 rounded-xl border border-white/5 space-y-2.5 text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-pink-400" />
              Emission Lines & Edges
            </span>
            <span className="text-[9px] text-slate-500 font-mono">Energies in keV</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-900">
              <span className="text-[9px] text-slate-500 font-mono uppercase block">K-Alpha 1 (Kα₁)</span>
              <div className="font-mono font-bold text-sky-400">
                {primaryXRay.kAlpha1KeV ? `${primaryXRay.kAlpha1KeV} keV` : 'N/A'}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                {primaryXRay.kAlpha1Angstrom ? `λ = ${primaryXRay.kAlpha1Angstrom} Å` : ''}
              </div>
            </div>

            <div className="space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-900">
              <span className="text-[9px] text-slate-500 font-mono uppercase block">K-Beta 1 (Kβ₁)</span>
              <div className="font-mono font-bold text-violet-400">
                {primaryXRay.kBeta1KeV ? `${primaryXRay.kBeta1KeV} keV` : 'N/A'}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                {primaryXRay.kBeta1Angstrom ? `λ = ${primaryXRay.kBeta1Angstrom} Å` : ''}
              </div>
            </div>

            <div className="space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-900">
              <span className="text-[9px] text-slate-500 font-mono uppercase block">K-Absorption Edge</span>
              <div className="font-mono font-bold text-rose-400">
                {primaryXRay.kEdgeKeV ? `${primaryXRay.kEdgeKeV} keV` : 'N/A'}
              </div>
            </div>

            <div className="space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-900">
              <span className="text-[9px] text-slate-500 font-mono uppercase block">Recommended Kβ Filter</span>
              <div className="font-mono font-bold text-amber-300 truncate" title={primaryXRay.filterMaterial}>
                {primaryXRay.filterMaterial || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Anomalous Dispersion & Mass Attenuation */}
        <div className="bg-[#0B0F19] p-4 rounded-xl border border-white/5 space-y-2.5 text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              Anomalous Corrections (f', f'')
            </span>
            <span className="text-[9px] text-slate-500 font-mono">f = f₀ + f' + i f''</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-900">
              <span className="text-[9px] text-slate-500 font-mono uppercase block">Cu Kα (8.04 keV)</span>
              <div className="font-mono text-slate-200">
                f' = <span className="font-bold text-indigo-400">{primaryXRay.fPrimeCu}</span>
              </div>
              <div className="font-mono text-slate-200">
                f'' = <span className="font-bold text-pink-400">{primaryXRay.fDoublePrimeCu}</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono pt-1">
                μ/ρ = <span className="text-white font-bold">{primaryXRay.muRhoCuKa}</span> cm²/g
              </div>
            </div>

            <div className="space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-900">
              <span className="text-[9px] text-slate-500 font-mono uppercase block">Mo Kα (17.48 keV)</span>
              <div className="font-mono text-slate-200">
                f' = <span className="font-bold text-indigo-400">{primaryXRay.fPrimeMo}</span>
              </div>
              <div className="font-mono text-slate-200">
                f'' = <span className="font-bold text-pink-400">{primaryXRay.fDoublePrimeMo}</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono pt-1">
                μ/ρ = <span className="text-white font-bold">{primaryXRay.muRhoMoKa}</span> cm²/g
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
