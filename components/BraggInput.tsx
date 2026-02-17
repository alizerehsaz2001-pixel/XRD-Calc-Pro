
import React from 'react';

interface BraggInputProps {
  wavelength: number;
  setWavelength: (val: number) => void;
  rawPeaks: string;
  setRawPeaks: (val: string) => void;
  onCalculate: () => void;
}

export const BraggInput: React.FC<BraggInputProps> = ({
  wavelength,
  setWavelength,
  rawPeaks,
  setRawPeaks,
  onCalculate
}) => {
  const standardWavelengths = [
    { label: 'Cu Kα', value: 1.5406 },
    { label: 'Mo Kα', value: 0.7107 },
    { label: 'Co Kα', value: 1.7890 },
    { label: 'Fe Kα', value: 1.9360 },
    { label: 'Cr Kα', value: 2.2897 },
    { label: 'Ag Kα', value: 0.5594 },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Parameters
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Wavelength (Å)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.0001"
              value={wavelength}
              onChange={(e) => setWavelength(parseFloat(e.target.value))}
              className="w-full px-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors font-bold font-mono"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs font-bold">
              Å
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {standardWavelengths.map((sw) => (
              <button 
                key={sw.label}
                onClick={() => setWavelength(sw.value)}
                className={`px-2 py-1.5 text-[10px] rounded border transition-all font-bold ${
                  wavelength === sw.value 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sw.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            2θ Peaks (Degrees)
          </label>
          <textarea
            value={rawPeaks}
            onChange={(e) => setRawPeaks(e.target.value)}
            placeholder="e.g., 28.4, 47.3, 56.1"
            className="w-full h-32 px-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors font-mono text-sm leading-relaxed"
          />
          <p className="text-xs text-slate-500 mt-1">
            Separate values with commas or spaces.
          </p>
        </div>

        <button
          onClick={onCalculate}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          Calculate Parameters
        </button>
      </div>
    </div>
  );
};
