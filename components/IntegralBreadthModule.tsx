import React, { useState, useEffect } from 'react';
import { IntegralBreadthInput, IntegralBreadthResult } from '../types';
import { parseIntegralBreadthInput, calculateIntegralBreadth } from '../utils/physics';
import { Info, BookOpen, Activity, Calculator, Sparkles, Loader2, Atom, Binary, ShieldQuestion } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

export const IntegralBreadthModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  // Default Example: 2Theta, FWHM, Area, Imax
  const [inputData, setInputData] = useState<string>("28.44, 0.22, 230, 1000\n47.30, 0.26, 280, 950\n56.12, 0.31, 350, 900");
  const [results, setResults] = useState<IntegralBreadthResult[]>([]);
  const [avgSize, setAvgSize] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const handleSmartLoad = async () => {
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Generate realistic X-ray diffraction peak data for ${searchQuery} using Cu K-alpha radiation (1.5406 Å).
        Provide 3 to 5 major peaks. For each peak, provide:
        - 2Theta (degrees)
        - FWHM (degrees)
        - Area (counts * degrees)
        - Imax (counts)
        Make sure Area and Imax are physically realistic (e.g., Area ≈ FWHM * Imax * shape_factor).
        Return ONLY a JSON array of objects.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                twoTheta: { type: Type.NUMBER },
                fwhm: { type: Type.NUMBER },
                area: { type: Type.NUMBER },
                imax: { type: Type.NUMBER }
              },
              required: ["twoTheta", "fwhm", "area", "imax"]
            }
          }
        }
      });

      if (response.text) {
        let rawText = response.text;
        rawText = rawText.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
        const data = JSON.parse(rawText);
        const formattedData = data.map((p: any) => `${p.twoTheta.toFixed(2)}, ${p.fwhm.toFixed(3)}, ${p.area.toFixed(1)}, ${p.imax.toFixed(0)}`).join('\n');
        setInputData(formattedData);
      }
    } catch (error: any) {
      console.error("Error generating data:", error);
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      const isQuota = errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED');
      const isPermission = errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED') || errorStr.includes('permission');
      
      if (isQuota) {
        alert("Neural link quota exhausted. Please wait for buffer reset.");
      } else if (isPermission) {
        alert("Neural link access restricted (403). Permission denied for AI data generation.");
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleCalculate = () => {
    const peaks = parseIntegralBreadthInput(inputData);
    const computed = peaks
      .map(p => calculateIntegralBreadth(wavelength, constantK, p))
      .filter((r): r is IntegralBreadthResult => r !== null);
    
    setResults(computed);

    if (computed.length > 0) {
      const sum = computed.reduce((acc, curr) => acc + curr.calcSizeNm, 0);
      setAvgSize(sum / computed.length);
    } else {
      setAvgSize(0);
    }
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavelength, constantK, inputData]);

  const getProfileType = (phi: number) => {
    if (phi < 0.7) return { type: 'Lorentzian', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (phi > 0.9) return { type: 'Gaussian', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    return { type: 'Pseudo-Voigt', color: 'text-purple-600', bg: 'bg-purple-50' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-600 rounded-full opacity-10 blur-2xl"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-500/30">
              <Calculator className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Integral Breadth Config</h2>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Smart Load Section */}
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Smart Data Load
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Zinc Oxide"
                  className="flex-1 px-4 py-3 bg-black/40 text-purple-400 border border-slate-600 focus:border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none text-sm transition-all placeholder:text-slate-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isThinking || !searchQuery.trim()}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-lg transition-all flex items-center justify-center min-w-[100px] gap-2 border border-purple-500 hover:border-purple-400 transition-colors disabled:border-slate-700 group disabled:opacity-80"
                >
                  {isThinking ? <Loader2 className="w-4 h-4 animate-spin text-purple-300" /> : <Sparkles className="w-4 h-4 text-purple-300 group-hover:text-white transition-colors" />}
                  <span className="hidden sm:inline">Load</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Wavelength (Å)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-black/40 text-purple-400 border border-slate-600 focus:border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none font-mono text-sm transition-all placeholder:text-slate-600"
                />
                <button 
                  onClick={() => setWavelength(1.5406)}
                  className="absolute right-2 top-2 bottom-2 px-3 text-[10px] font-bold text-slate-400 bg-slate-800 hover:bg-purple-500/20 hover:text-purple-400 border border-slate-700 hover:border-purple-500/50 rounded transition-colors flex items-center justify-center uppercase tracking-wider"
                >
                  Cu Kα ≈ 1.5406
                </button>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Constant K
              </label>
              <input
                type="number"
                step="0.1"
                value={constantK}
                onChange={(e) => setConstantK(parseFloat(e.target.value))}
                className="w-full px-4 py-3 bg-black/40 text-purple-400 border border-slate-600 focus:border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none font-mono text-sm transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Peak Data Input
                </label>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded border border-slate-700">
                  <span>Format: 2θ, FWHM, Area, Imax</span>
                </div>
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.22, 230, 1000"
                className="w-full h-32 px-4 py-3 bg-black/40 text-purple-400 border border-slate-600 focus:border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none font-mono text-sm leading-relaxed resize-none transition-all placeholder:text-slate-700"
                spellCheck={false}
              />
              <div className="mt-3 flex items-start gap-2 text-[11px] font-bold text-slate-400 bg-slate-800/80 p-3 rounded-lg border border-slate-700/50">
                <Info className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <span><span className="text-purple-400">β = Area / Imax.</span> Ensure consistent units.</span>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Calculate Results
            </button>
          </div>
        </div>

        {/* Scientific Context Card */}
        <div className="bg-slate-900/50 p-6 rounded-2xl text-white border border-slate-800/50 relative overflow-hidden group">
          <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-500/30">
              <BookOpen className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Scientific Context</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Integral Breadth Theory</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breadth Definition</span>
              </div>
              <div className="bg-black/60 p-4 rounded-xl font-mono text-sm text-emerald-400 overflow-x-auto border border-slate-700 shadow-inner text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span className="truncate">β = Area / Imax</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shape Factor (φ = FWHM/β)</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <span className="font-bold text-blue-300">Lorentzian</span>
                  <span className="font-mono text-blue-400">φ ≈ 0.636</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <span className="font-bold text-emerald-300">Gaussian</span>
                  <span className="font-mono text-emerald-400">φ ≈ 0.939</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <ShieldQuestion className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Why use β?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                Integral breadth considers the entire peak profile rather than just its width at half intensity, making it more robust for highly distorted profiles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        {/* Summary Card */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 flex items-center justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full transition-all group-hover:scale-110" />
           <div className="relative z-10">
             <h3 className="text-xl font-bold text-white">Average Crystallite Size</h3>
             <p className="text-sm text-slate-400 mt-1">Calculated from {results.length} peaks using Integral Breadth</p>
           </div>
           <div className="text-right relative z-10">
             <span className="text-5xl font-black text-purple-400">{avgSize.toFixed(2)}</span>
             <span className="text-xl text-purple-500/50 font-bold ml-2">nm</span>
           </div>
        </div>

        <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">Detailed Analysis</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                Profile Analysis
              </span>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center border-2 border-dashed border-slate-800 m-6 rounded-xl bg-slate-900/50">
                <Calculator className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold text-slate-400">No data calculated</p>
                <p className="text-xs mt-1">Enter peak parameters to see integral breadth analysis.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-800/80 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-black border-b border-slate-700">2θ (deg)</th>
                    <th scope="col" className="px-6 py-4 font-black border-b border-slate-700">β_IB (deg)</th>
                    <th scope="col" className="px-6 py-4 font-black border-b border-slate-700">Shape Factor (φ)</th>
                    <th scope="col" className="px-6 py-4 font-black border-b border-slate-700">Profile Type</th>
                    <th scope="col" className="px-6 py-4 font-black border-b border-slate-700 text-right">Size (nm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 bg-slate-900/30">
                  {results.map((res, index) => {
                    const profile = getProfileType(res.shapeFactorPhi);
                    return (
                      <tr key={`${res.twoTheta}-${index}`} className="hover:bg-purple-900/10 transition-colors group">
                        <td className="px-6 py-4 font-bold text-slate-200">
                          {res.twoTheta.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 font-mono text-purple-400 font-bold group-hover:text-purple-300 transition-colors">
                          {res.integralBreadthDeg.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400">
                          {res.shapeFactorPhi.toFixed(3)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                            profile.type === 'Gaussian' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            profile.type === 'Lorentzian' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {profile.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-right font-black text-slate-200 text-lg">
                          {res.calcSizeNm.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
