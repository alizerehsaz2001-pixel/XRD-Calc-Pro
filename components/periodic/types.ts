import { ScientificProperties } from '../ChemicalPhysicalPropertiesDb';

export interface FamousCompound {
  formula: string;
  name: string;
  crystalSystem: string;
  spaceGroup: string;
  latticeParams: {
    a: number;
    b?: number;
    c?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
  };
  typicalPeaks: { twoTheta: number; intensity: number }[];
  relevance: string;
  shortDesc: string;
}

export type ElementCategory =
  | 'alkali'
  | 'alkaline_earth'
  | 'transition_metal'
  | 'post_transition'
  | 'metalloid'
  | 'nonmetal'
  | 'noble_gas'
  | 'lanthanoid'
  | 'actinoid';

export type CrystalStructureType =
  | 'BCC'
  | 'FCC'
  | 'HCP'
  | 'Diamond'
  | 'Cubic'
  | 'Hexagonal'
  | 'Orthorhombic'
  | 'Rhombohedral'
  | 'Tetragonal'
  | 'Monoclinic'
  | 'Amorphous';

export interface CrystalElement extends ScientificProperties {
  number: number;
  symbol: string;
  name: string;
  weight: number;
  period: number;
  group: number;
  block: 's' | 'p' | 'd' | 'f';
  category: ElementCategory;
  gridX: number;
  gridY: number;
  crystalStructure: CrystalStructureType;
  spaceGroup: string;
  a: number; // Å
  b?: number;
  c?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  density: number; // g/cm³
  meltingPoint: number; // °C
  boilingPoint: number; // °C
  electronConfig: string;
  famousCompounds: FamousCompound[];
  // X-ray absorption and emission metrology
  kEdgeKeV?: number;
  kAlpha1KeV?: number;
  muOverRhoCu?: number; // cm²/g
}

export type HeatmapMode =
  | 'none'
  | 'electronegativity'
  | 'atomicRadius'
  | 'ionizationEnergy'
  | 'electronAffinity'
  | 'density'
  | 'meltingPoint'
  | 'boilingPoint'
  | 'scatteringPower'
  | 'massAttenuation'
  | 'thermalConductivity'
  | 'electricalConductivity';

export type ColorMode = 'category' | 'block' | 'structure' | 'state' | 'heatmap';

export interface QuickPreset {
  id: string;
  label: string;
  description: string;
  elementNumbers: number[];
}
