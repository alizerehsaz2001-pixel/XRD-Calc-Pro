
import React from 'react';
import { FlaskConical, Zap, ChevronRight, Database, Info } from 'lucide-react';

interface MaterialPreset {
  name: string;
  formula: string;
  wavelength: number;
  peaks: number[];
  hkls: string[];
  description: string;
  category: 'Standard' | 'Metal' | 'Ceramic';
}

const PRESETS: MaterialPreset[] = [
  {
    name: 'Silicon Standard',
    formula: 'Si',
    wavelength: 1.5406,
    peaks: [28.442, 47.302, 56.123, 69.131, 76.38, 88.03, 94.89],
    hkls: ['111', '220', '311', '400', '331', '422', '511'],
    description: 'Internal standard for peak position and line-broadening calibration.',
    category: 'Standard'
  },
  {
    name: 'Aluminum',
    formula: 'Al',
    wavelength: 1.5406,
    peaks: [38.47, 44.72, 65.10, 78.23, 82.44],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'FCC metal with high symmetry, often used to demonstrate cubic indexing.',
    category: 'Metal'
  },
  {
    name: 'Gold Powder',
    formula: 'Au',
    wavelength: 1.5406,
    peaks: [38.19, 44.39, 64.58, 77.55, 81.72],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'Highly stable FCC metal, excellent for lattice parameter determination.',
    category: 'Metal'
  },
  {
    name: 'Alpha Iron',
    formula: 'Fe',
    wavelength: 1.5406,
    peaks: [44.67, 65.02, 82.33, 98.94],
    hkls: ['110', '200', '211', '220'],
    description: 'BCC structure (Ferrite), fundamental in metallurgy studies.',
    category: 'Metal'
  },
  {
    name: 'Cerium Oxide',
    formula: 'CeO2',
    wavelength: 1.5406,
    peaks: [28.55, 33.08, 47.48, 56.33, 59.08, 69.41, 76.70, 79.07],
    hkls: ['111', '200', '220', '311', '222', '400', '331', '420'],
    description: 'Fluorite structure ceramic, widely used in catalysis and electrolytes.',
    category: 'Ceramic'
  }
];

interface TestMaterialsModuleProps {
  onLoadMaterial: (peaks: number[], wavelength: number, hkls: string[], name: string) => void;
}

export const TestMaterialsModule: React.FC<TestMaterialsModuleProps> = ({ onLoadMaterial }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
          <FlaskConical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Test Materials</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Reference Presets</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
        Select a reference material to automatically populate the calculator parameters for validation.
      </p>

      <div className="space-y-3">
        {PRESETS.map((material) => (
          <button
            key={material.name}
            onClick={() => onLoadMaterial(material.peaks, material.wavelength, material.hkls, material.name)}
            className="w-full group flex flex-col p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 translate-x-1 group-hover:translate-x-0 transition-transform" />
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {material.name}
                </span>
                <span className="ml-2 text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                  {material.formula}
                </span>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                material.category === 'Standard' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                material.category === 'Metal' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
              }`}>
                {material.category}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
              {material.description}
            </p>

            <div className="flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-500">
                  <Zap className="w-3 h-3" /> λ={material.wavelength}
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-500">
                  <Database className="w-3 h-3" /> {material.peaks.length} Peaks
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-all group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 mt-0.5" />
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
          These presets use Cu K-alpha (1.5406 Å) radiation by default. Values are based on standard NIST and COD reference data.
        </p>
      </div>
    </div>
  );
};
