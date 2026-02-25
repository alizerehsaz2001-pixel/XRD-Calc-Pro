import React, { useState, useEffect, useMemo } from 'react';
import { CrystalSystem, SelectionRuleResult } from '../types';
import { parseHKLString, validateSelectionRule } from '../utils/physics';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, RefreshCw, Filter, BookOpen } from 'lucide-react';

export const SelectionRulesModule: React.FC = () => {
  const [system, setSystem] = useState<CrystalSystem>('FCC');
  const [hklInput, setHklInput] = useState<string>('1 0 0, 1 1 0, 1 1 1, 2 0 0, 2 1 0, 2 2 0, 3 1 1');
  const [results, setResults] = useState<SelectionRuleResult[]>([]);
  const [filter, setFilter] = useState<'All' | 'Allowed' | 'Forbidden'>('All');
  const [maxIndex, setMaxIndex] = useState<number>(3);

  const handleValidate = () => {
    const hklList = parseHKLString(hklInput);
    const validationResults = hklList.map(hkl => validateSelectionRule(system, hkl));
    setResults(validationResults);
  };

  const generateHKLs = () => {
    const newHKLs: string[] = [];
    for (let h = 0; h <= maxIndex; h++) {
      for (let k = 0; k <= maxIndex; k++) {
        for (let l = 0; l <= maxIndex; l++) {
          if (h === 0 && k === 0 && l === 0) continue;
          newHKLs.push(`${h} ${k} ${l}`);
        }
      }
    }
    setHklInput(newHKLs.join(', '));
  };

  useEffect(() => {
    handleValidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system]);

  const filteredResults = useMemo(() => {
    if (filter === 'All') return results;
    return results.filter(r => r.status === filter);
  }, [results, filter]);

  const systemDetails = {
    SC: {
      title: "Simple Cubic (SC)",
      rule: "All (h k l) are allowed.",
      origin: "The primitive unit cell has only one lattice point at (0,0,0). No destructive interference occurs between basis atoms.",
      formula: "F(hkl) = f",
      examples: "Polonium (Po), Pyrite (FeS2 - Pa3)"
    },
    BCC: {
      title: "Body-Centered Cubic (BCC)",
      rule: "h + k + l must be even.",
      origin: "Lattice points at (0,0,0) and (½,½,½). Destructive interference occurs when the phase difference is π (odd sum).",
      formula: "F(hkl) = f[1 + exp(πi(h+k+l))]",
      examples: "Iron (α-Fe), Chromium (Cr), Tungsten (W), Sodium (Na)"
    },
    FCC: {
      title: "Face-Centered Cubic (FCC)",
      rule: "h, k, l must be all even or all odd.",
      origin: "Lattice points at (0,0,0), (½,½,0), (½,0,½), (0,½,½). Mixed parity leads to total destructive interference.",
      formula: "F(hkl) = f[1 + e^{πi(h+k)} + e^{πi(h+l)} + e^{πi(k+l)}]",
      examples: "Aluminum (Al), Copper (Cu), Gold (Au), Silver (Ag), Nickel (Ni)"
    },
    Diamond: {
      title: "Diamond Cubic",
      rule: "FCC rules + if all even, h+k+l must be divisible by 4.",
      origin: "Basis of two atoms at (0,0,0) and (¼,¼,¼) combined with FCC lattice. This adds extra extinctions (e.g., 200 forbidden).",
      formula: "F(hkl) = F_{FCC} [1 + exp(πi/2(h+k+l))]",
      examples: "Silicon (Si), Germanium (Ge), Diamond (C)"
    },
    Hexagonal: {
      title: "Hexagonal Close Packed (HCP)",
      rule: "Forbidden if l is odd AND (h + 2k) is divisible by 3.",
      origin: "Basis of two atoms at (0,0,0) and (2/3, 1/3, 1/2) in a primitive hexagonal cell.",
      formula: "F(hkl) = f[1 + exp(2πi(h/3 + 2k/3 + l/2))]",
      examples: "Magnesium (Mg), Titanium (Ti), Zinc (Zn)"
    },
    Tetragonal: {
      title: "Tetragonal (Primitive)",
      rule: "All (h k l) are allowed.",
      origin: "Primitive cell with lattice points only at corners. No centering to cause destructive interference.",
      formula: "F(hkl) = f",
      examples: "Rutile (TiO2), Stishovite (SiO2)"
    },
    Tetragonal_I: {
      title: "Tetragonal (Body Centered)",
      rule: "h + k + l must be even.",
      origin: "Lattice points at (0,0,0) and (½,½,½). Same extinction condition as BCC.",
      formula: "F(hkl) = f[1 + exp(πi(h+k+l))]",
      examples: "Anatase (TiO2), Tin (White Sn)"
    },
    Orthorhombic: {
      title: "Orthorhombic (Primitive)",
      rule: "All (h k l) are allowed.",
      origin: "Primitive cell with lattice points only at corners.",
      formula: "F(hkl) = f",
      examples: "Topaz, Aragonite (CaCO3), Sulfur (α-S)"
    },
    Orthorhombic_F: {
      title: "Orthorhombic (Face Centered)",
      rule: "h, k, l must be all even or all odd.",
      origin: "Lattice points at faces. Same extinction condition as FCC.",
      formula: "F(hkl) = f[1 + e^{πi(h+k)} + e^{πi(h+l)} + e^{πi(k+l)}]",
      examples: "Gallium (Ga - pseudo-orthorhombic)"
    },
    Orthorhombic_C: {
      title: "Orthorhombic (Base Centered C)",
      rule: "h + k must be even.",
      origin: "Lattice points at (0,0,0) and (½,½,0). Centering on C-face causes extinction when h+k is odd.",
      formula: "F(hkl) = f[1 + exp(πi(h+k))]",
      examples: "Alpha-Uranium (α-U)"
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Configuration</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Crystal System
              </label>
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value as CrystalSystem)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50 font-medium text-slate-700"
              >
                <optgroup label="Cubic">
                  <option value="SC">Simple Cubic (SC)</option>
                  <option value="BCC">Body Centered Cubic (BCC)</option>
                  <option value="FCC">Face Centered Cubic (FCC)</option>
                  <option value="Diamond">Diamond Cubic</option>
                </optgroup>
                <optgroup label="Hexagonal">
                  <option value="Hexagonal">Hexagonal (HCP)</option>
                </optgroup>
                <optgroup label="Tetragonal">
                  <option value="Tetragonal">Primitive (P)</option>
                  <option value="Tetragonal_I">Body Centered (I)</option>
                </optgroup>
                <optgroup label="Orthorhombic">
                  <option value="Orthorhombic">Primitive (P)</option>
                  <option value="Orthorhombic_F">Face Centered (F)</option>
                  <option value="Orthorhombic_C">Base Centered (C)</option>
                </optgroup>
              </select>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-900">Current Rule</h3>
              </div>
              <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                {systemDetails[system as keyof typeof systemDetails].rule}
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Quick Generate
                </label>
                <span className="text-xs font-bold text-slate-400">Max Index: {maxIndex}</span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="range" min="1" max="5" step="1"
                  value={maxIndex}
                  onChange={(e) => setMaxIndex(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 self-center"
                />
                <button
                  onClick={generateHKLs}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                (h k l) Indices
              </label>
              <textarea
                value={hklInput}
                onChange={(e) => setHklInput(e.target.value)}
                placeholder="e.g. 1 0 0, 1 1 0, 1 1 1"
                className="w-full h-40 px-4 py-3 bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono text-sm leading-relaxed"
              />
            </div>

            <button
              onClick={handleValidate}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Validate Reflections
            </button>
          </div>
        </div>

        {/* Physical Origin Card */}
        <div className="bg-slate-900 p-6 rounded-2xl text-white border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold">Physical Context</h3>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Origin of Extinction</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {systemDetails[system as keyof typeof systemDetails].origin}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Structure Factor</span>
              <div className="bg-slate-800 p-3 rounded-lg font-mono text-[10px] text-emerald-400 overflow-x-auto">
                {systemDetails[system as keyof typeof systemDetails].formula}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Common Examples</span>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                {systemDetails[system as keyof typeof systemDetails].examples}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Validation Results</h3>
              <p className="text-xs text-slate-500 font-medium">Systematic absences for {systemDetails[system as keyof typeof systemDetails].title}</p>
            </div>
            
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              {(['All', 'Allowed', 'Forbidden'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filter === f 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12 text-center">
                <Filter className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">No indices provided</p>
                <p className="text-xs">Enter HKL values or use the generator to start</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4 font-bold">Reflection (h k l)</th>
                      <th className="px-8 py-4 font-bold">Status</th>
                      <th className="px-8 py-4 font-bold">Physical Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                      {filteredResults.map((res, index) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={`${res.hkl.join('-')}-${index}`} 
                          className="group hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${res.status === 'Allowed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span className="font-mono font-bold text-slate-900 text-base">
                                ({res.hkl.join(' ')})
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                              res.status === 'Allowed' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {res.status === 'Allowed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {res.status}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-slate-600 font-medium text-xs leading-relaxed max-w-xs">
                              {res.reason}
                            </p>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Allowed: {results.filter(r => r.status === 'Allowed').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Forbidden: {results.filter(r => r.status === 'Forbidden').length}
              </span>
            </div>
            <span>Total: {results.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

