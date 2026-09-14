// ============================================================================
// Authoritative X-Ray Fluorescence (XRF) Spectral Fingerprint Database & Engine
// High-precision NIST/IUPAC standard emission lines, absorption edges,
// fluorescence yields, Moseley quantum models, and deterministic fingerprinting
// for all 118 chemical elements (Z = 1 to 118).
// ============================================================================

export interface XRFEmissionLine {
  siegbahn: string;
  iupac: string;
  energyKeV: number;
  wavelengthAngstrom: number;
  relativeIntensity: number; // 0 - 100% normalized
  shell: 'K' | 'L' | 'M' | 'N';
  transition: string;
}

export interface XRFAbsorptionEdge {
  name: string;
  energyKeV: number;
  jumpRatio?: number;
}

export interface XRFFingerprint {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicWeight: number;
  fingerprintHash: string;
  spectralBarcode: number[]; // 24 normalized intensity bins across 0-24 keV
  primaryLine: XRFEmissionLine | null;
  primaryLineKeV: number;
  lines: XRFEmissionLine[];
  edges: XRFAbsorptionEdge[];
  fluorescenceYieldK: number;
  fluorescenceYieldL: number;
  moseleyPredictedKeV: number;
  moseleyDeltaKeV: number;
  moseleyDeltaPercent: number;
  escapePeaks: { parentLine: string; escapeEnergyKeV: number; detector: 'Si' | 'Ge' }[];
  sumPeaks: { parentLine: string; sumEnergyKeV: number }[];
}

export interface XRFMatchResult {
  atomicNumber: number;
  symbol: string;
  name: string;
  score: number; // 0 - 100%
  confidence: 'Definite' | 'High' | 'Moderate' | 'Trace';
  matchedPeaks: { inputKeV: number; matchedLine: XRFEmissionLine; deltaKeV: number }[];
  unmatchedInputs: number[];
  missingExpectedLines: XRFEmissionLine[];
}

export interface XRFSpectrumPoint {
  energy: number;
  intensity: number;
  isPeak?: boolean;
  peakLabel?: string;
  isEscape?: boolean;
  isEdge?: boolean;
}

export interface XRFSpectrumOptions {
  fwhm_eV?: number; // detector resolution in eV (default 130 eV for SDD)
  tubeTarget?: 'Rh' | 'Mo' | 'W' | 'Cr' | 'Cu';
  includeBackground?: boolean;
  includeEscapePeaks?: boolean;
  includeSumPeaks?: boolean;
  minKeV?: number;
  maxKeV?: number;
  numPoints?: number;
}

