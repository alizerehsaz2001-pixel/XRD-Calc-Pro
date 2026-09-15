import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Sliders, Activity, Info, Sparkles, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface DeconvolutionVisualizerProps {
  wavelength: number;
  kFactor: number;
  currentInstFwhm: number;
}

export const ScherrerDeconvolutionVisualizer: React.FC<DeconvolutionVisualizerProps> = ({
  wavelength,
  kFactor,
  currentInstFwhm
}) => {
  const [simSizeNm, setSimSizeNm] = useState<number>(25);
  const [simCenter2Theta, setSimCenter2Theta] = useState<number>(38.2);
  const [simInstFwhm, setSimInstFwhm] = useState<number>(currentInstFwhm || 0.10);
  const [simEta, setSimEta] = useState<number>(0.5);

  const profileData = useMemo(() => {
    const thetaRad = (simCenter2Theta / 2) * (Math.PI / 180);
    const cosTheta = Math.cos(thetaRad);

    // Theoretical pure sample broadening from Scherrer equation:
    // D = (K * lambda) / (beta_sample * cos(theta)) in nm => beta_sample_rad = (K * lambda) / (D * cosTheta * 10)
    const betaSampleRad = cosTheta > 0 && simSizeNm > 0 
      ? (kFactor * wavelength) / (simSizeNm * cosTheta * 10)
      : 0.005;
    const betaSampleDeg = betaSampleRad * (180 / Math.PI);
    const betaInstDeg = simInstFwhm;

    // Convolved total observed broadening (Pseudo-Voigt combination):
    // Approx: beta_obs = (beta_inst^2 + beta_sample^2)^0.5 for Gaussian component
    // + linear for Lorentzian
    const effEta = Math.max(0, Math.min(1, simEta));
    const betaGauss = Math.sqrt(Math.pow(betaInstDeg, 2) + Math.pow(betaSampleDeg, 2));
    const betaLorentz = betaInstDeg + betaSampleDeg;
    const betaObsDeg = (1 - effEta) * betaGauss + effEta * betaLorentz;

    // Generate synthesized profile curve across a window of +/- 3 * betaObsDeg
    const span = Math.max(0.6, betaObsDeg * 3.5);
    const step = span / 100;
    const points: Array<{
      twoTheta: number;
      observed: number;
      instrumental: number;
      samplePhysical: number;
    }> = [];

    // Helper: pseudo-Voigt profile evaluation centered at x0 with width FWHM w and shape eta
    const pvProfile = (x: number, x0: number, w: number, eta: number, amplitude: number) => {
      const dx = x - x0;
      const hwhm = w / 2;
      const lz = 1 / (1 + Math.pow(dx / hwhm, 2));
      const gs = Math.exp(-Math.LN2 * Math.pow(dx / hwhm, 2));
      return amplitude * ((1 - eta) * gs + eta * lz);
    };

    for (let x = simCenter2Theta - span; x <= simCenter2Theta + span; x += step) {
      const iObs = pvProfile(x, simCenter2Theta, betaObsDeg, effEta, 100);
      const iInst = pvProfile(x, simCenter2Theta, betaInstDeg, 0.4, 75);
      const iSample = pvProfile(x, simCenter2Theta, betaSampleDeg, effEta, 85);

      points.push({
        twoTheta: parseFloat(x.toFixed(4)),
        observed: parseFloat(iObs.toFixed(2)),
        instrumental: parseFloat(iInst.toFixed(2)),
        samplePhysical: parseFloat(iSample.toFixed(2))
      });
    }

    return {
      points,
      betaSampleDeg,
      betaInstDeg,
      betaObsDeg,
      ratioObsToInst: betaObsDeg / Math.max(0.0001, betaInstDeg)
    };
  }, [simSizeNm, simCenter2Theta, simInstFwhm, simEta, wavelength, kFactor]);

  // Regime assessment
  const regime = useMemo(() => {
    if (simSizeNm < 5) {
      return {
        label: 'Ultra-Fine Nanoscale (< 5 nm)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        desc: 'Broad diffraction peaks with severe overlap; surface relaxation effects prominent.'
      };
    } else if (simSizeNm <= 60) {
      return {
        label: 'Optimal Scherrer Sizing Regime (5 – 60 nm)',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        desc: 'Peak broadening significantly exceeds instrumental width; highest mathematical fidelity.'
      };
    } else if (simSizeNm <= 120) {
      return {
        label: 'Transitional Sub-Micron (60 – 120 nm)',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        desc: 'Peak width approaches instrumental resolution. Precise Caglioti calibration mandatory.'
      };
    } else {
      return {
        label: 'Instrumental Resolution Limit (> 120 nm)',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        desc: 'Broadening is dominated by optics. Simple Scherrer yields unreliable estimates.'
      };
    }
  }, [simSizeNm]);

  return (
    <div className="space-y-4">
      {/* Top Controller Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Single Peak Convolution & Deconvolution Simulator</h4>
              <p className="text-[10px] text-slate-400">Interactive decomposition of observed peak into instrumental resolution and finite-domain size broadening</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${regime.color}`}>
            {regime.label}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 xl:gap-4 pt-2">
          {/* Crystallite Size D */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }} className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-700/50 shadow-inner">
            <div className="flex justify-between items-center text-[10px] md:text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Crystallite Size</span>
              <span className="text-indigo-300 font-mono font-bold text-xs">{simSizeNm} nm</span>
            </div>
            <input
              type="range"
              min="2"
              max="150"
              step="1"
              value={simSizeNm}
              onChange={(e) => setSimSizeNm(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold">
              <span>2 nm</span>
              <span>75 nm</span>
              <span>150 nm</span>
            </div>
          </motion.div>

          {/* Instrumental FWHM */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-700/50 shadow-inner">
            <div className="flex justify-between items-center text-[10px] md:text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Inst. FWHM (β_inst)</span>
              <span className="text-amber-300 font-mono font-bold text-xs">{simInstFwhm.toFixed(3)}°</span>
            </div>
            <input
              type="range"
              min="0.04"
              max="0.40"
              step="0.01"
              value={simInstFwhm}
              onChange={(e) => setSimInstFwhm(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold">
              <span>0.04°</span>
              <span>0.20°</span>
              <span>0.40°</span>
            </div>
          </motion.div>

          {/* Bragg Peak Position 2theta */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.15 }} className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-700/50 shadow-inner">
            <div className="flex justify-between items-center text-[10px] md:text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Diffraction Angle</span>
              <span className="text-sky-300 font-mono font-bold text-xs">{simCenter2Theta.toFixed(1)}°</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="0.5"
              value={simCenter2Theta}
              onChange={(e) => setSimCenter2Theta(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold">
              <span>20°</span>
              <span>55°</span>
              <span>90°</span>
            </div>
          </motion.div>

          {/* Pseudo-Voigt Shape Factor eta */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.2 }} className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-700/50 shadow-inner">
            <div className="flex justify-between items-center text-[10px] md:text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Voigt Fraction (η)</span>
              <span className="text-emerald-300 font-mono font-bold text-xs">{simEta.toFixed(2)} ({Math.round(simEta * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={simEta}
              onChange={(e) => setSimEta(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono font-bold">
              <span>0 (Gauss)</span>
              <span>0.5</span>
              <span>1 (Lor)</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Profile Chart */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.1 }} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profileData.points} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="twoTheta" 
                stroke="#64748b" 
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => val.toFixed(2)}
                domain={['auto', 'auto']}
                unit="°"
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fontSize: 10 }} 
                domain={[0, 110]}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                formatter={(val: any, name: string) => [
                  `${parseFloat(val).toFixed(2)} a.u.`,
                  name === 'observed' ? 'Observed Profile I_obs' :
                  name === 'samplePhysical' ? 'Sample Size Profile I_sample' : 'Instrumental Response I_inst'
                ]}
                labelFormatter={(label) => `2θ = ${parseFloat(label).toFixed(3)}°`}
              />
              <Legend 
                verticalAlign="top" 
                height={32} 
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => (
                  <span className="text-slate-300 font-medium">
                    {value === 'observed' ? 'Observed Convolved (I_obs)' :
                     value === 'samplePhysical' ? `Pure Sample Size Broadening (D=${simSizeNm} nm)` :
                     `Instrumental Resolution (β_inst=${simInstFwhm.toFixed(3)}°)`}
                  </span>
                )}
              />
              <Line 
                type="monotone" 
                dataKey="observed" 
                stroke="#6366f1" 
                strokeWidth={2.5} 
                dot={false} 
                name="observed"
              />
              <Line 
                type="monotone" 
                dataKey="samplePhysical" 
                stroke="#10b981" 
                strokeWidth={1.8} 
                strokeDasharray="4 2"
                dot={false} 
                name="samplePhysical"
              />
              <Line 
                type="monotone" 
                dataKey="instrumental" 
                stroke="#f59e0b" 
                strokeWidth={1.8} 
                strokeDasharray="3 3"
                dot={false} 
                name="instrumental"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Diagnostic Breadth Readouts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.15 }} className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Observed Breadth (β_obs)</span>
            <span className="text-xs font-mono font-bold text-indigo-400">{profileData.betaObsDeg.toFixed(4)}° 2θ</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.2 }} className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Physical Sample Width (β_size)</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{profileData.betaSampleDeg.toFixed(4)}° 2θ</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.25 }} className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Instrumental Width (β_inst)</span>
            <span className="text-xs font-mono font-bold text-amber-400">{profileData.betaInstDeg.toFixed(4)}° 2θ</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.3 }} className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Broadening Ratio (β_obs / β_inst)</span>
            <span className={`text-xs font-mono font-bold ${profileData.ratioObsToInst > 2 ? 'text-emerald-400' : profileData.ratioObsToInst > 1.2 ? 'text-amber-400' : 'text-rose-400'}`}>
              {profileData.ratioObsToInst.toFixed(2)}× {profileData.ratioObsToInst < 1.2 ? '(Caution)' : '(Fidelity High)'}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
