import React, { useState } from 'react';
import {
  KNOWN_XEC_MATERIALS,
  SingleCrystalElasticity,
  XecModel,
  calculateXEC,
  calculateGammaHkl
} from '../../utils/residualStressPhysics';
import { Cpu, Scale, Check, Info, Sparkles } from 'lucide-react';

interface XecCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (e: number, nu: number, s1: number, halfS2: number, model: XecModel, plane: string) => void;
  currentE: number;
  currentNu: number;
}

export const XecCalculatorModal: React.FC<XecCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentE,
  currentNu
}) => {
  const [selectedMatKey, setSelectedMatKey] = useState<string>('ferrite_fe');
  const [hklH, setHklH] = useState<number>(2);
  const [hklK, setHklK] = useState<number>(1);
  const [hklL, setHklL] = useState<number>(1);
  const [selectedModel, setSelectedModel] = useState<XecModel>('hill');

  if (!isOpen) return null;

  const mat = KNOWN_XEC_MATERIALS[selectedMatKey] || KNOWN_XEC_MATERIALS['ferrite_fe'];
  const hkl: [number, number, number] = [hklH, hklK, hklL];
  const xec = calculateXEC(mat, hkl, selectedModel);
  const gamma = calculateGammaHkl(hklH, hklK, hklL);

  const handleApply = () => {
    onApply(
      parseFloat(xec.effectiveE.toFixed(1)),
      parseFloat(xec.effectiveNu.toFixed(3)),
      xec.s1,
      xec.halfS2,
      selectedModel,
      `(${hklH}${hklK}${hklL})`
    );
    onClose();
  };

  const handleSelectMaterial = (key: string) => {
    setSelectedMatKey(key);
    const m = KNOWN_XEC_MATERIALS[key];
    if (m) {
      setHklH(m.defaultPlane[0]);
      setHklK(m.defaultPlane[1]);
      setHklL(m.defaultPlane[2]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                X-Ray Elastic Constants (XEC) Engine
              </h3>
              <p className="text-xs text-slate-500">
                Single-crystal elastic anisotropy & crystallographic orientation (hkl) compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Material Matrix & Reflection Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Material Crystal Matrix
            </label>
            <select
              value={selectedMatKey}
              onChange={e => handleSelectMaterial(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
            >
              {Object.entries(KNOWN_XEC_MATERIALS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Diffraction Plane (h k l)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={hklH}
                onChange={e => setHklH(Number(e.target.value))}
                className="p-2 text-center text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl"
                placeholder="h"
              />
              <input
                type="number"
                value={hklK}
                onChange={e => setHklK(Number(e.target.value))}
                className="p-2 text-center text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl"
                placeholder="k"
              />
              <input
                type="number"
                value={hklL}
                onChange={e => setHklL(Number(e.target.value))}
                className="p-2 text-center text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl"
                placeholder="l"
              />
            </div>
          </div>
        </div>

        {/* Micromechanical Model Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Polycrystalline Averaging Model
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'hill', label: 'Hill (VRH)', desc: 'Recommended standard' },
              { id: 'kroner', label: 'Kröner', desc: 'Self-consistent matrix' },
              { id: 'reuss', label: 'Reuss', desc: 'Isostress lower bound' },
              { id: 'voigt', label: 'Voigt', desc: 'Isostrain upper bound' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id as XecModel)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                  selectedModel === m.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-xs font-black">{m.label}</span>
                <span className="text-[10px] opacity-70">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calculated Results Summary Grid */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">Orientation Factor Γ</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{gamma.toFixed(4)}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">Zener Anisotropy A</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{xec.anisotropyA.toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">S₁ (TPa⁻¹)</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{xec.s1.toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">½ S₂ (TPa⁻¹)</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{xec.halfS2.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-sans">
              Effective (hkl) Constants:
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              E({hklH}{hklK}{hklL}) = {xec.effectiveE.toFixed(1)} GPa | ν({hklH}{hklK}{hklL}) = {xec.effectiveNu.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Apply XEC to Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
