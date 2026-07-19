// Chemical & Physical properties database of elements
// Sources: CRC Handbook of Chemistry and Physics, WebElements, IUPAC Periodic Table data.

export interface ScientificProperties {
  valenceElectrons: number;
  electronegativity: number; // Pauling scale
  ionizationEnergy: number; // eV
  electronAffinity: number; // eV
  metallicCharacter: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Metalloid' | 'Non-metallic';
  nonMetallicCharacter: 'Extreme' | 'Very High' | 'High' | 'Moderate' | 'Low' | 'None';
  atomicRadius: number; // pm
  ionicRadius: string; // pm (e.g., "76 (+1)")
  boilingPoint: number; // °C
  electricalConductivity: number; // MS/m at 20°C
  thermalConductivity: number; // W/m·K at 27°C
  electronConfig?: string; // Standard ground-state configuration
  mohsHardness?: number; // Mohs scale
  speedOfSound?: number; // m/s
  thermalExpansion?: number; // µm/(m·K)
  specificHeat?: number; // J/(g·K)
  factEn?: string; // Scientific Fact in English
  factFa?: string; // Scientific Fact in Persian/Farsi
}

export const chemicalPhysicalDb: Record<number, ScientificProperties> = {
  1: { // Hydrogen
    valenceElectrons: 1,
    electronegativity: 2.20,
    ionizationEnergy: 13.598,
    electronAffinity: 0.754,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Very High',
    atomicRadius: 37,
    ionicRadius: '137 (-1)',
    boilingPoint: -252.87,
    electricalConductivity: 0,
    thermalConductivity: 0.18
  },
  2: { // Helium
    valenceElectrons: 2,
    electronegativity: 0,
    ionizationEnergy: 24.587,
    electronAffinity: -0.5,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Extreme',
    atomicRadius: 31,
    ionicRadius: 'None',
    boilingPoint: -268.93,
    electricalConductivity: 0,
    thermalConductivity: 0.15
  },
  3: { // Lithium
    valenceElectrons: 1,
    electronegativity: 0.98,
    ionizationEnergy: 5.392,
    electronAffinity: 0.618,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 152,
    ionicRadius: '76 (+1)',
    boilingPoint: 1342,
    electricalConductivity: 10.8,
    thermalConductivity: 84.8
  },
  4: { // Beryllium
    valenceElectrons: 2,
    electronegativity: 1.57,
    ionizationEnergy: 9.323,
    electronAffinity: -0.5,
    metallicCharacter: 'Moderate',
    nonMetallicCharacter: 'None',
    atomicRadius: 112,
    ionicRadius: '45 (+2)',
    boilingPoint: 2470,
    electricalConductivity: 25.0,
    thermalConductivity: 200
  },
  5: { // Boron
    valenceElectrons: 3,
    electronegativity: 2.04,
    ionizationEnergy: 8.298,
    electronAffinity: 0.277,
    metallicCharacter: 'Metalloid',
    nonMetallicCharacter: 'Moderate',
    atomicRadius: 85,
    ionicRadius: '27 (+3)',
    boilingPoint: 3927,
    electricalConductivity: 0.0001,
    thermalConductivity: 27.0
  },
  6: { // Carbon
    valenceElectrons: 4,
    electronegativity: 2.55,
    ionizationEnergy: 11.260,
    electronAffinity: 1.263,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'High',
    atomicRadius: 77,
    ionicRadius: '16 (+4)',
    boilingPoint: 4827,
    electricalConductivity: 0.1, // Graphite
    thermalConductivity: 140.0
  },
  7: { // Nitrogen
    valenceElectrons: 5,
    electronegativity: 3.04,
    ionizationEnergy: 14.534,
    electronAffinity: -0.07,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Very High',
    atomicRadius: 71,
    ionicRadius: '146 (-3)',
    boilingPoint: -195.79,
    electricalConductivity: 0,
    thermalConductivity: 0.026
  },
  8: { // Oxygen
    valenceElectrons: 6,
    electronegativity: 3.44,
    ionizationEnergy: 13.618,
    electronAffinity: 1.461,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Extreme',
    atomicRadius: 66,
    ionicRadius: '140 (-2)',
    boilingPoint: -182.95,
    electricalConductivity: 0,
    thermalConductivity: 0.027
  },
  9: { // Fluorine
    valenceElectrons: 7,
    electronegativity: 3.98,
    ionizationEnergy: 17.423,
    electronAffinity: 3.401,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Extreme',
    atomicRadius: 64,
    ionicRadius: '133 (-1)',
    boilingPoint: -188.11,
    electricalConductivity: 0,
    thermalConductivity: 0.028
  },
  10: { // Neon
    valenceElectrons: 8,
    electronegativity: 0,
    ionizationEnergy: 21.565,
    electronAffinity: -1.2,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Extreme',
    atomicRadius: 38,
    ionicRadius: 'None',
    boilingPoint: -246.08,
    electricalConductivity: 0,
    thermalConductivity: 0.049
  },
  11: { // Sodium
    valenceElectrons: 1,
    electronegativity: 0.93,
    ionizationEnergy: 5.139,
    electronAffinity: 0.548,
    metallicCharacter: 'Very High',
    nonMetallicCharacter: 'None',
    atomicRadius: 186,
    ionicRadius: '102 (+1)',
    boilingPoint: 883,
    electricalConductivity: 21.0,
    thermalConductivity: 142.0
  },
  12: { // Magnesium
    valenceElectrons: 2,
    electronegativity: 1.31,
    ionizationEnergy: 7.646,
    electronAffinity: -0.4,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 160,
    ionicRadius: '72 (+2)',
    boilingPoint: 1090,
    electricalConductivity: 22.6,
    thermalConductivity: 156.0
  },
  13: { // Aluminum
    valenceElectrons: 3,
    electronegativity: 1.61,
    ionizationEnergy: 5.986,
    electronAffinity: 0.441,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 143,
    ionicRadius: '54 (+3)',
    boilingPoint: 2519,
    electricalConductivity: 37.7,
    thermalConductivity: 237.0
  },
  14: { // Silicon
    valenceElectrons: 4,
    electronegativity: 1.90,
    ionizationEnergy: 8.152,
    electronAffinity: 1.385,
    metallicCharacter: 'Metalloid',
    nonMetallicCharacter: 'Moderate',
    atomicRadius: 111,
    ionicRadius: '40 (+4)',
    boilingPoint: 3265,
    electricalConductivity: 0.0016,
    thermalConductivity: 149.0
  },
  15: { // Phosphorus
    valenceElectrons: 5,
    electronegativity: 2.19,
    ionizationEnergy: 10.487,
    electronAffinity: 0.746,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Moderate',
    atomicRadius: 106,
    ionicRadius: '44 (+3)',
    boilingPoint: 280.5,
    electricalConductivity: 0.0000001,
    thermalConductivity: 0.236
  },
  16: { // Sulfur
    valenceElectrons: 6,
    electronegativity: 2.58,
    ionizationEnergy: 10.360,
    electronAffinity: 2.077,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'High',
    atomicRadius: 102,
    ionicRadius: '184 (-2)',
    boilingPoint: 444.6,
    electricalConductivity: 0.000000001,
    thermalConductivity: 0.205
  },
  17: { // Chlorine
    valenceElectrons: 7,
    electronegativity: 3.16,
    ionizationEnergy: 12.968,
    electronAffinity: 3.617,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Extreme',
    atomicRadius: 99,
    ionicRadius: '181 (-1)',
    boilingPoint: -34.04,
    electricalConductivity: 0,
    thermalConductivity: 0.009
  },
  18: { // Argon
    valenceElectrons: 8,
    electronegativity: 0,
    ionizationEnergy: 15.760,
    electronAffinity: -0.96,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Extreme',
    atomicRadius: 71,
    ionicRadius: 'None',
    boilingPoint: -185.85,
    electricalConductivity: 0,
    thermalConductivity: 0.018
  },
  19: { // Potassium
    valenceElectrons: 1,
    electronegativity: 0.82,
    ionizationEnergy: 4.341,
    electronAffinity: 0.501,
    metallicCharacter: 'Very High',
    nonMetallicCharacter: 'None',
    atomicRadius: 227,
    ionicRadius: '138 (+1)',
    boilingPoint: 759,
    electricalConductivity: 13.9,
    thermalConductivity: 102.0
  },
  20: { // Calcium
    valenceElectrons: 2,
    electronegativity: 1.00,
    ionizationEnergy: 6.113,
    electronAffinity: 0.02,
    metallicCharacter: 'Very High',
    nonMetallicCharacter: 'None',
    atomicRadius: 197,
    ionicRadius: '100 (+2)',
    boilingPoint: 1484,
    electricalConductivity: 29.8,
    thermalConductivity: 201.0
  },
  21: { // Scandium
    valenceElectrons: 3,
    electronegativity: 1.36,
    ionizationEnergy: 6.561,
    electronAffinity: 0.188,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 162,
    ionicRadius: '74.5 (+3)',
    boilingPoint: 2830,
    electricalConductivity: 1.8,
    thermalConductivity: 15.8
  },
  22: { // Titanium
    valenceElectrons: 4,
    electronegativity: 1.54,
    ionizationEnergy: 6.828,
    electronAffinity: 0.079,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 147,
    ionicRadius: '60.5 (+4)',
    boilingPoint: 3287,
    electricalConductivity: 2.38,
    thermalConductivity: 21.9
  },
  23: { // Vanadium
    valenceElectrons: 5,
    electronegativity: 1.63,
    ionizationEnergy: 6.746,
    electronAffinity: 0.525,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 134,
    ionicRadius: '54 (+5)',
    boilingPoint: 3407,
    electricalConductivity: 5.0,
    thermalConductivity: 30.7
  },
  24: { // Chromium
    valenceElectrons: 6,
    electronegativity: 1.66,
    ionizationEnergy: 6.767,
    electronAffinity: 0.666,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 128,
    ionicRadius: '73 (+3)',
    boilingPoint: 2671,
    electricalConductivity: 7.9,
    thermalConductivity: 93.9
  },
  25: { // Manganese
    valenceElectrons: 7,
    electronegativity: 1.55,
    ionizationEnergy: 7.434,
    electronAffinity: -0.5,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 127,
    ionicRadius: '83 (+2)',
    boilingPoint: 2061,
    electricalConductivity: 0.69,
    thermalConductivity: 7.8
  },
  26: { // Iron
    valenceElectrons: 8,
    electronegativity: 1.83,
    ionizationEnergy: 7.902,
    electronAffinity: 0.151,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 126,
    ionicRadius: '78 (+2)',
    boilingPoint: 2862,
    electricalConductivity: 10.0,
    thermalConductivity: 80.4
  },
  27: { // Cobalt
    valenceElectrons: 9,
    electronegativity: 1.88,
    ionizationEnergy: 7.881,
    electronAffinity: 0.661,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 125,
    ionicRadius: '74.5 (+2)',
    boilingPoint: 2927,
    electricalConductivity: 17.2,
    thermalConductivity: 100.0
  },
  28: { // Nickel
    valenceElectrons: 10,
    electronegativity: 1.91,
    ionizationEnergy: 7.640,
    electronAffinity: 1.156,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 124,
    ionicRadius: '69 (+2)',
    boilingPoint: 2913,
    electricalConductivity: 14.3,
    thermalConductivity: 90.9
  },
  29: { // Copper
    valenceElectrons: 11,
    electronegativity: 1.90,
    ionizationEnergy: 7.726,
    electronAffinity: 1.235,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 128,
    ionicRadius: '73 (+2)',
    boilingPoint: 2562,
    electricalConductivity: 59.6,
    thermalConductivity: 401.0
  },
  30: { // Zinc
    valenceElectrons: 2,
    electronegativity: 1.65,
    ionizationEnergy: 9.394,
    electronAffinity: -0.5,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 134,
    ionicRadius: '74 (+2)',
    boilingPoint: 907,
    electricalConductivity: 16.6,
    thermalConductivity: 116.0
  },
  31: { // Gallium
    valenceElectrons: 3,
    electronegativity: 1.81,
    ionizationEnergy: 5.999,
    electronAffinity: 0.3,
    metallicCharacter: 'Moderate',
    nonMetallicCharacter: 'None',
    atomicRadius: 135,
    ionicRadius: '62 (+3)',
    boilingPoint: 2204,
    electricalConductivity: 7.1,
    thermalConductivity: 29.4
  },
  32: { // Germanium
    valenceElectrons: 4,
    electronegativity: 2.01,
    ionizationEnergy: 7.899,
    electronAffinity: 1.2,
    metallicCharacter: 'Metalloid',
    nonMetallicCharacter: 'Moderate',
    atomicRadius: 122,
    ionicRadius: '53 (+4)',
    boilingPoint: 2833,
    electricalConductivity: 0.002,
    thermalConductivity: 60.2
  },
  33: { // Arsenic
    valenceElectrons: 5,
    electronegativity: 2.18,
    ionizationEnergy: 9.814,
    electronAffinity: 0.81,
    metallicCharacter: 'Metalloid',
    nonMetallicCharacter: 'Moderate',
    atomicRadius: 119,
    ionicRadius: '58 (+3)',
    boilingPoint: 614,
    electricalConductivity: 3.45,
    thermalConductivity: 50.2
  },
  34: { // Selenium
    valenceElectrons: 6,
    electronegativity: 2.55,
    ionizationEnergy: 9.752,
    electronAffinity: 2.021,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'High',
    atomicRadius: 116,
    ionicRadius: '198 (-2)',
    boilingPoint: 685,
    electricalConductivity: 0.0001,
    thermalConductivity: 0.519
  },
  35: { // Bromine
    valenceElectrons: 7,
    electronegativity: 2.96,
    ionizationEnergy: 11.814,
    electronAffinity: 3.365,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Very High',
    atomicRadius: 114,
    ionicRadius: '196 (-1)',
    boilingPoint: 58.8,
    electricalConductivity: 0,
    thermalConductivity: 0.12
  },
  36: { // Krypton
    valenceElectrons: 8,
    electronegativity: 3.00,
    ionizationEnergy: 14.00,
    electronAffinity: -0.5,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Extreme',
    atomicRadius: 112,
    ionicRadius: 'None',
    boilingPoint: -153.22,
    electricalConductivity: 0,
    thermalConductivity: 0.0094
  },
  37: { // Rubidium
    valenceElectrons: 1,
    electronegativity: 0.82,
    ionizationEnergy: 4.177,
    electronAffinity: 0.486,
    metallicCharacter: 'Very High',
    nonMetallicCharacter: 'None',
    atomicRadius: 248,
    ionicRadius: '152 (+1)',
    boilingPoint: 688,
    electricalConductivity: 8.0,
    thermalConductivity: 58.2
  },
  38: { // Strontium
    valenceElectrons: 2,
    electronegativity: 0.95,
    ionizationEnergy: 5.695,
    electronAffinity: 0.05,
    metallicCharacter: 'Very High',
    nonMetallicCharacter: 'None',
    atomicRadius: 215,
    ionicRadius: '118 (+2)',
    boilingPoint: 1382,
    electricalConductivity: 7.6,
    thermalConductivity: 35.4
  },
  39: { // Yttrium
    valenceElectrons: 3,
    electronegativity: 1.22,
    ionizationEnergy: 6.217,
    electronAffinity: 0.307,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 180,
    ionicRadius: '90 (+3)',
    boilingPoint: 3345,
    electricalConductivity: 1.8,
    thermalConductivity: 17.2
  },
  40: { // Zirconium
    valenceElectrons: 4,
    electronegativity: 1.33,
    ionizationEnergy: 6.634,
    electronAffinity: 0.426,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 160,
    ionicRadius: '72 (+4)',
    boilingPoint: 4409,
    electricalConductivity: 2.4,
    thermalConductivity: 22.6
  },
  41: { // Niobium
    valenceElectrons: 5,
    electronegativity: 1.60,
    ionizationEnergy: 6.759,
    electronAffinity: 0.893,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 146,
    ionicRadius: '64 (+5)',
    boilingPoint: 4744,
    electricalConductivity: 6.5,
    thermalConductivity: 53.7
  },
  42: { // Molybdenum
    valenceElectrons: 6,
    electronegativity: 2.16,
    ionizationEnergy: 7.092,
    electronAffinity: 0.746,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 139,
    ionicRadius: '69 (+3)',
    boilingPoint: 4639,
    electricalConductivity: 19.0,
    thermalConductivity: 138.0
  },
  43: { // Technetium
    valenceElectrons: 7,
    electronegativity: 1.9,
    ionizationEnergy: 7.28,
    electronAffinity: 0.55,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 136,
    ionicRadius: '64.5 (+4)',
    boilingPoint: 4265,
    electricalConductivity: 5.0,
    thermalConductivity: 50.6
  },
  44: { // Ruthenium
    valenceElectrons: 8,
    electronegativity: 2.2,
    ionizationEnergy: 7.36,
    electronAffinity: 1.05,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 134,
    ionicRadius: '68 (+3)',
    boilingPoint: 4150,
    electricalConductivity: 13.7,
    thermalConductivity: 117.0
  },
  45: { // Rhodium
    valenceElectrons: 9,
    electronegativity: 2.28,
    ionizationEnergy: 7.46,
    electronAffinity: 1.14,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 135,
    ionicRadius: '66.5 (+3)',
    boilingPoint: 3695,
    electricalConductivity: 21.1,
    thermalConductivity: 150.0
  },
  46: { // Palladium
    valenceElectrons: 10,
    electronegativity: 2.20,
    ionizationEnergy: 8.337,
    electronAffinity: 0.557,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 137,
    ionicRadius: '86 (+2)',
    boilingPoint: 2963,
    electricalConductivity: 10.0,
    thermalConductivity: 71.8
  },
  47: { // Silver
    valenceElectrons: 11,
    electronegativity: 1.93,
    ionizationEnergy: 7.576,
    electronAffinity: 1.302,
    metallicCharacter: 'Very High',
    nonMetallicCharacter: 'None',
    atomicRadius: 144,
    ionicRadius: '115 (+1)',
    boilingPoint: 2162,
    electricalConductivity: 63.0,
    thermalConductivity: 429.0
  },
  48: { // Cadmium
    valenceElectrons: 2,
    electronegativity: 1.69,
    ionizationEnergy: 8.993,
    electronAffinity: -0.5,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 151,
    ionicRadius: '95 (+2)',
    boilingPoint: 767,
    electricalConductivity: 13.8,
    thermalConductivity: 96.6
  },
  49: { // Indium
    valenceElectrons: 3,
    electronegativity: 1.78,
    ionizationEnergy: 5.786,
    electronAffinity: 0.3,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 167,
    ionicRadius: '80 (+3)',
    boilingPoint: 2072,
    electricalConductivity: 11.6,
    thermalConductivity: 81.8
  },
  50: { // Tin
    valenceElectrons: 4,
    electronegativity: 1.96,
    ionizationEnergy: 7.344,
    electronAffinity: 1.2,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 140,
    ionicRadius: '112 (+2)',
    boilingPoint: 2602,
    electricalConductivity: 9.17,
    thermalConductivity: 66.8
  },
  51: { // Antimony
    valenceElectrons: 5,
    electronegativity: 2.05,
    ionizationEnergy: 8.64,
    electronAffinity: 1.07,
    metallicCharacter: 'Metalloid',
    nonMetallicCharacter: 'Moderate',
    atomicRadius: 140,
    ionicRadius: '76 (+3)',
    boilingPoint: 1587,
    electricalConductivity: 2.56,
    thermalConductivity: 24.3
  },
  52: { // Tellurium
    valenceElectrons: 6,
    electronegativity: 2.1,
    ionizationEnergy: 9.009,
    electronAffinity: 1.971,
    metallicCharacter: 'Metalloid',
    nonMetallicCharacter: 'Moderate',
    atomicRadius: 142,
    ionicRadius: '221 (-2)',
    boilingPoint: 988,
    electricalConductivity: 0.01,
    thermalConductivity: 3.0
  },
  53: { // Iodine
    valenceElectrons: 7,
    electronegativity: 2.66,
    ionizationEnergy: 10.451,
    electronAffinity: 3.059,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'High',
    atomicRadius: 133,
    ionicRadius: '220 (-1)',
    boilingPoint: 184.3,
    electricalConductivity: 0.0000000001,
    thermalConductivity: 0.449
  },
  54: { // Xenon
    valenceElectrons: 8,
    electronegativity: 2.6,
    ionizationEnergy: 12.130,
    electronAffinity: -0.5,
    metallicCharacter: 'Non-metallic',
    nonMetallicCharacter: 'Extreme',
    atomicRadius: 131,
    ionicRadius: 'None',
    boilingPoint: -108.12,
    electricalConductivity: 0,
    thermalConductivity: 0.0056
  },
  55: { // Cesium
    valenceElectrons: 1,
    electronegativity: 0.79,
    ionizationEnergy: 3.894,
    electronAffinity: 0.472,
    metallicCharacter: 'Very High',
    nonMetallicCharacter: 'None',
    atomicRadius: 265,
    ionicRadius: '167 (+1)',
    boilingPoint: 671,
    electricalConductivity: 4.8,
    thermalConductivity: 35.9
  },
  56: { // Barium
    valenceElectrons: 2,
    electronegativity: 0.89,
    ionizationEnergy: 5.212,
    electronAffinity: 0.145,
    metallicCharacter: 'Very High',
    nonMetallicCharacter: 'None',
    atomicRadius: 222,
    ionicRadius: '135 (+2)',
    boilingPoint: 1897,
    electricalConductivity: 2.9,
    thermalConductivity: 18.4
  },
  57: { // Lanthanum
    valenceElectrons: 3,
    electronegativity: 1.10,
    ionizationEnergy: 5.577,
    electronAffinity: 0.5,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 187,
    ionicRadius: '103.2 (+3)',
    boilingPoint: 3464,
    electricalConductivity: 1.6,
    thermalConductivity: 13.4
  },
  72: { // Hafnium
    valenceElectrons: 4,
    electronegativity: 1.3,
    ionizationEnergy: 6.825,
    electronAffinity: 0.0,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 159,
    ionicRadius: '71 (+4)',
    boilingPoint: 4603,
    electricalConductivity: 3.12,
    thermalConductivity: 23.0
  },
  73: { // Tantalum
    valenceElectrons: 5,
    electronegativity: 1.5,
    ionizationEnergy: 7.549,
    electronAffinity: 0.32,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 146,
    ionicRadius: '72 (+5)',
    boilingPoint: 5458,
    electricalConductivity: 7.6,
    thermalConductivity: 57.5
  },
  74: { // Tungsten
    valenceElectrons: 6,
    electronegativity: 2.36,
    ionizationEnergy: 7.864,
    electronAffinity: 0.815,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 139,
    ionicRadius: '66 (+4)',
    boilingPoint: 5555,
    electricalConductivity: 18.9,
    thermalConductivity: 173.0
  },
  75: { // Rhenium
    valenceElectrons: 7,
    electronegativity: 1.9,
    ionizationEnergy: 7.83,
    electronAffinity: 0.15,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 137,
    ionicRadius: '63 (+4)',
    boilingPoint: 5596,
    electricalConductivity: 5.2,
    thermalConductivity: 48.0
  },
  76: { // Osmium
    valenceElectrons: 8,
    electronegativity: 2.2,
    ionizationEnergy: 8.43,
    electronAffinity: 1.1,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 135,
    ionicRadius: '63 (+4)',
    boilingPoint: 5012,
    electricalConductivity: 12.3,
    thermalConductivity: 87.6
  },
  77: { // Iridium
    valenceElectrons: 9,
    electronegativity: 2.2,
    ionizationEnergy: 8.96,
    electronAffinity: 1.56,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 136,
    ionicRadius: '68 (+4)',
    boilingPoint: 4428,
    electricalConductivity: 21.1,
    thermalConductivity: 147.0
  },
  78: { // Platinum
    valenceElectrons: 10,
    electronegativity: 2.28,
    ionizationEnergy: 8.959,
    electronAffinity: 2.128,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 139,
    ionicRadius: '62.5 (+4)',
    boilingPoint: 3825,
    electricalConductivity: 9.66,
    thermalConductivity: 71.6
  },
  79: { // Gold
    valenceElectrons: 11,
    electronegativity: 2.54,
    ionizationEnergy: 9.225,
    electronAffinity: 2.308,
    metallicCharacter: 'Very High',
    nonMetallicCharacter: 'None',
    atomicRadius: 144,
    ionicRadius: '137 (+1)',
    boilingPoint: 2856,
    electricalConductivity: 41.1,
    thermalConductivity: 318.0
  },
  80: { // Mercury
    valenceElectrons: 2,
    electronegativity: 2.00,
    ionizationEnergy: 10.437,
    electronAffinity: -0.5,
    metallicCharacter: 'Moderate',
    nonMetallicCharacter: 'None',
    atomicRadius: 151,
    ionicRadius: '102 (+2)',
    boilingPoint: 356.7,
    electricalConductivity: 1.04,
    thermalConductivity: 8.3
  },
  81: { // Thallium
    valenceElectrons: 3,
    electronegativity: 1.62,
    ionizationEnergy: 6.108,
    electronAffinity: 0.3,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 170,
    ionicRadius: '150 (+1)',
    boilingPoint: 1473,
    electricalConductivity: 6.7,
    thermalConductivity: 46.1
  },
  82: { // Lead
    valenceElectrons: 4,
    electronegativity: 2.33,
    ionizationEnergy: 7.416,
    electronAffinity: 0.36,
    metallicCharacter: 'Moderate',
    nonMetallicCharacter: 'None',
    atomicRadius: 175,
    ionicRadius: '119 (+2)',
    boilingPoint: 1749,
    electricalConductivity: 4.8,
    thermalConductivity: 35.3
  },
  83: { // Bismuth
    valenceElectrons: 5,
    electronegativity: 2.02,
    ionizationEnergy: 7.289,
    electronAffinity: 0.946,
    metallicCharacter: 'Moderate',
    nonMetallicCharacter: 'None',
    atomicRadius: 155,
    ionicRadius: '103 (+3)',
    boilingPoint: 1564,
    electricalConductivity: 0.77,
    thermalConductivity: 7.97
  },
  90: { // Thorium
    valenceElectrons: 4,
    electronegativity: 1.3,
    ionizationEnergy: 6.30,
    electronAffinity: 0.5,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 179,
    ionicRadius: '94 (+4)',
    boilingPoint: 4788,
    electricalConductivity: 6.4,
    thermalConductivity: 54.0
  },
  92: { // Uranium
    valenceElectrons: 6,
    electronegativity: 1.38,
    ionizationEnergy: 6.194,
    electronAffinity: 0.5,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 156,
    ionicRadius: '89 (+4)',
    boilingPoint: 4131,
    electricalConductivity: 3.6,
    thermalConductivity: 27.5
  },
  94: { // Plutonium
    valenceElectrons: 4,
    electronegativity: 1.28,
    ionizationEnergy: 6.06,
    electronAffinity: 0.5,
    metallicCharacter: 'High',
    nonMetallicCharacter: 'None',
    atomicRadius: 159,
    ionicRadius: '86 (+4)',
    boilingPoint: 3228,
    electricalConductivity: 1.0,
    thermalConductivity: 6.7
  }
};

