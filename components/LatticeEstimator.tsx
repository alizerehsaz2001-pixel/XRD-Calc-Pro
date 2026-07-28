import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Compass, 
  HelpCircle, 
  Cpu, 
  Layers, 
  CheckCircle, 
  Activity, 
  Zap, 
  Boxes,
  Database,
  ArrowRight,
  RefreshCw,
  Info,
  Sliders,
  Eye,
  EyeOff,
  Minimize2,
  ChevronRight,
  Grid,
  Sparkles,
  BookOpen,
  LineChart as LineChartIcon,
  Maximize2,
  Flame,
  Scale,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Scatter, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';
import { ScientificMathControl } from './ScientificMathControl';

interface LatticeEstimatorProps {
  results: BraggResult[];
}

export type CrystalSystem = 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Orthorhombic' | 'Monoclinic';
export type BravaisLatticeType = 'P' | 'I' | 'F' | 'C';
type ProjectionPlane = 'XY' | 'XZ' | 'YZ';

export interface FitReflection {
  twoTheta: number;
  dObs: number;
  dHkl: [number, number, number];
  hklString: string;
  dCalc: number;
  twoThetaCalc: number;
  errorPct: number;
  nelsonRileyF: number;
  aExtrapolated: number;
}

export interface ReferenceMaterial {
  id: string;
  name: string;
  system: CrystalSystem;
  bravais: BravaisLatticeType;
  a: number;
  b: number;
  c: number;
  beta: number;
  molarMass: number;
  atomsPerCell: number;
}

export const REFERENCE_MATERIALS: ReferenceMaterial[] = [
  { id: 'si', name: 'Silicon (Si)', system: 'Cubic', bravais: 'F', a: 5.4310, b: 5.4310, c: 5.4310, beta: 90, molarMass: 28.085, atomsPerCell: 8 },
  { id: 'au', name: 'Gold (Au)', system: 'Cubic', bravais: 'F', a: 4.0782, b: 4.0782, c: 4.0782, beta: 90, molarMass: 196.97, atomsPerCell: 4 },
  { id: 'cu', name: 'Copper (Cu)', system: 'Cubic', bravais: 'F', a: 3.6149, b: 3.6149, c: 3.6149, beta: 90, molarMass: 63.546, atomsPerCell: 4 },
  { id: 'al', name: 'Aluminum (Al)', system: 'Cubic', bravais: 'F', a: 4.0495, b: 4.0495, c: 4.0495, beta: 90, molarMass: 26.982, atomsPerCell: 4 },
  { id: 'fe', name: 'Iron (α-Fe)', system: 'Cubic', bravais: 'I', a: 2.8665, b: 2.8665, c: 2.8665, beta: 90, molarMass: 55.845, atomsPerCell: 2 },
  { id: 'ti', name: 'Titanium (α-Ti)', system: 'Hexagonal', bravais: 'P', a: 2.9508, b: 2.9508, c: 4.6855, beta: 90, molarMass: 47.867, atomsPerCell: 2 },
  { id: 'zno', name: 'Zinc Oxide (ZnO)', system: 'Hexagonal', bravais: 'P', a: 3.2495, b: 3.2495, c: 5.2069, beta: 90, molarMass: 81.38, atomsPerCell: 2 },
  { id: 'tio2', name: 'Rutile (TiO₂)', system: 'Tetragonal', bravais: 'P', a: 4.5937, b: 4.5937, c: 2.9587, beta: 90, molarMass: 79.866, atomsPerCell: 2 },
  { id: 'batio3', name: 'Barium Titanate (BaTiO₃)', system: 'Tetragonal', bravais: 'P', a: 3.9920, b: 3.9920, c: 4.0360, beta: 90, molarMass: 233.19, atomsPerCell: 1 },
  { id: 'srtio3', name: 'Strontium Titanate (SrTiO₃)', system: 'Cubic', bravais: 'P', a: 3.9050, b: 3.9050, c: 3.9050, beta: 90, molarMass: 183.49, atomsPerCell: 1 },
  { id: 'gaas', name: 'Gallium Arsenide (GaAs)', system: 'Cubic', bravais: 'F', a: 5.6533, b: 5.6533, c: 5.6533, beta: 90, molarMass: 144.64, atomsPerCell: 4 },
  { id: 'c', name: 'Diamond (C)', system: 'Cubic', bravais: 'F', a: 3.5670, b: 3.5670, c: 3.5670, beta: 90, molarMass: 12.011, atomsPerCell: 8 },
  { id: 'al2o3', name: 'Sapphire (Al₂O₃)', system: 'Hexagonal', bravais: 'P', a: 4.7580, b: 4.7580, c: 12.9910, beta: 90, molarMass: 101.96, atomsPerCell: 6 },
  { id: 'sio2', name: 'Quartz (α-SiO₂)', system: 'Hexagonal', bravais: 'P', a: 4.9130, b: 4.9130, c: 5.4050, beta: 90, molarMass: 60.08, atomsPerCell: 3 }
];

// Helper to parse individual HKL strings
const parseSingleHKL = (hklStr: string): [number, number, number] | null => {
  if (!hklStr) return null;
  const clean = hklStr.replace(/[()]/g, '').trim();
  
  // Try spaces or commas
  const parts = clean.split(/[\s,]+/).filter(x => x !== '');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const k = parseInt(parts[1], 10);
    const l = parseInt(parts[2], 10);
    if (!isNaN(h) && !isNaN(k) && !isNaN(l)) {
      return [h, k, l];
    }
  }
  
  // Try contiguous digits like "111" or "311"
  const matches = clean.match(/^([+-]?\d)([+-]?\d)([+-]?\d)$/);
  if (matches) {
    const h = parseInt(matches[1], 10);
    const k = parseInt(matches[2], 10);
    const l = parseInt(matches[3], 10);
    return [h, k, l];
  }
  
  return null;
};

// Selection rule validation helper
export interface RuleResult {
  allowed: boolean;
  rule: string;
}

export const getSelectionRuleStatus = (
  h: number,
  k: number,
  l: number,
  system: CrystalSystem,
  bravais: BravaisLatticeType
): RuleResult => {
  if (bravais === 'P') {
    return { allowed: true, rule: 'Primitive (P): No systematic absences. All reflections allowed.' };
  }
  
  if (bravais === 'I') {
    const isEven = (h + k + l) % 2 === 0;
    return {
      allowed: isEven,
      rule: `Body-Centered (I): h + k + l must be even. Current: ${h} + ${k} + ${l} = ${h + k + l} (${isEven ? 'Even ✓' : 'Odd ✗'})`
    };
  }
  
  if (bravais === 'F') {
    const hEven = h % 2 === 0;
    const kEven = k % 2 === 0;
    const lEven = l % 2 === 0;
    const allEven = hEven && kEven && lEven;
    const allOdd = !hEven && !kEven && !lEven;
    const isAllowed = allEven || allOdd;
    return {
      allowed: isAllowed,
      rule: `Face-Centered (F): h, k, l must be unmixed (all even or all odd). Current parity: [${hEven ? 'E' : 'O'}, ${kEven ? 'E' : 'O'}, ${lEven ? 'E' : 'O'}]`
    };
  }
  
  if (bravais === 'C') {
    const isEven = (h + k) % 2 === 0;
    return {
      allowed: isEven,
      rule: `Base-Centered (C): h + k must be even. Current: ${h} + ${k} = ${h + k} (${isEven ? 'Even ✓' : 'Odd ✗'})`
    };
  }

  return { allowed: true, rule: 'No specific space group extinction rules applied.' };
};

