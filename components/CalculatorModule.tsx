import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Zap, Ruler, Box, Activity, ChevronRight, RefreshCcw, Layers, Scaling, Target, Save, Grid, MoveHorizontal, PieChart, Wrench, HelpCircle, Flame } from 'lucide-react';
import {
  EnergyWaveVisualizer,
  MillerPlaneVisualizer,
  DislocationVisualizer,
  LatticeStrainVisualizer,
  PorosityVisualizer,
  MechanicalVisualizer,
  ThermoVisualizer,
  DiffusionVisualizer
} from './CalculatorVisualizers';

interface FormulaTooltipProps {
  formula: string;
  description?: string;
}

const FormulaTooltip: React.FC<FormulaTooltipProps> = ({ formula, description }) => {
  return (
    <div className="relative inline-block group ml-1.5 align-middle select-none">
      <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-help transition-all duration-200" />
      <div className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-56 p-3 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-xl shadow-xl border border-slate-800 dark:border-slate-800/80 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-1 font-sans font-normal normal-case tracking-normal text-left">
        {description && <div className="text-slate-300 mb-1.5 font-medium leading-relaxed">{description}</div>}
        <div className="font-mono bg-slate-950/50 dark:bg-black/40 px-2 py-1.5 rounded-lg text-[10px] border border-slate-800/60 text-indigo-300 font-bold overflow-x-auto whitespace-pre-wrap break-all">
          {formula}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95 dark:border-t-slate-950/95"></div>
      </div>
    </div>
  );
};

interface MaterialPreset {
  name: string;
  system: 'cubic' | 'tetragonal' | 'orthorhombic' | 'hexagonal' | 'monoclinic' | 'triclinic';
  a: string;
  b: string;
  c: string;
  alpha: string;
  beta: string;
  gamma: string;
  Z: string;
  M: string;
  description: string;
}

const MATERIAL_PRESETS: MaterialPreset[] = [
  { name: 'Silicon (Si)', system: 'cubic', a: '5.4309', b: '5.4309', c: '5.4309', alpha: '90', beta: '90', gamma: '90', Z: '8', M: '28.085', description: 'Semiconductor, diamond cubic structure.' },
  { name: 'Copper (Cu)', system: 'cubic', a: '3.615', b: '3.615', c: '3.615', alpha: '90', beta: '90', gamma: '90', Z: '4', M: '63.546', description: 'Face-centered cubic (FCC) metal.' },
  { name: 'Alpha-Iron (α-Fe)', system: 'cubic', a: '2.866', b: '2.866', c: '2.866', alpha: '90', beta: '90', gamma: '90', Z: '2', M: '55.845', description: 'Body-centered cubic (BCC) ferrite.' },
  { name: 'Gold (Au)', system: 'cubic', a: '4.078', b: '4.078', c: '4.078', alpha: '90', beta: '90', gamma: '90', Z: '4', M: '196.967', description: 'FCC noble metal.' },
  { name: 'Halite (NaCl)', system: 'cubic', a: '5.640', b: '5.640', c: '5.640', alpha: '90', beta: '90', gamma: '90', Z: '4', M: '58.44', description: 'Rock salt structure, face-centered cubic.' },
  { name: 'Rutile (TiO₂)', system: 'tetragonal', a: '4.5937', b: '4.5937', c: '2.9587', alpha: '90', beta: '90', gamma: '90', Z: '2', M: '79.866', description: 'High-temperature TiO2 polymorph.' },
  { name: 'Aragonite (CaCO₃)', system: 'orthorhombic', a: '4.95', b: '7.96', c: '5.74', alpha: '90', beta: '90', gamma: '90', Z: '4', M: '100.086', description: 'Carbonate mineral, high-pressure polymorph.' },
  { name: 'Quartz (α-SiO₂)', system: 'hexagonal', a: '4.913', b: '4.913', c: '5.405', alpha: '90', beta: '90', gamma: '120', Z: '3', M: '60.084', description: 'Low-temperature quartz, trigonal system.' },
  { name: 'Graphite (C)', system: 'hexagonal', a: '2.464', b: '2.464', c: '6.711', alpha: '90', beta: '90', gamma: '120', Z: '4', M: '12.011', description: 'Layered carbon allotrope.' },
  { name: 'Gypsum (CaSO₄·2H₂O)', system: 'monoclinic', a: '5.68', b: '15.18', c: '6.29', alpha: '90', beta: '113.8', gamma: '90', Z: '4', M: '172.17', description: 'Soft sulfate mineral.' },
  { name: 'Microcline (KAlSi₃O₈)', system: 'triclinic', a: '8.56', b: '12.96', c: '7.21', alpha: '90.6', beta: '115.9', gamma: '87.6', Z: '4', M: '278.33', description: 'Potassium feldspar silicate.' }
];

export interface CalculatorModuleProps {
  onSaveToHistory?: (calcName: string, wavelength: number, twoTheta: number, dSpacing: number, qValue: number) => void;
}

