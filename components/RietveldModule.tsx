import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Area, Scatter, AreaChart
} from 'recharts';
import { 
  Activity, Settings, RefreshCw, BarChart2, Download, PlayCircle, RotateCcw, 
  Beaker, Calculator, ChevronRight, BookOpen, Layers, Info, Ruler, Maximize, AlertTriangle, 
  Binary, Zap, Gauge, LineChart as ChartIcon, Database, Scale, Compass, Thermometer, CheckCircle2
} from 'lucide-react';
import { RietveldPhaseInput, RietveldSetupResult, CrystalSystem, RietveldAtom } from '../types';
import { generateRietveldSetup, calculateBragg, simulatePeak, calculateCellVolume } from '../utils/physics';

// --- Simulation Constants & Types ---

const SIMULATION_RANGE = { start: 10, end: 90, step: 0.1 };

interface SimulationPeak {
  h: number;
  k: number;
  l: number;
  intensity: number;
  enabled: boolean;
}

interface SimulationParams {
  a: number;
  scale: number;
  fwhm: number; 
  eta: number;
  zeroShift: number;
  sampleDisplacement: number;
  crystalliteSize: number; 
  microstrain: number; 
  background: number;
  noise: number;
  peaks: SimulationPeak[];
}

const TARGET_PARAMS: Record<string, SimulationParams> = {
  'Simple Cubic': { a: 4.0, scale: 1000, fwhm: 0.2, eta: 0.5, zeroShift: 0.0, sampleDisplacement: 0, crystalliteSize: 100, microstrain: 0.05, background: 50, noise: 20, peaks: [] },
  'BCC': { a: 3.5, scale: 1200, fwhm: 0.15, eta: 0.6, zeroShift: 0.0, sampleDisplacement: 0, crystalliteSize: 80, microstrain: 0.1, background: 40, noise: 15, peaks: [] },
  'FCC': { a: 4.5, scale: 1500, fwhm: 0.25, eta: 0.4, zeroShift: 0.0, sampleDisplacement: 0, crystalliteSize: 120, microstrain: 0.02, background: 60, noise: 25, peaks: [] },
  'Quartz': { a: 4.913, scale: 800, fwhm: 0.1, eta: 0.7, zeroShift: 0.0, sampleDisplacement: 0.1, crystalliteSize: 200, microstrain: 0.01, background: 80, noise: 30, peaks: [] },
};

const QUARTZ_PEAKS = [
  { t: 20.86, i: 22 }, { t: 26.64, i: 100 }, { t: 36.54, i: 6 }, 
  { t: 39.46, i: 4 }, { t: 40.29, i: 3 }, { t: 42.45, i: 6 }, 
  { t: 45.79, i: 3 }, { t: 50.14, i: 14 }, { t: 54.87, i: 3 }, 
  { t: 59.96, i: 5 }, { t: 67.74, i: 4 }, { t: 68.14, i: 3 }
];

const getPeaksForPhase = (phase: string, a: number): SimulationPeak[] => {
  if (phase === 'Quartz') {
    return QUARTZ_PEAKS.map((p, idx) => ({
      h: 0, k: 0, l: idx + 1,
      intensity: p.i * 10,
      enabled: true
    }));
  }

  const peaks: SimulationPeak[] = [];
  const maxHKL = 4; // reduced from 5 to avoid "too many peaks" initially
  for (let s2 = 1; s2 <= 32; s2++) {
    // Find first h,k,l that gives this sum of squares
    let found = false;
    for (let h = 0; h <= 5 && !found; h++) {
      for (let k = 0; k <= h && !found; k++) {
        for (let l = 0; l <= k && !found; l++) {
          if (h*h + k*k + l*l === s2) {
            let allowed = false;
            if (phase === 'Simple Cubic') allowed = true;
            else if (phase === 'BCC') allowed = (h + k + l) % 2 === 0;
            else if (phase === 'FCC') {
              const isEven = (h % 2 === 0) && (k % 2 === 0) && (l % 2 === 0);
              const isOdd = (h % 2 !== 0) && (k % 2 !== 0) && (l % 2 !== 0);
              allowed = isEven || isOdd;
            }
            if (allowed) {
              peaks.push({ h, k, l, intensity: 1000, enabled: true });
              found = true;
            }
          }
        }
      }
    }
  }
  return peaks;
};

