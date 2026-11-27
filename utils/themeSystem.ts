/**
 * Unified Scientific Visual Theme & WCAG 2.1 Contrast Engine
 * Provides calibrated Light/Publication and Dark/Laboratory themes,
 * real WCAG relative luminance contrast auditing, Contrast Enhancement levels,
 * and Color-Vision Deficiency (CVD / Okabe-Ito) chart palettes.
 */

export type ThemeId =
  | 'light'
  | 'paper'
  | 'high-contrast-light'
  | 'dark'
  | 'high-contrast-dark'
  | 'oceanic'
  | 'dracula'
  | 'gruvbox'
  | 'monokai'
  | 'terminal'
  | 'synthwave'
  | 'cyberpunk';

export type ContrastLevel = 'standard' | 'enhanced' | 'maximum';
export type ColorVisionMode = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia';
export type WcagGrade = 'AAA' | 'AA' | 'AA Large' | 'Low';

export interface ThemeSpec {
  id: ThemeId;
  label: string;
  subtitle: string;
  polarity: 'light' | 'dark';
  isDark: boolean;
  /** [canvasHex, surfaceHex, accentHex] */
  swatchHex: [string, string, string];
  /** Primary surface & ink colors for mathematical WCAG 2.1 contrast calculation */
  tokens: {
    canvas: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentOnAccent: string;
    chartObs: string;
    chartCalc: string;
    chartResid: string;
  };
}

