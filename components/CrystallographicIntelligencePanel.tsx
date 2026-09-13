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
  Zap,
  Download,
  FileText,
  HelpCircle,
  Crosshair,
  Maximize2
} from 'lucide-react';
import {
  LatticeParameters,
  RadiationSource,
  XRAY_ANODES,
  computeLatticeTensors,
  calculatePlaneMetrology,
  calculateInterplanarAngle,
  calculateZoneAxis,
  checkWeissZoneLaw,
  estimateVolumeUnderPressure,
  calculateCubicAnisotropicE,
  calculateScherrerSize,
  generateCIFString
} from '../src/utils/crystallographyMath';
import { UnitCell3DViewer } from './crystallography/UnitCell3DViewer';
import { StickSpectrumChart, TheoreticalReflection } from './crystallography/StickSpectrumChart';

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

export const CrystallographicIntelligencePanel: React.FC<Props> = ({ candidate, className = '' }) => {
  const [activeTab, setActiveTab] = useState<
    'metrics' | 'hkl_solver' | 'zone_axis' | 'unit_cell_3d' | 'reflections_table' | 'size_strain' | 'hp_ht_eos'
  >('metrics');
  const [selectedAnodeId, setSelectedAnodeId] = useState('cu_ka1');

  // Custom Primary Miller Indices (h1, k1, l1)
  const [h1, setH1] = useState(1);
  const [k1, setK1] = useState(1);
  const [l1, setL1] = useState(1);

  // Secondary Miller Indices (h2, k2, l2) for Interplanar Angle & Zone Axis
  const [h2, setH2] = useState(2);
  const [k2, setK2] = useState(0);
  const [l2, setL2] = useState(0);

  // Zone Axis [u v w]
  const [zoneU, setZoneU] = useState(0);
  const [zoneV, setZoneV] = useState(0);
  const [zoneW, setZoneW] = useState(1);

  // Scherrer / Size-Strain state
  const [fwhmObs, setFwhmObs] = useState(0.24);      // in degrees 2theta
  const [fwhmInst, setFwhmInst] = useState(0.06);    // instrumental broadening in deg
  const [shapeFactorK, setShapeFactorK] = useState(0.94);

  // HP-HT and Strain simulation
  const [appliedStrainPct, setAppliedStrainPct] = useState(0); // -2% to +2%
  const [tempDeltaK, setTempDeltaK] = useState(0);             // 0 to 1000 K
  const [appliedP_GPa, setAppliedP_GPa] = useState(0);         // 0 to 30 GPa
  const [bulkModulusB0, setBulkModulusB0] = useState(160);     // GPa
  const [zenerRatio, setZenerRatio] = useState(1.6);           // Anisotropy

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Active Radiation source
  const activeAnode = useMemo(() => {
    return XRAY_ANODES.find((a) => a.id === selectedAnodeId) || XRAY_ANODES[0];
  }, [selectedAnodeId]);

  // 1. Crystal System, Space Group, Bravais Centering & Symmetry Resolution
  const symmetryInfo = useMemo(() => {
    const sg = candidate.spaceGroup || '';
    const cs = candidate.crystalSystem || 'Cubic';
    const csl = cs.toLowerCase();

    // Centering determination
    let centering = 'Primitive (P)';
    let centeringCode = 'P';
    if (sg.startsWith('F') || sg.includes('Fm') || sg.includes('Fd') || csl.includes('fcc')) {
      centering = 'Face-Centered (F)';
      centeringCode = 'F';
    } else if (sg.startsWith('I') || sg.includes('Im') || sg.includes('Ia') || sg.includes('I4') || csl.includes('bcc')) {
      centering = 'Body-Centered (I)';
      centeringCode = 'I';
    } else if (sg.startsWith('C') || sg.startsWith('A') || sg.startsWith('B')) {
      centering = 'Base-Centered (C)';
      centeringCode = 'C';
    } else if (sg.startsWith('R') || csl.includes('rhombohedral')) {
      centering = 'Rhombohedral (R)';
      centeringCode = 'R';
    }

    // Laue, Point Group & Pearson Symbol
    let laueGroup = 'm-3m';
    let pointGroup = 'm-3m (Oh)';
    let pearson = `c${centeringCode}`;

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
      pearson = 'hR';
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
      pearson = 'aP';
    }

    // Systematic Absences
    let extinctionRule = 'All (hkl) reflections allowed';
    if (centeringCode === 'F') extinctionRule = 'h, k, l all odd or all even (unmixed)';
    else if (centeringCode === 'I') extinctionRule = 'h + k + l = 2n (even sum)';
    else if (centeringCode === 'C') extinctionRule = 'h + k = 2n (even)';
    else if (centeringCode === 'R') extinctionRule = '-h + k + l = 3n';

    return {
      crystalSystem: cs,
      spaceGroup: sg || 'P 1',
      centering,
      centeringCode,
      laueGroup,
      pointGroup,
      pearson,
      extinctionRule,
    };
  }, [candidate]);

  // 2. Exact Direct & Reciprocal Metric Tensors
  const lattice = useMemo(() => {
    const cs = (candidate.crystalSystem || 'Cubic').toLowerCase();

    // Default lattice values if unprovided
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

    return computeLatticeTensors(
      baseA,
      baseB,
      baseC,
      baseAlpha,
      baseBeta,
      baseGamma,
      appliedStrainPct,
      tempDeltaK
    );
  }, [candidate, appliedStrainPct, tempDeltaK]);

  // 3. Density, Packing & Attenuation Physics
  const physics = useMemo(() => {
    const mw = candidate.molecularWeight || 100.0;
    const Z = candidate.zValue || (lattice.vol ? Math.max(1, Math.round(lattice.vol / 35)) : 4);
    const NA = 6.02214076e23;

    // Theoretical Density: rho = (Z * Mw) / (NA * V * 10^-24) g/cm3
    const theorDensity = (Z * mw) / (NA * lattice.vol * 1e-24);
    const densityVal = candidate.density || theorDensity;

    // Mass Attenuation Coefficient (mu/rho) estimation for active anode wavelength
    // Approx scaling with (lambda / 1.54)^3
    const lambdaFactor = Math.pow(activeAnode.lambda / 1.5406, 2.7);
    const muRho = Math.max(12, densityVal * 7.2 * lambdaFactor);
    const linearMu = muRho * densityVal; // cm^-1
    const penetrationDepthUm = (1 / linearMu) * 1e4; // micrometers

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
      muRho,
      linearMu,
      penetrationDepthUm,
      apf,
    };
  }, [candidate, lattice, symmetryInfo, activeAnode]);

  // 4. Primary Plane Metrology (h1, k1, l1)
  const plane1Metrology = useMemo(() => {
    return calculatePlaneMetrology(
      h1,
      k1,
      l1,
      lattice,
      activeAnode.lambda,
      symmetryInfo.centeringCode
    );
  }, [h1, k1, l1, lattice, activeAnode, symmetryInfo]);

  // 5. Secondary Plane Metrology (h2, k2, l2) & Interplanar Angle (phi)
  const interplanarAngle = useMemo(() => {
    return calculateInterplanarAngle(h1, k1, l1, h2, k2, l2, lattice);
  }, [h1, k1, l1, h2, k2, l2, lattice]);

  // 6. Zone Axis Calculation & Weiss Zone Law
  const zoneAxisResult = useMemo(() => {
    const calcFromPlanes = calculateZoneAxis(h1, k1, l1, h2, k2, l2, lattice);
    const inZone1 = checkWeissZoneLaw(h1, k1, l1, zoneU, zoneV, zoneW);
    const inZone2 = checkWeissZoneLaw(h2, k2, l2, zoneU, zoneV, zoneW);

    return {
      ...calcFromPlanes,
      inZone1,
      inZone2,
    };
  }, [h1, k1, l1, h2, k2, l2, zoneU, zoneV, zoneW, lattice]);

  // 7. Scherrer Size & Dislocation Calculation
  const sizeStrainResult = useMemo(() => {
    return calculateScherrerSize(
      fwhmObs,
      fwhmInst,
      plane1Metrology.twoTheta || 38.0,
      activeAnode.lambda,
      shapeFactorK
    );
  }, [fwhmObs, fwhmInst, plane1Metrology, activeAnode, shapeFactorK]);

  // 8. Theoretical Reflection Table (sorted by 2Theta)
  const theoreticalReflections = useMemo((): TheoreticalReflection[] => {
    const list: TheoreticalReflection[] = [];
    const cs = (candidate.crystalSystem || 'Cubic').toLowerCase();

    for (let hIdx = 0; hIdx <= 4; hIdx++) {
      for (let kIdx = 0; kIdx <= 4; kIdx++) {
        for (let lIdx = 0; lIdx <= 4; lIdx++) {
          if (hIdx === 0 && kIdx === 0 && lIdx === 0) continue;

          // Symmetry unique reduction
          if (cs.includes('cubic') && (hIdx < kIdx || kIdx < lIdx)) continue;
          if (cs.includes('tetragonal') && hIdx < kIdx) continue;
          if (cs.includes('hexagonal') && hIdx < kIdx) continue;

          const res = calculatePlaneMetrology(
            hIdx,
            kIdx,
            lIdx,
            lattice,
            activeAnode.lambda,
            symmetryInfo.centeringCode
          );

          if (res.twoTheta >= 8 && res.twoTheta <= 115 && !res.outOfRange) {
            // Multiplicity estimation
            let mult = 6;
            if (cs.includes('cubic')) {
              if (hIdx === kIdx && kIdx === lIdx) mult = 8;
              else if (hIdx !== 0 && kIdx === 0 && lIdx === 0) mult = 6;
              else if (hIdx === kIdx && lIdx === 0) mult = 12;
              else if (hIdx !== kIdx && kIdx !== lIdx && lIdx !== 0) mult = 48;
              else mult = 24;
            } else if (cs.includes('hexagonal')) {
              if (hIdx === 0 && kIdx === 0) mult = 2;
              else if (lIdx === 0) mult = 6;
              else mult = 12;
            } else if (cs.includes('tetragonal')) {
              if (hIdx === 0 && kIdx === 0) mult = 2;
              else if (hIdx === kIdx && lIdx === 0) mult = 4;
              else mult = 8;
            } else {
              mult = 2;
            }

            const fFactor = (hIdx + kIdx + lIdx) % 2 === 0 ? 1.0 : 0.65;
            const rawInt = mult * res.lpFactor * fFactor * Math.exp(-0.02 * res.q * res.q);

            list.push({
              h: hIdx,
              k: kIdx,
              l: lIdx,
              hkl: `(${hIdx}${kIdx}${lIdx})`,
              millerBravais: res.millerBravais,
              d: res.d,
              twoTheta: res.twoTheta,
              multiplicity: mult,
              allowed: res.allowed,
              relIntensity: rawInt,
              q: res.q,
              lpFactor: res.lpFactor,
            });
          }
        }
      }
    }

    list.sort((a, b) => a.twoTheta - b.twoTheta);
    const maxInt = Math.max(1, ...list.filter((x) => x.allowed).map((x) => x.relIntensity));

    return list.map((item) => ({
      ...item,
      relIntensity: item.allowed ? Math.round((item.relIntensity / maxInt) * 100) : 0,
    })).slice(0, 16);
  }, [lattice, symmetryInfo, activeAnode, candidate]);

  // 9. High-Pressure & Anisotropic Elasticity
  const hpCompressedVolume = useMemo(() => {
    return estimateVolumeUnderPressure(appliedP_GPa, lattice.vol, bulkModulusB0);
  }, [appliedP_GPa, lattice.vol, bulkModulusB0]);

  const anisotropicE = useMemo(() => {
    return calculateCubicAnisotropicE(
      h1,
      k1,
      l1,
      candidate.elasticModulus || 200,
      candidate.poissonsRatio || 0.28,
      zenerRatio
    );
  }, [h1, k1, l1, candidate, zenerRatio]);

  // Download CIF File
  const handleDownloadCIF = () => {
    const cifContent = generateCIFString(
      candidate.phase_name || candidate.name || 'Phase',
      candidate.formula || '',
      symmetryInfo.spaceGroup,
      lattice,
      physics.Z,
      physics.theorDensity
    );
    const blob = new Blob([cifContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(candidate.phase_name || candidate.name || 'crystal').replace(/\s+/g, '_')}.cif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-[#050A14]/95 p-6 sm:p-8 rounded-[2rem] border border-slate-800 relative overflow-hidden shadow-2xl transition-all ${className}`}>
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none -translate-y-24 translate-x-36" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-600/5 rounded-full blur-[90px] pointer-events-none translate-y-24 -translate-x-24" />

      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 relative z-10 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 rounded-2xl border border-indigo-500/30 shadow-[inset_0_2px_10px_rgba(99,102,241,0.2)]">
            <Box className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-[0.25em]">
                Crystallographic Intelligence & Metrology
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
                Direct & Reciprocal Tensor [G/G*]
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono font-bold">
                {symmetryInfo.crystalSystem} ({symmetryInfo.pearson})
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif italic text-white tracking-wide mt-0.5">
              {candidate.phase_name || candidate.name || 'Crystalline Phase'}
              {candidate.formula && <span className="text-slate-400 font-mono text-base font-normal ml-2">[{candidate.formula}]</span>}
            </h3>
          </div>
        </div>

        {/* Action Controls & Radiation Picker */}
        <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-auto">
          {/* CIF Download Button */}
          <button
            onClick={handleDownloadCIF}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Download standard Crystallographic Information File (.cif)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CIF
          </button>

          {/* Radiation Source Picker */}
          <div className="flex items-center gap-1.5 bg-[#09101F] p-1.5 rounded-xl border border-slate-700/80 shadow-md">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-bold pl-2 pr-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Source:
            </span>
            <div className="flex flex-wrap gap-1">
              {XRAY_ANODES.slice(0, 6).map((anode) => (
                <button
                  key={anode.id}
                  onClick={() => setSelectedAnodeId(anode.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    selectedAnodeId === anode.id
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
      </div>

      {/* Navigation Sub-Tabs (7 Comprehensive Scientific Tabs) */}
      <div className="flex flex-wrap items-center gap-2 mb-6 relative z-10 border-b border-slate-800/60 pb-3">
        {[
          { id: 'metrics', label: 'Unit Cell & Metric Tensors [G/G*]', icon: Ruler },
          { id: 'hkl_solver', label: 'Miller (hkl) & Bragg Metrology', icon: Compass },
          { id: 'zone_axis', label: 'Zone Axis [uvw] & Weiss Law', icon: Crosshair },
          { id: 'unit_cell_3d', label: '3D Unit Cell & Planes', icon: Box },
          { id: 'reflections_table', label: 'Diffractogram Stick Spectrum', icon: Table },
          { id: 'size_strain', label: 'Scherrer Size-Strain Metrology', icon: Activity },
          { id: 'hp_ht_eos', label: 'HP-HT Equation of State & Elasticity', icon: Flame },
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

      {/* ========================================================================= */}
      {/* TAB 1: UNIT CELL & METRIC TENSORS [G] & [G*]                              */}
      {/* ========================================================================= */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          {/* Quick Badges */}
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
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Systematic Absences</span>
              <span className="text-xs font-mono font-bold text-amber-300 mt-0.5 truncate" title={symmetryInfo.extinctionRule}>
                {symmetryInfo.extinctionRule}
              </span>
              <span className="text-[8px] font-mono text-slate-500 mt-1">Reflections</span>
            </div>
          </div>

          {/* Direct & Reciprocal Metric Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Direct Real-Space Lattice Box */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-indigo-500/30 flex flex-col gap-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono font-black text-indigo-300 uppercase tracking-wider">
                    Direct Real-Space Lattice (Basis Vectors)
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

              <div className="p-3.5 bg-indigo-950/30 rounded-xl border border-indigo-500/20 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Unit Cell Volume (V)</span>
                  <span className="text-lg font-mono font-black text-indigo-200">{lattice.vol.toFixed(3)} Å³</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Calculated Density (ρ)</span>
                  <span className="text-base font-mono font-black text-emerald-400">{physics.theorDensity.toFixed(3)} g/cm³</span>
                </div>
              </div>
            </div>

            {/* Reciprocal Space Lattice Box */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-cyan-500/30 flex flex-col gap-4 shadow-lg">
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

              <div className="p-3.5 bg-cyan-950/30 rounded-xl border border-cyan-500/20 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Reciprocal Vol (V*)</span>
                  <span className="text-lg font-mono font-black text-cyan-200">{lattice.volStar.toFixed(6)} Å⁻³</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Packing Fraction (APF)</span>
                  <span className="text-base font-mono font-black text-amber-300">{(physics.apf * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Tensor Matrices [G] and [G*] side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#09101F] p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-300">Direct Metric Tensor [G] (Å²)</span>
                <span className="text-[10px] font-mono text-slate-500">det(G) = {lattice.detG.toFixed(2)}</span>
              </div>
              <div className="bg-black/60 p-3 rounded-lg border border-slate-800 font-mono text-xs text-center grid grid-cols-3 gap-2 text-indigo-200 font-bold">
                <span>{lattice.G[0][0].toFixed(3)}</span>
                <span>{lattice.G[0][1].toFixed(3)}</span>
                <span>{lattice.G[0][2].toFixed(3)}</span>
                <span>{lattice.G[1][0].toFixed(3)}</span>
                <span>{lattice.G[1][1].toFixed(3)}</span>
                <span>{lattice.G[1][2].toFixed(3)}</span>
                <span>{lattice.G[2][0].toFixed(3)}</span>
                <span>{lattice.G[2][1].toFixed(3)}</span>
                <span>{lattice.G[2][2].toFixed(3)}</span>
              </div>
            </div>

            <div className="bg-[#09101F] p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300">Reciprocal Metric Tensor [G*] (Å⁻²)</span>
                <span className="text-[10px] font-mono text-slate-500">det(G*) = {lattice.detGStar.toExponential(3)}</span>
              </div>
              <div className="bg-black/60 p-3 rounded-lg border border-slate-800 font-mono text-xs text-center grid grid-cols-3 gap-2 text-cyan-200 font-bold">
                <span>{lattice.GStar[0][0].toFixed(4)}</span>
                <span>{lattice.GStar[0][1].toFixed(4)}</span>
                <span>{lattice.GStar[0][2].toFixed(4)}</span>
                <span>{lattice.GStar[1][0].toFixed(4)}</span>
                <span>{lattice.GStar[1][1].toFixed(4)}</span>
                <span>{lattice.GStar[1][2].toFixed(4)}</span>
                <span>{lattice.GStar[2][0].toFixed(4)}</span>
                <span>{lattice.GStar[2][1].toFixed(4)}</span>
                <span>{lattice.GStar[2][2].toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* X-ray Absorption & Beam Penetration Metrology */}
          <div className="bg-[#09101F] p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xs font-mono font-bold text-slate-200">
                  X-ray Beam Penetration Metrology (Source: {activeAnode.name})
                </span>
                <p className="text-[10px] font-mono text-slate-400">
                  Mass attenuation μ/ρ ≈ {physics.muRho.toFixed(1)} cm²/g · Linear absorption coefficient μ = {physics.linearMu.toFixed(1)} cm⁻¹
                </p>
              </div>
            </div>
            <div className="bg-black/60 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-[9px] font-mono text-slate-400 uppercase block">1/e Penetration Depth</span>
              <span className="text-base font-mono font-black text-amber-300">{physics.penetrationDepthUm.toFixed(2)} μm</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MILLER (HKL) & BRAGG METROLOGY + INTERPLANAR ANGLE (PHI)           */}
      {/* ========================================================================= */}
      {activeTab === 'hkl_solver' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Plane Controls */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">Primary Miller Plane (h k l)</span>
                <span className="text-[10px] font-mono text-cyan-400">λ = {activeAnode.lambda.toFixed(4)} Å</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  [1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0],
                  [2, 1, 1], [2, 2, 0], [3, 1, 1], [0, 0, 2], [1, 0, 2]
                ].map(([ph, pk, pl]) => (
                  <button
                    key={`p1-${ph}-${pk}-${pl}`}
                    onClick={() => { setH1(ph); setK1(pk); setL1(pl); }}
                    className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                      h1 === ph && k1 === pk && l1 === pl
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
                  <span className="text-xs font-mono font-bold text-slate-400 mb-2">h₁</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setH1(Math.max(0, h1 - 1))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">-</button>
                    <span className="text-lg font-mono font-black text-white">{h1}</span>
                    <button onClick={() => setH1(h1 + 1)} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">+</button>
                  </div>
                </div>

                <div className="bg-black/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                  <span className="text-xs font-mono font-bold text-slate-400 mb-2">k₁</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setK1(Math.max(0, k1 - 1))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">-</button>
                    <span className="text-lg font-mono font-black text-white">{k1}</span>
                    <button onClick={() => setK1(k1 + 1)} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">+</button>
                  </div>
                </div>

                <div className="bg-black/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                  <span className="text-xs font-mono font-bold text-slate-400 mb-2">l₁</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setL1(Math.max(0, l1 - 1))} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">-</button>
                    <span className="text-lg font-mono font-black text-white">{l1}</span>
                    <button onClick={() => setL1(l1 + 1)} className="w-6 h-6 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700">+</button>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                plane1Metrology.allowed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <span>Centering Condition:</span>
                <span className="font-black font-mono">
                  {plane1Metrology.allowed ? '✓ Allowed Reflection' : '✗ Systematically Extinct'}
                </span>
              </div>
            </div>

            {/* Calculated Output Values */}
            <div className="p-5 lg:col-span-2 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-cyan-500/30 flex flex-col justify-between gap-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    Crystallographic Solution ({h1} {k1} {l1})
                  </span>
                  {plane1Metrology.millerBravais && (
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                      Hexagonal: {plane1Metrology.millerBravais}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(`Plane (${h1}${k1}${l1}): d = ${plane1Metrology.d.toFixed(4)} A, 2Theta(${activeAnode.name}) = ${plane1Metrology.twoTheta.toFixed(3)} deg`, 'hkl')}
                  className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-cyan-300"
                >
                  {copiedKey === 'hkl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy Metrics
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Interplanar (d_hkl)</span>
                  <p className="text-xl font-mono font-black text-emerald-400 mt-1">{plane1Metrology.d.toFixed(4)} <span className="text-xs">Å</span></p>
                </div>
                <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Diffraction 2θ</span>
                  <p className="text-xl font-mono font-black text-cyan-300 mt-1">
                    {plane1Metrology.outOfRange ? '—' : `${plane1Metrology.twoTheta.toFixed(3)}°`}
                  </p>
                </div>
                <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Bragg Angle (θ)</span>
                  <p className="text-xl font-mono font-black text-sky-400 mt-1">
                    {plane1Metrology.outOfRange ? '—' : `${plane1Metrology.theta.toFixed(3)}°`}
                  </p>
                </div>
                <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Scattering (q)</span>
                  <p className="text-xl font-mono font-black text-amber-300 mt-1">{plane1Metrology.q.toFixed(3)} <span className="text-xs">Å⁻¹</span></p>
                </div>
              </div>

              {/* Multi-Anode Comparison Table */}
              <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-widest block mb-2">
                  Theoretical 2θ Position Across Laboratory Sources
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
                  {XRAY_ANODES.slice(0, 6).map((anode) => {
                    const planeRes = calculatePlaneMetrology(h1, k1, l1, lattice, anode.lambda, symmetryInfo.centeringCode);
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

          {/* Interplanar Angle Tool: Plane 1 vs Plane 2 */}
          <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-indigo-500/30 flex flex-col gap-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">
                  Interplanar Angle Metrology: ({h1} {k1} {l1}) ∡ ({h2} {k2} {l2})
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                cos(ϕ) = (h₁ᵀ G* h₂) / [√(h₁ᵀ G* h₁) · √(h₂ᵀ G* h₂)]
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Secondary Plane Selectors */}
              <div className="bg-black/40 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Secondary Reference Plane (h₂ k₂ l₂)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-slate-500">h₂:</span>
                    <input
                      type="number"
                      value={h2}
                      onChange={(e) => setH2(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-slate-500">k₂:</span>
                    <input
                      type="number"
                      value={k2}
                      onChange={(e) => setK2(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-slate-500">l₂:</span>
                    <input
                      type="number"
                      value={l2}
                      onChange={(e) => setL2(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Interplanar Angle Result */}
              <div className="md:col-span-2 bg-black/60 p-4 rounded-xl border border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Interplanar Angle ϕ</span>
                  <span className="text-2xl font-mono font-black text-indigo-300">
                    {interplanarAngle.phiDeg.toFixed(2)}° <span className="text-xs font-normal text-slate-400">({interplanarAngle.phiRad.toFixed(3)} rad)</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Metric Tensor Dot Product</span>
                  <span className="text-sm font-mono font-bold text-cyan-300">h₁ᵀ G* h₂ = {interplanarAngle.dotProduct.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ZONE AXIS [UVW] & WEISS ZONE LAW                                   */}
      {/* ========================================================================= */}
      {activeTab === 'zone_axis' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zone Axis Cross Product Calculator */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  Cross-Product Zone Axis u = (h₁k₁l₁) × (h₂k₂l₂)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Right-Hand Rule</span>
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plane 1 (h₁k₁l₁):</span>
                  <span className="text-white font-bold">({h1} {k1} {l1})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plane 2 (h₂k₂l₂):</span>
                  <span className="text-white font-bold">({h2} {k2} {l2})</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                  <span className="text-cyan-400 font-bold">Computed Zone Axis [uvw]:</span>
                  <span className="text-lg font-black text-cyan-300 bg-cyan-950/40 px-3 py-1 rounded border border-cyan-500/30">
                    {zoneAxisResult.zoneSymbol}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-black/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Zone Repeat Vector |r_uvw|</span>
                  <span className="text-base font-mono font-black text-emerald-400 mt-1">{zoneAxisResult.repeatDist.toFixed(4)} Å</span>
                </div>
                <div className="bg-black/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">ZOLZ Layer Spacing (1/|r|)</span>
                  <span className="text-base font-mono font-black text-indigo-300 mt-1">{zoneAxisResult.layerSpacing.toFixed(4)} Å⁻¹</span>
                </div>
              </div>
            </div>

            {/* Weiss Zone Law Verification */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-indigo-500/30 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-indigo-300 uppercase">
                  Weiss Zone Law Checker: hu + kv + lw = 0
                </span>
                <span className="text-[10px] font-mono text-slate-400">Electron / X-ray Diffraction</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">Zone u:</span>
                  <input
                    type="number"
                    value={zoneU}
                    onChange={(e) => setZoneU(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400">Zone v:</span>
                  <input
                    type="number"
                    value={zoneV}
                    onChange={(e) => setZoneV(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400">Zone w:</span>
                  <input
                    type="number"
                    value={zoneW}
                    onChange={(e) => setZoneW(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-center"
                  />
                </div>
              </div>

              {/* Status evaluations for Plane 1 and Plane 2 */}
              <div className="space-y-2 text-xs font-mono">
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  zoneAxisResult.inZone1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <span>Plane ({h1} {k1} {l1}) in Zone [{zoneU} {zoneV} {zoneW}]:</span>
                  <span className="font-bold font-mono">
                    {zoneAxisResult.inZone1 ? '✓ Lies in Zone (ZOLZ)' : '✗ Not in Zone'}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  zoneAxisResult.inZone2 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <span>Plane ({h2} {k2} {l2}) in Zone [{zoneU} {zoneV} {zoneW}]:</span>
                  <span className="font-bold font-mono">
                    {zoneAxisResult.inZone2 ? '✓ Lies in Zone (ZOLZ)' : '✗ Not in Zone'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 3D UNIT CELL & MILLER PLANES                                       */}
      {/* ========================================================================= */}
      {activeTab === 'unit_cell_3d' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          <UnitCell3DViewer
            lattice={lattice}
            h={h1}
            k={k1}
            l={l1}
            crystalSystem={symmetryInfo.crystalSystem}
            centeringCode={symmetryInfo.centeringCode}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: THEORETICAL REFLECTION TABLE & STICK SPECTRUM                      */}
      {/* ========================================================================= */}
      {activeTab === 'reflections_table' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          {/* Interactive Stick Spectrum Chart */}
          <StickSpectrumChart
            reflections={theoreticalReflections}
            selectedHkl={`(${h1}${k1}${l1})`}
            onSelectReflection={(ref) => {
              setH1(ref.h);
              setK1(ref.k);
              setL1(ref.l);
            }}
            anodeName={activeAnode.name}
            lambda={activeAnode.lambda}
          />

          {/* Reflections Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                Bragg Reflection Peak Metrology (Source: {activeAnode.name}, λ = {activeAnode.lambda.toFixed(4)} Å)
              </span>
              <span className="text-[10px] font-mono text-slate-500">Click any row to solve Miller plane</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-[#09101F] text-slate-400 border-b border-slate-800">
                    <th className="p-3">Plane (hkl)</th>
                    <th className="p-3">d-spacing (Å)</th>
                    <th className="p-3">2θ Angle (°)</th>
                    <th className="p-3">q (Å⁻¹)</th>
                    <th className="p-3">Multiplicity (m)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Relative Intensity I/I₀</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-black/40">
                  {theoreticalReflections.map((ref, idx) => (
                    <tr
                      key={`ref-${idx}`}
                      onClick={() => {
                        setH1(ref.h);
                        setK1(ref.k);
                        setL1(ref.l);
                        setActiveTab('hkl_solver');
                      }}
                      className={`hover:bg-indigo-500/10 cursor-pointer transition-colors ${
                        h1 === ref.h && k1 === ref.k && l1 === ref.l ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      <td className="p-3 font-black text-rose-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        {ref.hkl}
                      </td>
                      <td className="p-3 text-emerald-400 font-bold">{ref.d.toFixed(4)}</td>
                      <td className="p-3 text-cyan-300 font-black">{ref.twoTheta.toFixed(3)}°</td>
                      <td className="p-3 text-amber-300">{ref.q.toFixed(3)}</td>
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
                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${ref.relIntensity}%` }} />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SCHERRER SIZE-STRAIN METROLOGY                                     */}
      {/* ========================================================================= */}
      {activeTab === 'size_strain' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Broadening Controls */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-slate-800 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  Scherrer & Broadening Deconvolution
                </span>
                <span className="text-[10px] font-mono text-slate-400">D = Kλ / (β cos θ)</span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Observed Experimental FWHM (β_obs):</span>
                  <span className="font-bold text-white">{fwhmObs.toFixed(3)}° 2θ</span>
                </div>
                <input
                  type="range"
                  min="0.08"
                  max="1.50"
                  step="0.01"
                  value={fwhmObs}
                  onChange={(e) => setFwhmObs(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Instrumental Broadening (β_inst):</span>
                  <span className="font-bold text-amber-300">{fwhmInst.toFixed(3)}° 2θ</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.15"
                  step="0.005"
                  value={fwhmInst}
                  onChange={(e) => setFwhmInst(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Scherrer Shape Factor (K):</span>
                  <span className="font-bold text-indigo-300">{shapeFactorK.toFixed(2)} (Spherical)</span>
                </div>
                <div className="flex gap-2">
                  {[0.89, 0.94, 1.0].map((kVal) => (
                    <button
                      key={kVal}
                      onClick={() => setShapeFactorK(kVal)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${
                        shapeFactorK === kVal ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      K = {kVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculated Crystallite Size & Dislocation Density */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-emerald-500/30 flex flex-col justify-between gap-4 shadow-lg">
              <span className="text-xs font-mono font-bold text-emerald-300 uppercase">
                Metrology Output for Reflection ({h1} {k1} {l1}) at 2θ = {plane1Metrology.twoTheta.toFixed(2)}°
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Crystallite Size (D)</span>
                  <span className="text-2xl font-mono font-black text-emerald-300 mt-1">
                    {sizeStrainResult.crystalliteSizeNm.toFixed(1)} <span className="text-xs font-normal">nm</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block mt-0.5">({sizeStrainResult.crystalliteSizeAngstrom.toFixed(0)} Å)</span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Physical FWHM (β_sample)</span>
                  <span className="text-xl font-mono font-black text-cyan-300 mt-1">
                    {sizeStrainResult.betaSampleDeg.toFixed(4)}°
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block mt-0.5">√(β_obs² - β_inst²)</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/20 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Dislocation Density (δ = 1/D²):</span>
                  <span className="text-base font-black text-amber-300">
                    {sizeStrainResult.dislocationDensity.toExponential(3)} lines/m²
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: HP-HT EQUATION OF STATE & ANISOTROPIC ELASTICITY                   */}
      {/* ========================================================================= */}
      {activeTab === 'hp_ht_eos' && (
        <div className="space-y-6 relative z-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sliders: Pressure & Temperature */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-slate-800 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" /> In-Situ Pressure & Temperature Sliders
                </span>
                <button
                  onClick={() => { setAppliedP_GPa(0); setTempDeltaK(0); setAppliedStrainPct(0); }}
                  className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Hydrostatic Pressure (P):</span>
                  <span className="font-black text-indigo-400">{appliedP_GPa} GPa</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={appliedP_GPa}
                  onChange={(e) => setAppliedP_GPa(parseInt(e.target.value))}
                  className="w-full accent-indigo-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Temperature Delta (ΔT):</span>
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

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Zener Anisotropy Ratio (A = 2C₄₄/(C₁₁-C₁₂)):</span>
                  <span className="font-black text-amber-300">{zenerRatio.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.1"
                  value={zenerRatio}
                  onChange={(e) => setZenerRatio(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>

            {/* Shift & Anisotropy Metrics */}
            <div className="p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-amber-500/30 flex flex-col justify-between gap-4 shadow-lg">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase">
                Birch-Murnaghan EOS & Anisotropic Young's Modulus
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Compressed Vol V(P)</span>
                  <span className="text-lg font-mono font-black text-indigo-300">{hpCompressedVolume.toFixed(3)} Å³</span>
                  <span className="text-[9px] font-mono text-slate-500">({((hpCompressedVolume / lattice.vol) * 100).toFixed(1)}% of V₀)</span>
                </div>

                <div className="bg-black/50 p-3 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Directional E({h1}{k1}{l1})</span>
                  <span className="text-lg font-mono font-black text-amber-300">{anisotropicE.modulusGPa.toFixed(1)} GPa</span>
                  <span className="text-[9px] font-mono text-slate-500">Γ = {anisotropicE.orientationGamma.toFixed(3)}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-950/20 rounded-xl border border-amber-500/30 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Peak Shift for ({h1}{k1}{l1}):</span>
                  <span className="text-base font-black text-amber-300">2θ = {plane1Metrology.twoTheta.toFixed(3)}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
