import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sliders, Gauge, Zap, RotateCcw, 
  Layers, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { playSynthTone } from '../../utils/sound';

interface CalibrationSettingsTabProps {
  zeroShift: number;
  setZeroShift: (val: number) => void;
  sampleDisplacement: number;
  setSampleDisplacement: (val: number) => void;
  goniometerRadius: number;
  setGoniometerRadius: (val: number) => void;
  defaultWavelength: number;
  setDefaultWavelength: (val: number) => void;
}

export const CalibrationSettingsTab: React.FC<CalibrationSettingsTabProps> = ({
  zeroShift,
  setZeroShift,
  sampleDisplacement,
  setSampleDisplacement,
  goniometerRadius,
  setGoniometerRadius,
  defaultWavelength,
  setDefaultWavelength,
}) => {
  const { t } = useTranslation();
  const [testAngle, setTestAngle] = useState<number>(38.5);

  const targetWavelengths = [
    { name: 'Cu K-α', kAlpha1: 1.540598, kAlpha2: 1.544426, kBeta: 1.392250, avg: 1.5406, desc: 'Copper anode (General Purpose)' },
    { name: 'Co K-α', kAlpha1: 1.789010, kAlpha2: 1.792900, kBeta: 1.620830, avg: 1.7902, desc: 'Cobalt anode (Iron-rich samples)' },
    { name: 'Mo K-α', kAlpha1: 0.709319, kAlpha2: 0.713609, kBeta: 0.632305, avg: 0.7107, desc: 'Molybdenum anode (High energy, short λ)' },
    { name: 'Fe K-α', kAlpha1: 1.936042, kAlpha2: 1.939980, kBeta: 1.756610, avg: 1.9373, desc: 'Iron anode (Magnetic materials)' },
    { name: 'Cr K-α', kAlpha1: 2.289760, kAlpha2: 2.293663, kBeta: 2.084920, avg: 2.2909, desc: 'Chromium anode (Large lattice spacing)' },
  ];

  // Standard Calibration Presets
  const calibrationStandards = [
    { 
      name: 'NIST SRM 660c (LaB₆)', 
      formula: 'LaB₆', 
      zeroShift: 0.002, 
      displacement: 0.00, 
      u: 0.0012, v: -0.0008, w: 0.0045,
      desc: 'Line position & line shape standard (Lattice a = 4.156826 Å)' 
    },
    { 
      name: 'NIST SRM 640f (Silicon)', 
      formula: 'Si', 
      zeroShift: 0.005, 
      displacement: 0.02, 
      u: 0.0025, v: -0.0012, w: 0.0062,
      desc: '2θ Calibration standard (Lattice a = 5.431195 Å)' 
    },
    { 
      name: 'NIST SRM 676a (Alumina)', 
      formula: 'α-Al₂O₃', 
      zeroShift: -0.001, 
      displacement: 0.01, 
      u: 0.0031, v: -0.0018, w: 0.0058,
      desc: 'Quantitative phase & RIR intensity calibration standard' 
    },
  ];

  // Calculate corrected 2θ for the test angle
  const thetaRad = (testAngle * Math.PI) / 360; // θ in radians
  const displacementShiftDeg = (2 * sampleDisplacement * Math.cos(thetaRad) * (180 / Math.PI)) / goniometerRadius;
  const corrected2Theta = testAngle - zeroShift - displacementShiftDeg;
  const correctedThetaRad = (corrected2Theta * Math.PI) / 360;
  const calculatedDSpacing = (defaultWavelength / (2 * Math.sin(Math.max(0.001, correctedThetaRad))));

  return (
    <motion.div 
      key="calibration"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Goniometer Geometric Calibration Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sliders className="w-6 h-6 text-indigo-500" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('Goniometer Geometric Calibration')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('Instrument zero error, sample displacement, and optical radius')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setZeroShift(0.0);
              setSampleDisplacement(0.0);
              setGoniometerRadius(180.0);
              localStorage.setItem('xrd_zero_shift', '0.0');
              localStorage.setItem('xrd_sample_displacement', '0.0');
              localStorage.setItem('xrd_goniometer_radius', '180.0');
              playSynthTone('switch');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('Reset to Zero')}
          </button>
        </div>

        {/* Live Goniometer Ray Path Visualizer SVG */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl mb-8 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-2 text-indigo-400 font-bold">
              <Activity className="w-3.5 h-3.5" /> Optical Path Vector Simulator (Bragg-Brentano Geometry)
            </span>
            <span>R = {goniometerRadius} mm</span>
          </div>

          <div className="w-full h-40 flex items-center justify-center relative">
            <svg viewBox="0 0 500 150" className="w-full h-full">
              {/* Goniometer Radius Circle Arc */}
              <path
                d="M 50,130 A 200,100 0 0,1 450,130"
                fill="none"
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              
              {/* Center Sample Stage */}
              <circle cx="250" cy="110" r="14" fill="#1e293b" stroke="#6366f1" strokeWidth="2" />
              <rect x="230" y={108 + sampleDisplacement * 10} width="40" height="4" rx="2" fill="#38bdf8" />
              
              {/* Incident Beam (Source to Sample) */}
              <line x1="80" y1="120" x2="250" y2="110" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Diffracted Beam (Sample to Detector) */}
              <line 
                x1="250" 
                y1="110" 
                x2={250 + 170 * Math.cos((180 - testAngle) * Math.PI / 180)} 
                y2={110 - 90 * Math.sin((testAngle) * Math.PI / 180)} 
                stroke="#10b981" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* Source Anode */}
              <g transform="translate(60, 110)">
                <rect x="-15" y="-12" width="30" height="24" rx="6" fill="#f43f5e" opacity="0.2" />
                <text x="0" y="4" fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">X-RAY</text>
              </g>

              {/* Detector */}
              <g transform={`translate(${250 + 170 * Math.cos((180 - testAngle) * Math.PI / 180)}, ${110 - 90 * Math.sin((testAngle) * Math.PI / 180)})`}>
                <circle cx="0" cy="0" r="12" fill="#10b981" opacity="0.3" />
                <circle cx="0" cy="0" r="5" fill="#10b981" />
                <text x="0" y="-15" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">DET (2θ={testAngle}°)</text>
              </g>

              {/* Sample Label */}
              <text x="250" y="142" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                Sample Stage {sampleDisplacement !== 0 ? `(s = ${sampleDisplacement > 0 ? '+' : ''}${sampleDisplacement}mm)` : ''}
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-[11px] font-mono">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px]">RAW OBSERVED 2θ</span>
              <span className="text-white font-bold">{testAngle.toFixed(4)}°</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px]">TOTAL ANGULAR CORRECTION</span>
              <span className="text-amber-400 font-bold">{(zeroShift + displacementShiftDeg) >= 0 ? '+' : ''}{(zeroShift + displacementShiftDeg).toFixed(5)}°</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px]">CORRECTED 2θ / d-SPACING</span>
              <span className="text-emerald-400 font-bold">{corrected2Theta.toFixed(4)}° ({calculatedDSpacing.toFixed(4)} Å)</span>
            </div>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Zero Shift */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t('Zero-Shift (Δ2θ)')}
              </label>
              <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                {zeroShift >= 0 ? `+${zeroShift.toFixed(3)}` : zeroShift.toFixed(3)}°
              </span>
            </div>
            <input
              type="range"
              min="-0.500"
              max="0.500"
              step="0.001"
              value={zeroShift}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setZeroShift(val);
                localStorage.setItem('xrd_zero_shift', val.toString());
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
              Systematic instrument angle offset subtracted from every peak.
            </p>
          </div>

          {/* Sample Displacement */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t('Displacement (s)')}
              </label>
              <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                {sampleDisplacement >= 0 ? `+${sampleDisplacement.toFixed(3)}` : sampleDisplacement.toFixed(3)} mm
              </span>
            </div>
            <input
              type="range"
              min="-1.000"
              max="1.000"
              step="0.005"
              value={sampleDisplacement}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSampleDisplacement(val);
                localStorage.setItem('xrd_sample_displacement', val.toString());
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
              Specimen height deviation from goniometer axis (-2s/R·cosθ).
            </p>
          </div>

          {/* Goniometer Radius */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t('Goniometer Radius (R)')}
              </label>
              <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                {goniometerRadius.toFixed(1)} mm
              </span>
            </div>
            <input
              type="range"
              min="100.0"
              max="350.0"
              step="1.0"
              value={goniometerRadius}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setGoniometerRadius(val);
                localStorage.setItem('xrd_goniometer_radius', val.toString());
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
              Center-to-detector distance (standard benchtop 180mm / 240mm).
            </p>
          </div>
        </div>

        {/* Live Angle Test Interactive Slider */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">
              Interactive Test 2θ Angle: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">{testAngle.toFixed(2)}°</span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Drag to verify how the correction formula behaves across the entire $10^\circ \le 2\theta \le 120^\circ$ diffraction scan.
            </span>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="range"
              min="10.0"
              max="120.0"
              step="0.1"
              value={testAngle}
              onChange={(e) => setTestAngle(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Standard Reference Calibration Materials */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Layers className="w-6 h-6 text-indigo-500" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('Standard Reference Materials (SRM) Calibration')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Load certified NIST standard calibration profiles into the goniometer
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {calibrationStandards.map((std, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {std.formula}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">NIST Certified</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {std.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  {std.desc}
                </p>
                <div className="p-2 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 space-y-0.5 mb-3">
                  <div className="flex justify-between">
                    <span>Δ2θ Shift:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{std.zeroShift > 0 ? `+${std.zeroShift}` : std.zeroShift}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Displacement:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{std.displacement} mm</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setZeroShift(std.zeroShift);
                  setSampleDisplacement(std.displacement);
                  localStorage.setItem('xrd_zero_shift', std.zeroShift.toString());
                  localStorage.setItem('xrd_sample_displacement', std.displacement.toString());
                  playSynthTone('success');
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Apply {std.formula} Calibration
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Radiation Source & Anode Targets */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Gauge className="w-6 h-6 text-indigo-500" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('X-Ray Anode Tube & Target Wavelengths')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select standard laboratory radiation emission doublets (Kα₁, Kα₂, Kβ)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-6">
          {targetWavelengths.map((tw) => {
            const isSelected = Math.abs(defaultWavelength - tw.avg) < 0.0005;
            return (
              <button
                key={tw.name}
                onClick={() => {
                  setDefaultWavelength(tw.avg);
                  localStorage.setItem('xrd_default_wavelength', tw.avg.toString());
                  playSynthTone('switch');
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-400 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{tw.name}</span>
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {tw.avg.toFixed(4)} Å
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">{tw.desc}</p>
                <div className="text-[9px] font-mono text-slate-600 dark:text-slate-400 space-y-0.5 border-t border-slate-200 dark:border-slate-800 pt-1.5">
                  <div className="flex justify-between">
                    <span>Kα₁:</span> <span>{tw.kAlpha1.toFixed(6)} Å</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kα₂:</span> <span>{tw.kAlpha2.toFixed(6)} Å</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kβ:</span> <span>{tw.kBeta.toFixed(6)} Å</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Wavelength Input */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="text-xs font-bold text-slate-900 dark:text-slate-200 block mb-0.5">
              {t('Custom / Synchrotron Wavelength')}
            </label>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              For monochromatic beamlines or non-standard X-ray target tubes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.0001"
              value={defaultWavelength}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 1.5406;
                setDefaultWavelength(val);
                localStorage.setItem('xrd_default_wavelength', val.toString());
              }}
              className="w-32 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
            />
            <span className="text-xs font-bold font-mono text-slate-500">Å</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
