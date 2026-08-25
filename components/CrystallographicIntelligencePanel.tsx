import React, { useState, useMemo } from 'react';
import {
  Box,
  Layers,
  Compass,
  Scan,
  Ruler,
  Sparkles,
  CheckCircle,
  Sliders,
  Activity,
  Info,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
  Table,
  Gauge,
  Atom,
  Eye,
  SlidersHorizontal,
  Flame,
  Zap
} from 'lucide-react';

export interface CrystallographicData {
  phase_name?: string;
  name?: string;
  formula?: string;
  crystalSystem?: string;
  spaceGroup?: string;
  density?: number;
  zValue?: number;
  cellVolume?: number;
  molecularWeight?: number;
  elasticModulus?: number;
  poissonsRatio?: number;
  card_id?: string;
  latticeParams?: {
    a: number;
    b?: number;
    c?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
    v?: number;
  };
}

interface Props {
  candidate: CrystallographicData;
  className?: string;
}

// X-ray Radiation Wavelengths (Angstroms)
export const XRAY_ANODES = [
  { id: 'cu_ka1', name: 'Cu-Kα₁', lambda: 1.540598, color: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10' },
  { id: 'mo_ka1', name: 'Mo-Kα₁', lambda: 0.709300, color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
  { id: 'co_ka1', name: 'Co-Kα₁', lambda: 1.788965, color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10' },
  { id: 'cr_ka1', name: 'Cr-Kα₁', lambda: 2.289700, color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10' },
  { id: 'fe_ka1', name: 'Fe-Kα₁', lambda: 1.936042, color: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
  { id: 'ag_ka1', name: 'Ag-Kα₁', lambda: 0.559408, color: 'text-sky-300', border: 'border-sky-500/40', bg: 'bg-sky-500/10' },
];

export const CrystallographicIntelligencePanel: React.FC<Props> = ({ candidate, className = '' }) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'hkl_solver' | 'unit_cell_3d' | 'reflections_table' | 'strain_sim'>('metrics');
  const [selectedAnode, setSelectedAnode] = useState('cu_ka1');

  // Custom Miller Indices for interactive calculator
  const [h, setH] = useState(1);
  const [k, setK] = useState(1);
  const [l, setL] = useState(1);

  // Microstrain and Thermal Expansion simulation
  const [appliedStrainPct, setAppliedStrainPct] = useState(0); // in percent (-2% to +2%)
  const [tempDeltaK, setTempDeltaK] = useState(0); // in Kelvin (0 to 1000 K)

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Rigorous Lattice Parameters Resolution
  const lattice = useMemo(() => {
    const cs = (candidate.crystalSystem || 'Cubic').toLowerCase();
    
    // Default simulated parameters for each system if unprovided
    let defA = 4.156, defB = 4.156, defC = 4.156;
    let defAlpha = 90, defBeta = 90, defGamma = 90;

    if (cs.includes('tetragonal')) {
      defA = 3.785; defB = 3.785; defC = 9.514;
    } else if (cs.includes('hexagonal') || cs.includes('trigonal')) {
      defA = 3.209; defB = 3.209; defC = 5.211; defGamma = 120;
    } else if (cs.includes('rhombohedral')) {
      defA = 5.120; defB = 5.120; defC = 5.120; defAlpha = 55.3; defBeta = 55.3; defGamma = 55.3;
    } else if (cs.includes('orthorhombic')) {
      defA = 4.540; defB = 5.860; defC = 7.210;
    } else if (cs.includes('monoclinic')) {
      defA = 5.120; defB = 6.890; defC = 4.900; defBeta = 104.5;
    } else if (cs.includes('triclinic')) {
      defA = 4.100; defB = 4.200; defC = 4.300; defAlpha = 88.5; defBeta = 95.2; defGamma = 102.1;
    }

    const raw = (candidate.latticeParams || {}) as Record<string, number | undefined>;
    const baseA = raw.a ?? defA;
    const baseB = raw.b ?? (cs.includes('cubic') || cs.includes('tetragonal') || cs.includes('hexagonal') ? baseA : defB);
    const baseC = raw.c ?? (cs.includes('cubic') ? baseA : defC);
    const baseAlpha = raw.alpha ?? defAlpha;
    const baseBeta = raw.beta ?? defBeta;
    const baseGamma = raw.gamma ?? defGamma;

    // Apply linear strain and thermal expansion (approx alpha_thermal = 1.2e-5 / K)
    const strainFactor = 1 + appliedStrainPct / 100 + (tempDeltaK * 1.2e-5);
    const a = baseA * strainFactor;
    const b = baseB * strainFactor;
    const c = baseC * strainFactor;
    const alpha = baseAlpha;
    const beta = baseBeta;
    const gamma = baseGamma;

    // Exact Triclinic/General Unit Cell Volume
    const aRad = (alpha * Math.PI) / 180;
    const bRad = (beta * Math.PI) / 180;
    const gRad = (gamma * Math.PI) / 180;

    const cosA = Math.cos(aRad);
    const cosB = Math.cos(bRad);
    const cosG = Math.cos(gRad);
    const sinA = Math.sin(aRad);
    const sinB = Math.sin(bRad);
    const sinG = Math.sin(gRad);

    const term = 1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG;
    const vol = a * b * c * Math.sqrt(Math.max(0.0001, term));

    // Direct Metric Tensor G
    const G = [
      [a * a, a * b * cosG, a * c * cosB],
      [a * b * cosG, b * b, b * c * cosA],
      [a * c * cosB, b * c * cosA, c * c]
    ];

    // Reciprocal Lattice Lengths and Angles
    const aStar = (b * c * sinA) / vol;
    const bStar = (a * c * sinB) / vol;
    const cStar = (a * b * sinG) / vol;

    const cosAStar = (cosB * cosG - cosA) / (sinB * sinG);
    const cosBStar = (cosA * cosG - cosB) / (sinA * sinG);
    const cosGStar = (cosA * cosB - cosG) / (sinA * sinB);

    const alphaStar = (Math.acos(Math.max(-1, Math.min(1, cosAStar))) * 180) / Math.PI;
    const betaStar = (Math.acos(Math.max(-1, Math.min(1, cosBStar))) * 180) / Math.PI;
    const gammaStar = (Math.acos(Math.max(-1, Math.min(1, cosGStar))) * 180) / Math.PI;

    const volStar = 1 / vol;

    // Reciprocal Metric Tensor G*
    const GStar = [
      [aStar * aStar, aStar * bStar * cosGStar, aStar * cStar * cosBStar],
      [aStar * bStar * cosGStar, bStar * bStar, bStar * cStar * cosAStar],
      [aStar * cStar * cosBStar, bStar * cStar * cosAStar, cStar * cStar]
    ];

    return {
      a, b, c,
      alpha, beta, gamma,
      vol,
      aStar, bStar, cStar,
      alphaStar, betaStar, gammaStar,
      volStar,
      G, GStar,
      cosA, cosB, cosG,
      sinA, sinB, sinG,
      cosAStar, cosBStar, cosGStar,
    };
  }, [candidate, appliedStrainPct, tempDeltaK]);

  // 2. Crystal System, Space Group, Bravais Centering & Symmetry Information
  const symmetryInfo = useMemo(() => {
    const sg = candidate.spaceGroup || '';
    const cs = candidate.crystalSystem || 'Cubic';
    const sgLower = sg.toLowerCase();

    // Bravais Centering Type
    let centering = 'Primitive (P)';
    let centeringCode = 'P';
    if (sg.startsWith('F') || sg.includes('Fm') || sg.includes('Fd')) {
      centering = 'Face-Centered (F)';
      centeringCode = 'F';
    } else if (sg.startsWith('I') || sg.includes('Im') || sg.includes('Ia') || sg.includes('I4')) {
      centering = 'Body-Centered (I)';
      centeringCode = 'I';
    } else if (sg.startsWith('C') || sg.startsWith('A') || sg.startsWith('B')) {
      centering = 'Base-Centered (C)';
      centeringCode = 'C';
    } else if (sg.startsWith('R') || cs.toLowerCase().includes('rhombohedral')) {
      centering = 'Rhombohedral (R)';
      centeringCode = 'R';
    }

    // Laue Class
    let laueGroup = 'm-3m (Cubic High)';
    let pointGroup = 'm-3m (Oh)';
    let pearson = 'cP';

    const csl = cs.toLowerCase();
    if (csl.includes('cubic')) {
      laueGroup = 'm-3m';
      pointGroup = sg.includes('43m') ? '-43m (Td)' : sg.includes('23') ? '23 (T)' : 'm-3m (Oh)';
      pearson = `c${centeringCode}`;
    } else if (csl.includes('hexagonal')) {
      laueGroup = '6/mmm';
      pointGroup = sg.includes('63mc') ? '6mm (C6v)' : '6/mmm (D6h)';
      pearson = `h${centeringCode}`;
    } else if (csl.includes('trigonal') || csl.includes('rhombohedral')) {
      laueGroup = '-3m';
      pointGroup = '-3m (D3d)';
      pearson = `hR`;
    } else if (csl.includes('tetragonal')) {
      laueGroup = '4/mmm';
      pointGroup = '4/mmm (D4h)';
      pearson = `t${centeringCode}`;
    } else if (csl.includes('orthorhombic')) {
      laueGroup = 'mmm';
      pointGroup = 'mmm (D2h)';
      pearson = `o${centeringCode}`;
    } else if (csl.includes('monoclinic')) {
      laueGroup = '2/m';
      pointGroup = '2/m (C2h)';
      pearson = `m${centeringCode}`;
    } else if (csl.includes('triclinic')) {
      laueGroup = '-1';
      pointGroup = '-1 (Ci)';
      pearson = `aP`;
    }

    // Extinction Conditions Description
    let extinctionRule = 'All (hkl) reflections allowed';
    if (centeringCode === 'F') {
      extinctionRule = 'h, k, l all odd or all even (unmixed)';
    } else if (centeringCode === 'I') {
      extinctionRule = 'h + k + l = 2n (even sum)';
    } else if (centeringCode === 'C') {
      extinctionRule = 'h + k = 2n (even)';
    } else if (centeringCode === 'R') {
      extinctionRule = '-h + k + l = 3n';
    }

    return {
      crystalSystem: cs,
      spaceGroup: sg || 'P1 (1)',
      centering,
      centeringCode,
      laueGroup,
      pointGroup,
      pearson,
      extinctionRule
    };
  }, [candidate]);

  // 3. Physics & Density Calculations
  const physicsMetrics = useMemo(() => {
    const mw = candidate.molecularWeight || 100.0;
    const Z = candidate.zValue || (lattice.vol ? Math.max(1, Math.round(lattice.vol / 35)) : 4);
    const NA = 6.02214076e23;
    
    // Theoretical Density: rho = (Z * Mw) / (NA * V * 10^-24) g/cm3
    const theorDensity = (Z * mw) / (NA * lattice.vol * 1e-24);
    const densityVal = candidate.density || theorDensity;

    // Mass Attenuation Coefficient estimate for Cu-Ka (approx based on mean atomic number/density)
    const muRhoCu = Math.max(15, densityVal * 7.5);
    const linearMuCu = muRhoCu * densityVal; // in cm^-1
    const penetrationDepthUm = (1 / linearMuCu) * 1e4; // in micrometers

    // Atomic Packing Factor (APF)
    let apf = 0.68;
    const csl = (candidate.crystalSystem || '').toLowerCase();
    if (symmetryInfo.centeringCode === 'F' || csl.includes('hexagonal')) apf = 0.74;
    else if (symmetryInfo.centeringCode === 'I') apf = 0.68;
    else if (symmetryInfo.centeringCode === 'P') apf = 0.52;
    else if (csl.includes('diamond')) apf = 0.34;

    return {
      Z,
      mw,
      theorDensity,
      densityVal,
      muRhoCu,
      linearMuCu,
      penetrationDepthUm,
      apf
    };
  }, [candidate, lattice, symmetryInfo]);

  // 4. Exact d_hkl and 2Theta Solver for any (h, k, l)
  const calcMillerPlane = (hVal: number, kVal: number, lVal: number, wavelength: number) => {
    if (hVal === 0 && kVal === 0 && lVal === 0) {
      return { d: 0, twoTheta: 0, theta: 0, q: 0, lpFactor: 0, allowed: false };
    }

    // 1/d^2 = h^2 a*^2 + k^2 b*^2 + l^2 c*^2 + 2hk a*b*cos(gamma*) + 2kl b*c*cos(alpha*) + 2hl a*c*cos(beta*)
    const invD2 = 
      hVal * hVal * lattice.GStar[0][0] +
      kVal * kVal * lattice.GStar[1][1] +
      lVal * lVal * lattice.GStar[2][2] +
      2 * hVal * kVal * lattice.GStar[0][1] +
      2 * kVal * lVal * lattice.GStar[1][2] +
      2 * hVal * lVal * lattice.GStar[0][2];

    if (invD2 <= 0) return { d: 0, twoTheta: 0, theta: 0, q: 0, lpFactor: 0, allowed: false };

    const d = 1 / Math.sqrt(invD2);
    const sinTheta = wavelength / (2 * d);
    
    // Extinction verification
    let allowed = true;
    if (symmetryInfo.centeringCode === 'F') {
      const hMod = Math.abs(hVal) % 2;
      const kMod = Math.abs(kVal) % 2;
      const lMod = Math.abs(lVal) % 2;
      allowed = (hMod === kMod) && (kMod === lMod);
    } else if (symmetryInfo.centeringCode === 'I') {
      allowed = (Math.abs(hVal + kVal + lVal) % 2 === 0);
    } else if (symmetryInfo.centeringCode === 'C') {
      allowed = (Math.abs(hVal + kVal) % 2 === 0);
    }

    if (sinTheta > 1) {
      // Reflection is outside Ewald Sphere for this wavelength
      return { d, twoTheta: 0, theta: 0, q: (4 * Math.PI) / d, lpFactor: 0, allowed: false, outOfRange: true };
    }

    const thetaRad = Math.asin(sinTheta);
    const thetaDeg = (thetaRad * 180) / Math.PI;
    const twoTheta = 2 * thetaDeg;
    const q = (4 * Math.PI * sinTheta) / wavelength;

    // Lorentz-Polarization Factor (standard unpolarized laboratory beam)
    const sin2T = Math.sin(2 * thetaRad);
    const cos2T = Math.cos(2 * thetaRad);
    const lpFactor = (1 + cos2T * cos2T) / (Math.sin(thetaRad) * Math.sin(thetaRad) * Math.cos(thetaRad));

    return {
      d,
      twoTheta,
      theta: thetaDeg,
      q,
      lpFactor,
      allowed,
      outOfRange: false
    };
  };

  const activeAnode = XRAY_ANODES.find(a => a.id === selectedAnode) || XRAY_ANODES[0];
  const currentPlane = useMemo(() => {
    return calcMillerPlane(h, k, l, activeAnode.lambda);
  }, [h, k, l, activeAnode, lattice, symmetryInfo]);

  // 5. Theoretical Bragg Reflection Table Generation (First ~12 prominent reflections)
  const theoreticalReflections = useMemo(() => {
    const list: Array<{
      h: number;
      k: number;
      l: number;
      hkl: string;
      d: number;
      twoTheta: number;
      multiplicity: number;
      allowed: boolean;
      relIntensity: number;
    }> = [];

    const cs = (candidate.crystalSystem || 'Cubic').toLowerCase();

    // Standard reflection scan ranges
    for (let hIdx = 0; hIdx <= 4; hIdx++) {
      for (let kIdx = 0; kIdx <= 4; kIdx++) {
        for (let lIdx = 0; lIdx <= 4; lIdx++) {
          if (hIdx === 0 && kIdx === 0 && lIdx === 0) continue;

          // For symmetry unique reduction (approximate for cubic/tetragonal/hexagonal)
          if (cs.includes('cubic') && (hIdx < kIdx || kIdx < lIdx)) continue;
          if (cs.includes('tetragonal') && (hIdx < kIdx)) continue;
          if (cs.includes('hexagonal') && (hIdx < kIdx)) continue;

          const res = calcMillerPlane(hIdx, kIdx, lIdx, activeAnode.lambda);
          if (res.twoTheta > 5 && res.twoTheta < 110 && !res.outOfRange) {
            // Estimate multiplicity
            let mult = 6;
            if (cs.includes('cubic')) {
              if (hIdx === kIdx && kIdx === lIdx) mult = 8; // (111)
              else if (hIdx !== 0 && kIdx === 0 && lIdx === 0) mult = 6; // (100)
              else if (hIdx === kIdx && lIdx === 0) mult = 12; // (110)
              else if (hIdx !== kIdx && kIdx !== lIdx && lIdx !== 0) mult = 48;
              else mult = 24;
            } else if (cs.includes('hexagonal')) {
              if (hIdx === 0 && kIdx === 0) mult = 2; // (00l)
              else if (lIdx === 0) mult = 6; // (hk0)
              else mult = 12;
            } else if (cs.includes('tetragonal')) {
              if (hIdx === 0 && kIdx === 0) mult = 2;
              else if (hIdx === kIdx && lIdx === 0) mult = 4;
              else mult = 8;
            } else {
              mult = 2;
            }

            // Approximate structure factor profile
            const fFactor = (hIdx + kIdx + lIdx) % 2 === 0 ? 1.0 : 0.65;
            const rawInt = mult * res.lpFactor * fFactor * Math.exp(-0.02 * res.q * res.q);

            list.push({
              h: hIdx,
              k: kIdx,
              l: lIdx,
              hkl: `(${hIdx}${kIdx}${lIdx})`,
              d: res.d,
              twoTheta: res.twoTheta,
              multiplicity: mult,
              allowed: res.allowed,
              relIntensity: rawInt,
            });
          }
        }
      }
    }

    // Sort by 2Theta
    list.sort((a, b) => a.twoTheta - b.twoTheta);

    // Normalize intensity
    const maxInt = Math.max(1, ...list.filter(x => x.allowed).map(x => x.relIntensity));
    return list.map(item => ({
      ...item,
      relIntensity: item.allowed ? Math.round((item.relIntensity / maxInt) * 100) : 0
    })).slice(0, 14);
  }, [lattice, symmetryInfo, activeAnode, candidate]);

  // 6. 3D Isometric Unit Cell Projection Coordinates & Miller Plane Facet
  const unitCell3D = useMemo(() => {
    // 3D Isometric / Dimetric projection matrix
    const cos30 = Math.cos((30 * Math.PI) / 180);
    const sin30 = Math.sin((30 * Math.PI) / 180);

    const project3D = (x: number, y: number, z: number, scale = 110) => {
      // Screen coordinates centered at (150, 150)
      // x-axis points down-left (+x goes -X_screen, +Y_screen)
      // y-axis points down-right (+y goes +X_screen, +Y_screen)
      // z-axis points straight up (+z goes -Y_screen)
      const aNorm = x;
      const bNorm = y;
      const cNorm = z;

      const screenX = 150 + (bNorm * cos30 - aNorm * cos30) * scale;
      const screenY = 150 + (aNorm * sin30 + bNorm * sin30 - cNorm) * scale;
      return { x: screenX, y: screenY };
    };

    // 8 Box Vertices
    const v000 = project3D(0, 0, 0);
    const v100 = project3D(1, 0, 0);
    const v010 = project3D(0, 1, 0);
    const v110 = project3D(1, 1, 0);
    const v001 = project3D(0, 0, 1);
    const v101 = project3D(1, 0, 1);
    const v011 = project3D(0, 1, 1);
    const v111 = project3D(1, 1, 1);

    // Compute (hkl) Plane Intercepts on Unit Cell axes (1/h, 1/k, 1/l)
    const interceptA = h !== 0 ? Math.min(1, Math.max(0, 1 / Math.abs(h))) : 1;
    const interceptB = k !== 0 ? Math.min(1, Math.max(0, 1 / Math.abs(k))) : 1;
    const interceptC = l !== 0 ? Math.min(1, Math.max(0, 1 / Math.abs(l))) : 1;

    // Plane vertices on axes
    const pA = project3D(interceptA, 0, 0);
    const pB = project3D(0, interceptB, 0);
    const pC = project3D(0, 0, interceptC);

    let planePoints = `${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`;
    if (h === 0 && k !== 0 && l !== 0) {
      const pB2 = project3D(1, interceptB, 0);
      const pC2 = project3D(1, 0, interceptC);
      planePoints = `${pB.x},${pB.y} ${pB2.x},${pB2.y} ${pC2.x},${pC2.y} ${pC.x},${pC.y}`;
    } else if (k === 0 && h !== 0 && l !== 0) {
      const pA2 = project3D(interceptA, 1, 0);
      const pC2 = project3D(0, 1, interceptC);
      planePoints = `${pA.x},${pA.y} ${pA2.x},${pA2.y} ${pC2.x},${pC2.y} ${pC.x},${pC.y}`;
    } else if (l === 0 && h !== 0 && k !== 0) {
      const pA2 = project3D(interceptA, 0, 1);
      const pB2 = project3D(0, interceptB, 1);
      planePoints = `${pA.x},${pA.y} ${pA2.x},${pA2.y} ${pB2.x},${pB2.y} ${pB.x},${pB.y}`;
    }

    return {
      v000, v100, v010, v110, v001, v101, v011, v111,
      planePoints,
      pA, pB, pC,
      project3D
    };
  }, [h, k, l, lattice]);

  return (
    <div className={`bg-[#050A14]/90 p-6 sm:p-8 rounded-[2rem] border border-slate-800 relative overflow-hidden shadow-2xl transition-all ${className}`}>
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[90px] pointer-events-none -translate-y-20 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[80px] pointer-events-none translate-y-20 -translate-x-20" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-10 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 rounded-2xl border border-indigo-500/30 shadow-[inset_0_2px_10px_rgba(99,102,241,0.2)]">
            <Box className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-[0.25em]">
                Crystallographic Intelligence & Metrology
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
                Direct & Reciprocal Tensor
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif italic text-white tracking-wide mt-0.5">
              {candidate.phase_name || candidate.name || 'Crystalline Phase'}
            </h3>
          </div>
        </div>

        {/* Radiation Target Picker */}
        <div className="flex items-center gap-2 self-start lg:self-auto bg-[#09101F] p-1.5 rounded-xl border border-slate-700/80 shadow-md">
          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold pl-2 pr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Source:
          </span>
          <div className="flex flex-wrap gap-1">
            {XRAY_ANODES.map((anode) => (
              <button
                key={anode.id}
                onClick={() => setSelectedAnode(anode.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  selectedAnode === anode.id
                    ? `${anode.bg} ${anode.color} ${anode.border} border shadow-sm`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                {anode.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 relative z-10 border-b border-slate-800/60 pb-3">
        {[
          { id: 'metrics', label: 'Unit Cell & Reciprocal Net', icon: Ruler },
          { id: 'hkl_solver', label: 'Miller (hkl) & Bragg Solver', icon: Compass },
          { id: 'unit_cell_3d', label: '3D Unit Cell & Planes', icon: Box },
          { id: 'reflections_table', label: 'Theoretical Reflection Table', icon: Table },
          { id: 'strain_sim', label: 'Microstrain & Thermal Drift', icon: Flame },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: METRICS & RECIPROCAL NET */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          {/* Top Quick Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#09101F] p-3.5 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Crystal System</span>
              <span className="text-sm font-mono font-black text-indigo-300 mt-0.5">{symmetryInfo.crystalSystem}</span>
              <span className="text-[8px] font-mono text-slate-500 mt-1">Pearson: {symmetryInfo.pearson}</span>
            </div>
            <div className="bg-[#09101F] p-3.5 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Space Group</span>
              <span className="text-sm font-mono font-black text-emerald-400 mt-0.5">{symmetryInfo.spaceGroup}</span>
              <span className="text-[8px] font-mono text-slate-500 mt-1">Laue: {symmetryInfo.laueGroup}</span>
            </div>
            <div className="bg-[#09101F] p-3.5 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Bravais Centering</span>
              <span className="text-sm font-mono font-black text-cyan-300 mt-0.5">{symmetryInfo.centering}</span>
              <span className="text-[8px] font-mono text-slate-500 mt-1">Point Group: {symmetryInfo.pointGroup}</span>
            </div>
            <div className="bg-[#09101F] p-3.5 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Extinction Rule</span>
              <span className="text-xs font-mono font-bold text-amber-300 mt-0.5 truncate" title={symmetryInfo.extinctionRule}>
                {symmetryInfo.extinctionRule}
              </span>
              <span className="text-[8px] font-mono text-slate-500 mt-1">Systematic Absences</span>
            </div>
          </div>

          {/* Direct & Reciprocal Metric Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Direct Real-Space Lattice Box */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-indigo-500/30 flex flex-col gap-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono font-black text-indigo-300 uppercase tracking-wider">
                    Direct Real-Space Lattice (Direct Basis)
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Å & Degrees (°)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">a</span>
                  <p className="text-base font-mono font-black text-white mt-1">{lattice.a.toFixed(4)} <span className="text-[9px] font-normal text-slate-500">Å</span></p>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">b</span>
                  <p className="text-base font-mono font-black text-white mt-1">{lattice.b.toFixed(4)} <span className="text-[9px] font-normal text-slate-500">Å</span></p>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">c</span>
                  <p className="text-base font-mono font-black text-white mt-1">{lattice.c.toFixed(4)} <span className="text-[9px] font-normal text-slate-500">Å</span></p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">α (Alpha)</span>
                  <p className="text-sm font-mono font-bold text-indigo-300 mt-1">{lattice.alpha.toFixed(2)}°</p>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">β (Beta)</span>
                  <p className="text-sm font-mono font-bold text-indigo-300 mt-1">{lattice.beta.toFixed(2)}°</p>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">γ (Gamma)</span>
                  <p className="text-sm font-mono font-bold text-indigo-300 mt-1">{lattice.gamma.toFixed(2)}°</p>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Unit Cell Volume (V)</span>
                  <span className="text-lg font-mono font-black text-indigo-200">{lattice.vol.toFixed(3)} Å³</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Calc Density (ρ_xrd)</span>
                  <span className="text-base font-mono font-black text-emerald-400">{physicsMetrics.theorDensity.toFixed(3)} g/cm³</span>
                </div>
              </div>
            </div>

            {/* Reciprocal Space Lattice Box */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-cyan-500/30 flex flex-col gap-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-black text-cyan-300 uppercase tracking-wider">
                    Reciprocal Lattice (Fourier Net G*)
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Å⁻¹ & Reciprocal Degrees
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">a*</span>
                  <p className="text-base font-mono font-black text-cyan-300 mt-1">{lattice.aStar.toFixed(4)} <span className="text-[9px] font-normal text-slate-500">Å⁻¹</span></p>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">b*</span>
                  <p className="text-base font-mono font-black text-cyan-300 mt-1">{lattice.bStar.toFixed(4)} <span className="text-[9px] font-normal text-slate-500">Å⁻¹</span></p>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">c*</span>
                  <p className="text-base font-mono font-black text-cyan-300 mt-1">{lattice.cStar.toFixed(4)} <span className="text-[9px] font-normal text-slate-500">Å⁻¹</span></p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">α* (Alpha*)</span>
                  <p className="text-sm font-mono font-bold text-cyan-200 mt-1">{lattice.alphaStar.toFixed(2)}°</p>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">β* (Beta*)</span>
                  <p className="text-sm font-mono font-bold text-cyan-200 mt-1">{lattice.betaStar.toFixed(2)}°</p>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] font-serif italic text-slate-400">γ* (Gamma*)</span>
                  <p className="text-sm font-mono font-bold text-cyan-200 mt-1">{lattice.gammaStar.toFixed(2)}°</p>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Reciprocal Volume (V*)</span>
                  <span className="text-lg font-mono font-black text-cyan-200">{lattice.volStar.toFixed(6)} Å⁻³</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Packing Fraction (APF)</span>
                  <span className="text-base font-mono font-black text-amber-300">{(physicsMetrics.apf * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Tensor Matrix Preview */}
          <div className="bg-[#09101F] p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-xs font-mono font-bold text-slate-200">Direct Metric Tensor Matrix [G]</span>
                <p className="text-[10px] font-mono text-slate-400">Used for interatomic vector dot-products, angle dot-products & unit cell strain</p>
              </div>
            </div>
            <div className="font-mono text-xs bg-black/60 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
              <span>[G] =</span>
              <div className="grid grid-cols-3 gap-2 text-indigo-300 font-bold">
                <span>{lattice.G[0][0].toFixed(2)}</span>
                <span>{lattice.G[0][1].toFixed(2)}</span>
                <span>{lattice.G[0][2].toFixed(2)}</span>
                <span>{lattice.G[1][0].toFixed(2)}</span>
                <span>{lattice.G[1][1].toFixed(2)}</span>
                <span>{lattice.G[1][2].toFixed(2)}</span>
                <span>{lattice.G[2][0].toFixed(2)}</span>
                <span>{lattice.G[2][1].toFixed(2)}</span>
                <span>{lattice.G[2][2].toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MILLER (HKL) & BRAGG ANGLE SOLVER */}
      {activeTab === 'hkl_solver' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls Box */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">Input Miller Indices (hkl)</span>
                <span className="text-[10px] font-mono text-cyan-400">λ = {activeAnode.lambda.toFixed(4)} Å</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  [1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0],
                  [2, 1, 1], [2, 2, 0], [3, 1, 1], [0, 0, 2], [1, 0, 2]
                ].map(([ph, pk, pl]) => (
                  <button
                    key={`${ph}-${pk}-${pl}`}
                    onClick={() => { setH(ph); setK(pk); setL(pl); }}
                    className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                      h === ph && k === pk && l === pl
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    ({ph}{pk}{pl})
                  </button>
                ))}
              </div>

              {/* Spinners */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                  <span className="text-xs font-mono font-bold text-slate-400 mb-2">h</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setH(Math.max(0, h - 1))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">-</button>
                    <span className="text-lg font-mono font-black text-white">{h}</span>
                    <button onClick={() => setH(h + 1)} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">+</button>
                  </div>
                </div>

                <div className="bg-black/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                  <span className="text-xs font-mono font-bold text-slate-400 mb-2">k</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setK(Math.max(0, k - 1))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">-</button>
                    <span className="text-lg font-mono font-black text-white">{k}</span>
                    <button onClick={() => setK(k + 1)} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">+</button>
                  </div>
                </div>

                <div className="bg-black/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                  <span className="text-xs font-mono font-bold text-slate-400 mb-2">l</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setL(Math.max(0, l - 1))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">-</button>
                    <span className="text-lg font-mono font-black text-white">{l}</span>
                    <button onClick={() => setL(l + 1)} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">+</button>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                currentPlane.allowed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <span>Extinction Status:</span>
                <span className="font-black font-mono">
                  {currentPlane.allowed ? '✓ Allowed Reflection' : '✗ Systematically Extinct'}
                </span>
              </div>
            </div>

            {/* Calculated Output Values */}
            <div className="p-5 lg:col-span-2 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-cyan-500/30 flex flex-col justify-between gap-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  Crystallographic Solution for Plane ({h} {k} {l})
                </span>
                <button
                  onClick={() => handleCopy(`Plane (${h}${k}${l}): d = ${currentPlane.d.toFixed(4)} A, 2Theta(${activeAnode.name}) = ${currentPlane.twoTheta.toFixed(2)} deg`, 'hkl')}
                  className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-cyan-300"
                >
                  {copiedKey === 'hkl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy Metrics
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Interplanar (d_hkl)</span>
                  <p className="text-xl font-mono font-black text-emerald-400 mt-1">{currentPlane.d.toFixed(4)} <span className="text-xs">Å</span></p>
                </div>
                <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Diffraction 2θ</span>
                  <p className="text-xl font-mono font-black text-cyan-300 mt-1">
                    {currentPlane.outOfRange ? '—' : `${currentPlane.twoTheta.toFixed(3)}°`}
                  </p>
                </div>
                <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Bragg Angle (θ)</span>
                  <p className="text-xl font-mono font-black text-sky-400 mt-1">
                    {currentPlane.outOfRange ? '—' : `${currentPlane.theta.toFixed(3)}°`}
                  </p>
                </div>
                <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Scattering (q)</span>
                  <p className="text-xl font-mono font-black text-amber-300 mt-1">{currentPlane.q.toFixed(3)} <span className="text-xs">Å⁻¹</span></p>
                </div>
              </div>

              {/* Multi-Anode Comparison Table */}
              <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-widest block mb-2">
                  Theoretical 2θ Position Across Laboratory Sources
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
                  {XRAY_ANODES.map((anode) => {
                    const planeRes = calcMillerPlane(h, k, l, anode.lambda);
                    return (
                      <div key={anode.id} className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                        <span className={`text-[9px] font-bold block ${anode.color}`}>{anode.name}</span>
                        <span className="text-white font-black block mt-0.5">
                          {planeRes.outOfRange ? 'N/A' : `${planeRes.twoTheta.toFixed(2)}°`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 3D UNIT CELL & PLANES */}
      {activeTab === 'unit_cell_3d' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-slate-800 flex flex-col justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-slate-300 uppercase block mb-1">
                  3D Lattice Projection & Plane ({h} {k} {l})
                </span>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  Interactive real-time crystallographic unit cell wireframe. The colored shaded surface highlights the lattice plane intersecting crystallographic axes at intercepts (1/h, 1/k, 1/l).
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs bg-black/40 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between"><span className="text-slate-500">Crystal System:</span> <span className="text-white font-bold">{symmetryInfo.crystalSystem}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Plane Intercept a:</span> <span className="text-cyan-300 font-bold">{h !== 0 ? (1/h).toFixed(2) : '∞ (Parallel)'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Plane Intercept b:</span> <span className="text-cyan-300 font-bold">{k !== 0 ? (1/k).toFixed(2) : '∞ (Parallel)'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Plane Intercept c:</span> <span className="text-cyan-300 font-bold">{l !== 0 ? (1/l).toFixed(2) : '∞ (Parallel)'}</span></div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1], [2, 0, 0], [2, 2, 0]
                ].map(([ph, pk, pl]) => (
                  <button
                    key={`p-${ph}-${pk}-${pl}`}
                    onClick={() => { setH(ph); setK(pk); setL(pl); }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                      h === ph && k === pk && l === pl
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    Plane ({ph}{pk}{pl})
                  </button>
                ))}
              </div>
            </div>

            {/* SVG 3D Canvas */}
            <div className="p-5 lg:col-span-2 bg-[#03060C] rounded-2xl border border-slate-800 flex items-center justify-center min-h-[300px] relative overflow-hidden">
              <svg viewBox="0 0 300 300" className="w-full max-w-[320px] h-[280px]">
                {/* Coordinate Grid / Axes vectors */}
                <defs>
                  <linearGradient id="planeGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.15} />
                  </linearGradient>
                </defs>

                {/* Shaded Plane Polygon */}
                {unitCell3D.planePoints && (
                  <polygon
                    points={unitCell3D.planePoints}
                    fill="url(#planeGrad)"
                    stroke="#fb7185"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Rear Box Edges */}
                <line x1={unitCell3D.v000.x} y1={unitCell3D.v000.y} x2={unitCell3D.v100.x} y2={unitCell3D.v100.y} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <line x1={unitCell3D.v000.x} y1={unitCell3D.v000.y} x2={unitCell3D.v010.x} y2={unitCell3D.v010.y} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <line x1={unitCell3D.v000.x} y1={unitCell3D.v000.y} x2={unitCell3D.v001.x} y2={unitCell3D.v001.y} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

                {/* Front Box Edges */}
                <line x1={unitCell3D.v100.x} y1={unitCell3D.v100.y} x2={unitCell3D.v110.x} y2={unitCell3D.v110.y} stroke="#64748b" strokeWidth="1.5" />
                <line x1={unitCell3D.v010.x} y1={unitCell3D.v010.y} x2={unitCell3D.v110.x} y2={unitCell3D.v110.y} stroke="#64748b" strokeWidth="1.5" />
                <line x1={unitCell3D.v001.x} y1={unitCell3D.v001.y} x2={unitCell3D.v101.x} y2={unitCell3D.v101.y} stroke="#64748b" strokeWidth="1.5" />
                <line x1={unitCell3D.v001.x} y1={unitCell3D.v001.y} x2={unitCell3D.v011.x} y2={unitCell3D.v011.y} stroke="#64748b" strokeWidth="1.5" />
                <line x1={unitCell3D.v101.x} y1={unitCell3D.v101.y} x2={unitCell3D.v111.x} y2={unitCell3D.v111.y} stroke="#64748b" strokeWidth="1.5" />
                <line x1={unitCell3D.v011.x} y1={unitCell3D.v011.y} x2={unitCell3D.v111.x} y2={unitCell3D.v111.y} stroke="#64748b" strokeWidth="1.5" />
                <line x1={unitCell3D.v100.x} y1={unitCell3D.v100.y} x2={unitCell3D.v101.x} y2={unitCell3D.v101.y} stroke="#64748b" strokeWidth="1.5" />
                <line x1={unitCell3D.v010.x} y1={unitCell3D.v010.y} x2={unitCell3D.v011.x} y2={unitCell3D.v011.y} stroke="#64748b" strokeWidth="1.5" />
                <line x1={unitCell3D.v110.x} y1={unitCell3D.v110.y} x2={unitCell3D.v111.x} y2={unitCell3D.v111.y} stroke="#64748b" strokeWidth="1.5" />

                {/* 8 Corner Atoms */}
                {[
                  unitCell3D.v000, unitCell3D.v100, unitCell3D.v010, unitCell3D.v110,
                  unitCell3D.v001, unitCell3D.v101, unitCell3D.v011, unitCell3D.v111
                ].map((pt, i) => (
                  <circle key={`atom-${i}`} cx={pt.x} cy={pt.y} r={3.5} fill="#38bdf8" stroke="#0369a1" strokeWidth={1} />
                ))}

                {/* Axis Labels */}
                <text x={unitCell3D.v100.x - 12} y={unitCell3D.v100.y + 14} fill="#f43f5e" fontSize="11" fontFamily="monospace" fontWeight="bold">a</text>
                <text x={unitCell3D.v010.x + 12} y={unitCell3D.v010.y + 14} fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">b</text>
                <text x={unitCell3D.v001.x} y={unitCell3D.v001.y - 10} fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">c</text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: THEORETICAL REFLECTION TABLE */}
      {activeTab === 'reflections_table' && (
        <div className="space-y-4 relative z-10 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">
              Calculated Bragg Reflections (Source: {activeAnode.name}, λ={activeAnode.lambda} Å)
            </span>
            <span className="text-[10px] font-mono text-slate-500">Sorted by 2θ diffraction angle</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[#09101F] text-slate-400 border-b border-slate-800">
                  <th className="p-3">Reflection (hkl)</th>
                  <th className="p-3">d-spacing (Å)</th>
                  <th className="p-3">2θ Angle (°)</th>
                  <th className="p-3">Multiplicity (m)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Relative Intensity I/I₀</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-black/40">
                {theoreticalReflections.map((ref, idx) => (
                  <tr
                    key={`ref-${idx}`}
                    onClick={() => { setH(ref.h); setK(ref.k); setL(ref.l); setActiveTab('hkl_solver'); }}
                    className="hover:bg-indigo-500/10 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-black text-rose-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {ref.hkl}
                    </td>
                    <td className="p-3 text-emerald-400 font-bold">{ref.d.toFixed(4)}</td>
                    <td className="p-3 text-cyan-300 font-black">{ref.twoTheta.toFixed(2)}°</td>
                    <td className="p-3 text-slate-300">{ref.multiplicity}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ref.allowed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {ref.allowed ? 'Allowed' : 'Extinct'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400 rounded-full" style={{ width: `${ref.relIntensity}%` }} />
                        </div>
                        <span className="text-white font-bold w-8 text-right">{ref.relIntensity}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MICROSTRAIN & THERMAL EXPANSION DRIFT */}
      {activeTab === 'strain_sim' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sliders */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-slate-800 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" /> Lattice Stress & Thermal Sliders
                </span>
                <button
                  onClick={() => { setAppliedStrainPct(0); setTempDeltaK(0); }}
                  className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Microstrain (ε = Δa/a):</span>
                  <span className={`font-black ${appliedStrainPct > 0 ? 'text-amber-400' : appliedStrainPct < 0 ? 'text-cyan-400' : 'text-white'}`}>
                    {appliedStrainPct > 0 ? `+${appliedStrainPct.toFixed(2)}% (Tensile)` : appliedStrainPct < 0 ? `${appliedStrainPct.toFixed(2)}% (Compressive)` : '0.00% (Relaxed)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="2.0"
                  step="0.05"
                  value={appliedStrainPct}
                  onChange={(e) => setAppliedStrainPct(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Temperature Shift (ΔT):</span>
                  <span className="font-black text-rose-400">+{tempDeltaK} K</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="25"
                  value={tempDeltaK}
                  onChange={(e) => setTempDeltaK(parseInt(e.target.value))}
                  className="w-full accent-rose-400"
                />
              </div>
            </div>

            {/* Shift Metrics */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-amber-500/30 flex flex-col justify-between gap-4 shadow-lg">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                Simulated Peak Shift for ({h} {k} {l})
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Strained Cell Volume (V)</span>
                  <span className="text-lg font-mono font-black text-amber-200">{lattice.vol.toFixed(3)} Å³</span>
                </div>
                <div className="bg-black/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Calculated Stress (σ)</span>
                  <span className="text-lg font-mono font-black text-rose-300">
                    {candidate.elasticModulus ? `${(-candidate.elasticModulus * (appliedStrainPct / 100)).toFixed(2)} GPa` : `${(-150 * (appliedStrainPct / 100)).toFixed(2)} GPa`}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-500/30 text-xs font-mono">
                <span className="text-slate-400">Bragg Angle Peak Shift:</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-slate-300">Shifted 2θ:</span>
                  <span className="text-base font-black text-amber-300">{currentPlane.twoTheta.toFixed(3)}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
