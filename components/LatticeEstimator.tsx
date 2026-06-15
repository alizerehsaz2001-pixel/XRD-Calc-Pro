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
  Info
} from 'lucide-react';
import { BraggResult } from '../types';
import { useSettings } from './SettingsContext';

interface LatticeEstimatorProps {
  results: BraggResult[];
}

type CrystalSystem = 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Orthorhombic';

interface FitReflection {
  twoTheta: number;
  dObs: number;
  dHkl: [number, number, number];
  hklString: string;
  dCalc: number;
  twoThetaCalc: number;
  errorPct: number;
}

// Robust helper to parse individual HKL strings like "111", "(1 1 1)", "2, 0, 0", "-1 1 0"
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

export const LatticeEstimator: React.FC<LatticeEstimatorProps> = ({ results }) => {
  const { t } = useTranslation();
  const { precision } = useSettings();
  
  const [crystalSystem, setCrystalSystem] = useState<CrystalSystem>('Cubic');
  const [selectedReflectionIndex, setSelectedReflectionIndex] = useState<number>(0);
  const [targetDSpacing, setTargetDSpacing] = useState<string>('');

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

  // Keep selected index in bound
  useEffect(() => {
    if (selectedReflectionIndex >= validReflections.length) {
      setSelectedReflectionIndex(Math.max(0, validReflections.length - 1));
    }
  }, [validReflections, selectedReflectionIndex]);

  // Least Squares Solvers for Cell Refinement
  const fitResults = useMemo(() => {
    if (validReflections.length === 0) return null;

    // We fit depending on selected crystal system
    let a = 0;
    let b = 0;
    let c = 0;
    let errorMsg = '';
    let hasDiverged = false;

    try {
      if (crystalSystem === 'Cubic') {
        // 1/d^2 = (h^2 + k^2 + l^2) / a^2
        // Find best 'a' to minimize absolute residuals or matching average sum
        // a_i = d_obs * sqrt(h^2 + k^2 + l^2)
        const aVals = validReflections.map(rf => {
          const [h, k, l] = rf.hkl;
          const mult = Math.sqrt(h * h + k * k + l * l);
          return rf.original.dSpacing * mult;
        });
        
        a = aVals.reduce((sum, v) => sum + v, 0) / aVals.length;
        b = a;
        c = a;
      }
      else if (crystalSystem === 'Tetragonal') {
        // 1/d^2 = (h^2 + k^2)/a^2 + l^2/c^2
        // Let x1 = h^2 + k^2, x2 = l^2, y = 1/d^2. Solve for u=1/a^2, w=1/c^2 using linear least squares
        if (validReflections.length < 2) {
          errorMsg = 'At least 2 distinct reflections with varied hkl structures are required to fit Tetragonal parameters.';
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
              a = 1 / Math.sqrt(u);
              b = a;
              c = 1 / Math.sqrt(w);
            }
          }
        }
      }
      else if (crystalSystem === 'Hexagonal') {
        // 1/d^2 = 4/3 * (h^2 + hk + k^2)/a^2 + l^2/c^2
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
              a = 1 / Math.sqrt(u);
              b = a;
              c = 1 / Math.sqrt(w);
            }
          }
        }
      }
      else if (crystalSystem === 'Orthorhombic') {
        // 1/d^2 = h^2/a^2 + k^2/b^2 + l^2/c^2
        // We have 3 unknowns: u = 1/a^2, v = 1/b^2, w = 1/c^2. Solve A β = B with Cramer's Rule
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
          
          // Determinant of A
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
                       a02 * (a10 * b2 - b1 * a20);
                       
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
              a = 1 / Math.sqrt(u);
              b = 1 / Math.sqrt(v);
              c = 1 / Math.sqrt(w);
            }
          }
        }
      }
    } catch (e: any) {
      errorMsg = 'Calculation error: ' + e.message;
      hasDiverged = true;
    }

    if (hasDiverged) {
      return { hasDiverged: true, errorMsg, reflections: [] };
    }

    // Now calculate d_calculated, 2theta_calculated, and error for each reflection
    const fittedReflections: FitReflection[] = validReflections.map(rf => {
      const [h, k, l] = rf.hkl;
      let dCalc = 0;
      
      if (crystalSystem === 'Cubic') {
        dCalc = a / Math.sqrt(h * h + k * k + l * l);
      } else if (crystalSystem === 'Tetragonal') {
        const term = (h * h + k * k) / (a * a) + (l * l) / (c * c);
        dCalc = 1 / Math.sqrt(term);
      } else if (crystalSystem === 'Hexagonal') {
        const term = (4 / 3) * (h * h + h * k + k * k) / (a * a) + (l * l) / (c * c);
        dCalc = 1 / Math.sqrt(term);
      } else if (crystalSystem === 'Orthorhombic') {
        const term = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
        dCalc = 1 / Math.sqrt(term);
      }

      // Reconstruct wavelength to map back to 2theta
      // d = lambda / (2 * sin(theta)) => sin(theta) = lambda / (2 * d)
      // theta = arcsin(lambda / (2 * d))
      // 2theta = 2 * arcsin(lambda / (2*d))
      // Find peak original wavelength
      const wl = rf.original.sinThetaOverLambda 
        ? Math.sin((rf.original.twoTheta / 2) * (Math.PI / 180)) / rf.original.sinThetaOverLambda 
        : 1.5406;
      
      const ratio = wl / (2 * dCalc);
      const twoThetaCalc = ratio < 1 
        ? (2 * Math.asin(ratio)) * (180 / Math.PI) 
        : 180.0;
        
      const errorPct = Math.abs(rf.original.dSpacing - dCalc) / rf.original.dSpacing * 100;

      return {
        twoTheta: rf.original.twoTheta,
        dObs: rf.original.dSpacing,
        dHkl: rf.hkl,
        hklString: rf.original.hkl || '',
        dCalc,
        twoThetaCalc,
        errorPct
      };
    });

    const averageError = fittedReflections.reduce((sum, r) => sum + r.errorPct, 0) / fittedReflections.length;
    
    // Calculates volume of the unit cell
    let volume = 0;
    if (crystalSystem === 'Cubic') volume = a * a * a;
    else if (crystalSystem === 'Tetragonal') volume = a * a * c;
    else if (crystalSystem === 'Hexagonal') volume = (Math.sqrt(3) / 2) * a * a * c; // Hexagonal prism volume
    else if (crystalSystem === 'Orthorhombic') volume = a * b * c;

    return {
      hasDiverged: false,
      a,
      b,
      c,
      volume,
      averageError,
      reflections: fittedReflections
    };

  }, [validReflections, crystalSystem]);

  const hklSuggestions = useMemo(() => {
    if (!fitResults || fitResults.hasDiverged) return [];
    const target = parseFloat(targetDSpacing);
    if (isNaN(target) || target <= 0) return [];

    const { a, b, c } = fitResults;
    const results: { h: number, k: number, l: number, dCalc: number, error: number }[] = [];
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
          } else if (crystalSystem === 'Orthorhombic') {
            const term = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
            dCalc = 1 / Math.sqrt(term);
          }

          const error = Math.abs(dCalc - target);
          if (error < 0.2) {
            results.push({ h, k, l, dCalc, error });
          }
        }
      }
    }

    results.sort((r1, r2) => r1.error - r2.error);
    return results.slice(0, 5);
  }, [targetDSpacing, fitResults, crystalSystem]);



  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight uppercase">
            <Boxes className="h-5 w-5 text-indigo-500 shrink-0" />
            Cell Refinement & Lattice Solver
          </h2>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            Lattice Parameters Fit using Miller Indexes
          </p>
        </div>

        {/* Crystal System Tabs Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
          {(['Cubic', 'Tetragonal', 'Hexagonal', 'Orthorhombic'] as CrystalSystem[]).map(sys => (
            <button
              key={sys}
              onClick={() => setCrystalSystem(sys)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all border-none ${
                crystalSystem === sys
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent'
              }`}
            >
              {sys}
            </button>
          ))}
        </div>
      </div>

      {validReflections.length === 0 ? (
        <div className="p-8 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <Info className="h-8 w-8 text-slate-400 mb-2.5 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">Miller Indices Required</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-md leading-relaxed">
            Please assign Miller Indices (e.g., 111, 200, 220) to your 2θ peaks in the input panel to activate live least-squares lattice cell refinements.
          </p>
        </div>
      ) : fitResults && fitResults.hasDiverged ? (
        <div className="p-5 bg-rose-50 dark:bg-rose-950/15 text-rose-800 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-start gap-3">
          <HelpCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Refinement Incompatible</h4>
            <p className="text-xs mt-1 leading-normal opacity-90">{fitResults.errorMsg}</p>
          </div>
        </div>
      ) : fitResults ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Lattice param a */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner flex flex-col justify-center">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Constant a</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {fitResults.a.toFixed(Math.min(precision + 1, 5))}
                </span>
                <span className="text-[10px] font-black text-slate-400">Å</span>
              </div>
            </div>

            {/* Lattice param b */}
            <div className={`bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner flex flex-col justify-center transition-all ${
              crystalSystem === 'Cubic' || crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' ? 'opacity-40 select-none' : ''
            }`}>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Constant b</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {fitResults.b.toFixed(Math.min(precision + 1, 5))}
                </span>
                <span className="text-[10px] font-black text-slate-400">Å</span>
              </div>
            </div>

            {/* Lattice param c */}
            <div className={`bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner flex flex-col justify-center transition-all ${
              crystalSystem === 'Cubic' ? 'opacity-40 select-none' : ''
            }`}>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Constant c</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {fitResults.c.toFixed(Math.min(precision + 1, 5))}
                </span>
                <span className="text-[10px] font-black text-slate-400">Å</span>
              </div>
            </div>

            {/* Cell Volume */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner flex flex-col justify-center">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Cell Volume</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {fitResults.volume.toFixed(Math.min(precision, 4))}
                </span>
                <span className="text-[10px] font-black text-indigo-400">Å³</span>
              </div>
            </div>

            {/* Fit R-factor Quality */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-inner flex flex-col justify-center col-span-2 sm:col-span-1">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Diffraction Residual (GoF)</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black font-mono px-2 py-0.5 rounded-full ${
                  fitResults.averageError < 0.2
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : fitResults.averageError < 1.0
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  {fitResults.averageError.toFixed(4)}%
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                  {fitResults.averageError < 0.2 ? 'Excellent' : fitResults.averageError < 1.0 ? 'Acceptable' : 'Unfit'}
                </span>
              </div>
            </div>
          </div>

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
                  <th className="px-4 py-2.5 text-right">Residual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {fitResults.reflections.map((ref, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedReflectionIndex(idx)}
                    className={`cursor-pointer transition-all ${
                      selectedReflectionIndex === idx
                        ? 'bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'
                    }`}
                  >
                    <td className="px-4 py-2 font-bold font-sans text-indigo-600 dark:text-indigo-400">
                      ({ref.hklString})
                    </td>
                    <td className="px-4 py-2 font-bold tabular-nums text-slate-900 dark:text-slate-100">{ref.twoTheta.toFixed(3)}°</td>
                    <td className="px-4 py-2 tabular-nums text-slate-400">{ref.twoThetaCalc.toFixed(2)}°</td>
                    <td className="px-4 py-2 font-black tabular-nums text-indigo-700 dark:text-indigo-300">{ref.dObs.toFixed(4)}</td>
                    <td className="px-4 py-2 tabular-nums text-slate-400">{ref.dCalc.toFixed(4)}</td>
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
            Select a reflection row to track d-spacings and calculated angle residuals in real-time.
          </p>

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
                    value={targetDSpacing}
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
