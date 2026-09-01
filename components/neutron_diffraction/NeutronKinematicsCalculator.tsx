import React, { useState } from 'react';
import { calculateNeutronKinematics, NeutronKinematics } from '../../utils/neutronDiffractionPhysics';
import { Zap, Activity, Gauge, Clock, Thermometer, Compass, ArrowRight, ShieldAlert } from 'lucide-react';

interface NeutronKinematicsCalculatorProps {
  wavelength: number;
  onWavelengthChange: (wl: number) => void;
  lengthUnit: string;
}

export const NeutronKinematicsCalculator: React.FC<NeutronKinematicsCalculatorProps> = ({
  wavelength,
  onWavelengthChange,
  lengthUnit
}) => {
  const [flightPathLength, setFlightPathLength] = useState<number>(20.0); // meters
  const kinematics: NeutronKinematics = calculateNeutronKinematics(wavelength);

  const setByEnergy = (e_meV: number) => {
    if (e_meV > 0) {
      const newLambda = Math.sqrt(81.8048 / e_meV);
      onWavelengthChange(parseFloat(newLambda.toFixed(4)));
    }
  };

  const setByVelocity = (v_ms: number) => {
    if (v_ms > 0) {
      const newLambda = 3956.0336 / v_ms;
      onWavelengthChange(parseFloat(newLambda.toFixed(4)));
    }
  };

  const setByTemperature = (t_k: number) => {
    if (t_k > 0) {
      const e_meV = t_k / 11.604518;
      const newLambda = Math.sqrt(81.8048 / e_meV);
      onWavelengthChange(parseFloat(newLambda.toFixed(4)));
    }
  };

  // TOF for given flight path
  const totalTOF_ms = (flightPathLength * kinematics.tof_per_meter_us) / 1000;

  // Preset beamline wavelengths
  const beamlinePresets = [
    { label: 'Thermal Powder (D2B/POWGEN)', lambda: 1.54, energy: 34.5, regime: 'Thermal' },
    { label: 'Standard Thermal (2200 m/s)', lambda: 1.798, energy: 25.3, regime: 'Thermal' },
    { label: 'Cold SANS / Reflectometry', lambda: 5.0, energy: 3.27, regime: 'Cold' },
    { label: 'Ultra-Cold Neutrons (UCN)', lambda: 50.0, energy: 0.033, regime: 'Ultra-Cold' },
    { label: 'Epithermal / High Energy', lambda: 0.5, energy: 327.2, regime: 'Epithermal' }
  ];

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      {/* Header & Sub-Bar */}
      <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
              de Broglie Kinematics & Beamline Analytics
            </span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
              kinematics.regime === 'Cold' ? 'bg-cyan-500/20 text-cyan-300' :
              kinematics.regime === 'Thermal' ? 'bg-emerald-500/20 text-emerald-300' :
              kinematics.regime === 'Ultra-Cold' ? 'bg-blue-500/20 text-blue-300' :
              'bg-amber-500/20 text-amber-300'
            }`}>
              {kinematics.regime} Regime
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exact relativistic and non-relativistic kinematic conversion for thermal, cold, and epithermal neutron beamlines.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#070D18] p-1.5 rounded-xl border border-white/10 shrink-0">
          {beamlinePresets.map(p => (
            <button
              key={p.label}
              onClick={() => onWavelengthChange(p.lambda)}
              className={`px-2 py-1 rounded-lg text-[9px] font-black font-mono transition-all ${
                Math.abs(wavelength - p.lambda) < 0.05
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {p.lambda} Å ({p.regime})
            </button>
          ))}
        </div>
      </div>

      {/* Main Kinematics Multi-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Wavelength λ */}
        <div className="bg-[#0B1528] p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Zap className="w-3.5 h-3.5" /> Wavelength (λ)
            </span>
            <span className="text-[10px] font-mono text-slate-500">de Broglie</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="100"
                value={wavelength}
                onChange={(e) => onWavelengthChange(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-lg font-mono font-black text-blue-400 focus:outline-none focus:border-blue-500/40"
              />
              <span className="text-sm font-bold text-slate-500 font-mono">Å</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="10.0"
              step="0.05"
              value={wavelength}
              onChange={(e) => onWavelengthChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Energy E (meV) */}
        <div className="bg-[#0B1528] p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Activity className="w-3.5 h-3.5" /> Kinetic Energy (E)
            </span>
            <span className="text-[10px] font-mono text-slate-500">81.805 / λ²</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                step="0.1"
                min="0.001"
                value={parseFloat(kinematics.energy_meV.toFixed(3))}
                onChange={(e) => setByEnergy(parseFloat(e.target.value))}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-lg font-mono font-black text-emerald-400 focus:outline-none focus:border-emerald-500/40"
              />
              <span className="text-sm font-bold text-slate-500 font-mono">meV</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>{(kinematics.energy_J * 1e21).toFixed(2)} × 10⁻²¹ J</span>
              <span>{(kinematics.energy_meV / 1000).toFixed(4)} eV</span>
            </div>
          </div>
        </div>

        {/* Velocity v (m/s) */}
        <div className="bg-[#0B1528] p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Gauge className="w-3.5 h-3.5" /> Velocity (v)
            </span>
            <span className="text-[10px] font-mono text-slate-500">3956.0 / λ</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                step="10"
                min="10"
                value={Math.round(kinematics.velocity_ms)}
                onChange={(e) => setByVelocity(parseFloat(e.target.value))}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-lg font-mono font-black text-cyan-400 focus:outline-none focus:border-cyan-500/40"
              />
              <span className="text-sm font-bold text-slate-500 font-mono">m/s</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Mach {(kinematics.velocity_ms / 343).toFixed(2)}</span>
              <span>{(kinematics.velocity_ms * 3.6).toFixed(0)} km/h</span>
            </div>
          </div>
        </div>

        {/* Wavevector k (Å^-1) */}
        <div className="bg-[#0B1528] p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5 text-purple-400">
              <Compass className="w-3.5 h-3.5" /> Wavevector (k)
            </span>
            <span className="text-[10px] font-mono text-slate-500">2π / λ</span>
          </div>
          <div className="space-y-1">
            <span className="text-xl font-mono font-black text-purple-400 block">
              {kinematics.wavevector_k.toFixed(4)} <span className="text-sm text-slate-500 font-sans">Å⁻¹</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">
              Max Bragg Q = {(2 * kinematics.wavevector_k).toFixed(3)} Å⁻¹
            </span>
          </div>
        </div>

        {/* Equivalent Temperature T (K) */}
        <div className="bg-[#0B1528] p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Thermometer className="w-3.5 h-3.5" /> Thermal Temp (T = E/k_B)
            </span>
            <span className="text-[10px] font-mono text-slate-500">Maxwell-Boltzmann</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                step="1"
                min="0.1"
                value={parseFloat(kinematics.temperature_K.toFixed(1))}
                onChange={(e) => setByTemperature(parseFloat(e.target.value))}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-base font-mono font-black text-amber-400 focus:outline-none focus:border-amber-500/40"
              />
              <span className="text-sm font-bold text-slate-500 font-mono">K</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">
              {(kinematics.temperature_K - 273.15).toFixed(1)} °C
            </span>
          </div>
        </div>

        {/* Time-of-Flight / Flight Path */}
        <div className="bg-[#0B1528] p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5 text-pink-400">
              <Clock className="w-3.5 h-3.5" /> TOF (Spallation Flight Path)
            </span>
            <span className="text-[10px] font-mono text-slate-500">{kinematics.tof_per_meter_us.toFixed(1)} μs/m</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Flight Path (L): {flightPathLength} m</span>
              <span className="text-pink-400 font-mono font-black">{totalTOF_ms.toFixed(3)} ms</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={flightPathLength}
              onChange={(e) => setFlightPathLength(parseFloat(e.target.value))}
              className="w-full accent-pink-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Beamline Spectrum Scale Visualizer */}
      <div className="bg-[#070D18] p-5 rounded-2xl border border-white/10 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
          Neutron Energy Spectrum Landscape
        </h4>

        {/* Horizontal colored spectrum band */}
        <div className="relative h-7 w-full bg-slate-950 rounded-xl overflow-hidden border border-white/10 flex items-center">
          <div className="h-full w-[15%] bg-blue-600/40 border-r border-blue-400/40 flex items-center justify-center text-[9px] font-mono font-black text-blue-300">
            UCN
          </div>
          <div className="h-full w-[25%] bg-cyan-600/40 border-r border-cyan-400/40 flex items-center justify-center text-[9px] font-mono font-black text-cyan-300">
            Cold (0.1–10 meV)
          </div>
          <div className="h-full w-[30%] bg-emerald-600/40 border-r border-emerald-400/40 flex items-center justify-center text-[9px] font-mono font-black text-emerald-300">
            Thermal (10–100 meV)
          </div>
          <div className="h-full w-[30%] bg-amber-600/40 flex items-center justify-center text-[9px] font-mono font-black text-amber-300">
            Epithermal ({'>'}100 meV)
          </div>
        </div>

        <div className="flex flex-wrap justify-between text-[10px] text-slate-500 font-mono">
          <span>λ = 50 Å</span>
          <span>λ = 5.0 Å</span>
          <span>λ = 1.8 Å</span>
          <span>λ = 0.5 Å</span>
        </div>
      </div>
    </div>
  );
};
