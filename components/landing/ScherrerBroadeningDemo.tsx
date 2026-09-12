import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Microscope, Sliders, ArrowRight, Zap, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';

interface ScherrerBroadeningDemoProps {
  onLaunchModule: (moduleId: string) => void;
  isRTL?: boolean;
}

export const ScherrerBroadeningDemo: React.FC<ScherrerBroadeningDemoProps> = ({
  onLaunchModule,
  isRTL = false
}) => {
  const [sizeNm, setSizeNm] = useState<number>(20);
  const [strainPercent, setStrainPercent] = useState<number>(0.15);
  const [twoThetaCenter, setTwoThetaCenter] = useState<number>(38.4); // Typical (111) reflection of Si / Al / Au
  const [shapeFactorK, setShapeFactorK] = useState<number>(0.94); // spherical crystallites

  const wavelength = 1.5406; // Cu K-alpha in Angstroms

  // Calculations
  const stats = useMemo(() => {
    const thetaRad = (twoThetaCenter / 2) * (Math.PI / 180);
    const cosTheta = Math.cos(thetaRad);
    const tanTheta = Math.tan(thetaRad);

    // D in Angstroms
    const sizeAngstrom = sizeNm * 10;

    // Scherrer size broadening in radians: beta_size = K * lambda / (D * cos theta)
    const betaSizeRad = (shapeFactorK * wavelength) / (sizeAngstrom * cosTheta);

    // Strain broadening: beta_strain = 4 * epsilon * tan theta
    const strainFraction = strainPercent / 100;
    const betaStrainRad = 4 * strainFraction * tanTheta;

    // Total FWHM (quadratic convolution approx)
    const betaTotalRad = Math.sqrt(betaSizeRad * betaSizeRad + betaStrainRad * betaStrainRad);
    const betaTotalDeg = betaTotalRad * (180 / Math.PI);

    // Generate curve points for SVG [-2 deg to +2 deg around twoThetaCenter]
    const points: { x: number; y: number }[] = [];
    const span = 2.5; // degrees on either side
    const sigma = Math.max(0.04, betaTotalDeg / 2.355); // Gaussian sigma

    const numPoints = 80;
    for (let i = 0; i <= numPoints; i++) {
      const angle = twoThetaCenter - span + (i / numPoints) * (span * 2);
      const diff = angle - twoThetaCenter;
      // Pseudo-Voigt (70% Lorentzian, 30% Gaussian)
      const g = Math.exp(-0.5 * Math.pow(diff / sigma, 2));
      const gamma = betaTotalDeg / 2;
      const l = 1 / (1 + Math.pow(diff / gamma, 2));
      const intensity = 0.3 * g + 0.7 * l;
      
      points.push({
        x: (i / numPoints) * 100, // percentage across width
        y: 100 - intensity * 85 // svg y inverted
      });
    }

    const pathData = points.reduce((acc, pt, i) => {
      return `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }, '');

    return {
      betaTotalDeg,
      betaTotalRad,
      betaSizeRad,
      betaStrainRad,
      pathData
    };
  }, [sizeNm, strainPercent, twoThetaCenter, shapeFactorK]);

  return (
    <div className="bg-[#050B16] border border-violet-500/20 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-2">
            <Microscope className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-violet-300">
              {isRTL ? "شبیه‌ساز زنده اثر اندازه بلورک" : "Interactive Physics Sandbox"}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
            {isRTL ? "پهن‌شدگی پیک براساس معادله شرر" : "Scherrer Domain Sizing & Peak Broadening"}
          </h3>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl font-medium">
            {isRTL 
              ? "اسلایدر اندازه بلورک را تغییر دهید تا پهن‌شدگی فیزیکی پیک پراش ناشی از محدودیت بلورک‌ها و کرنش را در زمان واقعی مشاهده کنید."
              : "Adjust crystallite domain size and lattice strain to observe physical line broadening in real time."}
          </p>
        </div>

        <button
          onClick={() => onLaunchModule('scherrer')}
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-violet-600/30 cursor-pointer"
        >
          <span>Open Full Sizing Lab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Crystallite Size Slider */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200">
                {isRTL ? "اندازه بلورک (D)" : "Crystallite Domain Size (D)"}
              </label>
              <span className="font-mono text-sm font-black text-violet-400">
                {sizeNm} <span className="text-[10px] text-slate-400 font-normal">nm</span>
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={120}
              step={1}
              value={sizeNm}
              onChange={(e) => setSizeNm(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1.5">
              <span>3 nm (Ultrafine Nano)</span>
              <span>50 nm</span>
              <span>120 nm (Bulk-like)</span>
            </div>
          </div>

          {/* Microstrain Slider */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200">
                {isRTL ? "کرنش شبکه بلور (ε)" : "Lattice Microstrain (ε)"}
              </label>
              <span className="font-mono text-sm font-black text-cyan-400">
                {strainPercent.toFixed(2)}%
              </span>
            </div>
            <input
              type="range"
              min={0.0}
              max={0.8}
              step={0.02}
              value={strainPercent}
              onChange={(e) => setStrainPercent(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1.5">
              <span>0% (Strain-Free)</span>
              <span>0.4%</span>
              <span>0.8% (Severe Deformation)</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Presets:</span>
            <button
              onClick={() => { setSizeNm(8); setStrainPercent(0.35); }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold border border-white/5 transition-colors cursor-pointer"
            >
              Quantum Dot (8 nm)
            </button>
            <button
              onClick={() => { setSizeNm(35); setStrainPercent(0.08); }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold border border-white/5 transition-colors cursor-pointer"
            >
              Nanopowder (35 nm)
            </button>
            <button
              onClick={() => { setSizeNm(100); setStrainPercent(0.02); }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold border border-white/5 transition-colors cursor-pointer"
            >
              Coarse Grain (100 nm)
            </button>
          </div>
        </div>

        {/* Live Diffraction Peak Spectrum Preview */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-slate-300">
                Simulated 2θ Reflection (Cu Kα₁ = 1.5406 Å)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                Calculated FWHM (β)
              </span>
              <span className="text-xs font-mono font-black text-cyan-300">
                {stats.betaTotalDeg.toFixed(3)}° 2θ
              </span>
            </div>
          </div>

          {/* SVG Peak Visualization */}
          <div className="relative h-44 my-3 w-full bg-[#020611] rounded-xl border border-slate-900 overflow-hidden flex items-end p-2">
            {/* Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-15">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-slate-500" />
              ))}
            </div>

            {/* Peak Fill & Stroke */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="peakGlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path
                d={`${stats.pathData} L 100 100 L 0 100 Z`}
                fill="url(#peakGlowGrad)"
              />

              {/* Curve Line */}
              <path
                d={stats.pathData}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Center Reflection Line */}
              <line
                x1="50"
                y1="15"
                x2="50"
                y2="100"
                stroke="#22d3ee"
                strokeDasharray="2 2"
                strokeWidth="0.8"
                opacity="0.7"
              />
            </svg>

            {/* Center Peak Label */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 border border-cyan-500/30 text-[9px] font-mono text-cyan-300">
              Peak Center: {twoThetaCenter}° (111)
            </div>
          </div>

          {/* Theoretical Breakdown Bar */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-widest">
                Size Broadening
              </span>
              <span className="text-xs font-mono font-bold text-violet-300">
                {(stats.betaSizeRad * (180 / Math.PI)).toFixed(3)}°
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-widest">
                Strain Broadening
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {(stats.betaStrainRad * (180 / Math.PI)).toFixed(3)}°
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-widest">
                Scherrer Formula
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                β = Kλ / (D cosθ)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