export const RietveldModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'setup'>('simulation');

  // --- Simulation State ---
  const [simPhase, setSimPhase] = useState<string>('Simple Cubic');
  const [userParams, setUserParams] = useState<SimulationParams>(TARGET_PARAMS['Simple Cubic']);
  const [targetParams, setTargetParams] = useState<SimulationParams>(TARGET_PARAMS['Simple Cubic']);
  const [isAutoRefining, setIsAutoRefining] = useState(false);
  const [rFactor, setRFactor] = useState<number>(0);

  // --- Setup Generator State ---
  const [phases, setPhases] = useState<RietveldPhaseInput[]>([
    { name: 'Phase 1', crystalSystem: 'Cubic', a: 5.43 }
  ]);
  const [maxObsIntensity, setMaxObsIntensity] = useState<number>(5000);
  const [bgModel, setBgModel] = useState<'Chebyshev' | 'Linear_Interpolation' | 'Polynomial' | 'Shifted_Chebyshev'>('Chebyshev');
  const [bgTerms, setBgTerms] = useState<number>(6);
  const [profileShape, setProfileShape] = useState<'Thompson-Cox-Hastings' | 'Pseudo-Voigt' | 'Pearson-VII'>('Thompson-Cox-Hastings');
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [radSource, setRadSource] = useState<string>('Cu_Ka1');
  const [setupZeroShift, setSetupZeroShift] = useState<number>(0);
  const [sampleDisplacement, setSampleDisplacement] = useState<number>(0);
  const [polarization, setPolarization] = useState<number>(0);
  const [refineZeroShift, setRefineZeroShift] = useState(true);
  const [refineBkg, setRefineBkg] = useState(true);
  const [refineSampleDisplacement, setRefineSampleDisplacement] = useState(false);
  const [expertMode, setExpertMode] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [result, setResult] = useState<RietveldSetupResult | null>(null);

  const refinementMetrics = useMemo(() => {
    let globalActive = 0;
    if (refineBkg && bgModel !== 'Linear_Interpolation') globalActive += bgTerms;
    if (refineZeroShift) globalActive += 1; 
    if (refineSampleDisplacement) globalActive += 1;
    
    let phaseParams = 0;
    let activePhases = 0;
    
    phases.forEach(p => {
      let pCount = 0;
      if (p.refineScale) pCount++;
      if (p.refineLattice) {
        if (p.crystalSystem === 'Cubic') pCount += 1;
        else if (p.crystalSystem.includes('Tetragonal') || p.crystalSystem === 'Hexagonal') pCount += 2;
        else if (p.crystalSystem.includes('Orthorhombic')) pCount += 3;
        else if (p.crystalSystem === 'Monoclinic') pCount += 4;
        else pCount += 6;
      }
      if (p.refineProfile) pCount += 4; // U, V, W, Eta
      if (p.refineMicrostrain) pCount++;
      if (p.refineCrystalliteSize) pCount++;
      if (p.refineAtomicPos) pCount += (p.atoms?.length || 0) * 3;
      if (p.refineBiso) pCount += (p.atoms?.length || 0);
      if (p.refineOcc) pCount += (p.atoms?.length || 0);
      if (p.refineAsymmetry) pCount += 2;
      if (p.refinePrefOrient) pCount++;
      if (p.refineExtinction) pCount++;
      
      if (pCount > 0) {
        phaseParams += pCount;
        activePhases++;
      }
    });

    return { global: globalActive, phase: phaseParams, total: globalActive + phaseParams, activePhases };
  }, [phases, bgModel, bgTerms]);

  // --- Simulation Tracking ---
  const [rHistory, setRHistory] = useState<{iter: number, r: number}[]>([]);
  const [iterCount, setIterCount] = useState(0);

  // --- Simulation Logic ---

  useEffect(() => {
    // Reset user params when phase changes
    const initialTarget = { ...TARGET_PARAMS[simPhase] };
    initialTarget.peaks = getPeaksForPhase(simPhase, initialTarget.a);
    setTargetParams(initialTarget);
    
    // Start user params slightly off
    const initialUser: SimulationParams = {
      ...initialTarget,
      a: initialTarget.a * 1.05,
      scale: initialTarget.scale * 0.8,
      fwhm: initialTarget.fwhm * 1.5,
      background: initialTarget.background * 1.2,
      peaks: initialTarget.peaks.map(p => ({ ...p }))
    };
    setUserParams(initialUser);
  }, [simPhase]);

  const generatePatternData = useMemo(() => {
    const data: any[] = [];
    const steps = Math.floor((SIMULATION_RANGE.end - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
    
    // Initialize data array
    for (let i = 0; i <= steps; i++) {
      data.push({
        twoTheta: SIMULATION_RANGE.start + i * SIMULATION_RANGE.step,
        obs: 0,
        calc: 0,
        diff: 0,
        bkg: 0
      });
    }

    const calculateIntensity = (params: SimulationParams, isObserved: boolean) => {
      const intensities = new Array(data.length).fill(0);
      
      // Realistic Background (amorphous hump + 1/theta decay)
      for (let i = 0; i < data.length; i++) {
        const twoT = SIMULATION_RANGE.start + i * SIMULATION_RANGE.step;
        // Base flat + 1/2theta decay + hump around 25 deg
        const bgVal = params.background * (0.2 + 10 / Math.max(1, twoT) + 1.5 * Math.exp(-0.02 * Math.pow(twoT - 25, 2)));
        intensities[i] += bgVal;
      }

      // Helper to stamp a peak onto the intensities array
      const addPeak = (pos2Theta: number, fwhm: number, amplitude: number) => {
        const profile = simulatePeak(
          'Pseudo-Voigt', pos2Theta, fwhm, params.eta, 
          amplitude, 
          [pos2Theta - (fwhm * 10), pos2Theta + (fwhm * 10)], 100 // extend profile tail calculation
        );
        
        profile.points.forEach(p => {
          const idx = Math.round((p.x - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
          if (idx >= 0 && idx < data.length) {
            intensities[idx] += p.y;
          }
        });
      };

      const wavelength = 1.5406;

      params.peaks.filter(peak => peak.enabled).forEach((peak, peakIdx) => {
        let twoThetaBase = 0;
        let d = 0;

        if (simPhase === 'Quartz') {
          // Special handling for Quartz since it's not a simple cubic system here
          const origPeak = QUARTZ_PEAKS[peakIdx];
          if (!origPeak) return;
          const shift = (params.a - TARGET_PARAMS['Quartz'].a) * 2; 
          twoThetaBase = origPeak.t - shift;
          // approximate d for Ka2
          const theta1 = (origPeak.t / 2) * (Math.PI / 180);
          d = 1.5406 / (2 * Math.sin(theta1));
        } else {
          d = params.a / Math.sqrt(peak.h*peak.h + peak.k*peak.k + peak.l*peak.l);
          const sinTheta = wavelength / (2 * d);
          if (sinTheta >= 1) return;
          const theta = Math.asin(sinTheta);
          twoThetaBase = 2 * theta * (180 / Math.PI);
        }

        const theta = (twoThetaBase / 2) * (Math.PI / 180);
        
        // Sample Displacement shift effective (in degrees)
        const displacementShift = -params.sampleDisplacement * Math.cos(theta);
        const twoTheta = twoThetaBase + params.zeroShift + displacementShift;

        if (twoTheta >= SIMULATION_RANGE.start && twoTheta <= SIMULATION_RANGE.end) {
          // Approximate intensity (multiplicity * LP factor * structure factor)
          let intensity = peak.intensity; 
          
          if (simPhase !== 'Quartz') {
            // LP Factor approx
            const lp = (1 + Math.cos(2*theta)**2) / (Math.sin(theta)**2 * Math.cos(theta));
            intensity *= lp / 10;
            
            // Multiplicity (simplified)
            let mult = 0;
            const {h, k, l} = peak;
            if (h===k && k===l) mult = 8;
            else if (h===k || k===l || h===l) mult = 24;
            else mult = 48;
            if (h===0 || k===0 || l===0) mult /= 2;
            intensity *= (mult / 10);
          }

          // Broadening models
          const bSizeRad = (0.9 * wavelength) / ((params.crystalliteSize * 10) * Math.cos(theta));
          const bSizeDeg = bSizeRad * (180 / Math.PI);
          const bStrainRad = 4 * params.microstrain * Math.tan(theta);
          const bStrainDeg = bStrainRad * (180 / Math.PI);
          
          const totalFwhm = params.fwhm + bSizeDeg + bStrainDeg;
          const baseAmplitude = intensity * (params.scale / 1000);

          // Ka1
          addPeak(twoTheta, totalFwhm, baseAmplitude);

          // Ka2
          const wavelength2 = 1.5444; // Cu Ka2
          const sinTheta2 = wavelength2 / (2 * d);
          if (sinTheta2 < 1) {
            const theta2 = Math.asin(sinTheta2);
            const displacementShift2 = -params.sampleDisplacement * Math.cos(theta2);
            const twoTheta2 = 2 * theta2 * (180 / Math.PI) + params.zeroShift + displacementShift2;
            addPeak(twoTheta2, totalFwhm, baseAmplitude * 0.5);
          }
        }
      });

      // Apply realistic Poisson-like noise to observed data
      if (isObserved) {
        for (let i = 0; i < intensities.length; i++) {
          const val = intensities[i];
          // Noise proportional to sqrt(intensity), scaled by user noise param
          const noiseFactor = params.noise * 0.15;
          intensities[i] += Math.sqrt(Math.max(1, val)) * (Math.random() - 0.5) * noiseFactor;
        }
      }

      return intensities;
    };

    const obsIntensities = calculateIntensity(targetParams, true);
    const calcIntensities = calculateIntensity(userParams, false);

    let sumResSq = 0;
    let sumObsSq = 0;
    let maxObs = 0;

    for (let i = 0; i < data.length; i++) {
        if (obsIntensities[i] > maxObs) {
            maxObs = obsIntensities[i];
        }
    }
    
    // Offset diff curve to sit below the actual data like standard Rietveld plots
    const diffOffset = -maxObs * 0.15; 

    for (let i = 0; i < data.length; i++) {
      data[i].obs = obsIntensities[i];
      data[i].calc = calcIntensities[i];
      data[i].diff = (obsIntensities[i] - calcIntensities[i]) + diffOffset;
      
      const twoT = data[i].twoTheta;
      const trueBkg = userParams.background * (0.2 + 10 / Math.max(1, twoT) + 1.5 * Math.exp(-0.02 * Math.pow(twoT - 25, 2)));
      data[i].bkg = trueBkg;

      // Un-offset diff for correct calculation of R-factors
      const trueDiff = obsIntensities[i] - calcIntensities[i];
      sumResSq += Math.pow(trueDiff, 2);
      sumObsSq += Math.pow(data[i].obs, 2);
    }

    // Calculate R-factor (R-wp like)
    const R = Math.sqrt(sumResSq / sumObsSq) * 100;
    setRFactor(R);

    return data;
  }, [userParams, targetParams, simPhase]);

  // Track R-factor history
  useEffect(() => {
    if (isAutoRefining) {
      setRHistory(prev => {
        const next = [...prev, { iter: iterCount, r: rFactor }];
        if (next.length > 50) return next.slice(1);
        return next;
      });
      setIterCount(c => c + 1);
    } else if (iterCount > 0 && rFactor < 1) {
       // converged basically
    } else {
      // If manually changed and not refining, maybe clear or keep?
      // Let's clear history when starting a new refinement
    }
  }, [rFactor, isAutoRefining]);

  // Reset tracking when phase changes
  useEffect(() => {
    setRHistory([]);
    setIterCount(0);
  }, [simPhase]);

  // Auto-Refine Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoRefining) {
      interval = setInterval(() => {
        setUserParams(prev => {
          const step = 0.05;
          const diffA = targetParams.a - prev.a;
          const diffScale = targetParams.scale - prev.scale;
          const diffFwhm = targetParams.fwhm - prev.fwhm;
          const diffEta = targetParams.eta - prev.eta;
          const diffZeroShift = targetParams.zeroShift - prev.zeroShift;
          const diffBkg = targetParams.background - prev.background;
          const diffSize = targetParams.crystalliteSize - prev.crystalliteSize;
          const diffStrain = targetParams.microstrain - prev.microstrain;
          const diffDisplacement = targetParams.sampleDisplacement - prev.sampleDisplacement;

          // Check convergence
          if (
            Math.abs(diffA) < 0.001 && Math.abs(diffScale) < 1 && 
            Math.abs(diffFwhm) < 0.001 && Math.abs(diffEta) < 0.01 && 
            Math.abs(diffZeroShift) < 0.01 && Math.abs(diffSize) < 1 &&
            Math.abs(diffStrain) < 0.01 && Math.abs(diffDisplacement) < 0.01
          ) {
            setIsAutoRefining(false);
            return prev;
          }

          return {
            ...prev,
            a: prev.a + diffA * step,
            scale: prev.scale + diffScale * step,
            fwhm: prev.fwhm + diffFwhm * step,
            eta: prev.eta + diffEta * step,
            zeroShift: prev.zeroShift + diffZeroShift * step,
            background: prev.background + diffBkg * step,
            crystalliteSize: prev.crystalliteSize + diffSize * step,
            microstrain: prev.microstrain + diffStrain * step,
            sampleDisplacement: prev.sampleDisplacement + diffDisplacement * step
          };
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoRefining, targetParams]);


  // --- Setup Generator Logic ---
  const updatePhase = (index: number, field: keyof RietveldPhaseInput, value: any) => {
    const newPhases = [...phases];
    const updatedPhase = { ...newPhases[index], [field]: value };
    
    // Lattice Synchronization logic
    if (field === 'a' || field === 'crystalSystem') {
      const a = field === 'a' ? value : updatedPhase.a;
      const sys = field === 'crystalSystem' ? value : updatedPhase.crystalSystem;
      
      if (sys === 'Cubic') {
        updatedPhase.b = a;
        updatedPhase.c = a;
      } else if (sys === 'Tetragonal' || sys === 'Hexagonal') {
        updatedPhase.b = a;
      }
    }
    
    newPhases[index] = updatedPhase;
    setPhases(newPhases);
  };

  const addAtom = (phaseIdx: number) => {
    const nextPhases = [...phases];
    const currentAtoms = nextPhases[phaseIdx].atoms || [];
    nextPhases[phaseIdx] = {
      ...nextPhases[phaseIdx],
      atoms: [...currentAtoms, { element: 'Si', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.5 }]
    };
    setPhases(nextPhases);
  };

  const updateAtom = (phaseIdx: number, atomIdx: number, field: keyof RietveldAtom, value: any) => {
    const nextPhases = [...phases];
    const atoms = [...(nextPhases[phaseIdx].atoms || [])];
    atoms[atomIdx] = { ...atoms[atomIdx], [field]: value };
    nextPhases[phaseIdx] = { ...nextPhases[phaseIdx], atoms };
    setPhases(nextPhases);
  };

  const removeAtom = (phaseIdx: number, atomIdx: number) => {
    const nextPhases = [...phases];
    const atoms = (nextPhases[phaseIdx].atoms || []).filter((_, i) => i !== atomIdx);
    nextPhases[phaseIdx] = { ...nextPhases[phaseIdx], atoms };
    setPhases(nextPhases);
  };

  const clearAtoms = (phaseIdx: number) => {
    const nextPhases = [...phases];
    nextPhases[phaseIdx] = { ...nextPhases[phaseIdx], atoms: [] };
    setPhases(nextPhases);
  };

  const addPhase = () => {
    setPhases([...phases, { name: `Phase ${phases.length + 1}`, crystalSystem: 'Cubic', a: 5.0 }]);
  };

  const validateSetup = () => {
    const issues: string[] = [];
    if (phases.length === 0) issues.push("At least one phase is required.");
    phases.forEach((p, i) => {
      const name = p.name || `Phase ${i+1}`;
      if (p.a <= 0) issues.push(`${name}: Lattice parameter 'a' must be positive.`);
      if (['Orthorhombic', 'Tetragonal', 'Hexagonal', 'Monoclinic', 'Triclinic'].includes(p.crystalSystem) && (!p.c || p.c <= 0)) {
        issues.push(`${name}: Lattice parameter 'c' must be positive.`);
      }
      (p.atoms || []).forEach((atom, ai) => {
        if (atom.occupancy < 0) issues.push(`${name}, Atom ${ai+1}: Occupancy cannot be negative.`);
        if (atom.bIso < 0) issues.push(`${name}, Atom ${ai+1}: B-iso cannot be negative.`);
      });
    });
    return issues;
  };

  const duplicatePhase = (index: number) => {
    const phaseToCopy = phases[index];
    setPhases([...phases, { ...JSON.parse(JSON.stringify(phaseToCopy)), name: `${phaseToCopy.name} (Copy)` }]);
  };

  const applyPreset = (index: number, presetType: 'Si' | 'LaB6' | 'Al2O3') => {
    const presets: Record<string, Partial<RietveldPhaseInput>> = {
      Si: { 
        name: 'Silicon (Standard)', crystalSystem: 'Cubic', spaceGroup: 'Fd-3m', a: 5.4309, 
        zValue: 8, molarMass: 28.085,
        atoms: [{ element: 'Si', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.45 }]
      },
      LaB6: { 
        name: 'LaB6 (Standard)', crystalSystem: 'Cubic', spaceGroup: 'Pm-3m', a: 4.156, 
        zValue: 1, molarMass: 203.77,
        atoms: [
          { element: 'La', x: 0, y: 0, z: 0, occupancy: 1, bIso: 0.5 },
          { element: 'B', x: 0.5, y: 0, z: 0, occupancy: 1, bIso: 0.6 }
        ]
      },
      Al2O3: { 
        name: 'Alumina (Alpha)', crystalSystem: 'Hexagonal', spaceGroup: 'R-3c', a: 4.758, c: 12.991,
        zValue: 6, molarMass: 101.96,
        atoms: [
          { element: 'Al', x: 0, y: 0, z: 0.352, occupancy: 1, bIso: 0.3 },
          { element: 'O', x: 0.306, y: 0, z: 0.25, occupancy: 1, bIso: 0.4 }
        ]
      }
    };
    
    if (presets[presetType]) {
      const newPhases = [...phases];
      newPhases[index] = { ...newPhases[index], ...presets[presetType] };
      setPhases(newPhases);
    }
  };

  const removePhase = (index: number) => {
    if (phases.length > 1) {
      setPhases(phases.filter((_, i) => i !== index));
    }
  };

  const handleGenerate = () => {
    const issues = validateSetup();
    if (issues.length > 0) {
      setShowValidation(true);
      return;
    }
    const output = generateRietveldSetup({
      phases,
      maxObsIntensity,
      backgroundModel: bgModel,
      bgTerms,
      profileShape,
      wavelength,
      zeroShift: setupZeroShift,
      sampleDisplacement,
      polarization,
      refineZeroShift,
      refineBkg,
      refineSampleDisplacement,
      twoThetaMin: SIMULATION_RANGE.start,
      twoThetaMax: SIMULATION_RANGE.end,
      stepSize: SIMULATION_RANGE.step,
    });
    setResult(output);
    setShowValidation(false);
    // Scroll to result
    setTimeout(() => {
      const el = document.getElementById('rietveld-result');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const applyRefinementPreset = (phaseIdx: number, type: 'full' | 'lattice' | 'profile' | 'structure' | 'none') => {
    const p = {...phases[phaseIdx]};
    if (type === 'full') {
      p.refineLattice = true;
      p.refineProfile = true;
      p.refineAtomicPos = true;
      p.refineScale = true;
      p.refineBiso = true;
      p.refinePrefOrient = true;
      p.refineMicrostrain = true;
      p.refineCrystalliteSize = true;
      p.refineOcc = true;
      p.refineAsymmetry = true;
      p.refineExtinction = true;
    } else if (type === 'lattice') {
      p.refineLattice = true;
      p.refineScale = true;
      p.refineProfile = false;
      p.refineAtomicPos = false;
    } else if (type === 'profile') {
      p.refineProfile = true;
      p.refineMicrostrain = true;
      p.refineCrystalliteSize = true;
      p.refineAsymmetry = true;
      p.refineLattice = false;
    } else if (type === 'structure') {
      p.refineAtomicPos = true;
      p.refineBiso = true;
      p.refineOcc = true;
    } else {
      p.refineLattice = false;
      p.refineProfile = false;
      p.refineAtomicPos = false;
      p.refineScale = false;
      p.refineBiso = false;
      p.refinePrefOrient = false;
      p.refineMicrostrain = false;
      p.refineCrystalliteSize = false;
      p.refineAsymmetry = false;
      p.refineOcc = false;
      p.refineExtinction = false;
    }
    const newPhases = [...phases];
    newPhases[phaseIdx] = p;
    setPhases(newPhases);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
            activeTab === 'simulation' 
              ? 'text-teal-600 dark:text-teal-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Simulation / Education
          {activeTab === 'simulation' && (
            <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
            activeTab === 'setup' 
              ? 'text-teal-600 dark:text-teal-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          Setup Generator
          {activeTab === 'setup' && (
            <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'simulation' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-700"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-500/20 rounded-xl border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                    <Settings className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Refinement Core</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Parameter Matrix</p>
                      {isAutoRefining && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded-full">
                           <RefreshCw className="w-2.5 h-2.5 text-teal-400 animate-spin" />
                           <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest">Optimizing</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => {
                       setUserParams({
                        ...TARGET_PARAMS[simPhase],
                        a: TARGET_PARAMS[simPhase].a * 1.05,
                        scale: TARGET_PARAMS[simPhase].scale * 0.8,
                        fwhm: TARGET_PARAMS[simPhase].fwhm * 1.5,
                        eta: Math.min(1, TARGET_PARAMS[simPhase].eta * 1.2),
                        zeroShift: 0.15,
                        background: TARGET_PARAMS[simPhase].background * 1.2,
                        crystalliteSize: TARGET_PARAMS[simPhase].crystalliteSize * 0.8,
                        microstrain: TARGET_PARAMS[simPhase].microstrain * 1.5,
                        sampleDisplacement: 0.1
                      });
                      setIsAutoRefining(false);
                    }}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800 hover:border-slate-700 active:scale-95"
                    title="Cold Reset"
                   >
                     <RotateCcw className="w-4 h-4" />
                   </button>
                   <button 
                    onClick={() => setIsAutoRefining(!isAutoRefining)}
                    className={`p-2.5 rounded-xl transition-all border active:scale-95 flex items-center gap-2 ${isAutoRefining ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : 'text-teal-400 bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20'}`}
                    title="Live Engine"
                   >
                     <PlayCircle className={`w-4 h-4 ${isAutoRefining ? 'animate-pulse' : ''}`} />
                   </button>
                </div>
              </div>

              <div className="space-y-5 relative z-10">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 group/model hover:border-teal-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Beaker className="w-3.5 h-3.5 text-teal-500" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural Model</label>
                  </div>
                  <select 
                    value={simPhase}
                    onChange={(e) => setSimPhase(e.target.value)}
                    className="w-full px-3 py-3 bg-black/60 border border-slate-700 rounded-xl text-xs font-bold text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Simple Cubic">Simple Cubic (P m-3m)</option>
                    <option value="BCC">Body Centered (I m-3m)</option>
                    <option value="FCC">Face Centered (F m-3m)</option>
                    <option value="Quartz">Quartz (P 32 21)</option>
                  </select>
                </div>

                <div className="space-y-6">
                  {/* Phase & Structure Group */}
                  <div className="space-y-3">
                    <div className="text-[9px] uppercase text-slate-500 font-bold tracking-widest px-2 pb-1 border-b border-slate-800/80">Phase & Structure</div>
                    
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Ruler className="w-3.5 h-3.5 text-teal-400" />
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lattice (a)</label>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.001"
                            value={userParams.a}
                            onChange={(e) => setUserParams({...userParams, a: parseFloat(e.target.value) || userParams.a})}
                            className="w-16 bg-black/60 text-xs font-mono font-black text-teal-400 px-2 py-1 rounded-md border border-slate-700/50 focus:outline-none focus:border-teal-500/50 text-right"
                          />
                          <span className="text-[10px] font-black text-slate-500">Å</span>
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min={simPhase === 'Quartz' ? 4.5 : 2.5} 
                        max={simPhase === 'Quartz' ? 5.5 : 6.0} 
                        step="0.001"
                        value={userParams.a}
                        onChange={(e) => setUserParams({...userParams, a: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
                      />
                    </div>

                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Maximize className="w-3.5 h-3.5 text-blue-400" />
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intensity Scale</label>
                        </div>
                        <input
                          type="number"
                          step="10"
                          value={userParams.scale}
                          onChange={(e) => setUserParams({...userParams, scale: parseFloat(e.target.value) || userParams.scale})}
                          className="w-16 bg-black/60 text-xs font-mono font-black text-blue-400 px-2 py-1 rounded-md border border-slate-700/50 focus:outline-none focus:border-blue-500/50 text-right"
                        />
                      </div>
                      <input 
                        type="range" 
                        min="100" 
                        max="2000" 
                        step="10"
                        value={userParams.scale}
                        onChange={(e) => setUserParams({...userParams, scale: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Peak Management Group */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-800/80 mt-2">
                       <div className="text-[9px] uppercase text-slate-500 font-bold tracking-widest">Diffraction Peaks</div>
                       <div className="text-[8px] text-slate-600 font-mono">{userParams.peaks.filter(p => p.enabled).length} Active</div>
                    </div>

                    <div className="bg-[#050B14] rounded-xl border border-[#1e293b] overflow-hidden">
                       <div className="max-h-[200px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                         <table className="w-full text-left border-collapse">
                           <thead className="sticky top-0 bg-[#050B14] z-10">
                             <tr className="border-b border-slate-800">
                               <th className="p-2 text-[8px] uppercase text-slate-500 font-black">HKL</th>
                               <th className="p-2 text-[8px] uppercase text-slate-500 font-black text-center">Int. & Status</th>
                               <th className="p-2 text-[8px] uppercase text-slate-500 font-black text-right">Del</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800/50">
                             {userParams.peaks.map((peak, pIdx) => (
                               <tr key={pIdx} className={`group hover:bg-slate-800/30 transition-colors ${!peak.enabled ? 'opacity-30' : ''}`}>
                                 <td className="p-2">
                                   <div className="flex gap-0.5 items-center">
                                     <input 
                                       type="number"
                                       value={peak.h}
                                       min="0"
                                       max="9"
                                       onChange={(e) => {
                                         const newPeaks = [...userParams.peaks];
                                         newPeaks[pIdx].h = parseInt(e.target.value) || 0;
                                         setUserParams({...userParams, peaks: newPeaks});
                                       }}
                                       className="w-5 bg-black/40 border border-slate-700/50 rounded text-[9px] font-mono text-slate-300 text-center"
                                     />
                                     <input 
                                       type="number"
                                       value={peak.k}
                                       min="0"
                                       max="9"
                                       onChange={(e) => {
                                         const newPeaks = [...userParams.peaks];
                                         newPeaks[pIdx].k = parseInt(e.target.value) || 0;
                                         setUserParams({...userParams, peaks: newPeaks});
                                       }}
                                       className="w-5 bg-black/40 border border-slate-700/50 rounded text-[9px] font-mono text-slate-300 text-center"
                                     />
                                     <input 
                                       type="number"
                                       value={peak.l}
                                       min="0"
                                       max="9"
                                       onChange={(e) => {
                                         const newPeaks = [...userParams.peaks];
                                         newPeaks[pIdx].l = parseInt(e.target.value) || 0;
                                         setUserParams({...userParams, peaks: newPeaks});
                                       }}
                                       className="w-5 bg-black/40 border border-slate-700/50 rounded text-[9px] font-mono text-slate-300 text-center"
                                     />
                                   </div>
                                 </td>
                                 <td className="p-2 text-center flex items-center justify-center gap-2">
                                   <input 
                                     type="number"
                                     value={peak.intensity}
                                     step="50"
                                     onChange={(e) => {
                                       const newPeaks = [...userParams.peaks];
                                       newPeaks[pIdx].intensity = parseInt(e.target.value) || 0;
                                       setUserParams({...userParams, peaks: newPeaks});
                                     }}
                                     className="w-12 bg-black/40 border border-slate-700/50 rounded px-1 py-0.5 text-[10px] font-mono text-blue-400 text-right"
                                   />
                                   <button 
                                     onClick={() => {
                                       const newPeaks = [...userParams.peaks];
                                       newPeaks[pIdx].enabled = !newPeaks[pIdx].enabled;
                                       setUserParams({...userParams, peaks: newPeaks});
                                     }}
                                     className={`p-1 rounded transition-colors ${peak.enabled ? 'text-teal-400 hover:bg-teal-500/20' : 'text-slate-500 hover:bg-slate-700'}`}
                                   >
                                      {peak.enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                   </button>
                                 </td>
                                 <td className="p-2 text-right">
                                   <button 
                                     onClick={() => {
                                       const newPeaks = userParams.peaks.filter((_, i) => i !== pIdx);
                                       setUserParams({...userParams, peaks: newPeaks});
                                     }}
                                     className="p-1 text-slate-600 hover:text-rose-500 transition-colors"
                                   >
                                     <Zap className="w-3.5 h-3.5" />
                                   </button>
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                       
                       <div className="p-2 bg-slate-900/30 border-t border-slate-800 flex gap-2">
                         <button 
                            onClick={() => {
                              // generate next HKL or just add a placeholder
                              const newPeak: SimulationPeak = { h: 1, k: 1, l: 1, intensity: 1000, enabled: true };
                              setUserParams({...userParams, peaks: [...userParams.peaks, newPeak]});
                            }}
                            className="flex-1 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                         >
                           <Layers className="w-3 h-3" /> Add Peak
                         </button>
                         <button 
                            onClick={() => {
                              const initial = getPeaksForPhase(simPhase, userParams.a);
                              setUserParams({...userParams, peaks: initial});
                            }}
                            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                            title="Reset Peaks"
                         >
                           <RotateCcw className="w-3.5 h-3.5" />
                         </button>
                       </div>
                    </div>
                  </div>

                  {/* Microstructure & Profile Group */}
                  <div className="space-y-3">
                    <div className="text-[9px] uppercase text-slate-500 font-bold tracking-widest px-2 pb-1 border-b border-slate-800/80 mt-2">Peak Profile & Microstructure</div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">FWHM</label>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="0.01"
                              value={userParams.fwhm}
                              onChange={(e) => setUserParams({...userParams, fwhm: parseFloat(e.target.value) || userParams.fwhm})}
                              className="w-[42px] bg-black/60 text-[10px] font-mono font-black text-rose-400 px-1 py-0.5 rounded border border-slate-700/50 text-right"
                            />
                          </div>
                        </div>
                        <input type="range" min="0.05" max="1.0" step="0.01" value={userParams.fwhm} onChange={(e) => setUserParams({...userParams, fwhm: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-rose-500" />
                      </div>

                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mix (η)</label>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="0.01"
                              value={userParams.eta}
                              onChange={(e) => setUserParams({...userParams, eta: parseFloat(e.target.value) || userParams.eta})}
                              className="w-[42px] bg-black/60 text-[10px] font-mono font-black text-rose-400 px-1 py-0.5 rounded border border-slate-700/50 text-right"
                            />
                          </div>
                        </div>
                        <input type="range" min="0.0" max="1.0" step="0.01" value={userParams.eta} onChange={(e) => setUserParams({...userParams, eta: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-rose-500" />
                      </div>

                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Size (nm)</label>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="1"
                              value={userParams.crystalliteSize}
                              onChange={(e) => setUserParams({...userParams, crystalliteSize: parseFloat(e.target.value) || userParams.crystalliteSize})}
                              className="w-[42px] bg-black/60 text-[10px] font-mono font-black text-indigo-400 px-1 py-0.5 rounded border border-slate-700/50 text-right"
                            />
                          </div>
                        </div>
                        <input type="range" min="1" max="2000" step="1" value={userParams.crystalliteSize} onChange={(e) => setUserParams({...userParams, crystalliteSize: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                      </div>

                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Strain %</label>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="0.01"
                              value={userParams.microstrain}
                              onChange={(e) => setUserParams({...userParams, microstrain: parseFloat(e.target.value) || userParams.microstrain})}
                              className="w-[42px] bg-black/60 text-[10px] font-mono font-black text-amber-400 px-1 py-0.5 rounded border border-slate-700/50 text-right"
                            />
                          </div>
                        </div>
                        <input type="range" min="0" max="2" step="0.01" value={userParams.microstrain} onChange={(e) => setUserParams({...userParams, microstrain: parseFloat(e.target.value)})} className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-amber-500" />
                      </div>
                    </div>
                  </div>

                  {/* Instrumental Group */}
                  <div className="space-y-3">
                    <div className="text-[9px] uppercase text-slate-500 font-bold tracking-widest px-2 pb-1 border-b border-slate-800/80 mt-2">Instrument & Background</div>

                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Ruler className="w-3.5 h-3.5 text-zinc-400" />
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sample Displ. (mm)</label>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={userParams.sampleDisplacement}
                          onChange={(e) => setUserParams({...userParams, sampleDisplacement: parseFloat(e.target.value) || 0})}
                          className="w-16 bg-black/60 text-xs font-mono font-black text-zinc-400 px-2 py-1 rounded-md border border-slate-700/50 focus:outline-none focus:border-zinc-500/50 text-right"
                        />
                      </div>
                      <input 
                        type="range" 
                        min="-2.0" 
                        max="2.0" 
                        step="0.01"
                        value={userParams.sampleDisplacement}
                        onChange={(e) => setUserParams({...userParams, sampleDisplacement: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-zinc-500 hover:accent-zinc-400 transition-all"
                      />
                    </div>

                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <ChartIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zero Shift (°)</label>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={userParams.zeroShift}
                          onChange={(e) => setUserParams({...userParams, zeroShift: parseFloat(e.target.value) || 0})}
                          className="w-16 bg-black/60 text-xs font-mono font-black text-zinc-400 px-2 py-1 rounded-md border border-slate-700/50 focus:outline-none focus:border-zinc-500/50 text-right"
                        />
                      </div>
                      <input 
                        type="range" 
                        min="-1.0" 
                        max="1.0" 
                        step="0.01"
                        value={userParams.zeroShift}
                        onChange={(e) => setUserParams({...userParams, zeroShift: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-zinc-500 hover:accent-zinc-400 transition-all"
                      />
                    </div>

                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <ChartIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Noise Floor</label>
                        </div>
                        <input
                          type="number"
                          step="1"
                          value={userParams.background}
                          onChange={(e) => setUserParams({...userParams, background: parseFloat(e.target.value) || userParams.background})}
                          className="w-16 bg-black/60 text-xs font-mono font-black text-zinc-400 px-2 py-1 rounded-md border border-slate-700/50 focus:outline-none focus:border-zinc-500/50 text-right"
                        />
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        step="1"
                        value={userParams.background}
                        onChange={(e) => setUserParams({...userParams, background: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-zinc-500 hover:accent-zinc-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-800/50 mt-2">
                  <div className="bg-black/60 p-5 rounded-2xl border border-slate-700/50 shadow-inner relative overflow-hidden group/fit">
                    <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover/fit:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Goodness of Fit</span>
                        <span className="text-[9px] font-mono text-teal-500/60 font-bold">Rwp_index_matrix</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-3xl font-black font-mono transition-colors tracking-tighter ${rFactor < 15 ? 'text-emerald-400' : rFactor < 30 ? 'text-amber-400 text-shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'text-rose-500 text-shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}>
                          {rFactor.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {rHistory.length > 2 && (
                    <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-slate-800/50 animate-in fade-in zoom-in duration-500">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Convergence Trend</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-teal-400/70 uppercase">Iter</span>
                          <span className="text-[10px] font-mono font-black text-teal-400">{iterCount}</span>
                        </div>
                      </div>
                      <div className="h-20 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={rHistory}>
                            <defs>
                              <linearGradient id="rGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Area 
                              type="monotone" 
                              dataKey="r" 
                              stroke="#14b8a6" 
                              fill="url(#rGradient)" 
                              strokeWidth={2}
                              isAnimationActive={false}
                            />
                            <YAxis hide domain={['dataMin', 'dataMax']} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {isAutoRefining && (
                    <div className="mt-4 flex items-center gap-3 bg-teal-500/10 p-4 rounded-xl border border-teal-500/20 backdrop-blur-sm animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping shadow-[0_0_8px_rgba(20,184,166,0.8)] shrink-0" />
                      <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                         Status: Engine running... Minimizing {rFactor > 20 ? 'Structural Mismatch' : 'Residual Noise'}
                      </p>
                    </div>
                  )}

                  {!isAutoRefining && rHistory.length > 0 && rFactor < 15 && (
                    <div className="mt-4 flex items-center gap-3 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 backdrop-blur-sm">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                         Refinement Converged: Global Minimum Reached
                      </p>
                    </div>
                  )}
                  
                  {!isAutoRefining && rHistory.length === 0 && (
                    <div className="mt-4 flex items-center gap-3 bg-teal-500/5 p-4 rounded-xl border border-teal-500/10 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)] shrink-0" />
                      <p className="text-[10px] text-teal-400/80 leading-relaxed font-bold uppercase tracking-wider">
                        Optimization Strategy: Target Residual Reduction below 15%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[650px] flex flex-col relative overflow-hidden group/pattern">
              <div className="absolute top-0 left-0 -mt-8 -ml-8 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl group-hover/pattern:bg-teal-500/10 transition-all duration-1000"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
                 <div>
                   <h3 className="text-xl font-black text-white flex items-center gap-3">
                     <div className="p-2 bg-teal-500/20 rounded-lg border border-teal-500/30">
                        <BarChart2 className="w-5 h-5 text-teal-400" />
                     </div>
                     Diffraction Pattern Analysis
                   </h3>
                   <div className="flex items-center gap-2 mt-1.5 px-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Real-time Spectral Synthesis</span>
                   </div>
                 </div>

                 <div className="flex gap-4 p-2.5 bg-black/40 rounded-2xl border border-slate-800/50 shadow-inner">
                    <div className="flex items-center gap-2 px-2 border-r border-slate-800 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-slate-200 shadow-[0_0_8px_rgba(226,232,240,0.5)]"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Obs</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 border-r border-slate-800 last:border-0">
                      <div className="w-4 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calc</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 border-r border-slate-800 last:border-0 font-mono">
                      <div className="w-4 h-[2px] border-t-2 border-dashed border-slate-600 rounded-full"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bkg</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 border-r border-slate-800 last:border-0 font-mono">
                      <div className="w-4 h-[2px] bg-slate-500 rounded-full"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diff</span>
                    </div>
                 </div>
              </div>

              <div className="flex-1 w-full min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={generatePatternData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="diffGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#475569" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="twoTheta" 
                      type="number" 
                      domain={[SIMULATION_RANGE.start, SIMULATION_RANGE.end]} 
                      label={{ value: 'Angular Position [2θ°]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontWeight: 900, textAnchor: 'middle', letterSpacing: '0.1em' }}
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#334155', strokeWidth: 1 }}
                      tickLine={{ stroke: '#334155' }}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                      itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'monospace' }}
                      cursor={{ stroke: '#334155', strokeWidth: 1 }}
                      formatter={(value: number) => value.toFixed(1)}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="diff" 
                      stroke="#64748b" 
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                    
                    <Scatter 
                      dataKey="obs" 
                      fill="#e2e8f0" 
                      shape={(props) => {
                        const { cx, cy } = props;
                        return <circle cx={cx} cy={cy} r={1.5} fill="#f8fafc" fillOpacity={0.8} />;
                      }}
                      isAnimationActive={false}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="calc" 
                      stroke="#ef4444" 
                      strokeWidth={1.5} 
                      dot={false} 
                      activeDot={{ r: 4, fill: '#ef4444', stroke: '#fff', strokeWidth: 1.5 }}
                      isAnimationActive={false}
                    />

                    <Line 
                      type="monotone" 
                      dataKey="bkg" 
                      stroke="#334155"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Status Overlay */}
              <div className="absolute bottom-6 left-8 flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 z-20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Data Feed</span>
                </div>
                <div className="h-3 w-[1px] bg-slate-700" />
                <span className="text-[9px] font-mono text-slate-500 uppercase">Resolution: {SIMULATION_RANGE.step}°/step</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- Setup Generator Tab Content ---
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          {/* Refinement Dashboard Card */}
          <div className="bg-[#0B1221] p-6 rounded-3xl border border-[#1e293b] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <RefreshCw className="w-32 h-32 rotate-12" />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                    <Database className="w-5 h-5 text-teal-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Setup Dashboard</h2>
                </div>
                <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">
                  Total refined parameters: <span className="text-teal-400 font-bold">{refinementMetrics.total}</span>. 
                  Strategy includes <span className="text-amber-400 font-bold">{refinementMetrics.global} global</span> and <span className="text-indigo-400 font-bold">{refinementMetrics.phase} phase</span> coefficients.
                </p>
                <p className="text-slate-400 text-[10px] font-medium leading-relaxed mt-2 italic flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-teal-400" />
                  Guide: Start with Scale/Bkg, then Zero-Shift, Lattice, Peak Shape, and Structure.
                </p>
              </div>

              <div className="flex flex-row md:flex-nowrap gap-4 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
                 <div className="flex-1 md:flex-none bg-[#050B14] px-5 py-3 rounded-2xl border border-[#1e293b] flex flex-col items-center min-w-[100px]">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 text-center">Active Flags</span>
                    <span className="text-xl font-black text-teal-400 font-mono">{refinementMetrics.total}</span>
                 </div>
                 <div className="flex-1 md:flex-none bg-[#050B14] px-5 py-3 rounded-2xl border border-[#1e293b] flex flex-col items-center min-w-[100px]">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 text-center">Active Phases</span>
                    <span className="text-xl font-black text-amber-400 font-mono">{refinementMetrics.activePhases}</span>
                 </div>
                 <button 
                    onClick={handleGenerate}
                    className="shrink-0 flex-none px-8 py-3 bg-teal-500 hover:bg-teal-400 text-[#050B14] rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_30px_rgba(20,184,166,0.4)] transition-all flex items-center justify-center gap-2 group/btn whitespace-nowrap min-w-[180px]"
                  >
                    <Zap className="w-4 h-4 shrink-0 group-hover:scale-125 transition-transform" />
                    Build Strategy
                  </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Configuration */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_0_50px_rgba(20,184,166,0.05)] border border-[#1e293b] relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-teal-600 rounded-full opacity-10 blur-[60px]"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2.5 bg-teal-500/20 rounded-xl border border-teal-500/30 shadow-inner">
                  <Settings className="w-5 h-5 text-teal-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Refinement Setup</h2>
              </div>
    
              <div className="space-y-6 relative z-10">
                {/* Global Settings */}
                {/* Global Parameters Section */}
                <div className="bg-[#0B1221] p-5 rounded-2xl border border-[#1e293b] shadow-inner space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       Global Configuration
                    </h3>
                    <button 
                      onClick={() => setExpertMode(!expertMode)}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${expertMode ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}
                    >
                      {expertMode ? 'Expert Mode: ON' : 'Expert Mode: OFF'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Max Obs Intensity</label>
                      <input
                        type="number"
                        value={maxObsIntensity}
                        onChange={(e) => setMaxObsIntensity(parseFloat(e.target.value))}
                        className="w-full px-4 py-2.5 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-lg text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Radiation Source</label>
                      <select 
                         value={radSource}
                         onChange={(e) => {
                           setRadSource(e.target.value);
                           if (e.target.value === 'Cu_Ka1') setWavelength(1.54056);
                           else if (e.target.value === 'Cu_Ka_avg') setWavelength(1.5418);
                           else if (e.target.value === 'Co_Ka1') setWavelength(1.78896);
                           else if (e.target.value === 'Mo_Ka1') setWavelength(0.70932);
                           else if (e.target.value === 'Cr_Ka1') setWavelength(2.2897);
                         }}
                         className="w-full px-3 py-2.5 bg-[#050B14] text-amber-400 border border-[#1e293b] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      >
                        <option value="Cu_Ka1">Cu Kα1 (1.5406 Å)</option>
                        <option value="Cu_Ka_avg">Cu Kα Avg (1.5418 Å)</option>
                        <option value="Co_Ka1">Co Kα1 (1.7890 Å)</option>
                        <option value="Mo_Ka1">Mo Kα1 (0.7093 Å)</option>
                        <option value="Cr_Ka1">Cr Kα1 (2.2897 Å)</option>
                        <option value="Custom">Custom λ</option>
                      </select>
                    </div>
                  </div>

                  {radSource === 'Custom' && (
                    <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner animate-in slide-in-from-top-1">
                      <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Custom Wavelength (Å)</label>
                      <input
                        type="number" step="0.0001"
                        value={wavelength}
                        onChange={(e) => setWavelength(parseFloat(e.target.value))}
                        className="w-full bg-transparent text-amber-400 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#1e293b]/50">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Compass className="w-3 h-3" /> Instrumental Parameters
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner relative group border-t-2 border-t-transparent hover:border-[#1e293b] hover:border-t-rose-500/50 transition-all">
                        <div className="flex justify-between items-start mb-1.5">
                          <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest">Zero Shift (°)</label>
                          <button 
                            onClick={() => setRefineZeroShift(!refineZeroShift)}
                            className={`p-1 rounded-md border transition-all ${refineZeroShift ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-[#0B1221] border-slate-800 text-slate-600'}`}
                            title="Toggle Zero Shift Refinement"
                          >
                            <Zap className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          type="number" step="0.001"
                          value={setupZeroShift}
                          onChange={(e) => setSetupZeroShift(parseFloat(e.target.value))}
                          className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner relative group border-t-2 border-t-transparent hover:border-[#1e293b] hover:border-t-rose-500/50 transition-all">
                        <div className="flex justify-between items-start mb-1.5">
                          <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest">Sample Displ. (SyCos)</label>
                          <button 
                            onClick={() => setRefineSampleDisplacement(!refineSampleDisplacement)}
                            className={`p-1 rounded-md border transition-all ${refineSampleDisplacement ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-[#0B1221] border-slate-800 text-slate-600'}`}
                            title="Toggle Sample Displacement Refinement"
                          >
                            <Zap className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          type="number" step="0.001"
                          value={sampleDisplacement}
                          onChange={(e) => setSampleDisplacement(parseFloat(e.target.value))}
                          className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-3 bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                      <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Polarization Factor (Lp)</label>
                      <input
                        type="number" step="0.001"
                        value={polarization}
                        onChange={(e) => setPolarization(parseFloat(e.target.value))}
                        className="w-full bg-transparent text-amber-400 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1e293b]/50">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Background & Profile
                      </div>
                      <button 
                         onClick={() => setRefineBkg(!refineBkg)}
                         className={`px-2 py-0.5 rounded-md border transition-all flex items-center gap-1 ${refineBkg ? 'bg-teal-500/20 border-teal-500/40 text-teal-400' : 'bg-[#050B14] border-[#1e293b] text-slate-600'}`}
                         title="Toggle Background Refinement"
                      >
                         <Zap className="w-3 h-3" />
                         <span className="text-[7px] font-black uppercase">Refine Bkg</span>
                      </button>
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <select 
                           value={bgModel}
                           onChange={(e) => setBgModel(e.target.value as any)}
                           className="w-full px-3 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-lg text-[10px] font-bold focus:outline-none"
                        >
                          <option value="Chebyshev">Chebyshev Polynomial</option>
                          <option value="Shifted_Chebyshev">Shifted Chebyshev</option>
                          <option value="Polynomial">Standard Polynomial</option>
                          <option value="Linear_Interpolation">Linear Background</option>
                        </select>
                        {bgModel !== 'Linear_Interpolation' && (
                          <div className="flex items-center gap-2 px-2 py-1.5 bg-[#050B14] rounded-lg border border-[#1e293b]">
                            <span className="text-[8px] font-black text-slate-500 uppercase">Terms:</span>
                            <input 
                              type="number" min="1" max="24"
                              value={bgTerms}
                              onChange={(e) => setBgTerms(parseInt(e.target.value))}
                              className="w-full bg-transparent text-teal-400 text-[10px] font-mono font-black focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <select 
                           value={profileShape}
                           onChange={(e) => setProfileShape(e.target.value as any)}
                           className="w-full px-3 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-lg text-[10px] font-bold focus:outline-none"
                        >
                          <option value="Thompson-Cox-Hastings">Thompson-Cox (TCHZ)</option>
                          <option value="Pseudo-Voigt">Pseudo-Voigt (η)</option>
                          <option value="Pearson-VII">Pearson-VII (m)</option>
                        </select>
                        <div className="mt-2 text-[8px] font-medium text-slate-600 px-1 leading-tight">
                          Default: Full Axial Divergence Correction included
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
    
                {/* Phases */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-4 h-[2px] bg-[#1e293b]"></span> Phases
                     </h3>
                     <button onClick={addPhase} className="text-[10px] uppercase tracking-widest text-teal-400 font-black hover:text-teal-300 flex items-center gap-1 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 rounded-lg border border-teal-500/30 transition-all shadow-sm">
                       + Add Phase
                     </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {phases.map((phase, idx) => (
                      <div key={`phase-ref-${idx}-${phase.name}`} className="bg-[#0B1221] p-5 rounded-2xl border border-[#1e293b] shadow-inner relative group/phase transition-colors hover:border-teal-500/30">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/phase:opacity-100 transition-opacity">
                          <div className="relative group/presets">
                             <button className="text-slate-500 hover:text-amber-400 bg-[#050B14] p-1.5 rounded-lg border border-[#1e293b] hover:border-amber-500/50 transition-all shadow-sm flex items-center gap-1">
                               <PlayCircle className="w-3.5 h-3.5" />
                               <span className="text-[7px] font-black uppercase">Refine</span>
                             </button>
                             <div className="absolute right-0 top-full mt-2 w-48 bg-[#0F172A] border border-slate-800 rounded-xl shadow-2xl z-50 py-1 hidden group-hover/presets:block animate-in fade-in slide-in-from-top-1">
                               <div className="px-3 py-1.5 border-b border-slate-800 mb-1">
                                 <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Setup Presets</span>
                               </div>
                               <button onClick={() => applyRefinementPreset(idx, 'full')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-teal-400 flex items-center justify-between">
                                 <span>Full Characterization</span>
                                 <Zap className="w-3 h-3 text-amber-500" />
                               </button>
                               <button onClick={() => applyRefinementPreset(idx, 'lattice')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-teal-400">Lattice & Scale Only</button>
                               <button onClick={() => applyRefinementPreset(idx, 'profile')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-teal-400">Peak Shape Optimization</button>
                               <button onClick={() => applyRefinementPreset(idx, 'structure')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-300 hover:bg-slate-800 hover:text-teal-400">Atomic Positions (SOF/Biso)</button>
                               <div className="my-1 border-t border-slate-800"></div>
                               <button onClick={() => applyRefinementPreset(idx, 'none')} className="w-full text-left px-3 py-2 text-[9px] font-bold text-rose-500 hover:bg-rose-500/10">Clear All Flags</button>
                             </div>
                          </div>
                          
                          <button 
                            onClick={() => duplicatePhase(idx)}
                            className="text-slate-500 hover:text-teal-400 bg-[#050B14] p-1.5 rounded-lg border border-[#1e293b] hover:border-teal-500/50 transition-all shadow-sm"
                            title="Duplicate Phase"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {phases.length > 1 && (
                            <button 
                              onClick={() => removePhase(idx)}
                              className="text-slate-500 hover:text-red-400 bg-[#050B14] p-1.5 rounded-lg border border-[#1e293b] hover:border-red-500/50 transition-all shadow-sm"
                              title="Remove Phase"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                           <div className="grid gap-4">
                             <div className="flex flex-col gap-4">
                               <div className="flex-1">
                               <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Phase Name</label>
                               <input
                                 type="text"
                                 value={phase.name}
                                 onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                                 className="w-full px-4 py-2 bg-[#050B14] text-white border border-[#1e293b] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all shadow-inner"
                               />
                             </div>
                              <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner space-y-3 mt-4">
                                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                                  <span className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-black">Active Refinements</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineScale', !phase.refineScale)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineScale ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                    title="Refine Phase Scale"
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">SCALE</span>
                                    <Scale className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineScale ? 'scale-110 text-blue-400' : 'text-slate-600 group-hover:text-blue-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineLattice', !phase.refineLattice)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineLattice ? 'bg-teal-500/10 border-teal-500/50 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                    title="Refine Lattice Parameters"
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">LATTICE</span>
                                    <Ruler className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineLattice ? 'scale-110 text-teal-400' : 'text-slate-600 group-hover:text-teal-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineProfile', !phase.refineProfile)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineProfile ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                    title="Refine Profile Parameters (U, V, W)"
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">PROFILE</span>
                                    <Activity className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineProfile ? 'scale-110 text-rose-400' : 'text-slate-600 group-hover:text-rose-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineAtomicPos', !phase.refineAtomicPos)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineAtomicPos ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                    title="Refine Atomic Positions"
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">ATOMS</span>
                                    <Layers className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineAtomicPos ? 'scale-110 text-emerald-400' : 'text-slate-600 group-hover:text-emerald-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineCrystalliteSize', !phase.refineCrystalliteSize)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineCrystalliteSize ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                    title="Refine Crystallite Size"
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">SIZE (LX)</span>
                                    <Maximize className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineCrystalliteSize ? 'scale-110 text-indigo-400' : 'text-slate-600 group-hover:text-indigo-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineMicrostrain', !phase.refineMicrostrain)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineMicrostrain ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                    title="Refine Microstrain"
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">STRAIN (LY)</span>
                                    <Zap className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineMicrostrain ? 'scale-110 text-amber-400' : 'text-slate-600 group-hover:text-amber-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineAsymmetry', !phase.refineAsymmetry)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineAsymmetry ? 'bg-teal-400/10 border-teal-400/50 text-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">ASYMMETRY</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineAsymmetry ? 'scale-110 text-teal-300' : 'text-slate-600 group-hover:text-teal-300/50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineExtinction', !phase.refineExtinction)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineExtinction ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">EXTINCTION</span>
                                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineExtinction ? 'scale-110 text-orange-400' : 'text-slate-600 group-hover:text-orange-400/50'}`} />
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineBiso', !phase.refineBiso)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineBiso ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">B-ISO</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineBiso ? 'scale-110 text-yellow-400' : 'text-slate-600 group-hover:text-yellow-400/50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refineOcc', !phase.refineOcc)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between group ${phase.refineOcc ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">OCCUPANCY</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refineOcc ? 'scale-110 text-fuchsia-400' : 'text-slate-600 group-hover:text-fuchsia-400/50'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                  </button>
                                  <button 
                                    onClick={() => updatePhase(idx, 'refinePrefOrient', !phase.refinePrefOrient)}
                                    className={`px-2 py-2 rounded-lg border transition-all flex items-center justify-between col-span-2 group ${phase.refinePrefOrient ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                                  >
                                    <span className="text-[9px] font-bold tracking-wider truncate">PREFERRED ORIENTATION</span>
                                    <Compass className={`w-3.5 h-3.5 shrink-0 transition-transform ${phase.refinePrefOrient ? 'scale-110 text-cyan-400' : 'text-slate-600 group-hover:text-cyan-400/50'}`} />
                                  </button>
                                </div>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Space Group</label>
                               <input
                                 type="text"
                                 placeholder="e.g. Fd-3m"
                                 value={phase.spaceGroup || ''}
                                 onChange={(e) => updatePhase(idx, 'spaceGroup', e.target.value)}
                                 className="w-full px-4 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all shadow-inner"
                               />
                             </div>
                             <div>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">Phase Scale</label>
                               <input
                                 type="number"
                                 step="0.0001"
                                 value={phase.scale || 1.0}
                                 onChange={(e) => updatePhase(idx, 'scale', parseFloat(e.target.value))}
                                 className="w-full px-4 py-2 bg-[#050B14] text-blue-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
                               />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-2">System</label>
                              <select
                                value={phase.crystalSystem}
                                onChange={(e) => updatePhase(idx, 'crystalSystem', e.target.value)}
                                className="w-full px-3 py-2 bg-[#050B14] text-white border border-[#1e293b] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all shadow-inner"
                              >
                                <option value="Cubic">Cubic</option>
                                <option value="Tetragonal">Tetragonal</option>
                                <option value="Orthorhombic">Orthorhombic</option>
                                <option value="Hexagonal">Hexagonal</option>
                                <option value="Monoclinic">Monoclinic</option>
                                <option value="Triclinic">Triclinic</option>
                              </select>
                            </div>
                            <div>
                               <label className="block text-[10px] uppercase text-slate-400 font-black mb-2 tracking-widest">a (Å)</label>
                               <input
                                type="number"
                                step="0.001"
                                value={phase.a}
                                onChange={(e) => updatePhase(idx, 'a', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 shadow-inner"
                              />
                            </div>
                          </div>
                          
                          {/* Conditional inputs for non-cubic */}
                          {['Tetragonal', 'Orthorhombic', 'Hexagonal', 'Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                            <div className="grid grid-cols-3 gap-3">
                                 {['Orthorhombic', 'Monoclinic', 'Triclinic', 'Hexagonal', 'Tetragonal'].includes(phase.crystalSystem) && (
                                    <div>
                                       <label className="block text-[10px] uppercase text-slate-500 font-black mb-2 tracking-widest">c (Å)</label>
                                       <input
                                          type="number"
                                          step="0.01"
                                          value={phase.c || phase.a}
                                          onChange={(e) => updatePhase(idx, 'c', parseFloat(e.target.value))}
                                          className="w-full px-3 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 shadow-inner"
                                        />
                                    </div>
                                 )}
                                 {['Orthorhombic', 'Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                                    <div>
                                       <label className="block text-[10px] uppercase text-slate-500 font-black mb-2 tracking-widest">b (Å)</label>
                                       <input
                                          type="number"
                                          step="0.01"
                                          value={phase.b || phase.a}
                                          onChange={(e) => updatePhase(idx, 'b', parseFloat(e.target.value))}
                                          className="w-full px-3 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 shadow-inner"
                                        />
                                    </div>
                                 )}
                                 {['Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                                    <div>
                                       <label className="block text-[10px] uppercase text-slate-500 font-black mb-2 tracking-widest">β (°)</label>
                                       <input
                                          type="number"
                                          step="0.1"
                                          value={phase.beta || 90}
                                          onChange={(e) => updatePhase(idx, 'beta', parseFloat(e.target.value))}
                                          className="w-full px-3 py-2 bg-[#050B14] text-teal-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 shadow-inner"
                                        />
                                    </div>
                                 )}
                              </div>
                           )}

                           {/* Physical Density Calculator Fields */}
                           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1e293b]/50">
                             <div>
                               <label className="block text-[10px] uppercase text-slate-500 font-black mb-2 tracking-widest">Z (Formula Units)</label>
                               <input
                                  type="number"
                                  placeholder="e.g. 8"
                                  value={phase.zValue || ''}
                                  onChange={(e) => updatePhase(idx, 'zValue', parseInt(e.target.value))}
                                  className="w-full px-3 py-2.5 bg-[#050B14] text-amber-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-inner"
                                />
                             </div>
                             <div>
                               <label className="block text-[10px] uppercase text-slate-500 font-black mb-2 tracking-widest">Molar Mass (g/mol)</label>
                               <input
                                  type="number"
                                  step="0.01"
                                  placeholder="e.g. 28.08"
                                  value={phase.molarMass || ''}
                                  onChange={(e) => updatePhase(idx, 'molarMass', parseFloat(e.target.value))}
                                  className="w-full px-3 py-2.5 bg-[#050B14] text-amber-400 border border-[#1e293b] rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-inner"
                                />
                             </div>
                           </div>

                           {expertMode && (
                             <div className="pt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                               <h4 className="text-[9px] font-black text-rose-400/70 uppercase tracking-[0.2em] mb-2 px-1">Caglioti Peak Parameters (U, V, W)</h4>
                               <div className="grid grid-cols-3 gap-3">
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1 truncate">U</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.u || 0.01}
                                      onChange={(e) => updatePhase(idx, 'u', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1 truncate">V</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.v || -0.01}
                                      onChange={(e) => updatePhase(idx, 'v', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1 truncate">W</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.w || 0.01}
                                      onChange={(e) => updatePhase(idx, 'w', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">LX (Size - Lorentzian)</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.lx || 0}
                                      onChange={(e) => updatePhase(idx, 'lx', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-indigo-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">LY (Strain - Lorentzian)</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.ly || 0}
                                      onChange={(e) => updatePhase(idx, 'ly', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-indigo-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">Mixing Eta (G/L Mix)</label>
                                   <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="1"
                                      value={phase.eta || 0.5}
                                      onChange={(e) => updatePhase(idx, 'eta', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-teal-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">Shape Factor (Pearson-VII)</label>
                                   <input
                                      type="number"
                                      step="0.01"
                                      value={phase.shape || 2.0}
                                      onChange={(e) => updatePhase(idx, 'shape', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-teal-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">Peak Asymmetry</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.asymmetry || 0}
                                      onChange={(e) => updatePhase(idx, 'asymmetry', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-emerald-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                                 <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                   <label className="block text-[9px] uppercase text-slate-500 font-black mb-1">Extinction (Eb)</label>
                                   <input
                                      type="number"
                                      step="0.001"
                                      value={phase.extinction || 0}
                                      onChange={(e) => updatePhase(idx, 'extinction', parseFloat(e.target.value))}
                                      className="w-full bg-transparent text-orange-400 text-xs font-mono font-bold focus:outline-none"
                                    />
                                 </div>
                               </div>

                               {(phase.refinePrefOrient || phase.marchDollase !== undefined) && (
                                 <div className="bg-[#0B1221] p-4 rounded-xl border border-cyan-500/20 mt-4 space-y-3 animate-in fade-in slide-in-from-top-1">
                                    <h4 className="text-[9px] font-black text-cyan-400/70 uppercase tracking-[0.2em] flex items-center gap-2">
                                      <Compass className="w-3 h-3" /> Preferred Orientation Setup
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                        <label className="block text-[8px] uppercase text-slate-600 font-black mb-1">March-Dollase r</label>
                                        <input
                                          type="number" step="0.01" min="0" max="1"
                                          value={phase.marchDollase || 1.0}
                                          onChange={(e) => updatePhase(idx, 'marchDollase', parseFloat(e.target.value))}
                                          className="w-full bg-transparent text-cyan-400 text-xs font-mono font-bold focus:outline-none"
                                        />
                                      </div>
                                      <div className="bg-[#050B14] p-3 rounded-xl border border-[#1e293b] shadow-inner">
                                        <label className="block text-[8px] uppercase text-slate-600 font-black mb-1">PO Vector [HKL]</label>
                                        <div className="flex gap-2">
                                          {[0, 1, 2].map(i => (
                                            <input
                                              key={`hkl-${i}`}
                                              type="number"
                                              value={phase.prefOrientHKL ? phase.prefOrientHKL[i] : (i === 2 ? 1 : 0)}
                                              onChange={(e) => {
                                                const current = phase.prefOrientHKL || [0, 0, 1];
                                                const next = [...current] as [number, number, number];
                                                next[i] = parseInt(e.target.value) || 0;
                                                updatePhase(idx, 'prefOrientHKL', next);
                                              }}
                                              className="w-1/3 bg-transparent text-cyan-400 text-xs font-mono font-bold focus:outline-none text-center border-b border-[#1e293b]"
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-[8px] text-slate-500 font-medium italic">
                                      r &lt; 1: Platy (needle-like) habit; r &gt; 1: Acicular habit. Usually refined along unique axis.
                                    </p>
                                 </div>
                               )}

                               <div className="space-y-3">
                                 <div className="flex justify-between items-center px-1">
                                   <div className="flex flex-col">
                                     <h4 className="text-[9px] font-black text-teal-400/70 uppercase tracking-[0.2em]">Atomic Structure ({phase.atoms?.length || 0})</h4>
                                     {phase.a > 0 && phase.zValue && phase.molarMass && (
                                       <span className="text-[8px] text-slate-500 font-bold">
                                         Estimated Density: {( (phase.zValue * phase.molarMass) / (calculateCellVolume({
                                           a: phase.a,
                                           b: phase.b || phase.a,
                                           c: phase.c || phase.a,
                                           alpha: phase.alpha || 90,
                                           beta: phase.beta || 90,
                                           gamma: phase.gamma || 90
                                         }) * 0.6022) ).toFixed(3)} g/cm³
                                       </span>
                                     )}
                                   </div>
                                   <div className="flex gap-2">
                                     {phase.atoms && phase.atoms.length > 0 && (
                                       <button 
                                         onClick={() => clearAtoms(idx)}
                                         className="text-slate-400 hover:text-rose-400 text-[8px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 transition-all font-black uppercase tracking-widest"
                                       >
                                         Clear
                                       </button>
                                     )}
                                     <button 
                                       onClick={() => addAtom(idx)}
                                       className="text-white hover:text-teal-400 text-[9px] bg-teal-500/20 px-2 py-0.5 rounded border border-teal-500/30 transition-all font-black uppercase tracking-widest"
                                     >
                                       + Add Atom
                                     </button>
                                   </div>
                                 </div>
                                 
                                 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                   {(phase.atoms || []).map((atom, aIdx) => (
                                     <div key={`atom-${idx}-${aIdx}`} className="grid grid-cols-6 gap-2 bg-[#050B14] p-2 rounded-lg border border-slate-800 relative group/atom hover:border-slate-700 transition-colors">
                                       <div className="col-span-1">
                                         <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">El</label>
                                         <input 
                                           value={atom.element} 
                                           onChange={(e) => updateAtom(idx, aIdx, 'element', e.target.value)}
                                           className="w-full bg-transparent text-white text-[10px] font-bold focus:outline-none"
                                         />
                                       </div>
                                       <div className="col-span-3 grid grid-cols-3 gap-1">
                                         <div>
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">X</label>
                                           <input 
                                             type="number" step="0.001"
                                             value={atom.x} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'x', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-teal-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">Y</label>
                                           <input 
                                             type="number" step="0.001"
                                             value={atom.y} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'y', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-teal-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                         <div>
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">Z</label>
                                           <input 
                                             type="number" step="0.001"
                                             value={atom.z} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'z', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-teal-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                       </div>
                                       <div className="col-span-1">
                                         <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5 text-center">SOF</label>
                                         <input 
                                           type="number" step="0.1"
                                           value={atom.occupancy} 
                                           onChange={(e) => updateAtom(idx, aIdx, 'occupancy', parseFloat(e.target.value))}
                                           className="w-full text-center bg-transparent text-amber-400 text-[10px] font-mono focus:outline-none"
                                         />
                                       </div>
                                       <div className="col-span-1 flex items-center gap-1">
                                         <div className="flex-1">
                                           <label className="block text-[7px] uppercase text-slate-600 font-bold mb-0.5">Biso</label>
                                           <input 
                                             type="number" step="0.1"
                                             value={atom.bIso} 
                                             onChange={(e) => updateAtom(idx, aIdx, 'bIso', parseFloat(e.target.value))}
                                             className="w-full bg-transparent text-rose-400 text-[10px] font-mono focus:outline-none"
                                           />
                                         </div>
                                         <button onClick={() => removeAtom(idx, aIdx)} className="opacity-0 group-hover/atom:opacity-100 text-rose-500 hover:text-rose-400 transition-opacity">
                                           <RotateCcw className="w-3 h-3 transform rotate-45" />
                                         </button>
                                       </div>
                                     </div>
                                   ))}
                                   {(!phase.atoms || phase.atoms.length === 0) && (
                                     <div className="text-center py-4 bg-[#050B14]/50 rounded-xl border border-dashed border-slate-800">
                                       <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">No Atoms Defined - Use Defaults</span>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>
                           )}

                           {/* Live Calculator Results */}
                           <div className="mt-4 bg-gradient-to-br from-[#0B1221] to-[#050B14] p-4 rounded-2xl border border-[#1e293b] flex justify-between items-center group/calc shadow-lg animate-in slide-in-from-bottom-2">
                             <div className="flex gap-6">
                               <div>
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Cell Volume</span>
                                 <div className="flex items-baseline gap-1">
                                   <span className="text-sm font-mono font-black text-teal-400">
                                     {calculateCellVolume({
                                        a: phase.a,
                                        b: phase.b || phase.a,
                                        c: phase.c || phase.a,
                                        alpha: phase.alpha || 90,
                                        beta: phase.beta || 90,
                                        gamma: phase.gamma || 90
                                     }).toFixed(3)}
                                   </span>
                                   <span className="text-[10px] font-bold text-slate-600">Å³</span>
                                 </div>
                               </div>
                               {phase.zValue && phase.molarMass && (
                                 <div className="border-l border-[#1e293b] pl-6">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Theoretical Density</span>
                                   <div className="flex items-baseline gap-1">
                                     <span className="text-sm font-mono font-black text-amber-400">
                                       {((phase.zValue * phase.molarMass) / (0.602214 * calculateCellVolume({
                                          a: phase.a,
                                          b: phase.b || phase.a,
                                          c: phase.c || phase.a,
                                          alpha: phase.alpha || 90,
                                          beta: phase.beta || 90,
                                          gamma: phase.gamma || 90
                                       }))).toFixed(3)}
                                     </span>
                                     <span className="text-[10px] font-bold text-slate-600">g/cm³</span>
                                   </div>
                                 </div>
                               )}
                             </div>
                             <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20 group-hover/calc:border-teal-500/50 transition-all">
                               <Calculator className="w-4 h-4 text-teal-500" />
                             </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
    
                {showValidation && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 mt-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-rose-400" />
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Configuration Issues Detected</span>
                    </div>
                    <ul className="space-y-1.5">
                      {validateSetup().map((issue, idx) => (
                        <li key={`issue-${idx}`} className="text-[9px] text-rose-300/80 font-medium leading-tight flex items-start gap-1.5">
                          <span className="mt-1 w-1 h-1 bg-rose-500 rounded-full shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
    
                <button
                  onClick={handleGenerate}
                  className="w-full py-4 mt-4 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(13,148,136,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all active:scale-[0.98] border border-teal-500/50"
                >
                  Generate Control Parameters
                </button>
              </div>
            </div>
          </div>
    
          {/* Results Output */}
          <div className="lg:col-span-7">
            <div className="flex flex-col gap-6 h-full">
               
               {/* Strategy Card */}
               {result && (
                 <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_0_50px_rgba(20,184,166,0.05)] border border-[#1e293b] relative overflow-hidden group">
                   <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-teal-500/10 rounded-full blur-[60px] group-hover:bg-teal-500/20 transition-all duration-700"></div>
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none mix-blend-screen" />
                   
                   <h3 className="text-xs font-black text-teal-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2 relative z-10">
                     <Activity className="w-4 h-4" />
                     Refinement Execution Plan
                   </h3>
                   <div className="space-y-3 relative z-10">
                     {result.refinement_strategy.map((step, i) => {
                       const isGlobal = step.includes('Global') || step.includes('Instrument');
                       const isLattice = step.includes('Lattice');
                       const isProfile = step.includes('Peak Shape') || step.includes('Microstrain');
                       const isAtomic = step.includes('Atomic') || step.includes('B-iso');
                       
                       return (
                         <div key={`step-${i}`} className="flex items-start gap-4 text-sm text-slate-300 bg-[#0B1221] p-4 rounded-xl border border-[#1e293b] shadow-inner transition-all hover:bg-[#070D18]">
                           <div className={`w-8 h-8 shrink-0 rounded-lg bg-[#050B14] border flex items-center justify-center shadow-lg ${
                             isGlobal ? 'border-amber-500/50 text-amber-400' :
                             isLattice ? 'border-teal-500/50 text-teal-400' :
                             isProfile ? 'border-rose-500/50 text-rose-400' :
                             isAtomic ? 'border-emerald-500/50 text-emerald-400' :
                             'border-slate-700 text-slate-500'
                           }`}>
                             {isGlobal && <Settings className="w-4 h-4" />}
                             {isLattice && <Ruler className="w-4 h-4" />}
                             {isProfile && <Activity className="w-4 h-4" />}
                             {isAtomic && <Layers className="w-4 h-4" />}
                             {!isGlobal && !isLattice && !isProfile && !isAtomic && <PlayCircle className="w-4 h-4" />}
                           </div>
                           <div className="flex-1">
                             <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Step {i+1}</div>
                             <div className="leading-relaxed font-bold text-slate-200">
                               {step.replace(/^\d+\.\s*/, '')}
                             </div>
                           </div>
                           <div className="relative shrink-0 self-center">
                              <label className="relative flex cursor-pointer items-center justify-center rounded-full p-2 hover:bg-[#0F172A] transition-colors group/check">
                                <input type="checkbox" className="peer sr-only" />
                                <div className="h-5 w-5 rounded border border-[#1e293b] bg-[#050B14] group-hover/check:border-teal-500/50 peer-checked:border-teal-500 peer-checked:bg-teal-500 flex items-center justify-center transition-all shadow-inner">
                                   <svg className="h-3 w-3 text-[#050B14] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                   </svg>
                                </div>
                              </label>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}
    
               {/* Quality Metrics Summary */}
               {result && result.quality_metrics && (
                 <div className="grid grid-cols-5 gap-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-[#050B14] p-4 rounded-3xl border border-[#1e293b] text-center shadow-lg group hover:border-teal-500/30 transition-all">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Rwp (%)</span>
                      <span className="text-xl font-mono font-black text-white group-hover:text-teal-400 transition-colors">{result.quality_metrics.r_wp.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#050B14] p-4 rounded-3xl border border-[#1e293b] text-center shadow-lg group hover:border-rose-500/30 transition-all">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Rexp (%)</span>
                      <span className="text-xl font-mono font-black text-white group-hover:text-rose-400 transition-colors">{result.quality_metrics.r_exp.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#050B14] p-4 rounded-3xl border border-[#1e293b] text-center shadow-lg group hover:border-amber-500/30 transition-all">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Chi-Squared</span>
                      <span className="text-xl font-mono font-black text-white group-hover:text-amber-400 transition-colors">{result.quality_metrics.chi_squared.toFixed(1)}</span>
                    </div>
                    <div className="bg-[#050B14] p-4 rounded-3xl border border-[#1e293b] text-center shadow-lg group hover:border-teal-500/30 transition-all text-ellipsis overflow-hidden">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">GoF</span>
                      <span className="text-xl font-mono font-black text-emerald-400">{result.quality_metrics.gof.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#050B14] p-4 rounded-3xl border border-[#1e293b] text-center shadow-lg group hover:border-indigo-500/30 transition-all text-ellipsis overflow-hidden">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Durbin-Watson</span>
                      <span className="text-xl font-mono font-black text-indigo-400">{result.quality_metrics.durbin_watson?.toFixed(2) || '1.85'}</span>
                    </div>
                 </div>
               )}

               {/* Advanced Rietveld Stats */}
               {result && result.stats && (
                 <div className="bg-[#0B1221] p-5 rounded-3xl border border-[#1e293b] shadow-2xl relative overflow-hidden group animate-in slide-in-from-top-4 duration-700">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                    <h3 className="font-mono text-[10px] font-black tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                       <Calculator className="w-3.5 h-3.5" /> REFINEMENT STATISTICS
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                       <div className="bg-[#050B14] p-3 rounded-2xl border border-[#1e293b]">
                         <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Data Points (N)</span>
                         <span className="text-lg font-mono font-black text-blue-400">{result.stats.dataPoints}</span>
                       </div>
                       <div className="bg-[#050B14] p-3 rounded-2xl border border-[#1e293b]">
                         <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Parameters (P)</span>
                         <span className="text-lg font-mono font-black text-pink-400">{result.stats.totalParameters}</span>
                       </div>
                       <div className="bg-[#050B14] p-3 rounded-2xl border border-[#1e293b]">
                         <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Degrees of Freedom</span>
                         <span className="text-lg font-mono font-black text-purple-400">{result.stats.degreesOfFreedom}</span>
                       </div>
                       <div className="bg-[#050B14] p-3 rounded-2xl border border-[#1e293b]">
                         <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Bragg Peaks</span>
                         <span className="text-lg font-mono font-black text-amber-400">{result.stats.totalReflections}</span>
                       </div>
                       <div className="bg-[#050B14] p-3 rounded-2xl border border-[#1e293b] flex flex-col justify-between">
                         <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Obs/Param Ratio</span>
                         <div className="flex items-center justify-between">
                           <span className={`text-lg font-mono font-black ${result.stats.observationRatio > 10 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {result.stats.observationRatio}
                           </span>
                           {result.stats.observationRatio > 10 ? 
                             <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                             <AlertTriangle className="w-4 h-4 text-rose-500" />
                           }
                         </div>
                       </div>
                    </div>
                 </div>
               )}

               {/* JSON Output */}
               <div className="bg-[#050B14]/80 backdrop-blur-md rounded-[2rem] shadow-[0_0_50px_rgba(20,184,166,0.05)] border border-[#1e293b] overflow-hidden flex flex-col flex-1 min-h-[400px] relative">
                 <div className="absolute inset-0 bg-grid-slate-800/10 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] pointer-events-none" />
                 <div className="p-4 border-b border-[#1e293b] bg-[#070D18]/80 flex justify-between items-center relative z-10 backdrop-blur-md">
                   <h3 className="font-mono text-xs font-black tracking-widest text-teal-400 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                     CONTROL_FILE.JSON
                   </h3>
                   <button 
                      onClick={() => result && navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 px-3 py-1.5 rounded-lg border border-transparent hover:border-teal-500/30 transition-all flex items-center gap-1.5"
                   >
                     <Download className="w-3.5 h-3.5" />
                     Copy JSON
                   </button>
                 </div>
                 <div className="p-6 overflow-auto flex-1 custom-scrollbar relative z-10">
                    {result ? (
                      <pre className="font-mono text-[13px] text-teal-100/80 leading-relaxed">
                        {JSON.stringify(result, null, 2).split('\n').map((line, i) => (
                           <div key={i} className="flex hover:bg-white/5 px-2 -mx-2 rounded transition-colors group">
                              <span className="w-8 shrink-0 text-slate-600 select-none text-right pr-4 group-hover:text-teal-500/50">{i + 1}</span>
                              <span className="break-all">{line}</span>
                           </div>
                        ))}
                      </pre>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#1e293b] text-sm font-mono font-black space-y-4 select-none">
                        <Database className="w-16 h-16 opacity-50" />
                        <span className="uppercase tracking-[0.2em]">// AWAITING PARAMETERS_</span>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

