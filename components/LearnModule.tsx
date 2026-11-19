import React, { useMemo, useState } from 'react';
import { useCustomMaterialApply } from './CustomMaterialContext';
import {
  ArrowRight,
  Award,
  BookOpen,
  Box,
  Calculator,
  ChevronRight,
  Database,
  FileCode,
  LifeBuoy,
  MessageSquare,
  Percent,
  Rocket,
  Search,
} from 'lucide-react';
import { UnitCellsSection } from './fundamentals/UnitCellsSection';
import { ProtocolSubTab, Topic } from './learn/protocolData';
import { RietveldProtocolSection } from './learn/RietveldProtocolSection';
import { DataSandboxSection, PolymerCrystallinitySection, SolversSection } from './learn/SandboxAndSolversSection';
import { LAB_CHECKLIST_STEPS, SopDisplacementSection } from './learn/SopDisplacementSection';
import {
  DiagnosticHelpdeskSection,
  PhysicsAdvisorSection,
  SystemManualSection,
} from './learn/SystemManualAndHelpdesk';

interface TopicDef {
  id: Topic;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const TOPICS: TopicDef[] = [
  { id: 'start', label: 'Refinement Roadmap', sublabel: 'SOP & Optical Displacement', icon: <Rocket size={15} /> },
  { id: 'unit_cells', label: 'Unit Cells & Lattices', sublabel: '14 Bravais & Symmetry', icon: <Box size={15} /> },
  { id: 'system_overview', label: 'System Manual', sublabel: 'Full Module Directory', icon: <BookOpen size={15} /> },
  { id: 'input', label: 'Data Format Sandbox', sublabel: 'XY / XYE Parser & QC', icon: <Database size={15} /> },
  { id: 'generators', label: 'Scherrer & Bragg Lab', sublabel: 'IRF Deconvolution Solvers', icon: <Calculator size={15} /> },
  { id: 'polymer_calc', label: 'Polymer Crystallinity', sublabel: 'WAXS Halo Separation', icon: <Percent size={15} /> },
  { id: 'rietveld_protocol', label: 'Rietveld & Symmetry SOP', sublabel: 'Locks, Orbits, QPA, SDK', icon: <FileCode size={15} /> },
  { id: 'troubleshoot', label: 'Diagnostic Helpdesk', sublabel: 'Refinement & Fit Triage', icon: <LifeBuoy size={15} /> },
  { id: 'ai_advisor', label: 'Physics Advisor', sublabel: 'Diffraction Query Console', icon: <MessageSquare size={15} /> },
];

const SUBTAB_SEARCH_SHORTCUTS: { label: string; sublabel: string; subTab: ProtocolSubTab; keywords: string }[] = [
  { label: 'Sequential Locks', sublabel: 'Gate 1→5 Rietveld workflow', subTab: 'checklist', keywords: 'locks gates convergence' },
  { label: 'Symmetry Operations', sublabel: 'Seitz matrix & F_sym(hkl)', subTab: 'symmetry', keywords: 'seitz matrix wyckoff extinction' },
  { label: 'Hill-Howard QPA', sublabel: 'ZMV phase weight quantification', subTab: 'qpa', keywords: 'qpa hill howard zmv density' },
  { label: 'Caglioti FWHM Curve', sublabel: 'U tan2 V tan W instrument profile', subTab: 'caglioti', keywords: 'caglioti uvw fwhm resolution' },
  { label: 'March-Dollase Texture', sublabel: 'Preferred orientation r correction', subTab: 'preferred', keywords: 'march dollase texture preferred' },
  { label: 'Python SDK & GSAS-II', sublabel: 'Executable refinement scripts', subTab: 'python', keywords: 'python scipy gsas2 script' },
];

export const LearnModule: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<Topic>('start');
  const [activeSubTab, setActiveSubTab] = useState<ProtocolSubTab>('checklist');
  const [searchTerm, setSearchTerm] = useState('');

  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem('xrd_sop_checklist_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === LAB_CHECKLIST_STEPS.length) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default false vector
    }
    return new Array(LAB_CHECKLIST_STEPS.length).fill(false);
  });

  const [dispHeight, setDispHeight] = useState(0.08);
  const [gonioRadius, setGonioRadius] = useState(240);
  const [dispThetaTrue, setDispThetaTrue] = useState(28.443);

  useCustomMaterialApply('learn', (mat) => {
    const strongest = [...mat.peaks].sort((a, b) => b.intensity - a.intensity)[0] || mat.peaks[0];
    if (strongest) {
      setDispThetaTrue(Number(strongest.twoTheta.toFixed(3)));
    }
  });

  const toggleChecklist = (idx: number) => {
    setChecklist((prev) => {
      const next = prev.map((v, i) => (i === idx ? !v : v));
      try {
        localStorage.setItem('xrd_sop_checklist_v1', JSON.stringify(next));
      } catch {
        // Ignore storage errors in restricted iframes
      }
      return next;
    });
  };

  const resetChecklist = () => {
    const clean = new Array(LAB_CHECKLIST_STEPS.length).fill(false);
    setChecklist(clean);
    try {
      localStorage.setItem('xrd_sop_checklist_v1', JSON.stringify(clean));
    } catch {
      // Ignore storage errors
    }
  };

  const checklistScore = Math.round(
    (checklist.filter(Boolean).length / LAB_CHECKLIST_STEPS.length) * 100
  );

  const checklistParams = useMemo(() => {
    const count = checklist.filter(Boolean).length;
    const map = [
      { rFactor: 42.5, rBragg: 28.4, chi2: 6.8, converged: false },
      { rFactor: 29.1, rBragg: 18.2, chi2: 4.5, converged: false },
      { rFactor: 21.4, rBragg: 13.0, chi2: 3.1, converged: false },
      { rFactor: 15.2, rBragg: 8.9, chi2: 2.2, converged: false },
      { rFactor: 10.6, rBragg: 5.4, chi2: 1.6, converged: false },
      { rFactor: 8.1, rBragg: 3.8, chi2: 1.25, converged: false },
      { rFactor: 6.4, rBragg: 2.9, chi2: 1.08, converged: true },
    ];
    return map[count] ?? map[0];
  }, [checklist]);

  const filteredTopics = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return TOPICS;
    return TOPICS.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.sublabel.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const filteredShortcuts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return SUBTAB_SEARCH_SHORTCUTS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.sublabel.toLowerCase().includes(q) ||
        s.keywords.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const activeIdx = TOPICS.findIndex((t) => t.id === activeTopic);
  const prevTopic = activeIdx > 0 ? TOPICS[activeIdx - 1] : null;
  const nextTopic = activeIdx < TOPICS.length - 1 ? TOPICS[activeIdx + 1] : null;

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar Navigation */}
      <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                Protocol Guide
              </span>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                XRD SOP Handbook
              </h1>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
              <Award size={12} className="text-indigo-500" />
              <span>{checklistScore}% SOP</span>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search SOPs, Caglioti, QPA..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          <nav className="space-y-1">
            {filteredTopics.map((t) => {
              const active = activeTopic === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTopic(t.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 border transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-transparent text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={active ? 'text-white' : 'text-slate-400'}>{t.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{t.label}</p>
                      <p
                        className={`text-[10px] truncate ${
                          active ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {t.sublabel}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={13} className={active ? 'text-white shrink-0' : 'text-slate-400 shrink-0'} />
                </button>
              );
            })}

            {filteredShortcuts.length > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 block">
                  Rietveld Kernel Shortcuts
                </span>
                {filteredShortcuts.map((s) => (
                  <button
                    key={s.subTab}
                    type="button"
                    onClick={() => {
                      setActiveTopic('rietveld_protocol');
                      setActiveSubTab(s.subTab);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 hover:border-amber-400 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{s.sublabel}</p>
                    </div>
                    <ArrowRight size={12} className="text-amber-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main className="lg:col-span-9 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7">
          {activeTopic === 'start' && (
            <SopDisplacementSection
              checklist={checklist}
              onToggleChecklist={toggleChecklist}
              onResetChecklist={resetChecklist}
              dispHeight={dispHeight}
              setDispHeight={setDispHeight}
              gonioRadius={gonioRadius}
              setGonioRadius={setGonioRadius}
              dispThetaTrue={dispThetaTrue}
              setDispThetaTrue={setDispThetaTrue}
              checklistParams={checklistParams}
            />
          )}

          {activeTopic === 'unit_cells' && <UnitCellsSection />}
          {activeTopic === 'system_overview' && <SystemManualSection onJumpTopic={setActiveTopic} />}
          {activeTopic === 'input' && <DataSandboxSection />}
          {activeTopic === 'generators' && <SolversSection />}
          {activeTopic === 'polymer_calc' && <PolymerCrystallinitySection />}
          {activeTopic === 'rietveld_protocol' && (
            <RietveldProtocolSection activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
          )}
          {activeTopic === 'troubleshoot' && <DiagnosticHelpdeskSection />}
          {activeTopic === 'ai_advisor' && <PhysicsAdvisorSection />}
        </div>

        {/* Bottom Prev/Next Directive Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          {prevTopic ? (
            <button
              type="button"
              onClick={() => setActiveTopic(prevTopic.id)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition-colors"
            >
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Previous Directive</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">← {prevTopic.label}</span>
            </button>
          ) : (
            <div />
          )}

          {nextTopic && (
            <button
              type="button"
              onClick={() => setActiveTopic(nextTopic.id)}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-right transition-colors ml-auto"
            >
              <span className="text-[10px] font-mono uppercase text-slate-300 dark:text-indigo-200 block">
                Next Directive
              </span>
              <span className="text-xs font-bold flex items-center gap-1.5 justify-end">
                {nextTopic.label} <ArrowRight size={13} />
              </span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