export const THEME_REGISTRY: ThemeSpec[] = [
  // LIGHT & PUBLICATION THEMES
  {
    id: 'light',
    label: 'Clinical Slate',
    subtitle: 'Crisp laboratory daylight',
    polarity: 'light',
    isDark: false,
    swatchHex: ['#F8FAFC', '#FFFFFF', '#3730A3'],
    tokens: {
      canvas: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceAlt: '#F1F5F9',
      border: '#CBD5E1',
      textPrimary: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#475569',
      accent: '#3730A3',
      accentOnAccent: '#FFFFFF',
      chartObs: '#0F172A',
      chartCalc: '#DC2626',
      chartResid: '#2563EB',
    },
  },
  {
    id: 'paper',
    label: 'Journal Paper',
    subtitle: 'Low-glare warm archival print',
    polarity: 'light',
    isDark: false,
    swatchHex: ['#F7F4EC', '#FFFFFF', '#1D4ED8'],
    tokens: {
      canvas: '#F7F4EC',
      surface: '#FFFFFF',
      surfaceAlt: '#EFECE3',
      border: '#D6D0C4',
      textPrimary: '#1C1917',
      textSecondary: '#3F3A36',
      textMuted: '#57534E',
      accent: '#1D4ED8',
      accentOnAccent: '#FFFFFF',
      chartObs: '#1C1917',
      chartCalc: '#B91C1C',
      chartResid: '#0F766E',
    },
  },
  {
    id: 'high-contrast-light',
    label: 'Daylight AAA',
    subtitle: 'Maximum 21:1 ink clarity',
    polarity: 'light',
    isDark: false,
    swatchHex: ['#FFFFFF', '#F1F5F9', '#0038A8'],
    tokens: {
      canvas: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceAlt: '#F1F5F9',
      border: '#334155',
      textPrimary: '#000000',
      textSecondary: '#0F172A',
      textMuted: '#1E293B',
      accent: '#0038A8',
      accentOnAccent: '#FFFFFF',
      chartObs: '#000000',
      chartCalc: '#B91C1C',
      chartResid: '#0038A8',
    },
  },

  // DARK & LABORATORY THEMES
  {
    id: 'dark',
    label: 'Deep Obsidian',
    subtitle: 'Calibrated dark lab slate',
    polarity: 'dark',
    isDark: true,
    swatchHex: ['#070A12', '#0F172A', '#6366F1'],
    tokens: {
      canvas: '#070A12',
      surface: '#0F172A',
      surfaceAlt: '#162033',
      border: '#334155',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
      accent: '#818CF8',
      accentOnAccent: '#070A12',
      chartObs: '#38BDF8',
      chartCalc: '#FB7185',
      chartResid: '#FBBF24',
    },
  },
  {
    id: 'high-contrast-dark',
    label: 'Lab AAA Dark',
    subtitle: 'Maximum 21:1 pitch-black contrast',
    polarity: 'dark',
    isDark: true,
    swatchHex: ['#000000', '#0A0F1A', '#22D3EE'],
    tokens: {
      canvas: '#000000',
      surface: '#0A0F1A',
      surfaceAlt: '#111827',
      border: '#64748B',
      textPrimary: '#FFFFFF',
      textSecondary: '#F1F5F9',
      textMuted: '#CBD5E1',
      accent: '#22D3EE',
      accentOnAccent: '#000000',
      chartObs: '#22D3EE',
      chartCalc: '#FF6B81',
      chartResid: '#FACC15',
    },
  },
  {
    id: 'oceanic',
    label: 'Cherenkov Blue',
    subtitle: 'Deep navy & sky cyan telemetry',
    polarity: 'dark',
    isDark: true,
    swatchHex: ['#091224', '#101D35', '#38BDF8'],
    tokens: {
      canvas: '#091224',
      surface: '#101D35',
      surfaceAlt: '#172947',
      border: '#334E73',
      textPrimary: '#F0F9FF',
      textSecondary: '#CFE8FF',
      textMuted: '#93C5FD',
      accent: '#38BDF8',
      accentOnAccent: '#091224',
      chartObs: '#38BDF8',
      chartCalc: '#F472B6',
      chartResid: '#FCD34D',
    },
  },
  {
    id: 'dracula',
    label: 'Vacuum Violet',
    subtitle: 'Charcoal & crisp violet contrast',
    polarity: 'dark',
    isDark: true,
    swatchHex: ['#1E1F2B', '#282A36', '#BD93F9'],
    tokens: {
      canvas: '#1E1F2B',
      surface: '#282A36',
      surfaceAlt: '#323546',
      border: '#525773',
      textPrimary: '#F8F8F2',
      textSecondary: '#E2E4F0',
      textMuted: '#B4C0E0',
      accent: '#BD93F9',
      accentOnAccent: '#1E1F2B',
      chartObs: '#8BE9FD',
      chartCalc: '#FF79C6',
      chartResid: '#F1FA8C',
    },
  },
  {
    id: 'gruvbox',
    label: 'Warm Tungsten',
    subtitle: 'Low-fatigue warm charcoal',
    polarity: 'dark',
    isDark: true,
    swatchHex: ['#1D2021', '#282828', '#FABD2F'],
    tokens: {
      canvas: '#1D2021',
      surface: '#282828',
      surfaceAlt: '#32302F',
      border: '#5A524C',
      textPrimary: '#FBF1C7',
      textSecondary: '#EBDBB2',
      textMuted: '#C8B99D',
      accent: '#FABD2F',
      accentOnAccent: '#1D2021',
      chartObs: '#83A598',
      chartCalc: '#FB4934',
      chartResid: '#FABD2F',
    },
  },
  {
    id: 'monokai',
    label: 'Spectrometer Dark',
    subtitle: 'Graphite & crisp phosphor accents',
    polarity: 'dark',
    isDark: true,
    swatchHex: ['#1B1C17', '#272822', '#A6E22E'],
    tokens: {
      canvas: '#1B1C17',
      surface: '#272822',
      surfaceAlt: '#32332B',
      border: '#58574A',
      textPrimary: '#F8F8F2',
      textSecondary: '#E6E6DC',
      textMuted: '#BDBBA8',
      accent: '#A6E22E',
      accentOnAccent: '#1B1C17',
      chartObs: '#66D9EF',
      chartCalc: '#F92672',
      chartResid: '#E6DB74',
    },
  },
  {
    id: 'terminal',
    label: 'Phosphor CRT',
    subtitle: 'High-legibility emerald console',
    polarity: 'dark',
    isDark: true,
    swatchHex: ['#030905', '#07140C', '#4ADE80'],
    tokens: {
      canvas: '#030905',
      surface: '#07140C',
      surfaceAlt: '#0D2114',
      border: '#1E6B3A',
      textPrimary: '#B8FFD0',
      textSecondary: '#7CF5A4',
      textMuted: '#4ADE80',
      accent: '#4ADE80',
      accentOnAccent: '#030905',
      chartObs: '#4ADE80',
      chartCalc: '#FDE047',
      chartResid: '#38BDF8',
    },
  },
  {
    id: 'synthwave',
    label: 'Reticle Horizon',
    subtitle: 'Deep indigo-violet & rose optics',
    polarity: 'dark',
    isDark: true,
    swatchHex: ['#120826', '#1C0E38', '#F472B6'],
    tokens: {
      canvas: '#120826',
      surface: '#1C0E38',
      surfaceAlt: '#27144D',
      border: '#5B3494',
      textPrimary: '#FAF5FF',
      textSecondary: '#E9D5FF',
      textMuted: '#D8B4FE',
      accent: '#F472B6',
      accentOnAccent: '#120826',
      chartObs: '#22D3EE',
      chartCalc: '#F472B6',
      chartResid: '#FDE047',
    },
  },
  {
    id: 'cyberpunk',
    label: 'Synchrotron Laser',
    subtitle: 'Pitch-black & calibrated laser cyan',
    polarity: 'dark',
    isDark: true,
    swatchHex: ['#05060A', '#0C0F18', '#00F0FF'],
    tokens: {
      canvas: '#05060A',
      surface: '#0C0F18',
      surfaceAlt: '#141927',
      border: '#1E6F7D',
      textPrimary: '#ECFDF5',
      textSecondary: '#CFFAFE',
      textMuted: '#67E8F9',
      accent: '#00F0FF',
      accentOnAccent: '#05060A',
      chartObs: '#00F0FF',
      chartCalc: '#FF4D9E',
      chartResid: '#FACC15',
    },
  },
];

export const ALL_THEME_IDS: ThemeId[] = THEME_REGISTRY.map((t) => t.id);

export const THEME_MAP: Record<ThemeId, ThemeSpec> = THEME_REGISTRY.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<ThemeId, ThemeSpec>
);