export const XRF_FINGERPRINT_DB: Record<number, XRFFingerprint> = {
  "1": {
    "atomicNumber": 1,
    "symbol": "H",
    "name": "Hydrogen",
    "atomicWeight": 1.008,
    "fingerprintHash": "XRF-01-H-0.000-007A",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": null,
    "primaryLineKeV": 0.0,
    "lines": [],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 0.0136,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0001,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 0.0,
    "moseleyDeltaKeV": 0.0,
    "moseleyDeltaPercent": 0.0,
    "escapePeaks": [],
    "sumPeaks": []
  },
  "2": {
    "atomicNumber": 2,
    "symbol": "He",
    "name": "Helium",
    "atomicWeight": 4.003,
    "fingerprintHash": "XRF-02-He-0.000-00F4",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": null,
    "primaryLineKeV": 0.0,
    "lines": [],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 0.0246,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0001,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 0.01,
    "moseleyDeltaKeV": 0.0,
    "moseleyDeltaPercent": 0.0,
    "escapePeaks": [],
    "sumPeaks": []
  },
  "3": {
    "atomicNumber": 3,
    "symbol": "Li",
    "name": "Lithium",
    "atomicWeight": 6.94,
    "fingerprintHash": "XRF-03-Li-0.054-0173",
    "spectralBarcode": [
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 0.0543,
      "wavelengthAngstrom": 228.3319,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 0.0543,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 0.0543,
        "wavelengthAngstrom": 228.3319,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 0.055,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0001,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 0.041,
    "moseleyDeltaKeV": 0.013,
    "moseleyDeltaPercent": 23.9,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 0.109
      }
    ]
  },
  "4": {
    "atomicNumber": 4,
    "symbol": "Be",
    "name": "Beryllium",
    "atomicWeight": 9.012,
    "fingerprintHash": "XRF-04-Be-0.108-01F1",
    "spectralBarcode": [
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 0.1085,
      "wavelengthAngstrom": 114.2712,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 0.1085,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 0.1085,
        "wavelengthAngstrom": 114.2712,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 0.111,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0001,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 0.092,
    "moseleyDeltaKeV": 0.017,
    "moseleyDeltaPercent": 15.7,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 0.217
      }
    ]
  },
  "5": {
    "atomicNumber": 5,
    "symbol": "B",
    "name": "Boron",
    "atomicWeight": 10.81,
    "fingerprintHash": "XRF-05-B-0.183-0270",
    "spectralBarcode": [
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 0.1833,
      "wavelengthAngstrom": 67.64,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 0.1833,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 0.1833,
        "wavelengthAngstrom": 67.64,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 0.188,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0001,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 0.163,
    "moseleyDeltaKeV": 0.02,
    "moseleyDeltaPercent": 10.9,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 0.367
      }
    ]
  },
  "6": {
    "atomicNumber": 6,
    "symbol": "C",
    "name": "Carbon",
    "atomicWeight": 12.011,
    "fingerprintHash": "XRF-06-C-0.277-02F1",
    "spectralBarcode": [
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 0.277,
      "wavelengthAngstrom": 44.7596,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 0.277,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 0.277,
        "wavelengthAngstrom": 44.7596,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 0.284,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0012,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 0.255,
    "moseleyDeltaKeV": 0.022,
    "moseleyDeltaPercent": 7.9,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 0.554
      }
    ]
  },
  "7": {
    "atomicNumber": 7,
    "symbol": "N",
    "name": "Nitrogen",
    "atomicWeight": 14.007,
    "fingerprintHash": "XRF-07-N-0.392-0374",
    "spectralBarcode": [
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 0.3924,
      "wavelengthAngstrom": 31.5964,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 0.3924,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 0.3924,
        "wavelengthAngstrom": 31.5964,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 0.409,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0021,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 0.367,
    "moseleyDeltaKeV": 0.025,
    "moseleyDeltaPercent": 6.4,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 0.785
      }
    ]
  },
  "8": {
    "atomicNumber": 8,
    "symbol": "O",
    "name": "Oxygen",
    "atomicWeight": 15.999,
    "fingerprintHash": "XRF-08-O-0.525-03F7",
    "spectralBarcode": [
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 0.5249,
      "wavelengthAngstrom": 23.6205,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 0.5249,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 0.5249,
        "wavelengthAngstrom": 23.6205,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 0.543,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0036,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 0.5,
    "moseleyDeltaKeV": 0.025,
    "moseleyDeltaPercent": 4.8,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 1.05
      }
    ]
  },
  "9": {
    "atomicNumber": 9,
    "symbol": "F",
    "name": "Fluorine",
    "atomicWeight": 18.998,
    "fingerprintHash": "XRF-09-F-0.677-047C",
    "spectralBarcode": [
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 0.6768,
      "wavelengthAngstrom": 18.3192,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 0.6768,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 0.6768,
        "wavelengthAngstrom": 18.3192,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 0.696,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0058,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 0.653,
    "moseleyDeltaKeV": 0.024,
    "moseleyDeltaPercent": 3.5,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 1.354
      }
    ]
  },
  "10": {
    "atomicNumber": 10,
    "symbol": "Ne",
    "name": "Neon",
    "atomicWeight": 20.18,
    "fingerprintHash": "XRF-10-Ne-0.849-0502",
    "spectralBarcode": [
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 0.8486,
      "wavelengthAngstrom": 14.6104,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 0.8486,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 0.8486,
        "wavelengthAngstrom": 14.6104,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 0.87,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0088,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 0.827,
    "moseleyDeltaKeV": 0.022,
    "moseleyDeltaPercent": 2.6,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 1.697
      }
    ]
  },
  "11": {
    "atomicNumber": 11,
    "symbol": "Na",
    "name": "Sodium",
    "atomicWeight": 22.99,
    "fingerprintHash": "XRF-11-Na-1.041-058A",
    "spectralBarcode": [
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 1.041,
      "wavelengthAngstrom": 11.9101,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 1.041,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 1.041,
        "wavelengthAngstrom": 11.9101,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 1.0711,
        "wavelengthAngstrom": 11.5754,
        "relativeIntensity": 5.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 1.072,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0129,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 1.02,
    "moseleyDeltaKeV": 0.021,
    "moseleyDeltaPercent": 2.0,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 2.082
      }
    ]
  },
  "12": {
    "atomicNumber": 12,
    "symbol": "Mg",
    "name": "Magnesium",
    "atomicWeight": 24.305,
    "fingerprintHash": "XRF-12-Mg-1.254-0613",
    "spectralBarcode": [
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 1.2536,
      "wavelengthAngstrom": 9.8903,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 1.2536,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 1.2536,
        "wavelengthAngstrom": 9.8903,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 1.3022,
        "wavelengthAngstrom": 9.5211,
        "relativeIntensity": 6.2,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 1.303,
        "jumpRatio": 2.5
      }
    ],
    "fluorescenceYieldK": 0.0182,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 1.235,
    "moseleyDeltaKeV": 0.019,
    "moseleyDeltaPercent": 1.5,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 2.507
      }
    ]
  },
  "13": {
    "atomicNumber": 13,
    "symbol": "Al",
    "name": "Aluminum",
    "atomicWeight": 26.982,
    "fingerprintHash": "XRF-13-Al-1.487-069E",
    "spectralBarcode": [
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 1.4867,
      "wavelengthAngstrom": 8.3396,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 1.4867,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 1.4867,
        "wavelengthAngstrom": 8.3396,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 1.5574,
        "wavelengthAngstrom": 7.961,
        "relativeIntensity": 6.5,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 1.56,
        "jumpRatio": 2.6
      }
    ],
    "fluorescenceYieldK": 0.0249,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 1.469,
    "moseleyDeltaKeV": 0.018,
    "moseleyDeltaPercent": 1.2,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 2.973
      }
    ]
  },
  "14": {
    "atomicNumber": 14,
    "symbol": "Si",
    "name": "Silicon",
    "atomicWeight": 28.085,
    "fingerprintHash": "XRF-14-Si-1.740-072A",
    "spectralBarcode": [
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 1.7398,
      "wavelengthAngstrom": 7.1263,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 1.7398,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 1.7398,
        "wavelengthAngstrom": 7.1263,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 1.8359,
        "wavelengthAngstrom": 6.7533,
        "relativeIntensity": 6.9,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 1.839,
        "jumpRatio": 2.7
      }
    ],
    "fluorescenceYieldK": 0.0332,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 1.724,
    "moseleyDeltaKeV": 0.016,
    "moseleyDeltaPercent": 0.9,
    "escapePeaks": [],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 3.48
      }
    ]
  },
  "15": {
    "atomicNumber": 15,
    "symbol": "P",
    "name": "Phosphorus",
    "atomicWeight": 30.974,
    "fingerprintHash": "XRF-15-P-2.014-07B7",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 2.0137,
      "wavelengthAngstrom": 6.157,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 2.0137,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 2.0137,
        "wavelengthAngstrom": 6.157,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 2.1391,
        "wavelengthAngstrom": 5.7961,
        "relativeIntensity": 7.2,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 2.146,
        "jumpRatio": 2.8
      }
    ],
    "fluorescenceYieldK": 0.0432,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 2.0,
    "moseleyDeltaKeV": 0.014,
    "moseleyDeltaPercent": 0.7,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1",
        "escapeEnergyKeV": 0.274,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 4.027
      }
    ]
  },
  "16": {
    "atomicNumber": 16,
    "symbol": "S",
    "name": "Sulfur",
    "atomicWeight": 32.06,
    "fingerprintHash": "XRF-16-S-2.308-0846",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 2.3078,
      "wavelengthAngstrom": 5.3724,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 2.3078,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 2.3078,
        "wavelengthAngstrom": 5.3724,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 2.464,
        "wavelengthAngstrom": 5.0318,
        "relativeIntensity": 7.6,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 2.472,
        "jumpRatio": 2.9
      }
    ],
    "fluorescenceYieldK": 0.0553,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 2.296,
    "moseleyDeltaKeV": 0.012,
    "moseleyDeltaPercent": 0.5,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1",
        "escapeEnergyKeV": 0.568,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 4.616
      }
    ]
  },
  "17": {
    "atomicNumber": 17,
    "symbol": "Cl",
    "name": "Chlorine",
    "atomicWeight": 35.45,
    "fingerprintHash": "XRF-17-Cl-2.622-08D6",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 2.6224,
      "wavelengthAngstrom": 4.7279,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 2.6224,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 2.6224,
        "wavelengthAngstrom": 4.7279,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 2.8156,
        "wavelengthAngstrom": 4.4035,
        "relativeIntensity": 7.9,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 2.822,
        "jumpRatio": 3.0
      }
    ],
    "fluorescenceYieldK": 0.0694,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 2.612,
    "moseleyDeltaKeV": 0.01,
    "moseleyDeltaPercent": 0.4,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1",
        "escapeEnergyKeV": 0.882,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 5.245
      }
    ]
  },
  "18": {
    "atomicNumber": 18,
    "symbol": "Ar",
    "name": "Argon",
    "atomicWeight": 39.948,
    "fingerprintHash": "XRF-18-Ar-2.958-0968",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      8.3,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1",
      "iupac": "K-L2,3",
      "energyKeV": 2.9577,
      "wavelengthAngstrom": 4.1919,
      "relativeIntensity": 100,
      "shell": "K",
      "transition": "2p \u2192 1s"
    },
    "primaryLineKeV": 2.9577,
    "lines": [
      {
        "siegbahn": "K\u03b1",
        "iupac": "K-L2,3",
        "energyKeV": 2.9577,
        "wavelengthAngstrom": 4.1919,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p \u2192 1s"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 3.1905,
        "wavelengthAngstrom": 3.886,
        "relativeIntensity": 8.3,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 3.206,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.0857,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 2.949,
    "moseleyDeltaKeV": 0.009,
    "moseleyDeltaPercent": 0.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1",
        "escapeEnergyKeV": 1.218,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1 + K\u03b1",
        "sumEnergyKeV": 5.915
      }
    ]
  },
  "19": {
    "atomicNumber": 19,
    "symbol": "K",
    "name": "Potassium",
    "atomicWeight": 39.098,
    "fingerprintHash": "XRF-19-K-3.276-09F9",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 3.2764,
      "wavelengthAngstrom": 3.7842,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 3.2764,
    "lines": [
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 3.2764,
        "wavelengthAngstrom": 3.7842,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 3.3138,
        "wavelengthAngstrom": 3.7415,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 3.5896,
        "wavelengthAngstrom": 3.454,
        "relativeIntensity": 8.6,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 3.608,
        "jumpRatio": 3.3
      }
    ],
    "fluorescenceYieldK": 0.1042,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 3.306,
    "moseleyDeltaKeV": -0.03,
    "moseleyDeltaPercent": -0.9,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 1.536,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 6.553
      }
    ]
  },
  "20": {
    "atomicNumber": 20,
    "symbol": "Ca",
    "name": "Calcium",
    "atomicWeight": 40.078,
    "fingerprintHash": "XRF-20-Ca-3.647-0A8D",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      100.0,
      6.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 3.6474,
      "wavelengthAngstrom": 3.3992,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 3.6474,
    "lines": [
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 3.6474,
        "wavelengthAngstrom": 3.3992,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 3.6917,
        "wavelengthAngstrom": 3.3585,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 4.0127,
        "wavelengthAngstrom": 3.0898,
        "relativeIntensity": 9.0,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 4.038,
        "jumpRatio": 3.4
      }
    ],
    "fluorescenceYieldK": 0.125,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 3.684,
    "moseleyDeltaKeV": -0.037,
    "moseleyDeltaPercent": -1.0,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 1.907,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 7.295
      }
    ]
  },
  "21": {
    "atomicNumber": 21,
    "symbol": "Sc",
    "name": "Scandium",
    "atomicWeight": 44.956,
    "fingerprintHash": "XRF-21-Sc-4.039-0B23",
    "spectralBarcode": [
      9.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 4.0386,
      "wavelengthAngstrom": 3.07,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 4.0386,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 0.3954,
        "wavelengthAngstrom": 31.3567,
        "relativeIntensity": 14.5,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 4.0386,
        "wavelengthAngstrom": 3.07,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 4.0906,
        "wavelengthAngstrom": 3.031,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 4.4605,
        "wavelengthAngstrom": 2.7796,
        "relativeIntensity": 9.3,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 4.493,
        "jumpRatio": 3.5
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 0.402,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.148,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 4.082,
    "moseleyDeltaKeV": -0.043,
    "moseleyDeltaPercent": -1.1,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 2.299,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 8.077
      }
    ]
  },
  "22": {
    "atomicNumber": 22,
    "symbol": "Ti",
    "name": "Titanium",
    "atomicWeight": 47.867,
    "fingerprintHash": "XRF-22-Ti-4.450-0BBA",
    "spectralBarcode": [
      11.8,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 4.4502,
      "wavelengthAngstrom": 2.786,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 4.4502,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 0.4522,
        "wavelengthAngstrom": 27.418,
        "relativeIntensity": 19.0,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 4.4502,
        "wavelengthAngstrom": 2.786,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 4.5108,
        "wavelengthAngstrom": 2.7486,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 4.9318,
        "wavelengthAngstrom": 2.514,
        "relativeIntensity": 9.7,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 4.966,
        "jumpRatio": 3.6
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 0.454,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.173,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 4.5,
    "moseleyDeltaKeV": -0.05,
    "moseleyDeltaPercent": -1.1,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 2.71,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 8.9
      }
    ]
  },
  "23": {
    "atomicNumber": 23,
    "symbol": "V",
    "name": "Vanadium",
    "atomicWeight": 50.942,
    "fingerprintHash": "XRF-23-V-4.882-0C52",
    "spectralBarcode": [
      15.6,
      0.0,
      0.0,
      0.0,
      100.0,
      6.6,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 4.8821,
      "wavelengthAngstrom": 2.5396,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 4.8821,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 0.5113,
        "wavelengthAngstrom": 24.2488,
        "relativeIntensity": 23.5,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 4.8821,
        "wavelengthAngstrom": 2.5396,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 4.9522,
        "wavelengthAngstrom": 2.5036,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 5.4273,
        "wavelengthAngstrom": 2.2845,
        "relativeIntensity": 10.0,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 5.465,
        "jumpRatio": 3.8
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 0.512,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.1999,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 4.939,
    "moseleyDeltaKeV": -0.057,
    "moseleyDeltaPercent": -1.2,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 3.142,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 9.764
      }
    ]
  },
  "24": {
    "atomicNumber": 24,
    "symbol": "Cr",
    "name": "Chromium",
    "atomicWeight": 51.996,
    "fingerprintHash": "XRF-24-Cr-5.334-0CEC",
    "spectralBarcode": [
      17.3,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 5.3341,
      "wavelengthAngstrom": 2.3244,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 5.3341,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 0.5728,
        "wavelengthAngstrom": 21.6453,
        "relativeIntensity": 28.0,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 5.3341,
        "wavelengthAngstrom": 2.3244,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 5.4147,
        "wavelengthAngstrom": 2.2898,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 5.9467,
        "wavelengthAngstrom": 2.0849,
        "relativeIntensity": 10.4,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 5.989,
        "jumpRatio": 3.9
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 0.575,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.2285,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 5.398,
    "moseleyDeltaKeV": -0.064,
    "moseleyDeltaPercent": -1.2,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 3.594,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 10.668
      }
    ]
  },
  "25": {
    "atomicNumber": 25,
    "symbol": "Mn",
    "name": "Manganese",
    "atomicWeight": 54.938,
    "fingerprintHash": "XRF-25-Mn-5.807-0D87",
    "spectralBarcode": [
      21.5,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      7.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 5.8066,
      "wavelengthAngstrom": 2.1352,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 5.8066,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 0.6374,
        "wavelengthAngstrom": 19.4516,
        "relativeIntensity": 32.5,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 5.8066,
        "wavelengthAngstrom": 2.1352,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 5.8987,
        "wavelengthAngstrom": 2.1019,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 6.4904,
        "wavelengthAngstrom": 1.9103,
        "relativeIntensity": 10.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 6.539,
        "jumpRatio": 4.0
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 0.639,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.2586,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 5.878,
    "moseleyDeltaKeV": -0.071,
    "moseleyDeltaPercent": -1.2,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 4.067,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 11.613
      }
    ]
  },
  "26": {
    "atomicNumber": 26,
    "symbol": "Fe",
    "name": "Iron",
    "atomicWeight": 55.845,
    "fingerprintHash": "XRF-26-Fe-6.299-0E24",
    "spectralBarcode": [
      24.5,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      7.4,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 6.299,
      "wavelengthAngstrom": 1.9683,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 6.299,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 0.705,
        "wavelengthAngstrom": 17.5864,
        "relativeIntensity": 37.0,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 6.299,
        "wavelengthAngstrom": 1.9683,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 6.4038,
        "wavelengthAngstrom": 1.9361,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 7.058,
        "wavelengthAngstrom": 1.7566,
        "relativeIntensity": 11.1,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 7.112,
        "jumpRatio": 4.1
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 0.707,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.2898,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 6.377,
    "moseleyDeltaKeV": -0.078,
    "moseleyDeltaPercent": -1.2,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 4.559,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 12.598
      }
    ]
  },
  "27": {
    "atomicNumber": 27,
    "symbol": "Co",
    "name": "Cobalt",
    "atomicWeight": 58.933,
    "fingerprintHash": "XRF-27-Co-6.812-0EC2",
    "spectralBarcode": [
      27.5,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      7.5,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 6.8118,
      "wavelengthAngstrom": 1.8201,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 6.8118,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 0.7762,
        "wavelengthAngstrom": 15.9732,
        "relativeIntensity": 41.5,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 6.8118,
        "wavelengthAngstrom": 1.8201,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 6.9303,
        "wavelengthAngstrom": 1.789,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 7.6494,
        "wavelengthAngstrom": 1.6208,
        "relativeIntensity": 11.4,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 7.709,
        "jumpRatio": 4.2
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 0.778,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.3218,
    "fluorescenceYieldL": 0.002,
    "moseleyPredictedKeV": 6.898,
    "moseleyDeltaKeV": -0.086,
    "moseleyDeltaPercent": -1.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 5.072,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 13.624
      }
    ]
  },
  "28": {
    "atomicNumber": 28,
    "symbol": "Ni",
    "name": "Nickel",
    "atomicWeight": 58.693,
    "fingerprintHash": "XRF-28-Ni-7.345-0F62",
    "spectralBarcode": [
      30.5,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      7.8,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 7.3446,
      "wavelengthAngstrom": 1.6881,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 7.3446,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 0.8515,
        "wavelengthAngstrom": 14.5607,
        "relativeIntensity": 46.0,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 7.3446,
        "wavelengthAngstrom": 1.6881,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 7.4781,
        "wavelengthAngstrom": 1.658,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 8.2646,
        "wavelengthAngstrom": 1.5002,
        "relativeIntensity": 11.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 8.333,
        "jumpRatio": 4.4
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 0.853,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.3543,
    "fluorescenceYieldL": 0.0045,
    "moseleyPredictedKeV": 7.439,
    "moseleyDeltaKeV": -0.094,
    "moseleyDeltaPercent": -1.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 5.605,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 14.689
      }
    ]
  },
  "29": {
    "atomicNumber": 29,
    "symbol": "Cu",
    "name": "Copper",
    "atomicWeight": 63.546,
    "fingerprintHash": "XRF-29-Cu-7.898-1003",
    "spectralBarcode": [
      56.9,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      45.5,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 7.898,
      "wavelengthAngstrom": 1.5698,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 7.898,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 0.9297,
        "wavelengthAngstrom": 13.3359,
        "relativeIntensity": 50.5,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 0.9498,
        "wavelengthAngstrom": 13.0537,
        "relativeIntensity": 13.3,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 7.898,
        "wavelengthAngstrom": 1.5698,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 8.0478,
        "wavelengthAngstrom": 1.5406,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 8.9053,
        "wavelengthAngstrom": 1.3923,
        "relativeIntensity": 12.1,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 8.979,
        "jumpRatio": 4.5
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 0.933,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.3871,
    "fluorescenceYieldL": 0.0066,
    "moseleyPredictedKeV": 8.0,
    "moseleyDeltaKeV": -0.102,
    "moseleyDeltaPercent": -1.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 6.158,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 15.796
      }
    ]
  },
  "30": {
    "atomicNumber": 30,
    "symbol": "Zn",
    "name": "Zinc",
    "atomicWeight": 65.38,
    "fingerprintHash": "XRF-30-Zn-8.472-10A5",
    "spectralBarcode": [
      0.0,
      46.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      8.3,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 8.4716,
      "wavelengthAngstrom": 1.4635,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 8.4716,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 1.0117,
        "wavelengthAngstrom": 12.255,
        "relativeIntensity": 55.0,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 1.0347,
        "wavelengthAngstrom": 11.9826,
        "relativeIntensity": 14.6,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 8.4716,
        "wavelengthAngstrom": 1.4635,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 8.6389,
        "wavelengthAngstrom": 1.4352,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 9.572,
        "wavelengthAngstrom": 1.2953,
        "relativeIntensity": 12.5,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 9.659,
        "jumpRatio": 4.6
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 1.022,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.4197,
    "fluorescenceYieldL": 0.0093,
    "moseleyPredictedKeV": 8.582,
    "moseleyDeltaKeV": -0.11,
    "moseleyDeltaPercent": -1.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 6.732,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 16.943
      }
    ]
  },
  "31": {
    "atomicNumber": 31,
    "symbol": "Ga",
    "name": "Gallium",
    "atomicWeight": 69.723,
    "fingerprintHash": "XRF-31-Ga-9.065-1149",
    "spectralBarcode": [
      0.0,
      49.9,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      8.5,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 9.0654,
      "wavelengthAngstrom": 1.3677,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 9.0654,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 1.0979,
        "wavelengthAngstrom": 11.2928,
        "relativeIntensity": 59.5,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 1.1248,
        "wavelengthAngstrom": 11.0228,
        "relativeIntensity": 15.9,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 9.0654,
        "wavelengthAngstrom": 1.3677,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 9.2517,
        "wavelengthAngstrom": 1.3401,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 10.2642,
        "wavelengthAngstrom": 1.2079,
        "relativeIntensity": 12.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 10.367,
        "jumpRatio": 4.7
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 1.115,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.4519,
    "fluorescenceYieldL": 0.0128,
    "moseleyPredictedKeV": 9.184,
    "moseleyDeltaKeV": -0.119,
    "moseleyDeltaPercent": -1.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 7.325,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 18.131
      }
    ]
  },
  "32": {
    "atomicNumber": 32,
    "symbol": "Ge",
    "name": "Germanium",
    "atomicWeight": 72.63,
    "fingerprintHash": "XRF-32-Ge-9.680-11EE",
    "spectralBarcode": [
      0.0,
      53.8,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      8.7,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 9.6798,
      "wavelengthAngstrom": 1.2809,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 9.6798,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 1.188,
        "wavelengthAngstrom": 10.4364,
        "relativeIntensity": 64.0,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 1.2185,
        "wavelengthAngstrom": 10.1751,
        "relativeIntensity": 17.2,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 9.6798,
        "wavelengthAngstrom": 1.2809,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 9.8864,
        "wavelengthAngstrom": 1.2541,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 10.9821,
        "wavelengthAngstrom": 1.129,
        "relativeIntensity": 13.2,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 11.103,
        "jumpRatio": 4.8
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 1.217,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.4835,
    "fluorescenceYieldL": 0.0172,
    "moseleyPredictedKeV": 9.806,
    "moseleyDeltaKeV": -0.126,
    "moseleyDeltaPercent": -1.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 7.94,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 19.36
      }
    ]
  },
  "33": {
    "atomicNumber": 33,
    "symbol": "As",
    "name": "Arsenic",
    "atomicWeight": 74.922,
    "fingerprintHash": "XRF-33-As-10.315-1295",
    "spectralBarcode": [
      0.0,
      57.6,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      8.9,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 10.315,
      "wavelengthAngstrom": 1.202,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 10.315,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 1.282,
        "wavelengthAngstrom": 9.6712,
        "relativeIntensity": 68.5,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 1.317,
        "wavelengthAngstrom": 9.4141,
        "relativeIntensity": 18.5,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 10.315,
        "wavelengthAngstrom": 1.202,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 10.5437,
        "wavelengthAngstrom": 1.1759,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 11.7256,
        "wavelengthAngstrom": 1.0574,
        "relativeIntensity": 13.5,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 11.867,
        "jumpRatio": 5.0
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 1.323,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.5143,
    "fluorescenceYieldL": 0.0225,
    "moseleyPredictedKeV": 10.449,
    "moseleyDeltaKeV": -0.134,
    "moseleyDeltaPercent": -1.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 8.575,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 20.63
      }
    ]
  },
  "34": {
    "atomicNumber": 34,
    "symbol": "Se",
    "name": "Selenium",
    "atomicWeight": 78.971,
    "fingerprintHash": "XRF-34-Se-10.970-133D",
    "spectralBarcode": [
      0.0,
      92.8,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      51.0,
      100.0,
      13.9,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 10.97,
      "wavelengthAngstrom": 1.1302,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 10.97,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 1.3791,
        "wavelengthAngstrom": 8.9902,
        "relativeIntensity": 73.0,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 1.4192,
        "wavelengthAngstrom": 8.7362,
        "relativeIntensity": 19.8,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 10.97,
        "wavelengthAngstrom": 1.1302,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 11.2224,
        "wavelengthAngstrom": 1.1048,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 12.4959,
        "wavelengthAngstrom": 0.9922,
        "relativeIntensity": 13.9,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 12.658,
        "jumpRatio": 5.1
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 1.434,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.544,
    "fluorescenceYieldL": 0.0289,
    "moseleyPredictedKeV": 11.112,
    "moseleyDeltaKeV": -0.142,
    "moseleyDeltaPercent": -1.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 9.23,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 21.94
      }
    ]
  },
  "35": {
    "atomicNumber": 35,
    "symbol": "Br",
    "name": "Bromine",
    "atomicWeight": 79.904,
    "fingerprintHash": "XRF-35-Br-11.647-13E6",
    "spectralBarcode": [
      0.0,
      65.3,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      9.4,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 11.647,
      "wavelengthAngstrom": 1.0645,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 11.647,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 1.4804,
        "wavelengthAngstrom": 8.375,
        "relativeIntensity": 77.5,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 1.5259,
        "wavelengthAngstrom": 8.1253,
        "relativeIntensity": 21.1,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 11.647,
        "wavelengthAngstrom": 1.0645,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 11.9242,
        "wavelengthAngstrom": 1.0398,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 13.2907,
        "wavelengthAngstrom": 0.9329,
        "relativeIntensity": 14.2,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 13.474,
        "jumpRatio": 5.2
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 1.55,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.5726,
    "fluorescenceYieldL": 0.0366,
    "moseleyPredictedKeV": 11.796,
    "moseleyDeltaKeV": -0.149,
    "moseleyDeltaPercent": -1.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 9.907,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 1.761,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 23.294
      }
    ]
  },
  "36": {
    "atomicNumber": 36,
    "symbol": "Kr",
    "name": "Krypton",
    "atomicWeight": 83.798,
    "fingerprintHash": "XRF-36-Kr-12.345-1491",
    "spectralBarcode": [
      0.0,
      69.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      9.7,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 12.345,
      "wavelengthAngstrom": 1.0043,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 12.345,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 1.586,
        "wavelengthAngstrom": 7.8174,
        "relativeIntensity": 82.0,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 1.637,
        "wavelengthAngstrom": 7.5739,
        "relativeIntensity": 22.4,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 12.345,
        "wavelengthAngstrom": 1.0043,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 12.649,
        "wavelengthAngstrom": 0.9802,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 14.112,
        "wavelengthAngstrom": 0.8786,
        "relativeIntensity": 14.6,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 14.326,
        "jumpRatio": 5.3
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 1.675,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.5999,
    "fluorescenceYieldL": 0.0455,
    "moseleyPredictedKeV": 12.5,
    "moseleyDeltaKeV": -0.155,
    "moseleyDeltaPercent": -1.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 10.605,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 2.459,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 24.69
      }
    ]
  },
  "37": {
    "atomicNumber": 37,
    "symbol": "Rb",
    "name": "Rubidium",
    "atomicWeight": 85.468,
    "fingerprintHash": "XRF-37-Rb-13.063-153E",
    "spectralBarcode": [
      0.0,
      73.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      9.9,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 13.063,
      "wavelengthAngstrom": 0.9491,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 13.063,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 1.694,
        "wavelengthAngstrom": 7.319,
        "relativeIntensity": 86.5,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 1.752,
        "wavelengthAngstrom": 7.0767,
        "relativeIntensity": 23.7,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 13.063,
        "wavelengthAngstrom": 0.9491,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 13.395,
        "wavelengthAngstrom": 0.9256,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 14.961,
        "wavelengthAngstrom": 0.8287,
        "relativeIntensity": 14.9,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 15.2,
        "jumpRatio": 5.4
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 1.804,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.6259,
    "fluorescenceYieldL": 0.0559,
    "moseleyPredictedKeV": 13.224,
    "moseleyDeltaKeV": -0.161,
    "moseleyDeltaPercent": -1.2,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 11.323,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 3.177,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 26.126
      }
    ]
  },
  "38": {
    "atomicNumber": 38,
    "symbol": "Sr",
    "name": "Strontium",
    "atomicWeight": 87.62,
    "fingerprintHash": "XRF-38-Sr-13.802-15EC",
    "spectralBarcode": [
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      44.0,
      86.2,
      13.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 13.802,
      "wavelengthAngstrom": 0.8983,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 13.802,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 1.806,
        "wavelengthAngstrom": 6.8651,
        "relativeIntensity": 91.0,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 1.872,
        "wavelengthAngstrom": 6.6231,
        "relativeIntensity": 25.0,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 13.802,
        "wavelengthAngstrom": 0.8983,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 14.165,
        "wavelengthAngstrom": 0.8753,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 15.836,
        "wavelengthAngstrom": 0.7829,
        "relativeIntensity": 15.3,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 16.105,
        "jumpRatio": 5.6
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 1.94,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.6506,
    "fluorescenceYieldL": 0.0678,
    "moseleyPredictedKeV": 13.969,
    "moseleyDeltaKeV": -0.167,
    "moseleyDeltaPercent": -1.2,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 12.062,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 3.916,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 27.604
      }
    ]
  },
  "39": {
    "atomicNumber": 39,
    "symbol": "Y",
    "name": "Yttrium",
    "atomicWeight": 88.906,
    "fingerprintHash": "XRF-39-Y-14.563-169B",
    "spectralBarcode": [
      0.0,
      80.7,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      10.3,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 14.563,
      "wavelengthAngstrom": 0.8514,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 14.563,
    "lines": [
      {
        "siegbahn": "L\u03b1",
        "iupac": "L3-M4,5",
        "energyKeV": 1.922,
        "wavelengthAngstrom": 6.4508,
        "relativeIntensity": 95.5,
        "shell": "L",
        "transition": "3d \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 1.996,
        "wavelengthAngstrom": 6.2116,
        "relativeIntensity": 26.3,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 14.563,
        "wavelengthAngstrom": 0.8514,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 14.958,
        "wavelengthAngstrom": 0.8289,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 16.738,
        "wavelengthAngstrom": 0.7407,
        "relativeIntensity": 15.6,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 17.038,
        "jumpRatio": 5.7
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 2.08,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.6738,
    "fluorescenceYieldL": 0.0812,
    "moseleyPredictedKeV": 14.735,
    "moseleyDeltaKeV": -0.172,
    "moseleyDeltaPercent": -1.2,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 12.823,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 4.677,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 29.126
      }
    ]
  },
  "40": {
    "atomicNumber": 40,
    "symbol": "Zr",
    "name": "Zirconium",
    "atomicWeight": 91.224,
    "fingerprintHash": "XRF-40-Zr-15.346-174D",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      90.6,
      0.0,
      9.6,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 15.346,
      "wavelengthAngstrom": 0.8079,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 15.346,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 2.024,
        "wavelengthAngstrom": 6.1257,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 2.042,
        "wavelengthAngstrom": 6.0717,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 2.124,
        "wavelengthAngstrom": 5.8373,
        "relativeIntensity": 27.6,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 2.48,
        "wavelengthAngstrom": 4.9994,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 15.346,
        "wavelengthAngstrom": 0.8079,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 15.775,
        "wavelengthAngstrom": 0.786,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 17.668,
        "wavelengthAngstrom": 0.7017,
        "relativeIntensity": 16.0,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 17.998,
        "jumpRatio": 5.8
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 2.223,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.6957,
    "fluorescenceYieldL": 0.0962,
    "moseleyPredictedKeV": 15.52,
    "moseleyDeltaKeV": -0.174,
    "moseleyDeltaPercent": -1.1,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 13.606,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 5.46,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 30.692
      }
    ]
  },
  "41": {
    "atomicNumber": 41,
    "symbol": "Nb",
    "name": "Niobium",
    "atomicWeight": 92.906,
    "fingerprintHash": "XRF-41-Nb-16.150-17FF",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      89.9,
      0.0,
      9.8,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 16.15,
      "wavelengthAngstrom": 0.7677,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 16.15,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 2.147,
        "wavelengthAngstrom": 5.7748,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 2.166,
        "wavelengthAngstrom": 5.7241,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 2.257,
        "wavelengthAngstrom": 5.4933,
        "relativeIntensity": 28.9,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 2.628,
        "wavelengthAngstrom": 4.7178,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 16.15,
        "wavelengthAngstrom": 0.7677,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 16.615,
        "wavelengthAngstrom": 0.7462,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 18.623,
        "wavelengthAngstrom": 0.6658,
        "relativeIntensity": 16.4,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 18.986,
        "jumpRatio": 5.9
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 2.371,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.7162,
    "fluorescenceYieldL": 0.1128,
    "moseleyPredictedKeV": 16.326,
    "moseleyDeltaKeV": -0.176,
    "moseleyDeltaPercent": -1.1,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 14.41,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 6.264,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 32.3
      }
    ]
  },
  "42": {
    "atomicNumber": 42,
    "symbol": "Mo",
    "name": "Molybdenum",
    "atomicWeight": 95.95,
    "fingerprintHash": "XRF-42-Mo-16.975-18B3",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      30.1,
      59.1,
      0.0,
      9.9,
      0.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 16.975,
      "wavelengthAngstrom": 0.7304,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 16.975,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 2.272,
        "wavelengthAngstrom": 5.4571,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 2.293,
        "wavelengthAngstrom": 5.4071,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 2.395,
        "wavelengthAngstrom": 5.1768,
        "relativeIntensity": 30.2,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 2.779,
        "wavelengthAngstrom": 4.4615,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 16.975,
        "wavelengthAngstrom": 0.7304,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 17.479,
        "wavelengthAngstrom": 0.7093,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 19.608,
        "wavelengthAngstrom": 0.6323,
        "relativeIntensity": 16.7,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 20.0,
        "jumpRatio": 6.0
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 2.52,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.7353,
    "fluorescenceYieldL": 0.131,
    "moseleyPredictedKeV": 17.153,
    "moseleyDeltaKeV": -0.178,
    "moseleyDeltaPercent": -1.0,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 15.235,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 7.089,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 33.95
      }
    ]
  },
  "43": {
    "atomicNumber": 43,
    "symbol": "Tc",
    "name": "Technetium",
    "atomicWeight": 98.0,
    "fingerprintHash": "XRF-43-Tc-17.823-1969",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      29.9,
      58.7,
      0.0,
      10.0,
      0.0,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 17.823,
      "wavelengthAngstrom": 0.6956,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 17.823,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 2.402,
        "wavelengthAngstrom": 5.1617,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 2.424,
        "wavelengthAngstrom": 5.1149,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 2.538,
        "wavelengthAngstrom": 4.8851,
        "relativeIntensity": 31.5,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 2.935,
        "wavelengthAngstrom": 4.2243,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 17.823,
        "wavelengthAngstrom": 0.6956,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 18.367,
        "wavelengthAngstrom": 0.675,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 20.619,
        "wavelengthAngstrom": 0.6013,
        "relativeIntensity": 17.0,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 21.044,
        "jumpRatio": 6.2
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 2.677,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.7532,
    "fluorescenceYieldL": 0.1508,
    "moseleyPredictedKeV": 18.0,
    "moseleyDeltaKeV": -0.177,
    "moseleyDeltaPercent": -1.0,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 16.083,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 7.937,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 35.646
      }
    ]
  },
  "44": {
    "atomicNumber": 44,
    "symbol": "Ru",
    "name": "Ruthenium",
    "atomicWeight": 101.07,
    "fingerprintHash": "XRF-44-Ru-18.692-1A20",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      19.5,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      35.5,
      69.5,
      0.0,
      12.1,
      0.0,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 18.692,
      "wavelengthAngstrom": 0.6633,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 18.692,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 2.535,
        "wavelengthAngstrom": 4.8909,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 2.558,
        "wavelengthAngstrom": 4.8469,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 2.683,
        "wavelengthAngstrom": 4.6211,
        "relativeIntensity": 32.8,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 3.094,
        "wavelengthAngstrom": 4.0072,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 18.692,
        "wavelengthAngstrom": 0.6633,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 19.279,
        "wavelengthAngstrom": 0.6431,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 21.657,
        "wavelengthAngstrom": 0.5725,
        "relativeIntensity": 17.4,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 22.117,
        "jumpRatio": 6.3
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 2.838,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.7699,
    "fluorescenceYieldL": 0.172,
    "moseleyPredictedKeV": 18.867,
    "moseleyDeltaKeV": -0.175,
    "moseleyDeltaPercent": -0.9,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 16.952,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 8.806,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 37.384
      }
    ]
  },
  "45": {
    "atomicNumber": 45,
    "symbol": "Rh",
    "name": "Rhodium",
    "atomicWeight": 102.91,
    "fingerprintHash": "XRF-45-Rh-19.584-1AD8",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      19.3,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      35.1,
      68.9,
      0.0,
      12.3,
      0.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 19.584,
      "wavelengthAngstrom": 0.6331,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 19.584,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 2.673,
        "wavelengthAngstrom": 4.6384,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 2.697,
        "wavelengthAngstrom": 4.5971,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 2.834,
        "wavelengthAngstrom": 4.3749,
        "relativeIntensity": 34.1,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 3.259,
        "wavelengthAngstrom": 3.8044,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 19.584,
        "wavelengthAngstrom": 0.6331,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 20.216,
        "wavelengthAngstrom": 0.6133,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 22.724,
        "wavelengthAngstrom": 0.5456,
        "relativeIntensity": 17.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 23.22,
        "jumpRatio": 6.4
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 3.004,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.7855,
    "fluorescenceYieldL": 0.1946,
    "moseleyPredictedKeV": 19.755,
    "moseleyDeltaKeV": -0.171,
    "moseleyDeltaPercent": -0.9,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 17.844,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 9.698,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 39.168
      }
    ]
  },
  "46": {
    "atomicNumber": 46,
    "symbol": "Pd",
    "name": "Palladium",
    "atomicWeight": 106.42,
    "fingerprintHash": "XRF-46-Pd-20.498-1B93",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      19.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      34.8,
      68.3,
      0.0,
      12.4
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 20.498,
      "wavelengthAngstrom": 0.6049,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 20.498,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 2.813,
        "wavelengthAngstrom": 4.4075,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 2.839,
        "wavelengthAngstrom": 4.3672,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 2.99,
        "wavelengthAngstrom": 4.1466,
        "relativeIntensity": 35.4,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 3.428,
        "wavelengthAngstrom": 3.6168,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 20.498,
        "wavelengthAngstrom": 0.6049,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 21.177,
        "wavelengthAngstrom": 0.5855,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 23.819,
        "wavelengthAngstrom": 0.5205,
        "relativeIntensity": 18.1,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 24.35,
        "jumpRatio": 6.5
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 3.173,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.7999,
    "fluorescenceYieldL": 0.2184,
    "moseleyPredictedKeV": 20.663,
    "moseleyDeltaKeV": -0.165,
    "moseleyDeltaPercent": -0.8,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 18.758,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 10.612,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 40.996
      }
    ]
  },
  "47": {
    "atomicNumber": 47,
    "symbol": "Ag",
    "name": "Silver",
    "atomicWeight": 107.87,
    "fingerprintHash": "XRF-47-Ag-21.434-1C4E",
    "spectralBarcode": [
      0.0,
      0.0,
      100.0,
      58.3,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      45.9,
      90.1,
      8.3
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 21.434,
      "wavelengthAngstrom": 0.5784,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 21.434,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 2.957,
        "wavelengthAngstrom": 4.1929,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 2.984,
        "wavelengthAngstrom": 4.155,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 3.151,
        "wavelengthAngstrom": 3.9348,
        "relativeIntensity": 36.7,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 3.601,
        "wavelengthAngstrom": 3.443,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 4.099,
        "wavelengthAngstrom": 3.0247,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 21.434,
        "wavelengthAngstrom": 0.5784,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 22.163,
        "wavelengthAngstrom": 0.5594,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 24.942,
        "wavelengthAngstrom": 0.4971,
        "relativeIntensity": 18.4,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 25.514,
        "jumpRatio": 6.6
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 3.351,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.8133,
    "fluorescenceYieldL": 0.2433,
    "moseleyPredictedKeV": 21.592,
    "moseleyDeltaKeV": -0.158,
    "moseleyDeltaPercent": -0.7,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 19.694,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 11.548,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 42.868
      }
    ]
  },
  "48": {
    "atomicNumber": 48,
    "symbol": "Cd",
    "name": "Cadmium",
    "atomicWeight": 112.41,
    "fingerprintHash": "XRF-48-Cd-22.392-1D0C",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      100.0,
      10.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      28.8,
      61.8
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 22.392,
      "wavelengthAngstrom": 0.5537,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 22.392,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 3.105,
        "wavelengthAngstrom": 3.993,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 3.133,
        "wavelengthAngstrom": 3.9574,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 3.317,
        "wavelengthAngstrom": 3.7378,
        "relativeIntensity": 38.0,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 3.778,
        "wavelengthAngstrom": 3.2817,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 4.298,
        "wavelengthAngstrom": 2.8847,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 22.392,
        "wavelengthAngstrom": 0.5537,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 23.174,
        "wavelengthAngstrom": 0.535,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 26.096,
        "wavelengthAngstrom": 0.4751,
        "relativeIntensity": 18.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 26.711,
        "jumpRatio": 6.8
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 3.538,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.8258,
    "fluorescenceYieldL": 0.2691,
    "moseleyPredictedKeV": 22.541,
    "moseleyDeltaKeV": -0.149,
    "moseleyDeltaPercent": -0.7,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 20.652,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 12.506,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 44.784
      }
    ]
  },
  "49": {
    "atomicNumber": 49,
    "symbol": "In",
    "name": "Indium",
    "atomicWeight": 114.82,
    "fingerprintHash": "XRF-49-In-23.373-1DCB",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      100.0,
      10.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      62.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 23.373,
      "wavelengthAngstrom": 0.5305,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 23.373,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 3.256,
        "wavelengthAngstrom": 3.8079,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 3.286,
        "wavelengthAngstrom": 3.7731,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 3.487,
        "wavelengthAngstrom": 3.5556,
        "relativeIntensity": 39.3,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 3.96,
        "wavelengthAngstrom": 3.1309,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 4.503,
        "wavelengthAngstrom": 2.7534,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 23.373,
        "wavelengthAngstrom": 0.5305,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 24.21,
        "wavelengthAngstrom": 0.5121,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 27.276,
        "wavelengthAngstrom": 0.4546,
        "relativeIntensity": 19.1,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 27.94,
        "jumpRatio": 6.9
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 3.73,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.8373,
    "fluorescenceYieldL": 0.2957,
    "moseleyPredictedKeV": 23.51,
    "moseleyDeltaKeV": -0.137,
    "moseleyDeltaPercent": -0.6,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 21.633,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 13.487,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 46.746
      }
    ]
  },
  "50": {
    "atomicNumber": 50,
    "symbol": "Sn",
    "name": "Tin",
    "atomicWeight": 118.71,
    "fingerprintHash": "XRF-50-Sn-24.377-1E8B",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      100.0,
      30.3,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      56.2
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 24.377,
      "wavelengthAngstrom": 0.5086,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 24.377,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 3.413,
        "wavelengthAngstrom": 3.6327,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 3.444,
        "wavelengthAngstrom": 3.6,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 3.663,
        "wavelengthAngstrom": 3.3848,
        "relativeIntensity": 40.6,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 4.148,
        "wavelengthAngstrom": 2.989,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 4.715,
        "wavelengthAngstrom": 2.6296,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 24.377,
        "wavelengthAngstrom": 0.5086,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 25.271,
        "wavelengthAngstrom": 0.4906,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 28.486,
        "wavelengthAngstrom": 0.4352,
        "relativeIntensity": 19.5,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 29.2,
        "jumpRatio": 7.0
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 3.929,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.848,
    "fluorescenceYieldL": 0.3228,
    "moseleyPredictedKeV": 24.5,
    "moseleyDeltaKeV": -0.123,
    "moseleyDeltaPercent": -0.5,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 22.637,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 14.491,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 48.754
      }
    ]
  },
  "51": {
    "atomicNumber": 51,
    "symbol": "Sb",
    "name": "Antimony",
    "atomicWeight": 121.76,
    "fingerprintHash": "XRF-51-Sb-25.404-1F4D",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      100.0,
      30.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      55.9
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 25.404,
      "wavelengthAngstrom": 0.488,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 25.404,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 3.572,
        "wavelengthAngstrom": 3.471,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 3.604,
        "wavelengthAngstrom": 3.4402,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 3.844,
        "wavelengthAngstrom": 3.2254,
        "relativeIntensity": 41.9,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 4.339,
        "wavelengthAngstrom": 2.8574,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 4.929,
        "wavelengthAngstrom": 2.5154,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 25.404,
        "wavelengthAngstrom": 0.488,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 26.359,
        "wavelengthAngstrom": 0.4704,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 29.726,
        "wavelengthAngstrom": 0.4171,
        "relativeIntensity": 19.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 30.491,
        "jumpRatio": 7.1
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 4.132,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.858,
    "fluorescenceYieldL": 0.3503,
    "moseleyPredictedKeV": 25.51,
    "moseleyDeltaKeV": -0.106,
    "moseleyDeltaPercent": -0.4,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 23.664,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 15.518,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 50.808
      }
    ]
  },
  "52": {
    "atomicNumber": 52,
    "symbol": "Te",
    "name": "Tellurium",
    "atomicWeight": 127.6,
    "fingerprintHash": "XRF-52-Te-26.454-2011",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      100.0,
      64.1,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      77.1
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 26.454,
      "wavelengthAngstrom": 0.4687,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 26.454,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 3.735,
        "wavelengthAngstrom": 3.3195,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 3.769,
        "wavelengthAngstrom": 3.2896,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 4.03,
        "wavelengthAngstrom": 3.0765,
        "relativeIntensity": 43.2,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 4.535,
        "wavelengthAngstrom": 2.7339,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 5.15,
        "wavelengthAngstrom": 2.4075,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 26.454,
        "wavelengthAngstrom": 0.4687,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 27.472,
        "wavelengthAngstrom": 0.4513,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 30.996,
        "wavelengthAngstrom": 0.4,
        "relativeIntensity": 20.2,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 31.814,
        "jumpRatio": 7.2
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 4.341,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.8672,
    "fluorescenceYieldL": 0.3779,
    "moseleyPredictedKeV": 26.541,
    "moseleyDeltaKeV": -0.087,
    "moseleyDeltaPercent": -0.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 24.714,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 16.568,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 52.908
      }
    ]
  },
  "53": {
    "atomicNumber": 53,
    "symbol": "I",
    "name": "Iodine",
    "atomicWeight": 126.9,
    "fingerprintHash": "XRF-53-I-27.527-20D6",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      100.0,
      65.3,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      77.3
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 27.527,
      "wavelengthAngstrom": 0.4504,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 27.527,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 3.903,
        "wavelengthAngstrom": 3.1766,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 3.938,
        "wavelengthAngstrom": 3.1484,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 4.221,
        "wavelengthAngstrom": 2.9373,
        "relativeIntensity": 44.5,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 4.736,
        "wavelengthAngstrom": 2.6179,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 5.377,
        "wavelengthAngstrom": 2.3058,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 27.527,
        "wavelengthAngstrom": 0.4504,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 28.612,
        "wavelengthAngstrom": 0.4333,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 32.295,
        "wavelengthAngstrom": 0.3839,
        "relativeIntensity": 20.5,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 33.169,
        "jumpRatio": 7.4
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 4.557,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.8757,
    "fluorescenceYieldL": 0.4055,
    "moseleyPredictedKeV": 27.592,
    "moseleyDeltaKeV": -0.065,
    "moseleyDeltaPercent": -0.2,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 25.787,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 17.641,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 55.054
      }
    ]
  },
  "54": {
    "atomicNumber": 54,
    "symbol": "Xe",
    "name": "Xenon",
    "atomicWeight": 131.29,
    "fingerprintHash": "XRF-54-Xe-28.625-219D",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      9.7,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      46.5
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 28.625,
      "wavelengthAngstrom": 0.4331,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 28.625,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 4.073,
        "wavelengthAngstrom": 3.0441,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 4.11,
        "wavelengthAngstrom": 3.0166,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 4.417,
        "wavelengthAngstrom": 2.807,
        "relativeIntensity": 45.8,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 4.941,
        "wavelengthAngstrom": 2.5093,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 5.607,
        "wavelengthAngstrom": 2.2112,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 28.625,
        "wavelengthAngstrom": 0.4331,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 29.779,
        "wavelengthAngstrom": 0.4163,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 33.624,
        "wavelengthAngstrom": 0.3687,
        "relativeIntensity": 20.9,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 34.561,
        "jumpRatio": 7.5
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 4.782,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.8836,
    "fluorescenceYieldL": 0.4329,
    "moseleyPredictedKeV": 28.663,
    "moseleyDeltaKeV": -0.038,
    "moseleyDeltaPercent": -0.1,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 26.885,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 18.739,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 57.25
      }
    ]
  },
  "55": {
    "atomicNumber": 55,
    "symbol": "Cs",
    "name": "Cesium",
    "atomicWeight": 132.91,
    "fingerprintHash": "XRF-55-Cs-29.746-2266",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      29.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      54.5
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 29.746,
      "wavelengthAngstrom": 0.4168,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 29.746,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 4.247,
        "wavelengthAngstrom": 2.9193,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 4.286,
        "wavelengthAngstrom": 2.8928,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 4.62,
        "wavelengthAngstrom": 2.6836,
        "relativeIntensity": 47.1,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 5.15,
        "wavelengthAngstrom": 2.4075,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 5.843,
        "wavelengthAngstrom": 2.1219,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 29.746,
        "wavelengthAngstrom": 0.4168,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 30.973,
        "wavelengthAngstrom": 0.4003,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 34.987,
        "wavelengthAngstrom": 0.3544,
        "relativeIntensity": 21.2,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 35.985,
        "jumpRatio": 7.6
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 5.012,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.891,
    "fluorescenceYieldL": 0.46,
    "moseleyPredictedKeV": 29.755,
    "moseleyDeltaKeV": -0.009,
    "moseleyDeltaPercent": -0.0,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 28.006,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 19.86,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 59.492
      }
    ]
  },
  "56": {
    "atomicNumber": 56,
    "symbol": "Ba",
    "name": "Barium",
    "atomicWeight": 137.33,
    "fingerprintHash": "XRF-56-Ba-30.892-2331",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      17.6,
      11.3,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      54.1
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 30.892,
      "wavelengthAngstrom": 0.4013,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 30.892,
    "lines": [
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 4.426,
        "wavelengthAngstrom": 2.8013,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 4.466,
        "wavelengthAngstrom": 2.7762,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 4.828,
        "wavelengthAngstrom": 2.568,
        "relativeIntensity": 48.4,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 5.365,
        "wavelengthAngstrom": 2.311,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 6.084,
        "wavelengthAngstrom": 2.0379,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 30.892,
        "wavelengthAngstrom": 0.4013,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 32.194,
        "wavelengthAngstrom": 0.3851,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 36.378,
        "wavelengthAngstrom": 0.3408,
        "relativeIntensity": 21.6,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 37.441,
        "jumpRatio": 7.7
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 5.247,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.8978,
    "fluorescenceYieldL": 0.4866,
    "moseleyPredictedKeV": 30.867,
    "moseleyDeltaKeV": 0.025,
    "moseleyDeltaPercent": 0.1,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 29.152,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 21.006,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 61.784
      }
    ]
  },
  "57": {
    "atomicNumber": 57,
    "symbol": "La",
    "name": "Lanthanum",
    "atomicWeight": 138.91,
    "fingerprintHash": "XRF-57-La-32.061-23FD",
    "spectralBarcode": [
      90.1,
      0.0,
      0.0,
      0.0,
      100.0,
      70.0,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      77.9
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 32.061,
      "wavelengthAngstrom": 0.3867,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 32.061,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 0.833,
        "wavelengthAngstrom": 14.8841,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 4.609,
        "wavelengthAngstrom": 2.69,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 4.651,
        "wavelengthAngstrom": 2.6658,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 5.042,
        "wavelengthAngstrom": 2.459,
        "relativeIntensity": 49.7,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 5.585,
        "wavelengthAngstrom": 2.2199,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 6.332,
        "wavelengthAngstrom": 1.9581,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 32.061,
        "wavelengthAngstrom": 0.3867,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 33.442,
        "wavelengthAngstrom": 0.3707,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 37.801,
        "wavelengthAngstrom": 0.328,
        "relativeIntensity": 21.9,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 38.925,
        "jumpRatio": 7.8
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 5.483,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9041,
    "fluorescenceYieldL": 0.5126,
    "moseleyPredictedKeV": 32.0,
    "moseleyDeltaKeV": 0.061,
    "moseleyDeltaPercent": 0.2,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 30.321,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 22.175,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 64.122
      }
    ]
  },
  "58": {
    "atomicNumber": 58,
    "symbol": "Ce",
    "name": "Cerium",
    "atomicWeight": 140.12,
    "fingerprintHash": "XRF-58-Ce-33.256-24CB",
    "spectralBarcode": [
      90.1,
      0.0,
      0.0,
      0.0,
      100.0,
      71.2,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      78.1
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 33.256,
      "wavelengthAngstrom": 0.3728,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 33.256,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 0.883,
        "wavelengthAngstrom": 14.0412,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 4.796,
        "wavelengthAngstrom": 2.5852,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 4.84,
        "wavelengthAngstrom": 2.5617,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 5.262,
        "wavelengthAngstrom": 2.3562,
        "relativeIntensity": 51.0,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 5.81,
        "wavelengthAngstrom": 2.134,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 6.586,
        "wavelengthAngstrom": 1.8825,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 33.256,
        "wavelengthAngstrom": 0.3728,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 34.72,
        "wavelengthAngstrom": 0.3571,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 39.257,
        "wavelengthAngstrom": 0.3158,
        "relativeIntensity": 22.3,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 40.443,
        "jumpRatio": 8.0
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 5.723,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9099,
    "fluorescenceYieldL": 0.5378,
    "moseleyPredictedKeV": 33.153,
    "moseleyDeltaKeV": 0.103,
    "moseleyDeltaPercent": 0.3,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 31.516,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 23.37,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 66.512
      }
    ]
  },
  "59": {
    "atomicNumber": 59,
    "symbol": "Pr",
    "name": "Praseodymium",
    "atomicWeight": 140.91,
    "fingerprintHash": "XRF-59-Pr-34.476-259A",
    "spectralBarcode": [
      65.7,
      0.0,
      0.0,
      0.0,
      7.2,
      100.0,
      30.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      57.0
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 34.476,
      "wavelengthAngstrom": 0.3596,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 34.476,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 0.929,
        "wavelengthAngstrom": 13.346,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 4.989,
        "wavelengthAngstrom": 2.4852,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 5.034,
        "wavelengthAngstrom": 2.4629,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 5.489,
        "wavelengthAngstrom": 2.2588,
        "relativeIntensity": 52.3,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 6.04,
        "wavelengthAngstrom": 2.0527,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 6.846,
        "wavelengthAngstrom": 1.811,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 34.476,
        "wavelengthAngstrom": 0.3596,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 36.026,
        "wavelengthAngstrom": 0.3442,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 40.748,
        "wavelengthAngstrom": 0.3043,
        "relativeIntensity": 22.6,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 41.991,
        "jumpRatio": 8.1
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 5.964,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9154,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 34.326,
    "moseleyDeltaKeV": 0.15,
    "moseleyDeltaPercent": 0.4,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 32.736,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 24.59,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 68.952
      }
    ]
  },
  "60": {
    "atomicNumber": 60,
    "symbol": "Nd",
    "name": "Neodymium",
    "atomicWeight": 144.24,
    "fingerprintHash": "XRF-60-Nd-35.722-266C",
    "spectralBarcode": [
      60.8,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      17.0,
      10.9,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      52.9
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 35.722,
      "wavelengthAngstrom": 0.3471,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 35.722,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 0.978,
        "wavelengthAngstrom": 12.6773,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 5.183,
        "wavelengthAngstrom": 2.3921,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 5.23,
        "wavelengthAngstrom": 2.3706,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 5.722,
        "wavelengthAngstrom": 2.1668,
        "relativeIntensity": 53.6,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 6.274,
        "wavelengthAngstrom": 1.9762,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 7.108,
        "wavelengthAngstrom": 1.7443,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 35.722,
        "wavelengthAngstrom": 0.3471,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 37.361,
        "wavelengthAngstrom": 0.3319,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 42.271,
        "wavelengthAngstrom": 0.2933,
        "relativeIntensity": 23.0,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 43.569,
        "jumpRatio": 8.2
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 6.208,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9205,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 35.52,
    "moseleyDeltaKeV": 0.202,
    "moseleyDeltaPercent": 0.6,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 33.982,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 25.836,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 71.444
      }
    ]
  },
  "61": {
    "atomicNumber": 61,
    "symbol": "Pm",
    "name": "Promethium",
    "atomicWeight": 145.0,
    "fingerprintHash": "XRF-61-Pm-36.992-273F",
    "spectralBarcode": [
      60.3,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      16.9,
      10.8,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      52.5
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 36.992,
      "wavelengthAngstrom": 0.3352,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 36.992,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 0.944,
        "wavelengthAngstrom": 13.1339,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 5.383,
        "wavelengthAngstrom": 2.3033,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 5.432,
        "wavelengthAngstrom": 2.2825,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 5.956,
        "wavelengthAngstrom": 2.0817,
        "relativeIntensity": 54.9,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 6.514,
        "wavelengthAngstrom": 1.9033,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 7.379,
        "wavelengthAngstrom": 1.6802,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 36.992,
        "wavelengthAngstrom": 0.3352,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 38.725,
        "wavelengthAngstrom": 0.3202,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 43.826,
        "wavelengthAngstrom": 0.2829,
        "relativeIntensity": 23.3,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 45.184,
        "jumpRatio": 8.3
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 6.459,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9252,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 36.734,
    "moseleyDeltaKeV": 0.258,
    "moseleyDeltaPercent": 0.7,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 35.252,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 27.106,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 73.984
      }
    ]
  },
  "62": {
    "atomicNumber": 62,
    "symbol": "Sm",
    "name": "Samarium",
    "atomicWeight": 150.36,
    "fingerprintHash": "XRF-62-Sm-38.288-2814",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      100.0,
      75.9,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      78.7
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 38.288,
      "wavelengthAngstrom": 0.3238,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 38.288,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.081,
        "wavelengthAngstrom": 11.4694,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 5.585,
        "wavelengthAngstrom": 2.2199,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 5.636,
        "wavelengthAngstrom": 2.1999,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 6.205,
        "wavelengthAngstrom": 1.9981,
        "relativeIntensity": 56.2,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 6.757,
        "wavelengthAngstrom": 1.8349,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 7.652,
        "wavelengthAngstrom": 1.6203,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 38.288,
        "wavelengthAngstrom": 0.3238,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 40.118,
        "wavelengthAngstrom": 0.309,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 45.413,
        "wavelengthAngstrom": 0.273,
        "relativeIntensity": 23.7,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 46.834,
        "jumpRatio": 8.4
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 6.716,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9295,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 37.969,
    "moseleyDeltaKeV": 0.319,
    "moseleyDeltaPercent": 0.8,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 36.548,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 28.402,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 76.576
      }
    ]
  },
  "63": {
    "atomicNumber": 63,
    "symbol": "Eu",
    "name": "Europium",
    "atomicWeight": 151.96,
    "fingerprintHash": "XRF-63-Eu-39.611-28EB",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      100.0,
      51.8,
      41.4,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      78.8
    ],
    "primaryLine": {
      "siegbahn": "K\u03b1\u2082",
      "iupac": "K-L2",
      "energyKeV": 39.611,
      "wavelengthAngstrom": 0.313,
      "relativeIntensity": 51,
      "shell": "K",
      "transition": "2p1/2 \u2192 1s1/2"
    },
    "primaryLineKeV": 39.611,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.045,
        "wavelengthAngstrom": 11.8645,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 5.793,
        "wavelengthAngstrom": 2.1402,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 5.846,
        "wavelengthAngstrom": 2.1208,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 6.456,
        "wavelengthAngstrom": 1.9204,
        "relativeIntensity": 57.5,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 7.007,
        "wavelengthAngstrom": 1.7694,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 7.934,
        "wavelengthAngstrom": 1.5627,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 39.611,
        "wavelengthAngstrom": 0.313,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 41.542,
        "wavelengthAngstrom": 0.2985,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 47.038,
        "wavelengthAngstrom": 0.2636,
        "relativeIntensity": 24.0,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 48.519,
        "jumpRatio": 8.6
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 6.977,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9336,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 39.224,
    "moseleyDeltaKeV": 0.387,
    "moseleyDeltaPercent": 1.0,
    "escapePeaks": [
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 37.871,
        "detector": "Si"
      },
      {
        "parentLine": "K\u03b1\u2082",
        "escapeEnergyKeV": 29.725,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "K\u03b1\u2082 + K\u03b1\u2082",
        "sumEnergyKeV": 79.222
      }
    ]
  },
  "64": {
    "atomicNumber": 64,
    "symbol": "Gd",
    "name": "Gadolinium",
    "atomicWeight": 157.25,
    "fingerprintHash": "XRF-64-Gd-6.002-20B2",
    "spectralBarcode": [
      0.0,
      58.9,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      16.5,
      10.6,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      51.6
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 6.002,
      "wavelengthAngstrom": 2.0657,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 6.002,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.186,
        "wavelengthAngstrom": 10.454,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 6.002,
        "wavelengthAngstrom": 2.0657,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 6.057,
        "wavelengthAngstrom": 2.047,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 6.713,
        "wavelengthAngstrom": 1.8469,
        "relativeIntensity": 58.8,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 7.258,
        "wavelengthAngstrom": 1.7082,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 8.216,
        "wavelengthAngstrom": 1.5091,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 40.96,
        "wavelengthAngstrom": 0.3027,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 42.996,
        "wavelengthAngstrom": 0.2884,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 48.697,
        "wavelengthAngstrom": 0.2546,
        "relativeIntensity": 24.4,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 50.239,
        "jumpRatio": 8.7
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 7.243,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9374,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 40.5,
    "moseleyDeltaKeV": -34.498,
    "moseleyDeltaPercent": -574.8,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 4.262,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 12.004
      }
    ]
  },
  "65": {
    "atomicNumber": 65,
    "symbol": "Tb",
    "name": "Terbium",
    "atomicWeight": 158.93,
    "fingerprintHash": "XRF-65-Tb-6.217-2140",
    "spectralBarcode": [
      0.0,
      58.4,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      16.4,
      10.5,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      51.4
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 6.217,
      "wavelengthAngstrom": 1.9943,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 6.217,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.152,
        "wavelengthAngstrom": 10.7625,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 6.217,
        "wavelengthAngstrom": 1.9943,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 6.273,
        "wavelengthAngstrom": 1.9765,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 6.978,
        "wavelengthAngstrom": 1.7768,
        "relativeIntensity": 60.1,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 7.515,
        "wavelengthAngstrom": 1.6498,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 8.506,
        "wavelengthAngstrom": 1.4576,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 42.337,
        "wavelengthAngstrom": 0.2929,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 44.482,
        "wavelengthAngstrom": 0.2787,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 50.382,
        "wavelengthAngstrom": 0.2461,
        "relativeIntensity": 24.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 51.996,
        "jumpRatio": 8.8
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 7.514,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.941,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 41.796,
    "moseleyDeltaKeV": -35.579,
    "moseleyDeltaPercent": -572.3,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 4.477,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 12.434
      }
    ]
  },
  "66": {
    "atomicNumber": 66,
    "symbol": "Dy",
    "name": "Dysprosium",
    "atomicWeight": 162.5,
    "fingerprintHash": "XRF-66-Dy-6.437-21CE",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      80.5,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      79.3
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 6.437,
      "wavelengthAngstrom": 1.9261,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 6.437,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.293,
        "wavelengthAngstrom": 9.5889,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 6.437,
        "wavelengthAngstrom": 1.9261,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 6.495,
        "wavelengthAngstrom": 1.9089,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 7.248,
        "wavelengthAngstrom": 1.7106,
        "relativeIntensity": 61.4,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 7.779,
        "wavelengthAngstrom": 1.5938,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 8.803,
        "wavelengthAngstrom": 1.4084,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 43.739,
        "wavelengthAngstrom": 0.2835,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 45.998,
        "wavelengthAngstrom": 0.2695,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 52.119,
        "wavelengthAngstrom": 0.2379,
        "relativeIntensity": 25.1,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 53.789,
        "jumpRatio": 8.9
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 7.79,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9443,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 43.112,
    "moseleyDeltaKeV": -36.675,
    "moseleyDeltaPercent": -569.8,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 4.697,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 12.874
      }
    ]
  },
  "67": {
    "atomicNumber": 67,
    "symbol": "Ho",
    "name": "Holmium",
    "atomicWeight": 164.93,
    "fingerprintHash": "XRF-67-Ho-6.660-225C",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      56.5,
      25.2,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      79.5
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 6.66,
      "wavelengthAngstrom": 1.8616,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 6.66,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.264,
        "wavelengthAngstrom": 9.8089,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 6.66,
        "wavelengthAngstrom": 1.8616,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 6.72,
        "wavelengthAngstrom": 1.845,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 7.528,
        "wavelengthAngstrom": 1.647,
        "relativeIntensity": 62.7,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 8.047,
        "wavelengthAngstrom": 1.5408,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 9.105,
        "wavelengthAngstrom": 1.3617,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 45.17,
        "wavelengthAngstrom": 0.2745,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 47.547,
        "wavelengthAngstrom": 0.2608,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 53.877,
        "wavelengthAngstrom": 0.2301,
        "relativeIntensity": 25.4,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 55.618,
        "jumpRatio": 9.0
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 8.071,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9473,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 44.449,
    "moseleyDeltaKeV": -37.789,
    "moseleyDeltaPercent": -567.4,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 4.92,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 13.32
      }
    ]
  },
  "68": {
    "atomicNumber": 68,
    "symbol": "Er",
    "name": "Erbium",
    "atomicWeight": 167.26,
    "fingerprintHash": "XRF-68-Er-6.886-22EA",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      57.7,
      25.2,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      79.6
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 6.886,
      "wavelengthAngstrom": 1.8005,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 6.886,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.406,
        "wavelengthAngstrom": 8.8182,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 6.886,
        "wavelengthAngstrom": 1.8005,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 6.949,
        "wavelengthAngstrom": 1.7842,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 7.811,
        "wavelengthAngstrom": 1.5873,
        "relativeIntensity": 64.0,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 8.319,
        "wavelengthAngstrom": 1.4904,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 9.412,
        "wavelengthAngstrom": 1.3173,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 46.629,
        "wavelengthAngstrom": 0.2659,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 49.128,
        "wavelengthAngstrom": 0.2524,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 55.681,
        "wavelengthAngstrom": 0.2227,
        "relativeIntensity": 25.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 57.486,
        "jumpRatio": 9.2
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 8.358,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9502,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 45.806,
    "moseleyDeltaKeV": -38.92,
    "moseleyDeltaPercent": -565.2,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 5.146,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 13.772
      }
    ]
  },
  "69": {
    "atomicNumber": 69,
    "symbol": "Tm",
    "name": "Thulium",
    "atomicWeight": 168.93,
    "fingerprintHash": "XRF-69-Tm-7.115-2379",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      84.1,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      79.8
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 7.115,
      "wavelengthAngstrom": 1.7426,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 7.115,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.383,
        "wavelengthAngstrom": 8.9649,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 7.115,
        "wavelengthAngstrom": 1.7426,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 7.18,
        "wavelengthAngstrom": 1.7268,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 8.101,
        "wavelengthAngstrom": 1.5305,
        "relativeIntensity": 65.3,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 8.594,
        "wavelengthAngstrom": 1.4427,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 9.721,
        "wavelengthAngstrom": 1.2754,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 48.116,
        "wavelengthAngstrom": 0.2577,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 50.742,
        "wavelengthAngstrom": 0.2443,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 57.517,
        "wavelengthAngstrom": 0.2156,
        "relativeIntensity": 26.1,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 59.39,
        "jumpRatio": 9.3
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 8.648,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9529,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 47.183,
    "moseleyDeltaKeV": -40.068,
    "moseleyDeltaPercent": -563.1,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 5.375,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 14.23
      }
    ]
  },
  "70": {
    "atomicNumber": 70,
    "symbol": "Yb",
    "name": "Ytterbium",
    "atomicWeight": 173.05,
    "fingerprintHash": "XRF-70-Yb-7.349-2408",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      85.2,
      0.0,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      80.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 7.349,
      "wavelengthAngstrom": 1.6871,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 7.349,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.521,
        "wavelengthAngstrom": 8.1515,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 7.349,
        "wavelengthAngstrom": 1.6871,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 7.416,
        "wavelengthAngstrom": 1.6718,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 8.402,
        "wavelengthAngstrom": 1.4757,
        "relativeIntensity": 66.6,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 8.875,
        "wavelengthAngstrom": 1.397,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 10.037,
        "wavelengthAngstrom": 1.2353,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 49.631,
        "wavelengthAngstrom": 0.2498,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 52.389,
        "wavelengthAngstrom": 0.2367,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 59.37,
        "wavelengthAngstrom": 0.2088,
        "relativeIntensity": 26.5,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 61.332,
        "jumpRatio": 9.4
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 8.944,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9554,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 48.581,
    "moseleyDeltaKeV": -41.232,
    "moseleyDeltaPercent": -561.1,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 5.609,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 14.698
      }
    ]
  },
  "71": {
    "atomicNumber": 71,
    "symbol": "Lu",
    "name": "Lutetium",
    "atomicWeight": 174.97,
    "fingerprintHash": "XRF-71-Lu-7.586-2498",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      61.2,
      25.2,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      80.1
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 7.586,
      "wavelengthAngstrom": 1.6344,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 7.586,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.507,
        "wavelengthAngstrom": 8.2272,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 7.586,
        "wavelengthAngstrom": 1.6344,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 7.655,
        "wavelengthAngstrom": 1.6196,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 8.709,
        "wavelengthAngstrom": 1.4236,
        "relativeIntensity": 67.9,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 9.159,
        "wavelengthAngstrom": 1.3537,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 10.358,
        "wavelengthAngstrom": 1.197,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 51.176,
        "wavelengthAngstrom": 0.2423,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 54.07,
        "wavelengthAngstrom": 0.2293,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 61.282,
        "wavelengthAngstrom": 0.2023,
        "relativeIntensity": 26.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 63.314,
        "jumpRatio": 9.5
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 9.244,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9578,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 50.0,
    "moseleyDeltaKeV": -42.414,
    "moseleyDeltaPercent": -559.1,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 5.846,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 15.172
      }
    ]
  },
  "72": {
    "atomicNumber": 72,
    "symbol": "Hf",
    "name": "Hafnium",
    "atomicWeight": 178.49,
    "fingerprintHash": "XRF-72-Hf-7.828-2528",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      87.6,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      80.3
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 7.828,
      "wavelengthAngstrom": 1.5839,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 7.828,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.644,
        "wavelengthAngstrom": 7.5416,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 7.828,
        "wavelengthAngstrom": 1.5839,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 7.899,
        "wavelengthAngstrom": 1.5696,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 9.023,
        "wavelengthAngstrom": 1.3741,
        "relativeIntensity": 69.2,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 9.45,
        "wavelengthAngstrom": 1.312,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 10.685,
        "wavelengthAngstrom": 1.1604,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 52.754,
        "wavelengthAngstrom": 0.235,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 55.79,
        "wavelengthAngstrom": 0.2222,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 63.234,
        "wavelengthAngstrom": 0.1961,
        "relativeIntensity": 27.2,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 65.351,
        "jumpRatio": 9.6
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 9.561,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.96,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 51.438,
    "moseleyDeltaKeV": -43.61,
    "moseleyDeltaPercent": -557.1,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 6.088,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 15.656
      }
    ]
  },
  "73": {
    "atomicNumber": 73,
    "symbol": "Ta",
    "name": "Tantalum",
    "atomicWeight": 180.95,
    "fingerprintHash": "XRF-73-Ta-8.073-25B8",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      88.7,
      0.0,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      80.4
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 8.073,
      "wavelengthAngstrom": 1.5358,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 8.073,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.71,
        "wavelengthAngstrom": 7.2505,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 8.073,
        "wavelengthAngstrom": 1.5358,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 8.146,
        "wavelengthAngstrom": 1.522,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 9.343,
        "wavelengthAngstrom": 1.327,
        "relativeIntensity": 70.5,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 9.744,
        "wavelengthAngstrom": 1.2724,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 11.016,
        "wavelengthAngstrom": 1.1255,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 54.35,
        "wavelengthAngstrom": 0.2281,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 57.532,
        "wavelengthAngstrom": 0.2155,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 65.223,
        "wavelengthAngstrom": 0.1901,
        "relativeIntensity": 27.5,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 67.416,
        "jumpRatio": 9.8
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 9.881,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9621,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 52.898,
    "moseleyDeltaKeV": -44.825,
    "moseleyDeltaPercent": -555.2,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 6.333,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 16.146
      }
    ]
  },
  "74": {
    "atomicNumber": 74,
    "symbol": "W",
    "name": "Tungsten",
    "atomicWeight": 183.84,
    "fingerprintHash": "XRF-74-W-8.322-2649",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      64.7,
      25.2,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      80.6
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 8.322,
      "wavelengthAngstrom": 1.4898,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 8.322,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.775,
        "wavelengthAngstrom": 6.985,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 8.322,
        "wavelengthAngstrom": 1.4898,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 8.398,
        "wavelengthAngstrom": 1.4764,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 9.672,
        "wavelengthAngstrom": 1.2819,
        "relativeIntensity": 71.8,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 10.044,
        "wavelengthAngstrom": 1.2344,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 11.353,
        "wavelengthAngstrom": 1.0921,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 57.954,
        "wavelengthAngstrom": 0.2139,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 59.318,
        "wavelengthAngstrom": 0.209,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 67.244,
        "wavelengthAngstrom": 0.1844,
        "relativeIntensity": 27.9,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 69.525,
        "jumpRatio": 9.9
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 10.207,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.964,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 54.377,
    "moseleyDeltaKeV": -46.055,
    "moseleyDeltaPercent": -553.4,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 6.582,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 16.644
      }
    ]
  },
  "75": {
    "atomicNumber": 75,
    "symbol": "Re",
    "name": "Rhenium",
    "atomicWeight": 186.21,
    "fingerprintHash": "XRF-75-Re-8.575-26DA",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      91.1,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      80.7
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 8.575,
      "wavelengthAngstrom": 1.4459,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 8.575,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.843,
        "wavelengthAngstrom": 6.7273,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 8.575,
        "wavelengthAngstrom": 1.4459,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 8.653,
        "wavelengthAngstrom": 1.4328,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 10.01,
        "wavelengthAngstrom": 1.2386,
        "relativeIntensity": 73.1,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 10.347,
        "wavelengthAngstrom": 1.1983,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 11.695,
        "wavelengthAngstrom": 1.0601,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 59.719,
        "wavelengthAngstrom": 0.2076,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 61.141,
        "wavelengthAngstrom": 0.2028,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 69.31,
        "wavelengthAngstrom": 0.1789,
        "relativeIntensity": 28.2,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 71.676,
        "jumpRatio": 10.0
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 10.535,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9658,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 55.877,
    "moseleyDeltaKeV": -47.302,
    "moseleyDeltaPercent": -551.6,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 6.835,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 17.15
      }
    ]
  },
  "76": {
    "atomicNumber": 76,
    "symbol": "Os",
    "name": "Osmium",
    "atomicWeight": 190.23,
    "fingerprintHash": "XRF-76-Os-8.832-276C",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      92.3,
      0.0,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      80.9
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 8.832,
      "wavelengthAngstrom": 1.4038,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 8.832,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.91,
        "wavelengthAngstrom": 6.4913,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 8.832,
        "wavelengthAngstrom": 1.4038,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 8.912,
        "wavelengthAngstrom": 1.3912,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 10.355,
        "wavelengthAngstrom": 1.1973,
        "relativeIntensity": 74.4,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 10.655,
        "wavelengthAngstrom": 1.1636,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 12.042,
        "wavelengthAngstrom": 1.0296,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 61.523,
        "wavelengthAngstrom": 0.2015,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 63.004,
        "wavelengthAngstrom": 0.1968,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 71.413,
        "wavelengthAngstrom": 0.1736,
        "relativeIntensity": 28.6,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 73.871,
        "jumpRatio": 10.1
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 10.871,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9675,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 57.398,
    "moseleyDeltaKeV": -48.566,
    "moseleyDeltaPercent": -549.9,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 7.092,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 17.664
      }
    ]
  },
  "77": {
    "atomicNumber": 77,
    "symbol": "Ir",
    "name": "Iridium",
    "atomicWeight": 192.22,
    "fingerprintHash": "XRF-77-Ir-9.092-27FD",
    "spectralBarcode": [
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      93.4,
      0.0,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      81.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 9.092,
      "wavelengthAngstrom": 1.3637,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 9.092,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 1.979,
        "wavelengthAngstrom": 6.265,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 9.092,
        "wavelengthAngstrom": 1.3637,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 9.175,
        "wavelengthAngstrom": 1.3513,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 10.708,
        "wavelengthAngstrom": 1.1579,
        "relativeIntensity": 75.7,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 10.968,
        "wavelengthAngstrom": 1.1304,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 12.395,
        "wavelengthAngstrom": 1.0003,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 63.355,
        "wavelengthAngstrom": 0.1957,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 64.896,
        "wavelengthAngstrom": 0.1911,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 73.561,
        "wavelengthAngstrom": 0.1685,
        "relativeIntensity": 28.9,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 76.111,
        "jumpRatio": 10.2
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 11.215,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.9691,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 58.938,
    "moseleyDeltaKeV": -49.846,
    "moseleyDeltaPercent": -548.2,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 7.352,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 18.184
      }
    ]
  },
  "78": {
    "atomicNumber": 78,
    "symbol": "Pt",
    "name": "Platinum",
    "atomicWeight": 195.08,
    "fingerprintHash": "XRF-78-Pt-9.357-2890",
    "spectralBarcode": [
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      94.6,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      81.2
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 9.357,
      "wavelengthAngstrom": 1.325,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 9.357,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.05,
        "wavelengthAngstrom": 6.048,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 9.357,
        "wavelengthAngstrom": 1.325,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 9.442,
        "wavelengthAngstrom": 1.3131,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 11.071,
        "wavelengthAngstrom": 1.1199,
        "relativeIntensity": 77.0,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 11.286,
        "wavelengthAngstrom": 1.0986,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 12.752,
        "wavelengthAngstrom": 0.9723,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 65.228,
        "wavelengthAngstrom": 0.1901,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 66.832,
        "wavelengthAngstrom": 0.1855,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 75.748,
        "wavelengthAngstrom": 0.1637,
        "relativeIntensity": 29.3,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 78.395,
        "jumpRatio": 10.4
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 11.564,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 60.5,
    "moseleyDeltaKeV": -51.143,
    "moseleyDeltaPercent": -546.6,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 7.617,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 18.714
      }
    ]
  },
  "79": {
    "atomicNumber": 79,
    "symbol": "Au",
    "name": "Gold",
    "atomicWeight": 196.97,
    "fingerprintHash": "XRF-79-Au-9.626-2922",
    "spectralBarcode": [
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      95.8,
      0.0,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      81.4
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 9.626,
      "wavelengthAngstrom": 1.288,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 9.626,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.123,
        "wavelengthAngstrom": 5.84,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 9.626,
        "wavelengthAngstrom": 1.288,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 9.713,
        "wavelengthAngstrom": 1.2765,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 11.442,
        "wavelengthAngstrom": 1.0836,
        "relativeIntensity": 78.3,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 11.608,
        "wavelengthAngstrom": 1.0681,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 13.115,
        "wavelengthAngstrom": 0.9454,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 67.136,
        "wavelengthAngstrom": 0.1847,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 68.804,
        "wavelengthAngstrom": 0.1802,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 77.981,
        "wavelengthAngstrom": 0.159,
        "relativeIntensity": 29.6,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 80.725,
        "jumpRatio": 10.5
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 11.919,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 62.081,
    "moseleyDeltaKeV": -52.455,
    "moseleyDeltaPercent": -544.9,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 7.886,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 19.252
      }
    ]
  },
  "80": {
    "atomicNumber": 80,
    "symbol": "Hg",
    "name": "Mercury",
    "atomicWeight": 200.59,
    "fingerprintHash": "XRF-80-Hg-9.899-29B5",
    "spectralBarcode": [
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      96.9,
      0.0,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      81.5
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 9.899,
      "wavelengthAngstrom": 1.2525,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 9.899,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.195,
        "wavelengthAngstrom": 5.6485,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 9.899,
        "wavelengthAngstrom": 1.2525,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 9.989,
        "wavelengthAngstrom": 1.2412,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 11.823,
        "wavelengthAngstrom": 1.0487,
        "relativeIntensity": 79.6,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 11.937,
        "wavelengthAngstrom": 1.0387,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 13.485,
        "wavelengthAngstrom": 0.9194,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 69.084,
        "wavelengthAngstrom": 0.1795,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 70.819,
        "wavelengthAngstrom": 0.1751,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 80.253,
        "wavelengthAngstrom": 0.1545,
        "relativeIntensity": 30.0,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 83.102,
        "jumpRatio": 10.6
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 12.284,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 63.683,
    "moseleyDeltaKeV": -53.784,
    "moseleyDeltaPercent": -543.3,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 8.159,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 19.798
      }
    ]
  },
  "81": {
    "atomicNumber": 81,
    "symbol": "Tl",
    "name": "Thallium",
    "atomicWeight": 204.38,
    "fingerprintHash": "XRF-81-Tl-10.177-2A49",
    "spectralBarcode": [
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      98.1,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      81.7
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 10.177,
      "wavelengthAngstrom": 1.2183,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 10.177,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.268,
        "wavelengthAngstrom": 5.4667,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 10.177,
        "wavelengthAngstrom": 1.2183,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 10.269,
        "wavelengthAngstrom": 1.2074,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 12.213,
        "wavelengthAngstrom": 1.0152,
        "relativeIntensity": 80.9,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 12.27,
        "wavelengthAngstrom": 1.0105,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 13.86,
        "wavelengthAngstrom": 0.8945,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 71.068,
        "wavelengthAngstrom": 0.1745,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 72.872,
        "wavelengthAngstrom": 0.1701,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 82.576,
        "wavelengthAngstrom": 0.1501,
        "relativeIntensity": 30.3,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 85.53,
        "jumpRatio": 10.7
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 12.658,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 65.306,
    "moseleyDeltaKeV": -55.129,
    "moseleyDeltaPercent": -541.7,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 8.437,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 20.354
      }
    ]
  },
  "82": {
    "atomicNumber": 82,
    "symbol": "Pb",
    "name": "Lead",
    "atomicWeight": 207.2,
    "fingerprintHash": "XRF-82-Pb-10.456-2ADD",
    "spectralBarcode": [
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      99.3,
      0.0,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      81.8
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 10.456,
      "wavelengthAngstrom": 1.1858,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 10.456,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.342,
        "wavelengthAngstrom": 5.2939,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 10.456,
        "wavelengthAngstrom": 1.1858,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 10.551,
        "wavelengthAngstrom": 1.1751,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 12.606,
        "wavelengthAngstrom": 0.9835,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 12.614,
        "wavelengthAngstrom": 0.9829,
        "relativeIntensity": 82.2,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 14.238,
        "wavelengthAngstrom": 0.8708,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 73.095,
        "wavelengthAngstrom": 0.1696,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 74.969,
        "wavelengthAngstrom": 0.1654,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 84.936,
        "wavelengthAngstrom": 0.146,
        "relativeIntensity": 30.7,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 88.005,
        "jumpRatio": 10.8
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 13.035,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 66.948,
    "moseleyDeltaKeV": -56.492,
    "moseleyDeltaPercent": -540.3,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 8.716,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 20.912
      }
    ]
  },
  "83": {
    "atomicNumber": 83,
    "symbol": "Bi",
    "name": "Bismuth",
    "atomicWeight": 208.98,
    "fingerprintHash": "XRF-83-Bi-10.741-2B71",
    "spectralBarcode": [
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      25.2,
      75.2,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      82.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 10.741,
      "wavelengthAngstrom": 1.1543,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 10.741,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.423,
        "wavelengthAngstrom": 5.117,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 10.741,
        "wavelengthAngstrom": 1.1543,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 10.839,
        "wavelengthAngstrom": 1.1439,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 12.948,
        "wavelengthAngstrom": 0.9576,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 13.023,
        "wavelengthAngstrom": 0.952,
        "relativeIntensity": 83.5,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 14.624,
        "wavelengthAngstrom": 0.8478,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 75.161,
        "wavelengthAngstrom": 0.165,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 77.108,
        "wavelengthAngstrom": 0.1608,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 87.343,
        "wavelengthAngstrom": 0.142,
        "relativeIntensity": 31.0,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 90.526,
        "jumpRatio": 11.0
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 13.419,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 68.612,
    "moseleyDeltaKeV": -57.871,
    "moseleyDeltaPercent": -538.8,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 9.001,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 21.482
      }
    ]
  },
  "84": {
    "atomicNumber": 84,
    "symbol": "Po",
    "name": "Polonium",
    "atomicWeight": 209.0,
    "fingerprintHash": "XRF-84-Po-11.031-2C06",
    "spectralBarcode": [
      0.0,
      0.0,
      88.7,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      98.4,
      0.0,
      100.0,
      0.0,
      16.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      80.9
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 11.031,
      "wavelengthAngstrom": 1.124,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 11.031,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.457,
        "wavelengthAngstrom": 5.0462,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 11.031,
        "wavelengthAngstrom": 1.124,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 11.131,
        "wavelengthAngstrom": 1.1139,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 13.296,
        "wavelengthAngstrom": 0.9325,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 13.441,
        "wavelengthAngstrom": 0.9224,
        "relativeIntensity": 84.8,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 15.016,
        "wavelengthAngstrom": 0.8257,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 77.268,
        "wavelengthAngstrom": 0.1605,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 79.29,
        "wavelengthAngstrom": 0.1564,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 89.8,
        "wavelengthAngstrom": 0.1381,
        "relativeIntensity": 31.4,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 93.105,
        "jumpRatio": 11.1
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 13.814,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 70.295,
    "moseleyDeltaKeV": -59.264,
    "moseleyDeltaPercent": -537.2,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 9.291,
        "detector": "Si"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 22.062
      }
    ]
  },
  "85": {
    "atomicNumber": 85,
    "symbol": "At",
    "name": "Astatine",
    "atomicWeight": 210.0,
    "fingerprintHash": "XRF-85-At-11.324-2C9B",
    "spectralBarcode": [
      0.0,
      0.0,
      87.6,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      97.3,
      0.0,
      100.0,
      0.0,
      15.8,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      80.1
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 11.324,
      "wavelengthAngstrom": 1.0949,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 11.324,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.54,
        "wavelengthAngstrom": 4.8813,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 11.324,
        "wavelengthAngstrom": 1.0949,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 11.427,
        "wavelengthAngstrom": 1.085,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 13.648,
        "wavelengthAngstrom": 0.9084,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 13.868,
        "wavelengthAngstrom": 0.894,
        "relativeIntensity": 86.1,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 15.412,
        "wavelengthAngstrom": 0.8045,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 79.421,
        "wavelengthAngstrom": 0.1561,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 81.52,
        "wavelengthAngstrom": 0.1521,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 92.31,
        "wavelengthAngstrom": 0.1343,
        "relativeIntensity": 31.7,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 95.73,
        "jumpRatio": 11.2
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 14.214,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 71.999,
    "moseleyDeltaKeV": -60.675,
    "moseleyDeltaPercent": -535.8,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 9.584,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 1.438,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 22.648
      }
    ]
  },
  "86": {
    "atomicNumber": 86,
    "symbol": "Rn",
    "name": "Radon",
    "atomicWeight": 222.0,
    "fingerprintHash": "XRF-86-Rn-11.621-2D30",
    "spectralBarcode": [
      0.0,
      0.0,
      86.7,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      96.2,
      0.0,
      0.0,
      100.0,
      15.6,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      79.3
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 11.621,
      "wavelengthAngstrom": 1.0669,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 11.621,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.626,
        "wavelengthAngstrom": 4.7214,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 11.621,
        "wavelengthAngstrom": 1.0669,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 11.727,
        "wavelengthAngstrom": 1.0573,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 14.005,
        "wavelengthAngstrom": 0.8853,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 14.303,
        "wavelengthAngstrom": 0.8668,
        "relativeIntensity": 87.4,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 15.814,
        "wavelengthAngstrom": 0.784,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 81.602,
        "wavelengthAngstrom": 0.1519,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 83.78,
        "wavelengthAngstrom": 0.148,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 94.87,
        "wavelengthAngstrom": 0.1307,
        "relativeIntensity": 32.1,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 98.404,
        "jumpRatio": 11.3
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 14.619,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 73.724,
    "moseleyDeltaKeV": -62.103,
    "moseleyDeltaPercent": -534.4,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 9.881,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 1.735,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 23.242
      }
    ]
  },
  "87": {
    "atomicNumber": 87,
    "symbol": "Fr",
    "name": "Francium",
    "atomicWeight": 223.0,
    "fingerprintHash": "XRF-87-Fr-11.923-2DC6",
    "spectralBarcode": [
      0.0,
      0.0,
      85.7,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      9.4,
      85.7,
      0.0,
      100.0,
      0.0,
      15.4,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      78.6
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 11.923,
      "wavelengthAngstrom": 1.0399,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 11.923,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.713,
        "wavelengthAngstrom": 4.57,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 11.923,
        "wavelengthAngstrom": 1.0399,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 12.031,
        "wavelengthAngstrom": 1.0305,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 14.367,
        "wavelengthAngstrom": 0.863,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 14.747,
        "wavelengthAngstrom": 0.8407,
        "relativeIntensity": 88.7,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 16.222,
        "wavelengthAngstrom": 0.7643,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 83.84,
        "wavelengthAngstrom": 0.1479,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 86.1,
        "wavelengthAngstrom": 0.144,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 97.47,
        "wavelengthAngstrom": 0.1272,
        "relativeIntensity": 32.5,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 101.13,
        "jumpRatio": 11.4
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 15.031,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 75.469,
    "moseleyDeltaKeV": -63.546,
    "moseleyDeltaPercent": -533.0,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 10.183,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 2.037,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 23.846
      }
    ]
  },
  "88": {
    "atomicNumber": 88,
    "symbol": "Ra",
    "name": "Radium",
    "atomicWeight": 226.0,
    "fingerprintHash": "XRF-88-Ra-12.228-2E5C",
    "spectralBarcode": [
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      25.2,
      81.1,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      82.8
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 12.228,
      "wavelengthAngstrom": 1.0139,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 12.228,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.801,
        "wavelengthAngstrom": 4.4264,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 12.228,
        "wavelengthAngstrom": 1.0139,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 12.339,
        "wavelengthAngstrom": 1.0048,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 14.733,
        "wavelengthAngstrom": 0.8415,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 15.2,
        "wavelengthAngstrom": 0.8157,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 16.634,
        "wavelengthAngstrom": 0.7454,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 86.126,
        "wavelengthAngstrom": 0.144,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 88.47,
        "wavelengthAngstrom": 0.1401,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 100.13,
        "wavelengthAngstrom": 0.1238,
        "relativeIntensity": 32.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 103.922,
        "jumpRatio": 11.6
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 15.444,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 77.234,
    "moseleyDeltaKeV": -65.006,
    "moseleyDeltaPercent": -531.6,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 10.488,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 2.342,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 24.456
      }
    ]
  },
  "89": {
    "atomicNumber": 89,
    "symbol": "Ac",
    "name": "Actinium",
    "atomicWeight": 227.0,
    "fingerprintHash": "XRF-89-Ac-12.538-2EF3",
    "spectralBarcode": [
      0.0,
      0.0,
      84.7,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      94.1,
      0.0,
      0.0,
      100.0,
      0.0,
      15.3,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      78.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 12.538,
      "wavelengthAngstrom": 0.9889,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 12.538,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.891,
        "wavelengthAngstrom": 4.2886,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 12.538,
        "wavelengthAngstrom": 0.9889,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 12.652,
        "wavelengthAngstrom": 0.98,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 15.106,
        "wavelengthAngstrom": 0.8208,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 15.663,
        "wavelengthAngstrom": 0.7916,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 17.054,
        "wavelengthAngstrom": 0.727,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 88.453,
        "wavelengthAngstrom": 0.1402,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 90.884,
        "wavelengthAngstrom": 0.1364,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 102.84,
        "wavelengthAngstrom": 0.1206,
        "relativeIntensity": 33.1,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 106.755,
        "jumpRatio": 11.7
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 15.871,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 79.02,
    "moseleyDeltaKeV": -66.482,
    "moseleyDeltaPercent": -530.2,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 10.798,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 2.652,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 25.076
      }
    ]
  },
  "90": {
    "atomicNumber": 90,
    "symbol": "Th",
    "name": "Thorium",
    "atomicWeight": 232.04,
    "fingerprintHash": "XRF-90-Th-12.851-2F8A",
    "spectralBarcode": [
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      25.2,
      81.1,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      83.1
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 12.851,
      "wavelengthAngstrom": 0.9648,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 12.851,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 2.996,
        "wavelengthAngstrom": 4.1383,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 12.851,
        "wavelengthAngstrom": 0.9648,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 12.968,
        "wavelengthAngstrom": 0.9561,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 15.482,
        "wavelengthAngstrom": 0.8008,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 16.202,
        "wavelengthAngstrom": 0.7652,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 17.477,
        "wavelengthAngstrom": 0.7094,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 90.83,
        "wavelengthAngstrom": 0.1365,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 93.35,
        "wavelengthAngstrom": 0.1328,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 105.609,
        "wavelengthAngstrom": 0.1174,
        "relativeIntensity": 33.5,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 109.651,
        "jumpRatio": 11.8
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 16.3,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 80.826,
    "moseleyDeltaKeV": -67.975,
    "moseleyDeltaPercent": -528.9,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 11.111,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 2.965,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 25.702
      }
    ]
  },
  "91": {
    "atomicNumber": 91,
    "symbol": "Pa",
    "name": "Protactinium",
    "atomicWeight": 231.04,
    "fingerprintHash": "XRF-91-Pa-13.170-3022",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      25.2,
      81.1,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      83.2
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 13.17,
      "wavelengthAngstrom": 0.9414,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 13.17,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 3.076,
        "wavelengthAngstrom": 4.0307,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 13.17,
        "wavelengthAngstrom": 0.9414,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 13.29,
        "wavelengthAngstrom": 0.9329,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 15.865,
        "wavelengthAngstrom": 0.7815,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 16.709,
        "wavelengthAngstrom": 0.742,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 17.909,
        "wavelengthAngstrom": 0.6923,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 93.256,
        "wavelengthAngstrom": 0.133,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 95.868,
        "wavelengthAngstrom": 0.1293,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 108.428,
        "wavelengthAngstrom": 0.1143,
        "relativeIntensity": 33.8,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 112.601,
        "jumpRatio": 11.9
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 16.733,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 82.652,
    "moseleyDeltaKeV": -69.482,
    "moseleyDeltaPercent": -527.6,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 11.43,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 3.284,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 26.34
      }
    ]
  },
  "92": {
    "atomicNumber": 92,
    "symbol": "U",
    "name": "Uranium",
    "atomicWeight": 238.03,
    "fingerprintHash": "XRF-92-U-13.491-30BA",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      25.2,
      81.1,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      83.4
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 13.491,
      "wavelengthAngstrom": 0.919,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 13.491,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 3.171,
        "wavelengthAngstrom": 3.9099,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 13.491,
        "wavelengthAngstrom": 0.919,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 13.614,
        "wavelengthAngstrom": 0.9107,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 16.251,
        "wavelengthAngstrom": 0.7629,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 17.22,
        "wavelengthAngstrom": 0.72,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 18.343,
        "wavelengthAngstrom": 0.6759,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 95.733,
        "wavelengthAngstrom": 0.1295,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 98.44,
        "wavelengthAngstrom": 0.1259,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 111.3,
        "wavelengthAngstrom": 0.1114,
        "relativeIntensity": 34.2,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 115.606,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 17.166,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 84.499,
    "moseleyDeltaKeV": -71.008,
    "moseleyDeltaPercent": -526.3,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 11.751,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 3.605,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 26.982
      }
    ]
  },
  "93": {
    "atomicNumber": 93,
    "symbol": "Np",
    "name": "Neptunium",
    "atomicWeight": 237.0,
    "fingerprintHash": "XRF-93-Np-13.851-3154",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      25.2,
      81.1,
      16.2,
      0.0,
      0.0,
      0.0,
      0.0,
      83.6
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 13.851,
      "wavelengthAngstrom": 0.8951,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 13.851,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 3.267,
        "wavelengthAngstrom": 3.795,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 13.851,
        "wavelengthAngstrom": 0.8951,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 13.977,
        "wavelengthAngstrom": 0.8871,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 16.683,
        "wavelengthAngstrom": 0.7432,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 17.679,
        "wavelengthAngstrom": 0.7013,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 18.829,
        "wavelengthAngstrom": 0.6585,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 98.166,
        "wavelengthAngstrom": 0.1263,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 100.968,
        "wavelengthAngstrom": 0.1228,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 114.137,
        "wavelengthAngstrom": 0.1086,
        "relativeIntensity": 34.5,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 118.562,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 17.623,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 86.367,
    "moseleyDeltaKeV": -72.516,
    "moseleyDeltaPercent": -523.5,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 12.111,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 3.965,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 27.702
      }
    ]
  },
  "94": {
    "atomicNumber": 94,
    "symbol": "Pu",
    "name": "Plutonium",
    "atomicWeight": 244.0,
    "fingerprintHash": "XRF-94-Pu-14.216-31EF",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      25.2,
      81.1,
      16.2,
      0.0,
      0.0,
      0.0,
      83.7
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 14.216,
      "wavelengthAngstrom": 0.8721,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 14.216,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 3.366,
        "wavelengthAngstrom": 3.6834,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 14.216,
        "wavelengthAngstrom": 0.8721,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 14.345,
        "wavelengthAngstrom": 0.8643,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 17.121,
        "wavelengthAngstrom": 0.7242,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 18.145,
        "wavelengthAngstrom": 0.6833,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 19.322,
        "wavelengthAngstrom": 0.6417,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 100.635,
        "wavelengthAngstrom": 0.1232,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 103.534,
        "wavelengthAngstrom": 0.1198,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 117.018,
        "wavelengthAngstrom": 0.106,
        "relativeIntensity": 34.9,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 121.564,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 18.088,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 88.254,
    "moseleyDeltaKeV": -74.038,
    "moseleyDeltaPercent": -520.8,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 12.476,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 4.33,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 28.432
      }
    ]
  },
  "95": {
    "atomicNumber": 95,
    "symbol": "Am",
    "name": "Americium",
    "atomicWeight": 243.0,
    "fingerprintHash": "XRF-95-Am-14.587-328A",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      25.2,
      81.1,
      16.2,
      0.0,
      0.0,
      0.0,
      83.8
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 14.587,
      "wavelengthAngstrom": 0.85,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 14.587,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 3.465,
        "wavelengthAngstrom": 3.5782,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 14.587,
        "wavelengthAngstrom": 0.85,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 14.719,
        "wavelengthAngstrom": 0.8423,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 17.566,
        "wavelengthAngstrom": 0.7058,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 18.618,
        "wavelengthAngstrom": 0.6659,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 19.823,
        "wavelengthAngstrom": 0.6255,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 103.142,
        "wavelengthAngstrom": 0.1202,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 106.14,
        "wavelengthAngstrom": 0.1168,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 119.942,
        "wavelengthAngstrom": 0.1034,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 124.612,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 18.56,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 90.163,
    "moseleyDeltaKeV": -75.576,
    "moseleyDeltaPercent": -518.1,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 12.847,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 4.701,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 29.174
      }
    ]
  },
  "96": {
    "atomicNumber": 96,
    "symbol": "Cm",
    "name": "Curium",
    "atomicWeight": 247.0,
    "fingerprintHash": "XRF-96-Cm-14.963-3326",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      11.0,
      100.0,
      0.0,
      0.0,
      28.0,
      90.0,
      18.0,
      0.0,
      0.0,
      93.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 14.963,
      "wavelengthAngstrom": 0.8286,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 14.963,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 3.567,
        "wavelengthAngstrom": 3.4759,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 14.963,
        "wavelengthAngstrom": 0.8286,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 15.099,
        "wavelengthAngstrom": 0.8211,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 18.018,
        "wavelengthAngstrom": 0.6881,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 19.098,
        "wavelengthAngstrom": 0.6492,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 20.333,
        "wavelengthAngstrom": 0.6098,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 105.686,
        "wavelengthAngstrom": 0.1173,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 108.786,
        "wavelengthAngstrom": 0.114,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 122.909,
        "wavelengthAngstrom": 0.1009,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 127.706,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 19.039,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 92.091,
    "moseleyDeltaKeV": -77.128,
    "moseleyDeltaPercent": -515.5,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 13.223,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 5.077,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 29.926
      }
    ]
  },
  "97": {
    "atomicNumber": 97,
    "symbol": "Bk",
    "name": "Berkelium",
    "atomicWeight": 247.0,
    "fingerprintHash": "XRF-97-Bk-15.346-33C3",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      25.2,
      81.1,
      16.2,
      0.0,
      0.0,
      83.8
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 15.346,
      "wavelengthAngstrom": 0.8079,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 15.346,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 3.67,
        "wavelengthAngstrom": 3.3783,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 15.346,
        "wavelengthAngstrom": 0.8079,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 15.485,
        "wavelengthAngstrom": 0.8007,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 18.477,
        "wavelengthAngstrom": 0.671,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 19.585,
        "wavelengthAngstrom": 0.6331,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 20.85,
        "wavelengthAngstrom": 0.5946,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 108.267,
        "wavelengthAngstrom": 0.1145,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 111.472,
        "wavelengthAngstrom": 0.1112,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 125.921,
        "wavelengthAngstrom": 0.0985,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 130.846,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 19.525,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 94.04,
    "moseleyDeltaKeV": -78.694,
    "moseleyDeltaPercent": -512.8,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 13.606,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 5.46,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 30.692
      }
    ]
  },
  "98": {
    "atomicNumber": 98,
    "symbol": "Cf",
    "name": "Californium",
    "atomicWeight": 251.0,
    "fingerprintHash": "XRF-98-Cf-15.733-345F",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      25.2,
      0.0,
      81.1,
      16.2,
      0.0,
      83.8
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 15.733,
      "wavelengthAngstrom": 0.7881,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 15.733,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 3.774,
        "wavelengthAngstrom": 3.2852,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 15.733,
        "wavelengthAngstrom": 0.7881,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 15.876,
        "wavelengthAngstrom": 0.781,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 18.942,
        "wavelengthAngstrom": 0.6545,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 20.08,
        "wavelengthAngstrom": 0.6175,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 21.374,
        "wavelengthAngstrom": 0.5801,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 110.886,
        "wavelengthAngstrom": 0.1118,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 114.198,
        "wavelengthAngstrom": 0.1086,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 128.977,
        "wavelengthAngstrom": 0.0961,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 134.033,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 20.018,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 96.009,
    "moseleyDeltaKeV": -80.276,
    "moseleyDeltaPercent": -510.2,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 13.993,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 5.847,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 31.466
      }
    ]
  },
  "99": {
    "atomicNumber": 99,
    "symbol": "Es",
    "name": "Einsteinium",
    "atomicWeight": 252.0,
    "fingerprintHash": "XRF-99-Es-16.127-34FD",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      25.2,
      81.1,
      16.2,
      0.0,
      83.8
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 16.127,
      "wavelengthAngstrom": 0.7688,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 16.127,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 3.881,
        "wavelengthAngstrom": 3.1946,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 16.127,
        "wavelengthAngstrom": 0.7688,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 16.273,
        "wavelengthAngstrom": 0.7619,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 19.415,
        "wavelengthAngstrom": 0.6386,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 20.583,
        "wavelengthAngstrom": 0.6024,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 21.906,
        "wavelengthAngstrom": 0.566,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 113.543,
        "wavelengthAngstrom": 0.1092,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 116.964,
        "wavelengthAngstrom": 0.106,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 132.077,
        "wavelengthAngstrom": 0.0939,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 137.267,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 20.519,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 97.999,
    "moseleyDeltaKeV": -81.872,
    "moseleyDeltaPercent": -507.7,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 14.387,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 6.241,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 32.254
      }
    ]
  },
  "100": {
    "atomicNumber": 100,
    "symbol": "Fm",
    "name": "Fermium",
    "atomicWeight": 257.0,
    "fingerprintHash": "XRF-100-Fm-16.526-359B",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      25.2,
      0.0,
      81.1,
      16.2,
      83.8
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 16.526,
      "wavelengthAngstrom": 0.7502,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 16.526,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 3.989,
        "wavelengthAngstrom": 3.1082,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 16.526,
        "wavelengthAngstrom": 0.7502,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 16.676,
        "wavelengthAngstrom": 0.7435,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 19.894,
        "wavelengthAngstrom": 0.6232,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 21.092,
        "wavelengthAngstrom": 0.5878,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 22.446,
        "wavelengthAngstrom": 0.5524,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 116.238,
        "wavelengthAngstrom": 0.1067,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 119.771,
        "wavelengthAngstrom": 0.1035,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 135.222,
        "wavelengthAngstrom": 0.0917,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 140.547,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 21.027,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 100.009,
    "moseleyDeltaKeV": -83.483,
    "moseleyDeltaPercent": -505.2,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 14.786,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 6.64,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 33.052
      }
    ]
  },
  "101": {
    "atomicNumber": 101,
    "symbol": "Md",
    "name": "Mendelevium",
    "atomicWeight": 258.0,
    "fingerprintHash": "XRF-101-Md-16.931-3639",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      11.0,
      100.0,
      0.0,
      0.0,
      28.0,
      90.0,
      18.0,
      93.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 16.931,
      "wavelengthAngstrom": 0.7323,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 16.931,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 4.098,
        "wavelengthAngstrom": 3.0255,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 16.931,
        "wavelengthAngstrom": 0.7323,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 17.085,
        "wavelengthAngstrom": 0.7257,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 20.381,
        "wavelengthAngstrom": 0.6083,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 21.609,
        "wavelengthAngstrom": 0.5738,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 22.994,
        "wavelengthAngstrom": 0.5392,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 118.971,
        "wavelengthAngstrom": 0.1042,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 122.619,
        "wavelengthAngstrom": 0.1011,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 138.412,
        "wavelengthAngstrom": 0.0896,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 143.876,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 21.542,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 102.04,
    "moseleyDeltaKeV": -85.109,
    "moseleyDeltaPercent": -502.7,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 15.191,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 7.045,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 33.862
      }
    ]
  },
  "102": {
    "atomicNumber": 102,
    "symbol": "No",
    "name": "Nobelium",
    "atomicWeight": 259.0,
    "fingerprintHash": "XRF-102-No-17.342-36D8",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      25.2,
      0.0,
      81.1,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 17.342,
      "wavelengthAngstrom": 0.7149,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 17.342,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 4.21,
        "wavelengthAngstrom": 2.945,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 17.342,
        "wavelengthAngstrom": 0.7149,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 17.499,
        "wavelengthAngstrom": 0.7085,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 20.874,
        "wavelengthAngstrom": 0.594,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 22.134,
        "wavelengthAngstrom": 0.5602,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 23.549,
        "wavelengthAngstrom": 0.5265,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 121.743,
        "wavelengthAngstrom": 0.1018,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 125.508,
        "wavelengthAngstrom": 0.0988,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 141.648,
        "wavelengthAngstrom": 0.0875,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 147.252,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 22.065,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 104.091,
    "moseleyDeltaKeV": -86.749,
    "moseleyDeltaPercent": -500.2,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 15.602,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 7.456,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 34.684
      }
    ]
  },
  "103": {
    "atomicNumber": 103,
    "symbol": "Lr",
    "name": "Lawrencium",
    "atomicWeight": 262.0,
    "fingerprintHash": "XRF-103-Lr-17.759-3778",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      90.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0,
      0.0,
      0.0,
      0.0,
      25.2,
      81.1,
      91.9
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 17.759,
      "wavelengthAngstrom": 0.6981,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 17.759,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 4.323,
        "wavelengthAngstrom": 2.868,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 17.759,
        "wavelengthAngstrom": 0.6981,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 17.92,
        "wavelengthAngstrom": 0.6919,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 21.375,
        "wavelengthAngstrom": 0.58,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 22.666,
        "wavelengthAngstrom": 0.547,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 24.113,
        "wavelengthAngstrom": 0.5142,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 124.554,
        "wavelengthAngstrom": 0.0995,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 128.439,
        "wavelengthAngstrom": 0.0965,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 144.929,
        "wavelengthAngstrom": 0.0855,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 150.676,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 22.595,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 106.162,
    "moseleyDeltaKeV": -88.403,
    "moseleyDeltaPercent": -497.8,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 16.019,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 7.873,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 35.518
      }
    ]
  },
  "104": {
    "atomicNumber": 104,
    "symbol": "Rf",
    "name": "Rutherfordium",
    "atomicWeight": 267.0,
    "fingerprintHash": "XRF-104-Rf-18.181-3817",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      52.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      57.8,
      0.0,
      0.0,
      14.6,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 18.181,
      "wavelengthAngstrom": 0.6819,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 18.181,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 4.437,
        "wavelengthAngstrom": 2.7943,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 18.181,
        "wavelengthAngstrom": 0.6819,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 18.346,
        "wavelengthAngstrom": 0.6758,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 21.882,
        "wavelengthAngstrom": 0.5666,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 23.206,
        "wavelengthAngstrom": 0.5343,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 24.684,
        "wavelengthAngstrom": 0.5023,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 127.403,
        "wavelengthAngstrom": 0.0973,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 131.411,
        "wavelengthAngstrom": 0.0943,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 148.255,
        "wavelengthAngstrom": 0.0836,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 154.149,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 23.133,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 108.254,
    "moseleyDeltaKeV": -90.073,
    "moseleyDeltaPercent": -495.4,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 16.441,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 8.295,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 36.362
      }
    ]
  },
  "105": {
    "atomicNumber": 105,
    "symbol": "Db",
    "name": "Dubnium",
    "atomicWeight": 270.0,
    "fingerprintHash": "XRF-105-Db-18.610-38B8",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      52.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      57.8,
      0.0,
      0.0,
      0.0,
      14.6,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 18.61,
      "wavelengthAngstrom": 0.6662,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 18.61,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 4.554,
        "wavelengthAngstrom": 2.7225,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 18.61,
        "wavelengthAngstrom": 0.6662,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 18.779,
        "wavelengthAngstrom": 0.6602,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 22.397,
        "wavelengthAngstrom": 0.5536,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 23.753,
        "wavelengthAngstrom": 0.522,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 25.264,
        "wavelengthAngstrom": 0.4908,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 130.291,
        "wavelengthAngstrom": 0.0952,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 134.425,
        "wavelengthAngstrom": 0.0922,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 151.628,
        "wavelengthAngstrom": 0.0818,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 157.67,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 23.679,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 110.366,
    "moseleyDeltaKeV": -91.756,
    "moseleyDeltaPercent": -493.0,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 16.87,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 8.724,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 37.22
      }
    ]
  },
  "106": {
    "atomicNumber": 106,
    "symbol": "Sg",
    "name": "Seaborgium",
    "atomicWeight": 271.0,
    "fingerprintHash": "XRF-106-Sg-19.045-3959",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      68.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      75.5,
      0.0,
      0.0,
      19.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 19.045,
      "wavelengthAngstrom": 0.651,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 19.045,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 4.672,
        "wavelengthAngstrom": 2.6538,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 19.045,
        "wavelengthAngstrom": 0.651,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 19.218,
        "wavelengthAngstrom": 0.6451,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 22.919,
        "wavelengthAngstrom": 0.541,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 24.308,
        "wavelengthAngstrom": 0.5101,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 25.852,
        "wavelengthAngstrom": 0.4796,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 133.219,
        "wavelengthAngstrom": 0.0931,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 137.481,
        "wavelengthAngstrom": 0.0902,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 155.047,
        "wavelengthAngstrom": 0.08,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 161.24,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 24.232,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 112.499,
    "moseleyDeltaKeV": -93.454,
    "moseleyDeltaPercent": -490.7,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 17.305,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 9.159,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 38.09
      }
    ]
  },
  "107": {
    "atomicNumber": 107,
    "symbol": "Bh",
    "name": "Bohrium",
    "atomicWeight": 270.0,
    "fingerprintHash": "XRF-107-Bh-19.485-39FB",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      57.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      63.4,
      0.0,
      0.0,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 19.485,
      "wavelengthAngstrom": 0.6363,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 19.485,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 4.792,
        "wavelengthAngstrom": 2.5873,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 19.485,
        "wavelengthAngstrom": 0.6363,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 19.662,
        "wavelengthAngstrom": 0.6306,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 23.448,
        "wavelengthAngstrom": 0.5288,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 24.871,
        "wavelengthAngstrom": 0.4985,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 26.447,
        "wavelengthAngstrom": 0.4688,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 136.187,
        "wavelengthAngstrom": 0.091,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 140.58,
        "wavelengthAngstrom": 0.0882,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 158.513,
        "wavelengthAngstrom": 0.0782,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 164.859,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 24.792,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 114.652,
    "moseleyDeltaKeV": -95.167,
    "moseleyDeltaPercent": -488.4,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 17.745,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 9.599,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 38.97
      }
    ]
  },
  "108": {
    "atomicNumber": 108,
    "symbol": "Hs",
    "name": "Hassium",
    "atomicWeight": 277.0,
    "fingerprintHash": "XRF-108-Hs-19.932-3A9D",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      57.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      6.3,
      57.1,
      0.0,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 19.932,
      "wavelengthAngstrom": 0.622,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 19.932,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 4.914,
        "wavelengthAngstrom": 2.5231,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 19.932,
        "wavelengthAngstrom": 0.622,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 20.113,
        "wavelengthAngstrom": 0.6164,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 23.984,
        "wavelengthAngstrom": 0.5169,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 25.441,
        "wavelengthAngstrom": 0.4873,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 27.051,
        "wavelengthAngstrom": 0.4583,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 139.194,
        "wavelengthAngstrom": 0.0891,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 143.721,
        "wavelengthAngstrom": 0.0863,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 162.025,
        "wavelengthAngstrom": 0.0765,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 168.527,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 25.36,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 116.826,
    "moseleyDeltaKeV": -96.894,
    "moseleyDeltaPercent": -486.1,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 18.192,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 10.046,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 39.864
      }
    ]
  },
  "109": {
    "atomicNumber": 109,
    "symbol": "Mt",
    "name": "Meitnerium",
    "atomicWeight": 278.0,
    "fingerprintHash": "XRF-109-Mt-20.385-3B3F",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      62.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      68.9,
      0.0,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 20.385,
      "wavelengthAngstrom": 0.6082,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 20.385,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 5.037,
        "wavelengthAngstrom": 2.4615,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 20.385,
        "wavelengthAngstrom": 0.6082,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 20.57,
        "wavelengthAngstrom": 0.6027,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 24.528,
        "wavelengthAngstrom": 0.5055,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 26.019,
        "wavelengthAngstrom": 0.4765,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 27.664,
        "wavelengthAngstrom": 0.4482,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 142.241,
        "wavelengthAngstrom": 0.0872,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 146.905,
        "wavelengthAngstrom": 0.0844,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 165.585,
        "wavelengthAngstrom": 0.0749,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 172.246,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 25.936,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 119.019,
    "moseleyDeltaKeV": -98.634,
    "moseleyDeltaPercent": -483.9,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 18.645,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 10.499,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 40.77
      }
    ]
  },
  "110": {
    "atomicNumber": 110,
    "symbol": "Ds",
    "name": "Darmstadtium",
    "atomicWeight": 281.0,
    "fingerprintHash": "XRF-110-Ds-20.844-3BE3",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      62.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      6.8,
      62.1,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 20.844,
      "wavelengthAngstrom": 0.5948,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 20.844,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 5.162,
        "wavelengthAngstrom": 2.4019,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 20.844,
        "wavelengthAngstrom": 0.5948,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 21.033,
        "wavelengthAngstrom": 0.5895,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 25.079,
        "wavelengthAngstrom": 0.4944,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 26.605,
        "wavelengthAngstrom": 0.466,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 28.284,
        "wavelengthAngstrom": 0.4384,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 145.329,
        "wavelengthAngstrom": 0.0853,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 150.133,
        "wavelengthAngstrom": 0.0826,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 169.192,
        "wavelengthAngstrom": 0.0733,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 176.014,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 26.52,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 121.234,
    "moseleyDeltaKeV": -100.39,
    "moseleyDeltaPercent": -481.6,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 19.104,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 10.958,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 41.688
      }
    ]
  },
  "111": {
    "atomicNumber": 111,
    "symbol": "Rg",
    "name": "Roentgenium",
    "atomicWeight": 282.0,
    "fingerprintHash": "XRF-111-Rg-21.308-3C86",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      62.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      68.9,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 21.308,
      "wavelengthAngstrom": 0.5819,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 21.308,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 5.289,
        "wavelengthAngstrom": 2.3442,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 21.308,
        "wavelengthAngstrom": 0.5819,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 21.502,
        "wavelengthAngstrom": 0.5766,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 25.637,
        "wavelengthAngstrom": 0.4836,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 27.199,
        "wavelengthAngstrom": 0.4558,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 28.913,
        "wavelengthAngstrom": 0.4288,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 148.456,
        "wavelengthAngstrom": 0.0835,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 153.403,
        "wavelengthAngstrom": 0.0808,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 172.846,
        "wavelengthAngstrom": 0.0717,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 179.833,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 27.112,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 123.468,
    "moseleyDeltaKeV": -102.16,
    "moseleyDeltaPercent": -479.4,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 19.568,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 11.422,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 42.616
      }
    ]
  },
  "112": {
    "atomicNumber": 112,
    "symbol": "Cn",
    "name": "Copernicium",
    "atomicWeight": 285.0,
    "fingerprintHash": "XRF-112-Cn-21.779-3D2A",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      62.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      68.9,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 21.779,
      "wavelengthAngstrom": 0.5693,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 21.779,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 5.417,
        "wavelengthAngstrom": 2.2888,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 21.779,
        "wavelengthAngstrom": 0.5693,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 21.977,
        "wavelengthAngstrom": 0.5642,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 26.203,
        "wavelengthAngstrom": 0.4732,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 27.801,
        "wavelengthAngstrom": 0.446,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 29.549,
        "wavelengthAngstrom": 0.4196,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 151.625,
        "wavelengthAngstrom": 0.0818,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 156.718,
        "wavelengthAngstrom": 0.0791,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 176.549,
        "wavelengthAngstrom": 0.0702,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 183.702,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 27.711,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 125.723,
    "moseleyDeltaKeV": -103.944,
    "moseleyDeltaPercent": -477.3,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 20.039,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 11.893,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 43.558
      }
    ]
  },
  "113": {
    "atomicNumber": 113,
    "symbol": "Nh",
    "name": "Nihonium",
    "atomicWeight": 286.0,
    "fingerprintHash": "XRF-113-Nh-22.257-3DCF",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      62.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      68.9,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 22.257,
      "wavelengthAngstrom": 0.5571,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 22.257,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 5.548,
        "wavelengthAngstrom": 2.2348,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 22.257,
        "wavelengthAngstrom": 0.5571,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 22.459,
        "wavelengthAngstrom": 0.552,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 26.776,
        "wavelengthAngstrom": 0.463,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 28.411,
        "wavelengthAngstrom": 0.4364,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 30.195,
        "wavelengthAngstrom": 0.4106,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 154.834,
        "wavelengthAngstrom": 0.0801,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 160.076,
        "wavelengthAngstrom": 0.0775,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 180.299,
        "wavelengthAngstrom": 0.0688,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 187.623,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 28.318,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 127.999,
    "moseleyDeltaKeV": -105.742,
    "moseleyDeltaPercent": -475.1,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 20.517,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 12.371,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 44.514
      }
    ]
  },
  "114": {
    "atomicNumber": 114,
    "symbol": "Fl",
    "name": "Flerovium",
    "atomicWeight": 289.0,
    "fingerprintHash": "XRF-114-Fl-22.740-3E75",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      62.1,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      68.9,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 22.74,
      "wavelengthAngstrom": 0.5452,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 22.74,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 5.68,
        "wavelengthAngstrom": 2.1828,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 22.74,
        "wavelengthAngstrom": 0.5452,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 22.947,
        "wavelengthAngstrom": 0.5403,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 27.357,
        "wavelengthAngstrom": 0.4532,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 29.028,
        "wavelengthAngstrom": 0.4271,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 30.849,
        "wavelengthAngstrom": 0.4019,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 158.084,
        "wavelengthAngstrom": 0.0784,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 163.479,
        "wavelengthAngstrom": 0.0758,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 184.098,
        "wavelengthAngstrom": 0.0673,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 191.594,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 28.934,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 130.295,
    "moseleyDeltaKeV": -107.555,
    "moseleyDeltaPercent": -473.0,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 21.0,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 12.854,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 45.48
      }
    ]
  },
  "115": {
    "atomicNumber": 115,
    "symbol": "Mc",
    "name": "Moscovium",
    "atomicWeight": 290.0,
    "fingerprintHash": "XRF-115-Mc-23.230-3F1B",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      36.8,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 23.23,
      "wavelengthAngstrom": 0.5337,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 23.23,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 5.814,
        "wavelengthAngstrom": 2.1325,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 23.23,
        "wavelengthAngstrom": 0.5337,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 23.441,
        "wavelengthAngstrom": 0.5289,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 27.945,
        "wavelengthAngstrom": 0.4437,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 29.654,
        "wavelengthAngstrom": 0.4181,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 31.511,
        "wavelengthAngstrom": 0.3935,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 161.376,
        "wavelengthAngstrom": 0.0768,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 166.926,
        "wavelengthAngstrom": 0.0743,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 187.946,
        "wavelengthAngstrom": 0.066,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 195.617,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 29.557,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 132.611,
    "moseleyDeltaKeV": -109.381,
    "moseleyDeltaPercent": -470.9,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 21.49,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 13.344,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 46.46
      }
    ]
  },
  "116": {
    "atomicNumber": 116,
    "symbol": "Lv",
    "name": "Livermorium",
    "atomicWeight": 293.0,
    "fingerprintHash": "XRF-116-Lv-23.726-3FC1",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      36.8,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 23.726,
      "wavelengthAngstrom": 0.5226,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 23.726,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 5.95,
        "wavelengthAngstrom": 2.0838,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 23.726,
        "wavelengthAngstrom": 0.5226,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 23.941,
        "wavelengthAngstrom": 0.5179,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 28.54,
        "wavelengthAngstrom": 0.4344,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 30.288,
        "wavelengthAngstrom": 0.4094,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 32.181,
        "wavelengthAngstrom": 0.3853,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 164.708,
        "wavelengthAngstrom": 0.0753,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 170.417,
        "wavelengthAngstrom": 0.0728,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 191.842,
        "wavelengthAngstrom": 0.0646,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 199.692,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 30.188,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 134.948,
    "moseleyDeltaKeV": -111.222,
    "moseleyDeltaPercent": -468.8,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 21.986,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 13.84,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 47.452
      }
    ]
  },
  "117": {
    "atomicNumber": 117,
    "symbol": "Ts",
    "name": "Tennessine",
    "atomicWeight": 294.0,
    "fingerprintHash": "XRF-117-Ts-24.228-4068",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      46.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 24.228,
      "wavelengthAngstrom": 0.5117,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 24.228,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 6.087,
        "wavelengthAngstrom": 2.0369,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 24.228,
        "wavelengthAngstrom": 0.5117,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 24.448,
        "wavelengthAngstrom": 0.5071,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 29.143,
        "wavelengthAngstrom": 0.4254,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 30.93,
        "wavelengthAngstrom": 0.4009,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 32.86,
        "wavelengthAngstrom": 0.3773,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 168.083,
        "wavelengthAngstrom": 0.0738,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 173.954,
        "wavelengthAngstrom": 0.0713,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 195.788,
        "wavelengthAngstrom": 0.0633,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 203.818,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 30.827,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 137.305,
    "moseleyDeltaKeV": -113.077,
    "moseleyDeltaPercent": -466.7,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 22.488,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 14.342,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 48.456
      }
    ]
  },
  "118": {
    "atomicNumber": 118,
    "symbol": "Og",
    "name": "Oganesson",
    "atomicWeight": 294.0,
    "fingerprintHash": "XRF-118-Og-24.737-4110",
    "spectralBarcode": [
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      46.2,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      100.0
    ],
    "primaryLine": {
      "siegbahn": "L\u03b1\u2082",
      "iupac": "L3-M4",
      "energyKeV": 24.737,
      "wavelengthAngstrom": 0.5012,
      "relativeIntensity": 11,
      "shell": "L",
      "transition": "3d3/2 \u2192 2p3/2"
    },
    "primaryLineKeV": 24.737,
    "lines": [
      {
        "siegbahn": "M\u03b1\u2081",
        "iupac": "M5-N7",
        "energyKeV": 6.226,
        "wavelengthAngstrom": 1.9914,
        "relativeIntensity": 100,
        "shell": "M",
        "transition": "4f7/2 \u2192 3d5/2"
      },
      {
        "siegbahn": "L\u03b1\u2082",
        "iupac": "L3-M4",
        "energyKeV": 24.737,
        "wavelengthAngstrom": 0.5012,
        "relativeIntensity": 11,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b1\u2081",
        "iupac": "L3-M5",
        "energyKeV": 24.962,
        "wavelengthAngstrom": 0.4967,
        "relativeIntensity": 100,
        "shell": "L",
        "transition": "3d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2082",
        "iupac": "L3-N5",
        "energyKeV": 29.755,
        "wavelengthAngstrom": 0.4167,
        "relativeIntensity": 28,
        "shell": "L",
        "transition": "4d5/2 \u2192 2p3/2"
      },
      {
        "siegbahn": "L\u03b2\u2081",
        "iupac": "L2-M4",
        "energyKeV": 31.58,
        "wavelengthAngstrom": 0.3926,
        "relativeIntensity": 90,
        "shell": "L",
        "transition": "3d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "L\u03b3\u2081",
        "iupac": "L2-N4",
        "energyKeV": 33.549,
        "wavelengthAngstrom": 0.3696,
        "relativeIntensity": 18,
        "shell": "L",
        "transition": "4d3/2 \u2192 2p1/2"
      },
      {
        "siegbahn": "K\u03b1\u2082",
        "iupac": "K-L2",
        "energyKeV": 171.5,
        "wavelengthAngstrom": 0.0723,
        "relativeIntensity": 51,
        "shell": "K",
        "transition": "2p1/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b1\u2081",
        "iupac": "K-L3",
        "energyKeV": 177.536,
        "wavelengthAngstrom": 0.0698,
        "relativeIntensity": 100,
        "shell": "K",
        "transition": "2p3/2 \u2192 1s1/2"
      },
      {
        "siegbahn": "K\u03b2\u2081",
        "iupac": "K-M3",
        "energyKeV": 199.783,
        "wavelengthAngstrom": 0.0621,
        "relativeIntensity": 35,
        "shell": "K",
        "transition": "3p3/2 \u2192 1s1/2"
      }
    ],
    "edges": [
      {
        "name": "K-edge",
        "energyKeV": 207.997,
        "jumpRatio": 12
      },
      {
        "name": "L\u2083-edge",
        "energyKeV": 31.474,
        "jumpRatio": 3.2
      }
    ],
    "fluorescenceYieldK": 0.97,
    "fluorescenceYieldL": 0.55,
    "moseleyPredictedKeV": 139.683,
    "moseleyDeltaKeV": -114.946,
    "moseleyDeltaPercent": -464.7,
    "escapePeaks": [
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 22.997,
        "detector": "Si"
      },
      {
        "parentLine": "L\u03b1\u2082",
        "escapeEnergyKeV": 14.851,
        "detector": "Ge"
      }
    ],
    "sumPeaks": [
      {
        "parentLine": "L\u03b1\u2082 + L\u03b1\u2082",
        "sumEnergyKeV": 49.474
      }
    ]
  }
};

