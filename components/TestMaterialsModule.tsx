
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
  },
  {
    name: 'Titanium Dioxide (Rutile)',
    formula: 'TiO2',
    wavelength: 1.5406,
    peaks: [27.44, 36.08, 39.18, 41.22, 44.05, 54.31, 56.62, 62.73, 64.03, 68.99],
    hkls: ['110', '101', '200', '111', '210', '211', '220', '002', '310', '301'],
    description: 'High pressure/temperature polymorph of titania, tetragonal structure.',
    category: 'Ceramic'
  },
  {
    name: 'Titanium Dioxide (Anatase)',
    formula: 'TiO2',
    wavelength: 1.5406,
    peaks: [25.28, 37.80, 48.05, 53.89, 55.06, 62.69, 68.76, 70.31, 75.03],
    hkls: ['101', '004', '200', '105', '211', '204', '116', '220', '215'],
    description: 'Metastable titania polymorph, common in nanomaterials and photocatalysis.',
    category: 'Ceramic'
  },
  {
    name: 'Graphite',
    formula: 'C',
    wavelength: 1.5406,
    peaks: [26.54, 42.43, 44.59, 54.67, 77.54],
    hkls: ['002', '100', '101', '004', '110'],
    description: 'Hexagonal layered carbon structure, highly anisotropic thermal properties.',
    category: 'Standard'
  },
  {
    name: 'Sodium Chloride',
    formula: 'NaCl',
    wavelength: 1.5406,
    peaks: [27.35, 31.69, 45.45, 53.89, 56.48, 66.23, 75.31],
    hkls: ['111', '200', '220', '311', '222', '400', '420'],
    description: 'Standard rock salt structure, essential for teaching ionic crystals.',
    category: 'Standard'
  },
  {
    name: 'Copper',
    formula: 'Cu',
    wavelength: 1.5406,
    peaks: [43.30, 50.43, 74.13, 89.93, 116.92],
    hkls: ['111', '200', '220', '311', '400'],
    description: 'High conductivity FCC metal, common industrial substrate.',
    category: 'Metal'
  },
  {
    name: 'Silver',
    formula: 'Ag',
    wavelength: 1.5406,
    peaks: [38.12, 44.30, 64.44, 77.40, 81.54],
    hkls: ['111', '200', '220', '311', '222'],
    description: 'FCC structure with high reflectivity, useful for plasmonics.',
    category: 'Metal'
  },
  {
    name: 'Zinc Oxide',
    formula: 'ZnO',
    wavelength: 1.5406,
    peaks: [31.77, 34.42, 36.25, 47.54, 56.60, 62.86, 66.38, 67.96, 69.10],
    hkls: ['100', '002', '101', '102', '110', '103', '200', '112', '201'],
    description: 'Wurtzite structure semiconductor, important in optoelectronics.',
    category: 'Ceramic'
  },
  {
    name: 'Quartz (Alpha)',
    formula: 'SiO2',
    wavelength: 1.5406,
    peaks: [20.86, 26.64, 36.54, 39.46, 40.29, 42.45, 45.79, 50.14, 54.87, 59.95, 60.14],
    hkls: ['100', '101', '110', '102', '111', '200', '201', '112', '202', '211', '103'],
    description: 'Trigonal P3_221 structure, the most common crustal mineral.',
    category: 'Ceramic'
  },
  {
    name: 'Diamond',
    formula: 'C',
    wavelength: 1.5406,
    peaks: [43.92, 75.30, 91.50, 119.52],
    hkls: ['111', '220', '311', '400'],
    description: 'Face-centered cubic (diamond cubic) lattice, the hardest natural material.',
    category: 'Standard'
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
