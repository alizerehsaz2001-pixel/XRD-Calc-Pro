import React, { useMemo, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Copy, Check } from 'lucide-react';

/**
 * Converts common crystallographic and physics variable shorthand
 * (e.g. "K_hkl", "β_s", "β_obs", "d_hkl", "ρ_calc", "V_cell") into clean LaTeX.
 */
export function formatSymbolToTex(symbol: string): string {
  const trimmed = symbol.trim();
  const directMap: Record<string, string> = {
    'η': '\\eta',
    'β': '\\beta',
    'λ': '\\lambda',
    'θ': '\\theta',
    'ε': '\\varepsilon',
    'α': '\\alpha',
    'δ': '\\delta',
    'ρ': '\\rho',
    'σ': '\\sigma',
    'φ': '\\phi',
    'β_s': '\\beta_{\\mathrm{s}}',
    'β_sample': '\\beta_{\\mathrm{sample}}',
    'β_obs': '\\beta_{\\mathrm{obs}}',
    'β_inst': '\\beta_{\\mathrm{inst}}',
    'θ_p': '\\theta_{p}',
    'θ_0': '\\theta_{0}',
    'K_hkl': 'K_{hkl}',
    'D_hkl': 'D_{hkl}',
    'D_int': 'D_{\\mathrm{int}}',
    'D_num': 'D_{\\mathrm{num}}',
    'D_V': 'D_{V}',
    'D_A': 'D_{A}',
    'D_H': 'D_{H}',
    'D_g': 'D_{g}',
    'σ_g': '\\sigma_{g}',
    'd_hkl': 'd_{hkl}',
    'ρ_calc': '\\rho_{\\mathrm{calc}}',
    'V_cell': 'V_{\\mathrm{cell}}',
    'N_A': 'N_{\\mathrm{A}}',
    'R_wp': 'R_{\\mathrm{wp}}',
    'R_{wp}': 'R_{\\mathrm{wp}}',
    'I_max': 'I_{\\max}',
    'I_{max}': 'I_{\\max}',
    'f_surf': 'f_{\\mathrm{surf}}',
    'Slope (4ε)': '4\\varepsilon',
    'd(avg)': 'd_{\\mathrm{avg}}',
    'Area': 'A_{\\mathrm{int}}',
  };

  if (directMap[trimmed]) return directMap[trimmed];

  // Replace leading Greek unicode symbols with LaTeX macros
  let tex = trimmed
    .replace(/λ/g, '\\lambda')
    .replace(/θ/g, '\\theta')
    .replace(/β/g, '\\beta')
    .replace(/η/g, '\\eta')
    .replace(/ε/g, '\\varepsilon')
    .replace(/α/g, '\\alpha')
    .replace(/δ/g, '\\delta')
    .replace(/ρ/g, '\\rho')
    .replace(/σ/g, '\\sigma')
    .replace(/Δ/g, '\\Delta');

  // Wrap bare multi-character subscripts like X_abc into X_{abc}
  tex = tex.replace(/_([A-Za-z0-9]{2,})/g, (_, sub: string) => {
    const isIndex = /^[hkl0-9]+$/i.test(sub);
    return isIndex ? `_{${sub}}` : `_{\\mathrm{${sub}}}`;
  });

  return tex;
}

export interface MathFormulaProps {
  tex: string;
  display?: boolean;
  className?: string;
}

/**
 * Pure KaTeX mathematical renderer with optical sizing and safe error fallback.
 */
export const MathFormula: React.FC<MathFormulaProps> = ({
  tex,
  display = false,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        throwOnError: false,
        displayMode: display,
        strict: false,
        trust: false,
      });
    } catch {
      return tex;
    }
  }, [tex, display]);

  if (display) {
    return (
      <div
        dir="ltr"
        className={`scientific-math-display overflow-x-auto custom-scrollbar ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      dir="ltr"
      className={`scientific-math-inline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export interface EquationLegendItem {
  symbol: string;
  meaning: string;
}

export interface EquationPlateProps {
  tex: string;
  label?: string;
  eqNumber?: string;
  dimension?: string;
  emphasis?: 'default' | 'primary' | 'result';
  copyable?: boolean;
  legend?: EquationLegendItem[];
  className?: string;
}

/**
 * Publication-grade AMS-LaTeX style equation plate with hairline framing,
 * right-aligned equation numbering, dimensional tag, and one-click TeX copy.
 */
export const EquationPlate: React.FC<EquationPlateProps> = ({
  tex,
  label,
  eqNumber,
  dimension,
  emphasis = 'default',
  copyable = true,
  legend,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(tex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const surfaceStyles =
    emphasis === 'primary'
      ? 'bg-slate-50/90 dark:bg-[#080C15] border-slate-300/90 dark:border-slate-700/90'
      : emphasis === 'result'
      ? 'bg-blue-50/45 dark:bg-sky-950/20 border-blue-200/80 dark:border-sky-800/60'
      : 'bg-slate-50/75 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800';

  return (
    <div
      className={`scientific-equation-plate group rounded-xl border transition-colors ${surfaceStyles} ${className}`}
    >
      {(label || dimension || copyable) && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 border-b border-slate-200/75 dark:border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            {label && (
              <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
                {label}
              </span>
            )}
            {label && dimension && (
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                ·
              </span>
            )}
            {dimension && (
              <span className="font-mono tabular-nums text-[10.5px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {dimension}
              </span>
            )}
          </div>

          {copyable && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copy LaTeX equation"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>TeX</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="relative px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 text-center text-slate-900 dark:text-slate-100 select-all">
          <MathFormula tex={tex} display />
        </div>
        {eqNumber && (
          <span
            className="shrink-0 font-serif text-xs sm:text-sm text-slate-400 dark:text-slate-500 tabular-nums select-none pl-2"
            aria-label={`Equation ${eqNumber}`}
          >
            {eqNumber}
          </span>
        )}
      </div>

      {legend && legend.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          {legend.map((item, idx) => (
            <span key={idx} className="inline-flex items-baseline gap-1.5">
              <MathFormula
                tex={formatSymbolToTex(item.symbol)}
                className="text-slate-800 dark:text-slate-200"
              />
              <span>{item.meaning}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