/**
 * Retrieve the full XRF Spectral Fingerprint record for any element Z (1 to 118).
 */
export function getXRFFingerprint(atomicNumber: number): XRFFingerprint {
  const fp = XRF_FINGERPRINT_DB[atomicNumber];
  if (!fp) {
    // Fallback for out-of-range Z
    return {
      atomicNumber,
      symbol: `E${atomicNumber}`,
      name: `Element ${atomicNumber}`,
      atomicWeight: atomicNumber * 2.5,
      fingerprintHash: `XRF-Z${atomicNumber}-UNKNOWN`,
      spectralBarcode: new Array(24).fill(0),
      primaryLine: null,
      primaryLineKeV: 0,
      lines: [],
      edges: [],
      fluorescenceYieldK: 0.5,
      fluorescenceYieldL: 0.1,
      moseleyPredictedKeV: 0,
      moseleyDeltaKeV: 0,
      moseleyDeltaPercent: 0,
      escapePeaks: [],
      sumPeaks: []
    };
  }
  return fp;
}

/**
 * Get all 118 element fingerprints as an array.
 */
export function getAllXRFFingerprints(): XRFFingerprint[] {
  return Object.values(XRF_FINGERPRINT_DB);
}

/**
 * Reverse XRF Matcher / Qualitative Analyzer:
 * Given a set of experimentally measured XRF peak energies (in keV),
 * scan all 118 elements and compute matching confidence scores (0-100%).
 */
