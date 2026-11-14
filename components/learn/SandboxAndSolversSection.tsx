import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Database,
  Download,
  Info,
  Percent,
  Target,
} from 'lucide-react';
import { ANODE_WAVELENGTHS, POLYMER_PRESETS } from './protocolData';
import { LatexInline, ProtocolHeader, StatusIndicator } from './ProtocolShared';

const FORMAT_PRESETS = [
  {
    label: 'Bragg Peak List (1-Col)',
    desc: '2θ degrees only',
    content: '# Standard Silicon peak list (Cu Ka1)\n28.443\n47.304\n56.122\n69.131\n76.377',
  },
  {
    label: 'FWHM Pairs (2-Col)',
    desc: '2θ (deg), β FWHM (deg)',
    content: '# 2theta (deg), Observed FWHM (deg)\n28.44, 0.145\n47.30, 0.162\n56.12, 0.178\n69.13, 0.194\n76.38, 0.211',
  },
  {
    label: 'Profile Scan (3-Col .xye)',
    desc: '2θ, Intensity, σ_error',
    content: '# 2theta  Counts   Sigma\n28.10   185     13.6\n28.25   420     20.5\n28.44   4850    69.6\n28.60   510     22.6\n28.80   190     13.8',
  },
];

export const DataSandboxSection: React.FC = () => {
  const [rawText, setRawText] = useState<string>(FORMAT_PRESETS[1].content);
  const [copiedPreset, setCopiedPreset] = useState<number | null>(null);

  const parsed = useMemo(() => {
    const lines = rawText.split(/\r?\n/);
    const rows: { lineNo: number; x: number; y?: number; err?: number }[] = [];
    const badLines: { lineNo: number; text: string }[] = [];
    let commentsSkipped = 0;

    lines.forEach((raw, idx) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('#') || trimmed.startsWith('!') || trimmed.startsWith('//')) {
        commentsSkipped++;
        return;
      }
      const tokens = trimmed.split(/[\s,;]+/).filter(Boolean);
      const nums = tokens.map((t) => Number(t));
      if (nums.length >= 1 && nums.every((n) => Number.isFinite(n))) {
        rows.push({
          lineNo: idx + 1,
          x: nums[0],
          y: nums[1],
          err: nums[2],
        });
      } else {
        badLines.push({ lineNo: idx + 1, text: trimmed });
      }
    });

    const isMonotonic = rows.every((r, i) => i === 0 || r.x > rows[i - 1].x);
    const minX = rows.length ? Math.min(...rows.map((r) => r.x)) : 0;
    const maxX = rows.length ? Math.max(...rows.map((r) => r.x)) : 0;
    const stepSum = rows.slice(1).reduce((acc, r, i) => acc + Math.abs(r.x - rows[i].x), 0);
    const meanStep = rows.length > 1 ? stepSum / (rows.length - 1) : 0;
    const colCount = rows.length ? (rows[0].err !== undefined ? 3 : rows[0].y !== undefined ? 2 : 1) : 0;

    return { rows, badLines, commentsSkipped, isMonotonic, minX, maxX, meanStep, colCount };
  }, [rawText]);

  const handleLoadPreset = (content: string, idx: number) => {
    setRawText(content);
    navigator.clipboard?.writeText(content);
    setCopiedPreset(idx);
    setTimeout(() => setCopiedPreset(null), 1500);
  };

  const handleDownloadXY = () => {
    const cleanXY = parsed.rows
      .map((r) => [r.x, r.y, r.err].filter((v) => v !== undefined).join('\t'))
      .join('\n');
    const blob = new Blob([cleanXY], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validated_diffraction.xy';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statusTone =
    parsed.rows.length === 0
      ? 'neutral'
      : parsed.badLines.length > 0
      ? 'critical'
      : !parsed.isMonotonic
      ? 'warning'
      : 'nominal';

  const statusLabel =
    parsed.rows.length === 0
      ? 'Awaiting Input Rows'
      : parsed.badLines.length > 0
      ? `${parsed.badLines.length} Parse Errors`
      : !parsed.isMonotonic
      ? 'Valid Rows (Non-Monotonic 2θ)'
      : `Valid ${parsed.colCount}-Column Dataset (${parsed.rows.length} rows)`;

  return (
    <div className="space-y-6">
      <ProtocolHeader
        badge="SOP-02 • Input Integrity"
        badgeTone="emerald"
        title="Diffraction Data Parser & Format Sandbox"
        subtitle="Validate ASCII diffraction files (.xy, .xye, CSV, peak tables) for numeric hygiene, monotonic 2θ ordering, and column structure prior to numerical analysis."
        rightSlot={
          <div className="flex items-center gap-2">
            <StatusIndicator tone={statusTone} label={statusLabel} />
            <button
              type="button"
              disabled={parsed.rows.length === 0}
              onClick={handleDownloadXY}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download size={13} /> Export Clean .XY
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-5 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Target size={13} className="text-emerald-500" /> Reference Format Presets
          </h3>
          <div className="space-y-2.5">
            {FORMAT_PRESETS.map((p, idx) => (
              <div
                key={idx}
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{p.label}</p>
                  <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">{p.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadPreset(p.content, idx)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  {copiedPreset === idx ? <Check size={12} /> : <Copy size={12} />}
                  {copiedPreset === idx ? 'Loaded' : 'Load'}
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-500/30 flex gap-3 items-start">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
              <span className="font-bold block mb-0.5">Angular Units Convention</span>
              All peak positions and FWHM breadths must be entered in degrees <span className="font-mono font-semibold">2θ</span> (not θ or radians). Comment headers starting with <span className="font-mono">#</span> or <span className="font-mono">!</span> are stripped automatically on export.
            </div>
          </div>
        </div>

        <div className="xl:col-span-7 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="validator-sandbox-text" className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Database size={13} className="text-emerald-500" /> ASCII Stream Buffer
            </label>
            <span className="text-[11px] font-mono text-slate-500">
              Supports space, tab, comma, or semicolon delimiters
            </span>
          </div>

          <textarea
            id="validator-sandbox-text"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="28.44, 0.145&#10;47.30, 0.162"
            className="w-full h-44 px-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 rounded-xl font-mono text-xs leading-relaxed outline-none"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Valid Rows</span>
              <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
                {parsed.rows.length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">2θ Span</span>
              <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
                {parsed.rows.length ? `${parsed.minX.toFixed(1)}–${parsed.maxX.toFixed(1)}°` : '—'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Mean Step</span>
              <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
                {parsed.rows.length > 1 ? `${parsed.meanStep.toFixed(3)}°` : '—'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Format</span>
              <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {parsed.colCount > 0 ? `${parsed.colCount}-Col` : '—'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span>Parsed Signal Preview</span>
              <span>{parsed.commentsSkipped} comment lines stripped</span>
            </div>
            <div className="h-32 w-full">
              {parsed.rows.length > 0 ? (
                <svg viewBox="0 0 360 100" className="w-full h-full">
                  <line x1="20" y1="85" x2="345" y2="85" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
                  {(() => {
                    const spanX = Math.max(0.1, parsed.maxX - parsed.minX);
                    const yVals = parsed.rows.map((r) => (r.y !== undefined ? r.y : 1));
                    const maxY = Math.max(1e-6, ...yVals);

                    return (
                      <>
                        {parsed.rows.map((r, i) => {
                          const px =
                            parsed.rows.length === 1
                              ? 182
                              : 25 + ((r.x - parsed.minX) / spanX) * 315;
                          const valY = r.y !== undefined ? r.y : 1;
                          const barH = (valY / maxY) * 65;
                          return (
                            <g key={i}>
                              <line
                                x1={px}
                                y1="85"
                                x2={px}
                                y2={85 - barH}
                                stroke="#10b981"
                                strokeWidth={parsed.rows.length > 40 ? 1.5 : 3}
                              />
                              <circle cx={px} cy={85 - barH} r="2.3" fill="#34d399" />
                            </g>
                          );
                        })}
                        <text x="25" y="96" fontSize="8" fontFamily="monospace" fill="#94a3b8">
                          {parsed.minX.toFixed(2)}°
                        </text>
                        <text x="340" y="96" fontSize="8" fontFamily="monospace" fill="#94a3b8" textAnchor="end">
                          {parsed.maxX.toFixed(2)}°
                        </text>
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                  Enter numeric rows above to preview diffraction coordinates
                </div>
              )}
            </div>
            {parsed.badLines.length > 0 && (
              <div className="text-[11px] font-mono text-rose-400 pt-1">
                Unparseable line {parsed.badLines[0].lineNo}: "{parsed.badLines[0].text}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SolversSection: React.FC = () => {
  const [subSolver, setSubSolver] = useState<'scherrer' | 'bragg'>('scherrer');

  const [scherrerWavelength, setScherrerWavelength] = useState(1.54056);
  const [scherrerK, setScherrerK] = useState(0.94);
  const [scherrerTwoTheta, setScherrerTwoTheta] = useState(38.2);
  const [scherrerFWHM, setScherrerFWHM] = useState(0.32);
  const [instFWHM, setInstFWHM] = useState(0.08);
  const [subtractionMode, setSubtractionMode] = useState<'gaussian' | 'lorentzian' | 'none'>('gaussian');

  const [braggWavelength, setBraggWavelength] = useState(1.54056);
  const [braggTwoTheta, setBraggTwoTheta] = useState(44.1);
  const [copiedOut, setCopiedOut] = useState(false);

  const thetaScherrerRad = ((scherrerTwoTheta / 2) * Math.PI) / 180;
  const effectiveBetaDeg =
    subtractionMode === 'none'
      ? scherrerFWHM
      : subtractionMode === 'gaussian'
      ? Math.sqrt(Math.max(0, scherrerFWHM * scherrerFWHM - instFWHM * instFWHM))
      : Math.max(0, scherrerFWHM - instFWHM);

  const effectiveBetaRad = (effectiveBetaDeg * Math.PI) / 180;
  const scherrerNm =
    effectiveBetaRad > 1e-6 && Math.cos(thetaScherrerRad) > 0
      ? (scherrerK * scherrerWavelength) / (effectiveBetaRad * Math.cos(thetaScherrerRad) * 10)
      : null;

  const isInstLimited = subtractionMode !== 'none' && scherrerFWHM <= instFWHM * 1.05;

  const thetaBraggRad = ((braggTwoTheta / 2) * Math.PI) / 180;
  const braggD = Math.sin(thetaBraggRad) > 0 ? braggWavelength / (2 * Math.sin(thetaBraggRad)) : 0;
  const braggQ = braggD > 0 ? (2 * Math.PI) / braggD : 0;
  const sinThetaOverLambda = braggWavelength > 0 ? Math.sin(thetaBraggRad) / braggWavelength : 0;

  const activeThetaDeg = subSolver === 'scherrer' ? scherrerTwoTheta / 2 : braggTwoTheta / 2;

  const handleCopyResult = () => {
    const text =
      subSolver === 'scherrer'
        ? scherrerNm !== null
          ? `${scherrerNm.toFixed(2)} nm`
          : 'Instrument-limited'
        : `${braggD.toFixed(4)} Å (Q = ${braggQ.toFixed(4)} Å⁻¹)`;
    navigator.clipboard.writeText(text);
    setCopiedOut(true);
    setTimeout(() => setCopiedOut(false), 1500);
  };

  return (
    <div className="space-y-6">
      <ProtocolHeader
        badge="SOP-03 • Analytical Solvers"
        badgeTone="violet"
        title="Localized Scherrer & Bragg Solvers"
        subtitle="Verify crystallite domain thickness with instrumental IRF deconvolution and interplanar d-spacing / Q-vector transformations."
        rightSlot={
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSubSolver('scherrer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                subSolver === 'scherrer'
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Scherrer Size (τ)
            </button>
            <button
              type="button"
              onClick={() => setSubSolver('bragg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                subSolver === 'bragg'
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bragg Spacing (d, Q)
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
          Target Anode Wavelength:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {ANODE_WAVELENGTHS.map((a) => {
            const activeVal = subSolver === 'scherrer' ? scherrerWavelength : braggWavelength;
            const isSelected = Math.abs(activeVal - a.wavelength) < 0.001;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  subSolver === 'scherrer'
                    ? setScherrerWavelength(a.wavelength)
                    : setBraggWavelength(a.wavelength)
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                }`}
              >
                {a.label} ({a.wavelength.toFixed(4)} Å)
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          {subSolver === 'scherrer' ? (
            <>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Wavelength (λ)</span>
                  <span className="font-mono tabular-nums text-violet-600 dark:text-violet-400">
                    {scherrerWavelength.toFixed(4)} Å
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.0005"
                  value={scherrerWavelength}
                  onChange={(e) => setScherrerWavelength(parseFloat(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Shape Factor (K)</span>
                  <span className="font-mono tabular-nums text-violet-600 dark:text-violet-400">
                    {scherrerK.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.01"
                  value={scherrerK}
                  onChange={(e) => setScherrerK(parseFloat(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0.89 Spherical FWHM</span>
                  <span>0.94 Cubic</span>
                  <span>1.07 Integral</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Peak Position (2θ)</span>
                  <span className="font-mono tabular-nums text-violet-600 dark:text-violet-400">
                    {scherrerTwoTheta.toFixed(2)}°
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="130"
                  step="0.1"
                  value={scherrerTwoTheta}
                  onChange={(e) => setScherrerTwoTheta(parseFloat(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Observed Peak Broadening (β_obs)</span>
                  <span className="font-mono tabular-nums text-violet-600 dark:text-violet-400">
                    {scherrerFWHM.toFixed(3)}° 2θ
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.5"
                  step="0.01"
                  value={scherrerFWHM}
                  onChange={(e) => setScherrerFWHM(parseFloat(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Instrument Subtraction (β_inst)
                  </span>
                  <div className="flex gap-1">
                    {(['gaussian', 'lorentzian', 'none'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSubtractionMode(m)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                          subtractionMode === m
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                            : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {m === 'gaussian' ? '√(β²-βᵢ²)' : m === 'lorentzian' ? 'β-βᵢ' : 'Raw'}
                      </button>
                    ))}
                  </div>
                </div>
                {subtractionMode !== 'none' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                      <span>Standard LaB₆ IRF Width</span>
                      <span>{instFWHM.toFixed(3)}°</span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="0.30"
                      step="0.005"
                      value={instFWHM}
                      onChange={(e) => setInstFWHM(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Radiation Wavelength (λ)</span>
                  <span className="font-mono tabular-nums text-violet-600 dark:text-violet-400">
                    {braggWavelength.toFixed(4)} Å
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.0005"
                  value={braggWavelength}
                  onChange={(e) => setBraggWavelength(parseFloat(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Diffraction Angle (2θ)</span>
                  <span className="font-mono tabular-nums text-violet-600 dark:text-violet-400">
                    {braggTwoTheta.toFixed(2)}° (θ = {(braggTwoTheta / 2).toFixed(2)}°)
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="155"
                  step="0.1"
                  value={braggTwoTheta}
                  onChange={(e) => setBraggTwoTheta(parseFloat(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-500">
                  Common Reference (Cu Kα₁)
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'Si (111) 28.44°', tt: 28.443 },
                    { label: 'Au (111) 38.18°', tt: 38.184 },
                    { label: 'α-Fe (110) 44.67°', tt: 44.674 },
                    { label: 'TiO₂ (101) 25.28°', tt: 25.281 },
                  ].map((ref) => (
                    <button
                      key={ref.label}
                      type="button"
                      onClick={() => {
                        setBraggWavelength(1.54056);
                        setBraggTwoTheta(ref.tt);
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[10px] hover:border-violet-400"
                    >
                      {ref.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                {subSolver === 'scherrer' ? 'Coherent Crystallite Thickness (τ)' : 'Solved Interplanar Spacing (d)'}
              </span>
              <button
                type="button"
                onClick={handleCopyResult}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-[10px] font-mono text-slate-300 flex items-center gap-1"
              >
                {copiedOut ? <Check size={11} /> : <Copy size={11} />}
                {copiedOut ? 'Copied' : 'Copy'}
              </button>
            </div>

            {subSolver === 'scherrer' ? (
              isInstLimited || scherrerNm === null ? (
                <div className="py-2 space-y-1">
                  <p className="text-2xl font-bold font-mono text-amber-400">Instrument-Limited</p>
                  <p className="text-xs text-slate-400">
                    β_obs ({scherrerFWHM.toFixed(3)}°) ≤ β_inst ({instFWHM.toFixed(3)}°). Broadening is below the diffractometer resolution floor.
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-4xl font-bold font-mono tabular-nums text-white">
                      {scherrerNm.toFixed(2)} <span className="text-base font-semibold text-cyan-400">nm</span>
                    </p>
                    <span className="text-xs font-mono text-slate-400">
                      ({(scherrerNm * 10).toFixed(1)} Å) • β_sample = {effectiveBetaDeg.toFixed(4)}°
                    </span>
                  </div>
                  <div className="text-right font-mono text-[11px] text-slate-400 space-y-0.5">
                    <p>θ = {(scherrerTwoTheta / 2).toFixed(3)}°</p>
                    <p>β_rad = {effectiveBetaRad.toFixed(5)}</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <p className="text-4xl font-bold font-mono tabular-nums text-white">
                    {braggD.toFixed(4)} <span className="text-base font-semibold text-cyan-400">Å</span>
                  </p>
                  <span className="text-xs font-mono text-slate-400">
                    ({(braggD / 10).toFixed(4)} nm) • 1/d² = {(1 / (braggD * braggD)).toFixed(4)} Å⁻²
                  </span>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-400 space-y-0.5">
                  <p>Q = {braggQ.toFixed(4)} Å⁻¹</p>
                  <p>sinθ/λ = {sinThetaOverLambda.toFixed(4)} Å⁻¹</p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-2">
                <span>LIVE BRAGG DIFFRACTION GEOMETRY</span>
                <span className="text-cyan-400">θ = {activeThetaDeg.toFixed(1)}° • 2θ = {(activeThetaDeg * 2).toFixed(1)}°</span>
              </div>
              <svg viewBox="0 0 340 120" className="w-full h-28 bg-slate-900/70 rounded-xl border border-slate-800">
                {[68, 86, 104].map((yPos, idx) => (
                  <g key={yPos}>
                    <line x1="50" y1={yPos} x2="290" y2={yPos} stroke={idx === 0 ? '#64748b' : '#334155'} strokeWidth="1" strokeDasharray={idx === 0 ? undefined : '3,3'} />
                    {Array.from({ length: 7 }, (_, ai) => (
                      <circle key={ai} cx={75 + ai * 32} cy={yPos} r="2.5" fill={idx === 0 ? '#94a3b8' : '#475569'} />
                    ))}
                  </g>
                ))}
                <line x1="302" y1="68" x2="302" y2="86" stroke="#fbbf24" strokeWidth="1.2" />
                <text x="308" y="80" fontSize="8.5" fontFamily="monospace" fill="#fbbf24" fontWeight="bold">d</text>

                {(() => {
                  const rad = (Math.min(78, Math.max(5, activeThetaDeg)) * Math.PI) / 180;
                  const rayLen = 80;
                  const cx = 170;
                  const cy = 68;
                  const xIn = cx - rayLen * Math.cos(rad);
                  const yIn = cy - rayLen * Math.sin(rad);
                  const xOut = cx + rayLen * Math.cos(rad);
                  const yOut = cy - rayLen * Math.sin(rad);

                  return (
                    <>
                      <line x1={xIn} y1={yIn} x2={cx} y2={cy} stroke="#38bdf8" strokeWidth="2" />
                      <line x1={cx} y1={cy} x2={cx + 55 * Math.cos(rad)} y2={cy + 55 * Math.sin(rad)} stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="3,3" opacity="0.45" />
                      <line x1={cx} y1={cy} x2={xOut} y2={yOut} stroke="#34d399" strokeWidth="2" />
                      <line x1={cx} y1={cy} x2={cx} y2={cy - 48} stroke="#a78bfa" strokeWidth="1.2" strokeDasharray="2,2" />
                      <circle cx={cx} cy={cy} r="3" fill="#ffffff" />
                      <text x={xIn} y={Math.max(12, yIn - 4)} fontSize="7.5" fontFamily="monospace" fill="#38bdf8">k_i (λ)</text>
                      <text x={xOut - 18} y={Math.max(12, yOut - 4)} fontSize="7.5" fontFamily="monospace" fill="#34d399">k_f (2θ)</text>
                      <text x={cx + 4} y={cy - 40} fontSize="7.5" fontFamily="monospace" fill="#c4b5fd">Q = 4πsinθ/λ</text>
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Physical Boundary:
            </span>
            {subSolver === 'scherrer' ? (
              <>
                <LatexInline tex="\tau = \frac{K \lambda}{\beta_{\text{sample}} \cos\theta}" className="mr-1.5 font-semibold text-slate-900 dark:text-white" />
                assumes zero lattice microstrain broadening. If peaks broaden faster than <span className="font-mono">1/cosθ</span> at high angles, transition to the Williamson-Hall module to separate strain <span className="font-mono">ε</span>.
              </>
            ) : (
              <>
                <LatexInline tex="n\lambda = 2d\sin\theta" className="mr-1.5 font-semibold text-slate-900 dark:text-white" />
                relates real-space plane spacing <span className="font-mono">d</span> to reciprocal scattering magnitude <span className="font-mono">Q = 2π/d</span>, making Q-space patterns wavelength-independent across Cu, Co, Mo, and synchrotron sources.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PolymerCrystallinitySection: React.FC = () => {
  const [polAc, setPolAc] = useState(1450);
  const [polAa, setPolAa] = useState(950);
  const [polNoise, setPolNoise] = useState(12);
  const [haloCenter, setHaloCenter] = useState(19.8);
  const [crystPeak1, setCrystPeak1] = useState(21.6);
  const [crystPeak2, setCrystPeak2] = useState(24.0);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const ciPct = (polAc / (polAc + polAa)) * 100;

  const curveData = useMemo(() => {
    const steps = 120;
    const min2Theta = 10;
    const max2Theta = 34;
    const width = 460;
    const height = 165;
    const baseY = 148;

    const pts: {
      twoTheta: number;
      svgX: number;
      totalVal: number;
      crystVal: number;
      amorphVal: number;
      yTotal: number;
      yCryst: number;
      yAmorph: number;
    }[] = [];

    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const tt = min2Theta + frac * (max2Theta - min2Theta);
      const svgX = 30 + frac * (width - 45);

      const ampA = (polAa / 3000) * 62;
      const amorphVal = ampA * Math.exp(-Math.pow(tt - haloCenter, 2) / (2 * 3.1 * 3.1));

      const ampC1 = (polAc / 3000) * 95;
      const ampC2 = (polAc / 3000) * 44;
      const c1 = ampC1 * (0.42 / (Math.pow(tt - crystPeak1, 2) + 0.42));
      const c2 = ampC2 * (0.35 / (Math.pow(tt - crystPeak2, 2) + 0.35));
      const crystVal = c1 + c2;

      const noise = Math.sin(i * 1.9 + 0.4) * (polNoise / 30) * 1.8;
      const totalVal = Math.max(0, amorphVal + crystVal + noise);

      pts.push({
        twoTheta: tt,
        svgX,
        totalVal,
        crystVal,
        amorphVal,
        yTotal: Math.max(10, baseY - totalVal),
        yCryst: Math.max(10, baseY - crystVal),
        yAmorph: Math.max(10, baseY - amorphVal),
      });
    }

    const buildArea = (key: 'yAmorph' | 'yCryst') =>
      `M ${pts[0].svgX.toFixed(1)},${baseY} ` +
      pts.map((p) => `L ${p.svgX.toFixed(1)},${p[key].toFixed(1)}`).join(' ') +
      ` L ${pts[pts.length - 1].svgX.toFixed(1)},${baseY} Z`;

    const totalLine =
      `M ` + pts.map((p) => `${p.svgX.toFixed(1)},${p.yTotal.toFixed(1)}`).join(' L ');

    return { pts, width, height, baseY, min2Theta, max2Theta, totalLine, amorphArea: buildArea('yAmorph'), crystArea: buildArea('yCryst') };
  }, [polAc, polAa, polNoise, haloCenter, crystPeak1, crystPeak2]);

  const hoveredPoint =
    hoverX !== null
      ? curveData.pts.reduce((best, p) =>
          Math.abs(p.svgX - hoverX) < Math.abs(best.svgX - hoverX) ? p : best
        )
      : null;

  return (
    <div className="space-y-6">
      <ProtocolHeader
        badge="SOP-04 • Semi-Crystalline Deconvolution"
        badgeTone="cyan"
        title="Polymer Crystallinity Index (X_c) Estimator"
        subtitle="Quantify semi-crystalline polymer phase fractions by separating sharp Bragg crystalline reflections (A_c) from the broad short-range amorphous halo (A_a)."
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mr-1">
          Polymer Benchmark Presets:
        </span>
        {POLYMER_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              setPolAc(p.ac);
              setPolAa(p.aa);
              setHaloCenter(p.haloCenter);
              setCrystPeak1(p.crystPeaks[0]);
              setCrystPeak2(p.crystPeaks[1]);
            }}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 block mb-1">
                Integrated Area Ratio
              </span>
              <LatexInline tex="X_c (\%) = \frac{A_c}{A_c + A_a} \times 100" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Crystalline Peak Area (A_c)</span>
                <span className="font-mono tabular-nums text-cyan-600 dark:text-cyan-400">{polAc} counts·deg</span>
              </div>
              <input
                type="range"
                min="100"
                max="4000"
                step="50"
                value={polAc}
                onChange={(e) => setPolAc(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>Amorphous Halo Area (A_a)</span>
                <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">{polAa} counts·deg</span>
              </div>
              <input
                type="range"
                min="100"
                max="4000"
                step="50"
                value={polAa}
                onChange={(e) => setPolAa(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Halo 2θ</span>
                  <span>{haloCenter.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="26"
                  step="0.2"
                  value={haloCenter}
                  onChange={(e) => setHaloCenter(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Noise Level</span>
                  <span>{polNoise}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="2"
                  value={polNoise}
                  onChange={(e) => setPolNoise(parseInt(e.target.value, 10))}
                  className="w-full accent-slate-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Crystallinity Index (X_c)
              </span>
              <span className="text-3xl font-bold font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
                {ciPct.toFixed(1)}%
              </span>
            </div>
            <div className="text-right font-mono text-xs text-slate-500">
              <p>A_c / A_tot = {(ciPct / 100).toFixed(3)}</p>
              <p>A_a / A_tot = {(1 - ciPct / 100).toFixed(3)}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 text-white">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Percent size={13} className="text-cyan-400" /> Interactive WAXS Deconvolution Profile
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {hoveredPoint
                ? `2θ = ${hoveredPoint.twoTheta.toFixed(2)}° | I_tot=${hoveredPoint.totalVal.toFixed(1)} | I_c=${hoveredPoint.crystVal.toFixed(1)} | I_a=${hoveredPoint.amorphVal.toFixed(1)}`
                : 'Hover plot for coordinate telemetry'}
            </span>
          </div>

          <svg
            viewBox={`0 0 ${curveData.width} ${curveData.height}`}
            className="w-full h-56 cursor-crosshair select-none"
            onMouseLeave={() => setHoverX(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const sx = ((e.clientX - rect.left) / rect.width) * curveData.width;
              setHoverX(sx);
            }}
          >
            {[40, 76, 112].map((y) => (
              <line key={y} x1="30" y1={y} x2="445" y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="0.7" />
            ))}
            <line x1="30" y1={curveData.baseY} x2="445" y2={curveData.baseY} stroke="rgba(148,163,184,0.35)" strokeWidth="1" />

            <path d={curveData.amorphArea} fill="rgba(99, 102, 241, 0.16)" stroke="#818cf8" strokeWidth="1.2" strokeDasharray="4 3" />
            <path d={curveData.crystArea} fill="rgba(6, 182, 212, 0.22)" stroke="#22d3ee" strokeWidth="1.2" />
            <path d={curveData.totalLine} fill="none" stroke="#f8fafc" strokeWidth="1.8" />

            {hoveredPoint && (
              <>
                <line x1={hoveredPoint.svgX} y1="12" x2={hoveredPoint.svgX} y2={curveData.baseY} stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="2 2" />
                <circle cx={hoveredPoint.svgX} cy={hoveredPoint.yTotal} r="3" fill="#fbbf24" />
              </>
            )}

            {[10, 16, 22, 28, 34].map((deg) => {
              const xPos = 30 + ((deg - 10) / 24) * (curveData.width - 45);
              return (
                <text key={deg} x={xPos} y="161" fontSize="8" fontFamily="monospace" fill="#94a3b8" textAnchor="middle">
                  {deg}°
                </text>
              );
            })}
          </svg>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-white inline-block" /> Total WAXS Scan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/50 border border-cyan-400 inline-block" /> Crystalline (A_c)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400/40 border border-indigo-400 inline-block" /> Amorphous Halo (A_a)
              </span>
            </div>
            <span>2θ Cu Kα Range: 10°–34°</span>
          </div>
        </div>
      </div>
    </div>
  );
};
