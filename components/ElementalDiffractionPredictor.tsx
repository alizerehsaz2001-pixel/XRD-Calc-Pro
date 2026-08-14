import React, { useState, useMemo } from 'react';
import { Play, Copy, Check, Sparkles, Layers, Sliders, Info, Zap } from 'lucide-react';
import { playSynthTone } from '../utils/sound';

interface ElementalDiffractionPredictorProps {
  element: {
    number: number;
    symbol: string;
    name: string;
    crystalStructure: string;
    spaceGroup?: string;
    a: number;
    b?: number;
    c?: number;
  };
  onLoadPeaks?: (peaksStr: string, hklStr: string, matName: string) => void;
}

interface PredictedPeak {
  h: number;
  k: number;
  l: number;
  dSpacing: number; // Angstrom
  twoTheta: number; // Degrees
  relativeIntensity: number; // 0 to 100%
  multiplicity: number;
}

export const ElementalDiffractionPredictor: React.FC<ElementalDiffractionPredictorProps> = ({
  element,
  onLoadPeaks
}) => {
  const [radiation, setRadiation] = useState<'CuKa1' | 'MoKa1' | 'CoKa1' | 'CrKa1'>('CuKa1');
  const [copied, setCopied] = useState(false);

  const wavelength = useMemo(() => {
    switch (radiation) {
      case 'CuKa1': return 1.54056;
      case 'MoKa1': return 0.70930;
      case 'CoKa1': return 1.78897;
      case 'CrKa1': return 2.28970;
      default: return 1.54056;
    }
  }, [radiation]);

  // Calculate Bragg peaks based on crystal symmetry and selection rules
  const predictedPeaks = useMemo<PredictedPeak[]>(() => {
    const struct = element.crystalStructure;
    const a = element.a || 3.615;
    const b = element.b || a;
    const c = element.c || (struct === 'HCP' ? a * 1.633 : a);
    const peaks: PredictedPeak[] = [];

    // Enumerate (h, k, l) reflections up to max index 4
    for (let h = 0; h <= 4; h++) {
      for (let k = 0; k <= 4; k++) {
        for (let l = 0; l <= 4; l++) {
          if (h === 0 && k === 0 && l === 0) continue;
          if (h < k || k < l) continue; // Unique hkl representatives

          // Apply Systematic Absence Selection Rules for Bravais Lattice types
          let allowed = false;
          let structFactor = 1.0;
          let multiplicity = 6;

          if (struct === 'FCC') {
            // Unmixed parity: all even or all odd
            const allEven = h % 2 === 0 && k % 2 === 0 && l % 2 === 0;
            const allOdd = h % 2 !== 0 && k % 2 !== 0 && l % 2 !== 0;
            if (allEven || allOdd) {
              allowed = true;
              structFactor = 16;
            }
          } else if (struct === 'BCC') {
            // h + k + l = even
            if ((h + k + l) % 2 === 0) {
              allowed = true;
              structFactor = 4;
            }
          } else if (struct === 'Diamond') {
            // FCC rules plus special conditions
            const allOdd = h % 2 !== 0 && k % 2 !== 0 && l % 2 !== 0;
            const allEvenAndSum4n = (h % 2 === 0 && k % 2 === 0 && l % 2 === 0) && ((h + k + l) % 4 === 0);
            if (allOdd || allEvenAndSum4n) {
              allowed = true;
              structFactor = allOdd ? 32 : 64;
            }
          } else if (struct === 'HCP' || struct === 'Hexagonal') {
            // Hexagonal selection rules
            if (h === 0 && k === 0 && l % 2 !== 0) {
              allowed = false;
            } else if (h - k % 3 === 0 && l % 2 !== 0) {
              allowed = false;
            } else {
              allowed = true;
              structFactor = 3;
            }
          } else {
            // Generic cubic / simple allowed
            allowed = true;
            structFactor = 1;
          }

          if (!allowed) continue;

          // Compute d-spacing (Angstrom)
          let invD2 = 0;
          if (struct === 'HCP' || struct === 'Hexagonal') {
            invD2 = (4 / 3) * (h * h + h * k + k * k) / (a * a) + (l * l) / (c * c);
          } else if (struct === 'Tetragonal') {
            invD2 = (h * h + k * k) / (a * a) + (l * l) / (c * c);
          } else if (struct === 'Orthorhombic') {
            invD2 = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
          } else {
            // Cubic systems
            invD2 = (h * h + k * k + l * l) / (a * a);
          }

          if (invD2 <= 0) continue;
          const d = 1 / Math.sqrt(invD2);

          // Bragg's Law: sin(theta) = lambda / (2*d)
          const sinTheta = wavelength / (2 * d);
          if (sinTheta > 0.999) continue; // Reflection beyond 2theta = 180° limit

          const thetaRad = Math.asin(sinTheta);
          const twoThetaDeg = (thetaRad * 2 * 180) / Math.PI;

          // Lorentz-Polarization Factor (LP) for unpolarized laboratory beam: LP = (1 + cos^2(2theta)) / (sin^2(theta) * cos(theta))
          const cos2T = Math.cos(2 * thetaRad);
          const sinT = Math.sin(thetaRad);
          const cosT = Math.cos(thetaRad);
          const lpFactor = (1 + cos2T * cos2T) / (sinT * sinT * cosT);

          // Multiplicity approximation
          if (h === k && k === l) multiplicity = 8;
          else if (h === k || k === l || h === l) multiplicity = 12;
          else multiplicity = 24;

          const rawIntensity = structFactor * multiplicity * Math.max(0.1, lpFactor);

          peaks.push({
            h,
            k,
            l,
            dSpacing: Number(d.toFixed(4)),
            twoTheta: Number(twoThetaDeg.toFixed(3)),
            relativeIntensity: rawIntensity,
            multiplicity
          });
        }
      }
    }

    // Sort by 2theta
    peaks.sort((a, b) => a.twoTheta - b.twoTheta);

    // Normalize intensity to 100% max
    const maxI = Math.max(...peaks.map(p => p.relativeIntensity), 1);
    return peaks.map(p => ({
      ...p,
      relativeIntensity: Number(((p.relativeIntensity / maxI) * 100).toFixed(1))
    })).filter(p => p.relativeIntensity >= 1.0);
  }, [element, wavelength]);

  const handleCopyPeaks = () => {
    const str = predictedPeaks.map(p => `${p.twoTheta}° (${p.h}${p.k}${p.l}) -> I=${p.relativeIntensity}%`).join('\n');
    navigator.clipboard.writeText(str);
    setCopied(true);
    playSynthTone('chime');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadDiffractometer = () => {
    if (!onLoadPeaks) return;
    const peaksStr = predictedPeaks.slice(0, 10).map(p => p.twoTheta.toFixed(2)).join(', ');
    const hklStr = predictedPeaks.slice(0, 10).map(p => `(${p.h}${p.k}${p.l})`).join(', ');
    const name = `${element.name} (${element.symbol} ${element.crystalStructure})`;
    onLoadPeaks(peaksStr, hklStr, name);
    playSynthTone('action');
  };

  return (
    <div className="space-y-3 bg-[#0B0F19] p-4 rounded-2xl border border-white/5 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <span className="text-[11px] font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Theoretical Powder XRD Peaks
          </span>
          <span className="text-[9px] text-slate-400 font-mono">
            {element.symbol} ({element.crystalStructure}) • a = {element.a} Å
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={radiation}
            onChange={(e) => {
              setRadiation(e.target.value as any);
              playSynthTone('tick');
            }}
            className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-mono outline-none cursor-pointer focus:border-indigo-500"
          >
            <option value="CuKa1">Cu Kα₁ (1.54056 Å)</option>
            <option value="MoKa1">Mo Kα₁ (0.70930 Å)</option>
            <option value="CoKa1">Co Kα₁ (1.78897 Å)</option>
            <option value="CrKa1">Cr Kα₁ (2.28970 Å)</option>
          </select>

          {onLoadPeaks && (
            <button
              type="button"
              onClick={handleLoadDiffractometer}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              Load into Spectrometer
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyPeaks}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-[10px] rounded-lg border border-slate-800 transition-colors cursor-pointer"
            title="Copy peak table"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Peak Table */}
      {predictedPeaks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900 uppercase text-[9px] tracking-wider">
                <th className="py-1.5 px-2">h k l</th>
                <th className="py-1.5 px-2">2θ (deg)</th>
                <th className="py-1.5 px-2">d (Å)</th>
                <th className="py-1.5 px-2">I / I₀ (%)</th>
                <th className="py-1.5 px-2 text-right">Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {predictedPeaks.slice(0, 8).map((peak, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-1 px-2 font-bold text-sky-400">
                    ({peak.h} {peak.k} {peak.l})
                  </td>
                  <td className="py-1 px-2 font-bold text-slate-200">
                    {peak.twoTheta.toFixed(2)}°
                  </td>
                  <td className="py-1 px-2 text-slate-400">
                    {peak.dSpacing.toFixed(3)}
                  </td>
                  <td className="py-1 px-2 font-bold text-indigo-400">
                    {peak.relativeIntensity}%
                  </td>
                  <td className="py-1 px-2 text-right">
                    <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden inline-block align-middle">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full"
                        style={{ width: `${peak.relativeIntensity}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-slate-500 font-mono">
          No diffraction reflections detected within the 2θ scanning range for this radiation wavelength.
        </div>
      )}
    </div>
  );
};