// Returns standard properties or derives approximation if not listed
export function getElectronConfig(number: number): string {
  // Map of elements with exact electron configurations using superscripts
  const exactConfigs: Record<number, string> = {
    1: '1s¹',
    2: '1s²',
    3: '[He] 2s¹',
    4: '[He] 2s²',
    5: '[He] 2s² 2p¹',
    6: '[He] 2s² 2p²',
    7: '[He] 2s² 2p³',
    8: '[He] 2s² 2p⁴',
    9: '[He] 2s² 2p⁵',
    10: '[He] 2s² 2p⁶',
    11: '[Ne] 3s¹',
    12: '[Ne] 3s²',
    13: '[Ne] 3s² 3p¹',
    14: '[Ne] 3s² 3p²',
    15: '[Ne] 3s² 3p³',
    16: '[Ne] 3s² 3p⁴',
    17: '[Ne] 3s² 3p⁵',
    18: '[Ne] 3s² 3p⁶',
    19: '[Ar] 4s¹',
    20: '[Ar] 4s²',
    21: '[Ar] 3d¹ 4s²',
    22: '[Ar] 3d² 4s²',
    23: '[Ar] 3d³ 4s²',
    24: '[Ar] 3d⁵ 4s¹', // Cr exception
    25: '[Ar] 3d⁵ 4s²',
    26: '[Ar] 3d⁶ 4s²',
    27: '[Ar] 3d⁷ 4s²',
    28: '[Ar] 3d⁸ 4s²',
    29: '[Ar] 3d¹⁰ 4s¹', // Cu exception
    30: '[Ar] 3d¹⁰ 4s²',
    31: '[Ar] 3d¹⁰ 4s² 4p¹',
    32: '[Ar] 3d¹⁰ 4s² 4p²',
    33: '[Ar] 3d¹⁰ 4s² 4p³',
    34: '[Ar] 3d¹⁰ 4s² 4p⁴',
    35: '[Ar] 3d¹⁰ 4s² 4p⁵',
    36: '[Ar] 3d¹⁰ 4s² 4p⁶',
    37: '[Kr] 5s¹',
    38: '[Kr] 5s²',
    39: '[Kr] 4d¹ 5s²',
    40: '[Kr] 4d² 5s²',
    41: '[Kr] 4d⁴ 5s¹', // Nb exception
    42: '[Kr] 4d⁵ 5s¹', // Mo exception
    43: '[Kr] 4d⁵ 5s²',
    44: '[Kr] 4d⁷ 5s¹', // Ru exception
    45: '[Kr] 4d⁸ 5s¹', // Rh exception
    46: '[Kr] 4d¹⁰',     // Pd exception
    47: '[Kr] 4d¹⁰ 5s¹', // Ag exception
    48: '[Kr] 4d¹⁰ 5s²',
    49: '[Kr] 4d¹⁰ 5s² 5p¹',
    50: '[Kr] 4d¹⁰ 5s² 5p²',
    51: '[Kr] 4d¹⁰ 5s² 5p³',
    52: '[Kr] 4d¹⁰ 5s² 5p⁴',
    53: '[Kr] 4d¹⁰ 5s² 5p⁵',
    54: '[Kr] 4d¹⁰ 5s² 5p⁶',
    55: '[Xe] 6s¹',
    56: '[Xe] 6s²',
    57: '[Xe] 5d¹ 6s²',
    58: '[Xe] 4f¹ 5d¹ 6s²',
    59: '[Xe] 4f³ 6s²',
    60: '[Xe] 4f⁴ 6s²',
    61: '[Xe] 4f⁵ 6s²',
    62: '[Xe] 4f⁶ 6s²',
    63: '[Xe] 4f⁷ 6s²',
    64: '[Xe] 4f⁷ 5d¹ 6s²',
    65: '[Xe] 4f⁹ 6s²',
    66: '[Xe] 4f¹⁰ 6s²',
    67: '[Xe] 4f¹¹ 6s²',
    68: '[Xe] 4f¹² 6s²',
    69: '[Xe] 4f¹³ 6s²',
    70: '[Xe] 4f¹⁴ 6s²',
    71: '[Xe] 4f¹⁴ 5d¹ 6s²',
    72: '[Xe] 4f¹⁴ 5d² 6s²',
    73: '[Xe] 4f¹⁴ 5d³ 6s²',
    74: '[Xe] 4f¹⁴ 5d⁴ 6s²',
    75: '[Xe] 4f¹⁴ 5d⁵ 6s²',
    76: '[Xe] 4f¹⁴ 5d⁶ 6s²',
    77: '[Xe] 4f¹⁴ 5d⁷ 6s²',
    78: '[Xe] 4f¹⁴ 5d⁹ 6s¹', // Pt exception
    79: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', // Au exception
    80: '[Xe] 4f¹⁴ 5d¹⁰ 6s²',
    81: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹',
    82: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²',
    83: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³',
    84: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴',
    85: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵',
    86: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶',
    87: '[Rn] 7s¹',
    88: '[Rn] 7s²',
    89: '[Rn] 6d¹ 7s²',
    90: '[Rn] 6d² 7s²', // Th exception
    91: '[Rn] 5f² 6d¹ 7s²',
    92: '[Rn] 5f³ 6d¹ 7s²',
    93: '[Rn] 5f⁴ 6d¹ 7s²',
    94: '[Rn] 5f⁶ 7s²',
    95: '[Rn] 5f⁷ 7s²',
    96: '[Rn] 5f⁷ 6d¹ 7s²',
    97: '[Rn] 5f⁹ 7s²',
    98: '[Rn] 5f¹⁰ 7s²',
    99: '[Rn] 5f¹¹ 7s²',
    100: '[Rn] 5f¹² 7s²',
    101: '[Rn] 5f¹³ 7s²',
    102: '[Rn] 5f¹³ 7s²',
    103: '[Rn] 5f¹⁴ 6d¹ 7s²',
    104: '[Rn] 5f¹⁴ 6d² 7s²',
    105: '[Rn] 5f¹⁴ 6d³ 7s²',
    106: '[Rn] 5f¹⁴ 6d⁴ 7s²',
    107: '[Rn] 5f¹⁴ 6d⁵ 7s²',
    108: '[Rn] 5f¹⁴ 6d⁶ 7s²',
    109: '[Rn] 5f¹⁴ 6d⁷ 7s²',
    110: '[Rn] 5f¹⁴ 6d⁸ 7s²',
    111: '[Rn] 5f¹⁴ 6d⁹ 7s²',
    112: '[Rn] 5f¹⁴ 6d¹⁰ 7s²',
    113: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹',
    114: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²',
    115: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³',
    116: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴',
    117: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵',
    118: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶'
  };

  const str = exactConfigs[number] || `[Inert] Config ${number}`;
  
  // Expand noble gas notation
  return str
    .replace('[He]', '1s²')
    .replace('[Ne]', '1s² 2s² 2p⁶')
    .replace('[Ar]', '1s² 2s² 2p⁶ 3s² 3p⁶')
    .replace('[Kr]', '1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶')
    .replace('[Xe]', '1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 5s² 5p⁶')
    .replace('[Rn]', '1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 5s² 5p⁶ 4f¹⁴ 5d¹⁰ 6s² 6p⁶');
}

