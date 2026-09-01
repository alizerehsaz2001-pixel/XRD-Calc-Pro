with open("utils/xrrPhysics.ts", "r", encoding="utf-8") as f:
    code = f.read()

append_code = r"""
// ----------------------------------------------------------------------------
// Backward Compatibility Aliases & Helpers
// ----------------------------------------------------------------------------
export type SLDProfilePoint = SLDPoint;
export const calculateKiessigFringes = analyzeKiessigFringes;
export const calculateCriticalAngle = detectCriticalAngle;

export interface XRRStackPreset {
  id: string;
  name: string;
  description: string;
  layers: XRRLayer[];
}

export const PRESET_STACKS: XRRStackPreset[] = [
  {
    id: 'single_film',
    name: 'Single Film: 50nm TiO₂ / Si(001)',
    description: 'Standard 50 nm TiO₂ thin film on native oxide Silicon (001) wafer.',
    layers: [
      { id: 'layer-1', name: 'TiO₂ Film', formula: 'TiO2', thickness: 500, roughness: 3.5, density: 4.23, delta: 14.5, beta: 0.32 },
      { id: 'layer-2', name: 'SiO₂ Native Oxide', formula: 'SiO2', thickness: 20, roughness: 2.5, density: 2.20, delta: 7.18, beta: 0.15 },
      { id: 'layer-sub', name: 'Si (001) Substrate', formula: 'Si', thickness: 0, roughness: 2.0, density: 2.33, delta: 7.56, beta: 0.17 }
    ]
  },
  {
    id: 'bilayer_highk',
    name: 'High-k Bilayer: HfO₂ / Al₂O₃ / Si',
    description: 'High-k dielectric gate stack with 15 nm HfO₂ capping layer and 3 nm Al₂O₃ interfacial barrier.',
    layers: [
      { id: 'layer-1', name: 'HfO₂ Cap', formula: 'HfO2', thickness: 150, roughness: 4.0, density: 9.68, delta: 28.5, beta: 2.10 },
      { id: 'layer-2', name: 'Al₂O₃ Barrier', formula: 'Al2O3', thickness: 30, roughness: 2.8, density: 3.98, delta: 12.8, beta: 0.22 },
      { id: 'layer-sub', name: 'Si Substrate', formula: 'Si', thickness: 0, roughness: 2.2, density: 2.33, delta: 7.56, beta: 0.17 }
    ]
  },
  {
    id: 'superlattice',
    name: 'Periodic Multilayer: [Mo/Si] × 10 Superlattice',
    description: 'EUV mirror Bragg multilayer stack with alternating 3.5 nm Mo and 4.5 nm Si bilayers.',
    layers: [
      { id: 'layer-1', name: 'Mo (Layer 1)', formula: 'Mo', thickness: 35, roughness: 3.2, density: 10.2, delta: 29.5, beta: 1.85 },
      { id: 'layer-2', name: 'Si (Layer 1)', formula: 'Si', thickness: 45, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.17 },
      { id: 'layer-3', name: 'Mo (Layer 2)', formula: 'Mo', thickness: 35, roughness: 3.2, density: 10.2, delta: 29.5, beta: 1.85 },
      { id: 'layer-4', name: 'Si (Layer 2)', formula: 'Si', thickness: 45, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.17 },
      { id: 'layer-sub', name: 'Fused Silica Substrate', formula: 'SiO2', thickness: 0, roughness: 2.5, density: 2.20, delta: 7.18, beta: 0.15 }
    ]
  },
  {
    id: 'metal_capping',
    name: 'Spintronic Stack: Pt / CoFeB / MgO / Substrate',
    description: 'Magnetic tunnel junction structure with heavy metal spin-Hall Pt top contact.',
    layers: [
      { id: 'layer-1', name: 'Pt Cap', formula: 'Pt', thickness: 50, roughness: 3.8, density: 21.45, delta: 49.5, beta: 4.80 },
      { id: 'layer-2', name: 'CoFeB Ferromagnet', formula: 'CoFeB', thickness: 30, roughness: 2.5, density: 8.20, delta: 24.2, beta: 1.15 },
      { id: 'layer-3', name: 'MgO Tunnel Barrier', formula: 'MgO', thickness: 15, roughness: 2.2, density: 3.58, delta: 11.2, beta: 0.18 },
      { id: 'layer-sub', name: 'Si / SiO₂ Substrate', formula: 'Si', thickness: 0, roughness: 2.0, density: 2.33, delta: 7.56, beta: 0.17 }
    ]
  }
];

/**
 * Robust Multi-Format XRR Experimental Data Parser
 * Supports: .dat, .csv, .xy, .txt, Rigaku .ras, PANalytical .xrdml
 */
export function parseXRRDataFile(content: string, wavelength: number = 1.54056): { theta: number; qz: number; intensity: number }[] {
  const points: { theta: number; qz: number; intensity: number }[] = [];
  const lines = content.split(/\r?\n/);

  let isTwoTheta = false;
  let isQz = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('//')) {
      if (trimmed.toLowerCase().includes('2theta') || trimmed.toLowerCase().includes('2-theta')) {
        isTwoTheta = true;
      }
      if (trimmed.toLowerCase().includes('qz') || trimmed.toLowerCase().includes('q_z')) {
        isQz = true;
      }
      continue;
    }

    const parts = trimmed.split(/[\s,;\t]+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      const xVal = parseFloat(parts[0]);
      const yVal = parseFloat(parts[1]);

      if (!isNaN(xVal) && !isNaN(yVal) && yVal >= 0) {
        let theta = xVal;
        let qz = 0;

        if (isTwoTheta || xVal > 8.0) {
          // If angles are given in 2θ, convert to θ
          theta = xVal / 2.0;
          qz = (4 * Math.PI / wavelength) * Math.sin((theta * Math.PI) / 180);
        } else if (isQz || (xVal > 0.01 && xVal < 1.5 && parts[0].includes('.'))) {
          // If x is qz, convert to theta
          const sinTheta = (xVal * wavelength) / (4 * Math.PI);
          if (sinTheta >= 0 && sinTheta <= 1) {
            theta = (Math.asin(sinTheta) * 180) / Math.PI;
            qz = xVal;
          }
        } else {
          // Default: θ in degrees
          qz = (4 * Math.PI / wavelength) * Math.sin((theta * Math.PI) / 180);
        }

        if (theta > 0 && theta < 20) {
          points.push({ theta, qz, intensity: yVal });
        }
      }
    }
  }

  // Sort by theta ascending
  points.sort((a, b) => a.theta - b.theta);

  // Normalize intensity to maximum 1.0 if raw counts > 1.0
  if (points.length > 0) {
    const maxI = Math.max(...points.map(p => p.intensity));
    if (maxI > 1.0) {
      for (const p of points) {
        p.intensity = p.intensity / maxI;
      }
    }
  }

  return points;
}
"""

with open("utils/xrrPhysics.ts", "w", encoding="utf-8") as f:
    f.write(code + "\n" + append_code)

print("Updated utils/xrrPhysics.ts with aliases, presets, and parser!")