export const CalculatorModule: React.FC<CalculatorModuleProps> = ({ onSaveToHistory }) => {
  const { t } = useTranslation();
  const [activeCalc, setActiveCalc] = useState<'energy' | 'dspacing' | 'volume' | 'microstructure' | 'strain' | 'porosity' | 'mechanics' | 'thermo' | 'diffusion'>('energy');

  // --- Thermodynamics & Phase Transformations State ---
  // 1. Lever Rule
  const [leverMode, setLeverMode] = useState<'binary' | 'ternary'>('binary');
  const [leverCa, setLeverCa] = useState<string>('20'); // Composition of Phase A (%)
  const [leverCb, setLeverCb] = useState<string>('80'); // Composition of Phase B (%)
  const [leverC0, setLeverC0] = useState<string>('45'); // Overall composition (%)
  const [leverPhaseALabel, setLeverPhaseALabel] = useState<string>('Alpha (α)');
  const [leverPhaseBLabel, setLeverPhaseBLabel] = useState<string>('Beta (β)');

  // Ternary Lever Rule States
  const [leverTaX, setLeverTaX] = useState<string>('15'); // Ni% in Austenite (A)
  const [leverTaY, setLeverTaY] = useState<string>('20'); // Cr% in Austenite (A)
  const [leverTbX, setLeverTbX] = useState<string>('5');  // Ni% in Ferrite (B)
  const [leverTbY, setLeverTbY] = useState<string>('25'); // Cr% in Ferrite (B)
  const [leverTcX, setLeverTcX] = useState<string>('10'); // Ni% in Sigma Phase (C)
  const [leverTcY, setLeverTcY] = useState<string>('45'); // Cr% in Sigma Phase (C)
  const [leverT0X, setLeverT0X] = useState<string>('11'); // Overall Ni%
  const [leverT0Y, setLeverT0Y] = useState<string>('27'); // Overall Cr%
  const [leverTPhaseALabel, setLeverTPhaseALabel] = useState<string>('Austenite (γ)');
  const [leverTPhaseBLabel, setLeverTPhaseBLabel] = useState<string>('Ferrite (α)');
  const [leverTPhaseCLabel, setLeverTPhaseCLabel] = useState<string>('Sigma (σ)');

  // 2. Gibbs Free Energy
  const [gibbsH, setGibbsH] = useState<string>('-85'); // kJ/mol
  const [gibbsS, setGibbsS] = useState<string>('-120'); // J/mol K
  const [gibbsT, setGibbsT] = useState<string>('25'); // °C
  const [gibbsTUnit, setGibbsTUnit] = useState<'C' | 'K'>('C');

  // 3. Avrami Kinetics
  const [avramiCalcMode, setAvramiCalcMode] = useState<'fraction' | 'time'>('fraction');
  const [avramiK, setAvramiK] = useState<string>('0.02'); // rate constant
  const [avramiN, setAvramiN] = useState<string>('2.5'); // Avrami exponent
  const [avramiTime, setAvramiTime] = useState<string>('30'); // time in minutes/seconds
  const [avramiTargetFraction, setAvramiTargetFraction] = useState<string>('90'); // target transformed fraction (%)

  // --- Thermodynamics & Phase Transformations Calculated State ---
  const [calcLeverWa, setCalcLeverWa] = useState<string>('58.33');
  const [calcLeverWb, setCalcLeverWb] = useState<string>('41.67');
  const [calcLeverError, setCalcLeverError] = useState<string>('');
  
  const [calcLeverTernaryWa, setCalcLeverTernaryWa] = useState<string>('53.33');
  const [calcLeverTernaryWb, setCalcLeverTernaryWb] = useState<string>('26.67');
  const [calcLeverTernaryWc, setCalcLeverTernaryWc] = useState<string>('20.00');
  const [calcLeverTernaryError, setCalcLeverTernaryError] = useState<string>('');

  const [calcGibbsG, setCalcGibbsG] = useState<string>('-49.22');
  const [calcGibbsSpontaneous, setCalcGibbsSpontaneous] = useState<string>('Spontaneous (Exergonic)');
  const [calcGibbsTeq, setCalcGibbsTeq] = useState<string>('708.33'); // K

  const [calcAvramiFraction, setCalcAvramiFraction] = useState<string>('45.12');
  const [calcAvramiTimeRequired, setCalcAvramiTimeRequired] = useState<string>('67.58');

  // --- Transport Phenomena & Diffusion State ---
  // 1. Fick's First Law
  const [fick1Mode, setFick1Mode] = useState<'solve_flux' | 'solve_coefficient'>('solve_flux');
  const [fick1D, setFick1D] = useState<string>('1.2e-11'); // m^2/s
  const [fick1C1, setFick1C1] = useState<string>('5.0'); // kg/m^3
  const [fick1C2, setFick1C2] = useState<string>('2.0'); // kg/m^3
  const [fick1X1, setFick1X1] = useState<string>('0'); // mm
  const [fick1X2, setFick1X2] = useState<string>('2.0'); // mm
  const [fick1J, setFick1J] = useState<string>('1.8e-8'); // kg/m^2.s

  const [calcFick1Flux, setCalcFick1Flux] = useState<string>('1.80e-8');
  const [calcFick1Coef, setCalcFick1Coef] = useState<string>('1.20e-11');
  const [calcFick1Grad, setCalcFick1Grad] = useState<string>('-1500.00');
  const [calcFick1Error, setCalcFick1Error] = useState<string>('');

  // 2. Fick's Second Law
  const [fick2Mode, setFick2Mode] = useState<'solve_cx' | 'solve_x' | 'solve_t'>('solve_cx');
  const [fick2Cs, setFick2Cs] = useState<string>('1.20'); // surface conc (%)
  const [fick2C0, setFick2C0] = useState<string>('0.20'); // initial conc (%)
  const [fick2Cx, setFick2Cx] = useState<string>('0.60'); // target conc (%)
  const [fick2X, setFick2X] = useState<string>('1.5'); // depth (mm)
  const [fick2D, setFick2D] = useState<string>('1.6e-11'); // m^2/s
  const [fick2T, setFick2T] = useState<string>('12'); // time
  const [fick2TUnit, setFick2TUnit] = useState<'s' | 'min' | 'h' | 'day'>('h');

  const [calcFick2Cx, setCalcFick2Cx] = useState<string>('0.63');
  const [calcFick2X, setCalcFick2X] = useState<string>('1.61');
  const [calcFick2T, setCalcFick2T] = useState<string>('10.42');
  const [calcFick2Error, setCalcFick2Error] = useState<string>('');

  // 3. Activation Energy & Arrhenius
  const [diffEnergyMode, setDiffEnergyMode] = useState<'solve_q_single' | 'solve_q_double' | 'solve_d'>('solve_q_double');
  const [diffEnergyD0, setDiffEnergyD0] = useState<string>('2.0e-5'); // m^2/s
  const [diffEnergyD, setDiffEnergyD] = useState<string>('1.5e-11'); // m^2/s
  const [diffEnergyT, setDiffEnergyT] = useState<string>('950'); // °C
  const [diffEnergyTUnit, setDiffEnergyTUnit] = useState<'C' | 'K'>('C');
  const [diffEnergyD1, setDiffEnergyD1] = useState<string>('2.5e-12'); // m^2/s
  const [diffEnergyT1, setDiffEnergyT1] = useState<string>('800'); // °C
  const [diffEnergyD2, setDiffEnergyD2] = useState<string>('3.0e-10'); // m^2/s
  const [diffEnergyT2, setDiffEnergyT2] = useState<string>('1100'); // °C
  const [diffEnergyQ, setDiffEnergyQ] = useState<string>('140'); // kJ/mol

  const [calcDiffEnergyQ_kJ, setCalcDiffEnergyQ_kJ] = useState<string>('140.00');
  const [calcDiffEnergyQ_eV, setCalcDiffEnergyQ_eV] = useState<string>('1.45');
  const [calcDiffEnergyD0, setCalcDiffEnergyD0] = useState<string>('2.00e-5');
  const [calcDiffEnergyD_at_T, setCalcDiffEnergyD_at_T] = useState<string>('1.50e-11');
  const [calcDiffEnergyError, setCalcDiffEnergyError] = useState<string>('');


  // Strain (Macrostrain) State
  const [strainD0, setStrainD0] = useState<string>('4.000');
  const [strainD, setStrainD] = useState<string>('4.015');
  const [calcStrain, setCalcStrain] = useState<string>('0.0000');
  const [calcStrainPercent, setCalcStrainPercent] = useState<string>('0.00');

  // Porosity & Density State
  const [porBulkDensity, setPorBulkDensity] = useState<string>('3.5');
  const [porTrueDensity, setPorTrueDensity] = useState<string>('5.0');
  const [calcPorosity, setCalcPorosity] = useState<string>('0.00');
  const [calcSpecificVol, setCalcSpecificVol] = useState<string>('0.00');

  // Mechanical Properties State
  const [mechForce, setMechForce] = useState<string>('1000'); // N
  const [mechArea, setMechArea] = useState<string>('10'); // mm^2
  const [mechLength, setMechLength] = useState<string>('50'); // mm
  const [mechDeltaLength, setMechDeltaLength] = useState<string>('0.1'); // mm
  const [mechWidth, setMechWidth] = useState<string>('10'); // mm
  const [mechDeltaWidth, setMechDeltaWidth] = useState<string>('-0.006'); // mm
  
  const [calcStress, setCalcStress] = useState<string>('0.00'); // MPa
  const [calcStrainMech, setCalcStrainMech] = useState<string>('0.0000'); 
  const [calcModulus, setCalcModulus] = useState<string>('0.00'); // GPa
  const [calcStrainTransverse, setCalcStrainTransverse] = useState<string>('0.0000');
  const [calcPoissonsRatio, setCalcPoissonsRatio] = useState<string>('0.300');

  const [mechCrackLength, setMechCrackLength] = useState<string>('2'); // mm
  const [mechGeoFactor, setMechGeoFactor] = useState<string>('1.12'); 
  const [calcFractureToughness, setCalcFractureToughness] = useState<string>('0.00'); // MPa sqrt(m)

  const [mechFatigueStrengthCoef, setMechFatigueStrengthCoef] = useState<string>('1000'); // MPa
  const [mechFatigueExponent, setMechFatigueExponent] = useState<string>('-0.1'); 
  const [calcFatigueLife, setCalcFatigueLife] = useState<string>('0'); // cycles

  // Microstructure & Burgers Vector State
  const [microCrystalSystem, setMicroCrystalSystem] = useState<'FCC' | 'BCC' | 'SC' | 'HCP'>('FCC');
  const [microA, setMicroA] = useState<string>('4.0');
  const [microD, setMicroD] = useState<string>('50');
  const [microDensity, setMicroDensity] = useState<string>('5.0');
  
  const [calcBurgers, setCalcBurgers] = useState<string>('0.000');
  const [calcDislocation, setCalcDislocation] = useState<string>('0.00E0');
  const [calcSSA, setCalcSSA] = useState<string>('0.00');

  // Bragg Calculator State
  const [braggWavelength, setBraggWavelength] = useState<string>('1.5406');
  const [bragg2Theta, setBragg2Theta] = useState<string>('');
  const [braggDSpacing, setBraggDSpacing] = useState<string>('');
  const [braggN, setBraggN] = useState<string>('1');

  // Energy-Wavelength Calculator State
  const [energyKev, setEnergyKev] = useState<string>('8.048'); // Cu K-alpha is approx 8.048 keV
  const [energyWave, setEnergyWave] = useState<string>('1.5406');

  // d-Spacing Calculator State
  const [crystalSystem, setCrystalSystem] = useState<'cubic' | 'tetragonal' | 'orthorhombic' | 'hexagonal'>('cubic');
  const [latticeA, setLatticeA] = useState<string>('4.0');
  const [latticeB, setLatticeB] = useState<string>('4.0');
  const [latticeC, setLatticeC] = useState<string>('4.0');
  const [millerH, setMillerH] = useState<string>('1');
  const [millerK, setMillerK] = useState<string>('0');
  const [millerL, setMillerL] = useState<string>('0');
  const [calcDSpacing, setCalcDSpacing] = useState<string>('4.0');

  // Helper to safely parse floats
  const parseNum = (val: string) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getPoissonRatioCategory = (nu: number) => {
    if (nu < 0) return { label: 'Auxetic Behavior', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', desc: 'Expands laterally when stretched. Extremely rare.' };
    if (nu === 0) return { label: 'Zero Transverse Strain', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', desc: 'No lateral expansion or contraction (e.g. Cork).' };
    if (nu > 0 && nu < 0.2) return { label: 'Highly Porous / Concrete', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', desc: 'Low lateral contraction (e.g., foams, concrete).' };
    if (nu >= 0.2 && nu < 0.38) return { label: 'Ductile Metallic / Alloys', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', desc: 'Standard ductile metal alloy/crystal lateral behavior.' };
    if (nu >= 0.38 && nu <= 0.5) return { label: 'Incompressible Elastomer', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', desc: 'Near constant-volume behavior under load (e.g. Rubber).' };
    return { label: 'Extreme Fluidic/Ideal Limit', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', desc: 'Beyond normal solid limits.' };
  };

  // Unit Cell Volume / Density State
  const [volCrystalSystem, setVolCrystalSystem] = useState<'cubic' | 'tetragonal' | 'orthorhombic' | 'hexagonal' | 'monoclinic' | 'triclinic'>('cubic');
  const [volA, setVolA] = useState<string>('4.0');
  const [volB, setVolB] = useState<string>('4.0');
  const [volC, setVolC] = useState<string>('4.0');
  const [volAlpha, setVolAlpha] = useState<string>('90');
  const [volBeta, setVolBeta] = useState<string>('90');
  const [volGamma, setVolGamma] = useState<string>('90');
  const [volZ, setVolZ] = useState<string>('4');
  const [volMolarMass, setVolMolarMass] = useState<string>('58.44'); // NaCl approx
  const [calcVolume, setCalcVolume] = useState<string>('64.00');
  const [calcDensity, setCalcDensity] = useState<string>('0.00');
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const renderUnitCell3D = () => {
    const a = parseFloat(volA) || 4.0;
    const b = parseFloat(volB) || 4.0;
    const c = parseFloat(volC) || 4.0;
    const alphaVal = parseFloat(volAlpha) || 90;
    const betaVal = parseFloat(volBeta) || 90;
    const gammaVal = parseFloat(volGamma) || 90;

    const alpha = alphaVal * Math.PI / 180;
    const beta = betaVal * Math.PI / 180;
    const gamma = gammaVal * Math.PI / 180;

    // Standard fractional coordinates to Cartesian:
    const ax = a;
    const ay = 0;
    const az = 0;

    const bx = b * Math.cos(gamma);
    const by = b * Math.sin(gamma);
    const bz = 0;

    const cx = c * Math.cos(beta);
    let cy = 0;
    if (Math.sin(gamma) !== 0) {
      cy = c * (Math.cos(alpha) - Math.cos(beta) * Math.cos(gamma)) / Math.sin(gamma);
    }
    const czSq = c * c - cx * cx - cy * cy;
    const cz = czSq > 0 ? Math.sqrt(czSq) : 0;

    // 8 vertices in 3D:
    const v3D = [
      { x: 0, y: 0, z: 0 }, // 0
      { x: ax, y: ay, z: az }, // 1
      { x: bx, y: by, z: bz }, // 2
      { x: ax + bx, y: ay + by, z: az + bz }, // 3
      { x: cx, y: cy, z: cz }, // 4
      { x: ax + cx, y: ay + cy, z: az + cz }, // 5
      { x: bx + cx, y: by + cy, z: bz + cz }, // 6
      { x: ax + bx + cx, y: ay + by + cy, z: az + bz + cz } // 7
    ];

    // Orthographic projection
    const project = (pt: { x: number; y: number; z: number }) => {
      const yaw = -35 * Math.PI / 180;
      const pitch = 20 * Math.PI / 180;

      const x1 = pt.x * Math.cos(yaw) - pt.y * Math.sin(yaw);
      const y1 = pt.x * Math.sin(yaw) + pt.y * Math.cos(yaw);
      const z1 = pt.z;

      const x2 = x1;
      const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);

      return { x: x2, y: y2 };
    };

    const projected = v3D.map(project);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    projected.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });

    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;
    const padding = 25;
    const size = 150;

    const scale = Math.min((size - 2 * padding) / dx, (size - 2 * padding) / dy);

    const pts = projected.map(pt => ({
      x: padding + (pt.x - minX) * scale,
      y: size - padding - (pt.y - minY) * scale
    }));

    const edges = [
      [0, 1], [0, 2], [0, 4],
      [1, 3], [2, 3],
      [4, 5], [4, 6],
      [5, 7], [6, 7],
      [1, 5], [2, 6], [3, 7]
    ];

    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Unit Cell Wireframe</span>
        <svg width="100%" height="150" viewBox="0 0 150 150" className="mx-auto overflow-visible">
          <polygon
            points={`${pts[0].x},${pts[0].y} ${pts[1].x},${pts[1].y} ${pts[3].x},${pts[3].y} ${pts[2].x},${pts[2].y}`}
            className="fill-emerald-500/5 stroke-none"
          />
          <polygon
            points={`${pts[4].x},${pts[4].y} ${pts[5].x},${pts[5].y} ${pts[7].x},${pts[7].y} ${pts[6].x},${pts[6].y}`}
            className="fill-emerald-500/10 stroke-none"
          />
          <polygon
            points={`${pts[0].x},${pts[0].y} ${pts[2].x},${pts[2].y} ${pts[6].x},${pts[6].y} ${pts[4].x},${pts[4].y}`}
            className="fill-indigo-500/5 stroke-none"
          />
          <polygon
            points={`${pts[0].x},${pts[0].y} ${pts[1].x},${pts[1].y} ${pts[5].x},${pts[5].y} ${pts[4].x},${pts[4].y}`}
            className="fill-teal-500/5 stroke-none"
          />

          {edges.map(([p1, p2], idx) => {
            let color = "stroke-slate-300 dark:stroke-slate-700";
            let width = "1.5";
            if (p1 === 0 && p2 === 1) { color = "stroke-rose-500"; width = "2"; }
            if (p1 === 0 && p2 === 2) { color = "stroke-emerald-500"; width = "2"; }
            if (p1 === 0 && p2 === 4) { color = "stroke-blue-500"; width = "2"; }

            return (
              <line
                key={idx}
                x1={pts[p1].x}
                y1={pts[p1].y}
                x2={pts[p2].x}
                y2={pts[p2].y}
                className={color}
                strokeWidth={width}
                strokeLinecap="round"
              />
            );
          })}

          {pts.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={idx === 0 ? "5" : "3.5"}
              className={idx === 0 ? "fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 stroke-2" : "fill-emerald-500 dark:fill-emerald-400 stroke-white dark:stroke-slate-900 stroke-1.5"}
            />
          ))}

          <text x={pts[1].x + 8} y={pts[1].y + 2} className="fill-rose-500 text-[8px] font-mono font-bold">a</text>
          <text x={pts[2].x - 8} y={pts[2].y + 2} className="fill-emerald-500 text-[8px] font-mono font-bold">b</text>
          <text x={pts[4].x} y={pts[4].y - 8} className="fill-blue-500 text-[8px] font-mono font-bold text-center">c</text>
        </svg>
        <div className="flex gap-4 mt-2 text-[9px] font-mono font-black uppercase text-slate-400">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>a-axis</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>b-axis</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>c-axis</span>
        </div>
      </div>
    );
  };

  const getAvramiPath = () => {
    const k_val = parseFloat(avramiK) || 0.02;
    const n_val = parseFloat(avramiN) || 2.5;
    if (k_val <= 0 || n_val <= 0) return '';
    
    // Find t_99.9% to scale X axis
    const t999 = Math.pow(-Math.log(1 - 0.999) / k_val, 1 / n_val);
    const tMax = t999 > 0 ? t999 * 1.1 : 100;
    
    const width = 300;
    const height = 150;
    const points: string[] = [];
    
    for (let i = 0; i <= 50; i++) {
      const t = (i / 50) * tMax;
      const y_val = 1 - Math.exp(-k_val * Math.pow(t, n_val));
      
      const xSvg = (t / tMax) * width;
      const ySvg = height - (y_val * height);
      points.push(`${xSvg.toFixed(1)},${ySvg.toFixed(1)}`);
    }
    return `M ${points.join(' L ')}`;
  };

  // Scattering Vector (q) State
  const [qWavelength, setQWavelength] = useState<string>('1.5406');
  const [q2Theta, setQ2Theta] = useState<string>('28.5');
  const [qValue, setQValue] = useState<string>('0.000');

  // --- Handlers for Bragg ---
  const handleBraggFromTheta = () => {
    const wave = parseNum(braggWavelength);
    const theta = parseNum(bragg2Theta) / 2;
    const n = parseNum(braggN);
    if (wave && theta && n) {
      const thetaRad = (theta * Math.PI) / 180;
      const d = (n * wave) / (2 * Math.sin(thetaRad));
      setBraggDSpacing(d.toFixed(5));
    }
  };

  const handleBraggFromD = () => {
    const wave = parseNum(braggWavelength);
    const d = parseNum(braggDSpacing);
    const n = parseNum(braggN);
    if (wave && d && n) {
      const sinTheta = (n * wave) / (2 * d);
      if (sinTheta <= 1 && sinTheta >= -1) {
        const theta = Math.asin(sinTheta) * (180 / Math.PI);
        setBragg2Theta((theta * 2).toFixed(5));
      } else {
        setBragg2Theta('Invalid');
      }
    }
  };

  // --- Handlers for Energy ---
  // E = hc / lambda -> E(keV) = 12.398 / lambda(A)
  const handleEnergyToWave = (eValue: string) => {
    setEnergyKev(eValue);
    const e = parseNum(eValue);
    if (e > 0) {
      setEnergyWave((12.398 / e).toFixed(5));
    } else {
      setEnergyWave('');
    }
  };

  const handleWaveToEnergy = (wValue: string) => {
    setEnergyWave(wValue);
    const w = parseNum(wValue);
    if (w > 0) {
      setEnergyKev((12.398 / w).toFixed(5));
    } else {
      setEnergyKev('');
    }
  };

  // --- Handlers for d-Spacing ---
  useEffect(() => {
    const h = parseNum(millerH);
    const k = parseNum(millerK);
    const l = parseNum(millerL);
    const a = parseNum(latticeA);
    const b = parseNum(latticeB);
    const c = parseNum(latticeC);

    if (h===0 && k===0 && l===0) {
      setCalcDSpacing('0.00000');
      return;
    }

    let dSqInv = 0;
    if (crystalSystem === 'cubic' && a > 0) {
      dSqInv = (h * h + k * k + l * l) / (a * a);
    } else if (crystalSystem === 'tetragonal' && a > 0 && c > 0) {
      dSqInv = (h * h + k * k) / (a * a) + (l * l) / (c * c);
    } else if (crystalSystem === 'orthorhombic' && a > 0 && b > 0 && c > 0) {
      dSqInv = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
    } else if (crystalSystem === 'hexagonal' && a > 0 && c > 0) {
      dSqInv = (4 / 3) * ((h * h + h * k + k * k) / (a * a)) + (l * l) / (c * c);
    }

    if (dSqInv > 0) {
      setCalcDSpacing(Math.sqrt(1 / dSqInv).toFixed(5));
    } else {
      setCalcDSpacing('0.00000');
    }
  }, [crystalSystem, latticeA, latticeB, latticeC, millerH, millerK, millerL]);

  // --- Handlers for Volume & Density ---
  useEffect(() => {
    const a = parseNum(volA);
    const b = parseNum(volB);
    const c = parseNum(volC);
    const alphaRad = parseNum(volAlpha) * (Math.PI / 180);
    const betaRad = parseNum(volBeta) * (Math.PI / 180);
    const gammaRad = parseNum(volGamma) * (Math.PI / 180);
    const z = parseNum(volZ);
    const m = parseNum(volMolarMass);

    let v = 0;
    if (volCrystalSystem === 'cubic') {
      v = a * a * a;
    } else if (volCrystalSystem === 'tetragonal') {
      v = a * a * c;
    } else if (volCrystalSystem === 'orthorhombic') {
      v = a * b * c;
    } else if (volCrystalSystem === 'hexagonal') {
      v = a * a * c * Math.sin(120 * (Math.PI / 180));
    } else if (volCrystalSystem === 'monoclinic') {
      v = a * b * c * Math.sin(betaRad);
    } else if (volCrystalSystem === 'triclinic') {
      const cosA = Math.cos(alphaRad);
      const cosB = Math.cos(betaRad);
      const cosG = Math.cos(gammaRad);
      v = a * b * c * Math.sqrt(1 - cosA*cosA - cosB*cosB - cosG*cosG + 2*cosA*cosB*cosG);
    }

    setCalcVolume(v > 0 ? v.toFixed(3) : '0.000');

    if (v > 0 && z > 0 && m > 0) {
      // Density = (Z * M) / (V * N_A)
      // V is in A^3 (10^-24 cm^3), N_A = 6.022e23
      // density = (Z * M) / (V * 0.6022)  in g/cm^3
      const density = (z * m) / (v * 0.602214076);
      setCalcDensity(density.toFixed(3));
    } else {
      setCalcDensity('0.000');
    }
  }, [volCrystalSystem, volA, volB, volC, volAlpha, volBeta, volGamma, volZ, volMolarMass]);

  // --- Handlers for Scattering Vector (q) ---
  useEffect(() => {
    const wave = parseNum(qWavelength);
    const theta = parseNum(q2Theta) / 2;

    if (wave > 0 && theta > 0) {
      const thetaRad = theta * (Math.PI / 180);
      const q = (4 * Math.PI * Math.sin(thetaRad)) / wave;
      setQValue(q.toFixed(4));
    } else {
      setQValue('0.000');
    }
  }, [qWavelength, q2Theta]);

  // --- Handlers for Microstructure & Burgers ---
  useEffect(() => {
    const a = parseNum(microA);
    const D = parseNum(microD);
    const density = parseNum(microDensity);

    let b = 0;
    if (microCrystalSystem === 'FCC') {
      b = (a * Math.sqrt(2)) / 2;
    } else if (microCrystalSystem === 'BCC') {
      b = (a * Math.sqrt(3)) / 2;
    } else if (microCrystalSystem === 'SC' || microCrystalSystem === 'HCP') {
      b = a;
    }
    setCalcBurgers(b > 0 ? b.toFixed(4) : '0.0000');

    if (D > 0) {
      const delta = 1 / Math.pow(D * 1e-9, 2);
      setCalcDislocation(delta.toExponential(2));
    } else {
      setCalcDislocation('0.00e+0');
    }

    if (D > 0 && density > 0) {
      const ssa = 6000 / (D * density);
      setCalcSSA(ssa.toFixed(2));
    } else {
      setCalcSSA('0.00');
    }
  }, [microCrystalSystem, microA, microD, microDensity]);

  // --- Handlers for Strain & Porosity ---
  useEffect(() => {
    const d0 = parseNum(strainD0);
    const d = parseNum(strainD);
    if (d0 > 0 && d > 0) {
      const strain = (d - d0) / d0;
      setCalcStrain(strain.toExponential(4));
      setCalcStrainPercent((strain * 100).toFixed(4));
    } else {
      setCalcStrain('0.0000');
      setCalcStrainPercent('0.00');
    }
  }, [strainD0, strainD]);

  useEffect(() => {
    const bulk = parseNum(porBulkDensity);
    const trueDens = parseNum(porTrueDensity);
    if (trueDens > 0 && bulk > 0) {
      const porosity = (1 - (bulk / trueDens)) * 100;
      setCalcPorosity(Math.max(0, porosity).toFixed(2));
      const specVol = 1 / bulk;
      setCalcSpecificVol(specVol.toFixed(4));
    } else {
      setCalcPorosity('0.00');
      setCalcSpecificVol('0.00');
    }
  }, [porBulkDensity, porTrueDensity]);

  // --- Handlers for Mechanics ---
  useEffect(() => {
    const F = parseNum(mechForce);
    const A = parseNum(mechArea);
    const L0 = parseNum(mechLength);
    const dL = parseNum(mechDeltaLength);
    const w0 = parseNum(mechWidth);
    const dw = parseNum(mechDeltaWidth);

    let stress = 0;
    let strain = 0;
    let modulus = 0;

    if (A > 0) {
      stress = F / A; // MPa if F in N, A in mm^2
      setCalcStress(stress.toFixed(2));
    } else {
      setCalcStress('0.00');
    }

    if (L0 > 0) {
      strain = dL / L0;
      setCalcStrainMech(strain.toExponential(4));
    } else {
      setCalcStrainMech('0.0000');
    }

    if (strain > 0 && stress > 0) {
      modulus = stress / strain; // MPa
      setCalcModulus((modulus / 1000).toFixed(2)); // GPa
    } else {
      setCalcModulus('0.00');
    }

    // Poisson's Ratio Calculation
    let strainTransverse = 0;
    if (w0 > 0) {
      strainTransverse = dw / w0;
      setCalcStrainTransverse(strainTransverse.toExponential(4));
    } else {
      setCalcStrainTransverse('0.0000');
    }

    if (Math.abs(strain) > 0 && Math.abs(strainTransverse) > 0) {
      const pr = -strainTransverse / strain;
      setCalcPoissonsRatio(pr.toFixed(3));
    } else {
      setCalcPoissonsRatio('0.000');
    }

    const a = parseNum(mechCrackLength); // mm
    const Y = parseNum(mechGeoFactor);

    if (stress > 0 && a > 0) {
      // a needs to be in meters for MPa sqrt(m)
      const a_m = a / 1000;
      const K1c = Y * stress * Math.sqrt(Math.PI * a_m);
      setCalcFractureToughness(K1c.toFixed(2));
    } else {
      setCalcFractureToughness('0.00');
    }

    const sf = parseNum(mechFatigueStrengthCoef);
    const b = parseNum(mechFatigueExponent);

    if (stress > 0 && sf > 0 && b < 0) {
      // stress is used as stress amplitude (sigma_a)
      // Basquin equation: sigma_a = sf * (2 * Nf)^b
      // 2 * Nf = (sigma_a / sf)^(1/b)
      // Nf = 0.5 * (sigma_a / sf)^(1/b)
      const Nf = 0.5 * Math.pow(stress / sf, 1 / b);
      if (Nf > 1e12) {
        setCalcFatigueLife('> 1e12');
      } else {
        setCalcFatigueLife(Nf.toExponential(2));
      }
    } else {
      setCalcFatigueLife('0');
    }

  }, [mechForce, mechArea, mechLength, mechDeltaLength, mechWidth, mechDeltaWidth, mechCrackLength, mechGeoFactor, mechFatigueStrengthCoef, mechFatigueExponent]);

  // --- Handlers for Thermodynamics & Phase Transformations ---
  useEffect(() => {
    // 1. Binary Lever Rule
    const ca = parseNum(leverCa);
    const cb = parseNum(leverCb);
    const c0 = parseNum(leverC0);

    if (ca === cb) {
      setCalcLeverError('Phase compositions Ca and Cb must be different.');
      setCalcLeverWa('0.00');
      setCalcLeverWb('0.00');
    } else {
      const minC = Math.min(ca, cb);
      const maxC = Math.max(ca, cb);
      if (c0 < minC || c0 > maxC) {
        setCalcLeverError(`Overall composition C0 must lie between ${minC}% and ${maxC}%.`);
        setCalcLeverWa('0.00');
        setCalcLeverWb('0.00');
      } else {
        setCalcLeverError('');
        // Lever rule: Wa = (Cb - C0) / (Cb - Ca)
        const wa = (cb - c0) / (cb - ca);
        const wb = (c0 - ca) / (cb - ca);
        setCalcLeverWa((wa * 100).toFixed(2));
        setCalcLeverWb((wb * 100).toFixed(2));
      }
    }

    // 2. Ternary Lever Rule
    const taX = parseNum(leverTaX);
    const taY = parseNum(leverTaY);
    const tbX = parseNum(leverTbX);
    const tbY = parseNum(leverTbY);
    const tcX = parseNum(leverTcX);
    const tcY = parseNum(leverTcY);
    const t0X = parseNum(leverT0X);
    const t0Y = parseNum(leverT0Y);

    const D = taX * (tbY - tcY) + tbX * (tcY - taY) + tcX * (taY - tbY);
    if (Math.abs(D) < 1e-6) {
      setCalcLeverTernaryError('The three phases are collinear. Cannot determine ternary fractions.');
      setCalcLeverTernaryWa('0.00');
      setCalcLeverTernaryWb('0.00');
      setCalcLeverTernaryWc('0.00');
    } else {
      const Da = t0X * (tbY - tcY) + tbX * (tcY - t0Y) + tcX * (t0Y - tbY);
      const Db = taX * (t0Y - tcY) + t0X * (tcY - taY) + tcX * (taY - t0Y);
      const Dc = taX * (tbY - t0Y) + tbX * (t0Y - taY) + t0X * (taY - tbY);

      const wa = Da / D;
      const wb = Db / D;
      const wc = Dc / D;

      if (wa < -0.0001 || wa > 1.0001 || wb < -0.0001 || wb > 1.0001 || wc < -0.0001 || wc > 1.0001) {
        setCalcLeverTernaryError('Overall composition lies outside the phase triangle (impossible coexistence).');
        setCalcLeverTernaryWa((Math.max(0, Math.min(1, wa)) * 100).toFixed(2));
        setCalcLeverTernaryWb((Math.max(0, Math.min(1, wb)) * 100).toFixed(2));
        setCalcLeverTernaryWc((Math.max(0, Math.min(1, wc)) * 100).toFixed(2));
      } else {
        setCalcLeverTernaryError('');
        setCalcLeverTernaryWa((wa * 100).toFixed(2));
        setCalcLeverTernaryWb((wb * 100).toFixed(2));
        setCalcLeverTernaryWc((wc * 100).toFixed(2));
      }
    }

    // 3. Gibbs Free Energy
    const dH = parseNum(gibbsH); // kJ/mol
    const dS = parseNum(gibbsS); // J/mol K
    const tVal = parseNum(gibbsT);
    
    let tK = tVal;
    if (gibbsTUnit === 'C') {
      tK = tVal + 273.15;
    }

    if (tK < 0) {
      setCalcGibbsG('Error');
      setCalcGibbsSpontaneous('Temperature cannot be below absolute zero (0 K).');
      setCalcGibbsTeq('0.00');
    } else {
      // dG = dH - T * dS / 1000
      const dG = dH - (tK * dS / 1000);
      setCalcGibbsG(dG.toFixed(2));
      
      if (dG < 0) {
        setCalcGibbsSpontaneous('Spontaneous (Exergonic) - Phase change is thermodynamically favorable.');
      } else if (dG > 0) {
        setCalcGibbsSpontaneous('Non-Spontaneous (Endergonic) - Reaction/transformation requires external work.');
      } else {
        setCalcGibbsSpontaneous('Thermodynamic Equilibrium.');
      }

      if (dS !== 0) {
        const TeqK = (dH * 1000) / dS;
        if (gibbsTUnit === 'C') {
          setCalcGibbsTeq((TeqK - 273.15).toFixed(2));
        } else {
          setCalcGibbsTeq(TeqK.toFixed(2));
        }
      } else {
        setCalcGibbsTeq('Infinite');
      }
    }

    // 4. Avrami Kinetics
    const k = parseNum(avramiK);
    const n = parseNum(avramiN);
    const t = parseNum(avramiTime);
    const targetY = parseNum(avramiTargetFraction) / 100; // 0 to 1

    if (k <= 0 || n <= 0) {
      setCalcAvramiFraction('0.00');
      setCalcAvramiTimeRequired('0.00');
    } else {
      // Fraction transformed
      if (t >= 0) {
        const Y = 1 - Math.exp(-k * Math.pow(t, n));
        setCalcAvramiFraction((Y * 100).toFixed(2));
      } else {
        setCalcAvramiFraction('0.00');
      }

      // Time required
      if (targetY > 0 && targetY < 1) {
        const tReq = Math.pow(-Math.log(1 - targetY) / k, 1 / n);
        setCalcAvramiTimeRequired(tReq.toFixed(2));
      } else {
        setCalcAvramiTimeRequired('0.00');
      }
    }

  }, [
    leverCa, leverCb, leverC0,
    leverTaX, leverTaY, leverTbX, leverTbY, leverTcX, leverTcY, leverT0X, leverT0Y,
    gibbsH, gibbsS, gibbsT, gibbsTUnit,
    avramiK, avramiN, avramiTime, avramiTargetFraction
  ]);

  // --- Transport Phenomena & Diffusion Calculations ---
  useEffect(() => {
    // Helper function for temperature in Kelvin
    const getTempK = (tempVal: number, unit: 'C' | 'K') => {
      return unit === 'C' ? tempVal + 273.15 : tempVal;
    };

    // Helper functions for error function erf and erfInverse
    const erf = (xVal: number): number => {
      const sign = xVal < 0 ? -1 : 1;
      const absX = Math.abs(xVal);
      const p = 0.3275911;
      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const tTerm = 1.0 / (1.0 + p * absX);
      const yVal = 1.0 - (((((a5 * tTerm + a4) * tTerm + a3) * tTerm + a2) * tTerm + a1) * tTerm * Math.exp(-absX * absX));
      return sign * yVal;
    };

    const erfInverse = (xVal: number): number => {
      if (xVal === 0) return 0;
      if (xVal >= 1) return 5; // practical upper limit for numerical safety
      if (xVal <= -1) return -5;
      const sign = xVal < 0 ? -1 : 1;
      const absX = Math.abs(xVal);
      const aVal = 0.147;
      const logTerm = Math.log(1 - absX * absX);
      const term1 = 2 / (Math.PI * aVal) + logTerm / 2;
      const term2 = logTerm / aVal;
      const innerSqrt = Math.sqrt(Math.max(0, term1 * term1 - term2));
      const val = Math.sqrt(Math.max(0, innerSqrt - term1));
      return sign * val;
    };

    // 1. Fick's First Law
    const f1D = parseNum(fick1D);
    const f1C1 = parseNum(fick1C1);
    const f1C2 = parseNum(fick1C2);
    const f1X1 = parseNum(fick1X1);
    const f1X2 = parseNum(fick1X2);
    const f1JInput = parseNum(fick1J);

    if (f1X1 === f1X2) {
      setCalcFick1Error('Positions x1 and x2 must be different.');
      setCalcFick1Flux('0.00');
      setCalcFick1Coef('0.00');
      setCalcFick1Grad('0.00');
    } else {
      setCalcFick1Error('');
      const dx_m = (f1X2 - f1X1) * 1e-3; // convert mm to m
      const grad = (f1C2 - f1C1) / dx_m;
      setCalcFick1Grad(grad.toFixed(2));

      if (fick1Mode === 'solve_flux') {
        const flux = -f1D * grad;
        setCalcFick1Flux(flux.toExponential(3));
      } else {
        if (grad === 0) {
          setCalcFick1Error('Concentration gradient is zero. Cannot solve for Diffusion Coefficient.');
          setCalcFick1Coef('0.00');
        } else {
          const solvedD = Math.abs(f1JInput / grad);
          setCalcFick1Coef(solvedD.toExponential(3));
        }
      }
    }

    // 2. Fick's Second Law
    const cs = parseNum(fick2Cs);
    const c0 = parseNum(fick2C0);
    const cxInput = parseNum(fick2Cx);
    const dX_mm = parseNum(fick2X);
    const D2 = parseNum(fick2D);
    const tInput = parseNum(fick2T);

    // convert t to seconds
    let tSec = tInput;
    if (fick2TUnit === 'min') tSec = tInput * 60;
    else if (fick2TUnit === 'h') tSec = tInput * 3600;
    else if (fick2TUnit === 'day') tSec = tInput * 86400;

    if (cs === c0) {
      setCalcFick2Error('Surface concentration Cs and bulk concentration C0 must be different.');
      setCalcFick2Cx('0.00');
      setCalcFick2X('0.00');
      setCalcFick2T('0.00');
    } else {
      setCalcFick2Error('');
      const dX_m = dX_mm * 1e-3;

      // a) Solve for Cx
      if (D2 <= 0 || tSec <= 0) {
        setCalcFick2Cx(c0.toFixed(2));
      } else {
        const z = dX_m / (2 * Math.sqrt(D2 * tSec));
        const cxSolved = c0 + (cs - c0) * (1 - erf(z));
        setCalcFick2Cx(cxSolved.toFixed(4));
      }

      // b) Solve for X or T: requires target Cx to be between C0 and Cs
      const minC = Math.min(c0, cs);
      const maxC = Math.max(c0, cs);
      if (cxInput <= minC || cxInput >= maxC) {
        setCalcFick2Error(`Target concentration Cx must lie strictly between C0 (${minC}%) and Cs (${cs}%).`);
        setCalcFick2X('0.00');
        setCalcFick2T('0.00');
      } else {
        const ratio = (cs - cxInput) / (cs - c0);
        const z = erfInverse(ratio);

        if (z <= 0) {
          setCalcFick2Error('Error calculating erf inverse.');
          setCalcFick2X('0.00');
          setCalcFick2T('0.00');
        } else {
          // Solve Depth x = 2 * z * sqrt(D * t)
          if (D2 > 0 && tSec > 0) {
            const xSolved_m = 2 * z * Math.sqrt(D2 * tSec);
            const xSolved_mm = xSolved_m * 1e3;
            setCalcFick2X(xSolved_mm.toFixed(3));
          } else {
            setCalcFick2X('0.00');
          }

          // Solve Time t = (x^2) / (4 * D * z^2)
          if (D2 > 0 && dX_m > 0) {
            const tSolved_sec = (dX_m * dX_m) / (4 * D2 * z * z);
            let tSolved_display = tSolved_sec;
            if (fick2TUnit === 'min') tSolved_display = tSolved_sec / 60;
            else if (fick2TUnit === 'h') tSolved_display = tSolved_sec / 3600;
            else if (fick2TUnit === 'day') tSolved_display = tSolved_sec / 86400;
            setCalcFick2T(tSolved_display.toFixed(2));
          } else {
            setCalcFick2T('0.00');
          }
        }
      }
    }

    // 3. Activation Energy & Arrhenius
    const R_J = 8.314462618;
    const R_eV = 8.617333262e-5;

    const d0 = parseNum(diffEnergyD0);
    const dVal = parseNum(diffEnergyD);
    const tVal = parseNum(diffEnergyT);
    const d1 = parseNum(diffEnergyD1);
    const t1 = parseNum(diffEnergyT1);
    const d2 = parseNum(diffEnergyD2);
    const t2 = parseNum(diffEnergyT2);
    const qInput_kJ = parseNum(diffEnergyQ);

    if (diffEnergyMode === 'solve_q_single') {
      const TK = getTempK(tVal, diffEnergyTUnit);
      if (TK <= 0) {
        setCalcDiffEnergyError('Temperature must be greater than absolute zero.');
        setCalcDiffEnergyQ_kJ('0.00');
        setCalcDiffEnergyQ_eV('0.00');
      } else if (d0 <= 0 || dVal <= 0) {
        setCalcDiffEnergyError('D0 and D must be greater than 0.');
        setCalcDiffEnergyQ_kJ('0.00');
        setCalcDiffEnergyQ_eV('0.00');
      } else {
        setCalcDiffEnergyError('');
        const Q_J = -R_J * TK * Math.log(dVal / d0);
        const Q_kJ = Q_J / 1000;
        const Q_eV = -R_eV * TK * Math.log(dVal / d0);
        setCalcDiffEnergyQ_kJ(Q_kJ.toFixed(2));
        setCalcDiffEnergyQ_eV(Q_eV.toFixed(3));
      }
    } else if (diffEnergyMode === 'solve_q_double') {
      const TK1 = getTempK(t1, diffEnergyTUnit);
      const TK2 = getTempK(t2, diffEnergyTUnit);

      if (TK1 <= 0 || TK2 <= 0) {
        setCalcDiffEnergyError('Temperatures T1 and T2 must be greater than absolute zero.');
        setCalcDiffEnergyQ_kJ('0.00');
        setCalcDiffEnergyQ_eV('0.00');
        setCalcDiffEnergyD0('0.00');
      } else if (TK1 === TK2) {
        setCalcDiffEnergyError('Temperatures T1 and T2 must be different.');
        setCalcDiffEnergyQ_kJ('0.00');
        setCalcDiffEnergyQ_eV('0.00');
        setCalcDiffEnergyD0('0.00');
      } else if (d1 <= 0 || d2 <= 0) {
        setCalcDiffEnergyError('Diffusion coefficients D1 and D2 must be greater than 0.');
        setCalcDiffEnergyQ_kJ('0.00');
        setCalcDiffEnergyQ_eV('0.00');
        setCalcDiffEnergyD0('0.00');
      } else {
        setCalcDiffEnergyError('');
        const invTDiff = (1 / TK2) - (1 / TK1);
        const Q_J = (R_J * Math.log(d1 / d2)) / invTDiff;
        const Q_kJ = Q_J / 1000;
        const Q_eV = (R_eV * Math.log(d1 / d2)) / invTDiff;

        setCalcDiffEnergyQ_kJ(Q_kJ.toFixed(2));
        setCalcDiffEnergyQ_eV(Q_eV.toFixed(3));

        const calculatedD0 = d1 * Math.exp(Q_J / (R_J * TK1));
        setCalcDiffEnergyD0(calculatedD0.toExponential(3));
      }
    } else {
      const TK = getTempK(tVal, diffEnergyTUnit);
      if (TK <= 0) {
        setCalcDiffEnergyError('Temperature must be greater than absolute zero.');
        setCalcDiffEnergyD_at_T('0.00');
      } else if (d0 <= 0) {
        setCalcDiffEnergyError('Pre-exponential factor D0 must be greater than 0.');
        setCalcDiffEnergyD_at_T('0.00');
      } else {
        setCalcDiffEnergyError('');
        const Q_J = qInput_kJ * 1000;
        const D_solved = d0 * Math.exp(-Q_J / (R_J * TK));
        setCalcDiffEnergyD_at_T(D_solved.toExponential(3));
      }
    }

  }, [
    fick1Mode, fick1D, fick1C1, fick1C2, fick1X1, fick1X2, fick1J,
    fick2Mode, fick2Cs, fick2C0, fick2Cx, fick2X, fick2D, fick2T, fick2TUnit,
    diffEnergyMode, diffEnergyD0, diffEnergyD, diffEnergyT, diffEnergyTUnit, diffEnergyD1, diffEnergyT1, diffEnergyD2, diffEnergyT2, diffEnergyQ
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden">
        {/* Subtle inner gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/30">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            Crystallography Calculator
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Compute essential XRD, crystallographic, and mechanical parameters with high precision.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-3 flex flex-col gap-6">
          {[
            {
              group: "Crystallography",
              items: [
                { id: 'dspacing', label: "d-Spacing / Cell", icon: Box },
                { id: 'volume', label: "Volume & Density", icon: Layers },
                { id: 'microstructure', label: "Microstructure", icon: Grid },
              ]
            },
            {
              group: "Physics & Thermodynamics",
              items: [
                { id: 'energy', label: "Energy / Wavelength", icon: Zap },
                { id: 'thermo', label: "Thermodynamics", icon: Flame },
                { id: 'diffusion', label: "Diffusion & Transport", icon: Activity },
              ]
            },
            {
              group: "Mechanical Properties",
              items: [
                { id: 'strain', label: "Lattice Strain", icon: MoveHorizontal },
                { id: 'porosity', label: "Porosity", icon: PieChart },
                { id: 'mechanics', label: "Mechanics", icon: Wrench },
              ]
            }
          ].map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2">{cat.group}</h4>
              <div className="flex flex-col gap-2">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeCalc === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveCalc(item.id as any)}
                      className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/25'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-800'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {item.label}
                      <ChevronRight className={`w-4 h-4 ml-auto transition-transform duration-300 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-9">
          
          {activeCalc === 'energy' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Energy / Wavelength Converter
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">E(keV) = 12.398 / λ(Å)</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl relative">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Photon Energy (keV)</label>
                      <FormulaTooltip formula="E = h * c / λ ≈ 12.398 / λ" description="Energy of the X-ray photon, inversely proportional to wavelength." />
                    </div>
                    <input 
                      type="number"
                      value={energyKev}
                      onChange={e => handleEnergyToWave(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-lg font-bold"
                      placeholder="e.g. 8.048"
                    />
                    <div className="absolute right-4 top-4 text-xs font-bold text-slate-400">keV</div>
                  </div>

                  <div className="space-y-1.5 p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl relative">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Wavelength (Å)</label>
                      <FormulaTooltip formula="λ = h * c / E ≈ 12.398 / E" description="De Broglie wavelength of the diffracting X-ray photon." />
                    </div>
                    <input 
                      type="number"
                      value={energyWave}
                      onChange={e => handleWaveToEnergy(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-lg font-bold"
                      placeholder="e.g. 1.5406"
                    />
                    <div className="absolute right-4 top-4 text-xs font-bold text-slate-400">Å</div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <EnergyWaveVisualizer energyKev={parseFloat(energyKev)} wavelength={parseFloat(energyWave)} />
                </div>
              </div>
            </div>
          )}

          {activeCalc === 'dspacing' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Box className="w-5 h-5 text-rose-500" />
                    d-Spacing from Lattice Parameters
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Calculate interplanar spacing for (hkl) planes.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={crystalSystem}
                    onChange={e => setCrystalSystem(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-bold dark:text-white outline-none focus:border-rose-500"
                  >
                    <option value="cubic">Cubic</option>
                    <option value="tetragonal">Tetragonal</option>
                    <option value="orthorhombic">Orthorhombic</option>
                    <option value="hexagonal">Hexagonal</option>
                  </select>
                  {onSaveToHistory && (
                    <button 
                      onClick={() => {
                        const d = parseNum(calcDSpacing) || 0;
                        const wave = 1.5406;
                        const thetaRad = Math.asin(wave / (2 * d));
                        const t2 = (thetaRad * (180 / Math.PI)) * 2;
                        const q = d > 0 ? (2 * Math.PI) / d : 0;
                        onSaveToHistory('d-Spacing Calc', wave, isNaN(t2) ? 0 : t2, d, q);
                      }}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Lattice Parameters (Å)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">a</label>
                        <FormulaTooltip formula="a" description="Lattice parameter along the a-axis (Å)." />
                      </div>
                      <input 
                        type="number"
                        value={latticeA}
                        onChange={e => setLatticeA(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">b</label>
                        <FormulaTooltip formula="b" description="Lattice parameter along the b-axis (Å)." />
                      </div>
                      <input 
                        type="number"
                        value={latticeB}
                        onChange={e => setLatticeB(e.target.value)}
                        disabled={crystalSystem === 'cubic' || crystalSystem === 'tetragonal' || crystalSystem === 'hexagonal'}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">c</label>
                        <FormulaTooltip formula="c" description="Lattice parameter along the c-axis (Å)." />
                      </div>
                      <input 
                        type="number"
                        value={latticeC}
                        onChange={e => setLatticeC(e.target.value)}
                        disabled={crystalSystem === 'cubic'}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider pt-2">Miller Indices (hkl)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">h</label>
                        <FormulaTooltip formula="h index" description="Reciprocal intercept with a-axis." />
                      </div>
                      <input 
                        type="number"
                        value={millerH}
                        onChange={e => setMillerH(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">k</label>
                        <FormulaTooltip formula="k index" description="Reciprocal intercept with b-axis." />
                      </div>
                      <input 
                        type="number"
                        value={millerK}
                        onChange={e => setMillerK(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">l</label>
                        <FormulaTooltip formula="l index" description="Reciprocal intercept with c-axis." />
                      </div>
                      <input 
                        type="number"
                        value={millerL}
                        onChange={e => setMillerL(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
                    <span className="text-[11px] font-black uppercase tracking-widest text-rose-500 mb-2">Calculated d-spacing</span>
                    <div className="text-4xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                      {calcDSpacing}
                      <span className="text-xl text-slate-400">Å</span>
                    </div>
                    <div className="mt-4 px-3 py-1.5 bg-rose-100 dark:bg-rose-500/20 rounded-lg border border-rose-200 dark:border-rose-500/30">
                      <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">
                        ({millerH}{millerK}{millerL}) Plane
                      </span>
                    </div>
                  </div>

                  <MillerPlaneVisualizer
                    system={crystalSystem}
                    a={parseFloat(latticeA) || 4.0}
                    b={parseFloat(latticeB) || 4.0}
                    c={parseFloat(latticeC) || 4.0}
                    h={parseFloat(millerH) || 1}
                    k={parseFloat(millerK) || 0}
                    l={parseFloat(millerL) || 0}
                  />
                </div>
              </div>
            </div>
          )}

          {activeCalc === 'volume' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-500" />
                    Unit Cell Volume & Theoretical Density
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Calculate volume (V) and X-ray density (ρ).</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preset:</span>
                    <select
                      value={selectedPreset}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedPreset(val);
                        const preset = MATERIAL_PRESETS.find(p => p.name === val);
                        if (preset) {
                          setVolCrystalSystem(preset.system);
                          setVolA(preset.a);
                          setVolB(preset.b);
                          setVolC(preset.c);
                          setVolAlpha(preset.alpha);
                          setVolBeta(preset.beta);
                          setVolGamma(preset.gamma);
                          setVolZ(preset.Z);
                          setVolMolarMass(preset.M);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold dark:text-white outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Custom / Manual --</option>
                      {MATERIAL_PRESETS.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System:</span>
                    <select
                      value={volCrystalSystem}
                      onChange={e => {
                        setVolCrystalSystem(e.target.value as any);
                        setSelectedPreset('');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold dark:text-white outline-none focus:border-emerald-500"
                    >
                      <option value="cubic">Cubic</option>
                      <option value="tetragonal">Tetragonal</option>
                      <option value="orthorhombic">Orthorhombic</option>
                      <option value="hexagonal">Hexagonal</option>
                      <option value="monoclinic">Monoclinic</option>
                      <option value="triclinic">Triclinic</option>
                    </select>
                  </div>
                </div>
              </div>

              {selectedPreset && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  <strong>Loaded Preset ({selectedPreset}):</strong> {MATERIAL_PRESETS.find(p => p.name === selectedPreset)?.description}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Lattice Parameters (Å)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">a</label>
                        <FormulaTooltip formula="a" description="Lattice parameter along the a-axis (Å)." />
                      </div>
                      <input 
                        type="number"
                        value={volA}
                        onChange={e => {
                          setVolA(e.target.value);
                          setSelectedPreset('');
                        }}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">b</label>
                        <FormulaTooltip formula="b" description="Lattice parameter along the b-axis (Å)." />
                      </div>
                      <input 
                        type="number"
                        value={volB}
                        onChange={e => {
                          setVolB(e.target.value);
                          setSelectedPreset('');
                        }}
                        disabled={['cubic', 'tetragonal', 'hexagonal'].includes(volCrystalSystem)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">c</label>
                        <FormulaTooltip formula="c" description="Lattice parameter along the c-axis (Å)." />
                      </div>
                      <input 
                        type="number"
                        value={volC}
                        onChange={e => {
                          setVolC(e.target.value);
                          setSelectedPreset('');
                        }}
                        disabled={volCrystalSystem === 'cubic'}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {['monoclinic', 'triclinic'].includes(volCrystalSystem) && (
                    <>
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider pt-2">Lattice Angles (°)</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-bold text-slate-500 ml-1">α</label>
                            <FormulaTooltip formula="α" description="Angle between b and c axes (degrees)." />
                          </div>
                          <input 
                            type="number"
                            value={volAlpha}
                            onChange={e => {
                              setVolAlpha(e.target.value);
                              setSelectedPreset('');
                            }}
                            disabled={volCrystalSystem === 'monoclinic'}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-bold text-slate-500 ml-1">β</label>
                            <FormulaTooltip formula="β" description="Angle between a and c axes (degrees)." />
                          </div>
                          <input 
                            type="number"
                            value={volBeta}
                            onChange={e => {
                              setVolBeta(e.target.value);
                              setSelectedPreset('');
                            }}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-bold text-slate-500 ml-1">γ</label>
                            <FormulaTooltip formula="γ" description="Angle between a and b axes (degrees)." />
                          </div>
                          <input 
                            type="number"
                            value={volGamma}
                            onChange={e => {
                              setVolGamma(e.target.value);
                              setSelectedPreset('');
                            }}
                            disabled={volCrystalSystem === 'monoclinic'}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider pt-2">Composition Data</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">Z (Formula units/cell)</label>
                        <FormulaTooltip formula="Z" description="Number of formula units in the unit cell." />
                      </div>
                      <input 
                        type="number"
                        value={volZ}
                        onChange={e => {
                          setVolZ(e.target.value);
                          setSelectedPreset('');
                        }}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-bold text-slate-500 ml-1">Molar Mass (g/mol)</label>
                        <FormulaTooltip formula="M" description="Molar mass of compound (g/mol)." />
                      </div>
                      <input 
                        type="number"
                        value={volMolarMass}
                        onChange={e => {
                          setVolMolarMass(e.target.value);
                          setSelectedPreset('');
                        }}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/85 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 rounded-2xl relative shadow-[0_4px_20px_-3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Volume (V)</span>
                      <div className="text-2xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-1.5">
                        {calcVolume}
                        <span className="text-xs text-slate-400">Å³</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-teal-50/85 dark:bg-teal-500/10 border border-teal-200/60 dark:border-teal-500/20 rounded-2xl relative shadow-[0_4px_20px_-3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-1">X-ray Density (ρ)</span>
                      <div className="text-2xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-1.5">
                        {calcDensity}
                        <span className="text-xs text-slate-400">g/cm³</span>
                      </div>
                    </div>
                  </div>

                  {renderUnitCell3D()}
                </div>
              </div>
            </div>
          )}



          {activeCalc === 'microstructure' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Grid className="w-5 h-5 text-blue-500" />
                    Burgers Vector & Microstructure
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">b, δ = 1/D², SSA = 6000/(D·ρ)</p>
                </div>
                {onSaveToHistory && (
                  <button 
                    onClick={() => {
                      const b = parseNum(calcBurgers) || 0;
                      onSaveToHistory('Microstructure Calc', 1.5406, 0, b, 0);
                    }}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Crystal System</label>
                      <FormulaTooltip formula="FCC: (a√2)/2 | BCC: (a√3)/2 | SC/HCP: a" description="Structural symmetry used to compute the slip magnitude (Burgers vector)." />
                    </div>
                    <select
                      value={microCrystalSystem}
                      onChange={e => setMicroCrystalSystem(e.target.value as any)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold"
                    >
                      <option value="FCC">FCC (Face-Centered Cubic)</option>
                      <option value="BCC">BCC (Body-Centered Cubic)</option>
                      <option value="SC">SC (Simple Cubic)</option>
                      <option value="HCP">HCP (Hexagonal Close-Packed)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Lattice Parameter a (Å)</label>
                      <FormulaTooltip formula="a" description="Length of the unit cell edge vector (a)." />
                    </div>
                    <input 
                      type="number"
                      value={microA}
                      onChange={e => setMicroA(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 4.0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Crystallite Size D (nm)</label>
                        <FormulaTooltip formula="δ = 1 / (D * 10⁻⁹)²" description="Mean domain size of the diffracting crystallites used to estimate dislocation density." />
                      </div>
                      <input 
                        type="number"
                        value={microD}
                        onChange={e => setMicroD(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="e.g. 50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Density ρ (g/cm³)</label>
                        <FormulaTooltip formula="SSA = 6000 / (D * ρ)" description="Bulk or theoretical density used for calculating Specific Surface Area (SSA)." />
                      </div>
                      <input 
                        type="number"
                        value={microDensity}
                        onChange={e => setMicroDensity(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="e.g. 5.0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-5 bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 rounded-2xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">Burgers Vector Magnitude (b)</span>
                    <div className="text-3xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                      {calcBurgers}
                      <span className="text-lg text-slate-400">Å</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-5 bg-violet-50/80 dark:bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20 rounded-2xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">Dislocation Density (δ)</span>
                    <div className="text-3xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                      {calcDislocation}
                      <span className="text-lg text-slate-400">m⁻²</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-5 bg-sky-50/80 dark:bg-sky-500/10 border border-sky-200/60 dark:border-sky-500/20 rounded-2xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-1">Specific Surface Area (SSA)</span>
                    <div className="text-3xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                      {calcSSA}
                      <span className="text-lg text-slate-400">m²/g</span>
                    </div>
                  </div>

                  <DislocationVisualizer
                    system={microCrystalSystem}
                    a={parseFloat(microA) || 4.0}
                    dSize={parseFloat(microD) || 50}
                    density={parseFloat(calcDislocation) || 0}
                    burgers={parseFloat(calcBurgers) || 2.5}
                  />
                </div>
              </div>
            </div>
          )}

          {activeCalc === 'strain' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <MoveHorizontal className="w-5 h-5 text-orange-500" />
                    Lattice Macrostrain (Peak Shift)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">ε = (d - d₀) / d₀</p>
                </div>
                {onSaveToHistory && (
                  <button 
                    onClick={() => {
                      const strainVal = parseNum(calcStrainPercent) || 0;
                      onSaveToHistory('Macrostrain Calc', 1.5406, 0, strainVal, 0);
                    }}
                    className="px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Reference d-Spacing (d₀, Å)</label>
                      <FormulaTooltip formula="d₀" description="Ideal unstressed planar d-spacing reference." />
                    </div>
                    <input 
                      type="number"
                      value={strainD0}
                      onChange={e => setStrainD0(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 4.000"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Observed d-Spacing (d, Å)</label>
                      <FormulaTooltip formula="d" description="Stressed or strained planar d-spacing under load/defect." />
                    </div>
                    <input 
                      type="number"
                      value={strainD}
                      onChange={e => setStrainD(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 4.015"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-5 bg-orange-50/80 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20 rounded-2xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-1">Macrostrain (ε)</span>
                    <div className="text-3xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                      {calcStrain}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-5 bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 rounded-2xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Strain Percentage (%)</span>
                    <div className="text-3xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                      {calcStrainPercent}
                      <span className="text-lg text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                {/* Centered full-width Lattice Strain visualizer */}
                <div className="md:col-span-2 flex justify-center mt-4">
                  <div className="w-full max-w-2xl">
                    <LatticeStrainVisualizer
                      d0={parseFloat(strainD0) || 2.0}
                      d={parseFloat(strainD) || 2.02}
                      strainPercent={parseFloat(calcStrainPercent) || 0}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCalc === 'porosity' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-pink-500" />
                    Porosity & Specific Volume
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">P = (1 - ρ_bulk / ρ_true) × 100%</p>
                </div>
                {onSaveToHistory && (
                  <button 
                    onClick={() => {
                      const por = parseNum(calcPorosity) || 0;
                      onSaveToHistory('Porosity Calc', 1.5406, 0, por, 0);
                    }}
                    className="px-3 py-1.5 bg-pink-50 dark:bg-pink-500/10 hover:bg-pink-100 dark:hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Bulk Density (ρ_bulk, g/cm³)</label>
                      <FormulaTooltip formula="ρ_bulk" description="Density of the material including pores and voids." />
                    </div>
                    <input 
                      type="number"
                      value={porBulkDensity}
                      onChange={e => setPorBulkDensity(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 3.5"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">True/Theoretical Density (ρ_true, g/cm³)</label>
                      <FormulaTooltip formula="ρ_true" description="Theoretical crystalline or skeletal pore-free density." />
                    </div>
                    <input 
                      type="number"
                      value={porTrueDensity}
                      onChange={e => setPorTrueDensity(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 5.0"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-5 bg-pink-50/80 dark:bg-pink-500/10 border border-pink-200/60 dark:border-pink-500/20 rounded-2xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-pink-600 dark:text-pink-400 mb-1">Porosity (P)</span>
                    <div className="text-3xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                      {calcPorosity}
                      <span className="text-lg text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-5 bg-red-50/80 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-2xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">Specific Volume (v)</span>
                    <div className="text-3xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                      {calcSpecificVol}
                      <span className="text-lg text-slate-400">cm³/g</span>
                    </div>
                  </div>

                  <PorosityVisualizer
                    bulkDensity={parseFloat(porBulkDensity) || 0}
                    trueDensity={parseFloat(porTrueDensity) || 0}
                    porosityPercent={parseFloat(calcPorosity) || 0}
                  />
                </div>
              </div>
            </div>
          )}

          {activeCalc === 'mechanics' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    Mechanical Properties
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Stress, Strain, Modulus, Fracture Toughness, Fatigue Life</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Stress, Strain, Modulus & Poisson's Ratio Section */}
                <div className="p-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                  <div>
                    <h4 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500 text-white text-xs font-mono">01</span>
                      Stress, Strain, Elastic Modulus & Poisson's Ratio
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Analyze the elastic specimen behavior, calculate stiffness, and visualize deformation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Column 1: Material & Load Inputs */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                        <span className="text-xs font-black uppercase text-indigo-500 tracking-wider">Applied Load & Geometry</span>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Force (F, N)</label>
                              <FormulaTooltip formula="F (Load Force)" description="Applied axial load force." />
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              {mechForce} N
                            </span>
                          </div>
                          <input 
                            type="range"
                            min="-5000"
                            max="5000"
                            step="10"
                            value={mechForce}
                            onChange={e => setMechForce(e.target.value)}
                            className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                          />
                          <input 
                            type="number"
                            value={mechForce}
                            onChange={e => setMechForce(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-lg text-xs font-mono dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1 mb-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Area (A, mm²)</label>
                            <FormulaTooltip formula="A = w₀ * t₀" description="Cross-sectional area perpendicular to the force." />
                          </div>
                          <input 
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={mechArea}
                            onChange={e => setMechArea(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                        <span className="text-xs font-black uppercase text-violet-500 tracking-wider">Axial & Lateral Strain Parameters</span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Length (L₀, mm)</label>
                              <FormulaTooltip formula="L₀" description="Initial unstressed gauge length along the load axis." />
                            </div>
                            <input 
                              type="number"
                              value={mechLength}
                              onChange={e => setMechLength(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Width (w₀, mm)</label>
                              <FormulaTooltip formula="w₀" description="Initial unstressed gauge width perpendicular to the load axis." />
                            </div>
                            <input 
                              type="number"
                              value={mechWidth}
                              onChange={e => setMechWidth(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Δ Length (dL, mm)</label>
                              <FormulaTooltip formula="dL = L - L₀" description="Change in length along the load axis." />
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              {mechDeltaLength} mm
                            </span>
                          </div>
                          <input 
                            type="range"
                            min="-2.0"
                            max="2.0"
                            step="0.01"
                            value={mechDeltaLength}
                            onChange={e => setMechDeltaLength(e.target.value)}
                            className="w-full accent-violet-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                          />
                          <input 
                            type="number"
                            step="0.001"
                            value={mechDeltaLength}
                            onChange={e => setMechDeltaLength(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-lg text-xs font-mono dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Δ Width (dw, mm)</label>
                              <FormulaTooltip formula="dw = w - w₀" description="Change in width perpendicular to the load axis." />
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              {mechDeltaWidth} mm
                            </span>
                          </div>
                          <input 
                            type="range"
                            min="-0.5"
                            max="0.5"
                            step="0.001"
                            value={mechDeltaWidth}
                            onChange={e => setMechDeltaWidth(e.target.value)}
                            className="w-full accent-violet-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                          />
                          <input 
                            type="number"
                            step="0.0001"
                            value={mechDeltaWidth}
                            onChange={e => setMechDeltaWidth(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-lg text-xs font-mono dark:text-white"
                            placeholder="Contraction (-)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Specimen Live Visualizer */}
                    <div className="lg:col-span-4 flex flex-col justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black uppercase text-amber-500 tracking-wider">specimen deformation</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          parseNum(mechForce) > 0 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          parseNum(mechForce) < 0 ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                          'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {parseNum(mechForce) > 0 ? 'Tension' : parseNum(mechForce) < 0 ? 'Compression' : 'Neutral'}
                        </span>
                      </div>

                      <div className="flex-1 flex items-center justify-center p-3 relative min-h-[220px]">
                        {/* Interactive SVG Specimen Animation */}
                        <svg viewBox="0 0 200 240" className="w-full max-w-[180px] h-auto overflow-visible">
                          <defs>
                            <linearGradient id="specimenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.85" />
                              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.85" />
                            </linearGradient>
                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                            </marker>
                            <marker id="arrowCyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                              <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
                            </marker>
                          </defs>

                          {/* Reference original dotted specimen shape */}
                          <rect 
                            x="70" 
                            y="40" 
                            width="60" 
                            height="140" 
                            fill="none" 
                            stroke="#94a3b8" 
                            strokeWidth="1.5" 
                            strokeDasharray="4 4" 
                            rx="4"
                          />
                          <text x="100" y="32" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono font-semibold">Original L₀</text>

                          {/* Dynamic specimens calculated */}
                          {(() => {
                            const numL = parseNum(mechLength) || 50;
                            const numW = parseNum(mechWidth) || 10;
                            const dL = parseNum(mechDeltaLength);
                            const dw = parseNum(mechDeltaWidth);
                            
                            const strainAx = numL > 0 ? dL / numL : 0;
                            const strainLat = numW > 0 ? dw / numW : 0;

                            // Scale factors amplified for clear visual representation
                            const sY = 1 + (strainAx * 4);
                            const sX = 1 + (strainLat * 4);
                            
                            // Visual bound
                            const currentScaleY = Math.min(Math.max(sY, 0.4), 1.6);
                            const currentScaleX = Math.min(Math.max(sX, 0.4), 1.6);

                            const targetW = 60 * currentScaleX;
                            const targetH = 140 * currentScaleY;
                            const rx = 100 - targetW / 2;
                            const ry = 110 - targetH / 2;

                            const fVal = parseNum(mechForce);

                            return (
                              <>
                                {/* Deformed Shape */}
                                <rect 
                                  x={rx} 
                                  y={ry} 
                                  width={targetW} 
                                  height={targetH} 
                                  fill="url(#specimenGrad)" 
                                  stroke="#4f46e5" 
                                  strokeWidth="1.5" 
                                  className="transition-all duration-300"
                                  rx="4"
                                />

                                {/* Dimension indicator line width */}
                                <line x1={rx} y1={ry + targetH / 2} x2={rx + targetW} y2={ry + targetH / 2} stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />

                                {/* Axial force arrows (Tension or Compression) */}
                                {fVal > 0 && (
                                  <>
                                    {/* Tension Arrows pointing outwards */}
                                    <line x1="100" y1={ry} x2="100" y2={ry - 20} stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrow)" />
                                    <line x1="100" y1={ry + targetH} x2="100" y2={ry + targetH + 20} stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrow)" />
                                  </>
                                )}
                                {fVal < 0 && (
                                  <>
                                    {/* Compression Arrows pointing inwards */}
                                    <line x1="100" y1={ry - 20} x2="100" y2={ry} stroke="#06b6d4" strokeWidth="2.5" markerEnd="url(#arrowCyan)" />
                                    <line x1="100" y1={ry + targetH + 20} x2="100" y2={ry + targetH} stroke="#06b6d4" strokeWidth="2.5" markerEnd="url(#arrowCyan)" />
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Formula Helper */}
                      <div className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800 text-center">
                        <div>Poisson's Ratio equation:</div>
                        <div className="text-slate-600 dark:text-slate-300 font-bold mt-0.5">ν = - ε_transverse / ε_axial</div>
                      </div>
                    </div>

                    {/* Column 3: Beautiful Results & Dashboard */}
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
                      <span className="text-xs font-black uppercase text-violet-500 tracking-wider">Calculated Parameters</span>
                      
                      <div className="space-y-2">
                        {/* Stress */}
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-500 block">Stress (σ)</span>
                            <span className="text-[9px] text-slate-400 font-mono">Force / Area</span>
                          </div>
                          <div className="font-mono font-black text-slate-800 dark:text-white text-right">
                            <div className="text-base">{calcStress} <span className="text-slate-400 text-[10px] font-sans">MPa</span></div>
                          </div>
                        </div>

                        {/* Axial Strain */}
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-500 block">Axial Strain (ε_a)</span>
                            <span className="text-[9px] text-slate-400 font-mono">ΔL / L₀</span>
                          </div>
                          <div className="font-mono font-bold text-slate-800 dark:text-white text-right text-xs">
                            {calcStrainMech}
                          </div>
                        </div>

                        {/* Transverse Strain */}
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-500 block">Transverse Strain (ε_t)</span>
                            <span className="text-[9px] text-slate-400 font-mono">Δw / w₀</span>
                          </div>
                          <div className="font-mono font-bold text-slate-800 dark:text-white text-right text-xs">
                            {calcStrainTransverse}
                          </div>
                        </div>

                        {/* Modulus */}
                        <div className="flex items-center justify-between p-3 bg-indigo-50/80 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">Elastic Modulus (E)</span>
                            <span className="text-[9px] text-indigo-400 font-mono">Stress / Axial Strain</span>
                          </div>
                          <div className="font-mono font-black text-indigo-700 dark:text-indigo-300 text-right">
                            <div className="text-base">{calcModulus} <span className="text-indigo-400 text-[10px] font-sans">GPa</span></div>
                          </div>
                        </div>

                        {/* Poisson's Ratio */}
                        <div className="flex items-center justify-between p-3 bg-violet-50/80 dark:bg-violet-500/10 rounded-xl border border-violet-100 dark:border-violet-500/20 shadow-sm">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 block">Poisson's Ratio (ν)</span>
                            <span className="text-[9px] text-violet-400 font-mono">- ε_t / ε_a</span>
                          </div>
                          <div className="font-mono font-black text-violet-700 dark:text-violet-300 text-right">
                            <div className="text-base">{calcPoissonsRatio}</div>
                          </div>
                        </div>
                      </div>

                      {/* Material category classification badge and text */}
                      {(() => {
                        const nuVal = parseNum(calcPoissonsRatio);
                        const cat = getPoissonRatioCategory(nuVal);
                        return (
                          <div className={`p-3 rounded-xl border transition-all duration-300 ${cat.color}`}>
                            <div className="text-[10px] font-black uppercase tracking-wider block">Behavior Categorization:</div>
                            <div className="text-xs font-bold mt-1">{cat.label}</div>
                            <p className="text-[10px] opacity-80 mt-1 font-medium">{cat.desc}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fracture Mechanics */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fracture Toughness (K₁c)</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Crack Length (a, mm)</label>
                        <FormulaTooltip formula="a" description="Critical crack length of the defect inside the material." />
                      </div>
                      <input 
                        type="number"
                        value={mechCrackLength}
                        onChange={e => setMechCrackLength(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-red-500 focus:ring-4 focus:ring-red-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Geometric Factor (Y)</label>
                        <FormulaTooltip formula="Y (dimensionless)" description="Dimensionless geometric calibration factor based on specimen/crack shape." />
                      </div>
                      <input 
                        type="number"
                        value={mechGeoFactor}
                        onChange={e => setMechGeoFactor(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-red-500 focus:ring-4 focus:ring-red-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 mt-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                      <span className="text-[10px] font-black uppercase text-red-500 mb-1">K₁c</span>
                      <div className="font-mono font-black text-xl text-red-700 dark:text-red-400">
                        {calcFractureToughness} <span className="text-xs font-sans text-red-400">MPa√m</span>
                      </div>
                    </div>
                  </div>

                  {/* Fatigue Life */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fatigue Life (Basquin)</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Strength Coef (σ'f, MPa)</label>
                        <FormulaTooltip formula="σ'f" description="Fatigue strength coefficient representing stress intercept at 1 cycle." />
                      </div>
                      <input 
                        type="number"
                        value={mechFatigueStrengthCoef}
                        onChange={e => setMechFatigueStrengthCoef(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Ductility Exponent (b)</label>
                        <FormulaTooltip formula="b" description="Basquin fatigue strength exponent (typically between -0.05 and -0.12)." />
                      </div>
                      <input 
                        type="number"
                        value={mechFatigueExponent}
                        onChange={e => setMechFatigueExponent(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="e.g. -0.1"
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 mt-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                      <span className="text-[10px] font-black uppercase text-blue-500 mb-1">Cycles to Failure (Nf)</span>
                      <div className="font-mono font-black text-xl text-blue-700 dark:text-blue-400">
                        {calcFatigueLife}
                      </div>
                    </div>
                  </div>
                </div>

                <MechanicalVisualizer
                  mode="tension"
                  force={parseFloat(mechForce) || 0}
                  area={parseFloat(mechArea) || 1}
                  stress={parseFloat(calcStress) || 0}
                  strain={parseFloat(calcStrainMech) || 0}
                  poisson={parseFloat(calcPoissonsRatio) || 0.3}
                  crackLength={parseFloat(mechCrackLength) || 1.0}
                  fractureToughness={parseFloat(calcFractureToughness) || 0}
                />
              </div>
            </div>
          )}

          {activeCalc === 'thermo' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500 space-y-8">
              
              {/* Module Header */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500" />
                    Thermodynamics & Phase Transformations
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Predict phase equilibria, spontaneity, and transformation rates in material systems.</p>
                </div>
              </div>

              {/* Grid of calculators */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Lever Rule Calculator */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      The Lever Rule
                    </h4>
                    <div className="flex rounded-lg bg-slate-200/50 dark:bg-slate-900/50 p-1 text-xs">
                      <button
                        onClick={() => setLeverMode('binary')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${leverMode === 'binary' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        Binary
                      </button>
                      <button
                        onClick={() => setLeverMode('ternary')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${leverMode === 'ternary' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        Ternary
                      </button>
                    </div>
                  </div>

                  {leverMode === 'binary' ? (
                    <div className="space-y-4">
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                        Calculates weight percentages (W) of two coexisting phases in a binary alloy.
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Phase A Name</label>
                          <input 
                            type="text"
                            value={leverPhaseALabel}
                            onChange={e => setLeverPhaseALabel(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold dark:text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Phase B Name</label>
                          <input 
                            type="text"
                            value={leverPhaseBLabel}
                            onChange={e => setLeverPhaseBLabel(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Comp A (Cα, %)</label>
                            <FormulaTooltip formula="Cα" description="Equilibrium composition of Phase A." />
                          </div>
                          <input 
                            type="number"
                            value={leverCa}
                            onChange={e => setLeverCa(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Overall (C0, %)</label>
                            <FormulaTooltip formula="C0" description="Total overall chemical composition of the alloy." />
                          </div>
                          <input 
                            type="number"
                            value={leverC0}
                            onChange={e => setLeverC0(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Comp B (Cβ, %)</label>
                            <FormulaTooltip formula="Cβ" description="Equilibrium composition of Phase B." />
                          </div>
                          <input 
                            type="number"
                            value={leverCb}
                            onChange={e => setLeverCb(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                      </div>

                      {calcLeverError ? (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400 font-bold">
                          {calcLeverError}
                        </div>
                      ) : (
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl text-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">W_{leverPhaseALabel || 'A'}</span>
                              <div className="text-xl font-mono font-black text-slate-800 dark:text-white mt-1">
                                {calcLeverWa}%
                              </div>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Weight Fraction of Phase A</p>
                            </div>
                            <div className="p-4 bg-violet-50/60 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl text-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">W_{leverPhaseBLabel || 'B'}</span>
                              <div className="text-xl font-mono font-black text-slate-800 dark:text-white mt-1">
                                {calcLeverWb}%
                              </div>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Weight Fraction of Phase B</p>
                            </div>
                          </div>

                          <ThermoVisualizer
                            mode="lever"
                            cAlpha={parseFloat(leverCa) || 0}
                            cBeta={parseFloat(leverCb) || 0}
                            c0={parseFloat(leverC0) || 0}
                            wAlpha={parseFloat(calcLeverWa) || 0}
                            wBeta={parseFloat(calcLeverWb) || 0}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                        Calculates weight percentages (W) in a three-phase (ternary) system. Values describe chemical species (e.g., Ni% & Cr%).
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1 bg-white dark:bg-slate-900/30 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                          <input 
                            type="text"
                            value={leverTPhaseALabel}
                            onChange={e => setLeverTPhaseALabel(e.target.value)}
                            className="w-full text-center bg-transparent border-none text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 outline-none"
                          />
                          <div className="flex gap-1">
                            <input 
                              type="number"
                              value={leverTaX}
                              placeholder="X%"
                              onChange={e => setLeverTaX(e.target.value)}
                              className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center text-xs font-mono dark:text-white"
                            />
                            <input 
                              type="number"
                              value={leverTaY}
                              placeholder="Y%"
                              onChange={e => setLeverTaY(e.target.value)}
                              className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center text-xs font-mono dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 bg-white dark:bg-slate-900/30 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                          <input 
                            type="text"
                            value={leverTPhaseBLabel}
                            onChange={e => setLeverTPhaseBLabel(e.target.value)}
                            className="w-full text-center bg-transparent border-none text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 outline-none"
                          />
                          <div className="flex gap-1">
                            <input 
                              type="number"
                              value={leverTbX}
                              placeholder="X%"
                              onChange={e => setLeverTbX(e.target.value)}
                              className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center text-xs font-mono dark:text-white"
                            />
                            <input 
                              type="number"
                              value={leverTbY}
                              placeholder="Y%"
                              onChange={e => setLeverTbY(e.target.value)}
                              className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center text-xs font-mono dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 bg-white dark:bg-slate-900/30 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                          <input 
                            type="text"
                            value={leverTPhaseCLabel}
                            onChange={e => setLeverTPhaseCLabel(e.target.value)}
                            className="w-full text-center bg-transparent border-none text-[10px] font-black uppercase text-pink-600 dark:text-pink-400 outline-none"
                          />
                          <div className="flex gap-1">
                            <input 
                              type="number"
                              value={leverTcX}
                              placeholder="X%"
                              onChange={e => setLeverTcX(e.target.value)}
                              className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center text-xs font-mono dark:text-white"
                            />
                            <input 
                              type="number"
                              value={leverTcY}
                              placeholder="Y%"
                              onChange={e => setLeverTcY(e.target.value)}
                              className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center text-xs font-mono dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="text-[9px] font-black uppercase text-slate-400">Overall Alloy Composition (C0)</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-slate-500">Component X (%)</label>
                            <input 
                              type="number"
                              value={leverT0X}
                              onChange={e => setLeverT0X(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono dark:text-white text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase text-slate-500">Component Y (%)</label>
                            <input 
                              type="number"
                              value={leverT0Y}
                              onChange={e => setLeverT0Y(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono dark:text-white text-center"
                            />
                          </div>
                        </div>
                      </div>

                      {calcLeverTernaryError ? (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 text-xs text-amber-600 dark:text-amber-400 font-bold">
                          {calcLeverTernaryError}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="p-3 bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-center">
                          <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 block truncate">{leverTPhaseALabel}</span>
                          <div className="text-base font-mono font-black text-slate-800 dark:text-white mt-1">
                            {calcLeverTernaryWa}%
                          </div>
                        </div>
                        <div className="p-3 bg-violet-50/60 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-xl text-center">
                          <span className="text-[9px] font-black uppercase text-violet-600 dark:text-violet-400 block truncate">{leverTPhaseBLabel}</span>
                          <div className="text-base font-mono font-black text-slate-800 dark:text-white mt-1">
                            {calcLeverTernaryWb}%
                          </div>
                        </div>
                        <div className="p-3 bg-pink-50/60 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 rounded-xl text-center">
                          <span className="text-[9px] font-black uppercase text-pink-600 dark:text-pink-400 block truncate">{leverTPhaseCLabel}</span>
                          <div className="text-base font-mono font-black text-slate-800 dark:text-white mt-1">
                            {calcLeverTernaryWc}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Gibbs Free Energy */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Gibbs Free Energy (ΔG)
                    </h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                      Spontaneity predictor: ΔG = ΔH - T·ΔS. spontaneous if ΔG &lt; 0.
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Enthalpy (ΔH, kJ/mol)</label>
                          <FormulaTooltip formula="ΔH" description="Enthalpy change of transformation. Negative = exothermic; positive = endothermic." />
                        </div>
                        <input 
                          type="number"
                          value={gibbsH}
                          onChange={e => setGibbsH(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Entropy (ΔS, J/mol·K)</label>
                          <FormulaTooltip formula="ΔS" description="Entropy change. Represents molecular disorder modification." />
                        </div>
                        <input 
                          type="number"
                          value={gibbsS}
                          onChange={e => setGibbsS(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div className="col-span-2 space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Temperature (T)</label>
                          <FormulaTooltip formula="T" description="System temperature in Celsius (°C) or Kelvin (K)." />
                        </div>
                        <input 
                          type="number"
                          value={gibbsT}
                          onChange={e => setGibbsT(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                      <div className="flex rounded-lg bg-slate-200/50 dark:bg-slate-900/50 p-1 text-xs">
                        <button
                          onClick={() => setGibbsTUnit('C')}
                          className={`flex-1 text-center py-1 rounded-md font-bold transition-all ${gibbsTUnit === 'C' ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}
                        >
                          °C
                        </button>
                        <button
                          onClick={() => setGibbsTUnit('K')}
                          className={`flex-1 text-center py-1 rounded-md font-bold transition-all ${gibbsTUnit === 'K' ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}
                        >
                          K
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="p-4 bg-amber-50/60 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Free Energy Change (ΔG)</span>
                        <div className="text-2xl font-mono font-black text-slate-800 dark:text-white mt-1">
                          {calcGibbsG} <span className="text-xs font-sans text-slate-400 font-normal">kJ/mol</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Equilibrium Temp</span>
                        <div className="text-sm font-mono font-black text-slate-700 dark:text-slate-300 mt-1">
                          {calcGibbsTeq} <span className="text-[10px] font-sans font-bold">{gibbsTUnit === 'C' ? '°C' : 'K'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Thermodynamic Status</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{calcGibbsSpontaneous}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Phase Transformation Kinetics (Avrami Equation) */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4 lg:col-span-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Phase Transformation Kinetics (Avrami Equation)
                    </h4>
                    <div className="flex rounded-lg bg-slate-200/50 dark:bg-slate-900/50 p-1 text-xs">
                      <button
                        onClick={() => setAvramiCalcMode('fraction')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${avramiCalcMode === 'fraction' ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                      >
                        Find Fraction (Y)
                      </button>
                      <button
                        onClick={() => setAvramiCalcMode('time')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${avramiCalcMode === 'time' ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                      >
                        Find Time (t)
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Models transformation rate: Y = 1 - exp(-k·t^n) where Y is fraction transformed, k is rate constant, n is Avrami exponent.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Rate Constant (k)</label>
                        <FormulaTooltip formula="k" description="Rate constant incorporating nucleation and growth rates." />
                      </div>
                      <input 
                        type="number"
                        value={avramiK}
                        onChange={e => setAvramiK(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Avrami Exponent (n)</label>
                        <FormulaTooltip formula="n" description="Exponent indicating nucleation mechanism and growth dimensionality (typically 1 to 4)." />
                      </div>
                      <input 
                        type="number"
                        value={avramiN}
                        onChange={e => setAvramiN(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                      />
                    </div>

                    {avramiCalcMode === 'fraction' ? (
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Transformation Time (t, s/min)</label>
                          <FormulaTooltip formula="t" description="Elapsed transformation time." />
                        </div>
                        <input 
                          type="number"
                          value={avramiTime}
                          onChange={e => setAvramiTime(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Target Fraction Transformed (%)</label>
                          <FormulaTooltip formula="Y" description="Desired transformation completion percentage (between 0.1% and 99.9%)." />
                        </div>
                        <input 
                          type="number"
                          value={avramiTargetFraction}
                          onChange={e => setAvramiTargetFraction(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className={`p-4 rounded-2xl border text-center transition-all ${avramiCalcMode === 'fraction' ? 'bg-emerald-50/65 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 shadow-sm' : 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/80 opacity-80'}`}>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Fraction Transformed (Y)</span>
                      <div className="text-2xl font-mono font-black text-slate-800 dark:text-white mt-1">
                        {calcAvramiFraction}%
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Percentage of new phase nucleated & grown</p>
                    </div>

                    <div className={`p-4 rounded-2xl border text-center transition-all ${avramiCalcMode === 'time' ? 'bg-emerald-50/65 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 shadow-sm' : 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/80 opacity-80'}`}>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Time Required (t_req)</span>
                      <div className="text-2xl font-mono font-black text-slate-800 dark:text-white mt-1">
                        {calcAvramiTimeRequired} <span className="text-xs font-sans text-slate-400 font-normal">units</span>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Time to reach {avramiTargetFraction}% transformation</p>
                    </div>
                  </div>

                  <ThermoVisualizer
                    mode="avrami"
                    avramiY={parseFloat(calcAvramiFraction) || 0}
                    avramiTime={parseFloat(avramiTime) || 0}
                  />
                </div>

              </div>

            </div>
          )}

          {activeCalc === 'diffusion' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500 space-y-8">
              
              {/* Module Header */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Transport Phenomena & Diffusion
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Model atomic transport, calculate diffusion rates, and determine thermal activation energy.</p>
                </div>
              </div>

              {/* Grid of calculators */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Fick's First Law Calculator */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Fick’s First Law (Steady-State)
                    </h4>
                    <div className="flex rounded-lg bg-slate-200/50 dark:bg-slate-900/50 p-1 text-xs">
                      <button
                        onClick={() => setFick1Mode('solve_flux')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${fick1Mode === 'solve_flux' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        Solve Flux (J)
                      </button>
                      <button
                        onClick={() => setFick1Mode('solve_coefficient')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${fick1Mode === 'solve_coefficient' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        Solve Diff Coef (D)
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Calculates mass transfer under steady-state diffusion where concentration profile does not change over time.
                  </div>

                  <div className="space-y-4">
                    {/* Positions Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Start Position (x1, mm)</label>
                          <FormulaTooltip formula="x1" description="Starting point or thickness boundary." />
                        </div>
                        <input 
                          type="number"
                          value={fick1X1}
                          onChange={e => setFick1X1(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">End Position (x2, mm)</label>
                          <FormulaTooltip formula="x2" description="Ending point or thickness boundary." />
                        </div>
                        <input 
                          type="number"
                          value={fick1X2}
                          onChange={e => setFick1X2(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                    </div>

                    {/* Concentrations Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Conc 1 (C1, kg/m³)</label>
                          <FormulaTooltip formula="C1" description="Concentration of diffusing species at position x1." />
                        </div>
                        <input 
                          type="number"
                          value={fick1C1}
                          onChange={e => setFick1C1(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Conc 2 (C2, kg/m³)</label>
                          <FormulaTooltip formula="C2" description="Concentration of diffusing species at position x2." />
                        </div>
                        <input 
                          type="number"
                          value={fick1C2}
                          onChange={e => setFick1C2(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                    </div>

                    {/* Conditional input based on mode */}
                    {fick1Mode === 'solve_flux' ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Diffusion Coefficient (D, m²/s)</label>
                          <FormulaTooltip formula="D" description="Rate at which atoms diffuse through the matrix." />
                        </div>
                        <input 
                          type="text"
                          value={fick1D}
                          onChange={e => setFick1D(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Diffusion Flux (J, kg/m²·s)</label>
                          <FormulaTooltip formula="J" description="Rate of mass transfer per unit area." />
                        </div>
                        <input 
                          type="text"
                          value={fick1J}
                          onChange={e => setFick1J(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                    )}

                    {calcFick1Error ? (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400 font-bold">
                        {calcFick1Error}
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2">
                        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-between">
                          <div className="text-left">
                            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              {fick1Mode === 'solve_flux' ? 'Calculated Diffusion Flux (J)' : 'Calculated Coefficient (D)'}
                            </span>
                            <div className="text-xl font-mono font-black text-slate-800 dark:text-white mt-1">
                              {fick1Mode === 'solve_flux' ? calcFick1Flux : calcFick1Coef}
                              <span className="text-xs font-sans text-slate-400 font-normal ml-1">
                                {fick1Mode === 'solve_flux' ? 'kg/(m²·s)' : 'm²/s'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Grad (dC/dx)</span>
                            <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                              {calcFick1Grad} <span className="text-[8px] text-slate-400">kg/m⁴</span>
                            </div>
                          </div>
                        </div>

                        <DiffusionVisualizer
                          mode="fick1"
                          x1={parseFloat(fick1X1) || 0}
                          x2={parseFloat(fick1X2) || 1}
                          c1={parseFloat(fick1C1) || 0}
                          c2={parseFloat(fick1C2) || 0}
                          flux={parseFloat(calcFick1Flux) || 0}
                          coef={parseFloat(fick1Mode === 'solve_flux' ? fick1D : calcFick1Coef) || 1e-11}
                          grad={parseFloat(calcFick1Grad) || 0}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Fick's Second Law Calculator */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Fick’s Second Law (Non-Steady)
                    </h4>
                    <div className="flex rounded-lg bg-slate-200/50 dark:bg-slate-900/50 p-1 text-xs">
                      <button
                        onClick={() => setFick2Mode('solve_cx')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${fick2Mode === 'solve_cx' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        Solve Cx
                      </button>
                      <button
                        onClick={() => setFick2Mode('solve_x')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${fick2Mode === 'solve_x' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        Solve depth (x)
                      </button>
                      <button
                        onClick={() => setFick2Mode('solve_t')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${fick2Mode === 'solve_t' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        Solve time (t)
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Predicts concentration changes with time. Assumes a semi-infinite solid with constant surface concentration.
                  </div>

                  <div className="space-y-4">
                    {/* Boundary Concentrations Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Surface Conc (Cs, %)</label>
                          <FormulaTooltip formula="Cs" description="Constant concentration of species at the boundary/surface." />
                        </div>
                        <input 
                          type="number"
                          value={fick2Cs}
                          onChange={e => setFick2Cs(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Initial Bulk (C0, %)</label>
                          <FormulaTooltip formula="C0" description="Initial uniform concentration of the species in the bulk alloy." />
                        </div>
                        <input 
                          type="number"
                          value={fick2C0}
                          onChange={e => setFick2C0(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Constant/Input Diff Coef */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Diff Coefficient (D, m²/s)</label>
                          <FormulaTooltip formula="D" description="Diffusion coefficient at target temperature." />
                        </div>
                        <input 
                          type="text"
                          value={fick2D}
                          onChange={e => setFick2D(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                        />
                      </div>

                      {/* Conditional inputs for target concentration Cx */}
                      {fick2Mode !== 'solve_cx' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Target Conc (Cx, %)</label>
                            <FormulaTooltip formula="Cx" description="Desired concentration value at the specified depth." />
                          </div>
                          <input 
                            type="number"
                            value={fick2Cx}
                            onChange={e => setFick2Cx(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                      )}

                      {/* Depth input (x) if solving Cx or t */}
                      {fick2Mode !== 'solve_x' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Depth (x, mm)</label>
                            <FormulaTooltip formula="x" description="Distance/depth from the surface boundary into the solid." />
                          </div>
                          <input 
                            type="number"
                            value={fick2X}
                            onChange={e => setFick2X(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                      )}
                    </div>

                    {/* Time input (t) with Unit selector if solving Cx or x */}
                    {fick2Mode !== 'solve_t' && (
                      <div className="grid grid-cols-3 gap-2 items-end">
                        <div className="col-span-2 space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Diffusion Time (t)</label>
                            <FormulaTooltip formula="t" description="Elapsed diffusion duration." />
                          </div>
                          <input 
                            type="number"
                            value={fick2T}
                            onChange={e => setFick2T(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                        <div className="flex rounded-lg bg-slate-200/50 dark:bg-slate-900/50 p-1 text-xs">
                          {(['s', 'min', 'h', 'day'] as const).map((u) => (
                            <button
                              key={u}
                              onClick={() => setFick2TUnit(u)}
                              className={`flex-1 text-center py-1 rounded-md font-bold transition-all uppercase ${fick2TUnit === u ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {calcFick2Error ? (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400 font-bold">
                        {calcFick2Error}
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2">
                        {fick2Mode === 'solve_cx' && (
                          <div className="p-4 bg-violet-50/60 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl text-center">
                            <span className="text-[9px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">Concentration at depth {fick2X}mm (Cx)</span>
                            <div className="text-2xl font-mono font-black text-slate-800 dark:text-white mt-1">
                              {calcFick2Cx}%
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1">Fractional value: {(parseNum(calcFick2Cx)/100).toFixed(6)}</p>
                          </div>
                        )}

                        {fick2Mode === 'solve_x' && (
                          <div className="p-4 bg-violet-50/60 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl text-center">
                            <span className="text-[9px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">Required Diffusion Depth (x)</span>
                            <div className="text-2xl font-mono font-black text-slate-800 dark:text-white mt-1">
                              {calcFick2X} <span className="text-xs font-sans text-slate-400 font-normal">mm</span>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1">Distance to reach concentration of {fick2Cx}%</p>
                          </div>
                        )}

                        {fick2Mode === 'solve_t' && (
                          <div className="p-4 bg-violet-50/60 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl text-center">
                            <span className="text-[9px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">Required Diffusion Time (t)</span>
                            <div className="text-2xl font-mono font-black text-slate-800 dark:text-white mt-1">
                              {calcFick2T} <span className="text-xs font-sans text-slate-400 font-normal uppercase">{fick2TUnit}</span>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1">Duration to reach concentration of {fick2Cx}% at {fick2X}mm depth</p>
                          </div>
                        )}

                        <DiffusionVisualizer
                          mode="fick2"
                          fick2Mode={fick2Mode}
                          fick2Cs={parseFloat(fick2Cs) || 1}
                          fick2C0={parseFloat(fick2C0) || 0}
                          fick2Cx={parseFloat(fick2Mode === 'solve_cx' ? calcFick2Cx : fick2Cx) || 0}
                          fick2X={parseFloat(fick2Mode === 'solve_x' ? calcFick2X : fick2X) || 0}
                          fick2D={parseFloat(fick2D) || 1e-11}
                          fick2T={(() => {
                            const tVal = parseFloat(fick2Mode === 'solve_t' ? calcFick2T : fick2T) || 0;
                            if (fick2TUnit === 'min') return tVal * 60;
                            if (fick2TUnit === 'h') return tVal * 3600;
                            if (fick2TUnit === 'day') return tVal * 86400;
                            return tVal;
                          })()}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Activation Energy Calculator (Arrhenius Equation) */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-4 lg:col-span-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Arrhenius Temperature Dependence & Activation Energy (Q)
                    </h4>
                    <div className="flex rounded-lg bg-slate-200/50 dark:bg-slate-900/50 p-1 text-xs">
                      <button
                        onClick={() => setDiffEnergyMode('solve_q_double')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${diffEnergyMode === 'solve_q_double' ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                      >
                        Solve Q (2 Points)
                      </button>
                      <button
                        onClick={() => setDiffEnergyMode('solve_q_single')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${diffEnergyMode === 'solve_q_single' ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                      >
                        Solve Q (1 Point + D0)
                      </button>
                      <button
                        onClick={() => setDiffEnergyMode('solve_d')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${diffEnergyMode === 'solve_d' ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                      >
                        Calculate D(T)
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Models the temperature dependence of diffusion: D = D0·exp(-Q / R·T) where Q is the activation energy and D0 is the pre-exponential factor.
                  </div>

                  {/* Temperature Unit Global Selection */}
                  <div className="flex justify-end gap-2 items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Temp Unit:</span>
                    <div className="flex rounded-md bg-slate-200/40 dark:bg-slate-900/40 p-0.5 text-[10px]">
                      <button
                        onClick={() => setDiffEnergyTUnit('C')}
                        className={`px-2 py-0.5 rounded transition-all font-bold ${diffEnergyTUnit === 'C' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                      >
                        °C
                      </button>
                      <button
                        onClick={() => setDiffEnergyTUnit('K')}
                        className={`px-2 py-0.5 rounded transition-all font-bold ${diffEnergyTUnit === 'K' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                      >
                        Kelvin (K)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {diffEnergyMode === 'solve_q_double' ? (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Diff Coef 1 (D1, m²/s)</label>
                          </div>
                          <input 
                            type="text"
                            value={diffEnergyD1}
                            onChange={e => setDiffEnergyD1(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Temperature 1 (T1)</label>
                          </div>
                          <input 
                            type="number"
                            value={diffEnergyT1}
                            onChange={e => setDiffEnergyT1(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Diff Coef 2 (D2, m²/s)</label>
                          </div>
                          <input 
                            type="text"
                            value={diffEnergyD2}
                            onChange={e => setDiffEnergyD2(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Temperature 2 (T2)</label>
                          </div>
                          <input 
                            type="number"
                            value={diffEnergyT2}
                            onChange={e => setDiffEnergyT2(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                      </>
                    ) : diffEnergyMode === 'solve_q_single' ? (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pre-Factor (D0, m²/s)</label>
                          </div>
                          <input 
                            type="text"
                            value={diffEnergyD0}
                            onChange={e => setDiffEnergyD0(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Diff Coef (D, m²/s)</label>
                          </div>
                          <input 
                            type="text"
                            value={diffEnergyD}
                            onChange={e => setDiffEnergyD(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Temperature (T)</label>
                          </div>
                          <input 
                            type="number"
                            value={diffEnergyT}
                            onChange={e => setDiffEnergyT(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pre-Factor (D0, m²/s)</label>
                          </div>
                          <input 
                            type="text"
                            value={diffEnergyD0}
                            onChange={e => setDiffEnergyD0(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Activation Energy (Q, kJ/mol)</label>
                          </div>
                          <input 
                            type="number"
                            value={diffEnergyQ}
                            onChange={e => setDiffEnergyQ(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <div className="flex items-center gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Temperature (T)</label>
                          </div>
                          <input 
                            type="number"
                            value={diffEnergyT}
                            onChange={e => setDiffEnergyT(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono dark:text-white text-center"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {calcDiffEnergyError ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 text-xs text-red-600 dark:text-red-400 font-bold">
                      {calcDiffEnergyError}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {diffEnergyMode !== 'solve_d' ? (
                        <>
                          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-center">
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Activation Energy (Q)</span>
                            <div className="text-2xl font-mono font-black text-slate-800 dark:text-white mt-1">
                              {calcDiffEnergyQ_kJ} <span className="text-xs font-sans text-slate-400 font-normal">kJ/mol</span>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1">Or {calcDiffEnergyQ_eV} eV/atom</p>
                          </div>
                          <div className="p-4 bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl text-center flex flex-col justify-center">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              {diffEnergyMode === 'solve_q_double' ? 'Derived Pre-Exponential factor (D0)' : 'Arrhenius Model Status'}
                            </span>
                            <div className="text-lg font-mono font-black text-slate-700 dark:text-slate-300 mt-1">
                              {diffEnergyMode === 'solve_q_double' ? `${calcDiffEnergyD0} m²/s` : 'Physically Consistent'}
                            </div>
                            <p className="text-[9px] text-slate-400 mt-0.5">
                              {diffEnergyMode === 'solve_q_double' ? 'Frequency factor derived from slope' : 'Arrhenius fit successful'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-center md:col-span-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Calculated Diffusion Coefficient D(T)</span>
                          <div className="text-2xl font-mono font-black text-slate-800 dark:text-white mt-1">
                            {calcDiffEnergyD_at_T} <span className="text-xs font-sans text-slate-400 font-normal">m²/s</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1">At temperature {diffEnergyT}{diffEnergyTUnit === 'C' ? '°C' : 'K'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