const scientificFactsAndPhysicalExtras: Record<number, {
  mohsHardness?: number;
  speedOfSound?: number; // m/s
  thermalExpansion?: number; // µm/(m·K)
  specificHeat?: number; // J/(g·K)
  factEn: string;
  factFa: string;
}> = {
  1: {
    mohsHardness: 0,
    speedOfSound: 1310,
    thermalExpansion: 0,
    specificHeat: 14.304,
    factEn: "Hydrogen makes up about 75% of the baryonic mass of the universe. It is the fuel that powers stars through nuclear fusion.",
    factFa: "هیدروژن حدود ۷۵٪ از جرم باریونی جهان هستی را تشکیل می‌دهد. این عنصر سوخت اصلی ستاره‌ها برای همجوشی هسته‌ای است."
  },
  2: {
    mohsHardness: 0,
    speedOfSound: 970,
    thermalExpansion: 0,
    specificHeat: 5.193,
    factEn: "Helium is the only element that cannot be solidified by sufficient cooling at normal atmospheric pressure; it remains liquid down to absolute zero.",
    factFa: "هلیم تنها عنصری است که نمی‌توان آن را با سرمایش در فشار استاندارد جامد کرد؛ این عنصر حتی در صفر مطلق نیز مایع می‌ماند."
  },
  3: {
    mohsHardness: 0.6,
    speedOfSound: 6000,
    thermalExpansion: 46,
    specificHeat: 3.582,
    factEn: "Lithium is the lightest of all solid metals. It has the highest specific heat capacity of any solid element, making it highly useful in heat transfer applications.",
    factFa: "لیتیم سبک‌ترین فلز در جدول تناوبی است. این عنصر بالاترین ظرفیت گرمایی ویژه را در میان عناصر جامد دارد که آن را در انتقال حرارت بسیار کارآمد می‌کند."
  },
  4: {
    mohsHardness: 5.5,
    speedOfSound: 12890,
    thermalExpansion: 11.3,
    specificHeat: 1.825,
    factEn: "Beryllium is extremely rigid and lightweight, with a speed of sound over 12,000 m/s. It is used to make critical components for the James Webb Space Telescope.",
    factFa: "بریلیم بسیار سخت و سبک‌وزن است و سرعت صوت در آن به بیش از ۱۲,۰۰۰ متر بر ثانیه می‌رسد. از آن در آینه‌های تلسکوپ فضایی جیمز وب استفاده شده است."
  },
  5: {
    mohsHardness: 9.3,
    speedOfSound: 16200,
    thermalExpansion: 5,
    specificHeat: 1.026,
    factEn: "Boron filaments are used for high-strength, lightweight materials in aerospace. It is also an essential micronutrient for plants.",
    factFa: "رشته‌های بور در ساخت مواد با استحکام فوق‌العاده بالا و وزن سبک در صنایع هوافضا کاربرد دارند. همچنین یک ریزمغذی ضروری برای رشد گیاهان است."
  },
  6: {
    mohsHardness: 10.0,
    speedOfSound: 18300,
    thermalExpansion: 0.8,
    specificHeat: 0.709,
    factEn: "Carbon's diamond allotrope is the hardest natural material, while graphite is one of the softest. This extreme variance arises solely from crystal structural packing.",
    factFa: "آلوتروپ الماس کربن سخت‌ترین ماده طبیعی است، در حالی که گرافیت یکی از نرم‌ترین‌هاست. این تفاوت فاحش صرفاً ناشی از نوع آرایش ساختار بلوری آن‌هاست."
  },
  7: {
    mohsHardness: 0,
    speedOfSound: 334,
    thermalExpansion: 0,
    specificHeat: 1.04,
    factEn: "Nitrogen gas makes up 78% of Earth's atmosphere. Liquid nitrogen is widely used as a cryogen to preserve biological samples and cool high-tech detectors.",
    factFa: "گاز نیتروژن ۷۸٪ از اتمسفر زمین را تشکیل می‌دهد. نیتروژن مایع به عنوان یک سرماساز قوی برای نگهداری نمونه‌های زیستی و خنک‌کاری دتکتورها استفاده می‌شود."
  },
  8: {
    mohsHardness: 0,
    speedOfSound: 317,
    thermalExpansion: 0,
    specificHeat: 0.918,
    factEn: "Oxygen is highly reactive and paramagnetic in its liquid and solid states. It is the third most abundant element in the universe by mass.",
    factFa: "اکسیژن به شدت واکنش‌پذیر است و در حالت‌های مایع و جامد خواص پارامغناطیسی نشان می‌دهد. این عنصر سومین عنصر فراوان در جهان از نظر جرم است."
  },
  9: {
    mohsHardness: 0,
    speedOfSound: 310,
    thermalExpansion: 0,
    specificHeat: 0.824,
    factEn: "Fluorine is the most chemically reactive and electronegative of all elements. It reacts instantly with almost all other substances, even glass.",
    factFa: "فلوئور واکنش‌پذیرترین و الکترونگاتیوترین عنصر جدول است. این گاز فوراً با تقریباً تمام مواد دیگر، حتی شیشه و آب، واکنش می‌دهد."
  },
  10: {
    mohsHardness: 0,
    speedOfSound: 435,
    thermalExpansion: 0,
    specificHeat: 1.03,
    factEn: "Neon has the most intense light discharge at normal currents, glowing reddish-orange. It is completely inert and forms no known stable chemical compounds.",
    factFa: "نئون شدیدترین تخلیه نوری را در ولتاژهای معمولی دارد و نور قرمز-نارنجی درخشانی تولید می‌کند. این عنصر کاملاً بی‌اثر است و هیچ ترکیب پایداری تشکیل نمی‌دهد."
  },
  11: {
    mohsHardness: 0.5,
    speedOfSound: 3200,
    thermalExpansion: 70,
    specificHeat: 1.228,
    factEn: "Sodium is a soft metal that can be cut with a table knife. It reacts violently with water to produce hydrogen gas and sodium hydroxide.",
    factFa: "سدیم فلزی بسیار نرم است که با چاقوی معمولی بریده می‌شود. این عنصر به شدت با آب واکنش داده و گاز هیدروژن و گرای هیدروکسید تولید می‌کند."
  },
  12: {
    mohsHardness: 2.5,
    speedOfSound: 4940,
    thermalExpansion: 24.8,
    specificHeat: 1.023,
    factEn: "Magnesium is a key structural metal, being 33% lighter than aluminum. It burns with an extremely bright, dazzling white light used in flares and fireworks.",
    factFa: "منیزیم یک فلز ساختاری مهم و ۳۳٪ سبک‌تر از آلومینیوم است. این فلز با شعله‌ای بسیار درخشان و خیره‌کننده می‌سوزد که در فشفشه‌ها و نورافکن‌ها کاربرد دارد."
  },
  13: {
    mohsHardness: 2.75,
    speedOfSound: 5000,
    thermalExpansion: 23.1,
    specificHeat: 0.897,
    factEn: "Aluminum is the most abundant metal in the Earth's crust. It does not rust because it instantly forms a microscopic, protective oxide layer.",
    factFa: "آلومینیوم فراوان‌ترین فلز در پوسته زمین است. این فلز زنگ نمی‌زند زیرا بلافاصله یک لایه میکروسکوپی محافظ از اکسید آلومینیوم روی خود تشکیل می‌دهد."
  },
  14: {
    mohsHardness: 7.0,
    speedOfSound: 8430,
    thermalExpansion: 2.6,
    specificHeat: 0.705,
    factEn: "Silicon is the foundation of modern electronics and computing. In its ultra-pure crystalline form, it is used to fabricate semiconductor microchips.",
    factFa: "سیلیسیم ستون فقرات الکترونیک و رایانه‌های مدرن است. در حالت فوق‌خالص و تک‌بلوری، از این عنصر برای ساخت تراشه‌های نیمه‌رسانا استفاده می‌شود."
  },
  15: {
    mohsHardness: 2.5,
    speedOfSound: 2150,
    thermalExpansion: 12.4,
    specificHeat: 0.769,
    factEn: "Phosphorus was discovered in 1669 by an alchemist attempting to create the philosopher's stone from urine. It glows in the dark through chemiluminescence.",
    factFa: "فسفر در سال ۱۶۶۹ توسط کیمیاگری کشف شد که تلاش می‌کرد سنگ فلاسفه را از ادرار بسازد! این عنصر در تاریکی به دلیل پدیده شیمی‌لومینسانس می‌درخشد."
  },
  16: {
    mohsHardness: 2.0,
    speedOfSound: 1900,
    thermalExpansion: 74,
    specificHeat: 0.706,
    factEn: "Sulfur has been known since ancient times as brimstone. Its crystalline structure packs S8 rings that melt into a blood-red liquid at high heat.",
    factFa: "گوگرد از دوران باستان شناخته شده است. ساختار بلوری آن شامل حلقه‌های S8 است که در حرارت بالا ذوب شده و مایعی سرخ‌رنگ مانند خون ایجاد می‌کند."
  },
  17: {
    mohsHardness: 0,
    speedOfSound: 206,
    thermalExpansion: 0,
    specificHeat: 0.479,
    factEn: "Chlorine is a highly toxic, yellow-green gas. Despite its danger, it is essential for life as chloride ions, and is widely used to disinfect water supplies.",
    factFa: "کلر گازی به شدت سمی و زرد-سبز رنگ است. با وجود خطراتش، یون‌های کلرید برای حیات ضروری هستند و در ضدعفونی کردن منابع آب کاربرد وسیع دارند."
  },
  18: {
    mohsHardness: 0,
    speedOfSound: 323,
    thermalExpansion: 0,
    specificHeat: 0.52,
    factEn: "Argon is the third-most abundant gas in the Earth's atmosphere (0.93%). It provides an inert shielding atmosphere for laboratory high-temp synthesis and welding.",
    factFa: "آرگون سومین گاز فراوان در جو زمین است (۰.۹۳٪). این گاز محیطی کاملاً محافظ و بی‌اثر برای سنتزهای دمای بالا در آزمایشگاه‌ها و جوشکاری فراهم می‌کند."
  },
  19: {
    mohsHardness: 0.4,
    speedOfSound: 2000,
    thermalExpansion: 83,
    specificHeat: 0.757,
    factEn: "Potassium is so chemically reactive that it must be stored under mineral oil. Its radioactive isotope K-40 is a major natural source of radiation in bananas.",
    factFa: "پتاسیم به قدری واکنش‌پذیر است که باید زیر روغن معدنی نگهداری شود. ایزوتوپ رادیواکتیو پتاسیم-۴۰ منبع طبیعی تابش در موز است."
  },
  20: {
    mohsHardness: 1.75,
    speedOfSound: 3810,
    thermalExpansion: 22.3,
    specificHeat: 0.647,
    factEn: "Calcium is the fifth most abundant element in Earth's crust. It is a critical building block of bones, shells, and cement structures.",
    factFa: "کلسیم پنجمین عنصر فراوان در پوسته زمین است. این عنصر ماده سازنده اصلی استخوان‌ها، صدف‌ها و سازه‌های سیمانی است."
  },
  22: {
    mohsHardness: 6.0,
    speedOfSound: 5090,
    thermalExpansion: 8.6,
    specificHeat: 0.523,
    factEn: "Titanium has the highest strength-to-density ratio of any metallic element. It is highly corrosion-resistant and completely biocompatible with human bone.",
    factFa: "تیتانیم بالاترین نسبت استحکام به چگالی را در میان تمام فلزات دارد. این فلز به شدت در برابر خوردگی مقاوم بوده و با استخوان‌های بدن انسان سازگار است."
  },
  23: {
    mohsHardness: 7.0,
    speedOfSound: 4560,
    thermalExpansion: 8.4,
    specificHeat: 0.489,
    factEn: "Vanadium is added to steel to make it shock-resistant and tough. Vanadium oxide crystals can act as optical switches by transitioning from insulator to metal.",
    factFa: "وانادیم به فولاد اضافه می‌شود تا آن را در برابر ضربه مقاوم و سرسخت کند. بلورهای اکسید وانادیم می‌توانند به عنوان سوئیچ‌های نوری عمل کنند."
  },
  24: {
    mohsHardness: 8.5,
    speedOfSound: 5940,
    thermalExpansion: 4.9,
    specificHeat: 0.449,
    factEn: "Chromium is the element that gives rubies their red color and emeralds their green. It is the core additive that makes steel stainless (rust-resistant).",
    factFa: "کروم عنصری است که به یاقوت‌ها رنگ سرخ و به زمردها رنگ سبز می‌بخشد. همچنین ماده افزودنی اصلی است که فولاد را زنگ‌نزن می‌کند."
  },
  25: {
    mohsHardness: 6.0,
    speedOfSound: 5150,
    thermalExpansion: 21.7,
    specificHeat: 0.479,
    factEn: "Manganese is essential for iron and steel production. It was used by prehistoric cave painters in France as a black pigment 30,000 years ago.",
    factFa: "منگنز برای تولید آهن و فولاد ضروری است. این عنصر بیش از ۳۰,۰۰۰ سال پیش توسط نقاشان غارهای پیش‌از‌تاریخ در فرانسه به عنوان رنگ‌دانه سیاه استفاده می‌شد."
  },
  26: {
    mohsHardness: 4.0,
    speedOfSound: 5120,
    thermalExpansion: 11.8,
    specificHeat: 0.449,
    factEn: "Iron is the most common element on Earth by mass, forming much of Earth's outer and inner core. It is the primary element in steel alloys.",
    factFa: "از نظر جرمی، آهن رایج‌ترین عنصر روی زمین است و بخش عمده‌ای از هسته بیرونی و درونی زمین را تشکیل می‌دهد. این عنصر پایه آلیاژهای فولادی است."
  },
  27: {
    mohsHardness: 5.0,
    speedOfSound: 4720,
    thermalExpansion: 13.0,
    specificHeat: 0.421,
    factEn: "Cobalt is ferromagnetic like iron. It has been used for centuries to produce rich, beautiful blue pigments in porcelain and glassware.",
    factFa: "کبالت مانند آهن دارای خاصیت فرومغناطیس است. برای قرن‌ها از آن برای تولید رنگ‌دانه‌های آبی عمیق و زیبا در ظروف چینی و شیشه‌ای استفاده می‌شده است."
  },
  28: {
    mohsHardness: 4.0,
    speedOfSound: 4900,
    thermalExpansion: 13.4,
    specificHeat: 0.444,
    factEn: "Nickel is highly resistant to corrosion and is used to plate other metals. It is a major component in the superalloys used in jet engine turbines.",
    factFa: "نیکل مقاومت بسیار بالایی در برابر خوردگی دارد و برای آبکاری فلزات استفاده می‌شود. این فلز جزء اصلی سوپرآلیاژهای به کار رفته در توربین موتور جت است."
  },
  29: {
    mohsHardness: 3.0,
    speedOfSound: 3810,
    thermalExpansion: 16.5,
    specificHeat: 0.385,
    factEn: "Copper is an outstanding conductor of electricity and heat. It is naturally antibacterial; bacteria die on copper surfaces within a few hours.",
    factFa: "مس رسانای فوق‌العاده برق و حرارت است. این فلز خاصیت ضدباکتری طبیعی دارد؛ به طوری که میکروب‌ها روی سطوح مسی ظرف چند ساعت نابود می‌شوند."
  },
  30: {
    mohsHardness: 2.5,
    speedOfSound: 3850,
    thermalExpansion: 30.2,
    specificHeat: 0.388,
    factEn: "Zinc is used to galvanize iron and steel to prevent rusting. It is also an essential mineral for human immune system function.",
    factFa: "روی برای گالوانیزه کردن آهن و فولاد به منظور جلوگیری از زنگ‌زدگی استفاده می‌شود. این عنصر یک ماده معدنی حیاتی برای عملکرد سیستم ایمنی بدن است."
  },
  47: {
    mohsHardness: 2.5,
    speedOfSound: 2680,
    thermalExpansion: 18.9,
    specificHeat: 0.235,
    factEn: "Silver has the highest electrical conductivity, thermal conductivity, and reflectivity of any metal known to science.",
    factFa: "نقره دارای بالاترین میزان رسانایی الکتریکی، رسانایی حرارتی و بازتاب نوری در میان تمامی فلزات شناخته‌شده در علم است."
  },
  74: {
    mohsHardness: 7.5,
    speedOfSound: 5220,
    thermalExpansion: 4.5,
    specificHeat: 0.132,
    factEn: "Tungsten has the highest melting point of all discovered metals (3422°C). It is exceptionally strong and is used for rocket nozzles and heating elements.",
    factFa: "تنگستن بالاترین دمای ذوب را در میان تمام فلزات کشف‌شده دارد (۳۴۲۲ درجه سانتی‌گراد). این فلز فوق‌العاده مستحکم است و در نازل موشک‌ها کاربرد دارد."
  },
  78: {
    mohsHardness: 3.5,
    speedOfSound: 2800,
    thermalExpansion: 8.8,
    specificHeat: 0.133,
    factEn: "Platinum is highly unreactive and extremely rare. It is an extraordinary catalyst, heavily used in catalytic converters to clean automotive exhaust gases.",
    factFa: "پلاتین فلزی بسیار کم‌واکنش و فوق‌العاده کمیاب است. این فلز یک کاتالیزور فوق‌العاده است که در مبدل‌های کاتالیزوری خودروها کاربرد زیادی دارد."
  },
  79: {
    mohsHardness: 2.5,
    speedOfSound: 2030,
    thermalExpansion: 14.2,
    specificHeat: 0.129,
    factEn: "Gold is virtually indestructible. It does not oxidize, tarnish, or corrode. Gold nanoparticles are used today in cancer therapies and diagnostics.",
    factFa: "طلا تقریباً تخریب‌ناپذیر است. این فلز اکسید، کدر یا خورده نمی‌شود. امروزه از نانوذرات طلا در درمان‌های پیشرفته سرطان و کیت‌های تشخیصی استفاده می‌شود."
  },
  80: {
    mohsHardness: 0,
    speedOfSound: 1450,
    thermalExpansion: 60,
    specificHeat: 0.14,
    factEn: "Mercury is the only metal that is liquid at standard temperature and pressure. It has extremely high surface tension and forms beautiful reflective spheres.",
    factFa: "جیوه تنها فلزی است که در دما و فشار استاندارد مایع است. این فلز کشش سطحی فوق‌العاده بالایی دارد و قطرات بازتابنده و زیبای کروی تشکیل می‌دهد."
  },
  82: {
    mohsHardness: 1.5,
    speedOfSound: 1190,
    thermalExpansion: 28.9,
    specificHeat: 0.129,
    factEn: "Lead is a heavy, dense metal that has been used since antiquity. It is highly effective at absorbing X-rays and gamma radiation, making it vital for nuclear shielding.",
    factFa: "سرب فلزی سنگین و چگال است که از باستان کاربرد داشته است. این فلز در جذب پرتوهای ایکس و گاما بسیار موثر بوده و برای سپر تشعشعی هسته‌ای حیاتی است."
  },
  92: {
    mohsHardness: 6.0,
    speedOfSound: 3130,
    thermalExpansion: 13.9,
    specificHeat: 0.116,
    factEn: "Uranium was used as a coloring agent in glass (producing uranium glass that glows bright green under UV light) long before its nuclear properties were discovered.",
    factFa: "اورانیوم مدت‌ها پیش از کشف خواص هسته‌ای، به عنوان رنگ‌دهنده در شیشه‌گری استفاده می‌شد (تولید شیشه‌های اورانیومی که زیر نور فرابنفش به رنگ سبز درخشان می‌درخشند)."
  }
};

