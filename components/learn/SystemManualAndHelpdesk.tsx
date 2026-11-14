import React, { useMemo, useState } from 'react';
import Markdown from 'react-markdown';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  LifeBuoy,
  MessageSquare,
  RotateCcw,
  Search,
  Send,
} from 'lucide-react';
import {
  DIAGNOSTIC_FAQS,
  PLATFORM_SECTIONS,
  PlatformSectionInfo,
  Topic,
} from './protocolData';
import { ProtocolHeader, StatusIndicator } from './ProtocolShared';

export const SystemManualSection: React.FC<{ onJumpTopic: (t: Topic) => void }> = ({
  onJumpTopic,
}) => {
  const [groupFilter, setGroupFilter] = useState<'All' | PlatformSectionInfo['group']>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLATFORM_SECTIONS.filter((sec) => {
      const matchGroup = groupFilter === 'All' || sec.group === groupFilter;
      const matchText =
        !q ||
        sec.label.toLowerCase().includes(q) ||
        sec.description.toLowerCase().includes(q) ||
        sec.updates.toLowerCase().includes(q);
      return matchGroup && matchText;
    });
  }, [groupFilter, query]);

  return (
    <div className="space-y-6">
      <ProtocolHeader
        badge="SOP-06 • Platform Architecture"
        badgeTone="indigo"
        title="Diffraction Suite Module Reference"
        subtitle="Browse analytical physics engines, line-profile broadening methods, and structural refinement workflows available across the workspace."
        rightSlot={
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter modules..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {(['All', 'Fundamentals', 'Size & Strain', 'Advanced Sim', 'Intelligence'] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroupFilter(g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
              groupFilter === g
                ? 'bg-slate-900 dark:bg-indigo-600 text-white border-transparent'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((sec) => (
          <div
            key={sec.id}
            className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {sec.group}
                </span>
                <StatusIndicator
                  tone={sec.status === 'validated' ? 'nominal' : sec.status === 'enhanced' ? 'warning' : 'neutral'}
                  label={sec.status}
                />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-500 shrink-0" />
                <span>{sec.label}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {sec.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {sec.updates}
              </span>
              {sec.jumpTopic && (
                <button
                  type="button"
                  onClick={() => onJumpTopic(sec.jumpTopic!)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                >
                  Open SOP <ArrowRight size={11} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DiagnosticHelpdeskSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categories = ['All', ...Array.from(new Set(DIAGNOSTIC_FAQS.map((f) => f.category)))];

  const items =
    selectedCategory === 'All'
      ? DIAGNOSTIC_FAQS
      : DIAGNOSTIC_FAQS.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-6">
      <ProtocolHeader
        badge="SOP-07 • Failure Diagnostics"
        badgeTone="rose"
        title="Diffraction Artifact & Convergence Troubleshooting"
        subtitle="Rapidly isolate instrumentation errors, Fourier hook effects, negative Williamson-Hall slopes, and least-squares Jacobian divergence."
      />

      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-[10px] font-mono font-bold uppercase text-rose-700 dark:text-rose-400">
                {item.category}
              </span>
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-500"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-start gap-2">
              <LifeBuoy size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <span>{item.q}</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
                  <AlertTriangle size={12} /> Quantitative Check
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.check}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
                  <CheckCircle2 size={12} /> Corrective Protocol
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.fix}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ChatTurn {
  role: 'user' | 'advisor';
  text: string;
}

const ADVISOR_PRESETS = [
  'How should I separate specimen height displacement from zero-shift error in Cohen least-squares refinement?',
  'When does the Halder-Wagner Size-Strain plot outperform a standard Williamson-Hall UDM regression?',
  'Explain how Brindley microabsorption affects Quantitative Phase Analysis between magnetite and quartz.',
];

export const PhysicsAdvisorSection: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submitQuery = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || loading) return;
    setErrorMsg(null);
    setHistory((prev) => [...prev, { role: 'user', text: trimmed }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        setHistory((prev) => [...prev, { role: 'advisor', text: data.text }]);
      } else {
        setErrorMsg(data.error || 'Advisor service did not return a valid answer.');
      }
    } catch {
      setErrorMsg('Unable to reach the physics advisor endpoint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProtocolHeader
        badge="SOP-08 • Crystallography Consultation"
        badgeTone="cyan"
        title="X-Ray Diffraction & Crystallography Advisor"
        subtitle="Consult the diffraction knowledge engine for space-group selection rules, Rietveld divergence debugging, or experimental calibration guidance."
        rightSlot={
          history.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setHistory([]);
                setErrorMsg(null);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
            >
              <RotateCcw size={12} /> Clear Session
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        {ADVISOR_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => submitQuery(p)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 text-left text-xs text-slate-700 dark:text-slate-300 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 min-h-[260px] max-h-[460px] overflow-y-auto">
        {history.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
            <MessageSquare className="w-7 h-7 text-cyan-500" />
            <p className="text-xs font-mono">
              Select a diagnostic preset above or submit a technical diffraction query below.
            </p>
          </div>
        ) : (
          history.map((turn, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border ${
                turn.role === 'user'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-500/30 ml-8'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 mr-8'
              }`}
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                {turn.role === 'user' ? 'Researcher Query' : 'Crystallography Response'}
              </span>
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                <Markdown>{turn.text}</Markdown>
              </div>
            </div>
          ))
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuery(question);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about Miller extinctions, Rietveld constraints, or strain deconvolution..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Send size={13} />
          {loading ? 'Analyzing...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};
