import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Orbit,
  Atom,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
  Compass,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { CrystalElement } from './types';
import { calculateOrbitalRadialPdf, getRadialNodes } from '../PeriodicTableModule';

interface QuantumOrbitalEnergyDiagramProps {
  element: CrystalElement;
}

interface SubshellState {
  label: string;
  n: number;
  l: number;
  capacity: number;
  electrons: number;
  unpaired: number;
  boxElectrons: Array<{ up: boolean; down: boolean }>;
}

export const QuantumOrbitalEnergyDiagram: React.FC<QuantumOrbitalEnergyDiagramProps> = ({ element }) => {
  const { t } = useTranslation();
  const [selectedOrbitalCurve, setSelectedOrbitalCurve] = useState<{ n: number; l: number; label: string }>({
    n: 1,
    l: 0,
    label: '1s'
  });

  // Calculate complete Aufbau orbital filling for atomic number Z
  const aufbauFilling = useMemo(() => {
    const sequence = [
      { label: '1s', n: 1, l: 0, cap: 2, boxes: 1 },
      { label: '2s', n: 2, l: 0, cap: 2, boxes: 1 },
      { label: '2p', n: 2, l: 1, cap: 6, boxes: 3 },
      { label: '3s', n: 3, l: 0, cap: 2, boxes: 1 },
      { label: '3p', n: 3, l: 1, cap: 6, boxes: 3 },
      { label: '4s', n: 4, l: 0, cap: 2, boxes: 1 },
      { label: '3d', n: 3, l: 2, cap: 10, boxes: 5 },
      { label: '4p', n: 4, l: 1, cap: 6, boxes: 3 },
      { label: '5s', n: 5, l: 0, cap: 2, boxes: 1 },
      { label: '4d', n: 4, l: 2, cap: 10, boxes: 5 },
      { label: '5p', n: 5, l: 1, cap: 6, boxes: 3 },
      { label: '6s', n: 6, l: 0, cap: 2, boxes: 1 },
      { label: '4f', n: 4, l: 3, cap: 14, boxes: 7 },
      { label: '5d', n: 5, l: 2, cap: 10, boxes: 5 },
      { label: '6p', n: 6, l: 1, cap: 6, boxes: 3 },
      { label: '7s', n: 7, l: 0, cap: 2, boxes: 1 }
    ];

    let remaining = element.number;
    const filled: SubshellState[] = [];
    let totalUnpaired = 0;

    // Handle standard anomalous electronic configurations (e.g. Cr 24: 3d5 4s1; Cu 29: 3d10 4s1)
    const isChromium = element.number === 24;
    const isCopper = element.number === 29;
    const isMolybdenum = element.number === 42;
    const isSilver = element.number === 47;
    const isGold = element.number === 79;

    for (const sub of sequence) {
      if (remaining <= 0) break;
      let eCount = Math.min(sub.cap, remaining);

      // Apply stability adjustments for half-filled / fully-filled d-shells
      if (sub.label === '4s' && (isChromium || isCopper)) eCount = 1;
      else if (sub.label === '3d' && isChromium) eCount = 5;
      else if (sub.label === '3d' && isCopper) eCount = 10;
      else if (sub.label === '5s' && (isMolybdenum || isSilver)) eCount = 1;
      else if (sub.label === '4d' && isMolybdenum) eCount = 5;
      else if (sub.label === '4d' && isSilver) eCount = 10;
      else if (sub.label === '6s' && isGold) eCount = 1;
      else if (sub.label === '5d' && isGold) eCount = 10;

      // Fill orbital boxes according to Hund's rule (single occupancy first with parallel spin)
      const boxStates: Array<{ up: boolean; down: boolean }> = Array.from({ length: sub.boxes }, () => ({
        up: false,
        down: false
      }));

      // Step 1: Up spins first
      for (let b = 0; b < sub.boxes; b++) {
        if (b < eCount) boxStates[b].up = true;
      }
      // Step 2: Down spins pair up
      let pairs = Math.max(0, eCount - sub.boxes);
      for (let b = 0; b < pairs; b++) {
        boxStates[b].down = true;
      }

      // Count unpaired electrons in this subshell
      const subUnpaired = boxStates.filter((b) => b.up && !b.down).length;
      totalUnpaired += subUnpaired;

      filled.push({
        label: sub.label,
        n: sub.n,
        l: sub.l,
        capacity: sub.cap,
        electrons: eCount,
        unpaired: subUnpaired,
        boxElectrons: boxStates
      });

      remaining -= eCount;
    }

    return {
      subshells: filled,
      totalUnpaired,
      isParamagnetic: totalUnpaired > 0,
      magneticMomentBohr: totalUnpaired > 0 ? Math.sqrt(totalUnpaired * (totalUnpaired + 2)) : 0
    };
  }, [element.number]);

  // Radial distribution function curve data for selected orbital
  const radialPdfData = useMemo(() => {
    const points: Array<{ r: number; probability: number }> = [];
    const maxR = selectedOrbitalCurve.n >= 4 ? 6.0 : selectedOrbitalCurve.n >= 3 ? 4.5 : 3.0;
    const steps = 70;
    const dr = maxR / steps;

    for (let i = 1; i <= steps; i++) {
      const r = Number((i * dr).toFixed(2));
      const pdf = calculateOrbitalRadialPdf(selectedOrbitalCurve.n, selectedOrbitalCurve.l, element.number, r);
      points.push({
        r,
        probability: Number(pdf.toFixed(4))
      });
    }
    return points;
  }, [selectedOrbitalCurve, element.number]);

  const radialNodes = useMemo(() => {
    return getRadialNodes(selectedOrbitalCurve.n, selectedOrbitalCurve.l, element.number);
  }, [selectedOrbitalCurve, element.number]);

  // Slater effective nuclear charge Z_eff
  const zEff = useMemo(() => {
    const Z = element.number;
    if (Z === 1) return 1.0;
    if (Z === 2) return 1.70;
    // Outer valence Slater approximation
    let sigma = 0;
    if (Z <= 10) sigma = 2 * 0.85 + (Z - 3) * 0.35;
    else if (Z <= 18) sigma = 10 * 1.0 + 8 * 0.85 + (Z - 11) * 0.35;
    else sigma = 18 * 1.0 + (Z - 19) * 0.35;
    return Number(Math.max(1.0, Z - sigma).toFixed(2));
  }, [element.number]);

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      {/* Header Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Magnetic State</span>
          <div className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
            <span className={`w-2.5 h-2.5 rounded-full ${aufbauFilling.isParamagnetic ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{aufbauFilling.isParamagnetic ? 'Paramagnetic' : 'Diamagnetic'}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {aufbauFilling.totalUnpaired} unpaired e⁻
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Spin-Only Moment (μ_so)</span>
          <div className="text-sm font-black font-mono text-cyan-400 mt-0.5">
            {aufbauFilling.magneticMomentBohr.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">μ_B</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            √(n(n+2)) Bohr magnetons
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Effective Charge (Z_eff)</span>
          <div className="text-sm font-black font-mono text-indigo-400 mt-0.5">
            {zEff}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Slater screened charge
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-white/5 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Ground State Config</span>
          <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5 truncate" title={element.electronConfig}>
            {element.electronConfig}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Aufbau principle
          </span>
        </div>
      </div>

      {/* Interactive Orbital Box Filling Diagram (Hund's Rule Spin Arrows) */}
      <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Atom className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Aufbau Energy Level Filling & Hund's Rule Spin Distribution
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Total Electrons: {element.number}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {aufbauFilling.subshells.map((sub) => {
            const isSelected = selectedOrbitalCurve.label === sub.label;
            return (
              <div
                key={sub.label}
                onClick={() => setSelectedOrbitalCurve({ n: sub.n, l: sub.l, label: sub.label })}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-900/60 border-white/5 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1.5 font-mono text-[10px]">
                  <span className={`font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>
                    {sub.label}<sup>{sub.electrons}</sup>
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {sub.electrons}/{sub.capacity}
                  </span>
                </div>

                {/* Orbital Boxes with Electron Spin Arrows */}
                <div className="flex gap-1">
                  {sub.boxElectrons.map((box, bIdx) => (
                    <div
                      key={bIdx}
                      className="w-5 h-7 bg-slate-950 border border-slate-700/80 rounded flex items-center justify-center gap-0.5 text-[10px]"
                    >
                      {box.up && <ArrowUp className="w-2.5 h-2.5 text-cyan-400 stroke-[3]" />}
                      {box.down && <ArrowDown className="w-2.5 h-2.5 text-rose-400 stroke-[3]" />}
                      {!box.up && !box.down && <span className="w-1 h-1 rounded-full bg-slate-800" />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Radial Probability Density Function Plot */}
      <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Orbit className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-white">
                Quantum Radial Probability Density: P_{selectedOrbitalCurve.label}(r)
              </span>
              <p className="text-[10px] text-slate-400">
                P(r) = 4πr² |R_{selectedOrbitalCurve.n},{selectedOrbitalCurve.l}(r)|² (Radial wave function in Ångströms)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {['1s', '2s', '2p', '3s', '3p', '3d', '4s'].map((orb) => (
              <button
                key={orb}
                onClick={() => {
                  const n = parseInt(orb[0], 10);
                  const l = orb[1] === 's' ? 0 : orb[1] === 'p' ? 1 : 2;
                  setSelectedOrbitalCurve({ n, l, label: orb });
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  selectedOrbitalCurve.label === orb
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {orb}
              </button>
            ))}
          </div>
        </div>

        <div className="h-48 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={radialPdfData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="r" label={{ value: 'Radial Distance r (Å)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Probability Density P(r)', angle: -90, position: 'insideLeft' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              {radialNodes.map((node) => (
                <ReferenceLine
                  key={node.label}
                  x={Number(node.r.toFixed(2))}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  label={{ value: node.label, fill: '#f43f5e', fontSize: 10 }}
                />
              ))}
              <Line type="monotone" dataKey="probability" name={`P_${selectedOrbitalCurve.label}(r)`} stroke="#06b6d4" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
