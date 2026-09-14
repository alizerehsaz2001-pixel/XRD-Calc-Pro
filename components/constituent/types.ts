import { ElementMetrology, FluorescenceRisk } from '../../utils/elementMetrology';

export type MetricMode = 'weight' | 'atomic' | 'scattering' | 'electrons';

export type ElementSortKey = 'formula' | 'mass' | 'atomic' | 'z' | 'electronegativity' | 'radius';

export type ConstituentViewTab = 'composition' | 'attenuation' | 'bonding' | 'fluorescence' | 'doping';

export interface ConstituentElementItem {
  symbol: string;
  name: string;
  z: number;
  count: number;
  baseCount: number;
  atomicWeight: number;
  mass: number;
  massPercent: number;
  atomicPercent: number;
  scattering: number;
  scatteringPercent: number;
  electrons: number;
  electronPercent: number;
  meta: ElementMetrology;
  totalAdjustedMass: number;
  totalAdjustedAtoms: number;
}

export interface PhaseMetrologyMetrics {
  molarMass: number;
  averageZ: number;
  valenceElectronConcentration: number;
  maxDeltaChi: number;
  ionicityPercent: number;
  fluorescenceHazards: {
    symbol: string;
    risk: FluorescenceRisk;
  }[];
  compoundMuOverRhoCu: number;
  compoundMuOverRhoMo: number;
  compoundMuOverRhoCo: number;
}

export interface AnodeSpec {
  name: string;
  energyKeV: number;
  wavelengthA: number;
  betaFilter: string;
  betaFilterKEdgeKeV: number;
  typicalApplication: string;
}

export const LAB_ANODES: AnodeSpec[] = [
  {
    name: 'Cu-Ka',
    energyKeV: 8.048,
    wavelengthA: 1.5406,
    betaFilter: 'Ni (8.33 keV edge)',
    betaFilterKEdgeKeV: 8.333,
    typicalApplication: 'General laboratory XRD, minerals, ceramics, thin films'
  },
  {
    name: 'Co-Ka',
    energyKeV: 6.930,
    wavelengthA: 1.7890,
    betaFilter: 'Fe (7.11 keV edge)',
    betaFilterKEdgeKeV: 7.112,
    typicalApplication: 'Ferrous alloys, steel, Fe/Co-bearing minerals (suppresses Fe-Ka fluorescence)'
  },
  {
    name: 'Mo-Ka',
    energyKeV: 17.479,
    wavelengthA: 0.7093,
    betaFilter: 'Zr (17.99 keV edge)',
    betaFilterKEdgeKeV: 17.998,
    typicalApplication: 'Small molecule single-crystal, high-q range, heavy absorbing metals, capillary transmission'
  },
  {
    name: 'Cr-Ka',
    energyKeV: 5.415,
    wavelengthA: 2.2897,
    betaFilter: 'V (5.46 keV edge)',
    betaFilterKEdgeKeV: 5.465,
    typicalApplication: 'Residual stress, large d-spacings, Ti/V alloys'
  },
  {
    name: 'Fe-Ka',
    energyKeV: 6.404,
    wavelengthA: 1.9360,
    betaFilter: 'Mn (6.54 keV edge)',
    betaFilterKEdgeKeV: 6.539,
    typicalApplication: 'Ferromagnetic samples, magnetic multilayers'
  },
  {
    name: 'Ag-Ka',
    energyKeV: 22.163,
    wavelengthA: 0.5594,
    betaFilter: 'Rh (23.22 keV edge)',
    betaFilterKEdgeKeV: 23.220,
    typicalApplication: 'PDF / Total scattering, extreme transmission depth, diamond anvil cell high pressure'
  }
];