export const COLOR_VISION_MODES: Array<{
  id: ColorVisionMode;
  label: string;
  desc: string;
  swatches: [string, string, string];
}> = [
  {
    id: 'normal',
    label: 'Standard Scientific',
    desc: 'Theme-calibrated diffraction traces',
    swatches: ['#06B6D4', '#F43F5E', '#F59E0B'],
  },
  {
    id: 'deuteranopia',
    label: 'Deuteranopia Safe',
    desc: 'Okabe-Ito Blue / Vermilion / Amber',
    swatches: ['#0072B2', '#D55E00', '#E69F00'],
  },
  {
    id: 'protanopia',
    label: 'Protanopia Safe',
    desc: 'High-luminance Sky / Gold / Magenta',
    swatches: ['#56B4E9', '#E69F00', '#CC79A7'],
  },
  {
    id: 'tritanopia',
    label: 'Tritanopia Safe',
    desc: 'Crimson / Teal / Slate separation',
    swatches: ['#D55E00', '#009E73', '#CC79A7'],
  },
];

/** Normalizes any legacy or unknown theme string into a valid ThemeId. */
export function normalizeThemeId(raw: string | null | undefined): ThemeId {
  if (!raw) return 'light';
  const cleaned = raw.trim().toLowerCase();
  if (cleaned in THEME_MAP) return cleaned as ThemeId;
  if (cleaned === 'ocean') return 'oceanic';
  if (cleaned === 'emerald') return 'terminal';
  if (cleaned === 'sunset') return 'gruvbox';
  return 'light';
}

export function getThemeSpec(themeId: string | null | undefined): ThemeSpec {
  return THEME_MAP[normalizeThemeId(themeId)];
}

export function isDarkTheme(themeId: string | null | undefined): boolean {
  return getThemeSpec(themeId).isDark;
}

/**
 * Returns the exact CSS classes to place on `document.documentElement`.
 * CRITICAL: Every dark-family theme ALWAYS includes `'dark'` so all Tailwind
 * `dark:*` utilities remain active across the entire application without split-brain contrast.
 */
export function getDocumentThemeClasses(themeId: string | null | undefined): string[] {
  const id = normalizeThemeId(themeId);
  const spec = THEME_MAP[id];
  if (spec.isDark) {
    return id === 'dark' ? ['dark'] : ['dark', id];
  }
  return id === 'light' ? [] : [id];
}

/** WCAG 2.1 sRGB Relative Luminance */
export function hexToRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);

  const r8 = parseInt(full.slice(0, 2), 16) / 255;
  const g8 = parseInt(full.slice(2, 4), 16) / 255;
  const b8 = parseInt(full.slice(4, 6), 16) / 255;

  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * linearize(r8) + 0.7152 * linearize(g8) + 0.0722 * linearize(b8);
}

/** Computes exact WCAG 2.1 contrast ratio between two hex colors (1.0 – 21.0). */
export function getContrastRatio(hexA: string, hexB: string): number {
  const l1 = hexToRelativeLuminance(hexA);
  const l2 = hexToRelativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function getWcagGrade(ratio: number): WcagGrade {
  if (ratio >= 7.0) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3.0) return 'AA Large';
  return 'Low';
}

export interface ThemeContrastAudit {
  primaryRatio: number;
  primaryGrade: WcagGrade;
  mutedRatio: number;
  mutedGrade: WcagGrade;
  accentRatio: number;
  accentGrade: WcagGrade;
  overallGrade: WcagGrade;
}

/**
 * Audits a theme's effective WCAG 2.1 contrast ratios under the selected Contrast Enhancement level.
 */
export function getThemeContrastAudit(
  themeId: string | null | undefined,
  contrastLevel: ContrastLevel = 'standard'
): ThemeContrastAudit {
  const spec = getThemeSpec(themeId);
  const { surface, textPrimary, textMuted, accent } = spec.tokens;

  let effSurface = surface;
  let effPrimary = textPrimary;
  let effMuted = textMuted;

  if (contrastLevel === 'enhanced') {
    effPrimary = spec.isDark ? '#FFFFFF' : '#020617';
    effMuted = spec.isDark ? '#CBD5E1' : '#334155';
  } else if (contrastLevel === 'maximum') {
    effSurface = spec.isDark ? '#000000' : '#FFFFFF';
    effPrimary = spec.isDark ? '#FFFFFF' : '#000000';
    effMuted = spec.isDark ? '#E2E8F0' : '#0F172A';
  }

  const primaryRatio = getContrastRatio(effPrimary, effSurface);
  const mutedRatio = getContrastRatio(effMuted, effSurface);
  const accentRatio = getContrastRatio(accent, effSurface);

  const primaryGrade = getWcagGrade(primaryRatio);
  const mutedGrade = getWcagGrade(mutedRatio);
  const accentGrade = getWcagGrade(accentRatio);

  const minCore = Math.min(primaryRatio, mutedRatio);
  const overallGrade = getWcagGrade(minCore);

  return {
    primaryRatio,
    primaryGrade,
    mutedRatio,
    mutedGrade,
    accentRatio,
    accentGrade,
    overallGrade,
  };
}
