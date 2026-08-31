import { BraggResult } from '../../types';

export interface PeakItem {
  twoTheta: number;
  intensity: number;
  hkl?: string;
  fwhm?: number;
  dSpacing?: number;
}

export interface MaterialPhase {
  id?: string;
  name: string;
  formula: string;
  crystalSystem?: string;
  spaceGroup?: string;
  isUserSample?: boolean;
  pattern?: string;
  results?: PeakItem[] | BraggResult[];
  scale?: number;
  color?: string;
  visible?: boolean;
}

export interface ProfilePoint {
  twoTheta: number;
  intensityA: number;
  intensityB: number;
  intensityC?: number;
  intensityD?: number;
  intensityTotalModel?: number;
  mirroredB: number;
  difference: number;
  posDiff: number;
  negDiff: number;
  toleranceUpper: number;
  toleranceLower: number;
  derivA: number;
  derivB: number;
  [key: string]: number | undefined;
}

export interface IndexedPeakMatch {
  id: number;
  twoThetaA: number;
  twoThetaB: number | null;
  hklA?: string;
  hklB?: string;
  dSpacingA: string;
  dSpacingB: string;
  shift: number | null;
  intensityA: number;
  intensityB: number;
  status: 'matched' | 'shifted' | 'extra' | 'missing';
  phaseOrigin?: 'Phase B' | 'Phase C' | 'Phase D' | 'Unknown';
}

export interface SpectralMetrics {
  rP: string;
  rWP: string;
  rExp: string;
  chiSquared: string;
  pearsonR: string;
  fom: string; // Figure of Merit (0-100)
  maxDiff: string;
  rmsd: string;
  goodnessOfFit: string;
}

export interface SearchMatchCandidate {
  material: any;
  pearsonR: number;
  rP: number;
  fom: number;
  matchedPeaksCount: number;
  totalPeaksCount: number;
}

export type CompareViewMode = 'stacked' | 'unified' | 'mirrored' | 'derivative' | 'multiphase' | 'split';
export type CurveVisibilityFilter = 'both' | 'only_a' | 'only_b' | 'all' | 'custom';

export interface CurveVisibilityState {
  showA: boolean;
  showB: boolean;
  showC: boolean;
  showD: boolean;
  showDiff: boolean;
  showTotalModel: boolean;
}

export type DiffTheme = 
  | 'neon' 
  | 'emerald' 
  | 'amber' 
  | 'cyan' 
  | 'cyberpunk' 
  | 'monochrome' 
  | 'solar' 
  | 'crimson' 
  | 'violet' 
  | 'high-contrast'
  | 'custom';

export type DiagTabMode = 'cards' | 'table' | 'quant' | 'strain' | 'refinement' | 'search';

export interface CurveColorPalette {
  colorA: string;
  colorB: string;
  colorC: string;
  colorD: string;
  colorDiff: string;
  posDiff: string;
  negDiff: string;
  colorTotalModel: string;
}

export type PeakShapeFunction = 'pseudoVoigt' | 'pearsonVII' | 'gaussian' | 'lorentzian';
export type ChartBackgroundTheme = 'dark-obsidian' | 'deep-black' | 'midnight-navy' | 'high-contrast-light';
export type LineStrokeStyle = 'solid' | 'dashed' | 'dotted';
export type DifferenceMode = 'residual' | 'relative' | 'chi' | 'squared';
export type SmoothingFilter = 'none' | 'savitzky-golay' | 'moving-avg';
export type IntensityScaleType = 'linear' | 'log10' | 'sqrt';

export interface CaliperPoint {
  twoTheta: number;
  intensity: number;
  dSpacing: string;
  qVector: string;
  sourceCurve?: 'A' | 'B' | 'C' | 'D' | 'General';
}

export interface CaliperMeasurement {
  p1: CaliperPoint;
  p2: CaliperPoint;
  deltaTwoTheta: number;
  deltaTwoThetaArcmin: number;
  deltaD: number;
  strainPercent: number;
  intensityRatio: number;
  deltaQ: number;
}

export interface SavedCaliperRecord extends CaliperMeasurement {
  id: string;
  timestamp: string;
  label?: string;
}

export interface NelsonRileyPoint {
  hkl: string;
  twoTheta: number;
  dSpacing: number;
  fnr: number; // Nelson-Riley function value
  apparentA: number;
  residual: number;
}

export interface NelsonRileyFitResult {
  a0: number; // Extrapolated true lattice parameter in Angstrom
  stdErrA0: number;
  slope: number;
  rSquared: number;
  points: NelsonRileyPoint[];
  deltaA: number; // vs reference standard
  strainPercent: number;
  unitCellVolume: number;
  deltaVolumePercent: number;
}

export interface CompareEngineSettings {
  peakShape: PeakShapeFunction;
  fwhm: number;
  eta: number; // Lorentzian fraction (0 to 1) for pseudoVoigt
  pearsonM?: number; // Exponent for Pearson VII
  backgroundLevel: number;
  noiseLevel: number;
  normalizationMode: 'max100' | 'unitArea' | 'raw';
  strokeWidth: number;
  enableGlow: boolean;
  areaOpacity: number;
  bgTheme: ChartBackgroundTheme;
  styleB: LineStrokeStyle;
  differenceMode?: DifferenceMode;
  smoothingFilter?: SmoothingFilter;
  intensityScale?: IntensityScaleType;
  stripBackground?: boolean;
  waterfallOffset?: number; // Custom vertical offset in stacked view
}


