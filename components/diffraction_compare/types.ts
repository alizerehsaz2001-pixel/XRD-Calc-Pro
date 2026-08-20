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

export type CompareViewMode = 'stacked' | 'unified' | 'mirrored' | 'derivative' | 'multiphase';
export type DiffTheme = 'neon' | 'emerald' | 'amber' | 'cyan' | 'monochrome' | 'cyberpunk';
export type DiagTabMode = 'cards' | 'table' | 'quant' | 'strain' | 'search';