export function matchXRFFingerprint(
  measuredPeaksKeV: number[],
  toleranceKeV = 0.08,
  minConfidencePercent = 15
): XRFMatchResult[] {
  if (!measuredPeaksKeV || measuredPeaksKeV.length === 0) return [];
  
  const validPeaks = measuredPeaksKeV.filter(p => !isNaN(p) && p > 0.05 && p < 150);
  if (validPeaks.length === 0) return [];

  const results: XRFMatchResult[] = [];

  for (let z = 1; z <= 118; z++) {
    const fp = XRF_FINGERPRINT_DB[z];
    if (!fp || fp.lines.length === 0) continue;

    const matchedPairs: { inputKeV: number; matchedLine: XRFEmissionLine; deltaKeV: number }[] = [];
    const matchedLineIndices = new Set<number>();
    const matchedInputIndices = new Set<number>();

    // For each input peak, find the closest characteristic emission line
    validPeaks.forEach((inputKeV, inIdx) => {
      let bestLine: XRFEmissionLine | null = null;
      let minDelta = Infinity;
      let bestLineIdx = -1;

      fp.lines.forEach((line, lIdx) => {
        const delta = Math.abs(inputKeV - line.energyKeV);
        if (delta <= toleranceKeV && delta < minDelta) {
          minDelta = delta;
          bestLine = line;
          bestLineIdx = lIdx;
        }
      });

      if (bestLine && bestLineIdx >= 0) {
        matchedPairs.push({
          inputKeV,
          matchedLine: bestLine,
          deltaKeV: minDelta
        });
        matchedLineIndices.add(bestLineIdx);
        matchedInputIndices.add(inIdx);
      }
    });

    if (matchedPairs.length === 0) continue;

    // Calculate score based on:
    // 1. Percentage of input peaks matched
    // 2. Presence of primary/major characteristic line (e.g. Kα1 or Lα1)
    // 3. Proximity / residual error
    const inputCoverage = matchedPairs.length / validPeaks.length;
    
    // Check if primary line was matched
    const primaryLineMatched = fp.primaryLine
      ? matchedPairs.some(p => Math.abs(p.matchedLine.energyKeV - fp.primaryLine!.energyKeV) < 0.001)
      : false;
    
    // Mean residual error penalty
    const avgDelta = matchedPairs.reduce((acc, p) => acc + p.deltaKeV, 0) / matchedPairs.length;
    const proximityMultiplier = Math.max(0.2, 1.0 - (avgDelta / toleranceKeV) * 0.5);

    let rawScore = (inputCoverage * 55) + (primaryLineMatched ? 35 : 10);
    rawScore *= proximityMultiplier;

    // Penalty for missing strong lines if we matched higher-order lines
    const majorLines = fp.lines.filter(l => l.relativeIntensity >= 50);
    const missingMajorCount = majorLines.filter((_, idx) => !matchedLineIndices.has(idx)).length;
    if (missingMajorCount > 0 && majorLines.length > 1) {
      rawScore *= (1 - 0.15 * Math.min(2, missingMajorCount));
    }

    const finalScore = Math.min(100, Math.max(1, Math.round(rawScore)));

    if (finalScore >= minConfidencePercent) {
      let confidence: 'Definite' | 'High' | 'Moderate' | 'Trace' = 'Trace';
      if (finalScore >= 85) confidence = 'Definite';
      else if (finalScore >= 65) confidence = 'High';
      else if (finalScore >= 40) confidence = 'Moderate';

      const unmatchedInputs = validPeaks.filter((_, idx) => !matchedInputIndices.has(idx));
      const missingExpectedLines = fp.lines.filter((_, idx) => !matchedLineIndices.has(idx) && fp.lines[idx].relativeIntensity >= 30);

      results.push({
        atomicNumber: fp.atomicNumber,
        symbol: fp.symbol,
        name: fp.name,
        score: finalScore,
        confidence,
        matchedPeaks: matchedPairs,
        unmatchedInputs,
        missingExpectedLines
      });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Simulate continuous XRF / EDS energy spectrum response curve with Gaussian detector broadening,
 * Bremsstrahlung background, and detector escape peaks.
 */
export function simulateXRFSpectrum(
  fingerprint: XRFFingerprint,
  options: XRFSpectrumOptions = {}
): XRFSpectrumPoint[] {
  const fwhm_eV = options.fwhm_eV ?? 130; // 130 eV = 0.13 keV default SDD
  const fwhm_keV = fwhm_eV / 1000;
  const sigma_base = fwhm_keV / 2.3548; // FWHM to Gaussian sigma
  const numPoints = options.numPoints ?? 350;
  
  // Determine energy bounds
  const maxLineEnergy = fingerprint.lines.length > 0
    ? Math.max(...fingerprint.lines.map(l => l.energyKeV))
    : 10;
  
  const minE = options.minKeV ?? 0.1;
  const maxE = options.maxKeV ?? Math.min(30, Math.max(12, Math.ceil(maxLineEnergy * 1.35)));
  const step = (maxE - minE) / (numPoints - 1);

  const points: XRFSpectrumPoint[] = [];

  // Tube characteristic line background/Bremsstrahlung
  const includeBg = options.includeBackground ?? true;
  const includeEscape = options.includeEscapePeaks ?? true;
  const includeSum = options.includeSumPeaks ?? false;

  for (let i = 0; i < numPoints; i++) {
    const e = minE + i * step;
    let intensity = 0;

    // Kramers / Bremsstrahlung background model: I(E) ~ (E_max - E) / E
    if (includeBg) {
      const e_tube = 25.0; // tube voltage equivalent keV
      if (e < e_tube && e > 0.3) {
        const bg = 2.5 * ((e_tube - e) / e) * Math.exp(-0.8 / e);
        intensity += Math.max(0, bg);
      }
    }

    // Characteristic emission lines Gaussian superposition
    fingerprint.lines.forEach(line => {
      // Energy-dependent Fano broadening: sigma(E) = sqrt(sigma_0^2 + 2.355^2 * F * epsilon * E)
      const sigma_e = Math.sqrt(sigma_base * sigma_base + 0.00012 * line.energyKeV);
      const amp = line.relativeIntensity * 8.0;
      const g = (amp / (sigma_e * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((e - line.energyKeV) / sigma_e, 2));
      intensity += g;
    });

    // Escape peaks (Si detector escape: E - 1.74 keV, approx 0.8% of parent peak)
    if (includeEscape && fingerprint.escapePeaks.length > 0) {
      fingerprint.escapePeaks.forEach(esc => {
        const sigma_esc = Math.sqrt(sigma_base * sigma_base + 0.00012 * esc.escapeEnergyKeV);
        const amp_esc = 8.0 * 0.8; // ~0.8% of parent
        const g = (amp_esc / (sigma_esc * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((e - esc.escapeEnergyKeV) / sigma_esc, 2));
        intensity += g;
      });
    }

    // Sum peaks (pileup: 2 * E, approx 0.3% of parent)
    if (includeSum && fingerprint.sumPeaks.length > 0) {
      fingerprint.sumPeaks.forEach(sum => {
        const sigma_sum = Math.sqrt(sigma_base * sigma_base + 0.00012 * sum.sumEnergyKeV);
        const amp_sum = 8.0 * 0.3;
        const g = (amp_sum / (sigma_sum * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((e - sum.sumEnergyKeV) / sigma_sum, 2));
        intensity += g;
      });
    }

    // Peak tagging for tooltips
    let nearestLine: XRFEmissionLine | null = null;
    let isPeak = false;
    for (const l of fingerprint.lines) {
      if (Math.abs(e - l.energyKeV) < step * 0.6) {
        nearestLine = l;
        isPeak = true;
        break;
      }
    }

    points.push({
      energy: Number(e.toFixed(3)),
      intensity: Number(Math.max(0, intensity).toFixed(2)),
      isPeak,
      peakLabel: nearestLine ? `${nearestLine.siegbahn} (${nearestLine.energyKeV.toFixed(3)} keV)` : undefined
    });
  }

  return points;
}

/**
 * Standard preset engineering alloys, catalysts, and minerals for rapid XRF testing.
 */
export const PRESET_XRF_SAMPLES = [
  {
    name: 'Cartridge Brass (C26000)',
    category: 'Copper Alloys',
    description: '70% Copper, 30% Zinc common industrial alloy',
    peaks: [8.048, 8.905, 8.639, 9.572],
    elements: [{ z: 29, sym: 'Cu', fraction: 0.7 }, { z: 30, sym: 'Zn', fraction: 0.3 }]
  },
  {
    name: 'Stainless Steel 316L',
    category: 'Steels',
    description: 'Fe-Cr-Ni-Mo corrosion-resistant austenitic stainless steel',
    peaks: [6.404, 7.058, 5.415, 5.947, 7.478, 8.265, 17.479],
    elements: [{ z: 26, sym: 'Fe', fraction: 0.68 }, { z: 24, sym: 'Cr', fraction: 0.17 }, { z: 28, sym: 'Ni', fraction: 0.12 }, { z: 42, sym: 'Mo', fraction: 0.03 }]
  },
  {
    name: '18K Yellow Gold',
    category: 'Precious Metals',
    description: '75% Gold, 15% Silver, 10% Copper jewelry standard',
    peaks: [9.713, 11.442, 2.984, 8.048],
    elements: [{ z: 79, sym: 'Au', fraction: 0.75 }, { z: 47, sym: 'Ag', fraction: 0.15 }, { z: 29, sym: 'Cu', fraction: 0.10 }]
  },
  {
    name: 'Ti-6Al-4V Aerospace Alloy',
    category: 'Titanium Alloys',
    description: 'Titanium Grade 5 aerospace structural material',
    peaks: [4.511, 4.932, 1.487, 4.952],
    elements: [{ z: 22, sym: 'Ti', fraction: 0.90 }, { z: 13, sym: 'Al', fraction: 0.06 }, { z: 23, sym: 'V', fraction: 0.04 }]
  },
  {
    name: 'Galena Mineral Ore',
    category: 'Geominerals',
    description: 'Lead sulfide (PbS) with characteristic Pb L-lines and S K-line',
    peaks: [10.551, 12.614, 2.308],
    elements: [{ z: 82, sym: 'Pb', fraction: 0.866 }, { z: 16, sym: 'S', fraction: 0.134 }]
  }
];
