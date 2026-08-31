import React, { useState } from 'react';
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
import { Activity, Sliders, Eye, Maximize2, Zap, Ruler, TrendingUp, Info } from 'lucide-react';
import { DoubleVoigtResult } from '../../types';
import { useSettings, convertLength } from '../SettingsContext';

interface DoubleVoigtVoigtProfileSimulatorProps {
  result: DoubleVoigtResult;
  selectedPeakIdx: number;
  onSelectPeak: (index: number) => void;
  interactiveEta: number;
  onChangeInteractiveEta: (eta: number) => void;
}

export const DoubleVoigtVoigtProfileSimulator: React.FC<DoubleVoigtVoigtProfileSimulatorProps> = ({
  result,
  selectedPeakIdx,
  onSelectPeak,
  interactiveEta,
  onChangeInteractiveEta
}) => {
  const { lengthUnit = 'Å' } = useSettings();
  const [scaleMode, setScaleMode] = useState<'linear' | 'log'>('linear');
  const [showInstrumental, setShowInstrumental] = useState<boolean>(true);
  const [showResiduals, setShowResiduals] = useState<boolean>(false);

  const currentPeak = result?.points?.[selectedPeakIdx] || result?.points?.[0];

  // Generate deconvoluted curve simulation for selected peak
  const profileSimulationData = React.useMemo(() => {
    if (!currentPeak) return null;

    const center = currentPeak.twoTheta;
    const fwhmObs = currentPeak.fwhmObs || 0.40;
    const etaObs = currentPeak.etaObs ?? 0.50;
    const betaCSample = currentPeak.betaCSample || 0.003;
    const betaGSample = currentPeak.betaGSample || 0.002;

    const halfWidth = fwhmObs * 3.5;
    const numPoints = 120;
    const gammaObs = fwhmObs / 2;
    const sigmaObs = fwhmObs / (2 * Math.sqrt(2 * Math.LN2));

    const gammaSample = (betaCSample * 180) / Math.PI;
    const sigmaSample = (betaGSample * 180) / Math.PI / Math.sqrt(2 * Math.PI);

    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const x = (center - halfWidth) + (i / (numPoints - 1)) * (2 * halfWidth);
      const dx = x - center;

      // Observed Pseudo-Voigt
      const cauchyObs = (1 / Math.PI) * (gammaObs / (dx * dx + gammaObs * gammaObs)) * (Math.PI * gammaObs);
      const gaussianObs = Math.exp(-(dx * dx) / (2 * sigmaObs * sigmaObs));
      const voigtObs = etaObs * cauchyObs + (1 - etaObs) * gaussianObs;

      // Specimen Cauchy (Size) and Gaussian (Strain)
      const cauchySpecimen = (1 / Math.PI) * (gammaSample / (dx * dx + gammaSample * gammaSample)) * (Math.PI * gammaSample);
      const gaussianSpecimen = Math.exp(-(dx * dx) / (2 * Math.max(1e-4, sigmaSample * sigmaSample)));

      // Instrumental Profile g(2theta)
      const instFwhmDeg = Math.sqrt(Math.max(1e-4, fwhmObs * fwhmObs - (gammaSample * 2) * (gammaSample * 2)));
      const sigmaInst = instFwhmDeg / (2 * Math.sqrt(2 * Math.LN2));
      const instProfile = 0.7 * Math.exp(-(dx * dx) / (2 * Math.max(1e-4, sigmaInst * sigmaInst)));

      const valObs = scaleMode === 'log' ? Math.max(1e-3, voigtObs) : voigtObs;
      const valCauchy = scaleMode === 'log' ? Math.max(1e-3, etaObs * cauchyObs) : etaObs * cauchyObs;
      const valGaussian = scaleMode === 'log' ? Math.max(1e-3, (1 - etaObs) * gaussianObs) : (1 - etaObs) * gaussianObs;
      const valInst = scaleMode === 'log' ? Math.max(1e-3, instProfile) : instProfile;
      const residual = voigtObs - (etaObs * cauchyObs + (1 - etaObs) * gaussianObs);

      points.push({
        twoTheta: parseFloat(x.toFixed(3)),
        voigtObs: parseFloat(valObs.toFixed(4)),
        cauchySize: parseFloat(valCauchy.toFixed(4)),
        gaussianStrain: parseFloat(valGaussian.toFixed(4)),
        instProfile: parseFloat(valInst.toFixed(4)),
        residual: parseFloat((residual * 100).toFixed(4))
      });
    }

    return points;
  }, [currentPeak, scaleMode]);

  return (
    <div className="space-y-4 bg-[#030710]/70 p-4 sm:p-6 rounded-2xl border border-cyan-500/20 relative shadow-inner">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4 font-mono">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Voigt Profile Deconvolution & Tail Inspection
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Reflection Selector */}
          <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-xl border border-white/10">
            <span className="text-slate-400">Peak:</span>
            <select
              value={selectedPeakIdx}
              onChange={(e) => onSelectPeak(parseInt(e.target.value))}
              className="bg-transparent text-cyan-300 font-bold outline-none cursor-pointer"
            >
              {result.points.map((p, idx) => (
                <option key={idx} value={idx} className="bg-slate-900 text-white">
                  {p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`} (2θ = {p.twoTheta.toFixed(2)}°)
                </option>
              ))}
            </select>
          </div>

          {/* Linear / Log Toggle */}
          <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setScaleMode('linear')}
              className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                scaleMode === 'linear' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Linear
            </button>
            <button
              onClick={() => setScaleMode('log')}
              className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                scaleMode === 'log' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Log Tails
            </button>
          </div>

          {/* Instrumental Overlay Toggle */}
          <button
            onClick={() => setShowInstrumental(!showInstrumental)}
            className={`px-2.5 py-1 rounded-xl border transition-colors cursor-pointer flex items-center gap-1 ${
              showInstrumental ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-black/40 border-white/10 text-slate-400'
            }`}
          >
            <Eye className="w-3 h-3" /> Inst g(2θ)
          </button>
        </div>
      </div>

      {/* Selected Peak Telemetry */}
      {currentPeak && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="bg-black/50 p-2.5 rounded-xl border border-cyan-500/20">
            <div className="text-[10px] text-slate-400 uppercase">Centroid 2θ / hkl</div>
            <div className="text-sm font-bold text-white">
              {currentPeak.twoTheta.toFixed(2)}° {currentPeak.hkl ? `(${currentPeak.hkl.join('')})` : ''}
            </div>
            <div className="text-[10px] text-slate-400">d = {currentPeak.dSpacingA?.toFixed(4)} Å</div>
          </div>

          <div className="bg-black/50 p-2.5 rounded-xl border border-indigo-500/20">
            <div className="text-[10px] text-slate-400 uppercase">Cauchy Breadth β_C*</div>
            <div className="text-sm font-bold text-indigo-300">
              {currentPeak.betaCStar.toFixed(5)} nm⁻¹
            </div>
            <div className="text-[10px] text-slate-400">Single D_V = {currentPeak.singleDvNm.toFixed(1)} nm</div>
          </div>

          <div className="bg-black/50 p-2.5 rounded-xl border border-purple-500/20">
            <div className="text-[10px] text-slate-400 uppercase">Gaussian Breadth (β_G*)²</div>
            <div className="text-sm font-bold text-purple-300">
              {currentPeak.betaGStarSq.toFixed(5)} nm⁻²
            </div>
            <div className="text-[10px] text-slate-400">Single e_app = {currentPeak.singleStrain ? `${(currentPeak.singleStrain * 100).toFixed(3)}%` : '—'}</div>
          </div>

          <div className="bg-black/50 p-2.5 rounded-xl border border-emerald-500/20">
            <div className="text-[10px] text-slate-400 uppercase">Lorentzian Fraction η</div>
            <div className="text-sm font-bold text-emerald-300">
              {(currentPeak.etaObs ?? 0.50).toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">FWHM = {currentPeak.fwhmObs?.toFixed(3)}°</div>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-72 sm:h-96 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={profileSimulationData || []} margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis
              dataKey="twoTheta"
              type="number"
              domain={['auto', 'auto']}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              label={{
                value: 'Diffraction Angle 2θ [°]',
                position: 'insideBottom',
                offset: -15,
                fill: '#06b6d4',
                fontSize: 12,
                fontFamily: 'monospace'
              }}
            />
            <YAxis
              scale={scaleMode === 'log' ? 'log' : 'auto'}
              domain={scaleMode === 'log' ? [1e-3, 1.2] : [0, 'auto']}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              label={{
                value: scaleMode === 'log' ? 'Log Normalized Intensity [a.u.]' : 'Normalized Intensity [a.u.]',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                fill: '#06b6d4',
                fontSize: 11,
                fontFamily: 'monospace'
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#050C17]/95 border border-cyan-500/40 p-3.5 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1.5 min-w-[200px]">
                      <div className="text-cyan-400 font-bold border-b border-white/10 pb-1">
                        2θ = {d.twoTheta}°
                      </div>
                      <div className="flex justify-between">
                        <span>Total Voigt V(2θ):</span>
                        <span className="text-white font-bold">{d.voigtObs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-300">Cauchy (Size):</span>
                        <span className="text-white font-bold">{d.cauchySize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Gaussian (Strain):</span>
                        <span className="text-white font-bold">{d.gaussianStrain}</span>
                      </div>
                      {showInstrumental && (
                        <div className="flex justify-between">
                          <span className="text-amber-300">Instrument g(2θ):</span>
                          <span className="text-white font-bold">{d.instProfile}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

            {/* Peak Center Reference Line */}
            {currentPeak && (
              <ReferenceLine
                x={currentPeak.twoTheta}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                label={{ value: `2θ₀ = ${currentPeak.twoTheta.toFixed(2)}°`, fill: '#06b6d4', fontSize: 10, position: 'top' }}
              />
            )}

            <Line
              type="monotone"
              dataKey="voigtObs"
              name="Observed Profile V(2θ)"
              stroke="#ffffff"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cauchySize"
              name="Cauchy (Lorentzian) Size Kernel"
              stroke="#818cf8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="gaussianStrain"
              name="Gaussian Microstrain Kernel"
              stroke="#c084fc"
              strokeWidth={2}
              strokeDasharray="2 2"
              dot={false}
            />

            {showInstrumental && (
              <Line
                type="monotone"
                dataKey="instProfile"
                name="Instrumental Function g(2θ)"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="5 2"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Profile Tail Explainer Banner */}
      <div className="bg-black/50 p-3.5 rounded-xl border border-cyan-500/20 text-xs font-sans text-slate-300 space-y-1">
        <div className="flex items-center gap-2 text-cyan-300 font-bold font-mono">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Physical Significance of Profile Tails in Double-Voigt Analysis</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Switch to <span className="font-mono text-cyan-300 font-semibold">Log Tails</span> mode to observe the slow <span className="font-mono text-indigo-300">1 / (Δ2θ)²</span> power-law decay of the Cauchy size component compared to the exponential <span className="font-mono text-purple-300">exp(-Δ2θ²)</span> Gaussian strain decay. Accurate background subtraction is critical for Langford deconvolution to prevent truncation of Lorentzian wings.
        </p>
      </div>
    </div>
  );
};