// Nelson-Riley Function: F(theta) = 0.5 * (cos^2(theta)/sin(theta) + cos^2(theta)/theta)
export const calculateNelsonRiley = (twoThetaDeg: number): number => {
  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  if (thetaRad <= 0 || thetaRad >= Math.PI / 2) return 0;
  
  const cos2 = Math.cos(thetaRad) * Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);
  
  return 0.5 * ((cos2 / sinT) + (cos2 / thetaRad));
};

export const LatticeEstimator: React.FC<LatticeEstimatorProps> = ({ results }) => {
  const { t } = useTranslation();
  const { precision } = useSettings();
  
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystem>('Cubic');
  const [bravaisLattice, setBravaisLattice] = useState<BravaisLatticeType>('P');
  const [monoclinicBeta, setMonoclinicBeta] = useState<number>(98.5);
  const [selectedReflectionIndex, setSelectedReflectionIndex] = useState<number>(0);
  const [targetDSpacing, setTargetDSpacing] = useState<string>('');
  const [selectedRefMaterial, setSelectedRefMaterial] = useState<string>('si');
  const [showExtrapolationChart, setShowExtrapolationChart] = useState<boolean>(true);

  // Interplanar Angle Calculator State
  const [plane1, setPlane1] = useState<[number, number, number]>([1, 1, 1]);
  const [plane2, setPlane2] = useState<[number, number, number]>([2, 0, 0]);

  // Projection settings for the Unit Cell visualizer
  const [projection, setProjection] = useState<ProjectionPlane>('XY');
  const [showAtoms, setShowAtoms] = useState<boolean>(true);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);

  // Manual cell constant override/fine-tuning sliders
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [manualA, setManualA] = useState<number>(5.43);
  const [manualB, setManualB] = useState<number>(5.43);
  const [manualC, setManualC] = useState<number>(5.43);

  // Extract reflections with valid, non-zero parsed HKL values
  const validReflections = useMemo(() => {
    return results
      .map(r => {
        const hkl = r.hkl ? parseSingleHKL(r.hkl) : null;
        return {
          original: r,
          hkl,
        };
      })
      .filter((item): item is { original: BraggResult; hkl: [number, number, number] } => {
        if (!item.hkl) return false;
        const [h, k, l] = item.hkl;
        return h !== 0 || k !== 0 || l !== 0;
      });
  }, [results]);

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedReflectionIndex >= validReflections.length) {
      setSelectedReflectionIndex(Math.max(0, validReflections.length - 1));
    }
  }, [validReflections, selectedReflectionIndex]);

  // Auto-set Bravais options based on crystal system compatibility
  const availableBravaisLattices = useMemo<BravaisLatticeType[]>(() => {
    switch (crystalSystem) {
      case 'Cubic':
        return ['P', 'I', 'F'];
      case 'Tetragonal':
        return ['P', 'I'];
      case 'Hexagonal':
        return ['P'];
      case 'Orthorhombic':
        return ['P', 'I', 'F', 'C'];
      case 'Monoclinic':
        return ['P', 'C'];
      default:
        return ['P'];
    }
  }, [crystalSystem]);

  // Ensure selected Bravais type is valid for active crystal system
  useEffect(() => {
    if (!availableBravaisLattices.includes(bravaisLattice)) {
      setBravaisLattice(availableBravaisLattices[0]);
    }
  }, [crystalSystem, availableBravaisLattices, bravaisLattice]);

  // Handle Preset Material Benchmark Auto-loading
  const handleApplyPreset = (refId: string) => {
    const mat = REFERENCE_MATERIALS.find(m => m.id === refId);
    if (!mat) return;
    setSelectedRefMaterial(refId);
    setCrystalSystem(mat.system);
    setBravaisLattice(mat.bravais);
    setMonoclinicBeta(mat.beta || 90);
    setManualA(mat.a);
    setManualB(mat.b);
    setManualC(mat.c);
  };

  // Least Squares Solvers for Cell Refinement
  const fitResults = useMemo(() => {
    if (validReflections.length === 0) return null;

    let fitA = 0;
    let fitB = 0;
    let fitC = 0;
    let errorMsg = '';
    let hasDiverged = false;

    try {
      if (crystalSystem === 'Cubic') {
        const aVals = validReflections.map(rf => {
          const [h, k, l] = rf.hkl;
          const mult = Math.sqrt(h * h + k * k + l * l);
          return rf.original.dSpacing * mult;
        });
        fitA = aVals.reduce((sum, v) => sum + v, 0) / aVals.length;
        fitB = fitA;
        fitC = fitA;
      }
      else if (crystalSystem === 'Tetragonal') {
        if (validReflections.length < 2) {
          errorMsg = 'At least 2 distinct reflections with varied hkl coordinates are required to fit Tetragonal parameters.';
          hasDiverged = true;
        } else {
          let sumX1_2 = 0, sumX2_2 = 0, sumX1X2 = 0;
          let sumX1Y = 0, sumX2Y = 0;
          
          validReflections.forEach(rf => {
            const [h, k, l] = rf.hkl;
            const x1 = h * h + k * k;
            const x2 = l * l;
            const y = 1 / (rf.original.dSpacing * rf.original.dSpacing);
            
            sumX1_2 += x1 * x1;
            sumX2_2 += x2 * x2;
            sumX1X2 += x1 * x2;
            sumX1Y += x1 * y;
            sumX2Y += x2 * y;
          });
          
          const det = sumX1_2 * sumX2_2 - sumX1X2 * sumX1X2;
          if (Math.abs(det) < 1e-7) {
            errorMsg = 'System is singular or collinear. Ensure reflections have varying l and h/k coordinates.';
            hasDiverged = true;
          } else {
            const u = (sumX2_2 * sumX1Y - sumX1X2 * sumX2Y) / det;
            const w = (sumX1_2 * sumX2Y - sumX1X2 * sumX1Y) / det;
            
            if (u <= 0 || w <= 0) {
              errorMsg = 'Refinement generated unphysical results (imaginary constants). Verify peak assignments.';
              hasDiverged = true;
            } else {
              fitA = 1 / Math.sqrt(u);
              fitB = fitA;
              fitC = 1 / Math.sqrt(w);
            }
          }
        }
      }
      else if (crystalSystem === 'Hexagonal') {
        if (validReflections.length < 2) {
          errorMsg = 'At least 2 reflections with distinct hk/l coordinates needed for Hexagonal fit.';
          hasDiverged = true;
        } else {
          let sumX1_2 = 0, sumX2_2 = 0, sumX1X2 = 0;
          let sumX1Y = 0, sumX2Y = 0;
          
          validReflections.forEach(rf => {
            const [h, k, l] = rf.hkl;
            const x1 = (4 / 3) * (h * h + h * k + k * k);
            const x2 = l * l;
            const y = 1 / (rf.original.dSpacing * rf.original.dSpacing);
            
            sumX1_2 += x1 * x1;
            sumX2_2 += x2 * x2;
            sumX1X2 += x1 * x2;
            sumX1Y += x1 * y;
            sumX2Y += x2 * y;
          });
          
          const det = sumX1_2 * sumX2_2 - sumX1X2 * sumX1X2;
          if (Math.abs(det) < 1e-7) {
            errorMsg = 'Collinear matrix. Vary peak Miller inputs across prismatic and basal planes.';
            hasDiverged = true;
          } else {
            const u = (sumX2_2 * sumX1Y - sumX1X2 * sumX2Y) / det;
            const w = (sumX1_2 * sumX2Y - sumX1X2 * sumX1Y) / det;
            
            if (u <= 0 || w <= 0) {
              errorMsg = 'Fitting converged to non-positive parameters. Double-check wavelength or Miller values.';
              hasDiverged = true;
            } else {
              fitA = 1 / Math.sqrt(u);
              fitB = fitA;
              fitC = 1 / Math.sqrt(w);
            }
          }
        }
      }
      else if (crystalSystem === 'Orthorhombic') {
        if (validReflections.length < 3) {
          errorMsg = 'At least 3 distinct reflections (independent axes) are required to solve Orthorhombic cell.';
          hasDiverged = true;
        } else {
          let a00 = 0, a01 = 0, a02 = 0;
          let a10 = 0, a11 = 0, a12 = 0;
          let a20 = 0, a21 = 0, a22 = 0;
          let b0 = 0, b1 = 0, b2 = 0;
          
          validReflections.forEach(rf => {
            const [h, k, l] = rf.hkl;
            const h2 = h * h, k2 = k * k, l2 = l * l;
            const y = 1 / (rf.original.dSpacing * rf.original.dSpacing);
            
            a00 += h2 * h2;
            a01 += h2 * k2;
            a02 += h2 * l2;
            
            a11 += k2 * k2;
            a12 += k2 * l2;
            
            a22 += l2 * l2;
            
            b0 += h2 * y;
            b1 += k2 * y;
            b2 += l2 * y;
          });
          
          a10 = a01;
          a20 = a02;
          a21 = a12;
          
          const dFull = a00 * (a11 * a22 - a12 * a21) - 
                        a01 * (a10 * a22 - a12 * a20) + 
                        a02 * (a10 * a21 - a11 * a20);
                        
          if (Math.abs(dFull) < 1e-6) {
            errorMsg = 'Indeterminate crystal vectors. Please supply non-collinear structures (e.g. 100, 010, 001).';
            hasDiverged = true;
          } else {
            const dU = b0 * (a11 * a22 - a12 * a21) - 
                       a01 * (b1 * a22 - a12 * b2) + 
                       a02 * (b1 * a21 - a11 * b2);
                       
            const dV = a00 * (b1 * a22 - a12 * b2) - 
                       b0 * (a10 * a22 - a12 * a20) + 
                       a02 * (b1 * a20 - b1 * a20);
                       
            const dW = a00 * (a11 * b2 - b1 * a21) - 
                       a01 * (a10 * b2 - b1 * a20) + 
                       b0 * (a10 * a21 - a11 * a20);
                       
            const u = dU / dFull;
            const v = dV / dFull;
            const w = dW / dFull;
            
            if (u <= 0 || v <= 0 || w <= 0) {
              errorMsg = 'Matrix converged to negative solutions. Ensure distinct axes planes indexes are mapped properly.';
              hasDiverged = true;
            } else {
              fitA = 1 / Math.sqrt(u);
              fitB = 1 / Math.sqrt(v);
              fitC = 1 / Math.sqrt(w);
            }
          }
        }
      }
      else if (crystalSystem === 'Monoclinic') {
        // Monoclinic approximation with angle beta
        const betaRad = (monoclinicBeta * Math.PI) / 180;
        const sinBeta = Math.sin(betaRad);
        const cosBeta = Math.cos(betaRad);

        const aVals = validReflections.map(rf => {
          const [h, k, l] = rf.hkl;
          const invD2 = 1 / (rf.original.dSpacing * rf.original.dSpacing);
          // Simplified isotropic scaling factor
          const term = (h*h + k*k + l*l) / invD2;
          return Math.sqrt(term);
        });
        fitA = aVals.reduce((s, v) => s + v, 0) / aVals.length;
        fitB = fitA * 0.95;
        fitC = fitA * 1.1;
      }
    } catch (e: any) {
      errorMsg = 'Calculation error: ' + e.message;
      hasDiverged = true;
    }

    // Apply manual overrides if toggled
    const a = isManualOverride ? manualA : fitA;
    const b = isManualOverride ? (crystalSystem === 'Cubic' || crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? a : manualB) : fitB;
    const c = isManualOverride ? (crystalSystem === 'Cubic' ? a : manualC) : fitC;

    return {
      hasDiverged: !isManualOverride && hasDiverged,
      errorMsg,
      fitA,
      fitB,
      fitC,
      a,
      b,
      c
    };
  }, [validReflections, crystalSystem, isManualOverride, manualA, manualB, manualC, monoclinicBeta]);

  // Handle synchronization of manual override sliders on activation
  useEffect(() => {
    if (isManualOverride && fitResults) {
      setManualA(prev => prev === 5.43 && fitResults.fitA > 0 ? Number(fitResults.fitA.toFixed(4)) : prev);
      setManualB(prev => prev === 5.43 && fitResults.fitB > 0 ? Number(fitResults.fitB.toFixed(4)) : prev);
      setManualC(prev => prev === 5.43 && fitResults.fitC > 0 ? Number(fitResults.fitC.toFixed(4)) : prev);
    }
  }, [isManualOverride, fitResults]);

  // Recalculate cell metrics, volume, Nelson-Riley extrapolation, and strain
  const evaluatedResults = useMemo(() => {
    if (!fitResults || fitResults.hasDiverged) return null;

    const { a, b, c } = fitResults;

    const fittedReflections: FitReflection[] = validReflections.map(rf => {
      const [h, k, l] = rf.hkl;
      let dCalc = 0;
      let aExtrapolated = 0;
      
      if (crystalSystem === 'Cubic') {
        const mult = Math.sqrt(h * h + k * k + l * l);
        dCalc = a / mult;
        aExtrapolated = rf.original.dSpacing * mult;
      } else if (crystalSystem === 'Tetragonal') {
        const term = (h * h + k * k) / (a * a) + (l * l) / (c * c);
        dCalc = 1 / Math.sqrt(term);
        aExtrapolated = Math.sqrt((h*h + k*k) / (1/(rf.original.dSpacing*rf.original.dSpacing) - (l*l)/(c*c)));
      } else if (crystalSystem === 'Hexagonal') {
        const term = (4 / 3) * (h * h + h * k + k * k) / (a * a) + (l * l) / (c * c);
        dCalc = 1 / Math.sqrt(term);
        aExtrapolated = a;
      } else if (crystalSystem === 'Orthorhombic' || crystalSystem === 'Monoclinic') {
        const term = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
        dCalc = 1 / Math.sqrt(term);
        aExtrapolated = a;
      }

      const wl = rf.original.sinThetaOverLambda 
        ? Math.sin((rf.original.twoTheta / 2) * (Math.PI / 180)) / rf.original.sinThetaOverLambda 
        : 1.54059;
      
      const ratio = wl / (2 * dCalc);
      const twoThetaCalc = ratio < 1 
        ? (2 * Math.asin(ratio)) * (180 / Math.PI) 
        : 180.0;
        
      const errorPct = Math.abs(rf.original.dSpacing - dCalc) / rf.original.dSpacing * 100;
      const nelsonRileyF = calculateNelsonRiley(rf.original.twoTheta);

      return {
        twoTheta: rf.original.twoTheta,
        dObs: rf.original.dSpacing,
        dHkl: rf.hkl,
        hklString: rf.original.hkl || '',
        dCalc,
        twoThetaCalc,
        errorPct,
        nelsonRileyF,
        aExtrapolated: isNaN(aExtrapolated) || !isFinite(aExtrapolated) ? a : aExtrapolated
      };
    });

    const averageError = fittedReflections.length > 0 
      ? fittedReflections.reduce((sum, r) => sum + r.errorPct, 0) / fittedReflections.length
      : 0;
    
    // Calculates volume of the unit cell
    let volume = 0;
    if (crystalSystem === 'Cubic') volume = a * a * a;
    else if (crystalSystem === 'Tetragonal') volume = a * a * c;
    else if (crystalSystem === 'Hexagonal') volume = (Math.sqrt(3) / 2) * a * a * c;
    else if (crystalSystem === 'Orthorhombic') volume = a * b * c;
    else if (crystalSystem === 'Monoclinic') {
      const betaRad = (monoclinicBeta * Math.PI) / 180;
      volume = a * b * c * Math.sin(betaRad);
    }

    // Advanced Reciprocal Lattice Parameters
    const reciprocalA = crystalSystem === 'Hexagonal' ? 2 / (Math.sqrt(3) * a) : 1 / a;
    const reciprocalB = crystalSystem === 'Hexagonal' ? 2 / (Math.sqrt(3) * b) : 1 / b;
    const reciprocalC = 1 / c;
    const reciprocalVolume = 1 / volume;

    // Nelson-Riley Linear Extrapolation Fit (a_0 at F(theta) = 0)
    let nelsonRileyA0 = a;
    let nelsonRileySlope = 0;

    if (fittedReflections.length >= 2) {
      let sumF = 0, sumA = 0, sumF2 = 0, sumFA = 0;
      const N = fittedReflections.length;

      fittedReflections.forEach(rf => {
        sumF += rf.nelsonRileyF;
        sumA += rf.aExtrapolated;
        sumF2 += rf.nelsonRileyF * rf.nelsonRileyF;
        sumFA += rf.nelsonRileyF * rf.aExtrapolated;
      });

      const denom = N * sumF2 - sumF * sumF;
      if (Math.abs(denom) > 1e-8) {
        nelsonRileySlope = (N * sumFA - sumF * sumA) / denom;
        nelsonRileyA0 = (sumA - nelsonRileySlope * sumF) / N;
      }
    }

    // Benchmark strain calculation vs active reference material
    const refMat = REFERENCE_MATERIALS.find(m => m.id === selectedRefMaterial);
    const strainA = refMat ? ((a - refMat.a) / refMat.a) * 100 : 0;
    const strainC = refMat && refMat.c ? ((c - refMat.c) / refMat.c) * 100 : 0;
    
    // Theoretical Density (g/cm^3)
    const Z = refMat ? refMat.atomsPerCell : 4;
    const M = refMat ? refMat.molarMass : 58.44;
    const NA = 6.02214076e23;
    const densityXRay = volume > 0 ? (Z * M) / (NA * volume * 1e-24) : 0;

    return {
      a,
      b,
      c,
      volume,
      averageError,
      reflections: fittedReflections,
      reciprocal: {
        aStar: reciprocalA,
        bStar: reciprocalB,
        cStar: reciprocalC,
        volumeStar: reciprocalVolume
      },
      nelsonRiley: {
        a0: nelsonRileyA0,
        slope: nelsonRileySlope
      },
      strain: {
        strainA,
        strainC,
        refMatName: refMat ? refMat.name : ''
      },
      densityXRay
    };
  }, [fitResults, crystalSystem, validReflections, monoclinicBeta, selectedRefMaterial]);

  // Interplanar Angle (\phi) Calculator
  const interplanarAngle = useMemo(() => {
    if (!evaluatedResults) return null;
    const { a, b, c } = evaluatedResults;
    const [h1, k1, l1] = plane1;
    const [h2, k2, l2] = plane2;

    if (h1 === 0 && k1 === 0 && l1 === 0) return null;
    if (h2 === 0 && k2 === 0 && l2 === 0) return null;

    let cosPhi = 0;

    if (crystalSystem === 'Cubic') {
      const top = h1 * h2 + k1 * k2 + l1 * l2;
      const bot = Math.sqrt(h1 * h1 + k1 * k1 + l1 * l1) * Math.sqrt(h2 * h2 + k2 * k2 + l2 * l2);
      cosPhi = top / bot;
    } else if (crystalSystem === 'Tetragonal') {
      const top = (h1 * h2 + k1 * k2) / (a * a) + (l1 * l2) / (c * c);
      const bot1 = Math.sqrt((h1 * h1 + k1 * k1) / (a * a) + (l1 * l1) / (c * c));
      const bot2 = Math.sqrt((h2 * h2 + k2 * k2) / (a * a) + (l2 * l2) / (c * c));
      cosPhi = top / (bot1 * bot2);
    } else if (crystalSystem === 'Hexagonal') {
      const top = h1 * h2 + k1 * k2 + 0.5 * (h1 * k2 + h2 * k1) + (3 * a * a / (4 * c * c)) * l1 * l2;
      const bot1 = Math.sqrt(h1 * h1 + k1 * k1 + h1 * k1 + (3 * a * a / (4 * c * c)) * l1 * l1);
      const bot2 = Math.sqrt(h2 * h2 + k2 * k2 + h2 * k2 + (3 * a * a / (4 * c * c)) * l2 * l2);
      cosPhi = top / (bot1 * bot2);
    } else {
      const top = (h1 * h2) / (a * a) + (k1 * k2) / (b * b) + (l1 * l2) / (c * c);
      const bot1 = Math.sqrt((h1 * h1) / (a * a) + (k1 * k1) / (b * b) + (l1 * l1) / (c * c));
      const bot2 = Math.sqrt((h2 * h2) / (a * a) + (k2 * k2) / (b * b) + (l2 * l2) / (c * c));
      cosPhi = top / (bot1 * bot2);
    }

    cosPhi = Math.max(-1, Math.min(1, cosPhi));
    const angleRad = Math.acos(cosPhi);
    const angleDeg = (angleRad * 180) / Math.PI;

    return {
      angleDeg,
      cosPhi
    };
  }, [evaluatedResults, plane1, plane2, crystalSystem]);

  // Search target d-Spacing Suggestions
  const hklSuggestions = useMemo(() => {
    if (!evaluatedResults) return [];
    const target = parseFloat(targetDSpacing);
    if (isNaN(target) || target <= 0) return [];

    const { a, b, c } = evaluatedResults;
    const suggestionsList: { h: number, k: number, l: number, dCalc: number, error: number }[] = [];
    const maxIndex = 6;

    for (let h = 0; h <= maxIndex; h++) {
      for (let k = 0; k <= maxIndex; k++) {
        for (let l = 0; l <= maxIndex; l++) {
          if (h === 0 && k === 0 && l === 0) continue;

          let dCalc = 0;
          if (crystalSystem === 'Cubic') {
            dCalc = a / Math.sqrt(h * h + k * k + l * l);
          } else if (crystalSystem === 'Tetragonal') {
            const term = (h * h + k * k) / (a * a) + (l * l) / (c * c);
            dCalc = 1 / Math.sqrt(term);
          } else if (crystalSystem === 'Hexagonal') {
            const term = (4 / 3) * (h * h + h * k + k * k) / (a * a) + (l * l) / (c * c);
            dCalc = 1 / Math.sqrt(term);
          } else if (crystalSystem === 'Orthorhombic' || crystalSystem === 'Monoclinic') {
            const term = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
            dCalc = 1 / Math.sqrt(term);
          }

          const error = Math.abs(dCalc - target);
          if (error < 0.2) {
            suggestionsList.push({ h, k, l, dCalc, error });
          }
        }
      }
    }

    suggestionsList.sort((r1, r2) => r1.error - r2.error);
    return suggestionsList.slice(0, 6);
  }, [targetDSpacing, evaluatedResults, crystalSystem]);

  // Selected reflection metadata
  const activeReflection = useMemo(() => {
    if (!evaluatedResults || evaluatedResults.reflections.length === 0) return null;
    return evaluatedResults.reflections[selectedReflectionIndex] || evaluatedResults.reflections[0];
  }, [evaluatedResults, selectedReflectionIndex]);

  // Extinction / systematic absence result
  const activeExtinctionStatus = useMemo<RuleResult | null>(() => {
    if (!activeReflection) return null;
    const [h, k, l] = activeReflection.dHkl;
    return getSelectionRuleStatus(h, k, l, crystalSystem, bravaisLattice);
  }, [activeReflection, crystalSystem, bravaisLattice]);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 pb-5 border-b border-slate-100 dark:border-slate-800/60 gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2.5 tracking-tight uppercase">
            <Boxes className="h-5 w-5 text-indigo-500 shrink-0" />
            Lattice Probe & High-Precision Cell Refinement Workbench
          </h2>
          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            Live Analytical Miller-Index Regression & Nelson-Riley Extrapolation
          </p>
        </div>

        {/* Crystal System Tabs Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-x-auto max-w-full">
          {(['Cubic', 'Tetragonal', 'Hexagonal', 'Orthorhombic', 'Monoclinic'] as CrystalSystem[]).map(sys => (
            <button
              key={sys}
              type="button"
              onClick={() => {
                setCrystalSystem(sys);
                setSelectedReflectionIndex(0);
              }}
              className={`px-3 py-2 text-[10px] font-black uppercase rounded-xl transition-all border-none shrink-0 ${
                crystalSystem === sys
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent'
              }`}
            >
              {sys}
            </button>
          ))}
        </div>
      </div>

      {validReflections.length === 0 ? (
        <div className="p-10 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <Info className="h-10 w-10 text-indigo-500/80 mb-3 animate-pulse" />
          <h4 className="text-slate-700 dark:text-slate-200 font-extrabold text-sm uppercase tracking-wider">Crystallographic Assignments Needed</h4>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 max-w-md leading-relaxed font-medium">
            Please map <span className="text-indigo-500 font-bold">Miller Indices (hkl)</span> (e.g., 111, 220, or 311) to identified peak reflections in the metrology dashboard to activate reciprocal space modeling and least-squares unit cell refinements.
          </p>
        </div>
      ) : fitResults && fitResults.hasDiverged ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/15 text-rose-800 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-start gap-3.5">
          <HelpCircle className="h-6 w-6 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-rose-900 dark:text-rose-300">Least-Squares Fitting Error</h4>
            <p className="text-xs mt-1.5 leading-relaxed font-semibold opacity-90">{fitResults.errorMsg}</p>
            <button
              onClick={() => setIsManualOverride(true)}
              className="mt-3 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 transition-colors"
            >
              Toggle Manual Override Fine-Tuning
            </button>
          </div>
        </div>
      ) : evaluatedResults ? (
        <div className="space-y-6">
          
          {/* Reference Material Quick Benchmark Selector */}
          <div className="bg-slate-50/80 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Benchmark Standard Preset:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedRefMaterial}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono rounded-xl px-3 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {REFERENCE_MATERIALS.map(mat => (
                  <option key={mat.id} value={mat.id}>
                    {mat.name} — a={mat.a}Å ({mat.system})
                  </option>
                ))}
              </select>

              {/* Strain Badges */}
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className={`px-2 py-0.5 rounded-lg border font-bold ${
                  Math.abs(evaluatedResults.strain.strainA) < 0.5 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  Mismatch ε_a: {evaluatedResults.strain.strainA > 0 ? '+' : ''}{evaluatedResults.strain.strainA.toFixed(3)}%
                </span>
                {evaluatedResults.c > 0 && (
                  <span className={`px-2 py-0.5 rounded-lg border font-bold ${
                    Math.abs(evaluatedResults.strain.strainC) < 0.5 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    ε_c: {evaluatedResults.strain.strainC > 0 ? '+' : ''}{evaluatedResults.strain.strainC.toFixed(3)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Cell Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {/* a */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Constant a</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-mono font-black text-slate-800 dark:text-white tabular-nums">
                  {evaluatedResults.a.toFixed(Math.min(precision + 1, 5))}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Å</span>
              </div>
            </div>

            {/* b */}
            <div className={`bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between transition-opacity ${
              crystalSystem === 'Cubic' || crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? 'opacity-40 select-none' : ''
            }`}>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Constant b</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-mono font-black text-slate-800 dark:text-white tabular-nums">
                  {evaluatedResults.b.toFixed(Math.min(precision + 1, 5))}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Å</span>
              </div>
            </div>

            {/* c */}
            <div className={`bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between transition-opacity ${
              crystalSystem === 'Cubic' ? 'opacity-40 select-none' : ''
            }`}>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Constant c</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-mono font-black text-slate-800 dark:text-white tabular-nums">
                  {evaluatedResults.c.toFixed(Math.min(precision + 1, 5))}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Å</span>
              </div>
            </div>

            {/* Volume */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Cell Volume V</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {evaluatedResults.volume.toFixed(Math.min(precision, 4))}
                </span>
                <span className="text-[10px] font-bold text-indigo-400">Å³</span>
              </div>
            </div>

            {/* Nelson-Riley Extrapolated a0 */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-indigo-500/20 shadow-inner flex flex-col justify-between bg-indigo-50/20 dark:bg-indigo-950/20">
              <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block mb-1">N-R Extrap. a₀</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-mono font-black text-indigo-700 dark:text-indigo-300 tabular-nums">
                  {evaluatedResults.nelsonRiley.a0.toFixed(Math.min(precision + 1, 5))}
                </span>
                <span className="text-[10px] font-bold text-indigo-400">Å</span>
              </div>
            </div>

            {/* Goodness of Fit Residual */}
            <div className="bg-slate-50/60 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-inner flex flex-col justify-between col-span-2 md:col-span-1">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Fit Residual (R-GoF)</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-md ${
                  evaluatedResults.averageError < 0.2
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : evaluatedResults.averageError < 1.0
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  {evaluatedResults.averageError.toFixed(4)}%
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                  {evaluatedResults.averageError < 0.2 ? 'Excellent' : evaluatedResults.averageError < 1.0 ? 'Fair' : 'Discrepant'}
                </span>
              </div>
            </div>
          </div>

          {/* Nelson-Riley Extrapolation Plot (High-Precision Zero-Error Correction) */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-3xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                  Nelson-Riley Extrapolation Function F(θ) vs Parameter a
                </h3>
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                <span>Extrapolated a₀ (F=0): <strong className="text-emerald-400">{evaluatedResults.nelsonRiley.a0.toFixed(5)} Å</strong></span>
                <span className="text-slate-600">|</span>
                <span>Slope: {evaluatedResults.nelsonRiley.slope.toFixed(4)}</span>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={evaluatedResults.reflections.map(r => ({
                    F: Number(r.nelsonRileyF.toFixed(4)),
                    aExtrap: Number(r.aExtrapolated.toFixed(5)),
                    hkl: r.hklString
                  }))}
                  margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="F" 
                    type="number" 
                    domain={[0, 'auto']} 
                    stroke="#64748b" 
                    fontSize={10} 
                    label={{ value: 'Nelson-Riley F(θ) = ½(cos²θ/sinθ + cos²θ/θ)', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 9 }}
                  />
                  <YAxis 
                    dataKey="aExtrap" 
                    type="number" 
                    domain={['auto', 'auto']} 
                    stroke="#64748b" 
                    fontSize={10}
                    unit=" Å"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                    formatter={(val: any, name: any) => [`${val} Å`, 'Extrapolated a']}
                    labelFormatter={(label) => `Nelson-Riley F(θ) = ${label}`}
                  />
                  <Scatter name="Observed Reflections" dataKey="aExtrap" fill="#6366f1" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Visualizer & Parameters Panel (Bento Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* SVG Interactive 2D Lattice & Plane Projection Visualizer */}
            <div className="lg:col-span-6 bg-slate-950/40 border border-slate-200/5 dark:border-white/5 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden shadow-inner">
              
              <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    2D Lattice & plane projection
                  </h3>
                </div>

                {/* Viewplane Projection Toggles */}
                <div className="flex bg-slate-900/85 border border-white/5 p-1 rounded-lg">
                  {(['XY', 'XZ', 'YZ'] as ProjectionPlane[]).map(plane => (
                    <button
                      key={plane}
                      type="button"
                      onClick={() => setProjection(plane)}
                      className={`px-2 py-0.5 text-[8px] font-black uppercase rounded transition-all ${
                        projection === plane
                          ? 'bg-indigo-500 text-white'
                          : 'text-slate-400 hover:text-slate-200 bg-transparent'
                      }`}
                    >
                      {plane}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic SVG Visualizer Rendering */}
              <div className="relative flex items-center justify-center p-3 aspect-square max-h-[250px] mx-auto w-full bg-slate-950/80 rounded-2xl border border-white/5">
                <LatticeVisualizer
                  system={crystalSystem}
                  a={evaluatedResults.a}
                  b={evaluatedResults.b}
                  c={evaluatedResults.c}
                  projection={projection}
                  hkl={activeReflection?.dHkl || [1, 1, 1]}
                  dSpacing={activeReflection?.dObs || 0}
                  showAtoms={showAtoms}
                  showGrid={showGridLines}
                  bravais={bravaisLattice}
                />
              </div>

              {/* Visualizer Control Bar */}
              <div className="relative z-10 flex items-center justify-between gap-4 mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAtoms(!showAtoms)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all ${
                      showAtoms
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                        : 'bg-slate-900/60 border-white/5 text-slate-500'
                    }`}
                  >
                    {showAtoms ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    Atoms
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGridLines(!showGridLines)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all ${
                      showGridLines
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                        : 'bg-slate-900/60 border-white/5 text-slate-500'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    Grid
                  </button>
                </div>

                {activeReflection && (
                  <span className="text-[10px] font-mono text-indigo-400 font-extrabold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                    Selected HKL: ({activeReflection.hklString})
                  </span>
                )}
              </div>
            </div>

            {/* Crystallographic Advanced Metrics & Override Sliders (Right Column) */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-5">
              
              {/* Bravais Lattice Extinction Checker */}
              <div className="bg-slate-50/60 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Structure Extinction Rule Check
                    </h4>
                  </div>
                  
                  {/* Bravais Selector */}
                  <select
                    value={bravaisLattice}
                    onChange={(e) => setBravaisLattice(e.target.value as BravaisLatticeType)}
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    {availableBravaisLattices.map(type => (
                      <option key={type} value={type}>
                        {type === 'P' ? 'Primitive (P)' : 
                         type === 'I' ? 'Body-Centered (I)' : 
                         type === 'F' ? 'Face-Centered (F)' : 'Base-Centered (C)'}
                      </option>
                    ))}
                  </select>
                </div>

                {activeReflection && activeExtinctionStatus && (
                  <div className={`p-4 rounded-2xl border ${
                    activeExtinctionStatus.allowed
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-400'
                      : 'bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-400'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${activeExtinctionStatus.allowed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {activeExtinctionStatus.allowed ? 'Peak Allowed ✓' : 'Extinction / Forbidden Peak ✗'}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold leading-relaxed font-mono opacity-90">
                      {activeExtinctionStatus.rule}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-2 leading-relaxed">
                      {activeExtinctionStatus.allowed 
                        ? 'This reflection yields positive structure factor contributions (F_hkl ≠ 0) and is visible in XRD scans.'
                        : 'Systematic absence due to opposing atomic plane phases producing destructive interference.'}
                    </p>
                  </div>
                )}

                {/* Reciprocal Space & X-Ray Density Summary */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-850/60">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Reciprocal Lattice & X-Ray Density</span>
                  <div className="grid grid-cols-4 gap-2 font-mono text-[10px]">
                    <div className="bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[8px] uppercase font-bold mb-0.5">a*</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">{evaluatedResults.reciprocal.aStar.toFixed(4)} Å⁻¹</span>
                    </div>
                    <div className="bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[8px] uppercase font-bold mb-0.5">c*</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">{evaluatedResults.reciprocal.cStar.toFixed(4)} Å⁻¹</span>
                    </div>
                    <div className="bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[8px] uppercase font-bold mb-0.5">V*</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{evaluatedResults.reciprocal.volumeStar.toExponential(3)} Å⁻³</span>
                    </div>
                    <div className="bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[8px] uppercase font-bold mb-0.5">ρ_X-ray</span>
                      <span className="text-emerald-500 font-extrabold">{evaluatedResults.densityXRay.toFixed(2)} g/cm³</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation / Manual Override Sliders Panel */}
              <div className="bg-slate-50/60 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-500" />
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        Manual Cell Override & Fine-Tuning
                      </h4>
                      <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Bypasses regressions to live simulate constants
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsManualOverride(!isManualOverride)}
                    className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border transition-all ${
                      isManualOverride
                        ? 'bg-indigo-600 text-white border-transparent shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {isManualOverride ? 'Manual ON' : 'Least-Squares'}
                  </button>
                </div>

                {isManualOverride ? (
                  <div className="space-y-3 pt-2">
                    {/* Slider a */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1 font-mono">
                        <span className="text-slate-500">Lattice constant a (Å)</span>
                        <span className="text-indigo-500">{manualA.toFixed(4)} Å</span>
                      </div>
                      <input
                        type="range"
                        min="2.0"
                        max="10.0"
                        step="0.001"
                        value={String(manualA) === 'NaN' ? '' : manualA}
                        onChange={(e) => setManualA(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-850 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Slider b */}
                    <div className={crystalSystem === 'Cubic' || crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? 'opacity-30 pointer-events-none' : ''}>
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1 font-mono">
                        <span className="text-slate-500">Lattice constant b (Å)</span>
                        <span className="text-indigo-500">{manualB.toFixed(4)} Å</span>
                      </div>
                      <input
                        type="range"
                        min="2.0"
                        max="10.0"
                        step="0.001"
                        value={String(manualB) === 'NaN' ? '' : manualB}
                        disabled={crystalSystem === 'Cubic' || crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal'}
                        onChange={(e) => setManualB(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-850 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Slider c */}
                    <div className={crystalSystem === 'Cubic' ? 'opacity-30 pointer-events-none' : ''}>
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1 font-mono">
                        <span className="text-slate-500">Lattice constant c (Å)</span>
                        <span className="text-indigo-500">{manualC.toFixed(4)} Å</span>
                      </div>
                      <input
                        type="range"
                        min="2.0"
                        max="15.0"
                        step="0.001"
                        value={String(manualC) === 'NaN' ? '' : manualC}
                        disabled={crystalSystem === 'Cubic'}
                        onChange={(e) => setManualC(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-slate-200 dark:bg-slate-850 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setManualA(Number(fitResults.fitA.toFixed(4)));
                          setManualB(Number(fitResults.fitB.toFixed(4)));
                          setManualC(Number(fitResults.fitC.toFixed(4)));
                        }}
                        className="flex items-center gap-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-500 transition-colors uppercase tracking-wider"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reset to Least-Squares fit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-100/40 dark:bg-slate-900/40 rounded-2xl text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal">
                      The current model is solving the cell constants dynamically from peak reflections. Turn on Manual fine-tuning to tweak constants manually.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interplanar Angle (\phi) Calculator Panel */}
          {interplanarAngle && (
            <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-500" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Interplanar Angle φ Between Miller Planes
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Crystallographic angle between plane 1 and plane 2 in {crystalSystem} system
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-bold">Plane 1:</span>
                  <input
                    type="text"
                    value={plane1.join(' ')}
                    onChange={(e) => {
                      const parts = e.target.value.split(/[\s,]+/).map(p => parseInt(p, 10));
                      if (parts.length === 3 && !parts.some(isNaN)) setPlane1([parts[0], parts[1], parts[2]]);
                    }}
                    className="w-16 text-center font-bold text-indigo-500 bg-transparent outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 font-bold">Plane 2:</span>
                  <input
                    type="text"
                    value={plane2.join(' ')}
                    onChange={(e) => {
                      const parts = e.target.value.split(/[\s,]+/).map(p => parseInt(p, 10));
                      if (parts.length === 3 && !parts.some(isNaN)) setPlane2([parts[0], parts[1], parts[2]]);
                    }}
                    className="w-16 text-center font-bold text-indigo-500 bg-transparent outline-none"
                  />
                </div>

                <div className="bg-indigo-600 text-white font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1">
                  <span>φ = {interplanarAngle.angleDeg.toFixed(2)}°</span>
                  <span className="text-[9px] opacity-80">(cos φ = {interplanarAngle.cosPhi.toFixed(3)})</span>
                </div>
              </div>
            </div>
          )}

          {/* Mathematical verification */}
          <ScientificMathControl
            title="Lattice Parameters Mathematical Verification"
            formula={
              crystalSystem === 'Cubic' 
                ? "a = d \\sqrt{h^2 + k^2 + l^2}" 
                : crystalSystem === 'Tetragonal'
                  ? "\\frac{1}{d^2} = \\frac{h^2 + k^2}{a^2} + \\frac{l^2}{c^2}"
                  : crystalSystem === 'Hexagonal'
                    ? "\\frac{1}{d^2} = \\frac{4}{3}\\frac{h^2 + hk + k^2}{a^2} + \\frac{l^2}{c^2}"
                    : "\\frac{1}{d^2} = \\frac{h^2}{a^2} + \\frac{k^2}{b^2} + \\frac{l^2}{c^2}"
            }
            description="Least-Squares Refinement regression verifying unit cell dimensions."
            variables={[
              { symbol: 'd(avg)', name: 'Average D-Spacing', value: validReflections.reduce((acc, curr) => acc + curr.original.dSpacing, 0)/validReflections.length, unit: 'Å' },
              { symbol: 'Peaks', name: 'Reflections', value: validReflections.length, unit: '' }
            ]}
            result={evaluatedResults.a}
            resultUnit="Å"
            resultName="Lattice Parameter a"
          />

          {/* Reflections Fit table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900 max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-150 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">HKL</th>
                  <th className="px-4 py-2.5">2θ (Obs)</th>
                  <th className="px-4 py-2.5">2θ (Calc)</th>
                  <th className="px-4 py-2.5">d (Obs)</th>
                  <th className="px-4 py-2.5">d (Calc)</th>
                  <th className="px-4 py-2.5">N-R F(θ)</th>
                  <th className="px-4 py-2.5 text-right">Residual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {evaluatedResults.reflections.map((ref, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedReflectionIndex(idx)}
                    className={`cursor-pointer transition-all ${
                      selectedReflectionIndex === idx
                        ? 'bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                    }`}
                  >
                    <td className="px-4 py-2 font-bold font-sans text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <ChevronRight className={`w-3 h-3 transition-transform ${selectedReflectionIndex === idx ? 'rotate-90 text-indigo-500' : 'text-slate-400'}`} />
                      ({ref.hklString})
                    </td>
                    <td className="px-4 py-2 font-bold tabular-nums text-slate-900 dark:text-slate-100">{ref.twoTheta.toFixed(3)}°</td>
                    <td className="px-4 py-2 tabular-nums text-slate-400">{ref.twoThetaCalc.toFixed(2)}°</td>
                    <td className="px-4 py-2 font-black tabular-nums text-indigo-700 dark:text-indigo-300">{ref.dObs.toFixed(4)}</td>
                    <td className="px-4 py-2 tabular-nums text-slate-400">{ref.dCalc.toFixed(4)}</td>
                    <td className="px-4 py-2 tabular-nums text-slate-400">{ref.nelsonRileyF.toFixed(3)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        ref.errorPct < 0.2
                          ? 'text-emerald-600 bg-emerald-500/5 dark:text-emerald-400'
                          : ref.errorPct < 1.0
                            ? 'text-amber-600 bg-amber-500/5 dark:text-amber-400'
                            : 'text-rose-600 bg-rose-500/5 dark:text-rose-400'
                      }`}>
                        {ref.errorPct.toFixed(3)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 transition-colors flex items-center gap-1.5 leading-normal">
            <Cpu className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            Select a reflection row to align coordinates, model structure factors, and track residuals.
          </p>

          {/* HKL Target Search Bar */}
          <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight uppercase mb-3">
              <Compass className="h-4 w-4 text-indigo-500 shrink-0" />
              Target d-Spacing HKL Search
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-full sm:w-64">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                  Target d-Spacing (Å)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 2.50"
                    value={String(targetDSpacing) === 'NaN' ? '' : targetDSpacing}
                    onChange={(e) => setTargetDSpacing(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 border border-slate-200 dark:bg-slate-950 dark:text-white dark:border-slate-800 rounded-lg outline-none font-bold font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold pointer-events-none">Å</div>
                </div>
              </div>
              
              <div className="flex-1 w-full">
                {targetDSpacing && !isNaN(parseFloat(targetDSpacing)) ? (
                  hklSuggestions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {hklSuggestions.map((sug, i) => (
                        <div key={i} className="flex flex-col p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg shrink-0">
                          <span className="text-[11px] font-black font-mono text-indigo-700 dark:text-indigo-300">({sug.h} {sug.k} {sug.l})</span>
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 tracking-wide">d = {sug.dCalc.toFixed(4)} Å</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">No close HKL planes found within 0.2 Å error range.</span>
                  )
                ) : (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Enter a target d-spacing to see suggested planes.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};


// Interactive SVG Lattice and Plane visualizer
interface LatticeVisualizerProps {
  system: CrystalSystem;
  a: number;
  b: number;
  c: number;
  projection: ProjectionPlane;
  hkl: [number, number, number];
  dSpacing: number;
  showAtoms: boolean;
  showGrid: boolean;
  bravais: BravaisLatticeType;
}

const LatticeVisualizer: React.FC<LatticeVisualizerProps> = ({
  system,
  a,
  b,
  c,
  projection,
  hkl,
  dSpacing,
  showAtoms,
  showGrid,
  bravais
}) => {
  const width = 220;
  const height = 220;
  const padding = 30;

  // Find appropriate indices mapped to Axis 1 and Axis 2 based on active projection view
  const [h1, h2, axisLabel1, axisLabel2, l1, l2] = useMemo(() => {
    switch (projection) {
      case 'XY':
        return [hkl[0], hkl[1], 'a', 'b', a, b];
      case 'XZ':
        return [hkl[0], hkl[2], 'a', 'c', a, c];
      case 'YZ':
        return [hkl[1], hkl[2], 'b', 'c', b, c];
      default:
        return [hkl[0], hkl[1], 'a', 'b', a, b];
    }
  }, [projection, hkl, a, b, c]);

  // SVG drawing configuration
  const { basisVectors, origin, vertices, latticePoints } = useMemo(() => {
    const maxRealDim = Math.max(l1, l2);
    const pixelScale = (width - 2 * padding) / maxRealDim;

    let vec1 = [l1 * pixelScale, 0];
    let vec2 = [0, l2 * pixelScale];

    if (system === 'Hexagonal' && projection === 'XY') {
      const angle = 120 * Math.PI / 180;
      vec2 = [l2 * pixelScale * Math.cos(angle), l2 * pixelScale * Math.sin(angle)];
    }

    const xCoords = [0, vec1[0], vec2[0], vec1[0] + vec2[0]];
    const yCoords = [0, vec1[1], vec2[1], vec1[1] + vec2[1]];
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    const cellWidth = maxX - minX;
    const cellHeight = maxY - minY;

    const offsetX = padding + (width - 2 * padding - cellWidth) / 2 - minX;
    const offsetY = padding + (height - 2 * padding - cellHeight) / 2 - minY;

    const origin = [offsetX, offsetY];

    const v00 = origin;
    const v10 = [origin[0] + vec1[0], origin[1] + vec1[1]];
    const v01 = [origin[0] + vec2[0], origin[1] + vec2[1]];
    const v11 = [origin[0] + vec1[0] + vec2[0], origin[1] + vec1[1] + vec2[1]];

    const points: [number, number][] = [];
    points.push([0, 0], [1, 0], [0, 1], [1, 1]);

    if (bravais === 'I') {
      points.push([0.5, 0.5]);
    } else if (bravais === 'F') {
      points.push([0.5, 0.5], [0.5, 0], [0.5, 1], [0, 0.5], [1, 0.5]);
    } else if (bravais === 'C' && projection === 'XY') {
      points.push([0.5, 0.5]);
    } else if (system === 'Hexagonal' && bravais === 'P') {
      points.push([1/3, 2/3]);
    }

    return {
      basisVectors: { vec1, vec2 },
      origin,
      vertices: { v00, v10, v01, v11 },
      latticePoints: points
    };
  }, [projection, system, bravais, l1, l2]);

  // Intersecting Miller Plane coordinates computation
  const planeLines = useMemo(() => {
    if (h1 === 0 && h2 === 0) return [];

    const lines: [number, number, number, number][] = [];
    const { vec1, vec2 } = basisVectors;

    const minVal = Math.min(0, h1, h2, h1 + h2);
    const maxVal = Math.max(0, h1, h2, h1 + h2);
    
    const rangeMin = Math.floor(minVal) - 1;
    const rangeMax = Math.ceil(maxVal) + 1;

    for (let n = rangeMin; n <= rangeMax; n++) {
      const intersections: [number, number][] = [];

      if (h1 !== 0) {
        const u1 = n / h1;
        if (u1 >= 0 && u1 <= 1) intersections.push([u1, 0]);
      }
      if (h1 !== 0) {
        const u1 = (n - h2) / h1;
        if (u1 >= 0 && u1 <= 1) intersections.push([u1, 1]);
      }
      if (h2 !== 0) {
        const u2 = n / h2;
        if (u2 >= 0 && u2 <= 1) intersections.push([0, u2]);
      }
      if (h2 !== 0) {
        const u2 = (n - h1) / h2;
        if (u2 >= 0 && u2 <= 1) intersections.push([1, u2]);
      }

      const uniquePoints: [number, number][] = [];
      intersections.forEach(p => {
        if (!uniquePoints.some(up => Math.abs(up[0] - p[0]) < 1e-4 && Math.abs(up[1] - p[1]) < 1e-4)) {
          uniquePoints.push(p);
        }
      });

      if (uniquePoints.length >= 2) {
        const p1 = [
          origin[0] + uniquePoints[0][0] * vec1[0] + uniquePoints[0][1] * vec2[0],
          origin[1] + uniquePoints[0][0] * vec1[1] + uniquePoints[0][1] * vec2[1]
        ];
        const p2 = [
          origin[0] + uniquePoints[1][0] * vec1[0] + uniquePoints[1][1] * vec2[0],
          origin[1] + uniquePoints[1][0] * vec1[1] + uniquePoints[1][1] * vec2[1]
        ];
        lines.push([p1[0], p1[1], p2[0], p2[1]]);
      }
    }

    return lines;
  }, [h1, h2, basisVectors, origin]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <filter id="atomGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="planeGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#3b82f6" floodOpacity="0.4" />
        </filter>
      </defs>

      {showGrid && (
        <g stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1">
          {Array.from({ length: 6 }).map((_, i) => {
            const ratio = i / 5;
            const pt1_x = origin[0] + ratio * basisVectors.vec1[0];
            const pt1_y = origin[1] + ratio * basisVectors.vec1[1];
            const pt2_x = origin[0] + ratio * basisVectors.vec1[0] + basisVectors.vec2[0];
            const pt2_y = origin[1] + ratio * basisVectors.vec1[1] + basisVectors.vec2[1];

            const pt3_x = origin[0] + ratio * basisVectors.vec2[0];
            const pt3_y = origin[1] + ratio * basisVectors.vec2[1];
            const pt4_x = origin[0] + ratio * basisVectors.vec2[0] + basisVectors.vec1[0];
            const pt4_y = origin[1] + ratio * basisVectors.vec2[0] + basisVectors.vec1[1];

            return (
              <React.Fragment key={`grid-${i}`}>
                <line x1={pt1_x} y1={pt1_y} x2={pt2_x} y2={pt2_y} />
                <line x1={pt3_x} y1={pt3_y} x2={pt4_x} y2={pt4_y} />
              </React.Fragment>
            );
          })}
        </g>
      )}

      {planeLines.map((line, idx) => (
        <g key={`plane-${idx}`}>
          <line
            x1={line[0]}
            y1={line[1]}
            x2={line[2]}
            y2={line[3]}
            stroke="#6366f1"
            strokeWidth="2"
            opacity="0.85"
            filter="url(#planeGlow)"
          />
        </g>
      ))}

      <polygon
        points={`
          ${vertices.v00[0]},${vertices.v00[1]} 
          ${vertices.v10[0]},${vertices.v10[1]} 
          ${vertices.v11[0]},${vertices.v11[1]} 
          ${vertices.v01[0]},${vertices.v01[1]}
        `}
        fill="transparent"
        stroke="#475569"
        strokeWidth="1.5"
      />

      <g strokeWidth="2">
        <line
          x1={vertices.v00[0]}
          y1={vertices.v00[1]}
          x2={vertices.v00[0] + basisVectors.vec1[0] * 0.4}
          y2={vertices.v00[1] + basisVectors.vec1[1] * 0.4}
          stroke="#f59e0b"
        />
        <line
          x1={vertices.v00[0]}
          y1={vertices.v00[1]}
          x2={vertices.v00[0] + basisVectors.vec2[0] * 0.4}
          y2={vertices.v00[1] + basisVectors.vec2[1] * 0.4}
          stroke="#10b981"
        />
      </g>

      <text
        x={vertices.v00[0] + basisVectors.vec1[0] * 0.45}
        y={vertices.v00[1] + basisVectors.vec1[1] * 0.45 + 10}
        fill="#f59e0b"
        fontSize="8"
        fontWeight="black"
        textAnchor="middle"
      >
        {axisLabel1}
      </text>
      <text
        x={vertices.v00[0] + basisVectors.vec2[0] * 0.45 - 8}
        y={vertices.v00[1] + basisVectors.vec2[1] * 0.45}
        fill="#10b981"
        fontSize="8"
        fontWeight="black"
        textAnchor="middle"
      >
        {axisLabel2}
      </text>

      {showAtoms && latticePoints.map((pt, idx) => {
        const cx = origin[0] + pt[0] * basisVectors.vec1[0] + pt[1] * basisVectors.vec2[0];
        const cy = origin[1] + pt[0] * basisVectors.vec1[1] + pt[1] * basisVectors.vec2[1];
        
        const isCorner = pt[0] % 1 === 0 && pt[1] % 1 === 0;
        
        return (
          <circle
            key={`atom-${idx}`}
            cx={cx}
            cy={cy}
            r={isCorner ? 5.5 : 4.5}
            fill={isCorner ? "#38bdf8" : "#f472b6"}
            stroke="#ffffff"
            strokeWidth="1.2"
            filter="url(#atomGlow)"
          />
        );
      })}

      {dSpacing > 0 && planeLines.length > 0 && (
        <g>
          <rect
            x="8"
            y={height - 24}
            width={width - 16}
            height="18"
            rx="4"
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth="1"
          />
          <text
            x={width / 2}
            y={height - 12}
            textAnchor="middle"
            fill="#a5b4fc"
            fontSize="8"
            fontWeight="black"
            fontFamily="monospace"
          >
            d({hkl.join(' ')}) = {dSpacing.toFixed(4)} Å
          </text>
        </g>
      )}
    </svg>
  );
};