// Returns standard properties or derives approximation if not listed
export function getFactualProperties(number: number): ScientificProperties {
  const baseProps = chemicalPhysicalDb[number];
  const config = getElectronConfig(number);
  const extra = scientificFactsAndPhysicalExtras[number];
  
  // Calculate dynamic approximations for extras if not listed in our detailed facts map
  const getApproximatedExtras = (num: number) => {
    const isNoble = [2, 10, 18, 36, 54, 86, 118].includes(num);
    const isHalogen = [9, 17, 35, 53, 85, 117].includes(num);
    const isAlkaliOrEarth = [3, 4, 11, 12, 19, 20, 37, 38, 55, 56, 87, 88].includes(num);
    const isLanthanideOrActinide = (num >= 57 && num <= 71) || (num >= 89 && num <= 103);
    
    let mohs = 3.0;
    let sound = 3000;
    let expansion = 15.0;
    let specHeat = 0.3;
    let block = 'd';
    let fEn = "";
    let fFa = "";
    
    if (isNoble) {
      mohs = 0;
      sound = 300;
      expansion = 0;
      specHeat = 0.5;
      block = 'p';
      fEn = "This is an extremely stable, noble gas element with a completely filled valence shell. It stays inert in almost all laboratory environments.";
      fFa = "این یک گاز نجیب و فوق‌العاده پایدار با لایه ظرفیت کاملاً پر است که در تقریباً تمامی محیط‌های آزمایشگاهی بی‌اثر باقی می‌ماند.";
    } else if (isHalogen) {
      mohs = 0.5;
      sound = 250;
      expansion = 40.0;
      specHeat = 0.4;
      block = 'p';
      fEn = "This is a highly reactive halogen. It is extremely electronegative, forming strong salts with active alkali metals instantly.";
      fFa = "این یک هالوژن به شدت واکنش‌پذیر است. این عنصر فوق‌العاده الکترونگاتیو است و به سرعت با فلزات قلیایی نمک‌های پایدار تشکیل می‌دهد.";
    } else if (isAlkaliOrEarth) {
      mohs = num % 2 === 0 ? 1.5 : 0.5;
      sound = 2500;
      expansion = 35.0;
      specHeat = 0.8;
      block = 's';
      fEn = "This s-block metal is highly reactive, with low density and low ionization energy. It easily sheds electrons to form stable cations.";
      fFa = "این فلز بلوک s به شدت واکنش‌پذیر بوده و دارای چگالی کم و انرژی یونش پایینی است. این عنصر به راحتی الکترون از دست می‌دهد تا کاتیون تشکیل دهد.";
    } else if (isLanthanideOrActinide) {
      mohs = 5.0;
      sound = 4000;
      expansion = 10.0;
      specHeat = 0.15;
      block = 'f';
      fEn = "An inner-transition heavy f-block element with complex f-orbital properties, crucial for high-performance magnets and optics.";
      fFa = "یک عنصر سنگین واسطه داخلی از بلوک f با خواص اوربیتال پیچیده f، که برای ساخت آهنرباهای پیشرفته و لیزرها حیاتی است.";
    } else if (num < 84) {
      mohs = 4.5;
      sound = 4500;
      expansion = 12.0;
      specHeat = 0.45;
      block = 'd';
      fEn = "A versatile d-block transition metal. It has partially-filled d shells, allowing beautiful variable oxidation states and catalytic properties.";
      fFa = "یک فلز واسطه تطبیق‌پذیر از بلوک d. این عنصر دارای لایه d نیمه‌پر است که به آن اجازه می‌دهد حالت‌های اکسایش رنگارنگ و خواص کاتالیزوری عالی داشته باشد.";
    } else {
      mohs = 2.0;
      sound = 1500;
      expansion = 25.0;
      specHeat = 0.12;
      block = 'p';
      fEn = "A heavy post-transition element near the semi-metal boundary, playing key roles in high-density engineering and materials research.";
      fFa = "یک عنصر سنگین پس‌واسطه در نزدیکی مرز شبه‌فلزات، که نقش کلیدی در مهندسی مواد چگال و پژوهش‌های نوین دارد.";
    }
    
    return {
      mohsHardness: mohs,
      speedOfSound: sound,
      thermalExpansion: expansion,
      specificHeat: specHeat,
      factEn: fEn,
      factFa: fFa
    };
  };

  const extraProps = extra || getApproximatedExtras(number);
  
  if (baseProps) {
    return {
      ...baseProps,
      electronConfig: baseProps.electronConfig || config,
      ...extraProps
    };
  }
  
  // Logical scientific periodic approximation for unlisted elements
  const isMetal = number < 84 && ![1, 2, 6, 7, 8, 9, 10, 15, 16, 17, 18, 34, 35, 36, 53, 54].includes(number);
  const valence = (number % 8) || 8;
  
  return {
    valenceElectrons: valence,
    electronegativity: Number((2.5 - (number * 0.01)).toFixed(2)),
    ionizationEnergy: Number((7.0 + (valence * 0.5)).toFixed(3)),
    electronAffinity: valence === 7 ? 3.0 : 0.5,
    metallicCharacter: isMetal ? 'High' : 'Non-metallic',
    nonMetallicCharacter: isMetal ? 'None' : 'High',
    atomicRadius: 150 + number,
    ionicRadius: `~100 (+${valence})`,
    boilingPoint: isMetal ? 1500 + number * 10 : -100,
    electricalConductivity: isMetal ? 5.0 : 0,
    thermalConductivity: isMetal ? 50 : 0.5,
    electronConfig: config,
    ...extraProps
  };
}
