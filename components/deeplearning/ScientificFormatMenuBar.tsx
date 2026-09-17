import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Layers,
  Sparkles,
  BookOpen,
  Trash2,
  Check,
  Tag,
  HelpCircle,
  Copy,
  ChevronDown,
  Info,
  Microscope,
  Cpu,
  Hash,
  Activity,
  Sliders,
  ShieldCheck,
  Code2,
  Atom,
  ArrowRight,
  Database,
  Zap
} from 'lucide-react';

export interface FormatPreset {
  id: string;
  name: string;
  shortLabel: string;
  category: 'raw' | 'indexed' | 'profile' | 'calibrant';
  columns: string[];
  schema: string;
  headerComment: string;
  description: string;
  physicsAdvantage: string;
  badge: string;
  badgeColor: string;
  icon: any;
  sampleData: string;
}

export const FORMAT_PRESETS: FormatPreset[] = [
  {
    id: '2col',
    name: '2-Col XY (2θ, Intensity)',
    shortLabel: '2-Col XY',
    category: 'raw',
    columns: ['2θ (deg)', 'Intensity (a.u.)'],
    schema: '[Col 1: 2θ, Col 2: I]',
    headerComment: '# 2-Column XY Format: 2θ (deg), Intensity (a.u.)',
    description: 'Standard two-column powder diffractogram containing raw Bragg peak positions and relative/absolute intensities.',
    physicsAdvantage: 'Direct neural peak matching and candidate phase space searching.',
    badge: 'Raw 2θ/I',
    badgeColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    icon: Activity,
    sampleData: `# Standard 2-Column XRD Pattern
# 2θ (deg), Intensity (a.u.)
28.44, 100.0
47.30, 55.0
56.12, 30.0
69.13, 8.0
76.38, 12.0
88.03, 16.0
94.95, 6.0
106.71, 7.0`
  },
  {
    id: '5col',
    name: '5-Col (2θ, I, h, k, l)',
    shortLabel: '5-Col (2θ, I, h, k, l)',
    category: 'indexed',
    columns: ['2θ (deg)', 'Intensity (a.u.)', 'h', 'k', 'l'],
    schema: '[Col 1: 2θ, Col 2: I, Col 3: h, Col 4: k, Col 5: l]',
    headerComment: '# 5-Column Format: 2θ (deg), Intensity (a.u.), h, k, l',
    description: 'Full Miller index decomposition of diffraction reflections for precise space-group extinction verification.',
    physicsAdvantage: '+25% candidate confidence scoring via explicit crystallographic lattice plane constraints.',
    badge: 'Miller (hkl)',
    badgeColor: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    icon: Hash,
    sampleData: `# 5-Column Crystallographic Dataset with Miller Indices
# 2θ (deg), Intensity (a.u.), h, k, l
28.44, 100.0, 1, 1, 1
47.30, 55.0, 2, 2, 0
56.12, 30.0, 3, 1, 1
69.13, 8.0, 4, 0, 0
76.38, 12.0, 3, 3, 1
88.03, 16.0, 4, 2, 2
94.95, 6.0, 5, 1, 1
106.71, 7.0, 4, 4, 0`
  },
  {
    id: '3col',
    name: '3-Col (2θ, I, (hkl))',
    shortLabel: '3-Col (hkl)',
    category: 'indexed',
    columns: ['2θ (deg)', 'Intensity (a.u.)', '(h k l) tuple'],
    schema: '[Col 1: 2θ, Col 2: I, Col 3: (h k l)]',
    headerComment: '# 3-Column Format: 2θ (deg), Intensity (a.u.), (h k l)',
    description: 'Convenient 3-column syntax with parenthesized or space-separated Miller index tuples (e.g. "(1 1 1)").',
    physicsAdvantage: 'High interoperability with JCPDS/ICDD card tables and legacy CIF exports.',
    badge: 'Tuple (hkl)',
    badgeColor: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
    icon: Layers,
    sampleData: `# 3-Column XRD Pattern with (hkl) Plane Labels
# 2θ (deg), Intensity (a.u.), (h k l)
28.44, 100.0, (1 1 1)
47.30, 55.0, (2 2 0)
56.12, 30.0, (3 1 1)
69.13, 8.0, (4 0 0)
76.38, 12.0, (3 3 1)
88.03, 16.0, (4 2 2)`
  },
  {
    id: 'fwhm_profile',
    name: 'Full Profile (2θ, I, h, k, l, FWHM)',
    shortLabel: 'Full Profile (FWHM)',
    category: 'profile',
    columns: ['2θ (deg)', 'Intensity (a.u.)', 'h', 'k', 'l', 'FWHM β (deg)'],
    schema: '[Col 1: 2θ, Col 2: I, Col 3: h, Col 4: k, Col 5: l, Col 6: FWHM]',
    headerComment: '# Full Profile Format: 2θ (deg), Intensity (a.u.), h, k, l, FWHM (deg)',
    description: 'Complete microstructure diffractogram recording observed peak breadths (FWHM β in 2θ degrees).',
    physicsAdvantage: 'Enables automatic Scherrer crystallite size calculation and Williamson-Hall microstrain modeling.',
    badge: 'FWHM Breadth',
    badgeColor: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    icon: Sliders,
    sampleData: `# Full Crystallographic Profile: 2θ (deg), Intensity (a.u.), h, k, l, FWHM (deg)
28.442, 100.0, 1, 1, 1, 0.125
47.304, 55.0, 2, 2, 0, 0.142
56.123, 30.0, 3, 1, 1, 0.158
69.131, 8.0, 4, 0, 0, 0.176
76.377, 12.0, 3, 3, 1, 0.192
88.032, 16.0, 4, 2, 2, 0.218`
  },
  {
    id: 'lab6_srm',
    name: 'LaB₆ SRM 660 (NIST Calibrant)',
    shortLabel: 'LaB₆ SRM 660',
    category: 'calibrant',
    columns: ['2θ (deg)', 'Intensity (a.u.)', 'h', 'k', 'l'],
    schema: '[NIST Certified Lanthanum Hexaboride SRM 660c]',
    headerComment: '# NIST SRM 660c LaB6 Hexaboride Standard Reflections: 2θ, Intensity, h, k, l',
    description: 'NIST Standard Reference Material 660c (Lanthanum Hexaboride, LaB₆, Cubic Pm-3m, a=4.156826 Å) certified line profile standard.',
    physicsAdvantage: 'Essential for instrumental resolution function (IRF) calibration and zero-angle shift alignment.',
    badge: 'NIST SRM 660c',
    badgeColor: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    icon: Microscope,
    sampleData: `# NIST SRM 660 LaB6 Hexaboride Standard Reflections
# 2θ (deg), Intensity (a.u.), h, k, l
21.36, 100.0, 1, 0, 0
30.38, 75.0, 1, 1, 0
37.44, 60.0, 1, 1, 1
43.51, 45.0, 2, 0, 0
48.96, 50.0, 2, 1, 0
53.99, 35.0, 2, 1, 1
63.26, 30.0, 2, 2, 0`
  }
];

