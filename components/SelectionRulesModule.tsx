import React, { useState, useEffect } from 'react';
import { CrystalSystem, SelectionRuleResult } from '../types';
import { parseHKLString, validateSelectionRule } from '../utils/physics';

export const SelectionRulesModule: React.FC = () => {
  const [system, setSystem] = useState<CrystalSystem>('FCC');
  const [hklInput, setHklInput] = useState<string>('1 0 0, 1 1 0, 1 1 1, 2 0 0, 2 1 0, 2 2 0, 3 1 1');
  const [results, setResults] = useState<SelectionRuleResult[]>([]);

  const handleValidate = () => {
    const hklList = parseHKLString(hklInput);
    const validationResults = hklList.map(hkl => validateSelectionRule(system, hkl));
    setResults(validationResults);
  };

  useEffect(() => {
    handleValidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system]); // Auto-revalidate when system changes

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Input Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Crystal System
              </label>
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value as CrystalSystem)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors bg-white"
              >
                <option value="SC">Simple Cubic (SC)</option>
                <option value="BCC">Body Centered Cubic (BCC)</option>
                <option value="FCC">Face Centered Cubic (FCC)</option>
                <option value="Diamond">Diamond Cubic</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                {system === 'SC' && "All reflections are allowed."}
                {system === 'BCC' && "Allowed if (h + k + l) is even."}
                {system === 'FCC' && "Allowed if indices are all odd or all even."}
                {system === 'Diamond' && "FCC rules + for all-even, (h+k+l) must be divisible by 4."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                (h k l) List
              </label>
              <textarea
                value={hklInput}
                onChange={(e) => setHklInput(e.target.value)}
                placeholder="e.g. 1 0 0, 1 1 0, 1 1 1"
                className="w-full h-48 px-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter triplets of integers. Separators (space, comma) are flexible.
              </p>
            </div>

            <button
              onClick={handleValidate}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Check Allowed Reflections
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="p-4 border-b border-slate-300 bg-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Validation Results</h3>
            <div className="flex gap-2">
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                Allowed: {results.filter(r => r.status === 'Allowed').length}
              </span>
              <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-1 rounded-full">
                Forbidden: {results.filter(r => r.status === 'Forbidden').length}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1">
            {results.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                Enter (hkl) indices to see results
              </div>
            ) : (
              <table className="w-full text-sm text-left text-slate-800">
                <thead className="text-xs text-slate-900 uppercase bg-slate-200 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">Reflection (h k l)</th>
                    <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">Status</th>
                    <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.map((res, index) => (
                    <tr key={index} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono font-bold text-slate-900">
                        ({res.hkl.join(' ')})
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          res.status === 'Allowed' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-700 font-medium">
                        {res.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
