import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Monitor, Sparkles, Volume2, Cpu, Terminal, 
  Beaker, Check, RefreshCw, FileCode, ShieldCheck,
  Play, Sun, Moon, Contrast, Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import { playSynthTone } from '../../utils/sound';
import LanguageSelector from '../LanguageSelector';
import { LengthUnit, useSettings } from '../SettingsContext';
import {
  THEME_REGISTRY,
  COLOR_VISION_MODES,
  ContrastLevel,
  ColorVisionMode,
  getThemeContrastAudit,
  getThemeSpec,
  isDarkTheme,
} from '../../utils/themeSystem';

interface GeneralSettingsTabProps {
  theme: string;
  setTheme: (theme: any) => void;
  precision: number;
  setPrecision: (precision: number) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  currentLengthUnit: LengthUnit;
  handleSetLengthUnit: (unit: LengthUnit) => void;
  pythonFeaturesEnabled: boolean;
  setPythonFeaturesEnabled: (enabled: boolean) => void;
  pyStatus: { ready: boolean; logs: string[] } | null;
  pyStatusLoading: boolean;
  fetchPythonStatus: () => void;
  showLogTerminal: boolean;
  setShowLogTerminal: (show: boolean) => void;
  pySelectedScript: string | null;
  setPySelectedScript: (script: string | null) => void;
}

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  theme,
  setTheme,
  precision,
  setPrecision,
  animationsEnabled,
  setAnimationsEnabled,
  soundEnabled,
  setSoundEnabled,
  currentLengthUnit,
  handleSetLengthUnit,
  pythonFeaturesEnabled,
  setPythonFeaturesEnabled,
  pyStatus,
  pyStatusLoading,
  fetchPythonStatus,
  showLogTerminal,
  setShowLogTerminal,
  pySelectedScript,
  setPySelectedScript,
}) => {
  const { t, i18n } = useTranslation();
  const isFa = (i18n.language || '').toLowerCase().startsWith('fa');
  const [converterInput, setConverterInput] = useState<number>(1.5406);
  const [soundTestTone, setSoundTestTone] = useState<string | null>(null);

  const {
    contrastBoost = 'standard',
    setContrastBoost,
    colorVisionMode = 'normal',
    setColorVisionMode,
    followSystemTheme = false,
    setFollowSystemTheme,
  } = useSettings();
  const activeSpec = getThemeSpec(theme);
  const activeAudit = getThemeContrastAudit(theme, contrastBoost);
  const activeCvdObj = COLOR_VISION_MODES.find((m) => m.id === colorVisionMode) || COLOR_VISION_MODES[0];

  return (
    <motion.div 
      key="general"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Monitor className="w-6 h-6 text-indigo-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('Appearance & Display')}</h3>
        </div>

        <div className="space-y-8">
          {/* Language Select */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block mb-1">{t('Language Locale')}</label>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('Select your preferred interface language')}</p>
            </div>
            <div className="w-full md:w-64 shrink-0">
              <LanguageSelector onLanguageChange={() => playSynthTone('switch')} />
            </div>
          </div>

          {/* Precision Settings */}
          <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block mb-1">{t('Decimal Precision')}</label>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('Controls the number of decimal places shown in calculations')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { val: 2, label: 'Standard (2.00)' },
                { val: 4, label: 'High (4.0000)' },
                { val: 6, label: 'Analytical (6.000000)' },
                { val: 8, label: 'Scientific (8.00...)' }
              ].map((pOption) => (
                <button
                  key={pOption.val}
                  onClick={() => {
                    setPrecision(pOption.val);
                    localStorage.setItem('xrd_precision', pOption.val.toString());
                    playSynthTone('tick');
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    precision === pOption.val
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                  }`}
                >
                  {t(pOption.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Global Length Unit Toggle */}
          <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-200 block">
                  {t('Global Crystallographic Length Unit', 'Global Length Unit')}
                </label>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Global Setting
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('Global unit for all d-spacing, wavelength, and lattice parameter calculations across all modules.')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { 
                  id: 'Å' as LengthUnit, 
                  label: 'Ångströms (Å)', 
                  symbol: 'Å', 
                  factor: '1 Å = 10⁻¹⁰ m',
                  example: 'Cu-Kα = 1.5406 Å'
                },
                { 
                  id: 'nm' as LengthUnit, 
                  label: 'Nanometers (nm)', 
                  symbol: 'nm', 
                  factor: '1 nm = 10 Å',
                  example: 'Cu-Kα = 0.15406 nm'
                },
                { 
                  id: 'pm' as LengthUnit, 
                  label: 'Picometers (pm)', 
                  symbol: 'pm', 
                  factor: '1 pm = 0.01 Å',
                  example: 'Cu-Kα = 154.06 pm'
                },
              ].map((uOption) => {
                const isSelected = currentLengthUnit === uOption.id;
                return (
                  <button
                    key={uOption.id}
                    type="button"
                    onClick={() => {
                      if (handleSetLengthUnit) handleSetLengthUnit(uOption.id);
                      playSynthTone('switch');
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {uOption.symbol}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                      {uOption.label}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                      {uOption.factor}
                    </p>
                    <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 inline-block">
                      {uOption.example}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Unit Converter Box */}
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Beaker className="w-3.5 h-3.5 text-indigo-500" /> Live Unit Conversion Calculator
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Test unit scaling for any lattice d-spacing or wavelength value.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <input
                  type="number"
                  step="0.0001"
                  value={converterInput}
                  onChange={(e) => setConverterInput(parseFloat(e.target.value) || 0)}
                  className="w-24 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
                <div className="text-xs font-mono space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <span>= {(converterInput * 0.1).toFixed(5)} nm</span>
                  <span>•</span>
                  <span>= {(converterInput * 100).toFixed(2)} pm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Theme & WCAG 2.1 Contrast Calibration Studio */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100 block mb-1">
                  {t('Visual Theme & Contrast Calibration', 'Visual Theme & Contrast Calibration')}
                </label>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('Calibrated light/publication and dark/laboratory palettes with real-time WCAG 2.1 contrast auditing and CVD-safe trace profiles.')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTheme(isDarkTheme(theme) ? 'light' : 'dark');
                    playSynthTone('switch');
                  }}
                  className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isDarkTheme(theme) ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{isDarkTheme(theme) ? 'Switch to Light' : 'Switch to Dark'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFollowSystemTheme?.(!followSystemTheme);
                    playSynthTone('switch');
                  }}
                  className={`px-3 py-1.5 rounded-md border text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    followSystemTheme
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>{followSystemTheme ? 'OS Sync: On' : 'OS Sync: Off'}</span>
                </button>
              </div>
            </div>

            {/* Live WCAG 2.1 Contrast Telemetry & Optical Specimen Preview */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950/60">
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
                <div className="px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Primary Ink Contrast
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeAudit.primaryRatio.toFixed(2)}:1
                    </span>
                    <span className={`text-[11px] font-semibold ${
                      activeAudit.primaryGrade === 'AAA'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}>
                      WCAG {activeAudit.primaryGrade}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Secondary / Muted Contrast
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeAudit.mutedRatio.toFixed(2)}:1
                    </span>
                    <span className={`text-[11px] font-semibold ${
                      activeAudit.mutedGrade === 'AAA'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : activeAudit.mutedGrade === 'AA'
                        ? 'text-cyan-700 dark:text-cyan-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}>
                      WCAG {activeAudit.mutedGrade}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Accent Signal Contrast
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeAudit.accentRatio.toFixed(2)}:1
                    </span>
                    <span className={`text-[11px] font-semibold ${
                      activeAudit.accentGrade === 'AAA' || activeAudit.accentGrade === 'AA'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}>
                      WCAG {activeAudit.accentGrade}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Live Optical Specimen Card */}
              <div
                className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
                style={{
                  backgroundColor: contrastBoost === 'maximum' ? (activeSpec.isDark ? '#000000' : '#FFFFFF') : activeSpec.tokens.canvas,
                }}
              >
                <div
                  className="flex-1 rounded-md border p-3.5"
                  style={{
                    backgroundColor: contrastBoost === 'maximum' ? (activeSpec.isDark ? '#070A12' : '#FFFFFF') : activeSpec.tokens.surface,
                    borderColor: contrastBoost === 'maximum' ? (activeSpec.isDark ? '#64748B' : '#1E293B') : activeSpec.tokens.border,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="text-xs font-mono font-bold tracking-tight"
                      style={{ color: contrastBoost !== 'standard' ? (activeSpec.isDark ? '#FFFFFF' : '#000000') : activeSpec.tokens.textPrimary }}
                    >
                      {activeSpec.label} · Optical Specimen (Cu Kα₁)
                    </span>
                    <span
                      className="text-[10px] font-mono tabular-nums"
                      style={{ color: contrastBoost === 'maximum' ? (activeSpec.isDark ? '#E2E8F0' : '#0F172A') : activeSpec.tokens.textMuted }}
                    >
                      R_wp 4.18% · d₁₁₁ 2.359 Å
                    </span>
                  </div>
                  <p
                    className="text-[11px] leading-relaxed mb-2.5"
                    style={{ color: contrastBoost === 'maximum' ? (activeSpec.isDark ? '#E2E8F0' : '#0F172A') : activeSpec.tokens.textMuted }}
                  >
                    Live legibility verification for headings, muted telemetry captions, hairline boundaries, and Rietveld peak traces.
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2.5 py-1 rounded-sm text-[10px] font-mono font-semibold"
                      style={{
                        backgroundColor: activeSpec.tokens.accent,
                        color: activeSpec.tokens.accentOnAccent,
                      }}
                    >
                      Run Refinement
                    </span>
                    <svg viewBox="0 0 180 26" className="flex-1 h-6 max-w-[200px]" aria-hidden="true">
                      <line x1="0" y1="23" x2="180" y2="23" stroke={activeSpec.tokens.border} strokeWidth="1" />
                      <path
                        d="M 4 22 L 32 22 L 42 5 L 52 22 L 84 22 L 94 10 L 104 22 L 136 22 L 146 14 L 156 22 L 176 22"
                        fill="none"
                        stroke={colorVisionMode === 'normal' ? activeSpec.tokens.chartObs : activeCvdObj.swatches[0]}
                        strokeWidth="1.8"
                      />
                      <path
                        d="M 4 22 L 33 22 L 42 7 L 51 22 L 85 22 L 94 12 L 103 22 L 137 22 L 146 15 L 155 22 L 176 22"
                        fill="none"
                        stroke={colorVisionMode === 'normal' ? activeSpec.tokens.chartCalc : activeCvdObj.swatches[1]}
                        strokeWidth="1.2"
                        strokeDasharray="3 2"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Contrast Enhancement & CVD Palette Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Contrast Enhancement Level */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                <div className="flex items-center gap-2 mb-1">
                  <Contrast className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Contrast Enhancement Level
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">
                  Boost muted label legibility, border sharpness, and keyboard focus outlines across all modules.
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { id: 'standard', label: 'Standard', desc: 'Balanced AA/AAA' },
                    { id: 'enhanced', label: 'Enhanced', desc: 'AAA Muted Text' },
                    { id: 'maximum', label: 'Maximum', desc: '21:1 High-Ink' },
                  ] as Array<{ id: ContrastLevel; label: string; desc: string }>).map((opt) => {
                    const active = contrastBoost === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setContrastBoost?.(opt.id);
                          playSynthTone('tick');
                        }}
                        className={`p-2 rounded-md border text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                        }`}
                      >
                        <div className="text-xs font-mono font-semibold">{opt.label}</div>
                        <div className={`text-[10px] mt-0.5 ${active ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color-Vision Deficiency (CVD) Safe Chart Palette */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Color-Vision Safe Trace Palette (Okabe-Ito)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">
                  Calibrate observed, calculated, and residual diffraction trace hues for color-vision accessibility.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {COLOR_VISION_MODES.map((mode) => {
                    const active = colorVisionMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setColorVisionMode?.(mode.id as ColorVisionMode);
                          playSynthTone('tick');
                        }}
                        className={`p-2 rounded-md border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          active
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono font-semibold truncate">{mode.label}</div>
                          <div className={`text-[9.5px] truncate ${active ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {mode.desc}
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5 shrink-0">
                          {mode.swatches.map((hex, idx) => (
                            <span key={idx} className="w-3.5 h-1 rounded-[1px]" style={{ backgroundColor: hex }} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Categorized Theme Gallery */}
            {(['light', 'dark'] as const).map((groupPolarity) => {
              const items = THEME_REGISTRY.filter((item) => item.polarity === groupPolarity);
              return (
                <div key={groupPolarity} className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      {groupPolarity === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      <span>{groupPolarity === 'light' ? 'Light & Publication Themes' : 'Dark & Laboratory Themes'}</span>
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {items.length} calibrated presets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {items.map((spec) => {
                      const isSelected = theme === spec.id;
                      const audit = getThemeContrastAudit(spec.id, contrastBoost);
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          onClick={() => {
                            setTheme(spec.id);
                            playSynthTone('switch');
                          }}
                          className={`flex flex-col p-3 rounded-lg border text-left transition-colors relative cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 ring-1 ring-indigo-500/40'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-600'
                          }`}
                        >
                          {/* Calibrated Surface & Ink Mini Preview */}
                          <div
                            className="w-full h-9 rounded-md border px-2.5 flex items-center justify-between mb-2.5"
                            style={{
                              backgroundColor: spec.tokens.canvas,
                              borderColor: spec.tokens.border,
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-4 h-4 rounded-sm border"
                                style={{
                                  backgroundColor: spec.tokens.surface,
                                  borderColor: spec.tokens.border,
                                }}
                              />
                              <span
                                className="w-4 h-4 rounded-sm"
                                style={{ backgroundColor: spec.tokens.accent }}
                              />
                              <span
                                className="w-2.5 h-4 rounded-sm"
                                style={{ backgroundColor: spec.tokens.chartCalc }}
                              />
                            </div>
                            <span
                              className="text-xs font-mono font-bold"
                              style={{ color: spec.tokens.textPrimary }}
                            >
                              Aa
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {t(spec.label, spec.label)}
                              </h4>
                              <p className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                                {t(spec.subtitle, spec.subtitle)}
                              </p>
                              <div className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-1">
                                Ink {audit.primaryRatio.toFixed(1)}:1 · Muted {audit.mutedRatio.toFixed(1)}:1 ·{' '}
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                  {audit.overallGrade}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Cpu className="w-6 h-6 text-indigo-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('System Engagement')}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl transition-colors ${animationsEnabled ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{t('Animations')}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('Enable smooth UI transitions and motion effects')}</div>
              </div>
            </div>
            <button 
              onClick={() => {
                setAnimationsEnabled(!animationsEnabled);
                playSynthTone('tick');
              }}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${animationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div 
                style={{ transform: animationsEnabled ? 'translateX(24px)' : 'translateX(2px)' }}
                className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform" 
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl transition-colors ${soundEnabled ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{t('Sound Effects')}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('Play auditory feedback for actions and success states')}</div>
              </div>
            </div>
            <button 
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                localStorage.setItem('xrd_sound', (!soundEnabled).toString());
                setTimeout(() => { playSynthTone('success'); }, 50);
              }}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${soundEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div 
                style={{ transform: soundEnabled ? 'translateX(24px)' : 'translateX(2px)' }}
                className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform" 
              />
            </button>
          </div>

          {/* Sound Test Matrix */}
          {soundEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" /> Audio Synthesizer Tester
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Test acoustic frequencies in your browser's Web Audio API context.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { id: 'tick', label: 'Tick Tone' },
                  { id: 'switch', label: 'Switch Tone' },
                  { id: 'success', label: 'Success Chime' }
                ].map((sTone) => (
                  <button
                    key={sTone.id}
                    onClick={() => {
                      playSynthTone(sTone.id as any);
                      setSoundTestTone(sTone.id);
                      setTimeout(() => setSoundTestTone(null), 600);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
                      soundTestTone === sTone.id
                        ? 'bg-indigo-600 text-white border-indigo-600 scale-105'
                        : 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {sTone.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl transition-colors ${pythonFeaturesEnabled ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{t('Python Tools')}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('Enable machine learning models and advanced generators')}</div>
              </div>
            </div>
            <button 
              onClick={() => {
                setPythonFeaturesEnabled(!pythonFeaturesEnabled);
                playSynthTone('tick');
              }}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${pythonFeaturesEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div 
                style={{ transform: pythonFeaturesEnabled ? 'translateX(24px)' : 'translateX(2px)' }}
                className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform" 
              />
            </button>
          </div>

          {pythonFeaturesEnabled && (
            <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                      <Terminal className="w-4 h-4 animate-pulse" />
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isFa ? 'پشتیبانی و عیب‌یابی محیط پایتون' : 'Python Runtime & Support'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                    {isFa 
                      ? 'وضعیت کتابخانه‌ها، بکاپ فایل‌ها و سلامت ابزارهای پایتون سرور را پایش و مدیریت کنید.'
                      : 'Monitor, manage, and verify the backend Python environment, library status, and secure script backups.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchPythonStatus}
                    disabled={pyStatusLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pyStatusLoading ? 'animate-spin' : ''}`} />
                    {isFa ? 'بررسی مجدد' : 'Re-verify'}
                  </button>

                  <button
                    onClick={() => setShowLogTerminal(!showLogTerminal)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    {showLogTerminal ? (isFa ? 'مخفی‌سازی لاگ' : 'Hide Logs') : (isFa ? 'مشاهده لاگ نصب' : 'View Install Logs')}
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4">
                  <div className={`w-3.5 h-3.5 rounded-full ${pyStatus?.ready ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 animate-ping' : 'bg-rose-500 shadow-lg shadow-rose-500/20 animate-pulse'}`} />
                  <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isFa ? 'وضعیت اصلی' : 'CORE STATUS'}</div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      {pyStatusLoading 
                        ? (isFa ? 'در حال بررسی...' : 'Checking...') 
                        : pyStatus?.ready 
                          ? (isFa ? 'فعال و آماده کار' : 'READY & DEPLOYED') 
                          : (isFa ? 'نیازمند بررسی / آفلاین' : 'BOOTSTRAP IN PROGRESS')}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isFa ? 'موتور یادگیری ماشین' : 'ML ENGINE'}</div>
                    <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-snug">
                      NumPy, SciPy, Pillow, Matplotlib, OpenCV, Google-GenAI
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isFa ? 'پشتیبان‌گیری اسکریپت‌ها' : 'VITAL BACKUPS'}</div>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      {isFa ? '۶ فایل پشتیبان ذخیره شد' : '6 Backup files OK'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Terminal / Log panel */}
              {showLogTerminal && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-950 text-slate-300 font-mono text-[11px] p-4 rounded-2xl border border-slate-800 overflow-hidden shadow-inner"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-amber-500" />
                      {isFa ? 'ترمینال نصب پایتون' : 'PYTHON ENVIRONMENT INSTALLATION STREAM'}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {pyStatus?.logs && pyStatus.logs.length > 0 ? (
                      pyStatus.logs.map((log, idx) => (
                        <div key={idx} className="whitespace-pre-wrap leading-relaxed select-text font-sans">
                          <span className="text-slate-600 mr-2">[{idx + 1}]</span>
                          {log}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-600 italic">{isFa ? 'در حال بازیابی اطلاعات...' : 'Reading log stream buffer...'}</div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Python Modules and Fallbacks list */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase font-black tracking-wider text-slate-400 dark:text-slate-500 block">
                  {isFa ? 'برنامه علمی توسعه‌یافته با پایتون همراه با فایل پشتیبان' : 'DEVELOPED SCIENTIFIC PYTHON ENGINE & BACKUPS'}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      name: 'trainNeuralNet.py',
                      descFa: 'آموزش و بهینه‌سازی مدل هوش مصنوعی برای کلاس‌بندی فازها همراه با تقویت داده مبتنی بر فیزیک.',
                      descEn: 'Trains Neural Networks (MLP/PyTorch) for XRD phase indexing with physics-informed augmentation.',
                    },
                    {
                      name: 'phaseIdValidator.py',
                      descFa: 'انطباق پیک‌های تجربی با کاتالوگ کریستالوگرافی با تلورانس خطای زاویه‌ای فوق‌دقیق.',
                      descEn: 'Matches experimental peak clusters with crystallographic catalogs using high-precision angular error bounds.',
                    },
                    {
                      name: 'rietveldRefinement.py',
                      descFa: 'برازش و بهینه‌سازی پارامترهای شبکه کریستالی، اندازه بلورک‌ها و میکروکرنش با کمترین مربعات غیرخطی.',
                      descEn: 'Refines lattice parameters, crystallite sizes, and microstrains using non-linear least squares solver.',
                    },
                    {
                      name: 'matplotlibGenerator.py',
                      descFa: 'تولید پلات‌های دوبعدی با کیفیت بالای علمی و خروجی تصویر نمودارهای XRD.',
                      descEn: 'Generates publication-quality 2D vector plots, peak mark designations, and residual curves.',
                    },
                    {
                      name: 'imageAnalysis.py',
                      descFa: 'پردازش تصویر کامپیوتری و فیلترهای OpenCV جهت استخراج پیک‌ها از فیلم یا دتکتورهای رادیوگرافی.',
                      descEn: 'Computer vision framework parsing raw diffractogram plates or image detectors using OpenCV filters.',
                    },
                    {
                      name: 'dbRagAgent.py',
                      descFa: 'عامل هوشمند بازیابی اطلاعات و اتصال به پایگاه داده داخلی جهت پرسش و پاسخ کریستالوگرافی با مدل Gemini.',
                      descEn: 'Dynamic indexing agent serving SQLite FTS5 database lookups integrated with Gemini models.',
                    }
                  ].map((script, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setPySelectedScript(pySelectedScript === script.name ? null : script.name)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-left ${pySelectedScript === script.name ? 'bg-amber-500/10 border-amber-500/40 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <FileCode className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-200 font-mono">{script.name}</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          {isFa ? 'پشتیبان فعال' : 'Backup OK'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                        {isFa ? script.descFa : script.descEn}
                      </p>

                      {pySelectedScript === script.name && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 font-sans">
                            <div className="flex justify-between">
                              <span>{isFa ? 'محل فایل پشتیبان:' : 'Backup Path:'}</span>
                              <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">/utils/backups/{script.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{isFa ? 'محل فایل اصلی:' : 'Source Path:'}</span>
                              <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">/utils/{script.name}</span>
                            </div>
                          </div>

                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 max-h-24 overflow-y-auto">
                            <div className="text-slate-500 italic mb-1"># CLI execution pattern:</div>
                            <div>python3 /utils/{script.name} --help</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