export interface ScientificFormatMenuBarProps {
  inputData: string;
  setInputData: (data: string) => void;
  selectedFormat: string;
  setSelectedFormat: (formatId: string) => void;
  showFormatGuide: boolean;
  setShowFormatGuide: (show: boolean) => void;
  playSynthTone: (tone: any) => void;
  formatSuccessInfo?: any;
  formatErrorLog?: string | null;
}

export const ScientificFormatMenuBar: React.FC<ScientificFormatMenuBarProps> = ({
  inputData,
  setInputData,
  selectedFormat,
  setSelectedFormat,
  showFormatGuide,
  setShowFormatGuide,
  playSynthTone,
  formatSuccessInfo,
  formatErrorLog
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Handle format logic switch without replacing user data
  const handleSelectFormatLogic = (preset: FormatPreset) => {
    setSelectedFormat(preset.id);
    playSynthTone('switch');
  };

  // Handle explicit demo data injection
  const handleInjectSampleData = (preset: FormatPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFormat(preset.id);
    setInputData(preset.sampleData);
    playSynthTone('success');
  };

  const activePreset = FORMAT_PRESETS.find((p) => p.id === selectedFormat) || FORMAT_PRESETS[0];

  return (
    <div className="w-full space-y-2 mb-3">
      {/* 1. SCIENTIFIC FORMAT CONSOLE BAR */}
      <div className="bg-slate-900/90 dark:bg-[#070D1B]/95 rounded-xl border border-slate-700/80 dark:border-indigo-500/20 shadow-xl overflow-hidden backdrop-blur-xl">
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-black/40 border-b border-white/5 gap-2">
          {/* Left Title with Scientific Icon & Active Schema Indication */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Load Format:
              </span>
              <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Active Logic: {activePreset.shortLabel}
              </span>
            </div>
          </div>

          {/* Right Controls: Guide Toggle & Demo loader */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowFormatGuide(!showFormatGuide);
                playSynthTone('switch');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                showFormatGuide
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{showFormatGuide ? 'Close Specs' : 'Format Guide & Specs'}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showFormatGuide ? 'rotate-180' : ''}`}
              />
            </button>

            {inputData && (
              <button
                type="button"
                onClick={() => {
                  setInputData('');
                  playSynthTone('switch');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                title="Clear input buffer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Scientific Format Presets Segmented Menu */}
        <div className="p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {FORMAT_PRESETS.map((preset) => {
            const PresetIcon = preset.icon;
            const isSelected = selectedFormat === preset.id;

            return (
              <div
                key={preset.id}
                onClick={() => handleSelectFormatLogic(preset)}
                className={`group relative flex flex-col p-2.5 rounded-lg border text-left rtl:text-right transition-all duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-900/70 via-slate-900 to-[#070D1B] border-indigo-400/80 text-white shadow-lg shadow-indigo-950/60 ring-2 ring-indigo-500/30'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-slate-500 text-slate-300 hover:text-white'
                }`}
              >
                {/* Top Row: Icon, Label, and Active Status */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={`p-1 rounded shrink-0 ${
                        isSelected
                          ? 'bg-indigo-500 text-white shadow-sm'
                          : 'bg-black/30 text-slate-400 group-hover:text-indigo-300'
                      }`}
                    >
                      <PresetIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11.5px] font-mono font-bold truncate">
                      {preset.shortLabel}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  )}
                </div>

                {/* Subtext: Active Schema Badge & Sample Loader button */}
                <div className="flex items-center justify-between text-[9.5px] font-mono mt-1 gap-1">
                  <span
                    className={`px-1.5 py-0.5 rounded border font-bold truncate max-w-[110px] ${preset.badgeColor}`}
                  >
                    {preset.badge}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleInjectSampleData(preset, e)}
                    title="Load sample reflections for this format"
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 hover:bg-indigo-500/30 text-slate-400 hover:text-indigo-200 border border-white/10 text-[9px] font-sans font-semibold transition-all shrink-0"
                  >
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    <span>Demo</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. COLLAPSIBLE SCIENTIFIC FORMAT SPECIFICATION CONSOLE */}
      <AnimatePresence>
        {showFormatGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-[#050A16] border border-indigo-500/40 rounded-xl space-y-4 text-xs font-mono text-slate-300 shadow-2xl">
              {/* Modal/Console Title Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Microscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-indigo-200 flex items-center gap-2">
                      <span>Diffraction Data Ingestion & Syntax Matrix</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        ISO / CIF / ICDD Standard
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Auto-detects delimiter formats: Comma-Separated (CSV), Tab-Separated (TSV), and Space-Delimited.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFormatGuide(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <span className="text-xs font-sans px-1.5">Close ✕</span>
                  </button>
                </div>
              </div>

              {/* 3-Column Detailed Format Specification Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. 2-Col Format */}
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 relative group hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> 1. Standard 2-Col XY
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      [2θ, I]
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Essential 2-column diffractogram. Columns: <strong>$2\theta$ position (deg)</strong> and <strong>Intensity (a.u. / counts)</strong>.
                  </p>
                  <div className="bg-[#02050B] p-2.5 rounded-lg border border-slate-800 text-[11px] text-emerald-300 font-mono space-y-0.5">
                    <div className="text-[9.5px] text-slate-500 pb-1 border-b border-slate-800/80"># 2θ (deg), Intensity (a.u.)</div>
                    <div>28.44, 100.0</div>
                    <div>47.30, 55.0</div>
                    <div>56.12, 30.0</div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFormat('2col');
                        playSynthTone('switch');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-all"
                    >
                      Set 2-Col Logic
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleInjectSampleData(FORMAT_PRESETS[0], e)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>Demo</span>
                    </button>
                  </div>
                </div>

                {/* 2. 5-Col (hkl) Format */}
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 relative group hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> 2. Indexed 5-Col (hkl)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      [2θ, I, h, k, l]
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Direct Miller indices $(h, k, l)$. Boosts neural candidate classification certainty by <strong>+25%</strong>.
                  </p>
                  <div className="bg-[#02050B] p-2.5 rounded-lg border border-slate-800 text-[11px] text-cyan-300 font-mono space-y-0.5">
                    <div className="text-[9.5px] text-slate-500 pb-1 border-b border-slate-800/80"># 2θ, I, h, k, l</div>
                    <div>28.44, 100.0, 1, 1, 1</div>
                    <div>47.30, 55.0, 2, 2, 0</div>
                    <div>56.12, 30.0, 3, 1, 1</div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFormat('5col');
                        playSynthTone('switch');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-all"
                    >
                      Set 5-Col Logic
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleInjectSampleData(FORMAT_PRESETS[1], e)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>Demo</span>
                    </button>
                  </div>
                </div>

                {/* 3. Full Profile (FWHM) */}
                <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 relative group hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> 3. Full Profile (FWHM)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      [2θ, I, h, k, l, β]
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    Includes physical broadening (FWHM $\beta$ in deg) for simultaneous Scherrer & microstrain extraction.
                  </p>
                  <div className="bg-[#02050B] p-2.5 rounded-lg border border-slate-800 text-[11px] text-amber-300 font-mono space-y-0.5">
                    <div className="text-[9.5px] text-slate-500 pb-1 border-b border-slate-800/80"># 2θ, I, h, k, l, FWHM(deg)</div>
                    <div>28.442, 100, 1, 1, 1, 0.125</div>
                    <div>47.304, 55, 2, 2, 0, 0.142</div>
                    <div>56.123, 30, 3, 1, 1, 0.158</div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFormat('fwhm_profile');
                        playSynthTone('switch');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold transition-all"
                    >
                      Set Profile Logic
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleInjectSampleData(FORMAT_PRESETS[3], e)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Demo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scientific Syntax Rules Callout */}
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">
                    <strong>Syntax Rules:</strong> Header comments prefixed with{' '}
                    <code className="bg-black/50 px-1.5 py-0.5 rounded text-indigo-300 font-mono">#</code>,{' '}
                    <code className="bg-black/50 px-1.5 py-0.5 rounded text-indigo-300 font-mono">//</code>, or{' '}
                    <code className="bg-black/50 px-1.5 py-0.5 rounded text-indigo-300 font-mono">_loop_</code>{' '}
                    are auto-filtered. Miller planes formatted as{' '}
                    <code className="bg-black/50 px-1.5 py-0.5 rounded text-cyan-300 font-mono">(1 1 1)</code>{' '}
                    or <code className="bg-black/50 px-1.5 py-0.5 rounded text-cyan-300 font-mono">1,1,1</code> are parsed losslessly.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleInjectSampleData(FORMAT_PRESETS[4], e)}
                  className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-mono font-bold text-[10.5px] transition-colors"
                >
                  Load NIST SRM 660 Calibrant
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
