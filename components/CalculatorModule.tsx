import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Zap, Ruler, Box, Activity, ChevronRight, RefreshCcw, Layers, Scaling, Target, Save, Grid, MoveHorizontal, PieChart, Wrench } from 'lucide-react';

export interface CalculatorModuleProps {
  onSaveToHistory?: (calcName: string, wavelength: number, twoTheta: number, dSpacing: number, qValue: number) => void;
}

export const CalculatorModule: React.FC<CalculatorModuleProps> = ({ onSaveToHistory }) => {
  const { t } = useTranslation();
  const [activeCalc, setActiveCalc] = useState<'bragg' | 'energy' | 'dspacing' | 'volume' | 'scattering' | 'microstructure' | 'strain' | 'porosity' | 'mechanics'>('bragg');

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
        <div className="md:col-span-3 flex flex-col gap-2">
          {[
            { id: 'bragg', label: "Bragg's Law", icon: Activity },
            { id: 'energy', label: "Energy / Wavelength", icon: Zap },
            { id: 'dspacing', label: "d-Spacing / Cell", icon: Box },
            { id: 'volume', label: "Volume & Density", icon: Layers },
            { id: 'scattering', label: "Scattering Vector (q)", icon: Target },
            { id: 'microstructure', label: "Microstructure", icon: Grid },
            { id: 'strain', label: "Lattice Strain", icon: MoveHorizontal },
            { id: 'porosity', label: "Porosity", icon: PieChart },
            { id: 'mechanics', label: "Mechanics", icon: Wrench },
          ].map((item) => {
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

        {/* Content Area */}
        <div className="md:col-span-9">
          
          {activeCalc === 'bragg' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Bragg's Law Calculator
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">nλ = 2d sin(θ)</p>
                </div>
                {onSaveToHistory && (
                  <button 
                    onClick={() => {
                      const wave = parseNum(braggWavelength) || 1.5406;
                      const t2 = parseNum(bragg2Theta) || 0;
                      const d = parseNum(braggDSpacing) || 0;
                      const thetaRad = (t2 / 2) * (Math.PI / 180);
                      const q = wave > 0 ? (4 * Math.PI * Math.sin(thetaRad)) / wave : 0;
                      onSaveToHistory('Bragg Calc', wave, t2, d, q);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 hover:from-indigo-500/20 hover:to-indigo-600/20 dark:from-indigo-500/20 dark:to-indigo-600/20 dark:hover:from-indigo-500/30 dark:hover:to-indigo-600/30 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 hover:scale-105"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Wavelength (λ, Å)</label>
                    <input 
                      type="number"
                      value={braggWavelength}
                      onChange={e => setBraggWavelength(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 1.5406"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Order of Reflection (n)</label>
                    <input 
                      type="number"
                      value={braggN}
                      onChange={e => setBraggN(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 1"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">2θ Angle (°)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          value={bragg2Theta}
                          onChange={e => setBragg2Theta(e.target.value)}
                          className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-sm font-mono font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                          placeholder="e.g. 35.5"
                        />
                        <button
                          onClick={handleBraggFromD}
                          className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center shrink-0"
                          title="Calculate 2Theta from d-spacing"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">d-spacing (Å)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          value={braggDSpacing}
                          onChange={e => setBraggDSpacing(e.target.value)}
                          className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-sm font-mono font-bold focus:border-indigo-500 outline-none transition-all dark:text-white"
                          placeholder="e.g. 2.5"
                        />
                        <button
                          onClick={handleBraggFromTheta}
                          className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center shrink-0"
                          title="Calculate d-spacing from 2Theta"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCalc === 'energy' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Energy / Wavelength Converter
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">E(keV) = 12.398 / λ(Å)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl relative">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Photon Energy (keV)</label>
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
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Wavelength (Å)</label>
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
                      <label className="text-[10px] font-bold text-slate-500 ml-1">a</label>
                      <input 
                        type="number"
                        value={latticeA}
                        onChange={e => setLatticeA(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">b</label>
                      <input 
                        type="number"
                        value={latticeB}
                        onChange={e => setLatticeB(e.target.value)}
                        disabled={crystalSystem === 'cubic' || crystalSystem === 'tetragonal' || crystalSystem === 'hexagonal'}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">c</label>
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
                      <label className="text-[10px] font-bold text-slate-500 ml-1">h</label>
                      <input 
                        type="number"
                        value={millerH}
                        onChange={e => setMillerH(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">k</label>
                      <input 
                        type="number"
                        value={millerK}
                        onChange={e => setMillerK(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">l</label>
                      <input 
                        type="number"
                        value={millerL}
                        onChange={e => setMillerL(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

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
              </div>
            </div>
          )}

          {activeCalc === 'volume' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-500" />
                    Unit Cell Volume & Theoretical Density
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Calculate volume (V) and X-ray density (ρ).</p>
                </div>
                <select
                  value={volCrystalSystem}
                  onChange={e => setVolCrystalSystem(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-bold dark:text-white outline-none focus:border-emerald-500"
                >
                  <option value="cubic">Cubic</option>
                  <option value="tetragonal">Tetragonal</option>
                  <option value="orthorhombic">Orthorhombic</option>
                  <option value="hexagonal">Hexagonal</option>
                  <option value="monoclinic">Monoclinic</option>
                  <option value="triclinic">Triclinic</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Lattice Parameters (Å)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">a</label>
                      <input 
                        type="number"
                        value={volA}
                        onChange={e => setVolA(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">b</label>
                      <input 
                        type="number"
                        value={volB}
                        onChange={e => setVolB(e.target.value)}
                        disabled={['cubic', 'tetragonal', 'hexagonal'].includes(volCrystalSystem)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">c</label>
                      <input 
                        type="number"
                        value={volC}
                        onChange={e => setVolC(e.target.value)}
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
                          <label className="text-[10px] font-bold text-slate-500 ml-1">α</label>
                          <input 
                            type="number"
                            value={volAlpha}
                            onChange={e => setVolAlpha(e.target.value)}
                            disabled={volCrystalSystem === 'monoclinic'}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 ml-1">β</label>
                          <input 
                            type="number"
                            value={volBeta}
                            onChange={e => setVolBeta(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 ml-1">γ</label>
                          <input 
                            type="number"
                            value={volGamma}
                            onChange={e => setVolGamma(e.target.value)}
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
                      <label className="text-[10px] font-bold text-slate-500 ml-1">Z (Formula units/cell)</label>
                      <input 
                        type="number"
                        value={volZ}
                        onChange={e => setVolZ(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 ml-1">Molar Mass (g/mol)</label>
                      <input 
                        type="number"
                        value={volMolarMass}
                        onChange={e => setVolMolarMass(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-5 bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 rounded-2xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Volume (V)</span>
                    <div className="text-3xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                      {calcVolume}
                      <span className="text-lg text-slate-400">Å³</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-5 bg-teal-50/80 dark:bg-teal-500/10 border border-teal-200/60 dark:border-teal-500/20 rounded-2xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-1">Theoretical Density (ρ)</span>
                    <div className="text-3xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                      {calcDensity}
                      <span className="text-lg text-slate-400">g/cm³</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCalc === 'scattering' && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Target className="w-5 h-5 text-fuchsia-500" />
                    Scattering Vector (q) Calculator
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">q = (4π / λ) · sin(θ)</p>
                </div>
                {onSaveToHistory && (
                  <button 
                    onClick={() => {
                      const wave = parseNum(qWavelength) || 1.5406;
                      const t2 = parseNum(q2Theta) || 0;
                      const q = parseNum(qValue) || 0;
                      const d = q > 0 ? (2 * Math.PI) / q : 0;
                      onSaveToHistory('Scattering (q) Calc', wave, t2, d, q);
                    }}
                    className="px-3 py-1.5 bg-fuchsia-50 dark:bg-fuchsia-500/10 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Wavelength (λ, Å)</label>
                    <input 
                      type="number"
                      value={qWavelength}
                      onChange={e => setQWavelength(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 1.5406"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">2θ Angle (°)</label>
                    <input 
                      type="number"
                      value={q2Theta}
                      onChange={e => setQ2Theta(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 28.5"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 bg-fuchsia-50 dark:bg-fuchsia-500/10 border border-fuchsia-100 dark:border-fuchsia-500/20 rounded-2xl relative">
                  <span className="text-[11px] font-black uppercase tracking-widest text-fuchsia-500 mb-2">Scattering Vector (q)</span>
                  <div className="text-4xl font-mono font-black text-slate-800 dark:text-white flex items-baseline gap-2">
                    {qValue}
                    <span className="text-xl text-slate-400">Å⁻¹</span>
                  </div>
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
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Crystal System</label>
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
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Lattice Parameter a (Å)</label>
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
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Crystallite Size D (nm)</label>
                      <input 
                        type="number"
                        value={microD}
                        onChange={e => setMicroD(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="e.g. 50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Density ρ (g/cm³)</label>
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
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Reference d-Spacing (d₀, Å)</label>
                    <input 
                      type="number"
                      value={strainD0}
                      onChange={e => setStrainD0(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 4.000"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Observed d-Spacing (d, Å)</label>
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
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Bulk Density (ρ_bulk, g/cm³)</label>
                    <input 
                      type="number"
                      value={porBulkDensity}
                      onChange={e => setPorBulkDensity(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="e.g. 3.5"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">True/Theoretical Density (ρ_true, g/cm³)</label>
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
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Force (F, N)</label>
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
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Area (A, mm²)</label>
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
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Length (L₀, mm)</label>
                            <input 
                              type="number"
                              value={mechLength}
                              onChange={e => setMechLength(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Width (w₀, mm)</label>
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
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Δ Length (dL, mm)</label>
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
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Δ Width (dw, mm)</label>
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
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Crack Length (a, mm)</label>
                      <input 
                        type="number"
                        value={mechCrackLength}
                        onChange={e => setMechCrackLength(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-red-500 focus:ring-4 focus:ring-red-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Geometric Factor (Y)</label>
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
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Strength Coef (σ'f, MPa)</label>
                      <input 
                        type="number"
                        value={mechFatigueStrengthCoef}
                        onChange={e => setMechFatigueStrengthCoef(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-sm font-mono shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Ductility Exponent (b)</label>
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
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
