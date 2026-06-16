import React, { useState, useMemo } from 'react';
import { 
  Calculator, Info, Play, FileSpreadsheet, Plus, Trash2, HelpCircle, 
  Settings, ChevronRight, CheckCircle, Database, RefreshCw, Upload, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RietveldRFactorCalculatorProps {
  livePatternData?: Array<{
    twoTheta: number;
    obs: number;
    calc: number;
    bkg: number;
  }>;
  numRefinedParameters?: number;
}

interface CustomDataRow {
  twoTheta: number;
  obs: number;
  calc: number;
  sigma?: number;
}

export const RietveldRFactorCalculator: React.FC<RietveldRFactorCalculatorProps> = ({
  livePatternData = [],
  numRefinedParameters = 8
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'custom' | 'theory'>('live');
  
  // Weights and parameters for live data
  const [liveP, setLiveP] = useState<number>(numRefinedParameters);
  const [liveWeighting, setLiveWeighting] = useState<'poisson' | 'unit' | 'calc'>('poisson');

  // Custom data state
  const [customP, setCustomP] = useState<number>(6);
  const [customWeighting, setCustomWeighting] = useState<'poisson' | 'unit' | 'sigma'>('poisson');
  const [customRows, setCustomRows] = useState<CustomDataRow[]>([
    { twoTheta: 20.0, obs: 120, calc: 110, sigma: 10 },
    { twoTheta: 21.0, obs: 250, calc: 242, sigma: 15 },
    { twoTheta: 22.0, obs: 800, calc: 785, sigma: 28 },
    { twoTheta: 23.0, obs: 450, calc: 462, sigma: 21 },
    { twoTheta: 24.0, obs: 180, calc: 175, sigma: 13 },
    { twoTheta: 25.0, obs: 95,  calc: 102, sigma: 9 },
  ]);

  const [pasteInput, setPasteInput] = useState<string>('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Math helper to evaluate profile R-factors
  const calculateRValues = (
    data: Array<{ obs: number; calc: number; sigma?: number }>,
    P: number,
    weighting: 'poisson' | 'unit' | 'calc' | 'sigma'
  ) => {
    if (data.length === 0) {
      return { rp: 0, rwp: 0, rexp: 0, gof: 0, chiSq: 0, sumObsSq: 0 };
    }

    let sumDelta = 0;
    let sumObs = 0;
    let sumWeightedDeltaSq = 0;
    let sumWeightedObsSq = 0;
    const N = data.length;

    data.forEach((pt) => {
      const yObs = Math.max(0.001, pt.obs);
      const yCalc = pt.calc;
      const delta = Math.abs(yObs - yCalc);

      sumDelta += delta;
      sumObs += yObs;

      // Determine weight
      let w = 1.0;
      if (weighting === 'poisson') {
        w = 1.0 / yObs;
      } else if (weighting === 'calc') {
        w = 1.0 / Math.max(0.001, yCalc);
      } else if (weighting === 'sigma' && pt.sigma && pt.sigma > 0) {
        w = 1.0 / Math.pow(pt.sigma, 2);
      }

      sumWeightedDeltaSq += w * Math.pow(yObs - yCalc, 2);
      sumWeightedObsSq += w * Math.pow(yObs, 2);
    });

    const rp = (sumDelta / sumObs) * 100;
    const rwp = Math.sqrt(sumWeightedDeltaSq / sumWeightedObsSq) * 100;
    
    // R-expected
    const degOfFreedom = N - P;
    const rexp = degOfFreedom > 0 
      ? Math.sqrt(degOfFreedom / sumWeightedObsSq) * 100 
      : 0;

    const gof = rexp > 0 ? rwp / rexp : 1.0;
    const chiSq = Math.pow(gof, 2);

    return {
      rp,
      rwp,
      rexp,
      gof,
      chiSq,
      sumObsSq: sumWeightedObsSq
    };
  };

  // Evaluate metrics on live simulation pattern
  const liveMetrics = useMemo(() => {
    // Adapter to convert from parent data structure
    const adapter = livePatternData.map(pt => ({
      obs: pt.obs,
      calc: pt.calc,
    }));
    return calculateRValues(adapter, liveP, liveWeighting);
  }, [livePatternData, liveP, liveWeighting]);

  // Evaluate metrics on custom tables
  const customMetrics = useMemo(() => {
    return calculateRValues(customRows, customP, customWeighting);
  }, [customRows, customP, customWeighting]);

  // Handle parsing spreadsheet or tab pasting
  const handleImportPaste = () => {
    if (!pasteInput.trim()) {
      setPasteError("Please paste some tab/comma separated numeric values.");
      return;
    }

    try {
      setPasteError(null);
      const lines = pasteInput.trim().split('\n');
      const parsedRows: CustomDataRow[] = [];

      lines.forEach((line) => {
        const parts = line.split(/[\t, ]+/).map(v => parseFloat(v));
        // Expecting 2 to 4 values per line: [2theta, Yobs, Ycalc, Optional_Sigma]
        if (parts.length >= 2) {
          const twoTheta = parts[0];
          const obs = parts[1];
          const calc = parts.length >= 3 ? parts[2] : 0;
          const sigma = parts.length >= 4 ? parts[3] : Math.sqrt(Math.max(1, obs));

          if (!isNaN(twoTheta) && !isNaN(obs) && !isNaN(calc)) {
            parsedRows.push({ twoTheta, obs, calc, sigma });
          }
        }
      });

      if (parsedRows.length === 0) {
        throw new Error("No valid spreadsheet lines parsed. Format lines as: '2Theta Obs Calc [Sigma]'");
      }

      setCustomRows(parsedRows);
      setPasteInput('');
    } catch (err: any) {
      setPasteError(err.message || 'Verification Error during parse');
    }
  };

  const addCustomRow = () => {
    const lastRow = customRows[customRows.length - 1];
    const next2T = lastRow ? lastRow.twoTheta + 0.5 : 20.0;
    setCustomRows([...customRows, { twoTheta: next2T, obs: 100, calc: 100, sigma: 10 }]);
  };

  const removeCustomRow = (idx: number) => {
    if (customRows.length <= 1) return;
    setCustomRows(customRows.filter((_, i) => i !== idx));
  };

  const updateCustomCell = (idx: number, field: keyof CustomDataRow, val: string) => {
    const numeric = parseFloat(val);
    const updated = [...customRows];
    updated[idx] = {
      ...updated[idx],
      [field]: isNaN(numeric) ? 0 : numeric
    };
    setCustomRows(updated);
  };

  const loadExampleCustomData = (type: 'ideal' | 'noised' | 'high_background') => {
    if (type === 'ideal') {
      setCustomRows([
        { twoTheta: 15.0, obs: 200, calc: 198, sigma: 14.1 },
        { twoTheta: 15.5, obs: 450, calc: 445, sigma: 21.2 },
        { twoTheta: 16.0, obs: 1200, calc: 1190, sigma: 34.6 },
        { twoTheta: 16.5, obs: 480, calc: 476, sigma: 21.9 },
        { twoTheta: 17.0, obs: 190, calc: 195, sigma: 13.8 },
        { twoTheta: 17.5, obs: 80, calc: 82, sigma: 8.9 },
      ]);
    } else if (type === 'noised') {
      setCustomRows([
        { twoTheta: 15.0, obs: 200, calc: 240, sigma: 14.1 },
        { twoTheta: 15.5, obs: 450, calc: 380, sigma: 21.2 },
        { twoTheta: 16.0, obs: 1200, calc: 1350, sigma: 34.6 },
        { twoTheta: 16.5, obs: 480, calc: 410, sigma: 21.9 },
        { twoTheta: 17.0, obs: 190, calc: 260, sigma: 13.8 },
        { twoTheta: 17.5, obs: 80, calc: 130, sigma: 8.9 },
      ]);
    } else {
      setCustomRows([
        { twoTheta: 30.0, obs: 1000, calc: 950, sigma: 31.6 },
        { twoTheta: 30.5, obs: 1800, calc: 1680, sigma: 42.4 },
        { twoTheta: 31.0, obs: 4200, calc: 4100, sigma: 64.8 },
        { twoTheta: 31.5, obs: 2200, calc: 2120, sigma: 46.9 },
        { twoTheta: 32.0, obs: 1200, calc: 1150, sigma: 34.6 },
      ]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden" id="rietveld-rfactor-container">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-teal-500/5 duration-1000 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-black text-white tracking-tight uppercase font-mono">
              R-Factor (Reliability index) Calculator
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Determine and verify structural refinement fit metrics: Rp, Rwp, Rexp, and ChSq/GoF.
          </p>
        </div>
        
        {/* Tab Selector */}
        <div className="flex bg-[#050C16] rounded-xl p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'live' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Live Pattern Metrics
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'custom' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Custom Refinement Lab
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'theory' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Theoretical Formulary
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: LIVE INTERACTIVE STATISTICS */}
          {activeTab === 'live' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {workEmptyWarning(livePatternData.length)}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Math Control Panel */}
                <div className="bg-[#050B14] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5" /> Weighting & Parameters
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Refinement parameter slider */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Refined Parameters (P)</span>
                          <span className="text-indigo-400 font-bold">{liveP} variables</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="40"
                          value={liveP}
                          onChange={(e) => setLiveP(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-500 leading-normal">
                          Configures parameter count to calculate expected minimal R_exp.
                        </span>
                      </div>

                      {/* Weight selection */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-mono text-slate-400">Analytical Profile Weighting (w_i)</span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setLiveWeighting('poisson')}
                            className={`py-2 px-1 rounded-xl text-[10px] font-mono border transition-all ${liveWeighting === 'poisson' ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}
                          >
                            Poisson (1/Y_obs)
                          </button>
                          <button
                            onClick={() => setLiveWeighting('calc')}
                            className={`py-2 px-1 rounded-xl text-[10px] font-mono border transition-all ${liveWeighting === 'calc' ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}
                          >
                            Calc (1/Y_calc)
                          </button>
                          <button
                            onClick={() => setLiveWeighting('unit')}
                            className={`py-2 px-1 rounded-xl text-[10px] font-mono border transition-all ${liveWeighting === 'unit' ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}
                          >
                            Uniform (1.0)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 mt-4 pt-3 border-t border-slate-850 leading-relaxed italic">
                    Modifying the weight factor re-evaluates the Least-Squares Jacobian residuals statically.
                  </div>
                </div>

                {/* Live Results Card */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                  
                  {/* Rwp metric card */}
                  <div className="bg-[#050C16] p-5 rounded-2xl border border-indigo-500/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Database className="w-16 h-16 text-indigo-400" />
                    </div>
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-black">Weighted Profile Residual</span>
                    <span className="text-3xl font-black font-mono text-white tracking-tighter block mt-2">
                      {liveMetrics.rwp.toFixed(3)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-2">R_wp (Weighted)</span>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(5, 110 - liveMetrics.rwp))}%` }} />
                    </div>
                  </div>

                  {/* Rp metric card */}
                  <div className="bg-[#050C16] p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-black">Unweighted Profile residual</span>
                    <span className="text-3xl font-black font-mono text-white tracking-tighter block mt-2">
                      {liveMetrics.rp.toFixed(3)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-2">R_p (Profile)</span>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
                      <div className="bg-slate-600 h-full" style={{ width: `${Math.min(100, Math.max(5, 110 - liveMetrics.rp))}%` }} />
                    </div>
                  </div>

                  {/* Rexp metric card */}
                  <div className="bg-[#050C16] p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-black">Expected Residual Level</span>
                    <span className="text-3xl font-black font-mono text-sky-400 tracking-tighter block mt-2">
                      {liveMetrics.rexp.toFixed(3)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-2">R_exp (Limits)</span>
                    <p className="text-[9px] text-slate-500 mt-2 leading-tight">
                      Minimum limit given statistical error profiles of the simulation.
                    </p>
                  </div>

                  {/* Goodness of Fit (ChiSq) metric card */}
                  <div className="bg-[#050C16] p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                    <span className="text-[9px] font-mono text-teal-400 uppercase tracking-widest block font-black">Goodness of Fit (Chi²)</span>
                    <span className={`text-3xl font-black font-mono tracking-tighter block mt-2 ${liveMetrics.gof < 1.3 ? 'text-emerald-400' : liveMetrics.gof < 2.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {liveMetrics.gof.toFixed(3)} <span className="text-xs font-bold font-sans text-slate-500">GoF</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-2">
                      χ² = {(liveMetrics.chiSq).toFixed(3)}
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1 leading-tight">
                      Ideal fit ratio approaches 1.0. Values &gt; 3.0 denote significant deviations.
                    </p>
                  </div>

                </div>

              </div>
              
              {/* Scientific explanation callout */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 text-xs font-mono leading-relaxed text-indigo-300">
                <div className="flex items-center gap-1.5 uppercase font-bold text-indigo-400 mb-1.5">
                  <Info className="w-3.5 h-3.5" /> High-Accuracy Crystal Refinement Check
                </div>
                The computed profiles use <span className="font-bold text-white">{livePatternData.length} discrete 2θ steps</span>. 
                As you realign structural scales or temperature factors in the main panel, the residuals Rp and Rwp dynamically update. 
                Use this control to evaluate local convergence.
              </div>
            </motion.div>
          )}

          {/* TAB 2: CUSTOM LAB REFINEMENT WORKSPACE */}
          {activeTab === 'custom' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Main spreadsheet editor */}
                <div className="lg:col-span-8 bg-[#050B14] p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
                      Reflections Measurement Matrix
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadExampleCustomData('ideal')}
                        className="py-1 px-2 border border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg text-[9px] font-mono text-emerald-400 transition-all"
                      >
                        Load Ideal Standard
                      </button>
                      <button
                        onClick={() => loadExampleCustomData('noised')}
                        className="py-1 px-2 border border-rose-500/20 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg text-[9px] font-mono text-rose-400 transition-all"
                      >
                        Load Noised Peak
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-2">Point No.</th>
                          <th className="pb-2">2θ (deg)</th>
                          <th className="pb-2">Y_obs (counts)</th>
                          <th className="pb-2">Y_calc (counts)</th>
                          <th className="pb-2">Est. σ_i</th>
                          <th className="pb-2 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {customRows.map((row, i) => {
                          const delta = Math.abs(row.obs - row.calc);
                          return (
                            <tr key={i} className="text-slate-350 hover:bg-slate-900/40 group">
                              <td className="py-2 text-slate-500">{i + 1}</td>
                              <td className="py-1 pr-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.twoTheta}
                                  onChange={(e) => updateCustomCell(i, 'twoTheta', e.target.value)}
                                  className="w-16 px-1.5 py-1 bg-slate-950/80 border border-slate-850 rounded text-center text-xs text-white"
                                />
                              </td>
                              <td className="py-1 pr-2">
                                <input
                                  type="number"
                                  value={row.obs}
                                  onChange={(e) => updateCustomCell(i, 'obs', e.target.value)}
                                  className="w-20 px-1.5 py-1 bg-slate-950/80 border border-slate-850 rounded text-center text-xs text-white text-indigo-400 font-bold"
                                />
                              </td>
                              <td className="py-1 pr-2">
                                <input
                                  type="number"
                                  value={row.calc}
                                  onChange={(e) => updateCustomCell(i, 'calc', e.target.value)}
                                  className="w-20 px-1.5 py-1 bg-slate-950/80 border border-slate-850 rounded text-center text-xs text-white text-emerald-400 font-bold"
                                />
                              </td>
                              <td className="py-1 pr-2">
                                <input
                                  type="number"
                                  value={row.sigma || 10}
                                  onChange={(e) => updateCustomCell(i, 'sigma', e.target.value)}
                                  className="w-16 px-1.5 py-1 bg-slate-950/80 border border-slate-850 rounded text-center text-xs text-white text-slate-400"
                                />
                              </td>
                              <td className="py-1 text-right">
                                <button
                                  onClick={() => removeCustomRow(i)}
                                  className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                                  title="Remove point"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={addCustomRow}
                      className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-850 hover:bg-slate-800 transition-colors text-slate-300 rounded-lg text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Profile Point
                    </button>
                    <span className="text-[10px] text-slate-500">Points array size: {customRows.length} points</span>
                  </div>

                  {/* Spreadsheet Bulk Paste Section */}
                  <div className="pt-4 border-t border-slate-850">
                    <div className="flex gap-2 items-center mb-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-350">Spreadsheet Bulk Import (TSV / CSV)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-2">
                      Paste rows exported from origin / clipboard. Formatted: 2Theta, Obs_Intensity, Calc_Intensity. One data point per row.
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <textarea
                          value={pasteInput}
                          onChange={(e) => setPasteInput(e.target.value)}
                          placeholder="20.00&#9;150&#9;145&#10;20.50&#9;420&#9;405&#10;21.00&#9;1100&#9;1120"
                          className="w-full h-16 p-2 bg-slate-950 font-mono text-[10px] border border-slate-850 rounded-xl text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
                        />
                        {pasteError && (
                          <div className="absolute right-2 bottom-2 text-[10px] text-rose-400 flex items-center gap-1 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-900/30">
                            <AlertCircle className="w-3 h-3" /> {pasteError}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleImportPaste}
                        className="px-4 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold uppercase tracking-widest border border-indigo-500/30 shrink-0 self-stretch flex items-center justify-center transition-all"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right evaluation sidebar */}
                <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
                  <div className="bg-[#050C16] p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">
                      Refinement Tuning
                    </h4>

                    {/* Parameters count */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Refined variables (P)</span>
                        <span className="text-indigo-400 font-bold">{customP}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max={Math.max(1, customRows.length - 1)}
                        value={customP}
                        onChange={(e) => setCustomP(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Custom weight profiles */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-mono text-slate-400">Weight Profile (w_i)</span>
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="custom_w"
                            checked={customWeighting === 'poisson'}
                            onChange={() => setCustomWeighting('poisson')}
                            className="accent-indigo-500"
                          />
                          <span className="text-[11px] text-slate-350">Poisson (1 / Obs)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="custom_w"
                            checked={customWeighting === 'sigma'}
                            onChange={() => setCustomWeighting('sigma')}
                            className="accent-indigo-500"
                          />
                          <span className="text-[11px] text-slate-350">Uncertainty (1 / σ²)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="custom_w"
                            checked={customWeighting === 'unit'}
                            onChange={() => setCustomWeighting('unit')}
                            className="accent-indigo-500"
                          />
                          <span className="text-[11px] text-slate-350">Unit weights (1.0)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Calculations breakdown block */}
                  <div className="bg-[#050C16] p-5 rounded-2xl border border-indigo-500/10 space-y-3.5">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase font-black block">Live Laboratory Fit Metrics</span>
                    
                    <div className="grid grid-cols-2 gap-3.5 font-mono">
                      <div>
                        <span className="text-[9px] text-slate-500 block">Rwp</span>
                        <span className="text-lg font-black text-white">{customMetrics.rwp.toFixed(3)}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Rp</span>
                        <span className="text-lg font-black text-white">{customMetrics.rp.toFixed(3)}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">Rexp</span>
                        <span className="text-lg font-black text-sky-400">{customMetrics.rexp.toFixed(3)}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block">GoF (Chi²)</span>
                        <span className={`text-lg font-black ${customMetrics.gof < 1.3 ? 'text-emerald-400' : 'text-rose-400'}`}>{customMetrics.gof.toFixed(3)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-850 flex items-center justify-between font-mono text-[9px] text-slate-500">
                      <span>Deg Of Freedom: {customRows.length - customP}</span>
                      <span>Sum W*Obs²: {Math.round(customMetrics.sumObsSq)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: THEORETICAL FORMULARY */}
          {activeTab === 'theory' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              
              {/* Formula Panel 1 */}
              <div className="bg-[#050B14] p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                <div className="flex gap-1.5 items-center text-teal-400 border-b border-slate-850 pb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Weighted Profile Residual (Rwp)</span>
                </div>
                <p className="leading-relaxed">
                  The most crucial statistical value inside Rietveld refinement, where weights reflect experimental Poisson scatter statistics:
                </p>
                <div className="p-3 bg-slate-950 rounded-lg text-center text-white font-bold my-2 border border-slate-850">
                  Rwp = √[ ∑ w_i (y_obs - y_calc)² / ∑ w_i y_obs² ]
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Typical weight uses reciprocal observed intensity (w_i = 1 / y_obs). Minimum limits are dictated directly by data quality.
                </p>
              </div>

              {/* Formula Panel 2 */}
              <div className="bg-[#050B14] p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                <div className="flex gap-1.5 items-center text-indigo-400 border-b border-slate-850 pb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Expected Residual Limit (Rexp)</span>
                </div>
                <p className="leading-relaxed">
                  Represents the lowest mathematically achievable Rwp based on statistical Poisson noise, assuming absolute perfect fit:
                </p>
                <div className="p-3 bg-slate-950 rounded-lg text-center text-white font-bold my-2 border border-slate-850">
                  Rexp = √[ (N - P) / ∑ w_i y_obs² ]
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  N is the total count of 2θ steps, and P is the number of active mathematical parameter variables. Higher parameter ratios deflate Rexp.
                </p>
              </div>

              {/* Formula Panel 3 */}
              <div className="bg-[#050B14] p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                <div className="flex gap-1.5 items-center text-sky-400 border-b border-slate-850 pb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Goodness of Fit (Chi² / GoF)</span>
                </div>
                <p className="leading-relaxed">
                  Tells you how close your refinement model matches the expected statistical limits:
                </p>
                <div className="p-3 bg-slate-950 rounded-lg text-center text-white font-bold my-2 border border-slate-850">
                  χ² = (Rwp / Rexp)² &nbsp; | &nbsp; GoF = Rwp / Rexp
                </div>
                <p className="text-[11px] text-slate-400 leading-normal flex flex-col gap-1">
                  <span>• GoF &gt; 1.5 : Sub-optimal structural configuration. Missing physical factors.</span>
                  <span>• GoF ≈ 1.0 : Ideal atomic and profile alignment.</span>
                  <span>• GoF &lt; 1.0 : Data over-modeling or over-parameterization.</span>
                </p>
              </div>

              {/* Formula Panel 4 */}
              <div className="bg-[#050B14] p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                <div className="flex gap-1.5 items-center text-amber-400 border-b border-slate-850 pb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Profile Residual Rate (Rp)</span>
                </div>
                <p className="leading-relaxed">
                  A simple unweighted evaluation comparing direct numerical count divergences:
                </p>
                <div className="p-3 bg-slate-950 rounded-lg text-center text-white font-bold my-2 border border-slate-850">
                  Rp = ∑ |y_obs - y_calc| / ∑ y_obs
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Rp gives equal weighting to low-angle background regions and high-count crystallite peaks, making it less physically precise than Rwp.
                </p>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};

function workEmptyWarning(length: number) {
  if (length > 0) return null;
  return (
    <div className="p-4 bg-orange-950/20 border border-orange-500/20 rounded-2xl flex items-start gap-3 text-orange-200">
      <AlertCircle className="w-5 h-5 shrink-0 text-orange-400 mt-0.5" />
      <div className="text-xs leading-relaxed font-mono">
        <span className="font-bold uppercase block mb-1">No Active Simulation Dataset found</span>
        Please enable a standard crystal phase in the Setup tab first to generate simulated pattern intensity curves (y_obs &amp; y_calc).
      </div>
    </div>
  );
}
