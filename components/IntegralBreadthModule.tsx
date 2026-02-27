import React, { useState, useEffect } from 'react';
import { IntegralBreadthInput, IntegralBreadthResult } from '../types';
import { parseIntegralBreadthInput, calculateIntegralBreadth } from '../utils/physics';
import { Info, BookOpen, Activity, Calculator, Sparkles, Loader2 } from 'lucide-react';
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate realistic X-ray diffraction peak data for ${searchQuery} using Cu K-alpha radiation (1.5406 Å).
        Provide 3 to 5 major peaks. For each peak, provide:
        - 2Theta (degrees)
        - FWHM (degrees)
        - Area (counts * degrees)
        - Imax (counts)
        Make sure Area and Imax are physically realistic (e.g., Area ≈ FWHM * Imax * shape_factor).
        Return ONLY a JSON array of objects.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
        const data = JSON.parse(response.text);
        const formattedData = data.map((p: any) => `${p.twoTheta.toFixed(2)}, ${p.fwhm.toFixed(3)}, ${p.area.toFixed(1)}, ${p.imax.toFixed(0)}`).join('\n');
        setInputData(formattedData);
      }
    } catch (error) {
      console.error("Error generating data:", error);
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
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Smart Data Load
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Zinc Oxide"
                  className="flex-1 px-4 py-2.5 bg-black/40 text-purple-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm transition-all placeholder:text-slate-600"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isThinking || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 border border-purple-500 disabled:border-slate-600"
                >
                  {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span className="hidden sm:inline">Load</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Wavelength (Å)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 bg-black/40 text-purple-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono text-sm transition-all"
                />
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  Constant K
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={constantK}
                  onChange={(e) => setConstantK(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 bg-black/40 text-purple-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono text-sm transition-all"
                />
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Peak Data Input
              </label>
              <div className="bg-black/40 p-2.5 rounded-lg border border-slate-700 text-[10px] text-slate-400 mb-3 font-mono flex items-center gap-2 uppercase tracking-wider">
                <Info className="w-4 h-4 text-purple-500 shrink-0" />
                Format: 2θ, FWHM, Area, Imax
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.22, 230, 1000"
                className="w-full h-32 px-4 py-3 bg-black/40 text-purple-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono text-sm leading-relaxed resize-none transition-all"
                spellCheck={false}
              />
              <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-wider font-bold">
                β = Area / Imax. Ensure consistent units.
              </p>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Calculate Results
            </button>
          </div>
        </div>

        {/* Theory Card */}
        <div className="bg-slate-900 p-6 rounded-xl text-white border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold">Theory: Integral Breadth</h3>
          </div>
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-800 p-3 rounded-lg font-mono text-center text-purple-300 text-sm mb-2">
              β = Area / Imax
            </div>
            <p>
              Integral Breadth uses the total area under the peak divided by the maximum intensity. It is often more robust than FWHM for irregular peak shapes.
            </p>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Shape Factor (φ = FWHM / β)</span>
              <ul className="space-y-1 pl-2 border-l-2 border-slate-700">
                <li><span className="text-blue-400 font-bold">Lorentzian:</span> φ ≈ 0.636</li>
                <li><span className="text-emerald-400 font-bold">Gaussian:</span> φ ≈ 0.939</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        {/* Summary Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
           <div>
             <h3 className="text-lg font-bold text-slate-800">Average Crystallite Size</h3>
             <p className="text-sm text-slate-600">Calculated from {results.length} peaks using Integral Breadth</p>
           </div>
           <div className="text-right">
             <span className="text-4xl font-black text-purple-700">{avgSize.toFixed(2)}</span>
             <span className="text-lg text-slate-700 font-bold ml-1">nm</span>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-slate-300 bg-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Detailed Analysis</h3>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Profile Analysis
              </span>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12 text-center">
                <Calculator className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">No data calculated</p>
                <p className="text-xs mt-1">Enter peak parameters to see integral breadth analysis.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left text-slate-800">
                <thead className="text-xs text-slate-900 uppercase bg-slate-200 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">2θ (deg)</th>
                    <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">β_IB (deg)</th>
                    <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">Shape Factor (φ)</th>
                    <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">Profile Type</th>
                    <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300 text-right">Size (nm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.map((res, index) => {
                    const profile = getProfileType(res.shapeFactorPhi);
                    return (
                      <tr key={index} className="bg-white border-b hover:bg-purple-50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {res.twoTheta.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 font-mono text-purple-700 font-bold">
                          {res.integralBreadthDeg.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700">
                          {res.shapeFactorPhi.toFixed(3)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${profile.bg} ${profile.color}`}>
                            {profile.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-right font-bold text-slate-900 text-lg">
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
