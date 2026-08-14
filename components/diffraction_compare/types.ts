import { BraggResult } from '../../types';

export interface PeakItem {
  twoTheta: number;
  intensity: number;
  hkl?: string;
  fwhm?: number;
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
}

export interface SpectralMetrics {
  rP: string;
  rWP: string;
  pearsonR: string;
  maxDiff: string;
  rmsd: string;
  chiSquared: string;
}

export interface SearchMatchCandidate {
  material: any;
  pearsonR: number;
  rP: number;
  matchedPeaksCount: number;
  totalPeaksCount: number;
}

export type CompareViewMode = 'stacked' | 'unified' | 'mirrored' | 'derivative' | 'multiphase';
export type DiffTheme = 'neon' | 'emerald' | 'amber' | 'cyan' | 'monochrome';
export type DiagTabMode = 'cards' | 'table' | 'quant' | 'strain' | 'search';
